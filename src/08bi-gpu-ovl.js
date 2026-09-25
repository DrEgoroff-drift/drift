/* ══════════════ фишки у кромки и подписи мира — на видеокарте (docs/DESIGN-gpu.md §G, «Chips and labels») ══════════════
   Один WebGPU-холст #ovl на родном DPR (как #hud: текст приборов резкий, правило 15/n), поверх #hud.
   Кадр с фишками или подписями — один проход в кадровый энкодер: плашка и обвод — прямоугольники с
   точным покрытием пикселя (то же сглаживание, что у 2D), стрелка — треугольник с аналитическим краем,
   текст — маски r8 из своего атласа. Подписи ложатся первыми, фишки — поверх (как слои #labels/#chips).
   Текст без растра в ровном полёте: строка режется на цифры и прочее; прочее («ЦИЦИИН · ») — одна
   строка атласа, цифры — по глифу с шагом мерки «0» (у моноширинного он точный) и фазой ¼ пикселя
   устройства; ширина для выравнивания — сумма мерок кусков, все из кэша. Атлас — 4 слоя 1024²,
   вытесняется слой, которого дольше всех не касались. Нет фишек и подписей — слой спрятан
   (display:none): композитор его не сводит */
const OVL={cv:null,cx:null,dev:null,P:null,lq:[],cq:[],on:false,fl:false,fno:0,ras:0,led:null,
  lab:new Map(),chip:new Map(),f:null,buf:null,bg:null,
  A:{dev:null,tex:null,view:null,L:4,S:1024,pg:[],map:new Map(),cur:0,ev:0,thr:0}};
const OVL_N=20;   /* чисел на примитив: рамка, цвет, (вид, слой, тексель), треугольник */
const OVL_WGSL=`
struct IO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) b:vec4f,@location(1) @interpolate(flat) c:vec4f,
  @location(2) @interpolate(flat) m:vec4f,@location(3) @interpolate(flat) t0:vec4f,@location(4) @interpolate(flat) t1:vec4f};
@group(0) @binding(0) var<storage,read> Q:array<vec4f>;
@group(0) @binding(1) var<uniform> S:vec4f;
@group(0) @binding(2) var A:texture_2d_array<f32>;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->IO{
  let k=ii*5u;var o:IO;o.b=Q[k];o.c=Q[k+1u];o.m=Q[k+2u];o.t0=Q[k+3u];o.t1=Q[k+4u];
  /* маска — ровно своя рамка (пиксель в пиксель); прямоугольник и треугольник — с пикселем запаса на край */
  var r=o.b;if(o.m.x!=1.){r=vec4f(floor(o.b.xy)-1.,ceil(o.b.zw)+1.);}
  let C=array<vec2f,6>(vec2f(0.,0.),vec2f(1.,0.),vec2f(0.,1.),vec2f(0.,1.),vec2f(1.,0.),vec2f(1.,1.));
  let q=mix(r.xy,r.zw,C[vi]);o.p=vec4f(q.x/S.x*2.-1.,1.-q.y/S.y*2.,0.,1.);return o;}
fn ed(a:vec2f,b:vec2f,p:vec2f)->f32{let d=b-a;return (d.x*(p.y-a.y)-d.y*(p.x-a.x))/max(length(d),1e-4);}
@fragment fn fs(i:IO)->@location(0) vec4f{
  let p=i.p.xy;var a=0.;
  if(i.m.x<.5){a=clamp(min(p.x+.5,i.b.z)-max(p.x-.5,i.b.x),0.,1.)*clamp(min(p.y+.5,i.b.w)-max(p.y-.5,i.b.y),0.,1.);}
  else if(i.m.x<1.5){a=textureLoad(A,vec2i(floor(p-i.b.xy)+i.m.zw),i32(i.m.y),0).r;}
  else{let s=sign(ed(i.t0.xy,i.t0.zw,i.t1.xy));
    a=clamp(min(ed(i.t0.xy,i.t0.zw,p),min(ed(i.t0.zw,i.t1.xy,p),ed(i.t1.xy,i.t0.xy,p)))*s+.5,0.,1.);}
  return i.c*a;}`;
