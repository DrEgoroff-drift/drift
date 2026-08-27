/* ══════════════ повадки ══════════════
   Таблица перенесена из игры (src/12z-parrot-acts) один в один: те же названия,
   веса, длительности и настроения. Разница только в том, во что они упираются:
   в игре это степени свободы двумерного рисунка, здесь — суставы модели.

   ПРАВИЛО (оттуда же): повадка не анимация, а короткий заход, который каждый
   кадр выставляет ЦЕЛИ. Доводят до целей пружины, поэтому повадку можно
   оборвать в любом кадре и ничего не сломается. Часть повадок бьёт по
   СКОРОСТИ (flapV, hopV, crestV) — так «хлопнуть крыльями» выходит ударом, а
   не плавным подъёмом.

   Настроения те же три: покой, взвинчена (x) — только когда её задели, сонная
   (s) — копится сама и сбрасывается тычком. */
function parBell(p){return Math.sin(clamp(p,0,1)*Math.PI);}
function parHold(p,in_,out){
  in_=in_===undefined?.25:in_; out=out===undefined?in_:out;
  if(p<in_)return smooth(0,1,p/in_);
  if(p>1-out)return smooth(0,1,(1-p)/out);
  return 1;
}
/* шаг в игре считался в пикселях; здесь — в единицах птицы */
const STEP_K=0.0055;

