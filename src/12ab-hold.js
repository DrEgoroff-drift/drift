/* ══════════════ холдинг · часы слоя и «БЕРЁТ» ══════════════
   M290, шаг 2 плана DESIGN-holding (§0, §4). Всё, что игрок мог сделать с
   ценой, упиралось в ноль сверху (12-economy: clamp давления [-.35, 0]);
   вверх её двигала только новость. Здесь появляется первая причина цене
   расти от ДЕЛ игрока — аппетит станции.

   ЧАСЫ. У слоя одна единица — СМЕНА, HOLD_SHIFT в реальных миллисекундах.
   CEL_DAY — минута игры и тикает только в открытой вкладке; Date.now() идёт
   всегда. Ничего не тикает: кто спрашивает, тот и досчитывает лениво от
   сохранённой отметки. Так же живут дроны и наёмники.

   АППЕТИТ. Станция по своему типу ЕСТ несколько товаров: первые N единиц
   в смену берёт с надбавкой +35%, дальше — обычная цена и обычное давление
   вниз. Надбавка — слагаемое в том же clamp, что и давление
   (clamp(1 + pressure + add, .4, 1.8)), а не множитель поверх нужды и
   монополии: 12c-mgr-core:626 запрещает перемножать, и потолок 1.8 стоит.
   Постройки игрока (шаг 3) добавят свои нормы в тот же объект — по обычной
   цене, но с паем: единица оплачивается один раз (развилка 1б).

   ХРАНИТСЯ только своё: G.hold["sx,sy"].ate[k] = [сколько сдано, номер смены].
   Аппетит — расчёт от типа станции, его в сохранении нет. Одна карта на весь
   слой (§16.10), через asMap при загрузке (M287). */
const HOLD_SHIFT=20*60*1000;      /* смена: 20 минут реального времени — одну заправку видно за визит */
const APPETITE_ADD=.35;           /* надбавка на первые N единиц в смену */
/* что ест станция по типу — только то, что у неё вообще есть в прейскуранте */
const APPETITE={
  trade:  {organics:6,ice:8},
  indust: {iron:10,silicon:6,titan:4},
  yard:   {titan:6,iridium:2},
  sci:    {crystal:3,isotopes:4},
  outpost:{ice:6,organics:4},
  bazaar: {silicon:4}
};
function holdShift(t){return Math.floor((t===undefined?Date.now():t)/HOLD_SHIFT);}
function holdAll(){return G.hold||(G.hold={});}
function holdOf(key){const H=holdAll();return H[key]||(H[key]={});}
/* нормы аппетита станции: {k:n} или null */
function appetiteOf(sys){
  if(!sys||!sys.station||!sys.station.prices)return null;
  const A=APPETITE[sys.station.stype];if(!A)return null;
  const out={};
  for(const k in A)if(sys.station.prices[k]&&TRADE_KEYS.indexOf(k)>=0)out[k]=A[k];
  return Object.keys(out).length?out:null;
}
/* сдано в аппетит за ТЕКУЩУЮ смену; чужая смена — ноль, запись просто устарела */
function appetiteAte(sys,k){
  const h=G.hold&&G.hold[sys.key];
  const a=h&&h.ate&&h.ate[k];
  return (Array.isArray(a)&&a[1]===holdShift())?(a[0]|0):0;
}
function appetiteLeft(sys,k){
  const A=appetiteOf(sys);
  if(!A||!A[k])return 0;
  return Math.max(0,A[k]-appetiteAte(sys,k));
}
/* съесть: сколько из qty пойдёт с надбавкой — и запомнить это */
function appetiteEat(sys,k,qty){
  const left=appetiteLeft(sys,k);
  if(left<=0||qty<=0)return 0;
  const n=Math.min(left,qty|0);
  const h=holdOf(sys.key);h.ate=h.ate||{};
  h.ate[k]=[appetiteAte(sys,k)+n,holdShift()];
  return n;
}
/* цена с надбавкой: тот же marketPrice, слагаемое внутри clamp */
function appetitePrice(sys,k){return marketPrice(sys,k,APPETITE_ADD);}
/* ── ОДИН объект спроса ──
   Нужда (12aa) — норма на один привоз со сроком; аппетит — норма на смену без
   срока; постройка (шаг 3) — норма на смену с паем. Доска, эфир и ряд трюма
   читают этот список, а не пять механик по отдельности. */
