/* ══════════════ подъезд: полоса от входа в систему к доку (M459, DESIGN-life §2–3.1) ══════════════
   У системы есть вход (P9: угол от зерна), и от него к станции ведёт полоса:
   пары бакенов через каждые LANE_GAP, по одному огню на бакене, и огни БЕГУТ к
   доку — фаза, а не мигание (закон «движение, а не мигание»). У людной станции —
   очередь: два–шесть кораблей на медленном эллипсе сбоку от полосы, один
   садится, один уходит по полосе к входу.

   Густота — сердцевина × ступень: у ядра и в обжитом людно, на краю пусто,
   в дикой системе (без станции) ничего. Всё это функция времени, ничего не
   хранится и не считается вне кадра — как челноки 17f. Бакен запечён один раз
   на всю игру, корабли очереди — спрайты флота (12ai1) в грунте хозяина
   станции; каждый кадр — только огни и положение кораблей. */
const LANE_GAP=240;      /* шаг пар бакенов вдоль полосы, ед. */
const LANE_W=46;         /* полуширина полосы — бакен от оси */
const LANE_DOCK=150;     /* первая пара — столько от станции */
const LANE_CHASE=2;      /* бегущий огонь: пар в секунду */
const LANE_Q_MAX=6;      /* очередь у дока, кораблей */
const LANE_Q_CLS=["post","tanker","fridge","ore","lighter","ferry"];
/* вход в систему: сюда кладёт корабль прыжок (18-mode-map), отсюда начинается полоса */
function sysEntry(sx,sy){
  const a=((hashi(sx,sy,0x51A7)>>>0)%3600)/3600*TAU,r=1500;
  return {x:Math.cos(a)*r,y:Math.sin(a)*r,a};
}
/* жизнь системы 0…1: сердцевина (sysDanger — 0 у ядра) × ступень лестницы.
   Ступень — это обжитость ИГРОКОМ, поэтому она только добавляет: станция
   сердцевины людна и без него */
function laneLife(sys){
  const heart=1-sysDanger(sys.sx,sys.sy);
  const rung=(typeof rungOf==="function")?rungOf(sys.sx,sys.sy):0;
  return clamp((.35+.65*heart)*(.6+.4*Math.min(1,rung/30)),0,1);
}
function sysLane(sys){
  if(sys.lane!==undefined){
    /* станция ходит по орбите (~60 ед. в минуту), а полоса запоминалась по
       первому снимку — за пять минут бакены, очередь, щит и «Чебуречная»
       уходили от дока на сотни единиц (найдено 23.09). Полоса едет за станцией */
    const P=sys.lane,st=sys.station;
    if(P&&st){const dx=st.x-P.st.x,dy=st.y-P.st.y;
      if(dx||dy){P.st.x=st.x;P.st.y=st.y;P.hx+=dx;P.hy+=dy;P.E={x:P.E.x+dx,y:P.E.y+dy};for(const b of P.buoys){b.x+=dx;b.y+=dy;}}}
    return P;
  }
  const st=sys.station;
  if(!st)return sys.lane=null;
  const E=sysEntry(sys.sx,sys.sy),life=laneLife(sys);
  const dx=E.x-st.x,dy=E.y-st.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  /* пары: две на тихой станции, три на людной — бюджет 3–6 бакенов (§4) */
  const pairs=life>.6?3:2,buoys=[];
  for(let i=0;i<pairs;i++){
    const d=LANE_DOCK+i*LANE_GAP;if(d>L-80)break;
    for(const s of [-1,1])buoys.push({x:st.x+ux*d-uy*LANE_W*s,y:st.y+uy*d+ux*LANE_W*s,i});
  }
  const r=rng((sys.seed^0x1A4E)>>>0),by=st.by||(typeof makerBySeed==="function"?makerBySeed(sys.seed):"gt");   /* как stationMods: полоса могла спросить раньше станции */
  /* очередь — только у людной станции; сбоку от полосы, чтобы не стоять на ней */
  const qn=life<.45?0:Math.min(LANE_Q_MAX,Math.round(2+(life-.45)/.55*4));
  const side=r()<.5?-1:1;
  /* воздух (автор 19.09: «пошире все сделать, добавить воздуха»): очередь — своя сторона, 300 от оси;
     стоянка флота за ней (560, 17m); отель и щит — ВСЕГДА на другой стороне, щит дальше по полосе */
  const hx=st.x+ux*120-uy*300*side,hy=st.y+uy*120+ux*300*side;
  const ship=()=>({k:LANE_Q_CLS[Math.floor(r()*LANE_Q_CLS.length)],seed:(r()*1e9)|0,by});
  const queue=[];for(let i=0;i<qn;i++)queue.push(ship());
  return sys.lane={st:{x:st.x,y:st.y},E,ux,uy,L,pairs,buoys,life,by,
    hx,hy,side,queue,dock:qn?ship():null,out:qn?ship():null,ph:r()};
}
/* ── бакен: печётся один раз на всю игру, на GPU-холсте (08ca) ──
   Тёмный цилиндр с холодной кромкой и короткой фермой к огню; сам огонь — живой */
