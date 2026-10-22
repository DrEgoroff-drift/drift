/* ══════════════ планета: выкладка медленной долины — телами (plnOverOld, 22.10) ══════════════
   Медленный (11o, M143): у места выкладки — колышек, по грунту — фигура из камешков руды, а когда ответ
   созрел, рядом лежит ответ, тусклее. Ничего больше: глазу не видно, что здесь кто-то есть.

   1. Колышек — вещь: дерево, торец светлее (метр с небольшим, как 14 px старого кадра).
   2. Фигура — ряд камней руды с голову, на самой тропе (линия ходьбы — голая земля: в траве камни тонули).
   3. Ответ — тот же ряд ближе к объективу, через тропу: камни меньше, приглушены к земле и наполовину в грунте —
      «тусклее» без прозрачности. Хранится только фигура и номер обмена (11o), тело собирается заново,
      когда меняется то, что видно. */
const SLOW3={it:null,gen:-1,L:null,key:""};

function plnSlowMesh(L,tr,p){
  const S=slowAll(),x=slowSpotX(tr,p)/PLN_M,z=.7,o=[x,plnLandRibAt(L,x,z),z],m=plnMesh(1<<12),MAN=PLN_MAT.man,
    gy=(xx,zz)=>plnLandRibAt(L,xx,zz)-o[1],wood=plnHex("#6e5c42"),cut=plnHex("#e2d6ba"),dirt=plnHex("#3a3026");
  const y0=gy(x,z);
  plnTube(m,{path:[[0,y0-.15,0],[0,y0+1.25,0]],rad:.05,sides:6,col:wood,mat:MAN});
  plnTube(m,{path:[[0,y0+1.25,0],[0,y0+1.3,0]],rad:.05,sides:6,col:cut,mat:MAN,cap:true});
  const row=(arr,dz,sz,dim,sink,sd)=>{for(let i=0;i<arr.length;i++){
    const px=-1.6+i*.5,pz=dz,g=gy(x+px,z+pz),c=plnHex(RES[arr[i]].col),col=dim?plnMix3(c,dirt,dim):c;
    plnBlob(m,{c:[px,g+.06*sz-sink,pz],r:[.16*sz,.11*sz,.14*sz],sub:1,bump:.25,seed:sd+i,col,mat:MAN});}};
  if(S.fig)row(S.fig,-.55,1,0,0,11);
  if(slowReady())row(slowReply(),-1.1,.8,.55,.05,31);
  return {o,m};
}
function plnSlowFree(){
  const it=SLOW3.it;if(!it)return;
  if(it.geo)plnGeoFree(it.geo);
  if(it.inst)plnInstFree(it.inst);
  SLOW3.it=null;
}
function plnSlowStep(L,S){
  if(SLOW3.gen!==PLN_GPU.gen||SLOW3.L!==L){plnSlowFree();SLOW3.gen=PLN_GPU.gen;SLOW3.L=L;}
  if(typeof slowIsCore!=="function"||!slowIsCore(S.p)){plnSlowFree();return;}
  const st=slowAll(),rd=slowReady(),key=[S.p.idx,(st.fig||[]).join(","),rd?slowReply().join(","):"-"].join("|");
  if(SLOW3.it&&SLOW3.it.key===key)return;
  plnSlowFree();
  const M=plnSlowMesh(L,S.tr,S.p);
  const it={key,o:M.o,geo:plnGeo(plnMeshDone(M.m)),a:new Float32Array(16),inst:null};
  plnRec(it.a,0,it.o,1,0,1,0,null);
  it.inst=plnInst(it.a,1,1);
  SLOW3.it=it;
}
function plnSlowFrame(F,ex,V){
  const it=SLOW3.it;if(!it)return;
  if(Math.abs(it.o[0]-ex)>V.hw*(1+it.o[2]/V.D)+3)return;
  F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:PLN_KIND.body,to:PLN_TO.all});
}
