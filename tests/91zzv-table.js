/* ══════════════ автотесты: пульт и стол (M151a) ══════════════ */
TEST_SUITES.push(()=>suite("стол: открывается поверх любого режима и возвращает туда же",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  tableToggle(false);
  const modes=["system","map","dock","landing","surface","cave","dig","belt","raid","base","barge","scoop"];
  for(const m of modes){
    G.mode=m;
    tableToggle(true);
    ok(document.getElementById("tablewin").classList.contains("open"),"стол открыт из режима "+m);
    eq(G.mode,m,"режим не изменился ("+m+")");
    tableToggle(false);
    ok(!document.getElementById("tablewin").classList.contains("open"),"стол закрыт, режим "+m+" на месте");
    eq(G.mode,m,"и после закрытия режим тот же ("+m+")");
  }
  G.mode="system";
}));

TEST_SUITES.push(()=>suite("тетрадь: у каждого голоса своя страница",()=>{
  resetWorld();
  G.log=[];G.logNew=0;G.logNewBy={};
  tableToggle(false);
  logAdd("tech","корпус залатан");
  logAdd("money","продано 10 железа");
  etherLine("…борт четыре-двенадцать, повторите высоту");
  peopleLine("лента хорошая, возьму","Стойка");
  eq(logPageOf("tech"),"bort","tech → БОРТ");
  eq(logPageOf("money"),"bort","money → БОРТ");
  eq(logPageOf("ether"),"ether","ether → ЭФИР");
  eq(logPageOf("talk"),"folk","talk → ЛЮДИ");
  eq(G.log.filter(x=>logPageOf(x.k)==="ether").length,1,"в ЭФИРЕ одна строка");
  eq(G.log.filter(x=>logPageOf(x.k)==="folk").length,1,"в ЛЮДЯХ одна строка");
  eq(G.log.filter(x=>logPageOf(x.k)==="bort").length,2,"на БОРТУ две");
  ok(G.log.find(x=>x.k==="talk").s.indexOf("Стойка")===0,"реплика подписана тем, кто сказал");
  eq(G.logNew,4,"непрочитанное считается, пока стол закрыт");
  tableToggle(true,"ether");
  eq(G.logNew,0,"открыли стол — счётчик обнулён");
  const rows=[...document.querySelectorAll("#loglist .li")];
  eq(rows.length,1,"на странице ЭФИР только эфир");
  ok(rows[0].textContent.indexOf("четыре-двенадцать")>=0,"и это та самая строка");
  tableSetTab("folk");
  eq(document.querySelectorAll("#loglist .li").length,1,"на ЛЮДЯХ — одна реплика");
  tableSetTab("bort");
  eq(document.querySelectorAll("#loglist .li").length,2,"на БОРТУ — две записи");
  tableToggle(false);
}));

TEST_SUITES.push(()=>suite("пульт: приёмник на каждом экране, строка эфира попадает на него",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  tableToggle(false);
  G.mode="system";hud();
  const con=document.getElementById("console");
  ok(!!con,"пульт есть");
  const r=con.getBoundingClientRect();
  ok(r.width>0&&r.height>0,"пульт виден в полёте");
  const rx=document.getElementById("rxKnob");
  ok(rx&&rx.getBoundingClientRect().height>=20,"ручка приёмника на пульте");
  etherLine("…частота занята. Частота занята.");
  eq(document.getElementById("rxLine").textContent,"…частота занята. Частота занята.","услышанное показано на пульте");
  ok(document.getElementById("rx").classList.contains("fresh"),"и помечено свежим");
  /* ручка крутится: частота сохраняется, диапазон меняется */
  rx.value=.49;rx.dispatchEvent(new Event("input"));
  ok(Math.abs(G.radioF-.49)<1e-6,"частота запомнена (G.radioF)");
  eq(document.getElementById("rxBand").textContent,"ЦЕНЫ","на 0.49 — диапазон цен");
  /* кресло пусто — не показывается; заняли — видно */
  consoleTick(1000);
  eq(document.getElementById("seat").style.display,"none","пустое кресло не рисуется");
  G.seat={name:"ВЕГА",line:"на борту",draw(){}};
  conT=0;consoleTick(1000);
  eq(document.getElementById("seat").style.display,"","занятое кресло видно");
  eq(document.getElementById("seatName").textContent,"ВЕГА","с именем");
  G.seat=null;conT=0;consoleTick(1000);
}));

TEST_SUITES.push(()=>suite("меню: пять дверей, журнал/отчёт/трепло ушли на стол и на пульт",()=>{
  resetWorld();
  const ids=[...document.querySelectorAll("#menu button")].map(b=>b.id);
  ok(ids.indexOf("tablebtn")>=0,"СТОЛ в меню");
  ok(ids.indexOf("logbtn")<0&&ids.indexOf("lorebtn")<0&&ids.indexOf("parrotbtn")<0,"ЖУРНАЛ, ОТЧЁТ и ТРЕПЛО из меню убраны");
  eq(ids.length,6,"в меню шесть дверей — прибавилась дорога (M168)");
  ok(ids.indexOf("roadbtn")>=0,"В ДОРОГУ на месте");
  ok(!document.getElementById("logwin")&&!document.getElementById("lorewin"),"старых окон нет");
  ok(!!document.getElementById("perch"),"жёрдочка для трепла на пульте");
}));

TEST_SUITES.push(()=>suite("вещи: полка на столе, новое светится до первого взгляда",()=>{
  resetWorld();
  G.things=[];tableToggle(false);
  const t=thingAdd("letter","Письмо на Урнейур","конверт, не читан");
  eq(tableNewThings(),1,"одна новая вещь");
  ok(document.querySelector("#tablebtn em i"),"на кнопке СТОЛ счётчик");
  tableToggle(true,"things");
  ok(document.querySelector("#loglist .thing"),"вещь лежит на столе");
  eq(tableNewThings(),0,"посмотрели — больше не новая");
  tableToggle(false);
  ok(!document.querySelector("#tablebtn em i"),"счётчик снят");
  G.things=[];
}));

TEST_SUITES.push(()=>suite("станция: ДОСКА у всех, очередь у стойки пишется в ЛЮДИ",()=>{
  resetWorld();
  const S=G.sys.station;ok(!!S,"станция есть");
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  ok(stTabsHere().indexOf("board")===0,"доска — первая вкладка станции");
  const btn=[...document.querySelectorAll("#stTabs button")].find(b=>b.dataset.tab==="board");
  ok(btn&&btn.style.display!=="none","кнопка ДОСКА показана");
  btn.click();
  eq(tab,"board","открылась доска");
  ok(document.querySelector("#stBody .sec"),"на доске есть разделы");
  closeStation();
}));
