/* ══════════════ пещера на движке: порода из сетки игры (M630a) ══════════════
   Порода — одна функция плотности: в камне больше нуля, в воздухе меньше. Её начало —
   сетка игры C.g (22-mode-cave): по клеткам считается расстояние со знаком до соседа
   другого рода (камень +, пустота −, в метрах), чуть сглаженное. На плоскости разреза
   z = 0 знак плотности — это знак клетки: где caveSolidAt говорит «порода», там порода
   и на картинке (набор 91qg-cave меряет это в 400 точках). Вглубь, к z > 0, пустота —
   труба: её глубина идёт за высотой хода (полуразмер hl по столбцу и строке клеток,
   размытый), так что галерея в 4 м высотой уходит вглубь на 4.8 м, зал — до двух своих
   высот. Поверх — пласты по роду камня мира (CUN): уступы, карнизы, что бегут и гаснут,
   швы и шероховатость; у разреза их вдвое меньше, чтобы очерк хода остался ходом игры.
   Над верхом сетки — поверхность мира: всё воздух, и столб устья открыт к небу.
   Сетка граней — surface nets по кускам 8 × 8 м разреза на воксельной сетке 0.25 м;
   слой перед разрезом закрыт, из него выходит плоская грань разреза (своя часть
   индексов: в карту тени фонаря она не идёт). Куски живут в кэше, строятся по бюджету.
   Оси: x вдоль хода, y вверх, z от объектива; метры. Игровые px → м: CAVE_PPM. */
const CAVE_PPM=21/1.8;   /* ящик тела 21 px = 1.8 м */
const CAVE3_CH={s:8,vox:.25,zcap:16,keep:64,ms:8,first:420};
/* пласты по роду камня мира: толщина пласта, доля уступа, вынос карнизов, швы, мелочь;
   цвета пластов (светлый, тёмный), сланец, ржавчина, натёк, осадок на лежащем */
const CAVE3_STY={
  sed:{bed:1.15,ter:.3,off:.5,joint:.1,grit:1,lump:.5,a:"#77736e",b:"#a19c90",sh:"#4f4a4a",rust:"#a0683c",crust:"#e6dfcf",sand:"#8f8672"},
  volc:{bed:.8,ter:.14,off:.75,joint:.26,grit:1.2,lump:.7,a:"#3e3b3e",b:"#5d5752",sh:"#29262a",rust:"#8a4a2c",crust:"#a79c8c",sand:"#5a5048"},
  rock:{bed:1,ter:.24,off:.55,joint:.16,grit:1.1,lump:.6,a:"#6c6a66",b:"#8d8981",sh:"#474543",rust:"#8a5a3a",crust:"#d2ccbe",sand:"#7d7466"},
  ice:{bed:.6,ter:.05,off:.15,joint:.04,grit:.6,lump:.3,a:"#7f98a8",b:"#b9cad4",sh:"#5a6f7e",rust:"#7b9bb0",crust:"#e4eef2",sand:"#9aaab4"},
  sand:{bed:.9,ter:.34,off:.4,joint:.08,grit:1.3,lump:.45,a:"#93765a",b:"#bb9870",sh:"#6a5240",rust:"#a0582c",crust:"#e2cfae",sand:"#b49a74"}};
function cave3StyKind(t){
  return t==="volcanic"?"volc":t==="ice"?"ice":(t==="desert"||t==="sand")?"sand":t==="rocky"||t==="metal"||t==="ruin"?"rock":"sed";
}
/* цвет вершины линейный, как у движка (21p) */
const cave3Hex=plnHex;
/* лист разреза: сланец почти чёрный, пласты — тёмные, бледные чуть светлее */
const CAVE3_CUT={lo:plnHex("#06080c"),mid:plnHex("#0a0e15"),hi:plnHex("#111822")};