const ACTS=[
/* ── осмотреться и переступить: из этого состоит покой ── */
{ru:"осмотреться",w:9,d:2.6,m:"",f:(p,S)=>{POSE.yawT=Math.sin(p*6.283)*0.80;}},
{ru:"наклон головы",w:9,d:2.2,m:"",f:(p,S)=>{
  if(!S.s)S.s=Math.random()<.5?-1:1;
  POSE.rollT=parBell(p)*0.62*S.s;}},
{ru:"долгий наклон",w:5,d:3.4,m:"c",f:(p,S)=>{
  POSE.rollT=parHold(p,.22,.3)*.62;POSE.yawT=.30;}},
{ru:"переступить",w:8,d:1.9,m:"",f:(p,S)=>{
  if(!S.d)S.d=(Math.random()<.5?-1:1)*(8+Math.random()*16);
  POSE.stepT=parHold(p,.3,.3)*S.d*STEP_K;POSE.footUpT=parBell(p)*.5;}},
{ru:"пройтись по жёрдочке",w:4,d:3.6,m:"",f:(p,S)=>{
  if(!S.d)S.d=(Math.random()<.5?-1:1)*(22+Math.random()*14);
  POSE.stepT=Math.sin(p*3.14159)*S.d*STEP_K;
  POSE.footUpT=Math.abs(Math.sin(p*12.5))*.45;POSE.shiver=Math.abs(Math.sin(p*12.5))*.10;}},
{ru:"переминаться",w:6,d:2.4,m:"",f:(p,S)=>{
  POSE.stepT=Math.sin(p*9.4)*4*STEP_K;POSE.footUpT=Math.abs(Math.sin(p*9.4))*.4;}},
/* ── уход за собой: то, чем птица занята большую часть суток ── */
{ru:"поджать лапу",w:7,d:4.5,m:"",f:(p,S)=>{
  POSE.footUpT=parHold(p,.12,.14);POSE.tuckT=parHold(p)*.35;}},
{ru:"сменить лапу",w:4,d:3.2,m:"",f:(p,S)=>{
  if(!S.o&&p>.5){S.o=1;POSE.footSide=-POSE.footSide;}
  POSE.footUpT=p<.45?parHold(p/.45,.2,.2):(p>.55?parHold((p-.55)/.45,.2,.2):0);}},
{ru:"потянуть крыло",w:6,d:2.4,m:"",f:(p,S)=>{
  POSE.stretchT=parBell(p);POSE.fanT=parBell(p)*.4;POSE.flapT=parBell(p)*.25;}},
{ru:"потянуться целиком",w:4,d:3.0,m:"",f:(p,S)=>{
  POSE.stretchT=parHold(p,.3,.3);POSE.fanT=parHold(p,.3,.3)*.8;
  POSE.flapT=parHold(p,.3,.3)*.45;
  POSE.footUpT=parHold(p,.35,.35)*.7;POSE.jawT=parBell(p)*.35;}},
{ru:"почесать голову",w:5,d:3.0,m:"",f:(p,S)=>{
  /* лапа к щеке, голова — навстречу лапе, и мелкая тряска, пока чешет */
  const h=parHold(p,.25,.25);
  POSE.footUpT=h;POSE.tuckT=h*.55;POSE.rollT=h*.42*POSE.footSide;
  POSE.shiver=h*.6+Math.sin(p*40)*h*.3;}},
{ru:"чистить грудь",w:7,d:3.2,m:"",f:(p,S)=>{
  POSE.bowT=parHold(p,.2,.2)*.50;POSE.rollT=Math.sin(p*15.7)*.18;
  POSE.pitchT=parHold(p,.2,.2)*.55;
  if(Math.random()<.14)POSE.peck=.6;}},
{ru:"чистить хвост",w:4,d:3.4,m:"",f:(p,S)=>{
  POSE.bowT=parHold(p,.22,.22)*.62;POSE.fanT=parHold(p,.25,.25)*.7;
  POSE.yawT=parHold(p,.22,.22)*1.15*POSE.footSide;
  POSE.rollT=Math.sin(p*12)*.22;}},
{ru:"перебрать перо",w:6,d:2.9,m:"",f:(p,S)=>{
  const h=parHold(p,.25,.25);
  if(!S.s)S.s=Math.random()<.5?-1:1;
  POSE.yawT=h*1.05*S.s;
  POSE.pitchT=h*(.52+Math.sin(p*46)*.06);POSE.jawT=h*.14;
  if(Math.random()<.10)POSE.peck=.5;}},
{ru:"распушиться",w:6,d:2.0,m:"",f:(p,S)=>{
  POSE.ruffleAdd+=parBell(p)*.055;POSE.puffAdd=parBell(p)*.030;POSE.tuckT=parBell(p)*.5;}},
{ru:"встряхнуться",w:6,d:1.5,m:"",f:(p,S)=>{
  POSE.shiver=parBell(p)*1.3;POSE.fanT=parBell(p)*.5;
  if(!S.o&&p>.3){S.o=1;POSE.flapV+=6;POSE.crestV+=8;}}},
{ru:"почистить клюв",w:5,d:2.6,m:"",f:(p,S)=>{
  POSE.bowT=parHold(p,.2,.2)*.66;POSE.stepT=Math.sin(p*9)*3*STEP_K;
  POSE.pitchT=parHold(p,.2,.2)*.62;
  if(Math.random()<.22)POSE.peck=.8;}},
{ru:"точить клюв",w:3,d:2.2,m:"",f:(p,S)=>{
  POSE.bowT=parHold(p,.2,.2)*.55;POSE.pitchT=parHold(p,.2,.2)*.5;
  POSE.jawT=Math.abs(Math.sin(p*25))*.28;}},
/* ── крылья и прыжки: то, что видно через всё окно ── */
{ru:"хлопнуть крыльями",w:6,d:1.4,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.flapV+=13;POSE.crestV+=6;}
  POSE.fanT=parBell(p)*.6;}},
{ru:"расправить и сложить",w:4,d:2.6,m:"",f:(p,S)=>{
  POSE.flapT=parHold(p,.25,.35)*.85;POSE.stretchT=parHold(p,.25,.35)*.7;
  POSE.fanT=parHold(p,.3,.3);}},
{ru:"подпрыгнуть",w:4,d:1.6,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.hopV+=1.1;POSE.flapV+=9;}}},
/* разворот: доля, а не сторона. Ноль — покой, единица — полный оборот */
{ru:"развернуться",w:5,d:1.8,m:"",f:(p,S)=>{
  POSE.turnT=parHold(p,.02,.02)*p;POSE.footUpT=parBell(p)*.4;
  if(p>=1)POSE.turnT=0;}},
{ru:"обернуться и назад",w:4,d:3.0,m:"",f:(p,S)=>{
  POSE.turnT=parBell(p)*.30;POSE.yawT=Math.sin(p*6.283)*.6;}},
{ru:"подскок с разворотом",w:3,d:2.0,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.hopV+=1.0;POSE.flapV+=11;}
  POSE.turnT=parBell(p)*.35;}},
{ru:"веер хвостом",w:5,d:1.8,m:"",f:(p,S)=>{POSE.fanT=parBell(p);}},
{ru:"качнуть хвостом",w:5,d:1.6,m:"",f:(p,S)=>{
  POSE.fanT=parBell(p)*.5;POSE.stepT=Math.sin(p*9.4)*2*STEP_K;}},
