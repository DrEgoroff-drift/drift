/* ══════════════ трафик системы: чужие машины, которым тут есть дело (M309) ══════════════ */
/* Система на 79 % пуста по прибору, и пустота честная: кроме своего корабля и
   изредка баржи фактора в ней ничего не двигалось. Обжитая система должна
   ВЫГЛЯДЕТЬ обжитой до всяких цифр (DESIGN-holding §13): буксиры и челноки
   ходят между станцией и планетами. Сколько их — по ступени лестницы: в
   дикой системе ни одного, у станции один челнок, дальше по одному на каждые
   шесть рунгов, не больше четырёх. Ходят по своим дугам туда-обратно, сеяно
   от семени системы; ничего не хранится и ничего не считается вне кадра —
   положение это функция времени. Силуэт крошечный: тело, огонь сопла, один
   мигающий бортовой огонь — движение, а не мигание, поэтому огонь медленный. */
function sysTraffic(sys){
  if(sys.traffic)return sys.traffic;
  const out=[];
  const st=sys.station;
  if(!st){return sys.traffic=out;}
  const rung=(typeof rungOf==="function")?rungOf(sys.sx,sys.sy):0;
  const n=Math.min(4,1+Math.floor(rung/6));
  const r=rng((sys.seed^0x7A4F)>>>0);
  const bodies=(sys.planets||[]).filter(p=>p.type!=="gas");
  /* чьи машины (M454): семь из десяти — завода хозяина, три — соседей. В глубине
     земли соседи те же, и трафик однороден; на границе — пёстрый */
  const own=st.by||"gt",near=[];
  if(typeof chronOwnerKey==="function")
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue;const o=chronOwnerKey(sys.sx+dx,sys.sy+dy);if(o)near.push(o);}
  for(let i=0;i<n;i++){
    /* концы — ссылки на сами тела, не копии: станция и планеты ходят по орбитам,
       а трафик строится раньше, чем станция встала на место (было 0,0 у звезды) */
    const p=bodies.length?bodies[Math.floor(r()*bodies.length)]:null;
    const B=p||{get x(){return -st.x*.4;},get y(){return -st.y*.4;}};
    out.push({A:st,B,br:p?p.radius:20,
      bow:(r()-.5)*.5,                     /* изгиб дуги, доля длины */
      spd:.00009+r()*.00007,ph:r()*TAU,k:.7+r()*.6,blink:r()*TAU,
      /* mk, не by: by — это y конца дуги, и завод его затирал — челноки стояли в NaN и не рисовались */
      mk:(r()<.7||!near.length)?own:near[Math.floor(r()*near.length)]});
  }
  return sys.traffic=out;
}
function drawSysTraffic(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const T=sysTraffic(sys);if(!T.length)return;
  for(const t of T)drawShuttleArc(t,zx,zy,Z);
}
/* где челнок на дуге в момент T: мир, курс и доля пути (M309) */
function shuttleAt(t,T){
  /* туда-обратно по дуге; у концов притормаживает — стыковка, а не пролёт */
  let u=(T*t.spd+t.ph/TAU)%1;u=u<.5?u*2:2-u*2;
  const e=u*u*(3-2*u);
  /* концы читаются вживую из тел (A, B); голые ax…by — для разовой дуги «Сороки» (12v) */
  const ax=t.A?t.A.x:t.ax,ay=t.A?t.A.y:t.ay,bx=t.B?t.B.x:t.bx,by=t.B?t.B.y:t.by;
  const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1;
  const nx=-dy/L,ny=dx/L;
  const bow=Math.sin(e*Math.PI)*t.bow*L;
  /* не влетать в станцию и в планету: концы дуги отступают от тел */
  const m0=28/L,m1=(t.br+18)/L;
  const ee=m0+e*(1-m0-m1);
  const wx=ax+dx*ee+nx*bow, wy=ay+dy*ee+ny*bow;
  /* курс — по касательной к дуге */
  const de=.002, e2=Math.min(1,e+de);
  const bow2=Math.sin(e2*Math.PI)*t.bow*L;
  const tx=dx*de+nx*(bow2-bow), ty=dy*de+ny*(bow2-bow);
  const dir=((T*t.spd+t.ph/TAU)%1)<.5?1:-1;
  return {wx,wy,a:Math.atan2(ty*dir,tx*dir)};
}
/* один челнок по своей дуге; вынесено из цикла, потому что «Сорока» (12v, M342)
   добавляет свою дугу станция↔парусник, пока стоит.
   Свет — на видеокарте (G4): огонь сопла тонкой струёй в цвет завода, короткий
   гаснущий след по той же дуге (видно, куда идёт, и на общем плане), бортовой огонь —
   точкой света с ореолом, а не квадратом в пиксель. Корпус — 2D поверх. */
