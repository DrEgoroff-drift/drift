/* ══════════════ набор для слоёв видеокарты (docs/DESIGN-gpu.md §4) ══════════════
   Конвейер, буфер, привязки, текстура из 2D-холста — и три готовых слоя:
   gpuImage (картинки и спрайты из 2D-печки), gpuShapes (точки, отрезки, капсулы,
   прямоугольники, кольца со сглаживанием и мягкой кромкой), gpuField (поле во
   весь экран — небо, облака, свет, туман — своим кусочком WGSL). Координаты — в
   пикселях CSS, как у 2D; цвет на входе обычный, премультипликация — здесь.
   Всё живёт при устройстве: gpuInit после потери собирает заново. */
/* альфа сцены — маска корпусов (L4 k/n): фон её не трогает (1 от очистки), корпус-спрайт
   (hull) гасит её на своём покрытии, остальные смеси её не меняют. Её читает
   последний проход: волна и марево гнут фон, но не корпуса */
const GPU_KEEP_A={srcFactor:"zero",dstFactor:"one"};
const GPU_BLEND={
  over:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:GPU_KEEP_A},
  add:{color:{srcFactor:"one",dstFactor:"one"},alpha:GPU_KEEP_A},
  /* вычесть ранее прибавленное (кусок, заменённый другим: окна гостиницы) */
  sub:{color:{operation:"reverse-subtract",srcFactor:"one",dstFactor:"one"},alpha:GPU_KEEP_A},
  hull:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one-minus-src-alpha"}},
  /* умножение, как multiply у 2D на непрозрачном фоне: тьма пещеры, тени, дымка */
  mul:{color:{srcFactor:"dst",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one"}}};
function gpuPipe(name,code,blend,layout){
  const key=name+"|"+(blend||"over");
  const c=GPU.lay[key];if(c)return c;
  return GPU.lay[key]=gpuPipeline("pipe:"+key,()=>{const mod=gpuShader(code);
    return {layout:layout||"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float",blend:GPU_BLEND[blend||"over"]}]},
    primitive:{topology:"triangle-list"}};});
}
function gpuBuf(name,bytes,usage){
  const b=GPU.bufs[name];
  if(b&&b.size>=bytes)return b;
  if(b)GPU.trash.push(b);
  return GPU.bufs[name]=GPU.dev.createBuffer({size:Math.max(16,Math.ceil(bytes/16)*16),usage});
}
/* привязки кэшируются по набору ресурсов: сменился буфер или текстура — новая группа */
function gpuBind(name,pipe,res){
  const c=GPU.bgs[name];
  if(c&&c.res.length===res.length&&c.res.every((r,i)=>r===res[i]))return c.bg;
  const bg=GPU.dev.createBindGroup({layout:pipe.getBindGroupLayout(0),
    entries:res.map((r,i)=>({binding:i,resource:(r instanceof GPUBuffer)?{buffer:r}:r}))});
  GPU.bgs[name]={res,bg};return bg;
}
/* 2D-холст как текстура: печки при перепечке отдают НОВЫЙ холст, поэтому ключ —
   сам объект. Старые уходят в корзину и гибнут в начале следующего кадра */
