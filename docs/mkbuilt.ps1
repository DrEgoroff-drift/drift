# Поверхность с вашими постройками: дом и база на горизонте.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  var tr=genTerrain(p);
  G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.bases[G.sx+","+G.sy]={cells:{a:1,b:1,c:1,d:1}};
  G.home={turn:0,tier:8,sx:G.sx,sy:G.sy,made:0,garage:[],showcase:{},trophies:[]};
  // подводим астронавта к дому, чтобы он попал в кадр
  var sp=builtSpot(G.surf.tr,G.surf.p,"home");
  G.surf.x=sp.x-120; G.surf.y=groundAt(G.surf.tr,G.surf.x)-10;
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\built.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
