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
  /* На телефоне ручка живёт в развёрнутом приёмнике (.sheet), а в свёрнутом
     её нет по замыслу M167: полосу занимала бы шкала, а не строка эфира.
     Проверка про то, что ручка ДОСТУПНА, а не про то, что она всегда видна. */
  if(document.body.classList.contains("mobile")){
    document.getElementById("rx").classList.add("sheet");
    ok(rx&&rx.getBoundingClientRect().height>=20,"на телефоне ручка в развёрнутом приёмнике");
    document.getElementById("rx").classList.remove("sheet");
  }else ok(rx&&rx.getBoundingClientRect().height>=20,"ручка приёмника на пульте");
  tableToggle(false);
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

/* Стол стал бумагой (релизный вид, A3). Проверяем не «красиво», а три вещи,
   на которых держится замысел: лист — это страница, а не полоска под текстом;
   на бумаге чернила, а не фосфор; вещи и ленты лежат на дереве, а не на листе
   (бумага на бумаге не читается). */
TEST_SUITES.push(()=>suite("стол: бумага, а не окно списков",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  tableToggle(true,"ether");
  const box=document.getElementById("loglist");
  ok(document.body.classList.contains("table"),"стол открыт");
  ok(!box.classList.contains("desk"),"тетрадь лежит на листе");
  const cs=getComputedStyle(box);
  ok(cs.backgroundImage&&cs.backgroundImage!=="none","у листа есть бумага");
  ok(box.getBoundingClientRect().height>200,
     "лист — страница, а не полоска ("+Math.round(box.getBoundingClientRect().height)+")");
  logAdd("ether","проба пера");
  tableRender();
  const li=box.querySelector(".li span");
  ok(!!li,"строка на листе есть");
  if(li){
    const c=(getComputedStyle(li).color.match(/\d+/g)||[0,0,0]).map(Number);
    ok(c[0]+c[1]+c[2]<340,"на бумаге чернила тёмные, а не фосфор ("+c.join(",")+")");
  }
  tableSetTab("things");
  ok(box.classList.contains("desk"),"вещи лежат на дереве");
  tableSetTab("strips");
  ok(box.classList.contains("desk"),"ленты тоже");
  tableSetTab("ether");
  ok(!box.classList.contains("desk"),"а тетрадь снова на листе");
  tableToggle(false);
  ok(!document.body.classList.contains("table"),"и стол закрывается");
}));

/* Трюм как раскладка (M179): кучи вместо строк. Проверяем устройство:
   куча растёт с числом единиц, пустые ресурсы не рисуются, вкладка лежит
   на дереве (desk), и у каждой карточки есть канва с кучей и подпись. */
TEST_SUITES.push(()=>suite("стол: трюм разложен кучами",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  ok(holdPileN(1)===1,"одна единица — один предмет");
  ok(holdPileN(14)>holdPileN(3),"куча растёт с числом");
  ok(holdPileN(500)<=16,"и не превращается в кашу");
  G.cargo.ice=9;G.cargo.crystal=2;G.cargo.missile=3;
  tableToggle(true,"hold");
  const box=document.getElementById("loglist");
  ok(box.classList.contains("desk"),"трюм лежит на дереве");
  /* раскладка комплекта (M216) — своя, широкая карточка, и она НЕ ресурс:
     считаем груз отдельно от того, что на себе */
  const wide=box.querySelectorAll(".thing.wide");
  eq(wide.length,1,"комплект лежит одной раскладкой, а не шестью карточками");
  const cards=box.querySelectorAll(".thing:not(.wide)");
  eq(cards.length,3,"карточка на каждый ненулевой ресурс");
  let okAll=true;
  cards.forEach(cd=>{
    if(!cd.querySelector("canvas")||!cd.querySelector(".nm b"))okAll=false;
  });
  ok(okAll,"в каждой карточке куча и подпись");
  ok([...cards].some(cd=>/Лёд × 9/.test(cd.textContent)),"число единиц в подписи");
  G.cargo.ice=0;G.cargo.crystal=0;G.cargo.missile=0;
  tableRender();
  /* пустой трюм — пустых карточек груза нет. А комплект остаётся: скафандр на
     тебе и тогда, когда везти нечего, и «на себе» это не про груз (M216) */
  eq(box.querySelectorAll(".thing:not(.wide)").length,0,"пустой трюм — ни одной карточки груза");
  eq(box.querySelectorAll(".thing.wide").length,1,"а комплект на месте: он не груз");
  tableToggle(false);
}));

/* ══════════════ огонёк: «пришло» ≠ «не прочитано» ══════════════
   Автор, 2026-08-26: «на столе чтобы не случилось в меню огонёк, он типо
   всегда горит и соответственно не работает». Огонёк считал вещи с !seen —
   то есть всё, что не открыто поштучно, — и потому горел всегда. Сторож
   держит разведённые понятия: огонёк гаснет от ВИЗИТА, сургучная точка на
   предмете — только от чтения самого предмета. */
