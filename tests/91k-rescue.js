/* ══════════════ пустой бак: хода нет, но выход есть всегда (16c, плейтест 11.09) ══════════════
   Автор 11.09: «топливо кончилось — всё, начинай сначала… где кнопка буксир?». Буксир жил
   строкой подсказки, маяк — только на станции. Теперь газ на пустом баке открывает окно с
   тремя выходами: ДОМОЙ (цена растёт от прыжков), БУКСИР (настоящая баржа, пять минут),
   СБРОС («Стриж» у станции). Проверяем то, чего не видел ни один прежний набор: что игрок,
   нажавший газ, получает ответ, и что из любого положения есть ход. */
TEST_SUITES.push(()=>suite("пустой бак: газ открывает окно, в нём домой, буксир и сброс",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=3;G.sys=getSystem(5,3);G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.fuel=0;G.credits=0;
  const sos=document.getElementById("sos");
  ok(!sos.classList.contains("open"),"до газа окна нет");
  dispatchEvent(new KeyboardEvent("keydown",{key:"w",code:"KeyW"}));
  updateSystem(1);
  dispatchEvent(new KeyboardEvent("keyup",{key:"w",code:"KeyW"}));
  ok(sos.classList.contains("open"),"газ на пустом баке открыл окно");
  const ids=[...document.querySelectorAll("#sosList button")].map(b=>b.dataset.id);
  eq(ids.join(","),"home,tow,reset","три выхода по порядку: "+ids.join(","));
  const home=document.querySelector('#sosList button[data-id="home"]');
  ok(home.disabled,"ДОМОЙ без денег не нажать — и сказано, сколько не хватает: "+home.textContent);
  ok(!document.querySelector('#sosList button[data-id="tow"]').disabled,"БУКСИР даром — нажимается всегда");
  ok(/5 минут/.test(document.querySelector('#sosList button[data-id="tow"]').textContent),"буксир говорит, сколько ждать");
  toggleSos(false);

  /* закрыл — газ сразу не открывает снова, иначе окно не убрать */
  G.t+=1;
  dispatchEvent(new KeyboardEvent("keydown",{key:"w",code:"KeyW"}));
  updateSystem(1);
  dispatchEvent(new KeyboardEvent("keyup",{key:"w",code:"KeyW"}));
  ok(!sos.classList.contains("open"),"закрытое окно не прыгает обратно на том же нажатии");
  G.t+=RESCUE_ASK_GAP+1;
  dispatchEvent(new KeyboardEvent("keydown",{key:"w",code:"KeyW"}));
  updateSystem(1);
  dispatchEvent(new KeyboardEvent("keyup",{key:"w",code:"KeyW"}));
  ok(sos.classList.contains("open"),"новое нажатие газа — окно снова");
  toggleSos(false);
}));

TEST_SUITES.push(()=>suite("пустой бак: буксир — настоящая баржа и пять минут без руля",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=3;G.sys=getSystem(5,3);G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.fuel=0;G.credits=0;
  const dest=nearestStation(5,3),ship0=G.shipId;
  ok(rescueTake("tow"),"буксир берётся даром");
  ok(G.tow&&G.tow.ph==="come","баржа идёт к нам");
  const d0=Math.hypot(G.tow.bx-G.ship.x,G.tow.by-G.ship.y);
  for(let i=0;i<60;i++)towTick(10,G.ship);
  ok(Math.hypot(G.tow.bx-G.ship.x,G.tow.by-G.ship.y)<d0,"баржа приближается");
  /* штурвал молчит: газ не двигает корабль, пока тащат */
  G.fuel=50;
  dispatchEvent(new KeyboardEvent("keydown",{key:"w",code:"KeyW"}));
  updateSystem(1);
  dispatchEvent(new KeyboardEvent("keyup",{key:"w",code:"KeyW"}));
  ok(G.ship.vx===0&&G.ship.vy===0,"пока тащат, газ корабль не разгоняет");
  ok(/БУКСИР/.test(G.prompt)&&/\d+:\d\d/.test(G.prompt),"подсказка говорит, что идёт и сколько осталось: "+G.prompt);
  G.fuel=0;
  let n=0;while(G.tow&&n<2000){towTick(60,G.ship);n++;}
  ok(!G.tow,"буксир кончается сам");
  ok(n*60>=TOW_COME+TOW_HAUL-600,"и не раньше пяти минут: "+Math.round(n*60/60)+" с");
  eq(G.sx+","+G.sy,dest.sx+","+dest.sy,"дотащил в систему со станцией");
  ok(G.fuel>=Math.min(stat().fuelMax,RESCUE_FUEL),"в баке хватает дойти до причала: "+G.fuel);
  eq(G.shipId,ship0,"корабль свой, ничего не потеряно");
}));

TEST_SUITES.push(()=>suite("пустой бак: сброс берёт корабль, но не деньги и не дом",{tier:"browser"},()=>{
  resetWorld();
  const big=Object.keys(SHIPS).find(k=>k!=="strizh");
  G.owned[big]=true;G.shipId=big;
  G.mode="system";G.sx=5;G.sy=3;G.sys=getSystem(5,3);
  G.fuel=0;G.credits=777;G.cargo.iron=5;
  ok(rescueTake("reset"),"сброс берётся");
  eq(G.shipId,"strizh","выдан «Стриж»");
  ok(!G.owned[big],"прежний корабль потерян");
  eq(G.cargo.iron,0,"груз ушёл вместе с ним");
  eq(G.credits,777,"деньги целы");
  eq(G.fuel,stat().fuelMax,"бак у «Стрижа» полный");
  ok(!!nearestStation(G.sx,G.sy).station&&G.sys.station,"стоим у станции");
}));

TEST_SUITES.push(()=>suite("домой: цена растёт от прыжков и остывает только от игры",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";G.sx=6;G.sy=2;G.sys=getSystem(6,2);
  eq(rescueHomeCost(),HOME_JUMP_BASE,"первый прыжок почти даром");
  G.credits=1e6;G.fuel=0;
  ok(rescueTake("home"),"прыжок с пустым баком");
  eq(G.homeJumps,HOME_EMPTY,"с пустым баком счётчик +1");
  eq(rescueHomeCost(),HOME_JUMP_BASE*2,"второй вдвое дороже");
  G.sx=6;G.sy=2;G.sys=getSystem(6,2);G.fuel=100;
  ok(rescueTake("home"),"прыжок из меню, с топливом — как такси");
  eq(G.homeJumps,HOME_EMPTY+HOME_TAXI,"такси стоит +2");
  G.homeJumps=17;
  ok(rescueHomeCost()>1e6,"к восемнадцатому прыжку — больше миллиона: "+rescueHomeCost());
  /* остывание — от активной игры: простой не считается */
  G.homeJumps=3;G.homeActMs=HOME_COOL_MS-5;G.running=true;
  rescueInputT=wallMs()-120000;rescueBeatT=wallMs()-30;
  rescueActivityBeat();
  eq(G.homeJumps,3,"без ввода минута не активная — счётчик стоит");
  rescueInputT=wallMs();rescueBeatT=wallMs()-30;
  rescueActivityBeat();
  eq(G.homeJumps,2,"активные 45 минут сняли один прыжок");
  /* счётчик переживает сохранение */
  G.homeJumps=4.5;G.homeActMs=1234;
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.homeJumps=0;G.homeActMs=0;
  applySave(s);
  eq(G.homeJumps,4.5,"счётчик прыжков сохранился");
  eq(G.homeActMs,1234,"и накопленная игра тоже");
}));
