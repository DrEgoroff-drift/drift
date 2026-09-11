/* ══════════════ плейтест автора 11.09: «игрок делает X → видит Y» ══════════════
   Пункты 2–6 плана «PLAYABLE ON A PHONE»: подсказка одна на кадр, ДЕЛО сходится,
   лист стола называет себя, ОПИСЬ на телефоне, карточка улучшения и сплава,
   карточка после боя, цена дрона от парка, люди только онлайн, масштаб тел. */

/* ══ блок ревью 12.09 (R0–R6): сперва красный тест, потом правка ══ */

/* R0: новичок в системе старта молчит — его не разбивают, окно оклика было */
TEST_SUITES.push(()=>suite("R0 пикет: новичок молчит две минуты в системе старта — корпус цел, окно оклика было",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=0;G.sy=0;SYS_CACHE.delete("0,0");G.sys=getSystem(0,0);G.hailLog={};G.hail=null;
  G.pirates=[];npcSpawn();
  const pk=G.pirates.find(p=>p.pw&&p.hull>0);
  ok(!!pk,"в системе старта стоит пикет");
  G.ship.x=pk.x+300;G.ship.y=pk.y;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;G.fuel=60;
  const hull0=G.hull;let seen=false;
  for(let i=0;i<7200;i++){
    stepWorld(1);G.t+=1;
    if(i%30===0){const w=document.getElementById("hailwin");if(w&&w.classList.contains("open"))seen=true;}
  }
  ok(seen,"окно оклика с двумя ответами было на экране");
  ok(G.hull>stat().hullMax*.5,"корпус больше половины: "+Math.round(G.hull)+" из "+stat().hullMax+" (был "+Math.round(hull0)+")");
  ok(G.mode==="system","корабль не разбит");
}));

TEST_SUITES.push(()=>suite("R0 стена новичка: первые баки и трюм по карману, дальше прежняя степень",()=>{
  resetWorld();
  ok(modCost("tank",0)<=G.credits,"первые баки — на стартовые: "+modCost("tank",0)+" из "+G.credits);
  eq(modCost("hold",0),900,"первый трюм — 900");
  eq(modCost("tank",1),Math.round(MODS.tank.base*Math.pow(2,1.55)),"вторая ступень баков — прежняя");
}));

TEST_SUITES.push(()=>suite("R0 оклик: ЦЕЛЬ отвечает «ПО ДЕЛУ», даже если рядом был непрозондированный мир",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  G.hail={by,t:HAIL_HOLD,warn:0,x:G.ship.x,y:G.ship.y,blk:0};
  G._probeAt={sx:G.sx|0,sy:G.sy|0,idx:0};
  G.credits=1000;
  HELM.lockEdge=true;helmTick(1);
  eq(G.hail,null,"оклик получил ответ");
  eq(G.credits,1000,"зонд не куплен");
  G._probeAt=null;
}));

TEST_SUITES.push(()=>suite("R0 блокада: велено стоять — тот, кто стоит, пропущен, а не обстрелян",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+500,G.ship.y,1);p.aware=false;G.pirates=[p];
  G.hail={by,t:HAIL_HOLD,warn:0,x:G.ship.x,y:G.ship.y,blk:1};
  G.hailLog={};G.hailLog[G.sx+","+G.sy+"|"+by]=Math.floor(now()/1800000);   /* второго оклика в эту смену нет */
  hailAnswer("pass");
  ok(!!G.hail&&G.hail.hold,"«проходом» в блокаде — велено стоять");
  for(let i=0;i<hailHold()+10;i++)hailTick(G.ship,1,false);   /* срок у телефона свой */
  eq(G.hail,null,"простоял срок — отпустили");
  eq(p.iff,1,"пикет не открыл огонь");
}));

