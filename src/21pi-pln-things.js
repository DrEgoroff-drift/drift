/* ══════════════ планета: вещи игры — залежи, вход в пещеру, устье шахты (M611) ══════════════
   То, с чем игрок на планете работает, встаёт в новый кадр телом. Залежь —
   сразу за тропой, вход в пещеру и устье шахты — в своей поляне за ней. Места
   и остатки — из состояния игры (S.deposits, S.cave, mineSpotX), как у старой
   рисовалки; здесь только вид.

   Залежь — тело на породу (depKind) и на ресурс: цвет руды — цвет ресурса
   (RES), его несёт сама сетка. В мир её ставит запись: место, поворот и размер
   по остатку — выработанная оседает. Вход в пещеру и устье шахты — цельные
   сетки в мире: стоят на земле этой посадки, узел к узлу, и утоптанный грунт
   вокруг них к краю сходит в цвет самой земли.

   Это заготовки первого этапа (DESIGN-planet-engine §2.10): свои проходы —
   M623, M624, M630 и M631. */
const PLN_THINGS={caveZ:2.6,mineZ:2.9,  /* на какой глубине стоит плоскость входа и ствол */
  caveQ:1.4,                            /* мерка входа: проём в свету — три метра на два с лишним, человек входит не пригибаясь */
  mineQ:1.45,                           /* мерка копра: в кадре с деревьями в десять метров станок в рост человека терялся */
  cap:32};                              /* записей залежей */

function plnThingSeed(s){
  let h=7;
  for(let k=0;k<s.length;k++)h=(h*31+s.charCodeAt(k))|0;
  return h>>>0;
}
/* залежи стоят не в шеренгу: у каждой своя глубина за тропой */
function plnThingDepZ(d){return PLN_PLANT.thingZ+((hashi(d.i|0,Math.round(d.x),0xD3)>>>9)&255)/255*.8;}
/* земля ленты в точке: высота и нормаль */
function plnThingGround(L,x,z){
  const e=.3;
  return {h:plnLandRibAt(L,x,z),
    n:plnNorm([plnLandRibAt(L,x-e,z)-plnLandRibAt(L,x+e,z),2*e,plnLandRibAt(L,x,z-e)-plnLandRibAt(L,x,z+e)])};
}
/* гранёный кристалл от корня к острию */
function plnThingPrism(m,a,b,rad,sides,ca,cb,glow,flat,mat,x){
  const d=plnSub(b,a);
  plnTube(m,{path:[a,plnAdd(a,plnMul(d,.5)),plnAdd(a,plnMul(d,.8)),b],rad:t=>rad*(t<.2?.82:(t<.5?1:(t<.9?.8:.04))),sides,flat,
    col:t=>plnMix3(ca,cb,t),mat:mat==null?PLN_MAT.rock:mat,glow,x});
}
/* точка на шкуре надутого тела (те же числа, что у plnBlob) по направлению u, вынесенная наружу в k раз */
function plnThingSkin(o,u,k){
  const e=o.box||1,r=o.r,sd=o.seed||0,bf=o.bumpF||1.6;
  const q=e!==1?[Math.sign(u[0])*Math.pow(Math.abs(u[0]),e),Math.sign(u[1])*Math.pow(Math.abs(u[1]),e),Math.sign(u[2])*Math.pow(Math.abs(u[2]),e)]:u;
  const b=(o.bump?1+o.bump*(plnNoise(u[0]*bf+sd*.37,u[1]*bf+u[2]*bf*.7,sd)+plnNoise(u[2]*bf-sd*.11,u[1]*bf*.8+3.1,sd+5))*.5:1)*k;
  let l=[q[0]*r[0]*b,q[1]*r[1]*b,q[2]*r[2]*b];
  if(o.cut!=null&&l[1]<o.cut)l[1]=o.cut+(l[1]-o.cut)*.12;
  if(o.pitch)l=plnRotX(l,o.pitch);
  if(o.lean)l=plnRotZ(l,o.lean);
  if(o.yaw)l=plnRotY(l,o.yaw);
  return plnAdd(l,o.c);
}
/* Утоптанный грунт вокруг вещи: лежит на земле и к краю сходит в её цвет — шва не видно.
   rx, rz — полуоси, a0…a1 — сектор, hole — доля радиуса, с которой пятно начинается,
   dip — на сколько его середина ниже земли, shade — во сколько раз середина темнее края:
   у входа и у ствола грунт лежит в их тени */
