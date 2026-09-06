/* ══════════════ автотесты: база: энергия и стройка, смотритель, буря, перки фактора ══════════════ */
TEST_SUITES.push(()=>suite("база: ленивое время не падает, вход работает",()=>{
  resetWorld();
  /* `baseTick` читал CREW_OFFLINE_CAP, которой не существовало: каждый тик базы
     после первого падал с ReferenceError, и вместе с ним падал вход в базу.
     Держим и константу, и сам путь входа под проверкой. С M390 тик считает
     СМЕНЫ (`baseResolveAll`), а потолок остался тот же — сутки. */
  ok(typeof CREW_OFFLINE_CAP==="number"&&CREW_OFFLINE_CAP>0,"потолок ленивого времени объявлен");
  eq(BASE_CAP_SH,Math.floor(CREW_OFFLINE_CAP/HOLD_SHIFT),"и в сменах это те же сутки");
  G.credits=500000;G.cargo.alloy=99;
  const p=G.sys.planets.find(x=>x.type!=="gas");
  ok(foundBase(p),"база заложена");
  const B=baseAt(G.sx,G.sy,p.idx);
  B.t0=baseShift()-2;
  baseResolveAll();
  ok(true,"второй тик базы не падает");
  G.mode="surface";
  enterBase(p);
  eq(G.mode,"base","в базу можно войти");
  exitBase();
}));

TEST_SUITES.push(()=>suite("смотритель: энергия, стройка и логистика",()=>{
  resetWorld();
  G.credits=500000;G.cargo.alloy=99;
  hireMgr(genMgr(41,["keep"]));
  const kp=mgrOf("keep");
  const p=G.sys.planets.find(x=>x.type!=="gas");
  foundBase(p);
  const B=baseAt(G.sx,G.sy,p.idx);
  const wipe=()=>{for(let i=0;i<B.cells.length;i++)B.cells[i]=null;};
  /* глухой перегруз: один реактор на шесть буров */
  wipe();
  B.cells[2]={k:"reactor",hp:1};
  for(const i of [0,1,3,4,5,6])B.cells[i]={k:"drill",hp:1};
  kp.perks=[];
  const bare=basePower(B).eff;
  kp.perks=["stable"];
  ok(basePower(B).eff>bare,"«стабилизация» держит нижний порог");
  near(basePower(B).eff,.35,.001,"и порог этот — 0.35");
  /* «переброс» отбирает мощность у необязательного в пользу бура */
  wipe();
  B.cells[2]={k:"reactor",hp:1};B.cells[0]={k:"drill",hp:1};
  B.cells[4]={k:"refinery",hp:1};B.cells[6]={k:"pad",hp:1};B.cells[7]={k:"habitat",hp:1};
  kp.perks=[];
  const flat=basePower(B).eff;
  kp.perks=["power"];
  ok(basePower(B).eff>flat,"«переброс» вытягивает отдачу при нехватке");
  /* ── «излишки»: станция берёт спил работающей базы (M240) ──
     Раньше платили за всю лишнюю мощность и не спрашивали, работает ли база:
     реактор с панелями и БЕЗ единого потребителя приносил больше всех и
     окупался за полтора часа — деньги делали деньги без предела. */
  wipe();
  B.cells[2]={k:"reactor",hp:1};
  const P=basePower(B);
  ok(P.surplus>0,"лишняя мощность посчитана");
  kp.perks=[];
  G.credits=1000;B.t0=baseShift()-1;baseResolveAll();
  eq(G.credits,1000,"без перка излишки никуда не идут");
  kp.perks=["grid"];
  B.t0=baseShift()-1;baseResolveAll();
  eq(G.credits,1000,"и электростанция без базы не продаёт ничего: потребителей нет");
  /* работающая база: бур ест, часть мощности лишняя — её и берут.
     Такт базы двигает не только деньги: за десять минут на неё может прийти
     налёт и разбить отсек (baseRaid — бросок от опасности сектора). Тогда
     проверять доход бессмысленно, и набор честно говорит об этом вместо того,
     чтобы падать раз в три прогона. */
  B.cells[0]={k:"drill",hp:1};
  const P2=basePower(B);
  ok(P2.cons>0&&P2.surplus>0,"база работает и всё равно имеет излишек");
  G.credits=1000;B.t0=baseShift()-1;baseResolveAll();
  const alive=B.cells[0]&&B.cells[0].hp>0&&B.cells[2]&&B.cells[2].hp>0;
  const gain=G.credits-1000;
  if(!alive)ok(true,"налёт разбил базу за эти минуты — доход не про этот прогон");
  else{
    ok(gain>0,"с «излишками» работающая база даёт в кассу: +"+gain);
    /* и не больше, чем она съедает сама: смена × min(surplus,cons) × 1.4 */
    ok(gain<=Math.round(Math.min(P2.surplus,P2.cons)*BASE_MIN*1.4)+1,
       "и не больше собственного потребления ("+gain+")");
  }
  /* «второй ярус» */
  eq(baseRows(B),BASE_ROWS,"по умолчанию рядов четыре");
  kp.perks=["deep"];
  baseGrowCheck(B);
  eq(baseRows(B),BASE_ROWS_DEEP,"с перком вскрывается пятый");
  eq(B.cells.length,BASE_COLS*BASE_ROWS_DEEP,"и ячеек стало больше");
  /* ярус остаётся у базы, даже если смотрителя не стало */
  kp.perks=[];
  eq(baseRows(B),BASE_ROWS_DEEP,"вскрытый ярус у базы не отбирают обратно");
  /* «очередь» доводит начатое без инженера */
  B.cells[2].hp=.2;
  baseFixTick(B,20);
  near(B.cells[2].hp,.2,.001,"без перка и без инженера чинить некому");
  kp.perks=["queue"];
  baseFixTick(B,20);
  ok(B.cells[2].hp>.2,"«очередь» достраивает сама");
}));

