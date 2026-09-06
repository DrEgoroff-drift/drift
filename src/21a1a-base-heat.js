/* ══════════════ тепло, глубина, криоген (M392, DESIGN-base §4, §7, §16) ══════════════
   Третья шкала — единственная ДВУСТОРОННЯЯ, и в этом весь смысл: односторонняя
   была бы просто второй энергией. У базы есть полоса покоя ±3, и по обе стороны
   от неё своя беда:

     мороз  — вода не тает, люди медленнее: ледоплавка стоит, выработка падает;
     жара   — техника изнашивается, бур встаёт.

   Складывается тепло из четырёх слагаемых, и все они на виду: мир (лёд −2,
   вулкан +2), сами машины (реактор +6, бур +3, электролизёр +2), глубина
   (+0.4 за ряд) и то, чем его сбрасывают, — радиатор (−8) и криоцех (−14).
   Отсюда и вся игра §16: пять шкал спорят, и порядка стройки, который устроил
   бы все пять, не существует.

   Считаем в ДЕСЯТЫХ и целыми: 0.4 за ряд — это 4, и никакой дробной
   арифметики, которая потом разойдётся у двух клиентов. */
const HEAT_WORLD={ice:-20,ocean:-10,terran:0,rocky:0,desert:10,volcanic:20,toxic:10,gas:0};
const HEAT_CELL={reactor:60,drill:30,lyse:20,melter:-10,refinery:20,lab:10,
  radiator:-80,cryo:-140};
const HEAT_ROW=4;            /* десятых за каждый ряд ниже первого */
const HEAT_OK=30;            /* полоса покоя: ±3 (§4) */
const HEAT_HARD=100;         /* за этой чертой беда становится настоящей */
const HEAT_WORST=180;        /* а за этой бур встаёт совсем */
/* Пороги выбраны по существующей базе, а не из головы: реактор с буром — это
   +9, то есть КАЖДАЯ база, которая у игроков уже стоит. Она обязана попасть в
   первую ступень (щиплет: −15 % выработки), а не во вторую, и лечиться одним
   радиатором за 900 кр: −8 приводит её ровно в полосу покоя. Пример из §16 —
   пятеро на +11 — попадает во вторую и требует второго радиатора, как там и
   написано. Веха, которая молча уронила бы добычу вдвое всем сразу, — это не
   «шкала заработала», а отнятое заработанное. */
const HEAT_CRYO=60;          /* сколько холода даёт единица криогена (§16) */
const HEAT_CRYO_SH=12;       /* и на сколько смен его хватает */
const CRYO_RECIPE={volatiles:3,cryo:1};   /* криоцех за смену */
function baseCryoOn(B,n){
  if(!B.cryo)return 0;
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return (B.cryo.until|0)>n?(B.cryo.q|0):0;
}
/* глубина базы — по самому нижнему построенному ряду: база сидит в горе, и
   греет её порода, а не число отсеков */
function baseDepth(B){
  let deep=0;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(cell&&cell.hp>0&&r>deep)deep=r;
  }
  return deep;
}
function baseHeat(B,n){
  /* формуляр (M400, §21.1): основание тепла — ручка планеты, а не тип по
     таблице. Тип в ней и так учтён, но у двух каменистых миров теперь может
     быть разное небо, и это главное, ради чего формуляр заводили */
  let h=(typeof dialHeat==="function")?dialHeat(B)
       :((HEAT_WORLD[B.type]!==undefined)?HEAT_WORLD[B.type]:0);
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(!cell||cell.hp<=0)continue;
    let v=HEAT_CELL[cell.k]||0;
    /* холодилка холодит, только пока ей есть что перегонять: криоцех без газа —
       это не бесплатный радиатор, а стоящий цех */
    if(cell.k==="cryo"&&(B.pool.volatiles|0)<CRYO_RECIPE.volatiles)v=0;
    h+=v;
  }
  h+=baseDepth(B)*HEAT_ROW;
  /* вытяжка (M396): радиатор над реактором в одной колонке снимает ещё */
  if(typeof baseAdjHeat==="function")h+=baseAdjHeat(B);
  h-=baseCryoOn(B,n);
  /* холодный удар (M397): шесть смен всё выстыло */
  if(typeof baseColdHit==="function")h+=baseColdHit(B,n);
  return h;
}
/* полосы: 0 покой · ±1 неприятно · ±2 плохо · ±3 бур встал.
   Три ступени, а не две, по прозаической причине: реактор с буром и без
   радиатора — это уже +9, то есть КАЖДАЯ существующая база игрока. Уронить им
   всем добычу вдвое одной вехой — это не «шкала заработала», это отнять
   заработанное. Поэтому первая ступень щиплет, вторая кусает, а встаёт бур
   только там, где база и правда стоит в печке. */
