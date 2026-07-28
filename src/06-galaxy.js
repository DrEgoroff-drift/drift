/* ══════════════ галактика ══════════════ */
function starAt(sx,sy){return (sx===0&&sy===0)||h01(sx,sy,4242)<.52;}
const SYS_CACHE=new Map();
/* Типы станций (M44). Тип — не картинка, а набор возможностей: `tabs` решает,
   какие вкладки вообще существуют на этой станции, множители — насколько выгодно
   тут торговать, чинить и заправляться. Вес зависит от опасности системы:
   в глубине фронтира торговых узлов почти нет, зато аванпосты и заправки — норма. */
const ST_TYPES=[
  {id:"trade",  ru:"Торговый узел",        tabs:["market","barter","yard","mods"],
   mkt:1.08, fuel:1,    rep:1,    w:d=>2.6-d*1.9},
  {id:"indust", ru:"Промышленный комбинат",tabs:["market","mods"],
   mkt:.99,  fuel:.92,  rep:.5,   w:d=>1.5-d*.4},
  {id:"yard",   ru:"Верфь",                tabs:["market","yard","mods","barter"],
   mkt:.95,  fuel:1.08, rep:.75,  w:d=>1.2-d*.7},
  {id:"sci",    ru:"Научная станция",      tabs:["market","lab","mods"],
   mkt:.93,  fuel:1.08, rep:1,    w:d=>1.2-d*.8},
  {id:"outpost",ru:"Пограничный аванпост", tabs:["market","mods","barter"],
   mkt:.9,   fuel:1.22, rep:1.25, w:d=>.2+d*2.8},
  {id:"fuel",   ru:"Заправочная станция",  tabs:[],
   mkt:1,    fuel:.78,  rep:1.1,  w:d=>1.6+d*1.1}
];
function stTypeOf(id){return ST_TYPES.find(t=>t.id===id)||ST_TYPES[0];}
/* один вызов r() — ровно как прежний pick(), поэтому поток случайных чисел
   не сдвигается и уже сгенерированные системы остаются прежними */
function pickStType(r,danger){
  const w=ST_TYPES.map(t=>Math.max(.05,t.w(danger)));
  let tot=0;for(const v of w)tot+=v;
  let x=r()*tot;
  for(let i=0;i<w.length;i++){x-=w[i];if(x<=0)return ST_TYPES[i];}
  return ST_TYPES[ST_TYPES.length-1];
}
/* эллиптическая орбита по Кеплеру: ang — средняя аномалия (растёт равномерно),
   решаем уравнение Кеплера в 4 итерациях Ньютона — этого достаточно при ecc<.4 */
function keplerPos(a,e,M,argp){
  let E=M;
  for(let i=0;i<4;i++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const x=a*(Math.cos(E)-e), y=a*Math.sqrt(1-e*e)*Math.sin(E);
  const ca=Math.cos(argp),sa=Math.sin(argp);
  return {x:x*ca-y*sa,y:x*sa+y*ca};
}
function getSystem(sx,sy){
  const key=sx+","+sy;
  if(SYS_CACHE.has(key))return SYS_CACHE.get(key);
  const seed=hashi(sx,sy,90210), r=rng(seed);
  const cls=STAR_CLASS[Math.min(4,Math.floor(Math.pow(r(),1.6)*5))];
  const sys={sx,sy,seed,key,name:genName(r),cls,radius:46+r()*54,planets:[],station:null,belt:null};
  const n=1+Math.floor(r()*6);
  let orbit=340;
  for(let i=0;i<n;i++){
    orbit+=200+r()*300;
    const far=orbit/2200, u=r();
    let tk;
    if(far>.62) tk=u<.5?"gas":(u<.8?"ice":"rocky");
    else if(far<.2) tk=u<.5?"volcanic":(u<.8?"rocky":"desert");
    else tk=u<.24?"terran":(u<.4?"ocean":(u<.6?"desert":(u<.78?"rocky":"toxic")));
    const T=TYPES[tk], pseed=hashi(seed,i*7919,31337), pr2=rng(pseed);
    /* газовые гиганты заметно крупнее каменистых миров — пропорции читаются на глаз */
    const radius=tk==="gas"?(78+r()*58):(18+r()*30);
    const nMoons=tk==="gas"?Math.floor(pr2()*4):(pr2()<.35?1:0);
    const moons=[];
    for(let m=0;m<nMoons;m++){
      const mseed=hashi(pseed,m*1319+7,0x00E), mr=rng(mseed);
      const mtk=pick(["rocky","ice"],mr);
      moons.push({
        key:key+":"+i+"m"+m,parentIdx:i,idx:m,type:mtk,T:TYPES[mtk],seed:mseed,
        name:sys.name+" "+ROMAN[i]+"-"+(m+1),
        radius:3+mr()*6,orbit:radius*(2.2+m*1.6)+mr()*20,
        ecc:mr()*.12,argp:mr()*TAU,
        ang:mr()*TAU,spd:(mr()<.5?-1:1)*.0026/Math.pow(1+m,1.1),
        rough:clamp(TYPES[mtk].rough*(.6+mr()*.8),0,1.2),
        moons:[],x:0,y:0,vx:0,vy:0,tex:null,
        res:PROFILE[mtk].filter((v,j,a)=>a.indexOf(v)===j)
      });
    }
    sys.planets.push({
      key:key+":"+i,idx:i,type:tk,T,seed:pseed,
      name:sys.name+" "+ROMAN[i],radius,orbit,
      ecc:.04+pr2()*.28,argp:pr2()*TAU,
      /* орбитальная скорость снижена в разы против прежней — планеты кружат неспешно */
      ang:pr2()*TAU,spd:(pr2()<.5?-1:1)*0.00014/Math.pow(orbit/500,1.4),
      rough:clamp(T.rough*(.6+pr2()*.8),0,1.2),
      moons,x:0,y:0,vx:0,vy:0,tex:null,
      res:PROFILE[tk].filter((v,j,a)=>a.indexOf(v)===j)
    });
  }
  if(r()<.78){
    const rich=[];
    const nres=2+Math.floor(r()*3);
    for(let i=0;i<nres;i++){const k=pick(BELT_RES,r);if(rich.indexOf(k)<0)rich.push(k);}
    sys.belt={orbit:orbit+240+r()*320,seed:hashi(seed,777,555),res:rich,
      name:"пояс "+genName(r)};
  }
  if((sx===0&&sy===0)||r()<.5){
    const prices={};
    for(const k of ORE_KEYS)prices[k]=Math.max(3,Math.round(RES[k].price*(.72+r()*.72)));
    const r2=rng(hashi(sx,sy,0xB10FA));
    for(const k of FAUNA_RES)prices[k]=Math.max(3,Math.round(RES[k].price*(.72+r2()*.72)));
    const stName=genName(r);
    let ST=pickStType(r,sysDanger(sx,sy));
    /* в родной системе всегда полноценный узел: стартовать у заправки,
       где нет ни верфи, ни рынка, — значит остаться без первого шага */
    if(sx===0&&sy===0)ST=stTypeOf("trade");
    sys.station={name:stName,stype:ST.id,kind:ST.ru,
      orbit:sys.radius+240+r()*280,ang:r()*TAU,spd:.00055,prices,
      fuelPrice:Math.max(2,Math.round((5+r()*7)*ST.fuel)),x:0,y:0,vx:0,vy:0};
  }
  sys.desc=genDesc(r,sys);
  SYS_CACHE.set(key,sys);
  return sys;
}
