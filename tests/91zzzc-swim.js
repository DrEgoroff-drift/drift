/* ══════════════ сквозной: вода и пещера (M328) ══════════════
   Автор (03.09.2026): «можно под водой ходить — надо, чтобы плыть»; «пещера не
   меняет название кнопки и там "заложить шахту"». Проверяется как игрок:
   встали в озеро — всплыли, круг надулся, ход медленнее, над кустом — подсказка
   и сбор; у устья пещеры подсказка — про пещеру, не про шахту. */
/* садимся на землеподобную с озером: озеро есть не в каждой ложбине (нужна
   влажность рельефа), поэтому перебираем ближние системы, пока waterOf не ответит */
function swimTestLand(needWater){
  resetWorld();
  const cand=[[G.sx,G.sy]];
  for(let r0=1;r0<7;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++)
    if(Math.max(Math.abs(x),Math.abs(y))===r0&&(typeof starAt!=="function"||starAt(x,y)))cand.push([x,y]);
  for(const [sx,sy] of cand){
    const sys=getSystem(sx,sy);if(!sys||!sys.planets||!sys.planets.length)continue;
    const p=sys.planets.find(q=>q.type!=="gas");if(!p)continue;
    G.sx=sx;G.sy=sy;G.sys=sys;
    p.type="terran";p.T=TYPES.terran||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes("terran",null,null);
    for(const k of ["tex","mat","strata","geo","bio","biome","flora","fauna2","fauna3","caveFlora"])delete p[k];
    const tr=genTerrain(p);
    if(needWater&&!waterOf(tr,p))continue;
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    return G.surf;
  }
  return null;
}
TEST_SUITES.push(()=>suite("сквозной: в озере плывём с кругом и снимаем водоросли",()=>{
  const S=swimTestLand(true);
  ok(!!S,"нашлась землеподобная с озером");
  if(!ok(S,"нашлось: S"))return;
  const Wt=waterOf(S.tr,S.p);
  /* ходьба по берегу — обычная */
  S.x=Wt.x0-60;S.y=groundAt(S.tr,S.x)-10;S.on=true;
  steps(10,updateSurface);
  eq(S.swim||0,0,"на берегу круга нет");
  /* в глубокой воде всплываем и держимся у уреза */
  S.x=Wt.cx;S.y=groundAt(S.tr,S.x)-10;
  ok(groundAt(S.tr,S.x)-Wt.y>14,"середина озера глубокая: "+Math.round(groundAt(S.tr,S.x)-Wt.y)+" px");
  steps(40,updateSurface);
  ok(S.swim>=.99,"круг надулся: "+S.swim.toFixed(2));
  ok(Math.abs(S.y-(Wt.y-5))<2.5,"держимся у уреза: y "+S.y.toFixed(1)+" при воде "+Wt.y.toFixed(1));
  ok(S.on,"в воде считаемся «на опоре» — ранец готов к прыжку");
  /* ход в воде медленнее */
  const x0=S.x;keys.right=true;steps(20,updateSurface);keys.right=false;
  const swimD=S.x-x0;
  S.x=Wt.x0-80;S.y=groundAt(S.tr,S.x)-10;steps(30,updateSurface);
  const x1=S.x;keys.right=true;steps(20,updateSurface);keys.right=false;
  const walkD=S.x-x1;
  ok(swimD>0&&swimD<walkD*.75,"в воде медленнее: "+swimD.toFixed(1)+" против "+walkD.toFixed(1)+" на берегу");
  /* водоросли: над кустом подсказка, ДЕЙСТВИЕ снимает в органику */
  const al=waterAlgae(Wt);
  ok(al.length>=3,"кустов в озере: "+al.length);
  S.x=al[0].x;S.y=Wt.y-5;S.swim=1;S.on=true;
  const org=G.cargo.organics|0;
  steps(3,updateSurface);
  ok(/ВОДОРОСЛИ/.test(G.prompt),"подсказка про водоросли: "+G.prompt.split("\n")[0]);
  actEdge=true;updateSurface(1);actEdge=false;
  eq(G.cargo.organics|0,org+2,"органика +2");
  ok(al[0].taken,"куст снят");
  steps(2,updateSurface);
  ok(!/СОБРАТЬ/.test(G.prompt),"снятый куст больше не предлагают");
  /* прыжок из воды: ▲ поднимает, а не гасится тем же кадром */
  S.jet=S.jet||{};keys.thrust=true;updateSurface(1);keys.thrust=false;
  ok(!S.on||S.vy<0,"▲ из воды: оторвались");
  keys.thrust=false;resetWorld();
}));
TEST_SUITES.push(()=>suite("сквозной: у пещеры подсказка про пещеру, а не про шахту",()=>{
  const S=swimTestLand(false);
  ok(!!(S&&S.cave),"устье пещеры есть");
  if(!S||!S.cave)return;
  S.x=S.cave.x;S.y=groundAt(S.tr,S.x)-10;S.on=true;
  steps(4,updateSurface);
  ok(/ПЕЩЕРУ/.test(G.prompt),"подсказка у устья: "+G.prompt.split("\n")[0]);
  ok(!/ШАХТ/.test(G.prompt),"про шахту у пещеры не говорят");
  S.x=S.cave.x+120;S.y=groundAt(S.tr,S.x)-10;
  steps(4,updateSurface);
  ok(!/ПЕЩЕРУ/.test(G.prompt),"отошли — подсказка сменилась: "+G.prompt.split("\n")[0]);
  resetWorld();
}));
