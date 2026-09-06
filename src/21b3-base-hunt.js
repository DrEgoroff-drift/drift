/* ══════════════ охота на управляющего (M406, DESIGN-base §24.2–§24.5, §35.1) ══════════════
   Сотня стоит у прилавков и рекламирует себя (M405). НАСТОЯЩИЙ НЕ РЕКЛАМИРУЕТ:
   он где-то работает, где-то пьёт или сидит в развалине, которую не покинул.
   Поэтому тот, кто ходит только по прилавкам, встретит лучшего из поддельных —
   и это ловушка, вокруг которой построен весь слой.

   Он — ФУНКЦИЯ ВРЕМЕНИ, а не запись: `mgrWhere(смена)` считает, где он сейчас,
   из семени и номера смены. Маршрут — череда работ по несколько сотен смен, по
   настоящим местам. Он работает, смотрите вы на него или нет, и он ПЕРЕЕЗЖАЕТ.
   В этом вся трудность охоты: любая улика описывает, где он БЫЛ.

   Каналов четыре, и все уже построены в игре (§24.4). Здесь заведены два, на
   которых стоит настоящее умение:

   · ПЕЛЕНГ (приёмник): направление ±15° и ни слова о расстоянии. Два пеленга,
     взятых из двух далёких систем в пределах нескольких смен, пересекаются там,
     где он сейчас. Это и есть план: лететь широко, слушать, лететь ещё шире,
     слушать снова, провести крест по карте — и идти;
   · СЛУХ (`11t`): область в три-пять систем и ВРЕМЯ — «месяц назад». Пятнадцать
     процентов слухов просто неверны, а верный показывает его прошлое.

   И ложные цели: в галактике есть дюжина обыкновенных, но известных смотрителей,
   и слухи их путают постоянно. Убедиться по одному источнику нельзя — ровно для
   этого в игре и есть правило двух источников. */
const ONE_JOB=260;           /* столько смен он держится одной работы */
const ONE_BEAR_ERR=15;       /* градусов вранья в пеленге */
const FAME_N=12;             /* столько известных смотрителей путают со всеми */
/* ── он сам ──
   Один на галактику, и он всегда на самом верху кривой M405: без изъяна и с
   чутьём, которого нет ни у кого из сотни. */
/* Кэш на МОДУЛЕ, а не в `G` (разбор 0.409.1): `resetWorld` чистит мир, а он —
   свойство галактики, и четыре тысячи бросков с генератором имён при каждом
   старте были заметны. */
let ONE_ID=null;
function theOneId(){
  if(ONE_ID!==null)return ONE_ID;
  /* ищем по той же кривой, что и всех: он не исключение из неё, он её хвост */
  let best=null,bq=0;
  for(let i=0;i<4000;i++){
    const M=bmgrOf(hashi(i,0x0DEAD,0x0BA5E));
    if(M.flaw)continue;
    if(M.q>bq){bq=M.q;best=M.id;}
  }
  return ONE_ID=(best===null?hashi(1,0x0DEAD,0x0BA5E):best);
}
function theOne(){const M=bmgrOf(theOneId());M.real=1;return M;}
/* ── где он сейчас (§24.2) ──
   Череда работ; каждая — настоящая система с настоящей станцией. Ничего не
   хранится: тот же ответ у всех и на любую смену. */
function mgrJobAt(n){
  return Math.floor((n||0)/ONE_JOB);
}
function mgrWhere(n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  const job=mgrJobAt(n);
  const r=rng(hashi(job,theOneId(),0x0C0FFEE|0));
  /* место ищем от центра круга наружу: первая же система со станцией */
  for(let ring=1;ring<14;ring++){
    const a=r()*TAU;
    const sx=Math.round(Math.cos(a)*ring*2.6),sy=Math.round(Math.sin(a)*ring*2.6);
    if(typeof starAt!=="function"||!starAt(sx,sy))continue;
    const sys=(typeof getSystem==="function")?getSystem(sx,sy):null;
    if(!sys||!sys.station)continue;
    return {sx,sy,job,since:job*ONE_JOB,kind:"станция"};
  }
  return {sx:0,sy:0,job,since:job*ONE_JOB,kind:"станция"};
}
function mgrHereNow(sx,sy,n){
  const W=mgrWhere(n);
  return (W.sx===(sx===undefined?G.sx:sx)|0)&&(W.sy===(sy===undefined?G.sy:sy)|0);
}
/* ── пеленг (§24.4) ──
   Направление и ничего больше. Врёт на ±15°, и это враньё — своё у каждой
   системы и каждой смены: два пеленга из одной точки не уточняют ничего. */
