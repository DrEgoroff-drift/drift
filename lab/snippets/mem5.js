new Promise(res=>{const S=300,pts=[],D=GPUDevice.prototype,cnt={},keep={};
for(const n of ["createTexture","createBuffer","createBindGroup"]){const o=D[n];keep[n]=o;D[n]=function(){cnt[n]=(cnt[n]||0)+1;return o.apply(this,arguments);};}
const t0=performance.now();let lo=1e18,fr=0;
(function f(){fr++;if(performance.now()-t0<S*1000)requestAnimationFrame(f);})();
const iv=setInterval(()=>{const m=performance.memory.usedJSHeapSize;lo=Math.min(lo,m);
  const s=Math.round((performance.now()-t0)/1000);
  if(s%30===0||s>=S){pts.push(s+"с "+(m/1e6).toFixed(1)+" (мин "+(lo/1e6).toFixed(1)+")");lo=1e18;}
  if(s>=S){clearInterval(iv);for(const n in keep)D[n]=keep[n];
    res({mode:G.mode,frames:fr,heap:pts,gpuNew:cnt,nodes:document.getElementsByTagName("*").length});}},1000);})
