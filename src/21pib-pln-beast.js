/* ══════════════ планета: звери игры (M611) ══════════════
   Те, кто бродит по планете (S.fauna): виды этой планеты (faunaOf), земные
   формы и пять чужих — медуза, ходун, кристаллическое, манта, панцирный.
   Игрок их сканирует и ловит, поэтому ходят они там же, где ходили, — вдоль
   линии ходьбы, сразу за тропой: мелкие ближе, крупные дальше.

   Тело — на вид, в мерке «радиус зверя = единица», лицом в +x. Шаг — перекидная
   книжка: шесть тел на круг хода и седьмое — стоит. Кто идёт, тот листает
   книжку по своим часам (те же G.t, b.spd и b.phase, что у старой рисовалки);
   кто стоит — стоит, а не перебирает ногами на месте. Медуза и манта висят и
   листают всегда. Панцирный, пока стоит, лежит камнем: ноги и голова убраны.

   Записи пишутся каждый кадр: зверей на планете два десятка. Это заготовки
   первого этапа; свой проход по фауне — M625. */
const PLN_BEAST={N:6,cap:48,
  yaw:.3,                               /* зверь идёт вдоль тропы, а стоит к объективу в три четверти */
  mantaYaw:1.0,roll:.2,dive:.42,        /* манта висит носом к объективу и вниз: крылья — вдоль кадра, спина видна */
  w:{jelly:1.6,strider:1.4,crystal:1.8,manta:1.5,shell:1.6}};  /* частота хода формы; у земных — 2 */

/* Рост зверя на вид, в метрах. Мелкий в кадре с деревьями в десять метров терялся в траве, поэтому
   он крупнее своей мерки; большой — как есть. Игра меряет зверя по месту, а не по росту */
function plnBeastR(b){return b.r*lerp(1.7,1,plnSmooth(3,12,b.r))/PLN_M;}
/* на какой глубине ходит: мелкие — по дальнему краю тропы, где земля голая, крупные — за ней */
function plnBeastZ(b){
  const h=(((b.phase||0)*7.31)%1+1)%1;
  return b.r<7?.5+h*.5:1.3+h*1.5;
}
/* Шкура в свету сцены: тон тот же, светлота поднята. Свет идёт из-за сцены, зверь стоит к объективу
   теневым боком, и тёмный мех читался чёрным пятном без ног и головы */
function plnBeastFur(c){
  const l=Math.max(c[0],c[1],c[2],1)/255,k=(.42+.45*l)/l;
  return plnHerbSoft(plnRgb([Math.min(255,c[0]*k),Math.min(255,c[1]*k),Math.min(255,c[2]*k)]),.1);
}
/* Наклон тела вокруг точки на высоте cy: roll — крен (дальнее крыло вверх), dive — нос вниз.
   Объектив смотрит почти вровень с землёй, и спину висящему зверю надо к нему повернуть */
