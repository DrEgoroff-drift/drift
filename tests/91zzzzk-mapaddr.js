/* ══════════════ автотесты: карта говорит адресами (M347) ══════════════
   Сетка и линейки считают клетку той же формулой, что окно карты; пустая клетка
   выбирается и называется; область слуха на карте равна разбросу 11t; спичка
   кладётся из кошелька и возвращается в него; адреса в тексте нажимаются. */
TEST_SUITES.push(()=>suite("карта: клетка одна для сетки, линеек и тапа; пустая клетка выбирается",{tier:"browser"},()=>{
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

TEST_SUITES.push(()=>suite("карта: спички из кошелька, области слухов, адреса нажимаются",{tier:"browser"},()=>{
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

/* ── мировая галактика (M447–M448): формула, а не картинка ──
   Небо M438 ехало долей пути листа — автор прочёл это «приклеено к экрану».
   Теперь небо карты — функция координат мира. Сторож держит модель: она
   детерминирована, конечна, ярче всего в ядре, рукав светлее межрукавья на
   том же радиусе, край диска тёмен; звёзды держат плотность на экране. */
TEST_SUITES.push(()=>suite("галактика: модель в мире",()=>{
  resetWorld();
  let bad=0;
  for(let x=-200;x<=200;x+=17)for(let y=-200;y<=200;y+=19){
    const g=galaxyAt(x,y);
    if(!isFinite(g.glow)||g.glow<0||g.glow>1||!isFinite(g.dust)||g.col.some(c=>!isFinite(c)))bad++;
  }
  eq(bad,0,"ни одного NaN и выхода за 0…1 на ±200");
  eq(JSON.stringify(galaxyAt(13.3,-7.1)),JSON.stringify(galaxyAt(13.3,-7.1)),"одна и та же точка — одно и то же небо");
  const c0=galaxyAt(0,0).glow;
  let brighter=0;for(let a=0;a<12;a++)for(const r of [6,12,20])if(galaxyAt(Math.cos(a)*r,Math.sin(a)*r).glow>c0)brighter++;
  eq(brighter,0,"ядро — самое яркое место");
  /* рукав против межрукавья на одном радиусе: лучший и худший угол кольца */
  for(const r of [12,18,26]){
    let hi=0,lo=1;
    for(let a=0;a<72;a++){const g=galaxyAt(Math.cos(a*TAU/72)*r,Math.sin(a*TAU/72)*r);hi=Math.max(hi,g.arm);lo=Math.min(lo,g.arm);}
    ok(hi>lo+.3,"на r="+r+" есть и рукав, и межрукавье ("+hi.toFixed(2)+" / "+lo.toFixed(2)+")");
  }
  let rim=0,n=0;for(let a=0;a<36;a++){rim+=galaxyAt(Math.cos(a)*55,Math.sin(a)*55).glow;n++;}
  ok(rim/n<.12,"край диска тёмен: среднее "+(rim/n).toFixed(3));
  ok(galaxyAt(0,0).bulge<=GAL_BULGE_CAP+.001,"балдж под потолком — дом читается");
}));
TEST_SUITES.push(()=>suite("галактика: звёзды держат плотность на экране",{tier:"browser"},()=>{
  resetWorld();
  const counts=[];
  for(const z of [.6,1,2,5]){
    G.mapZoom=z;const cell=mapCell(),V=mapViewC();
    drawGalaxyStars(V,cell);
    let n=0;for(const b of GAL_STAR_BUF)n+=b.length/3;
    counts.push(n);
  }
  const mn=Math.min(...counts),mx=Math.max(...counts);
  ok(mn>0,"звёзды есть на любом зуме");
  ok(mx<mn*3.5,"число точек на экране в одной полосе при зуме .6…5: "+counts.map(Math.round).join(" / "));
  G.mode="map";G.mapView={x:G.sx+6.5,y:G.sy-4.5};G.mapZoom=1.8;
  let err="";try{drawMap();}catch(e){err=e.message;}
  eq(err,"","карта с уехавшим листом рисуется");
  G.mapView=null;G.mapZoom=1;G.mode="system";
}));
/* ── небо карты на видеокарте (G10, 17z3) ──
   Шейдер галактики печатает постоянные модели из JS: перенастроили galaxyAt —
   небо обязано пойти следом, иначе звёзды и дороги (galaxyCell) разойдутся со
   светом. Без видеокарты карта и сеть дорог рисуются молча, сеть при этом
   достраивается — это логика, а не рисунок. */
TEST_SUITES.push(()=>suite("галактика: шейдер неба держит модель",()=>{
  resetWorld();
  for(const [n,v] of [["GAL_RD",GAL_RD.toFixed(3)],["GAL_PITCH",GAL_PITCH.toFixed(6)],["GAL_BAR_A",GAL_BAR_A.toFixed(6)],
    ["GAL_BULGE_CAP",GAL_BULGE_CAP.toFixed(3)],["GAL_GLOW_CAP",GAL_GLOW_CAP.toFixed(3)]])
    ok(GAL_WGSL.indexOf(v)>=0,n+" = "+v+" есть в шейдере");
  ok(GAL_WGSL.indexOf("array<vec4f,"+GAL_NEBULAE.length+">")>=0,"все туманности по имени в шейдере: "+GAL_NEBULAE.length);
  eq(typeof galBake,"undefined","процессорной печи тайлов больше нет");
  RAIL_NET=null;RAIL_PART=null;
  G.mode="map";let err="";
  try{for(let i=0;i<40;i++)drawMap();}catch(e){err=e.message;}
  eq(err,"","карта рисуется без видеокарты");
  ok(RAIL_NET!==null||(RAIL_PART&&RAIL_PART.i>=40),"сеть дорог достраивается по линии за кадр карты");
  G.mode="system";
}));
