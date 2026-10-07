(function(){
  var S=G.surf,st=PLN.stat||{};
  var sps=(faunaOf(S.p)||[]).map(function(s){return {name:s.name,alien:s.alien,shape:s.shape,legs:s.legs,r0:+s.r0.toFixed(1),hop:s.hop,herd:s.herd,timid:s.timid,tail:s.tail,crest:s.crest,ears:s.ears,hover:Math.round(s.hover||0),glow:s.glow};});
  var list=(S.fauna||[]).filter(function(b){return b&&!b.caught;}).map(function(b){return {x:Math.round(b.x),dx:Math.round(b.x-S.x),r:+b.r.toFixed(1),alien:b.alien,shape:b.shape,vx:+(b.vx||0).toFixed(2),face:b.face,age:+(b.age||0).toFixed(2),scanned:!!b.scanned,shy:+(b.shy||0).toFixed(2),stun:+(b.stunT||0).toFixed(1),sp:Math.max(0,sps.length?faunaOf(S.p).indexOf(b.sp):-1)};});
  list.sort(function(a,b){return Math.abs(a.dx)-Math.abs(b.dx);});
  return {on:PLN.on,bad:PLN.bad,err:PLN.err,over:PLN_OVER.err,
    stat:{beasts:st.beasts,tris:st.tris,calls:st.calls},
    man:{x:Math.round(S.x),face:S.face},glide:PLN.glide,viewK:+(G.viewK||0).toFixed(3),
    species:sps,beasts:list.slice(0,16),n:list.length,extra:window.__EXTRA||null};
})()
