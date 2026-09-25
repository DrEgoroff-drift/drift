/* ══════════════ слой приборов: #hud и фишки у кромки (ступень 1, docs/DESIGN-gpu.md §L.S) ══════════════
   Приборы не ходят через видеокарту: браузер сам кладёт их поверх канвы WebGPU. Два правила
   Контроля (15/n): приборы — на родном DPR устройства (мир на телефоне ×1.5, текст — ×2.625,
   резкий), и растр только по изменению — полноэкранный холст на 2.625 весит ~10 МБ, и перерисовка
   каждый кадр гоняла бы их в композитор.
   · #hud (GPU.ui) — то, что меняется редко или только под пальцем: стики, строка наблюдения,
     стойка. Кто рисует, сдаёт gpuHud(ключ, рисунок); в конце мира (gpuHudFlush) слой
     перерисовывается, только если строка ключей кадра не та, что в прошлый раз.
   · фишки у кромки и подписи мира ездят за миром каждый кадр — их рисует видеокарта на свой
     слой #ovl (08bi), без 2D. */
function gpuHudDpr(){return Math.min(3,(typeof window!=="undefined"&&window.devicePixelRatio)||1);}
/* рисунок слоя приборов: без видеокарты — на #c сразу, как раньше */
function gpuHud(key,fn){
  if(!GPU.on||!GPU.uctx){fn();return;}
  (GPU.hq||(GPU.hq=[])).push({key,fn});
}
/* конец мира: слой перерисовывается, только если ключи сменились; дальше кадр рисует стойку
   (25d) — тоже сюда, её ключ меняется каждый кадр */
function gpuHudFlush(rack){
  const q=GPU.hq||[],u=GPU.uctx;
  let key=q.map(e=>e.key).join("|");if(rack)key+="|rack"+GPU.frameNo;
  if(key!==GPU.hkey){
    if(GPU.uiWas){u.setTransform(1,0,0,1,0,0);u.clearRect(0,0,GPU.ui.width,GPU.ui.height);}
    const nd=GPU.ui.width/Math.max(1,W),c0=ctx;ctx=u;
    /* сбой одного художника — строка «СБОЙ» стража кадра, остальные рисуют дальше: видеокарта тут ни при чём */
    try{for(const e of q){u.setTransform(nd,0,0,nd,0,0);u.save();try{e.fn();}catch(err){crashSay(err,"приборы");}finally{u.restore();}}}
    finally{ctx=c0;}
    u.setTransform(nd,0,0,nd,0,0);
    GPU.uiWas=key!=="";GPU.hkey=key;
  }
  q.length=0;
  ovFlush();domLabelEnd();
}
/* снимок кадра (gpuTakeSnap): фишки поверх, как их кладёт композитор, — чтобы look(),
   детекторы и эталоны видели то же, что игрок. Платится только в момент снимка */
function chipDomSnap(g,sc){
  /* лампы кабины пояса (#labels, 24bc) — первыми: на экране они под слоем фишек */
  for(const e of LABDOM.m.values())if(e.on){g.globalAlpha=Math.min(1,e.A);g.drawImage(e.cv,e.x*sc,e.y*sc,e.w*sc,e.h*sc);}
  g.globalAlpha=1;
  if(OVL.on&&OVL.cv)g.drawImage(OVL.cv,0,0,OVL.cv.width/ovNd()*sc,OVL.cv.height/ovNd()*sc);
}
/* ── слой #labels: свои холсты ламп кабины пояса (24bc) — до её переноса на видеокарту ──
   Подписи мира (domLabel) — на #ovl (08bi) */
const LABDOM={m:new Map(),id:new WeakMap(),n:0};
/* свой слой — сразу за #hud, под #ovl: подпись лежит под фишками */
function labDomBox(){
  if(LABDOM.box||typeof document==="undefined"||!document.body||!GPU.ok)return LABDOM.box;
  const b=document.createElement("div");b.id="labels";
  b.style.cssText="position:fixed;inset:0;pointer-events:none;overflow:hidden";
  (GPU.ui||GPU.cv||cvs).after(b);return LABDOM.box=b;
}
/* ключ подписи для вещи без своего сида (контейнер): номер живёт рядом, не в самой вещи —
   поле в объекте мира уехало бы в сейв */
function domLabelId(o){let i=LABDOM.id.get(o);if(!i){i=++LABDOM.n;LABDOM.id.set(o,i);}return i;}
/* конец мира (gpuHudFlush): подписи, которых в кадре не было, — спрятать */
function domLabelEnd(){
  for(const [k,e] of LABDOM.m){
    if(e.used)e.last=GPU.frameNo;
    else{if(e.on){e.on=false;e.cv.style.display="none";}
      /* давно не нужна (пират ушёл, планета другой системы) — долой из DOM */
      if(GPU.frameNo-(e.last||0)>600){e.cv.remove();LABDOM.m.delete(k);}}
    e.used=false;
  }
  LABDOM.fl=true;
}
/* начало кадра: мир прошлого кадра не доходил до конца (другой режим, чистый кадр) — слой
   фишек спрятать; очередь, брошенная посреди кадра, — долой */
function chipDomSweep(){
  if(!OVL.fl&&OVL.on){OVL.on=false;OVL.cv.style.display="none";}
  OVL.fl=false;OVL.lq.length=OVL.cq.length=0;
  /* мир прошлого кадра не доходил до конца (другой режим) — подписи тоже спрятать */
  if(!LABDOM.fl)for(const e of LABDOM.m.values()){if(e.on){e.on=false;e.cv.style.display="none";}}
  LABDOM.fl=false;
}
