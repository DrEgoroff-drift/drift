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
/* ── высота приборной полосы ──
   Приборы вернулись к верхней кромке, и всё, что рисуется по канве наверху
   (подсказка поверхности, фишки целей), обязано знать, где полоса кончается,
   иначе фишка «КОРАБЛЬ 1454 м» встаёт четвёртой строкой приборов.
   Число в CSS-пикселях: холст масштабируется через setTransform(DPR), так что
   координаты рисования и есть CSS-пиксели. */
let HUD_BAND=72;
const $vitals=document.querySelector(".vitals"),$locusEl=document.querySelector(".locus");
const $vf=document.getElementById("vFuel"),$vh=document.getElementById("vHull");
const $vc=document.getElementById("vHold"),$purse=document.getElementById("purse");
const $vs=document.getElementById("vSuit"),$ub=document.querySelector("#ubar i");
const $un=document.getElementById("unum");
const $vj=document.getElementById("vJet"),$jb=document.querySelector("#jbar i");
const $jn=document.getElementById("jnum");
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
/* ── запись в DOM только при изменении ──
   Приборы пересчитываются каждый кадр, но меняются они редко: топливо стоит
   на месте, пока не жмёшь тягу, а название системы — пока не прыгнешь. Раньше
   кадр всё равно клал в DOM сорок значений, и браузер сорок раз проверял,
   не поехала ли от этого вёрстка.
   Сверяемся с САМИМ узлом, а не с запомненным рядом значением. Разница не
   косметическая: экраны и автотесты меняют стиль напрямую, мимо `hud()`, и
   память о «том, что мы писали в прошлый раз» после этого врёт — кнопка
   остаётся видимой там, где кадр обязан был её убрать. Чтение inline-стиля
   и текста узла вёрстку не пересчитывает и стоит копейки. */
