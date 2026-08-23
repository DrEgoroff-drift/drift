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
const ROAD_VMIN=3,ROAD_VMAX=1000;
const ROAD_TIERS=[{v:200,ru:"ДОРОГА"},{v:400,ru:"ЭКСПРЕСС"},{v:1000,ru:"ГИПЕРДРАЙВ"}];
const ROAD_C=299792;                      /* км/с: на гипердрайве счёт идёт в долях света */
const ROAD_CR_KM=2,ROAD_CR_CAP=1500,ROAD_COMBO_MAX=3,ROAD_COMBO_T=1200,ROAD_STOP_T=120;
let RD=null;
function roadAll(){if(!G.road||typeof G.road!=="object")G.road={day:-1,km:0,cr:0};return G.road;}
function roadDayReset(){
  const R=roadAll(),d=celDay();
  if(R.day!==d){R.day=d;R.km=0;R.cr=0;}
  return R;
}
function roadSpeedOk(kmh){return kmh>=ROAD_VMIN&&kmh<=ROAD_VMAX;}
/* ярус по скорости: 1 дорога (машина), 2 экспресс (поезд), 3 гипердрайв (самолёт) */
function roadTier(kmh){
  if(!roadSpeedOk(kmh))return 0;
  for(let i=0;i<ROAD_TIERS.length;i++)if(kmh<=ROAD_TIERS[i].v)return i+1;
  return 0;
}
/* доля скорости света после ×1 000 000: 850 км/ч → 0.79 c */
function roadLightFrac(kmh){return kmh/3.6*1000/ROAD_C;}
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
  /* спрошено — кнопка своё отслужила */
  const b=document.getElementById("roadSense");if(b)b.style.display="none";
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
  /* боковое усилие поворота (портрет: ось x поперёк хода) — корабль шарахнется */
  RD.latT=clamp((a.x||0)/5,-1,1);
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
  document.body.classList.add("road");
  const sb=document.getElementById("roadSense");if(sb)sb.style.display="";
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
  document.body.classList.remove("road");
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
  const spd=RD.kmh||0;
  /* ярус с гистерезисом: машина не мигает в «экспресс» на обгоне — новый ярус
     должен продержаться четыре секунды */
  const want=roadTier(spd)||1;
  if(want!==(RD.tier||1)){RD.tierT=(RD.tierT||0)+.016;if(RD.tierT>4)RD.tier=want;}
  else RD.tierT=0;
  const tier=RD.tier||1;
  const fast=clamp(spd/(tier===3?900:tier===2?330:120),0,1);
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
    const rad=(H*.16+H*.06*Math.sin(t*.09+i))*(1+en*.9);
    const ng=c.createRadialGradient(bx,by,0,bx,by,rad);
    const a=(.07+en*.2)*(1-i*.18);
    ng.addColorStop(0,"hsla("+((hue+i*42)%360)+",75%,"+(40+RD.bright*20)+"%,"+a.toFixed(3)+")");
    ng.addColorStop(.6,"hsla("+((hue+i*42)%360)+",75%,34%,"+(a*.4).toFixed(3)+")");
    ng.addColorStop(1,"hsla("+((hue+i*42)%360)+",75%,30%,0)");
    c.fillStyle=ng;c.fillRect(bx-rad,by-rad,rad*2,rad*2);
  }
  c.restore();
  /* корабль летит ВВЕРХ (портретный экран — дорога впереди): звёзды текут
     вниз; на экспрессе тянутся вдвое, бит рождает новые */
  const r=rng(0x50AD);
  const streak=tier===2?2.2:tier===3?4:1;
  for(let i=0;i<90;i++){
    const depth=.25+r()*.75,x=r()*W;
    const y=(r()*H+t*(20+Math.min(spd,300)*3)*depth)%H;
    c.globalAlpha=.25+depth*.6;
    c.fillStyle=depth>.8?"#cfe3ea":"#7d8fa0";
    c.fillRect(x,((y%H)+H)%H,depth>.8?1.6:1,1+fast*14*depth*streak);
  }
  c.globalAlpha=1;
  /* гипердрайв (самолёт): звёздный тоннель — росчерки сходятся в точку по
     курсу (над кораблём), и корпус идёт в световом коконе */
  if(tier===3){
    const vx=W*.5,vy=H*.2;
    c.save();c.globalCompositeOperation="lighter";
    const wr=rng(0x3A9F);
    for(let i=0;i<46;i++){
      const a2=wr()*TAU,rr0=(60+wr()*Math.max(W,H))*(1+((t*1.6+wr())%1));
      const x0=vx+Math.cos(a2)*rr0*.8,y0=vy+Math.sin(a2)*rr0;
      const k2=.72;
      c.strokeStyle="hsla("+hue+",70%,80%,"+(.05+fast*.12).toFixed(3)+")";
      c.lineWidth=1+wr()*1.4;
      c.beginPath();c.moveTo(x0,y0);c.lineTo(vx+(x0-vx)*k2,vy+(y0-vy)*k2);c.stroke();
    }
    c.restore();
  }
  if(RD.beat>.6&&RD.sparks.length<24)
    RD.sparks.push({x:W*(.1+Math.random()*.8),y:-20,v:2+Math.random()*3+fast*6,life:1,big:Math.random()<.2});
  for(let i=RD.sparks.length-1;i>=0;i--){
    const s=RD.sparks[i];
    s.y+=s.v*(H/700);s.life-=.004;
    if(s.y>H+30||s.life<=0){RD.sparks.splice(i,1);continue;}
    c.globalAlpha=s.life*.9;
    c.fillStyle="hsla("+hue+",80%,80%,1)";
    if(s.big){
      c.save();c.translate(s.x,s.y);
      for(let k=0;k<4;k++){c.rotate(Math.PI/4);c.fillRect(-5,-.8,10,1.6);}
      c.restore();
    }else c.fillRect(s.x,s.y,1.4,4+s.v);
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
  const sc=Math.min(W/(h.bw*5.2),H/(h.len*2.4))*.6;
  /* шараханье в повороте: боковое усилие и наклон гонят корпус от центра,
     потом он ПОСТЕПЕННО центрируется — быстро в сторону, медленно домой */
  /* знак минус: телефон кренится в поворот, а корпус на экране уходит наружу */
  const shove=-clamp((RD.latT||0)+(RD.bankT||0)*.8,-1,1);
  RD.latT=(RD.latT||0)*.97;
  const want2=shove*W*.35,x0=RD.xOff||0;
  RD.xOff=x0+(want2-x0)*(Math.abs(shove)>.12?.12:.015);
  /* разгон подтягивает корпус к верху экрана, тормоз — к низу */
  const wantY=-clamp(RD.acc,-1,1)*H*.1,y0=RD.yOff||0;
  RD.yOff=y0+(wantY-y0)*.06;
  /* шлейф из сопел — та же лента, что в полёте (16-flight): газ остаётся,
     где выброшен, и стекает вниз вместе с потоком звёзд; корабль шарахается —
     лента изгибается. Цвет — trailTint, ядро добела, к хвосту в акцент корпуса */
  const rot=-Math.PI/2+RD.bank*.22-RD.acc*.06;
  const cx=W*.5+RD.xOff+jx,cy=H*.5+bob+jy+RD.yOff;
  if(!RD.trail){RD.trail=[];RD.burst=0;}
  const thrust=spd>ROAD_VMIN||RD.acc>.2;
  if(thrust&&!RD.thrOn)RD.burst++;
  RD.thrOn=thrust;
  const flow=60+fast*H*1.4;
  for(let i=RD.trail.length-1;i>=0;i--){
    const p=RD.trail[i];p.y+=flow*.016;p.life-=.016;
    if(p.life<=0||p.y>H+40)RD.trail.splice(i,1);
  }
  if(thrust&&RD.trail.length<260){
    const co=Math.cos(rot),si=Math.sin(rot);
    const span=(.5+fast*.9)*(1+Math.max(0,RD.acc)*.8);
    for(let i=0;i<h.eng.length;i++){
      const e=h.eng[i];
      const ex=cx+(e.x*co-e.y*si)*sc,ey=cy+(e.x*si+e.y*co)*sc;
      RD.trail.push({x:ex+(Math.random()-.5)*1.5,y:ey,e:i,b:RD.burst,
        r:e.r*sc*(.54+Math.random()*.08),max:span,life:span});
    }
  }
  {
    const T=trailTint(id,G.mods.engine|0);
    c.save();c.globalCompositeOperation="lighter";c.lineCap="butt";c.lineJoin="round";
    const lanes={};
    for(const p of RD.trail){const k=p.e+"/"+p.b;(lanes[k]||(lanes[k]=[])).push(p);}
    for(const k in lanes){
      const arr=lanes[k];
      for(let i=1;i<arr.length;i++){
        const a=arr[i-1],b2=arr[i];
        const u=clamp((a.life/a.max+b2.life/b2.max)*.5,0,1);
        const col=u>.78?mixc(T.mid,T.core,(u-.78)/.22):mixc(T.edge,T.mid,u/.78);
        c.strokeStyle=rgba(col,(u*u*.3+u*u*u*u*.5).toFixed(3));
        c.lineWidth=Math.max(1,b2.r*(2.4-u*1.3)*1.35);
        c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b2.x,b2.y);c.stroke();
      }
      const f=arr[arr.length-1];
      if(f&&f.life>f.max-.05){
        c.fillStyle=rgba(T.core,.62);
        c.beginPath();c.arc(f.x,f.y,Math.max(.8,f.r*1.3),0,TAU);c.fill();
      }
    }
    c.restore();
  }
  const old=ctx;ctx=c;
  c.save();
  c.translate(cx,cy);
  /* световой кокон гипердрайва — под корпусом, одним светом */
  if(tier===3){
    c.save();c.globalCompositeOperation="lighter";
    const cg=c.createRadialGradient(0,0,h.len*sc*.1,0,0,h.len*sc*.75);
    cg.addColorStop(0,"hsla("+hue+",80%,70%,.14)");cg.addColorStop(1,"hsla("+hue+",80%,70%,0)");
    c.fillStyle=cg;c.beginPath();c.ellipse(0,0,h.bw*sc*1.6,h.len*sc*.75,0,0,TAU);c.fill();
    c.restore();
  }
  /* нос вверх: портретный экран — дорога впереди; шлейф уже лёг лентой ниже */
  c.rotate(rot);
  c.scale(sc,sc);
  drawHull(id,spd>ROAD_VMIN||RD.acc>.2,RD.acc<-.25,Math.min(3,fast*3+Math.max(0,RD.acc)*2+(tier===3?1:0)),RD.bank);
  c.restore();
  ctx=old;
  /* волна по нижней кромке: гладкая светящаяся кривая из лог-частот,
     цвет настроения, дыхание энергией. Никаких столбиков. */
  /* нижняя кромка волны — над футером с кнопками, иначе половина дыхания
     пряталась за ними */
  const wb=H*.9,wh=H*.16*(0.6+en*.9);
  c.save();
  const wg=c.createLinearGradient(0,wb-wh,0,wb);
  wg.addColorStop(0,"hsla("+hue+",75%,62%,.34)");
  wg.addColorStop(1,"hsla("+hue+",75%,45%,.05)");
  c.fillStyle=wg;
  c.beginPath();c.moveTo(0,wb);
  for(let i=0;i<28;i++){
    const x=i/27*W;
    const y=wb-8-RD.wave[i]*wh;
    if(i===0)c.lineTo(x,y);
    else{
      const px=(i-1)/27*W,py=wb-8-RD.wave[i-1]*wh;
      c.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);
    }
  }
  c.lineTo(W,wb);c.closePath();c.fill();
  c.strokeStyle="hsla("+hue+",85%,72%,"+(.35+en*.4).toFixed(2)+")";
  c.lineWidth=1.6;
  c.beginPath();
  for(let i=0;i<28;i++){
    const x=i/27*W,y=wb-8-RD.wave[i]*wh;
    if(i===0)c.moveTo(x,y);
    else{const px=(i-1)/27*W,py=wb-8-RD.wave[i-1]*wh;c.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);}
  }
  c.stroke();
  c.restore();
  /* числа: скорость, путь, СЧЁТЧИК КРЕДИТОВ и комбо */
  const R=roadAll();
  RD.crShow+=(R.cr-RD.crShow)*.12;                     /* счётчик тикает, не прыгает */
  const combo=roadCombo(RD.moveT);
  const px2=Math.round(W*.05),base=Math.round(H*.1);
  c.textAlign="left";
  c.fillStyle=tier===3?"hsla("+hue+",70%,80%,.95)":"rgba(190,235,240,.95)";
  c.font=Math.round(H*.052)+"px ui-monospace,monospace";
  /* на гипердрайве счёт — в долях света: 850 км/ч после ×1 000 000 — 0.79 c */
  c.fillText(spd<ROAD_VMIN?"—":tier===3?roadLightFrac(spd).toFixed(2)+" световой":roadCosmic(spd).toLocaleString("ru")+" км/с",px2,base);
  c.fillStyle="rgba(127,230,216,.6)";
  c.font=Math.round(H*.017)+"px ui-monospace,monospace";
  let sub=spd<ROAD_VMIN?"стоим · дорога сама начнёт считать":
    tier===1?"ДОРОГА · скорость настоящая, ×1 000 000":
    tier===2?"ЭКСПРЕСС · судя по ходу — поезд · ×1 000 000":
    "ГИПЕРДРАЙВ · судя по ходу — самолёт · "+roadCosmic(spd).toLocaleString("ru")+" км/с";
  while(sub.length>8&&c.measureText(sub).width>W-px2*2)sub=sub.replace(/ · [^·]*$/,"");
  c.fillText(sub,px2,base+Math.round(H*.028));
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
