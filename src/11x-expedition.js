/* ══════════════ циркуляр: мир работает на экспедицию ══════════════
   M156. Второй акт. Когда Кольцо слышали не раз и хоть одна лента сдана,
   по эфиру проходит циркуляр: «Готовится экспедиция. Всем станциям — по
   плану». Шестьдесят дней весь мир работает на неё — через уже готовые
   каналы, без журнала заданий:
     ДОСКА каждой станции собирает ОДИН товар для экспедиции (сдать — по
     полуторной цене, запись в книжку);
     цены ползут: изотопы, титан, техкомпоненты вверх, руда вниз;
     баржи уходят с людьми, посёлки отдают по человеку — это слышно;
     наёмник просится «возьмите меня туда» — отпустить можно с ДОСКИ;
     попутчик: человек до такой-то станции занимает кресло и говорит по
     одной фразе за прыжок (пассажир баржи как канал — долг M131).
   Игрок не герой экспедиции. Он — один из тысячи рук.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.exp: фаза, день, что собрано, кто ушёл, попутчик.
   2. Половина эфира в эти дни — про экспедицию. Остальное — как было.
   3. Уход (M159) — отдельно; здесь только шестьдесят дней работы. */
const EXP_DAYS=60;
const EXP_GOODS=["isotopes","titan","organics","silicon","techcomp"];
function expAll(){if(!G.exp||typeof G.exp!=="object")G.exp={phase:0,day0:0,coll:{},gone:[],gave:0,pax:null};return G.exp;}
function expOn(){const E=G.exp;return !!(E&&E.phase===1);}
function expDay(){const E=expAll();return E.phase?celDay()-E.day0:0;}
/* условие: Кольцо слышали дважды и сдана лента */
function expReady(){
  const R=(typeof ringAll==="function")?ringAll():null;
  return !!(R&&R.heard>=2&&R.tapes.some(t=>t.handed));
}
function expStart(){
  const E=expAll();if(E.phase)return false;
  E.phase=1;E.day0=celDay();E.coll={};E.gone=[];E.gave=0;
  etherLine("ЦИРКУЛЯР. Готовится экспедиция за край. Всем станциям — по плану. Повторяю: всем станциям.");
  if(typeof consoleHeard==="function")consoleHeard("ЦИРКУЛЯР · готовится экспедиция · всем станциям — по плану");
  thingAdd("paper","Циркуляр","«готовится экспедиция за край. всем станциям — по плану» · шестьдесят дней · что нужно — на доске каждой станции");
  logAdd("warn","Циркуляр: готовится экспедиция. Мир работает на неё шестьдесят дней.");
  sfx("ui",{f:330,to:330,d:.6,v:.3});
  return true;
}
function expDayTick(){
  const E=expAll();
  const d=celDay();
  if(E.lastDay===d)return;E.lastDay=d;
  if(!E.phase){if(expReady())expStart();return;}
  if(E.phase!==1)return;
  const r=rng(hashi(d,E.day0,0xE8D));
  /* посёлки и баржи отдают людей — это слышно, и это считается */
  if(r()<.5){
    E.gave++;
    const S=expNearStation(r);
    if(S)etherLine(pick(["…баржа от "+S.station.name+" ушла с людьми. Трое. По плану.",
                         "…"+S.station.name+": посёлок отдал одного. Окно в третьем доме тёмное.",
                         "…с "+S.station.name+" сняли смену. Вся смена — туда."],r));
  }
  /* наёмник просится */
  const free=(G.crew||[]).filter(c=>!c.askExp&&(!c.order||c.order.kind==="home"));
  if(free.length&&r()<.25){const c=pick(free,r);c.askExp=1;peopleLine("возьмите меня туда. Я серьёзно. Отпустите — не пожалею.",c.name,true);}
}
function expNearStation(r){
  for(let i=0;i<20;i++){
    const x=G.sx+Math.round((r()-.5)*12),y=G.sy+Math.round((r()-.5)*12);
    if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station)return S;
  }
  return null;
}
/* что собирает эта станция: один товар на станцию, на весь срок */
function expDemandOf(sys){
  if(!expOn()||!sys||!sys.station)return null;
  const r=rng(hashi(sys.sx,sys.sy,0xE0D+expAll().day0));
  const k=EXP_GOODS[Math.floor(r()*EXP_GOODS.length)];
  return {k,ru:RES[k].ru.toLowerCase(),price:Math.round((RES[k].price||60)*1.5)};
}
function expGive(sys,qty){
  const D=expDemandOf(sys);if(!D)return 0;
  qty=Math.min(qty,G.cargo[D.k]|0);if(qty<=0)return 0;
  G.cargo[D.k]-=qty;
  const E=expAll();E.coll[D.k]=(E.coll[D.k]|0)+qty;
  earn(qty*D.price,"exp");
  tell("money","Сдано для экспедиции: "+D.ru+" ×"+qty+" · "+(qty*D.price)+" кр","ДЛЯ ЭКСПЕДИЦИИ\n"+D.ru+" ×"+qty);
  if(typeof repAdd==="function")repAdd(1,sys);
  if(typeof recordAdd==="function")recordAdd(sys.station.name,"сдано для экспедиции: "+D.ru+" ×"+qty);
  return qty;
}
/* цены: экспедиция тянет одно и толкает другое */
function expPriceMul(k){
  if(!expOn())return 1;
  if(EXP_GOODS.indexOf(k)>=0)return 1.25;
  if(k==="iron"||k==="ice")return .85;
  return 1;
}
/* эфир: половина строк — про экспедицию */
function expEtherLine(r){
  if(!expOn()||r()>.5)return null;
  return pick(["…всем, кто слышит: картриджи, изотопы, люди. По плану. Не спрашивайте, куда.",
               "…говорят, идут туда, где числа не сходятся. Говорят. Я не говорил.",
               "…стойка просит: кто везёт титан — сюда. Экспедиция. Вы поняли.",
               "…борт без позывного прошёл к ядру. Третий за ночь. Все — туда.",
               "…у нас тут один записался. Жена не знает. Передайте ей, что ли, кто-нибудь.",
               "…план на неделю: экспедиция. План на месяц: экспедиция. Дальше планов нет."],r);
}
/* отпустить наёмника: он уходит, остальным — подъём */
function expRelease(c){
  const E=expAll();
  const i=G.crew.indexOf(c);if(i<0)return false;
  G.crew.splice(i,1);E.gone.push(c.name);
  for(const o of G.crew)o.morale=Math.min(1,(o.morale===undefined?1:o.morale)+.1);
  peopleLine("спасибо. Я напишу. Наверное.",c.name,true);
  logAdd("good",c.name+" ушёл с экспедицией. Остальные подтянулись.");
  if(typeof recordAdd==="function")recordAdd(c.name,"отпущен с экспедицией");
  return true;
}
/* попутчик: до станции в радиусе, одна фраза за прыжок */
const EXP_PAX_LINES=["Я первый раз так далеко.","У меня там сестра. Была.","Вы не спрашивайте, зачем я. Я сам не знаю.",
  "Красиво. Я думал, будет страшно.","Мне сказали: сорок дней. Я взял на пятьдесят.","Спасибо, что взяли. Я молчу, молчу."];
