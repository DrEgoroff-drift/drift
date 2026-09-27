/* ══════════════ планета: кулиса — что растёт у самого объектива (M611) ══════════════
   Кулиса стоит на полпути от объектива к линии ходьбы, и в кадр от неё входит
   только верх: два-пять метров. Крона из шапок читалась там гладкой тёмной
   кляксой — у купола нет обвода, который узнаётся по одной макушке. Поэтому
   кулиса сложена из того, чей ВЕРХ уже силуэт: вайи с перьями и улиткой
   молодого листа, большой лист с острым концом и надрывом, высокая трава с
   метёлками, зонтики молодняка на тонких ногах.

   Кулиса — театральная: объектив её не обходит, и лист стоит к нему лицом.
   Путь листа лежит в плоскости кадра (или близко к ней), ширина листа — в той
   же плоскости. Лист ребром к объективу — нитка, которую размытие стирает.
   Поэтому запись кулису почти не крутит.

   Тело строится от уровня, с которого входит в кадр: ноль высоты — низ видимой
   части, стебли уходят от него вниз на PLN_WING.deep, за край кадра. Запись
   ставит ноль тела у линии ходьбы; размер у записи свой, и лист у всех тел
   одного порядка: с человека, не с дом.

   Цвет — режим 1: вершина несёт ход от тени к свету (r) и светлоту своего
   листа (g), оба цвета даёт запись. Кулиса остаётся тёмным холодным обводом
   сцены; лист от листа отделяет светлота. Материал у всего один — крона:
   у коры светлый край, и сквозь размытие он делает кулису бурой. */
const PLN_WING={deep:12,                /* на сколько стебли уходят вниз от нуля тела, м */
  z:[-51,3.5],                          /* глубина: от и на сколько, м */
  lift:[-.6,2.2],                       /* ноль тела над линией ходьбы: от и на сколько, м */
  cap:5.7,                              /* выше этого над линией макушка не встаёт: там ноги человека */
  size:[.9,.35],                        /* размер записи: от и на сколько */
  turn:.7,                              /* на сколько запись крутит тело, рад (в обе стороны поровну) */
  dim:.72,                              /* кулиса темнее своих красок: она — обвод сцены */
  /* тень и свет листа: бирюза — главная, дальше зелень, синева и редкий сливовый */
  tones:[["#0a2e30","#227a66"],["#0f2a1a","#3a7a40"],["#0b2140","#2a6488"],["#1f1436","#6d4a86"]]};
PLN_WING.cols=PLN_WING.tones.map(t=>[plnMul(plnHex(t[0]),PLN_WING.dim),plnMul(plnHex(t[1]),PLN_WING.dim)]);

/* ход от тени к свету по высоте тела: у нуля — треть, у макушки — единица */
function plnWingRamp(y){return Math.pow(clamp((y+1.5)/5,0,1),.8);}
/* сторона листа в плоскости кадра: вправо или влево, с отклонением от плоскости на jit */
function plnWingAz(r,i,jit){return (i&1?Math.PI:0)+(r()-.5)*jit;}
/* Путь листа из корня в сторону az. ef(t) — угол к вертикали на доле длины t; tf — как доли легли
   по длине (у травы шаг к макушке мельче). Отдаёт точки, касательные, нормали в плоскости пути
   и лицо — нормаль плоскости, обращённую к объективу */
function plnWingPath(root,az,len,S,ef,tf){
  const ox=Math.cos(az),oz=Math.sin(az),P=[],T=[],N=[],U=[],k=ox>=0?1:-1;
  let px=0,py=0,t0=0;
  for(let s=0;s<=S;s++){
    const t=tf?tf(s/S):s/S,e=ef(t);
    if(s){const em=ef((t+t0)/2),ds=(t-t0)*len;px+=Math.sin(em)*ds;py+=Math.cos(em)*ds;}
    P.push([root[0]+ox*px,root[1]+py,root[2]+oz*px]);
    T.push([ox*Math.sin(e),Math.cos(e),oz*Math.sin(e)]);
    N.push([-ox*Math.cos(e),Math.sin(e),-oz*Math.cos(e)]);
    U.push(t);t0=t;
  }
  return {P,T,N,U,face:[oz*k,0,-ox*k]};
}
/* лента по пути: край, жила, край — лежит в плоскости пути, повёрнута вокруг жилы на tw и сложена
   вдоль неё. Половины у ленты разной светлоты: сквозь размытие лист читается листом по тёмной
   половине и светлой, жилки там уже не видно.
   wf(t,s) → полуширины [нижняя, верхняя]; o: fold, tw, split (разница светлоты половин),
   col (t,p) → [ход, светлота, 0], wind (t) → w */
