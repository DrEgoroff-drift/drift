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
