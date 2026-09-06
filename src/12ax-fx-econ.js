/* ══════════════ семья механик: ЭКОНОМИКА (M382, §15.1) ══════════════
   Директор объявляет происшествия (12am-chron-director); здесь они становятся
   тем, что игрок чувствует кошельком. Правило то же, что у обрядов: последствие
   ВЫЧИСЛЯЕТСЯ из летописи, а не хранится, — значит оно одинаково у всех и не
   требует ни синхронизации, ни доверия.

   Четыре механики этой семьи:

   · **ценовой цикл** — у каждой державы своя волна цен длиной в тридцать сводок;
     это не событие, а фон, и он же объясняет, почему возить выгодно не всегда;
   · **жила** (`vein`) — в поясе державы на трое суток тир находок выше на один:
     туда летят все, включая пиратов;
   · **ярмарка** (`fair`) — на одной станции державы скидка и лишняя часть на
     прилавке, месяц раз;
   · **эмбарго** (`embargo`) — товары в этой державе дорожают, и это первое, что
     видно на прилавке ещё до эфира.

   Ни одно из последствий не трогает вещи игрока: они двигают ЦЕНУ и ТИР, то
   есть то, ради чего он летит, а не то, что у него уже есть. */
const ECON_CYCLE=30;              /* сводок в ценовой волне державы */
const ECON_VEIN=12;               /* трое суток жилы */
const ECON_FAIR=8;                /* два дня ярмарки */
const ECON_EMB=16;                /* четверо суток эмбарго */
/* ── ценовой цикл ──
   Целая пила из зерна: без синусов, потому что множитель обязан совпадать у
   всех до последнего знака (то же правило, что в летописи). */
function econCycleMul(by,N){
  const i=MAKER_KEYS.indexOf(by);
  if(i<0)return 1;
  N=(N===undefined)?((typeof chronNow==="function")?chronNow():0):N;
  const ph=((N+i*7)%ECON_CYCLE);
  const up=ph<ECON_CYCLE/2?ph:(ECON_CYCLE-ph);       /* 0…15 и обратно */
  return 1+(up-7)*.012;                              /* ±9 % и ни процентом больше */
}
/* ── жила в поясе ──
   «Тир +1 там на трое суток» (§15.1). Проверяется по системе: жила у державы,
   значит она в её владениях. */
function econVeinHere(sx,sy){
  if(typeof chronIncOf!=="function"||typeof chronOwner!=="function")return false;
  const inc=chronIncOf("vein",ECON_VEIN);
  if(!inc)return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p;
}
function econTierBonus(sx,sy){return econVeinHere(sx,sy)?1:0;}
/* ── ярмарка ──
   Одна станция державы держит скидку и лишнюю часть. Какая именно — решает то
   же зерно, что и всё остальное: договариваться незачем. */
function econFairHere(sys){
  if(typeof chronIncOf!=="function")return false;
  const inc=chronIncOf("fair",ECON_FAIR);
  if(!inc||!sys||!sys.station)return false;
  if(chronOwner(sys.sx,sys.sy)!==inc.p)return false;
  return (hashi(sys.sx|0,sys.sy|0,inc.N)&7)===0;      /* одна станция из восьми */
}
/* ── эмбарго ── */
function econEmbargoOn(sx,sy){
  if(typeof chronIncOf!=="function"||typeof chronOwner!=="function")return false;
  const inc=chronIncOf("embargo",ECON_EMB);
  if(!inc)return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p;
}
/* ── один множитель на прилавок ──
   Всё вместе и в ОДНОМ месте: цена берётся и на сдачу, и на взятие через общий
   множитель (`occPriceMul`), иначе на такой станции взять станет дешевле, чем
   сдать, — эту ошибку уже ловила сеть в 0.380.0. */
function econPriceMul(sx,sy){
  const by=(typeof chronOwnerKey==="function")?chronOwnerKey(sx,sy):null;
  let m=by?econCycleMul(by):1;
  if(econEmbargoOn(sx,sy))m*=1.22;
  const sys=(typeof G!=="undefined"&&G.sys&&G.sys.sx===sx&&G.sys.sy===sy)?G.sys:null;
  if(sys&&econFairHere(sys))m*=.82;
  return m;
}
/* строка для доски: что здесь с ценами и почему */
function econLine(sys){
  if(!sys)return "";
  const out=[];
  if(econFairHere(sys))out.push("ЯРМАРКА · СКИДКА И ЛИШНЯЯ ЧАСТЬ НА ПРИЛАВКЕ");
  if(econEmbargoOn(sys.sx,sys.sy))out.push("ЭМБАРГО · ТОВАРЫ ДОРОЖЕ");
  if(econVeinHere(sys.sx,sys.sy))out.push("ЖИЛА В ПОЯСЕ · НАХОДКИ КРУПНЕЕ");
  const by=(typeof chronOwnerKey==="function")?chronOwnerKey(sys.sx,sys.sy):null;
  if(by){
    const m=econCycleMul(by);
    if(m>1.04)out.push("ЦЕНЫ НА ПОДЪЁМЕ");
    else if(m<.96)out.push("ЦЕНЫ ПРОСЕЛИ");
  }
  return out.join(" · ");
}
