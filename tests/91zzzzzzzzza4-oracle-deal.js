/* ══════════════ oracle · кр/мин трасса vs прыжок (DESIGN-metro §5) ══════════════
   Лучший круговой рейс трассой ≤ ×1.3 лучшего прыжками. Проба сделок. */
TEST_SUITES.push(()=>suite("миры: oracle кр/мин трасса/прыжок",()=>{
  resetWorld();
  /* сеть трассы — ленивая; прогреем вокруг старта */
  if(typeof railEnsure==="function")railEnsure(G.sx|0,G.sy|0);
  const D=oracleDealProbe(12);
  ok(D.jump&&D.jump.cpm>0,"есть прибыльный прыжковый рейс");
  ok(D.rail&&D.rail.cpm>0,"есть прибыльный рейс трассой");
  ok(D.ratio<=ORACLE_RATIO_MAX+1e-9,
    "рейс трассой ≤ ×"+ORACLE_RATIO_MAX+" прыжка кр/мин (сейчас ×"+D.ratio.toFixed(3)+")");
  ok(ORACLE_DEAL_S>0&&ORACLE_FUEL_CR>0,"рычаги пробы на месте");
}));
