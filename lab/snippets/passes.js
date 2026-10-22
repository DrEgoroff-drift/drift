new Promise(res=>{const E=GPUCommandEncoder.prototype,o=E.beginRenderPass,oc=E.beginComputePass,out={};let fr=0;
const st=()=>(new Error().stack||"").split("\n").slice(3,6).map(l=>l.trim().replace(/^at /,"").replace(/ \(.*:(\d+):\d+\)$/," :$1")).join(" < ");
E.beginRenderPass=function(d){const ca=d.colorAttachments||[];const k="R "+(d.label||"")+" c"+ca.length+(d.depthStencilAttachment?"+d":"")+(ca[0]&&ca[0].resolveTarget?" msaa":"")+" ← "+st();out[k]=(out[k]||0)+1;return o.apply(this,arguments);};
E.beginComputePass=function(d){const k="C "+(d&&d.label||"")+" ← "+st();out[k]=(out[k]||0)+1;return oc.apply(this,arguments);};
const t0=performance.now();(function f(){fr++;if(performance.now()-t0<3000)requestAnimationFrame(f);else{E.beginRenderPass=o;E.beginComputePass=oc;
  res({mode:G.mode,tab:typeof tab!=="undefined"?tab:"",walk:!!(HALL&&HALL.walk),frames:fr,perFrame:Object.entries(out).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(v/fr).toFixed(2)+" "+k).slice(0,16)});}})();})
