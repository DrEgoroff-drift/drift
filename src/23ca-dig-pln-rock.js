/* ══════════════ шахта на движке: порода из выработки (M631a) ══════════════
   Порода — одна функция плотности, как в пещере (22da): в камне больше нуля, в воздухе меньше.
   Её начало — клетки игры: выкопанная клетка (D.cells «col,row».dug) — комната 2.29 × 2.29 м и
   2.8 м вглубь от разреза. Комната тянется на полклетки в выкопанного соседа, поэтому ход из
   нескольких клеток — один ход без перемычек, а скругляются только углы у камня. Пол — ровно по
   низу клетки: на нём стоит человек игры. В стволе раз в одиннадцать рядов — камера (как у 2D,
   23a digVoidPath): шире на 0.6 м и вдвое глубже. Верх породы — земля планеты в этом месте
   (23cd: таблица высот рельефа вокруг устья, F.tab): по разрезу ровно её линия, за разрезом —
   на четверть метра ниже, чтобы сверху всегда лежала сама планета с травой. Без планеты — старая
   линия (digSurfY, 23aa — та же кривая, что считает игра). Цвет — пласты геологии планеты (geologyOf, глубина × DIG_GEO_K, как у строки места),
   под дёрном подпочва (digSoilCols); рудное тело (oreNode) — тусклым оранжевым по его центру и
   радиусу. Лист разреза (z = 0) — тёмный, пласты на нём читаются.
   Сетка граней — surface nets по кускам 8 × 8 м на вокселях 0.25 м (счёт 22da cave3Chunk, своя
   глубина куска: камень без комнат — только лист, комнаты — 4.4 м, у поверхности — 16 м). Новая
   клетка помечает куски рядом устаревшими: старая сетка рисуется, пока новая не построится.
   Оси как в пещере: x вдоль разреза, y вверх, z от объектива; метры. Человек 23.6 px = 1.8 м. */
const DIG3_PPM=23.6/1.8;
const DIG3_CM=DIG_CELL/DIG3_PPM;
/* комната: глубина, глубина камеры, скругление угла, вынос стены в камень, сглаживание стыка */
const DIG3_ROOM={zd:2.8,hall:5.2,wide:.6,r:.42,e:.14,k:.35};
const DIG3_CH={s:8,vox:.25,zcap:16,keep:80,ms:8,first:420};

function dig3Hash(c,r){return (hashi(c,r,0xD16C)>>>8)/16777216;}
function dig3Dug(F,c,r){return c>=-MINE_HALF&&c<=MINE_HALF&&r>=0&&r<F.NR&&F.g[r*F.NC+c+MINE_HALF]===1;}
/* околоствольный двор: ствол на ряду горизонта (рудник, 23cc) — шире и вдвое глубже */
function dig3Hall(F,c,r){return c===0&&r>0&&mineIsLevel(r)&&dig3Dug(F,0,r-1);}
function dig3Smin(a,b,k){const h=clamp(.5+.5*(b-a)/k,0,1);return lerp(b,a,h)-k*h*(1-h);}
function dig3Smax(a,b,k){return -dig3Smin(-a,-b,k);}

