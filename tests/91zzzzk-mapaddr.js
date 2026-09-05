/* ══════════════ автотесты: карта говорит адресами (M347) ══════════════
   Сетка и линейки считают клетку той же формулой, что окно карты; пустая клетка
   выбирается и называется; область слуха на карте равна разбросу 11t; спичка
   кладётся из кошелька и возвращается в него; адреса в тексте нажимаются. */
TEST_SUITES.push(()=>suite("карта: клетка одна для сетки, линеек и тапа; пустая клетка выбирается",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="map";G.sel={x:G.sx,y:G.sy};G.mapView=null;G.mapZoom=1;
  const V=mapViewC(),cell=mapCell();
  const c=mapCellXY(G.sx+2,G.sy-1,V,cell);
  ok(Math.abs(c.x-(W/2+2*cell))<.01&&Math.abs(c.y-(H/2-cell))<.01,"клетка считается от окна и размера клетки");
  /* тап в пустую клетку: выбор без курса */
  let empty=null;
  for(let dx=-4;dx<=4&&!empty;dx++)for(let dy=-4;dy<=4&&!empty;dy++){if(!dx&&!dy)continue;if(!starAt(G.sx+dx,G.sy+dy))empty=[G.sx+dx,G.sy+dy];}
  ok(!!empty,"рядом есть пустая клетка");
  if(empty){
    const p=mapCellXY(empty[0],empty[1],V,cell);
    G.mapTapT=0;tap(p.x,p.y);
    eq(G.sel.x+":"+G.sel.y,empty[0]+":"+empty[1],"пустая клетка выбрана");
    let err="";try{drawMap();}catch(e){err=e.message;}
    eq(err,"","карта с выбранной пустотой рисуется");
    ok(MAP_BOX.some(b=>b.s==="шапка карты")&&MAP_BOX.some(b=>b.s==="линейка X")&&MAP_BOX.some(b=>b.s==="линейка Y"),"линейки и шапка сообщили прямоугольники");
    ok(MAP_BOX.some(b=>b.s==="роза"),"и роза тоже");
    /* прыжка в пустоту нет: ДЕЙСТВИЕ не двигает */
    const sx0=G.sx,sy0=G.sy;actEdge=true;drawMap();actEdge=false;
    ok(G.sx===sx0&&G.sy===sy0,"в пустую клетку не прыгнули");
  }
  /* поиск адреса: окно едет, клетка обведена */
  ok(mapParseAddr(" 4 : -7 ").sx===4&&mapParseAddr("4:-7").sy===-7,"адрес читается в обоих написаниях");
  eq(mapParseAddr("дом"),null,"не адрес — не адрес");
  mapGoAddr(9,-3);
  eq(G.sel.x+":"+G.sel.y,"9:-3","выбор ушёл на адрес");
  ok(!!G.mapOutline&&G.mapOutline.sx===9,"клетка обведена");
  const box=mapAddrBox();ok(!!box&&box.querySelector("input"),"поле адреса есть");
  box.querySelector("input").value="2:2";box.querySelector("button").click();
  eq(G.sel.x+":"+G.sel.y,"2:2","кнопка поля кладёт выбор");
  G.mapView=null;G.sel={x:G.sx,y:G.sy};G.mode="system";
}));

TEST_SUITES.push(()=>suite("карта: спички из кошелька, области слухов, адреса нажимаются",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mapMarks=[];G.rumours=[];G.matches=0;G.mode="map";G.sel={x:3,y:4};
  eq(mapMarkToggle(3,4),null,"без спичек метки нет");
  G.matches=2;
  eq(mapMarkToggle(3,4),"laid","спичка легла");
  eq(matchesRec(),1,"и её нет в кошельке, пока лежит");
  eq(mapMarkToggle(3,4),"taken","забрали");
  eq(matchesRec(),2,"вернулась в кошелёк — не потрачена");
  G.matches=20;for(let i=0;i<12;i++)mapMarkToggle(i,0);
  eq(mapMarks().length,10,"десять — потолок");
  eq(matchesRec(),10,"десять спичек лежат на карте");
  let err="";try{drawMap();}catch(e){err=e.message;}
  eq(err,"","карта со спичками рисуется");
  /* сейв */
  const snap=snapshot();G.mapMarks=[];applySave(snap);
  eq(mapMarks().length,10,"спички вернулись из сейва");
  /* область слуха на карте — разброс 11t */
  const q={sx:5,sy:6,rad:3,img:"тестовое место",src:"буфетчица"};
  rumourRemember(q);rumourRemember(q);
  eq(rumoursKnown().length,1,"один слух — одна запись, без дублей");
  eq(rumoursKnown()[0].rad,3,"радиус тот же, что у слуха");
  try{mapRumoursDraw(mapViewC(),mapCell());}catch(e){err=e.message;}
  eq(err,"","область рисуется");
  const snap2=snapshot();G.rumours=[];applySave(snap2);
  eq(rumoursKnown().length,1,"и хранится");
  /* адреса в тексте: подчёркнуты и ведут на карту */
  const div=document.createElement("div");div.innerHTML="<s>куда ходил тот борт: сектор 7:-2 · и ещё у сектора 1:1</s>";
  addrify(div);
  const us=[...div.querySelectorAll("u.addr")];
  eq(us.length,2,"оба адреса стали ссылками");
  eq(us[0].dataset.sx+":"+us[0].dataset.sy,"7:-2","первый адрес прочитан");
  ok(/сектор 7:-2/.test(div.textContent),"текст не изменился");
  addrify(div);eq(div.querySelectorAll("u.addr").length,2,"второй проход не удваивает");
  G.mapMarks=[];G.rumours=[];G.matches=0;G.mode="system";G.sel={x:G.sx,y:G.sy};
}));
