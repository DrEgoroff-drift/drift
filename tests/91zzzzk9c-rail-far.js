/* ══════════════ M474: сеть за r 60 лениво по региону ══════════════ */
TEST_SUITES.push(()=>suite("железная: сеть за r 60",()=>{
  resetWorld();
  ok(RAIL_R===60,"старт сети на r 60");
  railEnsure(70,0);
  ok(RAIL_R>=82,"railEnsure расширяет RAIL_R");
  const N=railNet();
  ok(N.lines.length>=6,"линии после расширения");
  const far=N.lines.some(l=>l.pts&&l.pts.some(p=>Math.hypot(p[0],p[1])>65));
  ok(far,"есть точки сети дальше r 65");
  const R0=RAIL_R;
  railEnsure(50,0);
  ok(RAIL_R===R0,"повторный ensure ближе не сужает");
}));
