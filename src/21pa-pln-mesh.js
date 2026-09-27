/* ══════════════ планета: тело и его генераторы (M610) ══════════════
   Один формат на всё, что стоит в кадре, — иначе стиль расползается по семьям.
   Вершина: место 3, нормаль 3, цвет 3 (линейный), материал, ветер, свечение,
   запас = 13 чисел, 52 байта. Цвет лежит в вершинах слоями, текстур нет.

   Материал — номер, по нему шейдер (21pc) выбирает, как тело берёт свет:
   земля, гранёный камень, крона, кора, гладкое людское, светящееся, вода,
   трава, зверь, дальнее. */
const PLN_MAT={ground:0,rock:1,leaf:2,bark:3,man:4,glow:5,water:6,grass:7,beast:8,far:9};
const PLN_VS=13;

function plnMesh(cap){
  cap=cap||1<<12;
  return {v:new Float32Array(cap*PLN_VS),i:new Uint32Array(cap*3),nv:0,ni:0};
}
function plnVert(m,p,n,c,mat,wind,glow,x){
  if((m.nv+1)*PLN_VS>m.v.length){const b=new Float32Array(m.v.length*2);b.set(m.v);m.v=b;}
  const o=m.nv*PLN_VS,v=m.v;
  v[o]=p[0];v[o+1]=p[1];v[o+2]=p[2];v[o+3]=n[0];v[o+4]=n[1];v[o+5]=n[2];
  v[o+6]=c[0];v[o+7]=c[1];v[o+8]=c[2];v[o+9]=mat;v[o+10]=wind||0;v[o+11]=glow||0;v[o+12]=x||0;
  return m.nv++;
}
function plnTri(m,a,b,c){
  if(m.ni+3>m.i.length){const b2=new Uint32Array(m.i.length*2);b2.set(m.i);m.i=b2;}
  m.i[m.ni++]=a;m.i[m.ni++]=b;m.i[m.ni++]=c;
}
function plnQuad(m,a,b,c,d){plnTri(m,a,b,c);plnTri(m,a,c,d);}
/* вложить другое тело: повернуть вокруг y, растянуть, поставить */
function plnMeshAdd(m,src,pos,yaw,scale){
  const base=m.nv,s=scale==null?1:scale,c=Math.cos(yaw||0),sn=Math.sin(yaw||0),v=src.v;
  for(let k=0;k<src.nv;k++){
    const o=k*PLN_VS,x=v[o]*s,y=v[o+1]*s,z=v[o+2]*s,nx=v[o+3],ny=v[o+4],nz=v[o+5];
    plnVert(m,[x*c+z*sn+pos[0],y+pos[1],-x*sn+z*c+pos[2]],[nx*c+nz*sn,ny,-nx*sn+nz*c],
      [v[o+6],v[o+7],v[o+8]],v[o+9],v[o+10]*s,v[o+11],v[o+12]);
  }
  for(let k=0;k<src.ni;k+=3)plnTri(m,src.i[k]+base,src.i[k+1]+base,src.i[k+2]+base);
}
function plnMeshDone(m){return {v:m.v.slice(0,m.nv*PLN_VS),i:m.i.slice(0,m.ni),nv:m.nv,ni:m.ni};}

const PLN_ICO={};
function plnIco(sub){
  if(PLN_ICO[sub])return PLN_ICO[sub];
  const t=(1+Math.sqrt(5))/2;
  const p=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(plnNorm);
  let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let s=0;s<sub;s++){
    const cache=new Map(),nf=[];
    const mid=(a,b)=>{
      const k=a<b?a*65536+b:b*65536+a;let q=cache.get(k);
      if(q===undefined){q=p.length;p.push(plnNorm(plnAdd(p[a],p[b])));cache.set(k,q);}
      return q;
    };
    for(const [a,b,c] of f){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}
    f=nf;
  }
  return PLN_ICO[sub]={p,f};
}

/* Надутое тело: икосфера, помятая шумом, при нужде огранённая в брус, растянутая,
   повёрнутая и поставленная.
   o: c центр, r [rx,ry,rz], sub, bump, bumpF, seed, yaw, lean (вокруг z), pitch (вокруг x),
      box (степень суперквадрики, <1 — брус), col (u,p,n)→rgb или rgb, mat,
      wind (p)→w или число, glow, x, nc (центр, от которого расходятся нормали), ncK,
      cut (что ниже этого местного y — поджать) */
