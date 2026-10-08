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

   Записи пишутся каждый кадр: зверей на планете два десятка. Земные анатомии и
   закон ноги — 21piba (M625); книжка: шесть кадров хода, стоит, пасётся, злой,
   оглушён (PLN_BEAST.poses); b.pose — кадр, заданный снаружи (стенд beast.py). */
const PLN_BEAST={N:6,cap:64,poses:["stand","graze","hostile","stun"],
  far:140,farGap:220,farK:1.6,flockH:24,   /* дальняя полоса: z стада, м; разрыв круга; рост; высота стайки */
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
  const l=Math.max(c[0],c[1],c[2],1)/255,k=(.5+.4*l)/l;
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
function plnBeastEyes(m,b,p,rad,dz,hot,dim){
  const c=hot?[1,.32,.2]:plnHex(b.eye||"#101820"),rd=hot?rad*1.35:rad;   /* злой глаз крупнее — ночью читается первым (M625) */
  for(const s of [-1,1])plnBlob(m,{c:[p[0],p[1],s*dz],r:[rd,dim?rd*.4:rd,rd],sub:1,col:c,mat:PLN_MAT.man,x:.9,glow:hot?.9:(c[0]>.5?.25:0)});
}
/* k — кадр книжки: 0…N−1 идёт, N — стоит; flip — зверь идёт влево (крен манты смотрит в другую сторону) */
function plnBeastMesh(b,k,flip){
  const N=PLN_BEAST.N,m=plnMesh(2048),B=PLN_MAT.beast,walk=k<N,t2=walk?k/N*TAU:0,sw=walk?1:0,sd=((b.seed|0)>>>0)%89,pose=walk?"walk":PLN_BEAST.poses[k-N]||"stand";
  const c=plnBeastFur(b.body),col=q=>plnMul(c,q),gl=b.glow?.35:0;
  const shade=(lo,hi)=>u=>plnMul(c,lerp(lo,hi,plnSmooth(-.7,.6,u[1])));
  const hostile=pose==="hostile",graze=pose==="graze",stun=pose==="stun";
  if(b.alien==="jelly"){
    /* купол с плоским исподом: сжался — потянулся вверх. Злой — расплющился, раскинул щупальца и зажёг
       два красных пятна; пасётся — щупальца длиннее, к земле; оглушён — блином на земле, щупальца врозь */
    const puls=stun?1:.82+.18*Math.sin(t2),bw=1.25*puls*(hostile?1.15:1)*(stun?1.25:1),bh=.95/puls*(hostile?.8:1)*(stun?.4:1),cy=stun?.34:.9,sx=hostile?1.6:1;
    plnBlob(m,{c:[0,cy,0],r:[bw,bh,bw],sub:2,cut:-.05,col:(u,p,n)=>plnMul(c,lerp(.75,1.5,plnSmooth(-.2,.9,n[1]))),mat:B,glow:hostile?.6:.3,nc:[0,cy-.6,0],ncK:.3});
    for(let i=0;i<b.tent;i++){
      const a=i/b.tent*TAU+.4,rr=.62*bw,L=(1.2+Math.abs(Math.cos(a))*.6)*(graze?1.4:1)*(hostile?1.25:1),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
      const path=stun?plnBez([x,cy-.1,z],[x*2,.1,z*2],[x*3.2,.04,z*3.2],5)
        :plnBez([x,cy-.02,z],[x*sx+Math.sin(t2+i)*.25,cy-L*.55,z*sx+Math.cos(t2+i*1.3)*.15],[x*sx*1.4+Math.sin(t2+i*1.7)*.45,cy-L,z*sx*1.4+Math.cos(t2+i)*.25],5);
      plnTube(m,{path,rad:t=>lerp(.075,.02,t),sides:5,col:t=>plnMul(c,lerp(1.1,.8,t)),mat:B,glow:.2});
    }
    if(hostile)plnBeastEyes(m,b,[bw*.55,cy+bh*.1,0],.09,.3,true);
  }else if(b.alien==="strider"){
    /* тело висит вверху на шести дугах, колени выше спины; злой — присел, расставил ноги и вытянул шею
       вперёд; пасётся — шея к земле */
    const cy=hostile?1.6:2.2,sp=hostile?1.3:1;
    for(let i=0;i<6;i++){
      const side=i<3?-1:1,px=(i%3-1)*.55,ph=t2+i*2.1,step=sw*Math.sin(ph)*.5,lift=sw*Math.max(0,Math.cos(ph))*.3;
      plnTube(m,{path:plnBez([px,cy,side*.3],[px+step*.3,cy+1.3,side*1.5*sp],[px+step,lift,side*.95*sp],7),rad:t=>lerp(.085,.04,t),sides:5,col:col(.65),mat:B,cap:true});
    }
    plnBlob(m,{c:[0,cy,0],r:[.95,.5,.62],sub:2,bump:.1,seed:sd,col:shade(.7,1.1),mat:B,glow:gl});
    const hp=graze?[1.9,.32,0]:(hostile?[2.3,cy-.3,0]:[1.75,cy+1.65,0]),n1=graze?[1.6,cy-.5,0]:(hostile?[1.6,cy+.3,0]:[1.5,cy+.9,0]);
    plnTube(m,{path:plnBez([.7,cy+.2,0],n1,[hp[0]-.1,hp[1]+(graze?.05:-.1),0],5),rad:t=>lerp(.1,.065,t),sides:6,col:col(.7),mat:B});
    plnBlob(m,{c:hp,r:[.34,.26,.26],sub:1,col:col(1.05),mat:B,glow:gl});
    plnBeastEyes(m,b,[hp[0]+.17,hp[1]+.05,0],.07,.2,hostile);
    if(stun)plnBeastLay(m);
  }else if(b.alien==="crystal"){
    /* гранёное тело, по спине светится шов; ноги — иглы. Злой — привстал, друза выше, шов горит;
       пасётся — лёг на брюхо */
    const cy=hostile?1.35:(graze?.8:1.15),sp=hostile?1.2:1;
    for(let i=0;i<6;i++){
      const side=i<3?-1:1,px=(i%3-1)*.5,ph=t2+i,step=sw*Math.sin(ph)*.3,lift=sw*Math.max(0,Math.cos(ph))*.2;
      plnTube(m,{path:[[px,cy-.3,side*.4],[px+step*.5,cy-.1,side*1.0*sp],[px+step,lift,side*.85*sp]],rad:t=>lerp(.055,.012,t),sides:4,col:col(.6),mat:PLN_MAT.rock,cap:true});
    }
    plnBlob(m,{c:[0,cy,0],r:[1.2,.62,.75],sub:1,box:.55,yaw:.3,seed:sd,col:(u,p,n)=>plnMul(c,lerp(.8,1.5,plnSmooth(-.5,.8,n[1]+n[0]*.4))),mat:PLN_MAT.rock,glow:.12});
    /* по спине — друза: от камня его отличает силуэт, а не цвет */
    const rc=rng(plnThingSeed(b.name||"")+5),hi=plnMix3(c,[1,1,1],.55),nf=clamp(b.facets||6,5,8),hk=hostile?1.3:1;
    for(let i=0;i<nf;i++){
      const u=i/(nf-1),px=lerp(.85,-1.0,u),h=(.75+rc()*.7)*(1-.5*Math.abs(u-.45))*hk,back=.25+u*.7+rc()*.2,sz=(rc()-.5)*.7;
      plnThingPrism(m,[px,cy+.3,sz*.5],[px-Math.sin(back)*h,cy+.3+Math.cos(back)*h,sz],.13+rc()*.07,5,c,hi,.3,.2);
    }
    for(const s of [-1,1])plnTube(m,{path:[[-1.05,cy+.2,s*.6],[0,cy+.3,s*.78],[1.05,cy+.22,s*.62]],rad:.05,sides:4,col:plnMul(c,hostile?2.4:1.8),mat:PLN_MAT.glow,glow:hostile?3:1.6});
    plnBeastEyes(m,b,[1.05,cy+.15,0],.07,.3,hostile);
    if(stun)plnBeastLay(m);
  }else if(b.alien==="manta"){
    /* крыло идёт волной от корня к концу; злой — глаза горят, нос круче вниз; оглушён — лежит на земле,
       крылья обвисли */
    const cy=stun?.3:.9,S=b.span||2,NS=7,NC=3;
    for(const side of [-1,1]){
      const ids=[];
      for(let j=0;j<=NS;j++)for(let i=0;i<=NC;i++){
        const v=j/NS,q=i/NC,x0=lerp(-.5,-.75,v),x1=lerp(.6,-.2,v*v),x=lerp(x0,x1,q)*(1-.25*v);
        const y=cy+(stun?-.3*v:Math.sin(t2+v*1.7+(side>0?0:.9))*.55*v*(.5+.5*v))+.06*Math.sin(q*Math.PI);
        /* крыло выгнуто по хорде (M631): нормаль катится от заднего края к переднему, свет фонаря ложится
           градиентом, не ровной заливкой; спина темнее у корня и к концу, передняя кромка светлее — обвод */
        ids.push(plnVert(m,[x,y,side*(.2+v*S)],plnNorm([(q-.5)*1.5,1,-.15*side-.5*side*v]),plnMul(c,lerp(1.05,.45,v)*lerp(.55,1.15,q*q)*(i===NC?1.3:1)),B,0,gl,0));
      }
      for(let j=0;j<NS;j++)for(let i=0;i<NC;i++){
        const o=j*(NC+1)+i;
        plnQuad(m,ids[o],ids[o+1],ids[o+NC+2],ids[o+NC+1]);
      }
    }
    plnBlob(m,{c:[.05,cy,0],r:[.66,.3,.42],sub:2,col:shade(.75,1.15),mat:B,glow:gl});
    plnTube(m,{path:plnBez([-.55,cy,0],[-1.3,cy-.1,0],[-2.1,cy+(stun?-.2:Math.sin(t2)*.3),0],6),rad:t=>lerp(.065,.012,t),sides:5,col:col(.7),mat:B});
    plnBeastEyes(m,b,[.56,cy+.1,0],.06,.24,hostile);
    if(!stun)plnBeastTilt(m,cy,flip?-PLN_BEAST.roll:PLN_BEAST.roll,PLN_BEAST.dive*(hostile?1.8:1));
  }else if(b.alien==="shell"){
    /* купол-камень: пока стоит — лежит на земле, пошёл — поднялся на ногах и высунул голову. Злой —
       стоит на ногах, голова наружу дальше, глаза горят; пасётся — лежит, голова наружу у земли;
       оглушён — перевёрнут на спину, ноги и голова кверху */
    const up=walk||hostile||stun,cy=up?.62:.22;
    if(up){
      for(let i=0;i<4;i++){
        const px=((i>>1)-.5)*1.15,s=i&1?1:-1,ph=t2+i*1.6,step=Math.sin(ph)*.22,lift=Math.max(0,Math.cos(ph))*.1;
        plnTube(m,{path:[[px,cy-.05,s*.6],[px+step,lift,s*.68]],rad:t=>lerp(.17,.13,t),sides:6,col:col(.5),mat:B,cap:true});
      }
    }
    if(up||graze){
      const hx=hostile?1.35:1.15,hy=graze?.16:cy+.02;
      plnTube(m,{path:[[.8,cy-.02,0],[hx-.2,hy,0]],rad:t=>lerp(.22,.17,t),sides:6,col:col(.8),mat:B});
      plnBlob(m,{c:[hx,hy,0],r:[.32,.22,.24],sub:1,col:col(.9),mat:B});
      plnBeastEyes(m,b,[hx+.17,hy+.06,0],.055,.16,hostile);
    }
    plnBlob(m,{c:[0,cy,0],r:[1.15,.85,1.0],sub:3,box:.9,bump:.1,bumpF:1.5,seed:sd,cut:-.14,
      col:(u,p,n)=>{
        const q=Math.acos(clamp(u[1],-1,1))/(Math.PI/2)*3.5,rib=plnSmooth(.06,.12,Math.abs(q-Math.round(q)));
        return plnMul(c,lerp(.55,1.35,plnSmooth(-.3,.8,u[1]))*lerp(.55,1,rib));
      },mat:PLN_MAT.rock,glow:gl});
    if(stun)plnBeastLay(m,Math.PI);
  }else plnBeastEarth(m,b,pose,t2,sw,c,sd,gl);
  return m;
}

function plnBeastFrame(L,F,S,p,ex,V){
  const list=S.fauna||[];
  if(!list.length)return;
  let Q=L.beasts;
  if(Q&&(Q.gen!==PLN_GPU.gen||Q.nGeo>96)){plnBeastDrop(L);Q=null;}
  if(!Q)Q=L.beasts={gen:PLN_GPU.gen,geo:{},nGeo:0,inst:null,a:new Float32Array(16*PLN_BEAST.cap),ms:0,far:null};
  const t0=wallMs(),M=PLN_M,N=PLN_BEAST.N,sps=faunaOf(p),by={},byF={},bl=F.blobs;
  /* всход — тот же вид без хвоста и гребня и с большой головой: у него своя книжка */
  const keyOf=(b,flip,k)=>plnBeastSpId(b.sp)+"."+(b.tail?1:0)+(b.crest?1:0)+Math.round((b.headSize||0)*100)+(b.alien==="manta"&&flip?"f":"")+"."+k;
  for(const b of list){
    if(!b||!isFinite(b.x)||b.caught)continue;
    const x=b.x/M,z=plnBeastZ(b);
    if(Math.abs(x-ex)>V.hw*(1+z/V.D)+5)continue;
    const t=G.t*b.spd+b.phase,air=b.alien==="jelly"||b.alien==="manta",go=air||Math.abs(b.vx)>.02;
    const w=b.alien?PLN_BEAST.w[b.alien]||2:2,kw=Math.floor((((t*w/TAU)%1)+1)%1*N)%N;
    /* кадр: задан снаружи, оглушён, злой, идёт, стоит — а стоя время от времени пасётся, каждый в свой час */
    const k=b.pose!=null?b.pose:((b.stun>0||b.stunT>0)?N+3:(b.hostile?N+2:(go?kw:(Math.sin(t*.37+b.phase*3)>.35?N+1:N))));
    const key=keyOf(b,b.face<0,k);
    (by[key]=by[key]||[]).push({b,x,z,t,go,k});
  }
  /* дальняя полоса: стадо из трёх идёт в одну сторону — знак зверя раньше встречи (§11.6); летучий вид —
     стайка в небе. Книжки те же, что у ближних; рост в полтора, как у дальних куртин. Стадо ходит по
     кругу шире кадра и в кадр попадает не всегда */
  if(!Q.far||Q.far.sps!==sps)Q.far=plnBeastFarKit(sps);
  const fz=PLN_BEAST.far,wy=PLN_LAND.wRel,hwF=V.hw*(1+fz/V.D),W=2*hwF+PLN_BEAST.farGap;
  const dbg=Q.dbg={hwF:Math.round(hwF),W:Math.round(W),g:[]};   /* полоса в числах — для стенда и лаборатории */
  for(const g of Q.far.groups){
    const drift=(((G.t*g.v+g.x0)%W)+W)%W-W/2,gd={air:g.air,dir:g.dir,drift:Math.round(drift),vis:0,off:0,water:0,az:0};
    dbg.g.push(gd);
    for(let i=0;i<g.list.length;i++){
      const b=g.list[i],o=g.off[i],x=ex+g.dir*(drift+o[0]),z=fz+o[1];
      if(Math.abs(x-ex)>hwF+8){gd.off++;continue;}
      let y=plnLandFarH(L,x,z);
      if(g.air)y+=PLN_BEAST.flockH+o[2]+Math.sin(G.t*.4+i)*1.2;
      else{
        if(y<wy+.5){gd.water++;continue;}
        y-=.1;
        const az=Math.atan2(x-L.cx0,z+50);
        if(Math.exp(-Math.pow((az-PLN_AZ_ELEV)/.075,2))>.25){gd.az++;continue;}
      }
      gd.vis++;
      const t=G.t*b.spd+b.phase,w=b.alien?PLN_BEAST.w[b.alien]||2:2,k=Math.floor((((t*w/TAU)%1)+1)%1*N)%N,key=keyOf(b,g.dir<0,k);
      (byF[key]=byF[key]||[]).push({b,x,y,z,k});
    }
  }
  if(!Q.inst)Q.inst=plnInst(Q.a,0,PLN_BEAST.cap);
  let n=0,nb=bl[0]|0;
  const geoOf=(key,b,flip,k)=>{if(!Q.geo[key]){Q.geo[key]=plnGeo(plnBeastMesh(b,k,flip));Q.nGeo++;}return Q.geo[key];};
  for(const key in by){
    const first=n;let geo=null;
    for(const q of by[key]){
      if(n>=PLN_BEAST.cap)break;
      const b=q.b,R=plnBeastR(b),t=q.t,k=q.k;
      geo=geoOf(key,b,b.face<0,k);
      /* высота: летун висит, пасясь — опускается, оглушённый лёг; ходок покачивается, прыгун скачет */
      const up=b.alien?(b.hover&&k!==N+3?b.hover*(k===N+1?.35:1)*(1+.16*Math.sin(t*.6))/M:0):(q.go?(b.hop?Math.abs(Math.sin(t))*R*.35:Math.sin(t)*R*.08+R*.08):0);
      const yaw=b.alien==="manta"?PLN_BEAST.mantaYaw:PLN_BEAST.yaw;
      plnRec(Q.a,n++,[q.x,plnLandRibAt(L,q.x,q.z)+up,q.z],R,b.face<0?Math.PI-yaw:yaw,1,n,b.scanned?[.72,1.08,1.04]:null,0);
      if(nb<64){bl.set([q.x,q.z,R*(b.alien==="manta"?1.6:1.3),up>R?.2:.4],4+nb*4);nb++;}
    }
    if(n>first)F.batches.push({geo,inst:Q.inst,first,count:n-first,kind:PLN_KIND.body,to:PLN_TO.near});
  }
  const nNear=n,TOF=PLN_TO.main|PLN_TO.mirror|PLN_TO.sh1;
  for(const key in byF){
    const first=n;let geo=null;
    for(const q of byF[key]){
      if(n>=PLN_BEAST.cap)break;
      const b=q.b,yaw=b.alien==="manta"?PLN_BEAST.mantaYaw:PLN_BEAST.yaw;
      geo=geoOf(key,b,b.face<0,q.k);
      plnRec(Q.a,n++,[q.x,q.y,q.z],plnBeastR(b)*PLN_BEAST.farK,b.face<0?Math.PI-yaw:yaw,1,n,null,0);
    }
    if(n>first)F.batches.push({geo,inst:Q.inst,first,count:n-first,kind:PLN_KIND.body,to:TOF});
  }
  bl[0]=nb;
  plnInstSet(Q.inst,Q.a,n);
  Q.ms+=wallMs()-t0;
  PLN.stat.beasts={n:nNear,far:n-nNear,books:Object.keys(Q.geo).length,ms:Math.round(Q.ms),dbg:Q.dbg};
}
/* дальние группы по видам планеты: стадо из трёх наземных (стайный вид, иначе первый) и стайка из
   пяти летучих. Экземпляры взрослые — книжки общие с ближними; сторона хода — по виду */
function plnBeastFarKit(sps){
  const groups=[],ground=sps.filter(s=>!s.hover),air=sps.filter(s=>s.hover);
  const mk=(sp,n,v,isAir)=>{
    const id=plnBeastSpId(sp),r=rng(id*131+7),dir=(id&1)?1:-1,list=[],off=[];
    for(let i=0;i<n;i++){
      const b=specimenBeast(r,sp,0,0);
      b.r=sp.r0;b.tail=sp.tail;b.crest=sp.crest;b.headSize=sp.headSize;b.age=.5;b.face=dir;b.hover=0;b.vx=.1*dir;
      list.push(b);
      off.push(isAir?[(i-(n-1)/2)*4.5+(r()-.5)*2,(r()-.5)*12,i*1.6+(r()-.5)*2]:[(i-1)*7+(r()-.5)*3,(r()-.5)*14,0]);
    }
    groups.push({sp,list,off,dir,v,x0:r()*400,air:isAir});
  };
  const gs=ground.find(s=>s.herd)||ground[0];
  if(gs)mk(gs,3,.9,false);
  if(air[0])mk(air[0],5,2.4,true);
  return {sps,groups};
}
function plnBeastDrop(L){
  const Q=L.beasts;
  if(!Q)return;
  for(const k in Q.geo)plnGeoFree(Q.geo[k]);
  if(Q.inst)plnInstFree(Q.inst);
  L.beasts=null;
}
