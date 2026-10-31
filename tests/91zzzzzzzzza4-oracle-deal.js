/* ══════════════ oracle · кр/мин трасса vs прыжок (DESIGN-metro §5) ══════════════
   Лучший круговой рейс трассой ≤ ×1.3 лучшего прыжками. Проба сделок. */
TEST_SUITES.push(()=>suite("миры: oracle кр/мин трасса/прыжок",()=>{
  ok(typeof railEnsure==="function","railEnsure на месте");
  ok(typeof oracleDealProbe==="function","oracleDealProbe на месте");
  ok(ORACLE_RATIO_MAX===1.3,"потолок отношения ×1.3");
  ok(ORACLE_DEAL_S>0&&ORACLE_FUEL_CR>0,"рычаги пробы на месте");
  resetWorld();
  /* сеть трассы — ленивая; прогреем вокруг старта */
  railEnsure(G.sx|0,G.sy|0);
  const D=oracleDealProbe(12);
  ok(!!D.jump,"проба нашла прыжковый рейс");
  ok(!!D.rail,"проба нашла рейс трассой");
  if(!D.jump||!D.rail)return;
  ok(D.jump.cpm>0,"прыжок: кр/мин > 0");
  ok(D.rail.cpm>0,"трасса: кр/мин > 0");
  ok(Number.isFinite(D.ratio)&&D.ratio>0,"отношение конечно и > 0");
  ok(D.ratio<=ORACLE_RATIO_MAX+1e-9,
    "рейс трассой ≤ ×"+ORACLE_RATIO_MAX+" прыжка кр/мин (сейчас ×"+D.ratio.toFixed(3)+")");
  ok(D.ok===true,"oracleDealProbe.ok согласован с потолком");
  ok(D.jump.profit>0&&D.rail.profit>0,"оба рейса с прибылью");
  ok(D.cargo>0,"трюм пробы не пустой");
}));
