/* where surfG's garbage comes from (pass 4, 27f2 SG_FREE): 30 s of the hall's background prep in the system, sgArr
   wrapped — calls taken from a slot or fresh (no slot: the free list was empty and SG_MAX live), arrays grown, bytes of
   each; points generated (k=0 → 3n); the free list at the end. Whatever surfG allocates beyond these bytes is not its
   work arrays (the f(u,v) triples inlined into it, the closures) */
new Promise(res=>{
  const o=globalThis.sgArr;if(typeof o!=="function")return res({err:"нет sgArr"});
  const R={calls:0,fresh:0,freshB:0,grow:0,growB:0,pts:0,live0:SG_LIVE,free0:SG_FREE.length};
  globalThis.sgArr=function(k,len,slot){R.calls++;if(k===0)R.pts+=len/3;
    if(!slot){R.fresh++;R.freshB+=4*len;}else{const a=slot[k];if(!a||a.length<len){R.grow++;R.growB+=4*Math.max(len,a?a.length*2:0);}}
    return o.apply(this,arguments);};
  const t0=performance.now();
  const iv=setInterval(()=>{const s=(performance.now()-t0)/1000,ph=Math.floor(s/8)%2;keys.right=!ph;keys.left=!!ph;
    if(s>=30){clearInterval(iv);keys.right=keys.left=false;globalThis.sgArr=o;
      res({mode:G.mode,...R,freshMB:+(R.freshB/1048576).toFixed(1),growMB:+(R.growB/1048576).toFixed(1),ptsM:+(R.pts/1e6).toFixed(2),
        live1:SG_LIVE,free1:SG_FREE.length});}},100);
})
