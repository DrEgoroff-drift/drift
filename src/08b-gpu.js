/* ══════════════ видеокарта: кадр рисует WebGPU (docs/DESIGN-gpu.md) ══════════════
   Решение автора (23.09): всё, что умеет видеокарта, — на видеокарте; чего не
   умеет (текст, сложные векторные фигуры) — рисует Canvas 2D на #c, и #c ложится в
   кадр текстурой. Старого 2D-кадра больше нет: без WebGPU игра честно говорит,
   какой нужен браузер. #c невидим (opacity 0) и по-прежнему ловит палец.
   Кадр: сцена видеокарты (gpuScene) → #c поверх → свечение, зерно, виньетка,
   хроматика, дизеринг одним проходом. Всё, что над миром, — слой #ovl над канвой (08bi). */
const GPU={ok:false,on:false,lost:false,busy:false,none:false,
  dev:null,cv:null,gx:null,fmt:"",L:null,P:{},B:{},S:null,U:null,UA:new Float32Array(132),shaft:null,lens:null,lt:[],oc:[],sepH:[],dz:[],
  T:{},V:{},N:null,noiseOk:false,ui:null,uctx:null,snap:null,
  bw:0,bh:0,qw:2,qh:2,dpr:0,cw:0,ch:0,enc:null,scenePass:null,sceneOn:false,
  sceneBg:{r:0,g:0,b:0,a:1},uiOn:false,hitK:0,hitDx:0,post:{k:0,grain:0,vig:0},
  lay:{},bufs:{},bgs:{},cvTex:new Map(),trash:[],errs:0,frameNo:0,snapNo:-1,wantSnap:false,overPass:null,
  ar:{},fL:null,
  /* выключатели для замера (?g11=deep, 28z): bloom, front — вклейка #c, fin — голый финал */
  kill:{}};

/* кадр целиком (видеокарта + 2D) для тех, кто его читает: look(), детекторы,
   эталоны. Показанный кадр WebGPU после конца задачи не читается, поэтому снимок
   делает сам кадр — сразу после отправки, в той же задаче (gpuPresent). Если
   свежего снимка нет, рисуем кадр вне цикла: drawWorld() сам его соберёт */
