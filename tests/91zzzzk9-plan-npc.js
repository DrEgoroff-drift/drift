/* ══════════════ M483: упаковщик для NPC и пиратов ══════════════
   Чужой корпус собирает тот же planPack; стволы пирата сидят на клетках
   чертежа (fromPlan), а не на отдельном lerp. */
TEST_SUITES.push(()=>suite("чертёж: NPC/пират M483",()=>{
  resetWorld();
  const npcId="npcM483";
  NPC_SHIPS[npcId]={name:npcId,seed:0x48301,hcls:"warship",col:"#8899aa",thr:1.1,turn:1,fuel:120,cargo:40,hull:160,by:"or"};
  const pk=planNpcOf(npcId);
  ok(pk.P.cells.length>=6,"NPC: план имеет клетки");
  ok(pk.items.length>=2,"NPC: упаковщик положил оснастку");
  ok(pk.items.some(it=>it.kind==="gun")&&pk.items.some(it=>it.kind==="engine"),"NPC: есть орудие и двигатель");
  ok(pk.hold.length>=1,"NPC: остался трюм");

  const pirId="p48301";
  NPC_SHIPS[pirId]={seed:0x48301,col:"#d95a3c"};
  const B=pirateBuild(0x48301,pirateClass(0x48301),2,pirId);
  ok(B.guns.length>=2,"пират: стволы из снаряжения");
  const fromPlan=B.guns.filter(g=>g.fromPlan).length;
  ok(fromPlan>=1,"пират: хотя бы один ствол с клетки чертежа");
  const pkP=planNpcOf(pirId);
  ok(pkP.items.some(it=>it.kind==="gun"),"пират: planNpcOf кладёт орудие");
  ok(B.guns.filter(g=>g.fromPlan).every(g=>Number.isFinite(g.x)&&Number.isFinite(g.y)),"пират: клетки чертежа — конечные координаты");
}));