/* ── поле выработки: клетки игры сеткой; пересобирается, когда игра копнула (D.maskV, 23-mode-dig) ── */
function dig3Field(D){
  const Q=DIG3.f,v=D.maskV|0;
  if(Q&&Q.D===D&&Q.v===v)return Q;
  let rmax=0;
  for(const k in D.cells){if(!D.cells[k].dug)continue;const r=+k.slice(k.indexOf(",")+1);if(r>rmax)rmax=r;}
  const NC=2*MINE_HALF+1,NR=rmax+2,g=new Uint8Array(NC*NR);
  for(const k in D.cells){
    if(!D.cells[k].dug)continue;
    const i=k.indexOf(","),c=+k.slice(0,i),r=+k.slice(i+1);
    if(Math.abs(c)<=MINE_HALF&&r>=0&&r<NR)g[r*NC+c+MINE_HALF]=1;
  }
  let F=Q&&Q.D===D?Q:null;
  if(!F){
    const p=D.p,seed=((p.seed|0)^0x3D16)&0xFFFF,sty=CAVE3_STY[cave3StyKind(p.type)];
    const lay={tone:new Float32Array(128),shale:new Uint8Array(128)};
    for(let k=0;k<128;k++){lay.tone[k]=cave3H3(k,7,43,seed);lay.shale[k]=cave3H3(k,11,47,seed)<.14?1:0;}
    const lin=c=>[Math.pow(c[0]/255,2.2),Math.pow(c[1]/255,2.2),Math.pow(c[2]/255,2.2)];
    const so=digSoilCols(p),pal=(p.T&&p.T.pal)||[[90,88,86]];
    const geo=geologyOf(p).map(l=>({d0:l.d0,th:l.th,c:lin(l.col)}));
    /* пласты на разрезе реже пещерных: кадр шахты вдвое дальше от камня */
    F={D,p,seed,sty,lay,geo,turf:lin(so.turf),sub:lin(so.sub),top:lin(pal[Math.min(3,pal.length-1)]),
      sa:cave3Hex(sty.a),sb:cave3Hex(sty.b),sh:cave3Hex(sty.sh),rust:cave3Hex(sty.rust),bed:sty.bed*1.6,air:so.air,nk:[],gen:0};
    /* земля над рудником — та, что у планеты в этом месте (23cd); без кадра планеты — кривая игры */
    const T=dig3TopAt(D);
    F.tab=T?dig3TopTab(T):null;
  }
  F.v=v;F.g=g;F.NC=NC;F.NR=NR;F.gen++;
  DIG3.f=F;
  return F;
}
/* линия поверхности на разрезе, м (y вверх): земля планеты над рудником (23cd), без неё — кривая игры */
function dig3Ground(F,X){return F.tab?dig3TabAt(F.tab,X,0):-digSurfY(F.p,X*DIG3_PPM)/DIG3_PPM;}
/* земля за разрезом. С планетой — её земля; за разрезом камень на четверть метра ниже, сверху видна
   трава. Без неё — линия игры, вдали гряда поднимается к горизонту и закрывает конец кусков */
