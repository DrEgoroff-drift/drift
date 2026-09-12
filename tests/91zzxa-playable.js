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

TEST_SUITES.push(()=>suite("R0 оклик под окном бака: пока выбираешь выход, пикет ждёт и не стреляет",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.hailLog={};G.hail=null;G.pirates=[];
  G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+300,G.ship.y,1);p.aware=false;G.pirates=[p];
  T.wait(2);
  ok(!!G.hail,"пикет окликнул");
  G.hail.blk=0;G.fuel=0;
  toggleSos(true);
  ok(document.body.classList.contains("sosopen"),"окно бака открыто");
  const t0=G.hail.t,hull0=G.hull;
  for(let i=0;i<1200;i++){stepWorld(1);G.t+=1;}
  ok(!!G.hail&&!G.hail.warn&&G.hail.t===t0,"двадцать секунд над окном бака — отсчёт стоит: "+(G.hail&&Math.round(G.hail.t))+" из "+Math.round(t0));
  eq(G.hull,hull0,"корпус цел");
  eq(p.iff,1,"пикет не открыл огонь");
  toggleSos(false);G.pirates=[];
}));

/* R2: пустой бак — руль молчит честно: нос стоит, любой ввод зовёт окно выходов,
   пады движения и стик гаснут, над стиком «БАК ПУСТ» (тестировщик 12.09: нос
   крутился без топлива, стик горел как живой) */
TEST_SUITES.push(()=>suite("R2 пустой бак: руль не крутит нос, поворот открывает окно, газ и стик гаснут",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.hail=null;G.pirates=[];G.hailLog={};
  G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;G.marks=[];G.ship.a=0;
  G.fuel=0;G.cargo.ice=0;toggleSos(false);
  T.wait(2);
  const a0=G.ship.a;
  T.press("left",30);
  ok(Math.abs(angDiff(G.ship.a,a0))<1e-6,"нос не повернулся: "+angDiff(G.ship.a,a0).toFixed(3)+" рад");
  ok(document.body.classList.contains("sosopen"),"поворот на пустом баке открыл окно выходов");
  toggleSos(false);T.wait(1);hud();   /* T.wait рисует мир, приборы и пады — hud() */
  const th=document.querySelector(".pads [data-k=thrust]");
  ok(+getComputedStyle(th).opacity<.5,"пад газа погас: "+getComputedStyle(th).opacity);
  /* стик под пальцем: тусклый, и над ним сказано почему */
  HELM.S={x0:80,y0:H-120,x:140,y:H-120,f:1};
  const said=[],f0=ctx.fillText;
  ctx.fillText=function(s,...r){said.push(String(s));return f0.call(this,s,...r);};
  try{helmDrawSticks();}finally{ctx.fillText=f0;HELM.S=null;}
  ok(said.indexOf("БАК ПУСТ")>=0,"над стиком «БАК ПУСТ»: "+said.join(" | "));
  /* топливо есть — всё как было */
  G.fuel=50;T.wait(1);hud();
  ok(+getComputedStyle(th).opacity>.9,"с топливом пад газа горит");
  const a1=G.ship.a;T.press("left",30);
  ok(Math.abs(angDiff(G.ship.a,a1))>.1,"с топливом нос поворачивает");
  ok(!document.body.classList.contains("sosopen"),"и окно не открылось");
}));

/* R3a: окно выходов — логика (review.json тестировщика: 1/10/15 трос, 2/11 СБРОС,
   3/12 причал, 4/5/13 грунт, 8 пробел у причала, 9 голый «Стриж», 16 крушение, 26 фишка) */
