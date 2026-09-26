/* ── станция на видеокарте, ступень 1 (DESIGN-gpu «station master») ──
   Тело станции (17c drawStationBody) печётся мастером с мипами раз на плотность
   экрана; живое записывается stLive и кладётся поверх каждый кадр. В 2D stLive
   рисует на месте — выпечка stationArt та же, что была */
/* ── живое на станции поверх мастера (ступень 1) ──
   Мастер станции печётся раз на плотность экрана (мипы, как у корпусов), без
   времени в ключе. Что живёт — огни, кран, стволы турелей, тарелки, кольцо — в
   выпечку не идёт: stLive записывает кусок с его матрицей в осях станции, кадр
   зовёт его снова, и кусок кладёт фигуры (ST_EM) и спрайты поверх. В 2D кусок
   рисует на месте, как рисовал. Огни — явная эмиссия (правило 16/n): точка
   краской, ядро сложением (в выпечке их поднимал множитель em у GST), узкий ореол */
let ST_REC=null,ST_EM=null;
const ST_EMIT=.7,ST_HALO=.35;
function stLive(fn){
  if(ST_REC){ST_REC.L.push({m:ST_REC.inv.multiply(ctx.getTransform()),fn,z:ST_REC.z});return;}
  fn();
}
/* живое, которое в 2D закрывает то, что рисуется позже (кольцо торговой, кран верфи,
   огни домен под полосами), лежит между слоями: мастер делится здесь на «под» и «над» */
function stSplit(){if(ST_REC)ST_REC.split();}
function stEmP(x,y){const m=ST_EM.m,s=ST_EM.s;return [ST_EM.x+(m.a*x+m.c*y+m.e)*s,ST_EM.y+(m.b*x+m.d*y+m.f)*s];}
function stEmK(){return ST_EM.s*Math.hypot(ST_EM.m.a,ST_EM.m.b);}
function stLamp(x,y,r,c,a){
  if(ST_EM){const [px,py]=stEmP(x,y),R=r*stEmK();
    ST_EM.L.push([1,px,py,R,0,0,0,c[0],c[1],c[2],a]);
    ST_EM.A.push([1,px,py,R,0,0,0,c[0],c[1],c[2],a*ST_EMIT],[1,px,py,R*.5,0,0,R*1.8,c[0],c[1],c[2],a*ST_HALO]);return;}
  ctx.fillStyle=rgba(c,a);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
}
/* окно-огонь прямоугольником; rot — поворот вокруг начала куска (кольцо) */
function stLampRect(x,y,w,h,c,a,rot){
  if(ST_EM){const m=ST_EM.m,k=stEmK();
    if(!rot&&!m.b&&!m.c){const [x0,y0]=stEmP(x,y),[x1,y1]=stEmP(x+w,y+h),q=Math.min(w,h)*k*.9;
      ST_EM.L.push([0,x0,y0,x1,y1,0,0,c[0],c[1],c[2],a]);
      ST_EM.A.push([0,x0,y0,x1,y1,0,0,c[0],c[1],c[2],a*ST_EMIT],[0,x0,y0,x1,y1,0,q,c[0],c[1],c[2],a*ST_HALO]);return;}
    const cs=Math.cos(rot||0),sn=Math.sin(rot||0),P=(u,v)=>stEmP(u*cs-v*sn,u*sn+v*cs);
    const cx=x+w/2,cy=y+h/2,hw=Math.min(w,h)/2,L=Math.max(w,h)/2-hw,ax=w>=h;
    const [x0,y0]=P(ax?cx-L:cx,ax?cy:cy-L),[x1,y1]=P(ax?cx+L:cx,ax?cy:cy+L),H=hw*k;
    ST_EM.L.push([2,x0,y0,x1,y1,H,0,c[0],c[1],c[2],a]);
    ST_EM.A.push([2,x0,y0,x1,y1,H,0,c[0],c[1],c[2],a*ST_EMIT],[2,x0,y0,x1,y1,H*.5,H*1.8,c[0],c[1],c[2],a*ST_HALO]);return;}
  ctx.fillStyle=rgba(c,a);
  if(rot){ctx.save();ctx.rotate(rot);ctx.fillRect(x,y,w,h);ctx.restore();}else ctx.fillRect(x,y,w,h);
}
/* штрих (кран, ствол турели) — краской, без света */
function stBar(x0,y0,x1,y1,lw,c,a){
  if(ST_EM){const [p0,q0]=stEmP(x0,y0),[p1,q1]=stEmP(x1,y1);ST_EM.L.push([2,p0,q0,p1,q1,lw*.5*stEmK(),0,c[0],c[1],c[2],a]);return;}
  ctx.strokeStyle=rgba(c,a);ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
}
/* вращающаяся часть: draw рисует её в своих осях (центр — ось вращения, радиус ext);
   на видеокарте — свой мастер, повёрнутый и освещённый, как корпус */
