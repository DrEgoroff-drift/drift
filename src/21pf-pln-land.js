/* ══════════════ планета: земля (M610) ══════════════
   Земля — два тела.

   ЛЕНТА стоит в мире. Её середина — линия ходьбы игры, образец в образец
   (tr.h): человек ходит по тому же рельефу, что и раньше. К объективу от линии
   идёт ближний склон, за линией — покатая, как сцена, полка, гребень и спуск.
   Лента режется кусками вдоль x и строится очередью.

   ДАЛЬНИЙ МИР — ложбина с водой, дальний берег, холмы, хребет, горы и дальние
   гряды — жёсток сам в себе и едет ПО ВЫСОТЕ вместе с камерой одним числом на
   кадр: ride = lift(x камеры). По x он стоит, так что параллакс честный.
   Рельеф игры перепадает на десятки метров, и один мировой уровень воды
   затопил бы низины линии ходьбы; а так вода кадра всегда лежит под самой
   низкой точкой линии, что видна, и принятая композиция держится в любом месте
   полосы. Шов двух тел — в складке за гребнем, объективу его не видно.

   Озеро игры (waterOf) — пруд на самой ленте: свой, мировой, уровень и вал
   вокруг; плывущий виден поверх ближнего вала.

   Формы дальних планов, цвета и числа — со стенда docs/look (M600), в метрах
   от точки композиции: она в 12.8 м правее площадки. */
const PLN_LAND={ext:180,               /* на сколько образцов лента продолжена за края полосы */
  chunk:70,                            /* столбцов в куске ленты */
  zNear:-52,zBack:48,                  /* лента в глубину: к объективу и от него */
  wRel:-3.2,                           /* вода ложбины на уровне дальнего мира */
  e0:56,                               /* полуширина вида на линии ходьбы, под которую раскрыт дальний мир */
  edges:[4,130,300,700,2000,62000],cols:[900,800,520,320,224],
  cur:null};
/* бюджет стройки по кадрам (M614). ms — стенного часа на кадр, на землю и посадки вместе; n и
   slice — счётом (в наборе тестов часы стоят, и без счёта стройка легла бы разом); first, nFirst и
   sliceFirst — первому вызову: он поднимает землю у корабля; piece — проб травы между сверками с
   часами (проба ~3 мкс); farV — вершин в куске дальнего мира: кусок в 9000 стоил 33 мс на ПК, в
   бюджет ложится один в 1200 (~8 мс: большая часть — запас высот по краям куска). До касания
   стройки нет: сцена складывается вокруг точки касания (L.cx0), а корабль садится, где остановился */
const PLN_BUILD={ms:8,first:40,n:2,nFirst:6,slice:6000,sliceFirst:12000,piece:1200,farV:1200};
/* зелень меняет тон с глубиной: оливковая вблизи, холоднее на дальнем берегу, сине-зелёная на холмах.
   Это рабочий лист: перед стройкой земли в него ложится лист типа мира (21pfa, plnPalSet) */
const PLN_PAL={
  grassLit:plnHex("#93a94f"),grassMid:plnHex("#5c8a47"),grassCool:plnHex("#3b7560"),dry:plnHex("#c4a659"),
  heather:plnHex("#b56a8e"),clover:plnHex("#7d70ad"),soil:plnHex("#b08a5e"),soilDark:plnHex("#7a5a40"),mud:plnHex("#4a4f3c"),
  rockWarm:plnHex("#b3aa98"),rockCool:plnHex("#8a8d9a"),crag:plnHex("#5d6378"),cragWarm:plnHex("#8a7f78"),snow:plnHex("#f2f4f8"),
  forest:plnHex("#2f5f52"),glade:plnHex("#6b9558"),plain:plnHex("#8aa880"),moss:plnHex("#5d7f35")};
const PLN_AZ_ELEV=5*PLN_DEG,PLN_AZ_PEAK=-11*PLN_DEG;

/* ── окна по образцам ── */
/* скользящий минимум (mx — максимум) с полушириной k образцов */
function plnSlide(A,k,B,mx){
  const n=A.length;
  if(k<=0){B.set(A);return B;}
  const q=new Int32Array(n);
  let h=0,t=0,j=0;
  for(let i=0;i<n;i++){
    const hi=Math.min(n-1,i+k);
    for(;j<=hi;j++){
      while(t>h&&(mx?A[q[t-1]]<=A[j]:A[q[t-1]]>=A[j]))t--;
      q[t++]=j;
    }
    while(q[h]<i-k)h++;
    B[i]=A[q[h]];
  }
  return B;
}
/* среднее по окну с полушириной k образцов; у краёв окно короче. S — место под суммы */
function plnBox(A,k,B,S){
  const n=A.length;
  if(k<=0){B.set(A);return B;}
  S[0]=0;
  for(let i=0;i<n;i++)S[i+1]=S[i]+A[i];
  for(let i=0;i<n;i++){const lo=Math.max(0,i-k),hi=Math.min(n-1,i+k);B[i]=(S[hi+1]-S[lo])/(hi-lo+1);}
  return B;
}
/* то же с дробной полушириной: между двумя целыми окнами, чтобы ряды шли без ступеней */
function plnSlideF(A,w,B,T1,mx){
  const k=Math.floor(w),f=w-k;
  plnSlide(A,k,B,mx);
  if(f>1e-3){plnSlide(A,k+1,T1,mx);for(let i=0;i<A.length;i++)B[i]+=(T1[i]-B[i])*f;}
  return B;
}
function plnBoxF(A,w,B,T1,S){
  const k=Math.floor(w),f=w-k;
  plnBox(A,k,B,S);
  if(f>1e-3){plnBox(A,k+1,T1,S);for(let i=0;i<A.length;i++)B[i]+=(T1[i]-B[i])*f;}
  return B;
}

