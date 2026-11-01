/* Индивидуальные головы жителей на штатном теле игрового рига.
   Исходные слитые рукава/полы одежды нельзя безопасно переносить в игровые позы. */
const NPC_ART_DATA={},NPC_ART_CACHE=new Map();
function npcArtRead(id){
  let q=NPC_ART_CACHE.get(id);if(q)return q;
  const d=NPC_ART_DATA[id];if(!d)return null;
  q=artSkinRead(d);if(NPC_ART_CACHE.size>=12)NPC_ART_CACHE.delete(NPC_ART_CACHE.keys().next().value);
  NPC_ART_CACHE.set(id,q);return q;
}
/* Руки и шея читают тот же цвет кожи, что импортированное лицо. */
function npcArtSkin(id){
  const q=npcArtRead(id);if(q.skin)return q.skin;
  const c=[0,0,0];let n=0;
  for(let j=0;j<q.n;j++)if(q.code[j]===R3P.skin){for(let k=0;k<3;k++)c[k]+=q.c[j*3+k];n++;}
  q.skin=c.map(v=>{const x=v/Math.max(1,n);return Math.round(255*(x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055));});
  return q.skin;
}
function* npcArtHeadGen(K,m,hc,hs,rx){
  const q=npcArtRead(m.npc),base=q.b[2],origin=[base[0],base[1]+.10,base[2]],scale=1.12;
  const eye=[[0,0,0,0],[0,0,0,0]],mouth=[0,0,0,0];
  const pos=j=>[(q.p[j*3]-origin[0])*scale,(q.p[j*3+1]-origin[1])*scale,(q.p[j*3+2]-origin[2])*scale];
  const world=p=>[hc[0]+p[0]*hs,hc[1]+(p[1]*Math.cos(rx)-p[2]*Math.sin(rx))*hs,hc[2]+(p[1]*Math.sin(rx)+p[2]*Math.cos(rx))*hs];
  for(let j=0;j<q.n;j++){
    const code=q.code[j],p=world(pos(j)),dst=code===12?eye[q.p[j*3]<0?1:0]:code===19?mouth:null;
    if(dst){for(let k=0;k<3;k++)dst[k]+=p[k];dst[3]++;}
  }
  for(const p of [...eye,mouth])if(p[3])for(let k=0;k<3;k++)p[k]/=p[3];
  const mats={};
  for(let i=0;i<q.ix.length;i++){
    const j=q.ix[i],a=j*3,code=q.code[j];
    if(!mats[code])mats[code]=K.mt([255,255,255],code===12?.35:code===4?.65:code===9?.1:.08,code===12?16:4,code===19?R3P.skin:code);
    K.part=code===12?(q.p[a]<0?7:6):code===19?(q.p[a+1]>base[1]+.07?10:11):1;
    K.vx(pos(j),q.no.subarray(a,a+3),mats[code],q.c.subarray(a,a+3));
    if(i&&i%768===0)yield;
  }
  return {artFace:{eye,mouth}};
}
function npcArtRig(F,base,Mh,M,X){
  if(!X)return;
  const put=(part,c,sx,sy,dy)=>{const A=[sx,0,0,0,0,sy,0,0,0,0,1,0,c[0]*(1-sx),c[1]*(1-sy)+dy,0,1];F.set(r3Mul(Mh,A,r3Scr()),(base+part)*16);};
  const R=M.artFace,blink=clamp(X.bl||0,0,1);
  for(let k=0;k<2;k++)if(R.eye[k][3])put(6+k,R.eye[k],1,1-blink*.15,0);
  if(R.mouth[3]){const sm=X.sm||0,mo=X.mo||0;put(10,R.mouth,1+sm*.04,1,sm*.001);put(11,R.mouth,1+sm*.04,1,-mo*.004);}
}