function dig3Land(F,X,Z){
  if(F.tab)return dig3TabAt(F.tab,X,Math.max(Z,0))-DIG3_TOP.sink*plnSmooth(.12,.45,Z);
  const g=dig3Ground(F,X);
  if(Z<=.4)return g;
  const k=plnSmooth(.4,15,Z);
  return g+k*(1.1+1.3*cave3N3(X*.055,.5,Z*.05,F.seed)+.45*cave3N3(X*.2,1.5,Z*.18,F.seed+7));
}
/* пустота в плоскости разреза: < 0 — комната; DIG3_VZ[0] — её глубина вглубь, м */
const DIG3_VZ=new Float32Array(1);
function dig3Void(F,X,Y){
  const CM=DIG3_CM,R=DIG3_ROOM,c0=Math.floor(X/CM),r0=Math.floor(-Y/CM);
  let d=9,hw=0;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const c=c0+dc,r=r0+dr;
    if(!dig3Dug(F,c,r))continue;
    const h=dig3Hall(F,c,r),w=h?R.wide:0,hc=CM*.5;
    const x0=c*CM-(dig3Dug(F,c-1,r)?hc:R.e+w),x1=(c+1)*CM+(dig3Dug(F,c+1,r)?hc:R.e+w);
    const y1=-r*CM+(dig3Dug(F,c,r-1)?hc:R.e),y0=-(r+1)*CM-(dig3Dug(F,c,r+1)?hc:0);
    const rr=R.r*(.75+.5*dig3Hash(c,r)),hx=(x1-x0)/2,hy=(y1-y0)/2;
    const qx=Math.abs(X-(x0+x1)/2)-(hx-rr),qy=Math.abs(Y-(y0+y1)/2)-(hy-rr);
    const s=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-rr;
    d=d>8?s:dig3Smin(d,s,R.k);
    if(h)hw=Math.max(hw,1-plnSmooth(-.4,1.2,s));
  }
  DIG3_VZ[0]=lerp(R.zd,R.hall,hw);
  return d;
}
/* плотность, м: > 0 — камень */
function dig3Den(F,X,Y,Z){
  const g=dig3Land(F,X,Z)-Y;
  if(g<-2.5)return g;
  let d=g;
  const v=dig3Void(F,X,Y);
  if(v<4){
    /* свод: кровля сходит в заднюю стену дугой (радиус до 1 м), почва — почти прямым углом;
       стык круглым скруглением, радиус по высоте в клетке */
    const zd=DIG3_VZ[0],fr=-Y/DIG3_CM-Math.floor(-Y/DIG3_CM),rr=lerp(1,.22,plnSmooth(.25,.75,fr));
    const ux=Math.max(rr+v,0),uz=Math.max(rr+Z-zd,0);
    d=Math.min(d,Math.min(-rr,Math.max(v,Z-zd))+Math.hypot(ux,uz));
  }
  if(d>2||d<-2)return d;
  /* камень шершав; у разреза вполовину — на линии ходьбы клетка игры остаётся клеткой */
  const am=.35+.65*plnSmooth(0,1,Z);
  d+=(.08*cave3N3(X*.9,Y*.9,Z*.9,5)+.04*cave3N3(X*2.3,Y*2.3,Z*2.3,9))*F.sty.grit*am;
  /* сколы по стенам комнат глубже разреза — забой ровным не бывает */
  if(Z>.5&&v<1.2)d+=.16*cave3N3(X*.6,Y*.7,Z*.6,21)*plnSmooth(.5,1.6,Z);
  return d;
}
/* рудные тела рядом с куском: центр и радиус в метрах, цвет (линейный) */
function dig3Nodes(F,x0,x1,y0,y1){
  const D=F.D,CM=DIG3_CM,out=[];
  const c0=Math.floor(x0/CM)-3,c1=Math.floor(x1/CM)+3,r0=Math.max(0,Math.floor(-y1/CM)-3),r1=Math.floor(-y0/CM)+3;
  if(r1<0)return out;
  for(let nr=Math.floor(r0/ORE_NODE_H);nr<=Math.floor(r1/ORE_NODE_H);nr++)
    for(let nc=Math.floor(c0/ORE_NODE_W);nc<=Math.floor(c1/ORE_NODE_W);nc++){
      const n=oreNode(D,nc,nr);
      if(!n||!RES[n.res])continue;
      out.push({x:(n.cx+.5)*CM,y:-(n.cy+.5)*CM,r:n.rad*CM,c:plnHex(RES[n.res].col)});
    }
  return out;
}
/* цвет камня в точке: rgb (линейный) и мокрость; ny — куда смотрит грань */
function dig3Paint(F,X,Y,Z,ny){
  const o=CAVE3_INK,P=DIG3_PPM,S=F.sty,L=F.geo;
  /* пласт геологии на этой глубине; граница пластов волнистая и мягкая (четверть метра) */
  const dg=Math.max(0,-Y*P)*DIG_GEO_K+2.2*cave3N3(X*.12,Y*.04,Z*.1,F.seed+3),bw=.3*P*DIG_GEO_K;
  let i=0;while(i<L.length-1&&dg>=L[i].d0+L[i].th)i++;
  let c=L[i].c;
  if(i>0&&dg-L[i].d0<bw)c=plnMix3(L[i-1].c,c,.5+.5*(dg-L[i].d0)/bw);
  else if(i<L.length-1&&L[i].d0+L[i].th-dg<bw)c=plnMix3(c,L[i+1].c,.5-.5*(L[i].d0+L[i].th-dg)/bw);
  /* камень — рода пещеры (светлый/тёмный по пласту), пласт геологии даёт ему свой оттенок при той же
     светлоте: иначе зелёная палитра мира красит весь разрез в зелень (правило богатой палитры) */
  const s0=Y-.06*X+.25*Math.sin(X*.09+Z*.05),kb=(Math.floor((s0+.28*Math.sin(s0*1.9+.7))/F.bed)+64)&127;
  const st=plnMix3(F.sa,F.sb,F.lay.tone[kb]),lg=.2126*c[0]+.7152*c[1]+.0722*c[2]+1e-4,ls=.2126*st[0]+.7152*st[1]+.0722*st[2],kl=ls/lg;
  c=plnMix3(st,[c[0]*kl,c[1]*kl,c[2]*kl],.4);
  if(F.lay.shale[kb])c=plnMix3(c,F.sh,.65);
  const big=cave3N3(X*.22,Y*.22,Z*.22,21),mid=cave3N3(X*.8,Y*.8,Z*.8,23),m=1+.13*big+.06*mid;
  c=[c[0]*m,c[1]*m,c[2]*m];
  /* ржавчина — потёками вниз по камню, не пятнами */
  c=plnMix3(c,F.rust,plnSmooth(.6,.9,cave3N3(X*1.1+9,Y*.18,Z*1.1,25))*.22);
  /* под линией поверхности: дёрн, подпочва, потом камень — волнистыми полосами (23aa) */
  const gd=(dig3Land(F,X,Z)-Y)*P,wv=3*cave3N3(X*.3,0,Z*.3,F.seed+11);
  if(gd<DIG_TURF+DIG_SUB+10+wv){
    const soil=plnMix3(F.turf,F.sub,plnSmooth(DIG_TURF-2,DIG_TURF+3,gd+wv));
    c=plnMix3(soil,c,plnSmooth(DIG_TURF+DIG_SUB-4,DIG_TURF+DIG_SUB+10,gd+wv));
  }
  /* верх земли — то, что видно сверху: грунт мира */
  if(ny>.55&&gd<4)c=plnMix3(c,F.top,plnSmooth(.55,.85,ny)*plnSmooth(4,1,gd));
  /* рудное тело — линза с бугристым краем (край четверть метра, не туман) и блёстками в сердце */
  for(const n of F.nk){
    const e=Math.hypot((X-n.x)*.8,(Y-n.y)*1.25)+.45*n.r*cave3N3(X*.5,Y*.5,Z*.5,33);
    if(e<n.r){
      const w=1-plnSmooth(n.r*.82,n.r,e);
      c=plnMix3(c,[n.c[0]*.85,n.c[1]*.85,n.c[2]*.85],w*.8);   /* тело — пятно цвета руды; жилы и самородки на нём (23cb) */
      if(e<n.r*.6&&cave3N3(X*4.1,Y*4.1,Z*4.1,35)>.62)c=plnMix3(c,n.c,.85);
    }
  }
  /* вода по стене — светлая корка, на полу осадок */
  const run=plnSmooth(.4,.75,cave3N3(X*.55,Y*.1,Z*.55,27))*plnSmooth(.95,.55,Math.abs(ny));
  o[0]=c[0];o[1]=c[1];o[2]=c[2];o[3]=run*.5;
  return o;
}
/* глубина куска по z: −1 — весь воздух, 0 — только лист разреза (камень без комнат), иначе метры */
function dig3Span(F,X0,Y0,s,v){
  const x0=X0-v-1,x1=X0+s+1,y0=Y0-v-1,y1=Y0+s+1,CM=DIG3_CM,R=DIG3_ROOM;
  if(y0>5)return -1;
  let z=0;
  for(let r=Math.max(0,Math.floor(-y1/CM)-1);r<=Math.floor(-y0/CM)+1;r++)
    for(let c=Math.floor(x0/CM)-1;c<=Math.floor(x1/CM)+1;c++)
      if(dig3Dug(F,c,r))z=Math.max(z,(dig3Hall(F,c,r)?R.hall:R.zd)+1.6);
  if(y1>-3.2)return DIG3_CH.zcap;   /* у поверхности: земля уходит к горизонту */
  return z;
}
/* ── кусок: surface nets (счёт 22da cave3Chunk; своя плотность, краска и глубина) ── */
function dig3Chunk(F,ci,cj){
  const s=DIG3_CH.s,v=DIG3_CH.vox,X0=ci*s,Y0=cj*s,n0=Math.round(s/v),NI=n0+2,NJ=NI;
  const px=i=>X0+(i-1)*v,py=j=>Y0+(j-1)*v;
  const zs=dig3Span(F,X0,Y0,s,v);
  if(zs<0)return {v:new Float32Array(0),i:new Uint32Array(0),nv:0,ni:0,nRock:0};
  F.nk=dig3Nodes(F,X0-v,X0+s,Y0-v,Y0+s);
  const zmax=zs>0?zs:v*2,NK=Math.max(3,Math.ceil(zmax/v)+2);
  const zk=k=>(k-.5)*v,sJ=NI,sK=NI*NJ,V=new Float32Array(NI*NJ*NK).fill(NaN);
  /* блоки 4×4×4: далёкий от грани блок — одним числом */
  const BI=Math.ceil((NI-1)/4),BJ=BI,BK=Math.ceil((NK-2)/4);
  for(let bk=0;bk<BK;bk++)for(let bj=0;bj<BJ;bj++)for(let bi=0;bi<BI;bi++){
    const i0=bi*4,j0=bj*4,k0=1+bk*4,i1=Math.min(i0+4,NI-1),j1=Math.min(j0+4,NJ-1),k1=Math.min(k0+4,NK-1);
    const cxm=(px(i0)+px(i1))/2,cym=(py(j0)+py(j1))/2,d=dig3Den(F,cxm,cym,zk((k0+k1)/2));
    const th=v*4.5+.8,far=e=>(e>0)===(d>0)&&Math.abs(e)>th;
    const fill=far(d)&&far(dig3Den(F,cxm,cym,zk(k0)))&&far(dig3Den(F,cxm,cym,zk(k1)));
    for(let k=k0;k<=k1;k++){const z=zk(k);for(let j=j0;j<=j1;j++){
      let n=i0+sJ*j+sK*k;const y=py(j);
      for(let i=i0;i<=i1;i++,n++)if(V[n]!==V[n])V[n]=fill?d:dig3Den(F,px(i),y,z);}}
  }
  /* слой перед разрезом — воздух: грань между ним и первым слоем — лист разреза */
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
  /* краска: порода — пласт, мокрость, открытость воздуха перед гранью; лист разреза — тот же пласт
     втрое темнее (страница читается пластами), в нормали путь к пустоте в плоскости, в запасе — далеко ли она */
  const nc=cutP.length,out=new Float32Array((nv+nc)*PLN_VS);
  for(let c=0;c<nv;c++){
    const x=P[c*3],y=P[c*3+1],z=P[c*3+2],l=Math.hypot(N[c*3],N[c*3+1],N[c*3+2])||1,nx=N[c*3]/l,ny=N[c*3+1]/l,nz=N[c*3+2]/l;
    const ink=dig3Paint(F,x,y,z,ny);
    const a=clamp(-dig3Den(F,x+nx*.4,y+ny*.4,z+nz*.4)/.4,0,1),b=clamp(-dig3Den(F,x+nx*1.6,y+ny*1.6,z+nz*1.6)/1.6,0,1);
    const o=c*PLN_VS;
    out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=nx;out[o+4]=ny;out[o+5]=nz;out[o+6]=ink[0];out[o+7]=ink[1];out[o+8]=ink[2];
    out[o+9]=PLN_MAT.rock;out[o+10]=0;out[o+11]=ink[3];out[o+12]=a*(.35+.65*b);
  }
  for(let c=0;c<nc;c++){
    const p=cutP[c],x=P[p*3],y=P[p*3+1],z=P[p*3+2],zc=.08;
    const dv=dig3Den(F,x,y,zc),gx=dig3Den(F,x+.06,y,zc)-dig3Den(F,x-.06,y,zc),gy=dig3Den(F,x,y+.06,zc)-dig3Den(F,x,y-.06,zc),gl=Math.hypot(gx,gy)||1;
    /* страница темна и почти без цвета: пласт читается тоном и линией, оттенок — половиной */
    const ink=dig3Paint(F,x,y,0,0),k=.3*(1+.16*cave3N3(x*.13,y*.13,3,31)),o=(nv+c)*PLN_VS,gr=(ink[0]+ink[1]+ink[2])/3;
    out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=-gx/gl;out[o+4]=-gy/gl;out[o+5]=0;
    out[o+6]=lerp(gr,ink[0],.5)*k;out[o+7]=lerp(gr,ink[1],.5)*k;out[o+8]=lerp(gr,ink[2],.5)*k;
    out[o+9]=CAVE3_MAT.cut;out[o+10]=0;out[o+11]=0;out[o+12]=clamp(dv,0,4);
  }
  const I=new Uint32Array(IR.length+IC.length);
  I.set(IR,0);for(let k=0;k<IC.length;k++)I[IR.length+k]=IC[k]+nv;
  return {v:out,i:I,nv:nv+nc,ni:I.length,nRock:IR.length};
}

