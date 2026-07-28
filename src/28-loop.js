/* ══════════════ авария ══════════════ */
function wreck(){
  sfx("boom",{v:1});stopEngine();
  const st=stat();
  G.hull=Math.round(st.hullMax*.45);G.fuel=Math.max(G.fuel,30);
  const a=Math.random()*TAU;
  G.ship.x=Math.cos(a)*1600;G.ship.y=Math.sin(a)*1600;
  G.ship.vx=0;G.ship.vy=0;G.mode="system";G.ap=null;G.belt=null;G.dig=null;G.cave=null;G.surf=null;G.land=null;
  G.pirates=[];G.shots=[];   /* без этого авария у пиратов превращается в петлю */
  let lost=0;for(const k of RES_KEYS){lost+=G.cargo[k];G.cargo[k]=0;}
  saveGame(true);
  logAdd("warn","Корабль разбит · аварийный ремонт"+(lost?" · груз потерян ("+lost+" ед)":""));
  say("Аварийный ремонт\n"+(lost?"груз потерян ("+lost+")":"трюм был пуст"));
}

/* ══════════════ телеметрия ══════════════ */
const $f=document.querySelector("#fbar i"),$h=document.querySelector("#hbar i"),$cg=document.querySelector("#cbar i");
const $fb=document.getElementById("fbar"),$hb=document.getElementById("hbar");
const $sh=document.querySelector("#sbar i"),$sg=document.getElementById("sgauge");
const $place=document.getElementById("place"),$sub=document.getElementById("sub");
const $msg=document.getElementById("msg"),$prompt=document.getElementById("prompt");
const $bThr=document.querySelector("[data-k=thrust]"),$bBrk=document.querySelector("[data-k=brake]");
const $nav=document.getElementById("navbtn"),$fire=document.getElementById("firebtn");
function hud(){
  const st=stat();
  $f.style.width=clamp(G.fuel/st.fuelMax*100,0,100).toFixed(1)+"%";
  $h.style.width=clamp(G.hull/st.hullMax*100,0,100).toFixed(1)+"%";
  $cg.style.width=clamp(held()/st.cargoMax*100,0,100).toFixed(1)+"%";
  $sg.style.display=st.shieldMax>0?"":"none";
  if(st.shieldMax>0)$sh.style.width=clamp(G.shield/st.shieldMax*100,0,100).toFixed(1)+"%";
  $fb.classList.toggle("low",G.fuel/st.fuelMax<.2);
  $hb.classList.toggle("low",G.hull/st.hullMax<.3);
  let a="—",b="—";
  if(G.mode==="system"){a=G.sys.name.toUpperCase();
    b="«"+st.S.ru+"» · "+G.credits.toLocaleString("ru")+" кр · "+G.data+" дан";}
  else if(G.mode==="map"){a="НАВИГАЦИЯ";b="радиус "+st.jump.toFixed(1)+" пк";}
  else if(G.mode==="landing"){a=G.land.p.name.toUpperCase();
    b=(G.land.auto?"авто-посадка":"ручная посадка")+" · "+G.land.p.T.ru;}
  else if(G.mode==="surface"){a=G.surf.p.name.toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax+" · скафандр "+Math.round(G.surf.suit)+"%";}
  else if(G.mode==="dig"){a="ШАХТА · "+(G.dig?G.dig.p.name.toUpperCase():"");
    b=(G.dig?G.dig.row*3:0)+" м · трюм "+held()+"/"+st.cargoMax;}
  else if(G.mode==="cave"){a="ПЕЩЕРА · "+G.surf.p.name.toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax+" · скафандр "+Math.round(G.surf.suit)+"%";}
  else if(G.mode==="belt"){a=(G.belt?G.belt.B.name:"ПОЯС").toUpperCase();
    b="трюм "+held()+"/"+st.cargoMax;}
  else if(G.mode==="scoop"){a=(G.scoop?G.scoop.p.name:"АТМОСФЕРА").toUpperCase();
    b="сбор летучих газов";}
  else if(G.mode==="base"){a="БАЗА · "+(G.base?G.base.p.name.toUpperCase():"");
    b="разрез грунта";}
  else if(G.mode==="raid"){a=(G.raid?G.raid.PB.name:"АБОРДАЖ").toUpperCase();
    b="пиратская база · "+(G.raid?G.raid.foes.filter(f=>f.hp>0).length+" живых":"");}
  else if(G.mode==="dock"){a=G.st.name.toUpperCase();b=G.st.kind;}
  if(G.drones.length>0)b+=" · дронов работает: "+G.drones.length;
  const sbtn=document.getElementById("starbtn");
  sbtn.style.display=(G.mode==="system"&&Math.hypot(G.ship.x,G.ship.y)>1400)?"":"none";
  $place.textContent=a;$sub.textContent=b;
  $msg.textContent=G.msgT>0?G.msg:"";
  $msg.style.opacity=G.msgT>0?clamp(G.msgT/40,0,1):0;
  $prompt.textContent=G.mode==="dock"?"":G.prompt;
  $bThr.textContent=G.mode==="surface"?"ПРЫЖ":(G.mode==="dig"?"ВВЕРХ":"▲");
  if(G.mode==="belt")document.querySelector("[data-k=act]").textContent="РЕЗАК";
  /* в шахте копают в четыре стороны: большая кнопка — «вниз», как и клавиша S */
  else if(G.mode==="dig")document.querySelector("[data-k=act]").textContent="ВНИЗ";
  else document.querySelector("[data-k=act]").textContent="ДЕЙСТВ";
  if(G.mode==="dig"){
    /* «вниз» уже висит на большой кнопке — второй такой же рядом только путает.
       Клавиша S при этом продолжает работать, раскладка WASD не рвётся. */
    $bBrk.style.display="none";
  }else{
    $bBrk.style.display="";
    $bBrk.textContent="ТОРМ";
    $bBrk.style.opacity=G.mode==="surface"?".3":"1";
  }
  $nav.textContent=(G.mode==="belt"||G.mode==="scoop")?"ВЫХОД":(G.mode==="map"?"НАЗАД":"КАРТА");
  /* под землёй ОГОНЬ — это импульсный разрядник, он есть всегда */
  $fire.style.display=(G.mode==="dig"||((G.mode==="system"||G.mode==="belt")&&st.armed))?"":"none";
  if(G.mode==="dig")$fire.textContent=(G.dig&&G.dig.zap>0)?Math.ceil(G.dig.zap/60)+"с":"ИМПУЛЬС";
  else $fire.textContent="ОГОНЬ";
  document.body.classList.toggle("inbelt",G.mode==="belt");
}

