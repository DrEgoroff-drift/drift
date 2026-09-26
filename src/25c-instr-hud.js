/* ══════════════ приборная колодка: те же приборы, но всегда под рукой ══════════════
   M124, первый шаг. Панель (25a) и самописец (25b) живут на потолочном блоке
   кабины — и потому видны только в поясе, а летает игрок в системном виде, где
   никакой кабины нет. Прибор, которого нет там, где принимаются решения, не
   прибор.

   ЧТО СДЕЛАНО. Одна узкая колодка в верхней строке приборов, между жизнью
   корабля и «где мы»: пять стрелок в ряд, невязка цифрами и полоска ленты под
   ними. Своё маленькое полотно — рисуем тем же кодом, что и в кабине
   (`tapePaper`), чтобы не завести второй самописец.

   ПРАВИЛА. Те же, что у 25a: ни звука, ни сообщения, ни смены цвета. Колодка
   гаснет и просыпается вместе со всей строкой приборов (`hudWake`), а в поясе
   прячется совсем — там на неё смотрят по-настоящему, подняв глаза на блок. */

const $ipod=document.getElementById("ipod");
const IPOD_S=2;                        // полотно вдвое крупнее: стрелки тонкие
/* Перерисовка — только когда кадр колодки другой (GPU-этап 1): прежде 66 вызовов
   полотна каждый кадр ради стрелок, которые стоят. Подпись собирает всё, что
   видно: стрелки с шагом 1/256 шкалы (конец стрелки на полотне ×2 сдвигается
   меньше чем на четверть пикселя — глазу это не шаг, а хронометр, ползущий
   каждый кадр, перестаёт звать перерисовку), невязку как она напечатана,
   голову и откат ленты, дрожь пера, размер полотна и саму ленту (загрузка
   сейва приносит новую). */
let IPOD_SIG="",IPOD_T=null;
function instrPodSig(R,T){
  let s=$ipod.width+"x"+$ipod.height+"|"+instrMisclose().toFixed(3)+"|"+T.head+","+T.n+","+T.back+","+Math.round((T.back?0:T.tick)*32);
  for(const r of R)s+="|"+r.ab+Math.round(instrTrack(r)*256);
  return s;
}
/* ── колодку рисует видеокарта (26.09, Контроль (A)) ──
   Колодка остаётся DOM-холстом в строке приборов, но контекст у неё WebGPU: всё неподвижное
   (тёмные поля, дуги шкал, крайние деления, коды, бумага с нулями дорожек) — один мастер,
   валик — второй; стрелки, ступица, невязка, перья, перо у края — примитивы слоя #ovl (08bi)
   в своей очереди (ovInto). Проход колодки кодируется в тот же кадровый энкодер и уходит
   тем же submit: hud() идёт до gpuPresent. Кадр без перемен прохода не просит — холст
   WebGPU держит последнее показанное. IPOD.n — сколько проходов было (наборы 91zk). */
