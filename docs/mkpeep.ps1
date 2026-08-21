# Подглядка крупно: мат на свету и проход в темноте.
#
# M118 показывает единственное, что нельзя прочесть, — идущих. Значит, смотреть
# на них надо так же, как на отсеки базы: рядом, подряд и в нескольких фазах.
# Кадры: луг при звезде, начало прохода, такт (кто-то обернулся), ноша на двоих.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var host=null;
  for(var dx=-8;dx<=8&&!host;dx++)for(var dy=-8;dy<=8&&!host;dy++){
    if(!starAt(dx,dy))continue;
    var s=getSystem(dx,dy);
    for(var q=0;q<s.planets.length;q++){
      var p=s.planets[q];
      if(p.type!=="gas"&&peepHere(p)){G.sx=dx;G.sy=dy;G.sys=s;host=p;break;}
    }
  }
  if(!host){console.log("мира с лугом не нашлось");return;}
  var tr=genTerrain(host);
  G.land={p:host,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.running=false;
  var S=G.surf,P=S.peep;
  var dark=0;
  celDark=function(){return dark;};
  var rows=[
    ["DAYLIGHT: JUST GROUND",   0,   0,    null],
    ["ECLIPSE: THE PASS BEGINS",.82, .22,  null],
    ["THE BEAT: ONE TURNS BACK",.82, .50,  {beat:1}],
    ["A LOAD FOR TWO",          .70, .46,  {load:"носилки",n:2,beat:0}],
    ["A CRATE, ALONE",          .60, .40,  {load:"ящик",n:1,beat:0}]
  ];
  // Кадр целиком бесполезен: человек ростом 26 px на экране в 1200 — это точка,
  // а искать огрехи надо в рисунке. Поэтому берём вырезку вокруг мата и тянем её.
  var CW=300, CH=115, Z=3.8;
  var dpr=2, W2=CW*Z, H2=(CH*Z+30)*rows.length;
  var cv=document.createElement("canvas");cv.width=W2*dpr;cv.height=H2*dpr;
  var c=cv.getContext("2d");c.scale(dpr,dpr);
  c.imageSmoothingEnabled=false;
  c.fillStyle="#05070c";c.fillRect(0,0,W2,H2);
  var live=document.getElementById("c");
  var base=P.scene;
  rows.forEach(function(row,n){
    dark=row[1];
    P.dk=row[1];
    P.ph=row[2]*PEEP_PASS;
    P.scene=Object.assign({},base,row[3]||{});
    // встаём в мате, но с краю: игрок в кадре нужен как мерило роста
    S.x=P.x-96;S.y=groundAt(S.tr,S.x)-10;S.on=true;
    S.cam={x:P.x,y:groundAt(S.tr,P.x)-10};
    drawSurface();
    var cy=n*(CH*Z+30)+24;
    // вырезка берётся в ПИКСЕЛЯХ холста, а не в логических: у canvas свой
    // множитель плотности, и без него кадр уезжает в небо
    var K=live.width/W;
    var sx=(P.x-G.viewX-CW/2)*K, sy=(groundAt(S.tr,P.x)-G.viewY-CH*.72)*K;
    c.drawImage(live,sx,sy,CW*K,CH*K,0,cy,CW*Z,CH*Z);
    c.fillStyle="#8fa6b4";c.font="12px ui-monospace,monospace";c.textAlign="left";
    c.fillText(row[0],4,cy-8);
    c.strokeStyle="rgba(120,150,175,.14)";c.strokeRect(.5,cy+.5,CW*Z-1,CH*Z-1);
  });
  try{fetch("/peep.png",{method:"POST",body:cv.toDataURL("image/png")});}catch(e){}
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "peep.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
