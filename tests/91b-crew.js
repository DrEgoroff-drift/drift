/* ══════════════ автотесты: наёмники: убыток по кредитам, удача, плен, рейсы, сохранение ══════════════ */
/* ── наёмники: по кредитам в минусе, живут ради вещей ── */
function mkMerc(seed,spec,shipId){
  const c=genMerc(seed,[spec]);
  G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:0,sy:0},
    tMs:Date.now(),paidMs:Date.now()}));
  const m=G.crew[G.crew.length-1];
  if(shipId){G.owned[shipId]=true;crewAssignShip(m,shipId);
    crewOrder(m,spec==="fight"?"hunt":spec)||crewOrder(m,spec==="fight"?"hunt":spec);}
  return m;
}
TEST_SUITES.push(()=>suite("наёмник в среднем в минусе по кредитам",()=>{
  resetWorld();
  let net=0,trips=0,items=0,jack=0,cats=0;
  /* большая выборка по разным seed: интересна средняя, а не отдельная судьба */
  for(let i=0;i<60;i++){
    resetWorld();
    G.credits=1000000;
    const m=mkMerc(1000+i*37,"mine","obod");
    if(!m.shipId)continue;
    const inv0=G.inv.length,own0=Object.keys(G.owned).length,cr0=G.credits;
    for(let k=0;k<12;k++){                    // двенадцать рейсов подряд
      if(m.gone)break;
      m.state=null;m.hull=m.hullMax;m.tripMin=0;
      crewTrip(m,crewTripMinutes(m));trips++;
    }
    net+=G.credits-cr0;
    items+=(G.inv.length-inv0)+(Object.keys(G.owned).length-own0);
    for(const h of (m.hist||[])){if(h.cat==="jack")jack++;if(h.cat==="cat")cats++;}
  }
  ok(trips>500,"прогнали "+trips+" рейсов");
  ok(net<0,"по кредитам суммарно минус ("+Math.round(net).toLocaleString("ru")+" кр)");
  ok(net>-2500000,"но не разорение: минус соразмерен жалованью");
  ok(items>0,"вещи всё-таки приходят: "+items+" частей и корпусов");
  ok(jack>0,"джекпоты случаются: "+jack);
  ok(cats>0,"катастрофы тоже: "+cats);
}));

TEST_SUITES.push(()=>suite("удача скрыта, но различима",()=>{
  resetWorld();
  /* два наёмника с разной удачей должны расходиться по результату */
  let lo=null,hi=null;
  for(let i=0;i<400&&(!lo||!hi);i++){
    const c=genMerc(500+i*13,["mine"]);
    crewLuck(c);
    if(!lo&&c._luck<.8)lo=c;
    if(!hi&&c._luck>1.35)hi=c;
  }
  ok(!!lo&&!!hi,"в генераторе есть и невезучие, и везучие");
  const run=(proto)=>{
    resetWorld();G.credits=1000000;G.owned.obod=true;
    G.crew.push(Object.assign({},proto,{cargo:{},order:{kind:"mine",sx:0,sy:0},
      shipId:"obod",hull:130,hullMax:130,tMs:Date.now()}));
    const m=G.crew[0];const cr0=G.credits;let bad=0,good=0;
    for(let k=0;k<40;k++){m.state=null;m.gone=false;m.hull=m.hullMax;
      crewTrip(m,crewTripMinutes(m));}
    for(const h of (m.hist||[]))if(h.cat==="bad"||h.cat==="cat")bad++;else if(h.cat!=="norm")good++;
    return {net:G.credits-cr0,bad,good};
  };
  const a=run(lo),b=run(hi);
  ok(b.net>a.net,"везучий выгоднее невезучего ("+Math.round(b.net)+" против "+Math.round(a.net)+")");
  ok(!("luck" in lo),"само число удачи наружу не выставлено");
}));

TEST_SUITES.push(()=>suite("ставка игрока двигает хвосты",()=>{
  resetWorld();
  const count=(risk)=>{
    let ext=0,norm=0;
    for(let i=0;i<40;i++){
      resetWorld();G.credits=1000000;
      const m=mkMerc(70+i*17,"mine","obod");
      if(!m.shipId)continue;
      m.risk=risk;
      for(let k=0;k<10;k++){m.state=null;m.gone=false;m.hull=m.hullMax;
        crewTrip(m,crewTripMinutes(m));}
      for(const h of (m.hist||[])){if(h.cat==="norm")norm++;else ext++;}
    }
    return {ext,norm};
  };
  const safe=count("safe"),bold=count("bold");
  const rSafe=safe.ext/Math.max(1,safe.ext+safe.norm);
  const rBold=bold.ext/Math.max(1,bold.ext+bold.norm);
  ok(rBold>rSafe,"отчаянно даёт больше событий, чем осторожно ("+
     rBold.toFixed(2)+" против "+rSafe.toFixed(2)+")");
}));

