/* ══════════════ автотесты: холдинг · семьи E–I, каждый крючок спрошен (M295) ══════════════ */
TEST_SUITES.push(()=>suite("холдинг: 26 построек E–I — одна вещь каждая, и её кто-то спрашивает",()=>{
  resetWorld();
  const FX=BLD_KEYS.filter(id=>"EFGHI".indexOf(BLD[id].fam)>=0);
  ok(FX.length===26,"семей E–I — 26 строк ("+FX.length+")");
  ok(FX.every(id=>BLD[id].fx===id&&BLD[id].note&&BLD[id].cost&&!Object.keys(BLD[id].makes).length),"у каждой свой fx, слово о нём, цена и ничего в выпуске");
  ok(BLD_KEYS.length===82,"всего построек — 82 ("+BLD_KEYS.length+")");
  const rus=BLD_KEYS.map(id=>BLD[id].ru);
  ok(new Set(rus).size===82,"имена построек не повторяются");
  const s=siteTestStation();
  if(!s){ok(true,"пропущено");return;}
  siteTestOpen(s);
  const H=holdOf(s.key);H.bld={};
  const stand=id=>{H.bld[id]={lvl:1,t0:Date.now(),ready:Date.now()-1,my:{},got:{}};};
  G.sys=s;G.sx=s.sx;G.sy=s.sy;G.st=s.station;G.mode="dock";
  bldHas.asked={};
  /* E1 накопитель */
  ok(holdCapMul(s.key)===1,"без накопителя потолок ×1");stand("nakop");ok(holdCapMul(s.key)===2,"накопитель: потолок ×2");
  /* E2 контора */
  G.seenPrices={};stand("kontora");const kn=holdKontoraNotes(s);
  ok(kn>=0&&Object.keys(G.seenPrices).every(k=>G.seenPrices[k].heard),"контора: соседи легли на бумагу со слуха ("+kn+")");
  /* E3 касса */
  stand("kassa");ok(scripBuyPrice("x")===scripSellPrice("x"),"касса: боны без спреда");
  /* E4 причал: баржа берёт с промысла */
  const src=BLD_KEYS.map(id=>BLD[id]).find(d=>d.fam==="A"&&!bldAtWhy(s,d));
  const c=genMerc(7,["haul"]);c.cargo={};c.traits=[];G.crew.push(c);G.owned.vyuk=true;crewAssignShip(c,"vyuk");
  stand("prichal");
  if(src){
    const k=Object.keys(src.makes)[0];
    stand(src.id);H.bld[src.id].got={};H.bld[src.id].got[k]=20;
    const eater=BLD_KEYS.map(id=>BLD[id]).find(d=>d.fam==="B"&&d.eats[k]);
    if(eater){
      c.barge={legs:[s.key],cursor:0,t0:Date.now(),fed:0,name:"Тюк"};
      H.bld[eater.id]={lvl:1,t0:Date.now(),ready:Date.now()-1,my:{},got:{}};
      G.credits=100000;
      const n=bargeAutoLoad(c,s);
      ok(n>0&&(c.cargo[k]|0)===n,"причал: баржа сама взяла "+n+" "+RES[k].ru.toLowerCase()+" с промысла");
    }else bargeAutoLoad(c,s);
  }else bargeAutoLoad(c,s);
  /* E5 диспетчерская */
  stand("dispatch");const F=mgrOf("fact");if(F)F.stalled=false;dispatchEtherLine(()=>0);
  /* F1 док · F2 заправка */
  const rc0=repairCost(),fp0=fuelPriceHere();stand("dock");stand("fuelnode");
  ok(repairCost()<rc0&&fuelPriceHere()<fp0,"док и заправочный узел: ремонт "+rc0+"→"+repairCost()+", топливо "+fp0+"→"+fuelPriceHere());
  /* F3 мастерская */
  stand("workshop");ok(wearFloor(s)<=clamp(.18+sysDanger(s.sx,s.sy)*.18,.15,.5)+1e-9,"мастерская: пол износа как на верфи");
  /* F4 ангар */
  stand("hangar");ok(droneBreakP({sx:s.sx,sy:s.sy,trips:40})===0,"ангар: дроны здесь не ломаются");
  /* G1 дом приезжих · G4 отдел кадров */
  const m0=stationMercs(s).length;stand("guesthouse");ok(stationMercs(s).length===m0+2,"дом приезжих: +2 кандидата");
  const g0=stationMgrs(s).length;stand("personnel");ok(stationMgrs(s).length===g0+2,"отдел кадров: +2 управляющих");
  /* G2 школа · G7 столовая · G3 медпункт */
  c.order={kind:"haul",sx:s.sx,sy:s.sy};
  stand("school");stand("canteen");const w={cat:1,bad:1,norm:1,good:1,jack:1};holdEventWeights(c,w);
  ok(w.good===1.5&&w.bad===.5,"учебный пункт и столовая двигают веса рейса");
  rollCrewEvent(c,rng(3),0);
  stand("medpoint");c.hull=10;c.hullMax=100;crewRest(c,10);
  ok(Math.abs(c.hull-22)<1e-9,"медпункт: отдых вдвое быстрее (+12 за 10 мин)");
  ok(holdRansomMul(c)===.75,"медпункт: выкуп на четверть дешевле");
  /* G5 артель */
  stand("artel");const O=orderOf(s);ok(!!O&&O.pay%10===0,"артель: наряд есть всегда ("+(O?O.pay+" кр":"нет")+")");
  /* G6 красный уголок */
  stand("redcorner");ok(holdLoyaltyHold()===true,"красный уголок: верность держится, пока стоим здесь");
  /* H1 батарея */
  G.occ=G.occ||{};G.occ[s.key]={lvl:2,kills:0,t:Date.now()};stand("guns");
  ok(holdGunsTick(s.sx,s.sy)===true&&occLvl(s.sx,s.sy)<2,"батарея: уровень блокады спал ("+occLvl(s.sx,s.sy)+")");
  delete G.occ[s.key];
  /* H2 дозор */
  stand("lookout");G.t++;lookoutSees(s.sx+1,s.sy);
  ok(!!lookoutSees.L&&lookoutSees.L.length===1,"дозор стоит и смотрит на пять секторов");
  /* H3 дружина · H4 заграждение */
  stand("druzhina");stand("barrier");ok(holdRaidThin()===1&&holdAmbushMul()===.5,"дружина и заграждение: гарнизон реже, засада реже");
  /* I1 обсерватория · I2 филиал */
  stand("observatory");stand("branch");ok(holdSkyMul()===2&&holdTechMul()===.85,"обсерватория и филиал: небо ×2, техника −15%");
  /* I3 архив */
  stand("archive");const AL=holdArchiveLines(s);ok(AL.length>=11&&/Монтажная площадка/.test(AL.join("|")),"архив: летопись из "+AL.length+" строк");
  /* I4 личный причал */
  stand("ownpier");const W=wearAll();W[G.shipId]=1;ok(holdPierHeal(1)===true&&W[G.shipId]<1,"личный причал: износ сходит у стойки");
  /* I5 радиомачта */
  stand("radiomast");const R=holdRelay(s.sx,s.sy);ok(!!R&&/МАЧТА-/.test(R.call)&&relayOf(s.sx,s.sy)&&relayOf(s.sx,s.sy).own===1,"радиомачта: своя мачта слышна как ретранслятор "+(R?R.call:""));
  /* I6 метеостанция */
  stand("meteo");const ML=holdMeteoLines(s);ok(ML.length===(s.planets||[]).filter(p=>p.type!=="gas").length,"метеостанция: погода на "+ML.length+" телах известна с доски");
  /* каждую спросили */
  const asked=Object.keys(bldHas.asked);
  const missing=FX.filter(id=>asked.indexOf(id)<0);
  ok(!missing.length,"все 26 эффектов спрошены через bldHas"+(missing.length?" · не спрошены: "+missing.join(", "):""));
  /* стройка показывает их словом, а не бункером */
  ok(BLD_FAM_KEYS.length===9&&!bldIsShop(BLD.nakop)&&bldIoTxt(BLD.nakop)===BLD.nakop.note,"в стройке строка E–I говорит, что делает");
  ok(/нужна станция/.test(bldAtWhy(getSystem(s.sx,s.sy),BLD.branch))||s.station.stype==="sci","филиал — только на научной станции");
  /* тело (M296): огни на планете по постройкам, вся ночная сторона с Пояса огней; формы — на внешнем кольце */
  const nb=Object.keys(H.bld).length;
  ok(planetLightsN(s)===Math.min(24,nb*3),"огней на планете — по три на постройку ("+planetLightsN(s)+")");
  const mods=holdMods(s);
  ok(mods.length===nb&&mods.every(q=>q.d>=40&&q.d<=50&&q.s>=.55),"формы построек висят на внешнем кольце, штанги 40–50, готовые — крупнее");
  ok(typeof drawMooredBarge==="function"&&typeof drawPlanetLights==="function","причаленная баржа и огни планеты рисуются");
}));
