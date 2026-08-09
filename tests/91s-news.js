/* ══════════════ пересказ: за слухом стоит перемена ══════════════ */
/* Слух без перемены — обман, а соперник, закрывающий редкость навсегда, вешает
   планету (12n). Сторож проверяет и то и другое. */
TEST_SUITES.push(()=>suite("пересказ: слухи не врут",()=>{
  resetWorld();
  /* ── каждая перемена правит настоящее состояние ── */
  const seen={};
  for(let i=0;i<60;i++){
    const r=rng(hashi(i,0x5EED,3));
    for(const K of NEWS_KINDS){
      const before={mk:Object.keys(G.newsMarks).length};
      const out=K.apply(r);
      if(!out)continue;
      seen[K.id]=1;
      ok(!!out.ru&&out.ru.length>10,"у перемены «"+K.id+"» есть своя строчка");
      ok(isFinite(out.sx)&&isFinite(out.sy),"и настоящий адрес");
      ok(Object.keys(G.newsMarks).length>=before.mk,"метка знания легла на карту");
    }
  }
  for(const K of NEWS_KINDS)ok(seen[K.id],"перемена «"+K.id+"» вообще случается");

  /* ── метка карты действительно читается по секторам ── */
  const k=Object.keys(G.newsMarks)[0].split(",");
  ok(!!newsMarkAt(+k[0],+k[1]),"метка находится по своему сектору");

  /* ── соперник: перевозка, а не потеря ── */
  const held=Object.keys(G.rivals);
  ok(held.length>0,"соперники за столько поворотов кого-то унесли");
  const id=held[0],V=G.rivals[id];
  ok(!rareHas(id),"унесённой редкости у вас нет");
  ok(!!RARE_BY_ID[id],"но она осталась настоящим предметом таблицы");
  /* сотня из ста остаётся достижимой: у каждой унесённой есть адрес */
  for(const rid of held)ok(isFinite(G.rivals[rid].sx)&&isFinite(G.rivals[rid].sy),
    "у каждой унесённой редкости есть адрес");
  eq(RARE.length-Object.keys(G.rivals).length-rareCount()>0,true,
     "соперники никогда не забирают последнее");

  /* ── адрес достижим: он выходит в свой сектор и отдаёт унесённое ── */
  G.sx=V.sx;G.sy=V.sy;
  G.sys=getSystem(G.sx,G.sy);
  spawnPirates();
  const rv=G.pirates.filter(p=>p.rival===id);
  eq(rv.length,1,"в своём секторе соперник выходит навстречу");
  const cr=G.credits;
  killPirate(rv[0]);
  ok(rareHas(id),"разбитый соперник отдаёт то, что унёс");
  eq(G.credits,cr,"за него не платят наградой: он про предмет, а не про деньги");
  ok(!G.rivals[id],"и больше её не держит");

  /* ── место, откуда унесли, честно пусто, но не мертво ── */
  resetWorld();
  const R0=rareAtPlace("lair",12345);
  ok(!!R0,"у места есть своя редкость");
  G.rivals={};G.rivals[R0.id]={who:"Пекарь",sx:3,sy:4,t:Date.now()};
  eq(rareTake("lair",12345),null,"пока она у соперника, с места её не взять");
  ok(!rareHas(R0.id),"и в коллекцию она не попала");
  rivalYield(R0.id);
  ok(rareHas(R0.id),"зато у соперника её забирают");

  /* ── поворот мира считается по времени, а не каждый кадр ── */
  resetWorld();
  G.newsT=Date.now();
  eq(newsTick(),0,"без прошедшего времени мир не поворачивается");
  G.newsT=Date.now()-NEWS_EVERY*10;
  const made=newsTick();
  ok(made>0&&made<=NEWS_MAX_ROLL,"за длинное отсутствие — не больше трёх перемен: "+made);
  eq(G.news.length,made,"каждая перемена оставила слух");

  /* ── перезагрузка помнит и слухи, и адреса ── */
  const snap=snapshot();
  applySave(snap);
  eq(G.news.length,made,"слухи пережили сохранение");
  ok(Object.keys(G.newsMarks).length>0,"метки карты тоже");
}));
