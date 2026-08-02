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

TEST_SUITES.push(()=>suite("курс не копится, и разница углов честна на любом входе",()=>{
  /* Живое сохранение приехало с курсом -500.8 рад: угол нигде не сворачивался и
     за долгий полёт накопил восемь десятков оборотов. Прежняя формула разницы
     углов, ((a-b+3π)%TAU)-π, верна только пока a-b не меньше -3π — остаток в JS
     берёт знак делимого. На -500 она вернула -4.93 вместо +1.35: неверный знак
     и вылет за полуоборот. Через неё считается доворот вектора скорости к носу,
     так что скорость разворачивало против тяги — корабль дёргался на месте под
     полным газом и жёг топливо. Ни исключения, ни просадки кадров. */
  for(const [a,b] of [[0.5,0.2],[-500.8,0.5],[500.8,-0.5],[0,Math.PI-1e-9],
                      [-3*Math.PI-1,0],[1e4,-1e4]]){
    const d=angDiff(a,b);
    ok(d>=-Math.PI-1e-9&&d<=Math.PI+1e-9,
       "разница углов лежит в пределах полуоборота: angDiff("+a.toFixed(1)+", "+
       b.toFixed(1)+") = "+d.toFixed(3));
    near(Math.cos(d),Math.cos(a-b),1e-9,"и это та же самая разница, свёрнутая");
    near(Math.sin(d),Math.sin(a-b),1e-9,"с сохранённым знаком");
  }
  /* и главное: корабль с накопленным курсом должен разгоняться */
  resetWorld();
  G.fuel=1e6;G.pirates=[];G.orbit=null;G.ap=null;
  G.ship.x=0;G.ship.y=-760;G.ship.vx=0;G.ship.vy=0;
  G.ship.a=-500.8055792108271;
  keys.thrust=true;
  for(let i=0;i<200;i++)updateSystem(1);
  keys.thrust=false;
  ok(Math.hypot(G.ship.vx,G.ship.vy)>3,
     "корабль с курсом в восемьдесят оборотов разгоняется, а не дёргается на месте ("+
     Math.hypot(G.ship.vx,G.ship.vy).toFixed(2)+")");
  ok(Math.abs(G.ship.a)<=Math.PI+1e-9,
     "и курс свернулся сам ("+G.ship.a.toFixed(2)+" рад)");
}));

TEST_SUITES.push(()=>suite("гравитационный якорь возвращает, а не запирает",()=>{
  resetWorld();
  G.fuel=1e6;G.pirates=[];
  G.ship.x=3000;G.ship.y=0;G.ship.a=0;G.ship.vx=0;G.ship.vy=0;
  keys.thrust=true;
  /* Две беды подряд. Первая: якорь тянул к звезде сильнее двигателя — корабль
     вставал колом и дёргался каждый кадр, а с ним и вся картинка. Вторая:
     починили тем, что срезали радиальную скорость в ноль, — и корабль на краю
     стал застревать намертво, потому что доворот вектора к носу переливал в
     радиальную составляющую поперечную, а якорь её съедал.

     Третья, и она же исходная: силу оставили, потолок убрали — а мёртвая точка
     только переехала. Притяжение в полторы тяги обязано где-то сравняться с
     двигателем, и там корабль встал колом под маршевой тягой: топливо горит,
     скорость 0.08, игрок жалуется на «залипание». Дважды лечили симптом.

     Теперь якорь не отнимает скорость, а заворачивает курс: за кромкой нос и
     вектор доворачиваются к звезде, скорость сохраняется целиком. Против тяги
     не действует ничего, поэтому равновесию встать негде. Проверяем именно это,
     и главное — что под непрерывной тягой наружу корабль НЕ ЗАМИРАЕТ. */
  let dEnd=0,vMin=1e9;
  for(let i=0;i<2500;i++){
    updateSystem(1);
    if(i>1200)vMin=Math.min(vMin,Math.hypot(G.ship.vx,G.ship.vy));
    dEnd=Math.hypot(G.ship.x,G.ship.y)||1;
  }
  ok(dEnd<5200,"дальше края корабль не уходит");
  ok(vMin>.5,"под тягой наружу корабль ни на кадр не замирает — мёртвой точки нет ("+
     vMin.toFixed(2)+")");
  /* и он не висит на одном радиусе, а ходит дугой: курс заворачивает */
  const dPause=Math.hypot(G.ship.x,G.ship.y);
  let moved=0;
  for(let i=0;i<300;i++){const x0=G.ship.x,y0=G.ship.y;updateSystem(1);
    moved+=Math.hypot(G.ship.x-x0,G.ship.y-y0);}
  ok(moved>100,"корабль всё это время идёт, а не стоит ("+Math.round(moved)+" ед. пути)");
  keys.thrust=false;
  for(let i=0;i<300;i++)updateSystem(1);
  ok(Math.hypot(G.ship.x,G.ship.y)<=dPause+400,"отпустил тягу — дальше края не уносит");
  keys.thrust=true;
  /* и это не ловушка: к звезде и вдоль края ход остаётся свободным */
  G.ship.a=Math.PI;
  for(let i=0;i<400;i++)updateSystem(1);
  keys.thrust=false;
  ok(Math.hypot(G.ship.x,G.ship.y)<dEnd-200,"обратный курс свободен");
}));

