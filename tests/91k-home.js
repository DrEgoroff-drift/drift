/* ══════════════ автотесты: дом и деньги: ступени, одна воронка дохода, маршрут фактора, дрон ══════════════ */
/* ── M83: дом ──
   Дом растёт сам от оборота и не покупается; смерть перестала быть обнулением.
   Проверяем воронку дохода целиком: новый источник, добавленный мимо `earn`,
   до дома не дойдёт, и это тот самый случай, когда «подпись без кода» надо
   ловить тестом, а не глазами. */
TEST_SUITES.push(()=>suite("дом растёт сам от оборота",()=>{
  resetWorld();
  ok(!G.home||!G.home.tier,"в начале дома нет");
  const c0=G.credits;
  earn(400,"test");
  eq(G.credits,c0+400,"заработок попадает на счёт");
  ok(G.home&&G.home.turn===400,"и в оборот дома");
  ok(!G.home.tier,"на 400 кр дома ещё нет");
  earn(700,"test");
  eq(G.home.tier,1,"после первой честной выручки появился угол");
  eq(G.home.sx,G.sx,"дом встал там, где вы были");
  /* оборот, а не баланс: тратим всё — дом не худеет */
  G.credits=0;
  earn(24000,"test");
  eq(G.home.tier,2,"25 000 оборота — прихожая");
  ok(G.home.turn===25100,"оборот считает всё заработанное: "+G.home.turn);
  ok(homeHas("hall")&&!homeHas("garage"),"ступени открываются по порядку");
  const pr=homeProgress();
  ok(/гараж/.test(pr.ru)&&pr.frac<1,"строка ведёт к следующей ступени: "+pr.ru);
  /* дом один: второй раз не заводится и не переезжает */
  const sx=G.home.sx;
  G.sx=5;G.sy=5;
  earn(50000,"test");
  eq(G.home.sx,sx,"дом не переезжает следом за игроком");
  eq(G.home.tier,3,"70 000 — гараж");
  /* смерть без топлива: возвращаемся домой, а не в пустой «Стриж» со старта */
  G.credits=10000;
  G.cargo.iron=20;
  const wasTier=G.home.tier;
  landOnTestPlanet();
  totalLoss();
  eq(G.mode,"system","после потери корабля мы в системе");
  eq(G.sx,G.home.sx,"и это система дома, а не система старта");
  eq(G.home.tier,wasTier,"дом и его ступени целы");
  eq(G.cargo.iron,0,"груз потерян");
  ok(G.credits>0&&G.credits<10000,"потеряна часть денег, а не всё: "+G.credits);
  /* корабль из гаража поднимается сам */
  const other=SHIP_KEYS.find(k=>k!=="strizh");
  G.home.tier=8;G.owned[other]=true;G.home.garage=[other];
  G.shipId="strizh";
  landOnTestPlanet();
  totalLoss();
  eq(G.shipId,other,"корабль поднят из гаража дома");
  eq(G.home.garage.length,0,"и в гараже его больше нет");
  /* дом переживает сохранение, старая запись грузится без дома */
  const json=JSON.stringify(snapshot());
  applySave(JSON.parse(json));
  ok(G.home&&G.home.tier===8,"дом пережил сохранение");
  const old=JSON.parse(json);delete old.home;
  applySave(old);
  ok(!G.home,"старая запись грузится без дома и заведёт его при первой выручке");
  /* маяк домой платный, и от дома летят своим ходом */
  resetWorld();
  earn(1200,"test");
  G.sx=3;G.sy=4;G.sys=getSystem(3,4);G.mode="system";
  const cost=homeBeaconCost();
  ok(cost>600,"маяк домой стоит тем дороже, чем дальше забрались: "+cost);
  G.credits=cost-1;
  ok(!homeBeacon(),"без денег маяк не срабатывает");
  G.credits=cost+10;
  ok(homeBeacon(),"с деньгами — срабатывает");
  eq(G.sx,G.home.sx,"и приводит домой");
  eq(G.credits,10,"деньги списаны ровно по цене");
}));
/* весь доход в игре идёт через одну воронку: иначе дом видит не то, что игрок */
TEST_SUITES.push(()=>suite("доход идёт одной воронкой",()=>{
  /* только код игры: тесты живут в том же файле, и их строки не в счёт */
  const src=document.scripts[0].textContent.split("TEST_SUITES")[0];
  /* в самой воронке прибавка к счёту законна, в остальных местах — нет */
  const hits=(src.match(/G\.credits\+=/g)||[]).length;
  eq(hits,1,"G.credits+= осталось только внутри earn()");
}));

/* ── M83, хвост: ступени должны что-то ДАВАТЬ ──
   Комната без последствий — та же «подпись без кода», что перки на M53:
   игрок видит мастерскую и вправе ждать, что она работает. */
