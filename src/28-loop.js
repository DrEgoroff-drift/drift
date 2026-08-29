/* ══════════════ авария ══════════════ */
function wreck(){
  sfx("boom",{v:1});stopEngine();
  const st=stat();
  G.hull=Math.round(st.hullMax*.45);G.fuel=Math.max(G.fuel,30);
  const a=Math.random()*TAU;
  G.ship.x=Math.cos(a)*1600;G.ship.y=Math.sin(a)*1600;
  G.ship.vx=0;G.ship.vy=0;G.mode="system";G.ap=null;G.belt=null;G.dig=null;G.cave=null;G.surf=null;G.land=null;
  G.pirates=[];G.shots=[];   /* без этого авария у пиратов превращается в петлю */
  /* люди на борту (M114) гибнут вместе с кораблём, и это записывается отдельной
     строкой: вывоз — не перевозка ящиков, и цена ошибки должна называться */
  const pax=G.cargo.folk|0;
  if(pax&&G.doom)G.doom.lost=((G.doom.lost|0)+pax);
  let lost=0;for(const k of RES_KEYS){lost+=G.cargo[k];G.cargo[k]=0;}
  saveGame(true);
  if(pax)logAdd("warn","С кораблём погибли вывезенные · "+pax+" человек");
  logAdd("warn","Корабль разбит · аварийный ремонт"+(lost?" · груз потерян ("+lost+" ед)":""));
  say("Аварийный ремонт\n"+(lost?"груз потерян ("+lost+")":"трюм был пуст"));
}

/* телеметрия и hud() переехали в 27z-telemetry (распил 0.209.0) */

/* ══════════════ звук по кадрам ══════════════ */
/* Гул двигателя и шаги — единственное, что зависит от каждого кадра.
   Всё остальное дёргается событиями из игровой логики. */
let sndWalk=0, lastFuelWarn=0, lastHullWarn=0;
function audioTick(dt){
  if(!audioOn()||!SND.ready){return;}
  const st=stat();
  /* напряжение одним числом: бой, пробитый корпус, глубина шахты.
     Оно управляет плотностью музыки — отдельного «боевого трека» не нужно. */
  let ten=0;
  if(G.mode==="system"||G.mode==="dock"){
    const aware=G.pirates.filter(p=>p.aware).length;
    ten=Math.min(1,aware*.45);
  }else if(G.mode==="belt")ten=.2;
  else if(G.mode==="dig"&&G.dig)ten=Math.min(.7,G.dig.row/45);
  else if(G.mode==="cave")ten=.35;
  if(G.hull/st.hullMax<.35)ten=Math.max(ten,.5);
  MUS.iTarget=ten;
  MUS.intensity+=(MUS.iTarget-MUS.intensity)*Math.min(1,.012*dt);
  const sc=musicSceneNow();
  musicSetScene(sc[0],sc[1]);
  /* уровни слоёв подтягиваются к напряжению постоянно, а не только при смене сцены */
  if(MUS.ready&&MUS.sc){
    const t=SND.ctx.currentTime;
    MUS.layers.perc.gain.setTargetAtTime(layerLevel("perc",MUS.sc),t,.6);
    MUS.layers.motif.gain.setTargetAtTime(layerLevel("motif",MUS.sc),t,.6);
  }
  /* двигатель звучит только когда реально работает: постоянный холостой гул
     превращался в бесконечное гудение и глушил всю остальную звуковую картину */
  if(G.mode==="system"||G.mode==="dock"){
    const on=(keys.thrust||G.ap)&&G.fuel>0&&G.mode!=="dock";
    if(on)engineLoop(1,G.mods.engine/4);else stopEngine();
  }else if(G.mode==="belt"&&G.belt){
    if(keys.thrust)engineLoop(.9,G.mods.engine/4);else stopEngine();
  }else if(G.mode==="landing"&&G.land){
    if(keys.thrust)engineLoop(1,.5);else stopEngine();
  }else stopEngine();
  /* тон места (09a): ветер по погоде, порода в глубине, дом изнутри */
  if(typeof roomToneTick==="function")roomToneTick(dt);
  /* шаги: в такт уже существующей фазе ходьбы, а не по своему таймеру */
  let ph=null,ground=420;
  if(G.mode==="surface"&&G.surf&&G.surf.on){ph=G.surf.walkPhase;ground=520;}
  else if(G.mode==="cave"&&G.cave){ph=G.cave.walkPhase;ground=300;}
  else if(G.mode==="dig"&&G.dig){ph=G.dig.walkPhase;ground=260;}
  if(ph!=null){
    const s=Math.floor(ph/Math.PI);
    if(s!==sndWalk){sndWalk=s;sfx("step",{f:ground});}
  }
  /* предупреждения: не чаще раза в несколько секунд, иначе это пытка */
  const nowT=G.t;
  if(G.fuel/st.fuelMax<.12&&nowT-lastFuelWarn>420&&G.mode!=="dock"){
    lastFuelWarn=nowT;sfx("alarm",{f:330});
  }
  if(G.hull/st.hullMax<.25&&nowT-lastHullWarn>420){
    lastHullWarn=nowT;sfx("alarm",{f:220});
  }
}

