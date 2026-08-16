# Посёлок с земли: три ступени в одном столбце.
#
# M109 даёт место, к которому игрок идёт ногами. Место, на котором нечего
# увидеть, — ложь той же породы, что перк без кода, поэтому смотреть на посёлок
# надо так же, как на отсеки базы: крупно и рядом, а не мельком в живой игре.
# Кадры: до первого дара, вторая ступень с дозорными, третья с дымом.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var p=null;
  for(var dx=-6;dx<=6&&!p;dx++)for(var dy=-6;dy<=6&&!p;dy++){
    if(!starAt(G.sx+dx,G.sy+dy))continue;
    var s=getSystem(G.sx+dx,G.sy+dy);
    for(var q=0;q<s.planets.length;q++)if(SETTLE_ON.indexOf(s.planets[q].type)>=0){
      G.sx+=dx;G.sy+=dy;G.sys=s;p=s.planets[q];break;}
  }
  if(!p){console.log("нет обитаемого мира");return;}
  startLanding(p);enterSurface(p);
  G.running=false;
  var S=G.surf;
  var rows=[
    ["BEFORE THE FIRST GIFT", null],
    ["STAGE 2, WATCHERS OUT", ["weir","kiln","field"]],
    ["STAGE 3, SMOKE AND ALL", ["weir","kiln","field","forge","still"]]
  ];
  var dpr=2, W2=W, H2=H*rows.length+30*rows.length;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  rows.forEach(function(row,n){
    if(row[1]===null){delete G.settle[G.sx+","+G.sy];}
    else{
      var V=settleMake(p);
      V.built=row[1].slice();V.stage=V.built.length>=5?3:2;V.mood=88;V.last=Date.now();
    }
    // встаём рядом с посёлком, чтобы он попал в кадр целиком
    S.x=settleSpotX(p,S.tr)+70;S.y=groundAt(S.tr,S.x)-10;S.on=true;
    S.cam={x:S.x,y:S.y};
    drawSurface();
    var cy=n*(H+30)+24;
    c.drawImage(live,0,cy,W,H);
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(row[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,W-1,H-1);
  });
  try{fetch("/settle.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "settle.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
