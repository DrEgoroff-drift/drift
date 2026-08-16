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

/* ══════════════ телеметрия ══════════════ */
const $f=document.querySelector("#fbar i"),$h=document.querySelector("#hbar i"),$cg=document.querySelector("#cbar i");
const $fb=document.getElementById("fbar"),$hb=document.getElementById("hbar");
const $sh=document.querySelector("#sbar i"),$sg=document.getElementById("sgauge");
/* числа рядом со шкалами: «полоска чуть больше половины» не отвечает на
   вопрос «дотяну ли до станции», а «34/100» отвечает */
const $fn=document.getElementById("fnum"),$hn=document.getElementById("hnum");
const $sn=document.getElementById("snum"),$cn=document.getElementById("cnum");
const $vf=document.getElementById("vFuel"),$vh=document.getElementById("vHull");
const $vc=document.getElementById("vHold"),$purse=document.getElementById("purse");
const $place=document.getElementById("place"),$sub=document.getElementById("sub");
const $msg=document.getElementById("msg"),$prompt=document.getElementById("prompt");
const $bThr=document.querySelector("[data-k=thrust]"),$bBrk=document.querySelector("[data-k=brake]");
const $nav=document.getElementById("navbtn"),$fire=document.getElementById("firebtn");
const $msl=document.getElementById("mslbtn");
/* ── пробуждение приборов ──
   Сравниваем не значения по одному, а строку показаний: любое изменение
   будит панель на пару секунд. Тревога держит её открытой, пока не пройдёт.
   Состояние хранится тут, а не в `G`: это оформление, а не игра, и в
   сохранение ему нельзя. */
/* Порог на канал: изменение мельче — расход, крупнее — событие. Расход
   топлива за кадр — сотые доли, попадание по корпусу и любая монета — целые
   единицы, поэтому порог посередине (0.75) отделяет одно от другого начисто. */
