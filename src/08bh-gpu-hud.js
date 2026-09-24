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
  domLabelEnd();
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
  /* без видеокарты мира нет, и фишкам не над чем висеть (Node-ярус, Chrome без WebGPU) */
  if(!GPU.ok)return;
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
    cv.style.width=cv.width/nd+"px";cv.style.height=cv.height/nd+"px";   /* ровно в пиксели устройства, как у подписей */
    const g=cv.getContext("2d");g.setTransform(U*nd,0,0,U*nd,0,0);
    g.fillStyle="rgba(5,7,12,.72)";g.fillRect(0,0,cw,ch);
    g.strokeStyle=col;g.globalAlpha=.5;g.lineWidth=1;g.strokeRect(.5,.5,cw-1,ch-1);g.globalAlpha=1;
    g.font="8px ui-monospace,monospace";g.fillStyle=col;g.textAlign=onRight?"right":"left";
    g.fillText(label,onRight?cw-18:18,12);
    /* стрелка: треугольник (6,0),(-4,4),(-4,-4) вокруг своей точки — 10×8 в мерке */
    const a=e.ar.style;a.width=10*U+"px";a.height=8*U+"px";a.background=col;
    a.left=((onRight?cw-8:8)-4)*U+"px";a.top=(ch/2-4)*U+"px";a.transformOrigin=4*U+"px "+4*U+"px";
  }
  const px=Math.round(rx*U*nd)/nd,py=Math.round(ry*U*nd)/nd;
  const pos="translate("+px.toFixed(3)+"px,"+py.toFixed(3)+"px)";
  if(pos!==e.pos){e.pos=pos;e.d.style.transform=pos;}
  const op=A.toFixed(3);if(op!==e.op){e.op=op;e.d.style.opacity=op;}
  const rot="rotate("+ang.toFixed(3)+"rad)";if(rot!==e.rot){e.rot=rot;e.ar.style.transform=rot;}
  if(!e.on){e.on=true;e.d.style.display="";}
  /* то же числами — для снимка кадра (chipDomSnap) */
  e.x=px;e.y=py;e.w=e.cv.width/nd;e.h=e.cv.height/nd;e.A=A;e.ang=ang;e.col=col;e.U=U;e.ax=(onRight?cw-8:8)*U;e.ay=ch/2*U;
}
/* снимок кадра (gpuTakeSnap): фишки поверх, как их кладёт композитор, — чтобы look(),
   детекторы и эталоны видели то же, что игрок. Платится только в момент снимка */
function chipDomSnap(g,sc){
  for(const e of CHIPDOM.m.values()){
    if(!e.on||!(e.A>0))continue;
    g.save();g.globalAlpha=Math.min(1,e.A);
    g.drawImage(e.cv,e.x*sc,e.y*sc,e.w*sc,e.h*sc);
    g.translate((e.x+e.ax)*sc,(e.y+e.ay)*sc);g.rotate(e.ang);g.scale(e.U*sc,e.U*sc);
    g.fillStyle=e.col;g.beginPath();g.moveTo(6,0);g.lineTo(-4,4);g.lineTo(-4,-4);g.closePath();g.fill();
    g.restore();
  }
  for(const e of LABDOM.m.values())if(e.on){g.globalAlpha=Math.min(1,e.A);g.drawImage(e.cv,e.x*sc,e.y*sc,e.w*sc,e.h*sc);}
  g.globalAlpha=1;
}
/* ── подписи мира (имя станции, планет): ездят за миром, как фишки ──
   Маленький холст на родном DPR с тем же fillText, что был на #c, — глифы те же;
   перерисовка — только когда сменились текст, шрифт или цвет, место двигает transform.
   Базовая линия берётся у ctx на момент вызова: y значит то же, что значил у fillText.
   Без видеокарты — прямо на ctx, как раньше */