function gpuSnapshot(){
  if(!GPU.ok||!GPU.cv)return cvs;
  if(GPU.snapNo!==GPU.frameNo&&!GPU.on)drawWorld();
  return GPU.snap||cvs;
}
function gpuTakeSnap(){
  const c=GPU.snap||(GPU.snap=document.createElement("canvas"));
  if(c.width!==GPU.cv.width||c.height!==GPU.cv.height){c.width=GPU.cv.width;c.height=GPU.cv.height;}
  const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(GPU.cv,0,0);
  chipDomSnap(g,c.width/Math.max(1,W));
  GPU.snapNo=GPU.frameNo;
}
async function gpuInit(){
  if(GPU.ok||GPU.busy)return;
  if(typeof navigator==="undefined"||!navigator.gpu){gpuNone("navigator.gpu");return;}
  GPU.busy=true;
  try{
    const ad=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});
    if(!ad){gpuNone("адаптера нет");return;}
    /* метки времени проходов — для пробы ?g11=deep (28z gpuTs); без пробы не пишутся */
    const tsf=ad.features.has("timestamp-query")?["timestamp-query"]:[];
    /* половинная точность (P2 25.09): лестница свечения и первый проход написаны над
       псевдонимами H/H3/H4 (перед шейдером) и могут собираться в f16. Замер на S23
       (Adreno 7xx, 0.460.0): один запрос фичи замедлил ВСЕ проходы на ~6 % (туманность
       2.43→2.63 мс, under 3.30→3.50), лестнице не дал ничего — она упирается в выборки.
       Поэтому по умолчанию f32; ?f16=1 запрашивает фичу для замера на другом устройстве */
    GPU.f16=ad.features.has("shader-f16")&&location.search.indexOf("f16=1")>=0;if(GPU.f16)tsf.push("shader-f16");
    const dev=await ad.requestDevice({requiredFeatures:tsf});GPU.tsOk=tsf.indexOf("timestamp-query")>=0;
    try{const inf=ad.info||{};GPU.arch=[inf.vendor,inf.architecture,inf.device].filter(Boolean).join("/");}catch(_){GPU.arch="";}
    GPU.dev=dev;GPU.lost=false;
    dev.lost.then(i=>{if(GPU.dev===dev&&!(i&&i.reason==="destroyed"))gpuDrop("устройство потеряно: "+((i&&i.message)||""),true);});
    /* ошибка проверки — наш промах в шейдере или привязке: в журнал сбоев (не
       больше десятка за сеанс), кадр идёт дальше */
    dev.addEventListener("uncapturederror",e=>{if(GPU.errs++<10)try{crashShip("gpu","ошибка: "+String((e.error&&e.error.message)||e.error),"");}catch(_){}});
    if(!GPU.cv){
      const cv=document.createElement("canvas");cv.id="g";
      /* поверх #c, но прозрачен для пальца: события слушает #c (15-input, 15a-helm) */
      cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none";
      cvs.after(cv);GPU.cv=cv;
    }
    GPU.gx=GPU.cv.getContext("webgpu");
    GPU.fmt=navigator.gpu.getPreferredCanvasFormat();
    GPU.gx.configure({device:dev,format:GPU.fmt,alphaMode:"opaque"});
    gpuPipes();
    GPU.lay={};GPU.bufs={};GPU.bgs={};GPU.cvTex=new Map();GPU.trash=[];GPU.ar={};GPU.fL=null;GPU.nView=null;
    GPU.T={};GPU.bw=0;GPU.ok=true;
    gpuResize();gcPool();gpuPipesWarm(GPU_PIPE_KEYS);   /* конвейеры полёта — за заставкой (08b0) */
  }catch(e){
    GPU.ok=false;gpuNone("init: "+((e&&e.message)||e));
  }finally{GPU.busy=false;}
}
/* ── проходы поста: общий треугольник на весь экран, одна раскладка привязок ── */
const GPU_POST_WGSL=`
struct U{res:vec2f,css:vec2f,dpr:f32,k:f32,grain:f32,vig:f32,hitK:f32,hitDx:f32,ui:f32,scene:f32,qres:vec2f,sigma:f32,t:f32,sh:vec4f,shc:vec4f,hl:array<vec4f,8>,ln:vec4f,lc:vec4f,dn:vec4f,dz:array<vec4f,16>};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var sl:sampler;
@group(0) @binding(2) var sr:sampler;
@group(0) @binding(3) var tScene:texture_2d<f32>;
@group(0) @binding(4) var tFront:texture_2d<f32>;
@group(0) @binding(5) var tBloom:texture_2d<f32>;
@group(0) @binding(6) var tUi:texture_2d<f32>;
@group(0) @binding(7) var tNoise:texture_2d<f32>;
@group(0) @binding(8) var tEmit:texture_2d<f32>;
@group(0) @binding(9) var tBloomU:texture_2d<f32>;
struct V{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->V{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:V;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
/* свет (L2): сцена — rgba16f, ядро звезды, огонь и густой газ светят выше единицы. На
   экран кадр сводит плечо по каждому каналу: до .75 — как было, выше — мягко к единице,
   без плато (жёсткая обрезка давала плоские пятна). Яркий оранжевый уходит в золото,
   за единицей — в белый, как плёнка; плечо по старшему каналу держало оттенок, но кадр
   от него выцветал в бежевый, а диск звезды — в розовый блин. Интерфейс — после плеча.
   На земле и в помещениях (u.dn.y — доля, gpuHueFor) плечо — по старшему каналу: там свет
   рисован красками экрана, и лампа, огонь, фонарь по каналам выцветали в белый (Контроль
   26.09, пять сцен). Оттенок держится; белеет только то, что светит много выше единицы */
fn tone(c:vec3f)->vec3f{
  let K=.75;let x=max(c-vec3f(K),vec3f(0.));
  let pc=min(c,vec3f(K))+(1.-K)*(vec3f(1.)-exp(-x/(1.-K)));
  let m=max(c.r,max(c.g,c.b));
  if(u.dn.y<=0.||m<=K){return pc;}
  let t=K+(1.-K)*(1.-exp(-(m-K)/(1.-K)));
  return mix(pc,mix(c*(t/m),vec3f(t),smoothstep(2.,8.,m)),u.dn.y);}
/* L4: преломление — горячий воздух за соплом и ударная волна разрыва не рисуются, а
   сдвигают то, что за ними (сцену). Источники кладёт gpuDistort: марево — вдоль факела,
   шум сносится потоком, доли пикселя; волна — кольцо, производная гауссианы по радиусу */
fn dh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn dnz(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(dh(i),dh(i+vec2f(1.,0.)),w.x),mix(dh(i+vec2f(0.,1.)),dh(i+vec2f(1.,1.)),w.x),w.y);}
fn distort(px:vec2f)->vec2f{
  var o=vec2f(0.);let n=i32(u.dn.x);
  for(var i=0;i<8;i++){
    if(i>=n){break;}
    let A=u.dz[i*2];let B=u.dz[i*2+1];let d=px-A.xy;
    if(B.w<.5){
      let s=dot(d,A.zw);let q=dot(d,vec2f(-A.w,A.z));let L=B.x;let R=B.y;
      if(s<-R||s>L*1.3){continue;}
      let w=R*(.7+1.1*clamp(s/L,0.,1.));
      let m=exp(-q*q/(w*w))*smoothstep(-R,R*.6,s)*(1.-smoothstep(L*.5,L*1.3,s));
      let ns=vec2f(s/R*.8-u.t*.2,q/R*.8);
      o=o+vec2f(dnz(ns)-.5,dnz(ns+vec2f(17.3,5.1))-.5)*2.*m*B.z;
    }else{
      let r=length(d);let x=(r-A.z)/A.w;
      if(abs(x)>3.){continue;}
      o=o+d/max(r,1e-3)*B.x*x*exp(-x*x)*2.33;
    }
  }
  return o;}
/* маска корпусов: спрайты видеокарты гасят альфу сцены (08c hull), 2D-корпуса кладут своё
   покрытие в альфу слоя огней (fsComp) */
fn hullM(uv:vec2f)->f32{
  if(u.scene<.5){return 0.;}
  let s=textureSampleLevel(tScene,sl,uv,0.).a;let e=textureSampleLevel(tEmit,sl,uv,0.).a;
  return smoothstep(.01,.25,max(1.-s,e));}
/* мягкая маска: у кромки корпуса сдвиг сходит на нет за ~6 px, а не рвётся ступенькой */
fn hullSoft(uv:vec2f)->f32{
  var m=hullM(uv);
  for(var i=0;i<8;i++){let a=f32(i)*.7854;let d=vec2f(cos(a),sin(a))/u.css;
    m=max(m,max(hullM(uv+d*2.5)*.8,hullM(uv+d*6.)*.4));}
  return m;}
fn sceneAt(uv:vec2f)->vec3f{
  if(u.scene>.5){return max(textureSampleLevel(tScene,sl,uv,0.).rgb,vec3f(0.));}
  return vec3f(0.);}
/* кадр = сцена видеокарты под передним 2D-слоем (премультиплицированным) */
fn frameAt(uv:vec2f)->vec3f{
  let f=textureSampleLevel(tFront,sl,uv,0.);
  return tone(sceneAt(uv))*(1.-f.a)+f.rgb;}
/* колено свечения: ниже порога не светит, выше растёт плавно */
fn knee(c:vec3f,th:f32)->vec3f{
  let m=max(c.r,max(c.g,c.b));let kn=th*.4;
  let sk=clamp(m-th+kn,0.,2.*kn);let q=max(sk*sk/(4.*kn),m-th);
  return c*q/max(m,1e-4);}
/* те же плечо и колено в половинной точности (P2) — для лестницы свечения */
fn toneH(c:H3)->H3{
  let K=H(.75);let x=max(c-H3(K),H3(0.));
  let pc=min(c,H3(K))+(H(1.)-K)*(H3(1.)-exp(-x/(H(1.)-K)));
  let m=max(c.r,max(c.g,c.b));
  if(u.dn.y<=0.||m<=K){return pc;}
  let t=K+(H(1.)-K)*(H(1.)-exp(-(m-K)/(H(1.)-K)));
  return mix(pc,mix(c*(t/m),H3(t),smoothstep(H(2.),H(8.),m)),H(u.dn.y));}
fn kneeH(c:H3,th:H)->H3{
  let m=max(c.r,max(c.g,c.b));let kn=th*H(.4);
  let sk=clamp(m-th+kn,H(0.),H(2.)*kn);let q=max(sk*sk/(H(4.)*kn),m-th);
  return c*q/max(m,H(1e-3));}
/* 2D рисует в тонах экрана, и огонь в нём упирается в единицу. Что почти упёрлось
   и при этом цветное (ходовые огни, сердце факела, луч) — источник: на экране он
   остаётся своего цвета, а свечению отдаёт то, что светил бы сверх единицы, — узкий
   ореол своего цвета. Белая краска корпуса и надписи — не огонь: порог по цвету */
fn emit(c:vec3f)->vec3f{
  let m=max(c.r,max(c.g,c.b));let s=(m-min(c.r,min(c.g,c.b)))/max(m,1e-4);
  return knee(c,.9)*150.*smoothstep(.25,.5,s);}
/* что светит сверх плеча (выше 1.4): звезда — во столько раз ярче газа и факела, во
   сколько светит; и огни 2D, вклеенные в сцену (tEmit). Последний передний слой —
   фишки и метки интерфейса: он закрывает свет своей плотностью, но сам не светит */
fn frameHdr(uv:vec2f)->vec3f{
  let f=textureSampleLevel(tFront,sl,uv,0.);
  let e=textureSampleLevel(tEmit,sl,uv,0.).rgb;
  return (knee(sceneAt(uv),1.4)+e)*(1.-f.a);}
/* свечение (L2): до шести уровней одной текстуры с мипами. Первый — четверть кадра
   ящиком 4×4 (точки не мерцают): квадрат кадра в тонах экрана, как в 2D, и всё, что
   сцена светит выше плеча. Дальше уровень вдвое мельче и строже (колено по уровню);
   обратно вверх — сумма верхних уровней одним проходом (fsMipUp1), финал читает две выборки: узкое
   свечение — от всего яркого, широкое — от того, что много выше единицы (звезда).
   У факела и газа ореол узкий, у звезды широкий, пелены на полкадра нет */
@fragment fn fsDown(v:V)->@location(0) vec4f{
  /* frameAt и frameHdr вручную (P1). Краска корпусов (альфа сцены 0) не светит,
     свой корабль (круг u.hl) — вполовину (п.3) */
  let fp=1./u.qres;var c=H3(0.);var h=H3(0.);let sc=H(u.scene);
  for(var j=0;j<4;j++){for(var i=0;i<4;i++){
    let q=v.uv+((vec2f(f32(i),f32(j))+.5)/4.-.5)*fp;
    let f=H4(textureSampleLevel(tFront,sl,q,0.));let S=H4(textureSampleLevel(tScene,sl,q,0.));let s=max(S.rgb,H3(0.))*sc;let a=H(1.)-f.a;
    c+=(toneH(s)*a+f.rgb)*(H(1.)-(H(1.)-H(.5)*H(silK(q)))*sc*(H(1.)-S.a));h+=(kneeH(s,H(1.4))+H3(textureSampleLevel(tEmit,sl,q,0.).rgb))*a;}}
  c=c/H(16.);return vec4f(vec3f(c*c+h/H(16.)),1.);}
fn bs(uv:vec2f)->H3{return H3(textureSampleLevel(tBloom,sl,uv,0.).rgb);}
@fragment fn fsMipDn(v:V)->@location(0) vec4f{
  let h=.5/vec2f(textureDimensions(tBloom));let uv=v.uv;
  let c=bs(uv)*H(4.)+bs(uv-h)+bs(uv+h)+bs(uv+vec2f(h.x,-h.y))+bs(uv-vec2f(h.x,-h.y));
  let lv=log2(u.qres.x/f32(textureDimensions(tBloom).x));
  if(lv<1.5){return vec4f(vec3f(c/H(8.)),1.);}
  return vec4f(vec3f(kneeH(c/H(8.),H(.45*(lv-1.)))),1.);}
/* вверх — читает финал (P1 25.09): на каждом уровне шатёр в восемь выборок, вес — как у
   прежней цепочки подъёма, .72 за уровень и теплота по уровню, накопленные сверху вниз.
   Дальние уровни чуть теплее: широкий ореол звезды тёплый, как рассеяние в оптике, узкий
   у огней — своего цвета; дальний уровень слабее ближнего — ореол сходит на нет, а не
   стоит пеленой. Пять проходов подъёма ушли: на плиточной видеокарте телефона проход —
   это выгрузка и загрузка плитки, а уровни в нём крошечные */
fn bl(uv:vec2f,l:f32)->H3{return H3(textureSampleLevel(tBloom,sl,uv,l).rgb);}
fn bloomUp(uv:vec2f)->vec3f{
  var c=H3(0.);var w=H3(1.);let n=i32(textureNumLevels(tBloom));
  for(var i=1;i<n;i++){
    let lv=f32(i);let h=.5/vec2f(textureDimensions(tBloom,i));
    var t=bl(uv+vec2f(-2.*h.x,0.),lv)+bl(uv+vec2f(2.*h.x,0.),lv)+bl(uv+vec2f(0.,-2.*h.y),lv)+bl(uv+vec2f(0.,2.*h.y),lv);
    t=t+H(2.)*(bl(uv+vec2f(-h.x,h.y),lv)+bl(uv+h,lv)+bl(uv+vec2f(h.x,-h.y),lv)+bl(uv-h,lv));
    w=w*mix(H3(1.),H3(1.,.9,.74),H(smoothstep(1.5,4.5,lv)*.5))*H(.72);
    c=c+t/H(12.)*w;}
  return vec3f(c);}
/* сумма верхних уровней — одним проходом в размере первого уровня (S23 25.09: финал, читавший
   пять уровней на полном разрешении, стоил +.34 мс; десять крошечных проходов лестницы —
   .12 мс: проход на Adreno дёшев, дороги выборки на полном кадре) */
@fragment fn fsMipUp1(v:V)->@location(0) vec4f{return vec4f(bloomUp(v.uv),1.);}
fn bloomAt(uv:vec2f)->vec3f{return textureSampleLevel(tBloom,sl,uv,0.).rgb+textureSampleLevel(tBloomU,sl,uv,0.).rgb;}
/* корпус на ярком газе — силуэтом (L1): только у корпусов (hl — круги, их отмечает
   drawHull), интерфейсу ничего. Сам корпус на ярком газе темнеет, как против света,
   огни остаются; на тёмном газе корпус не трогается. L3 3/n: тёмной каймы вокруг больше
   нет (туманность за кораблём его тень не получает — облако читалось грязью); вместо неё
   кромку обводит свет газа за ней: там, где нормаль рельефа смотрит вбок, корпус берёт
   цвет газа, взятого снаружи по нормали, × (1-n.z)³. На тёмном космосе обвода нет.
   Ответ — премультиплицированный слой поверх s (газа под ним) */
fn silK(uv:vec2f)->f32{
  let px=uv*u.css;var hk=0.;
  for(var k=0;k<8;k++){let h=u.hl[k];if(h.z<=0.){break;}
    hk=max(hk,1.-smoothstep(h.z,h.z+16.,length(px-h.xy)));}
  return hk;}
/* нормаль кромки по альфе корпуса: xy — наружу, z — (1-n.z)³ */
fn rimN(uv:vec2f)->vec3f{
  let dx=vec2f(2.,0.)/u.css;let dy=vec2f(0.,2.)/u.css;
  let g=vec2f(textureSampleLevel(tFront,sl,uv+dx,0.).a-textureSampleLevel(tFront,sl,uv-dx,0.).a,
              textureSampleLevel(tFront,sl,uv+dy,0.).a-textureSampleLevel(tFront,sl,uv-dy,0.).a);
  let t=clamp(length(g),0.,1.);let nz=sqrt(1.-t*t);
  return vec3f(-g/max(length(g),1e-4),pow(1.-nz,3.));}
fn sil(uv:vec2f,f:vec4f,s:vec3f,rs:vec3f,rn:f32,hk:f32)->vec4f{
  let bk=smoothstep(.1,.3,dot(s,vec3f(.2126,.7152,.0722)))*hk;
  let rk=smoothstep(.08,.26,dot(rs,vec3f(.2126,.7152,.0722)))*hk;
  let fl=max(f.r,max(f.g,f.b))/max(f.a,1e-3);
  let rgb=f.rgb*(1.-.86*bk*(1.-smoothstep(.86,.98,fl)))+rs*rn*f.a*rk*1.4;
  return vec4f(rgb,f.a);}
fn overlay(b:vec3f,s:vec3f)->vec3f{return select(1.-2.*(1.-b)*(1.-s),2.*b*s,b<vec3f(.5));}
@fragment fn fsFinal(v:V)->@location(0) vec4f{
  /* кадр собирается до плеча: сцена как светит, передний слой поверх, свечение
     сложением, как в 2D, — и только потом одно плечо на всё. Яркий газ под
     свечением уходит в золото и к белому плавно, без плато на единице */
  var hs=sceneAt(v.uv);var f=textureSampleLevel(tFront,sl,v.uv,0.);
  /* преломление: сдвиг по каналам чуть разный — радуга у кромок волны, как у линзы, но не на
     тонком (сдвиги разошлись — искра цела). Корпуса не гнутся (L4 k/n): сдвиг гаснет к кромке */
  if(u.dn.x>0.){var o=distort(v.uv*u.css)/u.css;
    if(dot(o,o)*dot(u.css,u.css)>.0004){
      o=o*(1.-hullSoft(v.uv));o=o*(1.-hullM(v.uv+o*.5))*(1.-max(hullM(v.uv+o*.92),hullM(v.uv+o*1.08)));
      let a=sceneAt(v.uv+o*1.08);let g=sceneAt(v.uv+o);let b=sceneAt(v.uv+o*.92);
      let d=abs(a.rgb-b.rgb);hs=mix(vec3f(a.r,g.g,b.b),g,smoothstep(.03,.15,max(d.r,max(d.g,d.b))));}}
  if(u.shc.w>0.&&u.scene>.5){let hk=silK(v.uv);if(hk>0.&&f.a>0.){let rn=rimN(v.uv);
    f=sil(v.uv,f,tone(hs),tone(sceneAt(v.uv+rn.xy*6./u.css)),rn.z,hk);}}
  /* шахта и пещера — передний 2D-слой main: канал упирается в единицу сам по себе, и тёплое
     поверх холодного луча желтеет, а не белеет (GPU_FRONT_LIKE; свечение берёт сцену целиком) */
  if(u.dn.z>.5){hs=min(hs,vec3f(1.));}
  var h=hs*(1.-f.a)+f.rgb;
  if(u.k>0.){h=h+u.k*.8*bloomAt(v.uv)*(1.-.6*max(f.a,u.dn.z));}
  /* засветка ядра: мелочь перед ядром звезды тонет в его свете, как в камере, — тёмная
     точка в центре читалась зрачком. max, не сумма: открытая звезда не меняется, крупный
     корпус держит силуэт за пределами ядра */
  if(u.ln.w>0.){let dl=length((v.uv-u.ln.xy)*u.css)/u.ln.w;h=max(h,vec3f(1.,.97,.93)*2.5*exp(-dl*dl));}
  var c=tone(h);
  /* лучи от звезды (G5): от пикселя к звезде копится видимое небо — там, где
     передний слой прозрачен. Облака и хребты режут свет на настоящие полосы */
  if(u.sh.z>0.){
    let asp=u.css.x/u.css.y;
    /* цель — случайная точка диска, а не центр: край тени мягкий, как от тела, а не от точки */
    let j=textureLoad(tNoise,vec2i(v.p.xy)%vec2i(64),0).r;let j2=textureLoad(tNoise,(vec2i(v.p.xy)+vec2i(29,41))%vec2i(64),0).r;
    let sp=u.sh.xy+vec2f(cos(j2*6.283)/asp,sin(j2*6.283))*u.sh.w*sqrt(fract(j*7.31));let dd=sp-v.uv;
    var acc=0.;var ws=0.;
    for(var i=0;i<28;i++){let q=v.uv+dd*((f32(i)+j)/28.);
      let wq=exp(-length((q-sp)*vec2f(asp,1.))*7.);ws+=wq;
      if(any(q<vec2f(0.))||any(q>vec2f(1.))){acc+=wq;continue;}
      acc+=(1.-textureSampleLevel(tFront,sl,q,0.).a)*wq;}
    /* доля открытого пути к звезде: 1 — луч, 0 — тень хребта или облака */
    let vis=acc/max(ws,1e-4);
    let dl=length((v.uv-u.sh.xy)*vec2f(asp,1.));
    let r=vis*vis*exp(-dl*2.4)*u.sh.z*1.5;
    let b=vec3f(1.)-exp(-u.shc.rgb*r);c=vec3f(1.)-(vec3f(1.)-min(c,vec3f(1.)))*(vec3f(1.)-b);
  }
  /* L2 2/n: грейд по классу звезды — лёгкий. Света тянутся к цвету звезды, тени — в пару
     к ней: красный карлик — угли и глубокий фиолет, жёлтая — золото и бирюза, голубая —
     лёд и индиго. Сдвиг только оттенка — оба множителя нормированы по яркости, медиана L
     стоит. Интерфейс (передний слой) грейда не берёт */
  if(u.lc.w>0.){
    let Y=vec3f(.2126,.7152,.0722);let l=dot(c,Y);let ga=1.-f.a;
    let hi=u.lc.rgb/max(dot(u.lc.rgb,Y),1e-3);let t=u.lc.w;
    let lo0=mix(mix(vec3f(1.12,.9,1.22),vec3f(.84,1.04,1.12),smoothstep(.55,1.,t)),vec3f(.9,.9,1.3),smoothstep(1.,1.5,t));
    let lo=lo0/dot(lo0,Y);
    c=c*mix(vec3f(1.),hi,smoothstep(.2,.75,l)*.09*ga)*mix(vec3f(1.),lo,(1.-smoothstep(.04,.3,l))*.10*ga);}
  /* оптика — только при звезде в кадре и слабая (закон фона: мягко, тусклее игры).
     Штрих — тонкая горизонталь, холоднее звезды; блики — мягкие шестигранники
     (лепестки диафрагмы) на оси звезда→центр, со сдвигом цвета по каналам. Не круги:
     кольца в бою — это цели и разрывы. Кромок нет — ярче всего середина */
  if(u.ln.z>0.){
    let px=v.uv*u.css;let sp=u.ln.xy*u.css;let d=px-sp;
    let fa=1.-.7*f.a;let sc=u.lc.rgb/max(max(u.lc.r,u.lc.g),1e-3);
    let sw=1.+u.ln.w*1.5;
    let y1=d.y/sw;let y5=y1*.2;
    let st=(exp(-y1*y1)+.3*exp(-y5*y5))*exp(-abs(d.x)/(u.css.x*.2));
    var o=mix(sc,vec3f(.6,.8,1.),.55)*st*.055;
    let ax=u.css*.5-sp;let mm=min(u.css.x,u.css.y);
    var tns=array<vec3f,3>(vec3f(.7,.95,1.),vec3f(1.,.8,.55),vec3f(.85,.72,1.));
    for(var k=0;k<3;k++){
      let g=vec3f(.62,1.38,1.9)[k];let rr=mm*vec3f(.034,.065,.022)[k];
      let tn=tns[k];
      let q=px-(sp+ax*g);
      /* шестигранник: расстояние до стороны, повёрнутый на постоянный угол */
      let an=atan2(q.y,q.x)+.3;let sgm=1.0471976;
      let hx=length(q)*cos(abs(an-sgm*floor(an/sgm)-sgm*.5))/.8660254;
      let sh=vec3f(1.-smoothstep(.2,1.,hx/(rr*1.05)),1.-smoothstep(.2,1.,hx/rr),1.-smoothstep(.2,1.,hx/(rr*.95)));
      o=o+sh*mix(sc,tn,.6)*vec3f(.042,.032,.05)[k];}
    /* закон фона в числах: вся оптика вместе — не больше 6% шкалы над тем, что под ней */
    c=c+min(o,vec3f(.058))*u.ln.z*fa;}
  /* зерно: узор 64×64 в пикселях CSS, режим overlay, 7.5% — как 19c grainPass */
  if(u.grain>.5){let s=textureSampleLevel(tNoise,sr,v.p.xy/(64.*u.dpr),0.).r;c=mix(c,overlay(c,vec3f(s)),.075);}
  if(u.vig>.5){
    let px=v.uv*u.css;let r0=min(u.css.x,u.css.y)*.34;let r1=max(u.css.x,u.css.y)*.76;
    let a=.40*clamp((length(px-vec2f(u.css.x*.5,u.css.y*.48))-r0)/(r1-r0),0.,1.);c=c*(1.-a);}
  /* хроматика после попадания (18d drawHitFx): красная копия влево, синяя вправо */
  if(u.hitK>.02){let dx=vec2f(u.hitDx/u.css.x,0.);
    c=min(c+.30*u.hitK*(frameAt(v.uv+dx)*vec3f(1.,.157,.157)+frameAt(v.uv-dx)*vec3f(.157,.353,1.)),vec3f(1.));}
  if(u.ui>.5){let q=textureSampleLevel(tUi,sl,v.uv,0.);c=c*(1.-q.a)+q.rgb;}
  /* дизеринг синим шумом во всех режимах: полос в тёмных градиентах больше нет */
  let n=textureLoad(tNoise,vec2i(v.p.xy)%vec2i(64),0).r;
  c=c+((n*255.-110.)/36.-.5)/255.;
  return vec4f(c,1.);}
/* голый финал для замера (GPU.kill.fin): сцена под передним слоем и интерфейс, больше ничего */
@fragment fn fsFinal0(v:V)->@location(0) vec4f{
  let f=textureSampleLevel(tFront,sl,v.uv,0.);var c=tone(sceneAt(v.uv))*(1.-f.a)+f.rgb;
  if(u.ui>.5){let q=textureSampleLevel(tUi,sl,v.uv,0.);c=c*(1.-q.a)+q.rgb;}
  return vec4f(c,1.);}
/* сегмент gpuOver: 2D, нарисованное до сих пор, ложится в сцену (премультиплицировано) */
struct CO{@location(0) c:vec4f,@location(1) e:vec4f};
@fragment fn fsComp(v:V)->CO{
  let f=textureSampleLevel(tFront,sl,v.uv,0.);
  /* альфа второй цели — маска 2D-корпусов (в их кругах): её читает преломление (distort) */
  let hk=silK(v.uv);let hm=f.a*hk;
  if(u.shc.w<=0.){return CO(f,vec4f(emit(f.rgb),hm));}
  /* сцену здесь не прочесть (в неё рисуем) — газ за корпусом берём из туманности
     (16gb кладёт её на место сцены), тоном как при сведении */
  if(hk<=0.||f.a<=0.){return CO(f,vec4f(emit(f.rgb),hm));}
  let rn=rimN(v.uv);
  let nb=gasT(v.uv);let o=sil(v.uv,f,nb,gasT(v.uv+rn.xy*6./u.css),rn.z,hk);return CO(o,vec4f(emit(o.rgb),hm));}
fn gasT(uv:vec2f)->vec3f{
  let nb=max(textureSampleLevel(tScene,sl,uv,0.).rgb,vec3f(0.));let m=max(max(nb.r,nb.g),max(nb.b,1e-4));
  return nb*(1.-exp(-m*1.25))/(m*1.25)*1.12;}`;

