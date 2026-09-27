/* ══════════════ планета: породы деревьев (M611) ══════════════
   Автор, 27.09: «все деревья по форме одинаковые, давай разнообразие». Порода —
   это обвод, который читается с дальнего берега: зонт, свеча, ярусы, шар,
   развилка и сухостой. Буква обвода у каждой своя: Т, I, Е, О, Y.

   Язык у всех один, и он же — закон света: крона сложена из шапок с плоским
   исподом. Свет здесь идёт из-за сцены, и тело с крутыми боками стоит к
   объективу тенью; шапка же ловит свет плоским верхом, а верх объективу виден.
   Первая свеча была собрана из шаров и вышла тёмной пирамидкой, первый шар —
   бурым комом: круглого в кронах нет, круглым бывает только обвод.

   Порода знает свой рост, свою повадку (свечи стоят по две-три, ярусы — по
   одному), свою стройность и свой тон кроны. Расстановка (21pga) берёт главную
   породу места и изредка чужую: роща читается рощей, а не ботаническим садом.

   Всякое дерево строится в мерке PLN_FLORA.treeH; R — радиус кроны в этой
   мерке. Дальним (sub 1) сучья и грани ствола урезаны: с того берега их не видно. */
const PLN_TREES={
  /* h — рост у тропы, м; grp — сколько в группе; gap — шаг в группе, м; tint — свой тон кроны;
     far — доля роста на дальнем берегу (0 — там не растёт); w — вес породы; hk — стройность;
     R — радиус кроны в долях роста: от и разброс */
  umb:{h:[8,11.5],grp:[1,2],gap:3.8,tint:0,far:1,w:3,hk:[.92,1.1],R:[.5,.12]},
  col:{h:[9.5,13.5],grp:[2,3],gap:2.1,tint:3,far:1.25,w:2,hk:[1,1.3],R:[.155,.03]},
  pag:{h:[9,12.5],grp:[1,1],gap:4.5,tint:0,far:1.1,w:2,hk:[.95,1.15],R:[.38,.08]},
  orb:{h:[6.5,9.5],grp:[1,2],gap:3.4,tint:1,far:.85,w:2,hk:[.9,1.15],R:[.29,.05]},
  fork:{h:[6,8.5],grp:[1,1],gap:4.5,tint:1,far:.75,w:2,hk:[.9,1.1],R:[.58,.1]},
  snag:{h:[5,8],grp:[1,1],gap:3,tint:0,far:0,w:.4,hk:[.9,1.2],R:[.2,0]}};
const PLN_TREE_ORDER=["umb","col","pag","orb","fork","snag"];
const PLN_BARK={a:plnHex("#a88c6c"),b:plnHex("#5c4a3c"),dry:plnHex("#e6dfcc"),dryB:plnHex("#a39c8c")};

/* порода места: главная на сотню метров, изредка чужая. u — кость; band — план: 0 лента,
   дальше рощи по глубине, у каждого плана главная порода своя */
function plnTreeKind(L,x,u,band){
  const O=PLN_TREE_ORDER,T=PLN_TREES,w=k=>band&&!T[k].far?0:T[k].w;
  const roll=v=>{
    let s=0,a;
    for(const k of O)s+=w(k);
    a=v*s;
    for(const k of O){a-=w(k);if(a<0)return k;}
    return O[0];
  };
  if(u>=.68)return roll((u-.68)/.32);
  const main=roll(plnHash(Math.floor(x/120),40+(band||0),L.sd));
  return main==="snag"?"umb":main;
}

function plnTreeBark(A,B){return (t,a)=>plnMul(plnMix3(B,A,.5+.5*Math.cos(a+1)),.82+.18*Math.sin(t*23+a*2));}
/* цвет листвы: ход испод → верх по нормали (r) и своя светлота (g); dim — насколько ярус в тени верхних;
   soft — куполу с крутым боком: бок держит средний тон, испод остаётся только снизу */
