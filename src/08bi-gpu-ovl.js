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
/* Слой интерфейса (uq, под подписями и фишками; стойка 25d): те же прямоугольники, маски и
   треугольники и ещё четыре вида — картинка (мастер gpuBake: своя привязка текстуры, повёрнутый
   прямоугольник, трилинейно), график (ломаная по ровному шагу x — перо самописца: покрытие —
   расстояние до ближайших звеньев, объединение без двойного края на стыках; точки лежат в том же
   буфере после примитивов), капсула (отрезок с круглыми концами) и эллипс (заливка или обвод).
   Картинки режут проход на прогоны по мастеру: привязка — на мастер, кэш по текстуре */
const OVL={cv:null,cx:null,dev:null,P:null,lq:[],cq:[],uq:[],ur:[],gd:[],on:false,fl:false,fno:0,ras:0,led:null,
  lab:new Map(),chip:new Map(),f:null,buf:null,bg:null,bgs:new Map(),
  A:{dev:null,tex:null,view:null,L:4,S:1024,pg:[],map:new Map(),cur:0,ev:0,thr:0}};
const OVL_N=20;   /* чисел на примитив: рамка, цвет, (вид, слой, тексель), треугольник */
const OVL_WGSL=`
struct IO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) b:vec4f,@location(1) @interpolate(flat) c:vec4f,
  @location(2) @interpolate(flat) m:vec4f,@location(3) @interpolate(flat) t0:vec4f,@location(4) @interpolate(flat) t1:vec4f,
  @location(5) uv:vec2f};
@group(0) @binding(0) var<storage,read> Q:array<vec4f>;
@group(0) @binding(1) var<uniform> S:vec4f;
@group(0) @binding(2) var A:texture_2d_array<f32>;
@group(0) @binding(3) var T:texture_2d<f32>;
@group(0) @binding(4) var sm:sampler;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->IO{
  let k=ii*5u;var o:IO;o.b=Q[k];o.c=Q[k+1u];o.m=Q[k+2u];o.t0=Q[k+3u];o.t1=Q[k+4u];
  let C=array<vec2f,6>(vec2f(0.,0.),vec2f(1.,0.),vec2f(0.,1.),vec2f(0.,1.),vec2f(1.,0.),vec2f(1.,1.));let cn=C[vi];
  var q:vec2f;o.uv=cn;
  if(o.m.x==3.){   /* картинка: центр t0.xy, полуразмер t0.zw, поворот m.y, кусок текстуры t1 */
    let cs=cos(o.m.y);let sn=sin(o.m.y);let l=(cn*2.-1.)*o.t0.zw;
    q=o.t0.xy+vec2f(l.x*cs-l.y*sn,l.x*sn+l.y*cs);o.uv=mix(o.t1.xy,o.t1.zw,cn);}
  else{
    /* маска — ровно своя рамка (пиксель в пиксель), график — ровно своя полоса (она же обрез);
       прочее — с пикселем запаса на край */
    var r=o.b;if(o.m.x!=1.&&o.m.x!=4.){r=vec4f(floor(o.b.xy)-1.,ceil(o.b.zw)+1.);}
    q=mix(r.xy,r.zw,cn);}
  o.p=vec4f(q.x/S.x*2.-1.,1.-q.y/S.y*2.,0.,1.);return o;}
fn ed(a:vec2f,b:vec2f,p:vec2f)->f32{let d=b-a;return (d.x*(p.y-a.y)-d.y*(p.x-a.x))/max(length(d),1e-4);}
fn sd(p:vec2f,a:vec2f,b:vec2f)->f32{let d=b-a;let h=clamp(dot(p-a,d)/max(dot(d,d),1e-6),0.,1.);return length(p-a-d*h);}
fn gy(i:i32)->f32{let v=Q[u32(S.z)+u32(i)/4u];return v[u32(i)%4u];}
@fragment fn fs(i:IO)->@location(0) vec4f{
  let p=i.p.xy;var a=0.;
  let dx=dpdx(i.uv);let dy=dpdy(i.uv);   /* производные — до ветвлений (однородный поток) */
  if(i.m.x<.5){a=clamp(min(p.x+.5,i.b.z)-max(p.x-.5,i.b.x),0.,1.)*clamp(min(p.y+.5,i.b.w)-max(p.y-.5,i.b.y),0.,1.);}
  else if(i.m.x<1.5){a=textureLoad(A,vec2i(floor(p-i.b.xy)+i.m.zw),i32(i.m.y),0).r;}
  else if(i.m.x<2.5){let s=sign(ed(i.t0.xy,i.t0.zw,i.t1.xy));   /* знак обхода — внутрь каждого ребра, потом min */
    a=clamp(min(ed(i.t0.xy,i.t0.zw,p)*s,min(ed(i.t0.zw,i.t1.xy,p)*s,ed(i.t1.xy,i.t0.xy,p)*s))+.5,0.,1.);}
  else if(i.m.x<3.5){return textureSampleGrad(T,sm,i.uv,dx,dy)*i.c;}
  else if(i.m.x<4.5){   /* график: x0=t0.x, шаг t0.y, полутолщина m.y, точки с m.z (от S.z), их m.w */
    let x0=i.t0.x;let st=i.t0.y;let hw=i.m.y;let o=i32(i.m.z);let n=i32(i.m.w);
    let j0=max(0,i32(floor((p.x-x0-hw-1.)/st)));let j1=min(n-2,i32(floor((p.x-x0+hw+1.)/st)));
    var d=1e9;
    for(var j=j0;j<=j1;j++){d=min(d,sd(p,vec2f(x0+f32(j)*st,gy(o+j)),vec2f(x0+f32(j+1)*st,gy(o+j+1))));}
    a=clamp(hw-d+.5,0.,1.);}
  else if(i.m.x<5.5){a=clamp(i.t1.x-sd(p,i.t0.xy,i.t0.zw)+.5,0.,1.);}
  else{   /* эллипс t0 (центр, полуоси): расстояние ≈ f/|∇f|; t1.y — заливка, иначе обвод полутолщиной t1.x */
    let q=(p-i.t0.xy)/i.t0.zw;let L=max(length(q),1e-5);let g=max(length(q/i.t0.zw),1e-6);let d=(L-1.)*L/g;
    if(i.t1.y>.5){a=clamp(.5-d,0.,1.);}else{a=clamp(i.t1.x-abs(d)+.5,0.,1.);}}
  return i.c*a;}`;