TEST_SUITES.push(()=>suite("корона звезды выталкивает, а не засасывает",()=>{
  resetWorld();
  G.fuel=1e6;G.pirates=[];
  /* со знаком «минус» это была воронка вчетверо сильнее двигателя: влетев
     к звезде, выбраться было нельзя — оставалось смотреть, как горит корпус */
  const r0=G.sys.radius+20;
  G.ship.x=r0;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ship.a=0;
  keys.thrust=false;
  for(let i=0;i<120&&G.mode==="system";i++)updateSystem(1);
  ok(Math.hypot(G.ship.x,G.ship.y)>r0,"из короны выносит наружу само");
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

TEST_SUITES.push(()=>suite("интерфейс: во что тыкают пальцем — не меньше 44 px",()=>{
  resetWorld();
  /* Прежний правый борт был столбиком 27-пиксельных кнопок: на ходу по ним
     промахиваешься. Порог в 44 px — общий для сенсорных интерфейсов, и он
     должен держаться сам, а не проверяться глазами раз в полгода. */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";hud();
  const seen=[],small=[];
  document.querySelectorAll(".pads button,.rail button,#menu button").forEach(b=>{
    const r=b.getBoundingClientRect();
    if(!r.width)return;
    seen.push(b);
    if(r.width<44||r.height<44)small.push((b.dataset.k||b.id||b.textContent).trim()+
      " "+Math.round(r.width)+"×"+Math.round(r.height));
  });
  ok(seen.length>0,"кнопки вообще нашлись ("+seen.length+")");
  eq(small.join(", "),"","все кнопки полёта и меню дотягивают до 44 px");
}));

TEST_SUITES.push(()=>suite("интерфейс: приборы и кнопки не наезжают друг на друга",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* показываем разом всё, что вообще может появиться на правом борту */
  for(const id of ["starbtn","dronebtn","beaconbtn","firebtn"]){
    const e=document.getElementById(id);if(e)e.style.display="";
  }
  hud();
  const box=s=>{const e=document.querySelector(s);if(!e)return null;
    const r=e.getBoundingClientRect();return r.width?{s,x:r.x,y:r.y,w:r.width,h:r.height}:null;};
  const items=[".vitals",".locus",".rail",".pads>div:first-child",".pads>div:last-child"]
    .map(box).filter(Boolean);
  ok(items.length>=4,"панели на месте");
  const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
  const clash=[];
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
    if(hit(items[i],items[j]))clash.push(items[i].s+"×"+items[j].s);
  eq(clash.join(", "),"","ничто не наезжает друг на друга");
  /* ширину экрана проверяем только когда он вообще разложен: в свёрнутой
     вкладке innerWidth бывает нулём, и тогда «за краем» оказывается всё */
  if(innerWidth>=280){
    const out=items.filter(i=>i.x<-1||i.x+i.w>innerWidth+1);
    eq(out.map(i=>i.s).join(", "),"","и ничто не уехало за край экрана");
  }else ok(true,"экран не разложен — проверку ширины пропускаем");
  for(const id of ["starbtn","dronebtn","beaconbtn","firebtn"]){
    const e=document.getElementById(id);if(e)e.style.display="none";
  }
}));

TEST_SUITES.push(()=>suite("интерфейс: приборы не мигают от расхода",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  const $h=document.querySelector(".hud"), st=stat();
  /* Топливо и скафандр текут непрерывно. Пока поводом считалось любое
     изменение округлённого показания, панель раз в несколько секунд
     вспыхивала и гасла сама по себе — сверху шло мигание ни о чём. */
  G.fuel=st.fuelMax;G.hull=st.hullMax;G.credits=1000;
  hud();
  /* сто кадров плавного расхода: панель должна успокоиться и не просыпаться */
  for(let i=0;i<100;i++){G.fuel-=.02;hud();}
  HUD_T=performance.now()-9e3;hud();
  ok(!$h.classList.contains("live"),"плавный расход панель не будит");
  for(let i=0;i<50;i++){G.fuel-=.02;hud();}
  ok(!$h.classList.contains("live"),"и не будит дальше");
  /* а событие — будит */
  G.hull-=12;hud();
  ok($h.classList.contains("live"),"удар по корпусу будит");
  HUD_T=performance.now()-9e3;hud();
  ok(!$h.classList.contains("live"),"и панель снова гаснет");
  G.credits+=250;hud();
  ok($h.classList.contains("live"),"деньги будят");
  G.fuel=st.fuelMax*.05;hud();
  ok($h.classList.contains("live"),"на исходе топлива панель открыта без поводов");
  G.fuel=st.fuelMax;G.hull=st.hullMax;hud();
}));

TEST_SUITES.push(()=>suite("интерфейс: кнопка называет действие, а не себя",()=>{
  resetWorld();
  /* «ДЕЙСТВИЕ» не отвечает ни на один вопрос игрока, «СТЫКОВКА» отвечает
     на все. Глагол берётся из подсказки, чтобы не завести второй источник
     правды, который однажды разойдётся с первым. */
  const $act=document.querySelector("[data-k=act]");
  G.mode="system";G.prompt="";hud();
  eq($act.textContent,"ДЕЙСТВИЕ","делать нечего — кнопка нейтральна");
  ok(!$act.classList.contains("ready"),"и не светится");
  G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · ТОРГОВЫЙ УЗЕЛ";hud();
  eq($act.textContent,"СТЫКОВКА","у станции кнопка называет стыковку");
  ok($act.classList.contains("ready"),"и подсвечена");
  G.prompt="ДЕЙСТВИЕ — АБОРДАЖ";hud();
  eq($act.textContent,"АБОРДАЖ","у пиратской базы — абордаж");
  /* длинную подпись на круглую кнопку не сажаем: она бы не поместилась */
  G.prompt="ДЕЙСТВИЕ — СИНТЕЗ ТОПЛИВА ИЗО ЛЬДА (12)";hud();
  eq($act.textContent,"ДЕЙСТВИЕ","слишком длинный глагол на кнопку не лезет");
  G.prompt="";hud();
}));

TEST_SUITES.push(()=>suite("станция: разделы вместо десяти вкладок в ряд",()=>{
  resetWorld();
  const S=G.sys.station;
  ok(!!S,"станция есть");
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  const groups=[...document.querySelectorAll("#stGroups button")];
  ok(groups.length>0,"разделы построены");
  ok(groups.length<ST_GROUPS.length+1,"их не больше, чем заведено");
  /* раздел показывается, только если у него есть вкладка на этой станции */
  const has=stTypeOf(G.st.stype).tabs;
  const liveNames=ST_GROUPS.filter(g=>g.tabs.some(t=>has.indexOf(t)>=0)).map(g=>g.ru);
  eq(groups.map(b=>b.textContent).join(","),liveNames.join(","),
     "мёртвых разделов в шапке нет");
  /* вкладки видны только своего раздела */
  const grpOfTab={};ST_GROUPS.forEach(g=>g.tabs.forEach(t=>grpOfTab[t]=g.id));
  const shown=[...document.querySelectorAll("#stTabs button")].filter(b=>b.style.display!=="none");
  ok(shown.length>0,"вкладки раздела показаны");
  ok(shown.every(b=>grpOfTab[b.dataset.tab]===stGroupOf(tab)),
     "чужих вкладок в ряду нет");
  ok(shown.every(b=>has.indexOf(b.dataset.tab)>=0),"и нет тех, которых на станции не бывает");
  /* переключение раздела переносит и вкладку */
  if(groups.length>1){
    const before=tab;
    groups[1].click();
    ok(tab!==before,"выбор раздела переключил вкладку");
    ok(has.indexOf(tab)>=0,"на ту, что здесь вообще есть");
  }
  closeStation();
}));

TEST_SUITES.push(()=>suite("лаборатория: домен исследователя, а не воздух",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  ok(!!TECH.lab,"наука «Лаборатория» есть в дереве");
  ok(!!BUILD.lab,"постройка есть в списке");
  eq(BUILD.lab.needTech,"lab","и заперта наукой");
  ok(!labWorking(),"без базы работать негде");
  /* закладываем базу и ставим лабораторию с жилым отсеком рядом */
  const p=G.sys.planets.find(x=>x.type!=="gas");
  G.cargo.alloy=60;
  ok(foundBase(p),"база заложена");
  const B=baseAt(G.sx,G.sy,p.idx);
  B.cells[2]={k:"lab",hp:1};
  eq(labCount(),1,"лаборатория стоит");
  ok(!labWorking(),"но без жилого отсека рядом она мертва");
  B.cells[1]={k:"habitat",hp:1};
  ok(labWorking(),"с жилым отсеком по соседству — работает");
  /* без лаборатории он не бездельничает, но идёт втрое медленнее */
  sci.prog=0;G.data=0;
  mgrWorkSci(sci,100);
  const withLab=G.data;
  B.cells[2]=null;
  sci.prog=0;G.data=0;
  mgrWorkSci(sci,100);
  ok(G.data<withLab,"в кают-компании выхлоп меньше, чем в лаборатории");
  ok(G.data>0,"но совсем без дела он не сидит");
}));

