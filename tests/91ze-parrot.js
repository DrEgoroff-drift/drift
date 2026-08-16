/* ══ M116: трепло говорит только то, что слышало ══
   Сторож замысла: каждая строка — след настоящего события; выдумок нет;
   расшифровка сверяется со словарём НА МОМЕНТ ЧТЕНИЯ, а не находки; одно новое
   слово перечитывает всё сохранённое. */
TEST_SUITES.push(()=>suite("трепло: говорит только то, что слышало",()=>{
  resetWorld();
  ok(!parrotHas(),"птицы в новом мире нет");
  eq(heardAll().length,0,"и помнить нечего");
  eq(heardAdd("price",{sx:1,sy:1}),null,"без птицы строка не заводится вовсе");

  /* птица достаётся из чужих вещей, и у вещей есть хозяин */
  const P=parrotFind(4242,"борта «Проба»");
  ok(!!P,"птица нашлась");
  ok(!!P.who,"у неё есть прежний хозяин: покойник был");
  ok(!parrotFind(99,"кто-то ещё"),"вторая птица за прохождение не заводится");

  /* цены: слышит у прилавка, повторяет там, где вас нет */
  G.sys=nearestStation(0,0);G.sx=G.sys.sx;G.sy=G.sys.sy;
  const h=heardPrices(G.sys);
  ok(!!h,"цены станции услышаны");
  eq(heardPrices(G.sys),null,"дважды одну и ту же станцию не запоминает");
  delete G.market[G.sys.key];
  ok(heardUse(h),"цены повторены");
  ok(!!G.market[G.sys.key],"и рынок открылся без перелёта");
  ok(!heardUse(h),"второй раз та же строка не платит");

  /* пиджин: хранится номерами слов и не читается без словаря */
  G.loreFound=[];
  const ph=heardPidgin(777,G.sx,G.sy);
  ok(!!ph&&ph.words.length>0,"фраза сохранена словами-номерами");
  ok(ph.words.every(i=>typeof i==="number"),"именно номерами, а не текстом");
  ok(!heardCanRead(ph),"без словаря она не читается");
  const shown=heardWordsRu(ph).join("");
  ok(ph.words.every(i=>shown.indexOf(LORE_WORDS[i%LORE_WORDS.length])<0),
     "и в глифах не проступает ни одного слова");
  eq(heardReread(),0,"перечитывание без словаря ничего не открывает");

  /* словарь пришёл — и оживил СТАРУЮ строку, а не только новую */
  for(const i of ph.words){
    const w=LORE_WORDS[i%LORE_WORDS.length];
    const rec=LORE.find(R=>R.word===w&&!loreHas(R.id));
    if(rec)loreList().push(rec.id);
  }
  const need=ph.words.map(i=>LORE_WORDS[i%LORE_WORDS.length]);
  const vocab=loreVocab();
  if(need.every(w=>vocab.indexOf(w)>=0)){
    ok(heardCanRead(ph),"со словами фраза читается");
    eq(heardReread(),1,"и перечитывание открыло именно её");
    ok(ph.read,"строка помечена понятой");
    eq(heardReread(),0,"дважды одну строку не открывают");
    const ru=heardWordsRu(ph);
    ok(ru.every(w=>LORE_WORDS.indexOf(w)>=0),"теперь это слова, а не глифы");
  }

  /* показания против вас: ляпает один раз и стоит репутации */
  const before=repAt(G.sys);
  heardYours("«Проба» больше не выйдет на связь",G.sx,G.sy);
  const y=heardAll().find(x=>x.kind==="yours");
  ok(!!y,"услышанное у вас записано");
  for(let i=0;i<40&&!y.used;i++)heardBlurt(G.sys);
  ok(y.used,"рано или поздно птица ляпнула");
  ok(repAt(G.sys)<before,"и это стоило репутации там, где слышали");
  eq(heardBlurt(G.sys),null,"дважды одну и ту же фразу не выдаёт");

  /* сохранение: птица и память переживают перезапись, мусор чинится */
  const snap=snapshot();
  snap.heard.push({kind:"выдумка",note:"этого никто не слышал"});
  snap.heard.push({kind:"pidgin",words:[]});
  applySave(snap);
  ok(parrotHas(),"птица на месте");
  ok(heardAll().every(x=>x.kind==="price"||x.kind==="pidgin"||x.kind==="yours"),
     "строк неизвестного вида в памяти нет");
  ok(heardAll().every(x=>x.kind!=="pidgin"||(x.words&&x.words.length)),
     "и пустых фраз тоже");
  ok(heardAll().length<=HEARD_MAX,"птица помнит не больше своего предела");
}));
