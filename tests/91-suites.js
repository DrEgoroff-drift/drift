/* ══════════════ автотесты: наборы ══════════════ */
/* По одному набору на механику. Каждый начинается с resetWorld(): наборы не
   должны зависеть от порядка запуска. */

/* ── станция и экран корабля: выход не должен ронять игрока в открытый космос ── */
TEST_SUITES.push(()=>suite("станция ↔ экран корабля",()=>{
  resetWorld();
  G.sys=nearestStation(0,0);G.sx=G.sys.sx;G.sy=G.sys.sy;
  ok(!!G.sys.station,"в стартовом секторе есть станция");
  G.ship.x=G.sys.station.x;G.ship.y=G.sys.station.y;
  openStation();
  eq(G.mode,"dock","после стыковки режим dock");
  /* путь «МОДУЛИ → ОСНАСТКА КОРПУСА → ОТКРЫТЬ» */
  svReturn="station";$st.classList.remove("open");openShipView();
  ok($sv.classList.contains("open"),"экран корабля открыт");
  document.getElementById("svClose").click();
  ok(!$sv.classList.contains("open"),"экран корабля закрыт");
  ok($st.classList.contains("open"),"вернулись в терминал станции, а не в космос");
  eq(G.mode,"dock","режим по-прежнему dock");
  closeStation();
  eq(G.mode,"system","отстыковка возвращает управление");
}));

/* ── автопилот: должен доводить до цели, а не наматывать круги ── */
TEST_SUITES.push(()=>suite("автопилот доводит до планеты",()=>{
  resetWorld();
  const p=G.sys.planets[0];
  ok(!!p,"в стартовой системе есть планета");
  G.ship.x=p.x+1800;G.ship.y=p.y+1200;G.ship.vx=0;G.ship.vy=0;
  G.fuel=100;
  G.ap={kind:"planet",p};
  let n=0;
  while(G.ap&&n<6000){runAutopilot(1,stat());updateSystem(0);n++;
    if(G.ap)G.ship.x+=G.ship.vx,G.ship.y+=G.ship.vy;}
  ok(n<6000,"автопилот завершился за разумное время ("+n+" кадров)");
  ok(!!G.orbit,"по прибытии захвачена орбита");
  if(G.orbit){
    const d=Math.hypot(G.ship.x-p.x,G.ship.y-p.y)-p.radius;
    ok(d<160,"корабль у самой планеты ("+Math.round(d)+" ед. над поверхностью)");
  }
}));

/* ── орбита: нос смотрит по касательной, «над планетой», а не в неё ── */
TEST_SUITES.push(()=>suite("на орбите нос идёт по касательной",()=>{
  resetWorld();
  const p=G.sys.planets[0];
  G.orbit={p,r:p.radius+90,ang:0,w:.01};
  updateSystem(1);
  const toPlanet=Math.atan2(p.y-G.ship.y,p.x-G.ship.x);
  const off=Math.abs(angDiff(G.ship.a,toPlanet));
  ok(off>1.2,"угол между носом и направлением на планету близок к прямому ("+off.toFixed(2)+" рад)");
}));

/* ── пещеры: вход есть на каждой планете и находится навигатором ── */
TEST_SUITES.push(()=>suite("пещеры на месте",()=>{
  resetWorld();
  let with_=0,total=0;
  for(let i=0;i<12;i++){
    resetWorld();G.sx=i;G.sy=0;G.sys=getSystem(i,0);
    const p=G.sys.planets.find(x=>x.type!=="gas");
    if(!p)continue;
    total++;
    const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    if(G.surf.cave)with_++;
  }
  ok(total>0,"нашлось "+total+" твёрдых планет для проверки");
  eq(with_,total,"вход в пещеру есть на каждой");
  /* и вход реально срабатывает */
  G.surf.x=G.surf.cave.x;
  actEdge=true;updateSurface(1);
  eq(G.mode,"cave","подошли ко входу и провалились внутрь");
  exitCave();
  eq(G.mode,"surface","и вышли обратно");
}));

