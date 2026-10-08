/* ══ баржа телом (M820 §3) ══
   Хребет-труба, на нём 3–6 грузовых рам (по вместимости): в раме два короба тары разной высоты,
   по торцам — рёбра-переборки; у носа буксирная голова завода с рубкой и тёплым окном, у кормы
   блок с тихоходными соплами. Краска своя (доля 2): грунт завода в голове, тара приглушённая,
   железо тёмное — баржа тяжёлая и медленная, а не полоса цветных ящиков. Остов — та же баржа,
   переломленная надвое, рамы раскиданы в полторы длины, всё в копоти. Длина и полуширина — те же,
   что у выпечки 12l (то же зерно): подпись и полоса стоят на своих местах */
const BODY_BARGE_KEEP=12;
function bodyBargeFrames(cap){return clamp(3+Math.floor(((cap||90)-90)/35),3,6);}
/* части баржи в осях корпуса: каждая — функция (kit, копоть) → кусок сетки; общий размер L, hw */
function bodyBargeParts(seed,by,cap){
  const r=rng(hashi(seed,0x5A19,9)),L=104+r()*40,hw=L*(.14+r()*.04);
  const q=rng(hashi(seed,0xB0D2,5)),nose=L*.52,tail=-L*.48,MR=makerRow(by);
  const gnd=mixc([62,70,84],makerGround(by),.5),iron=[44,48,56],rib=[112,116,122];
  const stripe=MR.stripe?mixc(makerLightCol(by),[30,26,22],.35):null;
  const n=bodyBargeFrames(cap),z0=tail+L*.17,z1=nose-L*.25,step=(z1-z0)/n,fl=step*.88;
  const cargo=[];for(let i=0;i<n;i++){const A=[];
    for(const s of [-1,1]){if(q()<.14)continue;   /* пустое место в раме: виден хребет — груз снимали */
      A.push({s,h:hw*(.4+q()*.42),h2:hw*(.4+q()*.42),c:mixc(H3D_CARGO[(q()*H3D_CARGO.length)|0],gnd,.22)});}
    cargo.push(A);}
  const sootK=k=>c=>mixc(c,[14,12,10],k);
  const P={L,hw,nose,tail,n,
    /* хребет: труба от кормового блока до головы */
    spine:(K,sk,xa,xb)=>{xa=xa==null?tail+L*.12:xa;xb=xb==null?nose-L*.2:xb;
      K.lathe(xa,0,0,[[0,hw*.3],[xb-xa,hw*.3]],K.C(sk(iron)),2,.4,0,12,null,null);},
    xAt:i=>z0+i*step,
    /* рама i: два ребра и тара; x0 — её начало по длине */
    /* рама — П из светлой стали выше тары (стойки по бортам и балка поверху) и продольные балки:
       конструкция читается раньше коробов; тара — по два короба на сторону со щелью, это масштаб */
    frame:(K,sk,i,ox)=>{const x0=(ox==null?z0+i*step:ox),x1=x0+fl,rb=Math.max(.9,fl*.07),top=hw*.98,st=K.C(sk(rib)),y2=hw*1.17,y1=hw*1.03;
      for(const xx of [x0,x1-rb]){K.box(xx,xx+rb,-y2,-y1,-hw*.62,top,.12,st,2,.55);K.box(xx,xx+rb,y1,y2,-hw*.62,top,.12,st,2,.55);
        K.box(xx,xx+rb,-y2,y2,top-hw*.13,top,.1,st,2,.55);}
      for(const s of [-1,1])K.box(x0,x1,s<0?-y2:y1,s<0?-y1:y2,top-hw*.11,top-hw*.02,.1,st,2,.55);
      const xm=(x0+x1)/2,g=Math.max(.35,fl*.025);
      for(const c of cargo[i]){const ya=c.s<0?-hw*1.0:hw*.05,yb=c.s<0?-hw*.05:hw*1.0,col=K.C(sk(c.c));
        K.box(x0+rb,xm-g,ya,yb,-hw*.55,c.h,hw*.07,col,2,.25);K.box(xm+g,x1-rb,ya,yb,-hw*.55,c.h2,hw*.07,col,2,.25);}},
    /* голова: короткий лофт грунта завода, полоса, рубка с окном */
    head:(K,sk,ox,oy)=>{const xa=nose-L*.22,N=16,ring=(x,w)=>{const R=[];for(let i=0;i<=N;i++){const t=i/N*TAU,c=Math.cos(t),s=Math.sin(t);
        R.push([x,w*Math.sign(c)*Math.pow(Math.abs(c),.8),w*(s>=0?.82:.55)*Math.sign(s)*Math.pow(Math.abs(s),.8)]);}return R;};
      const R=[ring(xa,hw*.88),ring(nose-L*.07,hw*.9),ring(nose,hw*.42)];
      K.loft(R,K.C(sk(gnd)),2,-.5,0);K.face(R[0].slice(0,N),[xa+1,0,0],K.C(sk(iron)),2,-.3,0);
      K.face(R[2].slice(0,N),[nose-1,0,0],K.C(sk(mixc(gnd,[0,0,0],.25))),2,-.4,0);
      if(stripe)K.box(nose-L*.17,nose-L*.145,-hw*.93,hw*.93,-hw*.5,hw*.76,.3,K.C(sk(stripe)),2,.3);
      const bx=nose-L*.13,bt=hw*1.12;
      K.box(bx-L*.05,bx+L*.03,-hw*.42,hw*.42,hw*.4,bt,hw*.08,K.C(sk(mixc(gnd,[255,255,255],.12))),2,.5);
      if(!sk.dead)K.face([[bx+L*.031,-hw*.3,bt*.82],[bx+L*.031,hw*.3,bt*.82],[bx+L*.031,hw*.3,bt*.62],[bx+L*.031,-hw*.3,bt*.62]],
        [bx,0,bt*.7],K.C([255,210,150]),2,-.1,1.9);},
    /* корма: блок и сопла с тлеющим зевом */
    stern:(K,sk)=>{K.box(tail+L*.02,tail+L*.15,-hw*.98,hw*.98,-hw*.5,hw*.62,hw*.1,K.C(sk(mixc(gnd,iron,.55))),2,-.4);
      const ne=2+(seed%2),em=K.C(sk([90,40,22]));
      for(let i=0;i<ne;i++){const ey=(i-(ne-1)/2)*hw*.9;
        K.lathe(tail+L*.03,ey,0,[[0,hw*.34],[-L*.035,hw*.4],[-L*.07,hw*.44]],K.C(sk(iron)),2,.6,0,12,null,sk.dead?null:[em,0,1]);}}};
  P.lights=[{x:nose-L*.1,y:-hw*.95,c:[255,90,80],r:1.4,k:.08,ph:0},{x:nose-L*.1,y:hw*.95,c:[120,240,150],r:1.4,k:.08,ph:1.6},
    {x:nose-L*.1,y:0,c:[255,214,150],r:1.1,k:0,ph:0},{x:tail+L*.08,y:0,c:[230,236,255],r:1,k:.05,ph:.7}];
  P.soot=sootK;return P;
}
/* сетка баржи: по заводу, зерну и вместимости (кэш 12) */
function h3dBargeMesh(seed,by,cap){
  return bodyMesh("bg:"+seed+by+bodyBargeFrames(cap),BODY_BARGE_KEEP,()=>{
    const P=bodyBargeParts(seed,by,cap),K=h3dKit(),sk=c=>c;
    P.spine(K,sk);for(let i=0;i<P.n;i++)P.frame(K,sk,i);P.head(K,sk);P.stern(K,sk);
    const L=P.L,hw=P.hw;
    const m=h3dPack(K.V,L*.62,{st:[[P.nose,hw*.4],[P.nose-L*.07,hw*.9],[P.nose-L*.22,hw*.88],[P.nose-L*.23,hw*.3],
      [P.tail+L*.16,hw*.3],[P.tail+L*.15,hw*.98],[P.tail+L*.02,hw*.98]],ne:2.6,kh:.7,gl:.35});
    m.L=P.lights;m.len=L;m.frames=P.n;return m;});
}
/* остов: две половины врозь, рамы раскиданы, всё в копоти; огней нет */
function h3dBargeWreck(seed){
  const by=makerBySeed(seed),cap=90+(seed>>>3)%140;
  return bodyMesh("bw:"+seed,4,()=>{
    const P=bodyBargeParts(seed,by,cap),L=P.L,q=rng(hashi(seed,0xDEAD,3)),V=[];
    const sk=P.soot(.55);sk.dead=1;
    /* кусок в своих осях → повернуть вокруг z и сдвинуть в общую сетку */
    const put=(build,ang,dx,dy)=>{const K=h3dKit();build(K);const c=Math.cos(ang),s=Math.sin(ang),A=K.V;
      for(let i=0;i<A.length;i+=12){const x=A[i],y=A[i+1],nx=A[i+3],ny=A[i+4];
        A[i]=x*c-y*s+dx;A[i+1]=x*s+y*c+dy;A[i+3]=nx*c-ny*s;A[i+4]=nx*s+ny*c;}
      for(const v of A)V.push(v);};
    const half=Math.max(1,Math.floor(P.n/2)),gap=L*(.12+q()*.1);
    /* перелом — по стыку рам half-1 и half: нос с хребтом до стыка, корма — от блока до стыка */
    const xs=P.xAt(half),keep=[];for(let i=0;i<half;i++)keep.push(q()<.5);
    put(K=>{P.head(K,sk);P.spine(K,sk,xs,null);for(let i=half;i<P.n;i++)P.frame(K,sk,i);},
      .2+q()*.25,gap*.5,-L*.03);
    put(K=>{P.stern(K,sk);P.spine(K,sk,null,xs-L*.02);for(let i=0;i<half;i++)if(keep[i])P.frame(K,sk,i);},
      -.15-q()*.2,-gap*.5,L*.04);
    /* рамы, что сорвало с кормы: рядом, в полутора длинах; одну-две унесло совсем */
    for(let i=0;i<half;i++)if(!keep[i]&&q()<.75){const a=q()*TAU,d=L*(.35+q()*.4);
      put(K=>P.frame(K,sk,i,-P.hw),q()*TAU,Math.cos(a)*d,Math.sin(a)*d*.6);}
    const m=h3dPack(V,L*1.1,{st:[[L*.6,P.hw*.3],[-L*.6,P.hw*.3]],ne:2.6,kh:.7,gl:.2});
    m.len=L;return m;});
}
/* баржа на месте выпечки 12l: тело, огни; false — пусть рисует прежняя */
function bodyBarge(b,x,y,s){
  if(!bodyGpu())return false;
  const by=b.by||(b.by=makerBySeed(b.seed)),m=h3dBargeMesh(b.seed,by,b.cap);
  if(m.len*s<BODY.LOD){bodyDot(x,y,makerGround(by),b.x,b.y,1);return true;}
  if(!bodyRun(m,x,y,b.a,s,b.x,b.y,.3))return false;
  bodyLights(m,x,y,b.a,s,1);return true;
}
/* остов баржи (12l drawWrecksSystem): w — {x,y,seed}; поворот по зерну, как у прежнего рисунка */
function bodyBargeWreck(w,x,y,s){
  if(!bodyGpu())return false;
  const m=h3dBargeWreck(w.seed>>>0);
  if(m.len*s<BODY.LOD){bodyDot(x,y,[60,56,52],w.x,w.y,1);return true;}
  return bodyRun(m,x,y,(w.seed%628)/100,s,w.x,w.y,0);
}
