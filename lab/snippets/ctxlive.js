/* who draws 2D, and where: every CanvasRenderingContext2D method is wrapped for 4 s of the steady scene. A call
   on MAIN_CTX (#c, copied to the GPU) is live, on any other context a bake. Calls are split three ways: «краска» —
   the eight methods that dirty #c for gpuFrontHook (08c: fill, stroke, fillRect, strokeRect, drawImage, fillText,
   strokeText, putImageData), «мерка» — measureText, «состояние» — the rest (paths, transforms, save/restore).
   The caller is the stack frame above the wrapper: a function name, or page:line for an anonymous one */
new Promise(res=>{
  const P=CanvasRenderingContext2D.prototype,keep={},R={live:{},bake:{}};
  const PAINT=new Set(["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]);
  const cat=k=>PAINT.has(k)?"краска":k==="measureText"?"мерка":"состояние";
  const lim=Error.stackTraceLimit;Error.stackTraceLimit=5;
  const who=()=>{const l=((new Error().stack||"").split("\n")[4]||"").trim().replace(/^at (async )?/,"");
    const nm=l.split(" (")[0].replace(/^Object\./,"");
    if(!nm||/^file:|^\w+:\/\//.test(nm)||nm==="<anonymous>"){const m=l.match(/:(\d+):\d+\)?$/);return "@"+(m?m[1]:"?");}
    return nm;};
  const put=(where,k)=>{const M=R[where],f=who(),c=cat(k),e=M[f]||(M[f]={"краска":0,"мерка":0,"состояние":0});e[c]++;};
  for(const k of Object.getOwnPropertyNames(P)){const d=Object.getOwnPropertyDescriptor(P,k);
    if(!d||typeof d.value!=="function"||k==="constructor")continue;keep[k]=d.value;
    P[k]=function(){put(this===MAIN_CTX?"live":"bake",k);return keep[k].apply(this,arguments);};}
  /* gpuFrontHook (08c) puts its own methods on MAIN_CTX holding the old prototype ones — wrap those too */
  const own={};for(const k of Object.keys(MAIN_CTX)){const o=MAIN_CTX[k];if(typeof o!=="function")continue;own[k]=o;
    MAIN_CTX[k]=function(){put("live",k);return o.apply(this,arguments);};}
  let frames=0;const fr=()=>{frames++;if(on)requestAnimationFrame(fr);};let on=true;requestAnimationFrame(fr);
  setTimeout(()=>{on=false;for(const k in keep)P[k]=keep[k];for(const k in own)MAIN_CTX[k]=own[k];Error.stackTraceLimit=lim;
    const top=M=>Object.entries(M).sort((a,b)=>(b[1]["краска"]-a[1]["краска"])||(b[1]["состояние"]-a[1]["состояние"])).slice(0,40);
    res({mode:G.mode,cState:GPU.cState,frames,live:top(R.live),bake:top(R.bake)});},4000);
})