/* ── формы ── */
/* полка покатая, как сцена: тропа, цветы и ноги видны сверху, а не с ребра. На линии ходьбы — ноль */
function plnLandRake(z){return .9*(Math.exp(-Math.max(0,1.2-z)/3.5)-Math.exp(-1.2/3.5));}
function plnSoftp(d){return .5*(d+Math.sqrt(d*d+1.5));}
function plnRidge(z,zc,yc,sf,sb,k){const d=z-zc,a=yc+sf*d,b=yc-sb*d;return -plnSmax(-a,-b,k);}
/* ряды ленты: у линии ходьбы часто, дальше реже; к объективу снова чаще — он близко */
function plnLandRows(){
  const C=PLN_LAND,near=[],back=[];
  for(let z=0;z>C.zNear;){
    const s=Math.min(.0125*(100+z),.5-z*.12);
    z=(z-s<C.zNear+s*.5)?C.zNear:z-s;near.push(z);
  }
  for(let z=0;z<C.zBack;){
    const s=Math.min(2,.5+z*.12);
    z=(z+s>C.zBack-s*.5)?C.zBack:z+s;back.push(z);
  }
  near.reverse();
  return {z:Float32Array.from(near.concat([0],back)),r0:near.length};
}
/* ряды дальнего мира: чаще там, где план поворачивается к объективу лицом; ярус (21pe, farK) редит их */
function plnLandFarRows(){
  const st=d=>d<210?1.013:(d>300&&d<480)?1.008:(d>900&&d<1300)?1.006:(d>2900&&d<4600)?1.004:(d>6000&&d<12500)?1.008:1.022;
  const z=[],k=PLN_GPU.farK||1;
  for(let d=104;d<62100;d*=Math.pow(st(d),k))z.push(d-100);
  return Float32Array.from(z);
}
/* столбцов дальнего мира в полосе b; ярус (farK) редит их */
function plnLandCols(b){return Math.max(24,Math.round(PLN_LAND.cols[b]/(PLN_GPU.farK||1)));}
/* на сколько дальний мир шире полосы на этой глубине */
function plnLandE(z){return PLN_LAND.e0*(1+z/100)*1.1;}

/* ── таблицы рельефа: раз на посадку; sx — где сел корабль, в единицах игры ── */
function plnLandMake(tr,p,sx){
  const wl=plnPalSet(p);
  const C=PLN_LAND,dx=tr.step/PLN_M,E=C.ext,N=tr.N,NT=N+2*E,y0=tr.padY,x0=-E*dx;
  const P=new Float32Array(NT);
  for(let i=0;i<NT;i++)P[i]=(y0-tr.h[clamp(i-E,0,N-1)])/PLN_M;
  const Wt=waterOf(tr,p),ty=p&&p.type;
  const liquid=!!(p&&p.T&&p.T.atm!=="отсутствует")&&(ty==="terran"||ty==="jungle"||ty==="ocean"||ty==="toxic"||ty==="ruin"||ty==="rocky");
  const lake=Wt?{x0:Wt.x0/PLN_M,x1:Wt.x1/PLN_M,level:(y0-Wt.y)/PLN_M,acid:!!Wt.acid}:null;
  const shipU=sx==null?tr.padX:sx,shipX=shipU/PLN_M,yaw=.2,padH=(y0-groundAt(tr,shipU))/PLN_M;
  const L={tr,sx,gen:PLN_GPU.gen,y0,dx,x0,N,NT,E,len:N*dx,P,lake,wet:liquid&&((tr.wet||0)>=.2||!!lake),
    sd:Math.floor(plnHash((p&&p.seed)|0,tr.sseed|0,7)*900000)+17,
    /* точка композиции: от площадки, если спуск её запомнил (tr.plnCx, M621), иначе от корабля */
    shipX,shipZ:7,shipYaw:yaw,padH,cx0:tr.plnCx!=null?tr.plnCx:shipX+12.8,
    /* подножие трапа: место корабля (.75, −4.26), повёрнутое вместе с ним */
    rampX:shipX+.75*Math.cos(yaw)-4.26*Math.sin(yaw),rampZ:7-.75*Math.sin(yaw)-4.26*Math.cos(yaw),
    gk:0,jobs:[],left:0,ms:0,first:false,wl,farC:[]};
  const A=new Float32Array(NT),B=new Float32Array(NT),T1=new Float32Array(NT),S=new Float64Array(NT+1);
  /* подъём дальнего мира: вода кадра на .8 м ниже самой низкой точки линии, что попадает в кадр;
     в озере игры линия лежит под водой, и считается там уровень озера */
  const Pt=new Float32Array(NT);
  for(let i=0;i<NT;i++){const x=x0+i*dx;Pt[i]=(lake&&x>=lake.x0&&x<=lake.x1)?lake.level+.8:P[i];}
  plnSlide(Pt,Math.round(80/dx),A);
  L.lift=plnBox(A,Math.round(30/dx),new Float32Array(NT),S);
  for(let i=0;i<NT;i++)L.lift[i]+=2.4;
  L.liftLo=plnSlide(L.lift,Math.round(100/dx),new Float32Array(NT));
  L.liftHi=plnSlide(L.lift,Math.round(100/dx),new Float32Array(NT),true);
  /* где линия идёт ступенью круче сорока градусов, земля — скала (тела её стоят там же, 21pga);
     берег пруда остаётся берегом */
  {
    const cr=new Float32Array(NT);
    for(let i=1;i<NT-1;i++){
      const x=x0+i*dx;
      if(!(lake&&x>lake.x0-2&&x<lake.x1+2))cr[i]=plnSmooth(.8,1.05,Math.abs(P[i+1]-P[i-1])/(2*dx));
    }
    L.crag=plnBox(plnSlide(cr,1,A,true),1,new Float32Array(NT),S);
  }
  /* высоты ленты без зерна: ряд за рядом по образцам линии */
  const rows=plnLandRows(),zr=rows.z,R=zr.length,T=new Float32Array(R*NT);
  const padL=new Float32Array(NT),padF=new Float32Array(NT);
  for(let i=0;i<NT;i++){
    const d=Math.abs(x0+i*dx-shipX);
    padL[i]=1-plnSmooth(5.5,10,d);padF[i]=1-plnSmooth(4.5,9,d);
  }
  for(let r=0;r<R;r++){
    const z=zr[r],o=r*NT;
    if(z<0){
      /* ближний склон не смеет закрыть линию ходьбы: точка на глубине d лежит ниже всего, что
         объектив видит сквозь неё, — минимум линии по окну, которое растёт с глубиной */
      /* чем дальше от линии, тем шире сглажен её уступ: стена вдоль взгляда расходится в откос */
      const d=-z,b=clamp(.6*d,0,5),f=.07*d+1.6*plnSmooth(8,30,d),rk=plnLandRake(z);
      plnSlideF(P,(.42*d+b)/dx,A,T1);
      plnBoxF(A,b/dx,B,T1,S);
      for(let i=0;i<NT;i++)T[o+i]=B[i]-f+rk;
    }else if(z>0){
      /* за линией бугры линии расходятся в холмики; под кораблём площадка ровная */
      const rk=plnLandRake(z),kb=plnSmooth(0,6,z),kp=plnSmooth(0,3,z);
      plnBoxF(P,.5*z/dx,B,T1,S);
      for(let i=0;i<NT;i++){
        const zb=10+4*padL[i];
        T[o+i]=lerp(lerp(P[i],B[i],kb),padH,padF[i]*kp)+rk-.42*(plnSoftp(z-zb)-plnSoftp(-zb));
      }
    }else for(let i=0;i<NT;i++)T[i+o]=P[i];
  }
  /* дальний край ленты уходит под дальний мир, как бы низко тот ни стоял */
  const last=(R-1)*NT;
  for(let i=0;i<NT;i++)A[i]=Math.max(0,T[last+i]-(L.liftLo[i]-8));
  plnSlide(A,Math.round(6/dx),B,true);
  plnBox(B,Math.round(6/dx),A,S);
  for(let r=rows.r0+1;r<R;r++){
    const k=plnSmooth(20,48,zr[r]);
    if(k>0)for(let i=0;i<NT;i++)T[r*NT+i]-=A[i]*k;
  }
  /* вал вокруг пруда: вода стоит в ленте, а не льётся по ближнему склону */
  if(lake){
    plnLandPondLine(L);
    const ia=clamp(Math.floor((lake.x0-32-x0)/dx),0,NT-1),ib=clamp(Math.ceil((lake.x1+32-x0)/dx),0,NT-1);
    for(let r=0;r<R;r++){
      const z=zr[r],w=plnSmooth(.6,2.5,Math.abs(z));
      if(w<=0||z<lake.zn-32||z>lake.zf+32)continue;
      for(let i=ia;i<=ib;i++){
        const hr=plnLandRim(L,x0+i*dx,z),o=r*NT+i;
        T[o]=lerp(T[o],Math.max(T[o],hr),w);
      }
    }
  }
  L.zr=zr;L.R=R;L.r0=rows.r0;L.T=T;
  L.fz=plnLandFarRows();
  plnLandJobs(L);
  return L;
}
/* Берег пруда. По линии ходьбы вода лежит от x0 до x1 — так в игре; в глубину берег свой: к объективу
   и от него он отходит заливами и мысами, концы скруглены. Обвод — многоугольник, раз на посадку;
   far и near — его берега по x, дальний и ближний */