/* ── общение с тем, кто смотрит ── */
{ru:"поклон",w:5,d:1.9,m:"",f:(p,S)=>{POSE.bowT=parBell(p)*.62;POSE.crestT=parBell(p)*.4;}},
{ru:"кивать",w:5,d:2.4,m:"",f:(p,S)=>{POSE.bowT=(1-Math.cos(p*18.8))*.20;}},
{ru:"уставиться",w:6,d:3.8,m:"",f:(p,S)=>{
  POSE.yawT=0;POSE.pitchT=0;POSE.tuckT=parHold(p,.3,.3)*.25;
  if(!S.o){S.o=1;POSE.blinkAt=POSE.t+3.4;}}},
{ru:"заглянуть вниз",w:5,d:2.2,m:"",f:(p,S)=>{
  POSE.bowT=parHold(p,.3,.3)*.55;POSE.pitchT=parHold(p,.3,.3)*.55;}},
{ru:"заглянуть вверх",w:4,d:2.2,m:"",f:(p,S)=>{
  POSE.pitchT=parHold(p,.3,.3)*-.50;POSE.rollT=parHold(p,.3,.3)*-.30;}},
{ru:"насторожиться",w:5,d:2.6,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.crestV+=14;}
  POSE.tuckT=parHold(p,.15,.3)*.5;POSE.yawT=p<.5?-.7:.7;}},
{ru:"щёлкнуть клювом",w:5,d:1.6,m:"",f:(p,S)=>{
  POSE.jawT=Math.abs(Math.sin(p*18.8))*.42;
  if(!S.o&&p>.2){S.o=1;POSE.peck=.7;}}},
{ru:"бормотать",w:6,d:2.8,m:"",f:(p,S)=>{
  POSE.jawT=(1-Math.cos(p*25))*.11;POSE.tuckT=parHold(p)*.2;
  if(!S.o&&p>.25){S.o=1;if(Math.random()<.5)birdSay();}}},
{ru:"повторить услышанное",w:4,d:2.4,m:"",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.crestV+=6;birdSay();}
  POSE.jawT=parBell(p)*.38;POSE.bowT=parBell(p)*.20;}},
{ru:"чихнуть",w:3,d:1.3,m:"",f:(p,S)=>{
  if(p<=.35){POSE.rollT=-p*.9;POSE.pitchT=-p*.4;return;}
  if(!S.o){S.o=1;POSE.shiver=1.4;POSE.flapV+=6;POSE.crestV+=9;}
  POSE.bowT=parBell((p-.35)/.65)*.62;}},
{ru:"кашлянуть",w:4,d:1.7,m:"",f:(p,S)=>{
  POSE.bowT=Math.abs(Math.sin(p*9.4))*.38;POSE.jawT=Math.abs(Math.sin(p*9.4))*.30;}},
{ru:"зевнуть",w:5,d:2.2,m:"",f:(p,S)=>{
  POSE.jawT=parBell(p)*.52;POSE.pitchT=parBell(p)*-.26;POSE.blinkHold=parBell(p)*.9;}},
/* ── взвинчена: только когда её задели ── */
{ru:"вскинуть хохол",w:6,d:1.8,m:"x",f:(p,S)=>{if(!S.o){S.o=1;POSE.crestV+=22;}}},
{ru:"хохол дыбом и осесть",w:5,d:3.0,m:"x",f:(p,S)=>{
  POSE.crestT=parHold(p,.1,.45);POSE.ruffleAdd+=parBell(p)*.045;
  POSE.yawT=Math.sin(p*9.4)*.7;}},
{ru:"расхаживать",w:4,d:3.4,m:"x",f:(p,S)=>{
  POSE.stepT=Math.sin(p*6.283)*20*STEP_K;POSE.crestT=parHold(p,.2,.2)*.6;
  POSE.footUpT=Math.abs(Math.sin(p*18.8))*.4;}},
{ru:"вспорхнуть на месте",w:3,d:2.2,m:"x",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.hopV+=1.4;POSE.flapV+=17;POSE.crestV+=10;}
  POSE.fanT=parBell(p)*.9;POSE.stretchT=parBell(p)*.8;}},
{ru:"огрызнуться",w:4,d:1.6,m:"x",f:(p,S)=>{
  if(!S.o){S.o=1;POSE.peck=1;POSE.crestV+=12;}
  POSE.jawT=parBell(p)*.52;POSE.bowT=parBell(p)*.34;}},
{ru:"плясать",w:3,d:3.6,m:"x",f:(p,S)=>{
  POSE.stepT=Math.sin(p*15.7)*9*STEP_K;POSE.bowT=(1-Math.cos(p*15.7))*.18;
  POSE.crestT=parHold(p,.2,.2)*.7;POSE.footUpT=Math.abs(Math.sin(p*15.7))*.4;}},
