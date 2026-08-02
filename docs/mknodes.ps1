$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var pick=[];
  NODE_FAMS.forEach(function(F){
    var fam=NODES.filter(function(n){return n.fam===F.id;});
    ["plain","fine","single","lost","never"].forEach(function(g){
      var n=fam.filter(function(x){return x.grade===g;})[0];
      if(n)pick.push(n);
    });
  });
  pick=pick.slice(0,50);
  var COLS=10,CELL=104,ROWS=Math.ceil(pick.length/COLS),dpr=2;
  var cv=document.createElement("canvas");
  cv.width=COLS*CELL*dpr;cv.height=ROWS*CELL*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+(COLS*CELL)+"px;height:"+(ROWS*CELL)+
    "px;z-index:99999;background:#0b0e13";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  pick.forEach(function(n,k){
    var x=(k%COLS)*CELL,y=Math.floor(k/COLS)*CELL;
    c.strokeStyle="rgba(120,150,175,.10)";c.strokeRect(x+.5,y+.5,CELL-1,CELL-1);
    c.save();c.translate(x+CELL/2,y+CELL/2-10);
    drawNodeIcon(c,n,58);
    c.restore();
    c.font="8px ui-monospace,monospace";c.textAlign="center";
    c.fillStyle=n.col;c.fillText(n.gradeRu.toUpperCase(),x+CELL/2,y+CELL-20);
    c.fillStyle="#9fb0bd";c.fillText(n.famRu,x+CELL/2,y+CELL-9);
  });
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\nodes.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