/* шум в пространстве −1…1 (тот же, что у стенда docs/look/cv-rock.js) */
function cave3H3(ix,iy,iz,s){
  let h=Math.imul(ix|0,374761393)^Math.imul(iy|0,668265263)^Math.imul(iz|0,1440662683)^Math.imul(s|0,1274126177);
  h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
  return (h>>>0)/4294967296;
}
function cave3N3(x,y,z,s){
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
  const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),uz=fz*fz*(3-2*fz);
  const a=cave3H3(ix,iy,iz,s),b=cave3H3(ix+1,iy,iz,s),c=cave3H3(ix,iy+1,iz,s),d=cave3H3(ix+1,iy+1,iz,s);
  const e=cave3H3(ix,iy,iz+1,s),f=cave3H3(ix+1,iy,iz+1,s),g=cave3H3(ix,iy+1,iz+1,s),h=cave3H3(ix+1,iy+1,iz+1,s);
  const k0=a+(b-a)*ux,k1=c+(d-c)*ux,k2=e+(f-e)*ux,k3=g+(h-g)*ux,m0=k0+(k1-k0)*uy,m1=k2+(k3-k2)*uy;
  return (m0+(m1-m0)*uz)*2-1;
}

/* ── поле разреза из сетки игры: расстояние со знаком и полуразмер хода ── */
function cave3Field(C){
  if(C.f3&&C.f3.g===C.g)return C.f3;
  const NX=CAVE_NX,NY=CAVE_NY,N=NX*NY,g=C.g,cm=CAVE_CS/CAVE_PPM,BIG=1e6;
  /* расстояние фаской (1 и √2) до ближайшей клетки другого рода, два прохода */
  const dist=kind=>{
    const d=new Float32Array(N);
    for(let i=0;i<N;i++)d[i]=g[i]===kind?0:BIG;
    const D2=Math.SQRT2;
    for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
      const i=y*NX+x;let v=d[i];if(!v)continue;
      if(x>0)v=Math.min(v,d[i-1]+1);
      if(y>0){v=Math.min(v,d[i-NX]+1);if(x>0)v=Math.min(v,d[i-NX-1]+D2);if(x<NX-1)v=Math.min(v,d[i-NX+1]+D2);}
      d[i]=v;
    }
    for(let y=NY-1;y>=0;y--)for(let x=NX-1;x>=0;x--){
      const i=y*NX+x;let v=d[i];if(!v)continue;
      if(x<NX-1)v=Math.min(v,d[i+1]+1);
      if(y<NY-1){v=Math.min(v,d[i+NX]+1);if(x<NX-1)v=Math.min(v,d[i+NX+1]+D2);if(x>0)v=Math.min(v,d[i+NX-1]+D2);}
      d[i]=v;
    }
    return d;
  };
  const toVoid=dist(0),toRock=dist(1),raw=new Float32Array(N);
  for(let i=0;i<N;i++)raw[i]=g[i]?(Math.min(toVoid[i],40)-.5)*cm:-(Math.min(toRock[i],40)-.5)*cm;
  /* сглаживание 1-2-1 в обе стороны: ступени клеток уходят, знак в глубине остаётся */
  const blur=(a,w)=>{
    const t=new Float32Array(N),o=new Float32Array(N);
    for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
      const i=y*NX+x,l=x>0?a[i-1]:a[i],r=x<NX-1?a[i+1]:a[i];t[i]=(l+w*a[i]+r)/(w+2);}
    for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
      const i=y*NX+x,u=y>0?t[i-NX]:t[i],d=y<NY-1?t[i+NX]:t[i];o[i]=(u+w*t[i]+d)/(w+2);}
    return o;
  };
  const sd=blur(raw,2);
  /* полуразмер хода: меньший из пробегов пустоты по столбцу и по строке, пополам */
  const run=new Float32Array(N);
  for(let y=0;y<NY;y++){
    let x=0;
    while(x<NX){if(g[y*NX+x]){x++;continue;}let e=x;while(e<NX&&!g[y*NX+e])e++;for(let k=x;k<e;k++)run[y*NX+k]=e-x;x=e;}
  }
  for(let x=0;x<NX;x++){
    let y=0;
    while(y<NY){if(g[y*NX+x]){y++;continue;}let e=y;while(e<NY&&!g[e*NX+x])e++;
      for(let k=y;k<e;k++){const i=k*NX+x;run[i]=Math.min(run[i],e-y);}y=e;}
  }
  /* размытие по пустоте ящиком в 11 клеток, дважды: труба меняет глубину плавно */
  let hv=new Float32Array(N),wv=new Float32Array(N);
  for(let i=0;i<N;i++){wv[i]=g[i]?0:1;hv[i]=g[i]?0:run[i]*cm*.5;}
  const box=(a,R,horiz)=>{
    const o=new Float32Array(N),L=horiz?NX:NY,M=horiz?NY:NX,st=horiz?1:NX,rs=horiz?NX:1;
    for(let m=0;m<M;m++){
      const b=m*rs;let s=0;
      for(let k=-R;k<=R;k++)s+=a[b+clamp(k,0,L-1)*st];
      for(let k=0;k<L;k++){o[b+k*st]=s;s+=a[b+clamp(k+R+1,0,L-1)*st]-a[b+clamp(k-R,0,L-1)*st];}
    }
    return o;
  };
  for(let it=0;it<2;it++){hv=box(box(hv,5,true),5,false);wv=box(box(wv,5,true),5,false);}
  const hl=new Float32Array(N);
  for(let i=0;i<N;i++)hl[i]=wv[i]>1e-3?clamp(hv[i]/wv[i],.6,4.5):1.5;
  const sty=CAVE3_STY[cave3StyKind(G.surf&&G.surf.p&&G.surf.p.type)];
  const lay={off:new Float32Array(128),tone:new Float32Array(128),shale:new Uint8Array(128)};
  for(let k=0;k<128;k++){
    lay.off[k]=(cave3H3(k,3,41,C.seed)-.5);lay.tone[k]=cave3H3(k,7,43,C.seed);lay.shale[k]=cave3H3(k,11,47,C.seed)<.16?1:0;
    if(lay.shale[k])lay.off[k]=.4+.24*cave3H3(k,13,49,C.seed);
  }
  const col={a:cave3Hex(sty.a),b:cave3Hex(sty.b),sh:cave3Hex(sty.sh),rust:cave3Hex(sty.rust),crust:cave3Hex(sty.crust),sand:cave3Hex(sty.sand),
    moss:cave3Hex("#3f7a62"),mossSun:cave3Hex("#6f9440")};
  /* устье: ось столба у верха сетки — для дневного света и мха */
  let mx=0,mn=0;
  for(let x=0;x<NX&&x<60;x++)if(!g[2*NX+x]){mx+=x;mn++;}
  const mouthX=mn?(mx/mn+.5)*CAVE_CS/CAVE_PPM:60/CAVE_PPM;
  C.f3={g,raw,sd,hl,sty,lay,col,mouthX,surfY:-CAVE_Y0/CAVE_PPM,seed:C.seed};
  return C.f3;
}
/* билинейная выборка поля по центрам клеток; x, y — px игры */
function cave3Samp(a,x,y){
  const fx=clamp(x/CAVE_CS-.5,0,CAVE_NX-1.001),fy=clamp((y-CAVE_Y0)/CAVE_CS-.5,0,CAVE_NY-1.001);
  const ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy,i=iy*CAVE_NX+ix;
  const a0=a[i]+(a[i+1]-a[i])*tx,a1=a[i+CAVE_NX]+(a[i+CAVE_NX+1]-a[i+CAVE_NX])*tx;
  return a0+(a1-a0)*ty;
}
/* расстояние со знаком на разрезе, м: над верхом сетки — воздух мира, столб устья открыт */
function cave3Sd(F,x,y){
  const s=cave3Samp(F.sd,x,Math.max(y,CAVE_Y0+CAVE_CS*.5));
  return Math.min(s,(y-CAVE_Y0)/CAVE_PPM);
}
/* плотность в метрах мира: > 0 — камень */
function cave3Den(F,X,Y,Z){
  const x=X*CAVE_PPM,y=-Y*CAVE_PPM;
  let D=cave3Sd(F,x,y);
  if(D>3.2)return D+Math.max(0,Z-14);
  const S=F.sty,am=.35+.65*plnSmooth(0,1.2,Z);
  const s0=Y-.06*X+.25*Math.sin(X*.09+Z*.05),sb=(s0+.28*Math.sin(s0*1.9+.7))/S.bed,L=Math.floor(sb);
  /* уступ: внутри пласта грань стоит, между пластами лежит — выборка сдвигается вверх-вниз */
  if(S.ter>0){const sh=(.5-(sb-L))*S.ter*S.bed*am/(1+.532*Math.cos(s0*1.9+.7));D=cave3Sd(F,x,y-sh*CAVE_PPM);}
  const hl=cave3Samp(F.hl,x,Math.max(y,CAVE_Y0)),zd=Math.min(CAVE3_CH.zcap-4,hl*lerp(2.4,4,plnSmooth(3,6,hl))+.6),t=Z/zd;
  let d=D+(t<1?hl*(1-Math.sqrt(1-t*t)):hl+(Z-zd));
  if(d>2.2||d<-2.2)return d;
  /* карниз бежит несколько метров и гаснет; швы рубят пласт на блоки; камень шершав */
  const jx=Math.floor((X+L*1.7)/3.4),jz=Math.floor((Z+L*2.3)/4.2),rn=.15+.85*plnSmooth(-.3,.3,cave3N3(X*.11+L*.7,L*.37,Z*.11,115));
  d-=(F.lay.off[(L+64)&127]*S.off*rn+(cave3H3(jx,L,jz,77)-.5)*S.joint)*am;
  d+=(.10*cave3N3(X*.9,Y*.9,Z*.9,5)+.045*cave3N3(X*2.3,Y*2.3,Z*2.3,9))*S.grit*am;
  /* глубже разреза стена бугрится: натёки и глыбы, по которым скользит фонарь; у разреза — гладко, сетка игры цела */
  const lz=plnSmooth(.9,3.2,Z);
  if(lz>0)d+=(.62*cave3N3(X*.34,Y*.5,Z*.34,21)+.3*cave3N3(X*.9,Y*1.2,Z*.9,23))*S.lump*lz;
  return d;
}
/* пол под точкой воздуха (м): для ног человека на картинке */
function cave3Down(F,X,Y,Z){
  let a=Y;
  for(let n=0;n<40&&cave3Den(F,X,a-.1,Z)<=0;n++)a-=.1;
  let lo=a-.1,hi=a;
  for(let n=0;n<10;n++){const m=(lo+hi)/2;if(cave3Den(F,X,m,Z)>0)lo=m;else hi=m;}
  return (lo+hi)/2;
}
/* цвет камня в точке: rgb и мокрость; ny — куда смотрит грань */
const CAVE3_INK=new Float32Array(4);
function cave3Paint(F,X,Y,Z,ny){
  const S=F.sty,K=F.col,s0=Y-.06*X+.25*Math.sin(X*.09+Z*.05),k=(Math.floor((s0+.28*Math.sin(s0*1.9+.7))/S.bed)+64)&127,o=CAVE3_INK;
  let c=plnMix3(K.a,K.b,F.lay.tone[k]);
  if(F.lay.shale[k])c=plnMix3(c,K.sh,.85);
  const big=cave3N3(X*.22,Y*.22,Z*.22,21),mid=cave3N3(X*.8,Y*.8,Z*.8,23),m=1+.14*big+.07*mid;
  c=[c[0]*m,c[1]*m,c[2]*m];
  c=plnMix3(c,K.rust,plnSmooth(.45,.8,cave3N3(X*.35+9,Y*.6,Z*.35,25))*.45);
  /* вода по стене оставила светлую корку */
  const run=plnSmooth(.35,.7,cave3N3(X*.55,Y*.1,Z*.55,27))*plnSmooth(.95,.55,Math.abs(ny));
  c=plnMix3(c,K.crust,run*.7);
  let wet=run*.7;
  c=plnMix3(c,K.sand,plnSmooth(.72,.95,ny)*.55);
  /* мох там, куда достаёт день: у столба устья и под ним */
  const dm=Math.abs(X-F.mouthX),day=(1-plnSmooth(2.5,9.5,dm))*plnSmooth(F.surfY-16,F.surfY-6,Y);
  if(day>.01){
    const patch=Math.max(plnSmooth(-.45,.2,cave3N3(X*.31+4,Y*.31,Z*.31,29)+.35*mid),plnSmooth(.4,.85,day)*.9);
    c=plnMix3(c,plnMix3(K.moss,K.mossSun,plnSmooth(.4,1,day)*plnSmooth(.3,.9,ny)),day*plnSmooth(-.25,.5,ny+.4*mid)*.85*patch);
  }
  o[0]=c[0];o[1]=c[1];o[2]=c[2];o[3]=wet;
  return o;
}
/* ── кусок: surface nets на воксельной сетке ──
   Точки куска лежат на [X0 − v, X0 + s] и [Y0 − v, Y0 + s]: полоса с низкой стороны общая с соседом,
   поэтому вершины на стыке те же и шва нет. Нормали копятся со всех рёбер, грани кладутся только
   со своих (основание ребра в пределах куска). Слой k = 0 лежит перед разрезом и закрыт (воздух):
   грань между ним и первым слоем — грань разреза. Возвращает вершины (по PLN_VS чисел), индексы
   породы и разреза подряд, nRock — сколько индексов у породы */