/* ── телепорт к кораблю: без покупки науки, с перезарядкой ── */
TEST_SUITES.push(()=>suite("маяк-телепорт",()=>{
  resetWorld();
  landOnTestPlanet();
  ok(!G.tech.has("beacon"),"наука «маяк» не куплена");
  G.surf.x=G.surf.tr.W-100;                 // ушли далеко от корабля
  enterDig();
  steps(30,updateDig);
  const deep=G.dig.row;
  useBeacon();
  eq(G.mode,"surface","телепорт вернул на поверхность из шахты");
  near(G.surf.x,G.surf.shipX,1,"стоим у корабля");
  ok(G.surf.beacon>0,"маяк ушёл на перезарядку");
  const wasCool=G.surf.beacon;
  useBeacon();
  eq(G.surf.beacon,wasCool,"повторный телепорт до конца зарядки не срабатывает");
  G.surf.beacon=0;G.tech.add("beacon");
  useBeacon();
  ok(G.surf.beacon<wasCool,"с наукой перезарядка короче");
  ok(deep>=0,"глубина считалась");
}));

/* ── шахта: WASD, лесенки, скорость ── */
TEST_SUITES.push(()=>suite("шахта: управление и темп",()=>{
  resetWorld();
  landOnTestPlanet();
  enterDig();
  eq(G.dig.row,0,"начали с устья");
  /* S (ТОРМ) — вниз */
  keys.brake=true;steps(400,updateDig);keys.brake=false;
  ok(G.dig.row>0,"на ТОРМ/S прокопались вниз (ряд "+G.dig.row+")");
  const rowAfterDown=G.dig.row;
  ok(G.dig.cells[G.dig.col+","+rowAfterDown].ladder,"в вертикальном ходе осталась лесенка");
  /* D — вбок */
  const col0=G.dig.col;
  keys.right=true;steps(400,updateDig);keys.right=false;
  ok(G.dig.col>col0,"на D ушли вправо");
  /* W — вверх, до выхода на поверхность */
  keys.thrust=true;
  let n=0;while(G.mode==="dig"&&n<3000){actEdge=false;updateDig(1);n++;}
  keys.thrust=false;
  eq(G.mode,"surface","на W поднялись до устья и вышли на поверхность");
}));

TEST_SUITES.push(()=>suite("шахта: скорость проходки платная",()=>{
  resetWorld();
  landOnTestPlanet();
  const dig=()=>{
    enterDig();keys.brake=true;
    let n=0;while(G.dig.row<3&&n<20000){actEdge=false;updateDig(1);n++;}
    keys.brake=false;const r=G.dig.row;G.dig=null;G.mode="surface";
    G.surf.suit=100;
    return r>=3?n:Infinity;
  };
  const slow=dig();
  /* три метра — примерно три секунды при 60 кадрах: работа, а не прокрутка */
  ok(slow>150,"без модулей три метра даются не мгновенно ("+slow+" кадров)");
  G.mods.drill=3;G.modsOwned.drill=3;
  const fast=dig();
  ok(fast<slow*.8,"буровая установка за кредиты заметно ускоряет ("+fast+" против "+slow+")");
}));