function ovNd(){return OVL.cv&&W>0?OVL.cv.width/W:gpuHudDpr();}
/* слой: создаётся при первой фишке, сразу после #hud (подписи кабины пояса, #labels, — между ними) */
function ovCanvas(){
  if(!GPU.ok||!GPU.dev||typeof document==="undefined"||!document.body)return null;
  let c=OVL.cv;
  if(!c){c=OVL.cv=document.createElement("canvas");c.id="ovl";
    c.style.cssText="position:fixed;left:0;top:0;pointer-events:none;display:none";
    ((typeof LABDOM!=="undefined"&&LABDOM.box)||GPU.ui||GPU.cv).after(c);}
  if(OVL.dev!==GPU.dev){OVL.cx=c.getContext("webgpu");OVL.cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    OVL.dev=GPU.dev;OVL.P=null;OVL.buf=null;OVL.bg=null;}
  const nd=gpuHudDpr(),w=Math.max(2,Math.round(W*nd)),h=Math.max(2,Math.round(H*nd));
  /* CSS-размер — ровно пиксели устройства: иначе композитор тянет слой на долю пикселя, и глиф мылится */
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;c.style.width=w/nd+"px";c.style.height=h/nd+"px";}
  return c;
}
/* атлас масок: texture_2d_array r8, полки через пиксель; слой-жертва — самый давний по касанию,
   и не тронутый в этом кадре (его маски уже в очереди прохода), пока такой есть */
