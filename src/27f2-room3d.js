/* ══════════════ комната в объёме (M725) ══════════════
   Автор, 07.10: «2d не должно быть». Кантина (а за ней штаб и прочие комнаты) — настоящая сцена:
   сетка в метрах, камера с перспективой, лампы — точечные и конусные источники с картами теней,
   дым в лучах считается по лучу зрения, а не рисуется трапецией; люди — объёмные модели (27d1).

   Устройство:
   1. Сетка — вершины по 12 чисел: место, нормаль, краска, (блеск: целое — глянец, дробь — сила блика;
      своё свечение; часть + 16·узор + 1024·флаги). Часть (0..15) — номер матрицы внутри экземпляра:
      экземпляр — instance_index, его матрицы — M[ii·16 + часть]. Одна сетка человека рисуется в любом
      месте зала своим экземпляром, сетка не перестраивается, когда он дышит, моргает или улыбается.
      Нижняя строка матрицы части в xyz не участвует — в ней два числа изгиба (M729): y += a·x² + b·x·|x|
      до переноса; так губы улыбаются и кривятся без морфов (27f3 cpRig).
      Кожа (M729): вершина может держаться за вторую часть с весом — флаги + 2048·часть₂ + 32768·вес(0..255);
      матрица — смесь двух (как скиннинг в два кости): веко тянет кожу над глазом, нижняя губа — подбородок.
      Бит 2²³ (M814) — тело под резкостью поста (K.flags 2). Флаги читаются round(), не +.5: у 2²³ шаг float32 — 1,
      и +.5 округлялось бы к чётному — нечётная часть уезжала на соседнюю матрицу.
   2. Тени — до R3_SH ламп, слой карты глубины на каждую (перспектива из лампы вниз), 4 выборки.
      Флаг 1 — «не бросает тени»: колба внутри абажура иначе гасила бы свою же лампу.
   3. Узоры (pat) — подробность без текстур: обшивка, плитка, дерево, шлифованный металл, ткань,
      кожа, волосы, стекло, окно (вид наружу с параллаксом), вывеска и кино (текстуры), экран, неон.
   4. Проход света панели (27f1 rpgField) — последний: ореолы ламп, отсвет ярких мест, тон, зерно,
      виньетка и подписи поверх. Цвета сцены — линейные, выше единицы — свет; тон сводит их в кадр.
   Без устройства (Node) — ничего не рисуется, но камера и проекция работают: попадания по людям
   считаются в JS той же матрицей. */
const R3_MAXI=32,R3_PART=16,R3_MAXL=12,R3_SH=6,R3_SHN=1024;
/* раскладка формы (числа float32): матрица камеры, камера, небо, пол, дым, акцент, окно, вывеска, кино,
   лампы, матрицы теней, матрицы частей, тон частей */
const R3U={vp:0,cam:16,sky:20,gnd:24,fog:28,acc:32,win:36,win2:40,sgn:44,sgn2:48,flm:52,flm2:56,lt:60,sv:60+R3_MAXL*16};
R3U.M=R3U.sv+R3_SH*16;R3U.ot=R3U.M+R3_MAXI*R3_PART*16;
const R3_UN=R3U.ot+R3_MAXI*R3_PART*4;
/* узоры: номер — то, что знает шейдер */
const R3P={none:0,wall:1,floor:2,wood:3,brushed:4,window:5,sign:6,cloth:7,skin:8,hair:9,glass:10,film:11,eye:12,leather:13,hazard:14,screen:15,neon:16,ceil:17,plant:18};

/* цвет 0..255 (sRGB) → линейный; смесь, масштаб и плавная ступень для краски вершин */
function r3Lin(c){return [Math.pow(c[0]/255,2.2),Math.pow(c[1]/255,2.2),Math.pow(c[2]/255,2.2)];}
function r3Mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function r3Sc(a,k){return [a[0]*k,a[1]*k,a[2]*k];}
function r3Step(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
/* ── матрицы (по столбцам, как WGSL) ── */
function r3Mul(a,b){const o=new Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
function r3Persp(fy,asp,n,f){const t=1/Math.tan(fy/2),k=1/(n-f);return [t/asp,0,0,0, 0,t,0,0, 0,0,f*k,-1, 0,0,f*n*k,0];}
function r3Look(e,t,up){
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const nz=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];},dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const z=nz(sub(e,t)),x=nz(cr(up||[0,1,0],z)),y=cr(z,x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dt(x,e),-dt(y,e),-dt(z,e),1];}
/* место o, курс ry (вокруг вертикали), наклон rx, крен rz, масштаб s */
function r3Xf(o,ry,rx,rz,s){
  const cy=Math.cos(ry||0),sy=Math.sin(ry||0),cx=Math.cos(rx||0),sx=Math.sin(rx||0),cz=Math.cos(rz||0),sz=Math.sin(rz||0);s=s||1;
  /* R = Ry·Rx·Rz */
  const r00=cy*cz+sy*sx*sz,r01=-cy*sz+sy*sx*cz,r02=sy*cx,
        r10=cx*sz,r11=cx*cz,r12=-sx,
        r20=-sy*cz+cy*sx*sz,r21=sy*sz+cy*sx*cz,r22=cy*cx;
  return [r00*s,r10*s,r20*s,0, r01*s,r11*s,r21*s,0, r02*s,r12*s,r22*s,0, o[0],o[1],o[2],1];}
/* поворот вокруг точки p (шарнир шеи, кисть): T(p)·R·T(−p), сверху — внешняя матрица A */
function r3Pivot(A,p,ry,rx,rz){return r3Mul(A,r3Mul(r3Xf(p,ry,rx,rz,1),r3Xf([-p[0],-p[1],-p[2]],0,0,0,1)));}
function r3Pt(M,p){return [M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]];}
/* точка мира → пиксели CSS кадра w×h; z — глубина (>1 — за камерой) */
function r3Proj(vp,p,w,h){
  const x=vp[0]*p[0]+vp[4]*p[1]+vp[8]*p[2]+vp[12],y=vp[1]*p[0]+vp[5]*p[1]+vp[9]*p[2]+vp[13],q=vp[3]*p[0]+vp[7]*p[1]+vp[11]*p[2]+vp[15];
  if(q<=1e-6)return null;
  return [(x/q*.5+.5)*w,(.5-y/q*.5)*h,q];}

