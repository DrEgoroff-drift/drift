/* ══════════════ видеокарта: кадр рисует WebGPU (docs/DESIGN-gpu.md) ══════════════
   Решение автора (23.09): всё, что умеет видеокарта, — на видеокарте; чего не
   умеет (текст, сложные векторные фигуры) — рисует Canvas 2D на #c, и #c ложится в
   кадр текстурой. Старого 2D-кадра больше нет: без WebGPU игра честно говорит,
   какой нужен браузер. #c невидим (opacity 0) и по-прежнему ловит палец.
   Кадр: сцена видеокарты (gpuScene) → #c поверх → свечение, зерно, виньетка,
   хроматика, дизеринг одним проходом → слой интерфейса (стойка) поверх всего. */
const GPU={ok:false,on:false,lost:false,busy:false,none:false,
  dev:null,cv:null,gx:null,fmt:"",L:null,P:{},B:{},S:null,U:null,UA:new Float32Array(56),shaft:null,sepH:[],
  T:{},V:{},N:null,noiseOk:false,ui:null,uctx:null,snap:null,
  bw:0,bh:0,qw:2,qh:2,dpr:0,cw:0,ch:0,enc:null,scenePass:null,sceneOn:false,
  sceneBg:{r:0,g:0,b:0,a:1},uiOn:false,uiWas:false,hitK:0,hitDx:0,post:{k:0,grain:0,vig:0},
  lay:{},bufs:{},bgs:{},cvTex:new Map(),trash:[],errs:0,frameNo:0,snapNo:-1,wantSnap:false,overPass:null,
  ar:{},fL:null};

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
  c.getContext("2d",{willReadFrequently:true}).drawImage(GPU.cv,0,0);
  GPU.snapNo=GPU.frameNo;
}
/* нет WebGPU — говорим прямо, какой браузер нужен (игрок видит это вместо мира) */
function gpuNone(why){
  GPU.none=true;
  try{crashShip("gpu","нет WebGPU: "+why,"");}catch(_){}
  if(typeof document==="undefined"||!document.body||document.getElementById("nogpu"))return;
  const d=document.createElement("div");d.id="nogpu";
  d.innerHTML="<b>Этому браузеру не хватает WebGPU</b><s>«Дрейф» рисует мир видеокартой. Подойдут свежие Chrome, Edge, Яндекс Браузер и Opera, Safari 26 и новее.</s>";
  document.body.appendChild(d);
}
async function gpuInit(){
  if(GPU.ok||GPU.busy)return;
  if(typeof navigator==="undefined"||!navigator.gpu){gpuNone("navigator.gpu");return;}
  GPU.busy=true;
  try{
    const ad=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});
    if(!ad){gpuNone("адаптера нет");return;}
    const dev=await ad.requestDevice();
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
    if(!GPU.ui){GPU.ui=document.createElement("canvas");GPU.uctx=GPU.ui.getContext("2d",{alpha:true});}
    gpuPipes();
    GPU.lay={};GPU.bufs={};GPU.bgs={};GPU.cvTex=new Map();GPU.trash=[];GPU.ar={};GPU.fL=null;GPU.nView=null;
    GPU.T={};GPU.bw=0;GPU.ok=true;
    gpuResize();
  }catch(e){
    GPU.ok=false;gpuNone("init: "+((e&&e.message)||e));
  }finally{GPU.busy=false;}
}
/* устройство потеряно (сон телефона, сброс драйвера): кадр ждёт, ядро поднимается заново */
function gpuDrop(why,retry){
  GPU.ok=false;GPU.on=false;GPU.lost=true;GPU.enc=null;GPU.scenePass=null;
  if(ctx===GPU.uctx)ctx=MAIN_CTX;
  try{crashShip("gpu",why,"");}catch(_){}
  if(retry)setTimeout(()=>{GPU.lost=false;GPU.dev=null;gpuInit();},1500);
}
/* ── проходы поста: общий треугольник на весь экран, одна раскладка привязок ── */
const GPU_POST_WGSL=`
struct U{res:vec2f,css:vec2f,dpr:f32,k:f32,grain:f32,vig:f32,hitK:f32,hitDx:f32,ui:f32,scene:f32,qres:vec2f,sigma:f32,t:f32,sh:vec4f,shc:vec4f,hl:array<vec4f,8>};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var sl:sampler;
@group(0) @binding(2) var sr:sampler;
@group(0) @binding(3) var tScene:texture_2d<f32>;
@group(0) @binding(4) var tFront:texture_2d<f32>;
@group(0) @binding(5) var tBloom:texture_2d<f32>;
@group(0) @binding(6) var tUi:texture_2d<f32>;
@group(0) @binding(7) var tNoise:texture_2d<f32>;
@group(0) @binding(8) var tEmit:texture_2d<f32>;
struct V{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->V{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:V;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
/* свет (L2): сцена — rgba16f, ядро звезды, огонь и густой газ светят выше единицы. На
   экран кадр сводит плечо по каждому каналу: до .75 — как было, выше — мягко к единице,
   без плато (жёсткая обрезка давала плоские пятна). Яркий оранжевый уходит в золото,
   за единицей — в белый, как плёнка; плечо по старшему каналу держало оттенок, но кадр
   от него выцветал в бежевый, а диск звезды — в розовый блин. Интерфейс — после плеча */
fn tone(c:vec3f)->vec3f{
  let K=.75;let x=max(c-vec3f(K),vec3f(0.));
  return min(c,vec3f(K))+(1.-K)*(vec3f(1.)-exp(-x/(1.-K)));}
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
/* свечение (L2): лестница из шести уровней. Первый — четверть кадра, честным ящиком 4×4
   (мелкие яркие точки не мерцают): квадрат кадра в тонах экрана, как в 2D (газ и факел
   светятся у себя), и сверх того — всё, что сцена светит выше плеча. Дальше каждый
   уровень вдвое мельче и на ступень строже (колено по уровню), потом обратно вверх с
   шатром, уровни складываются: узкое свечение даёт всё яркое, широкое — только то, что
   светит много выше единицы (звезда). Поэтому у факела и газа ореол узкий, у звезды —
   широкий, и пелены на полкадра нет */
@fragment fn fsDown(v:V)->@location(0) vec4f{
  let fp=1./u.qres;var c=vec3f(0.);var h=vec3f(0.);
  for(var j=0;j<4;j++){for(var i=0;i<4;i++){
    let o=(vec2f(f32(i),f32(j))+.5)/4.-.5;c+=frameAt(v.uv+o*fp);h+=frameHdr(v.uv+o*fp);}}
  c=c/16.;return vec4f(c*c+h/16.,1.);}
fn bs(uv:vec2f)->vec3f{return textureSampleLevel(tBloom,sl,uv,0.).rgb;}
@fragment fn fsMipDn(v:V)->@location(0) vec4f{
  let h=.5/vec2f(textureDimensions(tBloom));let uv=v.uv;
  let c=bs(uv)*4.+bs(uv-h)+bs(uv+h)+bs(uv+vec2f(h.x,-h.y))+bs(uv-vec2f(h.x,-h.y));
  let lv=log2(u.qres.x/f32(textureDimensions(tBloom).x));
  if(lv<1.5){return vec4f(c/8.,1.);}
  return vec4f(knee(c/8.,.45*(lv-1.)),1.);}
/* вверх — шатром в восемь выборок; дальние уровни чуть теплее: широкий ореол звезды
   тёплый, как рассеяние в оптике, узкий у огней — своего цвета */
@fragment fn fsMipUp(v:V)->@location(0) vec4f{
  let h=.5/vec2f(textureDimensions(tBloom));let uv=v.uv;
  var c=bs(uv+vec2f(-2.*h.x,0.))+bs(uv+vec2f(2.*h.x,0.))+bs(uv+vec2f(0.,-2.*h.y))+bs(uv+vec2f(0.,2.*h.y));
  c=c+2.*(bs(uv+vec2f(-h.x,h.y))+bs(uv+h)+bs(uv+vec2f(h.x,-h.y))+bs(uv-h));
  let lv=log2(u.qres.x/f32(textureDimensions(tBloom).x));
  let warm=mix(vec3f(1.),vec3f(1.,.9,.74),smoothstep(1.5,4.5,lv)*.5);
  /* дальний уровень слабее ближнего: ореол сходит на нет, а не стоит пеленой */
  return vec4f(c/12.*warm*.72,1.);}
fn blur(uv:vec2f,d:vec2f)->vec4f{
  let s=max(u.sigma,.3);let r=ceil(3.*s);var acc=vec3f(0.);var w=0.;
  for(var i=-6;i<=6;i++){let x=f32(i);if(abs(x)>r){continue;}
    let g=exp(-x*x/(2.*s*s));acc+=textureSampleLevel(tBloom,sl,uv+d*x,0.).rgb*g;w+=g;}
  return vec4f(acc/w,1.);}
@fragment fn fsBlurH(v:V)->@location(0) vec4f{return blur(v.uv,vec2f(1./u.qres.x,0.));}
@fragment fn fsBlurV(v:V)->@location(0) vec4f{return blur(v.uv,vec2f(0.,1./u.qres.y));}
/* корпус на ярком газе — силуэтом (L1): только у корпусов (hl — круги, их отмечает
   drawHull), интерфейсу ничего. Газ вокруг темнеет каймой по силуэту; сам корпус на
   ярком газе темнеет, как против света, а кромку ему обводит свет газа за ним; огни
   корпуса остаются; на тёмном газе корпус не трогается. Ответ — премультиплицированный
   слой поверх s (газа под ним) */
fn sil(uv:vec2f,f:vec4f,s:vec3f)->vec4f{
  let px=uv*u.css;var hk=0.;
  for(var k=0;k<8;k++){let h=u.hl[k];if(h.z<=0.){break;}
    hk=max(hk,1.-smoothstep(h.z,h.z+16.,length(px-h.xy)));}
  if(hk<=0.){return f;}
  var nm=0.;var mn=1.;
  /* кайма — мягкая: двенадцать направлений, шаг мелкий, дальние слабее (редкие
     дальние выборки рисовали лесенку-звезду из копий силуэта) */
  for(var k=0;k<12;k++){let an=f32(k)*.5235988;let d=vec2f(cos(an),sin(an))/u.css;
    mn=min(mn,textureSampleLevel(tFront,sl,uv+d*1.5,0.).a);
    nm=max(nm,textureSampleLevel(tFront,sl,uv+d*2.5,0.).a);
    nm=max(nm,textureSampleLevel(tFront,sl,uv+d*5.,0.).a*.7);
    nm=max(nm,textureSampleLevel(tFront,sl,uv+d*8.,0.).a*.4);}
  let bk=smoothstep(.1,.3,dot(s,vec3f(.2126,.7152,.0722)))*hk;
  let da=u.shc.w*smoothstep(.05,.6,nm)*hk;
  let fl=max(f.r,max(f.g,f.b))/max(f.a,1e-3);
  let rgb=f.rgb*(1.-.86*bk*(1.-smoothstep(.86,.98,fl)))+s*clamp(f.a-mn,0.,1.)*bk*1.3;
  return vec4f(rgb,f.a+(1.-f.a)*da);}
fn overlay(b:vec3f,s:vec3f)->vec3f{return select(1.-2.*(1.-b)*(1.-s),2.*b*s,b<vec3f(.5));}
@fragment fn fsFinal(v:V)->@location(0) vec4f{
  /* кадр собирается до плеча: сцена как светит, передний слой поверх, свечение
     сложением, как в 2D, — и только потом одно плечо на всё. Яркий газ под
     свечением уходит в золото и к белому плавно, без плато на единице */
  let hs=sceneAt(v.uv);var f=textureSampleLevel(tFront,sl,v.uv,0.);
  if(u.shc.w>0.&&u.scene>.5){f=sil(v.uv,f,tone(hs));}
  var h=hs*(1.-f.a)+f.rgb;
  if(u.k>0.){h=h+u.k*.8*textureSampleLevel(tBloom,sl,v.uv,0.).rgb*(1.-.6*f.a);}
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
/* сегмент gpuOver: 2D, нарисованное до сих пор, ложится в сцену (премультиплицировано) */
struct CO{@location(0) c:vec4f,@location(1) e:vec4f};
@fragment fn fsComp(v:V)->CO{
  let f=textureSampleLevel(tFront,sl,v.uv,0.);
  if(u.shc.w<=0.){return CO(f,vec4f(emit(f.rgb),0.));}
  /* сцену здесь не прочесть (в неё рисуем) — газ за корпусом берём из туманности
     (16gb кладёт её на место сцены), тоном как при сведении */
  let nb=max(textureSampleLevel(tScene,sl,v.uv,0.).rgb,vec3f(0.));let m=max(max(nb.r,nb.g),max(nb.b,1e-4));
  let o=sil(v.uv,f,nb*(1.-exp(-m*1.25))/(m*1.25)*1.12);return CO(o,vec4f(emit(o.rgb),0.));}`;

