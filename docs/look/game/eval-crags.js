(function(){
  var L=PLN_LAND.cur,F=L.flora,S=G.surf,mx=S.x/PLN_M,out=[],K=plnFloraKit(),tr=S.tr,st=tr.step,N=tr.N,best=[];
  for(var k=0;k<F.crags.length;k++){var c=F.crags[k];if(Math.abs(c[0]-mx)<24)out.push(c.map(function(v){return +v.toFixed(2);}));}
  var th=F.things.filter(function(t){return Math.abs(t[0]-mx)<24;}).map(function(t){return t.map(function(v){return +v.toFixed(1);});});
  /* крутые ступени линии: где, какой высоты, сколько градусов */
  var i=2;
  while(i<N-2){
    var d=Math.abs(tr.h[i+1]-tr.h[i-1])/(2*st);
    if(d>.9){
      var a=i,top=d;
      while(i<N-2){var d2=Math.abs(tr.h[i+1]-tr.h[i-1])/(2*st);if(d2<=.9)break;if(d2>top)top=d2;i++;}
      best.push([Math.round((a+i)/2*st),Math.round(Math.abs(tr.h[i]-tr.h[a-1])),Math.round(Math.atan(top)*180/Math.PI)]);
    }
    i++;
  }
  return {man:+mx.toFixed(1),crags:F.crags.length,near:out,things:th,
    kit:K.ledge.map(function(b){return [+b.top.toFixed(2),+b.rx.toFixed(2),+b.rz.toFixed(2)];}),
    steps:best,errs:PLN.err,stat:{tris:PLN.stat.tris,draws:PLN.stat.draws},extra:window.__EXTRA||null};
})()
