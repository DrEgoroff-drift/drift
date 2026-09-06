/* ══════════════ живой рынок ══════════════ */
function marketFor(sys){
  const base=sys.station.prices;
  let m=G.market[sys.key];
  if(!m){m={pressure:{},t:G.t};G.market[sys.key]=m;}
  if(!m.ask)m.ask={};   /* наценка прилавка от ваших покупок (M289) — живёт в той же записи */
  const secs=Math.max(0,(G.t-m.t)/60);
  if(secs>0){
    const decay=Math.pow(.5,secs/10800);   /* давление держится часами, а не полчаса (M152e): дальше лететь выгоднее, чем туда-сюда */
    for(const k of TRADE_KEYS){m.pressure[k]=(m.pressure[k]||0)*decay;if(m.ask[k])m.ask[k]*=decay;}
    m.t=G.t;
  }
  const prices={},C=marketCtx(sys,m);
  for(const k of TRADE_KEYS)prices[k]=marketPriceCtx(sys,C,k,0);
  return prices;
}
/* множители станции, общие для всех товаров — считаются один раз на котировку */
function marketCtx(sys,m){
  const mul=stTypeOf(sys.station.stype).mkt;   /* торговый узел платит больше, аванпост — меньше */
  /* «Монополия» фактора: на плечах его маршрута цена держится выше — вы продаёте
     туда же, куда возит он, и это единственный перк, который игрок чувствует
     собственным кошельком, а не строчкой в сводке домена */
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  const onRoute=F&&!F.stalled&&mgrPerk(F,"mono")&&F.route.indexOf(sys.sx+","+sys.sy)>=0;
  const boost=onRoute?1.18:1;
  const N=(typeof needOf==="function")?needOf(sys):null;   /* нужда (M152e): ×2 на один привоз */
  return{m,mul,boost,N,occ:occPriceMul(sys.sx,sys.sy)};
}
/* цена одного товара; add — слагаемое к давлению ВНУТРИ clamp (аппетит станции,
   M290): складывается с давлением, а не множится поверх нужды и монополии,
   и потолок 1.8 остаётся потолком. Занятая система: скупщик один, и он знает,
   что деваться некуда */
function marketPriceCtx(sys,C,k,add){
  const base=sys.station.prices;
  return Math.max(1,Math.round(base[k]*C.mul*C.boost*(C.N&&C.N.k===k?NEED_MUL:1)*(typeof expPriceMul==="function"?expPriceMul(k):1)*C.occ*
                               /* шпион (M387): цены на этой станции врут по каждому
                                  товару в свою сторону — и врут обеим сторонам прилавка */
                               (typeof secSpyMul==="function"?secSpyMul(k,sys.sx,sys.sy):1)*
                               clamp(1+(C.m.pressure[k]||0)+(add||0),.4,1.8)));
}
function marketPrice(sys,k,add){
  marketFor(sys);   /* давление досчитано, запись есть */
  return marketPriceCtx(sys,marketCtx(sys,G.market[sys.key]),k,add);
}
/* ── взять товар с прилавка (M289) ──
   Станция продаёт дороже, чем берёт: BUY_SPREAD поверх её же закупочной цены,
   и каждая ваша покупка поднимает её ЗАПРОС (m.ask) — только цену взятия, не
   цену сдачи. Иначе «продал — купил — продал» у одного прилавка печатало бы
   деньги: сдача идёт по цене до продажи, а давление двигает обе стороны разом.
   Запрос — это и есть «цены растут» из брифа: там, откуда возят, дорожает. */
