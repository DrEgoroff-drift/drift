/* ══════════════ швы §9: где сходятся построенные вещи ══════════════
   Дроны и дальнее сырьё, оклик кольца, жетон первого часа, выход НА МЕТРО
   в окне спасения, охват схемы. Каждый шов — одна вещь, что ломается тихо. */
TEST_SUITES.push(()=>suite("швы §9: дрон не берёт дальнее второго пояса, первое сдаёт за полцены",()=>{
  resetWorld();
  ok(!droneMayMine("osmium")&&!droneMayMine("neutron"),"осмий и крошку дрон не берёт");
  ok(droneMayMine("he3")&&droneMayMine("iron"),"гелий-3 и железо — берёт");
  let sys=null;
  for(let sx=-4;sx<=4&&!sys;sx++)for(let sy=-4;sy<=4&&!sys;sy++){const s=getSystem(sx,sy);if(s.station)sys=s;}
  ok(!!sys,"станция нашлась");
  const live=marketFor(sys).he3|0;
  eq(droneSellPrice(sys,"he3"),Math.max(1,Math.round(live*.5)),"гелий-3 дрон сдаёт за полцены: "+live);
  eq(droneSellPrice(sys,"iron"),marketFor(sys).iron|0,"железо — по живой цене");
  G.seenPrices[sys.key]={day:celDay(),p:{iron:777}};
  eq(droneSellPrice(sys,"iron"),777,"свежая виденная цена — та, по которой сдаёт");
  G.seenPrices[sys.key].day=celDay()-DRONE_SEEN_DAYS-1;
  eq(droneSellPrice(sys,"iron"),marketFor(sys).iron|0,"старая — нет, живая");
}));
TEST_SUITES.push(()=>suite("швы §9: «Стыковка?» — только тому, кто идёт в кольцо",()=>{
  resetWorld();
  const N=railNet();
  const k=Object.keys(N.at).find(k=>{const p=k.split(",").map(Number);return Math.hypot(p[0],p[1])<=12&&getSystem(p[0],p[1]).station;});
  const [sx,sy]=k.split(",").map(Number);
  G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);G.mode="system";
  const R=railHere();RAIL_DOCK=null;
  /* как после ВЫЙТИ: в шестидесяти от кольца, ход к станции */
  G.ship.x=R.x+R.ux*60;G.ship.y=R.y+R.uy*60;G.ship.vx=R.ux*.5;G.ship.vy=R.uy*.5;G.ship.a=Math.atan2(R.uy,R.ux);
  ok(!railHeadingIn(G.ship,R),"вышедший из поезда идёт от кольца");
  eq(railInteract(G.ship),false,"и оклика ему нет");
  G.ship.vx=-R.ux*.8;G.ship.vy=-R.uy*.8;
  ok(railHeadingIn(G.ship,R),"развернулся к кольцу — идёт в него");
  G.ship.vx=G.ship.vy=0;G.ship.a=Math.atan2(-R.uy,-R.ux);
  ok(railHeadingIn(G.ship,R),"стоит носом к кольцу — тоже");
}));
TEST_SUITES.push(()=>suite("швы §9: жетон замполита — первый проезд в метро за счёт трассы",()=>{
  resetWorld();G.running=true;
  G.sx=40;G.sy=0;G.mode="dock";firstToken();
  ok(!firstSaid("tok"),"вне сердца жетон не выдают");
  G.sx=2;G.sy=1;firstToken();
  ok(firstSaid("tok"),"первая стыковка в сердце — жетон выдан");
  const t={to:{sx:3,sy:1},dist:1};
  const F=railFare(t);
  eq(F.fare+":"+(F.tok|0),"0:1","первый проезд в метро — даром");
  eq(railFare({to:{sx:30,sy:0},dist:28}).tok|0,0,"на электричку жетон не идёт");
  firstAll().push("tokUsed");
  eq(railFare(t).fare,5,"второй — по жетону за 5 кр");
  G.running=false;
}));
TEST_SUITES.push(()=>suite("швы §9: сухой борт у остановки — третий выход НА МЕТРО",()=>{
  resetWorld();
  const N=railNet();
  let at=null,T=null;
  for(const k of Object.keys(N.at)){
    const p=k.split(",").map(Number),r=Math.hypot(p[0],p[1]);
    if(r<5||r>12||!getSystem(p[0],p[1]).station)continue;
    G.sx=p[0];G.sy=p[1];G.sys=getSystem(p[0],p[1]);G.mode="system";
    T=rescueRail(rescueHomeAt());if(T){at=p;break;}
  }
  ok(!!at,"остановка с билетом ближе к дому нашлась");
  G.fuel=0;G.credits=1000;
  const o=rescueOffers().find(x=>x.id==="rail");
  ok(o&&o.cost===T.F.sum,"в окне спасения есть НА МЕТРО по цене билета: "+(o&&o.cost));
  ok(rescueOffers().some(x=>x.id==="tow")&&rescueOffers().some(x=>x.id==="home"),"рядом с ДОМОЙ и БУКСИРОМ");
  const c0=G.credits;
  ok(rescueTake("rail"),"выход взят");
  eq(G.mode+":"+(c0-G.credits),"rail:"+o.cost,"мы в поезде, билет оплачен");
  for(let i=0;i<60*200&&G.mode==="rail";i++)updateRail(1);
  const d=Math.hypot(G.sx-rescueHomeAt().sx,G.sy-rescueHomeAt().sy);
  ok(d<Math.hypot(at[0],at[1]),"поезд привёз ближе к дому: "+d.toFixed(1));
  RAIL_RIDE=null;
}));
TEST_SUITES.push(()=>suite("швы §9: схема — ваш участок, шире колесом, до всей сети",()=>{
  resetWorld();
  const N=railNet();
  const k=Object.keys(N.at).find(k=>{const p=k.split(",").map(Number);return Math.hypot(p[0],p[1])<=12&&getSystem(p[0],p[1]).station;});
  const [sx,sy]=k.split(",").map(Number);
  G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);
  RAIL_SCHEME_Z=0;const A=railSchemeScope();
  ok(A.half<RAIL_R,"охват — участок, не вся сеть: полширины "+A.half.toFixed(1)+" из "+RAIL_R);
  for(const q of railDestinations())
    ok(Math.abs(q.to.sx-A.cx)<=A.half&&Math.abs(q.to.sy-A.cy)<=A.half,"всё, что продаёт касса, на листе: "+railStopName(q.to));
  RAIL_SCHEME_Z=1;const B=railSchemeScope();
  eq(B.half+":"+B.cx+":"+B.cy,RAIL_R+":0:0","отодвинуть до конца — вся сеть");
  RAIL_SCHEME_Z=0;
}));