function plnTreeLeaf(sd,dim,soft){
  const a=-.15-(soft||0),b=.5-(soft||0)*.3;
  return (u,p,n)=>[plnSmooth(a,b,n[1]),.5-(dim||0)+plnNoise(p[0]*.8,p[2]*.8+p[1],sd)*.14,0];
}
/* ось ствола: лёгкий наклон и изгиб; top — где ствол кончается */
function plnTreeAxis(H,top,lean,bend){
  const k=H/9;
  return y=>{const t=clamp(y/top,0,1);return [lean*H*.1*t*t+bend*Math.sin(t*Math.PI*.9)*.25*k,y,.12*bend*Math.sin(t*3.3)*k];};
}
/* ствол по оси: радиус у комля и у вершины, к корню расширяется */
function plnTreeTrunk(m,ax,top,r0,r1,sub,o){
  o=o||{};
  const path=[],n=sub>1?8:5;
  for(let i=0;i<=n;i++)path.push(ax(i?top*i/n:-.35));
  plnTube(m,{path,rad:t=>lerp(r0,r1,Math.pow(t,.6))*(1+1.1*Math.pow(1-t,5)),sides:sub>1?9:5,
    col:o.col||plnTreeBark(PLN_BARK.a,PLN_BARK.b),mat:PLN_MAT.bark,wind:o.wind,cap:!!o.cap});
}
/* сук: от a через b к c; ветер растёт к концу */
function plnTreeLimb(m,a,b,c,r0,r1,sub,w0,w1,col){
  plnTube(m,{path:plnBez(a,b,c,sub>1?7:3),rad:t=>lerp(r0,r1,Math.pow(t,.8)),sides:sub>1?6:3,col:col||PLN_BARK.b,
    mat:PLN_MAT.bark,wind:t=>lerp(w0,w1,t*t)});
}

/* Зонт — главная порода этого мира: толстая нога, развилка, ваза ветвей и крона в три яруса шапок
   с тенью между ними. Кости идут в том же порядке, что на стенде: дерево над площадкой — то самое.
   o.fork — где развилка (доля роста): высокая нога с малой вазой — пиния, низкая — шатёр */
function plnTreeUmb(r,H,R,sub,rich,o){
  o=o||{};
  const m=plnMesh(4096),k=H/9,thin=o.thin||1,fine=sub>1;
  const lean=o.lean==null?(r()-.5)*.5:o.lean,bend=o.bend==null?(r()-.5)*1.2:o.bend;
  const fork=H*(o.fork||(.40+r()*.12)),cx=lean*H*.2,path=[];
  for(let i=0;i<=8;i++){const t=i/8;path.push([cx*t*.5+bend*Math.sin(t*Math.PI*.9)*.3*k,fork*t-.35,.15*bend*Math.sin(t*3.3)*k]);}
  plnTube(m,{path,rad:t=>lerp(.46,.27,Math.pow(t,.6))*k*thin*(1+1.1*Math.pow(1-t,5)),sides:fine?9:5,
    col:plnTreeBark(PLN_BARK.a,PLN_BARK.b),mat:PLN_MAT.bark,wind:t=>t*t*.02*k});
  const F=path[8],nc=[cx,H*.60,0];
  const leaf=(u,p,n)=>[plnSmooth(-.15,.5,n[1]),.5+plnNoise(p[0]*.8,p[2]*.8+p[1],7)*.14,0];
  const wnd=p=>(.08+.14*Math.hypot(p[0]-cx,p[2])/R)*k;
  /* ярус: его высота, радиус кольца, радиус шапок и сколько их */
  const tiers=rich?[[.71,.64,.38,6],[.835,.33,.37,4],[.95,0,.33,1]]
    :[[.72,.60,.42,4+(r()*2|0)],[.85,.27,.40,2+(r()*2|0)],[.96,0,.33,1]];
  tiers.forEach(([th,tr,tp,tn],ti)=>{
    const a0=r()*TAU;
    for(let b=0;b<tn;b++){
      const ang=a0+b/tn*TAU+(r()-.5)*.5,rr=R*tr*(.85+r()*.3);
      const pr=R*tp*(.85+r()*.3),ph=pr*(.34+r()*.1);
      const e=[cx+Math.cos(ang)*rr,H*(th+(r()-.5)*.035),Math.sin(ang)*rr*.9];
      const mid=[lerp(F[0],e[0],.3),lerp(F[1],e[1],.8),lerp(F[2],e[2],.3)];
      plnTube(m,{path:plnBez(F,mid,e,fine?7:3),rad:t=>lerp(.22,.06,Math.pow(t,.8))*k,sides:fine?6:3,col:PLN_BARK.b,mat:PLN_MAT.bark,wind:t=>(.02+.1*t*t)*k});
      plnFloraCap(m,[e[0],e[1]+ph*.2,e[2]],pr,ph,{sub,seed:ti*31+b*7+(r()*99|0),yaw:r()*TAU,lean:(r()-.5)*.12,col:leaf,wind:wnd,nc,ncK:.35});
      /* малая шапка на краю нижнего яруса ломает обвод */
      if(!ti&&(rich||r()<.5)){
        const a2=ang+(r()-.5)*.9,r2=rr+pr*(.75+r()*.2),sr=pr*(.36+r()*.16);
        plnFloraCap(m,[cx+Math.cos(a2)*r2,e[1]-pr*(.1+r()*.15),Math.sin(a2)*r2*.9],sr,sr*.45,
          {sub:Math.max(1,sub-1),seed:b*5+3,yaw:r()*TAU,col:leaf,wind:wnd,nc,ncK:.35});
      }
    }
  });
  return m;
}

