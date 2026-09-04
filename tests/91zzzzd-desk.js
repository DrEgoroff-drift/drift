/* ══════════════ стол как стол ══════════════
   M288. Восемнадцать закладок в одной ленте были не решением, а осадком: по
   одной за веху, и каждая права поодиночке. Автор выбрал вернуть замысел
   M151a — вещи на досках, а закладки только внутри вещи. Сторожится ровно
   это: стол открывается собой, чужих закладок в ленте нет, а вещь, которой у
   игрока не завелось, на столе не лежит. */
TEST_SUITES.push(()=>suite("стол: открывается столом, а не закладкой",()=>{
  resetWorld();
  /* соседние наборы могли оставить снимки: проверяем правило, а не остаток */
  G.album=[];G.strips=[];G.things=[];
  tableToggle(false);
  tableToggle(true);
  eq(tableTab,"top","стол открылся собой");
  const strip=document.getElementById("tableTabs");
  eq(strip.style.display,"none","ленты закладок на столе нет");
  eq(document.getElementById("tableBack").style.display,"none","и возвращаться некуда");
  const items=[...document.querySelectorAll("#loglist .item")];
  ok(items.length>=4,"на столе лежат вещи ("+items.length+")");
  /* у каждой вещи есть рисунок и имя */
  ok(items.every(e=>e.querySelector("canvas")&&e.querySelector("em")),
     "у каждой вещи свой рисунок и своё имя");
  /* вещь, которой нет, не лежит: альбом заводится с первым снимком */
  const names=items.map(e=>e.querySelector("em").textContent).join("|");
  ok(names.indexOf("АЛЬБОМ")<0,"пустого альбома на столе нет");
  ok(names.indexOf("ТЕТРАДЬ")>=0&&names.indexOf("ДЕЛА")>=0,"а тетрадь и дела есть всегда");
  tableToggle(false);
}));

TEST_SUITES.push(()=>suite("стол: внутри вещи только её закладки",()=>{
  resetWorld();
  tableToggle(true);
  const it=[...document.querySelectorAll("#loglist .item")]
    .find(e=>e.querySelector("em").textContent==="ТЕТРАДЬ");
  ok(!!it,"тетрадь на столе");
  it.onclick();
  eq(tableTab,"ether","тычок открыл первую её закладку");
  const strip=document.getElementById("tableTabs");
  const shown=[...strip.querySelectorAll("button")]
    .filter(b=>b.style.display!=="none").map(b=>b.dataset.tab);
  eq(shown.join(","),"ether,bort,folk","в ленте ровно три закладки тетради");
  eq(document.getElementById("tableBack").style.display,"","и есть дорога назад");
  /* назад — на стол, а не из стола */
  document.getElementById("tableBack").click();
  eq(tableTab,"top","«← СТОЛ» вернул на стол");
  ok(tableIsOpen(),"и стол при этом не закрылся");
  /* у вещи с одной закладкой ленты нет вовсе: выбирать не из чего */
  tableSetTab("deeds");
  eq(strip.style.display,"none","у ДЕЛ ленты нет — она была бы лентой из одной кнопки");
  tableToggle(false);
}));

TEST_SUITES.push(()=>suite("стол: рейсы ушли в ДЕЛО, рисунки не падают",()=>{
  resetWorld();
  const now=Date.now();
  G.drones=[{id:1,sx:G.sx,sy:G.sy,pi:0,res:"titan",rate:1,pool:100,soldAtMs:now,
             t0:now,lastMs:now,bornMs:now,trips:0,down:0,sold:0,earned:0}];
  tableToggle(true);
  const names=[...document.querySelectorAll("#loglist .item")]
    .map(e=>e.querySelector("em").textContent);
  ok(names.indexOf("РЕЙСЫ")<0,"рейсов на столе нет — они в ДЕЛЕ (M286)");
  ok(!document.querySelector('#tableTabs button[data-tab="fleet"]'),
     "и самой закладки в разметке больше нет");
  /* каждый рисунок должен пережить вызов: пустой стол не имеет права падать */
  let bad="";
  const c=document.createElement("canvas").getContext("2d");
  for(const it of DESK_ITEMS){
    try{DESK_DRAW[it.id](c,150,96);}catch(e){bad+=it.id+" ";}
    if(!DESK_DRAW[it.id])bad+=it.id+"(нет) ";
  }
  eq(bad.trim(),"","все двенадцать вещей рисуются без исключений");
  tableToggle(false);
  G.drones=[];
}));

