/* ══════════════ шесть держав (M369, §7.1) ══════════════
   Держава — не фракция с полоской отношения, а страна: у неё своя дорога, свои
   ворота, свой голос в эфире и свой завод. Завод — это `HULL_MAKER`
   (03a-hull-maker), и ключи здесь те же: держава и её изготовитель — одно, но
   таблицы разные, потому что грамматика формы живёт отдельно от политики.

   ГЛАВТРАССА — та, откуда игрок: «ты по рождению уже тут» (§7.5). Флаг у него
   её и остаётся, на каком бы корпусе он ни летал: транспондер — не обшивка
   (D09). Пираты — не держава, а то, что между ними осталось.

   Сатира здесь на ГОСУДАРСТВО — на его канцелярию и его эфир, — и никогда на
   людей: правило §7.1, и оно же мера при любом добавлении строки.

   Что уже работает: имена, эфирная строка, приветствие на подходе, семейства
   орудий (они есть в 05b-guns; ракеты — не семейство, а вид части, поэтому у
   доктрины они отдельным полем `msl`), эмблема и флаг. Война, фронты и сводки — M371
   и дальше; здесь только таблица, к которой они придут. */
const POWERS={
  gt:{ru:"ГЛАВТРАССА",full:"ГЛАВТРАССА",from:"СССР",
    wants:"чтобы дорога была открыта",
    fams:["heavy","flak","auto","cluster"],
    doctrine:"масса и терпение: отступает редко, теряет много, не сообщает ничего",
    emblem:"star",col:"#e0d28a",
    hail:"Борт, откуда, чей, по какой надобности. Записываю",
    air:"На трассе спокойно",
    never:"о потерях",
    voice:{f:150,to:120,d:.5}},
  co:{ru:"Компания",full:"КОМПАНИЯ ВОСТОЧНЫХ РЫНКОВ",from:"США",
    wants:"рыночные станции и всё, что продаётся",
    fams:["aimed","flak","auto"],msl:1,
    doctrine:"бьёт издалека и деньгами, нанимает пиратов",
    emblem:"ring",col:"#7fb8ff",
    hail:"Приветствуем на территории партнёра. Стыковка от 40 кредитов, спасибо за выбор",
    air:"Выгодно как никогда",
    never:"о ценах — только «выгодно»",
    voice:{f:320,to:360,d:.3}},
  or:{ru:"Орднунг",full:"ОРДНУНГ",from:"Германия",
    wants:"узлы прыжка и горловины",
    fams:["rail","heavy","shot"],
    doctrine:"стоит стеной, не отступает, строй ровный",
    emblem:"grid",col:"#c9c9d4",
    hail:"Идентификация. Формуляр. Ожидайте",
    air:"Согласно регламенту",
    never:"о чувствах",
    voice:{f:200,to:200,d:.22}},
  km:{ru:"Коммуна",full:"ЛА КОММУНА",from:"Франция",
    wants:"верфи и красивые системы (для неё это одно и то же)",
    fams:["laser","siphon","jam","harpoon"],
    doctrine:"изящно: уходит показательно и возвращается внезапно",
    emblem:"wave",col:"#9fd8ff",
    hail:"А, ещё один. Ну проходи, только не сегодня, сегодня мы не работаем",
    air:"Об этом стоит подумать дольше, чем длится сводка",
    never:"— она говорит обо всём и часами",
    voice:{f:260,to:190,d:.7}},
  ra:{ru:"Рассвет",full:"ПАН-АФРИКАНСКИЙ КООПЕРАТИВ «РАССВЕТ»",from:"Африка",
    wants:"пояса, руду и всё, что копают",
    fams:["drill","shove","mortar","ram"],
    doctrine:"вплотную, много мелких, чинится в бою из хлама",
    emblem:"sun",col:"#f2b25c",
    hail:"Заходи, брат, чинить есть что?",
    air:"Успеется",
    never:"о сроках",
    voice:{f:120,to:150,d:.9}},
  hf:{ru:"Хай-Фронт",full:"ХАЙ-ФРОНТ",from:"Япония и Корея",
    wants:"маяки и ретрансляторы — всё, что смотрит",
    fams:["aimed","laser","cluster","needle"],
    doctrine:"видит первым, бьёт первым, не спорит",
    emblem:"dot",col:"#ff8b7a",
    hail:"Добро пожаловать. Ваш рейтинг доверия рассчитан. Просим извинить за неудобства",
    air:"Обновление установлено",
    never:"о том, что уже сделала",
    voice:{f:420,to:430,d:.18}}
};
const POWER_KEYS=Object.keys(POWERS);
function powerOf(k){return POWERS[k]||POWERS.gt;}
function powerRu(k){return powerOf(k).ru;}
/* ── флаг, а не обшивка (D09) ──
   Транспондер отвечает за принадлежность, корпус — нет: на компанейском
   корпусе под флагом ГЛАВТРАССЫ вас запишут именно как своего, просто в
   приветствии это отметят. Пираты флага не несут вовсе. */
