/* ══════════════ плейтест автора 11.09: «игрок делает X → видит Y» ══════════════
   Пункты 2–6 плана «PLAYABLE ON A PHONE»: подсказка одна на кадр, ДЕЛО сходится,
   лист стола называет себя, ОПИСЬ на телефоне, карточка улучшения и сплава,
   карточка после боя, цена дрона от парка, люди только онлайн, масштаб тел. */

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
  T.leave();
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
