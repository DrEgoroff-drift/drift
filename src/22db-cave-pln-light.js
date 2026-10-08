/* ══════════════ пещера на движке: рендер (M630a) ══════════════
   Устройство и сетки — движка (21pe): те же две очереди вершин, тот же счётчик пересборок,
   тот же ярус. Своё — шейдеры (22dbw) и проходы: карта тени фонаря (перспективная, только
   порода: человек сидит на его шлеме), карта тени дня над устьем (порода, разрез, человек),
   сцена, свет в воздухе в долю кадра, свечение, свёртка в сцену движка.
   Кадр F собирает 22dc: vp, eye, t, lamp {p,d}, reach, near, sun, dayK, mouth, lean, surfY,
   lights [{p,r,c}], glows [{p,c,k,s}], skyLo, skyHi, draw [{geo,inst?,first,n,lamp,sun}]. */
const CAVE3_GPU={dev:null,gen:-1,tier:-1,w:0,h:0,shn:0,ms:1,L:null,P:{},U:null,S:null,D:null,T:null,V:null,B:null,pp:null,
  ga:[0,1,2,3].map(()=>new Float32Array(288)),stat:{tris:0,calls:0}};
/* числа стенда (docs/look/cv-render.js): тьма, воздух, фонарь, день */
const CAVE3_K={amb:[.036,.054,.083],fogC:[.045,.08,.12],fog:.022,
  lampCol:[4,3.1,1.95],inner:32*PLN_DEG,outer:58*PLN_DEG,fall:3.2,fov:128*PLN_DEG,day:[1.3,1.42,1.4],
  air:[.026,.02,.065],airReach:140,comp:[.10,.36,1,0]};

function cave3Log(s){plnLog("пещера: "+s);}
function cave3Persp(fovy,asp,n,f){
  const s=1/Math.tan(fovy/2),o=new Float32Array(16);
  o[0]=s/asp;o[5]=s;o[10]=f/(f-n);o[11]=1;o[14]=-n*f/(f-n);
  return o;
}
/* карта дня: смотрит вдоль луча сверху, короб — то, что под устьем */
function cave3DayBox(sun,b){
  const c=[(b[0]+b[1])/2,(b[2]+b[3])/2,(b[4]+b[5])/2];
  const view=plnM4look([c[0]+sun[0]*200,c[1]+sun[1]*200,c[2]+sun[2]*200],c,[0,0,1]);
  const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  for(let k=0;k<8;k++){
    const x=b[k&1],y=b[2+(k>>1&1)],z=b[4+(k>>2&1)];
    const p=[view[0]*x+view[4]*y+view[8]*z+view[12],view[1]*x+view[5]*y+view[9]*z+view[13],view[2]*x+view[6]*y+view[10]*z+view[14]];
    for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],p[a]);mx[a]=Math.max(mx[a],p[a]);}
  }
  const n=mn[2]-10,f=mx[2]+5;
  return {m:plnM4mul(plnM4ortho(mn[0],mx[0],mn[1],mx[1],n,f),view),range:f-n};
}