function plnThingApron(m,L,cx,cz,rx,rz,a0,a1,hole,seed,dip,shade){
  const P=PLN_PAL,NA=Math.max(10,Math.round((a1-a0)/TAU*44)),NR=5,ids=[];
  for(let j=0;j<=NR;j++)for(let i=0;i<=NA;i++){
    const a=lerp(a0,a1,i/NA),t=j/NR,w=1+.25*plnNoise(Math.cos(a)*1.7+seed,Math.sin(a)*1.7,seed)*t,k=lerp(hole,1,t)*w;
    const x=cx+Math.cos(a)*rx*k,z=cz+Math.sin(a)*rz*k,g=plnThingGround(L,x,z),sh=shade==null?1:lerp(shade,1,plnSmooth(0,.7,t));
    const soil=plnMix3(P.soilDark,P.soil,plnSmooth(0,.7,t+plnNoise(x*1.3,z*1.3,seed+3)*.3));
    ids.push(plnVert(m,[x,g.h+.02-(dip||0)*(1-t),z],g.n,plnMul(plnMix3(soil,plnLandCol(L,x,z,g.h,g.n,0),plnSmooth(.4,1,t)),sh),
      PLN_MAT.ground,0,0,lerp(.7,1,t)*lerp(sh,1,.5)));
  }
  for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){
    const o=j*(NA+1)+i;
    plnQuad(m,ids[o],ids[o+1],ids[o+NA+2],ids[o+NA+1]);
  }
  return ids;
}

/* валун залежи: гранёный камень мира — икосфера, срезанная плоскостями, с плоской макушкой,
   на которой стоит руда; грани красятся по тому, куда смотрят (верх светлее), свет делит их
   дальше сам (§2.34). Подошва на .15 м ниже земли. Отдаёт высоту макушки */
function plnThingBoulder(m,r,stone,sd,R){
  const g=plnIco(1),cuts=[[[0,1,0],.5]],V=[],M=PLN_MAT.rock,mid=[0,R[1]*.4,0];
  for(let k=0;k<7;k++)cuts.push([plnNorm([r()*2-1,r()*1.2-.4,r()*2-1]),.5+r()*.35]);
  for(const u of g.p){
    let q=plnMul(u,1+.15*plnNoise(u[0]*1.7+sd,u[1]*1.7+u[2],sd));
    for(const [n,d] of cuts){const e=plnDot(q,n)-d;if(e>0)q=plnSub(q,plnMul(n,e));}
    V.push([q[0]*R[0]*lerp(1.1,.85,clamp(q[1]*.5+.5,0,1)),(q[1]+1)*.5*R[1]-.15,q[2]*R[2]]);
  }
  for(const [a,b,c] of g.f){
    const e=plnCross(plnSub(V[b],V[a]),plnSub(V[c],V[a])),ar=plnLen(e);
    if(ar<1e-6)continue;
    let n=plnMul(e,1/ar);
    if(plnDot(n,plnSub(V[a],mid))<0)n=plnMul(n,-1);
    const col=plnMul(stone,lerp(.62,1.08,plnSmooth(-.3,.9,n[1]))*(.92+.16*plnNoise(n[0]*2.3+sd,n[2]*2.3,sd+4)));
    plnTri(m,plnVert(m,V[a],n,col,M,0,0,0),plnVert(m,V[b],n,col,M,0,0,0),plnVert(m,V[c],n,col,M,0,0,0));
  }
  return .75*R[1]-.15;
}
/* ── залежь ──
   Выход породы, лицом к объективу (−z): гранёный валун камня мира ломает дёрн, на его макушке
   руда одной из семи форм старой рисовалки, у подошвы — выброшенные комья. Тёмный блин
   «гнезда» читался подставкой фигурки, плоская плита — блюдом (M624). Отвал выбуренного — своя
   сетка (plnThingSpoil): растёт с выработкой, запись масштабирует */
