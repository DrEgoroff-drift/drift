(function(){
  var S=G.surf,C=PLN.cam,st=PLN.stat||{},U=PLN.sun||{},r=function(a){return a&&Array.prototype.map.call(a,function(v){return +(+v).toFixed(3);});};
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,old:PLN_OVER.old,
    stat:{beasts:st.beasts,herbs:st.herbs,things:st.things,cpu:st.cpu,tris:st.tris,draws:st.draws},
    man:{x:Math.round(S.x),y:Math.round(S.y),face:S.face,swim:S.swim||0},
    prompt:String(G.prompt||"").slice(0,80),
    cam:C&&{ex:+C.ex.toFixed(2),ey:+C.ey.toFixed(2),D:+C.D.toFixed(2),hw:+C.hw.toFixed(2)},
    sun:{night:U.night,air:U.air,ecl:U.ecl,dir:r(U.dir),key:U.u&&r(U.u.key)},extra:window.__EXTRA||null};
})()
