/* ══════════════ спуск планеты: касание без склейки, площадка, старый путь (M830) ══════════════ */
/* Первый кадр поверхности стоит в окне и мерке последнего кадра спуска (PLN.hand, 21pza → 21pz),
   а за PLN_HAND_S уходит к объективу ходьбы, и ближний объектив продолжает с доли спуска; площадка —
   плита в кадре на касании, корабль стоит на ней; показания — метры;
   с ?pln=0 (PLN.on=false) заход рисует старый холст, с новым видом — только спуск. */
function dcWorld(){
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  startLanding(p);
  const L=G.land,tr=L.tr;
  L.x=tr.padX+1.2*PLN_M;L.y=groundAt(tr,L.x)-LAND_GY;
  L.vx=0;L.vy=0;L.a=0;L.over=70;L.ok=true;L.gear=1;
  return {p,L,tr};
}
function dcLensEq(a,b,what){
  for(const k of ["vx","vy","ws","hs","ex","ey","D"])
    ok(Math.abs(a[k]-b[k])<1e-6,what+": "+k+" "+a[k].toFixed(3)+" = "+b[k].toFixed(3));
}
TEST_SUITES.push(()=>suite("спуск: касание без склейки и площадка в кадре (M830)",()=>{
  const pOn=PLN.on,pBad=PLN.bad,pHand=PLN.hand,pGlide=PLN.glide,pY0=PLN.y0;
  PLN.on=true;PLN.bad=0;
  const {L,tr}=dcWorld();
  PLN.y0=tr.padY;
  /* последний кадр спуска: корабль стоит на опорах, отсчёт касания идёт */
  const Sd={tr,p:L.p,cam:{x:L.x,y:L.y},x:L.x,y:L.y,face:1,swim:0,shake:0};
  /* у земли спуск смотрит ближним объективом: доля .6 */
  const K=surfScale()*1.6,C1=plnLens(Sd,K,plnDescLens(L,groundAt(tr,L.x),.6));
  ok(PLN.hand&&PLN.hand.tr===tr,"спуск запомнил своё окно");
  eq(PLN.hand.t0,0,"часы передачи ещё не пошли");
  /* площадка в кадре: середина и оба конца рядов огней внутри окна, земля под ней — тоже */
  const hx=PLN_LPAD.hx*PLN_M;
  ok(tr.padX-hx>C1.vx&&tr.padX+hx<C1.vx+C1.ws,"площадка по ширине в кадре: "+Math.round(tr.padX-C1.vx)+" из "+Math.round(C1.ws));
  ok(tr.padY>C1.vy&&tr.padY<C1.vy+C1.hs,"площадка по высоте в кадре: "+Math.round(tr.padY-C1.vy)+" из "+Math.round(C1.hs));
  /* первый кадр поверхности: человек вышел к трапу, а окно и мерка — спуска */
  enterSurface();
  const S=G.surf;S.cam={x:S.x,y:S.y};
  ok(Math.abs(S.x-L.x)>10,"человек стоит в стороне от корабля: камера ходьбы смотрела бы иначе");
  const h=plnHandAge(S);
  ok(h&&h.w===1,"первый кадр поверхности — доля спуска 1");
  ok(Math.abs(PLN.glide-.6)<1e-9,"ближний объектив продолжает с доли спуска: "+PLN.glide);
  const C2=plnLens(S,lerp(K*2,h.K,h.w),(ws,hs,f)=>plnHandWin(S,ws,hs,f,h));
  dcLensEq(C2,C1,"объектив первого кадра поверхности = объектив последнего кадра спуска");
  /* середина передачи — между окнами, конец — объектив ходьбы */
  h.t0=wallMs()-PLN_HAND_S*500;
  const hm=plnHandAge(S);
  ok(hm&&hm.w>.05&&hm.w<.95,"на полпути доля спуска между 0 и 1: "+(hm&&hm.w.toFixed(2)));
  const walk=S.cam.x+camOffset(S).x,Cm=plnLens(S,K,(ws,hs,f)=>plnHandWin(S,ws,hs,f,hm));
  const cm=Cm.vx+Cm.ws/2;
  ok((cm-walk)*(cm-L.x)<0,"середина окна на полпути между кораблём и человеком");
  h.t0=wallMs()-PLN_HAND_S*1000-50;
  eq(plnHandAge(S),null,"после передачи — объектив ходьбы");
  eq(PLN.hand,null,"передача забыта");
  /* чужая земля передачу не берёт */
  PLN.hand={tr:{},cx:0,fy:0,K:1,t0:0,w:1};
  eq(plnHandAge(S),null,"окно другой посадки не передаётся");
  PLN.on=pOn;PLN.bad=pBad;PLN.hand=pHand;PLN.glide=pGlide;PLN.y0=pY0;
  resetWorld();
}));
TEST_SUITES.push(()=>suite("спуск: показания в метрах, огни площадки живут, старый путь при ?pln=0 (M830)",()=>{
  const pOn=PLN.on,pBad=PLN.bad;
  const {L,tr}=dcWorld();
  L.over=0;L.auto=false;
  L.y=groundAt(tr,L.x)-LAND_GY-20*PLN_M;L.vy=.5;L.vx=-.2;
  L.x=tr.padX-30*PLN_M;L.y=groundAt(tr,L.x)-LAND_GY-20*PLN_M;
  const r=plnLandRead(L);
  ok(/^высота 20 м · снижение 2,3 м\/с\nснос 0,9 м\/с · площадка 30 м ▶$/.test(r),"ручной заход в метрах: "+r);
  L.auto=true;
  ok(/^автопосадка · 20 м\nплощадка 30 м ▶$/.test(plnLandRead(L)),"автопосадка: "+plnLandRead(L));
  L.auto=false;
  L.x=tr.padX+.4*PLN_M;L.y=groundAt(tr,L.x)-LAND_GY-3.25*PLN_M;
  ok(/^высота 3,3 м · .+\nснос .+ · над площадкой$/.test(plnLandRead(L)),"над площадкой: "+plnLandRead(L));
  /* кромка: штрихи не гаснут; волна захода разгорается по ним, касание её гасит — разметка ровная */
  let lo=1e9,hi=0,flat=new Set();
  for(let t=0;t<6;t+=.05)for(const s of PLN_LPAD_SPOTS){const g=plnPadGlow(s,t,1);lo=Math.min(lo,g);hi=Math.max(hi,g);flat.add(plnPadGlow(s,t,0));}
  ok(lo>.4,"штрих кромки не гаснет: минимум "+lo.toFixed(2));
  ok(hi>2.5,"волна захода разгорается: максимум "+hi.toFixed(2));
  eq(flat.size,1,"после касания разметка ровная");
  eq(PLN_LPAD_SPOTS.length,32,"штрихов на кромке: по десять вдоль и по шесть на торцах");
  let bl=1e9;for(let t=0;t<6;t+=.05)for(let i=0;i<2;i++)bl=Math.min(bl,plnPadBulb(i,t));
  ok(bl>2,"огни на стойках не гаснут: минимум "+bl.toFixed(2));
  /* корабль стоит на плите: на суше — на её верху над грунтом, над водой — над водой, мимо плиты — на земле */
  const kRib=plnLandRibAt,Ld={shipZ:7,g:2},tp={padX:100*PLN_M};
  plnLandRibAt=(q,x,z)=>q.g;
  try{
    ok(Math.abs(plnPadLift(Ld,tp,-1e9,100.5)-PLN_LPAD.rim)<1e-9,"на суше корабль поднят на кромку плиты: "+plnPadLift(Ld,tp,-1e9,100.5));
    ok(Math.abs(plnPadTop(Ld,tp,3)-(3.05+PLN_LPAD.rim))<1e-9,"над водой плита встаёт из воды");
    ok(Math.abs(plnPadLift(Ld,tp,3,100)-(1.05+PLN_LPAD.rim))<1e-9,"над водой корабль стоит на плите, не в воде");
    eq(plnPadLift(Ld,tp,-1e9,100+PLN_LPAD.hx+1),0,"мимо плиты корабль стоит на земле");
  }finally{plnLandRibAt=kRib;}
  /* ?pln=0: заход рисует старый холст, новый спуск не зовётся */
  const kMat=planetMat,kDesc=plnDescent,kReady=plnGpuReady,kQual=plnQualAuto;
  let old=0,neu=0;
  planetMat=function(){old++;throw new Error("старый путь");};
  plnDescent=function(){neu++;return true;};
  plnGpuReady=function(){return true;};
  plnQualAuto=function(){};
  try{
    L.over=0;PLN.on=false;PLN.bad=0;
    try{drawLanding();}catch(e){}
    eq(old,1,"?pln=0: старая посадка рисует");
    eq(neu,0,"?pln=0: новый спуск не зовётся");
    PLN.on=true;old=0;
    let thrown=null;
    try{drawLanding();}catch(e){thrown=e.message;}
    eq(thrown,null,"новый вид: кадр без исключений");
    eq(neu,1,"новый вид: спуск рисует");
    eq(old,0,"новый вид: старое небо, грунт и выпечка посадки не трогаются");
    eq(BLOOM_K.landing,0,"новый вид: свечение движка на заходе снято");
  }finally{
    planetMat=kMat;plnDescent=kDesc;plnGpuReady=kReady;plnQualAuto=kQual;
    BLOOM_K.landing=PLN_DESC.bloom;PLN.on=pOn;PLN.bad=pBad;
  }
  resetWorld();
}));
TEST_SUITES.push(()=>suite("спуск: ночная плита, тишина после касания, подсказка залежей у залежи (M830 tail)",()=>{
  const pOn=PLN.on,pLive=PLN_FRAME.live,pSun=PLN.sun,pHand=PLN.hand,kOk=hangOk,kGeo=plnPadGeo,kRec=plnRec,kSet=plnInstSet,kRib=plnLandRibAt;
  /* плита по свету: днём штрихов нет и ламп нет; ночью штрихи на 40 % — ярче огней они не бывают */
  const Q={dash:{},body:{},bulb:{},ib:{},id:{},iu:{},a:[0],d:[1],u:[2],hx:PLN_LPAD.hx,hz:PLN_LPAD.hz,dz:PLN_LPAD.dz,post:PLN_LPAD.post,col:PLN_LPAD.col};
  const cols=[];
  plnPadGeo=()=>Q;plnInstSet=()=>{};plnLandRibAt=()=>0;
  plnRec=(a,k,p,sc,yw,hk,sd,ca)=>{if(a===Q.d)cols.push(Math.max(ca[0],ca[1],ca[2]));};
  try{
    const run=night=>{PLN.sun={night};cols.length=0;const F={batches:[],lamps:[],waterY:-1e9};plnPadFrame(F,{shipZ:7,shipYaw:0},{padX:0},1);return F;};
    const day=run(0);
    eq(day.batches.filter(b=>b.geo===Q.dash).length,0,"днём разметки на плите нет");
    eq(day.lamps.length,0,"днём огни стоек не светят на плиту");
    const nt=run(1);
    eq(nt.batches.filter(b=>b.geo===Q.dash).length,1,"ночью разметка есть");
    eq(nt.lamps.length,2,"ночью ключ плиты — два огня на стойках");
    eq(cols.length,PLN_LPAD_SPOTS.length+2,"штрихи и два блика на кромке под огнями");
    const dm=Math.max(...cols.slice(0,PLN_LPAD_SPOTS.length));
    ok(dm<=PLN_LPAD_DASH*4+1e-9,"ночью штрих не ярче 40 % волны: "+dm.toFixed(2));
    ok(dm<plnPadBulb(0,0)*.5,"огни стоек ярче разметки: "+dm.toFixed(2)+" против "+plnPadBulb(0,0).toFixed(2));
  }finally{plnPadGeo=kGeo;plnRec=kRec;plnInstSet=kSet;plnLandRibAt=kRib;PLN.sun=pSun;}
  /* первый кадр поверхности: «залежей: n» уходит в табличку, #msg молчит, пока идёт передача объектива */
  dcWorld();
  hangOk=()=>true;PLN.on=true;PLN_FRAME.live=true;
  try{
    enterSurface();
    const S=G.surf;
    ok(!/^залежей/.test(String(G.msg||"")),"счёт залежей не сообщение: "+JSON.stringify(G.msg));
    eq(PLN_WORDS.cnt,S.deposits.length,"счёт залежей — в табличке у залежи");
    PLN.hand={tr:S.tr};
    ok(plnMsgHush()&&msgHeld(),"пока идёт передача объектива, #msg молчит и его срок стоит");
    PLN.hand=null;PLN_WORDS.end=wallMs()-(PLN_WORDS_HUSH*1000+50);
    ok(!plnMsgHush()&&!msgHeld(),"человек вышел — #msg говорит");
    /* подсказка залежей: не полосой сверху, а табличкой у залежи */
    S.x=S.shipX+9999;S.cave=null;G.surfTipShown=0;
    eq(surfaceHint(),null,"под слоем слов полосы с подсказкой залежей нет");
    eq(PLN_WORDS.tip,G.t,"подсказка залежей отдана табличке этого кадра");
    PLN_FRAME.live=false;G.surfTipShown=0;
    ok(/^ЦВЕТНЫЕ КРИСТАЛЛЫ/.test(String(surfaceHint())),"без кадра движка подсказка — прежней полосой");
  }finally{hangOk=kOk;PLN.on=pOn;PLN_FRAME.live=pLive;PLN.hand=pHand;}
  resetWorld();
}));
