/* ══════════════ автотесты: верфи держав (M714) ══════════════ */
TEST_SUITES.push(()=>suite("верфи держав: пять линий, порода и замок",{tier:"node"},()=>{
  resetWorld();
  eq(PYARD_MAKERS.length,5,"пять заводов кроме ГЛАВТРАССЫ");
  for(const by of PYARD_MAKERS){
    const ids=PYARD_KEYS.filter(id=>PYARD[id].by===by);
    eq(ids.length,PYARD_N,"линия «"+makerRu(by)+"» полная");
    const nm={};let dup=0,cls={};
    for(const id of ids){const S=shipData(id);
      if(nm[S.ru])dup++;nm[S.ru]=1;cls[S.hcls]=1;
      eq(makerOf(id,S),by,"порода корпуса — его завод: "+id);}
    eq(dup,0,"имена в линии не повторяются: "+by);
    ok(Object.keys(cls).length>=4,"линия не из одного класса: "+by+" "+Object.keys(cls).join(","));
    const h=hullOf(ids[0]);ok(h&&h.poly&&h.poly.length>3,"корпус линии строится: "+by);
  }
  /* характер завода виден в числах: Рассвет возит больше Хай-Фронта, Орднунг крепче Коммуны */
  const avg=(by,k)=>{const a=PYARD_KEYS.filter(id=>PYARD[id].by===by);return a.reduce((s,id)=>s+PYARD[id][k],0)/a.length;};
  ok(avg("ra","cargo")>avg("hf","cargo"),"Рассвет возит больше Хай-Фронта");
  ok(avg("or","hull")>avg("km","hull"),"Орднунг крепче Коммуны");
  /* замок: без дела с державой — не продают, в «Ялте» — вдвое */
  const id=PYARD_KEYS[0],S=shipData(id),g=yardGate(id,S);
  ok(g&&g.lock,"без дела с державой корпус под замком");
  eq(yardGate("strizh",shipData("strizh")),null,"серийный ряд ГЛАВТРАССЫ без замка");
  /* хозяин станции известен до отрисовки: раньше `by` ставил только stationMods, и любой прилавок
     до первого взгляда считал станцию ГЛАВТРАССОЙ — чужих верфей не было видно вовсе */
  const seen={};let n=0;
  for(let dx=-20;dx<=20;dx++)for(let dy=-20;dy<=20;dy++){if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);if(!s.station)continue;n++;seen[s.station.by]=1;}
  ok(n>20&&Object.keys(seen).length>=4,"станции разных держав видны без отрисовки: "+Object.keys(seen).join(","));
  const s0=getSystem(0,0);if(s0.station){s0.station.by="gt";eq(s0.station.by,"gt","завод станции можно задать руками");}
}));
