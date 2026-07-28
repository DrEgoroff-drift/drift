/* ══════════════ наёмники: флот, которым не управляешь напрямую ══════════════ */
/* Старые корпуса из G.owned перестают быть мусором: нанятому нужен корабль, и
   это главное решение игрока. Летающих в фоне NPC нет — как и у дронов, всё
   считается от прошедшего времени, когда игра снова смотрит на счётчик. */
const CREW_SPEC={
  fight:{ru:"боевой",   note:"охота на пиратов: награды и трофеи",       pay:34},
  mine: {ru:"добытчик", note:"добыча в поясе и на планетах",             pay:26},
  haul: {ru:"перевозчик",note:"маршруты между системами: живые деньги",  pay:22}
};
const SPEC_KEYS=Object.keys(CREW_SPEC);
/* Черта — это множители и пороги, ничего нового в движке: она даёт вилку
   поведения, а не отдельную ветку кода. */
const CREW_TRAITS=[
  {id:"vet",     ru:"ветеран",   note:"дороже, но выходит живым",        pay:1.4,  risk:.55,yield:1.15},
  {id:"careful", ru:"осторожный",note:"отступает рано: меньше добычи, зато цел",pay:1,risk:.4,yield:.75},
  {id:"greedy",  ru:"жадный",    note:"подворовывает из груза",          pay:.82, risk:1,  yield:1,   steal:.16},
  {id:"stubborn",ru:"упрямый",   note:"не отзывается по первому приказу",pay:.88, risk:1.15,yield:1.1, stubborn:true},
  {id:"lucky",   ru:"везучий",   note:"находит больше, чем должен",      pay:1.15,risk:.9, yield:1.25},
  {id:"green",   ru:"необстрелянный",note:"дёшев и неопытен",            pay:.62, risk:1.35,yield:.72}
];
function traitOf(id){return CREW_TRAITS.find(t=>t.id===id)||CREW_TRAITS[0];}
function crewMul(c,k){
  let m=1;for(const id of c.traits)m*=(traitOf(id)[k]!==undefined?traitOf(id)[k]:1);
  return m;
}
function crewHas(c,flag){return c.traits.some(id=>!!traitOf(id)[flag]);}
/* опыт даёт эффективность: 0 → ×1, 100 приказо-минут → примерно ×1.5 */
function crewSkill(c){return 1+Math.min(.6,(c.xp||0)/200);}
function crewPay(c){return Math.round(CREW_SPEC[c.spec].pay*crewMul(c,"pay")*crewSkill(c));}
function genMerc(seed,specPool){
  const r=rng(seed);
  const spec=pick(specPool&&specPool.length?specPool:SPEC_KEYS,r);
  const traits=[];
  const n=2+(r()<.35?1:0);
  for(let i=0;i<n;i++){
    const t=pick(CREW_TRAITS,r);
    if(traits.indexOf(t.id)<0)traits.push(t.id);
  }
  const c={id:"c"+seed,seed,name:genName(r),spec,traits,xp:Math.floor(r()*40),
    shipId:null,order:null,hull:100,hullMax:100,cargo:{},debt:0,morale:1,
    tMs:0,paidMs:0,fee:0};
  c.fee=Math.round((260+r()*420)*crewMul(c,"pay"));   // разовая плата за наём
  return c;
}
/* кандидаты на станции: ничего не персистится, состав держится на seed станции
   и временном бакете — ровно как ассортимент частей */
