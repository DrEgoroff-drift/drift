/* ══════════════ видеокарта: кадр собирает WebGPU (G0, docs/DESIGN-gpu.md) ══════════════
   Гибрид по решению автора (23.09): что видеокарта умеет — считает она (поля,
   частицы, свет, пост); чего не умеет — рисует Canvas 2D на прозрачный
   передний слой, и он ложится в кадр текстурой. Нет WebGPU, gfx.gpu=0, тест или
   стенд — игра рисует по-старому, целиком в 2D, и ничего не теряет.
   Кадр: сцена видеокарты (gpuScene) → передний 2D-слой → свечение, зерно,
   виньетка, хроматика одним проходом → слой интерфейса (стойка) поверх. */
const GPU={ok:false,on:false,shown:false,lost:false,busy:false,dead:false,
  dev:null,cv:null,gx:null,fmt:"",L:null,P:{},B:{},S:null,U:null,UA:new Float32Array(16),
  T:{},V:{},N:null,noiseOk:false,front:null,fctx:null,ui:null,uctx:null,
  bw:0,bh:0,qw:2,qh:2,dpr:0,cw:0,ch:0,enc:null,scenePass:null,sceneOn:false,
  sceneBg:{r:0,g:0,b:0,a:1},uiOn:false,uiWas:false,hitK:0,hitDx:0,post:{k:0,grain:0,vig:0},q:null};

/* адрес решает раньше настроек: ?gpu=1 включает и на стенде (сверка кадров),
   ?gpu=0 выключает везде. Стенды и тесты снимают #c — им старый путь */
function gpuWanted(){
  if(typeof TEST!=="undefined"||GPU.dead)return false;
  if(GPU.q===null){const s=(typeof location!=="undefined"&&location.search)||"";
    GPU.q=/[?&]gpu=1/.test(s)?1:(/[?&]gpu=0/.test(s)||/[?&](s|scene|shot)=/.test(s))?0:-1;}
  if(GPU.q>=0)return GPU.q===1;
  try{return G.opts.gfx.gpu!==0;}catch(e){return true;}
}
/* холст кадра для тех, кто его читает (марево, отражение в воде, look):
   в режиме видеокарты кадр 2D живёт на переднем слое, а не в #c */
function frameCanvas(){return (GPU.shown&&GPU.front)?GPU.front:cvs;}

async function gpuInit(){
  if(GPU.ok||GPU.busy||GPU.dead||typeof TEST!=="undefined")return;
  if(typeof navigator==="undefined"||!navigator.gpu)return;
  GPU.busy=true;
  try{
    const ad=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});
    if(!ad)return;
    const dev=await ad.requestDevice();
    GPU.dev=dev;GPU.lost=false;
    dev.lost.then(i=>{if(GPU.dev===dev&&!(i&&i.reason==="destroyed"))gpuDrop("устройство потеряно: "+((i&&i.message)||""),true);});
    /* ошибка проверки — картинка уже неправда: назад в 2D до конца сеанса */
    dev.addEventListener("uncapturederror",e=>{gpuDrop("ошибка: "+String((e.error&&e.error.message)||e.error),false);GPU.dead=true;});
    if(!GPU.cv){
      const cv=document.createElement("canvas");cv.id="g";
      /* поверх #c, но прозрачен для пальца: события слушает #c (15-input, 15a-helm) */
      cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;display:none;pointer-events:none";
      cvs.after(cv);GPU.cv=cv;
    }
    GPU.gx=GPU.cv.getContext("webgpu");
    GPU.fmt=navigator.gpu.getPreferredCanvasFormat();
    GPU.gx.configure({device:dev,format:GPU.fmt,alphaMode:"opaque"});
    if(!GPU.front){
      GPU.front=document.createElement("canvas");GPU.fctx=GPU.front.getContext("2d",{alpha:true});
      GPU.ui=document.createElement("canvas");GPU.uctx=GPU.ui.getContext("2d",{alpha:true});
    }
    gpuPipes();
    GPU.T={};GPU.bw=0;GPU.ok=true;
    gpuResize();
  }catch(e){
    GPU.ok=false;
    try{crashShip("gpu","init: "+((e&&e.message)||e),"");}catch(_){}
  }finally{GPU.busy=false;}
}
/* видеокарта отказала — кадр возвращается в 2D сразу, со следующего же кадра */
function gpuDrop(why,retry){
  GPU.ok=false;GPU.on=false;GPU.shown=false;GPU.lost=true;GPU.enc=null;GPU.scenePass=null;
  if(GPU.cv)GPU.cv.style.display="none";
  if(ctx===GPU.fctx||ctx===GPU.uctx)ctx=MAIN_CTX;
  try{MAIN_CTX.setTransform(DPR,0,0,DPR,0,0);}catch(_){}
  try{crashShip("gpu",why,"");}catch(_){}
  if(retry&&!GPU.dead)setTimeout(()=>{GPU.lost=false;GPU.dev=null;gpuInit();},2000);
}

