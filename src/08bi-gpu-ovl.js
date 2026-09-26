/* ══════════════ фишки у кромки и подписи мира — на видеокарте (docs/DESIGN-gpu.md §G, «Chips and labels») ══════════════
   Один WebGPU-холст #ovl на родном DPR (текст приборов резкий, правило 15/n), сразу над #g.
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
const OVL={cv:null,cx:null,dev:null,P:null,Pd:null,lq:[],cq:[],uq:[],ur:[],gd:[],on:false,fl:false,fno:0,ras:0,led:null,nd:0,
  lab:new Map(),chip:new Map(),f:null,buf:null,U:null,ud:null,bgs:new Map(),
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
fn gh(p:vec2f,s:f32)->f32{var q=fract(vec3f(p.x,p.y,s)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
@fragment fn fs(i:IO)->@location(0) vec4f{
  let p=i.p.xy;var a=0.;
  let dx=dpdx(i.uv);let dy=dpdy(i.uv);   /* производные — до ветвлений (однородный поток) */
  if(i.m.x<.5){a=clamp(min(p.x+.5,i.b.z)-max(p.x-.5,i.b.x),0.,1.)*clamp(min(p.y+.5,i.b.w)-max(p.y-.5,i.b.y),0.,1.);}
  else if(i.m.x<1.5){a=textureLoad(A,vec2i(floor(p-i.b.xy)+i.m.zw),i32(i.m.y),0).r;}
  else if(i.m.x<2.5){let s=sign(ed(i.t0.xy,i.t0.zw,i.t1.xy));   /* знак обхода — внутрь каждого ребра, потом min */
    if(i.m.y>.5){   /* выпуклый четырёхугольник A B C D (D = t1.zw) и прозрачность m.z→m.w от середины DA к середине BC */
      let A=i.t0.xy;let B=i.t0.zw;let C=i.t1.xy;let D=i.t1.zw;
      a=clamp(min(min(ed(A,B,p)*s,ed(B,C,p)*s),min(ed(C,D,p)*s,ed(D,A,p)*s))+.5,0.,1.);
      let P0=(A+D)*.5;let v=(B+C)*.5-P0;a*=mix(i.m.z,i.m.w,clamp(dot(p-P0,v)/max(dot(v,v),1e-6),0.,1.));}
    else{a=clamp(min(ed(i.t0.xy,i.t0.zw,p)*s,min(ed(i.t0.zw,i.t1.xy,p)*s,ed(i.t1.xy,i.t0.xy,p)*s))+.5,0.,1.);}}
  else if(i.m.x<3.5){var t=textureSampleGrad(T,sm,i.uv,dx,dy);
    /* m.z — текстура студии (17c2): альфа сцены (сколько фона осталось) в покрытие, свет выше
       единицы — тем же плечом, что tone() финала 08b, а не обрезкой: лампы не белеют пятном */
    if(i.m.z>.5){let x=max(t.rgb-vec3f(.75),vec3f(0.));t=vec4f(min(t.rgb,vec3f(.75))+.25*(vec3f(1.)-exp(-x*4.)),1.-t.a);}
    /* m.w — цвет по матрице (1 + её место в vec4 от S.z): строки R, G, B — множители и сдвиг по чистому цвету,
       четвёртая — зерно (амплитуда, посев): одно число на пиксель устройства во все три канала; обрез после зерна */
    if(i.m.w>.5){let k=u32(S.z)+u32(i.m.w)-1u;let al=max(t.a,1e-5);var c=t.rgb/al;
      c=vec3f(dot(Q[k].xyz,c)+Q[k].w,dot(Q[k+1u].xyz,c)+Q[k+1u].w,dot(Q[k+2u].xyz,c)+Q[k+2u].w);
      let gn=Q[k+3u];if(gn.x>0.){c=c+vec3f((gh(floor(p),gn.y)-.5)*gn.x);}
      t=vec4f(clamp(c,vec3f(0.),vec3f(1.))*t.a,t.a);}
    return t*i.c;}
  else if(i.m.x<4.5){   /* график: x0=t0.x, шаг t0.y, полутолщина m.y, точки с m.z (от S.z), их m.w */
    let x0=i.t0.x;let st=i.t0.y;let hw=i.m.y;let o=i32(i.m.z);let n=i32(i.m.w);
    let j0=max(0,i32(floor((p.x-x0-hw-1.)/st)));let j1=min(n-2,i32(floor((p.x-x0+hw+1.)/st)));
    var d=1e9;
    for(var j=j0;j<=j1;j++){d=min(d,sd(p,vec2f(x0+f32(j)*st,gy(o+j)),vec2f(x0+f32(j+1)*st,gy(o+j+1))));}
    a=clamp(hw-d+.5,0.,1.);}
  else if(i.m.x<5.5){   /* капсула; t1.y — ломаная a→b→c (c = t1.zw): одно покрытие, стык без двойной альфы */
    var d=sd(p,i.t0.xy,i.t0.zw);if(i.t1.y>.5){d=min(d,sd(p,i.t0.zw,i.t1.zw));}
    a=clamp(i.t1.x-d+.5,0.,1.);}
  else{   /* эллипс t0 (центр, полуоси): расстояние ≈ f/|∇f|; t1.y — заливка, иначе обвод полутолщиной t1.x;
             t1.w>0 — только дуга от угла t1.z размахом t1.w (угол параметра), концы круглые */
    let q=(p-i.t0.xy)/i.t0.zw;let L=max(length(q),1e-5);let g=max(length(q/i.t0.zw),1e-6);let d=(L-1.)*L/g;
    if(i.t1.y>.5){a=clamp(.5-d,0.,1.);}
    else{var e=abs(d);
      if(i.t1.w>0.&&fract((atan2(q.y,q.x)-i.t1.z)/6.2831853)*6.2831853>i.t1.w){let z=i.t1.z+i.t1.w;
        e=min(length(p-i.t0.xy-i.t0.zw*vec2f(cos(i.t1.z),sin(i.t1.z))),length(p-i.t0.xy-i.t0.zw*vec2f(cos(z),sin(z))));}
      a=clamp(i.t1.x-e+.5,0.,1.);}}
  return i.c*a;}`;
function ovNd(){return OVL.nd||(OVL.cv&&W>0?OVL.cv.width/W:gpuHudDpr());}
/* очередь другой цели (колодка 25c): ov* кладут в её uq/ur/gd с её плотностью nd — пикселей на пиксель CSS */
function ovInto(T,nd,fn){
  const s=[OVL.uq,OVL.ur,OVL.gd,OVL.nd];OVL.uq=T.uq;OVL.ur=T.ur;OVL.gd=T.gd;OVL.nd=nd;
  try{fn();}finally{OVL.uq=s[0];OVL.ur=s[1];OVL.gd=s[2];OVL.nd=s[3];}
}
/* цель прохода: свои очереди, буфер, форма и кэш привязок; конвейер и атлас масок — общие */
function ovTarget(){return {uq:[],ur:[],gd:[],f:null,buf:null,U:null,ud:null,bgs:new Map()};}
/* слой: создаётся при первой фишке, сразу над #g */
function ovCanvas(){
  if(!GPU.ok||!GPU.dev||typeof document==="undefined"||!document.body)return null;
  let c=OVL.cv;
  if(!c){c=OVL.cv=document.createElement("canvas");c.id="ovl";
    c.style.cssText="position:fixed;left:0;top:0;pointer-events:none;display:none";
    GPU.cv.after(c);}
  if(OVL.dev!==GPU.dev){OVL.cx=c.getContext("webgpu");OVL.cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    OVL.dev=GPU.dev;}
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
    A.map.clear();A.cur=0;}
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
  if(t)Q.push(t[0],t[1],t[2],t[3],t[4],t[5],t[6]||0,t[7]||0);else Q.push(0,0,0,0,0,0,0,0);
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
/* конец мира (gpuWorld): всё, что кадр положил, — одним проходом; пусто — слой спрятать */
function ovlDesc(){const m=gpuShader(OVL_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},primitive:{topology:"triangle-list"},
  fragment:{module:m,entryPoint:"fs",targets:[{format:GPU.fmt,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},
    alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]}};}
function ovFlush(){
  OVL.fl=true;
  const n=(OVL.uq.length+OVL.lq.length+OVL.cq.length)/OVL_N;
  for(const M of [OVL.lab,OVL.chip])for(const [k,e] of M){e.on=e.fr===OVL.fno;if(OVL.fno-e.fr>600)M.delete(k);}
  OVL.fno++;
  const cv=n&&GPU.enc?ovCanvas():null;
  if(!cv){OVL.uq.length=OVL.lq.length=OVL.cq.length=OVL.ur.length=OVL.gd.length=0;if(OVL.on){OVL.on=false;OVL.cv.style.display="none";}return;}
  OVL.nu=OVL.uq.length/OVL_N;OVL.nl=OVL.lq.length/OVL_N;   /* сколько примитивов интерфейса и подписей (наборы: порядок слоёв) */
  /* интерфейс — под подписями, подписи — под фишками */
  ovPass(OVL,OVL.cx.getCurrentTexture().createView(),cv.width,cv.height,[OVL.uq,OVL.lq,OVL.cq],"ovl");
  if(!OVL.on){OVL.on=true;cv.style.display="";}
}
/* проход цели T в кадровый энкодер (тот же submit): очереди qs снизу вверх, прогоны T.ur, точки графиков T.gd —
   после примитивов, с границы vec4. Очереди опустошаются. #ovl — сам OVL, колодка (25c) — своя цель */
const OVL_UF=new Float32Array(4);   /* форма прохода — черновик: writeBuffer копирует сразу (ревью №7) */
function ovPass(T,view,w,h,qs,ts){
  const d=GPU.dev;let np=0;for(const q of qs)np+=q.length;
  const n=np/OVL_N,g0=np,need=np+Math.ceil(T.gd.length/4)*4;
  if(!T.f||T.f.length<need)T.f=new Float32Array(Math.max(need,OVL_N*64)*2);
  let o=0;for(const q of qs){T.f.set(q,o);o+=q.length;q.length=0;}
  T.f.set(T.gd,g0);T.gd.length=0;
  if(!OVL.P||OVL.Pd!==d){OVL.P=gpuPipeline("ovl",ovlDesc);OVL.Pd=d;}
  if(T.ud!==d){T.ud=d;T.U=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});T.buf=null;}
  if(!T.buf||T.buf.size<T.f.byteLength){if(T.buf)GPU.trash.push(T.buf);
    T.buf=d.createBuffer({size:T.f.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});}
  if(!OVL.A.tex)ovAtlas("",()=>({w:1,h:1,ox:0,oy:0,a:new Uint8Array(1)}));   /* атлас нужен привязке и без текста */
  /* кэш привязок живёт, пока те же буфер, атлас и конвейер */
  if(T.k0!==T.buf||T.k1!==OVL.A.view||T.k2!==OVL.P){T.k0=T.buf;T.k1=OVL.A.view;T.k2=OVL.P;T.bgs.clear();}
  d.queue.writeBuffer(T.buf,0,T.f,0,need);const u=OVL_UF;u[0]=w;u[1]=h;u[2]=g0/4;u[3]=0;d.queue.writeBuffer(T.U,0,u);
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view,loadOp:"clear",storeOp:"store",
    clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs(ts)});
  p.setPipeline(OVL.P);
  /* прогоны по мастеру: [с какого примитива, мастер]; до первой картинки и без картинок — пустышка
     (передний слой кадра: текстура есть всегда, новой не заводим) */
  const R=T.ur;let i0=0,B=null;
  for(let r=0;r<=R.length;r++){
    const i1=r<R.length?R[r][0]:n;
    if(i1>i0){p.setBindGroup(0,ovBind(T,B));p.draw(6,i1-i0,0,i0);i0=i1;}
    if(r<R.length)B=R[r][1];
  }
  R.length=0;p.end();
}
/* привязка прохода цели T с текстурой мастера B (нет — передний слой кадра); кэш по текстуре */
function ovBind(T,B){
  const t=B&&B.tex&&B.dev===GPU.dev?B.tex:GPU.T.front;
  let g=T.bgs.get(t);if(g)return g;
  if(T.bgs.size>=16)T.bgs.clear();
  g=GPU.dev.createBindGroup({layout:OVL.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:T.buf}},
    {binding:1,resource:{buffer:T.U}},{binding:2,resource:OVL.A.view},
    {binding:3,resource:t===GPU.T.front?gpuOvFrontView():B.view},{binding:4,resource:gpuMipSmp()}]});
  T.bgs.set(t,g);return g;
}
function gpuOvFrontView(){const t=GPU.T.front;if(OVL.fv0!==t){OVL.fv0=t;OVL.fv=t.createView();}return OVL.fv;}
/* ── вид интерфейса (uq): координаты — пиксели CSS, как у 2D; al — прозрачность; col — цвет строкой ── */
function ovPm(col,al){const c=gcColor(col),a=c[3]*(al==null?1:al);return [c[0]*a,c[1]*a,c[2]*a,a];}
function ovRect(x0,y0,x1,y1,col,al){const s=ovNd();ovPush(OVL.uq,x0*s,y0*s,x1*s,y1*s,ovPm(col,al),0,0,0,0,null);}
/* картинка: мастер B, центр (x,y), размер (w,h), поворот rot, кусок u0..v1, множитель mul (число — прозрачность);
   B.inv — альфа мастера перевёрнута (текстура студии корпуса, 17c2) */
function ovImage(B,x,y,w,h,rot,u0,v0,u1,v1,mul,M){
  if(!B)return;const s=ovNd(),Q=OVL.uq,i=Q.length/OVL_N,m=typeof mul==="number"?[mul,mul,mul,mul]:(mul||[1,1,1,1]);
  const R=OVL.ur;if(!R.length||R[R.length-1][1]!==B)R.push([i,B]);
  let mo=0;if(M){const G=OVL.gd,c=M.m||OV_EYE;while(G.length%4)G.push(0);mo=G.length/4+1;
    G.push(c[0],c[1],c[2],c[3],c[4],c[5],c[6],c[7],c[8],c[9],c[10],c[11],M.grain||0,(M.seed||0)%65536,0,0);}
  Q.push(0,0,0,0,m[0],m[1],m[2],m[3],3,rot||0,B.inv?1:0,mo,x*s,y*s,w*s/2,h*s/2,u0,v0,u1,v1);
}
/* M у ovImage: {m:[12] — строки R, G, B по (r, g, b, сдвиг) в долях единицы, grain — размах зерна (±grain/2),
   seed — посев}; без m — цвет как есть. Фильтры альбома (25g1): сепия и ночь — яркость во все каналы,
   холод — контраст со сдвигом; смешениями такое не выражается */
const OV_EYE=[1,0,0,0, 0,1,0,0, 0,0,1,0];
/* холст cv (webgpu) — картинка ov* одним проходом, в кадре (кадровый энкодер) или вне его: тогда свой
   энкодер, отправка сразу и корзина опорожняется здесь же, кадра за ней нет. Холст держит картинку, пока
   его не нарисуют снова. fn вернул false — ничего; false — и без видеокарты */
const OV_CV=new WeakMap();
function ovPaint(cv,nd,fn){
  const d=GPU.dev;if(!GPU.ok||GPU.lost||!d)return false;
  let o=OV_CV.get(cv);
  if(!o||o.dev!==d){const cx=cv.getContext("webgpu");if(!cx)return false;
    cx.configure({device:d,format:GPU.fmt,alphaMode:"premultiplied"});OV_CV.set(cv,o={cx,T:ovTarget(),dev:d});}
  const own=!GPU.enc,on0=GPU.on;let ok;
  if(own){GPU.enc=d.createCommandEncoder();GPU.on=true;}   /* свой маленький кадр: студия спрашивает «кадр идёт?» */
  try{
    ovInto(o.T,nd,()=>{ok=fn();});
    if(ok===false){o.T.uq.length=o.T.ur.length=o.T.gd.length=0;return false;}
    ovPass(o.T,o.cx.getCurrentTexture().createView(),cv.width,cv.height,[o.T.uq],"ovpaint");
    if(own)d.queue.submit([GPU.enc.finish()]);
  }finally{if(own){GPU.enc=null;GPU.on=on0;}}
  if(own){for(const t of GPU.trash)t.destroy();GPU.trash.length=0;}
  return true;
}
/* вне кадра: ovPaint в свой холст w×h и чтение в той же задаче — как снимок кадра (gpuTakeSnap).
   Для приборов и тестов, не для кадра: из кадра (энкодер открыт) — null */
const OVR={cv:null,rd:null};
function ovRead(w,h,fn){
  if(GPU.enc||typeof document==="undefined")return null;
  const R=OVR;if(!R.cv){R.cv=document.createElement("canvas");R.rd=document.createElement("canvas");}
  if(R.cv.width!==w||R.cv.height!==h){R.cv.width=w;R.cv.height=h;}
  if(!ovPaint(R.cv,1,fn))return null;
  if(R.rd.width!==w||R.rd.height!==h){R.rd.width=w;R.rd.height=h;}
  const c=R.rd.getContext("2d",{willReadFrequently:true});
  c.clearRect(0,0,w,h);c.drawImage(R.cv,0,0);
  return c.getImageData(0,0,w,h).data;
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
/* ломаная a→b→c толщиной w, концы и стык круглые (шеврон одним покрытием, как путь 2D) */
function ovCap3(ax,ay,bx,by,cx,cy,w,col,al){
  const s=ovNd(),r=w*s/2,X=[ax*s,bx*s,cx*s],Y=[ay*s,by*s,cy*s];
  ovPush(OVL.uq,Math.min(...X)-r,Math.min(...Y)-r,Math.max(...X)+r,Math.max(...Y)+r,ovPm(col,al),5,0,0,0,[X[0],Y[0],X[1],Y[1],r,1,X[2],Y[2]]);
}
/* дуга окружности: центр, радиус, от угла a0 размахом sw (0 < sw < 2π), толщина w, концы круглые */
function ovArc(cx,cy,R,a0,sw,w,col,al){
  const s=ovNd(),X=cx*s,Y=cy*s,Rr=Math.max(.5,R*s),h=w*s/2;
  ovPush(OVL.uq,X-Rr-h,Y-Rr-h,X+Rr+h,Y+Rr+h,ovPm(col,al),6,0,0,0,[X,Y,Rr,Rr,h,0,a0,sw]);
}
/* выпуклый четырёхугольник A B C D в пикселях CSS (обход любой) с линейным градиентом прозрачности:
   g0 у середины DA, g1 у середины BC — как createLinearGradient по оси ленты, одним покрытием без швов */
function ovQuad(ax,ay,bx,by,cx,cy,dx,dy,col,al,g0,g1){
  const s=ovNd(),t=[ax*s,ay*s,bx*s,by*s,cx*s,cy*s,dx*s,dy*s],X=[t[0],t[2],t[4],t[6]],Y=[t[1],t[3],t[5],t[7]];
  ovPush(OVL.uq,Math.min(...X),Math.min(...Y),Math.max(...X),Math.max(...Y),ovPm(col,al),2,1,g0,g1,t);
}
/* график: полоса-обрез (x0,y0)–(x1,y1), точки ys по x от gx с шагом st, толщина w */
function ovGraph(x0,y0,x1,y1,gx,st,ys,w,col,al){
  const s=ovNd(),n=ys.length;if(n<2)return;
  const D=OVL.gd,o=D.length;for(let i=0;i<n;i++)D.push(ys[i]*s);
  OVL.uq.push(x0*s,y0*s,x1*s,y1*s,...ovPm(col,al),4,w*s/2,o,n,gx*s,st*s,0,0,0,0,0,0);
}
