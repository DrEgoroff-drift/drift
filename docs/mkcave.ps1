# Cave stand: surface with the landed ship, then the cave under it. Two shots.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var q=location.search.match(/p=(\d+)/),pi=q?+q[1]:0;
  var ps=G.sys.planets.filter(function(x){return x.type!=="gas";});
  var p=ps[pi%ps.length]||G.sys.planets[0];
  var sh=location.search.match(/ship=(\w+)/);if(sh)G.shipId=sh[1];
  startLanding(p);
  G.land.x=G.land.tr.padX;G.land.y=groundAt(G.land.tr,G.land.x)-11;G.land.ok=true;
  enterSurface();
  G.surf.x=G.surf.shipX+90;G.surf.y=groundAt(G.surf.tr,G.surf.x)-10;
  var cv=document.getElementById("c");
  function shot(n){try{fetch("/"+n+".png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}}
  setTimeout(function(){
    for(var f=0;f<6;f++)frame(performance.now()+f*16);
    shot("surf");
    if(location.search.indexOf("cave")>=0){
      enterCave();G.cave.x=400;
      for(var f=0;f<6;f++)frame(performance.now()+f*16);
      shot("cave");
    }
  },900);
},1200);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "cave.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