/* ── проходы поста: общий треугольник на весь экран, одна раскладка привязок ── */
const GPU_POST_WGSL=`
struct U{res:vec2f,css:vec2f,dpr:f32,k:f32,grain:f32,vig:f32,hitK:f32,hitDx:f32,ui:f32,scene:f32,qres:vec2f,sigma:f32,t:f32};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var sl:sampler;
@group(0) @binding(2) var sr:sampler;
@group(0) @binding(3) var tScene:texture_2d<f32>;
@group(0) @binding(4) var tFront:texture_2d<f32>;
@group(0) @binding(5) var tBloom:texture_2d<f32>;
@group(0) @binding(6) var tUi:texture_2d<f32>;
@group(0) @binding(7) var tNoise:texture_2d<f32>;
struct V{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->V{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:V;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
/* кадр = сцена видеокарты под передним 2D-слоем (премультиплицированным) */
fn frameAt(uv:vec2f)->vec3f{
  let f=textureSampleLevel(tFront,sl,uv,0.);
  var s=vec3f(0.);
  if(u.scene>.5){s=textureSampleLevel(tScene,sl,uv,0.).rgb;}
  return s*(1.-f.a)+f.rgb;}
/* свечение: четверть кадра в пикселях CSS, как в 2D (19c bloomPass), но честным
   ящиком 4×4 вместо билинейного сжатия — мелкие яркие точки не мерцают */
@fragment fn fsDown(v:V)->@location(0) vec4f{
  let fp=1./u.qres;var c=vec3f(0.);
  for(var j=0;j<4;j++){for(var i=0;i<4;i++){
    let o=(vec2f(f32(i),f32(j))+.5)/4.-.5;c+=frameAt(v.uv+o*fp);}}
  c=c/16.;return vec4f(c*c,1.);}
fn blur(uv:vec2f,d:vec2f)->vec4f{
  let s=max(u.sigma,.3);let r=ceil(3.*s);var acc=vec3f(0.);var w=0.;
  for(var i=-6;i<=6;i++){let x=f32(i);if(abs(x)>r){continue;}
    let g=exp(-x*x/(2.*s*s));acc+=textureSampleLevel(tBloom,sl,uv+d*x,0.).rgb*g;w+=g;}
  return vec4f(acc/w,1.);}
@fragment fn fsBlurH(v:V)->@location(0) vec4f{return blur(v.uv,vec2f(1./u.qres.x,0.));}
@fragment fn fsBlurV(v:V)->@location(0) vec4f{return blur(v.uv,vec2f(0.,1./u.qres.y));}
fn overlay(b:vec3f,s:vec3f)->vec3f{return select(1.-2.*(1.-b)*(1.-s),2.*b*s,b<vec3f(.5));}
@fragment fn fsFinal(v:V)->@location(0) vec4f{
  var c=frameAt(v.uv);
  if(u.k>0.){c=min(c+u.k*textureSampleLevel(tBloom,sl,v.uv,0.).rgb,vec3f(1.));}
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
  return vec4f(c,1.);}`;

function gpuPipes(){
  const d=GPU.dev,F=GPUShaderStage.FRAGMENT;
  const mod=d.createShaderModule({code:GPU_POST_WGSL});
  const ent=[{binding:0,visibility:F,buffer:{type:"uniform"}},
    {binding:1,visibility:F,sampler:{type:"filtering"}},{binding:2,visibility:F,sampler:{type:"filtering"}}];
  for(const b of [3,4,5,6,7])ent.push({binding:b,visibility:F,texture:{sampleType:"float"}});
  GPU.L=d.createBindGroupLayout({entries:ent});
  const PL=d.createPipelineLayout({bindGroupLayouts:[GPU.L]});
  const mk=(fs,fmt)=>d.createRenderPipeline({layout:PL,vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:fs,targets:[{format:fmt}]},primitive:{topology:"triangle-list"}});
  GPU.P={down:mk("fsDown","rgba16float"),blurH:mk("fsBlurH","rgba16float"),
         blurV:mk("fsBlurV","rgba16float"),fin:mk("fsFinal",GPU.fmt)};
  GPU.S={lin:d.createSampler({magFilter:"linear",minFilter:"linear"}),
         rep:d.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"})};
  GPU.U=d.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
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
  /* смена ширины холста сбрасывает и его преобразование */
  GPU.front.width=bw;GPU.front.height=bh;GPU.ui.width=bw;GPU.ui.height=bh;
  GPU.fctx.setTransform(DPR,0,0,DPR,0,0);GPU.uctx.setTransform(DPR,0,0,DPR,0,0);GPU.uiWas=false;
  GPU.cv.width=bw;GPU.cv.height=bh;
  const qw=Math.max(2,Math.round(W/4)),qh=Math.max(2,Math.round(H/4));
  for(const k in GPU.T)GPU.T[k].destroy();
  const TB=GPUTextureUsage.TEXTURE_BINDING,RA=GPUTextureUsage.RENDER_ATTACHMENT,CD=GPUTextureUsage.COPY_DST;
  const mk=(w,h,f,us)=>GPU.dev.createTexture({size:[w,h],format:f,usage:us});
  GPU.T={front:mk(bw,bh,"rgba8unorm",TB|CD|RA),ui:mk(bw,bh,"rgba8unorm",TB|CD|RA),
    scene:mk(bw,bh,"rgba8unorm",TB|RA),bloomA:mk(qw,qh,"rgba16float",TB|RA),bloomB:mk(qw,qh,"rgba16float",TB|RA)};
  GPU.V={scene:GPU.T.scene.createView(),bloomA:GPU.T.bloomA.createView(),bloomB:GPU.T.bloomB.createView()};
  GPU.bw=bw;GPU.bh=bh;GPU.qw=qw;GPU.qh=qh;GPU.dpr=DPR;GPU.cw=W;GPU.ch=H;
  const S=GPU.S,T=GPU.T;
  const bind=bloom=>GPU.dev.createBindGroup({layout:GPU.L,entries:[
    {binding:0,resource:{buffer:GPU.U}},{binding:1,resource:S.lin},{binding:2,resource:S.rep},
    {binding:3,resource:T.scene.createView()},{binding:4,resource:T.front.createView()},
    {binding:5,resource:bloom.createView()},{binding:6,resource:T.ui.createView()},{binding:7,resource:GPU.N.createView()}]});
  /* текстура не может быть и целью прохода, и его входом: свечение ходит между A и B */
  GPU.B={down:bind(T.bloomB),blurH:bind(T.bloomA),blurV:bind(T.bloomB),fin:bind(T.bloomA)};
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
  GPU.dev.queue.writeBuffer(GPU.U,0,a);
}