function gpuCanvasTex(cv,ver){
  const m=GPU.cvTex;let e=m.get(cv);
  /* ver — для печек, что перерисовывают тот же холст на месте: сменилась — перезагружаем */
  if(e&&ver!==undefined&&e.ver!==ver&&e.w===cv.width&&e.h===cv.height){
    GPU.dev.queue.copyExternalImageToTexture({source:cv},{texture:e.tex,premultipliedAlpha:true},[e.w,e.h]);e.ver=ver;}
  if(e&&(e.w!==cv.width||e.h!==cv.height)){GPU.trash.push(e.tex);m.delete(cv);e=null;}
  /* попадание — в конец очереди: вытесняется давно не нужный, а не первый заведённый
     (иначе девять холстов в кадре перегружали бы друг друга каждый кадр) */
  if(e){m.delete(cv);m.set(cv,e);return e;}
  const w=cv.width,h=cv.height,U=GPUTextureUsage;
  const tex=GPU.dev.createTexture({size:[w,h],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST|U.RENDER_ATTACHMENT});
  GPU.dev.queue.copyExternalImageToTexture({source:cv},{texture:tex,premultipliedAlpha:true},[w,h]);
  e={tex,view:tex.createView(),w,h,ver};m.set(cv,e);
  if(m.size>GPU_CVTEX_CAP){const k=m.keys().next().value;GPU.trash.push(m.get(k).tex);m.delete(k);}
  return e;
}
/* в кадре живут десятки печёных холстов (дом, вывеска, Чебурек, челноки, по два слоя):
   восемь мест перегружали их по кругу каждый кадр. Печи по кеглю (bakeKeep: неон, доски,
   бегущая строка — до 30 мелких холстов) держатся здесь же, иначе проезд зума их вытеснит */
const GPU_CVTEX_CAP=64;
/* уровень детализации печёного холста: gpuImage берёт нулевой уровень, и сильно сжатый
   холст мерцает (окно дома — в пиксель). Уровни — половинки, печёт лениво; берётся тот,
   что не мельче ширины на экране devW (пиксели устройства). ver — как у gpuCanvasTex */
const CV_LVL=new WeakMap();
/* печь по ключу (ступень 1, печки за зумом): свой холст на каждый ключ — кегль, плотность;
   недавние держатся, и зум туда-обратно берёт готовое — gpuCanvasTex грузит каждый размер
   один раз. Текст так и остаётся пиксель в пиксель, без мипов и без маски */
function bakeKeep(M,key,cap,make){
  let v=M.get(key);if(v){M.delete(key);M.set(key,v);return v;}
  v=make();M.set(key,v);
  if(M.size>cap){const k=M.keys().next().value,o=M.get(k);M.delete(k);if(o&&o.drop)o.drop();}   /* выпечки GPU-холста — освободить */
  return v;
}
function gpuCvLevel(cv,ver,devW){
  let L=CV_LVL.get(cv);
  if(!L||L.ver!==ver||L.w!==cv.width||L.h!==cv.height){L={ver,w:cv.width,h:cv.height,lv:[cv],pool:L?L.lv:[]};CV_LVL.set(cv,L);}
  let i=0;while(i<5&&(cv.width>>(i+1))>=devW&&(cv.height>>(i+1))>=4)i++;
  for(let j=1;j<=i;j++)if(!L.lv[j]){
    const s=L.lv[j-1],c=L.pool[j]||document.createElement("canvas");
    c.width=Math.max(1,s.width>>1);c.height=Math.max(1,s.height>>1);
    const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);g.imageSmoothingQuality="high";g.drawImage(s,0,0,c.width,c.height);
    L.lv[j]=c;
  }
  return L.lv[i];
}
/* печёный мастер с мипами: уровни — половинки 2D, как у gpuCvLevel, но грузятся все
   сразу и один раз; трилинейный сэмплер (gpuMipSmp) берёт уровень между ними, и зум
   не перепекает и не грузит ничего. Холст мастера не перерисовывать: новая выпечка —
   новый холст, старый отдать gpuMipDrop */