TEST_SUITES.push(()=>suite("R0 пэды: на оклике ДЕЙСТВИЕ — «ПРОХОДОМ», ЦЕЛЬ — «ПО ДЕЛУ»",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+500,G.ship.y,1);p.aware=false;G.pirates=[p];
  G.hail={by,t:HAIL_HOLD,warn:0,x:G.ship.x,y:G.ship.y,blk:0};
  hailTick(G.ship,1,false);hud();
  eq(document.querySelector("[data-k=act]").textContent.trim(),"ПРОХОДОМ","ДЕЙСТВИЕ называет ответ");
  eq(document.getElementById("lockbtn").textContent.trim(),"ПО ДЕЛУ","ЦЕЛЬ называет второй ответ");
  G.hail=null;hailTick(G.ship,1,false);hud();
}));

/* R0, дыры с дева (143d6f1): «читал журнал — получил залп». За открытым экраном оклик
   ждёт и пикет молчит, окно оклика — поверх экрана; на телефоне на ответ 15 с; под окном
   фишки компаса гаснут, как борт */
TEST_SUITES.push(()=>suite("R0 оклик за СТОЛОМ: двадцать секунд за столом — оклик ждёт, корпус цел; стол закрыт — ДЕЙСТВИЕ отвечает",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.hailLog={};G.hail=null;G.pirates=[];
  ok(!hailStartSys(),"не система старта: там свой пол корпуса");
  G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  T.wait(1);
  ok(SYS_CHIPS.length>0,"без оклика фишка у кромки ловит тычок");
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+300,G.ship.y,1);p.aware=false;G.pirates=[p];
  T.wait(2);
  ok(!!G.hail,"пикет окликнул сам");
  G.hail.blk=0;   /* не блокада: там «проходом» — не ответ */
  ok(G.hail.t>=880,"на телефоне на ответ 15 секунд: осталось "+Math.round(G.hail.t)+" кадров");
  eq(SYS_CHIPS.length,0,"под окном оклика фишки не ловят тычок");
  const hull0=G.hull;
  tableToggle(true);
  for(let i=0;i<1200;i++){stepWorld(1);G.t+=1;}
  ok(!!G.hail&&!G.hail.warn,"двадцать секунд за столом — оклик ждёт, предупреждения не было");
  eq(G.hull,hull0,"корпус цел");
  eq(p.iff,1,"пикет не открыл огонь");
  const w=document.getElementById("hailwin");
  ok(!!w&&w.classList.contains("open"),"окно оклика открыто и за столом");
  const r=w.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  ok(!!top&&w.contains(top),"поверх стола виден оклик, а не лист: "+(top&&(top.id||top.className||top.tagName)));
  tableToggle(false);
  T.press("act",1);
  eq(G.hail,null,"стол закрыт — ДЕЙСТВИЕ ответило на оклик");
  G.pirates=[];
}));

TEST_SUITES.push(()=>suite("R0 за экраном по вам не стреляют: злой борт рядом, стол открыт — корпус цел; стол закрыт — бой идёт",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.hailLog={};G.hail=null;
  G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;G.shield=0;
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+200,G.ship.y,1);p.iff=0;p.aware=true;G.pirates=[p];
  G.hailLog[G.sx+","+G.sy+"|"+by]=Math.floor(now()/1800000);   /* оклика нет — сразу бой */
  const hull0=G.hull;
  tableToggle(true);
  for(let i=0;i<300;i++){stepWorld(1);G.t+=1;}
  eq(G.hull,hull0,"пять секунд за столом — ни одного попадания");
  tableToggle(false);
  for(let i=0;i<600&&G.hull>=hull0;i++){stepWorld(1);G.t+=1;}
  ok(G.hull<hull0,"стол закрыт — злой борт снова стреляет: "+Math.round(G.hull)+" из "+Math.round(hull0));
  G.pirates=[];
}));

