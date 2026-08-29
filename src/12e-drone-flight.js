/* ══════════════ дроны летают ══════════════
   До M237 дрон был не машиной, а копилкой: `{sx,sy,res,rate,pool}` — система,
   ресурс и число. У него не было ни места, ни пути, ни рейса, и такт раз в три
   секунды прямо превращал «сколько натикало» в деньги и в строку журнала.
   Отсюда обе беды разом: в кадре смотреть не на что, а БОРТ забит полусотней
   «Дрон сдал 1 титан · +51 кр» (автор прислал скрин с 54 непрочитанными).

   Теперь дрон возит КРУГАМИ: грузится на точке → идёт на станцию → разгружается
   → идёт обратно. Деньги приходят на разгрузке, а не ручейком; сумма за час та
   же, но у платежа появились место и миг — и летящая точка стала осмысленной.

   ГЛАВНОЕ ПРАВИЛО: положение не хранится, а ВЫВОДИТСЯ из времени. В сейве
   лежат только начало круга и часы ремонта; кадр ничего не симулирует, офлайн
   считается лениво тем же тактом, что и вся фоновая жизнь (12-economy). */

/* Круг: базовые сорок секунд плюс расстояние. Реальные минуты, а не игровые —
   дрон работает и когда игра закрыта, и это его главное свойство. */
const DRONE_TRIP_BASE=40000, DRONE_TRIP_PER_KM=26;
/* Поломка: шанс на круг. Растёт с опасностью сектора и с налётанными кругами —
   тот же износ, что у корпуса, только считается рейсами, а не кадрами. */
const DRONE_BREAK_P=.015, DRONE_BREAK_WEAR=.00002;
/* Ремонт: время, а не деньги. Восемь минут в тихом секторе, до двадцати в глуши;
   на Верфи вдвое быстрее — станции уже различаются, и пусть различаются здесь. */
const DRONE_FIX_MS=8*60000, DRONE_FIX_FAR=12*60000;
/* Сколько кругов такт готов доработать за один вызов: сутки офлайна на коротком
   круге — это полторы тысячи, и это нормально; но бесконечным цикл быть не может */
const DRONE_MAX_CATCHUP=3000;

/* ── бортовой номер ──
   Он даётся раз и навсегда, при покупке, и остаётся за дроном, даже когда тот
   вернулся в трюм: «Д-7» — это машина, а не строка списка. */
function droneNextId(){
  let mx=0;
  for(const d of G.drones||[])if((d.id|0)>mx)mx=d.id|0;
  for(const id of G.droneIds||[])if((id|0)>mx)mx=id|0;
  return mx+1;
}
function droneName(d){return "Д-"+(d&&d.id?d.id:"?");}

/* ── старые записи ──
   Сохранения до M237 знают про дрон четыре поля. Недостающее дописывается при
   загрузке и при первом же такте: круг начинается сейчас, номер выдаётся по
   порядку, планета неизвестна — тогда точка берётся по кругу орбиты. */
function droneNormalize(d,now){
  now=now||Date.now();
  if(d.id==null)d.id=droneNextId();
  if(typeof d.pi!=="number")d.pi=-1;
  if(!d.t0)d.t0=d.soldAtMs||now;
  if(!d.lastMs)d.lastMs=d.soldAtMs||now;
  if(!d.trips)d.trips=0;
  if(!d.down)d.down=0;
  if(!d.sold)d.sold=0;
  if(!d.carry)d.carry=0;
  if(!d.earned)d.earned=0;
  if(!d.bornMs)d.bornMs=d.t0;
  return d;
}
/* ── концы маршрута ──
   Оба конца ЖИВЫЕ: планета идёт по орбите (06a-celest), станция стоит на своей.
   Поэтому линия рейса сама изгибается день ото дня, и рисовать её отдельно как
   «маршрут» не нужно — она и есть положение двух тел. */