/* мастер крупнее экрана (×4): печь по экранному размеру пробовали (25.09) — билинейная выборка
   повёрнутого спрайта почти 1:1 мягче, чем спуск по мипам с крупного мастера (края −3 %) */
const LANE_BUOY={R:14,SS:4,M:new Map()};
function laneBuoySprite(){
  const n=LANE_BUOY.R*2*LANE_BUOY.SS;
  return gpuBaked(LANE_BUOY.M,"buoy",n,n,laneBuoyPaint);
}
function laneBuoyPaint(c){
  const R=LANE_BUOY.R,SS=LANE_BUOY.SS;c.scale(SS,SS);c.translate(R,R);
  /* D7 (телефон 18.09): тёмный цилиндр с огнём сбоку читался мусорным баком.
     Бакен — прибор, и у него знаки прибора: светлый корпус с тенью на одной
     стороне, ЧЁРНО-ЖЁЛТЫЙ пояс (знак «бакен» у всех флотов), катафот и крест
     радарного отражателя над фермой; огонь — на мачте, в клетке */
  c.fillStyle="#3b4553";c.strokeStyle="rgba(0,0,0,.75)";c.lineWidth=.7;
  c.beginPath();c.moveTo(-3.6,-5);c.lineTo(3.6,-5);c.lineTo(4.4,6);c.lineTo(-4.4,6);c.closePath();c.fill();c.stroke();
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.moveTo(.6,-5);c.lineTo(3.6,-5);c.lineTo(4.4,6);c.lineTo(1.2,6);c.closePath();c.fill();   /* тень на теневой стороне */
  c.fillStyle="rgba(210,226,240,.55)";c.fillRect(-3.6,-4.4,1,10);          /* кромка с солнечной стороны */
  for(let i=0;i<4;i++){c.fillStyle=i%2?"#e8b830":"#161a20";c.fillRect(-4+i*2,0,2.1,2.2);}   /* пояс: жёлтое с чёрным */
  c.fillStyle="rgba(255,120,90,.9)";c.fillRect(-1.2,3.2,2.4,1.4);          /* катафот */
  c.fillStyle="#2b3440";c.fillRect(-4.8,6,9.6,1.6);                          /* башмак */
  c.strokeStyle="rgba(170,184,200,.8)";c.lineWidth=.7;                      /* мачта и ферма */
  c.beginPath();c.moveTo(-2,-5);c.lineTo(0,-9);c.lineTo(2,-5);c.moveTo(0,-9);c.lineTo(0,-11.5);c.stroke();
  c.beginPath();c.moveTo(-2.2,-7.6);c.lineTo(2.2,-7.6);c.stroke();          /* крест отражателя */
  c.strokeStyle="rgba(200,214,228,.7)";c.lineWidth=.5;                      /* клетка огня */
  c.beginPath();c.arc(0,-11.5,2,0,TAU);c.stroke();
}
/* ореол огня: радиальный градиент в единичном круге, как glowSprite (16a0), только на GPU-холсте */
const LANE_GLOW_SP=new Map();
function laneGlowSprite(col){
  return gpuBaked(LANE_GLOW_SP,col.join(","),GLOW_SP,GLOW_SP,c=>{
    c.translate(GLOW_SP/2,GLOW_SP/2);c.scale(GLOW_SP/2,GLOW_SP/2);
    const g=c.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,rgba(mixc(col,[255,255,255],.6),1));g.addColorStop(.25,rgba(col,.55));g.addColorStop(1,rgba(col,0));
    c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();
  },{ss:1});
}
function laneLampCol(by){
  const MF=(typeof makerFlame==="function")?makerFlame(by):null;
  return (MF&&MF.col)?MF.col:[255,190,110];
}
/* огонь бакена: ореол кладётся краской, как в 2D — сложение выжигало клетку огня в белое */
const LANE_GLOW=1,LANE_HALO=.45;
function drawSysLane(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const P=sysLane(sys);if(!P||!P.buoys.length)return;
  const pass=gpuScene();if(!pass)return;          /* 2D-пути нет: без видеокарты полосы не видно */
  const s=clamp(Z,.6,1.5)*1.1,R=LANE_BUOY.R*s,sp=laneBuoySprite();
  const col=laneLampCol(P.by),glow=laneGlowSprite(col);
  if(!sp||!glow)return;
  /* бегущий огонь: гребень идёт от дальней пары к ближней и уходит в док;
     пауза в полторы пары между проходами — чтобы читалось направление */
  const lead=P.pairs-1-((G.t/60*LANE_CHASE)%(P.pairs+1.5));
  const na=Math.atan2(P.uy,P.ux)+Math.PI/2;       /* бакен стоит поперёк полосы */
  /* на видеокарте: бакены одной пачкой, ореол огня краской, лампа — точкой */
  {const B=[],Gl=[],Lp=[],Lh=[],lc=mixc(col,[255,255,255],.5);
    for(const b of P.buoys){
      const x=zx(b.x),y=zy(b.y);
      if(x<-40||x>W+40||y<-40||y>H+40)continue;
      const k=Math.max(0,1-Math.abs(b.i-lead)*1.4),r=(7+22*k)*s;
      const lx=x+Math.cos(na-Math.PI/2)*11.5*s,ly=y+Math.sin(na-Math.PI/2)*11.5*s;
      B.push({x,y,w:R*2,h:R*2,rot:na});
      Gl.push({x:lx,y:ly,w:r*2,h:r*2,a:(.35+.65*k)*LANE_GLOW});
      Lp.push([1,lx,ly,Math.max(1,1.3*s),0,0,0,lc[0],lc[1],lc[2],.5+.5*k]);
      Lh.push([1,lx,ly,.7*s,0,0,2.6*s,lc[0],lc[1],lc[2],(.5+.5*k)*LANE_HALO]);}
    gpuImage(pass,sp,B,{sharp:true});   /* бакен — вещь: маска, как у флота; ореолу — нет */
    gpuImage(pass,glow,Gl);             /* D7: гребень крупнее — огни посадочной полосы, а не искры */
    gpuShapes(pass,Lp);gpuShapes(pass,Lh,{blend:"add"});   /* лампа — явная эмиссия, узкий ореол */
  }
}
/* ── очередь у дока и два движения мимо неё ── */
function laneShip(f,x,y,a,al,Z){
  /* за краем (до 1.6 экрана) или ещё прозрачен — мастер печётся заранее, шагом (17a0) */
  if(al<=.02||x<-200||x>W+200||y<-200||y>H+200){if(pbOnScreen(x,y,0,0,1.6))fleetArtOf(f,true);return;}
  /* издали очередь сжимается с миром: эллипс ожидания 150×70 на ×0.16 — полсотни пикселей,
     корабли с полом масштаба ложились в нём друг на друга кашей (снимок автора 19.09) */
  const s=Math.min(fleetScale(Z),Z*1.4)*.62,c=Math.cos(a)*s,q=Math.sin(a)*s;
  /* место и курс известны — матрица сразу в fleetShipAt, без 2D-стека (было 7 вызовов на борт) */
  fleetShipAt(f,fleetArtOf(f,false),c,q,-q,c,x,y,al);
}
/* ── ажиотаж на подъезде (M504, дизайн-проход 23.09) ──
   После ЖИЛЫ сюда летят все: от входа по оси полосы тянется вереница
   старателей, и за очередью у дока встаёт второй, широкий круг ожидания.
   Корабли — функция времени и зерна системы, ничего не хранится */
