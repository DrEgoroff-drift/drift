/* Регрессии проверки выпуска: оплаченная тяга и груз между сеансами. */
suite("проверка выпуска: топливо и груз узла",{tier:"node"},()=>{
  resetWorld();
  G.fuel=50;G.energy=100;
  const c=ctlReset();Object.assign(c,{assist:true,ax:-1,ay:0,head:null,turn:0,brake:false});
  Object.assign(G.ship,{a:0,vx:0,vy:0});
  helmApply(1,stat(),G.ship,10);
  ok(G.ship.vx<0,"стик разгоняет назад");
  ok(G.fuel<50,"разгон назад расходует топливо");
  G.pnode={key:"0,0/0",sx:0,sy:0,idx:0,name:"узел",res:["iron"],stock:{iron:20},made:now(),last:now(),hauled:0,calls:1};
  G.barges=[{pload:{iron:7}}];
  const s=JSON.parse(JSON.stringify(snapshot()));
  eq(s.pnode.stock.iron,27,"неснятый груз переживает сохранение");
  eq(G.pnode.stock.iron,20,"сохранение не меняет живой склад");
  eq(G.barges[0].pload.iron,7,"сохранение не забирает груз у живой баржи");
  applySave(s);
  eq(G.pnode.stock.iron,27,"груз восстановлен без потери");
  eq(G.barges.length,0,"старый борт не удваивает восстановленный груз");
  eq(snapshot().pnode.stock.iron,27,"повторная запись не создаёт груз");
});

suite("проверка выпуска: маршрут и залог",{tier:"node"},()=>{
  resetWorld();
  const stations=[];
  for(let x=-8;x<=8&&stations.length<3;x++)for(let y=-8;y<=8&&stations.length<3;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);if(s.station)stations.push(s);
  }
  eq(stations.length,3,"найдены три настоящие станции");
  G.trade=routeInit();G.trade.legs=stations.map(s=>s.key);
  for(let i=0;i<6;i++){
    const target=stations[i%3],next=routeNext();
    eq(next.key,target.key,"следующая станция совпадает с курсором "+i);
    eq(next.inLeg.to.key,target.key,"входящее плечо ведёт туда же");
    routeVisit(target);
  }
  eq(G.trade.loops,2,"два круга без пропуска станции");
  const p=packPart(genPart(731,2));
  lockerRec().items=[{p}];lockerHandOver();
  lockerRec().items=[{p}];lockerHandOver();
  const pawn=fleaRec().pawn;
  eq(pawn.length,2,"два захода сохраняют обе части");
  ok(pawn[0].k!==pawn[1].k,"повторный залог получает отдельный номер");
  G.storyPin.pad_taken="0,0/0";
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(!G.storyPin.pad_taken,"старый планетный адрес слуха освобождён");
});

suite("проверка выпуска: смены базы",{tier:"node"},()=>{
  resetWorld();
  const make=()=>({sx:0,sy:0,idx:0,name:"проверка",type:"rocky",res:["iron"],
    cells:[{k:"lyse",hp:1},{k:"melter",hp:1},{k:"garden",hp:1,sown:1},{k:"vat",hp:1}],
    pool:{ice:400,organics:200},life:{air:LIFE_CAP,water:LIFE_CAP,food:LIFE_CAP,q:"good"},park:0});
  const c=genMerc(731);c.order={kind:"base",sx:0,sy:0,idx:0};c.role="gardener";G.crew=[c];
  const A=make(),B=make(),P={eff:.6};
  baseLifeBulk(A,P,20,120);
  for(let n=101;n<=120;n++){baseLifeStep(B,P,n,true);baseWearStep(B,n);}
  eq(A.life.food,B.life.food,"харч при полном баке считается по сменам");
  eq(A.life.water,B.life.water,"оранжерея пьёт воду своей смены");
  eq(A.pool.ice,B.pool.ice,"половинная мощность не тратит лишний лёд");
  eq(A.pool.organics,B.pool.organics,"белковый бак не ест будущие смены");
  eq(A.life.q,B.life.q,"вкус еды сохранён");
  ok(A.life.food>0,"работающий пищевой цех не оставил полный склад пустым");
  G.crew=[];
  const C=make();C.cells=[];C.t0=baseShift()-BASE_CAP_SH-100;
  eq(baseResolve(C),BASE_CAP_SH,"долгое отсутствие ограничено сутками");
  eq(baseResolve(C),0,"повторный вход не начисляет отброшенный хвост");
});

suite("проверка выпуска: баржа и размер догона",{tier:"node"},()=>{
  resetWorld();
  let same=true;
  for(let seed=0;seed<250;seed++){
    const make=()=>({seed,name:"проверка",cargo:{},barge:{legs:["0,0"],cursor:0,t0:now(),fed:0}});
    const a=make(),b=make(),t=now();
    if(bargePilotQ(a).rate<=1)continue;
    bargeTick(a,t+24*HOLD_SHIFT);
    for(let n=1;n<=24;n++)bargeTick(b,t+n*HOLD_SHIFT);
    if(a.barge.cursor!==b.barge.cursor)same=false;
  }
  ok(same,"частые входы не меняют число пройденных плеч");
});