function playerFlag(){return G.flag||"gt";}
function flagOf(o){
  if(!o)return null;
  if(o===G.ship)return playerFlag();
  if(o.pw)return o.pw;
  if((o.owner||"")==="fleet")return "gt";
  return null;                     /* пират — не держава */
}
/* приветствие на подходе: одна строка на державу (§7.1) */
function powerHail(k){return powerOf(k).hail;}
/* эмблема — круглая, одной конструкции на все шесть: круг, внутри знак.
   Шесть цветов на карте были бы шумом (holding §13), поэтому на карте — чип
   с эмблемой, а не заливка. */
function powerEmblem(k,x,y,r){
  const P=powerOf(k),col=P.col;
  ctx.save();
  ctx.strokeStyle=col;ctx.lineWidth=Math.max(1,r*.16);
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  ctx.fillStyle=col;
  if(P.emblem==="star"){
    /* пятиконечная — но собранная из лучей, а не залитая: на чипе в шесть
       пикселей залитая звезда превращается в кляксу */
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+i/5*TAU;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72);
      ctx.lineWidth=Math.max(1,r*.22);ctx.strokeStyle=col;ctx.stroke();
    }
  }else if(P.emblem==="ring"){
    ctx.beginPath();ctx.arc(x,y,r*.42,0,TAU);ctx.stroke();
  }else if(P.emblem==="grid"){
    ctx.lineWidth=Math.max(1,r*.14);
    for(const t of [-.35,.35]){
      ctx.beginPath();ctx.moveTo(x+r*t,y-r*.55);ctx.lineTo(x+r*t,y+r*.55);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-r*.55,y+r*t);ctx.lineTo(x+r*.55,y+r*t);ctx.stroke();
    }
  }else if(P.emblem==="wave"){
    ctx.lineWidth=Math.max(1,r*.16);
    ctx.beginPath();
    for(let i=0;i<=8;i++){
      const t=i/8,px=x-r*.6+r*1.2*t,py=y+Math.sin(t*TAU)*r*.34;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.stroke();
  }else if(P.emblem==="sun"){
    ctx.beginPath();ctx.arc(x,y,r*.34,0,TAU);ctx.fill();
    ctx.lineWidth=Math.max(1,r*.12);
    for(let i=0;i<8;i++){
      const a=i/8*TAU;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5);
      ctx.lineTo(x+Math.cos(a)*r*.78,y+Math.sin(a)*r*.78);ctx.stroke();
    }
  }else{
    ctx.beginPath();ctx.arc(x,y,r*.3,0,TAU);ctx.fill();
  }
  ctx.restore();
}
/* ══════════════ «Ялта» (M369, D12) ══════════════
   Одна система на всю галактику, куда все шестеро летают отдыхать и где никто
   не стреляет: пиратов там нет, оружие опечатано, фронт туда не приходит
   никогда. Адрес считается от постоянного зерна галактики — значит он один и
   тот же у всех и его можно назвать вслух, не сговариваясь.

   Содержимое «Ялты» — регата, рынок, встречи — приходит в M372; здесь только
   адрес и три запрета, на которые уже сегодня опирается бой. */
const YALTA_R=6;
function yaltaAt(){
  if(G._yalta)return G._yalta;
  /* зерно галактики постоянно (§7.5: одна галактика на всех), поэтому и адрес
     постоянен: угол от зерна, радиус ровно шестой круг */
  const a=h01(0x1A17,0x5EA,77)*TAU;
  const p={sx:Math.round(Math.cos(a)*YALTA_R),sy:Math.round(Math.sin(a)*YALTA_R)};
  return G._yalta=p;
}
function yaltaIs(sx,sy){
  const y=yaltaAt();
  return (sx|0)===y.sx&&(sy|0)===y.sy;
}
function yaltaHere(){return yaltaIs(G.sx,G.sy);}
/* оружие опечатано: не «выстрел не проходит», а прямой отказ с причиной —
   игрок обязан понимать, почему кнопка молчит */
function yaltaSealed(){
  if(!yaltaHere())return false;
  if((G._yaltaSaid||0)<G.t-180){G._yaltaSaid=G.t;say("ЯЛТА · ОРУЖИЕ ОПЕЧАТАНО",90);}
  return true;
}