/* ── инструменты сетки ── всё в метрах; T — текущая матрица (стек push/pop) */
function r3Kit(){
  const V=[];let T=r3Xf([0,0,0]);const ST=[];
  const K={V,part:0,flags:0,q:1};   /* q — множитель граней: портрет крупным планом гуще; flags: 1 — не бросает тени, 2 — тело под резкостью */
  const P=p=>[T[0]*p[0]+T[4]*p[1]+T[8]*p[2]+T[12],T[1]*p[0]+T[5]*p[1]+T[9]*p[2]+T[13],T[2]*p[0]+T[6]*p[1]+T[10]*p[2]+T[14]];
  const N=n=>{const x=T[0]*n[0]+T[4]*n[1]+T[8]*n[2],y=T[1]*n[0]+T[5]*n[1]+T[9]*n[2],z=T[2]*n[0]+T[6]*n[1]+T[10]*n[2],l=Math.hypot(x,y,z)||1;return [x/l,y/l,z/l];};
  const nz=v=>{const l=Math.hypot(v[0],v[1],v[2]);return l>1e-12?[v[0]/l,v[1]/l,v[2]/l]:[0,1,0];};
  const cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  K.nz=nz;K.cr=cr;K.sub=sub;
  /* материал: c — краска 0..255, s — блик 0..1, g — глянец 0..15, p — узор, e — своё свечение, ns — не бросает тени */
  K.mt=(c,s,g,p,e,ns)=>({c:r3Lin(c),s:s==null?.3:s,g:g==null?6:g,p:p||0,e:e||0,ns:!!ns});
  K.push=(o,ry,rx,rz,s)=>{ST.push(T);T=r3Mul(T,r3Xf(o,ry,rx,rz,s));};
  K.pushM=M=>{ST.push(T);T=r3Mul(T,M);};
  K.pop=()=>{T=ST.pop();};
  /* вершина: p, n — местные (через T); col — своя краска вершины (иначе материал) */
  K.vx=(p,n,M,col,sk)=>{const q=P(p),m=N(n),c=col||M.c,wq=sk?Math.round(clamp(sk[1],0,1)*255):0;
    V.push(q[0],q[1],q[2],m[0],m[1],m[2],c[0],c[1],c[2],Math.round(M.g)+Math.min(M.s,.99),M.e,
      K.part+16*M.p+1024*((M.ns||K.flags&1)?1:0)+(wq?2048*sk[0]+32768*wq:0)+(K.flags&2?8388608:0));};
  K.tri=(a,b,c,M,n)=>{n=n||nz(cr(sub(b,a),sub(c,a)));K.vx(a,n,M);K.vx(b,n,M);K.vx(c,n,M);};
  K.quad=(a,b,c,d,M,n)=>{n=n||nz(cr(sub(b,a),sub(d,a)));K.vx(a,n,M);K.vx(b,n,M);K.vx(c,n,M);K.vx(a,n,M);K.vx(c,n,M);K.vx(d,n,M);};
  /* ящик со скошенными рёбрами: c — середина, h — полуразмеры, b — фаска (ловит блик, как у настоящей вещи) */
  K.box=(c,h,M,b)=>{b=Math.max(0,Math.min(b||0,h[0]*.45,h[1]*.45,h[2]*.45));const I=[h[0]-b,h[1]-b,h[2]-b];
    const pt=(a)=>[c[0]+a[0],c[1]+a[1],c[2]+a[2]];
    for(let ax=0;ax<3;ax++)for(const s of [-1,1]){const u=(ax+1)%3,v=(ax+2)%3,n=[0,0,0];n[ax]=s;
      const Q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,bb])=>{const p=[0,0,0];p[ax]=s*h[ax];p[u]=a*I[u];p[v]=bb*I[v];return pt(p);});
      K.quad(Q[0],Q[1],Q[2],Q[3],M,n);}
    if(b>0){
      for(let a1=0;a1<3;a1++)for(let a2=a1+1;a2<3;a2++){const a3=3-a1-a2;
        for(const s1 of [-1,1])for(const s2 of [-1,1]){const n=[0,0,0];n[a1]=s1*.7071;n[a2]=s2*.7071;
          const q=(e1,e2,t)=>{const p=[0,0,0];p[a1]=s1*e1;p[a2]=s2*e2;p[a3]=t;return pt(p);};
          K.quad(q(h[a1],I[a2],-I[a3]),q(h[a1],I[a2],I[a3]),q(I[a1],h[a2],I[a3]),q(I[a1],h[a2],-I[a3]),M,n);}}
      for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const n=nz([sx,sy,sz]);
        K.tri(pt([sx*h[0],sy*I[1],sz*I[2]]),pt([sx*I[0],sy*h[1],sz*I[2]]),pt([sx*I[0],sy*I[1],sz*h[2]]),M,n);}
    }};
  /* тело вращения вокруг местной вертикали: профиль [[y, r, M?]] снизу вверх (наружу), N — граней.
     Нормаль — из профиля, через излом меньше 35° — гладко */
  K.lathe=(prof,N,M,ph)=>{N=N||16;ph=ph||0;const sn=[];
    for(let j=0;j+1<prof.length;j++){const dr=prof[j+1][1]-prof[j][1],dy=prof[j+1][0]-prof[j][0],l=Math.hypot(dr,dy);sn.push(l>1e-9?[dy/l,-dr/l]:null);}
    const nAt=(j,end)=>{const s=sn[j],o=sn[end?j+1:j-1];if(o&&s&&s[0]*o[0]+s[1]*o[1]>.82){const a=s[0]+o[0],b=s[1]+o[1],l=Math.hypot(a,b);return [a/l,b/l];}return s;};
    for(let j=0;j+1<prof.length;j++){if(!sn[j])continue;const A=prof[j],B=prof[j+1],m=A[2]||M,na=nAt(j,0),nb=nAt(j,1);
      for(let i=0;i<N;i++){const t0=ph+i/N*TAU,t1=ph+(i+1)/N*TAU;
        const p=(y,r,t)=>[Math.cos(t)*r,y,Math.sin(t)*r],n=(q,t)=>[Math.cos(t)*q[0],q[1],Math.sin(t)*q[0]];
        const a0=p(A[0],A[1],t0),a1=p(A[0],A[1],t1),b0=p(B[0],B[1],t0),b1=p(B[0],B[1],t1);
        K.vx(a0,n(na,t0),m);K.vx(b0,n(nb,t0),m);K.vx(b1,n(nb,t1),m);
        K.vx(a0,n(na,t0),m);K.vx(b1,n(nb,t1),m);K.vx(a1,n(na,t1),m);}}};
  /* эллипсоид (rx, ry, rz) с центром c: нормаль честная (x/a², y/b², z/c²) */
  K.ell=(c,r,M,nl,nu,col)=>{nl=Math.round((nl||8)*K.q);nu=Math.round((nu||12)*K.q);
    const at=(i,j)=>{const f=-Math.PI/2+i/nl*Math.PI,t=j/nu*TAU,d=[Math.cos(f)*Math.cos(t),Math.sin(f),Math.cos(f)*Math.sin(t)];
      return [[c[0]+d[0]*r[0],c[1]+d[1]*r[1],c[2]+d[2]*r[2]],nz([d[0]/r[0],d[1]/r[1],d[2]/r[2]])];};
    for(let i=0;i<nl;i++)for(let j=0;j<nu;j++){const a=at(i,j),b=at(i,j+1),d=at(i+1,j),e=at(i+1,j+1);
      if(i>0){K.vx(a[0],a[1],M,col);K.vx(b[0],b[1],M,col);K.vx(e[0],e[1],M,col);}
      if(i<nl-1){K.vx(a[0],a[1],M,col);K.vx(e[0],e[1],M,col);K.vx(d[0],d[1],M,col);}}};
  /* поверхность по сетке параметров: f(u,v) → [p, краска?]; u — по кругу (wrap), v — вдоль. Нормаль — по сетке
     (центральные разности), наружу — cross(dP/du, dP/dv)·flip. keep(u,v) — какие клетки строить (вырезы) */
  K.surf=(nu,nv,f,M,o)=>{o=o||{};const G=[],C=[],W=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const r=f(i/nu,j/nv);G.push(r[0]);C.push(r[1]||null);W.push(r[2]||null);}
    const at=(i,j)=>{if(o.wrap)i=(i+nu)%nu;else i=Math.max(0,Math.min(nu,i));j=Math.max(0,Math.min(nv,j));return G[j*(nu+1)+i];};
    const NN=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
      const du=sub(at(i+1,j),at(i-1,j)),dv=sub(at(i,j+1),at(i,j-1));let n=cr(du,dv);
      if(Math.hypot(...n)<1e-14){const dv2=sub(at(i,j+(j<nv?2:-2)),at(i,j));n=cr(du,j<nv?dv2:[-dv2[0],-dv2[1],-dv2[2]]);}
      n=nz(n);if(o.flip)n=[-n[0],-n[1],-n[2]];NN.push(n);}
    const id=(i,j)=>j*(nu+1)+i;
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      if(o.keep&&!o.keep((i+.5)/nu,(j+.5)/nv))continue;
      const q=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)];
      for(const k of [q[0],q[1],q[2],q[0],q[2],q[3]])K.vx(G[k],NN[k],M,C[k]||null,W[k]);}};
  /* труба по ломаной P с радиусом r (число или массив); N — граней; кольца — параллельным переносом */
  K.tube=(Pp,r,M,Nn,cap)=>{Nn=Math.round((Nn||8)*K.q);const R=[];let u0=null;
    for(let k=0;k<Pp.length;k++){const a=Pp[Math.max(0,k-1)],b=Pp[Math.min(Pp.length-1,k+1)],t=nz(sub(b,a));
      if(!u0){const up=Math.abs(t[1])<.9?[0,1,0]:[1,0,0];u0=nz(cr(t,up));}
      else{const d=u0[0]*t[0]+u0[1]*t[1]+u0[2]*t[2];u0=nz([u0[0]-t[0]*d,u0[1]-t[1]*d,u0[2]-t[2]*d]);}
      const v0=cr(t,u0),rk=Array.isArray(r)?r[k]:r,q=[];
      for(let i=0;i<=Nn;i++){const f=i/Nn*TAU,c=Math.cos(f),s=Math.sin(f),n=[u0[0]*c+v0[0]*s,u0[1]*c+v0[1]*s,u0[2]*c+v0[2]*s];
        q.push([[Pp[k][0]+n[0]*rk,Pp[k][1]+n[1]*rk,Pp[k][2]+n[2]*rk],n]);}R.push(q);}
    for(let k=0;k+1<R.length;k++){const A=R[k],B=R[k+1];for(let i=0;i<Nn;i++){
      K.vx(A[i][0],A[i][1],M);K.vx(B[i][0],B[i][1],M);K.vx(B[i+1][0],B[i+1][1],M);
      K.vx(A[i][0],A[i][1],M);K.vx(B[i+1][0],B[i+1][1],M);K.vx(A[i+1][0],A[i+1][1],M);}}
    if(cap){const E=Pp[Pp.length-1],e=R[R.length-1],t=nz(sub(E,Pp[Pp.length-2]));
      for(let i=0;i<Nn;i++){K.vx(E,t,M);K.vx(e[i][0],t,M);K.vx(e[i+1][0],t,M);}}};
  /* плита по контуру P [[x,y]] в плоскости xy, толщина от z0 до z1 (вогнутые — ушами 17c2a) */
  K.slab=(Pp,z0,z1,M)=>{const tr=h3dEar(Pp);if(!tr)return;
    for(const [a,b,d] of tr){K.tri([Pp[a][0],Pp[a][1],z1],[Pp[b][0],Pp[b][1],z1],[Pp[d][0],Pp[d][1],z1],M,[0,0,1]);
      K.tri([Pp[a][0],Pp[a][1],z0],[Pp[b][0],Pp[b][1],z0],[Pp[d][0],Pp[d][1],z0],M,[0,0,-1]);}
    for(let i=0;i<Pp.length;i++){const q=Pp[i],r=Pp[(i+1)%Pp.length];
      K.quad([q[0],q[1],z0],[r[0],r[1],z0],[r[0],r[1],z1],[q[0],q[1],z1],M);}};
  K.pack=()=>({v:new Float32Array(V),n:V.length/12,buf:null,dev:null});
  return K;
}

