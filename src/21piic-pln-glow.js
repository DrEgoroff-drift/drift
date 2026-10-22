/* ══════════════ планета: свет, который помнит, — телами (plnOverOld, пункт 4, 22.10) ══════════════
   Уезд света (11i, M137) рисовал поверх кадра две вещи: лампы площадки (glowDrawPad) и пятна по формам на
   планете ядра (glowDrawPatches). Теперь это тела на земле движка, правила 11i те же:

   1. Лампа площадки — банка со мхом на колышке, кольцом вокруг плиты (под кораблём и у трапа не ставят).
      Днём мох в банке тусклый, зелёный — лампа видна как вещь; ночью светит холодным светом мха.
      Ближняя к объективу банка ночью — настоящая лампа в общем выборе своих ламп (21pig).
   2. Пятна ядра — три на мир, от зерна (glowPatches): колея (две пунктирные нитки), след машины
      (корпус и два колеса), фундамент (прямоугольник с перемычкой). Лежат НА грунте — сбоку лежащее
      видно ракурсом объектива, — тем же светом, что мат, и только ночью. Подписей нет (правило 1 11i). */
const GLW={it:null,gen:-1,L:null,key:""};

/* полоса света по грунту от (x0,z0) до (x1,z1): карточки по полметра, на высоте земли; o — якорь части
   (запись стоит в якоре: движок отбирает записи по месту, и сетка в мировых метрах при записи в нуле
   выпадала из кадра целиком) */