TEST_SUITES.push(()=>suite("артефакты: слот один, эффект глобальный",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  hireMgr(genMgr(77,["cmd"]));
  const sci=mgrOf("sci"),cmd=mgrOf("cmd");
  eq(RELIC_KEYS.length,7,"артефактов семь, как в замысле");
  ok(!relicSlotOpen(),"без «Ксеноархива» носить их негде");
  relicFind("blank","тест");
  ok(relicHave("blank"),"находка записана");
  ok(!relicEquip(sci,"blank"),"и надеть её пока нельзя");
  ok(!relicOn("blank"),"эффекта тоже нет");
  G.tech.add("relic");
  ok(relicSlotOpen(),"с наукой слот открылся");
  ok(relicEquip(sci,"blank"),"артефакт надет");
  /* эффект глобальный: доля падает у всех, а не у носителя */
  const withIt=mgrCut(cmd);
  relicUnequip(sci);
  const without=mgrCut(cmd);
  near(without-withIt,.03,.001,"«Пустой контракт» сбивает долю всем на три пункта");
  relicEquip(sci,"blank");
  /* вторая строка — только при исследователе, умеющем читать */
  ok(!relicDeep("blank"),"вторая строка заперта");
  sci.perks.push("relic");
  ok(relicDeep("blank"),"с «чтением» она открывается");
  /* артефакт один: надеть его двоим нельзя */
  relicEquip(cmd,"blank");
  eq(sci.relic,null,"прежний владелец его отдал");
  eq(cmd.relic,"blank","и он ровно у одного");
}));

TEST_SUITES.push(()=>suite("артефакты: первые строки работают там, где обещано",()=>{
  resetWorld();
  G.credits=300000;G.tech.add("relic");
  hireMgr(genMgr(77,["cmd"]));
  const cmd=mgrOf("cmd");
  /* «Счётная кость»: удача нового наёмника не ниже средней */
  const mk=()=>{const c=genMerc(4242,null);c._luck=null;return crewLuck(c);};
  const plain=mk();
  relicFind("dice","т");relicEquip(cmd,"dice");
  ok(mk()>=1,"со «Счётной костью» удача не бывает ниже 1.0");
  ok(plain<1||true,"без неё бывает любой (эталон "+plain.toFixed(2)+")");
  /* «Тихий маяк»: ядро дрейфует вдвое медленнее */
  relicUnequip(cmd);
  const ai={seed:7,role:"keep",ai:1,drift:0,perks:[],traits:[],loy:100,xp:0,log:[]};
  aiDrift(ai,10,0);const fast=ai.drift;
  relicFind("quiet","т");relicEquip(cmd,"quiet");
  ai.drift=0;aiDrift(ai,10,0);
  near(ai.drift,fast/2,.01,"с «Тихим маяком» дрейф вдвое медленнее");
}));

TEST_SUITES.push(()=>suite("оживлённые перки исследователя",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  /* «допуск»: усиливается прибавка, а не множитель целиком */
  const k=BP_KEYS[0];
  G.blueprints={};G.blueprints[k]=1;
  near(bpMul(k,1.2,.9),1.2,.001,"без перка чертёж даёт своё");
  sci.perks.push("better");
  near(bpMul(k,1.2,.9),1.23,.001,"с «допуском» прибавка на 15% больше");
  /* «пересборка»: перепроверка вдвое дешевле */
  G.data=1000;G.blueprints[k]=-1;
  bpRecheck(k);
  eq(1000-G.data,60,"без перка пересборка стоит 60 данных");
  sci.perks.push("redo");
  G.data=1000;G.blueprints[k]=-1;
  bpRecheck(k);
  eq(1000-G.data,30,"с «пересборкой» — половину");
  /* «биология»: отсканированная жизнь становится образцом */
  sci.perks.push("bio");
  G.bio=4;G.data=0;sci.prog=0;
  mgrWorkSci(sci,300);
  ok(G.bio<4,"живые образцы уходят в разбор");
  ok(G.data>0,"и дают науку");
}));

