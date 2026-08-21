/* ══ M121: блошинец — у каждого лота есть откуда ══
   Сторож замысла: лота без провенанса не бывает, провенанс называет место, до
   которого можно долететь, купленный лот не возвращается на прилавок, счёт идёт
   в бонах дома, а кредиты дороже. И то, что записано про вас, уходит без вас. */
TEST_SUITES.push(()=>suite("Блошинец: каждый лот откуда-то взялся",()=>{
  resetWorld();
  /* ── тип станции существует и достижим ── */
  const T=stTypeOf("bazaar");
  eq(T.id,"bazaar","седьмой тип станции есть");
  ok(T.tabs.indexOf("flea")>=0,"и у него своя вкладка рядов");

  /* ── найти живой блошинец в галактике: тип должен встречаться, а не числиться ── */
  let bz=null;
  for(let x=-9;x<=9&&!bz;x++)for(let y=-9;y<=9&&!bz;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s.station&&s.station.stype==="bazaar")bz=s;
  }
  ok(!!bz,"блошинец встречается в галактике"+(bz?(" ("+bz.sx+":"+bz.sy+")"):""));
  if(!bz)return;

  /* ── ряды: провенанс у каждого лота, и он называет живое место ── */
  G.sys=bz;G.sx=bz.sx;G.sy=bz.sy;G.st=bz.station;
  const lots=fleaLots(bz);
  ok(lots.length>0,"на прилавке что-то лежит: "+lots.length);
  ok(lots.every(l=>!!l.who&&!!l.why&&!!l.note),"лота без записи о прошлом нет");
  ok(lots.every(l=>!!starAt(l.at.sx,l.at.sy)),"каждый провенанс называет живой сектор");
  ok(lots.every(l=>l.price>0),"и у каждого есть цена");
  /* тот же прилавок при том же времени — тот же: ряды считаются, а не выпадают */
  eq(fleaLots(bz).map(l=>l.id).join("|"),lots.map(l=>l.id).join("|"),
     "ряды детерминированы, а не случайны");

  /* ── кредиты дороже бон: это чужой дом ── */
  const L=lots.find(l=>l.kind!=="you")||lots[0];
  ok(fleaCredits(L)>fleaScrip(L),"кредитами дороже, чем бонами");

  /* ── купить: адрес ложится на карту, лот с прилавка исчезает навсегда ── */
  const marks0=loreMarks().length;
  G.credits=fleaCredits(L)+10;
  const bought=fleaBuy(L.id,"cr",bz);
  ok(!!bought,"лот куплен за кредиты");
  eq(G.credits,10,"кредиты списаны ровно по цене с наценкой");
  if(bought&&bought.kind!=="you")
    ok(loreMarks().length>marks0,"адрес лёг на карту вместе с вещью");
  ok(fleaLots(bz).every(l=>l.id!==L.id),"купленный лот с прилавка ушёл");
  ok(!fleaBuy(L.id,"cr",bz),"и купить его второй раз нельзя");

  /* ── за боны платят бонами, а не кредитами ── */
  const H=houseOf(bz),L2=fleaLots(bz).find(l=>l.kind!=="you");
  if(H&&L2){
    const cr=G.credits=500;
    G.scrip[H.id]=fleaScrip(L2)+3;
    ok(!!fleaBuy(L2.id,"scrip",bz),"лот куплен за боны");
    eq(scripHeld(H.id),3,"боны списаны по цене прилавка");
    eq(G.credits,cr,"кредиты при этом не тронуты");
  }

  /* ── сохранение: купленное переживает перезагрузку, ряды — нет ── */
  const got=G.flea.got.slice();
  applySave(JSON.parse(JSON.stringify(snapshot())));
  eq(G.flea.got.join("|"),got.join("|"),"список купленного пережил сохранение");
}));

/* ══ и то, что записано про вас, уходит без вас ══ */
TEST_SUITES.push(()=>suite("Блошинец: сведения о вас уходят без вас",()=>{
  resetWorld();
  let bz=null;
  for(let x=-9;x<=9&&!bz;x++)for(let y=-9;y<=9&&!bz;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s.station&&s.station.stype==="bazaar")bz=s;
  }
  ok(!!bz,"блошинец найден");
  if(!bz)return;
  G.sys=bz;G.sx=bz.sx;G.sy=bz.sy;G.st=bz.station;
  const mine=fleaLots(bz).find(l=>l.kind==="you");
  ok(!!mine,"лот про ваш сектор лежит на виду");
  if(!mine)return;
  eq(mine.at.sx,G.sx,"и в нём записан именно ваш сектор");

  /* ушли, не забрав — адрес купил кто-то другой */
  const marks0=Object.keys(huntAll()).length;
  ok(fleaLeave(bz),"уход оставляет лот на прилавке");
  ok(Object.keys(huntAll()).length>=marks0,"охотник получает адрес");

  /* забрали — уходить уже нечему */
  G.credits=fleaCredits(mine)+5;
  ok(!!fleaBuy(mine.id,"cr",bz),"сведения о вас можно снять с прилавка");
  ok(!fleaLeave(bz),"после этого уход ничего не оставляет");
}));
