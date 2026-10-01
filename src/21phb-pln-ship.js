/* ══════════════ планета: корабль на опорах — по корпусу игры (M621) ══════════════
   Заготовка со стенда (M610) была одним кораблём на всех. Здесь корабль собирается из того же
   корпуса, на котором летаешь: `hullOf(G.shipId)` даёт станции обвода в плане (нос, мидель,
   уступ, корма), схему планера (`form`: стрела, дельта, крест, катамаран, плита, короб, диск,
   трезубец), крылья, гондолы, сопла, класс (`HULL_CLASS`: радиаторы, плавник, тарелка,
   контейнеры) и краску владельца. Мерило прежнее — человек: длина 7–10 м (`landerLen`),
   брюхо на высоте пояса, под ним три опоры. Ливрея — полоса цвета людей: герой и его
   корабль одного цвета (§3 плана), а краска корпуса — своя у каждого.

   Тело строится раз на корпус и живёт одной сеткой; опоры и факелы — свои малые сетки,
   переписываемые по месту: опоры встают каждая на СВОЙ грунт (как у старой посадки),
   складываются на спуске (gear 0…1) и проседают на касании (sq); факелы растут по тяге.
   Люк, освещённый проём и трап — на ближнем борту (−z), подножие трапа там, где его ждёт
   земля (21pf: rampX/rampZ). Сетки лежат в начале координат, грунт под телом на нуле. */
const PLN_SHIP={gen:-1,key:"",geo:null,inst:null,a:new Float32Array(16),D:null,
  legs:null,legKey:"",fx:null,fxN:0,lamp:[0,0,0],hull:null};
const PLN_SHIP_CAP={legV:2600,legI:9000,fxV:1400,fxI:4200};

/* цвет игры (0…255) → линейный */
function plnShipRgb(c){return [Math.pow(c[0]/255,2.2),Math.pow(c[1]/255,2.2),Math.pow(c[2]/255,2.2)];}
/* корпус, на котором летаешь; без игры — разведчик-стрела, чтобы стенд не пустовал */
function plnShipHull(){
  if(typeof hullOf==="function"&&G.shipId){try{return hullOf(G.shipId);}catch(e){}}
  return {len:42,nose:21,tail:-21,bw:5.2,tailW:3.2,form:"swept",hcls:"scout",
    prof:[[21,1.1],[16,3.4],[10,4.9],[4,5.2],[-3,5.1],[-10,4.6],[-16,3.8],[-21,3.2]],
    wings:[[[6,-4.2],[2,-9],[-4,-14],[-9,-13],[-8,-7],[-10,-4.5]]],nacs:[],eng:[{x:-21,y:-1.6,r:1.6},{x:-21,y:1.6,r:1.6}],
    col:[217,213,200],lite:[233,231,222],dark:[96,94,88],edge:[70,70,66],steel:[118,124,132],iron:[52,55,62],
    radm:[26,29,34],cer:[196,192,182],foil:[176,148,86],stripe:{a:.3},mark:{},lux:false,yac:false};
}
/* размеры тела в метрах: по длине корабля и обводу в плане */
/* длина корабля на опорах в метрах — для расчистки посадки (21pga) до того, как он построен */
function plnShipLenM(){
  const id=G.shipId;
  return (typeof landerLen==="function"&&id?landerLen(id):110)/PLN_M;
}
function plnShipDims(h){
  const K=(typeof HULL_CLASS==="object"&&HULL_CLASS[h.hcls])||{bw:.85,len:1,wing:[1,2]};
  const lenPx=typeof landerLen==="function"&&G.shipId?landerLen(G.shipId):clamp(h.len*2.2,90,130);
  const lenM=lenPx/PLN_M,sc=lenM/h.len,xc=(h.nose+h.tail)/2,form=h.form||"swept";
  const flat=form==="slab"||form==="boxed",disc=form==="disc";
  const hk=disc?.42:flat?.6:(form==="delta"?.85:1);
  const ryMid=Math.max(lenM*.15,1.05)*hk,wk=disc?2.2:1.25;
  const w=x=>{ /* полуширина обвода в плане на местном x, м */
    const px=x/sc+xc,P=h.prof;
    if(px>=P[0][0])return P[0][1]*sc*wk;
    for(let i=0;i+1<P.length;i++)if(px<=P[i][0]&&px>=P[i+1][0]){const t=(P[i][0]-px)/Math.max(1e-6,P[i][0]-P[i+1][0]);return lerp(P[i][1],P[i+1][1],t)*sc*wk;}
    return P[P.length-1][1]*sc*wk;
  };
  const bw=h.bw*sc*wk,tail=(h.tail-xc)*sc,nose=(h.nose-xc)*sc;
  /* к корме тело садится: спина сходит вниз, брюхо приподнимается (как у старой посадки) */
  const tu=x=>x<0?Math.pow(clamp(x/tail,0,1),2):0;
  const ry=x=>Math.max(.14,ryMid*(.55+.45*Math.min(1,w(x)/bw))*(disc?1:1-.26*tu(x))),rz=x=>Math.max(.3,Math.max(w(x),ry(x)*.7));
  const lift=x=>disc?0:.24*ryMid*tu(x);
  const bellyY=1.35,hx=Math.min(.75,lenM*.12);
  return {K,lenM,sc,xc,form,flat,disc,ryMid,bw,w,ry,rz,lift,bellyY,hx,rzH:rz(hx),ryH:ry(hx),
    nose,tail,top:x=>bellyY+ry(x)*1.8+lift(x)};
}
/* тонкая пластина по многоугольнику (x,z) на высоте yAt(x,z): верх, низ и кромка.
   Обход — против часовой в плоскости (x,z), как у лофта; вогнутость терпится через веер
   из середины */
