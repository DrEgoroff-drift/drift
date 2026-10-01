(function(){
  /* the cost of the frame: what g11GpuMs measured (window.__COST, started by cost.py's snippet),
     the CPU side of the planet's frame on the real clock (window.__CPU, the hook of cost.py —
     the game's own wallMs stands still inside a stepped frame) and what was built */
  var st=PLN.stat||{},c=window.__COST||null,Q=typeof PLN_GPU!=="undefined"?PLN_GPU:{};
  return {on:PLN.on,err:PLN.err,tsOk:!!GPU.tsOk,w:innerWidth,h:innerHeight,dpr:devicePixelRatio,
    gpu:c,cpu:window.__CPU||null,
    stat:{cpu:st.cpu,tris:st.tris,calls:st.calls,recs:st.recs,land:st.land,flora:st.flora,kit:st.kit,
      things:st.things,herbs:st.herbs,beasts:st.beasts},
    q:{ms:Q.ms,shn:Q.shn,w:Q.w,h:Q.h,qual:Q.qual}};
})()