const GPU_MIP=new WeakMap();
function gpuMipTex(cv){
  let e=GPU_MIP.get(cv);if(e&&e.dev===GPU.dev)return e;   /* устройство потеряно и поднято — грузим заново */
  let n=1;while(n<9&&(cv.width>>n)>=4&&(cv.height>>n)>=4)n++;
  const U=GPUTextureUsage,tex=GPU.dev.createTexture({size:[cv.width,cv.height],mipLevelCount:n,format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST|U.RENDER_ATTACHMENT});
  let s=cv;
  for(let i=0;i<n;i++){
    if(i){const c=document.createElement("canvas");c.width=Math.max(1,cv.width>>i);c.height=Math.max(1,cv.height>>i);
      const g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(s,0,0,c.width,c.height);s=c;}
    GPU.dev.queue.copyExternalImageToTexture({source:s},{texture:tex,mipLevel:i,premultipliedAlpha:true},[s.width,s.height]);
  }
  e={tex,view:tex.createView(),w:cv.width,h:cv.height,n,dev:GPU.dev};GPU_MIP.set(cv,e);GPU.mipUp=(GPU.mipUp||0)+n;
  return e;
}
function gpuMipDrop(cv){const e=GPU_MIP.get(cv);if(e){GPU.trash.push(e.tex);GPU_MIP.delete(cv);}}
function gpuMipSmp(){return GPU.S.mip||(GPU.S.mip=GPU.dev.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}));}
/* пустой #c не грузится (ворота ступени 1: в ровном полёте выгрузок холстов 0).
   cState: 0 — слой вычищен целиком и с тех пор пуст, 1 — на нём что-то есть. Следим за
   самим контекстом #c: печки рисуют в свои холсты и сюда не попадают */
function gpuFrontHook(){
  if(GPU.cHook===MAIN_CTX)return;GPU.cHook=MAIN_CTX;GPU.cState=1;
  const c=MAIN_CTX,P=CanvasRenderingContext2D.prototype;
  for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
    const o=P[k];c[k]=function(){GPU.cState=1;return o.apply(this,arguments);};}
  const cr=P.clearRect;
  c.clearRect=function(x,y,w,h){const m=this.getTransform(),x0=m.a*x+m.e,y0=m.d*y+m.f;
    if(!m.b&&!m.c&&x0<=0&&y0<=0&&x0+m.a*w>=this.canvas.width&&y0+m.d*h>=this.canvas.height)GPU.cState=0;
    return cr.apply(this,arguments);};
}
/* true — слой пуст, грузить нечего; текстуру переднего слоя чистим один раз проходом */
function gpuFrontClean(){
  gpuFrontHook();
  if(GPU.cState){GPU.fClear=false;return false;}
  if(!GPU.fClear){GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.T.front.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]}).end();GPU.fClear=true;}
  return true;
}
/* общие куски шейдеров слоёв: мерка кадра и покрытие фигур со сглаживанием.
   Покрытие честное, по площади пикселя — так же, как Skia гладит края в 2D */
const GPU_WGSL_COMMON=`
fn pmod(a:f32,m:f32)->f32{return a-m*floor(a/m);}
fn covRect(p:vec2f,r:vec4f)->f32{return clamp(min(p.x+.5,r.z)-max(p.x-.5,r.x),0.,1.)*clamp(min(p.y+.5,r.w)-max(p.y-.5,r.y),0.,1.);}
fn covDisc(p:vec2f,c:vec2f,r:f32)->f32{let re=max(r,.7);return clamp(.5-(length(p-c)-re),0.,1.)*min(1.,r*r/(re*re));}
fn covSeg(p:vec2f,a:vec2f,b:vec2f,hw:f32)->f32{
  let ab=b-a;let t=clamp(dot(p-a,ab)/max(dot(ab,ab),1e-4),0.,1.);let he=max(hw,.5);
  return clamp(.5-(length(p-a-ab*t)-he),0.,1.)*min(1.,hw/he);}
fn cubicW(v:f32)->vec4f{let n=vec4f(1.,2.,3.,4.)-v;let s=n*n*n;let x=s.x;let y=s.y-4.*s.x;let z=s.z-4.*s.y+6.*s.x;return vec4f(x,y,z,6.-x-y-z)/6.;}
fn texCubic(t:texture_2d<f32>,sm:sampler,uv:vec2f)->vec4f{
  let ts=vec2f(textureDimensions(t));var c=uv*ts-.5;let f=fract(c);c=c-f;
  let xc=cubicW(f.x);let yc=cubicW(f.y);let s=vec4f(xc.xz+xc.yw,yc.xz+yc.yw);
  let o=(c.xxyy+vec4f(-.5,1.5,-.5,1.5)+vec4f(xc.yw,yc.yw)/s)/ts.xxyy;
  let s0=textureSampleLevel(t,sm,o.xz,0.);let s1=textureSampleLevel(t,sm,o.yz,0.);
  let s2=textureSampleLevel(t,sm,o.xw,0.);let s3=textureSampleLevel(t,sm,o.yw,0.);
  let sx=s.x/(s.x+s.y);let sy=s.z/(s.z+s.w);
  return mix(mix(s3,s2,sx),mix(s1,s0,sx),sy);}`;

