# Стенд рубки ШТАБ: игра + своя канва поверх, на которой рисуется только комната.
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  G.mgrs=[];
  ["cmd","keep","fact","sci"].forEach(function(r,n){
    if(n===3)return;                       // один домен намеренно пуст
    var m=genMgr(1000+n*7717,[r]); m.tMs=Date.now(); m.xp=140; G.mgrs.push(m);
  });
  G.mgrs[0].loy=28;
  G.mgrs[2].route=["3,4","5,1","6,7","2,9"];
  G.mgrs[2].job={id:"push",offer:0,mins:5,t:Date.now()};
  G.crew=[];
  for(var k=0;k<7;k++)G.crew.push({id:"c"+k,shipId:k<4?"scout":null,order:k<4?{kind:"run"}:null});
  G.drones=[{},{},{},{},{}]; G.bases={a:1,b:1,c:1};
  var cv=document.createElement("canvas");
  var W=980,H=280,dpr=2;
  cv.width=W*dpr; cv.height=H*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W+"px;height:"+H+"px;z-index:99999;background:#07090d";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");
  setInterval(function(){
    c.setTransform(dpr,0,0,dpr,0,0);
    drawHqRoom({width:W,height:H,getContext:function(){return c;}},G.mgrs[0].id,null);
  },50);
},1200);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\stand-hq.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "stand ok"