function r3Sys(){
  for(let r=1;r<9;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
    const s=getSystem(x,y);if(s.station)return s;
  }
  return null;
}
TEST_SUITES.push(()=>suite("R3 на тросе: окна выходов нет, фишка не заводит автопилот, крушение снимает трос",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.pirates=[];G.hail=null;G.fuel=0;G.cargo.ice=0;G.credits=1e5;
  G.ship.x=4000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;toggleSos(false);
  T.wait(1);   /* кадр до троса: фишки у кромки нарисованы, их зоны живут до следующего кадра */
  ok(SYS_CHIPS.length>0,"у кромки есть фишка");
  const c=SYS_CHIPS[0];
  haulStart();
  const h0=G.haul,cr0=G.credits;
  toggleSos(true);
  ok(!document.body.classList.contains("sosopen"),"на тросе меню ДОМОЙ окна не открывает");
  eq(rescueTake("home"),false,"на тросе ДОМОЙ не берётся");
  eq(G.credits,cr0,"деньги целы");
  ok(G.haul===h0,"трос прежний, прогресс не сброшен");
  tap(c.x+c.w/2,c.y+c.h/2);
  eq(G.ap,null,"тычок по фишке на тросе не заводит автопилот — руль у баржи");
  wreck();
  eq(G.haul,null,"корабль разбит на тросе — трос снят, корабль уже не там");
}));

TEST_SUITES.push(()=>suite("R3 СБРОС берёт только потерянное; на голом «Стриже» его нет",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  const hulls=Object.keys(SHIPS).filter(k=>k!=="strizh"),big=hulls[0],other=hulls[1];
  G.owned[big]=true;G.owned[other]=true;G.shipId=big;
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.fuel=0;G.cargo.ice=0;
  const p1=addPart(genPart(5501,1,slotsOf(big)[0])),p3=addPart(genPart(5503,1,slotsOf(other)[0]));
  G.fit={};G.fit[big]={0:p1.id};G.fit[other]={0:p3.id};invalidateParts();
  ok(rescueTake("reset"),"сброс берётся");
  ok(!partById(p1.id),"часть с потерянного корпуса ушла вместе с ним");
  ok(!!G.fit[other]&&G.fit[other][0]===p3.id&&!!partById(p3.id),"у второго корпуса обвес на месте");
  /* голый «Стриж»: ни модулей, ни частей, ни груза — СБРОС был бесплатной доставкой с полным баком */
  for(const k in G.mods)G.mods[k]=0;G.fit={};for(const k of RES_KEYS)G.cargo[k]=0;invalidateParts();
  G.fuel=0;
  ok(!rescueOffers().some(o=>o.id==="reset"),"на голом «Стриже» СБРОСА нет — терять нечего");
  ok(rescueOffers().some(o=>o.id==="tow"),"буксир на месте");
}));

TEST_SUITES.push(()=>suite("R3 счётчик и грунт: честный причал остужает раз на систему, с грунта на 1–7 прыжок — без хода",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  const S=r3Sys();
  ok(!!S,"нашлась чужая система со станцией");
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;G.haul=null;G.homeJumps=10;G.fuel=50;
  openStation();
  ok(G.homeJumps<10,"причал своим ходом в чужой системе остужает счётчик: "+G.homeJumps);
  const j=G.homeJumps;closeStation();openStation();
  eq(G.homeJumps,j,"второй заход на тот же причал — не остужает");
  closeStation();
  /* грунт: в баке 5, взлёт стоит 8 — окно говорит правду, прыжок считается «без хода» */
  G.mode="surface";G.fuel=5;G.cargo.ice=0;
  const j0=G.homeJumps;homeJumpCount();
  eq(G.homeJumps,j0+HOME_EMPTY,"с грунта на 5 топлива прыжок — без хода, не такси");
  toggleSos(true);
  const hd=document.getElementById("sosHead").textContent;
  ok(!/Топлива ноль/.test(hd)&&/5/.test(hd),"шапка не врёт про ноль: "+hd);
  toggleSos(false);G.mode="system";
}));

TEST_SUITES.push(()=>suite("R3 у причала: пробел стыкует и окна не открывает, стыковка закрывает окно",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  const S=r3Sys();
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;G.fuel=0;G.cargo.ice=0;toggleSos(false);
  dispatchEvent(new KeyboardEvent("keydown",{code:"Space",bubbles:true}));
  ok(!document.body.classList.contains("sosopen"),"пробел на пустом баке окна сам не открывает — ДЕЙСТВИЕ идёт по подсказке");
  dispatchEvent(new KeyboardEvent("keyup",{code:"Space",bubbles:true}));
  toggleSos(true);openStation();
  ok(!document.body.classList.contains("sosopen"),"стыковка закрывает окно выходов — после отстыковки оно не висит устаревшим");
  closeStation();
}));

