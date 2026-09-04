/* ══════════════ автотесты: ящик конторы (M345) ══════════════
   Положить и забрать без потерь; плата — процент в сутки по реальным часам, один
   раз на визит, без долга; месяц без визита — части всплывают на блошинце лотами
   «залог, за которым не пришли»; зона на ОПИСИ только у станции шестой ступени. */
TEST_SUITES.push(()=>suite("ящик: положить и забрать — часть, куча, инструмент",()=>{
  resetWorld();
  G.locker=null;G.wander=null;G.credits=5000;
  const p=addPart(genPart(5501,3,"gun"));
  ok(lockerPutPart(p.id),"часть легла в ящик");
  eq(G.inv.length,0,"из инвентаря ушла");
  eq(lockerUsed(),1,"занято одно место");
  G.cargo.iron=30;
  ok(lockerPutRes("iron",20),"двадцать железа в ящик");
  eq(G.cargo.iron,10,"десять осталось в трюме");
  eq(lockerUsed(),2,"куча — второе место");
  wanderStore().hold.push("gyro");
  ok(lockerPutTool("gyro"),"инструмент из трюма — в ящик");
  ok(wanderStore().hold.indexOf("gyro")<0&&lockerUsed()===3,"и его нет в трюме");
  G.cargo.folk=1;ok(!lockerPutRes("folk",1),"людей в ящик не кладут");
  ok(lockerValue()>0,"содержимое чего-то стоит");
  /* сейв: части упакованы и возвращаются теми же */
  const snap=snapshot();G.locker=null;applySave(snap);
  eq(lockerUsed(),3,"ящик вернулся из сейва");
  ok(lockerTake(0),"часть забрана");
  eq(G.inv.length,1,"и она в инвентаре");
  eq(G.inv[0].seed,p.seed,"та же часть — то же зерно");
  eq(G.inv[0].tier,3,"и тот же тир");
  ok(lockerTakeRes("iron"),"железо забрано");
  eq(G.cargo.iron,30,"всё железо снова в трюме");
  ok(lockerTake(0),"инструмент забран");
  ok(wanderHas("gyro"),"и лёг на полку кабины — место было");
  eq(lockerUsed(),0,"ящик пуст");
  /* мест 24, со «Вторым ящиком» 48 */
  eq(lockerSlots(),24,"двадцать четыре места");
  wanderStore().shelf=["box2"];eq(lockerSlots(),48,"второй ящик — сорок восемь");
  wanderStore().shelf=[];
  G.locker=null;G.wander=null;for(const k of RES_KEYS)G.cargo[k]=0;
}));

TEST_SUITES.push(()=>suite("ящик: плата процентом в сутки, без долга; месяц — на блошинец",()=>{
  resetWorld();
  G.locker=null;G.flea=null;G.credits=10000;
  const now0=Date.now;
  try{
    const T=WANDER_T0+10*86400e3;
    Date.now=()=>T;
    const p=addPart(genPart(5502,4,"engine"));lockerPutPart(p.id);
    lockerRec().t=T;
    const v=lockerValue();ok(v>0,"стоимость посчитана: "+v);
    eq(lockerTick(T+3600e3).fee,0,"за час — ничего");
    Date.now=()=>T+5*86400e3+1000;
    const r=lockerTick();
    eq(r.days,5,"пять суток прошло");
    eq(r.fee,Math.round(v*.01*5),"пять процентов списано");
    eq(G.credits,10000-r.fee,"из кассы");
    eq(lockerTick().fee,0,"второй раз в тот же час — ничего: считано лениво, один раз");
    /* нет денег — списали что было, долга нет */
    G.credits=3;Date.now=()=>T+7*86400e3+1000;
    const r2=lockerTick();eq(r2.fee,3,"списали три — всё, что было");
    eq(G.credits,0,"и не в минус");
    /* тридцать суток — сдача на блошинец */
    Date.now=()=>T+40*86400e3;
    const r3=lockerTick();
    ok(r3.gone,"контора сдала ящик");
    eq(lockerUsed(),0,"ящик пуст");
    eq(fleaRec().pawn.length,1,"часть — в залоге у блошинца");
    /* на любом блошинце она лежит лотом первой, с честным провенансом */
    let bz=null;
    for(let dx=-12;dx<=12&&!bz;dx++)for(let dy=-12;dy<=12&&!bz;dy++){if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station&&s.station.stype==="bazaar")bz=s;}
    if(bz){
      const L=fleaLots(bz);
      const pw=L.find(l=>l.pawn!=null);
      ok(!!pw&&/залог/.test(pw.why)&&pw.tier===4,"лот «залог, за которым не пришли», тир тот же");
      G.credits=100000;G.sys=bz;
      ok(!!fleaBuy(pw.id,"cr",bz),"куплен за кредиты");
      eq(fleaRec().pawn.length,0,"залог ушёл к новому хозяину");
      ok(!fleaLots(bz).some(l=>l.pawn!=null),"и на прилавке его больше нет");
    }else ok(true,"блошинца в 12 секторах не нашлось — лот не меряем");
  }finally{Date.now=now0;}
  G.locker=null;G.flea=null;G.inv=[];
}));

TEST_SUITES.push(()=>suite("ящик: зона на ОПИСИ только у станции шестой ступени",()=>{
  resetWorld();
  G.locker=null;
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  ok(!lockerHere(),"в полёте ящика нет");
  G.sys=nearestStation(0,0);G.sx=G.sys.sx;G.sy=G.sys.sy;G.mode="dock";G.st=G.sys.station;
  ok(!lockerHere(),"у станции первой ступени — тоже нет");
  tableToggle(true,"hold");
  ok(!document.querySelector("#loglist .op-locker"),"и зоны на сукне нет");
  tableToggle(false);
  const r0=rungOf;
  try{
    rungOf=()=>6;
    ok(lockerHere(),"шестая ступень — окно конторы открыто");
    addPart(genPart(5503,2,"util"));G.cargo.ice=4;
    tableToggle(true,"hold");
    const box=document.getElementById("loglist");
    ok(!!box.querySelector(".op-locker"),"зона ЯЩИК на сукне");
    ok(/ЯЩИК/.test(box.textContent),"и подписана");
    const put=[...box.querySelectorAll(".op-card.part button")].find(b=>/В ЯЩИК/.test(b.textContent));
    ok(!!put,"у снятой части кнопка «В ЯЩИК»");
    put.click();
    eq(lockerUsed(),1,"часть в ящике");
    ok(!!box.querySelector(".op-locker .op-card.lock"),"и лежит в зоне карточкой");
    const take=[...box.querySelectorAll(".op-locker button")].find(b=>/ЗАБРАТЬ/.test(b.textContent));
    take.click();
    eq(lockerUsed(),0,"забрали обратно");
    tableToggle(false);
  }finally{rungOf=r0;}
  G.mode="system";G.st=null;G.locker=null;G.inv=[];G.cargo.ice=0;
}));
