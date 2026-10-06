/* ══════════════ приборная колодка: те же приборы, но всегда под рукой ══════════════
   M124, первый шаг. Панель (25a) и самописец (25b) живут на потолочном блоке
   кабины — и потому видны только в поясе, а летает игрок в системном виде, где
   никакой кабины нет. Прибор, которого нет там, где принимаются решения, не
   прибор.

   M720 (06.10): колодка — кусок стойки (25d), а не её эскиз. Автор: «когда
   разворачиваешь хорошо, когда нет плохо». Прежняя колодка была пятью тонкими
   дугами на тёмной вуали и полоской ленты — схема прибора, а не прибор. Теперь
   это планка того же матового металла, что и стойка: пять кремовых циферблатов
   под стеклом, янтарные стрелки, код прибора и точка цвета его пера на
   самописце, справа окно невязки и клавиша «I», которая раскрывает стойку.
   Лента ушла в стойку: на планке она была полоской шума.

   ПРАВИЛА. Те же, что у 25a: ни звука, ни сообщения, ни смены цвета. Колодка
   гаснет и просыпается вместе со всей строкой приборов (`hudWake`), а в поясе
   прячется совсем — там на неё смотрят по-настоящему, подняв глаза на блок. */

const $ipod=document.getElementById("ipod");
/* плотность полотна: пиксели устройства на пиксель вёрстки — DPR × --ui (зум строки приборов),
   шагом ½; ниже 2 не опускается: стрелки тонкие */
let IPOD_S=2,IPOD_W=360;
const IPOD_H=80;
/* Перерисовка — только когда кадр колодки другой (GPU-этап 1). Подпись собирает всё, что
   видно: стрелки с шагом 1/256 шкалы, невязку как она напечатана и размер полотна. */
let IPOD_SIG="";
function instrPodSig(R){
  let s=$ipod.width+"x"+$ipod.height+"|"+instrMisclose().toFixed(3);
  for(const r of R)s+="|"+r.ab+Math.round(instrTrack(r)*256);
  return s;
}
/* ── колодку рисует видеокарта (26.09, Контроль (A)) ──
   Колодка — DOM-холст в строке приборов с контекстом WebGPU: всё неподвижное (металл, винты,
   циферблаты с делениями, стекло, подписи, окно невязки, клавиша) — один мастер; стрелки,
   втулки и цифры невязки — примитивы слоя #ovl (08bi) в своей очереди (ovInto). Проход
   кодируется в кадровый энкодер и уходит тем же submit: hud() идёт до gpuPresent. Кадр без
   перемен прохода не просит — холст WebGPU держит последнее показанное. IPOD.n — сколько
   проходов было (наборы 91zk). */
/* подписи — шрифтом строки приборов (--face, style.css); цифры счётчика — моноширинные */
const IPOD_FACE="Bahnschrift,'DIN Alternate','Roboto Condensed','Arial Narrow',sans-serif";
const IPOD={cx:null,dev:null,T:null,M:null,mk:"",n:0};
const IPOD_A0=Math.PI*.78,IPOD_A1=Math.PI*2.22;   /* рабочий сектор — как у стойки */
/* мерки колодки в пикселях вёрстки: слева пять гнёзд, справа колонка невязки */
function instrPodGeo(w,h,nR){
  const rw=w>=300?78:60,cw=(w-rw-10)/nR,r=Math.max(6,Math.min(cw*.34,(h-30)*.5));
  return {rw,cw,r,x0:8,cy:10+r*1.22,ly:h-10,key:w>=300};
}
/* циферблат колодки: корпус, кремовое поле, деления без цифр (на таком радиусе цифры шкалы
   были бы мельче закона кегля — значение читается в стойке), дуга шкалы */