/* ── кадровая арена: данные слоёв за кадр ложатся подряд, у каждого вызова свой кусок ──
   Запись идёт в очередь сразу (writeBuffer), поэтому куски не мешают друг другу даже
   при отправках посреди кадра (gpuOver) */
function gpuArena(kind,floats,stride){
  let A=GPU.ar[kind];
  if(!A||A.frame!==GPU.frameNo){if(!A)A=GPU.ar[kind]={buf:null,cap:0,n:0,frame:0};A.frame=GPU.frameNo;A.n=0;}
  const need=(A.n+floats)*4;
  if(!A.buf||need>A.cap){
    if(A.buf)GPU.trash.push(A.buf);
    A.cap=Math.max(need*2,stride*4*256);A.n=0;
    A.buf=GPU.dev.createBuffer({size:A.cap,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});
  }
  const off=A.n;A.n+=floats;return {buf:A.buf,off};
}
const GPU_KIT_WGSL=`
struct KU{res:vec4f};
@group(0) @binding(0) var<uniform> ku:KU;
fn kClip(p:vec2f)->vec4f{let q=p*ku.res.z;return vec4f(q.x/ku.res.x*2.-1.,1.-q.y/ku.res.y*2.,0.,1.);}
fn kCorn(i:u32)->vec2f{var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));return c[i];}`;
function gpuKitU(){
  const U=GPUBufferUsage,b=gpuBuf("kit.u",16,U.UNIFORM|U.COPY_DST);
  if(GPU.kitUF!==GPU.frameNo){GPU.kitUF=GPU.frameNo;GPU.dev.queue.writeBuffer(b,0,new Float32Array([GPU.bw,GPU.bh,DPR,0]));}
  return b;
}
/* картинка: rects = [{x,y,w,h, a, rot, u0,v0,u1,v1, cubic}] — x,y — центр, w,h — размер в
   пикселях CSS, rot — поворот вокруг центра, u0..v1 — кусок текстуры (по умолчанию
   вся), cubic — бикубика для сильного растяжения. o.blend: over | add | mul.
   Цвет умножается на a — на сложении это усиление: a>1 даёт свет выше единицы (эмиссия).
   cv — холст или мастер gpuMipTex: мастер берётся трилинейно, уровень чуть крупнее
   экрана (GPU_MIP_LOD, как HG_LOD корпусов), и зум ничего не грузит. o.sharp — ещё и
   нерезкая маска между соседними мипами (GPU_MIP_GS, GPU_MIP_SH): 2D тянет спрайт с
   тройного холста простой билинейкой — резко, но с рябью; маска даёт ту же резкость
   из отфильтрованных уровней (пара флота 25.09). Только для вещей — корабли, находки:
   на тексте и неоне она обводит светлую букву тёмным кольцом (Контроль на 7083ac5) */