/* ══════════════ цикл ══════════════ */
let last=performance.now();
let lastDroneTick=0;
/* ── потолок кадров ──
   Единственный рычаг, который снимает нагрузку с ВИДЕОКАРТЫ, ничего не упрощая
   в картинке: тридцать кадров рисуют ровно вдвое меньше пикселей, чем
   шестьдесят, а «Дрейф» — не аркада, где решают миллисекунды. На встроенной
   графике это разница между вентилятором на взлёте и тишиной.

   Считаем НЕ по времени, а по кадрам развёртки. Порог по времени кажется
   очевидным решением и врёт: развёртка выдаёт кадры через равные промежутки,
   и порог, попавший между двумя, округляется вниз до ближнего — потолок в 45
   на шестидесятигерцовом экране превращается в 30, а не в 45. Пропуск по счёту
   кадров даёт ровно то, что обещано, и без дрожания.

   Шаг округляется ВВЕРХ, потому что это потолок: лучше отдать 48 кадров под
   обещание «не выше шестидесяти», чем 72. Частота развёртки измеряется сама —
   по самому короткому промежутку за последние кадры: этот промежуток и есть
   период экрана, всё, что длиннее, — просадка.

   Пропускается весь такт целиком, вместе с расчётом: `dt` считается по
   настоящим часам, и на тридцати кадрах он просто вдвое крупнее — движение
   остаётся тем же, замедления не возникает. */
/* ══════════════ авторазрешение ══════════════
   Замер 0.87: на экране ×2.5 поверхность шла в 23 кадра, при ×1 — в 49, и
   дело было не в логике (≤4 мс), а в растре. Пока игрок не выбрал разрешение
   сам, игра начинает с полного и спускается на полступени, если кадр
   по сглаженной оценке не укладывается в 24 мс три секунды подряд. Вверх
   сама не идёт: дрожание «чётко — мыльно — чётко» хуже ровной картинки. */
let resEma=16,resBad=0;
function resAuto(d){
  if(!G.running||d<=0||d>250)return;
  resEma=resEma*.9+d*.1;
  if(G.opts.gfx.res||RES_AUTO<=1||document.hidden){resBad=0;return;}
  if(resEma>24)resBad+=d;else resBad=Math.max(0,resBad-d*.5);
  if(resBad>3000){
    resBad=0;resEma=16;
    RES_AUTO=RES_AUTO>1.5?1.5:1;
    if(DPR>RES_AUTO){resize();say("Разрешение снижено до ×"+RES_AUTO+"\nвернуть — в настройках, «Графика»");}
  }
}
let capIv=16.667, capPrev=0, capN=0;
/* Выключатель цикла. Прогон тестов гоняет мир сам и в кадрах не нуждается:
   пока они шли, фоновые кадры двигали G под тестами и жгли время впустую —
   а в headless с виртуальным временем непрерывный rAF не давал странице
   дойти до отчёта вовсе (M170). Ставится в tests/90-harness. */
let LOOP_OFF=false;
/* ── кадр без интерфейса (M233) ──
   Стенды заглавной снимают МИР: с M221 часть интерфейса (фишки целей, строка
   подсказки, рамка выбранной ячейки на базе) рисуется на канве, и на снимках
   она читается отладочной разметкой. Игра его не выключает никогда — флаг
   поднимают только стенды, и в самой игре он всегда false. */
