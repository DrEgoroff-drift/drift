new Promise(res=>{const D=GPUDevice.prototype,keep={},ev=[],t0=performance.now(),S=window.__SECS||12;
const st=()=>(new Error().stack||"").split("\n").slice(3,7).map(l=>l.trim().replace(/^at /,"").replace(/ \(.*:(\d+):\d+\)$/," :$1")).join(" < ");
for(const n of ["createRenderPipeline","createComputePipeline","createRenderPipelineAsync","createComputePipelineAsync","createShaderModule","createTexture"]){const o=D[n];keep[n]=o;
  D[n]=function(d){const t=performance.now(),r=o.apply(this,arguments);
    ev.push({t:+(t-t0).toFixed(0),n,ms:+(performance.now()-t).toFixed(1),l:d&&(d.label||(d.size&&JSON.stringify(d.size))||"")||"",s:st()});return r;};}
const fr=[];let lt=0;
const go=window.__GO;if(go)setTimeout(()=>{try{(0,eval)(go);}catch(e){ev.push({t:-1,n:"ERR "+e.message});}},500);
(function f(t){if(lt&&t-lt>50)fr.push([+(lt-t0).toFixed(0),+(t-lt).toFixed(0),G.mode]);lt=t;if(t-t0<S*1000)requestAnimationFrame(f);else{
  for(const n in keep)D[n]=keep[n];
  const near=[];for(const [a,d] of fr)for(const e of ev)if(e.t>=a-300&&e.t<=a+d&&!/Async|Shader|Texture/.test(e.n))near.push(a+"+"+d+": "+e.n+" "+e.ms+" "+e.l+" ← "+e.s);
  const cnt={};for(const e of ev)cnt[e.n]=(cnt[e.n]||0)+1;
  res({mode:G.mode,long:fr,cnt,syncNear:near.slice(0,14),syncAll:ev.filter(e=>/^create(Render|Compute)Pipeline$/.test(e.n)).map(e=>e.t+" "+e.ms+" "+e.s).slice(0,12)});}})(t0);})
