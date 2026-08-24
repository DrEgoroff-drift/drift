# Крупный план: шесть классов по одному кораблю, 7×.
#
# Лист классов (mkhulls.ps1) отвечает на вопрос «читается ли силуэт», и на нём
# корабль размером с ноготь. Этот стенд про другое: обшивку, трафареты, люки и
# сопла видно только вблизи, а именно они решают, выглядит ли вещь сделанной.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var cls=["scout","courier","hauler","miner","warship","survey"];
  var COLS=3,CELL=430,W2=CELL*COLS,H2=CELL*2,dpr=2;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+W2+"px;height:"+H2+"px";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle="#0a0d12";c.fillRect(0,0,W2,H2);
  var old=ctx;ctx=c;
  cls.forEach(function(k,n){
    var id=(n<3?"zoom_":"p_zoom_")+k;
    NPC_SHIPS[id]={name:id,seed:(n*7919+31)>>>0,hcls:k,col:"#9fd8ff",
      hull:100,cargo:60,fuel:100,thr:1,cls:k,tier:["line","work","rare","legend","proto","line"][n]};
    delete HULL_CACHE[id];
    var cx=(n%COLS)*CELL+CELL/2, cy=((n/COLS)|0)*CELL+CELL/2;
    c.save();c.translate(cx,cy);c.scale(7,7);c.rotate(-Math.PI/2);
    drawHull(id,false,false,0,0);c.restore();
    c.fillStyle="#7d94a4";c.font="11px ui-monospace,monospace";c.textAlign="left";
    c.fillText((n<3?"":"ПИРАТ · ")+HULL_CLASS[k].ru.toUpperCase(),(n%COLS)*CELL+10,((n/COLS)|0)*CELL+18);
    c.strokeStyle="rgba(120,150,175,.10)";
    c.strokeRect((n%COLS)*CELL+.5,((n/COLS)|0)*CELL+.5,CELL-1,CELL-1);
  });
  ctx=old;
  try{fetch("/hullzoom.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1400);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "zoom.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
