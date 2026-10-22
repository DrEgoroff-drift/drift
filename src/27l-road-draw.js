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
      погаснуть В КАДРЕ, а низ экрана гаснет в фон: под ним подвал с кнопкой.
   4. Задник (туманности, звёзды, попутчики, искры, импульсы) на M168k уехал в
      27la-road-sky: файл снова перешёл сорок килобайт, а шов там честный. */
/* ── экран ── */
function roadOpen(){
  for(const k in keys)keys[k]=false;
  RD={kmh:0,bank:0,bankT:0,shake:0,kick:0,acc:0,accT:0,phase:0,wob:0,watch:null,an:null,eq:null,
      g0:null,g0T:0,side:0,blind:false,turn:0,turnT:0,xOff:0,yOff:0,emit:0,cxPrev:null,vmax:0,
      lastPos:null,lastT:0,lastFrame:0,t0:now(),asked:0,raf:0,moveT:0,stopT:0,crFrac:0,
      energy:.2,bright:.5,avg:.1,beat:0,beatT:0,wave:new Array(28).fill(.2),
      sparks:[],pulses:[],crShow:0,hintT:0,coins:[],crSeen:-1,
      pos0:null,far:0,back:0,turnPk:0,flash:"",flashT:0,crTrip:0,kmTrip:0,
      diag:/[?&]road=diag\b/.test(location.search)};
  roadDayReset();
  /* игровой звук молчит, пока открыт экран: он прорывался в музыку машины */
  if(typeof audioHush==="function")audioHush(true);
  document.getElementById("roadwin").classList.add("open");
  document.body.classList.add("road");
  /* мир, приборы и пэды убираются СРАЗУ, не дожидаясь цикла игры: правило то же
     (28-loop), но экран не должен зависеть от чужого кадра — если цикл стоит,
     пэды просвечивают сквозь заставку (поймано на стенде M168k) */
  document.body.classList.add("screen");
  roadSenseBtn();
  if(roadAll().mic)roadMicOn();          /* выбор помнится: включали — включаем снова */
  RD.pingIv=setInterval(roadPing,30000);
  roadGpuMount(true);                    /* кадр рисует видеокарта (27lc) */
  RD.raf=requestAnimationFrame(roadFrame);
}
function roadClose(){
  if(!RD)return;
  if(RD.watch!=null&&navigator.geolocation)navigator.geolocation.clearWatch(RD.watch);
  if(RD.stream)RD.stream.getTracks().forEach(t=>t.stop());
  if(RD.actx)RD.actx.close().catch(()=>{});
  if(RD.lock)RD.lock.release().catch(()=>{});
  removeEventListener("devicemotion",roadOnShake);
  if(RD.raf)cancelAnimationFrame(RD.raf);
  if(RD.pingIv)clearInterval(RD.pingIv);
  roadFinish();
  roadGpuMount(false);
  RD=null;
  if(typeof audioHush==="function")audioHush(false);
  if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  document.getElementById("roadwin").classList.remove("open");
  document.body.classList.remove("road");
  document.body.classList.toggle("screen",scrOpen());
  if(typeof saveGame==="function")saveGame(true);
}
function roadFrame(ts){
  if(!RD)return;
  /* сбой кадра дороги — как сбой главного кадра: назван и пережит. Без стража исключение уходило мимо
     requestAnimationFrame, и дорога замирала навсегда (зрение 06.10.2026: планшет, подпись шире атласа) */
  try{drawRoad(ts);}catch(e){crashSay(e,"дорога");}
  if(RD)RD.raf=requestAnimationFrame(roadFrame);
}
/* ── полуразмах корпуса на экране (M168g) ──
   h.bw — ширина ТЕЛА, а по бортам ещё пилоны, баки и крылья: у «Стрижа» размах вдвое больше bw. Чтобы
   шараханье могло уходить к самому краю и не срезать корпус, размах меряем честно — по сетке объёма
   (17c2a, та же, что рисуется), с запасом хранения по id, в единицах корпуса. Плоскость краски (шесть
   последних вершин) не в счёт: она квадрат вокруг всего корпуса */
