/* the question of landmarks: what the page found, what it built, the lens, errors */
(function(){
  var S=G.surf||{},tr=S.tr||{},st=PLN.stat||{},C=PLN.cam;
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,extra:window.__EXTRA||null,
    marks:st.marks||null,
    poi:(tr.poi||[]).map(function(q){return {k:q.k,x:Math.round(q.x),h:Math.round(q.h),sc:+(q.sc||1).toFixed(2)};}),
    man:{x:Math.round(S.x||0),glide:+(PLN.glide||0).toFixed(2),at:plnAtThing(S,S.p)},
    cam:C&&{ex:+C.ex.toFixed(2),D:+C.D.toFixed(2),hw:+C.hw.toFixed(2)},
    stat:{cpu:st.cpu,tris:st.tris,calls:st.calls},
    act:(function(){
      if(typeof PLN_ACT==="undefined")return null;
      var X=window.__EXTRA,q=X&&X.poi&&(tr.poi||[]).find(function(z){return z.k===X.poi.k;});
      if(!q)return null;
      var K=PLN_ACT.kinds[q.k],m=plnMarkState(q),dr=null,parts={};
      if(K&&m){dr=K.drive(m,PLN_ACT.pinAge!=null?PLN_ACT.pinAge:((G.t-(m.t0||0))/60),K.dims(plnMarkH(q)),0,0);
        for(var id in dr.parts){var o=dr.parts[id],r={};for(var f in o)r[f]=typeof o[f]==="number"?+o[f].toFixed(2):o[f];parts[id]=r;}}
      return {prompt:G.prompt,spot:PLN_ACT.dbg&&PLN_ACT.dbg.spot,st:m&&m.st,way:m&&m.way,n:m&&m.n,got:m&&m.got,
        acts:window.__ACTS||[],pin:PLN_ACT.pinAge,parts:parts};
    })(),
    errors:(window.__ERRORS||[]).slice(0,5),log:(window.__LOG||[]).slice(-5)};
})()
