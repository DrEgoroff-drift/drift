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
      lastPos:null,lastT:0,lastFrame:0,t0:Date.now(),asked:0,raf:0,moveT:0,stopT:0,crFrac:0,
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
  const cv=document.getElementById("roadcv");
  cv.width=cv.clientWidth*Math.min(2,devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  cv.height=cv.clientHeight*Math.min(2,devicePixelRatio||1);
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
  RD=null;
  if(typeof audioHush==="function")audioHush(false);
  if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  document.getElementById("roadwin").classList.remove("open");
  document.body.classList.remove("road");
  document.body.classList.toggle("screen",!!document.querySelector(".scr.open"));
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
  const fast=roadFast(spd,tier);
  roadAudio(t);
  const hue=roadMoodHue(),en=RD.energy;
  /* задник целиком — в 27la-road-sky: туманности, звёзды, попутчики, искры,
     импульсы касания. Здесь остаётся корабль, шлейф, маневровые и числа */
  roadSky(c,W,H,t,dt,spd,tier,fast,hue,en);
  /* ── корпус на экране ──
     Поворот машины кренит корпус и уводит его наружу; разгон задирает нос и
     раздувает факел, тормоз бьёт носовыми соплами и клюёт вперёд. */
  const id=G.shipId,h=hullOf(id);
  /* посадка корпуса: длина одна на всех, ширина — потолок (разбор у констант) */
  const half=roadHullHalf(id);
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
          vx:(Math.sin(t*2.3+i*2.1)*.7+(Math.random()-.5)*.6)*W*(.045+burn*.055),
          r:e.r*rk*sc*(.92+burn*.30+Math.random()*.08),max:span,life:Math.max(.02,span-back/flow)});
      }
    }
  }
  RD.cxPrev=cx;RD.cyPrev=cy;
  {
    const T=trailTint(id,G.mods.engine|0);
    c.save();c.globalCompositeOperation="lighter";
    /* ── ОДНО ТЕЛО НА ВСЕ СОПЛА (M168k) ──
       Прежде каждое сопло рисовалось своей заливкой, и там, где струи сходятся,
       «lighter» складывал их — двойная, у «Топора» шестерная яркость: тон
       выгорал в белое, и шлейф читался стеной дыма. Теперь все ленты вспышки
       кладутся ПОДПУТЯМИ в один путь и заливаются ОДИН раз: перекрытие ничего
       не прибавляет, и ширина остаётся честной. То же правило, что у корпуса и
       у процедурных сборок вообще — много кусков, одно тело. */
    const groups={};
    for(const p of RD.trail){
      const g=groups[p.b]||(groups[p.b]={});
      (g[p.e]||(g[p.e]=[])).push(p);
    }
    for(const b in groups){
      const lanes=[];
      for(const e in groups[b])if(groups[b][e].length>1)lanes.push(groups[b][e]);
      if(!lanes.length)continue;
      /* ПОВАДКА ЗАВИСИТ ОТ ХОДА (M168k). На выдохе лента быстро расходится к
         хвосту — облако; на форсаже кромки почти параллельны, и то же самое
         тело читается копьём. У сопла она при этом шире, а не уже: автор просил
         «больше и виднее». Путь строится отдельной функцией, потому что рисуется
         дважды — телом и раскалённой нитью внутри. */
      const wid=(p,u)=>p.r*(1.25+burn*.40+(1-u)*(3.6-burn*2.3));
      const lay=k=>{
        c.beginPath();
        for(const arr of lanes){
          const nrm=i=>{
            const q=arr[Math.min(arr.length-1,i+1)],o=arr[Math.max(0,i-1)];
            const tx=q.x-o.x,ty=q.y-o.y,tl=Math.hypot(tx,ty)||1;
            const p=arr[i],u=clamp(p.life/p.max,0,1),w=wid(p,u)*k;
            return [-ty/tl*w,tx/tl*w];
          };
          for(let i=0;i<arr.length;i++){
            const p=arr[i],nn=nrm(i);
            if(i===0)c.moveTo(p.x+nn[0],p.y+nn[1]);else c.lineTo(p.x+nn[0],p.y+nn[1]);
          }
          for(let i=arr.length-1;i>=0;i--){
            const p=arr[i],nn=nrm(i);
            c.lineTo(p.x-nn[0],p.y-nn[1]);
          }
          c.closePath();
        }
      };
      const arr=lanes[0];
      const a0=arr[0],a1=arr[arr.length-1];
      const u0=clamp(a0.life/a0.max,0,1),u1=clamp(a1.life/a1.max,0,1);
      /* ── почему шлейф был белым, хотя цвет в нём есть ── (M168k, проход 2)
         Альфа и цвет были ПРОТИВОНАПРАВЛЕНЫ. Яркость держится у сопла (u→1), а
         там `col` отдавал `T.mid` — акцент, уведённый на 42% в сливочный, — и
         дальше `T.core`, уведённый на 82% в белый. Цветная часть ленты (`edge`,
         чистый акцент корпуса) лежала в хвосте, где альфа уже 0.07: глазу
         доставалось молоко, а цвет был там, где его не видно.
         Правка не в степенях, а в самой палитре: на дороге середина ленты
         подтянута обратно к акценту, и добела раскаляется только самый срез
         сопла. «Стриж» теперь мятный, «Вьюк» янтарный — как их корпуса. */
      const RT={core:T.core,mid:mixc(T.edge,T.mid,.42),edge:T.edge};
      const col=u=>u>.96?mixc(RT.mid,RT.core,(u-.96)/.04):mixc(RT.edge,RT.mid,Math.pow(u/.96,1.5));
      /* спад квадратичный, как в полёте. Пик снят с .80 до .32 (M168k): под
         «lighter» две струи внахлёст давали 1.6, каналы упирались в потолок, и
         газ становился белой пластиковой трубой — тем более теперь, когда снизу
         светит сияние: прежняя формула настраивалась на чёрное небо */
      /* спад пологий: прежний `u²·.20 + u⁴·.30` весь свет держал у сопла, а
         тело ленты был почти прозрачным — газ читался коротким и плотным.
         Теперь длина видна целиком, а пик ниже: перекрытий больше нет, и
         набирать яркость сложением не нужно (M168k, проход 2) */
      const alp=u=>((u*.075+u*u*.12+Math.pow(u,5)*.13)*(1+burn*.55)).toFixed(3);
      const paint=(cf,af)=>{
        if(Math.hypot(a1.x-a0.x,a1.y-a0.y)<1)c.fillStyle=rgba(cf(u1),af(u1));
        else{
          const gr=c.createLinearGradient(a1.x,a1.y,a0.x,a0.y);
          for(let j=0;j<=4;j++){const s=j/4,u=u1+(u0-u1)*s;gr.addColorStop(s,rgba(cf(u),af(u)));}
          c.fillStyle=gr;
        }
        c.fill();
      };
      /* ── у газа не бывает контура (M168k, проход 3) ──
         Одна заливка, даже правильной ширины, читается вырезанной фигурой:
         видно кромку. Кладём то же тело ДВАЖДЫ — широкий бледный ореол и
         основное тело внутри него. Спад получается двухступенчатым, и силуэт
         растворяется, не требуя ни размытия, ни лишних точек. */
      lay(1.55);paint(col,u=>(+alp(u)*.30).toFixed(3));
      lay(1);paint(col,alp);
      /* раскалённая нить внутри — только на разгоревшемся. Это и есть «по-другому»:
         на светофоре её нет вовсе, с тридцати она проступает и тянется от сопла */
      if(burn>.04){
        lay(.36-burn*.12);
        paint(u=>mixc(T.mid,T.core,clamp(u*1.2-.2,0,1)),
              u=>((u*u*u*.30+Math.pow(u,5)*.26)*burn).toFixed(3));
      }
      /* выход из сопла: раскалённое ядро с ореолом — у КАЖДОГО сопла своё */
      for(const ln of lanes){
        const e1=ln[ln.length-1];
        if(e1.life<=e1.max-.06)continue;
        /* и шире, чем прежде: ореол сопла — это ещё и шов между нарисованным
           факелом корпуса (тёплым) и лентой (в цвет акцента). Без него на
           стыке видно, где кончается одно и начинается другое */
        const rr2=Math.max(2,e1.r*1.7);
        const hg=c.createRadialGradient(e1.x,e1.y,0,e1.x,e1.y,rr2*4.5);
        hg.addColorStop(0,rgba(T.core,.42+burn*.24));hg.addColorStop(.35,rgba(RT.mid,.22));hg.addColorStop(1,rgba(RT.edge,0));
        c.fillStyle=hg;c.beginPath();c.arc(e1.x,e1.y,rr2*4.5,0,TAU);c.fill();
        c.fillStyle=rgba(T.core,.55+burn*.25);
        c.beginPath();c.arc(e1.x,e1.y,rr2,0,TAU);c.fill();
      }
    }
    c.restore();
  }
  /* нижняя кромка гаснет в фон: под ней подвал с кнопкой НАЗАД, и лента любой
     длины не должна её резать (M168g) */
  const mg=c.createLinearGradient(0,H*(1-ROAD_MASK),0,H);
  mg.addColorStop(0,"rgba(6,10,18,0)");mg.addColorStop(1,"rgba(6,10,18,1)");
  c.fillStyle=mg;c.fillRect(0,H*(1-ROAD_MASK),W,H*ROAD_MASK);
  /* ── маневровые крупным планом (M168i) ──
     Штатные носовые сопла из drawHull на этом масштабе — три пикселя, и на
     видео тормоза просто не видно. Рисуем свои факелы в экранных координатах,
     ДО корпуса, чтобы срез сопла прятался под обшивкой: тормоз — два холодных
     конуса вперёд от носа (газ бьёт по ходу), сильный поворот — короткий
     боковой выдох от носа в сторону, ПРОТИВОПОЛОЖНУЮ сносу: корпус уходит
     вправо — струя ушла влево. Цвет холодный, голубоватый, как у маневровых
     в полёте — чтобы не спутать с маршевым факелом. */
  const co2=Math.cos(rot),si2=Math.sin(rot);
  const jet=(lx,ly,dx,dy,L,w0,a0)=>{
    const x=cx+(lx*co2-ly*si2)*sc,y=cy+(lx*si2+ly*co2)*sc;
    const g2=c.createLinearGradient(x,y,x+dx*L,y+dy*L);
    g2.addColorStop(0,"rgba(235,248,255,"+(a0*.95).toFixed(3)+")");
    g2.addColorStop(.35,"rgba(205,232,246,"+(a0*.5).toFixed(3)+")");
    g2.addColorStop(1,"rgba(205,232,246,0)");
    c.fillStyle=g2;
    c.beginPath();
    c.moveTo(x-dy*w0,y+dx*w0);c.lineTo(x+dy*w0,y-dx*w0);
    c.lineTo(x+dx*L+dy*w0*.45,y+dy*L-dx*w0*.45);
    c.lineTo(x+dx*L-dy*w0*.45,y+dy*L+dx*w0*.45);
    c.closePath();c.fill();
    c.fillStyle="rgba(240,250,255,"+(a0*.9).toFixed(3)+")";
    c.beginPath();c.arc(x,y,w0*.8,0,TAU);c.fill();
  };
  const brk=clamp(-RD.acc*1.6,0,1);
  if(brk>.2){
    c.save();c.globalCompositeOperation="lighter";
    for(const sg of [-1,1]){
      /* пульс у бортов свой: сопла дышат вразнобой, как настоящие;
         лёгкий развал наружу — иначе две струи сливаются в одно копьё */
      const fl=.8+.25*Math.sin(RD.wob*43+sg*2.1);
      const aj=rot+sg*.16,dj=[Math.cos(aj),Math.sin(aj)];
      jet(h.nose*.66,sg*h.bw*.42,dj[0],dj[1],H*(.05+.09*brk)*fl,
          Math.max(3,h.bw*sc*.20),.45+.5*brk);
    }
    c.restore();
  }
  /* боковой выдох: только на живом повороте, у носа — струя видна и объясняет,
     кто разворачивает корпус. Локальная ось +y на экране смотрит вправо. */
  const tv=clamp((Math.abs(RD.turn)-.3)*1.6,0,1)*gate;
  if(tv>.1){
    const sg=RD.turn>0?-1:1;                 /* корпус вправо → выдох влево */
    c.save();c.globalCompositeOperation="lighter";
    const fl=.8+.25*Math.sin(RD.wob*37);
    jet(h.nose*.55,sg*h.bw*.72,-si2*sg,co2*sg,
        H*(.025+.055*tv)*fl,Math.max(2.5,h.bw*sc*.16),.35+.4*tv);
    c.restore();
  }
  /* Отсвета вокруг корпуса нет и не будет (автор, M168k: «вокруг корабля можно
     убить сияние»). Мысль была верная — корабль идёт над светом, свет должен на
     него ложиться, — а исполнение нет: любое пятно вокруг силуэта читается
     нимбом, то есть отдельным предметом, а не освещением. Свет ложится на
     корпус там, где ему и место: факелом из сопел и шлейфом под ним. */
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
  drawHull(id,spd>ROAD_VMIN||RD.acc>.2,RD.acc<-.25,Math.min(3,fast*3+Math.max(0,RD.acc)*2+(tier===3?1:0)+RD.beat*.8),RD.bank);
  c.restore();
  ctx=old;
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
     ПОЛЕМ, попиксельно — 27lb-road-bloom. Здесь остаётся только ровная нить по
     самой кромке: она держит нижний край светящимся даже в полной тишине.

     Тёмной полосы на холсте нет: кнопки держит своё стекло подвала
     (`body.road .scr footer`), а не вырезанный из картинки кусок. */
  const bd=roadBands(RD.wave);
  RD.flow=(RD.flow||0)+dt*(.09+bd.bass*.34);   /* время шума: бас гонит течение */
  {
    const hs=h2=>((h2%360)+360)%360;
    const gh=H*(.030+en*.030+bd.bass*.025);
    c.save();c.globalCompositeOperation="lighter";
    const eg=c.createLinearGradient(0,H-gh,0,H);
    eg.addColorStop(0,"hsla("+hs(hue)+",92%,52%,0)");
    eg.addColorStop(1,"hsla("+hs(hue)+",92%,54%,"+(.07+en*.08+bd.bass*.06+RD.beat*.06).toFixed(3)+")");
    c.fillStyle=eg;c.fillRect(0,H-gh,W,gh);
    c.restore();
  }
  roadBloom(c,W,H,t,dt,hue,en,bd);
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
    /* пока по центру висит объявление о въезде, строка HUD молчит и проступает
       ему на смену: на видео имя системы стояло в кадре дважды (M168k) */
    const fa=clamp(Math.min(1,RD.sysFlash||0),0,1);
    c.fillStyle="hsla("+hue+",60%,72%,"+(.75*(1-fa)).toFixed(3)+")";
    c.fillText("система "+RD.sys.name.toUpperCase()+" · сектор "+RD.sys.cx+":"+RD.sys.cy,px2,yy);
    if(RD.mates>0){
      yy+=Math.round(H*.022);
      c.fillText("во вселенной ещё "+RD.mates+" "+roadPilotRu(RD.mates),px2,yy);
    }
    c.fillStyle="rgba(127,230,216,.6)";
  }
  /* «за поездку» и правда за поездку: прежде тут стояло суточное число под
     этой подписью, и было непонятно, что вообще считается (вопрос автора) */
  if((RD.kmTrip||0)>=.01){yy+=Math.round(H*.024);
    let tl="за поездку "+roadTripRu(RD.kmTrip);
    if((RD.vmax||0)>ROAD_VMIN)tl+=" · макс "+roadCosmic(RD.vmax).toLocaleString("ru")+" км/с";
    while(tl.length>8&&c.measureText(tl).width>W-px2*2)tl=tl.replace(/ · [^·]*$/,"");
    c.fillText(tl,px2,yy);}
  /* счётчик: крупно, жёлтым, только когда деньги пошли; комбо — фишкой с ×1.2 */
  if((RD.crTrip||0)>0||RD.crShow>.5){
    yy+=Math.round(H*.04);
    c.fillStyle="rgba(242,178,92,.95)";
    c.font=Math.round(H*.03)+"px ui-monospace,monospace";
    const crTx="+"+Math.round(RD.crShow).toLocaleString("ru")+" кр";
    c.fillText(crTx,px2,yy);
    RD.crXY=[px2+c.measureText(crTx).width*.5,yy-Math.round(H*.012)];   /* куда летят монеты */
    if(combo>=1.2){
      const cw=c.measureText(crTx).width;
      c.fillStyle="hsla("+hue+",80%,65%,"+(.7+.3*Math.sin(t*4)).toFixed(2)+")";
      c.font=Math.round(H*.022)+"px ui-monospace,monospace";
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
  c.font=Math.round(H*.015)+"px ui-monospace,monospace";
  /* сутки — тихой строкой под крупным числом поездки: крупно то, что
     заработано сейчас, мелко — сколько уже собрано за день и где потолок.
     Пока за сутки ровно столько же, сколько за поездку, строки нет: это
     первая поездка дня, и повторять одно число дважды незачем */
  /* ранг: он растёт месяцами, поэтому должен быть виден всегда — и рядом
     сколько до следующего, иначе прогрессия существует только в коде */
  {
    const rk=roadRank(R.total);
    yy+=Math.round(H*.026);
    let rl=rk.ru+(rk.k>1?" ×"+rk.k:"")+(rk.next?" · "+rk.next+" через "+Math.ceil(rk.left)+" км":"");
    while(rl.length>8&&c.measureText(rl).width>W-px2*2)rl=rl.replace(/ · [^·]*$/,"");
    c.fillText(rl,px2,yy);
  }
  if(R.bank>=1){
    yy+=Math.round(H*.026);
    c.fillText((R.cr>(RD.crTrip||0)?"за сутки "+R.cr.toLocaleString("ru")+" · ":"")+
      "запас "+Math.floor(R.bank).toLocaleString("ru")+" кр",px2,yy);
  }else{yy+=Math.round(H*.026);
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
    yy+=Math.round(H*.022);
    c.save();
    c.fillStyle="rgba(242,178,92,.85)";
    c.fillText("ОБРАТНЫЙ КУРС · ×"+ROAD_BACK_K+" за километр",px2,yy);
    c.restore();
  }
  const noteA=clamp((10-RD.hintT)/2,0,1);
  const line=s=>{
    yy+=Math.round(H*.022);
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
  /* премия за поворот — коротко, у корпуса: деньги должны быть СОБЫТИЕМ */
  if(RD.flashT>0&&RD.flash){
    const fa=clamp(RD.flashT/.5,0,1);
    c.save();c.textAlign="center";
    c.font=Math.round(H*.022)+"px ui-monospace,monospace";
    c.fillStyle="rgba(242,178,92,"+(fa*.95).toFixed(2)+")";
    c.fillText(RD.flash,cx,cy-h.len*sc*.62-(1-fa)*H*.03);
    c.restore();c.textAlign="left";
  }
  /* ── монеты: кредит летит от корпуса в счётчик ── */
  const tgt=RD.crXY||[W*.1,H*.2];
  for(let i=RD.coins.length-1;i>=0;i--){
    const k=RD.coins[i];
    k.p+=dt/1.05;
    if(k.p>=1){RD.coins.splice(i,1);continue;}
    if(k.p<0)continue;
    const u=k.p*k.p*(3-2*k.p);
    const x=k.x+(tgt[0]-k.x)*u, y=k.y+(tgt[1]-k.y)*u-Math.sin(Math.PI*k.p)*H*.07;
    const rr3=Math.max(1.6,W*.007);
    c.globalAlpha=Math.sin(Math.PI*Math.min(1,k.p*1.25))*.95;
    c.save();c.globalCompositeOperation="lighter";
    const cg2=c.createRadialGradient(x,y,0,x,y,rr3*4);
    cg2.addColorStop(0,"rgba(242,178,92,.55)");cg2.addColorStop(1,"rgba(242,178,92,0)");
    c.fillStyle=cg2;c.beginPath();c.arc(x,y,rr3*4,0,TAU);c.fill();
    c.restore();
    c.fillStyle="rgba(255,214,150,1)";
    c.beginPath();c.arc(x,y,rr3,0,TAU);c.fill();
    c.globalAlpha=1;
  }
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
    const fh=Math.round(H*.017),pad=Math.round(W*.03);
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
    const rc=cv.getBoundingClientRect();
    RD.pulses.push({x:(e.clientX-rc.left)*(cv.width/rc.width),y:(e.clientY-rc.top)*(cv.height/rc.height),r:8,a:.6});
    RD.hintT=0;                            /* подсказки возвращаются по касанию */
    /* долгое нажатие — окно правды по датчикам: без него нельзя понять, почему
       корпус не сходит с центра, а подкручивать вслепую нечестно (M168k) */
    clearTimeout(RD.pressT);
    RD.pressT=setTimeout(()=>{if(RD)RD.diag=!RD.diag;},900);
  });
  const drop=()=>{if(RD)clearTimeout(RD.pressT);};
  if(cv){cv.addEventListener("pointerup",drop);cv.addEventListener("pointercancel",drop);
    cv.addEventListener("pointermove",e=>{if(RD&&(Math.abs(e.movementX)>3||Math.abs(e.movementY)>3))drop();});}
  addEventListener("resize",()=>{
    if(!RD)return;
    const cv2=document.getElementById("roadcv");
    cv2.width=cv2.clientWidth*Math.min(2,devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
    cv2.height=cv2.clientHeight*Math.min(2,devicePixelRatio||1);
  });
})();
