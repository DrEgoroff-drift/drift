/* ══════════════ кабина пояса на слое приборов #hud (ступень 2, п.2; docs/DESIGN-gpu.md) ══════════════
   Кабина и символика стекла — интерфейс: их место на #hud поверх #g, как у приборов полёта
   (08bh). Браузер кладёт слой сам, копии #c в Dawn нет, и холст — на родном DPR устройства.
   Растр — только когда картинка другая. Ключ собран руками по входам рисунка, как подпись
   колодки 25c: камера (базис), курс, вектор скорости, цель, топливо и корпус, скорость,
   радар, трюм, лампы, держатель узла, рукоятки. Дёшево: десятки чисел, без прогона рисунка.
   Что ключ не упустил ничего, стережёт оракул в воротах (91zzzzzzy1): там рисунок идёт в
   подставной ctx, и любая смена протокола вызовов обязана сменить ключ. Протокол на боевом
   кадре стоил втрое дороже самого рисунка и ~400 КБ мусора (замер на 4× троттлинге) */
const BHUD={redraw:0,rec:false};
/* лампы на стойках моргают сами по себе — это не повод перерисовывать всю кабину. На слое
   приборов остаётся погашенная лампа, горящая — свой маленький холст над ним (подписи мира
   08bh: LABDOM прячет его в кадре, где лампа не горит, и кладёт в снимок кадра). Дробь места
   печётся внутрь холста, чтобы круг лёг туда же, куда 2D */
function bhudLedDom(){return BHUD.rec;}
function bhudLed(k,x,y,r,col){
  const box=chipDomBox();if(!box)return;
  const key="bhud:"+k,nd=gpuHudDpr(),R=r*3.4,s=Math.ceil((2*R+2)*nd)/nd;
  const x0=Math.floor((x-s/2)*nd)/nd,y0=Math.floor((y-s/2)*nd)/nd,fx=x-x0,fy=y-y0;
  let e=LABDOM.m.get(key);
  if(!e){
    const cv=document.createElement("canvas");cv.style.cssText="position:absolute;left:0;top:0;transform-origin:0 0";
    box.appendChild(cv);e={cv,sig:"",pos:"",on:false};LABDOM.m.set(key,e);
  }
  e.used=true;
  const sig=r+"|"+col+"|"+nd+"|"+Math.round(fx*64)+","+Math.round(fy*64);
  if(sig!==e.sig){
    e.sig=sig;const cv=e.cv,g=cv.getContext("2d");
    cv.width=cv.height=Math.max(1,Math.round((s+1/nd)*nd));cv.style.width=cv.style.height=cv.width/nd+"px";
    g.setTransform(nd,0,0,nd,0,0);g.fillStyle=col;
    g.beginPath();g.arc(fx,fy,r,0,TAU);g.fill();
    g.globalAlpha=.22;g.beginPath();g.arc(fx,fy,R,0,TAU);g.fill();g.globalAlpha=1;
    e.w=e.h=cv.width/nd;
  }
  e.x=x0;e.y=y0;e.A=1;
  const pos="translate("+x0.toFixed(3)+"px,"+y0.toFixed(3)+"px)";
  if(pos!==e.pos){e.pos=pos;e.cv.style.transform=pos;}
  if(e.op!=="1"){e.op="1";e.cv.style.opacity="1";}
  if(!e.on){e.on=true;e.cv.style.display="";}
}
/* горящие лампы кадра — каждый кадр, мимо ключа (та же формула, что в drawCockpit) */
function bhudLeds(){
  const P=cockpitTex(G.shipId).plan,K=P.K;
  for(const s of [-1,1])P.leds.forEach((L,i)=>{
    if(L.on&&Math.sin(G.t*L.sp+L.ph)>-.35)bhudLed((s<0?"l":"r")+i,s<0?P.pw*.42:W-P.pw*.42,L.y,L.r,K.led);
  });
}
/* ключ кадра кабины и стекла: всё, от чего зависит рисунок, с шагом ниже заметного —
   координаты ~1/16 px, углы камеры 1/16384 */