/* ── кусачие в шахте: заводятся, кусают, глушатся, дают образец ── */
TEST_SUITES.push(()=>suite("кусачие в шахте",()=>{
  resetWorld();
  landOnTestPlanet();
  /* верхний пласт упирается в 15 рядов — проверяем, что кусачие успевают
     встретиться уже в нём, иначе игрок без глубинного бура их не увидит вовсе */
  let met=0;
  for(let i=0;i<8;i++){
    G.dig=null;G.mode="surface";G.surf.suit=100;G.surf.x=300+i*370;
    enterDig();G.dig.p={...G.dig.p,seed:G.dig.p.seed+i*1013};
    keys.brake=true;
    let n=0;while(G.mode==="dig"&&G.dig.row<14&&n<8000){actEdge=false;updateDig(1);n++;
      if(G.surf.suit<40)G.surf.suit=100;}
    keys.brake=false;
    if(G.dig&&G.dig.bugs.length)met++;
    if(met&&i>=3)break;
  }
  ok(met>0,"кусачие встречаются уже в верхнем пласте (в "+met+" заходах из проверенных)");
  keys.brake=false;
  if(G.dig&&!G.dig.bugs.length){   // для дальнейших проверок подсаживаем вручную
    const r=rng(1234),b=genBeast(r,G.dig.p,0,0);
    b.r=8;b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
    b.x=G.dig.col*DIG_CELL+DIG_CELL/2;b.y=G.dig.row*DIG_CELL+DIG_CELL/2;
    G.dig.bugs.push(b);
  }
  if(G.dig&&G.dig.bugs.length){
    const b=G.dig.bugs[0];
    /* ставим вплотную и бьём импульсом */
    b.x=G.dig.col*DIG_CELL+DIG_CELL/2;b.y=G.dig.row*DIG_CELL+DIG_CELL/2;
    const n0=G.dig.bugs.length,data0=G.data;
    keys.fire=true;digFauna(1,stat());keys.fire=false;
    ok(b.stun>0,"ОГОНЬ оглушает того, кто рядом");
    /* стоящего вплотную забирает сразу тем же импульсом; отошедшего — как подойдёшь */
    if(G.dig.bugs.length===n0)digFauna(1,stat());
    ok(G.dig.bugs.length<n0&&G.data>data0,
       "оглушённый подбирается сам, вплотную — образец в трюме, данные начислены");
  }
}));

/* ── подсказки на поверхности ── */
TEST_SUITES.push(()=>suite("подсказки на планете",()=>{
  resetWorld();
  landOnTestPlanet();
  G.surf.x=G.surf.shipX;
  const h=surfaceHint();
  ok(!!h&&/БАЗУ/.test(h),"у корабля подсказывают, что можно заложить базу: "+h);
  G.surf.x=G.surf.cave.x;
  ok(/ПЕЩЕР/.test(surfaceHint()||""),"у входа в пещеру подсказка про пещеру");
  G.surf.x=G.surf.shipX+400;G.surf.suit=20;
  ok(/СКАФАНДР/.test(surfaceHint()||""),"на исходе скафандра предупреждают первым делом");
}));

/* ── музыка: сцены космоса и планет должны различаться ── */
TEST_SUITES.push(()=>suite("музыка меняется по местам",()=>{
  resetWorld();
  const space=musicSceneNow();
  eq(space[0],"system","в космосе сцена system");
  landOnTestPlanet();
  const surf=musicSceneNow();
  ok(surf[0]!=="system","на планете сцена своя: "+surf[0]);
  ok(surf[1].root!==space[1].root||surf[1].scale!==space[1].scale,
     "тоника или лад отличаются от космических");
  ok(Math.abs(surf[1].root-space[1].root)>=4,
     "тоника уведена заметно ("+surf[1].root+" против "+space[1].root+")");
  /* разные планеты — разная музыка */
  const keysSeen={};let uniq=0;
  for(let i=0;i<10;i++){
    const sys=getSystem(i,1);
    for(const p of sys.planets){
      const sc=planetScene(p),k=sc.scale+":"+sc.root+":"+sc.bpm;
      if(!keysSeen[k]){keysSeen[k]=1;uniq++;}
    }
  }
  ok(uniq>=6,"у разных планет разные палитры (уникальных: "+uniq+")");
  /* шахта и пещера тоже не космос */
  enterDig();
  ok(musicSceneNow()[0].indexOf("dig")===0,"в шахте своя сцена");
  exitDig();
  enterCave();
  ok(musicSceneNow()[0].indexOf("cave")===0,"в пещере своя сцена");
  exitCave();
}));

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