function plnBlob(m,o){
  const g=plnIco(o.sub==null?2:o.sub),r=o.r,e=o.box||1,P=[],N=[],sd=o.seed||0,bf=o.bumpF||1.6;
  for(const u of g.p){
    let q=u;
    if(e!==1)q=[Math.sign(u[0])*Math.pow(Math.abs(u[0]),e),Math.sign(u[1])*Math.pow(Math.abs(u[1]),e),Math.sign(u[2])*Math.pow(Math.abs(u[2]),e)];
    let b=1;
    if(o.bump)b=1+o.bump*(plnNoise(u[0]*bf+sd*.37,u[1]*bf+u[2]*bf*.7,sd)+plnNoise(u[2]*bf-sd*.11,u[1]*bf*.8+3.1,sd+5))*.5;
    let l=[q[0]*r[0]*b,q[1]*r[1]*b,q[2]*r[2]*b];
    if(o.cut!=null&&l[1]<o.cut)l[1]=o.cut+(l[1]-o.cut)*.12;
    if(o.pitch)l=plnRotX(l,o.pitch);
    if(o.lean)l=plnRotZ(l,o.lean);
    if(o.yaw)l=plnRotY(l,o.yaw);
    P.push(plnAdd(l,o.c));N.push([0,0,0]);
  }
  for(const [a,b,c] of g.f){
    const n=plnCross(plnSub(P[b],P[a]),plnSub(P[c],P[a]));
    for(const k of [a,b,c]){N[k][0]+=n[0];N[k][1]+=n[1];N[k][2]+=n[2];}
  }
  const base=m.nv;
  for(let k=0;k<P.length;k++){
    let n=plnNorm(N[k]);
    /* грани икосферы обходятся наружу в правой тройке: нормаль смотрит от центра */
    if(plnDot(n,plnSub(P[k],o.c))<0)n=plnMul(n,-1);
    if(o.nc)n=plnNorm(plnMix3(n,plnNorm(plnSub(P[k],o.nc)),o.ncK==null?.6:o.ncK));
    const col=typeof o.col==="function"?o.col(g.p[k],P[k],n):o.col;
    const w=typeof o.wind==="function"?o.wind(P[k]):(o.wind||0);
    plnVert(m,P[k],n,col,o.mat,w,o.glow||0,typeof o.x==="function"?o.x(g.p[k],P[k],n):(o.x||0));
  }
  for(const [a,b,c] of g.f)plnTri(m,base+a,base+b,base+c);
}

/* Труба вдоль пути. o: path [[x,y,z]…], rad число | (t)→r, sides, col (t,a,p)→rgb или rgb,
   mat, wind (t,p)→w, flat (сжатие второй оси сечения), up (куда смотрит первая ось),
   cap, glow, x */
function plnTube(m,o){
  const path=o.path,n=path.length,sides=o.sides||8,rings=[],fl=o.flat==null?1:o.flat;
  let nrm=null;
  for(let k=0;k<n;k++){
    const t=n>1?k/(n-1):0;
    const tan=plnNorm(plnSub(path[Math.min(k+1,n-1)],path[Math.max(k-1,0)]));
    let a=nrm||o.up||(Math.abs(tan[1])>.9?[0,0,1]:[0,1,0]);
    a=plnNorm(plnSub(a,plnMul(tan,plnDot(a,tan))));nrm=a;
    const b=plnCross(tan,a),rad=typeof o.rad==="function"?o.rad(t):o.rad,ring=[];
    for(let s=0;s<sides;s++){
      const ang=s/sides*TAU,ca=Math.cos(ang),sn=Math.sin(ang),sa=sn*fl;
      const d=[a[0]*ca+b[0]*sa,a[1]*ca+b[1]*sa,a[2]*ca+b[2]*sa];
      const p=[path[k][0]+d[0]*rad,path[k][1]+d[1]*rad,path[k][2]+d[2]*rad];
      /* нормаль сплющенного сечения клонится к плоской стороне */
      const nn=plnNorm([a[0]*ca*fl+b[0]*sn,a[1]*ca*fl+b[1]*sn,a[2]*ca*fl+b[2]*sn]);
      const col=typeof o.col==="function"?o.col(t,ang,p):o.col;
      const w=typeof o.wind==="function"?o.wind(t,p):(o.wind||0);
      ring.push(plnVert(m,p,nn,col,o.mat,w,o.glow||0,typeof o.x==="function"?o.x(t,ang,p):(o.x||0)));
    }
    rings.push(ring);
  }
  for(let k=0;k+1<n;k++)for(let s=0;s<sides;s++){
    const s2=(s+1)%sides;
    plnQuad(m,rings[k][s],rings[k][s2],rings[k+1][s2],rings[k+1][s]);
  }
  if(o.cap)for(const [k,dir] of [[0,-1],[n-1,1]]){
    const tan=plnMul(plnNorm(plnSub(path[Math.min(k+1,n-1)],path[Math.max(k-1,0)])),dir);
    const col=typeof o.col==="function"?o.col(k?1:0,0,path[k]):o.col;
    const c=plnVert(m,path[k],tan,col,o.mat,typeof o.wind==="function"?o.wind(k?1:0,path[k]):(o.wind||0),o.glow||0,o.x&&typeof o.x!=="function"?o.x:0);
    for(let s=0;s<sides;s++)plnTri(m,c,rings[k][s],rings[k][(s+1)%sides]);
  }
}

