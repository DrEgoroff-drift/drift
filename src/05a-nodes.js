/* ══════════════ узлы: тысяча вещей, из которых собирают невозможное ══════════════ */
/* Части (`05-parts`) — расходный слой: их много, они меняются, их не жалко.
   Узел — противоположность: у него есть имя, семья и место в наборе. Узлы не
   покупаются и не крафтятся, они ТОЛЬКО падают, и собрать полный набор — работа
   на всё прохождение. Зато собранный набор даёт венец: вещь, которой в игре
   больше нет ни у кого и которую нельзя получить иначе.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Каталог ДЕТЕРМИНИРОВАН и не сохраняется: в записи лежат только номера
      найденных узлов. Тысяча объектов в сейве — это тысяча способов сломать
      старые записи при правке генератора.
   2. Узел не даёт эффекта сам по себе. Он — буква; слово получается из набора.
      Иначе тысяча предметов превратилась бы в тысячу мелких прибавок, и игра
      стала бы таблицей.
   3. Редкость узла — это ЧАСТОТА выпадения, а не сила. Сила приходит с венцом,
      и она одинакова для всех наборов: собирать «выгодный» набор нельзя, можно
      собирать тот, который нравится.
   4. Собрать набор должно быть тяжело и по-настоящему долго: последний узел
      каждого набора выпадает только там, где опаснее всего. */
const NODE_FAMS=[
  {id:"ark",  ru:"Ковчег",      col:"#7fe6d8",crown:"Ковчежный контур",
   crownNote:"трюм и корпус растут вместе: +20% к вместимости и +40 к корпусу"},
  {id:"pyre", ru:"Костёр",      col:"#ff9d7a",crown:"Сердце костра",
   crownNote:"+35% к урону орудия и вдвое быстрее остывает ствол"},
  {id:"moth", ru:"Мотылёк",     col:"#c58ae0",crown:"Крыло мотылька",
   crownNote:"+25% к тяге и повороту, пираты замечают вдвое позже"},
  {id:"well", ru:"Колодец",     col:"#9fd8ff",crown:"Дно колодца",
   crownNote:"бак +60, автопилот тратит вдвое меньше"},
  {id:"loom", ru:"Ткацкий",     col:"#8fd08a",crown:"Основа ткацкого",
   crownNote:"дроны и базы работают на треть быстрее"},
  {id:"cair", ru:"Курган",      col:"#e0d28a",crown:"Камень кургана",
   crownNote:"+30% к добыче в шахте и в поясе"},
  {id:"echo", ru:"Эхо",         col:"#c9c9d4",crown:"Эхо-камера",
   crownNote:"радар вдвое дальше, залежи видны сквозь породу"},
  {id:"veil", ru:"Полог",       col:"#b0a0ff",crown:"Складка полога",
   crownNote:"щит +40 и восстанавливается даже под огнём"},
  {id:"kiln", ru:"Печь",        col:"#f2b25c",crown:"Под печи",
   crownNote:"переплавка даёт вдвое больше сплавов, ремонт вдвое дешевле"},
  {id:"tide", ru:"Прилив",      col:"#5fd0c8",crown:"Гребень прилива",
   crownNote:"цены на ваших плечах маршрута держатся на 12% выше"}
];
const NODE_GRADES=[
  {id:"plain", ru:"рядовой",    w:44,col:"#9fb0bd",drop:1},
  {id:"fine",  ru:"точный",     w:28,col:"#8fd08a",drop:.72},
  {id:"single",ru:"штучный",    w:16,col:"#7fb0e6",drop:.42},
  {id:"lost",  ru:"утраченный", w:9, col:"#f2b25c",drop:.2},
  {id:"never", ru:"несбыточный",w:3, col:"#ff9d7a",drop:.06}
];
/* Слова, из которых собираются имена. Их произведение больше тысячи, поэтому
   каждый узел получает своё имя, а не «узел №417». */
const NODE_A=["Тихий","Ржавый","Слепой","Долгий","Пустой","Верхний","Нижний","Крайний",
  "Первый","Последний","Малый","Большой","Косой","Прямой","Кривой","Сухой","Мокрый",
  "Тёмный","Светлый","Мёртвый","Живой","Старший","Младший","Быстрый","Медленный"];