function baseHeatBand(B,n){
  const h=baseHeat(B,n),a=h<0?-h:h,s=h<0?-1:1;
  if(a>HEAT_WORST)return 3*s;
  if(a>HEAT_HARD)return 2*s;
  if(a>HEAT_OK)return 1*s;
  return 0;
}
/* что тепло делает с выработкой: мороз замедляет людей, жара доводит до
   остановки бура */
function baseHeatMul(B,n){
  const b=baseHeatBand(B,n);
  if(b===0)return 1;
  const a=b<0?-b:b;
  return a===1?.85:(a===2?.6:0);
}
/* мороз: вода не тает. Первая ступень холода уже её держит — это её главное
   свойство, а не «немного медленнее» */
function baseFrozen(B,n){return baseHeatBand(B,n)<0;}
/* жара: техника изнашивается — по одной ячейке за смену и всегда одной и той
   же для одной и той же смены */
function baseHeatWear(B,n){
  const h=baseHeat(B,n);
  /* точит только НАСТОЯЩАЯ жара, и точит медленно: у базы в печке отсек
     выбивает за полсотни смен, у просто тёплой — никогда */
  if(h<=HEAT_HARD)return 0;
  const live=[];
  for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0)live.push(i);
  if(!live.length)return 0;
  const r=rng(hashi(B.sx*577+B.sy,B.idx*13+2,hashi(n,0x4EA7,0x3)));
  const i=live[Math.floor(r()*live.length)];
  const was=B.cells[i].hp;
  B.cells[i].hp=Math.max(0,was-Math.min(.08,(h-HEAT_HARD)/3000));
  if(was>0&&B.cells[i].hp<=0){
    baseLog(B,"wear",n,{what:BUILD[B.cells[i].k].ru});
    logAdd("warn","База «"+B.name+"»: жара доконала отсек — "+BUILD[B.cells[i].k].ru);
    return 1;
  }
  return 0;
}
/* криоцех: газы в криоген, и он же — самый сильный холод на базе */
function baseCryoMake(B,P,n){
  let cells=0;
  for(const cell of B.cells)if(cell&&cell.hp>0&&cell.k==="cryo")cells++;
  if(!cells)return 0;
  let made=0;
  for(let i=0;i<cells;i++){
    if((B.pool.volatiles|0)<CRYO_RECIPE.volatiles)break;
    B.pool.volatiles-=CRYO_RECIPE.volatiles;
    B.pool.cryo=(B.pool.cryo|0)+CRYO_RECIPE.cryo;
    made+=CRYO_RECIPE.cryo;
  }
  if(made)baseLog(B,"cryo",n,{q:made});
  return made?1:0;
}
/* строка о тепле: знак, число и что оно значит */
function baseHeatLine(B){
  const h=baseHeat(B),b=baseHeatBand(B);
  const s=(h>0?"+":"")+(h/10).toFixed(1);
  const a=b<0?-b:b;
  return "тепло "+s+(b===0?" · в норме":
    (b>0?" · жарко"+(a===3?": бур встал, техника горит":
                     (a===2?": бур вполсилы, техника изнашивается":": бур немного медленнее")):
         " · холодно"+(a===3?": вода не тает, люди еле ходят":
                       (a===2?": вода не тает, работа медленнее":": вода не тает"))));
}
