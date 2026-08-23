/* ══════════════ несогласие карт: дрожь на окраине, пропавшая система, карта, прячущая дом ══════════════ */
TEST_SUITES.push(()=>suite("несогласие карт: окраина дрожит, каждая пятая пропала, их карта прячет дом и возвращается",()=>{
  resetWorld();
  const at=regionOfTheme("charts");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"course","прибор — курсограф");
  ok(!chartsHidden(0,0),"дом на карте есть");
  eq(chartsJitter(0,0).join(),"0,0","дома карта не дрожит");
  let hid=0,jit=0,tot=0;
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN;y++){
    if(!starAt(x,y)||(x===R.core.sx&&y===R.core.sy))continue;tot++;
    if(chartsHidden(x,y))hid++;const j=chartsJitter(x,y);if(j[0]||j[1])jit++;
  }
  ok(jit===tot,"вся окраина дрожит ("+jit+"/"+tot+")");
  ok(hid<tot,"но не вся пропала ("+hid+"/"+tot+")");
  ok(!chartsHidden(R.core.sx,R.core.sy),"ядро на карте есть — это планеты на нём нет в записях");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;G.mode="dock";
  const d=chartsDock();ok(d&&/ниоткуда/.test(d.line),"сверили приборы: вы прилетели ниоткуда");
  G.credits=100;ok(!chartsBuy(),"без денег не выменять");
  G.credits=1000;ok(chartsBuy(),"выменяли");eq(G.credits,1000-CHARTS_PRICE,"заплатили");
  ok(chartsHidden(0,0),"пока карта в трюме — дома на навигаторе нет");
  G.odo.jumps=40;ok(chartsDrop(),"выбросили");ok(!chartsHidden(0,0),"дом вернулся");
  G.odo.jumps=43;chartsTick();eq(G.charts.have,0,"три прыжка — её ещё нет");
  G.odo.jumps=45;chartsTick();eq(G.charts.have,1,"пять прыжков — она снова в трюме");
  const s=snapshot();applySave(s);eq(G.charts.have,1,"карта переживает сейв");
  G.mode="map";G.sel={x:0,y:0};let okDraw=true;try{drawMap();}catch(e){okDraw=false;}ok(okDraw,"карта рисуется без дома");
}));
