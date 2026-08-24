/* ══════════════ автотесты: дорожный спутник (M168, M168b) ══════════════ */
TEST_SUITES.push(()=>suite("дорога: километры — в кредиты живым счётчиком, комбо растёт и сгорает",()=>{
  resetWorld();
  G.road=null;G.credits=600;
  RD={crFrac:0};
  ok(!roadSpeedOk(1)&&roadSpeedOk(90)&&roadSpeedOk(299)&&roadSpeedOk(850)&&!roadSpeedOk(1200),"скорость фильтруется: 3–1000 км/ч");
  /* градации: машина, поезд, самолёт */
  eq(roadTier(90),1,"90 км/ч — ДОРОГА");
  eq(roadTier(199),1,"199 — ещё машина");
  eq(roadTier(250),2,"250 — ЭКСПРЕСС: поезд");
  eq(roadTier(400),2,"400 — всё ещё поезд");
  eq(roadTier(850),3,"850 — ГИПЕРДРАЙВ: самолёт");
  eq(roadTier(1200),0,"1200 — не верим");
  ok(Math.abs(roadLightFrac(850)-.787)<.01,"850 км/ч после ×1e6 — 0.79 световой: "+roadLightFrac(850).toFixed(2));
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
  /* назавтра заново: день календарный, поэтому двигаем отметку дня, а не G.t */
  roadAll().day=-1;roadEarnKm(1,0);
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
  /* корпус ездит по вертикали: разгон тянет его вверх, тормоз вниз (M168e).
     Поэтому проба берётся ВОКРУГ его нынешнего места, а не вокруг середины
     экрана — иначе тест проверяет пустое небо над затормозившим кораблём */
  const cy=Math.floor(cv.height*.5+(RD.yOff||0));
  const y0=clamp(cy-60,0,cv.height-1), hh=Math.min(120,cv.height-y0);
  const px=cv.getContext("2d").getImageData(Math.floor(cv.width*.5)-4,y0,8,hh).data;
  let lit=0;for(let i=0;i<px.length;i+=4)if(px[i]+px[i+1]+px[i+2]>60)lit++;
  ok(lit>0,"корпус нарисован");
  RD.moveT=100;roadEarnKm(3,RD.moveT);
  roadClose();
  ok(!document.getElementById("roadwin").classList.contains("open"),"экран закрыт");
  eq(RD,null,"датчики отпущены");
  ok(recordAll().e.some(x=>x.a==="дорога"&&/командировочные/.test(x.s)),"итог — командировочными в книжку");
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: кривой держатель снят автонулём, поворот меряется рысканием",()=>{
  resetWorld();
  G.road=null;
  const G0=9.80665;
  /* лента синтетических событий датчика: держатель стоит как задано, машина
     едет как задано. Пятьдесят миллисекунд на событие — двадцать герц */
  const feed=(n,v,rot)=>{for(let i=0;i<n;i++)roadOnShake({interval:50,
    accelerationIncludingGravity:{x:v[0],y:v[1],z:v[2]},rotationRate:rot||null});};
  const mount=deg=>{const a=deg*Math.PI/180;return [-G0*Math.sin(a),G0*Math.cos(a),0];};
  const push=(base,deg,acc)=>{const a=deg*Math.PI/180;return [base[0]+acc*Math.cos(a),base[1]+acc*Math.sin(a),base[2]];};
  const start=kmh=>{RD={kmh,shake:0,kick:0,turn:0,turnT:0,g0:null,g0T:0};};
  /* ── ровный держатель, прямая дорога ── */
  start(60);feed(120,mount(0));
  ok(Math.abs(RD.turnT)<.03,"ровно и прямо — поворота нет: "+RD.turnT.toFixed(3));
  /* ── скошенный на 15°: 9.81·sin15° = 2.54 м/с², это 0.26 g — БОЛЬШЕ, чем
     стоит спокойный городской поворот. Без автонуля корпус висел бы у края ── */
  start(60);feed(120,mount(15));
  ok(Math.abs(RD.turnT)<.06,"перекос 15° снят автонулём: "+RD.turnT.toFixed(3));
  start(60);feed(120,mount(-25));
  ok(Math.abs(RD.turnT)<.06,"перекос -25° снят автонулём: "+RD.turnT.toFixed(3));
  /* ── и на этом же кривом держателе настоящий поворот виден целиком ──
     левый поворот: поперечное смотрит влево, корпус уходит НАПРАВО */
  start(60);feed(120,mount(15));
  feed(20,push(mount(15),15,-.30*G0));
  ok(RD.turnT>.9,"поворот 0.30 g на кривом держателе — полный отброс: "+RD.turnT.toFixed(2));
  feed(20,push(mount(15),15,+.30*G0));
  ok(RD.turnT<-.9,"в другую сторону — симметрично: "+RD.turnT.toFixed(2));
  /* ── база не учится в повороте: полминуты дуги не должны её «съесть» ── */
  start(60);feed(120,mount(0));
  feed(600,push(mount(0),0,-.30*G0));
  ok(RD.turnT>.9,"тридцать секунд дуги — поворот не съеден базой: "+RD.turnT.toFixed(2));
  /* ── одно рыскание, без поперечного: гироскоп считает по a=v·ω ──
     100 км/ч и 4°/с — дуга шоссе: 27.8·0.0698 = 1.94 м/с², две трети шкалы */
  start(100);feed(120,mount(0));
  feed(20,mount(0),{alpha:0,beta:0,gamma:4});
  ok(RD.turnT>.5&&RD.turnT<.95,"дуга шоссе по гироскопу — корпус вправо: "+RD.turnT.toFixed(2));
  /* ── мёртвая зона: подруливание и швы асфальта корпус не двигают ── */
  start(60);feed(120,mount(0));
  feed(20,push(mount(0),0,.03*G0));
  eq(RD.turnT,0,"0.03 g — мёртвая зона, корпус стоит");
  /* ── телефон лёг набок: экранная ось X у вертикали, гироскопа нет —
     честно молчим, а не выдумываем поворот ── */
  start(60);feed(120,[G0*.9,0,0]);
  ok(RD.blind,"ось X у вертикали и без гироскопа — поворот не читается");
  /* ── а с гироскопом та же поза читается: рысканию всё равно, как воткнут ── */
  start(60);feed(120,[G0*.9,0,0],{alpha:0,beta:0,gamma:0});
  feed(20,[G0*.9,0,0],{alpha:0,beta:20,gamma:0});
  ok(!RD.blind&&Math.abs(RD.turnT)>.3,"лежащий набок телефон: поворот берётся с гироскопа: "+RD.turnT.toFixed(2));
  /* ── тряска: ровный асфальт не держит её в полке, яма даёт удар ── */
  start(60);feed(120,mount(0));
  for(let i=0;i<60;i++)feed(1,[Math.sin(i)*.25,G0+Math.cos(i*1.7)*.25,0]);
  ok(RD.shake<.2,"ровный ход — тряска почти ноль: "+RD.shake.toFixed(2));
  feed(3,[0,G0+5,0]);
  ok(RD.kick>0,"яма даёт удар: "+RD.kick.toFixed(2));
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: микрофон отдельным согласием — иначе Android Auto глушит музыку",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;
  const b=document.getElementById("roadSense");
  roadOpen();
  eq(b.textContent,"РАЗРЕШИТЬ ДАТЧИКИ","до согласия кнопка просит датчики");
  /* датчики берут GPS, движение и Wake Lock — и НЕ трогают микрофон: голова
     машины видит открытый захват и решает, что идёт разговор */
  roadSensorsOn();
  eq(RD.an,null,"датчики микрофон не открывают");
  eq(RD.stream,undefined,"и потока нет");
  eq(b.textContent,"СЛУШАТЬ МУЗЫКУ","кнопка называет следующее действие");
  ok(!roadAll().mic,"по умолчанию микрофона нет");
  /* включённым он помнится и гасится одним нажатием прямо на ходу */
  RD.an={};RD.stream=null;roadAll().mic=1;roadSenseBtn();
  eq(b.textContent,"ВЫКЛЮЧИТЬ МИКРОФОН","когда слушает — кнопка гасит");
  roadMicOff();
  eq(RD.an,null,"погашен");
  eq(roadAll().mic,0,"и выбор запомнен");
  eq(b.textContent,"СЛУШАТЬ МУЗЫКУ","кнопка вернулась к предложению");
  /* выбор переживает сохранение вместе с остальной дорогой */
  roadAll().mic=1;
  const s=snapshot();G.road=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(roadAll().mic,1,"выбор про микрофон пережил сохранение");
  roadAll().mic=0;
  roadClose();
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: тихий сырой микрофон нормируется, гарнитуру не берём, тормоз видно",()=>{
  resetWorld();
  G.road=null;
  /* ── программное автоусиление: сырой захват тихий, но музыка должна дышать ──
     эмулируем анализатор: тихий фон 14/255, каждый тридцатый кадр — всплеск ×3 */
  RD={energy:.1,bright:.5,avg:.1,beat:0,beatT:0,pk:0,wave:new Array(28).fill(.2),
      sparks:[],pulses:[],kmh:60,eq:new Uint8Array(128),an:null};
  let n=0;
  RD.an={getByteFrequencyData:a=>{n++;const v=n%30===0?46:14;for(let i=0;i<a.length;i++)a[i]=v;}};
  for(let i=0;i<600;i++)roadAudio(i/60);
  ok(RD.energy>.35,"тихий микрофон, а энергия дышит: "+RD.energy.toFixed(2));
  ok(RD.beatT>0,"бит пробился сквозь тихий уровень");
  /* ── выбор микрофона: гарнитура Bluetooth глушит музыку всей машине ── */
  const list=[
    {kind:"audioinput",deviceId:"default",label:"По умолчанию — Car Bluetooth Handsfree"},
    {kind:"audioinput",deviceId:"bt1",label:"Car Multimedia Bluetooth hands-free"},
    {kind:"audioinput",deviceId:"ph1",label:"Микрофон телефона (нижний)"},
    {kind:"videoinput",deviceId:"cam",label:"Камера"}];
  eq(roadMicPick(list,"Car Multimedia Bluetooth hands-free"),"ph1","с гарнитуры уходим на телефонный");
  eq(roadMicPick(list,"Микрофон телефона (нижний)"),null,"телефонный не трогаем");
  eq(roadMicPick([{kind:"audioinput",deviceId:"bt1",label:"BT headset"}],"BT headset"),null,
     "если кроме гарнитуры ничего нет — остаёмся на ней");
  /* ── тормоз видно: два холодных факела от носа ── */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  roadOpen();
  if(RD.raf)cancelAnimationFrame(RD.raf);RD.raf=0;
  RD.kmh=0;RD.shake=0;
  const cv=document.getElementById("roadcv"),cc=cv.getContext("2d");
  const hh=hullOf(G.shipId),scK=Math.min(cv.width/(hh.bw*5.2),cv.height/(hh.len*2.4))*.46;
  const probe=()=>{
    const y0=Math.max(0,Math.floor(cv.height*.5-hh.nose*scK-cv.height*.12)),
          y1=Math.floor(cv.height*.5-hh.nose*scK*.45);
    const d=cc.getImageData(Math.floor(cv.width*.5)-70,y0,140,Math.max(4,y1-y0)).data;
    let lit=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>150)lit++;
    return lit;
  };
  RD.acc=0;RD.accT=0;drawRoad(5000);drawRoad(5000.02);
  const base=probe();
  RD.acc=-1;RD.accT=-1;drawRoad(5000.04);
  const braked=probe();
  ok(braked>base+30,"тормозные факелы у носа зажглись: "+base+" → "+braked);
  /* рекорд поездки пишется из GPS */
  roadOnPos({coords:{latitude:55.7,longitude:37.6,speed:16.7,accuracy:5},timestamp:1000});
  roadOnPos({coords:{latitude:55.701,longitude:37.6,speed:25,accuracy:5},timestamp:6000});
  ok(RD.vmax>80,"макс скорость поездки записана: "+Math.round(RD.vmax)+" км/ч");
  roadClose();
  G.road=null;
}));