const ROAD_HALF={};
function roadHullHalf(id){
  if(ROAD_HALF[id]!=null)return ROAD_HALF[id];
  const h=hullOf(id),m=h3dMesh(h,shipGear3d());let y=h.bw;
  for(let i=0;i<(m.n-6)*12;i+=12)y=Math.max(y,Math.abs(m.v[i+1]));
  return ROAD_HALF[id]=y;
}
function drawRoad(ts){
  const t=ts/1000;
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
  const fast=roadFast(spd,tier);
  roadAudio(t);
  const hue=roadMoodHue(),en=RD.energy;
  /* задник целиком — в 27la-road-sky: туманности, звёзды, попутчики, искры,
     импульсы касания. Здесь остаётся корабль, шлейф, маневровые и числа */
  /* кадр — видеокартой (G12, M851): небо и свет — её поля, корпус — объём движка, огни — её фигуры,
     числа — на слое приборов. Полуразмах корпуса меряется по сетке объёма (roadHullHalf) */
  const id=G.shipId,h=hullOf(id),half=roadHullHalf(id);
  roadFit();                              /* W,H — рамка листа, а не окно (27lc) */
  const gOn=gpuFrame();let c;
  roadSky(W,H,t,dt,spd,tier,fast,hue,en);
  const bd=roadBands(RD.wave);
  RD.flow=(RD.flow||0)+dt*(.09+bd.bass*.34);   /* время шума: бас гонит течение */
  roadBloom(gpuScene(),W,H,hue,en,bd);    /* сияние и гашение низа — под корпусом (27lb) */
  /* ── корпус на экране ──
     Поворот машины кренит корпус и уводит его наружу; разгон задирает нос и
     раздувает факел, тормоз бьёт носовыми соплами и клюёт вперёд. */
  /* посадка корпуса: длина одна на всех, ширина — потолок (разбор у констант) */
  const sc=Math.min(H*ROAD_SHIP_LEN/h.len,W*ROAD_SHIP_WID/(2*half));
  /* доля сопла в общей струе остаётся своя, а сумма приведена к полуширине
     корпуса и зажата упорами — иначе у «Топора» шесть сопел дают стену света */
  const engSum=h.eng.reduce((s,e)=>s+(e.r||0),0)||1;
  const rk=clamp(ROAD_TRAIL_R*half*sc,W*ROAD_TRAIL_RMIN,W*ROAD_TRAIL_RMAX)/(engSum*sc);
  /* поворот: в сторону быстро, обратно медленно — иначе снос не читается */
  const tauT=Math.abs(RD.turnT||0)>Math.abs(RD.turn||0)?ROAD_TURN_ATK:ROAD_TURN_REL;
  RD.turn=(RD.turn||0)+((RD.turnT||0)-(RD.turn||0))*ease(tauT);
  RD.bankT=clamp(RD.turn*.7,-1,1);
  RD.bank+=(RD.bankT-RD.bank)*ease(.27);
  roadTurnTick(spd);                      /* поворот пройден — платим по его пику */
  RD.flashT=Math.max(0,(RD.flashT||0)-dt);
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
  RD.hintT=(RD.hintT||0)+dt;              /* пояснения гаснут: висеть всю поездку им незачем */
  const wA=H*.0028*RD.shake;
  const jx=(Math.sin(RD.wob*32.0)*.6+Math.sin(RD.wob*52.1+1.7)*.4)*wA;
  const jy=(Math.sin(RD.wob*42.1+2.4)*.55+Math.sin(RD.wob*27.0+.9)*.45)*wA*.85+RD.kick*H*.012;
  /* шараханье в повороте: корпус уходит НАРУЖУ и потом ПОСТЕПЕННО центрируется.
     Ворота по скорости: во дворе и с телефоном в руках не швыряет, но крен от
     наклона телефона остаётся — экран живой и на стоянке */
  const gate=clamp((spd-ROAD_MOVE_GATE)/(ROAD_MOVE_FULL-ROAD_MOVE_GATE),0,1);
  const shove=clamp(RD.turn*gate,-1,1);
  /* ROAD_SWERVE — доля ПОЛУШИРИНЫ экрана, как и написано у константы; прежде
     здесь стояло W*ROAD_SWERVE, вдвое больше, и предел держала только кромочная
     защита: корпус вставал ровно в край, а крен и дрожь его оттуда срезали.
     На дороге этого не видели — снос ни разу не сработал; поймано на стенде,
     как только мера стала чувствительнее (M168k) */
  const maxOff=Math.max(0,Math.min(W*.5*ROAD_SWERVE,W*.5-half*sc-W*.02));
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
  /* разгорание: 0 — выдох на светофоре, 1 — форсаж. Ведёт длину, ширину,
     раскалённую нить внутри и снос газа вбок */
  const burn=roadBurn(spd);
  const flow=H*(.22+fast*1.2);
  const span=(ROAD_TRAIL_LEN+burn*ROAD_TRAIL_BURN)*H/flow;
  for(let i=RD.trail.length-1;i>=0;i--){
    const p=RD.trail[i];
    p.y+=flow*dt;p.x+=p.vx*dt;p.life-=dt;
    /* два сопла — ОДИН факел (M168k): струи стягиваются к оси, на которой были
       выпущены. Прежде они шли параллельно до самого низа, и шлейф читался
       двумя пластиковыми трубами, а не газом */
    p.x+=(p.cx0-p.x)*(1-Math.exp(-dt/1.0));
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
        RD.trail.push({x:bx+(e.x*co-e.y*si)*sc,y:by+(e.x*si+e.y*co)*sc+back,e:i,b:RD.burst,cx0:bx,
          vx:(Math.sin(t*2.3+i*2.1)*.7+(rndFx()-.5)*.6)*W*(.045+burn*.055),
          r:e.r*rk*sc*(.92+burn*.30+rndFx()*.08),max:span,life:Math.max(.02,span-back/flow)});
      }
    }
  }
  RD.cxPrev=cx;RD.cyPrev=cy;
  /* ── огни дороги — на видеокарте (M851) ──
     Шлейф, выход сопел, маневровые и кокон гипердрайва — фигуры gpuShapes сложением света в проход
     сцены, под корпусом. 2D-холста у кадра дороги нет (22.10, автор: «2D не должно быть»): прежде
     ореол ленты ложился с #c поверх неба смешением «over» и темнил вокруг газа прямоугольник.
     Низ гаснет множителем по высоте, а не стиранием: под лентой то же погашенное небо (27lb) */
  const FX=[],fade=y=>clamp((H-y)/(H*ROAD_MASK),0,1),T=trailTint(id,G.mods.engine|0);
  const disc=(x,y,r,soft,C,a)=>{if(a>.003)FX.push([1,x,y,r,0,0,soft,C[0],C[1],C[2],a]);};
  {
    /* цвет к соплу — акцент, добела раскалён только срез; спад пологий, пик низкий (M168k, проходы 2–3) */
    const RT={core:T.core,mid:mixc(T.edge,T.mid,.42),edge:T.edge};
    const col=u=>u>.96?mixc(RT.mid,RT.core,(u-.96)/.04*.55):mixc(RT.edge,RT.mid,Math.pow(u/.96,1.5));
    const alp=u=>(u*.075+u*u*.12+Math.pow(u,5)*.13)*(1+burn*.55);
    /* повадка от хода: на выдохе лента расходится облаком, на форсаже — копьё */
    const wid=(p,u)=>p.r*(1.25+burn*.40+(1-u)*(3.6-burn*2.3));
    const groups={};
    for(const p of RD.trail){const g=groups[p.b]||(groups[p.b]={});(g[p.e]||(g[p.e]=[])).push(p);}
    for(const b in groups){
      const lanes=[];
      for(const e in groups[b])if(groups[b][e].length>1)lanes.push(groups[b][e]);
      if(!lanes.length)continue;
      /* много сопел — ОДНО тело (M168k): ленты сведены в одну по номеру точки — середина и две кромки,
         каждая по самой дальней из лент. Сложение света не удваивает газ там, где струи сходятся */
      const n=Math.min(...lanes.map(a=>a.length)),M=[];
      for(let i=0;i<n;i++){let x=0,y=0;for(const a of lanes){x+=a[i].x;y+=a[i].y;}
        M.push({x:x/lanes.length,y:y/lanes.length,u:clamp(lanes[0][i].life/lanes[0][i].max,0,1)});}
      for(let i=0;i<n;i++){
        const q=M[Math.min(n-1,i+1)],o=M[Math.max(0,i-1)],tx=q.x-o.x,ty=q.y-o.y,tl=Math.hypot(tx,ty)||1,nx=-ty/tl,ny=tx/tl;
        let l=0,r=0;
        for(const a of lanes){const p=a[i],d=(p.x-M[i].x)*nx+(p.y-M[i].y)*ny,w=wid(p,M[i].u);l=Math.max(l,d+w);r=Math.max(r,w-d);}
        Object.assign(M[i],{nx,ny,l,r});
      }
      /* газ — поле, а не лента (СР · Визуал 22.10): по оси в каждой точке мягкий диск с перьевой кромкой шире тела;
         соседние диски перекрываются и складываются в ровную трубу с гауссовым сечением — ни швов на стыках,
         ни ступеней ореола (пять слоёв жёстких четырёхугольников читались бумажными полосами). Доля диска
         делится на число перекрытий, чтобы сумма держала прежнюю яркость; хвост (первые точки) гаснет всегда */
      const stp=Math.max(1,H*ROAD_TRAIL_STEP);
      for(let i=0;i<n;i++){const P=M[i],u=P.u,w=Math.max(1.5,(P.l+P.r)*.5),f=fade(P.y)*Math.min(1,(i+1)/6);
        const ov=Math.max(1,w*1.5/stp),a=alp(u)*f*.85/ov;
        if(a>=.0015)disc(P.x,P.y,w*.32,w*1.25,col(u),a);
        /* раскалённая нить — только на разгоне и только у сопла: узкий горячий сердечник в теле газа */
        if(burn>.04&&u>.55){const k=(u-.55)/.45;disc(P.x,P.y,w*.1,w*.42,mixc(T.mid,T.core,k),k*k*burn*.55/ov);}}
      /* выход из сопла: малое горячее ядро у среза — шов между корпусом и газом, не шар шире корпуса */
      for(const ln of lanes){const e1=ln[ln.length-1];if(e1.life<=e1.max-.06)continue;
        const rr2=Math.max(2,e1.r*.95),f=fade(e1.y);
        disc(e1.x,e1.y,rr2*.45,rr2*2.2,RT.mid,(.14+burn*.08)*f);disc(e1.x,e1.y,rr2*.5,rr2*.7,mixc(RT.mid,T.core,.6),(.34+burn*.18)*f);}
    }
  }
  /* ── маневровые крупным планом (M168i) ──
     Штатные носовые сопла на этом масштабе не видны: свои факелы в экранных координатах, под корпусом.
     Тормоз — два холодных конуса вперёд от носа, сильный поворот — выдох от носа против сноса. Цвет
     холодный, чтобы не спутать с маршевым */
  const co2=Math.cos(rot),si2=Math.sin(rot);
  const jet=(lx,ly,dx,dy,L,w0,a0)=>{
    const x=cx+(lx*co2-ly*si2)*sc,y=cy+(lx*si2+ly*co2)*sc,N=6;
    const w=s=>w0*(1-.55*s),al=s=>s<.35?a0*(.95-.45*s/.35):a0*.5*(1-(s-.35)/.65),pt=s=>[x+dx*L*s,y+dy*L*s];
    for(let j=0;j<N;j++){const s0=j/N,s1=(j+1)/N,P=pt(s0),Q=pt(s1);
      gpuQuad(FX,[P[0]-dy*w(s0),P[1]+dx*w(s0)],[Q[0]-dy*w(s1),Q[1]+dx*w(s1)],[Q[0]+dy*w(s1),Q[1]-dx*w(s1)],
        [P[0]+dy*w(s0),P[1]-dx*w(s0)],[218,240,250,al((s0+s1)/2)],2|8);}
    disc(x,y,w0*.8,1,[240,250,255],a0*.9);
  };
  const brk=clamp(-RD.acc*1.6,0,1);
  if(brk>.2)for(const sg of [-1,1]){
    /* пульс у бортов свой; лёгкий развал наружу — иначе две струи сливаются в одно копьё */
    const fl=.8+.25*Math.sin(RD.wob*43+sg*2.1),aj=rot+sg*.16;
    jet(h.nose*.66,sg*h.bw*.42,Math.cos(aj),Math.sin(aj),H*(.05+.09*brk)*fl,Math.max(3,h.bw*sc*.20),.45+.5*brk);
  }
  const tv=clamp((Math.abs(RD.turn)-.3)*1.6,0,1)*gate;
  if(tv>.1){
    const sg=RD.turn>0?-1:1,fl=.8+.25*Math.sin(RD.wob*37);   /* корпус вправо → выдох влево */
    jet(h.nose*.55,sg*h.bw*.72,-si2*sg,co2*sg,H*(.025+.055*tv)*fl,Math.max(2.5,h.bw*sc*.16),.35+.4*tv);
  }
  /* Отсвета вокруг корпуса нет и не будет (автор, M168k: «вокруг корабля можно убить сияние»): любое
     пятно вокруг силуэта читается нимбом. Исключение — кокон гипердрайва: он и есть свет хода */
  if(tier===3){const hc=gcColor("hsl("+hue+",80%,70%)").map(v=>v*255),L2=h.len*sc*.32;
    FX.push([2,cx-co2*L2,cy-si2*L2,cx+co2*L2,cy+si2*L2,h.bw*sc*.5,h.len*sc*.45,hc[0],hc[1],hc[2],.14]);}
  if(gOn&&FX.length)gpuShapes(gpuScene(),FX,{blend:"add"});
  /* корпус — объём движка (17c2a через hullGpuDraw, M851): нос вверх, крен настоящий, свет звезды слева сверху.
     2D-корпуса нет: без видеокарты дороги нет — плашка 08b2. Тяга — false: огонь у дороги свой (выше),
     огонь полёта лёг бы поверх него вторым */
  if(gOn)hullGpuDraw(id,cx,cy,rot,sc,false,RD.acc<-.25,
    Math.min(3,fast*3+Math.max(0,RD.acc)*2+(tier===3?1:0)+RD.beat*.8),RD.bank,-.55,-.83,shipGear3d());
  /* ── «моя волна» снизу (M168j) ──
     Сияние от центра нижней кромки, как у одноимённой заставки: РАЗНОЦВЕТНОЕ —
     ядро цвета настроения, два спутниковых пятна с тоном, сдвинутым на ±100°
     (энергичное даёт маджента/янтарь/зелень, грустное — циан/зелень/лиловый),
     и веер тонких лучей, где длина каждого — своя полоса спектра: RD.wave
     наконец рисуется, а не только считается. Всё дышит энергией, бит толкает
     ядро. Кривой-полосы по-прежнему нет — она спорила с кнопками (M168c). */
  /* ── сияет НИЖНИЙ КРАЙ (M168k, по словам автора и его референсам) ──
     Первая попытка подняла свет на линию подвала и погасила полосу под ней:
     вышел горизонт с прожектором и тёмной дорогой в перспективе — «не очень»,
     и справедливо. Вторая собрала кромку из пяти плюмажей. Третья, когда автор
     снял ограничение по батарее («всё равно телефон на зарядке»), считает свет
     ПОЛЕМ, попиксельно — 27lb-road-bloom, с G12 на видеокарте, вместе с нитью
     по самой кромке.

     Тёмной полосы на холсте нет: кнопки держит своё стекло подвала
     (`body.road .scr footer`), а не вырезанный из картинки кусок. */
  /* числа — интерфейс: слой #ovl (08bi), без свечения и зерна. Очередь слоя сводится
     внутри gpuWorld, поэтому числа кладутся ДО него, а мир собирается в конце кадра.
     Монеты — свет: они летят в мире (#c) и светятся вместе с ним */
  /* без видеокарты строки уходят в пустую запись: 2D-дороги нет, экран закрывает плашка 08b2 */
  c=gOn?roadOvl():new GcCtx(1,1,1);c.save();
  /* числа. Строки складываются курсором: чего нет — того нет, дыр не остаётся.
     На стоянке ни «—», ни «+0 кр» не висят (проход самокритики M168c) */
  const R=roadAll();
  RD.crShow+=((RD.crTrip||0)-RD.crShow)*ease(.13);               /* счётчик тикает, не прыгает */
  /* начисление должно быть видно: за шесть минут съёмки счётчик вырос на четыре
     кредита и ничем себя не выдал. Каждый кредит теперь летит от корпуса в
     цифру — награда становится событием, оставаясь той же по величине (M168k) */
  if(RD.crSeen<0)RD.crSeen=RD.crTrip||0;
  if((RD.crTrip||0)>RD.crSeen){
    for(let k=Math.min(3,RD.crTrip-RD.crSeen);k>0;k--)RD.coins.push({x:cx,y:cy,p:-(k-1)*.14});
    RD.crSeen=RD.crTrip;
  }
  const combo=roadCombo(RD.moveT);
  /* кегль и шаг строк приборов идут от высоты листа, но не ниже, чем дают самой мелкой строке (0,015)
     восемь точек: на телефоне боком лист в 320 px, и строки выходили в пять (зрение 06.10.2026) */
  const HT=Math.max(H,8/.015);
  const px2=Math.round(W*.05),base=Math.round(H*.1),stand=spd<ROAD_VMIN;
  c.textAlign="left";
  c.fillStyle=stand?"rgba(190,235,240,.5)":tier===3?"hsla("+hue+",70%,80%,.95)":"rgba(190,235,240,.95)";
  c.font=Math.round(HT*.052)+"px ui-monospace,monospace";
  /* на гипердрайве счёт — в долях света: 850 км/ч после ×1 000 000 — 0.79 c */
  c.fillText(stand?"СТОИМ":tier===3?roadLightFrac(spd).toFixed(2)+" световой":roadCosmic(spd).toLocaleString("ru")+" км/с",px2,base);
  c.fillStyle="rgba(127,230,216,.6)";
  c.font=Math.round(HT*.017)+"px ui-monospace,monospace";
  let sub=stand?"дорога сама начнёт считать":
    tier===1?"ДОРОГА · скорость настоящая, ×1 000 000":
    tier===2?"ЭКСПРЕСС · судя по ходу — поезд · ×1 000 000":
    "ГИПЕРДРАЙВ · судя по ходу — самолёт · "+roadCosmic(spd).toLocaleString("ru")+" км/с";
  while(sub.length>8&&c.measureText(sub).width>W-px2*2)sub=sub.replace(/ · [^·]*$/,"");
  let yy=base+Math.round(HT*.028);
  c.fillText(sub,px2,yy);
  /* где вы во вселенной: система по реальному месту */
  if(RD.sys){
    yy+=Math.round(HT*.024);
    /* пока по центру висит объявление о въезде, строка HUD молчит и проступает
       ему на смену: на видео имя системы стояло в кадре дважды (M168k) */
    const fa=clamp(Math.min(1,RD.sysFlash||0),0,1);
    c.fillStyle="hsla("+hue+",60%,72%,"+(.75*(1-fa)).toFixed(3)+")";
    c.fillText("система "+RD.sys.name.toUpperCase()+" · сектор "+RD.sys.cx+":"+RD.sys.cy,px2,yy);
    if(RD.mates>0){
      yy+=Math.round(HT*.022);
      c.fillText("во вселенной ещё "+RD.mates+" "+roadPilotRu(RD.mates),px2,yy);
    }
    c.fillStyle="rgba(127,230,216,.6)";
  }
  /* «за поездку» и правда за поездку: прежде тут стояло суточное число под
     этой подписью, и было непонятно, что вообще считается (вопрос автора) */
  if((RD.kmTrip||0)>=.01){yy+=Math.round(HT*.024);
    let tl="за поездку "+roadTripRu(RD.kmTrip);
    if((RD.vmax||0)>ROAD_VMIN)tl+=" · макс "+roadCosmic(RD.vmax).toLocaleString("ru")+" км/с";
    while(tl.length>8&&c.measureText(tl).width>W-px2*2)tl=tl.replace(/ · [^·]*$/,"");
    c.fillText(tl,px2,yy);}
  /* счётчик: крупно, жёлтым, только когда деньги пошли; комбо — фишкой с ×1.2 */
  if((RD.crTrip||0)>0||RD.crShow>.5){
    yy+=Math.round(HT*.04);
    c.fillStyle="rgba(242,178,92,.95)";
    c.font=Math.round(HT*.03)+"px ui-monospace,monospace";
    const crTx="+"+Math.round(RD.crShow).toLocaleString("ru")+" кр";
    c.fillText(crTx,px2,yy);
    RD.crXY=[px2+c.measureText(crTx).width*.5,yy-Math.round(HT*.012)];   /* куда летят монеты */
    if(combo>=1.2){
      const cw=c.measureText(crTx).width;
      c.fillStyle="hsla("+hue+",80%,65%,"+(.7+.3*Math.sin(t*4)).toFixed(2)+")";
      c.font=Math.round(HT*.022)+"px ui-monospace,monospace";
      /* множитель сам по себе ничего не говорит: рядом — во что он обходится
         в километре, иначе комбо читается украшением (M168k). Хвост срезается
         курсором, как и остальные строки: на узком экране места нет */
      const cx2=px2+cw+Math.round(W*.05);
      const rate=ROAD_CR_KM*combo*(RD.back?ROAD_BACK_K:1);
      let cmb="×"+combo.toFixed(1)+" КОМБО · "+rate.toFixed(1).replace(".0","")+" кр/км";
      if(c.measureText(cmb).width>W-cx2-px2)cmb=cmb.replace(/ · [^·]*$/,"");
      c.fillText(cmb,cx2,yy);
    }
  }
  c.fillStyle="rgba(127,230,216,.5)";
  c.font=Math.round(HT*.015)+"px ui-monospace,monospace";
  /* сутки — тихой строкой под крупным числом поездки: крупно то, что
     заработано сейчас, мелко — сколько уже собрано за день и где потолок.
     Пока за сутки ровно столько же, сколько за поездку, строки нет: это
     первая поездка дня, и повторять одно число дважды незачем */
  /* ранг: он растёт месяцами, поэтому должен быть виден всегда — и рядом
     сколько до следующего, иначе прогрессия существует только в коде */
  {
    const rk=roadRank(R.total);
    yy+=Math.round(HT*.026);
    let rl=rk.ru+(rk.k>1?" ×"+rk.k:"")+(rk.next?" · "+rk.next+" через "+Math.ceil(rk.left)+" км":"");
    while(rl.length>8&&c.measureText(rl).width>W-px2*2)rl=rl.replace(/ · [^·]*$/,"");
    c.fillText(rl,px2,yy);
  }
  if(R.bank>=1){
    yy+=Math.round(HT*.026);
    c.fillText((R.cr>(RD.crTrip||0)?"за сутки "+R.cr.toLocaleString("ru")+" · ":"")+
      "запас "+Math.floor(R.bank).toLocaleString("ru")+" кр",px2,yy);
  }else{yy+=Math.round(HT*.026);
    c.fillText("запас исчерпан — натечёт к завтрашнему дню, а пока просто красиво",px2,yy);}
  /* телефон лёг набок: экранная ось X встала к вертикали, «поперёк» не
     определено, а гироскопа нет — честно молчим, а не выдумываем поворот.
     Про микрофон сказано прямо и до того, как его включат: подключён Android
     Auto — голова машины принимает открытый захват за разговор и глушит музыку */
  /* неисправности висят всегда, пояснения — гаснут за десять секунд и
     возвращаются по касанию экрана: «микрофон слушает» провисело на видео все
     шесть минут, хотя сказать это нужно один раз (M168k) */
  const faults=[RD.gps,RD.mic].filter(Boolean);
  const notes=[
    RD.blind?"телефон лежит боком — повороты не читаю":null,
    RD.an?"микрофон слушает — цвет идёт по треку":null,
    RD.asked&&!RD.an&&!RD.mic?"микрофон: цвет по треку, но Android Auto примет за звонок":null
  ].filter(Boolean);
  /* обратный курс — не подсказка, а состояние: висит, пока едем домой */
  if(RD.back){
    yy+=Math.round(HT*.022);
    c.save();
    c.fillStyle="rgba(242,178,92,.85)";
    c.fillText("ОБРАТНЫЙ КУРС · ×"+ROAD_BACK_K+" за километр",px2,yy);
    c.restore();
  }
  const noteA=clamp((10-RD.hintT)/2,0,1);
  const line=s=>{
    yy+=Math.round(HT*.022);
    let ln=s;
    while(ln.length>8&&c.measureText(ln+(ln===s?"":"…")).width>W-px2*2)ln=ln.replace(/[^ ]*.$/,"");
    c.fillText(ln===s?ln:ln+"…",px2,yy);
  };
  for(const s of faults)line(s);
  if(noteA>0){
    c.globalAlpha=noteA;
    for(const s of notes)line(s);
    c.globalAlpha=1;
  }
  if(!RD.asked){
    c.fillStyle="rgba(242,178,92,.85)";
    c.font=Math.round(HT*.017)+"px ui-monospace,monospace";
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
    c.font=Math.round(HT*.03)+"px ui-monospace,monospace";
    c.fillText("СИСТЕМА "+RD.sys.name.toUpperCase(),W*.5,H*.3);
    c.fillStyle="hsla("+hue+",50%,70%,"+(a2*.6).toFixed(2)+")";
    c.font=Math.round(HT*.016)+"px ui-monospace,monospace";
    c.fillText("сектор "+RD.sys.cx+":"+RD.sys.cy,W*.5,H*.3+Math.round(HT*.026));
    c.textAlign="left";
  }
  /* премия за поворот — коротко, у корпуса: деньги должны быть СОБЫТИЕМ */
  if(RD.flashT>0&&RD.flash){
    const fa=clamp(RD.flashT/.5,0,1);
    c.save();c.textAlign="center";
    c.font=Math.round(HT*.022)+"px ui-monospace,monospace";
    c.fillStyle="rgba(242,178,92,"+(fa*.95).toFixed(2)+")";
    c.fillText(RD.flash,cx,cy-h.len*sc*.62-(1-fa)*H*.03);
    c.restore();c.textAlign="left";
  }
  /* ── монеты: кредит летит от корпуса в счётчик ── */
  const tgt=RD.crXY||[W*.1,H*.2],FC=[];
  for(let i=RD.coins.length-1;i>=0;i--){
    const k=RD.coins[i];
    k.p+=dt/1.05;
    if(k.p>=1){RD.coins.splice(i,1);continue;}
    if(k.p<0)continue;
    const u=k.p*k.p*(3-2*k.p);
    const x=k.x+(tgt[0]-k.x)*u, y=k.y+(tgt[1]-k.y)*u-Math.sin(Math.PI*k.p)*H*.07;
    const rr3=Math.max(1.6,W*.007),a=Math.sin(Math.PI*Math.min(1,k.p*1.25))*.95;
    FC.push([1,x,y,rr3*.5,0,0,rr3*3.5,242,178,92,.55*a],[1,x,y,rr3,0,0,1,255,214,150,a]);
  }
  /* монета — свет в мире: тем же сложением в проход сцены, поверх корпуса */
  if(gOn&&FC.length)gpuShapes(gpuScene(),FC,{blend:"add"});
  /* Окно правды по датчикам (M168k) — долгое нажатие или `?road=diag`. Мера
     поворота тонкая, но на настоящей поездке корпус не сошёл с центра ни разу
     за шесть минут, и понять по экрану — врёт мера или дорога была прямая —
     было нельзя. Шесть строк вместо гадания. */
  if(RD.diag){
    const g4=v=>v==null?"—":v.toFixed(3);
    const L=[
      "ДАТЧИКИ · долгое нажатие — снять",
      "поперёк "+g4(RD.latG)+" g (акс "+g4(RD.latA)+")",
      "рыскание "+(RD.yawS==null?"—":RD.yawS.toFixed(1))+" °/с · |x̂·ĝ| "+(RD.side||0).toFixed(2)+(RD.blind?" · СЛЕПА":""),
      "снос "+(RD.turn||0).toFixed(2)+"←"+(RD.turnT||0).toFixed(2)+" · ворота "+gate.toFixed(2)+" · сдвиг "+((RD.xOff||0)/W).toFixed(3)+"W",
      "крен "+(RD.bank||0).toFixed(2)+" · тряска "+(RD.shake||0).toFixed(2)+" · ход "+fast.toFixed(2)+" · "+Math.round(spd)+" км/ч",
      "предел "+(maxOff/W).toFixed(3)+"W · полукорпус "+(roadHullHalf(id)*sc/W).toFixed(3)+"W",
      "автоноль "+(RD.g0T||0).toFixed(0)+" с · кадр "+Math.round(1/Math.max(.001,dt))+" Гц"
    ];
    const fh=Math.round(HT*.017),pad=Math.round(W*.03);
    const bw2=W-pad*2,bh=fh*(L.length*1.55+.9);
    const by2=H*(1-ROAD_FOOT)-bh-Math.round(H*.02);
    c.fillStyle="rgba(4,7,12,.82)";
    c.fillRect(pad,by2,bw2,bh);
    c.strokeStyle="rgba(127,230,216,.28)";c.lineWidth=1;
    c.strokeRect(pad+.5,by2+.5,bw2-1,bh-1);
    c.font=fh+"px ui-monospace,monospace";
    c.textAlign="left";
    for(let i=0;i<L.length;i++){
      c.fillStyle=i?"rgba(190,235,240,.86)":"rgba(242,178,92,.9)";
      c.fillText(L[i],pad+Math.round(W*.025),by2+fh*(1.4+i*1.55));
    }
  }
  c.restore();
  /* без виньетки: у дороги её не было и в 2D (main), а свет здесь живёт у нижних углов —
     виньетка кадра гасила сияние на 9 % на столе и на 13 % на телефоне (Контроль 26.09:
     «главный кадр экрана — яркость сияния не ниже main»); и без плеча тона — срез по каналу,
     как у 2D main (08b tone) */
  if(gOn){gpuWorld(ROAD_GLOW,true,false,true);gpuPresent();}
}
/* полный экран (M168k): обвязка браузера съедала седьмую часть экрана у режима,
   который стоит в держателе весь путь. Жест уже есть — нажатие «РАЗРЕШИТЬ
   ДАТЧИКИ»; где полного экрана нет (iOS в браузере) — молча живём как жили. */