function plnThingDeposit(res,seed){
  const m0=plnMesh(4096),m=plnMesh(4096),r=rng(seed),P=PLN_PAL,R=PLN_MAT.rock,kind=depKind(res),sd=seed%97;
  const ore=plnHex((RES[res]||RES.iron).col),hi=plnMix3(ore,[1,1,1],.4),lo=plnMul(ore,.5);
  const stone=plnMix3(P.rockWarm,P.rockCool,.3+r()*.4),dark=plnMul(stone,.4);
  const top=plnThingBoulder(m0,r,stone,sd,[1.15,1.05,.85]);
  for(let k=0;k<8;k++){
    const a=r()*TAU,dd=1.15+r()*.4,rr=.07+r()*.08;
    plnBlob(m0,{c:[Math.cos(a)*dd,rr*.3,Math.sin(a)*dd*.72],r:[rr*1.3,rr*.7,rr],sub:1,box:.7,bump:.3,seed:sd+30+k,yaw:r()*TAU,
      col:plnMix3(P.soilDark,P.mud,.35+r()*.3),mat:PLN_MAT.ground,glow:0});
  }
  const pebble=(n,c)=>{
    for(let k=0;k<n;k++){
      const a=r()*TAU,d=.55+r()*.5,rr=.1+r()*.12;
      plnBlob(m,{c:[Math.cos(a)*d,rr*.4,Math.sin(a)*d*.75],r:[rr*1.2,rr*.8,rr],sub:1,bump:.4,box:.75,seed:sd+k,yaw:r()*TAU,cut:-.4*rr,col:c,mat:R});
    }
  };
  if(kind==="crystal"){
    /* друза: одна большая призма и малые вокруг, врозь */
    const n=3+(r()*3|0);
    for(let k=0;k<n;k++){
      const a=k?r()*TAU:0,d=k?.26+r()*.3:0,h=k?.42+r()*.5:1.05+r()*.25,rad=k?.11+r()*.07:.19,lean=k?.25+r()*.45:(r()-.5)*.3;
      const b=[Math.cos(a)*d,.02,Math.sin(a)*d*.8];
      plnThingPrism(m,b,[b[0]+Math.cos(a)*Math.sin(lean)*h,h*Math.cos(lean),b[2]+Math.sin(a)*Math.sin(lean)*h*.8],rad,6,lo,hi,.22);
    }
    pebble(3,dark);
  }else if(kind==="ice"){
    /* торос: три глыбы внаклон, сколотые в грань, — сверху снег, на сколе чистый лёд.
       Круглый бледный валун льдом не читался */
    const ice=(u,p,n)=>plnMix3(plnMix3(lo,ore,plnSmooth(-.5,.5,u[1])),[.95,.97,1],plnSmooth(.5,.85,n[1]));
    plnBlob(m,{c:[-.1,.36,.05],r:[.64,.66,.5],sub:1,box:.4,bump:.18,seed:sd,cut:-.32,yaw:.5+(r()-.5)*.6,lean:.22,col:ice,mat:R,glow:.1});
    plnBlob(m,{c:[.54,.25,-.2],r:[.46,.44,.4],sub:1,box:.4,bump:.18,seed:sd+1,cut:-.2,yaw:-.4,lean:-.3,pitch:.15,col:ice,mat:R,glow:.14});
    plnBlob(m,{c:[-.64,.17,-.3],r:[.3,.27,.28],sub:1,box:.4,seed:sd+2,cut:-.12,yaw:.9,lean:.35,col:ice,mat:R,glow:.14});
    for(let k=0;k<3;k++){
      const a=Math.PI+r()*Math.PI,d=.7+r()*.35,rr=.1+r()*.1;
      plnBlob(m,{c:[Math.cos(a)*d,rr*.5,Math.sin(a)*d*.7],r:[rr,rr*.8,rr],sub:0,box:.6,yaw:r()*TAU,col:hi,mat:R,glow:.1});
    }
  }else if(kind==="shards"){
    /* осколки веером: пластины в ладонь шириной и выше колена — иглы в палец в траве пропадали */
    const n=6+(r()*3|0),tip=plnMix3(hi,[1,1,1],.35),root=plnMix3(lo,ore,.5);
    for(let k=0;k<n;k++){
      const a=r()*TAU,lean=k?.2+r()*.7:.1,h=k?.5+r()*.6:1.3,rad=k?.1+r()*.07:.17,d=k?.18+r()*.34:0;
      const b=[Math.cos(a)*d,.02,Math.sin(a)*d*.8];
      plnThingPrism(m,b,[b[0]+Math.cos(a)*Math.sin(lean)*h,h*Math.cos(lean),b[2]+Math.sin(a)*Math.sin(lean)*h*.8],rad,4,root,tip,.16,.5);
    }
    pebble(3,dark);
  }else if(kind==="crust"){
    /* корка: низкие шапки с порами */
    for(let k=0;k<5;k++){
      const a=r()*TAU,d=k?.3+r()*.5:0,rr=k?.26+r()*.2:.52,c=[Math.cos(a)*d,.04,Math.sin(a)*d*.75];
      plnBlob(m,{c,r:[rr,rr*.85,rr],sub:2,bump:.25,bumpF:2.2,seed:sd+k,cut:-.12*rr,yaw:r()*TAU,
        col:(u,p)=>plnMul(plnMix3(lo,ore,plnSmooth(-.2,.7,u[1])),plnNoise(p[0]*9,p[2]*9+p[1]*5,sd+9)>.35?.45:1),mat:PLN_MAT.bark});
    }
  }else if(kind==="vein"){
    /* тёмный серый камень, по нему косые жилы металла: лентами по самой шкуре камня, в блеск.
       Жила цветом вершин на таком камне рассыпалась в точки — она у́же шага сетки */
    const ang=.6+r()*.5,nb=[Math.cos(ang),Math.sin(ang),0],e1=[-nb[1],nb[0],0],pure=plnHerbSoft(ore,-.7),pale=plnMix3(pure,[1,1,1],.3);
    const B={c:[0,.3,0],r:[.9,.62,.7],sub:3,bump:.3,bumpF:1.25,box:.85,seed:sd,cut:-.25,yaw:(r()-.5)*.6};
    plnBlob(m,Object.assign({col:u=>plnMul(stone,lerp(.45,.8,plnSmooth(-.6,.6,u[1]))),mat:R,glow:.02},B));
    for(let k=0;k<3;k++){
      const o=(k-1)*.44+(r()-.5)*.2,rho=Math.sqrt(1-o*o),w=.06+r()*.08,N=14,ids=[];
      for(let s=0;s<=N;s++){
        const f=lerp(.22,Math.PI-.22,s/N),u=plnNorm([o*nb[0]+rho*Math.cos(f)*e1[0],o*nb[1]+rho*Math.cos(f)*e1[1],-rho*Math.sin(f)]);
        const ac=plnNorm(plnSub(nb,plnMul(u,plnDot(nb,u)))),ww=w*Math.pow(Math.sin(Math.PI*s/N),.6);
        const p0=plnThingSkin(B,u,1),nn=plnNorm(plnSub(plnThingSkin(B,u,1.1),p0));
        const side=plnNorm(plnSub(plnThingSkin(B,plnNorm(plnAdd(u,plnMul(ac,.05))),1),p0)),c=plnMix3(pure,pale,.5+.5*Math.sin(s*1.7+k*2.1));
        for(const sg of [-1,0,1]){
          ids.push(plnVert(m,plnThingSkin(B,plnNorm(plnAdd(u,plnMul(ac,sg*ww))),sg?1.012:1.045),plnNorm(plnAdd(nn,plnMul(side,sg*.5))),
            c,PLN_MAT.man,0,.6,.3));
        }
      }
      for(let s=0;s<N;s++)for(let j=0;j<2;j++){
        const a=s*3+j;
        plnQuad(m,ids[a],ids[a+1],ids[a+4],ids[a+3]);
      }
    }
    pebble(2,dark);
  }else if(kind==="seep"){
    /* тёмный камень, по нему тёплые потёки: светятся сами */
    plnBlob(m,{c:[0,.3,0],r:[.88,.62,.7],sub:2,bump:.25,bumpF:1.3,box:.8,seed:sd,cut:-.25,yaw:(r()-.5)*.6,
      col:u=>plnMul(dark,lerp(.7,1.1,plnSmooth(-.6,.6,u[1]))),mat:R});
    for(let k=0;k<5;k++){
      const a=Math.PI*(1.1+.8*(k+r()*.6)/5),e0=.9+r()*.4,path=[];
      for(let s=0;s<=4;s++){
        const e=lerp(e0,.05,s/4),q=1.07+.03*s;
        path.push([Math.cos(a)*Math.cos(e)*.88*q,.3+Math.sin(e)*.62*q,Math.sin(a)*Math.cos(e)*.7*q]);
      }
      plnTube(m,{path,rad:t=>lerp(.022,.05,t*t),sides:5,col:ore,mat:PLN_MAT.glow,glow:1.5+r()*.8});
    }
    plnBlob(m,{c:[.1,.03,-.7],r:[.34,.03,.2],sub:1,col:ore,mat:PLN_MAT.glow,glow:1.1});
  }else{
    /* плитняк: плиты стопой, по ним ржавчина */
    const n=3+(r()*2|0);
    for(let k=0;k<n;k++){
      const w=.88-k*.14+r()*.1;
      plnBlob(m,{c:[(r()-.5)*.35,.1+k*.17,(r()-.5)*.25],r:[w,.15+r()*.05,w*.72],sub:2,box:.45,bump:.18,bumpF:2,seed:sd+k,
        yaw:r()*TAU,lean:(r()-.5)*.45,pitch:(r()-.5)*.3,
        col:(u,p)=>plnMix3(plnMul(stone,.55),ore,plnSmooth(-.1,.5,plnNoise(p[0]*2.3+k,p[2]*2.3+p[1]*3,sd+3))),mat:R,glow:.03});
    }
    pebble(3,plnMix3(dark,lo,.5));
  }
  plnMeshAdd(m0,plnMeshDone(m),[0,top-.02,0],0,1.2);   /* руда стоит на макушке валуна */
  return m0;
}
/* отвал выбуренного: горка крошки у ног залежи, к тропе, в цвет земли с руды; свежая залежь
   его не имеет — запись ставит масштаб по выработке */
