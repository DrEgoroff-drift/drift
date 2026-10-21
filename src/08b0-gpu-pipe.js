/* ══════════════ конвейеры: одна воронка и прогрев (DESIGN-gpu §G) ══════════════
   Chrome компилирует конвейер WebGPU при создании и хранит скомпилированное
   по сайту: игрок с первого захода ловил рывки 50–67 мс у гостиницы и щита
   (S23, 25.09) — там создавались пять вариантов gcPipe, размытие и неон.
   Каждый ленивый создатель идёт сюда: gpuPipeline(ключ, рецепт). Прогретый
   ключ отдаётся готовым, иначе конвейер строится здесь же и ключ пишется
   в GPU_PIPES.lazy — это и видит детектор. Модули шейдеров — по тексту, один раз. */
/* used — каждый ключ, спрошенный у воронки с загрузки: из него детектор пишет таблицу (08b1) */
/* ворота взведены с загрузки: старт, нажатый до устройства, тоже ждёт; открывает их прогрев своего
   устройства или gpuNone (видеокарты нет — ждать нечего) */
const GPU_PIPES={dev:null,warm:new Map(),mods:new Map(),lazy:[],used:new Set(),done:false,n:0,ms:0,open:null};
GPU_PIPES.gate=new Promise(r=>{GPU_PIPES.open=r;});
function gpuPipesDev(){
  const d=GPU.dev;
  if(GPU_PIPES.dev!==d){GPU_PIPES.dev=d;GPU_PIPES.warm=new Map();GPU_PIPES.mods=new Map();}
  return d;
}
function gpuShader(code){
  const d=gpuPipesDev();let m=GPU_PIPES.mods.get(code);
  if(!m){m=d.createShaderModule({code});GPU_PIPES.mods.set(code,m);}
  return m;
}
/* code — текст шейдера у gpuPipe: прогретый по имени конвейер отдаётся, только если
   собран из того же текста (источник по имени разошёлся с местом вызова — это промах, не подмена) */
function gpuPipeline(key,mk,code){
  const d=gpuPipesDev(),w=GPU_PIPES.warm.get(key);GPU_PIPES.used.add(key);
  if(w&&w.p&&(code===undefined||w.code===code))return w.p;
  if(GPU_PIPES.lazy.length<256)GPU_PIPES.lazy.push(w&&w.p?key+" (текст шейдера не тот)":key);
  return d.createRenderPipeline(mk());
}
/* текст шейдера по имени gpuPipe — для прогрева: [код, раскладка]. Поля (fld.*) — тело поля,
   шапку и раскладку добавляет рецепт. Где выражение длиннее константы, место вызова берёт его отсюда */
const GPU_FLD={"fld.gbm":()=>GBM_WGSL,"fld.gbx":()=>GBX_WGSL,"fld.gnb.emi":()=>GNB_EMI,"fld.gew":()=>GEW_WGSL,
  "fld.gst":()=>GST_WGSL,"fld.hgflame":()=>HG_FLAME_WGSL,"fld.gsy.star":()=>GSY_STAR_WGSL,"fld.gsy.belt":()=>SBELT_HAZE_WGSL,"fld.gsky":()=>GSK_WGSL,"fld.belt.sky":()=>BGPU_SKY,
  "fld.abil.cone":()=>ABIL_CONE_WGSL,"fld.belt.rocklay":()=>BROCK_LAY_WGSL,
  /* поля режимов (поздний прогрев, GPU_LATE_KEYS ниже): шахта, база, дом, черпак, карта, «Сорока», комната 3D */
  "fld.gsky2":()=>GSK_WGSL,"fld.dig.mul":()=>CAVE_MUL_WGSL+DIG_OWN_WGSL,"fld.dig.add":()=>CAVE_ADD_WGSL+DIG_OWN_WGSL,
  "fld.dig.dark":()=>DIG_DARK_WGSL+DIG_OWN_WGSL,"fld.warm.glow":()=>WARM_GLOW_WGSL,
  "fld.baselight":()=>baseLightWgsl(),"fld.baseair":()=>baseAirWgsl(),
  "fld.scoop.air":()=>SCP_AIR,"fld.scoop.flow":()=>SCP_FLOW,"fld.scoop.obs":()=>SCP_OBS,
  "fld.map.gal":()=>GAL_WGSL,"fld.wansky":()=>WAN_SKY_WGSL,"fld.wanlit":()=>WAN_LIT_WGSL,"fld.wanair":()=>WAN_AIR_WGSL,
  "fld.r3post":()=>R3_POST_WGSL};
