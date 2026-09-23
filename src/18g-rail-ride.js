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
   бирюзовым лучом вдоль линии, 0.6 с, гаснет квадратом. На экране поездки —
   в точке поезда; в системе после выхода — на корабле. */
function railFlash(x,y,age,ang,k){
  const u=clamp(1-age/36,0,1);if(u<=0)return;
  const a=u*u*(k||1);
  ctx.save();ctx.globalCompositeOperation="lighter";
  const g=ctx.createRadialGradient(x,y,0,x,y,90*(1.2-u*.6));
  g.addColorStop(0,"rgba(255,255,255,"+(a*.9).toFixed(3)+")");
  g.addColorStop(.25,"rgba(180,240,255,"+(a*.45).toFixed(3)+")");
  g.addColorStop(1,"rgba(120,220,255,0)");
  ctx.fillStyle=g;ctx.fillRect(x-120,y-120,240,240);
  ctx.strokeStyle="rgba(200,250,255,"+(a*.8).toFixed(3)+")";ctx.lineWidth=2*u+.5;
  const L=60+140*(1-u);
  ctx.beginPath();ctx.moveTo(x-Math.cos(ang)*L,y-Math.sin(ang)*L);ctx.lineTo(x+Math.cos(ang)*L,y+Math.sin(ang)*L);ctx.stroke();
  ctx.restore();
}
function drawRailArrive(zx,zy){
  const age=G.t-RAIL_ARRIVE;if(age>40)return;
  railFlash(zx(G.ship.x),zy(G.ship.y),age,G.ship.a,1.2);
}
function railRideStart(t){
  const l=t.l,n=l.stops.length,seq=[];
  for(let m=0;m<=t.k;m++){let i=t.i0+t.dir*m;if(l.loop)i=((i%n)+n)%n;seq.push(i);}
  RAIL_RIDE={l,seq,seg:0,phase:"go",t:0,dur:railSegDur(l,seq,0)*(t.bus?1.6:1),pause:0,express:!!t.express,bus:!!t.bus,t0:G.t,flash:G.t,next:(typeof railNextLeg==="function")?railNextLeg(t):null};
  if(t.bus&&typeof railBusTalk==="function")railBusTalk();   /* водитель маршрутки знает, почему (M510) */
  G.mode="rail";G.ap=null;
  if(typeof socCount==="function")socCount("rides");   /* «Знающие» считают поездки (M512) */
  if(typeof cueReset==="function")cueReset();   /* оклик кольца остался в системе — в вагоне его нет */
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
    if(typeof cueReset==="function")cueReset();   /* на перегоне выйти нельзя — пульт молчит */
    R.t+=sec;
    if(R.t>=R.dur){R.seg++;R.phase="stop";R.pause=0;R.hold=2;
      const s=R.l.stops[R.seq[R.seg]],last=R.seg>=R.seq.length-1&&!R.next;
      /* пересадка (M472): конец первой ноги — поезд другой линии, три секунды стоянки */
      if(R.seg>=R.seq.length-1&&R.next){
        const nx=R.next;R.next=null;R.l=nx.l;R.seq=nx.seq;R.seg=0;R.hold=3;
        say("Пересадка · «"+railStopName(s)+"»\nдальше — "+nx.l.ru,150);
        if(typeof voiceSay==="function")voiceSay(["Станция "+railStopName(s)+".","Пересадка на линию "+nx.l.ru+"."],"disp");
        R.flash=G.t;return;
      }
      /* EXPRESS™ проходит мимо: остановки нет, только конечная (M474) */
      if(R.express&&!last){R.phase="go";R.t=0;R.dur=railSegDur(R.l,R.seq,R.seg)*.92;return;}
      /* Хай-Фронт: «обновление установлено» — линия стоит на первой остановке */
      const hp=(typeof railHfPauseAt==="function"&&R.seg===1)?railHfPauseAt(R):0;
      if(hp){R.hfDone=1;R.hold=2+hp;say("Обновление установлено\nперезагрузка линии · "+hp+" с",200);return;}
      if(typeof railLifeStop==="function")railLifeStop(R);   /* чай, попутчик (M501–M502) */
      if(last)say("Конечная. «"+railStopName(s)+"»\nпоезд дальше не идёт, просьба освободить вагоны",150);
      else say("Станция «"+railStopName(s)+"»\nследующая — «"+railStopName(R.l.stops[R.seq[R.seg+1]])+"»",110);
      /* объявитель (M473 хвост): голос диспетчера, если голос включён в ЗВУКЕ */
      if(typeof voiceSay==="function")voiceSay(last?["Конечная, "+railStopName(s)+".","Поезд дальше не идёт."]:["Станция "+railStopName(s)+".","Следующая — "+railStopName(R.l.stops[R.seq[R.seg+1]])+"."],"disp");
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
  if(typeof railLifeExit==="function")railLifeExit(s);   /* посылка, попутчик, пломба (M499–M508) */
  arriveSystem(s.sx,s.sy,{rail:true,at});
  RAIL_ARRIVE=G.t;   /* вспышка выхода в системе (M473 хвост) */
  G.ship.vx=(at?Math.cos(at.a):0)*.5;G.ship.vy=(at?Math.sin(at.a):0)*.5;
}
function drawRail(){
  const R=RAIL_RIDE;if(!R)return;
  ctx.fillStyle="#03040a";ctx.fillRect(0,0,W,H);
  const cell=Math.min(W,H)/14,p=railTrainPos(),V={x:p.x,y:p.y};
  drawGalaxy(V,cell);drawGalaxyStars(V,cell);
  if(typeof drawRailMap==="function")drawRailMap(V,cell,true);
  const X=x=>W/2+(x-V.x)*cell,Y=y=>H/2+(y-V.y)*cell,l=R.l;
  /* своя линия — толсто, в цвете схемы */
  const c=RAIL_COL[l.kind];
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  /* путь — кайма, полотно в цвете схемы и светлая осевая: рельс, а не черта */
  ctx.beginPath();l.pts.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));
  ctx.strokeStyle="rgba(3,4,10,.8)";ctx.lineWidth=8;ctx.stroke();
  if(R.bus){                                        /* маршрутка идёт трассой, не рельсом: пунктир (M510) */
    ctx.setLineDash([10,7]);ctx.strokeStyle="rgba(242,178,92,.85)";ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);
  }else{
    ctx.strokeStyle=rgba(c,.8);ctx.lineWidth=4;ctx.stroke();
    ctx.strokeStyle=rgba(mixc(c,[255,255,255],.6),.45);ctx.lineWidth=1;ctx.stroke();
  }
  /* остановки маршрута: засечки с именами; пересадки — двойной круг */
  ctx.font=uiFont(10);ctx.textAlign="left";
  R.seq.forEach((i,m)=>{
    const s=l.stops[i],x=X(s.sx),y=Y(s.sy),jn=RAIL_NET&&RAIL_NET.at[s.sx+","+s.sy]&&RAIL_NET.at[s.sx+","+s.sy].length>1;
    const done=m<R.seg||(m===R.seg&&R.phase==="go");
    ctx.fillStyle="#0b0d12";ctx.beginPath();ctx.arc(x,y,jn?7:5,0,TAU);ctx.fill();
    ctx.strokeStyle=done?"rgba(160,160,160,.5)":"rgba(245,240,230,.95)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,jn?6:4,0,TAU);ctx.stroke();
    if(jn){ctx.beginPath();ctx.arc(x,y,2.5,0,TAU);ctx.stroke();}
    ctx.fillStyle=done?"rgba(200,200,200,.45)":"rgba(245,240,230,.9)";
    ctx.fillText(railStopName(s),x+10,y+4);
  });
  /* поезд: скруглённая метка с клином фары по ходу */
  const nx=R.seg<R.seq.length-1?l.stops[R.seq[R.seg+1]]:l.stops[R.seq[R.seg]];
  const a=Math.atan2(nx.sy-p.y,nx.sx-p.x),tx=X(p.x),ty=Y(p.y);
  ctx.translate(tx,ty);ctx.rotate(a);
  const hg=ctx.createLinearGradient(8,0,70,0);hg.addColorStop(0,"rgba(255,244,210,.35)");hg.addColorStop(1,"rgba(255,244,210,0)");
  ctx.fillStyle=hg;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(70,-16);ctx.lineTo(70,16);ctx.closePath();ctx.fill();
  if(R.bus){
    /* ПАЗик: кремовый короб с красной полосой, окна по борту, табличка
       маршрута спереди; качается, как маршрутка на выбоинах */
    ctx.rotate(Math.sin(G.t*.31)*.05);
    ctx.fillStyle="#0b0d12";ctx.fillRect(-14,-7.5,26,15);
    ctx.fillStyle="#e9dcae";ctx.fillRect(-13,-6.5,24,13);
    ctx.fillStyle="#c8402f";ctx.fillRect(-13,-1.4,24,2.8);
    ctx.fillStyle="rgba(30,40,52,.9)";for(let i=0;i<5;i++){ctx.fillRect(-11+i*4.2,-5.6,3,2.6);ctx.fillRect(-11+i*4.2,3,3,2.6);}
    ctx.fillStyle="#f5f2e8";ctx.fillRect(9.5,-3,2.5,6);
    ctx.fillStyle="#0b0d12";ctx.font="bold 5px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("М",10.8,.3);
  }else{
  ctx.fillStyle="#f5efe0";ctx.strokeStyle="#0b0d12";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-12,-6);ctx.lineTo(8,-6);ctx.arc(8,0,6,-Math.PI/2,Math.PI/2);ctx.lineTo(-12,6);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
  if(R.flash!==undefined)railFlash(tx,ty,G.t-R.flash,a,1);   /* уход/приход — вспышка гипера */
  /* строка сверху: линия и следующая */
  const nxt=R.seg<R.seq.length-1?"следующая — «"+railStopName(l.stops[R.seq[R.seg+1]])+"»":"конечная";
  ctx.fillStyle="rgba(242,178,92,.9)";ctx.font=uiFont(11);ctx.textAlign="center";
  ctx.fillText(l.ru.toUpperCase()+" · "+nxt,W/2,H*.16);
}