/* Свеча: узкое веретено из тесной стопки шапок; ствол виден только у земли. Вертикаль против
   лежачих планов дальнего берега. Шапки лежат одна на другой со сдвигом в стороны: обвод в зубцах,
   между ярусами — полоска тени, а верх каждого на свету. Нижние темнее: верхние держат их в тени */
function plnTreeCol(r,H,R,sub,rich,o){
  o=o||{};
  const m=plnMesh(4096),k=H/9,lean=o.lean==null?(r()-.5)*.4:o.lean,bend=o.bend==null?(r()-.5)*.7:o.bend;
  const top=H*.93,ax=plnTreeAxis(H,top,lean,bend),n=rich?13:11,y0=H*(o.skirt||(.15+r()*.07)),a0=r()*TAU,wide=o.wide||.27;
  plnTreeTrunk(m,ax,top,.3*k*(o.thin||1),.05*k,sub,{wind:t=>t*t*.2*k});
  for(let i=0;i<n;i++){
    const t=i/(n-1),y=lerp(y0,H*.95,Math.pow(t,.95)),tip=i===n-1,c=ax(y);
    const rho=R*(t<wide?lerp(.5,1,t/wide):lerp(1,.2,Math.pow((t-wide)/(1-wide),1.1)));
    const leaf=plnTreeLeaf(7+i,(1-t)*.13),w=(.04+.2*t*t)*k,nc=[c[0],y-rho*1.2,c[2]];
    /* сдвиг и радиус вместе не выносят шапку дальше 1.3 радиуса веретена: блюдо, торчащее вбок, ломает свечу */
    const ang=a0+i*2.4+(r()-.5)*.6,d=tip?0:rho*(.16+r()*.2),pr=tip?rho*.8:Math.min(rho*(.78+r()*.4),rho*1.3-d),ph=pr*(tip?1.25:.4+r()*.12);
    /* шапка клонится наружу, в сторону своего сдвига: стопка не лежит блинами */
    plnFloraCap(m,[c[0]+Math.cos(ang)*d,y+(r()-.5)*.2*k,c[2]+Math.sin(ang)*d*.9],pr,ph,
      {sub,seed:i*17+(r()*99|0),yaw:r()*TAU,lean:(r()-.5)*.2-Math.cos(ang)*.22,col:leaf,wind:w,nc,ncK:.4});
    /* широким ярусам — вторая шапка с другой стороны, пониже: веретено не плоское */
    if(!tip&&rho>R*.62){
      const p2=rho*(.55+r()*.15);
      plnFloraCap(m,[c[0]-Math.cos(ang)*rho*.42,y-rho*(.12+r()*.1),c[2]-Math.sin(ang)*rho*.38],p2,p2*.42,
        {sub:Math.max(1,sub-1),seed:i*23+5,yaw:r()*TAU,lean:(r()-.5)*.2,col:leaf,wind:w,nc,ncK:.4});
    }
  }
  return m;
}

