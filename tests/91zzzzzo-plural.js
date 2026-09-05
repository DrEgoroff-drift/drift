/* ══════════════ русское число (M357) ══════════════
   «1 станция получили», «21 ЛЕТ», «5 суток» против «1 суток» — согласование
   числительного с существительным ломается тише всего, что есть в игре: текст
   на месте, цифра верная, а фраза кривая. Читает это только человек, и только
   если попадёт на нужное число: ошибка живёт на 11–14 и на 21, 22, 25, куда
   тестами никто не заходил.

   Здесь два слоя.

   1. Правило само по себе. `pl3` — одна честная функция на всю игру; если
      сломается она, поедут все счётчики разом. Проверяется по всей сотне,
      включая 11–14 (всегда «много») и 111–114 (тоже «много», классическая
      ошибка «сто одиннадцать прыжок»).

   2. Текст, который игра НАПИСАЛА САМА. Набирается корпус: журнал за прогон по
      сценам плюс все доски стола и станции. В нём ищется «число + слово», и
      слово раскладывается по разряду числительного. Одна и та же форма не
      может стоять и после «1», и после «5»: «сутки» — либо «1 сутки», либо
      «5 суток», но не то и другое одним словом. Такое совпадение и есть
      несогласование — найденное без словаря, на самом тексте игры. */

/* разряд числительного: 1 — «прыжок», 2 — «прыжка», 5 — «прыжков» */
function plClass(n){
  const m=Math.abs(n)%100,d=m%10;
  if(m>=11&&m<=14)return 5;
  if(d===1)return 1;
  if(d>=2&&d<=4)return 2;
  return 5;
}
/* сокращения не склоняются: «5 кр», «12 ед», «3 пк» — это не существительные */
const PL_SKIP=new Set(["кр","ед","пк","мин","сек","ч","км","м","шт","т","г","дн","мм","гц","из","и","на","по","за","до","от","к","в","с"]);

TEST_SUITES.push(() => suite("число: правило склонения держит одиннадцать и сто одиннадцать", () => {
  const one="прыжок",few="прыжка",many="прыжков";
  const bad=[];
  const want=n=>({1:one,2:few,5:many})[plClass(n)];
  for(let n=0;n<=130;n++){
    const got=pl3(n,one,few,many);
    if(got!==want(n))bad.push(n+": «"+got+"», а надо «"+want(n)+"»");
  }
  /* и отрицательные: время «−1 сутки» тоже бывает */
  for(const n of [-1,-2,-5,-11,-21])
    if(pl3(n,one,few,many)!==want(n))bad.push(n+": «"+pl3(n,one,few,many)+"»");
  eq(bad.slice(0,4).join(" ;; "),"","pl3 верен на всей сотне, включая 11–14 и 111–114");
  /* и на важных числах прямо словами — чтобы провал читался, а не считался */
  eq(pl3(1,"сутки","суток","суток"),"сутки","1 — сутки");
  eq(pl3(11,"прыжок","прыжка","прыжков"),"прыжков","11 — прыжков, а не прыжок");
  eq(pl3(21,"год","года","лет"),"год","21 — год, а не лет");
  eq(pl3(112,"метр","метра","метров"),"метров","112 — метров");
  eq(pl3(102,"метр","метра","метров"),"метра","102 — метра");
}));

TEST_SUITES.push(() => suite("число: в тексте игры одна форма слова не стоит после разных числительных", () => {
  /* собираем корпус жизнью: журнал за прогон по сценам и все доски экранов */
  const texts=[];
  for(const sc of lookScenes()){
    resetWorld();
    let set=true;
    try{ set=sc.set()!==false; }catch(e){ continue; }
    if(!set||G.mode==="none")continue;
    try{ if(typeof e2eHands==="function")e2eHands(sc.id.length+5,50,()=>stepWorld(1)); }catch(e){ }
    for(const row of (G.log||[]))texts.push(String(row.s||""));
    texts.push(String(G.prompt||""),String(G.msg||""));
  }
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  const grab=(sel)=>{const b=document.querySelector(sel);if(b)texts.push(String(b.textContent||""));};
  if(typeof tableToggle==="function"){
    tableToggle(true);
    for(const t of [...document.querySelectorAll("#tableTabs button")].map(x=>x.dataset.tab)){
      try{ tableSetTab(t); }catch(e){ continue; }
      grab("#tableBody");
    }
    tableToggle(false);
  }
  if(G.sys.station&&typeof openStation==="function"){
    G.st=G.sys.station;G.mode="dock";
    try{ openStation(); }catch(e){ }
    for(const t of [...document.querySelectorAll("#stTabs button")].map(x=>x.dataset.tab)){
      try{ tab=t;renderTab(); }catch(e){ continue; }
      grab("#stBody");
    }
    if(typeof closeStation==="function")try{closeStation();}catch(e){}
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  for(const row of (G.log||[]))texts.push(String(row.s||""));
  resetWorld();

  const corpus=texts.join("\n");
  ok(corpus.length>4000,"корпус текста игры: "+Math.round(corpus.length/1024)+" КБ");
  /* «12 прыжков», «1 сутки» — число и слово подряд */
  const RE=/(\d+)\s+([а-яё]{2,})/g;
  /* Три вычета, каждый по делу:
     — косвенный падеж числительное не склоняет: «в 2 секторах» и «в 5
       секторах» верны оба, форму там задаёт предлог. Смотрим слово прямо
       перед числом;
     — «+21 бак» — это не «двадцать один бак», а прибавка к прибору: после
       знака идёт величина, а не счёт;
     — вещественные и множественные-только («данных») одной формой и живут. */
  const PREP=new Set(["в","во","на","за","с","со","из","к","ко","по","о","об","при",
    "под","над","до","от","для","около","через","между","перед"]);
  const MASS=new Set(["данных","топлива","льда","руды","воды","воздуха"]);
  const seen={},where={};        /* форма → разряды и пример строки */
  let pairs=0,m;
  while((m=RE.exec(corpus))){
    const n=+m[1],w=m[2];
    if(PL_SKIP.has(w)||MASS.has(w))continue;
    if(!(n>=0))continue;
    const head=corpus.slice(Math.max(0,m.index-24),m.index);
    const sign=head.slice(-1);
    if(sign==="+"||sign==="-"||sign==="−")continue;               /* прибавка, не счёт */
    const words=head.toLowerCase().match(/[а-яё]+/g);
    if(words&&PREP.has(words[words.length-1])&&/[а-яё]\s*$/i.test(head))continue;
    pairs++;
    (seen[w]||(seen[w]=new Set())).add(plClass(n));
    (where[w]||(where[w]={}))[plClass(n)]=corpus.slice(Math.max(0,m.index-16),m.index+w.length+2).replace(/\s+/g," ").trim();
  }
  ok(pairs>=60,"пар «число + слово» в корпусе: "+pairs);
  const bad=[];
  for(const w in seen){
    const cls=[...seen[w]];
    if(cls.length<2)continue;
    /* форма, стоящая и после «1», и после «5», — несогласование по определению */
    bad.push("«"+w+"» после разрядов "+cls.sort().join(" и ")+": "+
      cls.map(c=>"«"+(where[w][c]||"?")+"»").join(" против "));
  }
  eq(bad.slice(0,5).join(" ;; "),"","каждая форма слова стоит только при своём числительном"+
    (bad.length?" (всего "+bad.length+")":""));
}));
