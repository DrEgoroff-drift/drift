# Посёлок с земли: три ступени, крупно.
#
# M109 даёт место, к которому игрок идёт ногами. Место, на котором нечего
# увидеть, — ложь той же породы, что перк без кода, поэтому смотреть на посёлок
# надо так же, как на отсеки базы: крупно и рядом, а не мельком в живой игре.
#
# M169: кадр — не весь экран, а ВЫРЕЗКА вокруг посёлка, увеличенная вдвое.
# Целый экран с гигантскими растениями и кораблём не даёт судить о дворах:
# на нём посёлок занимает десятую часть ширины, и любая правка выглядит
# одинаково. Ряды: до первого дара, вторая ступень, третья, и та же третья
# ночью — окна и горны видно только там.
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
    ["BEFORE THE FIRST GIFT", null, 0],
    ["STAGE 2, WATCHERS OUT", ["weir","kiln","field"], 0],
    ["STAGE 3, SMOKE AND ALL", ["weir","kiln","field","forge","still"], 0],
    ["STAGE 3 AT NIGHT", ["weir","kiln","field","forge","still"], 1]
  ];
  var K=2.2, CW=Math.round(W/K), CH=Math.round(H*.42);      // вырезка вокруг улицы
  var ZK=3.2, ZS=Math.round(H*.17);                          // и крупный план на неё же
  var dpr=2, W2=CW*K, H2=(CH*K+30)*rows.length+ZS*ZK+40;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.imageSmoothingEnabled=false;
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  var t0=G.t;
  rows.forEach(function(row,n){
    if(row[1]===null){delete G.settle[G.sx+","+G.sy];}
    else{
      var V=settleMake(p);
      V.built=row[1].slice();V.stage=V.built.length>=5?3:2;V.mood=88;V.last=Date.now();
    }
    /* ночь двигаем временем: surfNight считается от celSun, а не от флага */
    G.t=row[2]?t0+CEL_DAY*(3+((p.seed>>>7)&3))*.5:t0;
    var Sx=settleSpotX(p,S.tr);
    /* игрок отходит в сторону: его фонарь на скафандре ночью засвечивал полкадра,
       и судить о посёлке было нельзя (M169). Камера всё равно смотрит на улицу */
    S.x=Sx-300;S.y=groundAt(S.tr,S.x)-10;S.on=true;
    S.cam={x:Sx,y:groundAt(S.tr,Sx)-10};
    drawSurface();
    /* линия улицы на экране — по той же камере, что в drawSurface (21e):
       смещение там H*.58 плюс дыхание оператора, а не H/2 */
    var gy=groundAt(S.tr,Sx)-(Math.max(-300,S.cam.y-H*.58)+camOffset(S).y);
    var sx0=Math.max(0,Math.min(W-CW,W/2-CW/2));
    var sy0=Math.max(0,Math.min(H-CH,gy-CH*.66));
    var cy=n*(CH*K+30)+24;
    c.drawImage(live,sx0,sy0,CW,CH,0,cy,CW*K,CH*K);
    /* та же третья ступень — крупно, отдельной полосой внизу: детали в пару
       пикселей (пламя, наличники, искры) на общем плане не судятся вовсе */
    if(n===2){
      var zw=Math.round(W2/ZK), zh=ZS;
      var zx=Math.max(0,Math.min(W-zw,W/2-zw*.5)), zy=Math.max(0,Math.min(H-zh,gy-zh*.74));
      var zcy=rows.length*(CH*K+30)+24;
      c.drawImage(live,zx,zy,zw,zh,0,zcy,zw*ZK,zh*ZK);
      c.fillStyle="#8fa6b4";c.fillText("STAGE 3 CLOSE UP",4,zcy-8);
      c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,zcy+.5,zw*ZK-1,zh*ZK-1);
    }
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(row[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,W2-1,CH*K-1);
  });
  G.t=t0;
  try{fetch("/settle.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "settle.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