/* Ярусы: прямой ствол и плоские блюда кроны с воздухом между ними, кверху меньше.
   o.hs — высоты блюд (доли роста), o.taper — во сколько раз верхнее блюдо меньше нижнего */
function plnTreePag(r,H,R,sub,rich,o){
  o=o||{};
  const m=plnMesh(4096),k=H/9,lean=o.lean==null?(r()-.5)*.3:o.lean,bend=o.bend==null?(r()-.5)*.6:o.bend;
  const top=H*.95,ax=plnTreeAxis(H,top,lean,bend),hs=o.hs||(rich?[.30,.47,.62,.76,.88]:[.34,.54,.71,.86]),n=hs.length,taper=o.taper||.4;
  plnTreeTrunk(m,ax,top,.36*k*(o.thin||1),.05*k,sub,{wind:t=>t*t*.12*k});
  for(let i=0;i<n;i++){
    const t=i/(n-1),y=H*(hs[i]+(r()-.5)*.03),Rd=R*lerp(1,taper,Math.pow(t,.85))*(.92+r()*.16),c=ax(y);
    const cc=[c[0]+(r()-.5)*Rd*.25,y,c[2]+(r()-.5)*Rd*.25],cnt=Rd>R*.7?5:(Rd>R*.5?4:3),a0=r()*TAU;
    const leaf=plnTreeLeaf(11+i,(1-t)*.1),ty=y/top,wt=ty*ty*.12*k,nc=[cc[0],y-Rd*.9,cc[2]];
    const w=p=>wt+.12*k*Math.hypot(p[0]-c[0],p[2]-c[2])/R;
    plnFloraCap(m,[cc[0],y+Rd*.05,cc[2]],Rd*.56,Rd*.17,{sub,seed:i*13+(r()*99|0),yaw:r()*TAU,col:leaf,wind:w,nc,ncK:.4});
    for(let b=0;b<cnt;b++){
      const ang=a0+b/cnt*TAU+(r()-.5)*.6,d=Rd*(.5+r()*.12),pr=Rd*(.42+r()*.12),ph=pr*(.28+r()*.08);
      const e=[cc[0]+Math.cos(ang)*d,y-Rd*(.03+r()*.07),cc[2]+Math.sin(ang)*d*.9],drop=(.5+r()*.4)*k;
      if(sub>1){
        const f=ax(y-drop);
        plnTreeLimb(m,f,[lerp(f[0],e[0],.5),lerp(f[1],e[1],.85),lerp(f[2],e[2],.5)],[e[0],e[1]-ph*.1,e[2]],.1*k,.03*k,sub,wt,wt+.06*k);
      }
      plnFloraCap(m,e,pr,ph,{sub,seed:i*29+b*7+(r()*99|0),yaw:r()*TAU,lean:(r()-.5)*.14,col:leaf,wind:w,nc,ncK:.4});
    }
  }
  const tp=ax(top);
  plnFloraCap(m,[tp[0],top,tp[2]],R*.2,R*.13,{sub,seed:91,yaw:r()*TAU,col:plnTreeLeaf(19,0),wind:.26*k,nc:[tp[0],H*.8,tp[2]],ncK:.4});
  return m;
}

