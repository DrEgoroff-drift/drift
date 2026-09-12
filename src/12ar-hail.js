/* ══════════════ четыре правила и позывной (M373, §6.1) ══════════════
   Репутации в игре нет и не будет. Вместо неё — четыре правила, которые знает
   каждый пикет любой державы, и которые целиком помещаются в одну строку на
   экране:

     гражданский борт не трогают, пока он не сделал одно из четырёх —
     1) выстрелил по ним;
     2) провёз через их пикет боеприпас с клеймом их врага;
     3) пристыковался к военному узлу их врага там, где идёт бой;
     4) пошёл сквозь блокаду после того, как его окликнули и велели стоять.

   Позывной — это обобщённый `fleetHailFirst` (12ai): оклик, вопрос «кто такой»
   и ТРИ готовых ответа. Свободного текста нет нигде и не будет (правило
   открытки): «проходом», «по делу», молчание. Молчание — тоже ответ, и второе
   молчание подряд приносит предупреждение.

   Ответы кладутся на те же две кнопки, что уже есть под рукой: ДЕЙСТВИЕ —
   «проходом», ЦЕЛЬ — «по делу». Третьего пальца на телефоне не бывает, и
   третья кнопка тут не появится: молчание нажимать не надо. */
const HAIL_HOLD=420;        /* сколько кадров ждут ответа — семь секунд */
/* на телефоне семи секунд не хватает: вопрос надо прочесть и дотянуться до
   ответа большим пальцем (тестировщик на деве, 12.09) — пятнадцать */
const HAIL_HOLD_PHONE=900;
function hailHold(){return (typeof innerWidth==="number"&&innerWidth<=760)?HAIL_HOLD_PHONE:HAIL_HOLD;}
const HAIL_RANGE=900;       /* с какого расстояния окликают */
function hailPicket(sh){
  /* ближайший чужой борт державы, который может окликнуть */
  /* досмотр (M387): держава смотрит всех подряд — окликают вдвое дальше */
  let best=null,bd=HAIL_RANGE*((typeof secHailRangeMul==="function")?secHailRangeMul():1);
  for(const p of (G.pirates||[])){
    if(p.hull<=0||!p.pw||p.envoy)continue;
    if(p.pw===playerFlag())continue;                 /* свои не окликают своих */
    const d=Math.hypot(sh.x-p.x,sh.y-p.y);
    if(d<bd){bd=d;best=p;}
  }
  return best;
}
/* ── клеймо на боеприпасе (§6.1 правило 2) ──
   Партия ракет собрана где-то, и это где-то на ней написано. Своё клеймо —
   ГЛАВТРАССЫ; купленное на чужой станции носит её клеймо, и через пикет её
   врага такую кассету лучше не везти. */
function ammoStamp(){return G.mslBy||"gt";}
function ammoStampSet(by){G.mslBy=(typeof HULL_MAKER!=="undefined"&&HULL_MAKER[by])?by:"gt";}
function hailContraband(by){
  /* чужой талон в баках (M387): досмотр той самой державы узнаёт своё топливо */
  if(typeof secSmugHot==="function"&&secSmugHot(by))return true;
  if((G.cargo.missile|0)<=0)return false;
  const st=ammoStamp();
  if(st===by)return false;
  if(typeof chronWarBetween!=="function")return false;
  const a=MAKER_KEYS.indexOf(by),b=MAKER_KEYS.indexOf(st);
  return chronWarBetween(a,b);
}
/* ── блокада (§6.1 правило 4) ──
   Фронт — это и есть блокада: пикет велит стоять. «Стоять» проверяется не
   словами, а расстоянием: если после оклика борт продолжает уходить, значит
   он пошёл сквозь. */
function hailBlockade(){
  return !!(typeof chronFront==="function"&&chronFront(G.sx,G.sy));
}
/* ── злость: одна на державу и на систему, не на галактику ──
   Нарушил — стреляют здесь и сейчас те, кто это видел. Летопись про это не
   знает: эпизоды и та память, которая ездит по трассам, приходят с M374. */
