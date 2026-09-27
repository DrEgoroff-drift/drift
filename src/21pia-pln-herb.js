/* ══════════════ планета: растения игры — двенадцать форм (M611) ══════════════
   То, что игра сажает сама (S.plants): виды планеты (floraOf), у каждого своя
   форма из двенадцати, свой рост и свой цвет. Игрок их сканирует, поэтому стоят
   они там же, где стояли, — вдоль линии ходьбы, сразу за тропой, куртиной в
   глубину (pl.z).

   Тело — на вид и на возраст: всход, взрослое, старое. Оно построено в рост
   единицу, в мир его ставит запись: место, рост экземпляра и два цвета листа —
   сухое место и старость меняют цвет, как меняли. Описанное растение уходит в
   бирюзу прибора. Стебель, цветок и кристалл несут свой цвет сами.

   Форма читается силуэтом: гриб — шляпкой с плоским исподом, зонтик —
   мембраной на рёбрах, спираль — витком, шар — шаром на привязи. Это заготовки
   первого этапа; свой проход по флоре — M622. */
const PLN_HERB={z0:1.9,zk:2.6,          /* куртина в глубину: от и на сколько, м */
  tints:[0,3,1,2],                      /* краски мира (PLN_TINTS) по очереди; последняя — акцент */
  bark:plnHex("#5b4636"),
  teal:[127,230,216]};

function plnHerbZ(pl){return PLN_HERB.z0+clamp(pl.z==null?.5:pl.z,0,1)*PLN_HERB.zk;}
/* гасит чистоту цвета: доля k уходит в серое той же светлоты */
function plnHerbSoft(c,k){const l=c[0]*.3+c[1]*.55+c[2]*.15;return plnMix3(c,[l,l,l],k);}
/* Цвет вида в красках этого мира. У игры лист — чистая зелень на палитре планеты: в кадре, где
   тон мешан по кругу, она горит кислотой. Вид оставляет себе оттенок, а светлоту и глубину
   берёт у мира. T — краска мира {top, under}, leaf — цвет листа экземпляра */
function plnHerbTone(T,leaf){
  const soft=plnHerbSoft(plnRgb(leaf),.45);
  return {top:plnMix3(soft,T.top,.62),under:plnMix3(plnMul(soft,.3),T.under,.7)};
}
/* крона: сетка несёт ход от испода к макушке и свою светлоту, цвета даёт запись */
function plnHerbLeaf(g){return (u,p,n)=>[plnSmooth(-.3,.6,n[1]),(g||.5)+plnNoise(p[0]*3,p[2]*3+p[1],3)*.1,0];}
/* ствол в рост h с наклоном и изгибом вида; возвращает точку ствола по доле высоты */
function plnHerbStem(m,r,sp,o){
  const n=6,pts=[];
  for(let i=0;i<=n;i++){
    const t=i/n;
    pts.push([o.lean*t*t+Math.sin(t*3.1)*sp.curl*.18*o.h,t*o.h,(r()-.5)*.05*t]);
  }
  plnTube(m,{path:pts,rad:t=>lerp(o.rad*(o.foot||1),o.rad*.55,Math.pow(t,.6)),sides:6,col:t=>plnMul(o.col,lerp(.65,1.05,t)),mat:PLN_MAT.bark,
    wind:t=>t*t*.12});
  return t=>{
    const f=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(f)),q=f-i,a=pts[i],b=pts[i+1];
    return [lerp(a[0],b[0],q),lerp(a[1],b[1],q),lerp(a[2],b[2],q)];
  };
}
/* ветвь от ствола: вбок и вверх; возвращает её конец */
function plnHerbBranch(m,a,ang,az,len,rad,col){
  const s=Math.sin(ang),e=[a[0]+s*len*Math.cos(az),a[1]+len*.62,a[2]+s*len*Math.sin(az)*.8];
  plnTube(m,{path:plnBez(a,[a[0]+s*len*.6*Math.cos(az),a[1]+len*.35,a[2]+s*len*.6*Math.sin(az)*.8],e,4),rad:t=>lerp(rad,rad*.5,t),sides:5,col,
    mat:PLN_MAT.bark,wind:.12*a[1]*a[1]});
  return e;
}
/* лист-перо: полоса от корня, встаёт и никнет; zig — зубчатый край, как у папоротника */
function plnHerbBlade(m,root,az,el,len,w,droop,g,wind,zig){
  const ox=Math.cos(az),oz=Math.sin(az),M=PLN_MAT.grass,S=8;
  let pa=-1,pb=-1,px=0,py=0;
  for(let s=0;s<=S;s++){
    const t=s/S,e=el+droop*t*t*1.2;
    if(s){const em=el+droop*(t-.06)*(t-.06)*1.2;px+=Math.sin(em)*len/S;py+=Math.cos(em)*len/S;}
    const p=[root[0]+ox*px,root[1]+py,root[2]+oz*px],ww=w*Math.sin(Math.PI*Math.pow(t,.6))*(zig&&(s&1)?.55:1)+(s===S?0:.004);
    const nr=plnNorm([-ox*Math.cos(e),Math.sin(e)+.35,-oz*Math.cos(e)-.25]),col=[Math.pow(t,.7),g,0],wd=wind*(root[1]+t)*(root[1]+t);
    const va=plnVert(m,[p[0]+oz*ww,p[1],p[2]-ox*ww],nr,col,M,wd,0,t),vb=plnVert(m,[p[0]-oz*ww,p[1],p[2]+ox*ww],nr,col,M,wd,0,t);
    if(s)plnQuad(m,pa,pb,vb,va);
    pa=va;pb=vb;
  }
}