function stationMercs(sys){
  if(!sys.station)return [];
  const T=stTypeOf(sys.station.stype);
  const pool=T.id==="outpost"?["fight","fight","mine"]:
             T.id==="yard"?SPEC_KEYS:
             T.id==="trade"?["haul","haul","mine"]:
             T.id==="indust"?["mine","haul"]:["mine","haul","fight"];
  const r=rng(hashi(sys.seed,0xC5EE,timeBucket()));
  const n=1+Math.floor(r()*3);
  const out=[];
  for(let i=0;i<n;i++)out.push(genMerc(hashi(sys.seed,i*7717+13,timeBucket()),pool));
  return out;
}
/* ══════════════ приказы ══════════════ */
const ORDERS={
  hunt:{ru:"охота на пиратов",spec:"fight",note:"патрулирует сектор и бьёт пиратов — награды и трофеи"},
  mine:{ru:"добыча",          spec:"mine", note:"работает в поясе или на залежи, сдаёт руду на ближайшую станцию"},
  haul:{ru:"перевозка",       spec:"haul", note:"возит грузы между станциями — чистые кредиты"},
  home:{ru:"на приколе",      spec:null,   note:"стоит без дела: не зарабатывает, зато и не рискует"}
};
function crewCap(){return 1+techLv("license");}
function hireMerc(c){
  if(G.crew.length>=crewCap()){say("Больше нанимать некому\nнужна лицензия на флот");return false;}
  if(G.credits<c.fee){say("Не хватает кредитов");return false;}
  G.credits-=c.fee;
  const m=Object.assign({},c,{cargo:{},order:{kind:"home",sx:G.sx,sy:G.sy},
    tMs:Date.now(),paidMs:Date.now()});
  G.crew.push(m);
  tell("money","Нанят "+m.name+" · "+CREW_SPEC[m.spec].ru+" · −"+c.fee+" кр",
       "Нанят "+m.name+"\n"+CREW_SPEC[m.spec].ru+"\nвыдайте корабль на вкладке ЭКИПАЖ");
  return true;
}
function fireMerc(i){
  const c=G.crew[i];if(!c)return;
  /* корабль возвращается в ангар вместе с тем, что он успел набрать */
  crewUnload(c,true);
  G.crew.splice(i,1);
  logAdd("dim","Расчёт с "+c.name+(c.debt>0?" · долг "+c.debt+" кр списан":""));
  say("Расчёт с "+c.name);
}
function crewAssignShip(c,id){
  if(!G.owned[id]||id===G.shipId)return false;
  if(G.crew.some(o=>o!==c&&o.shipId===id))return false;
  c.shipId=id;
  const S=shipData(id);
  c.hullMax=S?S.hull:100;c.hull=c.hullMax;
  logAdd("dim",c.name+" принял «"+(S?S.ru:id)+"»");
  return true;
}
function crewOrder(c,kind,sx,sy){
  if(!c.shipId&&kind!=="home"){say("Сначала выдайте корабль");return false;}
  /* упрямый игнорирует первый приказ — вилка поведения, а не поломка */
  if(crewHas(c,"stubborn")&&c.order&&c.order.kind!==kind&&!c.balked){
    c.balked=true;
    logAdd("warn",c.name+" не принял приказ с первого раза — упрямый");
    say(c.name+" упрямится\nповторите приказ");
    return false;
  }
  c.balked=false;
  crewTick();                       // закрываем прошлый отрезок по старому приказу
  c.order={kind,sx:sx!=null?sx:G.sx,sy:sy!=null?sy:G.sy};
  c.tMs=Date.now();
  logAdd("",c.name+" → "+ORDERS[kind].ru+" · сектор "+c.order.sx+","+c.order.sy);
  return true;
}
/* груз наёмника сдаётся на ближайшую к его району станцию по живым ценам */
function crewUnload(c,quiet){
  let sum=0,n=0;
  /* nearestStation отдаёт систему — цены берём её живым рынком, тем же, по
     которому торгует игрок; редкое сырьё рынок не берёт и остаётся в трюме */
  const home=nearestStation(c.order?c.order.sx:G.sx,c.order?c.order.sy:G.sy);
  const prices=(home&&home.station)?marketFor(home):null;
  for(const k in c.cargo){
    const q=c.cargo[k]|0;if(q<=0||RARE_RES.indexOf(k)>=0)continue;
    sum+=q*((prices&&prices[k])||RES[k].price);n+=q;c.cargo[k]=0;
  }
  if(sum>0){
    G.credits+=sum;
    if(!quiet)logAdd("money",c.name+" сдал груз ×"+n+" · +"+sum.toLocaleString("ru")+" кр");
  }
  return sum;
}
function crewHold(c){let s=0;for(const k in c.cargo)s+=c.cargo[k]|0;return s;}
function crewCargoMax(c){const S=shipData(c.shipId);return S?S.cargo:0;}
/* ══════════════ ленивая симуляция ══════════════ */
const CREW_OFFLINE_CAP=8*3600*1000;   // за ночь начислится не больше восьми часов
function crewTick(){
  if(!G.crew.length)return;
  const now=Date.now();
  for(const c of G.crew){
    if(!c.tMs){c.tMs=now;continue;}
    const dtMs=Math.min(now-c.tMs,CREW_OFFLINE_CAP);
    if(dtMs<1000)continue;
    c.tMs=now;
    const min=dtMs/60000;
    crewPayroll(c,min);
    if(!c.order||c.order.kind==="home"||!c.shipId){crewRest(c,min);continue;}
    if(c.hull<=0){crewRest(c,min);continue;}
    const eff=crewSkill(c)*crewMul(c,"yield")*(c.morale<.5?.5:1);
    const danger=sysDanger(c.order.sx,c.order.sy);
    const r=rng(hashi(c.seed,Math.floor(now/60000),0xC7E));
    if(c.order.kind==="hunt")crewHunt(c,min,eff,danger,r);
    else if(c.order.kind==="mine")crewMine(c,min,eff,danger,r);
    else if(c.order.kind==="haul")crewHaul(c,min,eff,danger,r);
    c.xp=(c.xp||0)+min;
  }
  /* ушедшие вычищаются одним проходом, чтобы не рвать цикл посередине */
  for(let i=G.crew.length-1;i>=0;i--)if(G.crew[i].gone)G.crew.splice(i,1);
}
/* ══════════════ жалованье, долг и мораль ══════════════ */
/* Плата идёт по тому же ленивому счётчику, что и работа. Нечем платить — копится
   долг и падает мораль: сначала работают вполсилы, потом бросают приказ, потом
   уходят и забирают корабль в счёт долга. Жёстко, но с предупреждением заранее. */