function stSpin(key,ext,rot,draw){
  if(ST_EM){ST_EM.S.push({key,ext,rot,draw,m:ST_EM.m});return;}
  ctx.save();ctx.rotate(rot);draw();ctx.restore();
}
const ST_SPIN=new Map(),ST_MASTER=new Map();
/* вращающаяся часть — своя выпечка GPU-холста (кисть та же: ctx на время выпечки — её холст) */
function stSpinCv(key,ext,draw,sb){
  const k=key+"|"+sb;let B=ST_SPIN.get(k);if(B&&B.dev===GPU.dev)return B;
  const side=Math.ceil(ext*2*sb);
  B=gpuBake(side,side,g=>{g.setTransform(sb,0,0,sb,side/2,side/2);draw();},{mat:sb});if(!B)return null;
  if(ST_SPIN.size>=16){const k0=ST_SPIN.keys().next().value;gpuBakeDrop(ST_SPIN.get(k0));ST_SPIN.delete(k0);}
  ST_SPIN.set(k,B);return B;
}
/* мастер станции: тело без живого, sb пикселей на единицу станции, живое — список ST_REC.
   Тело пишется одной записью GPU-холста; stSplit отмечает место в ней, и слой — выпечка своего
   куска записи (в 2D слой копировался и холст чистился — то же самое). У торговой два слоя,
   под кольцом и над ним; общий мастер U — слои поверх друг друга пиксель в пиксель, по нему свет
   верхних слоёв (рельеф без ложных кромок) */
function stMasterDrop(M){for(const q of M.Ly)gpuBakeDrop(q);if(M.U)gpuBakeDrop(M.U);}
/* мастер станции — задача планировщика 17a0: запись тела, потом по выпечке слоя за шаг.
   Готов — в ST_MASTER. Нет готового этой плотности (зум сменил четверть-октаву) —
   рисуем прежний мастер той же станции, а новый печётся по шагу за кадр; синхронно —
   только когда станции нечем показаться вовсе (загрузка), либо она за краем (sync=false) */
/* Текст тела («СТ-nn», «★», номера рёбер) записан ссылками на страницы атласа масок GC_ATL.
   Атлас, дойдя до шести страниц, отдаёт их все в мусор, и слой, выпеченный кадром позже по
   прежней записи, связывал уничтоженную текстуру: выпечка падала целиком, слой выходил
   прозрачным, а мастер числился готовым (ревью №5). Поэтому запись помнит поколение атласа;
   сменилось — тело пишется заново (та же станция — те же разрезы), и слои идут дальше */
