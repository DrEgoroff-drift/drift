/* ══════════════ пещера на движке: кадр и переключатель (M630a) ══════════════
   Порода из сетки игры (22da), свет и проходы (22db, 22dbw). Здесь — объектив, человек,
   фонарь, день в устье и огни, и обёртка drawCave: старая рисовалка не тронута, новый вид
   упал — идёт она, после трёх сбоев подряд новый вид снимает себя сам. ?cave=0 — старая.
   Игра не меняется: сетка, запросы, updateCave — те же; кадр только смотрит на них.

   Объектив — как на стенде: широкий на ПК, высокий на телефоне, между ними плавно. Окно кадра
   лежит на плоскости, где ходит человек (z = CAVE3_Z), поэтому всё, что стоит на линии ходьбы,
   ложится на экран чистым масштабом G.viewK. Глаз выше линии ходьбы на 3.6 м. Середина кадра
   догоняет человека за 0.45 с; тычок «идти сюда» игра считает от человека (15-input), кадр
   поправляет его цель на это отставание — точка, куда ткнули, та, что показана. */
const CAVE3={on:true,rush:false,bad:0,err:"",live:false,c:null,cx:0,dx:0,wt:null,zoom:0,t:0,stat:{cpu:0,chunks:0,left:0}};
try{if(typeof location!=="undefined"&&/[?&]cave=0\b/.test(location.search))CAVE3.on=false;}catch(e){}
const CAVE3_Z=.7;
/* доля роста человека в высоте кадра: высокий — широкий; линия ходьбы от низа; даль объектива */
const CAVE3_LENS={man:[.077,.085],walk:[.29,.34],dist:[30,50],eye:3.6,tau:.45,inS:1.2,inK:.42};

/* объектив по доле сторон: k = 0 — высокий кадр, 1 — широкий */
function cave3Lens(asp,cx,floorY,zoom){
  const L=CAVE3_LENS,k=plnSmooth(.6,1.5,asp);
  const Hf=1.8/lerp(L.man[0],L.man[1],k)*(1-L.inK*(zoom||0)),f=lerp(L.walk[0],L.walk[1],k),D=lerp(L.dist[0],L.dist[1],k);
  const w=Hf*asp,l=cx-w/2,r=cx+w/2,b=floorY-f*Hf,t=b+Hf;
  const ex=cx,ey=floorY+L.eye,ez=CAVE3_Z-D;
  const vp=plnM4mul(plnM4lens(l-ex,r-ex,b-ey,t-ey,D,4,600),plnM4move(-ex,-ey,-ez));
  return {k,Hf,f,D,w,l,r,b,t,vp,eye:[ex,ey,ez]};
}
/* доля человека в высоте кадра (для набора и ворот) */
function cave3ManShare(asp){return 1.8/cave3Lens(asp,0,0,0).Hf;}
/* досягаемость фонаря по снаряжению: I класс — 18 м */
function cave3Reach(lamp){return clamp(18*(lamp||1),12,27);}

/* устье: ось и полуоси столба дня в плане на высоте поверхности */
function cave3Mouth(F){
  if(F.mouth)return F.mouth;
  let n=0;for(let x=0;x<CAVE_NX&&x<60;x++)if(!F.g[2*CAVE_NX+x])n++;
  const hl=cave3Samp(F.hl,F.mouthX*CAVE_PPM,CAVE_Y0+CAVE_CS*2.5),zd=Math.min(CAVE3_CH.zcap-4,hl*lerp(2.4,4,plnSmooth(3,6,hl))+.6);
  return F.mouth=[F.mouthX,zd*.5,Math.max(1.2,n*CAVE_CS/CAVE_PPM/2+.6),zd*.5+.5];
}

