/* ══════════════ поза и жизнь ══════════════
   Устройство то же, что у птицы в игре (src/12y, 12z): не «кадры анимации», а
   ЦЕЛИ и затухающие пружины. Повадка (41-acts) каждый кадр выставляет цели,
   пружины сами доводят до них и сами возвращают в покой — застрять на кадре
   невозможно, потому что кадров нет, а прервать повадку можно в любой момент.

   Степени свободы взяты один в один из игровой таблицы повадок, иначе
   переносить её нечем: look, roll, bow, tuck, step, footUp, stretch, fan,
   flap, hop, crest, ruff, shiver, turn, peck, beak, yawn, blink.

   Мелкая рябь, дыхание и моргание идут ВСЕГДА и поверх всего: повадка — то,
   что птица делает; рябь — то, что с ней происходит. */
const POSE={t:0,
  /* голова */
  yaw:0,pitch:0,roll:0,yawV:0,pitchV:0,rollV:0,yawT:0,pitchT:0,rollT:0,
  /* корпус */
  bow:0,bowV:0,bowT:0, lean:0, breath:0, puff:0, tuck:0,tuckV:0,tuckT:0,
  hop:0,hopV:0, step:0,stepV:0,stepT:0, turn:0,turnV:0,turnT:0,
  /* оперение */
  flap:0,flapV:0,flapT:0, stretch:0,stretchV:0,stretchT:0,
  fan:0,fanV:0,fanT:0, crest:0,crestV:0,crestT:0, ruffle:0.012,ruffleAdd:0,shiver:0,
  /* лапы, клюв, глаз */
  footUp:0,footUpV:0,footUpT:0, footSide:1,
  jaw:0,jawV:0,jawT:0, peck:0, blink:0,blinkAt:2.2,blinkHold:0,
  /* настроение: то же, что в игре — взвинчена, сонная */
  mad:0, sleep:0,
  nextLook:1.5, still:0, puffAdd:0};

function spring(v,vel,k,d,dt){vel+=-v*k*dt;vel*=Math.pow(d,dt*60);return [v+vel*dt,vel];}
/* пружина К ЦЕЛИ: считается по отклонению, поэтому цель можно двигать каждый
   кадр и рывка не будет */
function springTo(v,vel,tgt,k,d,dt){
  const r=spring(v-tgt,vel,k,d,dt);
  return [r[0]+tgt,r[1]];
}

