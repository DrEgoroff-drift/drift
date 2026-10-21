/* ══════════════ рудник: планета над ним (M631) ══════════════
   Рудник — разрез той же планеты там, где копали: над разрезом стоит тот же кадр поверхности
   (земля, трава, звери, корабль, вещи, небо, час, погода), под ним — выработка. Кадров движка два:
   пещерный (порода, клеть, канат, человек, огни) в метрах рудника и кадр планеты (21pz plnSurface,
   тот же, что на поверхности) в метрах мира со сдвигом o = (xm − CM/2, высота земли у устья).
   Сводит их своя свёртка: в каждой выборке — ближнее к глазу из двух. Порода у разреза идёт по
   земле планеты (23ca, F.tab), за разрезом сидит на четверть метра ниже — сверху видна трава.
   У планеты срезано то, что перед разрезом (ряды земли z < zc, трава оттуда), и вырезано устье.
   Вход (DIG3_HAND): объектив съезжает с кадра поверхности в рудник, а срез уходит от камеры к
   плоскости z = 0 — земля раскрывается разрезом, а не прыгает. Копёр — тело планеты в обоих
   режимах (на поверхности с клетью у устья), так он не меняет свет на входе.
   Глубоко, когда земли в окне нет, кадр планеты не считается. ?digtop=0 — рудник один. */
const DIG3_TOP={on:true,bad:0,err:"",live:false,T:null,hand:null,uFix:null,zc:0,u:1,camT:-1e9,sink:.25,margin:.03,
  ib:new Map(),hf:null,stat:{}};
try{if(typeof location!=="undefined"&&/[?&]digtop=0\b/.test(location.search))DIG3_TOP.on=false;}catch(e){}
/* вход: секунды; доля входа, на которой срез идёт от камеры к разрезу; откуда идёт срез, м */
const DIG3_HAND={s:1.8,cut:[.05,.72],z0:-60};

/* ── место рудника на земле планеты ── */
function dig3TopAt(D){
  const S=G.surf;
  if(!DIG3_TOP.on||DIG3_TOP.bad>=3||!PLN.on||PLN.bad>=3||!D||!S||!S.tr||S.p!==D.p||!GPU.dev)return null;
  S.tr.p=S.p;PLN.y0=S.tr.padY;
  const L=plnLand(S.tr,S.p,S.shipX),xm=D.x0/PLN_M;
  return {L,xm,ox:xm-DIG3_CM*.5,oy:plnLandRibAt(L,xm,0)};
}
/* высоты земли над рудником в метрах рудника: столбцы по полметра на весь пролёт, ряды вглубь */
function dig3TopTab(T){
  const CM=DIG3_CM,x0=-(MINE_HALF+3)*CM,x1=(MINE_HALF+4)*CM,dx=.5,nx=Math.ceil((x1-x0)/dx)+1,zs=[0,.4,1,2,3.5,5.5,8,11,14,17];
  const h=new Float32Array(nx*zs.length);
  for(let j=0;j<zs.length;j++)for(let i=0;i<nx;i++)h[j*nx+i]=plnLandRibAt(T.L,x0+i*dx+T.ox,zs[j])-T.oy;
  return {x0,dx,nx,zs,h};
}
function dig3TabAt(B,X,Z){
  const zs=B.zs,n=B.nx,h=B.h;
  let j=0;while(j<zs.length-2&&zs[j+1]<Z)j++;
  const tz=clamp((Z-zs[j])/(zs[j+1]-zs[j]),0,1),u=clamp((X-B.x0)/B.dx,0,n-1.001),i=Math.floor(u),tx=u-i,a=j*n+i,b=a+n;
  const p=h[a]+(h[a+1]-h[a])*tx,q=h[b]+(h[b+1]-h[b])*tx;
  return p+(q-p)*tz;
}
/* самая низкая земля у разреза на отрезке x, м рудника */
function dig3TabLow(B,x0,x1){
  const i0=clamp(Math.floor((x0-B.x0)/B.dx),0,B.nx-1),i1=clamp(Math.ceil((x1-B.x0)/B.dx),0,B.nx-1);
  let lo=1e9;for(let i=i0;i<=i1;i++)lo=Math.min(lo,B.h[i]);
  return lo;
}

