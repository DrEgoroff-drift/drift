/* ══════════════ авария ══════════════ */
/* ── корпус до беды (R5b, автор 12.09: «корпус не выше, чем был») ──
   Последний уровень корпуса, продержавшийся десять секунд без урона. После
   аварии корпус собирают не выше него: 45 % или удержанное, что меньше, и
   никогда ниже 10 %. Живёт на G как кадр (`_hullHeld`, мимо сейва — 14a2):
   после загрузки отсчёт идёт заново от загруженного корпуса; часы игры
   (`now`), чтобы стенд мог их подкрутить */
const HULL_HELD_MS=10000;
function hullHeld(){return G._hullHeld||(G._hullHeld={v:-1,last:-1,at:0});}
function hullHeldTick(){
  const H=hullHeld(),h=G.hull,t=now();
  if(H.last<0||h<H.last)H.at=t;      /* урон — отсчёт заново */
  else if(t-H.at>=HULL_HELD_MS)H.v=h;
  H.last=h;
}
function wreck(why){   /* why — причина словами: журнал её называет (боты 12.09: «разбит» без причины) */
  toggleSos(false);   /* окно выходов не висит над собранным наспех кораблём с 30 в баке */
  sfx("boom",{v:1});stopEngine();
  const st=stat();
  const HH=hullHeld(),before=HH.v>=0?HH.v:st.hullMax*.45;
  G.hull=Math.round(clamp(Math.min(st.hullMax*.45,before),st.hullMax*.1,st.hullMax*.45));
  HH.v=G.hull;HH.last=G.hull;HH.at=now();   /* собранное наспех — и есть «что было» */
  G.fuel=Math.max(G.fuel,30);
  const a=rnd()*TAU;
  G.ship.x=Math.cos(a)*1600;G.ship.y=Math.sin(a)*1600;
  G.ship.vx=0;G.ship.vy=0;G.mode="system";G.ap=null;G.belt=null;G.dig=null;G.cave=null;G.surf=null;G.land=null;
  G.pirates=[];G.shots=[];   /* без этого авария у пиратов превращается в петлю */
  G.haul=null;   /* разбит на тросе — корабль уже не там, иначе трос держит его и бьёт снова (ревью 12.09) */
  /* след для тех, кто придёт сюда после (M377, §11.3): не сообщение и не
     подарок — просто корпус, которого больше нет */
  if(typeof leftGhost==="function")leftGhost();
  /* люди на борту (M114) гибнут вместе с кораблём, и это записывается отдельной
     строкой: вывоз — не перевозка ящиков, и цена ошибки должна называться */
  const pax=G.cargo.folk|0;
  if(pax&&G.doom)G.doom.lost=((G.doom.lost|0)+pax);
  let lost=0;for(const k of RES_KEYS){lost+=G.cargo[k];G.cargo[k]=0;}
  saveGame(true);
  if(pax)logAdd("warn","С кораблём погибли вывезенные · "+pax+" человек");
  logAdd("warn","Корабль разбит"+(why?": "+why:"")+" · аварийный ремонт"+(lost?" · груз потерян ("+lost+" ед)":""));
  /* «трюм был пуст» без глагола читался загадкой: ремонт оплачивается грузом,
     и когда груза нет — надо сказать, что расплачиваться было нечем */
  say("Аварийный ремонт\nкорпус собран наспех"+
    (lost?"\nгруз потерян ("+lost+" ед)":"\nтрюм был пуст — терять было нечего"));
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
    const on=((G.ctl&&G.ctl.out.main)||G.ap)&&G.fuel>0&&G.mode!=="dock";
    if(on)engineLoop(1,G.mods.engine/4,(typeof makerHum==="function")?makerHum(makerOf(G.shipId)):0);else stopEngine();
  }else if(G.mode==="belt"&&G.belt){
    if(keys.thrust)engineLoop(.9,G.mods.engine/4,(typeof makerHum==="function")?makerHum(makerOf(G.shipId)):0);else stopEngine();
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
let last=wallMs();
let lastDroneTick=0;
/* ── кто держал кадр (12.09, DPR 2.5 stalls — PLAN.md item 1) ──
   09.09 с окна 1536×791 при DPR 2.5 пришло пять стопов по 2–3,4 с в первые
   полминуты в системе — и ни слова о том, чей это стоп. На стенде похожие
   провалы вышли такими: главный поток в разрыве простаивает, а GPU-процесс
   сотни миллисекунд растрит одну команду. Три разные болезни — наш JS в
   кадре, чужая длинная задача между кадрами (таймер, ответ сети, разбор
   сейва) и GPU — лечатся по-разному, поэтому письмо о стопе несёт все три
   числа: js — сколько шёл последний кадр, lt — сколько из разрыва заняли
   длинные задачи главного потока (PerformanceObserver «longtask»), остаток —
   то, чего поток не делал, то есть растр и композитор. */
let FRAME_JS=0;const LONGTASKS=[];
try{new PerformanceObserver(l=>{for(const e of l.getEntries()){LONGTASKS.push([e.startTime,e.duration]);
  if(LONGTASKS.length>40)LONGTASKS.shift();}}).observe({type:"longtask",buffered:true});}catch(_){}
function stallWho(a,b){
  let lt=0;
  for(const [s,d] of LONGTASKS)lt+=Math.max(0,Math.min(b,s+d)-Math.max(a,s));
  const bake=[typeof STRIP_JOB!=="undefined"&&STRIP_JOB?"strip":"",typeof MAT_JOB!=="undefined"&&MAT_JOB?"mat":"",
    typeof NEB_JOB!=="undefined"&&NEB_JOB?"neb":""].filter(Boolean).join(",");
  const gap=b-a;
  return {gap:gap|0,js:FRAME_JS|0,lt:lt|0,gpu:Math.max(0,gap-Math.max(lt,FRAME_JS))|0,bake,
    cv:(typeof cvs!=="undefined"&&cvs?cvs.width+"x"+cvs.height:"")};
}
/* ── шаг на прибитых часах (M441) ──
   На настоящих часах шаг кадра меряется rAF: сколько прошло, столько и
   прожито, — и потому два прогона одной сцены никогда не совпадали бы: у
   каждого своя машина и свои паузы. На прибитых (`clockSet`, 01-core) шаг
   постоянный: кадр — это ровно FRAME_MS игрового времени, часы двигает сам
   кадр, потолок кадров и авторазрешение молчат (оба судят настоящую
   развёртку). Сколько кадров — столько времени, и мир повторяется кадр в кадр.
   `loopReset` зовётся из clockSet: смена часов рвёт фазу — редкий такт и
   замер шага начинаются заново, иначе второй прогон унаследовал бы фазу
   первого. */
const FRAME_MS=16.667;
/* ══════════════ каденсия: мир шагает квантом (0.1) ══════════════
   Замер на S23 (плейтест 13.09): промежутки между кадрами рассыпаны по
   одному–трём периодам развёртки, длинные и короткие чередуются. Камера при этом
   ровная (p95 1.8 px) — дёргался САМ МИР: шаг шёл по сырому dt кадра, и нос
   поворачивался на 0.08 рад на коротком кадре и на 0.16 на длинном — сто шестьдесят
   скачков крупнее 4.6° в минуту на ручном руле.

   Мир теперь шагает ТОЛЬКО целыми квантами по 1/120 с, а недошаганный остаток
   переносится в следующий кадр: длинный кадр даёт два ОДИНАКОВЫХ шага вместо
   одного вдвое крупнее, и поворот носа на шаг всегда один и тот же. Средняя
   скорость не меняется — остаток не теряется, а ждёт.

   Где НЕ квантуем: такты, которые не двигают корабль (звук, интерфейсные
   *Tick, автосохранение), зовутся ОДИН раз за кадр суммой квантов: дрожало не
   они, а цена второго вызова на телефоне реальная.

   Кадр без единого кванта (экран быстрее 240 Гц) не рисуется вовсе: картинка была
   бы той же, а растр — полной цены. Провал длиннее шести квантов не догоняем
   совсем: догонка стоит кадра, и из такой спирали игра не выбирается. */
const QUANT_MS=1000/120;               /* квант мира — половина кадра шестидесяти герц */
const QUANT_DT=QUANT_MS/FRAME_MS;      /* тот же квант в единицах dt (= .5) */
const QUANT_MAX=6;                     /* дальше не догоняем */
let quantAcc=0;                        /* недошаганный остаток, мс */
function loopReset(){last=wallMs();lastDroneTick=0;capPrev=0;capN=0;quantAcc=0;tactGood=0;tactBad=0;
  lastFuelWarn=0;lastHullWarn=0;sndWalk=0;
  for(const f of LOOP_PHASE)f();}
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
   по сглаженной оценке не укладывается в 24 мс три секунды подряд.

   ── и возвращается (M437, переделано в 0.4) ──
   Прежде вверх она не шла никогда: «дрожание чётко — мыльно — чётко хуже ровной
   картинки». Цена этого правила оказалась выше самого дрожания: три тяжёлые
   секунды ОДИН раз — заход на планету, первая печь ломтей, чужая вкладка — и
   весь остальной вечер игрок смотрит на мыло, включая карту, которая стоит
   копейки (автор, 09.09: «шрифт как-то размывает»).

   Замер на S23 (13.09) показал, что и после M437 возврат не сработал нИ РАЗУ:
   разрешение упало до ×1 (411×742, седьмая часть пикселей) и там осталось навсегда.
   Три причины, и все три исправлены здесь:
     * порог подъёма 13 мс на телефоне не достигается даже на ×1 — там и на
       самом дешёвом растре кадр стоит около двадцати миллисекунд;
     * двадцать секунд подряд лёгкого кадра не случается в игре вовсе: за двадцать
       секунд игрок успевает развернуться, и один тяжёлый кадр обнулял счёт;
     * два возврата за сеанс (`resUps<2`) — потолок, который в долгой игре значит
       «больше никогда».

   Пороги теперь не в миллисекундах, а в долях ЦЕЛЕВОГО кадра (шестьдесят герц или
   то, что выбрал игрок в потолке кадров): вниз — выше 1.45 целевого (24 мс на
   шестидесяти, как и было), вверх — ниже 1.05 (17.5 мс, то есть 57 кадров). Между
   ними лежит обычная жизнь кадра — ровные 18 мс не двигают ничего. С потолком кадров
   в тридцать это теперь тоже работает: прежде ровные 33 мс были «тяжёлым кадром»
   и роняли разрешение на ровном ходу.

   А дребезг держит не потолок попыток, а НАКАЗАНИЕ ЗА НЕУДАЧНУЮ: возврат, после
   которого кадр сорвался раньше полуминуты, считается ошибкой, и следующая
   попытка ждёт минуту, затем две, четыре — до четверти часа. Возврат, проживший
   полминуты, снимает накопленное наказание. Так дорогая сцена один раз отнимает
   чёткость и не отнимает весь вечер, а маятник каждые восемь секунд невозможен.

   Голос скажет о перемене не чаще раза в минуту: сама перемена видна глазом,
   а строка поверх мира в каждой сцене была бы хуже самого мыла. */
const RES_DOWN_K=1.45, RES_UP_K=1.05;        /* пороги в долях целевого кадра */
const RES_DOWN_WIN=3000, RES_UP_WIN=5000;    /* сколько держаться, чтобы сдвинуть */
const RES_HOLD_MS=30000;                     /* возврат короче этого — ошибка */
const RES_WAIT0=60000, RES_WAIT_MAX=900000;  /* наказание за ошибку, с удвоением */
/* Голос (Дизайнер, 17.09): подъём — МОЛЧА. Картинка стала лучше, и это само
   себя сообщение; тост про вещь, которой игрок не касался, только мешает. Спуск
   говорит ОДИН раз за сеанс — иначе спуск-подъём-спуск даёт три тоста за две
   минуты руления. Где вернуть чёткость руками, сказано в самом сообщении. */
let resEma=16,resBad=0,resGood=0,resUps=0,resMode="",resFresh=0;
let resWait=0,resHeld=0,resWaitNext=RES_WAIT0,resSaid=false;
/* целевой кадр: шестьдесят герц, но если игрок поставил потолок ниже — его.
   Без этого потолок в тридцать кадров сам же ронял разрешение: ровные 33 мс
   стояли выше порога спуска, и игра считала свой же потолок просадкой. */
function resTarget(){
  let cap=0;try{cap=G.opts.gfx.fps|0;}catch(e){}
  return cap>0?Math.max(FRAME_MS,1000/cap):FRAME_MS;
}
function resSay(t){
  if(resSaid)return;
  resSaid=true;say(t);
}
/* Потолок чёткости ПО РЕЖИМУ — готов, но молчит, пока автор не включит
   gfx.resByMode (0 по умолчанию, 08-state). Растр — не JS, и снимать с него
   миллисекунды в кадре нечем; но тестировщик на S23 замерил принудительное
   ×1.5 против ×2 на одной и той же сцене под тягой: 59.0 кадра/сек и 98.3%
   каденции против 51.3/83.1% и 519 длинных кадров — разница ровно в числе
   пикселей, не в работе. Резкость-против-плавности — решение автора, не
   наше: это правило просто ждёт его слова наготове, вместо того чтобы
   начинать разработку заново, когда он скажет «включай». Под тягой — там,
   где растр и марево двигателя дороже всего; в доке, за столом и на карте
   мир либо не движется, либо мир не рисуется вовсе, и чёткость там дешева. */
function resModeCap(){
  if(!G.opts.gfx.resByMode)return 2;
  if(G.mode==="system")return 1.5;
  if(G.mode==="landing"&&G.land&&G.land.thrOn)return 1.5;
  return 2;
}
function resAuto(d){
  if(!G.running||d<=0||d>250)return;
  resEma=resEma*.9+d*.1;
  /* печь новой сцены не судим (M437): смена режима один раз пересчитывает
     растр, и раньше именно эти кадры роняли разрешение на весь вечер.
     Пока сцена свежая — заодно и потолок по режиму сразу берёт своё
     значение (переключение по смене режима, без слежения за тягой кадр к
     кадру — это и есть отсутствие дрожания). */
  if(G.mode!==resMode){resMode=G.mode;resFresh=3000;resBad=0;resGood=0;
    if(G.opts.gfx.resByMode)resize();}
  if(resFresh>0){resFresh-=d;return;}
  if(G.opts.gfx.res||document.hidden){resBad=resGood=0;return;}
  if(resWait>0)resWait=Math.max(0,resWait-d);
  /* возврат дожил до полуминуты — значит был правильный, наказание снимаем */
  if(resHeld>0){resHeld-=d;if(resHeld<=0){resHeld=0;resWaitNext=RES_WAIT0;}}
  const per=resTarget(),down=per*RES_DOWN_K,up=per*RES_UP_K;
  if(RES_AUTO>1){
    if(resEma>down)resBad+=d;else resBad=Math.max(0,resBad-d*.5);
    if(resBad>RES_DOWN_WIN){
      /* сорвался вскоре после возврата — возврат был ошибкой */
      if(resHeld>0){resHeld=0;resWait=resWaitNext;resWaitNext=Math.min(resWaitNext*2,RES_WAIT_MAX);}
      resBad=0;resGood=0;resEma=per*1.25;resFresh=1500;
      RES_AUTO=RES_AUTO>1.5?1.5:1;
      if(DPR>RES_AUTO){resize();resSay("Разрешение снижено до ×"+RES_AUTO+"\nвернуть — в настройках, «Графика»");}
      return;
    }
  }
  /* и обратно, если кадр пять секунд лёгок и наказание отбыто */
  if(RES_AUTO<2&&resWait<=0){
    if(resEma<up)resGood+=d;else resGood=Math.max(0,resGood-d*2);
    if(resGood>RES_UP_WIN){
      resGood=0;resBad=0;resEma=per*1.25;resFresh=1500;resUps++;resHeld=RES_HOLD_MS;
      RES_AUTO=RES_AUTO<1.5?1.5:2;
      if(Math.min(RES_AUTO,window.devicePixelRatio||1)>DPR)resize();   /* молча */
    }
  }
}
let capIv=16.667, capPrev=0, capN=0;
/* ══════════════ РОВНЫЙ ТАКТ (0.1b) ══════════════
   Автор после двух заходов: «на тел дергается все прогоны, плавный полет нужен».
   Замеры Со 23 объясняют, почему ровного полёта не было ни до квантования, ни
   после: экран там 120 Гц, то есть вся работа должна уложиться в 8.3 мс, а она не
   укладывается — и кадры приходят то через 16.7, то через 33.3. Именно это
   метание глаз и видит как дёрганье: честные шестьдесят ровных кадров плавнее,
   чем семьдесят пять рваных.

   Поэтому игра сама ставит себе такт: по умолчанию шестьдесят, то есть на сто
   двадцати герцах — каждый второй кадр развёртки, и промежутки ложатся на ровные
   16.7. Сто двадцать разрешаются только там, где кадр и впрямь дешёвый: средняя
   работа кадра ниже шести миллисекунд пять секунд подряд; выше семи — возврат на
   шестьдесят за секунду. Между шестью и семью — мёртвая зона, чтобы такт сам не
   дребезжал (та же схема, что у авторазрешения в 0.4).

   Пропуск считается КАДРАМИ развёртки, а не временем — по той же причине, что и
   игроцкий потолок ниже (см. «потолок кадров»): порог по времени, попавший между
   двумя кадрами развёртки, округляется вниз и превращает шестьдесят в тридцать.
   Игроцкий потолок всегда главнее: такт его не повышает. */
const TACT_LOW=6, TACT_HIGH=7;          /* мс работы кадра: пороги вверх и вниз */
const TACT_UP_WIN=5000, TACT_DOWN_WIN=1000;
let tactHz=60, tactGood=0, tactBad=0, workEma=10, ivEma=16.667, FRAME_DREW=false;
/* средняя работа кадра — только по НАРИСОВАННЫМ кадрам: пропущенные
   стоят копейки и тянули бы оценку вниз, повышая такт на пустом месте */
function tactWork(js){if(FRAME_DREW)workEma=workEma*.9+js*.1;}
/* Две меры, а не одна (замечание Контроля): работа кадра считается по FRAME_JS, а
   растр в неё не входит вовсе. На телефоне кадр именно растровый: JS может
   быть 3 мс при растре 20, и такт поднялся бы на 120, вернув ровно то метание, от
   которого уходим. Поэтому вторая мера — САМ ИНТЕРВАЛ нарисованных кадров: вверх
   пускаем только того, кто УЖЕ держит свой такт с запасом (интервал ниже 1.2
   периода), а вниз снимаем и по пропускам развёртки (выше 1.5 периода секунду). */
function tactTick(d){
  if(!G.running||d<=0||d>250)return;
  ivEma=ivEma*.9+d*.1;
  const per=Math.max(capIv,1000/tactHz);
  if(tactHz<120){
    const light=workEma<TACT_LOW&&ivEma<per*1.2;
    if(light)tactGood+=d;else tactGood=Math.max(0,tactGood-d*2);
    if(tactGood>TACT_UP_WIN){tactGood=0;tactBad=0;tactHz=120;ivEma=capIv;}
  }else{
    const heavy=workEma>TACT_HIGH||ivEma>per*1.5;
    if(heavy)tactBad+=d;else tactBad=Math.max(0,tactBad-d*.5);
    if(tactBad>TACT_DOWN_WIN){tactBad=0;tactGood=0;tactHz=60;ivEma=capIv*2;}
  }
}
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
  if(REC)recTick(dt);   /* запись ввода (15c-rec): кадр мира — кадр записи */
  /* растр покинутых систем (M332): сравнение двух строк в кадре, работа —
     только в тот кадр, когда игрок сменил систему */
  sysRasterTick();
  if(G.mode==="system"||G.mode==="dock"||G.mode==="barge")updateSystem(dt);
  else if(G.mode==="map")updateMap(dt);   /* прыжок — шаг мира, не кадр (0.438.0) */
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
  else if(G.mode==="wanderer"&&G.wan)updateWanderRoom(dt);   /* на борту «Сороки» (M343) */
}
function drawWorld(){
  /* у сцен без своего неба свет постоянный (M243): SUN_DIR не должен нести
     сюда азимут планеты, с которой игрок только что ушёл, — иначе тени в
     комнатах ложатся по вчерашнему закату */
  if(!(G.mode==="surface"||G.mode==="landing")&&typeof sunDirSet==="function")sunDirSet(null);
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
  else if(G.mode==="wanderer"&&G.wan)drawWanderRoom();
  /* ореол вокруг яркого — последним по миру и до приборов (M243) */
  if(typeof bloomPass==="function")bloomPass(BLOOM_K[G.mode]||0);
  /* зерно на все сцены, виньетка — где своей нет (M244) */
  if(typeof grainPass==="function"&&G.mode!=="map")
    grainPass(!(G.mode==="surface"||G.mode==="landing"));
}
function frameBody(now){
  FRAME_IN=true;   /* всё, что скажет кадр, — голос мира (say, 08-state); снимается в конце и на событиях */
  if(LOOP_OFF)return;
  /* Скрытая страница не рисует. Обычно её и так не будят — rAF стоит, — но в
     headless с виртуальным временем кадры идут как из пулемёта, и полная
     отрисовка в невидимую канву съедала весь бюджет: прогон тестов вставал
     намертво (M170). Стенды рисуют своими вызовами и этой ветки не касаются. */
  if(document.hidden){FRAME_DREW=false;return;}
  /* дорожный спутник рисует свой кадр сам и занимает весь экран: мир под ним
     не виден, а батарею ест вдвое — а именно батарея и есть заявленная цена
     режима. Плюс это единственный путь, которым мировой холст мог просочиться
     поверх заставки (стенд M168k). Цепочка кадров не рвётся: выйдут — поедет. */
  if(RD&&document.body.classList.contains("road")){return;}
  /* канва нулевого размера (страница поднялась скрытой) — чинится здесь же:
     иначе кадр падает на drawImage и игра стоит до первого resize */
  if(W<2||H<2){resize();if(W<2||H<2){return;}}
  const tReal=now,pin=clockPinned();
  let dt,steps=1;
  if(pin){
    /* прибитые часы: шаг постоянный, часы двигает кадр (см. FRAME_MS) */
    clockAdvance(FRAME_MS);now=clockNow();dt=1;
  }else{
  if(capPrev){
    const d=now-capPrev;
    /* «самый короткий за последнее время»: медленно отпускаем оценку вверх,
       чтобы смена монитора или переезд окна на другой экран не остались
       незамеченными навсегда */
    if(d>1&&d<capIv)capIv=capIv*.7+d*.3; else capIv=Math.min(capIv*1.002,50);
  }
  capPrev=now;
  /* Два разных обещания — два разных округления (0.1b). Игроцкий потолок —
     потолок: округляется ВВЕРХ, лучше отдать 48 кадров под обещание «не выше
     шестидесяти», чем 72. Свой такт — ПРИЦЕЛ: округляется к ближайшему. Разница
     не теоретическая: оценка периода развёртки берёт САМЫЙ КОРОТКИЙ промежуток и
     на дрожащем 120 Гц съезжает на 7.6 мс вместо 8.33 — и ceil давал шаг в ТРИ
     кадра развёртки, то есть 40 кадров вместо шестидесяти (замер: промежутки 24–27 мс
     вместо 16.7). Из двух шагов берём БОЛЬШИЙ: потолок нельзя превышать. */
  const capOpt=G.opts.gfx.fps|0;
  {
    let stride=Math.max(1,Math.round(1000/tactHz/capIv));
    if(capOpt)stride=Math.max(stride,Math.ceil(1000/capOpt/capIv-.15));
    if(++capN%stride){FRAME_DREW=false;FRAME_IN=false;return;}
    capN=0;
  }
  FRAME_DREW=true;
  resAuto(now-last);
  tactTick(now-last);
  /* мир шагает квантами, остаток ждёт следующего кадра (см. QUANT_MS) */
  quantAcc+=clamp(now-last,0,250);last=now;
  /* БЛИЖАЙШЕЕ число квантов, а не пол — и остаток может быть ОТРИЦАТЕЛЬНЫМ
     (взяли вперёд и отдадим следующим кадром). С полом на 120 Гц возвращалось
     то же чередование, только в мире: интервал дрожит вокруг 8.33, и 8.1 давал ноль
     шагов, а 8.5 — два. Округление даёт 8.33±1 → шаг, 16.6 → два, 25 → три. */
  steps=Math.round(quantAcc/QUANT_MS);
  if(steps>QUANT_MAX){steps=QUANT_MAX;quantAcc=0;}
  else quantAcc=clamp(quantAcc-steps*QUANT_MS,-QUANT_MS*.5,QUANT_MS*QUANT_MAX);
  /* кадр короче половины кванта не рисуем — но флаг голоса снимаем сами:
     frameBody зовут не только из frame() (стенды, пробники), и там его никто не чистит */
  if(!steps){FRAME_DREW=false;FRAME_IN=false;return;}
  dt=steps*QUANT_DT;
  }
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
    /* налёт для допуска (M363, 05e): настоящими миллисекундами и только в
       полётных режимах — на станции и за столом время не идёт */
    if(typeof clrTick==="function")clrTick(dt*16.667);
    if(now-lastDroneTick>3000){if(lastDroneTick&&now-lastDroneTick>PEOPLE_GAP_MS)peopleOffline();   /* спящая вкладка — не игра (12a) */
      lastDroneTick=now;tickDrones();crewTick();mgrTick();occTick();dealsTick();
      /* срок (12v): считается лениво по часам, тем же редким тактом, что и всё
         остальное фоновое. Узнают о нём, оказавшись под тем самым небом. */
      if(G.doom){doomLearn();doomTick();}
      /* возможности (11ah): истекают молча, тем же редким тактом. Ни звука,
         ни строки — окно просто закрылось, и если оно было именным, человек
         больше не назовёт твой позывной. */
      if(typeof offerTick==="function")offerTick();
      /* и однажды рассказанное возвращается чужим голосом (11aj) */
      if(typeof toldEther==="function")toldEther();}
    /* голос мира ждёт, пока открыт экран (08-state), но не дольше 20 с: после
       пяти минут на столе «Полёт восстановлен» уже неправда — сгорает */
    if(G.msgT>0){if(!msgHeld())G.msgT-=dt;else if((MSG_HOLD+=dt)>1200)G.msgT=0;}
    /* запись и в доке, и на земле: полчаса торговли или бурения, закрытые
       крестиком браузера, откатывались к последнему полёту — деньги со сделок
       и руда исчезали молча (плейтест 30.08.2026). Оба режима стабильны, их
       снимок честен: восстановление ставит корабль в свободный полёт там же. */
    if(G.mode==="system"||G.mode==="dock"||G.mode==="surface")autosave();
    /* мир шагает ОДИН раз за кадр, как и до 0.1; квантуется внутри только
       корабль — см. WORLD_SUB (08-state) и updateSystem */
    WORLD_SUB=steps;
    try{stepWorld(dt);}finally{WORLD_SUB=1;}
    hullHeldTick();   /* корпус до беды (R5b) */
    if(typeof tapeTick==="function")tapeTick(dt);
    if(typeof shiftTalkTick==="function")shiftTalkTick(dt);
    if(typeof instrAgeTick==="function")instrAgeTick(dt);
    if(typeof etherTick==="function")etherTick(dt);
    beaconTick(dt);crewBtnTick();if(typeof dealBtnTick==="function")dealBtnTick();gotTick();if(typeof handBtnTick==="function")handBtnTick();if(typeof firstTick==="function")firstTick();hqBtnTick();loreBtnTick();parrotBtnTick();consoleTick(dt);orderTick();if(typeof vegaTick==="function")vegaTick(dt);if(typeof ringTick==="function")ringTick();if(typeof expDayTick==="function")expDayTick();if(typeof expDepartTick==="function")expDepartTick();if(typeof lastRunTick==="function")lastRunTick();if(typeof recordTick==="function")recordTick();if(typeof instTick==="function")instTick();if(typeof skyTick==="function")skyTick();if(typeof traineeTick==="function")traineeTick();if(typeof zooTick==="function")zooTick();wearTick(dt);if(typeof wanderTick==="function")wanderTick(dt);if(typeof mayakTick==="function"){mayakTick();voiceTick();}
    /* страховка от «зависания на стыковке»: режим dock без единой открытой панели
       означал бы, что игрок смотрит на космос и не может двигаться */
    if(G.mode==="dock"&&!scrOpen()){
      if(G.st)openStation();else G.mode="system";
    }
    if(G.mode==="barge"&&!scrOpen())G.mode="system";
    audioTick(dt);
    drawWorld();
    if(typeof drawHitFx==="function")drawHitFx(dt);   /* хроматика после попадания (M325) */
    hud();
    /* приборная стойка (25d) поверх мира: раскрытая аппаратура, к которой
       игрок повернулся. Рисуется последней, но до DOM-строки приборов */
    if(typeof rackDraw==="function")rackDraw();
  }else{
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
    G.t=tReal*.06;drawNebula(tReal*.004,0,1);drawStars(tReal*.004,0,1);
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
let crashN=0,crashLast="",crashSaid=0,crashSaidAt=0;
/* ГДЕ именно сломалось. Сообщение без адреса чинить нечем: «Invalid string
   length · surface» (журнал автора, 30.08.2026) не говорит ни строки, ни
   функции, и на поиск виновника уходит сессия. Стек в кадре есть всегда —
   берём из него два первых своих имени, мимо самого сторожа. */
function crashAt(e){
  let st="";
  try{st=String((e&&e.stack)||"");}catch(_){return "";}
  if(!st)return "";
  const out=[];
  for(const L of st.split(/[\r\n]+/)){
    const m=/at\s+(?:new\s+)?([A-Za-z0-9_$.]+)\s*[\(@]/.exec(L);
    if(!m)continue;
    const n=m[1];
    if(n==="crashAt"||n==="crashSay"||n==="frame"||n==="frameBody")continue;
    out.push(n);
    if(out.length>=2)break;
  }
  return out.join("←");
}
/* логгер и ловушки живут в 01a-crashlog — с самого начала склейки. Здесь ничего
   не подменяется: «warn» судового журнала — это новости игры, а не беда, и на
   сервер их больше не шлют (0.419, см. `logShip` в 01a-crashlog). Сбой кадра
   уходит отдельно, из `crashSay` ниже. */
/* «СБОЙ» — единственный видимый сигнал сторожа кадра: он не ждёт за экраном
   (MSG_WORLD=false), иначе молчал бы ровно тогда, когда открыт СТОЛ (критик 12.09) */
function crashSay(e,where){
  crashN++;
  try{document.documentElement.removeAttribute("data-alive");}catch(_){}   /* метка живости снимается: сайт со сбоем — не живой */
  crashShip(where==="обещание"?"rejection":where==="вне кадра"?"outside":"crash",
    (e&&e.message)||String(e),crashStack(e));
  let m="";
  try{m=(e&&e.message)||String(e);}catch(_){m="?";}
  const at=crashAt(e);
  if(at)m+=" · "+at;
  if(where)m+=" · "+where;
  if(m===crashLast){
    /* ── та же строка не встаёт стеной, но и не пропадает навсегда ──
       Сообщение живёт на экране пару секунд, а в журнал ложится ОДНА строка.
       Если сбой идёт кадр за кадром — а зависание выглядит именно так, — то
       через минуту от него не остаётся ничего: игра «висит» и молчит. Ровно
       этой улики и не хватает в PLAN («у зависания автора причины нет»).
       Поэтому повтор считается молча, но раз в пятнадцать секунд напоминает
       о себе и называет счёт. */
    const now=wallNow();
    if(now-crashSaidAt<15000)return;
    crashSaidAt=now;
    try{say("СБОЙ · "+m+"\nповторяется · "+crashN+" раз\nигра идёт дальше — сохранитесь");MSG_WORLD=false;}catch(_){}
    try{logAdd("warn","Сбой кадра повторяется: "+m+" · "+crashN+" раз");}catch(_){}
    return;
  }
  crashLast=m;crashSaidAt=wallNow();
  if(crashSaid++<3){try{console.error("DRIFT:",e);}catch(_){}}
  try{say("СБОЙ · "+m+"\nигра идёт дальше — сохранитесь");MSG_WORLD=false;}catch(_){}
  try{logAdd("warn","Сбой кадра: "+m);}catch(_){}
}
/* стоп кадра: больше двух секунд между кадрами — свёрнутая вкладка или то
   самое зависание; вкладку отличает document.hidden, остальное уходит как stall */
let frameLastAt=0,frameN=0;const BEAT={n:0,ms:0,t:0,sent:0};
function frame(now){
  if(LOOP_OFF)return;
  /* метка «игра живёт»: первый настоящий кадр без сбоя (сбой её снимает, см. crashSay) — и на
     корне документа встаёт data-alive=VER. Её читают трое: первый набор тестов
     (99-run ждёт её, а не 60 мс), проверка живого сайта в deploy.yml после
     выкладки, и человек в консоли. 0.359.0 уехал мёртвым при зелёных тестах —
     потому что никто не спрашивал сам файл, что уехал, живёт ли он */
  if(++frameN===1&&!crashN){try{document.documentElement.setAttribute("data-alive",VER);}catch(_){}}
  if(frameN%600===0&&typeof rescueActivityBeat==="function")rescueActivityBeat();   /* остывание прыжков домой (16c) */
  /* ── провал кадра: только настоящий (M417) ──
     Проверка `!document.hidden` стояла на месте, но спрашивала не в тот
     момент: rAF просыпается уже ПОСЛЕ того, как вкладку вернули, — вкладка к
     этой строке снова видима, а разрыв в ней весь тот, что она провела
     скрытой. В журнале сервера это выглядело так: «кадр стоял 701631 мс», то
     есть одиннадцать с половиной минут свёрнутого окна, поданные как
     зависание. Ровно то, ради чего лог заведён, — авторское зависание — в
     таком логе не найти. Поэтому скрытость помнится СО ВРЕМЕНИ СОБЫТИЯ:
     `frameLastAt=0` на возврате, и первый кадр после возврата не мерится. */
  const framePrev=frameLastAt;
  frameLastAt=now;
  if(framePrev&&now-framePrev>2000)crashShip("stall","кадр стоял "+((now-framePrev)|0)+" мс","",stallWho(framePrev,now));
  /* пульс: раз в три минуты, потом раз в десять — версия, режим, средний fps,
     окно. Не ошибка, а мерка с настоящих телефонов: «60 fps в девяти режимах»
     мерились дома; здесь — то, что видят игроки. Ничего личного: ни текста,
     ни имён (правило открытки). Считается сервером в digest.json */
  /* ── пульс: и он мерил ноль (M417) ──
     `frameLastAt=now` стояло СТРОКОЙ ВЫШЕ, поэтому `now-frameLastAt` здесь
     было всегда нулём: сумма кадровых времён не росла, `1000/0` уходило на
     сервер как «fps Infinity», а сервер записывал это нулём. Замер «сколько
     кадров видят игроки на своих телефонах» не работал ни разу за всё время
     существования — в `digest.json` одна строка, avg 0, min 0. Считаем от
     предыдущей метки, как и провал кадра. */
  if(framePrev){BEAT.n++;BEAT.ms+=Math.min(200,now-framePrev);
    if(BEAT.n>=60){const dt=now-BEAT.t;if(dt>(BEAT.sent?600000:180000)){
      const fps=Math.round(1000/Math.max(1,BEAT.ms/BEAT.n));
      /* и в письмо не уходит то, что не число: сторож, который шлёт Infinity,
         портит сводку молча — сервер кладёт ноль и считает его замером */
      if(isFinite(fps)&&fps>0&&fps<1000)crashShip("beat","fps "+fps,"",{fps});
      BEAT.sent++;BEAT.t=now;BEAT.n=0;BEAT.ms=0;}}}
  if(!STORAGE_OK&&!CRASH_SHIP.st){CRASH_SHIP.st=1;crashShip("storage","localStorage недоступен","");}
  const fb0=wallMs();   /* stallWho (выше) читает FRAME_JS — засекаем реальным временем, как остальной цикл */
  try{frameBody(now);}catch(e){crashSay(e,G&&G.mode);}
  FRAME_JS=wallMs()-fb0;
  tactWork(FRAME_JS);   /* средняя работа кадра решает, можно ли 120 (0.1b) */
  FRAME_IN=false;   /* дальше до следующего кадра говорят нажатия — это отклик, а не голос мира */
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
    scoop:[updateScoop,drawScoop],base:[updateBase,drawBase],raid:[updateRaid,drawRaid],
    homein:[updateHomeIn,drawHomeIn],winter:[updateWinter,drawWinter],spa:[updateSpa,drawSpa]}[G.mode];
  if(!M)return {ошибка:"режим "+G.mode+" не профилируется"};
  const names=Object.keys(window).filter(k=>typeof window[k]==="function"&&/^(draw[A-Z]|fill[A-Z]|b[A-Z][a-z]|hud$)/.test(k)&&k!=="drawChunks");
  const T={},orig={};
  for(const n of names){orig[n]=window[n];
    window[n]=function(){const t=wallMs();try{return orig[n].apply(this,arguments);}finally{T[n]=(T[n]||0)+wallMs()-t;}};}
  if(mute&&orig[mute])window[mute]=function(){};
  let js=0,ras=0;
  try{
    for(let i=0;i<N;i++){
      const t0=wallMs();G.t+=1;M[0](1);M[1]();hud();
      const t1=wallMs();ctx.getImageData(0,0,1,1);const t2=wallMs();
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
  let n=0,t0=wallMs(),lt=t0,mx=0,slow=0;
  const v0=Math.hypot(sh.vx,sh.vy),f0=G.fuel;
  return new Promise(r=>{
    (function f(){
      const t=wallMs(),d=t-lt;lt=t;
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
