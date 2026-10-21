/* ── сетки земли (M630f): вынесены из 21pf и режутся по рядам ──
   Кусок ленты или дальней полосы строился одним вызовом в 9–14 мс — бюджет кадра его не резал, и
   после посадки кадр стоил 16 мс JS. Теперь сетка — генератор: уступает после каждого ряда высот
   и каждого ряда вершин, стройка (21pf, plnLandStep) ведёт его по часам кадра и доводит в следующих.
   plnLandRibMesh/plnLandFarMesh — те же сетки разом (стенд, PLN.rush) */
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
function* plnLandRibGen(L,c){
  const C=PLN_LAND,NT=L.NT,R=L.R,MG=3,i0=c*C.chunk,i1=Math.min(i0+C.chunk,NT-1),nc=i1-i0+1,gw=nc+2*MG,gh=R+2*MG;
  const H=new Float32Array(gw*gh),PAL=PLN_PAL;
  for(let r=0;r<gh;r++){
    const rr=clamp(r-MG,0,R-1);
    for(let i=0;i<gw;i++)H[r*gw+i]=plnLandRibH(L,rr,clamp(i0+i-MG,0,NT-1));
    yield;
  }
  const X=i=>L.x0+clamp(i0+i-MG,0,NT-1)*L.dx,Z=r=>L.zr[clamp(r-MG,0,R-1)];
  const m=plnMesh((nc*(R+1))*2+16);
  for(let r=0;r<R;r++){if(r)yield;for(let i=0;i<nc;i++){
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
  }}
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
function* plnLandFarGen(L,J){
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
    yield;
  }
  const Z=r=>fz[clamp(J.ra+r-MG,0,RF-1)];
  /* горы и дальние гряды — камень, хребет — наполовину */
  const stone=k=>k===5||k===7?1:(k===4?.6:0);
  const m=plnMesh(nc*nr*2+16);
  for(let r=0;r<nr;r++){if(r)yield;for(let i=0;i<nc;i++){
    const gr=r+MG,gi=i+MG,o=gr*gw+gi,h=H[o],x=X[o],z=Z(gr),k=K[o],w2=W2[o];
    const q=plnLandNode(H,o,gw,X[o+1]-X[o-1],Math.max(1e-3,Z(gr+1)-Z(gr-1)),Z(gr+3)-z);
    let col=plnLandCol(L,x-L.cx0,z,h,q.n,k),st=stone(k);
    if(w2>.01&&K2[o]!==k){col=plnMix3(col,plnLandCol(L,x-L.cx0,z,h,q.n,K2[o]),w2);st=lerp(st,stone(K2[o]),w2);}
    plnVert(m,[x,h,z],q.n,col,PLN_MAT.ground,0,st,q.ao);
  }}
  for(let r=0;r+1<nr;r++)for(let i=0;i+1<nc;i++){
    const a=r*nc+i;
    plnQuad(m,a,a+1,a+nc+1,a+nc);
  }
  return m;
}
function plnDrain(g){for(;;){const r=g.next();if(r.done)return r.value;}}
function plnLandRibMesh(L,c){return plnDrain(plnLandRibGen(L,c));}
function plnLandFarMesh(L,J){return plnDrain(plnLandFarGen(L,J));}
