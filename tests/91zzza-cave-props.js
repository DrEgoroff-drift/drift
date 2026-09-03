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

/* ══════════════ дом M307: мебель из материала, план сеян ══════════════ */
TEST_SUITES.push(()=>suite("M307: обёртка мебели возвращает fillRect, план дома сеян и повторяем",()=>{
  resetWorld();
  const orig=ctx.fillRect;
  let inner=0;
  hinMaterialize(0,()=>{inner=(ctx.fillRect!==orig)?1:0;ctx.fillStyle="rgb(120,80,50)";ctx.fillRect(10,-20,30,20);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(0,0,400,400);});
  eq(inner,1,"внутри обёртки fillRect подменён");
  ok(ctx.fillRect===orig,"после обёртки fillRect прежний");
  let threw=false;try{hinMaterialize(0,()=>{throw new Error("x");});}catch(e){threw=true;}
  ok(threw&&ctx.fillRect===orig,"исключение внутри — fillRect всё равно возвращён");
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  const a=homePlan(p),b=homePlan(p);
  ok(a.w>=3.1&&a.w<=3.9&&a.roofH>=.8&&a.roofH<=1.2,"план в допусках");
  eq(JSON.stringify(a),JSON.stringify(b),"один и тот же дом при каждом приходе");
  ok(["plank","tile","thatch"].indexOf(a.roofKind)>=0,"кровля из тех, что умеет sdRoof");
  for(const t of [0,1,2,3,4])homeSigns(300,300,60,{wood:[96,72,50],metal:[104,112,120],stone:[90,90,100]},t,a);
  ok(true,"признаки жизни рисуются на всех ступенях");
}));

/* ══════════════ M308: дневной свет без приговора, карта и заход рисуются ══════════════ */
TEST_SUITES.push(()=>suite("M308: пара без приговора для дневных сцен, полоса карты и зарево захода",()=>{
  resetWorld();
  const m={pair:3,warm:97,mass:20,edge:5,contrast:.4,tones:5,empty:50};
  ok(lookVerdict(m,"грунт день").indexOf("без приговора")>=0,"грунт день: пара справкой");
  ok(lookVerdict(m,"пещера").indexOf("×пара")>=0,"пещера: пара судится");
  ok(lookVerdict(m).indexOf("×пара")>=0,"без сцены — старое поведение");
  G.mode="map";drawMap();drawMap();
  ok(true,"карта с полосой в две ступени нарисована");
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  startLanding(p);G.land.y=groundAt(G.land.tr,G.land.x)-560;
  for(let i=0;i<3;i++){updateLanding(1);drawLanding();}
  ok(G.mode==="landing","заход с полукилометра рисуется с зарево́м без ошибок");
}));