/* R3b: окно выходов — вид (дизайнер 12.09 и тестировщик: крестик 18 px, взведённый
   СБРОС не возвращался, «в баке будет 40» при полном баке, шапка дублировала HUD) */
TEST_SUITES.push(()=>suite("R3b окно выходов: пад «ВЫХОДЫ», нижняя треть, крестик 44, Escape и тап мимо, подстроки читаются, шапка про станцию и погоню",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  const S=r3Sys();
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;G.ship.x=S.station.orbit+3000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.fuel=0;G.cargo.ice=0;G.cargo.iron=3;G.credits=1e6;G.pirates=[];G.hail=null;G.hailLog={};toggleSos(false);
  T.wait(1);hud();
  eq(document.querySelector("[data-k=act]").textContent.trim(),"ВЫХОДЫ","на пустом баке пад ДЕЙСТВИЕ зовётся «ВЫХОДЫ»");
  ok(!/БУКСИР ИЛИ СБРОС/.test(G.prompt),"подсказка не пересказывает окно: "+G.prompt.replace(/\n/g," / "));
  const cb=document.getElementById("callbtn");
  ok(cb.textContent.indexOf(rescueHomeCost().toLocaleString("ru"))>=0,"в меню ДОМОЙ со своей ценой: "+cb.textContent);
  toggleSos(true);
  const sos=document.getElementById("sos"),r=sos.getBoundingClientRect();
  ok(r.top>=innerHeight/3,"окно в нижней части экрана, над падами: верх "+Math.round(r.top)+" из "+innerHeight);
  const x=document.getElementById("sosclose").getBoundingClientRect();
  ok(x.width>=44&&x.height>=44,"крестик под палец: "+Math.round(x.width)+"×"+Math.round(x.height));
  const hd=()=>document.getElementById("sosHead").textContent;
  ok(/до станции .+ · \d/.test(hd()),"шапка — куда тащат и сколько: "+hd());
  const lum=c=>{const m=c.match(/[\d.]+/g).map(Number),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]);};
  for(const s of sos.querySelectorAll("#sosList button s,#sosHead")){
    const cs=getComputedStyle(s),cr=(lum(cs.color)+.05)/(.02+.05);
    ok(parseFloat(cs.fontSize)>=11&&cr>=4.5,"подстрока читается: "+cs.fontSize+", контраст "+cr.toFixed(1)+" · «"+s.textContent.slice(0,24)+"»");
  }
  ok([...sos.querySelectorAll("#sosList button")].every(b=>!!b.querySelector(".ic")),"у каждого выхода свой значок");
  const home=sos.querySelector('#sosList button[data-id="home"]');
  const want=Math.min(stat().fuelMax,Math.max(G.fuel,RESCUE_FUEL));
  ok(home.textContent.indexOf("в баке будет "+want)>=0,"ДОМОЙ обещает ровно то, что будет в баке ("+want+"): "+home.textContent);
  const rs=()=>sos.querySelector('#sosList button[data-id="reset"]');
  rs().click();
  ok(rs().classList.contains("armed")&&!!rs().querySelector(".arm"),"взведённый СБРОС красный и с полосой срока");
  rs().querySelector(".arm").dispatchEvent(new Event("animationend",{bubbles:true}));
  ok(!rs().classList.contains("armed")&&/^СБРОС/.test(rs().querySelector("em").textContent),"срок вышел — кнопка вернулась: "+rs().querySelector("em").textContent);
  dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape"}));
  ok(!document.body.classList.contains("sosopen"),"Escape закрывает окно");
  G.t+=200;toggleSos(true);
  T.tap(W/2,80);
  ok(!document.body.classList.contains("sosopen"),"тап мимо окна закрывает его");
  G.t+=200;
  const by=MAKER_KEYS.find(k=>k!==playerFlag());
  const p=npcShip(by,0,1,G.ship.x+300,G.ship.y,1);p.iff=0;p.aware=true;G.pirates=[p];
  toggleSos(true);
  ok(/ПОГОНЯ/.test(hd()),"погоня — в шапке окна: "+hd());
  toggleSos(false);G.pirates=[];
  /* окно живое: состояние сменилось, пока оно открыто, — оно перерисовалось само
     (Контроль 12.09: окно рисовалось только при открытии) */
  G.t+=200;G.credits=0;toggleSos(true);
  const hb=()=>sos.querySelector('#sosList button[data-id="home"]');
  ok(hb().disabled,"без денег ДОМОЙ серый");
  G.credits=1e6;T.wait(1);hud();
  ok(!hb().disabled,"пришли деньги — ДОМОЙ ожил, не закрывая окна");
  G.pirates=[p];p.hull=10;T.wait(1);hud();
  ok(/ПОГОНЯ/.test(hd()),"погоня появилась при открытом окне — шапка сказала: "+hd());
  toggleSos(false);G.pirates=[];
}));

