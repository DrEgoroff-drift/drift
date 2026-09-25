/* ══════════════ конвейеры: одна воронка и прогрев (DESIGN-gpu §G) ══════════════
   Chrome компилирует конвейер WebGPU при создании и хранит скомпилированное
   по сайту: игрок с первого захода ловил рывки 50–67 мс у гостиницы и щита
   (S23, 25.09) — там создавались пять вариантов gcPipe, размытие и неон.
   Каждый ленивый создатель идёт сюда: gpuPipeline(ключ, рецепт). Прогретый
   ключ отдаётся готовым, иначе конвейер строится здесь же и ключ пишется
   в GPU_PIPES.lazy — это и видит детектор. Модули шейдеров — по тексту, один раз. */
/* used — каждый ключ, спрошенный у воронки с загрузки: из него детектор пишет таблицу (08b1) */
const GPU_PIPES={dev:null,warm:new Map(),mods:new Map(),lazy:[],used:new Set(),done:true,n:0,ms:0};
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
  "fld.gst":()=>GST_WGSL,"fld.hgflame":()=>HG_FLAME_WGSL,"fld.gsy.star":()=>GSY_STAR_WGSL,"fld.gsky":()=>GSK_WGSL,"fld.belt.sky":()=>BGPU_SKY};
const GPU_PIPE_SRC={
  "kit.img":()=>[GPU_IMG_WGSL],"kit.shp":()=>[GPU_SHP_WGSL],"wand.sail":()=>[WAND_SAIL_WGSL],gen:()=>[GEN_WGSL],
  gtr:()=>[GTR_WGSL],gex:()=>[GEX_WGSL],"gsy.orb":()=>[GSY_ORB_WGSL],gpl:()=>[GPL_WGSL],
  "gsp.stars":()=>[GPU_WGSL_COMMON+GSP_WGSL_U+GSP_STARS],"gsp.dust":()=>[GPU_WGSL_COMMON+GSP_WGSL_U+GSP_DUST],
  "gsp.quad":()=>[(GPU_WGSL_COMMON+GSP_WGSL_U).replace(/@fragment fn fs\(i:VO\)[\s\S]*$/,"")+GSP_QUAD],
  "gnb.stars":()=>[GPU_WGSL_COMMON+GSP_WGSL_U.replace(/@fragment fn fs\(i:VO\)[\s\S]*$/,"")+GSP_STARS+GNB_STAR_ABS]};
for(const n in GPU_FLD)GPU_PIPE_SRC[n]=()=>[GPU_WGSL_COMMON+GPU_FLD_HEAD+GPU_FLD[n](),gpuFieldLayout()];
/* одиночные ключи — функция дескриптора в своём модуле */
const GPU_PIPE_ONE={"gc.mip":()=>gcMipDesc(),"gc.blur":()=>gcBlurDesc(),"gnb.gen|16f":()=>gnbGenDesc(),
  "gnb.noise":()=>gnbNoiseDesc(),gps:()=>gpsDesc(),ovl:()=>ovlDesc()};
/* рецепт по ключу: {desc, code} или null (ключ не знаком — детектор назовёт) */
function gpuPipeRecipe(key){
  if(key.startsWith("gc:"))return {desc:gcPipeDesc(key.slice(3))};
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
  return GPU_PIPES.warmP=Promise.all(jobs).then(()=>{GPU_PIPES.done=true;GPU_PIPES.ms=Math.round(wallMs()-t0);});
}
/* старт полёта ждёт прогрева не дольше ms — дальше ленивый путь */
function gpuAfterWarm(fn,ms){
  if(GPU_PIPES.done||!GPU_PIPES.warmP){fn();return;}
  let go=false;const run=()=>{if(!go){go=true;fn();}};
  GPU_PIPES.warmP.then(run);setTimeout(run,ms||2500);
}
