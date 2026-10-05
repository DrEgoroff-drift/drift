/* ══════════════ корабль в объёме (M710, docs/DESIGN-space.md «Ships») ══════════════
   Корпус в полёте — настоящая сетка из тех же данных hullOf, а не спрайт со сжатием по крену.
   Тело — лофт по станциям профиля, сечение — суперэллипс: квадратность и высота от изготовителя
   (Орднунг — ящик, Хай-Фронт — плоская капля), брюхо площе спины. Плоскости крыльев, бочки
   гондол и сопел, боксы, тара, рубка, фонарь, бур, штанга, радиаторы, навеска — объёмом.
   Краска — та же выпечка тела 17c2, спроецированная сверху: ливрея, панели, налёт, шрамы,
   пломбы и приметы изготовителя по-прежнему кладут кисти 03e, и только они. Всё, что нарисовано,
   но объёма не получило (мачты, стойки, крюк, каркас), живёт на плоскости краски посередине
   высоты корпуса — вырезом по альфе выпечки: ни одна примета не теряется.
   Свет — настоящий: звезда с высоты H3D_LZ, заливка снизу темнее, блик по маске металла,
   стекло, огни сцены (текстура света 08b), огонь у кормы. Свои огни (окна) — по маске материала.
   Рисуется в свой слой ×4 MSAA (слой текстуры-массива) отдельной отправкой до кадра — проход
   сцены не рвётся, — и ложится в сцену одной картинкой смешением "hull" (маска корпуса 08b).
   ?h3d=0 или H3D.on=false — старый спрайт 17c2 */
const H3D={on:typeof location==="undefined"||!/[?&]h3d=0\b/.test(location.search),M:new WeakMap(),dev:null,frame:-1,slot:0};
const H3D_N=512,H3D_L=4;   /* сторона слоя (пиксели устройства) и слоёв на кадр: свой корабль и трое рядом */
const H3D_LZ=.48,H3D_FILL=.30,H3D_KEY=1.6;   /* высота звезды над плоскостью; заливка; сила звезды */
const H3D_RING=24;
/* изготовитель → [квадратность сечения, высота спины к полуширине, лоск] */
const H3D_MK={gt:[2.6,.6,.6],co:[2.2,.52,1],or:[3.6,.66,.8],km:[3,.7,.45],ra:[2.4,.62,.35],hf:[2,.46,1.15]};
const H3D_CARGO=[[62,86,116],[128,72,44],[86,92,64],[112,116,120],[54,60,70]];   /* тара — как у кисти 03b */

/* ── сетка ── вершина: место, нормаль, цвет, доля своего цвета (на бортах; 2 — только свой), блик, огонь
   (−1 — плоскость краски). Координаты корпуса: x — к носу, y — борт (вниз по экрану при курсе 0), z — к зрителю */
