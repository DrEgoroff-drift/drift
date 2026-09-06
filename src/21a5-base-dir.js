/* ══════════════ директор базы (M397, DESIGN-base §10) ══════════════
   Было два броска: налёт и буря. Оба — кости, оба ни на что не смотрели, и оба
   случались молча. Здесь они становятся ПОГОДОЙ, и разница в трёх правилах.

   ПЕРВОЕ: он предупреждает. Событие решается на смену вперёд и попадает в
   журнал заранее — «барограф падает», «на орбите чужой транспондер». Игрок,
   который тут, успеет приготовиться; игрок, которого нет, прочтёт, как готовились
   без него. Предупреждение — это не милосердие, а то, что превращает кости в
   погоду: у погоды есть небо, по которому её видно.

   ВТОРОЕ: он принадлежит планете. У каждого мира свои беды — пыльный занос на
   каменистой, холодный удар на ледяной, толчок на вулканической, выброс на
   ядовитой, — и одно событие из четырёх ДОБРОЕ. База, которая приносит только
   плохие новости, перестаёт быть местом и становится обязанностью.

   ТРЕТЬЕ: беда ходит. Пожар начинается в одной ячейке и на следующую смену
   переходит в соседнюю, если её некому тушить и между ними нет гермозатвора.
   Ровно поэтому план базы — план, а не список покупок.

   Всё это — чистые функции от НОМЕРА СМЕНЫ (M390): одна и та же смена у одной
   и той же базы разрешается одинаково, сколько раз её ни считай, и потому
   прогноз на смену вперёд можно просто ПОСЧИТАТЬ, а не хранить. */
const DIR_BASE=.06;          /* столько беды даже в самом тихом углу */
const DIR_DANGER=.10;        /* и столько добавляет опасность сектора */
const DIR_WORTH=.05;         /* и столько — то, что нажито (RimWorld) */
const DIR_WORTH_CAP=60000;   /* «нажито много» начинается отсюда */
const DIR_COLD=6;            /* смен держится холодный удар */
const DIR_DUST=4;            /* смен держится занос */
const DIR_VEIN=8;            /* смен держится жила */
/* Таблица бед и радостей. `w` — вес внутри своего мира, `good` — доброе.
   Каждое событие делает ровно то, что написано в его строке, и ничего сверх. */
const DIR_EV=[
  {k:"storm", ru:"буря",           warn:"барограф падает",              w:3,worlds:["desert","ice","toxic","volcanic","terran","ocean","rocky"]},
  {k:"raid",  ru:"налёт",          warn:"на орбите чужой транспондер",  w:3,worlds:["*"]},
  {k:"dust",  ru:"пылевой занос",  warn:"пыль на горизонте",            w:3,worlds:["rocky","desert"]},
  {k:"cold",  ru:"холодный удар",  warn:"к утру будет мороз",           w:3,worlds:["ice","ocean"]},
  {k:"quake", ru:"толчок",         warn:"порода гудит",                 w:3,worlds:["volcanic"]},
  {k:"vent",  ru:"выброс",         warn:"датчик воздуха врёт",          w:3,worlds:["toxic","gas"]},
  /* доброе — ровно четверть по весу (см. проверку в наборе) */
  {k:"barge", ru:"попутная баржа", warn:"кто-то идёт к нам",            w:2,worlds:["*"],good:1},
  {k:"vein",  ru:"жила под базой", warn:"бур пошёл легче",              w:1,worlds:["*"],good:1},
  {k:"newman",ru:"человек со стороны",warn:"кто-то идёт к нам",         w:1,worlds:["*"],good:1}
];
function dirPool(B){
  const t=(B&&B.type)||"rocky";
  return DIR_EV.filter(e=>e.worlds[0]==="*"||e.worlds.indexOf(t)>=0);
}
/* ── четверть доброго, и не «примерно» ──
   У каждого мира свой набор бед: на каменистой их три, на земной две. Если
   веса доброго оставить постоянными, доля доброго поедет от мира к миру — на
   земной вышло бы две пятых, на каменистой треть. Поэтому доброе взвешивается
   ОТ БЕД: его ровно треть от их суммы, то есть четверть от всего, на любом
   мире (§10.2). */
