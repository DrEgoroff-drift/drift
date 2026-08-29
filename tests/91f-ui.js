/* ══════════════ автотесты: интерфейс: 44 px, непересечение, кнопка называет действие, разделы ══════════════ */
TEST_SUITES.push(()=>suite("интерфейс: во что тыкают пальцем — не меньше 44 px",()=>{
  resetWorld();
  /* Прежний правый борт был столбиком 27-пиксельных кнопок: на ходу по ним
     промахиваешься. Порог в 44 px — общий для сенсорных интерфейсов, и он
     должен держаться сам, а не проверяться глазами раз в полгода. */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";hud();
  const seen=[],small=[];
  document.querySelectorAll(".pads button,.rail button,#menu button").forEach(b=>{
    const r=b.getBoundingClientRect();
    if(!r.width)return;
    seen.push(b);
    if(r.width<44||r.height<44)small.push((b.dataset.k||b.id||b.textContent).trim()+
      " "+Math.round(r.width)+"×"+Math.round(r.height));
  });
  ok(seen.length>0,"кнопки вообще нашлись ("+seen.length+")");
  eq(small.join(", "),"","все кнопки полёта и меню дотягивают до 44 px");
}));

/* Строка состояния вернулась наверх (2026-08-26, прямое указание автора:
   «приборы сверху, сейчас очень плохо не видно»). Сторож перенаведён, а не
   выключен: раньше он требовал пустого верха, теперь требует пустой
   СЕРЕДИНЫ и держит состояние в верхней полосе, а органы управления — в
   нижней. Правило, которое он охраняет: верх кадра отвечает на «кто я и
   где я», низ — на «что я могу», между ними мир. */
TEST_SUITES.push(()=>suite("интерфейс: приборы и кнопки не наезжают друг на друга",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* показываем разом всё, что вообще может появиться на правом борту */
  for(const id of ["starbtn","dronebtn","beaconbtn","firebtn"]){
    const e=document.getElementById(id);if(e)e.style.display="";
  }
  /* подсказка в две строки — самая высокая из возможных: если она не задевает
     строку состояния сверху и пульт снизу, не заденет никакая */
  G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · ТОРГОВЫЙ УЗЕЛ\nГРУЗ ЖДЁТ НА ПРИЧАЛЕ";
  hud();
  const box=s=>{const e=document.querySelector(s);if(!e)return null;
    const r=e.getBoundingClientRect();return r.width?{s,x:r.x,y:r.y,w:r.width,h:r.height}:null;};
  const items=[".vitals",".locus",".ipod","#prompt","#console",".rail",
               ".pads>div:first-child",".pads>div:last-child"]
    .map(box).filter(Boolean);
  ok(items.length>=6,"панели на месте ("+items.length+")");
  const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
  const clash=[];
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
    if(hit(items[i],items[j]))clash.push(items[i].s+"×"+items[j].s);
  eq(clash.join(", "),"","ничто не наезжает друг на друга");
  /* ширину экрана проверяем только когда он вообще разложен: в свёрнутой
     вкладке innerWidth бывает нулём, и тогда «за краем» оказывается всё */
  if(innerWidth>=280){
    const out=items.filter(i=>i.x<-1||i.x+i.w>innerWidth+1);
    eq(out.map(i=>i.s).join(", "),"","и ничто не уехало за край экрана");
  }else ok(true,"экран не разложен — проверку ширины пропускаем");
  /* И главное, ради чего всё двигали. Две зоны и чистая середина:
     состояние (шкалы, место, колодка) держится верхней полосы, органы
     управления (подсказка, пульт) — нижней, а между ними мир. Правый борт
     и пэды в счёт не идут: это кнопки у кромки, правило интерфейса держит
     их там нарочно («две постоянные кнопки на правом краю»). */
  if(innerHeight>=400){
    const H=innerHeight;
    const state=[".vitals",".locus",".ipod"], hands=["#prompt","#console"];
    const low=items.filter(i=>state.indexOf(i.s)>=0&&i.y+i.h>H*.30);
    eq(low.map(i=>i.s).join(", "),"","состояние держится верхней полосы кадра");
    const high=items.filter(i=>hands.indexOf(i.s)>=0&&i.y<H*.55);
    eq(high.map(i=>i.s).join(", "),"","органы управления держатся нижней полосы");
    /* середина кадра — это и есть мир: ни одна панель её не занимает */
    const mid=items.filter(i=>(state.indexOf(i.s)>=0||hands.indexOf(i.s)>=0)&&
      i.y<H*.55&&i.y+i.h>H*.30);
    eq(mid.map(i=>i.s).join(", "),"","середина кадра свободна");
  }else ok(true,"экран не разложен — проверку зон пропускаем");
  /* Читаемость — тоже правило, а не вкус. Панель, которая в покое гаснет до
     трети, автор увидел как «очень плохо не видно»; сторож не даёт вернуть
     это молча. */
  {
    const h=document.querySelector(".hud");
    h.classList.remove("live");
    const op=parseFloat(getComputedStyle(h).opacity);
    ok(op>=.8,"в покое приборы читаются (непрозрачность "+op.toFixed(2)+" ≥ .80)");
    const bar=document.querySelector("#fbar");
    if(bar){
      const bh=bar.getBoundingClientRect().height;
      ok(bh>=3,"шкала — тело, а не волосок ("+bh.toFixed(1)+" px ≥ 3)");
    }
  }
  for(const id of ["starbtn","dronebtn","beaconbtn","firebtn"]){
    const e=document.getElementById(id);if(e)e.style.display="none";
  }
  G.prompt="";hud();
}));