const BUY_SPREAD=1.06;
function buyPriceFor(sys,k){
  const p=marketFor(sys)[k],m=G.market[sys.key];
  /* у дешёвого товара наценка округлялась в ноль (6 → 6): взять всегда хотя бы на кредит дороже */
  return Math.max(p+1,Math.round(p*BUY_SPREAD*(1+((m&&m.ask&&m.ask[k])||0))));
}
function buyCargo(sys,k,qty){
  if(!RES[k]||TRADE_KEYS.indexOf(k)<0)return 0;
  const ask=buyPriceFor(sys,k);
  const free=stat().cargoMax-held();
  qty=Math.max(0,Math.min(qty|0,free,Math.floor(G.credits/Math.max(1,ask))));
  if(qty<=0)return 0;
  G.credits-=qty*ask;G.cargo[k]=(G.cargo[k]||0)+qty;
  const m=G.market[sys.key];
  m.ask[k]=Math.min(.35,(m.ask[k]||0)+qty*.005);
  /* и норма смены у этого же прилавка уменьшается на взятое: надбавка платится
     за привоз, а не за то, что товар обошёл вокруг стойки (M331, 12ab-hold) */
  appetiteBought(sys,k,qty);
  return qty;
}
function sellCargo(sys,k,qty){
  qty=Math.min(qty,G.cargo[k]);
  if(qty<=0)return 0;
  /* аппетит станции (M290): первые N в смену — с надбавкой, остальное по обычной.
     Котировка та же, что видел ряд трюма; съедается ровно то, что сдано */
  const Q=(typeof sellQuote==="function")?sellQuote(sys,k,qty):{revenue:qty*marketFor(sys)[k],nA:0,priceA:0,base:marketFor(sys)[k]};
  if(Q.nA&&typeof appetiteEat==="function")appetiteEat(sys,k,Q.nA);
  /* бункеры своих цехов (M291): берут по обычной цене, но с паем; давление вниз
     двигает только то, чего никто не съел */
  Q.nB=(typeof bldFeed==="function")?bldFeed(sys,k,qty-Q.nA):0;
  const revenue=Q.revenue;
  sellCargo.last=Q;
  const N=(typeof needOf==="function")?needOf(sys):null;   /* до закрытия: нужда ×2 в заработок маршрута не идёт (M289) */
  earn(revenue,"trade");G.cargo[k]-=qty;
  if(typeof routeEarn==="function")routeEarn(sys,k,qty,revenue,!!(N&&N.k===k));
  if(typeof needClose==="function")needClose(sys,k);   /* нужда закрыта этим привозом (M152e) */
  G.soldTotal=(G.soldTotal|0)+revenue;   // «пузырь» смотрит на выручку, а не на штуки
  if(typeof mayakSold==="function")mayakSold(sys,k,qty,revenue);   /* маяк: сдано за смену (M349) */
  const m=G.market[sys.key];
  m.pressure[k]=clamp((m.pressure[k]||0)-Math.max(0,qty-Q.nA-Q.nB)*.005,-.35,0);
  return revenue;
}
function sellDroneYield(sys,k,qty){
  const price=marketFor(sys)[k],revenue=qty*price;
  const m=G.market[sys.key];
  m.pressure[k]=clamp((m.pressure[k]||0)-qty*.005,-.35,0);
  return revenue;
}

/* ══════════════ дроны ══════════════ */
/* ── отозвать машину (M350): точка бездонная, домой дрон уходит только по приказу ── */
function droneRecall(d){
  const i=G.drones.indexOf(d);
  if(i<0)return false;
  G.drones.splice(i,1);G.droneInventory++;
  if(!G.droneIds)G.droneIds=[];
  if(G.droneIds.indexOf(d.id)<0)G.droneIds.push(d.id);
  logAdd("","Дрон "+droneName(d)+" отозван в трюм · "+(d.sold|0)+" "+RES[d.res].ru.toLowerCase()+" · "+(d.earned|0).toLocaleString("ru")+" кр за службу");
  return true;
}
/* окупаемость на этой руде, часов: цена машины против выработки в минуту по цене станции */
function dronePaybackH(price,rate){return rate>0?Math.round(DRONES.miner.price/(rate*price*60)*10)/10:0;}
/* прилавок (M350): дроны продают верфь и завод, по одной машине в двое суток на станцию */
function droneShopHas(sys){
  if(!sys||!sys.station)return false;
  const t=sys.station.stype;
  if(t!=="yard"&&t!=="indust")return false;
  if(!G.droneSold||typeof G.droneSold!=="object")G.droneSold={};
  return (G.droneSold[sys.key]|0)!==timeBucket();
}
function droneShopTake(sys){
  if(!droneShopHas(sys))return false;
  G.droneSold[sys.key]=timeBucket();
  return true;
}
/* ── где сдавать (M324) ──
   Дрон сдавал на ближайшую станцию, и это оставалось «на потом» с M237: редактор
   маршрутов был бы микроменеджментом. Владелец выбора — смотритель: с перком
   «авто-сбыт» и правилом «сдать там, где дороже» он смотрит на цены с вашего
   стола (G.seenPrices — то, что вы видели или слышали сами, мир за вас он не
   открывает), не дальше трёх секторов от точки, со скидкой 8% за сектор пути,
   и уводит дрона туда, если выходит хотя бы на десятую дороже. Решение держится
   сутки на дрона (d.mkt) и переживает сохранение вместе с ним; смена рынка —
   одна его реплика. Без смотрителя всё как было: ближайшая. */
