/* ══════════════ штаб, кантина, «Сорока», абордаж на видеокарте (G11, флот «hq») ══════════════
   Кисти комнат теперь рисуют в GPU-холст (08ca) — выпечками, а не в 2D. Запись
   GPU-холста не требует видеокарты, поэтому здесь, под Node, каждая кисть проходит
   через GcCtx целиком: попросит то, чего холст не умеет, — «GPU-холст: нет …»,
   и набор краснеет здесь, а не СБОЕМ в игре. Остальное — то, что обязано жить без
   устройства: попадания по людям в рубке и кантине, грани абордажа в мире. */
/* кисть → GcCtx: как в gpuBakeRedo, глобальный ctx на время рисования — этот холст.
   Текст GPU-холста растрится, а 2D-портрет грузится только с устройством (08cb, 08ca,
   свои наборы) — здесь они записываются меткой, мерка строки — по числу букв; всё
   прочее (пути, штрихи, градиенты, клип, смешения, тени) — настоящее */
function hqRec(w,h,draw){
  const g=new GcCtx(w,h,1),prev=ctx;let err="";
  g.fillText=g.strokeText=function(){this._ops.push({t:"txt"});};
  g.measureText=t=>({width:String(t).length*5.4});
  /* портрет (2D-холст mgrFace) грузится в текстуру при рисовании — тоже устройство */
  g.drawImage=function(){this._ops.push({t:"img"});};
  ctx=g;try{draw(g);}catch(e){err=e.message;}finally{ctx=prev;}
  return {g,err};
}
TEST_SUITES.push(()=>suite("рубка: кисти пишутся в GPU-холст, по людям тыкают без видеокарты",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(1,["cmd"]));hireMgr(genMgr(2,["fact"]));hireMgr(genMgr(3,["keep"]));
  G.mgrs.forEach(m=>{m.job=m.job||null;});
  const k=300/HQ_H,W2=760/k,L=hqLay(W2,HQ_H),sel=G.mgrs[0].id;
  for(const [nm,fn] of [["стена и пульты",g=>{g.scale(k,k);hqBack(g,L);}],
                        ["голограмма",g=>{g.scale(k,k);hqHolo(g,L);}],
                        ["стол",g=>{g.scale(k,k);hqTable(g,L.W2,L.H2,L.fy,L.seed);}],
                        ["подписи",g=>{g.scale(k,k);hqLabels(g,L,sel,null);}]]){
    const r=hqRec(760,300,fn);
    eq(r.err,"",nm+": GPU-холст умеет всё, что просит кисть");
    ok(r.g._ops.length>0,nm+": что-то нарисовано ("+r.g._ops.length+" команд)");
  }
  const m=G.mgrs[0],col=hex2rgb(MGR_ROLES[m.role].col);
  for(const part of ["legs","top"]){
    const r=hqRec(120,228,g=>{g.scale(2,2);hqFigure(g,30,108,col,0,null,false,m,0,part);});
    eq(r.err,"","фигура, "+part+": без дыр");
  }
  /* ноги не рисуют корпус, корпус — ног: спрайты не двоят тело */
  const nl=hqRec(120,228,g=>hqFigure(g,30,108,col,0,null,false,m,0,"legs")).g._ops.length;
  const nt=hqRec(120,228,g=>hqFigure(g,30,108,col,0,null,false,m,0,"top")).g._ops.length;
  const na=hqRec(120,228,g=>hqFigure(g,30,108,col,0,null,false,null,0)).g._ops.length;
  eq(nl+nt,na,"ноги + корпус = вся фигура ("+nl+" + "+nt+" = "+na+")");
  /* живое — фигуры набора: поля по 11–12, цвета в 0..255 */
  const live=hqLive(L,HQ_ORDER.map((r,i)=>hqMgrAt(i)),sel,null,123);
  ok(live.wall.length>0&&live.holo.length>0,"живое есть на стене и над столом");
  ok([...live.wall,...live.halo,...live.job,...live.holo].every(v=>v.length>=11&&v.slice(1,7).every(Number.isFinite)&&v[10]>=0&&v[10]<=1),
     "у живого все числа конечны, прозрачность в 0..1");
  /* без видеокарты (Node): попадания считаются, картинки нет, ошибок нет */
  const cn={width:760,height:300,__dpr:1,getContext(){return null;}};
  let hits=null,err="";
  try{hits=drawHqRoom(cn,sel,null);}catch(e){err=e.message;}
  eq(err,"","рубка без устройства не падает");
  eq(hits.length,G.mgrs.length,"попадание на каждого, кто стоит у пульта");
  ok(hits.every(h=>h.x>=0&&h.x+h.w<=760&&h.y>=0&&h.y+h.h<=300),"и все — в пределах канвы");
  ok(hits.some(h=>h.id===sel),"выбранный — среди них");
}));
TEST_SUITES.push(()=>suite("кантина: зал пишется в GPU-холст; без устройства пустая кисть даёт попадания",()=>{
  resetWorld();
  const st=G.sys.station;if(st){G.ship.x=st.x+40;G.ship.y=st.y;}
  G.st=G.st||{stype:"trade"};
  const list=[genMgr(4,["cmd"]),genMgr(5,["sci"])];
  const k=240/200,W2=760/k;
  for(const ty of ["trade","indust","yard","sci","outpost"]){
    G.st.stype=ty;
    let hits=[];
    const r=hqRec(760,240,g=>{g.scale(k,k);hits=cantRoomBody(g,W2,200,list,list[0].id,null,[],null);});
    eq(r.err,"","зал «"+ty+"»: GPU-холст умеет всё, что просит кисть");
    ok(hits.some(h=>h.id==="counter")&&list.every(m=>hits.some(h=>h.id===m.id)),"зал «"+ty+"»: стойка и оба кандидата — точки нажатия");
    const {LT,xs}=cantLamps(W2);
    eq(xs.length,LT.n,"зал «"+ty+"»: ламп столько, сколько велит планировка света");
    const u=cantLitUni(W2,200,k);
    ok(Array.from(u).every(Number.isFinite),"зал «"+ty+"»: числа света конечны");
  }
  G.st.stype="trade";
  const cn={width:760,height:240,__dpr:1,getContext(){return null;}};
  let hits=null,err="";
  try{hits=drawCantinaRoom(cn,list,null,null,[],null);}catch(e){err=e.message;}
  eq(err,"","кантина без устройства не падает");
  ok(hits.some(h=>h.id==="counter"),"стойка — точка нажатия");
  ok(list.every(m=>hits.some(h=>h.id===m.id&&h.w>0&&h.h>0)),"у каждого кандидата — попадание в пикселях канвы");
  /* пустая кисть отвечает на всё: вызов, свойство, градиент, мерка */
  const g=RPG_NULL.createLinearGradient(0,0,1,1);g.addColorStop(0,"#fff");
  eq(RPG_NULL.measureText("слово").width,0,"мерка пустой кисти — ноль");
  RPG_NULL.fillStyle="#fff";
  eq(RPG_NULL.fillRect(0,0,1,1),RPG_NOP_R,"вызов пустой кисти отвечает пустым ответом");
}));
TEST_SUITES.push(()=>suite("«Сорока»: оболочка, середина и витрины пишутся в GPU-холст; свет знает лампочки",()=>{
  resetWorld();
  const w=wanderAt(WANDER_T0+1000);
  clockSet(WANDER_T0+1000);
  G.sys=getSystem(w.sx,w.sy);G.sx=w.sx;G.sy=w.sy;G.mode="system";
  ok(openWanderer(),"на борту");
  const S=G.wan,g0=wanGeom(),lots=wanLots(),cur=S.cursor;
  for(const [nm,fn] of [["оболочка",()=>wanShell(g0)],["середина",()=>wanMid(g0,S)],["витрины",()=>wanCases(g0,lots,cur)]]){
    const r=hqRec(W,H,fn);
    eq(r.err,"",nm+": GPU-холст умеет всё, что просит кисть");
    ok(r.g._ops.length>0,nm+": что-то нарисовано");
  }
  const u=wanLitUni(g0,S,lots,cur,now());
  ok(Array.from(u).every(Number.isFinite),"числа света конечны");
  let n=0;for(let i=0;i<8;i++)if(u[16+i*4+2]>0){n++;ok(u[16+i*4]>=0&&u[16+i*4]<=W,"лампочка "+i+" — в кадре по x");}
  const vis=lots.filter((l,i)=>!l.empty&&wanCaseAt(i,cur)).length;
  eq(n,Math.min(8,vis),"лампочек в свете — сколько видно непустых витрин");
  const Q=wanSlot(g0);
  ok(Q.A.y<Q.D.y&&Q.A.x<Q.B.x,"щель окна: ближняя кромка выше дальней, лево левее права");
  let err="";try{drawWanderRoom();}catch(e){err=e.message;}
  eq(err,"","без устройства комната молчит, а не падает");
  exitWanderer();
}));
TEST_SUITES.push(()=>suite("абордаж: грани — в мире, свет — на видеокарте",()=>{
  resetWorld();
  let PB=null;
  for(let hx=-12;hx<12&&!PB;hx++)for(let hy=-12;hy<12&&!PB;hy++){
    if(!starAt(hx,hy))continue;
    const hs=getSystem(hx,hy),hb=pirateBaseOf(hs);
    if(hb){G.sys=hs;G.sx=hx;G.sy=hy;PB=hb;}
  }
  if(!ok(!!PB,"пиратская база нашлась"))return;
  enterRaid(PB);
  const keep=raidGpuDraw;let got=null;
  raidGpuDraw=(Q,V,LP,FS,OC)=>{got={Q,V,LP,FS,OC};};
  let err="";try{updateRaid(1);drawRaid();}catch(e){err=e.message;}finally{raidGpuDraw=keep;}
  eq(err,"","абордаж рисуется");
  if(!ok(!!got,"грани ушли в проход видеокарты"))return;
  ok(got.Q.length>200,"граней много: "+got.Q.length);
  ok(got.Q.every(q=>[q.a,q.b,q.c,q.d].every(p=>p.length===3&&p.every(Number.isFinite))),"у каждой — четыре точки мира");
  ok(got.Q.every(q=>q.col.length===3&&q.col.every(v=>v>=0&&v<=255)&&Number.isFinite(q.li)),"цвет в 0..255, тон конечен");
  ok(got.Q.some(q=>q.bias<0),"накладкам в плоскости стены дан сдвиг по глубине");
  ok(got.Q.some(q=>q.minL>=.4),"у тары нижний порог света");
  ok(got.LP.length>0,"светильники собраны: "+got.LP.length);
  const S=G.raid,dist=p=>Math.hypot(p.x-S.x,p.z-S.z);
  ok(got.LP.every((p,i)=>i===0||dist(got.LP[i-1])<=dist(p)+1e-6),"ближние светильники — первыми");
  ok(["cam","fwd","right","up"].every(k=>got.V[k].length===3)&&got.V.F>0,"камера передана целиком");
  /* та же проекция, что у меток: точка перед камерой ложится в кадр */
  const V=got.V,c=V.cam,f=V.fwd,p=[c[0]+f[0]*300,c[1]+f[1]*300,c[2]+f[2]*300];
  const v=[p[0]-c[0],p[1]-c[1],p[2]-c[2]],zc=v[0]*f[0]+v[1]*f[1]+v[2]*f[2];
  ok(Math.abs(zc-300)<1e-6,"глубина по взгляду — как у 2D");
  ok(/lp:array<vec4f,24>/.test(RAID_GPU_WGSL)&&RAID_LAMPS===24,"шейдер знает, сколько ламп");
  ok(Array.isArray(got.FS)&&Array.isArray(got.OC),"тела-спрайты и тени на полу переданы");
  ok(got.OC.length>=1&&got.OC[0][0]===S.x&&got.OC[0][1]===S.z,"первая тень — под ходоком");
  ok(got.OC.length<=1+S.foes.filter(f=>f.hp>0).length,"теней не больше, чем стоящих");
  /* тело пирата печётся в GPU-холст без дыр: кисть та же, без вдоха */
  const f0=S.foes.find(f=>f.hp>0)||S.foes[0];
  if(f0){
    const K0=FOE_KINDS[f0.kind]||FOE_KINDS.grunt;
    const r=hqRec(128,128,g=>{g.translate(64,64);drawFoeBody(f0,K0,true);});
    eq(r.err,"","тело пирата: GPU-холст умеет всё, что просит кисть");
    const sig=()=>hqRec(128,128,g=>{g.translate(64,64);drawFoeBody(f0,K0,true);}).g._ops.map(o=>o.v?Array.from(o.v).map(v=>v.toFixed(2)).join(","):o.t).join("|");
    const s0=sig(),G0=G.t;G.t+=37;const s1=sig();G.t=G0;
    ok(s0.length>100&&s0===s1,"без вдоха тело не зависит от часов — спрайт печётся раз");
  }
  raidLeave("");
}));
