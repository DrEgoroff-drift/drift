/* ══════════════ планета: набор тел — трава, цветок, камень, скала, розетка, куст, дерево (M611) ══════════════
   Всё, что растёт и лежит на земле, — из одного набора. Тело строится раз на
   устройство, в своей мерке (пучок и камень — метр, дерево — десять), а в мир
   его ставит запись расстановки (21pc): место, размер, поворот, доля высоты и
   два цвета. Сто тысяч пучков травы — это шесть сеток и сто тысяч записей, а
   не два миллиона вершин на куске земли.

   Формы — со стенда docs/look (M600): шапка с плоским исподом, розетка с
   поникшими листьями, гранёный камень со мхом на макушке. Скала крутой
   ступени — шар, срубленный плоскостями: шесть уступов, три высоких и три
   лежачих. Деревья — шесть пород с разным обводом, они в 21pgb. Оранжевого в
   наборе нет: он у людей и у руды.

   Цвет. Пучки, розетки и кусты несут в вершине только ход от корня к макушке
   (r) и свою светлоту (g): оба цвета даёт запись (режим 1). У дерева так
   красится одна крона, кора остаётся своей (режим 2). Камень и скала несут
   долю мха (r) и светлоту грани (g), цвет камня и мха даёт запись (режим 1):
   на безвоздушном мире мох — пыль своего цвета. Цветок и колос несут свой
   цвет, запись его подкрашивает (режим 0).
   Краски — по миру: пучки, листья-блюдца на воде пруда (зелёные и, изредка, в цвет акцента),
   дальний берег (та же зелень, тише) — рабочий лист PLN_FL (21pfa). */
const PLN_TINTS=PLN_FL.tints,PLN_PADS=PLN_FL.pads,PLN_TINTS_FAR=PLN_FL.far;
const PLN_FLORA={gen:-1,kit:null,
  dens:17,                             /* пучков на квадратный метр полки до прореживания */
  wide:1.55,                           /* лист шире, чем в жизни: в масштабе игры ковёр — фактура, а не рисунок */
  foot:.45,                            /* при какой высоте пучка его след — как на стенде */
  treeH:10};                           /* мерка дерева в наборе, м */

/* Пучок: три-четыре листа из одного корня, каждый гнётся в свою сторону. Листья стоят лицом к
   объективу, и нормаль у них клонится к нему же: запись поворачивает пучок лишь слегка.
   o: rings, w0 и w1 (ширина листа), off (разброс корней), lean, wk (ветер) */
function plnFloraTuft(m,r,o){
  const nb=3+(r()*2|0),S=o.rings,M=PLN_MAT.grass;
  for(let b=0;b<nb;b++){
    const yaw=(r()-.5)*1.9,lean=(r()-.5)*o.lean,w=o.w0+r()*o.w1,bh=.6+r()*.5;
    const ox=(r()-.5)*o.off,oz=(r()-.5)*o.off,dx=Math.cos(yaw),dz=Math.sin(yaw);
    const nr=plnNorm([(r()-.5)*.5,1,-.35+(r()-.5)*.3]),g=.5+(r()-.5)*.14;
    let pa=-1,pb=-1;
    for(let s=0;s<=S;s++){
      const t=s/S,ww=w*(1-t*t)*.5+(s===S?0:.01),bend=lean*bh*t*t;
      const c=[ox-dz*bend,bh*t-.1,oz+dx*bend],col=[Math.pow(t,.8),g,0],wd=t*t*o.wk*bh;
      const a=plnVert(m,[c[0]-dx*ww,c[1],c[2]-dz*ww],nr,col,M,wd,0,t);
      const q=plnVert(m,[c[0]+dx*ww,c[1],c[2]+dz*ww],nr,col,M,wd,0,t);
      if(s)plnQuad(m,pa,pb,q,a);
      pa=a;pb=q;
    }
  }
  return m;
}
/* камень: серый, светлее к макушке, мох лежит сверху; тон даёт запись */
function plnFloraRock(m,seed,sub,r){
  /* вершина: r — доля мха (на макушке, пятнами), g — светлота минус половина (режим 1) */
  plnBlob(m,{c:[0,.15,0],r,sub,bump:.5,bumpF:1.25,seed,yaw:seed*1.37,lean:Math.sin(seed)*.2,cut:-.4*r[1],
    col:(u,p,n)=>{
      const k=lerp(.62,1,plnSmooth(-.6,.6,u[1]+plnNoise(p[0]*.9,p[1]*2.2,seed)*.5));
      return [plnSmooth(.55,.9,n[1])*plnSmooth(-.1,.3,plnNoise(p[0]*.7+3,p[2]*.7,seed+2))*.7,k-.5,0];
    },mat:PLN_MAT.rock});
  return m;
}
/* скала: шар, срубленный плоскостями, — камень рублен, а не лепится. Грань несёт свою нормаль и свою
   светлоту: что смотрит вверх — светлее, там же лежит мох. Кверху тело уже.
   o: c (середина подошвы), r [rx, рост, rz], chops (сколько срубов), lean и pitch (наклон пласта),
      yaw, thin (ширина макушки в долях подошвы), seed */
