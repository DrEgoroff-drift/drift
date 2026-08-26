/* ══════════════ санаторий: три дня, и ничего не происходит ══════════════
   M199. Путёвка (M162) была одной строкой: «+3 суток, мораль полная». Здесь
   она становится МЕСТОМ. Веранда над морем, распорядок на щите, кислородный
   коктейль, тихий час, шахматы. И — главное — НИЧЕГО НЕ ПРОИСХОДИТ.

   ЭТО НЕ НЕДОРАБОТКА, А ЕДИНСТВЕННОЕ МЕСТО В ИГРЕ, ГДЕ РАЗРЕШЕНО ОТДЫХАТЬ.
   Сюда не прилетают пираты, тут не ломается реактор, отсюда не приходит наряд.
   Пропустить процедуру можно, и за это ничего не будет. Уйти можно в любую
   минуту, и за это тоже ничего не будет. Игра три дня ничего от игрока не
   хочет — а поскольку все остальные сто вех хотят непрерывно, три дня тишины
   весят больше любой награды.

   ВЕС ДАЁТ СТАРЕНИЕ. Трудовая книжка считает годы (M161), медкомиссия ждёт
   своего срока, и эти три дня — три дня, которых не вернуть. Игра об этом не
   напоминает ни строкой. Она просто позволяет их потратить.

   ЧЕГО ЗДЕСЬ НЕТ И НЕ БУДЕТ: наград за посещаемость, очков отдыха, полоски
   «расслабленность», достижения «прошёл весь курс». Любая такая правка
   превращает отдых в работу и убивает единственный смысл этого места.

   ПРАВИЛА ФАЙЛА:
   1. Ни одного исхода, который зависит от того, что игрок делал.
   2. Ни одной цифры на кадре, кроме дня и часа распорядка.
   3. Состояние — G.spa, и оно эфемерно: уехал — забылось. */
const SPA_DAYS=3;
/* Распорядок. Час — доля суток; порядок и есть весь смысл: по нему живут,
   а не по нему считают. */
const SPA_PLAN=[
  {k:"bath", ru:"ВАННЫ",             at:"утро",  line:"Вода тёплая, солёная, и в ней ничего не надо делать."},
  {k:"cock", ru:"КИСЛОРОДНЫЙ КОКТЕЙЛЬ",at:"полдень",line:"Пена оседает медленно. Вкус — как у детства, если у детства был вкус."},
  {k:"quiet",ru:"ТИХИЙ ЧАС",         at:"день",  line:"Лежать и не спать. Оказывается, это отдельное умение."},
  {k:"walk", ru:"ПРОГУЛКА ПО БЕРЕГУ", at:"вечер", line:"Дошёл до мыса и обратно. Больше ничего не случилось."},
  {k:"chess",ru:"ШАХМАТЫ НА ВЕРАНДЕ", at:"вечер", line:"Партия не доиграна. Договорились завтра, и оба знают, что не сядут."}
];
const SPA_BY_K={};SPA_PLAN.forEach(s=>SPA_BY_K[s.k]=s);
/* соседи по веранде: у каждого одна строка про себя и ни одной про игрока */
const SPA_FOLK=[
  "…я сюда третий раз. Первые два не помню совсем.",
  "…мне врач сказал: ничего не делайте. Я спрашиваю — а как. Он говорит: научитесь.",
  "…дома всё то же самое, только там надо вставать.",
  "…я тут книжку читаю. Одну и ту же, четвёртый день, с начала.",
  "…шахматы? Я плохо играю. Зато долго.",
  "…слышите? Вот это и есть море. Больше тут ничего не слышно."
];
function spaAll(){return G.spa||null;}
function spaOn(){return !!(G.spa&&!G.spa.done);}
function spaCanHere(){
  /* тот же порог, что был у путёвки: океанический мир и путёвка на руках */
  return !!(typeof instRestHere==="function"&&instRestHere());
}
function enterSpa(){
  const I=(typeof instAll==="function")?instAll():null;
  if(!I||I.vouch<=0||!spaCanHere())return false;
  I.vouch--;I.used=(I.used|0)+1;
  const th=(typeof thingsAll==="function")?thingsAll().find(t=>t.k==="voucher"):null;
  if(th)thingsAll().splice(thingsAll().indexOf(th),1);
  for(const k in keys)keys[k]=false;
  G.spa={day:1,days:SPA_DAYS,slot:0,done:0,took:{},talked:0,
    pname:(G.surf&&G.surf.p&&G.surf.p.name)||"",
    home:{sx:G.sx,sy:G.sy},seed:hashi(G.sx,G.sy,0x5A9)};
  G.mode="spa";
  say("Санаторий. Три дня.\nМожно ничего не делать — и это не фигура речи.",300);
  logAdd("good","Санаторий: три дня. Ничего не запланировано.");
  return true;
}
/* процедура: строка, немного тепла и НИКАКИХ последствий */
function spaTake(k){
  const S=spaAll();if(!S||S.done)return false;
  const P=SPA_BY_K[k];if(!P)return false;
  const key=S.day+":"+k;
  if(S.took[key])return false;
  S.took[key]=1;
  say(P.line,260);
  logAdd("dim",P.ru.toLowerCase()+" — "+P.line);
  sfx("ui",{f:640,to:880,d:.08,v:.14});
  /* единственные следы: люди на борту отдыхают. Никаких очков */
  if(k==="quiet"||k==="bath"){
    for(const c of (G.crew||[]))c.morale=Math.min(1,(c.morale||0)+.14);
  }
  if(k==="chess"&&G.vega&&G.vega.aboard&&typeof peopleLine==="function")
    peopleLine("Я выиграла. Ты поддавался. Не спорь.","Вега",true);
  return true;
}
/* сосед заговорил: сам, без повода, и ничего не просит */
function spaTalk(){
  const S=spaAll();if(!S)return "";
  S.talked=(S.talked|0)+1;
  const r=rng(hashi(S.seed,S.day*31+S.talked,0x5A9F));
  const line=SPA_FOLK[Math.floor(r()*SPA_FOLK.length)];
  if(typeof peopleLine==="function")peopleLine(line,"сосед по веранде",true);
  logAdd("talk","сосед по веранде: "+line);
  return line;
}
/* день кончился: спать. Три раза — и всё */
function spaSleep(){
  const S=spaAll();if(!S||S.done)return false;
  S.day++;
  G.t+=CEL_DAY;
  if(S.day>S.days)return spaEnd();
  say("Утро. Ничего не изменилось.",200);
  return true;
}
function spaEnd(){
  const S=spaAll();if(!S||S.done)return false;
  S.done=1;
  /* всё, что даёт санаторий, — отдых. Ни денег, ни данных, ни строки в плане */
  for(const c of (G.crew||[]))c.morale=1;
  if(G.vega&&G.vega.aboard){
    G.vega.mood=1;G.vega.att=Math.max(0,(G.vega.att|0)-2);
    if(typeof peopleLine==="function")peopleLine("Море. Настоящее. Я не выйду из воды.","Вега",true);
  }
  if(typeof parrotHas==="function"&&parrotHas())
    logAdd("dim","У попугая полоска загара. Он не понимает, откуда.");
  recordAdd("санаторий","три дня отдыха · без замечаний");
  tell("good","Три дня прошли","ТРИ ДНЯ ПРОШЛИ\nничего не случилось");
  exitSpa();
  return true;
}
function exitSpa(){
  const S=spaAll();
  for(const k in keys)keys[k]=false;
  if(S&&S.home){G.sx=S.home.sx;G.sy=S.home.sy;}
  G.mode="surface";
  if(S&&S.done)G.spa=null;
}