function plnGlwStrip(m,L,a,b,w,col,o){
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5)),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,
    nx=-dz/l*w/2,nz=dx/l*w/2,y=(x,z)=>plnLandRibAt(L,x,z)+.06-o[1],P=(x,z)=>[x-o[0],y(x,z),z-o[2]];
  for(let i=0;i<n;i++){const u=i/n,v=(i+1)/n,x0=a[0]+dx*u,z0=a[1]+dz*u,x1=a[0]+dx*v,z1=a[1]+dz*v;
    plnCard(m,P(x0-nx,z0-nz),P(x0+nx,z0+nz),P(x1+nx,z1+nz),P(x1-nx,z1-nz),[0,1,0],col,PLN_MAT.glow,null,1.6,1);}
}
function plnGlwDash(m,L,a,b,w,on,off,col,o){
  const l=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let s=0;s<l;s+=on+off){const e=Math.min(l,s+on),u=s/l,v=e/l;
    plnGlwStrip(m,L,[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v],w,col,o);}
}
function plnGlwRing(m,L,c,r,w,col,o){
  for(let k=0;k<14;k++){const a0=k/14*TAU,a1=(k+1)/14*TAU;
    plnGlwStrip(m,L,[c[0]+Math.cos(a0)*r,c[1]+Math.sin(a0)*r],[c[0]+Math.cos(a1)*r,c[1]+Math.sin(a1)*r],w,col,o);}
}
/* части: банки площадки (тело и мох) и по пятну на каждую форму; у каждой — якорь и полуширина */
function plnGlwMesh(L,tr,p,core){
  const C=GLOW_LAMP,MAN=PLN_MAT.man,parts=[],lamps=[];
  if(glowDepthHere()&&tr.padX!=null){
    const Q=PLN_LPAD,px=tr.padX/PLN_M,pz=(L.shipZ||7)+Q.dz,yaw=L.shipYaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw),
      o=[px,plnLandRibAt(L,px,pz),pz],m=plnMesh(1<<12),lm=plnMesh(1<<10);
    for(let k=0;k<6;k++){const a=k/6*TAU,lx=Math.cos(a)*(Q.hx+1.2),lz=Math.sin(a)*(Q.hz+1),wx=px+lx*cs+lz*sn,wz=pz+lz*cs-lx*sn,
      x=wx-o[0],z=wz-o[2],y=plnLandRibAt(L,wx,wz)-o[1];
      plnTube(m,{path:[[x,y-.2,z],[x,y+.8,z]],rad:.035,sides:5,col:[.23,.19,.14],mat:MAN,cap:true});
      /* банка — стекло: видно сам мох; у неё только тёмное донце и светлая крышка */
      plnTube(m,{path:[[x,y+.78,z],[x,y+.84,z]],rad:.14,sides:8,col:[.08,.1,.1],mat:MAN,cap:true});
      plnTube(m,{path:[[x,y+1.1,z],[x,y+1.15,z]],rad:.145,sides:8,col:[.62,.66,.64],mat:MAN,cap:true});
      plnBlob(lm,{c:[x,y+.97,z],r:[.14,.13,.14],sub:1,bump:.3,seed:k,col:C,mat:PLN_MAT.glow,glow:2,x:1});
      lamps.push([wx,o[1]+y+.95,wz]);}
    parts.push({k:"body",o,hw:Q.hx+2,m},{k:"moss",o,hw:Q.hx+2,m:lm});
  }
  if(core){const cc=plnMix3(C,[1,1,1],.1);
    for(const q of glowPatches(tr,p)){const x=q.x/PLN_M,w=q.w/PLN_M,o=[x,plnLandRibAt(L,x,5.5),0],pm=plnMesh(1<<12);
      if(q.k==="rut"){for(const z of [4.4,5.7])plnGlwDash(pm,L,[x-w,z],[x+w,z],.22,.46,.38,cc,o);}
      else if(q.k==="machine"){const z=6.2,hw=w*.3,d=1.3+q.s*.6;
        for(const s of [-1,1]){plnGlwStrip(pm,L,[x-hw,z+s*d],[x+hw,z+s*d],.14,cc,o);plnGlwStrip(pm,L,[x+s*hw,z-d],[x+s*hw,z+d],.14,cc,o);}
        plnGlwStrip(pm,L,[x+hw*.25,z-d],[x+hw*.25,z+d],.12,cc,o);
        for(const s of [-1,1])plnGlwRing(pm,L,[x+s*hw*.6,z-d-.45],.42,.12,cc,o);}
      else{const z=6.4,hw=w*.35,d=1.6+q.s*1.2;
        for(const s of [-1,1]){plnGlwStrip(pm,L,[x-hw,z+s*d],[x+hw,z+s*d],.16,cc,o);plnGlwStrip(pm,L,[x+s*hw,z-d],[x+s*hw,z+d],.16,cc,o);}
        plnGlwStrip(pm,L,[x-hw,z],[x+hw,z],.13,cc,o);}
      parts.push({k:"patch",o,hw:w+1,m:pm});}}
  return {parts,lamps};
}
function plnGlwFree(){
  const it=GLW.it;if(!it)return;
  for(const q of it.parts)if(q.geo)plnGeoFree(q.geo);
  if(it.inst)plnInstFree(it.inst);
  GLW.it=null;
}
function plnGlwStep(L,S){
  if(GLW.gen!==PLN_GPU.gen||GLW.L!==L){plnGlwFree();GLW.gen=PLN_GPU.gen;GLW.L=L;}
  const tr=S.tr,p=S.p,dep=OWN.on&&typeof glowDepthHere==="function"?glowDepthHere():0,core=!!(OWN.on&&typeof glowIsCore==="function"&&glowIsCore(p));
  if(!dep&&!core){plnGlwFree();return;}
  const key=[dep,core,tr.padX,L.shipYaw||0].join("|");
  if(GLW.it&&GLW.it.key===key)return;
  plnGlwFree();
  const M=plnGlwMesh(L,tr,p,core),parts=[];
  for(const q of M.parts)if(q.m.nv)parts.push({k:q.k,o:q.o,hw:q.hw,geo:plnGeo(plnMeshDone(q.m))});
  const it={key,parts,lamps:M.lamps,a:new Float32Array(16*Math.max(1,parts.length)),inst:null};
  parts.forEach((q,i)=>plnRec(it.a,i,q.o,1,0,1,0,q.k==="body"?null:[1,1,1]));
  it.inst=plnInst(it.a,parts.length,Math.max(1,parts.length));
  GLW.it=it;
}
/* в кадр: банки (мох днём тусклый, ночью светит), пятна — только ночью; ближняя банка — лампа */
function plnGlwFrame(F,ex,V,nk,want){
  const it=GLW.it;if(!it||!it.parts.length)return;
  const Bk=PLN_KIND.body,a=clamp((nk-.08)*2.4,0,1),mk=a>0?.55+.4*a:.3,pk=nk<.1?0:clamp(nk*1.3,0,.8);
  const moss=a>0?[mk,mk,mk]:[.36,.6,.42];
  it.parts.forEach((q,i)=>{if(q.k!=="body")plnRec(it.a,i,q.o,1,0,1,0,q.k==="moss"?moss:[pk,pk,pk]);});
  plnInstSet(it.inst,it.a,it.parts.length);
  it.parts.forEach((q,i)=>{
    if(q.k==="patch"&&pk<=0)return;
    if(Math.abs(q.o[0]-ex)>V.hw*(1+q.o[2]/V.D)+q.hw)return;
    F.batches.push({geo:q.geo,inst:it.inst,first:i,count:1,kind:Bk,to:q.k==="body"?PLN_TO.all:PLN_TO.lit});
  });
  if(a>0&&it.lamps.length){let b=null;for(const l of it.lamps)if(!b||Math.abs(l[0]-ex)+l[2]*.3<Math.abs(b[0]-ex)+b[2]*.3)b=l;
    want.push({o:3,l:{p:b,r:5,c:GLOW_LAMP,k:1.3*Math.min(1,.4+a)}});}
}