/* ── шейдер сцены ── */
const R3_WGSL=`diagnostic(off, derivative_uniformity);
struct Lt{p:vec4f,c:vec4f,d:vec4f,s:vec4f};
struct U{vp:mat4x4f,cam:vec4f,sky:vec4f,gnd:vec4f,fog:vec4f,acc:vec4f,win:vec4f,win2:vec4f,sgn:vec4f,sgn2:vec4f,flm:vec4f,flm2:vec4f,
  lt:array<Lt,${R3_MAXL}>,sv:array<mat4x4f,${R3_SH}>,M:array<mat4x4f,${R3_MAXI*R3_PART}>,ot:array<vec4f,${R3_MAXI*R3_PART}>};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var shm:texture_depth_2d_array;
@group(0) @binding(3) var shs:sampler_comparison;
@group(0) @binding(4) var tsg:texture_2d<f32>;
@group(0) @binding(5) var tfl:texture_2d<f32>;
@group(1) @binding(0) var<uniform> sk:vec4u;
struct VI{@location(0) p:vec3f,@location(1) n:vec3f,@location(2) c:vec3f,@location(3) m:vec3f};
struct VO{@builtin(position) q:vec4f,@location(0) w:vec3f,@location(1) n:vec3f,@location(2) c:vec3f,@location(3) @interpolate(flat) m:vec3f,
  @location(4) l:vec3f,@location(5) @interpolate(flat) ob:u32};
/* изгиб части: числа — в нижней строке её матрицы (в xyz она не участвует); губы — улыбка и кривая усмешка */
fn bend(p:vec3f,M:mat4x4f)->vec3f{return vec3f(p.x,p.y+M[0].w*p.x*p.x+M[1].w*p.x*abs(p.x),p.z-M[2].w*p.x*p.x);}
/* матрица вершины: своя часть или смесь с второй по весу (кожа лица) */
fn skinM(ii:u32,f:u32)->mat4x4f{let b=ii*${R3_PART}u;let M=u.M[b+(f&15u)];let w=f32((f>>15u)&255u)/255.;
  if(w<=0.){return M;}return M*(1.-w)+u.M[b+((f>>11u)&15u)]*w;}
@vertex fn vs(i:VI,@builtin(instance_index) ii:u32)->VO{
  var o:VO;let f=u32(round(i.m.z));let ob=ii*${R3_PART}u+(f&15u);let M=skinM(ii,f);
  let w=(M*vec4f(bend(i.p,M),1.)).xyz;
  o.q=u.vp*vec4f(w,1.);o.w=w;o.n=(M*vec4f(i.n,0.)).xyz;o.c=i.c;o.m=i.m;o.l=i.p;o.ob=ob;return o;}
/* тень: глубина из лампы sk.x; «не бросает» — за дальнюю плоскость */
@vertex fn vsh(i:VI,@builtin(instance_index) ii:u32)->@builtin(position) vec4f{
  let f=u32(round(i.m.z));
  if(((f>>10u)&1u)==1u){return vec4f(0.,0.,2.,1.);}
  let M=skinM(ii,f);
  return u.sv[sk.x]*vec4f((M*vec4f(bend(i.p,M),1.)).xyz,1.);}
fn hh(p:vec3f)->f32{return fract(sin(dot(p,vec3f(127.1,311.7,74.7)))*43758.5453);}
fn h2(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn vn3(p:vec3f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(mix(hh(i),hh(i+vec3f(1.,0.,0.)),w.x),mix(hh(i+vec3f(0.,1.,0.)),hh(i+vec3f(1.,1.,0.)),w.x),w.y),
             mix(mix(hh(i+vec3f(0.,0.,1.)),hh(i+vec3f(1.,0.,1.)),w.x),mix(hh(i+vec3f(0.,1.,1.)),hh(i+vec3f(1.,1.,1.)),w.x),w.y),w.z);}
fn vn2(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(h2(i),h2(i+vec2f(1.,0.)),w.x),mix(h2(i+vec2f(0.,1.)),h2(i+vec2f(1.,1.)),w.x),w.y);}
fn fb2(p:vec2f)->f32{return vn2(p)*.5+vn2(p*2.03+vec2f(5.2,1.3))*.3+vn2(p*4.1+vec2f(2.7,8.1))*.2;}
fn fb3(p:vec3f)->f32{return vn3(p)*.55+vn3(p*2.07+vec3f(3.1,1.7,5.3))*.3+vn3(p*4.3+vec3f(7.,2.,1.))*.15;}
/* плоские координаты по ведущей оси нормали: стена — xy, боковая — zy, пол и потолок — xz */
fn pl2(p:vec3f,n:vec3f)->vec2f{let a=abs(n);if(a.z>=a.x&&a.z>=a.y){return p.xy;}if(a.x>=a.y){return p.zy;}return p.xz;}
fn shadowAt(k:i32,w:vec3f,taps:i32)->f32{
  let q=u.sv[k]*vec4f(w,1.);if(q.w<=1e-4){return 1.;}
  let nd=q.xyz/q.w;let uv=vec2f(nd.x*.5+.5,.5-nd.y*.5);
  if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.||nd.z>=1.){return 1.;}
  let px=1.6/${R3_SHN}.;let z=nd.z-.0004;
  if(taps<2){return textureSampleCompareLevel(shm,shs,uv,k,z);}
  var s=textureSampleCompareLevel(shm,shs,uv+vec2f(-.71,-.26)*px,k,z);
  s+=textureSampleCompareLevel(shm,shs,uv+vec2f(.26,-.71)*px,k,z);
  s+=textureSampleCompareLevel(shm,shs,uv+vec2f(.71,.26)*px,k,z);
  s+=textureSampleCompareLevel(shm,shs,uv+vec2f(-.26,.71)*px,k,z);
  return s*.25;}
/* вид в окно: луч от камеры через стекло до дальней плоскости — параллакс без лишней геометрии */
fn outside(w:vec3f)->vec3f{
  let rd=normalize(w-u.cam.xyz);let t=(u.win2.x-40.-u.cam.z)/min(rd.z,-1e-3);
  let q=(u.cam.xyz+rd*t).xy*.05+vec2f(u.win2.z*.013,0.);let kind=i32(u.win2.y+.5);let tt=u.cam.w;
  /* звёзды: ячейки, в ячейке одна; ярче — реже */
  let g=floor(q*60.);let s0=h2(g);let fq=fract(q*60.)-.5-vec2f(h2(g+3.1),h2(g+7.7))*.6+.3;
  var c=vec3f(0.006,.008,.016)+vec3f(1.,.95,.88)*step(.965,s0)*(1.-smoothstep(.02,.09,length(fq)))*(1.2+2.*h2(g+1.3));
  let ac=u.acc.rgb;
  /* настоящая планета (зал M810): шар 17gab, запечённый в tfl, — дальний слой за всем, что у причала;
     flm — её место на дальней плоскости (x, y, радиус в метрах, сила), flm2.z — она есть */
  let pon=u.flm2.z>.5;
  if(pon){let d=((u.cam.xyz+rd*t).xy-u.flm.xy)/u.flm.z;let dl=length(d);
    if(dl<1.7){let tx=textureSampleLevel(tfl,smp,clamp(vec2f(.5+d.x*.38,.5-d.y*.38),vec2f(0.),vec2f(1.)),0.).rgb;
      c=c*smoothstep(.985,1.005,dl)+tx*u.flm.w;}}
  if(kind==3){   /* научная: туманность акцента и холодная планета краем */
    let nb=fb2(q*3.+vec2f(tt*.002,0.));c+=mix(vec3f(.05,.07,.14),ac*.35,nb)*smoothstep(.35,.85,nb)*1.4*select(1.,.45,pon);
    if(!pon){let pd=length(q-vec2f(.5,-1.4))-1.12;c=mix(c,vec3f(.03,.05,.09)*(1.+q.y),step(pd,0.));c+=vec3f(.3,.55,.9)*exp(-abs(pd)*40.)*.9;}}
  else if(kind==5){   /* аванпост: звёзды, полоса пыли и патруль, что идёт медленно, огни ровные */
    c+=vec3f(.05,.04,.06)*fb2(q*1.5+vec2f(3.,1.))*(1.-smoothstep(-.7,.4,q.y));
    let d=q-vec2f(fract(tt*.004+u.win2.z*.0071)*3.6-1.8,.34);
    let hl=step(abs(d.x),.17)*step(abs(d.y),.024-.09*max(d.x-.07,0.)-.03*max(-.12-d.x,0.));
    c=mix(c,vec3f(.026,.03,.036)+vec3f(.06,.07,.09)*smoothstep(-.02,.024,d.y),hl);
    c+=vec3f(1.,.55,.28)*exp(-length((d-vec2f(-.175,0.))*vec2f(1.,2.))*110.)*2.4;
    c+=ac*exp(-length(d-vec2f(.16,.004))*260.)*2.;}
  else if(kind==6){   /* заправка: поле резервуаров, рука шланга, натриевые фонари */
    let gy=-.22;c=mix(c,vec3f(.03,.026,.022),step(q.y,gy));
    for(var i=0;i<4;i++){let fi=f32(i);let cx=-1.05+fi*.66+h2(vec2f(fi,3.))*.14;let r=.15+.07*h2(vec2f(fi,7.));
      let d=length(q-vec2f(cx,gy+r*.92))-r;let sh=clamp((q.x-cx)/r*.5+.5,0.,1.);
      c=mix(c,vec3f(.05,.045,.04)+vec3f(.4,.26,.09)*(1.-sh)*.3,step(d,0.));c+=vec3f(1.,.62,.2)*exp(-abs(d)*90.)*.18*(1.-sh);}
    let pq=vec2f(fract(q.x*2.5+.3)-.5,q.y-gy-.36);
    c=mix(c,vec3f(.02),step(abs(pq.x),.006)*step(pq.y,0.)*step(gy-.02,q.y-.0));
    c+=vec3f(1.,.6,.17)*exp(-length(pq*vec2f(1.,1.6))*26.)*1.2;
    let ha=abs(q.y-gy-.5+.25*(q.x+.2))-.012;c=mix(c,vec3f(.03,.03,.035),step(ha,0.)*step(-.5,q.x)*step(q.x,.1));}
  else if(kind==1){   /* литейка: зарево снизу, дым и искры */
    let sm=fb2(q*vec2f(2.,3.)+vec2f(0.,-tt*.01));c=mix(c,vec3f(.9,.35,.08)*(1.-smoothstep(-.6,.6,q.y))*1.6,.7)*(.5+.6*sm);
    let sg=floor(q*vec2f(40.,24.)+vec2f(0.,tt*.4));c+=vec3f(1.,.6,.2)*step(.985,h2(sg))*3.;}
  else if(kind==4){   /* пыль: бурая мгла и тусклое солнце */
    let sm=fb2(q*2.2+vec2f(tt*.004,0.));c=mix(vec3f(.16,.09,.05),vec3f(.42,.26,.14),sm)*(.8-q.y*.3);
    c+=vec3f(1.,.7,.4)*exp(-length(q-vec2f(.7,.45))*9.)*1.6;}
  else{   /* док и стапель: корпус у причала в прожекторах, фермы с освещённой кромкой, маяки — тело дока, не сетка */
    c+=vec3f(.035,.05,.08)*(1.-smoothstep(-.05,.5,q.y))*1.6;   /* дымка дока снизу: свет причала в пыли */
    if(!pon){   /* планета без своей текстуры: диск с терминатором и кромкой воздуха */
      let pc=q-vec2f(-.12,.27);let pd=length(pc)-.13;let nn=pc/.13;let lm=clamp(dot(nn,vec2f(-.7,.55))*1.1+.15,0.,1.);
      c=mix(c,mix(vec3f(.006,.008,.014),vec3f(.32,.4,.52),lm),step(pd,0.));c+=vec3f(.3,.5,.9)*exp(-abs(pd)*70.)*.5*lm;}
    /* корпус у причала: нос влево, верх ловит прожекторы, панели, ряд тёплых иллюминаторов */
    let hq=q-vec2f(.5,.05);let hh=.068*sqrt(clamp((hq.x+.46)/.22,0.,1.));
    var hm=step(abs(hq.y),hh)*step(-.46,hq.x)*step(hq.x,.62);
    if(kind==2){hm*=max(step(fract(hq.x*36.),.4),1.-step(-.14,hq.x)*step(hq.x,.16));}   /* стапель: недошитый отсек — рёбра */
    let ny=hq.y/max(hh,1e-3);let fl=exp(-pow((q.x-.55)/.2,2.));
    var hs=vec3f(.075,.085,.1)*(.35+.65*smoothstep(-.7,1.,ny))*(.55+1.6*fl)+vec3f(.012,.014,.018)*fb2(q*40.);
    hs+=vec3f(.45,.5,.56)*smoothstep(hh-.007,hh,hq.y)*(.35+.9*fl);
    hs*=1.-.5*max(step(fract(hq.x*15.),.03),step(abs(hq.y+.014),.0016));
    let pw=step(.45,h2(floor(vec2f(hq.x*60.,3.))))*step(abs(hq.y-.02),.0045)*step(.45,fract(hq.x*60.));
    c=mix(c,hs+vec3f(1.,.72,.38)*pw*1.4,hm);
    /* ферма-башня у причала и стрела над ним: пояса, раскосы; кромка к прожектору светлее */
    let dx=q.x-.56;let tw=.024;let inT=step(abs(dx),tw+.003)*step(q.y,.43);
    let tm=inT*max(step(abs(abs(dx)-tw),.0035),step(abs(dx-tw*(2.*abs(2.*fract(q.y*18.)-1.)-1.)),.0028));
    let by=q.y-.41;let inB=step(abs(by),.019)*step(.08,q.x)*step(q.x,1.1);
    let bm=inB*max(step(abs(abs(by)-.016),.0032),step(abs(by-.016*(2.*abs(2.*fract(q.x*22.)-1.)-1.)),.0026));
    let dx2=q.x+.43;let tm2=step(abs(dx2),.014)*step(q.y,.36)*max(step(abs(abs(dx2)-.012),.0025),step(abs(dx2-.012*(2.*abs(2.*fract(q.y*26.)-1.)-1.)),.002));
    let lit=clamp(step(0.,dx)*inT+step(0.,by)*inB,0.,1.);
    c=mix(c,mix(vec3f(.05,.055,.065),vec3f(.34,.36,.4),lit),clamp(tm+bm,0.,1.));
    c=mix(c,vec3f(.04,.045,.055),tm2*.9);
    /* прожектор под стрелой: колба и конус в пыли вниз, на корпус */
    let lp=q-vec2f(.5,.388);c+=vec3f(1.,.96,.88)*exp(-length(lp)*320.)*5.;
    let cw=.03+.42*max(-lp.y,0.);c+=vec3f(.7,.78,.9)*exp(-pow(lp.x/cw,2.))*smoothstep(0.,.06,-lp.y)*(1.-smoothstep(.2,.4,-lp.y))*.07;
    /* маяки: красный на башне, акцент на конце стрелы — медленное дыхание, не мигание; огни кромки причала */
    c+=vec3f(1.,.2,.12)*exp(-length(q-vec2f(.56,.437))*260.)*(1.4+1.2*sin(tt*1.1));
    c+=ac*exp(-length(q-vec2f(1.08,.41))*260.)*(1.2+1.*sin(tt*.8+1.7));
    let bl=fract(q.x*12.)-.5;c+=vec3f(1.,.78,.45)*exp(-length(vec2f(bl,(q.y+.012)*3.))*70.)*1.2*step(-.5,q.x);
    if(kind==2){let wp=vec2f(.5+.12*sin(tt*.07),.03);let wf=.75+.25*sin(tt*9.3);   /* сварка на рёбрах: вспышка и отсвет на корпусе */
      c+=vec3f(.6,.8,1.)*exp(-length(q-wp)*160.)*4.*wf+vec3f(.3,.45,.7)*exp(-length(q-wp)*18.)*.12*wf*hm;}}
  /* стройка станции (M814): ближний план за окном, на 20 м ближе звёзд, — ферма-хребет, кран и люльки площадок
     под ним. flm2.w — три цифры по шесть, по площадке: 0 нет, 1 свободна (голая рама, вехи), 2 строится (рёбра,
     сварка, трос крана), 3–5 построена (цех, ряды окон по ступени, маяк акцента); 216 — мест ещё нет, только вехи */
  let sw=u.flm2.w;var se=vec3f(0.);let nk=clamp((1.-u.win2.w)/.62,0.,1.);   /* se — свои огни стройки: ночь окна их не гасит */
  if(sw>.5){
    let t2=(u.win2.x-20.-u.cam.z)/min(rd.z,-1e-3);let P=(u.cam.xyz+rd*t2).xy-vec2f(2.3,3.);
    let dk=vec3f(.03,.033,.04);let lt=vec3f(.52,.55,.6);let nos=sw>215.;
    var ext=-1.;var bld=-9.;
    for(var i=0;i<3;i++){let d=floor(sw/pow(6.,f32(i)))%6.;if(d>.5&&!nos){ext=f32(i);if(d>1.5&&d<2.5){bld=f32(i);}}}
    let x0=select(-3.6,-1.2,nos);let x1=select(ext*1.9-1.9+.95,1.2,nos);
    /* хребет: два пояса и раскос, верхний пояс к звезде светлее */
    let inS=step(x0,P.x)*step(P.x,x1)*step(abs(P.y),.12);
    let sm=inS*max(step(abs(abs(P.y)-.095),.028),step(abs(P.y-.095*(2.*abs(2.*fract(P.x*2.2)-1.)-1.)),.026));
    c=mix(c,mix(dk,lt,step(0.,P.y)*.8),sm);
    if(nos){for(var j=0;j<2;j++){let b=P-vec2f(f32(j)*2.4-1.2,-.55);
      c=mix(c,dk*1.4,step(abs(b.x)+abs(b.y),.12));c+=vec3f(1.,.62,.25)*exp(-length(b-vec2f(0.,.14))*28.)*(1.+.7*sin(tt*.9+f32(j)*2.5));}}
    else{
      /* кран у левого края: башня-ферма и стрела над площадками; трос — к той, что строится */
      let cx=P.x+3.45;let inT=step(abs(cx),.13)*step(-2.4,P.y)*step(P.y,1.15);
      let tm=inT*max(step(abs(abs(cx)-.11),.026),step(abs(cx-.11*(2.*abs(2.*fract(P.y*2.6)-1.)-1.)),.024));
      let jy=P.y-1.08;let jx1=select(-1.0,bld*1.9-1.9+.2,bld>-1.);let inJ=step(abs(jy),.07)*step(-3.6,P.x)*step(P.x,jx1+.3);
      let jm=inJ*max(step(abs(abs(jy)-.055),.022),step(abs(jy-.055*(2.*abs(2.*fract(P.x*3.)-1.)-1.)),.02));
      c=mix(c,mix(dk,lt,step(0.,cx)*.7),clamp(tm+jm,0.,1.));
      c+=vec3f(1.,.2,.12)*exp(-length(P-vec2f(-3.45,1.2))*30.)*(1.2+sin(tt*1.1));
      for(var i=0;i<3;i++){
        let d=floor(sw/pow(6.,f32(i)))%6.;if(d<.5){continue;}
        let p=P-vec2f((f32(i)-1.)*1.9,0.);
        /* прожектор площадки под хребтом: колба и тёплый конус вниз — люлька читается и на тёмном небе */
        c+=vec3f(1.,.86,.62)*(exp(-length(p-vec2f(0.,-.16))*40.)*3.+exp(-pow(p.x/(.08+.45*max(-p.y-.16,0.)),2.))*smoothstep(.16,.4,-p.y)*(1.-smoothstep(1.2,1.9,-p.y))*.08);
        /* люлька: рама под хребтом */
        let fr=step(abs(p.x),.84)*step(-1.78,p.y)*step(p.y,-.1);
        c=mix(c,mix(dk,lt,step(0.,p.x)*.55),fr*max(step(.79,abs(p.x)),step(p.y,-1.73)));
        if(d<1.5){c+=vec3f(1.,.62,.25)*exp(-length(vec2f(abs(p.x)-.8,p.y+1.76))*28.)*(1.+.6*sin(tt*.9+f32(i)*2.));continue;}
        let lv=max(d-2.,0.);let top=select(-.95,-1.7+.5+.4*lv,d>2.5);
        var inB=step(abs(p.x),.66)*step(-1.7,p.y)*step(p.y,top);
        if(d<2.5){inB*=max(step(fract(p.x*4.+.5),.3),step(p.y,-1.42));}   /* строится: низ обшит, выше — рёбра */
        var hs=vec3f(.035,.04,.048)*(.7+.5*smoothstep(-1.7,top,p.y))+vec3f(.012,.014,.018)*fb2(p*9.);
        hs+=vec3f(.42,.46,.52)*smoothstep(top-.07,top,p.y)+vec3f(.2,.22,.25)*smoothstep(.56,.66,p.x);
        hs*=1.-.4*step(fract(p.x*3.2),.07);
        if(d>2.5){let wr=(p.y+1.42)/.4;let rw=floor(wr);let cl=floor(p.x*4.4);
          hs+=vec3f(1.,.72,.38)*1.3*step(rw,lv-1.)*step(0.,rw)*step(abs(fract(wr)-.5),.13)*step(abs(fract(p.x*4.4)-.5),.22)*step(.35,h2(vec2f(cl+f32(i)*9.,rw)));}
        c=mix(c,hs,inB);
        se+=vec3f(.5,.45,.38)*(.35+.65*smoothstep(-1.7,top,p.y))*.3*nk*inB;   /* ночью цех в своих прожекторах — светлее погасшего корпуса */
        if(d>2.5){c+=ac*exp(-length(p-vec2f(.5,top+.06))*30.)*(1.2+sin(tt*.8+f32(i)*1.7));}
        else{let wp=vec2f(.45*sin(tt*.13+f32(i)),top);let wf=.75+.25*sin(tt*9.3+f32(i));
          c+=vec3f(.6,.8,1.)*exp(-length(p-wp)*30.)*3.*wf+vec3f(.3,.45,.7)*exp(-length(p-wp)*5.)*.1*wf;
          c=mix(c,dk,step(abs(p.x-.2),.012)*step(top,p.y)*step(p.y,1.05));}}}
  }
  return c*u.win2.w+se;}
fn aces(x:vec3f)->vec3f{return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),vec3f(0.),vec3f(1.));}
/* два слоя: цвет и дым отдельно — дым шумит по шагам и размывается в последнем проходе, не задевая контуры */
struct FO2{@location(0) c:vec4f,@location(1) v:vec4f};
@fragment fn fs(i:VO,@builtin(front_facing) ff:bool)->FO2{
  let f=u32(round(i.m.z));let pat=(f>>4u)&63u;
  /* сторона нормали — по грани, а не по обходу: у трубок, лент и тел обход разный, а грань к зрителю всегда своя.
     Нормаль, что смотрит против видимой грани, — изнанка: перевернуть */
  let W=i.w;let V=normalize(u.cam.xyz-W);
  var gn=cross(dpdx(W),dpdy(W));if(dot(gn,V)<0.){gn=-gn;}
  /* след пикселя в метрах: мелкий узор тише, когда его период подходит к пикселю, — иначе муар (M814b) */
  let fpW=max(length(dpdx(W)),length(dpdy(W)));
  var n=normalize(i.n);if(dot(n,gn)<0.){n=-n;}
  let ndv=max(dot(n,V),0.);
  var a=i.c;var sp=fract(i.m.x);var gl=floor(i.m.x);var em=i.m.y;var wrap=0.;var fres=.04;var ao=1.;var ex3=vec3f(0.);var tg=vec3f(0.);
  let t=u.cam.w;
  /* ── узоры ── */
  if(pat==1u){   /* обшивка: листы 1.2×0.8, швы, заклёпки, грязь у пола */
    let q=pl2(W,n);let cell=floor(q/vec2f(1.2,.8));let fq=fract(q/vec2f(1.2,.8))*vec2f(1.2,.8);
    let e=min(min(fq.x,1.2-fq.x),min(fq.y,.8-fq.y));
    a*=.92+.16*h2(cell)-.5*(1.-smoothstep(.004,.012,e));
    let rv=min(length(fq-vec2f(.05,.05)),min(length(fq-vec2f(1.15,.05)),min(length(fq-vec2f(.05,.75)),length(fq-vec2f(1.15,.75)))));
    a+=vec3f(.05)*(1.-smoothstep(.005,.009,rv));sp+=.25*(1.-smoothstep(.005,.009,rv));
    a*=.75+.25*smoothstep(0.,.9,W.y)+.12*(fb3(W*3.)-.5);}
  else if(pat==2u){   /* пол: плитка 0.6, швы, мокрые пятна — блик ламп */
    let q=W.xz;let cell=floor(q/.6);let fq=fract(q/.6)*.6;let e=min(min(fq.x,.6-fq.x),min(fq.y,.6-fq.y));
    a*=.88+.24*h2(cell)-.45*(1.-smoothstep(.003,.01,e));
    let wet=smoothstep(.45,.7,fb3(vec3f(q*1.3,0.)));sp=mix(sp,.85,wet);gl=mix(gl,13.,wet);a*=1.-.25*wet;
    a*=.85+.3*fb3(vec3f(q*4.,1.));}
  else if(pat==3u){   /* дерево под лаком: волокно вдоль x */
    let g=sin(W.z*90.+fb3(W*vec3f(1.2,6.,30.))*9.+W.x*.6);a*=.82+.16*g+.1*(fb3(W*vec3f(.5,8.,8.))-.5);}
  else if(pat==4u){   /* шлифованный металл: риски вдоль x */
    let s=(vn3(W*vec3f(2.,420.,420.))-.5)*clamp(1.6-fpW*420.*2.,0.,1.)+.5;a*=.9+.2*s;sp*=.7+.6*s;}
  else if(pat==5u){   /* окно: вид наружу своим светом, сверху — стекло ловит лампы */
    a=vec3f(.012);ex3=outside(W);fres=.08;sp=.9;gl=14.;}
  else if(pat==6u){   /* вывеска: неон по маске текста, фон — тёмная плата */
    let r=u.sgn;let uv=vec2f((W.x-r.x)/(r.z-r.x),(r.w-W.y)/(r.w-r.y));
    let tx=textureSampleLevel(tsg,smp,clamp(uv,vec2f(0.),vec2f(1.)),0.);
    let m=max(tx.a,max(tx.r,max(tx.g,tx.b)));
    a=mix(vec3f(.03,.03,.035),u.acc.rgb,m);em=m*3.2*u.sgn2.y;sp=.4;gl=10.;}
  else if(pat==7u){   /* ткань: переплетение и складки */
    let wv=sin(i.l.x*900.)*sin(i.l.y*900.);a*=.93+.05*wv+.14*(fb3(i.l*vec3f(9.,4.,9.))-.5);wrap=.15;}
  else if(pat==8u){   /* кожа: подповерхностный перенос — свет заходит за терминатор и краснеет; поры — дрожь нормали,
                         жирный блеск пятнами (лоб, нос), остальное матовое */
    wrap=.5;a*=.96+.08*(vn3(i.l*900.)-.5);fres=.028;
    let q=i.l*1400.;let h0=vn3(q);n=normalize(n-.11*vec3f(vn3(q+vec3f(.6,0.,0.))-h0,vn3(q+vec3f(0.,.6,0.))-h0,vn3(q+vec3f(0.,0.,.6))-h0));
    sp*=.55+.9*smoothstep(.35,.75,vn3(i.l*70.));}
  else if(pat==12u){sp=1.3;gl=15.;fres=.06;}   /* глаз: мокрая роговица — острый блик, в нём живость лица */
  else if(pat==9u){   /* волосы: пряди и тянутый блик */
    let s=vn3(i.l*vec3f(700.,60.,700.));a*=.72+.5*s;sp*=.6+.8*s;wrap=.2;
    /* пучки прядей — дрожь нормали поперёк; касательная пряди — вниз по поверхности (волосы лежат по тяжести) */
    let q=i.l*vec3f(520.,46.,520.);let h0=vn3(q);n=normalize(n-.22*vec3f(vn3(q+vec3f(.5,0.,0.))-h0,0.,vn3(q+vec3f(0.,0.,.5))-h0));
    let dn=vec3f(0.,-1.,0.);let tq=dn-n*dot(dn,n);tg=select(normalize(tq+vec3f(0.,0.,1e-4)),vec3f(0.,0.,-1.),dot(tq,tq)<1e-6);}
  else if(pat==10u){fres=.12;}   /* стекло */
  else if(pat==11u){   /* полотно кино: кадр из текстуры своим светом */
    let r=u.flm;let uv=vec2f((W.x-r.x)/(r.z-r.x),(r.w-W.y)/(r.w-r.y));
    a=pow(textureSampleLevel(tfl,smp,clamp(uv,vec2f(0.),vec2f(1.)),0.).rgb,vec3f(2.2));em=1.6*u.flm2.y;sp=0.;}
  else if(pat==13u){a*=.9+.2*vn3(i.l*vec3f(160.));}   /* кожа сиденья */
  else if(pat==14u){   /* опасность: косые полосы */
    let q=pl2(W,n);let s=step(.5,fract((q.x+q.y)*4.));a=mix(vec3f(.05,.045,.04),vec3f(.75,.55,.08),s);}
  else if(pat==15u){em*=.75+.25*sin(W.y*700.+t*.12);}   /* экран: строки */
  else if(pat==16u){em*=u.acc.w;}   /* неон мигает вместе с вывеской */
  else if(pat==17u){   /* потолок: плиты и решётки вытяжки */
    let q=W.xz;let fq=fract(q/vec2f(1.2,1.2));let e=min(min(fq.x,1.-fq.x),min(fq.y,1.-fq.y));a*=.8+.2*smoothstep(.01,.03,e);}
  else if(pat==18u){a*=.8+.3*vn3(i.l*vec3f(40.,40.,40.));wrap=.35;}   /* листья */
  /* ── свет ── */
  let hemi=mix(u.gnd.rgb,u.sky.rgb,n.y*.5+.5)*u.sky.w;
  var c=a*hemi*ao;
  let nl=i32(u.sgn2.z+.5);
  let ex=exp2(1.+gl*.75);
  for(var k=0;k<${R3_MAXL};k++){
    if(k>=nl){break;}
    let L=u.lt[k];let lv=L.p.xyz-W;let d2=dot(lv,lv);let l=lv*inverseSqrt(max(d2,1e-6));
    var att=clamp(1.-d2*d2/pow(L.p.w,4.),0.,1.)/(d2+.2);
    if(L.c.w>.5){att*=smoothstep(L.d.w,L.s.y,dot(-l,L.d.xyz));}
    if(att<=1e-5){continue;}
    var sh=1.;if(L.s.x>=0.){sh=shadowAt(i32(L.s.x),W+n*.015,4);}
    let nd=dot(n,l);let df=max((nd+wrap)/(1.+wrap),0.);
    /* кожа: перенос за терминатор теплее (кровь под кожей) */
    let sss=select(vec3f(1.),mix(vec3f(1.,.62,.5),vec3f(1.),smoothstep(0.,.5,nd)),pat==8u);
    let H=normalize(l+V);let F=fres+(1.-fres)*pow(1.-max(dot(H,V),0.),5.);
    var spv=vec3f(pow(max(dot(n,H),0.),ex)*(ex+8.)/25.*sp*F*step(0.,nd)*4.);
    if(pat==9u){   /* волосы: два блика вдоль пряди (Каджия — Кей): белёсый ближе к корню, цветной ниже */
      let t1=dot(normalize(tg-n*.08),H);let t2=dot(normalize(tg+n*.12),H);
      spv=(vec3f(pow(sqrt(max(1.-t1*t1,0.)),ex*.6)*.55)+a*pow(sqrt(max(1.-t2*t2,0.)),ex*.3)*1.6)*sp*smoothstep(-.1,.4,nd);}
    c+=L.c.rgb*att*sh*(a*df*sss+spv);
  }
  /* стекло и металл видят зал: отражение в долю Френеля */
  let fr=fres+(1.-fres)*pow(1.-ndv,5.);
  c+=mix(u.gnd.rgb,u.sky.rgb,reflect(-V,n).y*.5+.5)*u.sky.w*fr*sp*.6;
  c+=a*em+ex3;
  /* выбранный и наведённый: контур акцентом по краю силуэта; .y — приглушить (кино, чужие при выборе) */
  let ot=u.ot[i.ob];
  c+=u.acc.rgb*pow(1.-ndv,2.5)*ot.x*1.4;
  /* планка света людей (M814): последняя часть экземпляра — его паспорт (x, z опоры, радиус пятна, контур).
     Контур — холодный отсвет зала по кромке силуэта, сверху сильнее (свет дока и окна сверху-сзади);
     пятно — контактная тень на полу под человеком: тело закрывает рассеянный, ноги стоят, а не висят */
  let io=u.ot[(i.ob/${R3_PART}u)*${R3_PART}u+${R3_PART-1}u];
  if(io.w>0.){c+=(mix(u.gnd.rgb,u.sky.rgb,.8)*u.sky.w+vec3f(.03,.036,.05))*io.w*pow(1.-ndv,3.5)*smoothstep(-.4,.5,n.y);}
  if(n.y>.7&&W.y<.08){var cs=1.;
    for(var k=0u;k<${R3_MAXI}u;k++){let q=u.ot[k*${R3_PART}u+${R3_PART-1}u];if(q.z<=0.){continue;}
      let d=length(W.xz-q.xy)/q.z;cs*=1.-.62*exp(-d*d*2.2);}
    c*=cs;}
  c*=1.-ot.y;
  /* ── воздух: дым по лучу, в конусах ламп — с тенью (лучи сквозь людей) ── */
  let ro=u.cam.xyz;let rv=W-ro;let tm=length(rv);let rd=rv/tm;
  /* сдвиг шагов — чередующийся градиентный шум (ровнее белого), кадр к кадру смещён золотым сечением */
  let jit=fract(fract(52.9829189*fract(dot(floor(i.q.xy),vec2f(.06711056,.00583715))))+fract(t*60.)*.618034);
  var vol=vec3f(0.);
  for(var k=0;k<${R3_MAXL};k++){
    if(k>=nl){break;}
    let L=u.lt[k];if(L.s.z<=0.){continue;}
    let oc=ro-L.p.xyz;let b=dot(oc,rd);let cc=dot(oc,oc)-L.p.w*L.p.w;let hq=b*b-cc;if(hq<=0.){continue;}
    let sq=sqrt(hq);let t0=max(-b-sq,0.);let t1=min(-b+sq,tm);if(t1<=t0){continue;}
    let dt=(t1-t0)/6.;
    for(var j=0;j<6;j++){
      let p=ro+rd*(t0+(f32(j)+jit)*dt);let lv=L.p.xyz-p;let d2=dot(lv,lv);let l=lv*inverseSqrt(d2);
      var at=clamp(1.-d2*d2/pow(L.p.w,4.),0.,1.)/(d2+.3);
      if(L.c.w>.5){at*=smoothstep(L.d.w,L.s.y,dot(-l,L.d.xyz));}
      if(at<=1e-4){continue;}
      var s=1.;if(L.s.x>=0.){s=shadowAt(i32(L.s.x),p,1);}
      let dn=.35+1.1*vn3(p*vec3f(1.7,1.2,1.7)+vec3f(t*.004,-t*.006,t*.003));
      let ph=1.+1.6*pow(max(dot(l,rd),0.),6.);
      vol+=L.c.rgb*at*s*dn*ph*dt*L.s.z;}
  }
  c=mix(c,u.fog.rgb,1.-exp(-tm*u.gnd.w));
  /* альфа кадра — маска резкости (бит 23): тела под ней, фон — нет; после сведения MSAA край тела — доля */
  var o:FO2;o.c=vec4f(c,f32((f>>23u)&1u));o.v=vec4f(vol*u.fog.w,1.);return o;}`;