/* Шар: тонкая высокая нога и крона-облако — кучевое, как облака этого мира: плоская подошва
   и купола разного роста над ней, тесно, без неба между ними. Круглый тут обвод, а не тело:
   купол ловит свет верхом, и верх объективу виден. o.tall — насколько крона высока */
function plnTreeOrb(r,H,R,sub,rich,o){
  o=o||{};
  const m=plnMesh(4096),k=H/9,thin=o.thin||1,lean=o.lean==null?(r()-.5)*.5:o.lean,bend=o.bend==null?r()-.5:o.bend;
  const tall=o.tall||.85,base=H-R*(tall*1.31+.02),fy=base+R*.1,ax=plnTreeAxis(H,fy,lean,bend),F=ax(fy),C=[F[0]+lean*R*.2,base+R*.25,F[2]];
  plnTreeTrunk(m,ax,fy,.27*k*thin,.15*k*thin,sub,{wind:t=>t*t*.05*k});
  const w=p=>(.06+.14*Math.hypot(p[0]-C[0],p[1]-C[1],p[2]-C[2])/R)*k,a0=r()*TAU;
  /* купол стоит подошвой на общем уровне: его середина выше подошвы на .31 своей высоты */
  const dome=(x,z,pr,ph,lift,seed,dim)=>plnFloraCap(m,[x,base+ph*.31+lift,z],pr,ph,
    {sub,seed,yaw:r()*TAU,lean:(r()-.5)*.14,col:plnTreeLeaf(23+seed%5,dim-.05,.55),wind:w,nc:C,ncK:.35,bump:.24,bumpF:2.1});
  dome(C[0],C[2],R*.6,R*tall,0,3,0);
  const n=rich?6:5;
  for(let j=0;j<n;j++){
    const a=a0+j/n*TAU+(r()-.5)*.5,d=R*(.46+r()*.1),pr=R*(.42+r()*.12),ph=pr*(.78+r()*.2)*tall/.85;
    dome(C[0]+Math.cos(a)*d,C[2]+Math.sin(a)*d*.9,pr,ph,(r()-.5)*R*.08,7+j*3,.04);
  }
  /* малые купола на плечах большого ломают обвод */
  for(let j=0;j<3;j++){
    const a=a0+.6+j/3*TAU+(r()-.5)*.6,d=R*(.26+r()*.1),pr=R*(.3+r()*.1);
    dome(C[0]+Math.cos(a)*d,C[2]+Math.sin(a)*d*.9,pr,pr*.85,R*tall*(.5+r()*.12),31+j*7,0);
  }
  if(sub>1)for(let j=0;j<3;j++){
    const a=a0+j*TAU/3+r(),e=[C[0]+Math.cos(a)*R*.4,base+R*.08,C[2]+Math.sin(a)*R*.36];
    plnTreeLimb(m,F,[lerp(F[0],e[0],.5),lerp(F[1],e[1],.3),lerp(F[2],e[2],.5)],e,.13*k*thin,.05*k,sub,.05*k,.08*k);
  }
  return m;
}

/* Развилка: короткий толстый ствол, две-три руки, и на каждой своё блюдо — на разной высоте,
   с небом между ними. Нижняя рука тянется дальше всех */