/* ── объектив: вход с поверхности ──
   объектив поверхности (PLN.cam, метры мира, окно на z = 0) в виде объектива рудника: окно на
   плоскости человека z = DIG3_Z, глаз в метрах рудника */
function dig3LensMk(l,r,b,t,e){
  const D=DIG3_Z-e[2];
  return {l,r,b,t,eye:e,D,w:r-l,Hf:t-b,vp:plnM4mul(plnM4lens(l-e[0],r-e[0],b-e[1],t-e[1],D,4,600),plnM4move(-e[0],-e[1],-e[2]))};
}
function dig3LensOf(C,ox,oy){
  const e=[C.ex-ox,C.ey-oy,-C.D],s=(DIG3_Z-e[2])/(-e[2]);
  const l0=C.vx/PLN_M-ox,r0=(C.vx+C.ws)/PLN_M-ox,t0=(PLN.y0-C.vy)/PLN_M-oy,b0=t0-C.hs/PLN_M;
  return dig3LensMk(e[0]+(l0-e[0])*s,e[0]+(r0-e[0])*s,e[1]+(b0-e[1])*s,e[1]+(t0-e[1])*s,e);
}
function dig3HandU(h){
  if(DIG3_TOP.uFix!=null)return DIG3_TOP.uFix;
  /* первый кадр рудника строит породу долго — часы входа идут с третьего */
  if(!h.t0){if((h.f=(h.f|0)+1)<3)return 0;h.t0=wallMs();}
  return (wallMs()-h.t0)/1000/DIG3_HAND.s;
}
/* объектив кадра: на входе — между поверхностью и рудником; заодно место рудника и срез */
function dig3TopLens(Ls){
  const Z=DIG3_TOP,T=Z.T=dig3TopAt(G.dig),h=Z.hand,o=Z.out;
  Z.zc=0;Z.u=1;
  if(T&&o){
    /* выход: тот же путь назад — к объективу поверхности, срез возвращается к камере */
    const u=dig3HandU(o);
    if(u>=1||o.tr!==G.surf.tr){Z.out=null;return Ls;}
    const S=G.surf;if(!S.cam)S.cam={x:S.x,y:S.y};
    const B=dig3LensOf(plnLens(S,surfScale()*(1+clamp(PLN.near||0,0,1))),T.ox,T.oy),k=plnSmooth(0,1,u),m=(a,b)=>a+(b-a)*k;
    Z.u=u;Z.zc=lerp(DIG3_HAND.z0,0,plnSmooth(DIG3_HAND.cut[0],DIG3_HAND.cut[1],1-u));
    return dig3LensMk(m(Ls.l,B.l),m(Ls.r,B.r),m(Ls.b,B.b),m(Ls.t,B.t),[m(Ls.eye[0],B.eye[0]),m(Ls.eye[1],B.eye[1]),m(Ls.eye[2],B.eye[2])]);
  }
  if(!T||!h)return Ls;
  const u=dig3HandU(h);
  if(u>=1||h.tr!==G.surf.tr){Z.hand=null;return Ls;}
  const A=h.A||(h.A=dig3LensOf(h.C,T.ox,T.oy)),k=plnSmooth(0,1,u),m=(a,b)=>a+(b-a)*k;
  Z.u=u;Z.zc=lerp(DIG3_HAND.z0,0,plnSmooth(DIG3_HAND.cut[0],DIG3_HAND.cut[1],u));
  return dig3LensMk(m(A.l,Ls.l),m(A.r,Ls.r),m(A.b,Ls.b),m(A.t,Ls.t),[m(A.eye[0],Ls.eye[0]),m(A.eye[1],Ls.eye[1]),m(A.eye[2],Ls.eye[2])]);
}
/* тот же объектив в метрах мира — в виде plnLens: окно на z = 0 */
function dig3TopCam(Ls,T){
  const e=Ls.eye,ex=e[0]+T.ox,ey=e[1]+T.oy,ez=e[2],D0=-ez,s=D0/Ls.D;
  const l=ex+(Ls.l-e[0])*s,r=ex+(Ls.r-e[0])*s,t=ey+(Ls.t-e[1])*s,b=ey+(Ls.b-e[1])*s;
  const vp=plnM4mul(plnM4lens(Ls.l-e[0],Ls.r-e[0],Ls.b-e[1],Ls.t-e[1],Ls.D,2,70000),plnM4move(-ex,-ey,-ez));
  return {vx:l*PLN_M,vy:PLN.y0-t*PLN_M,ws:(r-l)*PLN_M,hs:(t-b)*PLN_M,ex,ey,D:D0,hw:(r-l)/2,vp,eye:[ex,ey,ez]};
}

