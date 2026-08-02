# Настоящий экран ШТАБ (не стенд): панель со своей шириной, комната внутри неё.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true; G.credits=250000;
  G.mgrs=[];
  ["cmd","keep","fact"].forEach(function(r,n){
    var m=genMgr(1000+n*7717,[r]); m.tMs=Date.now(); m.xp=140; G.mgrs.push(m);
  });
  G.mgrs[0].loy=28;
  G.mgrs[2].route=["3,4","5,1","6,7","2,9"];
  G.crew=[];
  for(var k=0;k<7;k++)G.crew.push({id:"c"+k,shipId:k<4?"scout":null,order:k<4?{kind:"run"}:null});
  G.drones=[{},{},{},{},{}]; G.bases={a:1,b:1,c:1};
  openHq();
},1200);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\stand-hq2.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
