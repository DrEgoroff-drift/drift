/* ══════════════ шахта на движке: кадр и переключатель (M631a) ══════════════
   Порода из выработки (23ca), свет и проходы пещеры (22db, 22dbw): шахта отдаёт свою плотность
   и свои огни, рисует их движок пещеры. Здесь — объектив, человек, фонарь, день в стволе, копёр
   над устьем и обёртка drawDig: старая рисовалка не тронута, новый вид упал — идёт она, после трёх
   сбоев подряд новый вид снимает себя сам. ?dig=0 — старая. Игра не меняется: клетки, updateDig,
   фауна — те же; кадр только смотрит на них.

   Объектив — по docs/DESIGN-dig-scene.md §3: широкий держит все пятнадцать столбцов (34 м) и ходит
   только по высоте, высокий держит четыре с половиной и ходит в обе стороны. Окно кадра лежит на
   плоскости, где стоит человек (z = DIG3_Z), поэтому клетка игры на экране — чистый масштаб G.viewK:
   тычок «копать сюда» (15-input) попадает в ту клетку, что показана. Когда человек грызёт вниз,
   кадр забегает на полклетки вперёд — забой в кадре. */
const DIG3={on:true,bad:0,err:"",live:false,D:null,t:0,mx:0,my:0,cx:0,cy:0,ld:null,lens:null,hf:null,stat:{cpu:0,chunks:0,left:0}};
try{if(typeof location!=="undefined"&&/[?&]dig=0\b/.test(location.search))DIG3.on=false;}catch(e){}
const DIG3_Z=1.1;
/* доля роста человека в высоте кадра: высокий — широкий; линия ходьбы от низа; даль объектива;
   глаз над полом; догон кадра и шага человека, с; забег кадра по ходу проходки, клеток */
const DIG3_LENS={man:[.077,.085],walk:[.38,.34],dist:[18,32],eye:2.6,tau:.4,step:.12,lead:.5};   /* телефон: пол выше строки подсказки */

function dig3Lens(asp,cx,floorY){
  const L=DIG3_LENS,k=plnSmooth(.6,1.5,asp);
  const Hf=1.8/lerp(L.man[0],L.man[1],k),f=lerp(L.walk[0],L.walk[1],k),D=lerp(L.dist[0],L.dist[1],k);
  const w=Hf*asp,l=cx-w/2,r=cx+w/2,b=floorY-f*Hf,t=b+Hf;
  const ex=cx,ey=floorY+L.eye,ez=DIG3_Z-D;
  const vp=plnM4mul(plnM4lens(l-ex,r-ex,b-ey,t-ey,D,4,600),plnM4move(-ex,-ey,-ez));
  return {k,Hf,f,D,w,l,r,b,t,vp,eye:[ex,ey,ez]};
}
/* доля человека в высоте кадра (для набора и ворот) */
function dig3ManShare(asp){return 1.8/dig3Lens(asp,0,0).Hf;}
/* середина кадра по x: широкий держит весь пролёт, узкий идёт за человеком, но не за край */
/* пролёт рудника по x, м: участок ±40 клеток и метр камня с боков (23ca и 23cc склеены позже — считать здесь) */
function dig3PanX(x,w){
  const a=-MINE_HALF*DIG3_CM-1,b=(MINE_HALF+1)*DIG3_CM+1;
  if(w>=b-a)return (a+b)/2;
  return clamp(x,a+w/2,b-w/2);
}
/* куда грызёт: сосед, чья клетка — цель проходки */
function dig3Dir(D){
  const t=D.target;if(!t)return null;
  for(const [dx,dy] of [[0,1],[0,-1],[-1,0],[1,0]])if(D.cells[(D.col+dx)+","+(D.row+dy)]===t)return [dx,dy];
  return null;
}

/* ── копёр над устьем: две А-ноги из бруса, верхняя балка, шкив, оранжевый пояс, лампа ──
   Свой, простой: тело планеты (plnThingMineMesh) просит землю мира, а у шахты своя линия */
