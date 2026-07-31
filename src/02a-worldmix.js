/* ══════════════ смешанные миры ══════════════ */
/* Двенадцати истинных типов хватает на двенадцать образов, но не на галактику:
   на четвёртой ледяной планете игрок перестаёт спускаться, потому что уже
   знает, что увидит. Поэтому истинный мир стал редкостью, а обычная планета
   собирается из двух: ведущий тип задаёт, чем этот мир ЯВЛЯЕТСЯ, второй —
   чем он ЗАРАЖЁН. Доля второго (`mw`) от .18 до .48; выше половины смесь
   перестала бы читаться как «эта планета с примесью той» и стала бы кашей.

   Смешивается всё, из чего складывается впечатление: палитра, шероховатость,
   тяжесть, небо, набор форм рельефа, разрез грунта, погода, облака, голос
   музыки и залежи. Смешивать что-то одно бессмысленно — вышла бы ледяная
   планета в чужих цветах, а не другой мир.

   Никакой персистентности: планета целиком выводится из seed системы, смесь
   считается там же и в сохранение не попадает. */

/* С кем тип уживается. Список не симметричен намеренно: вулканический океан
   (острова в пару) — да, океаническая пустыня — нет, это просто океан. */
const MIX_KIN={
  terran:  ["ocean","desert","jungle","ice","toxic","ruin","crystal","rocky"],
  ocean:   ["terran","ice","volcanic","jungle","toxic"],
  desert:  ["rocky","ruin","crystal","terran","metal","volcanic"],
  rocky:   ["metal","ice","crystal","desert","volcanic","ruin"],
  ice:     ["rocky","ocean","crystal","terran","metal"],
  volcanic:["rocky","toxic","metal","desert","ocean"],
  toxic:   ["jungle","volcanic","ocean","terran","ruin"],
  crystal: ["rocky","ice","desert","metal","toxic"],
  jungle:  ["terran","ocean","toxic","ruin"],
  metal:   ["rocky","ruin","volcanic","crystal","desert"],
  ruin:    ["desert","rocky","jungle","terran","metal","crystal"]
};
/* палитра смеси: обе растягиваются на общую шкалу и смешиваются по долям —
   так остаются и полосы ведущего типа, и цвет второго в них */
function mixPal(a,b,w){
  const N=6,out=[];
  for(let i=0;i<N;i++){
    const t=i/(N-1);
    const ca=ramp(a,t*.999), cb=ramp(b,t*.999);
    out.push([lerp(ca[0],cb[0],w),lerp(ca[1],cb[1],w),lerp(ca[2],cb[2],w)]);
  }
  return out;
}
function mixNum(A,B,w,keys){
  const o={};for(const k of keys)o[k]=lerp(A[k],B[k],w);return o;
}
/* собрать описание мира: ведущий тип, второй и доля второго */
function makeWorld(ak,bk,w){
  const A=TYPES[ak];
  if(!bk||bk===ak||!TYPES[bk])return {T:A,type:ak,mix:null,mw:0};
  const B=TYPES[bk];
  const T={
    ru:A.ru+", "+B.mix,
    /* атмосферу берёт ведущий: воздух — не оттенок, им либо дышат, либо нет,
       и «наполовину пригодная» ни о чём игроку не говорит */
    atm:A.atm,
    pal:mixPal(A.pal,B.pal,w),
    rough:lerp(A.rough,B.rough,w),
    grav:lerp(A.grav,B.grav,w),
    sky:[[0,1,2].map(j=>lerp(A.sky[0][j],B.sky[0][j],w)),
         [0,1,2].map(j=>lerp(A.sky[1][j],B.sky[1][j],w))],
    mix:A.mix,pure:false
  };
  return {T,type:ak,mix:bk,mw:w};
}
/* выбрать мир для планеты: сначала истинный тип (его выбирает орбита),
   потом — с какой вероятностью и чем он разбавлен */
