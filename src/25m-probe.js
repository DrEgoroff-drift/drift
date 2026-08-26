/* ══════════════ вымпел: зонд, который уходит навсегда ══════════════
   M196. В лаборатории собирается автоматический зонд и запускается к звезде,
   до которой вы не долетите никогда. Дальше про него надо ЗАБЫТЬ — и это не
   фигура речи, а механика: ни маркера, ни счётчика, ни строки «осталось
   столько-то». Недели спустя приёмник один раз поймает его слабеющий голос,
   зонд пришлёт снимок того места, куда добрался, и замолчит навсегда.

   ВРЕМЯ НАСТОЯЩЕЕ И ЛЕНИВОЕ. Никакого моделирования полёта: у зонда есть
   `Date.now()` запуска и срок. Пока срок не вышел — зонда нет нигде, кроме
   одной строки в сохранении. Вышел — он заговорит при следующем включении
   приёмника. Игра, закрытая на месяц, за этот месяц ничего не проспит.

   СНИМОК ПРИСЫЛАЕТ ЗОНД, А НЕ ИГРА. Открытка (M188) для того и написана
   отдельным художником, что рисует ЛЮБОЙ снимок сцены — в том числе такой, где
   человека не было и не будет. Место выводится из семени системы, куда зонд
   летел: игра не выдумывает картинку, она считает её так же, как считала бы
   свою.

   ПОЧЕМУ ЭТО СТОИТ ДЕЛАТЬ. Единственная вещь в игре, у которой нет ни
   награды, ни применения: ни денег, ни данных, ни открытого пути. Строка в
   трудовой книжке и фотография места, где вас никогда не будет.

   ПРАВИЛА ФАЙЛА:
   1. Ни одного напоминания игроку до срока. Забыть — часть замысла.
   2. Ничего не моделируется: только `t0`, срок и семя цели. */
const PROBE_COST_DATA=14;         /* данных на сборку */
const PROBE_COST_CR=900;          /* и кредитов на железо */
const PROBE_WAIT=11*86400000;     /* недели полёта: одиннадцать суток настоящих */
const PROBE_SPREAD=7*86400000;    /* разброс, чтобы два зонда не заговорили разом */
const PROBE_MAX=3;                /* больше трёх в небе — уже парк, а не поступок */
function probeAll(){
  if(!Array.isArray(G.probes))G.probes=[];
  return G.probes;
}
/* Цель: звезда далеко за краем обжитого. Берётся не «случайная точка», а
   настоящая система галактики — просто такая, до которой не дотянет ни один
   корпус. Зонд летит к МЕСТУ, а не в пустоту. */
function probeTarget(seed){
  const r=rng(seed>>>0);
  for(let i=0;i<400;i++){
    const a=r()*TAU, d=90+r()*140;
    const sx=Math.round(Math.cos(a)*d), sy=Math.round(Math.sin(a)*d);
    if(starAt(sx,sy))return {sx,sy};
  }
  return {sx:120,sy:0};
}
function probeCanBuild(){
  return probeAll().filter(p=>!p.done).length<PROBE_MAX&&
         G.data>=PROBE_COST_DATA&&G.credits>=PROBE_COST_CR;
}
function probeBuild(){
  if(!probeCanBuild())return false;
  G.data-=PROBE_COST_DATA;G.credits-=PROBE_COST_CR;
  const seed=hashi(G.sx,G.sy,(Date.now()&0x7fffffff))>>>0;
  const t=probeTarget(seed);
  const p={seed,tsx:t.sx,tsy:t.sy,t0:Date.now(),
           due:Date.now()+PROBE_WAIT+Math.floor((rng(seed^0x51A7)())*PROBE_SPREAD),
           done:0};
  probeAll().push(p);
  thingAdd("paper","Вымпел · расписка о запуске",
    "автоматический зонд · курс задан и не меняется · связи не будет · возврат не предусмотрен");
  recordAdd("лаборатория","собран и запущен автоматический зонд");
  logAdd("tech","Зонд собран и запущен. Курс задан. Возврата нет.");
  tell("good","Зонд ушёл","ЗОНД УШЁЛ\nкурс задан\nвозврата нет");
  return true;
}
/* готовый заговорить: первый по сроку, ещё не отзвучавший */
function probeDue(){
  const now=Date.now();
  return probeAll().find(p=>!p.done&&now>=p.due)||null;
}
/* ── голос ──
   Слабеющий и один раз. Зонд не «докладывает» — он повторяет то немногое, что
   в него заложили, и это всё, что от него когда-либо услышат. */
