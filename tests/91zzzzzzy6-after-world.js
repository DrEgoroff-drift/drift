/* ══════════════ страж «2D на #c после gpuWorld — ноль» (флот, 26.09) ══════════════
   После gpuWorld мир собран: что 2D положит на #c дальше, либо пропадёт, либо снова потянет
   загрузку #c. Интерфейс — на #ovl (08bi). Перепись 25 сцен (26.09) дала здесь 0 везде; страж
   держит этот ноль.
   Запись — на СОБСТВЕННЫХ методах MAIN_CTX: хук 08c (gpuFrontHook) кладёт на #c свои обёртки,
   и они зовут исходные методы прототипа — обёртка на прототипе, поставленная после хука, на #c
   слепа (первый прогон переписи так и показал 0 вызовов при 2–5 загрузках #c за кадр).
   Сверка с истиной: загрузка #c бывает только у испачканного слоя (gpuFrontClean), значит сцена
   с загрузками и без единого записанного рисующего вызова — запись ослепла.
   Самопроверка: один fillRect, подкинутый после gpuWorld, обязан попасть в счёт — иначе страж
   ослепнет при следующей правке хука и будет зелёным вслепую. */
const AW_KS=["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData","clearRect"];
TEST_SUITES.push(()=>suite("страж: 2D на #c после gpuWorld — ноль во всех сценах look и на дороге",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё страж не меряется"))return;
  const WARM=6,N=12,Cx=MAIN_CTX,cm={},Q=GPUQueue.prototype,c0=Q.copyExternalImageToTexture,run0=G.running,loop0=LOOP_OFF,gw0=window.gpuWorld;
  const K={on:false,after:0,seen:0,up:0,by:{}};
  const who=()=>new Error().stack.split("\n").slice(3,6).map(l=>{const m=/at (?:new )?([\w$.]+)/.exec(l);return m?m[1]:"?";}).join("<");
  const top=()=>Object.entries(K.by).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  let inject=-1,t=wallMs();
  const fb=()=>frameBody(t+=16.7);
  const run=(name,set,frame)=>{
    resetWorld();G.running=true;LOOP_OFF=false;
    try{set();}catch(e){ok(false,name+": сцена не встала: "+e.message);return null;}
    K.after=K.seen=K.up=0;K.by={};
    try{for(let i=0;i<WARM+N;i++){K.on=i>=WARM;frame(i);}}catch(e){ok(false,name+": кадр упал: "+e.message);}
    K.on=false;return K;};
  try{
    gpuFrontHook();
    for(const k of AW_KS){const o=Cx[k];cm[k]=o;
      Cx[k]=function(){if(K.on){if(k!=="clearRect")K.seen++;
        if(GPU.on&&GPU.wDone){K.after++;const w=k+":"+who();K.by[w]=(K.by[w]||0)+1;}}
        return o.apply(this,arguments);};}
    Q.copyExternalImageToTexture=function(src){if(K.on&&src&&src.source===cvs)K.up++;return c0.apply(this,arguments);};
    window.gpuWorld=function(){const r=gw0.apply(this,arguments);if(inject===0)MAIN_CTX.fillRect(0,0,1,1);inject--;return r;};
    const judge=(name,set,frame)=>{if(!run(name,set,frame))return;
      eq(K.after,0,name+": 2D на #c после gpuWorld — ноль"+(K.after?": "+top():""));
      ok(!K.up||K.seen>0,name+": запись видит #c — загрузок #c "+K.up+", записанных рисующих вызовов "+K.seen);};
    for(const S of lookScenes())judge("look «"+S.id+"»",()=>S.set(),fb);
    judge("дорога на ходу",()=>{document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
      G.road=null;roadOpen();RD.kmh=90;RD.accT=.8;},i=>drawRoad(1000+i*32));
    document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));G.road=null;
    /* самопроверка: fillRect после gpuWorld на третьем замеренном кадре — ровно один в счёте */
    const S0=lookScenes()[0];
    const k=run("самопроверка",()=>S0.set(),i=>{inject=i===WARM+2?0:-1;fb();});
    ok(!!k&&k.after===1,"самопроверка: подкинутый после gpuWorld fillRect попал в счёт ("+(k?k.after:"—")+" из 1)");
  }finally{
    K.on=false;inject=-1;window.gpuWorld=gw0;Q.copyExternalImageToTexture=c0;
    for(const k in cm)Cx[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  resetWorld();
}));
