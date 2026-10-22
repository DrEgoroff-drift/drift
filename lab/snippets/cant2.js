new Promise(res=>{const names=["renderTab","renderTabBody","renderCantina","cantinaScene","drawCantinaRoom","cant3dFrame","cantCard","cppPaint","cppFlush","r3Frame","rpgGet","hallOpen","hallScene","syncTabs","stWalletSync","cpMesh","cpBodyGen","cpMeshPump","r3Up","cantPeople","cant3dInit","r3Init"],keep={},out={};
let depth=0;
for(const n of names){const f=globalThis[n];if(typeof f!=="function")continue;keep[n]=f;
  globalThis[n]=function(){const t=performance.now();try{return f.apply(this,arguments);}finally{const d=performance.now()-t;const e=out[n]||(out[n]={n:0,ms:0,max:0});e.n++;e.ms+=d;e.max=Math.max(e.max,d);}};}
const t=performance.now();tab="cantina";syncTabs();renderTab();const act=performance.now()-t;
const a1={};for(const k in out)a1[k]=out[k].n+"×"+out[k].ms.toFixed(1);
for(const k in out)out[k]={n:0,ms:0,max:0};
setTimeout(()=>{for(const n in keep)globalThis[n]=keep[n];
  const a2={};for(const k in out)if(out[k].n)a2[k]=out[k].n+"×"+out[k].ms.toFixed(1)+" (макс "+out[k].max.toFixed(1)+")";
  res({act:+act.toFixed(1),inAct:a1,next2s:a2});},2000);})
