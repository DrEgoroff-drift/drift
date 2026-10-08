/* ══════════════ пещера на движке: озеро (M630b) ══════════════
   Вода стоит там, где её держит игра (cavePool, 22a): тот же уровень, тот же зал. Две части:
   гладь — сетка на уровне воды вглубь за разрез, в запасе глубина (берег прозрачен, глубь темна);
   тело — лист в плоскости разреза от глади до дна, свет уходит в него лопастями и гаснет.
   Гладь берёт отражение из зеркального прохода в полкадра (22db): сцена, отражённая в уровне воды,
   без разреза и без того, что под водой. Зеркало одно на кадр — у ближнего к человеку озера. */
Object.assign(CAVE3_MAT,{water:13,body:14});

function cave3LakeGeo(C,F,z){
  const pool=cavePool(C,z);
  if(!pool)return null;
  const P=CAVE_PPM,Yw=-pool.y/P,m=plnMesh(1<<12),col=[1,1,1];
  /* вода не кончается стенкой на границе зала: идёт к берегу, пока пол ниже уровня (до 3 м) */
  const wet=X=>cave3Den(F,X,Yw-.12,.1)<0;
  let xa=pool.x0/P,xb=pool.x1/P;
  for(let k=0;k<12&&wet(xa-.25);k++)xa-=.25;
  for(let k=0;k<12&&wet(xb+.25);k++)xb+=.25;
  /* гладь: шаг полметра, квадрат — если хоть один угол заметно в воздухе (у берега пол не перекрывать) */
  const st=.5,nx=Math.ceil((xb-xa)/st),zs=[.04];
  for(let k=1;k*st<CAVE3_CH.zcap;k++)zs.push(k*st);
  const nz=zs.length,D=new Float32Array((nx+1)*nz),id=new Int32Array((nx+1)*nz).fill(-1);
  for(let i=0;i<=nx;i++)for(let j=0;j<nz;j++)D[i*nz+j]=cave3Den(F,xa+i*st,Yw,zs[j]);
  const vid=(i,j)=>{
    const k=i*nz+j;
    if(id[k]<0){id[k]=m.nv;plnVert(m,[xa+i*st,Yw,zs[j]],[0,1,0],col,CAVE3_MAT.water,0,0,clamp(-D[k],-.5,4));}
    return id[k];
  };
  for(let i=0;i<nx;i++)for(let j=0;j+1<nz;j++){
    const a=i*nz+j;
    if(Math.min(D[a],D[a+1],D[a+nz],D[a+nz+1])>-.03)continue;
    plnQuad(m,vid(i,j),vid(i+1,j),vid(i+1,j+1),vid(i,j+1));
  }
  /* тело в разрезе: от глади до дна за разрезом; камень разреза лежит перед ним и закрывает лишнее */
  const sx=.25,ns=Math.ceil((xb-xa)/sx);
  let prev=-1;
  for(let i=0;i<=ns;i++){
    const X=xa+i*sx;
    if(cave3Den(F,X,Yw-.05,.1)>=0){prev=-1;continue;}
    const bot=cave3Down(F,X,Yw-.05,.1)-.4,a=m.nv;
    plnVert(m,[X,Yw,.04],[0,0,-1],col,CAVE3_MAT.body,0,0,0);
    plnVert(m,[X,bot,.04],[0,0,-1],col,CAVE3_MAT.body,0,0,Yw-bot);
    if(prev>=0)plnQuad(m,prev,a,a+1,prev+1);
    prev=a;
  }
  return m.ni?{geo:plnGeo(m),y:Yw,x0:xa,x1:xb}:null;
}

/* кадр: озёра в окне строятся раз и лежат на пещере; зеркало — у ближнего */
function cave3LakeFrame(C,F,Fd,x0,x1,cx){
  const Q=C.lk3||(C.lk3={m:new Map(),gen:-1});
  if(Q.gen!==PLN_GPU.gen){for(const k of Q.m.values())if(k)plnGeoFree(k.geo);Q.m.clear();Q.gen=PLN_GPU.gen;}
  F.water=[];F.lake=null;
  let best=1e9,tris=0,near=1e9;
  caveZones(C).forEach((z,i)=>{
    if(!z.Z.water)return;
    if(z.x1/CAVE_PPM<x0-2||z.x0/CAVE_PPM>x1+2)return;
    if(!Q.m.has(i))Q.m.set(i,cave3LakeGeo(C,Fd,z));
    const k=Q.m.get(i);
    if(!k)return;
    F.water.push(k.geo);tris+=k.geo.n/3;
    const d=cx<k.x0?k.x0-cx:cx>k.x1?cx-k.x1:0;
    if(d<near)near=d;
    if(d<best){best=d;F.lake={y:k.y};}
  });
  CAVE3.stat.lake=F.lake?+F.lake.y.toFixed(2):null;
  CAVE3.lakeD=near<1e9?near:null;
  return tris;
}