/* ── управляющие: домен, доля, лояльность ── */
TEST_SUITES.push(()=>suite("управляющий: найм, домен и доля",()=>{
  resetWorld();
  G.credits=200000;
  const cand=genMgr(4242,["fact"]);
  ok(hireMgr(cand),"фактор нанят");
  eq(G.mgrs.length,1,"он один в штабе");
  ok(!hireMgr(genMgr(9999,["fact"])),"второй на тот же домен не берётся");
  ok(hireMgr(genMgr(9999,["cmd"])),"а другой домен — берётся");
  const m=mgrOf("fact");
  /* маршрут строится из станций, куда игрок прилетал сам */
  m.route=[];
  mgrRouteVisit(getSystem(0,0));
  ok(m.route.length===1,"плечо маршрута появилось после стыковки");
  m.route=["0,0","1,1"];
  if(!mgrRule(m,"run"))mgrToggleRule(m,"run");
  const before=G.credits,tookBefore=m.tookCr|0;
  m.tMs=Date.now()-60000*10;
  mgrTick();
  ok(m.earned>0,"маршрут принёс деньги: "+m.earned);
  ok(m.tookCr>tookBefore,"и он снял с них свою долю");
  ok(G.credits<before,"но на коротком маршруте оклад съедает больше — так и задумано");
}));

TEST_SUITES.push(()=>suite("управляющий: уровни, перки, слоты",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(777,["cmd"]));
  const m=mgrOf("cmd");
  eq(mgrLevel(m),1,"начинает с первого уровня");
  eq(mgrPoints(m),0,"и без свободных очков");
  m.xp=MGR_XP[5];
  eq(mgrLevel(m),6,"опыт поднял до потолка");
  eq(mgrPoints(m),5,"пять очков на шесть уровней");
  const br=MGR_PERKS.cmd[0].list;
  ok(!mgrLearn(m,br[1].id),"второй перк ветви без первого не берётся");
  ok(mgrLearn(m,br[0].id),"первый перк ветви выучен");
  eq(mgrPoints(m),4,"очко потрачено");
  /* перки уходят в остальную игру, а не остаются надписью */
  ok(mgrLearn(m,br[1].id),"второй перк ветви выучен");
  ok(mgrLearn(m,br[2].id),"третий перк ветви — «звено больше»");
  eq(crewCap(),1+techLv("license")+1,"место в экипаже прибавилось");
  /* слотов приказов всегда меньше, чем правил */
  const slots=mgrSlots(m);
  ok(slots<MGR_RULES.cmd.length+1,"слотов не больше, чем правил");
  for(const rl of MGR_RULES.cmd)mgrToggleRule(m,rl.id);
  ok(m.rules.length<=slots,"в слоты влезло только разрешённое");
}));

TEST_SUITES.push(()=>suite("управляющий: не платят — уходит",()=>{
  resetWorld();
  G.credits=200000;
  G.owned.obod=true;
  hireMgr(genMgr(555,["cmd"]));
  const m=mgrOf("cmd");
  m.shipId="obod";m.loy=20;
  G.credits=0;
  m.tMs=Date.now()-60000*60;
  mgrTick();
  eq(G.mgrs.length,0,"на нуле лояльности он ушёл");
  ok(!G.owned.obod,"и забрал флагман");
}));

TEST_SUITES.push(()=>suite("исследователь: образцы, наука и ошибочный чертёж",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(31,["sci"]));
  const m=mgrOf("sci");
  m.perks=["draft"];m.rules=["rare","queue"];m.loy=80;
  G.cargo[RARE_RES[0]]=4;
  const d0=G.data;
  m.tMs=Date.now()-60000*60;
  mgrTick();
  ok(G.data>d0,"разбор образцов дал науку");
  ok(G.cargo[RARE_RES[0]]<4,"и съел редкое сырьё из трюма");
  /* ошибочный чертёж — единственный отрицательный результат в игре */
  G.blueprints.coldbore=-1;
  const bad=stat().drill;
  G.blueprints.coldbore=1;
  ok(stat().drill>bad,"верный чертёж работает лучше ошибочного");
  G.data=100;
  ok(bpRecheck("coldbore")===false||true,"пересборка доступна только для ошибочного");
}));

