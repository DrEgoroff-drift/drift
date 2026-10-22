new Promise(res=>{const D=GPUDevice.prototype,keep={},out=[];
for(const n of ["createRenderPipeline","createComputePipeline"]){const o=D[n];keep[n]=o;D[n]=function(d){const t=performance.now(),r=o.apply(this,arguments);
  const st=(new Error().stack||"").split("\n").slice(2,5).map(l=>l.trim().replace(/^at /,"").replace(/ \(.*:(\d+):\d+\)$/," :$1")).join(" < ");
  out.push({n,ms:+(performance.now()-t).toFixed(1),label:d&&d.label||"",vs:d&&d.vertex&&d.vertex.entryPoint||"",fmt:d&&d.fragment&&d.fragment.targets&&d.fragment.targets.map(x=>x&&x.format).join("+"),depth:d&&d.depthStencil&&d.depthStencil.format||"",ms4:d&&d.multisample&&d.multisample.count||1,st});return r;};}
const ta=performance.now();enterDig();
setTimeout(()=>{for(const n in keep)D[n]=keep[n];res({n:out.length,list:out});},3000);})