function expPaxOffer(sys){
  if(!expOn()||!sys||!sys.station||G.seat)return null;
  const E=expAll();if(E.pax)return null;
  const r=rng(hashi(sys.sx,sys.sy,0x9A7+celDay()));
  if(r()>.5)return null;
  let to=null;
  for(let i=0;i<20&&!to;i++){const x=sys.sx+Math.round((r()-.5)*10),y=sys.sy+Math.round((r()-.5)*10);
    if(Math.max(Math.abs(x-sys.sx),Math.abs(y-sys.sy))<2||!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station)to=S;}
  if(!to)return null;
  return {name:genName(r),to:{sx:to.sx,sy:to.sy,name:to.station.name},said:0};
}
function expPaxTake(sys){
  const P=expPaxOffer(sys);if(!P)return false;
  expAll().pax=P;
  G.seat={name:P.name.toUpperCase(),line:"до "+P.to.name,draw:expPaxDraw,act:()=>{peopleLine(pick(EXP_PAX_LINES,rng(hashi(P.said++,1,0x9AF))),P.name,true);}};
  peopleLine("до "+P.to.name+", если по пути. Я тихо.",P.name,true);
  return true;
}
function expPaxJump(){
  const P=expAll().pax;if(!P)return;
  peopleLine(EXP_PAX_LINES[P.said++%EXP_PAX_LINES.length],P.name,true);
  if(G.seat)G.seat.line="до "+P.to.name;
}
function expPaxDock(){
  const P=expAll().pax;if(!P||!G.sys)return;
  if(G.sys.sx===P.to.sx&&G.sys.sy===P.to.sy){
    peopleLine("спасибо. Дальше сам.",P.name,true);
    if(typeof repAdd==="function")repAdd(1,G.sys);
    if(typeof recordAdd==="function")recordAdd(P.to.name,"довезён человек: "+P.name);
    expAll().pax=null;if(G.seat&&G.seat.name===P.name.toUpperCase())G.seat=null;
  }
}
function expPaxDraw(c,W,H){
  c.save();c.translate(W/2,H);const s=Math.min(W,H)/56;c.scale(s,s);
  c.fillStyle="#4a5a66";c.beginPath();c.roundRect(-11,-30,22,28,5);c.fill();
  c.fillStyle="#d9b894";c.beginPath();c.arc(0,-38,8,0,7);c.fill();
  c.fillStyle="#2a2a2a";c.fillRect(-8,-48,16,5);
  c.restore();
}
/* доска: собираем, отпустить, попутчик */
function expBlock(){
  if(!expOn()||!G.sys||!G.sys.station)return;
  const E=expAll(),D=expDemandOf(G.sys);
  $body.appendChild(el("div","sec","ЭКСПЕДИЦИЯ · ДЕНЬ "+expDay()+" ИЗ "+EXP_DAYS+" · ПО ПЛАНУ"));
  if(D){
    const have=G.cargo[D.k]|0;
    const r=el("div","row","<div class='nm'><b>Собираем: "+D.ru+"</b><s>берут по "+D.price+" кр · в трюме "+have+" · всего сдано отсюда и везде: "+(E.coll[D.k]|0)+"</s></div>");
    const b=el("button","act sm gold","СДАТЬ "+Math.min(have,20));b.disabled=have<=0;
    b.onclick=()=>{expGive(G.sys,Math.min(have,20));renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  for(const c of (G.crew||[]).filter(c=>c.askExp)){
    const r=el("div","row","<div class='nm'><b>"+c.name+" просится туда</b><s>отпустить — он уйдёт с экспедицией; остальные подтянутся</s></div>");
    const b=el("button","act sm","ОТПУСТИТЬ");b.onclick=()=>{expRelease(c);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  const P=expPaxOffer(G.sys);
  if(P){
    const r=el("div","row","<div class='nm'><b>Попутчик · "+P.name+"</b><s>до "+P.to.name+" · сектор "+P.to.sx+":"+P.to.sy+" · займёт кресло, по фразе за прыжок</s></div>");
    const b=el("button","act sm","ВЗЯТЬ");b.onclick=()=>{expPaxTake(G.sys);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  if(E.gone.length)$body.appendChild(el("div","row","<div class='nm'><s>ушли с экспедицией: "+E.gone.join(", ")+"</s></div>"));
}
/* ══════════════ уход (M159) ══════════════
   На шестидесятый день эфир замолкает на минуту — ни музыки, ни строк, —
   потом одна строка: «Ушли». Табло прибытий получает строку БЕЗ ИМЕНИ.
   Если вы в эти дни на стойке ядра уезда — один раз предлагают место. Уйти —
   концовка: журнал закрывается на этой строке, запись помечена, на заставке —
   безымянная строка табло. Не уйти — игра продолжается.
   Не возвращаются. Через год (365 суток) на стол дома приходит лента без
   подписи; на столе она рисует фигуру невязки — полностью. Больше ничего. */
const EXP_QUIET=3600;
function expQuiet(){const E=G.exp;return !!(E&&E.quietUntil&&G.t<E.quietUntil);}
function expDeparted(){const E=G.exp;return !!(E&&E.phase>=2);}
function expDepartTick(){
  const E=expAll();
  if(E.phase===1&&expDay()>=EXP_DAYS){
    E.phase=2;E.depDay=celDay();E.quietUntil=G.t+EXP_QUIET;E.said=0;
    say("…",EXP_QUIET);
    logAdd("warn","Эфир замолчал.");
    return;
  }
  if(E.phase===2&&!E.said&&E.quietUntil&&G.t>=E.quietUntil){
    E.said=1;
    etherLine("Ушли.");
    if(typeof consoleHeard==="function")consoleHeard("Ушли.");
    logAdd("warn","Табло прибытий: строка без имени.");
    thingAdd("paper","Строка без имени","табло прибытий · « — · ушли · не ждут» · день "+E.depDay);
    if(typeof recordAdd==="function")recordAdd("табло","строка без имени · день "+E.depDay);
  }
  /* лента через год */
  if(E.phase===2&&!E.tapeBack&&E.depDay!=null&&celDay()-E.depDay>=365){
    E.tapeBack=1;
    thingAdd("tape","Лента без подписи","пришла на стол дома · без имени, без сектора · на ней — вся фигура",{fig:1,full:1,ring:0});
    logAdd("warn","На столе дома — лента без подписи.");
  }
}
/* предложение: один раз, на стойке ядра уезда, в день ухода и назавтра */
function expOfferHere(){
  const E=G.exp;if(!E||E.phase!==2||E.offered||E.ended)return false;
  if(!G.sys||!G.st||typeof hoursDepthAt!=="function"||hoursDepthAt(G.sx,G.sy)!==2)return false;
  return celDay()-E.depDay<=1;
}
function expEnd(){
  const E=expAll();if(E.ended)return false;
  E.ended=1;E.offered=1;
  logAdd("warn","Есть место. Вы сели.");
  peopleLine("есть место. Садитесь. Журнал оставьте — его допишут.","стойка ядра",true);
  if(typeof recordAdd==="function")recordAdd("стойка ядра","убыл с экспедицией · запись последняя");
  thingAdd("paper","Последняя запись","«убыл с экспедицией» · журнал закрыт на этой строке");
  const v=document.getElementById("ver");if(v)v.textContent+=" · — · ушли · не ждут";
  if(typeof saveGame==="function")saveGame(true);
  say("ЕСТЬ МЕСТО\nвы сели\n\n — · ушли · не ждут",600);
  G.exp.quietUntil=G.t+EXP_QUIET*2;
  return true;
}
function expOfferBlock(){
  if(!expOfferHere())return;
  $body.appendChild(el("div","sec","ЕСТЬ МЕСТО"));
  const r=el("div","row","<div class='nm'><b>Одно место. Предлагают один раз.</b><s>уйти — журнал закроется на этой строке · остаться — всё продолжится</s></div>");
  const b=el("button","act sm gold","УЙТИ С НИМИ");b.onclick=()=>{expEnd();renderTab();};
  const b2=el("button","act sm","ОСТАТЬСЯ");b2.onclick=()=>{G.exp.offered=1;peopleLine("как знаете. Место займут.","стойка ядра",true);renderTab();};
  r.appendChild(b);r.appendChild(b2);$body.appendChild(r);
}
