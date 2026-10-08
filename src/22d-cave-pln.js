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
const CAVE3_LENS={man:[.124,.124],walk:[.29,.34],dist:[18,36],eye:3.2,tau:.45,inS:1.2,inK:.42,near:1.6,nIn:.45,nOut:.7};

/* объектив по доле сторон: k = 0 — высокий кадр, 1 — широкий */
/* near — у вещи: 0..1, объектив подходит в near раз ближе */
function cave3Lens(asp,cx,floorY,zoom,near){
  const L=CAVE3_LENS,k=plnSmooth(.6,1.5,asp);
  const Hf=1.8/lerp(L.man[0],L.man[1],k)*(1-L.inK*(zoom||0))/lerp(1,L.near,near||0),f=lerp(L.walk[0],L.walk[1],k),D=lerp(L.dist[0],L.dist[1],k);
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
  if(first){M.c=C;M.cx=C.x/CAVE_PPM;M.wt=C.walkTarget;M.zoom=1;M.dx=0;M.near=0;}
  else M.zoom=Math.max(0,M.zoom-dt/Ln.inS);
  const zoom=plnSmooth(0,1,M.zoom);
  /* у вещи (строка зовёт ДЕЙСТВИЕ) объектив подходит ближе: .45 с туда, .7 с обратно */
  const want=/^ДЕЙСТВИЕ/.test(String(G.prompt||""))?1:0;
  M.near=M.near==null?want:M.near+(want-M.near)*(1-Math.exp(-dt/(want>M.near?Ln.nIn:Ln.nOut)));
  if(M.nearPin!=null)M.near=M.nearPin;   /* стенд держит объектив (cave.py near=) */
  /* тычок пришёл от прошлого кадра: его цель — в окне, которое было показано */
  if(C.walkTarget!=null&&C.walkTarget!==M.wt){C.walkTarget=clamp(C.walkTarget+M.dx,0,CAVE_W);}
  M.cx+=(C.x/CAVE_PPM-M.cx)*(1-Math.exp(-dt/Ln.tau));
  if(Math.abs(M.cx-C.x/CAVE_PPM)>40)M.cx=C.x/CAVE_PPM;
  const asp=W/H,floorY=-C.cy/CAVE_PPM,Ls=cave3Lens(asp,M.cx,floorY,zoom,plnSmooth(0,1,M.near)),K=H/(Ls.Hf*CAVE_PPM);
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
  const lp=[mx+.2*face,my+1.71,CAVE3_Z-.17],ld=plnNorm([face,-.15,.34]);
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
    if(c.nRock>0)F.draw.push({geo:g,first:0,n:c.nRock,lamp:true,sun:true,refl:true});
    if(g.n>c.nRock)F.draw.push({geo:g,first:c.nRock,n:g.n-c.nRock,lamp:false,sun:true});
    tris+=g.n/3;
  }
  for(const b of F.batches)F.draw.push({geo:b.geo,inst:b.inst,lamp:false,sun:true,refl:true});
  /* убранство залов (22dc): натёки, завесы, кристаллы, жилы на разрезе */
  tris+=cave3DressFrame(C,F,Fd,M.cx-hw-3,M.cx+hw+3,M.cx,first||CAVE3.rush);
  /* озеро (22dd): гладь с зеркалом и тело воды в разрезе */
  tris+=cave3LakeFrame(C,F,Fd,M.cx-hw-3,M.cx+hw+3,M.cx);
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

/* ── слова на вещах (как 21pzb на поверхности) ──
   Строка действия — табличкой там, куда зовёт: у устья, у находки, у растения, у шахты; иначе — у
   человека. Подсказка входа «ищите проход · шахты ведут вниз» — у шахты в кадре (нет её — у устья,
   нет и его — у человека). Оранжевый глагол — только на плашке: #prompt и эта строка #msg под слоем
   (body.cavewords / cavehush), кнопка ДЕЙСТВИЯ берёт глагол из G.prompt как прежде. */
