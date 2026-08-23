/* ══════════════ невязка: уезд, где счёт неба и счёт людей расходятся ══════════════
   M155. Это продолжение «Расхождения времён» (11h, область `hours`): там
   часы уходят к ядру; здесь — САМОПИСЦЫ СТАНЦИЙ не сходятся между собой, и
   институт отказывается это признать: «прибор неисправен, замените ленту».

   ЛЕНТЫ СКЛАДЫВАЮТСЯ В ФИГУРУ. Полоса самописца, оторванная в этом уезде,
   несёт метку `fig` и угол. Три и больше таких лент рядом на столе (27i)
   рисуют одну форму — кривые ложатся в дугу, и ось дуги смотрит туда же,
   куда направление сигнала Кольца (11x). Об этом не говорит никто: игрок,
   положивший рядом стрелку панели и фигуру, увидит сам.

   ПРАВИЛА ФАЙЛА:
   1. Не объясняется. Ни «аномалия», ни «зона», ни «они». Только числа,
      которые не сходятся, и люди, которые это замечают.
   2. Ничего не хранится: смещение станции — функция места; метка на ленте
      живёт в самой ленте (G.strips). */
function misInRegion(sx,sy){return typeof hoursDepthAt==="function"&&hoursDepthAt(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)>0;}
/* смещение часов станции относительно неба, минуты: в уезде ±3…9, знак свой */
function misStationOffset(sys){
  if(!sys||!sys.station||!misInRegion(sys.sx,sys.sy))return 0;
  const r=rng(hashi(sys.sx,sys.sy,0x7135));
  const m=3+Math.floor(r()*7);
  return r()<.5?-m:m;
}
/* «который час» — строка доски: часы станции против неба */
function misClockLine(sys){
  const off=misStationOffset(sys);
  if(!off)return null;
  const sky=Math.floor((celDayF()%1)*24*60);
  const st=(sky+off+1440)%1440;
  const hh=n=>("0"+Math.floor(n/60)).slice(-2)+":"+("0"+(n%60)).slice(-2);
  return {sky:hh(sky),st:hh(st),off};
}
/* оторванная лента получает метку уезда и угол */
function misMarkStrip(s){
  if(!s)return s;
  if(misInRegion(s.sx,s.sy)){s.fig=1;s.ang=+(typeof ringDir==="function"?ringDir(s.sx,s.sy):0).toFixed(3);}
  return s;
}
function misFigureStrips(){return ((typeof stripsAll==="function")?stripsAll():[]).filter(s=>s.fig);}
/* эфир в уезде: две стойки спорят о времени; институт отвечает одно и то же */
function misEtherLine(r){
  if(!misInRegion()||r()>.35)return null;
  return pick(["…у вас который? — Двенадцать сорок. — У нас тридцать три. — Ну вот.",
               "…ленту сдали в институт. Ответ: прибор неисправен, замените ленту. Третий раз.",
               "…смена вышла по гудку. Гудок был по часам. Часы были не те.",
               "…самописец на третьем причале пишет на семь минут вперёд. Никто не трогает."],r);
}
/* ответ стойки на ленту из уезда (стол M128, 27c tableBlock): отказ */
function misTableReply(){
  if(!misInRegion())return null;
  return {line:"Прибор неисправен. Замените ленту. — Это ответ института, не мой.",silent:false};
}
/* доска: часы и смотритель */
function misBlock(){
  if(!G.sys||!G.sys.station)return;
  const C=misClockLine(G.sys);if(!C)return;
  $body.appendChild(el("div","sec","ЧАСЫ СТАНЦИИ · "+C.st+" · ПО НЕБУ "+C.sky+" · "+(C.off>0?"+":"")+C.off+" МИН"));
  $body.appendChild(el("div","row","<div class='nm'><s>самописец стойки и хронометр корабля пишут разное · институт: «прибор неисправен, замените ленту»"+
    (misFigureStrips().length?" · лент из уезда на столе: "+misFigureStrips().length:"")+"</s></div>"));
}
/* фигура на столе: три и больше лент уезда — одна форма. Дуга по углу */
function drawMisFigure(c,W,H){
  const L=misFigureStrips();
  c.fillStyle="#ece6d2";c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(120,90,60,.25)";c.lineWidth=1;
  for(let x=8;x<W;x+=12){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  const ang=L.reduce((a,s)=>a+(s.ang||0),0)/L.length;
  const cx=W/2,cy=H/2,R=Math.min(W,H)*.42;
  /* кривые каждой ленты — вдоль дуги, каждая со своим горбом */
  L.forEach((s,i)=>{
    const r=rng(hashi(s.sx,s.sy,0xF16+i));
    c.strokeStyle="rgba(43,58,138,"+(.55+.3*r()).toFixed(2)+")";c.lineWidth=1.6;c.beginPath();
    for(let k=0;k<=60;k++){
      const t=-1+k/30;
      const a=ang+t*1.1;
      const rad=R*(.55+i*.12)+Math.sin(k/4+r()*3)*3*(s.mis*8+.4);
      const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
      k?c.lineTo(x,y):c.moveTo(x,y);
    }
    c.stroke();
  });
  /* ось — карандашом, едва */
  c.strokeStyle="rgba(90,70,40,.35)";c.lineWidth=1;c.setLineDash([3,4]);
  c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*R*1.05,cy+Math.sin(ang)*R*1.05);c.stroke();
  c.setLineDash([]);
}