/* R1: действие делает то, что написано, когда в кадре два предложения */
TEST_SUITES.push(()=>suite("R1 пояс рядом с планетой: подсказка и ДЕЙСТВИЕ совпадают",{tier:"browser"},()=>{
  resetWorld();
  let S=null;
  for(let r=0;r<8&&!S;r++)for(let x=-r;x<=r&&!S;x++)for(let y=-r;y<=r&&!S;y++){
    const s=getSystem(x,y);if(s.belt&&s.planets.some(p=>p.type!=="gas"))S=s;
  }
  ok(!!S,"нашлась система с поясом");
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;
  const p=S.planets.find(q=>q.type!=="gas"),B=S.belt;
  T.wait(1,{draw:false});
  /* кольцо пояса — через точку в 50 ед. от поверхности планеты: два предложения в одном кадре */
  const u=Math.hypot(p.x,p.y)||1;
  G.ship.x=p.x+p.x/u*(p.radius+50);G.ship.y=p.y+p.y/u*(p.radius+50);
  B.orbit=Math.hypot(G.ship.x,G.ship.y);
  G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;G.hail=null;G.pirates=[];
  T.wait(1,{draw:false});
  const said=G.prompt;
  const nd=Math.hypot(G.ship.x-p.x,G.ship.y-p.y)-p.radius,rr=Math.abs(Math.hypot(G.ship.x,G.ship.y)-B.orbit);
  ok(nd<110&&rr<90,"в кадре оба предложения: до планеты "+Math.round(nd)+", от кольца "+Math.round(rr));
  ok(/ДЕЙСТВИЕ —/.test(said),"в кадре есть предложение: "+said.split("\n")[0]);
  T.press("act",1);
  const belt=/ВОЙТИ В/.test(said),land=/ПОСАДКА/.test(said);
  ok((belt&&G.mode==="belt")||(land&&(G.mode==="landing"||G.mode==="surface")),
    "нажатие сделало написанное: «"+said.split("\n")[0]+"» → режим "+G.mode);
  if(G.mode==="belt")try{exitBelt();}catch(e){}
  G.mode="system";
}));

TEST_SUITES.push(()=>suite("R1 оклик у причала: подсказка — оклик, ДЕЙСТВИЕ отвечает, а не стыкует",{tier:"browser"},()=>{
  T.go("система");
  const S=G.sys.station;
  ok(!!S,"станция в системе");
  G.pirates=[];T.wait(1,{draw:false});   /* станция встала на орбиту */
  G.ship.x=S.x+40;G.ship.y=S.y;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  G.hail={by,t:HAIL_HOLD,warn:0,x:G.ship.x,y:G.ship.y,blk:0};
  T.wait(1,{draw:false});
  ok(/ОКЛИК/.test(G.prompt),"подсказка — оклик: "+G.prompt);
  T.press("act",1);
  eq(G.hail,null,"ДЕЙСТВИЕ ответило на оклик");
  ok(G.mode==="system","и не пристыковало");
}));

/* R1: модуль действует, только если на экране его строка — чужое ДЕЙСТВИЕ нажатие не отдаёт */
TEST_SUITES.push(()=>suite("R1 на экране чужое ДЕЙСТВИЕ: танкер и подбитый борт рядом нажатие не забирают",()=>{
  resetWorld();
  const sys=G.sys,st=stat(),X=G.ship.x,Y=G.ship.y;G.mode="system";
  const other=()=>{cueReset();cue("ДЕЙСТВИЕ — ВОЙТИ В ПОЯС",CUE_ACT);};
  sys.fleetCache={b:Math.floor(now()/FLEET_PERIOD),list:[{k:"tanker",seed:3,name:"ТЕСТ",num:"Л-1",line:1,x0:X+50,y0:Y,x1:X+50,y1:Y,bow:0,ph:0}]};
  G.fleetLog={};G.hail=null;G.fuel=Math.round(st.fuelMax*.2);const f0=G.fuel;
  other();actEdge=true;fleetInteract(G.ship);actEdge=false;
  ok(/ПОЯС/.test(G.prompt),"на экране осталась строка пояса: "+G.prompt);
  eq(G.fuel,f0,"танкер не заправил — его строки на экране не было");
  cueReset();actEdge=true;fleetInteract(G.ship);actEdge=false;
  ok(G.fuel>f0,"своя строка на экране — заправка по норме");
  delete sys.fleetCache;
  G.pirates=[{x:X+60,y:Y,vx:0,vy:0,a:0,hull:1,hullMax:10,hp:1,pw:MAKER_KEYS[0],seed:1}];
  const f1=G.fuel;
  other();npcRescue(G.ship,true);
  eq(G.fuel,f1,"подбитому борту топливо не ушло — на экране пояс");
  cueReset();npcRescue(G.ship,true);
  ok(G.fuel<f1,"своя строка — поделились топливом");
  G.pirates=[];
}));