/* ══════════════ звук по кадрам ══════════════ */
/* Гул двигателя и шаги — единственное, что зависит от каждого кадра.
   Всё остальное дёргается событиями из игровой логики. */
let sndWalk=0, lastFuelWarn=0, lastHullWarn=0;
function audioTick(dt){
  if(!audioOn()||!SND.ready){return;}
  const st=stat();
  /* напряжение одним числом: бой, пробитый корпус, глубина шахты.
     Оно управляет плотностью музыки — отдельного «боевого трека» не нужно. */
  let ten=0;
  if(G.mode==="system"||G.mode==="dock"){
    const aware=G.pirates.filter(p=>p.aware).length;
    ten=Math.min(1,aware*.45);
  }else if(G.mode==="belt")ten=.2;
  else if(G.mode==="dig"&&G.dig)ten=Math.min(.7,G.dig.row/45);
  else if(G.mode==="cave")ten=.35;
  if(G.hull/st.hullMax<.35)ten=Math.max(ten,.5);
  MUS.iTarget=ten;
  MUS.intensity+=(MUS.iTarget-MUS.intensity)*Math.min(1,.012*dt);
  const sc=musicSceneNow();
  musicSetScene(sc[0],sc[1]);
  /* уровни слоёв подтягиваются к напряжению постоянно, а не только при смене сцены */
  if(MUS.ready&&MUS.sc){
    const t=SND.ctx.currentTime;
    MUS.layers.perc.gain.setTargetAtTime(layerLevel("perc",MUS.sc),t,.6);
    MUS.layers.motif.gain.setTargetAtTime(layerLevel("motif",MUS.sc),t,.6);
  }
  /* двигатель звучит только когда реально работает: постоянный холостой гул
     превращался в бесконечное гудение и глушил всю остальную звуковую картину */
  if(G.mode==="system"||G.mode==="dock"){
    const on=(keys.thrust||G.ap)&&G.fuel>0&&G.mode!=="dock";
    if(on)engineLoop(1,G.mods.engine/4);else stopEngine();
  }else if(G.mode==="belt"&&G.belt){
    if(keys.thrust)engineLoop(.9,G.mods.engine/4);else stopEngine();
  }else if(G.mode==="landing"&&G.land){
    if(keys.thrust)engineLoop(1,.5);else stopEngine();
  }else stopEngine();
  /* шаги: в такт уже существующей фазе ходьбы, а не по своему таймеру */
  let ph=null,ground=420;
  if(G.mode==="surface"&&G.surf&&G.surf.on){ph=G.surf.walkPhase;ground=520;}
  else if(G.mode==="cave"&&G.cave){ph=G.cave.walkPhase;ground=300;}
  else if(G.mode==="dig"&&G.dig){ph=G.dig.walkPhase;ground=260;}
  if(ph!=null){
    const s=Math.floor(ph/Math.PI);
    if(s!==sndWalk){sndWalk=s;sfx("step",{f:ground});}
  }
  /* предупреждения: не чаще раза в несколько секунд, иначе это пытка */
  const nowT=G.t;
  if(G.fuel/st.fuelMax<.12&&nowT-lastFuelWarn>420&&G.mode!=="dock"){
    lastFuelWarn=nowT;sfx("alarm",{f:330});
  }
  if(G.hull/st.hullMax<.25&&nowT-lastHullWarn>420){
    lastHullWarn=nowT;sfx("alarm",{f:220});
  }
}

