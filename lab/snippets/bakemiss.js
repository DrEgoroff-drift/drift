/* what a bake-cache miss costs the frame (Контроль 22.10): for each bake of the scene — lifeAstroBake (LG_BK),
   hullGpuBake (HG_BAKE), fleetArtOf (FLEET_ART), pirateArtOf (PIR_ART), raidFoeSprite (RAID_FOE_BK) — 40 frames of
   baseline, then the cache is emptied and 40 frames more. Per bake: calls per frame, the frame that took the miss
   (max frame after the clear against the baseline p50/max), ms inside the bake in that frame and in all, how many
   calls missed (> 0.3 ms), PB_SYNC (prebake forced whole in-frame). A bake the scene never calls is skipped */
(async()=>{
  const raf=()=>new Promise(r=>requestAnimationFrame(r));
  const B=[
    ["lifeAstroBake",()=>{for(const b of LG_BK.values())lifeBakeDrop(b);LG_BK.clear();}],
    ["hullGpuBake",()=>{HG_BAKE.get=()=>undefined;return ()=>{delete HG_BAKE.get;};}],
    ["fleetArtOf",()=>{for(const k in FLEET_ART)delete FLEET_ART[k];}],
    ["pirateArtOf",()=>{for(const k in PIR_ART)delete PIR_ART[k];}],
    ["raidFoeSprite",()=>{for(const b of RAID_FOE_BK.values())gpuBakeDrop(b);RAID_FOE_BK.clear();}]];
  const rows=[];
  for(const [nm,clear] of B){
    if(typeof globalThis[nm]!=="function"){rows.push({nm,skip:"нет функции"});continue;}
    const orig=globalThis[nm];let calls=0,ms=0,miss=0,cur=null;
    globalThis[nm]=function(){const t=performance.now();try{return orig.apply(this,arguments);}finally{const d=performance.now()-t;calls++;ms+=d;if(d>.3)miss++;if(cur)cur.ms+=d;}};
    try{
      const F=[];let last=await raf();
      for(let i=0;i<40;i++){const t=await raf();F.push(t-last);last=t;}
      const c0=calls;if(!c0){rows.push({nm,skip:"сцена не зовёт"});continue;}
      const s=F.slice().sort((a,b)=>a-b),p50=s[20],bmax=s[39];
      calls=0;ms=0;miss=0;const sy0=PB_SYNC;const undo=clear();
      const A=[];last=await raf();
      for(let i=0;i<40;i++){cur={ms:0};const c=cur;const t=await raf();A.push([t-last,c.ms]);last=t;}
      cur=null;if(typeof undo==="function")undo();
      const w=A.reduce((m,x)=>x[0]>m[0]?x:m,[0,0]);
      rows.push({nm,perFrame:+(c0/40).toFixed(1),base:[+p50.toFixed(1),+bmax.toFixed(1)],missFrame:+w[0].toFixed(1),inBake:+w[1].toFixed(1),
        bakeMsAll:+ms.toFixed(1),missed:miss,over33:A.filter(x=>x[0]>33.4).length,pbSync:PB_SYNC-sy0});
    }finally{globalThis[nm]=orig;}
  }
  return {mode:G.mode,W:innerWidth,dpr:devicePixelRatio,rows};
})()
