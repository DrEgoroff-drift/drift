/* ══════════════ пираты берут системы ══════════════ */
/* Пираты были погодой: сколько-то их встречается в опасных секторах, и всё.
   Отношения с ними не менялись ни от чего — убил и полетел дальше.
   Теперь у них есть карта: очаги расползаются по соседним системам, занятая
   система теряет службы, а игрок может её отбить. Галактика перестала быть
   фоном и стала тем, что можно потерять или вернуть.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Захват идёт ТОЛЬКО от соседства с уже занятым или от очага (пиратской
      базы). Случайный захват на другом конце галактики читался бы шумом,
      а не наступлением.
   2. Занятость — это отнятые СЛУЖБЫ, а не отнятые числа. Под блокадой док не
      строит корпуса, лаборатория молчит, дроны не сдают груз; цены падают,
      потому что скупщик один и он знает, что деваться некуда.
   3. Отбивается система тем же, чем игралась игра: боем в ней. Никакой
      отдельной кнопки «освободить» — счётчик набивается сбитыми.
   4. Всё персистентно и компактно: `G.occ` — разреженный объект по ключу
      "sx,sy", как и всё привязанное к системе. */
const OCC_MAX=3;
const OCC_LVL=[
  {ru:"спокойно"},
  {ru:"шалят",   note:"патрули пиратов, скупщик занижает цену",   need:3, price:.90},
  {ru:"блокада", note:"док и лаборатория закрыты, дроны не сдают",need:5, price:.78},
  {ru:"под пиратами",note:"станция не работает, только топливо втридорога",need:8,price:.62}
];
/* Как быстро расползается: раз в столько миллисекунд игра бросает кости на
   расширение. Медленно намеренно — это фон, а не таймер на шее. */
const OCC_PERIOD=180000;
function occInit(){return {};}
function occKey(sx,sy){return sx+","+sy;}
function occAt(sx,sy){
  const o=G.occ&&G.occ[occKey(sx,sy)];
  return o&&o.lvl>0?o:null;
}
function occLvl(sx,sy){const o=occAt(sx,sy);return o?o.lvl:0;}
function occHere(){return occLvl(G.sx,G.sy);}
function occInfo(lvl){return OCC_LVL[clamp(lvl|0,0,OCC_MAX)];}
/* ── очаги ──
   Пиратская база в поясе — это и есть очаг: пока она стоит, соседние системы
   продолжают занимать. Разбитая база (её уже умеет `24a-mode-raid`) гасит
   расширение вокруг себя, и это единственный способ остановить наступление
   насовсем. */
function occNest(sx,sy){
  if(G.bases&&G.bases[occKey(sx,sy)])return false;      // ваша база — не очаг
  const d=sysDanger(sx,sy);
  if(d<.35)return false;
  return rng(hashi(sx,sy,0x0CC5))()<d*.5;
}
function occSet(sx,sy,lvl){
  if(!G.occ)G.occ=occInit();
  const k=occKey(sx,sy);
  if(lvl<=0){delete G.occ[k];return;}
  const o=G.occ[k]||(G.occ[k]={lvl:0,kills:0,t:Date.now()});
  o.lvl=Math.min(OCC_MAX,lvl);o.kills=0;o.t=Date.now();
}
/* ── наступление ──
   Один бросок на такт: берём случайную занятую систему и пробуем расширить её
   на соседа; если занятых нет, зажигаем очаг. Так наступление всегда идёт
   ОТКУДА-ТО, и игрок видит фронт, а не сыпь по карте. */
