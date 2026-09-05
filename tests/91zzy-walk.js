/* ══════════════ автотесты: прогон §9 DESIGN-screens — шесть шагов на телефоне ══════════════
   Приёмка после интерфейсных вех (PLAN «Next» п.1): путь новичка от стыковки до
   прыжка по слуху. Мерило одно — «ни один шаг не требует абзаца на экране»:
   после каждого шага ни один текстовый блок в видимой части (заметка, строка
   карточки, подсказка) не длиннее PARA знаков. Шаги, которые §9 называет
   словами (кнопка, подпись, глагол), проверяются буквально.
   Набор идёт и в 1280×800, и в 390×844 (test.ps1 -Mobile): мерило то же. */
const WALK_PARA=200;   /* ~5 строк по 40 знаков на телефоне: дальше это уже абзац */
function walkParas(root,where){
  const bad=[];
  for(const e of root.querySelectorAll(".nm s,.sec.note,.nm b,#prompt,.sec span:first-child")){
    if(e.closest("[hidden],.fold:not(.open)"))continue;
    const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
    const cs=getComputedStyle(e);if(cs.display==="none"||cs.visibility==="hidden")continue;
    /* строка карточки бывает многострочной через <br>: абзац — самый длинный кусок между ними */
    const parts=(e.innerHTML||"").split(/<br\s*\/?>/i).map(h=>h.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim());
    for(const p of parts)if(p.length>WALK_PARA)bad.push(where+": "+p.length+" зн. «"+p.slice(0,48)+"…»");
  }
  return bad;
}
TEST_SUITES.push(()=>suite("прогон §9: стыковка → слух на карту → зал → стойка → завсегдатай → отстыковка",()=>{
  resetWorld();
  const cand=routeTestStations(8).find(s=>s.station&&stTypeOf(s.station.stype).tabs.indexOf("cantina")>=0)||null;
  ok(!!cand,"нашлась станция с кантиной");
  if(!ok(cand,"нашлось: cand"))return;
  G.sx=cand.sx;G.sy=cand.sy;G.sys=cand;G.st=cand.station;
  G.ship.x=cand.station.x+40;G.ship.y=cand.station.y;
  for(const k of RES_KEYS)G.cargo[k]=0;G.strips=[];G.news=[];
  const paras=[];
  /* 1. стыковка: доска на К ВАМ, полосы, дальше — слухи с НА КАРТУ */
  openStation();tab="board";syncTabs();renderTab();
  eq(G.mode,"dock","1. стоим у станции");
  const lanes=[...$body.querySelectorAll(".sec.lane")].map(x=>x.querySelector("span").textContent);
  ok(lanes.length>=1,"1. полосы доски: "+lanes.join(" / "));
  const rumBtn=[...$body.querySelectorAll("button")].filter(b=>b.textContent==="НА КАРТУ");
  ok(rumBtn.length>=1,"1. у слуха есть НА КАРТУ: "+rumBtn.length);
  paras.push(...walkParas($st,"1 доска"));
  /* 2. НА КАРТУ: подгляд, вы в кадре, круг поиска, курс; НАЗАД — на доску */
  if(rumBtn.length){
    rumBtn[0].click();
    eq(G.mode,"map","2. карта");
    ok(!!G.mapPeek,"2. подгляд со станции");
    ok(!!G.mapSearch&&G.mapSearch.rad>0,"2. круг поиска стоит");
    ok(!!G.course&&G.course.sx===G.sel.x&&G.course.sy===G.sel.y,"2. курс поставлен на сектор слуха");
    const fits=(x,y)=>Math.abs(x-mapViewC().x)<=mapRange()&&Math.abs(y-mapViewC().y)<=mapRange();
    ok(fits(G.sx,G.sy)&&fits(G.sel.x,G.sel.y),"2. в кадре и вы, и сектор слуха");
    let okDraw=true;try{drawMap();hud();}catch(e){okDraw=false;}
    ok(okDraw,"2. карта рисуется");
    paras.push(...walkParas(document.body,"2 карта"));
    ok(mapBack(),"2. НАЗАД возвращает");
    eq(tab,"board","2. на ту же доску");
    ok(!!G.course&&!!G.course.rad,"2. курс и круг пережили НАЗАД");
  }
  /* 3. ЛЮДИ → КАНТИНА: зал, стойка, завсегдатай у дока, одна строка-подсказка */
  folkNow={id:"ryba",line:"Я в кабине. Мне так лучше."};
  cantSel=null;tab="cantina";syncTabs();renderTab();
  ok(!!$body.querySelector("canvas"),"3. зал нарисован");
  ok(/К СТОЙКЕ/.test($body.textContent),"3. стойка — точка нажатия");
  ok(/Рыба · завсегдатай/.test($body.textContent),"3. завсегдатай подписан");
  paras.push(...walkParas($st,"3 зал"));
  /* 4. стойка: стол только с тем, что есть; ряд имени */
  cantSel="counter";renderTab();
  ok([...$body.querySelectorAll(".sec span:first-child")].some(s=>s.textContent==="СТОЛ"),"4. у стойки — стол");
  ok(/Ваше имя/.test($body.textContent),"4. ряд имени");
  ok(!/трюм пуст|лент нет|ничего не слышали/.test($body.textContent),"4. пустых рядов нет");
  paras.push(...walkParas($st,"4 стойка"));
  /* 5. Рыба: карточка — кто она и её слова; глагола может не быть */
  cantSel="folk:ryba";renderTab();
  ok(/Я в кабине/.test($body.textContent),"5. её слова на карточке");
  ok(/У ДОКА/.test($body.textContent),"5. и где стоит");
  paras.push(...walkParas($st,"5 завсегдатай"));
  cantSel=null;folkNow=null;
  /* 6. отстыковка: курс назван в полёте — «К ЦЕЛИ», тап открывает карту на нём */
  closeStation();
  eq(G.mode,"system","6. полёт");
  hud();
  const gb=document.getElementById("goalbtn");
  if(G.course){
    ok(gb&&gb.style.display!=="none","6. «К ЦЕЛИ» видна");
    ok(/^К ЦЕЛИ · \d+ ПРЫЖ/.test(gb.textContent),"6. и говорит, сколько прыгать: «"+gb.textContent+"»");
    const r=gb.getBoundingClientRect();
    ok(r.width>=44&&r.height>=44,"6. кнопка не меньше 44 px: "+Math.round(r.width)+"×"+Math.round(r.height));
    paras.push(...walkParas(document.body,"6 полёт"));
    gb.click();
    eq(G.mode,"map","6. тап — карта");
    ok(G.sel.x===G.course.sx&&G.sel.y===G.course.sy,"6. на секторе курса");
    /* прибытие гасит курс */
    G.fuel=100;const c0=G.course;jump(1);
    ok(G.sx===c0.sx&&G.sy===c0.sy,"6. прыгнули");
    ok(!G.course,"6. по прибытии курс снят");
    hud();
    ok(gb.style.display==="none","6. и «К ЦЕЛИ» погасла");
  }else ok(false,"6. курса не было (слухов на станции нет) — пропуск");
  eq(paras.join(" | "),"","ни один шаг не требует абзаца: блоки ≤ "+WALK_PARA+" знаков");
  G.course=null;G.mode="system";document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
}));