function drawRushTraffic(P,zx,zy,Z,ts){
  if(!P.rush){const r=rng((hashi(G.sx,G.sy,0x2A5)>>>0)||1),by=P.by;
    P.rush=[];for(let i=0;i<9;i++)P.rush.push({k:LANE_Q_CLS[Math.floor(r()*LANE_Q_CLS.length)],seed:(r()*1e9)|0,by:r()<.5?by:"ra"});}
  const ea=Math.atan2(P.uy,P.ux),ca=Math.cos(ea),sa=Math.sin(ea);
  for(let i=0;i<5;i++){                                            /* вереница от входа — к доку */
    const u=(ts/22+i/5+P.ph)%1,d=P.L-(P.L-260)*u;
    const x=P.st.x+P.ux*d-P.uy*(28*(i%2?1:-1)),y=P.st.y+P.uy*d+P.ux*(28*(i%2?1:-1));
    laneShip(P.rush[i],zx(x),zy(y),ea+Math.PI,Math.min(1,u/.08,(1-u)/.12),Z);
  }
  for(let i=0;i<4;i++){                                            /* второй круг ожидания, шире и медленнее */
    const w=-ts*TAU/70+i/4*TAU+P.ph*3,ex=Math.cos(w)*240,ey=Math.sin(w)*120*P.side;
    const x=P.hx+ex*ca-ey*sa,y=P.hy+ex*sa+ey*ca,w2=w-.02,x2=P.hx+Math.cos(w2)*240*ca-Math.sin(w2)*120*P.side*sa,y2=P.hy+Math.cos(w2)*240*sa+Math.sin(w2)*120*P.side*ca;
    laneShip(P.rush[5+i],zx(x),zy(y),Math.atan2(y2-y,x2-x),.9,Z);
  }
}
function drawSysLaneShips(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const P=sysLane(sys);if(!P||!gpuScene())return;
  const ts=G.t/60,n=P.queue.length;
  if(typeof rushAt==="function"&&rushAt(G.sx,G.sy))drawRushTraffic(P,zx,zy,Z,ts);   /* ажиотаж: подъезд полон (M504) */
  if(!n)return;
  const ea=Math.atan2(P.uy,P.ux),ca=Math.cos(ea),sa=Math.sin(ea);
  /* эллипс ожидания: полоса — его длинная ось; круг за сорок секунд */
  const onEll=w=>{const ex=Math.cos(w)*150,ey=Math.sin(w)*70*P.side;
    return {x:P.hx+ex*ca-ey*sa,y:P.hy+ex*sa+ey*ca}};
  for(let i=0;i<n;i++){
    const w=ts*TAU/40+i/n*TAU+P.ph*TAU,p=onEll(w),p2=onEll(w+.02);
    laneShip(P.queue[i],zx(p.x),zy(p.y),Math.atan2(p2.y-p.y,p2.x-p.x),1,Z);
  }
  /* садится: с эллипса к доку за десять секунд, у дока гаснет — вошёл */
  {
    const u=(ts/10+P.ph)%1,e=u*u*(3-2*u),a0=onEll(P.ph*TAU);
    const x=a0.x+(P.st.x-a0.x)*e,y=a0.y+(P.st.y-a0.y)*e;
    const al=Math.min(1,u/.1,(1-u)/.2);
    laneShip(P.dock,zx(x),zy(y),Math.atan2(P.st.y-a0.y,P.st.x-a0.x),al,Z);
  }
  /* уходит: от дока по оси полосы к входу, разгоняясь; у входа гаснет — прыгнул */
  {
    const u=(ts/14+P.ph*.5)%1,d=40+(P.L-40)*u*u;
    const x=P.st.x+P.ux*d,y=P.st.y+P.uy*d;
    const al=Math.min(1,u/.08,(1-u)/.15);
    laneShip(P.out,zx(x),zy(y),ea,al,Z);
  }
}
