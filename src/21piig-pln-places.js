/* ══════════════ планета: три места «и что это было» — тела (plnOverOld, 22.10) ══════════════
   11v (M151): три места на всю игру, поставленные рукой. Ни надписи, ни знака — видно, и всё.
   1. Башня — тонкий столб в двадцать четыре метра (выше любой постройки; кольцо должно быть в кадре),
      наверху литое кольцо, повёрнутое к нам. Тень кладёт движок.
   2. Чаша — каменная тарелка шире экрана на выровненной земле (plnOwnFlat), наклонена к нам: передняя
      кромка по колено, дальняя — в три метра; с линии хода видна внутренняя стенка, к кромке светлая,
      на дне лежит небо. Ровная тарелка с гребня читалась стенкой.
      Врезать в грунт нельзя: линия хода часто идёт гребнем, и всё, что ниже его за линией, не видно.
   3. Лестница — с каменной площадки девять ступеней вниз вдоль хода (+x); последние уходят в землю:
      ведут никуда. Проступь светлее подступёнка.
   Земля выравнивается до посадки (план срезов собирается с первой высотой), место ищется без кадра. */
const PLACE3={it:null,gen:-1,L:null};
const PLACE_V={tower:{z:28,h:24},bowl:{z:14,rx:40,rz:8,rim:[.45,3.2]},stair:{z:3,n:9,run:1,rise:.4,w:2.6,sunk:2}};

/* место и его земля: y — земля без срезов (иначе срез мерил бы сам себя); чаша — над водой ложбины */
function plnPlaceAt(L,tr,p){
  if(typeof placeHere!=="function"||!p)return null;
  const q=placeHere(p);if(!q)return null;
  const x=placeX(tr,p)/PLN_M,V=PLACE_V,f0=L.flat;let y=0;const hs=[];L.flat=null;
  try{
    if(q.k==="bowl"){const B=V.bowl;for(let a=0;a<12;a++)for(const e of [.3,.7,1])hs.push(plnLandRibAt(L,x+Math.cos(a/12*TAU)*B.rx*e,B.z+Math.sin(a/12*TAU)*B.rz*e));
      hs.sort((a,b)=>a-b);y=hs[Math.floor(hs.length*.5)];
      if(L.wet&&L.lift)y=Math.max(y,plnLandTab(L,L.lift,x)+PLN_LAND.wRel+.5);}
    else y=plnLandRibAt(L,x,V[q.k].z);
  }finally{L.flat=f0;}
  return {k:q.k,x,y};
}
function plnPlaceFlat(L){
  const tr=L&&L.tr,p=tr&&tr.p,A=tr&&p?plnPlaceAt(L,tr,p):null;
  return A&&A.k==="bowl"?[[A.x,PLACE_V.bowl.z,PLACE_V.bowl.rx,PLACE_V.bowl.rz,A.y]]:null;
}
function plnPlacePad(tr,p,L){
  const A=L&&tr&&p?plnPlaceAt(L,tr,p):null;if(!A)return null;
  const V=PLACE_V;
  if(A.k==="bowl")return [A.x,V.bowl.z,V.bowl.rx*1.15,V.bowl.rz*1.15,9];
  if(A.k==="stair"){const S=V.stair,len=S.n*S.run;return [A.x+len*.5,S.z,len*.6+1,S.w+1,4];}
  return [A.x,V.tower.z,1.6,1.6,3];
}

