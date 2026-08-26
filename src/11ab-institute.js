/* ══════════════ институт как живой заказчик ══════════════
   M162. План (11r) — цифры. Институт — ЛЮДИ С ТЕМАМИ: «тема 7-Б, плывущие
   часы, руководитель Привалов». Темы приходят письмами на стойку научной
   станции, отчёты сдаются лентами, есть справки по форме и «зайдите через
   неделю». Бюрократическая комедия: две лаборатории заказывают одно и то же;
   ваш отчёт попадает «не в тот отдел» и всплывает через месяц с выговором;
   тема закрыта «за неактуальностью» в день сдачи.

   ПУТЁВКА. Выполненная тема — путёвка в санаторий: три дня на курортной
   планете (любой океанический мир, где вы садитесь): экипаж отдохнул, мораль
   полная, Вега в восторге, у попугая загар. Отдых — три дня, когда ничего не
   происходит.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.inst: темы {id:{st,day}}, путёвки. Тексты — здесь.
   2. Ничего не объясняет: темы — про измерения, а не про смысл. */
const INST_TOPICS=[
  {id:"7b", ru:"тема 7-Б · плывущие часы",          lead:"Привалов",  need:"strip", note:"нужна лента самописца из уезда, где часы не сходятся"},
  {id:"12", ru:"тема 12 · сигнал вне диапазона",     lead:"Ойра-Ойра",need:"ring",  note:"нужна лента с пульсом — любая, даже слабая"},
  {id:"3v", ru:"тема 3-В · износ чужих вещей",       lead:"Корнеев",   need:"kit",   note:"нужна чужая вещь комплекта (с хулка), на осмотр"},
  {id:"19", ru:"тема 19 · дефицит как функция места",lead:"Киврин",    need:"need",  note:"нужно закрыть нужду станции — любую, запись сама придёт"},
  {id:"4a", ru:"тема 4-А · ответная лента",          lead:"Выбегалло", need:"strip", note:"нужна лента самописца, любая; лаборатория 4-А дублирует 7-Б, и это их дело"},
  {id:"31", ru:"тема 31 · пустота между планетами",  lead:"Саваоф",    need:"find",  note:"нужна сданная институту находка — паспорт на стол"}
];
function instAll(){if(!G.inst||typeof G.inst!=="object")G.inst={t:{},vouch:0,used:0};return G.inst;}
function instState(id){const I=instAll();return I.t[id]||(I.t[id]={st:0,day:0});}   /* st: 0 нет · 1 взята · 2 «не в тот отдел» · 3 закрыта · 4 неактуальна */
function instOfferHere(){
  if(!G.sys||!G.st||G.st.stype!=="sci")return null;
  const r=rng(hashi(G.sys.sx,G.sys.sy,0x1257+Math.floor(celDay()/4)));
  const L=INST_TOPICS.filter(t=>!instState(t.id).st);
  if(!L.length||r()>.7)return null;
  return L[Math.floor(r()*L.length)];
}
function instTake(t){
  const S=instState(t.id);if(S.st)return false;
  S.st=1;S.day=celDay();
  thingAdd("paper","Письмо института · "+t.ru,"руководитель "+t.lead+" · "+t.note+" · отчёт сдаётся на стойке научной станции · справка по форме 3-Б прилагается",{topic:t.id});
  peopleLine("тема ваша. Справку по форме 3-Б — не потеряйте. Без неё отчёт не примут. Шучу. Примут, но не сразу.","стойка института",true);
  logAdd("tech","Тема взята: "+t.ru+" · "+t.lead);
  return true;
}
/* есть ли чем отчитаться */
function instCanReport(t){
  if(t.need==="strip")return ((G.strips||[]).length>0);
  if(t.need==="ring")return !!(typeof ringAll==="function"&&ringAll().tapes.length);
  if(t.need==="kit")return (G.kitShelf||[]).some(x=>x.wear===3)||KIT_PLACES.some(p=>kitAll()[p].wear===3);
  if(t.need==="need")return Object.keys(G.need||{}).length>0;
  if(t.need==="find")return (typeof recordAll==="function")&&recordAll().e.some(x=>x.a==="институт"&&x.s.indexOf("сдана находка")===0);
  return false;
}
function instReport(t){
  const S=instState(t.id);if(S.st!==1||!instCanReport(t))return false;
  const r=rng(hashi(t.id.length*7+celDay(),S.day,0x0FF1));
  if(t.need==="strip"&&G.strips.length)G.strips.shift();
  /* 20% — тема закрыта за неактуальностью в день сдачи; 30% — не в тот отдел */
  const q=r();
  if(q<.2){
    S.st=4;peopleLine("тема закрыта. За неактуальностью. Сегодня утром. Отчёт оставьте — подошьют.","стойка института",true);
    recordAdd("институт","отчёт по теме "+t.id+" принят · тема закрыта за неактуальностью");
    return true;
  }
  if(q<.5){
    S.st=2;S.day=celDay();
    peopleLine("принято. Зайдите через неделю.","стойка института",true);
    logAdd("tech","Отчёт по теме "+t.id+" сдан. «Зайдите через неделю».");
    return true;
  }
  instClose(t);
  return true;
}
function instClose(t){
  const S=instState(t.id);
  S.st=3;instAll().vouch++;
  peopleLine("тема закрыта. "+t.lead+" доволен. Путёвка — в кассе, то есть у вас на столе.","стойка института",true);
  recordAdd("институт","тема "+t.id+" закрыта · руководитель "+t.lead);
  thingAdd("voucher","Путёвка · санаторий","за тему "+t.ru+" · три дня на океаническом мире: сесть и отдохнуть · экипаж и все на борту");
  logAdd("good","Тема закрыта: "+t.ru+" · путёвка на столе");
}
/* неделя спустя: «не в тот отдел» всплывает через месяц с выговором, иначе закрыта */
function instTick(){
  const I=instAll();const d=celDay();
  if(I.lastDay===d)return;I.lastDay=d;
  for(const t of INST_TOPICS){
    const S=instState(t.id);
    if(S.st===2&&d-S.day>=7&&!S.wrong){
      const r=rng(hashi(t.id.length,S.day,0x0DE7));
      if(r()<.4){S.wrong=1;S.day=d;logAdd("warn","Отчёт по теме "+t.id+" попал не в тот отдел. Ищут.");}
      else instClose(t);
    }else if(S.st===2&&S.wrong&&d-S.day>=30){
      recordAdd("институт","выговор: отчёт по теме "+t.id+" месяц лежал не в том отделе");
      instClose(t);
    }
  }
}
/* путёвка: на океаническом мире, три дня; всё отдыхает */
function instRestHere(){
  const I=instAll();if(I.vouch<=0)return false;
  return !!(G.surf&&G.surf.p&&G.surf.p.type==="ocean");
}
/* Путёвка больше не строка «+3 суток»: она открывает МЕСТО (29h, M199).
   Старое тело оставлено ниже недостижимым нарочно — по нему видно, чем это
   было, и почему стало. */