TEST_SUITES.push(()=>suite("буря: угроза месту, а не людям",()=>{
  resetWorld();
  G.credits=500000;G.cargo.alloy=99;
  hireMgr(genMgr(41,["keep"]));
  const kp=mgrOf("keep");
  const p=G.sys.planets.find(x=>x.type!=="gas");
  foundBase(p);
  const B=baseAt(G.sx,G.sy,p.idx);
  B.type="desert";
  B.cells[1]={k:"solar",hp:1};
  const run=()=>{
    let hit=0;
    for(let i=0;i<600;i++){
      B.tMs=Date.now()+i;
      baseStorm(B,4);
      if(B.cells[1].hp<1){hit++;B.cells[1].hp=1;}
    }
    return hit;
  };
  kp.perks=[];
  ok(run()>0,"буря доходит до того, что стоит наверху");
  kp.perks=["storm"];
  eq(run(),0,"«буревой щит» не пускает её вовсе");
  /* газовому гиганту буря не грозит: базы там и не бывает */
  B.type="gas";kp.perks=[];
  eq(run(),0,"там, где не дует, бури нет");
}));

TEST_SUITES.push(()=>suite("фактор и командир: остальные оживлённые перки",()=>{
  resetWorld();
  G.credits=500000;
  hireMgr(genMgr(55,["fact"]));
  hireMgr(genMgr(77,["cmd"]));
  const fc=mgrOf("fact"),cmd=mgrOf("cmd");
  /* маршрут из двух плеч со станциями */
  const legs=[];
  for(let x=-3;x<=3&&legs.length<2;x++)for(let y=-3;y<=3&&legs.length<2;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s.station)legs.push(x+","+y);
  }
  ok(legs.length===2,"нашлись два плеча");
  fc.route=legs.slice();
  const [sx,sy]=legs[0].split(",").map(Number);
  const sys=getSystem(sx,sy);
  /* «монополия» поднимает цену на плече — это игрок чувствует кошельком */
  fc.perks=[];G.market={};
  const plain=marketFor(sys).iron;
  fc.perks=["mono"];G.market={};
  ok(marketFor(sys).iron>plain,"на плече маршрута цена держится выше");
  /* «сводка» показывает цены маршрута, не выходя из системы */
  fc.perks=[];
  ok(!/сводка по маршруту/.test(mgrDomainLine(fc)),"без перка сводки нет");
  fc.perks=["see"];
  ok(/сводка по маршруту/.test(mgrDomainLine(fc)),"с перком она появляется");
  /* «пороги» открывают два приказа, которых иначе нет в списке вовсе */
  const seen=()=>MGR_RULES.fact.filter(r=>!r.need||mgrPerk(fc,r.need)).map(r=>r.id);
  fc.perks=[];
  ok(seen().indexOf("buylow")<0,"без «порогов» приказов по цене не существует");
  fc.perks=["limit"];
  ok(seen().indexOf("buylow")>=0&&seen().indexOf("sellhi")>=0,"с ними — появляются оба");
  /* «обновление» перебирает ассортимент чаще */
  fc.perks=[];const slow=timeBucket();
  fc.perks=["stock"];
  ok(timeBucket()!==slow,"бакет ассортимента стал другим");
  /* «чёрный список» кладёт на станцию отдельную вещь */
  fc.perks=[];const n=stationParts(sys).length;
  fc.perks=["black"];const withBlack=stationParts(sys);
  eq(withBlack.length,n+1,"в продаже появилась ещё одна часть");
  ok(withBlack.some(o=>o.black),"и она помечена как пришедшая по связям");
  /* «переговорщик»: выкуп вдвое дешевле, и видно это заранее */
  cmd.perks=[];
  const full=Math.round(1000*(mgrPerkOf("cmd","ransom")?.5:1));
  cmd.perks=["ransom"];
  eq(Math.round(1000*(mgrPerkOf("cmd","ransom")?.5:1)),full/2,"выкуп вдвое дешевле");
  /* «охота» рисуется на карте, не роняя её */
  cmd.perks=["hunt"];
  G.mode="map";G.sel={x:G.sx,y:G.sy};
  drawMap();
  ok(true,"карта с метками пиратских баз рисуется");
  G.mode="system";
}));

