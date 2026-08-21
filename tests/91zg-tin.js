/* ══ M119: Жестянка считает по-своему и не решает ничего ══
   Сторож замысла: железо стоит только там, где некому жить; наряд записан в
   мёртвых мерах и закрывается пересчётом, а не уговором; смена идёт ровно на
   то, что засыпали; платит она товаром и никогда кредитом; лента отдаёт по
   записи за раз и кончается. */
TEST_SUITES.push(()=>suite("Жестянка: наряд в мерах, которых больше нет",()=>{
  resetWorld();
  /* ── где она стоит ── */
  let seen=0,with_=0;
  for(let dx=-7;dx<=7;dx++)for(let dy=-7;dy<=7;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    const sx0=G.sx,sy0=G.sy;
    G.sx=dx;G.sy=dy;
    for(const p of (s.planets||[])){
      seen++;
      if(!tinCanLive(p))continue;
      with_++;
      ok(TIN_ON.indexOf(p.type)>=0,"железо только на выбранных типах: "+p.type);
      ok(!settleCanLive(p),"и никогда там, где может жить посёлок: "+p.name);
    }
    G.sx=sx0;G.sy=sy0;
  }
  ok(seen>40,"проверено миров: "+seen);
  ok(with_>0,"Жестянки в галактике есть: "+with_);
  ok(with_<seen*.3,"и это редкость: "+with_+" из "+seen);

  /* ── наряд: чистая функция зерна и мёртвая мера ── */
  for(let i=0;i<200;i++){
    const A=tinAskOf(i*7919+3),B=tinAskOf(i*7919+3);
    eq(A.k,B.k,"то же зерно — то же сырьё");
    eq(A.need,B.need,"и тот же объём");
    ok(TIN_FEED.indexOf(A.k)>=0,"просят ходовое сырьё: "+A.k);
    ok(A.count>=2,"наряд не бывает на одну меру: "+A.count);
    eq(A.need,A.count*A.per,"объём — это мера, помноженная на число");
    ok(A.per>1,"мера не равна единице: пересчёт есть всегда ("+A.per+")");
  }
  /* склонение при числе — интерфейс, а не украшение */
  eq(tinPl(1,["бочка","бочки","бочек"]),"бочка","одна бочка");
  eq(tinPl(3,["бочка","бочки","бочек"]),"бочки","три бочки");
  eq(tinPl(5,["бочка","бочки","бочек"]),"бочек","пять бочек");
  eq(tinPl(11,["бочка","бочки","бочек"]),"бочек","одиннадцать бочек");
  eq(tinPl(21,["бочка","бочки","бочек"]),"бочка","двадцать одна бочка");
}));

TEST_SUITES.push(()=>suite("Жестянка: смена идёт ровно на то, что засыпали",()=>{
  resetWorld();
  /* ставим железо руками: место в галактике уже проверено соседним набором */
  const T=tinMake({idx:1,name:"проба",seed:4242});
  const A=tinAskOf(T.seed);
  ok(!!T,"запись Жестянки заведена");
  eq(T.run,0,"новая машина стоит");

  /* ── недосыпанный наряд не запускает смену ── */
  G.cargo[A.k]=A.need*3;
  const part=Math.max(1,A.per-1);
  eq(tinFeed(T,part),part,"часть меры принята");
  eq(T.run,0,"но смена не пошла: наряд не закрыт");
  eq(T.fed,part,"принятое лежит в приёмнике");

  /* ── закрытый наряд запускает ── */
  const rest=A.need-T.fed;
  eq(tinFeed(T,rest+50),rest,"машина берёт ровно столько, сколько ей нужно");
  ok(T.run>0,"смена пошла");
  eq(G.cargo[A.k],A.need*3-A.need,"из трюма ушло ровно по наряду");
  eq(tinFeed(T,10),0,"работающая машина больше не принимает");

  /* ── работа считается по времени, а не по кадрам ── */
  const cr=G.credits;
  T.last=Date.now()-20*60000;                 // двадцать минут офлайна
  tinTick(T);
  ok(T.bin>0,"в бункере что-то появилось: "+Math.floor(T.bin));
  ok(T.bin<=TIN_BIN,"и бункер не бездонный");
  eq(G.credits,cr,"кредитов машина не платит никогда");

  /* ── забрать: отдаёт всё, что наработала, если в трюме есть куда ── */
  G.cargo[A.k]=0;                              // освобождаем трюм под выдачу
  const had=Math.floor(T.bin), before=G.cargo[A.made]|0;
  const got=tinTakeOut(T);
  eq(got,had,"отдано всё, что было");
  eq(G.cargo[A.made]|0,before+had,"и легло в трюм");
  eq(tinTakeOut(T),0,"пустой бункер отдаёт ноль");
  eq(G.credits,cr,"и по-прежнему ни кредита");
  /* полный трюм: забранное списывается по факту, остальное остаётся лежать */
  T.bin=30;
  for(const k of RES_KEYS)if(!RES[k].rare)G.cargo[k]=0;
  G.cargo.ice=stat().cargoMax;                 // мест нет вовсе
  eq(tinTakeOut(T),0,"в полный трюм не выдаётся ничего");
  eq(Math.round(T.bin),30,"и бункер остаётся полным");

  /* ── сырьё кончилось — машина встала и просит заново ── */
  T.last=Date.now()-24*3600*1000;
  tinTick(T);
  eq(T.run,0,"смена кончилась");
  eq(T.fed,0,"наряд открыт заново");
}));

TEST_SUITES.push(()=>suite("Жестянка: лента отдаёт по записи и кончается",()=>{
  resetWorld();
  const T=tinMake({idx:2,name:"проба",seed:99});
  const list=tinEntries(T);
  eq(list.length,TIN_LOG,"в ленте ровно столько записей, сколько объявлено");
  eq(JSON.stringify(tinEntries(T)),JSON.stringify(list),"лента не бросается заново");
  for(const e of list){
    ok(e.day<=celDay(),"машина не записывает будущее: сутки "+e.day);
    ok(e.hdg>=0&&e.hdg<360,"пеленг — это градусы: "+e.hdg);
    ok(/^\d{4}$/.test(e.code),"событию дан номер, а не имя: "+e.code);
  }
  /* снимаем всю ленту: каждая запись отдаётся один раз */
  const marks0=loreMarks().length;
  let taken=0;
  for(let i=0;i<TIN_LOG+3;i++)if(tinStrip(T))taken++;
  eq(taken,TIN_LOG,"снято ровно столько записей, сколько их есть");
  eq(tinStrip(T),null,"и больше лента ничего не отдаёт");
  ok(loreCount()>0,"лента — свидетель: куски отчёта пришли");
  ok(loreMarks().length>marks0,"а пеленги легли метками на карту");
  for(const m of loreMarks().slice(marks0)){
    ok(typeof starAt==="function"&&!!starAt(m.sx,m.sy),
       "метка стоит на звезде, а не в пустоте: "+m.sx+":"+m.sy);
  }
}));
