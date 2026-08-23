/* ══════════════ расхождение времён: смещение к центру, никого днём, автомат, человек один раз ══════════════ */
TEST_SUITES.push(()=>suite("расхождение времён: хронометр уходит к ядру, посёлок без людей, сдача верная",()=>{
  resetWorld();
  const at=regionOfTheme("hours");ok(!!at,"область часов расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"chrono","прибор области — хронометр");
  eq(hoursDepthAt(0,0),0,"в начале координат области нет");
  eq(hoursOffset(),0,"и смещения нет");
  const ch0=instrRead().find(i=>i.id==="chrono");
  let edge=null;
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN&&!edge;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN&&!edge;y++)
    if(starAt(x,y)&&!(x===R.core.sx&&y===R.core.sy))edge={x,y};
  G.mode="system";G.running=true;
  /* окраина может быть пустой: узкий склон у ядра на краю области (06b) */
  if(edge){
    G.sx=edge.x;G.sy=edge.y;G.sys=getSystem(G.sx,G.sy);
    eq(hoursDepthHere(),1,"мы на окраине");
    const offE=hoursOffset();ok(offE>0&&offE<=10,"на окраине минуты ("+offE.toFixed(1)+")");
    let hit=0;for(let i=0;i<40;i++){const r=rng(hashi(i,7,9));if(hoursEtherLine(r))hit++;}
    ok(hit>0&&hit<40,"диспетчер говорит иногда, не всегда ("+hit+"/40)");
  }else ok(true,"окраина без склона — ядро у края области, проверяем только ядро");
  /* ядро: час на орбите, больше у посёлка */
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);
  eq(hoursDepthHere(),2,"мы в ядре");
  eq(hoursOffset(),60,"на орбите ядра — час");
  const chC=instrRead().find(i=>i.id==="chrono");
  ok(chC.dev>ch0.dev,"хронометр в ядре уходит сильнее, чем дома");
  const pc=hoursCorePlanet(G.sys);
  if(pc){
    ok(settleCanLive(pc),"планета ядра годится для посёлка");
    ok(hoursNobody(pc),"днём там никого");
    const tr=genTerrain(pc);
    G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    const cx=settleSpotX(pc,tr);
    G.surf.x=cx+2500;const far=hoursOffset();
    G.surf.x=cx;const near=hoursOffset();
    ok(near>far&&near>=230,"смещение растёт к посёлку ("+far.toFixed(0)+" → "+near.toFixed(0)+" мин)");
    const chN=instrRead().find(i=>i.id==="chrono");ok(chN.dev>chC.dev,"и стрелка это показывает");
    /* автомат */
    G.surf.x=cx+70;ok(hoursMachineHere(G.surf),"у автомата");
    G.credits=20;G.cargo.organics=0;
    ok(hoursMachine(),"монета принята");eq(G.credits,20-HOURS_COIN,"сдача верная");eq(G.cargo.organics,1,"паёк выдан");
    G.credits=0;ok(!hoursMachine(),"без монеты — ничего");
    /* отрисовка посёлка не падает ни днём, ни ночью */
    G.surf.x=cx;G.surf.cam=null;
    let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}
    ok(okDraw,"поверхность ядра рисуется");
  }
  /* человек — один раз, и это переживает сейв */
  G.hours.man=1;const s=snapshot();applySave(s);eq(G.hours.man,1,"факт хранится");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.surf=null;G.mode="system";
  eq(hoursOffset(),0,"дома смещения нет");
}));
