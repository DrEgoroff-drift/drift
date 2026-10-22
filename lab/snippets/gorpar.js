/* orb pipelines under contention: (1) the whole GOR_WGSL (gorCode's fallback when the branches do not split —
   all nine families inlined), alone; (2) all nine families started at once, as a cold warm-up does; each fresh
   (unique comment), capped at 120 s */
(async()=>{
  const d=GPU.dev;if(!d)return {err:"нет видеокарты"};
  const cap=p=>Promise.race([p.then(()=>"ok",e=>"err "+(e&&e.message||"").slice(0,60)),new Promise(z=>setTimeout(()=>z("timeout"),120000))]);
  const fresh=(c,t)=>c+"\n// lab "+Date.now()+" "+t+"\n";
  let t=performance.now();const whole=await cap(d.createRenderPipelineAsync(gpuPipeDesc(fresh(GOR_WGSL,"w"),"over")));
  const wholeMs=Math.round(performance.now()-t);
  t=performance.now();const each=[];
  await Promise.all([...Array(9).keys()].map(f=>{GOR_CODE[f]=null;const t0=performance.now();
    return cap(d.createRenderPipelineAsync(gpuPipeDesc(fresh(gorCode(f),"p"+f),"over"))).then(r=>each[f]=[f,Math.round(performance.now()-t0),r]);}));
  return {wholeMs,whole,parallelMs:Math.round(performance.now()-t),each};
})()
