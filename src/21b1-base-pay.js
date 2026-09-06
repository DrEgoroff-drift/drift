/* ══════════════ плата и блокада (M403, DESIGN-base §23, §42, §43) ══════════════
   Трудность оправдывается только платой, и плата должна быть огромной, не став
   при этом инфляцией. Экономику этой игры однажды уже сожгли ровно такой
   формой — «солнечной фермой», где деньги делали деньги без внимания и без
   предела (M240). Поэтому правило платы одно:

     ХОРОШАЯ БАЗА НЕ ПЕЧАТАЕТ КРЕДИТЫ. ОНА ДЕЛАЕТ ТО, ЧЕГО НЕ КУПИТЬ.

   Три яруса (§23.1). Работающая база окупает себя рудой — это уже есть с
   M390. Отлаженная даёт вдвое-втрое больше через глубину, роли и передел на
   месте — это M392–M396. А решённая делает УНИКАЛЬНОЕ: то, чего нет ни на
   одном прилавке (`price:0`, §42) и что нужно верфи, лаборатории, третьему
   ярусу холдинга и оснастке военного слоя. Список — ниже, и почему он не тот,
   что назван в §23.1, — там же.

   И блокада (§43). Держава закрывает систему — ни топлива, ни ремонта, ни
   частей, а ближайшая открытая станция в четырёх прыжках не в ту сторону. База
   при этом остаётся ЕДИНСТВЕННЫМ снабжением, которым игрок распоряжается сам:
   лёд становится топливом, мастерская чинит корпус. Летящий сквозь войну — это
   тот, у кого есть база; у кого её нет, тот стоит и смотрит. */
/* ── что именно делает решённая база ──
   §23.1 называет иридий и ксенобиом, и это оказалось единственным местом, где
   замысел спорит сам с собой: у обоих в `RES` есть ЦЕНА, их берёт любой
   прилавок. База, которая их делает, печатала бы кредиты — то самое, что §23
   запрещает первой же строкой. Поэтому список собран из того, что и правда
   нигде не купить (`price:0`), и каждая строка отвечает своему миру:

     вулкан на глубине с плавильней  → техкомпоненты (оснастка баз и приборы);
     ядовитый мир с лабораторией     → гидразин (та самая химия из §43);
     ледяной мир с криоцехом         → криоген;
     тяжёлый мир на глубине          → карбид.

   Набор проверяет цену каждого: строка, у которой она не ноль, — это не плата,
   а инфляция. */
const UNIQ=[
  {k:"techcomp",ru:"техкомпоненты",need:{type:"volcanic",deep:3,cell:"refinery"},
   note:"точная сборка идёт только там, где тепло даровое"},
  {k:"hydrazine",ru:"гидразин",  need:{type:"toxic",deep:0,cell:"lab"},
   note:"такая химия выходит только из такой атмосферы"},
  {k:"cryo",    ru:"криоген",    need:{ice:1.5,deep:0,cell:"cryo"},
   note:"дёшев только там, где холод и так снаружи"},
  {k:"carbide", ru:"карбид",     need:{grav:1.35,deep:3,cell:"drill"},
   note:"на тяжёлом мире бур достаёт то, чего на лёгком нет"}
];
const UNIQ_EVERY=4;          /* раз в столько смен одна единица */
function baseHasCell(B,k){
  for(const cell of (B.cells||[]))if(cell&&cell.hp>0&&cell.k===k)return true;
  return false;
}
/* что именно умеет ЭТА база — по формуляру, глубине и тому, что построено */
function baseUnique(B){
  const out=[];
  if(!B)return out;
  const D=(typeof baseDialOf==="function")?baseDialOf(B):null;
  const deep=(typeof baseDepth==="function")?baseDepth(B):0;
  for(const U of UNIQ){
    const n=U.need;
    if(n.type&&(B.type!==n.type))continue;
    if(n.ice!==undefined&&!(D&&D.ice>=n.ice))continue;
    if(n.grav!==undefined&&!(D&&D.grav>=n.grav))continue;
    if(deep<(n.deep|0))continue;
    if(n.cell&&!baseHasCell(B,n.cell))continue;
    out.push(U);
  }
  return out;
}
/* ── уникальное за смену ──
   Понемногу и медленно: это не доход, а поставка. Одна единица в четыре смены
   на каждое умение — за сутки набирается горсть, за неделю партия. */
function baseUniqStep(B,n){
  const L=baseUnique(B);
  if(!L.length)return 0;
  if((n%UNIQ_EVERY)!==0)return 0;
  const P=(typeof basePower==="function")?basePower(B):{eff:1};
  if(P.eff<.5)return 0;                    /* на голодном пайке это не идёт */
  let made=0;
  for(const U of L){
    B.pool[U.k]=(B.pool[U.k]|0)+1;made++;
  }
  if(made)baseLog(B,"uniq",n,{what:L.map(x=>x.ru).join(", ")});
  return made?1:0;
}
/* ── блокада (§43) ──
   Фронт военного слоя закрывает систему. Тогда база — единственный прилавок,
   который остался у игрока, и стоит он по себестоимости. */
function baseBlocked(B){
  if(!B)return false;
  return !!(typeof chronFront==="function"&&chronFront(B.sx,B.sy));
}
/* лёд в баки: своё топливо из своего льда, по себестоимости */
const FUEL_PER_ICE=2;
function baseRefuel(B){
  const st=(typeof stat==="function")?stat():{fuelMax:100};
  const need=Math.ceil((st.fuelMax||100)-G.fuel);
  if(need<=0){say("Баки полны");return 0;}
  const have=B.pool.ice|0;
  if(have<=0){say("На складе базы нет льда");return 0;}
  const take=Math.min(have,Math.ceil(need/FUEL_PER_ICE));
  B.pool.ice=have-take;
  G.fuel=Math.min(st.fuelMax||100,G.fuel+take*FUEL_PER_ICE);
  tell("good","Заправка со своего склада: "+take+" льда",
    "СВОЁ ТОПЛИВО\nлёд "+take+" → бак "+Math.round(G.fuel)+
    (baseBlocked(B)?"\nсистема закрыта — больше взять негде":""));
  return take;
}
/* мастерская чинит корпус: свои сплавы и своя работа */
const HULL_PER_ALLOY=14;
function baseRepairShip(B){
  if(!baseHasCell(B,"shop")){say("Нужна мастерская");return 0;}
  const st=(typeof stat==="function")?stat():{hullMax:100};
  const need=Math.ceil((st.hullMax||100)-G.hull);
  if(need<=0){say("Корпус цел");return 0;}
  const have=B.pool.alloy|0;
  if(have<=0){say("На складе базы нет сплавов");return 0;}
  const take=Math.min(have,Math.ceil(need/HULL_PER_ALLOY));
  B.pool.alloy=have-take;
  G.hull=Math.min(st.hullMax||100,G.hull+take*HULL_PER_ALLOY);
  if(typeof seamAdd==="function")seamAdd();
  tell("good","Мастерская базы: −"+take+" сплавов",
    "СВОЙ РЕМОНТ\nсплавы "+take+" → корпус "+Math.round(G.hull));
  return take;
}
/* строка для стола и сцены: что эта база умеет и закрыта ли система */
function basePayLine(B){
  const out=[];
  const U=baseUnique(B);
  if(U.length)out.push("ДЕЛАЕТ САМА: "+U.map(x=>x.ru).join(", ").toUpperCase());
  if(baseBlocked(B))out.push("СИСТЕМА ЗАКРЫТА · БАЗА — ЕДИНСТВЕННЫЙ ПРИЛАВОК");
  return out.join(" · ");
}
