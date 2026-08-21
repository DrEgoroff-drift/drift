/* ══════════════ отчёт «Долгого Хода»: сто кусков ══════════════ */
/* Тот же сторож, что нашёл 500 недостижимых узлов на M91 и проверял сотню
   редкостей: таблица закрыта, адреса настоящие, недостижимых нет. */
TEST_SUITES.push(()=>suite("зарубки: у каждого куска есть адрес",()=>{
  resetWorld();
  eq(LORE.length,100,"в таблице ровно сто кусков");
  const ids={};let words=0,noGive=0;
  for(const R of LORE){
    ok(!ids[R.id],"id уникален: "+R.id);ids[R.id]=1;
    ok(LORE_CHAP_IX[R.chap]!==undefined,"глава «"+R.chap+"» настоящая");
    ok(R.ru&&R.ru.length>8,"у куска есть строка отчёта");
    if(R.word)words++;
    if(R.give==="word"&&!R.word)noGive++;
  }
  eq(noGive,0,"кусок «слово» всегда несёт слово");
  ok(words>=25&&words<=35,"слов примерно тридцать на сотню: "+words);
  /* все восемь глав населены, и ни одна не требует больше двух третей своих */
  for(const c of LORE_CHAP){
    const all=LORE_BY_CHAP[c.id]||[];
    ok(all.length>=8,"глава «"+c.ru+"» не пуста: "+all.length);
    const ch=loreChapter(c.id);
    ok(ch.need<=Math.ceil(all.length*2/3),"глава «"+c.ru+"» читается с двух третей");
  }
  /* достижимость: пул один на все сто, значит развёртка ключей достаёт каждый */
  const hit={};
  for(let k=1;k<4000;k++){const R=loreAtPlace(k);if(R)hit[R.id]=1;}
  eq(Object.keys(hit).length,100,"развёртка ключей достаёт все сто кусков");
  /* то же место — тот же ответ, всегда: перезагрузкой не подобрать */
  eq(loreAtPlace(12345).id,loreAtPlace(12345).id,"место отвечает одинаково");
  /* ключ бывает строкой (спутник, подглядка): разные строки — разные места,
     иначе все свидетели одного рода отдают один и тот же кусок и замолкают */
  eq(loreAtPlace("sat:7").id,loreAtPlace("sat:7").id,"строковое место отвечает одинаково");
  const shit={};
  for(let k=0;k<400;k++){const R=loreAtPlace("sat:"+k);if(R)shit[R.id]=1;}
  ok(Object.keys(shit).length>50,
     "четыре сотни спутников раскладываются по куску: "+Object.keys(shit).length);
}));

TEST_SUITES.push(()=>suite("зарубки: кусок платит сразу и только раз",()=>{
  resetWorld();
  const cr=G.credits;
  /* берём подряд полсотни разных мест: ни одно не даёт кредитов и ни одно
     не отдаёт кусок дважды */
  let taken=0;
  for(let k=1;k<=200&&taken<50;k++){
    const R=loreTake(k);
    if(R){taken++;ok(loreHas(R.id),"взятый кусок записан: "+R.id);}
  }
  ok(taken>=20,"полсотни мест дали куски: "+taken);
  eq(G.credits,cr,"куски не дали ни кредита");
  /* повтор того же места пуст */
  const first=loreAtPlace(1);
  eq(loreTake(1),null,"то же место второй раз пусто");
  ok(loreHas(first.id),"а первый ответ на месте");
  eq(loreCount(),loreList().length,"счётчик и список сходятся");
  /* словарь не выдумывает слов */
  for(const w of loreVocab())ok(LORE_WORDS.indexOf(w)>=0,"слово из словаря: "+w);
}));

TEST_SUITES.push(()=>suite("зарубки: адрес вне радиуса прыжка",()=>{
  resetWorld();
  const st=stat();
  let checked=0;
  for(let k=1;k<=400&&checked<12;k++){
    const R=loreAtPlace(k);
    if(R.give!=="addr"||loreHas(R.id))continue;
    const before=loreMarks().length;
    loreTake(k);
    if(loreMarks().length===before)continue;   // «направление стёрлось» — честный отказ
    const m=loreMarks()[loreMarks().length-1];
    const d=Math.hypot(m.sx-G.sx,m.sy-G.sy);
    ok(d>st.jump+.02,"адрес недостижим сегодня: "+d.toFixed(2)+" при прыжке "+st.jump.toFixed(2));
    ok(starAt(m.sx,m.sy),"в адресе есть звезда");
    const s=getSystem(m.sx,m.sy);
    ok(s.station||(s.planets&&s.planets.length),"в адресе есть куда идти");
    checked++;
  }
  ok(checked>=5,"проверено адресов: "+checked);
}));

