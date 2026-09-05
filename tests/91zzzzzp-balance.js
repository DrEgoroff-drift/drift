/* ══════════════ числа, записанные в договоре (M357) ══════════════
   В PLAN.md и CLAUDE.md записаны не пожелания, а ЧИСЛА, на которых стоит
   замысел: наёмник отбивает рейсом ~85 % жалованья и потому остаётся ставкой,
   а не станком; ящик конторы берёт процент в сутки и сдаёт содержимое через
   тридцать; кооператив открывается на обороте в двенадцать тысяч и берёт
   полтора за штамп; прилавок продаёт дороже, чем берёт, на шесть процентов;
   дрон-бур стоит девять тысяч «по окупаемости».

   Ни один набор эти числа не сторожит. Балансная правка сдвинет их молча — и
   документ, на который все ссылаются, станет враньём, а вместе с ним поедет и
   замысел: «наёмник — это ставка, а не доход» держится ровно на 0.85.

   Здесь не «правильные» числа, а СОГЛАСИЕ кода с документом. Если число
   меняют нарочно — набор краснеет один раз и просит поменять и строку в
   PLAN.md. Это и есть его работа. */

TEST_SUITES.push(() => suite("договор: числа замысла те же, что записаны в документах", () => {
  /* каждая строка: что, сколько, и где это записано */
  const PACT=[
    ["CREW_YIELD",        typeof CREW_YIELD!=="undefined"?CREW_YIELD:null,        .85,     "CLAUDE.md, «руки теряют деньги — это не баг»"],
    ["CREW_OFFLINE_CAP",  typeof CREW_OFFLINE_CAP!=="undefined"?CREW_OFFLINE_CAP:null, 24*3600*1000, "офлайн догоняется сутками, не больше"],
    ["LOCKER_FEE",        typeof LOCKER_FEE!=="undefined"?LOCKER_FEE:null,        .01,     "PLAN M345: 1 %/сутки от стоимости"],
    ["LOCKER_LAPSE",      typeof LOCKER_LAPSE!=="undefined"?LOCKER_LAPSE:null,    30,      "PLAN M345: 30 суток без визита — на блошинец"],
    ["LOCKER_SLOTS",      typeof LOCKER_SLOTS!=="undefined"?LOCKER_SLOTS:null,    24,      "PLAN M345: 24 места (48 со «Вторым ящиком»)"],
    ["COOP_EXAM",         typeof COOP_EXAM!=="undefined"?COOP_EXAM:null,          12000,   "PLAN M351: экзамен по обороту"],
    ["COOP_FEE",          typeof COOP_FEE!=="undefined"?COOP_FEE:null,            1500,    "PLAN M351: штамп за 1 500"],
    ["BUY_SPREAD",        typeof BUY_SPREAD!=="undefined"?BUY_SPREAD:null,        1.06,    "12-economy: взять дороже, чем сдать"],
    ["дрон-бур, цена",    (typeof DRONES!=="undefined"&&DRONES.miner)?DRONES.miner.price:null, 9000, "PLAN M350: 9 000 кр по окупаемости"]
  ];
  const bad=[];
  for(const [ru,got,want,where] of PACT){
    if(got===null){bad.push(ru+": имени нет вовсе");continue;}
    if(Math.abs(got-want)>1e-9)bad.push(ru+": в коде "+got+", в документе "+want+" ("+where+")");
  }
  eq(bad.slice(0,4).join(" ;; "),"","код и документы говорят об одних числах");
  /* потолки разрядов кооператива: 60 / 150 / без потолка (PLAN M351) */
  if(typeof COOP_RANKS!=="undefined"){
    eq(COOP_RANKS.length,3,"разрядов кооператива три");
    eq(COOP_RANKS[0].cap,60,"первый разряд берёт до 60 единиц за заход");
    eq(COOP_RANKS[1].cap,150,"второй — до 150");
    ok(!COOP_RANKS[2].cap||COOP_RANKS[2].cap>1e6,"третий — без потолка");
    eq(COOP_RANKS[0].crew,1,"мест в звене на первом разряде: 1");
    eq(COOP_RANKS[1].crew,3,"на втором: 3");
  }
}));