/* уменьшение вдвое на 13 выборок (как в больших движках): ступени отсвета и размытый дым.
   tx — шаг выборки источника и режим (1 — порог отсвета с мягким коленом) */
const R3_DOWN_WGSL=`
struct DU{tx:vec4f};
@group(0) @binding(0) var<uniform> du:DU;
@group(0) @binding(1) var ds:sampler;
@group(0) @binding(2) var dt:texture_2d<f32>;
struct DO{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->DO{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:DO;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
fn tp(q:vec2f)->vec3f{return min(textureSampleLevel(dt,ds,q,0.).rgb,vec3f(64.));}
@fragment fn fs(i:DO)->@location(0) vec4f{
  let o=du.tx.xy;let q=i.uv;
  let a=tp(q+o*vec2f(-2.,-2.));let b=tp(q+o*vec2f(0.,-2.));let c=tp(q+o*vec2f(2.,-2.));
  let d=tp(q+o*vec2f(-2.,0.));let e=tp(q);let f=tp(q+o*vec2f(2.,0.));
  let g=tp(q+o*vec2f(-2.,2.));let h=tp(q+o*vec2f(0.,2.));let k=tp(q+o*vec2f(2.,2.));
  let j=tp(q+o*vec2f(-1.,-1.))+tp(q+o*vec2f(1.,-1.))+tp(q+o*vec2f(-1.,1.))+tp(q+o*vec2f(1.,1.));
  var r=e*.125+(a+c+g+k)*.03125+(b+d+f+h)*.0625+j*.125;
  if(du.tx.z>.5){let br=max(r.r,max(r.g,r.b));let s=clamp(br-.55,0.,.9);r*=max(s*s/1.8,br-1.)/max(br,1e-4);}
  return vec4f(r,1.);}`;

