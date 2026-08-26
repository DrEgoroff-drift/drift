/* ══════════════ сборка сеток ══════════════
   Копилка вершин и три примитива, из которых собрано всё твёрдое: труба по
   пути (клюв, пальцы, жёрдочка), шар (глаз, бусина) и диск (веко, кольцо
   вокруг глаза).

   Вершина везде одна и та же — pos(3) nrm(3) t(1) m(1) col(3) — потому что и
   тело, и части идут одной программой. `t` — место вдоль хребта: по нему поза
   решает, ехать этой вершине с головой или стоять с лапами. `m` — материал.

   МАТЕРИАЛЫ: 0 тело · 1 клюв · 2 глаз · 3 дерево · 4 лапа · 5 голая кожа ·
   6 бусина (светится) · 7 коготь. */
function meshBox(){
  return {v:[],i:[],n:0,
    add(p,nr,t,m,c){this.v.push(p[0],p[1],p[2],nr[0],nr[1],nr[2],t,m,c[0],c[1],c[2]);return this.n++;},
    tri(a,b,c){this.i.push(a,b,c);},
    quad(a,b,c,d){this.i.push(a,b,d,b,c,d);},
    done(){
      return {verts:new Float32Array(this.v),index:new Uint32Array(this.i),stride:11,
              attrs:[["p",3,0],["n",3,3],["tm",2,6],["c",3,8]]};
    }};
}
/* объединение: части птицы рисуются одним вызовом, а не двадцатью */
function meshJoin(list){
  const M=meshBox();
  for(const g of list){
    const off=M.n;
    for(let k=0;k<g.v.length;k+=11)M.v.push(...g.v.slice(k,k+11));
    M.n+=g.n;
    for(const ix of g.i)M.i.push(ix+off);
  }
  return M;
}
/* ── труба по пути ──
   Рамка переносится вдоль пути параллельно (без кручения): у клюва с сильным
   загибом обычная рамка Френе переворачивается на перегибе и выворачивает
   поверхность наизнанку. */
function tube(M,path,sides,opt){
  const o=opt||{},rigT=o.t===undefined?1:o.t,mat=o.m===undefined?0:o.m;
  let up=o.up||[0,1,0];
  const rings=[];
  for(let i=0;i<path.length;i++){
    const s=path[i];
    const a=path[Math.max(0,i-1)].p,b=path[Math.min(path.length-1,i+1)].p;
    const T=vNorm(vSub(b,a));
    let X=vNorm(vSub(up,vMul(T,vDot(up,T))));
    if(vLen(X)<1e-4)X=basisFrom(T)[0];
    const Y=vCross(T,X);
    /* переносится именно X: из него считается всё кольцо. Если тащить Y,
       оси меняются местами на первом же изгибе — клюв выходил плоской
       пластиной, повёрнутой поперёк себя */
    up=X;
    const rx=s.r[0],ry=s.r[1],ring=[];
    for(let j=0;j<sides;j++){
      const ang=j/sides*TAU,cx=Math.cos(ang),sy=Math.sin(ang);
      const p=[s.p[0]+X[0]*cx*rx+Y[0]*sy*ry, s.p[1]+X[1]*cx*rx+Y[1]*sy*ry, s.p[2]+X[2]*cx*rx+Y[2]*sy*ry];
      const n=vNorm([X[0]*cx/rx+Y[0]*sy/ry, X[1]*cx/rx+Y[1]*sy/ry, X[2]*cx/rx+Y[2]*sy/ry]);
      const c=o.col?o.col(i/(path.length-1),ang/TAU,s):[1,1,1];
      ring.push(M.add(p,n,s.t===undefined?rigT:s.t,mat,c));
    }
    rings.push(ring);
  }
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
    const j1=(j+1)%sides;
    M.quad(rings[i][j],rings[i][j1],rings[i+1][j1],rings[i+1][j]);
  }
  /* заглушки: без них труба светит дырой на просвет */
  if(o.cap!==false){
    for(const [ri,dir] of [[0,-1],[rings.length-1,1]]){
      const s=path[ri],a=path[Math.max(0,ri-1)].p,b=path[Math.min(path.length-1,ri+1)].p;
      const T=vMul(vNorm(vSub(b,a)),dir);
      const c=o.col?o.col(ri/(path.length-1),0,s):[1,1,1];
      const ctr=M.add(s.p,T,s.t===undefined?rigT:s.t,mat,c);
      for(let j=0;j<sides;j++){
        const j1=(j+1)%sides;
        if(dir<0)M.tri(ctr,rings[ri][j1],rings[ri][j]);
        else M.tri(ctr,rings[ri][j],rings[ri][j1]);
      }
    }
  }
  return M;
}
function sphere(M,ctr,r,seg,opt){
  const o=opt||{},rigT=o.t===undefined?1:o.t,mat=o.m===undefined?0:o.m;
  const S=o.scale||[1,1,1],rows=[];
  for(let i=0;i<=seg;i++){
    const v=i/seg,ph=v*Math.PI,row=[];
    for(let j=0;j<seg*2;j++){
      const u=j/(seg*2),th=u*TAU;
      const n=[Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)];
      const p=[ctr[0]+n[0]*r*S[0],ctr[1]+n[1]*r*S[1],ctr[2]+n[2]*r*S[2]];
      const nn=vNorm([n[0]/S[0],n[1]/S[1],n[2]/S[2]]);
      row.push(M.add(p,nn,rigT,mat,o.col?o.col(u,v,n):[1,1,1]));
    }
    rows.push(row);
  }
  const cols=seg*2;
  for(let i=0;i<seg;i++)for(let j=0;j<cols;j++){
    const j1=(j+1)%cols;
    M.quad(rows[i][j],rows[i][j1],rows[i+1][j1],rows[i+1][j]);
  }
  return M;
}
/* диск с нормалью n: голая кожа вокруг глаза и веко */
function disc(M,ctr,nrm,r,seg,opt){
  const o=opt||{},rigT=o.t===undefined?1:o.t,mat=o.m===undefined?0:o.m;
  const B=basisFrom(nrm),col=o.col||(()=>[1,1,1]);
  const ctrI=M.add(ctr,nrm,rigT,mat,col(0));
  const ring=[];
  for(let j=0;j<seg;j++){
    const a=j/seg*TAU;
    const p=vAdd(ctr,vAdd(vMul(B[0],Math.cos(a)*r*(o.rx||1)),vMul(B[1],Math.sin(a)*r*(o.ry||1))));
    ring.push(M.add(p,nrm,rigT,mat,col(1,a)));
  }
  for(let j=0;j<seg;j++)M.tri(ctrI,ring[j],ring[(j+1)%seg]);
  return M;
}