TEST_SUITES.push(()=>suite("интерфейс: приборы не мигают от расхода",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  const $h=document.querySelector(".hud"), st=stat();
  /* Топливо и скафандр текут непрерывно. Пока поводом считалось любое
     изменение округлённого показания, панель раз в несколько секунд
     вспыхивала и гасла сама по себе — сверху шло мигание ни о чём. */
  G.fuel=st.fuelMax;G.hull=st.hullMax;G.credits=1000;
  hud();
  /* сто кадров плавного расхода: панель должна успокоиться и не просыпаться */
  for(let i=0;i<100;i++){G.fuel-=.02;hud();}
  HUD_T=performance.now()-9e3;hud();
  ok(!$h.classList.contains("live"),"плавный расход панель не будит");
  for(let i=0;i<50;i++){G.fuel-=.02;hud();}
  ok(!$h.classList.contains("live"),"и не будит дальше");
  /* а событие — будит */
  G.hull-=12;hud();
  ok($h.classList.contains("live"),"удар по корпусу будит");
  HUD_T=performance.now()-9e3;hud();
  ok(!$h.classList.contains("live"),"и панель снова гаснет");
  G.credits+=250;hud();
  ok($h.classList.contains("live"),"деньги будят");
  G.fuel=st.fuelMax*.05;hud();
  ok($h.classList.contains("live"),"на исходе топлива панель открыта без поводов");
  G.fuel=st.fuelMax;G.hull=st.hullMax;hud();
}));

TEST_SUITES.push(()=>suite("интерфейс: кнопка называет действие, а не себя",()=>{
  resetWorld();
  /* «ДЕЙСТВИЕ» не отвечает ни на один вопрос игрока, «СТЫКОВКА» отвечает
     на все. Глагол берётся из подсказки, чтобы не завести второй источник
     правды, который однажды разойдётся с первым. */
  const $act=document.querySelector("[data-k=act]");
  G.mode="system";G.prompt="";hud();
  eq($act.textContent,"ДЕЙСТВИЕ","делать нечего — кнопка нейтральна");
  ok(!$act.classList.contains("ready"),"и не светится");
  G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · ТОРГОВЫЙ УЗЕЛ";hud();
  eq($act.textContent,"СТЫКОВКА","у станции кнопка называет стыковку");
  ok($act.classList.contains("ready"),"и подсвечена");
  G.prompt="ДЕЙСТВИЕ — АБОРДАЖ";hud();
  eq($act.textContent,"АБОРДАЖ","у пиратской базы — абордаж");
  /* длинную подпись на круглую кнопку не сажаем: она бы не поместилась */
  G.prompt="ДЕЙСТВИЕ — СИНТЕЗ ТОПЛИВА ИЗО ЛЬДА (12)";hud();
  eq($act.textContent,"ДЕЙСТВИЕ","слишком длинный глагол на кнопку не лезет");
  /* но кнопка при этом ЖИВА: на телефоне «призрачных кнопок нет» прячет
     непригодную кнопку совсем, и длинный глагол отнимал у игрока действие */
  ok($act.classList.contains("ready"),"длинный глагол не отнимает действие");
  G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";hud();
  ok($act.classList.contains("ready"),"и сканирование остаётся доступным");
  G.prompt="СКАФАНДР НА ИСХОДЕ · К КОРАБЛЮ";hud();
  ok(!$act.classList.contains("ready"),"а предупреждение действием не считается");
  /* глагол не обязан стоять с начала строки: у сигнала бедствия он на второй,
     и кнопка стояла погашенной при живом действии (плейтест автора 29.08.2026) */
  G.prompt="СИГНАЛ БЕДСТВИЯ\nДЕЙСТВИЕ — ПРИНЯТЬ СИГНАЛ";hud();
  ok($act.classList.contains("ready"),"глагол со второй строки кнопку зажигает");
  eq($act.textContent,"ПРИНЯТЬ СИГНАЛ","и называет её глаголом");
  G.prompt="САНАТОРИЙ · ДЕЙСТВИЕ — ОТДОХНУТЬ ТРИ ДНЯ";hud();
  ok($act.classList.contains("ready"),"глагол после точки-разделителя — тоже");
  /* справка о далёком действии кнопку зажигать не должна: у устья — не здесь */
  G.prompt="A D — ИДТИ · W — РАНЕЦ · ШАХТЫ ВЕДУТ ВНИЗ · НАРУЖУ — ДЕЙСТВИЕ У УСТЬЯ";hud();
  ok(!$act.classList.contains("ready"),"справка про устье действием не считается");
  G.prompt="";hud();
}));

