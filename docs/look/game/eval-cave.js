(function(){
  var C=G.cave,M=CAVE3,L=M.lens,Q=CAVE3_GPU,r=function(v){return +(+v).toFixed(3);};
  var share=null;
  if(L&&C){share=r(1.8/L.Hf);}
  return {on:M.on,live:M.live,bad:M.bad,err:M.err,pln:PLN.err,mode:G.mode,
    stat:M.stat,gpu:Q.stat,ms:Q.ms,shn:Q.shn,qual:PLN_GPU.qual,
    man:C&&{x:Math.round(C.x),y:Math.round(C.y),cy:Math.round(C.cy),on:C.on,face:C.face},
    lens:L&&{k:r(L.k),Hf:r(L.Hf),w:r(L.w),D:r(L.D),f:r(L.f),eye:L.eye.map(r)},share:share,
    viewK:r(G.viewK),lazy:(typeof GPU_PIPES==="object"&&GPU_PIPES.lazy)?GPU_PIPES.lazy.filter(function(k){return /cave3/.test(k);}).length:null,
    extra:window.__EXTRA||null};
})()
