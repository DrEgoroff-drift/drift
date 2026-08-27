/* ══════════════ наёмники: флот, которым не управляешь напрямую ══════════════ */
/* Старые корпуса из G.owned перестают быть мусором: нанятому нужен корабль, и
   это главное решение игрока. Летающих в фоне NPC нет — как и у дронов, всё
   считается от прошедшего времени, когда игра снова смотрит на счётчик. */
/* Потолок на «ленивое время»: за сутки простоя домен начисляет ровно сутки,
   а не всё, что накопилось. Одна константа на наёмников, базы и всё прочее,
   что считается от прошедшего времени, — иначе они разойдутся.

   Её не существовало, хотя `baseTick` её читал: каждый тик базы после первого
   падал с ReferenceError, а вместе с ним падал и вход в базу. */
const CREW_OFFLINE_CAP=24*3600*1000;
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
/* ── скрытая удача ──
   Главное число наёмника, и его нигде не видно. Оно двигает таблицу событий и
   выработку. Узнать его можно только по истории рейсов — то есть перебором, а
   перебор стоит денег: найм невозвратен, а расчёт — с выходным пособием.
   Черта «везучий» видна в найме и лишь слегка смещает настоящую удачу: подсказка,
   которая имеет право соврать. */
function crewLuck(c){
  if(c._luck==null){
    const r=rng(hashi(c.seed,0x10CC,0x9E37));
    c._luck=.62+r()*.83+(crewHas(c,"lucky")?.12:0);
    if(relicOn("dice"))c._luck=Math.max(c._luck,1);   /* «Счётная кость»: ниже средней не бывает */      // 0.62 … 1.57
    c._swing=.7+r()*.95;                                  // насколько его качает
  }
  return c._luck;
}
function crewSwing(c){crewLuck(c);return c._swing;}
function crewMul(c,k){
  let m=1;for(const id of c.traits)m*=(traitOf(id)[k]!==undefined?traitOf(id)[k]:1);
  return m;
}
function crewHas(c,flag){return c.traits.some(id=>!!traitOf(id)[flag]);}
/* опыт даёт эффективность: 0 → ×1, 100 приказо-минут → примерно ×1.5 */
function crewSkill(c){return 1+Math.min(.6,(c.xp||0)/200);}
/* Оклад тянет корпус, а не только специальность: «Мамонт» с трюмом на 290 стоит
   дороже «Иглы» с трюмом на 26. Иначе большой корпус был бы не выбором, а строго
   лучшим вариантом — выручка от него росла, а расходы нет. */