let SHUT_N=0,SHUT_F=-1;
function drawShuttleArc(t,zx,zy,Z){
  const s=clamp(Z,.5,1.5);
  const P=shuttleAt(t,G.t),x=zx(P.wx),y=zy(P.wy),a=P.a;
  if(x<-30||x>W+30||y<-30||y>H+30)return;
  const MF=(t.mk&&typeof makerFlame==="function")?makerFlame(t.mk):null,fc=MF?MF.col:[255,180,110];
  const pass=gpuScene();
  if(pass){
    if(SHUT_F!==GPU.frameNo){SHUT_F=GPU.frameNo;SHUT_N=0;}
    const key="gsh"+(SHUT_N++),sk=s*t.k,ca=Math.cos(a),sa=Math.sin(a);
    /* след: двенадцать точек той же дуги назад по времени */
    GTR.n=0;const N=12,pts=[];
    for(let j=0;j<N;j++){const q=j?shuttleAt(t,G.t-j*9):P;pts.push([zx(q.wx)-Math.cos(q.a)*4*sk,zy(q.wy)-Math.sin(q.a)*4*sk]);}
    const node=j=>{
      const v=j/(N-1),p=pts[Math.max(0,j-1)],q=pts[Math.min(N-1,j+1)];
      let dx=q[0]-p[0],dy=q[1]-p[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
      const hw=(1.1*sk*(1-.5*v)+.8)*1.6,al=.22*(1-v)*(1-v);
      return {x:pts[j][0],y:pts[j][1],nx:-dy*hw,ny:dx*hw,a:al,col:fc,k:.45,h:al*.4};
    };
    let A=node(0);for(let j=1;j<N;j++){const B=node(j);gtrLane(A,B);A=B;}
    gtrDraw(pass,key+"t");
    /* огонь сопла и бортовой огонь */
    GEN.n=0;
    const hot=mixc(fc,[255,255,255],.35).map(v=>v/255),nzx=x-ca*4*sk,nzy=y-sa*4*sk;
    genPush(nzx-ca*7*sk,nzy-sa*7*sk,nzx,nzy,1*sk,2.2*sk,.9,0,hot,.5);
    const bl=Math.sin(G.t*.03+t.blink);
    if(bl>.6){const k=(bl-.6)/.4;genPush(x-ca*1.4*sk-sa*2*sk,y-sa*1.4*sk+ca*2*sk,x-ca*1.4*sk-sa*2*sk,y-sa*1.4*sk+ca*2*sk,.8*sk,2.4*sk,k,1,[1,120/255,90/255],.3*k);}
    genDraw(pass,key+"g");
  }
  /* огонь сопла и грунт — завода машины (M454): белый капсульный челнок
     Компании и охристый Рассвета различаются и в точку */
  const gr=(t.mk&&typeof makerGround==="function")?rgba(mixc([35,43,54],makerGround(t.mk),.7),1):"#232b36";
  if(pass){
    /* корпус — выпечка на цвет завода, один раз; поворот и масштаб — в шейдере */
    const sk=s*t.k;
    gpuImage(pass,shuttleSprite(gr),[{x,y,w:SHUT_SW*sk,h:SHUT_SH*sk,rot:a}]);
    return;
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(s*t.k,s*t.k);
  shuttleBody(gr);
  ctx.restore();
}
function shuttleBody(gr){
  ctx.fillStyle=gr;ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=.6;
  ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2);ctx.lineTo(-4,0);ctx.lineTo(-3,2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="rgba(200,220,240,.5)";ctx.fillRect(-1,-2.2,2.5,.8);
}
/* выпечка корпуса челнока: 10×6 в мерке челнока, SHUT_PX пикселей на единицу — на экране
   челнок ~1.5 px кадра на единицу, так что выборка сжимает вдвое-втрое, без мерцания */
const SHUT_SW=10,SHUT_SH=6,SHUT_PX=4,SHUT_ART=new Map();
function shuttleSprite(gr){
  let cv=SHUT_ART.get(gr);if(cv)return cv;
  cv=document.createElement("canvas");cv.width=SHUT_SW*SHUT_PX;cv.height=SHUT_SH*SHUT_PX;
  const g=cv.getContext("2d"),c0=ctx;ctx=g;
  try{g.setTransform(SHUT_PX,0,0,SHUT_PX,cv.width/2,cv.height/2);shuttleBody(gr);}finally{ctx=c0;}
  if(SHUT_ART.size>=8)SHUT_ART.delete(SHUT_ART.keys().next().value);
  SHUT_ART.set(gr,cv);return cv;
}