/* ── земля планеты со срезом и устьем ──
   кусок ленты (21pfb): вершина (r, i) = r·nc + i; свои индексы — ряды от первого за срезом, без юбки,
   без четырёхугольников над устьем ствола */
function dig3TopHole(T){const CM=DIG3_CM;return {x0:T.ox-.05,x1:T.ox+CM+.05,z0:-1,z1:DIG3_ROOM.zd+.1};}
function dig3RibView(L,J,ra,H){
  const Z=DIG3_TOP,g=J.geo,key=ra+":"+H.x0.toFixed(2);
  let q=Z.ib.get(J);
  if(q&&q.g===g&&q.key===key&&q.v.gen===PLN_GPU.gen)return q.v;
  const C=PLN_LAND,i0=J.c*C.chunk,i1=Math.min(i0+C.chunk,L.NT-1),nc=i1-i0+1,R=L.R,zr=L.zr;
  const a=new Uint32Array(Math.max(1,(R-1-ra)*(nc-1)*6));
  let k=0;
  for(let r=ra;r+1<R;r++){
    const hz=zr[r]<H.z1&&zr[r+1]>H.z0;
    for(let i=0;i+1<nc;i++){
      if(hz){const x0=L.x0+(i0+i)*L.dx;if(x0<H.x1&&x0+L.dx>H.x0)continue;}
      const v=r*nc+i;a[k++]=v;a[k++]=v+1;a[k++]=v+nc+1;a[k++]=v;a[k++]=v+nc+1;a[k++]=v+nc;
    }
  }
  if(!q||q.cap<k||q.v.gen!==PLN_GPU.gen){
    if(q&&q.v.gen===PLN_GPU.gen)q.buf.destroy();
    const cap=Math.max(k,(R-1)*(nc-1)*6);
    q={cap,buf:GPU.dev.createBuffer({size:Math.max(12,cap*4),usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST})};
    Z.ib.set(J,q);
  }
  if(k)GPU.dev.queue.writeBuffer(q.buf,0,a,0,k);
  q.g=g;q.key=key;q.v={vb:g.vb,ib:q.buf,n:k,gen:g.gen};
  return q.v;
}
function dig3TopLand(L,out,ex,V,T){
  const zc=DIG3_TOP.zc,H=dig3TopHole(T);
  let ra=0;while(ra<L.R-1&&L.zr[ra]<zc-1e-3)ra++;
  for(const J of L.jobs){
    if(!J.geo||!plnLandSees(J,ex,V,0))continue;
    const g=J.t==="rib"?dig3RibView(L,J,ra,H):J.geo;
    if(g&&g.n>0)out.push({geo:g,inst:null,kind:J.kind,to:J.to,ride:J.ride});
  }
}
/* юбка среза на входе и выходе: тёмный пласт под краем земли — срез читается толщей, а не листом;
   у разреза она сходит на нет (глубина ∝ расстоянию до него), иначе закрыла бы разрез рудника */