function plnThingSpoil(res,seed){
  const m=plnMesh(512),P=PLN_PAL,ore=plnHex((RES[res]||RES.iron).col),sd=seed%89;
  const col=(u,p)=>plnNoise(p[0]*7+sd,p[2]*7,sd+2)>.25?plnMix3(ore,P.soilDark,.35):plnMix3(P.soil,P.soilDark,.5+.5*plnNoise(p[0]*3,p[2]*3,sd+4));
  plnBlob(m,{c:[.15,0,-.95],r:[.55,.24,.38],sub:2,bump:.3,bumpF:2,seed:sd+1,cut:-.02,col,mat:PLN_MAT.ground,glow:0});
  plnBlob(m,{c:[-.35,0,-.8],r:[.3,.14,.24],sub:1,bump:.3,seed:sd+2,cut:-.02,col,mat:PLN_MAT.ground,glow:0});
  return m;
}

/* ── вход в пещеру ──
   Скальный холм с дёрном на макушке; вход — тёмный проём в раме из глыб: глыбы идут по своду,
   за ними второй ряд, темнее, за ним темнота. xc — где он, в метрах */
function plnThingCaveMesh(L,xc){
  const m=plnMesh(1<<14),s0=hashi(Math.round(xc*PLN_M),7,0xCA7E),r=rng(s0),P=PLN_PAL,R=PLN_MAT.rock,zf=PLN_THINGS.caveZ,q=PLN_THINGS.caveQ;
  const gy=(x,z)=>plnLandRibAt(L,xc+x,z),g0=gy(0,zf),stone=plnMix3(P.rockWarm,P.rockCool,.3+r()*.4);
  const skin=(sd,k,turf)=>(u,p,n)=>{
    const s=lerp(.5,1,plnSmooth(-.6,.6,u[1]+plnNoise(p[0]*.6,p[1]*1.4,sd)*.5))*k;
    const c=plnMix3(plnMul(stone,s),P.moss,plnSmooth(.55,.9,n[1])*plnSmooth(-.2,.3,plnNoise(p[0]*.5+3,p[2]*.5,sd+2))*.7);
    return turf?plnMix3(c,plnMix3(P.grassMid,P.grassLit,.3),plnSmooth(.72,.93,n[1])*.85):c;
  };
  const rock=(c,rr,sub,sd,bump,turf)=>plnBlob(m,{c:[xc+c[0],gy(c[0],c[2])+c[1],c[2]],r:rr,sub,bump,bumpF:1.2,box:.85,seed:sd,
    yaw:(r()-.5)*.8,lean:(r()-.5)*.25,cut:-.6*rr[1],col:skin(sd,1,turf),mat:R});
  rock([.3*q,1.0*q,zf+4.3*q],[3.8*q,3.0*q,2.6*q],3,11,.3,true);
  rock([-2.8*q,.45*q,zf+2.9*q],[2.4*q,1.7*q,1.9*q],2,12,.4,true);
  rock([3.0*q,.35*q,zf+3.1*q],[2.2*q,1.5*q,1.8*q],2,13,.4,true);
  /* свод: s от правой пяты к левой */
  const arch=s=>{const a=Math.PI*s;return [(1.5*Math.cos(a)+.16*Math.sin(a))*q,2.1*q*Math.pow(Math.sin(a),.8),a];};
  for(let k=0;k<=8;k++){
    const e=arch(k/8),a=e[2],up=Math.sin(a),out=plnNorm([Math.cos(a)*2.1,up*1.5,0]),rr=(.8+r()*.28+up*.22)*q;
    const cx=e[0]+out[0]*rr*.78,cy=e[1]+out[1]*rr*.78;
    plnBlob(m,{c:[xc+cx,lerp(gy(cx,zf),g0,up)+cy,zf+(r()-.5)*.3*q],r:[rr,rr*(.78+r()*.3),rr*.95],sub:2,bump:.42,bumpF:1.3,box:.72,seed:20+k,
      yaw:r()*TAU,lean:(r()-.5)*.5,col:skin(20+k,1,up>.8),mat:R});
  }
  for(let k=0;k<=6;k++){
    const e=arch(k/6),a=e[2],out=plnNorm([Math.cos(a)*2.1,Math.sin(a)*1.5,0]),rr=(.55+r()*.15)*q;
    plnBlob(m,{c:[xc+e[0]*.96+out[0]*rr*.5,g0+e[1]*.96+out[1]*rr*.5,zf+.42*q],r:[rr,rr,rr*.6],sub:1,bump:.4,box:.75,seed:40+k,yaw:r()*TAU,
      col:skin(40+k,.3,false),mat:R});
  }
  /* Темнота: лист за вторым рядом, шире проёма — его края прячет рама. Она не светится и воздуха
     почти не берёт (в запасе — доля пустоты): дымка длинного объектива красила её в синее */
  const G5=PLN_MAT.glow,zv=zf+.62*q,dark=[.004,.004,.006],void0=.8;
  {
    const N=14,pts=[[2.05*q,-1.5]];
    for(let k=0;k<=N;k++){const e=arch(k/N);pts.push([e[0]*1.35,e[1]*1.25]);}
    pts.push([-2.05*q,-1.5]);
    const c0=plnVert(m,[xc,g0+.8,zv],[0,0,-1],dark,G5,0,1,void0),ids=pts.map(e=>plnVert(m,[xc+e[0],g0+e[1],zv],[0,0,-1],dark,G5,0,1,void0));
    for(let k=0;k<ids.length;k++)plnTri(m,c0,ids[k],ids[(k+1)%ids.length]);
  }
  /* порог: утоптанный грунт от тропы к проёму; за порогом пол лежит на земле полки, узел к узлу,
     и уходит в темноту — своего света у него нет, только тон */
  plnThingApron(m,L,xc,zf+.1,2.4*q,2.1*q,Math.PI,TAU,0,s0%53,0,.16);
  {
    const NX=8,NZ=4,ids=[],c0=plnMul(P.soilDark,.09);
    for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){
      const x=lerp(-1.7,1.7,i/NX)*q,t=j/NZ,z=lerp(zf-.05,zv+.05,t);
      ids.push(plnVert(m,[xc+x,gy(x,z)+.035,z],[0,1,0],plnMix3(c0,dark,plnSmooth(0,.8,t)),G5,0,1,lerp(.2,void0,plnSmooth(0,.8,t))));
    }
    for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
      const o=j*(NX+1)+i;
      plnQuad(m,ids[o],ids[o+1],ids[o+NX+2],ids[o+NX+1]);
    }
  }
  /* осыпь по сторонам от порога */
  for(let k=0;k<7;k++){
    const sx=(k&1?1:-1)*(1.8+r()*2.3)*q,sz=zf-.2-r()*1.5*q,rr=(.16+r()*.26)*q;
    plnBlob(m,{c:[xc+sx,gy(sx,sz)+rr*.35,sz],r:[rr*1.2,rr*.8,rr],sub:1,bump:.45,box:.75,seed:60+k,yaw:r()*TAU,cut:-.4*rr,col:skin(60+k,1,false),mat:R});
  }
  return m;
}

