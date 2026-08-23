/* ══════════════ дорожный спутник ══════════════
   M168/M168b, из docs/DESIGN-road.md. Едете по-настоящему — корабль летит по
   экрану, и дорога его кормит. GPS даёт скорость (×1 000 000 — космическая),
   гироскоп кренит в настоящий поворот, тряска дрожит корпусом, РАЗГОН
   прибавляет факел и задирает нос, ТОРМОЖЕНИЕ бьёт носовыми соплами.

   ДЕНЬГИ И КОМБО (M168b). Километр дороги — кредиты, счётчик тикает живьём.
   Едешь без остановки — комбо растёт до ×3 (двадцать минут хода); встал
   больше чем на две минуты — комбо сгорело. Потолок в день мягкий: это
   развлечение; взломают — сами дураки (решение автора).

   МУЗЫКА — «ВОЛНА» (M168b). Не эквалайзер-столбики (та версия была мебелью:
   линейные частоты, дребезг, глухой цвет), а дышащая волна по нижней кромке —
   лог-частоты, сглаженные во времени, — и туманности, которые МЕНЯЮТ ЦВЕТ ПО
   НАСТРОЕНИЮ музыки (энергия × яркость спектра), как «Моя волна»: цвет трека
   смешивается с личным цветом — здесь это цвет вашего корпуса. Громкий бит
   рождает на пути звёзды; касание экрана — белый импульс.

   ПРАВИЛА ФАЙЛА:
   1. Датчики — по кнопке, каждый деградирует: без GPS — холостые, без
      микрофона — волна дышит сама.
   2. Хранится G.road={day,km,cr}. Комбо и настроение — эфемерны.
   3. Wake Lock, и о батарее сказано прямо. */