function dig3TopSkirt(T,C){
  const Z=DIG3_TOP,zc=Z.zc,L=T.L;
  if(Z.sk){plnGeoFree(Z.sk);Z.sk=null;}
  if(zc>-.02)return null;
  const hw=C.hw*(1+zc/C.D)+4,x0=C.ex-hw,dx=Math.max(L.dx,2*hw/400),n=Math.ceil(2*hw/dx)+1,hs=Math.min(60,-zc*4);
  const m=plnMesh(n*2+8),nk=plnNorm([0,.25,-1]),c=plnMul(PLN_PAL.soilDark,.8),c2=plnMul(PLN_PAL.soilDark,.4);
  for(let i=0;i<n;i++){
    const x=x0+i*dx,h=plnLandRibAt(L,x,zc);
    plnVert(m,[x,h+.02,zc],nk,c,PLN_MAT.ground,0,0,.6);plnVert(m,[x,h-hs,zc],nk,c2,PLN_MAT.ground,0,0,.35);
  }
  for(let i=0;i+1<n;i++){const a=i*2;plnQuad(m,a,a+2,a+3,a+1);}
  Z.sk=plnGeo(m);
  return Z.sk;
}
/* записи посадок держит у себя обёртка группы: травы перед срезом и над устьем — долой */
const DIG3_PLANT_GROUP=plnPlantGroup;
plnPlantGroup=function(xa,xb,z,m,buckets,blots){
  const G0=DIG3_PLANT_GROUP(xa,xb,z,m,buckets,blots);
  if(G0.n&&z<100){
    const a=new Float32Array(G0.n*16);let k=0,lo=1e9;
    for(const B of buckets){if(!B.n)continue;a.set(B.a.subarray(0,B.n*16),k*16);k+=B.n;}
    for(let j=0;j<k;j++)lo=Math.min(lo,a[j*16+2]);
    G0.rec=a;G0.zlo=lo;
  }
  return G0;
};
function dig3PlantView(G0,zc,H){
  const z0=zc+.15,hx0=H.x0-.35,hx1=H.x1+.35,hz1=H.z1+.35;
  if(G0.zlo>=z0&&(G0.zlo>=hz1||G0.xb<hx0||G0.xa>hx1))return null;
  const key=z0.toFixed(2)+":"+hx0.toFixed(2);
  let q=G0.cut;
  if(q&&q.key===key&&q.inst.gen===PLN_GPU.gen)return q;
  const a=G0.rec,b=new Float32Array(a.length),part=new Map();
  let k=0;
  for(const p of G0.parts){
    const f=k;
    for(let j=p.first;j<p.first+p.count;j++){
      const o=j*16,x=a[o],z=a[o+2];
      if(z<z0||(z<hz1&&x>hx0&&x<hx1))continue;
      b.set(a.subarray(o,o+16),k*16);k++;
    }
    part.set(p.first,{first:f,count:k-f});
  }
  if(!q||q.inst.gen!==PLN_GPU.gen){q={inst:plnInst(b,k,G0.n)};G0.cut=q;}
  else plnInstSet(q.inst,b,k);
  q.key=key;q.part=part;
  return q;
}
function dig3TopPlants(orig,L,F0,ex,V,T){
  const n0=F0.batches.length;
  orig(L,F0,ex,V);
  const fl=L.flora;
  if(!fl)return;
  const zc=DIG3_TOP.zc,H=dig3TopHole(T),by=new Map(),keep=[];
  for(const G0 of fl.groups)if(G0.inst&&G0.rec)by.set(G0.inst,G0);
  for(let k=n0;k<F0.batches.length;k++){
    const b=F0.batches[k],G0=by.get(b.inst),v=G0?dig3PlantView(G0,zc,H):null;
    if(!v){keep.push(b);continue;}
    const p=v.part.get(b.first);
    if(p&&p.count>0)keep.push(Object.assign({},b,{inst:v.inst,first:p.first,count:p.count}));
  }
  F0.batches.length=n0;
  for(const b of keep)F0.batches.push(b);
}