/* ── конвейеры и общее на устройство: карта теней одна на все комнаты (рисуется одна за раз) ── */
const R3={dev:null,P:null,PS:null,sh:null,shA:null,shL:[],skB:[],skG:[],ub:null,U:new Float32Array(R3_UN),cmp:null,smp:null,blank:null};
function r3Desc(){
  const mod=gpuShader(R3_WGSL);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vs",buffers:[r3VB()]},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"},{format:"rgba16float"}]},
    primitive:{topology:"triangle-list",cullMode:"none"},multisample:{count:4},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less"}};
}
function r3ShDesc(){
  const mod=gpuShader(R3_WGSL);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vsh",buffers:[r3VB()]},
    primitive:{topology:"triangle-list",cullMode:"none"},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less",depthBias:3,depthBiasSlopeScale:2.5}};
}
function r3VB(){return {arrayStride:48,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},
  {shaderLocation:2,offset:24,format:"float32x3"},{shaderLocation:3,offset:36,format:"float32x3"}]};}
function r3DownDesc(){
  const mod=gpuShader(R3_DOWN_WGSL);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vs"},fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},
    primitive:{topology:"triangle-list"}};
}
GPU_PIPE_ONE["r3.main"]=()=>r3Desc();
GPU_PIPE_ONE["r3.shadow"]=()=>r3ShDesc();
GPU_PIPE_ONE["r3.down"]=()=>r3DownDesc();
function r3Dev(){
  const d=GPU.dev;if(!d)return false;if(R3.dev===d)return true;
  R3.dev=d;const U=GPUTextureUsage;
  R3.P=gpuPipeline("r3.main",r3Desc);R3.PS=gpuPipeline("r3.shadow",r3ShDesc);R3.PD=gpuPipeline("r3.down",r3DownDesc);
  R3.sh=d.createTexture({size:[R3_SHN,R3_SHN,R3_SH],format:"depth24plus",usage:U.RENDER_ATTACHMENT|U.TEXTURE_BINDING});
  R3.shA=R3.sh.createView({dimension:"2d-array"});
  R3.shL=[];for(let i=0;i<R3_SH;i++)R3.shL.push(R3.sh.createView({dimension:"2d",baseArrayLayer:i,arrayLayerCount:1}));
  R3.ub=d.createBuffer({size:R3_UN*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  R3.cmp=d.createSampler({compare:"less",magFilter:"linear",minFilter:"linear"});
  R3.smp=d.createSampler({magFilter:"linear",minFilter:"linear"});
  R3.skB=[];R3.skG=[];
  for(let i=0;i<R3_SH;i++){const b=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(b,0,new Uint32Array([i,0,0,0]));R3.skB.push(b);
    R3.skG.push(d.createBindGroup({layout:R3.PS.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:b}}]}));}
  R3.g0s=d.createBindGroup({layout:R3.PS.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:R3.ub}}]});
  const bt=d.createTexture({size:[2,2],format:"rgba8unorm",usage:U.TEXTURE_BINDING});R3.blank=bt.createView();
  R3.bgs=new Map();
  return true;
}
/* сетка на устройство */
function r3Up(m){
  const d=GPU.dev;if(m.dev===d&&m.buf)return m.buf;
  m.buf=d.createBuffer({size:Math.max(16,m.v.byteLength),usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  d.queue.writeBuffer(m.buf,0,m.v);m.dev=d;return m.buf;
}
function r3Drop(m){if(m&&m.buf&&m.dev===GPU.dev)GPU.trash.push(m.buf);if(m){m.buf=null;m.dev=null;}}
/* цели рендера холста — в корзину (холст больше не нужен) */
function r3Free(cn){const R=cn&&cn.__rpg,T=R&&R.r3;if(T&&T.dev===GPU.dev)GPU.trash.push(T.ms,T.mv,T.md,T.res,T.vres,T.bl,T.vl,...T.ubs);if(R)R.r3=null;}
/* матрица теней лампы: из её места вдоль d, конус cosO (с запасом) */
function r3ShadowVP(p,dir,cosO,range){
  const up=Math.abs(dir[1])>.9?[0,0,-1]:[0,1,0];
  const V=r3Look(p,[p[0]+dir[0],p[1]+dir[1],p[2]+dir[2]],up);
  const fov=Math.min(2.6,2*Math.acos(clamp(cosO,-1,1))+.25);
  return r3Mul(r3Persp(fov,1,.05,range),V);
}
/* кадр комнаты на холст cn: S — сцена {draws:[[сетка, экземпляр]], vp, cam, lights:[{p,range,c,spot,d,cosO,cosI,shadow,vol}],
   sky, gnd, fog, acc, win, win2, sgn, sgn2, flm, flm2, tsg, tfl, M (Float32Array матриц частей), ot, t};
   post(pass, Sv, Vv, Bv) — последний проход на холст (27f1 rpgField): цвет, дым (половина), ступени отсвета (мипы).
   dst {cx, w, h} — рисовать в чужой холст (портреты: цели рендера общие, картинка — в холст карточки).
   false — нет устройства */
function r3Frame(cn,S,post,dst){
  const R=rpgGet(cn);if(!R||!r3Dev())return false;
  const d=GPU.dev,w=dst?dst.w:cn.width,h=dst?dst.h:cn.height,U=GPUTextureUsage;if(w<2||h<2)return false;
  let T=R.r3;
  if(!T||T.dev!==d||T.w!==w||T.h!==h){
    if(T&&T.dev===d)GPU.trash.push(T.ms,T.mv,T.md,T.res,T.vres,T.bl,T.vl,...T.ubs);
    /* цвет и дым (MSAA → разрешённые), глубина; ступени отсвета — мипы половинного размера; дым — половина */
    const RT=U.RENDER_ATTACHMENT|U.TEXTURE_BINDING,hw=Math.max(1,w>>1),hh=Math.max(1,h>>1);
    let nb=1;while(nb<5&&(Math.min(hw,hh)>>nb)>=8)nb++;
    const ms=()=>d.createTexture({size:[w,h],format:"rgba16float",sampleCount:4,usage:U.RENDER_ATTACHMENT}),
      full=()=>d.createTexture({size:[w,h],format:"rgba16float",usage:RT});
    T=R.r3={dev:d,w,h,nb,ms:ms(),mv:ms(),md:d.createTexture({size:[w,h],format:"depth24plus",sampleCount:4,usage:U.RENDER_ATTACHMENT}),
      res:full(),vres:full(),bl:d.createTexture({size:[hw,hh],mipLevelCount:nb,format:"rgba16float",usage:RT}),
      vl:d.createTexture({size:[hw,hh],format:"rgba16float",usage:RT}),ubs:[],down:[]};
    T.msV=T.ms.createView();T.mvV=T.mv.createView();T.mdV=T.md.createView();T.resV=T.res.createView();T.vresV=T.vres.createView();
    T.blV=T.bl.createView();T.vlV=T.vl.createView();
    const blL=[];for(let i=0;i<nb;i++)blL.push(T.bl.createView({baseMipLevel:i,mipLevelCount:1}));
    const dn=(src,sw,sh,mode,dst)=>{const b=d.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      d.queue.writeBuffer(b,0,new Float32Array([1/sw,1/sh,mode,0]));T.ubs.push(b);
      T.down.push([d.createBindGroup({layout:R3.PD.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:b}},{binding:1,resource:R3.smp},{binding:2,resource:src}]}),dst]);};
    dn(T.resV,w,h,1,blL[0]);
    for(let i=1;i<nb;i++)dn(blL[i-1],Math.max(1,hw>>(i-1)),Math.max(1,hh>>(i-1)),0,blL[i]);
    dn(T.vresV,w,h,0,T.vlV);
    R.bg.clear();
  }
  /* форма */
  const F=R3.U;F.fill(0);
  F.set(S.vp,R3U.vp);F.set([S.cam[0],S.cam[1],S.cam[2],S.t||0],R3U.cam);
  F.set(S.sky,R3U.sky);F.set(S.gnd,R3U.gnd);F.set(S.fog,R3U.fog);F.set(S.acc,R3U.acc);
  if(S.win)F.set(S.win,R3U.win);if(S.win2)F.set(S.win2,R3U.win2);if(S.sgn)F.set(S.sgn,R3U.sgn);if(S.sgn2)F.set(S.sgn2,R3U.sgn2);
  if(S.flm)F.set(S.flm,R3U.flm);if(S.flm2)F.set(S.flm2,R3U.flm2);
  const L=S.lights.slice(0,R3_MAXL),SV=[];
  F[R3U.sgn2+2]=L.length;   /* число ламп — третье число вывески (её .x — глубина, .y — мигание) */
  L.forEach((l,k)=>{const o=R3U.lt+k*16;let si=-1;
    if(l.shadow&&SV.length<R3_SH){si=SV.length;SV.push(r3ShadowVP(l.p,l.d||[0,-1,0],l.spot?l.cosO:-.2,l.range));}
    F.set([l.p[0],l.p[1],l.p[2],l.range, l.c[0],l.c[1],l.c[2],l.spot?1:0, (l.d||[0,-1,0])[0],(l.d||[0,-1,0])[1],(l.d||[0,-1,0])[2],l.spot?l.cosO:-2, si,l.spot?l.cosI:-1,l.vol||0,0],o);});
  SV.forEach((m,k)=>F.set(m,R3U.sv+k*16));
  F.set(S.M,R3U.M);F.set(S.ot,R3U.ot);
  d.queue.writeBuffer(R3.ub,0,F);
  const tsg=S.tsg&&S.tsg.view||R3.blank,tfl=S.tfl&&S.tfl.view||R3.blank;
  const key=rpgTexId(tsg)+"|"+rpgTexId(tfl);
  let g0=R3.bgs.get(key);
  if(!g0){if(R3.bgs.size>16)R3.bgs.clear();
    g0=d.createBindGroup({layout:R3.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:R3.ub}},{binding:1,resource:R3.smp},
      {binding:2,resource:R3.shA},{binding:3,resource:R3.cmp},{binding:4,resource:tsg},{binding:5,resource:tfl}]});R3.bgs.set(key,g0);}
  const enc=d.createCommandEncoder();
  const draw=(p)=>{for(const [m,ii,cnt] of S.draws){if(!m||!m.n)continue;p.setVertexBuffer(0,r3Up(m));p.draw(m.n,cnt||1,0,ii);}};
  /* тени: по слою на лампу */
  for(let k=0;k<R3_SH;k++){
    const p=enc.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:R3.shL[k],depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
    if(k<SV.length){p.setPipeline(R3.PS);p.setBindGroup(0,R3.g0s);p.setBindGroup(1,R3.skG[k]);draw(p);}
    p.end();
  }
  const p=enc.beginRenderPass({colorAttachments:[{view:T.msV,resolveTarget:T.resV,loadOp:"clear",storeOp:"discard",clearValue:{r:0,g:0,b:0,a:1}},
      {view:T.mvV,resolveTarget:T.vresV,loadOp:"clear",storeOp:"discard",clearValue:{r:0,g:0,b:0,a:1}}],
    depthStencilAttachment:{view:T.mdV,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});
  p.setPipeline(R3.P);p.setBindGroup(0,g0);draw(p);p.end();
  for(const [bg,dst] of T.down){
    const q=enc.beginRenderPass({colorAttachments:[{view:dst,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});
    q.setPipeline(R3.PD);q.setBindGroup(0,bg);q.draw(3);q.end();}
  /* последний проход — на холст: форма поля пишется очередью до отправки */
  R.n=0;R.fn=0;R.W=w;R.H=h;R.cssW=w/(R.dpr||1);R.cssH=h/(R.dpr||1);
  const pl=enc.beginRenderPass({colorAttachments:[{view:(dst?dst.cx:R.cx).getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});
  post(pl,{view:T.resV},{view:T.vlV},{view:T.blV});pl.end();
  d.queue.submit([enc.finish()]);
  return true;
}
/* общий последний проход комнат: ореолы ламп (точки экрана), отсвет ярких мест кольцом выборок, тон ACES,
   хроматика у краёв, зерно, виньетка; t1 — подписи поверх (уже в тоне) */
const R3_POST_WGSL=`
fn acesP(x:vec3f)->vec3f{return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),vec3f(0.),vec3f(1.));}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let rs=fu.res.xy;let px=1./rs;let k=fu.res.x/max(fu.res.z,1.);
  /* хроматика растёт от оптического центра: по умолчанию середина холста; v[12] (w>0) — свой центр и сила:
     зал (M814) ставит центр в цель объектива — вещь в фокусе без каймы, у края кадра ≤ пары пикселей */
  /* v[13] (w>0): холст — левая доля x кадра (зал под плитой): uv кадра — vu, его сторона — ar */
  let fw=fu.v[13].w>0.;let ax=select(1.,fu.v[13].x,fw);let vu=vec2f(uv.x*ax,uv.y);let ar=select(fu.res.w/fu.res.z,fu.v[13].y,fw);
  let oc=select(vec2f(.5),fu.v[12].xy,fu.v[12].w>0.);let cs=select(.006,fu.v[12].z,fu.v[12].w>0.);
  let c0=(vu-oc)*length(vu-oc)*cs;let ca=vec2f(c0.x/ax,c0.y);
  var c=vec3f(textureSampleLevel(t0,smp,uv+ca,0.).r,textureSampleLevel(t0,smp,uv,0.).g,textureSampleLevel(t0,smp,uv-ca,0.).b);
  /* резкость (v[13].z > 0 — зал, M814): четыре соседа, нерезкая маска зажата в их же размах — ступень силуэта и деления
     круче, ореола нет; только по маске тел (альфа кадра, раздвинутая на пиксель — силуэт резок с обеих сторон):
     рейки и швы стены за рядом не точатся в муар. Кантина и портреты без неё */
  if(fu.v[13].z>0.){let h0=textureSampleLevel(t0,smp,uv+vec2f(px.x,0.),0.);let h1=textureSampleLevel(t0,smp,uv-vec2f(px.x,0.),0.);
    let h2=textureSampleLevel(t0,smp,uv+vec2f(0.,px.y),0.);let h3=textureSampleLevel(t0,smp,uv-vec2f(0.,px.y),0.);
    let g0=h0.rgb;let g1=h1.rgb;let g2=h2.rgb;let g3=h3.rgb;
    let sm=max(max(max(h0.a,h1.a),max(h2.a,h3.a)),textureSampleLevel(t0,smp,uv,0.).a);
    let mn=min(min(min(g0,g1),min(g2,g3)),c);let mx=max(max(max(g0,g1),max(g2,g3)),c);
    c=clamp(c+(c-(g0+g1+g2+g3)*.25)*fu.v[13].z*sm,mn,mx);}
  /* дым в лучах: половинный слой палаткой из четырёх — шум шагов уходит, тени людей в луче остаются */
  let vq=.75/vec2f(textureDimensions(t2));
  c+=(textureSampleLevel(t2,smp,uv+vq*vec2f(-1.,-1.),0.).rgb+textureSampleLevel(t2,smp,uv+vq*vec2f(1.,-1.),0.).rgb
     +textureSampleLevel(t2,smp,uv+vq*vec2f(-1.,1.),0.).rgb+textureSampleLevel(t2,smp,uv+vq*vec2f(1.,1.),0.).rgb)*.25;
  /* отсвет ярких: ступени мипов, каждая палаткой — от узкого ореола до широкой дымки */
  var b=vec3f(0.);let nl=i32(textureNumLevels(t3));
  for(var i=0;i<5;i++){if(i>=nl){break;}
    let bd=1./vec2f(textureDimensions(t3,i));let lf=f32(i);
    let s=textureSampleLevel(t3,smp,uv+bd*vec2f(-.5,-.5),lf).rgb+textureSampleLevel(t3,smp,uv+bd*vec2f(.5,-.5),lf).rgb
         +textureSampleLevel(t3,smp,uv+bd*vec2f(-.5,.5),lf).rgb+textureSampleLevel(t3,smp,uv+bd*vec2f(.5,.5),lf).rgb;
    b+=s*.25*(.34-.05*lf);}
  c+=b*.55*fu.v[11].w;
  /* ореолы ламп: колба за абажуром и в дыму */
  for(var i=0;i<6;i++){let L=fu.v[i];if(L.w<=0.){continue;}let d=(p-L.xy)/max(L.z,1.);
    c+=fu.v[6].rgb*L.w*(.55/(1.+dot(d,d)*9.)+.18/(1.+dot(d,d)));}
  c=pow(acesP(c*fu.v[6].w),vec3f(1./2.2));
  let vd=length((vu-.5)*vec2f(1.,ar)*1.6);
  c*=1.-.42*smoothstep(.45,1.15,vd);
  let gp=floor(p*k);let t=fu.v[10].w;
  let gr=fract(sin(dot(gp+vec2f(fract(t*.37)*91.,fract(t*.53)*57.),vec2f(127.1,311.7)))*43758.5453)-.5;
  c=c*(1.+.05*gr*fu.v[11].x)+(fract(sin(dot(gp*1.37,vec2f(12.9,78.2)))*43758.5)-.5)/255.;
  let l=textureSampleLevel(t1,smp,uv,0.);
  c=c*(1.-l.a)+l.rgb;
  return vec4f(max(c,vec3f(0.)),1.);}`;
