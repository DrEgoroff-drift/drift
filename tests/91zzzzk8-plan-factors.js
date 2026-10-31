/* ══════════════ M478/M476: числа от чертежа — неподвижная точка ══════════════
   Стриж, серийный флот, NPC и заказной unique: без чертежа и с типовым — ×1. */
TEST_SUITES.push(()=>suite("чертёж: числа M478",()=>{
  resetWorld();
  const fleetId=Object.keys(FLEET)[0];
  ok(!!fleetId,"есть серийный корпус");
  const npcId="npcFix478";
  NPC_SHIPS[npcId]={name:npcId,seed:0x47801,hcls:"courier",col:"#8899aa",thr:1,turn:1,fuel:100,cargo:40,hull:100};
  const uo={by:"gt",cls:"ore",size:1,l:1,w:1,seed:0x47801,no:478,st:"проба"};
  const uid=typeof stapelId==="function"?stapelId(uo):"spFix478";
  if(typeof stapelShip==="function"){G.uniqueShips[uid]=stapelShip(uo);G.owned[uid]=true;}
  const ids=["strizh",fleetId,npcId].concat(G.uniqueShips[uid]?[uid]:[]);
  const same=(a,b)=>a===b||(Number.isNaN(a)&&Number.isNaN(b));
  for(const id of ids){
    G.shipId=id;G.owned[id]=true;G.fit[id]=G.fit[id]||{};
    G.mods.tank=1;G.mods.weapon=1;G.mods.armor=1;
    G.draft=undefined;PLAN_F.key="";
    const F0=planFactors(),s0=stat();
    ok(F0.cargo===1&&F0.mass===1&&F0.fuel===1&&F0.energy===1&&F0.see===1&&F0.hull===1,id+": без чертежа ×1");
    draftSave(id,draftOf(id));PLAN_F.key="";
    const F1=planFactors(),s1=stat();
    ok(Math.abs(F1.cargo-1)<1e-9&&Math.abs(F1.mass-1)<1e-9&&Math.abs(F1.fuel-1)<1e-9&&Math.abs(F1.energy-1)<1e-9&&Math.abs(F1.see-1)<1e-9&&Math.abs(F1.hull-1)<1e-9,id+": типовой ×1");
    ok(same(s1.fuelMax,s0.fuelMax)&&same(s1.energyMax,s0.energyMax)&&same(s1.see,s0.see)&&same(s1.cargoMax,s0.cargoMax)&&same(s1.hullMax,s0.hullMax),id+": типовой сейв не двигает числа");
  }
}));