function crewHullPay(c){const S=c.shipId?shipData(c.shipId):null;return S?S.cargo*.1:0;}
function crewPay(c){
  return Math.round((CREW_SPEC[c.spec].pay+crewHullPay(c))*crewMul(c,"pay")*crewSkill(c));
}
function genMerc(seed,specPool){
  const r=rng(seed);
  const spec=pick(specPool&&specPool.length?specPool:SPEC_KEYS,r);
  const traits=[];
  const n=2+(r()<.35?1:0);
  for(let i=0;i<n;i++){
    const t=pick(CREW_TRAITS,r);
    if(traits.indexOf(t.id)<0)traits.push(t.id);
  }
  /* ── опыт следует ЧЕРТАМ (M212, обход второго часа) ──
     Стоял `Math.floor(r()*40)` — просто случайное число, ни с чем не
     связанное. На экране найма это выходило прямым противоречием, и первый же
     обход его поймал: у человека с чертой «необстрелянный — дёшев и НЕОПЫТЕН»
     стояло «опыт 22», а у соседнего «ветеран — дороже, но выходит живым» —
     «опыт 7». Игрок читает подряд две строки, которые спорят друг с другом, и
     верить перестаёт обеим.

     Число теперь выводится из тех же черт, которыми человек описан: у зелёного
     он мал, у ветерана велик, у прочих посередине. Разброс остаётся — люди
     разные, — но знак разброса больше не спорит с подписью. */
  const xpLo=traits.indexOf("green")>=0, xpHi=traits.indexOf("vet")>=0;
  const xp=xpLo&&!xpHi ? Math.floor(r()*7)          /* необстрелянный: 0…6 */
         : xpHi&&!xpLo ? 46+Math.floor(r()*44)      /* ветеран: 46…89 */
         :               8+Math.floor(r()*30);      /* прочие: 8…37 */
  const c={id:"c"+seed,seed,name:genName(r),spec,traits,xp,
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
  /* ── у своих ищут работу те, за кем есть налёт (M102) ──
     Репутация меняет не цену найма (это уже есть), а КТО пришёл: там, где вас
     знают, за столом сидит человек с послужным списком; там, где вас помнят
     нехорошо, — залётный без истории. Ставки и содержание рейсов не трогаем. */
  {
    /* ── и надбавка НЕ СПОРИТ С ЧЕРТАМИ (обход третьего часа, M215) ──
       Стояло `xp=Math.max(xp,65)` без оглядки на то, кем человек описан. M212
       только что убрал ровно это противоречие из `genMerc` — и оно тут же
       возвращалось на любой станции, где игрока знают: у кандидата с чертой
       «необстрелянный — дёшев и НЕОПЫТЕН» проставлялось «опыт 65». Тот же
       спор двух соседних строк, только теперь его включала репутация.

       Замысел этой надбавки — «КТО пришёл», а не «кем он вдруг стал»: там,
       где вас знают, за столом сидит человек с послужным списком. Значит
       поднимать надо тех, кто МОЖЕТ его иметь, и зелёного не трогать вовсе —
       зелёный зелен везде. Вниз то же самое: ветерану обрезать стаж нельзя,
       он от вашей репутации не молодеет. */
    const rv=typeof repAt==="function"?repAt(sys):0;
    const green=(m)=>m.traits.indexOf("green")>=0;
    const vet=(m)=>m.traits.indexOf("vet")>=0;
    if(rv>=2){
      const up=out.filter(m=>!green(m));
      for(let i=0;i<Math.min(up.length,rv>=4?2:1);i++)
        up[i].xp=Math.max(up[i].xp,40+(rv>=4?60:25));
    }else if(rv<=-2){
      for(const m of out){
        if(vet(m))continue;
        m.xp=Math.floor(m.xp*(rv<=-4?.25:.6));
      }
    }
  }
  /* спасённые с барж пассажиры ищут вас в кантине — в любой, где вы окажетесь
     (12l-barge). Они приходят к вам сами: единственный наёмник, который не
     «ищет работу здесь», а помнит, кто его вытащил. */
  for(const p of (G.bargePax||[])){
    if(G.crew.some(c=>c.id===p.id))continue;
    const m=genMerc(p.seed,null);
    m.id=p.id;m.fee=p.fee|0;m.pax=1;m.story=p.story||"";
    out.push(m);
  }
  return out;
}
/* ══════════════ приказы ══════════════ */
const ORDERS={
  hunt:{ru:"охота на пиратов",spec:"fight",note:"патрулирует сектор и бьёт пиратов — награды и трофеи"},
  mine:{ru:"добыча",          spec:"mine", note:"работает в поясе или на залежи, сдаёт руду на ближайшую станцию"},
  haul:{ru:"перевозка",       spec:"haul", note:"возит грузы между станциями — чистые кредиты"},
  base:{ru:"работа на базе",  spec:null,   note:"живёт в жилом отсеке и держит одну из ролей базы"},
  home:{ru:"на приколе",      spec:null,   note:"стоит без дела: не зарабатывает, зато и не рискует"}
};
/* Роли на базе (M47). Роль можно дать любую, но по своей специальности человек
   работает в полную силу, а по чужой — вполсилы: это выбор, а не формальность. */
const BASE_ROLES={
  driller:{ru:"бурильщик",spec:"mine", note:"+выработка буровых"},
  engineer:{ru:"инженер", spec:"mine", note:"меньше потерь энергии, чинит разбитые отсеки"},
  guard:  {ru:"охранник", spec:"fight",note:"отражает налёты пиратов на базу"},
  logist: {ru:"логист",   spec:"haul", note:"позволяет забирать добычу со станции, не прилетая"}
};
const ROLE_KEYS=Object.keys(BASE_ROLES);
function roleForce(c){return BASE_ROLES[c.role]&&BASE_ROLES[c.role].spec===c.spec?1:.5;}
/* сколько людей помещается: жилые отсеки, по двое на каждый */
function baseSlots(B){return basePower(B).hab*2;}
function baseStaff(B){
  return G.crew.filter(c=>c.order&&c.order.kind==="base"&&
    c.order.sx===B.sx&&c.order.sy===B.sy&&c.order.idx===B.idx);
}
function baseRoleForce(B,role){
  let f=0;for(const c of baseStaff(B))if(c.role===role)f+=roleForce(c)*crewSkill(c)*(c.morale<.5?.5:1);
  return f;
}
function assignToBase(c,B,role){
  if(!BASE_ROLES[role])return false;
  if(baseStaff(B).length>=baseSlots(B)){say("На базе нет жилых мест\nстройте жилой отсек");return false;}
  crewTick();
  c.role=role;
  c.order={kind:"base",sx:B.sx,sy:B.sy,idx:B.idx};
  c.tMs=Date.now();
  logAdd("",c.name+" → "+BASE_ROLES[role].ru+" на базе «"+B.name+"»");
  return true;
}
function crewCap(){return 1+techLv("license")+mgrCrewCap();}
/* ── человек, пришедший даром (25.08.2026) ──
   Сделка «Он отработал и пришёл к вам в звено — даром» (27g-deals) вызывала
   `crewGift()`, которой в игре не было НИ РАЗУ: вызов стоял под
   `typeof …==="function"`, проверка молча его глотала, игрок читал обещание и
   не получал ничего. Ложь такого рода правилами проекта запрещена прямо, так
   что функция написана. Он приходит без платы, но и без выбора: кто пришёл,
   тот и пришёл. Если мест нет — он не пропадает молча, а говорит об этом. */
function crewGift(seed){
  if(G.crew.length>=crewCap()){
    say("Человек пришёл, а места нет\nнужна лицензия на флот");
    return false;
  }
  const m=genMerc(seed||hashi(Date.now()&0xffffff,G.crew.length*7717,0xC1F),null);
  m.fee=0;
  G.crew.push(Object.assign(m,{cargo:{},order:{kind:"home",sx:G.sx,sy:G.sy},
    tMs:Date.now(),paidMs:Date.now()}));
  tell("good","В звено даром: "+m.name+" · "+CREW_SPEC[m.spec].ru,
       "К вам пришёл "+m.name+"\n"+CREW_SPEC[m.spec].ru+"\nплаты не просит — выдайте корабль");
  return true;
}
function mercFee(c){return Math.round(c.fee*mgrHireMul());}
function hireMerc(c){
  if(G.crew.length>=crewCap()){say("Больше нанимать некому\nнужна лицензия на флот");return false;}
  const fee=mercFee(c);
  if(G.credits<fee){say("Не хватает кредитов");return false;}
  G.credits-=fee;
  c=Object.assign({},c,{fee});
  const m=Object.assign({},c,{cargo:{},order:{kind:"home",sx:G.sx,sy:G.sy},
    tMs:Date.now(),paidMs:Date.now()});
  G.crew.push(m);
  /* спасённый с баржи, если это он: больше в кантине не мелькает */
  if(Array.isArray(G.bargePax))G.bargePax=G.bargePax.filter(p=>p.id!==m.id);
  tell("money","Нанят "+m.name+" · "+CREW_SPEC[m.spec].ru+" · −"+c.fee+" кр",
       "Нанят "+m.name+"\n"+CREW_SPEC[m.spec].ru+"\nвыдайте корабль на вкладке ЭКИПАЖ");
  return true;
}
/* Расчёт стоит денег — и это не жадность, а защита механики. Удача скрыта, значит
   без выходного пособия оптимальной игрой был бы бесплатный перебор: нанял, погонял
   три рейса, уволил, повторил. С пособием перебор — тоже ставка. */
function crewSeverance(c){return Math.round(c.fee*.5+crewPay(c)*15);}
function fireMerc(i){
  const c=G.crew[i];if(!c)return false;
  const cost=crewSeverance(c);
  if(G.credits<cost){say("Расчёт стоит "+cost.toLocaleString("ru")+" кр\nне хватает кредитов");return false;}
  G.credits-=cost;
  /* корабль возвращается в ангар вместе с тем, что он успел набрать */
  crewUnload(c,true);
  G.crew.splice(i,1);
  logAdd("dim","Расчёт с "+c.name+" · выходное пособие "+cost.toLocaleString("ru")+" кр"+
    (c.debt>0?" · долг "+Math.round(c.debt)+" кр списан":""));
  say("Расчёт с "+c.name+"\n−"+cost.toLocaleString("ru")+" кр");
  return true;
}
function crewAssignShip(c,id){
  if(!G.owned[id]||id===G.shipId)return false;
  if(G.crew.some(o=>o!==c&&o.shipId===id))return false;
  c.shipId=id;
  const S=shipData(id);
  c.hullMax=Math.round((S?S.hull:100)*(1+crewModLv(c,"armor")*.3));c.hull=c.hullMax;
  logAdd("dim",c.name+" принял «"+(S?S.ru:id)+"»");
  return true;
}
function crewOrder(c,kind,sx,sy){
  if(!c.shipId&&kind!=="home"){say("Сначала выдайте корабль");return false;}
  /* упрямый игнорирует первый приказ — вилка поведения, а не поломка */
  if(crewHas(c,"stubborn")&&!mgrPerkOf("cmd","disc")&&!relicOn("seal")&&c.order&&c.order.kind!==kind&&!c.balked){
    c.balked=true;
    logAdd("warn",c.name+" не принял приказ с первого раза — упрямый");
    say(c.name+" упрямится\nповторите приказ");
    return false;
  }
  c.balked=false;
  crewTick();                       // закрываем прошлый отрезок по старому приказу
  if(crewBusy(c)==="hostage"){say(c.name+" в плену\nсначала выкуп или штурм базы");return false;}
  c.order={kind,sx:sx!=null?sx:G.sx,sy:sy!=null?sy:G.sy};
  c.tMs=Date.now();c.tripMin=0;                 // смена района начинает рейс заново
  G.orderStamp=(G.orderStamp|0)+1;    // «тишина в эфире» считает именно вмешательства
  logAdd("",c.name+" → "+ORDERS[kind].ru+" · сектор "+c.order.sx+","+c.order.sy);
  /* показываем его в небе сразу, а не только при следующем входе в систему —
     иначе игрок отдаёт приказ и не видит никаких признаков, что кто-то работает */
  if(G.mode==="system"||G.mode==="dock")spawnAllies();
  return true;
}
/* ══════════════ переданные модули ══════════════ */
/* Игрок покупает уровни модулей себе; снятые уровни лежат мёртвым грузом.
   Их можно отдать наёмнику — он не носит части, но большой трюм, броня и бур
   работают у него так же. Это и есть «перекинуть свои модули». */
const CREW_MODS={
  hold: {ru:"Расширение трюма", note:"+35% к трюму за уровень"},
  armor:{ru:"Бронеплиты",       note:"+30% к корпусу за уровень"},
  drill:{ru:"Буровая установка",note:"+20% к выработке за уровень"}
};
function crewModLv(c,k){return (c.mods&&c.mods[k])|0;}
/* свободные уровни у игрока: куплено минус стоит на корабле минус уже роздано */
function spareModLv(k){
  let given=0;for(const c of G.crew)given+=crewModLv(c,k);
  return Math.max(0,(G.modsOwned[k]|0)-(G.mods[k]|0)-given);
}
function crewGiveMod(c,k,d){
  if(!CREW_MODS[k])return false;
  if(d>0&&spareModLv(k)<=0){say("Свободных уровней нет\nснимите модуль на вкладке МОДУЛИ");return false;}
  if(d<0&&crewModLv(c,k)<=0)return false;
  c.mods=c.mods||{};
  c.mods[k]=Math.max(0,crewModLv(c,k)+d);
  if(c.shipId){const S=shipData(c.shipId);
    c.hullMax=Math.round((S?S.hull:100)*(1+crewModLv(c,"armor")*.3));
    c.hull=Math.min(c.hull,c.hullMax);}
  logAdd("dim",c.name+(d>0?" получил ":" вернул ")+CREW_MODS[k].ru.toLowerCase()+
    " · уровень "+crewModLv(c,k));
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
    sum-=mgrCmdCut(sum);
    earn(sum,"crew");c.earned=(c.earned||0)+sum;
    if(!quiet)logAdd("money",c.name+" сдал груз ×"+n+" · +"+sum.toLocaleString("ru")+" кр");
  }
  return sum;
}
function crewHold(c){let s=0;for(const k in c.cargo)s+=c.cargo[k]|0;return s;}
function crewCargoMax(c){const S=shipData(c.shipId);
  return S?Math.round(S.cargo*(1+crewModLv(c,"hold")*.35)):0;}