/* ══════════════ ОПИСЬ (M341): один стол для того, что на тебе и в трюме ══════════════
   Что на тебе, что в трюме, что снято — одно сукно с четырьмя зонами; сравнение
   живёт в панели ПРИБОРЫ, а не на карточках; люк отдаёт спички; людей за борт
   не выбрасывают; накладной на столе больше нет. */
TEST_SUITES.push(()=>suite("опись: четыре зоны, части ставятся кнопкой, люк отдаёт спички",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.cargo.iron=12;G.cargo.ice=3;G.cargo.folk=2;G.matches=0;
  const slots=slotsOf(G.shipId);
  const kind=slots.find(k=>k!=="missile")||slots[0];
  const p4=addPart(genPart(4401,4,"engine"));
  const p1=addPart(genPart(4402,1,kind));
  tableToggle(true,"hold");
  eq(tableTab,"hold","стол открылся на описи");
  const box=document.getElementById("loglist");
  ok(box.classList.contains("opis"),"это сукно, а не лист");
  const txt=box.textContent;
  ok(/ТРЮМ/.test(txt)&&/КОМПЛЕКТ СКАФАНДРА/.test(txt)&&/ЧАСТИ И ВЕЩИ/.test(txt)&&/ЛЮК ЗА БОРТ/.test(txt),"все четыре зоны на месте");
  ok(/ИНСТРУМЕНТЫ «СОРОКИ»/.test(txt)&&/шкатулка/.test(txt),"полка и шкатулка ждут «Сороку»");
  eq(document.getElementById("tableTtl").textContent,"ОПИСЬ","шапка называет место");
  eq(document.getElementById("tableBack").style.display,"none","дороги «← СТОЛ» у описи нет");
  ok(/спичек: 0/.test(document.getElementById("tableWhere").textContent),"второй счётчик — спички");
  ok(!!box.querySelector("canvas.op-hull")&&!!box.querySelector(".op-panel[data-p=ship]")&&!!box.querySelector(".op-panel[data-p=kit]"),
     "силуэт и обе панели приборов нарисованы");
  /* поставить кнопкой — запасная часть встаёт в свой слот */
  const card=id=>box.querySelector(".op-card.part[data-id='"+id+"']");
  const btn=(c,re)=>[...c.querySelectorAll("button")].find(b=>re.test(b.textContent));
  ok(!!card(p1.id),"запасная часть лежит в «снятых»");
  const put=btn(card(p1.id),/СТАВИТЬ|ЗАМЕНИТЬ/);
  ok(!!put&&!put.disabled,"кнопка СТАВИТЬ живая");
  put.click();
  ok(isFitted(p1.id),"часть встала");
  ok(!!card(p1.id)&&!!card(p1.id).closest(".op-slot"),"и её карточка теперь в слоте");
  /* панель показывает будущее: у стоящей части — «если снять» */
  const slotI=[...Object.keys(G.fit[G.shipId])].find(k=>G.fit[G.shipId][k]===p1.id)|0;
  const fut=opisShipFuture({t:"slot",i:slotI});
  ok(!!fut&&/снять/.test(fut.why),"будущее стоящей части — «если снять»");
  const fut4=opisShipFuture({t:"part",id:p4.id});
  ok(!!fut4&&fut4.st&&OPIS_SHIP.some(d=>fut4.st[d.k]!==stat()[d.k]),"будущее запасного двигателя — другие числа");
  OPIS.hover={t:"part",id:p4.id};opisPanels();
  ok(!!box.querySelector(".op-panel[data-p=ship] u"),"панель напечатала стрелку → к новому числу");
  OPIS.hover=null;opisPanels();
  ok(!box.querySelector(".op-panel[data-p=ship] u"),"без наведения стрелок нет");
  /* снять кнопкой */
  btn(card(p1.id),/СНЯТЬ/).click();
  ok(!isFitted(p1.id),"часть снята");
  /* разобрать отменную: сперва «ТОЧНО?», потом спички */
  const c4=card(p4.id);ok(!!c4,"отменная часть на сукне");
  btn(c4,/РАЗОБРАТЬ/).click();
  ok(G.inv.indexOf(p4)>=0&&matchesRec()===0,"первое нажатие ничего не разобрало");
  const c4b=card(p4.id);
  const sure=btn(c4b,/ТОЧНО\?/);
  ok(!!sure,"кнопка стала «ТОЧНО?»");
  sure.click();
  ok(G.inv.indexOf(p4)<0,"второе нажатие разобрало");
  eq(matchesRec(),3,"и под кожухом нашлись три спички");
  ok(/спичек: 3/.test(document.getElementById("tableWhere").textContent),"счётчик в шапке обновился");
  /* обычная часть разбирается без вопросов */
  btn(card(p1.id),/РАЗОБРАТЬ/).click();
  ok(G.inv.indexOf(p1)<0,"обычная — с одного нажатия");
  /* куча за борт: спрашивает сколько, людей не берёт */
  const pile=k=>box.querySelector(".op-card.pile[data-k='"+k+"']");
  ok(!!pile("iron")&&!!pile("folk"),"кучи на сукне");
  ok(!btn(pile("folk"),/ЗА БОРТ/),"у людей кнопки «за борт» нет");
  const ironBefore=G.cargo.iron;   /* разбор двух частей уже насыпал железа */
  btn(pile("iron"),/ЗА БОРТ/).click();
  const ask=box.querySelector(".op-ask")||document.querySelector("#opisBar .op-ask");
  ok(!!ask,"люк спросил, сколько");
  ask.querySelector("input").value=5;
  btn(ask,/ЗА БОРТ/).click();
  eq(G.cargo.iron,ironBefore-5,"пять ушло за борт, остальное осталось");
  ok(!opisDump("folk",1)&&G.cargo.folk===2,"людей за борт не выбрасывают даже напрямую");
  /* память о цене под кучей: виденное сильнее слышанного, тычок — курс */
  G.seenPrices={};
  G.seenPrices["a"]={sx:1,sy:1,name:"Виденная",day:celDay(),p:{iron:20},need:null};
  G.seenPrices["b"]={sx:2,sy:2,name:"Слышанная",day:celDay(),p:{iron:900},need:null,heard:1};
  opisRerender();
  const cue=btn(pile("iron"),/виденное:/);
  ok(!!cue&&/20/.test(cue.textContent)&&!/900/.test(cue.textContent),"под кучей — лучшая ВИДЕННАЯ цена");
  ok(/трюм стоит около/.test(box.textContent),"и строка «трюм стоит около»");
  G.mode="system";G.sel={x:0,y:0};
  cue.click();
  eq(G.sel.x,1,"тычок положил курс на ту станцию");
  ok(!tableIsOpen(),"и опись закрылась под карту");
  G.mode="system";G.seenPrices={};
  for(const k of RES_KEYS)G.cargo[k]=0;
}));