function plnLandPondLine(L){
  const k=L.lake,xc=(k.x0+k.x1)/2,hx=(k.x1-k.x0)/2,n=40,far=[],near=[];
  const zf=clamp(.62*hx,5.5,7.5),zn=clamp(.7*hx,6.5,9);
  for(let i=0;i<=n;i++){
    const a=Math.PI*i/n,x=xc-hx*Math.cos(a),e=Math.pow(Math.sin(a),.6);
    far.push([x,e*zf*(1+.3*plnFbm(x*.13+3.1,1.7,2,L.sd+71)+.1*Math.sin(x*.9+L.sd))]);
    near.push([x,-e*zn*(1+.3*plnFbm(x*.13+9.4,5.1,2,L.sd+72)+.1*Math.sin(x*.8+1+L.sd))]);
  }
  k.far=far;k.near=near;k.poly=far.concat(near.slice(1,n).reverse());
  k.zf=0;k.zn=0;
  for(const p of k.poly){k.zf=Math.max(k.zf,p[1]);k.zn=Math.min(k.zn,p[1]);}
}
/* где берег пруда на этом x: дальний (far) или ближний */
function plnLandPondZ(L,x,far){
  const k=L.lake,A=far?k.far:k.near,n=A.length-1;
  if(x<=k.x0||x>=k.x1)return 0;
  let a=0,b=n;
  while(b-a>1){const m=(a+b)>>1;if(A[m][0]<=x)a=m;else b=m;}
  return lerp(A[a][1],A[b][1],(x-A[a][0])/((A[b][0]-A[a][0])||1));
}
/* чаша пруда и вал: s — как далеко точка от берега (внутри чаши — меньше нуля) */
function plnLandPond(L,x,z){
  const k=L.lake,P=k.poly,n=P.length,bx=Math.max(k.x0-x,0,x-k.x1),bz=Math.max(k.zn-z,0,z-k.zf);
  if(bx>30||bz>30)return Math.hypot(bx,bz);
  let d2=1e18,inside=false;
  for(let i=0,j=n-1;i<n;j=i++){
    const a=P[j],b=P[i],ex=b[0]-a[0],ez=b[1]-a[1],px=x-a[0],pz=z-a[1];
    const t=clamp((px*ex+pz*ez)/((ex*ex+ez*ez)||1),0,1),qx=px-ex*t,qz=pz-ez*t;
    d2=Math.min(d2,qx*qx+qz*qz);
    if((a[1]>z)!==(b[1]>z)&&x<a[0]+(z-a[1])*ex/ez)inside=!inside;
  }
  return inside?-Math.sqrt(d2):Math.sqrt(d2);
}
/* Вал у объектива низок — вровень с водой: за высоким, да с травой на нём, воды не видно, объектив
   смотрит на неё вскользь. Дно у берега — отмель, глубина начинается в шаге от неё */
function plnLandRim(L,x,z){
  const s=plnLandPond(L,x,z),top=L.lake.level+lerp(.15,.4,plnSmooth(-2,3,z));
  return s>0?top-1.2*plnSmooth(3,9,s)-6*plnSmooth(9,25,s):top-.28*plnSmooth(0,1.3,-s)-2.7*plnSmooth(1.1,5,-s);
}
/* Голый берег: полоса сырой земли у самой воды. Полоса рваная — местами трава спускается к урезу:
   сплошная читается второй тропой вокруг пруда */
function plnLandBare(L,x,z){
  const s=plnLandPond(L,x,z);
  return s>1.3?0:plnSmooth(1.3,.2,s)*plnSmooth(-.45,.15,plnFbm(x*.42+7.3,z*.42+1.9,2,L.sd+73));
}