function gpuPipes(){
  const d=GPU.dev,F=GPUShaderStage.FRAGMENT;
  const mod=d.createShaderModule({code:GPU_POST_WGSL});
  const ent=[{binding:0,visibility:F,buffer:{type:"uniform"}},
    {binding:1,visibility:F,sampler:{type:"filtering"}},{binding:2,visibility:F,sampler:{type:"filtering"}}];
  for(const b of [3,4,5,6,7,8])ent.push({binding:b,visibility:F,texture:{sampleType:"float"}});
  GPU.L=d.createBindGroupLayout({entries:ent});
  const PL=d.createPipelineLayout({bindGroupLayouts:[GPU.L]});
  const mk=(fs,fmt)=>d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:fs,targets:[{format:fmt}]},primitive:{topology:"triangle-list"}});
  GPU.P={down:mk("fsDown","rgba16float"),blurH:mk("fsBlurH","rgba16float"),
         blurV:mk("fsBlurV","rgba16float"),fin:mk("fsFinal",GPU.fmt),mipDn:mk("fsMipDn","rgba16float"),
         mipUp:d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
           fragment:{module:mod,entryPoint:"fsMipUp",targets:[{format:"rgba16float",blend:{
             color:{srcFactor:"one",dstFactor:"one"},alpha:{srcFactor:"one",dstFactor:"one"}}}]},
           primitive:{topology:"triangle-list"}}),
         comp:d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
           fragment:{module:mod,entryPoint:"fsComp",targets:[{format:"rgba16float",blend:{
             color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}},
             {format:"rgba16float",blend:{color:{srcFactor:"one",dstFactor:"one"},alpha:{srcFactor:"one",dstFactor:"one"}}}]},
           primitive:{topology:"triangle-list"}})};
  GPU.S={lin:d.createSampler({magFilter:"linear",minFilter:"linear"}),
         rep:d.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"})};
  GPU.U=d.createBuffer({size:224,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
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
  GPU.ui.width=bw;GPU.ui.height=bh;GPU.uctx.setTransform(DPR,0,0,DPR,0,0);GPU.uiWas=false;
  GPU.cv.width=bw;GPU.cv.height=bh;
  const qw=Math.max(2,Math.round(W/4)),qh=Math.max(2,Math.round(H/4));
  for(const k in GPU.T)GPU.T[k].destroy();
  const TB=GPUTextureUsage.TEXTURE_BINDING,RA=GPUTextureUsage.RENDER_ATTACHMENT,CD=GPUTextureUsage.COPY_DST;
  const mk=(w,h,f,us)=>GPU.dev.createTexture({size:[w,h],format:f,usage:us});
  GPU.T={front:mk(bw,bh,"rgba8unorm",TB|CD|RA|GPUTextureUsage.COPY_SRC),ui:mk(bw,bh,"rgba8unorm",TB|CD|RA),
    scene:mk(bw,bh,"rgba16float",TB|RA),emit:mk(bw,bh,"rgba16float",TB|RA),bloomA:mk(qw,qh,"rgba16float",TB|RA),bloomB:mk(qw,qh,"rgba16float",TB|RA)};
  /* лестница свечения: bloomA — первый уровень, дальше каждый вдвое мельче */
  GPU.M=[GPU.T.bloomA];
  for(let i=1,w=qw,h=qh;i<6;i++){w=Math.max(1,Math.ceil(w/2));h=Math.max(1,Math.ceil(h/2));GPU.T["mip"+i]=mk(w,h,"rgba16float",TB|RA);GPU.M.push(GPU.T["mip"+i]);}
  GPU.V={scene:GPU.T.scene.createView(),emit:GPU.T.emit.createView(),bloomA:GPU.T.bloomA.createView(),bloomB:GPU.T.bloomB.createView()};
  GPU.MV=GPU.M.map(t=>t.createView());
  GPU.scene3D=false;
  GPU.bw=bw;GPU.bh=bh;GPU.qw=qw;GPU.qh=qh;GPU.dpr=DPR;GPU.cw=W;GPU.ch=H;
  const S=GPU.S,T=GPU.T;
  const bind=bloom=>GPU.dev.createBindGroup({layout:GPU.L,entries:[
    {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
    {binding:3,resource:T.scene.createView()},{binding:4,resource:T.front.createView()},
    {binding:5,resource:bloom.createView()},{binding:6,resource:T.ui.createView()},{binding:7,resource:GPU.N.createView()},{binding:8,resource:T.emit.createView()}]});
  /* текстура не может быть и целью прохода, и его входом: свечение ходит между A и B */
  GPU.MB=GPU.M.map(t=>bind(t));
  GPU.B={down:bind(T.bloomB),blurH:bind(T.bloomA),blurV:bind(T.bloomB),fin:bind(T.bloomA),
    /* сегмент рисует В сцену — значит, в привязках её быть не может: на её месте шум */
    comp:GPU.dev.createBindGroup({layout:GPU.L,entries:[
      {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
      {binding:3,resource:GPU.N.createView()},{binding:4,resource:T.front.createView()},
      {binding:5,resource:T.bloomB.createView()},{binding:6,resource:T.ui.createView()},{binding:7,resource:GPU.N.createView()},
      {binding:8,resource:GPU.N.createView()}]})};
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
    {binding:5,resource:T.bloomB.createView()},{binding:6,resource:T.ui.createView()},{binding:7,resource:GPU.N.createView()},
    {binding:8,resource:GPU.N.createView()}]});
}
function gpuPass(view,pipe,bind){
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});
  p.setPipeline(pipe);p.setBindGroup(0,bind);p.draw(3);p.end();
}
function gpuUni(){
  const a=GPU.UA,P=GPU.post;
  a[0]=GPU.bw;a[1]=GPU.bh;a[2]=W;a[3]=H;a[4]=DPR;a[5]=P.k;a[6]=P.grain;a[7]=P.vig;
  a[8]=GPU.hitK;a[9]=GPU.hitDx;a[10]=GPU.uiOn?1:0;a[11]=GPU.sceneOn?1:0;
  a[12]=GPU.qw;a[13]=GPU.qh;a[14]=1.75/DPR;a[15]=G.t||0;
  const S=GPU.shaft;a[16]=S?S.x:0;a[17]=S?S.y:0;a[18]=S?S.k:0;a[19]=S?S.rad:0;a[20]=S?S.r:0;a[21]=S?S.g:0;a[22]=S?S.b:0;a[23]=GPU.sep||0;
  const L=GPU.sepH;for(let i=0;i<8;i++){const h=L[i],o=24+i*4;a[o]=h?h[0]:0;a[o+1]=h?h[1]:0;a[o+2]=h?h[2]:0;a[o+3]=0;}
  GPU.dev.queue.writeBuffer(GPU.U,0,a);
}

