/* ══════════════ автотесты: борт «Сороки» — комната и лавка (M343) ══════════════
   Полка стоянки одна на эпоху; купленное не возвращается; спички не уходят в
   минус; у каждого инструмента есть, кто его читает; комната открывается у трапа
   и рисуется; прилавок сырья считает целыми спичками и коробком за стоянку. */
TEST_SUITES.push(()=>suite("сорока: полка стоянки сеяна эпохой, купленное — меловая бирка",()=>{
  resetWorld();
  G.wander=null;
  const w0=wanderAt(WANDER_T0+1000),w1=wanderAt(WANDER_T0+4*86400e3+1000);
  const A=wanderLots(w0),B=wanderLots(w0),C=wanderLots(w1);
  eq(A.length,w0.dark?4:8,"восемь витрин на обитаемой стоянке, четыре на тёмной");
  eq(A.map(l=>l.id).join(","),B.map(l=>l.id).join(","),"та же эпоха — та же полка");
  ok(A.map(l=>l.id).join(",")!==C.map(l=>l.id).join(","),"другая эпоха — другая полка");
  ok(A.some(l=>l.fam==="tool")&&A.some(l=>l.fam==="paper")&&A.some(l=>l.fam==="wild"),"инструменты, бумага и свёрток");
  const seen=new Set();ok(A.every(l=>l.empty||!seen.has(l.id)&&seen.add(l.id)),"один лот — одна витрина");
  /* купить инструмент за спички: спички списаны, вещь на полке кабины, витрина пуста */
  const tool=A.find(l=>l.fam==="tool"&&!l.gone);
  ok(!!tool,"есть инструмент на продажу");
  G.matches=0;
  ok(!wanderBuy(tool)&&matchesRec()===0,"без спичек не продают");
  G.matches=tool.pay.m+2;
  ok(wanderBuy(tool),"за спички — продали");
  eq(matchesRec(),2,"списано ровно по цене");
  ok(wanderHas(tool.id),"инструмент лёг на полку кабины и работает");
  const A2=wanderLots(w0);
  ok(A2[tool.i].gone&&/продано/.test(A2[tool.i].chalk||""),"витрина пуста, мелом — «продано»");
  ok(!wanderBuy(A2[tool.i]),"второй раз не продадут");
  /* полка кабины — шесть мест; седьмой в трюм; работает только с полки */
  const R=wanderStore();
  R.shelf=["gyro","valve","blanket","pencil","bell","notebook"];R.hold=[];
  const t2=wanderLots(w0).find(l=>l.fam==="tool"&&!l.gone&&R.shelf.indexOf(l.id)<0);
  if(t2){G.matches=99;wanderBuy(t2);ok(R.hold.indexOf(t2.id)>=0&&!wanderHas(t2.id),"седьмой — в трюм, и не работает");
    ok(!wanderToShelf(t2.id),"на полную полку не ложится");
    ok(wanderToHold("gyro")&&wanderToShelf(t2.id)&&wanderHas(t2.id),"освободили место — лёг и работает");}
  else ok(true,"седьмого инструмента на этой полке нет");
  /* сейв несёт полку и трюм */
  const snap=snapshot();G.wander=null;applySave(snap);
  eq(wanderStore().shelf.length,6,"полка вернулась из сейва");
  G.wander=null;G.matches=0;
}));

TEST_SUITES.push(()=>suite("сорока: у каждого инструмента есть, кто его читает; эффекты малы и настоящие",()=>{
  resetWorld();
  G.wander=null;
  const src=document.scripts[0].textContent;
  const mute=[];
  for(const c of WANDER_CAT){
    if(c.fam!=="tool")continue;
    const n=src.split('wanderHas("'+c.id+'")').length-1;
    if(n<1)mute.push(c.id);
    const f=src.indexOf(c.hook.replace(/-.*$/,""))>=0;
    if(!f)mute.push(c.id+"(hook)");
  }
  eq(mute.join(", "),"","каждый инструмент читается кем-то по имени");
  /* эффекты: поворот, бак, откат, прыжок в опасной системе */
  const R=wanderStore();
  const t0=stat().turn,f0=stat().fuelMax,c0=stat().cool;
  R.shelf=["gyro","valve","blanket"];
  ok(Math.abs(stat().turn/t0-1.05)<.001,"гирокомпас: поворот +5 %");
  eq(stat().fuelMax,f0+7,"клапан: бак +7");
  ok(stat().cool<c0,"одеяло: откат короче");
  R.shelf=["sextant"];
  const j0=stat().jump;
  G.sx=0;G.sy=0;eq(stat().jump,j0,"секстант у дома молчит");
  G.sx=30;G.sy=0;ok(stat().jump>j0,"секстант в опасной системе даёт прыжок");
  G.sx=0;G.sy=0;
  R.shelf=["shelfwide"];eq(kitShelfMax(),18,"полка шире — восемнадцать");
  R.shelf=[];eq(kitShelfMax(),12,"а без неё двенадцать");
  /* игла: корпус срастается в полёте, не в бою */
  R.shelf=["needle"];G.mode="system";G.hull=10;G.pirates=[];
  for(let i=0;i<3601;i++)wanderTick(1);
  eq(G.hull,11,"игла: +1 корпуса за минуту полёта");
  G.pirates=[{aware:true}];for(let i=0;i<3601;i++)wanderTick(1);
  eq(G.hull,11,"в бою игла не шьёт");
  G.pirates=[];G.hull=100;
  G.wander=null;
}));