/* ── устье шахты ──
   Ствол в земле, вал и отвал рядом, над стволом копёр на четырёх ногах со шкивом. Копёр — вещь
   людей: серый металл и оранжевая балка. Возвращает сетку и место лампы */
function plnThingMineMesh(L,xm){
  const m=plnMesh(1<<13),s0=hashi(Math.round(xm*PLN_M),11,0x5AF7),r=rng(s0),P=PLN_PAL,M=PLN_MAT.man,G5=PLN_MAT.glow,zf=PLN_THINGS.mineZ;
  const gy=(x,z)=>plnLandRibAt(L,xm+x,z),g0=gy(0,zf);
  const metal=plnHex("#7d828a"),dark=plnHex("#25272c"),accent=plnHex("#ee7326");
  const q=PLN_THINGS.mineQ,NA=44,ring=plnThingApron(m,L,xm,zf,3*q,2.3*q,0,TAU,.36,s0%53,0,.45);
  /* стенка ствола и дно */
  {
    const c=[.004,.004,.006],c0=plnVert(m,[xm,g0-.9,zf],[0,1,0],c,G5,0,1,.8),lo=[];
    for(let i=0;i<=NA;i++){
      const a=i/NA*TAU;
      lo.push(plnVert(m,[xm+Math.cos(a)*.95*q,g0-.9,zf+Math.sin(a)*.72*q],[-Math.cos(a),.3,-Math.sin(a)],plnMul(P.soilDark,.06),PLN_MAT.ground,0,0,.2));
    }
    for(let i=0;i<NA;i++){
      plnQuad(m,ring[i],ring[i+1],lo[i+1],lo[i]);
      plnTri(m,c0,lo[i],lo[i+1]);
    }
  }
  /* вал вокруг ствола */
  {
    const path=[];
    for(let i=0;i<=24;i++){
      const a=i/24*TAU,x=Math.cos(a)*1.2*q,z=Math.sin(a)*.93*q;
      path.push([xm+x,gy(x,zf+z)+.03,zf+z]);
    }
    plnTube(m,{path,rad:.2,sides:6,flat:.55,up:[0,1,0],col:(t,a)=>plnMix3(P.soilDark,P.soil,.5+.5*Math.cos(a)),mat:PLN_MAT.ground,glow:0,x:.9});
  }
  /* отвал */
  const hx=2.35*q;
  plnBlob(m,{c:[xm+hx,gy(hx,zf+.3)+.12,zf+.3],r:[1.5,.8,1.2],sub:2,bump:.35,bumpF:1.6,seed:s0%31,cut:-.2,
    col:(u,p)=>plnMix3(P.soilDark,P.soil,plnSmooth(-.4,.5,u[1]+plnNoise(p[0]*1.5,p[2]*1.5,7)*.4)),mat:PLN_MAT.ground,glow:0,x:1});
  for(let k=0;k<6;k++){
    const a=r()*TAU,d=.3+r()*1.1,rr=.12+r()*.16,x=hx+Math.cos(a)*d,z=zf+.3+Math.sin(a)*d*.75;
    plnBlob(m,{c:[xm+x,gy(x,z)+.12+.6*(1-d/1.5)+rr*.3,z],r:[rr*1.2,rr*.8,rr],sub:1,bump:.4,box:.75,seed:k,yaw:r()*TAU,
      col:plnMul(plnMix3(P.rockWarm,P.rockCool,r()),.8),mat:PLN_MAT.rock});
  }
  /* копёр */
  const top=g0+2.15*q,tube=(path,rad,col,x,sides)=>plnTube(m,{path,rad:rad*q,sides:sides||6,col,mat:M,x:x==null?.4:x,cap:true});
  for(const sz of [-.85,.85])for(const sx of [-1,1]){
    const fx=sx*1.05*q,fz=zf+sz*q,fy=gy(fx,fz);
    tube([[xm+fx,fy-.05,fz],[xm+sx*.36*q,top,zf+sz*.8*q]],.055,metal);
    plnBlob(m,{c:[xm+fx,fy+.03,fz],r:[.17*q,.05*q,.17*q],sub:1,col:dark,mat:M,x:.2});
  }
  for(const sz of [-1,1]){
    tube([[xm-.7*q,g0+1.1*q,zf+sz*.825*q],[xm+.7*q,g0+1.1*q,zf+sz*.825*q]],.035,dark);
    tube([[xm-.44*q,top,zf+sz*.68*q],[xm+.44*q,top,zf+sz*.68*q]],.055,metal);
  }
  for(const sx of [-1,1])tube([[xm+sx*.36*q,top,zf-.78*q],[xm+sx*.36*q,top,zf+.78*q]],.068,accent,.3);
  tube([[xm-.36*q,top-.03*q,zf],[xm+.36*q,top-.03*q,zf]],.03,dark);
  tube([[xm,top-.03*q,zf],[xm,top-.27*q,zf]],.025,dark);
  tube([[xm,top-.27*q,zf-.05*q],[xm,top-.27*q,zf+.05*q]],.25,dark,.5,16);
  tube([[xm,top-.27*q,zf-.07*q],[xm,top-.27*q,zf+.07*q]],.07,accent,.3,10);
  tube([[xm+.24*q,top-.27*q,zf],[xm+.2*q,g0-.8,zf]],.018,dark,.2,5);
  const lamp=[xm+.36*q,top-.17*q,zf-.78*q];
  plnBlob(m,{c:lamp,r:[.07,.07,.07],sub:1,col:[1,.7,.35],mat:G5,glow:4});
  return {m,lamp};
}