/* ── копёр телом планеты: на поверхности с клетью у устья, в руднике без неё ── */
const DIG3_TOP_MINE=plnThingMineMesh;
plnThingMineMesh=function(L,xm){
  if(!DIG3_TOP.on||!DIG3.on)return DIG3_TOP_MINE(L,xm);
  const T={L,xm,ox:xm-DIG3_CM*.5,oy:plnLandRibAt(L,xm,0)},m=plnMesh(1<<14);
  const q=dig3HeadBody(m,{tab:dig3TopTab(T)},[T.ox,T.oy],true);
  return {m,lamp:q.lamp};
};
function dig3TopHead(T,Fd){
  const Z=DIG3_TOP,key=T.ox.toFixed(3)+":"+T.oy.toFixed(3);
  if(Z.hf&&Z.hf.key===key&&Z.hf.geo.gen===PLN_GPU.gen)return Z.hf;
  if(Z.hf)plnGeoFree(Z.hf.geo);
  const m=plnMesh(1<<13),q=dig3HeadBody(m,Fd,[T.ox,T.oy],false);
  Z.hf={key,geo:plnGeo(m),lamp:q.lamp};
  return Z.hf;
}

/* ── кадр планеты над рудником: plnSurface как есть, с объективом рудника ──
   человека рисует рудник (риг один на кадр), копёр поверхности заменён своим, земля и трава срезаны */
function dig3TopPre(D,Fd,Ls){
  const Z=DIG3_TOP,T=Z.T;
  Z.live=false;
  if(!T||!Fd.tab)return null;
  /* земли в окне нет — планета не считается */
  if(!Z.hand&&!Z.out&&Ls.t<dig3TabLow(Fd.tab,Ls.l-2,Ls.r+2)-1.5)return null;
  const t0=wallMs(),C=dig3TopCam(Ls,T),vx=G.viewX,vy=G.viewY,vk=G.viewK;
  const W0={lens:plnLens,hand:plnHandAge,gpu:plnGpuFrame,land:plnLandBatches,plant:plnPlantBatches,cast:plnCastFrame,things:plnThingsFrame};
  let Fp=null;
  plnLens=()=>C;plnHandAge=()=>null;plnGpuFrame=F=>{Fp=F;return true;};
  plnLandBatches=(L,out,ex,V)=>dig3TopLand(L,out,ex,V,T);
  plnPlantBatches=(L,F0,ex,V)=>dig3TopPlants(W0.plant,L,F0,ex,V,T);
  plnCastFrame=(F,man,face,ship,yaw,swim,o)=>plnShipFrame(F,ship,yaw,{L:o&&o.L,floor:o&&o.floor,gear:1,sq:0,thr:0,open:true});
  plnThingsFrame=function(L,F){
    const n=F.batches.length,nl=F.lamps.length;
    W0.things.apply(this,arguments);
    const Q=L.things;
    if(Q&&Q.mine){
      for(let k=F.batches.length-1;k>=n;k--)if(F.batches[k].geo===Q.mine.geo)F.batches.splice(k,1);
      for(let k=F.lamps.length-1;k>=nl;k--)if(F.lamps[k].p===Q.mine.lamp)F.lamps.splice(k,1);
    }
  };
  try{plnSurface(G.surf);}
  catch(e){Z.bad++;Z.err=String((e&&e.stack)||e).slice(0,600);plnLog("рудник: планета: "+Z.err);Fp=null;}
  finally{
    plnLens=W0.lens;plnHandAge=W0.hand;plnGpuFrame=W0.gpu;plnLandBatches=W0.land;plnPlantBatches=W0.plant;
    plnCastFrame=W0.cast;plnThingsFrame=W0.things;
    G.viewX=vx;G.viewY=vy;G.viewK=vk;
  }
  if(!Fp)return null;
  /* кулиса стоит перед разрезом: пока срез её не прошёл */
  if(Z.zc>-47)Fp.batches=Fp.batches.filter(b=>b.kind!==PLN_KIND.wing);
  const sk=dig3TopSkirt(T,C);
  if(sk)Fp.batches.push({geo:sk,inst:null,kind:PLN_KIND.body,to:PLN_TO.main});
  const hf=dig3TopHead(T,Fd);
  Fp.batches.push({geo:hf.geo,inst:null,kind:PLN_KIND.body,to:PLN_TO.all});
  if(Fp.lamps.length<4)Fp.lamps.push({p:hf.lamp,r:6,c:[1,.62,.3],k:2});
  Z.live=true;Z.bad=0;
  Z.stat={ms:+(wallMs()-t0).toFixed(2),zc:+Z.zc.toFixed(2),u:+Z.u.toFixed(3),batches:Fp.batches.length,oy:+T.oy.toFixed(2)};
  Z.C=C;
  return {F:Fp,C,T};
}

