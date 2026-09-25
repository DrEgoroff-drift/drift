/* ══════════════ GPU-холст, v2: тень (docs/DESIGN-gpu.md, «GPU canvas») ══════════════
   shadowBlur/shadowColor/shadowOffset как у 2D: фигура рисуется отдельно (без клипа, source-over,
   своей краской — её альфа и есть слой тени), слой размывается гауссом σ = shadowBlur/2 px холста
   (преобразование на тень не действует — как у 2D), смещается и ложится в основной проход
   цветом тени под клипом и смешением команды, а поверх — сама фигура. Слой считается в рамке
   фигуры + 3σ; все слои готовятся до основного прохода — тень не зависит от того, что на холсте.
   Подряд идущие команды с одной тенью — один слой, «серия» (условия точности — в 08ca у shade);
   цель слоя — размером с самую крупную рамку, а не с выпечку: очистка и resolve платятся за рамку.
   Чего нет: тень у «неограниченных» смешений (copy, source-in, destination-in) — громко; часть
   фигуры за краем холста тени не даёт. */
GcCtx.prototype._sh=function(op){
  const b=this.shadowBlur>0&&isFinite(this.shadowBlur)?+this.shadowBlur:0,x=+this.shadowOffsetX||0,y=+this.shadowOffsetY||0;
  if(!b&&!x&&!y)return null;
  const c=gcColor(this.shadowColor);if(!(c[3]>0))return null;
  if(GC_OPS[op]&&GC_OPS[op].u)throw gcNo("тень со смешением "+op);
  return {c:[c[0]*c[3],c[1]*c[3],c[2]*c[3],c[3]],b,x,y};};

/* размытие: проход по оси; o.xy — сдвиг окна в источнике, o.zw — ось; s.x — σ, s.y — радиус,
   s.z — канал (0 — альфа слоя rgba, 1 — r промежуточного) */
const GC_BLUR_WGSL=`
struct BU{o:vec4f,s:vec4f};
@group(0) @binding(0) var<uniform> bu:BU;
@group(0) @binding(1) var src:texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
fn erf(x:f32)->f32{let a=abs(x);let t=1./(1.+.3275911*a);
  return sign(x)*(1.-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*exp(-a*a));}
@fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f{
  let c=vec2i(floor(p.xy+bu.o.xy));let n=vec2i(textureDimensions(src));let dr=vec2i(bu.o.zw);let R=i32(bu.s.y);let k=1./max(bu.s.x*1.41421356,1e-4);
  var t=0.;var w=0.;
  /* вес — гаусс, проинтегрированный по пикселю (как Skia: у σ ½ дисперсия 2D 0.33 = σ² + 1/12, выборка в центрах давала 0.21) */
  for(var i=-R;i<=R;i++){let g=erf((f32(i)+.5)*k)-erf((f32(i)-.5)*k);w+=g;let q=c+dr*i;
    if(all(q>=vec2i(0))&&all(q<n)){let v=textureLoad(src,q,0);t+=g*select(v.a,v.r,bu.s.z>.5);}}
  return vec4f(t/w,0.,0.,0.);}`;
function gcBlurPipe(){
  if(GPU.lay["gc.blur"])return GPU.lay["gc.blur"];const m=GPU.dev.createShaderModule({code:GC_BLUR_WGSL});
  return GPU.lay["gc.blur"]=GPU.dev.createRenderPipeline({layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"r8unorm"}]},primitive:{topology:"triangle-list"}});}
/* слои теней выпечки: SH — {sd (вызовы фигуры), x0,y0,w,h (рамка, px выпечки), sg, R, k, t1, t2 (r8 w×h)};
   run(pass, вызовы, uniform) рисует фигуру теми же конвейерами, что основной проход, со сдвигом на угол рамки */
function gcShadowPasses(enc,SH,run){
  const d=GPU.dev,U=GPUTextureUsage,trash=GPU.trash;let MW=1,MH=1;for(const s of SH){MW=Math.max(MW,s.w);MH=Math.max(MH,s.h);}
  const ms=d.createTexture({size:[MW,MH],sampleCount:4,format:"rgba8unorm",usage:U.RENDER_ATTACHMENT});
  const st=d.createTexture({size:[MW,MH],sampleCount:4,format:"stencil8",usage:U.RENDER_ATTACHMENT});
  const rs=d.createTexture({size:[MW,MH],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});trash.push(ms,st,rs);
  const BP=gcBlurPipe(),ub=d.createBuffer({size:SH.length*768,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),u=new Float32Array(SH.length*192);
  trash.push(ub);
  /* на слой 768 байт (смещения uniform кратны 256): 0 — размытие по x, 256 — по y, 512 — сдвиг фигуры
     (размер цели, k, угол рамки) */
  SH.forEach((s,i)=>{u.set([0,0,1,0,s.sg,s.R,0,0],i*192);u.set([0,0,0,1,s.sg,s.R,1,0],i*192+64);u.set([MW,MH,s.k,0,s.x0,s.y0,0,0],i*192+128);});
  d.queue.writeBuffer(ub,0,u);
  const blur=(dst,src,off)=>{const p=enc.beginRenderPass({colorAttachments:[{view:dst.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});
    p.setPipeline(BP);p.setBindGroup(0,d.createBindGroup({layout:BP.getBindGroupLayout(0),
      entries:[{binding:0,resource:{buffer:ub,offset:off,size:32}},{binding:1,resource:src.createView()}]}));p.draw(3);p.end();};
  SH.forEach((s,i)=>{
    const p=enc.beginRenderPass({colorAttachments:[{view:ms.createView(),resolveTarget:rs.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"discard"}],
      depthStencilAttachment:{view:st.createView(),stencilLoadOp:"clear",stencilClearValue:0x80,stencilStoreOp:"discard"}});
    p.setScissorRect(0,0,s.w,s.h);run(p,s.sd,{buffer:ub,offset:i*768+512,size:32});p.end();
    blur(s.t1,rs,i*768);blur(s.t2,s.t1,i*768+256);});
}
