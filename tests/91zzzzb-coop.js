/* ══════════════ автотесты: кооператив (M351) ══════════════
   Экзамен оборотом; прилавок и найм — только кооперативу; потолки по разряду;
   цена ломтями монотонна; гроссбух равен тому, что двигал earn(); дух в границах;
   просьба — из состава, не из броска. */
TEST_SUITES.push(()=>suite("кооператив: экзамен оборотом, штамп, прилавок и найм открываются",()=>{
  resetWorld();
  G.coop=null;G.credits=5000;G.soldTotal=0;
  const S=nearestStation(0,0);G.sys=S;G.sx=S.sx;G.sy=S.sy;G.st=S.station;G.mode="dock";
  ok(!!coopHouseHere(),"у станции есть дом-патрон");
  eq(crewCap(),0,"без кооператива нанимать некуда");
  ok(!hireMerc(genMerc(1,["haul"])),"наём закрыт");
  eq(coopBuy(S,"iron",10),0,"прилавок закрыт");
  ok(!coopRegister("Тихий ход"),"без оборота не записывают");
  G.soldTotal=12000;
  ok(!coopRegister("Т"),"имя из одной буквы — не имя");
  ok(coopRegister("Тихий ход"),"оборот есть — штамп");
  ok(coopHas()&&G.coop.name==="Тихий ход"&&G.coop.house===coopHouseHere().id,"кооператив записан под домом станции");
  eq(G.credits,3500,"взнос списан");
  eq(coopRank().n,1,"разряд первый");
  eq(crewCap(),1+techLv("license")+mgrCrewCap(),"место в звене — по разряду плюс лицензия");
  ok(!coopRegister("Второй"),"второго не записывают");
  /* прилавок: потолок 60 за заход, ломтями */
  G.credits=100000;G.cargo.iron=0;
  const q1=coopBuyQuote(S,"iron",150);
  ok(q1.total>150*q1.ask0,"150 единиц ломтями дороже, чем 150 × первая цена");
  ok(q1.askLast>q1.ask0,"последний ломоть дороже первого");
  const got=coopBuy(S,"iron",100);
  eq(got,Math.min(60,stat().cargoMax),"за заход — не больше потолка разряда (или трюма)");
  eq(coopCapLeft("iron"),Math.max(0,60-got),"остаток потолка");
  eq(coopBuy(S,"iron",100),0,"второй раз за заход — ничего");
  coopVisitReset();
  ok(coopCapLeft("iron")===60,"новый заход — потолок снова");
  /* сейв */
  const snap=snapshot();G.coop=null;applySave(snap);
  ok(coopHas()&&G.coop.name==="Тихий ход","кооператив вернулся из сейва");
  const s2=JSON.parse(JSON.stringify(snap));delete s2.coop;applySave(s2);
  ok(!coopHas(),"старый сейв — без кооператива");
  G.coop=null;G.mode="system";G.st=null;G.cargo.iron=0;G.soldTotal=0;
}));

TEST_SUITES.push(()=>suite("кооператив: разряды, гроссбух, дух, просьбы из состава",()=>{
  resetWorld();
  G.coop=null;G.soldTotal=12000;G.credits=99999;
  const S=nearestStation(0,0);G.sys=S;G.sx=S.sx;G.sy=S.sy;G.st=S.station;G.mode="dock";
  coopRegister("Артель Ветер");
  const C=G.coop;
  /* разряды */
  eq(coopRank().n,1,"I");
  G.soldTotal=C.sold0+100000;eq(coopRank().n,1,"оборот есть, просьб нет — всё ещё I");
  C.done=["canteen","hangar"];eq(coopRank().n,2,"две просьбы и сто тысяч — Артель");
  eq(coopCapLeft("iron"),150,"потолок Артели — 150");
  G.soldTotal=C.sold0+500000;C.done=["canteen","hangar","school","medpoint"];
  eq(coopRank().n,3,"Товарищество");
  ok(coopCapLeft("iron")>1e6,"без потолка");
  ok(coopSpread()<BUY_SPREAD,"спред Товарищества уже");
  C.done=[];G.soldTotal=C.sold0;
  /* гроссбух: ровно то, что двигал earn */
  const L=coopLedger();const c0=G.credits;
  earn(1200,"trade");earn(300,"crew");
  eq(G.credits-c0,1500,"деньги пришли");
  eq((coopLedger().in.trade|0)+(coopLedger().in.crew|0),1500,"гроссбух насчитал те же полторы тысячи");
  coopCost(200,"wages");eq(coopLedger().out.wages,200,"оклады — расход");
  /* дух: границы и множитель */
  C.spirit=0;coopSpiritAdd(-3);eq(coopSpirit(),0,"не ниже нуля");
  coopSpiritAdd(9);eq(coopSpirit(),5,"не выше пяти");
  ok(Math.abs(coopMul()-1.05)<1e-9,"пять пунктов — плюс пять процентов");
  C.spirit=2;
  /* просьбы — из состава */
  G.crew=[];G.drones=[];G.mgrs=[];C.wants=[];C.done=[];
  eq(coopAsks().length,0,"пусто в составе — просьб нет");
  G.crew=[{name:"а"},{name:"б"},{name:"в"}];
  ok(coopAsks().some(a=>a.id==="canteen"),"трое людей — просят столовую");
  ok(coopAsks().some(a=>a.id==="dayoff"),"и выходной");
  for(let i=0;i<5;i++)G.drones.push({id:i});
  ok(coopAsks().length<=3,"открытых просьб не больше трёх");
  /* исполнение: столовая на станции холдинга — просьба уходит в done, дух растёт */
  const sp=coopSpirit();
  G.hold[S.key]={bld:{canteen:{lvl:1,t0:0,ready:0,my:{},got:{}}}};
  coopAsks();
  ok(C.done.indexOf("canteen")>=0,"столовая построена — просьба исполнена");
  eq(coopSpirit(),sp+1,"дух +1");
  /* страница в ДЕЛАХ рисуется */
  tableToggle(true,"deeds");
  const box=document.getElementById("loglist");
  ok(/КООПЕРАТИВ «АРТЕЛЬ ВЕТЕР»/.test(box.textContent),"страница в ДЕЛАХ называет кооператив");
  ok(/ЗА СМЕНУ/.test(box.textContent),"и ведёт гроссбух");
  tableToggle(false);
  /* станция: прилавок и запись рисуются без исключений */
  let err="";
  try{tab="market";renderTab();}catch(e){err=e.message;}
  eq(err,"","рынок с прилавком рисуется");
  ok(/прилавок/i.test($body.textContent)&&/АРТЕЛЬ ВЕТЕР/i.test($body.textContent),"прилавок подписан кооперативом");
  G.coop=null;
  try{renderTab();}catch(e){err=e.message;}
  ok(/только кооперативы/i.test($body.textContent)&&/запись кооператива/i.test($body.textContent),"без кооператива — закрытый прилавок и запись");
  G.mode="system";G.st=null;G.crew=[];G.drones=[];G.mgrs=[];G.hold={};G.soldTotal=0;tab="market";
}));
