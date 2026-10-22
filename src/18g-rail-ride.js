/* ══════════════ поездка: режим rail на карте галактики (M473, DESIGN-metro §4) ══════════════
   Поездка — это карта: мировая галактика (M447) и лист уже есть, поэтому
   ехать почти бесплатно для рисования. Камера держит линию впереди; поезд —
   яркая метка на ней; остановки — засечки с именами; прочие линии бледные.
   Перегон: разгон и торможение, как у поезда; остановка — две секунды, имя,
   «Следующая станция — …» и ВЫЙТИ на пульте. Конечная выпускает корабль из
   кольца станции назначения, медленно, носом к станции.

   Время: перегон 0.8 с + 0.35 с на сектор, остановка 2 с — три остановки
   метро за 6–8 секунд. Состояние поездки — кадр: сейв посреди поездки
   просыпается в системе отправления (записано в плане). */
let RAIL_RIDE=null,RAIL_ARRIVE=-1e9;
/* ── вспышка гипера (M473 хвост, 18.09) ──
   Поезд не едет по рельсам — он прыгает: уход и приход — белая вспышка с
   бирюзовым лучом вдоль линии, 0.6 с, гаснет квадратом. На экране поездки её
   рисует поле видеокарты (railFx, 18ga); в системе после выхода — то же поле
   в проходе сцены, без конуса фары (M828: прежняя 2D-вспышка railFlash снята). */
