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
  G.prompt="";hud();
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