function plnBeastTilt(m,cy,roll,dive){
  const v=m.v,c=Math.cos(roll),s=Math.sin(roll),cd=Math.cos(dive),sd=Math.sin(dive);
  for(let i=0;i<m.nv;i++){
    const o=i*PLN_VS;
    for(const k of [0,3]){
      const x=v[o+k],y=v[o+k+1]-(k?0:cy),z=v[o+k+2],y1=y*c+z*s,z1=z*c-y*s;
      v[o+k]=x*cd+y1*sd;v[o+k+1]=(k?0:cy)+y1*cd-x*sd;v[o+k+2]=z1;
    }
  }
}
function plnBeastEyes(m,b,p,rad,dz){
  const c=plnHex(b.eye||"#101820");
  for(const s of [-1,1])plnBlob(m,{c:[p[0],p[1],s*dz],r:[rad,rad,rad],sub:1,col:c,mat:PLN_MAT.man,x:.9,glow:c[0]>.5?.25:0});
}
/* k — кадр книжки: 0…N−1 идёт, N — стоит; flip — зверь идёт влево (крен манты смотрит в другую сторону) */
function plnBeastMesh(b,k,flip){
  const N=PLN_BEAST.N,m=plnMesh(2048),B=PLN_MAT.beast,walk=k<N,t2=walk?k/N*TAU:0,sw=walk?1:0,sd=((b.seed|0)>>>0)%89;
  const c=plnBeastFur(b.body),col=q=>plnMul(c,q),gl=b.glow?.35:0;
  const shade=(lo,hi)=>u=>plnMul(c,lerp(lo,hi,plnSmooth(-.7,.6,u[1])));
  if(b.alien==="jelly"){
    /* купол с плоским исподом: сжался — потянулся вверх */
    const puls=.82+.18*Math.sin(t2),bw=1.25*puls,bh=.95/puls,cy=.9;
    plnBlob(m,{c:[0,cy,0],r:[bw,bh,bw],sub:2,cut:-.05,col:(u,p,n)=>plnMul(c,lerp(.75,1.5,plnSmooth(-.2,.9,n[1]))),mat:B,glow:.3,nc:[0,cy-.6,0],ncK:.3});
    for(let i=0;i<b.tent;i++){
      const a=i/b.tent*TAU+.4,rr=.62*bw,L=1.2+Math.abs(Math.cos(a))*.6,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
      plnTube(m,{path:plnBez([x,cy-.02,z],[x+Math.sin(t2+i)*.25,cy-L*.55,z+Math.cos(t2+i*1.3)*.15],[x+Math.sin(t2+i*1.7)*.45,cy-L,z+Math.cos(t2+i)*.25],5),
        rad:t=>lerp(.075,.02,t),sides:5,col:t=>plnMul(c,lerp(1.1,.8,t)),mat:B,glow:.2});
    }
  }else if(b.alien==="strider"){
    /* тело висит вверху на шести дугах, колени выше спины */
    const cy=2.2;
    for(let i=0;i<6;i++){
      const side=i<3?-1:1,px=(i%3-1)*.55,ph=t2+i*2.1,step=sw*Math.sin(ph)*.5,lift=sw*Math.max(0,Math.cos(ph))*.3;
      plnTube(m,{path:plnBez([px,cy,side*.3],[px+step*.3,cy+1.3,side*1.5],[px+step,lift,side*.95],7),rad:t=>lerp(.085,.04,t),sides:5,col:col(.65),mat:B,cap:true});
    }
    plnBlob(m,{c:[0,cy,0],r:[.95,.5,.62],sub:2,bump:.1,seed:sd,col:shade(.7,1.1),mat:B,glow:gl});
    plnTube(m,{path:plnBez([.7,cy+.2,0],[1.5,cy+.9,0],[1.7,cy+1.5,0],5),rad:t=>lerp(.1,.065,t),sides:6,col:col(.7),mat:B});
    plnBlob(m,{c:[1.75,cy+1.65,0],r:[.34,.26,.26],sub:1,col:col(1.05),mat:B,glow:gl});
    plnBeastEyes(m,b,[1.92,cy+1.7,0],.07,.2);
  }else if(b.alien==="crystal"){
    /* гранёное тело, по спине светится шов; ноги — иглы */
    const cy=1.15;
    for(let i=0;i<6;i++){
      const side=i<3?-1:1,px=(i%3-1)*.5,ph=t2+i,step=sw*Math.sin(ph)*.3,lift=sw*Math.max(0,Math.cos(ph))*.2;
      plnTube(m,{path:[[px,cy-.3,side*.4],[px+step*.5,cy-.1,side*1.0],[px+step,lift,side*.85]],rad:t=>lerp(.055,.012,t),sides:4,col:col(.6),mat:PLN_MAT.rock,cap:true});
    }
    plnBlob(m,{c:[0,cy,0],r:[1.2,.62,.75],sub:1,box:.55,yaw:.3,seed:sd,col:(u,p,n)=>plnMul(c,lerp(.8,1.5,plnSmooth(-.5,.8,n[1]+n[0]*.4))),mat:PLN_MAT.rock,glow:.12});
    /* по спине — друза: от камня его отличает силуэт, а не цвет */
    const rc=rng(plnThingSeed(b.name||"")+5),hi=plnMix3(c,[1,1,1],.55),nf=clamp(b.facets||6,5,8);
    for(let i=0;i<nf;i++){
      const u=i/(nf-1),px=lerp(.85,-1.0,u),h=(.75+rc()*.7)*(1-.5*Math.abs(u-.45)),back=.25+u*.7+rc()*.2,sz=(rc()-.5)*.7;
      plnThingPrism(m,[px,cy+.3,sz*.5],[px-Math.sin(back)*h,cy+.3+Math.cos(back)*h,sz],.13+rc()*.07,5,c,hi,.3,.2);
    }
    for(const s of [-1,1])plnTube(m,{path:[[-1.05,cy+.2,s*.6],[0,cy+.3,s*.78],[1.05,cy+.22,s*.62]],rad:.05,sides:4,col:plnMul(c,1.8),mat:PLN_MAT.glow,glow:1.6});
    plnBeastEyes(m,b,[1.05,cy+.15,0],.07,.3);
  }else if(b.alien==="manta"){
    /* крыло идёт волной от корня к концу */
    const cy=.9,S=b.span||2,NS=7,NC=3;
    for(const side of [-1,1]){
      const ids=[];
      for(let j=0;j<=NS;j++)for(let i=0;i<=NC;i++){
        const v=j/NS,q=i/NC,x0=lerp(-.5,-.75,v),x1=lerp(.6,-.2,v*v),x=lerp(x0,x1,q)*(1-.25*v);
        const y=cy+Math.sin(t2+v*1.7+(side>0?0:.9))*.55*v*(.5+.5*v)+.06*Math.sin(q*Math.PI);
        ids.push(plnVert(m,[x,y,side*(.2+v*S)],plnNorm([0,1,-.15*side]),plnMul(c,lerp(1.05,.55,v)*lerp(.85,1.1,q)),B,0,gl,0));
      }
      for(let j=0;j<NS;j++)for(let i=0;i<NC;i++){
        const o=j*(NC+1)+i;
        plnQuad(m,ids[o],ids[o+1],ids[o+NC+2],ids[o+NC+1]);
      }
    }
    plnBlob(m,{c:[.05,cy,0],r:[.66,.3,.42],sub:2,col:shade(.75,1.15),mat:B,glow:gl});
    plnTube(m,{path:plnBez([-.55,cy,0],[-1.3,cy-.1,0],[-2.1,cy+Math.sin(t2)*.3,0],6),rad:t=>lerp(.065,.012,t),sides:5,col:col(.7),mat:B});
    plnBeastEyes(m,b,[.56,cy+.1,0],.06,.24);
    plnBeastTilt(m,cy,flip?-PLN_BEAST.roll:PLN_BEAST.roll,PLN_BEAST.dive);
  }else if(b.alien==="shell"){
    /* купол-камень: пока стоит — лежит на земле, пошёл — поднялся на ногах и высунул голову */
    const cy=walk?.62:.22;
    if(walk){
      for(let i=0;i<4;i++){
        const px=((i>>1)-.5)*1.15,s=i&1?1:-1,ph=t2+i*1.6,step=Math.sin(ph)*.22,lift=Math.max(0,Math.cos(ph))*.1;
        plnTube(m,{path:[[px,cy-.05,s*.6],[px+step,lift,s*.68]],rad:t=>lerp(.17,.13,t),sides:6,col:col(.5),mat:B,cap:true});
      }
      plnBlob(m,{c:[1.15,cy+.02,0],r:[.32,.22,.24],sub:1,col:col(.9),mat:B});
      plnBeastEyes(m,b,[1.32,cy+.08,0],.055,.16);
    }
    plnBlob(m,{c:[0,cy,0],r:[1.15,.85,1.0],sub:3,box:.9,bump:.1,bumpF:1.5,seed:sd,cut:-.14,
      col:(u,p,n)=>{
        const q=Math.acos(clamp(u[1],-1,1))/(Math.PI/2)*3.5,rib=plnSmooth(.06,.12,Math.abs(q-Math.round(q)));
        return plnMul(c,lerp(.55,1.35,plnSmooth(-.3,.8,u[1]))*lerp(.55,1,rib));
      },mat:PLN_MAT.rock,glow:gl});
  }else{
    /* земные: туловище, голова, ноги парами, хвост, гребень, уши */
    const bx=b.bx||1,by=b.by||1,bz=Math.min(bx,by)*.78,cy=.9,hs=b.headSize||.6,hx=b.headX||.95,hy=cy+.3*by;
    const np=b.legs<=2?(b.shape===3?1:2):Math.round(b.legs/2);
    for(let i=0;i<np;i++){
      const u=np>1?(i/(np-1)-.5)*1.7:0;
      for(const s of [-1,1]){
        const ph=t2+i*1.9+(s>0?Math.PI:0),step=sw*Math.sin(ph)*.3,lift=sw*Math.max(0,Math.cos(ph))*.12;
        plnTube(m,{path:[[u*.8*bx,cy-.3*by,s*bz*.5],[u*.85*bx+step*.4,cy*.45,s*bz*.62],[u*.9*bx+step,lift,s*bz*.62]],rad:t=>lerp(.14,.085,t),sides:5,
          col:col(.55),mat:B,cap:true});
      }
    }
    if(b.tail){
      const wag=sw*Math.sin(t2)*.3;
      plnTube(m,{path:plnBez([-.8*bx,cy+.1,0],[-1.7*bx,cy+.5+wag,wag*.4],[-1.9*bx,cy-.2,wag],5),rad:t=>lerp(.12,.04,t),sides:5,col:col(.7),mat:B,cap:true});
    }
    plnBlob(m,{c:[0,cy,0],r:[bx,by,bz],sub:2,box:.84,bump:.12,bumpF:1.8,seed:sd,
      col:(u,p)=>plnMul(c,lerp(.62,1.12,plnSmooth(-.7,.6,u[1]))*(b.spots&&plnNoise(u[0]*4+1.3,u[2]*4+u[1]*3,sd)>.45?1.4:1)),mat:B,glow:gl});
    if(b.crest)plnBlob(m,{c:[0,cy+by*1.02,0],r:[.36,by*.5,.06],sub:1,box:.6,col:col(1.3),mat:B});
    plnBlob(m,{c:[hx,hy,0],r:[hs,hs,hs*.92],sub:2,col:shade(.8,1.1),mat:B,glow:gl});
    if(b.ears)for(const s of [-1,1])plnBlob(m,{c:[hx-hs*.1,hy+hs*.9,s*hs*.5],r:[.1,.34,.16],sub:1,pitch:-s*.4,col:col(.8),mat:B});
    plnBeastEyes(m,b,[hx+hs*.72,hy+hs*.12,0],hs*.22,hs*.58);
  }
  return m;
}

