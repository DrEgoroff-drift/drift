/* ══════════════ автотесты: дорожный спутник (M168) ══════════════ */
TEST_SUITES.push(()=>suite("дорога: скорость фильтруется, километры — в лёд, потолок в день",()=>{
  resetWorld();
  G.road=null;G.cargo.ice=0;G.record=null;
  ok(!roadSpeedOk(1)&&!roadSpeedOk(0),"стояние не считается");
  ok(roadSpeedOk(90)&&roadSpeedOk(299),"машина и поезд считаются");
  ok(!roadSpeedOk(600),"самолёт и подделка — нет");
  eq(roadCosmic(90),25000,"90 км/ч × 1 000 000 → 25 000 км/с");
  /* 5 км дороги → 5 льда в ожидании */
  roadAdvance(5);
  eq(roadPending(),5,"пять километров — пять единиц льда");
  eq(roadCollect(),5,"выдано в трюм");
  eq(G.cargo.ice,5,"лёд в трюме");
  ok(recordAll().e.some(x=>x.a==="дорога"),"запись в книжке");
  /* потолок: хоть 200 км — не больше 40 в день */
  roadAdvance(200);
  eq(roadPending(),35,"за день не больше "+ROAD_ICE_CAP);
  roadCollect();
  eq(G.cargo.ice,40,"потолок дня");
  roadAdvance(30);
  eq(roadPending(),0,"дальше сегодня не капает");
  /* назавтра — заново */
  G.t+=CEL_DAY;roadAdvance(3);
  eq(roadPending(),3,"новый день — новый счёт");
  /* сохранение */
  const s=snapshot();G.road=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(roadAll().day>=0,"дорога пережила сохранение");
  /* экономика не подрывается: 40 льда — это мелочь */
  ok(ROAD_ICE_CAP*RES.ice.price<=300,"потолок дня — не больше ~300 кр: радость, не источник");
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: экран открывается из меню, корабль рисуется, закрытие собирает лёд",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;G.cargo.ice=0;
  roadOpen();
  ok(document.getElementById("roadwin").classList.contains("open"),"экран открыт");
  ok(!!RD,"состояние поездки живо");
  RD.kmh=90;
  drawRoad(1000);drawRoad(1032);
  const cv=document.getElementById("roadcv");
  ok(cv.width>0,"канва в размере");
  /* корабль в кадре: в центре есть непустые пиксели */
  const px=cv.getContext("2d").getImageData(Math.floor(cv.width*.44),Math.floor(cv.height*.46),8,8).data;
  let lit=0;for(let i=0;i<px.length;i+=4)if(px[i]+px[i+1]+px[i+2]>60)lit++;
  ok(lit>0,"корпус нарисован в центре");
  roadAdvance(3);
  roadClose();
  ok(!document.getElementById("roadwin").classList.contains("open"),"экран закрыт");
  eq(RD,null,"датчики отпущены");
  eq(G.cargo.ice,3,"лёд собран при выходе");
  G.road=null;
}));