/* Корпус, вытянутый вдоль местного x. st: [{x, ry, rz, y}], сечение — эллипс с плоским брюхом.
   col (t, s, p, c)→rgb, где s — синус угла сечения (−1 брюхо … +1 спина); x и glow так же */
function plnLoft(m,o){
  const st=o.st,sides=o.sides||24,rings=[];
  for(let k=0;k<st.length;k++){
    const S=st[k],t=k/(st.length-1),ring=[];
    for(let s=0;s<sides;s++){
      const a=s/sides*TAU,sa=Math.sin(a),ca=Math.cos(a);
      const belly=sa<0?(o.belly==null?.8:o.belly):1;
      ring.push({p:[S.x,S.y+S.ry*sa*belly,S.rz*ca],s:sa,c:ca,t});
    }
    rings.push(ring);
  }
  const ids=rings.map((ring,k)=>ring.map((q,s)=>{
    const kp=Math.min(k+1,st.length-1),km=Math.max(k-1,0),sp=(s+1)%sides,sm=(s+sides-1)%sides;
    const du=plnSub(rings[kp][s].p,rings[km][s].p),dv=plnSub(ring[sp].p,ring[sm].p);
    let n=plnNorm(plnCross(du,dv));
    const out=[0,q.p[1]-st[k].y,q.p[2]];
    if(plnDot(n,out)<0)n=plnMul(n,-1);
    const col=typeof o.col==="function"?o.col(q.t,q.s,q.p,q.c):o.col;
    return plnVert(m,q.p,n,col,o.mat,0,typeof o.glow==="function"?o.glow(q.t,q.s,q.p,q.c):(o.glow||0),typeof o.x==="function"?o.x(q.t,q.s,q.p,q.c):(o.x||0));
  }));
  for(let k=0;k+1<st.length;k++)for(let s=0;s<sides;s++){
    const s2=(s+1)%sides;
    plnQuad(m,ids[k][s],ids[k][s2],ids[k+1][s2],ids[k+1][s]);
  }
  for(const k of [0,st.length-1]){
    const c=plnVert(m,[st[k].x,st[k].y,0],[k?1:-1,0,0],typeof o.col==="function"?o.col(k?1:0,0,[st[k].x,st[k].y,0],0):o.col,o.mat,0,0,0);
    for(let s=0;s<sides;s++)plnTri(m,c,ids[k][s],ids[k][(s+1)%sides]);
  }
}

/* плоская карточка: два треугольника, нормаль задана */
function plnCard(m,a,b,c,d,n,col,mat,wind,glow,x){
  const w=wind||[0,0,0,0];
  const ia=plnVert(m,a,n,col,mat,w[0],glow||0,x||0),ib=plnVert(m,b,n,col,mat,w[1],glow||0,x||0),
    ic=plnVert(m,c,n,col,mat,w[2],glow||0,x||0),id=plnVert(m,d,n,col,mat,w[3],glow||0,x||0);
  plnQuad(m,ia,ib,ic,id);
}
/* квадратичная кривая как путь */
function plnBez(a,b,c,n){
  const out=[];
  for(let k=0;k<=n;k++){const t=k/n,u=1-t;out.push([u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1],u*u*a[2]+2*u*t*b[2]+t*t*c[2]]);}
  return out;
}