let SHOT_CLEAN=false;
/* ══════════════ развилка режимов — одна на всех (M238) ══════════════
   Кто ходит и кто рисуется в этом режиме, знал только кадр. Из-за этого любой
   ДРУГОЙ прогон мира — стенд, пробник, фуззер — повторял ту же таблицу своими
   руками и повторял её НЕТОЧНО: звал `updateDig`, когда игрок уже вышел на
   поверхность, и получал падение, которого в игре нет. Таблица теперь одна:
   кадр зовёт её, и все остальные тоже. Правило то же, что у кнопки, — у вещи
   один хозяин. */
function stepWorld(dt){
  if(G.mode==="system"||G.mode==="dock"||G.mode==="barge")updateSystem(dt);
  else if(G.mode==="landing")updateLanding(dt);
  else if(G.mode==="surface"){updateSurface(dt);tickLaunchHold(dt);}
  else if(G.mode==="dig"&&G.dig)updateDig(dt);
  else if(G.mode==="cave"&&G.cave)updateCave(dt);
  else if(G.mode==="belt"&&G.belt)updateBelt(dt);
  else if(G.mode==="scoop"&&G.scoop)updateScoop(dt);
  else if(G.mode==="base"&&G.base)updateBase(dt);
  else if(G.mode==="raid"&&G.raid)updateRaid(dt);
  else if(G.mode==="homein"&&G.hin)updateHomeIn(dt);   /* дом изнутри (M170) */
  else if(G.mode==="winter"&&G.win)updateWinter(dt);   /* зимовка (M197) */
  else if(G.mode==="spa"&&G.spa)updateSpa(dt);         /* санаторий (M199) */
}
function drawWorld(){
  if(G.mode==="system"||G.mode==="dock"||G.mode==="barge")drawSystem();
  else if(G.mode==="map")drawMap();
  else if(G.mode==="landing")drawLanding();
  else if(G.mode==="surface")drawSurface();
  else if(G.mode==="dig"&&G.dig)drawDig();
  else if(G.mode==="cave"&&G.cave)drawCave();
  else if(G.mode==="belt"&&G.belt)drawBelt();
  else if(G.mode==="scoop"&&G.scoop)drawScoop();
  else if(G.mode==="base"&&G.base)drawBase();
  else if(G.mode==="raid"&&G.raid)drawRaid();
  else if(G.mode==="homein"&&G.hin)drawHomeIn();
  else if(G.mode==="winter"&&G.win)drawWinter();
  else if(G.mode==="spa"&&G.spa)drawSpa();
}
function frameBody(now){
  if(LOOP_OFF)return;
  /* Скрытая страница не рисует. Обычно её и так не будят — rAF стоит, — но в
     headless с виртуальным временем кадры идут как из пулемёта, и полная
     отрисовка в невидимую канву съедала весь бюджет: прогон тестов вставал
     намертво (M170). Стенды рисуют своими вызовами и этой ветки не касаются. */
  if(document.hidden){return;}
  /* дорожный спутник рисует свой кадр сам и занимает весь экран: мир под ним
     не виден, а батарею ест вдвое — а именно батарея и есть заявленная цена
     режима. Плюс это единственный путь, которым мировой холст мог просочиться
     поверх заставки (стенд M168k). Цепочка кадров не рвётся: выйдут — поедет. */
  if(RD&&document.body.classList.contains("road")){return;}
  /* канва нулевого размера (страница поднялась скрытой) — чинится здесь же:
     иначе кадр падает на drawImage и игра стоит до первого resize */
  if(W<2||H<2){resize();if(W<2||H<2){return;}}
  if(capPrev){
    const d=now-capPrev;
    /* «самый короткий за последнее время»: медленно отпускаем оценку вверх,
       чтобы смена монитора или переезд окна на другой экран не остались
       незамеченными навсегда */
    if(d>1&&d<capIv)capIv=capIv*.7+d*.3; else capIv=Math.min(capIv*1.002,50);
  }
  capPrev=now;
  const cap=G.opts.gfx.fps;
  if(cap){
    const stride=Math.max(1,Math.ceil(1000/cap/capIv-.15));
    if(++capN%stride){return;}
    capN=0;
  }else capN=0;
  resAuto(now-last);
  const dt=clamp((now-last)/16.667,0,3);last=now;
  /* второй рубеж против залипших клавиш: событие blur приходит не всегда —
     фокус, ушедший в DevTools того же окна, его может не поднять. Пока страница
     не в фокусе, нажатым не может быть ничего по определению, и кадр это
     проверяет сам. Без этого залипшая тяга жжёт топливо, а залипший руль крутит
     корабль на месте — при живом управлении и пустой консоли. */
  if(!document.hasFocus()){if(!wasBlurred){wasBlurred=true;releaseAllKeys();}}
  else wasBlurred=false;
  actEdge=keys.act&&!prevAct;prevAct=keys.act;
  if(G.running){
    G.t+=dt;
    if(now-lastDroneTick>3000){lastDroneTick=now;tickDrones();crewTick();mgrTick();occTick();dealsTick();
      /* срок (12v): считается лениво по часам, тем же редким тактом, что и всё
         остальное фоновое. Узнают о нём, оказавшись под тем самым небом. */
      if(G.doom){doomLearn();doomTick();}
      /* возможности (11ah): истекают молча, тем же редким тактом. Ни звука,
         ни строки — окно просто закрылось, и если оно было именным, человек
         больше не назовёт твой позывной. */
      if(typeof offerTick==="function")offerTick();
      /* и однажды рассказанное возвращается чужим голосом (11aj) */
      if(typeof toldEther==="function")toldEther();}
    if(G.msgT>0)G.msgT-=dt;
    if(G.mode==="system")autosave();
    stepWorld(dt);
    if(typeof tapeTick==="function")tapeTick(dt);
    if(typeof shiftTalkTick==="function")shiftTalkTick(dt);
    if(typeof instrAgeTick==="function")instrAgeTick(dt);
    if(typeof etherTick==="function")etherTick(dt);
    beaconTick(dt);crewBtnTick();if(typeof handBtnTick==="function")handBtnTick();if(typeof firstTick==="function")firstTick();hqBtnTick();loreBtnTick();parrotBtnTick();consoleTick(dt);orderTick();if(typeof vegaTick==="function")vegaTick(dt);if(typeof ringTick==="function")ringTick();if(typeof expDayTick==="function")expDayTick();if(typeof expDepartTick==="function")expDepartTick();if(typeof lastRunTick==="function")lastRunTick();if(typeof recordTick==="function")recordTick();if(typeof instTick==="function")instTick();if(typeof skyTick==="function")skyTick();if(typeof traineeTick==="function")traineeTick();if(typeof zooTick==="function")zooTick();wearTick(dt);
    /* страховка от «зависания на стыковке»: режим dock без единой открытой панели
       означал бы, что игрок смотрит на космос и не может двигаться */
    if(G.mode==="dock"&&!document.querySelector(".scr.open")){
      if(G.st)openStation();else G.mode="system";
    }
    if(G.mode==="barge"&&!document.querySelector(".scr.open"))G.mode="system";
    audioTick(dt);
    drawWorld();
    hud();
    /* приборная стойка (25d) поверх мира: раскрытая аппаратура, к которой
       игрок повернулся. Рисуется последней, но до DOM-строки приборов */
    if(typeof rackDraw==="function")rackDraw();
  }else{
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
    G.t=now*.06;drawNebula(now*.004,0,1);drawStars(now*.004,0,1);
  }
}
/* ══════════════ кадр, который не убивает игру (M234) ══════════════
   Одно исключение внутри кадра рвало цепочку rAF навсегда: кнопки живы,
   мир мёртв, ничего не сделать — и никакого следа, потому что консоль на
   телефоне никто не открывает. Автор поймал это осмотром памятника.
   Теперь исключение ловится здесь: цепочка кадров продолжается, игрок видит
   ЧТО сломалось и успевает уйти в меню и сохраниться. Ошибка называется
   вслух ОДИН раз — повтор той же строки только считается, иначе сообщение
   встанет стеной на каждом кадре. */
