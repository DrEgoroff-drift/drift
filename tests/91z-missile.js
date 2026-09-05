/* ══ M112: ракеты — это логистика, а не второй ствол ══
   Сторож замысла: пусковая без груза в трюме не стреляет ничем, каждый пуск
   вычитает из того же трюма, где лежит товар, партия не собирается, если её
   некуда положить, и промах — это потеря, а не перезарядка. */
TEST_SUITES.push(()=>suite("ракеты: боеприпас — это груз",()=>{
  resetWorld();
  ok(!!PART_KINDS.missile,"пусковая — категория частей, а не число на пушке");
  ok(!!RES.missile&&!!RES.missile.ammo,"ракета — строка трюма");
  ok(TRADE_KEYS.indexOf("missile")<0,"и рынок её не берёт");
  ok(RARE_RES.indexOf("missile")<0,"и за редкое сырьё она не считается");
  /* подвес есть на каждом корпусе и стоит последним: старые сборки не съехали */
  const sl=slotsOf(G.shipId);
  eq(sl[sl.length-1],"missile","подвес под пусковую — последний слот");
  eq(sl.filter(k=>k==="missile").length,1,"и он один");
  eq(slotAnchors(G.shipId).length,sl.length,"точка на корпусе есть у каждого слота");

  /* без пусковой пуска нет вовсе */
  G.cargo.missile=5;
  ok(!stat().launcher,"пусковая не установлена");
  ok(!mslCheck().ok,"и пустить нечем");
  G.mslCool=0;
  ok(!mslFire(),"пуск не проходит");
  eq(G.cargo.missile,5,"и трюм не тронут");

  /* ставим пусковую */
  const P=genPart(4242,3,"missile");
  eq(P.kind,"missile","часть собралась пусковой");
  ok(!!P.bonus.msl,"и помечена как пусковая");
  addPart(P);
  ok(fitPart(sl.length-1,P.id),"пусковая встала в свой подвес");
  ok(stat().launcher,"корабль получил пусковую");

  /* с пусковой, но без ракет — тоже нет */
  G.cargo.missile=0;G.mslCool=0;
  ok(!mslCheck().ok,"пустой трюм — нет пуска");
  ok(!mslFire(),"и кнопка ничего не делает");

  /* цель по носу, ракета уходит и вычитается из трюма */
  G.mode="system";G.msl=[];G.mslCool=0;
  G.cargo.missile=2;
  const sh=G.ship;sh.x=0;sh.y=0;sh.vx=0;sh.vy=0;sh.a=0;
  const tgt={x:900,y:0,vx:0,vy:0,a:Math.PI,hull:120,hullMax:120,rank:3,seed:11,
             name:"Барон",cool:0,aware:false};
  G.pirates=[tgt];
  ok(mslFire(),"пуск прошёл");
  eq(G.cargo.missile,1,"ракета списана из трюма");
  eq(G.msl.length,1,"и летит одна");
  ok(G.mslCool>0,"пусковая ушла на перезарядку");
  for(let i=0;i<400&&G.msl.length;i++)mslTick(1);
  ok(tgt.hull<120,"барону досталось: ракета бьёт всех, в отличие от батареи");

  /* за спину не пускаем, и промах — потеря */
  G.mslCool=0;G.msl=[];G.cargo.missile=1;
  G.pirates=[{x:-900,y:0,vx:0,vy:0,a:0,hull:60,hullMax:60,rank:0,seed:5,
              name:"Шакал",cool:0,aware:false}];
  ok(!mslFire(),"цели по носу нет — пуска нет");
  eq(G.cargo.missile,1,"и ракета осталась в трюме");
  G.mslCool=0;G.pirates=[];
  ok(mslFire()===false&&G.cargo.missile===1,"без целей вовсе пуск тоже не тратит ракету");

  /* сборка партии: цена в редком сырье и место в трюме */
  resetWorld();
  G.credits=0;
  ok(!craftAffordable(AMMO_COST),"без денег партия не собирается");
  G.credits=99000;G.cargo.alloy=AMMO_COST.alloy;G.cargo.isotopes=AMMO_COST.isotopes;
  const before=held();
  const n=craftAmmo();
  ok(n>0,"партия собралась");
  eq(G.cargo.missile,n,"и легла в трюм");
  eq(held(),before-AMMO_COST.alloy-AMMO_COST.isotopes+n,"боеприпас занимает место наравне с рудой");
  /* забитый трюм — партии нет: «собрал и потерял половину» было бы обманом */
  G.cargo.iron=Math.max(0,stat().cargoMax-held());
  const keep=G.cargo.missile;
  eq(craftAmmo(),0,"в полный трюм партия не собирается");
  eq(G.cargo.missile,keep,"и ничего не появилось");
}));