/* R3c: голос экрана не ждёт за экраном (критик тестировщика 1 и 2): стыковка — ответ
   на нажатие, и что станция говорит при входе, видно сразу; «СБОЙ» — единственный
   сигнал сторожа кадра, он виден поверх любого экрана */
TEST_SUITES.push(()=>suite("R3c голос экрана: реплика при стыковке и «СБОЙ» видны поверх открытого экрана",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  const S=r3Sys();G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;
  const kd=window.keepersDock;
  window.keepersDock=()=>({line:"чайник горячий, садитесь"});
  FRAME_IN=true;   /* стыковка случилась внутри кадра — по ДЕЙСТВИЮ или автопилотом */
  try{openStation();}finally{window.keepersDock=kd;}
  FRAME_IN=false;hud();
  ok(/чайник горячий/.test(String(G.msg)),"смотритель сказал: "+String(G.msg).replace(/\n/g," "));
  ok(!msgHeld(),"реплика при стыковке не ждёт за экраном станции — она видна сразу");
  closeStation();
  tableToggle(true);hud();
  FRAME_IN=true;crashSay(new Error("проба сторожа"),"тест");FRAME_IN=false;hud();
  ok(/СБОЙ/.test(String(G.msg))&&!msgHeld(),"«СБОЙ» виден поверх стола: "+String(G.msg).split("\n")[0]);
  tableToggle(false);
}));

/* R4: сцена буксира (тестировщик 17–21, дизайнер): рисунок не двигает мир, баржа
   заходит сзади и обгоняет, в конце отцепка, камера без рывков, экипаж без повторов */
function r4Haul(){
  resetWorld();
  const S=r3Sys();
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;G.pirates=[];G.hail=null;
  G.ship.x=S.station.orbit+4000;G.ship.y=900;G.ship.vx=0;G.ship.vy=0;G.ship.a=2;G.fuel=0;G.cargo.ice=0;
  return S;
}
TEST_SUITES.push(()=>suite("R4 буксир: рисунок не двигает мир — с кадрами и без один исход",{tier:"browser"},()=>{
  const run=extra=>{
    r4Haul();haulStart();G.haul.seed=777;
    const n0=G.log.length;
    for(let i=0;i<HAUL_COME+90*60;i++){haulTick(1,G.ship);for(let j=0;j<extra;j++)rndFx();}
    return [G.ship.a.toFixed(6),G.haul.bx.toFixed(3),G.haul.by.toFixed(3),JSON.stringify(G.log.slice(n0))];
  };
  const a=run(0),b=run(7);
  eq(a[0],b[0],"угол корабля на тросе не зависит от того, рисовали ли кадры");
  eq(a[1]+","+a[2],b[1]+","+b[2],"баржа там же");
  eq(a[3],b[3],"журнал тот же — реплики и их порядок от зерна буксира, не от рисунка");
}));

