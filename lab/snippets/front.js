/* who dirties #c: the first 2D call that turns GPU.cState 0 → 1 (that frame then copies the whole #c
   into the front texture, gpuFrontCopy), with its stack; walking right 8 s */
new Promise(res=>{gpuFrontHook();const c=MAIN_CTX,tab={},keep=[];let copies=0,ticks=0;
const st=()=>(new Error().stack||"").split("\n").slice(3,8).map(l=>{l=l.trim().replace(/^at /,"");const u=l.lastIndexOf("/"),k=l.lastIndexOf(":");return l.split(" (")[0]+(u>=0&&k>u?" "+l.slice(u+1,k):"");}).join(" < ");
for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){const o=c[k];keep.push([k,o]);
  c[k]=function(){if(GPU.cState===0){const s=k+" ← "+st();tab[s]=(tab[s]||0)+1;}return o.apply(this,arguments);};}
const q=GPUQueue.prototype,oc=q.copyExternalImageToTexture;q.copyExternalImageToTexture=function(a){if(a&&a.source===cvs)copies++;return oc.apply(this,arguments);};
const fb=globalThis.frameBody;globalThis.frameBody=function(){ticks++;return fb.apply(this,arguments);};
if(G.mode!=="raid")keys.right=true;   /* in a raid a step right leaves it */
setTimeout(()=>{keys.right=false;for(const [k,o] of keep)c[k]=o;q.copyExternalImageToTexture=oc;globalThis.frameBody=fb;
  res({mode:G.mode,ticks,copies,dirtiers:Object.entries(tab).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>v+"×  "+k)});},G.mode==="raid"?2500:8000);})   /* the raid stand falls back to the system in about 4 s */