function mgrBearing(sx,sy,n){
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  const W=mgrWhere(n);
  const dx=W.sx-(sx|0),dy=W.sy-(sy|0);
  if(!dx&&!dy)return {deg:0,here:1,n};
  const r=rng(hashi((sx|0)*71+(sy|0),n,0x0BEA5));
  const err=(r()*2-1)*ONE_BEAR_ERR;
  let deg=Math.atan2(dy,dx)*180/Math.PI+err;
  deg=((deg%360)+360)%360;
  return {deg:Math.round(deg),here:0,n};
}
/* строка пеленга: румб словами и ни одной цифры расстояния */
const RUMB=["восток","северо-восток","север","северо-запад","запад","юго-запад","юг","юго-восток"];
function mgrBearLine(sx,sy,n){
  const b=mgrBearing(sx,sy,n);
  if(b.here)return "…он здесь. Где-то в этой системе";
  const i=Math.round(b.deg/45)%8;
  return "…слышно слабо, но ровно: "+RUMB[i]+", румб "+b.deg+"°. Расстояния не разобрать";
}
/* ── ложные цели ──
   Дюжина обыкновенных, но известных смотрителей. Слухи путают их с ним
   постоянно, и отличить по одному источнику нельзя. */
function fameOf(i){
  const M=bmgrOf(hashi(i|0,0x0FA3E,0x11));
  M.fame=1;
  return M;
}
function fameWhere(i,n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  const r=rng(hashi(i|0,mgrJobAt(n),0x0FA3E));
  for(let ring=1;ring<14;ring++){
    const a=r()*TAU;
    const sx=Math.round(Math.cos(a)*ring*2.6),sy=Math.round(Math.sin(a)*ring*2.6);
    if(typeof starAt!=="function"||!starAt(sx,sy))continue;
    const sys=(typeof getSystem==="function")?getSystem(sx,sy):null;
    if(!sys||!sys.station)continue;
    return {sx,sy};
  }
  return {sx:0,sy:0};
}
/* ── слух о нём (§24.4) ──
   Область и ВРЕМЯ. Верный слух показывает его ПРОШЛОЕ: работу, которую он уже
   оставил. Пятнадцать процентов просто неверны — как и всякий слух в этой игре. */
function mgrRumour(r){
  r=r||rng(hashi(G.sx|0,G.sy|0,0x0D5EE));
  const n=(typeof baseShift==="function")?baseShift():0;
  const back=1+Math.floor(r()*3);                 /* про какую работу назад говорят */
  const past=Math.max(0,n-back*ONE_JOB);
  const fake=r()<.5;                              /* половина слухов — о ложной цели */
  const wrong=r()<.15;
  const W=fake?fameWhere(Math.floor(r()*FAME_N),past):mgrWhere(past);
  let sx=W.sx+Math.round((r()-.5)*4),sy=W.sy+Math.round((r()-.5)*4);
  if(wrong){sx=Math.round((r()-.5)*60);sy=Math.round((r()-.5)*60);}
  const who=fake?fameOf(Math.floor(r()*FAME_N)):theOne();
  const when=back===1?"с месяц назад":(back===2?"прошлой зимой":"давно, ещё до всего");
  return {sx,sy,rad:3+Math.floor(r()*3),wrong,fake,
    text:"«Был тут управляющий, "+who.call+". Взял базу и вытянул её из ничего. "+
      "Говорят, "+when+" видели у сектора "+sx+":"+sy+"»"};
}
/* ── случайная встреча (§24.3) ──
   Никакой отметки. Он просто стоит среди кандидатов, если он здесь. */
function mgrCandidatesHere(sys){
  const L=(typeof bmgrAt==="function")?bmgrAt(sys):[];
  if(!sys)return L;
  if(mgrHereNow(sys.sx,sys.sy))L.unshift(theOne());
  return L;
}