TEST_SUITES.push(()=>suite("зарубки: камень на планете — настоящее место",()=>{
  resetWorld();
  ok(POI_KINDS.some(K=>K.k==="obelisk"),"зарубка есть среди видов POI");
  ok(POI_FIND.obelisk,"у зарубки есть свой осмотр");
  /* осмотр зарубки действительно отдаёт кусок, а не данные молча */
  G.poiSeen={};G.loreFound=[];G.loreMarks=[];
  const n0=loreCount();
  poiInspect({k:"obelisk",ru:"ЗАРУБКА",seed:4242});
  ok(loreCount()>n0,"осмотр зарубки дал кусок отчёта");
  /* прочитанная зарубка не молчит, но и не отдаёт второй кусок */
  const n1=loreCount();
  G.poiSeen={};
  poiInspect({k:"obelisk",ru:"ЗАРУБКА",seed:4242});
  eq(loreCount(),n1,"та же зарубка второго куска не даёт");
  /* глава складывается и считается */
  G.loreFound=[];
  const c=LORE_CHAP[0].id, all=LORE_BY_CHAP[c];
  for(const R of all)loreList().push(R.id);
  ok(loreChapter(c).read,"глава с полным набором прочитана");
  G.loreFound=all.slice(0,Math.ceil(all.length*2/3)).map(R=>R.id);
  ok(loreChapter(c).read,"двух третей главы хватает");
  G.loreFound=all.slice(0,2).map(R=>R.id);
  ok(!loreChapter(c).read,"двух кусков не хватает");
}));

/* ── доска отчёта ──
   Читальня обязана быть честной: показывать ровно собранное, держать пропуски
   пропусками и не открывать замечание главы раньше, чем глава сложилась. */
TEST_SUITES.push(()=>suite("отчёт: доска, на которой это читают",()=>{
  resetWorld();
  G.loreFound=[];G.loreMarks=[];
  const box=document.getElementById("lorelist");
  ok(!!box,"доска есть в разметке");
  renderLoreBoard();
  const rows=()=>Array.from(box.querySelectorAll(".li"));
  const txt=()=>rows().map(r=>r.querySelector("span").textContent).join("\n");
  /* пустая доска: сто мест, ни одного куска */
  eq(rows().filter(r=>r.classList.contains("gap")&&r.querySelector("em").textContent).length,100,
     "на пустой доске сто пропусков");
  ok(txt().indexOf("СОБРАНО 0 ИЗ 100")>=0,"шапка считает от нуля");
  for(const C of LORE_CHAP)
    ok(txt().indexOf(C.note)<0,"замечание главы «"+C.ru+"» закрыто до того, как она сложилась");
  /* кусок на доске появляется своим текстом и на своём месте */
  const R=LORE_BY_CHAP[LORE_CHAP[0].id][0];
  loreList().push(R.id);
  renderLoreBoard();
  ok(txt().indexOf(R.ru)>=0,"собранный кусок читается дословно");
  eq(rows().filter(r=>r.classList.contains("gap")&&r.querySelector("em").textContent).length,99,
     "пропусков стало на один меньше");
  /* глава сложилась — открылось замечание, и только оно */
  const all=LORE_BY_CHAP[LORE_CHAP[0].id];
  G.loreFound=all.slice(0,Math.ceil(all.length*2/3)).map(x=>x.id);
  renderLoreBoard();
  ok(txt().indexOf(LORE_CHAP[0].note)>=0,"замечание сложившейся главы открылось");
  ok(txt().indexOf(LORE_CHAP[1].note)<0,"замечание соседней главы осталось закрытым");
  /* доска ничего не досказывает: каждая непустая строка — либо шапка, либо
     заголовок, либо ровно то, что собрано */
  const known=new Set();
  for(const x of loreList()){const r=LORE_BY_ID[x];if(r)known.add(r.ru);}
  for(const r of rows()){
    const s=r.querySelector("span").textContent;
    if(r.classList.contains("gap")||r.classList.contains("chap")||
       r.classList.contains("head")||r.classList.contains("note")||
       r.classList.contains("vocab"))continue;
    if(/^сектор /.test(s)||/^ни /.test(s))continue;
    ok(known.has(s.split(" · «")[0]),"строка на доске подобрана игроком: "+s.slice(0,40));
  }
  /* словарь и адреса считаются по факту, а не по обещаниям */
  eq(loreVocab().length,new Set(loreList().map(x=>LORE_BY_ID[x]&&LORE_BY_ID[x].word)
     .filter(Boolean)).size,"словарь на доске равен собранному");
  toggleLoreBoard(true);
  ok(document.getElementById("lorewin").classList.contains("open"),"доска открывается");
  toggleLoreBoard(false);
  ok(!document.getElementById("lorewin").classList.contains("open"),"и закрывается");
}));