/* ── система старта (блокер надзора 12.09) ──
   Замер тестировщика: новичок на «лёгком старте» молчит — пикет «Коммуны»
   окликает на ~45 с, стреляет на ~75 с, к 93 с корабль разбит. Первая встреча
   не может быть смертельной: в системе старта молчание получает предупредительный
   залп по щиту и «уходите», а огонь пикета не опускает корпус ниже половины —
   на пол он замолкает сам (playerHit, 13-combat). Правила те же, цена другая */
function hailStartSys(){return (G.sx|0)===0&&(G.sy|0)===0;}
const HAIL_START_FLOOR=.5;
function hailCalm(by,line){
  let n=0;
  for(const p of (G.pirates||[]))if(p.hull>0&&p.pw===by&&!p.iff){p.iff=1;p.aware=false;n++;}
  G.marks=(G.marks||[]).filter(p=>p.pw!==by);
  if(!n)return;
  const P=(typeof powerOf==="function")?powerOf(by):null;
  say((P?P.ru.toUpperCase():"ПИКЕТ")+": "+(line||"ХВАТИТ С ВАС · УХОДИТЕ"),140);
  if(typeof etherLine==="function")etherLine("…"+(P?P.ru:"пикет")+": хватит. Уходите своей линией.",P?P.ru:"пикет");
}
function hailWarnVolley(by,why){
  G.hail=null;
  const P=(typeof powerOf==="function")?powerOf(by):null;
  G.shield=0;G.shieldHit=typeof SHIELD_DELAY!=="undefined"?SHIELD_DELAY:60;
  sfx("hit",{v:.35});if(typeof hitFx==="function")hitFx(.35);
  say((P?P.ru.toUpperCase():"ПИКЕТ")+" · ПРЕДУПРЕДИТЕЛЬНЫЙ ПО ЩИТУ\nуходите — следующий по корпусу",160);
  if(typeof etherLine==="function")
    etherLine("…"+(P?P.ru:"пикет")+": борт молчит. Предупредительный. Уходите.",P?P.ru:"пикет");
  logAdd("warn","Пикет "+(P?P.ru:"")+" дал предупредительный по щиту: "+(why||"нарушение"));
}
function hailAnger(by,why){
  if(!by)return;
  /* в системе старта молчание и блокада — не повод разбивать новичка */
  if(hailStartSys()&&!/первое/.test(why||"")){hailWarnVolley(by,why);return;}
  let n=0;
  for(const p of (G.pirates||[])){
    if(p.hull<=0||p.pw!==by)continue;
    p.iff=0;p.aware=true;n++;
  }
  if(!n)return;
  G.hail=null;
  const P=(typeof powerOf==="function")?powerOf(by):null;
  say((P?P.ru.toUpperCase():"ПИКЕТ")+" ОТКРЫВАЕТ ОГОНЬ",120);
  if(typeof etherLine==="function")
    etherLine("…"+(P?P.ru:"пикет")+": борт нарушил "+(why||"правило")+". Работаем.",
      P?P.ru:"пикет");
  logAdd("warn","Пикет "+(P?P.ru:"")+" открыл огонь: "+(why||"нарушение"));
  /* нарушение правила — это эпизод (M374): его запомнит человек, и он поедет
     по трассам вперёд вас */
  if(typeof epiAdd==="function"){
    const k=/первое/.test(why||"")?"shot":(/второе/.test(why||"")?"contra":"ran");
    epiAdd(k,by,{force:1});
  }
}
/* игрок выстрелил по державе — первое правило, и оно самое короткое */
function hailShotAt(p){
  if(!p||!p.pw||!p.iff)return;
  hailAnger(p.pw,"первое правило: открыл огонь");
}
/* ── такт оклика ── */
function hailTick(sh,dt,actEdge){
  if(G.mode!=="system"){hailWinSync();return false;}
  const H=G.hail;
  if(H){
    /* за экраном отсчёт стоит: окно оклика видно поверх, но читающего не торопят */
    if(!worldCovered())H.t-=dt;
    /* вопрос и отсчёт — в окне (hailWinSync); подсказка несёт только ответы,
       короткие, чтобы на 390 px она не резалась, а пэды взяли глаголы */
    const won=cue(H.hold?"ВЕЛЕНО СТОЯТЬ · ЖДИТЕ":"ОКЛИК · ДЕЙСТВИЕ — ПРОХОДОМ · ЦЕЛЬ — ПО ДЕЛУ",CUE_ACT);
    if(won&&actEdge&&!H.hold){hailAnswer("pass");hailWinSync();return true;}
    if(H.t<=0){
      /* блокада: велели стоять, и он простоял срок (дальше 1400 — hailRunCheck) —
         отпускают. Прежде таймаут после «стоять» шёл в злость «не ответил», хотя
         борт стоял как велено (тестировщик, 12.09) */
      if(H.hold){
        G.hail=null;
        const P=(typeof powerOf==="function")?powerOf(H.by):null;
        say("ПРОПУСКАЮТ · ИДИТЕ",90);
        if(typeof etherLine==="function")etherLine("…стояли — видим. Проходите.",P?P.ru:"пикет");
        hailWinSync();return true;
      }
      const P=(typeof powerOf==="function")?powerOf(H.by):null;
      const who=P?P.ru.toUpperCase():"ПИКЕТ";
      /* молчание. Первое — предупреждение, второе — они правы */
      if(!H.warn){
        H.warn=1;H.t=hailHold();
        say("МОЛЧИТЕ · ЭТО ЗАПИСЫВАЮТ",100);
        if(typeof etherLine==="function")etherLine("…борт не отвечает. Повторяю запрос.",who);
      }else{
        hailAnger(H.by,"четвёртое правило: не ответил и пошёл дальше");
      }
    }
    hailWinSync();
    return true;
  }
  hailWinSync();
  /* под экраном новый оклик не начинается: пикет дождётся, пока борт снова в полёте */
  if(worldCovered())return false;
  /* оклик: раз на систему и на смену волны, и только если рядом чужой пикет */
  const p=hailPicket(sh);
  if(!p)return false;
  G.hailLog=G.hailLog||{};
  const key=G.sx+","+G.sy+"|"+p.pw;
  const bucket=Math.floor(now()/1800000);
  if(G.hailLog[key]===bucket)return false;
  G.hailLog[key]=bucket;
  G.hail={by:p.pw,t:hailHold(),warn:0,x:sh.x,y:sh.y,blk:hailBlockade()?1:0};
  const P=(typeof powerOf==="function")?powerOf(p.pw):null;
  if(typeof etherLine==="function")etherLine("…"+(P?P.hail:"кто такой"),P?P.ru:"пикет");
  sfx("ui",{f:520,to:380,d:.2,v:.25});
  return true;
}
/* ── ответ ──
   Три ответа и ни одного слова сверх: «проходом», «по делу», молчание. Что
   будет дальше, решают не слова, а трюм и то, идёт ли здесь бой. */
