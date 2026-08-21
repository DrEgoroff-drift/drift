/* ══ M118: подглядка показывает только то, что было ══
   Сторож замысла: луг растёт лишь там, где мир вообще темнеет; сцена — чистая
   функция зерна планеты и не бросается заново; показ идёт только в темноте;
   кусок отчёта платится за ДОСМОТРЕННЫЙ проход, стоя в мате, и только раз. */
TEST_SUITES.push(()=>suite("подглядка: луг, который помнит свет",()=>{
  resetWorld();
  /* ── правило 2: без спутника мир не темнеет никогда ── */
  let seen=0,with_=0,host=null,hostSys=null;
  for(let dx=-7;dx<=7;dx++)for(let dy=-7;dy<=7;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of (s.planets||[])){
      seen++;
      if(!peepHere(p))continue;
      with_++;
      ok(!!(p.moons&&p.moons.length),"луг только там, где есть спутник: "+p.name);
      ok(p.type!=="gas","и только на твёрдом мире: "+p.name);
      if(!host&&p.type!=="gas"){host=p;hostSys={sx:dx,sy:dy,s};}
    }
  }
  ok(seen>40,"проверено миров: "+seen);
  ok(with_>0,"луга в галактике есть: "+with_);
  ok(with_<seen*.25,"и это редкость, а не трава: "+with_+" из "+seen);

  /* ── правило 3: сцена детерминирована ── */
  if(host){
    const a=peepScene(host),b=peepScene(host);
    eq(a.n,b.n,"тот же мир — то же число идущих");
    eq(a.load,b.load,"и та же ноша");
    eq(a.dir,b.dir,"и та же сторона");
    ok(a.n>=1&&a.n<=4,"идущих от одного до четырёх: "+a.n);
  }
  /* ноша на двоих не достаётся одиночке ни при каком зерне */
  for(let i=0;i<400;i++){
    const sc=peepScene({seed:i*7919+1});
    if(sc.n<2)ok(sc.load!=="носилки"&&sc.load!=="шест",
                 "одиночка не несёт носилки и не тащит шест (зерно "+i+")");
  }
}));

TEST_SUITES.push(()=>suite("подглядка: платит за досмотренный проход",()=>{
  resetWorld();
  /* находим мир с лугом и садимся на него */
  let host=null;
  for(let dx=-7;dx<=7&&!host;dx++)for(let dy=-7;dy<=7&&!host;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of (s.planets||[]))if(p.type!=="gas"&&peepHere(p)){
      G.sx=dx;G.sy=dy;G.sys=s;host=p;break;
    }
  }
  ok(!!host,"мир с лугом нашёлся");
  if(!host)return;
  const tr=genTerrain(host);
  G.land={p:host,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  const S=G.surf,P=S.peep;
  ok(!!P,"на этом мире луг есть");
  ok(Math.abs(P.x-S.x)>0,"и лежит не под трапом");
  /* на лугу не растёт ничего чужого: показывают идущих, а не куст */
  for(const pl of S.plants)ok(Math.abs(pl.x-P.x)>=P.r*.85,"на мате нет кустов");

  const dark0=celDark;
  try{
    /* ── светло: показа нет и платы нет ── */
    celDark=()=>0;
    S.x=P.x;
    steps(600,updateSurface);
    eq(P.ph,0,"на свету проход не идёт");
    eq(loreCount(),0,"и ни одного куска не выдано");

    /* ── темно, но стоим в стороне: смотреть некому ── */
    celDark=()=>.8;
    S.x=P.x+P.r+200;S.walkTarget=null;
    steps(PEEP_PASS+40,updateSurface);
    eq(P.watch,0,"вне мата досмотр не копится");
    eq(loreCount(),0,"и кусок не выдан издалека");

    /* ── темно и стоим в мате: полный проход платит ── */
    S.x=P.x;
    steps(PEEP_PASS+10,updateSurface);
    eq(loreCount(),1,"досмотренный проход отдал кусок отчёта");
    /* ── и только раз ── */
    steps(PEEP_PASS*2,updateSurface);
    eq(loreCount(),1,"второй проход не платит второй раз");

    /* ── темнота прервалась — досмотр начинается заново ── */
    P.paid=0;P.watch=PEEP_PASS-5;
    celDark=()=>0;
    steps(2,updateSurface);
    eq(P.watch,0,"рассвело — досмотр сброшен, половинки не складываются");
  }finally{celDark=dark0;}
}));