/* ── то, что живёт с устройством ── */
function cave3GpuDev(){
  const Q=CAVE3_GPU,d=GPU.dev;
  if(Q.dev===d&&Q.gen===PLN_GPU.gen)return;
  Q.dev=d;Q.gen=PLN_GPU.gen;Q.tier=-1;Q.w=0;Q.h=0;Q.T=null;Q.P={};
  const VF=GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,FR=GPUShaderStage.FRAGMENT;
  const dep=b=>({binding:b,visibility:FR,texture:{sampleType:"depth"}});
  Q.L={scene:d.createBindGroupLayout({entries:[{binding:0,visibility:VF,buffer:{type:"uniform"}},dep(1),dep(2),
      {binding:3,visibility:FR,sampler:{type:"comparison"}},{binding:4,visibility:FR,texture:{sampleType:"float"}},
      {binding:5,visibility:FR,sampler:{type:"filtering"}}]}),
    shadow:d.createBindGroupLayout({entries:[{binding:0,visibility:VF,buffer:{type:"uniform"}}]}),post:null};
  Q.S={lin:d.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),
    cmp:d.createSampler({compare:"less",magFilter:"linear",minFilter:"linear"})};
  const ub=()=>d.createBuffer({size:1152,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  Q.U={main:ub(),shL:ub(),shS:ub(),refl:ub()};
}
/* ── то, что живёт с ярусом: карты теней, привязка свёртки, конвейеры ── */
function cave3GpuTier(){
  const Q=CAVE3_GPU,d=GPU.dev,Z=PLN_GPU;
  if(Q.tier===Z.tier&&Q.P.comp)return;
  Q.tier=Z.tier;Q.ms=Z.ms;Q.shn=Math.min(Z.shn,2048);Q.w=0;Q.h=0;
  const FR=GPUShaderStage.FRAGMENT,VF=GPUShaderStage.VERTEX|FR,tx=b=>({binding:b,visibility:FR,texture:{sampleType:"float"}});
  Q.L.post=d.createBindGroupLayout({entries:[{binding:0,visibility:VF,buffer:{type:"uniform"}},{binding:1,visibility:FR,buffer:{type:"uniform"}},
    tx(2),tx(3),tx(4),{binding:5,visibility:FR,sampler:{type:"filtering"}},
    {binding:6,visibility:FR,texture:{sampleType:"depth",multisampled:Q.ms>1}},
    {binding:7,visibility:FR,texture:{sampleType:"depth"}},{binding:8,visibility:FR,texture:{sampleType:"depth"}},
    {binding:9,visibility:FR,sampler:{type:"comparison"}}]});
  if(Q.D){Q.D.lamp.destroy();Q.D.sun.destroy();}
  const RT=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING;
  const lamp=d.createTexture({size:[Q.shn,Q.shn,1],format:PLN_DEP,usage:RT}),sun=d.createTexture({size:[Q.shn,Q.shn,1],format:PLN_DEP,usage:RT});
  Q.D={lamp,sun,lampV:lamp.createView(),sunV:sun.createView()};
  const L=Q.L;
  /* привязки сцены зависят от зеркала (размер кадра) — их собирает cave3GpuSize */
  Q.B0={main:null,refl:null,
    sh:[Q.U.shL,Q.U.shS].map(u=>d.createBindGroup({layout:L.shadow,entries:[{binding:0,resource:{buffer:u}}]}))};
  /* глубина сцены при сглаживании многовыборочная: воздух читает её первую выборку */
  const post=Q.ms>1?CAVE3_WGSL_POST.replace("var depthTex: texture_depth_2d;","var depthTex: texture_depth_multisampled_2d;"):CAVE3_WGSL_POST;
  const mS=gpuShader(CAVE3_WGSL_SCENE),mP=gpuShader(post);
  for(const [n,m] of [["сцена",mS],["свёртка",mP]])m.getCompilationInfo().then(i=>{
    for(const x of i.messages)if(x.type==="error")cave3Log("wgsl "+n+" "+x.lineNum+":"+x.linePos+" "+x.message);}).catch(()=>{});
  const lS=d.createPipelineLayout({bindGroupLayouts:[L.scene]}),lH=d.createPipelineLayout({bindGroupLayouts:[L.shadow]}),
    lP=d.createPipelineLayout({bindGroupLayouts:[L.post]});
  const prim={topology:"triangle-list",cullMode:"none"},mu={count:Q.ms};
  const mk=(key,desc)=>{Q.P[key]=gpuPipeline("cave3."+key+(/^(sky|body|water)$/.test(key)?Q.ms:""),()=>desc);};
  mk("shadow",{layout:lH,vertex:{module:mS,entryPoint:"vs_shadow",buffers:PLN_VB},primitive:prim,
    depthStencil:{format:PLN_DEP,depthWriteEnabled:true,depthCompare:"less",depthBias:2,depthBiasSlopeScale:2.2}});
  mk("sky",{layout:lS,vertex:{module:mS,entryPoint:"vs_full"},fragment:{module:mS,entryPoint:"fs_sky",targets:[{format:PLN_HDR}]},
    primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:false,depthCompare:"always"},multisample:mu});
  mk("body",{layout:lS,vertex:{module:mS,entryPoint:"vs_main",buffers:PLN_VB},fragment:{module:mS,entryPoint:"fs_main",targets:[{format:PLN_HDR}]},
    primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:true,depthCompare:"greater"},multisample:mu});
  /* зеркало: та же сцена в полкадра без сглаживания; вода — поверх породы, глубину не пишет */
  mk("bodyR",{layout:lS,vertex:{module:mS,entryPoint:"vs_main",buffers:PLN_VB},fragment:{module:mS,entryPoint:"fs_main",targets:[{format:PLN_HDR}]},
    primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:true,depthCompare:"greater"}});
  mk("water",{layout:lS,vertex:{module:mS,entryPoint:"vs_main",buffers:PLN_VB},fragment:{module:mS,entryPoint:"fs_water",targets:[{format:PLN_HDR,
      blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},
    primitive:prim,depthStencil:{format:PLN_DEP,depthWriteEnabled:false,depthCompare:"greater"},multisample:mu});
  const pp=(fs,tg)=>({layout:lP,vertex:{module:mP,entryPoint:"vs_full"},fragment:{module:mP,entryPoint:fs,targets:[tg||{format:PLN_HDR}]},primitive:prim});
  mk("blur",pp("fs_blur"));mk("down",pp("fs_down"));mk("up",pp("fs_up"));mk("air",pp("fs_air"));
  /* свёртка пишет в сцену движка; её альфу не трогаем */
  mk("comp",pp("fs_comp",{format:PLN_HDR,writeMask:GPUColorWrite.RED|GPUColorWrite.GREEN|GPUColorWrite.BLUE}));
}
/* ── то, что живёт с размером кадра ── */
function cave3GpuSize(){
  const Q=CAVE3_GPU,d=GPU.dev,w=GPU.bw,h=GPU.bh,Z=PLN_GPU;
  if(Q.T&&Q.w===w&&Q.h===h)return;
  if(Q.T)for(const t of Q.T.all)t.destroy();
  if(Q.pp)for(const b of Q.pp)b.destroy();
  Q.w=w;Q.h=h;
  const RT=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,all=[];
  const tex=(tw,th,format,n,usage)=>{const t=d.createTexture({size:[Math.max(1,tw|0),Math.max(1,th|0),1],format,sampleCount:n||1,usage:usage||RT});all.push(t);return t;};
  const dv=(n,k)=>Math.max(1,Math.floor(n/k)),NB=Z.blN,aw=dv(w,Z.shD),ah=dv(h,Z.shD);
  const T={all,hdr:tex(w,h,PLN_HDR),depth:tex(w,h,PLN_DEP,Q.ms),ms:Q.ms>1?tex(w,h,PLN_HDR,Q.ms,GPUTextureUsage.RENDER_ATTACHMENT):null,
    air:tex(aw,ah,PLN_HDR),airB:tex(aw,ah,PLN_HDR),down:[],up:[],dummy:tex(1,1,PLN_HDR),
    refl:tex(w>>1,h>>1,PLN_HDR),reflD:tex(w>>1,h>>1,PLN_DEP)};
  for(let k=0;k<NB;k++){T.down.push(tex(w>>(k+1),h>>(k+1),PLN_HDR));T.up.push(tex(w>>(k+1),h>>(k+1),PLN_HDR));}
  const V={};for(const k in T)if(k!=="all"&&T[k])V[k]=Array.isArray(T[k])?T[k].map(t=>t.createView()):T[k].createView();
  Q.T=T;Q.V=V;Q.pp=[];
  const S=Q.S,D=Q.D,L=Q.L;
  const scene=(u,rt)=>d.createBindGroup({layout:L.scene,entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:D.lampV},
    {binding:2,resource:D.sunV},{binding:3,resource:S.cmp},{binding:4,resource:rt},{binding:5,resource:S.lin}]});
  Q.B0.main=scene(Q.U.main,V.refl);Q.B0.refl=scene(Q.U.refl,V.dummy);
  const post=(a,texs,b)=>{
    const u=d.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    b=b||[];
    d.queue.writeBuffer(u,0,new Float32Array([a[0],a[1],a[2]||0,a[3]||0,b[0]||0,b[1]||0,b[2]||0,b[3]||0]));
    Q.pp.push(u);
    const t=k=>texs[k]||V.dummy;
    return d.createBindGroup({layout:L.post,entries:[{binding:0,resource:{buffer:Q.U.main}},{binding:1,resource:{buffer:u}},
      {binding:2,resource:t(0)},{binding:3,resource:t(1)},{binding:4,resource:t(2)},{binding:5,resource:S.lin},
      {binding:6,resource:V.depth},{binding:7,resource:D.lampV},{binding:8,resource:D.sunV},{binding:9,resource:S.cmp}]});
  };
  const K=CAVE3_K,B={air:post([K.air[0],K.air[1],K.air[2],Z.shN],[],[K.airReach]),
    airBlur:[post([1.2/aw,0],[V.air]),post([0,1.2/ah],[V.airB])],down:[],up:[]};
  for(let k=0;k<NB;k++){const src=k?T.down[k-1]:T.hdr;B.down.push(post([1/src.width,1/src.height],[k?V.down[k-1]:V.hdr]));}
  for(let k=NB-2;k>=0;k--){const lo=k===NB-2?T.down[NB-1]:T.up[k+1];B.up[k]=post([1/lo.width,1/lo.height,.62],[k===NB-2?V.down[NB-1]:V.up[k+1],V.down[k]]);}
  B.comp=post(K.comp,[V.hdr,V.up[0],V.air]);
  Q.B=B;
}
function cave3GpuReady(){
  if(!plnGpuReady())return false;
  /* конвейер, что не собрался, не рисует молча пустоту: пещера уходит к старой рисовалке и называет причину */
  const d=GPU.dev,re=(CAVE3_GPU.tier!==PLN_GPU.tier||!CAVE3_GPU.P.comp)&&typeof d.pushErrorScope==="function";
  if(re)d.pushErrorScope("validation");
  cave3GpuDev();cave3GpuTier();
  if(re)d.popErrorScope().then(e=>{if(e){CAVE3.bad=3;CAVE3.err="конвейер: "+String(e.message).slice(0,400);cave3Log(CAVE3.err);}}).catch(()=>{});
  cave3GpuSize();
  return true;
}

