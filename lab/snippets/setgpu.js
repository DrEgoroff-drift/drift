/* what the settlement's engine bodies cost the GPU (Контроль 22.10): one page, A/B/A — bodies on, plnSetFrame
   muted, on again — 3 s each of g11GpuMs (per-pass GPU ms per frame, timestamp queries) plus queue submits per
   frame and the number of plnRec records plnSetFrame adds a frame. «in» — frames where the settlement passed
   the view test (plnSetFrame went past its early returns) */
(async()=>{
  if(!GPU.tsOk)return {err:"нет timestamp-query"};
  const q=GPU.dev.queue,sub0=q.submit;let subs=0;q.submit=function(){subs++;return sub0.apply(this,arguments);};
  const F0=plnSetFrame,R0=plnRec;let recs=0,inn=0,inF=false;
  const on=()=>{plnSetFrame=function(){inF=true;const n0=recs;try{return F0.apply(this,arguments);}finally{inF=false;if(recs>n0)inn++;}};};
  const off=()=>{plnSetFrame=function(){};};
  plnRec=function(){if(inF)recs++;return R0.apply(this,arguments);};
  const phase=async nm=>{subs=0;recs=0;inn=0;const f0=GPU.frameNo;const g=await g11GpuMs(3);const fr=Math.max(1,GPU.frameNo-f0);
    const top=Object.entries(g||{}).filter(([k])=>k!=="sum").sort((a,b)=>b[1].pf-a[1].pf).slice(0,8).map(([k,v])=>[k,v.pf]);
    return {nm,frames:fr,gpuSum:g&&g.sum.pf,gpuFrame:g&&g.frame&&g.frame.pf,subsPerFrame:+(subs/fr).toFixed(2),recsPerFrame:+(recs/fr).toFixed(1),inShare:+(inn/fr).toFixed(2),top};};
  const out=[];
  try{on();out.push(await phase("on"));off();out.push(await phase("off"));on();out.push(await phase("on2"));}
  finally{plnSetFrame=F0;plnRec=R0;q.submit=sub0;}
  return {mode:G.mode,W:innerWidth,dpr:devicePixelRatio,settleHere:!!settleHere(),out};
})()