/* Двенадцать форм. m — сетка, r — кости вида, sp — вид, A — возраст {young, old, k, gl},
   C — цвета вида {stem, leaf, lo, hi, bloom} */
const PLN_HERB_MAKE=[
  /* 0 стеблевой: стебель, на нём три бутона */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.84,lean:A.lean,rad:A.rad,col:C.stem}),tip=at(1),k=A.k;
    for(let i=0;i<A.nb;i++){
      const e=plnHerbBranch(m,at(.35+r()*.45),(i&1?1:-1)*(.7+r()*.5),r()*TAU,.2+r()*.1,A.rad*.5,C.stem);
      plnBlob(m,{c:e,r:[.05*k,.085*k,.05*k],sub:1,col:plnHerbLeaf(.5),mat:PLN_MAT.leaf,wind:.1,glow:A.gl});
    }
    for(const i of [-1,0,1]){
      const w=(.1-Math.abs(i)*.025)*k;
      plnBlob(m,{c:[tip[0]+i*.11*k,tip[1]+.1*k-Math.abs(i)*.03,tip[2]+(i?.03:-.03)],r:[w,.17*k,w],sub:2,lean:-i*.35,col:plnHerbLeaf(.5-Math.abs(i)*.06),
        mat:PLN_MAT.leaf,wind:.12,glow:A.gl});
    }
    return [tip[0],tip[1]+.27*k,tip[2]];
  },
  /* 1 ветвистый: деревце — ветви вразлёт, на каждой шапка */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.8,lean:A.lean,rad:A.rad*1.2,col:C.stem,foot:1.5}),tip=at(1),k=A.k;
    for(let i=0;i<A.nb;i++){
      const e=plnHerbBranch(m,at(.3+.6*(i+r()*.6)/Math.max(1,A.nb)),(.6+r()*.7),i*2.4+r()*.5,(sp.branchLen+.12)*(.7+r()*.6),A.rad*.6,C.stem),pr=(.12+r()*.06)*k;
      plnFloraCap(m,[e[0],e[1]+pr*.2,e[2]],pr,pr*.8,{sub:1,seed:i+3,yaw:r()*TAU,col:plnHerbLeaf(.45+r()*.1),wind:.1,nc:[e[0],e[1]-pr*.5,e[2]]});
    }
    plnFloraCap(m,[tip[0],tip[1]+.05,tip[2]],.2*k,.17*k,{sub:2,seed:1,col:plnHerbLeaf(.52),wind:.12,nc:[tip[0],tip[1]-.1,tip[2]]});
    return [tip[0],tip[1]+.22*k,tip[2]];
  },
  /* 2 папоротниковый: короткий ствол и вайи веером */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.42,lean:A.lean*.5,rad:A.rad*1.3,col:C.stem,foot:1.4}),n=A.nb+4;
    for(let i=0;i<n;i++){
      const t=.55+.45*(i/n),el=lerp(1.05,.2,i/n)+r()*.2;
      plnHerbBlade(m,at(t),i*2.4+r()*.4,el,(.62+r()*.2)*A.k,.1*A.k,.5+r()*.5,.5+(r()-.5)*.14,.1,true);
    }
    const tip=at(1);
    return [tip[0],tip[1]+.5*A.k,tip[2]];
  },
  /* 3 стручковый: ветви и макушка держат стручки */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.86,lean:A.lean,rad:A.rad,col:C.stem}),tip=at(1),k=A.k;
    const pod=(c,a)=>plnBlob(m,{c:[c[0]+Math.sin(a)*.04,c[1]-.06*k,c[2]],r:[.035*k,.085*k,.035*k],sub:1,lean:-a*.6,col:plnHerbLeaf(.62),mat:PLN_MAT.leaf,
      wind:.12,glow:A.gl});
    for(let i=0;i<A.nb;i++)pod(plnHerbBranch(m,at(.3+r()*.6),(i&1?1:-1)*(.6+r()*.6),r()*TAU,(sp.branchLen+.08)*(.7+r()*.6),A.rad*.5,C.stem),0);
    for(let i=0;i<A.pods;i++){
      const a=(i-(A.pods-1)/2)*.55,e=[tip[0]+Math.sin(a)*.12,tip[1]+Math.cos(a)*.08,tip[2]+(r()-.5)*.08];
      plnTube(m,{path:[tip,e],rad:A.rad*.35,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:.12});
      pod(e,a);
    }
    return [tip[0],tip[1]+.1,tip[2]];
  },
  /* 4 друзовый: гранёные кристаллы прямо из грунта */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.facets;i++){
      const a=(i/Math.max(1,A.facets-1)-.5)*1.6+(r()-.5)*.2,len=i?.55+r()*.45:1,w=(.07+r()*.06)*A.k,z=(r()-.5)*.3;
      plnThingPrism(m,[Math.sin(a)*.1,0,z],[Math.sin(a)*len*.75,Math.cos(a*.8)*len,z+(r()-.5)*.25],w,6,C.lo,C.hi,sp.glow?.7:.16);
    }
    return null;
  },
  /* 5 колосовой: пучок стеблей, на каждом колос */
  (m,r,sp,A,C)=>{
    const n=clamp(A.pods,2,5);
    let top=null;
    for(let i=0;i<n;i++){
      const a=r()*TAU,l=i?.25+r()*.3:A.lean,h=i?.7+r()*.25:.92,at=plnHerbStem(m,r,sp,{h,lean:l*Math.cos(a),rad:A.rad*.7,col:C.stem}),tip=at(1);
      for(let j=0;j<6;j++)plnBlob(m,{c:[tip[0]+(r()-.5)*.02,tip[1]+.02-j*.035*A.k,tip[2]+(r()-.5)*.02],r:[.032*A.k,.03*A.k,.032*A.k],sub:0,
        col:[.95,.55+(j&1)*.12,0],mat:PLN_MAT.leaf,wind:.12,glow:A.gl});
      if(!i)top=[tip[0],tip[1]+.06,tip[2]];
    }
    plnHerbBlade(m,[0,0,0],r()*TAU,.9,.4,.035,.6,.45,.1,false);plnHerbBlade(m,[0,0,0],r()*TAU,1.1,.35,.035,.6,.5,.1,false);
    return top;
  },
  /* 6 ковровый: низкие подушки, без стебля */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.blobs;i++){
      const x=(i-(A.blobs-1)/2)*.9+(r()-.5)*.3,rr=.5+r()*.5,z=(r()-.5)*1.1;
      plnFloraCap(m,[x,rr*.12,z],rr,rr*.55,{sub:2,bump:.3,bumpF:2.6,seed:i+2,yaw:r()*TAU,col:plnHerbLeaf(.46+r()*.1),wind:.02,nc:[x,-rr*.3,z]});
      if(sp.bloom&&!A.young)for(let j=0;j<4;j++){
        const a=r()*TAU,d=r()*rr*.6;
        plnBlob(m,{c:[x+Math.cos(a)*d,rr*.12+rr*.5*Math.sqrt(Math.max(0,1-d*d/(rr*rr)))+.03,z+Math.sin(a)*d],r:[.06,.05,.06],sub:0,col:C.bloom,mat:PLN_MAT.bark,glow:.25});
      }
    }
    return null;
  },
  /* 7 грибной: толстая ножка и широкая шляпка с плоским исподом */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.9,lean:A.lean*.6,rad:Math.max(.04,A.rad*1.5),col:plnMix3(C.stem,[.75,.72,.62],.35),foot:2.2}),tip=at(1);
    const pr=clamp(sp.cap*.6*A.k,.26,.8),ph=.3*Math.sqrt(A.k);
    plnFloraCap(m,[tip[0],tip[1]+ph*.12,tip[2]],pr,ph,{sub:3,bump:.1,bumpF:1.8,seed:5,col:plnHerbLeaf(.5),wind:.12,nc:[tip[0],tip[1]-pr*.6,tip[2]],ncK:.35});
    for(let i=0;i<7;i++){
      const a=r()*TAU,d=(.15+r()*.7)*pr,y=ph*Math.sqrt(Math.max(.02,1-d*d/(pr*pr)));
      plnBlob(m,{c:[tip[0]+Math.cos(a)*d,tip[1]+ph*.12+y*.98,tip[2]+Math.sin(a)*d],r:[pr*.09,pr*.025,pr*.09],sub:1,col:[1,.78,0],mat:PLN_MAT.leaf,wind:.12});
    }
    if(sp.glow&&!A.young)plnBlob(m,{c:[tip[0],tip[1]-.02,tip[2]],r:[pr*.8,.015,pr*.8],sub:2,col:C.hi,mat:PLN_MAT.glow,wind:.12,glow:.9});
    return null;
  },
  /* 8 спиральный: ствол уходит витками, листья по внешней кромке */
  (m,r,sp,A,C)=>{
    const N=46,path=[],R0=.3,P=t=>{const a=t*sp.turns*TAU,rr=R0*(1-t*.62);return [Math.sin(a)*rr+A.lean*t,t,Math.cos(a)*rr*.8];};
    for(let i=0;i<=N;i++)path.push(P(i/N));
    plnTube(m,{path,rad:t=>lerp(Math.max(.045,A.rad*2),.02,t),sides:7,col:t=>plnMul(C.stem,lerp(.7,1.1,t)),mat:PLN_MAT.bark,wind:t=>t*t*.1});
    for(let i=0;i<6;i++){
      const t=.35+i/6*.6,q=P(t),a=t*sp.turns*TAU,o=[Math.sin(a),0,Math.cos(a)*.8];
      plnBlob(m,{c:[q[0]+o[0]*.09,q[1]+.02,q[2]+o[2]*.09],r:[.11*A.k,.035*A.k,.06*A.k],sub:1,yaw:-a+Math.PI/2,col:plnHerbLeaf(.5),mat:PLN_MAT.leaf,
        wind:.1*t*t,glow:A.gl});
    }
    return P(1);
  },
  /* 9 зонтичный: тонкая ножка и мембрана на рёбрах */
  (m,r,sp,A,C)=>{
    const at=plnHerbStem(m,r,sp,{h:.97,lean:A.lean,rad:A.rad*.7,col:C.stem}),tip=at(1),cw=clamp(.42*sp.cap*A.k,.18,.55),NA=sp.ribs*4,NR=4,ids=[];
    for(let j=0;j<=NR;j++)for(let i=0;i<=NA;i++){
      const a=i/NA*TAU,t=j/NR,rr=cw*t,y=tip[1]+.04-.2*t*t+.03*Math.cos(a*sp.ribs)*t*t;
      const n=plnNorm([Math.cos(a)*t*.8,1,Math.sin(a)*t*.8]);
      ids.push(plnVert(m,[tip[0]+Math.cos(a)*rr,y,tip[2]+Math.sin(a)*rr],n,[lerp(1,.35,t),.5+.08*Math.cos(a*sp.ribs),0],PLN_MAT.leaf,.12,A.gl,0));
    }
    for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){
      const o=j*(NA+1)+i;
      plnQuad(m,ids[o],ids[o+1],ids[o+NA+2],ids[o+NA+1]);
    }
    for(let i=0;i<sp.ribs;i++){
      const a=(i+.5)/sp.ribs*TAU;
      plnTube(m,{path:[[tip[0],tip[1]+.035,tip[2]],[tip[0]+Math.cos(a)*cw*.6,tip[1]-.04,tip[2]+Math.sin(a)*cw*.6],[tip[0]+Math.cos(a)*cw,tip[1]-.19,tip[2]+Math.sin(a)*cw]],
        rad:.008,sides:4,col:plnMul(C.stem,.7),mat:PLN_MAT.bark,wind:.12});
    }
    return null;
  },
  /* 10 шаровой: шары на привязи */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.balls;i++){
      const bx=(i-(A.balls-1)/2)*.34+A.lean,br=(.16+((i*37)%5)/5*.1)*A.k,by=.84+.2-((i*23)%4)/4*.16,bz=(r()-.5)*.3;
      plnTube(m,{path:plnBez([bx*.4,0,bz*.3],[bx*.7,by*.4,bz*.6],[bx,by-br,bz],6),rad:.008,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:t=>t*t*.2});
      plnBlob(m,{c:[bx,by,bz],r:[br,br*1.12,br],sub:2,col:plnHerbLeaf(.52),mat:PLN_MAT.leaf,wind:.2,glow:sp.glow?.5:.08,nc:[bx,by-br*.4,bz],ncK:.3});
    }
    return null;
  },
  /* 11 ленточный: широкие ленты волной от корня */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.ribbons;i++){
      const w=.05+((i*29)%5)/5*.05,hh=.6+((i*41)%6)/6*.6;
      plnHerbBlade(m,[(r()-.5)*.12,0,(r()-.5)*.12],r()*TAU,.12+r()*.3,hh,w*1.3,.25+r()*.5,i&1?.52:.36,.22,false);
    }
    if(sp.glow&&!A.young)plnBlob(m,{c:[0,.06,0],r:[.22,.04,.18],sub:1,col:C.hi,mat:PLN_MAT.glow,glow:.7});
    return null;
  }];

