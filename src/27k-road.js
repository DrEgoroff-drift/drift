/* ══════════════ дорожный спутник ══════════════
   M168, из docs/DESIGN-road.md (идея автора с голоса). Едете в машине,
   автобусе, поезде — игра становится живой заставкой: ВАШ корабль, тот самый
   корпус, что куплен и оснащён, летит через экран, и настоящая дорога его
   кормит. GPS даёт скорость (переведённую в космическую: ×1 000 000),
   гироскоп кренит корпус в настоящий поворот, тряска дороги дрожит крыльями,
   микрофон гонит эквалайзер по нижней кромке — если в машине музыка, корабль
   летит под неё.

   ЧТО ДОРОГА ДАЁТ ИГРЕ. Километр дороги — единица льда в трюм («воду», как
   сказано у автора), не больше ROAD_ICE_CAP в день: это радость, не источник —
   правила экономики (DESIGN-economy) поездкой не подрываются; скорость выше
   ROAD_VMAX и ниже ROAD_VMIN не считается (самолёт и стояние — не дорога).

   РЕШЕНИЯ ПО РАЗВИЛКАМ ДОКА (автономный заход, можно переиграть):
   1. награда — лёд, потолок 40 ед./день; 2. режим внутри drift.html
   (телефон и так играет с сайта, сейв — тот же); 3. значит, и сейв тот же.

   ПРАВИЛА ФАЙЛА:
   1. Датчики — только по кнопке (iOS требует жеста), каждый деградирует:
      нет GPS — корабль летит «на холостых», нет микрофона — пульс синтетикой.
   2. Хранится G.road={day,km,got}: день, километры, выдано льда.
   3. Экран не гаснет (Wake Lock) — и это сказано игроку: батарея — цена. */