function* stMasterJob(side,sb,V,S,ty){
  const k=side*side<=262144?2:1;
  const record=()=>{const g=new GcCtx(side,side,k),prev=ctx,rec={L:[],z:0,cut:[0],inv:null};
    rec.split=()=>{rec.cut.push(g._ops.length);rec.z++;};
    ctx=g;
    try{g.setTransform(sb,0,0,sb,side/2,side/2);rec.inv=DOMMatrix.fromMatrix(g.getTransform()).inverse();ST_REC=rec;drawStationBody(V,S,ty);}
    finally{ST_REC=null;ctx=prev;}
    rec.cut.push(g._ops.length);rec.O=g._ops;rec.gen=GC_ATL.gen;return rec;};
  /* сброс мог случиться и посреди самой записи — тогда её начало уже ссылается на мусор */
  let rec=record();for(let t=0;t<2&&rec.gen!==GC_ATL.gen;t++)rec=record();
  const n=rec.cut.length,Ly=[];let U=null,ok=false;
  try{
    for(let i=0;i+1<n;i++){yield;
      if(rec.gen!==GC_ATL.gen){rec=record();if(rec.cut.length!==n)return null;}
      const O=rec.O,a=rec.cut[i],b=rec.cut[i+1];
      const B=gpuBake(side,side,q=>{for(let j=a;j<b;j++)q._ops.push(O[j]);},i?{ss:k}:{ss:k,mat:sb});   /* материал (08cd) — нижнему слою: верхние светятся по общему мастеру */
      if(!B)return null;Ly.push(B);}
    if(Ly.length>1){yield;U=gpuBake(side,side,q=>{for(const B of Ly)q.drawImage(B,0,0);},{ss:1});}
    ok=true;return {Ly,U,E:side/(2*sb),sb,L:rec.L};
  }finally{if(!ok){for(const q of Ly)gpuBakeDrop(q);if(U)gpuBakeDrop(U);}}
}
function stationMaster(base,sb,V,S,ty,onScr){
  const key=base+"|"+sb;
  let M=ST_MASTER.get(key);if(M&&M.Ly[0].dev===GPU.dev)return M;
  if(M){stMasterDrop(M);ST_MASTER.delete(key);}
  if(!GPU.dev)return null;
  let F=null;   /* прежний мастер той же станции — пока печётся новый */
  if(onScr)for(const [k,Q] of ST_MASTER)if(k.startsWith(base+"|")&&Q.Ly[0].dev===GPU.dev)F=Q;
  M=prebake("st|"+key,()=>stMasterJob(Math.ceil(160*sb),sb,V,S,ty),onScr&&!F);
  if(!M)return F;
  if(ST_MASTER.size>=4){const k0=ST_MASTER.keys().next().value;stMasterDrop(ST_MASTER.get(k0));
    for(const q of ST_SPIN.values())gpuBakeDrop(q);ST_SPIN.clear();ST_MASTER.delete(k0);}
  ST_MASTER.set(key,M);return M;
}
function stEmFlush(pass,E,sb,lx,ly,dk){
  for(const q of E.S){const B=stSpinCv(q.key,q.ext,q.draw,sb);if(!B)continue;const m=q.m,k=Math.hypot(m.a,m.b)*E.s,Ec=B.w/(2*sb);
    gpuLitSprite(B,E.x+m.e*E.s,E.y+m.f*E.s,Ec*k,k,Math.atan2(m.b,m.a)+q.rot,lx,ly,0,0,Math.max(0,Math.log2(sb/(k*dk))+HG_LOD));}
  if(E.L.length)gpuShapes(pass,E.L);
  if(E.A.length)gpuShapes(pass,E.A,{blend:"add"});
}
/* станция кадра: слой, его живое, следующий слой, его живое — порядок 2D */
function gpuStationDraw(M,x,y,s,lx,ly){
  const pass=gpuScene();if(!pass)return false;
  const dk=GPU.bw/W,lod=Math.max(0,Math.log2(M.sb/(s*dk))+HG_LOD),E=M.Ly.map(()=>({L:[],A:[],S:[],x,y,s,m:null}));
  for(const r of M.L){ST_EM=E[r.z];ST_EM.m=r.m;try{r.fn();}finally{ST_EM=null;}}
  M.Ly.forEach((q,i)=>{gpuLitSprite(q,x,y,M.E*s,s,0,lx,ly,i?0:1,0,lod,i?M.U:null);stEmFlush(pass,E[i],M.sb,lx,ly,dk);});
  return true;
}
/* факел промышленной: язык — цепочка капсул по средней линии (ширина по обводу
   2D-формы), свечение — одна мягкая капсула сложением, дым — диски */
function gpuStationFlare(pass,x,y,s,t,fl,lean,V){
  const P=(u,v)=>[x+u*s,y+v*s],L=[],A=[];
  const tongue=(w,h,dx,c,a)=>{
    const pt=q=>{const r=1-q;return [3*r*q*q*dx+q*q*q*dx,-28-(3*r*r*q*.45+3*r*q*q*.8+q*q*q)*h];};
    const hw=q=>{const r=1-q;return w*(r*r*r+3*r*r*q+3*r*q*q*.35);};
    for(let i=0;i<6;i++){const q0=i/6,q1=(i+1)/6,[u0,v0]=pt(q0),[u1,v1]=pt(q1),[a0,b0]=P(u0,v0),[a1,b1]=P(u1,v1);
      L.push([2,a0,b0,a1,b1,Math.max(.3,hw((q0+q1)/2))*s,0,c[0],c[1],c[2],a]);}
  };
  {const [a0,b0]=P(0,-28),[a1,b1]=P(lean*1.2*.7,-28-fl*1.35*.7);A.push([2,a0,b0,a1,b1,4.2*.6*s,4.2*.8*s,255,110,40,.16]);}
  tongue(2.3,fl,lean,[255,150,54],.92);
  tongue(1.1,fl*.55,lean*.5,[255,226,160],.9);
  const D=[];
  for(const q of stackSmoke(G.t,V.ph,fl)){const [a,b]=P(q.x,q.y);D.push([1,a,b,q.r*s,0,0,0,96,92,100,q.a]);}
  gpuShapes(pass,A,{blend:"add"});gpuShapes(pass,L);
  if(D.length)gpuShapes(pass,D);
}