const GPU_PIPE_SRC={
  "kit.img":()=>[GPU_IMG_WGSL,gpuImgLayout()],"kit.shp":()=>[GPU_SHP_WGSL],"wand.sail":()=>[WAND_SAIL_WGSL],gen:()=>[GEN_WGSL],
  gtr:()=>[GTR_WGSL],gex:()=>[GEX_WGSL],gor:()=>[GOR_WGSL],gor0:()=>[gorCode(0)],gor1:()=>[gorCode(1)],gor2:()=>[gorCode(2)],gor3:()=>[gorCode(3)],gor4:()=>[gorCode(4)],gor5:()=>[gorCode(5)],gor6:()=>[gorCode(6)],gor7:()=>[gorCode(7)],gor8:()=>[gorCode(8)],"gsy.orb":()=>[GSY_ORB_WGSL],gpl:()=>[GPL_WGSL],
  "gsp.stars":()=>[GPU_WGSL_COMMON+GSP_WGSL_U+GSP_STARS],"gsp.dust":()=>[GPU_WGSL_COMMON+GSP_WGSL_U+GSP_DUST],
  "gsp.quad":()=>[(GPU_WGSL_COMMON+GSP_WGSL_U).replace(/@fragment fn fs\(i:VO\)[\s\S]*$/,"")+GSP_QUAD],
  "gnb.stars":()=>[GPU_WGSL_COMMON+GSP_WGSL_U.replace(/@fragment fn fs\(i:VO\)[\s\S]*$/,"")+GSP_STARS+GNB_STAR_ABS]};
for(const n in GPU_FLD)GPU_PIPE_SRC[n]=()=>[GPU_WGSL_COMMON+GPU_FLD_HEAD+GPU_FLD[n](),gpuFieldLayout()];
/* одиночные ключи — функция дескриптора в своём модуле */
const GPU_PIPE_ONE={"gc.mip":()=>gcMipDesc(),"gc.mip16":()=>gcMip16Desc(),"gc.mat":()=>gcMatDesc(),"gc.blur":()=>gcBlurDesc(),"gnb.gen|16f":()=>gnbGenDesc(),"gnb.fade":()=>gnbFadeDesc(),
  "gnb.noise":()=>gnbNoiseDesc(),"h3d.hull":()=>h3dDesc(),gps:()=>gpsDesc(),ovl:()=>ovlDesc(),par:()=>parDesc(false),"par.add":()=>parDesc(true)};
/* камни и пыль пояса (24be): три конвейера, каждый в двух видах — ×4 (ПК) и ×1 (телефон) */
for(const k of ["rock","rockf","dust"])for(const m of ["","4"])GPU_PIPE_ONE["belt."+k+m]=()=>brockPipeDesc("belt."+k+m);
/* рецепт по ключу: {desc, code} или null (ключ не знаком — детектор назовёт) */
function gpuPipeRecipe(key){
  if(key.startsWith("gc:"))return {desc:gcPipeDesc(key.slice(3))};
  if(key.startsWith("gc1:"))return {desc:gcPipeDesc(key.slice(4),1)};   /* крупный набор без MSAA (08ca) */
  if(key.startsWith("pipe:")){
    const a=key.slice(5),i=a.lastIndexOf("|"),s=GPU_PIPE_SRC[a.slice(0,i)];if(!s)return null;
    const [code,lay]=s();return {desc:gpuPipeDesc(code,a.slice(i+1),lay),code};
  }
  const f=GPU_PIPE_ONE[key];return f?{desc:f()}:null;
}
/* прогрев: все ключи таблицы — createRenderPipelineAsync, кадр не ждёт. Потолок держит тот,
   кто ждёт (старт полёта, обвязка тестов): под виртуальным временем таймер здесь сработал бы сразу */
