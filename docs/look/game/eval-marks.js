/* the question of landmarks: what the page found, what it built, the lens, errors */
(function(){
  var S=G.surf||{},tr=S.tr||{},st=PLN.stat||{},C=PLN.cam;
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,extra:window.__EXTRA||null,
    marks:st.marks||null,
    poi:(tr.poi||[]).map(function(q){return {k:q.k,x:Math.round(q.x),h:Math.round(q.h),sc:+(q.sc||1).toFixed(2)};}),
    man:{x:Math.round(S.x||0),glide:+(PLN.glide||0).toFixed(2),at:plnAtThing(S,S.p)},
    cam:C&&{ex:+C.ex.toFixed(2),D:+C.D.toFixed(2),hw:+C.hw.toFixed(2)},
    stat:{cpu:st.cpu,tris:st.tris,calls:st.calls},
    errors:(window.__ERRORS||[]).slice(0,5),log:(window.__LOG||[]).slice(-5)};
})()
