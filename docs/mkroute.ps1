# Карта с маршрутом фактора: плечи, борт на линии, подпись лучшего плеча.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true; G.credits=1e6; G.mgrs=[];
  hireMgr(genMgr(4242,["fact"]));
  var m=mgrOf("fact");
  var found=[];
  for(var dx=-4;dx<=4&&found.length<4;dx++)for(var dy=-4;dy<=4&&found.length<4;dy++){
    if(!starAt(dx,dy))continue; var s=getSystem(dx,dy); if(s.station)found.push(s);
  }
  found.forEach(function(s){mgrRouteVisit(s);});
  m.perks.push("leg"); m.xp=MGR_XP[5];
  found.forEach(function(s){mgrRouteVisit(s);});
  mgrToggleRule(m,"run");
  G.mode="map";
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\route.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
