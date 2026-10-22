/* ══════════════ чужой след телом: плита со знаком и груз у неё (M631, замысел M171 — 11ag) ══════════════
   След был 2D-наклейкой на #c поверх кадра планеты (traceDraw через plnOverOld 21pj): каждый кадр
   поверхности со следом будил копию холста. Теперь это вещь мира по закону «Сцены» — гранёный
   камень того же языка, что валун залежи (21pi), и стоит там же, за тропой, на глубине вещей игры.

   Плита: выпуклый пятиугольник со сколотым верхом (силуэт из руки, как у старой рисовалки: две
   плиты рядом не близнецы), с фаской по лицу и толщиной в ладонь; грани красит свет по нормали.
   Знак — одна из двенадцати фигур TRACE_MARK, те же штрихи: прорез по лицу — тёмная борозда и
   светлая нижняя кромка на сантиметр ниже. Груз — до трёх мешков разного размера с перевязью
   у горловины, в цвет того, что в них (RES), смешанный с мешковиной: кучу глаз читает, счёт —
   строка.

   Сетка строится раз на след и посадку (ключ — след, рука, номер и земля этой посадки) и живёт,
   пока они те же. Место — t.x, как и было: действие «поднять» (21-mode-surface) меряет его же.
   Кадр сам ничего не рисует на #c. */
const TRACE_BODY={L:null,sig:"",geo:null,x:0,z:0,bx:0,err:"",n:0};
const TRACE_BODY_Z=.35;          /* за тропой, глубже вещей игры (PLN_PLANT.thingZ): плита не заслоняет человека */
const TRACE_BODY_SZ={hs:1.5,hw:.56,t:.13,mark:.3,bags:1.75};   /* м: высота, полуширина, полутолщина, полуразмер знака, где груз */