function plnWingRibbon(m,Q,wf,o){
  const S=Q.P.length-1,F=Q.face,f=o.fold||0,k=o.split||0,ct=Math.cos(o.tw||0),st=Math.sin(o.tw||0),M=PLN_MAT.leaf;
  let pa=-1,pb=-1,pc=-1,pd=-1;
  for(let s=0;s<=S;s++){
    const t=Q.U[s],p=Q.P[s],n=Q.N[s],w=wf(t,s),col=o.col(t,p),wd=o.wind?o.wind(t):0,lo=[col[0]*.85,col[1]-k,0],hi=[col[0],col[1]+k,0];
    const u=[n[0]*ct+F[0]*st,n[1]*ct,n[2]*ct+F[2]*st],fn=[F[0]*ct-n[0]*st,-n[1]*st,F[2]*ct-n[2]*st];
    const a=plnVert(m,[p[0]-u[0]*w[0]+fn[0]*f*w[0],p[1]-u[1]*w[0]+fn[1]*f*w[0],p[2]-u[2]*w[0]+fn[2]*f*w[0]],
      plnNorm([fn[0]+u[0]*f,fn[1]+u[1]*f,fn[2]+u[2]*f]),lo,M,wd,0,t);
    const c=plnVert(m,p,fn,lo,M,wd,0,t),d=plnVert(m,p,fn,hi,M,wd,0,t);
    const b=plnVert(m,[p[0]+u[0]*w[1]+fn[0]*f*w[1],p[1]+u[1]*w[1]+fn[1]*f*w[1],p[2]+u[2]*w[1]+fn[2]*f*w[1]],
      plnNorm([fn[0]-u[0]*f,fn[1]-u[1]*f,fn[2]-u[2]*f]),hi,M,wd,0,t);
    if(s){plnQuad(m,pa,pc,c,a);plnQuad(m,pd,pb,b,d);}
    pa=a;pb=b;pc=c;pd=d;
  }
}

/* вайя: жила и перья по обе стороны — к концу короче и круче вперёд; лист встаёт и никнет.
   Перо — с руку, и между перьями просвет не уже пера: мелкий гребень размытие сливает в дымку */
