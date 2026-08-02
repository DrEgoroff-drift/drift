$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var W2=900,H2=260,dpr=2;
  var cv=document.createElement("canvas");
  cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W2+"px;height:"+H2+"px;z-index:99999;background:#080a10";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  var old=ctx;ctx=c;
  var sets=[0,1,3,6,10];
  sets.forEach(function(n,k){
    G.crowns={};
    NODE_FAMS.slice(0,n).forEach(function(F){G.crowns[F.id]=1;});
    c.save();
    c.strokeStyle="rgba(120,150,175,.12)";c.strokeRect(k*180+.5,.5,179,H2-1);
    c.translate(k*180+90,H2/2-10);c.rotate(-Math.PI/2);c.scale(2.6,2.6);
    drawHull(G.shipId,0,0,0,0);
    c.restore();
    c.font="9px ui-monospace,monospace";c.textAlign="center";
    c.fillStyle="#cfe3ea";c.fillText("ВЕНЦОВ "+n,k*180+90,H2-18);
  });
  ctx=old;
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\crown.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