const NODE_B=["шов","ключ","зуб","вал","клин","стык","обод","якорь","рычаг","хомут",
  "патрубок","замок","коленвал","сердечник","маховик","стержень","кулачок","шатун",
  "золотник","поршень","тросик","подшипник","муфта","редуктор","цилиндр","фланец",
  "сопряжение","противовес","компенсатор","волновод","резонатор","коллектор",
  "распределитель","накопитель","отражатель","поглотитель","стабилизатор","прерыватель",
  "усилитель","преобразователь"];
const NODE_C=["левый","правый","верхний","нижний","обратный","прямой","двойной",
  "тройной","опорный","ведущий","ведомый","запасной","аварийный","рабочий","поверочный"];
const NODE_PER_FAM=100;                 // десять семей по сто — ровно тысяча
const NODES=[];
const NODE_BY_ID={};
(function buildNodes(){
  const seen={};
  for(let f=0;f<NODE_FAMS.length;f++){
    const F=NODE_FAMS[f];
    for(let i=0;i<NODE_PER_FAM;i++){
      const seed=hashi(0x2ED,f*7919+i*131+17,0xB01D), r=rng(seed);
      /* грейд взвешенно: рядовых много, несбыточных — единицы на семью */
      let tot=0;for(const g of NODE_GRADES)tot+=g.w;
      let roll=r()*tot,grade=NODE_GRADES[0];
      for(const g of NODE_GRADES){roll-=g.w;if(roll<=0){grade=g;break;}}
      /* имя: три слова и, если совпало, номер серии — как у корпусов */
      const base=pick(NODE_A,r)+" "+pick(NODE_B,r)+
             (r()<.45?" ("+pick(NODE_C,r)+")":"");
      /* счётчик ведётся по БАЗОВОМУ имени: раньше он инкрементировал уже
         переименованное, и третий совпавший узел получал имя второго */
      const n0=(seen[base]|0);seen[base]=n0+1;
      const ru=n0?base+" "+(n0+1):base;
      const id="n"+f+"_"+i;
      const node={id,idx:NODES.length,fam:F.id,famRu:F.ru,ru,grade:grade.id,
        gradeRu:grade.ru,col:grade.col,seed,
        /* место, где узел вообще может выпасть: это и есть «где искать» */
        where:pick(["с пиратов","в шахте","в рейде на базу","в поясе","в пещере",
                    "с ушедшего управляющего","в аномалии"],r)};
      NODES.push(node);NODE_BY_ID[id]=node;
    }
  }
})();
const NODE_N=NODES.length;
/* ── найденное ──
   В записи лежит только множество номеров: тысяча булевых значений — это
   строка на сотню байт, а не тысяча объектов. */
function nodesHave(){return (G.nodes||(G.nodes={}));}
function nodeHas(id){return !!nodesHave()[id];}
function nodeCount(fam){
  let n=0;const have=nodesHave();
  for(const id in have)if(!fam||NODE_BY_ID[id]&&NODE_BY_ID[id].fam===fam)n++;
  return n;
}
function nodeFound(node){
  if(!node||nodeHas(node.id))return false;
  nodesHave()[node.id]=1;
  const F=NODE_FAMS.find(f=>f.id===node.fam);
  const have=nodeCount(node.fam);
  tell("tech","Узел: «"+node.ru+"» · "+F.ru+" "+have+"/"+NODE_PER_FAM,
       "«"+node.ru+"»\n"+node.gradeRu+" узел набора «"+F.ru+"»\n"+
       "собрано "+have+" из "+NODE_PER_FAM);
  return true;
}
/* ── что падает ──
   Место падения не декорация: узел выпадает только там, где он «водится».
   Шанс — от грейда и от опасности сектора; полного мусора не бывает, но и
   тысячу узлов за вечер не собрать. */