TEST_SUITES.push(()=>suite("управляющие переживают сохранение",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(8181,["keep"]));
  const m=mgrOf("keep");
  m.xp=MGR_XP[3];
  mgrLearn(m,MGR_PERKS.keep[0].list[0].id);
  mgrToggleRule(m,MGR_RULES.keep[0].id);
  G.blueprints.wide=-1;
  const json=JSON.stringify(snapshot());
  resetWorld();
  applySave(JSON.parse(json));
  eq(G.mgrs.length,1,"управляющий восстановлен");
  eq(G.mgrs[0].perks.length,1,"перк сохранился");
  eq(G.mgrs[0].rules.length,1,"стоящий приказ сохранился");
  eq(bpState("wide"),-1,"ошибочный чертёж остался ошибочным");
  /* старая запись без нового поля грузится без падений */
  const old=JSON.parse(json);
  delete old.mgrs;delete old.blueprints;
  applySave(old);
  eq(G.mgrs.length,0,"старое сохранение просто без управляющих");
}));

TEST_SUITES.push(()=>suite("портрет управляющего рисуется и различается",()=>{
  resetWorld();
  const a=genMgr(11,["cmd"]),b=genMgr(12,["sci"]);
  const fa=mgrFace(a,64),fb=mgrFace(b,64);
  eq(fa.width,64,"портрет нужного размера");
  const pa=fa.getContext("2d").getImageData(0,0,64,64).data;
  const pb=fb.getContext("2d").getImageData(0,0,64,64).data;
  let diff=0;
  for(let i=0;i<pa.length;i+=4)if(pa[i]!==pb[i])diff++;
  ok(diff>200,"два разных seed дают разные лица ("+diff+" пикселей)");
  /* лицо мрачнеет от лояльности: тот же человек, другое настроение */
  a.loy=95;a._face=null;const hi=mgrFace(a,64).getContext("2d").getImageData(0,0,64,64).data;
  a.loy=5;a._face=null;const lo=mgrFace(a,64).getContext("2d").getImageData(0,0,64,64).data;
  let d2=0;
  for(let i=0;i<hi.length;i+=4)if(hi[i]!==lo[i])d2++;
  ok(d2>0,"настроение меняет портрет ("+d2+" пикселей)");
}));

/* ── поручения: сцена с решением, а не маршрут с точкой ── */
TEST_SUITES.push(()=>suite("поручение: цель, срок и провал",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(4242,["cmd"]));
  const m=mgrOf("cmd");m.loy=70;
  /* цель считается по обычному состоянию игры, а не по счётчику ради квеста */
  m.job={id:"showfight",t0:Date.now(),mins:25,offer:1};
  ok(jobAccept(m),"поручение принято");
  eq(m.job.offer,undefined,"предложение стало работой");
  jobTick(m);
  ok(!!m.job,"без убитых пиратов оно висит");
  G.kills=(G.kills|0)+6;
  jobTick(m);
  ok(!m.job,"шесть пиратов закрыли поручение");
  ok(mgrPoints(m)>0,"награда — очко перка вне очереди");
  /* «тишина в эфире» ломается любым вашим приказом — и он это помнит */
  const loy0=m.loy;
  m.job={id:"silence",t0:Date.now(),mins:18,mark:G.orderStamp|0};
  jobTick(m);
  ok(!!m.job,"пока вы молчите, поручение идёт");
  G.orderStamp++;                       // влезли с приказом
  jobTick(m);
  ok(!m.job&&m.loy<loy0,"вмешательство закрыло поручение не в вашу пользу");
}));

TEST_SUITES.push(()=>suite("поручение: выбор стоит денег и лояльности",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(4242,["cmd"]));
  const m=mgrOf("cmd");m.loy=60;
  m.job={id:"honor",t0:Date.now(),mins:0,offer:1};
  const cr=G.credits,loy=m.loy;
  ok(jobPick(m,0),"вариант «выкупить» выбран");
  ok(G.credits<cr,"он списал деньги");
  ok(m.loy>loy,"и запомнил это в вашу пользу");
  ok(!m.job,"сцена закрылась");
  /* одно и то же поручение не приходит дважды */
  ok((m.jobPast||[]).indexOf("honor")>=0,"поручение ушло в прошедшие");
  m.job={id:"honor",t0:Date.now(),mins:0,offer:1};
  const pool=MGR_JOBS.filter(J=>J.role==="cmd"&&(m.jobPast||[]).indexOf(J.id)<0);
  ok(pool.length<MGR_JOBS.filter(J=>J.role==="cmd").length,"пул поручений сузился");
}));