TEST_SUITES.push(()=>suite("подсказка: старший уровень бьёт младший в любом порядке",()=>{
  resetWorld();
  cueReset();
  cue("сведения",CUE_INFO);cue("тревога",CUE_WARN);cue("ещё сведения",CUE_INFO);
  eq(G.prompt,"тревога","сведения после тревоги её не перебили");
  cue("действие",CUE_ACT);eq(G.prompt,"действие","действие бьёт тревогу");
  cue("беда",CUE_TROUBLE);cue("снова действие",CUE_ACT);
  eq(G.prompt,"беда","беду не перебивает ничто младше");
  cueReset();eq(G.prompt,"","новый кадр начинается с пустого слота");
}));

TEST_SUITES.push(()=>suite("полёт: сухой бак у края и у планеты называет выход, ДЕЙСТВИЕ открывает окно",{tier:"browser"},()=>{
  T.go("система");
  document.body.classList.remove("sosopen");
  /* у края: прежде «ГРАВИТАЦИОННЫЙ ЯКОРЬ» занимал слот первым, и бак молчал */
  G.fuel=0;G.ship.x=G.sys.radius*80;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  T.wait(2,{draw:false});
  ok(/ХОДА НЕТ/.test(G.prompt),"у края пустой бак назван: "+G.prompt.split("\n")[0]);
  T.press("act",1);
  ok(document.body.classList.contains("sosopen"),"ДЕЙСТВИЕ открыло окно выходов");
  toggleSos(false);
  /* в 180 ед. от поверхности: прежде имя планеты обрывало кадр до проверки бака */
  const p=G.sys.planets[0];
  G.ship.x=p.x+p.radius+180;G.ship.y=p.y;G.ship.vx=0;G.ship.vy=0;
  T.wait(2,{draw:false});
  ok(/ХОДА НЕТ/.test(G.prompt),"у планеты сухой корабль тоже видит выход: "+G.prompt.split("\n")[0]);
  G.fuel=50;T.wait(2,{draw:false});
  ok(G.prompt.indexOf(p.name)===0,"с топливом там же — имя планеты: "+G.prompt);
  toggleSos(false);
}));

TEST_SUITES.push(()=>suite("ДЕЛО: шапка — сумма строк, бездонная точка без минуса, строки со шевроном",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="surface";G.surf={p:G.sys.planets[0]};
  G.droneInventory=3;droneTarget="iron";deployDrone();deployDrone();deployDrone();
  G.mode="system";G.surf=null;
  const R=droneRoutes();
  eq(R.length,1,"три машины на одной точке — один маршрут");
  ok(R[0].deep&&R[0].pool===0,"метки бездонной точки не складываются в число");
  openDeal();
  const body=document.getElementById("dlBody");
  ok(!/осталось\s*[−-]/.test(body.textContent),"«в точке осталось −N» не печатается");
  ok(/бездонная/.test(body.textContent),"строка маршрута говорит, что точка бездонная");
  const sum=R.reduce((a,r)=>a+r.perMin,0);
  ok(body.querySelector(".sec.note").textContent.indexOf("итого "+dealRate(sum)+" кр")>=0,
    "шапка сходится со строками: "+body.querySelector(".sec.note").textContent);
  const go=body.querySelectorAll(".row.go");
  ok(go.length>=1&&[...go].every(r=>!!r.querySelector(".chev")),"нажимаемые строки несут шеврон");
  go[0].click();
  ok(body.querySelectorAll(".row.sub").length===3,"тап по маршруту раскрыл три машины");
  closeDeal();
}));