TEST_SUITES.push(()=>suite("язык: числительные согласованы (pl3)",()=>{
  /* по коду жило четыре самодельных склонения, три врали: «1 прыжка»,
     «1 станция получили», «21 ЛЕТ». Теперь одна функция — и она обязана
     знать про 11–14 и про 21 (полировочный круг) */
  eq(pl3(1,"прыжок","прыжка","прыжков"),"прыжок","1 прыжок");
  eq(pl3(2,"прыжок","прыжка","прыжков"),"прыжка","2 прыжка");
  eq(pl3(5,"прыжок","прыжка","прыжков"),"прыжков","5 прыжков");
  eq(pl3(11,"прыжок","прыжка","прыжков"),"прыжков","11 прыжков");
  eq(pl3(12,"год","года","лет"),"лет","12 лет");
  eq(pl3(21,"год","года","лет"),"год","21 год");
  eq(pl3(22,"год","года","лет"),"года","22 года");
  eq(pl3(114,"год","года","лет"),"лет","114 лет");
}));

TEST_SUITES.push(()=>suite("станция: разделы вместо десяти вкладок в ряд",()=>{
  resetWorld();
  const S=G.sys.station;
  ok(!!S,"станция есть");
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  const groups=[...document.querySelectorAll("#stGroups button")];
  ok(groups.length>0,"разделы построены");
  ok(groups.length<ST_GROUPS.length+1,"их не больше, чем заведено");
  /* раздел показывается, только если у него есть вкладка на этой станции */
  const has=stTabsHere();   /* доска у всех (M151a) */
  const liveNames=ST_GROUPS.filter(g=>g.tabs.some(t=>has.indexOf(t)>=0)).map(g=>g.ru);
  eq(groups.map(b=>b.textContent).join(","),liveNames.join(","),
     "мёртвых разделов в шапке нет");
  /* вкладки видны только своего раздела */
  const grpOfTab={};ST_GROUPS.forEach(g=>g.tabs.forEach(t=>grpOfTab[t]=g.id));
  const shown=[...document.querySelectorAll("#stTabs button")].filter(b=>b.style.display!=="none");
  ok(shown.length>0,"вкладки раздела показаны");
  ok(shown.every(b=>grpOfTab[b.dataset.tab]===stGroupOf(tab)),
     "чужих вкладок в ряду нет");
  ok(shown.every(b=>has.indexOf(b.dataset.tab)>=0),"и нет тех, которых на станции не бывает");
  /* переключение раздела переносит и вкладку */
  if(groups.length>1){
    const before=tab;
    /* раздел не тот, что открыт сейчас: открытый — ДОСКА или ТОРГОВЛЯ (M151a) */
    groups.find(b=>!b.classList.contains("on")).click();
    ok(tab!==before,"выбор раздела переключил вкладку");
    ok(has.indexOf(tab)>=0,"на ту, что здесь вообще есть");
  }
  closeStation();
}));

/* ══════════════ ключи из кода не показываются игроку ══════════════
   На столе в шапке печаталось `G.mode` как есть, и игрок читал
   «Нейэль · system». Такое не ловится глазами: строка короткая, стоит в углу
   и выглядит как часть оформления. Сторож обходит экраны и ищет в видимом
   тексте латиницу — в русской игре ей взяться неоткуда, кроме как из кода.

   Что разрешено: номер версии, единицы вроде «кг», римские цифры в именах
   планет (НЕЙЭЛЬ I) и всё, что игрок и должен видеть латиницей. Список
   короткий нарочно — если он начнёт расти, значит правило перестало работать. */
