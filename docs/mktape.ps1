# Самописец слева от панели: бумага, пять перьев (M123).
#
# M122 ставит пять шкал и невязку туда, куда игрок поднимает глаза. Смотреть
# надо в настоящем кадре пояса — панель обязана читаться и не спорить ни с
# остеклением, ни с потолочными раструбами. Второй кадр — та же панель у ядра
# области, где стрелка уходит.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  // ищем систему с поясом, чтобы войти в кабину по-настоящему
  var found=null;
  for(var dx=-6;dx<=6&&!found;dx++)for(var dy=-6;dy<=6&&!found;dy++){
    if(!starAt(dx,dy))continue;
    var s=getSystem(dx,dy);
    if(s.belt){G.sx=dx;G.sy=dy;G.sys=s;found=s;}
  }
  if(!found){console.log("пояса не нашлось");return;}
  enterBelt();
  // лента должна быть исписана: гоняем такт самописца, как будто летали давно
  for(var k=0;k<40;k++)updateBelt(1);
  var Rg=regionAt(G.sx,G.sy);
  for(var k=0;k<9000;k++){
    // идём к ядру области и живём: невязка ползёт, масса и свет дышат
    var f=k/9000;
    G.sx=Math.round(Rg.core.sx+(Rg.core.sx-G.sx)*0+(1-f)*4);
    G.sy=Math.round(Rg.core.sy+(1-f)*3);
    G.ship.vx=Math.sin(k*.004)*7;G.ship.vy=Math.cos(k*.0031)*5;
    G.ship.x=600+Math.sin(k*.0017)*420;
    tapeTick(1);
  }
  drawBelt();
  var shot=document.createElement("canvas");
  shot.width=cvs.width;shot.height=Math.round(cvs.height*.42);
  shot.getContext("2d").drawImage(cvs,0,0);
  var out=document.createElement("canvas");
  out.width=shot.width;out.height=shot.height+28;
  var c=out.getContext("2d");
  c.fillStyle="#05070c";c.fillRect(0,0,out.width,out.height);
  c.drawImage(shot,0,28);
  c.fillStyle="#8fa6b4";c.font="14px ui-monospace,monospace";
  var R=regionAt(G.sx,G.sy);
  c.fillText("RECORDER + PANEL · region "+R.key+" · needle "+R.needle+
             " · misclosure "+misclose(G.sx,G.sy).toFixed(3),10,19);
  try{fetch("/tape.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
},1800);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "tape.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