function dirWeights(B){
  const pool=dirPool(B);
  let bad=0,good=0;
  for(const e of pool)if(e.good)good+=e.w;else bad+=e.w;
  const kGood=good>0?(bad/3)/good:0;
  return pool.map(e=>({e,w:e.good?e.w*kGood:e.w}));
}
function dirGoodShare(B){
  const W=dirWeights(B);
  let all=0,good=0;
  for(const x of W){all+=x.w;if(x.e.good)good+=x.w;}
  return all?good/all:0;
}
/* ── сколько нажито ──
   Беда растёт вместе с тем, что есть что терять: RimWorld делает ровно так, и
   это единственный честный способ не завалить новичка и не заскучать со старой
   базой. */
function baseWorth(B){
  let w=0;
  for(const cell of (B.cells||[]))if(cell&&cell.hp>0&&BUILD[cell.k])w+=BUILD[cell.k].cost.credits;
  for(const k in (B.pool||{}))w+=(B.pool[k]|0)*((RES[k]&&RES[k].price)||6);
  if(typeof baseStaff==="function")
    for(const c of baseStaff(B))w+=600*((typeof crewSkill==="function")?crewSkill(c):1);
  return w|0;
}
function baseThreat(B){
  const d=(typeof sysDanger==="function")?sysDanger(B.sx,B.sy):0;
  const worth=clamp(baseWorth(B)/DIR_WORTH_CAP,0,1);
  return clamp(DIR_BASE+DIR_DANGER*d+DIR_WORTH*worth,0,.35);
}
/* ── что случится в эту смену ──
   Чистая функция: тот же ответ у всех и на смену вперёд. */
function baseEventAt(B,n){
  if(!B||baseParked(B))return null;       /* на консервации погоды нет: база спит */
  const r=rng(hashi(B.sx*761+B.sy,(B.idx|0)*29+3,hashi(n,0x0D18,0x4)));
  if(r()>baseThreat(B))return null;
  const W=dirWeights(B);
  let sum=0;for(const x of W)sum+=x.w;
  let t=r()*sum;
  for(const x of W){t-=x.w;if(t<=0)return x.e;}
  return W.length?W[W.length-1].e:null;
}
function baseForecast(B,n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return baseEventAt(B,n+1);
}
/* ── беда, которая ходит (§10.3) ──
   Пожар живёт в ячейке и переходит в соседнюю, если её некому тушить и между
   ними нет гермозатвора. Тушит инженер, мастерская и — с M398 — руки игрока. */