function droneSys(d){
  return (d.sx===G.sx&&d.sy===G.sy)?G.sys:getSystem(d.sx,d.sy);
}
function dronePoint(d,sys){
  sys=sys||droneSys(d);
  const P=sys.planets||[];
  if(d.pi>=0&&P[d.pi])return {x:P[d.pi].x,y:P[d.pi].y};
  /* пояс и старые записи: точка на кольце, своя у каждого дрона и постоянная */
  const a=((d.id||1)*2.399)%TAU, r=(sys.belt&&sys.belt.orbit)||900;
  return {x:Math.cos(a)*r,y:Math.sin(a)*r};
}
function droneHome(d,sys){
  sys=sys||droneSys(d);
  if(sys.station)return {x:sys.station.x,y:sys.station.y,name:sys.station.name};
  const h=nearestStation(d.sx,d.sy);
  /* ── станции в этой системе нет ──
     Возвращать (0,0) было нельзя: в нуле стоит ЗВЕЗДА, и дрон возил руду прямо
     в неё (второй проход, поймано глазами). Он уходит за край системы в ту
     сторону, где станция на самом деле, — и это читается как «ушёл к соседям». */
  const ang=Math.atan2((h?h.sy:0)-d.sy,(h?h.sx:0)-d.sx);
  const r=(((sys.belt&&sys.belt.orbit)||1400)*1.35);
  return {x:Math.cos(ang)*r,y:Math.sin(ang)*r,name:h?h.name:"—"};
}
/* Длина круга: туда и обратно по нынешнему положению концов. Считается на месте
   и не сохраняется — концы ведь движутся. */
function droneTripMs(d,sys){
  sys=sys||droneSys(d);
  const a=dronePoint(d,sys),b=droneHome(d,sys);
  const dist=Math.hypot(b.x-a.x,b.y-a.y);
  const mul=(typeof stat==="function"&&stat().droneRate)?1/clamp(stat().droneRate,.5,3):1;
  return clamp(DRONE_TRIP_BASE+dist*DRONE_TRIP_PER_KM*mul,25000,240000);
}
/* ── фаза круга ──
   0…1 по кругу: 0—.08 грузится на точке, .08—.46 идёт гружёным, .46—.54 стоит
   под разгрузкой, дальше идёт порожняком. Всё, что рисуется, берётся отсюда. */
function dronePhase(d,now){
  now=now||Date.now();
  if(d.down)return {leg:"fix",t:1};
  const T=droneTripMs(d);
  const ph=clamp(((now-(d.t0||now))%T)/T,0,1);
  if(ph<.08)return {leg:"load",t:ph/.08};
  if(ph<.46)return {leg:"out",t:(ph-.08)/.38};
  if(ph<.54)return {leg:"drop",t:(ph-.46)/.08};
  return {leg:"back",t:(ph-.54)/.46};
}
/* Где он сейчас: мировая точка. Дуга, а не прямая — гружёный поднимается «в
   гору», порожний спускается; кривизна от длины плеча. */
function dronePos(d,now,sys){
  sys=sys||droneSys(d);
  const a=dronePoint(d,sys),b=droneHome(d,sys);
  const P=dronePhase(d,now);
  let t=0,loaded=true;
  if(P.leg==="load"){t=0;}
  else if(P.leg==="out"){t=P.t;}
  else if(P.leg==="drop"||P.leg==="fix"){t=1;loaded=false;}
  else {t=1-P.t;loaded=false;}
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  /* горб дуги — перпендикуляр к плечу, десятая часть его длины */
  const bow=len*.10;
  const cx=mx-dy/len*bow, cy=my+dx/len*bow;
  const u=1-t;
  return {x:u*u*a.x+2*u*t*cx+t*t*b.x, y:u*u*a.y+2*u*t*cy+t*t*b.y, loaded, leg:P.leg};
}
/* ── поломка ──
   Отдельной функцией, потому что её подменяют тесты: договор проверяется, а не
   случайность. Ломается дрон на РАЗГРУЗКЕ — то есть у станции, где и стоит
   потом в доке: чинить его посреди пустоты было бы некому. */
function droneBreakP(d){
  const dg=(typeof sysDanger==="function")?sysDanger(d.sx,d.sy):0;
  return clamp(DRONE_BREAK_P*(1+dg*1.6)+(d.trips|0)*DRONE_BREAK_WEAR,0,.2);
}
function droneBreaks(d){return Math.random()<droneBreakP(d);}
function droneFixMs(d){
  const dg=(typeof sysDanger==="function")?sysDanger(d.sx,d.sy):0;
  let ms=DRONE_FIX_MS+dg*DRONE_FIX_FAR;
  const sys=droneSys(d);
  /* на Верфи руки те же, что чинят корпуса: вдвое быстрее */
  if(sys&&sys.station&&sys.station.stype==="yard")ms*=.5;
  /* смотритель с «авто-сбытом» держит и ремонт: у него на станции свои люди */
  if(typeof mgrPerkOf==="function"&&mgrPerkOf("keep","sell"))ms*=.75;
  return Math.round(ms);
}
/* ── строка состояния для списков ── */
function droneStateRu(d,now){
  now=now||Date.now();
  if(d.down>now)return "чинится "+Math.max(1,Math.round((d.down-now)/60000))+" мин";
  const P=dronePhase(d,now);
  return P.leg==="load"?"грузится":P.leg==="out"?"идёт гружёным":
         P.leg==="drop"?"на разгрузке":"идёт порожняком";
}
/* ── маршруты ──
   Управляют не дронами, а маршрутами: «титан, Нейэль II → Нейэль». Дроны на
   одном маршруте — одна строка, и по ней сразу видно, сколько машин работает
   и что они возят (автор: «как в транспорт тайкуне»). */