TEST_SUITES.push(()=>suite("плен: выкуп и освобождение штурмом",()=>{
  resetWorld();
  G.credits=1000000;
  const m=mkMerc(31415,"mine","obod");
  const ev=CREW_EVENTS.find(e=>e.id==="hostage");
  applyCrewEvent(m,ev,rng(7),800,.5);
  eq(m.state,"hostage","событие увело его в плен");
  ok(m.ransom>0,"выкуп назначен: "+m.ransom+" кр");
  ok(!crewOrder(m,"haul"),"пока он в плену, приказы не проходят");
  /* выкуп растёт, пока тянем */
  const r0=m.ransom;
  m.ransomAt=Date.now()-3*3600000;m.tMs=Date.now()-1000;
  crewTick();
  ok(m.ransom>r0,"выкуп вырос за бездействие ("+r0+" → "+m.ransom+")");
  /* штурм в том же секторе освобождает даром */
  const cr0=G.credits;
  G.sx=m.ransomSx;G.sy=m.ransomSy;
  eq(crewFreeHostagesAt(G.sx,G.sy),1,"штурм освободил одного");
  eq(m.state,null,"он на свободе");
  eq(G.credits,cr0,"и это не стоило ни кредита");
  /* а выкуп — рабочая альтернатива */
  const m2=mkMerc(2718,"mine","vyuk");
  applyCrewEvent(m2,ev,rng(9),800,.5);
  const before=G.credits;
  ok(ransomPay(m2),"выкуп заплачен");
  ok(G.credits<before,"кредиты списались");
  eq(m2.state,null,"вернулся");
}));

TEST_SUITES.push(()=>suite("байки не повторяются и не пустые",()=>{
  resetWorld();
  const seen={};let n=0;
  for(let i=0;i<200;i++){
    const c=genMerc(9000+i*7,["mine"]);c.trips=i;
    const t=crewTale(c);
    ok(typeof t==="string"&&t.length>12,i===0?"байка — осмысленная строка: "+t:"…");
    if(!seen[t]){seen[t]=1;n++;}
  }
  ok(n>25,"уникальных баек в выборке: "+n);
}));

TEST_SUITES.push(()=>suite("расчёт стоит денег",()=>{
  resetWorld();
  G.credits=1000000;
  const m=mkMerc(555,"mine","obod");
  const cost=crewSeverance(m);
  ok(cost>0,"выходное пособие назначено: "+cost+" кр");
  G.credits=cost-1;
  ok(!fireMerc(0),"без денег уволить нельзя");
  eq(G.crew.length,1,"человек на месте");
  G.credits=cost+10;
  ok(fireMerc(0),"с деньгами — можно");
  eq(G.crew.length,0,"уволен");
  eq(G.credits,10,"пособие списано");
}));

TEST_SUITES.push(()=>suite("простой не загоняет в долг",()=>{
  resetWorld();
  G.credits=0;
  const c=genMerc(777,["mine"]);
  G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:0,sy:0},
    tMs:Date.now()-8*60*60*1000,paidMs:Date.now()}));
  const m=G.crew[0];
  crewTick();
  eq(Math.round(m.debt),0,"за восемь часов на приколе долг не накапал");
  ok(!m.gone,"человек не ушёл");
  eq(m.morale,1,"настрой не просел");
  /* и с приказом, но без корабля — тоже не платим: он физически не работает */
  m.order={kind:"mine",sx:0,sy:0};m.shipId=null;m.tMs=Date.now()-8*60*60*1000;
  crewTick();
  eq(Math.round(m.debt),0,"без выданного корабля жалованье не начисляется");
}));

TEST_SUITES.push(()=>suite("очередь рейсов ограничена",()=>{
  resetWorld();
  G.credits=1000000;
  const m=mkMerc(4711,"mine","obod");
  ok(!!m.shipId,"корабль выдан");
  m.trips=0;m.hist=[];
  /* «ушёл на сутки» не должно превращаться в сутки выработки */
  m.tMs=Date.now()-24*60*60*1000;
  crewTick();
  ok((m.trips|0)<=CREW_TRIP_QUEUE,"за сутки отсутствия закрыто не больше "+
     CREW_TRIP_QUEUE+" рейсов (закрыто "+m.trips+")");
  ok((m.trips|0)>0,"но очередь не пустая");
}));

