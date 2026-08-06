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
/* ── где узлы водятся ──
   Список ЗАКРЫТЫЙ и один на всю игру: и каталог, и места падения берут места
   отсюда. В первом заходе половина списка не была подключена ни к чему, и
   пятьсот с лишним узлов оказались недостижимы — ровно та же ошибка, что
   «перк без кода». Набор `узлы падают отовсюду, где сказано` стережёт это. */
const NODE_WHERE=["с пиратов","в шахте","в рейде на базу","в поясе","в пещере",
                  "с ушедшего управляющего","в аномалии"];
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
        where:pick(NODE_WHERE,r)};
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
function nodeRoll(where,danger,seed,lair){
  const r=rng(seed>>>0||1);
  /* базовый шанс низкий намеренно: узлы — не валюта, а находки */
  if(r()>.06+danger*.10)return null;
  let pool=NODES.filter(n=>n.where===where&&!nodeHas(n.id));
  if(!pool.length)return null;
  /* ── последние узлы набора ──
     Пока в семье осталось больше трёх ненайденных, они падают везде, где
     водятся. Последние три — только в логове барона: набор должен кончаться
     не тем, что вы ещё сто раз слетали в шахту, а тем, что вы туда дошли. */
  const tail=pool.filter(n=>{
    const left=NODE_PER_FAM-nodeCount(n.fam);
    return left<=3;
  });
  if(tail.length===pool.length&&!lair)return null;
  if(!lair)pool=pool.filter(n=>tail.indexOf(n)<0);
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
function nodeDrop(where,danger,seed,lair){
  const n=nodeRoll(where,danger,seed,lair);
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
      const row=el("div","row");
      row.appendChild(nodeIconEl(n,44));
      row.appendChild(el("div","nm","<b style='color:"+n.col+"'>«"+n.ru+
        "»</b><s>"+n.gradeRu+" узел набора «"+F.ru+"» · находят "+n.where+"</s>"));
      $body.appendChild(row);
    }
  }
  /* редкости живут на той же доске, что и узлы: и то и другое — коллекция,
     которую нельзя купить (12m-rare) */
  if(typeof rareRender==="function")rareRender();
}
/* ── как узел выглядит ──
   Тысяча находок, у каждой имя — и все они были строчкой текста. Вещь, которую
   нельзя увидеть, не ощущается вещью, поэтому у узла есть облик: он собирается
   из его же seed по тем же правилам, что корпуса и части. Форма идёт от семьи
   (у «Ковчега» — обод, у «Костра» — сопло, у «Ткацкого» — катушка), а грейд
   добавляет отделку: точный получает кант, штучный — клеймо, утраченный —
   патину и скол, несбыточный — свечение изнутри. */
