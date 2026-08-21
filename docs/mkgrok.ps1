# Грохотун крупно и в рост строки: один и тот же портрет в трёх размерах.
#
# В кантине его видят в 64 px рядом с людьми (12d-mgr-face), поэтому смотреть
# надо и вблизи, где ищутся огрехи, и в настоящем размере, где решается, читается
# ли он вообще. Рядом — портрет управляющего, чтобы сравнить язык.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  var dpr=2, W2=760, H2=330;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.imageSmoothingEnabled=false;
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
  c.fillText("GROKHOTUN: 256, 128, 64 — AND A MANAGER AT 64 FOR THE SAME LANGUAGE",8,18);
  c.drawImage(grokFace(256),16,34);
  c.drawImage(grokFace(128),290,34);
  c.drawImage(grokFace(64),290,174);
  // человек того же размера: язык портретов должен быть один
  var m=(stationMgrs(G.sys)||[])[0];
  if(m)c.drawImage(mgrFace(m,64),370,174);
  c.fillStyle="#5d7382";c.font="10px ui-monospace,monospace";
  c.fillText("256",16,306);c.fillText("128",290,306);
  c.fillText("64 / manager 64",290,320);
  try{fetch("/grok.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "grok.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
