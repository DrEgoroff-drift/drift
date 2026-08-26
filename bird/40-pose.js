/* ══════════════ поза и жизнь ══════════════
   Как в игре: не «кадры анимации», а затухающие пружины. Повадка (41-acts)
   выставляет цели, пружины сами доводят до них и сами возвращают в покой —
   застрять на кадре невозможно, потому что кадров нет.

   Мелкая рябь, дыхание и моргание идут ВСЕГДА и поверх всего: повадка — то,
   что птица делает; рябь — то, что с ней происходит. */
const POSE={t:0,yaw:0,pitch:0,roll:0,breath:0,puff:0,lean:0,bow:0,ruffle:0.012,
  jaw:0,blink:0,blinkAt:2.2,
  yawV:0,pitchV:0,rollV:0,bowV:0,jawV:0,
  yawT:0,pitchT:0,rollT:0,bowT:0,jawT:0,puffAdd:0,ruffleAdd:0,blinkHold:0,
  nextLook:1.5,still:0};

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
  if(typeof actsStep==="function")actsStep();
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
  /* челюсть жёстче и суше остальных: клюв не качается, он щёлкает */
  [POSE.jaw,POSE.jawV]=springTo(POSE.jaw,POSE.jawV,Math.max(POSE.jawT,POSE.jawHold||0),220,.72,dt);
  /* моргание врозь: своё время, поверх любой повадки; зевок держит глаз
     прикрытым, поэтому blinkHold складывается, а не спорит */
  if(POSE.blink>0)POSE.blink=Math.max(0,POSE.blink-dt*7.5);
  if(!POSE.still&&T>POSE.blinkAt){POSE.blink=1;POSE.blinkAt=T+1.5+Math.random()*4.5;}
  POSE.blinkNow=clamp(Math.max(POSE.blink,POSE.blinkHold||0),0,1);
  POSE.puff*=Math.pow(.92,dt*60);
  POSE.ruffle=0.012+POSE.puff*1.6+(POSE.ruffleAdd||0);
  POSE.puffShow=POSE.puff+(POSE.puffAdd||0);
  POSE.lean=Math.sin(T*0.53)*0.012;
}
