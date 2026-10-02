(function(){
  var S=G.surf,C=PLN.cam,st=PLN.stat||{};
  var deps=(S.deposits||[]).filter(function(d){return d.left>0;}).map(function(d){return {res:d.res,kind:depKind(d.res),x:Math.round(d.x),left:d.left,prog:+(d.prog||0).toFixed(2)};});
  deps.sort(function(a,b){return Math.abs(a.x-S.x)-Math.abs(b.x-S.x);});
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,old:PLN_OVER.old,
    stat:{things:st.things,cpu:st.cpu,tris:st.tris,calls:st.calls},
    man:{x:Math.round(S.x),face:S.face,on:S.on},mining:S.mining?{res:S.mining.res,prog:+(S.mining.prog||0).toFixed(2)}:null,
    tracks:(S.tracks||[]).length,at:plnAtThing(S,S.p),walk:+(S.walkAmp||0).toFixed(2),plant:(function(){var b=1e9;for(var i=0;i<(S.plants||[]).length;i++)b=Math.min(b,Math.abs(S.plants[i].x-S.x));return Math.round(b);})(),near:PLN.near,glide:PLN.glide,viewK:+(G.viewK||0).toFixed(3),
    prompt:String(G.prompt||"").slice(0,80),
    cam:C&&{ex:+C.ex.toFixed(2),D:+C.D.toFixed(2),hw:+C.hw.toFixed(2)},
    deps:deps.slice(0,14),extra:window.__EXTRA||null};
})()
