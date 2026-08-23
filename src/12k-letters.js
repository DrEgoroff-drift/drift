/* ══════════════ последний рейс: Жестянка закрывается, письма с содержанием ══════════════
   M158. Жестянка (12ta) — откуда все улетели и куда все хотят вернуться. Во
   второй акт она ЗАКРЫВАЕТСЯ: её люди — ядро экспедиции. На сороковой день
   циркуляра эфир объявляет «последний рейс» с числом; после этого дня её
   слот в плане тёмный, железо молчит, а у истории Жестянки (M147) — последний
   след. Каждая область шлёт на Жестянку по человеку: попутчик (11x) в эти дни
   едет туда.

   ПИСЬМА С СОДЕРЖАНИЕМ. У почтового круга (11e) были конверты, не письма.
   Здесь — десять писем: игрок берёт у стойки, везёт и НЕ ЧИТАЕТ; адресат
   читает вслух при нём — один абзац, в ключе институтской прозы и речи
   посёлка. Три письма — людям на Жестянке; опоздал — письмо остаётся в
   трюме со строкой «адресат выбыл».

   ПРАВИЛА ФАЙЛА:
   1. Письмо — вещь на столе (конверт), читается только у адресата.
   2. Хранится G.letters: {id, taken, done, late}. Тексты — здесь. */