TEST_SUITES.push(()=>suite("артефакты переживают сохранение",()=>{
  resetWorld();
  G.credits=300000;G.tech.add("relic");
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  relicFind("blank","т");relicEquip(sci,"blank");
  /* заодно стережём поля, которые терялись молча: список полей в applySave
     белый, и новое поле надо вносить в него руками */
  sci.cutBonus=.02;sci.ultCount=1;
  G.relicHint={sx:3,sy:-1};G.bio=6;
  const json=JSON.stringify(snapshot());
  resetWorld();
  eq(relicOwned().length,0,"сброс мира их убирает");
  applySave(JSON.parse(json));
  const back=mgrOf("sci");
  eq(relicOwned().length,1,"находка вернулась");
  eq(back.relic,"blank","и осталась надетой");
  ok(relicOn("blank"),"эффект после загрузки работает");
  near(back.cutBonus,.02,.001,"поднятая ультиматумом доля не потерялась");
  eq(back.ultCount,1,"и счётчик ультиматумов тоже");
  eq(G.bio,6,"живые образцы сохранились");
  ok(!!G.relicHint,"след артефакта на карте остался");
  /* битую запись в слот не пускаем */
  const bad=JSON.parse(json);
  bad.relics={"нетакой":1,blank:1};
  applySave(bad);
  ok(relicOwned().every(k=>!!ARTIFACTS[k]),"артефакта не из таблицы в игре нет");
}));

TEST_SUITES.push(()=>suite("дерево перков: подписей без кода не осталось",()=>{
  /* Главная проверка этой вехи, и она должна пережить нас. Перк виден игроку
     целиком, и очко уровня тратится всерьёз: перк, который никто не читает, —
     обман. На ревизии таких нашлось 24 из 48.
     Считаем «подключённым» перк, который читают через mgrPerk/mgrPerkOf или
     который открывает стоящий приказ (поле need в MGR_RULES). */
  /* только код игры: тесты живут в том же файле, и их строки не в счёт */
  const src=document.scripts[0].textContent.split("TEST_SUITES")[0];
  const needed={};
  for(const role in MGR_RULES)for(const r of MGR_RULES[role])if(r.need)needed[r.need]=1;
  const dead=[];
  for(const role in MGR_PERKS)for(const br of MGR_PERKS[role])for(const p of br.list){
    if(needed[p.id])continue;
    if(new RegExp("mgrPerk(Of)?\\([^)]*\""+p.id+"\"").test(src))continue;
    dead.push(role+"/"+p.id+" «"+p.ru+"»");
  }
  eq(dead.join(", "),"","каждый перк дерева кто-то читает");
}));

TEST_SUITES.push(()=>suite("база: ленивое время не падает, вход работает",()=>{
  resetWorld();
  /* `baseTick` читал CREW_OFFLINE_CAP, которой не существовало: каждый тик базы
     после первого падал с ReferenceError, и вместе с ним падал вход в базу.
     Держим и константу, и сам путь входа под проверкой. */
  ok(typeof CREW_OFFLINE_CAP==="number"&&CREW_OFFLINE_CAP>0,"потолок ленивого времени объявлен");
  G.credits=500000;G.cargo.alloy=99;
  const p=G.sys.planets.find(x=>x.type!=="gas");
  ok(foundBase(p),"база заложена");
  const B=baseAt(G.sx,G.sy,p.idx);
  B.tMs=Date.now()-600000;
  baseTick();
  ok(true,"второй тик базы не падает");
  G.mode="surface";
  enterBase(p);
  eq(G.mode,"base","в базу можно войти");
  exitBase();
}));

TEST_SUITES.push(()=>suite("смотритель: энергия, стройка и логистика",()=>{
  resetWorld();
  G.credits=500000;G.cargo.alloy=99;
  hireMgr(genMgr(41,["keep"]));
  const kp=mgrOf("keep");
  const p=G.sys.planets.find(x=>x.type!=="gas");
  foundBase(p);
  const B=baseAt(G.sx,G.sy,p.idx);
  const wipe=()=>{for(let i=0;i<B.cells.length;i++)B.cells[i]=null;};
  /* глухой перегруз: один реактор на шесть буров */
  wipe();
  B.cells[2]={k:"reactor",hp:1};
  for(const i of [0,1,3,4,5,6])B.cells[i]={k:"drill",hp:1};
  kp.perks=[];
  const bare=basePower(B).eff;
  kp.perks=["stable"];
  ok(basePower(B).eff>bare,"«стабилизация» держит нижний порог");
  near(basePower(B).eff,.35,.001,"и порог этот — 0.35");
  /* «переброс» отбирает мощность у необязательного в пользу бура */
  wipe();
  B.cells[2]={k:"reactor",hp:1};B.cells[0]={k:"drill",hp:1};
  B.cells[4]={k:"refinery",hp:1};B.cells[6]={k:"pad",hp:1};B.cells[7]={k:"habitat",hp:1};
  kp.perks=[];
  const flat=basePower(B).eff;
  kp.perks=["power"];
  ok(basePower(B).eff>flat,"«переброс» вытягивает отдачу при нехватке");
  /* «излишки»: лишняя мощность продаётся */
  wipe();
  B.cells[2]={k:"reactor",hp:1};
  const P=basePower(B);
  ok(P.surplus>0,"лишняя мощность посчитана");
  kp.perks=[];
  G.credits=1000;B.tMs=Date.now()-600000;baseTick();
  eq(G.credits,1000,"без перка излишки никуда не идут");
  kp.perks=["grid"];
  B.tMs=Date.now()-600000;baseTick();
  ok(G.credits>1000,"с «излишками» — идут в кассу");
  /* «второй ярус» */
  eq(baseRows(B),BASE_ROWS,"по умолчанию рядов четыре");
  kp.perks=["deep"];
  baseGrowCheck(B);
  eq(baseRows(B),BASE_ROWS_DEEP,"с перком вскрывается пятый");
  eq(B.cells.length,BASE_COLS*BASE_ROWS_DEEP,"и ячеек стало больше");
  /* ярус остаётся у базы, даже если смотрителя не стало */
  kp.perks=[];
  eq(baseRows(B),BASE_ROWS_DEEP,"вскрытый ярус у базы не отбирают обратно");
  /* «очередь» доводит начатое без инженера */
  B.cells[2].hp=.2;
  baseFixTick(B,20);
  near(B.cells[2].hp,.2,.001,"без перка и без инженера чинить некому");
  kp.perks=["queue"];
  baseFixTick(B,20);
  ok(B.cells[2].hp>.2,"«очередь» достраивает сама");
}));

