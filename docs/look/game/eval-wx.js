(function(){
  var S=G.surf,C=PLN.cam,st=PLN.stat||{},U=PLN.sun||{},r=function(a){return a&&Array.prototype.map.call(a,function(v){return +(+v).toFixed(3);});};
  var p=S&&S.p,w=p&&p.wx;
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,old:PLN_OVER.old,log:(PLN.log||[]).slice(0,6),
    stat:{wx:st.wx,cpu:st.cpu,tris:st.tris,calls:st.calls},
    wx:{kind:w&&w.kind,power:p?+weatherPower(p).toFixed(2):null,look:U.wx&&{kind:U.wx.kind,wp:U.wx.wp,cover:U.wx.cover,fog:U.wx.fog},
      on:PLN_WX.on,drawn:PLN_WX.drawn,wet:+PLN_WX.wet.toFixed(2),wind:+WIND.toFixed(2)},
    man:{x:Math.round(S.x),y:Math.round(S.y),face:S.face},
    cam:C&&{ex:+C.ex.toFixed(2),ey:+C.ey.toFixed(2),D:+C.D.toFixed(2),hw:+C.hw.toFixed(2)},
    sun:{night:U.night,air:U.air,dir:r(U.dir),key:r(U.key)},
    extra:window.__EXTRA||null};
})()