function h3dMesh(h){
  let m=H3D.M.get(h);if(m)return m;
  const V=[],K=H3D_MK[h.by]||H3D_MK.gt,ne=K[0],kh=K[1];
  const C=c=>[c[0]/255,c[1]/255,c[2]/255];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2]);return l>1e-9?[v[0]/l,v[1]/l,v[2]/l]:null;};
  const vx=(p,n,c,w,sp,em)=>V.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],w,sp,em);
  const ctr=P=>{const c=[0,0,0];for(const p of P){c[0]+=p[0];c[1]+=p[1];c[2]+=p[2];}return c.map(v=>v/P.length);};
  /* плоская грань (выпуклая): нормаль по Ньюэллу, наружу от точки inn */
  const face=(P,inn,col,w,sp,em)=>{
    const n=[0,0,0];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];
      n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}
    let u=nrm(n);if(!u)return;if(dot(u,sub(ctr(P),inn))<0)u=u.map(v=>-v);
    for(let i=1;i+1<P.length;i++){vx(P[0],u,col,w,sp,em);vx(P[i],u,col,w,sp,em);vx(P[i+1],u,col,w,sp,em);}
  };
  /* гладкая поверхность по кольцам (каждое замкнуто: последняя точка = первая); наружу — от центра кольца.
     Нормаль у станции — своя у каждого пролёта: стык секций читается гранью, как на листах */
  const loft=(R,col,w,sp,em)=>{
    for(let k=0;k+1<R.length;k++){const A=R[k],B=R[k+1],N=A.length-1,ca=ctr(A.slice(0,N)),cb=ctr(B.slice(0,N));
      const na=[],nb=[];
      for(let i=0;i<=N;i++){const im=i===0?N-1:i-1,ip=i===N?1:i+1,D=sub(B[i],A[i]);
        let a=nrm(crs(D,sub(A[ip],A[im]))),b=nrm(crs(D,sub(B[ip],B[im])));
        if(!a)a=b;if(!b)b=a;if(!a)a=b=[0,0,1];
        if(dot(a,sub(A[i],ca))<0)a=a.map(v=>-v);if(dot(b,sub(B[i],cb))<0&&Math.hypot(...sub(B[i],cb))>1e-6)b=b.map(v=>-v);
        else if(Math.hypot(...sub(B[i],cb))<=1e-6&&dot(b,a)<0)b=b.map(v=>-v);
        na.push(a);nb.push(b);}
      for(let i=0;i<N;i++){
        vx(A[i],na[i],col,w,sp,em);vx(B[i],nb[i],col,w,sp,em);vx(B[i+1],nb[i+1],col,w,sp,em);
        vx(A[i],na[i],col,w,sp,em);vx(B[i+1],nb[i+1],col,w,sp,em);vx(A[i+1],na[i+1],col,w,sp,em);}
    }
  };
  /* тело вращения вдоль x: ось (y,z), профиль [[dx,r]] от кормы к носу; торцы — крышки */
  const lathe=(x,y,z,P,col,w,sp,em,N,capA,capB)=>{N=N||16;
    const R=P.map(([dx,r])=>{const q=[];for(let i=0;i<=N;i++){const t=i/N*TAU;q.push([x+dx,y+Math.cos(t)*r,z+Math.sin(t)*r]);}return q;});
    loft(R,col,w,sp,em);
    if(capA)face(R[0].slice(0,N),[x+P[0][0]+1,y,z],capA[0],2,capA[1],capA[2]);
    if(capB)face(R[R.length-1].slice(0,N),[x+P[P.length-1][0]-1,y,z],capB[0],2,capB[1],capB[2]);
  };
  /* ящик со скошенной верхней кромкой: скос ловит звезду со своей стороны и тень с другой */
  const box=(x0,x1,y0,y1,z0,z1,b,col,w,sp)=>{
    b=Math.max(0,Math.min(b,(x1-x0)*.3,(y1-y0)*.3,(z1-z0)*.5));const zb=z1-b,c=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];
    const T=[[x0+b,y0+b,z1],[x1-b,y0+b,z1],[x1-b,y1-b,z1],[x0+b,y1-b,z1]],M=[[x0,y0,zb],[x1,y0,zb],[x1,y1,zb],[x0,y1,zb]],
      Bt=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]];
    face(T,c,col,w,sp,0);
    for(let i=0;i<4;i++){const j=(i+1)%4;if(b>0)face([M[i],M[j],T[j],T[i]],c,col,w,sp,0);face([Bt[i],Bt[j],M[j],M[i]],c,col,w,sp,0);}
    face(Bt,c,col,w,sp,0);
  };
  const hgt=w=>Math.min(w*kh,1.6+w*.34),hb=w=>hgt(w)*.55;
  const deck=(x,y)=>{const w=profW(h.prof,x);if(Math.abs(y)>=w)return 0;return hgt(w)*Math.pow(1-Math.pow(Math.abs(y)/w,ne),1/ne);};
  const deckMax=(x0,x1,y0,y1)=>{let z=0;for(let i=0;i<=4;i++)for(let j=0;j<=4;j++)z=Math.max(z,deck(x0+(x1-x0)*i/4,y0+(y1-y0)*j/4));return z;};
  const col=C(h.col),iron=C(h.iron),side=C(mixc(h.body,h.dark,.3)),dark=C(h.dark),gl=K[2];
  const ember=C(mixc(h.iron,[0,0,0],.6));

  /* тело: станции профиля, нос — остриём в вершину обвода, корма — плита */
  const N=H3D_RING,e2=2/ne;
  const ring=(x,w)=>{w=Math.max(w,.3);const q=[];for(let i=0;i<=N;i++){const t=i/N*TAU,c=Math.cos(t),s=Math.sin(t);
    q.push([x,w*Math.sign(c)*Math.pow(Math.abs(c),e2),(s>=0?hgt(w):hb(w))*Math.sign(s)*Math.pow(Math.abs(s),e2)]);}return q;};
  const tip=(h.poly&&h.poly[0]&&Math.abs(h.poly[0][1])<.01)?h.poly[0][0]:h.nose+1;
  const R=h.prof.map(([x,w])=>ring(x,w));
  const tz=hgt(h.prof[0][1])*.12,T=[];for(let i=0;i<=N;i++)T.push([tip,0,tz]);
  loft([T].concat(R),col,.85,-gl,0);   /* блик со знаком «−» — это тело: тень тела на себя не считается */
  const L=R[R.length-1];face(L.slice(0,N),[L[0][0]+1,0,0],iron,2,-.3,0);

  /* сопла — тёмные бочки из кормы, раструб и зев (тлеет, когда тяги нет) */
  if(!h.yac)for(const e of h.eng){const bl=Math.max(3,e.r*2.4),br=e.r*1.05,x0=e.x-bl*.1;
    lathe(x0,e.y,0,[[-e.r*.5,br*1.12],[-e.r*.15,br*1.02],[0,br],[bl,br],[bl+.6,br*.8]],iron,.6,.7,0,14,[ember,0,1],null);}
  /* крылья: плита у оси корпуса, рёбра — тёмные; икс-крыло разводит пары вверх и вниз */
  h.wings.forEach((W,wi)=>{for(const s of [1,-1]){
    const ymin=Math.min(...W.map(p=>Math.abs(p[1]))),dh=h.form==="xwing"?(wi%2?-.16:.16):0,tw=.35;
    const P=W.map(([x,y])=>[x,y*s,(Math.abs(y)-ymin)*dh]);
    const tr=h3dEar(P);if(!tr)return;
    for(const [a,b,c] of tr){
      face([[...P[a].slice(0,2),P[a][2]+tw],[...P[b].slice(0,2),P[b][2]+tw],[...P[c].slice(0,2),P[c][2]+tw]],[P[a][0],P[a][1],P[a][2]-9],col,0,gl,0);
      face([[...P[a].slice(0,2),P[a][2]-tw],[...P[b].slice(0,2),P[b][2]-tw],[...P[c].slice(0,2),P[c][2]-tw]],[P[a][0],P[a][1],P[a][2]+9],col,0,gl,0);}
    const cw=ctr(P);
    for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];
      face([[a[0],a[1],a[2]-tw],[b[0],b[1],b[2]-tw],[b[0],b[1],b[2]+tw],[a[0],a[1],a[2]+tw]],[cw[0],cw[1],(a[2]+b[2])/2],dark,2,.4,0);}
  }});
  /* гондолы: бочка с округлым носом и горячим срезом */
  for(const n of h.nacs)for(const s of [1,-1]){const r=n.r,l=n.l;
    lathe(n.x,n.y*s,0,[[-l/2,r*.86],[-l/2+.35,r],[l/2-r*.9,r],[l/2-r*.35,r*.72],[l/2,r*.18]],iron,.7,.8,0,16,[ember,0,.6],null);}
  /* боксы по бортам */
  for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1])){const y0=s>0?p[1]:-p[1]-p[3];
    box(p[0],p[0]+p[2],y0,y0+p[3],-p[3]*.42,p[3]*.42,p[3]*.18,C(mixc(h.iron,[255,255,255],.12)),.8,.6);}
  const M=h.mark||{};
  /* тара на палубе: ящик своего хозяина */
  if(M.cont)M.cont.forEach((c,ci)=>{for(const s of [1,-1]){const y=c[2]*s,gy=s>0?y-c[2]*.55:y-c[2]*.45;
    const hc=clamp(Math.min(c[1],c[2])*.42,.8,3),cc=H3D_CARGO[hashi(ci,h.seed,0x3F1)%H3D_CARGO.length];
    box(c[0],c[0]+c[1],gy,gy+c[2],0,deckMax(c[0],c[0]+c[1],gy,gy+c[2])+hc,.18,C(mixc(cc,[0,0,0],.2)),.9,.5);}});
  /* рубка — у кого она есть, фонаря нет (как у кисти 03e) */
  if(M.bridge){const B=M.bridge;
    box(B.x-B.l/2,B.x+B.l/2,-B.w/2,B.w/2,0,deckMax(B.x-B.l/2,B.x+B.l/2,-B.w/2,B.w/2)+Math.max(1.3,B.w*.3),Math.min(B.l,B.w)*.16,side,.85,gl);}
  else if(h.canopy){const cp=h.canopy,zc=deck(cp.x,0)-cp.ry*.25,rz=Math.max(.8,cp.ry*.8),Q=[];
    for(let k=0;k<=8;k++){const ph=-Math.PI/2+Math.PI*k/8,cf=Math.max(Math.cos(ph),.02),q=[];
      for(let i=0;i<=16;i++){const t=i/16*TAU;q.push([cp.x+cp.rx*Math.sin(ph),Math.cos(t)*cp.ry*cf,zc+Math.sin(t)*rz*cf]);}Q.push(q);}
    loft(Q,C([16,34,48]),0,1.6,0);}
  /* бур — конус вперёд; штанга — прут с шаром */
  if(M.drill){const d=M.drill;lathe(d.x,0,0,[[0,d.r*.9],[d.l*.15,d.r],[d.l,.08]],C(h.lite),.5,.9,0,16,[iron,.3,0],null);}
  if(M.boom){const b=M.boom,r=b.r*.45,rb=b.r*1.5;
    lathe(h.nose-1,0,0,[[0,r],[b.l+1,r]],C(h.lite),.6,.8,0,8,null,null);
    const S=[];for(let k=0;k<=6;k++){const ph=-Math.PI/2+Math.PI*k/6;S.push([rb*Math.sin(ph),Math.max(rb*Math.cos(ph),.01)]);}
    lathe(h.nose+b.l,0,0,S,C(h.lite),.6,.9,0,10,null,null);}
  /* радиаторы — тонкие плиты за бортом (стойки — на плоскости краски) */
  if(M.rad)for(const Rd of M.rad)for(const s of [1,-1]){const y0=Math.min(Rd.w*s,(Rd.w+Rd.th)*s),y1=Math.max(Rd.w*s,(Rd.w+Rd.th)*s);
    box(Rd.x-Rd.l/2,Rd.x+Rd.l/2,y0,y1,-.18,.18,0,C(h.radm),.9,.5);}
  /* навеска на палубе: мелкие коробки, круглые — со скосом побольше */
  for(const g of h.greeb){const x0=g[4]?g[0]-g[2]*.5:g[0],y0=g[4]?g[1]-g[2]*.5:g[1],x1=g[4]?x0+g[2]:x0+g[2],y1=g[4]?y0+g[2]:y0+g[3];
    const zt=deckMax(x0,x1,y0,y1);if(zt<=0)continue;
    box(x0,x1,y0,y1,Math.max(0,zt-.6),zt+.25+.12*Math.min(x1-x0,y1-y0),g[4]?Math.min(x1-x0,y1-y0)*.3:.12,side,.7,gl);}

  /* плоскость краски — посередине высоты, вырезом по альфе выпечки */
  const E=hullGpuE(h),zp=-.05,up=[0,0,1],Z=[0,0,0];
  for(const p of [[-E,-E],[E,-E],[E,E],[-E,-E],[E,E],[-E,E]])vx([p[0],p[1],zp],up,Z,0,0,-1);

  let r=0;for(let i=0;i<V.length;i+=12)r=Math.max(r,Math.hypot(V[i],V[i+1],V[i+2]));
  const st=[[tip,.3]].concat(h.prof).slice(0,16);
  m={v:new Float32Array(V),n:V.length/12,R:Math.max(E,r*1.02),E,buf:null,dev:null,st,ne,kh};
  H3D.M.set(h,m);return m;
}
/* треугольники простого многоугольника ушами (крыло бывает вогнутым); P — точки [x,y,…] */
function h3dEar(P){
  const n=P.length;if(n<3)return null;
  let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1];}
  const sg=A>0?1:-1,I=[...Array(n).keys()],out=[];
  const cr=(a,b,c)=>((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*sg;
  const inside=(p,a,b,c)=>cr(a,b,p)>=0&&cr(b,c,p)>=0&&cr(c,a,p)>=0;
  let guard=0;
  while(I.length>3&&guard++<200){let cut=false;
    for(let k=0;k<I.length;k++){const i0=I[(k+I.length-1)%I.length],i1=I[k],i2=I[(k+1)%I.length];
      const a=P[i0],b=P[i1],c=P[i2];if(cr(a,b,c)<=1e-9)continue;
      let ok=true;for(const j of I){if(j===i0||j===i1||j===i2)continue;if(inside(P[j],a,b,c)){ok=false;break;}}
      if(!ok)continue;out.push([i0,i1,i2]);I.splice(k,1);cut=true;break;}
    if(!cut)break;}
  if(I.length===3)out.push([I[0],I[1],I[2]]);
  return out;
}

const H3D_WGSL=`diagnostic(off, derivative_uniformity);
struct U{v:array<vec4f,32>};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var tb:texture_2d<f32>;
@group(0) @binding(3) var tm:texture_2d<f32>;
@group(0) @binding(4) var tl:texture_2d<f32>;
struct VI{@location(0) p:vec3f,@location(1) n:vec3f,@location(2) c:vec4f,@location(3) m:vec2f};
struct VO{@builtin(position) q:vec4f,@location(0) o:vec3f,@location(1) n:vec3f,@location(2) c:vec4f,@location(3) m:vec2f,
  @location(4) s:vec2f,@location(5) no:vec3f};
/* корпус → экран: крен вокруг продольной оси, потом курс; y экрана вниз, z — к зрителю */
fn rot(v:vec3f)->vec3f{let a=u.v[1];let y=v.y*a.z-v.z*a.w;let z=v.y*a.w+v.z*a.z;
  return vec3f(v.x*a.x-y*a.y,v.x*a.y+y*a.x,z);}
@vertex fn vs(i:VI)->VO{var o:VO;let r=rot(i.p);let R=u.v[0].w;
  o.q=vec4f(r.x/R,-r.y/R,.5-r.z/(2.2*R),1.);
  o.o=i.p;o.n=rot(i.n);o.no=i.n;o.c=i.c;o.m=i.m;o.s=u.v[0].xy+r.xy*u.v[0].z;return o;}
/* тело как поле: станции профиля u.v[9..], сечение — тот же суперэллипс; <1 — внутри */
fn bodyF(p:vec3f)->f32{let n=i32(u.v[8].y);let ne=u.v[7].w;let kh=u.v[8].x;
  if(p.x>u.v[9].x||p.x<u.v[8+n].x){return 9.;}
  var w=.3;
  for(var k=0;k<15;k++){if(k+1>=n){break;}let a=u.v[9+k];let b=u.v[10+k];
    if(p.x<=a.x&&p.x>=b.x){w=mix(a.y,b.y,(a.x-p.x)/max(a.x-b.x,1e-4));break;}}
  w=max(w,.3);let hh=min(w*kh,1.6+w*.34)*select(.55,1.,p.z>=0.);
  return pow(abs(p.y)/w,ne)+pow(abs(p.z)/hh,ne);}
/* тень тела по лучу к звезде (в осях корпуса), шаги растут квадратом; край мягкий */
fn bodySh(p:vec3f)->f32{var s=1.;let L=u.v[7].xyz;
  for(var j=1;j<=6;j++){let t=f32(j*j)*.35;s=min(s,clamp((bodyF(p+L*t)-1.)*1.6,0.,1.));}
  return s;}
struct FO{@location(0) c:vec4f,@builtin(sample_mask) k:u32};
@fragment fn fs(i:VO)->FO{
  let E=u.v[3].w;let uv=(i.o.xy/E+1.)*.5;
  let b=textureSampleBias(tb,smp,uv,${HG_BODY_LOD});
  let q=textureSampleBias(tm,smp,vec2f(.5+uv.x*.5,uv.y),${HG_BODY_LOD});
  let dec=i.m.y<-.5;
  var n=normalize(i.n);if(dec&&n.z<0.){n=-n;}
  let pa=b.rgb/max(b.a,1e-3);
  /* своя краска части: на бортах (по нормали корпуса) и там, где выпечка пуста */
  var sw=select(i.c.w*(1.-smoothstep(.2,.65,abs(normalize(i.no).z))),1.,i.c.w>1.5);
  sw=max(sw,1.-smoothstep(.1,.5,b.a));if(dec){sw=0.;}
  let alb=mix(pa,i.c.rgb,sw);
  let mk=q.xyz/max(q.w,1e-3)*(1.-sw);
  let L=u.v[2].xyz;let sc=u.v[3].rgb;let ndl=dot(n,L);
  /* части (не тело) — в тени тела и темнее у самого борта */
  let part=i.m.x>=0.;let sh=select(1.,bodySh(i.o),part);
  let ao=select(1.,1.-.42*(1.-smoothstep(1.,2.4,bodyF(i.o))),part);
  let fill=u.v[4].rgb*(.62+.38*max(n.z,0.))*ao;
  let key=sc*${H3D_KEY}*max(ndl,0.)*sh;
  /* огни сцены: отрезок-источник над плоскостью, без заслонов */
  var pl=vec3f(0.);let hz=u.v[0].w*u.v[0].z*.3;
  for(var k=0;k<16;k++){let A=textureLoad(tl,vec2i(k,0),0);let B=textureLoad(tl,vec2i(k,1),0);if(B.w<=0.){break;}
    let ab=A.zw-A.xy;let t=clamp(dot(i.s-A.xy,ab)/max(dot(ab,ab),1e-4),0.,1.);let dv=A.xy+ab*t-i.s;let d2=dot(dv,dv);
    pl+=B.rgb*max(dot(n,normalize(vec3f(dv,hz))),0.)/(1.+d2/(B.w*B.w))*.25;}   /* корпусу — четверть, как спрайту (17c: .2) */
  /* огонь у кормы: тёплый свет назад и вбок (конус от оси, как у спрайта 17c), по граням к огню;
     с потолком — у Мамонта язык длиннее корпуса, и без потолка он выбеливал всё тело */
  var fs=vec3f(0.);
  if(u.v[5].w>0.){let fv=u.v[5].xy-i.s;let fd=length(fv);let r0=u.v[6].w;let rr=u.v[5].z;
    let fa=max(dot(n,normalize(vec3f(fv,hz*.3))),0.);
    let ax=dot(-fv,u.v[1].xy);let lat=abs(dot(-fv,vec2f(-u.v[1].y,u.v[1].x)));
    let bk=1.-smoothstep(-r0*.2,r0*.3,ax-lat*.9);
    fs=u.v[6].rgb*u.v[5].w*${RL_FL}*fa*bk*(1.-smoothstep(r0,rr,fd));}
  let H=normalize(L+vec3f(0.,0.,1.));let nh=max(dot(n,H),0.);
  let met=mk.y;let gls=mk.z;let gl=u.v[2].w;
  let sp=sh*sc*step(0.,ndl)*(pow(nh,mix(18.,70.,met))*(abs(i.m.x)*.3*gl+met*.8)+gls*(.06+2.2*pow(nh,140.)));
  let rim=vec3f(.55,.68,.85)*pow(1.-max(n.z,0.),3.)*.12;
  let em=mk.x;
  var c=alb*(fill+key+pl+rim)*(1.-em)+alb*em*${RL_EM}+sp*(1.-em)+min(alb*fs,u.v[6].rgb*.16)*(1.-em);
  c+=vec3f(1.,.42,.16)*max(i.m.y,0.)*u.v[4].w;
  var o:FO;o.c=vec4f(c,1.);o.k=0xFu;
  /* плоскость краски: доля выборок по альфе выпечки, узор поворачивается от пикселя к пикселю */
  if(dec){let a=smoothstep(.25,.75,b.a);if(a<.06){discard;}
    let nk=u32(clamp(round(a*4.),1.,4.));let m=0xFu>>(4u-nk);let r=(u32(i.q.x)+2u*u32(i.q.y))&3u;
    o.k=((m<<r)|(m>>((4u-r)&3u)))&0xFu;}
  return o;}`;

function h3dDesc(){
  const mod=gpuShader(H3D_WGSL);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vs",buffers:[{arrayStride:48,attributes:[
      {shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},
      {shaderLocation:2,offset:24,format:"float32x4"},{shaderLocation:3,offset:40,format:"float32x2"}]}]},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},
    primitive:{topology:"triangle-list",cullMode:"none"},multisample:{count:4},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less"}};
}
/* слои и буферы — на устройство */
function h3dDev(){
  const d=GPU.dev;if(H3D.dev===d)return;
  H3D.dev=d;const U=GPUTextureUsage,RA=U.RENDER_ATTACHMENT;
  H3D.ms=d.createTexture({size:[H3D_N,H3D_N],format:"rgba16float",sampleCount:4,usage:RA});
  H3D.md=d.createTexture({size:[H3D_N,H3D_N],format:"depth24plus",sampleCount:4,usage:RA});
  H3D.lay=d.createTexture({size:[H3D_N,H3D_N,H3D_L],format:"rgba16float",usage:RA|U.TEXTURE_BINDING});
  H3D.msV=H3D.ms.createView();H3D.mdV=H3D.md.createView();
  H3D.img=[];for(let i=0;i<H3D_L;i++)H3D.img.push({view:H3D.lay.createView({dimension:"2d",baseArrayLayer:i,arrayLayerCount:1})});
  H3D.ub=d.createBuffer({size:512,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  H3D.U=new Float32Array(128);H3D.P=null;
}
/* корпус в объёме на место спрайта 17c2: x,y — экран, a — курс, sc — масштаб, bank — крен,
   (lx,ly) — к звезде, B — выпечка тела (hullGpuBake), fl — огонь у кормы на экране или null.
   false — слоя нет (не тот кадр, слои кончились): рисуй спрайтом */
function h3dDraw(h,B,x,y,a,sc,bank,lx,ly,fl,ember){
  if(!H3D.on||!GPU.on||!GPU.dev||!GPU.enc)return false;
  const T=B.B;if(!T||!T.view)return false;
  if(T.draw)gpuBakeLive(T);
  h3dDev();
  if(H3D.frame!==GPU.frameNo){H3D.frame=GPU.frameNo;H3D.slot=0;}
  if(H3D.slot>=H3D_L)return false;
  const d=GPU.dev,m=h3dMesh(h);
  if(m.dev!==d){m.buf=d.createBuffer({size:m.v.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});d.queue.writeBuffer(m.buf,0,m.v);m.dev=d;}
  if(!H3D.P)H3D.P=gpuPipeline("h3d.hull",h3dDesc);
  const dk=GPU.bw/W,Rb=m.R,n=Math.max(8,Math.min(H3D_N,Math.ceil(2*Rb*sc*dk)));
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],cm=Math.max(1,c[0],c[1],c[2]);
  let sl=Math.hypot(lx,ly);const sx=sl>1e-6?lx/sl:.6,sy=sl>1e-6?ly/sl:-.8,ll=Math.hypot(1,H3D_LZ);
  const U=H3D.U;U.fill(0);
  U[0]=x;U[1]=y;U[2]=sc;U[3]=Rb;
  U[4]=Math.cos(a);U[5]=Math.sin(a);U[6]=Math.cos(bank||0);U[7]=Math.sin(bank||0);
  U[8]=sx/ll;U[9]=sy/ll;U[10]=H3D_LZ/ll;U[11]=(H3D_MK[h.by]||H3D_MK.gt)[2];
  U[12]=c[0]/cm;U[13]=c[1]/cm;U[14]=c[2]/cm;U[15]=m.E;
  U[16]=H3D_FILL;U[17]=H3D_FILL*1.02;U[18]=H3D_FILL*1.08;U[19]=ember||0;
  if(fl){U[20]=fl.x;U[21]=fl.y;U[22]=Math.max(fl.r,1);U[23]=fl.k;U[24]=fl.c[0];U[25]=fl.c[1];U[26]=fl.c[2];U[27]=fl.r0||0;}
  /* звезда в осях корпуса — для тени: обратно курсу, потом обратно крену */
  {const ca=U[4],sa=U[5],cb=U[6],sb=U[7],X=U[8]*ca+U[9]*sa,Y=-U[8]*sa+U[9]*ca,Z=U[10];
    U[28]=X;U[29]=Y*cb+Z*sb;U[30]=-Y*sb+Z*cb;U[31]=m.ne;}
  U[32]=m.kh;U[33]=m.st.length;for(let i=0;i<m.st.length;i++){U[36+i*4]=m.st[i][0];U[37+i*4]=m.st[i][1];}
  d.queue.writeBuffer(H3D.ub,0,U);
  const mat=T.mat||{view:GPU.nView||(GPU.nView=GPU.N.createView())};
  const bg=d.createBindGroup({layout:H3D.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:H3D.ub}},{binding:1,resource:gpuMipSmp()},
    {binding:2,resource:T.view},{binding:3,resource:mat.view},{binding:4,resource:GPU.V.lt}]});
  const L=H3D.slot++,enc=d.createCommandEncoder();
  const p=enc.beginRenderPass({colorAttachments:[{view:H3D.msV,resolveTarget:H3D.img[L].view,loadOp:"clear",storeOp:"discard",clearValue:{r:0,g:0,b:0,a:0}}],
    depthStencilAttachment:{view:H3D.mdV,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});
  p.setViewport(0,0,n,n,0,1);p.setScissorRect(0,0,n,n);
  p.setPipeline(H3D.P);p.setBindGroup(0,bg);p.setVertexBuffer(0,m.buf);p.draw(m.n);p.end();
  d.queue.submit([enc.finish()]);
  const pass=gpuScene();if(!pass)return false;
  gpuImage(pass,H3D.img[L],[{x,y,w:2*Rb*sc,h:2*Rb*sc,u1:n/H3D_N,v1:n/H3D_N}],{blend:"hull"});
  return true;
}