const IPOD={cx:null,dev:null,T:null,M:null,Rl:null,mk:"",n:0};
/* мерки колодки в пикселях CSS полотна: верх — стрелки, низ — бумага */
function instrPodGeo(w,h,nR){
  const nh=h*.44,cw=(w-40)/nR;          // справа оставлено место под невязку
  return {nh,cw,px:1,py:nh+10,pw:w-2,ph:h-nh-14};
}
/* неподвижное — в мастер: тот же порядок, что у прежнего 2D-полотна */
function instrPodPaint(c,w,h,R){
  /* ── колодку должно быть ВИДНО (M233) ──
     Тон был один на всё (150,176,190) при альфе .28 на дуге: над дневным небом
     посадки и над чёрным космосом колодка одинаково пропадала, а пять
     безымянных стрелок и не говорили, который прибор который. Это ровно та
     жалоба, которую кабина закрыла кодами из трёх букв (M213), — здесь их
     не было вовсе. Правило «ни цвета, ни тревоги» остаётся: меняются только
     светлота и подпись. */
  const col="rgba(178,202,216,",g=instrPodGeo(w,h,R.length),nh=g.nh;
  for(let i=0;i<R.length;i++){
    const cx=g.cw*(i+.5), cy=nh*.84, r=Math.min(g.cw*.42,nh*.62);
    /* тёмное поле под шкалой: по нему стрелка читается и на светлом небе */
    c.fillStyle="rgba(8,12,18,.42)";
    c.beginPath();c.arc(cx,cy,r+2,Math.PI*1.06,Math.PI*1.94);c.closePath();c.fill();
    c.strokeStyle=col+".50)";c.lineWidth=1.1;
    c.beginPath();c.arc(cx,cy,r,Math.PI*1.12,Math.PI*1.88);c.stroke();
    /* деления только крайние: на такой ширине пять штрихов слипаются в дугу */
    c.strokeStyle=col+".30)";
    for(const k of [0,1]){
      const a=Math.PI*(1.12+.76*k),c1=Math.cos(a),s1=Math.sin(a);
      c.beginPath();
      c.moveTo(cx+c1*r,cy+s1*r);c.lineTo(cx+c1*r*.62,cy+s1*r*.62);
      c.stroke();
    }
    /* код прибора: три буквы под шкалой — тот же ответ, что в кабине (стрелка над ним не ходит) */
    c.textAlign="center";
    c.fillStyle=col+".62)";
    c.font="7px ui-monospace,monospace";
    c.fillText(R[i].ab,cx,nh+7);
  }
  /* лента: та же бумага, что и в кабине, только узкая полоска.
     Бумага здесь тише, чем в кабине: в строке приборов она иначе перетягивает
     на себя весь верх экрана, а поверх мира висит только нужное сейчас */
  c.globalAlpha=.72;
  tapePaper(c,g.px,g.py,g.pw,g.ph,"base");
  c.globalAlpha=1;
}
/* живое — примитивами в очередь колодки: мастер, стрелки, невязка, перья, валик, перо */
function instrPodLive(R,T,w,h){
  const col="rgba(178,202,216,",g=instrPodGeo(w,h,R.length),nh=g.nh;
  ckgPut(IPOD.M);
  for(let i=0;i<R.length;i++){
    const cx=g.cw*(i+.5), cy=nh*.84, r=Math.min(g.cw*.42,nh*.62);
    const a=Math.PI*1.12+Math.PI*.76*instrTrack(R[i]),c=Math.cos(a),s=Math.sin(a);
    /* тень стрелки — тот же приём, что на панели кабины: стрелка над шкалой */
    ckLine(cx+.6,cy+1.1,cx+.6+c*r*.88,cy+1.1+s*r*.88,1.6,"rgba(0,0,0,.45)");
    ckLine(cx,cy,cx+c*r*.9,cy+s*r*.9,1.3,col+".95)");
    ovEll(cx,cy,1.2,1.2,0,col+".95)");
  }
  /* невязка: цифры с краю, тем же тоном, что и всё остальное. Ни рамки, ни
     подписи «внимание» — число, на которое игрок либо смотрит, либо нет */
  ovText(OVL.uq,w-3,nh*.72,decRu(instrMisclose(),3),"8px ui-monospace,monospace",col+".70)","right","alphabetic",1,1);
  const {px,py,pw,ph}=g;
  if(pw<24||ph<8)return;
  /* перья по бумаге — тем же ходом, что в tapePaper; бумага колодки под альфой .72 */
  const x1=px+pw,cols=Math.min(T.n-1,Math.floor(pw)),sc=pw/Math.max(1,cols),th=ph/TAPE_PENS;
  if(cols>=1)for(let i=0;i<TAPE_PENS;i++){
    const top=py+th*i+1.2,hh=th-2.4,ys=IPOD.ys[i]||(IPOD.ys[i]=[]);ys.length=cols+1;
    for(let k=0;k<=cols;k++){const idx=(T.head-1-T.back-(cols-k)+TAPE_N*2)%TAPE_N;ys[k]=top+hh*(1-T.col[idx*TAPE_PENS+i]/255);}
    ovGraph(px,Math.max(py,top-1),x1,Math.min(py+ph,top+hh+1),px,sc,ys,1,"rgba(38,44,40,.80)",.72);
  }
  ckgPut(IPOD.Rl);
  /* перо: короткая чёрточка у правого края, дрожит на щелчке; смотрим назад — бумага в тени */
  if(!T.back){const x=x1-1.5+T.tick*1.6;ovRect(x-.6,py+1,x+.6,py+ph-1,"rgba(24,28,26,.85)",.72);}
  else ovRect(px,py,x1,py+ph,"rgba(10,14,18,.16)",.72);
}
function instrPodDraw(){
  if(!$ipod||!GPU.on||!GPU.enc||!GPU.dev)return;
  const R=instrRead(),T=tapeInit(),sig=instrPodSig(R,T);
  if(sig===IPOD_SIG&&T===IPOD_T&&IPOD.dev===GPU.dev)return;
  /* новое устройство (первый кадр, подъём после gpuDrop): контекст переконфигурировать, очередь и мастера — заново */
  if(IPOD.dev!==GPU.dev){
    IPOD.cx=IPOD.cx||$ipod.getContext("webgpu");
    IPOD.cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    IPOD.dev=GPU.dev;IPOD.T=ovTarget();IPOD.M=IPOD.Rl=null;IPOD.mk="";IPOD.ys=[];}
  IPOD_SIG=sig;IPOD_T=T;
  const w=$ipod.width/IPOD_S,h=$ipod.height/IPOD_S,led=OVL.led;
  /* строки колодки в журнал текста не идут — как и прежде, когда она была своим 2D-полотном */
  OVL.led=null;
  try{ovInto(IPOD.T,IPOD_S,()=>{
    const mk=w+"x"+h+"|"+R.map(r=>r.ab).join(",");
    if(IPOD.mk!==mk||!IPOD.M){
      const g=instrPodGeo(w,h,R.length),rw=Math.min(7,g.pw*.08),x1=g.px+g.pw;
      /* мастер печётся разово (набор списка приборов, размер): при IPOD_S 2 и ss 2 цель 836×284 не входит
         ни в одну прогретую запись пула — без once первая же колодка рожала новую на 6.6 МБ (стойка 91zl) */
      IPOD.M=ckgSpr(0,0,w,h,c=>instrPodPaint(c,w,h,R),{once:true});
      /* валик — над перьями, своим спрайтом */
      IPOD.Rl=ckgSpr(x1-rw-1,g.py,x1+1,g.py+g.ph,c=>{c.globalAlpha=.72;tapePaper(c,g.px,g.py,g.pw,g.ph,"roll");});
      IPOD.mk=mk;}
    instrPodLive(R,T,w,h);});
  }finally{OVL.led=led;}
  ovPass(IPOD.T,IPOD.cx.getCurrentTexture().createView(),$ipod.width,$ipod.height,[IPOD.T.uq],"ipod");
  IPOD.n++;
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
const IPOD_FLY={system:1,map:1,belt:1,scoop:1,landing:1};
function instrPodTick(){
  if(!$ipod)return;
  const on=G.running&&G.mode!=="belt"&&G.mode!=="dock";
  $ipod.style.display=on?"":"none";
  /* открытый экран (body.screen, 27z — класс ставится раньше в том же hud()) колодку гасит: ни прохода, ни текстуры */
  if(on&&!IPOD_NARROW&&IPOD_FLY[G.mode]&&!document.body.classList.contains("screen"))instrPodDraw();
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
