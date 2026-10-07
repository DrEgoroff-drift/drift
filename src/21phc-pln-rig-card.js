/* ══════════════ планета: человек в карточке — один астронавт везде (M801) ══════════════
   Закон L2 (docs/DESIGN-remake.md §2): человек — риг планеты (21pha), и только он. Где режим
   плоский (база в разрезе, пещера, абордаж), риг рисуется в карточку — текстуру вне кадра — и
   режим кладёт её gpuImage на своё место. Сетка, гнёзда комплекта и книга поз — те же, что на
   грунте: plnManBuild строит части, plnManPose ставит кости; здесь только свой объектив (вид
   сбоку, поворот к объективу, наклон), свой свет (свет зовущего режима) и своя цель.

   ПРАВИЛА ФАЙЛА:
   1. Поз не выдумываем: стоя, шаг (фаза по восьми ступеням), и всё, что лежит в книге рига
      (PLN_MAN_POSE: воздух, факел, падение, круг, бур). Сидеть и снять шлем риг не умеет — такие
      фигуры режим пока рисует старой кистью (база: сидящие и жилой отсек).
   2. Живой человек грунта не трогается: сглаженные доли поз (PLN_MAN.k), кости (PLN_MAN.W) и
      PLN_DRILL.on подменяются на время позы и возвращаются; вершины пишутся в свою копию.
   3. Карточка рисуется своим кодировщиком и отправляется сразу (как студия h3dRun): кадр, что
      её положит, отправится позже. Цель ×4 с глубиной — общая на размер, сведённая — у карточки.
   4. Кэш — по позе, ступени фазы, повороту, наклону, мерке, плотности, свету и краске; живых
      карточек не больше RIG_CARD.cap, лишняя уходит в GPU.trash (старшая по последнему спросу).
   5. Рост — закон: 1.8 м в мерке режима (ppm — пикселей CSS на метр). Режим свою мерку не
      меняет ради карточки; доля кадра меряется и пишется в отчёт (docs/DESIGN-remake.md §4). */
const RIG_CARD={on:true,cap:24,
  M:new Map(),                          /* ключ → карточка {tex,view,w,h,ppm,...} */
  MS:new Map(),                         /* размер → цель ×4 (цвет и глубина) */
  mesh:{},                              /* краска → части рига и своя копия вершин */
  dev:null,P:null,ub:null,bg:null,U:new Float32Array(48),
  W:[],                                 /* свои кости позы */
  made:0,                               /* сколько карточек нарисовано */
  by:{base:0,cave:0,raid:0},            /* сколько раз режимы положили карточку */
  q:[],baseQ:false,walk:0,face:{base:1},
  last:{}};                             /* последняя карточка режима: ноги, мерка, рост в пикселях — для отчёта и набора */
/* рамка карточки в метрах, ноги на нуле: ранец и факел сзади, руки вперёд, круг — ноги назад */
const RIG_BOX={x0:-.95,x1:.95,y0:-.32,y1:2.12};
const RIG_H=1.8;                        /* рост человека, м (DESIGN-planet-style §4.1) */
/* позы карточки: стоя и шаг — из походки рига, остальные — ключи его книги */
const RIG_POSES=["stand","walk"].concat(Object.keys(PLN_MAN_POSE));
const RIG_ALIAS={jump:"air"};

/* краска гнёзд: «own» — комплект игрока (plnManPalette), «issue» — выдача смены базы (семейство I,
   те же числа, что plnManPalette берёт без комплекта) */
