/* ══════════════ телеметрия: приборы пишут в DOM ══════════════
   Отрезано от 28-loop 27.08.2026: файл дорос до 47 КБ, и внутри лежали два
   разных дела — кадр (цикл, звук, авторазрешение) и приборы (hud() со всеми
   своими DOM-ссылками). Здесь приборы. Порядок склейки безразличен: всё
   объявлено функциями и читается только в кадре. */
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
/* ── и где она кончается снизу ──
   Та же беда с другого конца кадра, и она стоила автору целого экрана. Карта
   рисует карточку системы и строки прыжка от констант (`PAD_SAFE=104`), а
   подсказка, эфирная строка и пульт — это DOM со своей вёрсткой. Два счёта
   одного и того же места неизбежно расходятся: на телефоне 393×830 подсказка
   легла ровно поперёк описания системы, эфирная строка накрыла «ТЕЛ · ВИДОВ ·
   кр», а правый борт въехал в угол карточки (замер 30.08.2026).
   HUD_FLOOR — верх самого верхнего из нижних наложений, HUD_RAIL — левый край
   правого борта. Обе величины в CSS-пикселях, как и координаты рисования. */
let HUD_FLOOR=0, HUD_RAIL=0;
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
const $launch=document.getElementById("launchbtn");
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
/* Строка с рунами пиджина рисуется знаками (M261): setTx — единственная
   дверь, через которую текст попадает в DOM, поэтому мост стоит здесь.
   Обычный текст идёт прежним дешёвым путём; кэш глиф-строки отдельный
   (el.__gtx), чтобы не перерисовывать канвы на каждый кадр. */
