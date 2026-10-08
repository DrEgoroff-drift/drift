/* ══════════════ пещера на движке: янтарь и дальний зал (M630b, проход 3) ══════════════
   Янтарь — тела там, куда его кладёт игра (caveProps ← farCaveAmber, у концов ответвлений и в
   галереях): тёплая капля светит изнутри, рядом тусклый тёплый огонь; взяли — тела нет.
   Дальний зал: в одном зале сетки (натёчном, иначе рудном или гроте) задняя стена галереи
   открывается аркой в камеру за ней. У камеры свой столб дня сквозь окно свода и большая стопка
   шапок под ним; окно арки шире луча, даль светлее неосвещённого ближнего камня (воздух и
   свой рассеянный свет). Арка вырезана в той же плотности (cave3Den), камера лежит глубже
   кусков породы (z > 16) и строится своим телом один раз */
const CAVE3_FAR={kinds:["dripstone","vein","crystal"],z0:15.4,vox:.35,R:[12,9,9],cz:27,hw:18.5};

/* где арка: зал по списку, место с самым высоким и ровным ходом, не у устья, не у шахты и не в воде */
function cave3FarSite(C,F){
  const P=CAVE_PPM,Zs=caveZones(C);
  let zone=null;
  for(const k of CAVE3_FAR.kinds){zone=Zs.find(z=>z.kind===k);if(zone)break;}
  if(!zone)return null;
  const pool=cavePool(C,zone),sh=(C.shafts||[]).map(s=>s.x),L=zone.x1-zone.x0;
  let best=null;
  for(let x=zone.x0+L*.2;x<zone.x0+L*.8;x+=6){
    if(Math.abs(x/P-F.mouthX)<25||sh.some(s=>Math.abs(s-x)<70))continue;
    const f=caveFloorOf(C,x,false),c=caveCeilOf(C,x,false),gap=(f-c)/P;
    if(pool&&f>pool.y-6)continue;
    const fl=(Math.abs(caveFloorOf(C,x-30,false)-f)+Math.abs(caveFloorOf(C,x+30,false)-f))/P;
    const sc=gap-fl*.8;
    if(gap>=3.6&&(!best||sc>best.sc))best={x,f,c,gap,sc};
  }
  if(!best)return null;
  const ax=best.x/P,fy=-best.f/P,h=clamp(best.gap*.72,3,5.2),w=clamp(h*.5,1.9,2.6);
  const zd=cave3Zd(F,best.x,(best.f+best.c)/2),s=(hashi(C.seed,0xFA2)&1)?1:-1,R=CAVE3_FAR.R,cz=CAVE3_FAR.cz;
  return {ax,fy,h,w,zs:zd*.45,z1:cz-R[2]+2.5,cx:ax+s*2.5,cy:fy+3.2,cz,fx:ax+s*1.2,fz:cz-1.5,rb:1.9,yR:fy+11.5,s,zone:zone.kind};
}
/* пустота дальнего зала: арка (стенки, пол, полукруг свода) от задней стены галереи до камеры,
   камера (эллипсоид с ровным полом) и окно свода над стопкой. Меньше нуля — воздух */
function cave3FarVoid(S,X,Y,Z,F){
  const px=Math.abs(X-S.ax),py=Y-S.fy+.1,ww=S.w*(1+.2*plnSmooth(S.zs,S.z1,Z)),hc=S.h-ww;
  let a=py<hc?Math.max(px-ww,-py):Math.max(Math.hypot(px,py-hc)-ww,-py);
  a=Math.max(a,S.zs-Z,Z-S.z1)+.15*cave3N3(X*.8,Y*.8,Z*.8,141);
  const R=CAVE3_FAR.R,n1=cave3N3(X*.16,Y*.16,Z*.16,143);
  let e=(Math.hypot((X-S.cx)/R[0],(Y-S.cy)/R[1],(Z-S.cz)/R[2])-1)*R[2]+1.6*n1+.4*cave3N3(X*.55,Y*.55,Z*.55,145);
  /* стены камеры — той же породы: пласты уступами, глыбы помельче */
  if(F&&e>-2.5&&e<2.5){
    const s0=Y-.06*X+.25*Math.sin(X*.09+Z*.05),L=Math.floor((s0+.28*Math.sin(s0*1.9+.7))/F.sty.bed);
    e-=F.lay.off[(L+64)&127]*F.sty.off*1.8+.35*cave3N3(X*1.1,Y*1.1,Z*1.1,147);
  }
  e=Math.max(e,S.fy-.1-Y+.12*n1);
  const sk=Math.max(Math.hypot(X-S.fx,Z-S.fz)-2.4-.5*n1,S.cy-Y);
  return Math.min(a,e,sk);
}
const CAVE3_DEN0=cave3Den;
cave3Den=function(F,X,Y,Z){
  const d=CAVE3_DEN0(F,X,Y,Z),S=F.far;
  if(!S||Z<S.zs-.5||Math.abs(X-S.ax)>CAVE3_FAR.hw||Y<S.fy-3||Y>S.fy+30)return d;
  return Math.min(d,cave3FarVoid(S,X,Y,Z,F));
};
const CAVE3_FIELD0=cave3Field;
cave3Field=function(C){
  const F=CAVE3_FIELD0(C);
  if(F.far===undefined){F.far=null;F.far=cave3FarSite(C,F);}
  return F;
};

