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
const CAVE3_LENS={man:[.124,.124],walk:[.29,.34],dist:[18,36],eye:3.2,tau:.45,inS:1.2,inK:.42,near:1.6,nIn:.45,nOut:.7,
  /* у озера: глаз выше и ближе — гладь и зеркало ложатся полосой, а не ребром */
  lkEye:2.6,lkD:.55,lkS:.8,
  /* дальний: глаз за 100 м, 24°, линия ходьбы на .40 — по клавише карты; на телефоне нет */
  fD:100,fH:42.5,fWalk:.40,fIn:.8,fOut:.7};
/* дальний объектив — только на широком окне */
function cave3FarOk(){return W>760&&W>=H;}

/* объектив по доле сторон: k = 0 — высокий кадр, 1 — широкий */
/* near — у вещи: 0..1, объектив подходит в near раз ближе */
function cave3Lens(asp,cx,floorY,zoom,near,lk,far){
  const L=CAVE3_LENS,k=plnSmooth(.6,1.5,asp);
  far=far||0;lk=(lk||0)*(1-far);
  let Hf=1.8/lerp(L.man[0],L.man[1],k)*(1-L.inK*(zoom||0))/lerp(1,L.near,near||0),f=lerp(L.walk[0],L.walk[1],k),D=lerp(L.dist[0],L.dist[1],k)*lerp(1,L.lkD,lk);
  if(far){Hf=lerp(Hf,L.fH,far);f=lerp(f,L.fWalk,far);D=lerp(D,L.fD,far);}
  const w=Hf*asp,l=cx-w/2,r=cx+w/2,b=floorY-f*Hf,t=b+Hf;
  const ex=cx,ey=floorY+L.eye+L.lkEye*lk,ez=CAVE3_Z-D;
  const vp=plnM4mul(plnM4lens(l-ex,r-ex,b-ey,t-ey,D,4,600),plnM4move(-ex,-ey,-ez));
  return {k,Hf,f,D,w,l,r,b,t,vp,eye:[ex,ey,ez]};
}
/* доля человека в высоте кадра (для набора и ворот) */
function cave3ManShare(asp){return 1.8/cave3Lens(asp,0,0,0).Hf;}
/* досягаемость фонаря по снаряжению: I класс — 18 м */
function cave3Reach(lamp){return clamp(18*(lamp||1),12,27);}

/* световые события дальнего объектива: отрезки по x, м — устье, арка, озеро, скопления кристаллов
   (разрыв больше 12 м делит их), залежи янтаря: всё, что светит само и видно издали */
function cave3Events(C,F){
  if(C.ev3&&C.ev3.f===F)return C.ev3.l;
  const P=CAVE_PPM,l=[[F.mouthX-3,F.mouthX+3]];
  if(F.far)l.push([F.far.ax-3,F.far.ax+3]);
  for(const z of caveZones(C)){const p=cavePool(C,z);if(p)l.push([p.x0/P,p.x1/P]);}
  const xs=caveDeco(C,G.surf&&G.surf.p).crystals.map(c=>c.x/P).sort((a,b)=>a-b);
  for(let i=0;i<xs.length;){let j=i;while(j+1<xs.length&&xs[j+1]-xs[j]<12)j++;l.push([xs[i]-1,xs[j]+1]);i=j+1;}
  for(const p of caveProps(C))if(p.k==="amber")l.push([p.x/P-2,p.x/P+2]);
  C.ev3={f:F,l};
  return l;
}
/* на сколько сдвинуть дальний кадр: событие видно, если хоть 6 м его (или всё) лежит в средних
   восьми десятых кадра; ищется ближайший сдвиг до шести десятых полукадра, при котором их два.
   Двух не достать (пролёт без огней длиннее кадра) — кадр отходит к ближайшему огню за краем */