TEST_SUITES.push(()=>suite("сорока: прилавок сырья — целыми спичками и коробком на стоянку; редкость показать",()=>{
  resetWorld();
  G.wander=null;G.matches=0;
  G.cargo.volatiles=95;
  eq(wanderRawQuote("volatiles",95),2,"95 летучих — две спички, остаток не в счёт");
  eq(wanderSellRaw("volatiles"),2,"сдали две");
  eq(G.cargo.volatiles,15,"пятнадцать осталось: доли спички нет");
  eq(matchesRec(),2,"и две спички в кошельке");
  eq(wanderSellRaw("volatiles"),0,"меньше сорока — не берут");
  G.cargo.alloy=400;
  const m=wanderSellRaw("alloy");
  eq(m,3,"коробок на стоянку: 200 единиц всего, 80 уже сдано — ещё три спички (120)");
  eq(wanderRawLeft(),0,"стоянка выбрана");
  eq(wanderSellRaw("alloy"),0,"больше на этой стоянке не берут");
  /* редкость: четыре спички, один раз, вещь остаётся */
  rareList().push(RARE[0].id);
  ok(wanderShowRare(RARE[0].id),"показали редкость");
  eq(matchesRec(),9,"четыре спички за показ");
  ok(!wanderShowRare(RARE[0].id),"второй раз за ту же — нет");
  ok(rareHas(RARE[0].id),"редкость осталась у вас");
  eq(wanderShowables().length,0,"показывать больше нечего");
  G.rareFound=[];G.matches=0;G.wander=null;
  for(const k of RES_KEYS)G.cargo[k]=0;
}));

TEST_SUITES.push(()=>suite("сорока: комната открывается у трапа, рисуется, свёрток берёт часть и отдаёт артефакт",()=>{
  resetWorld();
  G.wander=null;
  const now0=Date.now;
  try{
    const w=wanderAt(WANDER_T0+1000);
    Date.now=()=>WANDER_T0+1000;
    G.sys=getSystem(w.sx,w.sy);G.sx=w.sx;G.sy=w.sy;G.mode="system";
    ok(openWanderer(),"трап спущен");
    eq(G.mode,"wanderer","режим — на борту");
    ok(!!G.wan&&G.wan.epoch===w.epoch,"комната знает эпоху");
    let err="";
    try{for(let i=0;i<6;i++){updateWanderRoom(1);drawWanderRoom();}}catch(e){err=e.message+" "+String(e.stack||"").split("\n")[1];}
    eq(err,"","комната рисуется без исключений");
    ok(!!document.getElementById("wanwin")&&document.getElementById("wanwin").classList.contains("open"),"пульт над кадром");
    const btns=[...document.querySelectorAll("#wanwin button")];
    ok(btns.some(b=>b.textContent==="▶")&&btns.some(b=>b.textContent==="УЙТИ"),"на пульте шаг и выход");
    /* шаг по коридору фронтом клавиши */
    const c0=G.wan.cursor;keys.right=true;updateWanderRoom(1);keys.right=false;updateWanderRoom(1);
    eq(G.wan.cursor,c0+1,"шаг вправо — следующая витрина");
    keys.right=true;updateWanderRoom(1);updateWanderRoom(1);keys.right=false;
    eq(G.wan.cursor,c0+2,"удержание — один шаг, не разбег");
    /* свёрток: без части не меняют, с отменной — артефакт */
    const lots=wanLots(),wild=lots.find(l=>l.fam==="wild");
    ok(!!wild,"свёрток лежит");
    G.inv=[];G.relics={};G.rareFound=[];
    ok(!!wanderCant(wild),"без части не меняют: "+wanderCant(wild));
    addPart(genPart(9901,4,"engine"));
    ok(!wanderCant(wild),"с отменной частью — можно");
    ok(wanderBuy(wild),"обменяли");
    eq(G.inv.length,0,"часть ушла");
    ok(relicOwned().length===1,"пришёл артефакт");
    ok(wanLots()[wild.i].gone,"витрина свёртка пуста");
    /* стоянка кончилась — вас выводят */
    Date.now=()=>WANDER_T0+3*86400e3+5000;
    updateWanderRoom(1);
    eq(G.mode,"system","борт ушёл — вы в системе");
    ok(!G.wan,"комнаты нет");
    Date.now=()=>WANDER_T0+1000;
    /* стенд: форс и эпоха 0 */
    ok(openWanderer({force:true,epoch:0})&&G.wan.epoch===0&&G.wan.w.forced,"стенд открывает комнату с полкой эпохи 0");
    exitWanderer();
    eq(G.mode,"system","вышли к трапу");
  }finally{Date.now=now0;}
  G.relics={};G.rareFound=[];G.inv=[];G.wander=null;
  ok(lookScenes().some(s=>s.id==="сорока"),"сцена «сорока» — в общем списке прибора и фаззера");
}));