function plnWingFrond(m,r,root,az,el,len,droop,g){
  const S=10,Q=plnWingPath(root,az,len,S,t=>el+droop*t*t),F=Q.face,M=PLN_MAT.leaf;
  const at=t=>{
    const f=clamp(t,0,1)*S,i=Math.min(S-1,Math.floor(f)),u=f-i;
    return {p:plnMix3(Q.P[i],Q.P[i+1],u),t:plnNorm(plnMix3(Q.T[i],Q.T[i+1],u)),n:plnNorm(plnMix3(Q.N[i],Q.N[i+1],u))};
  };
  plnTube(m,{path:Q.P,rad:t=>lerp(.085,.03,t),sides:3,col:(t,a,p)=>[plnWingRamp(p[1])*.6,g-.12,0],mat:M,wind:t=>.3*t*t});
  const NL=Math.max(4,Math.round(len/.62)),Lm=len*.3;
  for(let j=0;j<NL;j++){
    const t=.12+.88*(j+.5)/NL,q=at(t),prof=Math.pow(Math.sin(Math.PI*Math.pow(t,.62)),.6),wd=.3*t*t;
    for(const sg of [-1,1]){
      const a=.35+.35*t+(r()-.5)*.2,l=Lm*prof*(.85+r()*.3)*(sg<0?1.1:.9),hw=(.15+r()*.05)*Math.min(1,l/.7),sag=sg<0?.25+r()*.3:r()*.15;
      const ca=Math.cos(a)*sg,sa=Math.sin(a),lean=(r()-.5)*.3;
      const d=plnNorm([q.n[0]*ca+q.t[0]*sa+F[0]*lean,q.n[1]*ca+q.t[1]*sa-sag,q.n[2]*ca+q.t[2]*sa+F[2]*lean]);
      const wv=plnNorm(plnCross(d,F)),k=.42*l,P0=q.p,nl=plnNorm([F[0]-d[0]*lean,F[1]-d[1]*lean+.25,F[2]-d[2]*lean]);
      const A=[P0[0]+d[0]*k+wv[0]*hw,P0[1]+d[1]*k+wv[1]*hw,P0[2]+d[2]*k+wv[2]*hw];
      const B=[P0[0]+d[0]*k-wv[0]*hw,P0[1]+d[1]*k-wv[1]*hw,P0[2]+d[2]*k-wv[2]*hw];
      const E=[P0[0]+d[0]*l,P0[1]+d[1]*l-.08*l,P0[2]+d[2]*l];
      const c0=[.6*plnWingRamp(P0[1])+.36*t,g+(sg<0?-.07:.05),0],c1=[Math.min(1,.6*plnWingRamp(E[1])+.4*t+.12),g+(sg<0?-.02:.1),0];
      const i0=plnVert(m,P0,nl,c0,M,wd,0,t),ia=plnVert(m,A,nl,c0,M,wd,0,t),ib=plnVert(m,B,nl,c0,M,wd,0,t),ie=plnVert(m,E,nl,c1,M,wd*1.15,0,t);
      plnTri(m,i0,ia,ie);plnTri(m,i0,ie,ib);
    }
  }
}
/* улитка: молодой лист ещё свёрнут — стебель и завиток на конце */
function plnWingCurl(m,r,root,az,h,R0,g){
  const ox=Math.cos(az),oz=Math.sin(az),path=[],turn=3.2*Math.PI,n1=22;
  for(let k=0;k<5;k++){const t=k/5,b=R0*.5*(1-t)*(1-t);path.push([root[0]-ox*b,root[1]+h*t,root[2]-oz*b]);}
  const C=[root[0]+ox*R0,root[1]+h,root[2]+oz*R0];
  for(let k=0;k<=n1;k++){
    const f=k/n1*turn,R=R0*(1-.84*k/n1);
    path.push([C[0]-ox*R*Math.cos(f),C[1]+R*Math.sin(f),C[2]-oz*R*Math.cos(f)]);
  }
  plnTube(m,{path,rad:t=>lerp(.12,.055,t),sides:5,col:(t,a,p)=>[plnWingRamp(p[1])*.9,g,0],mat:PLN_MAT.leaf,wind:t=>.22*t*t});
}
/* большой лист: пластина с острым концом, сложена вдоль жилы; tear — сколько надрывов по краю */
function plnWingBlade(m,r,root,az,el,len,wid,droop,g,tear){
  const S=10,Q=plnWingPath(root,az,len,S,t=>el+droop*t*t),cut=[];
  for(let k=0;k<tear;k++)cut.push([3+(r()*5|0),r()<.5?0:1,.3+r()*.2]);
  plnWingRibbon(m,Q,(t,s)=>{
    const w=wid*.5*Math.pow(Math.sin(Math.PI*Math.pow(t,.6)),.8)+(s===S?0:.012),q=[w,w];
    for(const c of cut)if(c[0]===s)q[c[1]]*=c[2];
    return q;
  },{fold:.3,split:.13,tw:(r()-.5)*1.1,col:(t,p)=>[Math.min(1,.62*plnWingRamp(p[1])+.38*t),g,0],wind:t=>.26*t*t});
}

