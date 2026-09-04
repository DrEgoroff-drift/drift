/* ══════════════ автотесты: дрон-добытчик (M350) — точка бездонная, купить трудно ══════════════ */
function dmStation(t){
  for(let x=-9;x<=9;x++)for(let y=-9;y<=9;y++){if(!starAt(x,y))continue;const s=getSystem(x,y);if(s.station&&(!t||s.station.stype===t))return s;}
  return null;
}
TEST_SUITES.push(()=>suite("дрон-добытчик: бездонная точка, отзыв, окупаемость, прилавок",()=>{
  resetWorld();
  eq(DRONES.miner.price,9000,"машина стоит 9 000");
  G.droneInventory=1;droneTarget="crystal";G.mode="system";
  deployDrone();
  eq(G.drones.length,1,"развёрнут");
  const d=G.drones[0];
  eq(d.pool,-1,"точка бездонная");
  /* сутки работы: машина не возвращается и что-то заработала */
  d.t0-=24*3600*1000;d.lastMs-=24*3600*1000;
  tickDrones();
  eq(G.drones.length,1,"через сутки всё ещё на точке");
  ok((d.earned|0)>0&&(d.trips|0)>50,"за сутки "+d.trips+" кругов и "+d.earned+" кр");
  ok(droneRecall(d)&&G.drones.length===0&&G.droneInventory===1,"ВЕРНУТЬ кладёт машину в запас");
  /* старая запись с конечным пулом дорабатывает и возвращается */
  G.droneInventory=1;deployDrone();const o=G.drones[0];o.pool=3;o.t0-=3600*1000;o.lastMs-=3600*1000;
  tickDrones();eq(G.drones.length,0,"старый дрон с пулом 3 выработал точку и вернулся");
  /* окупаемость: на кристаллах часы, на железе сутки */
  const pc=dronePaybackH(73,.6),pi=dronePaybackH(14,.6);
  ok(pc>3&&pc<6&&pi>15&&pi<35,"окупаемость: кристаллы "+pc+" ч, железо "+pi+" ч");
  /* прилавок: только верфь и завод, по одной в двое суток */
  const y=dmStation("yard"),tr=dmStation("trade");
  if(y){ok(droneShopHas(y),"на верфи машина есть");ok(droneShopTake(y),"взяли");ok(!droneShopHas(y),"вторую сегодня не дадут");
    const snap=snapshot();G.droneSold={};applySave(snap);ok(!droneShopHas(y),"и это помнит сохранение");}
  if(tr)ok(!droneShopHas(tr),"торговый узел дронами не торгует");
  /* рынок в соседнем секторе без смотрителя: два сектора */
  resetWorld();G.droneInventory=1;droneTarget="crystal";deployDrone();
  const dd=G.drones[0],near=nearestStation(dd.sx,dd.sy);
  G.seenPrices={};
  for(let x=-2;x<=2;x++)for(let y2=-2;y2<=2;y2++){if(!starAt(dd.sx+x,dd.sy+y2))continue;const s=getSystem(dd.sx+x,dd.sy+y2);if(s.station&&s!==near){G.seenPrices[s.key]={sx:s.sx,sy:s.sy,day:0,p:{crystal:9999}};}}
  const mk=droneMarket(dd);
  ok(!!mk,"рынок выбран");
  ok(Object.keys(G.seenPrices).length===0||mk!==near,"без смотрителя дрон уходит туда, где дороже, в двух секторах");
}));
