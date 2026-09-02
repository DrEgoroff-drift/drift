/* ══════════════ автотесты: три правки интерфейса с плейтеста 30.08 (M298) ══════════════ */
TEST_SUITES.push(()=>suite("интерфейс: стол отвечает, слух ведёт на карту, карта отдаёт небо",()=>{
  resetWorld();
  /* стол: зерно ответа движется с ходом, ответ — объект с line/silent */
  const st=routeTestStations(1)[0];
  if(st){G.sys=st;G.st=st.station;}
  G.tableN=0;const a=putOnTable("name",1);G.tableN=5;const b=putOnTable("name",1);
  ok(!!a&&"silent" in a&&!!b,"putOnTable отвечает объектом с line/silent");
  ok(typeof tableBlock==="function","стол рисуется");
  /* слух: адрес с расстоянием и прыжками; НА КАРТУ двигает окно и ставит круг */
  const q={sx:G.sx+19,sy:G.sy-3,rad:4};
  const w=rumourWhere(q);
  ok(/отсюда 19 секторов/.test(w)&&/прыжк/.test(w),"адрес слуха говорит, сколько это отсюда: "+w);
  G.mode="system";rumourToMap(q);
  ok(G.mode==="map"&&G.mapView&&G.mapView.x===q.sx&&G.mapView.y===q.sy,"НА КАРТУ: окно карты уехало к сектору слуха");
  ok(G.mapSearch&&G.mapSearch.rad===4&&G.sel.x===q.sx,"круг поиска поставлен, сектор выбран");
  ok(mapViewC().x===q.sx,"карта рисует вокруг окна, а не вокруг корабля");
  /* курс на ближний сектор окно не двигает */
  gotoSector(G.sx+1,G.sy,"");
  ok(G.mapView===null&&mapViewC().x===G.sx,"ближний курс — окно остаётся на корабле");
  /* уход с карты сбрасывает окно, подробности и чистое небо */
  G.mapView={x:9,y:9};G.mapMore=true;mapCleanSet(true);
  ok(G.mapClean===true&&document.body.classList.contains("mapclean"),"чистое небо: класс на body");
  mapReset();
  ok(!G.mapView&&!G.mapMore&&!G.mapClean&&!G.mapSearch&&!document.body.classList.contains("mapclean"),"mapReset снял всё");
  /* карта рисуется в обоих состояниях без исключений */
  G.mode="map";G.sel={x:G.sx,y:G.sy};
  let okDraw=true;
  try{drawMap();G.mapMore=true;drawMap();mapCleanSet(true);drawMap();}catch(e){okDraw=false;}
  mapReset();
  ok(okDraw,"карта рисуется: строка, подробнее, чистое небо");
}));