function cave3Frame(){
  const t0=wallMs(),C=G.cave,Fd=cave3Field(C),M=CAVE3,Ln=CAVE3_LENS;
  if(C.cy==null)C.cy=C.y;
  const first=M.c!==C,t=wallMs(),dt=first?0:Math.min(.1,Math.max(0,(t-M.t)/1000));
  M.t=t;
  /* вход: кадр начинает с ближнего у устья и уходит в широкий */
  if(first){M.c=C;M.cx=C.x/CAVE_PPM;M.wt=C.walkTarget;M.zoom=1;M.dx=0;}
  else M.zoom=Math.max(0,M.zoom-dt/Ln.inS);
  const zoom=plnSmooth(0,1,M.zoom);
  /* тычок пришёл от прошлого кадра: его цель — в окне, которое было показано */
  if(C.walkTarget!=null&&C.walkTarget!==M.wt){C.walkTarget=clamp(C.walkTarget+M.dx,0,CAVE_W);}
  M.cx+=(C.x/CAVE_PPM-M.cx)*(1-Math.exp(-dt/Ln.tau));
  if(Math.abs(M.cx-C.x/CAVE_PPM)>40)M.cx=C.x/CAVE_PPM;
  const asp=W/H,floorY=-C.cy/CAVE_PPM,Ls=cave3Lens(asp,M.cx,floorY,zoom),K=H/(Ls.Hf*CAVE_PPM);
  G.viewK=K;G.viewX=M.cx*CAVE_PPM-W/(2*K);G.viewY=-Ls.t*CAVE_PPM;
  M.dx=M.cx*CAVE_PPM-C.x;M.wt=C.walkTarget;
  M.lens=Ls;
  /* куски породы, что видны: окно на глубине 10 м за разрезом и запас */
  const sp=(10-Ls.eye[2])/Ls.D,hw=Ls.w/2*sp,hh=Ls.Hf/2*sp,mid=(Ls.b+Ls.t)/2;
  const list=cave3Chunks(C,[M.cx-hw-2,M.cx+hw+2,mid-hh-2,mid+hh+2],C.x/CAVE_PPM,floorY,first||CAVE3.rush);
  /* человек: ноги — на полу картинки, но не дальше четверти метра от пола игры */
  const face=C.face<0?-1:1,mx=C.x/CAVE_PPM,gy=-C.y/CAVE_PPM;
  let my=gy;
  if(C.on){const v=cave3Down(Fd,mx,gy+.5,CAVE3_Z);my=gy+clamp(v-gy,-.25,.25);}
  const F={batches:[],lamps:[],draw:[],lights:[],glows:[]};
  const S={walkPhase:C.walkPhase,walkAmp:C.walkAmp,on:C.on,jetOn:C.jetOn,vy:C.vy,mining:false,suit:G.surf?G.surf.suit:100};
  plnManFrame(F,[mx,my,CAVE3_Z],face,0,{S,lamp:0});
  /* фонарь на шлеме: смотрит туда, куда идёт человек, и немного в глубину */
  const kit=typeof kitStat==="function"?kitStat():{lamp:1},reach=cave3Reach(kit.lamp);
  const lp=[mx+.2*face,my+1.71,CAVE3_Z-.17],ld=plnNorm([face,-.15,.6]);
  const lampVP=plnM4mul(cave3Persp(CAVE3_K.fov,1,.12,140),plnM4look(lp,[lp[0]+ld[0],lp[1]+ld[1],lp[2]+ld[2]],[0,1,0]));
  /* день: час мира наверху (последний кадр поверхности), луч чуть вдоль галереи и к объективу */
  const Hr=PLN.sun,night=Hr?clamp(Hr.night||0,0,1):0,dayK=1-plnSmooth(.2,.9,night);
  const sx=Hr&&Hr.dir&&Hr.dir[0]>0?1:-1,sun=plnNorm([.2*sx,1,.12]),lean=[-sun[0]/sun[1],sun[2]/sun[1]];
  const mouth=cave3Mouth(Fd),sY=Fd.surfY;
  const day=cave3DayBox(sun,[mouth[0]-16,mouth[0]+16,sY-24,sY+2,-2,18]);
  const lk=Hr&&Hr.look,skyLo=lk?lk.skyHor:[.62,.78,.95],skyHi=lk?lk.skyZen:[.13,.33,.78];
  /* огни без теней: что разливает фонарь, что отдают освещённые места, чужая лампа, ранец */
  const Lt=(p,r,c)=>F.lights.push({p,r,c}),lc=CAVE3_K.lampCol;
  Lt(lp,12,[lc[0]*.34,lc[1]*.34,lc[2]*.34]);
  Lt([mx+3.6*face,my+.7,CAVE3_Z+.6],9,[.22,.15,.08]);
  Lt([mx-3.4*face,my+2.4,CAVE3_Z-1.3],7.5,[.085,.125,.15]);
  if(dayK>.01)Lt([mouth[0],sY-3,mouth[1]],13,[.30*dayK,.38*dayK,.44*dayK]);
  Lt([mx+14*face,my+3.5,CAVE3_Z+6],22,[.05,.07,.105]);
  for(const q of F.lamps)Lt(q.p,q.r,[q.c[0]*q.k*.3,q.c[1]*q.k*.3,q.c[2]*q.k*.3]);
  const sl=typeof caveLampSpot==="function"?caveLampSpot(C):null;
  if(sl&&Math.abs(sl.x/CAVE_PPM-M.cx)<Ls.w){
    const q=[sl.x/CAVE_PPM,-sl.y/CAVE_PPM+.9,CAVE3_Z+.4],fl=.85+.15*Math.sin(G.t*.07+sl.ph);
    Lt(q,10,[.5*fl,.3*fl,.12*fl]);F.glows.push({p:q,c:[1,.6,.25],k:.5*fl,s:.6});
  }
  F.glows.push({p:lp,c:[1,.74,.42],k:.9,s:.42});
  /* что рисуется: порода (в карту фонаря и дня), разрез (в карту дня), человек (в карту дня) */
  let tris=0;
  for(const c of list){
    const g=c.geo;
    if(c.nRock>0)F.draw.push({geo:g,first:0,n:c.nRock,lamp:true,sun:true});
    if(g.n>c.nRock)F.draw.push({geo:g,first:c.nRock,n:g.n-c.nRock,lamp:false,sun:true});
    tris+=g.n/3;
  }
  for(const b of F.batches)F.draw.push({geo:b.geo,inst:b.inst,lamp:false,sun:true});
  Object.assign(F,{vp:Ls.vp,eye:Ls.eye,t:(G.t/60)%7200,lamp:{p:lp,d:ld,k:1},lampVP,reach,near:reach*.45,
    sun,sunVP:day.m,sunRange:day.range,dayK,mouth,lean,surfY:sY,skyLo,skyHi,expo:1,cutZ:0,bed:Fd.sty.bed});
  M.stat.chunks=list.length;M.stat.left=C.ch3?C.ch3.left:0;M.stat.tris=Math.round(tris);
  M.stat.cpu=+(wallMs()-t0).toFixed(2);
  return cave3GpuFrame(F);
}

