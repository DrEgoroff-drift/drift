/* ══════════════ oracle · одно плечо обнажённого тягача (M478) ══════════════ */
TEST_SUITES.push(()=>suite("миры: oracle тягач одно плечо",()=>{
  resetWorld();
  const H=oracleHaulerHop(10);
  ok(H.cargo>=H.nom,"обнажённый Вьюк: трюм не меньше номинала");
  ok(H.cap<=1.4+1e-9,"трюм ≤ ×1.4 номинала (граница shipyard §3)");
  ok(H.best&&H.best.margin>0,"есть прибыльное плечо в радиусе");
  ok(H.profit===H.best.margin*H.cargo,"прибыль = маржа × трюм");
}));