function cave3Chunk(F,ci,cj){
  const s=CAVE3_CH.s,v=CAVE3_CH.vox,X0=ci*s,Y0=cj*s,n0=Math.round(s/v),NI=n0+2,NJ=NI;
  const px=i=>X0+(i-1)*v,py=j=>Y0+(j-1)*v;
  /* глубина куска — по самой глубокой трубе в нём; пустоту ищем по каждой клетке сетки:
     пропущенный пузырь пустоты остался бы без задней стены, дырой в фон */
  let hm=0,dmin=1e9;
  {
    const cx0=Math.max(0,Math.floor((X0-v-.5)*CAVE_PPM/CAVE_CS)),cx1=Math.min(CAVE_NX-1,Math.floor((X0+s+.5)*CAVE_PPM/CAVE_CS));
    const yt=-(Y0+s+.5)*CAVE_PPM,yb=-(Y0-v-.5)*CAVE_PPM;
    if(yt<CAVE_Y0)dmin=Math.min(dmin,(yt-CAVE_Y0)/CAVE_PPM);
    const cy0=Math.max(0,Math.floor((yt-CAVE_Y0)/CAVE_CS)),cy1=Math.min(CAVE_NY-1,Math.floor((yb-CAVE_Y0)/CAVE_CS));
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
      const i=cy*CAVE_NX+cx;
      if(F.sd[i]<dmin)dmin=F.sd[i];
      if(F.hl[i]>hm&&F.sd[i]<2)hm=F.hl[i];
    }
  }
  const zmax=dmin>4?v*2:Math.min(CAVE3_CH.zcap,hm*4+3),NK=Math.max(3,Math.ceil(zmax/v)+2);
  const zk=k=>(k-.5)*v,sJ=NI,sK=NI*NJ,V=new Float32Array(NI*NJ*NK).fill(NaN);
  /* блоки 4×4×4: далёкий от грани блок — одним числом */
  const BI=Math.ceil((NI-1)/4),BJ=BI,BK=Math.ceil((NK-2)/4);
  for(let bk=0;bk<BK;bk++)for(let bj=0;bj<BJ;bj++)for(let bi=0;bi<BI;bi++){
    const i0=bi*4,j0=bj*4,k0=1+bk*4,i1=Math.min(i0+4,NI-1),j1=Math.min(j0+4,NJ-1),k1=Math.min(k0+4,NK-1);
    const d=cave3Den(F,(px(i0)+px(i1))/2,(py(j0)+py(j1))/2,zk((k0+k1)/2));
    /* у задней стены трубы плотность круто растёт по глубине: блок пропускаем, только если и его
       ближний, и дальний край по глубине так же далеки от грани */
    const th=v*4.5+.8,cxm=(px(i0)+px(i1))/2,cym=(py(j0)+py(j1))/2;
    const far=e=>(e>0)===(d>0)&&Math.abs(e)>th;
    const fill=far(d)&&far(cave3Den(F,cxm,cym,zk(k0)))&&far(cave3Den(F,cxm,cym,zk(k1)));
    for(let k=k0;k<=k1;k++){const z=zk(k);for(let j=j0;j<=j1;j++){
      let n=i0+sJ*j+sK*k;const y=py(j);
      for(let i=i0;i<=i1;i++,n++)if(V[n]!==V[n])V[n]=fill?d:cave3Den(F,px(i),y,z);}}
  }
  for(let n=0;n<sK;n++)V[n]=-Math.abs(V[n+sK]);
  const CI=NI-1,CJ=NJ-1,CK=NK-1,cell=new Int32Array(CI*CJ*CK).fill(-1);
  let cap=4096,P=new Float32Array(cap*3),nv=0;
  const E=[0,1,2,3,4,5,6,7,0,2,1,3,4,6,5,7,0,4,1,5,2,6,3,7],cv=new Float32Array(8);
  for(let k=0;k<CK;k++)for(let j=0;j<CJ;j++){
    let n=sJ*j+sK*k;
    for(let i=0;i<CI;i++,n++){
      cv[0]=V[n];cv[1]=V[n+1];cv[2]=V[n+sJ];cv[3]=V[n+sJ+1];
      cv[4]=V[n+sK];cv[5]=V[n+sK+1];cv[6]=V[n+sK+sJ];cv[7]=V[n+sK+sJ+1];
      let pos=0;for(let c=0;c<8;c++)if(cv[c]>0)pos++;
      if(pos===0||pos===8)continue;
      let ax=0,ay=0,az=0,cnt=0;
      for(let e=0;e<24;e+=2){
        const p=E[e],r=E[e+1],va=cv[p],vb=cv[r];
        if((va>0)===(vb>0))continue;
        const t=va/(va-vb);
        ax+=(p&1)+((r&1)-(p&1))*t;ay+=(p>>1&1)+((r>>1&1)-(p>>1&1))*t;az+=(p>>2)+((r>>2)-(p>>2))*t;cnt++;
      }
      if(nv===cap){cap*=2;const b=new Float32Array(cap*3);b.set(P);P=b;}
      P[nv*3]=px(i)+ax/cnt*v;P[nv*3+1]=py(j)+ay/cnt*v;P[nv*3+2]=zk(k+az/cnt);
      cell[i+CI*(j+CJ*k)]=nv++;
    }
  }
  /* грани: по четырёхугольнику у каждого ребра, которое пересекает поверхность; лицом в воздух */
  const N=new Float32Array(nv*3),cutOf=new Int32Array(nv).fill(-1),cutP=[],IR=[],IC=[];
  const cid=(i,j,k)=>(i<0||j<0||k<0||i>=CI||j>=CJ||k>=CK)?-1:cell[i+CI*(j+CJ*k)];
  const own=(i,j)=>i>=1&&i<=n0&&j>=1&&j<=n0;
  function quad(c0,c1,c2,c3,vx,vy,vz,front,mine){
    if(c0<0||c1<0||c2<0||c3<0)return;
    const ax=P[c1*3]-P[c0*3],ay=P[c1*3+1]-P[c0*3+1],az=P[c1*3+2]-P[c0*3+2];
    const bx=P[c3*3]-P[c0*3],by=P[c3*3+1]-P[c0*3+1],bz=P[c3*3+2]-P[c0*3+2];
    const ux=P[c2*3]-P[c1*3],uy=P[c2*3+1]-P[c1*3+1],uz=P[c2*3+2]-P[c1*3+2];
    const wx=P[c2*3]-P[c3*3],wy=P[c2*3+1]-P[c3*3+1],wz=P[c2*3+2]-P[c3*3+2];
    let nx=ay*bz-az*by+(wy*uz-wz*uy),ny=az*bx-ax*bz+(wz*ux-wx*uz),nz=ax*by-ay*bx+(wx*uy-wy*ux),flip=false;
    if(nx*vx+ny*vy+nz*vz<0){nx=-nx;ny=-ny;nz=-nz;flip=true;}
    const e1=flip?c3:c1,e3=flip?c1:c3;
    if(front){
      if(!mine)return;
      const id=c=>{if(cutOf[c]<0){cutOf[c]=cutP.length;cutP.push(c);}return cutOf[c];};
      IC.push(id(c0),id(e1),id(c2),id(c0),id(c2),id(e3));return;
    }
    for(const c of [c0,c1,c2,c3]){N[c*3]+=nx;N[c*3+1]+=ny;N[c*3+2]+=nz;}
    if(mine)IR.push(c0,e1,c2,c0,c2,e3);
  }
  for(let k=0;k<NK;k++)for(let j=0;j<NJ;j++){
    let n=sJ*j+sK*k;
    for(let i=0;i<NI;i++,n++){
      const a=V[n],sg=a>0?1:-1,m=own(i,j);
      if(i<CI&&(V[n+1]>0)!==(a>0))quad(cid(i,j-1,k-1),cid(i,j,k-1),cid(i,j,k),cid(i,j-1,k),sg,0,0,false,m);
      if(j<CJ&&(V[n+sJ]>0)!==(a>0))quad(cid(i-1,j,k-1),cid(i,j,k-1),cid(i,j,k),cid(i-1,j,k),0,sg,0,false,m);
      if(k<CK&&(V[n+sK]>0)!==(a>0))quad(cid(i-1,j-1,k),cid(i,j-1,k),cid(i,j,k),cid(i-1,j,k),0,0,sg,k===0,m);
    }
  }
  /* краска: порода берёт пласт, мокрость и открытость воздуха перед собой; грань разреза —
     тёмный лист, в нормали путь к пустоте в плоскости разреза, в запасе — далеко ли она */
  const nc=cutP.length,out=new Float32Array((nv+nc)*PLN_VS);
  for(let c=0;c<nv;c++){
    const x=P[c*3],y=P[c*3+1],z=P[c*3+2],l=Math.hypot(N[c*3],N[c*3+1],N[c*3+2])||1,nx=N[c*3]/l,ny=N[c*3+1]/l,nz=N[c*3+2]/l;
    const ink=cave3Paint(F,x,y,z,ny);
    const a=clamp(-cave3Den(F,x+nx*.4,y+ny*.4,z+nz*.4)/.4,0,1),b=clamp(-cave3Den(F,x+nx*1.6,y+ny*1.6,z+nz*1.6)/1.6,0,1);
    const o=c*PLN_VS;
    out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=nx;out[o+4]=ny;out[o+5]=nz;out[o+6]=ink[0];out[o+7]=ink[1];out[o+8]=ink[2];
    out[o+9]=PLN_MAT.rock;out[o+10]=0;out[o+11]=ink[3];out[o+12]=a*(.35+.65*b);
  }
  for(let c=0;c<nc;c++){
    const p=cutP[c],x=P[p*3],y=P[p*3+1],z=P[p*3+2],zc=.08;
    const dv=cave3Den(F,x,y,zc),gx=cave3Den(F,x+.06,y,zc)-cave3Den(F,x-.06,y,zc),gy=cave3Den(F,x,y+.06,zc)-cave3Den(F,x,y-.06,zc),gl=Math.hypot(gx,gy)||1;
    const o=(nv+c)*PLN_VS;
    const s0=y-.06*x+.25*Math.sin(x*.09),kb=(Math.floor((s0+.28*Math.sin(s0*1.9+.7))/F.sty.bed)+64)&127,big=cave3N3(x*.13,y*.13,3,31);
    const cc=F.lay.shale[kb]?CAVE3_CUT.lo:plnMix3(CAVE3_CUT.mid,CAVE3_CUT.hi,plnSmooth(.45,1,F.lay.tone[kb])*(.75+.25*big)),cm=1+.18*big;
    out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=-gx/gl;out[o+4]=-gy/gl;out[o+5]=0;out[o+6]=cc[0]*cm;out[o+7]=cc[1]*cm;out[o+8]=cc[2]*cm;
    out[o+9]=CAVE3_MAT.cut;out[o+10]=0;out[o+11]=0;out[o+12]=clamp(dv,0,4);
  }
  const I=new Uint32Array(IR.length+IC.length);
  I.set(IR,0);for(let k=0;k<IC.length;k++)I[IR.length+k]=IC[k]+nv;
  return {v:out,i:I,nv:nv+nc,ni:I.length,nRock:IR.length};
}
/* материалы пещеры сверх десяти общих */
const CAVE3_MAT={cut:10,drip:11,crystal:12};

