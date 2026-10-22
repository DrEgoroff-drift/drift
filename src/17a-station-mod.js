/* ══════════════ модули станции ══════════════ */
/* У станции был силуэт по типу: шесть типов — шесть картинок. Тип отвечает за
   то, что тут можно делать (`stTypeOf(...).tabs`), и это правильно; но две
   торговые станции в разных концах галактики выглядели одинаково, и станция
   переставала быть местом.

   Теперь тип задаёт ядро — оно и остаётся узнаваемым языком «верфь», «завод»,
   «научная», — а сверху навешивается три-шесть модулей от seed системы.
   Каждый модуль это и силуэт, и строка в терминале: игрок видит снаружи, что
   у этой станции есть кантина и ремонтный док, ещё не состыковавшись.

   Модули ничего не открывают и не закрывают: услуги по-прежнему живут в типе.
   Иначе получилось бы, что снаружи станция обещает больше, чем внутри есть. */
/* кто строил станцию (M454): хозяин земли — «чья земля» должна читаться по
   самой крупной рукотворной вещи в системе. Каждая пятая — чужой постройки
   (по зерну), дикий космос строит кто придётся. Строитель считается раз за
   сеанс, по хозяину на момент первого взгляда */
function stationBuilder(sys){
  const seed=(typeof makerBySeed==="function")?makerBySeed(sys.seed):"gt";
  const o=(typeof chronOwnerKey==="function")?chronOwnerKey(sys.sx,sys.sy):null;
  if(!o||!HULL_MAKER[o])return seed;
  return (hashi(sys.seed|0,0xB1D,5)>>>0)%5===0?seed:o;
}
const ST_MODULES=[
  {id:"cargo",  ru:"грузовой терминал", sh:"rack",  w:1.2, on:["trade","indust"]},
  {id:"habit",  ru:"жилой сектор",      sh:"drum",  w:1.4},
  {id:"cantina",ru:"кантина",           sh:"pods",  w:1.2},
  {id:"repair", ru:"ремонтный док",     sh:"hangar",w:1.1, on:["yard","trade","indust"]},
  {id:"fuel",   ru:"топливный узел",    sh:"tank",  w:1.2},
  {id:"lab",    ru:"лаборатория",       sh:"dish",  w:.9,  on:["sci","yard"]},
  {id:"med",    ru:"медотсек",          sh:"cross", w:.9},
  {id:"customs",ru:"таможня",           sh:"cage",  w:.8},
  {id:"black",  ru:"чёрный рынок",      sh:"pods",  w:.7,  dark:1},
  {id:"prison", ru:"изолятор",          sh:"cage",  w:.5,  dark:1},
  {id:"green",  ru:"оранжерея",         sh:"farm",  w:.9},
  {id:"comm",   ru:"узел связи",        sh:"mast",  w:1.0},
  {id:"mine",   ru:"рудная контора",    sh:"rack",  w:.9,  on:["indust","mine"]},
  {id:"lux",    ru:"верхний ярус",      sh:"drum",  w:.5,  rich:1}
];
function stationMods(sys){
  const S=sys.station;if(!S)return [];
  if(S.mods)return S.mods;
  const r=rng(hashi(sys.seed,0x50DD,17));
  /* чей это завод: пока от зерна системы — кто её строил. С M372 сюда придёт
     держава, которая систему держит, и строка станет её строкой */
  const by=S.by||(S.by=stationBuilder(sys));
  const ty=S.stype||"trade";
  const danger=sysDanger(sys.sx,sys.sy);
  const pool=ST_MODULES.filter(m=>!m.on||m.on.indexOf(ty)>=0);
  const out=[];
  const n=3+Math.floor(r()*4);
  for(let i=0;i<n&&pool.length;i++){
    /* тёмное чаще на окраине, «верхний ярус» — наоборот, у обжитых систем:
       по набору модулей читается, куда игрок забрался */
    let tot=0;
    for(const m of pool)tot+=m.w*(m.dark?.35+danger*1.8:1)*(m.rich?1.4-danger:1);
    let pick=r()*tot,M=pool[0];
    for(const m of pool){
      pick-=m.w*(m.dark?.35+danger*1.8:1)*(m.rich?1.4-danger:1);
      if(pick<=0){M=m;break;}
    }
    pool.splice(pool.indexOf(M),1);
    /* точка крепления: угол по кольцу и вынос от ядра. Модули разводятся по
       углам, иначе слипаются в один ком с одной стороны. */
    /* ── закон сборки завода (M369a, §19.4) ──
       Куски одни и те же, а собраны они по-разному, и это видно раньше цвета:
       ГЛАВТРАССА — стойка и барабан по кругу (как было), Орднунг — стопка
       одинаковых по одной оси, Коммуна — кольцо равных дуг, Рассвет — лоскут
       на ферме, разнокалиберный, Хай-Фронт — один хребет с мачтами поперёк,
       Компания — короб с подами вокруг него. */
    const asm=(typeof makerAssembly==="function")?makerAssembly(by):"rack";
    let ang=(i/n)*TAU+(r()-.5)*.5, dd=22+r()*16, sz=.7+r()*.7;
    if(asm==="stack"){ang=(i&1)?0:Math.PI;dd=18+i*11;sz=.95;}
    else if(asm==="ring"){ang=(i/n)*TAU;dd=30;sz=.85;}
    else if(asm==="patch"){ang=(i/n)*TAU+(r()-.5)*1.5;dd=16+r()*30;sz=.55+r()*1.1;}
    else if(asm==="spine"){ang=(i&1)?Math.PI/2:-Math.PI/2;dd=14+i*10;sz=.6+(i%3)*.2;}
    else if(asm==="block"){ang=i?(i/Math.max(1,n-1))*TAU:0;dd=i?34:0;sz=i?.7:1.5;}
    out.push({id:M.id,ru:M.ru,sh:M.sh,ang,d:dd,s:sz,ph:r()*TAU});
  }
  S.mods=out;
  return out;
}
/* строка для терминала и для подписи в системе */
function stationModsLine(sys){
  const m=stationMods(sys);
  return m.map(q=>q.ru).join(" · ");
}
