/* ══════════════ планета: растения игры — двенадцать форм (M611) ══════════════
   То, что игра сажает сама (S.plants): виды планеты (floraOf), у каждого своя
   форма из двенадцати, свой рост и свой цвет. Игрок их сканирует, поэтому стоят
   они там же, где стояли, — вдоль линии ходьбы, сразу за тропой, куртиной в
   глубину (pl.z).

   Тело — на вид и на возраст: всход, взрослое, старое. Оно построено в рост
   единицу, в мир его ставит запись: место, рост экземпляра и два цвета листа —
   сухое место и старость меняют цвет, как меняли. Описанное растение уходит в
   бирюзу прибора. Стебель, цветок и кристалл несут свой цвет сами.

   Форма читается силуэтом (M622): у каждой из двенадцати своя анатомия, а не
   палка с шариками. Стеблевой — розетка у комля, листья-блюдца по стеблю и
   свеча бутонов; ветвистый — кустик из шапок с плоским исподом; папоротниковый —
   древовидный: ствол-пень и два яруса вай, молодые свёрнуты крючком; стручковый
   — стручки висят гроздью; друзовый — кристаллы из корки, не из травы; колосовой
   — початки с остью над узкими листьями; ковровый — подушки с дольками по краю;
   грибной — шляпка с кромкой, пластинки исподом, кольцо на ножке, пятна по
   шляпке; спиральный — виток с перьями наружу; зонтичный — мембрана с фестонами
   на рёбрах, у старого второй ярус; шаровой — шары с чашечкой на привязи над
   розеткой; ленточный — ленты крутятся вокруг своего хода. Законы набора те же:
   шапка с плоским исподом, лист лицом к объективу, цвет из записи.

   Краска (M622): лист — зелень мира, три пары по очереди по частоте вида; акцент мира
   (PLN_TINTS[2]) — только цветочным частям цветущих видов: бутонам, стручкам, початкам,
   шарам, шляпке, лентам-лепесткам, кристаллам друзы. Так куртина не уходит в бордовое
   целым растением, а цветёт пятнами; остальные тела — в тоне записи своего вида.

   Здесь же водоросли пруда (waterAlgae): их собирают вплавь. */
