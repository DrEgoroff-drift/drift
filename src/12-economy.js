/* ══════════════ живой рынок ══════════════ */
function marketFor(sys){
  const base=sys.station.prices;
  let m=G.market[sys.key];
  if(!m){m={pressure:{},t:G.t};G.market[sys.key]=m;}
  const secs=Math.max(0,(G.t-m.t)/60);
  if(secs>0){
    const decay=Math.pow(.5,secs/1800);
    for(const k of TRADE_KEYS)m.pressure[k]=(m.pressure[k]||0)*decay;
    m.t=G.t;
  }
  const prices={},mul=stTypeOf(sys.station.stype).mkt;   /* торговый узел платит больше, аванпост — меньше */
  /* «Монополия» фактора: на плечах его маршрута цена держится выше — вы продаёте
     туда же, куда возит он, и это единственный перк, который игрок чувствует
     собственным кошельком, а не строчкой в сводке домена */
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  const onRoute=F&&!F.stalled&&mgrPerk(F,"mono")&&F.route.indexOf(sys.sx+","+sys.sy)>=0;
  const boost=onRoute?1.18:1;
  for(const k of TRADE_KEYS)
    prices[k]=Math.max(1,Math.round(base[k]*mul*boost*clamp(1+(m.pressure[k]||0),.4,1.8)));
  return prices;
}
function sellCargo(sys,k,qty){
  qty=Math.min(qty,G.cargo[k]);
  if(qty<=0)return 0;
  const price=marketFor(sys)[k],revenue=qty*price;
  G.credits+=revenue;G.cargo[k]-=qty;
  G.soldTotal=(G.soldTotal|0)+revenue;   // «пузырь» смотрит на выручку, а не на штуки
  const m=G.market[sys.key];
  m.pressure[k]=clamp((m.pressure[k]||0)-qty*.005,-.35,0);
  return revenue;
}
function sellDroneYield(sys,k,qty){
  const price=marketFor(sys)[k],revenue=qty*price;
  const m=G.market[sys.key];
  m.pressure[k]=clamp((m.pressure[k]||0)-qty*.005,-.35,0);
  return revenue;
}

/* ══════════════ дроны ══════════════ */
function nearestStation(sx,sy){
  for(let rad=0;rad<=24;rad++){
    let best=null,bd=1e9;
    for(let dx=-rad;dx<=rad;dx++)for(let dy=-rad;dy<=rad;dy++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==rad)continue;
      const gx=sx+dx,gy=sy+dy;
      if(!starAt(gx,gy))continue;
      const s=getSystem(gx,gy);
      if(!s.station)continue;
      const d=Math.hypot(dx,dy);
      if(d<bd){bd=d;best=s;}
    }
    if(best)return best;
  }
  return getSystem(0,0);
}
let droneTarget=null;
function deployDrone(){
  if(G.droneInventory<=0||!droneTarget)return;
  G.droneInventory--;
  G.drones.push({sx:G.sx,sy:G.sy,res:droneTarget,rate:DRONES.miner.ratePerMin*stat().droneRate,
    pool:DRONES.miner.capacity,soldAtMs:Date.now()});
  say("Дрон размещён\nработает на "+RES[droneTarget].ru);
  logAdd("","Дрон развёрнут в системе "+G.sys.name+" · "+RES[droneTarget].ru.toLowerCase());
  document.getElementById("dronebtn").style.display="none";
}
function tickDrones(){
  const now=Date.now(),cap=24*3600*1000;
  for(let i=G.drones.length-1;i>=0;i--){
    const d=G.drones[i];
    const elapsedMs=Math.min(Math.max(0,now-d.soldAtMs),cap);
    /* «Авто-сбыт» смотрителя: дрон не ждёт полного трюма, а сдаёт по мере
       выработки — быстрее оборот и меньше потерь, если точка кончится раньше */
    const rate=d.rate*(mgrPerkOf("keep","sell")?1.35:1);
    const yieldN=Math.floor(Math.min(d.pool,rate*elapsedMs/60000));
    if(yieldN>0){
      const home=nearestStation(d.sx,d.sy);
      const rev=sellDroneYield(home,d.res,yieldN);
      G.credits+=rev;d.pool-=yieldN;d.soldAtMs=now;
      say("Дрон продал "+yieldN+" "+RES[d.res].ru.toLowerCase()+" на «"+home.name+"»\n+"+rev.toLocaleString("ru")+" кр");
      logAdd("money","Дрон сдал "+yieldN+" "+RES[d.res].ru.toLowerCase()+" на «"+home.name+
        "» · +"+rev.toLocaleString("ru")+" кр");
    }
    if(d.pool<=0){
      G.drones.splice(i,1);G.droneInventory++;
      logAdd("dim","Точка выработана, дрон вернулся в трюм");
    }
  }
}