function droneMarket(d){
  const near=nearestStation(d.sx,d.sy);
  if(!near)return null;
  const m=(typeof mgrOf==="function")?mgrOf("keep"):null;
  /* M350: дрон сам ищет, где дороже, в двух секторах; смотритель с «авто-сбытом» смотрит на три */
  const perk=!!(m&&!m.stalled&&mgrPerk(m,"sell")&&mgrRule(m,"sell"));
  const R=perk?3:2;
  const day=(typeof celDay==="function")?celDay():0;
  if(d.mkt&&d.mkt.day===day){const s=getSystem(d.mkt.sx,d.mkt.sy);if(s&&s.station)return s;}
  const seen=G.seenPrices||{};
  let best=near,bv=marketFor(near)[d.res]||1;
  for(const key in seen){
    const S=seen[key];if(!S||!S.p||S.p[d.res]==null)continue;
    const dist=Math.max(Math.abs(S.sx-d.sx),Math.abs(S.sy-d.sy));
    if(dist>R)continue;
    const v=S.p[d.res]*(1-.08*dist);
    if(v>bv*1.1){const s=getSystem(S.sx,S.sy);if(s&&s.station){bv=v;best=s;}}
  }
  const was=d.mkt&&d.mkt.key;
  d.mkt={key:best.key,sx:best.sx,sy:best.sy,name:best.station.name,day};
  if(perk&&best!==near&&was!==best.key)mgrSay(m,droneName(d)+" сдаёт на «"+best.station.name+"»: там дороже");
  return best;
}
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
    pool:-1,   /* бездонная точка (M350): старые записи с конечным пулом дорабатывают своё и возвращаются */
    soldAtMs:now,t0:now,lastMs:now,bornMs:now,
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
  /* ── блокада останавливает круги, и делала она это МОЛЧА ──
     Автор развернул в системе тринадцать машин, улетел, и потом сказал:
     «дроны никуда не летали, непонятно» (30.08.2026). Они и правда стояли —
     пираты закрыли систему, — но об этом не было сказано ни слова: доход
     просто переставал идти, а списка, где это видно, игрок не открывал.
     Теперь про остановку и про возвращение говорится один раз на СИСТЕМУ,
     а не на машину: тринадцать одинаковых строк — это не сообщение, а стена. */
  const stopped={},started={};
  for(let i=G.drones.length-1;i>=0;i--){
    const d=droneNormalize(G.drones[i],now);
    const key=d.sx+","+d.sy;
    /* под блокадой дрону некуда сдавать: круги стоят, время не копится */
    if(occLvl(d.sx,d.sy)>=2){
      d.lastMs=now;d.t0=now;
      if(!d.stuck){d.stuck=1;stopped[key]=(stopped[key]|0)+1;}
      continue;
    }
    if(d.stuck){d.stuck=0;started[key]=(started[key]|0)+1;}
    const T=droneTripMs(d);
    /* «Авто-сбыт» смотрителя: тот же множитель, что и был — быстрее оборот */
    const rate=d.rate*(mgrPerkOf("keep","sell")?1.35:1);
    const capMs=Math.max(0,Math.min(now-(d.lastMs||now),cap));
    const from=now-capMs;                 /* дальше суток не догоняем */
    if(d.t0<from)d.t0=from;
    if(d.down&&d.down<from)d.down=0;
    let guard=DRONE_MAX_CATCHUP,fixed=false,oldBreaks=0;
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
      const n=Math.floor(d.pool<0?d.carry:Math.min(d.pool,d.carry));
      if(n>0){
        const home=droneMarket(d)||nearestStation(d.sx,d.sy);   /* смотритель выбирает рынок (M324) */
        const rev=sellDroneYield(home,d.res,n);
        earn(rev,"drone");
        if(d.pool>=0)d.pool-=n;
        d.carry-=n;d.sold=(d.sold|0)+n;d.earned=(d.earned|0)+rev;
      }
      d.trips=(d.trips|0)+1;d.soldAtMs=done;
      if(d.pool===0){d.t0=done;break;}
      /* ломается дрон на разгрузке — у станции, где его и чинить */
      if(droneBreaks(d)){
        d.down=done+droneFixMs(d);
        /* поломка в догоне — не новость: при загрузке сейва после ночи цикл
           переигрывает десятки кругов, и каждая давняя поломка ложилась в
           журнал «warn» как свежая — тринадцать строк на второй секунде
           (телефон автора, crash.log 05.09). Живой строкой остаётся только
           та, что стоит сейчас; прочие считаются и называются одной */
        if(d.down>now)logAdd("warn","Дрон "+droneName(d)+" встал на «"+nearestStation(d.sx,d.sy).name+
          "» · чинится сам, "+Math.round(droneFixMs(d)/60000)+" мин");
        else oldBreaks++;
      }else d.t0=done;
    }
    if(oldBreaks>0)logAdd("dim","Дрон "+droneName(d)+" за простой вставал "+oldBreaks+" раз и чинился сам");
    else if(fixed&&!d.down&&d.pool>0)logAdd("dim","Дрон "+droneName(d)+" починился и вернулся на маршрут");
    if(d.pool===0){
      const hrs=Math.max(1,Math.round((now-(d.bornMs||now))/3600000));
      G.drones.splice(i,1);G.droneInventory++;
      if(typeof holdDeed==="function")holdDeed(d.sx,d.sy,"drone");   /* дело системы (M291) */
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
  for(const k in stopped){
    const p=k.split(",").map(Number),n=stopped[k];
    logAdd("warn","Блокада в системе «"+getSystem(p[0],p[1]).name+"»: "+n+" "+
      pl3(n,"дрон встал","дрона встали","дронов встали")+" · круги не идут, пока пираты там");
  }
  for(const k in started){
    const p=k.split(",").map(Number),n=started[k];
    logAdd("good","Система «"+getSystem(p[0],p[1]).name+"» открыта: "+n+" "+
      pl3(n,"дрон снова возит","дрона снова возят","дронов снова возят"));
  }
}
