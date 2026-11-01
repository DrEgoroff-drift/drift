/* Сто моделей жителей из авторской библиотеки. Цвет линейный; исходные GLB
   и текстуры не нужны при запуске. Лица закреплены за прежними id. */
const NPC_ART_DATA={},NPC_ART_CACHE=new Map();
function npcArtRead(id){
  let q=NPC_ART_CACHE.get(id);if(q)return q;
  const d=NPC_ART_DATA[id];if(!d)return null;
  q=artSkinRead(d);if(NPC_ART_CACHE.size>=12)NPC_ART_CACHE.delete(NPC_ART_CACHE.keys().next().value);
  NPC_ART_CACHE.set(id,q);return q;
}
function* npcArtBody(m,lod,poseK){
  const q=npcArtRead(m.npc),J=cpPose(poseK),g=cpGene(m),pel=[0,J.pel,0],ln=J.lean||0;
  const rot=(x,y,z)=>[x,J.pel+y*Math.cos(ln)-z*Math.sin(ln),y*Math.sin(ln)+z*Math.cos(ln)];
  const neck=rot(0,.60,0),head=rot(0,.755,.02),sh=[rot(.205,.458,-.005),rot(-.205,.458,-.005)];
  const T=[pel,rot(0,.24,0),neck],end=[T[1],neck,rot(0,.80,0)],arms=[];
  for(let k=0;k<2;k++){
    const s=k?-1:1,kn=k&&J.kneeR?J.kneeR:J.knee,an=k&&J.ankR?J.ankR:J.ank;
    T[3+k*3]=[s*.095,J.pel-.03,0];T[4+k*3]=[s*kn[0],kn[1],kn[2]];T[5+k*3]=[s*an[0],an[1],an[2]];
    end[3+k*3]=T[4+k*3];end[4+k*3]=T[5+k*3];end[5+k*3]=[s*an[0],an[1]-.03,an[2]+.14];
    const E=J.elb[k],W=J.wr[k],f=W.map((x,i)=>x-E[i]),l=Math.hypot(...f)||1;
    for(let i=0;i<3;i++)f[i]/=l;
    T[9+k*2]=sh[k];end[9+k*2]=E;T[10+k*2]=E;end[10+k*2]=W;
    arms.push({S:sh[k],E,W,f});
  }
  const mat=q.b.map((b,k)=>artSkinSegment(b.slice(0,3),b.slice(3),T[k],end[k]));
  yield;
  const posed=artSkinPose(q,mat),v=new Float32Array(q.ix.length*12),weights=new Float32Array(4);
  const eye=[[0,0,0,0],[0,0,0,0]],mouth=[0,0,0,0];
  for(let j=0;j<q.n;j++){const a=j*3,c=q.code[j];let dst=null;
    if(c===12)dst=eye[q.p[a]<0?1:0];
    else if(c===19&&Math.abs(q.p[a])<.07&&q.p[a+2]>.04)dst=mouth;
    if(dst){for(let k=0;k<3;k++)dst[k]+=posed.p[a+k];dst[3]++;}
  }
  for(const p of [...eye,mouth])if(p[3])for(let k=0;k<3;k++)p[k]/=p[3];
  for(let i=0;i<q.ix.length;i++){
    const j=q.ix[i],a=j*3,b=i*12;v.set(posed.p.subarray(a,a+3),b);v.set(posed.no.subarray(a,a+3),b+3);v.set(q.c.subarray(a,a+3),b+6);
    weights.fill(0);for(let k=0;k<4;k++){const bone=q.j[j*4+k],part=bone===2?1:bone===9||bone===10?2:bone===11||bone===12?3:0;weights[part]+=q.w[j*4+k];}
    let first=0,second=0;for(let k=1;k<4;k++)if(weights[k]>weights[first])first=k;
    second=first===0?1:0;for(let k=0;k<4;k++)if(k!==first&&weights[k]>weights[second])second=k;
    const w=weights[second]/Math.max(1e-6,weights[first]+weights[second]);
    const code=q.code[j],pattern=code===19?R3P.skin:code;
    let face=-1;
    if(code===12)face=q.p[a]<0?7:6;
    else if(code===19&&Math.abs(q.p[a])<.07&&q.p[a+2]>.04)face=posed.p[a+1]>=mouth[1]?10:11;
    v[b+9]=code===12?12.6:code===4?12.5:code===8||code===19?3.16:3.08;v[b+10]=0;
    v[b+11]=face>=0?face+16*pattern:first+16*pattern+(w>.002?2048*second+32768*Math.round(w*255):0);
    if(i&&i%768===0)yield;
  }
  return {v,n:q.ix.length,buf:null,dev:null,g,artFace:{eye,mouth},at:{neck,head,top:rot(0,.94,0),sh,arms,pel,
    hand:arms.map(a=>a.W.map((x,i)=>x+a.f[i]*.07)),hold:J.hold||0,seat:!!J.seat,hp:[head,-ln*.6,1]}};
}
/* Глаза и губы едут существующими матрицами лица — без новой загрузки сетки
   на каждый вздох. Голова и взгляд остаются у штатного рига. */
function npcArtRig(F,base,Mh,M,X){
  if(!X)return;
  const put=(part,c,sx,sy,dy)=>{const A=[sx,0,0,0,0,sy,0,0,0,0,1,0,c[0]*(1-sx),c[1]*(1-sy)+dy,0,1];F.set(r3Mul(Mh,A,r3Scr()),(base+part)*16);};
  const R=M.artFace,blink=clamp(X.bl||0,0,1);
  for(let k=0;k<2;k++)if(R.eye[k][3])put(6+k,R.eye[k],1,1-blink*.92,0);
  if(R.mouth[3]){const sm=X.sm||0,mo=X.mo||0;put(10,R.mouth,1+sm*.07,1,sm*.001);put(11,R.mouth,1+sm*.07,1,-mo*.009);}
}