const ROAD_ICE_CAP=40,ROAD_VMIN=3,ROAD_VMAX=300;
let RD=null;
function roadAll(){if(!G.road||typeof G.road!=="object")G.road={day:-1,km:0,got:0};return G.road;}
function roadDayReset(){
  const R=roadAll(),d=celDay();
  if(R.day!==d){R.day=d;R.km=0;R.got=0;}
  return R;
}
function roadSpeedOk(kmh){return kmh>=ROAD_VMIN&&kmh<=ROAD_VMAX;}
/* космические числа: 90 км/ч × 1 000 000 → 25 000 км/с; путь — в млн км */
function roadCosmic(kmh){return Math.round(kmh/3.6*1000);}
function roadTripRu(km){return km<.001?"0":(km).toFixed(km<10?2:0)+" млн км";}
/* километры дороги → лёд, с дневным потолком */
function roadAdvance(km){
  const R=roadDayReset();
  R.km+=km;
  return roadPending();
}
function roadPending(){
  const R=roadDayReset();
  return clamp(Math.floor(R.km),0,ROAD_ICE_CAP)-R.got;
}
function roadCollect(){
  const R=roadDayReset();
  const due=roadPending();if(due<=0)return 0;
  const got=addRes("ice",due);
  R.got+=due;                      /* потолок считает выданное, даже если трюм полон */
  if(got>0){
    tell("good","Дорога: лёд ×"+got+" в трюм · за поездку "+R.km.toFixed(1)+" км","ДОРОГА\nлёд ×"+got);
    if(typeof recordAdd==="function")recordAdd("дорога","привезён лёд с дороги: "+got+" ед.");
  }
  return got;
}
/* ── датчики ── каждый сам по себе, каждый умеет отсутствовать */
function roadSensorsOn(){
  if(!RD)return;
  /* движение и наклон: iOS отдаёт только после requestPermission по жесту */
  const wire=()=>{
    addEventListener("deviceorientation",roadOnTilt);
    addEventListener("devicemotion",roadOnShake);
  };
  if(typeof DeviceOrientationEvent!=="undefined"&&DeviceOrientationEvent.requestPermission)
    DeviceOrientationEvent.requestPermission().then(s=>{if(s==="granted")wire();}).catch(()=>{});
  else wire();
  /* GPS */
  if(navigator.geolocation&&RD.watch==null){
    RD.watch=navigator.geolocation.watchPosition(roadOnPos,()=>{RD.gps="нет GPS — летим на холостых";},
      {enableHighAccuracy:true,maximumAge:2000,timeout:12000});
  }
  /* микрофон → эквалайзер */
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!RD.an){
    navigator.mediaDevices.getUserMedia({audio:true}).then(st=>{
      if(!RD){st.getTracks().forEach(t=>t.stop());return;}
      RD.stream=st;
      const C=SND&&SND.ctx?SND.ctx:new (window.AudioContext||window.webkitAudioContext)();
      RD.an=C.createAnalyser();RD.an.fftSize=64;
      C.createMediaStreamSource(st).connect(RD.an);
      RD.eq=new Uint8Array(RD.an.frequencyBinCount);
    }).catch(()=>{RD.mic="без микрофона — пульс свой";});
  }
  /* экран не гаснет */
  if(navigator.wakeLock&&!RD.lock)navigator.wakeLock.request("screen").then(l=>{if(RD)RD.lock=l;}).catch(()=>{});
  RD.asked=1;
}
function roadOnTilt(e){
  if(!RD)return;
  /* портрет: gamma — наклон вправо-влево; настоящий поворот кренит корпус */
  const g=clamp((e.gamma||0)/45,-1,1);
  RD.bankT=g*.7;
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
      const dKm=2*R*Math.asin(Math.sqrt(h));
      kmh=dKm/dt*3600;
    }
  }
  if(kmh!=null&&RD.lastT&&roadSpeedOk(kmh)){
    const dt=(t-(RD.lastT||t))/1000;
    roadAdvance(kmh*dt/3600);
    RD.kmh=kmh;RD.gps=null;
  }else if(kmh!=null)RD.kmh=roadSpeedOk(kmh)?kmh:0;
  RD.lastPos=c;RD.lastT=t;
}
/* ── экран ── */
function roadOpen(){
  for(const k in keys)keys[k]=false;
  RD={kmh:0,bank:0,bankT:0,shake:0,phase:0,watch:null,an:null,eq:null,lastPos:null,lastT:0,t0:Date.now(),asked:0,raf:0};
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
  roadCollect();
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
  /* небо: глубина + звёзды, текущие навстречу скорости */
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#05070d");g.addColorStop(.6,"#0a0f1c");g.addColorStop(1,"#070b14");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  const r=rng(0x50AD);
  for(let i=0;i<90;i++){
    const depth=.25+r()*.75,y=r()*H;
    const x=(r()*W- t*(20+spd*3)*depth)%W;
    c.globalAlpha=.25+depth*.6;
    c.fillStyle=depth>.8?"#cfe3ea":"#7d8fa0";
    const len=1+fast*14*depth;
    c.fillRect(((x%W)+W)%W,y,len,depth>.8?1.6:1);
  }
  c.globalAlpha=1;
  /* крен: гироскоп тянет, дорога дрожит */
  RD.bank+= (RD.bankT-RD.bank)*.06;
  RD.shake*=.985;
  RD.phase+=.016*(1+fast);
  const bob=Math.sin(RD.phase*1.7)*H*.006*(1+RD.shake*2);
  const jx=(Math.random()-.5)*RD.shake*6,jy=(Math.random()-.5)*RD.shake*6;
  /* корабль: тот же корпус, что во флоте, крупно */
  const id=G.shipId,h=hullOf(id);
  const sc=Math.min(W/(h.len*1.9),H/(h.bw*5.2));
  const old=ctx;ctx=c;
  c.save();
  c.translate(W*.44+jx,H*.46+bob+jy);
  c.scale(sc,sc);
  c.rotate(RD.bank*.22);
  drawHull(id,spd>ROAD_VMIN,false,Math.min(3,fast*3),RD.bank);
  c.restore();
  ctx=old;
  /* эквалайзер по нижней кромке: микрофон или свой пульс */
  const bars=24,bw=W/bars;
  let data=null;
  if(RD.an&&RD.eq){RD.an.getByteFrequencyData(RD.eq);data=RD.eq;}
  for(let i=0;i<bars;i++){
    const v=data?data[Math.floor(i*data.length/bars)]/255
              :(.18+.14*Math.sin(t*2.2+i*.7)+.08*Math.sin(t*5.1+i*1.9))*(.5+fast*.5);
    const bh=Math.max(2,v*H*.12);
    c.fillStyle="rgba(127,230,216,"+(.25+v*.5).toFixed(2)+")";
    c.fillRect(i*bw+1,H-bh,bw-2,bh);
  }
  /* числа: скорость космическая, путь за поездку, лёд */
  const px=Math.round(W*.05),base=Math.round(H*.1);
  c.textAlign="left";
  c.fillStyle="rgba(190,235,240,.95)";
  c.font=Math.round(H*.052)+"px ui-monospace,monospace";
  c.fillText(spd>=ROAD_VMIN?roadCosmic(spd).toLocaleString("ru")+" км/с":"—",px,base);
  c.fillStyle="rgba(127,230,216,.6)";
  c.font=Math.round(H*.017)+"px ui-monospace,monospace";
  c.fillText(spd>=ROAD_VMIN?"скорость · настоящая, ×1 000 000":"стоим · дорога сама начнёт считать",px,base+Math.round(H*.028));
  const R=roadAll();
  c.fillText("за поездку "+roadTripRu(R.km)+" · лёд "+Math.min(Math.floor(R.km),ROAD_ICE_CAP)+" / "+ROAD_ICE_CAP+" за день",px,base+Math.round(H*.052));
  if(RD.gps)c.fillText(RD.gps,px,base+Math.round(H*.076));
  if(RD.mic)c.fillText(RD.mic,px,base+Math.round(H*.076)+(RD.gps?Math.round(H*.02):0));
  if(!RD.asked){
    c.fillStyle="rgba(242,178,92,.85)";
    c.fillText("нажмите РАЗРЕШИТЬ ДАТЧИКИ · экран не гаснет, батарею ест",px,H-Math.round(H*.15));
  }
}
(function roadWire(){
  const b=document.getElementById("roadbtn");
  if(b)b.addEventListener("click",roadOpen);
  const x=document.getElementById("roadClose");
  if(x)x.addEventListener("click",roadClose);
  const s=document.getElementById("roadSense");
  if(s)s.addEventListener("click",roadSensorsOn);
  addEventListener("resize",()=>{
    if(!RD)return;
    const cv=document.getElementById("roadcv");
    cv.width=cv.clientWidth*Math.min(2,devicePixelRatio||1);
    cv.height=cv.clientHeight*Math.min(2,devicePixelRatio||1);
  });
})();