function roadFullscreen(){
  const el=document.getElementById("roadwin");
  if(!el||document.fullscreenElement)return;
  const rq=el.requestFullscreen||el.webkitRequestFullscreen;
  if(!rq)return;
  try{const p=rq.call(el,{navigationUI:"hide"});if(p&&p.catch)p.catch(()=>{});}catch(e){}
}
(function roadWire(){
  const b=document.getElementById("roadbtn");
  if(b)b.addEventListener("click",roadOpen);
  const x=document.getElementById("roadClose");
  if(x)x.addEventListener("click",roadClose);
  const s=document.getElementById("roadSense");
  if(s)s.addEventListener("click",()=>{
    if(!RD)return;
    roadFullscreen();
    if(!RD.asked)roadSensorsOn();
    else if(RD.an)roadMicOff();
    else roadMicOn();
  });
  const cv=document.getElementById("roadcv");
  if(cv)cv.addEventListener("pointerdown",e=>{
    if(!RD)return;
    const rc=cv.getBoundingClientRect();   /* в пикселях CSS, как весь кадр (G12) */
    RD.pulses.push({x:e.clientX-rc.left,y:e.clientY-rc.top,r:8,a:.6});
    RD.hintT=0;                            /* подсказки возвращаются по касанию */
    /* долгое нажатие — окно правды по датчикам: без него нельзя понять, почему
       корпус не сходит с центра, а подкручивать вслепую нечестно (M168k) */
    clearTimeout(RD.pressT);
    RD.pressT=setTimeout(()=>{if(RD)RD.diag=!RD.diag;},900);
  });
  const drop=()=>{if(RD)clearTimeout(RD.pressT);};
  if(cv){cv.addEventListener("pointerup",drop);cv.addEventListener("pointercancel",drop);
    cv.addEventListener("pointermove",e=>{if(RD&&(Math.abs(e.movementX)>3||Math.abs(e.movementY)>3))drop();});}
})();
