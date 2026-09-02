/* ══════════════ автотесты: холдинг · своя баржа (M294) ══════════════ */
TEST_SUITES.push(()=>suite("холдинг: баржа кормит, а не торгует",()=>{
  resetWorld();
  ok(!!ORDERS.barge&&ORDERS.barge.spec===null,"приказ «баржа» есть и не требует специальности");
  const s=siteTestStation();
  const st=routeTestStations(4).filter(x=>x.key!==(s&&s.key));
  if(!s||!st.length){ok(true,"станций мало — пропущено");return;}
  siteTestOpen(s);
  /* цех на станции s, давно готовый */
  const good=bldAvailable(s).ok.find(x=>x.def.fam==="B");
  if(!good){ok(true,"в этой системе нечего заложить — пропущено");return;}
  const def=good.def,main=Object.keys(def.eats)[0];
  const H=holdOf(s.key);H.bld={};
  H.bld[def.id]={lvl:1,t0:Date.now(),ready:Date.now()-HOLD_SHIFT*20,my:{},got:{}};
  /* маршрут: s и ещё одна станция, прохоженный */
  G.seenPrices={};pricesSeen(s);pricesSeen(st[0]);
  G.trade=routeInit();routeToggle(s.sx,s.sy);routeToggle(st[0].sx,st[0].sy);
  /* пилот на «Стриже» — отказ; на «Вьюке» — принят */
  const c=genMerc(7,["haul"]);c.cargo={};c.traits=[];G.crew.push(c);   /* без «упрямого»: он отвергает первый приказ по замыслу */
  G.owned.vyuk=true;
  crewAssignShip(c,"strizh");
  ok(!bargeHullOk(c)||c.shipId!=="strizh","«Стриж» — не грузовой корпус");
  ok(/грузовой корпус/.test(bargeStart(c)),"на разведчике баржи не выйдет");
  crewAssignShip(c,"vyuk");
  ok(bargeHullOk(c),"«Вьюк» — грузовой корпус");
  ok(/пройдите круг/.test(bargeStart(c)),"непрохоженный маршрут баржа не берёт");
  routeOf().loops=1;
  ok(bargeStart(c)===""&&c.barge&&c.barge.legs.length===2,"баржа приняла маршрут из двух плеч");
  ok(BARGE_NAMES.indexOf(bargeName(c))>=0,"имя баржи из ряда Тюк/Куль: «"+bargeName(c)+"»");
  /* через приказ: crewOrder ставит barge */
  c.order={kind:"home",sx:0,sy:0};c.tMs=Date.now();
  ok(crewOrder(c,"barge")===true&&c.order.kind==="barge","приказ «баржа» отдан через crewOrder");
  /* погрузка у стойки: берёт то, что едят цеха на плечах */
  G.sys=s;
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo[main]=500;G.cargo.crystal=5;
  const wants=bargeWants(c);
  ok(wants[main]&&!wants.crystal,"баржа знает, что едят её цеха: "+Object.keys(wants).join(", "));
  const moved=bargeLoad(c);
  ok(moved>0&&moved<=crewCargoMax(c)&&(c.cargo[main]|0)===moved&&G.cargo.crystal===5,"погружено "+moved+" ед — только нужное, не больше трюма");
  /* смена прошла: пришла к s (плечо 1) и ссыпала в бункер */
  const B=H.bld[def.id],Q=bldQuota(def,1)[main],cap=Q*HOLD_CAP_SHIFTS;
  const idx=c.barge.legs.indexOf(s.key);
  c.barge.cursor=idx;c.barge.t0=Date.now()-HOLD_SHIFT-1;
  const before=c.cargo[main]|0;
  const fed=bargeTick(c);
  ok(fed===Math.min(cap,before)&&(B.my[main]|0)===fed&&(c.cargo[main]|0)===before-fed,"баржа ссыпала "+fed+" ед в бункер ("+cap+" — три смены нормы)");
  ok(c.barge.fed===fed&&c.barge.cursor===idx+1,"счёт скормленного и курсор идут");
  /* блокада: плечо пропущено, груз остался */
  B.my={};c.barge.cursor=idx;c.barge.t0=Date.now()-HOLD_SHIFT-1;
  G.occ=G.occ||{};G.occ[s.key]={lvl:2,kills:0,t:Date.now()};
  const left=c.cargo[main]|0;
  ok(bargeTick(c)===0&&(c.cargo[main]|0)===left&&c.barge.stopped===1,"под блокадой баржа обходит плечо");
  delete G.occ[s.key];
  /* оклад — минусом, выручки нет: crewTick платит, но не зарабатывает */
  c.tMs=Date.now()-10*60000;const cr=G.credits,earned=c.earned|0;
  crewTick();
  ok((c.earned|0)===earned,"баржа не приносит денег: earned не вырос");
  ok(c.order.kind==="barge"&&c.barge,"после тика приказ на месте");
  /* ДЕЛО и сохранение */
  ok(bargeDealList().some(x=>x.nm.indexOf(bargeName(c))>=0),"ДЕЛО показывает баржу");
  const legs=c.barge.legs.join("|");
  applySave(JSON.parse(JSON.stringify(snapshot())));
  const c2=G.crew.find(x=>x.id===c.id);
  ok(!!c2&&c2.order.kind==="barge"&&c2.barge&&c2.barge.legs.join("|")===legs,"баржа пережила сохранение");
  /* выгрузка обратно */
  G.sys=s;for(const k of RES_KEYS)G.cargo[k]=0;
  const onb=crewHold(c2);
  const back=bargeUnload(c2);
  ok(back===Math.min(onb,stat().cargoMax)&&crewHold(c2)===onb-back,"выгрузка возвращает груз в трюм ("+back+")");
}));
