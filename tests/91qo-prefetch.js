(function(){
TEST_SUITES.push(()=>suite("шум планеты: кэш сохраняет каждый бит градиента",()=>{
  resetWorld();
  function oldNoise(x,y,s){
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const ux=fx*fx*fx*(fx*(fx*6-15)+10),uy=fy*fy*fy*(fy*(fy*6-15)+10);
    const a0=plnHash(ix,iy,s)*TAU,a1=plnHash(ix+1,iy,s)*TAU,a2=plnHash(ix,iy+1,s)*TAU,a3=plnHash(ix+1,iy+1,s)*TAU;
    const a=Math.cos(a0)*fx+Math.sin(a0)*fy,b=Math.cos(a1)*(fx-1)+Math.sin(a1)*fy,
      c=Math.cos(a2)*fx+Math.sin(a2)*(fy-1),d=Math.cos(a3)*(fx-1)+Math.sin(a3)*(fy-1);
    return (a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy)*1.41;
  }
  const r=rng(81273);let same=true;
  for(let i=0;i<100000;i++){
    const x=(r()-.5)*20000,y=(r()-.5)*20000,s=(r()*4294967296)|0;
    if(plnNoise(x,y,s)!==oldNoise(x,y,s))same=false;
  }
  ok(same,"100000 точек, отрицательные координаты и вытеснения: результат побитно прежний");
  ok(plnLonMatch(-Math.PI+.02,Math.PI-.02),"граница оборота не выбрасывает тот же участок");
  ok(!plnLonMatch(0,1),"другая сторона планеты остаётся другим участком");
}));
/* ══════════════ предзагрузка планет: посадка не ждёт сборки ══════════════
   Фон (plnbody, 21pg) готовит рельеф и вещи земли всех планет системы, а ленту
   ближайшей собирает теми же ступенями, что спуск. Нажатие «ПОСАДКА» должно
   забрать готовое и не ждать: L.warmDone уже стоит, и спуск рисует мир с первого
   кадра. Набор проверяет все четыре случая из задачи: первый заход, разные
   планеты, повторную посадку и переход в другую систему, — и что посадка до
   готовности фона по-прежнему работает. */
function pfSolid(S){return S.planets.find(q=>q.type!=="gas")||S.planets[0];}
/* в наборе кадров нет, а позиции планет ставит updateSystem: расставляем сами,
   иначе все планеты сидят в нуле и «ближайшая» всегда одна и та же */
function pfPlace(S){
  S.planets.forEach((q,i)=>{const a=i*2.2,r=700+i*190;q.x=Math.cos(a)*r;q.y=Math.sin(a)*r;});
}
function pfFresh(){resetWorld();plnBodyClear(G.sys);PLNBODY.target=null;PLNBODY.sys=G.sys;}
function pfPrep(max){
  let n=0;
  while(n<max){
    plnBodyTick(3);n++;
    const S=G.sys,p=pfSolid(S);
    if(S.planets.every(q=>q.__tr&&q.__gs)&&p.__land&&p.__land.warmDone)break;
  }
  return n;
}
TEST_SUITES.push(()=>suite("предзагрузка планет: лента земли готова до нажатия посадки",{tier:"browser"},()=>{
  /* 1. первый заход: фон успевает собрать данные и ленту ближайшей планеты */
  pfFresh();
  let S=G.sys;pfPlace(S);
  let p=pfSolid(S);
  G.ship.x=p.x+p.radius+300;G.ship.y=p.y;
  const n=pfPrep(4000);
  ok(n<4000,"фон успел подготовить систему за "+n+" проходов");
  ok(S.planets.every(q=>q.__tr&&q.__gs),"рельеф и вещи земли посчитаны у всех планет системы ("+S.planets.length+")");
  ok(p.__land&&p.__land.warmDone,"лента ближайшей планеты собрана фоном");
  ok(Math.abs(PLNBODY.C.ex-p.__tr.padX/PLN_M)<1e-6,"камера фона над площадкой в единицах объектива");
  ok(!p.__land.jobs.some(j=>!j.done&&plnLandSees(j,PLNBODY.C.ex,PLNBODY.V,20)),"готовность означает реально собранные видимые куски");

  /* 2. нажатие забирает готовое и не считает заново */
  const tr=p.__tr,gs=p.__gs,land=p.__land;
  startLanding(p);
  ok(G.land.tr===tr,"нажатие посадки взяло готовый рельеф, а не считало genTerrain");
  ok(G.land.pre===gs,"нажатие посадки взяло готовые вещи земли, а не считало surfGen");
  const L=plnLand(G.land.tr,p,G.land.x);
  ok(L===land,"спуск принял собранную фоном ленту");
  ok(L.warmDone===true,"спуску нечего ждать: warmDone стоит до первого кадра");

  /* 3. повторная посадка: рельеф и лента переживают возвращение в систему */
  G.mode="system";G.land=null;
  for(let i=0;i<12;i++)plnBodyTick(20);
  ok(p.__tr===tr,"рельеф пережил посадку — повторный заход не платит genTerrain");
  startLanding(p);
  const L2=plnLand(G.land.tr,p,G.land.x);
  ok(L2===land,"повторная посадка приняла ту же ленту");

  /* 4. другая планета: ближайшая сменилась — прежняя лента освобождена, новая собрана */
  G.mode="system";G.land=null;
  const p2=S.planets.find(q=>q!==p&&q.type!=="gas");
  if(p2){
    G.ship.x=p2.x+p2.radius+300;G.ship.y=p2.y;
    let m=0;
    while(m<4000){plnBodyTick(3);m++;if(p2.__land&&p2.__land.warmDone)break;}
    ok(p2.__land&&p2.__land.warmDone,"вторая планета подготовлена фоном за "+m+" проходов");
    ok(!p.__land,"лента прежней ближайшей освобождена, в памяти живёт одна");
    const l2=p2.__land;
    startLanding(p2);
    ok(plnLand(G.land.tr,p2,G.land.x)===l2,"посадка на другую планету приняла её ленту");
  }

  /* 5. переход в другую систему: кэши планет и лента освобождены */
  G.mode="system";G.land=null;
  const old=S.planets.slice();
  G.sys=getSystem(6,7);G.sx=6;G.sy=7;
  plnBodyTick(3);
  ok(old.every(q=>!q.__tr&&!q.__gs&&!q.__land),"при переходе в другую систему кэши планет прошлой освобождены");
  ok(PLN_LAND.cur===null,"лента прошлой системы освобождена");

  /* 6. посадка до готовности фона: прежний путь работает, без ошибок */
  pfFresh();
  S=G.sys;pfPlace(S);p=pfSolid(S);
  G.ship.x=p.x+p.radius+300;G.ship.y=p.y;
  let bad="";
  try{startLanding(p);}catch(e){bad=String(e&&e.message||e);}
  ok(!bad,"посадка до готовности фона не падает: "+bad);
  ok(!!G.land.pre,"вещи земли посчитаны на месте, если фон не успел");

  /* Цель автопилота важнее ближайшего тела, спутники проходят тот же путь. */
  G.mode="system";G.land=null;
  const moon=plnBodyAll(S).find(q=>q.parentIdx!=null&&q.type!=="gas");
  if(moon){
    G.ap={kind:"planet",p:moon};
    ok(plnBodyNear(S)===moon&&plnBodyOrder(S)[0]===moon,"дальняя луна — первая по явной цели");
    for(let i=0;i<4000&&!(moon.__land&&moon.__land.warmDone);i++)plnBodyTick(3);
    const mt=moon.__tr,ml=moon.__land;
    ok(!!(ml&&ml.warmDone),"луна полностью собрана до посадки");
    G.ship.x=moon.x-moon.radius-80;G.ship.y=moon.y;
    startLanding(moon);
    ok(G.land.tr===mt&&plnLand(mt,moon,mt.padX)===ml,"автопилот сохраняет выбранную площадку на подлёте");
    G.mode="system";G.land=null;G.ap=null;plnBodyClear(S);
    ok(!moon.__tr&&!moon.__gs&&!moon.__land,"при очистке освобождаются и спутники");
  }

  resetWorld();plnBodyClear(G.sys);
}));
})();
