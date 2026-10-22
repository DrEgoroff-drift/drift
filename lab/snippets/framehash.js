/* a frame to compare two builds pixel for pixel: in one synchronous task the scene is pinned — seed, game clock,
   then 90 frames of frameBody on an even 60 Hz step (the rAF loop cannot interleave) — and the GPU frame
   (gpuSnapshot) is read back into 2D. Returns SHA-256 of the pixels and a 16×9 grid of cell sums, so two builds can
   be told apart by numbers; run it twice on one build first (A/A) — wall-clock budgets inside the frame may move.
   The station hall paints its own WebGPU canvas (#stHall, z −2, its own rAF loop, not in GPU_SNAP_OVER) and the
   game snapshot is opaque over it, so the hall is one more layer, hashed on its own after one hallFrame in this task */
(async()=>{
  /* under probe --pin: wait until the pinned frames are all run (a short timeout stays on the real clock) */
  for(let k=0;window.__PIN&&__PIN.n<__PIN.max&&k<3000;k++)await new Promise(r=>setTimeout(r,10));
  const sh0=typeof stateHash==="function"?stateHash():0,pin=window.__PIN?__PIN.n:-1;
  rndSeed(7);clockSet(1.7e12);
  /* the real clock is pinned too (blinks, hall lights, wall budgets read wallMs): a virtual one, one frame per step */
  const W0=wallMs,N0=wallNow,P0=performance.now;let vt=1e6;
  wallMs=()=>vt;wallNow=()=>1.7e12+vt;performance.now=()=>vt;
  const loop0=LOOP_OFF;LOOP_OFF=false;const t0=vt;
  /* the WebGPU canvas cannot be read after present: the last frame takes the snapshot in its own task (08b wantSnap) */
  try{for(let i=0;i<90;i++){clockAdvance(16.667);vt+=16.667;if(i===89)GPU.wantSnap=true;frameBody(t0+i*16.667);}}finally{LOOP_OFF=true;}
  const s=GPU.snapNo===GPU.frameNo&&GPU.snap?GPU.snap:null;if(!s){wallMs=W0;wallNow=N0;performance.now=P0;return {err:"снимок не снят",mode:G.mode};}
  const L=[["game",s]];
  if(typeof HALL!=="undefined"&&HALL.open&&HALL.cn&&HALL.cn.isConnected){hallFrame();L.push(["hall",HALL.cn]);}
  /* panels paint their own canvases (portraits, the home still): every visible one besides the frame, tiled into one */
  const D=[...document.querySelectorAll("canvas")].filter(c=>!["c","g","stHall"].includes(c.id)&&c.width&&c.height&&c.offsetWidth&&getComputedStyle(c).visibility!=="hidden");
  if(D.length){const tw=D.reduce((m,c)=>m+c.width,0),th=Math.max(...D.map(c=>c.height)),t=document.createElement("canvas");t.width=tw;t.height=th;
    const tg=t.getContext("2d");let x=0;for(const c of D){tg.drawImage(c,x,0);x+=c.width;}t.__n=D.length;L.push(["dom",t]);}
  const out={mode:G.mode,sh0,pin,sh1:typeof stateHash==="function"?stateHash():0};
  for(const [nm,src] of L){
    const c=document.createElement("canvas");c.width=src.width;c.height=src.height;
    const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(src,0,0);
    const px=g.getImageData(0,0,c.width,c.height).data;
    const h=[...new Uint8Array(await crypto.subtle.digest("SHA-256",px))].slice(0,8).map(b=>b.toString(16).padStart(2,"0")).join("");
    const gx=16,gy=9,cw=Math.floor(c.width/gx),ch=Math.floor(c.height/gy),cells=[];
    for(let j=0;j<gy;j++)for(let i=0;i<gx;i++){let sum=0;
      for(let y=j*ch;y<(j+1)*ch;y+=2)for(let x=i*cw;x<(i+1)*cw;x+=2){const k=4*(y*c.width+x);sum+=px[k]+px[k+1]+px[k+2];}
      cells.push(sum);}
    out[nm]={w:c.width,h:c.height,n:src.__n||1,hash:h,cells};
  }
  wallMs=W0;wallNow=N0;performance.now=P0;LOOP_OFF=loop0;
  return out;
})()
