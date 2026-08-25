/* ══════════════ поза и жизнь ══════════════
   Как в игре: не «кадры анимации», а затухающие пружины. Повадка выставляет
   степени свободы, пружины сами возвращают птицу в покой — застрять на кадре
   невозможно, потому что кадров нет.

   Мелкая рябь идёт ВСЕГДА и поверх всего: повадка — то, что птица делает,
   рябь — то, что с ней происходит. */
const POSE={t:0,yaw:0,pitch:0,roll:0,breath:0,puff:0,lean:0,bow:0,ruffle:0.012,
  yawV:0,pitchV:0,rollV:0,blink:0,blinkAt:2.2,look:[0,1.75,3]};

function spring(v,vel,k,d,dt){vel+=-v*k*dt;vel*=Math.pow(d,dt*60);return [v+vel*dt,vel];}

function poseStep(dt){
  POSE.t+=dt;
  const T=POSE.t;
  /* дыхание: два вдоха в пять секунд, амплитуда меньше миллиметра в масштабе
     птицы — заметно только тем, что птица не стоит */
  POSE.breath=Math.sin(T*2.4)*0.006+Math.sin(T*0.7)*0.003;
  /* пружины головы тянутся к цели, а не ставятся в неё */
  [POSE.yaw,POSE.yawV]=spring(POSE.yaw-POSE.yawT,POSE.yawV,55,.86,dt);
  POSE.yaw+=POSE.yawT;
  [POSE.pitch,POSE.pitchV]=spring(POSE.pitch-POSE.pitchT,POSE.pitchV,55,.86,dt);
  POSE.pitch+=POSE.pitchT;
  [POSE.roll,POSE.rollV]=spring(POSE.roll-POSE.rollT,POSE.rollV,48,.88,dt);
  POSE.roll+=POSE.rollT;
  /* птица смотрит по сторонам сама: редко, коротко и не в одну и ту же точку */
  if(POSE.still){POSE.yawT=0;POSE.pitchT=0;POSE.rollT=0;POSE.blink=0;POSE.blinkAt=1e9;}
  else if(T>POSE.nextLook){
    POSE.nextLook=T+0.9+Math.random()*3.4;
    POSE.yawT=(Math.random()-0.5)*0.9;
    POSE.pitchT=(Math.random()-0.5)*0.34;
    POSE.rollT=(Math.random()-0.5)*0.22;
  }
  if(POSE.blink>0)POSE.blink=Math.max(0,POSE.blink-dt*7.5);
  if(T>POSE.blinkAt){POSE.blink=1;POSE.blinkAt=T+1.5+Math.random()*4.5;}
  POSE.puff*=Math.pow(.92,dt*60);
  /* рябь по оперению: она идёт всегда, поверх любой повадки — это не то, что
     птица делает, а то, что с ней происходит */
  POSE.ruffle=0.012+POSE.puff*1.6;
  POSE.bow*=Math.pow(.93,dt*60);
  POSE.lean=Math.sin(T*0.53)*0.012;
}
POSE.yawT=0;POSE.pitchT=0;POSE.rollT=0;POSE.nextLook=1.5;
