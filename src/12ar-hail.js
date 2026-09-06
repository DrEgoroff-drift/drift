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
const HAIL_RANGE=900;       /* с какого расстояния окликают */
function hailPicket(sh){
  /* ближайший чужой борт державы, который может окликнуть */
  let best=null,bd=HAIL_RANGE;
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
function hailAnger(by,why){
  if(!by)return;
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
}
/* игрок выстрелил по державе — первое правило, и оно самое короткое */
function hailShotAt(p){
  if(!p||!p.pw||!p.iff)return;
  hailAnger(p.pw,"первое правило: открыл огонь");
}
/* ── такт оклика ── */
function hailTick(sh,dt,actEdge){
  if(G.mode!=="system")return false;
  const H=G.hail;
  if(H){
    H.t-=dt;
    const P=(typeof powerOf==="function")?powerOf(H.by):null;
    const who=P?P.ru.toUpperCase():"ПИКЕТ";
    G.prompt=who+" · «"+(P?P.hail:"Кто такой")+"»\n"+
      "ДЕЙСТВИЕ — «ПРОХОДОМ» · ЦЕЛЬ — «ПО ДЕЛУ»"+(H.warn?" · ВАС УЖЕ ПРЕДУПРЕДИЛИ":"");
    if(actEdge){hailAnswer("pass");return true;}
    if(H.t<=0){
      /* молчание. Первое — предупреждение, второе — они правы */
      if(!H.warn){
        H.warn=1;H.t=HAIL_HOLD;
        say("МОЛЧИТЕ · ЭТО ЗАПИСЫВАЮТ",100);
        if(typeof etherLine==="function")etherLine("…борт не отвечает. Повторяю запрос.",who);
      }else{
        hailAnger(H.by,"четвёртое правило: не ответил и пошёл дальше");
      }
    }
    return true;
  }
  /* оклик: раз на систему и на смену волны, и только если рядом чужой пикет */
  const p=hailPicket(sh);
  if(!p)return false;
  G.hailLog=G.hailLog||{};
  const key=G.sx+","+G.sy+"|"+p.pw;
  const bucket=Math.floor(Date.now()/1800000);
  if(G.hailLog[key]===bucket)return false;
  G.hailLog[key]=bucket;
  G.hail={by:p.pw,t:HAIL_HOLD,warn:0,x:sh.x,y:sh.y,blk:hailBlockade()?1:0};
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
    H.warn=1;H.t=HAIL_HOLD;H.hold=1;
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
/* пошёл сквозь блокаду: расстояние от точки оклика растёт — значит идёт */
function hailRunCheck(sh){
  const H=G.hail;
  if(!H||!H.hold)return;
  if(Math.hypot(sh.x-H.x,sh.y-H.y)>1400)hailAnger(H.by,"четвёртое правило: пошёл сквозь блокаду");
}