function normsOf(sys){
  const out=[];
  if(!sys||!sys.station||!sys.station.prices)return out;
  const N=(typeof needOf==="function")?needOf(sys):null;
  if(N)out.push({k:N.k,n:1,add:NEED_MUL-1,source:"need",left:1});
  const A=appetiteOf(sys);
  if(A)for(const k in A)out.push({k,n:A[k],add:APPETITE_ADD,source:"station",left:appetiteLeft(sys,k),ate:appetiteAte(sys,k)});
  return out;
}
/* ── котировка продажи: сколько дадут за qty здесь, ПРЯМО СЕЙЧАС ──
   Первые left единиц — с надбавкой, остальные — по обычной. Не съедает ничего:
   ряд трюма и кнопка показывают одно и то же число, а sellCargo его берёт. */
function sellQuote(sys,k,qty){
  qty=Math.max(0,qty|0);
  const base=marketFor(sys)[k]||0;
  const nA=Math.min(qty,appetiteLeft(sys,k));
  const pA=nA?appetitePrice(sys,k):base;
  return{revenue:nA*pA+(qty-nA)*base,nA,priceA:pA,base};
}
/* ── строка «БЕРЁТ» для доски, эфира и ряда трюма ── */
function appetiteLine(sys,k){
  const A=appetiteOf(sys);
  if(!A||!A[k])return"";
  const ate=appetiteAte(sys,k),left=A[k]-ate;
  return"БЕРЁТ "+RES[k].ru.toLowerCase()+" · "+A[k]+" в смену · +"+Math.round(APPETITE_ADD*100)+"%"+
    (ate?" · сдано "+ate:"")+(left<=0?" · на эту смену взяли":"");
}
/* ДОСКА: что станция берёт с надбавкой, и что из этого уже сдано */
function appetiteBlock(){
  if(!G.sys||!G.sys.station)return;
  const A=appetiteOf(G.sys);
  if(!A)return;
  $body.appendChild(el("div","sec","БЕРЁТ · ПЕРВЫЕ ЕДИНИЦЫ В СМЕНУ — С НАДБАВКОЙ"));
  for(const k in A){
    const ate=appetiteAte(G.sys,k),left=A[k]-ate,have=G.cargo[k]|0;
    $body.appendChild(el("div","row","<div class='nm'><b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+
      (left>0?"ещё "+left+" из "+A[k]+" по "+appetitePrice(G.sys,k)+" кр":"на эту смену взяли всё · через смену снова")+
      " · обычная "+marketFor(G.sys)[k]+" кр"+(have?" · в трюме "+have:"")+"</s></div>"));
  }
}
/* эфир (11b): раз из нескольких — о том, кто берёт с надбавкой поблизости */
function appetiteEtherLine(r){
  if(r()>.25)return null;
  const rad=6,L=[];
  for(let x=G.sx-rad;x<=G.sx+rad;x++)for(let y=G.sy-rad;y<=G.sy+rad;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);if(!S||!S.station)continue;
    const A=appetiteOf(S);if(!A)continue;
    for(const k in A)if(appetiteLeft(S,k)>0)L.push({S,k,n:A[k]});
  }
  if(!L.length)return null;
  const a=L[Math.floor(r()*L.length)],ru=RES[a.k].ru.toLowerCase();
  return pick(["…"+a.S.station.name+" берёт "+ru+" с надбавкой. Первые "+a.n+" — по-хорошему, дальше как всем.",
               "…кто везёт "+ru+" — на "+a.S.station.name+" за него доплачивают. Немного, но каждую смену.",
               "…"+a.S.station.name+": "+ru+" принимают с надбавкой, пока смена не выбрана."],r);
}