function occTick(){
  if(!G.occ)G.occ=occInit();
  const now=Date.now();
  if(!G.occT)G.occT=now;
  if(now-G.occT<OCC_PERIOD)return;
  G.occT=now;
  const keys=Object.keys(G.occ);
  const r=rng(hashi(now&0xffffff,keys.length,0x9E55));
  if(!keys.length){
    /* первый очаг: далеко от центра, чтобы начало игры оставалось тихим */
    for(let i=0;i<40;i++){
      const sx=Math.round((r()*2-1)*22),sy=Math.round((r()*2-1)*22);
      if(!starAt(sx,sy)||!occNest(sx,sy))continue;
      occSet(sx,sy,1);
      logAdd("warn","Пираты закрепились в секторе "+sx+":"+sy);
      return;
    }
    return;
  }
  const from=keys[(r()*keys.length)|0].split(",").map(Number);
  /* рядом с подавленным очагом наступление замирает: разбитая база должна
     что-то ЗНАЧИТЬ, иначе отбивать системы можно только бесконечно */
  if(occCalmNear(from[0],from[1]))return;
  const o=G.occ[occKey(from[0],from[1])];
  /* сперва укрепляются там, где уже стоят, и только потом ползут дальше:
     иначе фронт расплывался пятном в один уровень на всю галактику */
  if(o.lvl<OCC_MAX&&r()<.45){
    occSet(from[0],from[1],o.lvl+1);
    const sys=getSystem(from[0],from[1]);
    logAdd("warn","«"+(sys.name||"")+"»: пираты усилились — "+occInfo(o.lvl).ru);
    if(sys.station)tell("warn","Пираты усилились в системе «"+sys.name+"»",
      "«"+sys.name+"»\n"+occInfo(o.lvl).ru+"\n"+occInfo(o.lvl).note);
    return;
  }
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
  for(let i=0;i<8;i++){
    const d=dirs[(r()*8)|0],nx=from[0]+d[0],ny=from[1]+d[1];
    if(!starAt(nx,ny)||occLvl(nx,ny))continue;
    /* обжитое сопротивляется: рядом со станцией захват идёт вдвое реже */
    const sys=getSystem(nx,ny);
    if(sys.station&&r()<.5)continue;
    occSet(nx,ny,1);
    logAdd("warn","Пираты пришли в «"+(sys.name||(nx+":"+ny))+"»");
    return;
  }
}
/* ── отбить ──
   Считаются сбитые именно в этой системе. Набрал норму уровня — уровень падает.
   Ноль — система свободна, и за это платят: не «наградой за квест», а тем, что
   станция снова работает, плюс разовые призовые от неё. */
function occKill(sx,sy){
  const o=occAt(sx,sy);if(!o)return;
  o.kills=(o.kills|0)+1;
  const need=occInfo(o.lvl).need;
  if(o.kills<need){
    say("Отбито "+o.kills+" из "+need+"\nсистема ещё под ними");
    return;
  }
  const lvl=o.lvl-1;
  occSet(sx,sy,lvl);
  const sys=getSystem(sx,sy);
  if(lvl>0){
    tell("good","«"+sys.name+"»: пиратов потеснили — "+occInfo(lvl).ru,
         "Потеснили\n«"+sys.name+"»\n"+occInfo(lvl).ru);
    return;
  }
  G.freed=(G.freed|0)+1;
  const prize=sys.station?Math.round(2400+sysDanger(sx,sy)*9000):0;
  if(prize)earn(prize,"free");
  tell("good","Система «"+sys.name+"» свободна"+(prize?" · +"+prize.toLocaleString("ru")+" кр":""),
       "«"+sys.name+"» свободна\n"+(prize?"призовые "+prize.toLocaleString("ru")+" кр\n":"")+
       "освобождено систем: "+G.freed);
}
/* ── что занятость делает с миром ── */
function occPriceMul(sx,sy){return occInfo(occLvl(sx,sy)).price||1;}
/* службы станции: под блокадой закрывается док, под пиратами — всё, кроме заправки */
function occService(kind){
  const l=occHere();
  if(l>=OCC_MAX)return kind==="fuel";
  if(l>=2)return kind!=="yard"&&kind!=="lab";
  return true;
}
/* сколько лишних пиратов держит занятая система: это и есть «патруль» */
function occExtraPirates(sx,sy){
  const l=occLvl(sx,sy);
  return l?l+(l>=OCC_MAX?1:0):0;
}
/* ── сводка для игрока ──
   Одна строка на экран карты: сколько занято и сколько отбито. Цель игры должна
   быть видна числом, а не подразумеваться. */
function occSummary(){
  const n=G.occ?Object.keys(G.occ).length:0;
  return "занято систем: "+n+" · отбито вами: "+(G.freed|0);
}
/* ── карточка цели ──
   Три вещи, ради которых играют: дом, который растёт от оборота; собственная
   яхта, которая не окупается никогда и потому и есть роскошь; галактика,
   которую отбивают у пиратов система за системой. Всё считается по настоящему
   состоянию — ни одного флажка «квест выполнен». */