let crashN=0,crashLast="",crashSaid=0;
function crashSay(e,where){
  crashN++;
  let m="";
  try{m=(e&&e.message)||String(e);}catch(_){m="?";}
  if(where)m+=" · "+where;
  if(m===crashLast)return;
  crashLast=m;
  if(crashSaid++<3){try{console.error("DRIFT:",e);}catch(_){}}
  try{say("СБОЙ · "+m+"\nигра идёт дальше — сохранитесь");}catch(_){}
  try{logAdd("warn","Сбой кадра: "+m);}catch(_){}
}
function frame(now){
  if(LOOP_OFF)return;
  try{frameBody(now);}catch(e){crashSay(e,G&&G.mode);}
  requestAnimationFrame(frame);
}
/* то же для ошибок вне кадра: обработчик нажатия, ответ сервера, таймер.
   Они кадр не рвут, но молчат так же — а молчащая ошибка живёт годами. */
addEventListener("error",e=>{if(e&&(e.error||e.message))crashSay(e.error||e.message,"вне кадра");});
addEventListener("unhandledrejection",e=>crashSay(e&&e.reason,"обещание"));
applyPadMode();applyPadSize();
requestAnimationFrame(frame);

/* ══════════════ prof() — на что уходит кадр ══════════════
   Оптимизация 0.87 началась с того, что «тормозит» не имело адреса: по
   ощущению, а не по функции. Команда прогоняет N кадров текущего режима без
   rAF (работает и в скрытой вкладке), меряет JS по каждой draw-функции и
   отдельно время растра — принудительный сброс через getImageData после
   кадра. Растр в канвасе — это то, чего не видно ни в одном профайлере
   по функциям, а именно он и стоил 23 кадра на поверхности.

   Звать `prof()` или `prof(60)` в консоли. Возвращает объект; смотреть
   `js_ms`, `raster_ms` и `top` — кто сколько. Чтобы найти растровую цену
   одной функции, глушат её и смотрят, насколько упал raster_ms:
   `prof(30,"drawGround")`. */