TEST_SUITES.push(()=>suite("R4 буксир: баржа заходит сзади и обгоняет, сквозь корабль не летит, пустой корабль носом не крутит, зум без рывка",{tier:"browser"},()=>{
  r4Haul();G.zoom=.3;
  haulStart();
  const T=G.haul,reach=haulReach(),a0=G.ship.a;
  haulTick(1,G.ship);
  ok(G.zoom<.5,"зум не прыгает к полу за кадр: "+G.zoom.toFixed(2));
  let dmin=1e9,back=0,turn=0;
  for(let i=1;i<HAUL_COME;i++){
    const px=T.bx,py=T.by;
    haulTick(1,G.ship);
    if(!G.haul||G.haul.ph!=="come")break;
    dmin=Math.min(dmin,Math.hypot(T.bx-G.ship.x,T.by-G.ship.y));
    turn=Math.max(turn,Math.abs(angDiff(G.ship.a,a0)));
    if(Math.hypot(T.bx-px,T.by-py)>.5&&Math.abs(angDiff(Math.atan2(T.by-py,T.bx-px),T.ba))>Math.PI/2)back++;
  }
  ok(G.zoom>.68,"за подход зум дошёл до пола: "+G.zoom.toFixed(2));
  ok(dmin>=reach*.6,"ближе "+Math.round(dmin)+" баржа к кораблю не подходит (трос "+Math.round(reach)+")");
  eq(back,0,"баржа ни кадра не шла кормой вперёд — факелы за ней, а не по ходу");
  ok(turn<1e-6,"пока баржа подходит, корабль без топлива носом не крутит: "+turn.toFixed(3));
}));

TEST_SUITES.push(()=>suite("R4 буксир: в конце отцепка — баржа уходит с огнём за 3–5 с, а не пропадает в кадр",{tier:"browser"},()=>{
  r4Haul();haulStart();
  const T=G.haul;T.ph="haul";T.t=HAUL_TIME-1;T.x0=G.ship.x;T.y0=G.ship.y;T.ba=0;
  haulTick(1,G.ship);
  ok(!!G.haul&&G.haul.ph==="free","дотащил — баржа ещё здесь и отцепляется");
  ok(G.fuel>=Math.min(stat().fuelMax,RESCUE_FUEL),"бак уже выдан: "+G.fuel);
  const d0=Math.hypot(G.haul.bx-G.ship.x,G.haul.by-G.ship.y);let n=0,d=d0;
  while(G.haul&&n<600){d=Math.hypot(G.haul.bx-G.ship.x,G.haul.by-G.ship.y);haulTick(1,G.ship);n++;}
  ok(n>=180&&n<=300,"отцепка длится 3–5 с: "+(n/60).toFixed(1)+" с");
  ok(d>d0*1.5,"баржа уходила: "+Math.round(d0)+" → "+Math.round(d));
  eq(G.haul,null,"потом её нет");
}));

TEST_SUITES.push(()=>suite("R4 буксир: экипаж за рейс не повторяется",{tier:"browser"},()=>{
  r4Haul();haulStart();
  const said=[],el=window.etherLine;
  window.etherLine=t=>{said.push(String(t));};
  try{let n=0;while(G.haul&&n<(HAUL_COME+HAUL_TIME)/10+200){haulTick(10,G.ship);n++;}}finally{window.etherLine=el;}
  const talk=said.filter(t=>!/до причала|трос взяли|приехали|вижу вас/.test(t));
  ok(talk.length>=5,"экипаж говорит: "+talk.length+" реплик");
  eq(talk.length,new Set(talk).size,"ни одной реплики дважды: "+talk.join(" | "));
  const cd=said.filter(t=>/до причала/.test(t));
  eq(cd.length,new Set(cd).size,"отсчёт минут не повторяет одно число: "+cd.join(" | "));
}));

