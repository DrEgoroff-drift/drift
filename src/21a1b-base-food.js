/* ══════════════ харч и дух (M393, DESIGN-base §6, §8, §16) ══════════════
   Четвёртая шкала — еда, и у неё есть то, чего нет у остальных: ВКУС. Оранжерея
   кормит хорошо, белковый бак — вдвое сытнее и скверно, и разница между ними не
   в числе на складе, а в том, что о ней думают люди.

   Пятая — дух, и он ничего не производит. Он читает остальные четыре и отвечает
   на один вопрос: сколько ещё здесь готовы терпеть. Ответ «нисколько» не
   означает смерти — он означает, что один человек соберётся и уйдёт на станцию,
   и его снова можно будет нанять. Умирать от отсутствия игрока в этой игре
   нельзя (§8): за это отвечает зимовка, и она отдельная и добровольная. */
const LIFE_FOOD=1;                       /* харча на человека за смену (§16) */
const LIFE_GARDEN={water:6,food:5,air:2,seed:4};  /* оранжерея: вода → харч и воздух */
const LIFE_VAT={organics:4,food:8};      /* белковый бак: органика → харч */
const SPIRIT_LOW=25;                     /* ниже этого дух считается упавшим */
const SPIRIT_HOLD=3;                     /* столько смен подряд — и один уходит */
const FOOD_SUPPLY={canned:{q:6,good:1},protein:{q:4,good:0}};
/* ── дух: он читает остальные шкалы и не имеет своей ── */
function baseSpirit(B,n){
  const L=baseLife(B);
  if(!baseCrewN(B))return 100;
  let s=100;
  const left=baseLifeLeft(B);
  /* общий котёл (M399): пока харч есть вообще, голодных нет — делят поровну */
  const pot=(typeof charterFed==="function")&&charterFed(B);
  if((L.food|0)<=0)s-=30;                                  /* голодно */
  else if(!pot&&L.food<baseCrewN(B)*LIFE_FOOD*3)s-=10;     /* и почти голодно */
  if(L.q==="poor")s-=12;                                   /* невкусно (§16) */
  if(baseParked(B))s-=20;                                  /* стоим */
  if(left.air<3||left.water<3)s-=15;                       /* дышать нечем */
  const b=baseHeatBand(B,n);
  s-=(b<0?-b:b)*8;                                         /* холодно или жарко */
  const P=basePower(B);
  s-=(P.habPenalty|0)*8;                                   /* жильё прижато к реактору */
  /* соседство (M396): зелень и уход поднимают, батарея под ухом роняет */
  if(typeof baseAdjSpirit==="function")s+=baseAdjSpirit(B);
  /* устав (M399): у каждого закона своя цена, и платят её духом */
  if(typeof charterSpirit==="function")s+=charterSpirit(B);
  /* закон 5 (M401): люди — не множители, и у каждой черты своя причина */
  if(typeof baseTraitSpirit==="function")s+=baseTraitSpirit(B);
  if(P.eff<.7)s-=8;                                        /* и свет мигает */
  if(L.q==="good"&&(L.food|0)>0&&!baseParked(B)&&!b)s+=10; /* а бывает и хорошо */
  return clamp(s|0,0,100);
}
/* ── один уходит (§8) ──
   Не умирает: собирается и уходит на станцию, откуда его снова можно нанять.
   Голосом в журнале, и голос этот его собственный. */
const SPIRIT_BYE=["«Больше не могу. Ухожу на станцию»","«Я не нанимался так жить»",
  "«Тут больше нечем дышать. Ушёл»","«Спасибо за всё, но я домой»"];
