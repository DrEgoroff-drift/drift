/* ══════════════ Кольцо: сигнал извне ══════════════
   M154. Единственное, чего не было в эфире, — голос НЕ ОТСЮДА. Раз в долгое
   время (первый — после сорока прыжков, потом реже) на своей волне приёмник
   ловит структурированный сигнал: группы импульсов, ритм, не похожий на
   позывной. Понять нельзя. Можно ЗАПИСАТЬ НА ЛЕНТУ, пока звучит (минута), и
   лента ложится на стол или сдаётся у стойки: «приняли, отправим в институт».
   Слухи подхватывают: «говорят, опять поймали». Ефремовский ключ: небо
   обитаемо и молчит. Никто ничего не объясняет — никогда.

   ИСТОЧНИК ОДИН. Далёкая точка за краем (RING_SRC): из каждой области сигнал
   слышен со своей стороны и с разной силой — это та же геометрия, что
   невязка панели (25a): стрелка показывает туда, куда карты не ведут.
   M155 сложит из лент фигуру, M156 пошлёт туда экспедицию.

   ПРАВИЛА ФАЙЛА:
   1. Хранится только G.ring: сколько раз слышали, ленты, счётчик прыжков до
      следующего раза. Сам сигнал — расчёт.
   2. Ни одной строки с объяснением. Только пульс, направление, «не наш». */