/* ── поверх кадра: то, что ещё не перерисовано (жизнь и находка — M630c) ──
   Те же кисти, что у старого кадра, в той же мерке: окно на линии ходьбы — окно кадра */
function cave3Over(){
  const C=G.cave,Ls=CAVE3.lens;
  if(!Ls)return;
  const camx=G.viewX,camy=G.viewY;
  const LP=GPU.on?gpuNext():null;
  for(const pl of C.plants){
    const x=pl.x-camx,y=pl.y-camy;if(x<-70||x>W+70||y<-120||y>H+40)continue;
    if(LP){const h=lifeHere(x,y);if(lifePlantGpu(LP,pl,h.x,h.y,0,{s:h.s}))continue;}
    drawPlant(pl,x,y);
  }
  for(const b of C.fauna){
    const x=b.x-camx,y=b.y-camy;if(x<-50||x>W+50||y<-60||y>H+60)continue;
    if(LP){const h=lifeHere(x,y+b.r*.9);if(lifeBeastGpu(LP,b,h.x,h.y,true,b.stun,{s:h.s}))continue;}
    drawBeast(b,x,y+b.r*.9,true,b.stun);
  }
  if(!C.found){
    const x=C.findX-camx,y=C.findY-camy;
    if(x>-40&&x<W+40&&y>-40&&y<H+40){
      const k=Math.sin(G.t*.08)>0?.9:.4;
      if(LP){const h=lifeHere(x,y-6);gpuShapes(LP,[[1,h.x,h.y,4*h.s,0,0,1.2*h.s,255,225,140,k]],{blend:"over"});}
      else{ctx.fillStyle="rgba(255,225,140,"+k+")";ctx.beginPath();ctx.arc(x,y-6,4,0,TAU);ctx.fill();}
    }
  }
}

/* ── переключатель ── */
const CAVE3_OLD_DRAW=drawCave;
drawCave=function(){
  let ok=false;
  if(CAVE3.on&&CAVE3.bad<3&&G.cave&&G.cave.g){
    try{
      plnQualAuto();
      ok=cave3GpuReady()&&cave3Frame();
      if(ok)CAVE3.bad=0;
    }catch(e){
      CAVE3.bad++;CAVE3.err=String((e&&e.stack)||e).slice(0,600);cave3Log("кадр: "+CAVE3.err);
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  /* свечение у нового вида своё; движку оставлено только зерно */
  BLOOM_K.cave=ok?0:CAVE3_BLOOM;
  CAVE3.live=ok;
  if(!ok){CAVE3.c=null;CAVE3_OLD_DRAW();return;}
  withScale(G.viewK,cave3Over);
};
const CAVE3_BLOOM=BLOOM_K.cave;
/* выход без среза: поверхность начинает с ближнего объектива и уходит в свой (21pz plnGlide) */
const CAVE3_OLD_EXIT=exitCave;
exitCave=function(){
  const live=CAVE3.live;
  CAVE3_OLD_EXIT();
  CAVE3.c=null;CAVE3.live=false;
  if(live&&typeof PLN==="object"){PLN.glide=1;PLN.glideT=wallMs();}
};
