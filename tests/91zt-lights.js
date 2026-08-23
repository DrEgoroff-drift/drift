/* ══════════════ три света: без ночи, ставни за сутки, первый раз — мимо ══════════════ */
TEST_SUITES.push(()=>suite("три света: сумерки на окраине, календарь с первого прихода, вход только в соединение",()=>{
  resetWorld();
  const at=regionOfTheme("lights");ok(!!at,"область трёх светов расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"actino","прибор области — актинометр");
  eq(lightsDepthAt(0,0),0,"в начале координат области нет");
  /* окраина */
  let edge=null;
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN&&!edge;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN&&!edge;y++)
    if(starAt(x,y)&&regionDepth(x,y)>0&&!(x===R.core.sx&&y===R.core.sy))edge={x,y};
  ok(!!edge,"на окраине есть система внутри склона");
  G.sx=edge.x;G.sy=edge.y;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(lightsDepthHere(),1,"мы на окраине");
  /* до первого прихода в ядро календаря нет */
  eq(G.lights.t0,-1,"календарь не заведён");
  G.etherT=1;etherTick(1);eq(G.lights.t0,-1,"окраина календарь не заводит");
  ok(!lightsShut(),"без календаря ставни открыты");
  /* сумерки: ночь не доходит до ночи */
  const pe=(G.sys.planets||[]).find(p=>p.type!=="gas");
  if(pe){
    let mx=0;for(let t=0;t<CEL_DAY*12;t+=CEL_DAY*.25)mx=Math.max(mx,surfNight(pe,t));
    ok(mx<=.22+1e-9,"на окраине ночь не глубже сумерек ("+mx.toFixed(2)+")");
  }
  /* ядро: первый приход заводит календарь так, что соединение было вчера */
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);
  eq(lightsDepthHere(),2,"мы в ядре");
  G.t=CEL_DAY*5+100;
  G.etherT=1;etherTick(1);
  eq(G.lights.t0,5,"календарь заведён днём прихода");
  const P=lightsPeriod();ok(P>=24&&P<36,"период — недели ("+P+" сут)");
  let C=lightsConj();
  eq(C.k,0,"в день прихода соединения нет: первый раз — мимо");
  ok(C.left>P-2&&C.left<P,"до следующего почти период ("+C.left.toFixed(1)+")");
  ok(!C.soon,"ставни открыты");
  const pc=lightsCorePlanet(G.sys);
  if(pc){
    ok(lightsIsCore(pc),"планета ядра — первая твёрдая");
    eq(surfNight(pc,G.t+CEL_DAY*3),0,"в ядре ночи нет");
    ok(!lightsOpen(pc),"до соединения входа нет");
  }
  /* за сутки — ставни */
  const t0=G.t;
  G.t=t0+(P-1.5)*CEL_DAY;C=lightsConj();
  ok(C.soon&&C.k===0,"за сутки до соединения: ставни закрыты, света ещё нет");
  ok(lightsShut(),"lightsShut согласен");
  ok(/Ставни/.test(lightsGroundLine()),"строка к посадке — про ставни");
  /* соединение: пик в середине суток, вход открыт */
  G.t=t0+(P-1)*CEL_DAY+CEL_DAY*.5;C=lightsConj();
  ok(C.k>.99,"середина соединения — пик ("+C.k.toFixed(2)+")");
  if(pc)ok(lightsOpen(pc),"в соединение вход открыт");
  ok(lightsShut(),"в соединение ставни закрыты");
  /* и календарь не сдвигается под новый приход */
  G.t=t0+(P+3)*CEL_DAY;lightsArrive();eq(G.lights.t0,5,"повторный приход календарь не трогает");
  C=lightsConj();eq(C.k,0,"через три дня после соединения — ничего");
  /* сейв */
  G.lights.seen=2;
  const s=snapshot();applySave(s);eq(G.lights.t0,5,"день прихода переживает сейв");eq(G.lights.seen,2,"и факт входа");
  /* вход: пещера без кусачих, находка платит данными */
  if(pc){
    G.t=t0+(2*P-1)*CEL_DAY+CEL_DAY*.5;
    const tr=genTerrain(pc);
    {
      G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
      enterSurface();
      const ex=lightsEntryX(tr,pc);
      if(G.surf.cave)ok(Math.abs(ex-G.surf.cave.x)>=400,"вход не у устья обычной пещеры");
      const d0=G.data;
      lightsEnter();
      eq(G.mode,"cave","вошли в пещеру");
      ok(G.cave.ancient,"пещера помечена как вход под третьим светом");
      eq(G.cave.fauna.length,0,"кусачих нет");
      lightsCaveFind(G.cave);
      eq(G.data,d0+120,"находка платит 120 данных");
      eq(G.lights.seen,2,"внутри были");
      exitCave();ok(!G.surf.ancient,"вышли — метка снята");
    }
  }
}));