function plnBeastFrame(L,F,S,p,ex,V){
  const list=S.fauna||[];
  if(!list.length)return;
  let Q=L.beasts;
  if(Q&&Q.gen!==PLN_GPU.gen){plnBeastDrop(L);Q=null;}
  if(!Q)Q=L.beasts={gen:PLN_GPU.gen,geo:{},inst:null,a:new Float32Array(16*PLN_BEAST.cap),ms:0};
  const t0=wallMs(),M=PLN_M,N=PLN_BEAST.N,sps=faunaOf(p),by={},bl=F.blobs;
  for(const b of list){
    if(!b||!isFinite(b.x)||b.caught)continue;
    const x=b.x/M,z=plnBeastZ(b);
    if(Math.abs(x-ex)>V.hw*(1+z/V.D)+5)continue;
    const t=G.t*b.spd+b.phase,air=b.alien==="jelly"||b.alien==="manta",go=air||Math.abs(b.vx)>.02;
    const w=b.alien?PLN_BEAST.w[b.alien]||2:2,k=go?Math.floor((((t*w/TAU)%1)+1)%1*N)%N:N;
    /* всход — тот же вид без хвоста и гребня и с большой головой: у него своя книжка */
    const key=Math.max(0,sps.indexOf(b.sp))+"."+(b.tail?1:0)+(b.crest?1:0)+Math.round((b.headSize||0)*100)+(b.alien==="manta"&&b.face<0?"f":"")+"."+k;
    (by[key]=by[key]||[]).push({b,x,z,t,go});
  }
  if(!Q.inst)Q.inst=plnInst(Q.a,0,PLN_BEAST.cap);
  let n=0,nb=bl[0]|0;
  for(const key in by){
    const first=n;
    for(const q of by[key]){
      if(n>=PLN_BEAST.cap)break;
      const b=q.b,R=plnBeastR(b),t=q.t;
      if(!Q.geo[key])Q.geo[key]=plnGeo(plnBeastMesh(b,+key.slice(key.lastIndexOf(".")+1),b.face<0));
      const up=b.alien?(b.hover?b.hover*(1+.16*Math.sin(t*.6))/M:0):(q.go?(b.hop?Math.abs(Math.sin(t))*R*.35:Math.sin(t)*R*.08+R*.08):0);
      const yaw=b.alien==="manta"?PLN_BEAST.mantaYaw:PLN_BEAST.yaw;
      plnRec(Q.a,n++,[q.x,plnLandRibAt(L,q.x,q.z)+up,q.z],R,b.face<0?Math.PI-yaw:yaw,1,n,b.scanned?[.72,1.08,1.04]:null,0);
      if(nb<64){bl.set([q.x,q.z,R*(b.alien==="manta"?1.6:1.3),up>R?.2:.4],4+nb*4);nb++;}
    }
    if(n>first)F.batches.push({geo:Q.geo[key],inst:Q.inst,first,count:n-first,kind:PLN_KIND.body,to:PLN_TO.near});
  }
  bl[0]=nb;
  plnInstSet(Q.inst,Q.a,n);
  Q.ms+=wallMs()-t0;
  PLN.stat.beasts={n,books:Object.keys(Q.geo).length,ms:Math.round(Q.ms)};
}
function plnBeastDrop(L){
  const Q=L.beasts;
  if(!Q)return;
  for(const k in Q.geo)plnGeoFree(Q.geo[k]);
  if(Q.inst)plnInstFree(Q.inst);
  L.beasts=null;
}