function goalOwnYacht(){
  for(const id in G.owned){
    const S=shipData(id);
    if(S&&(S.hcls==="yacht"||shipTier(S)==="luxe"))return S;
  }
  return null;
}
function goalCard(){
  const H=G.home,tier=H?H.tier|0:0;
  const yacht=goalOwnYacht();
  const occN=G.occ?Object.keys(G.occ).length:0;
  const line=(done,head,body)=>
    "<div class='nm'><b style='color:"+(done?"#8fd08a":"#f2b25c")+"'>"+
    (done?"✓ ":"• ")+head+"</b><s>"+body+"</s></div>";
  $body.appendChild(el("div","sec","К ЧЕМУ ВСЁ ИДЁТ · ТРИ ВЕЩИ, РАДИ КОТОРЫХ ЛЕТАЮТ"));
  $body.appendChild(el("div","row",line(tier>=HOME_TIERS.length,
    "Дом · "+tier+" из "+HOME_TIERS.length+" ступеней",
    tier?"построено: "+HOME_TIERS.slice(0,tier).map(t=>t.ru).join(", ")+
      (homeNext()?"<br>дальше: "+homeNext().ru+" — нужен оборот "+
        homeNext().t.toLocaleString("ru")+" кр":"<br>дом достроен целиком")
      :"дома пока нет: он появится сам, когда оборот дойдёт до "+
       HOME_TIERS[0].t.toLocaleString("ru")+" кр")));
  $body.appendChild(el("div","row",line(!!yacht,
    "Яхта · "+(yacht?"«"+yacht.ru+"»":"нет"),
    yacht?"стоит в ангаре. Трюм смешной, ход прекрасный — она и не должна окупаться"+
      "<br>наёмники отдыхают на ней между рейсами: мораль возвращается на "+
      Math.round((yachtMoraleMul()-1)*100)+"% быстрее"+
      (homeHas("dock")?" (причал дома держит её на виду)":" — с причалом дома будет больше")
         :"люксовая яхта попадается в доке редко и стоит как дом. "+
          "Это единственная покупка в игре, которая не отбивается ничем")));
  $body.appendChild(el("div","row",line(occN===0&&(G.freed|0)>0,
    "Галактика · отбито "+(G.freed|0)+" · под пиратами "+occN,
    occN?"фронт виден на карте: занятые системы обведены штрихами. "+
         "Систему отбивают боем в ней самой — сбитые считаются по системе"
        :"сейчас свободно всё, до чего вы дотянулись. Пираты вернутся: "+
         "их очаги — базы в поясах, и пока база цела, наступление продолжится")));
}
/* ── очаг подавлен ──
   Разбитая пиратская база — единственный способ остановить наступление, а не
   отбивать одну систему бесконечно: пока очаг цел, соседи будут заниматься
   снова и снова. Подавление держится сутки игрового времени и гасит расширение
   в радиусе двух секторов. */
const OCC_CALM_MS=86400000;
function occSuppress(sx,sy){
  if(!G.occCalm)G.occCalm={};
  G.occCalm[occKey(sx,sy)]=Date.now();
  const had=occLvl(sx,sy);
  if(had)occSet(sx,sy,had-1);
  tell("kill","Очаг в этом секторе подавлен"+(had?" · система: "+occInfo(had-1).ru:""),
       "Очаг подавлен\nнаступление вокруг замрёт на сутки"+
       (had?"\nсистема: "+occInfo(had-1).ru:""));
}
function occCalmNear(sx,sy){
  if(!G.occCalm)return false;
  const now=Date.now();
  for(const k in G.occCalm){
    if(now-G.occCalm[k]>OCC_CALM_MS){delete G.occCalm[k];continue;}
    const [cx,cy]=k.split(",").map(Number);
    if(Math.max(Math.abs(cx-sx),Math.abs(cy-sy))<=2)return true;
  }
  return false;
}
/* ── логово ──
   В занятой системе пиратская база — не просто база, а логово: уровень выше,
   на мостике сидит барон, и разгром гасит очаг. Отдельного режима под это не
   нужно — абордаж (`24a-mode-raid`) уже умеет всё, чего это требует. */
function occLairLevel(sx,sy){return occLvl(sx,sy);}
function occLairName(sx,sy){
  const l=occLvl(sx,sy);
  return l>=OCC_MAX?"ЛОГОВО БАРОНА":(l>=2?"ОПОРНЫЙ ПУНКТ":"");
}
