/* ══════════════ повадки ══════════════
   То же устройство, что у птицы в игре (src/12z): повадка не анимация, а
   короткий заход, который выставляет ЦЕЛИ, а доводят до них пружины. Поэтому
   повадку можно прервать в любом кадре и ничего не сломается, а две подряд
   одинаковыми не выглядят — пружина стартует из другого места.

   ПРАВИЛО: повадка — то, что птица делает; рябь по оперению, дыхание и
   моргание идут ВСЕГДА и поверх неё. Смешивать их нельзя, иначе живое
   получается только в момент повадки, а между ними стоит чучело. */
const ACTS=[
  {id:"осмотреться",dur:2.6,w:3,run(p){
    const s=this.side;
    POSE.yawT=Math.sin(p*Math.PI)*0.85*s;
    POSE.pitchT=Math.sin(p*Math.PI)*-0.10;
    POSE.rollT=Math.sin(p*Math.PI)*0.16*s;
  }},
  {id:"наклонить голову",dur:2.2,w:2,run(p){
    const k=parBell(p);
    POSE.rollT=k*0.62*this.side;
    POSE.yawT=k*0.22*this.side;
  }},
  {id:"чистить перо",dur:3.4,w:3,run(p){
    /* птица достаёт клювом плечо: голова уходит вниз и вбок, и там мелко
       работает — не плавная дуга, а частые короткие движения */
    const k=parHold(p,.22,.22),s=this.side;
    POSE.yawT=k*1.15*s;
    POSE.pitchT=k*(0.62+Math.sin(p*46)*0.06);
    POSE.rollT=k*0.30*s;
    POSE.jawT=k*(0.12+Math.max(0,Math.sin(p*38))*0.10);
    POSE.ruffleAdd=k*0.020;
  }},
  {id:"встряхнуться",dur:1.5,w:2,run(p){
    const k=parBell(p);
    POSE.puffAdd=k*0.030;
    POSE.ruffleAdd=k*0.075;
    POSE.rollT=Math.sin(p*34)*k*0.16;
    POSE.yawT=Math.sin(p*27)*k*0.12;
  }},
  {id:"зевнуть",dur:2.4,w:1,run(p){
    const k=parHold(p,.35,.35);
    POSE.jawT=k*0.42;
    POSE.pitchT=-k*0.30;
    POSE.blinkHold=k;
  }},
  {id:"поклониться",dur:2.0,w:2,run(p){
    const k=Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI);
    POSE.bowT=k*0.16;
    POSE.pitchT=k*0.34;
  }},
  {id:"потянуться",dur:2.6,w:1,run(p){
    const k=parHold(p,.30,.40);
    POSE.puffAdd=k*0.022;
    POSE.pitchT=-k*0.22;
    POSE.bowT=-k*0.10;
    POSE.ruffleAdd=k*0.030;
  }},
  {id:"поболтать",dur:2.8,w:2,run(p){
    /* трепло на то и трепло: клюв работает, голова кивает в такт */
    const k=parHold(p,.15,.25),ch=Math.max(0,Math.sin(p*30));
    POSE.jawT=k*ch*0.30;
    POSE.pitchT=k*ch*0.12-k*0.05;
    POSE.yawT=k*Math.sin(p*7)*0.16;
  }}
];
function parBell(p){return Math.sin(clamp(p,0,1)*Math.PI);}
/* ровное «плато» с мягким входом и выходом: повадка держится, а не мигает */
function parHold(p,in_,out){
  if(p<in_)return smooth(0,1,p/in_);
  if(p>1-out)return smooth(0,1,(1-p)/out);
  return 1;
}
const ACT={cur:null,t0:0,next:2.0,last:""};
function actsStep(){
  const T=POSE.t;
  POSE.jawT=0;POSE.bowT=0;POSE.puffAdd=0;POSE.ruffleAdd=0;POSE.blinkHold=0;
  if(ACT.cur){
    const p=(T-ACT.t0)/ACT.cur.dur;
    if(p>=1){ACT.cur=null;ACT.next=T+1.4+Math.random()*3.6;}
    else{ACT.cur.run(p);return;}
  }
  if(POSE.still||T<ACT.next)return;
  /* выбор с весами и без повторов подряд: одна и та же повадка дважды — это
     уже не повадка, а тик */
  let pool=ACTS.filter(a=>a.id!==ACT.last);
  let sum=0;for(const a of pool)sum+=a.w;
  let r=Math.random()*sum;
  let pick=pool[0];
  for(const a of pool){r-=a.w;if(r<=0){pick=a;break;}}
  pick.side=Math.random()<.5?-1:1;
  ACT.cur=pick;ACT.t0=T;ACT.last=pick.id;
}