function crewPayroll(c,min){
  const due=crewPay(c)*min*(c.order&&c.order.kind==="home"?.45:1);   // на приколе кормят дешевле
  if(due<=0)return;
  const pay=Math.min(G.credits,due);
  G.credits-=pay;
  const short=due-pay;
  if(short>0){
    c.debt+=short;
    c.morale=Math.max(0,c.morale-min*.05);
    if(!c.warned&&c.morale<.6){
      c.warned=true;
      logAdd("warn",c.name+" не получает жалованья · долг "+Math.round(c.debt)+" кр — работает вполсилы");
    }
    if(c.morale<=.25&&c.order&&c.order.kind!=="home"){
      c.order={kind:"home",sx:c.order.sx,sy:c.order.sy};
      logAdd("warn",c.name+" бросил приказ: не платят");
    }
    if(c.morale<=0){
      const S=c.shipId?shipData(c.shipId):null;
      if(c.shipId&&c.shipId!==G.shipId)delete G.owned[c.shipId];
      logAdd("warn",c.name+" ушёл и забрал «"+(S?S.ru:"корабль")+"» в счёт долга "+Math.round(c.debt)+" кр");
      c.gone=true;
    }
  }else{
    c.debt=Math.max(0,c.debt-min*crewPay(c)*.3);
    if(c.debt<=0){c.warned=false;c.morale=Math.min(1,c.morale+min*.03);}
  }
  /* опыт превращается в прибавку: старый дешёвый работник дорожает сам */
  const step=Math.floor((c.xp||0)/50);
  if(step>(c.paidStep|0)){
    c.paidStep=step;
    logAdd("dim",c.name+" набрался опыта — жалованье теперь "+crewPay(c)+" кр/мин");
  }
}
/* быстрый ремонт за деньги: тот же параметр, что чинится сам, только сразу */
function crewRepairCost(c){return Math.ceil((c.hullMax-c.hull)*9);}
function crewRepair(c){
  const cost=crewRepairCost(c);
  if(cost<=0){say("Корпус цел");return false;}
  if(G.credits<cost){say("Не хватает кредитов\nнужно "+cost+" кр");return false;}
  G.credits-=cost;c.hull=c.hullMax;
  logAdd("money","Ремонт корабля "+c.name+" · −"+cost.toLocaleString("ru")+" кр");
  return true;
}
function crewRest(c,min){
  /* на приколе корпус чинится сам — медленно и бесплатно */
  if(c.hull<c.hullMax)c.hull=Math.min(c.hullMax,c.hull+min*.6);
}
function crewDamage(c,amount){
  c.hull-=amount;
  if(c.hull<=0){
    c.hull=0;
    const lost=c.shipId,S=shipData(lost);
    if(lost&&lost!==G.shipId)delete G.owned[lost];
    c.shipId=null;c.order={kind:"home",sx:c.order?c.order.sx:G.sx,sy:c.order?c.order.sy:G.sy};
    c.cargo={};
    /* корабль потерян всегда, человек — не всегда: ветеран чаще дотягивает до капсулы */
    const survive=rng(hashi(c.seed,Math.floor(Date.now()/60000),0x5A7E))()<(.55/crewMul(c,"risk"));
    if(survive)logAdd("warn",c.name+" потерял «"+(S?S.ru:lost)+"», сам спасся — ждёт нового корабля");
    else{logAdd("warn",c.name+" не вернулся вместе с «"+(S?S.ru:lost)+"»");c.gone=true;}
  }
}
function crewHunt(c,min,eff,danger,r){
  const kills=min*(.22+danger*.35)*eff;
  const bounty=Math.round(kills*(120+danger*150)*stat().bountyMul);
  if(bounty>0){
    G.credits+=bounty;
    if(bounty>40)logAdd("money",c.name+" сдал награды за пиратов · +"+bounty.toLocaleString("ru")+" кр");
  }
  /* урон соразмерен ремонту: час в опасном секторе — счёт за починку, а не похороны */
  const hit=min*(.5+danger*2.2)*crewMul(c,"risk");
  if(hit>0)crewDamage(c,hit);
}
function crewMine(c,min,eff,danger,r){
  const cap=crewCargoMax(c);
  const rate=min*(.5+eff*.95);   // около полутора единиц руды в минуту: выше жалованья, но не принтер
  let left=Math.min(rate,Math.max(0,cap-crewHold(c)));
  const sys=getSystem(c.order.sx,c.order.sy);
  const pool=sys.belt?sys.belt.res:(sys.planets.length?sys.planets[0].res:["iron"]);
  while(left>=1){
    const k=pick(pool.length?pool:["iron"],r);
    c.cargo[k]=(c.cargo[k]|0)+1;left--;
  }
  /* жадный отсыпает себе — видно только по недостаче */
  if(crewHas(c,"greedy")&&crewHold(c)>0&&r()<min*.35){
    for(const k in c.cargo)if(c.cargo[k]>0){c.cargo[k]--;break;}
  }
  if(crewHold(c)>=cap*.98){
    const sum=crewUnload(c);
    if(sum>0)logAdd("money",c.name+" сдал полный трюм · +"+sum.toLocaleString("ru")+" кр");
  }
  if(danger>.25)crewDamage(c,min*danger*1.1*crewMul(c,"risk"));
}
function crewHaul(c,min,eff,danger,r){
  const S=shipData(c.shipId);
  /* доход маршрута тянет вместимость корпуса: большой трюм — заметно выгоднее,
     но всё равно в разы ближе к жалованью, чем к бесконечным деньгам */
  const pay=Math.round(min*(S?S.cargo:20)*.17*eff);
  if(pay>0){
    G.credits+=pay;
    if(pay>60)logAdd("money",c.name+" закрыл рейс · +"+pay.toLocaleString("ru")+" кр");
  }
  if(danger>.35&&r()<min*.12)crewDamage(c,4+danger*14);
}
/* ══════════════ встреча в космосе ══════════════ */
/* Если игрок влетел в систему, где работает его наёмник, тот спавнится
   настоящим кораблём: тот же каркас NPC, что и у пиратов, только на своей стороне. */
