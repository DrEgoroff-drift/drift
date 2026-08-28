/* ══════════════ живой рынок ══════════════ */
function marketFor(sys){
  const base=sys.station.prices;
  let m=G.market[sys.key];
  if(!m){m={pressure:{},t:G.t};G.market[sys.key]=m;}
  const secs=Math.max(0,(G.t-m.t)/60);
  if(secs>0){
    const decay=Math.pow(.5,secs/10800);   /* давление держится часами, а не полчаса (M152e): дальше лететь выгоднее, чем туда-сюда */
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
  const N=(typeof needOf==="function")?needOf(sys):null;   /* нужда (M152e): ×2 на один привоз */
  for(const k of TRADE_KEYS)
    /* занятая система: скупщик один, и он знает, что деваться некуда */
    prices[k]=Math.max(1,Math.round(base[k]*mul*boost*(N&&N.k===k?NEED_MUL:1)*(typeof expPriceMul==="function"?expPriceMul(k):1)*occPriceMul(sys.sx,sys.sy)*
                                    clamp(1+(m.pressure[k]||0),.4,1.8)));
  return prices;
}
function sellCargo(sys,k,qty){
  qty=Math.min(qty,G.cargo[k]);
  if(qty<=0)return 0;
  const price=marketFor(sys)[k],revenue=qty*price;
  earn(revenue,"trade");G.cargo[k]-=qty;
  if(typeof needClose==="function")needClose(sys,k);   /* нужда закрыта этим привозом (M152e) */
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
/* ── сколько дрон возьмёт с точки ──
   Пул был один на все ресурсы (260 штук), а цены разнятся вдевятеро: дрон на
   кристаллах возвращал двенадцать своих цен, дрон на железе — полторы. Точка
   теперь меряется не штуками, а тем, сколько в ней стоит: пул обратен КОРНЮ
   цены. Дорогое сырьё по-прежнему выгоднее (вдвое-втрое, а не вдевятеро) и
   вырабатывается втрое быстрее — выбор остаётся выбором, а не единственно
   верным ходом. */
function droneCapacity(k){
  const p=Math.max(1,RES[k]?RES[k].price:11);
  return clamp(Math.round(1200/Math.sqrt(p)),90,420);
}
let droneTarget=null;
function deployDrone(){
  if(G.droneInventory<=0||!droneTarget)return;
  G.droneInventory--;
  /* адрес точки, а не только системы (M237): дрону теперь есть откуда лететь.
     На грунте это планета, в поясе — кольцо (pi=-1). Без адреса рейса нет. */
  const pi=(G.mode==="surface"&&G.surf&&G.surf.p)?(G.surf.p.idx|0):
           (G.mode==="dig"&&G.dig&&G.dig.p)?(G.dig.p.idx|0):-1;
  const now=Date.now();
  const d={id:droneNextId(),sx:G.sx,sy:G.sy,pi,res:droneTarget,
    rate:DRONES.miner.ratePerMin*stat().droneRate,
    pool:droneCapacity(droneTarget),soldAtMs:now,t0:now,lastMs:now,bornMs:now,
    trips:0,down:0,sold:0,earned:0};
  G.drones.push(d);
  say("Дрон "+droneName(d)+" размещён\nработает на "+RES[droneTarget].ru);
  logAdd("","Дрон "+droneName(d)+" развёрнут в системе "+G.sys.name+" · "+RES[droneTarget].ru.toLowerCase());
  document.getElementById("dronebtn").style.display="none";
}
/* ── такт дронов: рейсами, а не ручейком (M237) ──
   Раньше такт брал прошедшее время и превращал его в деньги и в строку журнала
   прямо здесь — по строке на каждую сдачу, отчего БОРТ и превращался в ленту
   «Дрон сдал 1 титан». Теперь единица работы — КРУГ: дрон грузится, идёт,
   разгружается, идёт обратно. Деньги приходят на разгрузке, доход за час тот
   же (груз круга = rate × длительность круга), а журнал молчит до тех пор,
   пока не случится то, о чём стоит рассказать: точка кончилась, дрон встал,
   дрон починился. Догон офлайна — тот же ленивый расчёт по Date.now(). */
function tickDrones(){
  const now=Date.now(),cap=24*3600*1000;
  for(let i=G.drones.length-1;i>=0;i--){
    const d=droneNormalize(G.drones[i],now);
    /* под блокадой дрону некуда сдавать: круги стоят, время не копится */
    if(occLvl(d.sx,d.sy)>=2){d.lastMs=now;d.t0=now;continue;}
    const T=droneTripMs(d);
    /* «Авто-сбыт» смотрителя: тот же множитель, что и был — быстрее оборот */
    const rate=d.rate*(mgrPerkOf("keep","sell")?1.35:1);
    const capMs=Math.max(0,Math.min(now-(d.lastMs||now),cap));
    const from=now-capMs;                 /* дальше суток не догоняем */
    if(d.t0<from)d.t0=from;
    if(d.down&&d.down<from)d.down=0;
    let guard=DRONE_MAX_CATCHUP,fixed=false;
    while(guard-->0){
      if(d.down){
        if(d.down>now)break;              /* ещё стоит в доке */
        d.t0=d.down;d.down=0;fixed=true;  /* починился сам и пошёл дальше */
      }
      const done=d.t0+T;
      if(done>now)break;                  /* круг ещё в пути */
      /* разгрузка: груз круга уходит на станцию, деньги приходят разом.
         Бункер дробный: на коротком круге дрон выносит меньше штуки, и
         округление вниз съело бы весь доход — руда лежит в нём, пока не
         наберётся на единицу. Так час работы стоит ровно столько же, сколько
         стоил при ручейке, и ни кредитом меньше. */
      d.carry=(d.carry||0)+rate*T/60000;
      const n=Math.floor(Math.min(d.pool,d.carry));
      if(n>0){
        const home=nearestStation(d.sx,d.sy);
        const rev=sellDroneYield(home,d.res,n);
        earn(rev,"drone");
        d.pool-=n;d.carry-=n;d.sold=(d.sold|0)+n;d.earned=(d.earned|0)+rev;
      }
      d.trips=(d.trips|0)+1;d.soldAtMs=done;
      if(d.pool<=0){d.t0=done;break;}
      /* ломается дрон на разгрузке — у станции, где его и чинить */
      if(droneBreaks(d)){
        d.down=done+droneFixMs(d);
        logAdd("warn","Дрон "+droneName(d)+" встал на «"+nearestStation(d.sx,d.sy).name+
          "» · чинится сам, "+Math.round(droneFixMs(d)/60000)+" мин");
      }else d.t0=done;
    }
    if(fixed&&!d.down&&d.pool>0)logAdd("dim","Дрон "+droneName(d)+" починился и вернулся на маршрут");
    if(d.pool<=0){
      const hrs=Math.max(1,Math.round((now-(d.bornMs||now))/3600000));
      G.drones.splice(i,1);G.droneInventory++;
      logAdd("money","Дрон "+droneName(d)+" выработал точку: "+(d.sold|0)+" "+
        RES[d.res].ru.toLowerCase()+" · "+(d.earned|0).toLocaleString("ru")+" кр за "+hrs+" ч");
      say("Дрон "+droneName(d)+" вернулся в трюм\nточка выработана · "+
        (d.earned|0).toLocaleString("ru")+" кр");
      /* номер остаётся за машиной, даже когда она в трюме */
      if(!G.droneIds)G.droneIds=[];
      if(G.droneIds.indexOf(d.id)<0)G.droneIds.push(d.id);
    }
    d.lastMs=now;
  }
}