/* ── высоты ── */
/* лента в узле сетки: таблица и зерно. Бугры ближнего склона не поднимают его выше обещанного */
function plnLandRibH(L,r,i){
  const z=L.zr[r],x=L.x0+i*L.dx,d=Math.abs(z);
  let h=L.T[r*L.NT+i],calm=1;
  if(L.lake&&x>L.lake.x0-34&&x<L.lake.x1+34&&d<40)calm=plnSmooth(2,8,Math.abs(plnLandPond(L,x,z)));
  if(z<0){
    const f=.07*d+1.6*plnSmooth(8,30,d);
    h+=Math.min(plnFbm(x*.03+1.7,z*.03+4.2,3,L.sd+5)*1.3*plnSmooth(3,22,d),.8*f)*calm;
  }
  /* скала ступени рублена: узлы сдвинуты кто куда, и грань встаёт к грани. Перед линией — только вниз;
     сама линия стоит, где была */
  const cr=L.crag[i];
  if(cr>0&&d>.2&&d<10){
    const u=plnHash(i,r,L.sd+91);
    h+=cr*plnSmooth(.2,.9,d)*plnSmooth(10,6,d)*(z<0?-.45*u:.6*(u-.5));
  }
  return h+plnFbm(x*.35,z*.35,2,L.sd+13)*.09*plnSmooth(1.2,4,d)*calm;
}
/* лента в любой точке: между узлами */
function plnLandRibAt(L,x,z){
  const zr=L.zr,R=L.R;
  z=clamp(z,zr[0],zr[R-1]);
  let a=0,b=R-1;
  while(b-a>1){const m=(a+b)>>1;if(zr[m]<=z)a=m;else b=m;}
  const tz=(z-zr[a])/((zr[b]-zr[a])||1),u=clamp((x-L.x0)/L.dx,0,L.NT-1.001),i=Math.floor(u),tx=u-i;
  return lerp(lerp(plnLandRibH(L,a,i),plnLandRibH(L,a,i+1),tx),lerp(plnLandRibH(L,b,i),plnLandRibH(L,b,i+1),tx),tz);
}
/* число из таблицы вдоль x */
function plnLandTab(L,A,x){
  const u=clamp((x-L.x0)/L.dx,0,L.NT-1.001),i=Math.floor(u);
  return lerp(A[i],A[i+1],u-i);
}
function plnLandLift(L,x){return plnLandTab(L,L.lift,x);}
/* рельеф линии на отрезке: под короб теней */
function plnLandSpan(L,xa,xb){
  const ia=clamp(Math.floor((xa-L.x0)/L.dx),0,L.NT-1),ib=clamp(Math.ceil((xb-L.x0)/L.dx),0,L.NT-1);
  let lo=1e9,hi=-1e9;
  for(let i=ia;i<=ib;i++){const v=L.P[i];if(v<lo)lo=v;if(v>hi)hi=v;}
  return {lo,hi};
}
/* Дальний мир на своём уровне: стопка кулис, у каждой гребень, склон к объективу и склон за ним.
   Гребни расставлены по тому, куда они ложатся в кадре (стенд, M600): дальний берег, холмы,
   хребет, горы с пиком; по пеленгу долины все они кланяются. Кто победил — в L.gk */
function plnLandFarH(L,xw,z){
  const sd=L.sd,x=xw-L.cx0,az=Math.atan2(x,z+50),Fw=L.wl&&L.wl.far||PLN_FAR.terran,Hk=Fw.h||1;
  const pass=Math.exp(-Math.pow((az-PLN_AZ_ELEV)/.075,2));
  /* ложбина держит воду у площадки и за озером игры; дальше дно поднимается и сохнет */
  let dl=Math.abs(x-10);
  if(L.lake){const a=L.lake.x0-L.cx0,b=L.lake.x1-L.cx0;dl=Math.min(dl,x<a?a-x:(x>b?x-b:0));}
  dl+=14*plnFbm(x*.03+1.7,z*.06+4.2,2,sd+74);   /* урез ложбины — бухтами и косами, не по линейке (M623) */
  let h=-6.4+.6*plnFbm(x*.02+3,z*.02+8,2,sd+7)+7*plnSmooth(70,130,dl),k=1,k2=1,w2=0;
  /* кулиса красится своим цветом; у стыка двух — оба, долями: граница цвета идёт мимо узлов сетки
     и без этого рисуется лесенкой. Полоса стыка — в метрах высоты, шире с расстоянием */
  const mg=.5+.004*(z+100);
  const take=(v,id,soft)=>{
    const w=clamp(.5+.5*(v-h)/mg,0,1);
    if(w>=.5){k2=k;w2=1-w;k=id;}else if(w>w2){k2=id;w2=w;}
    h=plnSmax(h,v,soft);
  };
  const n1=plnFbm(x*.008+5,.5,2,sd+21),n1b=plnFbm(x*.012+9,1.5,3,sd+22);
  /* дальний урез воды рисуется бухтами и косами */
  const bay=17*plnFbm(x*.034+1.3,2.5,2,sd+47);
  take(plnRidge(z,136+20*n1+bay*(1-plnSmooth(122,140,z)),(5+4*n1b)*(1-.35*pass),.26,.10,6)+plnFbm(x*.03+2,z*.03+5,3,sd+31)*.9,2,3);
  /* кулисы по типу мира (21pfa): где форма мира отвечает — берётся она, где null — землеподобная,
     умноженная на её рост Hk */
  if(z>110){
    take(lerp(-60,3+z*.003,plnSmooth(120,230,z))+(Fw.crater?plnFarCrater(L,x,z):0),6,6);
    const v3=plnFarLane(Fw,3,0,L,x,z,az,pass);
    if(v3!==null)take(v3,3,8);
    else{
      const n2=plnFbm(x*.004+2,2.5,2,sd+23),n2b=plnFbm(x*.006+7,3.5,3,sd+24);
      /* холмы в складках: по лицу идут овраги, свету есть что рисовать */
      const fold=(plnRidged(x*.011+4+.4*plnFbm(z*.01,x*.01,2,sd+48),z*.004+2,3,sd+49)-.5)*7;
      take(plnRidge(z,340+70*n2,(14+9*n2b)*(1-.7*pass),.16,.08,14)+(plnFbm(x*.05+1,z*.05+3,3,sd+32)*1.6+fold)*(1-.5*pass),3,8);
    }
  }
  if(z>400){
    const v4=plnFarLane(Fw,4,0,L,x,z,az,pass);
    if(v4!==null)take(v4,4,20);
    else{
      const n3=plnFbm(x*.0012+4,4.5,2,sd+25);
      const y3=(22+30*plnRidged(x*.0016+11,5.5,4,sd+26))*(1-.8*pass)*Hk;
      take(plnRidge(z,1050+180*n3,y3,.22,.14,30)+(plnRidged(x*.004+3,z*.0013+1,4,sd+33)-.45)*12*(1-.6*pass),4,20);
    }
    if(z>1500){
      const v5=plnFarLane(Fw,5,0,L,x,z,az,pass);
      if(v5!==null)take(v5,5,40);
      else{
        /* массив стоит слева и несёт пик; вправо гряда уходит за хребет */
        const env=.55+.65*Math.exp(-Math.pow((az-PLN_AZ_PEAK)/.2,2));
        const peak=200*Math.exp(-Math.pow((az-PLN_AZ_PEAK)/.05,2))+95*Math.exp(-Math.pow((az-PLN_AZ_PEAK+.105)/.036,2));
        const n4=plnFbm(x*.0004+6,6.5,2,sd+27);
        const y4=((120+110*plnRidged(x*.0006+2.3,7.5,5,sd+28))*env*(1-.8*pass)+peak)*Hk;
        /* рёбра сбегают с гребня: чем выше гора, тем глубже они врезаны */
        const ribs=(plnRidged(x*.0030+8+.5*plnFbm(z*.001,x*.001,2,sd+38),z*.0006+4,5,sd+34)-.5)*.62*y4;
        take(plnRidge(z,3700+600*n4,y4,.5,.35,50)+ribs,5,40);
      }
      take(25+12*plnFbm(x*.0002,z*.0002,2,sd+29)-.5*Math.max(0,4800-z),6,30);
    }
    if(z>5000){
      /* две дальние гряды: долина — не чаша, а склон за склоном, каждый бледнее */
      const n5=plnFbm(x*.0002+3,8.5,2,sd+35);
      const v6=plnFarLane(Fw,7,0,L,x,z,az,pass);
      if(v6!==null)take(v6,7,40);
      else{
        const y5=(70+150*plnRidged(x*.00035+5.1,9.5,5,sd+36))*(1-.45*pass)*Hk;
        take(plnRidge(z,7000+800*n5,y5,.4,.3,60)+(plnRidged(x*.0016+2,z*.0004+1,4,sd+39)-.5)*.5*y5,7,40);
      }
      const v7=plnFarLane(Fw,7,1,L,x,z,az,pass);
      if(v7!==null)take(v7,7,40);
      else{
        const y6=(150+260*plnRidged(x*.00022+1.7,10.5,5,sd+37))*(1-.35*pass)*Hk;
        take(plnRidge(z,11000+1000*n5,y6,.4,.3,80)+(plnRidged(x*.0011+6,z*.0003+3,4,sd+40)-.5)*.5*y6,7,40);
      }
    }
  }
  /* ближний край дальнего мира начинается под лентой */
  if(z<30)h-=12*(1-plnSmooth(4,30,z));
  L.gk=k;L.gk2=k2;L.gw=w2;
  return h;
}

