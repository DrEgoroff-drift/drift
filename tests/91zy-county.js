/* ══════════════ большой уезд: кладка крупнее, город отвечает на шум, ответ издалека ══════════════ */
TEST_SUITES.push(()=>suite("большой уезд: кладка в рост, дверь по шуму, детская по нашему росту, ответ не здесь и не скоро",()=>{
  resetWorld();
  const at=regionOfTheme("county");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"mass","прибор — масс-детектор");
  eq(countyPoiK(),1,"дома кладка обычная");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(countyDepthHere(),2,"мы в ядре");eq(countyPoiK(),2,"кладка вдвое крупнее");
  const pc=countyCorePlanet(G.sys);
  if(pc){
    eq(countyHouseK(pc),2.3,"дворы под гостя");
    const tr=genTerrain(pc);G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();
    const S=G.surf;
    eq(countyLevel(S),0,"тихо — город закрыт");
    S.jetOn=true;for(let i=0;i<60;i++)countyNoiseTick(S,1);
    ok(countyLevel(S)>=1,"ранец — двери открылись ("+S.noise.toFixed(0)+")");
    for(let i=0;i<200;i++)countyNoiseTick(S,1);
    ok(countyLevel(S)>=4,"долгий шум — город услышал");
    eq(G.county.saw,1,"детская увидена");eq(G.county.called,1,"город услышал");
    S.jetOn=false;for(let i=0;i<2000;i++)countyNoiseTick(S,1);eq(countyLevel(S),0,"тишина — город снова закрыт");
    S.x=settleSpotX(pc,tr);S.cam=null;let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}ok(okDraw,"город рисуется");
  }
  /* ответ: не здесь и не раньше двадцати прыжков */
  G.county.called=1;G.county.at=10;G.odo.jumps=15;
  eq(countyAnswerLine(),null,"здесь — молчит");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);
  eq(countyAnswerLine(),null,"рано — молчит");
  G.odo.jumps=31;const a=countyAnswerLine();ok(a&&/гул/.test(a),"двадцать прыжков спустя — ответил");
  eq(countyAnswerLine(),null,"и только один раз");
  const s=snapshot();applySave(s);eq(G.county.answered,1,"ответ помнится");
}));
