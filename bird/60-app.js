/* ══════════════ страница: кадр, камера, руки ══════════════
   Модуль отдельный от игры и ни на что в ней не смотрит. Единственное, что
   он берёт у «Дрейфа», — породу птицы и правило света.

   ОШИБКИ ВИДНО. Не собравшийся шейдер обязан сказать об этом на экране: без
   этого поиск опечатки в GLSL — чёрный прямоугольник без единой зацепки. */
/* ── во что обходится красота ──
   Один набор чисел на всё качество: телефон получает ту же птицу, но дешевле —
   меньше перьев, мельче карта теней, короче лестница свечения. Подбирать по
   имени браузера нельзя, поэтому решает ширина окна и наличие пальца.
   ?q=low и ?q=high переключают руками — для проверки. */
const QUAL={};
function qualPick(){
  const q=new URLSearchParams(location.search).get("q");
  const m=q?q==="low":(innerWidth<=760||(navigator.maxTouchPoints||0)>1);
  QUAL.mobile=m;
  QUAL.coatMesh=m?[5,6]:[7,8];
  QUAL.rows=m?46:64;
  QUAL.dens=m?84:118;
  QUAL.shadow=m?1024:1536;
  QUAL.dpr=m?1.6:2;
  QUAL.bloomN=m?4:5;
  QUAL.dust=m?120:260;
}

const CAM={az:1.02,el:0.08,dist:3.90,tgt:[0,1.08,0],azV:0,elV:0,distT:3.90};
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
  qualPick();
  /* сетки собираются один раз: форма птицы не меняется, меняется поза */
  MESH.body  =glMesh(buildBody(96,64));
  MESH.parts =glMesh(buildParts());
  MESH.beads =glMesh(buildBeads());
  /* пыль: билборд из двух треугольников, остальное делают инстансы */
  MESH.dust=glMesh({verts:new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]),
    stride:2,attrs:[["p",2,0]]});
  glInstances(MESH.dust,buildDust(QUAL.dust),[["seed",4,0]],4);
  const IA=[["r0",4,0],["r1",4,4],["r2",4,8],["icol",3,12],["ipar",4,15]];
  MESH.coat  =glMesh(buildFeather(QUAL.coatMesh[0],QUAL.coatMesh[1]));
  glInstances(MESH.coat,layoutCoat(QUAL.rows,QUAL.dens),IA,FEA_STRIDE);
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
  /* стенд: ?jaw=0.4 держит клюв открытым — иначе нутро и язык нечем проверить */
  if(Q.has("jaw"))POSE.jawHold=+Q.get("jaw");
  if(Q.has("nobody"))R.noBody=1;
  if(Q.has("dbg")){
    console.log("перья: корпус "+MESH.coat.inst+" (голова "+COAT_STAT.head+
      ", срезано "+COAT_STAT.cut+") · крупные "+MESH.plumes.inst);
    for(const s of [[0.95,Math.PI/2],[0.95,0],[0.98,Math.PI*1.5],[0.90,Math.PI],[0.5,Math.PI/2]])
      console.log("n("+s[0]+","+s[1].toFixed(2)+") = "+normalAt(s[0],s[1]).map(v=>v.toFixed(2))+
        "  p="+bodyAt(s[0],s[1]).map(v=>v.toFixed(2)));
  }
  birdSize();
  addEventListener("resize",birdSize);
  birdHands(cv);
  uiInit();
  birdT0=performance.now();
  birdRAF=requestAnimationFrame(birdFrame);
}
function birdSize(){
  const cv=document.getElementById("cv");
  /* плотность пикселей режется двойкой: на телефоне с тройной плотностью
     разница не видна, а кадр дороже вдвое */
  const dpr=Math.min(QUAL.dpr||2,window.devicePixelRatio||1);
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
    if(moved>10)uiTouched();
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
  uiTouched();
  /* Тычок обрывает повадку: животное, которое доигрывает начатое, пока его
     трогают, — это заводная игрушка. Птица вскидывается, распушается и
     смотрит на того, кто её тронул. */
  ACT.cur=null;ACT.next=POSE.t+1.6;
  POSE.puff=0.038;
  POSE.pitchT=-0.16;POSE.yawT=(Math.random()-0.5)*0.5;
  POSE.nextLook=POSE.t+1.4;
  POSE.blink=1;
  POSE.jawT=0.22;setTimeout(()=>{POSE.jawT=0;},160);
}
addEventListener("error",e=>fail("Сломалось: "+e.message+"\n"+(e.filename||"")+":"+(e.lineno||"")));
if(document.readyState==="loading")addEventListener("DOMContentLoaded",birdBoot);else birdBoot();
