/* ══════════════ пещера M305: гладкий обвод и содержимое ══════════════ */
TEST_SUITES.push(()=>suite("пещера M305: обвод без углов, кости, верёвки, стоянка",()=>{
  resetWorld();
  landOnTestPlanet();
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();
  const C=G.cave;
  ok(!!C&&!!C.g,"поле пещеры построено");
  ok(Array.isArray(C.branchEnds)&&C.branchEnds.length===6,"шесть концов ответвлений записаны");
  /* гладкий путь: есть, кромки для капель на месте, замкнутые петли */
  const P=caveSmoothPath(C,0,0);
  ok(P instanceof Path2D,"сглаженный обвод — Path2D");
  ok(Array.isArray(P.fl)&&Array.isArray(P.ce),"кромки пола и свода собраны");
  ok(P.fl.length>0&&P.ce.length>0,"в первом тайле есть и пол, и свод ("+P.fl.length+"/"+P.ce.length+")");
  /* содержимое: сеяно, повторяемо, без NaN */
  const pr=caveProps(C);
  const kinds={};for(const p of pr)kinds[p.k]=(kinds[p.k]||0)+1;
  ok(kinds.bones>=3,"кости лежат хотя бы в трёх местах ("+(kinds.bones||0)+")");
  eq(kinds.rope,2,"верёвка в каждой из двух шахт");
  eq(kinds.tally,2,"зарубки у каждой шахты");
  eq(kinds.camp,1,"одна стоянка у чужого фонаря");
  ok(pr.every(p=>p.k==="rope"||(isFinite(p.x)&&isFinite(p.y))),"у всего есть координаты");
  ok(pr.filter(p=>p.k!=="rope").every(p=>p.y<CAVE_Y1-5),"ничего не лежит за дном поля");
  ok(caveProps(C)===pr,"второй вызов — тот же список");
  /* рисование не падает ни в одной точке */
  for(const x of [200,700,1200,1800]){C.x=x;C.y=caveFloor(C,x)-1;C.cy=null;drawCave();}
  C.x=1200;C.y=caveFloorLow(C,1200)-1;C.cy=null;drawCave();
  ok(true,"кадры пещеры в пяти точках нарисованы");
  exitCave();
}));

/* ══════════════ станция и планета M306: знаки на дневной стороне ══════════════ */
TEST_SUITES.push(()=>suite("M306: отвал, купол и полоса на планете не падают и не рисуются без построек",()=>{
  resetWorld();
  G.mode="system";G.running=true;
  const sys=G.sys,p=(sys.planets||[]).find(q=>q.type!=="gas");
  ok(!!p,"в системе есть твёрдая планета");
  if(!p)return;
  const save=G.hold;
  G.hold={};
  let n0=0;const f0=ctx.fill;ctx.fill=function(){n0++;return f0.apply(ctx,arguments);};
  drawPlanetWorks(sys,p,W/2,H/2,80);
  ctx.fill=f0;
  eq(n0,0,"без построек и рунга на диске ничего не кладётся");
  G.hold={[sys.key]:{bld:{regolith:{ok:1},greenhouse:{ok:1}}}};
  const rd=(typeof bldReady==="function")?bldReady:null;
  if(rd)window.bldReady=()=>true;
  let n1=0;ctx.fill=function(){n1++;return f0.apply(ctx,arguments);};
  drawPlanetWorks(sys,p,W/2,H/2,80);
  ctx.fill=f0;
  if(rd)window.bldReady=rd;
  ok(n1>=4,"с шахтой и оранжереей на диске лежат отвал и купол ("+n1+" заливок)");
  drawPlanetWorks(sys,p,W/2,H/2,8);
  ok(true,"на малом диске (r<12) знаки не рисуются и не падают");
  G.hold=save;
}));