const LABDOM={m:new Map(),id:new WeakMap(),n:0};
/* ключ подписи для вещи без своего сида (контейнер): номер живёт рядом, не в самой вещи —
   поле в объекте мира уехало бы в сейв */
function domLabelId(o){let i=LABDOM.id.get(o);if(!i){i=++LABDOM.n;LABDOM.id.set(o,i);}return i;}
function domLabel(k,x,y,text,font,col,align,al){
  if(al==null)al=1;
  if(!GPU.ok||!GPU.on){ctx.fillStyle=col;ctx.font=font;ctx.textAlign=align;ctx.globalAlpha=al;ctx.fillText(text,x,y);ctx.globalAlpha=1;return;}
  const box=chipDomBox();if(!box)return;
  let e=LABDOM.m.get(k);
  if(!e){
    const cv=document.createElement("canvas");cv.style.cssText="position:absolute;left:0;top:0;transform-origin:0 0";
    box.appendChild(cv);e={cv,sig:"",pos:"",on:false};LABDOM.m.set(k,e);
  }
  e.used=true;
  const nd=gpuHudDpr(),bl=ctx.textBaseline,sig=text+"|"+font+"|"+col+"|"+align+"|"+bl+"|"+nd;
  if(sig!==e.sig){
    e.sig=sig;const g=e.cv.getContext("2d");
    g.setTransform(1,0,0,1,0,0);g.font=font;g.textBaseline=bl;g.textAlign="left";
    const m=g.measureText(text),tw=m.width;
    const up=Math.ceil(m.actualBoundingBoxAscent||0)+2,dn=Math.ceil(m.actualBoundingBoxDescent||0)+2;
    /* холст — целое число пикселей устройства, и CSS-размер ровно тот же: иначе
       композитор тянет его на долю пикселя, и штрих глифа мылится и тускнеет вдвое */
    const w=Math.ceil((Math.ceil(tw)+4)*nd)/nd,h=Math.ceil((up+dn)*nd)/nd;
    e.cv.width=Math.max(1,Math.round(w*nd));e.cv.height=Math.max(1,Math.round(h*nd));
    e.cv.style.width=e.cv.width/nd+"px";e.cv.style.height=e.cv.height/nd+"px";
    g.setTransform(nd,0,0,nd,0,0);g.font=font;g.textBaseline=bl;g.textAlign="left";g.fillStyle=col;
    g.fillText(text,2,up);
    e.w=w;e.h=h;e.dx=(align==="center"?-tw/2:align==="right"||align==="end"?-tw:0)-2;e.dy=-up;
  }
  /* место — на целый пиксель устройства: шаг в пиксель на ходу тексту нормален, дробь — мыло */
  e.x=Math.round((x+e.dx)*nd)/nd;e.y=Math.round((y+e.dy)*nd)/nd;
  const pos="translate("+e.x.toFixed(3)+"px,"+e.y.toFixed(3)+"px)";
  if(pos!==e.pos){e.pos=pos;e.cv.style.transform=pos;}
  const op=al.toFixed(3);if(op!==e.op){e.op=op;e.cv.style.opacity=op;}
  e.A=al;
  if(!e.on){e.on=true;e.cv.style.display="";}
}
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
/* после фишек кадра: кого не было — спрятать */
function chipDomEnd(){
  for(const e of CHIPDOM.m.values()){if(!e.used&&e.on){e.on=false;e.d.style.display="none";}e.used=false;}
}
/* начало кадра: фишек в прошлом кадре не рисовали (другой режим, чистый кадр) — спрятать все */
function chipDomSweep(){
  if(!CHIPDOM.touched)for(const e of CHIPDOM.m.values()){if(e.on){e.on=false;e.d.style.display="none";}}
  CHIPDOM.touched=false;
  /* мир прошлого кадра не доходил до конца (другой режим) — подписи тоже спрятать */
  if(!LABDOM.fl)for(const e of LABDOM.m.values()){if(e.on){e.on=false;e.cv.style.display="none";}}
  LABDOM.fl=false;
}