function ovNd(){return OVL.cv&&W>0?OVL.cv.width/W:gpuHudDpr();}
/* слой: создаётся при первой фишке, сразу после #hud */
function ovCanvas(){
  if(!GPU.ok||!GPU.dev||typeof document==="undefined"||!document.body)return null;
  let c=OVL.cv;
  if(!c){c=OVL.cv=document.createElement("canvas");c.id="ovl";
    c.style.cssText="position:fixed;left:0;top:0;pointer-events:none;display:none";
    (GPU.ui||GPU.cv).after(c);}
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
function ovlDesc(){const m=gpuShader(OVL_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},primitive:{topology:"triangle-list"},
  fragment:{module:m,entryPoint:"fs",targets:[{format:GPU.fmt,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},
    alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]}};}
function ovFlush(){
  OVL.fl=true;
  const nu=OVL.uq.length/OVL_N,n=nu+(OVL.lq.length+OVL.cq.length)/OVL_N;
  for(const M of [OVL.lab,OVL.chip])for(const [k,e] of M){e.on=e.fr===OVL.fno;if(OVL.fno-e.fr>600)M.delete(k);}
  OVL.fno++;
  const cv=n&&GPU.enc?ovCanvas():null;
  if(!cv){OVL.uq.length=OVL.lq.length=OVL.cq.length=OVL.ur.length=OVL.gd.length=0;if(OVL.on){OVL.on=false;OVL.cv.style.display="none";}return;}
  const d=GPU.dev,np=n*OVL_N,g0=np,need=np+Math.ceil(OVL.gd.length/4)*4;   /* точки графиков — после примитивов, с границы vec4 */
  if(!OVL.f||OVL.f.length<need)OVL.f=new Float32Array(Math.max(need,OVL_N*64)*2);
  /* интерфейс — под подписями, подписи — под фишками */
  OVL.f.set(OVL.uq,0);OVL.f.set(OVL.lq,OVL.uq.length);OVL.f.set(OVL.cq,OVL.uq.length+OVL.lq.length);OVL.f.set(OVL.gd,g0);
  OVL.nl=OVL.lq.length/OVL_N;OVL.uq.length=OVL.lq.length=OVL.cq.length=OVL.gd.length=0;
  if(!OVL.P){
    OVL.P=gpuPipeline("ovl",ovlDesc);
    OVL.U=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});OVL.bg=null;}
  if(!OVL.buf||OVL.buf.size<OVL.f.byteLength){if(OVL.buf)GPU.trash.push(OVL.buf);
    OVL.buf=d.createBuffer({size:OVL.f.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});OVL.bg=null;}
  if(!OVL.A.tex)ovAtlas("",()=>({w:1,h:1,ox:0,oy:0,a:new Uint8Array(1)}));   /* атлас нужен привязке и без текста */
  if(!OVL.bg){OVL.bg=true;OVL.bgs.clear();}
  d.queue.writeBuffer(OVL.buf,0,OVL.f,0,need);d.queue.writeBuffer(OVL.U,0,new Float32Array([cv.width,cv.height,g0/4,0]));
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:OVL.cx.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",
    clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("ovl")});
  p.setPipeline(OVL.P);
  /* прогоны по мастеру: [с какого примитива, мастер]; до первой картинки и без картинок — пустышка
     (передний слой кадра: текстура есть всегда, новой не заводим) */
  const R=OVL.ur;let i0=0,B=null;
  for(let r=0;r<=R.length;r++){
    const i1=r<R.length?R[r][0]:n;
    if(i1>i0){p.setBindGroup(0,ovBind(B));p.draw(6,i1-i0,0,i0);i0=i1;}
    if(r<R.length)B=R[r][1];
  }
  R.length=0;p.end();
  if(!OVL.on){OVL.on=true;cv.style.display="";}
}
/* привязка прохода с текстурой мастера B (нет — передний слой кадра); кэш по текстуре, сброс — со сменой буфера */
function ovBind(B){
  const t=B&&B.tex&&B.dev===GPU.dev?B.tex:GPU.T.front;
  let g=OVL.bgs.get(t);if(g)return g;
  if(OVL.bgs.size>=16)OVL.bgs.clear();
  g=GPU.dev.createBindGroup({layout:OVL.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:OVL.buf}},
    {binding:1,resource:{buffer:OVL.U}},{binding:2,resource:OVL.A.view},
    {binding:3,resource:t===GPU.T.front?gpuOvFrontView():B.view},{binding:4,resource:gpuMipSmp()}]});
  OVL.bgs.set(t,g);return g;
}
function gpuOvFrontView(){const t=GPU.T.front;if(OVL.fv0!==t){OVL.fv0=t;OVL.fv=t.createView();}return OVL.fv;}
/* ── вид интерфейса (uq): координаты — пиксели CSS, как у 2D; al — прозрачность; col — цвет строкой ── */
function ovPm(col,al){const c=gcColor(col),a=c[3]*(al==null?1:al);return [c[0]*a,c[1]*a,c[2]*a,a];}
function ovRect(x0,y0,x1,y1,col,al){const s=ovNd();ovPush(OVL.uq,x0*s,y0*s,x1*s,y1*s,ovPm(col,al),0,0,0,0,null);}
/* картинка: мастер B, центр (x,y), размер (w,h), поворот rot, кусок u0..v1, множитель mul (число — прозрачность) */
function ovImage(B,x,y,w,h,rot,u0,v0,u1,v1,mul){
  if(!B)return;const s=ovNd(),Q=OVL.uq,i=Q.length/OVL_N,m=typeof mul==="number"?[mul,mul,mul,mul]:(mul||[1,1,1,1]);
  const R=OVL.ur;if(!R.length||R[R.length-1][1]!==B)R.push([i,B]);
  Q.push(0,0,0,0,m[0],m[1],m[2],m[3],3,rot||0,0,0,x*s,y*s,w*s/2,h*s/2,u0,v0,u1,v1);
}
/* капсула: отрезок (x0,y0)–(x1,y1) толщиной w с круглыми концами; диск — отрезок нулевой длины */
function ovCap(x0,y0,x1,y1,w,col,al){
  const s=ovNd(),r=w*s/2,X0=x0*s,Y0=y0*s,X1=x1*s,Y1=y1*s;
  ovPush(OVL.uq,Math.min(X0,X1)-r,Math.min(Y0,Y1)-r,Math.max(X0,X1)+r,Math.max(Y0,Y1)+r,ovPm(col,al),5,0,0,0,[X0,Y0,X1,Y1,r,0]);
}
/* эллипс: центр, полуоси; w>0 — обвод толщиной w, иначе заливка */
function ovEll(cx,cy,rx,ry,w,col,al){
  const s=ovNd(),X=cx*s,Y=cy*s,Rx=Math.max(.5,rx*s),Ry=Math.max(.5,ry*s),h=w>0?w*s/2:0;
  ovPush(OVL.uq,X-Rx-h,Y-Ry-h,X+Rx+h,Y+Ry+h,ovPm(col,al),6,0,0,0,[X,Y,Rx,Ry,h,w>0?0:1]);
}
/* график: полоса-обрез (x0,y0)–(x1,y1), точки ys по x от gx с шагом st, толщина w */
function ovGraph(x0,y0,x1,y1,gx,st,ys,w,col,al){
  const s=ovNd(),n=ys.length;if(n<2)return;
  const D=OVL.gd,o=D.length;for(let i=0;i<n;i++)D.push(ys[i]*s);
  OVL.uq.push(x0*s,y0*s,x1*s,y1*s,...ovPm(col,al),4,w*s/2,o,n,gx*s,st*s,0,0,0,0,0,0);
}