/* ── числа кадра: блок Globals (22dbw), 288 чисел ── */
function cave3Globals(a,F,vp,lamp,w,h){
  const K=CAVE3_K,l=F.lamp,dk=F.dayK;
  a.fill(0);
  a.set(vp,0);plnM4inv(vp,PLN_GPU.inv);a.set(PLN_GPU.inv,16);a.set(lamp||F.lampVP,32);a.set(F.sunVP,48);
  a.set([F.eye[0],F.eye[1],F.eye[2],F.t],64);
  a.set([l.p[0],l.p[1],l.p[2],K.fall],68);
  a.set([l.d[0],l.d[1],l.d[2],Math.cos(K.outer)],72);
  a.set([K.lampCol[0]*l.k,K.lampCol[1]*l.k,K.lampCol[2]*l.k,Math.cos(K.inner)],76);
  a.set([F.sun[0],F.sun[1],F.sun[2],F.lake?F.lake.y:-1e4],80);
  a.set([K.day[0]*dk,K.day[1]*dk,K.day[2]*dk,F.expo],84);
  a.set([w,h,1/w,1/h],88);
  a.set([F.clipY||0,F.clip||0,F.cutZ,K.fog],92);
  a.set([K.amb[0],K.amb[1],K.amb[2],F.bed],96);
  a.set([K.fogC[0],K.fogC[1],K.fogC[2],.08/F.sunRange],100);
  F.lights.slice(0,12).forEach((q,k)=>{a.set([q.p[0],q.p[1],q.p[2],q.r],104+k*4);a.set([q.c[0],q.c[1],q.c[2],0],152+k*4);});
  F.glows.slice(0,6).forEach((q,k)=>{a.set([q.p[0],q.p[1],q.p[2],q.k],200+k*4);a.set([q.c[0],q.c[1],q.c[2],q.s||1.4],224+k*4);});
  a.set(F.mouth,248);
  a.set([F.lean[0],F.lean[1],F.surfY,F.reach],252);
  a.set([F.skyLo[0],F.skyLo[1],F.skyLo[2],dk],256);
  a.set([F.skyHi[0],F.skyHi[1],F.skyHi[2],F.near],260);
  if(F.zones)F.zones.forEach((z,k)=>a.set([z[0],z[1],z[2],0],264+k*4));
  a.set(F.farDay||[0,0,1,0],280);a.set([F.farK||0,0,0,0],284);
  return a;
}

