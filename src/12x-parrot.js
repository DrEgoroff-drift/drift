/* ══════════════ трепло ушастое: свидетель, который не понимает ══════════════
   Первый из пяти свидетелей (см. PLAN.md, «The witnesses»). Он же — единственная
   вещь в игре, которая становится ЛУЧШЕ, пока лежит: птица повторяет
   услышанное дословно, а понимается сказанное позже, по мере того как приходят
   слова из отчёта «Долгого Хода» (12q) и от посёлка (12t). Купленная в первый
   час фраза заговаривает на двадцатом, и игрок для этого никуда не летит.

   ПРАВИЛА:
   1. Трепло НЕ ВЫДУМЫВАЕТ. Каждая строка — след настоящего события, при котором
      игрок присутствовал: стыковка, взятый кусок отчёта, сбитый пират. Строка
      без события — то же враньё, что перк без кода.
   2. Оно платит ДО того, как его поняли: цены станции, где вы уже были, — это
      рынок, открытый без перелёта, а пеленг — метка на карте. Иначе птица была
      бы лором с перьями.
   3. Расшифровка — задним числом и волнами. Новое слово перечитывает ВСЁ
      сохранённое, а не только новое.
   4. Оно повторяет и за вами — в том числе не вовремя. Свидетель, который может
      дать показания против вас, — единственный свидетель, которому веришь.
   5. Первое трепло не ловится в поле: оно достаётся с остова разведчика, из
      вещей покойника. Так игрок узнаёт, что покойник был. (Спец прохода отдаёт
      первую птицу блошинцу — его ещё нет, M120; остов той же породы источник:
      это тоже чужое имущество с известной судьбой.) */
const HEARD_MAX=24;                 // больше птица не помнит: она птица
const PARROT_NAMES=["Балабол","Скворец","Шумок","Пискля","Горлан","Кроха"];
function parrotHas(){return !!G.parrot;}
function heardAll(){return (G.heard||(G.heard=[]));}
/* ── как достаётся ──
   Один раз за прохождение и только из чужих вещей: у птицы есть прежний хозяин,
   и его имя — часть находки, а не украшение. */
function parrotFind(seed,who){
  if(parrotHas())return null;
  const r=rng(hashi(seed|0,0xB1AD,7));
  G.parrot={seed:seed>>>0,name:pick(PARROT_NAMES,r),who:who||"неизвестного борта",
    since:Date.now(),said:0};
  tell("tech","В вещах нашлось живое: трепло ушастое «"+G.parrot.name+"»",
    "ТРЕПЛО УШАСТОЕ\n«"+G.parrot.name+"»\nиз вещей "+G.parrot.who+
    "\nоно повторяет всё, что слышало");
  return G.parrot;
}
/* ── запомнить ──
   Одна дверь на все виды: без вида и без события строка не заводится. */
function heardAdd(kind,payload,words){
  if(!parrotHas()||!kind)return null;
  const L=heardAll();
  const rec={t:Date.now(),kind,sx:payload&&payload.sx|0,sy:payload&&payload.sy|0,
    note:(payload&&payload.note)||"",words:words||null,read:false,used:false};
  L.push(rec);
  while(L.length>HEARD_MAX)L.shift();
  G.parrot.said=(G.parrot.said|0)+1;
  return rec;
}
/* цены станции, у которой стоим: птица слышит их сегодня, а пригодятся они
   там, где вас нет */
function heardPrices(sys){
  if(!parrotHas()||!sys||!sys.station)return null;
  const L=heardAll();
  if(L.some(h=>h.kind==="price"&&h.sx===sys.sx&&h.sy===sys.sy))return null;
  return heardAdd("price",{sx:sys.sx,sy:sys.sy,note:"«"+sys.station.name+"»"});
}
/* фраза на пиджине: слова хранятся НОМЕРАМИ, а не текстом — иначе расшифровка
   задним числом невозможна, и вся механика превращается в отложенный лор */
function heardPidgin(seed,sx,sy){
  if(!parrotHas())return null;
  const r=rng(hashi(seed|0,0x9111,13));
  const n=2+Math.floor(r()*3);
  const words=[];
  for(let i=0;i<n;i++)words.push(Math.floor(r()*LORE_WORDS.length));
  return heardAdd("pidgin",{sx,sy,note:""},words);
}
/* то, что птица подслушала у ВАС: чужое имя, чужой борт, чужая частота */
function heardYours(note,sx,sy){
  if(!parrotHas())return null;
  return heardAdd("yours",{sx,sy,note:note||"чей-то позывной"});
}
/* ── как это читается ──
   Глифы — те же, что у посёлка: один алфавит на весь пиджин, иначе игрок не
   свяжет одно с другим. */