function plnShipPlate(m,pts,yAt,thick,top,bot,mat,x){
  let A=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];A+=a[0]*b[1]-b[0]*a[1];}
  const P=A<0?pts.slice().reverse():pts,n=P.length,h=thick/2;
  const cx=P.reduce((a,q)=>a+q[0],0)/n,cz=P.reduce((a,q)=>a+q[1],0)/n,cy=yAt(cx,cz);
  const T=P.map(q=>plnVert(m,[q[0],yAt(q[0],q[1])+h,q[1]],[0,1,0],top,mat,0,0,x));
  const B=P.map(q=>plnVert(m,[q[0],yAt(q[0],q[1])-h,q[1]],[0,-1,0],bot,mat,0,0,x));
  const tc=plnVert(m,[cx,cy+h,cz],[0,1,0],top,mat,0,0,x),bc=plnVert(m,[cx,cy-h,cz],[0,-1,0],bot,mat,0,0,x);
  for(let i=0;i<n;i++){
    const j=(i+1)%n,a=P[i],b=P[j];
    plnTri(m,tc,T[i],T[j]);plnTri(m,bc,B[j],B[i]);
    const nn=plnNorm([b[1]-a[1],0,-(b[0]-a[0])]);
    if(nn[0]*((a[0]+b[0])/2-cx)+nn[2]*((a[1]+b[1])/2-cz)<0){nn[0]=-nn[0];nn[2]=-nn[2];}
    const ya=yAt(a[0],a[1]),yb=yAt(b[0],b[1]),e=plnMix3(top,bot,.5);
    const q0=plnVert(m,[a[0],ya+h,a[1]],nn,e,mat,0,0,x),q1=plnVert(m,[a[0],ya-h,a[1]],nn,e,mat,0,0,x),
      q2=plnVert(m,[b[0],yb-h,b[1]],nn,e,mat,0,0,x),q3=plnVert(m,[b[0],yb+h,b[1]],nn,e,mat,0,0,x);
    plnQuad(m,q0,q1,q2,q3);
  }
}
/* тело корабля: одна сетка на корпус */
function plnShipMesh(h,D){
  const m=plnMesh(24576),M=PLN_MAT.man,c=plnShipRgb;
  const paint=c(h.col),lite=c(h.lite),dark=c(h.dark),steel=c(h.steel||[118,124,132]),iron=c(h.iron||[52,55,62]),
    radm=c(h.radm||[26,29,34]),cer=c(h.cer||[196,192,182]),foil=c(h.foil||[176,148,86]),
    glass=plnHex("#0d1820"),sky=plnHex("#7fa3b8"),rim=c(h.edge||h.dark),accent=plnHex("#ee7326"),belly=plnMul(dark,.8),shine=h.yac?.6:.3;
  const {lenM,form,flat,disc,bellyY,hx,rzH,ryH}=D,K=D.K;
  /* ── станции обвода: от кормы к носу, сечение — эллипс с плоским брюхом ── */
  const P=h.prof,st=[];
  const tailX=D.tail-Math.max(.12,lenM*.015);
  st.push({x:tailX,ry:D.ry(D.tail)*.78,rz:D.rz(D.tail)*.8,y:bellyY+D.ry(D.tail)*.8+D.lift(D.tail)});
  for(let i=P.length-1;i>=0;i--){const x=(P[i][0]-D.xc)*D.sc;st.push({x,ry:D.ry(x),rz:D.rz(x),y:bellyY+D.ry(x)*.8+D.lift(x)});}
  const tipX=D.nose+Math.max(.25,lenM*.03);
  st.push({x:tipX,ry:D.ry(D.nose)*.35,rz:D.rz(D.nose)*.35,y:bellyY+D.ry(D.nose)*.9});
  const S=plnCastResample(st,Math.max(28,st.length*4));
  /* фонарь: полоса остекления на спине носа с тёмной рамкой; стекло отражает небо кверху */
  const gx0=lenM*(K.blunt?.24:.13),gx1=lenM*(K.blunt?.40:.31),gs0=.40,gs1=.96;
  const glassZone=(x,s)=>!disc&&x>gx0&&x<gx1&&s>gs0&&s<gs1;
  const rimZone=(x,s)=>!disc&&x>gx0-.09&&x<gx1+.09&&s>gs0-.07&&s<gs1+.04&&!glassZone(x,s);
  const stripeZone=(x,s)=>s>.02&&s<.2&&x>-lenM*.40&&x<lenM*.18;
  plnLoft(m,{st:S,sides:48,mat:M,sq:disc?0:flat?.9:.2,
    col:(t,s,p)=>{
      const x=p[0];
      if(s<-.42)return belly;
      if(glassZone(x,s))return plnMix3(glass,sky,.55*plnSmooth(.55,.96,s)*plnSmooth(gx0,gx0+.5,x));
      if(rimZone(x,s))return rim;
      if(stripeZone(x,s))return accent;
      return plnMul(paint,(Math.abs(((x+9)%1.15)-.575)>.54?.80:1)*(1-.06*plnSmooth(.2,-.4,s))*(1+.08*plnSmooth(.3,.9,s)));
    },
    x:(t,s,p)=>s<-.42?.1:glassZone(p[0],s)?1:shine});
  /* ── крылья и плоскости схемы: пластины по многоугольникам обвода, по обе стороны, с лёгким
     поперечным V; у иксокрыла плоскости наклонены к земле и от неё ── */
  const wings=h.wings||[];
  wings.forEach((poly,wi)=>{
    const pts=poly.map(q=>[(q[0]-D.xc)*D.sc,-q[1]*D.sc*1.25]);
    let zr=1e9;for(const q of pts)if(Math.abs(q[1])<Math.abs(zr))zr=q[1];
    const cx=pts.reduce((a,q)=>a+q[0],0)/pts.length,thick=Math.max(.05,lenM*.008);
    const yb=form==="xwing"?(wi%2?bellyY+ryH*.5:bellyY+ryH*1.4):bellyY+ryH*(form==="delta"?.6:1.0)+D.lift(cx);
    const roll=form==="xwing"?(wi%2?-.48:.48):.10;
    for(const sg of [-1,1])
      plnShipPlate(m,pts.map(q=>[q[0],q[1]*sg]),(x,z)=>yb+(Math.abs(z)-Math.abs(zr))*roll,thick,plnMul(paint,1.04),plnMul(paint,.84),M,shine);
  });
  /* ── гондолы и сопла ── */
  const eng=h.eng&&h.eng.length?h.eng:[{x:h.tail,y:0,r:Math.max(1.6,(h.tailW||3)*.8)}];
  for(const n of (h.nacs||[])){
    const x=(n.x-D.xc)*D.sc,l=n.l*D.sc,r=Math.max(.16,n.r*D.sc*.85),z=n.y*D.sc*1.25,y=bellyY+D.ry(x)*.6+D.lift(x);
    for(const sg of [-1,1]){
      plnTube(m,{path:[[x+l*.5,y,z*sg],[x,y,z*sg],[x-l*.5,y,z*sg]],rad:t=>r*(1-.25*Math.abs(t-.5)),sides:12,
        col:t=>plnMix3(steel,iron,.3+.5*t),mat:M,x:.5,cap:true});
      /* пилон: пластина от борта к гондоле */
      const yi=bellyY+D.ry(x)*.95+D.lift(x),zi=D.rz(x)*.6*sg,half=Math.hypot(y-yi,z*sg-zi)/2+.08;
      plnBlob(m,{c:[x,(y+yi)/2,(z*sg+zi)/2],r:[l*.2,.05,half],box:.5,sub:1,pitch:-Math.atan2(yi-y,zi-z*sg),col:plnMul(paint,.9),mat:M,x:shine});
    }
  }
  const E=[];
  for(const e of eng){
    const x=(e.x-D.xc)*D.sc,r=Math.min(Math.max(.16,e.r*D.sc*1.35),D.ry(D.tail)*1.15+.1),z=e.y*D.sc*1.25,xm=Math.max(x,D.tail),y=bellyY+D.ry(xm)*(form==="xwing"?.6:.72)+D.lift(xm);
    plnTube(m,{path:[[x+r*.9,y,z],[x+r*.1,y,z],[x-r*.75,y,z]],rad:t=>r*lerp(.78,1.05,t),sides:14,col:t=>plnMix3(steel,iron,t),mat:M,x:.55,cap:true});
    /* тёмный зев и тлеющее кольцо холостого хода */
    plnBlob(m,{c:[x-r*.76,y,z],r:[.02,r*.8,r*.8],sub:1,col:[.004,.005,.006],mat:M,x:.05});
    plnBlob(m,{c:[x-r*.8,y,z],r:[.015,r*.5,r*.5],sub:1,col:[1,.42,.16],mat:PLN_MAT.glow,glow:.35});
    E.push({x:x-r*.8,y,z,r});
  }
  D.eng=E;
  /* ── приметы класса: контейнеры, радиаторы, плавник, тарелка, купол диска ── */
  const topY=x=>bellyY+D.ry(x)*1.78+D.lift(x);
  if((h.mark&&h.mark.cont)||form==="boxed"||form==="slab"){
    const rows=form==="boxed"?2:1,bx=lenM*.075,bh=Math.max(.26,lenM*.042),bz=Math.min(D.rz(0)*.5,lenM*.08);
    for(let rw=0;rw<rows;rw++)for(let i=0;i<3;i++){
      const x=-lenM*.26+i*lenM*.21;
      plnBlob(m,{c:[x,topY(x)+bh*(.3+rw*1.95),0],r:[bx,bh,bz],box:.5,sub:1,col:u=>u[1]>.5?plnMul(foil,1.1):plnMix3(foil,dark,.55),mat:M,x:.25});
    }
  }
  if(K.rad)for(const sg of [-1,1]){
    const x=-lenM*.22;
    plnBlob(m,{c:[x,topY(x)+D.ry(x)*.22,sg*D.rz(x)*.64],r:[lenM*.10,D.ry(x)*.32,.03],box:.5,sub:1,col:u=>Math.abs(u[2])>.5?radm:plnMul(radm,1.6),mat:M,x:.15});
  }
  if(K.fin){
    const x=-lenM*.40;
    plnBlob(m,{c:[x,topY(x)+D.ry(x)*.42,0],r:[lenM*.085,D.ry(x)*.5,.035],box:.4,sub:1,lean:-.38,col:u=>u[1]>.55?accent:paint,mat:M,x:shine});
  }
  if(K.dish){
    const x=lenM*.08,y=topY(x);
    plnTube(m,{path:[[x,y-.1,0],[x,y+.55,0]],rad:.035,sides:6,col:iron,mat:M,x:.4});
    plnBlob(m,{c:[x,y+.62,0],r:[.34,.07,.34],sub:1,lean:.5,col:u=>u[1]>0?plnMul(cer,1.05):plnMul(cer,.7),mat:M,x:.25});
  }
  if(disc)plnBlob(m,{c:[lenM*.04,topY(0)-.12,0],r:[lenM*.2,D.ry(0)*.9,lenM*.2],sub:2,col:u=>u[1]>.15?glass:paint,mat:M,x:u=>u[1]>.15?1:shine});
  /* ── люк на ближнем борту: воротник, тёмная рама, освещённый проём (к полу теплее и ярче, как в
     комнате) и трап до того места, где его ждёт земля (21pf rampX/rampZ) ── */
  const hy=bellyY+ryH*.78,zc=-rzH,fz=zc-.08,fr=plnMul(paint,.84);
  for(const q of [[hx-.60,hy,.09,.84],[hx+.60,hy,.09,.84],[hx,hy+.80,.66,.08]])
    plnBlob(m,{c:[q[0],q[1],fz],r:[q[2],q[3],.24],box:.5,sub:1,col:fr,mat:M,x:shine});
  plnCard(m,[hx-.51,hy-.72,zc-.30],[hx+.51,hy-.72,zc-.30],[hx+.51,hy+.74,zc-.30],[hx-.51,hy+.74,zc-.30],[0,0,-1],dark,M,null,0,.2);
  {
    const NX=6,NY=10,ids=[];
    for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){
      const u=i/NX,v=j/NY,jamb=.62+.38*Math.sin(u*Math.PI),room=lerp(3.1,.95,Math.pow(v,.8));
      ids.push(plnVert(m,[lerp(hx-.39,hx+.39,u),lerp(hy-.64,hy+.66,v),zc-.31],[0,0,-1],[1,lerp(.54,.40,v),lerp(.22,.12,v)],PLN_MAT.glow,0,room*jamb,0));
    }
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i;plnQuad(m,ids[a],ids[a+1],ids[a+NX+2],ids[a+NX+1]);}
  }
  {
    const y0=hy-.66,z0=zc-.32,y1=.05,z1=-4.26,half=Math.hypot(y0-y1,z0-z1)/2;
    plnBlob(m,{c:[hx,(y0+y1)/2,(z0+z1)/2],r:[.56,.05,half],box:.35,sub:2,pitch:-Math.atan2(y0-y1,z0-z1),col:steel,mat:M,x:.3});
  }
  D.lamp=[hx,hy-.1,zc-1.1];
  /* маяк на корме и мачта */
  const bx=-lenM*.36;
  plnBlob(m,{c:[bx,topY(bx)+.12,0],r:[.07,.07,.07],sub:1,col:[1,.12,.08],mat:PLN_MAT.glow,glow:5});
  const ax=lenM*.1;
  plnBlob(m,{c:[ax,topY(ax)-.02,0],r:[.42,.08,.42],sub:1,col:paint,mat:M,x:shine});
  plnTube(m,{path:[[ax,topY(ax),0],[ax,topY(ax)+.9,0]],rad:.025,sides:5,col:dark,mat:M});
  return m;
}
/* опоры: нос и две главные, каждая на свой грунт; g — выпуск 0…1, sq — просадка 0…1,
   feet — высота грунта под каждой пятой (м, от нуля тела) */
