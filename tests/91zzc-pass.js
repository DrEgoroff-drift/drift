/* ══════════════ перевал: корабль на поклон, свет, развилка без правильного ответа ══════════════ */
TEST_SUITES.push(()=>suite("перевал: свет в корабле, объяснить или уйти — без награды",()=>{
  resetWorld();
  const at=regionOfTheme("pass");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"course","прибор — курсограф");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  const pc=passCorePlanet(G.sys);ok(!!pc,"у ядра есть планета");
  if(!pc)return;
  const tr=genTerrain(pc);G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();
  const S=G.surf;
  ok(/Корабль/.test(passGroundLine()),"строка к посадке — про корабль");
  S.x=passShipX(tr,pc);ok(passAtShip(S),"у корабля");
  const c0=G.credits,d0=G.data;
  ok(passLight(),"включили свет");ok(!passLight(),"второй раз нечего включать");
  eq(G.credits,c0,"награды нет");eq(G.data,d0,"и данных нет");
  ok(/свет/.test(passGroundLine()),"они стоят и смотрят");
  if(settleCanLive(pc)){
    S.x=settleSpotX(pc,tr);ok(passAtVillage(S),"у посёлка");
    ok(passTell(),"объяснили");ok(!passTell(),"дважды не объяснить");
    ok(/не поют/.test(passGroundLine()),"литургии больше нет");
  }
  eq(G.credits,c0,"и за это награды нет");
  S.x=passShipX(tr,pc);S.cam=null;let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}ok(okDraw,"корабль рисуется");
  const s=snapshot();applySave(s);eq(G.pass.lit,1,"свет помнится");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);eq(passGroundLine(),null,"дома ничего");
}));