/* ── кадр ── */
/* начало кадра: решаем, кто его собирает; в режиме видеокарты ctx смотрит на
   передний слой, и весь 2D-код рисует туда, не зная об этом */
function gpuFrame(){
  const on=GPU.ok&&!GPU.lost&&gpuWanted();
  if(on!==GPU.shown){
    GPU.shown=on;if(GPU.cv)GPU.cv.style.display=on?"block":"none";
    if(!on)try{MAIN_CTX.setTransform(DPR,0,0,DPR,0,0);}catch(_){}
  }
  if(!on){GPU.on=false;if(ctx===GPU.fctx||ctx===GPU.uctx)ctx=MAIN_CTX;return false;}
  if(cvs.width!==GPU.bw||cvs.height!==GPU.bh||DPR!==GPU.dpr||W!==GPU.cw||H!==GPU.ch)gpuResize();
  const f=GPU.fctx;
  f.setTransform(1,0,0,1,0,0);f.clearRect(0,0,GPU.bw,GPU.bh);f.setTransform(DPR,0,0,DPR,0,0);
  ctx=f;GPU.on=true;
  GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.hitK=0;
  return true;
}
/* проход сцены видеокарты: его открывает первый слой кадра, закрывает сборка.
   Всё, что рисуется сюда, лежит ПОД передним 2D-слоем (docs/DESIGN-gpu.md §3) */
function gpuScene(){
  if(!GPU.scenePass){
    GPU.scenePass=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"clear",storeOp:"store",clearValue:GPU.sceneBg}]});
    GPU.sceneOn=true;
  }
  return GPU.scenePass;
}
/* мир дорисован: передний слой — в текстуру, свечение — в четверть кадра.
   Дальше кадр рисует интерфейс — на свой слой, без свечения и зерна */
function gpuWorld(k,grain,vig){
  try{
    if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;}
    const off=!!(G.opts&&G.opts.gfx&&G.opts.gfx.draw===0);
    const dark=G.mode==="system"||G.mode==="dock"||G.mode==="barge";
    const P=GPU.post;
    P.k=(!off&&G.running)?k:0;P.grain=(!off&&grain&&!dark&&G.running)?1:0;P.vig=(!off&&grain&&vig&&G.running)?1:0;
    if(!GPU.noiseOk)gpuNoise();
    GPU.dev.queue.copyExternalImageToTexture({source:GPU.front},{texture:GPU.T.front,premultipliedAlpha:true},[GPU.bw,GPU.bh]);
    if(P.k>0){gpuPass(GPU.V.bloomA,GPU.P.down,GPU.B.down);gpuPass(GPU.V.bloomB,GPU.P.blurH,GPU.B.blurH);gpuPass(GPU.V.bloomA,GPU.P.blurV,GPU.B.blurV);}
    if(GPU.uiWas){const q=GPU.uctx;q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,GPU.bw,GPU.bh);q.setTransform(DPR,0,0,DPR,0,0);GPU.uiWas=false;}
    ctx=GPU.uctx;
  }catch(e){gpuDrop("сборка: "+((e&&e.message)||e),true);}
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
  }catch(e){gpuDrop("кадр: "+((e&&e.message)||e),true);}
  GPU.enc=null;GPU.on=false;
  if(ctx===GPU.fctx||ctx===GPU.uctx)ctx=MAIN_CTX;
}
/* поднимается после всего скрипта: в сборке тестов TEST объявлен ниже игры */
if(typeof navigator!=="undefined"&&navigator.gpu)setTimeout(gpuInit,0);
