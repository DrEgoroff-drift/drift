# Лист трепла: одна птица в пяти состояниях подряд.
#
# Смотреть надо не «нарисовалось ли», а держится ли фигура на движении:
# покой, взмах на середине, хохол дыбом, поворот головы, посадка после
# подскока. Если силуэт разваливается в конфетти хоть в одной клетке —
# виновата не поза, а слои (тело → перья внутрь обвода → один свет).
$src = Get-Content -Raw -Encoding UTF8 "$PSScriptRoot\..\drift.html"
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  G.running=false;
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  var CW=250,CH=250,dpr=2;
  var poses=[
    ["ПОКОЙ",      {t:2.0}],
    ["ВЗМАХ",      {t:3.1,flap:.85,hop:11,crest:.5,ruff:.4}],
    ["ХОХОЛ ДЫБОМ",{t:4.4,crest:1,mad:1,ruff:.8,blink:.2}],
    ["ГОЛОВА",     {t:5.7,look:1,ruff:.5,peck:.6}],
    ["ОСАДКА",     {t:6.9,flap:.15,hop:-3,lean:.3}],
    ["ЧИСТКА",     {t:8.2,preen:.85,ruff:.6,crest:.3}]
  ];
  var W2=CW*poses.length,H2=CH+26;
  var cv=document.createElement("canvas");
  cv.width=W2*dpr;cv.height=H2*dpr;
  cv.style.cssText="position:fixed;left:0;top:0;width:"+W2+"px;height:"+H2+"px;z-index:99999;background:#070b12";
  document.body.appendChild(cv);
  var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  poses.forEach(function(P,n){
    Object.keys(PAR).forEach(function(k){if(typeof PAR[k]==="number")PAR[k]=0;});
    Object.keys(P[1]).forEach(function(k){PAR[k]=P[1][k];});
    PAR.blinkAt=1e9;
    c.save();c.translate(n*CW,0);
    /* грунт клетки — тот же, что у окна: птицу проверяем на своём фоне */
    var bg=c.createLinearGradient(0,0,0,CH);
    bg.addColorStop(0,"rgba(255,214,150,.07)");bg.addColorStop(1,"rgba(4,7,12,.9)");
    c.fillStyle=bg;c.fillRect(0,0,CW,CH);
    c.strokeStyle="rgba(127,230,216,.16)";c.strokeRect(.5,.5,CW-1,CH-1);
    PAR_L=null;
    parrotDraw(c,CW,CH);
    c.restore();
    c.font="10px ui-monospace,monospace";c.textAlign="center";
    c.fillStyle="#7fe6d8";c.fillText(P[0],n*CW+CW/2,CH+16);
  });
  fetch("/parrot.png",{method:"POST",body:cv.toDataURL("image/png")});
  /* второй кадр — птица в самом окне, как её видит игрок: то же стекло,
     заголовок и строка речи. Лист поз проверяет движение, этот кадр — вид. */
  var PW=300,PH=372;
  var w2=document.createElement("canvas");
  w2.width=PW*dpr;w2.height=PH*dpr;
  var q=w2.getContext("2d");q.setTransform(dpr,0,0,dpr,0,0);
  q.fillStyle="#070b12";q.fillRect(0,0,PW,PH);
  var pg2=q.createLinearGradient(0,0,PW,PH);
  pg2.addColorStop(0,"rgba(28,44,60,.5)");pg2.addColorStop(1,"rgba(6,10,17,.7)");
  q.fillStyle=pg2;q.fillRect(0,0,PW,PH);
  q.strokeStyle="rgba(127,230,216,.34)";q.strokeRect(.5,.5,PW-1,PH-1);
  q.strokeStyle="rgba(127,230,216,.16)";
  q.beginPath();q.moveTo(0,34.5);q.lineTo(PW,34.5);q.stroke();
  q.beginPath();q.moveTo(0,PH-52.5);q.lineTo(PW,PH-52.5);q.stroke();
  q.font="9px ui-monospace,monospace";q.fillStyle="#5d7382";q.textAlign="left";
  q.fillText("ТРЕПЛО «БАЛАБОЛ»",12,22);
  q.fillStyle="#7fe6d8";q.textAlign="right";q.fillText("×",PW-12,23);
  q.textAlign="left";q.font="11px ui-monospace,monospace";q.fillStyle="#f2b25c";
  q.fillText("зурта не́ ка ва́лли",12,PH-32);
  q.font="8px ui-monospace,monospace";q.fillStyle="#5d7382";
  q.fillText("ТКНИ — ОТЗОВЁТСЯ ТЕМ, ЧТО СЛЫШАЛО",12,PH-14);
  Object.keys(PAR).forEach(function(k){if(typeof PAR[k]==="number")PAR[k]=0;});
  PAR.t=2.6;PAR.blinkAt=1e9;PAR.crest=.25;
  PAR_L=null;
  q.save();q.translate(0,34);parrotDraw(q,PW,PH-86);q.restore();
  fetch("/parrotwin.png",{method:"POST",body:w2.toDataURL("image/png")});
},1400);
</script>
'@
[IO.File]::WriteAllText("$PSScriptRoot\parrot.html", $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