/* тело вида sp в возрасте ac: 0 — всход, 1 — взрослое, 2 — старое */
function plnHerbMesh(sp,si,ac){
  const m=plnMesh(4096),r=rng(plnThingSeed(sp.name||"")+si*131+ac*17),young=ac===0,old=ac===2;
  const cnt=(v,k)=>Math.max(1,Math.round(v*k));
  const leaf=plnHerbSoft(plnRgb(sp.leaf),.35),stem=plnMix3(plnHerbSoft(plnRgb(sp.stem),.4),PLN_HERB.bark,.5);
  /* толщина ствола в долях роста: ствол вида wK единиц при росте h */
  const A={young,old,k:old?1.15:(young?.8:1),lean:(r()-.5)*.24+(old?.1:0),rad:clamp(sp.wK*1.1/Math.max(20,sp.h)*.5,.012,.05),gl:sp.glow&&!young?.45:0,
    nb:young?Math.max(0,sp.nb-2):sp.nb,pods:cnt(sp.pods,young?.5:(old?1.2:1)),facets:cnt(sp.facets,young?.6:1),blobs:cnt(sp.blobs,young?.55:(old?1.15:1)),
    balls:young?1:sp.balls,ribbons:cnt(sp.ribbons,young?.6:1)};
  const C={stem,leaf,lo:plnMul(leaf,.45),hi:plnMix3(leaf,[1,1,1],.4),bloom:plnRgb([255,225,140])};
  const tip=PLN_HERB_MAKE[sp.kind%12](m,r,sp,A,C);
  if(plantStemForm(sp.kind)&&!young){
    /* шипы по стволу и сухие ветви у старого: возраст читается силуэтом */
    if(sp.spiny)for(let i=0;i<8;i++){
      const y=.12+i*.085,a=i*2.4;
      plnTube(m,{path:[[0,y,0],[Math.cos(a)*.06,y+.03,Math.sin(a)*.06]],rad:t=>lerp(.008,.001,t),sides:4,col:plnMul(stem,1.3),mat:PLN_MAT.bark});
    }
    if(old)for(let i=0;i<2+(r()<.5?1:0);i++)
      plnHerbBranch(m,[0,.3+r()*.5,0],(i&1?1:-1)*(.7+r()*.8),r()*TAU,sp.branchLen*(1+r()*.6)+.1,A.rad*.5,plnRgb([122,106,84]));
  }
  if(tip&&sp.bloom&&!young)plnBlob(m,{c:tip,r:[.035,.035,.035],sub:1,col:C.bloom,mat:PLN_MAT.bark,wind:.12,glow:.3});
  return m;
}