function hailAnswer(kind){
  const H=G.hail;
  if(!H)return false;
  const by=H.by,P=(typeof powerOf==="function")?powerOf(by):null;
  /* второе правило: клеймо чужого врага на боеприпасе */
  if(hailContraband(by)){
    hailAnger(by,"второе правило: кассеты с клеймом их врага");
    return true;
  }
  if(H.blk&&kind==="pass"){
    /* блокада: «проходом» здесь не ответ — велено стоять */
    H.warn=1;H.t=hailHold();H.hold=1;
    say("ВЕЛЕНО СТОЯТЬ · ЗДЕСЬ БЛОКАДА",120);
    if(typeof etherLine==="function")
      etherLine("…борт, стоять. Здесь закрыто. Повторяю: стоять.",P?P.ru:"пикет");
    return true;
  }
  G.hail=null;
  if(kind==="pass"){
    say("ОТВЕЧЕНО: ПРОХОДОМ",90);
    if(typeof etherLine==="function")etherLine("…принято. Идите своей линией.",P?P.ru:"пикет");
  }else{
    say("ОТВЕЧЕНО: ПО ДЕЛУ",90);
    if(typeof etherLine==="function")
      etherLine("…записано. По делу так по делу.",P?P.ru:"пикет");
  }
  return true;
}
/* ── окно оклика (блокер надзора 12.09) ──
   На телефоне вопрос не читался: подсказка с ответами резалась многоточием,
   «ЦЕЛЬ — ПО ДЕЛУ» не было видно нигде. Теперь оклик — окно того же терминала,
   что выходы бака, над падами: кто спрашивает, что спрашивает, отсчёт до
   предупреждения и два больших ответа. Те же ответы остаются на пэдах */