/* ── кэш кусков: что видно — по бюджету, ближние к человеку первыми; устаревшие перестраиваются
   первыми, а до того рисуются старой сеткой (дыры в кадре на время стройки нет) ── */
function dig3Chunks(F,box,mx,my,first){
  const s=DIG3_CH.s,Q=DIG3.ch||(DIG3.ch={m:new Map(),gen:-1,t:0,D:null,g:null,NC:0,NR:0});
  if(Q.gen!==PLN_GPU.gen||Q.D!==F.D){for(const k of Q.m.values())plnGeoFree(k.geo);Q.m.clear();Q.gen=PLN_GPU.gen;Q.D=F.D;Q.g=null;}
  /* что выкопано с прошлого раза: куски вокруг этих клеток — устаревшие */
  if(Q.g!==F.g){
    if(Q.g){
      const CM=DIG3_CM,ch=[];
      for(let r=0;r<Math.max(Q.NR,F.NR);r++)for(let c=-MINE_HALF;c<=MINE_HALF;c++){
        const a=r<Q.NR&&Q.g[r*Q.NC+c+MINE_HALF]===1,b=dig3Dug(F,c,r);
        if(a!==b)ch.push([c*CM-CM-1.5,(c+1)*CM+CM+1.5,-(r+1)*CM-CM-1.5,-r*CM+CM+1.5]);
      }
      for(const k of Q.m.values()){
        const x0=k.i*s,y0=k.j*s;
        if(ch.some(b=>x0-1<b[1]&&x0+s+1>b[0]&&y0-1<b[3]&&y0+s+1>b[2]))k.stale=true;
      }
    }
    Q.g=F.g;Q.NC=F.NC;Q.NR=F.NR;
  }
  Q.t++;
  const i0=Math.floor(box[0]/s),i1=Math.floor(box[1]/s),j0=Math.floor(box[2]/s),j1=Math.min(Math.floor(box[3]/s),0),want=[],list=[];
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const k=i+","+j,c=Q.m.get(k),d=Math.hypot((i+.5)*s-mx,(j+.5)*s-my);
    if(c){c.t=Q.t;if(c.geo)list.push(c);if(c.stale)want.push([i,j,d-1e3]);}
    else want.push([i,j,d]);
  }
  want.sort((a,b)=>a[2]-b[2]);
  const t0=wallMs(),lim=first?DIG3_CH.first:DIG3_CH.ms;
  let built=0;
  for(const [i,j] of want){
    if(built&&wallMs()-t0>lim)break;
    const m=dig3Chunk(F,i,j),key=i+","+j,old=Q.m.get(key),c={i,j,t:Q.t,nRock:m.nRock,geo:m.ni?plnGeo(m):null};
    if(old){plnGeoFree(old.geo);const at=list.indexOf(old);if(at>=0)list.splice(at,1);}
    Q.m.set(key,c);if(c.geo)list.push(c);built++;
  }
  if(Q.m.size>DIG3_CH.keep){
    const old=[...Q.m.entries()].filter(e=>e[1].t!==Q.t).sort((a,b)=>a[1].t-b[1].t);
    for(let k=0;k<old.length&&Q.m.size>DIG3_CH.keep;k++){plnGeoFree(old[k][1].geo);Q.m.delete(old[k][0]);}
  }
  Q.left=want.length-built;Q.built=built;
  return list;
}
