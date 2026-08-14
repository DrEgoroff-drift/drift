# Лист корпусов ПО КЛАССАМ: семь строк, по шесть семян в каждой.
#
# mkfleet.ps1 показывает флот по тирам — это про цену. Здесь другое: класс
# обязан читаться силуэтом, поэтому семена одного класса стоят в ряд, а классы
# друг под другом. Именно на этом листе видно, что четыре класса из семи были
# одной «стрелой с крыльями», и на нём же проверяется, что это исправлено.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var cls=Object.keys(HULL_CLASS);
  var COLS=6,CELL=190,W2=CELL*COLS+130,H2=CELL*cls.length,dpr=2;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+W2+"px;height:"+H2+"px";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle="#0a0d12";c.fillRect(0,0,W2,H2);
  var old=ctx;ctx=c;
  cls.forEach(function(k,ri){
    c.fillStyle="#8fa6b4";c.font="11px ui-monospace,monospace";c.textAlign="left";
    c.fillText(HULL_CLASS[k].ru.toUpperCase(),8,ri*CELL+CELL/2);
    for(var n=0;n<COLS;n++){
      var id="stand_"+k+"_"+n;
      NPC_SHIPS[id]={name:id,seed:(n*7919+ri*104729)>>>0,hcls:k,col:"#9fd8ff",
        hull:100,cargo:60,fuel:100,thr:1,cls:k};
      delete HULL_CACHE[id];
      c.save();c.translate(130+n*CELL+CELL/2,ri*CELL+CELL/2);
      c.scale(2.1,2.1);c.rotate(-Math.PI/2);
      drawHull(id,false,false,0,0);c.restore();
      c.strokeStyle="rgba(120,150,175,.10)";
      c.strokeRect(130+n*CELL+.5,ri*CELL+.5,CELL-1,CELL-1);
    }
  });
  ctx=old;
  try{fetch("/hulls.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1400);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "hulls.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
