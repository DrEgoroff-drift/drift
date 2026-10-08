/* ══ тела для всех (M820, docs/DESIGN-bodies.md) ══
   Всё, что летает и стоит в системе, — тело под одной звездой: сетка набора h3dKit, свет звезды,
   тень тела на себя, свои огни. Здесь общее: выключатель (?body=0 — прежние спрайты до M890),
   сторона звезды без запасного «слева сверху», порог 14 px (мельче — огонёк, а не сетка),
   полоса угрозы только у раненого и у взятого в захват, пустая выпечка для сеток своей краски,
   корпус флота по классу ГЛАВТРАССЫ и тело челнока. Баржа — 17c2f, станция — 17c2g */
const BODY={on:typeof location==="undefined"||!/[?&]body=0\b/.test(location.search),LOD:14,T0:null,M:new Map()};

/* сторона света от точки системы к звезде (0,0); на самой звезде света сбоку нет — [0,0],
   и h3dRun кладёт свой ровный верхний */
function sysLightDir(x,y){const l=Math.hypot(x||0,y||0);return l>1e-6?[-x/l,-y/l]:[0,0];}

/* полоса корпуса над чужим (13-pirates): только раненый ниже 70 % и взятый в захват; ренегат — как был;
   борт державы, что числится своим (iff), полосы не носит. Выключено — прежнее правило (всем, кто видит) */
function bodyBar(p){
  if(!BODY.on)return true;
  if(!p||(p.hull||0)<=0)return false;
  if(p.rogue)return true;
  if(p.pw&&p.iff)return false;
  if(G.marks&&G.marks.includes(p))return true;
  return (p.hull||0)/(p.hullMax||1)<.7;
}

/* можно ли телу на видеокарту сейчас */
function bodyGpu(){return BODY.on&&typeof H3D!=="undefined"&&H3D.on&&GPU.on&&!!GPU.dev&&!!GPU.enc;}
/* пустая выпечка: у сеток тел краска своя — доля 3, как у части 17c2b: своя краска без швов корпуса
   (у доли 2 шов через 2.4 по длине ложился косой штриховкой на кольцо станции); плоскость краски
   отбрасывается по альфе */
function bodyT0(){
  if(!BODY.T0||BODY.T0.dev!==GPU.dev)BODY.T0=gpuBake(4,4,()=>{},{mips:false});
  return BODY.T0;
}
/* сетка на экран: m — h3dPack, x,y — экран, a — курс, sc — масштаб; свет — к звезде из мира (wx,wy) */
function bodyRun(m,x,y,a,sc,wx,wy,ember){
  if(!bodyGpu()||!m)return false;
  const T=bodyT0();if(!T)return false;
  const [lx,ly]=sysLightDir(wx,wy);
  return h3dRun(m,T,x,y,a,sc,0,lx,ly,null,ember||0);
}
/* огни сетки (m.L: x,y — в осях корпуса, c — цвет, r — радиус, k — мигание) поверх тела, в проходе сцены */
function bodyLights(m,x,y,a,sc,al){
  const pass=gpuScene();if(!pass||!m.L||!m.L.length)return;
  const c=Math.cos(a),s=Math.sin(a),D=[],A=[];al=al==null?1:al;
  for(const q of m.L){const px=x+(q.x*c-q.y*s)*sc,py=y+(q.x*s+q.y*c)*sc;
    const on=q.k?(Math.sin(G.t*q.k+q.ph)>0?.95:.22):.9,r=Math.max(.7,q.r*sc);
    D.push([1,px,py,r,0,0,0,q.c[0],q.c[1],q.c[2],on*al]);
    if(on>.5)A.push([1,px,py,r*.5,0,0,r*1.8,q.c[0],q.c[1],q.c[2],.45*al]);}
  gpuShapes(pass,D);if(A.length)gpuShapes(pass,A,{blend:"add"});
}
/* мельче порога — огонёк: точка цвета корпуса, освещённая со стороны звезды, и ходовой огонь */
function bodyDot(x,y,col,wx,wy,al){
  const pass=gpuScene();if(!pass)return;
  const [lx,ly]=sysLightDir(wx,wy),k=al==null?1:al;
  gpuShapes(pass,[[1,x,y,1.3,0,0,.6,col[0]*.45,col[1]*.45,col[2]*.45,.9*k],[1,x+lx*.5,y+ly*.5,.8,0,0,.4,col[0],col[1],col[2],.9*k]]);
}
/* кэш сеток по ключу: последние cap, старая отдаёт буфер вершин */
function bodyMesh(key,cap,make){
  let m=BODY.M.get(key);if(m){BODY.M.delete(key);BODY.M.set(key,m);return m;}
  m=make();BODY.M.set(key,m);
  const pre=key.split(":")[0];let n=0;for(const k of BODY.M.keys())if(k.split(":")[0]===pre)n++;
  for(const k of BODY.M.keys()){if(n<=cap)break;if(k.split(":")[0]!==pre)continue;
    const o=BODY.M.get(k);if(o&&o.buf&&o.dev===GPU.dev)GPU.trash.push(o.buf);BODY.M.delete(k);n--;}
  return m;
}