const DIG3_HF={h:5.4,foot:1.75,z0:.35,z1:2.45,wood:[.105,.07,.04],steel:[.07,.075,.08],band:[.62,.2,.03]};
/* брус: шесть граней, нормали наружу */
function dig3Box(m,x0,x1,y0,y1,z0,z1,col,mat){
  const P=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],M=mat==null?PLN_MAT.bark:mat;
  const F6=[[0,3,2,1,[0,0,-1]],[4,5,6,7,[0,0,1]],[0,4,7,3,[-1,0,0]],[1,2,6,5,[1,0,0]],[3,7,6,2,[0,1,0]],[0,1,5,4,[0,-1,0]]];
  for(const f of F6){const n=f[4],a=plnVert(m,P[f[0]],n,col,M),b=plnVert(m,P[f[1]],n,col,M),c=plnVert(m,P[f[2]],n,col,M),d=plnVert(m,P[f[3]],n,col,M);plnQuad(m,a,b,c,d);}
}
function dig3HeadMesh(F){
  const m=plnMesh(1<<11),q=dig3HeadBody(m,F,[0,0],false);
  return {geo:plnGeo(plnMeshDone(m)),lamp:q.lamp,rope:q.rope,gen:PLN_GPU.gen,f:F.gen};
}
/* копёр в меш m со сдвигом o = [x, y] (метры мира над рудником — 23cd); park — клеть стоит у устья
   и канат к ней (копёр поверхности, вещь планеты) */
function dig3HeadBody(m,F,o,park){
  const K=DIG3_HF,CM=DIG3_CM,x0=CM*.5,g0=dig3Ground(F,x0),top=g0+K.h,M=PLN_MAT,P=(x,y,z)=>[x+o[0],y+o[1],z];
  const tube=(a,b,rad,col,mat)=>plnTube(m,{path:[P(a[0],a[1],a[2]),P(b[0],b[1],b[2])],rad,sides:4,col,mat});
  for(const z of [K.z0,K.z1]){
    for(const s of [-1,1]){
      const fx=x0+s*K.foot,fy=dig3Ground(F,fx)-.25;
      tube([fx,fy,z],[x0+s*.18,top,z],.11,K.wood,M.bark);
    }
    /* пояс: ригель на трети высоты — единственное яркое пятно копра */
    const by=lerp(g0,top,.38),bw=K.foot*.62+.1;
    tube([x0-bw,by,z],[x0+bw,by,z],.075,K.band,M.rock);
    tube([x0-K.foot*.7,lerp(g0,top,.1),z],[x0+K.foot*.35,lerp(g0,top,.7),z],.05,K.wood,M.bark);
  }
  tube([x0,top+.05,K.z0-.2],[x0,top+.05,K.z1+.2],.13,K.steel,M.rock);
  /* шкив: обод в плоскости x-y на середине глубины и ось */
  const zc=(K.z0+K.z1)/2,R=.62,ring=[];
  for(let k=0;k<=18;k++){const a=k/18*TAU;ring.push(P(x0+Math.cos(a)*R,top+.62+Math.sin(a)*R,zc));}
  plnTube(m,{path:ring,rad:.06,sides:5,col:K.steel,mat:M.rock});
  for(let k=0;k<3;k++){const a=k/3*Math.PI;
    tube([x0-Math.cos(a)*R,top+.62-Math.sin(a)*R,zc],[x0+Math.cos(a)*R,top+.62+Math.sin(a)*R,zc],.025,K.steel,M.rock);}
  /* оголовок: брус вокруг устья по земле — край земли планеты у ствола под ним */
  const zd=DIG3_ROOM.zd,bw=.42,bd=(xa,xb,za,zb)=>{
    const y=Math.max(dig3Ground(F,xa),dig3Ground(F,xb),dig3Ground(F,(xa+xb)/2))+.1;
    dig3Box(m,xa+o[0],xb+o[0],y-.32+o[1],y+o[1],za,zb,K.wood);
  };
  bd(-bw,CM+bw,0,.3);bd(-bw,CM+bw,zd,zd+bw);bd(-bw,0,.3,zd);bd(CM,CM+bw,.3,zd);
  const rope=[x0+R*.98,top+.62,zc];
  if(park){
    /* клеть у устья и канат к ней со шкива */
    dig3CageBody(m,P(x0,g0,0));
    tube([x0,g0+2.45+.55,zc],rope,.022,[.03,.03,.032],M.bark);
  }
  /* канат идёт со шкива к клети — его тянет 23cb, здесь только точка схода с обода */
  return {lamp:P(x0,top+.1,K.z0-.25),rope};
}