/* ── тела ── */
/* древовидный папоротник: ствол уходит под кадр, вайи расходятся веером в обе стороны; o: n, lean, len, curl */
function plnWingFern(r,o){
  const m=plnMesh(4096),n=o.n,D=PLN_WING.deep,lean=o.lean||0;
  plnTube(m,{path:plnBez([-lean*4,-D,0],[-lean*.5,-D*.35,0],[0,.15,0],6),rad:t=>lerp(.26,.15,t),sides:6,
    col:(t,a,p)=>[plnWingRamp(p[1])*.45,.4+.08*Math.sin(t*40+a*2),0],mat:PLN_MAT.leaf});
  for(let i=0;i<n;i++){
    const u=(i+.5)/n,az=plnWingAz(r,i,.9),sd=Math.cos(az)<0?-1:1;
    const el=Math.max(.1,lerp(.18,1.15,Math.pow(u,.85))+(r()-.5)*.14+lean*sd*.3);
    const len=lerp(3.5,4.5,r())*(o.len||1)*(1-.12*u),droop=lerp(1.2,1.75,r());
    plnWingFrond(m,r,[Math.cos(az)*.12,0,Math.sin(az)*.12],az,el,len,droop,.5+(r()-.5)*.26);
  }
  for(let i=0;i<(o.curl||0);i++){
    const az=plnWingAz(r,i+(o.flip||0),.7);
    plnWingCurl(m,r,[Math.cos(az)*.1,0,Math.sin(az)*.1],az,2.3+r()*1.2,.42+r()*.2,.56);
  }
  return m;
}
/* большие листья на черешках из одного корня; o: n, len */
function plnWingLeaves(r,o){
  const m=plnMesh(2048),n=o.n,D=PLN_WING.deep;
  for(let i=0;i<n;i++){
    const u=(i+.5)/n,az=plnWingAz(r,i+(o.flip||0),1.1),el=lerp(.12,.85,u)+(r()-.5)*.1,len=lerp(3.6,2.7,u)*(.9+r()*.25)*(o.len||1);
    const wid=len*(.32+r()*.08),droop=lerp(1.1,1.8,r()),ox=Math.cos(az),oz=Math.sin(az),d=.2+u*.6,y0=-.9+r()*1.3-u*.7;
    const root=[ox*d,y0,oz*d],se=Math.sin(el),ce=Math.cos(el);
    plnTube(m,{path:plnBez([ox*.08,-D,oz*.08],[root[0]-ox*se*3,root[1]-ce*3,root[2]-oz*se*3],root,6),rad:t=>lerp(.11,.055,t),sides:4,
      col:(t,a,p)=>[plnWingRamp(p[1])*.55,.42,0],mat:PLN_MAT.leaf,wind:t=>.04*t*t});
    plnWingBlade(m,r,root,az,el,len,wid,droop,.5+(r()-.5)*.24,r()<.6?1+(r()*2|0):0);
  }
  return m;
}
/* высокая трава: лист идёт из-под кадра, наверху расходится веером и никнет концом; o: n, plume */
function plnWingGrass(r,o){
  const m=plnMesh(4096),n=o.n,D=PLN_WING.deep,S=12,tf=u=>1-Math.pow(1-u,1.7);
  for(let i=0;i<n;i++){
    const az=plnWingAz(r,i,1.2),ra=r()*TAU,rad=.2+1.1*Math.sqrt(r()),top=lerp(.8,3.5,Math.pow(r(),.6)),len=D+top+.6;
    const lean=.08+r()*.3,kd=r()<.45?.7+r()*.9:r()*.3,w0=.15+r()*.08,g=.5+(r()-.5)*.26;
    const Q=plnWingPath([Math.cos(ra)*rad,-D,Math.sin(ra)*rad*.6],az,len,S,t=>lean*t*t+kd*Math.pow(1-Math.min(1,(1-t)*len/2.6),2),tf);
    plnWingRibbon(m,Q,(t,s)=>{const w=w0*Math.pow(Math.min(1,(1-t)*len/3.2),.6)+(s===S?0:.01);return [w,w];},
      {fold:.2,split:.08,tw:(r()-.5)*.9,col:(t,p)=>[plnWingRamp(p[1]),g,0],wind:t=>.34*Math.pow(t,6)});
  }
  for(let i=0;i<(o.plume||0);i++){
    const az=plnWingAz(r,i+1,1),ra=r()*TAU,rad=.2+.7*r(),top=lerp(2.2,3.4,r()),len=D+top,lean=.06+r()*.2,kd=.25+r()*.5,hl=1.4+r()*.6,path=[];
    const Q=plnWingPath([Math.cos(ra)*rad,-D,Math.sin(ra)*rad*.6],az,len,S,t=>lean*t*t+kd*Math.pow(1-Math.min(1,(1-t)*len/2.2),2),tf),E=Q.P[S],T=Q.T[S];
    plnTube(m,{path:Q.P,rad:t=>lerp(.07,.035,t),sides:4,col:(t,a,p)=>[plnWingRamp(p[1])*.8,.45,0],mat:PLN_MAT.leaf,wind:t=>.34*Math.pow(t,6)});
    for(let k=0;k<=6;k++){const f=k/6;path.push([E[0]+T[0]*hl*f,E[1]+T[1]*hl*f-.22*hl*f*f,E[2]+T[2]*hl*f]);}
    plnTube(m,{path,rad:t=>.03+.2*Math.pow(Math.sin(Math.PI*Math.pow(t,.8)),.8),sides:6,col:t=>[1,.66+.08*Math.sin(t*9),0],mat:PLN_MAT.leaf,wind:.34,cap:true});
  }
  return m;
}
/* зонтики молодняка: тонкие ноги и шапки с плоским исподом на разной высоте; o: n */
function plnWingCaps(r,o){
  const m=plnMesh(4096),n=o.n,D=PLN_WING.deep,a0=r()*TAU,M=PLN_MAT.leaf;
  /* у шапки свет сверху: макушка купола светлая, бок темнее, испод — тень */
  const leaf=(u,p,nn)=>[plnSmooth(-.3,.75,nn[1])*(.55+.45*plnWingRamp(p[1])),.56+plnNoise(p[0]*1.1,p[2]*1.1+p[1],5)*.14,0];
  const stem=(t,a,p)=>[plnWingRamp(p[1])*.5,.42,0];
  for(let i=0;i<n;i++){
    const az=a0+i*2.4+(r()-.5)*.7,d=i?.9+2.3*Math.sqrt(r()):0,cy=i?lerp(.4,2.9,r()):3,pr=i?lerp(.7,1.2,r()):1.45,ph=pr*(.5+r()*.12);
    const c=[Math.cos(az)*d,cy,Math.sin(az)*d*.5],bow=(r()-.5)*1.6;
    plnTube(m,{path:plnBez([c[0]*.3,-D,c[2]*.3],[c[0]*.7+bow,cy-5,c[2]*.7],c,7),rad:t=>lerp(.13,.06,t),sides:5,col:stem,mat:M,wind:t=>.1*Math.pow(t,4)});
    plnFloraCap(m,[c[0],cy+ph*.2,c[2]],pr,ph,{sub:2,seed:i*7+3,yaw:r()*TAU,lean:(r()-.5)*.24,col:leaf,wind:.12,nc:[c[0],cy-pr,c[2]],ncK:.4});
    if(r()<.55){
      const a2=az+1.5+r()*2,e=[c[0]+Math.cos(a2)*pr*1.1,cy-.5-r()*.5,c[2]+Math.sin(a2)*pr*.6],sr=pr*(.42+r()*.12);
      plnTube(m,{path:plnBez([c[0]*.95,cy-1.6,c[2]*.95],[lerp(c[0],e[0],.5),cy-1.3,lerp(c[2],e[2],.5)],e,4),rad:t=>lerp(.06,.035,t),sides:4,
        col:stem,mat:M,wind:.1});
      plnFloraCap(m,[e[0],e[1]+sr*.1,e[2]],sr,sr*.5,{sub:1,seed:i*5+1,yaw:r()*TAU,col:leaf,wind:.12,nc:[e[0],e[1]-sr,e[2]],ncK:.4});
    }
  }
  return m;
}

/* набор кулисы: тела парами по семье (вайи, листья, трава, зонтики) и высота макушки каждого над нулём */
function plnWingKit(geo){
  const mk=m=>{
    let top=-1e9;
    for(let k=0;k<m.nv;k++)top=Math.max(top,m.v[k*PLN_VS+1]);
    return {geo:geo(m),top};
  };
  return [mk(plnWingFern(rng(7471),{n:10,curl:2})),mk(plnWingFern(rng(7472),{n:8,lean:.5,len:1.1,curl:1,flip:1})),
    mk(plnWingLeaves(rng(7473),{n:7})),mk(plnWingLeaves(rng(7474),{n:5,len:1.15,flip:1})),
    mk(plnWingGrass(rng(7475),{n:18,plume:4})),mk(plnWingGrass(rng(7476),{n:12,plume:2})),
    mk(plnWingCaps(rng(7477),{n:6})),mk(plnWingCaps(rng(7478),{n:4}))];
}