function hailWinSync(){
  if(typeof document==="undefined"||!document.body||!document.createElement)return;   /* узловой ярус тестов: DOM нет */
  let e=document.getElementById("hailwin");
  const H=G.hail,b=document.body;
  /* поверх любого экрана (R0, дев 12.09): прежде окно пряталось за СТОЛОМ, а отсчёт шёл */
  const show=!!H&&G.mode==="system";
  if(!show){if(e&&e.classList.contains("open")){e.classList.remove("open");b.classList.remove("hailopen");}return;}
  if(!e){
    e=document.createElement("div");e.id="hailwin";
    e.innerHTML="<b><em></em></b><div class='hq'></div><div class='hbar'><i></i></div><s class='hw'></s>"+
      "<div class='ha'><button class='act gold' data-a='pass'>ПРОХОДОМ<small>ДЕЙСТВИЕ</small></button>"+
      "<button class='act' data-a='busy'>ПО ДЕЛУ<small>ЦЕЛЬ</small></button></div>";
    for(const bt of e.querySelectorAll(".ha button"))
      bt.onclick=ev=>{ev.stopPropagation();sfx("ui");hailAnswer(bt.dataset.a);hailWinSync();};
    b.appendChild(e);
  }
  const em=e.querySelector("b em"),hq=e.querySelector(".hq"),bar=e.querySelector(".hbar i"),hw=e.querySelector(".hw"),ha=e.querySelector(".ha");
  /* узловой ярус: заглушка DOM не разбирает составные селекторы — окна там нет,
     логика оклика от него не зависит (0.446.0 упал на деплое именно здесь) */
  if(!em||!hq||!bar||!hw||!ha)return;
  const P=(typeof powerOf==="function")?powerOf(H.by):null;
  const deed=(typeof epiHailLine==="function")?epiHailLine(H.by):"";
  em.textContent=(P?P.ru.toUpperCase():"ПИКЕТ")+" · ОКЛИК";
  hq.textContent="«"+(deed||(P?P.hail:"Кто такой"))+"»";
  bar.style.width=Math.max(0,Math.min(100,H.t/hailHold()*100)).toFixed(1)+"%";
  hw.textContent=H.hold?"велено стоять · стойте, пока не отпустят":
    (H.warn?"ВАС УЖЕ ПРЕДУПРЕДИЛИ · молчание дальше — огонь":"молчание — тоже ответ: сперва предупреждение");
  e.classList.toggle("warn",!!H.warn&&!H.hold);
  ha.style.display=H.hold?"none":"";
  e.classList.add("open");b.classList.add("hailopen");
}
/* пошёл сквозь блокаду: расстояние от точки оклика растёт — значит идёт */
function hailRunCheck(sh){
  const H=G.hail;
  if(!H||!H.hold)return;
  if(Math.hypot(sh.x-H.x,sh.y-H.y)>1400)hailAnger(H.by,"четвёртое правило: пошёл сквозь блокаду");
}