/* ── свет устья в стволе (DESIGN-mine §8) ──
   Глубже окна планеты над головой одна порода, и глубину говорила только надпись. Теперь сверху в
   ствол падает свет устья — днём небо, ночью фонарь копра — и гаснет с глубиной: у первого горизонта
   ствол над клетью светлый и холодный, на сотне метров от неба остаётся тонкая нить. Огонь стоит над
   верхним краем окна (за кадром, как само устье), его разлив виден на стенах ствола, проводниках и
   канате; там, где ещё светит день у устья (dayK), этот свет уступает ему. */
const DIG3_SHAFT={fall:30,k:5.1,r:9,lamp:[.5,.33,.15]};
/* сила света устья на глубине d м под ним: квадрат расстояния, смягчённый отскоком от стен ствола */
function dig3ShaftK(d){return 1/(1+Math.pow(Math.max(0,d)/DIG3_SHAFT.fall,3));}
function dig3ShaftLight(F,Ls,sY,night,skyLo,dayK,my){
  const CM=DIG3_CM,Z=DIG3_SHAFT,top=Math.min(Ls.t-.5,sY-1),low=Math.max(Ls.b,my+3.2);
  DIG3.stat.shaft=0;
  if(sY-top<=0||top<=low||dayK>.99)return;
  const day=1-plnSmooth(.2,.9,night),zc=DIG3_ROOM.zd*.5;
  /* небо у горизонта — днём; тёплый фонарь копра — ночью; оба приглушены, как свет, отскочивший от стен */
  const c0=[0,1,2].map(i=>(skyLo[i]*day+Z.lamp[i]*.55*(1-day))*Z.k*(1-dayK));
  /* верхний огонь — над краем кадра, широкий: его разлив гаснет вниз по стволу, и ствол светлеет к верху
     кадра, как труба, в которую сверху падает свет; второй — слабый, у середины, чтобы низ не провалился */
  const k=dig3ShaftK(sY-top);
  if(k<.02)return;
  const span=top-low;
  F.lights.push({p:[CM*.5,top+1,zc-.2],r:Math.max(Z.r,span*1.15),c:c0.map(v=>v*k*1.4),core:1});
  F.lights.push({p:[CM*.5,top-span*.5,zc+.35],r:Z.r,c:c0.map(v=>v*dig3ShaftK(sY-top+span*.5)*.35),core:1});
  DIG3.stat.shaft=+k.toFixed(3);
}
function dig3Frame(){
  const t0=wallMs(),D=G.dig,Fd=dig3Field(D),M=DIG3,Ln=DIG3_LENS,CM=DIG3_CM;
  const first=M.D!==D,t=wallMs(),dt=first?0:Math.min(.1,Math.max(0,(t-M.t)/1000));
  M.t=t;
  /* человек: ноги рудника (23cc, px мира, y вниз) — без своего сглаживания, иначе он отстанет
     от пола клети; у верха ствола пол клети — земля у устья */
  const Mm=mineState(D),sY0=dig3Ground(Fd,CM*.5),gy=y=>-y/DIG3_PPM+sY0*Math.max(0,1-y/DIG_CELL);
  if(first){M.D=D;M.ld=null;}
  M.mx=Mm.x/DIG3_PPM;M.my=gy(Mm.y);
  const mx=M.mx,my=M.my,dir=dig3Dir(D),face=D.face<0?-1:1;
  /* кадр: за человеком с отставанием, с забегом по ходу — в забой, по штреку, по ходу клети */
  const asp=W/H,L0=dig3Lens(asp,0,0),walk=Mm.mode==="walk"&&D.walkAmp>.2;
  const lx=dir?dir[0]*Ln.lead*CM:walk?face*.9*CM:0;
  /* клеть у устья: дорога — вниз, кадр опущен, чтобы небо не съело полэкрана (копёр ещё целиком) */
  const ly=dir?-dir[1]*Ln.lead*CM:Mm.mode==="cage"&&Mm.cy<=0&&!Mm.cto?-L0.Hf*.12:-(Mm.ride||0)*1.4*CM;
  const wx=dig3PanX(mx+lx,L0.w),wy=my+ly;
  if(first){M.cx=wx;M.cy=wy;}
  else{const e=1-Math.exp(-dt/Ln.tau);M.cx+=(wx-M.cx)*e;M.cy+=(wy-M.cy)*e;}
  if(Math.abs(wy-M.cy)>L0.Hf*.6||Math.abs(wx-M.cx)>L0.w*.6){M.cx=wx;M.cy=wy;}   /* маяк, стенд: скачок — без догона */
  const cx=M.cx,Ls=dig3TopLens(dig3Lens(asp,cx,M.cy)),K=H/(Ls.Hf*DIG3_PPM);   /* на входе объектив съезжает с поверхности (23cd) */
  G.viewK=K;G.viewX=(Ls.l+Ls.r)*.5*DIG3_PPM-W/(2*K);G.viewY=-Ls.t*DIG3_PPM;
  M.lens=Ls;
  /* планета над рудником: её кадр считается сейчас — час и солнце ниже берутся из него */
  const Tp=dig3TopPre(D,Fd,Ls);
  /* линия земли у ствола — высота поверхности для неба и дня */
  const sY=dig3Ground(Fd,CM*.5),land=Ls.t>sY-4;
  /* куски: окно на глубине, до которой видно (у поверхности — до гряды) */
  const zv=land?DIG3_CH.zcap:6,sp=(zv-Ls.eye[2])/Ls.D,hw=Ls.w/2*sp,hh=Ls.Hf/2*sp,mid=(Ls.b+Ls.t)/2;
  /* бюджет: вход съездом держит объектив у поверхности, пока порода не достроена (23cd dig3HandU) */
  const hd=DIG3_TOP.hand,lim=hd?(hd.t0?DIG3_CH.ms:DIG3_CH.hold):first?DIG3_CH.first:DIG3_CH.ms;
  const list=dig3Chunks(Fd,[cx-hw-2,cx+hw+2,mid-hh-2,mid+hh+2],mx,my,lim);
  const F={batches:[],lamps:[],draw:[],lights:[],glows:[]};
  const S={walkPhase:D.walkPhase,walkAmp:D.walkAmp,on:true,jetOn:false,vy:0,mining:!!D.target,suit:G.surf?G.surf.suit:100};
  plnManFrame(F,[mx,my,DIG3_Z],face,0,{S,lamp:0});
  /* фонарь на шлеме: туда, куда грызёт (вниз — вниз), иначе по взгляду; поворачивается плавно */
  const kit=typeof kitStat==="function"?kitStat():{lamp:1},reach=cave3Reach(kit.lamp)*.8;
  const want=dir?plnNorm([dir[0]+(dir[1]?face*.3:0),dir[1]?-dir[1]*1.2:CAVE3_LAMP.tilt,.34]):plnNorm([face,CAVE3_LAMP.tilt,.34]);
  M.ld=M.ld?plnNorm(plnMix3(M.ld,want,1-Math.exp(-dt/.18))):want;
  const ld=M.ld,lp=[mx+.2*face,my+1.71,DIG3_Z-.17];
  const lampVP=plnM4mul(cave3Persp(CAVE3_K.fov,1,.12,140),plnM4look(lp,[lp[0]+ld[0],lp[1]+ld[1],lp[2]+ld[2]],[0,1,0]));
  /* день: час мира наверху; столб дня — во всю ширину земли (поверхность светит вся), под землёй
     его гасит карта тени: камень над выработкой закрывает солнце, открыт только ствол */
  const Hr=PLN.sun,night=Hr?clamp(Hr.night||0,0,1):0,dayK=(1-plnSmooth(.2,.9,night))*(1-plnSmooth(8*CM,12*CM,sY-my));
  const sx=Hr&&Hr.dir&&Hr.dir[0]>0?1:-1,sun=plnNorm([.18*sx,1,.1]),lean=[-sun[0]/sun[1],sun[2]/sun[1]];
  const mouth=[CM*.5,DIG3_ROOM.zd*.5,40,12];
  const day=cave3DayBox(sun,[cx-Ls.w*.6-4,cx+Ls.w*.6+4,sY-8*CM,sY+6,-1,DIG3_CH.zcap+1]);
  const lk=Hr&&Hr.look,skyLo=lk?lk.skyHor:[.62,.78,.95],skyHi=lk?lk.skyZen:[.13,.33,.78];
  /* огни без теней: разлив фонаря, лужа там, куда он смотрит, отсвет на человеке, свод, задняя стена */
  const Lt=(p,r,c,core)=>F.lights.push({p,r,c,core}),LL=CAVE3_LAMP,zb=Math.min(DIG3_ROOM.zd-.4,DIG3_Z+1.2);
  /* фонарь днём над землёй не нужен — и светил бы сквозь лист разреза в камень под устьем */
  const lon=1-dayK*plnSmooth(sY-2.2,sY-.4,my),Lk=c=>[c[0]*lon,c[1]*lon,c[2]*lon];
  Lt(lp,LL.spillR*.8,Lk(LL.spill),1);
  const pd=dir&&dir[1]>0?[mx,my-.1]:dir&&dir[1]<0?[mx,my+CM-.3]:[mx+(dir?dir[0]:face)*1.9,my+.25];
  Lt([pd[0],pd[1],DIG3_Z+.4],LL.poolR*.85,Lk(LL.pool),1);
  Lt([mx+.55*face,my+1.05,DIG3_Z-.9],1.9,LL.man,1);
  Lt([mx+.4*face,my+CM-.25,DIG3_Z+.5],4.2,Lk(LL.vault),1);
  Lt([mx-1.6*face,my+1.2,zb],6.5,Lk(LL.back),1);
  Lt([mx+3.4*face,my+1.1,zb],8,Lk(LL.ahead),1);
  /* забой: тёплая искра там, где грызёт резак */
  if(dir){
    const bx=(D.col+dir[0]+.5)*CM-dir[0]*CM*.45,by=-(D.row+dir[1]+.5)*CM+dir[1]*CM*.45,fl=.75+.25*Math.sin(G.t*.9)*Math.sin(G.t*.37);
    Lt([bx,by,DIG3_Z+.3],3.2,[.55*fl,.32*fl,.12*fl],1);F.glows.push({p:[bx,by,DIG3_Z],c:[1,.62,.3],k:.55*fl,s:.35});
  }
  /* день в устье: столб сверху и отскок от стен ствола */
  if(dayK>.01){
    Lt([CM*.5,sY-2,DIG3_ROOM.zd*.5],11,[.30*dayK,.38*dayK,.44*dayK]);
    Lt([CM*.5,sY-6,DIG3_ROOM.zd*.6],9,[.16*dayK,.20*dayK,.24*dayK]);
  }
  dig3ShaftLight(F,Ls,sY,night,skyLo,dayK,my);
  for(const q of F.lamps)Lt(q.p,q.r,[q.c[0]*q.k*.3,q.c[1]*q.k*.3,q.c[2]*q.k*.3]);
  /* лампа площадки: на каждом открытом горизонте, у ворот ствола */
  const r0=Math.max(0,Math.floor(-Ls.t/CM)-1),r1=Math.ceil(-Ls.b/CM)+1;
  for(let r=r0;r<=r1;r++){
    if(!mineIsLevel(r)||!dig3Dug(Fd,0,r))continue;
    const q=[CM+.3,-(r+1)*CM+2.05,.55],fl=.9+.1*Math.sin(G.t*.05+r);
    Lt(q,7.5,[.5*fl,.32*fl,.14*fl]);F.glows.push({p:q,c:[1,.68,.34],k:.6*fl,s:.4});
  }
  /* копёр */
  if(land){
    if(!M.hf||M.hf.gen!==PLN_GPU.gen||M.hf.D!==D){if(M.hf)plnGeoFree(M.hf.geo);M.hf=dig3HeadMesh(Fd);M.hf.D=D;}
    if(!DIG3_TOP.live)F.draw.push({geo:M.hf.geo,lamp:true,sun:true,refl:false});   /* над рудником копёр — тело планеты */
    const q=M.hf.lamp,nk=1-plnSmooth(.1,.5,1-night);
    Lt([q[0],q[1]-.6,q[2]+.4],9,[.5*(.3+nk),.33*(.3+nk),.15*(.3+nk)]);
    F.glows.push({p:q,c:[1,.74,.42],k:.35+.5*nk,s:.5});
  }
  F.glows.push({p:lp,c:[1,.74,.42],k:.9,s:.42});
  /* убранство: рельсы, крепь, лампы штреков, лестницы, ствол; клеть на канате (23cb) */
  let tris=dig3DressFrame(F,Fd,D,{cy:Mm.cy,gy},cx-Ls.w*.6,cx+Ls.w*.6,Ls.b-2,Ls.t+2,Lt);
  tris+=dig3BeastFrame(F,Fd,D,gy);   /* кусачие: звери планеты (23ce) */
  for(const c of list){
    const g=c.geo;
    if(c.nRock>0)F.draw.push({geo:g,first:0,n:c.nRock,lamp:true,sun:true,refl:true});
    if(g.n>c.nRock)F.draw.push({geo:g,first:c.nRock,n:g.n-c.nRock,lamp:false,sun:true});
    tris+=g.n/3;
  }
  for(const b of F.batches)F.draw.push({geo:b.geo,inst:b.inst,lamp:false,sun:true,refl:true});
  if(F.lights.length>12){
    const w=q=>Math.max(q.c[0],q.c[1],q.c[2])*q.r/(1+Math.hypot(q.p[0]-cx,q.p[1]-my)/8);
    const core=F.lights.filter(q=>q.core),rest=F.lights.filter(q=>!q.core).sort((a,b)=>w(b)-w(a));
    F.lights=core.concat(rest.slice(0,12-core.length));
  }
  Object.assign(F,{vp:Ls.vp,eye:Ls.eye,t:(G.t/60)%7200,lamp:{p:lp,d:ld,k:lon},lampVP,reach,near:reach*.45,
    sun,sunVP:day.m,sunRange:day.range,dayK,mouth,lean,surfY:sY,skyLo,skyHi,expo:1,cutZ:0,bed:Fd.bed});
  M.stat.chunks=list.length;M.stat.left=M.ch?M.ch.left:0;M.stat.tris=Math.round(tris);M.stat.lights=F.lights.length;
  M.stat.cpu=+(wallMs()-t0).toFixed(2);
  return dig3TopPost(F,Tp);
}