/* ── то, что стоит на этой посадке ── */
function plnThingsDeposits(Q,L,S){
  const list=S.deposits||[],M=PLN_M;
  let sig=list.length;
  for(const d of list)sig=(sig*31+((d.left|0)+1)*7+(d.i|0)*13+Math.round(d.x))|0;
  if(sig===Q.sig&&Q.inst)return;
  Q.sig=sig;
  const by={};
  for(const d of list){
    if(!(d.left>0)||!isFinite(d.x))continue;
    const key=d.res+"."+((d.i|0)&1);
    (by[key]=by[key]||[]).push(d);
  }
  Q.parts.length=0;Q.blots.length=0;
  let n=0;
  for(const key in by){
    if(!Q.geo[key]){
      const res=key.slice(0,key.lastIndexOf(".")),sd=plnThingSeed(key);
      Q.geo[key]=plnGeo(plnThingDeposit(res,sd));Q.geo[key+"~"]=plnGeo(plnThingSpoil(res,sd));
    }
    const first=n;
    for(const d of by[key]){
      if(n>=PLN_THINGS.cap)break;
      const x=d.x/M,z=plnThingDepZ(d),k=clamp(.45+Math.min(1,(d.left||1)/9)*.55,0,1),hh=hashi(d.i|0,Math.round(d.x),0xD4);
      const pos=[x,plnLandRibAt(L,x,z)-.02,z],yaw=(((hh>>>4)&1023)/1023-.5)*1.3;
      plnRec(Q.a,n,pos,k,yaw,1,n+1);
      /* отвал растёт по мере выработки: свежая залежь — без него */
      plnRec(Q.as,n,pos,clamp((1-k)/.55,0,1)*1.15,yaw,1,n+1);
      n++;
      Q.blots.push([x,z,1.7*k,.45]);
    }
    if(n>first){Q.parts.push({geo:Q.geo[key],first,count:n-first});Q.parts.push({geo:Q.geo[key+"~"],first,count:n-first,spoil:true});}
  }
  if(!Q.inst){Q.inst=plnInst(Q.a,n,PLN_THINGS.cap);Q.instS=plnInst(Q.as,n,PLN_THINGS.cap);}
  else{plnInstSet(Q.inst,Q.a,n);plnInstSet(Q.instS,Q.as,n);}
}
function plnThings(L,S,p){
  let Q=L.things;
  if(Q&&Q.gen!==PLN_GPU.gen){plnThingsDrop(L);Q=null;}
  if(!Q)Q=L.things={gen:PLN_GPU.gen,dep:{geo:{},inst:null,instS:null,a:new Float32Array(16*PLN_THINGS.cap),as:new Float32Array(16*PLN_THINGS.cap),sig:-1,parts:[],blots:[]},cave:null,mine:null,ms:0};
  const t0=wallMs();
  plnThingsDeposits(Q.dep,L,S);
  const cx=S.cave&&isFinite(S.cave.x)?S.cave.x/PLN_M:null;
  if((Q.cave?Q.cave.x:null)!==cx){
    if(Q.cave)plnGeoFree(Q.cave.geo);
    Q.cave=cx==null?null:{x:cx,geo:plnGeo(plnThingCaveMesh(L,cx))};
  }
  const mu=mineSpotX(p),mx=mu==null||!isFinite(mu)?null:mu/PLN_M;
  if((Q.mine?Q.mine.x:null)!==mx){
    if(Q.mine)plnGeoFree(Q.mine.geo);
    Q.mine=null;
    if(mx!=null){const b=plnThingMineMesh(L,mx);Q.mine={x:mx,geo:plnGeo(b.m),lamp:b.lamp};}
  }
  Q.ms+=wallMs()-t0;
  PLN.stat.things={dep:Q.dep.inst?Q.dep.inst.n:0,cave:!!Q.cave,mine:!!Q.mine,ms:Math.round(Q.ms)};
  return Q;
}
/* Ставит вещи в кадр: тела, лампу копра и пятна тени под ними. ex — где стоит объектив, V — {hw, D} */
function plnThingsFrame(L,F,S,p,ex,V){
  const Q=plnThings(L,S,p),T=PLN_THINGS,B=PLN_KIND.body,TO=PLN_TO.all,b=F.blobs;
  const sees=(x,z,m)=>Math.abs(x-ex)<V.hw*(1+z/V.D)+m;
  let n=b[0]|0;
  const blot=q=>{if(n<64&&sees(q[0],q[1],q[2])){b.set(q,4+n*4);n++;}};
  const D=Q.dep;
  if(D.inst&&D.inst.n>0){
    for(const q of D.parts)F.batches.push({geo:q.geo,inst:q.spoil?D.instS:D.inst,first:q.first,count:q.count,kind:B,to:TO});
    for(const q of D.blots)blot(q);
  }
  if(Q.cave&&sees(Q.cave.x,T.caveZ+7,9*T.caveQ)){
    F.batches.push({geo:Q.cave.geo,inst:null,kind:B,to:TO});
    blot([Q.cave.x+.3,T.caveZ+3.6*T.caveQ,6.2*T.caveQ,.5]);blot([Q.cave.x,T.caveZ-.2,2*T.caveQ,.5]);
  }
  if(Q.mine&&sees(Q.mine.x,T.mineZ+3,6)){
    F.batches.push({geo:Q.mine.geo,inst:null,kind:B,to:TO});
    F.lamps.push({p:Q.mine.lamp,r:6,c:[1,.62,.3],k:2});
    blot([Q.mine.x+3.4,T.mineZ+.3,2.3,.45]);
  }
  b[0]=n;
}
function plnThingsDrop(L){
  const Q=L.things;
  if(!Q)return;
  for(const k in Q.dep.geo)plnGeoFree(Q.dep.geo[k]);
  if(Q.dep.inst)plnInstFree(Q.dep.inst);
  if(Q.dep.instS)plnInstFree(Q.dep.instS);
  if(Q.cave)plnGeoFree(Q.cave.geo);
  if(Q.mine)plnGeoFree(Q.mine.geo);
  L.things=null;
}
/* «у вещи» — для объектива (21pz, M624): человек стоит на земле, и рядом залежь, вход в
   пещеру, устье шахты, памятник, корабль или растение игры. Дальности — те, с которых игра
   даёт действие (21-mode-surface) */
function plnAtThing(S,p){
  if(!S||S.on===false||S.jetOn||(S.walkAmp||0)>.25)return 0;
  if(S.mining)return 1;
  const x=S.x;
  for(const d of S.deposits||[])if(d.left>0&&Math.abs(d.x-x)<26)return 1;
  if(S.cave&&isFinite(S.cave.x)&&Math.abs(S.cave.x-x)<34)return 1;
  if(S.shipX!=null&&Math.abs(S.shipX-x)<40)return 1;
  const mu=mineSpotX(p);
  if(mu!=null&&isFinite(mu)&&Math.abs(mu-x)<MINE_MOUTH_R)return 1;
  for(const pl of S.plants||[])if(Math.abs(pl.x-x)<30)return 1;
  for(const b of S.fauna||[])if(b&&!b.caught&&isFinite(b.x)&&Math.abs(b.x-x)<20)return 1;
  if(typeof poiNear==="function"&&S.tr&&poiNear(S,S.tr))return 1;
  return 0;
}
