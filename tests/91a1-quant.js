/* Кадр 100 мс (10 кадров/с) — мир проходит 100 мс, а не 50; остаток переносится, а не обнуляется. */
TEST_SUITES.push(()=>suite("кванты мира: остаток не теряется",()=>{
  const r=quantSplit(100);
  ok(r.steps*QUANT_MS>=95,"кадр 100 мс: мир прошёл ≥ 95 мс, было "+(r.steps*QUANT_MS).toFixed(1));
  let t=0,real=0,acc=0;
  for(let i=0;i<50;i++){acc+=100;real+=100;const q=quantSplit(acc);acc=q.acc;t+=q.steps*QUANT_MS;}
  ok(t/real>.95,"10 кадров/с: мир идёт в реальном времени (доля "+(t/real).toFixed(2)+")");
  const big=quantSplit(250);
  ok(big.steps===QUANT_MAX&&big.acc<=QUANT_MS*QUANT_MAX+1e-9,"провал в 250 мс: шаг ограничен, накопление с потолком");
  const norm=quantSplit(16.67);
  ok(norm.steps===2,"60 Гц: два кванта");
}));