function droneRoutes(){
  const by={};
  for(const d of G.drones||[]){
    droneNormalize(d);
    const k=d.sx+","+d.sy+":"+d.pi+":"+d.res;
    if(!by[k]){
      const sys=droneSys(d);
      const P=(sys.planets||[])[d.pi];
      by[k]={key:k,res:d.res,sx:d.sx,sy:d.sy,pi:d.pi,
             from:P?P.name:(sys.name+", пояс"),to:droneHome(d,sys).name,
             sys:sys.name,drones:[],pool:0,perMin:0,down:0};
    }
    const R=by[k];
    R.drones.push(d);
    R.pool+=d.pool|0;
    if(!d.down||d.down<=Date.now())R.perMin+=d.rate*(RES[d.res]?RES[d.res].price:10);
    else R.down++;
  }
  return Object.keys(by).map(k=>by[k]);
}

/* ══════════════ дрон в кадре ══════════════
   Точка цвета груза с гаснущим хвостом. Гружёный ярче и цветной, порожний —
   тусклый и бесцветный: направление торговли читается без единой подписи.
   Подпись появляется только на приближении — над миром висит лишь то, что
   нужно сейчас, а на общем плане нужен поток, а не имена.
   Стоимость кадра: на дрон — восемь точек полилинии и один кружок. */