/* ── поверх кадра: то, что ещё не перерисовано (кольцо импульса и полоса проходки) ──
   Та же кисть, что у старого кадра, в той же мерке: окно на линии человека — окно кадра */
function dig3Over(){
  const D=G.dig;
  if(!D||!DIG3.lens)return;
  const camx=G.viewX,camy=G.viewY;
  if(DIG3_BEAST.on)dig3ZapRing(camx,camy);else drawDigFauna(camx,camy);
  const t=D.target,dir=dig3Dir(D);
  if(!t||!dir)return;
  const col=D.col+dir[0],row=D.row+dir[1],x=col*DIG_CELL-camx,y=row*DIG_CELL-camy,k=(DIG_CELL-6)*clamp(t.prog/t.hard,0,1);
  const TP=GPU.on?gpuNext():null;
  if(TP){
    const TS=[[0,x+3,y+DIG_CELL-8,x+DIG_CELL-3,y+DIG_CELL-4,0,0,0,0,0,.55]];
    if(k>0)TS.push([0,x+3,y+DIG_CELL-8,x+3+k,y+DIG_CELL-4,0,0,242,178,92,1]);
    gpuShapes(TP,gpuShpAt(TS,lifeHere(0,0)),{blend:"over"});
    return;
  }
  ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(x+3,y+DIG_CELL-8,DIG_CELL-6,4);
  ctx.fillStyle="#f2b25c";ctx.fillRect(x+3,y+DIG_CELL-8,k,4);
}