function gpuPipesWarm(keys){
  const d=gpuPipesDev(),t0=wallMs(),jobs=[];
  GPU_PIPES.done=false;GPU_PIPES.n=0;GPU_PIPES.bad=[];
  for(const key of keys){
    let r=null;try{r=gpuPipeRecipe(key);}catch(e){r=null;}
    if(!r){GPU_PIPES.bad.push(key);continue;}
    const w={p:null,code:r.code};GPU_PIPES.warm.set(key,w);
    jobs.push(d.createRenderPipelineAsync(r.desc).then(p=>{if(GPU_PIPES.dev===d){w.p=p;GPU_PIPES.n++;}},()=>{GPU_PIPES.bad.push(key);}));
  }
  /* прогрев брошенного устройства ворот не открывает: их откроет прогрев нового */
  return GPU_PIPES.warmP=Promise.all(jobs).then(()=>{if(GPU_PIPES.dev!==d)return;
    GPU_PIPES.done=true;GPU_PIPES.ms=Math.round(wallMs()-t0);GPU_PIPES.open();});
}
/* старт полёта ждёт прогрева не дольше ms — дальше ленивый путь */
function gpuAfterWarm(fn,ms){
  if(GPU_PIPES.done||GPU.none){fn();return;}
  let go=false;const run=()=>{if(!go){go=true;fn();}};
  GPU_PIPES.gate.then(run);setTimeout(run,ms||2500);
}
/* ══════════════ поздний прогрев: конвейеры режимов ══════════════
   Таблица 08b1 — это полёт: её ждёт «Начать». Режимы, куда игрок входит позже (посадка, пещера,
   шахта, база, дом, черпак, карта, «Сорока», док, рейд), создавали свои конвейеры на входе, и кадр
   стоял, пока компилятор видеокарты доделывал три—четырнадцать штук: 130–480 мс на ПК при 15–30 мс
   работы JS (замер QA 14.10, настоящие часы). Теперь после прогрева полёта они строятся фоном, по
   одному, ворота их не ждут; готовые лежат в той же карте GPU_PIPES.warm, и место вызова не
   меняется — воронка находит готовое. Список ведёт руками тот, кто добавил режим; сторож —
   набор «входы в режимы не строят конвейеры» (tests/91zzzzzzy5-modepipes.js).
   Ярусные группы (планета, пещера) приносят свои дескрипторы: GPU_LATE_GROUPS.push(() => [[ключ, {desc}]…]) */
const GPU_LATE_KEYS=[
  "pipe:fld.gsky2|over","pipe:fld.dig.mul|mul","pipe:fld.dig.add|add","pipe:fld.dig.dark|mul","pipe:fld.warm.glow|add",
  "pipe:fld.baselight|mul","pipe:fld.baseair|add",
  "pipe:fld.hin.light|mul","pipe:fld.hin.haze|add","pipe:fld.hin.air|add","pipe:fld.hin.flit|over",
  "pipe:fld.scoop.air|over","pipe:fld.scoop.flow|over","pipe:fld.scoop.obs|over",
  "pipe:fld.map.gal|over","pipe:fld.map.gal|bake",
  "pipe:fld.wansky|over","pipe:fld.wanlit|mul","pipe:fld.wanair|add",
  "r3.main","r3.shadow","r3.down","pipe:fld.r3post|over","raid3d","raid3d.spr"];
const GPU_LATE_GROUPS=[];
/* по одному ключу за шаг, 30 мс между шагами: компилятор не занят ничем другим, кадр не ждёт.
   GPU_PIPES.late — {n, ms, done, bad} для детектора и лаборатории */
function gpuPipesLate(){
  const d=gpuPipesDev(),t0=wallMs(),L=GPU_PIPES.late={n:0,ms:0,done:false,bad:[],asked:0};
  const todo=GPU_LATE_KEYS.map(k=>()=>{const r=gpuPipeRecipe(k);return r?[[k,r]]:(L.bad.push(k),[]);}).concat(
    GPU_LATE_GROUPS.map(g=>()=>g()));
  const flat=[];
  const next=()=>{
    if(GPU_PIPES.dev!==d)return;   /* устройство сменилось: прогрев нового начнёт свой */
    while(!flat.length&&todo.length){try{for(const x of todo.shift()())flat.push(x);}catch(e){L.bad.push(String(e&&e.message||e).slice(0,60));}}
    const it=flat.shift();
    if(!it){L.done=true;L.ms=Math.round(wallMs()-t0);return;}
    const key=it[0],r=it[1],c=GPU_PIPES.warm.get(key);
    if(c&&c.p){next();return;}
    const w={p:null,code:r.code};GPU_PIPES.warm.set(key,w);L.asked++;
    d.createRenderPipelineAsync(r.desc).then(p=>{if(GPU_PIPES.dev===d){w.p=p;L.n++;}},()=>{L.bad.push(key);})
      .then(()=>setTimeout(next,30));
  };
  next();
}