TEST_SUITES.push(()=>suite("СТОЛ: лист называет себя, ленту отрывают на листе",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  tableToggle(true);tableSetTab("strips");
  eq(document.getElementById("tableTtl").textContent,"ЛЕНТЫ","заголовок листа — где ты");
  ok(document.getElementById("tableBack").style.display!=="none","«← СТОЛ» — на кнопке назад");
  const Tp=tapeInit();Tp.n=30;
  tableRender();
  const b=[...document.querySelectorAll("#loglist .li.tear button")].find(x=>/ОТОРВАТЬ/.test(x.textContent));
  ok(!!b,"на бумаге 30 делений — кнопка ОТОРВАТЬ ЛЕНТУ на листе");
  const n0=stripsAll().length;b.click();
  eq(stripsAll().length,n0+1,"тап оторвал ленту");
  tableSetTab("top");
  eq(document.getElementById("tableTtl").textContent,"СТОЛ","наверху — снова СТОЛ");
  tableToggle(false);
}));

TEST_SUITES.push(()=>suite("ОПИСЬ на телефоне: корабль первым, пустое свёрнуто, слот выбирается с корпуса",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  tableToggle(true,"hold");
  const box=document.getElementById("loglist");
  if(innerWidth<=760){
    ok(!!box.querySelector(".op-folds .op-fold"),"пустая полка и запертая шкатулка — строками внизу");
    ok(!box.querySelector(".op-top .op-shelf"),"полки нет над кораблём");
    const cap=box.querySelector(".op-hullcap");
    ok(!!cap&&!!cap.querySelector(".lg i"),"под силуэтом — легенда родов");
    OPIS.sel={t:"slot",i:0};opisRerender();
    ok(/СЛОТ 1/.test(box.querySelector(".op-hullcap").textContent),"выбранный слот назван под корпусом");
    OPIS.sel=null;opisRerender();
    ok(/кнопки под ней/.test(box.querySelector(".op-foot").textContent),"подсказка называет кнопки, а не долгое нажатие");
  }
  const panel=box.querySelector(".op-panel[data-p=ship]").textContent;
  ok(stat().gunTot&&stat().gunTot.hull>0||!/по корпусу в с/.test(panel),"нулевых строк огня у безоружного нет");
  ok(/пк/.test(panel),"прыжок — в пк");
  opisBar();
  ok(/ЛЮК · ЗА БОРТ/.test(document.getElementById("opisBar").textContent),"полоса люка названа словами");
  tableToggle(false);
}));

TEST_SUITES.push(()=>suite("станция: модуль — карточка с одной кнопкой, покупка сразу двигает уровень и кассу",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  ok(T.board("near"),"стоим на станции");
  G.credits=50000;tab="mods";renderTab();
  const cards=[...document.querySelectorAll(".modcard")];
  eq(cards.length,Object.keys(MODS).length,"по карточке на модуль");
  const b=cards[0].querySelector(".macts .act");
  ok(/^УЛУЧШИТЬ ДО УР\. 1 · /.test(b.textContent),"одна кнопка с глаголом и ценой: "+b.textContent);
  ok(/→/.test(cards[0].querySelector(".mf").textContent),"карточка показывает, что станет");
  const k=Object.keys(MODS)[0],cost=modCost(k,0),cr=G.credits;
  b.click();
  eq(G.modsOwned[k],1,"уровень куплен в миг нажатия");
  eq(G.mods[k],1,"и поставлен");
  eq(G.credits,cr-cost,"касса списана один раз");
  G.modsOwned[k]=4;G.mods[k]=4;modWork=null;renderTab();
  eq(document.querySelector(".modcard .macts .act").textContent,"МАКСИМУМ","на четвёртом — МАКСИМУМ");
  modWork=null;T.leave();
}));