function baseSeal(B,c,r){
  const cell=baseCell(B,c,r);
  return !!(cell&&cell.hp>0&&cell.k==="seal");
}
function baseFireStart(B,c,r,n,kind){
  if(B.fire)return 0;
  B.fire={c:c|0,r:r|0,k:kind||"fire",n:n|0};
  baseLog(B,"fire",n,{what:(BUILD[(baseCell(B,c,r)||{}).k]||{ru:"отсек"}).ru});
  return 1;
}
function baseFireStep(B,n){
  const F=B.fire;
  if(!F)return 0;
  const cell=baseCell(B,F.c,F.r);
  if(!cell||cell.hp<=0){B.fire=null;return 0;}
  /* тушат: инженер, мастерская — и просто люди, если их много */
  let hands=(typeof baseRoleForce==="function")?baseRoleForce(B,"engineer"):0;
  for(const q of (B.cells||[]))if(q&&q.hp>0&&q.k==="shop")hands+=.6;
  hands+=((typeof baseCrewN==="function")?baseCrewN(B):0)*.15;
  const r=rng(hashi(B.sx*97+B.sy,(B.idx|0)*13+5,hashi(n,0x1F13,0x6)));
  cell.hp=Math.max(0,cell.hp-.18);
  if(r()<clamp(hands*.45,0,.85)){
    B.fire=null;
    baseLog(B,"fireout",n,{who:baseWho(B,"engineer")});
    return 1;
  }
  /* не потушили — идёт дальше, если есть куда и не заперто */
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(const d of dirs){
    const c2=F.c+d[0],r2=F.r+d[1];
    const nx=baseCell(B,c2,r2);
    if(!nx||nx.hp<=0)continue;
    if(baseSeal(B,c2,r2)||baseSeal(B,F.c,F.r))continue;   /* гермозатвор держит */
    F.c=c2;F.r=r2;
    baseLog(B,"firego",n,{what:BUILD[nx.k].ru});
    return 1;
  }
  return 1;
}
/* ── применить событие ── */
function baseEventApply(B,e,n){
  if(!e)return 0;
  if(e.k==="storm")return baseStorm(B,BASE_MIN,n)?1:0;
  if(e.k==="raid")return baseRaid(B,BASE_MIN,n)?1:0;
  if(e.k==="dust"){B.dust=n+DIR_DUST;baseLog(B,"dust",n);return 1;}
  if(e.k==="cold"){B.cold=n+DIR_COLD;baseLog(B,"cold",n);return 1;}
  if(e.k==="vein"){B.vein=n+DIR_VEIN;baseLog(B,"vein",n);return 1;}
  if(e.k==="quake"){
    const live=[];
    for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0)live.push(i);
    if(!live.length)return 0;
    const r=rng(hashi(B.sx*17+B.sy,(B.idx|0)*7+1,hashi(n,0x2A17,0x2)));
    const i=live[Math.floor(r()*live.length)];
    const dmg=.35+r()*.35;
    B.cells[i].hp=Math.max(0,B.cells[i].hp-dmg);
    if(typeof baseHallHit==="function")baseHallHit(B,i%BASE_COLS,(i/BASE_COLS)|0,dmg);
    baseLog(B,"quake",n,{what:BUILD[B.cells[i].k].ru});
    /* толчок — то, с чего начинается пожар: горит там, где тряхнуло */
    if(!B.fire&&B.cells[i].hp>0&&(r()<.4))baseFireStart(B,i%BASE_COLS,(i/BASE_COLS)|0,n,"fire");
    return 1;
  }
  if(e.k==="vent"){
    const L=baseLife(B);
    L.air=Math.max(0,(L.air/2)|0);
    baseLog(B,"vent",n);
    return 1;
  }
  if(e.k==="barge"){
    const pool=(B.res&&B.res.length)?B.res:["iron"];
    const r=rng(hashi(B.sx*29+B.sy,(B.idx|0)*11+2,hashi(n,0x0BA9,0x8)));
    const k=pick(pool,r),q=8+Math.floor(r()*14);
    B.pool[k]=(B.pool[k]|0)+q;
    baseLog(B,"barge",n,{q,what:RES[k].ru.toLowerCase()});
    return 1;
  }
  if(e.k==="newman"){
    if(B.guest)return 0;
    const seed=hashi(B.sx,B.sy,n)>>>0,rr=rng(seed);
    const roles=(typeof ROLE_KEYS!=="undefined")?ROLE_KEYS:["driller"];
    B.guest={name:(typeof genName==="function")?genName(rr):"Человек",
      role:pick(roles,rr),seed,n};
    baseLog(B,"guest",n,{who:B.guest.name});
    return 1;
  }
  return 0;
}
/* ── последствия, которые держатся ── */
function baseDusty(B,n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return (B.dust|0)>n;
}
function baseColdHit(B,n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return (B.cold|0)>n?-20:0;         /* −2 в десятых (§10) */
}
function baseVein(B,n){
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return (B.vein|0)>n?1.5:1;
}
/* ── одна смена директора ── */
function baseDirStep(B,n){
  let said=0;
  said|=baseFireStep(B,n)?1:0;
  said|=baseEventApply(B,baseEventAt(B,n),n)?1:0;
  /* прогноз на следующую смену — то самое небо, по которому видно погоду */
  const f=baseForecast(B,n);
  if(f){baseLog(B,"warn",n,{warn:f.warn});said=1;}
  return said;
}
/* строка для сцены: что обещает завтра */
function baseDirLine(B){
  const f=baseForecast(B);
  const out=[];
  if(f)out.push("ПРОГНОЗ: "+f.warn.toUpperCase());
  if(B.fire)out.push("ГОРИТ · ОТСЕК "+((B.fire.c|0)+1)+":"+((B.fire.r|0)+1));
  if(baseDusty(B))out.push("ЗАНОС · БУР СТОИТ");
  if(baseColdHit(B))out.push("ХОЛОДНЫЙ УДАР");
  if(baseVein(B)>1)out.push("ЖИЛА · БУР ИДЁТ ЛЕГЧЕ");
  return out.join(" · ");
}
