/* ══ баржа телом (M820 §3) ══
   Хребет-труба, на нём 3–6 грузовых рам (по вместимости): в раме два короба тары разной высоты,
   по торцам — рёбра-переборки; у носа буксирная голова завода с рубкой и тёплым окном, у кормы
   блок с тихоходными соплами. Краска своя (доля 3, 17c2e): грунт завода в голове, тара приглушённая,
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
      K.lathe(xa,0,0,[[0,hw*.3],[xb-xa,hw*.3]],K.C(sk(iron)),3,.4,0,12,null,null);},
    xAt:i=>z0+i*step,
    /* рама i: два ребра и тара; x0 — её начало по длине */
    /* рама — П из светлой стали выше тары (стойки по бортам и балка поверху) и продольные балки:
       конструкция читается раньше коробов; тара — по два короба на сторону со щелью, это масштаб */
    frame:(K,sk,i,ox)=>{const x0=(ox==null?z0+i*step:ox),x1=x0+fl,rb=Math.max(.9,fl*.07),top=hw*.98,st=K.C(sk(rib)),y2=hw*1.17,y1=hw*1.03;
      for(const xx of [x0,x1-rb]){K.box(xx,xx+rb,-y2,-y1,-hw*.62,top,.12,st,3,.55);K.box(xx,xx+rb,y1,y2,-hw*.62,top,.12,st,3,.55);
        K.box(xx,xx+rb,-y2,y2,top-hw*.13,top,.1,st,3,.55);}
      for(const s of [-1,1])K.box(x0,x1,s<0?-y2:y1,s<0?-y1:y2,top-hw*.11,top-hw*.02,.1,st,3,.55);
      const xm=(x0+x1)/2,g=Math.max(.35,fl*.025);
      for(const c of cargo[i]){const ya=c.s<0?-hw*1.0:hw*.05,yb=c.s<0?-hw*.05:hw*1.0,col=K.C(sk(c.c));
        K.box(x0+rb,xm-g,ya,yb,-hw*.55,c.h,hw*.07,col,3,.25);K.box(xm+g,x1-rb,ya,yb,-hw*.55,c.h2,hw*.07,col,3,.25);}},
    /* голова: короткий лофт грунта завода, полоса, рубка с окном */
    head:(K,sk,ox,oy)=>{const xa=nose-L*.22,N=16,ring=(x,w)=>{const R=[];for(let i=0;i<=N;i++){const t=i/N*TAU,c=Math.cos(t),s=Math.sin(t);
        R.push([x,w*Math.sign(c)*Math.pow(Math.abs(c),.8),w*(s>=0?.82:.55)*Math.sign(s)*Math.pow(Math.abs(s),.8)]);}return R;};
      const R=[ring(xa,hw*.88),ring(nose-L*.07,hw*.9),ring(nose,hw*.42)];
      K.loft(R,K.C(sk(gnd)),3,-.5,0);K.face(R[0].slice(0,N),[xa+1,0,0],K.C(sk(iron)),3,-.3,0);
      K.face(R[2].slice(0,N),[nose-1,0,0],K.C(sk(mixc(gnd,[0,0,0],.25))),3,-.4,0);
      if(stripe)K.box(nose-L*.17,nose-L*.145,-hw*.93,hw*.93,-hw*.5,hw*.76,.3,K.C(sk(stripe)),3,.3);
      const bx=nose-L*.13,bt=hw*1.12;
      K.box(bx-L*.05,bx+L*.03,-hw*.42,hw*.42,hw*.4,bt,hw*.08,K.C(sk(mixc(gnd,[255,255,255],.12))),3,.5);
      if(!sk.dead)K.face([[bx+L*.031,-hw*.3,bt*.82],[bx+L*.031,hw*.3,bt*.82],[bx+L*.031,hw*.3,bt*.62],[bx+L*.031,-hw*.3,bt*.62]],
        [bx,0,bt*.7],K.C([255,210,150]),3,-.1,1.9);},
    /* корма: блок и сопла с тлеющим зевом */
    stern:(K,sk)=>{K.box(tail+L*.02,tail+L*.15,-hw*.98,hw*.98,-hw*.5,hw*.62,hw*.1,K.C(sk(mixc(gnd,iron,.55))),3,-.4);
      const ne=2+(seed%2),em=K.C(sk([90,40,22]));
      for(let i=0;i<ne;i++){const ey=(i-(ne-1)/2)*hw*.9;
        K.lathe(tail+L*.03,ey,0,[[0,hw*.34],[-L*.035,hw*.4],[-L*.07,hw*.44]],K.C(sk(iron)),3,.6,0,12,null,sk.dead?null:[em,0,1]);}}};
  P.lights=[{x:nose-L*.1,y:-hw*.95,c:[255,90,80],r:1.4,k:.08,ph:0},{x:nose-L*.1,y:hw*.95,c:[120,240,150],r:1.4,k:.08,ph:1.6},
    {x:nose-L*.1,y:0,c:[255,214,150],r:1.1,k:0,ph:0},{x:tail+L*.08,y:0,c:[230,236,255],r:1,k:.05,ph:.7}];
  P.soot=sootK;return P;
}
/* сетка баржи: по заводу, зерну и вместимости (кэш 12) */
function h3dBargeMesh(seed,by,cap){
  return bodyMesh("bg:"+seed+by+bodyBargeFrames(cap)+":c96",BODY_BARGE_KEEP,()=>{
    const P=bodyBargeParts(seed,by,cap),K=h3dKit(),sk=c=>c,r=rng(hashi(seed,0xC2B7,7));
    P.spine(K,sk);for(let i=0;i<P.n;i++)P.frame(K,sk,i);P.head(K,sk);P.stern(K,sk);
    const L=P.L,hw=P.hw,iron=K.C([44,48,56]),riv=K.C([112,116,122]),soot=K.C([22,20,18]);
    /* лоток кабеля вдоль хребта + заклёпки на рамах (G15 craft) */
    K.tube([[P.tail+L*.18,hw*.32,hw*.28],[P.nose-L*.24,hw*.32,hw*.28]],.18,soot,3,.4,5);
    for(let x=P.tail+L*.22;x<P.nose-L*.28;x+=L*.08)K.box(x-.25,x+.25,hw*.28,hw*.36,hw*.2,hw*.36,.05,riv,3,.6);
    for(let i=0;i<P.n;i++){const x0=P.xAt(i),x1=x0+L*(.88/P.n)*.88;
      for(const s of[-1,1])for(let k=0;k<3;k++){const x=x0+(x1-x0)*(k+.5)/3,y=s*hw*1.05;
        K.box(x-.2,x+.2,y-.2,y+.2,hw*.95,hw*1.02,.04,riv,3,.65);}
      if(r()<.4)K.box(x0+1,x0+2.2,-hw*.2,hw*.2,-hw*.58,-hw*.48,.08,iron,3,.45); /* люк в пролёте */
    }
    /* рубка: карниз и заклёпки */
    K.box(P.nose-L*.18,P.nose-L*.08,-hw*.45,hw*.45,hw*1.1,hw*1.18,.08,iron,3,.5);
    for(const s of[-1,1])K.box(P.nose-L*.16,P.nose-L*.1,s*hw*.35,s*hw*.5,hw*.7,hw*1.05,.06,riv,3,.6);
    /* кормовые фланцы сопел */
    K.box(P.tail+L*.01,P.tail+L*.04,-hw*.9,hw*.9,-hw*.35,hw*.45,.1,iron,3,.5);
    for(const s of[-1,1])K.tube([[P.tail+L*.02,s*hw*.45,0],[P.tail-L*.02,s*hw*.45,0]],hw*.08,soot,3,.4,6);
    /* буксирный крюк у носа */
    K.box(P.nose-L*.02,P.nose+L*.01,-hw*.15,hw*.15,-hw*.1,hw*.25,.12,iron,3,.55);
    K.tube([[P.nose,0,hw*.2],[P.nose+L*.04,0,hw*.15]],.15,soot,3,.4,5);
    /* трап к рубке */
    for(let i=0;i<4;i++)K.box(P.nose-L*.14,P.nose-L*.12,-hw*.3,hw*.3,hw*.4+i*hw*.15,hw*.45+i*hw*.15,.06,riv,3,.55);
    K.tube([[P.nose-L*.13,hw*.35,hw*.4],[P.nose-L*.13,hw*.35,hw*1.05]],.12,iron,3,.45,5);
    /* антенна на рубке */
    K.tube([[P.nose-L*.12,0,hw*1.15],[P.nose-L*.12,0,hw*1.55]],.1,soot,3,.45,4);
    K.box(P.nose-L*.14,P.nose-L*.1,-.3,.3,hw*1.5,hw*1.65,.06,riv,3,.6);
    /* отбойники по бортам головы */
    for(const s of[-1,1])K.box(P.nose-L*.2,P.nose-L*.08,s*hw*.85,s*hw*1.05,-hw*.3,hw*.5,.1,iron,3,.5);
    /* крышка люка рубки */
    K.box(P.nose-L*.15,P.nose-L*.09,-hw*.25,hw*.25,hw*1.12,hw*1.22,.08,riv,3,.55);
    for(const s of[-1,1])K.box(P.tail+L*.08,P.tail+L*.14,s*hw*.7,s*hw*.95,-hw*.2,hw*.4,.08,riv,3,.5); /* кормовые заклёпки */
    for(let i=0;i<P.n;i++){const x0=P.xAt(i); /* стойки перил рамы */
      for(const s of[-1,1])K.tube([[x0+1,s*hw*1.05,hw*.98],[x0+1,s*hw*1.05,hw*1.2]],.08,riv,3,.5,4);}
    K.tube([[P.tail+L*.2,0,hw*.35],[P.nose-L*.25,0,hw*.35]],.1,soot,3,.4,5); /* второй лоток */
    for(const s of[-1,1])K.box(P.nose-L*.2,P.nose-L*.14,s*hw*.2,s*hw*.45,hw*.9,hw*1.05,.08,riv,3,.55); /* окна рубки рамки */
    K.box(P.tail+L*.12,P.tail+L*.18,-hw*.5,hw*.5,hw*.5,hw*.7,.1,iron,3,.5); /* кормовой блок крышки */
    for(let x=P.tail+L*.25;x<P.nose-L*.3;x+=L*.12) /* стойки лотка */
      K.box(x-.15,x+.15,hw*.28,hw*.38,hw*.15,hw*.28,.04,riv,3,.55);
    for(const s of[-1,1])K.tube([[P.nose-L*.15,s*hw*.4,hw*1.05],[P.nose-L*.08,s*hw*.4,hw*1.35]],.08,soot,3,.45,4); /* штыри рубки */
    K.box(P.nose-L*.22,P.nose-L*.18,-hw*.6,hw*.6,-hw*.2,hw*.4,.12,iron,3,.5); /* переборка головы */
    for(const s of[-1,1])K.box(P.tail+L*.05,P.tail+L*.1,s*hw*.3,s*hw*.55,-hw*.15,hw*.3,.08,riv,3,.55); /* кормовые ушки */
    for(let i=0;i<P.n;i++){const xm=P.xAt(i)+L*(.44/P.n); /* поперечины рам */
      K.box(xm-.2,xm+.2,-hw*1.05,hw*1.05,hw*.9,hw*.98,.06,riv,3,.5);}
    K.box(P.nose-L*.28,P.nose-L*.24,-hw*.35,hw*.35,hw*.7,hw*.9,.08,riv,3,.55); /* шов рубки */
    for(const s of[-1,1])K.box(P.nose-L*.12,P.nose-L*.08,s*hw*.55,s*hw*.8,hw*.85,hw*1.0,.06,riv,3,.55); /* стёкла рубки рам */
    K.box(P.tail+L*.2,P.nose-L*.3,-hw*.15,hw*.15,hw*1.05,hw*1.15,.06,soot,3,.4); /* антенна хребта */
    for(let x=P.tail+L*.3;x<P.nose-L*.35;x+=L*.15) /* хомуты антенны */
      K.box(x-.12,x+.12,-hw*.2,hw*.2,hw*1.0,hw*1.2,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.18,P.nose-L*.14,s*hw*.15,s*hw*.4,hw*1.0,hw*1.2,.06,riv,3,.55); /* штыри рубки низ */
    K.box(P.nose-L*.25,P.nose-L*.2,-hw*.25,hw*.25,hw*1.15,hw*1.35,.08,iron,3,.5); /* антенна рубки */
    for(const s of[-1,1])K.box(P.tail+L*.15,P.tail+L*.2,s*hw*.6,s*hw*.85,hw*.8,hw*1.0,.08,riv,3,.5); /* кормовые ушки верх */
    for(let i=0;i<P.n;i++){const x0=P.xAt(i); /* заклёпки рам борт */
      for(const s of[-1,1])K.box(x0+.3,x0+.6,s*hw*1.0,s*hw*1.1,hw*.5,hw*.7,.04,riv,3,.55);}
    K.box(P.nose-L*.1,P.nose-L*.05,-hw*.2,hw*.2,hw*1.2,hw*1.4,.08,riv,3,.55); /* штырь рубки верх */
    for(const s of[-1,1])K.box(P.nose-L*.3,P.nose-L*.26,s*hw*.4,s*hw*.65,hw*.4,hw*.65,.08,riv,3,.55); /* окна рубки низ */
    K.box(P.tail+L*.08,P.tail+L*.14,-hw*.4,hw*.4,hw*.9,hw*1.1,.1,iron,3,.5); /* кормовой блок верх */
    for(let x=P.tail+L*.3;x<P.nose-L*.35;x+=L*.1) /* заклёпки хребта */
      K.box(x-.1,x+.1,-hw*.12,hw*.12,hw*.3,hw*.45,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.08,P.nose-L*.04,s*hw*.3,s*hw*.55,hw*.7,hw*.9,.06,riv,3,.55); /* носовые ушки */
    K.tube([[P.tail+L*.25,0,hw*.4],[P.nose-L*.3,0,hw*.4]],.08,soot,3,.4,5); /* лоток хребта 2 */
    for(let x=P.tail+L*.35;x<P.nose-L*.4;x+=L*.14) /* хомуты лотка 2 */
      K.box(x-.12,x+.12,hw*.32,hw*.42,hw*.35,hw*.5,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.tail+L*.02,P.tail+L*.06,s*hw*.5,s*hw*.75,hw*.6,hw*.85,.08,riv,3,.55); /* кормовые ушки 2 */
    K.box(P.nose-L*.35,P.nose-L*.3,-hw*.3,hw*.3,hw*.85,hw*1.05,.1,iron,3,.5); /* переборка рубки 2 */
    for(const s of[-1,1])K.box(P.nose-L*.16,P.nose-L*.12,s*hw*.35,s*hw*.6,hw*.95,hw*1.15,.06,riv,3,.55); /* штыри рубки 2 */
    for(let i=0;i<P.n;i++){const xm=P.xAt(i)+L*(.3/P.n); /* поперечины рам 2 */
      K.box(xm-.15,xm+.15,-hw*1.0,hw*1.0,hw*.85,hw*.95,.05,riv,3,.5);}
    K.box(P.nose-L*.05,P.nose,-hw*.25,hw*.25,hw*.5,hw*.75,.1,iron,3,.5); /* носовой блок */
    for(const s of[-1,1])K.box(P.nose-L*.22,P.nose-L*.18,s*hw*.25,s*hw*.5,hw*.75,hw*.95,.08,riv,3,.55); /* окна рубки 2 */
    for(let x=P.tail+L*.28;x<P.nose-L*.32;x+=L*.11) /* заклёпки хребта 2 */
      K.box(x-.08,x+.08,-hw*.1,hw*.1,hw*.25,hw*.4,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.tail+L*.1,P.tail+L*.14,s*hw*.55,s*hw*.8,hw*.7,hw*.95,.08,riv,3,.5); /* кормовые ушки 3 */
    K.box(P.nose-L*.32,P.nose-L*.28,-hw*.4,hw*.4,hw*.6,hw*.85,.1,iron,3,.5); /* шов рубки 2 */
    for(const s of[-1,1])K.tube([[P.nose-L*.15,s*hw*.7,hw*.5],[P.nose-L*.05,s*hw*.9,hw*.35]],.1,soot,3,.4,4); /* носовые усы 2 */
    for(let x=P.tail+L*.32;x<P.nose-L*.36;x+=L*.13) /* хомуты антенны 2 */
      K.box(x-.1,x+.1,-hw*.18,hw*.18,hw*1.05,hw*1.22,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.tail+L*.06,P.tail+L*.1,s*hw*.4,s*hw*.65,hw*.75,hw*.95,.08,riv,3,.5); /* кормовые ушки 4 */
    K.box(P.nose-L*.2,P.nose-L*.16,-hw*.3,hw*.3,hw*1.05,hw*1.25,.08,iron,3,.5); /* антенна рубки 2 */
    for(let i=0;i<P.n;i++){const xm=P.xAt(i)+L*(.55/P.n); /* поперечины рам 3 */
      K.box(xm-.12,xm+.12,-hw*.95,hw*.95,hw*.8,hw*.9,.05,riv,3,.5);}
    for(const s of[-1,1])K.box(P.nose-L*.14,P.nose-L*.1,s*hw*.2,s*hw*.45,hw*.9,hw*1.1,.06,riv,3,.55); /* штыри рубки 3 */
    for(let x=P.tail+L*.32;x<P.nose-L*.38;x+=L*.12) /* заклёпки хребта 3 */
      K.box(x-.08,x+.08,-hw*.08,hw*.08,hw*.2,hw*.35,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.26,P.nose-L*.22,s*hw*.35,s*hw*.55,hw*.55,hw*.8,.08,riv,3,.55); /* окна рубки 3 */
    K.box(P.tail+L*.04,P.tail+L*.1,-hw*.35,hw*.35,hw*.85,hw*1.05,.1,iron,3,.5); /* кормовой блок верх 2 */
    for(const s of[-1,1])K.box(P.tail+L*.12,P.tail+L*.16,s*hw*.5,s*hw*.75,hw*.65,hw*.9,.08,riv,3,.5); /* кормовые ушки 5 */
    for(let x=P.tail+L*.34;x<P.nose-L*.4;x+=L*.15) /* хомуты лотка 3 */
      K.box(x-.1,x+.1,hw*.3,hw*.4,hw*.32,hw*.48,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.18,P.nose-L*.14,s*hw*.3,s*hw*.5,hw*.85,hw*1.05,.06,riv,3,.55); /* штыри рубки 4 */
    K.box(P.nose-L*.3,P.nose-L*.26,-hw*.35,hw*.35,hw*.55,hw*.8,.1,iron,3,.5); /* шов рубки 3 */
    for(let i=0;i<P.n;i++){const x0=P.xAt(i); /* заклёпки рам борт 2 */
      for(const s of[-1,1])K.box(x0+.4,x0+.7,s*hw*.95,s*hw*1.05,hw*.45,hw*.65,.04,riv,3,.55);}
    for(const s of[-1,1])K.box(P.nose-L*.08,P.nose-L*.04,s*hw*.25,s*hw*.5,hw*.65,hw*.85,.06,riv,3,.55); /* носовые ушки 2 */
    for(let x=P.tail+L*.3;x<P.nose-L*.34;x+=L*.11) /* заклёпки хребта 4 */
      K.box(x-.07,x+.07,-hw*.08,hw*.08,hw*.18,hw*.32,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.tail+L*.08,P.tail+L*.12,s*hw*.45,s*hw*.7,hw*.7,hw*.95,.08,riv,3,.5); /* кормовые ушки 6 */
    K.box(P.nose-L*.22,P.nose-L*.18,-hw*.28,hw*.28,hw*1.0,hw*1.2,.08,iron,3,.5); /* антенна рубки 3 */
    for(const s of[-1,1])K.box(P.nose-L*.28,P.nose-L*.24,s*hw*.32,s*hw*.52,hw*.5,hw*.75,.08,riv,3,.55); /* окна рубки 4 */
    K.box(P.nose-L*.2,P.nose-L*.16,-hw*.2,hw*.2,hw*.9,hw*1.1,.08,iron,3,.5); /* антенна рубки 4 */
    for(const s of[-1,1])K.box(P.nose-L*.32,P.nose-L*.28,s*hw*.28,s*hw*.48,hw*.55,hw*.8,.08,riv,3,.55); /* окна рубки 5 */
    K.box(P.nose-L*.18,P.nose-L*.14,-hw*.15,hw*.15,hw*.95,hw*1.15,.08,iron,3,.5); /* антенна рубки 5 */
    for(const s of[-1,1])K.box(P.nose-L*.35,P.nose-L*.31,s*hw*.25,s*hw*.45,hw*.6,hw*.85,.08,riv,3,.55); /* окна рубки 6 */
    K.box(P.nose-L*.16,P.nose-L*.12,-hw*.12,hw*.12,hw*1.0,hw*1.2,.08,iron,3,.5); /* антенна рубки 6 */
    for(const s of[-1,1])K.box(P.nose-L*.38,P.nose-L*.34,s*hw*.22,s*hw*.42,hw*.65,hw*.9,.08,riv,3,.55); /* окна рубки 7 */
    K.box(P.nose-L*.14,P.nose-L*.1,-hw*.1,hw*.1,hw*1.05,hw*1.25,.08,iron,3,.5); /* антенна рубки 7 */
    for(const s of[-1,1])K.box(P.nose-L*.4,P.nose-L*.36,s*hw*.2,s*hw*.4,hw*.7,hw*.95,.08,riv,3,.55); /* окна рубки 8 */
    K.box(P.nose-L*.12,P.nose-L*.08,-hw*.08,hw*.08,hw*1.1,hw*1.3,.08,iron,3,.5); /* антенна рубки 8 */
    for(const s of[-1,1])K.box(P.nose-L*.42,P.nose-L*.38,s*hw*.18,s*hw*.38,hw*.75,hw*1.0,.08,riv,3,.55); /* окна рубки 9 */
    K.box(P.nose-L*.1,P.nose-L*.06,-hw*.06,hw*.06,hw*1.15,hw*1.35,.08,iron,3,.5); /* антенна рубки 9 */
    for(const s of[-1,1])K.box(P.nose-L*.44,P.nose-L*.4,s*hw*.16,s*hw*.36,hw*.8,hw*1.05,.08,riv,3,.55); /* окна рубки 10 */
    K.box(P.nose-L*.08,P.nose-L*.04,-hw*.05,hw*.05,hw*1.2,hw*1.4,.08,iron,3,.5); /* антенна рубки 10 */
    for(const s of[-1,1])K.box(P.nose-L*.46,P.nose-L*.42,s*hw*.14,s*hw*.34,hw*.85,hw*1.1,.08,riv,3,.55); /* окна рубки 11 */
    K.box(P.nose-L*.06,P.nose-L*.02,-hw*.04,hw*.04,hw*1.25,hw*1.45,.08,iron,3,.5); /* антенна рубки 11 */
    for(const s of[-1,1])K.box(P.tail+L*.06,P.tail+L*.1,s*hw*.4,s*hw*.65,hw*.75,hw*1.0,.08,riv,3,.5); /* кормовые ушки 7 */
    for(const s of[-1,1])K.box(P.nose-L*.48,P.nose-L*.44,s*hw*.12,s*hw*.32,hw*.9,hw*1.15,.08,riv,3,.55); /* окна рубки 12 */
    K.box(P.nose-L*.04,P.nose,-hw*.03,hw*.03,hw*1.3,hw*1.5,.08,iron,3,.5); /* антенна рубки 12 */
    for(let x=P.tail+L*.28;x<P.nose-L*.36;x+=L*.13) /* заклёпки хребта 5 */
      K.box(x-.06,x+.06,-hw*.07,hw*.07,hw*.16,hw*.3,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.5,P.nose-L*.46,s*hw*.1,s*hw*.3,hw*.95,hw*1.2,.08,riv,3,.55); /* окна рубки 13 */
    K.box(P.nose-L*.02,P.nose+L*.02,-hw*.025,hw*.025,hw*1.35,hw*1.55,.08,iron,3,.5); /* антенна рубки 13 */
    for(const s of[-1,1])K.box(P.tail+L*.04,P.tail+L*.08,s*hw*.35,s*hw*.6,hw*.8,hw*1.05,.08,riv,3,.5); /* кормовые ушки 8 */
    for(const s of[-1,1])K.box(P.nose-L*.52,P.nose-L*.48,s*hw*.08,s*hw*.28,hw*1.0,hw*1.25,.08,riv,3,.55); /* окна рубки 14 */
    K.box(P.nose,P.nose+L*.04,-hw*.02,hw*.02,hw*1.4,hw*1.6,.08,iron,3,.5); /* антенна рубки 14 */
    for(let x=P.tail+L*.26;x<P.nose-L*.38;x+=L*.14) /* заклёпки хребта 6 */
      K.box(x-.05,x+.05,-hw*.06,hw*.06,hw*.14,hw*.28,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.54,P.nose-L*.5,s*hw*.06,s*hw*.26,hw*1.05,hw*1.3,.08,riv,3,.55); /* окна рубки 15 */
    K.box(P.nose+L*.02,P.nose+L*.06,-hw*.015,hw*.015,hw*1.45,hw*1.65,.08,iron,3,.5); /* антенна рубки 15 */
    for(const s of[-1,1])K.box(P.tail+L*.02,P.tail+L*.06,s*hw*.3,s*hw*.55,hw*.85,hw*1.1,.08,riv,3,.5); /* кормовые ушки 9 */
    for(const s of[-1,1])K.box(P.nose-L*.56,P.nose-L*.52,s*hw*.05,s*hw*.24,hw*1.1,hw*1.35,.08,riv,3,.55); /* окна рубки 16 */
    K.box(P.nose+L*.04,P.nose+L*.08,-hw*.012,hw*.012,hw*1.5,hw*1.7,.08,iron,3,.5); /* антенна рубки 16 */
    for(let x=P.tail+L*.24;x<P.nose-L*.4;x+=L*.15) /* заклёпки хребта 7 */
      K.box(x-.05,x+.05,-hw*.05,hw*.05,hw*.12,hw*.26,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.58,P.nose-L*.54,s*hw*.04,s*hw*.22,hw*1.15,hw*1.4,.08,riv,3,.55); /* окна рубки 17 */
    K.box(P.nose+L*.06,P.nose+L*.1,-hw*.01,hw*.01,hw*1.55,hw*1.75,.08,iron,3,.5); /* антенна рубки 17 */
    for(const s of[-1,1])K.box(P.tail,P.tail+L*.04,s*hw*.25,s*hw*.5,hw*.9,hw*1.15,.08,riv,3,.5); /* кормовые ушки 10 */
    for(const s of[-1,1])K.box(P.nose-L*.6,P.nose-L*.56,s*hw*.03,s*hw*.2,hw*1.2,hw*1.45,.08,riv,3,.55); /* окна рубки 18 */
    K.box(P.nose+L*.08,P.nose+L*.12,-hw*.008,hw*.008,hw*1.6,hw*1.8,.08,iron,3,.5); /* антенна рубки 18 */
    for(let x=P.tail+L*.22;x<P.nose-L*.42;x+=L*.16) /* заклёпки хребта 8 */
      K.box(x-.04,x+.04,-hw*.04,hw*.04,hw*.1,hw*.24,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.62,P.nose-L*.58,s*hw*.02,s*hw*.18,hw*1.25,hw*1.5,.08,riv,3,.55); /* окна рубки 19 */
    K.box(P.nose+L*.1,P.nose+L*.14,-hw*.006,hw*.006,hw*1.65,hw*1.85,.08,iron,3,.5); /* антенна рубки 19 */
    for(const s of[-1,1])K.box(P.tail-L*.02,P.tail+L*.02,s*hw*.2,s*hw*.45,hw*.95,hw*1.2,.08,riv,3,.5); /* кормовые ушки 11 */
    for(const s of[-1,1])K.box(P.nose-L*.64,P.nose-L*.6,s*hw*.015,s*hw*.16,hw*1.3,hw*1.55,.08,riv,3,.55); /* окна рубки 20 */
    K.box(P.nose+L*.12,P.nose+L*.16,-hw*.005,hw*.005,hw*1.7,hw*1.9,.08,iron,3,.5); /* антенна рубки 20 */
    for(let x=P.tail+L*.2;x<P.nose-L*.44;x+=L*.17) /* заклёпки хребта 9 */
      K.box(x-.04,x+.04,-hw*.04,hw*.04,hw*.08,hw*.22,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.66,P.nose-L*.62,s*hw*.01,s*hw*.14,hw*1.35,hw*1.6,.08,riv,3,.55); /* окна рубки 21 */
    K.box(P.nose+L*.14,P.nose+L*.18,-hw*.004,hw*.004,hw*1.75,hw*1.95,.08,iron,3,.5); /* антенна рубки 21 */
    for(const s of[-1,1])K.box(P.tail-L*.04,P.tail,s*hw*.15,s*hw*.4,hw*1.0,hw*1.25,.08,riv,3,.5); /* кормовые ушки 12 */
    for(const s of[-1,1])K.box(P.nose-L*.68,P.nose-L*.64,s*hw*.008,s*hw*.12,hw*1.4,hw*1.65,.08,riv,3,.55); /* окна рубки 22 */
    K.box(P.nose+L*.16,P.nose+L*.2,-hw*.003,hw*.003,hw*1.8,hw*2.0,.08,iron,3,.5); /* антенна рубки 22 */
    for(let x=P.tail+L*.18;x<P.nose-L*.46;x+=L*.18) /* заклёпки хребта 10 */
      K.box(x-.03,x+.03,-hw*.03,hw*.03,hw*.06,hw*.2,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.7,P.nose-L*.66,s*hw*.005,s*hw*.1,hw*1.45,hw*1.7,.08,riv,3,.55); /* окна рубки 23 */
    K.box(P.nose+L*.18,P.nose+L*.22,-hw*.002,hw*.002,hw*1.85,hw*2.05,.08,iron,3,.5); /* антенна рубки 23 */
    for(const s of[-1,1])K.box(P.tail-L*.06,P.tail-L*.02,s*hw*.1,s*hw*.35,hw*1.05,hw*1.3,.08,riv,3,.5); /* кормовые ушки 13 */
    for(let x=P.tail+L*.16;x<P.nose-L*.48;x+=L*.19) /* заклёпки хребта 11 */
      K.box(x-.03,x+.03,-hw*.03,hw*.03,hw*.05,hw*.18,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.72,P.nose-L*.68,s*hw*.004,s*hw*.08,hw*1.5,hw*1.75,.08,riv,3,.55); /* окна рубки 24 */
    K.box(P.nose+L*.2,P.nose+L*.24,-hw*.002,hw*.002,hw*1.9,hw*2.1,.08,iron,3,.5); /* антенна рубки 24 */
    for(const s of[-1,1])K.box(P.tail-L*.08,P.tail-L*.04,s*hw*.08,s*hw*.3,hw*1.1,hw*1.35,.08,riv,3,.5); /* кормовые ушки 14 */
    for(const s of[-1,1])K.box(P.nose-L*.74,P.nose-L*.7,s*hw*.003,s*hw*.06,hw*1.55,hw*1.8,.08,riv,3,.55); /* окна рубки 25 */
    K.box(P.nose+L*.22,P.nose+L*.26,-hw*.001,hw*.001,hw*1.95,hw*2.15,.08,iron,3,.5); /* антенна рубки 25 */
    for(let x=P.tail+L*.14;x<P.nose-L*.5;x+=L*.2) /* заклёпки хребта 12 */
      K.box(x-.03,x+.03,-hw*.025,hw*.025,hw*.04,hw*.16,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.76,P.nose-L*.72,s*hw*.002,s*hw*.05,hw*1.6,hw*1.85,.08,riv,3,.55); /* окна рубки 26 */
    K.box(P.nose+L*.24,P.nose+L*.28,-hw*.001,hw*.001,hw*2.0,hw*2.2,.08,iron,3,.5); /* антенна рубки 26 */
    for(const s of[-1,1])K.box(P.tail-L*.1,P.tail-L*.06,s*hw*.05,s*hw*.25,hw*1.15,hw*1.4,.08,riv,3,.5); /* кормовые ушки 15 */
    for(const s of[-1,1])K.box(P.nose-L*.78,P.nose-L*.74,s*hw*.001,s*hw*.04,hw*1.65,hw*1.9,.08,riv,3,.55); /* окна рубки 27 */
    K.box(P.nose+L*.26,P.nose+L*.3,-hw*.001,hw*.001,hw*2.05,hw*2.25,.08,iron,3,.5); /* антенна рубки 27 */
    for(let x=P.tail+L*.12;x<P.nose-L*.52;x+=L*.21) /* заклёпки хребта 13 */
      K.box(x-.025,x+.025,-hw*.02,hw*.02,hw*.03,hw*.14,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.8,P.nose-L*.76,s*hw*.001,s*hw*.03,hw*1.7,hw*1.95,.08,riv,3,.55); /* окна рубки 28 */
    K.box(P.nose+L*.28,P.nose+L*.32,-hw*.001,hw*.001,hw*2.1,hw*2.3,.08,iron,3,.5); /* антенна рубки 28 */
    for(const s of[-1,1])K.box(P.tail-L*.12,P.tail-L*.08,s*hw*.03,s*hw*.2,hw*1.2,hw*1.45,.08,riv,3,.5); /* кормовые ушки 16 */
    for(const s of[-1,1])K.box(P.nose-L*.82,P.nose-L*.78,s*hw*.001,s*hw*.025,hw*1.75,hw*2.0,.08,riv,3,.55); /* окна рубки 29 */
    K.box(P.nose+L*.3,P.nose+L*.34,-hw*.001,hw*.001,hw*2.15,hw*2.35,.08,iron,3,.5); /* антенна рубки 29 */
    for(let x=P.tail+L*.1;x<P.nose-L*.54;x+=L*.22) /* заклёпки хребта 14 */
      K.box(x-.02,x+.02,-hw*.015,hw*.015,hw*.025,hw*.12,.04,riv,3,.55);
    for(const s of[-1,1])K.box(P.nose-L*.84,P.nose-L*.8,s*hw*.001,s*hw*.02,hw*1.8,hw*2.05,.08,riv,3,.55); /* окна рубки 30 */
    K.box(P.nose+L*.32,P.nose+L*.36,-hw*.001,hw*.001,hw*2.2,hw*2.4,.08,iron,3,.5); /* антенна рубки 30 */
    for(const s of[-1,1])K.box(P.tail-L*.14,P.tail-L*.1,s*hw*.02,s*hw*.15,hw*1.25,hw*1.5,.08,riv,3,.5); /* кормовые ушки 17 */
    const m=h3dPack(K.V,L*.62,{st:[[P.nose,hw*.4],[P.nose-L*.07,hw*.9],[P.nose-L*.22,hw*.88],[P.nose-L*.23,hw*.3],
      [P.tail+L*.16,hw*.3],[P.tail+L*.15,hw*.98],[P.tail+L*.02,hw*.98]],ne:2.6,kh:.7,gl:.35});
    m.L=P.lights;m.len=L;m.frames=P.n;return m;});
}
/* остов: две половины врозь, рамы раскиданы, всё в копоти; огней нет */
function h3dBargeWreck(seed){
  const by=makerBySeed(seed),cap=90+(seed>>>3)%140;
  return bodyMesh("bw:"+seed+":c114",4,()=>{
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
    /* обрывки кабеля у перелома — craft G15 */
    put(K=>{const {tube,box,C}=K,rust=C([90,40,28]),soot=C([18,16,14]),iron=C([44,48,56]);
      tube([[xs-2,0,0],[xs+4,3,2],[xs+10,-1,1]],.25,rust,3,.35,5);
      tube([[xs+1,-2,0],[xs+8,-5,3],[xs+14,-2,1]],.18,soot,3,.3,5);
      box(xs-1,xs+2,-1,1,-P.hw*.4,-P.hw*.2,.1,soot,3,.3);
      box(xs+3,xs+5,-.5,.5,1,2,.08,rust,3,.4);
      /* сорванные листы обшивки у стыка */
      for(let k=0;k<3;k++){const dx=xs-4+k*5,dy=(k-1)*2.2;
        box(dx,dx+3.5,dy-.15,dy+.15,-P.hw*.3,P.hw*.15,.06,iron,3,.35);
        box(dx+.4,dx+1.2,dy-.4,dy+.4,P.hw*.1,P.hw*.25,.04,rust,3,.45);}
      /* обломок переборки */
      box(xs-6,xs-4,-P.hw*.8,P.hw*.8,-.2,.8,.12,iron,3,.35);
      tube([[xs-5,P.hw*.5,0],[xs+2,P.hw*1.2,2],[xs+8,P.hw*.3,1]],.2,rust,3,.3,5);
      /* обгоревший люк */
      box(xs+6,xs+9,-1.2,1.2,-P.hw*.5,P.hw*.2,.1,soot,3,.35);
      for(let i=0;i<4;i++)box(xs+6.5+i*.6,xs+6.8+i*.6,-1,1,P.hw*.15,P.hw*.3,.04,rust,3,.45);
      /* ошмёток рамы */
      box(xs-8,xs-5,P.hw*.6,P.hw*1.1,-P.hw*.2,P.hw*.4,.08,iron,3,.3);
      tube([[xs-7,P.hw*.9,0],[xs-3,P.hw*1.4,3],[xs+1,P.hw*.7,1]],.15,soot,3,.3,4);
      box(xs+10,xs+13,-.8,.8,P.hw*.3,P.hw*.6,.08,rust,3,.35); /* окалина на обломке */
      for(let k=0;k<2;k++)box(xs-10-k*4,xs-8-k*4,-(k+1)*1.5,-(k)*.5,-P.hw*.25,P.hw*.1,.06,iron,3,.3);
      tube([[xs+4,2,0],[xs+12,6,4],[xs+18,2,1]],.22,rust,3,.3,5);
      box(xs-3,xs,.5,2.5,-P.hw*.5,-P.hw*.2,.1,soot,3,.3);
      for(let i=0;i<3;i++)box(xs+8+i*2,xs+9+i*2,-2+i,.5+i,-.3,.5,.05,rust,3,.4);
      tube([[xs-8,-3,0],[xs-2,-6,2],[xs+4,-3,1]],.18,soot,3,.3,4);
      box(xs+14,xs+17,-1.5,1.5,P.hw*.2,P.hw*.5,.08,iron,3,.3);
      for(let i=0;i<2;i++)tube([[xs-12-i*3,1,0],[xs-6-i*2,-2,3],[xs-1,1,1]],.15,rust,3,.3,4);
      box(xs+2,xs+5,P.hw*.4,P.hw*.9,-.5,.5,.1,soot,3,.3);
      tube([[xs+5,-3,0],[xs+14,-1,3],[xs+20,2,1]],.18,rust,3,.3,4);
      box(xs-4,xs-1,-P.hw*.6,P.hw*.2,-.4,.6,.1,iron,3,.35);
      for(let i=0;i<2;i++)box(xs+12+i*3,xs+14+i*3,-1+i*.5,1+i*.5,-.2,.4,.06,rust,3,.4);
      tube([[xs-8,P.hw*.3,0],[xs-2,P.hw*.8,2],[xs+4,P.hw*.2,1]],.14,soot,3,.3,4);
      box(xs+15,xs+18,-P.hw*.4,P.hw*.3,-.3,.5,.08,iron,3,.35);
      for(let i=0;i<3;i++)box(xs-12+i*4,xs-10+i*4,-P.hw*.5+i*.3,P.hw*.2,-.2,.4,.05,rust,3,.35);
      tube([[xs+8,-4,0],[xs+16,-2,2],[xs+22,1,0]],.16,soot,3,.3,4);
      box(xs-14,xs-11,P.hw*.2,P.hw*.7,-.3,.5,.08,iron,3,.35);
      for(let i=0;i<2;i++)tube([[xs+2+i*6,P.hw*.4,0],[xs+8+i*4,P.hw*1.0,3],[xs+14+i*2,P.hw*.3,1]],.12,rust,3,.3,4);
      box(xs+6,xs+9,-P.hw*.7,-P.hw*.2,-.4,.4,.1,soot,3,.3);
      for(let i=0;i<3;i++)box(xs+16+i*2,xs+17.5+i*2,-1.5+i*.4,.5+i*.3,-.2,.3,.05,rust,3,.4);
      tube([[xs-6,-P.hw*.4,0],[xs+2,-P.hw*.9,2],[xs+10,-P.hw*.2,1]],.14,soot,3,.3,4);
      box(xs-16,xs-13,-P.hw*.5,P.hw*.1,-.3,.4,.08,iron,3,.35);
      for(let i=0;i<2;i++)box(xs+18+i*3,xs+20+i*3,P.hw*.1+i*.4,P.hw*.6,-.2,.4,.06,rust,3,.4);
      tube([[xs-10,2,0],[xs-4,5,2],[xs+2,1,1]],.16,rust,3,.3,4);
      box(xs+4,xs+7,P.hw*.5,P.hw*1.0,-.4,.5,.1,soot,3,.3);
      for(let i=0;i<3;i++)box(xs-15+i*3,xs-13+i*3,-P.hw*.4+i*.2,P.hw*.15,-.25,.35,.05,rust,3,.35);
      tube([[xs+10,-2,0],[xs+18,1,3],[xs+24,-1,1]],.15,soot,3,.3,4);
      box(xs-2,xs+1,-P.hw*.8,-P.hw*.2,-.3,.5,.1,iron,3,.35);
      for(let i=0;i<2;i++)tube([[xs-12+i*4,-1,0],[xs-6+i*3,2,2],[xs+i*2,-1,1]],.13,rust,3,.3,4);
      box(xs+12,xs+15,-P.hw*.3,P.hw*.4,-.25,.4,.08,iron,3,.35);
      tube([[xs-14,P.hw*.6,0],[xs-8,P.hw*1.1,2],[xs-2,P.hw*.4,1]],.14,soot,3,.3,4);
      box(xs+8,xs+11,P.hw*.2,P.hw*.7,-.35,.45,.08,rust,3,.35);
      box(xs-7,xs-4,-P.hw*.5,P.hw*.2,-.35,.45,.08,iron,3,.35);
      tube([[xs+6,P.hw*.5,0],[xs+12,P.hw*1.0,2],[xs+18,P.hw*.3,1]],.13,rust,3,.3,4);
      box(xs+10,xs+13,-P.hw*.4,P.hw*.2,-.3,.4,.08,soot,3,.3);
      for(let i=0;i<2;i++)box(xs-9+i*5,xs-7+i*5,P.hw*.3,P.hw*.8,-.25,.35,.06,rust,3,.35);
      tube([[xs-5,-P.hw*.5,0],[xs+3,-P.hw*1.0,2],[xs+10,-P.hw*.2,1]],.12,soot,3,.3,4);
      box(xs+1,xs+4,-P.hw*.7,-P.hw*.2,-.3,.4,.08,iron,3,.35);
      for(let i=0;i<2;i++)tube([[xs+8+i*4,-2,0],[xs+14+i*3,1,2],[xs+20+i*2,-1,1]],.12,rust,3,.3,4);
      box(xs-11,xs-8,P.hw*.15,P.hw*.65,-.3,.4,.08,soot,3,.3);
      tube([[xs+3,P.hw*.2,0],[xs+10,P.hw*.7,2],[xs+16,P.hw*.1,1]],.13,soot,3,.3,4);
      for(let i=0;i<2;i++)box(xs+5+i*4,xs+7+i*4,-P.hw*.55,P.hw*.15,-.25,.35,.06,rust,3,.35);
      tube([[xs-9,P.hw*.4,0],[xs-3,P.hw*.9,2],[xs+3,P.hw*.2,1]],.12,rust,3,.3,4);
      box(xs+14,xs+17,P.hw*.1,P.hw*.55,-.25,.35,.08,iron,3,.35);
      for(let i=0;i<2;i++)tube([[xs-6+i*5,-P.hw*.3,0],[xs+i*4,-P.hw*.8,2],[xs+6+i*3,-P.hw*.1,1]],.11,soot,3,.3,4);
      box(xs-5,xs-2,P.hw*.25,P.hw*.7,-.3,.4,.08,soot,3,.3);
      tube([[xs+7,-1,0],[xs+14,2,2],[xs+20,-1,1]],.12,rust,3,.3,4);
      for(let i=0;i<2;i++)box(xs+9+i*3,xs+11+i*3,-P.hw*.45,P.hw*.2,-.2,.3,.06,rust,3,.35);
      tube([[xs-8,-P.hw*.2,0],[xs-2,-P.hw*.7,2],[xs+4,-P.hw*.1,1]],.11,soot,3,.3,4);
      box(xs+2,xs+5,P.hw*.35,P.hw*.8,-.3,.4,.08,iron,3,.35);
      box(xs-3,xs,.2,.6,-.4,.3,.08,soot,3,.3);
      box(xs+1,xs+3,-P.hw*.7,-P.hw*.3,-.2,.35,.08,iron,3,.35);
      box(xs-1,xs+2,P.hw*.2,P.hw*.55,-.25,.3,.08,soot,3,.3);
      box(xs+3,xs+6,-P.hw*.55,-P.hw*.2,-.15,.4,.08,iron,3,.35);
      box(xs-4,xs-1,-.1,.4,-.35,.25,.08,soot,3,.3);
      box(xs+4,xs+7,P.hw*.15,P.hw*.5,-.2,.35,.08,iron,3,.35);
      box(xs-5,xs-2,-P.hw*.5,-P.hw*.15,-.3,.3,.08,soot,3,.3);
      box(xs+5,xs+8,.1,.45,-.15,.4,.08,iron,3,.35);
      box(xs-6,xs-3,P.hw*.1,P.hw*.4,-.25,.3,.08,soot,3,.3);
      box(xs+6,xs+9,-P.hw*.4,-P.hw*.1,-.2,.35,.08,iron,3,.35);
      box(xs-2,xs+1,.05,.4,-.3,.25,.08,soot,3,.3);
      box(xs+7,xs+10,P.hw*.05,P.hw*.35,-.2,.3,.08,iron,3,.35);
      box(xs-7,xs-4,-P.hw*.45,-P.hw*.1,-.25,.3,.08,soot,3,.3);
      box(xs,xs+3,.15,.5,-.2,.35,.08,iron,3,.35);
      box(xs+8,xs+11,-P.hw*.35,-P.hw*.05,-.15,.3,.08,soot,3,.3);
      box(xs-8,xs-5,P.hw*.05,P.hw*.35,-.2,.3,.08,iron,3,.35);
      box(xs-1,xs+2,-P.hw*.4,-P.hw*.05,-.25,.25,.08,soot,3,.3);
      box(xs+9,xs+12,P.hw*.1,P.hw*.4,-.15,.35,.08,iron,3,.35);
      box(xs-9,xs-6,-P.hw*.35,-P.hw*.05,-.2,.25,.08,soot,3,.3);
      box(xs+2,xs+5,P.hw*.15,P.hw*.45,-.15,.3,.08,iron,3,.35);
      box(xs+10,xs+13,-P.hw*.3,0,-.15,.3,.08,soot,3,.3);
      box(xs-3,xs,P.hw*.2,P.hw*.5,-.2,.25,.08,iron,3,.35);
      box(xs-10,xs-7,P.hw*.1,P.hw*.4,-.2,.25,.08,soot,3,.3);
      box(xs+3,xs+6,-P.hw*.4,-P.hw*.1,-.15,.3,.08,iron,3,.35);
      box(xs+11,xs+14,P.hw*.05,P.hw*.35,-.1,.25,.08,soot,3,.3);
      box(xs-4,xs-1,-P.hw*.35,-P.hw*.05,-.2,.2,.08,iron,3,.35);
      box(xs-11,xs-8,-P.hw*.3,0,-.15,.25,.08,soot,3,.3);
      box(xs+4,xs+7,P.hw*.15,P.hw*.45,-.1,.3,.08,iron,3,.35);
      box(xs+12,xs+15,-P.hw*.25,.05,-.1,.2,.08,soot,3,.3);
      box(xs-5,xs-2,P.hw*.25,P.hw*.55,-.15,.25,.08,iron,3,.35);
      box(xs-12,xs-9,P.hw*.05,P.hw*.3,-.15,.2,.08,soot,3,.3);
      box(xs+5,xs+8,-P.hw*.35,-P.hw*.1,-.1,.25,.08,iron,3,.35);
      box(xs+13,xs+16,P.hw*.1,P.hw*.35,-.1,.2,.08,soot,3,.3);
      box(xs-6,xs-3,-P.hw*.3,-P.hw*.05,-.15,.2,.08,iron,3,.35);
      box(xs-13,xs-10,-P.hw*.25,.05,-.1,.2,.08,soot,3,.3);
      box(xs+6,xs+9,P.hw*.2,P.hw*.5,-.1,.25,.08,iron,3,.35);
      box(xs-16,xs-13,P.hw*.05,P.hw*.3,-.12,.22,.08,soot,3,.3);
      box(xs+10,xs+13,-P.hw*.2,P.hw*.1,-.08,.22,.08,iron,3,.35);
      box(xs-18,xs-15,-P.hw*.15,P.hw*.15,-.1,.2,.08,soot,3,.3);
      box(xs+3,xs+6,P.hw*.15,P.hw*.4,-.1,.2,.08,iron,3,.35);
      box(xs-20,xs-17,P.hw*.1,P.hw*.35,-.08,.18,.08,soot,3,.3);
      box(xs+12,xs+15,-P.hw*.25,P.hw*.05,-.1,.2,.08,iron,3,.35);
      box(xs-8,xs-5,-P.hw*.3,0,-.12,.2,.08,soot,3,.3);
      box(xs+1,xs+4,P.hw*.25,P.hw*.45,-.08,.18,.08,iron,3,.35);
      box(xs-22,xs-19,-P.hw*.1,P.hw*.2,-.1,.18,.08,soot,3,.3);
      box(xs+14,xs+17,P.hw*.05,P.hw*.3,-.08,.2,.08,iron,3,.35);
      box(xs-4,xs-1,P.hw*.15,P.hw*.4,-.1,.2,.08,soot,3,.3);
      box(xs+7,xs+10,-P.hw*.15,P.hw*.15,-.08,.18,.08,iron,3,.35);
      box(xs-24,xs-21,P.hw*.0,P.hw*.25,-.08,.16,.08,soot,3,.3);
      box(xs+16,xs+19,-P.hw*.3,P.hw*.0,-.1,.18,.08,iron,3,.35);
      box(xs-2,xs+1,-P.hw*.35,-.05,-.1,.18,.08,soot,3,.3);
      box(xs+8,xs+11,P.hw*.3,P.hw*.5,-.08,.16,.08,iron,3,.35);
      box(xs-26,xs-23,-P.hw*.2,P.hw*.1,-.08,.16,.08,soot,3,.3);
      box(xs+18,xs+21,P.hw*.1,P.hw*.35,-.08,.16,.08,iron,3,.35);
      box(xs-1,xs+2,P.hw*.2,P.hw*.45,-.08,.16,.08,soot,3,.3);
      box(xs+9,xs+12,-P.hw*.25,P.hw*.05,-.08,.16,.08,iron,3,.35);
      box(xs-28,xs-25,P.hw*.05,P.hw*.3,-.08,.14,.08,soot,3,.3);
      box(xs+20,xs+23,-P.hw*.2,P.hw*.1,-.08,.14,.08,iron,3,.35);
      box(xs,xs+3,-P.hw*.3,0,-.08,.14,.08,soot,3,.3);
      box(xs+10,xs+13,P.hw*.15,P.hw*.4,-.08,.14,.08,iron,3,.35);
      box(xs-30,xs-27,-P.hw*.15,P.hw*.15,-.06,.12,.08,soot,3,.3);
      box(xs+22,xs+25,P.hw*.05,P.hw*.3,-.06,.12,.08,iron,3,.35);
      box(xs+1,xs+4,P.hw*.1,P.hw*.35,-.06,.12,.08,soot,3,.3);
      box(xs+11,xs+14,-P.hw*.2,P.hw*.1,-.06,.12,.08,iron,3,.35);
      box(xs-32,xs-29,P.hw*.0,P.hw*.25,-.05,.1,.08,soot,3,.3);
      box(xs+24,xs+27,-P.hw*.15,P.hw*.1,-.05,.1,.08,iron,3,.35);
      box(xs+2,xs+5,-P.hw*.25,.05,-.05,.1,.08,soot,3,.3);
      box(xs+12,xs+15,P.hw*.1,P.hw*.35,-.05,.1,.08,iron,3,.35);
      box(xs-34,xs-31,-P.hw*.1,P.hw*.2,-.04,.08,.08,soot,3,.3);
      box(xs+26,xs+29,P.hw*.0,P.hw*.25,-.04,.08,.08,iron,3,.35);
      box(xs+3,xs+6,P.hw*.05,P.hw*.3,-.04,.08,.08,soot,3,.3);
      box(xs+13,xs+16,-P.hw*.15,P.hw*.1,-.04,.08,.08,iron,3,.35);
      box(xs-36,xs-33,P.hw*.05,P.hw*.3,-.03,.06,.08,soot,3,.3);
      box(xs+28,xs+31,-P.hw*.1,P.hw*.15,-.03,.06,.08,iron,3,.35);
      box(xs+4,xs+7,-P.hw*.2,.1,-.03,.06,.08,soot,3,.3);
      box(xs+14,xs+17,P.hw*.05,P.hw*.3,-.03,.06,.08,iron,3,.35);
      box(xs-38,xs-35,-P.hw*.05,P.hw*.2,-.025,.05,.08,soot,3,.3);
      box(xs+30,xs+33,P.hw*.0,P.hw*.2,-.025,.05,.08,iron,3,.35);
      box(xs+5,xs+8,P.hw*.0,P.hw*.25,-.025,.05,.08,soot,3,.3);
      box(xs+15,xs+18,-P.hw*.1,P.hw*.15,-.025,.05,.08,iron,3,.35);
      box(xs-40,xs-37,P.hw*.0,P.hw*.25,-.02,.04,.08,soot,3,.3);
      box(xs+32,xs+35,-P.hw*.05,P.hw*.15,-.02,.04,.08,iron,3,.35);
      box(xs+6,xs+9,-P.hw*.15,.1,-.02,.04,.08,soot,3,.3);
      box(xs+16,xs+19,P.hw*.0,P.hw*.25,-.02,.04,.08,iron,3,.35);
      box(xs-42,xs-39,-P.hw*.05,P.hw*.2,-.015,.03,.08,soot,3,.3);
      box(xs+34,xs+37,P.hw*.0,P.hw*.2,-.015,.03,.08,iron,3,.35);
      box(xs+7,xs+10,P.hw*.05,P.hw*.3,-.015,.03,.08,soot,3,.3);
      box(xs+17,xs+20,-P.hw*.1,P.hw*.1,-.015,.03,.08,iron,3,.35);
      box(xs-8,xs+8,-P.hw*.6,P.hw*.6,.4,1.2,.2,iron,3,.45); /* палубный люк wreck 32 */
      for(const s of[-1,1])box(xs-20,xs-12,s*P.hw*.4,s*P.hw*.9,-.1,.4,.15,soot,3,.4); /* бортовой щиток wreck 32 */
      box(xs+10,xs+22,-P.hw*.5,P.hw*.5,.5,1.3,.18,iron,3,.45); /* палубный люк wreck 33 */
      for(const s of[-1,1])box(xs+14,xs+22,s*P.hw*.35,s*P.hw*.85,-.08,.35,.12,soot,3,.4); /* бортовой щиток wreck 33 */
      box(xs-15,xs-5,-P.hw*.45,P.hw*.45,.3,1.0,.15,soot,3,.4); /* палубный люк wreck 34 */
      for(const s of[-1,1])box(xs-5,xs+5,s*P.hw*.5,s*P.hw*.95,.2,.9,.12,iron,3,.4); /* бортовой щиток wreck 35 */
      box(xs+5,xs+15,-P.hw*.4,P.hw*.4,.35,1.05,.14,soot,3,.4); /* палубный люк wreck 36 */
      for(const s of[-1,1])box(xs+8,xs+18,s*P.hw*.4,s*P.hw*.9,-.05,.3,.1,iron,3,.4); /* бортовой щиток wreck 37 */
      box(xs-12,xs-2,-P.hw*.35,P.hw*.35,.25,.9,.12,soot,3,.35); /* палубный люк wreck 38 */
      for(const s of[-1,1])box(xs-18,xs-8,s*P.hw*.3,s*P.hw*.8,-.08,.28,.1,iron,3,.35); /* бортовой щиток wreck 39 */
      box(xs+16,xs+26,-P.hw*.3,P.hw*.3,.2,.85,.11,soot,3,.35); /* палубный люк wreck 40 */
      for(const s of[-1,1])box(xs+2,xs+12,s*P.hw*.35,s*P.hw*.85,-.04,.25,.09,iron,3,.35); /* бортовой щиток wreck 41 */
      box(xs-10,xs,-P.hw*.3,P.hw*.3,.15,.75,.1,soot,3,.35); /* палубный люк wreck 42 */},0,0,0);
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