function plnShipLegs(m,h,D,g,sq,feet){
  const M=PLN_MAT.man,c=plnShipRgb,steel=c(h.steel||[118,124,132]),dark=c(h.dark),paint=c(h.col);
  const {lenM,bellyY}=D,k=lenM/9,rzT=D.rz(-lenM*.26);
  const hips=[[lenM*.34,bellyY+.08,0],[-lenM*.26,bellyY+.08,-rzT*.72],[-lenM*.26,bellyY+.08,rzT*.72]];
  const ends=[[lenM*.40,0,0],[-lenM*.33,0,-(rzT*.72+.95)],[-lenM*.33,0,rzT*.72+.95]];
  hips.forEach((hip,i)=>{
    const fy=(feet&&feet[i]!=null?feet[i]:0)+.12;
    const fold=[hip[0]-.55*k,hip[1]-.28*k,hip[2]];
    const foot=[lerp(fold[0],ends[i][0],g),lerp(fold[1],fy,g),lerp(fold[2],ends[i][2],g)];
    const knee=[lerp(hip[0],foot[0],.45),lerp(hip[1],foot[1],.42)+.06*k,lerp(hip[2],foot[2],.7)];
    plnTube(m,{path:[hip,knee,foot],rad:t=>lerp(.17,.11,t)*k,sides:8,col:t=>plnMix3(dark,steel,t),mat:M,x:.5,cap:true});
    plnTube(m,{path:[[hip[0]-.7*k,hip[1]+.12,hip[2]*.85],knee],rad:.07*k,sides:6,col:dark,mat:M,x:.4});
    if(g>.5)plnBlob(m,{c:[foot[0],foot[1]-.06,foot[2]],r:[.42*k,.08,.42*k],sub:1,col:u=>u[1]>.5?paint:dark,mat:M,x:.2});
  });
}
/* факелы по тяге: конус колец за каждым соплом, вдоль −x */
function plnShipFx(m,D,thr,t){
  const R=7,S=10,glow=PLN_MAT.glow;
  for(const e of D.eng){
    const len=e.r*(5+2*thr)*thr,fl=.9+.1*Math.sin(t*.9+e.z*3);
    const rings=[];
    for(let k=0;k<R;k++){
      const u=k/(R-1),rad=e.r*(1-u)*(.95-.35*u)*Math.min(1,u*6+.25)*fl,x=e.x-u*len*fl,ring=[];
      const col=u<.3?[1,.95,.72]:u<.65?[1,.6,.22]:[.9,.26,.08],gl=(u<.3?8:u<.65?4:1.4)*thr;
      for(let s=0;s<S;s++){const a=s/S*TAU,cy=Math.cos(a),sz=Math.sin(a);ring.push(plnVert(m,[x,e.y+cy*rad,e.z+sz*rad],[-.4,cy*.8,sz*.8],col,glow,0,gl,0));}
      rings.push(ring);
    }
    for(let k=0;k+1<R;k++)for(let s=0;s<S;s++){const s2=(s+1)%S;plnQuad(m,rings[k][s],rings[k][s2],rings[k+1][s2],rings[k+1][s]);}
  }
}
/* сетки этого корпуса и этого поколения устройства */
function plnShip(){
  const Q=PLN_SHIP,h=plnShipHull(),key=(G.shipId||"-")+"!"+(h.by||"")+"!"+h.len;
  if(Q.gen===PLN_GPU.gen&&Q.key===key)return Q;
  if(Q.gen===PLN_GPU.gen){plnGeoFree(Q.geo);plnGeoFree(Q.legs);plnGeoFree(Q.fx);}
  Q.gen=PLN_GPU.gen;Q.key=key;Q.hull=h;Q.legKey="";
  Q.D=plnShipDims(h);
  Q.geo=plnGeo(plnMeshDone(plnShipMesh(h,Q.D)));
  const C=PLN_SHIP_CAP;
  Q.legs=plnGeo({v:new Float32Array(C.legV*PLN_VS),i:new Uint32Array(C.legI),nv:C.legV,ni:C.legI});Q.legs.n=0;
  Q.fx=plnGeo({v:new Float32Array(C.fxV*PLN_VS),i:new Uint32Array(C.fxI),nv:C.fxV,ni:C.fxI});Q.fx.n=0;
  Q.inst=plnInst(Q.a,0,1);
  return Q;
}
function plnShipWrite(geo,m){
  const d=GPU.dev.queue;
  if(m.nv)d.writeBuffer(geo.vb,0,m.v,0,Math.min(m.nv,geo.nv)*PLN_VS);
  if(m.ni)d.writeBuffer(geo.ib,0,m.i,0,Math.min(m.ni,geo.ib.size/4|0));
  geo.n=Math.min(m.ni,geo.ib.size/4|0);
}
/* Корабль в кадре. pos — место тела (грунт под ним), yaw — поворот; o: {L — земля (для
   опор), gear 0…1, sq 0…1, thr 0…1 тяга, hot}. Кладёт тело, опоры, факелы, лампу люка и
   пятно тени */