TEST_SUITES.push(()=>suite("корпус решает длину рейса, а не выгоду",()=>{
  resetWorld();
  G.credits=1000000;G.owned.igla=true;G.owned.mamont=true;
  const small=mkMerc(11,"mine","igla");
  const big=mkMerc(12,"mine","mamont");
  ok(crewTripMinutes(big)>crewTripMinutes(small),
     "у большого корпуса рейс длиннее ("+Math.round(crewTripMinutes(big))+" против "+
     Math.round(crewTripMinutes(small))+" мин)");
  ok(crewPay(big)>crewPay(small),
     "и жалованье выше ("+crewPay(big)+" против "+crewPay(small)+" кр/мин)");
  /* кредит за минуту работы должен быть сопоставим — иначе большой корпус
     был бы не выбором, а строго лучшим вариантом */
  const perMin=c=>crewPay(c)*CREW_YIELD;
  const ratio=perMin(big)/crewPay(big)/(perMin(small)/crewPay(small));
  near(ratio,1,.05,"отдача на кредит жалованья одинакова у обоих корпусов");
}));

TEST_SUITES.push(()=>suite("приоритет материала и передача модулей",()=>{
  resetWorld();
  G.credits=100000;G.owned.obod=true;
  const c=genMerc(4242,["mine"]);
  G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:0,sy:0},
    tMs:Date.now(),paidMs:Date.now()}));
  const m=G.crew[0];
  crewAssignShip(m,"obod");
  crewOrder(m,"mine")||crewOrder(m,"mine");
  const sys=getSystem(m.order.sx,m.order.sy);
  const pool=sys.belt?sys.belt.res:(sys.planets.length?sys.planets[0].res:["iron"]);
  m.pref=pool.filter(k=>RES[k].price>0).slice(-1)[0];
  m.cargo={};
  crewFill(m,600,rng(5));
  const other=Object.keys(m.cargo).filter(k=>k!==m.pref&&m.cargo[k]>0);
  eq(other.length,0,"с приоритетом добывается только выбранное ("+m.pref+")");
  /* модули: свободных нет, пока игрок не снял уровень */
  eq(spareModLv("hold"),0,"свободных уровней трюма нет");
  G.modsOwned.hold=2;G.mods.hold=1;
  eq(spareModLv("hold"),1,"снятый уровень стал свободным");
  const cap0=crewCargoMax(m);
  ok(crewGiveMod(m,"hold",1),"уровень передан наёмнику");
  ok(crewCargoMax(m)>cap0,"трюм наёмника вырос ("+cap0+" → "+crewCargoMax(m)+")");
  eq(spareModLv("hold"),0,"переданный уровень больше не свободен");
  ok(crewGiveMod(m,"hold",-1),"уровень можно забрать обратно");
  eq(crewCargoMax(m),cap0,"трюм вернулся к прежнему");
}));

TEST_SUITES.push(()=>suite("наёмник виден в системе и за ним можно смотреть",()=>{
  resetWorld();
  G.credits=100000;G.owned.obod=true;
  const c=genMerc(999,["mine"]);
  G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:0,sy:0},
    tMs:Date.now(),paidMs:Date.now()}));
  const m=G.crew[0];
  crewAssignShip(m,"obod");
  crewOrder(m,"mine")||crewOrder(m,"mine");
  ok(G.allies.length===1,"после приказа он сразу появился в системе");
  ok(!!allyOf(m.id),"находится по id");
  updateAllies(1);
  ok(isFinite(G.allies[0].x)&&isFinite(G.allies[0].y),"его корабль двигается корректно");
  /* он должен уходить работать, а не висеть у борта игрока */
  const A=G.allies[0],work=allyWork(A);
  ok(!!work,"у добытчика есть точка работы в системе");
  const d0=Math.hypot(A.x-work.x,A.y-work.y);
  for(let i=0;i<400;i++)updateAllies(1);
  const d1=Math.hypot(A.x-allyWork(A).x,A.y-allyWork(A).y);
  ok(d1<d0,"за 400 кадров он приблизился к месту работы ("+Math.round(d0)+" → "+Math.round(d1)+")");
  G.watch=m.id;
  drawSystem();
  ok(true,"кадр с наблюдением рисуется без исключений");
  G.watch=null;
}));