const HUD_STEP=[.75,.75,.5,.5,1.5];
let HUD_PREV=null, HUD_T=0;
const $hudp=document.querySelector(".hud");
function hudWake(vals,alarm){
  const now=performance.now();
  if(HUD_PREV){
    for(let i=0;i<vals.length;i++)
      if(Math.abs(vals[i]-HUD_PREV[i])>=HUD_STEP[i]){HUD_T=now;break;}
  }else HUD_T=now;
  HUD_PREV=vals;
  const live=alarm||now-HUD_T<2400;
  if($hudp)$hudp.classList.toggle("live",live);
}
function hud(){
  const st=stat();
  const fr=G.fuel/st.fuelMax, hr=G.hull/st.hullMax, cr=held()/st.cargoMax;
  $f.style.width=clamp(fr*100,0,100).toFixed(1)+"%";
  $h.style.width=clamp(hr*100,0,100).toFixed(1)+"%";
  $cg.style.width=clamp(cr*100,0,100).toFixed(1)+"%";
  $fn.textContent=Math.round(G.fuel)+"/"+Math.round(st.fuelMax);
  $hn.textContent=Math.round(G.hull)+"/"+Math.round(st.hullMax);
  $cn.textContent=held()+"/"+st.cargoMax;
  $sg.style.display=st.shieldMax>0?"":"none";
  if(st.shieldMax>0){
    $sh.style.width=clamp(G.shield/st.shieldMax*100,0,100).toFixed(1)+"%";
    $sn.textContent=Math.round(G.shield)+"/"+Math.round(st.shieldMax);
  }
  $fb.classList.toggle("low",fr<.2);
  $hb.classList.toggle("low",hr<.3);
  /* две ступени тревоги вместо одной: «мало» подсвечивается, «вот-вот» мигает.
     Мигание ловится боковым зрением — во время боя смотреть на приборы некогда. */
  $vf.classList.toggle("low",fr<.2);$vf.classList.toggle("crit",fr<.08);
  $vh.classList.toggle("low",hr<.3);$vh.classList.toggle("crit",hr<.15);
  $vc.classList.toggle("low",cr>=1);
  $purse.textContent=Math.round(G.credits).toLocaleString("ru")+" кр · "+G.data+" дан";
  /* Приборы проявляются, когда есть о чём сказать, и гаснут, когда всё ровно.
     Повод — изменившееся показание, тревога или открытый режим, где приборы
     и есть содержание кадра. Панель, которая горит всегда, перестаёт читаться
     как сообщение и становится частью рамки экрана. */
  /* Поводом считается СКАЧОК показания, а не любое его изменение. Топливо и
     скафандр текут непрерывно: на сравнении округлённых строк панель раз в
     несколько секунд вспыхивала и гасла — сверху экрана шло мигание, которое
     ничего не сообщало. Плавный расход теперь молчит, а удар по корпусу,
     монета и груз — целые единицы, они панель будят. */
  const suit=G.surf?G.surf.suit:100;
  hudWake([G.fuel,G.hull,held(),G.credits,suit],
    fr<.2||hr<.3||cr>=1||suit<25);
  /* пока открыт любой экран, приборы и кнопки полёта не нужны: они просвечивали
     сквозь экран и читались как брак */
  document.body.classList.toggle("screen",!!document.querySelector(".scr.open"));
  let a="—",b="—";
  /* кошелёк вынесен отдельной строкой ниже — здесь он был бы вторым разом */
  if(G.mode==="system"){a=G.sys.name.toUpperCase();b="«"+st.S.ru+"» · сектор "+G.sx+":"+G.sy;}
  else if(G.mode==="map"){a="НАВИГАЦИЯ";b="радиус "+st.jump.toFixed(1)+" пк";}
  else if(G.mode==="landing"){a=G.land.p.name.toUpperCase();
    b=(G.land.auto?"авто-посадка":"ручная посадка")+" · "+G.land.p.T.ru;}
  else if(G.mode==="surface"){a=G.surf.p.name.toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax+" · скафандр "+Math.round(G.surf.suit)+"%";
    /* погода в сводке: игрок должен понимать, почему вокруг потемнело, и
       что это пройдёт — она ходит циклом (19d-weather) */
    const wn=weatherName(G.surf.p);
    if(wn)b+=" · "+wn;}
  else if(G.mode==="dig"){a="ШАХТА · "+(G.dig?G.dig.p.name.toUpperCase():"");
    b=(G.dig?G.dig.row*3:0)+" м · трюм "+held()+"/"+st.cargoMax;}
  else if(G.mode==="cave"){a="ПЕЩЕРА · "+G.surf.p.name.toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax+" · скафандр "+Math.round(G.surf.suit)+"%";}
  else if(G.mode==="belt"){a=(G.belt?G.belt.B.name:"ПОЯС").toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax;}
  else if(G.mode==="scoop"){a=(G.scoop?G.scoop.p.name:"АТМОСФЕРА").toUpperCase();
    b="сбор летучих газов";}
  else if(G.mode==="base"){a="БАЗА · "+(G.base?G.base.p.name.toUpperCase():"");
    b="разрез грунта";}
  else if(G.mode==="raid"){a=(G.raid?G.raid.PB.name:"АБОРДАЖ").toUpperCase();
    b="пиратская база · "+(G.raid?G.raid.foes.filter(f=>f.hp>0).length+" живых":"");}
  else if(G.mode==="dock"){a=G.st.name.toUpperCase();b=G.st.kind;}
  if(G.drones.length>0)b+=" · дронов работает: "+G.drones.length;
  /* небо говорит само за себя, но событие обязано быть НАЗВАНО: без имени
     затмение читается как «что-то с картинкой» (06a-celest) */
  if(typeof celLine==="function"){const cl=celLine();if(cl)b+=" · "+cl;}
  const sbtn=document.getElementById("starbtn");
  sbtn.style.display=(G.mode==="system"&&Math.hypot(G.ship.x,G.ship.y)>1400)?"":"none";
  /* кнопка плеча: только на карте и только у выбранной системы со станцией —
     иначе она обещает действие, которого нет */
  const rbtn=document.getElementById("routebtn");
  if(G.mode==="map"&&typeof routeHas==="function"){
    const ss=getSystem(G.sel.x,G.sel.y),inR=routeHas(G.sel.x,G.sel.y);
    rbtn.style.display=(ss&&ss.station)||inR?"":"none";
    rbtn.textContent=inR?"ИЗ МАРШРУТА":"В МАРШРУТ";
  }else rbtn.style.display="none";
  $place.textContent=a;$sub.textContent=b;
  $msg.textContent=G.msgT>0?G.msg:"";
  $msg.style.opacity=G.msgT>0?clamp(G.msgT/40,0,1):0;
  $prompt.textContent=G.mode==="dock"?"":G.prompt;
  $bThr.textContent=G.mode==="surface"?"ПРЫЖОК":(G.mode==="dig"?"ВВЕРХ":"▲");
  /* Кнопка называет то, что сделает, а не то, как она называется. «ДЕЙСТВИЕ»
     не отвечает ни на один вопрос игрока; «СТЫКОВКА» отвечает на все.
     Глагол уже есть в подсказке — берём оттуда, чтобы не заводить второй
     источник правды, который однажды разойдётся с первым. */
  const $act=document.querySelector("[data-k=act]");
  let actLbl="ДЕЙСТВИЕ";
  if(G.mode==="belt")actLbl="РЕЗАК";
  else if(G.mode==="dig")actLbl="ВНИЗ";   // в шахте копают в четыре стороны, вниз — на большой кнопке
  else{
    const m=/^ДЕЙСТВИЕ\s*—\s*([^·\n]+)/.exec(G.prompt||"");
    if(m){
      const v=m[1].trim();
      if(v.length<=14)actLbl=v;
    }
  }
  $act.textContent=actLbl;
  /* подсвечиваем, когда действие вообще есть: иначе кнопка выглядит живой всегда */
  $act.classList.toggle("ready",actLbl!=="ДЕЙСТВИЕ");
  if(G.mode==="dig"){
    /* «вниз» уже висит на большой кнопке — второй такой же рядом только путает.
       Клавиша S при этом продолжает работать, раскладка WASD не рвётся. */
    $bBrk.style.display="none";
  }else{
    $bBrk.style.display="";
    $bBrk.textContent="ТОРМОЗ";
    $bBrk.style.opacity=G.mode==="surface"?".3":"1";
  }
  $nav.textContent=(G.mode==="belt"||G.mode==="scoop")?"ВЫХОД":(G.mode==="map"?"НАЗАД":"КАРТА");
  /* под землёй ОГОНЬ — это импульсный разрядник, он есть всегда */
  $fire.style.display=(G.mode==="dig"||((G.mode==="system"||G.mode==="belt")&&st.armed))?"":"none";
  if(G.mode==="dig")$fire.textContent=(G.dig&&G.dig.zap>0)?Math.ceil(G.dig.zap/60)+"с":"ИМПУЛЬС";
  else $fire.textContent="ОГОНЬ";
  /* ракета показывается только там, где ею можно выстрелить, и на кнопке стоит
     не «готово», а остаток в трюме: боеприпас — это груз, и он тает */
  if($msl){
    const on=G.mode==="system"&&st.launcher;
    $msl.style.display=on?"":"none";
    if(on)$msl.textContent=(G.mslCool>0)?"…":("РАКЕТА "+(G.cargo.missile|0));
    $msl.classList.toggle("empty",on&&(G.cargo.missile|0)<=0);
  }
  document.body.classList.toggle("inbelt",G.mode==="belt");
}

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
function frame(now){
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
      if(G.doom){doomLearn();doomTick();}}
    if(G.msgT>0)G.msgT-=dt;
    if(G.mode==="system")autosave();
    if(G.mode==="system"||G.mode==="dock"||G.mode==="barge")updateSystem(dt);
    else if(G.mode==="landing")updateLanding(dt);
    else if(G.mode==="surface"){updateSurface(dt);tickLaunchHold(dt);}
    else if(G.mode==="dig"&&G.dig)updateDig(dt);
    else if(G.mode==="cave"&&G.cave)updateCave(dt);
    else if(G.mode==="belt"&&G.belt)updateBelt(dt);
    else if(G.mode==="scoop"&&G.scoop)updateScoop(dt);
    else if(G.mode==="base"&&G.base)updateBase(dt);
    else if(G.mode==="raid"&&G.raid)updateRaid(dt);
    beaconTick(dt);crewBtnTick();hqBtnTick();loreBtnTick();parrotBtnTick();wearTick(dt);
    /* страховка от «зависания на стыковке»: режим dock без единой открытой панели
       означал бы, что игрок смотрит на космос и не может двигаться */
    if(G.mode==="dock"&&!document.querySelector(".scr.open")){
      if(G.st)openStation();else G.mode="system";
    }
    if(G.mode==="barge"&&!document.querySelector(".scr.open"))G.mode="system";
    audioTick(dt);
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
    hud();
  }else{
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
    G.t=now*.06;drawNebula(now*.004,0,1);drawStars(now*.004,0,1);
  }
  requestAnimationFrame(frame);
}
applyPadMode();applyPadSize();
requestAnimationFrame(frame);

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