function plnFloraCrag(m,r,o){
  const M=PLN_MAT.rock,g=plnIco(2),R=o.r,V=[],G0=[],cuts=[],sd=o.seed;
  for(let k=0;k<o.chops;k++)cuts.push([plnNorm([r()*2-1,r()*1.5-.6,r()*2-1]),.5+r()*.36]);
  for(const u of g.p){
    let q=plnMul(u,1+.2*plnNoise(u[0]*1.6+sd,u[1]*1.6+u[2]*1.1,sd));
    for(const [n,d] of cuts){const e=plnDot(q,n)-d;if(e>0)q=plnSub(q,plnMul(n,e));}
    const w=lerp(1.12,o.thin,clamp(q[1]*.5+.5,0,1));
    let l=[q[0]*R[0]*w,(q[1]+1)*.5*R[1],q[2]*R[2]*w];
    if(o.lean)l=plnRotZ(l,o.lean);
    if(o.pitch)l=plnRotX(l,o.pitch);
    if(o.yaw)l=plnRotY(l,o.yaw);
    l=plnAdd(l,o.c);
    V.push(l);G0.push(plnSmooth(-.25,.3,plnNoise(l[0]*.9+sd,l[2]*.9,sd+2))*.75);
  }
  const mid=plnAdd(o.c,[0,R[1]*.5,0]);
  for(const [a,b,c] of g.f){
    const e=plnCross(plnSub(V[b],V[a]),plnSub(V[c],V[a])),ar=plnLen(e);
    if(ar<1e-6)continue;
    let n=plnMul(e,1/ar);
    if(plnDot(n,plnSub(V[a],mid))<0)n=plnMul(n,-1);
    /* светлота — от того, куда грань смотрит: куски одного сруба красятся одинаково */
    const k=lerp(.7,1.08,plnSmooth(-.35,.9,n[1]))*(.93+.14*plnNoise(n[0]*2.3+sd,n[2]*2.3+n[1]*1.7,sd+4)),up=plnSmooth(.45,.85,n[1]);
    const v=i=>plnVert(m,V[i],n,[G0[i]*up,k-.5,0],M,0,0,0);
    plnTri(m,v(a),v(b),v(c));
  }
}
/* уступ: скала со своими малыми — тело крутой ступени тропы. Пласты клонятся в одну сторону.
   parts: [x, z, rx, рост над нулём, rz]…; подошва на полметра ниже нуля: тело сидит в склоне */
