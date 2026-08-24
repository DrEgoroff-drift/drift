# Карта с фронтом пиратов: занятые системы обведены штрихами.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  // фронт: очаг с ветвями разной плотности вокруг стартового угла
  G.occ={};
  var put=[[3,2,1],[4,2,2],[4,3,3],[5,3,2],[3,4,1],[5,1,1],[2,5,2],[6,4,3],[-3,-2,1],[-4,-3,2]];
  put.forEach(function(p){ if(starAt(p[0],p[1])) occSet(p[0],p[1],p[2]); });
  G.freed=4;
  G.mode="map";
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\map.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