function drawRailArrive(zx,zy){
  const age=G.t-RAIL_ARRIVE;if(age>40)return;
  railFx(gpuScene(),zx(G.ship.x),zy(G.ship.y),G.ship.a,age,0,RAIL_COL.arm,{k:1.2,head:0});
}
function railRideStart(t){
  const l=t.l,n=l.stops.length,seq=[];
  for(let m=0;m<=t.k;m++){let i=t.i0+t.dir*m;if(l.loop)i=((i%n)+n)%n;seq.push(i);}
  RAIL_RIDE={l,seq,seg:0,phase:"go",t:0,dur:railSegDur(l,seq,0)*(t.bus?1.6:1),pause:0,express:!!t.express,bus:!!t.bus,t0:G.t,flash:G.t,next:railNextLeg(t)};
  if(t.bus)railBusTalk();   /* водитель маршрутки знает, почему (M510) */
  G.mode="rail";G.ap=null;
  socCount("rides");   /* «Знающие» считают поездки (M512) */
  cueReset();   /* оклик кольца остался в системе — в вагоне его нет */
  sfx("jump");
  say("Поезд отправляется\n"+l.ru+" · до «"+railStopName(l.stops[seq[seq.length-1]])+"»",120);
}
function railSegDur(l,seq,seg){
  const a=l.stops[seq[seg]],b=l.stops[seq[seg+1]];
  return .8+.35*Math.hypot(a.sx-b.sx,a.sy-b.sy);
}
/* положение поезда в секторах: по ломаной линии между долями остановок */
function railTrainPos(){
  const R=RAIL_RIDE,l=R.l,a=l.stops[R.seq[R.seg]];
  if(R.phase!=="go"||R.seg>=R.seq.length-1){const s=l.stops[R.seq[R.seg]];return {x:s.sx,y:s.sy};}
  const b=l.stops[R.seq[R.seg+1]];
  let u=clamp(R.t/R.dur,0,1);u=u*u*(3-2*u);                 /* разгон и торможение */
  /* по самой линии: доли остановок на ломаной; у кольца через ноль — коротким путём */
  let ua=a.u,ub=b.u;
  if(l.loop&&Math.abs(ub-ua)>.5){if(ub<ua)ub+=1;else ua+=1;}
  const p=railAt(l.pts,((ua+(ub-ua)*u)%1+1)%1);
  /* от станции к станции: система не лежит точно на линии — подтягиваем концы */
  const w=Math.sin(u*Math.PI);
  return {x:(a.sx+(b.sx-a.sx)*u)*(1-w)+p[0]*w,y:(a.sy+(b.sy-a.sy)*u)*(1-w)+p[1]*w};
}
function updateRail(dt){
  const R=RAIL_RIDE;if(!R){G.mode="system";return;}
  const sec=dt/60;
  if(R.phase==="go"){
    cueReset();   /* на перегоне выйти нельзя — пульт молчит */
    if(R.bus){if(actEdge&&railBusDrop())return;}   /* «остановите здесь» (M474) */
    R.t+=sec*(keys.act&&!R.bus?2:1);   /* зажатый пэд — вдвое быстрее, но не пропуск (M473, §4) */
    R.fast=!!keys.act&&!R.bus;
    if(R.t>=R.dur){R.seg++;R.phase="stop";R.pause=0;R.hold=2;
      const s=R.l.stops[R.seq[R.seg]],last=R.seg>=R.seq.length-1&&!R.next;
      /* пересадка (M472): конец первой ноги — поезд другой линии, три секунды стоянки */
      if(R.seg>=R.seq.length-1&&R.next){
        const nx=R.next;R.next=null;R.l=nx.l;R.seq=nx.seq;R.seg=0;R.hold=3;
        say("Пересадка · «"+railStopName(s)+"»\nдальше — "+nx.l.ru,150);
        voiceSay(["Станция "+railStopName(s)+".","Пересадка на линию "+nx.l.ru+"."],"disp");
        R.flash=G.t;return;
      }
      /* EXPRESS™ проходит мимо: остановки нет, только конечная (M474) */
      if(R.express&&!last){R.phase="go";R.t=0;R.dur=railSegDur(R.l,R.seq,R.seg)*.92;return;}
      /* путь дальше перерезан (M510): фронт встал на линию за время поездки — конечная здесь */
      if(!last&&!R.next&&railCut(s,R.l.stops[R.seq[R.seg+1]])){R.seq=R.seq.slice(0,R.seg+1);
        say("«"+railStopName(s)+"» — дальше путь перерезан\nфронт · поезд дальше не идёт",170);R.hold=2;R.flash=G.t;return;}
      /* закрытая остановка фронта (M474): проходим без остановки, объявляют */
      if(!last&&railFrontShut(s)){R.phase="go";R.t=0;R.dur=railSegDur(R.l,R.seq,R.seg);
        say("«"+railStopName(s)+"» — остановка закрыта\nфронт · проследуем без остановки",110);return;}
      /* Хай-Фронт: «обновление установлено» — линия стоит на первой остановке */
      const hp=(R.seg===1)?railHfPauseAt(R):0;
      if(hp){R.hfDone=1;R.hold=2+hp;say("Обновление установлено\nперезагрузка линии · "+hp+" с",200);return;}
      railLifeStop(R);   /* чай, попутчик (M501–M502) */
      if(last)say("Конечная. «"+railStopName(s)+"»\nпоезд дальше не идёт, просьба освободить вагоны",150);
      else say("Станция «"+railStopName(s)+"»\nследующая — «"+railStopName(R.l.stops[R.seq[R.seg+1]])+"»",110);
      /* объявитель (M473 хвост): голос диспетчера, если голос включён в ЗВУКЕ */
      voiceSay(last?["Конечная, "+railStopName(s)+".","Поезд дальше не идёт."]:["Станция "+railStopName(s)+".","Следующая — "+railStopName(R.l.stops[R.seq[R.seg+1]])+"."],"disp");
      R.flash=G.t;   /* прибытие на остановку — вспышка выхода из гипера */
    }
    return;
  }
  R.pause+=sec;
  const last=R.seg>=R.seq.length-1&&!R.next;
  if(!last){
    const shown=cue("СТАНЦИЯ «"+railStopName(R.l.stops[R.seq[R.seg]]).toUpperCase()+"»\nДЕЙСТВИЕ — ВЫЙТИ",CUE_ACT);
    if(shown&&actEdge){railExit();return;}
  }
  if(R.pause>=(R.hold||2)){
    if(last){railExit();return;}
    R.phase="go";R.t=0;R.dur=railSegDur(R.l,R.seq,R.seg)*(R.bus?1.6:1);R.flash=G.t;   /* уход в гипер */
  }
}
/* выйти на текущей остановке: кольцо выбрасывает корабль на подъезд */
function railExit(){
  const R=RAIL_RIDE;RAIL_RIDE=null;
  const s=R.l.stops[R.seq[R.seg]],sys=getSystem(s.sx,s.sy);
  let at=null;
  if(sys.station){
    const P=sysLane(sys);
    if(P){const x=P.st.x-P.ux*RAIL_RING_OFF,y=P.st.y-P.uy*RAIL_RING_OFF;at={x:x+P.ux*60,y:y+P.uy*60,a:Math.atan2(P.uy,P.ux)};}
  }
  railLifeExit(s);   /* посылка, попутчик, пломба (M499–M508) */
  arriveSystem(s.sx,s.sy,{rail:true,at});
  RAIL_ARRIVE=G.t;   /* вспышка выхода в системе (M473 хвост) */
  G.ship.vx=(at?Math.cos(at.a):0)*.5;G.ship.vy=(at?Math.sin(at.a):0)*.5;
}
function drawRail(){
  const R=RAIL_RIDE;if(!R)return;
  /* фон — в проходе сцены, под галактикой (18ga) */
  gpuShapes(gpuScene(),[[0,0,0,W,H,0,0,3,4,10,1]]);
  const cell=Math.min(W,H)/14,p=railTrainPos(),V={x:p.x,y:p.y};
  drawGalaxy(V,cell);drawGalaxyStars(V,cell);
  drawRailMap(V,cell,true);
  const X=x=>W/2+(x-V.x)*cell,Y=y=>H/2+(y-V.y)*cell,l=R.l;
  const c=RAIL_COL[l.kind];
  /* поезд: куда смотрит и как быстро идёт (производная разгона-торможения) */
  const nx=R.seg<R.seq.length-1?l.stops[R.seq[R.seg+1]]:l.stops[R.seq[R.seg]];
  const a=Math.atan2(nx.sy-p.y,nx.sx-p.x),tx=X(p.x),ty=Y(p.y);
  const uu=R.phase==="go"?clamp(R.t/R.dur,0,1):0;
  /* над галактикой — проход поверх: своя линия под током, остановки, вагон телом и свет поездки;
     #c пуст, поэтому склейка не нужна (gpuNext). Маршрутка идёт трассой — пунктиром (M510) */
  const pass=gpuNext();   /* без видеокарты null: каждый рисующий ниже его сам пропускает */
  railLineGpu(pass,l.pts.map(q=>[X(q[0]),Y(q[1])]),c,R.bus,tx,ty,cell,G.t/60);
  /* остановки маршрута — бусины под светом ядра (18gb), имена — подписями; пересадка — тор в торе */
  const [lx,ly]=sysLightDir(p.x,p.y),SH=[],AD=[],fn=uiFont(10);
  R.seq.forEach((i,m)=>{
    const s=l.stops[i],x=X(s.sx),y=Y(s.sy),jn=RAIL_NET&&RAIL_NET.at[s.sx+","+s.sy]&&RAIL_NET.at[s.sx+","+s.sy].length>1;
    const done=m<R.seg||(m===R.seg&&R.phase==="go");
    railStopShapes(SH,AD,x,y,jn,done,lx,ly);
    domLabel("rs"+m,x+10,y+4,railStopName(s),fn,done?"rgba(200,200,200,.45)":"rgba(245,240,230,.9)","left");
  });
  gpuShapes(pass,SH);gpuShapes(pass,AD,{blend:"add"});
  /* вагон: тело под тем же светом; фара, вспышка гипера и росчерки перегона — полем ПОВЕРХ вагона */
  railCarDraw(pass,R,tx,ty,a,cell,p.x,p.y);
  railFx(pass,tx,ty,a,R.flash!==undefined?G.t-R.flash:99,R.phase==="go"?Math.pow(6*uu*(1-uu)/1.5,.8):0,c);
  /* строка сверху: линия и следующая; на перегоне — «×2», если пэд зажат, иначе подсказка (M473) */
  const nxt=R.seg<R.seq.length-1?"следующая — «"+railStopName(l.stops[R.seq[R.seg+1]])+"»":"конечная";
  domLabel("rh",W/2,H*.16,l.ru.toUpperCase()+" · "+nxt,uiFont(11),"rgba(242,178,92,.9)","center");
  if(R.phase==="go")domLabel("rh2",W/2,H*.16+16*uiK(),R.bus?"ДЕЙСТВИЕ — «ВОДИТЕЛЬ, ОСТАНОВИТЕ ЗДЕСЬ»":R.fast?"×2 · ПЭД ЗАЖАТ":"ДЕЙСТВИЕ ЗАЖАТЬ — ВДВОЕ БЫСТРЕЕ",
    uiFont(9),R.fast?"rgba(127,230,216,.9)":"rgba(207,227,234,.45)","center");
}