const LETTERS=[
  {id:"l1", from:"Стойка Цициина",      to:{kind:"stype",v:"sci"},     who:"дежурный по явлению",
   text:"Товарищ дежурный. Пишу, потому что по эфиру такое не скажешь. Лента, которую вы сдали в прошлом году, сошлась с нашей. Не спрашивайте, как. Мы не знаем. Я хотел, чтобы вы знали, что вы не один её видели. Стойка."},
  {id:"l2", from:"посёлок",             to:{kind:"tin"},               who:"механик смены",
   text:"Дядя Паша. Окно в третьем доме мы погасили, как ты велел. Мать говорит, ты не вернёшься, а я говорю — вернёшься, потому что кто ещё знает, как завести ту машину. Напиши. Или не пиши, но заведи."},
  {id:"l3", from:"Ада Львовна",         to:{kind:"stype",v:"trade"},   who:"Совеня",
   text:"Совеня. Книгу, которую вы просили, я не нашла — её сдали в институт вместе со всем остальным. Зато нашла вашу записку в ней. «Сходится». Вы это писали в семнадцать лет. Сходилось уже тогда. А. Л."},
  {id:"l4", from:"Пекарь",              to:{kind:"stype",v:"indust"},  who:"Мадам Крапива",
   text:"Крапива. Дверцу сдал. Ты была права, она не моя. Лети, раз уж полетела. Я испеку, когда вернёшься. Я не пёк никогда, но испеку. П."},
  {id:"l5", from:"Долгий Ким",          to:{kind:"tin"},               who:"Штоф",
   text:"Штоф. Долг закрыт. Не мной — чемоданом, но закрыт. Ты вёл счёт двадцать лет; теперь его ведёт автомат, и он сходится всегда, и это хуже. Если ты на Жестянке — не садись на последний. Сядь на предпоследний. Ким."},
  {id:"l6", from:"Семён Палыч",         to:{kind:"stype",v:"outpost"}, who:"диспетчер площадки",
   text:"Диспетчер. Лампа на площадке горит одна, как вы и писали. Я на неё шёл. Я дошёл. Передайте тем, кто пойдёт после: одной хватает. С. П."},
  {id:"l7", from:"хронометрист В.",     to:{kind:"tin"},               who:"смотритель реактора",
   text:"Смотритель. Часы на стойке я завела. Хватит на год. Когда встанут — не заводите. Пусть стоят: по стоящим часам виднее, сколько прошло. Расхождение не устранено. Я убываю. В."},
  {id:"l8", from:"Гедеван",             to:{kind:"stype",v:"yard"},    who:"мастер верфи",
   text:"Мастер. Зеркало поставил, как договаривались: смотрит на ядро. Если что-то отразится — не докладывай. Просто запомни. Г."},
  {id:"l9", from:"Вега",                to:{kind:"stype",v:"bazaar"},  who:"дед с лотка",
   text:"Деду с лотка. Прибор ваш сработал. Не тот, что второй, а первый. Спасибо. Не продавайте больше никому. Или продавайте — но только тем, кто нажмёт. Вега."},
  {id:"l10",from:"комиссия",            to:{kind:"stype",v:"sci"},     who:"дежурный по явлению",
   text:"Дежурному. Ваш отчёт рассмотрен. Замечаний нет. Явление не подтверждено. Явление не опровергнуто. Продолжайте наблюдение. Комиссия."}
];
const LAST_RUN_DAY=40;
function lettersAll(){if(!G.letters||typeof G.letters!=="object")G.letters={};return G.letters;}
function letterState(id){const L=lettersAll();return L[id]||(L[id]={taken:0,done:0,late:0});}
/* последний рейс: день, с которого Жестянка закрыта */
function lastRunDay(){const E=(typeof expAll==="function")?expAll():null;return E&&E.phase?E.day0+LAST_RUN_DAY:null;}
function tinClosed(){const d=lastRunDay();return d!=null&&celDay()>d;}
function lastRunTick(){
  const E=(typeof expAll==="function")?expAll():null;if(!E||!E.phase)return;
  const d=lastRunDay();
  if(!E.lastRunSaid&&celDay()>=d-3){
    E.lastRunSaid=1;
    etherLine("…всем: Жестянка закрывается. Последний рейс — "+d+"-го. Кто хотел — пора. Повторяю: "+d+"-го.");
    thingAdd("paper","Последний рейс","«Жестянка закрывается. последний рейс — "+d+"-го» · три письма — туда");
    logAdd("warn","Последний рейс на Жестянку — "+d+"-го дня. После — закрыта.");
  }
  if(!E.tinClosedSaid&&tinClosed()){
    E.tinClosedSaid=1;
    etherLine("…Жестянка: рейсов нет. Слот в плане снят. Железо встало. Всё.");
    logAdd("warn","Жестянка закрыта. Слот в плане тёмный.");
    if(typeof recordAdd==="function")recordAdd("план","Жестянка закрыта · вы "+(lettersAll().l2&&lettersAll().l2.done?"успели":"не успели")+" с письмами");
  }
}
/* взять у стойки: одно письмо на станцию в окно, только во второй акт */
function letterOfferHere(){
  const E=(typeof expAll==="function")?expAll():null;if(!E||!E.phase||!G.sys||!G.sys.station)return null;
  const r=rng(hashi(G.sys.sx,G.sys.sy,0x1E77+Math.floor(celDay()/3)));
  const L=LETTERS.filter(l=>!letterState(l.id).taken);
  if(!L.length||r()>.7)return null;
  return L[Math.floor(r()*L.length)];
}
function letterTake(l){
  const S=letterState(l.id);if(S.taken)return false;
  S.taken=1;
  thingAdd("letter","Письмо · "+l.from+" → "+l.who,"конверт · не читать · адресат: "+(l.to.kind==="tin"?"Жестянка":"станция типа «"+stTypeOf(l.to.v).ru+"»"),{letter:l.id});
  peopleLine("отвезёте? Не читайте. Там ничего такого, но не читайте.",G.st?G.st.name:"Стойка",true);
  return true;
}
/* адресат здесь? */
function letterAddresseeHere(l){
  if(!G.sys)return false;
  if(l.to.kind==="tin")return !!(G.mode==="dock"&&typeof tinHereRec==="function"&&tinHereRec())||!!(G.surf&&G.surf.p&&typeof tinCanLive==="function"&&tinCanLive(G.surf.p));
  return !!(G.st&&G.st.stype===l.to.v);
}
function letterDeliver(l){
  const S=letterState(l.id);if(!S.taken||S.done)return false;
  if(l.to.kind==="tin"&&tinClosed()){
    S.late=1;
    const th=thingsAll().find(t=>t.letter===l.id);if(th)th.note="адресат выбыл · письмо осталось в трюме";
    peopleLine("адресат выбыл. Оставьте себе. Или не оставляйте.","Жестянка",true);
    return false;
  }
  if(!letterAddresseeHere(l))return false;
  S.done=1;
  const th=thingsAll().find(t=>t.letter===l.id);if(th){th.ru="Письмо · "+l.from+" → "+l.who+" · прочитано";th.note=l.text;th.k="paper";}
  peopleLine(l.text,l.who,true);
  if(typeof repAdd==="function")repAdd(1,G.sys);
  if(typeof recordAdd==="function")recordAdd(l.who,"доставлено письмо от "+l.from);
  return true;
}
function lettersBlock(){
  const O=letterOfferHere();
  const held=LETTERS.filter(l=>letterState(l.id).taken&&!letterState(l.id).done);
  const here=held.filter(l=>letterAddresseeHere(l)||(l.to.kind==="tin"&&tinClosed()&&G.mode==="dock"&&typeof tinHereRec==="function"&&tinHereRec()));
  if(!O&&!here.length)return;
  $body.appendChild(el("div","sec","ПИСЬМА · ВЕЗТИ, НЕ ЧИТАТЬ · АДРЕСАТ ЧИТАЕТ ВСЛУХ"));
  if(O){
    const r=el("div","row","<div class='nm'><b>"+O.from+" → "+O.who+"</b><s>"+(O.to.kind==="tin"?"на Жестянку"+(tinClosed()?" · закрыта":""):"на станцию типа «"+stTypeOf(O.to.v).ru+"»")+"</s></div>");
    const b=el("button","act sm","ВЗЯТЬ");b.onclick=()=>{letterTake(O);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  for(const l of here){
    const r=el("div","row","<div class='nm'><b>"+l.who+" здесь</b><s>письмо от "+l.from+"</s></div>");
    const b=el("button","act sm gold","ОТДАТЬ");b.onclick=()=>{letterDeliver(l);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
