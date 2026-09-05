/* ══════════════ матрица дверей (M357) ══════════════
   PLAN, «Systems»: «У зависания автора причины до сих пор нет». Фуззер гоняет
   каждую сцену по отдельности и находит исключения; наборы про клавиши гоняют
   каждую клавишу. Никто не пробовал ПЕРЕХОДЫ КРЕСТ-НАКРЕСТ: из каждой сцены во
   все двери подряд, включая те, которые в этой сцене не предусмотрены.

   Почему это и есть место для зависания: `stepWorld` разбирает режим парами
   («шахта И G.dig»), и режим без своего состояния не падает — он ПЕРЕСТАЁТ
   ДЕЛАТЬ ЧТО-ЛИБО. Ни кадра, ни отрисовки, ни отклика на клавиши, и в консоли
   пусто. Снаружи это выглядит как «игра повисла», а изнутри — как пара, где
   одна половина осталась от прошлой сцены.

   Проверяется каждая клетка матрицы: поставить сцену, войти в дверь, спросить
   три вещи — согласны ли режим и состояние, живёт ли кадр, и можно ли выйти
   обратно. Двери, которых в этой сцене быть не должно, обязаны отказать, а не
   пустить в полуоткрытое состояние. */

/* та же пара «режим — состояние», что у набора про клавиши: одна на все проверки */
function drPair(){
  const need={surface:"surf",landing:"land",dig:"dig",cave:"cave",belt:"belt",scoop:"scoop",
    base:"base",raid:"raid",homein:"hin",winter:"win",spa:"spa",wanderer:"wan"}[G.mode];
  if(need&&!G[need])return "режим "+G.mode+" без состояния G."+need;
  return "";
}
/* двери игры: имя, как её зовут, и как её зовёт игрок */
function drDoors(){
  const p=()=>(G.surf&&G.surf.p)||(G.land&&G.land.p)||(G.sys.planets||[])[0]||null;
  return [
    {ru:"посадка",  go:()=>{const q=p();if(q&&typeof startLanding==="function")startLanding(q);}},
    {ru:"грунт",    go:()=>{if(typeof enterSurface==="function"&&G.land)enterSurface();}},
    {ru:"шахта",    go:()=>{if(typeof enterDig==="function")enterDig();}},
    {ru:"пещера",   go:()=>{if(typeof enterCave==="function")enterCave();}},
    {ru:"пояс",     go:()=>{if(typeof enterBelt==="function")enterBelt();}},
    {ru:"черпак",   go:()=>{const q=(G.sys.planets||[]).find(x=>x.type==="gas");if(q&&typeof startScoop==="function")startScoop(q);}},
    {ru:"база",     go:()=>{const q=p();if(q&&typeof enterBase==="function")enterBase(q);}},
    {ru:"дом",      go:()=>{if(typeof enterHomeIn==="function")enterHomeIn();}},
    {ru:"зимовка",  go:()=>{if(typeof enterWinter==="function")enterWinter();}},
    {ru:"санаторий",go:()=>{if(typeof enterSpa==="function")enterSpa();}},
    {ru:"взлёт",    go:()=>{if(typeof launch==="function"&&G.surf)launch();}},
    {ru:"карта",    go:()=>{G.mode="map";}},
    {ru:"станция",  go:()=>{if(G.sys.station&&typeof openStation==="function"){G.st=G.sys.station;G.mode="dock";openStation();}}}
  ];
}
/* выходы: то, чем игрок закрывает дверь за собой */
function drOut(){
  const out=["exitDig","exitCave","exitBelt","exitScoop","exitBase","exitHomeIn",
             "exitWinter","exitSpa","exitWanderer","closeStation"];
  for(const n of out){const f=window[n];if(typeof f==="function"){try{f();}catch(e){}}}
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
}