function instRest(){
  if(typeof enterSpa==="function")return enterSpa();
  const I=instAll();if(!instRestHere())return false;
  I.vouch--;I.used++;
  G.t+=CEL_DAY*3;
  for(const c of (G.crew||[]))c.morale=1;
  if(G.vega&&G.vega.aboard){G.vega.mood=1;G.vega.att=Math.max(0,G.vega.att-2);peopleLine("Море. Настоящее. Я не выйду из воды.","Вега",true);}
  if(typeof parrotHas==="function"&&parrotHas())logAdd("dim","У попугая полоска загара. Он не понимает, откуда.");
  const th=thingsAll().find(t=>t.k==="voucher");if(th)thingsAll().splice(thingsAll().indexOf(th),1);
  recordAdd("санаторий","три дня отдыха · без замечаний");
  tell("good","Санаторий: три дня, экипаж отдохнул","САНАТОРИЙ\nтри дня\nвсе отдохнули");
  return true;
}
function instBlock(){
  const O=instOfferHere();
  const mine=INST_TOPICS.filter(t=>instState(t.id).st===1);
  if(!O&&!mine.length&&!(G.st&&G.st.stype==="sci"))return;
  if(!O&&!mine.length)return;
  $body.appendChild(el("div","sec","ИНСТИТУТ · ТЕМЫ · ОТЧЁТ — ЛЕНТОЙ, СПРАВКА — ПО ФОРМЕ 3-Б"));
  if(O){
    const r=el("div","row","<div class='nm'><b>"+O.ru+"</b><s>руководитель "+O.lead+" · "+O.note+"</s></div>");
    const b=el("button","act sm","ВЗЯТЬ ТЕМУ");b.onclick=()=>{instTake(O);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  if(G.st&&G.st.stype==="sci")for(const t of mine){
    const can=instCanReport(t);
    const r=el("div","row","<div class='nm'><b>"+t.ru+"</b><s>"+(can?"есть чем отчитаться":t.note)+"</s></div>");
    const b=el("button","act sm gold","СДАТЬ ОТЧЁТ");b.disabled=!can;b.onclick=()=>{instReport(t);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