function rigCardPal(pal){
  if(pal!=="issue")return plnManPalette();
  const df={main:"#b9c2c9",dark:"#7d8793",acc:"#f2b25c"},out={};
  for(const p of ["helmet","torso","gloves","boots","pack","lamp"])
    out[p]={main:plnManCss(df.main),dark:plnManCss(df.dark),acc:plnManCss(df.acc)};
  out.visor=null;
  return out;
}
function rigCardMesh(pal,low){
  const P=rigCardPal(pal),key=pal+(low?"L":"")+JSON.stringify(P),id=pal+(low?"L":"");
  let M=RIG_CARD.mesh[id];
  if(!M||M.key!==key){
    if(M&&M.vb&&M.dev===GPU.dev)GPU.trash.push(M.vb,M.ib);
    const b=plnManBuild(P,!!low);
    if(pal==="issue")rigCardIssueTint(b.parts);
    M=RIG_CARD.mesh[id]={key,parts:b.parts,V:new Float32Array(b.V),nv:b.nv,ni:b.ni,I:b.I,dev:null,vb:null,ib:null};
  }
  return M;
}
/* смена базы — в рабочем сером комбинезоне выдачи, оранжевый людей остаётся герою (L6: один
   герой в кадре; в разрезе двадцать оранжевых фигур — ни одного). Сетка та же, перекрашено
   только тело: оранжевый и его тень рига (21pha plnManBuild) → сланец и его тень */
function rigCardIssueTint(parts){
  const A=plnHex("#ee7326"),Ad=plnHex("#c4581c"),B=plnHex("#5d6c7c"),Bd=plnHex("#434f5c");
  const eq=(v,i,c)=>Math.abs(v[i]-c[0])<1e-4&&Math.abs(v[i+1]-c[1])<1e-4&&Math.abs(v[i+2]-c[2])<1e-4;
  for(const q of parts){const v=q.m.v;
    for(let k=0;k<q.m.nv;k++){const i=k*PLN_VS+6,c=eq(v,i,A)?B:eq(v,i,Ad)?Bd:null;
      if(c){v[i]=c[0];v[i+1]=c[1];v[i+2]=c[2];}}}
}
/* состояние позы и доли поз уже на месте (сглаживание рига тогда ничего не двигает) */
function rigCardState(pose,phase,lamp){
  const st={phase:phase||0,amp:0,on:true,jet:false,vy:0,swim:0,t:0,lamp:lamp||0,drill:false,low:false};
  const K={air:0,jet:0,fall:0,drill:0};
  if(pose==="walk")st.amp=1;
  else if(pose==="air"){st.on=false;K.air=1;}
  else if(pose==="jet"){st.on=false;st.jet=true;K.air=1;K.jet=1;}
  else if(pose==="fall"){st.on=false;st.vy=1;K.air=1;K.fall=1;}
  else if(pose==="swim")st.swim=1;
  else if(pose==="drill"){st.drill=true;K.drill=1;}
  return {st,K};
}
/* поза в вершины M.V (система рига: x вперёд, y вверх, z вглубь, ноги на нуле) — правило 2 */
function rigCardPose(M,pose,phase,lamp){
  const {st,K}=rigCardState(pose,phase,lamp),Q=PLN_MAN,k0=Q.k,W0=Q.W,d0=PLN_DRILL.on;
  Q.k=K;Q.W=RIG_CARD.W;PLN_DRILL.on=st.drill?1:0;
  try{
    const W=plnManPose(st),V=M.V;
    for(const q of M.parts){
      const w=W[q.bone],c=w.c,s=w.s,src=q.m.v,n=q.m.nv;
      if(q.dyn==="flame"){plnManFlame(st,V,q.off,w);continue;}
      if(q.dyn==="tool"){plnDrillWrite(st,V,q.off,w,q.m);continue;}
      const d=q.dyn?q.dyn(st):null;let o=q.off*PLN_VS;
      for(let k=0;k<n;k++){
        const i=k*PLN_VS,px=src[i],py=src[i+1],nx=src[i+3],ny=src[i+4];
        V[o]=c*px-s*py+w.x;V[o+1]=s*px+c*py+w.y;V[o+2]=src[i+2]+w.z;
        V[o+3]=c*nx-s*ny;V[o+4]=s*nx+c*ny;V[o+5]=src[i+5];
        V[o+6]=src[i+6];V[o+7]=src[i+7];V[o+8]=src[i+8];V[o+9]=src[i+9];V[o+11]=src[i+11];V[o+12]=src[i+12];
        if(d){if(d.mat!=null)V[o+9]=d.mat;if(d.glow!=null)V[o+11]=d.glow;if(d.x!=null)V[o+12]=d.x;}
        o+=PLN_VS;
      }
    }
  }finally{Q.k=k0;Q.W=W0;PLN_DRILL.on=d0;}
  return M;
}
/* поворот объектива: yaw вокруг вертикали (0 — лицом вправо, π — влево, −π/2 — спиной к нам),
   tilt — объектив выше человека и смотрит вниз. Строки матрицы (система карточки: x вправо,
   y вверх, z от нас) */
