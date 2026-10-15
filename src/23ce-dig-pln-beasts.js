/* ══════════════ рудник на движке: кусачие — звери планеты (M631) ══════════════
   Кто живёт в породе (D.bugs — 23-mode-dig digFauna), того же вида, что ходит наверху (faunaOf), и
   рисуется он той же книжкой тел, что звери поверхности (21pib plnBeastMesh): шесть кадров хода,
   злой, оглушён. В выработке зверь — тело на полу хода, за плоскостью человека; над пустотой (ствол,
   лестница) висит у задней стены. В камне тела не видно: на листе разреза горят два его глаза и идут
   за ним, моргают; у оглушённого — тусклее. Мерка — грызун: чуть больше половины наземного роста.
   Импульс остаётся кольцом поверх кадра (23c dig3Over). ?digbeast=0 — старая плоская кисть. */
const DIG3_BEAST={on:true,k:.55,z:.55,cap:8,geoCap:64,blink:3.7};
try{if(typeof location!=="undefined"&&/[?&]digbeast=0\b/.test(location.search))DIG3_BEAST.on=false;}catch(e){}
const DIG3B={geo:new Map(),gen:-1,inst:[],eyes:null,a:null};

/* книжка того же ключа, что у поверхности: вид, хвост, гребень, голова, сторона манты, кадр */
function dig3BeastGeo(b,k,flip){
  const Q=DIG3B,key=plnBeastSpId(b.sp)+"."+(b.tail?1:0)+(b.crest?1:0)+Math.round((b.headSize||0)*100)+(b.alien==="manta"&&flip?"f":"")+"."+k;
  let g=Q.geo.get(key);
  if(!g){g=plnGeo(plnBeastMesh(b,k,flip));Q.geo.set(key,g);}
  return g;
}
/* глаза в камне: две капли свечения в мерке «радиус зверя = единица», смотрят в объектив */
function dig3EyesMesh(){
  const m=plnMesh(256),cap=DIG3_BEAST.cap;
  for(const s of [-1,1])plnBlob(m,{c:[s*.27,0,0],r:[.13,.1,.06],sub:1,col:[1,.32,.2],mat:PLN_MAT.glow,glow:2.2});
  return {geo:plnGeo(plnMeshDone(m)),inst:plnInst(new Float32Array(16*cap),0,cap),a:new Float32Array(16*cap)};
}
function dig3BeastDrop(){
  const Q=DIG3B;
  for(const g of Q.geo.values())plnGeoFree(g);
  Q.geo.clear();
  for(const I of Q.inst)plnInstFree(I);
  Q.inst=[];
  if(Q.eyes){plnGeoFree(Q.eyes.geo);plnInstFree(Q.eyes.inst);Q.eyes=null;}
}

/* кадр: тела в выработке, глаза на листе; gy — px мира рудника в метры (23c). Отдаёт треугольники */
function dig3BeastFrame(F,Fd,D,gy){
  const K=DIG3_BEAST,Q=DIG3B,list=D.bugs||[];
  if(!K.on||!list.length)return 0;
  /* кэш чистится только в начале кадра: книжки этого кадра уже стоят в списке */
  if(Q.gen!==PLN_GPU.gen||Q.geo.size>K.geoCap){dig3BeastDrop();Q.gen=PLN_GPU.gen;}
  if(!Q.eyes)Q.eyes=dig3EyesMesh();
  const N=PLN_BEAST.N,CM=DIG3_CM,zd=DIG3_ROOM.zd,E=Q.eyes,a=Q.a||(Q.a=new Float32Array(16));
  const px=D.col*DIG_CELL+DIG_CELL/2,py=D.row*DIG_CELL+DIG_CELL/2;
  let ne=0,nb=0,tris=0;
  for(const b of list){
    if(!b||!isFinite(b.x)||!isFinite(b.y))continue;
    const c=Math.floor(b.x/DIG_CELL),r=Math.max(0,Math.floor(b.y/DIG_CELL)),R=plnBeastR(b)*K.k,x=b.x/DIG3_PPM;
    const t=G.t*(b.spd||1)+(b.phase||0),stun=b.stun>0;
    if(!dig3Dug(Fd,c,r)){
      if(ne>=K.cap)continue;
      const bl=!stun&&(((t/K.blink+(b.phase||0))%1)+1)%1<.05;
      plnRec(E.a,ne++,[x,gy(b.y),-.04],bl?1e-4:R*(stun?.6:1),0,1,0);
      continue;
    }
    if(nb>=K.cap)continue;
    /* кадр книжки — как у поверхности: оглушён, идёт, а дошёл — злой */
    const air=b.alien==="jelly"||b.alien==="manta",go=air||(!stun&&(b.flee>0||Math.hypot(px-b.x,py-b.y)>10));
    const w=b.alien?PLN_BEAST.w[b.alien]||2:2,kw=Math.floor((((t*w/TAU)%1)+1)%1*N)%N;
    const k=stun?N+3:(go?kw:N+2),flip=b.face<0,geo=dig3BeastGeo(b,k,flip);
    const floor=!dig3Dug(Fd,c,r+1);
    const y=floor?-(r+1)*CM:gy(b.y)-R,z=floor?DIG3_Z+K.z:zd-R*1.2;
    /* летун висит под сводом хода, ходок покачивается, прыгун скачет */
    const up=b.alien?(b.hover&&!stun?Math.min(CM-2.2*R,b.hover*(1+.16*Math.sin(t*.6))/PLN_M*.5):0)
      :(go?(b.hop?Math.abs(Math.sin(t))*R*.35:Math.sin(t)*R*.08+R*.08):0);
    const yaw=b.alien==="manta"?PLN_BEAST.mantaYaw:PLN_BEAST.yaw;
    const I=Q.inst[nb]||(Q.inst[nb]=plnInst(new Float32Array(16),0,1));
    plnRec(a,0,[x,y+Math.max(0,up),z],R,flip?Math.PI-yaw:yaw,1,nb+1,null,0);
    plnInstSet(I,a,1);
    F.draw.push({geo,inst:I,lamp:true,sun:true,refl:false});
    tris+=geo.n/3;nb++;
  }
  if(ne){plnInstSet(E.inst,E.a,ne);F.draw.push({geo:E.geo,inst:E.inst,lamp:false,sun:false,refl:false});tris+=E.geo.n/3*ne;}
  return tris;
}

/* импульс: кольцо от человека, как у старой кисти (23-mode-dig drawDigFauna) */
function dig3ZapRing(camx,camy){
  const D=G.dig;
  if(!(D.zapT>0))return;
  const px=D.col*DIG_CELL+DIG_CELL/2-camx,py=D.row*DIG_CELL+DIG_CELL/2-camy,k=1-D.zapT/16;
  ctx.strokeStyle="rgba(150,225,255,"+((1-k)*.85).toFixed(2)+")";ctx.lineWidth=3-k*2;
  ctx.beginPath();ctx.arc(px,py,ZAP_R*k,0,TAU);ctx.stroke();
}