TEST_SUITES.push(()=>suite("опись: комплект надевается с сукна, накладной на столе нет",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.kit=null;G.kitShelf=[];
  const x=kitPiece("helmet",3,0,11);kitShelf().push(x);
  tableToggle(true,"hold");
  const box=document.getElementById("loglist");
  const kc=box.querySelector(".op-card.kit");
  ok(!!kc,"запасной шлем лежит в запасе");
  const fut=opisKitFuture({t:"kit",i:0});
  ok(!!fut&&fut.st.scan>kitStat().scan,"будущее комплекта: обзор вырастет");
  [...kc.querySelectorAll("button")].find(b=>/НАДЕТЬ/.test(b.textContent)).click();
  eq(kitAll().helmet,x,"шлем надет");
  eq(kitShelf().length,1,"прежний лёг на полку");
  /* накладная ушла со стола: ни вещи, ни закладки, а опись — не вещь стола */
  ok(!DESK_ITEMS.find(it=>it.id==="bill"),"накладной среди вещей нет");
  ok(!DESK_DRAW.bill,"и рисунка её нет");
  ok(!document.querySelector('#tableTabs button[data-tab="prices"]'),"закладки ЦЕНЫ в разметке нет");
  eq(deskItemOf("hold"),null,"опись не лежит на столе вещью");
  tableSetTab("top");
  ok(!document.getElementById("loglist").classList.contains("opis"),"стол снова стол");
  eq(document.getElementById("tableTtl").textContent,"СТОЛ","и шапка вернулась");
  tableToggle(false);
  G.kit=null;G.kitShelf=[];
}));