/* ── корабль ГЛАВТРАССЫ (12ai1 fleetShipAt): класс линии → класс корпуса, корпус — hullGpuDraw ──
   Три варианта на класс и завод (зерно по модулю 3): кэш корпусов не растёт с каждым бортом.
   Узел трасс и чёрный дерелик — не корабли, им прежняя выпечка */
const BODY_FCLS={post:"courier",tanker:"hauler",tug:"miner",fridge:"hauler",ore:"miner",lighter:"hauler",
  ferry:"courier",patrol:"warship",rescue:"survey",hosp:"survey",school:"scout",exped:"survey",base:"hauler"};
function bodyFleetHull(f){
  const hc=f&&BODY_FCLS[f.k];if(!hc)return null;
  const by=(f.by&&typeof HULL_MAKER!=="undefined"&&HULL_MAKER[f.by])?f.by:"gt",v=(f.seed>>>0)%3,id="b"+f.k+v+by;
  if(!NPC_SHIPS[id])NPC_SHIPS[id]={name:id,seed:hashi(0xB0D7,v,f.k.length*131+by.charCodeAt(0)),hcls:hc,by,
    col:"#c9c9d4",hull:120,cargo:120,fuel:120,thr:1,cls:"линия"};
  return id;
}
/* борт линии на месте спрайта: s — масштаб экрана, al — прозрачность (гаснущий у дока остаётся выпечкой) */
function bodyFleet(f,x,y,a,s,al){
  if(!bodyGpu()||al<.95)return false;
  const id=bodyFleetHull(f);if(!id)return false;
  const h=hullOf(id),len=(h.nose-h.tail)*s*.85;
  const wx=G.viewCX+(x-W/2)/G.zoom,wy=G.viewCY+(y-H/2)/G.zoom;
  if(len<BODY.LOD){bodyDot(x,y,makerGround(h.by||"gt"),wx,wy,al);return true;}
  const [lx,ly]=sysLightDir(wx,wy);
  return hullGpuDraw(id,x,y,a,s*.85,f.k!=="base",false,0,0,lx,ly);
}

/* ── челнок (17f): корпус-ящик с носом, две гондолы, окно кабины тёплое; мерка челнока 10×6 ── */
function bodyShuttleMesh(gr){
  return bodyMesh("sh:"+gr.join(","),8,()=>{
    const {V,C,face,lathe,box}=h3dKit(),g=C(gr),dk=C(mixc(gr,[0,0,0],.55)),ir=C([46,50,58]);
    /* блик со знаком «−» — тело: своя тень и затенение у борта ему не считаются (как у h3dMesh) */
    box(-3,2.2,-1.05,1.05,-.6,.75,.35,g,3,-.5);                        /* корпус */
    face([[2.2,-1.05,-.6],[2.2,1.05,-.6],[4.1,.25,-.2],[4.1,-.25,-.2]],[2,0,0],g,3,-.5,0);
    face([[2.2,-1.05,.75],[4.1,-.25,.15],[4.1,.25,.15],[2.2,1.05,.75]],[2,0,0],g,3,-.5,0);
    face([[2.2,-1.05,-.6],[4.1,-.25,-.2],[4.1,-.25,.15],[2.2,-1.05,.75]],[2,0,0],g,3,-.5,0);
    face([[2.2,1.05,-.6],[2.2,1.05,.75],[4.1,.25,.15],[4.1,.25,-.2]],[2,0,0],g,3,-.5,0);
    face([[2.3,-.6,.78],[3.3,-.3,.5],[3.3,.3,.5],[2.3,.6,.78]],[2.6,0,0],C([255,206,140]),3,-.2,1.7);   /* окно кабины */
    for(const s of [-1,1])lathe(-3.6,s*1.55,-.05,[[0,.32],[.3,.55],[3.6,.55],[4.4,.3]],dk,3,.6,0,10,[ir,.3,0],null);
    const m=h3dPack(V,4.6,{st:[[4,.6],[2.2,1.05],[-3,1.05]],ne:2.2,kh:.7,gl:.4});
    m.L=[{x:-1.5,y:-1.9,c:[255,90,80],r:.35,k:.07,ph:0},{x:-1.5,y:1.9,c:[120,240,150],r:.35,k:.07,ph:1.6}];
    return m;});
}
/* челнок на месте спрайта; false — пусть рисует прежняя выпечка */
function bodyShuttle(x,y,a,sk,gr,wx,wy){
  if(!bodyGpu())return false;
  if(8.6*sk<BODY.LOD){bodyDot(x,y,gr,wx,wy,1);return true;}
  const m=bodyShuttleMesh(gr);
  if(!bodyRun(m,x,y,a,sk,wx,wy,.25))return false;
  bodyLights(m,x,y,a,sk,1);return true;
}
