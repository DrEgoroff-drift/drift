$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=true;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var tier=parseInt(location.hash.replace("#",""))||8;
  G.home={turn:5e6,tier:tier,sx:0,sy:0,made:0,garage:["klinok"],
    showcase:{crystal:12,iridium:8},trophies:["вымпел","образец"]};
  G.owned={strizh:1,klinok:1};
  var W2=980,H2=300,dpr=2;
  var cv=document.createElement("canvas");
  cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W2+"px;height:"+H2+
    "px;z-index:99999;background:#0a0b0f";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");
  setInterval(function(){
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,W2,H2);
    drawHomeRoom({width:W2,height:H2,getContext:function(){return c;}});
  },60);
},1300);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\home.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