/* ── свёртка: пещера поверх планеты там, где она ближе к глазу ── */
const DIG3_TOP_WGSL=/* wgsl */`
@group(0) @binding(10) var plnDep: texture_depth_2d;
struct TopP { inv: mat4x4f, k: vec4f };
@group(0) @binding(11) var<uniform> tp: TopP;
fn topDist(m: mat4x4f, eye: vec3f, uv: vec2f, d: f32) -> f32 {
  let p = m * vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, d, 1.0);
  return length(p.xyz / p.w - eye);
}
@fragment fn fs_top(in: FOut) -> @location(0) vec4f {
  let px = vec2i(in.pos.xy);
  var win = 0.0;
  for (var i = 0; i < TOP_NMS; i++) {
    let dc = textureLoad(depthTex, px, TOP_SMP);
    if (dc <= 0.0) { continue; }
    let dq = textureLoad(plnDep, px, TOP_SMP);
    if (dq <= 0.0) { win += 1.0; continue; }
    if (topDist(g.invViewProj, g.camPos.xyz, in.uv, dc) < topDist(tp.inv, tp.k.xyz, in.uv, dq) - tp.k.w) { win += 1.0; }
  }
  if (win <= 0.0) { discard; }
  var c = textureSampleLevel(texA, samp, in.uv, 0.0).rgb;
  c = max(c + textureSampleLevel(texC, samp, in.uv, 0.0).rgb, vec3f(0.0));
  c = mix(c, textureSampleLevel(texB, samp, in.uv, 0.0).rgb, pp.a.x);
  c *= g.sunCol.w;
  let q = in.uv - 0.5;
  c *= 1.0 - dot(q, q) * pp.a.y;
  c = neutral(max(c, vec3f(0.0)));
  let lum = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  c = mix(vec3f(lum), c, 1.0 + 0.08 * pp.a.z);
  c = mix(c, c * vec3f(1.03, 1.0, 0.95), smoothstep(0.3, 0.9, lum) * pp.a.z);
  c = mix(c, c * vec3f(0.94, 0.98, 1.08) + vec3f(0.002, 0.003, 0.006), (1.0 - smoothstep(0.0, 0.35, lum)) * pp.a.z);
  c = pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
  return vec4f(unshoulder(c), win / f32(TOP_NMS));
}
`;
function dig3TopPipe(){
  const Z=DIG3_TOP,Q=CAVE3_GPU,d=GPU.dev,ms=Q.ms;
  if(Z.P&&Z.dev===d&&Z.ms===ms&&Z.gen===PLN_GPU.gen)return Z.P;
  const FR=GPUShaderStage.FRAGMENT,VF=GPUShaderStage.VERTEX|FR,tx=b=>({binding:b,visibility:FR,texture:{sampleType:"float"}}),
    dm={sampleType:"depth",multisampled:ms>1};
  Z.L=d.createBindGroupLayout({entries:[{binding:0,visibility:VF,buffer:{type:"uniform"}},{binding:1,visibility:FR,buffer:{type:"uniform"}},
    tx(2),tx(3),tx(4),{binding:5,visibility:FR,sampler:{type:"filtering"}},{binding:6,visibility:FR,texture:dm},
    {binding:7,visibility:FR,texture:{sampleType:"depth"}},{binding:8,visibility:FR,texture:{sampleType:"depth"}},
    {binding:9,visibility:FR,sampler:{type:"comparison"}},{binding:10,visibility:FR,texture:dm},{binding:11,visibility:FR,buffer:{type:"uniform"}}]});
  let code=CAVE3_WGSL_POST+DIG3_TOP_WGSL;
  if(ms>1)code=code.replace("var depthTex: texture_depth_2d;","var depthTex: texture_depth_multisampled_2d;").replace("var plnDep: texture_depth_2d;","var plnDep: texture_depth_multisampled_2d;");
  code=code.replace("TOP_NMS",String(ms)).replace("TOP_NMS",String(ms)).replace(/TOP_SMP/g,ms>1?"i":"0");
  const m=gpuShader(code),lay=d.createPipelineLayout({bindGroupLayouts:[Z.L]});
  m.getCompilationInfo().then(i=>{for(const x of i.messages)if(x.type==="error"){Z.err="wgsl "+x.lineNum+":"+x.linePos+" "+x.message;plnLog("рудник: "+Z.err);}}).catch(()=>{});
  Z.P=gpuPipeline("dig3.top"+ms,()=>({layout:lay,vertex:{module:m,entryPoint:"vs_full"},
    fragment:{module:m,entryPoint:"fs_top",targets:[{format:PLN_HDR,writeMask:GPUColorWrite.RED|GPUColorWrite.GREEN|GPUColorWrite.BLUE,
      blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}]},
    primitive:{topology:"triangle-list",cullMode:"none"}}));
  Z.U=d.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  Z.pp=d.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const K=CAVE3_K.comp;
  d.queue.writeBuffer(Z.pp,0,new Float32Array([K[0],K[1],K[2]||0,K[3]||0,0,0,0,0]));
  Z.dev=d;Z.ms=ms;Z.gen=PLN_GPU.gen;Z.B=null;
  return Z.P;
}
function dig3TopComp(Tp){
  const Z=DIG3_TOP,P=dig3TopPipe(),Q=CAVE3_GPU,V=Q.V,Vp=PLN_GPU.V;
  if(!Z.B||Z.Bc!==V||Z.Bp!==Vp||Z.Bd!==Q.D){
    Z.B=GPU.dev.createBindGroup({layout:Z.L,entries:[{binding:0,resource:{buffer:Q.U.main}},{binding:1,resource:{buffer:Z.pp}},
      {binding:2,resource:V.hdr},{binding:3,resource:V.up[0]},{binding:4,resource:V.air},{binding:5,resource:Q.S.lin},
      {binding:6,resource:V.depth},{binding:7,resource:Q.D.lampV},{binding:8,resource:Q.D.sunV},{binding:9,resource:Q.S.cmp},
      {binding:10,resource:Vp.depth},{binding:11,resource:{buffer:Z.U}}]});
    Z.Bc=V;Z.Bp=Vp;Z.Bd=Q.D;
  }
  const a=Z.ua||(Z.ua=new Float32Array(20)),C=Tp.C;
  plnM4inv(C.vp,a.subarray(0,16));
  a[16]=C.eye[0];a[17]=C.eye[1];a[18]=C.eye[2];a[19]=Z.margin;
  GPU.dev.queue.writeBuffer(Z.U,0,a);
  const sp=gpuScene();
  if(!sp)return false;
  sp.setPipeline(P);sp.setBindGroup(0,Z.B);sp.draw(3);
  return true;
}
/* кадр: пещера без своей свёртки, планета со своей, потом пещера поверх там, где ближе */
const DIG3_NOSCENE=()=>null;
function dig3TopPost(F,Tp){
  if(!Tp)return cave3GpuFrame(F);
  const gs=gpuScene;
  gpuScene=DIG3_NOSCENE;
  try{cave3GpuFrame(F);}finally{gpuScene=gs;}
  if(!plnGpuFrame(Tp.F))return false;
  GPU.hiScene=true;
  return dig3TopComp(Tp);
}