function drawNodeIcon(c,node,S){
  const r=rng(node.seed),F=NODE_FAMS.find(f=>f.id===node.fam)||NODE_FAMS[0];
  const col=hex2rgb(F.col),gc=hex2rgb(node.col);
  const k=S/40;                                  // рисуем в единицах 40×40
  c.save();c.scale(k,k);
  /* тело: многоугольник с числом граней от семьи — узел должен быть предметом,
     а не иконкой из шрифта */
  const sides=4+(NODE_FAMS.indexOf(F)%5);
  const rad=13+r()*2.5;
  const body=[];
  for(let i=0;i<sides;i++){
    const a=i/sides*TAU-Math.PI/2;
    const rr=rad*(.86+r()*.28);
    body.push([Math.cos(a)*rr,Math.sin(a)*rr]);
  }
  c.beginPath();
  body.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
  c.closePath();
  const g=c.createLinearGradient(-rad,-rad,rad,rad);
  g.addColorStop(0,rgba(mixc(col,[255,255,255],.35),.95));
  g.addColorStop(.55,rgba(mixc(col,[12,16,24],.45),.98));
  g.addColorStop(1,rgba(mixc(col,[6,10,16],.7),.98));
  c.fillStyle=g;c.fill();
  c.strokeStyle=rgba(mixc(col,[255,255,255],.5),.55);c.lineWidth=1.2;c.stroke();
  /* нутро по семье: одна деталь, которая опознаётся с одного взгляда */
  c.strokeStyle=rgba(col,.8);c.lineWidth=1.6;
  /* Каждой семье своя деталь. В первом проходе семьи делили рисунок парами,
     и «Ковчег» было не отличить от «Колодца»: десять наборов — десять нутр. */
  if(F.id==="ark"){                                     // обод с перемычками
    c.beginPath();c.arc(0,0,7.5,0,TAU);c.stroke();
    for(let i=0;i<4;i++){const a=i*TAU/4+.4;
      c.beginPath();c.moveTo(Math.cos(a)*3,Math.sin(a)*3);
      c.lineTo(Math.cos(a)*7.5,Math.sin(a)*7.5);c.stroke();}
  }else if(F.id==="pyre"){                              // сопло с огнём
    c.beginPath();c.moveTo(-6,7);c.lineTo(-2.5,-6);c.lineTo(2.5,-6);c.lineTo(6,7);
    c.closePath();c.stroke();
    c.fillStyle=rgba(mixc(col,[255,236,190],.6),.75);
    c.beginPath();c.moveTo(-2.6,-6);c.lineTo(0,-11);c.lineTo(2.6,-6);c.closePath();c.fill();
  }else if(F.id==="moth"){                              // два крыла
    for(const s of [1,-1]){
      c.beginPath();c.moveTo(0,2);c.lineTo(s*9,-6);c.lineTo(s*4,4);c.closePath();c.stroke();
    }
  }else if(F.id==="well"){                              // колодец: кольца и дно
    for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,3+i*3.2,0,TAU);c.stroke();}
    c.fillStyle=rgba(col,.85);c.beginPath();c.arc(0,0,1.6,0,TAU);c.fill();
  }else if(F.id==="loom"){                              // катушка на валу
    c.beginPath();c.moveTo(0,-8);c.lineTo(0,8);c.stroke();
    for(let i=-1;i<=1;i++){
      c.beginPath();c.ellipse(0,i*5,6,2.2,0,0,TAU);c.stroke();
    }
  }else if(F.id==="cair"){                              // кладка кургана
    for(let rr=0;rr<3;rr++)for(let cc=0;cc<2;cc++){
      const w=6,h=3.4;
      c.strokeRect(-6+cc*w+(rr%2?2:0),-5+rr*h,w-1,h-1);
    }
  }else if(F.id==="echo"){                              // волны из точки
    c.fillStyle=rgba(col,.9);c.beginPath();c.arc(-4,0,1.8,0,TAU);c.fill();
    for(let i=0;i<3;i++){c.beginPath();c.arc(-4,0,4+i*3.4,-1,1);c.stroke();}
  }else if(F.id==="veil"){                              // складка
    c.beginPath();
    for(let i=0;i<=6;i++)c.lineTo(-8+i*2.7,(i%2?-1:1)*4.5);
    c.stroke();
    c.beginPath();
    for(let i=0;i<=6;i++)c.lineTo(-8+i*2.7,(i%2?-1:1)*4.5+5);
    c.stroke();
  }else if(F.id==="kiln"){                              // под печи: арка и решётка
    c.beginPath();c.arc(0,3,7,Math.PI,0);c.stroke();
    for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*4,3);c.lineTo(i*4,-3);c.stroke();}
  }else{                                                // прилив: волна
    for(let k2=0;k2<2;k2++){
      c.beginPath();
      for(let x=-8;x<=8;x+=1.6)c.lineTo(x,Math.sin(x*.45+k2*1.6)*3+k2*4-2);
      c.stroke();
    }
  }
  /* отделка по грейду: редкость видна на самой вещи, а не только в подписи */
  if(node.grade!=="plain"){
    c.strokeStyle=rgba(gc,.85);c.lineWidth=1;
    c.beginPath();
    body.forEach((p,i)=>{const q=[p[0]*.78,p[1]*.78];i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});
    c.closePath();c.stroke();
  }
  if(node.grade==="single"||node.grade==="lost"||node.grade==="never"){
    c.fillStyle=rgba(gc,.9);                            // клеймо
    c.beginPath();c.arc(rad*.55,-rad*.55,2.2,0,TAU);c.fill();
  }
  if(node.grade==="lost"){                              // патина и скол
    c.fillStyle="rgba(0,0,0,.3)";
    c.beginPath();c.moveTo(-rad*.7,rad*.2);c.lineTo(-rad*.2,rad*.75);
    c.lineTo(-rad*.75,rad*.6);c.closePath();c.fill();
  }
  if(node.grade==="never"){                             // свечение изнутри
    const gl=c.createRadialGradient(0,0,1,0,0,rad*1.5);
    gl.addColorStop(0,rgba(gc,.5));gl.addColorStop(1,rgba(gc,0));
    c.fillStyle=gl;c.beginPath();c.arc(0,0,rad*1.5,0,TAU);c.fill();
  }
  c.restore();
}
/* элемент для списка: канва вместо цветного кружка */
function nodeIconEl(node,size){
  const cn=document.createElement("canvas");
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cn.width=size*dpr;cn.height=size*dpr;
  cn.style.cssText="width:"+size+"px;height:"+size+"px;flex:0 0 auto;line-height:0";
  const c=cn.getContext("2d");
  c.setTransform(dpr,0,0,dpr,0,0);
  c.translate(size/2,size/2);
  drawNodeIcon(c,node,size);
  return cn;
}
/* ── венцы на корабле ──
   Венец работал, но не показывался нигде, кроме экрана наборов: сотня узлов
   ради строчки в списке. Теперь собранный венец висит на корпусе — маленький
   знак у кормы, свой на каждый набор, и их видно в полёте. Рисуется только на
   ВАШЕМ корабле: это ваша заслуга, а не свойство корпуса. */
