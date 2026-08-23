# Стенд шахты: ствол с лестницей, два штрека и человек у забоя.
#
# Собирается из tests.html, а не из drift.html: посадка на планету делается
# landOnTestPlanet() из каркаса тестов — в самой игре такой двери нет и не надо.
#
# Шахту нельзя судить по случайному кадру: почти всё в ней — свет, а свет
# зависит от того, где стоит человек. Стенд ставит его в одно и то же место
# при одной и той же выработке, поэтому два захода можно сравнить.
# Кадр складывается в docs/shots/mine.png (сервер пишет POST-ом; без него
# просто откройте docs/mine.html и снимите экран).
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\tests.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  resetWorld();landOnTestPlanet();enterDig();
  var D=G.dig;
  /* ствол на 26 клеток и два штрека: пересечение, тупик и забой под резаком */
  for(var row=1;row<=26;row++)
    D.cells["0,"+row]={dug:true,res:null,amount:0,prog:0,hard:0,tint:.3,ladder:true};
  [[1,6],[2,6],[3,6],[-1,12],[-2,12],[-3,12],[-4,12],[1,19],[2,19],[3,19],[4,19],[2,20]]
    .forEach(function(c){D.cells[c[0]+","+c[1]]=
      {dug:true,res:null,amount:0,prog:0,hard:0,tint:.5};});
  D.row=19;D.col=2;D.target=digCell(D,3,19);
  drawDig();
  var cv=document.getElementById("c");
  try{fetch("/mine.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\mine.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