function gpuPipes(){
  const d=GPU.dev,F=GPUShaderStage.FRAGMENT;
  const mod=d.createShaderModule({code:(GPU.f16?"enable f16;\nalias H=f16;":"alias H=f32;")+"alias H3=vec3<H>;alias H4=vec4<H>;\n"+GPU_POST_WGSL});
  const ent=[{binding:0,visibility:F,buffer:{type:"uniform"}},
    {binding:1,visibility:F,sampler:{type:"filtering"}},{binding:2,visibility:F,sampler:{type:"filtering"}}];
  for(const b of [3,4,5,6,7,8,9])ent.push({binding:b,visibility:F,texture:{sampleType:"float"}});
  GPU.L=d.createBindGroupLayout({entries:ent});
  const PL=d.createPipelineLayout({bindGroupLayouts:[GPU.L]});
  const mk=(fs,fmt)=>d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:fs,targets:[{format:fmt}]},primitive:{topology:"triangle-list"}});
  GPU.P={down:mk("fsDown","rgba16float"),fin:mk("fsFinal",GPU.fmt),fin0:mk("fsFinal0",GPU.fmt),mipDn:mk("fsMipDn","rgba16float"),up1:mk("fsMipUp1","rgba16float"),
         comp:d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
           fragment:{module:mod,entryPoint:"fsComp",targets:[{format:"rgba16float",blend:{
             color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one"}}},
             {format:"rgba16float",blend:{color:{srcFactor:"one",dstFactor:"one"},alpha:{srcFactor:"one",dstFactor:"one"}}}]},
           primitive:{topology:"triangle-list"}})};
  GPU.S={lin:d.createSampler({magFilter:"linear",minFilter:"linear"}),
         rep:d.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"})};
  GPU.U=d.createBuffer({size:528,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  GPU.N=d.createTexture({size:[64,64],format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  GPU.noiseOk=false;
}
/* узор зерна — тот же, что у 2D: 110 + ранг синего шума × 36. Печётся при первой
   надобности: blueNoise() стоит десятки миллисекунд, заставке он не нужен */
function gpuNoise(){
  const bt=blueNoise(),a=new Uint8Array(64*64);
  for(let i=0;i<a.length;i++)a[i]=110+Math.round(bt[i]*36);
  GPU.dev.queue.writeTexture({texture:GPU.N},a,{bytesPerRow:64},[64,64]);
  GPU.noiseOk=true;
}
function gpuResize(){
  if(!GPU.ok)return;
  const bw=cvs.width,bh=cvs.height;if(bw<2||bh<2)return;
  /* #c меряет resize() (08-state); смена ширины холста сбрасывает и преобразование */
  GPU.hnd=gpuHudDpr();   /* слой #ovl — на родном DPR устройства (08bi): его смена тоже пересобирает кадр */
  GPU.cv.width=bw;GPU.cv.height=bh;
  const qw=Math.max(2,Math.round(W/4)),qh=Math.max(2,Math.round(H/4));
  for(const k in GPU.T)GPU.T[k].destroy();
  const TB=GPUTextureUsage.TEXTURE_BINDING,RA=GPUTextureUsage.RENDER_ATTACHMENT,CD=GPUTextureUsage.COPY_DST;
  const mk=(w,h,f,us)=>GPU.dev.createTexture({size:[w,h],format:f,usage:us});
  GPU.T={front:mk(bw,bh,"rgba8unorm",TB|CD|RA|GPUTextureUsage.COPY_SRC),
    scene:mk(bw,bh,"rgba16float",TB|RA),emit:mk(bw,bh,"rgba16float",TB|RA),lt:mk(16,3,"rgba16float",TB|CD)};
  /* цели приборов нет (26.09, ревью №9): приборы — DOM-холст #hud, u.ui всегда 0. Кадровая rgba8
     стоила 2.6 МиБ на S23 и 31.6 на 4K; binding 6 (tUi) держит вид шума 64×64 — шейдер его не читает */
  /* лестница свечения (P1 25.09): одна текстура с мипами от четверти кадра вниз; уровень
     уже шести текселей не заводится (телефон — пять уровней, ноутбук — шесть). Каждый
     уровень — цель своего прохода и вход следующего: разные подресурсы одной текстуры,
     это разрешено. Верхние уровни складывает один проход (fsMipUp1 → bloomU), финал
     читает нулевой уровень и эту сумму */
  let nl=1;for(let w=qw,h=qh;nl<6;nl++){w=w>>1;h=h>>1;if(Math.min(w,h)<6)break;}
  GPU.T.bloom=GPU.dev.createTexture({size:[qw,qh],format:"rgba16float",usage:TB|RA,mipLevelCount:nl});
  GPU.T.bloomU=GPU.dev.createTexture({size:[Math.max(1,qw>>1),Math.max(1,qh>>1)],format:"rgba16float",usage:TB|RA});
  GPU.V={lt:GPU.T.lt.createView(),scene:GPU.T.scene.createView(),emit:GPU.T.emit.createView(),bloom:GPU.T.bloom.createView(),bloomU:GPU.T.bloomU.createView()};
  GPU.MV=[];for(let i=0;i<nl;i++)GPU.MV.push(GPU.T.bloom.createView({baseMipLevel:i,mipLevelCount:1}));
  GPU.scene3D=false;
  GPU.bw=bw;GPU.bh=bh;GPU.qw=qw;GPU.qh=qh;GPU.dpr=DPR;GPU.cw=W;GPU.ch=H;
  const S=GPU.S,T=GPU.T,nv=GPU.N.createView();
  const bind=(bv,uv)=>GPU.dev.createBindGroup({layout:GPU.L,entries:[
    {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
    {binding:3,resource:T.scene.createView()},{binding:4,resource:T.front.createView()},
    {binding:5,resource:bv},{binding:6,resource:nv},{binding:7,resource:nv},{binding:8,resource:T.emit.createView()},
    {binding:9,resource:uv||GPU.V.bloomU}]});
  /* MB[i] — вход прохода на уровень i+1; первому уровню свечение не нужно — на его месте шум;
     up — проход суммы верхних уровней пишет bloomU, поэтому у него на её месте шум */
  GPU.MB=GPU.MV.map(v=>bind(v));
  GPU.B={down:bind(nv),fin:bind(GPU.V.bloom),up:bind(GPU.V.bloom,nv),
    /* сегмент рисует В сцену — значит, в привязках её быть не может: на её месте шум */
    comp:GPU.dev.createBindGroup({layout:GPU.L,entries:[
      {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
      {binding:3,resource:nv},{binding:4,resource:T.front.createView()},
      {binding:5,resource:nv},{binding:6,resource:nv},{binding:7,resource:nv},
      {binding:8,resource:nv},{binding:9,resource:nv}]})};
}
/* склейка сегмента с туманностью на месте сцены — силуэтам корпусов (sil) */
function gpuCompNeb(){
  const B=GPU.B;
  if(!(GNB.view&&GNB.dev===GPU.dev))return B.comp;
  if(B.compN&&B.compNv===GNB.view)return B.compN;
  const S=GPU.S,T=GPU.T;B.compNv=GNB.view;
  return B.compN=GPU.dev.createBindGroup({layout:GPU.L,entries:[
    {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
    {binding:3,resource:GNB.view},{binding:4,resource:T.front.createView()},
    {binding:5,resource:GPU.N.createView()},{binding:6,resource:GPU.N.createView()},{binding:7,resource:GPU.N.createView()},
    {binding:8,resource:GPU.N.createView()},{binding:9,resource:GPU.N.createView()}]});
}
function gpuPass(view,pipe,bind,ts){
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}],timestampWrites:ts&&gpuTs(ts)});
  p.setPipeline(pipe);p.setBindGroup(0,bind);p.draw(3);p.end();
}
/* ── L3: точечный свет на корпусах ──
   Источники кадра (лучи, разрывы, болты, свой факел) копятся здесь, заслоны звезды
   (станция) — тоже; в конце кадра шестнадцать сильнейших ложатся в текстуру 16×3:
   строка 0 — отрезок (точка — отрезок нулевой длины), 1 — цвет×сила и радиус,
   2 — заслоны (центр, радиус). Её читают проходы корпусов (17c gpuLitSprite)
   до отправки кадра — все видят свет своего кадра */
/* L4: источник преломления для последнего прохода (экран, px CSS). Марево: сопло (x,y), ось
   факела (dx,dy) от сопла назад, длина L, радиус R, сила k (px). Волна: центр, радиус, ширина, сила */
function gpuHaze(x,y,dx,dy,L,R,k){if(GPU.on&&k>0)GPU.dz.push([x,y,dx,dy,L,R,k,0]);}
function gpuShock(x,y,r,w,k){if(GPU.on&&k>0)GPU.dz.push([x,y,r,w,k,0,0,1]);}
function gpuLight(x0,y0,x1,y1,r,g,b,rad,k){if(GPU.on&&k>0&&rad>0)GPU.lt.push([x0,y0,x1,y1,r*k,g*k,b*k,rad,k*rad]);}
const GLT_H=new Uint16Array(16*3*4),GLT_F=new Float32Array(1),GLT_U=new Uint32Array(GLT_F.buffer);
function f16(v){GLT_F[0]=v;const x=GLT_U[0],s=(x>>>16)&0x8000,e=((x>>>23)&255)-112;
  if(e<=0)return s;if(e>=31)return s|0x7bff;return s|(e<<10)|((x&0x7fffff)>>>13);}
function gpuLtWrite(){
  const A=GLT_H;A.fill(0);
  const L=GPU.plOff?[]:GPU.lt.sort((a,b)=>b[8]-a[8]);
  for(let i=0;i<Math.min(16,L.length);i++){const l=L[i];for(let j=0;j<4;j++){A[i*4+j]=f16(l[j]);A[64+i*4+j]=f16(l[4+j]);}}
  const O=GPU.plOff?[]:GPU.oc;
  for(let i=0;i<Math.min(16,O.length);i++){const o=O[i];A[128+i*4]=f16(o[0]);A[129+i*4]=f16(o[1]);A[130+i*4]=f16(o[2]);}
  GPU.dev.queue.writeTexture({texture:GPU.T.lt},A,{bytesPerRow:128},[16,3]);
}
/* свет и заслоны для проходов корпусов (t1 — текстура света): plAt — сумма по рельефу nb,
   источники на высоте hz над плоскостью; корпус сам себе заслон — шесть шагов по его маске
   к источнику (plOcc — у каждого прохода своя маска), дальний борт света не видит;
   shAt — доля света звезды (sd — к звезде) */
const GPU_PL_WGSL=`
fn plAt(p:vec2f,nb:vec3f,hz:f32,sp:f32)->vec3f{
  var s=vec3f(0.);
  for(var i=0;i<16;i++){
    let A=textureLoad(t1,vec2i(i,0),0);let B=textureLoad(t1,vec2i(i,1),0);
    if(B.w<=0.){break;}
    let ab=A.zw-A.xy;let tt=clamp(dot(p-A.xy,ab)/max(dot(ab,ab),1e-4),0.,1.);
    let dv=A.xy+ab*tt-p;let d2=dot(dv,dv);let dl=sqrt(d2);
    var oc=0.;let st=dv/max(dl,1e-3)*min(dl,sp)/6.;
    for(var j=1;j<=6;j++){oc=oc+plOcc(p+st*f32(j));}
    s=s+B.rgb*max(dot(nb,normalize(vec3f(dv,hz))),0.)/(1.+d2/(B.w*B.w))*exp(-oc*.4);}
  return s;}
/* стекло — голубое, не белое и не чёрное; своя нормаль — купол по перепаду «стеклянности»:
   фонарь внутри корпуса по альфе плоский, а по стеклу — выпуклый */
fn glassOf(c:vec4f)->f32{let rgb=c.rgb/max(c.a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));
  return smoothstep(.03,.2,rgb.b-rgb.r)*smoothstep(.08,.25,mx)*(1.-smoothstep(.6,.85,mx))*smoothstep(.3,.7,c.a);}
fn glassS(uv:vec2f)->f32{return glassOf(textureSampleLevel(t0,smp,uv,0.));}
/* перепад — по двум шагам с каждой стороны: рамы и блики внутри фонаря не рвут купол на искры */
fn glassG(uv:vec2f,d:vec2f)->vec2f{
  let dx=vec2f(d.x,0.);let dy=vec2f(0.,d.y);
  return -vec2f(glassS(uv+dx)+glassS(uv+dx*2.)-glassS(uv-dx)-glassS(uv-dx*2.),
                glassS(uv+dy)+glassS(uv+dy*2.)-glassS(uv-dy)-glassS(uv-dy*2.))*.5;}
fn glassSpec(g:vec2f,Hs:vec3f)->f32{let tl=clamp(length(g)*.8,0.,.9);
  let ng=vec3f(g/max(length(g),1e-4)*tl,sqrt(1.-tl*tl));
  return .08+1.6*pow(max(dot(ng,Hs),0.),12.);}
fn shAt(p:vec2f,sd:vec2f)->f32{
  var k=1.;
  for(var i=0;i<16;i++){
    let O=textureLoad(t1,vec2i(i,2),0);if(O.z<=0.){break;}
    let q=O.xy-p;let tt=dot(q,sd);if(tt<=0.||dot(q,q)<O.z*O.z){continue;}
    k=min(k,mix(.4,1.,smoothstep(O.z*.75,O.z*1.05,length(q-sd*tt))));}
  return k;}
`;
/* плечо тона по режиму (tone в посте): в космосе — по каналам, как плёнка (L2: газ у
   звезды уходит в золото, ядро луча — в белый); на земле и в помещениях — по старшему
   каналу, лампа держит свой оттенок при любой яркости (Контроль 26.09) */
const GPU_TONE_FILM=new Set(["system","map","belt","raid","scoop","wanderer","barge","rail"]);
/* шахта и пещера — плечо по каналам, как у переднего 2D-слоя main: плечо по старшему каналу
   вынимало красный из лепестков мха и бирюзы хода (ядро лепестка 190 против 216 у main) */
function gpuHueFor(m){return GPU_TONE_FILM.has(m)||GPU_FRONT_LIKE.has(m)?0:1;}
/* шахта и пещера у main — передний 2D-слой: пелена свечения на них есть, а свечение ложится
   с весом переднего слоя (1−.6·f.a при f.a = 1). Флот рисует их в сцене; без пелены кадр
   выходил на 4 % темнее main целиком, вместе с небом над устьем (Контроль 26.09: «экспозиция
   как в main»), а с весом сцены свечение серило бы чёрное хода */
const GPU_FRONT_LIKE=new Set(["dig","cave"]);
function gpuUni(){
  const a=GPU.UA,P=GPU.post;
  a[0]=GPU.bw;a[1]=GPU.bh;a[2]=W;a[3]=H;a[4]=DPR;a[5]=P.k;a[6]=P.grain;a[7]=P.vig;
  a[8]=GPU.hitK;a[9]=GPU.hitDx;a[10]=GPU.uiOn?1:0;a[11]=GPU.sceneOn?1:0;
  a[12]=GPU.qw;a[13]=GPU.qh;a[14]=1.75/DPR;a[15]=G.t||0;
  const S=GPU.shaft;a[16]=S?S.x:0;a[17]=S?S.y:0;a[18]=S?S.k:0;a[19]=S?S.rad:0;a[20]=S?S.r:0;a[21]=S?S.g:0;a[22]=S?S.b:0;a[23]=GPU.sep||0;
  const L=GPU.sepH;for(let i=0;i<8;i++){const h=L[i],o=24+i*4;a[o]=h?h[0]:0;a[o+1]=h?h[1]:0;a[o+2]=h?h[2]:0;a[o+3]=0;}
  const Q=GPU.lens;a[56]=Q?Q.x:0;a[57]=Q?Q.y:0;a[58]=Q?Q.k:0;a[59]=Q?Q.r:0;
  a[60]=Q?Q.cr:0;a[61]=Q?Q.cg:0;a[62]=Q?Q.cb:0;a[63]=Q?Q.t:0;
  const D=GPU.dz,nd=Math.min(8,D.length);a[64]=nd;a[65]=gpuHueFor(G.mode);a[66]=GPU_FRONT_LIKE.has(G.mode)?1:0;
  for(let i=0;i<8;i++)for(let j=0;j<8;j++)a[68+i*8+j]=i<nd?D[i][j]:0;
  GPU.dev.queue.writeBuffer(GPU.U,0,a);
}

/* ── кадр ── */
/* начало кадра: без готового устройства кадр не рисуется (мир всё равно шагает) */
function gpuFrame(){
  if(!GPU.ok||GPU.lost){GPU.on=false;return false;}
  if(cvs.width!==GPU.bw||cvs.height!==GPU.bh||DPR!==GPU.dpr||W!==GPU.cw||H!==GPU.ch||gpuHudDpr()!==GPU.hnd)gpuResize();
  if(GPU.trash.length){for(const t of GPU.trash)t.destroy();GPU.trash.length=0;}
  if(GPU.gMode!==G.mode){GPU.gMode=G.mode;gcPoolLeave();}   /* вышли из сцены — разовые наборы пула уничтожить (08ca) */
  ctx=MAIN_CTX;
  /* невидимый #c чистится, только если на нём рисовали (cState, 08c): безусловная чистка
     всего холста каждый кадр — ограничитель частоты Chrome на телефоне (Контроль, P1) */
  ctx.setTransform(1,0,0,1,0,0);if(GPU.cState!==0)ctx.clearRect(0,0,GPU.bw,GPU.bh);ctx.setTransform(DPR,0,0,DPR,0,0);
  chipDomSweep();   /* слой #ovl — 08bh */
  GPU.on=true;GPU.wDone=false;
  GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.overPass=null;GPU.sceneOn=false;GPU.emitOn=false;GPU.scene3D=false;GPU.hitK=0;GPU.shaft=null;GPU.lens=null;GPU.lt.length=0;GPU.oc.length=0;GPU.dz.length=0;GPU.sep=0;GPU.sepH.length=0;
  return true;
}
/* проход сцены видеокарты: его открывает первый слой кадра, закрывает сборка.
   Всё, что рисуется сюда, лежит ПОД передним 2D-слоем (docs/DESIGN-gpu.md §3).
   Вне кадра (прямой вызов из теста или стенда) — null: слой молчит */
function gpuScene(){
  if(!GPU.on||!GPU.enc)return null;
  if(GPU.scene3D){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
  if(!GPU.scenePass){
    GPU.scenePass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,
      loadOp:GPU.sceneOn?"load":"clear",storeOp:"store",clearValue:GPU.sceneBg}],timestampWrites:gpuTs(GPU.sceneOn?GPU.seg||"scene+":"scene0")});
    if(!GPU.sceneOn)GPU.seg=null;
    GPU.sceneOn=true;
  }
  return GPU.scenePass;
}
/* тот же проход сцены, но с глубиной (depth24plus, чистится при открытии): для
   настоящего 3D — камни пояса, отсеки рейда. Конвейеры в нём объявляют
   depthStencil {format:"depth24plus"}; следующий gpuScene() вернёт обычный проход */