/* ── то, что растёт на этой посадке ── */
function plnHerbs(L,S,p){
  let Q=L.herbs;
  if(Q&&Q.gen!==PLN_GPU.gen){plnHerbDrop(L);Q=null;}
  const list=S.plants||[];
  let sig=list.length;
  for(const q of list)if(q.scanned)sig+=977;
  if(Q&&Q.sig===sig)return Q;
  const t0=wallMs(),M=PLN_M,lake=L.lake,T=plnRgb(PLN_HERB.teal);
  if(!Q)Q=L.herbs={gen:PLN_GPU.gen,geo:{},inst:null,a:new Float32Array(16*64),cap:0,n:0,sig:-1,parts:[],blots:[],ms:0};
  Q.sig=sig;
  const sps=floraOf(p),by={},cnt=sps.map(()=>0);
  let n=0;
  for(const q of list){
    if(!q||!isFinite(q.x)||!q.sp)continue;
    const x=q.x/M;
    if(lake&&x>lake.x0&&x<lake.x1)continue;
    const si=Math.max(0,sps.indexOf(q.sp)),key=si*3+(q.age<.3?0:(q.age>.82?2:1));
    (by[key]=by[key]||[]).push(q);
    cnt[si]++;n++;
  }
  /* краска вида: самые частые берут зелень мира по очереди, акцент достаётся самому редкому */
  const ord=sps.map((s,i)=>i).sort((a,b)=>cnt[b]-cnt[a]||a-b),tint=[];
  ord.forEach((si,k)=>{tint[si]=PLN_HERB.tints[k===ord.length-1&&ord.length>2?3:k%3];});
  if(n*16>Q.a.length)Q.a=new Float32Array(n*16);
  Q.parts.length=0;Q.blots.length=0;
  n=0;
  for(const key in by){
    const si=(key/3)|0,sp=by[key][0].sp;
    if(!Q.geo[key])Q.geo[key]=plnGeo(plnHerbMesh(sp,si,key%3));
    const first=n,druse=sp.kind===4;
    for(const q of by[key]){
      const x=q.x/M,z=plnHerbZ(q),h=Math.max(4,q.h||20)/M,hh=hashi(Math.round(q.x),Math.round(q.h),0x9E11);
      const jt=1+(((hh>>>9)&255)/255-.5)*.24,C=plnHerbTone(PLN_TINTS[tint[si]],q.leaf||sp.leaf);
      let top=plnMul(C.top,jt),under=plnMul(C.under,jt);
      if(q.scanned){top=plnMix3(top,T,.5);under=plnMix3(under,plnMul(T,.3),.5);}
      if(druse)plnRec(Q.a,n++,[x,plnLandRibAt(L,x,z)-.03,z],h,((hh>>>3)&255)/255*TAU,1,n,q.scanned?[.6,1.1,1.05]:[jt,jt,jt],0);
      else plnRec(Q.a,n++,[x,plnLandRibAt(L,x,z)-.03,z],h,((hh>>>3)&255)/255*TAU,1,n,under,2,top);
      if(h>1.2)Q.blots.push([x,z,clamp(h*.45,.6,3.5),.4]);
    }
    Q.parts.push({geo:Q.geo[key],first,count:n-first,tall:sp.h/M});
  }
  if(Q.inst&&Q.cap<n){plnInstFree(Q.inst);Q.inst=null;}
  if(!Q.inst){Q.cap=Math.max(16,n);Q.inst=plnInst(Q.a,n,Q.cap);}
  else plnInstSet(Q.inst,Q.a,n);
  Q.n=n;
  Q.ms+=wallMs()-t0;
  PLN.stat.herbs={n,kinds:Q.parts.length,ms:Math.round(Q.ms)};
  return Q;
}
function plnHerbFrame(L,F,S,p,ex,V){
  const Q=plnHerbs(L,S,p),b=F.blobs;
  if(!Q.inst||!Q.n)return;
  for(const q of Q.parts)F.batches.push({geo:q.geo,inst:Q.inst,first:q.first,count:q.count,kind:PLN_KIND.body,to:q.tall>1.5?PLN_TO.all:PLN_TO.near});
  let n=b[0]|0;
  for(const q of Q.blots)if(n<40&&Math.abs(q[0]-ex)<V.hw*(1+q[1]/V.D)+q[2]){b.set(q,4+n*4);n++;}
  b[0]=n;
}
function plnHerbDrop(L){
  const Q=L.herbs;
  if(!Q)return;
  for(const k in Q.geo)plnGeoFree(Q.geo[k]);
  if(Q.inst)plnInstFree(Q.inst);
  L.herbs=null;
}