function plnFloraLedge(m,seed,parts,dip){
  const r=rng(seed);
  parts.forEach((q,k)=>plnFloraCrag(m,r,{c:[q[0],-.5,q[1]],r:[q[2],q[3]+.5,q[4]],chops:7+((r()*4)|0),
    lean:dip*(.7+r()*.6),pitch:(r()-.5)*.24,yaw:(r()-.5)*1.2,thin:.6+r()*.25,seed:seed+k*17}));
  return m;
}
/* розетка: листья из одного корня, поникшие — куст ближнего плана: гладкая шапка среди травы
   читалась бы подушкой */
function plnFloraRosette(m,r,n){
  const M=PLN_MAT.grass;
  for(let b=0;b<n;b++){
    const a=r()*TAU,el=.15+1.15*Math.sqrt(r()),len=(.75+r()*.55)*(.7+.3*Math.sin(el)),w=.10+r()*.05;
    const ox=Math.cos(a),oz=Math.sin(a),droop=.35+r()*.5,f=.85+r()*.3;
    let pa=-1,pb=-1,px=0,py=0;
    for(let s=0;s<=5;s++){
      /* лист выходит из корня под углом el к вертикали и никнет дальше по длине */
      const t=s/5,e=el+droop*t*t*1.2;
      if(s){const em=el+droop*(t-.1)*(t-.1)*1.2;px+=Math.sin(em)*len/5;py+=Math.cos(em)*len/5;}
      const p=[ox*px,py-.05,oz*px],ww=w*Math.sin(Math.PI*Math.pow(t,.6))*.9+(s===5?0:.006);
      const nr=plnNorm([-ox*Math.cos(e),Math.sin(e)+.35,-oz*Math.cos(e)]),k=Math.pow(t,.7);
      const col=[k,.5+(f-1)*k,0],wd=t*t*.18*len;
      const va=plnVert(m,[p[0]+oz*ww,p[1],p[2]-ox*ww],nr,col,M,wd,0,t);
      const vb=plnVert(m,[p[0]-oz*ww,p[1],p[2]+ox*ww],nr,col,M,wd,0,t);
      if(s)plnQuad(m,pa,pb,vb,va);
      pa=va;pb=vb;
    }
  }
  return m;
}
/* колосья цветения над розеткой: акцент этого мира, скупо */
function plnFloraBloom(m,r,n){
  const root=plnHex("#2c5a3c"),pink=plnHex("#d983b0"),M=PLN_MAT.grass;
  for(let k=0;k<n;k++){
    const a=r()*TAU,d=.25*r(),top=[Math.cos(a)*d*2,1.25+r()*.5,Math.sin(a)*d*2];
    plnTube(m,{path:[[Math.cos(a)*d,0,Math.sin(a)*d],top],rad:.012,sides:4,col:root,mat:M,wind:t=>t*t*.12});
    for(let j=0;j<5;j++)plnBlob(m,{c:[top[0]+(r()-.5)*.08,top[1]-j*.075,top[2]+(r()-.5)*.08],r:[.05,.045,.05],sub:0,
      col:plnMul(pink,.9+r()*.25),mat:M,wind:.12,x:1,glow:.12});
  }
  return m;
}
/* шапка: купол с плоским исподом — форма, которую этот мир повторяет в облаках, кронах и кустах */
function plnFloraCap(m,c,pr,ph,o){
  plnBlob(m,{c,r:[pr,ph,pr],sub:o.sub,bump:o.bump==null?.2:o.bump,bumpF:o.bumpF||2.4,seed:o.seed,yaw:o.yaw||0,lean:o.lean||0,
    cut:-.22*ph,col:o.col,mat:PLN_MAT.leaf,wind:o.wind,nc:o.nc,ncK:o.ncK==null?.5:o.ncK});
}
/* лист-блюдце на воде: круг с вырезом, край чуть поднят и светлее середины */
function plnFloraPad(m,r){
  const M=PLN_MAT.leaf,n=14,cut=.5+r()*.5,a0=r()*TAU,g=.5+(r()-.5)*.16,c=plnVert(m,[0,.012,0],[0,1,0],[.4,g-.06,0],M,0,0,0);
  let p=-1;
  for(let i=0;i<=n;i++){
    const a=a0+cut*.5+(TAU-cut)*i/n,rr=1+.07*Math.sin(a*3+g*20),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
    const v=plnVert(m,[x,.035,z],plnNorm([-x*.25,1,-z*.25]),[.8+.2*Math.sin(a*2+1),g+.05,0],M,0,0,1);
    if(i)plnTri(m,c,p,v);
    p=v;
  }
  return m;
}
function plnFloraBush(m,r){
  const n=3+(r()*3|0),nc=[0,-.4,0];
  const col=(u,p,nn)=>[plnSmooth(-.2,.5,nn[1]),.5+plnNoise(p[0]*1.3,p[2]*1.3+p[1],3)*.12,0];
  for(let k=0;k<n;k++){
    const a=r()*TAU,d=k?.3+r()*.6:0,rr=k?.45+r()*.3:.8;
    plnFloraCap(m,[Math.cos(a)*d,rr*.2,Math.sin(a)*d*.7],rr,rr*.78,{sub:1,seed:k*3+(r()*50|0),yaw:r()*TAU,col,wind:.04,nc});
  }
  return m;
}