function gpuScene3D(){
  if(!GPU.on||!GPU.enc)return null;
  if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;}
  if(!GPU.T.depth){GPU.T.depth=GPU.dev.createTexture({size:[GPU.bw,GPU.bh],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT|(GPUTextureUsage.TRANSIENT_ATTACHMENT||0)});GPU.V.depth=GPU.T.depth.createView();}
  GPU.scenePass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:GPU.sceneOn?"load":"clear",storeOp:"store",clearValue:GPU.sceneBg}],
    depthStencilAttachment:{view:GPU.V.depth,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});
  GPU.sceneOn=true;GPU.scene3D=true;
  return GPU.scenePass;
}
/* ── слой ПОВЕРХ того, что 2D уже нарисовал (docs/DESIGN-gpu.md §3) ──
   Вклеивает #c в сцену как есть сейчас, чистит #c и открывает проход поверх.
   Что 2D нарисует после — ляжет выше этого слоя. Каждый вызов — новый сегмент
   (загрузка #c, один полноэкранный проход, отправка); подряд идущие слои одного
   сегмента рисуют в один возвращённый проход. Вне кадра — null */
/* #c → передний слой; пустой не грузится (08c). GPU.kill.fpx (?g11=deep): копия 1×1 —
   разводит цену растра и цену копии (P1 10/n) */
