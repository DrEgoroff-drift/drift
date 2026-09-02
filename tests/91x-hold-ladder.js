/* ══════════════ автотесты: холдинг · лестница видимая (M292) ══════════════ */
TEST_SUITES.push(()=>suite("холдинг: тридцать ступеней, шесть ★, и каждую ★ кто-то спрашивает",()=>{
  resetWorld();
  ok(RUNGS.length===31&&RUNGS.slice(1).every(d=>d&&d.id&&d.ru&&d.note),"тридцать ступеней, у каждой имя и момент");
  ok(RUNG_STARS.join()==="buoy,cycle,site,site2,hub,lines,ring","шесть ★ — 5, 10, 15, 20, 25, 30 (+ site на 11)");
  ok([5,10,11,15,20,25,30].every(i=>RUNGS[i].star),"★ стоят на своих номерах");
  const ids=RUNGS.slice(1).map(d=>d.id),rus=RUNGS.slice(1).map(d=>d.ru);
  ok(new Set(ids).size===30&&new Set(rus).size===30,"имена и ключи не повторяются");
  /* закон имён: ступень — не постройка и не материал */
  const bldRu=BLD_KEYS.map(id=>BLD[id].ru),resRu=RES_KEYS.map(k=>RES[k].ru);
  ok(rus.every(r=>bldRu.indexOf(r)<0&&resRu.indexOf(r)<0),"ни одно имя ступени не совпадает с постройкой или материалом");
  ok(rungPlanOf(0)===0&&rungPlanOf(1)===1&&rungPlanOf(5)===1&&rungPlanOf(6)===2&&rungPlanOf(30)===6,"пятилетки: 1–5 → I … 26–30 → VI");
  ok(rungRingSegs(4)===0&&rungRingSegs(5)===1&&rungRingSegs(14)===2&&rungRingSegs(30)===6,"сегменты кольца — по закрытой пятилетке, с ★5");
  const s=siteTestStation();
  if(!s){ok(true,"пропущено");return;}
  ok(rungFootTxt(s.sx,s.sy)===""&&rungMoments(s)===0,"нетронутая система: ни цифры в подвале, ни момента");
  siteTestOpen(s);
  const r=rungOf(s.sx,s.sy);
  ok(r>=11&&rungFootTxt(s.sx,s.sy)===" · III","в подвале карты — римская цифра пятилетки");
  /* момент при стыковке: объявляется раз */
  const n=rungMoments(s);
  ok(n>=1&&G.hold[s.key].rung===r,"стыковка объявила пройденное ("+n+" строк) и запомнила");
  ok(rungMoments(s)===0,"второй раз не объявляет");
  /* каждую ★ кто-то спрашивает через rungHas */
  rungHas.asked={};
  bldAvailable(s);bldFreeSites(s);rungAddress(30,s.sx,s.sy);holdDock(s);
  buoyEtherLine(()=>0);   /* без шанса: строка обязана спросить буй */
  const asked=Object.keys(rungHas.asked||{});
  ok(RUNG_STARS.every(id=>asked.indexOf(id)>=0),"все ★ спрошены через rungHas: "+asked.join(", "));
  /* ★10: у причала латают корпус */
  G.hull=1;holdDock(s);
  ok(rungHas(s.sx,s.sy,"cycle")&&G.hull>1,"замкнутый цикл: стыковка подлатала корпус (+"+(G.hull-1)+")");
  /* площадки и ярусы читаются через ★ */
  ok(bldSitesAt(s.sx,s.sy)===1,"одна площадка на монтажной площадке");
  ok(!bldTierOpenAt(s.sx,s.sy,BLD.bearingshop)&&/пятилетке/.test(bldWhy(s,BLD.bearingshop)),"второй ярус ждёт IV пятилетки: "+bldWhy(s,BLD.bearingshop));
}));