TEST_SUITES.push(() => suite("двери: из каждой сцены в каждую дверь — и обратно", () => {
  const bad=[],ok0=[],refused=[];
  let cells=0,opened=0;
  const doors=drDoors();
  for(const sc of lookScenes()){
    for(const d of doors){
      resetWorld();
      let set=true;
      try{ set=sc.set()!==false; }catch(e){ continue; }
      if(!set||G.mode==="none")continue;
      const from=G.mode;
      cells++;
      /* Дверь, которой в этой сцене нет, вправе ОТКАЗАТЬ — хоть словом, хоть
         исключением: `enterDig` читает `G.surf.p`, и в космосе его нет. Это не
         дефект, это предусловие внутренней функции, до которой игроку не
         дотянуться. Дефект — другое: полуоткрытое состояние ПОСЛЕ отказа.
         Поэтому исключение записываем в отказы и проверяем мир дальше. */
      try{ d.go(); }catch(e){ refused.push(sc.id+"→"+d.ru); }
      const to=G.mode;
      if(to!==from)opened++;
      const sick=drPair();
      if(sick){ bad.push(sc.id+"("+from+") → "+d.ru+": "+sick); continue; }
      /* кадр после перехода: он обязан жить, а не встать */
      let died="";
      for(let i=0;i<12;i++){
        actEdge=false;
        try{ stepWorld(1); }catch(e){ died="update: "+e.message; break; }
        if(i%4===0){ try{ drawWorld(); }catch(e){ died="draw: "+e.message; break; } }
        G.t++;
      }
      if(died){ bad.push(sc.id+" → "+d.ru+" · "+died); continue; }
      const sick2=drPair();
      if(sick2){ bad.push(sc.id+" → "+d.ru+" · после дюжины кадров: "+sick2); continue; }
      /* и назад: закрыв дверь, мир обязан остаться целым */
      drOut();
      const sick3=drPair();
      if(sick3)bad.push(sc.id+" → "+d.ru+" · на выходе: "+sick3);
      else ok0.push(sc.id+"→"+d.ru);
    }
  }
  resetWorld();
  ok(cells>=100,"клеток матрицы пройдено: "+cells+", дверей открылось: "+opened+
     ", отказов не по месту: "+refused.length);
  eq(bad.slice(0,6).join(" ;; "),"","ни одна дверь не оставляет режим без состояния"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("двери: сейв на пороге каждой двери читается обратно", () => {
  /* Вторая половина той же матрицы: игра сохраняется САМА (saveGame(true) стоит
     в стыковке, взлёте, эвакуации), и сохраниться она может ровно в тот миг,
     когда игрок в двери. Сейв, снятый в полуоткрытом состоянии, — это сейв,
     который завтра откроется в никуда. */
  const bad=[];let saved=0;
  const doors=drDoors();
  for(const sc of lookScenes()){
    for(const d of doors){
      resetWorld();
      let set=true;
      try{ set=sc.set()!==false; }catch(e){ continue; }
      if(!set||G.mode==="none")continue;
      try{ d.go(); }catch(e){ continue; }
      let js="";
      try{ js=JSON.stringify(snapshot()); }catch(e){ bad.push(sc.id+" → "+d.ru+": снимок не пишется: "+e.message); continue; }
      let loaded=false;
      try{ loaded=applySave(JSON.parse(js))!==false; }catch(e){ bad.push(sc.id+" → "+d.ru+": сейв не читается: "+e.message); continue; }
      saved++;
      if(!loaded){ bad.push(sc.id+" → "+d.ru+": сейв отвергнут"); continue; }
      /* после загрузки мир обязан открыть какой-то экран и жить */
      const sick=drPair();
      if(sick){ bad.push(sc.id+" → "+d.ru+" · после загрузки: "+sick); continue; }
      try{ stepWorld(1); drawWorld(); }catch(e){ bad.push(sc.id+" → "+d.ru+" · кадр после загрузки: "+e.message); }
      if(bad.length>5)break;
    }
    if(bad.length>5)break;
  }
  resetWorld();
  ok(saved>=60,"сейвов в дверях снято и прочитано: "+saved);
  eq(bad.slice(0,5).join(" ;; "),"","сейв в дверях переживает круг");
}));

TEST_SUITES.push(() => suite("сторож кадра: повторяющийся сбой не замолкает навсегда", () => {
  /* PLAN, «Systems»: «Следующий случай должен принести строку СБОЙ · … — этой
     улики и не хватает». Улику съедала защита от стены сообщений: одна и та же
     строка называлась ОДИН раз за всё время. Сообщение гаснет за пару секунд,
     в журнале остаётся одна запись — и если сбой идёт кадр за кадром (а
     зависание выглядит именно так), через минуту не остаётся ничего.

     Договор теперь такой: подряд идущий сбой не встаёт стеной, но раз в
     пятнадцать секунд напоминает о себе и называет счёт. Слово «проверка» в
     начале сообщения — уговор с общим сторожем прогона (91zzzzz): такие сбои
     наведены нарочно и в счёт чужих не идут. */
  resetWorld();
  const real=Date.now,t0=real.call(Date);
  let skew=0;
  Date.now=function(){ return t0+skew; };
  try{
    const e=new Error("проверка сторожа");
    const n0=(G.log||[]).length;
    G.msg="";
    crashSay(e,"набор");
    ok(String(G.msg||"").indexOf("СБОЙ")>=0,"первый сбой назван вслух");
    ok((G.log||[]).length>n0,"и записан в журнал");
    /* тот же сбой ещё сотню раз в ту же секунду — стены быть не должно */
    G.msg="";const n1=(G.log||[]).length;
    for(let i=0;i<100;i++)crashSay(e,"набор");
    eq(G.msg,"","сто повторов подряд молчат — стены сообщений нет");
    eq((G.log||[]).length,n1,"и журнал не растёт от повторов");
    /* а через пятнадцать секунд — напоминание со счётом */
    skew=16000;
    crashSay(e,"набор");
    const said=String(G.msg||"");
    ok(said.indexOf("СБОЙ")>=0&&/повтор/i.test(said),"через пятнадцать секунд сбой напомнил о себе: «"+said.split("\n")[0]+"»");
    ok(/\d/.test(said),"и назвал счёт");
    ok((G.log||[]).length>n1,"напоминание есть и в журнале");
  }finally{ Date.now=real; }
  resetWorld();
}));

TEST_SUITES.push(() => suite("журнал сбоев на сервер: молчит на стенде, считает повторы", () => {
  /* Автор, 2026-09-05: «просто пиши на сервер лог, все ошибки, любые». crashShip —
     единственная дверь наружу для ошибок; на стенде (TEST есть) она обязана
     молчать, а её учёт повторов — считать, не отправляя. */
  ok(typeof crashShip==="function","crashShip есть");
  ok(typeof crashStack==="function","crashStack есть");
  const n0=CRASH_SHIP.n;
  crashShip("crash","проверка стенда","");
  eq(CRASH_SHIP.n,n0,"на стенде ничего не уходит");
  const st=crashStack(new Error("x"));
  ok(st.split("\n").length<=8,"стек — не больше восьми строк");
  ok(typeof console.error==="function"&&typeof console.warn==="function","console.error/warn на месте после подмены");
  ok(typeof logAdd==="function","logAdd на месте после подмены");
}));