const GPU_MIP_LOD=.785,GPU_MIP_GS=.6,GPU_MIP_SH=(.9).toFixed(2);
const GPU_IMG_WGSL=GPU_KIT_WGSL+`
@group(0) @binding(1) var<storage,read> iq:array<vec4f>;
@group(0) @binding(2) var itx:texture_2d<f32>;
@group(0) @binding(3) var ism:sampler;
struct IO{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) @interpolate(flat) k:vec4f};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->IO{
  let a=iq[ii*3u];let b=iq[ii*3u+1u];let c=iq[ii*3u+2u];let cn=kCorn(vi);
  let l=(cn-.5)*a.zw;let cs=cos(b.y);let sn=sin(b.y);
  var o:IO;o.p=kClip(a.xy+vec2f(l.x*cs-l.y*sn,l.x*sn+l.y*cs));o.uv=mix(c.xy,c.zw,cn);o.k=vec4f(b.x,b.z,b.w,0.);return o;}
fn cubicW(v:f32)->vec4f{let n=vec4f(1.,2.,3.,4.)-v;let s=n*n*n;let x=s.x;let y=s.y-4.*s.x;let z=s.z-4.*s.y+6.*s.x;return vec4f(x,y,z,6.-x-y-z)/6.;}
fn texCubic(t:texture_2d<f32>,sm:sampler,uv:vec2f)->vec4f{
  let ts=vec2f(textureDimensions(t));var c=uv*ts-.5;let f=fract(c);c=c-f;
  let xc=cubicW(f.x);let yc=cubicW(f.y);let s=vec4f(xc.xz+xc.yw,yc.xz+yc.yw);
  let o=(c.xxyy+vec4f(-.5,1.5,-.5,1.5)+vec4f(xc.yw,yc.yw)/s)/ts.xxyy;
  let s0=textureSampleLevel(t,sm,o.xz,0.);let s1=textureSampleLevel(t,sm,o.yz,0.);
  let s2=textureSampleLevel(t,sm,o.xw,0.);let s3=textureSampleLevel(t,sm,o.yw,0.);
  let sx=s.x/(s.x+s.y);let sy=s.z/(s.z+s.w);return mix(mix(s3,s2,sx),mix(s1,s0,sx),sy);}
@fragment fn fs(i:IO)->@location(0) vec4f{
  let dx=dpdx(i.uv);let dy=dpdy(i.uv);
  var c:vec4f;if(i.k.y>.5){c=texCubic(itx,ism,i.uv);}
  else if(i.k.z>0.){c=textureSampleGrad(itx,ism,i.uv,dx*i.k.z,dy*i.k.z);}
  else if(i.k.z<0.){let gx=-dx*i.k.z;let gy=-dy*i.k.z;
    let a0=textureSampleGrad(itx,ism,i.uv,gx,gy);let a1=textureSampleGrad(itx,ism,i.uv,gx*2.,gy*2.);
    c=clamp(a0+(a0-a1)*${GPU_MIP_SH},vec4f(0.),vec4f(1.));c=vec4f(min(c.rgb,vec3f(c.a)),c.a);}
  else{c=textureSampleLevel(itx,ism,i.uv,0.);}
  return c*i.k.x;}`;
function gpuImage(pass,cv,rects,o){
  if(!pass||!rects.length)return;
  const blend=(o&&o.blend)||"over",P=gpuPipe("kit.img",GPU_IMG_WGSL,blend);
  const n=rects.length,A=gpuArena("img",n*12,12),f=new Float32Array(n*12),mip=!!cv.view,gs=mip?(o&&o.sharp?-GPU_MIP_GS:(o&&o.lod)||GPU_MIP_LOD):0;   /* <0 — с маской; o.lod — свой масштаб уровня */
  for(let i=0;i<n;i++){const r=rects[i],k=i*12;
    f[k]=r.x;f[k+1]=r.y;f[k+2]=r.w;f[k+3]=r.h;f[k+4]=r.a==null?1:r.a;f[k+5]=r.rot||0;f[k+6]=r.cubic?1:0;f[k+7]=gs;
    f[k+8]=r.u0||0;f[k+9]=r.v0||0;f[k+10]=r.u1==null?1:r.u1;f[k+11]=r.v1==null?1:r.v1;}
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,f);
  if(mip&&cv.draw&&cv.dev!==GPU.dev)gpuBakeRedo(cv);   /* выпечка GPU-холста пережила потерю устройства — печём заново */
  const t=mip?cv:gpuCanvasTex(cv,o&&o.ver);   /* o.ver — печка перерисовала тот же холст на месте */
  pass.setPipeline(P);
  pass.setBindGroup(0,gpuBind("kit.img|"+blend,P,[gpuKitU(),A.buf,t.view,mip?gpuMipSmp():GPU.S.lin]));
  pass.draw(6,n,0,A.off/12);
}
/* фигуры: items = [[вид, x0,y0,x1,y1, hw, soft, r,g,b,a]] в пикселях CSS, цвет 0..255 и a 0..1:
   вид 0 — прямоугольник (x0,y0)-(x1,y1); 1 — круг (x0,y0) радиуса x1; 2 — отрезок-капсула
   (x0,y0)-(x1,y1) полутолщины hw; 3 — кольцо (x0,y0) радиуса x1 толщины hw;
   4 — повёрнутый прямоугольник: центр (x0,y0), полуразмеры (x1,y1), угол hw;
   5 — треугольник (x0,y0)-(x1,y1)-(hw,soft), без мягкой кромки (грани скал, полотнища);
   двенадцатое поле — маска жёстких рёбер (1 — первое-второе, 2 — второе-третье, 4 — третье-первое):
   внутреннее ребро сетки жёсткое, пиксель достаётся ровно одному треугольнику — ни шва, ни
   лишнего света у острых углов; наружные гладятся по полуплоскости.
   soft>0 — мягкая кромка такой ширины (свечение, боке); o.blend: over | add */