/* ══════════════ цикл ══════════════ */
let last=performance.now();
let lastDroneTick=0;
function frame(now){
  const dt=clamp((now-last)/16.667,0,3);last=now;
  actEdge=keys.act&&!prevAct;prevAct=keys.act;
  if(G.running){
    G.t+=dt;
    if(now-lastDroneTick>3000){lastDroneTick=now;tickDrones();crewTick();mgrTick();}
    if(G.msgT>0)G.msgT-=dt;
    if(G.mode==="system")autosave();
    if(G.mode==="system"||G.mode==="dock")updateSystem(dt);
    else if(G.mode==="landing")updateLanding(dt);
    else if(G.mode==="surface"){updateSurface(dt);tickLaunchHold(dt);}
    else if(G.mode==="dig"&&G.dig)updateDig(dt);
    else if(G.mode==="cave"&&G.cave)updateCave(dt);
    else if(G.mode==="belt"&&G.belt)updateBelt(dt);
    else if(G.mode==="scoop"&&G.scoop)updateScoop(dt);
    else if(G.mode==="base"&&G.base)updateBase(dt);
    else if(G.mode==="raid"&&G.raid)updateRaid(dt);
    beaconTick(dt);crewBtnTick();hqBtnTick();
    /* страховка от «зависания на стыковке»: режим dock без единой открытой панели
       означал бы, что игрок смотрит на космос и не может двигаться */
    if(G.mode==="dock"&&!document.querySelector(".scr.open")){
      if(G.st)openStation();else G.mode="system";
    }
    audioTick(dt);
    if(G.mode==="system"||G.mode==="dock")drawSystem();
    else if(G.mode==="map")drawMap();
    else if(G.mode==="landing")drawLanding();
    else if(G.mode==="surface")drawSurface();
    else if(G.mode==="dig"&&G.dig)drawDig();
    else if(G.mode==="cave"&&G.cave)drawCave();
    else if(G.mode==="belt"&&G.belt)drawBelt();
    else if(G.mode==="scoop"&&G.scoop)drawScoop();
    else if(G.mode==="base"&&G.base)drawBase();
    else if(G.mode==="raid"&&G.raid)drawRaid();
    hud();
  }else{
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
    G.t=now*.06;drawNebula(now*.004,0,1);drawStars(now*.004,0,1);
  }
  requestAnimationFrame(frame);
}
applyPadMode();applyPadSize();
requestAnimationFrame(frame);