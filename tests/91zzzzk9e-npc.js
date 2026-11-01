/* ══════════════ сто жителей: лицо закреплено за id, зал берёт своих ══════════════ */
TEST_SUITES.push(()=>suite("жители: сто постоянных лиц",()=>{
  eq(NPC_LIB.length,100,"сто человек");
  const ids={};for(const p of NPC_LIB)ids[p.id]=1;
  eq(Object.keys(ids).length,100,"id не повторяются");
  const u1={},a=npcTake("trade",11,1,u1,"clerk");
  const u2={},b=npcTake("trade",11,1,u2,"clerk");
  eq(a.npc,b.npc,"одно зерно — один хозяин стойки");
  const g=cpGene(a);
  ok(g.style===1||g.style===2||g.style===3||g.style===6,"хозяин стойки с волосами");
  const u3={},c=npcTake("yard",12,1,u3,"clerk"),gy=cpGene(c);
  ok(g.jaw!==gy.jaw||g.skin[0]!==gy.skin[0]||g.hair[0]!==gy.hair[0],"торговый узел и верфь — разные лица");
  const v=NPC_BY[1];
  eq(v.name,"Вега","Вега — первый житель");
  ok(v.hero&&v.fem,"Вега не из общей толпы");
  const ub={};npcTake("bazaar",3,0,ub);
  ok(!ub[1],"Вега не занимает место в блошинце");
  const seen={};let clash=0;
  for(const p of NPC_LIB){const k=p.skin+"|"+p.hair+"|"+p.style+"|"+p.jaw+"|"+p.chin;if(seen[k])clash++;seen[k]=1;}
  eq(clash,0,"нет двух копий одного лица");
  for(const st of ["trade","indust","yard","sci","outpost","fuel","bazaar"]){
    const u={};ok(!!npcTake(st,7,1,u,"clerk"),st+": есть свой клерк");
  }
}));