function bhudKey(b,fwd,st,bas){
  const q=(v,f)=>Math.round(v*f),A=16384,k=[CKPT.key,W,H,uiK(),G.shipId];
  for(const v of [bas.fwd,bas.right,bas.up])k.push(q(v[0],A),q(v[1],A),q(v[2],A));
  k.push(q(b.yaw,A),q(b.pitch,A),q(b.roll,A));
  const sp=Math.hypot(b.vx,b.vy,b.vz);
  k.push(sp.toFixed(1),sp>.12?q(b.vx/sp,A)+","+q(b.vy/sp,A)+","+q(b.vz/sp,A):"-");
  const L=b.lock;
  if(L)k.push(RES[L.res].ru,L.left,L.r,q(L.x-b.x,16),q(L.y-b.y,16),q(L.z-b.z,16),q(b.prog,256));else k.push("-");
  k.push(b.hit>0?(b.hit/14*.22).toFixed(2):0);
  k.push(q(G.fuel/st.fuelMax,1024),q(G.hull/st.hullMax,1024),st.fuelMax,st.hullMax,st.cargoMax,held());
  for(const r of RES_KEYS)k.push(G.cargo[r]||0);
  /* панель и лента — подпись колодки 25c (стрелки 1/256 шкалы, голова и откат ленты) */
  k.push($ipod?instrPodSig(instrRead(),tapeInit()):instrMisclose().toFixed(3));
  /* радар: точки в пределах дальности — место 1/16 px на шкале, прозрачность, цвет */
  let h=0;
  const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),rx=Math.cos(b.yaw),rz=-Math.sin(b.yaw);
  for(const a of b.ast){
    const dx=a.x-b.x,dz=a.z-b.z,dy=a.y-b.y;
    if(Math.hypot(dx,dy,dz)>2000)continue;
    h=(h*31+q((dx*rx+dz*rz)/2000,4096))|0;h=(h*31+q((dx*fx+dz*fz)/2000,4096))|0;
    h=(h*31+q(Math.abs(dy),.25)+(a===L?7:0)+a.r)|0;h=(h*31+RES_KEYS.indexOf(a.res))|0;
  }
  k.push(h);
  /* лампы доски: сближение мигает, подпись чередуется, когда горят две и тесно */
  const nearOn=b.near<130&&Math.sin(G.t*.25)>-.2,lit=(nearOn?1:0)+(G.fuel/st.fuelMax<.2?1:0)+(held()>=st.cargoMax?1:0);
  k.push(b.near<130?1:0,nearOn?1:0,lit>1?Math.floor(G.t/150):0);
  /* держатель узла: качание и мерцание венцов — только когда есть что держать */
  const N=nodeHolder(),crowns=NODE_FAMS.filter(F=>G.crowns&&G.crowns[F.id]);
  if(N)k.push(N.id,q(Math.sin(G.t*.045)*.05+clamp(b.roll*.6+b.avYaw*3,-.5,.5)*.5,2048));
  crowns.forEach((F,i)=>k.push(F.id,q(.6+.4*Math.sin(G.t*.06+i*1.3),64)));
  /* рукоятки и рычаг тяги */
  k.push(keys.act?1:0,keys.fire?1:0,keys.thrust?1:0,keys.brake?1:0,q(clamp(b.avYaw*8,-.5,.5),1024),q(clamp(-b.avPitch*7,-.45,.45),1024));
  return k.join(",");
}
/* стекло и кабина пояса: с видеокартой — на слой приборов по изменению, без неё — на #c */
function beltHudPush(b,proj,fwd,st,bas){
  const fn=()=>{drawGlassHUD(b,proj,fwd,st);drawCockpit(b,st);};
  if(!GPU.on||!GPU.uctx){fn();return;}
  const fl=()=>{BHUD.rec=true;try{fn();}finally{BHUD.rec=false;}};
  cockpitTex(G.shipId);bhudLeds();
  gpuHud("belt|"+bhudKey(b,fwd,st,bas||beltBasis(b)),()=>{BHUD.redraw++;fl();});
}
