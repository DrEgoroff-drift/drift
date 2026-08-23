/* ══════════════ медленный: выкладка, созревание, копия → продолжение → ошибка; горб на ленте ══════════════ */
TEST_SUITES.push(()=>suite("медленный: переписка с долиной — копия, продолжение, осмысленная ошибка; доказательство с ленты",()=>{
  resetWorld();
  const at=regionOfTheme("slow");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"chrono","прибор — хронометр");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  const pc=slowCorePlanet(G.sys);ok(!!pc,"у ядра есть твёрдая планета");
  if(!pc)return;
  const tr=genTerrain(pc);G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();
  const S=G.surf;S.x=slowSpotX(tr,pc);
  ok(slowHere(S),"стоим у колышка");
  for(const k of RES_KEYS)G.cargo[k]=0;
  ok(!slowLay(),"с пустым трюмом выложить нечего");
  G.cargo.iron=2;G.cargo.ice=1;
  ok(slowLay(),"выложили");eq(G.slow.fig.join(),"ice,iron","фигура — по единице каждого вида");
  eq(G.cargo.iron,1,"единица ушла");
  ok(!slowReady(),"ответ не созрел");eq(slowDrift(),0,"лента ровная");
  G.t+=CEL_DAY*SLOW_CYCLE;
  ok(slowReady(),"через цикл — созрел");ok(slowDrift()>.4,"горб на хронометре у колышка ("+slowDrift().toFixed(2)+")");
  S.x=slowSpotX(tr,pc)+1000;eq(slowDrift(),0,"вдали от колышка горба нет");S.x=slowSpotX(tr,pc);
  const ch=instrRead().find(i=>i.id==="chrono");ok(ch.dev>0,"стрелка это показывает");
  let rep=slowRead();eq(rep.join(),"ice,iron","первый ответ — копия");eq(G.slow.round,1,"обмен сосчитан");
  eq(G.slow.fig,null,"фигура снята");
  G.cargo.iron=1;G.cargo.ice=1;slowLay();G.t+=CEL_DAY*SLOW_CYCLE;
  rep=slowRead();eq(rep.join(),"ice,iron,ice","второй — продолжение");
  G.cargo.iron=1;G.cargo.ice=1;slowLay();G.t+=CEL_DAY*SLOW_CYCLE;
  rep=slowRead();ok(rep.length===4&&rep.slice(0,2).join()==="ice,iron"&&rep[3]!=="ice"&&rep[3]!=="iron","третий — добавила то, чего не клали ("+rep.join()+")");
  /* бросить — ничего не случится: ответ лежит */
  G.cargo.iron=1;slowLay();G.t+=CEL_DAY*SLOW_CYCLE*40;ok(slowReady(),"через двести часов ответ всё ещё лежит");
  let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}ok(okDraw,"долина рисуется");
  const s=snapshot();applySave(s);eq(G.slow.round,3,"обмены переживают сейв");eq(G.slow.fig.join(),"iron","и выложенное тоже");
}));
