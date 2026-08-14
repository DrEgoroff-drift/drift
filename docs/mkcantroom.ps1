# Кантины пяти типов станций в одном листе.
#
# mkcant.ps1 открывает живой экран и годится, чтобы потыкать; здесь другое —
# пять залов рядом, чтобы видеть их РАЗНИЦУ. «Кантина одна на всю галактику»
# была записана в очередь ещё до того, как зал стал комнатой, и проверять эту
# запись нужно глазами, а не по коду.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  var types=["trade","indust","yard","sci","outpost"];
  var W2=980,RH=230,H2=RH*types.length,dpr=2;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+W2+"px;height:"+H2+"px";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle="#05070a";c.fillRect(0,0,W2,H2);
  // берём живую систему со станцией — кантине нужны G.sys и G.st
  var found=null;
  for(var dx=-6;dx<=6&&!found;dx++)for(var dy=-6;dy<=6&&!found;dy++){
    if(!starAt(dx,dy))continue; var s=getSystem(dx,dy); if(s.station)found=s;
  }
  G.sx=found.sx;G.sy=found.sy;G.sys=found;G.credits=1e6;
  openStation();
  var list=stationMgrs(G.sys), deals=stationDeals(G.sys);
  types.forEach(function(t,n){
    G.st.stype=t;
    var sub=document.createElement("canvas");
    sub.width=W2*dpr;sub.height=(RH-16)*dpr;
    var sc=sub.getContext("2d");sc.setTransform(dpr,0,0,dpr,0,0);
    drawCantinaRoom({width:W2,height:RH-16,getContext:function(){return sc;}},list,null,null,deals);
    c.drawImage(sub,0,n*RH+14,W2,RH-16);
    c.fillStyle="#8fa6b4";c.font="11px ui-monospace,monospace";c.textAlign="left";
    c.fillText(stTypeOf(t).ru.toUpperCase(),8,n*RH+11);
  });
  try{fetch("/cantina-types.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "cantroom.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
