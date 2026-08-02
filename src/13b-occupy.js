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
  /* тех, кто снял блокаду, на станции помнят долго */
  if(sys.station&&typeof repAdd==="function")repAdd(2,sys);
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
/* ── маршрут фактора на карте ──
   Домен считался по настоящим ценам (M84), но игрок видел это одной строкой в
   карточке управляющего. Маршрут — вещь пространственная: он должен лежать на
   карте, как лежит на ней курс прыжка. Линия соединяет плечи, на лучшем плече
   стоит подпись «что везём и за сколько», и по ней сразу видно, куда выгодно
   лететь самому: фактор находит спред, а пользуется им кто хочет. */
function drawFactRoute(vis){
  const m=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(!m||m.stalled||!m.route||m.route.length<2)return;
  const at=key=>{
    const [sx,sy]=key.split(",").map(Number);
    return vis.find(v=>v.gx===sx&&v.gy===sy)||null;
  };
  const pts=m.route.slice(0,mgrRouteMax(m)).map(at).filter(Boolean);
  if(pts.length<2)return;
  const col="rgba(242,178,92,";
  ctx.save();
  ctx.setLineDash([1,5]);ctx.lineCap="round";
  ctx.strokeStyle=col+".45)";ctx.lineWidth=1.2;
  ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();
  ctx.setLineDash([]);ctx.lineCap="butt";
  /* борт идёт по маршруту: точка, ползущая от плеча к плечу, — это и есть
     «домен работает», видимое без единой цифры */
  if(pts.length>1){
    const seg=(G.t*.06)%(pts.length-1);
    const i0=Math.floor(seg),t=seg-i0;
    const a=pts[i0],b=pts[Math.min(pts.length-1,i0+1)];
    const bx=lerp(a.x,b.x,t),by=lerp(a.y,b.y,t);
    ctx.fillStyle=col+".9)";
    ctx.beginPath();ctx.arc(bx,by,2.6,0,TAU);ctx.fill();
    ctx.strokeStyle=col+".35)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(bx,by,5.5,0,TAU);ctx.stroke();
  }
  /* метки плеч: маленький ромб, чтобы плечо отличалось от просто станции */
  for(const p of pts){
    ctx.strokeStyle=col+".6)";ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y-9);ctx.lineTo(p.x+9,p.y);ctx.lineTo(p.x,p.y+9);
    ctx.lineTo(p.x-9,p.y);ctx.closePath();ctx.stroke();
  }
  /* подпись на лучшем плече: что и почём везут прямо сейчас */
  const leg=mgrBestLeg(m);
  if(!leg)return;
  const a=at(leg.from.sx+","+leg.from.sy),b=at(leg.to.sx+","+leg.to.sy);
  if(!a||!b)return;
  ctx.strokeStyle=col+".85)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  const rel=Math.round((leg.sell-leg.buy)/Math.max(1,leg.buy)*100);
  const label=RES[leg.k].ru.toUpperCase()+" "+leg.buy+" → "+leg.sell+" ("+rel+"%)";
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  const tw=ctx.measureText(label).width;
  ctx.fillStyle="rgba(6,10,16,.85)";ctx.fillRect(mx-tw/2-6,my-8,tw+12,16);
  ctx.strokeStyle=col+".55)";ctx.lineWidth=1;ctx.strokeRect(mx-tw/2-5.5,my-7.5,tw+11,15);
  ctx.fillStyle="#f2b25c";ctx.fillText(label,mx,my+.5);
  ctx.textBaseline="alphabetic";
  ctx.restore();
}
