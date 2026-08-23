/* ══════════════ автотесты: космозоо (M164) ══════════════ */
TEST_SUITES.push(()=>suite("зоо: поймать отсканированного, клетка ест слот, дома — угол, кормёжка",()=>{
  resetWorld();
  G.zoo=null;G.log=[];G.record=null;
  const cargo0=stat().cargoMax;
  const b={name:"Тест прыгун, пугливый",seed:77,scanned:false};
  ok(!zooCatch(b),"неотсканированного не поймать");
  b.scanned=true;G.surf={p:{name:"Тестовая"}};
  ok(zooCatch(b),"пойман");
  ok(b.caught===1,"зверь помечен");
  eq(zooCarry().length,1,"клетка в трюме");
  eq(stat().cargoMax,cargo0-1,"слот занят");
  /* дома: в угол */
  G.home=homeInit();G.home.tier=7;
  ok(zooSettle(),"переехал в угол");
  eq(zooPen().length,1,"в углу один");
  eq(stat().cargoMax,cargo0,"слот вернулся");
  /* кормёжка: голоден без органики, ест из трюма */
  G.cargo.organics=0;
  G.t+=CEL_DAY*3;zooTick();
  ok(zooPen()[0].hungry===1,"без органики голоден");
  G.cargo.organics=2;G.t+=CEL_DAY;zooTick();
  eq(G.cargo.organics,1,"съел единицу органики");
  ok(!zooPen()[0].hungry,"сыт");
  const s=snapshot();G.zoo=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(zooPen().length,1,"угол пережил сохранение");
  G.zoo=null;G.surf=null;
}));

TEST_SUITES.push(()=>suite("зоо: зоостанция — стойка ядра «Рощи», принимает и платит",()=>{
  resetWorld();
  G.zoo=null;G.record=null;
  const at=regionOfTheme("grove");ok(!!at,"область «Роща» есть");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const core=getSystem(R.core.sx,R.core.sy);
  G.sx=core.sx;G.sy=core.sy;G.sys=core;G.st=core.station||null;
  if(!G.st){ok(true,"в ядре «Рощи» нет станции — пропущено");return;}
  ok(zooStationHere(),"зоостанция здесь");
  zooAll().carry.push({ru:"Тест круглыш, стайный",seed:5,from:"Т",fed:1});
  const c0=G.credits;
  ok(zooSell(0),"принят");
  ok(G.credits>c0,"заплатили");
  ok(recordAll().e.some(x=>x.a==="зоостанция"),"запись в книжке");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.st=G.sys.station||null;
  ok(!zooStationHere(),"в другом месте зоостанции нет");
  G.zoo=null;
}));