const PLN_HERB={z0:1.9,zk:2.6,          /* куртина в глубину: от и на сколько, м */
  tints:[0,3,1],acc:2,                  /* зелень мира (PLN_TINTS) по очереди; acc — пара акцента, цветочным частям */
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
/* лента: та же полоса, но ширина крутится вокруг хода (twist — на сколько радиан к концу):
   свет по ленте идёт волной, и лента читается лентой, а не травинкой */
function plnHerbRibbon(m,root,az,el,len,w,twist,droop,g,wind,cl){
  const ox=Math.cos(az),oz=Math.sin(az),M=cl?PLN_MAT.bark:PLN_MAT.grass,S=10,Sd=[-oz,0,ox];
  let pa=-1,pb=-1,px=0,py=0;
  for(let s=0;s<=S;s++){
    const t=s/S,e=el+droop*t*t;
    if(s){const em=el+droop*(t-.05)*(t-.05);px+=Math.sin(em)*len/S;py+=Math.cos(em)*len/S;}
    const p=[root[0]+ox*px,root[1]+py,root[2]+oz*px],ww=w*(1-.6*t*t)+.004,f=twist*t,cf=Math.cos(f),sf=Math.sin(f);
    const T=[ox*Math.sin(e),Math.cos(e),oz*Math.sin(e)],B=plnCross(T,Sd);
    const wv=[Sd[0]*cf+B[0]*sf,Sd[1]*cf+B[1]*sf,Sd[2]*cf+B[2]*sf];
    let nr=[B[0]*cf-Sd[0]*sf,B[1]*cf-Sd[1]*sf,B[2]*cf-Sd[2]*sf];
    if(nr[2]>0)nr=plnMul(nr,-1);
    nr=plnNorm([nr[0],nr[1]+.3,nr[2]-.2]);
    const col=cl?plnMul(cl,.85+.15*Math.sin(f*2)):[Math.pow(t,.7),g+.07*Math.sin(f*2),0],wd=wind*(root[1]+t)*(root[1]+t);
    const va=plnVert(m,[p[0]+wv[0]*ww,p[1]+wv[1]*ww,p[2]+wv[2]*ww],nr,col,M,wd,0,t),vb=plnVert(m,[p[0]-wv[0]*ww,p[1]-wv[1]*ww,p[2]-wv[2]*ww],nr,col,M,wd,0,t);
    if(s)plnQuad(m,pa,pb,vb,va);
    pa=va;pb=vb;
  }
}
/* лист-блюдце: плоская шапка на конце черешка, наклонена наружу по az и чуть никнет;
   нормали веером от точки под ним — лист ловит свет плоским верхом */
function plnHerbPlate(m,c,pr,az,o){
  plnBlob(m,{c,r:[pr,pr*.2,pr*.78],sub:1,bump:.12,bumpF:3,seed:o.seed||0,lean:-(o.tilt==null?.3:o.tilt)*Math.cos(az),pitch:(o.tilt==null?.3:o.tilt)*Math.sin(az),
    col:plnHerbLeaf(o.g==null?.5:o.g),mat:PLN_MAT.leaf,wind:o.wind==null?.1:o.wind,glow:o.glow||0,nc:[c[0],c[1]-pr*.9,c[2]],ncK:.5});
}
/* кольцо: труба по кругу (чашечка, кольцо на ножке гриба) */
function plnHerbRing(m,c,R,rad,col,mat){
  const path=[];
  for(let i=0;i<=8;i++){const a=i/8*TAU;path.push([c[0]+Math.cos(a)*R,c[1],c[2]+Math.sin(a)*R]);}
  plnTube(m,{path,rad,sides:5,col,mat:mat==null?PLN_MAT.bark:mat,wind:.1});
}
/* висячий стручок: черешок вниз и вытянутое тело, книзу толще */
function plnHerbPod(m,r,c,len,rad,A,C){
  const e=[c[0]+(r()-.5)*.03,c[1]-len*.55,c[2]+(r()-.5)*.03];
  plnTube(m,{path:[c,[c[0],c[1]-len*.12,c[2]]],rad,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:.1});
  plnBlob(m,{c:e,r:[len*.19,len*.46,len*.19],sub:1,box:.8,col:C.pod,mat:PLN_MAT.bark,wind:.12,glow:A.gl,nc:[e[0],e[1]+len*.3,e[2]],ncK:.3});
}

/* Двенадцать форм. m — сетка, r — кости вида, sp — вид, A — возраст {young, old, k, lean, rad, gl, nb, pods,
   facets, blobs, balls, ribbons}, C — цвета вида {stem, leaf, lo, hi, bloom}. Тело в рост единицу;
   что возвращено — макушка, туда ляжет цветок вида */
const PLN_HERB_MAKE=[
  /* 0 стеблевой: розетка у комля, листья-блюдца по стеблю, свеча из трёх бутонов */
  (m,r,sp,A,C)=>{
    const k=A.k,at=plnHerbStem(m,r,sp,{h:.84,lean:A.lean,rad:A.rad*1.1,col:C.stem,foot:1.7}),tip=at(1),nl=5+(r()*3|0),nb=A.nb+3;
    for(let i=0;i<nl;i++)plnHerbBlade(m,[0,.01,0],i/nl*TAU+r()*.5,.75+r()*.35,(.3+r()*.12)*k,.085*k,.4+r()*.4,.46+r()*.1,.08,false);
    for(let i=0;i<nb;i++){
      const t=.22+.5*i/nb,p=at(t),az=i*2.4+r()*.4,len=(.16-.06*i/nb)*k,e=[p[0]+Math.cos(az)*len,p[1]+len*.3,p[2]+Math.sin(az)*len];
      plnTube(m,{path:[p,e],rad:A.rad*.4,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:.1*t});
      plnHerbPlate(m,[e[0]+Math.cos(az)*len*.55,e[1]+.01,e[2]+Math.sin(az)*len*.55],(.14-.04*i/nb)*k,az,{seed:i,g:.5,glow:A.gl*.5});
    }
    for(const i of [-1,0,1]){
      const w=(.085-Math.abs(i)*.02)*k;
      plnBlob(m,{c:[tip[0]+i*.09*k,tip[1]+.09*k-Math.abs(i)*.04*k,tip[2]+(i?.03:-.03)*k],r:[w,.16*k,w],sub:2,lean:-i*.3,col:sp.bloom?plnMul(C.acc,1-Math.abs(i)*.08):plnHerbLeaf(.56-Math.abs(i)*.05),
        mat:C.budM,wind:.12,glow:A.gl});
    }
    return [tip[0],tip[1]+.26*k,tip[2]];
  },
  /* 1 ветвистый: кустик — короткий толстый ствол, ветви вразлёт, на каждой шапка, крона сверху */
  (m,r,sp,A,C)=>{
    const k=A.k,at=plnHerbStem(m,r,sp,{h:.55,lean:A.lean,rad:A.rad*1.4,col:C.stem,foot:1.8}),tip=at(1),n=A.nb+1;
    for(let i=0;i<n;i++){
      const t=.3+.6*(i+r()*.5)/n,e=plnHerbBranch(m,at(t),.55+r()*.5,i*2.4+r()*.6,(sp.branchLen+.14)*(.8+r()*.5)*k,A.rad*.65,C.stem),pr=(.15+r()*.07)*k*(1-.25*t);
      plnFloraCap(m,[e[0],e[1]+pr*.25,e[2]],pr,pr*.72,{sub:1,bump:.25,seed:i+3,yaw:r()*TAU,col:plnHerbLeaf(.46+r()*.08),wind:.1,nc:[e[0],e[1]-pr*.5,e[2]]});
    }
    plnFloraCap(m,[tip[0],tip[1]+.1*k,tip[2]],.24*k,.19*k,{sub:2,bump:.22,seed:1,col:plnHerbLeaf(.53),wind:.12,nc:[tip[0],tip[1]-.12*k,tip[2]]});
    return [tip[0],tip[1]+.3*k,tip[2]];
  },
  /* 2 папоротниковый: древовидный — ствол-пень и вайи двумя ярусами, молодые свёрнуты крючком */
  (m,r,sp,A,C)=>{
    const k=A.k,at=plnHerbStem(m,r,sp,{h:.38,lean:A.lean*.5,rad:A.rad*1.6,col:C.stem,foot:1.5}),n=A.nb+5,top=at(1);
    for(let i=0;i<n;i++){
      const lo=i<n*.55,az=i*2.4+r()*.5,el=lo?.95+r()*.3:.35+r()*.35,len=(lo?.62:.5)*(1+r()*.25)*k;
      plnHerbBlade(m,at(lo?.9:1),az,el,len,(.1+r()*.03)*k,lo?.9+r()*.4:.4+r()*.3,.47+(r()-.5)*.12,.1,true);
    }
    for(let i=0;i<2;i++){
      const a=r()*TAU,dx=Math.cos(a),dz=Math.sin(a);
      plnTube(m,{path:plnBez(top,[top[0]+dx*.02*k,top[1]+.15*k,top[2]+dz*.02*k],[top[0]+dx*.08*k,top[1]+.1*k,top[2]+dz*.08*k],5),rad:t=>.014*k*(1-t*.5),sides:4,
        col:plnMul(C.stem,1.25),mat:PLN_MAT.bark,wind:.1});
    }
    return [top[0],top[1]+.52*k,top[2]];
  },
  /* 3 стручковый: по ветвям листья-блюдца и пары стручков, на макушке гроздь */
  (m,r,sp,A,C)=>{
    const k=A.k,at=plnHerbStem(m,r,sp,{h:.84,lean:A.lean,rad:A.rad,col:C.stem,foot:1.5}),tip=at(1);
    for(let i=0;i<A.nb;i++){
      const az=r()*TAU,e=plnHerbBranch(m,at(.3+r()*.5),.7+r()*.5,az,(sp.branchLen+.1)*(.8+r()*.5)*k,A.rad*.55,C.stem);
      plnHerbPlate(m,[e[0],e[1]+.02,e[2]],.1*k,az,{seed:i,g:.48,tilt:.2});
      for(let j=0;j<2;j++)plnHerbPod(m,r,[e[0]+(j-.5)*.05*k,e[1]-.01,e[2]+(j-.5)*.03*k],(.2+r()*.08)*k,A.rad*.4,A,C);
    }
    for(let i=0;i<A.pods;i++){
      const a=(i-(A.pods-1)/2)*.5,e=[tip[0]+Math.sin(a)*.1*k,tip[1]+.03+Math.cos(a)*.05*k,tip[2]+(r()-.5)*.06*k];
      plnTube(m,{path:[tip,e],rad:A.rad*.35,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:.12});
      plnHerbPod(m,r,e,(.22+r()*.08)*k,A.rad*.4,A,C);
    }
    return [tip[0],tip[1]+.1,tip[2]];
  },
  /* 4 друзовый: корка у основания, из неё гранёные кристаллы, мелочь по краю */
  (m,r,sp,A,C)=>{
    const gl=sp.glow?.7:.16;
    plnBlob(m,{c:[0,.02,0],r:[.42,.09,.34],sub:1,bump:.35,bumpF:2,seed:3,cut:-.03,col:plnMul(C.lo,.8),mat:PLN_MAT.rock});
    for(let i=0;i<A.facets;i++){
      const a=(i/Math.max(1,A.facets-1)-.5)*1.7+(r()-.5)*.25,len=i?.5+r()*.45:1,w=(.07+r()*.06)*A.k,z=(r()-.5)*.35,x=Math.sin(a)*.12;
      plnThingPrism(m,[x,0,z],[x+Math.sin(a)*len*.7,Math.cos(a*.8)*len,z+(r()-.5)*.25],w,6,C.lo,C.hi,gl);
    }
    for(let i=0;i<5;i++){
      const a=r()*TAU,d=.25+r()*.15,x=Math.cos(a)*d,z=Math.sin(a)*d*.8;
      plnThingPrism(m,[x,0,z],[x+(r()-.5)*.1,.1+r()*.12,z+(r()-.5)*.1],.03*A.k,5,C.lo,C.hi,gl);
    }
    return null;
  },
  /* 5 колосовой: пучок стеблей, на каждом початок с остью; у корня узкие длинные листья */
  (m,r,sp,A,C)=>{
    const n=clamp(A.pods,2,5),k=A.k;
    let top=null;
    for(let i=0;i<n;i++){
      const a=r()*TAU,l=i?.2+r()*.3:A.lean,h=i?.68+r()*.22:.9,at=plnHerbStem(m,r,sp,{h,lean:l*Math.cos(a),rad:A.rad*.6,col:C.stem}),tip=at(1),eh=.17*k*(h/.9);
      plnBlob(m,{c:[tip[0],tip[1]-eh*.45,tip[2]],r:[.05*k,eh,.05*k],sub:2,box:.72,bump:.08,bumpF:6,seed:i,col:C.ear,mat:PLN_MAT.bark,wind:.12,glow:A.gl,
        nc:[tip[0],tip[1]-eh*.45,tip[2]],ncK:.2});
      plnTube(m,{path:[[tip[0],tip[1]+eh*.5,tip[2]],[tip[0]+(r()-.5)*.02,tip[1]+eh*.5+.06*k,tip[2]]],rad:.004,sides:3,col:plnMul(C.stem,1.3),mat:PLN_MAT.bark,wind:.14});
      if(!i)top=[tip[0],tip[1]+eh*.5+.07*k,tip[2]];
    }
    for(let i=0;i<5;i++)plnHerbBlade(m,[(r()-.5)*.06,0,(r()-.5)*.06],r()*TAU,.5+r()*.5,(.45+r()*.3)*k,.04*k,.5+r()*.5,.46+r()*.1,.12,false);
    return top;
  },
  /* 6 ковровый: низкие подушки с дольками по краю, без стебля; подушки — в метрах, не в долях роста:
     вид ростом в полметра иначе тонет в траве (hs) */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.blobs;i++){
      const hs=Math.max(.6,A.h)/A.h,x=((i-(A.blobs-1)/2)*.8+(r()-.5)*.3)*hs,rr=(.5+r()*.5)*hs,z=(r()-.5)*1.1*hs,g=.46+r()*.1;
      plnFloraCap(m,[x,rr*.15,z],rr,rr*.8,{sub:2,bump:.3,bumpF:2.6,seed:i+2,yaw:r()*TAU,col:plnHerbLeaf(g),wind:.02,nc:[x,-rr*.3,z]});
      for(let j=0;j<3;j++){
        const a=r()*TAU,x2=x+Math.cos(a)*rr*.75,z2=z+Math.sin(a)*rr*.6,r2=rr*(.3+r()*.25);
        plnFloraCap(m,[x2,r2*.15,z2],r2,r2*.9,{sub:1,bump:.3,seed:i*7+j,yaw:r()*TAU,col:plnHerbLeaf(g+.03),wind:.02,nc:[x2,-r2*.3,z2]});
      }
      if(sp.bloom&&!A.young)for(let j=0;j<7;j++){
        const a=r()*TAU,d=r()*rr*.6;
        plnBlob(m,{c:[x+Math.cos(a)*d,rr*.15+rr*.75*Math.sqrt(Math.max(0,1-d*d/(rr*rr)))+.03,z+Math.sin(a)*d],r:[.08,.06,.08],sub:0,col:C.acc,mat:PLN_MAT.bark,glow:.25});
      }
    }
    return null;
  },
  /* 7 грибной: толстая ножка с кольцом, шляпка с толстой кромкой, пластинки исподом, пятна по шляпке */
  (m,r,sp,A,C)=>{
    const k=A.k,sr=Math.max(.05,A.rad*1.6),at=plnHerbStem(m,r,sp,{h:.86,lean:A.lean*.5,rad:sr,col:plnMix3(C.stem,[.75,.72,.62],.4),foot:1.5}),tip=at(1);
    const pr=clamp(sp.cap*.6*k,.26,.8),ph=.3*Math.sqrt(k),cy=tip[1]+ph*.1,M=PLN_MAT.bark,cc=C.cap,gc=plnMix3(cc,[1,.97,.85],.7);
    /* шляпка — своим цветом, не листвой: плотное тело, купол с плоским исподом */
    plnBlob(m,{c:[tip[0],cy,tip[2]],r:[pr,ph,pr],sub:3,bump:.1,bumpF:1.8,seed:5,cut:-.22*ph,col:(u,p,n)=>plnMul(cc,.86+.14*plnSmooth(-.3,.6,n[1])),mat:M,wind:.1,
      nc:[tip[0],tip[1]-pr*.6,tip[2]],ncK:.35});
    /* кромка: валик по краю шляпки */
    plnHerbRing(m,[tip[0],cy-ph*.16,tip[2]],pr*.9,ph*.08,plnMul(cc,.7),M);
    /* пластинки: диск исподом вниз, светлее шляпки, полосами по кругу */
    const NA=32,gy=cy-ph*.22-.006,cen=plnVert(m,[tip[0],gy,tip[2]],[0,-1,0],plnMul(gc,.9),M,.1,0,0),ids=[];
    for(let i=0;i<=NA;i++){
      const a=i/NA*TAU,rr=pr*.92;
      ids.push(plnVert(m,[tip[0]+Math.cos(a)*rr,gy+.008,tip[2]+Math.sin(a)*rr],plnNorm([Math.cos(a)*.35,-1,Math.sin(a)*.35]),plnMul(gc,(i&1)?1:.8),M,.1,0,0));
    }
    for(let i=0;i<NA;i++)plnTri(m,cen,ids[i+1],ids[i]);
    for(let i=0;i<5;i++){
      const a=r()*TAU,d=(.15+r()*.55)*pr,y=ph*Math.sqrt(Math.max(.02,1-d*d/(pr*pr)));
      plnBlob(m,{c:[tip[0]+Math.cos(a)*d,cy+y*.97,tip[2]+Math.sin(a)*d],r:[pr*.1,pr*.03,pr*.1],sub:1,col:plnMix3(cc,[1,1,1],.55),mat:M,wind:.1});
    }
    const rc=at(.76);
    plnHerbRing(m,rc,sr*1.3,sr*.35,plnMix3(C.stem,[.75,.72,.62],.55));
    if(sp.glow&&!A.young)plnBlob(m,{c:[tip[0],gy-.01,tip[2]],r:[pr*.8,.015,pr*.8],sub:2,col:C.hi,mat:PLN_MAT.glow,wind:.1,glow:.9});
    return null;
  },
  /* 8 спиральный: толстый виток, по внешней кромке перья наружу, на макушке почка */
  (m,r,sp,A,C)=>{
    const k=A.k,N=48,path=[],R0=.3,P=t=>{const a=t*sp.turns*TAU,rr=R0*(1-t*.6);return [Math.sin(a)*rr+A.lean*t,t,Math.cos(a)*rr*.8];};
    for(let i=0;i<=N;i++)path.push(P(i/N));
    plnTube(m,{path,rad:t=>lerp(Math.max(.03,A.rad*1.5),.015,t),sides:7,col:t=>plnMul(C.stem,lerp(.7,1.1,t)),mat:PLN_MAT.bark,wind:t=>t*t*.1});
    for(let i=0;i<9;i++){
      const t=.2+i/9*.75,q=P(t),a=t*sp.turns*TAU;
      plnHerbBlade(m,q,Math.atan2(Math.cos(a)*.8,Math.sin(a)),1.25,(.42-.16*t)*k,(.1-.03*t)*k,.5+r()*.4,.5+(r()-.5)*.1,.1*t,false);
    }
    const top=P(1);
    plnBlob(m,{c:[top[0],top[1]+.03*k,top[2]],r:[.05*k,.07*k,.05*k],sub:1,col:sp.bloom?C.acc:plnHerbLeaf(.56),mat:C.budM,wind:.12,glow:A.gl});
    return [top[0],top[1]+.1*k,top[2]];
  },
  /* 9 зонтичный: ножка и мембрана с фестонами на рёбрах; мембрана просвечивает; у старого второй ярус */
  (m,r,sp,A,C)=>{
    const k=A.k,at=plnHerbStem(m,r,sp,{h:.97,lean:A.lean,rad:A.rad*.8,col:C.stem,foot:1.3}),tip=at(1),cw=clamp(.42*sp.cap*k,.18,.55),NR=sp.ribs,NA=NR*6,NJ=4;
    const gl=sp.glow?.35:.1;
    const memb=(c,w,dip)=>{
      const ids=[];
      for(let j=0;j<=NJ;j++)for(let i=0;i<=NA;i++){
        const a=i/NA*TAU,t=j/NJ,sc=1-(1-Math.cos(a*NR))*.5*.1*t*t,rr=w*t*sc,y=c[1]+.03-dip*t*t-(1-Math.cos(a*NR))*.5*.07*w*t*t;
        ids.push(plnVert(m,[c[0]+Math.cos(a)*rr,y,c[2]+Math.sin(a)*rr],plnNorm([Math.cos(a)*t*.9,1,Math.sin(a)*t*.9]),[lerp(1,.3,t),.5+.06*Math.cos(a*NR),0],PLN_MAT.leaf,.12,gl,0));
      }
      for(let j=0;j<NJ;j++)for(let i=0;i<NA;i++){const o=j*(NA+1)+i;plnQuad(m,ids[o],ids[o+1],ids[o+NA+2],ids[o+NA+1]);}
      for(let i=0;i<NR;i++){
        const a=i/NR*TAU;
        plnTube(m,{path:[[c[0],c[1]+.035,c[2]],[c[0]+Math.cos(a)*w*.6,c[1]+.03-dip*.36,c[2]+Math.sin(a)*w*.6],[c[0]+Math.cos(a)*w,c[1]+.03-dip,c[2]+Math.sin(a)*w]],
          rad:.01,sides:4,col:plnMul(C.stem,.7),mat:PLN_MAT.bark,wind:.12});
      }
    };
    memb(tip,cw,.2);
    if(A.old)memb(at(.6),cw*.55,.11);
    plnBlob(m,{c:[tip[0],tip[1]+.06,tip[2]],r:[.03,.04,.03],sub:1,col:sp.bloom?C.acc:plnHerbLeaf(.56),mat:C.budM,wind:.12,glow:gl});
    return null;
  },
  /* 10 шаровой: шары с чашечкой на привязи, под ними розетка */
  (m,r,sp,A,C)=>{
    const k=A.k,gl=sp.glow?.5:.1;
    for(let i=0;i<A.balls;i++){
      const bx=(i-(A.balls-1)/2)*.34+A.lean,br=(.15+((i*37)%5)/5*.09)*k,by=1-br-((i*23)%4)/4*.16,bz=(r()-.5)*.3;
      plnTube(m,{path:plnBez([bx*.3,0,bz*.3],[bx*.75,by*.45,bz*.7],[bx,by-br*.9,bz],6),rad:.009,sides:4,col:C.stem,mat:PLN_MAT.bark,wind:t=>t*t*.2});
      plnBlob(m,{c:[bx,by,bz],r:[br,br*1.15,br],sub:2,bump:.06,bumpF:5,seed:i,col:sp.bloom?(u,p,n)=>plnMul(C.acc,.8+.2*Math.cos(u[1]*9)):(u,p,n)=>[plnSmooth(-.4,.5,n[1]),.5+.08*Math.cos(u[1]*9),0],mat:C.budM,wind:.2,glow:gl,
        nc:[bx,by-br*.5,bz],ncK:.3});
      plnBlob(m,{c:[bx,by-br*1.05,bz],r:[br*.3,br*.18,br*.3],sub:1,col:C.stem,mat:PLN_MAT.bark,wind:.2});
    }
    for(let i=0;i<4;i++)plnHerbBlade(m,[0,0,0],r()*TAU,.9+r()*.3,.3*k,.05*k,.5,.48,.08,false);
    return null;
  },
  /* 11 ленточный: широкие ленты от корня, каждая крутится вокруг своего хода */
  (m,r,sp,A,C)=>{
    for(let i=0;i<A.ribbons;i++){
      const w=(.07+((i*29)%5)/5*.05)*A.k,hh=.55+((i*41)%6)/6*.45;
      plnHerbRibbon(m,[(r()-.5)*.1,0,(r()-.5)*.1],r()*TAU,.15+r()*.35,hh,w,(r()-.5)*2.4,.3+r()*.5,i&1?.54:.44,.22,sp.bloom&&(i&1)?C.acc:null);
    }
    if(sp.glow&&!A.young)plnBlob(m,{c:[0,.06,0],r:[.22,.04,.18],sub:1,col:C.hi,mat:PLN_MAT.glow,glow:.7});
    return null;
  }];

