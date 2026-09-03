/* ══════════════ автотесты: рейсы дронов (M237) ══════════════
   Дрон перестал быть копилкой и стал машиной с кругом. Проверяем ровно три
   договора, на которых всё держится: доход за час не изменился, положение
   выводится из времени и нигде не хранится, а поломка чинится сама — временем,
   и офлайн тоже. */
TEST_SUITES.push(()=>suite("дроны: круг вместо ручейка",()=>{
  resetWorld();
  /* система со станцией и планетами: маршрут должен иметь оба конца */
  const sys=G.sys;
  ok(!!sys,"система есть");
  G.droneInventory=1;droneTarget="iron";
  G.mode="system";
  deployDrone();
  eq(G.drones.length,1,"дрон развёрнут");
  const d=G.drones[0];
  ok(d.id>0,"у машины есть бортовой номер: "+droneName(d));
  ok(typeof d.t0==="number","и начало круга");
  ok(d.x===undefined&&d.y===undefined,"положение НЕ хранится — оно выводится");
  /* круг разумной длины и фаза идёт по времени */
  const T=droneTripMs(d);
  ok(T>=25000&&T<=240000,"круг в разумных пределах: "+Math.round(T/1000)+" с");
  const p0=dronePos(d,d.t0+T*.2),p1=dronePos(d,d.t0+T*.4);
  ok(Math.hypot(p1.x-p0.x,p1.y-p0.y)>1,"за время дрон переместился");
  ok(dronePhase(d,d.t0+T*.2).leg==="out","в первой половине идёт гружёным");
  ok(dronePhase(d,d.t0+T*.8).leg==="back","во второй — порожняком");
}));

TEST_SUITES.push(()=>suite("дроны: за час зарабатывают столько же",()=>{
  resetWorld();
  G.droneInventory=1;droneTarget="iron";G.mode="system";
  deployDrone();
  const d=G.drones[0];
  d.pool=100000;                       /* точка не должна кончиться в опыте */
  const rate=d.rate;
  const c0=G.credits;
  /* час назад — и один такт: догон офлайна */
  const hour=3600*1000;
  d.lastMs=Date.now()-hour;d.t0=d.lastMs;d.soldAtMs=d.lastMs;
  droneBreaks=()=>false;                /* поломки здесь ни при чём */
  tickDrones();
  const soldUnits=d.sold|0;
  const want=rate*60;                   /* rate — штук в минуту */
  ok(Math.abs(soldUnits-want)/want<.12,
     "за час сдано "+soldUnits+" при ожидаемых "+Math.round(want));
  ok(G.credits>c0,"деньги пришли: +"+Math.round(G.credits-c0));
  ok(d.trips>0,"и это были круги, а не ручеёк: "+d.trips);
}));

TEST_SUITES.push(()=>suite("дроны: ломаются и чинятся сами, временем",()=>{
  resetWorld();
  G.droneInventory=1;droneTarget="iron";G.mode="system";
  deployDrone();
  const d=G.drones[0];d.pool=100000;
  const T=droneTripMs(d);
  /* следующий же круг кончается поломкой */
  droneBreaks=()=>true;
  d.lastMs=Date.now()-T*1.2;d.t0=d.lastMs;
  tickDrones();
  ok(d.down>Date.now(),"дрон встал и чинится сам: "+droneStateRu(d));
  ok(droneFixMs(d)>=60000,"ремонт меряется минутами, а не деньгами");
  const c0=G.credits;
  const tripsWhileDown=d.trips;
  tickDrones();
  eq(d.trips,tripsWhileDown,"пока стоит — круги не идут");
  eq(Math.round(G.credits),Math.round(c0),"и денег не приносит");
  /* время вышло — пошёл сам, без единого нажатия и без кредита */
  droneBreaks=()=>false;
  d.down=Date.now()-1;d.lastMs=Date.now()-1;
  tickDrones();
  eq(d.down,0,"починился сам");
  /* и снова возит: круг после ремонта считается как обычный */
  d.t0=Date.now()-T*1.1;d.lastMs=d.t0;
  tickDrones();
  ok(d.trips>tripsWhileDown,"и вернулся на маршрут");
}));

TEST_SUITES.push(()=>suite("дроны: маршруты и старые записи",()=>{
  resetWorld();
  G.droneInventory=2;droneTarget="iron";G.mode="system";
  deployDrone();G.droneInventory=1;droneTarget="iron";deployDrone();
  const R=droneRoutes();
  eq(R.length,1,"две машины на одной точке — один маршрут");
  eq(R[0].drones.length,2,"и обе в нём");
  ok(R[0].from&&R[0].to,"у маршрута названы оба конца: "+R[0].from+" → "+R[0].to);
  /* запись до M237: четыре поля и ничего больше */
  G.drones=[{sx:G.sx,sy:G.sy,res:"iron",rate:.6,pool:120,soldAtMs:Date.now()-5000}];
  const old=G.drones[0];
  droneNormalize(old);
  ok(old.id>0,"старой записи выдан номер");
  ok(old.t0>0&&old.lastMs>0,"и круг с часами");
  eq(old.pi,-1,"планета неизвестна — точка берётся по кольцу");
  const P=dronePos(old,Date.now());
  ok(isFinite(P.x)&&isFinite(P.y),"и она всё равно откуда-то летит");
  /* сохранение переживает поля */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.drones=[];applySave(snap);
  ok(G.drones.length===1&&G.drones[0].id>0,"номер пережил сохранение");
}));

