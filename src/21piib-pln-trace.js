/* ══════════════ планета: чужой след телами (plnOverOld, пункт 3, 22.10) ══════════════
   Чужой знак (11ag, M171) был наклейкой поверх кадра (traceDraw). Теперь это камень на земле движка,
   и правила traceDraw те же:

   1. Знак режут на КАМНЕ: плита ходоку по грудь (1.2 м), верх сколот, бока не параллельны, силуэт —
      от руки (t.j), поэтому две плиты рядом не близнецы.
   2. Фигура — одна из двенадцати (TRACE_MARK): те же штрихи, что в тетради, прорезом по лицу плиты —
      тёмная борозда и светлая нижняя кромка. Штрихи снимаются с той же рисовалки фигуры: пишущий
      холст-самозванец собирает её линии в ломаные, и фигура не заводится второй раз.
   3. Вещь рядом — куча мешков цвета груза, не больше трёх: разный размер, плоское дно, перевязь.
   4. Стоит у самой линии хода, чуть позади: подходят к нему пешком (traceNear, ±32 ед.).
   Подписей нет и не было — правило 11ag. */
const TRC={it:null,gen:-1,L:null};

/* штрихи фигуры: холст-самозванец, который пишет moveTo/lineTo/arc/bezier/closePath в ломаные */
function plnTrcStrokes(m){
  const M=TRACE_MARK[m%TRACE_MARK.length],out=[];let cur=null,st=null;
  const pt=(x,y)=>{if(!cur){cur=[];out.push(cur);st=[x,y];}cur.push([x,y]);};
  const c={
    moveTo:(x,y)=>{cur=null;pt(x,y);},
    lineTo:(x,y)=>pt(x,y),
    closePath:()=>{if(cur&&st)cur.push([st[0],st[1]]);},
    arc:(x,y,r,a0,a1)=>{const n=Math.max(4,Math.ceil(Math.abs(a1-a0)/TAU*20));cur=null;
      for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;pt(x+Math.cos(a)*r,y+Math.sin(a)*r);}},
    bezierCurveTo:(x1,y1,x2,y2,x3,y3)=>{const p=cur&&cur.length?cur[cur.length-1]:[x1,y1];
      for(let k=1;k<=10;k++){const t=k/10,u=1-t;
        pt(u*u*u*p[0]+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*p[1]+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3);}},
    quadraticCurveTo:(x1,y1,x2,y2)=>{const p=cur&&cur.length?cur[cur.length-1]:[x1,y1];
      for(let k=1;k<=8;k++){const t=k/8,u=1-t;pt(u*u*p[0]+2*u*t*x1+t*t*x2,u*u*p[1]+2*u*t*y1+t*t*y2);}}
  };
  M.d(c);
  return out.filter(s=>s.length>1);
}
function plnTrcAt(L,t){
  const x=t.x/PLN_M,z=1.7;
  const f0=L.flat;let y;
  try{L.flat=null;y=Math.min(plnLandRibAt(L,x-.5,z),plnLandRibAt(L,x+.5,z),plnLandRibAt(L,x,z+.3));}finally{L.flat=f0;}
  return {x,y,z};
}
function plnTrcMesh(t,p,sd,gy){
  const m=plnMesh(1<<13),MAN=PLN_MAT.man,pal=p.T.pal,MK=PLN_MARK_COL;
  if(!t.j){const r=rng(traceHashOf((t.h||"")+"|"+(t.i||"")+"|плита"));t.j=[r(),r(),r(),r(),r()];}
  const j=t.j,HS=1.3,HW=.56,D=.17;
  const body=plnMix3(plnRgb(pal[1].map(v=>v*.62+30)),MK.concrete,.45),lite=plnRgb(pal[3].map((v,i)=>(v*.45+pal[1][i]*.55)*1.1)),
    dark=plnRgb(pal[0].map(v=>v*.18));
  /* плита — контур наклейки (верх сколот, бока не параллельны), выдавленный в толщину: колотый камень
     гранями, а не надутый брус. Задняя грань чуть меньше — камень сужается от лица */
  const tl=HS*(.62+j[0]*.34),tr2=HS*(.58+j[1]*.38);
  const P=[[-HW*(.86+j[2]*.3),-.2],[-HW*(.68+j[3]*.34),tl],[-HW*(.36-j[4]*.5),HS],[HW*(.5+j[4]*.42),tr2],[HW*(.8+j[0]*.28),-.2]];
  const F=P.map(q=>[q[0],q[1],-D]),B=P.map(q=>[q[0]*.88+.03,q[1]*.94,D]);
  const tone=k=>plnMul(body,.86+.28*plnHash(sd,k,5));
  for(let i=1;i+1<P.length;i++){plnCard(m,F[0],F[i],F[i+1],F[i+1],[0,0,-1],tone(0),MAN,null,0,0);
    plnCard(m,B[0],B[i+1],B[i],B[i],[0,0,1],tone(1),MAN,null,0,0);}
  for(let i=0;i<P.length;i++){const k=(i+1)%P.length,u=plnSub(F[k],F[i]),v=plnSub(B[i],F[i]);let n=plnNorm(plnCross(v,u));
    const mid=[(F[i][0]+F[k][0])/2,(F[i][1]+F[k][1])/2-HS/2,0];if(plnDot(n,mid)<0)n=plnMul(n,-1);
    plnCard(m,F[i],B[i],B[k],F[k],n,i===1||i===2?plnMix3(tone(i+2),lite,.25):plnMul(tone(i+2),.82),MAN,null,0,0);}
  /* трещина от скола вниз: камень битый, а не пиленый */
  plnTube(m,{path:[[-HW*(.3-j[2]*.4),tl-.08,-D-.01],[-HW*(.1-j[3]*.5),tl-HS*.34,-D-.01],[-HW*(.34-j[1]*.4),0,-D-.01]],rad:.012,sides:3,col:plnMul(body,.5),mat:MAN,flat:.3});
  /* знак: борозда по лицу и светлая нижняя кромка */
  const sc=.27,cy=HS*.47,fz=-D-.02;
  for(const st of plnTrcStrokes(t.m)){
    const path=st.map(q=>[q[0]*sc-.02,cy-q[1]*sc,fz]);
    plnTube(m,{path:path.map(q=>[q[0],q[1]-.04,q[2]+.006]),rad:.055,sides:4,col:plnMix3(lite,[1,1,1],.55),mat:MAN,flat:.3});
    plnTube(m,{path,rad:.04,sides:4,col:dark,mat:MAN,flat:.35});
  }
  /* куча мешков цвета груза: не больше трёх, разный рост, общая тень */
  const n=Math.max(1,Math.min(TRACE_MAX_UNITS,t.n|0)),bags=Math.min(3,n);
  const rc=plnHex((RES[t.r]&&RES[t.r].col)||"#b4b4b4"),cloth=plnSetMott(plnMix3(rc,[.3,.26,.2],.25),.18,6,sd+3),hx=1.95;
  for(let i=0;i<bags;i++){
    const a=bags>1?(i/(bags-1)-.5)*2:0,r=.36-Math.abs(a)*.08,bx=hx+a*(.22+bags*.16),bz=(i%2)*.18-.05;
    const g=gy?gy(bx,bz):0;
    plnBlob(m,{c:[bx,g+r*.62,bz],r:[r,r*.75,r*.82],sub:2,bump:.18,seed:sd+10+i,col:cloth,mat:MAN,cut:-r*.55,yaw:a*.5});
    plnTube(m,{path:[[bx,g+r*1.22,bz],[bx+.02,g+r*1.42,bz]],rad:r*.22,sides:6,col:cloth,mat:MAN,cap:true});
    plnTube(m,{path:[[bx-.01,g+r*1.27,bz],[bx+.03,g+r*1.3,bz]],rad:r*.24,sides:6,col:plnMul(plnMix3(rc,[.3,.26,.2],.25),.45),mat:MAN});
    plnTube(m,{path:[[bx+.02,g+r*1.42,bz],[bx+.06,g+r*1.62,bz-.02]],rad:r*.1,sides:4,col:cloth,mat:MAN,cap:true});
  }
  return {body:m,blots:[[0,0,.9,.32],[hx,0,.45+bags*.25,.3]]};
}
function plnTrcFree(){
  const it=TRC.it;if(!it)return;
  if(it.geo)plnGeoFree(it.geo);if(it.inst)plnInstFree(it.inst);
  TRC.it=null;
}
function plnTrcStep(L,S){
  if(TRC.gen!==PLN_GPU.gen||TRC.L!==L){plnTrcFree();TRC.gen=PLN_GPU.gen;TRC.L=L;}
  const t=typeof traceHere==="function"?traceHere():null;
  if(!OWN.on||!t){plnTrcFree();return;}
  if(t.x==null)t.x=traceSpotX(S.tr,t);
  const key=[t.key,t.h,t.i,t.m,t.r,Math.min(3,t.n|0),Math.round(t.x)].join("|");
  if(TRC.it&&TRC.it.key===key)return;
  plnTrcFree();
  const A=plnTrcAt(L,t),sd=hashi(traceHashOf(key),0x7AC,3),yaw=(plnHash(sd,1,3)-.5)*.5,M=plnTrcMesh(t,S.p,sd,(x,z)=>{const c=Math.cos(yaw),sn=Math.sin(yaw);
    return plnLandRibAt(L,A.x+x*c+z*sn,A.z-x*sn+z*c)-A.y;});
  const it={A,key,geo:M.body.nv?plnGeo(plnMeshDone(M.body)):null,blots:M.blots,a:new Float32Array(16),inst:null};
  plnRec(it.a,0,[A.x,A.y,A.z],1,yaw,1,sd%97,null);
  it.inst=plnInst(it.a,1,1);
  TRC.it=it;
}
function plnTrcFrame(F,ex,V){
  const it=TRC.it;if(!it||!it.geo)return;
  const A=it.A;
  if(Math.abs(A.x-ex)>V.hw*(1+A.z/V.D)+6)return;
  F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:PLN_KIND.body,to:PLN_TO.all});
  const b=F.blobs;let n=b[0]|0;
  for(const q of it.blots){if(n>=64)break;b.set([A.x+q[0],A.z+q[1],q[2],q[3]],4+n*4);n++;}
  b[0]=n;
}