const CAVE3_W={on:false,hush:false,tip:null};
function cave3WordsOn(){return G.mode==="cave"&&CAVE3.live&&!!CAVE3.lens&&!!G.cave&&hangOk();}
/* точка мира (м) → пиксели окна тем же объективом, что у кадра */
function cave3Pj(){
  const m=CAVE3.lens.vp;
  return v=>{const cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];if(!(cw>0))return null;
    return [((m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/cw*.5+.5)*W,(.5-(m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/cw*.5)*H];};
}
function cave3InFrame(pj,v){const q=pj(v);return !!q&&q[0]>W*.06&&q[0]<W*.94&&q[1]>H*.1&&q[1]<H*.9;}
/* где что стоит, в метрах: устье шахты — на оси верхней галереи; устье — на шаг внутрь, над полом */
function cave3Spots(C){
  const F=cave3Field(C),Z=CAVE3_Z,mx=F.mouthX+1.2;
  const sh=(C.shafts||[]).filter(s=>s.pts&&s.pts[0]).map(s=>[s.pts[0][0]/CAVE_PPM,-s.pts[0][1]/CAVE_PPM,Z]);
  return {sh,mouth:[mx,-caveFloor(C,mx*CAVE_PPM)/CAVE_PPM+2.2,Z],
    wall:[(CAVE_WALL_X0+CAVE_WALL_X1)/2/CAVE_PPM,-caveFloor(C,(CAVE_WALL_X0+CAVE_WALL_X1)/2)/CAVE_PPM+2,Z],
    find:[C.findX/CAVE_PPM,-C.findY/CAVE_PPM+.6,Z],man:[C.x/CAVE_PPM,-C.y/CAVE_PPM+2,Z]};
}
const CAVE3_OLD_HSURF=hangSurface;
hangSurface=function(){
  CAVE3_OLD_HSURF();
  if(!cave3WordsOn()||!hangIn())return;
  const C=G.cave,pj=cave3Pj(),P=cave3Spots(C),pr=String(G.prompt||"");
  const at=(c,h,id,ln,o)=>{const a=pj(c),b=pj([c[0],c[1]+h/2,c[2]]);if(!a||!b)return;
    ovHang(id,ln,a[0],a[1],Object.assign({r:Math.max(8,Math.abs(a[1]-b[1]))},o));};
  const sh=P.sh.filter(v=>cave3InFrame(pj,v)).sort((a,b)=>Math.abs(a[0]-P.man[0])-Math.abs(b[0]-P.man[0]))[0]||null;
  const mouthIn=cave3InFrame(pj,P.mouth);
  /* подсказка входа */
  const T=CAVE3_W.tip;
  if(T&&G.msg===T&&G.msgT>0){
    const L=T.split("\n"),ln=L[0].split(" · ").concat(L.slice(1));
    if(sh)at(sh,3,"cave.tip",ln,{});
    else if(mouthIn&&!/^ДЕЙСТВИЕ — (НАЗАД|ОСТАВИТЬ)/.test(pr))at(P.mouth,2.4,"cave.tip",ln,{up:true});
    else at(P.man,1.9,"cave.tip",ln,{up:true});
  }
  if(!pr)return;
  const ln=pr.split("\n"),vi=ln.findIndex(s=>/^ДЕЙСТВИЕ/.test(s)),o={verb:vi<0?undefined:vi};
  if(/^ДЕЙСТВИЕ — НАЗАД/.test(pr))at(P.mouth,2.4,"cave.act",ln,o);
  else if(/^ДЕЙСТВИЕ — ОСТАВИТЬ|^УСТЬЕ · /.test(pr))at(P.wall,2,"cave.act",ln,o);
  else if(/^ДЕЙСТВИЕ — ОСМОТРЕТЬ НАХОДКУ/.test(pr))at(P.find,1,"cave.act",ln,o);
  else if(/^ДЕЙСТВИЕ — СКАНИРОВАТЬ/.test(pr)){
    /* то же растение, что выбрала игра (22-mode-cave): последнее несканированное рядом */
    let pl=null;for(const q of C.plants)if(!q.scanned&&Math.abs(q.x-C.x)<30&&Math.abs(q.y-C.y)<40)pl=q;
    at(pl?[pl.x/CAVE_PPM,-pl.y/CAVE_PPM+.8,CAVE3_Z]:P.man,1.4,"cave.act",ln,o);
  }
  else if(/ — ИДТИ · /.test(pr)&&!/НИЖНЕЙ ГАЛЕРЕИ/.test(pr)){
    /* справка ходьбы — у шахты или у устья в кадре; нет их — молчит: стрелки и так на пэдах */
    const L2=pr.split(" · ");
    if(sh)at(sh,3,"cave.act",L2,{});
    else if(mouthIn)at(P.mouth,2.4,"cave.act",L2,{up:true});
  }
  else at(P.man,1.9,"cave.act",ln,Object.assign({up:true},o));
};
/* вход: подсказку запоминаем, чтобы повесить её табличкой, а не полосой посреди пустоты */
const CAVE3_OLD_ENTER=enterCave;
enterCave=function(){
  const r=CAVE3_OLD_ENTER.apply(this,arguments);
  CAVE3_W.tip=G.mode==="cave"?String(G.msg||""):null;
  return r;
};
const CAVE3_OLD_HUD=hud;
hud=function(){
  CAVE3_OLD_HUD.apply(this,arguments);
  if(typeof document==="undefined"||!document.body||!document.body.classList)return;
  const on=cave3WordsOn(),hu=on&&!!CAVE3_W.tip&&G.msg===CAVE3_W.tip&&G.msgT>0,B=document.body.classList;
  if(on!==CAVE3_W.on){CAVE3_W.on=on;B.toggle("cavewords",on);}
  if(hu!==CAVE3_W.hush){CAVE3_W.hush=hu;B.toggle("cavehush",hu);}
};