function rollWorld(tk,r){
  /* гигант не смешивается: смесь — про поверхность, а её у него нет */
  if(tk==="gas")return {T:TYPES.gas,type:"gas",mix:null,mw:0};
  const kin=MIX_KIN[tk]||[];
  /* чистый мир — примерно каждый четвёртый: тогда «настоящая землеподобная»
     снова событие, а не фон */
  if(!kin.length||r()<.28)return {T:TYPES[tk],type:tk,mix:null,mw:0};
  const bk=kin[Math.floor(r()*kin.length)];
  return makeWorld(tk,bk,.18+r()*.30);
}
/* таблицы, разложенные по планете один раз при генерации: дальше их читают
   рельеф, геология, погода, облака и музыка, не зная про смесь ничего */
const RELIEF_KEYS=["hill","ridge","mesa","dune","crater","canyon"];
const CLOUD_KEYS=["n","soft","hi","cir"];
const VOICE_KEYS=["perc","motif","air","beacon","bass"];
/* Таблицы раскладываются ЛЕНИВО, при первом обращении, а не в getSystem:
   стартовая система строится ещё во время загрузки скрипта, когда таблицы
   облаков, погоды и музыки ниже по файлу и до них не дошло исполнение. */
function wtab(p){return p._wt?p:worldTables(p);}
function worldTables(p){
  p._wt=true;
  const tk=p.type, mk=p.mix, w=p.mw||0;
  const relA=RELIEF_MIX[tk]||RELIEF_MIX.terran;
  const clA=CLOUD_KIND[tk]||CLOUD_KIND.terran;
  const vA=WORLD_VOICE[tk]||WORLD_VOICE.rocky;
  if(!mk){
    p.relief=relA;p.geoTpl=GEO_TPL[tk]||GEO_TPL.terran;
    p.wxPool=WEATHER_BY_TYPE[tk]||[];p.cloudK=clA;p.voice=vA;
    return p;
  }
  const relB=RELIEF_MIX[mk]||relA, clB=CLOUD_KIND[mk]||clA, vB=WORLD_VOICE[mk]||vA;
  p.relief=mixNum(relA,relB,w,RELIEF_KEYS);
  p.cloudK=mixNum(clA,clB,w,CLOUD_KEYS);
  p.voice=Object.assign(mixNum(vA,vB,w,VOICE_KEYS),{
    bpm:[lerp(vA.bpm[0],vB.bpm[0],w),lerp(vA.bpm[1],vB.bpm[1],w)],
    /* тембр не смешивается: полусинус — это просто другой тембр, а не смесь.
       Его берёт тот тип, чья доля больше */
    timbre:vA.timbre});
  /* разрез: слои ведущего, но с примесью пород второго — заметная доля даёт
     право подмешать вариант в каждый слой, слабая только в рудный горизонт */
  const gA=GEO_TPL[tk]||GEO_TPL.terran, gB=GEO_TPL[mk]||gA;
  p.geoTpl=gA.map((L,i)=>{
    const alt=gB[Math.min(gB.length-1,i)]||[];
    if(i===gA.length-1)return L;                    // основание общее у всех миров
    return (w>=.3||i===gA.length-2)?L.concat(alt):L;
  });
  /* погода: пул ведущего плюс столько записей второго, сколько тянет его доля */
  const wA=WEATHER_BY_TYPE[tk]||[], wB=WEATHER_BY_TYPE[mk]||[];
  p.wxPool=wA.concat(wB.slice(0,Math.round(wB.length*w*2)));
  return p;
}
/* залежи смешанного мира: профиль ведущего плюс верхушка профиля второго */
function worldRes(tk,mk,w){
  const out=(PROFILE[tk]||[]).slice();
  if(mk){
    const n=Math.max(1,Math.round((PROFILE[mk]||[]).length*w));
    for(const k of (PROFILE[mk]||[]).slice(0,n))if(out.indexOf(k)<0)out.push(k);
  }
  return out.filter((v,j,a)=>a.indexOf(v)===j);
}