TEST_SUITES.push(()=>suite("R4 буксир в чужую систему: конец — у станции, а не в двух тысячах от неё",{tier:"browser"},()=>{
  resetWorld();
  let far=null;for(let r=1;r<9&&!far;r++)for(let x=-r;x<=r&&!far;x++)for(let y=-r;y<=r&&!far;y++){const s=getSystem(x,y);if(!s.station)far=s;}
  G.mode="system";G.sx=far.sx;G.sy=far.sy;G.sys=far;G.pirates=[];G.hail=null;G.fuel=0;G.cargo.ice=0;
  G.ship.x=3000;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  haulStart();
  const T=G.haul;T.ph="haul";T.t=HAUL_TIME-1;T.x0=G.ship.x;T.y0=G.ship.y;
  haulTick(1,G.ship);
  const S=G.sys.station;
  ok(!!S,"дотащил в систему со станцией");
  const d=Math.hypot(G.ship.x-Math.cos(S.ang)*S.orbit,G.ship.y-Math.sin(S.ang)*S.orbit);
  ok(d<300,"корабль у станции: "+Math.round(d)+" ед.");
}));

/* R5a: находки ботов (botverify.json): зонд одним тапом, знак молча, корона молча */
TEST_SUITES.push(()=>suite("R5 зонд: цена на паде, покупка только вторым тапом",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.flownMs=FIRST_HOUR_MS;   /* за первым часом: первый зонд там даром (R5b, 0.448.0) */
  let S=null,p=null;
  for(let r=1;r<8&&!S;r++)for(let x=-r;x<=r&&!S;x++)for(let y=-r;y<=r&&!S;y++){
    const s=getSystem(x,y),q=s.planets.find(q=>q.type!=="gas"&&!probeHas(x,y,q.idx));if(q){S=s;p=q;}
  }
  G.mode="system";G.sx=S.sx;G.sy=S.sy;G.sys=S;G.pirates=[];G.hail=null;G.hailLog={};G.credits=5000;G.fuel=50;
  T.wait(1,{draw:false});
  const u=Math.hypot(p.x,p.y)||1;
  G.ship.x=p.x+p.x/u*(p.radius+50);G.ship.y=p.y+p.y/u*(p.radius+50);G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  T.wait(1,{draw:false});hud();
  const lk=()=>document.getElementById("lockbtn").textContent.trim();
  eq(lk(),"ЗОНД "+PROBE_COST+" КР","пад ЦЕЛЬ называет цену");
  const c0=G.credits;
  HELM.lockEdge=true;helmTick(1);
  eq(G.credits,c0,"первый тап не покупает — 300 кр одним касанием не уходят");
  T.wait(1,{draw:false});hud();
  ok(/ТОЧНО/.test(lk()),"пад переспрашивает: "+lk());
  HELM.lockEdge=true;helmTick(1);
  eq(G.credits,c0-PROBE_COST,"второй тап купил");
  ok(probeHas(S.sx,S.sy,p.idx),"формуляр открыт");
}));

TEST_SUITES.push(()=>suite("R5 знак на грунте: у корабля ДЕЙСТВИЕ не тратит груз на знак, пока подсказка зовёт другое",{tier:"browser",win:"phone"},()=>{
  T.go("грунт день");
  const S=G.surf,sv={c:window.traceCanLeave,l:window.traceLeave,h:window.traceHere};
  let left=0;
  window.traceCanLeave=()=>({k:"iron",n:5});window.traceLeave=()=>{left++;};window.traceHere=()=>false;
  try{
    S.x=S.shipX;G.cargo.iron=10;
    T.wait(1,{draw:false});
    const said=G.prompt;
    T.press("act",1);
    ok(!(left&&!/ЗНАК/.test(said)),"нажатие ДЕЙСТВИЯ не оставило знак, пока подсказка звала «"+said.split("\n").pop()+"»");
  }finally{window.traceCanLeave=sv.c;window.traceLeave=sv.l;window.traceHere=sv.h;}
}));