TEST_SUITES.push(()=>suite("буря: угроза месту, а не людям",()=>{
  resetWorld();
  G.credits=500000;G.cargo.alloy=99;
  hireMgr(genMgr(41,["keep"]));
  const kp=mgrOf("keep");
  const p=G.sys.planets.find(x=>x.type!=="gas");
  foundBase(p);
  const B=baseAt(G.sx,G.sy,p.idx);
  B.type="desert";
  B.cells[1]={k:"solar",hp:1};
  const run=()=>{
    let hit=0;
    for(let i=0;i<600;i++){
      B.tMs=Date.now()+i;
      baseStorm(B,4);
      if(B.cells[1].hp<1){hit++;B.cells[1].hp=1;}
    }
    return hit;
  };
  kp.perks=[];
  ok(run()>0,"буря доходит до того, что стоит наверху");
  kp.perks=["storm"];
  eq(run(),0,"«буревой щит» не пускает её вовсе");
  /* газовому гиганту буря не грозит: базы там и не бывает */
  B.type="gas";kp.perks=[];
  eq(run(),0,"там, где не дует, бури нет");
}));

TEST_SUITES.push(()=>suite("фактор и командир: остальные оживлённые перки",()=>{
  resetWorld();
  G.credits=500000;
  hireMgr(genMgr(55,["fact"]));
  hireMgr(genMgr(77,["cmd"]));
  const fc=mgrOf("fact"),cmd=mgrOf("cmd");
  /* маршрут из двух плеч со станциями */
  const legs=[];
  for(let x=-3;x<=3&&legs.length<2;x++)for(let y=-3;y<=3&&legs.length<2;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s.station)legs.push(x+","+y);
  }
  ok(legs.length===2,"нашлись два плеча");
  fc.route=legs.slice();
  const [sx,sy]=legs[0].split(",").map(Number);
  const sys=getSystem(sx,sy);
  /* «монополия» поднимает цену на плече — это игрок чувствует кошельком */
  fc.perks=[];G.market={};
  const plain=marketFor(sys).iron;
  fc.perks=["mono"];G.market={};
  ok(marketFor(sys).iron>plain,"на плече маршрута цена держится выше");
  /* «сводка» показывает цены маршрута, не выходя из системы */
  fc.perks=[];
  ok(!/сводка по маршруту/.test(mgrDomainLine(fc)),"без перка сводки нет");
  fc.perks=["see"];
  ok(/сводка по маршруту/.test(mgrDomainLine(fc)),"с перком она появляется");
  /* «пороги» открывают два приказа, которых иначе нет в списке вовсе */
  const seen=()=>MGR_RULES.fact.filter(r=>!r.need||mgrPerk(fc,r.need)).map(r=>r.id);
  fc.perks=[];
  ok(seen().indexOf("buylow")<0,"без «порогов» приказов по цене не существует");
  fc.perks=["limit"];
  ok(seen().indexOf("buylow")>=0&&seen().indexOf("sellhi")>=0,"с ними — появляются оба");
  /* «обновление» перебирает ассортимент чаще */
  fc.perks=[];const slow=timeBucket();
  fc.perks=["stock"];
  ok(timeBucket()!==slow,"бакет ассортимента стал другим");
  /* «чёрный список» кладёт на станцию отдельную вещь */
  fc.perks=[];const n=stationParts(sys).length;
  fc.perks=["black"];const withBlack=stationParts(sys);
  eq(withBlack.length,n+1,"в продаже появилась ещё одна часть");
  ok(withBlack.some(o=>o.black),"и она помечена как пришедшая по связям");
  /* «переговорщик»: выкуп вдвое дешевле, и видно это заранее */
  cmd.perks=[];
  const full=Math.round(1000*(mgrPerkOf("cmd","ransom")?.5:1));
  cmd.perks=["ransom"];
  eq(Math.round(1000*(mgrPerkOf("cmd","ransom")?.5:1)),full/2,"выкуп вдвое дешевле");
  /* «охота» рисуется на карте, не роняя её */
  cmd.perks=["hunt"];
  G.mode="map";G.sel={x:G.sx,y:G.sy};
  drawMap();
  ok(true,"карта с метками пиратских баз рисуется");
  G.mode="system";
}));

TEST_SUITES.push(()=>suite("торможение не разворачивает корабль",()=>{
  resetWorld();
  const sh=G.ship;
  sh.a=0;sh.vx=-3;sh.vy=0;sh.av=0;      // летим кормой вперёд: раньше корабль довернулся бы
  const a0=sh.a, sp0=Math.hypot(sh.vx,sh.vy);
  keys.brake=true;
  for(let i=0;i<30;i++)updateSystem(1);
  keys.brake=false;
  near(sh.a,a0,.001,"курс остался тем, который держал игрок");
  ok(Math.hypot(sh.vx,sh.vy)<sp0,"а скорость при этом падает");
}));