function heardGlyph(i){return SETTLE_GLYPH[i%SETTLE_GLYPH.length];}
function heardWordsRu(h){
  const vocab=(typeof loreVocab==="function")?loreVocab():[];
  return (h.words||[]).map(i=>{
    const w=LORE_WORDS[i%LORE_WORDS.length];
    return vocab.indexOf(w)>=0?w:heardGlyph(i);
  });
}
function heardCanRead(h){
  const vocab=(typeof loreVocab==="function")?loreVocab():[];
  return !!h.words&&h.words.every(i=>vocab.indexOf(LORE_WORDS[i%LORE_WORDS.length])>=0);
}
/* перечитывание: вызывается всякий раз, когда словарь мог вырасти. Волной, а не
   по одной строке: смысл механики в том, что одно слово оживляет старое. */
function heardReread(){
  if(!parrotHas())return 0;
  let n=0;
  for(const h of heardAll()){
    if(h.kind!=="pidgin"||h.read||!heardCanRead(h))continue;
    h.read=true;n++;
    const ru=heardWordsRu(h).join(" ");
    logAdd("tech","«"+G.parrot.name+"» вдруг стал понятен: "+ru);
    /* понятая фраза платит тем же, чем платит зарубка: адресом. Место берётся
       от самой фразы, поэтому одна и та же строка всегда указывает туда же. */
    const A=(typeof loreAddr==="function")?loreAddr(hashi(h.t|0,h.words[0]|0,0x9A1)):null;
    if(A&&typeof loreMarks==="function"){
      loreMarks().push({sx:A.sx,sy:A.sy,id:"heard:"+h.t});
      h.sx=A.sx;h.sy=A.sy;
    }
  }
  if(n){
    say("«"+G.parrot.name+"» заговорил\nпонятно стало строк: "+n);
    if(typeof saveGame==="function")saveGame(true);
  }
  return n;
}
/* ── что оно отдаёт сейчас ──
   Цены станции, где вы были, читаются откуда угодно: это и есть рента птицы. */
function heardUse(h){
  if(!h||h.used)return false;
  if(h.kind==="price"){
    const s=starAt(h.sx,h.sy)?getSystem(h.sx,h.sy):null;
    if(!s||!s.station)return false;
    /* рынок открывается ровно так же, как его открывает зарубка с ценами
       (12q): одна запись в G.market — и станция видна из другого конца */
    if(!G.market)G.market={};
    if(!G.market[s.key])G.market[s.key]={pressure:{},t:G.t};
    h.used=true;
    tell("money","«"+G.parrot.name+"» повторил цены "+(h.note||"станции"),
      "ЦЕНЫ ПОВТОРЕНЫ\n"+(h.note||"")+"\nсектор "+h.sx+", "+h.sy);
    return true;
  }
  if(h.kind==="yours"){
    /* это не товар: строку против себя нельзя «использовать», её можно только
       услышать от кого-то другого */
    return false;
  }
  return false;
}
/* ── стыковка ──
   Весь распорядок птицы у прилавка: сперва отдаёт долг — повторяет цены той
   станции, где вы были раньше (рынок открывается без перелёта), потом слушает
   эту, а потом иногда выдаёт то, что слышала у вас. */
function parrotDock(sys){
  if(!parrotHas()||!sys)return;
  const old=heardAll().find(h=>h.kind==="price"&&!h.used&&!(h.sx===sys.sx&&h.sy===sys.sy));
  if(old)heardUse(old);
  heardPrices(sys);
  heardBlurt(sys);
}
/* ── не вовремя ──
   При стыковке птица иногда выдаёт то, что слышала от вас. Один раз на строку и
   только там, где есть кому услышать. */
function heardBlurt(sys){
  if(!parrotHas()||!sys||!sys.station)return null;
  const h=heardAll().find(x=>x.kind==="yours"&&!x.used);
  if(!h)return null;
  /* бросок на КАЖДУЮ стыковку, а не на пару «фраза + станция»: детерминированный
     бросок здесь означал бы, что птица либо молчит у этой станции всегда, либо
     ляпает при первом же заходе, — а она просто иногда не вовремя */
  if(Math.random()<.55)return null;
  h.used=true;
  if(typeof repAdd==="function")repAdd(-1,sys);
  tell("warn","«"+G.parrot.name+"» ляпнул лишнее: "+h.note,
    "ПТИЦА ЛЯПНУЛА\n"+h.note+"\nздесь это слышали");
  return h;
}
