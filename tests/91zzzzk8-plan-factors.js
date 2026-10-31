/* ══════════════ M478: числа от чертежа — неподвижная точка ══════════════
   Обзор с носа и бак/энергия читаются в planFactors; падение обзора при сдвиге
   прибора — руками в КБ (изолированный прогон ломается от чужого SLOT_CACHE). */
TEST_SUITES.push(()=>suite("чертёж: числа M478",()=>{
  resetWorld();
  const id=G.shipId;
  G.mods.tank=1;G.mods.weapon=1;
  G.draft=undefined;PLAN_F.key="";
  const F0=planFactors(),s0=stat();
  ok(F0.cargo===1&&F0.mass===1&&F0.fuel===1&&F0.energy===1&&F0.see===1,"без чертежа все множители ×1");
  ok("fuel" in F0&&"energy" in F0&&"see" in F0,"есть fuel/energy/see");

  draftSave(id,draftOf(id));PLAN_F.key="";
  const F1=planFactors(),s1=stat();
  ok(Math.abs(F1.cargo-1)<1e-9&&Math.abs(F1.mass-1)<1e-9,"типовой чертёж: трюм и масса ×1");
  ok(Math.abs(F1.fuel-1)<1e-9&&Math.abs(F1.energy-1)<1e-9&&Math.abs(F1.see-1)<1e-9,"типовой: бак/энергия/обзор ×1");
  ok(s1.fuelMax===s0.fuelMax&&s1.energyMax===s0.energyMax&&s1.see===s0.see&&s1.cargoMax===s0.cargoMax,"типовой сейв не двигает числа корабля");
}));