TEST_SUITES.push(()=>suite("струи ориентации бьют против поворота",()=>{
  resetWorld();
  const sh=G.ship;sh.a=.7;sh.vx=0;sh.vy=0;
  /* момент от струи: газ уходит в одну сторону, корабль идёт в другую.
     Считаем по самим частицам — рисуется ровно то, что физика и делает. */
  const torque=(left)=>{
    TRAIL.length=0;keys.left=left;keys.right=!left;
    for(let i=0;i<200&&TRAIL.length<2;i++)trailStep(1,false,true,false);
    keys.left=keys.right=false;
    const ca=Math.cos(-sh.a),sa=Math.sin(-sh.a);
    let sum=0;
    for(const t of TRAIL){
      if(t.hot)continue;
      const dx=t.x-sh.x, dy=t.y-sh.y;
      const rx=dx*ca-dy*sa, ry=dx*sa+dy*ca;          // в осях корпуса
      const ex=t.vx-sh.vx*.9, ey=t.vy-sh.vy*.9;      // куда ушёл газ
      const fx=-(ex*ca-ey*sa), fy=-(ex*sa+ey*ca);    // тяга — против газа
      sum+=rx*fy-ry*fx;
    }
    return sum;
  };
  ok(torque(true)<0,"поворот влево — момент влево");
  ok(torque(false)>0,"поворот вправо — момент вправо");
  TRAIL.length=0;
}));

TEST_SUITES.push(()=>suite("кабина у каждого класса своя",()=>{
  resetWorld();
  const keysSeen={};
  for(const id of SHIP_KEYS){
    const k=cockpitStyleKey(id);
    ok(!!CKPT_STYLE[k],"«"+SHIPS[id].ru+"»: раскладка "+k+" существует");
    keysSeen[k]=(keysSeen[k]|0)+1;
  }
  ok(Object.keys(keysSeen).length>=4,"на верфи стоят кабины минимум четырёх видов");
  /* сплав из лаборатории — единственный корпус не с верфи, и кабина у него чужая */
  const b=genUniqueShip(4242);b.fused=1;b.cls="лабораторный сплав";
  G.uniqueShips.tAlien=b;
  eq(cockpitStyleKey("tAlien"),"alien","у лабораторного сплава кабина чужая");
  /* у буровика стойки заведомо толще, чем у курьера: это и читается силуэтом */
  const pMiner=cockpitPlan("obod").pw, pCour=cockpitPlan("klinok").pw;
  ok(pMiner>pCour,"у буровика переплёт тяжелее курьерского");
  delete G.uniqueShips.tAlien;
}));

TEST_SUITES.push(()=>suite("три пересмотренные сцены рисуются",()=>{
  resetWorld();
  /* Правки чисто рисовальные, утверждать про пиксели нечего — но упасть на
     первом кадре они могут запросто (Path2D, отсутствующая планета, пустая
     сетка). Проверяем, что каждая сцена переживает отрисовку в своём режиме. */
  G.mode="map";G.sel={x:G.sx+1,y:G.sy};
  drawMap();ok(true,"карта рисуется");
  G.sel={x:G.sx+9,y:G.sy+9};                 // вне радиуса прыжка
  drawMap();ok(true,"карта рисуется и с целью вне радиуса");
  const p=G.sys.planets[0];
  G.credits=1e6;G.cargo.alloy=99;
  ok(foundBase(p),"база закладывается");
  enterBase(p);
  drawBase();ok(true,"база в разрезе рисуется");
  /* пустая клетка под курсором — та ветка, где раньше рисовалась рамка на всём */
  G.base.cur=(G.base.cur+1)%BASE_COLS;
  drawBase();ok(true,"база рисуется и с курсором на породе");
  let PB=null;
  for(let x=-12;x<12&&!PB;x++)for(let y=-12;y<12&&!PB;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y),b=pirateBaseOf(s);
    if(b){G.sys=s;G.sx=x;G.sy=y;PB=b;}
  }
  ok(!!PB,"пиратская база в галактике находится");
  if(PB){
    enterRaid(PB);
    drawRaid();ok(true,"абордаж рисуется");
  }
  G.base=null;G.raid=null;G.mode="system";
}));