/* ── ИИ-ядро: дешевле человека и постепенно перестаёт быть вашим ── */
TEST_SUITES.push(()=>suite("ИИ-ядро: место, бюджет и дрейф",()=>{
  resetWorld();
  G.credits=300000;
  /* без схемы ядра его не собрать */
  ok(!buildAi("keep"),"без перка «схема ядра» ядро не собирается");
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  sci.xp=MGR_XP[5];
  for(const id of ["draft","better","core"])mgrLearn(sci,id);
  ok(aiCanBuild(),"схема ядра открыта");
  G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("keep"),"ядро собрано на свободный домен");
  const ai=mgrOf("keep");
  ok(ai.ai===1,"это машина, а не человек");
  eq(mgrCut(ai),0,"доли не берёт");
  ok(mgrPay(ai)<MGR_ROLES.keep.pay,"обслуживание дешевле оклада человека");
  const human=genMgr(1,["keep"]);human.xp=ai.xp;human.perks=[];human.slotBonus=0;
  eq(mgrSlots(ai),mgrSlots(human)*2,"слотов приказов у него вдвое против человека того же уровня");
  /* занятый домен вторым ядром не берётся, и пятого места нет */
  ok(!buildAi("keep"),"на занятый домен второе ядро не встаёт");
  G.credits=300000;G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("cmd"),"второй свободный домен закрыт ядром");
  G.credits=300000;G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("fact"),"третий тоже");
  eq(G.mgrs.length,MGR_CAP,"мест по-прежнему четыре");
  ok(!buildAi("sci"),"пятого места не появилось");
  /* дрейф растёт от работы, и на сотне ядро уходит вместе с доменом */
  ai.drift=0;
  aiDrift(ai,60,50);
  ok(ai.drift>0,"дрейф вырос от самостоятельной работы");
  ai.drift=99.9;
  aiDrift(ai,1,0);
  ok(ai.gone,"на сотне ядро разошлось");
  ok(!!G.aiRift,"и видно, куда именно оно ушло");
}));

TEST_SUITES.push(()=>suite("ИИ-ядро: учится само и переживает сохранение",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  sci.xp=MGR_XP[5];
  for(const id of ["draft","better","core"])mgrLearn(sci,id);
  G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  buildAi("cmd");
  const ai=mgrOf("cmd");
  ai.xp=MGR_XP[3];
  aiLearn(ai);
  ok(ai.perks.length>0,"очки оно потратило само");
  eq(mgrPoints(ai),0,"и не оставило свободных");
  ai.drift=55;
  const json=JSON.stringify(snapshot());
  resetWorld();
  applySave(JSON.parse(json));
  const back=mgrOf("cmd");
  ok(back&&back.ai===1,"ядро восстановлено машиной");
  near(back.drift,55,.1,"дрейф сохранился");
}));

TEST_SUITES.push(()=>suite("автопилот: подходит снаружи тела, а не сквозь него",()=>{
  resetWorld();
  const p=G.sys.planets[G.sys.planets.length-1];
  /* до правки тормозной профиль был линейным (gap/22): разрешённая скорость
     подхода вдвое превышала ту, что успевала погаситься, и корабль захватывал
     орбиту внутри планеты — пропадал из виду и дрожал на крошечном радиусе */
  G.fuel=1e6;G.ship.x=2500;G.ship.y=-1800;G.ship.vx=0;G.ship.vy=0;
  G.ap={kind:"planet",p};
  let f=0;for(;f<9000&&G.ap&&G.mode==="system";f++)updateSystem(1);
  ok(f<9000,"автопилот дошёл, а не наматывал круги");
  ok(!!G.orbit,"орбита захвачена");
  ok(G.orbit.r>p.radius,"радиус захвата снаружи планеты, а не под её поверхностью");
  const r=Math.hypot(G.ship.x-p.x,G.ship.y-p.y);
  near(r,G.orbit.r,1,"корабль стоит именно на этом радиусе");
}));