TEST_SUITES.push(()=>suite("сплав: карточка обещает ровно то, что выйдет",()=>{
  resetWorld();
  const gen0=G.fuseGen|0;
  G.owned.igla=true;G.owned.vyuk=true;
  G.credits=1e6;G.cargo.alloy=40;G.cargo.volatiles=30;G.cargo.icecrys=30;
  const P=fusePreview("igla","vyuk");
  const id=fuseShips("igla","vyuk");
  ok(!!id,"сплав вышел");
  const S=shipData(id);
  for(const k of ["thr","turn","fuel","cargo","hull"])eq(S[k],P[k],"«"+k+"» совпал с обещанием");
  /* resetWorld поколение сплава не трогает — убираем за собой */
  G.fuseGen=gen0;delete G.uniqueShips[id];delete G.owned[id];
}));

TEST_SUITES.push(()=>suite("после боя: добыча — карточкой, когда бой кончился; НАДЕТЬ ставит",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.pirates=[];
  const p=genPart(12345,2,"engine");addPart(p);gotAdd(p);
  G.pirates=[{aware:true,iff:0,x:0,y:0}];
  gotTick();
  ok(!document.getElementById("gotwin")||!document.getElementById("gotwin").classList.contains("open"),"под погоней карточка не всплывает");
  G.pirates=[];
  gotTick();
  const w=document.getElementById("gotwin");
  ok(!!w&&w.classList.contains("open"),"бой кончился — карточка открыта");
  ok(w.textContent.indexOf(p.name)>=0,"в ней имя части");
  const on=[...w.querySelectorAll(".ga .act")].find(x=>x.textContent==="НАДЕТЬ");
  on.click();
  ok(isFitted(p.id),"НАДЕТЬ поставил часть");
  ok(!w.classList.contains("open"),"очередь пуста — карточка закрылась");
}));

TEST_SUITES.push(()=>suite("экономика: дрон дорожает с парком, люди не зарабатывают за спящую вкладку",()=>{
  resetWorld();
  G.drones=[];G.droneInventory=0;
  eq(dronePrice(),DRONES.miner.price,"первая машина — по базовой цене");
  G.droneInventory=2;
  eq(dronePrice(),Math.round(DRONES.miner.price*Math.pow(1.6,2)/50)*50,"третья — ×1.6²");
  G.droneInventory=0;
  G.crew=[{id:"c1",name:"т",spec:Object.keys(CREW_SPEC)[0],traits:[],order:{kind:"mine",sx:0,sy:0},shipId:G.shipId,
    hull:100,hullMax:100,cargo:{},debt:0,morale:1,xp:0,trips:0,tripMin:0,tMs:now()-8*3600000,earned:0,spent:0,seed:7}];
  peopleOffline();
  ok(now()-G.crew[0].tMs<1000,"разрыв тиков переставил часы человека на «сейчас»");
  const cr=G.credits;crewTick();
  eq(G.credits,cr,"за восемь часов спящей вкладки ни рейсов, ни жалованья");
  G.crew=[];
}));

TEST_SUITES.push(()=>suite("масштаб: корабль не мельче .7, тела растут на приближении, планета не накрывает свою луну",()=>{
  resetWorld();
  eq(shipScaleAt(.16),.7,"пол корабля .7");
  eq(shipScaleAt(2.4),1.6,"потолок 1.6");
  ok(Math.abs(bodyScaleAt(2.4)-2.12)<1e-9,"тела на 2.4 — ×2.12");
  eq(bodyScaleAt(.5),1,"на отдалении тела в масштабе мира");
  let n=0;
  for(let sx=-3;sx<=3;sx++)for(let sy=-3;sy<=3;sy++){
    const s=getSystem(sx,sy);
    for(const p of s.planets)p.moons.forEach((m,i)=>{
      const cap=bodyNearCaps(p),K=bodyScaleAt(2.4);
      const rp=p.radius*Math.min(K,cap[0]),rm=m.radius*Math.min(K,cap[1][i]);
      n++;
      if(rp+rm>=m.orbit)ok(false,"луна "+m.name+" легла на диск: "+rp.toFixed(0)+"+"+rm.toFixed(0)+" ≥ "+m.orbit.toFixed(0));
    });
  }
  ok(n>0,"лун проверено: "+n);
}));
