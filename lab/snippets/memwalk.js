/* heap while moving (jank saw +38.8 MB in 23 s of the system walk): 120 s, right 8 s / left 8 s in turn,
   JS heap minimum per 20 s, GPU objects created, and the largest arrays/maps on known globals at the end */
new Promise(res=>{const S=120,pts=[],D=GPUDevice.prototype,cnt={},keep={};
for(const n of ["createTexture","createBuffer","createBindGroup"]){const o=D[n];keep[n]=o;D[n]=function(){cnt[n]=(cnt[n]||0)+1;return o.apply(this,arguments);};}
const t0=performance.now();let lo=1e18,last=-1;
const iv=setInterval(()=>{const s=(performance.now()-t0)/1000,m=performance.memory.usedJSHeapSize;lo=Math.min(lo,m);
  const ph=Math.floor(s/8)%2;keys.right=!ph;keys.left=!!ph;
  const b=Math.floor(s/20);if(b!==last){if(last>=0)pts.push(Math.round(s)+"с мин "+(lo/1e6).toFixed(1)+" МБ");last=b;lo=1e18;}
  if(s>=S){clearInterval(iv);keys.right=keys.left=false;for(const n in keep)D[n]=keep[n];
    const big=[];for(const k of Object.keys(globalThis)){let v;try{v=globalThis[k];}catch(e){continue;}
      if(Array.isArray(v)&&v.length>500)big.push([k,v.length]);else if((v instanceof Map||v instanceof Set)&&v.size>200)big.push([k,v.size]);
      else if(v&&typeof v==="object"&&!Array.isArray(v)&&k===k.toUpperCase())for(const f in v){let w;try{w=v[f];}catch(e){continue;}
        if(Array.isArray(w)&&w.length>500)big.push([k+"."+f,w.length]);else if((w instanceof Map||w instanceof Set)&&w.size>200)big.push([k+"."+f,w.size]);}}
    res({mode:G.mode,heap:pts,gpu:cnt,big:big.sort((a,b)=>b[1]-a[1]).slice(0,12)});}},100);})