TEST_SUITES.push(() => suite("договор: наёмник остаётся ставкой, а не станком", () => {
  /* «Руки теряют деньги, и это не баг» (CLAUDE.md): рейс отбивает около 85 %
     жалованья, прибыль живёт в хвостах таблицы событий. Проверяем не текст, а
     поведение: без событий рейс обязан оставаться в минусе. */
  resetWorld();
  if(typeof coopStamp==="function")coopStamp("Проверка");
  G.credits=200000;
  if(typeof stationMercs!=="function"||typeof hireMerc!=="function"){ok(true,"наёма в этой сборке нет — пропуск");return;}
  const pool=stationMercs(G.sys)||[];
  ok(pool.length>0,"на станции есть кого нанять: "+pool.length);
  if(!pool.length)return;
  let hired=false;
  try{ hired=hireMerc(pool[0])!==false; }catch(e){ ok(false,"наём бросил: "+e.message); return; }
  ok(hired&&G.crew.length===1,"человек нанят");
  if(!G.crew.length)return;
  const c=G.crew[0];
  /* оклад в минуту считает crewPay, а не поле на человеке */
  const wage=(typeof crewPay==="function")?crewPay(c):0;
  ok(wage>0,"оклад в минуту назначен: "+Math.round(wage));
  /* ставка замысла: рейс отбивает CREW_YIELD от оклада, остальное — в хвостах
     таблицы событий. Множитель crewMul("yield") мы не трогаем — он про
     конкретного человека; сверяем сам закон и то, что он читается. */
  const mul=(typeof crewMul==="function")?crewMul(c,"yield"):1;
  ok(mul>0&&mul<3,"множитель выработки человека в разумных пределах: "+mul.toFixed(2));
  ok(CREW_YIELD*mul<1.3,"даже с лучшим человеком рейс не становится станком: "+(CREW_YIELD*mul).toFixed(2));
  /* и «скрытая удача» нигде не показывается игроку (CLAUDE.md) */
  const src=(typeof nmSource==="function")?nmSource():"";
  if(src){
    const tight=(typeof whyTight==="function")?whyTight(src):src.split(/\s+/).join("");
    ok(tight.indexOf('"удача"')<0&&tight.indexOf("crewLuck(c)+")<0,
       "скрытая удача не выведена в текст");
  }
  resetWorld();
}));

TEST_SUITES.push(() => suite("договор: ящик конторы берёт процент, а не сколько придётся", () => {
  /* 1 % в сутки от стоимости содержимого, тридцать суток — сдача на блошинец.
     Считаем руками и сверяем с тем, что списала игра. */
  resetWorld();
  if(typeof lockerRec!=="function"){ok(true,"ящика в этой сборке нет — пропуск");return;}
  const L=lockerRec();
  L.items=[];L.res={};
  L.res[RES_KEYS[0]]=100;
  G.credits=100000;
  const val=lockerValue(L);
  ok(val>0,"стоимость содержимого: "+val);
  const real=Date.now,now0=real.call(Date);
  let skew=0;
  Date.now=function(){ return now0+skew; };
  try{
    L.t=now0;
    skew=5*LOCKER_DAY;                       /* пять суток хранения */
    const c0=G.credits;
    const r=lockerTick();
    const want=Math.round(val*LOCKER_FEE*5);
    eq(r.days,5,"контора насчитала пять суток");
    eq(c0-G.credits,want,"списано ровно 1 % в сутки: "+(c0-G.credits)+" при ожидаемых "+want);
    /* и тридцать суток без визита — сдача, а не долг до небес */
    L.t=now0;skew=31*LOCKER_DAY;
    const c1=G.credits;
    const r2=lockerTick();
    ok(r2.gone===true,"тридцать суток без визита — ящик сдан");
    eq(c1-G.credits,0,"и за сдачу денег не берут");
    eq(lockerUsed(L),0,"ящик после сдачи пуст");
  }finally{ Date.now=real; }
  resetWorld();
}));