function gpuFrontCopy(n){
  if(gpuFrontClean())return;gpuTsAround(n,()=>GPU.dev.queue.copyExternalImageToTexture({source:cvs},{texture:GPU.T.front,premultipliedAlpha:true},GPU.kill.fpx?[1,1]:[GPU.bw,GPU.bh]));
}
function gpuOver(){
  if(!GPU.on||!GPU.enc)return null;
  const d=GPU.dev;
  if(GPU.overPass){GPU.overPass.end();GPU.overPass=null;}
  if(!GPU.sceneOn)gpuScene();
  if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
  if(GPU.kill.front){
    if(GPU.cState!==0){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,GPU.bw,GPU.bh);ctx.restore();}
    return GPU.overPass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"}]});}
  gpuFrontCopy("front1");
  gpuUni();
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"},
    {view:GPU.V.emit,loadOp:GPU.emitOn?"load":"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("frontComp")});
  GPU.emitOn=true;
  p.setPipeline(GPU.P.comp);p.setBindGroup(0,GPU.sep?gpuCompNeb():GPU.B.comp);p.draw(3);p.end();
  /* отправляем сделанное: следующая загрузка #c не должна обогнать эту склейку */
  d.queue.submit([GPU.enc.finish()]);GPU.enc=d.createCommandEncoder();
  if(GPU.cState!==0){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,GPU.bw,GPU.bh);ctx.restore();}
  GPU.overPass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"}],timestampWrites:gpuTs("over")});
  return GPU.overPass;
}
/* кадр вне цикла (тест, стенд, look): собрать, показать, снять — одной задачей. Мир, не собранный
   рисунком, собирается здесь; признак — GPU.wDone, не ctx: 2D-слоя приборов нет, ctx всегда #c
   (прежде по ctx===#c второй gpuWorld без свечения гасил кадр на 10 % — золотые кадры, 26.09) */
