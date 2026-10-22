new Promise(res=>{const P=CanvasRenderingContext2D.prototype,keep=[],by={},own={};let calls=0,frames=0,cpB=0,cpN=0;
const caller=()=>{const L=(new Error().stack||"").split("\n").slice(3,12);
  for(const l of L){const m=l.trim().match(/^at ([\w$.]+) \(/);if(m&&!/^(Object\.|Array\.|new |CanvasRenderingContext2D|withScale|gc)/.test(m[1]))return m[1];}return "?";};
for(const n of Object.getOwnPropertyNames(P)){const d=Object.getOwnPropertyDescriptor(P,n);if(!d||typeof d.value!=="function"||n==="constructor")continue;
  const o=d.value;keep.push([n,o]);
  P[n]=function(){calls++;const c=this.canvas,k=(c&&c.id)||(c?"("+c.width+"×"+c.height+")":"?");by[k]=(by[k]||0)+1;
    if((calls&15)===0){const f=caller(),kk=k+" ← "+f;own[kk]=(own[kk]||0)+16;}return o.apply(this,arguments);};}
const Q=GPUQueue.prototype,oc=Q.copyExternalImageToTexture;
Q.copyExternalImageToTexture=function(src,dst,sz){const w=sz.width||sz[0]||0,h=sz.height||sz[1]||1;cpB+=w*h*4;cpN++;
  const s=src&&src.source,k="→GPU "+((s&&s.id)||(s?"("+s.width+"×"+s.height+")":"?"))+" ← "+caller();own[k]=(own[k]||0)+1;return oc.apply(this,arguments);};
const fb=globalThis.frameBody;globalThis.frameBody=function(){frames++;return fb.apply(this,arguments);};
setTimeout(()=>{for(const [n,o] of keep)P[n]=o;Q.copyExternalImageToTexture=oc;globalThis.frameBody=fb;const F=Math.max(1,frames);
  res({mode:G.mode,frames,per:+(calls/F).toFixed(1),copyMBper:+(cpB/F/1e6).toFixed(3),copiesPer:+(cpN/F).toFixed(2),
    canvases:Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+" "+(v/F).toFixed(1)),
    owners:Object.entries(own).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>(v/F).toFixed(1)+" "+k)});},3000);})