/* набор этого поколения устройства. Кости у набора свои и всегда одни: набор — словарь стиля */
function plnFloraKit(){
  const Q=PLN_FLORA;
  if(Q.kit&&Q.gen===PLN_GPU.gen)return Q.kit;
  const t0=wallMs(),W=Q.wide,H=Q.treeH,K={};
  let nv=0;
  const geo=m=>{nv+=m.nv;return plnGeo(m);};
  /* дерево породы sp; rh — радиус кроны в долях роста, если он задан композицией */
  const tree=(sp,seed,sub,rich,o,rh)=>{
    const r=rng(seed),T=PLN_TREES[sp],R=H*(rh||(T.R[0]+r()*T.R[1]));
    return {geo:geo(PLN_TREE_MAKE[sp](r,H,R,sub,rich,o)),R,sp};
  };
  const add=(list,map,key,t)=>{(map[key]=map[key]||[]).push(list.length);list.push(t);};
  K.tuft=[0,1,2,3,4,5].map(k=>geo(plnFloraTuft(plnMesh(64),rng(7100+k),{rings:3,w0:.09*W,w1:.06*W,off:.4*W/Q.foot,lean:1.1,wk:.3})));
  K.reed=[0,1,2].map(k=>geo(plnFloraTuft(plnMesh(64),rng(7150+k),{rings:4,w0:.07,w1:.04,off:.17,lean:1.2,wk:.25})));
  {const m=plnMesh(32);plnBlob(m,{c:[0,0,0],r:[1,.72,1],sub:0,col:[1.05,1.05,1.05],mat:PLN_MAT.grass,wind:1.1,x:1,glow:.18});K.flower=geo(m);}
  /* камни: три малых и три больших */
  K.rock=[[11,1,[1.2,.8,1]],[23,1,[1.35,.7,1]],[37,1,[1.05,.75,1.1]],[5,2,[1.2,.8,1]],[17,2,[1.25,.85,1]],[29,2,[1.15,.9,.95]]]
    .map(q=>geo(plnFloraRock(plnMesh(256),q[0],q[1],q[2])));
  /* уступы: зуб, двойня, столб — высокие, им стоять за тропой; гребень, глыба, плита — низкие, они
     лежат и перед ней. Мерки тела — для посадки на склон: top — макушка над нулём, rx и rz — полуоси
     подошвы, low — на сколько подошва ниже нуля */
  K.ledge=[[[[0,0,.85,2.6,.75],[-.95,-.25,.6,1.3,.55],[.8,.2,.5,.9,.5]],.2],
    [[[-.45,0,.7,2.1,.65],[.55,.15,.6,1.5,.6],[1.3,-.2,.45,.7,.45]],-.24],
    [[[0,0,.75,2.9,.65],[.7,.1,.5,1.4,.5]],.16],
    [[[-1.1,0,.7,1.2,.6],[0,.1,.8,1.7,.7],[1.0,-.1,.6,1.0,.55]],-.18],
    [[[0,0,1.2,1.3,.9],[.9,-.35,.5,.7,.45]],.22],
    [[[0,0,1.4,.8,.9],[-.3,.1,.8,1.2,.6]],-.14]].map((q,k)=>{
    const m=plnFloraLedge(plnMesh(4096),7250+k*7,q[0],q[1]);
    let top=0,rx=0,rz=0;
    for(let i=0;i<m.nv;i++){
      const o=i*PLN_VS;
      top=Math.max(top,m.v[o+1]);
      if(m.v[o+1]<.2){rx=Math.max(rx,Math.abs(m.v[o]));rz=Math.max(rz,Math.abs(m.v[o+2]));}
    }
    return {geo:geo(m),top,rx,rz,low:.5};
  });
  K.ros=[0,1,2].map(k=>geo(plnFloraRosette(plnMesh(1024),rng(7300+k),56)));
  K.bloom=[2,3].map(n=>geo(plnFloraBloom(plnMesh(256),rng(7350+n),n)));
  K.bush=[0,1,2].map(k=>geo(plnFloraBush(plnMesh(512),rng(7500+k))));
  K.pad=[0,1,2].map(k=>geo(plnFloraPad(plnMesh(32),rng(7550+k))));
  /* деревья (породы — 21pgb). K.tree и K.far — тела подряд, K.sp и K.spFar — какие из них чьей
     породы. «hero» — зонт, что клонится над площадкой: он один и в рощах не растёт */
  K.tree=[];K.sp={};K.far=[];K.spFar={};
  add(K.tree,K.sp,"hero",tree("umb",7401,3,true,{lean:-.95,bend:-1.7,thin:.74},.54));
  [[7411,false],[7413,true],[7414,false,{lean:.55,bend:1.1,thin:.8}],[7415,false,{fork:.62,thin:.8,lean:-.3},.4],[7416,true,{fork:.27,lean:.25,bend:.6}]]
    .forEach(q=>add(K.tree,K.sp,"umb",tree("umb",q[0],2,q[1],q[2],q[3])));
  [[7421,false],[7422,true,{thin:.85,wide:.4}],[7423,false,{lean:.5,skirt:.26}]].forEach(q=>add(K.tree,K.sp,"col",tree("col",q[0],2,q[1],q[2])));
  [[7431,false],[7432,true],[7433,false,{lean:-.6,bend:.9,hs:[.42,.66,.86],taper:.5}],[7434,false,{hs:[.3,.44,.57,.69,.8,.9],taper:.3,thin:.85},.3]]
    .forEach(q=>add(K.tree,K.sp,"pag",tree("pag",q[0],2,q[1],q[2],q[3])));
  [[7441,false],[7442,true,{thin:.85,tall:1.05}],[7443,false,{lean:.9,bend:1.4,tall:.72}]].forEach(q=>add(K.tree,K.sp,"orb",tree("orb",q[0],2,q[1],q[2])));
  [[7451,false],[7452,true],[7453,false,{lean:-.8}]].forEach(q=>add(K.tree,K.sp,"fork",tree("fork",q[0],2,q[1],q[2])));
  [7461,7462].forEach(s=>add(K.tree,K.sp,"snag",tree("snag",s,2,false)));
  PLN_TREE_ORDER.forEach((sp,i)=>{
    if(PLN_TREES[sp].far>0)for(let k=0;k<2;k++)add(K.far,K.spFar,sp,tree(sp,7600+i*10+k,1,false));
  });
  /* кулиса: свои тела, узнаваемые по одной макушке (21pgc) */
  K.wing=plnWingKit(geo);
  Q.gen=PLN_GPU.gen;Q.kit=K;
  PLN.stat.kit={ms:Math.round(wallMs()-t0),verts:nv};
  return K;
}
