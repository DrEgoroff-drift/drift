# Блошинец рядом с остальными типами станций.
#
# Новый силуэт проверяется не сам по себе, а в ряду: он должен читаться другим с
# первого взгляда и при этом говорить на том же языке — одно тело, один обвод,
# один свет. Рисуется настоящим `drawStation` в двух масштабах.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  var dpr=2, W2=820, H2=470;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
  c.fillText("STATION TYPES: THE BAZAAR MUST READ AS ITS OWN THING",8,18);
  var types=["trade","indust","yard","sci","outpost","fuel","bazaar"];
  var old=ctx;
  var sys=getSystem(0,0);
  G.sys=sys;
  for(var k=0;k<types.length;k++){
    sys.station.stype=types[k];
    sys.station.mods=null;
    var x=60+k*110;
    ctx=c;
    drawStation(x,110,1);
    drawStation(x,215,.55);
    ctx=old;
    c.fillStyle=types[k]==="bazaar"?"#f2b25c":"#5d7382";
    c.font="10px ui-monospace,monospace";c.textAlign="center";
    c.fillText(types[k],x,268);
  }
  sys.station.stype="bazaar";sys.station.mods=[];
  ctx=c;drawStation(150,380,2.6);drawStation(420,380,1.6);ctx=old;
  c.fillStyle="#f2b25c";c.textAlign="left";
  c.fillText("bazaar close up (no modules): 2.6x and 1.6x",8,300);
  try{fetch("/flea.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "flea.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