function setTx(el,v){
  if(!el)return;
  if(typeof glyphHasRunes==="function"&&glyphHasRunes(v)){
    if(el.__gtx===v)return;
    el.__gtx=v;el.textContent="";el.appendChild(glyphNodes(v));
  }else{
    if(el.__gtx!=null)el.__gtx=null;
    if(el.textContent!==v)el.textContent=v;
  }
}
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
  if(G.mode==="system"){a=((typeof nameOf==="function")?nameOf(G.sys):G.sys.name).toUpperCase();b="«"+st.S.ru+"» · сектор "+G.sx+":"+G.sy;
    /* тетрадь ветра («Сорока»): в строке места — когда парусник уйдёт */
    if(typeof wanderHas==="function"&&wanderHas("notebook"))b+=" · «Сорока» "+wanderLeftRu();}
  else if(G.mode==="wanderer"){a="НА БОРТУ «СОРОКИ»";b=(typeof wanderLeftRu==="function")?wanderLeftRu():"";}
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
  else if(G.mode==="spa"&&G.spa){a="САНАТОРИЙ";
    b=(G.spa.pname||"")+" · день "+G.spa.day+" из "+G.spa.days;}
  else if(G.mode==="winter"&&G.win){a=G.win.pname.toUpperCase();
    b="зимовка · сутки "+G.win.day+" из "+G.win.days;}
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
  /* «К ЦЕЛИ» (M321, §9 шаг 6): курс поставлен с доски или из тетради — в полёте
     он назван, и одним тапом карта открывается на нём. Только в системе и только
     пока адрес не достигнут; на самой карте выбранный сектор и так виден */
  const gbtn=document.getElementById("goalbtn");
  if(gbtn){
    const on=G.mode==="system"&&!!G.course&&!(G.course.sx===G.sx&&G.course.sy===G.sy);
    setSt(gbtn,"display",on?"":"none");
    if(on){const hops=Math.max(1,Math.ceil(Math.hypot(G.course.sx-G.sx,G.course.sy-G.sy)/Math.max(.5,stat().jump)));
      setTx(gbtn,"К ЦЕЛИ · "+hops+" "+pl3(hops,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ"));}
  }
  /* кнопка плеча: только на карте и только у выбранной системы со станцией —
     иначе она обещает действие, которого нет */
  const rbtn=document.getElementById("routebtn");
  if(G.mode==="map"&&typeof routeHas==="function"){
    const ss=getSystem(G.sel.x,G.sel.y),inR=routeHas(G.sel.x,G.sel.y);
    setSt(rbtn,"display",(ss&&ss.station)||inR?"":"none");
    /* плечо ставится по виденным ценам (R1): кнопка говорит это до нажатия */
    const seen=typeof routeNoteFor==="function"&&!!routeNoteFor(G.sel.x,G.sel.y);
    setTx(rbtn,inR?"ИЗ МАРШРУТА":(seen?"В МАРШРУТ":"ЦЕН НЕ ВИДЕЛИ"));
  }else setSt(rbtn,"display","none");
  /* «К СЕБЕ» — когда лист уехал от вас; «НАЗВАТЬ» — на раскрытой карточке (M299) */
  const mb=document.getElementById("mebtn"),nb=document.getElementById("namebtn");
  if(mb)setSt(mb,"display",(G.mode==="map"&&(G.mapView||(G.mapZoom&&G.mapZoom!==1)))?"":"none");
  if(nb)setSt(nb,"display",(G.mode==="map"&&G.mapMore)?"":"none");
  /* «ЦЕНЫ» — список виденных цен на карте (M341), когда есть что сравнивать */
  /* поле адреса и кнопка спички — только на карте (M347) */
  const ab=(typeof mapAddrBox==="function")?mapAddrBox():null;
  if(ab){const onMap=G.mode==="map"&&!G.mapClean;setSt(ab,"display",onMap?"flex":"none");
    const mk=document.getElementById("mapMarkGo");
    if(mk&&onMap&&typeof mapMarkAt==="function")setTx(mk,mapMarkAt(G.sel.x,G.sel.y)>=0?"СНЯТЬ МЕТКУ":"ОТМЕТИТЬ");}
  const wp=document.getElementById("wanwin");
  if(wp)setSt(wp,"display",G.mode==="wanderer"?"":"none");
  const pb=document.getElementById("pricesbtn");
  if(pb)setSt(pb,"display",(G.mode==="map"&&typeof pricesCount==="function"&&pricesCount())?"":"none");
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
    if(band>0){if(HUD_BAND!==Math.round(band))document.documentElement.style.setProperty("--hudband",Math.round(band)+"px");HUD_BAND=Math.round(band);}
  }
  /* пол и правый борт — тем же одним чтением на кадр. Пустая подсказка в счёт
     не идёт: у неё нет текста, а место она занимать не должна. */
  {let fl=innerHeight,rl=innerWidth;
   /* видимость проверяем по прямоугольнику, а не по offsetParent: пульт,
      подсказка и правый борт стоят position:fixed, а у таких offsetParent
      всегда null — первая версия этой мерки поэтому не находила НИЧЕГО и
      честно возвращала высоту экрана */
   const under=[$prompt,document.getElementById("console"),$padsEl];
   for(const e of under){
     if(!e)continue;
     if(e===$prompt&&!(e.textContent||"").trim())continue;
     const r=e.getBoundingClientRect();
     if(r.height>0&&r.width>0&&r.top>0)fl=Math.min(fl,r.top);
   }
   const rail=document.querySelector(".rail");
   if(rail){
     const r=rail.getBoundingClientRect();
     if(r.width>0&&r.height>0)rl=Math.min(rl,r.left);
   }
   if(HUD_RAIL!==Math.round(rl))document.documentElement.style.setProperty("--railw",Math.max(0,innerWidth-Math.round(rl))+"px");   /* ширина борта — для поля адреса (M347) */
   HUD_FLOOR=Math.round(fl);HUD_RAIL=Math.round(rl);}
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
       вынимается и из «удерживайте», и кнопка честно меняет имя под ногами.
       Якорь ^ был вторым лицом того же бага (плейтест автора 29.08.2026):
       половина подсказок пишет глагол не с начала строки — «СИГНАЛ БЕДСТВИЯ
       (перенос) ДЕЙСТВИЕ — ПРИНЯТЬ СИГНАЛ», «САНАТОРИЙ · ДЕЙСТВИЕ — …» — и у
       сигнала бедствия кнопка стояла погашенной, хотя подсказка звала жать.
       Клавиатуру это не трогало (Space шёл мимо кнопки), телефон и мышь —
       глухо. Признак действия — «ДЕЙСТВИЕ —» ГДЕ УГОДНО в подсказке. */
    const m=/(?:УДЕРЖИВАЙТЕ\s+)?ДЕЙСТВИЕ\s*—\s*([^·\n]+)/.exec(G.prompt||"");
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
  document.body.classList.toggle("aboard",G.mode==="wanderer");   /* на борту «Сороки» (M343): приёмник и тяга ни к чему */
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
    G.mode==="surface"||G.mode==="cave"||G.mode==="dig"||G.mode==="base"||G.mode==="homein"||G.mode==="raid"||G.mode==="winter"||G.mode==="spa");
  /* колодка области — прибор кабины (A2): она показывается там, где по ней
     принимают решения, то есть в полёте и на карте */
  document.body.classList.toggle("inflight",
    G.mode==="system"||G.mode==="map"||G.mode==="belt"||G.mode==="scoop"||G.mode==="landing");
  document.body.classList.toggle("mobile",innerWidth<=760);   /* телефон (M167) */
  /* ── ВЗЛЁТ гасит кадр, а не поверхность (M234, второй заход) ──
     Кнопку показывал и прятал `updateSurface`, то есть код, который в других
     режимах не работает вовсе: взлетел, ушёл в шахту, спустился в базу — и она
     осталась висеть над космосом. Показывает её по-прежнему поверхность (она
     одна знает, стоишь ли ты у корабля), а гасит кадр — отовсюду, кроме
     поверхности. То же правило, что у ОГНЯ и РАКЕТЫ: у кнопки один хозяин. */
  if($launch&&G.mode!=="surface")setSt($launch,"display","none");
}