function spawnAllies(){
  G.allies=[];
  for(const c of G.crew){
    if(!c.shipId||!c.order||c.order.kind==="home")continue;
    if(c.order.sx!==G.sx||c.order.sy!==G.sy)continue;
    const a=rng(hashi(c.seed,G.sx*131+G.sy,5))()*TAU;
    G.allies.push({c,x:G.ship.x+Math.cos(a)*420,y:G.ship.y+Math.sin(a)*420,
      vx:0,vy:0,a:a,cool:0,thrust:false});
  }
  if(G.allies.length)say("В системе работает ваш экипаж\n"+G.allies.map(A=>A.c.name).join(", "));
}
function updateAllies(dt){
  if(!G.allies||!G.allies.length)return;
  const sh=G.ship,st=stat();
  for(const A of G.allies){
    /* цель — ближайший пират в поле зрения, иначе держимся возле игрока */
    let tgt=null,td=1e9;
    for(const p of G.pirates){
      const d=Math.hypot(p.x-A.x,p.y-A.y);
      if(d<1500&&d<td){td=d;tgt=p;}
    }
    const gx=tgt?tgt.x:sh.x+180,gy=tgt?tgt.y:sh.y+180;
    const dx=gx-A.x,dy=gy-A.y,d=Math.hypot(dx,dy)||1;
    const want=tgt?Math.min(d-260,3.4):Math.min(d-140,3.2);
    A.vx+=(dx/d*want-A.vx)*Math.min(1,.02*dt);
    A.vy+=(dy/d*want-A.vy)*Math.min(1,.02*dt);
    A.x+=A.vx*dt;A.y+=A.vy*dt;
    A.a+=angDiff(Math.atan2(dy,dx),A.a)*Math.min(1,.08*dt);
    A.thrust=Math.hypot(A.vx,A.vy)>.6;
    if(A.cool>0)A.cool-=dt;
    if(tgt&&td<900&&A.cool<=0&&A.c.spec==="fight"){
      A.cool=40;
      fireShot(A.x,A.y,A.a,7.5,4+crewSkill(A.c)*3,true);
    }
  }
}
function drawAllies(zx,zy,Z){
  if(!G.allies)return;
  for(const A of G.allies){
    const x=zx(A.x),y=zy(A.y);
    if(x<-80||x>W+80||y<-80||y>H+80)continue;
    ctx.save();ctx.translate(x,y);ctx.scale(clamp(Z,.3,1.4),clamp(Z,.3,1.4));ctx.rotate(A.a);
    drawHull(A.c.shipId,A.thrust,false,0);
    ctx.restore();
    ctx.fillStyle="rgba(127,230,216,.75)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(A.c.name.toUpperCase(),x,y-26*clamp(Z,.3,1.4)-6);
  }
}
