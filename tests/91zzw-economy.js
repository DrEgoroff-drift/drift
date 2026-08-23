/* ══════════════ автотесты: экономика без долга (M152e) ══════════════
   Сначала замер, потом правки: набор печатает кр/мин по источникам и расходам
   для трёх профилей (руки / с наёмником и дроном / с управляющими), а затем
   держит правила: ни одного расхода «в минуту из кассы игрока» у управляющих,
   простой наёмника бесплатен, нужда ×2 на один привоз, один наряд на руках,
   «Вьюк» по разнарядке на обороте 3 000. Числа в строках — чтобы кривую крутили
   по отчёту, а не по ощущению. */
function ecoStations(rad){
  const out=[];
  for(let x=-rad;x<=rad;x++)for(let y=-rad;y<=rad;y++){
    if(!starAt(x,y))continue;const S=getSystem(x,y);
    if(S&&S.station&&S.station.prices)out.push(S);
  }
  return out;
}
/* лучшее плечо между двумя станциями при данном трюме: купить там, где дёшево,
   продать там, где дорого. Время плеча — 2.5 мин плюс 0.6 мин на прыжок */
function ecoBestLeg(list,hold,cap,noNeed){
  let best=null;
  for(const A of list)for(const B of list){
    if(A===B)continue;
    if(noNeed&&(needOf(A)||needOf(B)))continue;
    const PA=marketFor(A),PB=marketFor(B);
    const d=Math.max(Math.abs(A.sx-B.sx),Math.abs(A.sy-B.sy));
    for(const k of TRADE_KEYS){
      if(!PA[k]||!PB[k])continue;
      const h=cap?Math.min(hold,Math.floor(cap/PA[k])):hold;
      const profit=(PB[k]-PA[k])*h,min=2.5+d*.6;
      const fuel=(d*6+4)*8;
      const net=profit-fuel;
      if(!best||net/min>best.rate)best={A:A.station.name,B:B.station.name,k,d,net,min,rate:net/min,buy:PA[k],sell:PB[k]};
    }
  }
  return best;
}
TEST_SUITES.push(()=>suite("экономика: замер кр/мин по источникам (отчёт, не проверка)",()=>{
  resetWorld();
  G.credits=600;
  const list=ecoStations(7);
  ok(list.length>=3,"станций в радиусе 7: "+list.length);
  const L40=ecoBestLeg(list,40,600,true),L150=ecoBestLeg(list,150,0,true),LN=ecoBestLeg(list,40,0,false);
  ok(!!LN,"руки · с нуждой, без предела капитала: "+(LN?LN.A+" → "+LN.B+" · "+RES[LN.k].ru.toLowerCase()+" "+LN.buy+"→"+LN.sell+" · "+Math.round(LN.net)+" кр за плечо":"нет"));
  ok(!!L40,"руки · «Стриж» (трюм 40, касса 600, без нужды): лучшее плечо "+(L40?L40.A+" → "+L40.B+" · "+RES[L40.k].ru.toLowerCase()+" "+L40.buy+"→"+L40.sell+" · "+Math.round(L40.net)+" кр за "+L40.min.toFixed(1)+" мин = "+Math.round(L40.rate)+" кр/мин":"нет"));
  ok(!!L150,"руки · «Вьюк» (трюм 150, без нужды): "+(L150?Math.round(L150.net)+" кр за "+L150.min.toFixed(1)+" мин = "+Math.round(L150.rate)+" кр/мин":"нет"));
  /* нужда: ×2 на один привоз */
  let needed=0,needGain=0;
  for(const S of list){const N=needOf(S);if(N){needed++;needGain=Math.max(needGain,marketFor(S)[N.k]*40);}}
  ok(true,"нужда · станций с нуждой сейчас: "+needed+" из "+list.length+" · лучший разовый привоз на 40 ед.: "+needGain+" кр");
  /* наряды */
  let orders=0,paySum=0,costSum=0;
  for(const S of list){const O=orderOf(S);if(O){orders++;paySum+=O.pay;costSum+=O.qty*RES[O.k].price;}}
  ok(true,"наряд · станций с нарядом: "+orders+" из "+list.length+" · средняя оплата "+(orders?Math.round(paySum/orders):0)+" кр при товаре на "+(orders?Math.round(costSum/orders):0)+" кр");
  /* дрон */
  const avgPrice=ORE_KEYS.reduce((a,k)=>a+RES[k].price,0)/ORE_KEYS.length;
  ok(true,"дрон · "+DRONES.miner.ratePerMin+" ед/мин × средняя цена "+Math.round(avgPrice)+" = "+Math.round(DRONES.miner.ratePerMin*avgPrice)+" кр/мин · цена дрона "+DRONES.miner.price+" кр");
  /* наёмник: оклад в минуту только в рейсе, выход 85% — ставка */
  const c=genMerc(7,["haul"]);
  ok(true,"наёмник · оклад "+crewPay(c)+" кр/мин в рейсе · рейс возвращает "+Math.round(CREW_YIELD*100)+"% → ставка −"+Math.round(crewPay(c)*(1-CREW_YIELD))+" кр/мин, выигрыш в хвостах");
  /* управляющие */
  for(const role of MGR_ROLE_KEYS){
    const m=genMgr(11,[role]);
    ok(true,"управляющий · "+MGR_ROLES[role].ru+": оклад "+mgrPay(m)+" кр/мин из доли "+(mgrCut(m)*100).toFixed(1)+"% · из кассы игрока: 0");
  }
}));

