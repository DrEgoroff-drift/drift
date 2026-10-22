new Promise(res=>{const D=GPUDevice.prototype,Q=GPUQueue.prototype,log=[],keep={},qk={};
const sz=d=>{const s=d.size||[];const w=s.width||s[0]||0,h=s.height||s[1]||1,l=s.depthOrArrayLayers||s[2]||1;return w*h*l;};
for(const n of ["createTexture","createBuffer","createBindGroup","createRenderPipeline","createRenderPipelineAsync","createComputePipeline","createComputePipelineAsync","createShaderModule"]){
  const o=D[n];keep[n]=o;D[n]=function(d){const t=performance.now(),r=o.apply(this,arguments);log.push([n,n==="createTexture"?sz(d)*4:n==="createBuffer"?d.size:0,performance.now()-t]);return r;};}
for(const n of ["writeBuffer","writeTexture","submit"]){const o=Q[n];qk[n]=o;Q[n]=function(){const a=arguments;
  const b=n==="writeBuffer"?((a[4]!=null?a[4]*(a[2].BYTES_PER_ELEMENT||1):a[2].byteLength)||0):n==="writeTexture"?((a[3].width||a[3][0]||0)*(a[3].height||a[3][1]||1)*4):0;
  log.push([n,b,0]);return o.apply(this,a);};}
const fr=[];let lt=0,t0=performance.now();
(function f(t){if(lt)fr.push([+(t-t0).toFixed(0),+(t-lt).toFixed(1),FRAME_JS|0]);lt=t;if(t-t0<3000)requestAnimationFrame(f);})(t0);
const ta=performance.now();(0,eval)(__ACT);const act=performance.now()-ta;
setTimeout(()=>{for(const n in keep)D[n]=keep[n];for(const n in qk)Q[n]=qk[n];
  const by={};for(const [n,b,ms] of log){const e=by[n]||(by[n]=[0,0,0]);e[0]++;e[1]+=b;e[2]+=ms;}
  for(const k in by)by[k]=by[k][0]+" шт · "+(by[k][1]/1e6).toFixed(2)+" МБ · "+by[k][2].toFixed(0)+" мс";
  res({act:+act.toFixed(1),mode:G.mode,worst:fr.slice().sort((a,b)=>b[1]-a[1]).slice(0,5),by});},3100);})