function prof(N,mute){
  N=N||30;
  const M={system:[updateSystem,drawSystem],dock:[updateSystem,drawSystem],barge:[updateSystem,drawSystem],
    map:[()=>{},drawMap],landing:[updateLanding,drawLanding],surface:[updateSurface,drawSurface],
    dig:[updateDig,drawDig],cave:[updateCave,drawCave],belt:[updateBelt,drawBelt],
    scoop:[updateScoop,drawScoop],base:[updateBase,drawBase],raid:[updateRaid,drawRaid]}[G.mode];
  if(!M)return {ошибка:"режим "+G.mode+" не профилируется"};
  const names=Object.keys(window).filter(k=>typeof window[k]==="function"&&/^(draw[A-Z]|fill[A-Z]|b[A-Z][a-z]|hud$)/.test(k)&&k!=="drawChunks");
  const T={},orig={};
  for(const n of names){orig[n]=window[n];
    window[n]=function(){const t=performance.now();try{return orig[n].apply(this,arguments);}finally{T[n]=(T[n]||0)+performance.now()-t;}};}
  if(mute&&orig[mute])window[mute]=function(){};
  let js=0,ras=0;
  try{
    for(let i=0;i<N;i++){
      const t0=performance.now();G.t+=1;M[0](1);M[1]();hud();
      const t1=performance.now();ctx.getImageData(0,0,1,1);const t2=performance.now();
      if(i>=3){js+=t1-t0;ras+=t2-t1;}
    }
  }finally{for(const n in orig)window[n]=orig[n];}
  const k=Math.max(1,N-3);
  const top={};
  for(const [n,v] of Object.entries(T).sort((a,b)=>b[1]-a[1]).slice(0,16))
    if(v/k>=.05)top[n]=+(v/k).toFixed(2);
  return {режим:G.mode,кадров:k,разрешение:W+"×"+H+" @"+DPR,js_ms:+(js/k).toFixed(2),
    raster_ms:+(ras/k).toFixed(2),заглушено:mute||"—",top};
}

/* ══════════════ dbg() — что держит корабль ══════════════
   Отладка полёта началась с того, что игрок не мог сдвинуться с места, а
   консоль была пуста и кадры шли ровно шестьдесят. По ошибкам такое не ищется:
   корабль удерживает не исключение, а состояние — захват орбиты, автопилот,
   залипшая клавиша, открытый экран, потерянный фокус. Команда печатает ровно
   эти пять вещей и меряет кадр, чтобы больше не гадать.

   Звать `dbg()` в консоли. Возвращает объект, а не строку: в консоли он
   разворачивается сам, `copy(dbg())` кладёт в буфер. */