function poseStep(dt){
  POSE.t+=dt;
  const T=POSE.t;
  /* цели обнуляются каждый кадр: их выставляет только текущая повадка, и
     «залипшая» цель от прошлой — самый частый способ сломать покой */
  POSE.jawT=0;POSE.bowT=0;POSE.tuckT=0;POSE.stepT=0;POSE.footUpT=0;
  POSE.stretchT=0;POSE.fanT=0;POSE.crestT=0;POSE.turnT=0;POSE.flapT=0;
  POSE.puffAdd=0;POSE.ruffleAdd=0;POSE.blinkHold=0;POSE.peck*=Math.pow(.86,dt*60);
  if(typeof actsStep==="function")actsStep(dt);
  /* дыхание: два вдоха в пять секунд, и амплитуда такая, что заметно только
     одно — птица не стоит */
  POSE.breath=Math.sin(T*2.4)*0.006+Math.sin(T*0.7)*0.003;
  /* птица смотрит по сторонам и между повадками: редко, коротко и не в одну и
     ту же точку */
  if(POSE.still){POSE.yawT=0;POSE.pitchT=0;POSE.rollT=0;POSE.blink=0;POSE.blinkAt=1e9;}
  else if(!ACT.cur&&T>POSE.nextLook){
    POSE.nextLook=T+1.1+Math.random()*3.8;
    POSE.yawT=(Math.random()-0.5)*0.75;
    POSE.pitchT=(Math.random()-0.5)*0.28;
    POSE.rollT=(Math.random()-0.5)*0.20;
  }
  [POSE.yaw,POSE.yawV]=springTo(POSE.yaw,POSE.yawV,POSE.yawT,60,.86,dt);
  [POSE.pitch,POSE.pitchV]=springTo(POSE.pitch,POSE.pitchV,POSE.pitchT,60,.86,dt);
  [POSE.roll,POSE.rollV]=springTo(POSE.roll,POSE.rollV,POSE.rollT,52,.87,dt);
  [POSE.bow,POSE.bowV]=springTo(POSE.bow,POSE.bowV,POSE.bowT,40,.88,dt);
  [POSE.tuck,POSE.tuckV]=springTo(POSE.tuck,POSE.tuckV,POSE.tuckT,34,.88,dt);
  [POSE.step,POSE.stepV]=springTo(POSE.step,POSE.stepV,POSE.stepT,26,.86,dt);
  [POSE.turn,POSE.turnV]=springTo(POSE.turn,POSE.turnV,POSE.turnT,30,.87,dt);
  [POSE.stretch,POSE.stretchV]=springTo(POSE.stretch,POSE.stretchV,POSE.stretchT,42,.87,dt);
  [POSE.fan,POSE.fanV]=springTo(POSE.fan,POSE.fanV,POSE.fanT,50,.86,dt);
  [POSE.footUp,POSE.footUpV]=springTo(POSE.footUp,POSE.footUpV,POSE.footUpT,44,.86,dt);
  /* челюсть жёстче и суше остальных: клюв не качается, он щёлкает */
  [POSE.jaw,POSE.jawV]=springTo(POSE.jaw,POSE.jawV,Math.max(POSE.jawT,POSE.jawHold||0),220,.72,dt);
  /* КРЫЛО, ХОХОЛ, ПОДСКОК — свободные пружины к нулю, как в игре: повадка
     бьёт по скорости (flapV+=13), а не ставит значение. Так «хлопнуть
     крыльями» получается ударом, а не плавным подъёмом. */
  /* стенд: зажатая адресом степень свободы перебивает повадку */
  for(const k of ["flap","stretch","fan","crest","tuck","footUp","bow"])
    if(POSE[k+"Hold"]!==undefined)POSE[k+"T"]=POSE[k+"Hold"];
  if(POSE.hangHold!==undefined)POSE.hangT=POSE.hangHold;
  if(POSE.turnHold!==undefined)POSE.turnT=POSE.turnHold;
  [POSE.flap,POSE.flapV]=springTo(POSE.flap,POSE.flapV,POSE.flapT,150,.86,dt);
  [POSE.crest,POSE.crestV]=springTo(POSE.crest,POSE.crestV,POSE.crestT,60,.90,dt);
  [POSE.hop,POSE.hopV]=spring(POSE.hop,POSE.hopV,110,.87,dt);
  /* подскок идёт от крыла: птица машет всем телом, а не одним крылом */
  if(POSE.flapV>0)POSE.hopV+=POSE.flapV*0.045*dt*60;
  /* моргание врозь: своё время, поверх любой повадки */
  if(POSE.blink>0)POSE.blink=Math.max(0,POSE.blink-dt*7.5);
  if(!POSE.still&&T>POSE.blinkAt){POSE.blink=1;POSE.blinkAt=T+1.5+Math.random()*4.5;}
  POSE.blinkNow=clamp(Math.max(POSE.blink,POSE.blinkHold||0),0,1);
  POSE.puff*=Math.pow(.92,dt*60);
  POSE.shiver*=Math.pow(.90,dt*60);
  /* дрожь идёт поверх ряби, как в игре: частая мелкая тряска по оперению */
  POSE.ruffle=0.012+POSE.puff*1.6+POSE.ruffleAdd+POSE.shiver*0.05;
  POSE.puffShow=POSE.puff+POSE.puffAdd;
  POSE.lean=Math.sin(T*0.53)*0.012+POSE.shiver*Math.sin(T*47)*0.02;
  /* настроение стынет само: злость держится секунд восемь, сон копится */
  POSE.mad*=Math.pow(.9975,dt*60);
  if(!POSE.still)POSE.sleep=clamp(POSE.sleep+dt*0.0032-POSE.mad*dt*0.4,0,1);
}