/* ── цвет ── */
/* натоптанная тропа: сама линия ходьбы и ветка от трапа корабля */
function plnLandPath(L,x,z,nw){
  const e1=.22*Math.sin(x*.31)+.16*Math.sin(x*.83+1.3),e2=.2*Math.sin(x*.27+2)+.15*Math.sin(x*.71+.4);
  const zc=-.15+(e2-e1)*.5,hw=(.85+(e1+e2)*.5)*(nw||1),rx=L.rampX;   /* nw — доля полуширины (середина тропы, 21pge) */
  let w=1-plnSmooth(hw,hw+.4,Math.abs(z-zc));   /* край резче: за .8 м тропа была мазком кисти (M623) */
  if(x>rx-1&&x<rx+10.5){
    const t=clamp((x-rx)/10,0,1),zl=lerp(L.rampZ,0,t*t*(3-2*t));
    w=Math.max(w,(1-plnSmooth(hw*.6,hw*1.4,Math.abs(z-zl)))*plnSmooth(rx-1,rx-.2,x));
  }
  return w*plnSmooth(.25,.6,plnFbm(x*.9,z*.9,2,L.sd+51)*.5+.5+w*.35);
}
/* поля цвета: крупные пятна, соседние — на тон друг от друга, и нигде не одна зелень.
   k — номер кулисы: 0 лента, 1 ложбина, 2 дальний берег, 3 холмы, 4 хребет, 5 и 7 горы, 6 равнина */
function plnLandCol(L,x,z,h,n,k){
  const sd=L.sd,PAL=PLN_PAL,slope=1-n[1],wy=PLN_LAND.wRel,Fw=L.wl&&L.wl.far||PLN_FAR.terran,sn=Fw.snow,tl=Fw.tree;
  const v1=plnFbm(x*.05+9,z*.05+2,3,sd+41)*.5+.5,v2=plnFbm(x*.011+4,z*.011+6,3,sd+42)*.5+.5;
  let c;
  if(k===0){
    const va=plnFbm(x*.045+1,z*.07+7,3,sd+43)*.5+.5,vb=plnFbm(x*.09+5,z*.13+3,2,sd+44)*.5+.5;
    const dry=plnSmooth(.52,.68,va);
    c=plnMix3(PAL.grassMid,PAL.grassLit,plnSmooth(.3,.7,v1));
    c=plnMix3(c,PAL.dry,dry*.75);
    c=plnMix3(c,PAL.clover,plnSmooth(.60,.72,vb)*.42*(1-dry));
    if(z<-3)c=plnMix3(c,PAL.grassCool,plnSmooth(3,16,-z)*.7);
  }else if(k===1)c=plnMix3(PAL.grassCool,PAL.mud,plnSmooth(wy+.7,wy-.5,h));
  else if(k===2){
    const va=plnFbm(x*.012+1,z*.03+7,3,sd+45)*.5+.5,vb=plnFbm(x*.02+5,z*.04+3,3,sd+46)*.5+.5,vc=plnFbm(x*.09+2,z*.14+9,3,sd+47)*.5+.5;
    c=plnMix3(plnMix3(PAL.grassMid,PAL.grassLit,plnSmooth(.35,.7,v1)),PAL.grassCool,.35);
    /* вереск лежит наносами вдоль берега: доля мягкая, край рван мелким зерном, цвет приглушён
       к траве — ровное пятно чистого вереска читалось лужей (M622) */
    c=plnMix3(c,plnMix3(PAL.heather,PAL.grassMid,.35),plnSmooth(.5,.74,va*.72+vc*.28)*(.18+.24*plnSmooth(.35,.65,v1)));
    c=plnMix3(c,PAL.dry,plnSmooth(.56,.74,vb)*.55);
    c=plnMix3(c,PAL.grassCool,plnSmooth(wy+2.5,wy+.2,h)*.6);
  }else if(k===3){
    c=plnMix3(PAL.forest,PAL.glade,plnSmooth(.45,.7,v2));
    c=plnMix3(c,plnMix3(PAL.heather,PAL.grassMid,.3),plnSmooth(.6,.8,v1)*.28);
  }else if(k===4){
    /* лес по хребту до своей черты (лист мира), выше — камень; снег — где позволяет склон */
    c=plnMix3(PAL.forest,PAL.crag,tl>0?plnSmooth(tl*.13,tl*.35,h+14*(v1-.5)):1);
    c=plnMix3(c,PAL.snow,plnSmooth(sn,sn+75,h+30*(v2-.5))*plnSmooth(.85,.5,slope));
  }else if(k===5||k===7){
    c=plnMix3(PAL.crag,PAL.cragWarm,v1);
    if(tl>0)c=plnMix3(c,PAL.forest,plnSmooth(tl,tl*.4,h)*.6);
    /* снег держится там, где позволяет склон; черта снега — листа мира */
    c=plnMix3(c,PAL.snow,plnSmooth(sn,sn+75,h+70*(v2-.5))*plnSmooth(.85,.5,slope));
  }else c=plnMix3(PAL.plain,PAL.glade,v2);
  /* на ленте крутой бок холма — травяной откос: камень выходит только там, где круче шестидесяти
     градусов. Голый серый бок в рост человека стоял посреди кадра «шатром» */
  if(k===0)c=plnMix3(c,plnMix3(PAL.rockWarm,PAL.rockCool,v1),plnSmooth(.5,.7,slope)*.8);
  else if(k<5)c=plnMix3(c,plnMix3(PAL.rockWarm,PAL.rockCool,v1),plnSmooth(.22,.42,slope)*(k>=4?1:.8));
  if(k===0)c=plnDressPath(L,x,z,c,slope,v1);   /* тропа: натоптанная середина, пыльный край (21pge) */
  return c;
}

