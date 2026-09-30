/* ══════════════ планета: цели, конвейеры и проходы одного кадра (M610) ══════════════
   Свой рендер планеты. Всё пишется в кодировщик кадра движка (GPU.enc) ДО
   того, как открыт проход сцены:

     тень ×2 → зеркало воды (половина кадра) → сцена с глубиной и сглаживанием
     → кулиса и её размытие → свет в воздухе → своё свечение → свёртка

   Свёртка — последний треугольник — рисуется уже в проход сцены движка
   (gpuScene): дальше кадр идёт общим путём, сверху ложится 2D и интерфейс.

   Всё собранное принадлежит устройству: после потери видеокарты движок
   поднимает новое, и здесь всё строится заново (PLN_GPU.gen — поколение;
   по нему земля и актёры понимают, что их сетки пора залить снова). Цели
   привязаны ещё и к размеру кадра. */
const PLN_HDR="rgba16float",PLN_DEP="depth32float";
/* куда идёт отрисовка: биты проходов и род */
const PLN_TO={main:1,mirror:2,sh0:4,sh1:8,all:15,lit:3,near:7};
const PLN_KIND={body:0,water:1,wing:2};
const PLN_GPU={dev:null,gen:0,
  ms:4,shn:4096,                       /* сглаживание сцены; сторона карты теней */
  w:0,h:0,L:null,P:{},S:null,U:null,D:null,T:null,V:null,B:null,pp:null,one:null,oneRide:null,
  ga:[0,1,2,3,4].map(()=>new Float32Array(248)),inv:new Float32Array(16)};
/* где что лежит в блоке Globals после ламп (21pb) */
const PLN_G={skyZen:120,skyZenS:124,skyHor:128,skyHorS:132,sunGlow:136,airFar:140,airFarS:144,airNear:148,
  ambSky:152,ambGnd:156,thru:160,bounce:164,waterA:168,waterB:172,cloudLit:176,cloudDark:180,cloudDarkS:184,
  moon:188,world:192,bands:196,sunTrue:232,moon2:236,moon3:240,bodyKind:244};
const PLN_VB=[
  {arrayStride:52,attributes:[
    {shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},
    {shaderLocation:2,offset:24,format:"float32x3"},{shaderLocation:3,offset:36,format:"float32x4"}]},
  {arrayStride:64,stepMode:"instance",attributes:[
    {shaderLocation:4,offset:0,format:"float32x4"},{shaderLocation:5,offset:16,format:"float32x4"},
    {shaderLocation:6,offset:32,format:"float32x4"},{shaderLocation:7,offset:48,format:"float32x4"}]}];

