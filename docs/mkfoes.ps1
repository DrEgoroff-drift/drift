# Лист противников абордажа: типы и барон рядом, крупно.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var list=[["grunt",0],["rusher",0],["heavy",0],["boss",0],["boss",1]];
  var CELL=200,W2=CELL*list.length,H2=260,dpr=2;
  var cv=document.createElement("canvas");
  cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W2+"px;height:"+H2+"px;z-index:99999;background:#0c0f14";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  var old=ctx;ctx=c;
  list.forEach(function(p,n){
    var K=FOE_KINDS[p[0]];
    var f={kind:p[0],baron:!!p[1],boss:p[0]==="boss",aware:n%2===0,bob:n};
    c.save();
    c.strokeStyle="rgba(120,150,175,.12)";c.strokeRect(n*CELL+.5,.5,CELL-1,H2-1);
    c.translate(n*CELL+CELL/2,H2/2+40);c.scale(4,4);
    drawFoeBody(f,K);
    c.restore();
    c.font="10px ui-monospace,monospace";c.textAlign="center";
    c.fillStyle=p[1]?"#ffb478":"#cfe3ea";
    c.fillText(p[1]?"БАРОН":K.ru.toUpperCase(),n*CELL+CELL/2,H2-16);
  });
  ctx=old;
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\foes.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
