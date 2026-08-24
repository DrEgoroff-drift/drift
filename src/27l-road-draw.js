/* ══════════════ дорожный спутник: экран ══════════════
   Вторая половина 27k-road: сам экран и кадр. Меры движения, деньги и датчики
   остались там; сюда переехало всё, что рисует, — файл перевалил за 40 КБ,
   и шов прошёл по готовой границе «── экран ──».

   ЧТО ВАЖНО ЗНАТЬ ПРО КАДР (M168g):
   1. Время — из настоящего dt, а не из зашитой шестнадцатой. Иначе на экране
      в 120 Гц лента вдвое гуще, а все выдержки вдвое короче.
   2. Шлейф — ОДНО тело на сопло: заливка с продольным градиентом. Сотня
      отрезков со сложением света давала на стыках пересвет, и газ выглядел
      стопкой кирпичей до самого низа экрана.
   3. Лента живёт ровно столько, чтобы всегда быть одной длины на экране и
      погаснуть В КАДРЕ, а низ экрана гаснет в фон: под ним подвал с кнопкой. */
/* ── экран ── */
function roadOpen(){
  for(const k in keys)keys[k]=false;
  RD={kmh:0,bank:0,bankT:0,shake:0,kick:0,acc:0,accT:0,phase:0,wob:0,watch:null,an:null,eq:null,
      g0:null,g0T:0,side:0,blind:false,turn:0,turnT:0,xOff:0,yOff:0,emit:0,cxPrev:null,
      lastPos:null,lastT:0,lastFrame:0,t0:Date.now(),asked:0,raf:0,moveT:0,stopT:0,crFrac:0,
      energy:.2,bright:.5,avg:.1,beat:0,beatT:0,wave:new Array(28).fill(.2),
      sparks:[],pulses:[],crShow:0};
  roadDayReset();
  document.getElementById("roadwin").classList.add("open");
  document.body.classList.add("road");
  const sb=document.getElementById("roadSense");if(sb)sb.style.display="";
  RD.pingIv=setInterval(roadPing,30000);
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
  removeEventListener("devicemotion",roadOnShake);
  if(RD.raf)cancelAnimationFrame(RD.raf);
  if(RD.pingIv)clearInterval(RD.pingIv);
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
/* ── полуразмах корпуса на экране (M168g) ──
   h.bw — ширина ТЕЛА, а по бортам ещё пилоны, баки и крылья: у «Стрижа» размах
   вдвое больше bw. Чтобы шараханье могло уходить к самому краю и при этом не
   срезать корпус, размах меряем честно — один раз рисованием, с запасом хранения
   по id корпуса, в единицах корпуса (умножается на sc уже на месте). */
const ROAD_HALF={};
function roadHullHalf(id){
  if(ROAD_HALF[id]!=null)return ROAD_HALF[id];
  const h=hullOf(id),K=8;
  const o=document.createElement("canvas");
  o.width=Math.max(32,Math.ceil(h.bw*K*6));o.height=Math.max(32,Math.ceil(h.len*K*2));
  const oc=o.getContext("2d"),old=ctx;ctx=oc;
  oc.save();oc.translate(o.width/2,o.height/2);oc.rotate(-Math.PI/2);oc.scale(K,K);
  drawHull(id,false,false,0,0);
  oc.restore();ctx=old;
  const d=oc.getImageData(0,0,o.width,o.height).data;
  let lo=o.width,hi=-1;
  for(let y=0;y<o.height;y++)for(let x=0;x<o.width;x++)
    if(d[(y*o.width+x)*4+3]>20){if(x<lo)lo=x;if(x>hi)hi=x;}
  return ROAD_HALF[id]=hi<0?h.bw:Math.max(o.width/2-lo,hi-o.width/2)/K;
}
function drawRoad(ts){
  const cv=document.getElementById("roadcv"),c=cv.getContext("2d");
  const W=cv.width,H=cv.height,t=ts/1000;
  /* настоящий шаг кадра: зашитая шестнадцатая врала вдвое на экране в 120 Гц —
     лента сгущалась, гистерезис яруса и объявление системы вдвое укорачивались */
  const dt=RD.lastFrame?clamp(t-RD.lastFrame,.001,.1):1/60;
  RD.lastFrame=t;
  const ease=tau=>1-Math.exp(-dt/tau);
  const spd=RD.kmh||0;
  /* ярус с гистерезисом: машина не мигает в «экспресс» на обгоне — новый ярус
     должен продержаться четыре секунды */
  const want=roadTier(spd)||1;
  if(want!==(RD.tier||1)){RD.tierT=(RD.tierT||0)+dt;if(RD.tierT>4)RD.tier=want;}
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
     ровная заливка на весь экран убивала космос (проход самокритики M168b).
     Подняты (M168g): на прежних .07 кадр был пустой чернотой, особенно на стоянке */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const bx=W*(.16+.34*i)+Math.sin(t*.05+i*2.1)*W*.06;
    const by=H*(.16+.14*Math.sin(t*.04+i*1.7))+i*H*.12;
    const rad=(H*.16+H*.06*Math.sin(t*.09+i))*(1+en*.9);
    const ng=c.createRadialGradient(bx,by,0,bx,by,rad);
    const a=(.12+en*.24)*(1-i*.16);
    ng.addColorStop(0,"hsla("+((hue+i*42)%360)+",75%,"+(40+RD.bright*20)+"%,"+a.toFixed(3)+")");
    ng.addColorStop(.6,"hsla("+((hue+i*42)%360)+",75%,34%,"+(a*.4).toFixed(3)+")");
    ng.addColorStop(1,"hsla("+((hue+i*42)%360)+",75%,30%,0)");
    c.fillStyle=ng;c.fillRect(bx-rad,by-rad,rad*2,rad*2);
  }
  c.restore();
  /* корабль летит ВВЕРХ (портретный экран — дорога впереди): звёзды текут
     вниз; на экспрессе тянутся вдвое, бит рождает новые.
     У каждой звезды СВОИ размер, длина и яркость (M168g): прежде все были
     одинаковы — поток читался ровным дождём. Мелких много, жирных единицы
     (куб от ровного), одна из восьми — тёплая или в цвет настроения. */
  const r=rng(0x50AD);
  const streak=tier===2?2.2:tier===3?4:1;
  const nst=tier===3?190:tier===2?150:110;
  for(let i=0;i<nst;i++){
    const depth=.25+r()*.75,x=r()*W;
    const q=r(),sz=.7+q*q*q*2.2;
    const own=.5+r()*1.3;
    const warm=r()<.125;
    const y=(r()*H+t*(20+Math.min(spd,300)*3)*depth)%H;
    c.globalAlpha=clamp((.18+depth*.55)*(.6+sz*.22),0,.95);
    c.fillStyle=warm?"hsla("+hue+",55%,84%,1)":depth>.8?"#cfe3ea":"#7d8fa0";
    c.fillRect(x,((y%H)+H)%H,sz,sz+fast*14*depth*streak*own);
  }
  /* дальняя пыль: почти неподвижна — от неё берётся глубина, а не скорость */
  for(let i=0;i<60;i++){
    const depth=.05+r()*.15,x=r()*W;
    const y=(r()*H+t*(6+Math.min(spd,300)*.5)*depth)%H;
    c.globalAlpha=.10+depth*.5;
    c.fillStyle="#5c6b7a";
    c.fillRect(x,((y%H)+H)%H,1,1);
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
  /* пилоты рядом (M168f): кто сейчас едет по этому же сектору — далёкие
     попутные корабли: искра с выхлопом, своя глубина и свой дрейф. Рисунок
     детерминирован сектором, у всех в клетке одна картина; появляются и
     тают плавно, чтобы смена счёта не мигала. */
  RD.matesShow=(RD.matesShow||0)+(Math.min(RD.mates||0,5)-(RD.matesShow||0))*ease(.83);
  if(RD.matesShow>.05&&RD.sys){
    c.save();c.globalCompositeOperation="lighter";
    const pr=rng(hashi(RD.sys.cx,RD.sys.cy,0x9110));
    const n=Math.ceil(RD.matesShow);
    for(let i=0;i<n;i++){
      const depth=.35+pr()*.45,bx=W*(.1+pr()*.8),ph=pr()*TAU,spdK=.004+pr()*.006;
      const fr=(ph/TAU+t*spdK*(1.2-depth))%1;
      const x=bx+Math.sin(t*.13+ph)*W*.05*depth;
      const y=H*(.12+.6*fr);
      const vis=Math.sin(Math.PI*fr)*clamp(RD.matesShow-i,0,1);
      if(vis<=0)continue;
      const s=.9+depth*1.4;
      c.globalAlpha=vis*.85;
      c.fillStyle="hsla("+hue+",60%,88%,1)";
      c.fillRect(x-1.1*s,y-2.6*s,2.2*s,5.2*s);
      const tg=c.createLinearGradient(x,y+2*s,x,y+2*s+16*s);
      tg.addColorStop(0,"hsla("+hue+",80%,70%,.5)");tg.addColorStop(1,"hsla("+hue+",80%,70%,0)");
      c.fillStyle=tg;c.fillRect(x-.8*s,y+2*s,1.6*s,16*s);
    }
    c.globalAlpha=1;c.restore();
  }
  if(RD.beat>.6&&RD.sparks.length<24)
    RD.sparks.push({x:W*(.1+Math.random()*.8),y:-20,v:2+Math.random()*3+fast*6,life:1,big:Math.random()<.2});
  for(let i=RD.sparks.length-1;i>=0;i--){
    const s=RD.sparks[i];
    s.y+=s.v*(H/700)*60*dt;s.life-=.24*dt;
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
    const p=RD.pulses[i];p.r+=W*.012*60*dt;p.a*=Math.exp(-dt/.27);
    if(p.a<.02){RD.pulses.splice(i,1);continue;}
    c.strokeStyle="rgba(255,255,255,"+p.a.toFixed(3)+")";c.lineWidth=2;
    c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.stroke();
  }
  /* ── корпус на экране ──
     Поворот машины кренит корпус и уводит его наружу; разгон задирает нос и
     раздувает факел, тормоз бьёт носовыми соплами и клюёт вперёд. */
  const id=G.shipId,h=hullOf(id);
  /* корабль мельче (было ×.6): пятая экрана вместо четверти — кадру нужен
     воздух, а ленте место, чтобы кончиться до подвала (M168g) */
  const sc=Math.min(W/(h.bw*5.2),H/(h.len*2.4))*.46;
  /* поворот: в сторону быстро, обратно медленно — иначе снос не читается */
  const tauT=Math.abs(RD.turnT||0)>Math.abs(RD.turn||0)?ROAD_TURN_ATK:ROAD_TURN_REL;
  RD.turn=(RD.turn||0)+((RD.turnT||0)-(RD.turn||0))*ease(tauT);
  RD.bankT=clamp(RD.turn*.7,-1,1);
  RD.bank+=(RD.bankT-RD.bank)*ease(.27);
  RD.acc+=(RD.accT-RD.acc)*ease(.2);RD.accT*=Math.exp(-dt/3.3);
  /* тряску ведёт roadOnShake; здесь она сама гаснет, если датчик замолчал */
  RD.shake=(RD.shake||0)*Math.exp(-dt/2.5);
  RD.kick=(RD.kick||0)*Math.exp(-dt/.12);
  RD.phase+=dt*(1+fast);
  const bob=Math.sin(RD.phase*1.7)*H*.006*(1+RD.shake*1.2);
  /* дрожь — ГЛАДКАЯ, два несоизмеримых колебания около пяти герц. Прежде это
     был покадровый Math.random(): на 60 Гц он читается не вибрацией, а
     дёрганьем, и на видео стробит (M168g) */
  RD.wob=(RD.wob||0)+dt;
  const wA=H*.0028*RD.shake;
  const jx=(Math.sin(RD.wob*32.0)*.6+Math.sin(RD.wob*52.1+1.7)*.4)*wA;
  const jy=(Math.sin(RD.wob*42.1+2.4)*.55+Math.sin(RD.wob*27.0+.9)*.45)*wA*.85+RD.kick*H*.012;
  /* шараханье в повороте: корпус уходит НАРУЖУ и потом ПОСТЕПЕННО центрируется.
     Ворота по скорости: во дворе и с телефоном в руках не швыряет, но крен от
     наклона телефона остаётся — экран живой и на стоянке */
  const gate=clamp((spd-ROAD_MOVE_GATE)/(ROAD_MOVE_FULL-ROAD_MOVE_GATE),0,1);
  const shove=clamp(RD.turn*gate,-1,1);
  const maxOff=Math.max(0,Math.min(W*ROAD_SWERVE,W*.5-roadHullHalf(id)*sc-W*.02));
  const want2=shove*maxOff;
  const kOff=ease(Math.abs(want2)>Math.abs(RD.xOff||0)?ROAD_XOFF_OUT:ROAD_XOFF_HOME);
  const lim=W*1.2*dt;                     /* и ничего не может прыгнуть за кадр */
  RD.xOff=(RD.xOff||0)+clamp((want2-(RD.xOff||0))*kOff,-lim,lim);
  /* разгон подтягивает корпус к верху экрана, тормоз — к низу */
  const wantY=-clamp(RD.acc,-1,1)*H*.1;
  RD.yOff=(RD.yOff||0)+(wantY-(RD.yOff||0))*ease(.27);
  const rot=-Math.PI/2+RD.bank*.22-RD.acc*.06;
  const cx=W*.5+RD.xOff+jx,cy=H*.5+bob+jy+RD.yOff;
  /* ── шлейф ──
     Газ остаётся, где выброшен, и стекает вниз вместе с потоком звёзд; корабль
     шарахается — лента изгибается. Точки кладутся через равный ШАГ ПО ПУТИ, а не
     раз в кадр: тогда лента одинаково плотная и на 60, и на 120 Гц, и на любой
     скорости. Срок жизни подобран так, чтобы лента ВСЕГДА была одной длины на
     экране и успевала погаснуть в кадре — прежде она была длиной в 1.7 экрана,
     и её обрубала нижняя кромка прямо по кнопке НАЗАД (M168g). */
  if(!RD.trail){RD.trail=[];RD.burst=0;}
  const thrust=spd>ROAD_VMIN||RD.acc>.2;
  if(thrust&&!RD.thrOn)RD.burst++;
  RD.thrOn=thrust;
  const flow=H*(.22+fast*1.2);
  const span=ROAD_TRAIL_LEN*H/flow;
  for(let i=RD.trail.length-1;i>=0;i--){
    const p=RD.trail[i];
    p.y+=flow*dt;p.x+=p.vx*dt;p.life-=dt;
    if(p.life<=0||p.y>H+40)RD.trail.splice(i,1);
  }
  if(thrust){
    const step=H*ROAD_TRAIL_STEP;
    RD.emit=(RD.emit||0)+flow*dt;
    const n=Math.min(6,Math.floor(RD.emit/step));
    RD.emit-=n*step;
    const co=Math.cos(rot),si=Math.sin(rot);
    const px=RD.cxPrev==null?cx:RD.cxPrev,py=RD.cyPrev==null?cy:RD.cyPrev;
    for(let k=n;k>0&&RD.trail.length<ROAD_TRAIL_MAX;k--){
      const back=(k-1)*step+RD.emit;                       /* сколько точка уже проехала вниз */
      const fr=clamp(1-back/Math.max(1e-3,flow*dt),0,1);   /* и где в это время был корабль */
      const bx=px+(cx-px)*fr,by=py+(cy-py)*fr;
      for(let i=0;i<h.eng.length;i++){
        const e=h.eng[i];
        RD.trail.push({x:bx+(e.x*co-e.y*si)*sc,y:by+(e.x*si+e.y*co)*sc+back,e:i,b:RD.burst,
          vx:(Math.sin(t*2.3+i*2.1)*.7+(Math.random()-.5)*.6)*W*.045,
          r:e.r*sc*(.6+Math.random()*.06),max:span,life:Math.max(.02,span-back/flow)});
      }
    }
  }
  RD.cxPrev=cx;RD.cyPrev=cy;
  {
    const T=trailTint(id,G.mods.engine|0);
    c.save();c.globalCompositeOperation="lighter";
    const lanes={};
    for(const p of RD.trail){const k=p.e+"/"+p.b;(lanes[k]||(lanes[k]=[])).push(p);}
    for(const k in lanes){
      const arr=lanes[k];
      if(arr.length<2)continue;
      /* ОДНО тело на сопло: кромка туда, кромка обратно, одна заливка с
         продольным градиентом. Прежде лента рисовалась сотней отрезков со
         сложением света — на стыках копился пересвет, ширина росла ступеньками,
         и газ превращался в стопку кирпичей (разбор M168g) */
      const nrm=i=>{
        const q=arr[Math.min(arr.length-1,i+1)],o=arr[Math.max(0,i-1)];
        const tx=q.x-o.x,ty=q.y-o.y,tl=Math.hypot(tx,ty)||1;
        const p=arr[i],u=clamp(p.life/p.max,0,1),w=p.r*(1.4+(1-u)*2.6);
        return [-ty/tl*w,tx/tl*w];
      };
      c.beginPath();
      for(let i=0;i<arr.length;i++){
        const p=arr[i],nn=nrm(i);
        if(i===0)c.moveTo(p.x+nn[0],p.y+nn[1]);else c.lineTo(p.x+nn[0],p.y+nn[1]);
      }
      for(let i=arr.length-1;i>=0;i--){
        const p=arr[i],nn=nrm(i);
        c.lineTo(p.x-nn[0],p.y-nn[1]);
      }
      c.closePath();
      const a0=arr[0],a1=arr[arr.length-1];
      const u0=clamp(a0.life/a0.max,0,1),u1=clamp(a1.life/a1.max,0,1);
      const col=u=>u>.78?mixc(T.mid,T.core,(u-.78)/.22):mixc(T.edge,T.mid,u/.78);
      /* спад квадратичный, как в полёте: с линейным хвост держал яркость почти
         до конца и выглядел начерченной линией, а не рассеянным газом */
      const alp=u=>(u*u*.30+u*u*u*u*.5).toFixed(3);
      if(Math.hypot(a1.x-a0.x,a1.y-a0.y)<1)c.fillStyle=rgba(col(u1),alp(u1));
      else{
        const gr=c.createLinearGradient(a1.x,a1.y,a0.x,a0.y);
        for(let j=0;j<=4;j++){const s=j/4,u=u1+(u0-u1)*s;gr.addColorStop(s,rgba(col(u),alp(u)));}
        c.fillStyle=gr;
      }
      c.fill();
      /* выход из сопла: раскалённое ядро с ореолом */
      if(a1.life>a1.max-.06){
        const rr2=Math.max(2,a1.r*1.7);
        const hg=c.createRadialGradient(a1.x,a1.y,0,a1.x,a1.y,rr2*3);
        hg.addColorStop(0,rgba(T.core,.75));hg.addColorStop(.35,rgba(T.mid,.28));hg.addColorStop(1,rgba(T.edge,0));
        c.fillStyle=hg;c.beginPath();c.arc(a1.x,a1.y,rr2*3,0,TAU);c.fill();
        c.fillStyle=rgba(T.core,.85);
        c.beginPath();c.arc(a1.x,a1.y,rr2,0,TAU);c.fill();
      }
    }
    c.restore();
  }
  /* нижняя кромка гаснет в фон: под ней подвал с кнопкой НАЗАД, и лента любой
     длины не должна её резать (M168g) */
  const mg=c.createLinearGradient(0,H*(1-ROAD_MASK),0,H);
  mg.addColorStop(0,"rgba(6,10,18,0)");mg.addColorStop(1,"rgba(6,10,18,1)");
  c.fillStyle=mg;c.fillRect(0,H*(1-ROAD_MASK),W,H*ROAD_MASK);
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
  /* музыка — свечение от самого низа экрана, под кнопками: градиент цвета
     настроения, высота и яркость дышат энергией, бит вспыхивает. Кривая-полоса
     над футером спорила с кнопками (решение автора, M168c) */
  const gh=H*(.16+en*.26);
  const wg=c.createLinearGradient(0,H-gh,0,H);
  wg.addColorStop(0,"hsla("+hue+",75%,55%,0)");
  wg.addColorStop(1,"hsla("+hue+",78%,58%,"+(.18+en*.32+RD.beat*.15).toFixed(3)+")");
  c.fillStyle=wg;c.fillRect(0,H-gh,W,gh);
  /* числа. Строки складываются курсором: чего нет — того нет, дыр не остаётся.
     На стоянке ни «—», ни «+0 кр» не висят (проход самокритики M168c) */
  const R=roadAll();
  RD.crShow+=(R.cr-RD.crShow)*ease(.13);               /* счётчик тикает, не прыгает */
  const combo=roadCombo(RD.moveT);
  const px2=Math.round(W*.05),base=Math.round(H*.1),stand=spd<ROAD_VMIN;
  c.textAlign="left";
  c.fillStyle=stand?"rgba(190,235,240,.5)":tier===3?"hsla("+hue+",70%,80%,.95)":"rgba(190,235,240,.95)";
  c.font=Math.round(H*.052)+"px ui-monospace,monospace";
  /* на гипердрайве счёт — в долях света: 850 км/ч после ×1 000 000 — 0.79 c */
  c.fillText(stand?"СТОИМ":tier===3?roadLightFrac(spd).toFixed(2)+" световой":roadCosmic(spd).toLocaleString("ru")+" км/с",px2,base);
  c.fillStyle="rgba(127,230,216,.6)";
  c.font=Math.round(H*.017)+"px ui-monospace,monospace";
  let sub=stand?"дорога сама начнёт считать":
    tier===1?"ДОРОГА · скорость настоящая, ×1 000 000":
    tier===2?"ЭКСПРЕСС · судя по ходу — поезд · ×1 000 000":
    "ГИПЕРДРАЙВ · судя по ходу — самолёт · "+roadCosmic(spd).toLocaleString("ru")+" км/с";
  while(sub.length>8&&c.measureText(sub).width>W-px2*2)sub=sub.replace(/ · [^·]*$/,"");
  let yy=base+Math.round(H*.028);
  c.fillText(sub,px2,yy);
  /* где вы во вселенной: система по реальному месту */
  if(RD.sys){
    yy+=Math.round(H*.024);
    c.fillStyle="hsla("+hue+",60%,72%,.75)";
    c.fillText("система "+RD.sys.name.toUpperCase()+" · сектор "+RD.sys.cx+":"+RD.sys.cy,px2,yy);
    if(RD.mates>0){
      yy+=Math.round(H*.022);
      c.fillText("во вселенной ещё "+RD.mates+" "+roadPilotRu(RD.mates),px2,yy);
    }
    c.fillStyle="rgba(127,230,216,.6)";
  }
  if(R.km>=.01){yy+=Math.round(H*.024);c.fillText("за поездку "+roadTripRu(R.km),px2,yy);}
  /* счётчик: крупно, жёлтым, только когда деньги пошли; комбо — фишкой с ×1.2 */
  if(R.cr>0||RD.crShow>.5){
    yy+=Math.round(H*.04);
    c.fillStyle="rgba(242,178,92,.95)";
    c.font=Math.round(H*.03)+"px ui-monospace,monospace";
    const crTx="+"+Math.round(RD.crShow).toLocaleString("ru")+" кр";
    c.fillText(crTx,px2,yy);
    if(combo>=1.2){
      const cw=c.measureText(crTx).width;
      c.fillStyle="hsla("+hue+",80%,65%,"+(.7+.3*Math.sin(t*4)).toFixed(2)+")";
      c.font=Math.round(H*.022)+"px ui-monospace,monospace";
      c.fillText("×"+combo.toFixed(1)+" КОМБО",px2+cw+Math.round(W*.05),yy);
    }
  }
  c.fillStyle="rgba(127,230,216,.5)";
  c.font=Math.round(H*.015)+"px ui-monospace,monospace";
  if(R.cr>=ROAD_CR_CAP){yy+=Math.round(H*.026);
    c.fillText("дневной потолок собран — дальше просто красиво",px2,yy);}
  /* телефон лёг набок: экранная ось X встала к вертикали, «поперёк» не
     определено, а гироскопа нет — честно молчим, а не выдумываем поворот */
  const hints=[RD.gps,RD.mic,RD.blind?"телефон лежит боком — повороты не читаю":null].filter(Boolean);
  if(hints.length){yy+=Math.round(H*.022);c.fillText(hints.join(" · "),px2,yy);}
  if(!RD.asked){
    c.fillStyle="rgba(242,178,92,.85)";
    c.font=Math.round(H*.017)+"px ui-monospace,monospace";
    let hint="нажмите РАЗРЕШИТЬ ДАТЧИКИ · экран не гаснет, батарею ест";
    while(hint.length>8&&c.measureText(hint).width>W-px2*2)hint=hint.replace(/ · [^·]*$/,"");
    c.fillText(hint,px2,Math.round(H*.86));
  }
  /* въезд в новую систему — объявление по центру, гаснет за пару секунд */
  if(RD.sysFlash>0&&RD.sys){
    RD.sysFlash-=dt;
    const a2=clamp(Math.min(1,RD.sysFlash),0,1);
    c.textAlign="center";
    c.fillStyle="hsla("+hue+",70%,80%,"+(a2*.9).toFixed(2)+")";
    c.font=Math.round(H*.03)+"px ui-monospace,monospace";
    c.fillText("СИСТЕМА "+RD.sys.name.toUpperCase(),W*.5,H*.3);
    c.fillStyle="hsla("+hue+",50%,70%,"+(a2*.6).toFixed(2)+")";
    c.font=Math.round(H*.016)+"px ui-monospace,monospace";
    c.fillText("сектор "+RD.sys.cx+":"+RD.sys.cy,W*.5,H*.3+Math.round(H*.026));
    c.textAlign="left";
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
