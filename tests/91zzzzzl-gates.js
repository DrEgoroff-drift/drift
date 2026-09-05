/* ══════════════ закрытая дверь называет себя (M355) ══════════════
   Четвёртый заход той же линии. Половина игры закрыта порогами: наём — только
   кооперативу, прилавок — только со штампом, стройка — со ступени, наука — за
   данные. Порог сам по себе честен; нечестен МОЛЧАЛИВЫЙ порог. Игрок, которому
   не сказали причину, не думает «рано» — он думает «сломано», и это разница
   между «ещё не дорос» и «игра не работает».

   Два закона:
   1. отказ называет ПРИЧИНУ, а не факт: не «нельзя», а «нанимать могут только
      кооперативы, оборот такой-то из такого-то»;
   2. выключенная кнопка объясняется строкой, в которой стоит: цена, порог,
      «нет мест», «трюм полон». Кнопка, которую нельзя нажать и рядом с
      которой ничего не написано, — тупик на ровном месте. */

/* слова, которыми игра называет причину: цифра тоже причина (цена, порог) */
/* И состояние — тоже причина: «ИЗУЧЕНО», «В ДЕРЖАТЕЛЕ», «В РЕЙСЕ» объясняют
   серую кнопку не хуже цены. Серой без объяснения считается только та, рядом
   с которой не сказано ничего. */
const GATE_WHY=/\d|нужн|только|ранг|разряд|штамп|нет |нету|не хватает|полон|занят|мало|закрыт|сначала|требу|оборот|ступен|лиценз|уровен|изучен|надет|держател|в рейсе|уже|куплен|стоит/i;