function setTx(el,v){if(el&&el.textContent!==v)el.textContent=v;}
function setSt(el,k,v){v=""+v;if(el&&el.style[k]!==v)el.style[k]=v;}
function hud(){
  const st=stat();
  const fr=G.fuel/st.fuelMax, hr=G.hull/st.hullMax, cr=held()/st.cargoMax;
  setSt($f,"width",clamp(fr*100,0,100).toFixed(1)+"%");
  setSt($h,"width",clamp(hr*100,0,100).toFixed(1)+"%");
  setSt($cg,"width",clamp(cr*100,0,100).toFixed(1)+"%");
  setTx($fn,Math.round(G.fuel)+"/"+Math.round(st.fuelMax));
  setTx($hn,Math.round(G.hull)+"/"+Math.round(st.hullMax));
  setTx($cn,held()+"/"+st.cargoMax);
  setSt($sg,"display",st.shieldMax>0?"":"none");
  if(st.shieldMax>0){
    setSt($sh,"width",clamp(G.shield/st.shieldMax*100,0,100).toFixed(1)+"%");
    setTx($sn,Math.round(G.shield)+"/"+Math.round(st.shieldMax));
  }
  $fb.classList.toggle("low",fr<.2);
  $hb.classList.toggle("low",hr<.3);
  /* две ступени тревоги вместо одной: «мало» подсвечивается, «вот-вот» мигает.
     Мигание ловится боковым зрением — во время боя смотреть на приборы некогда. */
  $vf.classList.toggle("low",fr<.2);$vf.classList.toggle("crit",fr<.08);
  $vh.classList.toggle("low",hr<.3);$vh.classList.toggle("crit",hr<.15);
  $vc.classList.toggle("low",cr>=1);
  /* ── состав меняется по экрану (релизный вид, A2) ──
     На ногах топливо и корпус решают не здесь (проход 1 их уже убрал), а
     решает скафандр: он течёт, и когда он кончится, разговор окончен. Внутри
     дома и на базе он не течёт — там шкале нечего показывать.
     Расстояние до корабля сюда не дублируем: его несёт фишка у кромки кадра,
     и она про мир, а не про интерфейс. */
  /* на абордаже скафандр свой (G.raid.suit): рейд входится из пояса, и G.surf
     там может не быть вовсе */
  const suitSrc=(G.mode==="raid"&&G.raid)?G.raid
    :(G.surf&&(G.mode==="surface"||G.mode==="cave"||G.mode==="dig")?G.surf:null);
  const suitOn=!!suitSrc;
  setSt($vs,"display",suitOn?"":"none");
  if(suitOn){
    const su=clamp(suitSrc.suit,0,100);
    setSt($ub,"width",su.toFixed(1)+"%");
    setTx($un,Math.round(su)+"%");
    $vs.classList.toggle("low",su<35);$vs.classList.toggle("crit",su<18);
  }
  /* ранец — там же, где остальные шкалы. Прежде он рисовался на канве в левом
     нижнем углу, ровно под DOM-пэдами, и «РАНЕЦ» просвечивал сквозь кнопки
     (автор ткнул в это на скрине, M178). Показывается на ногах и только на
     экранах, где ранцем пользуются. */
  const jetOn=G.surf&&(G.mode==="surface"||G.mode==="cave");
  setSt($vj,"display",jetOn?"":"none");
  if(jetOn){
    const jf=clamp(jetFuel(),0,1);
    setSt($jb,"width",(jf*100).toFixed(1)+"%");
    setTx($jn,Math.round(jf*100)+"%");
    $vj.classList.toggle("low",jf<.2);
  }
  /* Кошелёк, а под ним — облако, но только когда с ним что-то не так. Молчащий
     обмен места в кадре не занимает (docs/DESIGN-online-risks.md, A1). */
  const cl=(typeof cloudLine==="function")?cloudLine():"";
  setTx($purse,Math.round(G.credits).toLocaleString("ru")+" кр · "+G.data+" дан"+(cl?" · "+cl:""));
  /* Приборы проявляются, когда есть о чём сказать, и гаснут, когда всё ровно.
     Повод — изменившееся показание, тревога или открытый режим, где приборы
     и есть содержание кадра. Панель, которая горит всегда, перестаёт читаться
     как сообщение и становится частью рамки экрана. */
  /* Поводом считается СКАЧОК показания, а не любое его изменение. Топливо и
     скафандр текут непрерывно: на сравнении округлённых строк панель раз в
     несколько секунд вспыхивала и гасла — сверху экрана шло мигание, которое
     ничего не сообщало. Плавный расход теперь молчит, а удар по корпусу,
     монета и груз — целые единицы, они панель будят. */
  const suit=suitSrc?suitSrc.suit:100;
  hudWake([G.fuel,G.hull,held(),G.credits,suit],
    fr<.2||hr<.3||cr>=1||suit<25);
  /* пока открыт любой экран, приборы и кнопки полёта не нужны: они просвечивали
     сквозь экран и читались как брак */
  document.body.classList.toggle("screen",!!document.querySelector(".scr.open"));
  let a="—",b="—";
  /* кошелёк вынесен отдельной строкой ниже — здесь он был бы вторым разом */
  if(G.mode==="system"){a=((typeof nameOf==="function")?nameOf(G.sys):G.sys.name).toUpperCase();b="«"+st.S.ru+"» · сектор "+G.sx+":"+G.sy;}
  else if(G.mode==="map"){a="НАВИГАЦИЯ";b="радиус "+st.jump.toFixed(1)+" пк";}
  else if(G.mode==="landing"){a=G.land.p.name.toUpperCase();
    b=(G.land.auto?"авто-посадка":"ручная посадка")+" · "+G.land.p.T.ru;}
  /* ── строка места не повторяет шкалы (A2) ──
     Пока приборы висели наверху, а «где мы» — рядом с ними, сводка дублировала
     трюм и скафандр текстом: два раза одно и то же в одном углу кадра. Теперь
     шкалы стоят слева от пульта, и строка говорит только то, чего в них нет. */
  else if(G.mode==="surface"){a=G.surf.p.name.toUpperCase();
    b=G.surf.p.T.ru;
    /* погода в сводке: игрок должен понимать, почему вокруг потемнело, и
       что это пройдёт — она ходит циклом (19d-weather) */
    const wn=weatherName(G.surf.p);
    if(wn)b+=" · "+wn;}
  else if(G.mode==="dig"){a="ШАХТА · "+(G.dig?G.dig.p.name.toUpperCase():"");
    b=(G.dig?(G.dig.row*3)+" м · "+geoAt(G.dig.p,G.dig.row*DIG_CELL*DIG_GEO_K).ru:"");}
  else if(G.mode==="cave"){a="ПЕЩЕРА · "+G.surf.p.name.toUpperCase();
    b=(G.cave?caveZoneAt(G.cave,G.cave.x).Z.ru+" · глубина "+Math.max(0,Math.round(G.cave.y)):G.surf.p.T.ru);}
  else if(G.mode==="belt"){a=(G.belt?G.belt.B.name:"ПОЯС").toUpperCase();
    b=(G.belt&&G.belt.B&&G.belt.B.res&&G.belt.B.res.length)
      ?("руда: "+G.belt.B.res.map(k=>(RES[k]&&RES[k].ru)||k).join(", "))
      :"пояс астероидов";}
  else if(G.mode==="scoop"){a=(G.scoop?G.scoop.p.name:"АТМОСФЕРА").toUpperCase();
    b="сбор летучих газов";}
  else if(G.mode==="base"){a="БАЗА · "+(G.base?G.base.p.name.toUpperCase():"");
    b="разрез грунта";}
  else if(G.mode==="homein"){a="ДОМ";
    b=(G.home&&HOME_TIERS[G.home.tier-1]?HOME_TIERS[G.home.tier-1].ru:"угол")+" · "+
      ((G.hin&&G.hin.folk.length)?"дома "+G.hin.folk.length:"никого нет");}
  /* Заряды, броня и счёт живых ушли отсюда к рукам, в подсказку: они там
     крупнее, и главное — это расход текущего действия, а не «где я». Сводка
     места говорит место. */
  else if(G.mode==="raid"){a=(G.raid?G.raid.PB.name:"АБОРДАЖ").toUpperCase();
    b="пиратская база";}
  else if(G.mode==="dock"){a=G.st.name.toUpperCase();b=G.st.kind;}
  if(G.drones.length>0)b+=" · дронов работает: "+G.drones.length;
  /* небо говорит само за себя, но событие обязано быть НАЗВАНО: без имени
     затмение читается как «что-то с картинкой» (06a-celest) */
  if(typeof celLine==="function"){const cl=celLine();if(cl)b+=" · "+cl;}
  const sbtn=document.getElementById("starbtn");
  setSt(sbtn,"display",(G.mode==="system"&&Math.hypot(G.ship.x,G.ship.y)>1400)?"":"none");
  /* кнопка плеча: только на карте и только у выбранной системы со станцией —
     иначе она обещает действие, которого нет */
  const rbtn=document.getElementById("routebtn");
  if(G.mode==="map"&&typeof routeHas==="function"){
    const ss=getSystem(G.sel.x,G.sel.y),inR=routeHas(G.sel.x,G.sel.y);
    setSt(rbtn,"display",(ss&&ss.station)||inR?"":"none");
    setTx(rbtn,inR?"ИЗ МАРШРУТА":"В МАРШРУТ");
  }else setSt(rbtn,"display","none");
  /* приборная колодка (25c): рисуется каждым кадром, гаснет вместе со строкой */
  if(typeof instrPodTick==="function")instrPodTick();
  setTx($place,a);setTx($sub,b);
  /* Полосу меряем по самому DOM, а не пересчитываем правила CSS в JS: состав
     строк задан таблицей стилей (body.afoot прячет топливо и корпус, узкий
     экран кладёт шкалы в ряд), и второй источник правды однажды с ней
     разойдётся. Чтение — одно на кадр и почти всегда бесплатное: setTx/setSt
     не пишут в DOM, пока показания не менялись, поэтому вёрстка чаще всего
     не грязная и пересчитывать её браузеру не приходится. */
  if($vitals&&$locusEl){
    const vb=$vitals.getBoundingClientRect().bottom,lb=$locusEl.getBoundingClientRect().bottom;
    const band=Math.max(vb,lb);
    if(band>0)HUD_BAND=Math.round(band);
  }
  setTx($msg,G.msgT>0?G.msg:"");
  setSt($msg,"opacity",G.msgT>0?clamp(G.msgT/40,0,1):0);
  setTx($prompt,G.mode==="dock"?"":G.prompt);
  setTx($bThr,G.mode==="surface"?"ПРЫЖОК":(G.mode==="dig"?"ВВЕРХ":"▲"));
  /* Кнопка называет то, что сделает, а не то, как она называется. «ДЕЙСТВИЕ»
     не отвечает ни на один вопрос игрока; «СТЫКОВКА» отвечает на все.
     Глагол уже есть в подсказке — берём оттуда, чтобы не заводить второй
     источник правды, который однажды разойдётся с первым. */
  const $act=document.querySelector("[data-k=act]");
  let actLbl="ДЕЙСТВИЕ", hasAct=false;
  if(G.mode==="belt"){actLbl="РЕЗАК";hasAct=true;}
  else if(G.mode==="dig"){actLbl="ВНИЗ";hasAct=true;}   // в шахте копают в четыре стороны, вниз — на большой кнопке
  else{
    /* «УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — БУРЕНИЕ» кнопка раньше не разбирала: образец
       требовал, чтобы строка НАЧИНАЛАСЬ со слова ДЕЙСТВИЕ. У залежи кнопка
       поэтому называлась безымянным «ДЕЙСТВИЕ», а на шаг в сторону —
       «ЗАЛОЖИТЬ ШАХТУ», и разницу игрок замечал уже под землёй (плейтест
       26.08.2026: «одна кнопка делает два разных дела»). Теперь глагол
       вынимается и из «удерживайте», и кнопка честно меняет имя под ногами. */
    const m=/^(?:УДЕРЖИВАЙТЕ\s+)?ДЕЙСТВИЕ\s*—\s*([^·\n]+)/.exec(G.prompt||"");
    if(m){
      hasAct=true;
      const v=m[1].trim();
      if(v.length<=14)actLbl=v;
    }
  }
  setTx($act,actLbl);
  /* кнопка без действия гаснет, а не исчезает (M181): палец помнит место */
  $act.classList.toggle("off",!hasAct);
  /* Подсвечиваем, когда действие вообще есть. Раньше признаком служила сама
     подпись: «кнопка не называется ДЕЙСТВИЕ — значит есть что делать». Признак
     врал, и на телефоне это стоило игроку самого действия: длинный глагол
     («СКАНИРОВАТЬ ОРГАНИЗМ», 20 знаков) на кнопку не влезал, подпись падала
     обратно в «ДЕЙСТВИЕ», кнопка считалась пустой — а правило «призрачных
     кнопок нет» прячет пустую кнопку на телефоне совсем. Сканировать было
     нечем. Теперь признак — НАЛИЧИЕ действия, а подпись отдельно. */
  $act.classList.toggle("ready",hasAct);
  /* Тормоз не исчезает — тормоз гаснет (M181). Правило «призрачных кнопок
     нет» убирало его на поверхности и в шахте совсем, и весь нижний ряд
     прыгал влево-вправо при каждой смене режима. Палец помнит место. */
  {
    const brkOff=G.mode==="surface"||G.mode==="dig";
    setSt($bBrk,"display","");
    $bBrk.classList.toggle("off",brkOff);
    setTx($bBrk,"ТОРМОЗ");
    setSt($bBrk,"opacity","");
  }
  setTx($nav,(G.mode==="belt"||G.mode==="scoop"||G.mode==="homein")?"ВЫХОД":(G.mode==="map"?"НАЗАД":"КАРТА"));
  /* ── состав ряда не меняется на ходу (автор, 25.08.2026) ──
     Правило M181 доводится до конца: ОГОНЬ и РАКЕТА тоже прыгали. У
     вооружённого игрока при уходе из системы кнопка ОГОНЬ ПРОПАДАЛА, ряд
     перестраивался, и ПРЫЖОК с ДЕЙСТВИЕМ уезжали под пальцем на новое место.
     Граница простая: **что корабль в принципе умеет — стоит всегда** (сейчас
     неприменимо — погашено); чего у корабля нет вовсе — места не занимает,
     это не «пропало», этого никогда и не было. Поставил пушку — кнопка
     появилась один раз и осталась.
     Под землёй ОГОНЬ — импульсный разрядник, он есть всегда. */
  const fireHas=G.mode==="dig"||st.armed;
  const fireOn=G.mode==="dig"||((G.mode==="system"||G.mode==="belt")&&st.armed);
  setSt($fire,"display",fireHas?"":"none");
  $fire.classList.toggle("off",fireHas&&!fireOn);
  if(G.mode==="dig")setTx($fire,(G.dig&&G.dig.zap>0)?Math.ceil(G.dig.zap/60)+"с":"ИМПУЛЬС");
  else setTx($fire,"ОГОНЬ");
  /* ракета: на кнопке не «готово», а остаток в трюме — боеприпас это груз,
     и он тает */
  if($msl){
    const has=!!st.launcher, on=G.mode==="system"&&has;
    setSt($msl,"display",has?"":"none");
    $msl.classList.toggle("off",has&&!on);
    if(has)setTx($msl,(on&&G.mslCool>0)?"…":("РАКЕТА "+(G.cargo.missile|0)));
    $msl.classList.toggle("empty",on&&(G.cargo.missile|0)<=0);
  }
  document.body.classList.toggle("inbelt",G.mode==="belt");
  /* состав ряда меняется редко (поставили пушку, вошли в пояс) — пересчитываем
     ширину кнопок только тогда, а не каждый кадр */
  {
    const key=(fireHas?"f":"")+((st.launcher)?"m":"")+(G.mode==="belt"?"b":"");
    if(key!==PAD_KEY){PAD_KEY=key;padsFit();}
  }
  /* ── на ногах (релизный вид, проход 1) ──
     Приборы корабля висели над КАЖДЫМ экраном. Правило стиля говорит «над
     миром — только то, что нужно сейчас», и на поверхности, в пещере, в
     шахте, на базе и дома топливо, корпус и щит нужны не больше, чем
     спидометр пешеходу: до корабля ещё дойти. Трюм остаётся — на ногах как
     раз он и наполняется, — а топливо возвращается само, если стало
     критическим (класс .crit): тогда это и есть «нужно сейчас». */
  document.body.classList.toggle("afoot",
    G.mode==="surface"||G.mode==="cave"||G.mode==="dig"||G.mode==="base"||G.mode==="homein"||G.mode==="raid");
  /* колодка области — прибор кабины (A2): она показывается там, где по ней
     принимают решения, то есть в полёте и на карте */
  document.body.classList.toggle("inflight",
    G.mode==="system"||G.mode==="map"||G.mode==="belt"||G.mode==="scoop"||G.mode==="landing");
  document.body.classList.toggle("mobile",innerWidth<=760);   /* телефон (M167) */
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
function frame(now){
  if(LOOP_OFF)return;
  /* Скрытая страница не рисует. Обычно её и так не будят — rAF стоит, — но в
     headless с виртуальным временем кадры идут как из пулемёта, и полная
     отрисовка в невидимую канву съедала весь бюджет: прогон тестов вставал
     намертво (M170). Стенды рисуют своими вызовами и этой ветки не касаются. */
  if(document.hidden){requestAnimationFrame(frame);return;}
  /* дорожный спутник рисует свой кадр сам и занимает весь экран: мир под ним
     не виден, а батарею ест вдвое — а именно батарея и есть заявленная цена
     режима. Плюс это единственный путь, которым мировой холст мог просочиться
     поверх заставки (стенд M168k). Цепочка кадров не рвётся: выйдут — поедет. */
  if(RD&&document.body.classList.contains("road")){requestAnimationFrame(frame);return;}
  /* канва нулевого размера (страница поднялась скрытой) — чинится здесь же:
     иначе кадр падает на drawImage и игра стоит до первого resize */
  if(W<2||H<2){resize();if(W<2||H<2){requestAnimationFrame(frame);return;}}
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
    if(++capN%stride){requestAnimationFrame(frame);return;}
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
      if(typeof offerTick==="function")offerTick();}
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
    else if(G.mode==="homein"&&G.hin)updateHomeIn(dt);   /* дом изнутри (M170) */
    if(typeof tapeTick==="function")tapeTick(dt);
    if(typeof shiftTalkTick==="function")shiftTalkTick(dt);
    if(typeof instrAgeTick==="function")instrAgeTick(dt);
    if(typeof etherTick==="function")etherTick(dt);
    beaconTick(dt);crewBtnTick();hqBtnTick();loreBtnTick();parrotBtnTick();consoleTick(dt);orderTick();if(typeof vegaTick==="function")vegaTick(dt);if(typeof ringTick==="function")ringTick();if(typeof expDayTick==="function")expDayTick();if(typeof expDepartTick==="function")expDepartTick();if(typeof lastRunTick==="function")lastRunTick();if(typeof recordTick==="function")recordTick();if(typeof instTick==="function")instTick();if(typeof traineeTick==="function")traineeTick();if(typeof zooTick==="function")zooTick();wearTick(dt);
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
    else if(G.mode==="homein"&&G.hin)drawHomeIn();
    hud();
    /* приборная стойка (25d) поверх мира: раскрытая аппаратура, к которой
       игрок повернулся. Рисуется последней, но до DOM-строки приборов */
    if(typeof rackDraw==="function")rackDraw();
  }else{
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
    G.t=now*.06;drawNebula(now*.004,0,1);drawStars(now*.004,0,1);
  }
  requestAnimationFrame(frame);
}
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
