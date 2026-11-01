(function(){
/* ══════════════ предзагрузка планет: посадка не ждёт сборки ══════════════
   Фон (plnbody, 21pg) готовит рельеф и вещи земли всех планет системы и собирает
   ленты земли ВСЕХ твёрдых планет теми же ступенями, что спуск; цель автопилота
   идёт первой. Нажатие «ПОСАДКА» забирает готовую ленту вместе с её долготой,
   поэтому не ждёт сборки и не выбрасывает работу, если корабль подошёл с другой
   стороны. Набор проверяет первый заход, все планеты, другую долготу, повторную
   посадку, переход в другую систему и загрузку сохранения. */
function pfSolid(S){return S.planets.filter(q=>q.type!=="gas");}
function pfFirst(S){return pfSolid(S)[0]||S.planets[0];}
/* в наборе кадров нет, а позиции планет ставит updateSystem: расставляем сами,
   иначе все планеты сидят в нуле и «ближайшая» всегда одна и та же */
function pfPlace(S){
  S.planets.forEach((q,i)=>{const a=i*2.2,r=700+i*190;q.x=Math.cos(a)*r;q.y=Math.sin(a)*r;});
}
function pfFresh(){resetWorld();plnBodyClear(G.sys);PLNBODY.target=null;PLNBODY.sys=G.sys;}
/* настоящий насос кадра: так фон запускается в игре, а не прямым plnBodyTick */
function pfPumpAll(max){
  let n=0;
  while(n<max){
    workPump();n++;
    const S=G.sys,list=pfSolid(S);
    if(list.length&&list.every(q=>q.__tr&&q.__gs&&q.__land&&q.__land.warmDone))break;
  }
  return n;
}
/* гонять фон, пока все твёрдые планеты не получат готовую ленту */
function pfPrepAll(max){
  let n=0;
  while(n<max){
    plnBodyTick(3);n++;
    const S=G.sys,list=pfSolid(S);
    if(list.length&&list.every(q=>q.__tr&&q.__gs&&q.__land&&q.__land.warmDone))break;
  }
  return n;
}
TEST_SUITES.push(()=>suite("предзагрузка планет: лента земли готова до нажатия посадки",{tier:"browser"},()=>{
  /* 1. первый заход: фон собирает данные и ленты всех твёрдых планет */
  pfFresh();
  let S=G.sys;pfPlace(S);
  let p=pfFirst(S);
  G.ship.x=p.x+p.radius+300;G.ship.y=p.y;
  const n=pfPrepAll(6000);
  const solids=pfSolid(S);
  ok(n<6000,"фон успел подготовить систему за "+n+" проходов");
  ok(solids.every(q=>q.__tr&&q.__gs),"рельеф и вещи земли посчитаны у всех твёрдых планет ("+solids.length+")");
  ok(solids.every(q=>q.__land&&q.__land.warmDone),"ленты земли собраны у всех твёрдых планет ("+solids.length+")");

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

  /* 4. другая планета и другая долгота: цель автопилота, лента принимается с её стороной */
  G.mode="system";G.land=null;
  const p2=solids.find(q=>q!==p);
  if(p2){
    G.ap={kind:"planet",p:p2};
    /* подходим с противоположной стороны от той, где лента уже собрана */
    G.ship.x=p2.x+Math.cos(2.4)*(p2.radius+500);G.ship.y=p2.y+Math.sin(2.4)*(p2.radius+500);
    const lonBefore=plnLonOf(p2);
    let m=0;
    while(m<6000){plnBodyTick(3);m++;if(p2.__land&&p2.__land.warmDone)break;}
    ok(p2.__land&&p2.__land.warmDone,"вторая планета подготовлена фоном за "+m+" проходов");
    const l2=p2.__land,tr2=l2&&l2.tr;
    G.ship.x=p2.x-Math.cos(1.1)*(p2.radius+500);G.ship.y=p2.y-Math.sin(1.1)*(p2.radius+500);
    const lonNow=plnLonOf(p2);
    startLanding(p2);
    ok(G.land.tr===tr2,"нажатие с другой стороны приняло ленту, а не выбросило её");
    ok(plnLand(G.land.tr,p2,G.land.x)===l2,"спуск принял ленту при смене долготы");
    ok(Math.abs(lonNow-lonBefore)>0.1,"долгота действительно сменилась ("+Math.abs(lonNow-lonBefore).toFixed(2)+" рад)");
  }

  /* 5. переход в другую систему: кэши планет и ленты освобождены */
  G.mode="system";G.land=null;G.ap=null;
  const old=S.planets.slice();
  G.sys=getSystem(6,7);G.sx=6;G.sy=7;
  plnBodyTick(3);
  ok(old.every(q=>!q.__tr&&!q.__gs&&!q.__land),"при переходе в другую систему кэши планет прошлой освобождены");
  ok(PLN_LAND.cur===null,"лента прошлой системы освобождена");

  /* 6. посадка до готовности фона: прежний путь работает, без ошибок */
  pfFresh();
  S=G.sys;pfPlace(S);p=pfFirst(S);
  G.ship.x=p.x+p.radius+300;G.ship.y=p.y;
  let bad="";
  try{startLanding(p);}catch(e){bad=String(e&&e.message||e);}
  ok(!bad,"посадка до готовности фона не падает: "+bad);
  ok(!!G.land.pre,"вещи земли посчитаны на месте, если фон не успел");

  /* 7. загрузка существующего сохранения: фон стартует и готовит ленты заново */
  pfFresh();
  S=G.sys;pfPlace(S);p=pfFirst(S);
  G.ship.x=p.x+p.radius+300;G.ship.y=p.y;
  const snap=snapshot();
  resetWorld();
  PLNBODY.sys=null;PLNBODY.target=null;PLNBODY.failT=0;
  applySave(snap);G.mode="system";
  const s2=pfFirst(G.sys);
  const m2=pfPumpAll(6000);
  ok(pfSolid(G.sys).every(q=>q.__tr&&q.__gs),"после загрузки сохранения фон посчитал данные всех твёрдых планет ("+m2+" кадров)");
  ok(s2.__land&&s2.__land.warmDone,"после загрузки сохранения лента готова");

  resetWorld();plnBodyClear(G.sys);
}));
})();