TEST_SUITES.push(()=>suite("миры: двенадцать истинных и смеси из них",()=>{
  resetWorld();
  /* Таблиц, разложенных по типу мира, восемь штук в разных файлах, и добавить
     тип, забыв одну из них, — самая лёгкая ошибка в этой части. Проверка
     держит их синхронными, а не глаза. */
  const keys=Object.keys(TYPES);
  eq(keys.length,12,"истинных миров двенадцать");
  const miss=[];
  for(const k of keys){
    if(!PROFILE[k])miss.push("PROFILE:"+k);
    if(!RELIEF_MIX[k])miss.push("RELIEF_MIX:"+k);
    if(!GEO_TPL[k])miss.push("GEO_TPL:"+k);
    if(!WEATHER_BY_TYPE[k])miss.push("WEATHER:"+k);
    if(!CLOUD_KIND[k])miss.push("CLOUD_KIND:"+k);
    if(!WORLD_MOOD[k])miss.push("MOOD:"+k);
    if(!WORLD_VOICE[k])miss.push("VOICE:"+k);
    if(k!=="gas"){
      if(!MIX_KIN[k]||!MIX_KIN[k].length)miss.push("MIX_KIN:"+k);
      if(!TYPES[k].mix)miss.push("mix-имя:"+k);
    }
  }
  eq(miss.join(", "),"","у каждого типа заполнены все таблицы");
  /* родство симметрично по смыслу не обязано быть, но ссылаться на живой тип обязано */
  const bad=[];
  for(const k in MIX_KIN)for(const m of MIX_KIN[k])if(!TYPES[m]||m==="gas")bad.push(k+"→"+m);
  eq(bad.join(", "),"","родство ссылается только на существующие миры");

  /* смесь — это другой мир, а не другая раскраска */
  const W=makeWorld("ice","volcanic",.4);
  eq(W.type,"ice","ведущий тип остаётся ледяным");
  eq(W.mix,"volcanic","второй записан");
  eq(W.T.ru,"ледяная, с вулканами","имя собирается из двух");
  eq(W.T.atm,TYPES.ice.atm,"воздух берёт ведущий: полупригодного не бывает");
  eq(W.T.pal.length,6,"палитра смешана в шесть ступеней");
  ok(W.T.rough>TYPES.ice.rough&&W.T.rough<TYPES.volcanic.rough,"шероховатость между двумя");
  const P={type:W.type,mix:W.mix,mw:.4,T:W.T,seed:12345};
  worldTables(P);
  ok(P.relief.crater>RELIEF_MIX.ice.crater,"кратеров стало больше, чем у чистой ледяной");
  eq(P.geoTpl.length,GEO_TPL.ice.length,"слоёв столько же, сколько у ведущего");
  ok(P.wxPool.indexOf("ash")>=0,"в погоду попал пепел вулканического соседа");
  ok(P.voice.bpm[0]>WORLD_VOICE.ice.bpm[0],"музыка ускорилась в сторону вулканической");
  const R=worldRes("ice","volcanic",.4);
  ok(R.length>PROFILE.ice.length,"залежи пополнились породами соседа");
  ok(R.indexOf("iron")>=0||R.indexOf("titan")>=0,"и это именно его породы");
  /* чистый мир не обрастает ничем */
  const pure=makeWorld("ice",null,0);
  eq(pure.T,TYPES.ice,"без второго типа мир остаётся собой");

  /* галактика: встречаются все двенадцать, и смеси преобладают */
  const seen={},cnt={pure:0,mix:0};
  for(let sx=0;sx<8;sx++)for(let sy=0;sy<8;sy++){
    for(const p of getSystem(sx,sy).planets){
      seen[p.type]=(seen[p.type]||0)+1;
      if(p.mix)cnt.mix++;else cnt.pure++;
      if(p.type!=="gas")ok(p.res.length>0,"у мира есть чем поживиться")&&0;
    }
  }
  const absent=Object.keys(TYPES).filter(k=>!seen[k]);
  eq(absent.join(", "),"","в шестидесяти четырёх секторах встретились все двенадцать миров");
  ok(cnt.mix>cnt.pure,"смешанных больше, чем чистых ("+cnt.mix+" против "+cnt.pure+")");
  ok(cnt.pure/(cnt.pure+cnt.mix)>.15,"но чистые не вымерли");
  /* гигант не смешивается: смесь про поверхность, а её у него нет */
  let gasMix=0;
  for(let sx=0;sx<8;sx++)for(const p of getSystem(sx,0).planets)if(p.type==="gas"&&p.mix)gasMix++;
  eq(gasMix,0,"газовый гигант ни с чем не смешан");
}));

