/* ══ база и дом телами (M628a, 21pig) ══
   Вход в базу — у ворот, а не у корабля: у корабля строка ведёт к воротам и ДЕЙСТВИЕ базу не открывает;
   закладка базы у корабля входит сразу, как прежде; под настилом и во дворе шахту не закладывают;
   место базы не ложится на площадку и на двор; со старым видом (OWN.on=false) — прежний вход у корабля. */
function owWorld(){
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  startLanding(p);
  const L=G.land;L.x=L.tr.padX;L.y=groundAt(L.tr,L.x)-LAND_GY;   /* сел на площадку */
  enterSurface();G.mode="surface";
  const S=G.surf;
  return {p,S,tr:S.tr};
}
/* человек стоит в x и жмёт (или не жмёт) ДЕЙСТВИЕ один кадр; вокруг пусто, чтобы строку не перебили
   растение, зверь или залежь */
function owAt(S,x,act){
  S.plants=[];S.fauna=[];S.deposits=[];S.cave=null;
  S.x=x;S.y=groundAt(S.tr,x)-10;S.on=true;S.jetOn=false;S.vx=0;S.vy=0;S.suit=suitMax();
  G.prompt=null;
  try{actEdge=!!act;updateSurface(1);}finally{actEdge=false;}
  return String(G.prompt||"");
}
function owFound(p){G.credits=1e6;G.cargo.alloy=100;return foundBase(p);}

