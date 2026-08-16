# Сбор летучих газов: снимок экрана `scoop` целиком, три высоты в одном кадре.
#
# Пункт очереди M55 — `scoop` не имел ни одного захода, и чинить его вслепую
# нельзя: сцена живая, в игре она пролетает за секунды. Стенд ставит корабль в
# полосу сбора, выше неё и у самого дна, снимает три кадра и складывает их в
# столбец: так видно, есть ли у атмосферы верх и низ, или это одни обои.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  // нужен газовый гигант: он есть не в каждой системе, поэтому ищем по сектору
  var p=null;
  for(var dx=-6;dx<=6&&!p;dx++)for(var dy=-6;dy<=6&&!p;dy++){
    if(!starAt(G.sx+dx,G.sy+dy))continue;
    var s=getSystem(G.sx+dx,G.sy+dy);
    for(var q=0;q<s.planets.length;q++)if(s.planets[q].type==="gas"){
      G.sx+=dx;G.sy+=dy;G.sys=s;p=s.planets[q];break;}
  }
  if(!p){console.log("газовый гигант не найден");return;}
  startScoop(p);
  G.running=false;                 // кадр игрового цикла на остановленной игре не рисует сцену
  var S=G.scoop, bt=H*0.50, bb=H*0.63;
  // подписи латиницей: страница стенда дописывается к собранному drift.html, и
  // кириллица из этого скрипта приезжает в другой кодировке — не тот бой
  var shots=[["ABOVE THE BAND", H*0.30],["IN THE COLLECTION BAND",(bt+bb)/2],["NEAR THE FLOOR, HOT",H*0.86]];
  var dpr=2, W2=W, H2=H*shots.length+30*shots.length;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  shots.forEach(function(sh,n){
    S.y=sh[1];S.x=40+n*17;S.heat=n===2?78:(n===1?24:6);
    drawScoop();
    var cy=n*(H+30)+24;
    c.drawImage(live,0,cy,W,H);
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(sh[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,W-1,H-1);
  });
  try{fetch("/scoop.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "scoop.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
