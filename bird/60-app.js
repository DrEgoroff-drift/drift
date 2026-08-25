/* ══════════════ страница: кадр, камера, руки ══════════════
   Модуль отдельный от игры и ни на что в ней не смотрит. Единственное, что
   он берёт у «Дрейфа», — породу птицы и правило света.

   ОШИБКИ ВИДНО. Не собравшийся шейдер обязан сказать об этом на экране: без
   этого поиск опечатки в GLSL — чёрный прямоугольник без единой зацепки. */
const CAM={az:0.62,el:0.16,dist:4.35,tgt:[0,1.16,0],azV:0,elV:0,distT:4.35};
const MESH={};
let birdRAF=0,birdT0=0,birdFPS=60;

function fail(msg){
  const b=document.getElementById("boom");
  if(!b)return;
  b.style.display="block";
  b.textContent=msg;
}
function birdBoot(){
  const cv=document.getElementById("cv");
  if(!glInit(cv)){
    fail("Здесь нужен WebGL 2. Он есть во всех нынешних браузерах — похоже, "+
         "он выключен или машина отказалась его дать.\n\nПтица без него не соберётся.");
    return;
  }
  /* сетки собираются один раз: форма птицы не меняется, меняется поза */
  MESH.body  =glMesh(buildBody(96,64));
  MESH.parts =glMesh(buildParts());
  MESH.beads =glMesh(buildBeads());
  const IA=[["r0",4,0],["r1",4,4],["r2",4,8],["icol",3,12],["ipar",4,15]];
  MESH.coat  =glMesh(buildFeather(5,7));
  glInstances(MESH.coat,layoutCoat(),IA,FEA_STRIDE);
  MESH.plumes=glMesh(buildFeather(7,11));
  glInstances(MESH.plumes,layoutPlumes(),IA,FEA_STRIDE);
  renderInit();
  if(GL_ERR.length){fail("Шейдеры не собрались:\n\n"+GL_ERR.join("\n\n"));return;}
  /* стенд: камера и покой задаются адресом, чтобы снимки были сравнимы
     между собой — ?az=0.6&el=0.15&d=4.3&still=1 */
  const Q=new URLSearchParams(location.search);
  if(Q.has("az"))CAM.az=+Q.get("az");
  if(Q.has("el"))CAM.el=+Q.get("el");
  if(Q.has("d"))CAM.dist=CAM.distT=+Q.get("d");
  if(Q.has("ty"))CAM.tgt[1]=+Q.get("ty");
  if(Q.has("still"))POSE.still=1;
  birdSize();
  addEventListener("resize",birdSize);
  birdHands(cv);
  birdT0=performance.now();
  birdRAF=requestAnimationFrame(birdFrame);
}
function birdSize(){
  const cv=document.getElementById("cv");
  /* плотность пикселей режется двойкой: на телефоне с тройной плотностью
     разница не видна, а кадр дороже вдвое */
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(2,Math.round(cv.clientWidth*dpr)),h=Math.max(2,Math.round(cv.clientHeight*dpr));
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  R.dpr=dpr;
  renderSize(w,h);
}
function birdFrame(ts){
  const dt=Math.min(.05,(ts-birdT0)/1000||.016);birdT0=ts;
  birdFPS+=((1/Math.max(dt,1e-3))-birdFPS)*.05;
  poseStep(dt);
  /* камера тоже на пружине: рывок мышью не должен рвать кадр */
  CAM.dist+=(CAM.distT-CAM.dist)*Math.min(1,dt*8);
  CAM.az+=CAM.azV*dt;CAM.el+=CAM.elV*dt;
  CAM.azV*=Math.pow(.02,dt);CAM.elV*=Math.pow(.02,dt);
  CAM.el=clamp(CAM.el,-0.55,0.95);
  const e=[CAM.tgt[0]+Math.sin(CAM.az)*Math.cos(CAM.el)*CAM.dist,
           CAM.tgt[1]+Math.sin(CAM.el)*CAM.dist,
           CAM.tgt[2]+Math.cos(CAM.az)*Math.cos(CAM.el)*CAM.dist];
  R.eye=e;
  R.VP=mMul(mPersp(0.56,R.W/R.H,0.15,40),mLook(e,CAM.tgt,[0,1,0]));
  renderFrame();
  birdRAF=requestAnimationFrame(birdFrame);
}
/* ── руки ──
   Птицу можно обойти кругом и потрогать. Перетаскивание — камера, короткий
   тычок — птица: разделяются по пройденному расстоянию, а не по кнопке. */
function birdHands(cv){
  let down=false,lx=0,ly=0,moved=0;
  cv.addEventListener("pointerdown",e=>{down=true;lx=e.clientX;ly=e.clientY;moved=0;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener("pointermove",e=>{
    if(!down)return;
    const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;
    moved+=Math.abs(dx)+Math.abs(dy);
    CAM.azV=-dx*0.09;CAM.elV=dy*0.06;
  });
  const up=e=>{
    if(down&&moved<6)birdPoke(e.clientX,e.clientY);
    down=false;
  };
  cv.addEventListener("pointerup",up);
  cv.addEventListener("pointercancel",()=>{down=false;});
  cv.addEventListener("wheel",e=>{
    CAM.distT=clamp(CAM.distT+Math.sign(e.deltaY)*0.28,1.9,8.0);
    e.preventDefault();
  },{passive:false});
}
function birdPoke(){
  /* пока — общая реакция: птица вскидывается и распушается. Зоны появятся
     вместе с хохлом и крылом. */
  POSE.puff=0.035;POSE.ruffle=0.06;
  POSE.pitchT=-0.18;POSE.nextLook=POSE.t+1.2;
  POSE.blink=1;
}
addEventListener("error",e=>fail("Сломалось: "+e.message+"\n"+(e.filename||"")+":"+(e.lineno||"")));
if(document.readyState==="loading")addEventListener("DOMContentLoaded",birdBoot);else birdBoot();