/* ── кэш кусков: что видно — строится по бюджету, ближние к человеку первыми ── */
function cave3Chunks(C,box,mx,my,first){
  const F=cave3Field(C),s=CAVE3_CH.s,Q=C.ch3||(C.ch3={m:new Map(),gen:-1,t:0});
  if(Q.gen!==PLN_GPU.gen){for(const k of Q.m.values())plnGeoFree(k.geo);Q.m.clear();Q.gen=PLN_GPU.gen;}
  Q.t++;
  const i0=Math.floor(box[0]/s),i1=Math.floor(box[1]/s),j0=Math.floor(box[2]/s),j1=Math.floor(box[3]/s),want=[],list=[];
  const xs=CAVE_W/CAVE_PPM,yb=-CAVE_Y1/CAVE_PPM,yt=F.surfY+2;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    if((i+1)*s<0||i*s>xs||(j+1)*s<yb||j*s>yt)continue;
    const k=i+","+j,c=Q.m.get(k);
    if(c){c.t=Q.t;if(c.geo)list.push(c);}else want.push([i,j,Math.hypot((i+.5)*s-mx,(j+.5)*s-my)]);
  }
  want.sort((a,b)=>a[2]-b[2]);
  const t0=wallMs(),lim=first?CAVE3_CH.first:CAVE3_CH.ms;
  let built=0;
  for(const [i,j] of want){
    if(built&&wallMs()-t0>lim)break;
    const m=cave3Chunk(F,i,j),c={i,j,t:Q.t,nRock:m.nRock,geo:m.ni?plnGeo(m):null};
    Q.m.set(i+","+j,c);if(c.geo)list.push(c);built++;
  }
  /* лишнее — по давности */
  if(Q.m.size>CAVE3_CH.keep){
    const old=[...Q.m.entries()].filter(e=>e[1].t!==Q.t).sort((a,b)=>a[1].t-b[1].t);
    for(let k=0;k<old.length&&Q.m.size>CAVE3_CH.keep;k++){plnGeoFree(old[k][1].geo);Q.m.delete(old[k][0]);}
  }
  Q.left=want.length-built;Q.built=built;
  return list;
}