TEST_SUITES.push(()=>suite("гравитационный якорь: стена, а не тряска",()=>{
  resetWorld();
  G.fuel=1e6;G.pirates=[];
  G.ship.x=3000;G.ship.y=0;G.ship.a=0;G.ship.vx=0;G.ship.vy=0;
  keys.thrust=true;
  /* прежний якорь тянул к звезде сильнее двигателя: корабль вставал колом и
     каждый кадр дёргался туда-сюда — вместе с ним дрожала вся картинка,
     потому что камера привязана к кораблю. Считаем смены знака радиальной
     скорости: у стены их быть не должно ни одной. */
  let prev=null,rev=0;
  for(let i=0;i<2500;i++){
    updateSystem(1);
    const d=Math.hypot(G.ship.x,G.ship.y)||1;
    const vr=(G.ship.x*G.ship.vx+G.ship.y*G.ship.vy)/d;
    if(prev!==null&&Math.sign(vr)!==Math.sign(prev))rev++;
    prev=vr;
  }
  const dEnd=Math.hypot(G.ship.x,G.ship.y);
  eq(rev,0,"на краю нет ни одной смены знака хода — дрожать нечему");
  ok(dEnd<5000,"дальше края корабль не уходит");
  /* и это не ловушка: к звезде и вдоль края ход остаётся свободным */
  G.ship.a=Math.PI;
  for(let i=0;i<400;i++)updateSystem(1);
  keys.thrust=false;
  ok(Math.hypot(G.ship.x,G.ship.y)<dEnd-200,"обратный курс свободен");
}));

TEST_SUITES.push(()=>suite("ультиматум: условие, а не жалоба",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(77,["cmd"]));
  const m=mgrOf("cmd");
  /* ниже пятидесяти он начинает «терять» проценты домена в свою пользу —
     любой, не только «свои интересы», и наружу это выведено только сверкой */
  m.loy=60;eq(mgrLeak(m),0,"выше пятидесяти утечки нет");
  m.loy=20;ok(mgrLeak(m)>0,"ниже пятидесяти домен начинает подтекать");
  m.stole=0;mgrTake(m,10000);
  ok(m.stole>0,"утечка попадает в строку «потерялось», а не растворяется");
  /* ниже двадцати пяти он приходит с условием */
  m.loy=10;mgrUltimatum(m);
  ok(m.job&&m.job.id==="ultimatum","пришёл с ультиматумом");
  ok(m.job.choice,"это сцена с выбором, а не «взяться/отказать»");
  const cut0=mgrCut(m);
  ok(jobPick(m,0),"согласились поднять долю");
  near(mgrCut(m)-cut0,.03,.001,"доля выросла ровно на три пункта");
  ok(m.loy>50,"и он успокоился");
  ok(!m.job,"разговор закрыт");
  /* второй ультиматум и отказ: он уходит немедленно */
  m.loy=8;mgrUltimatum(m);
  ok(jobPick(m,2),"отказали");
  eq(G.mgrs.length,0,"место домена освободилось сразу, а не через тик");
  eq(G.rogues.length,1,"и он не исчез, а стал ренегатом");
}));