/* ══ M111: батарея срезает шум, а не держит систему ══
   Сторож замысла: она строится (а не покупается), стоит в общем балансе
   мощности, берёт только залётную мелочь и НИЧЕГО не может сделать с бароном,
   охотником, ренегатом и соперником. */
TEST_SUITES.push(()=>suite("батарея: срезает шум, а не держит систему",()=>{
  resetWorld();
  ok(!!BUILD.battery,"батарея — отсек в разрезе базы, а не покупка");
  ok(BUILD.battery.power<0,"она ест энергию, а не даёт");
  ok(BUILD.battery.surfaceOnly,"стоит только наверху: бьёт с грунта");
  G.credits=500000;G.cargo.alloy=99;
  const p=G.sys.planets.find(x=>x.type!=="gas");
  foundBase(p);
  const B=baseAt(G.sx,G.sy,p.idx);
  const P0=basePower(B);
  B.cells[1]={k:"battery",hp:1};
  const P1=basePower(B);
  eq(P1.guns,1,"батарея посчитана");
  ok(P1.cons>P0.cons,"и легла в общий расход: оборона конкурирует с добычей");
  const Bt=battAt(G.sx,G.sy);
  ok(!!Bt&&Bt.n===1,"батарея видна из системы");
  /* кого она берёт и кого не берёт */
  ok(battTarget({rank:0,hull:5}),"залётный шакал — её работа");
  ok(!battTarget({rank:3,hull:5}),"барон ей не по зубам");
  ok(!battTarget({rank:0,hull:5,hunter:1}),"охотник — не её дело");
  ok(!battTarget({rank:0,hull:5,rogue:1}),"ренегат — не её дело");
  ok(!battTarget({rank:0,hull:5,rival:1}),"соперник — не её дело");
  /* мелочь она действительно снимает, барон при этом цел */
  const pl=Bt.p;
  const small={x:pl.x+200,y:pl.y,vx:0,vy:0,a:0,hull:40,hullMax:40,rank:0,seed:7,
               name:"Шакал",cool:0,aware:false};
  const baron={x:pl.x+220,y:pl.y,vx:0,vy:0,a:0,hull:400,hullMax:400,rank:3,seed:9,
               name:"Барон",cool:0,aware:false};
  G.pirates=[small,baron];G.battCool=0;G.battFx=[];
  for(let i=0;i<4000&&G.pirates.indexOf(small)>=0;i++)battTick(1);
  ok(G.pirates.indexOf(small)<0,"мелочь сбита");
  eq(baron.hull,400,"барон не поцарапан: систему батареей не удержать");
  /* без батареи она не стреляет вовсе */
  B.cells[1]=null;G.battCool=0;G.battFx=[];
  const h0=baron.hull;
  G.pirates=[{x:pl.x+200,y:pl.y,vx:0,vy:0,a:0,hull:40,hullMax:40,rank:0,seed:3,
              name:"Шакал",cool:0,aware:false}];
  for(let i=0;i<600;i++)battTick(1);
  eq(G.pirates.length,1,"без батареи никто не стреляет");
  eq(baron.hull,h0,"и барона это не касается");
  /* мёртвая батарея на грунте — место, которое отвечает куском отчёта */
  ok(POI_KINDS.some(k=>k.k==="battery"),"мёртвая батарея есть среди находок");
  ok(typeof drawDeadBattery==="function","и её есть чем нарисовать");
  ok(!!POI_FIND.battery&&typeof POI_FIND.battery.give==="function",
     "и есть чем ответить подошедшему");
}));