function ovAtlas(key,mk){
  const A=OVL.A,d=GPU.dev;
  if(A.dev!==d){A.dev=d;A.tex=d.createTexture({size:[A.S,A.S,A.L],format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
    A.view=A.tex.createView({dimension:"2d-array"});A.pg=[];for(let i=0;i<A.L;i++)A.pg.push({x:0,y:0,rh:0,last:-1,keys:[]});
    A.map.clear();A.cur=0;OVL.bg=null;}
  let e=A.map.get(key);if(e){A.pg[e.l].last=OVL.fno;return e;}
  const r=mk();OVL.ras++;
  if(r.w>A.S||r.h>A.S)throw gcNo("подпись крупнее "+A.S+" px");
  const fit=p=>{if(p.x+r.w>A.S){p.x=0;p.y+=p.rh+1;p.rh=0;}return p.y+r.h<=A.S;};
  let l=A.cur;
  if(!fit(A.pg[l])){
    l=A.pg.findIndex(p=>!p.keys.length);
    if(l<0){let best=-1;for(let i=0;i<A.L;i++){const p=A.pg[i];if(i!==A.cur&&(best<0||p.last<A.pg[best].last))best=i;}
      l=best;const p=A.pg[l];if(p.last===OVL.fno)A.thr++;
      for(const k of p.keys)A.map.delete(k);Object.assign(p,{x:0,y:0,rh:0,keys:[]});A.ev++;}
    A.cur=l;fit(A.pg[l]);}
  const p=A.pg[l],x=p.x,y=p.y;p.x+=r.w+1;p.rh=Math.max(p.rh,r.h);p.last=OVL.fno;p.keys.push(key);
  d.queue.writeTexture({texture:A.tex,origin:[x,y,l]},r.a,{bytesPerRow:r.w},[r.w,r.h]);
  e={l,x,y,w:r.w,h:r.h,ox:r.ox,oy:r.oy};A.map.set(key,e);return e;
}
function ovPush(Q,x0,y0,x1,y1,c,m,l,tx,ty,t){
  Q.push(x0,y0,x1,y1,c[0],c[1],c[2],c[3],m,l,tx,ty);
  if(t)Q.push(t[0],t[1],t[2],t[3],t[4],t[5],0,0);else Q.push(0,0,0,0,0,0,0,0);
}
const OVL_RUN=/[0-9]+|[^0-9]+/g;
/* строка в очередь Q: (x,y) — якорь в пикселях CSS по align и base, sc — масштаб шрифта (фишка — U).
   Возвращает рамку в CSS: для проверок наложения */
function ovText(Q,x,y,text,font,col,align,base,al,sc){
  const nd=ovNd(),st=Object.assign({},GC_DEF,{font,textBaseline:base,textAlign:"left"}),c=gcColor(col),a=c[3]*al;
  if(OVL.led){const m=/(\d+(?:\.\d+)?)px/.exec(font)||[0,0];OVL.led({s:text,px:+m[1],css:+m[1]*sc,main:true});}
  const pm=[c[0]*a,c[1]*a,c[2]*a,a];
  const d0=GC_GLYPHS.measure(st,"0"),adv=d0.width*sc,runs=text.match(OVL_RUN)||[];
  let tw=0,up=0,dn=0;
  for(const s of runs){const dg=s.charCodeAt(0)<58&&s.charCodeAt(0)>47,m=dg?d0:GC_GLYPHS.measure(st,s);
    tw+=dg?adv*s.length:m.width*sc;up=Math.max(up,m.actualBoundingBoxAscent*sc);dn=Math.max(dn,m.actualBoundingBoxDescent*sc);}
  /* начало строки — на целый пиксель устройства, как у прежних DOM-подписей: на ходу строка шагает
     пикселем, а фазы цифр внутри неё постоянны — новой маски движение не просит */
  const x0=Math.round((align==="center"?x-tw/2:(align==="right"||align==="end")?x-tw:x)*nd)/nd,iy=Math.round(y*nd),M=[nd*sc,0,0,nd*sc];
  const put=(s,cx)=>{const X=cx*nd;let ix=Math.floor(X),ph=Math.round((X-ix)*4)/4;if(ph>=1){ix++;ph=0;}
    const kb=font+"|"+base+"|"+M[0]+"|"+ph+"|",mk=g=>()=>GC_GLYPHS.raster(st,g,M,ph,0,null,undefined,"#fff");   /* маска — одна альфа, цвет не нужен */
    /* цифра, которой нет, — все десять сразу: число меняется в полёте, а растр — только в первый раз */
    if(s.length===1&&s>="0"&&s<="9"&&!OVL.A.map.has(kb+s))for(let g=0;g<10;g++)ovAtlas(kb+g,mk(String(g)));
    const e=ovAtlas(kb+s,mk(s));
    ovPush(Q,ix-e.ox,iy-e.oy,ix-e.ox+e.w,iy-e.oy+e.h,pm,1,e.l,e.x,e.y,null);};
  let cx=x0;
  for(const s of runs){
    if(s.charCodeAt(0)<58&&s.charCodeAt(0)>47){for(let i=0;i<s.length;i++)put(s[i],cx+i*adv);cx+=adv*s.length;}
    else{put(s,cx);cx+=GC_GLYPHS.measure(st,s).width*sc;}}
  return {x0,x1:x0+tw,y0:y-up,y1:y+dn};
}
/* подпись мира k (имя станции, планеты, борта): y — как у fillText при нынешнем ctx.textBaseline.
   Без видеокарты — прямо на ctx, как раньше */
function domLabel(k,x,y,text,font,col,align,al){
  if(al==null)al=1;
  if(!GPU.ok||!GPU.on){ctx.fillStyle=col;ctx.font=font;ctx.textAlign=align;ctx.globalAlpha=al;ctx.fillText(text,x,y);ctx.globalAlpha=1;return;}
  const r=ovText(OVL.lq,x,y,text,font,col,align,ctx.textBaseline,al,1);
  let e=OVL.lab.get(k);if(!e)OVL.lab.set(k,e={on:false});
  Object.assign(e,r,{fr:OVL.fno,A:al,s:text});
}
/* фишка k: место (rx,ry) и размер (cw,ch) в мерке U, прозрачность, цвет, подпись, сторона подписи,
   угол стрелки. Рисунок — как у 2D: плашка, волосяной обвод, подпись, стрелка */
const OVL_PLATE=[5/255*.72,7/255*.72,12/255*.72,.72];
function chipDom(k,rx,ry,cw,ch,A,col,label,onRight,ang,U){
  /* без видеокарты мира нет, и фишкам не над чем висеть (Node-ярус, Chrome без WebGPU) */
  if(!GPU.ok||!GPU.on)return;
  const nd=ovNd(),s=U*nd,X=Math.round(rx*s),Y=Math.round(ry*s),X1=X+cw*s,Y1=Y+ch*s,Q=OVL.cq;
  const c=gcColor(col),ca=c[3]*A,pm=[c[0]*ca,c[1]*ca,c[2]*ca,ca],hb=pm.map(v=>v*.5);
  ovPush(Q,X,Y,X1,Y1,OVL_PLATE.map(v=>v*A),0,0,0,0,null);
  ovPush(Q,X,Y,X1,Y+s,hb,0,0,0,0,null);ovPush(Q,X,Y1-s,X1,Y1,hb,0,0,0,0,null);
  ovPush(Q,X,Y+s,X+s,Y1-s,hb,0,0,0,0,null);ovPush(Q,X1-s,Y+s,X1,Y1-s,hb,0,0,0,0,null);
  ovText(Q,X/nd+(onRight?cw-18:18)*U,Y/nd+12*U,label,"8px ui-monospace,monospace",col,onRight?"right":"left","alphabetic",A,U);
  /* стрелка: треугольник (6,0),(−4,4),(−4,−4) вокруг своей точки, повёрнут на ang */
  const ax=X+(onRight?cw-8:8)*s,ay=Y+ch/2*s,co=Math.cos(ang)*s,si=Math.sin(ang)*s,P=(u,v)=>[ax+u*co-v*si,ay+u*si+v*co];
  const t=[...P(6,0),...P(-4,4),...P(-4,-4)];
  ovPush(Q,Math.min(t[0],t[2],t[4]),Math.min(t[1],t[3],t[5]),Math.max(t[0],t[2],t[4]),Math.max(t[1],t[3],t[5]),pm,2,0,0,0,t);
  let e=OVL.chip.get(k);if(!e)OVL.chip.set(k,e={on:false});
  Object.assign(e,{fr:OVL.fno,x:X/nd,y:Y/nd,w:cw*U,h:ch*U,A,s:label});
}
/* конец мира (gpuHudFlush): всё, что кадр положил, — одним проходом; пусто — слой спрятать */
function ovFlush(){
  OVL.fl=true;
  const n=(OVL.lq.length+OVL.cq.length)/OVL_N;
  for(const M of [OVL.lab,OVL.chip])for(const [k,e] of M){e.on=e.fr===OVL.fno;if(OVL.fno-e.fr>600)M.delete(k);}
  OVL.fno++;
  const cv=n&&GPU.enc?ovCanvas():null;
  if(!cv){OVL.lq.length=OVL.cq.length=0;if(OVL.on){OVL.on=false;OVL.cv.style.display="none";}return;}
  const d=GPU.dev,need=n*OVL_N;
  if(!OVL.f||OVL.f.length<need)OVL.f=new Float32Array(Math.max(need,OVL_N*64)*2);
  OVL.f.set(OVL.lq,0);OVL.f.set(OVL.cq,OVL.lq.length);OVL.nl=OVL.lq.length/OVL_N;OVL.lq.length=OVL.cq.length=0;   /* подписи — под фишками */
  if(!OVL.P){
    OVL.P=gpuPipeline("ovl",()=>{const m=gpuShader(OVL_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},primitive:{topology:"triangle-list"},
      fragment:{module:m,entryPoint:"fs",targets:[{format:GPU.fmt,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},
        alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]}};});
    OVL.U=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});OVL.bg=null;}
  if(!OVL.buf||OVL.buf.size<OVL.f.byteLength){if(OVL.buf)GPU.trash.push(OVL.buf);
    OVL.buf=d.createBuffer({size:OVL.f.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});OVL.bg=null;}
  if(!OVL.A.tex)ovAtlas("",()=>({w:1,h:1,ox:0,oy:0,a:new Uint8Array(1)}));   /* атлас нужен привязке и без текста */
  if(!OVL.bg)OVL.bg=d.createBindGroup({layout:OVL.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:OVL.buf}},
    {binding:1,resource:{buffer:OVL.U}},{binding:2,resource:OVL.A.view}]});
  d.queue.writeBuffer(OVL.buf,0,OVL.f,0,need);d.queue.writeBuffer(OVL.U,0,new Float32Array([cv.width,cv.height,0,0]));
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:OVL.cx.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",
    clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("ovl")});
  p.setPipeline(OVL.P);p.setBindGroup(0,OVL.bg);p.draw(6,n);p.end();
  if(!OVL.on){OVL.on=true;cv.style.display="";}
}