TEST_SUITES.push(()=>suite("интерфейс: на экранах нет ключей из кода",()=>{
  resetWorld();
  const OK=/^(v?\d[\d.]*|[IVXLC]+|kb|KB|px|fps|GPS|km|QSL)$/;
  const leaks=[];
  let seen=0;
  const scan=where=>{
    document.querySelectorAll(where+" *").forEach(e=>{
      if(e.children.length)return;
      const t=(e.textContent||"").trim();
      if(!t)return;
      seen++;
      /* латинское СЛОВО из трёх букв и длиннее — это почти наверняка ключ */
      const m=t.match(/[a-zA-Z]{3,}/g);
      if(!m)return;
      for(const w of m)if(!OK.test(w))leaks.push(where+": «"+t.slice(0,50)+"»");
    });
  };
  for(const id of ["shipbtn","crewbtn","hqbtn","tablebtn","optbtn"]){
    const b=document.getElementById(id);if(!b)continue;
    document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
    try{b.click();}catch(e){continue;}
    scan(".scr.open");
  }
  /* стол во всех режимах: шапка «где мы» — та самая, где ключ и утёк */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  for(const m of ["system","surface","cave","dig","belt","dock","homein","raid","base","scoop"]){
    G.mode=m;tableToggle(true);scan("#tablewin");tableToggle(false);
  }
  G.mode="system";
  /* Сторож, который ничего не осмотрел, хуже отсутствующего: он зелёный и
     молчит. Считаем осмотренные строки и требуем, чтобы их было много. */
  ok(seen>200,"экраны действительно раскрылись и осмотрены ("+seen+" строк)");
  const uniq=[...new Set(leaks)];
  eq(uniq.slice(0,6).join(" | "),"","ни одного латинского слова в видимом тексте");
}));

/* ══════════════ на чистом старте в кадре нет лишнего ══════════════
   `#parrotwin` пережил M151a: стили ей вычистили, разметку оставили, и блок
   без единого правила рисовался обычным потоком — с первой секунды новой игры
   в левом верхнем углу висело «ТРЕПЛО ×» у игрока, у которого никакой птицы
   ещё нет (плейтест 26.08.2026). Такое глазами не ловится: элемент выглядит
   как часть игры. Сторож проверяет каждый прямой блок под <body>: на чистом
   старте видно только то, что и должно быть видно. */
TEST_SUITES.push(()=>suite("интерфейс: на чистом старте в кадре нет лишнего",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  if(typeof tableToggle==="function")tableToggle(false);
  G.mode="system";G.parrot=null;hud();
  /* что имеет право висеть над миром с первой секунды */
  const OK=["c","slope","hud","msg","prompt","console","rail","pads","menu"];
  const stray=[];
  for(const e of document.body.children){
    if(e.tagName==="SCRIPT"||e.tagName==="STYLE")continue;
    const id=e.id||"", cls=(e.className||"").toString().split(" ")[0]||"";
    if(OK.indexOf(id)>=0||OK.indexOf(cls)>=0)continue;
    const cs=getComputedStyle(e);
    if(cs.display==="none"||cs.visibility==="hidden"||parseFloat(cs.opacity)<.02)continue;
    const r=e.getBoundingClientRect();
    if(r.width<2||r.height<2)continue;
    stray.push((id||cls||e.tagName)+" "+Math.round(r.width)+"×"+Math.round(r.height));
  }
  eq(stray.join(", "),"","поверх мира не висит ничего, кроме приборов и кнопок");
  /* и отдельно про само трепло: без птицы ни окна, ни жёрдочки */
  const pw=document.getElementById("parrotwin");
  if(pw)eq(getComputedStyle(pw).display,"none","окно трепла закрыто, пока его не открыли");
}));

/* ══════════════ M236: колесо крутит мир только над миром ══════════════
   Обработчик колеса висит на окне и спрашивал один G.mode: игрок листал колесом
   тетрадь на столе, а карта за спиной уезжала в зум. */
TEST_SUITES.push(()=>suite("колесо: зум берётся только с канвы",()=>{
  resetWorld();
  G.mode="system";
  const wheel=(target)=>target.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,bubbles:true}));
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  /* над миром — крутит */
  G.zoom=1;
  wheel(cvs);
  ok(G.zoom>1,"над канвой колесо приближает: "+G.zoom.toFixed(2));
  /* над любым DOM — не крутит */
  G.zoom=1;
  wheel(document.getElementById("prompt")||document.body);
  eq(G.zoom,1,"над панелью колесо мир не трогает");
  /* открытый экран закрывает зум даже над канвой */
  const scr=document.querySelector(".scr");
  scr.classList.add("open");
  G.zoom=1;
  wheel(cvs);
  eq(G.zoom,1,"пока открыт экран, мир не зумится вовсе");
  scr.classList.remove("open");
}));
