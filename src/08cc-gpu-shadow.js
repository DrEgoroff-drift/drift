/* ══════════════ GPU-холст, v2: тень (docs/DESIGN-gpu.md, «GPU canvas») ══════════════
   shadowBlur/shadowColor/shadowOffset как у 2D: фигура рисуется отдельно (без клипа, source-over,
   своей краской — её альфа и есть слой тени), слой размывается гауссом σ = shadowBlur/2 px холста
   (преобразование на тень не действует — как у 2D), смещается и ложится в основной проход
   цветом тени под клипом и смешением команды, а поверх — сама фигура. Слой считается в рамке
   фигуры + 3σ; все слои готовятся до основного прохода — тень не зависит от того, что на холсте.
   Подряд идущие команды с одной тенью — один слой, «серия» (условия точности — в 08ca у shade).
   Слои выпечки — рамки одного атласа из пула (08ca): фигуры всех слоёв — один проход MSAA, размытие —
   два прохода на весь атлас; новых текстур нет.
   Чего нет: тень у «неограниченных» смешений (copy, source-in, destination-in) — громко; часть
   фигуры за краем холста тени не даёт. */
GcCtx.prototype._sh=function(op){
  const b=this.shadowBlur>0&&isFinite(this.shadowBlur)?+this.shadowBlur:0,x=+this.shadowOffsetX||0,y=+this.shadowOffsetY||0;
  if(!b&&!x&&!y)return null;
  const c=gcColor(this.shadowColor);if(!(c[3]>0))return null;
  if(GC_OPS[op]&&(GC_OPS[op].u||GC_OPS[op].bk))throw gcNo("тень со смешением "+op);
  return {c:[c[0]*c[3],c[1]*c[3],c[2]*c[3],c[3]],b,x,y};};

/* размытие: проход по оси; o.xy — сдвиг окна в источнике, o.zw — ось; s.x — σ, s.y — радиус,
   s.z — канал (0 — альфа слоя rgba, 1 — r промежуточного); r — рамка слоя в источнике (за ней ноль) */
const GC_BLUR_WGSL=`
struct BU{o:vec4f,s:vec4f,r:vec4f};
@group(0) @binding(0) var<uniform> bu:BU;
@group(0) @binding(1) var src:texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
fn erf(x:f32)->f32{let a=abs(x);let t=1./(1.+.3275911*a);
  return sign(x)*(1.-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*exp(-a*a));}
@fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f{
  let c=vec2i(floor(p.xy+bu.o.xy));let dr=vec2i(bu.o.zw);let R=i32(bu.s.y);let k=1./max(bu.s.x*1.41421356,1e-4);
  var t=0.;var w=0.;
  /* вес — гаусс, проинтегрированный по пикселю (как Skia: у σ ½ дисперсия 2D 0.33 = σ² + 1/12, выборка в центрах давала 0.21) */
  for(var i=-R;i<=R;i++){let g=erf((f32(i)+.5)*k)-erf((f32(i)-.5)*k);w+=g;let q=c+dr*i;
    if(all(q>=vec2i(bu.r.xy))&&all(q<vec2i(bu.r.zw))){let v=textureLoad(src,q,0);t+=g*select(v.a,v.r,bu.s.z>.5);}}
  return vec4f(t/w,0.,0.,0.);}`;
function gcBlurPipe(){
  if(GPU.lay["gc.blur"])return GPU.lay["gc.blur"];
  return GPU.lay["gc.blur"]=gpuPipeline("gc.blur",gcBlurDesc);}
function gcBlurDesc(){const m=gpuShader(GC_BLUR_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"r8unorm"}]},primitive:{topology:"triangle-list"}};}
/* слои тени выпечки — полки одного атласа: SH — {sd (вызовы фигуры), x0,y0,w,h (рамка, px выпечки), sg, R, k};
   ставит s.ax, s.ay и берёт из пула набор атласа (MSAA, трафарет, resolve, два r8 размытия) */
function gcShadowPack(SH){
  let area=0,mw=0;for(const s of SH){area+=s.w*s.h;mw=Math.max(mw,s.w);}
  const AW=Math.max(mw,Math.ceil(Math.sqrt(area)*1.15));let x=0,y=0,rh=0;
  for(const s of [...SH].sort((a,b)=>b.h-a.h)){if(x+s.w>AW){x=0;y+=rh;rh=0;}s.ax=x;s.ay=y;x+=s.w;rh=Math.max(rh,s.h);}
  const T=gcPoolSet("shadow",AW,y+rh);
  return {ms:T[0],st:T[1],rs:T[2],a1:T[3],a2:T[4],v2:T[4].createView()};
}
/* run(pass, вызовы, uniform) рисует фигуру теми же конвейерами, что основной проход, со сдвигом рамки
   в её место атласа. На слой 768 байт uniform (смещения кратны 256): 0 — сдвиг фигуры (размер цели, k,
   угол рамки минус место), 256 — размытие по x, 512 — по y */
function gcShadowPasses(enc,SH,A,run){
  const d=GPU.dev,TW=A.ms.width,TH=A.ms.height,BP=gcBlurPipe(),u=new Float32Array(SH.length*192);
  SH.forEach((s,i)=>{const r=[s.ax,s.ay,s.ax+s.w,s.ay+s.h];
    u.set([TW,TH,s.k,0,s.x0-s.ax,s.y0-s.ay,0,0],i*192);u.set([0,0,1,0,s.sg,s.R,0,0,...r],i*192+64);u.set([0,0,0,1,s.sg,s.R,1,0,...r],i*192+128);});
  const ub=gcPoolBuf("shadow",GPUBufferUsage.UNIFORM,u);
  const p=enc.beginRenderPass({colorAttachments:[{view:A.ms.createView(),resolveTarget:A.rs.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"discard"}],
    depthStencilAttachment:{view:A.st.createView(),stencilLoadOp:"clear",stencilClearValue:0x80,stencilStoreOp:"discard"}});
  SH.forEach((s,i)=>{p.setScissorRect(s.ax,s.ay,s.w,s.h);run(p,s.sd,{buffer:ub,offset:i*768,size:32});});p.end();
  const blur=(dst,src,uo)=>{const q=enc.beginRenderPass({colorAttachments:[{view:dst.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]}),sv=src.createView();
    q.setPipeline(BP);
    SH.forEach((s,i)=>{q.setScissorRect(s.ax,s.ay,s.w,s.h);q.setBindGroup(0,d.createBindGroup({layout:BP.getBindGroupLayout(0),
      entries:[{binding:0,resource:{buffer:ub,offset:i*768+uo,size:48}},{binding:1,resource:sv}]}));q.draw(3);});q.end();};
  blur(A.a1,A.rs,256);blur(A.a2,A.a1,512);
}
