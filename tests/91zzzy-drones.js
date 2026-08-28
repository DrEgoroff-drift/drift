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