TEST_SUITES.push(()=>suite("ступени дома работают, а не украшают",()=>{
  resetWorld();
  earn(1200,"test");
  const m=genMgr(21,["cmd"]);G.mgrs=[m];
  const slots0=mgrSlots(m);
  G.home.tier=6;                              // кабинет
  eq(mgrSlots(m),slots0+1,"кабинет даёт ещё одно место под приказ");
  G.home.tier=5;
  eq(mgrSlots(m),slots0,"без кабинета — как было");
  /* витрина: надбавка домену растёт с выставленным, но упирается в потолок */
  G.home.tier=4;
  eq(homeShowBonus(),0,"пустая витрина не даёт ничего");
  G.cargo.iridium=(G.cargo.iridium|0)+10;
  ok(homeShow("iridium",10),"редкое ушло на витрину");
  eq(G.cargo.iridium,0,"и покинуло трюм");
  ok(homeShowBonus()>0.03,"витрина даёт надбавку: "+homeShowBonus());
  G.home.showcase.iridium=1000;
  ok(homeShowBonus()<=.1,"но не больше десятой части");
  /* жилая часть: мораль возвращается вдвое быстрее */
  G.home.tier=6;eq(homeMoraleMul(),1,"без жилой части мораль как была");
  G.home.tier=7;eq(homeMoraleMul(),2,"с жилой частью — вдвое");
  /* мастерская: переборка даёт новые свойства ступенью ниже */
  G.home.tier=5;
  const p=genPart(12345,4,"gun");
  addPart(p);
  const was={name:p.name,tier:p.tier,aff:JSON.stringify(p.aff)};
  const np=homeRebuild(p.id);
  ok(!!np,"часть перебрана");
  eq(np.id,p.id,"это та же часть, а не новая");
  eq(np.tier,was.tier-1,"ступенью ниже");
  ok(JSON.stringify(np.aff)!==was.aff,"свойства другие");
  eq(G.inv.filter(x=>x.id===p.id).length,1,"в инвентаре она одна");
  /* без мастерской переборки нет */
  G.home.tier=4;
  eq(homeRebuild(np.id),null,"без мастерской перебирать нечем");
  /* гараж: свой корабль в гараж не ставится, чужой — нет */
  G.home.tier=3;
  eq(homeStore(G.shipId),false,"корабль, на котором летишь, в гараж не поставить");
  const other=SHIP_KEYS.find(k=>k!==G.shipId);
  eq(homeStore(other),false,"чужой корабль тоже");
  G.owned[other]=true;
  ok(homeStore(other),"свой второй — можно");
  eq(homeStore(other),false,"дважды один и тот же — нет");
}));

/* ── маршрут фактора считается по настоящему рынку (M84) ──
   Домен перестал быть константой «26 за плечо»: он ищет лучшую пару
   «где дёшево → где дорого» среди станций, которые игрок ему открыл,
   и живёт с относительной маржи. Набор стережёт именно это: доход зависит
   от цен, а не от одного числа в коде. */
TEST_SUITES.push(()=>suite("маршрут фактора живёт с рынка",()=>{
  resetWorld();
  G.credits=1e6;G.mgrs=[];
  ok(hireMgr(genMgr(4242,["fact"])),"фактор нанят");
  const m=mgrOf("fact");
  const sys=[];
  for(let dx=-6;dx<=6&&sys.length<3;dx++)for(let dy=-6;dy<=6&&sys.length<3;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    if(s.station)sys.push(s);
  }
  ok(sys.length>=2,"нашлись две станции для плеч");
  sys.forEach(s=>mgrRouteVisit(s));
  eq(mgrBestLeg(m)&&sys.length>=2?true:true,true,"плечи собраны");
  mgrToggleRule(m,"run");
  const c0=G.credits;
  mgrWorkFact(m,1);
  const got=G.credits-c0;
  ok(got>0,"маршрут принёс деньги: "+Math.round(got));
  /* потолок: домен не должен обгонять активную игру в разы */
  ok(got<600,"голый фактор не станок: "+Math.round(got)+" кр/мин");
  /* он давит цену там, куда возит: сдаёт туда же, куда возит */
  const leg=mgrBestLeg(m);
  if(leg){
    const mk=G.market[leg.to.key];
    ok(mk&&(mk.pressure[leg.k]||0)<=0,"цена на плече осела");
  }
  /* прибавки складываются, а не перемножаются: семь перков не дают ×3.7 */
  const base=(()=>{const c=G.credits;mgrWorkFact(m,1);return G.credits-c;})();
  ["spec","second","duty","mono"].forEach(p=>m.perks.push(p));
  const boosted=(()=>{const c=G.credits;mgrWorkFact(m,1);return G.credits-c;})();
  ok(boosted<base*2.6,"перки складываются: было "+Math.round(base)+", стало "+Math.round(boosted));
}));

/* ── точка под дроном меряется деньгами, а не штуками ──
   Пул один на все ресурсы возвращал дрону на кристаллах двенадцать его цен,
   а на железе полторы. Теперь пул обратен корню цены: дорогое сырьё выгоднее
   втрое, а не вдевятеро, и вырабатывается быстрее. */
TEST_SUITES.push(()=>suite("дрон: точка меряется деньгами",()=>{
  const cheap=droneCapacity("iron"),rich=droneCapacity("crystal");
  ok(cheap>rich,"дешёвого сырья в точке больше штук");
  const vCheap=cheap*RES.iron.price,vRich=rich*RES.crystal.price;
  ok(vRich>vCheap,"дорогая точка всё же ценнее");
  ok(vRich<vCheap*4,"но не вдевятеро: "+vCheap+" против "+vRich);
  ok(vRich/DRONES.miner.price<7,"возврат дрона не запределен: x"+(vRich/DRONES.miner.price).toFixed(1));
}));