function gpuManual(draw){
  if(!gpuFrame())return false;
  GPU.wantSnap=true;
  try{draw();}finally{if(GPU.on){if(GPU.enc&&!GPU.wDone)gpuWorld(0,false,false);gpuPresent();}}
  return true;
}
/* мир дорисован: передний слой — в текстуру, свечение — в четверть кадра.
   Дальше кадр рисует интерфейс — на свой слой, без свечения и зерна */
function gpuWorld(k,grain,vig){
  GPU.wDone=true;
  try{
    if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
    if(GPU.overPass){GPU.overPass.end();GPU.overPass=null;}
    const off=!!(G.opts&&G.opts.gfx&&G.opts.gfx.draw===0);
    const P=GPU.post;
    /* зерно теперь и на чёрном небе: видеокарте оно ничего не стоит, а в тёмных
       градиентах туманности и короны работает как дизеринг (2D снимал его ради
       полноэкранного overlay, 1–3 мс) */
    P.k=(!off&&G.running)?k:0;P.grain=(!off&&grain&&G.running)?1:0;P.vig=(!off&&grain&&vig&&G.running)?1:0;
    if(GPU.kill.bloom)P.k=0;
    if(!GPU.noiseOk)gpuNoise();
    if(!GPU.kill.front)gpuFrontCopy("front2");
    if(P.k>0){
      if(!GPU.emitOn){GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.emit,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]}).end();GPU.emitOn=true;}
      gpuBloom();}
    /* всё, что над миром, — одним проходом слоя #ovl (08bi): 2D-слоя приборов нет, ctx остаётся на #c */
    ovFlush();
  }catch(e){gpuFail(e,"сборка");}
}
/* лестница свечения: колено в первый уровень, вниз по уровням, сумма верхних — одним проходом */
function gpuBloom(){
  const V=GPU.MV,B=GPU.MB,n=V.length;
  gpuPass(V[0],GPU.P.down,GPU.B.down,"bloomDown");
  for(let i=1;i<n;i++)gpuPass(V[i],GPU.P.mipDn,B[i-1]);
  if(n>1)gpuPass(GPU.V.bloomU,GPU.P.up1,GPU.B.up,"bloomUp");
}
/* конец кадра: слой интерфейса (если стойка рисовала), общий проход — на экран */
function gpuPresent(){
  if(!GPU.on||!GPU.enc){GPU.on=false;return;}
  try{
    GPU.uiOn=false;   /* слой приборов — #ovl над #g, не текстура */
    gpuUni();gpuLtWrite();
    gpuPass(GPU.gx.getCurrentTexture().createView(),GPU.kill.fin?GPU.P.fin0:GPU.P.fin,GPU.B.fin,"final");
    const tsRead=gpuTsResolve();
    GPU.dev.queue.submit([GPU.enc.finish()]);
    if(tsRead)tsRead();
    GPU.frameNo++;
    if(GPU.wantSnap){GPU.wantSnap=false;gpuTakeSnap();}
  }catch(e){gpuFail(e,"кадр");}
  GPU.enc=null;GPU.on=false;
}
/* поднимается после всего скрипта: в сборке тестов TEST объявлен ниже игры */
if(typeof document!=="undefined"&&document.body)setTimeout(gpuInit,0);
