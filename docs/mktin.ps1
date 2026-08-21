# Жестянка крупно: стоит, работает, полна — и печатник отдельно.
#
# M119 ставит на поверхность машину, к которой игрок ходит ногами. Смотреть на
# неё надо так же, как на отсеки базы и на подглядку: вблизи, подряд и в тех
# состояниях, между которыми она переключается.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var host=null;
  for(var dx=-9;dx<=9&&!host;dx++)for(var dy=-9;dy<=9&&!host;dy++){
    if(!starAt(dx,dy))continue;
    var s=getSystem(dx,dy);
    var sx0=G.sx, sy0=G.sy;
    G.sx=dx;G.sy=dy;
    for(var q=0;q<s.planets.length;q++){
      var p=s.planets[q];
      if(tinCanLive(p)){G.sys=s;host=p;break;}
    }
    if(!host){G.sx=sx0;G.sy=sy0;}
  }
  if(!host){console.log("мира с Жестянкой не нашлось");return;}
  var tr=genTerrain(host);
  G.land={p:host,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.running=false;
  var S=G.surf;
  var T=tinMake(host), A=tinAskOf(T.seed);
  var spot=tinSpotX(host,S.tr);
  var rows=[
    ["STOPPED: NOBODY CAME",  {run:0,bin:0},        spot+30, 280],
    ["HALF THE ORDER IN",     {run:0,bin:0,fed:.5}, spot+30, 280],
    ["RUNNING",               {run:A.need,bin:14},  spot+30, 280],
    ["BIN FULL",              {run:A.need,bin:140}, spot+30, 280],
    ["THE PRINTER",           {run:A.need,bin:60},  spot+112, 150]
  ];
  var CH=170, Z=3.0;
  var maxW=0; rows.forEach(function(r){ if(r[3]>maxW) maxW=r[3]; });
  var dpr=2, W2=maxW*Z, H2=(CH*Z+30)*rows.length;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.imageSmoothingEnabled=false;
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  rows.forEach(function(row,n){
    T.run=row[1].run;T.bin=row[1].bin;T.last=Date.now();
    T.fed=row[1].fed?Math.round(A.need*row[1].fed):(row[1].run?A.need:0);
    // игрок стоит у приёмника: он и есть мерило роста машины
    S.x=spot-56;S.y=groundAt(S.tr,S.x)-10;S.on=true;
    S.cam={x:row[2],y:groundAt(S.tr,row[2])-10};
    drawSurface();
    var cy=n*(CH*Z+30)+24;
    var K=live.width/W;
    var CW=row[3];
    var sx=(row[2]-G.viewX-CW/2)*K, sy=(groundAt(S.tr,row[2])-G.viewY-CH*.74)*K;
    c.drawImage(live,sx,sy,CW*K,CH*K,0,cy,CW*Z,CH*Z);
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(row[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,CW*Z-1,CH*Z-1);
  });
  try{fetch("/tin.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "tin.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