function plnShipFrame(F,pos,yaw,o){
  const Q=plnShip(),D=Q.D,B=PLN_KIND.body,c=Math.cos(yaw),s=Math.sin(yaw);
  o=o||{};
  const g=o.gear==null?1:clamp(o.gear,0,1),sq=clamp(o.sq||0,0,1),thr=clamp(o.thr||0,0,1);
  const at=(x,y,z)=>[pos[0]+x*c+z*s,pos[1]+y,pos[2]-x*s+z*c];
  /* опоры: грунт под каждой пятой — по земле, если она есть */
  const feet=[],L=o.L,rzT=D.rz(-D.lenM*.26);
  for(const q of [[D.lenM*.40,0],[-D.lenM*.33,-(rzT*.72+.95)],[-D.lenM*.33,rzT*.72+.95]]){
    const w=at(q[0],0,q[1]);
    feet.push(L&&typeof plnLandRibAt==="function"?clamp(plnLandRibAt(L,w[0],w[2])-pos[1],-1.2,1.2):0);
  }
  const drop=.32*sq;
  const lk=g.toFixed(2)+"|"+sq.toFixed(2)+"|"+feet.map(v=>v.toFixed(2)).join(",");
  if(lk!==Q.legKey){
    const m=plnMesh(PLN_SHIP_CAP.legV);
    plnShipLegs(m,Q.hull,D,g,sq,feet.map(v=>v+drop));
    plnShipWrite(Q.legs,m);Q.legKey=lk;
  }
  plnRec(Q.a,0,[pos[0],pos[1]-drop,pos[2]],1,yaw,1,2);
  plnInstSet(Q.inst,Q.a,1);
  F.batches.push({geo:Q.geo,inst:Q.inst,kind:B,to:PLN_TO.all});
  if(Q.legs.n)F.batches.push({geo:Q.legs,inst:Q.inst,kind:B,to:PLN_TO.all});
  if(thr>.02){
    const m=plnMesh(PLN_SHIP_CAP.fxV);
    plnShipFx(m,D,thr,G.t*.1);
    plnShipWrite(Q.fx,m);
    F.batches.push({geo:Q.fx,inst:Q.inst,kind:B,to:PLN_TO.main|PLN_TO.mirror});
    const e=D.eng[0],w=at(e.x-e.r*2,e.y-drop,e.z);
    F.lamps.push({p:w,r:D.lenM*1.3,c:[1,.6,.26],k:3*thr});
  }
  const lp=D.lamp,w=at(lp[0],lp[1]-drop,lp[2]);
  Q.lamp=w;
  F.lamps.push({p:w,r:7.5,c:[1,.6,.28],k:2.6});
  const b=F.blobs;let n=b[0]|0;
  if(n<64){b.set([pos[0],pos[2],D.lenM*.58,.55],4+n*4);n++;b[0]=n;}
}