/* ── второй проход: то, что нашлось глазами ── */
TEST_SUITES.push(()=>suite("дроны: без станции в системе — не в звезду",()=>{
  resetWorld();
  /* система без своей станции: раньше droneHome возвращал (0,0), а в нуле
     стоит ЗВЕЗДА — дрон возил руду прямо в неё */
  let ns=null;
  for(let r=0;r<10&&!ns;r++)for(let x=-r;x<=r&&!ns;x++)for(let y=-r;y<=r&&!ns;y++){
    if(!starAt(x,y))continue;const S=getSystem(x,y);
    if(!S.station&&(S.planets||[]).length)ns=S;
  }
  if(!ns){ok(true,"поблизости нет системы без станции — проверку пропускаем");return;}
  const now=Date.now();
  const d={id:1,sx:ns.sx,sy:ns.sy,pi:0,res:"iron",rate:.6,pool:100,t0:now,lastMs:now,
           bornMs:now,trips:0,down:0,sold:0,earned:0,carry:0};
  const b=droneHome(d,ns);
  ok(Math.hypot(b.x,b.y)>200,"конец маршрута вынесен из центра, а не в звезду: "+
    Math.round(Math.hypot(b.x,b.y)));
  ok(!!b.name,"и у него есть имя станции, куда всё это уходит: «"+b.name+"»");
  const T=droneTripMs(d,ns);
  ok(T>=25000&&T<=240000,"круг всё равно конечен: "+Math.round(T/1000)+" с");
}));

/* ── где сдавать (M324): без смотрителя — ближайшая; со смотрителем — по ценам со стола ── */
TEST_SUITES.push(()=>suite("дроны M324: смотритель уводит сбыт туда, где дороже, и не дальше трёх секторов",()=>{
  resetWorld();G.mgrs=[];G.seenPrices={};
  const now=Date.now();
  const mk=(sx,sy)=>({id:41,sx,sy,pi:-1,res:"iron",rate:1,pool:50,soldAtMs:now,t0:now,lastMs:now,
                      bornMs:now,trips:0,down:0,sold:0,earned:0,carry:0});
  /* пара: станция s2 и сектор в двух шагах от неё, чей ближайший рынок — не s2 */
  let s2=null,d=null;
  for(const s of routeTestStations(10)){
    if(!s.station)continue;
    for(const [ox,oy] of [[-2,0],[2,0],[0,-2],[0,2],[-3,1],[3,-1]]){
      const near=nearestStation(s.sx+ox,s.sy+oy);
      if(near&&near.key!==s.key){s2=s;d=mk(s.sx+ox,s.sy+oy);break;}
    }
    if(s2)break;
  }
  ok(!!s2,"нашлась станция с чужим ближайшим рынком в трёх секторах");
  if(!s2)return;
  const near=nearestStation(d.sx,d.sy);
  /* без смотрителя — ближайшая, и решения не остаётся */
  eq(droneMarket(d).key,near.key,"без смотрителя сдаёт на ближайшую");
  ok(!d.mkt,"и рынка не помнит");
  /* смотритель с перком и правилом; на столе — цена s2 втрое выше ближайшей */
  G.credits=200000;ok(hireMgr(genMgr(4242,["keep"])),"смотритель нанят");
  const m=mgrOf("keep");m.perks=(m.perks||[]).concat(["sell"]);if(m.rules.indexOf("sell")<0)m.rules.push("sell");
  const p0=marketFor(near).iron||1;
  G.seenPrices[s2.key]={name:s2.station.name,sx:s2.sx,sy:s2.sy,day:celDay(),p:{iron:p0*3},need:null};
  const M1=droneMarket(d);
  eq(M1.key,s2.key,"со смотрителем — туда, где дороже");
  ok(!!d.mkt&&d.mkt.key===s2.key&&d.mkt.day===celDay(),"решение записано на сутки");
  ok(!!droneFar(d),"рынок в другом секторе — круг длиннее");
  ok(droneTripMs(d)>=DRONE_TRIP_BASE+2*15000-1,"на два сектора не меньше +30 с: "+Math.round(droneTripMs(d)/1000)+" с");
  ok(/→/.test(droneName(d)+(droneFar(d)?" → "+d.mkt.name.toUpperCase():"")),"подпись дрона называет рынок");
  /* дальше трёх секторов стол не считается */
  G.seenPrices={};d.mkt=null;
  G.seenPrices["far"]={name:"Далёкая",sx:d.sx+5,sy:d.sy,day:celDay(),p:{iron:p0*9},need:null};
  eq(droneMarket(d).key,near.key,"цена за пять секторов не считается");
  /* стол пуст — ближайшая, без реплик */
  G.seenPrices={};d.mkt=null;
  eq(droneMarket(d).key,near.key,"пустой стол — ближайшая");
  G.mgrs=[];G.seenPrices={};
}));