/* ── вход и выход ── */
const DIG3_TOP_SURF=plnSurface;
plnSurface=function(){const r=DIG3_TOP_SURF.apply(this,arguments);DIG3_TOP.camT=wallMs();return r;};
const DIG3_TOP_ENTER=enterDig;
enterDig=function(){
  const C=PLN.cam,S=G.surf,fresh=wallMs()-DIG3_TOP.camT<600;
  const r=DIG3_TOP_ENTER.apply(this,arguments);
  DIG3_TOP.hand=G.mode==="dig"&&G.dig&&C&&fresh&&S&&S.tr?{C,tr:S.tr,t0:0,f:0}:null;
  return r;
};
const DIG3_TOP_EXIT=exitDig;
exitDig=function(){
  const D=G.dig,S=G.surf,live=DIG3_TOP.on&&DIG3.on&&DIG3.bad<3&&DIG3_TOP.bad<3&&GPU.on;
  const r=DIG3_TOP_EXIT.apply(this,arguments);
  /* человек выходит из клети у устья; кадр ещё DIG3_HAND.s идёт рудником назад к поверхности */
  if(D&&S&&G.mode==="surface"&&isFinite(D.x0))S.x=D.x0;
  DIG3_TOP.hand=null;DIG3_TOP.live=false;
  DIG3_TOP.out=live&&D&&S&&S.tr&&G.mode==="surface"?{D,tr:S.tr,t0:0,f:0}:null;
  if(!DIG3_TOP.out)dig3TopDrop();
  return r;
};
/* выход: поверхность рисует рудник, пока объектив не вернулся; окно 2D — окно кадра планеты */
const DIG3_TOP_DRAWSURF=drawSurface;
drawSurface=function(){
  const Z=DIG3_TOP,o=Z.out;
  if(o&&G.mode==="surface"&&G.surf&&DIG3.on&&DIG3.bad<3&&CAVE3.bad<3){
    /* кадр нарисован — поверхность в этот кадр уже не рисуется (проход сцены открыт) */
    if(dig3HandU(o)<1){
      const g=G.dig;let ok=false;
      G.dig=o.D;
      try{plnQualAuto();ok=cave3GpuReady()&&dig3Frame();}
      catch(e){Z.bad++;Z.err=String((e&&e.stack)||e).slice(0,600);plnLog("рудник: выход: "+Z.err);
        if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}}
      finally{G.dig=g;}
      if(ok){if(Z.live&&Z.C){G.viewX=Z.C.vx;G.viewY=Z.C.vy;G.viewK=W/Z.C.ws;}return;}
    }
    Z.out=null;Z.live=false;dig3TopDrop();
  }
  return DIG3_TOP_DRAWSURF.apply(this,arguments);
};
function dig3TopDrop(){
  const Z=DIG3_TOP;
  for(const q of Z.ib.values())if(q.v&&q.v.gen===PLN_GPU.gen)q.buf.destroy();
  Z.ib.clear();
  const L=PLN_LAND.cur;
  if(L&&L.flora)for(const G0 of L.flora.groups)if(G0.cut){plnInstFree(G0.cut.inst);G0.cut=null;}
}
