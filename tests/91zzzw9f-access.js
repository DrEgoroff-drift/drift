/* Доступ (M908, DESIGN-game §4.4): кредиты покупают вещи, допуск — нужные. «Мамонт» без допуска III
   и поручителя не продаётся; «Клинок»/«Обод»/«Топор» — допуск II или разнарядка; ни одна из тридцати
   ступеней не молчит; цеха второго яруса — по норме участка; G.acc переживает запись. */
function accTestStation(){
  for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station&&S.station.prices&&(S.planets||[]).some(p=>p.type!=="gas"))return S;}
  return null;
}
TEST_SUITES.push(()=>suite("доступ: «Мамонт» — допуск III и поручитель; вторая ступень — допуск II или разнарядка",()=>{
  resetWorld();
  const g=id=>yardGate(id,SHIPS[id]);
  G.clearance=1;
  ok(!g("strizh")&&!g("skat"),"«Стриж» и «Скат» — без ворот");
  ok(g("mamont")&&/III/.test(g("mamont").lock),"«Мамонт» при допуске I заперт: "+(g("mamont")||{}).lock);
  ok(g("klinok")&&/II/.test(g("klinok").lock)&&g("topor")&&g("obod"),"«Клинок», «Обод», «Топор» при допуске I заперты");
  G.clearance=2;
  ok(!g("klinok")&&!g("topor")&&g("mamont"),"допуск II открыл вторую ступень, «Мамонт» заперт");
  G.clearance=3;G.mgrs=[];G.acc=null;
  ok(g("mamont")&&/поручител/.test(g("mamont").lock),"допуск III без поручителя — отказ: "+(g("mamont")||{}).lock);
  G.mgrs.push({name:"Проба",role:"trade",xp:MGR_XP[2]+1});
  ok(accSponsor()&&!g("mamont"),"управляющий на уровне 3 — поручитель, «Мамонт» продаётся");
  G.mgrs=[];
  const S=accTestStation();
  accSt().sup[S.key]=ACC_SUP_N-1;
  ok(!accSponsor(),"станция, снабжённая семь заходов, ещё не поручитель");
  accSt().sup[S.key]=ACC_SUP_N;
  ok(accSponsor()&&accSponsor().why==="станция"&&!g("mamont"),"восемь заходов снабжения — станция ручается");
  /* разнарядка без допуска */
  G.clearance=1;G.acc=null;
  ok(g("klinok"),"до разнарядки «Клинок» заперт");
  accSt().allot=1;
  ok(!g("klinok")&&g("mamont"),"разнарядка открыла вторую ступень, но не «Мамонта»");
  /* свой корпус не запирается */
  G.acc=null;G.owned.mamont=true;
  ok(!g("mamont"),"свой «Мамонт» — без замка");
  delete G.owned.mamont;
  /* каталог: редкий не за кредиты */
  const rare=Object.keys(FLEET).find(id=>shipTier(FLEET[id])==="rare");
  if(rare)ok(/разнарядк/.test((yardGate(rare,FLEET[rare])||{}).lock||""),"редкий корпус каталога — только по разнарядке");
  /* снабжение — раз на заход */
  G.acc=null;dispTestDock(S);
  accSupply(S);accSupply(S);
  ok(accSt().sup[S.key]===1,"два привоза за один заход — один счёт: "+accSt().sup[S.key]);
  closeStation();G.mode="system";dispTestDock(S);accSupply(S);
  ok(accSt().sup[S.key]===2,"новый заход — второй счёт");
  /* запись */
  accSt().allot=1;
  const s=JSON.parse(JSON.stringify(snapshot()));G.acc=null;applySave(s);
  ok(accSt().allot===1&&accSt().sup[S.key]===2,"разнарядка и счёт снабжения пережили запись");
  const s2=JSON.parse(JSON.stringify(s));s2.acc={sup:{"x":5,"1,2":"мусор"},allot:"да"};G.acc=null;applySave(s2);
  ok(!accSt().sup.x&&accSt().sup["1,2"]===0,"битый счёт отброшен");
  delete s2.acc;G.acc=null;applySave(s2);
  ok(accSt().allot===0&&!Object.keys(accSt().sup).length,"старая запись без G.acc — пусто, мир цел");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("доступ: ни одна из тридцати ступеней не молчит",()=>{
  resetWorld();
  const S=accTestStation(),sx=S.sx,sy=S.sy;
  const M=sysMakes(S),mk=Object.keys(M)[0];
  const O=rungOf;let R=0;
  const P=()=>{
    rungOfCached.t=undefined;
    const L=accLever(sx,sy);delete L.r;
    G.hull=stat().hullMax-40;holdDock(S);const patched=G.hull>stat().hullMax-40;
    return JSON.stringify([L,rungAddress(R,sx,sy),bldSitesAt(sx,sy),
      bldTierOpenAt(sx,sy,{fam:"D",id:"slipway"}),bldTierOpenAt(sx,sy,{fam:"D",id:"x"}),
      patched,mk?bldRuleWhy(S,{eats:{[mk]:1}}):""]);
  };
  const silent=[],read=[];
  try{
    rungOf=()=>R;
    dispTestDock(S);
    let prev=P();
    for(R=1;R<=30;R++){const p=P();if(p===prev)silent.push(R+" "+RUNGS[R].id);prev=p;}
    /* рычаги читаются настоящими функциями: на 30-й всё дешевле и щедрее, чем на нулевой */
    /* товар с самым широким спредом: на узком прилавок упрётся в пол «сдача × 1.03» — и это верно */
    const sp=k=>(S.station.prices[k]||0)/Math.max(1,marketFor(S)[k]|0);
    const k=TRADE_KEYS.filter(k=>(S.station.prices[k]|0)>=60).sort((x,y)=>sp(y)-sp(x))[0];
    const probe=()=>{rungOfCached.t=undefined;const D=dispSt();D.it=[];D.vb=[];
      return {fuel:fuelPriceHere(),rep:repairCost(),sell:marketCtx(S).occ,buy:buyPriceFor(S,k),npc:watchNpcRate(S),
        disp:(dispIssue("haul",S,{})||{}).pay,g:gaugeRead(S.key)};};
    gaugeSet(S,{s:.05,m:.05,o:.05});
    G.hull=Math.round(stat().hullMax*.3);
    R=0;const a=probe();R=30;const b=probe();
    if(!(b.fuel<a.fuel))read.push("заправка "+a.fuel+"→"+b.fuel);
    if(!(b.rep<a.rep))read.push("ремонт "+a.rep+"→"+b.rep);
    if(!(b.sell>a.sell))read.push("скупка");
    if(!(b.buy<=a.buy))read.push("прилавок дороже на 30-й: "+a.buy+"→"+b.buy);
    if(!(b.npc>a.npc))read.push("баржи");
    if(!(b.g.s>=.5&&b.g.m>=.5&&b.g.o>=.6))read.push("полы шкал "+JSON.stringify(b.g));
    const m=marketFor(S)[k]|0,fl=Math.max(m+1,Math.min(a.buy,Math.round(m*ACC_SPREAD)));
    ok(b.buy>=fl&&b.buy>m,"прилавок на 30-й держит спред: "+b.buy+" ≥ "+fl+" (сдача "+m+", без ступеней "+a.buy+")");
    /* рычаг прилавка доходит до цены: там, где скупка его не съедает (спред станции широкий) */
    const wide=Math.round(m*1.4);
    ok(accCounter(S,k,wide)<wide,"широкий спред: прилавок на 30-й дешевле — "+wide+" → "+accCounter(S,k,wide));
    ok(isFinite(a.disp)&&isFinite(b.disp),"плата диспетчера считается на обеих ступенях");
  }finally{rungOf=O;rungOfCached.t=undefined;}
  ok(!silent.length,"ступени без эффекта: "+(silent.join(", ")||"нет"));
  ok(!read.length,"рычаги не дошли до функций: "+(read.join("; ")||"все дошли"));
  let notes=0;for(const i in ACC_RUNG)if(RUNGS[i].note.indexOf(ACC_RUNG[i][2])>=0)notes++;
  ok(notes===Object.keys(ACC_RUNG).length,"строка рычага в записке ступени: "+notes+" из "+Object.keys(ACC_RUNG).length);
  resetWorld();
}));
TEST_SUITES.push(()=>suite("доступ: цех второго яруса — ступень и норма участка",()=>{
  resetWorld();
  const S=accTestStation(),O=rungOf;
  const C=BLD[BLD_KEYS.find(id=>BLD[id].fam==="C"&&BLD[id].at==="any")];
  try{
    rungOf=()=>30;rungOfCached.t=undefined;
    const W=watchSt();W.last=null;
    ok(/норм/.test(bldWhy(S,C)),"без сводки цех «"+C.ru+"» не дают: "+bldWhy(S,C));
    W.last={norm:60};
    ok(/норм/.test(bldWhy(S,C)),"сводка 60 % — не дают");
    W.last={norm:80};
    ok(bldWhy(S,C)==="","сводка 80 % — цех можно заложить");
    W.last=null;
    const sw=BLD.slipway;
    if(sw)ok(!/норм/.test(bldWhy(S,sw)),"стапель нормой не заперт: «"+bldWhy(S,sw)+"»");
  }finally{rungOf=O;rungOfCached.t=undefined;}
  resetWorld();
}));