const GPU_SHP_WGSL=GPU_KIT_WGSL+GPU_WGSL_COMMON+`
@group(0) @binding(1) var<storage,read> sq:array<vec4f>;
struct SO{@builtin(position) p:vec4f,@location(0) col:vec4f,@location(1) @interpolate(flat) g:vec4f,@location(2) @interpolate(flat) h:vec4f};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->SO{
  let a=sq[ii*3u];let b=sq[ii*3u+1u];let c=sq[ii*3u+2u];let k=a.x;let d=ku.res.z;
  let g=vec4f(a.yzw,b.x);let hw=b.y;let so=b.z;let m=1./d+so;
  var lo:vec2f;var hi:vec2f;var h=vec4f(k,hw*d,so*d,0.);
  if(k<.5){lo=g.xy-m;hi=g.zw+m;}
  else if(k>4.5){let t=vec2f(hw,so);lo=min(min(g.xy,g.zw),t)-1./d;hi=max(max(g.xy,g.zw),t)+1./d;h.w=b.w;}
  else if(k>3.5){let r=length(g.zw);lo=g.xy-r-m;hi=g.xy+r+m;h.y=hw;}
  else if(k<1.5||k>2.5){let r=g.z+hw;lo=g.xy-r-m;hi=g.xy+r+m;}
  else{lo=min(g.xy,g.zw)-hw-m;hi=max(g.xy,g.zw)+hw+m;}
  var o:SO;o.p=kClip(mix(lo,hi,kCorn(vi)));o.col=c;o.g=g*d;o.h=h;return o;}
fn eCov(p:vec2f,a:vec2f,b:vec2f,sg:f32,hard:bool)->f32{
  let e=b-a;let dd=dot(p-a,vec2f(e.y,-e.x)*sg)/max(length(e),1e-4);
  return select(clamp(.5-dd,0.,1.),select(0.,1.,dd<=0.),hard);}
fn sdTri(p:vec2f,a:vec2f,b:vec2f,c:vec2f)->f32{
  let e0=b-a;let e1=c-b;let e2=a-c;let v0=p-a;let v1=p-b;let v2=p-c;
  let q0=v0-e0*clamp(dot(v0,e0)/max(dot(e0,e0),1e-6),0.,1.);
  let q1=v1-e1*clamp(dot(v1,e1)/max(dot(e1,e1),1e-6),0.,1.);
  let q2=v2-e2*clamp(dot(v2,e2)/max(dot(e2,e2),1e-6),0.,1.);
  let s=sign(e0.x*e2.y-e0.y*e2.x);
  let w=min(min(vec2f(dot(q0,q0),s*(v0.x*e0.y-v0.y*e0.x)),vec2f(dot(q1,q1),s*(v1.x*e1.y-v1.y*e1.x))),vec2f(dot(q2,q2),s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(w.x)*sign(w.y);}
@fragment fn fs(i:SO)->@location(0) vec4f{
  var p=i.p.xy;let k=i.h.x;var cov=0.;
  if(k>4.5){let A=i.g.xy;let B=i.g.zw;let C=i.h.yz;let m=u32(i.h.w+.5);var c=0.;
    if(m==0u){c=clamp(.5-sdTri(p,A,B,C),0.,1.);}
    else{let sg=sign((B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x));
      c=min(min(eCov(p,A,B,sg,(m&1u)!=0u),eCov(p,B,C,sg,(m&2u)!=0u)),eCov(p,C,A,sg,(m&4u)!=0u));}
    let al=i.col.a*c;return vec4f(i.col.rgb*al,al);}
  if(k>3.5){let cs=cos(i.h.y);let sn=sin(i.h.y);let v=p-i.g.xy;p=vec2f(v.x*cs+v.y*sn,-v.x*sn+v.y*cs);}
  if(i.h.z>0.){
    var dist=0.;
    if(k>3.5){let q=abs(p)-i.g.zw;dist=length(max(q,vec2f(0.)))+min(max(q.x,q.y),0.);}
    else if(k<.5){let q=abs(p-(i.g.xy+i.g.zw)*.5)-(i.g.zw-i.g.xy)*.5;dist=length(max(q,vec2f(0.)))+min(max(q.x,q.y),0.);}
    else if(k<1.5){dist=length(p-i.g.xy)-i.g.z;}
    else if(k<2.5){let ab=i.g.zw-i.g.xy;let t=clamp(dot(p-i.g.xy,ab)/max(dot(ab,ab),1e-4),0.,1.);dist=length(p-i.g.xy-ab*t)-i.h.y;}
    else{dist=abs(length(p-i.g.xy)-i.g.z)-i.h.y;}
    cov=1.-smoothstep(-.5,i.h.z,dist);
  }else if(k>3.5){cov=covRect(p,vec4f(-i.g.zw,i.g.zw));}
  else if(k<.5){cov=covRect(p,i.g);}
  else if(k<1.5){cov=covDisc(p,i.g.xy,i.g.z);}
  else if(k<2.5){cov=covSeg(p,i.g.xy,i.g.zw,i.h.y);}
  else{let dd=abs(length(p-i.g.xy)-i.g.z);cov=clamp(.5-(dd-max(i.h.y,.5)),0.,1.)*min(1.,i.h.y/max(i.h.y,.5));}
  let al=i.col.a*cov;return vec4f(i.col.rgb*al,al);}`;