TEST_SUITES.push(()=>suite("стол: огонёк гаснет от визита, а не от чтения",()=>{
  resetWorld();
  tableToggle(false);
  const mb=document.getElementById("menubtn");
  G.things=[];G.log=[];G.logNew=0;G.logNewBy={};G.tableSeen=Date.now();
  logBtnLabel();
  ok(!mb.classList.contains("on"),"на чистом столе огонёк не горит");

  thingAdd("paper","Накладная","на предъявителя");
  ok(mb.classList.contains("on"),"пришла бумага — огонёк зажёгся");
  eq(tableNewThings(),1,"и это одна новость");
  eq(tableNewBy("things"),1,"закладка ВЕЩИ говорит, где смотреть");

  /* Визит — и всё: игрок подошёл к столу, значит увидел, что там лежит.
     Открывать каждую бумагу его никто не обязывал. Нарочно заходим НЕ на
     вещи, а на эфир: так проверяется само разделение — огонёк про визит,
     сургучная точка про взгляд на саму бумагу. */
  tableToggle(true,"ether");
  /* пока стол открыт, счётчик закладки держится: иначе открывший стол игрок
     не узнает, на какой полке новость */
  eq(tableNewBy("things"),1,"пока стол открыт, закладка ещё помнит новость");
  tableToggle(false);
  logBtnLabel();
  ok(!mb.classList.contains("on"),"после визита огонёк погас");
  eq(tableNewThings(),0,"новостей больше нет");

  /* А сургучная точка — своя жизнь: на полку вещей не заходили, метка стоит. */
  ok(!G.things[0].seen,"непрочитанная бумага осталась непрочитанной");

  /* И зажигается снова только от НОВОГО прихода. */
  thingAdd("letter","Письмо","от кого-то");
  ok(mb.classList.contains("on"),"следующий приход зажигает снова");
  eq(tableNewThings(),1,"ровно одна новость, а не две");
  tableToggle(true);tableToggle(false);logBtnLabel();
  ok(!mb.classList.contains("on"),"и снова гаснет");

  /* Старое сохранение без отметки не должно зажигать огонёк на сорока
     давно лежащих бумагах — applySave подставляет «видел всё до сих пор». */
  const s=snapshot();delete s.tableSeen;
  applySave(s);
  ok((G.tableSeen|0)>0,"запись без отметки грузится как «стол видели»");
  logBtnLabel();
  ok(!mb.classList.contains("on"),"и огонёк после такой загрузки молчит");
  tableToggle(false);
}));

/* Внутренние ключи не должны просачиваться в интерфейс. В шапке стола
   печаталось `G.mode` как есть, и игрок читал «Нейэль · system» — английское
   слово из кода в русской игре. Сторож проверяет все режимы разом: появится
   новый и его забудут вписать — шапка обязана промолчать, а не выдать ключ. */
TEST_SUITES.push(()=>suite("стол: в шапке нет ключей из кода",()=>{
  resetWorld();
  const modes=["system","map","landing","surface","cave","dig","belt","scoop",
               "base","homein","raid","dock","road"];
  const noRu=modes.filter(m=>!/[а-яё]/i.test(MODE_RU[m]||""));
  eq(noRu.join(", "),"","у каждого режима есть русское имя");
  const was=G.mode;
  const leaks=[];
  for(const m of modes){
    G.mode=m;
    const t=modeRu();
    if(/[a-z]/i.test(t))leaks.push(m+"→"+t);
  }
  /* и выдуманный режим: имени нет — значит и строки нет */
  G.mode="somethingNew";
  eq(modeRu(),"","незнакомый режим молчит, а не печатает свой ключ");
  G.mode=was;
  eq(leaks.join(", "),"","ни одно имя не содержит латиницы");
}));
TEST_SUITES.push(()=>suite("стол: по бумаге с адресом штурман кладёт курс",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  /* внешний плейтест, пункт 5: «зачем лететь» жило внутри станции. Стол помнит
     цены и нужды, но с ними нельзя было ничего сделать — адрес приходилось
     запоминать глазами. Тот же жест, что у дел: тычок по строке ставит курс */
  G.seenPrices={};
  G.seenPrices["3,-2"]={sx:3,sy:-2,name:"Проверочная",day:celDay(),
                        p:{ice:22,iron:15},need:"ice"};
  tableToggle(true,"prices");
  const box=document.getElementById("loglist");
  const rows=[...box.querySelectorAll(".li")].filter(r=>r.onclick);
  ok(rows.length>=1,"у строки с адресом есть ход");
  G.mode="system";G.sel={x:0,y:0};
  rows[0].onclick();
  eq(G.sel.x,3,"курс лёг на тот сектор");
  eq(G.sel.y,-2,"и по второй оси");
  eq(G.mode,"map","и штурман открыт");
  /* и НИЧЕГО над миром: маркеров плейтест как раз просил не заводить */
  ok(!G.quests||!G.quests.some(q=>q.ru==="Проверочная"),"курс не завёл дела");
  ok(!document.querySelector("#prompt")||
     !/ЦЕН|ПРОВЕРОЧН/i.test(document.getElementById("prompt").textContent||""),
     "и подсказка над миром не позвала");
  /* запись без адреса не роняет и не врёт */
  ok(gotoSector(null,null,"без адреса")===false,"без адреса курс не кладётся");
  G.mode="system";
  tableToggle(false);
}));
