/* what the live 2D (#c) costs a frame (Контроль 22.10 (б)): 6 s of the steady scene; per frame — ms inside MAIN_CTX
   calls (the 08c hooks on the instance and the prototype methods called on it), ms and count of gpuFrontCopy that
   really uploaded #c, ms inside settleDraw/settleDrawBody, the frame's JS (FRAME_JS) and its period. Means and p95 */
new Promise(res=>{
  const P=CanvasRenderingContext2D.prototype,keep={},own={},wr={};let cur=null,depth=0;
  const tm=(o,k,bucket)=>function(){if(depth||!cur)return o.apply(this,arguments);depth++;const t=performance.now();
    try{return o.apply(this,arguments);}finally{depth--;cur[bucket]+=performance.now()-t;}};
  for(const k of Object.getOwnPropertyNames(P)){const d=Object.getOwnPropertyDescriptor(P,k);
    if(!d||typeof d.value!=="function"||k==="constructor")continue;keep[k]=d.value;const w=tm(d.value,k,"ctx");
    P[k]=function(){return this===MAIN_CTX?w.apply(this,arguments):keep[k].apply(this,arguments);};}
  for(const k of Object.keys(MAIN_CTX)){const o=MAIN_CTX[k];if(typeof o!=="function")continue;own[k]=o;MAIN_CTX[k]=tm(o,k,"ctx");}
  for(const nm of ["gpuFrontCopy","settleDraw","settleDrawBody"]){if(typeof globalThis[nm]!=="function")continue;const o=globalThis[nm];wr[nm]=o;
    const b=nm==="gpuFrontCopy"?"up":"settle";
    globalThis[nm]=function(){if(!cur)return o.apply(this,arguments);const t=performance.now(),cl=nm==="gpuFrontCopy"&&!GPU.cState;
      const d0=depth;depth=0;try{return o.apply(this,arguments);}finally{depth=d0;cur[b]+=performance.now()-t;if(nm==="gpuFrontCopy"&&!cl)cur.ups++;}};}
  const F=[];let last=0,on=true;
  const fr=t=>{if(cur){cur.dt=last?t-last:0;cur.js=typeof FRAME_JS==="number"?FRAME_JS:0;F.push(cur);}last=t;
    cur=on?{ctx:0,up:0,ups:0,settle:0,dt:0,js:0}:null;if(on)requestAnimationFrame(fr);};
  requestAnimationFrame(fr);
  setTimeout(()=>{on=false;cur=null;for(const k in keep)P[k]=keep[k];for(const k in own)MAIN_CTX[k]=own[k];for(const k in wr)globalThis[k]=wr[k];
    const st=k=>{const v=F.slice(1).map(f=>f[k]).sort((a,b)=>a-b);if(!v.length)return [0,0];
      return [+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),+v[Math.floor(v.length*.95)].toFixed(2)];};
    res({mode:G.mode,frames:F.length,ctxMs:st("ctx"),uploadMs:st("up"),uploadsPerFrame:st("ups")[0],settleMs:st("settle"),
      frameJs:st("js"),period:st("dt"),settle:typeof settleHere==="function"?!!settleHere():null});},6000);
});