/* выпуклый четырёхугольник a-b-c-d (точки [x,y]) цветом [r,g,b,a]: два треугольника с жёсткой
   общей диагональью. hard — маска жёстких сторон ab,bc,cd,da (1,2,4,8): стыки полос и срезов */
function gpuQuad(SH,a,b,c,d,C,hard){
  const h=hard|0,al=C[3]==null?1:C[3];
  SH.push([5,a[0],a[1],b[0],b[1],c[0],c[1],C[0],C[1],C[2],al,4|(h&1)|(h&2)],
    [5,a[0],a[1],c[0],c[1],d[0],d[1],C[0],C[1],C[2],al,1|(h&4?2:0)|(h&8?4:0)]);
}
function gpuShapes(pass,items,o){
  if(!pass||!items.length)return;
  const blend=(o&&o.blend)||"over",P=gpuPipe("kit.shp",GPU_SHP_WGSL,blend);
  const n=items.length,A=gpuArena("shp",n*12,12),f=new Float32Array(n*12);
  for(let i=0;i<n;i++){const t=items[i],k=i*12;
    f[k]=t[0];f[k+1]=t[1];f[k+2]=t[2];f[k+3]=t[3];f[k+4]=t[4];f[k+5]=t[5]||0;f[k+6]=t[6]||0;
    f[k+7]=t[11]||0;f[k+8]=t[7]/255;f[k+9]=t[8]/255;f[k+10]=t[9]/255;f[k+11]=t[10];}
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,f);
  pass.setPipeline(P);
  pass.setBindGroup(0,gpuBind("kit.shp|"+blend,P,[gpuKitU(),A.buf]));
  pass.draw(6,n,0,A.off/12);
}
/* поле во весь экран: code определяет fn field(p:vec2f,uv:vec2f)->vec4f (p — пиксели CSS,
   ответ — премультиплицированный цвет) и читает fu.v[0..14] (свои числа, vec4) и
   текстуры t0..t3 через smp (линейная выборка; лишние — заглушки). uni — до 60 чисел.
   Вызовов за кадр — сколько угодно: у каждого свой кусок равномерного буфера */
