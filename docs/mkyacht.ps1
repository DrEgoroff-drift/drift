# Лист люксовых яхт: одна крупная и шесть семян помельче.
#
# Отдельный стенд, потому что яхта — единственный корпус, который покупают
# не за работу, а за вид: её надо смотреть вблизи, а на общем листе классов
# (mkhulls.ps1) она размером с ноготь. Верхняя строка — «герой» в 6× для
# придирок к деталям, ниже ряд семян в 3× — проверка, что роскошь не
# рассыпается от семени к семени.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var W2=1280,H2=980,dpr=2;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+W2+"px;height:"+H2+"px";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle="#080b10";c.fillRect(0,0,W2,H2);
  var old=ctx;ctx=c;
  function mk(id,seed,tier){
    NPC_SHIPS[id]={name:id,seed:seed>>>0,hcls:"yacht",col:"#9fd8ff",
      hull:100,cargo:40,fuel:120,thr:1.1,cls:"яхта",tier:tier||"luxe"};
    delete HULL_CACHE[id];
  }
  // герой: крупно, носом вправо, с работающими двигателями
  mk("yacht_hero",4242);
  c.save();c.translate(W2/2,200);c.scale(3.4,3.4);c.rotate(-Math.PI/2);
  drawHull("yacht_hero",true,false,1,0);c.restore();
  c.fillStyle="#7d94a4";c.font="11px ui-monospace,monospace";c.textAlign="left";
  c.fillText("ЯХТА · ЛЮКС · 3.4×",12,18);
  // ряд семян
  var COLS=6,CELL=W2/COLS;
  for(var n=0;n<COLS;n++){
    var id="yacht_"+n; mk(id,n*7919+13);
    c.save();c.translate(n*CELL+CELL/2,470);c.scale(1.5,1.5);c.rotate(-Math.PI/2);
    drawHull(id,false,false,0,0);c.restore();
    c.strokeStyle="rgba(120,150,175,.10)";c.strokeRect(n*CELL+.5,370.5,CELL-1,200);
  }
  // третья строка: та же форма на РЯДОВЫХ тирах — класс обязан читаться
  // силуэтом и без денег, иначе форма опознаёт цену, а не корабль
  var tiers=["line","work","rare","legend","proto","luxe"];
  tiers.forEach(function(t,n){
    var id="yacht_t"+n; mk(id,n*104729+7,t);
    c.save();c.translate(n*CELL+CELL/2,780);c.scale(1.5,1.5);c.rotate(-Math.PI/2);
    drawHull(id,false,false,0,0);c.restore();
    c.fillStyle="#5d7484";c.font="9px ui-monospace,monospace";c.textAlign="center";
    c.fillText(t,n*CELL+CELL/2,620);
  });
  c.textAlign="left";c.fillStyle="#7d94a4";c.font="11px ui-monospace,monospace";
  c.fillText("та же форма по тирам",12,612);
  ctx=old;
  try{fetch("/yachts.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1400);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "yacht.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