function instrPodDial(c,cx,cy,r){
  const bez=c.createLinearGradient(cx,cy-r*1.4,cx,cy+r*1.4);
  bez.addColorStop(0,"#3c4043");bez.addColorStop(.5,"#25292c");bez.addColorStop(1,"#121518");
  c.fillStyle=bez;c.beginPath();c.arc(cx,cy,r*1.22,0,TAU);c.fill();
  c.strokeStyle="rgba(6,8,10,.9)";c.lineWidth=1.4;c.stroke();
  const face=c.createRadialGradient(cx,cy+r*.35,r*.1,cx,cy,r*1.05);
  face.addColorStop(0,"#f1e5c8");face.addColorStop(.62,"#dccdaa");face.addColorStop(1,"#a99a7e");
  c.fillStyle=face;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
  const N=5,S=2;
  for(let i=0;i<=N*S;i++){
    const a=IPOD_A0+(IPOD_A1-IPOD_A0)*i/(N*S),big=i%S===0,r1=r*.9,r2=r*(big?.66:.78);
    c.strokeStyle=big?"rgba(38,30,18,.92)":"rgba(58,48,32,.6)";c.lineWidth=big?1.5:.9;
    c.beginPath();c.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);c.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);c.stroke();
  }
  c.strokeStyle="rgba(46,36,20,.5)";c.lineWidth=1;
  c.beginPath();c.arc(cx,cy,r*.9,IPOD_A0,IPOD_A1);c.stroke();
}
/* неподвижное — в мастер */
function instrPodPaint(c,w,h,R){
  const g=instrPodGeo(w,h,R.length);
  /* матовый металл стойки: свет сверху, зерно, тёмная кромка снизу */
  const body=c.createLinearGradient(0,0,0,h);
  body.addColorStop(0,"#2c3134");body.addColorStop(.35,"#1f2427");body.addColorStop(1,"#121518");
  c.fillStyle=body;c.fillRect(0,0,w,h);
  rackGrain(c,0,0,w,h,Math.round(w*h*.012),.06,["rgba(0,0,0,","rgba(220,235,240,"]);
  c.fillStyle="rgba(0,0,0,.55)";c.fillRect(0,h-1,w,1);
  for(const sx of [8,w-8])rackScrew(c,sx,8,3);
  for(let i=0;i<R.length;i++){
    const cx=g.x0+g.cw*(i+.5);
    instrPodDial(c,cx,g.cy,g.r);
    rackGlass(c,cx,g.cy,g.r);
    /* код прибора и точка цвета его пера: тот же канал на бумаге стойки */
    c.font="600 10px "+IPOD_FACE;c.textAlign="center";c.textBaseline="alphabetic";
    const tw=c.measureText(R[i].ab).width;
    c.fillStyle=RACK_CH[i]?RACK_CH[i].col:"#888";
    c.beginPath();c.arc(cx-tw/2-5,g.ly-3,2.4,0,TAU);c.fill();
    c.fillStyle="rgba(204,214,218,.82)";c.fillText(R[i].ab,cx+2,g.ly);
  }
  /* колонка невязки: паз отделяет её от гнёзд */
  const x0=w-g.rw;
  c.fillStyle="rgba(0,0,0,.5)";c.fillRect(x0,10,1,h-20);
  c.fillStyle="rgba(210,226,232,.07)";c.fillRect(x0+1,10,1,h-20);
  c.fillStyle="rgba(196,206,210,.62)";c.font="600 9px "+IPOD_FACE;c.textAlign="center";c.textBaseline="alphabetic";
  c.fillText("НЕВЯЗКА",x0+g.rw/2,22);
  /* окно счётчика: утоплено в металл, цифры светятся в нём (живое) */
  const wx=x0+7,wy=27,ww=g.rw-14,wh=20;
  c.fillStyle="#0a0d0f";c.beginPath();c.roundRect(wx,wy,ww,wh,3);c.fill();
  c.strokeStyle="rgba(0,0,0,.8)";c.lineWidth=1;c.stroke();
  c.fillStyle="rgba(210,226,232,.09)";c.fillRect(wx+2,wy+wh,ww-4,1);
  /* клавиша стойки: колпачок «I» — та же ручка, что и щелчок по колодке */
  const kx=g.key?x0+8:x0+(g.rw-18)/2,ky=h-26;
  const kg=c.createLinearGradient(0,ky,0,ky+18);
  kg.addColorStop(0,"#5b6266");kg.addColorStop(1,"#2a2f32");
  c.fillStyle=kg;c.beginPath();c.roundRect(kx,ky,18,18,3);c.fill();
  c.strokeStyle="rgba(0,0,0,.7)";c.stroke();
  c.fillStyle="rgba(240,244,246,.92)";c.font="600 10px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";
  c.fillText("I",kx+9,ky+9.5);
  if(g.key){c.fillStyle="rgba(196,206,210,.7)";c.font="600 10px "+IPOD_FACE;c.textAlign="left";
    c.fillText("СТОЙКА",kx+23,ky+9.5);}
}
/* живое — примитивами в очередь колодки: мастер, стрелки, втулки, невязка */
function instrPodLive(R,w,h){
  const g=instrPodGeo(w,h,R.length),r=g.r;
  ckgPut(IPOD.M);
  for(let i=0;i<R.length;i++){
    const cx=g.x0+g.cw*(i+.5),cy=g.cy;
    const a=IPOD_A0+(IPOD_A1-IPOD_A0)*instrTrack(R[i]),c=Math.cos(a),s=Math.sin(a);
    /* тень стрелки на поле — стрелка над шкалой, а не нарисована на ней */
    ckLine(cx-c*r*.2+.7,cy-s*r*.2+1.1,cx+c*r*.84+.7,cy+s*r*.84+1.1,1.8,"rgba(58,40,16,.28)");
    ckLine(cx-c*r*.2,cy-s*r*.2,cx+c*r*.86,cy+s*r*.86,1.6,"rgba(220,128,44,.98)");
    ovEll(cx,cy,2.6,2.6,0,"rgba(92,98,102,1)");
    ovEll(cx-.5,cy-.5,1.1,1.1,0,"rgba(200,204,206,1)");
  }
  ovText(OVL.uq,w-g.rw/2,41.5,decRu(instrMisclose(),3),"600 12px ui-monospace,monospace","rgba(255,192,112,.96)","center","alphabetic",1,1);
}
function instrPodDraw(){
  if(!$ipod||!GPU.on||!GPU.enc||!GPU.dev)return;
  const R=instrRead(),sig=instrPodSig(R);
  if(sig===IPOD_SIG&&IPOD.dev===GPU.dev)return;
  /* новое устройство (первый кадр, подъём после gpuDrop): контекст переконфигурировать, очередь и мастер — заново */
  if(IPOD.dev!==GPU.dev){
    IPOD.cx=IPOD.cx||$ipod.getContext("webgpu");
    IPOD.cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    IPOD.dev=GPU.dev;IPOD.T=ovTarget();IPOD.M=null;IPOD.mk="";}
  IPOD_SIG=sig;
  const w=IPOD_W,h=IPOD_H,led=OVL.led;
  /* строки колодки в журнал текста не идут — как и прежде, когда она была своим 2D-полотном */
  OVL.led=null;
  try{ovInto(IPOD.T,IPOD_S,()=>{
    const mk=w+"x"+h+"|"+IPOD_S+"|"+R.map(r=>r.ab).join(",");
    if(IPOD.mk!==mk||!IPOD.M){
      /* мастер печётся разово (набор приборов, размер, плотность) */
      IPOD.M=ckgSpr(0,0,w,h,c=>instrPodPaint(c,w,h,R),{once:true});
      IPOD.mk=mk;}
    instrPodLive(R,w,h);});
  }finally{OVL.led=led;}
  ovPass(IPOD.T,IPOD.cx.getCurrentTexture().createView(),$ipod.width,$ipod.height,[IPOD.T.uq],"ipod");
  IPOD.n++;
}
/* Ширина и плотность — от кадра, без чтения вёрстки: строка приборов шириной W/UIK, по краям
   плиты борта (~270) и места (~250), колодка берёт середину до 380. Плотность — DPR × UIK. */
