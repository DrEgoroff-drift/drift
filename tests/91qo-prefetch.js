(function(){
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

  resetWorld();plnBodyClear(G.sys);
}));
})();