/* ── сетки и записи расстановки ── */
function plnGeo(m){
  const d=GPU.dev,nv=m.nv!==undefined?m.nv:m.v.length/PLN_VS,ni=m.ni!==undefined?m.ni:m.i.length;
  const vb=d.createBuffer({size:Math.max(52,nv*52),usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  const ib=d.createBuffer({size:Math.max(12,ni*4),usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});
  if(nv)d.queue.writeBuffer(vb,0,m.v,0,nv*PLN_VS);
  if(ni)d.queue.writeBuffer(ib,0,m.i,0,ni);
  return {vb,ib,n:ni,nv,gen:PLN_GPU.gen};
}
function plnGeoFree(g){if(g&&g.gen===PLN_GPU.gen){g.vb.destroy();g.ib.destroy();}if(g)g.n=0;}
/* записи: по 16 чисел на штуку; cap — на сколько штук заведён буфер */
function plnInst(a,n,cap){
  const c=Math.max(1,cap||n||1);
  const buf=GPU.dev.createBuffer({size:c*64,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  if(n)GPU.dev.queue.writeBuffer(buf,0,a,0,n*16);
  return {buf,n:n||0,cap:c,gen:PLN_GPU.gen};
}
function plnInstSet(I,a,n){
  n=Math.min(n,I.cap);
  if(n)GPU.dev.queue.writeBuffer(I.buf,0,a,0,n*16);
  I.n=n;
}
function plnInstFree(I){if(I&&I.gen===PLN_GPU.gen)I.buf.destroy();if(I)I.n=0;}
/* одна запись в массив: место, размер, поворот, доля высоты, семя, цвет А, режим, цвет Б;
   ride — вещь стоит в дальнем мире и едет по высоте вместе с ним (21pf) */
function plnRec(a,k,p,scale,yaw,hk,seed,ca,mode,cb,ride){
  const o=k*16;
  a[o]=p[0];a[o+1]=p[1];a[o+2]=p[2];a[o+3]=scale;
  a[o+4]=Math.cos(yaw);a[o+5]=Math.sin(yaw);a[o+6]=hk;a[o+7]=seed;
  a[o+8]=ca?ca[0]:1;a[o+9]=ca?ca[1]:1;a[o+10]=ca?ca[2]:1;a[o+11]=mode||0;
  a[o+12]=cb?cb[0]:0;a[o+13]=cb?cb[1]:0;a[o+14]=cb?cb[2]:0;a[o+15]=ride?1:0;
}

/* ── то, что живёт с устройством ── */
function plnGpuDev(){
  const Q=PLN_GPU,d=GPU.dev;
  if(Q.dev===d)return;
  Q.dev=d;Q.gen++;Q.w=0;Q.h=0;Q.T=null;Q.V=null;Q.B=null;Q.pp=null;Q.P={};
  /* промах в шейдере или привязке виден здесь же, а не только в журнале сбоев движка */
  d.addEventListener("uncapturederror",e=>plnLog("gpu "+String((e.error&&e.error.message)||e.error)));
  const VF=GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,FR=GPUShaderStage.FRAGMENT;
  const tx=b=>({binding:b,visibility:FR,texture:{sampleType:"float"}});
  const sh={sampleType:"depth",viewDimension:"2d-array"};
  Q.L={
    scene:d.createBindGroupLayout({entries:[
      {binding:0,visibility:VF,buffer:{type:"uniform"}},
      {binding:1,visibility:FR,texture:sh},{binding:2,visibility:FR,sampler:{type:"comparison"}},
      tx(3),{binding:4,visibility:FR,sampler:{type:"filtering"}},
      {binding:5,visibility:FR,buffer:{type:"uniform"}}]}),
    shadow:d.createBindGroupLayout({entries:[{binding:0,visibility:VF,buffer:{type:"uniform"}}]}),
    post:d.createBindGroupLayout({entries:[
      {binding:0,visibility:VF,buffer:{type:"uniform"}},{binding:1,visibility:FR,buffer:{type:"uniform"}},
      tx(2),tx(3),tx(4),tx(5),{binding:6,visibility:FR,sampler:{type:"filtering"}},
      {binding:7,visibility:FR,texture:{sampleType:"depth",multisampled:Q.ms>1}},
      {binding:8,visibility:FR,texture:sh},{binding:9,visibility:FR,sampler:{type:"comparison"}}]})};
  Q.S={lin:d.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),
    cmp:d.createSampler({compare:"less",magFilter:"linear",minFilter:"linear"})};
  const ub=n=>d.createBuffer({size:n,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  Q.U={main:ub(992),refl:ub(992),sh0:ub(992),sh1:ub(992),wing:ub(992),blobs:ub(1040)};
  /* единичные записи цельных сеток: мировая и та, что едет с дальним миром */
  Q.one=d.createBuffer({size:64,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  d.queue.writeBuffer(Q.one,0,new Float32Array([0,0,0,1, 1,0,1,0, 1,1,1,0, 0,0,0,0]));
  Q.oneRide=d.createBuffer({size:64,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  d.queue.writeBuffer(Q.oneRide,0,new Float32Array([0,0,0,1, 1,0,1,0, 1,1,1,0, 0,0,0,1]));
  const RT=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING;
  const shadow=d.createTexture({size:[Q.shn,Q.shn,2],format:PLN_DEP,usage:RT});
  const dummy=d.createTexture({size:[1,1,1],format:PLN_HDR,usage:RT});
  Q.D={shadow,dummy,shArr:shadow.createView({dimension:"2d-array"}),dummyV:dummy.createView(),
    shv:[0,1].map(l=>shadow.createView({dimension:"2d",baseArrayLayer:l,arrayLayerCount:1}))};
  Q.B0={sh:[Q.U.sh0,Q.U.sh1].map(u=>d.createBindGroup({layout:Q.L.shadow,entries:[{binding:0,resource:{buffer:u}}]}))};
  plnGpuPipes();
}
/* конвейеры: через воронку движка (непрогретый ключ она строит на месте и пишет в GPU_PIPES.lazy),
   а держим сами — воронка непрогретое не хранит */
function plnGpuPipes(){
  const Q=PLN_GPU,d=GPU.dev,L=Q.L,ms=Q.ms;
  const mS=gpuShader(PLN_WGSL_SCENE),mP=gpuShader(plnWgslPost(ms));
  for(const [n,m] of [["сцена",mS],["свёртка",mP]])m.getCompilationInfo().then(i=>{
    for(const x of i.messages)if(x.type==="error")plnLog("wgsl "+n+" "+x.lineNum+":"+x.linePos+" "+x.message);}).catch(()=>{});
  const lS=d.createPipelineLayout({bindGroupLayouts:[L.scene]}),lH=d.createPipelineLayout({bindGroupLayouts:[L.shadow]}),
    lP=d.createPipelineLayout({bindGroupLayouts:[L.post]});
  const prim={topology:"triangle-list",cullMode:"none"};
  const mk=(key,desc)=>{Q.P[key]=gpuPipeline("pln."+key,()=>desc);};
  mk("shadow",{layout:lH,vertex:{module:mS,entryPoint:"vs_shadow",buffers:PLN_VB},primitive:prim,
    depthStencil:{format:PLN_DEP,depthWriteEnabled:true,depthCompare:"less",depthBias:2,depthBiasSlopeScale:2.2}});
  const blend={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}};
  for(const n of (ms>1?[1,ms]:[1])){
    const mu={count:n};
    mk("sky"+n,{layout:lS,vertex:{module:mS,entryPoint:"vs_full"},fragment:{module:mS,entryPoint:"fs_sky",targets:[{format:PLN_HDR}]},
      primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:false,depthCompare:"always"},multisample:mu});
    mk("body"+n,{layout:lS,vertex:{module:mS,entryPoint:"vs_main",buffers:PLN_VB},fragment:{module:mS,entryPoint:"fs_main",targets:[{format:PLN_HDR}]},
      primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:true,depthCompare:"greater"},multisample:mu});
    mk("water"+n,{layout:lS,vertex:{module:mS,entryPoint:"vs_main",buffers:PLN_VB},
      fragment:{module:mS,entryPoint:"fs_water",targets:[{format:PLN_HDR,blend}]},
      primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:false,depthCompare:"greater"},multisample:mu});
  }
  const post=(fs,tg)=>({layout:lP,vertex:{module:mP,entryPoint:"vs_full"},fragment:{module:mP,entryPoint:fs,targets:[tg||{format:PLN_HDR}]},primitive:prim});
  mk("blur",post("fs_blur"));mk("down",post("fs_down"));mk("up",post("fs_up"));mk("shafts",post("fs_shafts"));
  /* свёртка пишет в сцену движка; её альфу не трогаем */
  mk("comp",post("fs_comp",{format:PLN_HDR,writeMask:GPUColorWrite.RED|GPUColorWrite.GREEN|GPUColorWrite.BLUE}));
}

/* ── то, что живёт с размером кадра ── */
function plnGpuSize(){
  const Q=PLN_GPU,d=GPU.dev,w=GPU.bw,h=GPU.bh;
  if(Q.T&&Q.w===w&&Q.h===h)return;
  if(Q.T)for(const t of Q.T.all)t.destroy();
  if(Q.pp)for(const b of Q.pp.all)b.destroy();
  Q.w=w;Q.h=h;
  const RT=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,all=[];
  const tex=(tw,th,format,n,usage)=>{
    const t=d.createTexture({size:[Math.max(1,tw|0),Math.max(1,th|0),1],format,sampleCount:n||1,usage:usage||RT});
    all.push(t);return t;};
  const hw=Math.max(1,w>>1),hh=Math.max(1,h>>1),NB=5;
  const T={all,hdr:tex(w,h,PLN_HDR),depth:tex(w,h,PLN_DEP,Q.ms),
    ms:Q.ms>1?tex(w,h,PLN_HDR,Q.ms,GPUTextureUsage.RENDER_ATTACHMENT):null,
    refl:tex(hw,hh,PLN_HDR),reflD:tex(hw,hh,PLN_DEP,1,GPUTextureUsage.RENDER_ATTACHMENT),
    wing:tex(hw,hh,PLN_HDR),wingD:tex(hw,hh,PLN_DEP,1,GPUTextureUsage.RENDER_ATTACHMENT),
    wa:tex(hw,hh,PLN_HDR),wb:tex(hw,hh,PLN_HDR),sha:tex(hw,hh,PLN_HDR),shb:tex(hw,hh,PLN_HDR),down:[],up:[]};
  for(let k=0;k<NB;k++){T.down.push(tex(w>>(k+1),h>>(k+1),PLN_HDR));T.up.push(tex(w>>(k+1),h>>(k+1),PLN_HDR));}
  const V={};for(const k in T)if(k!=="all"&&T[k])V[k]=Array.isArray(T[k])?T[k].map(t=>t.createView()):T[k].createView();
  Q.T=T;Q.V=V;
  const U=Q.U,S=Q.S,D=Q.D,L=Q.L;
  const scene=(u,refl)=>d.createBindGroup({layout:L.scene,entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:D.shArr},
    {binding:2,resource:S.cmp},{binding:3,resource:refl},{binding:4,resource:S.lin},{binding:5,resource:{buffer:U.blobs}}]});
  const pp={all:[]};
  /* проход свёртки: свои числа и до четырёх текстур */
  const post=(a,texs,name)=>{
    const u=d.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(u,0,new Float32Array([a[0],a[1],a[2]||0,a[3]||0,0,0,0,0]));
    pp.all.push(u);if(name)pp[name]=u;
    const t=k=>texs[k]||D.dummyV;
    return d.createBindGroup({layout:L.post,entries:[{binding:0,resource:{buffer:U.main}},{binding:1,resource:{buffer:u}},
      {binding:2,resource:t(0)},{binding:3,resource:t(1)},{binding:4,resource:t(2)},{binding:5,resource:t(3)},
      {binding:6,resource:S.lin},{binding:7,resource:V.depth},{binding:8,resource:D.shArr},{binding:9,resource:S.cmp}]});
  };
  const wbl=.30*h/900;
  const B={main:scene(U.main,V.refl),refl:scene(U.refl,D.dummyV),wing:scene(U.wing,D.dummyV),sh:Q.B0.sh,
    wingBlur:[post([wbl/hw,0],[V.wing]),post([0,wbl/hh],[V.wa]),post([wbl*2/hw,0],[V.wb]),post([0,wbl*2/hh],[V.wa])],
    shafts:post([.0024,1600,.62,-.06],[],"shafts"),
    shBlur:[post([1.2/hw,0],[V.sha]),post([0,1.2/hh],[V.shb])],down:[],up:[]};
  for(let k=0;k<NB;k++){
    const src=k?T.down[k-1]:T.hdr;
    B.down.push(post([1/src.width,1/src.height],[k?V.down[k-1]:V.hdr]));
  }
  for(let k=NB-2;k>=0;k--){
    const lo=k===NB-2?T.down[NB-1]:T.up[k+1];
    B.up[k]=post([1/lo.width,1/lo.height,.62],[k===NB-2?V.down[NB-1]:V.up[k+1],V.down[k]]);
  }
  /* числа свёртки общие у обеих привязок: с кулисой и без неё */
  B.comp=post([.085,.42,1,0],[V.hdr,V.up[0],V.sha,V.wb],"comp");
  B.comp0=d.createBindGroup({layout:L.post,entries:[{binding:0,resource:{buffer:U.main}},{binding:1,resource:{buffer:pp.comp}},
    {binding:2,resource:V.hdr},{binding:3,resource:V.up[0]},{binding:4,resource:V.sha},{binding:5,resource:D.dummyV},
    {binding:6,resource:S.lin},{binding:7,resource:V.depth},{binding:8,resource:D.shArr},{binding:9,resource:S.cmp}]});
  Q.B=B;Q.pp=pp;
}
function plnGpuReady(){
  if(!GPU.on||!GPU.enc||!GPU.dev)return false;
  plnGpuDev();plnGpuSize();
  return true;
}

/* ── числа кадра ──
   F — кадр (собирает 21pz): vp, eye, t, sun, key, expo, waterY, L0 и L1 {m, range}, hero,
   lamps [{p,r,c,k}], look {по именам PLN_G}, clouds [[азимут, высота, полуширина, семя]] */
function plnGlobals(a,F,o){
  a.fill(0);
  a.set(o.vp,0);a.set(plnM4inv(o.vp,PLN_GPU.inv),16);a.set(o.l0,32);a.set(F.L1.m,48);
  a[64]=o.eye[0];a[65]=o.eye[1];a[66]=o.eye[2];a[67]=F.t;
  a[68]=F.sun[0];a[69]=F.sun[1];a[70]=F.sun[2];a[71]=F.waterY;
  a[72]=F.key[0];a[73]=F.key[1];a[74]=F.key[2];a[75]=F.expo;
  a[76]=o.w;a[77]=o.h;a[78]=1/o.w;a[79]=1/o.h;
  a[80]=F.hero[0];a[81]=F.hero[1];a[82]=F.hero[2];a[83]=F.hero[3];
  /* misc.y: 1 — резать то, что под водой (зеркало), −1 — кулиса, карты теней она не берёт */
  a[84]=o.clip?F.waterY+.02:0;a[85]=o.clip?1:(o.wing?-1:0);a[86]=.05/F.L0.range;a[87]=.16/F.L1.range;
  const lamps=F.lamps||[];
  for(let k=0;k<4&&k<lamps.length;k++){
    const l=lamps[k];
    a[88+k*4]=l.p[0];a[89+k*4]=l.p[1];a[90+k*4]=l.p[2];a[91+k*4]=l.r;
    a[104+k*4]=l.c[0];a[105+k*4]=l.c[1];a[106+k*4]=l.c[2];a[107+k*4]=l.k;
  }
  for(const k in PLN_G){const v=F.look[k];if(v)a.set(v,PLN_G[k]);}
  a[PLN_G.ambSky+3]=1/PLN_GPU.shn;
  const cl=F.clouds||[],nc=Math.min(8,cl.length);
  a[PLN_G.world+2]=nc;
  for(let k=0;k<nc;k++)a.set(cl[k],200+k*4);
  return a;
}
function plnGpuWrite(F){
  const Q=PLN_GPU,q=GPU.dev.queue,U=Q.U,A=Q.ga,w=Q.w,h=Q.h;
  const e=F.eye,er=[e[0],2*F.waterY-e[1],e[2]];
  q.writeBuffer(U.main,0,plnGlobals(A[0],F,{vp:F.vp,l0:F.L0.m,eye:e,w,h}));
  if(F.mirror)q.writeBuffer(U.refl,0,plnGlobals(A[1],F,{vp:F.vpMirror,l0:F.L0.m,eye:er,w:Math.max(1,w>>1),h:Math.max(1,h>>1),clip:true}));
  q.writeBuffer(U.sh0,0,plnGlobals(A[2],F,{vp:F.vp,l0:F.L0.m,eye:e,w:Q.shn,h:Q.shn}));
  q.writeBuffer(U.sh1,0,plnGlobals(A[3],F,{vp:F.vp,l0:F.L1.m,eye:e,w:Q.shn,h:Q.shn}));
  if(F.wing)q.writeBuffer(U.wing,0,plnGlobals(A[4],F,{vp:F.vp,l0:F.L0.m,eye:e,w:Math.max(1,w>>1),h:Math.max(1,h>>1),wing:true}));
  q.writeBuffer(U.blobs,0,F.blobs);
  const P=F.post||{};
  q.writeBuffer(Q.pp.shafts,0,new Float32Array(P.shafts||[.0024,1600,.62,-.06]));
  q.writeBuffer(Q.pp.comp,0,new Float32Array([P.bloom===undefined?.085:P.bloom,P.vig===undefined?.42:P.vig,P.grade===undefined?1:P.grade,0]));
}

/* ── кадр ──
   F.batches — что рисовать: {geo, inst|null, kind, to, ride}; ride — цельная сетка дальнего мира;
   first и count — отрезок записей, когда в одном буфере лежат записи разных тел (21pga).
   Возвращает false, если сдавать кадр некуда */
function plnGpuFrame(F){
  const Q=PLN_GPU,e=GPU.enc,P=Q.P,B=Q.B,V=Q.V,D=Q.D,ms=Q.ms;
  F.mirror=F.waterY>-1e4&&F.batches.some(b=>b.kind===PLN_KIND.water&&b.geo.n>0);
  F.wing=F.batches.some(b=>b.kind===PLN_KIND.wing&&b.geo.n>0);
  plnGpuWrite(F);
  let tris=0,calls=0;
  const some=(p,to,kind)=>{
    for(const b of F.batches){
      if(b.kind!==kind||!(b.to&to)||!b.geo||b.geo.n<=0||b.geo.gen!==Q.gen)continue;
      const I=b.inst;if(I&&(I.n<=0||I.gen!==Q.gen))continue;
      const n=I?(b.count==null?I.n:b.count):1;
      if(n<=0)continue;
      p.setVertexBuffer(0,b.geo.vb);p.setVertexBuffer(1,I?I.buf:(b.ride?Q.oneRide:Q.one));
      p.setIndexBuffer(b.geo.ib,"uint32");p.drawIndexed(b.geo.n,n,0,0,I?(b.first||0):0);
      calls++;tris+=b.geo.n/3*n;
    }
  };
  for(let l=0;l<2;l++){
    const p=e.beginRenderPass({colorAttachments:[],timestampWrites:gpuTs("pln.shadow"),
      depthStencilAttachment:{view:D.shv[l],depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
    p.setPipeline(P.shadow);p.setBindGroup(0,B.sh[l]);some(p,l?PLN_TO.sh1:PLN_TO.sh0,PLN_KIND.body);p.end();
  }
  const bg={r:.42,g:.5,b:.55,a:1};
  if(F.mirror){
    const p=e.beginRenderPass({colorAttachments:[{view:V.refl,clearValue:bg,loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs("pln.mirror"),
      depthStencilAttachment:{view:V.reflD,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"discard"}});
    p.setBindGroup(0,B.refl);p.setPipeline(P.sky1);p.draw(3);
    p.setPipeline(P.body1);some(p,PLN_TO.mirror,PLN_KIND.body);p.end();
  }
  {
    const col=ms>1?{view:V.ms,resolveTarget:V.hdr,clearValue:bg,loadOp:"clear",storeOp:"discard"}
      :{view:V.hdr,clearValue:bg,loadOp:"clear",storeOp:"store"};
    const p=e.beginRenderPass({colorAttachments:[col],timestampWrites:gpuTs("pln.scene"),
      depthStencilAttachment:{view:V.depth,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"}});
    p.setBindGroup(0,B.main);p.setPipeline(P["sky"+ms]);p.draw(3);
    p.setPipeline(P["body"+ms]);some(p,PLN_TO.main,PLN_KIND.body);
    if(F.mirror){p.setPipeline(P["water"+ms]);some(p,PLN_TO.main,PLN_KIND.water);}
    p.end();
  }
  const full=(view,pipe,bind,name)=>{
    const p=e.beginRenderPass({colorAttachments:[{view,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs(name)});
    p.setPipeline(pipe);p.setBindGroup(0,bind);p.draw(3);p.end();
  };
  if(F.wing){
    const p=e.beginRenderPass({colorAttachments:[{view:V.wing,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs("pln.wing"),
      depthStencilAttachment:{view:V.wingD,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"discard"}});
    p.setBindGroup(0,B.wing);p.setPipeline(P.body1);some(p,PLN_TO.main,PLN_KIND.wing);p.end();
    full(V.wa,P.blur,B.wingBlur[0],"pln.wing");full(V.wb,P.blur,B.wingBlur[1],"pln.wing");
    full(V.wa,P.blur,B.wingBlur[2],"pln.wing");full(V.wb,P.blur,B.wingBlur[3],"pln.wing");
  }
  full(V.sha,P.shafts,B.shafts,"pln.air");
  full(V.shb,P.blur,B.shBlur[0],"pln.air");full(V.sha,P.blur,B.shBlur[1],"pln.air");
  const NB=V.down.length;
  for(let k=0;k<NB;k++)full(V.down[k],P.down,B.down[k],"pln.bloom");
  for(let k=NB-2;k>=0;k--)full(V.up[k],P.up,B.up[k],"pln.bloom");
  PLN.stat.tris=Math.round(tris);PLN.stat.calls=calls;
  const sp=gpuScene();
  if(!sp)return false;
  sp.setPipeline(P.comp);sp.setBindGroup(0,F.wing?B.comp:B.comp0);sp.draw(3);
  return true;
}