function rigCardRot(yaw,tilt){
  const c=Math.cos(yaw),s=Math.sin(yaw),ct=Math.cos(tilt||0),stt=Math.sin(tilt||0);
  return [[c,0,s],[-s*stt,ct,c*stt],[-s*ct,-stt,c*ct]];
}
/* рамка позы в системе карточки — для набора: ни одна поза не вылезает из RIG_BOX */
function rigCardBounds(pose,phase,yaw,tilt){
  pose=RIG_ALIAS[pose]||pose;
  const M=rigCardPose(rigCardMesh("issue",false),pose,phase||0,0),R=rigCardRot(yaw||0,tilt||0),V=M.V;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(let k=0;k<M.nv;k++){const o=k*PLN_VS,px=V[o],py=V[o+1],pz=V[o+2];
    const x=R[0][0]*px+R[0][1]*py+R[0][2]*pz,y=R[1][0]*px+R[1][1]*py+R[1][2]*pz;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  return {x0,x1,y0,y1};
}

const RIG_CARD_WGSL=`
struct U{r0:vec4f,r1:vec4f,r2:vec4f,box:vec4f,kd:vec4f,kc:vec4f,sky:vec4f,gnd:vec4f,ad:vec4f,ac:vec4f,mi:vec4f};
@group(0) @binding(0) var<uniform> u:U;
struct VO{@builtin(position) p:vec4f,@location(0) n:vec3f,@location(1) c:vec3f,@location(2) q:vec4f};
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) c:vec3f,@location(3) q:vec4f)->VO{
  let v=vec3f(dot(u.r0.xyz,p),dot(u.r1.xyz,p),dot(u.r2.xyz,p));
  var o:VO;
  o.p=vec4f((v.x-u.box.x)/u.box.z,(v.y-u.box.y)/u.box.w,clamp(.5+v.z*.2,0.,1.),1.);
  o.n=vec3f(dot(u.r0.xyz,n),dot(u.r1.xyz,n),dot(u.r2.xyz,n));o.c=c;o.q=q;return o;}
fn neutral(cin:vec3f)->vec3f{
  let startC=.76;let desat=.15;let x=min(cin.r,min(cin.g,cin.b));
  var off=.04;if(x<.08){off=x-6.25*x*x;}
  var c=cin-off;let peak=max(c.r,max(c.g,c.b));if(peak<startC){return c;}
  let d=1.-startC;let np=1.-d*d/(peak+d-startC);c*=np/peak;
  let k=1.-1./(desat*(peak-np)+1.);return mix(c,vec3f(np),k);}
fn unshoulder(d:vec3f)->vec3f{
  let x=clamp(d,vec3f(0.),vec3f(.999));let hi=.75-.25*log(max(1.-(x-.75)/.25,vec3f(.004)));
  return select(x,hi,x>vec3f(.75));}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let mat=i32(round(i.q.x));let glow=i.q.z;let ex=i.q.w;
  var c:vec3f;
  if(mat==5){c=i.c*glow;}
  else{
    let N=normalize(i.n);let L=normalize(u.kd.xyz);let V=vec3f(0.,0.,-1.);
    let ndl=dot(N,L);let lit=smoothstep(-.02,.30,ndl);
    let amb=mix(u.gnd.rgb,u.sky.rgb,N.y*.5+.5);
    c=i.c*(u.kc.rgb*lit+amb);
    /* свет из-за спины рисует освещённый край: тело стоит в воздухе, а не на фоне */
    let rim=pow(1.-clamp(dot(N,V),0.,1.),2.2);
    c+=u.kc.rgb*rim*smoothstep(-.4,.4,ndl)*.75*mix(i.c,vec3f(1.),.4);
    let hv=normalize(L+V);c+=u.kc.rgb*pow(clamp(dot(N,hv),0.,1.),60.)*ex*lit*1.5;
    /* второй свет режима: тёплый акцент абордажа, отсвет пятна фонаря в пещере */
    let A=normalize(u.ad.xyz);let na=dot(N,A);
    c+=u.ac.rgb*(i.c*smoothstep(-.1,.5,na)+rim*smoothstep(-.2,.5,na)*.5*mix(i.c,vec3f(1.),.4));
  }
  c=neutral(max(c*u.mi.y,vec3f(0.)));
  c=pow(max(c,vec3f(0.)),vec3f(1./2.2));
  return vec4f(unshoulder(c),1.);}
`;
function rigCardDesc(){
  const mod=gpuShader(RIG_CARD_WGSL);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vs",buffers:[PLN_VB[0]]},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},
    primitive:{topology:"triangle-list",cullMode:"none"},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less"},
    multisample:{count:4}};
}
/* всё, что живёт с устройством: сменилось — кэш пуст (правило 3) */
function rigCardDev(){
  const R=RIG_CARD,d=GPU.dev;
  if(R.dev===d)return;
  R.dev=d;R.M.clear();R.MS.clear();R.P=null;R.bg=null;
  R.ub=d.createBuffer({size:R.U.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  for(const k in R.mesh){R.mesh[k].dev=null;R.mesh[k].vb=null;R.mesh[k].ib=null;}
}
function rigCardMS(w,h){
  const R=RIG_CARD,k=w+"x"+h;let S=R.MS.get(k);
  if(S){R.MS.delete(k);R.MS.set(k,S);return S;}
  if(R.MS.size>=6){const k0=R.MS.keys().next().value,o=R.MS.get(k0);R.MS.delete(k0);GPU.trash.push(o.ms,o.md);}
  const d=GPU.dev,RA=GPUTextureUsage.RENDER_ATTACHMENT;
  S={ms:d.createTexture({size:[w,h],format:"rgba16float",sampleCount:4,usage:RA}),
    md:d.createTexture({size:[w,h],format:"depth24plus",sampleCount:4,usage:RA})};
  S.msV=S.ms.createView();S.mdV=S.md.createView();
  R.MS.set(k,S);return S;
}
/* свет: {key:[x,y,z] к свету, col, fill (небо), gnd (земля), acc:{d,col}, lamp 0..1, exp}; ключ кэша */
function rigLightKey(L){
  const f=a=>a?a.map(v=>(+v).toFixed(2)).join(","):"";
  return [f(L.key),f(L.col),f(L.fill),f(L.gnd),L.acc?f(L.acc.d)+"/"+f(L.acc.col):"",(+L.lamp||0).toFixed(2),(+(L.exp||1)).toFixed(2)].join("|");
}
/* мерка квантуется на 6 % — камера абордажа дышит, а карточка не перерисовывается каждый кадр */
function rigPpmQ(ppm){return Math.round(Math.log(Math.max(1,ppm))/Math.log(1.06));}

/* Карточка: o = {pose, phase, face (±1), yaw (поворот к объективу; по умолчанию .30 к нам),
   tilt, ppm (пикселей CSS на метр), light, pal ("own"|"issue"), low}. Возвращает
   {view, w, h, ppm} — текстуру и её размер в CSS при мерке ppm, или null (нет видеокарты) */
function rigCard(o){
  if(!GPU.dev)return null;
  const R=RIG_CARD;rigCardDev();
  const pose=RIG_ALIAS[o.pose]||o.pose||"stand";
  if(RIG_POSES.indexOf(pose)<0)return null;
  const turn=o.turn==null?.30:o.turn,face=o.face<0?-1:1;
  const yaw=o.yaw!=null?o.yaw:(face>0?turn:Math.PI-turn),tilt=o.tilt||0;
  const pq=pose==="walk"?((Math.round((((o.phase||0)%TAU)+TAU)%TAU/TAU*8))%8):0;
  const yq=Math.round(yaw/(TAU/72)),tq=Math.round(tilt/(TAU/144));
  const mq=rigPpmQ(o.ppm||13.1),ppm=Math.pow(1.06,mq);
  const nd=Math.max(1,Math.min(4,W>0?GPU.bw/W:1)),L=o.light||rigLightBase(1);
  const hdev=RIG_H*ppm*nd,ss=hdev<140?2:1;
  const pal=o.pal==="issue"?"issue":"own",low=!!o.low;
  const key=[pal,low?1:0,pose,pq,yq,tq,mq,nd.toFixed(2),ss,rigLightKey(L)].join("~");
  let C=R.M.get(key);
  if(C){R.M.delete(key);R.M.set(key,C);return C;}
  const B=RIG_BOX,k=ppm*nd*ss;
  const tw=Math.max(4,Math.min(2048,Math.ceil((B.x1-B.x0)*k))),th=Math.max(4,Math.min(2048,Math.ceil((B.y1-B.y0)*k)));
  const d=GPU.dev;
  if(!R.P)R.P=gpuPipeline("rig.card",rigCardDesc);
  if(!R.bg)R.bg=d.createBindGroup({layout:R.P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:R.ub}}]});
  const M=rigCardPose(rigCardMesh(pal,low),pose,pq/8*TAU,L.lamp||0);
  if(M.dev!==d){
    M.vb=d.createBuffer({size:M.nv*52,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
    M.ib=d.createBuffer({size:Math.max(12,M.ni*4),usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(M.ib,0,M.I,0,M.ni);M.dev=d;
  }
  d.queue.writeBuffer(M.vb,0,M.V,0,M.nv*PLN_VS);
  const U=R.U,Rt=rigCardRot(yaw,tilt);U.fill(0);
  for(let r=0;r<3;r++){U[r*4]=Rt[r][0];U[r*4+1]=Rt[r][1];U[r*4+2]=Rt[r][2];}
  U[12]=(B.x0+B.x1)/2;U[13]=(B.y0+B.y1)/2;U[14]=(B.x1-B.x0)/2;U[15]=(B.y1-B.y0)/2;
  const put=(i,a,dv)=>{const v=a||dv;U[i]=v[0];U[i+1]=v[1];U[i+2]=v[2];};
  put(16,L.key,[.3,.9,-.3]);put(20,L.col,[1,1,1]);put(24,L.fill,[.2,.22,.26]);put(28,L.gnd,[.08,.07,.06]);
  put(32,L.acc&&L.acc.d,[0,1,0]);put(36,L.acc&&L.acc.col,[0,0,0]);
  U[40]=L.lamp||0;U[41]=L.exp||1;
  d.queue.writeBuffer(R.ub,0,U);
  const tex=d.createTexture({size:[tw,th],format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
  const view=tex.createView(),S=rigCardMS(tw,th),enc=d.createCommandEncoder();
  const p=enc.beginRenderPass({colorAttachments:[{view:S.msV,resolveTarget:view,loadOp:"clear",storeOp:"discard",clearValue:{r:0,g:0,b:0,a:0}}],
    depthStencilAttachment:{view:S.mdV,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});
  p.setPipeline(R.P);p.setBindGroup(0,R.bg);p.setVertexBuffer(0,M.vb);p.setIndexBuffer(M.ib,"uint32");p.drawIndexed(M.ni);p.end();
  d.queue.submit([enc.finish()]);
  R.made++;
  C={tex,view,w:(B.x1-B.x0)*ppm,h:(B.y1-B.y0)*ppm,ppm,pose,key};
  /* правило 4: старшая по спросу уходит, пока живых не больше потолка */
  while(R.M.size>=R.cap){const k0=R.M.keys().next().value,o0=R.M.get(k0);R.M.delete(k0);GPU.trash.push(o0.tex);}
  R.M.set(key,C);
  return C;
}
/* положить карточку: ноги в (fx, fy) пикселей CSS, мерка ppm (рисуется в настоящем росте, карточка
   квантована по мерке — растягивается на доли процента); тень под ногами — sh (0..1) */
function rigCardDraw(pass,C,fx,fy,ppm,sh){
  if(!pass||!C)return false;
  const B=RIG_BOX,w=(B.x1-B.x0)*ppm,h=(B.y1-B.y0)*ppm;
  if(sh>0)gpuImage(pass,poiShadowTex(),[{x:fx,y:fy,w:1.25*ppm,h:.30*ppm,a:.62*sh}]);
  gpuImage(pass,C,[{x:fx+(B.x0+B.x1)/2*ppm,y:fy-(B.y0+B.y1)/2*ppm,w,h}],{blend:"over"});
  return true;
}
/* поза из полей старого ходока ({amp, phase, air, jet, mining, swim}) */
function rigPoseOf(ao){
  if(ao.jet)return "jet";
  if(ao.air)return "air";
  if(ao.swim)return "swim";
  if(ao.mining)return "drill";
  return (ao.amp||0)>.05?"walk":"stand";
}

/* ── свет режимов: система карточки (x вправо, y вверх, z от нас) ── */
/* база: лампы отсеков — тёплый ключ сверху и чуть к нам, холодное небо разреза; lit — питание */
function rigLightBase(lit){
  const k=.55+clamp(lit,0,1)*.45;
  return {key:[.35,.86,-.38],col:[1.05*k,.92*k,.74*k],fill:[.16,.18,.22],gnd:[.09,.08,.07],acc:{d:[-.7,.3,.6],col:[.10,.13,.18]},lamp:0,exp:1};
}
/* пещера: свет — свой налобник: тёплый отсвет пятна на полу впереди и снизу, холод свода — контур
   сзади; стекло фонаря горит */
function rigLightCave(face){
  const f=face<0?-1:1;
  return {key:[.70*f,-.32,-.40],col:[.85,.60,.34],fill:[.035,.045,.07],gnd:[.07,.05,.035],acc:{d:[-.7*f,.55,.45],col:[.16,.24,.38]},lamp:1,exp:1};
}
/* абордаж: холодный ключ сверху и к камере (камера сзади и выше), тёплый акцент сбоку */
function rigLightRaid(){
  return {key:[.30,.86,-.40],col:[.62,.74,.95],fill:[.05,.06,.09],gnd:[.06,.04,.04],acc:{d:[.95,.12,.25],col:[.85,.42,.20]},lamp:1,exp:1};
}

/* ══ первые три режима (правило: старая кисть остаётся до сдачи M890; RIG_CARD.on — переключатель) ══ */
/* база: игрок. Перенос ctx уже стоит там, куда старый ходок клал своё начало; ноги — на 11.9 его
   единиц ниже (20fa ASTRO_BOX). Мерка базы — единица игры на пиксель CSS: PLN_M на метр */
function rigCardBase(ao,S){
  if(!RIG_CARD.on||!GPU.on||!GPU.enc)return false;
  const f=lifeHere(0,11.9),dx=cellX(S.cur)-S.x;
  if(Math.abs(dx)>2)RIG_CARD.face.base=dx<0?-1:1;
  const ppm=PLN_M*f.s/.9;             /* старый ходок был ужат на .9: человек снова 1.8 м */
  const C=rigCard({pose:rigPoseOf(ao),phase:ao.phase,face:RIG_CARD.face.base,ppm,light:rigLightBase(RIG_CARD.lit==null?1:RIG_CARD.lit),
    pal:"own",low:!!(G.surf&&G.surf.suit<25)});
  if(!C)return false;
  const pass=gpuNext();if(!pass)return false;
  RIG_CARD.by.base++;RIG_CARD.last.base={x:f.x,y:f.y,ppm,h:RIG_H*ppm};
  return rigCardDraw(pass,C,f.x,f.y,ppm,1);
}
/* база: смена. bWorker спрашивает здесь; стоящий и идущий человек в шлеме уходит в очередь и
   кладётся одним слоем до переборок (rigCardFlush), сидящий и без шлема — старой кистью (правило 1) */
function rigCardWorker(x,fy,lit,sit,phase,face,bare){
  const R=RIG_CARD;
  if(!R.on||!R.baseQ||sit||bare||G.mode!=="base"||!GPU.on||!GPU.enc)return false;
  const h=lifeHere(x,fy);
  R.q.push({x:h.x,y:h.y,ppm:PLN_M*h.s,lit,phase,face:face===-1?-1:1,walk:R.walk});
  return true;
}
function rigCardFlush(){
  const R=RIG_CARD,L=R.q;R.baseQ=false;
  if(!L.length)return;
  const pass=gpuNext();
  for(const w of L){
    const C=pass?rigCard({pose:w.walk?"walk":"stand",phase:w.phase,face:w.face,ppm:w.ppm,light:rigLightBase(w.lit),pal:"issue"}):null;
    if(C){rigCardDraw(pass,C,w.x,w.y,w.ppm,0);R.by.base++;}
  }
  L.length=0;
}
/* пещера: игрок. Мерка пещеры — та же, что у грунта (M217): PLN_M единиц на метр, ×K кадра */
function rigCardCave(ao){
  if(!RIG_CARD.on||!GPU.on||!GPU.enc)return false;
  const f=lifeHere(0,11.9),ppm=PLN_M*f.s;
  const C=rigCard({pose:rigPoseOf(ao),phase:ao.phase,face:ao.face,ppm,light:rigLightCave(ao.face),pal:"own",low:!!ao.suitLow});
  if(!C)return false;
  const pass=gpuNext();if(!pass)return false;
  RIG_CARD.by.cave++;RIG_CARD.last.cave={x:f.x,y:f.y,ppm,h:RIG_H*ppm};
  return rigCardDraw(pass,C,f.x,f.y,ppm,ao.air?0:1);
}
/* абордаж: игрок. Камера всегда сзади и выше (24aa drawRaid), поэтому карточка — спиной к нам,
   объектив наклонён на угол камеры к середине роста. h — середина тела на экране и масштаб старого
   ходока (25 его единиц — RBODY), рост в пикселях — 25·h.s */
function rigCardRaid(pass,h,ao,tilt){
  if(!RIG_CARD.on||!pass||!GPU.enc)return false;
  const ppm=25*h.s/RIG_H;
  const C=rigCard({pose:rigPoseOf(ao),phase:ao.phase,yaw:-Math.PI/2+.22,tilt:tilt||0,ppm,light:rigLightRaid(),pal:"own",
    low:!!(G.surf&&G.surf.suit<25)});
  if(!C)return false;
  RIG_CARD.by.raid++;RIG_CARD.last.raid={x:h.x,y:h.y+RIG_H/2*ppm,ppm,h:RIG_H*ppm};
  return rigCardDraw(pass,C,h.x,h.y+RIG_H/2*ppm,ppm,0);
}