/* ── очередь стройки ── */
function plnLandJobs(L){
  const C=PLN_LAND,J=L.jobs,fz=L.fz,RF=fz.length,B=PLN_KIND.body,TO=PLN_TO;
  for(let c=0;c*C.chunk<L.NT-1;c++){
    const i0=c*C.chunk,i1=Math.min(i0+C.chunk,L.NT-1);
    J.push({t:"rib",c,xa:L.x0+i0*L.dx,xb:L.x0+i1*L.dx,kind:B,to:TO.all,ride:false,geo:null,done:false});
  }
  for(let b=0;b<C.cols.length;b++){
    const NC=plnLandCols(b);
    let ra=0,rb=RF-1;
    while(ra<RF-1&&fz[ra]<C.edges[b])ra++;
    for(let r=ra;r<RF;r++)if(fz[r]>=C.edges[b+1]){rb=Math.min(RF-1,r+1);break;}
    const np=Math.ceil(NC/110),per=Math.max(4,Math.floor(PLN_BUILD.farV/(Math.ceil(NC/np)+1)));
    for(let r=ra;r<rb;r+=per)for(let k=0;k<np;k++){
      const c0=Math.round(k*NC/np),c1=Math.round((k+1)*NC/np),r1=Math.min(rb,r+per);
      const xs=(rr,cc)=>{const e=plnLandE(fz[rr]);return -e+(L.len+2*e)*cc/NC;};
      J.push({t:"far",b,c0,c1,ra:r,rb:r1,za:fz[r],zb:fz[r1],xa:xs(r,c0),xb:xs(r,c1),xa1:xs(r1,c0),xb1:xs(r1,c1),
        kind:B,to:fz[r]<460?(TO.main|TO.mirror|TO.sh1):(TO.main|TO.mirror),ride:true,geo:null,done:false});
    }
  }
  if(L.wet){
    /* вода ложбины: у точки композиции и за озером игры; если рядом — одним листом */
    const sp=[[L.cx0+10-112,L.cx0+10+112]];
    if(L.lake){
      const a=L.lake.x0-112,b=L.lake.x1+112;
      if(a<sp[0][1]&&b>sp[0][0]){sp[0][0]=Math.min(sp[0][0],a);sp[0][1]=Math.max(sp[0][1],b);}
      else sp.push([a,b]);
    }
    for(const s of sp)J.push({t:"water",xa:s[0],xb:s[1],kind:PLN_KIND.water,to:TO.main,ride:true,geo:null,done:false});
    if(L.lake)J.push({t:"pond",xa:L.lake.x0-2,xb:L.lake.x1+2,kind:PLN_KIND.water,to:TO.main,ride:false,geo:null,done:false});
  }
  L.left=J.length;
}
/* виден ли кусок: V — {hw, D} объектива, ex — где он стоит; m — запас в метрах */
function plnLandSees(J,ex,V,m){
  if(J.t==="far"){
    const ha=V.hw*(1+J.za/V.D)+8+m+(J.za<460?60:0),hb=V.hw*(1+J.zb/V.D)+8+m+(J.za<460?60:0);
    return !((J.xb<ex-ha&&J.xb1<ex-hb)||(J.xa>ex+ha&&J.xa1>ex+hb));
  }
  const z=J.t==="water"?136:PLN_LAND.zBack,h=V.hw*(1+z/V.D)+12+m;
  return J.xb>ex-h&&J.xa<ex+h;
}
function plnLandBuild(L,J){
  const m=J.t==="rib"?plnLandRibMesh(L,J.c):J.t==="far"?plnLandFarMesh(L,J):J.t==="water"?plnLandWaterMesh(L,J):plnLandPondMesh(L,J);
  J.geo=m.ni?plnGeo(m):null;J.done=true;L.left--;
  /* сетку куска ленты ждёт расстановка (21pga): трава встаёт на неё и отпускает */
  if(J.t==="rib")J.grid=m;
  PLN.stat.verts=(PLN.stat.verts||0)+m.nv;
}
/* Строит куски по бюджету (M614): не больше n штук и не дольше lim мс стенного часа, видимые и
   ближние к объективу первыми; без n и lim — числа PLN_BUILD, первому вызову — его собственные.
   Первый вызов берёт только видимое у корабля, дальше очередь идёт до конца по кадрам, ближнее
   первым. PLN.rush — всё до конца разом, для стенда и съёмки */
