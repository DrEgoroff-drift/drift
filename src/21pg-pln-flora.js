/* ══════════════ планета: набор тел — трава, цветок, камень, розетка, куст, дерево (M611) ══════════════
   Всё, что растёт и лежит на земле, — из одного набора. Тело строится раз на
   устройство, в своей мерке (пучок и камень — метр, дерево — десять), а в мир
   его ставит запись расстановки (21pc): место, размер, поворот, доля высоты и
   два цвета. Сто тысяч пучков травы — это шесть сеток и сто тысяч записей, а
   не два миллиона вершин на куске земли.

   Формы — со стенда docs/look (M600): шапка с плоским исподом, розетка с
   поникшими листьями, гранёный камень со мхом на макушке. Деревья — шесть
   пород с разным обводом, они в 21pgb. Оранжевого в наборе нет: он у людей и
   у руды.

   Цвет. Пучки, розетки и кусты несут в вершине только ход от корня к макушке
   (r) и свою светлоту (g): оба цвета даёт запись (режим 1). У дерева так
   красится одна крона, кора остаётся своей (режим 2). Камень, цветок и колос
   несут свой цвет, запись его подкрашивает (режим 0). */
const PLN_TINTS=[{top:plnHex("#9cc04a"),under:plnHex("#2f5f45")},{top:plnHex("#bfc04e"),under:plnHex("#4a6a3a")},
  {top:plnHex("#cf8fb0"),under:plnHex("#5a4466")},{top:plnHex("#6fb58a"),under:plnHex("#24514f")}];
/* дальний берег: та же зелень, тише */
const PLN_TINTS_FAR=[{top:plnHex("#86a850"),under:plnHex("#33594a")},{top:plnHex("#a9ab5a"),under:plnHex("#4a6044")}];
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
  const P=PLN_PAL,ref=plnMix3(P.rockWarm,P.rockCool,.45),moss=[P.moss[0]/ref[0],P.moss[1]/ref[1],P.moss[2]/ref[2]];
  plnBlob(m,{c:[0,.15,0],r,sub,bump:.5,bumpF:1.25,seed,yaw:seed*1.37,lean:Math.sin(seed)*.2,cut:-.4*r[1],
    col:(u,p,n)=>{
      const k=lerp(.62,1,plnSmooth(-.6,.6,u[1]+plnNoise(p[0]*.9,p[1]*2.2,seed)*.5));
      return plnMix3([k,k,k],moss,plnSmooth(.55,.9,n[1])*plnSmooth(-.1,.3,plnNoise(p[0]*.7+3,p[2]*.7,seed+2))*.7);
    },mat:PLN_MAT.rock});
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
  K.ros=[0,1,2].map(k=>geo(plnFloraRosette(plnMesh(1024),rng(7300+k),56)));
  K.bloom=[2,3].map(n=>geo(plnFloraBloom(plnMesh(256),rng(7350+n),n)));
  K.bush=[0,1,2].map(k=>geo(plnFloraBush(plnMesh(512),rng(7500+k))));
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
  /* кулиса: объектив смотрит на неё сверху, и крона с просветами читается пятном — шапки шире, внахлёст */
  K.wing=[tree("umb",7471,2,true,{lean:.3,bend:.8,dense:1.45},.49),tree("umb",7472,2,true,{lean:-.4,bend:-1,dense:1.45},.49),
    tree("umb",7473,2,true,{fork:.3,dense:1.5},.52),tree("orb",7474,2,true,{tall:.7},.4)];
  Q.gen=PLN_GPU.gen;Q.kit=K;
  PLN.stat.kit={ms:Math.round(wallMs()-t0),verts:nv};
  return K;
}