/* ── ус ──
   Тонкая изогнутая нить с бусиной на конце — примета породы с листа: это не
   перо и не проволока, это дуга. Путь — квадратичная кривая, поэтому дуга
   задаётся одной точкой оттяжки, а не подбором станций.

   МАТЕРИАЛ 10+s: в дробной части материала едет доля вдоль нити (0 у корня,
   1 на конце). По ней вершинная программа качает ус — своего атрибута под это
   заводить не пришлось, а качаться должен именно кончик, а не нить целиком. */
function filament(M,a,ctrl,b,r0,r1,sides,col,rigT){
  const N=16,path=[];
  for(let i=0;i<N;i++){
    const s=i/(N-1),k=1-s;
    const p=[k*k*a[0]+2*k*s*ctrl[0]+s*s*b[0],
             k*k*a[1]+2*k*s*ctrl[1]+s*s*b[1],
             k*k*a[2]+2*k*s*ctrl[2]+s*s*b[2]];
    path.push({p,r:mix(r0,r1,Math.pow(s,0.7)),m:10+Math.min(0.999,s),s});
  }
  const rings=[];
  let up=[0,1,0];
  for(let i=0;i<path.length;i++){
    const st=path[i];
    const pa=path[Math.max(0,i-1)].p,pb=path[Math.min(path.length-1,i+1)].p;
    const T=vNorm(vSub(pb,pa));
    let X=vNorm(vSub(up,vMul(T,vDot(up,T))));
    if(vLen(X)<1e-4)X=basisFrom(T)[0];
    const Y=vCross(T,X);up=X;
    const ring=[];
    for(let j=0;j<sides;j++){
      const ang=j/sides*TAU,cx=Math.cos(ang),sy=Math.sin(ang);
      const p=[st.p[0]+X[0]*cx*st.r+Y[0]*sy*st.r,
               st.p[1]+X[1]*cx*st.r+Y[1]*sy*st.r,
               st.p[2]+X[2]*cx*st.r+Y[2]*sy*st.r];
      const n=vNorm([X[0]*cx+Y[0]*sy,X[1]*cx+Y[1]*sy,X[2]*cx+Y[2]*sy]);
      ring.push(M.add(p,n,rigT===undefined?1:rigT,st.m,col(st.s)));
    }
    rings.push(ring);
  }
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
    const j1=(j+1)%sides;
    M.quad(rings[i][j],rings[i][j1],rings[i+1][j1],rings[i+1][j]);
  }
  return path[path.length-1].p;
}
