/* ══════════════ слой приборов: #hud и фишки у кромки (ступень 1, docs/DESIGN-gpu.md §L.S) ══════════════
   Приборы не ходят через видеокарту: браузер сам кладёт их поверх канвы WebGPU. Два правила
   Контроля (15/n): приборы — на родном DPR устройства (мир на телефоне ×1.5, текст — ×2.625,
   резкий), и растр только по изменению — полноэкранный холст на 2.625 весит ~10 МБ, и перерисовка
   каждый кадр гоняла бы их в композитор.
   · #hud (GPU.ui) — то, что меняется редко или только под пальцем: стики, строка наблюдения,
     стойка. Кто рисует, сдаёт gpuHud(ключ, рисунок); в конце мира (gpuHudFlush) слой
     перерисовывается, только если строка ключей кадра не та, что в прошлый раз.
   · фишки у кромки ездят за миром каждый кадр — это DOM: место и поворот стрелки двигает
     композитор (transform), а свой маленький холст фишка перерисовывает, только когда сменилась
     подпись или цвет. */
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
    try{for(const e of q){u.setTransform(nd,0,0,nd,0,0);u.save();try{e.fn();}finally{u.restore();}}}
    finally{ctx=c0;}
    u.setTransform(nd,0,0,nd,0,0);
    GPU.uiWas=key!=="";GPU.hkey=key;
  }
  q.length=0;
}
/* ── фишки у кромки ── */
const CHIPDOM={box:null,m:new Map(),touched:false};
function chipDomBox(){
  if(CHIPDOM.box||typeof document==="undefined"||!document.body)return CHIPDOM.box;
  const b=document.createElement("div");b.id="chips";
  b.style.cssText="position:fixed;inset:0;pointer-events:none;overflow:hidden";
  (GPU.ui||GPU.cv||cvs).after(b);return CHIPDOM.box=b;
}
/* фишка k в кадре: место (rx,ry) и размер (cw,ch) в мерке U, прозрачность, цвет, подпись,
   сторона подписи, угол стрелки. Рисунок — как у 2D: плашка, волосяной обвод, стрелка, текст */
function chipDom(k,rx,ry,cw,ch,A,col,label,onRight,ang,U){
  const box=chipDomBox();if(!box)return;
  CHIPDOM.touched=true;
  let e=CHIPDOM.m.get(k);
  if(!e){
    const d=document.createElement("div");d.style.cssText="position:absolute;left:0;top:0;transform-origin:0 0";
    const cv=document.createElement("canvas");cv.style.cssText="position:absolute;left:0;top:0";
    const ar=document.createElement("div");ar.style.cssText="position:absolute;clip-path:polygon(100% 50%,0 100%,0 0)";
    d.appendChild(cv);d.appendChild(ar);box.appendChild(d);
    e={d,cv,ar,sig:"",pos:"",op:"",rot:"",on:false};CHIPDOM.m.set(k,e);
  }
  e.used=true;
  const nd=gpuHudDpr(),sig=label+"|"+col+"|"+(onRight?1:0)+"|"+Math.round(cw*U*nd)+"|"+Math.round(ch*U*nd)+"|"+U+"|"+nd;
  if(sig!==e.sig){
    e.sig=sig;const cv=e.cv,w=cw*U,h=ch*U;
    cv.width=Math.max(1,Math.round(w*nd));cv.height=Math.max(1,Math.round(h*nd));
    cv.style.width=w+"px";cv.style.height=h+"px";
    const g=cv.getContext("2d");g.setTransform(U*nd,0,0,U*nd,0,0);
    g.fillStyle="rgba(5,7,12,.72)";g.fillRect(0,0,cw,ch);
    g.strokeStyle=col;g.globalAlpha=.5;g.lineWidth=1;g.strokeRect(.5,.5,cw-1,ch-1);g.globalAlpha=1;
    g.font="8px ui-monospace,monospace";g.fillStyle=col;g.textAlign=onRight?"right":"left";
    g.fillText(label,onRight?cw-18:18,12);
    /* стрелка: треугольник (6,0),(-4,4),(-4,-4) вокруг своей точки — 10×8 в мерке */
    const a=e.ar.style;a.width=10*U+"px";a.height=8*U+"px";a.background=col;
    a.left=((onRight?cw-8:8)-4)*U+"px";a.top=(ch/2-4)*U+"px";a.transformOrigin=4*U+"px "+4*U+"px";
  }
  const pos="translate("+(rx*U).toFixed(2)+"px,"+(ry*U).toFixed(2)+"px)";
  if(pos!==e.pos){e.pos=pos;e.d.style.transform=pos;}
  const op=A.toFixed(3);if(op!==e.op){e.op=op;e.d.style.opacity=op;}
  const rot="rotate("+ang.toFixed(3)+"rad)";if(rot!==e.rot){e.rot=rot;e.ar.style.transform=rot;}
  if(!e.on){e.on=true;e.d.style.display="";}
}
/* после фишек кадра: кого не было — спрятать */
function chipDomEnd(){
  for(const e of CHIPDOM.m.values()){if(!e.used&&e.on){e.on=false;e.d.style.display="none";}e.used=false;}
}
/* начало кадра: фишек в прошлом кадре не рисовали (другой режим, чистый кадр) — спрятать все */
function chipDomSweep(){
  if(!CHIPDOM.touched)for(const e of CHIPDOM.m.values()){if(e.on){e.on=false;e.d.style.display="none";}}
  CHIPDOM.touched=false;
}