/* камера: surface nets на своей сетке (за глубиной кусков там только она), краска — пласты
   породы (cave3Paint), в запасе — открытость воздуха, как у кусков */
function cave3FarRock(F,S){
  const v=CAVE3_FAR.vox,hw=CAVE3_FAR.hw,x0=S.ax-hw,y0=S.fy-1.2,z0=CAVE3_FAR.z0;
  const NI=Math.ceil(2*hw/v)+1,NJ=Math.ceil(16.5/v)+1,NK=Math.ceil((S.cz+CAVE3_FAR.R[2]+2.5-z0)/v)+1;
  const f=(X,Y,Z)=>cave3FarVoid(S,X,Y,Z,F),sJ=NI,sK=NI*NJ,V=new Float32Array(NI*NJ*NK);
  for(let k=0;k<NK;k++)for(let j=0;j<NJ;j++){let n=sJ*j+sK*k;for(let i=0;i<NI;i++,n++)V[n]=f(x0+i*v,y0+j*v,z0+k*v);}
  const CI=NI-1,CJ=NJ-1,CK=NK-1,cell=new Int32Array(CI*CJ*CK).fill(-1),m=plnMesh(1<<15),cv=new Float32Array(8);
  const E=[0,1,2,3,4,5,6,7,0,2,1,3,4,6,5,7,0,4,1,5,2,6,3,7];
  for(let k=0;k<CK;k++)for(let j=0;j<CJ;j++)for(let i=0;i<CI;i++){
    const n=i+sJ*j+sK*k;
    cv[0]=V[n];cv[1]=V[n+1];cv[2]=V[n+sJ];cv[3]=V[n+sJ+1];cv[4]=V[n+sK];cv[5]=V[n+sK+1];cv[6]=V[n+sK+sJ];cv[7]=V[n+sK+sJ+1];
    let pos=0;for(let c=0;c<8;c++)if(cv[c]>0)pos++;
    if(pos===0||pos===8)continue;
    let ax=0,ay=0,az=0,cnt=0;
    for(let e=0;e<24;e+=2){
      const p=E[e],r=E[e+1],va=cv[p],vb=cv[r];
      if((va>0)===(vb>0))continue;
      const t=va/(va-vb);
      ax+=(p&1)+((r&1)-(p&1))*t;ay+=(p>>1&1)+((r>>1&1)-(p>>1&1))*t;az+=(p>>2)+((r>>2)-(p>>2))*t;cnt++;
    }
    const X=x0+(i+ax/cnt)*v,Y=y0+(j+ay/cnt)*v,Z=z0+(k+az/cnt)*v,h=.06;
    let nr=[f(X-h,Y,Z)-f(X+h,Y,Z),f(X,Y-h,Z)-f(X,Y+h,Z),f(X,Y,Z-h)-f(X,Y,Z+h)];
    nr=plnNorm(nr);
    const ink=cave3Paint(F,X,Y,Z,nr[1]),q=(d)=>clamp(-f(X+nr[0]*d,Y+nr[1]*d,Z+nr[2]*d)/d,0,1);
    cell[i+CI*(j+CJ*k)]=plnVert(m,[X,Y,Z],nr,[ink[0],ink[1],ink[2]],PLN_MAT.rock,0,ink[3],q(.4)*(.35+.65*q(1.6)));
  }
  const cid=(i,j,k)=>(i<0||j<0||k<0||i>=CI||j>=CJ||k>=CK)?-1:cell[i+CI*(j+CJ*k)];
  const P=m.v,VS=PLN_VS;
  const quad=(a,b,c,d)=>{
    if(a<0||b<0||c<0||d<0)return;
    const pa=a*VS,pb=b*VS,pc=c*VS;
    const ux=P[pb]-P[pa],uy=P[pb+1]-P[pa+1],uz=P[pb+2]-P[pa+2],wx=P[pc]-P[pa],wy=P[pc+1]-P[pa+1],wz=P[pc+2]-P[pa+2];
    const nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;
    /* лицом в воздух: туда же, куда нормаль вершин */
    const s=nx*(P[pa+3]+P[pc+3])+ny*(P[pa+4]+P[pc+4])+nz*(P[pa+5]+P[pc+5]);
    if(s>=0)plnQuad(m,a,b,c,d);else plnQuad(m,a,d,c,b);
  };
  for(let k=0;k<NK;k++)for(let j=0;j<NJ;j++)for(let i=0;i<NI;i++){
    const n=i+sJ*j+sK*k,a=V[n]>0;
    if(i<CI&&(V[n+1]>0)!==a)quad(cid(i,j-1,k-1),cid(i,j,k-1),cid(i,j,k),cid(i,j-1,k));
    if(j<CJ&&(V[n+sJ]>0)!==a)quad(cid(i-1,j,k-1),cid(i,j,k-1),cid(i,j,k),cid(i-1,j,k));
    if(k<CK&&(V[n+sK]>0)!==a)quad(cid(i-1,j-1,k),cid(i,j-1,k),cid(i,j,k),cid(i-1,j,k));
  }
  return m;
}
/* стопка шапок под окном свода — в её рост луч и падает; рядом две поменьше */
function cave3FarDress(F,S){
  const m=plnMesh(1<<14),B={F,m,r:rng(hashi(S.ax*100|0,0xCA95)),D:CAVE3_DS=cave3DripSty(F)},r=B.r;
  const foot=(x,z)=>cave3Down(F,x,S.fy+1,z);
  const tiers=(n,R0,h0)=>{const t=[];for(let k=0;k<n;k++){const u=k/(n-1);t.push([h0*lerp(1,.6,u)*(.9+r()*.2),R0*lerp(1,.22,Math.pow(u,.8))]);}return t;};
  cave3Caps(B,{x:S.fx,z:S.fz,foot:foot(S.fx,S.fz),tiers:tiers(7,2.6,1.25),sides:30,bend:.3});
  for(let k=0;k<2;k++){
    const x=S.fx+(k?-1:1)*S.s*(3.6+r()*1.2),z=S.fz+2+r()*3;
    cave3Caps(B,{x,z,foot:foot(x,z),tiers:tiers(3+(r()*2|0),1.1+r()*.5,.8),sides:22,bend:.12});
  }
  return m;
}
/* кадр дальнего зала: тело (один раз), огни, окно дня — шейдеру (farDay, farK) */
function cave3FarFrame(C,F,Fd,x0,x1,cx,dayK){
  F.farDay=[0,0,1,0];F.farK=0;
  const S=Fd.far;
  if(!S||S.ax+CAVE3_FAR.hw<x0||S.ax-CAVE3_FAR.hw>x1){CAVE3.stat.far=null;return 0;}
  const Q=C.far3||(C.far3={gen:-1});
  if(Q.gen!==PLN_GPU.gen){if(Q.rock)plnGeoFree(Q.rock);if(Q.dress)plnGeoFree(Q.dress);Q.rock=Q.dress=null;Q.gen=PLN_GPU.gen;Q.built=false;}
  if(!Q.built){
    const t0=wallMs(),a=cave3FarRock(Fd,S),b=cave3FarDress(Fd,S);
    Q.rock=a.ni?plnGeo(a):null;Q.dress=b.ni?plnGeo(b):null;Q.tris=(a.ni+b.ni)/3;Q.ms=+(wallMs()-t0).toFixed(1);Q.built=true;
  }
  if(Q.rock)F.draw.push({geo:Q.rock,lamp:false,sun:false,refl:true});
  if(Q.dress)F.draw.push({geo:Q.dress,lamp:false,sun:false,refl:true});
  F.farDay=[S.fx,S.fz,S.rb,S.yR];F.farK=1;
  /* свой рассеянный свет: даль светлее неосвещённого ближнего камня и ночью; днём — отсвет у подножия луча */
  const n=.4+.6*dayK;
  F.lights.push({p:[S.cx,S.fy+3.5,S.cz-4],r:15,c:[.055*n,.08*n,.105*n]});
  if(dayK>.01)F.lights.push({p:[S.fx,S.fy+1.5,S.fz-1.5],r:8,c:[.16*dayK,.19*dayK,.2*dayK]});
  CAVE3.stat.far={ax:+S.ax.toFixed(1),fy:+S.fy.toFixed(1),zone:S.zone,tris:Math.round(Q.tris),ms:Q.ms};
  return Q.tris;
}