TEST_SUITES.push(()=>suite("база и дом телами: вход у ворот, закладка у корабля, без шахты под настилом (M628a)",()=>{
  const on=OWN.on;
  try{
    OWN.on=true;
    /* закладка у корабля входит сразу: строка у неё своя, ворот ещё нет */
    let w=owWorld();
    ok(!baseAt(G.sx,G.sy,w.p.idx),"базы ещё нет");
    const pr0=owAt(w.S,w.S.shipX,false);
    ok(/ЗАЛОЖИТЬ БАЗУ/.test(pr0),"у корабля — закладка базы: "+JSON.stringify(pr0));
    G.credits=1e6;G.cargo.alloy=100;
    owAt(w.S,w.S.shipX,true);
    eq(G.mode,"base","заложили у корабля — сразу внутри");

    /* база есть: у корабля строка ведёт к воротам, ДЕЙСТВИЕ базу не открывает */
    w=owWorld();
    ok(owFound(w.p),"база заложена");
    const g=plnOwnGateX(w.S),bx=plnOwnBaseX(w.tr,w.p);
    ok(isFinite(g),"у базы есть ворота: "+g);
    const pad=w.tr.padX/PLN_M;
    ok(Math.abs(bx-pad)>=OWN.deckHX+13-1e-6,"настил не на площадке: "+(bx-pad).toFixed(1)+" м от неё");
    ok(bx-OWN.deckHX>0&&(bx+OWN.deckHX)*PLN_M<(w.tr.W||w.tr.N*w.tr.step),"настил весь на профиле");
    ok(Math.abs(g-w.S.shipX)>=PLN_OWN_GATE_R,"ворота не у корабля — до них идти");
    const pr1=owAt(w.S,w.S.shipX,true);
    eq(G.mode,"surface","ДЕЙСТВИЕ у корабля в базу не ведёт");
    ok(!/СПУСТИТЬСЯ В БАЗУ/.test(pr1),"строки «спуститься в базу» у корабля нет: "+JSON.stringify(pr1));
    ok(/ВОРОТА \d+ М [▶◀]/.test(pr1),"строка у корабля ведёт к воротам: "+JSON.stringify(pr1));
    ok((g>w.S.x)===/▶/.test(pr1),"стрелка смотрит к воротам");
    eq(surfaceHint()===null||!/ЗДЕСЬ ВАША БАЗА/.test(surfaceHint()),true,"подсказки «здесь ваша база» у корабля нет");

    /* под настилом, вдали от ворот: шахту не закладывают, строка ведёт к воротам */
    const ux=(bx-Math.sign(g/PLN_M-bx)*(OWN.deckHX-3))*PLN_M;
    const mines0=JSON.stringify(G.mines||{});
    const pr2=owAt(w.S,ux,true);
    eq(G.mode,"surface","под настилом ДЕЙСТВИЕ шахту не закладывает");
    eq(JSON.stringify(G.mines||{}),mines0,"ствола под базой не появилось");
    ok(/ВОРОТА/.test(pr2),"под настилом строка ведёт к воротам: "+JSON.stringify(pr2));

    /* у ворот: строка входа, ДЕЙСТВИЕ — внутрь */
    const pr3=owAt(w.S,g,false);
    eq(pr3,"ДЕЙСТВИЕ — ВОЙТИ В БАЗУ","у ворот — вход");
    ok(plnAtThing(w.S,w.p)===1,"у ворот объектив скользит ближе");
    owAt(w.S,g,true);
    eq(G.mode,"base","ДЕЙСТВИЕ у ворот — в базе");
    eq(G.base&&G.base.B,baseAt(G.sx,G.sy,w.p.idx),"в той самой базе");

    /* прыжок к базе со станции и прочие входы вне хода по грунту не трогаются */
    w=owWorld();owFound(w.p);
    enterBase(w.p);
    eq(G.mode,"base","enterBase вне кадра поверхности входит как прежде");

    /* дом: у двери — вход домой, строка шахты её не перебивает; настил и двор расчищены от трав */
    w=owWorld();owFound(w.p);
    G.home={sx:G.sx,sy:G.sy,tier:2};
    ok(homeHereP(w.p),"дом на этой планете");
    const hx=homeSpotX(w.p,w.tr),dx=homeDoorX(w.tr,w.p);
    ok(Math.abs(plnOwnBaseX(w.tr,w.p)-hx/PLN_M)>OWN.deckHX+12,"настил не на дворе дома");
    const pr4=owAt(w.S,dx,false);
    eq(pr4,"ДЕЙСТВИЕ — ВОЙТИ ДОМОЙ","у двери дома — вход домой");
    const pads=plnOwnPads(w.tr,w.p);
    eq(pads.length,2,"трава расступается под настилом и во дворе");
    ok(pads.every(q=>q.length===5&&q.every(isFinite)),"площадки — [x, z, rx, rz, рост]");

    /* старый вид: вход у корабля, как было */
    OWN.on=false;
    w=owWorld();owFound(w.p);
    const pr5=owAt(w.S,w.S.shipX,false);
    eq(pr5,"ДЕЙСТВИЕ — СПУСТИТЬСЯ В БАЗУ","без тел базы — прежняя строка у корабля");
    owAt(w.S,w.S.shipX,true);
    eq(G.mode,"base","без тел базы — вход у корабля");
    eq(plnOwnGateX(w.S),null,"без тел базы ворот нет");
  }finally{OWN.on=on;}
  resetWorld();
}));
TEST_SUITES.push(()=>suite("база и дом телами: тела на земле, отсеки по верхнему ряду, лампы в бюджете (M628a)",()=>{
  const on=OWN.on,kRib=plnLandRibAt,kLift=plnLandLift,kStep=plnOwnStep,kSet=plnInstSet,oB=OWN.base,oH=OWN.home;
  try{
    OWN.on=true;
    const w=owWorld();owFound(w.p);
    G.home={sx:G.sx,sy:G.sy,tier:2};
    const B=baseAt(G.sx,G.sy,w.p.idx);
    /* земля — наклонная плоскость: тела стоят на ней, числа конечны */
    plnLandRibAt=(L,x,z)=>.02*x-.15*z;plnLandLift=()=>0;
    const L={tr:w.tr,wet:false};
    const top=()=>{const n=[];for(let c=0;c<BASE_COLS;c++){const k=baseCell(B,c,0);if(k)n.push(k.k);}return n;};
    for(const set of [[],["habitat"],["habitat","drill","storage"],["habitat","solar","battery","drill"]]){
      for(let c=0;c<BASE_COLS;c++)if(c!==2)B.cells[c]=null;
      set.forEach((k,i)=>{B.cells[i<2?i:i+1]={k,hp:1};});
      const A=plnOwnBaseAt(L,w.tr,w.p,B);
      ok([A.x,A.y,A.z,A.gx].every(isFinite),"место базы конечно: "+[A.x,A.y,A.z,A.gx].map(v=>v.toFixed(1)).join(","));
      ok(A.y>=plnLandRibAt(L,A.x,A.z)+OWN.deckH-1e-6,"настил над землёй на "+OWN.deckH+" м");
      const M=plnOwnBaseMesh(L,A,7,plnOwnBattOf(B),false);
      const want=top().filter(k=>k!=="battery"&&k!=="solar").length;
      eq(M.mods,want,"отсеков столько, сколько построено в верхнем ряду ("+top().join(",")+")");
      ok(M.body.nv>0&&M.light.nv>0,"у базы есть тело и свет");
      eq(M.batt.nv>0,top().indexOf("battery")>=0,"огонёк заряда — только при батарее");
    }
    const H=plnOwnHomeAt(L,w.tr,w.p);
    ok(H&&[H.x,H.y,H.z,H.door].every(isFinite),"место дома конечно");
    const HM=plnOwnHomeMesh(L,H,9,[{g:0},{g:.5},{g:1}]);
    ok(HM.body.nv>0&&HM.beacon.nv>0&&HM.grow.nv>0,"у дома тело, маяк и лампа теплицы");

    /* бюджет ламп: у кадра их четыре на всё, свои вещи ночью берут не больше двух и не сверх четырёх */
    plnOwnStep=()=>{};plnInstSet=()=>{};
    const fake=(kind,x)=>({kind,A:{x,y:0,z:8},key:"",sd:3,geo:{},light:{},aux:{},beam:kind==="home"?{}:null,fx:null,batt:.5,
      lampAt:{porch:[0,2.3,-2.7],pier:[0,2.4,15]},blots:[[0,0,3,.5]],a:new Float32Array(80),inst:{}});
    OWN.base=fake("base",0);OWN.home=fake("home",20);
    const S=w.S,V={hw:30,D:60};
    const run=(nk,lamps)=>{const F={t:1,blobs:new Float32Array(4+64*4),batches:[],lamps:lamps.slice()};plnOwnFrame(L,F,S,w.p,10,V,nk);return F;};
    const day=run(0,[]);
    eq(day.lamps.length,0,"днём своих ламп нет");
    ok(day.batches.length>=6,"тела и свет базы и дома в кадре: "+day.batches.length);
    const nt=run(1,[]);
    eq(nt.lamps.length,2,"ночью — фонарь крыльца и фонарь пирса");
    const lp=(x)=>({p:[x,1,7],r:5,c:[1,1,1],k:1});
    const full=run(1,[lp(10),lp(12),lp(14),lp(16)]);
    eq(full.lamps.length,4,"ламп не больше четырёх");
    const far=run(1,[lp(10),lp(500),lp(14),lp(16)]);
    ok(far.lamps.length===4&&!far.lamps.some(l=>l.p[0]===500),"лампа за кромкой кадра уступает место своей");
  }finally{plnLandRibAt=kRib;plnLandLift=kLift;plnOwnStep=kStep;plnInstSet=kSet;OWN.base=oB;OWN.home=oH;OWN.on=on;}
  resetWorld();
}));