TEST_SUITES.push(()=>suite("R5 окно бака закрывается само, когда бак уже не пуст (крушение дало 30)",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  G.mode="system";G.sx=5;G.sy=5;G.sys=getSystem(5,5);G.fuel=0;G.cargo.ice=0;G.cargo.iron=3;G.pirates=[];G.hail=null;
  G.t+=500;toggleSos(true);
  ok(document.body.classList.contains("sosopen"),"пустой бак — окно выходов открыто");
  G.hull=0;wreck("проба");hud();
  ok(!document.body.classList.contains("sosopen"),"после крушения с топливом в баке окно «БАК ПУСТ» не висит");
  G.fuel=0;G.t+=500;toggleSos(true);G.fuel=30;hud();
  ok(!document.body.classList.contains("sosopen"),"бак перестал быть пустым — окно закрылось само");
  /* станция в чужой системе: шапка в прыжках и времени, не координатами */
  let far=null;for(let r=0;r<9&&!far;r++)for(let x=-r;x<=r&&!far;x++)for(let y=-r;y<=r&&!far;y++){const s=getSystem(x,y);if(!s.station)far=s;}
  G.sx=far.sx;G.sy=far.sy;G.sys=far;G.fuel=0;G.t+=500;toggleSos(true);
  const hd=document.getElementById("sosHead").textContent;
  ok(/прыж/.test(hd)&&!/сектор \d/.test(hd),"до чужой станции — прыжками: "+hd);
  toggleSos(false);
}));

TEST_SUITES.push(()=>suite("R5 прыжок и корона: после прыжка корабль не несёт в звезду, крушение называет причину",{tier:"browser"},()=>{
  resetWorld();
  G.mode="system";G.fuel=200;G.credits=1e5;
  const n0=Math.hypot(G.sx,G.sy);
  jump(0);
  eq(Math.hypot(G.ship.vx,G.ship.vy),0,"после прыжка корабль стоит — брошенный, он не влетит в корону сам");
  const sys=G.sys;G.ship.x=sys.radius+10;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.hull=.5;G.ap=null;
  const L0=G.log.length;
  updateSystem(1);
  const lines=G.log.slice(L0).map(l=>l.s||"").join(" | ");
  ok(/звезд|корон/i.test(lines),"журнал называет причину: "+lines);
}));

/* R6: хвосты дизайна и ботов (P2–P5, решения дизайнера 31–35) */
TEST_SUITES.push(()=>suite("R6 эфир: говорящий назван один раз, в префиксе, одним регистром",()=>{
  resetWorld();
  const L0=G.log.length;
  etherLine("…Коммуна: борт молчит. Предупредительный.","Коммуна");
  etherLine("…борт не отвечает. Повторяю запрос.","КОММУНА");
  const a=G.log.slice(L0).map(l=>l.s);
  eq(a[0],"Коммуна: …борт молчит. Предупредительный.","говорящий в префиксе один раз, не «Коммуна: …Коммуна:»");
  eq(a[1],"Коммуна: …борт не отвечает. Повторяю запрос.","регистр один: не «КОММУНА:»");
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
  /* всё стоит — одна строка (R6, 0.448.0): «максимум» в подписи, кнопка одна — снять уровень */
  ok(/максимум/.test(document.querySelector(".modcard.maxed .mh s").textContent),"на четвёртом — «максимум» в подписи");
  eq(document.querySelectorAll(".modcard.maxed .macts .act").length,1,"и одна кнопка — СНЯТЬ УР.");
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

TEST_SUITES.push(()=>suite("масштаб: корабль не мельче .7 и не крупнее .8, мир зумится до ×4.5, диск — физический",()=>{
  resetWorld();
  eq(shipScaleAt(.16),.7,"пол корабля .7");
  eq(shipScaleAt(4.5),.8,"потолок корабля .8: растёт мир, а не корабль (решено автором 12.09)");
  eq(ZOOM_MAX,4.5,"мировой зум до ×4.5");
  setZoom(99);eq(G.zoom,ZOOM_MAX,"setZoom упирается в потолок");
  setZoom(.01);eq(G.zoom,ZOOM_MIN,"и в пол");setZoom(1);
  eq(fleetScale(4.5),fleetScale(SHIP_SCALE_MAX),"флот растёт до потолка корабля и не дальше");
  ok(fleetScale(.8)>fleetScale(.5)*1.4,"а до потолка растёт вместе с миром");
  /* сейв с зумом старого потолка грузится в новые пределы */
  const sv=snapshot();sv.zoom=9;applySave(sv);eq(G.zoom,ZOOM_MAX,"зум из сейва — в пределах");
}));