function baseWalkOut(B,n){
  const staff=(typeof baseStaff==="function")?baseStaff(B):[];
  if(!staff.length)return 0;
  const r=rng(hashi(B.sx*887+B.sy,B.idx*17+9,hashi(n,0x8A1E,0x5)));
  const c=staff[Math.floor(r()*staff.length)];
  const i=G.crew.indexOf(c);
  if(i>=0)G.crew.splice(i,1);
  /* ── и его снова можно нанять (разбор 0.409.1) ──
     §8 обещает «уходит на станцию и снова нанимается из обычного списка», а
     код просто вычёркивал человека: тот же не возвращался никогда. Кладём его
     туда же, куда кладут спасённых с барж, — они и есть тот механизм, по
     которому человек САМ ищет вас в любой кантине (12l-barge). */
  if(!Array.isArray(G.bargePax))G.bargePax=[];
  if(c.id&&!G.bargePax.some(p=>p.id===c.id)&&G.bargePax.length<8)
    G.bargePax.push(Object.assign({},c,{order:null,shipId:null,role:null,
      fee:Math.round((c.fee|0)*.7)||220,left:1}));
  baseLog(B,"leave",n,{who:c.name,say:pick(SPIRIT_BYE,r)});
  logAdd("warn",c.name+" ушёл с базы «"+B.name+"» — здесь стало нечем жить");
  B.low=0;
  return 1;
}
/* ── харч за смену ── */
function baseFoodStep(B,P,n){
  const L=baseLife(B),eff=clamp(P.eff,0,1);
  /* садовод (M395): две пятых сверху и обещание, что скверного харча не будет */
  const k=((eff<.5)?.5:eff)*((typeof baseFoodBoost==="function")?baseFoodBoost(B):1);
  let good=0,poor=0;
  for(const cell of B.cells){
    if(!cell||cell.hp<=0)continue;
    if(cell.k==="garden"){
      /* посадка: разовая органика на грядку. Нечем засеять — стоит пустая */
      if(!cell.sown){
        if((B.pool.organics|0)<LIFE_GARDEN.seed)continue;
        B.pool.organics-=LIFE_GARDEN.seed;cell.sown=1;
      }
      if(L.water<LIFE_GARDEN.water)continue;
      L.water-=LIFE_GARDEN.water;
      L.food=Math.min(LIFE_CAP,(L.food|0)+Math.round(LIFE_GARDEN.food*k));
      L.air=Math.min(LIFE_CAP,L.air+Math.round(LIFE_GARDEN.air*k));
      good++;
    }else if(cell.k==="vat"){
      if((B.pool.organics|0)<LIFE_VAT.organics)continue;
      B.pool.organics-=LIFE_VAT.organics;
      L.food=Math.min(LIFE_CAP,(L.food|0)+Math.round(LIFE_VAT.food*k));
      poor++;
    }
  }
  /* вкус: оранжерея перебивает бак — она кормит первым делом людей, а бак идёт
     в добавку. Ничего не выросло — вкус остаётся прежним, каким был */
  if(good)L.q="good";
  else if(poor)L.q=(typeof baseFoodKeepsGood==="function"&&baseFoodKeepsGood(B))?"good":"poor";
  return (good||poor)?1:0;
}
/* ── дух за смену: терпят, терпят и уходят ── */
function baseSpiritStep(B,n){
  if(!baseCrewN(B)){B.low=0;return 0;}
  const s=baseSpirit(B,n);
  B.spirit=s;
  /* настроение людей идёт за духом места, а не живёт отдельно от него */
  for(const c of baseStaff(B))c.morale=clamp((c.morale||1)+((s/100)-(c.morale||1))*.1,0,1);
  if(s>=SPIRIT_LOW){B.low=0;return 0;}
  B.low=(B.low|0)+1;
  if(B.low<SPIRIT_HOLD)return 0;
  return baseWalkOut(B,n);
}
/* ── много смен разом (разбор 0.409.1) ──
   Догон глубже суток считает не по одной смене, а арифметикой: столько-то
   съели, столько-то машины успели сделать, и если запас на этом кончился —
   база встала той сменой, на которой он кончился. Подробностей нет, счёт есть. */
function baseLifeBulk(B,P,shifts,n){
  if(shifts<=0)return 0;
  const L=baseLife(B),M=baseLifeMakers(B),eff=clamp(P.eff,0,1);
  const k=((eff<.5)?.5:eff)*((typeof baseLifeBoost==="function")?baseLifeBoost(B):1);
  /* производство: сколько машины успели, пока хватало льда */
  const feed=((typeof baseAdjIce==="function")?baseAdjIce(B):0)+
             (((typeof dialIceFree==="function")&&dialIceFree(B))?3:0);
  const iceNeed=Math.max(1,LIFE_LYSE.ice-feed);
  const canLyse=Math.min(shifts*M.lyse,Math.floor((B.pool.ice|0)/Math.max(1,iceNeed)));
  if(canLyse>0){
    B.pool.ice=Math.max(0,(B.pool.ice|0)-canLyse*iceNeed);
    L.air=Math.min(LIFE_CAP,L.air+Math.round(canLyse*LIFE_LYSE.air*k));
  }
  const frozen=(typeof baseFrozen==="function")&&baseFrozen(B,n);
  if(!frozen&&M.melter){
    const canMelt=Math.min(shifts*M.melter,Math.floor((B.pool.ice|0)/LIFE_MELT.ice));
    if(canMelt>0){
      B.pool.ice=Math.max(0,(B.pool.ice|0)-canMelt*LIFE_MELT.ice);
      L.water=Math.min(LIFE_CAP,L.water+Math.round(canMelt*LIFE_MELT.water*k));
    }
  }
  /* расход людьми — за все смены сразу */
  const need=baseLifeNeed(B);
  if(need.air||need.water||need.food){
    const outAir=L.air-need.air*shifts,outWater=L.water-need.water*shifts;
    L.air=Math.max(0,outAir);L.water=Math.max(0,outWater);
    L.food=Math.max(0,(L.food|0)-need.food*shifts);
    if((outAir<0||outWater<0)&&!B.park){
      /* встала на той смене, на которой запас и кончился */
      const per=Math.max(1,need.air||need.water);
      const when=n-shifts+Math.max(0,Math.floor(Math.min(L.air,L.water)/per));
      basePark(B,"empty",when,outAir<0?"воздух":"вода");
    }
  }
  /* и износ за эти смены — по той же мерке, что в подробной части */
  if(typeof baseWearStep==="function")for(let i=0;i<Math.min(shifts,24);i++)baseWearStep(B,n-i);
  return 1;
}