/* ══════════════ ленивая симуляция: рейсами, а не минутами ══════════════ */
/* Единица работы — рейс. Он длится столько, сколько наёмник наполняет трюм, и
   заканчивается броском по таблице событий. Отсюда два следствия.

   Во-первых, за отсутствие копится очередь из трёх рейсов, а не восемь часов по
   ставке: вернуться утром к предсказуемым трём раздачам можно, к экспоненте — нет.

   Во-вторых, корпус перестаёт быть просто «больше выручка»: большой трюм — это
   редкие крупные рейсы, маленький — частые мелкие. Одинаковые деньги, разное
   число бросков, а значит разная дисперсия. Это выбор ставки, а не апгрейд.

   По кредитам наёмник в среднем в минусе: рейс приносит примерно 85% жалованья.
   Он окупается хвостами — трофейными частями, редким сырьём, изредка целым
   корпусом. Кредиты здесь ставка, приз — вещи. */
const CREW_TRIP_QUEUE=3;              // сколько рейсов копится за отсутствие
const CREW_YIELD=.85;                 // доля жалованья, которую рейс отбивает валом
function crewTripMinutes(c){
  const S=c.shipId?shipData(c.shipId):null;
  return clamp(7+(S?S.cargo:40)*.085,8,30);
}
/* насколько он эффективен сверх оклада: опыт и черты сидят и в жаловании тоже,
   поэтому в плюс выводят только переданные модули и высокая удача */