/* тело вида sp в возрасте ac: 0 — всход, 1 — взрослое, 2 — старое */
function plnHerbMesh(sp,si,ac,T){
  const m=plnMesh(4096),r=rng(plnThingSeed(sp.name||"")+si*131+ac*17),young=ac===0,old=ac===2;
  const cnt=(v,k)=>Math.max(1,Math.round(v*k));
  /* литеральные цвета тела — в тоне записи (T: краска мира для вида), чтобы зелень не горела; акцент — пара мира */
  T=T||plnHerbTone(PLN_TINTS[PLN_HERB.tints[si%3]],sp.leaf);
  const leaf=T.top,AC=PLN_TINTS[PLN_HERB.acc],acc=plnMix3(AC.top,plnHerbSoft(plnRgb(sp.leaf),.6),.15),accD=AC.under,bl=!!sp.bloom;
  const stem=plnMix3(plnHerbSoft(plnRgb(sp.stem),.4),PLN_HERB.bark,.5);
  /* толщина ствола в долях роста: ствол вида wK единиц при росте h */
  const A={young,old,h:sp.h/PLN_M,k:old?1.15:(young?.8:1),lean:(r()-.5)*.24+(old?.1:0),rad:clamp(sp.wK*1.1/Math.max(20,sp.h)*.5,.012,.05),gl:sp.glow&&!young?.45:0,
    nb:young?Math.max(0,sp.nb-2):sp.nb,pods:cnt(sp.pods,young?.5:(old?1.2:1)),facets:cnt(sp.facets,young?.6:1),blobs:cnt(sp.blobs,young?.55:(old?1.15:1)),
    balls:young?1:sp.balls,ribbons:cnt(sp.ribbons,young?.6:1)};
  const C={stem,leaf,acc,accD,lo:bl?accD:plnMix3(T.under,leaf,.3),hi:plnMix3(bl?acc:leaf,[1,1,1],.25),bloom:PLN_FL.bloom[si%5]||plnRgb([255,225,140]),
    pod:bl?acc:plnMix3(leaf,stem,.35),ear:bl?acc:plnMix3(leaf,[.86,.76,.46],.5),cap:plnMul(plnMix3(bl?acc:leaf,[.6,.34,.16],bl?.4:.6),.85),budM:bl?PLN_MAT.bark:PLN_MAT.leaf};
  const tip=PLN_HERB_MAKE[sp.kind%12](m,r,sp,A,C);
  if(plantStemForm(sp.kind)&&!young){
    /* шипы по стволу и сухие ветви у старого: возраст читается силуэтом */
    if(sp.spiny)for(let i=0;i<8;i++){
      const y=.12+i*.085,a=i*2.4;
      plnTube(m,{path:[[0,y,0],[Math.cos(a)*.06,y+.03,Math.sin(a)*.06]],rad:t=>lerp(.008,.001,t),sides:4,col:plnMul(stem,1.3),mat:PLN_MAT.bark});
    }
    /* сухая ветвь растёт из ствола, а не над кроной (у папоротника ствол — пень на трети роста), коротка
       и никнет, с отростком: торчащая вверх прямая палка читалась мусором */
    if(old){
      const sh=[.84,.55,.38,.84,0,.68][sp.kind%12]||.5,dry=plnRgb([122,106,84]);
      for(let i=0;i<2+(r()<.5?1:0);i++){
        const az=r()*TAU,cx=Math.cos(az),cz=Math.sin(az)*.8,len=Math.min(.3,sp.branchLen*.8+.1)*(.8+r()*.4),a=[0,sh*(.3+r()*.45),0];
        const e=[a[0]+cx*len,a[1]-len*.32,a[2]+cz*len],mid=[a[0]+cx*len*.5,a[1]+len*.06,a[2]+cz*len*.5];
        plnTube(m,{path:plnBez(a,mid,e,4),rad:t=>lerp(A.rad*.45,A.rad*.15,t),sides:4,col:dry,mat:PLN_MAT.bark,wind:.04});
        const f=plnBez(a,mid,e,4)[2],fz=az+(r()<.5?.7:-.7);
        plnTube(m,{path:[f,[f[0]+Math.cos(fz)*len*.35,f[1]+len*.05,f[2]+Math.sin(fz)*len*.28]],rad:A.rad*.15,sides:3,col:dry,mat:PLN_MAT.bark,wind:.04});
      }
    }
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
  const sps=floraOf(p),by={};
  let n=0;
  for(const q of list){
    if(!q||!isFinite(q.x)||!q.sp)continue;
    const x=q.x/M;
    if(lake&&x>lake.x0&&x<lake.x1)continue;
    const si=Math.max(0,sps.indexOf(q.sp)),key=si*3+(q.age<.3?0:(q.age>.82?2:1));
    (by[key]=by[key]||[]).push(q);
    n++;
  }
  /* краска вида: зелень мира по номеру вида — та же, что у диких куртин (21pgd); акцент — цветочным частям */
  const tint=sps.map((s,i)=>PLN_HERB.tints[i%3]);
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
/* ── водоросли пруда (M327): их собирают вплавь ──
   Куст поднялся со дна и вышел из воды: пучок стеблей, макушка у каждого завита улиткой и светла —
   её и видно с берега; по воде от куста лежат ленты. Стоит куст сразу за линией, по которой
   плывут: человек проходит перед ним. Снятый куст из кадра уходит */
function plnHerbAlgaMesh(k){
  const m=plnMesh(4096),r=rng(7600+k),n=5+(k%3),dark=plnRgb([50,116,70]),lite=plnRgb([186,224,112]);
  for(let i=0;i<n;i++){
    const az=(i+r()*.6)/n*TAU,ox=Math.cos(az),oz=Math.sin(az)*.55,rad=.08+r()*.3,h=.3+r()*.55,R0=.15+r()*.07,path=[],n1=16;
    for(let s=0;s<6;s++){const t=s/6,b=R0*.6*(1-t)*(1-t);path.push([ox*(rad-b),-.7+(h+.7)*t,oz*(rad-b)]);}
    for(let s=0;s<=n1;s++){
      const f=s/n1*2.7*Math.PI,R=R0*(1-.78*s/n1);
      path.push([ox*(rad+R0-R*Math.cos(f)),h+R*Math.sin(f),oz*(rad+R0-R*Math.cos(f))]);
    }
    plnTube(m,{path,rad:t=>lerp(.05,.068,plnSmooth(.25,.6,t))*(1-.35*plnSmooth(.8,1,t)),sides:6,
      col:t=>plnMix3(dark,lite,plnSmooth(.15,.75,t)),mat:PLN_MAT.bark,wind:t=>.06*t*t,x:.2});
  }
  for(let i=0;i<4;i++){
    const len=.7+r()*.5,w=.1+r()*.04,bend=(r()-.5)*1.4,S=5;
    let a=r()*TAU,x=Math.cos(a)*.15,z=Math.sin(a)*.15,pa=-1,pb=-1;
    for(let s=0;s<=S;s++){
      const t=s/S,ww=w*Math.sin(Math.PI*Math.pow(t,.7))+.012,nx=-Math.sin(a),nz=Math.cos(a),c=plnMix3(dark,lite,.2+.35*t);
      const va=plnVert(m,[x+nx*ww,.03,z+nz*ww],[0,1,0],c,PLN_MAT.leaf,0,0,t),vb=plnVert(m,[x-nx*ww,.03,z-nz*ww],[0,1,0],c,PLN_MAT.leaf,0,0,t);
      if(s)plnQuad(m,pa,pb,vb,va);
      pa=va;pb=vb;
      a+=bend/S;x+=Math.cos(a)*len/S;z+=Math.sin(a)*len/S*.55;
    }
  }
  return m;
}
function plnHerbAlgae(L,F,S,p){
  const Wt=L.lake?waterOf(S.tr,p):null;
  if(!Wt)return;
  const list=waterAlgae(Wt);
  let Q=L.algae,sig=1;
  for(let i=0;i<list.length;i++)if(!list[i].taken)sig+=2<<i;
  if(Q&&Q.gen!==PLN_GPU.gen){plnInstFree(Q.inst);for(const g of Q.geo)plnGeoFree(g);Q=null;}
  if(!Q)Q=L.algae={gen:PLN_GPU.gen,geo:[0,1,2].map(k=>plnGeo(plnHerbAlgaMesh(k))),a:new Float32Array(16*8),inst:null,parts:[],sig:-1};
  if(Q.sig!==sig){
    Q.sig=sig;Q.parts.length=0;
    let n=0;
    for(let k=0;k<3;k++){
      const first=n;
      for(let i=k;i<list.length&&n<8;i+=3){
        const a=list[i];
        /* кусты стоят не в ряд: кто за линией, по которой плывут, кто перед ней */
        const u=(a.ph*7.13)%1,z=u<.3?-.5-u*3:.5+(u-.3)*2.6;
        if(!a.taken)plnRec(Q.a,n++,[a.x/PLN_M,L.lake.level,z],clamp(a.h/18,.7,1.3),a.ph,1,n,null,0);
      }
      if(n>first)Q.parts.push({geo:Q.geo[k],first,count:n-first});
    }
    if(!Q.inst)Q.inst=plnInst(Q.a,n,8);
    else plnInstSet(Q.inst,Q.a,n);
  }
  for(const q of Q.parts)F.batches.push({geo:q.geo,inst:Q.inst,first:q.first,count:q.count,kind:PLN_KIND.body,to:PLN_TO.near});
}
function plnHerbFrame(L,F,S,p,ex,V){
  const Q=plnHerbs(L,S,p),b=F.blobs;
  plnHerbAlgae(L,F,S,p);
  if(!Q.inst||!Q.n)return;
  for(const q of Q.parts)F.batches.push({geo:q.geo,inst:Q.inst,first:q.first,count:q.count,kind:PLN_KIND.body,to:q.tall>1.5?PLN_TO.all:PLN_TO.near});
  let n=b[0]|0;
  for(const q of Q.blots)if(n<40&&Math.abs(q[0]-ex)<V.hw*(1+q[1]/V.D)+q[2]){b.set(q,4+n*4);n++;}
  b[0]=n;
}
function plnHerbDrop(L){
  const Q=L.herbs,A=L.algae;
  if(A){for(const g of A.geo)plnGeoFree(g);plnInstFree(A.inst);L.algae=null;}
  if(!Q)return;
  for(const k in Q.geo)plnGeoFree(Q.geo[k]);
  if(Q.inst)plnInstFree(Q.inst);
  L.herbs=null;
}
