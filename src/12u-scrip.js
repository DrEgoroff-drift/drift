/* ══════════════ боны домов: ставка на чужую судьбу ══════════════
   Самая опасная вещь этого прохода, поэтому она начинается с ограничителей, а
   не с возможностей.

   Бон — НЕ второй кошелёк. Это расписка торгового дома, обязательство его
   станций: купить и продать её можно только там, где этот дом хозяин, и она
   ничего не даёт, кроме курса. Держать бон — значит поставить на то, что дому
   повезёт.

   ПРАВИЛА, которые легко сломать:
   1. Курс двигают ТОЛЬКО настоящие происшествия — те, что мир и так разыграл
      (12p-news) или что сделал сам игрок. Ни случайного блуждания, ни дрейфа,
      ни «времени». Если курс можно предсказать по шуму, это бесплатные деньги,
      а бесплатные деньги убивают тот рынок, который в игре уже есть.
   2. У каждого движения записана причина (`G.scripLog`), и она показывается
      игроку. Движение без причины — ошибка, а не мелочь.
   3. Спред в обе стороны и потолок обмена за один заход делают круговой рейс
      убыточным. Заработок здесь один: знать раньше других — а игрок знает,
      потому что большинство этих событий устраивает он сам.
   4. Кошелёк не уходит в минус, боны не уходят в минус. */
const HOUSES=[
  {id:"lask", ru:"«Ласковый»",  col:"#e0d28a", note:"снабжение дальних плеч"},
  {id:"kova", ru:"«Ковш»",      col:"#7fe6d8", note:"руда и переплавка"},
  {id:"vest", ru:"«Вестовой»",  col:"#9fd8ff", note:"почта, курьеры, данные"},
  {id:"kryl", ru:"«Крыло»",     col:"#ff9d7a", note:"верфи и наёмный конвой"}
];
const HOUSE_BY_ID={};for(const H of HOUSES)HOUSE_BY_ID[H.id]=H;
const SCRIP_BASE=100;            // с чего начинают все дома
const SCRIP_MIN=55,SCRIP_MAX=170;
const SCRIP_SPREAD=.06;          // в обе стороны: круговой рейс без события — минус 12%
const SCRIP_VISIT=40;            // потолок обмена за один заход на станцию
const SCRIP_LOG=14;
/* чей это дом: детерминированно от seed системы, отдельным потоком (правило 2 —
   новые вызовы генератора не должны сдвигать уже разыгранное) */
function houseOf(sys){
  const s=sys||G.sys;
  if(!s||!s.station)return null;
  return HOUSES[Math.abs(hashi(s.seed,0x5C81,11))%HOUSES.length];
}
function scripRate(id){
  const R=G.scripRate||(G.scripRate={});
  if(R[id]==null)R[id]=SCRIP_BASE;
  return R[id];
}
function scripHeld(id){return (G.scrip&&G.scrip[id])|0;}
function scripBuyPrice(id){return Math.max(1,Math.round(scripRate(id)*(1+SCRIP_SPREAD)));}
function scripSellPrice(id){return Math.max(1,Math.round(scripRate(id)*(1-SCRIP_SPREAD)));}
/* единственная дверь, через которую курс вообще меняется: без причины сюда не
   входят, и причина уезжает в журнал вместе с движением */
function scripMove(id,d,why){
  if(!HOUSE_BY_ID[id]||!d||!why)return 0;
  const was=scripRate(id);
  const now=clamp(Math.round(was+d),SCRIP_MIN,SCRIP_MAX);
  G.scripRate[id]=now;
  if(now===was)return 0;
  const L=G.scripLog||(G.scripLog=[]);
  L.push({id,d:now-was,why,t:Date.now()});
  while(L.length>SCRIP_LOG)L.shift();
  return now-was;
}
/* ── происшествия, которые двигают курс ──
   Вызываются из тех мест, где перемена УЖЕ случилась: слухи мира (12p-news) и
   поступки игрока. Здесь не разыгрывается ничего своего. */
function scripOnNews(kind,sys){
  const H=houseOf(sys);
  if(!H)return;
  const nm="«"+(sys&&sys.station?sys.station.name:"станция")+"»";
  if(kind==="owner"){
    /* станция сменила хозяина: этот дом её потерял, а достаётся она соседу —
       выбор соседа тоже детерминирован, чтобы слух и курс не разошлись */
    scripMove(H.id,-7-Math.abs(hashi(sys.seed,3,3))%5,"станцию "+nm+" забрали у дома");
    const other=HOUSES[Math.abs(hashi(sys.seed,0x0FF,5))%HOUSES.length];
    if(other.id!==H.id)scripMove(other.id,4,"к дому отошла станция "+nm);
  }
  else if(kind==="barge")scripMove(H.id,-4,"баржа не дошла до "+nm);
  else if(kind==="captain")scripMove(H.id,3,"в секторе "+sys.sx+","+sys.sy+" стало тише");
  else if(kind==="squeeze")scripMove(H.id,2,"склады "+nm+" опустели, цены пошли вверх");
}
/* поступки игрока: посёлок дорос до третьей ступени и стал точкой на карте
   фактора (M109) — дом, чьи станции рядом, от этого выигрывает */
