/* orb pipelines by family (17gab GOR_WGSL cut by gorCode, 17gab1): for gor0…gor8 — WGSL size, what the family's
   branch of surf() holds (calls of fbm/warp/vor/crat/n3, loops), and the wall time of a FRESH
   createRenderPipelineAsync (a unique comment defeats the driver's blob cache), one after another, each capped at
   60 s. Also: how many times the fragment calls surf() — every call inlines the whole branch */
(async()=>{
  const d=GPU.dev;if(!d)return {err:"нет видеокарты"};
  const S=GOR_WGSL,a=S.indexOf("fn surf("),b=S.indexOf("fn rx(");
  const cnt=(s,re)=>(s.match(re)||[]).length;
  const tail=S.slice(b);
  const out={ua:navigator.userAgent.replace(/.*(HeadlessChrome|Chrome)\/([\d.]+).*/,"$1 $2"),
    surfCallsOutside:cnt(S.slice(0,a)+tail,/\bsurf\(/g),wholeKB:+(S.length/1024).toFixed(1),rows:[]};
  for(let f=0;f<9;f++){
    GOR_CODE[f]=null;const code=gorCode(f),body=code.slice(code.indexOf("fn surf("),code.indexOf("fn rx("));
    const row={f,kb:+(code.length/1024).toFixed(1),surfKB:+(body.length/1024).toFixed(1),
      fbm:cnt(body,/\bfbm\(/g),warp:cnt(body,/\bwarp\(/g),vor:cnt(body,/\bvor\(/g),crat:cnt(body,/\bcrat\(/g),n3:cnt(body,/\bn3\(/g),
      loops:cnt(body,/\bfor \(/g),cloud:cnt(body,/\bcloudJ\(/g)};
    const fresh=code+"\n// lab "+Date.now()+" "+f+"\n";
    const t0=performance.now();
    const mod=d.createShaderModule({code:fresh});
    const info=await mod.getCompilationInfo();row.errs=info.messages.filter(m=>m.type==="error").length;
    row.modMs=Math.round(performance.now()-t0);
    const desc=gpuPipeDesc(fresh,"over");
    const t1=performance.now();
    const r=await Promise.race([d.createRenderPipelineAsync(desc).then(()=>"ok",e=>"err "+(e&&e.message||"").slice(0,80)),
      new Promise(z=>setTimeout(()=>z("timeout"),60000))]);
    row.pipeMs=Math.round(performance.now()-t1);row.r=r;
    out.rows.push(row);
  }
  return out;
})()
