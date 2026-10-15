(function(){
  var M=SECT,L=M.lens,S=G.base,r=function(v){return +(+v).toFixed(3);};
  return {on:M.on,live:M.live,bad:M.bad,err:M.err,pln:PLN.err,log:PLN.log.slice(-6),mode:G.mode,
    stat:M.stat,gpu:CAVE3_GPU.stat,far:r(M.far),
    man:S&&{cur:S.cur,row:S.row,x:Math.round(S.x),y:Math.round(S.y)},
    lens:L&&{Hf:r(L.Hf),w:r(L.w),D:r(L.D),cx:r(L.cx),cy:r(L.cy),l:r(L.l),r:r(L.r),b:r(L.b),t:r(L.t)},
    share:L?r(1.8/L.Hf):null,prompt:G.prompt,errs:(typeof ERRS!=="undefined"&&ERRS.length)||0,extra:window.__EXTRA||null};
})()
