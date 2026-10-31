/* ══════════════ oracle · трасса vs прыжок (M475 foothold) ══════════════
   Полная линия кр/мин — после пробы сделок. Здесь: касса и рычаг багажа. */
TEST_SUITES.push(()=>suite("миры: oracle трасса/прыжок",()=>{
  resetWorld();
  G.cargo={};for(const k of RES_KEYS)G.cargo[k]=0;
  const light=oracleRoundTrip(40);
  ok(light.jump>0&&light.rail>0,"обе цены конечные");
  ok(light.ratio<1,"пустой трюм: трасса дешевле прыжка в кр");
  G.cargo.osmium=20;
  const heavy=oracleRoundTrip(40);
  ok(heavy.big&&heavy.bag>light.bag,"багаж ×3 поднимает rail");
  ok(heavy.ratio>light.ratio,"рычаг багажа двигает отношение к прыжку");
  ok(ORACLE_FUEL_CR===4,"рычаг топлива для oracle зафиксирован");
}));