/* ── кадр ── */
/* начало кадра: без готового устройства кадр не рисуется (мир всё равно шагает) */
function gpuFrame(){
  if(!GPU.ok||GPU.lost){GPU.on=false;return false;}
  if(cvs.width!==GPU.bw||cvs.height!==GPU.bh||DPR!==GPU.dpr||W!==GPU.cw||H!==GPU.ch)gpuResize();
  if(GPU.trash.length){for(const t of GPU.trash)t.destroy();GPU.trash.length=0;}
  ctx=MAIN_CTX;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,GPU.bw,GPU.bh);ctx.setTransform(DPR,0,0,DPR,0,0);
  GPU.on=true;
  GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.overPass=null;GPU.sceneOn=false;GPU.emitOn=false;GPU.scene3D=false;GPU.hitK=0;GPU.shaft=null;GPU.sep=0;GPU.sepH.length=0;
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
      loadOp:GPU.sceneOn?"load":"clear",storeOp:"store",clearValue:GPU.sceneBg}]});
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
  if(!GPU.T.depth){GPU.T.depth=GPU.dev.createTexture({size:[GPU.bw,GPU.bh],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});GPU.V.depth=GPU.T.depth.createView();}
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
function gpuOver(){
  if(!GPU.on||!GPU.enc)return null;
  const d=GPU.dev;
  if(GPU.overPass){GPU.overPass.end();GPU.overPass=null;}
  if(!GPU.sceneOn)gpuScene();
  if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
  d.queue.copyExternalImageToTexture({source:cvs},{texture:GPU.T.front,premultipliedAlpha:true},[GPU.bw,GPU.bh]);
  gpuUni();
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"},
    {view:GPU.V.emit,loadOp:GPU.emitOn?"load":"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});
  GPU.emitOn=true;
  p.setPipeline(GPU.P.comp);p.setBindGroup(0,GPU.sep?gpuCompNeb():GPU.B.comp);p.draw(3);p.end();
  /* отправляем сделанное: следующая загрузка #c не должна обогнать эту склейку */
  d.queue.submit([GPU.enc.finish()]);GPU.enc=d.createCommandEncoder();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,GPU.bw,GPU.bh);ctx.restore();
  GPU.overPass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"}]});
  return GPU.overPass;
}
/* кадр вне цикла (тест, стенд, look): собрать, показать, снять — одной задачей */
function gpuManual(draw){
  if(!gpuFrame())return false;
  GPU.wantSnap=true;
  try{draw();}finally{if(GPU.on){if(GPU.enc&&ctx===MAIN_CTX)gpuWorld(0,false,false);gpuPresent();}}
  return true;
}
/* мир дорисован: передний слой — в текстуру, свечение — в четверть кадра.
   Дальше кадр рисует интерфейс — на свой слой, без свечения и зерна */
