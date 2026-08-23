/* ══════════════ автотесты: Кольцо (M154) ══════════════ */
TEST_SUITES.push(()=>suite("Кольцо: первый сигнал после сорока прыжков, минуту, записывается один раз",()=>{
  resetWorld();
  G.ring=null;G.ringNow=null;G.things=[];G.log=[];G.mode="system";G.running=true;
  const R=ringAll();
  eq(R.left,RING_FIRST,"до первого — сорок прыжков");
  for(let i=0;i<39;i++)ringJump();
  ringTick();
  ok(!ringNow(),"на 39-м прыжке тихо");
  ringJump();ringTick();
  ok(!!ringNow(),"на 40-м — сигнал");
  eq(R.heard,1,"услышан один раз");
  ok(R.left>=RING_EVERY[0]&&R.left<=RING_EVERY[1],"до следующего — "+R.left+" прыжков");
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf("Не наш")>=0),"в ЭФИРЕ строка «не наш»");
  ok(!G.log.some(x=>/объясн|значит|это сигнал/i.test(x.s)),"ни одной строки с объяснением");
  const L=ringLine();
  ok(L&&L.ru.indexOf("ПУЛЬС")===0,"на приёмнике — пульс");
  ok(rxRecord(),"записали");
  ok(!rxRecord(),"второй раз — нет");
  eq(R.tapes.length,1,"лента Кольца на руках");
  ok(G.things.some(t=>t.k==="tape"&&t.ring),"и лежит на столе");
  G.t+=RING_LEN+1;
  ok(!ringNow(),"через минуту сигнал кончился");
}));

TEST_SUITES.push(()=>suite("Кольцо: один источник — направление и сила зависят от места",()=>{
  resetWorld();
  const d1=ringDir(0,0),d2=ringDir(30,-30);
  ok(Math.abs(d1-d2)>.05,"из разных мест — разные направления");
  ok(ringStrength(RING_SRC.sx-10,RING_SRC.sy)>ringStrength(0,0),"ближе к источнику — сильнее");
  ok(ringStrength(200,200)>=.15,"но никогда не ноль");
}));

TEST_SUITES.push(()=>suite("Кольцо: сдать у стойки — «отправим в институт», лента отмечена",()=>{
  resetWorld();
  G.ring=null;G.things=[];G.log=[];
  const S=G.sys.station?G.sys:null;ok(!!S,"станция есть");
  G.ship.x=S.station.x+40;G.ship.y=S.station.y;openStation();
  const R=ringAll();
  R.tapes.push({sx:G.sx,sy:G.sy,dir:1,q:.5,day:celDay(),t:Date.now(),handed:0});
  thingAdd("tape","Лента","т",{ring:1,dir:1,q:.5});
  ok(ringHandIn(0),"сдана");
  eq(R.tapes[0].handed,1,"отмечена сданной");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf("институт")>=0),"строка стойки в ЛЮДИ");
  ok(!ringHandIn(0),"дважды не сдаётся");
  ok(G.things[0].handed===1,"вещь на столе тоже отмечена");
  closeStation();
  /* сохранение */
  const s=snapshot();G.ring=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(ringAll().tapes.length,1,"ленты пережили сохранение");
}));