function plnLandStep(L,ex,V,n,lim){
  if(L.left<=0)return 0;
  const t0=wallMs(),all=!!PLN.rush,first=!L.first,B=PLN_BUILD;
  const cap=n==null?(first?B.nFirst:B.n):n,ms=lim==null?(first?B.first:B.ms):lim;
  let k=0;
  L.first=true;
  for(;;){
    let best=null,bp=1e9;
    for(const J of L.jobs){
      if(J.done)continue;
      const see=plnLandSees(J,ex,V,20),pr=(see?0:1e4)+Math.abs((J.xa+J.xb)/2-ex)+(J.t==="rib"?0:J.t==="far"?200+J.b*10:100);
      if(pr<bp&&(all||see||!first)){bp=pr;best=J;}
    }
    if(!best||(!all&&(k>=cap||wallMs()-t0>=ms)))break;
    plnLandBuild(L,best);k++;
  }
  L.ms+=wallMs()-t0;
  PLN.stat.land={jobs:L.jobs.length,left:L.left,ms:Math.round(L.ms)};
  return k;
}
function plnLandBatches(L,out,ex,V){
  for(const J of L.jobs)if(J.geo&&plnLandSees(J,ex,V,0))out.push({geo:J.geo,inst:null,kind:J.kind,to:J.to,ride:J.ride});
}
function plnLandFree(L){
  for(const J of L.jobs){if(J.geo)plnGeoFree(J.geo);J.geo=null;J.grid=null;J.pl=null;}
  plnPlantDrop(L);
  plnThingsDrop(L);
  plnHerbDrop(L);
  plnBeastDrop(L);
  plnMarksDrop(L);
}
/* земля этой посадки: одна на рельеф, место корабля и поколение устройства */
function plnLand(tr,p,sx){
  const C=PLN_LAND,cur=C.cur;
  if(cur&&cur.tr===tr&&cur.gen===PLN_GPU.gen&&cur.y0===tr.padY){
    if(cur.sx===sx)return cur;
    /* корабль сел не там, где ждали (спуск, M621): композиция липнет к площадке — землю не
       перестраиваем, переставляем корабль и пересаживаем полосу у него */
    if(tr.plnCx!=null)return plnLandMove(cur,sx);
  }
  if(cur)plnLandFree(cur);
  PLN.stat.verts=0;
  return C.cur=plnLandMake(tr,p,sx);
}
/* перестановка корабля без перестройки земли: место, высота под ним, подножие трапа, расчистка */
function plnLandMove(L,sx){
  const tr=L.tr,shipU=sx==null?tr.padX:sx,yaw=L.shipYaw,old=L.shipX;
  L.sx=sx;L.shipX=shipU/PLN_M;L.padH=(L.y0-groundAt(tr,shipU))/PLN_M;
  L.rampX=L.shipX+.75*Math.cos(yaw)-4.26*Math.sin(yaw);L.rampZ=7-.75*Math.sin(yaw)-4.26*Math.cos(yaw);
  if(L.flora){const r=plnShipLenM()*.62+4;plnPlantRefit(L,Math.min(old,L.shipX)-r,Math.max(old,L.shipX)+r);}
  return L;
}

/* ── сетки ── */
/* Узел сетки из высот соседей: нормаль и то, как глубоко он сидит ниже тех, кто в трёх клетках
   (ложбины темнее). Высоты лежат с запасом в три клетки, поэтому швов между кусками нет */