function crewEff(c){
  /* командир звена — множитель поверх, но он же берёт долю с выручки (crewCredit):
     потолок домена растёт, чистые деньги — нет. Это подъём потолка, а не кран. */
  return crewMul(c,"yield")*(c.morale<.5?.5:1)*(1+crewModLv(c,"drill")*.2)*mgrCrewYield();
}
function crewBusy(c){
  /* пока он в плену или в загуле, рейсы не идут и жалованье не капает */
  if(c.state==="hostage")return "hostage";
  if(c.state==="away"&&(c.stateUntil||0)>Date.now())return "away";
  if(c.state==="away")c.state=null;
  return null;
}
function crewTick(){
  if(!G.crew.length)return;
  const now=Date.now();
  for(const c of G.crew){
    crewLuck(c);
    if(!c.tMs){c.tMs=now;continue;}
    const busy=crewBusy(c);
    if(busy){
      c.tMs=now;
      if(busy==="hostage"&&c.ransom){
        /* выкуп растёт, пока тянешь: бездействие — тоже ход, просто плохой */
        const h=(now-(c.ransomAt||now))/3600000;
        /* «Переговорщик» командира: он торгуется, и выкуп выходит вдвое дешевле.
           Считаем здесь, а не при выплате, — цену игрок должен видеть заранее. */
        c.ransom=Math.round(c.ransomBase*(1+Math.min(2.5,h*.35))*
          (mgrPerkOf("cmd","ransom")?.5:1));
      }
      continue;
    }
    const dtMs=Math.min(now-c.tMs,CREW_OFFLINE_CAP);
    if(dtMs<1000)continue;
    c.tMs=now;
    const min=dtMs/60000;
    /* на приколе, без корабля и на базе рейсов нет: там не летают.
       За простой не платят — иначе первый же нанятый уходил в долг ни за что. */
    const needsShip=c.order&&c.order.kind!=="home"&&c.order.kind!=="base";
    if(!c.order||c.order.kind==="home"||(needsShip&&!c.shipId)||c.hull<=0){
      crewRest(c,min);continue;
    }
    if(c.order.kind==="base"){crewRest(c,min);c.xp=(c.xp||0)+min*.6;continue;}
    /* копим отработанное время и закрываем им рейсы */
    const tm=crewTripMinutes(c);
    c.tripMin=(c.tripMin||0)+min;
    let trips=Math.floor(c.tripMin/tm);
    if(trips>CREW_TRIP_QUEUE){trips=CREW_TRIP_QUEUE;c.tripMin=0;}
    else c.tripMin-=trips*tm;
    for(let i=0;i<trips&&!c.gone&&!crewBusy(c);i++){
      c.xp=(c.xp||0)+tm*mgrCrewXp();
      crewTrip(c,tm);
    }
  }
  /* ушедшие вычищаются одним проходом, чтобы не рвать цикл посередине */
  for(let i=G.crew.length-1;i>=0;i--)if(G.crew[i].gone)G.crew.splice(i,1);
}
/* ── один рейс ── */
function crewTrip(c,tm){
  /* счётчик крутится здесь, а не в вызывающем: он же и есть зерно броска, и если
     его забыть увеличить, наёмник будет вечно вытягивать одну и ту же карту */
  c.trips=(c.trips||0)+1;
  const r=rng(hashi(c.seed,(c.trips|0)*7919,0xC7E));
  const danger=sysDanger(c.order.sx,c.order.sy);
  /* жалованье списывается за отработанный рейс целиком */
  crewPayroll(c,tm);
  if(c.gone)return;
  const gross=Math.round(crewPay(c)*tm*CREW_YIELD*crewEff(c)*(.85+crewLuck(c)*.2));
  const ev=rollCrewEvent(c,r,danger);
  applyCrewEvent(c,ev,r,gross,danger);
}
/* ══════════════ жалованье, долг и мораль ══════════════ */
/* Плата идёт по тому же ленивому счётчику, что и работа. Нечем платить — копится
   долг и падает мораль: сначала работают вполсилы, потом бросают приказ, потом
   уходят и забирают корабль в счёт долга. Жёстко, но с предупреждением заранее. */