const DRONE_TAIL=8, DRONE_TAIL_MS=2600;
function drawDronesSystem(zx,zy,Z){
  const list=G.drones||[];
  if(!list.length)return;
  const now=Date.now();
  ctx.lineCap="round";
  for(const d of list){
    if(d.sx!==G.sx||d.sy!==G.sy)continue;
    droneNormalize(d,now);
    const col=(RES[d.res]&&RES[d.res].col)||"#cfe3ea";
    const P=dronePos(d,now,G.sys);
    const x=zx(P.x),y=zy(P.y);
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    /* ── стоит в ремонте ──
       Единственное мигание, которое игре разрешено, — аварийная лампа; это
       она. Дрон стоит у станции, куда дотянул, и ждёт своих людей. */
    if(d.down>now){
      const pu=.5+.5*Math.sin(now*.004);
      ctx.fillStyle="rgba(242,178,92,"+(.25+pu*.5).toFixed(3)+")";
      ctx.beginPath();ctx.arc(x,y,3.4,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(242,178,92,"+(.15+pu*.3).toFixed(3)+")";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,6.5+pu*2,0,TAU);ctx.stroke();
      continue;
    }
    /* хвост: где он был последние секунды. Не линия маршрута, а след машины —
       поэтому он короткий и гаснет. */
    /* хвост гаснет ПО ДЛИНЕ: одна полилиния одной прозрачности читается
       палкой, а не следом. Семь коротких отрезков, каждый тусклее и тоньше */
    let prev=null;
    for(let i=0;i<DRONE_TAIL;i++){
      const q=dronePos(d,now-i*(DRONE_TAIL_MS/DRONE_TAIL),G.sys);
      const qx=zx(q.x),qy=zy(q.y);
      if(prev){
        const a=(1-i/DRONE_TAIL)*(1-i/DRONE_TAIL);
        ctx.strokeStyle=P.loaded?hexA(col,(.38*a).toFixed(3)):"rgba(150,170,180,"+(.20*a).toFixed(3)+")";
        ctx.lineWidth=(P.loaded?1.9:1.3)*(1-i/DRONE_TAIL*.65);
        ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(qx,qy);ctx.stroke();
      }
      prev=[qx,qy];
    }
    /* сама машина: гружёная — цветная точка с искрой, порожняя — серая крупинка */
    /* размер идёт за камерой: на общем плане это крупинка, вблизи — машина.
       Постоянные 2.6 px делали порожний дрон невидимым на любом приближении */
    const k=clamp(Z,.7,1.8);
    if(P.loaded){
      ctx.fillStyle=hexA(col,.9);
      ctx.beginPath();ctx.arc(x,y,2.6*k,0,TAU);ctx.fill();
      ctx.fillStyle=hexA(col,.22);
      ctx.beginPath();ctx.arc(x,y,5.2*k,0,TAU);ctx.fill();
    }else{
      ctx.fillStyle="rgba(170,186,196,.75)";
      ctx.beginPath();ctx.arc(x,y,2*k,0,TAU);ctx.fill();
    }
    /* имя и груз — только когда камера подошла близко */
    if(Z>1.15){
      /* подпись тонет в свете звезды: над короной цвет груза читался пятном.
         Тень под буквой стоит копейки и держит текст на любом фоне (закон 3
         про кромку — та же мысль, только для шрифта) */
      const t=droneName(d)+" · "+RES[d.res].ru.toUpperCase();
      const ly=y-9-5*(k-1);
      ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillStyle="rgba(4,6,10,.8)";ctx.fillText(t,x+1,ly+1);
      ctx.fillStyle=hexA(col,.92);ctx.fillText(t,x,ly);
    }
  }
}
/* цвет ресурса задан строкой «#rrggbb»; прозрачность к нему добавляем здесь,
   чтобы не заводить второй таблицы цветов ради хвоста */
function hexA(c,a){
  if(c&&c[0]==="#"&&c.length===7){
    return "rgba("+parseInt(c.slice(1,3),16)+","+parseInt(c.slice(3,5),16)+","+
           parseInt(c.slice(5,7),16)+","+a+")";
  }
  return c;
}
/* ── на карте галактики: не машины, а их число ──
   Точки размером в пиксель на карте были бы мусором; там важно другое — в
   какой системе на тебя кто-то работает. Цифра у звезды и отвечает на это. */
function drawDronesMap(vis){
  const list=G.drones||[];
  if(!list.length)return;
  const by={};
  for(const d of list){const k=d.sx+","+d.sy;by[k]=(by[k]||0)+1;}
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
  for(const v of vis){
    const n=by[v.gx+","+v.gy];
    if(!n)continue;
    /* значок уходит от звезды дальше, чем прицел и кольца системы: на своей
       же системе он ложился ровно на рамку выбора и не читался (второй проход) */
    const bx=v.x+15,by2=v.y-13;
    ctx.fillStyle="rgba(4,6,10,.75)";
    ctx.fillText(String(n),bx+5,by2+4);
    ctx.fillStyle="rgba(127,230,216,.9)";
    ctx.beginPath();ctx.arc(bx,by2+1,1.8,0,TAU);ctx.fill();
    ctx.fillText(String(n),bx+4,by2+3);
  }
}

/* ══════════════ вкладка РЕЙСЫ ══════════════
   Список не дронов, а МАРШРУТОВ: «титан · Нейэль II → Нейэль · 3 дрона». Так
   отвечают на вопрос, который автор и задал: сколько машин на тебя работает и
   что они возят. Внутри маршрута — строки машин с их состоянием: идёт гружёным,
   на разгрузке, чинится шесть минут. Ни одной кнопки: смотреть, а не крутить. */
function renderFleetRuns(box){
  box.textContent="";
  const R=droneRoutes();
  const inv=G.droneInventory|0;
  if(!R.length){
    tableRow(box,"dim","","в рейсе никого. Дрон ставят на залежь с грунта или на астероид в поясе — "+
      "кнопка ДРОН появляется, когда стоишь у точки"+(inv?(". В запасе: "+inv):""));
    return;
  }
  const now=Date.now();
  const total=R.reduce((a,r)=>a+r.drones.length,0);
  const perMin=R.reduce((a,r)=>a+r.perMin,0);
  tableRow(box,"head","","В РЕЙСЕ "+total+" · МАРШРУТОВ "+R.length+
    " · ОКОЛО "+Math.round(perMin).toLocaleString("ru")+" КР/МИН"+(inv?(" · В ЗАПАСЕ "+inv):""));
  R.sort((a,b)=>b.perMin-a.perMin);
  for(const r of R){
    /* груза с таким ключом может не оказаться у чужой записи — строка списка
       не имеет права падать из-за этого вместе со всем экраном */
    const res=RES[r.res]||{ru:String(r.res||"груз"),col:"#cfe3ea"};
    const row=tableRow(box,"","",r.from+" → «"+r.to+"» · "+r.drones.length+
      " "+pl3(r.drones.length,"дрон","дрона","дронов")+
      " · в точке осталось "+r.pool+(r.down?(" · "+r.down+" в ремонте"):""));
    const em=row.querySelector("em");
    if(em){em.textContent=res.ru.toUpperCase();em.style.color=res.col;}
    for(const d of r.drones){
      tableRow(box,"dim","",droneName(d)+" · "+droneStateRu(d,now)+
        " · кругов "+(d.trips|0)+" · заработал "+(d.earned|0).toLocaleString("ru")+" кр");
    }
  }
  tableRow(box,"dim","","дрон ломается сам и чинится сам — временем, не деньгами; "+
    "на верфи вдвое быстрее. Пока стоит, круги не идут");
}