function instrPodSize(){
  const lw=W/Math.max(1,UIK||1),pw=Math.round(clamp(lw-600,230,380));
  const S=Math.max(2,Math.min(5,Math.round((devicePixelRatio||1)*(UIK||1)*2)/2));
  if(pw===IPOD_W&&S===IPOD_S&&$ipod.width===Math.round(pw*S))return;
  IPOD_W=pw;IPOD_S=S;
  $ipod.width=Math.round(pw*S);$ipod.height=Math.round(IPOD_H*S);
  $ipod.style.width=pw+"px";$ipod.style.height=IPOD_H+"px";
}
/* Показывается везде, кроме пояса: там есть настоящий потолочный блок, и две
   панели разом читались бы как брак. */
/* Колодку прячет и CSS: узкий экран (@media max-width:720px, style.css), режимы вне
   полёта (body:not(.inflight), 27z) и открытый экран (body.screen .hud). Невидимое полотно не рисуем: на телефоне оно
   перерисовывалось ~10 раз в секунду при display:none, а холст вне композитора на каждом
   рисовании ждёт весь хвост GPU-процесса. Узость — один matchMedia и его событие, без
   чтения стилей в кадре; список режимов — тот же, что у класса inflight в 27z. Подпись
   IPOD_SIG при этом не трогается: колодка проснётся и сравнит её со свежей */
const IPOD_MQ=typeof matchMedia==="function"?matchMedia("(max-width:720px)"):null;
let IPOD_NARROW=!!(IPOD_MQ&&IPOD_MQ.matches);
if(IPOD_MQ&&IPOD_MQ.addEventListener)IPOD_MQ.addEventListener("change",e=>{IPOD_NARROW=e.matches;});
/* короткое окно: на карте верхняя полоса — ряду адреса (style.css, M720), колодки там нет */
const IPOD_SQ=typeof matchMedia==="function"?matchMedia("(max-height:480px)"):null;
let IPOD_SHORT=!!(IPOD_SQ&&IPOD_SQ.matches);
if(IPOD_SQ&&IPOD_SQ.addEventListener)IPOD_SQ.addEventListener("change",e=>{IPOD_SHORT=e.matches;});
const IPOD_FLY={system:1,map:1,belt:1,scoop:1,landing:1};
function instrPodTick(){
  if(!$ipod)return;
  /* открытая стойка (25d) — те же приборы в полный рост: колодка на это время уходит */
  const on=G.running&&G.mode!=="belt"&&G.mode!=="dock"&&!(typeof rackOpen==="function"&&rackOpen());
  $ipod.style.display=on?"":"none";
  /* открытый экран (body.screen, 27z — класс ставится раньше в том же hud()) колодку гасит: ни прохода, ни текстуры */
  if(on&&!IPOD_NARROW&&IPOD_FLY[G.mode]&&!(IPOD_SHORT&&G.mode==="map")&&!document.body.classList.contains("screen")){instrPodSize();instrPodDraw();}
}
/* Колодка — не только показание, но и ручка: по ней открывается стойка (25d),
   где те же приборы стоят в полный рост. Единственный элемент строки приборов,
   который ловит палец, — поэтому pointer-events включаются только на нём. */
if($ipod){
  $ipod.style.pointerEvents="auto";
  $ipod.style.cursor="pointer";
  $ipod.addEventListener("pointerdown",e=>{
    e.preventDefault();
    if(typeof rackToggle==="function")rackToggle();
  });
}