function plnPlaceMesh(L,tr,p){
  const A=plnPlaceAt(L,tr,p);if(!A)return null;
  const V=PLACE_V,m=plnMesh(1<<15),K=plnOwnKit(m,null),MAN=PLN_MAT.man,
    base=plnMix3(plnRgb(p.T.pal[2].map(v=>v*.4+30)),plnHex("#a29c8e"),.55),sky=plnRgb(p.T.sky[0]);
  let o,hw;
  if(A.k==="tower"){
    o=[A.x,A.y,V.tower.z];hw=4;
    plnBlob(m,{c:[0,.05,0],r:[.95,.32,.95],sub:2,box:.5,col:plnMul(base,.8),mat:MAN});
    plnTube(m,{path:[[0,-.4,0],[0,V.tower.h,0]],rad:t=>.4-.13*t,sides:10,col:base,mat:MAN,cap:true});
    /* кольцо: литой тор лицом к объективу */
    const R=1.8,cy=V.tower.h+1.9,path=[];
    for(let i=0;i<=40;i++){const a=i/40*TAU;path.push([Math.sin(a)*R,cy-Math.cos(a)*R,0]);}
    plnTube(m,{path,rad:.3,sides:10,col:plnMul(base,.92),mat:MAN,up:[0,0,1]});
  }else if(A.k==="bowl"){
    const B=V.bowl;o=[A.x,A.y,B.z];hw=B.rx*1.15+2;
    /* полярная сетка: e — доля радиуса. Чаша до 1 (дно +0.3, кромка +rim), губа до 1.04, наружный борт
       до 1.12 — к земле и на 30 см в неё */
    const E=[0,.15,.3,.45,.6,.72,.82,.9,.96,1,1.04,1.08,1.12],SEG=72,ids=[],
      dark=plnMix3(plnHex("#14181c"),sky,.32),lip=plnMix3(base,[1,1,1],.12);
    const at=(e,a)=>{const x=Math.cos(a)*B.rx*e,z=Math.sin(a)*B.rz*e,rim=lerp(B.rim[0],B.rim[1],plnSmooth(-1,1,Math.sin(a)));
      const y=e<=1?.3+(rim-.3)*Math.pow(e,2.2):e<=1.04?rim+.06:lerp(rim,plnLandRibAt(L,o[0]+x,o[2]+z)-o[1]-.3,plnSmooth(1.04,1.12,e));
      return [x,y,z];};
    for(let k=0;k<E.length;k++){const row=[],e=E[k];
      for(let s=0;s<SEG;s++){const a=s/SEG*TAU,P=at(e,a),dx=at(e+.01,a),da=at(Math.max(e,.05),a+.02);
        let n=plnNorm(plnCross(plnSub(da,P),plnSub(dx,P)));
        if(e>1.04){if(plnDot(n,[Math.cos(a),0,Math.sin(a)])<0)n=plnMul(n,-1);}else if(n[1]<0)n=plnMul(n,-1);
        if(!e)n=[0,1,0];
        const col=e<1?plnMix3(dark,plnMul(base,.9),plnSmooth(.45,1,e)):e<=1.04?lip:plnMul(base,.82);
        row.push(plnVert(m,P,n,col,MAN,0,0,0));}
      ids.push(row);}
    for(let k=0;k+1<E.length;k++)for(let s=0;s<SEG;s++){const s2=(s+1)%SEG;plnQuad(m,ids[k][s],ids[k][s2],ids[k+1][s2],ids[k+1][s]);}
    /* уступы: три кольца по чаше и валик губы — шире экрана тарелка без них читалась ровной плитой */
    for(const [e,r,c] of [[.5,.07,plnMul(base,.55)],[.72,.07,plnMul(base,.62)],[.88,.07,plnMul(base,.7)],[1.02,.16,lip]]){
      const path=[];for(let s=0;s<=SEG;s++){const P=at(e,s/SEG*TAU);path.push([P[0],P[1]+r*.6,P[2]]);}
      plnTube(m,{path,rad:r,sides:5,col:c,mat:MAN});}
  }else{
    /* площадка и ступени: каждая ступень — блок до земли (и на полметра в неё), сверху светлая плита;
       последние sunk ступеней уходят в землю */
    const S=V.stair,N=S.n,top=(N-S.sunk)*S.rise;o=[A.x,A.y,S.z];hw=N*S.run+4;
    const stone=plnMul(base,.82),hz=S.w/2,gy=xx=>plnLandRibAt(L,o[0]+xx,S.z)-o[1];
    {const g=Math.min(gy(-1),gy(-.2))-.5;
     K.box([-1.1,(g+top)/2,0],[1.1,(top-g)/2,hz+.15],plnMul(stone,.9),{box:.1});
     K.box([-1.1,top-.02,0],[1.12,.05,hz+.18],plnMix3(base,sky,.12),{box:.3});}
    for(let i=0;i<N;i++){
      const x0=i*S.run,y=top-(i+1)*S.rise,g=Math.min(gy(x0),gy(x0+S.run))-.5;
      if(y>g)K.box([x0+S.run/2,(g+y)/2,0],[S.run/2+.01,(y-g)/2,hz],plnMul(stone,1-i*.03),{box:.08});
      K.box([x0+S.run/2,y-.02,-.02],[S.run/2+.02,.05,hz+.03],plnMix3(base,sky,.12),{box:.3});
    }
  }
  return {o,m,hw};
}
function plnPlaceFree(){
  const it=PLACE3.it;if(!it)return;
  if(it.geo)plnGeoFree(it.geo);
  if(it.inst)plnInstFree(it.inst);
  PLACE3.it=null;
}
function plnPlaceStep(L,S){
  if(PLACE3.gen!==PLN_GPU.gen||PLACE3.L!==L){plnPlaceFree();PLACE3.gen=PLN_GPU.gen;PLACE3.L=L;}
  const q=typeof placeHere==="function"?placeHere(S.p):null;
  if(!q){plnPlaceFree();return;}
  const key=S.p.idx+"|"+q.k;
  if(PLACE3.it&&PLACE3.it.key===key)return;
  plnPlaceFree();
  const M=plnPlaceMesh(L,S.tr,S.p);if(!M)return;
  const it={key,o:M.o,hw:M.hw,geo:plnGeo(plnMeshDone(M.m)),a:new Float32Array(16),inst:null};
  plnRec(it.a,0,it.o,1,0,1,0,null);
  it.inst=plnInst(it.a,1,1);
  PLACE3.it=it;
}
function plnPlaceFrame(F,ex,V){
  const it=PLACE3.it;if(!it)return;
  if(Math.abs(it.o[0]-ex)>V.hw*(1+it.o[2]/V.D)+it.hw)return;
  F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:PLN_KIND.body,to:PLN_TO.all});
}