function probeVoice(p){
  const sys=getSystem(p.tsx,p.tsy);
  const r=rng(p.seed^0x0B0E);
  const L=["…я вымпел. дошёл. вокруг "+(sys.planets.length||"ноль")+
             ", светило "+(sys.cls?sys.cls.ru:"неизвестное")+"…",
           "…я вымпел. держусь. передаю один раз…",
           "…вымпел. дальше не пойду. снимок передан…"];
  return L[Math.floor(r()*L.length)];
}
/* снимок с той стороны: место считается из семени системы, куда он летел */
function probeShot(p){
  const sys=getSystem(p.tsx,p.tsy);
  const ps=(sys.planets||[]).filter(q=>q.type!=="gas");
  const q=ps.length?ps[(p.seed>>>5)%ps.length]:(sys.planets||[])[0];
  if(!q)return null;
  const tr=(typeof genTerrain==="function")?genTerrain(q,null):null;
  const r=rng(p.seed^0x5057);
  const per=CEL_DAY*(6+((q.seed>>>7)&3));
  return {v:POST_V,m:"l",sx:p.tsx,sy:p.tsy,pi:q.idx,mi:-1,
    lon:tr?+tr.lon.toFixed(3):null,
    cx:tr?Math.round(120+r()*Math.max(240,tr.W-240)):0,
    t:Math.round(per*(30+r())),ver:VER};
}
/* Зонд отзвучал: снимок в альбом, строка в книжку, и больше о нём ничего.
   Возвращает строку голоса — её произнесёт приёмник (25e). */
function probeSpeak(p){
  if(!p||p.done)return "";
  p.done=1;
  /* отзвучавший зонд из списка убирается совсем: память о нём — строка в
     книжке и снимок в альбоме, а не запись в состоянии. Иначе за долгую игру
     в сохранении копится кладбище зондов, о которых игра больше не скажет */
  const L=probeAll(),i=L.indexOf(p);
  if(i>=0)L.splice(i,1);
  const s=probeShot(p);
  if(s&&typeof albumAll==="function"){
    const A=albumAll();
    A.unshift(s);
    while(A.length>ALBUM_MAX)A.pop();
  }
  const sys=getSystem(p.tsx,p.tsy);
  recordAdd("вымпел","дошёл до "+sys.name+" · снимок принят · связи больше нет");
  logAdd("ether","Вымпел вышел на связь один раз и замолчал. Снимок — в альбоме.");
  tell("good","Вымпел дошёл: "+sys.name,"ВЫМПЕЛ ДОШЁЛ\n"+sys.name.toUpperCase()+
       "\nснимок в альбоме");
  if(typeof tableOpenNow!=="undefined"&&tableOpenNow)tableRender();
  return probeVoice(p);
}
/* ── стойка лаборатории ──
   Одна строка, и та без обещаний: сколько ждать — не сказано нигде, потому
   что ждать не надо. */
function probeBlock(){
  if(!(G.st&&G.st.stype==="sci"))return;
  /* строка стоит на стойке всегда, как и всякая тема в лаборатории: иначе о
     вымпеле нельзя узнать, пока не накопишь на него вслепую */
  const live=probeAll().length;
  $body.appendChild(el("div","sec","ВЫМПЕЛ · АВТОМАТИЧЕСКИЙ ЗОНД"));
  const r=el("div","row","<div class='nm'><b>Собрать и запустить</b><s>"+
    PROBE_COST_DATA+" данных и "+PROBE_COST_CR+" кр · курс к звезде, до которой не долететь · "+
    "связи не будет"+(live?" · в небе: "+live:"")+"</s></div>");
  const b=el("button","act sm"+(probeCanBuild()?" gold":""),"ЗАПУСТИТЬ");
  b.disabled=!probeCanBuild();
  b.onclick=()=>{probeBuild();renderTab();};
  r.appendChild(b);$body.appendChild(r);
}