function cave3FarSeen(L,c,hw){return L.filter(e=>Math.min(e[1],c+hw*.8)-Math.max(e[0],c-hw*.8)>=Math.min(6,e[1]-e[0])).length;}
function cave3FarShift(C,F,cx,hw){
  const L=cave3Events(C,F),m=hw*.6;
  for(let s=0;s<=m;s+=1){if(cave3FarSeen(L,cx+s,hw)>=2)return s;if(s&&cave3FarSeen(L,cx-s,hw)>=2)return -s;}
  let d=0;
  for(const e of L){
    const o=e[0]>cx+hw*.8?e[0]-cx-hw*.8:e[1]<cx-hw*.8?e[1]-cx+hw*.8:0;
    if(o&&(!d||Math.abs(o)<Math.abs(d)))d=o;
  }
  return d?clamp(d+Math.sign(d)*6,-m,m):0;
}

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
  if(first){M.c=C;M.cx=C.x/CAVE_PPM;M.wt=C.walkTarget;M.zoom=1;M.dx=0;M.near=0;M.farOn=false;}
  else M.zoom=Math.max(0,M.zoom-dt/Ln.inS);
  const zoom=plnSmooth(0,1,M.zoom);
  /* у вещи (строка зовёт ДЕЙСТВИЕ) объектив подходит ближе: .45 с туда, .7 с обратно */
  const want=/^ДЕЙСТВИЕ/.test(String(G.prompt||""))?1:0;
  M.near=M.near==null?want:M.near+(want-M.near)*(1-Math.exp(-dt/(want>M.near?Ln.nIn:Ln.nOut)));
  if(M.nearPin!=null)M.near=M.nearPin;   /* стенд держит объектив (cave.py near=) */
  /* у озера (прошлый кадр знает, далеко ли оно) объектив опускает взгляд на воду */
  const lw=M.lakeD==null?0:1-plnSmooth(2,9,M.lakeD);
  M.lk=first||M.lk==null||M.rush?lw:M.lk+(lw-M.lk)*(1-Math.exp(-dt/Ln.lkS));
  /* дальний: просили карту — кадр отходит на сто метров; стенд держит его (cave.py far=) */
  const fw=M.farPin!=null?M.farPin:(M.farOn&&cave3FarOk()?1:0);
  M.far=first||M.far==null||M.rush?fw:M.far+(fw-M.far)*(1-Math.exp(-dt/(fw>M.far?Ln.fIn:Ln.fOut)));
  if(Math.abs(M.far-fw)<.002)M.far=fw;
  /* в дальнем кадре кусков втрое больше: держим их и строим быстрее, пока объектив едет */
  CAVE3_CH.keep=M.far>.01?160:64;CAVE3_CH.ms=M.far>.01&&M.far<1?16:8;
  /* тычок пришёл от прошлого кадра: его цель — в окне, которое было показано */
  if(C.walkTarget!=null&&C.walkTarget!==M.wt){C.walkTarget=clamp(C.walkTarget+M.dx,0,CAVE_W);}
  M.cx+=(C.x/CAVE_PPM-M.cx)*(1-Math.exp(-dt/Ln.tau));
  if(Math.abs(M.cx-C.x/CAVE_PPM)>40)M.cx=C.x/CAVE_PPM;
  /* дальний объектив держит в кадре хоть два световых события (устье, арка, озеро, кристаллы):
     иначе отходит к ближайшему месту, где они есть, — человек остаётся в кадре (проход 5) */
  const asp=W/H,fK=plnSmooth(0,1,M.far),fs=fK>.001?cave3FarShift(C,Fd,M.cx,CAVE3_LENS.fH*asp/2):0;
  M.fs=first||M.fs==null||M.rush?fs:M.fs+(fs-M.fs)*(1-Math.exp(-dt/.6));
  const cx=M.cx+M.fs*fK;
  const floorY=-C.cy/CAVE_PPM,Ls=cave3Lens(asp,cx,floorY,zoom,plnSmooth(0,1,M.near),plnSmooth(0,1,M.lk),plnSmooth(0,1,M.far)),K=H/(Ls.Hf*CAVE_PPM);
  G.viewK=K;G.viewX=cx*CAVE_PPM-W/(2*K);G.viewY=-Ls.t*CAVE_PPM;
  M.dx=cx*CAVE_PPM-C.x;M.wt=C.walkTarget;
  M.lens=Ls;
  /* куски породы, что видны: окно на глубине 10 м за разрезом и запас */
  const sp=(10-Ls.eye[2])/Ls.D,hw=Ls.w/2*sp,hh=Ls.Hf/2*sp,mid=(Ls.b+Ls.t)/2;
  const list=cave3Chunks(C,[cx-hw-2,cx+hw+2,mid-hh-2,mid+hh+2],C.x/CAVE_PPM,floorY,first||CAVE3.rush);
  /* человек: ноги — на полу картинки, но не дальше четверти метра от пола игры */
  const face=C.face<0?-1:1,mx=C.x/CAVE_PPM,gy=-C.y/CAVE_PPM;
  let my=gy;
  if(C.on){const v=cave3Down(Fd,mx,gy+.5,CAVE3_Z);my=gy+clamp(v-gy,-.25,.25);}
  const F={batches:[],lamps:[],draw:[],lights:[],glows:[]};
  /* сырость воздуха: у воды и в натёчном зале конус в воздухе гуще */
  const zn=caveZoneAt(C,C.x);
  F.wet=Math.max(M.lakeD==null?0:1-plnSmooth(3,14,M.lakeD),zn.kind==="dripstone"?.45:0,zn.kind==="water"?.6:0);
  const S={walkPhase:C.walkPhase,walkAmp:C.walkAmp,on:C.on,jetOn:C.jetOn,vy:C.vy,mining:false,suit:G.surf?G.surf.suit:100};
  plnManFrame(F,[mx,my,CAVE3_Z],face,0,{S,lamp:0});
  /* фонарь на шлеме: смотрит туда, куда идёт человек, и немного в глубину */
  const kit=typeof kitStat==="function"?kitStat():{lamp:1},reach=cave3Reach(kit.lamp);
  const lp=[mx+.2*face,my+1.71,CAVE3_Z-.17],ld=plnNorm([face,CAVE3_LAMP.tilt,.34]);
  const lampVP=plnM4mul(cave3Persp(CAVE3_K.fov,1,.12,140),plnM4look(lp,[lp[0]+ld[0],lp[1]+ld[1],lp[2]+ld[2]],[0,1,0]));
  /* день: час мира наверху (последний кадр поверхности), луч чуть вдоль галереи и к объективу */
  const Hr=PLN.sun,night=Hr?clamp(Hr.night||0,0,1):0,dayK=1-plnSmooth(.2,.9,night);
  const sx=Hr&&Hr.dir&&Hr.dir[0]>0?1:-1,sun=plnNorm([.2*sx,1,.12]),lean=[-sun[0]/sun[1],sun[2]/sun[1]];
  const mouth=cave3Mouth(Fd),sY=Fd.surfY;
  const day=cave3DayBox(sun,[mouth[0]-16,mouth[0]+16,sY-24,sY+2,-2,18]);
  const lk=Hr&&Hr.look,skyLo=lk?lk.skyHor:[.62,.78,.95],skyHi=lk?lk.skyZen:[.13,.33,.78];
  /* огни без теней: что разливает фонарь, что отдают освещённые места, чужая лампа, ранец */
  const Lt=(p,r,c)=>F.lights.push({p,r,c}),lc=CAVE3_K.lampCol;
  /* разлив фонаря без тени — холодный: тёплое только в луже на полу и на ближней стене в конусе
     (M630b проход 4: вне конуса камень того же тона, что страница разреза) */
  const LL=CAVE3_LAMP;
  Lt(lp,LL.spillR,LL.spill);
  Lt([mx+LL.poolX*face,my+.25,CAVE3_Z+.5],LL.poolR,LL.pool);
  Lt([mx+.55*face,my+1.05,CAVE3_Z-.9],1.9,LL.man);   /* отсвет лужи на самом человеке */
  Lt([mx+.5*face,my+5,CAVE3_Z+1.6],9,LL.vault);   /* свод над человеком: купол читается холодным серым */
  Lt([mx-5*face,my+2.5,CAVE3_Z+7],18,LL.back);   /* задняя стена за спиной: серый камень, не туман */
  Lt([mx-3.4*face,my+2.4,CAVE3_Z-1.3],7.5,[.085,.125,.15]);
  /* день у устья — вторая половина света: столб сверху и холодный отскок от пола под ним на 10–12 м
     (проход 5); далеко от устья оба огня не тратятся — их двенадцать */
  if(dayK>.01&&Math.abs(mouth[0]-cx)<Ls.w*.5+LL.bounceR){
    const fy=-caveFloor(C,mouth[0]*CAVE_PPM)/CAVE_PPM,b=LL.bounce;
    Lt([mouth[0],sY-3,mouth[1]],13,[.30*dayK,.38*dayK,.44*dayK]);
    Lt([mouth[0]+1.5,fy+2.2,mouth[1]+.8],LL.bounceR,[b[0]*dayK,b[1]*dayK,b[2]*dayK]);
  }
  Lt([mx+14*face,my+3.5,CAVE3_Z+6],22,LL.ahead);
  for(const q of F.lamps)Lt(q.p,q.r,[q.c[0]*q.k*.3,q.c[1]*q.k*.3,q.c[2]*q.k*.3]);
  const sl=typeof caveLampSpot==="function"?caveLampSpot(C):null;
  if(sl&&Math.abs(sl.x/CAVE_PPM-cx)<Ls.w){
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
  /* дальний зал и янтарь (22de) — раньше кристаллов: огней двенадцать, их свет важнее */
  tris+=cave3FarFrame(C,F,Fd,cx-hw-3,cx+hw+3,cx,dayK);
  tris+=cave3AmberFrame(C,F,Fd,cx-hw-3,cx+hw+3,cx);
  /* убранство залов (22dc): натёки, завесы, кристаллы, жилы на разрезе */
  tris+=cave3DressFrame(C,F,Fd,cx-hw-3,cx+hw+3,cx,first||CAVE3.rush);
  /* озеро (22dd): гладь с зеркалом и тело воды в разрезе */
  tris+=cave3LakeFrame(C,F,Fd,cx-hw-3,cx+hw+3,cx);
  Object.assign(F,{vp:Ls.vp,eye:Ls.eye,t:(G.t/60)%7200,lamp:{p:lp,d:ld,k:1},lampVP,reach,near:reach*.45,
    sun,sunVP:day.m,sunRange:day.range,dayK,mouth,lean,surfY:sY,skyLo,skyHi,expo:1,cutZ:0,bed:Fd.sty.bed});
  M.stat.chunks=list.length;M.stat.left=C.ch3?C.ch3.left:0;M.stat.tris=Math.round(tris);
  M.stat.cpu=+(wallMs()-t0).toFixed(2);
  return cave3GpuFrame(F);
}