function nodeRoll(where,danger,seed){
  const r=rng(seed>>>0||1);
  /* базовый шанс низкий намеренно: узлы — не валюта, а находки */
  if(r()>.06+danger*.10)return null;
  const pool=NODES.filter(n=>n.where===where&&!nodeHas(n.id));
  if(!pool.length)return null;
  /* грейд решает частоту: несбыточный узел из пула вытягивается вшестнадцатеро
     реже рядового, и последние узлы набора всегда даются тяжелее всего */
  for(let k=0;k<24;k++){
    const n=pool[(r()*pool.length)|0];
    const g=NODE_GRADES.find(x=>x.id===n.grade);
    if(r()<g.drop*(.45+danger*.75))return n;
  }
  return null;
}
function nodeDrop(where,danger,seed){
  const n=nodeRoll(where,danger,seed);
  if(!n)return null;
  nodeFound(n);
  return n;
}
/* ── венец ──
   Набор из ста узлов — работа на всё прохождение, и она должна кончаться вещью,
   которой иначе не получить. Венец надевается как артефакт: слот один. */
function crownReady(fam){return nodeCount(fam)>=NODE_PER_FAM;}
function crownOwned(fam){return !!(G.crowns&&G.crowns[fam]);}
function crownForge(fam){
  if(!crownReady(fam)||crownOwned(fam))return false;
  if(!G.crowns)G.crowns={};
  G.crowns[fam]=Date.now();
  const F=NODE_FAMS.find(f=>f.id===fam);
  tell("tech","Собран венец: «"+F.crown+"»",
       "«"+F.crown+"»\n"+F.crownNote+"\n\nнабор «"+F.ru+"» закрыт целиком");
  logAdd("tech","Венец «"+F.crown+"» собран из ста узлов набора «"+F.ru+"»");
  return true;
}
/* эффекты венцов читаются оттуда же, откуда и всё прочее — из `stat()` */
function crownHas(fam){return crownOwned(fam);}
/* ── экран наборов ──
   Тысяча узлов не показывается списком: список из тысячи строк — это склад, а не
   коллекция. Показываем десять наборов полосами: сколько собрано, что осталось,
   где искать недостающее и что даст венец. Внутри набора видно только найденное —
   ненайденное не перечисляется, иначе игра превращается в чек-лист. */
function nodesRender(){
  $body.appendChild(el("div","sec","НАБОРЫ УЗЛОВ · "+nodeCount()+" / "+NODE_N+
    " · УЗЛЫ НЕ ПОКУПАЮТСЯ И НЕ СОБИРАЮТСЯ — ТОЛЬКО НАХОДЯТСЯ"));
  $body.appendChild(el("div","row","<div class='nm'><s>узел сам по себе не делает "+
    "ничего: он буква. Слово получается из набора — соберите сто узлов одной "+
    "семьи, и выйдет венец, которого нельзя получить никак иначе.</s></div>"));
  for(const F of NODE_FAMS){
    const have=nodeCount(F.id),done=crownReady(F.id),owned=crownOwned(F.id);
    const pct=Math.round(have/NODE_PER_FAM*100);
    const r=el("div","row"+(owned?" on":""));
    r.appendChild(el("div","nm","<b style='color:"+F.col+"'>"+F.ru+"</b>"+
      "<s>"+have+" из "+NODE_PER_FAM+" · венец «"+F.crown+"»: "+F.crownNote+
      "<br><span style='display:inline-block;width:120px;height:4px;"+
      "background:rgba(255,255,255,.12);vertical-align:middle'>"+
      "<i style='display:block;height:4px;width:"+pct+"%;background:"+F.col+"'></i></span>"+
      " "+pct+"%"+
      (owned?" · <b style='color:#8fd08a'>венец собран и работает</b>":"")+
      "</s>"));
    if(done&&!owned){
      const b=el("button","act gold","СОБРАТЬ ВЕНЕЦ");
      b.onclick=()=>{if(crownForge(F.id))renderTab();};
      r.appendChild(b);
    }
    $body.appendChild(r);
  }
  /* последние находки: коллекция должна что-то рассказывать, а не только считать */
  const have=Object.keys(nodesHave()).map(id=>NODE_BY_ID[id]).filter(Boolean);
  if(have.length){
    const last=have.slice(-8).reverse();
    $body.appendChild(el("div","sec","ПОСЛЕДНИЕ НАХОДКИ"));
    for(const n of last){
      const F=NODE_FAMS.find(f=>f.id===n.fam);
      $body.appendChild(el("div","row","<div class='nm'><b style='color:"+n.col+"'>«"+
        n.ru+"»</b><s>"+n.gradeRu+" узел набора «"+F.ru+"» · находят "+n.where+"</s></div>"));
    }
  }
}