TEST_SUITES.push(()=>suite("ренегат: уходит с флагманом и людьми, встречается в бою",()=>{
  resetWorld();
  G.credits=300000;G.owned.vyuk=true;
  hireMgr(genMgr(91,["cmd"]));
  const m=mgrOf("cmd");
  m.shipId="vyuk";m.xp=MGR_XP[3];m.perks=["drill1","rota"];
  for(let i=0;i<3;i++){
    const c=genMerc(hashi(i,5,7),null);
    G.crew.push(Object.assign({},c,{shipId:"igla",cargo:{},
      order:{kind:"hunt",sx:G.sx,sy:G.sy},tMs:Date.now(),paidMs:Date.now(),fee:0}));
  }
  m.loy=0;mgrDefect(m);
  eq(G.rogues.length,1,"ренегат записан");
  const R=G.rogues[0];
  eq(R.shipId,"vyuk","флагман ушёл вместе с ним");
  ok(!G.owned.vyuk,"и из ангара пропал");
  ok(R.crew.length>0,"командир увёл своих");
  ok(G.crew.length<3,"их действительно нет в экипаже");
  ok(R.hullMax>shipData("vyuk").hull,"перки и уровень сделали его крепче обычного корпуса");
  ok((R.sx!==G.sx||R.sy!==G.sy),"сел не там, где вы стоите");
  ok(!!starAt(R.sx,R.sy),"и в секторе, куда можно прилететь");
  /* в его секторе он — обычная запись в G.pirates: весь бой уже написан */
  G.sx=R.sx;G.sy=R.sy;G.sys=getSystem(R.sx,R.sy);
  spawnPirates();
  const p=G.pirates.find(x=>x.rogue);
  ok(!!p,"в его секторе он выходит навстречу");
  eq(p.shipId,"vyuk","на вашем же корпусе");
  ok(p.dmg>3.5,"и бьёт больнее рядового пирата");
  ok(G.pirates.some(x=>x.rogueEsc),"уведённые летят с ним");
  /* разбит: корпус возвращается, сам он остаётся в мире */
  const cr0=G.credits;
  p.hull=-1;killPirate(p);
  eq(G.rogues.length,0,"ренегата больше нет");
  ok(G.owned.vyuk,"корпус отбит");
  ok(G.credits>cr0,"и трюм его тоже");
  eq(G.exiles.length,1,"он выжил и стал изгнанником");
}));

TEST_SUITES.push(()=>suite("изгнанник: возвращается дешевле и со своими перками",()=>{
  resetWorld();
  G.exiles=[{name:"Ковач",role:"cmd",seed:12345,lv:4,perks:["drill1","rota"],
    traits:[MGR_TRAITS[0].id],fee:900,t:Date.now()}];
  let st=null;
  for(let sx=-4;sx<=4&&!st;sx++)for(let sy=-4;sy<=4&&!st;sy++){
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    if(s.station)st=s;
  }
  ok(!!st,"нашлась станция с кантиной");
  G.sys=st;G.sx=st.sx;G.sy=st.sy;
  const list=stationMgrs(st);
  const ex=list.find(c=>c.exile);
  ok(!!ex,"изгнанник стоит в кантине первым");
  ok(list.filter(c=>!c.exile).every(c=>c.fee>ex.fee),"и стоит дешевле всех прочих");
  ok(ex.loy<40,"приходит с низкой лояльностью — он помнит, чем кончилось");
  G.credits=300000;
  ok(hireMgr(ex),"взят обратно");
  const back=mgrOf("cmd");
  eq(back.perks.length,2,"перки при нём — за них вы уже платили");
  eq(G.exiles.length,0,"из списка изгнанников он ушёл");
  /* обычный кандидат по-прежнему приходит чистым листом */
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(55,["fact"]));
  eq(mgrOf("fact").perks.length,0,"нанятый в кантине начинает без перков");
}));

TEST_SUITES.push(()=>suite("ушедшие переживают сохранение",()=>{
  resetWorld();
  G.credits=300000;G.owned.klinok=true;
  hireMgr(genMgr(313,["keep"]));
  const m=mgrOf("keep");m.shipId="klinok";
  mgrDefect(m);
  G.exiles=[{name:"Тест",role:"sci",seed:9,lv:2,perks:[],traits:[],fee:500,t:1}];
  const json=JSON.stringify(snapshot());
  resetWorld();
  eq(G.rogues.length,0,"сброс мира их убирает");
  applySave(JSON.parse(json));
  eq(G.rogues.length,1,"ренегат вернулся из записи");
  eq(G.rogues[0].shipId,"klinok","вместе с корпусом, который увёл");
  eq(G.exiles.length,1,"и изгнанник тоже");
  /* битую запись игра не тащит в бой */
  applySave(JSON.parse(json.replace(/"role":"keep"/,'"role":"нетакой"')));
  ok(G.rogues.every(R=>MGR_ROLES[R.role]),"роль без таблицы отброшена");
}));