function crewPayroll(c,min){
  /* За простой не платят. Раньше человек на приколе — или с приказом, но без
     выданного корабля — всё равно съедал 45% жалованья, ничего не зарабатывая:
     первый же нанятый уходил в долг и забирал корпус в счёт него. Деньги идут
     только за работу, которую он реально может делать. */
  const idle=!c.order||c.order.kind==="home"||
             (c.order.kind!=="base"&&c.order.kind!=="home"&&!c.shipId);
  if(idle)return;
  const due=crewPay(c)*min;
  if(due<=0)return;
  const pay=Math.min(G.credits,due);
  G.credits-=pay;c.spent=(c.spent||0)+pay;
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
    /* жилая часть дома: между рейсами человек живёт не в кабине, и мораль
       возвращается вдвое быстрее (12j) */
    if(c.debt<=0){c.warned=false;
      c.morale=Math.min(1,c.morale+min*.03*homeMoraleMul()*yachtMoraleMul());}
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
/* ── чем именно закрывается рейс ──
   Выработка меряется в стоимости, а не в штуках: три единицы железа (11 кр) и три
   единицы кристаллов (105 кр) — это разница в девять раз при одинаковом окладе, и
   балансировать её одним числом невозможно. Теперь рейс приносит заданную
   ценность, а во что она превратится — вопрос того, что лежит в секторе. */
function crewSectorPool(c){
  const sys=getSystem(c.order.sx,c.order.sy);
  let pool=sys.belt?sys.belt.res:(sys.planets.length?sys.planets[0].res:["iron"]);
  pool=pool.filter(k=>RES[k]&&RES[k].price>0);
  if(!pool.length)pool=["iron"];
  /* приоритет по материалу работает, только если это сырьё в секторе вообще есть */
  if(c.pref&&c.pref!=="all"&&pool.indexOf(c.pref)>=0)return [c.pref];
  return pool;
}
/* value — в кредитах; набивает трюм, пока хватает места и ценности.
   Считаем по тем же ценам, по которым потом и продадим (живой рынок ближайшей
   станции): иначе бюджет рейса и выручка расходятся, и наёмник тихо выходит в
   плюс на одной только разнице базовой цены и рыночной. Единицу дороже остатка
   не берём — округление вверх на каждом рейсе тоже складывается в доход. */
function crewFill(c,value,r){
  const cap=crewCargoMax(c),pool=crewSectorPool(c);
  const home=nearestStation(c.order.sx,c.order.sy);
  const prices=(home&&home.station)?marketFor(home):null;
  const pr=k=>(prices&&prices[k])||RES[k].price;
  let guard=900;
  while(value>0&&crewHold(c)<cap&&guard-->0){
    const k=pick(pool,r),p=pr(k);
    if(p>value){
      if(pool.every(q=>pr(q)>value))break;
      continue;
    }
    c.cargo[k]=(c.cargo[k]|0)+1;value-=p;
  }
}
function crewDeliver(c,quiet){
  const sum=crewUnload(c,true);
  if(sum>0&&!quiet)logAdd("money",c.name+" сдал груз · +"+sum.toLocaleString("ru")+" кр");
  return sum;
}
function crewCredit(c,sum){
  if(sum<=0)return 0;
  sum=Math.round(sum);
  if(c.order&&c.order.kind==="hunt"&&mgrPerkOf("cmd","bounty"))sum=Math.round(sum*1.3);
  sum-=mgrCmdCut(sum);
  earn(sum,"crew");c.earned=(c.earned||0)+sum;
  return sum;
}
/* обычная выручка рейса: добытчик привозит сырьё, остальные — деньги */
function crewPayload(c,value,r){
  if(value<=0)return 0;
  if(c.spec==="mine"){crewFill(c,value,r);return crewDeliver(c,true);}
  return crewCredit(c,value);
}
/* ══════════════ встреча в космосе ══════════════ */
/* Если игрок влетел в систему, где работает его наёмник, тот спавнится
   настоящим кораблём: тот же каркас NPC, что и у пиратов, только на своей стороне. */
function spawnAllies(){
  G.allies=[];
  for(const c of G.crew){
    if(!c.shipId||!c.order||c.order.kind==="home")continue;
    if(crewBusy(c))continue;          // пленных и загулявших в небе нет
    if(c.order.sx!==G.sx||c.order.sy!==G.sy)continue;
    const a=rng(hashi(c.seed,G.sx*131+G.sy,5))()*TAU;
    G.allies.push({c,x:G.ship.x+Math.cos(a)*420,y:G.ship.y+Math.sin(a)*420,
      vx:0,vy:0,a:a,cool:0,thrust:false});
  }
  if(G.allies.length)say("В системе работает ваш экипаж\n"+G.allies.map(A=>A.c.name).join(", "));
}
/* точка работы наёмника в текущей системе: место видно на глаз, поэтому «он
   работает» перестаёт быть строчкой в журнале и становится наблюдаемым фактом */
function allyWork(A){
  const sys=G.sys,kind=A.c.order?A.c.order.kind:"home";
  A.wt=(A.wt||0)+.004;                       // свой медленный оборот вокруг точки
  const around=(cx,cy,r)=>({x:cx+Math.cos(A.wt)*r,y:cy+Math.sin(A.wt)*r});
  if(kind==="mine"){
    if(sys.belt){
      const a=A.wt+(A.c.seed%100)/100*TAU;
      return {x:Math.cos(a)*sys.belt.orbit,y:Math.sin(a)*sys.belt.orbit};
    }
    const p=sys.planets[(A.c.seed>>>3)%Math.max(1,sys.planets.length)];
    if(p)return around(p.x,p.y,p.radius+120);
  }
  if(kind==="haul"&&sys.station)return around(sys.station.x,sys.station.y,180);
  if(kind==="hunt"){
    const r=(sys.belt?sys.belt.orbit:2000)*.8;
    const a=A.wt*1.6+(A.c.seed%50)/50*TAU;
    return {x:Math.cos(a)*r,y:Math.sin(a)*r};
  }
  return null;
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
    /* без боя наёмник летит не «рядом с игроком», а туда, где по приказу и должен
       быть: добытчик — к поясу или планете, перевозчик — к станции, боевой —
       патрулирует вокруг звезды. Иначе в режиме наблюдения видно только, как он
       без дела висит у борта. */
    let wx=sh.x+180,wy=sh.y+180;
    if(!tgt){
      const W2=allyWork(A);
      if(W2){wx=W2.x;wy=W2.y;}
    }
    const gx=tgt?tgt.x:wx,gy=tgt?tgt.y:wy;
    const dx=gx-A.x,dy=gy-A.y,d=Math.hypot(dx,dy)||1;
    const want=tgt?Math.min(d-260,3.4):clamp(d*.05,0,3.2);
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
