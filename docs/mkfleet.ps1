# Лист флота: все сто корпусов сеткой, чтобы силуэты и тиры смотрелись рядом.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var only=location.hash.replace("#","");
  var ids=SHIP_KEYS.concat(FLEET_KEYS);
  if(only)ids=ids.filter(function(id){return shipTier(shipData(id))===only;});
  var COLS=only?5:10, CELL=only?260:132, ROWS=Math.ceil(ids.length/COLS);
  var cv=document.createElement("canvas"),dpr=2;
  cv.width=COLS*CELL*dpr; cv.height=ROWS*CELL*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+(COLS*CELL)+"px;height:"+(ROWS*CELL)+
    "px;z-index:99999;background:#080a0f";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");
  c.setTransform(dpr,0,0,dpr,0,0);
  var old=ctx; ctx=c;   // ctx объявлен через let — присваивание работает
  ids.forEach(function(id,n){
    var S=shipData(id), T=tierOf(S);
    var cx=(n%COLS)*CELL+CELL/2, cy=Math.floor(n/COLS)*CELL+CELL/2-8;
    c.save();
    c.strokeStyle="rgba(120,150,175,.12)";c.lineWidth=1;
    c.strokeRect((n%COLS)*CELL+.5,Math.floor(n/COLS)*CELL+.5,CELL-1,CELL-1);
    c.translate(cx,cy); c.rotate(-Math.PI/2); c.scale(only?3.4:1.5,only?3.4:1.5);
    try{ drawHull(id,0,0,0,0); }catch(e){ c.fillStyle="#f66"; c.fillText("!",0,0); }
    c.restore();
    c.font="8px ui-monospace,monospace"; c.textAlign="center";
    c.fillStyle=T.col; c.fillText(T.ru.toUpperCase(), cx, cy+CELL/2-16);
    c.fillStyle="#cfe3ea"; c.fillText((S.ru||id).slice(0,17), cx, cy+CELL/2-6);
    c.fillStyle="#7a8b96"; c.fillText((S.hcls||"")+" · "+S.price, cx, cy+CELL/2+3);
  });
  ctx=old;
},1500);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\fleet.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
