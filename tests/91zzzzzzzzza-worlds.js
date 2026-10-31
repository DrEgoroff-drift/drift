/* ══════════════ миры · тарифы трассы (oracle foothold, M475 / PLAN §3) ══════════════
   Полная линия «рейс ≤ ×1.3 прыжка кр/мин» — отдельно, когда будет проба сделок.
   Здесь законы кассы, на которых крутится рычаг багажа. */
TEST_SUITES.push(()=>suite("миры: тарифы трассы",()=>{
  resetWorld();
  /* метро: жетон 5, багажа нет */
  const Fm=railFare({to:{sx:0,sy:0},dist:3});
  ok(Math.hypot(G.sx,G.sy)<=RAIL_METRO_R,"старт в метро");
  ok(Fm.metro&&Fm.fare===5&&Fm.bag===0&&Fm.sum===5,"метро: 5 кр, без багажа");

  /* наружу: 2 кр/сектор, потолок снизу 4; багаж ceil(held/5) */
  G.cargo={};for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo.ore=12;   /* лёгкое — не крупногабарит */
  const Fo=railFare({to:{sx:40,sy:0},dist:40});
  ok(!Fo.metro&&Fo.fare===Math.max(4,Math.round(2*40)),"наружу: тариф 2×дистанция");
  ok(Fo.bag===Math.ceil(held()/5)&&!Fo.big,"лёгкий груз: багаж без ×3");

  /* осмий тяжёлый — крупногабарит ×3 на багаж */
  G.cargo={};for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo.osmium=5;
  ok(resW("osmium")>1,"осмий тяжёлый");
  const Fb=railFare({to:{sx:40,sy:0},dist:40});
  ok(Fb.big&&Fb.bag===Math.ceil(held()/5)*3,"крупногабарит: багаж ×3");
}));