function scripOnSettle(sx,sy){
  const s=getSystem(sx,sy);
  const H=houseOf(s)||houseOf(nearestStation(sx,sy));
  if(H)scripMove(H.id,6,"посёлок в секторе "+sx+","+sy+" начал торговать");
}
/* система освобождена от занятия: чужой порядок ушёл, дом вернулся к работе */
function scripOnFreed(sx,sy){
  const H=houseOf(getSystem(sx,sy));
  if(H)scripMove(H.id,5,"сектор "+sx+","+sy+" освобождён");
}
/* ── обмен ──
   Только на станции этого дома, только в пределах захода, только на то, что
   есть в кошельке. */
let scripVisit=0;                  // обменено за этот заход; в сохранение не идёт
function scripVisitReset(){scripVisit=0;}
function scripLeft(){return Math.max(0,SCRIP_VISIT-scripVisit);}
function scripDone(n){scripVisit+=n;}
function scripBuy(n){
  const H=houseOf();if(!H)return 0;
  n=Math.min(n|0,scripLeft());
  const p=scripBuyPrice(H.id);
  n=Math.min(n,Math.floor(G.credits/p));
  if(n<=0)return 0;
  G.credits-=n*p;
  if(!G.scrip)G.scrip={};
  G.scrip[H.id]=scripHeld(H.id)+n;
  scripDone(n);
  logAdd("money","Куплено бон "+H.ru+" ×"+n+" по "+p+" кр");
  return n;
}
function scripSell(n){
  const H=houseOf();if(!H)return 0;
  n=Math.min(n|0,scripLeft(),scripHeld(H.id));
  if(n<=0)return 0;
  const p=scripSellPrice(H.id);
  G.scrip[H.id]=scripHeld(H.id)-n;
  earn(n*p,"scrip");
  scripDone(n);
  logAdd("money","Продано бон "+H.ru+" ×"+n+" по "+p+" кр");
  return n;
}
/* ── вкладка на станции ──
   Живёт здесь, рядом со своей механикой: экран станции (26-ui-station) и так
   просится на распил. */
function scripRender(){
  const H=houseOf();
  if(!H){$body.appendChild(el("div","sec","ЗДЕСЬ НЕТ ХОЗЯИНА"));return;}
  $body.appendChild(el("div","sec","ХОЗЯИН СТАНЦИИ · "+H.ru.toUpperCase()+" · "+H.note.toUpperCase()));
  const rate=scripRate(H.id);
  $body.appendChild(el("div","row","<div class='nm'><b>Курс "+rate+" кр за бон</b><s>"+
    "покупка "+scripBuyPrice(H.id)+" · продажа "+scripSellPrice(H.id)+
    " · у вас "+scripHeld(H.id)+" бон · за заход осталось "+scripLeft()+
    "<br>бон — расписка этого дома, а не деньги: берут её только на его станциях</s></div>"));
  const row=el("div","row");
  for(const n of [1,10,SCRIP_VISIT]){
    const b=el("button","act","КУПИТЬ "+n);
    b.disabled=scripLeft()<=0||G.credits<scripBuyPrice(H.id);
    b.onclick=()=>{scripBuy(n);renderTab();};
    row.appendChild(b);
  }
  for(const n of [10,SCRIP_VISIT]){
    const b=el("button","act gold","ПРОДАТЬ "+n);
    b.disabled=scripLeft()<=0||scripHeld(H.id)<=0;
    b.onclick=()=>{scripSell(n);renderTab();};
    row.appendChild(b);
  }
  $body.appendChild(row);
  /* чужие дома: видно, где что стоит, но обменять — только у себя дома */
  $body.appendChild(el("div","sec","ОСТАЛЬНЫЕ ДОМА · ОБМЕН ТОЛЬКО НА ИХ СТАНЦИЯХ"));
  for(const O of HOUSES){
    if(O.id===H.id)continue;
    $body.appendChild(el("div","row","<div class='nm'><b>"+O.ru+" · "+scripRate(O.id)+" кр</b><s>"+
      O.note+" · у вас "+scripHeld(O.id)+" бон</s></div>"));
  }
  /* почему курс такой: без этой колонки боны стали бы рулеткой */
  const L=(G.scripLog||[]).slice(-6).reverse();
  $body.appendChild(el("div","sec","ОТЧЕГО ДВИГАЛСЯ КУРС · СЛУЧАЙНО ОН НЕ ДВИГАЕТСЯ"));
  if(!L.length)$body.appendChild(el("div","row","<div class='nm'><s>пока ничего не случилось</s></div>"));
  for(const e of L){
    const mins=Math.max(1,Math.round((Date.now()-e.t)/60000));
    const Ho=HOUSE_BY_ID[e.id];
    $body.appendChild(el("div","row","<div class='nm'><b>"+(Ho?Ho.ru:e.id)+" "+
      (e.d>0?"+":"")+e.d+"</b><s>"+e.why+" · "+mins+" мин назад</s></div>"));
  }
}