/* ── янтарь ── */
const CAVE3_AMB_THREAD=8;
function cave3AmberGeo(F,p){
  const r=rng(p.seed^0xA3B),X=p.x/CAVE_PPM,Y=-p.y/CAVE_PPM,m=plnMesh(1<<10);
  let z=1.3;if(cave3Den(F,X,Y+.4,z)>-.1)z=.95;
  /* цвет и сила — стенда (cvAmber): мёд светит изнутри, рёбра горят; тёмное — только у самого низа */
  const fy=cave3Down(F,X,Y+.6,z),col=t=>plnMix3([.62,.27,.05],[1,.58,.16],clamp(t,0,1));
  plnBlob(m,{c:[X,fy+.11,z],r:[.27,.17,.22],sub:2,bump:.22,seed:p.seed%97,cut:-.08,yaw:r()*TAU,col:u=>col(.3+.7*u[1]),mat:CAVE3_MAT.crystal,glow:2.2});
  for(let k=0,n=3+(r()*3|0);k<n;k++){
    const a=r()*TAU,d=.28+r()*.22,x=X+Math.cos(a)*d*1.2,zz=clamp(z+Math.sin(a)*d*.6,.8,z+.5),s=.06+r()*.08;
    if(cave3Den(F,x,fy+.3,zz)>-.05)continue;
    const y=cave3Down(F,x,fy+.4,zz);
    plnBlob(m,{c:[x,y+s*.55,zz],r:[s*1.2,s*.75,s],sub:1,bump:.2,seed:(p.seed+k)%89,cut:-s*.4,col:u=>col(.25+.6*u[1]),mat:CAVE3_MAT.crystal,glow:1.8});
  }
  /* над залежью — капли на нитях из свода, как на стенде: залежь видна издали по тому, что над ней горит.
     Нить до 8 м; свод выше — нитей нет, остаётся мёд со своим светом (проход 4) */
  for(let k=0,n=2+(r()*2|0);k<n;k++){
    const x=X+(r()-.5)*1.4,zz=clamp(z+(r()-.5)*.5,.8,z+.4),top=cave3Up(F,x,fy+.5,zz);
    if(top-fy>CAVE3_AMB_THREAD||top-fy<1.2)continue;
    const len=clamp(lerp(.3,top-fy-.7,.35+.65*r()),.25,CAVE3_AMB_THREAD),c=[x,top-len,zz];
    plnTube(m,{path:[[x,top+.1,zz],[x,top-len+.05,zz]],rad:.008,sides:4,col:[.5,.29,.08],mat:PLN_MAT.glow,glow:.5});
    plnBlob(m,{c,r:[.05,.085,.05],sub:1,col:[1,.58,.16],mat:PLN_MAT.glow,glow:3.2});
  }
  return {geo:m.ni?plnGeo(m):null,X,p:[X,fy+.4,z],ph:(p.seed%628)/100};
}
function cave3AmberFrame(C,F,Fd,x0,x1,cx){
  const A=C.am3||(C.am3={m:new Map(),gen:-1});
  if(A.gen!==PLN_GPU.gen){for(const k of A.m.values())if(k.geo)plnGeoFree(k.geo);A.m.clear();A.gen=PLN_GPU.gen;}
  const L=[];let tris=0;
  caveProps(C).forEach((p,i)=>{
    if(p.k!=="amber")return;
    let k=A.m.get(i);
    if(p.took){if(k){if(k.geo)plnGeoFree(k.geo);A.m.delete(i);}return;}
    const X=p.x/CAVE_PPM;if(X<x0-2||X>x1+2)return;
    if(!k){k=cave3AmberGeo(Fd,p);A.m.set(i,k);}
    if(!k.geo)return;
    F.draw.push({geo:k.geo,lamp:false,sun:false,refl:true});tris+=k.geo.n/3;L.push(k);
  });
  /* огни: два ближних, ореол — ближнему; дышат медленно, не мигают */
  L.sort((a,b)=>Math.abs(a.X-cx)-Math.abs(b.X-cx));
  L.slice(0,2).forEach((k,j)=>{
    const b=.9+.1*Math.sin(G.t*.012+k.ph);
    F.lights.push({p:[k.p[0]+.3,k.p[1]+.2,k.p[2]+.4],r:3.8,c:[.5*b,.27*b,.07*b]});
    if(!j)F.glows.push({p:k.p,c:[1,.55,.18],k:.35*b,s:1.1});
  });
  CAVE3.stat.amber=L.length;
  return tris;
}