function plnLandNode(H,o,gw,dux,dvz,span3){
  const duy=H[o+1]-H[o-1],dvy=H[o+gw]-H[o-gw];
  const n=plnNorm([-dvz*duy,dvz*dux,-dvy*dux]);
  const av=(H[o+3]+H[o-3]+H[o+3*gw]+H[o-3*gw])/4;
  const sp=Math.max(1,Math.hypot(span3,H[o+3*gw]-H[o]));
  return {n,ao:clamp(1-Math.max(0,av-H[o])/sp*2.2,.55,1)};
}
function plnLandRibMesh(L,c){
  const C=PLN_LAND,NT=L.NT,R=L.R,MG=3,i0=c*C.chunk,i1=Math.min(i0+C.chunk,NT-1),nc=i1-i0+1,gw=nc+2*MG,gh=R+2*MG;
  const H=new Float32Array(gw*gh),PAL=PLN_PAL;
  for(let r=0;r<gh;r++){
    const rr=clamp(r-MG,0,R-1);
    for(let i=0;i<gw;i++)H[r*gw+i]=plnLandRibH(L,rr,clamp(i0+i-MG,0,NT-1));
  }
  const X=i=>L.x0+clamp(i0+i-MG,0,NT-1)*L.dx,Z=r=>L.zr[clamp(r-MG,0,R-1)];
  const m=plnMesh((nc*(R+1))*2+16);
  for(let r=0;r<R;r++)for(let i=0;i<nc;i++){
    const gr=r+MG,gi=i+MG,o=gr*gw+gi,h=H[o],x=X(gi),z=Z(gr);
    const q=plnLandNode(H,o,gw,Math.max(1e-3,X(gi+1)-X(gi-1)),Math.max(1e-3,Z(gr+1)-Z(gr-1)),Z(gr+3)-z),slope=1-q.n[1];
    let col=plnLandCol(L,x,z,h,q.n,0);
    /* у воды земля сырая: за гребнем — по урезу ложбины, у пруда — по его уровню */
    if(L.wet&&z>2){const wl=plnLandTab(L,L.lift,x)+C.wRel;col=plnMix3(col,plnMix3(PAL.grassCool,PAL.mud,.6),plnSmooth(wl+.6,wl-.5,h)*.8);}
    if(L.lake&&x>L.lake.x0-8&&x<L.lake.x1+8&&z>L.lake.zn-4&&z<L.lake.zf+4){
      col=plnDressShore(L,x,z,h,col);   /* голый берег, отмель, ил (21pge) */
    }
    /* ступень линии — скала: камень там, где земля под ней и за ней сама идёт круто */
    const st=Math.max(plnSmooth(.5,.7,slope),plnLandTab(L,L.crag,x)*plnSmooth(.16,.34,slope)*plnSmooth(9,5,Math.abs(z)));
    if(st>0)col=plnMix3(col,plnMul(plnMix3(PAL.rockWarm,PAL.rockCool,plnFbm(x*.05+9,z*.05+2,3,L.sd+41)*.5+.5),.74+.26*plnHash(i0+i,r,L.sd+92)),
      (st-plnSmooth(.5,.7,slope))*.8);
    /* в гнезде свечения у земли лежит доля камня */
    plnVert(m,[x,h,z],q.n,col,PLN_MAT.ground,0,st*.85,q.ao);
  }
  for(let r=0;r+1<R;r++)for(let i=0;i+1<nc;i++){
    const a=r*nc+i;
    plnQuad(m,a,a+1,a+nc+1,a+nc);
  }
  /* юбка под ближним краем: снизу в кадр не заглянуть */
  const sk=m.nv,nk=plnNorm([0,.25,-1]);
  for(let i=0;i<nc;i++){
    const o=i*PLN_VS,v=m.v;
    plnVert(m,[v[o],v[o+1]-60,v[o+2]],nk,[v[o+6]*.7,v[o+7]*.7,v[o+8]*.7],PLN_MAT.ground,0,0,.6);
  }
  for(let i=0;i+1<nc;i++)plnQuad(m,sk+i,sk+i+1,i+1,i);
  return m;
}
function plnLandFarMesh(L,J){
  const C=PLN_LAND,NC=plnLandCols(J.b),fz=L.fz,RF=fz.length,MG=3,nc=J.c1-J.c0+1,nr=J.rb-J.ra+1,gw=nc+2*MG,gh=nr+2*MG;
  const H=new Float32Array(gw*gh),K=new Uint8Array(gw*gh),K2=new Uint8Array(gw*gh),W2=new Float32Array(gw*gh),X=new Float32Array(gw*gh);
  /* высоты полосы считаются раз на посадку (M614): куски делят края (запас MG с каждой стороны —
     до двух третей высот куска), и без общей памяти каждая крайняя высота считалась бы по два-четыре
     раза. Память полосы — по рядам, ряд заводится, когда его впервые трогают; пустая высота — NaN */
  const FC=L.farC[J.b]||(L.farC[J.b]=[]),CW=NC+2*MG+1;
  for(let r=0;r<gh;r++){
    const rr=clamp(J.ra+r-MG,0,RF-1),z=fz[rr],e=plnLandE(z);
    let R=FC[rr];
    if(!R)R=FC[rr]={h:new Float32Array(CW).fill(NaN),k:new Uint8Array(CW),k2:new Uint8Array(CW),w2:new Float32Array(CW)};
    for(let i=0;i<gw;i++){
      const o=r*gw+i,ci=J.c0+i,x=-e+(L.len+2*e)*(ci-MG)/NC;
      let h=R.h[ci];
      if(h!==h){h=R.h[ci]=plnLandFarH(L,x,z);R.k[ci]=L.gk;R.k2[ci]=L.gk2;R.w2[ci]=L.gw;}
      X[o]=x;H[o]=h;K[o]=R.k[ci];K2[o]=R.k2[ci];W2[o]=R.w2[ci];
    }
  }
  const Z=r=>fz[clamp(J.ra+r-MG,0,RF-1)];
  /* горы и дальние гряды — камень, хребет — наполовину */
  const stone=k=>k===5||k===7?1:(k===4?.6:0);
  const m=plnMesh(nc*nr*2+16);
  for(let r=0;r<nr;r++)for(let i=0;i<nc;i++){
    const gr=r+MG,gi=i+MG,o=gr*gw+gi,h=H[o],x=X[o],z=Z(gr),k=K[o],w2=W2[o];
    const q=plnLandNode(H,o,gw,X[o+1]-X[o-1],Math.max(1e-3,Z(gr+1)-Z(gr-1)),Z(gr+3)-z);
    let col=plnLandCol(L,x-L.cx0,z,h,q.n,k),st=stone(k);
    if(w2>.01&&K2[o]!==k){col=plnMix3(col,plnLandCol(L,x-L.cx0,z,h,q.n,K2[o]),w2);st=lerp(st,stone(K2[o]),w2);}
    plnVert(m,[x,h,z],q.n,col,PLN_MAT.ground,0,st,q.ao);
  }
  for(let r=0;r+1<nr;r++)for(let i=0;i+1<nc;i++){
    const a=r*nc+i;
    plnQuad(m,a,a+1,a+nc+1,a+nc);
  }
  return m;
}
/* Вода ложбины едет с дальним миром. Дно лежит в цвете вершины: высота ленты (мировая) и дна
   ложбины (на её уровне) — глубину считает шейдер, потому что уровень воды в кадре свой */
function plnLandWaterMesh(L,J){
  const C=PLN_LAND,sx=2,sz=1,z0=4,z1=136,nx=Math.ceil((J.xb-J.xa)/sx),nz=(z1-z0)/sz,m=plnMesh((nx+1)*(nz+1)*2);
  const keep=new Uint8Array((nx+1)*(nz+1));
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=J.xa+i*sx,z=z0+j*sz,f=plnLandFarH(L,x,z),hr=z<=C.zBack?plnLandRibAt(L,x,z):-1e3;
    plnVert(m,[x,C.wRel,z],[0,1,0],[hr,f,0],PLN_MAT.water,0,0,0);
    keep[j*(nx+1)+i]=(C.wRel-f>-.4&&plnLandTab(L,L.liftHi,x)+C.wRel-hr>-.4)?1:0;
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+1,c=a+nx+2,d=a+nx+1;
    if(keep[a]|keep[b]|keep[c]|keep[d])plnQuad(m,a,b,c,d);
  }
  return m;
}
/* пруд стоит в мире, на уровне озера игры */
function plnLandPondMesh(L,J){
  const k=L.lake,sx=L.dx*2,sz=.6,z0=k.zn-2.4,z1=k.zf+2,nx=Math.ceil((J.xb-J.xa)/sx),nz=Math.ceil((z1-z0)/sz),m=plnMesh((nx+1)*(nz+1)*2);
  const keep=new Uint8Array((nx+1)*(nz+1));
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=J.xa+i*sx,z=z0+j*sz,hr=plnLandRibAt(L,x,z);
    plnVert(m,[x,k.level,z],[0,1,0],[hr,-1e3,0],PLN_MAT.water,0,0,0);
    /* вода — только в чаше: за валом бугры склона уходят ниже её уровня, и там она легла бы лужами */
    keep[j*(nx+1)+i]=k.level-hr>-.4&&(Math.abs(z)<2.5||plnLandPond(L,x,z)<1.2)?1:0;
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+1,c=a+nx+2,d=a+nx+1;
    if(keep[a]|keep[b]|keep[c]|keep[d])plnQuad(m,a,b,c,d);
  }
  return m;
}