const GPU_FLD_HEAD=`
struct FU{res:vec4f,v:array<vec4f,15>};
@group(0) @binding(0) var<uniform> fu:FU;
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var t0:texture_2d<f32>;
@group(0) @binding(3) var t1:texture_2d<f32>;
@group(0) @binding(4) var t2:texture_2d<f32>;
@group(0) @binding(5) var t3:texture_2d<f32>;
struct FO{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->FO{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:FO;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
@fragment fn fs(i:FO)->@location(0) vec4f{return field(i.uv*fu.res.zw,i.uv);}
`;
function gpuField(pass,name,code,uni,texs,o){
  if(!pass)return;
  const d=GPU.dev,blend=(o&&o.blend)||"over";
  if(!GPU.fL){
    const F=GPUShaderStage.FRAGMENT|GPUShaderStage.VERTEX,e=[{binding:0,visibility:F,buffer:{type:"uniform"}},{binding:1,visibility:F,sampler:{type:"filtering"}}];
    for(const b of [2,3,4,5])e.push({binding:b,visibility:F,texture:{sampleType:"float"}});
    GPU.fL=d.createBindGroupLayout({entries:e});GPU.fPL=d.createPipelineLayout({bindGroupLayouts:[GPU.fL]});
  }
  const P=gpuPipe("fld."+name,GPU_WGSL_COMMON+GPU_FLD_HEAD+code,blend,GPU.fPL);
  let A=GPU.ar.fld;
  if(!A||A.frame!==GPU.frameNo){if(!A)A=GPU.ar.fld={buf:null,n:0,frame:0,cap:0};A.frame=GPU.frameNo;A.n=0;}
  if(!A.buf||(A.n+1)*256>A.cap){
    if(A.buf)GPU.trash.push(A.buf);
    A.cap=Math.max(256*64,(A.n+1)*512);A.n=0;
    A.buf=d.createBuffer({size:A.cap,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  }
  const slot=A.n++,f=new Float32Array(64);
  f[0]=GPU.bw;f[1]=GPU.bh;f[2]=W;f[3]=H;if(uni)f.set(uni.subarray?uni.subarray(0,60):uni.slice(0,60),4);
  d.queue.writeBuffer(A.buf,slot*256,f);
  const tv=[0,1,2,3].map(k=>(texs&&texs[k])?(texs[k].view||gpuCanvasTex(texs[k]).view):GPU.nView||(GPU.nView=GPU.N.createView()));
  /* привязка на слот: пересобирается, только если сменился буфер или текстуры */
  const key="fld."+slot;let c=GPU.bgs[key];
  const sm=(o&&o.smp)||GPU.S.lin;   /* o.smp — свой сэмплер (трилинейный у мастеров с мипами) */
  if(!c||c.buf!==A.buf||c.sm!==sm||c.t[0]!==tv[0]||c.t[1]!==tv[1]||c.t[2]!==tv[2]||c.t[3]!==tv[3]){
    c=GPU.bgs[key]={buf:A.buf,sm,t:tv,bg:d.createBindGroup({layout:GPU.fL,entries:[
      {binding:0,resource:{buffer:A.buf,offset:slot*256,size:256}},{binding:1,resource:sm},
      {binding:2,resource:tv[0]},{binding:3,resource:tv[1]},{binding:4,resource:tv[2]},{binding:5,resource:tv[3]}]})};
  }
  pass.setPipeline(P);pass.setBindGroup(0,c.bg);pass.draw(3);
}
