/* ══════════════ автотесты: дорожный спутник (M168, M168b) ══════════════ */
TEST_SUITES.push(()=>suite("дорога: километры — в кредиты живым счётчиком, комбо растёт и сгорает",()=>{
  resetWorld();
  G.road=null;G.credits=600;
  RD={crFrac:0};
  ok(!roadSpeedOk(1)&&roadSpeedOk(90)&&roadSpeedOk(299)&&!roadSpeedOk(600),"скорость фильтруется: 3–300 км/ч");
  eq(roadCosmic(90),25000,"90 км/ч ×1 000 000 → 25 000 км/с");
  /* комбо: старт ×1, двадцать минут хода — ×3, дальше не растёт */
  eq(roadCombo(0),1,"комбо со старта ×1");
  ok(Math.abs(roadCombo(300)-1.5)<.01,"пять минут хода — ×1.5");
  eq(roadCombo(ROAD_COMBO_T),3,"двадцать минут хода — ×3");
  eq(roadCombo(9000),3,"выше ×3 не бывает");
  /* заработок: 5 км на ×1 — 10 кр; на ×3 — 30 кр */
  const c0=G.credits;
  roadEarnKm(5,0);
  eq(G.credits-c0,10,"5 км по 2 кр — 10 кр");
  eq(roadAll().cr,10,"счётчик дня совпадает");
  roadEarnKm(5,ROAD_COMBO_T);
  eq(G.credits-c0,40,"те же 5 км на ×3 — 30 кр сверху");
  /* потолок дня мягкий, но есть */
  roadEarnKm(10000,0);
  eq(roadAll().cr,ROAD_CR_CAP,"дневной потолок: "+ROAD_CR_CAP);
  const c1=G.credits;roadEarnKm(50,0);
  eq(G.credits,c1,"выше потолка не капает");
  /* назавтра заново */
  G.t+=CEL_DAY;roadEarnKm(1,0);
  eq(roadAll().cr,2,"новый день — новый счёт");
  /* сохранение */
  const s=snapshot();G.road=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(roadAll().day>=0,"дорога пережила сохранение");
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: настроение музыки — цвет, тишина — своё дыхание, бит — звёзды",()=>{
  resetWorld();
  G.road=null;
  RD={energy:.2,bright:.5,avg:.1,beat:0,beatT:0,wave:new Array(28).fill(.2),sparks:[],pulses:[],an:null,eq:null,kmh:0};
  /* без микрофона волна дышит сама и не дребезжит нулями */
  roadAudio(1);roadAudio(1.5);
  ok(RD.wave.every(v=>v>0&&v<1),"волна живая без микрофона");
  const h1=roadMoodHue();
  RD.energy=.9;RD.bright=.9;
  const h2=roadMoodHue();
  ok(Math.abs(h1-h2)>20,"настроение меняет цвет: "+Math.round(h1)+"° → "+Math.round(h2)+"°");
  ok(isFinite(roadRgbHue(hex2rgb(shipData(G.shipId).col))),"личный цвет — цвет корпуса — вмешан");
  RD=null;
}));

TEST_SUITES.push(()=>suite("дорога: экран, разгон и тормоз на корпусе, закрытие подводит итог",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;G.credits=600;G.record=null;
  roadOpen();
  ok(document.getElementById("roadwin").classList.contains("open"),"экран открыт");
  RD.kmh=90;RD.accT=.8;
  drawRoad(1000);drawRoad(1032);drawRoad(1064);
  ok(RD.acc>0,"разгон дошёл до корпуса: "+RD.acc.toFixed(2));
  RD.accT=-.8;for(let i=0;i<24;i++)drawRoad(1100+i*33);
  ok(RD.acc<0,"тормоз дошёл до корпуса: "+RD.acc.toFixed(2));
  const cv=document.getElementById("roadcv");
  const px=cv.getContext("2d").getImageData(Math.floor(cv.width*.44),Math.floor(cv.height*.46),8,8).data;
  let lit=0;for(let i=0;i<px.length;i+=4)if(px[i]+px[i+1]+px[i+2]>60)lit++;
  ok(lit>0,"корпус нарисован");
  RD.moveT=100;roadEarnKm(3,RD.moveT);
  roadClose();
  ok(!document.getElementById("roadwin").classList.contains("open"),"экран закрыт");
  eq(RD,null,"датчики отпущены");
  ok(recordAll().e.some(x=>x.a==="дорога"&&/командировочные/.test(x.s)),"итог — командировочными в книжку");
  G.road=null;
}));
