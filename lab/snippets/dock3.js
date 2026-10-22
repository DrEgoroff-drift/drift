new Promise(res=>{const D=GPUDevice.prototype,keep={};let cnt={};
for(const n of ["createTexture","createBuffer","createBindGroup","createRenderPipeline"]){const o=D[n];keep[n]=o;D[n]=function(){cnt[n]=(cnt[n]||0)+1;return o.apply(this,arguments);};}
let fr=[],lt=0;(function f(t){if(lt)fr.push(+(t-lt).toFixed(1));lt=t;requestAnimationFrame(f);})(performance.now());
const one=()=>{cnt={};fr=[];const t=performance.now();openStation();const act=+(performance.now()-t).toFixed(1);
  return new Promise(r=>setTimeout(()=>r({act,worst:fr.slice().sort((a,b)=>b-a).slice(0,3),made:cnt}),2000));};
(async()=>{const a=await one();closeStation();await new Promise(r=>setTimeout(r,2000));const b=await one();
  for(const n in keep)D[n]=keep[n];res({first:a,second:b});})();})
