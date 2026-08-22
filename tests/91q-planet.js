/* ══════════════ планета за полный набор ══════════════ */
/* Три вещи, которые легко сломать правкой: планета выдаётся только за сотню,
   она никогда не платит кредитами, и роутер баржи берёт её на равных со
   станцией. */
TEST_SUITES.push(()=>suite("планета: только за полный набор",()=>{
  resetWorld();
  /* ── ниже сотни не даётся ничего ── */
  G.rareFound=RARE.slice(0,99).map(R=>R.id);
  eq(rareCount(),99,"собрано девяносто девять");
  ok(!planetReady(),"девяносто девять — это не полный набор");
  eq(planetGrant(),null,"на девяноста девяти планета не выдаётся");
  eq(G.pnode,null,"узла нет");

  /* ── сотая выдаёт, и выдаёт ту планету, где стоим ── */
  G.rareFound=RARE.map(R=>R.id);
  const sys=G.sys||getSystem(G.sx,G.sy);
  ok(sys&&sys.planets.length,"в системе есть планеты");
  const p=sys.planets[0];
  const N=planetGrant(p);
  ok(!!N,"на сотне планета выдаётся");
  eq(N.key,p.key,"узлом стала та планета, где стояли");
  ok(N.res.length>0,"у узла есть свои товары");
  for(const k of N.res)ok(TRADE_KEYS.indexOf(k)>=0,"узел родит ходовой товар: "+k);
  eq(planetGrant(p),null,"вторую планету получить нельзя");

  /* ── кредитов узел не платит ── */
  const cr=G.credits,turn=G.home?G.home.turn:0;
  N.last=Date.now()-60*60000;                 // час производства
  planetTick();
  ok(planetStockSum()>0,"за час узел что-то родил");
  eq(G.credits,cr,"склад узла не превращается в кредиты");
  eq(G.home?G.home.turn:0,turn,"и в оборот дома не попадает");
  for(const k of N.res)ok(N.stock[k]<=PLANET_CAP+1e-6,"склад не растёт выше потолка");

  /* ── увезти можно только своими руками и только в своей системе ── */
  G.sx=N.sx+7;G.sy=N.sy+7;
  eq(planetHaul(),0,"из чужой системы не забрать");
  G.sx=N.sx;G.sy=N.sy;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const got=planetHaul();
  ok(got>0,"в своей системе груз берётся");
  eq(held(),got,"взятое лежит в трюме");
  ok(held()<=stat().cargoMax,"больше трюма не влезло");
  eq(G.credits,cr,"перевозка не начислила кредитов");

  /* ── роутер баржи знает узел ── */
  const stop=planetStop();
  ok(!!stop&&stop.key===N.sx+","+N.sy,"узел выдаёт остановку со своим ключом");
  ok(!!stop.station&&!!stop.station.prices,"у остановки есть прейскурант");
  ok(!!bargeSysAt(stop.key),"bargeSysAt принимает узел как остановку");
  const legs=bargeLegs();
  ok(legs.some(l=>l[0].key===stop.key||l[1].key===stop.key),
     "узел стоит в плечах маршрута наравне со станцией");

  /* ── баржа довозит ваш товар, а не покупает его ── */
  N.last=Date.now()-60*60000;planetTick();
  const before=planetStockSum();
  const b={from:N.sx+","+N.sy,to:"0,0",capName:"Тук",seed:1};
  const loaded=planetBargeLoad(b);
  ok(loaded>0,"баржа взяла товар с узла");
  ok(planetStockSum()<before,"склад узла на столько же уменьшился");
  eq(planetLoadSum(b),loaded,"груз лежит на барже целиком");
  const cr2=G.credits;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const took=planetTakeLoad(b);
  ok(took>0,"груз забирается в трюм");
  eq(G.credits,cr2,"и за него не платят и не платится");

  /* ── сохранение переживает перезагрузку ── */
  const snap=snapshot();
  applySave(snap);
  ok(!!G.pnode&&G.pnode.key===N.key,"узел пережил сохранение");
  eq(G.pnode.hauled,N.hauled,"счётчик увезённого сохранился");
}));

/* ── 0.87: кэш ломтей грунта и пещеры (18c-chunks) ── */
TEST_SUITES.push(()=>suite("растр: грунт и свод рисуются ломтями, а не каждый кадр",()=>{
  resetWorld();
  const p=landOnTestPlanet();
  const tr=G.surf.tr;
  drawSurface();
  ok(!!tr.chunks&&tr.chunks.map.size>0,"после кадра у террейна есть ломти");
  const n0=tr.chunks.map.size;
  drawSurface();drawSurface();
  eq(tr.chunks.map.size,n0,"повторный кадр ломтей не добавляет");
  ok(n0<=CHUNK_KEEP,"ломтей не больше потолка");
  G.surf.x+=CHUNK_W*3;drawSurface();
  ok(tr.chunks.map.size<=CHUNK_KEEP,"далёкие ломти вытесняются");
  for(const cn of tr.chunks.map.values())
    eq(cn.height,Math.round(tr.chunks.ch*DPR),"высота ломтя одна на всю полосу — иначе шов в градиенте");
  ok(typeof drawGroundGrass==="function","трава рисуется живой, поверх ломтей");
  /* пещера */
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();drawCave();
  ok(!!G.cave.chunks&&G.cave.chunks.map.size>0,"свод пещеры лежит в ломтях");
  G.cave=null;G.mode="surface";
  /* слои во весь экран */
  const a=screenLayer("t|1",()=>{ctx.fillStyle="#f00";ctx.fillRect(0,0,W,H);});
  const b=screenLayer("t|1",()=>{});
  ok(a===b,"слой с тем же ключом не перерисовывается");
  ok(ctx===MAIN_CTX,"после покраски слоя ctx возвращён на экран");
  /* авторазрешение */
  ok([0,1,1.5,2].includes(G.opts.gfx.res),"gfx.res имеет допустимое значение");
}));
