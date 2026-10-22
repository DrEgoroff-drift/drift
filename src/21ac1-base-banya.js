/* ══════════════ баня и чайный гриб (M497, PLAN st. 7, DESIGN-base §6/§10) ══════════════
   Автор, 14.09: «баня на базе; чайный гриб как событие». Два дополнения к
   базе, оба про людей, а не про цифры выработки.

   БАНЯ — отсек. Раз в шесть смен (BANYA_EVERY) — банный вечер: берёт воду из
   запаса базы, и после него шесть смен всей базе +3 духа, жилому по
   соседству — +8 (таблица соседства, «пар»). Усталость управляющего (ось С5
   правил о людях: изъян — это лицо усталости) снимается на BANYA_REST смен:
   после бани он «отходит» и изъян молчит. Проверка ПАЛАТЫ на базе с баней
   находит на одно нарушение меньше: инспектор «заодно попарился» — честный
   человек, любит баню. Воды нет — баня холодная, и это строка в журнале.

   ЧАЙНЫЙ ГРИБ — событие режиссёра, только на базе с живой оранжереей:
   культура разрослась, три смены харч ×2 (GRIB_BOOM), потом она ест
   органику базы по GRIB_EAT за смену, пока её не вырежут АВРАЛОМ в самой
   оранжерее. Срез — товар «Чайный гриб», Рассвет платит за него полтора
   (FAR_EAT_LAND). Аврал упущен — гриб остаётся и ест дальше: он не пожар, он
   никуда не идёт, он просто никогда не наедается. */
const BANYA_EVERY=6,BANYA_WATER=4,BANYA_GLOW=6,BANYA_REST=12,BANYA_SPIRIT=3,BANYA_PAL=40;
const GRIB_BOOM=3,GRIB_EAT=5,GRIB_CUT=[6,14];
BUILD.banya={ru:"Баня",cost:{credits:1300,alloy:3},power:-5,
  note:"банный вечер раз в шесть смен: духу лучше, управляющий отходит, инспектор мягче; ест воду"};
ADJ.push({a:"banya",b:["habitat"],k:"steam",ru:"пар",note:"+8 духа жилому: до парной два шага"});
FAR_EAT_LAND.grib=["ra",1.5];
DIR_EV.push({k:"grib",ru:"чайный гриб",warn:"в оранжерее что-то пузырится",w:1,worlds:["*"],good:1,need:"garden"});
AVR_KINDS.push({k:"grib",ru:"ЧАЙНЫЙ ГРИБ",what:"разросся",note:"лезет из грядок в коридор"});
Object.assign(BLOG,{
  bath:    (B,a)=>"банный вечер · воды −"+a.q+" · "+(a.who?"«"+a.who+" сказал: живём» ":"")+"пар до утра",
  bathcold:()=>"баня холодная: воды нет, топить нечем",
  palbanya:(B,a)=>a.rank+" "+a.who+" заодно попарился: одно нарушение «не заметил»",
  grib:    ()=>"чайный гриб разросся: харч вдвое, «а потом посмотрим»",
  gribeat: (B,a)=>"чайный гриб ест органику · −"+a.q+" · вырезать — аврал в оранжерее",
  gribcut: (B,a)=>"чайный гриб вырезан · срез "+a.q+" ед · Рассвет такое берёт"
});
function banyaLive(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="banya"&&cell.hp>0)return true;
  return false;
}
/* пар держится: банный вечер был недавно */
function banyaWarm(B,n){
  if(!B||B.bath===undefined||B.bath===null)return false;
  if(n===undefined)n=(typeof baseShift==="function")?baseShift():0;
  return banyaLive(B)&&(n-B.bath)>=0&&(n-B.bath)<BANYA_GLOW;
}
function banyaSpirit(B,n){return banyaWarm(B,n)?BANYA_SPIRIT:0;}
/* банный вечер — по номеру смены, зовёт baseShiftRun после управляющего */
function banyaStep(B,n){
  if(!banyaLive(B)||(n%BANYA_EVERY)!==0)return 0;
  if(!((typeof baseCrewN==="function")?baseCrewN(B):0))return 0;
  const L=baseLife(B);
  if((L.water|0)<BANYA_WATER){
    if(B.bathCold===n)return 0;
    B.bathCold=n;baseLog(B,"bathcold",n,{});return 1;
  }
  L.water-=BANYA_WATER;B.bath=n;
  const M=(typeof bmgrOfBase==="function")?bmgrOfBase(B):null;
  if(M&&B.mgr)B.mgr.rest=n;   /* на записи базы: bmgrOfBase порождает объект заново каждый раз */
  baseLog(B,"bath",n,{q:BANYA_WATER,who:M?M.name:""});
  return 1;
}
/* усталость управляющего: после бани изъян молчит BANYA_REST смен */
function banyaRested(M,n){return !!(M&&M.rest!==undefined&&M.rest!==null&&(n-M.rest)>=0&&(n-M.rest)<BANYA_REST);}
/* ── чайный гриб ── */
function gribOn(B){return !!(B&&B.grib);}
function gribStart(B,n){
  if(B.grib)return 0;
  B.grib={n0:n};baseLog(B,"grib",n,{});return 1;
}
function gribMul(B,n){return (B&&B.grib&&(n-B.grib.n0)<GRIB_BOOM)?2:1;}
function gribEat(B,n){
  if(!B||!B.grib||(n-B.grib.n0)<GRIB_BOOM)return 0;
  const q=Math.min(GRIB_EAT,B.pool.organics|0);
  if(q<=0)return 0;
  B.pool.organics-=q;
  if(((n-B.grib.n0)%3)===0){baseLog(B,"gribeat",n,{q});return 1;}
  return 0;
}
/* аврал в оранжерее: гриб созрел для ножа — заход начинается с него */
function gribAvral(S,B){
  if(!B||!B.grib||S.avr)return null;
  const n=(typeof baseShift==="function")?baseShift():0;
  if((n-B.grib.n0)<GRIB_BOOM)return null;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    if(cell&&cell.k==="garden"&&cell.hp>0){
      S.avr={c,r,k:"grib",t:AVR_TIME,hold:0};
      const kind=AVR_KINDS.find(k=>k.k==="grib");
      baseLog(B,"avral",n,{what:BUILD.garden.ru,ru:kind.ru});
      say("АВРАЛ · "+kind.ru+" · ОРАНЖЕРЕЯ\n"+kind.note+" · ДОЙТИ И ДЕРЖАТЬ ДЕЙСТВИЕ",220);
      sfx("ui",{f:220,to:140,d:.5,v:.35});
      return S.avr;
    }
  }
  B.grib=null;   /* оранжереи не стало — и гриба нет */
  return null;
}
function gribCut(B){
  const n=(typeof baseShift==="function")?baseShift():0;
  const r=rng(hashi(B.sx*7+B.sy,(B.idx|0)*3+1,n));
  const q=GRIB_CUT[0]+Math.floor(r()*(GRIB_CUT[1]-GRIB_CUT[0]+1));
  const got=addRes("grib",q);
  if(q-got>0)B.pool.grib=(B.pool.grib|0)+(q-got);
  B.grib=null;
  baseLog(B,"gribcut",n,{q});
  tell("good","Чайный гриб вырезан","ЧАЙНЫЙ ГРИБ ВЫРЕЗАН\nсрез "+q+" ед"+(got<q?" · "+(q-got)+" на складе базы":"")+"\nРассвет платит ×1,5");
  sfx("ui",{f:420,to:660,d:.25,v:.3});
}
BUILD_KEYS.push("banya");   /* список меню собран в 21a раньше этого файла */