function plnTreeFork(r,H,R,sub,rich,o){
  o=o||{};
  const m=plnMesh(4096),k=H/9,thin=o.thin||1,lean=o.lean==null?(r()-.5)*.5:o.lean,split=H*(.16+r()*.07);
  const ax=plnTreeAxis(H,split,lean,0),F=ax(split),n=rich||r()<.6?3:2,a0=r()*TAU,flip=r()<.5?1:-1;
  plnTreeTrunk(m,ax,split,.55*k*thin,.44*k*thin,sub,{wind:t=>t*t*.01*k});
  /* рука: докуда тянется, как высоко несёт блюдо и каков его радиус */
  const arms=[[.62,.62,.54],[.4,.84,.46],[.14,.97,.38]];
  for(let j=0;j<n;j++){
    const A=arms[j],a=a0+flip*j*(TAU/3+.35)+(r()-.5)*.5,reach=R*A[0]*(.9+r()*.2),ey=H*(A[1]+(r()-.5)*.04);
    const pr=R*A[2]*(.9+r()*.2),ph=pr*(.3+r()*.06),e=[F[0]+Math.cos(a)*reach,ey,F[2]+Math.sin(a)*reach*.9];
    const mid=[F[0]+Math.cos(a)*reach*.8,lerp(split,ey,.3),F[2]+Math.sin(a)*reach*.72];
    plnTreeLimb(m,F,mid,[e[0],e[1]-ph*.1,e[2]],.34*k*thin,.09*k,sub,.01*k,.1*k);
    const leaf=plnTreeLeaf(31+j,(2-j)*.04),nc=[e[0],ey-pr*.9,e[2]],ns=3+(r()*2|0);
    const w=p=>(.08+.14*Math.hypot(p[0]-e[0],p[2]-e[2])/(pr*1.6))*k;
    plnFloraCap(m,[e[0],ey+ph*.2,e[2]],pr,ph,{sub,seed:j*31+(r()*99|0),yaw:r()*TAU,lean:(r()-.5)*.12,col:leaf,wind:w,nc,ncK:.4});
    for(let b=0;b<ns;b++){
      const a2=b/ns*TAU+r()*1.2,d=pr*(.7+r()*.3),sr=pr*(.5+r()*.16);
      plnFloraCap(m,[e[0]+Math.cos(a2)*d,ey-pr*(.04+r()*.1),e[2]+Math.sin(a2)*d*.9],sr,sr*.36,
        {sub:Math.max(1,sub-1),seed:b*5+j*3+1,yaw:r()*TAU,col:leaf,wind:w,nc,ncK:.4});
    }
  }
  return m;
}

/* Сухостой: выбеленный толстый ствол со сломанной вершиной и обломками сучьев. Редкость: он — событие */
function plnTreeSnag(r,H,R,sub){
  const m=plnMesh(1024),k=H/9,top=H*(.78+r()*.2),ax=plnTreeAxis(H,top,(r()-.5)*.7,(r()-.5)*1.5);
  plnTreeTrunk(m,ax,top,.5*k,.2*k,sub,{col:plnTreeBark(PLN_BARK.dry,PLN_BARK.dryB),cap:true,wind:t=>t*t*.015*k});
  const n=3+(r()*2|0),a0=r()*TAU;
  for(let j=0;j<n;j++){
    const f=ax(top*(.4+.5*j/n+r()*.08)),a=a0+j*2.4+(r()-.5)*.6,len=(1.5+r()*1.7)*k,up=.35+r()*.5;
    const e=[f[0]+Math.cos(a)*len,f[1]+len*up,f[2]+Math.sin(a)*len*.9];
    const b=[f[0]+Math.cos(a)*len*.65,f[1]+len*.05,f[2]+Math.sin(a)*len*.6];
    plnTreeLimb(m,f,b,e,.17*k,.04*k,sub,.01*k,.04*k,PLN_BARK.dry);
    if(j<2){
      const a2=a+(r()-.5)*1.6,l2=len*.5,g=plnBez(f,b,e,4)[2];
      plnTreeLimb(m,g,[g[0]+Math.cos(a2)*l2*.5,g[1]+l2*.3,g[2]+Math.sin(a2)*l2*.5],
        [g[0]+Math.cos(a2)*l2,g[1]+l2*.8,g[2]+Math.sin(a2)*l2*.9],.08*k,.025*k,sub,.02*k,.05*k,PLN_BARK.dry);
    }
  }
  return m;
}
const PLN_TREE_MAKE={umb:plnTreeUmb,col:plnTreeCol,pag:plnTreePag,orb:plnTreeOrb,fork:plnTreeFork,snag:plnTreeSnag};