const ROAD_VMIN=3,ROAD_VMAX=300;
const ROAD_CR_KM=2,ROAD_CR_CAP=1500,ROAD_COMBO_MAX=3,ROAD_COMBO_T=1200,ROAD_STOP_T=120;
let RD=null;
function roadAll(){if(!G.road||typeof G.road!=="object")G.road={day:-1,km:0,cr:0};return G.road;}
function roadDayReset(){
  const R=roadAll(),d=celDay();
  if(R.day!==d){R.day=d;R.km=0;R.cr=0;}
  return R;
}
function roadSpeedOk(kmh){return kmh>=ROAD_VMIN&&kmh<=ROAD_VMAX;}
function roadCosmic(kmh){return Math.round(kmh/3.6*1000);}
function roadTripRu(km){return km<.001?"0":(km).toFixed(km<10?2:0)+" млн км";}
/* комбо: секунды непрерывного хода → множитель до ×3; простой дольше двух минут сжигает */
function roadCombo(moveT){return 1+Math.min(ROAD_COMBO_MAX-1,(moveT||0)/ROAD_COMBO_T*(ROAD_COMBO_MAX-1));}
/* километры → кредиты, живьём, с мягким потолком дня */
function roadEarnKm(km,moveT){
  const R=roadDayReset();
  R.km+=km;
  if(R.cr>=ROAD_CR_CAP)return 0;
  const due=km*ROAD_CR_KM*roadCombo(moveT);
  RD&&(RD.crFrac=(RD.crFrac||0)+due);
  let n=RD?Math.floor(RD.crFrac):Math.floor(due);
  if(RD)RD.crFrac-=n;
  n=Math.min(n,ROAD_CR_CAP-R.cr);
  if(n>0){R.cr+=n;earn(n,"road");}
  return n;
}
function roadFinish(){
  const R=roadDayReset();
  if(R.cr>0){
    tell("money","Дорога: +"+R.cr+" кр за сегодня · "+R.km.toFixed(1)+" км","ДОРОГА\n+"+R.cr+" кр");
    if(typeof recordAdd==="function")recordAdd("дорога","командировочные: "+R.cr+" кр за "+R.km.toFixed(0)+" км");
  }
}
/* ── датчики ── */
function roadSensorsOn(){
  if(!RD)return;
  const wire=()=>{
    addEventListener("deviceorientation",roadOnTilt);
    addEventListener("devicemotion",roadOnShake);
  };
  if(typeof DeviceOrientationEvent!=="undefined"&&DeviceOrientationEvent.requestPermission)
    DeviceOrientationEvent.requestPermission().then(s=>{if(s==="granted")wire();}).catch(()=>{});
  else wire();
  if(navigator.geolocation&&RD.watch==null){
    RD.watch=navigator.geolocation.watchPosition(roadOnPos,()=>{RD.gps="нет GPS — летим на холостых";},
      {enableHighAccuracy:true,maximumAge:2000,timeout:12000});
  }
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!RD.an){
    navigator.mediaDevices.getUserMedia({audio:true}).then(st=>{
      if(!RD){st.getTracks().forEach(t=>t.stop());return;}
      RD.stream=st;
      const C=SND&&SND.ctx?SND.ctx:new (window.AudioContext||window.webkitAudioContext)();
      RD.an=C.createAnalyser();RD.an.fftSize=256;RD.an.smoothingTimeConstant=.5;
      C.createMediaStreamSource(st).connect(RD.an);
      RD.eq=new Uint8Array(RD.an.frequencyBinCount);
    }).catch(()=>{RD.mic="без микрофона — волна дышит сама";});
  }
  if(navigator.wakeLock&&!RD.lock)navigator.wakeLock.request("screen").then(l=>{if(RD)RD.lock=l;}).catch(()=>{});
  RD.asked=1;
}
function roadOnTilt(e){
  if(!RD)return;
  RD.bankT=clamp((e.gamma||0)/45,-1,1)*.7;
}
function roadOnShake(e){
  if(!RD||!e.accelerationIncludingGravity)return;
  const a=e.accelerationIncludingGravity;
  const m=Math.abs(Math.hypot(a.x||0,a.y||0,a.z||0)-9.81);
  RD.shake=Math.min(1,RD.shake*.9+m*.05);
}
function roadOnPos(p){
  if(!RD)return;
  const c=p.coords,t=p.timestamp;
  let kmh=null;
  if(c.speed!=null&&isFinite(c.speed))kmh=c.speed*3.6;
  else if(RD.lastPos){
    const dt=(t-RD.lastT)/1000;
    if(dt>0){
      const R=6371,dLa=(c.latitude-RD.lastPos.latitude)*Math.PI/180,dLo=(c.longitude-RD.lastPos.longitude)*Math.PI/180;
      const la1=RD.lastPos.latitude*Math.PI/180,la2=c.latitude*Math.PI/180;
      const h=Math.sin(dLa/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2;
      kmh=2*R*Math.asin(Math.sqrt(h))/dt*3600;
    }
  }
  const dt=RD.lastT?(t-RD.lastT)/1000:0;
  if(kmh!=null){
    /* разгон и тормоз: производная скорости, сглаженная */
    if(dt>0){const a=(kmh-(RD.kmh||0))/dt/8;RD.accT=clamp(a,-1,1);}
    if(roadSpeedOk(kmh)&&dt>0&&dt<30){
      RD.moveT=(RD.moveT||0)+dt;RD.stopT=0;
      roadEarnKm(kmh*dt/3600,RD.moveT);
      RD.kmh=kmh;RD.gps=null;
    }else{
      if(dt>0&&kmh<ROAD_VMIN){RD.stopT=(RD.stopT||0)+dt;if(RD.stopT>ROAD_STOP_T)RD.moveT=0;}
      RD.kmh=roadSpeedOk(kmh)?kmh:0;
    }
  }
  RD.lastPos=c;RD.lastT=t;
}
/* ── звук → настроение ──
   Как у «Волны»: анимация идёт в такт и меняет цвет по настроению трека.
   Настроение здесь — две оси: ЭНЕРГИЯ (RMS, атака быстрая, спад медленный —
   дыхание) и ЯРКОСТЬ (спектральный центроид: бас или верха). Кривая волны —
   лог-частоты со сглаживанием. Бит — скачок RMS над своим средним. */
function roadAudio(t){
  if(RD.an&&RD.eq){
    RD.an.getByteFrequencyData(RD.eq);
    const N=RD.eq.length;
    let sum=0,wsum=0;
    for(let i=0;i<N;i++){const v=RD.eq[i]/255;sum+=v*v;wsum+=v*i;}
    const rms=Math.sqrt(sum/N);
    const cen=sum>0?wsum/(N*Math.sqrt(sum*N)):0;
    RD.energy+=(rms-RD.energy)*(rms>RD.energy?.25:.03);
    RD.bright+=(clamp(cen*2.2,0,1)-RD.bright)*.05;
    RD.avg=RD.avg*.985+rms*.015;
    if(rms>RD.avg*1.5&&rms>.22&&t-RD.beatT>.28){RD.beat=1;RD.beatT=t;}
    /* волна: 28 точек по лог-частотам, каждая сглажена */
    for(let i=0;i<28;i++){
      const bin=Math.min(N-1,Math.floor(Math.pow(N,i/27)));
      const v=RD.eq[bin]/255;
      RD.wave[i]+=(v-RD.wave[i])*(v>RD.wave[i]?.4:.12);
    }
  }else{
    /* без микрофона волна дышит сама, спокойно */
    RD.energy+=((.22+.08*Math.sin(t*.5))-RD.energy)*.05;
    RD.bright+=((.45+.2*Math.sin(t*.17))-RD.bright)*.02;
    for(let i=0;i<28;i++)RD.wave[i]+=((.25+.16*Math.sin(t*1.1+i*.5)+.08*Math.sin(t*2.3+i*1.3))-RD.wave[i])*.1;
  }
  RD.beat*=.9;
}
/* цвет настроения: спокойное — фиолетовый→циан по яркости, энергичное —
   маджента→янтарь; смешан с личным цветом — цветом вашего корпуса */
function roadMoodHue(){
  const calm=265-(265-190)*RD.bright;
  const hot=320-(320-40)*RD.bright;
  let h=calm+(hot-calm)*clamp(RD.energy*1.6,0,1);
  const acc=hex2rgb(shipData(G.shipId).col);
  const accH=roadRgbHue(acc);
  return h*.72+accH*.28;
}
function roadRgbHue(c){
  const r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  if(mx===mn)return 200;
  const d=mx-mn;
  let h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);
  return h*60;
}
/* ── экран ── */
function roadOpen(){
  for(const k in keys)keys[k]=false;
  RD={kmh:0,bank:0,bankT:0,shake:0,acc:0,accT:0,phase:0,watch:null,an:null,eq:null,
      lastPos:null,lastT:0,t0:Date.now(),asked:0,raf:0,moveT:0,stopT:0,crFrac:0,
      energy:.2,bright:.5,avg:.1,beat:0,beatT:0,wave:new Array(28).fill(.2),
      sparks:[],pulses:[],crShow:0};
  roadDayReset();
  document.getElementById("roadwin").classList.add("open");
  const cv=document.getElementById("roadcv");
  cv.width=cv.clientWidth*Math.min(2,devicePixelRatio||1);
  cv.height=cv.clientHeight*Math.min(2,devicePixelRatio||1);
  RD.raf=requestAnimationFrame(roadFrame);
}
function roadClose(){
  if(!RD)return;
  if(RD.watch!=null&&navigator.geolocation)navigator.geolocation.clearWatch(RD.watch);
  if(RD.stream)RD.stream.getTracks().forEach(t=>t.stop());
  if(RD.lock)RD.lock.release().catch(()=>{});
  removeEventListener("deviceorientation",roadOnTilt);
  removeEventListener("devicemotion",roadOnShake);
  if(RD.raf)cancelAnimationFrame(RD.raf);
  roadFinish();
  RD=null;
  document.getElementById("roadwin").classList.remove("open");
  if(typeof saveGame==="function")saveGame(true);
}
function roadFrame(ts){
  if(!RD)return;
  drawRoad(ts);
  RD.raf=requestAnimationFrame(roadFrame);
}
function drawRoad(ts){
  const cv=document.getElementById("roadcv"),c=cv.getContext("2d");
  const W=cv.width,H=cv.height,t=ts/1000;
  const spd=RD.kmh||0,fast=clamp(spd/120,0,1);
  roadAudio(t);
  const hue=roadMoodHue(),en=RD.energy;
  /* небо */
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#04060c");g.addColorStop(.65,"#080d18");g.addColorStop(1,"#060a12");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  /* туманности: три мягких пятна, дышат энергией, цвет — настроение музыки.
     Складываются светом (lighter) и сидят некрупно в верхних двух третях —
     ровная заливка на весь экран убивала космос (проход самокритики M168b) */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const bx=W*(.16+.34*i)+Math.sin(t*.05+i*2.1)*W*.06;
    const by=H*(.16+.14*Math.sin(t*.04+i*1.7))+i*H*.12;
    const rad=(H*.13+H*.05*Math.sin(t*.09+i))*(1+en*.7);
    const ng=c.createRadialGradient(bx,by,0,bx,by,rad);
    const a=(.025+en*.09)*(1-i*.18);
    ng.addColorStop(0,"hsla("+((hue+i*42)%360)+",75%,"+(40+RD.bright*20)+"%,"+a.toFixed(3)+")");
    ng.addColorStop(.6,"hsla("+((hue+i*42)%360)+",75%,34%,"+(a*.4).toFixed(3)+")");
    ng.addColorStop(1,"hsla("+((hue+i*42)%360)+",75%,30%,0)");
    c.fillStyle=ng;c.fillRect(bx-rad,by-rad,rad*2,rad*2);
  }
  c.restore();
  /* звёзды текут навстречу; бит рождает новые на пути */
  const r=rng(0x50AD);
  for(let i=0;i<90;i++){
    const depth=.25+r()*.75,y=r()*H;
    const x=(r()*W-t*(20+spd*3)*depth)%W;
    c.globalAlpha=.25+depth*.6;
    c.fillStyle=depth>.8?"#cfe3ea":"#7d8fa0";
    c.fillRect(((x%W)+W)%W,y,1+fast*14*depth,depth>.8?1.6:1);
  }
  c.globalAlpha=1;
  if(RD.beat>.6&&RD.sparks.length<24)
    RD.sparks.push({x:W+20,y:H*(.15+Math.random()*.5),v:2+Math.random()*3+fast*6,life:1,big:Math.random()<.2});
  for(let i=RD.sparks.length-1;i>=0;i--){
    const s=RD.sparks[i];
    s.x-=s.v*(W/390);s.life-=.004;
    if(s.x<-30||s.life<=0){RD.sparks.splice(i,1);continue;}
    c.globalAlpha=s.life*.9;
    c.fillStyle="hsla("+hue+",80%,80%,1)";
    if(s.big){
      c.save();c.translate(s.x,s.y);
      for(let k=0;k<4;k++){c.rotate(Math.PI/4);c.fillRect(-5,-.8,10,1.6);}
      c.restore();
    }else c.fillRect(s.x,s.y,4+s.v,1.4);
  }
  c.globalAlpha=1;
  /* белые импульсы касания — как у «Волны» */
  for(let i=RD.pulses.length-1;i>=0;i--){
    const p=RD.pulses[i];p.r+=W*.012;p.a*=.94;
    if(p.a<.02){RD.pulses.splice(i,1);continue;}
    c.strokeStyle="rgba(255,255,255,"+p.a.toFixed(3)+")";c.lineWidth=2;
    c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.stroke();
  }
  /* корабль: крен — гироскоп; разгон задирает нос и раздувает факел,
     тормоз бьёт носовыми соплами и клюёт вперёд */
  RD.bank+=(RD.bankT-RD.bank)*.06;
  RD.acc+=(RD.accT-RD.acc)*.08;RD.accT*=.995;
  RD.shake*=.985;
  RD.phase+=.016*(1+fast);
  const bob=Math.sin(RD.phase*1.7)*H*.006*(1+RD.shake*2);
  const jx=(Math.random()-.5)*RD.shake*6,jy=(Math.random()-.5)*RD.shake*6;
  const id=G.shipId,h=hullOf(id);
  const sc=Math.min(W/(h.len*1.9),H/(h.bw*5.2));
  const old=ctx;ctx=c;
  c.save();
  c.translate(W*.44+jx+RD.acc*W*.03,H*.46+bob+jy);
  c.scale(sc,sc);
  c.rotate(RD.bank*.22-RD.acc*.08);
  drawHull(id,spd>ROAD_VMIN||RD.acc>.2,RD.acc<-.25,Math.min(3,fast*3+Math.max(0,RD.acc)*2),RD.bank);
  c.restore();
  ctx=old;
  /* волна по нижней кромке: гладкая светящаяся кривая из лог-частот,
     цвет настроения, дыхание энергией. Никаких столбиков. */
  const wh=H*.16*(0.6+en*.9);
  c.save();
  const wg=c.createLinearGradient(0,H-wh,0,H);
  wg.addColorStop(0,"hsla("+hue+",75%,62%,.34)");
  wg.addColorStop(1,"hsla("+hue+",75%,45%,.05)");
  c.fillStyle=wg;
  c.beginPath();c.moveTo(0,H);
  for(let i=0;i<28;i++){
    const x=i/27*W;
    const y=H-8-RD.wave[i]*wh;
    if(i===0)c.lineTo(x,y);
    else{
      const px=(i-1)/27*W,py=H-8-RD.wave[i-1]*wh;
      c.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);
    }
  }
  c.lineTo(W,H);c.closePath();c.fill();
  c.strokeStyle="hsla("+hue+",85%,72%,"+(.35+en*.4).toFixed(2)+")";
  c.lineWidth=1.6;
  c.beginPath();
  for(let i=0;i<28;i++){
    const x=i/27*W,y=H-8-RD.wave[i]*wh;
    if(i===0)c.moveTo(x,y);
    else{const px=(i-1)/27*W,py=H-8-RD.wave[i-1]*wh;c.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);}
  }
  c.stroke();
  c.restore();
  /* числа: скорость, путь, СЧЁТЧИК КРЕДИТОВ и комбо */
  const R=roadAll();
  RD.crShow+=(R.cr-RD.crShow)*.12;                     /* счётчик тикает, не прыгает */
  const combo=roadCombo(RD.moveT);
  const px2=Math.round(W*.05),base=Math.round(H*.1);
  c.textAlign="left";
  c.fillStyle="rgba(190,235,240,.95)";
  c.font=Math.round(H*.052)+"px ui-monospace,monospace";
  c.fillText(spd>=ROAD_VMIN?roadCosmic(spd).toLocaleString("ru")+" км/с":"—",px2,base);
  c.fillStyle="rgba(127,230,216,.6)";
  c.font=Math.round(H*.017)+"px ui-monospace,monospace";
  c.fillText(spd>=ROAD_VMIN?"скорость · настоящая, ×1 000 000":"стоим · дорога сама начнёт считать",px2,base+Math.round(H*.028));
  c.fillText("за поездку "+roadTripRu(R.km),px2,base+Math.round(H*.052));
  /* счётчик: крупно, жёлтым; комбо — фишкой, светится, когда растёт */
  c.fillStyle="rgba(242,178,92,.95)";
  c.font=Math.round(H*.03)+"px ui-monospace,monospace";
  c.fillText("+"+Math.round(RD.crShow).toLocaleString("ru")+" кр",px2,base+Math.round(H*.09));
  if(combo>1.05){
    const cx2=px2+c.measureText("+"+Math.round(RD.crShow).toLocaleString("ru")+" кр").width+Math.round(W*.03);
    c.fillStyle="hsla("+hue+",80%,65%,"+(.7+.3*Math.sin(t*4)).toFixed(2)+")";
    c.font=Math.round(H*.022)+"px ui-monospace,monospace";
    c.fillText("×"+combo.toFixed(1)+" КОМБО",cx2,base+Math.round(H*.088));
  }
  if(R.cr>=ROAD_CR_CAP){c.fillStyle="rgba(127,230,216,.5)";c.font=Math.round(H*.015)+"px ui-monospace,monospace";
    c.fillText("дневной потолок собран — дальше просто красиво",px2,base+Math.round(H*.112));}
  if(RD.gps||RD.mic){c.fillStyle="rgba(127,230,216,.5)";c.font=Math.round(H*.015)+"px ui-monospace,monospace";
    c.fillText([RD.gps,RD.mic].filter(Boolean).join(" · "),px2,base+Math.round(H*.132));}
  if(!RD.asked){
    c.fillStyle="rgba(242,178,92,.85)";
    c.font=Math.round(H*.017)+"px ui-monospace,monospace";
    c.fillText("нажмите РАЗРЕШИТЬ ДАТЧИКИ · экран не гаснет, батарею ест",px2,H-Math.round(H*.15));
  }
}
(function roadWire(){
  const b=document.getElementById("roadbtn");
  if(b)b.addEventListener("click",roadOpen);
  const x=document.getElementById("roadClose");
  if(x)x.addEventListener("click",roadClose);
  const s=document.getElementById("roadSense");
  if(s)s.addEventListener("click",roadSensorsOn);
  const cv=document.getElementById("roadcv");
  if(cv)cv.addEventListener("pointerdown",e=>{
    if(!RD)return;
    const rc=cv.getBoundingClientRect();
    RD.pulses.push({x:(e.clientX-rc.left)*(cv.width/rc.width),y:(e.clientY-rc.top)*(cv.height/rc.height),r:8,a:.6});
  });
  addEventListener("resize",()=>{
    if(!RD)return;
    const cv2=document.getElementById("roadcv");
    cv2.width=cv2.clientWidth*Math.min(2,devicePixelRatio||1);
    cv2.height=cv2.clientHeight*Math.min(2,devicePixelRatio||1);
  });
})();