/* ── сонная: копится сама, сбрасывается тычком ── */
{ru:"моргать медленно",w:7,d:3.2,m:"s",f:(p,S)=>{
  POSE.tuckT=parHold(p,.3,.3)*.4;
  if(Math.random()<.05){POSE.blink=1;POSE.blinkAt=POSE.t+1.2;}}},
{ru:"клевать носом",w:6,d:4.2,m:"s",f:(p,S)=>{
  POSE.bowT=(1-Math.cos(p*9.4))*.20;POSE.pitchT=(1-Math.cos(p*9.4))*.24;
  POSE.tuckT=parHold(p,.2,.2)*.6;
  if(Math.random()<.08)POSE.blink=1;}},
{ru:"спрятать голову",w:5,d:6.5,m:"s",f:(p,S)=>{
  POSE.tuckT=parHold(p,.14,.16);POSE.footUpT=parHold(p,.2,.2)*.9;
  POSE.yawT=parHold(p,.2,.2)*1.35;
  POSE.blinkHold=parHold(p,.2,.2);}},
{ru:"дремать на одной лапе",w:4,d:7.5,m:"s",f:(p,S)=>{
  POSE.tuckT=parHold(p,.12,.14)*.8;POSE.footUpT=parHold(p,.1,.1);
  POSE.blinkHold=parHold(p,.18,.18)*.9;}},
{ru:"проснуться",w:4,d:2.6,m:"s",f:(p,S)=>{
  POSE.jawT=parBell(p)*.45;POSE.shiver=parBell(p)*.9;POSE.fanT=parBell(p)*.5;
  POSE.stretchT=parBell(p)*.6;
  if(!S.o&&p>.5){S.o=1;POSE.crestV+=8;POSE.sleep=0;}}},
/* ── трюки: редкие по весу и по настроению ── */
{ru:"повиснуть вниз головой",w:1,d:5.0,m:"c",f:(p,S)=>{
  POSE.hangT=parHold(p,.22,.22);
  POSE.fanT=parHold(p,.3,.3)*.5;POSE.crestT=parHold(p)*.4;}},
{ru:"качнуться на висе",w:1,d:6.0,m:"c",f:(p,S)=>{
  POSE.hangT=parHold(p,.18,.18);
  POSE.turnT=Math.sin(p*12.5)*.05;POSE.fanT=parHold(p,.25,.25)*.7;}},
{ru:"повисеть и вернуться",w:1,d:4.4,m:"c",f:(p,S)=>{
  POSE.hangT=parBell(p);POSE.footUpT=parBell(p)*.5;
  if(!S.o&&p>.5){S.o=1;POSE.flapV+=7;}}}
];

/* ── что она бормочет ──
   Отдельная от игры птица ничего не слышала, и повторять ей нечего: в игре на
   этом месте её собственная память (12x), здесь — честный шорох. Выдумывать за
   неё слова нельзя, это то же враньё, что перк без кода. */
const BIRD_IDLE=["…","кхх-кхх","чшшш","тк-тк-тк","кхе","пр-р-р"];
function birdPick(a){return a[Math.floor(Math.random()*a.length)%a.length];}
function birdSay(){
  const el=document.getElementById("say");
  if(!el)return;
  el.textContent=birdPick(BIRD_IDLE);
  el.classList.remove("on");void el.offsetWidth;el.classList.add("on");
  /* и голосом (09-sound): пузырь без звука был последним молчанием птицы */
  if(typeof birdChirp==="function")try{birdChirp();}catch(e){}
}

/* ── жеребьёвка ──
   Вес, настроение и запрет на повтор двух последних — как в игре. Без запрета
   случайность выдаёт «переступить, переступить, переступить», и весь
   репертуар пропадает зря именно тогда, когда на птицу смотрят. */
const ACT={cur:null,t0:0,next:2.0,S:null,last:[]};
function actMood(){
  if(POSE.mad>.25)return "x";
  if(POSE.sleep>.62)return "s";
  return "";
}
function actsStep(dt){
  POSE.hangT=0;
  const T=POSE.t;
  if(ACT.cur){
    const p=(T-ACT.t0)/ACT.cur.d;
    if(p>=1){ACT.cur=null;ACT.next=T+0.9+Math.random()*2.6;}
    else ACT.cur.f(clamp(p,0,1),ACT.S);
  }
  if(!ACT.cur&&!POSE.still&&T>=ACT.next){
    const mood=actMood();
    /* «c» — спокойные трюки: их можно и в покое, но редко */
    const pool=ACTS.filter(a=>(a.m===mood||a.m===""||(a.m==="c"&&mood===""))
                              &&ACT.last.indexOf(a.ru)<0);
    let sum=0;for(const a of pool)sum+=a.w;
    let r=Math.random()*sum,got=pool[0];
    for(const a of pool){r-=a.w;if(r<=0){got=a;break;}}
    ACT.cur=got;ACT.t0=T;ACT.S={};
    ACT.last.push(got.ru);if(ACT.last.length>2)ACT.last.shift();
  }
  /* вис — своя пружина: он двигает всю птицу вокруг жёрдочки */
  POSE.hang=(POSE.hang||0)+((POSE.hangT||0)-(POSE.hang||0))*Math.min(1,dt*4.5);
}
