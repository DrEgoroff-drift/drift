# Lander sheet: every hull form as it stands on the pad, side by side.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=false;
  var ids=Object.keys(SHIPS);
  var byForm={};
  ids.forEach(function(id){var f=hullOf(id).form;if(!byForm[f])byForm[f]=id;});
  var forms=Object.keys(byForm);
  var cv=document.getElementById("c");
  var cols=4,cw=W/cols,rh=150;
  ctx.fillStyle="#2a2f36";ctx.fillRect(0,0,W,H);
  forms.forEach(function(f,k){
    var id=byForm[f];G.shipId=id;
    var x=(k%cols)*cw+cw/2,y=Math.floor(k/cols)*rh+110;
    ctx.save();ctx.translate(x,y);
    drawLander(false,false,{gear:1,sq:0,landed:true});
    ctx.restore();
    ctx.fillStyle="#cde";ctx.font="12px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(f+" · "+SHIPS[id].ru+" · "+SHIPS[id].hcls,x,y+32);
  });
  try{fetch("/landers.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1200);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "landers.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