function gpuWorld(k,grain,vig){
  try{
    if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
    if(GPU.overPass){GPU.overPass.end();GPU.overPass=null;}
    const off=!!(G.opts&&G.opts.gfx&&G.opts.gfx.draw===0);
    const P=GPU.post;
    /* зерно теперь и на чёрном небе: видеокарте оно ничего не стоит, а в тёмных
       градиентах туманности и короны работает как дизеринг (2D снимал его ради
       полноэкранного overlay, 1–3 мс) */
    P.k=(!off&&G.running)?k:0;P.grain=(!off&&grain&&G.running)?1:0;P.vig=(!off&&grain&&vig&&G.running)?1:0;
    if(!GPU.noiseOk)gpuNoise();
    GPU.dev.queue.copyExternalImageToTexture({source:cvs},{texture:GPU.T.front,premultipliedAlpha:true},[GPU.bw,GPU.bh]);
    if(P.k>0){
      if(!GPU.emitOn){GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.emit,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]}).end();GPU.emitOn=true;}
      gpuBloom();}
    if(GPU.uiWas){const q=GPU.uctx;q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,GPU.bw,GPU.bh);q.setTransform(DPR,0,0,DPR,0,0);GPU.uiWas=false;}
    ctx=GPU.uctx;
  }catch(e){gpuDrop("сборка: "+((e&&e.message)||e),true);}
}
/* лестница свечения: колено в первый уровень, вниз по уровням, вверх — сложением */
function gpuBloom(){
  const V=GPU.MV,B=GPU.MB,n=V.length;
  gpuPass(V[0],GPU.P.down,GPU.B.down);
  for(let i=1;i<n;i++)gpuPass(V[i],GPU.P.mipDn,B[i-1]);
  for(let i=n-1;i>0;i--){
    const p=GPU.enc.beginRenderPass({colorAttachments:[{view:V[i-1],loadOp:"load",storeOp:"store"}]});
    p.setPipeline(GPU.P.mipUp);p.setBindGroup(0,B[i]);p.draw(3);p.end();}
}
/* конец кадра: слой интерфейса (если стойка рисовала), общий проход — на экран */
function gpuPresent(){
  if(!GPU.on||!GPU.enc){GPU.on=false;return;}
  try{
    const ui=(typeof rackOpen==="function")&&rackOpen()&&G.running&&!scrOpen();
    if(ui){GPU.dev.queue.copyExternalImageToTexture({source:GPU.ui},{texture:GPU.T.ui,premultipliedAlpha:true},[GPU.bw,GPU.bh]);GPU.uiWas=true;}
    GPU.uiOn=ui;
    gpuUni();
    gpuPass(GPU.gx.getCurrentTexture().createView(),GPU.P.fin,GPU.B.fin);
    GPU.dev.queue.submit([GPU.enc.finish()]);
    GPU.frameNo++;
    if(GPU.wantSnap){GPU.wantSnap=false;gpuTakeSnap();}
  }catch(e){gpuDrop("кадр: "+((e&&e.message)||e),true);}
  GPU.enc=null;GPU.on=false;
  if(ctx===GPU.uctx)ctx=MAIN_CTX;
}
/* поднимается после всего скрипта: в сборке тестов TEST объявлен ниже игры */
if(typeof document!=="undefined"&&document.body)setTimeout(gpuInit,0);
