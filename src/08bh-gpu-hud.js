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
/* конец мира: слой перерисовывается, только если ключи сменились (стойка 25d — на слое #ovl, сюда не ходит) */
function gpuHudFlush(){
  const q=GPU.hq||[],u=GPU.uctx;
  const key=q.map(e=>e.key).join("|");
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
  ovFlush();
}
/* снимок кадра (gpuTakeSnap): фишки поверх, как их кладёт композитор, — чтобы look(),
   детекторы и эталоны видели то же, что игрок. Платится только в момент снимка */
function chipDomSnap(g,sc){
  if(OVL.on&&OVL.cv)g.drawImage(OVL.cv,0,0,OVL.cv.width/ovNd()*sc,OVL.cv.height/ovNd()*sc);
}
/* подписи мира (domLabel) — на #ovl (08bi) */
const DLID={id:new WeakMap(),n:0};
/* ключ подписи для вещи без своего сида (контейнер): номер живёт рядом, не в самой вещи —
   поле в объекте мира уехало бы в сейв */
function domLabelId(o){let i=DLID.id.get(o);if(!i){i=++DLID.n;DLID.id.set(o,i);}return i;}
/* начало кадра: мир прошлого кадра не доходил до конца (другой режим, чистый кадр) — слой
   фишек спрятать; очередь, брошенная посреди кадра, — долой */
function chipDomSweep(){
  if(!OVL.fl&&OVL.on){OVL.on=false;OVL.cv.style.display="none";}
  OVL.fl=false;OVL.lq.length=OVL.cq.length=0;
}