TEST_SUITES.push(()=>suite("экономика: расход в минуту из кассы игрока — нулевой",()=>{
  resetWorld();
  G.credits=5000;
  /* управляющий без домена: касса не трогается, он на голом проценте */
  const m=genMgr(5,["keep"]);m.loy=80;m.pool=0;
  G.mgrs=[m];
  const before=G.credits;
  mgrPayroll(m,30);
  eq(G.credits,before,"30 минут без домена — из кассы игрока не списано ничего");
  ok(m.loy<80&&m.loy>60,"лояльность подтаяла мягко: "+m.loy.toFixed(1));
  /* домен принёс — оклад гасится из пула */
  const take=mgrTake(m,4000);
  ok(m.pool>0,"доля легла в пул: "+m.pool);
  const pool0=m.pool;
  mgrPayroll(m,1);
  ok(m.pool<pool0,"оклад взят из пула");
  eq(G.credits,before,"касса игрока по-прежнему не тронута");
  /* наёмник на приколе — бесплатен */
  const c=genMerc(3,["haul"]);c.order={kind:"home",sx:0,sy:0};c.debt=0;c.morale=1;
  G.crew=[c];
  const b2=G.credits;crewPayroll(c,60);
  eq(G.credits,b2,"простой наёмника не стоит ничего");
  G.mgrs=[];G.crew=[];
}));

TEST_SUITES.push(()=>suite("экономика: нужда ×2 на один привоз, потом обычная цена",()=>{
  resetWorld();
  const list=ecoStations(9);
  let S=null,N=null;
  for(const s of list){const n=needOf(s);if(n){S=s;N=n;break;}}
  if(!S){ok(true,"нужды в радиусе 9 сейчас нет — проверка пропущена");return;}
  const base=S.station.prices[N.k];
  const P1=marketFor(S)[N.k];
  ok(P1>=base*1.5,"цена по нужде выше базы заметно: "+P1+" при базе "+base);
  G.cargo[N.k]=(G.cargo[N.k]||0)+5;
  G.log=[];
  const rev=sellCargo(S,N.k,5);
  ok(rev>0,"продали по нужде: "+rev);
  eq(needOf(S),null,"нужда закрыта этим привозом");
  const P2=marketFor(S)[N.k];
  ok(P2<P1,"второй привоз — уже обычная цена: "+P2);
  ok(G.log.some(x=>x.k==="talk"),"в ЛЮДИ легла строка станции");
}));

TEST_SUITES.push(()=>suite("экономика: один наряд на руках, сдаётся адресату, снимается по сроку",()=>{
  resetWorld();
  const list=ecoStations(9);
  let S=null,O=null;
  for(const s of list){const o=orderOf(s);if(o){S=s;O=o;break;}}
  if(!S){ok(true,"нарядов в радиусе 9 сейчас нет — проверка пропущена");return;}
  G.order=null;
  ok(orderTake(S),"наряд взят");
  ok(!!G.order&&G.order.key===S.key,"он на руках");
  ok(!orderTake(S),"второй не дают, пока не закрыт");
  /* не у адресата — не сдаётся */
  G.sx=S.sx;G.sy=S.sy;G.sys=S;
  ok(!orderDeliver(),"у отправителя не сдаётся");
  /* у адресата с товаром — сдаётся и платит */
  const T=getSystem(O.to.sx,O.to.sy);G.sx=T.sx;G.sy=T.sy;G.sys=T;
  G.cargo[O.k]=O.qty;
  const before=G.credits;
  ok(orderDeliver(),"у адресата с товаром сдан");
  eq(G.credits-before,O.pay,"оплата ровно по наряду: "+O.pay);
  eq(G.order,null,"руки свободны");
  /* срок */
  ok(orderTake(S),"взяли снова");
  G.t+= (G.order.due-celDay()+1)*CEL_DAY;
  orderTick();
  eq(G.order,null,"срок вышел — наряд снят без штрафа");
}));

TEST_SUITES.push(()=>suite("экономика: «Вьюк» по разнарядке на обороте 3 000, один раз",()=>{
  resetWorld();
  G.owned={strizh:true};G.home=homeInit();G.things=[];
  earn(2500,"trade");
  ok(!G.owned.vyuk,"на 2 500 оборота ещё нет");
  earn(600,"trade");
  ok(G.owned.vyuk,"на 3 100 — «Вьюк» выделен");
  ok(wearOf("vyuk")>.3,"с чужим износом: "+wearOf("vyuk").toFixed(2));
  ok(G.things.some(t=>t.ru.indexOf("Разнарядка")===0),"бумага на столе");
  G.owned.vyuk=false;earn(1000,"trade");
  ok(!G.owned.vyuk,"второй раз не выделяют");
}));

TEST_SUITES.push(()=>suite("экономика: рынок сытится медленнее — давление держится часами",()=>{
  resetWorld();
  const S=G.sys.station?G.sys:ecoStations(5)[0];
  const k=TRADE_KEYS.find(k=>S.station.prices[k]);
  G.cargo[k]=60;sellCargo(S,k,60);
  const m=G.market[S.key],p0=m.pressure[k];
  ok(p0<0,"после продажи давление отрицательное: "+p0.toFixed(3));
  G.t+=60*1800;   /* полчаса */
  marketFor(S);
  ok(m.pressure[k]<p0*.5,"за полчаса давление ушло меньше чем наполовину: "+m.pressure[k].toFixed(3));
}));