TEST_SUITES.push(() => suite("порог: отказ называет причину, а не факт", () => {
  const bad=[],seen=[];
  const said=()=>String(G.msg||"");
  /* 1. наём без кооператива */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();
  G.coop=null;G.crew=[];
  G.msg="";
  let hired=false;
  if(typeof stationMercs==="function"&&typeof hireMerc==="function"){
    const pool=stationMercs(G.sys)||[];
    if(pool.length){
      try{ hired=hireMerc(pool[0])!==false; }catch(e){ bad.push("наём бросил: "+e.message); }
      seen.push("наём");
      if(hired)bad.push("без кооператива наняли человека — порога нет вовсе");
      else if(!GATE_WHY.test(said()))bad.push("наём: отказ без причины — «"+said().replace(/\n/g," ").slice(0,40)+"»");
    }
  }
  /* 2. прилавок кооператива без штампа: экран обязан сказать, чего не хватает */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();
  G.coop=null;
  if(G.sys.station&&typeof openStation==="function"){
    G.st=G.sys.station;G.mode="dock";
    try{ openStation(); tab="market"; renderTab(); }catch(e){ }
    const txt=String((document.getElementById("stBody")||{}).textContent||"");
    seen.push("прилавок");
    if(!/кооператив/i.test(txt))bad.push("прилавок без штампа молчит о том, кому он открыт");
    else if(!GATE_WHY.test(txt))bad.push("прилавок называет дверь, но не порог");
    if(typeof closeStation==="function")try{closeStation();}catch(e){}
    tab="market";G.mode="system";G.st=null;
  }
  /* 3. взлёт без топлива: самый жестокий порог в игре — он обязан говорить */
  resetWorld();
  if(typeof landOnTestPlanet==="function"){
    landOnTestPlanet();
    G.fuel=0;G.msg="";
    seen.push("взлёт");
    const cr0=G.credits;
    try{ launch(); }catch(e){ bad.push("взлёт бросил: "+e.message); }
    /* Без топлива «ВЗЛЁТ» уводит не в космос, а в эвакуацию (M19): это
       законный выход, и он тоже обязан быть НАЗВАН — ценой или потерей.
       Поэтому проверяется не «остались на месте», а «сказано, что случилось». */
    const moved=(G.mode!=="surface"&&G.mode!=="landing");
    const why=said()+" "+((G.log||[]).slice(-2).map(r=>r.s||"").join(" "));
    if(moved&&!/эвакуац|кредит|потер|новый|кр(?![а-яё])/i.test(why))
      bad.push("без топлива унесло в «"+G.mode+"», и не сказано, чем это было: «"+why.replace(/\n/g," ").slice(0,60)+"»");
    else if(!moved&&!GATE_WHY.test(said()))
      bad.push("взлёт: отказ без причины — «"+said().replace(/\n/g," ").slice(0,40)+"»");
    if(moved&&G.credits<cr0)seen.push("эвакуация за "+(cr0-G.credits)+" кр");
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
  ok(seen.length>=2,"порогов проверено: "+seen.join(", "));
  eq(bad.slice(0,4).join(" ;; "),"","каждая закрытая дверь названа");
}));

TEST_SUITES.push(() => suite("порог: выключенная кнопка объяснена строкой, в которой стоит", () => {
  /* Кнопка бывает выключена по делу: нет денег, нет места, нет ранга. Но
     причина обязана быть НА ЭКРАНЕ, рядом — в той же строке. Иначе игрок
     видит серую кнопку и не знает, что с ней сделать, чтобы она ожила. */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  /* нищий: именно у него выключается больше всего */
  G.credits=0;G.data=0;G.matches=0;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const bad=[];let off=0,checked=0;
  const look=(bodySel,ru)=>{
    const box=document.querySelector(bodySel);
    if(!box)return;
    for(const b of box.querySelectorAll("button")){
      if(!b.disabled)continue;
      const cs=getComputedStyle(b);
      if(cs.display==="none"||cs.visibility==="hidden")continue;
      off++;
      /* строка кнопки — её ближайший .row, а если его нет, то родитель */
      const row=b.closest(".row")||b.parentElement;
      const txt=String((row&&row.textContent)||"").replace(/\s+/g," ").trim();
      const lbl=String(b.textContent||"").replace(/\s+/g," ").trim();
      /* сама надпись тоже может быть причиной: «6 400 кр» объясняет себя */
      checked++;
      if(!GATE_WHY.test(txt)&&!GATE_WHY.test(lbl))
        bad.push(ru+" · «"+lbl.slice(0,18)+"» выключена молча: «"+txt.slice(0,40)+"»");
    }
  };
  if(typeof tableToggle==="function"){
    tableToggle(true);
    for(const t of [...document.querySelectorAll("#tableTabs button")].map(x=>x.dataset.tab)){
      try{ tableSetTab(t); }catch(e){ continue; }
      look("#tableBody","стол/"+t);
    }
    tableToggle(false);
  }
  if(G.sys.station&&typeof openStation==="function"){
    G.st=G.sys.station;G.mode="dock";
    try{ openStation(); }catch(e){ }
    for(const t of [...document.querySelectorAll("#stTabs button")].map(x=>x.dataset.tab)){
      try{ tab=t;renderTab(); }catch(e){ continue; }
      look("#stBody","станция/"+t);
    }
    if(typeof closeStation==="function")try{closeStation();}catch(e){}
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
  ok(off>0,"выключенных кнопок найдено: "+off);
  eq(bad.slice(0,5).join(" ;; "),"","каждая серая кнопка объясняет, чего ей не хватает"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("ставка: заправка и ремонт берут ровно по объявленной цене", () => {
  /* «ТОПЛИВО 12 кр/ед · РЕМОНТ 9 кр/ед» — это ставка, обещание за единицу.
     Проверка простая и раньше её не было ни у кого: заправиться, посчитать,
     сколько единиц пришло, и сверить со списанным. Ошибка на единицу здесь
     не видна глазом никогда, а стоит игроку денег в каждом рейсе. */
  resetWorld();
  if(!G.sys.station){ok(true,"станции нет — пропуск");return;}
  G.st=G.sys.station;G.mode="dock";
  const bad=[];
  const st=stat();
  /* ── заправка ── */
  G.credits=100000;G.fuel=Math.max(0,st.fuelMax-37);
  const per=fuelPriceHere(),f0=G.fuel,c0=G.credits;
  const bR=document.getElementById("bRefuel");
  ok(!!bR,"кнопка заправки на месте");
  if(bR){
    bR.click();
    const got=G.fuel-f0,paid=c0-G.credits;
    if(!(got>0))bad.push("заправка не долила ни единицы");
    else if(paid!==got*per)bad.push("залито "+got+" ед по "+per+" кр — это "+(got*per)+", а списано "+paid);
    if(G.fuel>st.fuelMax+.001)bad.push("бак перелит: "+G.fuel+" из "+st.fuelMax);
    /* и второй раз, когда бак полон, — отказ вслух, а не тихое списание */
    const c1=G.credits;
    bR.click();
    if(G.credits<c1)bad.push("полный бак всё равно взял денег: "+(c1-G.credits));
  }
  /* ── ремонт ── */
  G.credits=100000;G.hull=Math.max(1,stat().hullMax-23);
  const rep=repairCost(),h0=G.hull,c2=G.credits;
  const bF=document.getElementById("bRepair");
  if(bF){
    bF.click();
    const got=G.hull-h0,paid=c2-G.credits;
    if(!(got>0))bad.push("ремонт не починил ни единицы");
    else if(paid!==got*rep)bad.push("починено "+got+" ед по "+rep+" кр — это "+(got*rep)+", а списано "+paid);
    if(G.hull>stat().hullMax+.001)bad.push("корпус выше предела: "+G.hull);
  }
  /* нищему говорят, а не молчат */
  G.credits=0;G.fuel=1;G.msg="";
  if(bR){ bR.click(); if(!String(G.msg||"").trim())bad.push("нищему на заправке не сказали ничего"); }
  G.mode="system";G.st=null;
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  eq(bad.slice(0,4).join(" ;; "),"","ставка честная: списано ровно по объявленной цене");
  resetWorld();
}));