/* ── кадр ── */
function cave3GpuFrame(F){
  const Q=CAVE3_GPU,e=GPU.enc,P=Q.P,B=Q.B,V=Q.V,D=Q.D,d=GPU.dev,ms=Q.ms,ga=Q.ga;
  d.queue.writeBuffer(Q.U.main,0,cave3Globals(ga[0],F,F.vp,null,Q.w,Q.h));
  d.queue.writeBuffer(Q.U.shL,0,cave3Globals(ga[1],F,F.vp,F.lampVP,Q.shn,Q.shn));
  d.queue.writeBuffer(Q.U.shS,0,cave3Globals(ga[2],F,F.vp,F.sunVP,Q.shn,Q.shn));
  let tris=0,calls=0;
  const run=(p,pick,list)=>{
    for(const g of list||[]){
      if(!g||g.gen!==PLN_GPU.gen||g.n<=0)continue;
      p.setVertexBuffer(0,g.vb);p.setVertexBuffer(1,PLN_GPU.one);p.setIndexBuffer(g.ib,"uint32");
      p.drawIndexed(g.n,1,0,0,0);calls++;tris+=g.n/3;
    }
    if(list)return;
    for(const b of F.draw){
      const g=b.geo;if(!g||g.gen!==PLN_GPU.gen||!pick(b))continue;
      const I=b.inst;if(I&&(I.n<=0||I.gen!==PLN_GPU.gen))continue;
      const n=b.n==null?g.n:b.n;if(n<=0)continue;
      p.setVertexBuffer(0,g.vb);p.setVertexBuffer(1,I?I.buf:PLN_GPU.one);p.setIndexBuffer(g.ib,"uint32");
      p.drawIndexed(n,I?I.n:1,b.first||0,0,0);calls++;tris+=n/3*(I?I.n:1);
    }
  };
  /* человека нет в карте его фонаря: фонарь сидит на шлеме */
  [[D.lampV,0,b=>b.lamp],[D.sunV,1,b=>b.sun]].forEach(([v,l,pick])=>{
    if(l===1&&F.dayK<=.01)return;
    const p=e.beginRenderPass({colorAttachments:[],timestampWrites:gpuTs("cave3.shadow"),
      depthStencilAttachment:{view:v,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
    p.setPipeline(P.shadow);p.setBindGroup(0,Q.B0.sh[l]);run(p,pick);p.end();
  });
  const bg={r:CAVE3_K.fogC[0],g:CAVE3_K.fogC[1],b:CAVE3_K.fogC[2],a:1},lake=F.lake&&F.water&&F.water.length;
  /* зеркало озера: сцена, отражённая в уровне воды, в полкадра; что под водой — отрезано */
  if(lake){
    const y=F.lake.y,Fm=Object.assign({},F,{eye:[F.eye[0],2*y-F.eye[1],F.eye[2]],clipY:y+.02,clip:1});
    d.queue.writeBuffer(Q.U.refl,0,cave3Globals(ga[3],Fm,plnM4mul(F.vp,plnM4mirrorY(y)),null,Q.T.refl.width,Q.T.refl.height));
    const p=e.beginRenderPass({colorAttachments:[{view:V.refl,clearValue:bg,loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs("cave3.refl"),
      depthStencilAttachment:{view:V.reflD,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"discard"}});
    p.setBindGroup(0,Q.B0.refl);p.setPipeline(P.bodyR);run(p,b=>b.refl);p.end();
  }
  {
    const col=ms>1?{view:V.ms,resolveTarget:V.hdr,clearValue:bg,loadOp:"clear",storeOp:"discard"}:{view:V.hdr,clearValue:bg,loadOp:"clear",storeOp:"store"};
    const p=e.beginRenderPass({colorAttachments:[col],timestampWrites:gpuTs("cave3.scene"),
      depthStencilAttachment:{view:V.depth,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"}});
    p.setBindGroup(0,Q.B0.main);p.setPipeline(P.sky);p.draw(3);
    p.setPipeline(P.body);run(p,()=>true);
    if(lake){p.setPipeline(P.water);run(p,null,F.water);}
    p.end();
  }
  const full=(view,pipe,bind,name)=>{
    const p=e.beginRenderPass({colorAttachments:[{view,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs(name)});
    p.setPipeline(pipe);p.setBindGroup(0,bind);p.draw(3);p.end();
  };
  full(V.air,P.air,B.air,"cave3.air");
  full(V.airB,P.blur,B.airBlur[0],"cave3.air");full(V.air,P.blur,B.airBlur[1],"cave3.air");
  const NB=V.down.length;
  for(let k=0;k<NB;k++)full(V.down[k],P.down,B.down[k],"cave3.bloom");
  for(let k=NB-2;k>=0;k--)full(V.up[k],P.up,B.up[k],"cave3.bloom");
  Q.stat.tris=Math.round(tris);Q.stat.calls=calls;
  const sp=gpuScene();
  if(!sp)return false;
  sp.setPipeline(P.comp);sp.setBindGroup(0,B.comp);sp.draw(3);
  return true;
}