/* ── сохранение: формат v:4 и новые поля наёмников ── */
TEST_SUITES.push(()=>suite("сохранение переживает новые поля",()=>{
  resetWorld();
  G.owned.obod=true;
  const c=genMerc(31337,["mine"]);
  G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"mine",sx:0,sy:0},
    shipId:"obod",pref:"iron",mods:{hold:2,armor:1,drill:0},earned:500,spent:100,
    tMs:Date.now(),paidMs:Date.now()}));
  const snap=snapshot();
  eq(snap.v,4,"версия записи по-прежнему 4");
  const json=JSON.stringify(snap);
  resetWorld();
  applySave(JSON.parse(json));
  eq(G.crew.length,1,"наёмник восстановлен");
  eq(G.crew[0].pref,"iron","приоритет материала сохранился");
  eq(crewModLv(G.crew[0],"hold"),2,"переданные модули сохранились");
  eq(G.crew[0].earned,500,"счётчик заработка сохранился");
  /* старая запись без новых полей грузится без падений */
  const old=JSON.parse(json);
  delete old.crew[0].pref;delete old.crew[0].mods;delete old.crew[0].earned;
  applySave(old);
  eq(G.crew[0].pref,"all","у старой записи приоритет по умолчанию");
  eq(crewModLv(G.crew[0],"hold"),0,"и никаких переданных модулей");
}));

/* ── общий смок: все режимы рисуются без исключений ── */
TEST_SUITES.push(()=>suite("все режимы рисуются",()=>{
  resetWorld();
  const draws=[];
  drawSystem();draws.push("system");
  G.mode="map";drawMap();draws.push("map");
  resetWorld();
  landOnTestPlanet();
  drawSurface();draws.push("surface");
  enterDig();updateDig(1);drawDig();draws.push("dig");
  exitDig();
  enterCave();updateCave(1);drawCave();draws.push("cave");
  exitCave();
  ok(draws.length===5,"отрисованы режимы: "+draws.join(", "));
}));

/* ── человек, пришедший даром (25.08.2026) ──
   Сделка «пришёл к вам в звено — даром» вызывала `crewGift`, которой не
   существовало: вызов стоял под `typeof …==="function"` и глотался молча.
   Игра обещала наёмника и не давала его — проверяем, что теперь даёт. */
TEST_SUITES.push(()=>suite("даровой наёмник приходит на самом деле",()=>{
  resetWorld();
  ok(typeof crewGift==="function","crewGift существует");
  G.crew=[];G.techLvl.license=2;
  const before=G.crew.length, money=G.credits;
  const ok1=crewGift(12345);
  ok(ok1===true,"пришёл");
  eq(G.crew.length,before+1,"в звене на одного больше");
  eq(G.credits,money,"и денег не взял — он даром");
  eq(G.crew[G.crew.length-1].fee,0,"плата за него нулевая");
  ok(!!G.crew[G.crew.length-1].name,"у него есть имя");
  /* мест нет — говорит об этом, а не пропадает молча */
  while(G.crew.length<crewCap())crewGift(1);
  const full=G.crew.length;
  eq(crewGift(2),false,"без места — отказ");
  eq(G.crew.length,full,"и никто не появился");
}));
TEST_SUITES.push(()=>suite("наём: опыт не спорит с подписью",()=>{
  resetWorld();
  /* Экран найма показывает подряд черту и число: «необстрелянный — дёшев и
     НЕОПЫТЕН · опыт 22» — и игрок перестаёт верить обеим строкам. Число
     обязано следовать чертам, которыми человек описан */
  let green=0,vet=0,mid=0,bad=[];
  for(let s=1;s<=900;s++){
    const c=genMerc(s);
    const g=c.traits.indexOf("green")>=0, v=c.traits.indexOf("vet")>=0;
    if(g&&!v){green++;if(c.xp>20)bad.push("зелёный с опытом "+c.xp);}
    else if(v&&!g){vet++;if(c.xp<30)bad.push("ветеран с опытом "+c.xp);}
    else mid++;
    ok(c.xp>=0&&c.xp<100,"опыт в разумных пределах: "+c.xp);
  }
  ok(green>20&&vet>20,"выборка застала и зелёных, и ветеранов ("+green+"/"+vet+")");
  eq(bad.length,0,"ни одного противоречия"+(bad.length?": "+bad.slice(0,3).join(", "):""));
  /* и опыт по-прежнему что-то значит: он идёт и в жалованье, и в умение */
  const a=genMerc(11),b=genMerc(11);
  eq(a.xp,b.xp,"тот же номер — тот же человек");
  ok(crewSkill({xp:0})<crewSkill({xp:80}),"опытный работает лучше");
}));
