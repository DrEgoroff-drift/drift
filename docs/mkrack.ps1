# Приборная стойка: восемь стрелок и пятиканальный самописец (M125).
#
# Смотреть надо в настоящем кадре: стойка стоит поверх мира, и её материал
# обязан читаться на тёмном фоне системного вида. Лента набивается заранее —
# сектор идёт к ядру области, груз меняется, корабль ходит по системе, поэтому
# перья пишут разное, а не пять одинаковых прямых.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  start(true);
  var R0=regionAt(G.sx,G.sy);
  for(var k=0;k<12000;k++){
    var f=k/12000;
    if(k%900===0){G.sx=R0.core.sx+Math.round((1-f)*4);G.sy=R0.core.sy+Math.round((1-f)*3);}
    if(k%700===0)G.cargo.ore=Math.max(0,(G.cargo.ore|0)+(k%1400?2:-1));
    G.ship.x=600+Math.sin(k*.0012)*520;G.ship.y=Math.cos(k*.0009)*380;
    G.ship.vx=Math.sin(k*.004)*7+Math.sin(k*.031)*1.5;G.ship.vy=Math.cos(k*.0031)*5;
    tapeTick(1);
  }
  G.fuel*=.62;G.hull*=.81;
  if(!rackOpen())rackToggle();
  drawSystem();rackDraw();
  var cvs=document.querySelector("canvas");
  var out=document.createElement("canvas");
  out.width=cvs.width;out.height=Math.round(cvs.height*.76)+28;
  var c=out.getContext("2d");
  c.fillStyle="#05070c";c.fillRect(0,0,out.width,out.height);
  c.drawImage(cvs,0,28);
  c.fillStyle="#8fa6b4";c.font="14px ui-monospace,monospace";
  c.fillText("INSTRUMENT RACK · eight needles, five pens · misclosure "+
             instrMisclose().toFixed(3),10,19);
  try{fetch("/rack.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
},1800);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "rack.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
