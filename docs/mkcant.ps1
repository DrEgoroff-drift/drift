$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true; G.credits=1e6;
  var found=null;
  for(var dx=-6;dx<=6&&!found;dx++)for(var dy=-6;dy<=6&&!found;dy++){
    if(!starAt(dx,dy))continue; var s=getSystem(dx,dy); if(s.station)found=s;
  }
  G.sx=found.sx;G.sy=found.sy;G.sys=found;
  openStation();
  tab="cantina"; syncTabs(); renderTab();
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\cant.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