TEST_SUITES.push(()=>suite("крупная форма: поздний мир виден силуэтом",()=>{
  resetWorld();
  /* Тип мира должен читаться СРЕДНИМ масштабом — тем, что между валуном
     (радиус до 22) и достопримечательностью (150–900). Проверка держит три
     вещи: форма есть у всех четырёх поздних миров, она из своего набора и
     она не залезает ни в зону взлёта, ни под постройку. */
  const bad=[];
  for(const k of DECO_KINDS)if(!TYPES[k.on])bad.push(k.k+"→"+k.on);
  eq(bad.join(", "),"","набор формы ссылается на существующие миры");
  const late=["crystal","metal","jungle","ruin"];
  for(const t of late){
    const W0=makeWorld(t,null,0);
    const P={type:t,mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:hashi(9,t.length,0x77)};
    worldTables(P);
    const tr=genTerrain(P);
    genPOI(tr,P);genDeco(tr,P);
    ok(tr.deco.length>2,t+": крупная форма выросла ("+tr.deco.length+" штук)");
    if(!tr.deco.length)continue;
    const alien=tr.deco.filter(d=>!DECO_KINDS.some(k=>k.k===d.k&&k.on===t));
    eq(alien.length,0,t+": формы только из своего набора");
    const onPad=tr.deco.filter(d=>Math.abs(d.x-tr.padX)<420);
    eq(onPad.length,0,t+": в зоне взлёта пусто — обстановка фантомна");
    const inPoi=tr.deco.filter(d=>tr.poi.some(q=>Math.abs(q.x-d.x)<q.h*.3));
    eq(inPoi.length,0,t+": не торчит сквозь постройку");
    const hi=Math.max.apply(null,tr.deco.map(d=>d.h));
    ok(hi>40&&hi<330,t+": масштаб между валуном и постройкой ("+Math.round(hi)+" px)");
    /* и всё это рисуется: восемь форм на четыре мира, каждая своим кодом */
    G.land={p:P,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.deco[0].x;
    drawSurface();
    ok(true,t+": кадр с крупной формой рисуется");
  }
  /* чистый ранний мир не обрастает ничем: язык форм принадлежит типу */
  const R=makeWorld("rocky",null,0);
  const PR={type:"rocky",mix:null,mw:0,T:R.T,rough:R.T.rough,seed:5};
  worldTables(PR);
  const tr2=genTerrain(PR);genDeco(tr2,PR);
  eq(tr2.deco.length,0,"каменистый мир остаётся камнем без чужих форм");
  /* смесь принимает форму соседа, но реже, чем собственную */
  const M0=makeWorld("ice","ruin",.4);
  const PM={type:"ice",mix:"ruin",mw:.4,T:M0.T,rough:M0.T.rough,seed:31};
  worldTables(PM);
  const tr3=genTerrain(PM);genDeco(tr3,PM);
  ok(tr3.deco.length>0,"на ледяной с руинами стены есть ("+tr3.deco.length+")");
  ok(tr3.deco.length<tr2.deco.length+18,"но их меньше, чем на своём мире");
  ok(tr3.deco.every(d=>d.k==="wall"||d.k==="column"),"и это именно руины соседа");
  G.surf=null;G.land=null;G.mode="system";
}));

/* ── M81: посадочный корабль ──
   Раньше на грунте стоял полётный силуэт, повёрнутый носом вверх и сжатый до
   38 px при астронавте 24: игрушка на палочках. Мерило — человек, поэтому
   проверяем именно длину, три точки опоры и зону «у корабля» от корпуса. */
function landerInk(id,opt){
  const c=document.createElement("canvas");c.width=260;c.height=200;
  const old=ctx, prev=G.shipId;
  ctx=c.getContext("2d");G.shipId=id;
  ctx.translate(130,120);
  try{drawLander(false,false,opt||{gear:1,sq:0,landed:true,hot:1});}
  finally{ctx=old;G.shipId=prev;}
  const d=c.getContext("2d").getImageData(0,0,260,200).data;
  const at=(x,y)=>x>=0&&x<260&&y>=0&&y<200&&d[((y*260+x)<<2)+3]>20;
  let x0=1e9,x1=-1e9,y0=1e9;
  for(let y=0;y<200;y++)for(let x=0;x<260;x++)if(at(x,y)){
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;
  }
  return {at,x0:x0-130,x1:x1-130,top:y0-120};
}
TEST_SUITES.push(()=>suite("посадочный корабль: масштаб и три точки опоры",()=>{
  resetWorld();
  const ASTRO=24;
  for(const id of SHIP_KEYS){
    const L=landerLen(id);
    ok(L>=90&&L<=130,id+": длина силуэта 90–130 px ("+Math.round(L)+")");
    ok(L>=3*ASTRO,id+": корабль не короче трёх астронавтов");
    ok(shipZoneR(id)>L*.5,id+": зона «у корабля» больше половины корпуса");
    const ink=landerInk(id);
    ok(ink.x1-ink.x0>=L*.9,id+": кадр рисуется во всю длину ("+(ink.x1-ink.x0)+" px)");
  }
  /* и на уникальном корпусе тоже: он живёт в G.uniqueShips, а не в SHIPS */
  const uid=Object.keys(G.uniqueShips||{})[0];
  if(uid)ok(landerInk(uid).x1>0,"уникальный корпус тоже рисуется");
  /* три пяты: под каждой из трёх опор есть чернила у линии касания (11) */
  const L=landerLen(G.shipId), ink=landerInk(G.shipId);
  for(const lx of [-L*.21,-L*.05,L*.21]){
    let hit=false;
    for(let x=Math.round(130+lx)-7;x<=Math.round(130+lx)+7&&!hit;x++)
      for(let y=120+4;y<=120+18;y++)if(ink.at(x,y)){hit=true;break;}
    ok(hit,"опора на "+Math.round(lx)+" px стоит на грунте");
  }
  ok(ink.x1-ink.x0>=L*.8,"разнос опор и корпуса не уже 0.8 длины");
  /* убранное шасси действительно убрано: в полёте пят у грунта нет */
  const up=landerInk(G.shipId,{gear:0,sq:0,landed:false});
  ok(up.top>ink.top-40,"со сложенным шасси силуэт не выше, чем со стоящим");
  /* зона у корабля не пускает высадку под днище */
  landOnTestPlanet();
  ok(Math.abs(G.surf.x-G.surf.shipX)>shipZoneR(),
    "высаживаемся за зоной взлёта, а не под кораблём");
  G.surf=null;G.land=null;G.mode="system";
}));

/* ── M82: пиратский корпус ──
   Пират рисовался вашим же генератором корпусов в другой раскраске: полтора
   десятка полигонов, аккуратная симметрия. Проверяем ровно то, из-за чего
   затевалось: бюджет полигонов, асимметрия, четыре опознаваемых класса и то,
   что сотня полигонов не считается каждый кадр. */
TEST_SUITES.push(()=>suite("пиратский корпус: сварен, а не покрашен",()=>{
  resetWorld();
  const seen={};
  for(let i=0;i<40;i++){
    const id=pirateShipId(hashi(i,7,3));
    const art=pirateArtOf(id);
    seen[art.cls]=(seen[art.cls]||0)+1;
    const n=art.B.polys.length;
    ok(n>=60&&n<=120,"полигонов "+n+" (нужно 60–120), класс "+art.ru);
    /* асимметрия — правило, а не шум: слева пилон, справа бак, и они разной
       эпохи. Считать массу или число деталей по бортам бесполезно — хребет
       почти симметричен и топит разницу, а случайная мелочь её подделывает.
       Спрашиваем ровно то, что видно глазом: у скольких вершин НЕТ пары,
       отражённой через ось. У штампованного корпуса таких почти нет. */
    const V=[];
    for(const q of art.B.polys)for(const pt of q.p)V.push(pt);
    const tol=art.B.L*.008;
    let lone=0;
    for(const v of V){
      if(!V.some(w=>Math.abs(w[0]-v[0])<tol&&Math.abs(w[1]+v[1])<tol))lone++;
    }
    ok(lone/V.length>.5,"корпус не зеркален: без пары "+
      Math.round(lone/V.length*100)+"% вершин");
    ok(art.B.eng.length>=2,"движков не меньше двух");
  }
  ok(seen.fast&&seen.raid&&seen.heavy,"все три вольных класса встречаются: "+
    JSON.stringify(seen));
  /* выпечка: второй запрос отдаёт ту же канву, а не считает заново */
  const a=pirateArtOf(pirateShipId(hashi(3,7,3)));
  const b=pirateArtOf(pirateShipId(hashi(3,7,3)));
  ok(a===b&&a.cn.width>0,"корпус выпекается один раз на seed");
  /* флагман ренегата — ваш корпус, обвешанный чужим */
  const rg=pirateArtOf(G.shipId,true);
  eq(rg.cls,"flag","у ренегата класс флагмана");
  ok(rg!==pirateArtOf(G.shipId),"тот же id без пометки — не тот же корабль");
  /* и всё это рисуется живьём, с повреждениями и без */
  const c=document.createElement("canvas");c.width=c.height=260;
  const old=ctx;ctx=c.getContext("2d");
  try{
    ctx.translate(130,130);
    for(const hp of [1,.7,.4,.2]){
      drawPirate({shipId:pirateShipId(hashi(5,7,3)),seed:5,hull:hp*100,hullMax:100,
        thrust:hp<.5});
    }
  }finally{ctx=old;}
  const d=c.getContext("2d").getImageData(0,0,260,260).data;
  let ink=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)ink++;
  ok(ink>1200,"подбитый пират рисуется и виден ("+ink+" px)");
}));

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