const RING_SRC={sx:-47,sy:63};          /* за краем: дальше, чем летают */
const RING_FIRST=40,RING_EVERY=[25,40]; /* прыжков до первого и между */
const RING_LEN=3600;                    /* минута звучания */
function ringAll(){
  if(!G.ring||typeof G.ring!=="object")G.ring={heard:0,tapes:[],left:RING_FIRST,jumps:0};
  return G.ring;
}
function ringDir(sx,sy){
  sx=sx===undefined?G.sx:sx;sy=sy===undefined?G.sy:sy;
  return Math.atan2(RING_SRC.sy-sy,RING_SRC.sx-sx);
}
function ringStrength(sx,sy){
  sx=sx===undefined?G.sx:sx;sy=sy===undefined?G.sy:sy;
  const d=Math.hypot(RING_SRC.sx-sx,RING_SRC.sy-sy);
  return clamp(1-d/140,.15,1);
}
function ringNow(){return G.ringNow&&G.t<G.ringNow.until?G.ringNow:null;}
/* прыжок: счётчик до следующего раза */
function ringJump(){
  const R=ringAll();R.jumps++;R.left--;
}
/* такт: пора — сигнал начинается в полёте, на минуту */
function ringTick(){
  const R=ringAll();
  if(ringNow())return;
  if(G.ringNow&&G.t>=G.ringNow.until){G.ringNow=null;}
  if(R.left>0||G.mode!=="system"||!G.running)return;
  const r=rng(hashi(R.heard,G.sx,0x5E1));
  R.left=RING_EVERY[0]+Math.floor(r()*(RING_EVERY[1]-RING_EVERY[0]));
  R.heard++;
  G.ringNow={t0:G.t,until:G.t+RING_LEN,dir:ringDir(),q:ringStrength(),sx:G.sx,sy:G.sy,rec:0};
  etherLine("· · — · · · — — · ·   …не позывной. Не наш.");
  sfx("ui",{f:220,to:220,d:.5,v:.25});
  if(typeof consoleHeard==="function")consoleHeard("· · — · · · — — · ·  пульс · вне диапазона · ЗАПИСАТЬ");
  logAdd("warn","Сигнал вне диапазона · "+Math.round(G.ringNow.q*100)+"% · минуту можно записать");
}
/* строка приёмника, пока звучит: пульс, ритм по времени */
function ringLine(){
  const N=ringNow();if(!N)return null;
  const k=Math.floor((G.t-N.t0)/18)%12;
  const pat=["· ","· ","— ","· ","· ","· ","— ","— ","· ","· ","  ","  "];
  let s="";for(let i=0;i<8;i++)s+=pat[(k+i)%12];
  return {ru:"ПУЛЬС · ВНЕ ДИАПАЗОНА · "+Math.round(N.q*100)+"%",text:s+"   …не наш",q:N.q};
}
/* записать: лента Кольца — вещь с направлением и силой */
function rxRecord(){
  const N=ringNow();if(!N||N.rec)return false;
  N.rec=1;
  const R=ringAll();
  const tape={sx:N.sx,sy:N.sy,dir:+N.dir.toFixed(3),q:+N.q.toFixed(2),day:celDay(),t:Date.now(),handed:0};
  R.tapes.push(tape);while(R.tapes.length>12)R.tapes.shift();
  if(typeof thingAdd==="function")thingAdd("tape","Лента · сигнал вне диапазона · "+N.sx+":"+N.sy,"пульс записан · сила "+Math.round(N.q*100)+"% · направление "+Math.round(N.dir*180/Math.PI)+"° · сдать у стойки или оставить на столе",{ring:1,dir:tape.dir,q:tape.q});
  tell("tech","Лента записана: сигнал вне диапазона · "+N.sx+":"+N.sy,"ЗАПИСАНО\nлента на столе");
  const b=document.getElementById("rxRec");if(b)b.style.display="none";
  return true;
}
function ringTapes(){return ringAll().tapes;}
/* сдать у стойки: строка в очереди, запись, слух */
function ringHandIn(i){
  const R=ringAll(),t=R.tapes[i];if(!t||t.handed)return false;
  t.handed=1;
  peopleLine("приняли. Отправим в институт. Что там — не скажут.",G.st?G.st.name:"Стойка",true);
  if(typeof repAdd==="function")repAdd(1,G.sys);
  if(typeof recordAdd==="function")recordAdd("институт","сдана лента: сигнал вне диапазона");
  const L=(typeof thingsAll==="function")?thingsAll():[];
  const th=L.find(x=>x.k==="tape"&&x.ring&&!x.handed&&x.sx===t.sx&&x.sy===t.sy);
  if(th){th.handed=1;th.note+=" · сдана институту";}
  return true;
}
/* эфир: слух о том, что ловили, когда хоть раз слышали */
function ringEtherLine(r){
  const R=ringAll();if(!R.heard||r()>.12)return null;
  return pick(["…говорят, опять поймали. Тот самый. На ночной стороне.",
               "…институт собирает ленты. Какие — не говорят. Все знают какие.",
               "…у диспетчера спросили, что это было. Он выключил микрофон."],r);
}
/* доска: ленты на руках — сдать */
function ringBlock(){
  const R=ringAll();
  const L=R.tapes.map((t,i)=>({t,i})).filter(x=>!x.t.handed);
  if(!L.length)return;
  $body.appendChild(el("div","sec","ЛЕНТЫ · СИГНАЛ ВНЕ ДИАПАЗОНА · СДАТЬ — «ОТПРАВИМ В ИНСТИТУТ»"));
  for(const x of L){
    const r=el("div","row","<div class='nm'><b>Лента · "+x.t.sx+":"+x.t.sy+" · день "+x.t.day+"</b><s>сила "+Math.round(x.t.q*100)+"% · направление "+Math.round(x.t.dir*180/Math.PI)+"°</s></div>");
    const b=el("button","act sm","СДАТЬ");b.onclick=()=>{ringHandIn(x.i);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
/* лента Кольца на столе: пульс вместо кривой */
function drawRingTape(c,t,W,H){
  c.fillStyle="#e9e2cc";c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(120,90,60,.35)";c.lineWidth=1;
  for(let x=8;x<W;x+=12){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  const r=rng(hashi(t.sx,t.sy,0x2166));
  c.fillStyle="#2b3a8a";
  const pat=[1,1,3,1,1,1,3,3,1,1,0,0];
  let x=6;
  for(let i=0;i<40&&x<W-4;i++){const p=pat[i%12];if(p){c.fillRect(x,H/2-4*t.q*p,3*p,8*t.q*p);}x+=p?4*p+4:6;}
  c.strokeStyle="#8a2d2d";c.lineWidth=1.2;
  c.beginPath();c.moveTo(W-18,H-10);c.lineTo(W-18+Math.cos(t.dir)*10,H-10+Math.sin(t.dir)*10);c.stroke();
}