function drawCrowns(h,id){
  if(id!==G.shipId||!G.crowns)return;
  const list=NODE_FAMS.filter(f=>G.crowns[f.id]);
  if(!list.length)return;
  /* Наградная колодка вдоль борта, а не россыпь у кормы: ромбики впритык к
     обшивке читались мусором на корпусе. Планка даёт им основание, и знаки
     сразу опознаются как знаки. */
  const x0=h.tail+5, step=4.6;
  const rows=[[],[]];
  list.forEach((F,i)=>rows[i%2].push(F));
  rows.forEach((row,s0)=>{
    if(!row.length)return;
    const s=s0?1:-1;
    const y=s*(h.tailW*.5+2.6);
    const w=row.length*step;
    ctx.fillStyle="rgba(0,0,0,.45)";
    ctx.fillRect(x0-1.6,y-1.9,w+1.6,3.8);
    ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=.5;
    ctx.strokeRect(x0-1.6,y-1.9,w+1.6,3.8);
    row.forEach((F,k)=>{
      const col=hex2rgb(F.col);
      const x=x0+k*step+step*.5-.6;
      const pu=.65+.35*Math.sin(G.t*.06+k*1.3+s0);
      ctx.fillStyle=rgba(mixc(col,[255,255,255],.4),.95*pu);
      ctx.beginPath();
      ctx.moveTo(x,y-1.4);ctx.lineTo(x+1.5,y);ctx.lineTo(x,y+1.4);ctx.lineTo(x-1.5,y);
      ctx.closePath();ctx.fill();
    });
  });
  /* общий отблеск: чем больше венцов, тем заметнее корабль в темноте */
  const gl=ctx.createRadialGradient(x0,0,1,x0,0,7+list.length*2.2);
  gl.addColorStop(0,rgba(hex2rgb(list[0].col),.14));
  gl.addColorStop(1,rgba(hex2rgb(list[0].col),0));
  ctx.fillStyle=gl;
  ctx.beginPath();ctx.arc(x0,0,7+list.length*2.2,0,TAU);ctx.fill();
}