/* фонарь кадра: наклон луча, холодный разлив, тёплая лужа на полу (числа — у CAVE3_K в 22db) */
const CAVE3_LAMP={tilt:-.24,spillR:17,spill:[.30,.33,.38],poolX:2.6,poolR:4.2,pool:[.27,.175,.08],warm0:2.6,warm1:8.5,man:[.26,.19,.11],vault:[.13,.15,.18],back:[.12,.135,.16],
  ahead:[.065,.09,.13],bounce:[.34,.42,.48],bounceR:13};

/* ── поверх кадра: то, что ещё не перерисовано (жизнь и находка — M630c) ──
   Те же кисти, что у старого кадра, в той же мерке: окно на линии ходьбы — окно кадра */
function cave3Over(){
  const C=G.cave,Ls=CAVE3.lens;
  if(!Ls)return;
  /* в дальнем объективе плоские кисти поверхности не в своём масштабе: до M630c их нет вовсе */
  if(CAVE3.far>.01)return;
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
/* клавиша карты в пещере: дальний объектив туда и обратно (раньше она здесь молчала) */
const CAVE3_OLD_NAV=navAction;
navAction=function(){
  if(G.mode==="cave"&&CAVE3.live&&cave3FarOk()){CAVE3.farOn=!CAVE3.farOn;return;}
  return CAVE3_OLD_NAV.apply(this,arguments);
};
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
    /* табличка — только у самого организма; его нет рядом (строка устарела) — молчит, у человека не висит */
    const v=pl&&[pl.x/CAVE_PPM,-pl.y/CAVE_PPM+.8,CAVE3_Z];
    if(v&&cave3InFrame(pj,v))at(v,1.4,"cave.act",ln,o);
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