/* ── переключатель ── */
const DIG3_OLD_DRAW=drawDig;
const DIG3_BLOOM=BLOOM_K.dig;
drawDig=function(){
  let ok=false;
  if(DIG3.on&&DIG3.bad<3&&CAVE3.bad<3&&G.dig&&G.dig.p){
    try{
      plnQualAuto();
      ok=cave3GpuReady()&&dig3Frame();
      if(ok)DIG3.bad=0;
    }catch(e){
      DIG3.bad++;DIG3.err=String((e&&e.stack)||e).slice(0,600);plnLog("шахта: кадр: "+DIG3.err);
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  /* свечение у нового вида своё; движку оставлено только зерно */
  BLOOM_K.dig=ok?0:DIG3_BLOOM;
  DIG3.live=ok;
  if(!ok){DIG3.D=null;DIG3_OLD_DRAW();return;}
  withScale(G.viewK,dig3Over);
};
/* тычок по клетке: та клетка, что показана, — окно кадра лежит на плоскости человека */
const DIG3_OLD_WALK=mouseWalkAt;
mouseWalkAt=function(clientX,clientY){
  if(G.mode==="dig"&&G.dig&&DIG3.live&&DIG3.lens){
    const rc=cvsRect(),sx=(clientX-rc.left)*W/rc.width,sy=(clientY-rc.top)*H/rc.height,K=G.viewK||1;
    G.dig.walkTarget={col:Math.floor((sx/K+G.viewX)/DIG_CELL),row:Math.floor((sy/K+G.viewY)/DIG_CELL)};
    return;
  }
  return DIG3_OLD_WALK.apply(this,arguments);
};