/* штрихи фигуры: перо из TRACE_MARK пишет ломаными в квадрате −1..1 (дуги и кривые — отрезками) */
function traceBodyStrokes(mi){
  const L=[];let cur=null,x0=0,y0=0;
  const pen={
    moveTo(x,y){cur=[[x,y]];L.push(cur);x0=x;y0=y;},
    lineTo(x,y){if(!cur){cur=[[x0,y0]];L.push(cur);}cur.push([x,y]);},
    arc(cx,cy,r,a0,a1){
      const n=Math.max(8,Math.ceil(Math.abs(a1-a0)/TAU*28));
      for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n,p=[cx+Math.cos(a)*r,cy+Math.sin(a)*r];if(cur)cur.push(p);else{cur=[p];L.push(cur);}}
    },
    bezierCurveTo(ax,ay,bx,by,x,y){
      const s=cur?cur[cur.length-1]:[x0,y0];if(!cur){cur=[s];L.push(cur);}
      for(let k=1;k<=12;k++){const t=k/12,u=1-t;
        cur.push([u*u*u*s[0]+3*u*u*t*ax+3*u*t*t*bx+t*t*t*x,u*u*u*s[1]+3*u*u*t*ay+3*u*t*t*by+t*t*t*y]);}
    },
    closePath(){if(cur&&cur.length>1)cur.push(cur[0].slice());}
  };
  TRACE_MARK[mi%TRACE_MARK.length].d(pen);
  return L;
}
/* грань плиты: плоская, цвет по нормали — верх светлее, щёки темнее (как у валуна залежи) */
function traceBodyFace(m,P,stone,sd,c){
  const e=plnCross(plnSub(P[1],P[0]),plnSub(P[2],P[0])),ar=plnLen(e);
  if(ar<1e-7)return;
  let n=plnMul(e,1/ar);
  /* нормаль — от сердцевины камня наружу, как у валуна залежи: обход граней тогда неважен */
  if(plnDot(n,plnSub(P[0],c))<0)n=plnMul(n,-1);
  const col=plnMul(stone,lerp(.6,1.1,plnSmooth(-.3,.9,n[1]))*(.92+.16*plnNoise(n[0]*2.3+sd,n[2]*2.3,sd+4)));
  const ids=P.map(p=>plnVert(m,p,n,col,PLN_MAT.rock,0,0,0));
  for(let k=1;k+1<ids.length;k++)plnTri(m,ids[0],ids[k],ids[k+1]);
}
/* сама плита в своих координатах: подошва в y=0, лицо к объективу (−z). Отдаёт z лица и середину знака */
function traceBodySlab(m,j,stone,sd){
  const Z=TRACE_BODY_SZ,HS=Z.hs,HW=Z.hw,T=Z.t,F=.045;   /* F — ширина фаски */
  const tl=HS*(.62+j[0]*.34),tr=HS*(.58+j[1]*.38);
  const O=[[-HW*(.86+j[2]*.3),-.18],[-HW*(.68+j[3]*.34),tl],[-HW*(.36-j[4]*.5),HS],[HW*(.5+j[4]*.42),tr],[HW*(.8+j[0]*.28),-.18]];
  let cx=0,cy=0;for(const p of O){cx+=p[0];cy+=p[1];}cx/=O.length;cy/=O.length;
  /* лицо меньше тела на фаску: к центру на F по каждой вершине */
  const I=O.map(p=>{const dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1;return [p[0]-dx/l*F,p[1]-dy/l*F];});
  const n=O.length,zf=-T,zm=-T+F*.8,zb=T;
  const front=I.map(p=>[p[0],p[1],zf]),mid=O.map(p=>[p[0],p[1],zm]),back=O.map(p=>[p[0]*.94,p[1]*.97,zb]);
  const c=[cx,cy,0];
  traceBodyFace(m,front,stone,sd,c);
  traceBodyFace(m,back,stone,sd,c);
  for(let k=0;k<n;k++){
    const a=k,b=(k+1)%n;
    traceBodyFace(m,[front[a],front[b],mid[b],mid[a]],stone,sd,c);   /* фаска */
    traceBodyFace(m,[mid[a],mid[b],back[b],back[a]],stone,sd,c);     /* щека */
  }
  return {zf,cy:Math.min(tl,tr)*.55};
}
/* прорез знака по лицу: борозда и кромка — полосы на плоскости лица, концы скруглены вылетом */
function traceBodyCarve(m,mi,zf,cy,stone){
  const s=TRACE_BODY_SZ.mark,dark=plnMul(stone,.26),lip=plnMul(plnMix3(stone,[1,1,1],.3),1.05),N=[0,0,-1];
  const strip=(a,b,w,dy,z,col)=>{
    const dx=b[0]-a[0],dy2=b[1]-a[1],l=Math.hypot(dx,dy2);if(l<1e-5)return;
    const ux=dx/l,uy=dy2/l,nx=-uy*w*.5,ny=ux*w*.5,ex=ux*w*.5,ey=uy*w*.5;
    const P=[[a[0]-ex+nx,a[1]-ey+ny+dy],[b[0]+ex+nx,b[1]+ey+ny+dy],[b[0]+ex-nx,b[1]+ey-ny+dy],[a[0]-ex-nx,a[1]-ey-ny+dy]];
    const ids=P.map(p=>plnVert(m,[p[0],p[1],z],N,col,PLN_MAT.rock,0,0,0));
    plnTri(m,ids[0],ids[1],ids[2]);plnTri(m,ids[0],ids[2],ids[3]);
  };
  for(const pl of traceBodyStrokes(mi)){
    /* фигура в −1..1 с y вниз (перо канвы) → метры лица с y вверх */
    const Q=pl.map(p=>[p[0]*s,cy-p[1]*s]);
    for(let k=0;k+1<Q.length;k++)strip(Q[k],Q[k+1],.034,-.014,zf-.003,lip);
    for(let k=0;k+1<Q.length;k++)strip(Q[k],Q[k+1],.04,0,zf-.006,dark);
  }
}
/* мешок: низ плоский — стоит на земле, бока обвисают, горловина стянута и торчит хвостом */
function traceBodyBag(m,rr,col,sd,yaw){
  const rope=plnMul(col,.42),neck=plnMul(col,.8);
  const skin=(u,p)=>plnMul(col,lerp(.62,1.06,plnSmooth(-.8,.7,u[1]))*(.93+.14*plnNoise(p[0]*9+sd,p[1]*9,sd+1)));
  plnBlob(m,{c:[0,rr*.86,0],r:[rr,rr*1.08,rr*.88],sub:2,bump:.22,bumpF:2.6,box:.85,seed:sd,yaw,cut:-rr*.8,col:skin,mat:PLN_MAT.rock,glow:0});
  plnBlob(m,{c:[0,rr*1.86,0],r:[rr*.3,rr*.1,rr*.3],sub:1,seed:sd+2,col:rope,mat:PLN_MAT.rock,glow:0});
  plnBlob(m,{c:[rr*.05,rr*2.08,0],r:[rr*.17,rr*.3,rr*.16],sub:1,bump:.2,seed:sd+3,lean:-.35,col:neck,mat:PLN_MAT.rock,glow:0});
}
/* сетка следа в мире этой посадки */
function traceBodyMesh(L,t,x,z){
  const m=plnMesh(4096),loc=plnMesh(4096),P=PLN_PAL;
  if(!t.j){const r=rng(traceHashOf((t.h||"")+"|"+(t.i||"")+"|плита"));t.j=[r(),r(),r(),r(),r()];}
  const j=t.j,sd=traceHashOf((t.h||"")+"|тело")%997,r=rng(sd+11);
  const stone=plnMix3(P.rockWarm,P.rockCool,.3+j[2]*.4);
  const S=traceBodySlab(loc,j,stone,sd);
  traceBodyCarve(loc,t.m|0,S.zf,S.cy,stone);
  plnMeshAdd(m,loc,[x,plnLandRibAt(L,x,z)-.02,z],(j[3]-.5)*.5,1);
  /* груз рядом, к тропе: куча, а не шеренга */
  const n=Math.max(1,Math.min(TRACE_MAX_UNITS,t.n|0)),bags=Math.min(3,n);
  const ore=plnHex((RES[t.r]&&RES[t.r].col)||"#b4b4b4"),col=plnMul(plnMix3(ore,[.66,.57,.43],.5),1.08);
  const bx=x+TRACE_BODY_SZ.bags;
  for(let i=0;i<bags;i++){
    const a=bags>1?(i/(bags-1)-.5)*2:0,rr=(.4-Math.abs(a)*.09)*(.9+r()*.2);
    const px=bx+a*(.3+bags*.14),pz=z-.45+Math.abs(a)*.18+(r()-.5)*.1;
    const b=plnMesh(1024);
    traceBodyBag(b,rr,col,sd+i*7,(r()-.5)*1.2);
    plnMeshAdd(m,b,[px,plnLandRibAt(L,px,pz)-.03,pz],0,1);
  }
  return {m,bx};
}
function traceBodyDrop(){
  const B=TRACE_BODY;
  if(B.geo)plnGeoFree(B.geo);
  B.geo=null;B.L=null;B.sig="";
}
/* тело следа в кадр: вещи игры (21pi) кладут своё, след — своё следом за ними */
const TRACE_BODY_THINGS=plnThingsFrame;
plnThingsFrame=function(L,F,S,p,ex,V){
  TRACE_BODY_THINGS.apply(this,arguments);
  const B=TRACE_BODY,t=S&&S.tr?traceHere():null;
  if(!t){if(B.geo)traceBodyDrop();return;}
  try{
    if(t.x==null)t.x=traceSpotX(S.tr,t);
    const x=t.x/PLN_M,z=PLN_PLANT.thingZ+TRACE_BODY_Z,sig=t.key+"|"+t.h+"|"+(t.i||"")+"|"+t.m+"|"+t.r+"|"+(t.n|0)+"|"+x.toFixed(2);
    if(B.L!==L||B.sig!==sig||!B.geo||B.geo.gen!==PLN_GPU.gen){
      traceBodyDrop();
      const R=traceBodyMesh(L,t,x,z);
      B.geo=plnGeo(R.m);B.L=L;B.sig=sig;B.x=x;B.z=z;B.bx=R.bx;B.n++;
    }
    if(Math.abs(B.x-ex)>V.hw*(1+B.z/V.D)+4)return;
    F.batches.push({geo:B.geo,inst:null,kind:PLN_KIND.body,to:PLN_TO.all});
    const b=F.blobs;let n=b[0]|0;
    if(n<63){b.set([B.x+.1,B.z,1,.5],4+n*4);n++;b.set([B.bx,B.z-.3,.8,.45],4+n*4);n++;b[0]=n;}
  }catch(e){B.err=String((e&&e.stack)||e).slice(0,400);traceBodyDrop();if(typeof plnLog==="function")plnLog("след: "+B.err);}
};
/* у следа объектив скользит к вещи, как у залежи: подойти и поднять */
const TRACE_BODY_AT=plnAtThing;
plnAtThing=function(S,p){
  const r=TRACE_BODY_AT.apply(this,arguments);
  if(r||!S||S.on===false||S.jetOn||(S.walkAmp||0)>.25)return r;
  const t=traceHere();
  return t&&t.x!=null&&Math.abs(t.x-S.x)<32?1:r;
};