function dbg(){
  const sh=G.ship,sys=G.sys,st=stat();
  const heldKeys=Object.keys(keys).filter(k=>keys[k]);
  const scr=document.querySelector(".scr.open");
  const O=G.orbit;
  let holds=[];
  if(O)holds.push("захват орбиты вокруг «"+(O.p&&O.p.name||"?")+"»"+
    (O.sys&&O.sys!==G.sx+","+G.sy?" ИЗ ЧУЖОГО СЕКТОРА "+O.sys:""));
  if(G.ap)holds.push("автопилот ("+G.ap.kind+", "+G.ap.phase+")");
  if(heldKeys.length)holds.push("зажаты клавиши: "+heldKeys.join(", "));
  if(scr)holds.push("открыт экран #"+scr.id);
  if(!document.hasFocus())holds.push("страница не в фокусе");
  if(!G.running)holds.push("игра не запущена (заставка)");
  if(G.watch)holds.push("режим наблюдения за наёмником");
  if(G.fuel<=0)holds.push("топливо на нуле");
  /* курс, накопивший обороты, ломает всякий расчёт по углу — проверяем прямо */
  if(Math.abs(sh.a)>Math.PI*3)
    holds.push("курс накопил "+Math.round(Math.abs(sh.a)/TAU)+" оборотов ("+
      sh.a.toFixed(1)+" рад) — расчёт углов врёт");
  const d0=Math.hypot(sh.x,sh.y);
  const rEdge=(sys&&sys.belt?sys.belt.orbit:2400)*1.6;
  if(d0>rEdge)holds.push("за кромкой системы: "+Math.round(d0)+" при кромке "+
    Math.round(rEdge)+" — курс «прочь» тут заворачивает к звезде");
  /* кадр меряем по-настоящему, а не по G.t: жалоба на «залипание» одинаково
     звучит и при тридцати кадрах, и при намертво удерживающем состоянии.
     Заодно следим за скоростью и топливом: «жжёт и не едет» — отдельная
     болезнь, и её надо называть отдельно от просадки кадров. */
  let n=0,t0=performance.now(),lt=t0,mx=0,slow=0;
  const v0=Math.hypot(sh.vx,sh.vy),f0=G.fuel;
  return new Promise(r=>{
    (function f(){
      const t=performance.now(),d=t-lt;lt=t;
      if(n++){mx=Math.max(mx,d);if(d>25)slow++;}
      if(t-t0<1000)requestAnimationFrame(f);
      else{
        const v1=Math.hypot(sh.vx,sh.vy),burnt=f0-G.fuel;
        const fps=n/((t-t0)/1000);
        let verdict;
        if(burnt>.05&&v1<.5&&v1<=v0+.05)
          verdict="ДВИГАТЕЛЬ РАБОТАЕТ ВПУСТУЮ — за секунду сожжено "+burnt.toFixed(1)+
            " топлива, а скорость "+v0.toFixed(2)+" → "+v1.toFixed(2);
        else if(holds.length)verdict="корабль удерживается, см. «что держит»";
        else if(fps<45)verdict="просадка кадров: "+fps.toFixed(0)+" fps — управление живо, но отклик вязкий";
        else verdict="корабль свободен и слушается";
        const out={
          версия:VER, вердикт:verdict,
          чтоДержит:holds.length?holds:["ничего"],
          где:"система "+(sys&&sys.name)+", сектор "+G.sx+":"+G.sy+", режим "+G.mode+
            ", "+Math.round(d0)+" ед. от звезды",
          корабль:"скорость "+v1.toFixed(2)+", поворот "+sh.av.toFixed(3)+
            ", курс "+sh.a.toFixed(2)+" рад",
          ресурсы:"топливо "+G.fuel.toFixed(1)+"/"+Math.round(st.fuelMax)+
            ", корпус "+Math.round(G.hull)+"/"+Math.round(st.hullMax)+
            ", трюм "+held()+"/"+st.cargoMax,
          вокруг:"пиратов "+G.pirates.length+", выстрелов "+G.shots.length+
            ", дронов "+G.drones.length+", союзников "+(G.allies||[]).length,
          кадр:fps.toFixed(0)+" fps, худший "+mx.toFixed(0)+" мс, просевших "+slow,
          экран:"зум "+G.zoom.toFixed(2)+", холст "+c.width+"×"+c.height+", dpr "+devicePixelRatio
        };
        /* печатаем текстом: из простыни JSON человеку ничего не видно, а так
           верхняя строка сразу говорит, что не так */
        console.log("\nДРЕЙФ "+VER+" · диагностика полёта\n\n  ВЕРДИКТ: "+verdict+
          "\n\n  что держит:\n"+out.чтоДержит.map(s=>"    · "+s).join("\n")+
          "\n  где:      "+out.где+"\n  корабль:  "+out.корабль+
          "\n  ресурсы:  "+out.ресурсы+"\n  вокруг:   "+out.вокруг+
          "\n  кадр:     "+out.кадр+"\n  экран:    "+out.экран+"\n");
        r(out);
      }
    })();
  });
}
window.dbg=dbg;
