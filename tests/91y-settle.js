/* ══════════════ посёлок: дар, а не приказ ══════════════ */
/* Сторож замысла, а не арифметики. Посёлок стоит ровно на одном отличии от
   своей базы — у игрока нет власти, — и все проверки ниже об этом: выбрать
   постройку нельзя ни одной дорогой, кредитов он не платит, растёт лениво и с
   потолком офлайна, а до третьей ступени его нет на карте фактора вовсе. */
TEST_SUITES.push(()=>suite("посёлок: дар, а не приказ",()=>{
  resetWorld();
  /* ни одна дорога наружу не даёт выбрать постройку: у settleGive есть ресурс,
     но нет постройки, а settleRaise игроком не зовётся ниоткуда */
  const src=String(settleGive)+String(settleAsk);
  ok(src.indexOf("built.push")<0,"дар и просьба сами ничего не строят");
  for(const b of SETTLE_BUILD){
    ok(b.diet&&RES[b.diet],"постройка «"+b.ru+"» кормится настоящим ресурсом");
    ok(b.give&&RES[b.give],"постройка «"+b.ru+"» платит настоящим товаром");
  }
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  ok(!!p,"планета для проверки нашлась");
  const S=settleMake(p);
  ok(!!settleAt(G.sx,G.sy),"посёлок лёг в разрежённую карту по «sx,sy»");
  eq(S.stage,1,"начинается с первой ступени");
  eq(S.built.length,0,"и без единой постройки");
}));

TEST_SUITES.push(()=>suite("посёлок: рацион решает, чем он станет",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  const S=settleMake(p);
  /* кормим одним: через достаточное время он поднимает то, что ест */
  G.cargo.organics=400;
  const gave=settleGive(S,"organics",400);
  ok(gave>0,"дар принят: ×"+gave);
  eq(G.cargo.organics,400-gave,"отданное ушло из трюма");
  ok(S.diet.organics===gave,"рацион записан");
  S.last=Date.now()-6*3600*1000;              // шесть часов их жизни
  settleTick(S);
  ok(S.built.length>0,"за шесть часов еды посёлок что-то поднял: "+S.built.length);
  const fed=S.built.filter(k=>SETTLE_BY_K[k].diet==="organics").length;
  ok(fed>0,"и это то, чем его кормили");
  /* потолок офлайна: год отсутствия не равен году роста */
  const S2=settleMake(p);
  S2.built.length=0;S2.fed=0;S2.stock={};S2.diet={};
  G.cargo.iron=600;settleGive(S2,"iron",600);
  S2.last=Date.now()-365*24*3600*1000;
  settleTick(S2);
  ok(S2.built.length<=Math.ceil(600/SETTLE_STEP)+1,
     "год отсутствия не растит больше, чем съедено: "+S2.built.length);
}));

TEST_SUITES.push(()=>suite("посёлок: платит товаром и не всегда",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  const S=settleMake(p);
  const cr=G.credits;
  G.cargo.iron=400;settleGive(S,"iron",400);
  S.last=Date.now()-6*3600*1000;settleTick(S);
  S.asked=0;S.mood=90;
  const got=settleAsk(S);
  eq(G.credits,cr,"посёлок не платит кредитами никогда");
  ok(got>=0,"ответ на просьбу — число вещей: "+got);
  /* дважды подряд не спрашивают */
  const again=settleAsk(S);
  eq(again,0,"второй раз сразу — ничего");
  /* в плохом настроении не дают вовсе */
  S.asked=0;S.mood=10;
  eq(settleAsk(S),0,"в плохом настроении не дают");
}));

TEST_SUITES.push(()=>suite("посёлок: до третьей ступени его нет для барж",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  const S=settleMake(p);
  S.stage=1;eq(settleStop(S),null,"первая ступень фактору не видна");
  S.stage=2;eq(settleStop(S),null,"вторая тоже");
  S.stage=3;
  const st=settleStop(S);
  if(G.sys.station)eq(st,null,"со своей станцией посёлок в маршрут не лезет");
  else{
    ok(!!st,"с третьей ступени посёлок — остановка");
    ok(!!st.station.prices,"у остановки есть прейскурант");
  }
  /* речь: только глифы и понятые слова, ничего переведённого сверх словаря */
  const line=settleLine(S,1);
  ok(line.length>0,"посёлок отвечает строкой");
  const vocab=loreVocab();
  for(const w of line.split(" ")){
    const glyphOnly=[...w].every(ch=>SETTLE_GLYPH.indexOf(ch)>=0);
    ok(glyphOnly||vocab.indexOf(w)>=0,"слово «"+w+"» либо глифы, либо из словаря");
  }
}));

TEST_SUITES.push(()=>suite("посёлок: слово — это рычаг, а не строчка лора",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  const S=settleMake(p);
  eq(settleWords(S).length,0,"без словаря просить нечего словами");
  /* даём посёлку научиться делать лёд, а игроку — слово «вода» */
  S.built=["weir","weir","weir"];S.stage=2;S.stock={ice:200};S.mood=95;
  const word=Object.keys(SETTLE_WORD).find(w=>SETTLE_WORD[w]==="ice");
  const R=LORE.find(x=>x.word===word);
  if(R&&!loreHas(R.id))loreList().push(R.id);
  if(R){
    ok(settleWords(S).indexOf(word)>=0,"понятое слово стало просьбой: "+word);
    S.asked=0;G.cargo.ice=0;
    const got=settleAsk(S,word);
    ok(got>0,"названное принесло товар: ×"+got);
    ok(G.cargo.ice>0,"и это именно то, что просили");
  }
  /* слово, которого посёлок не умеет делать, просьбой не становится */
  ok(settleWords(S).every(w=>settleMakes(S).indexOf(SETTLE_WORD[w])>=0),
     "просить можно только то, что они умеют");
}));

TEST_SUITES.push(()=>suite("посёлок: переживает сохранение",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>SETTLE_ON.indexOf(x.type)>=0)||G.sys.planets[0];
  const S=settleMake(p);
  G.cargo.silicon=300;settleGive(S,"silicon",300);
  S.last=Date.now()-5*3600*1000;settleTick(S);
  const built=S.built.length,mood=Math.round(S.mood);
  applySave(snapshot());
  const R=settleAt(G.sx,G.sy);
  ok(!!R,"посёлок пережил snapshot/applySave");
  eq(R.built.length,built,"постройки на месте");
  eq(Math.round(R.mood),mood,"настроение на месте");
  ok(R.diet.silicon>0,"рацион помнится");
}));
