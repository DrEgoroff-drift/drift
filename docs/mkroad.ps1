# Стенд дорожного спутника: экран «ДОРОГИ» без машины, без GPS и без датчиков.
#
# Съёмка настоящей поездки стоит полчаса и зависит от пробок, поэтому кадр,
# который правится каждый проход, должен быть виден и с рабочего места. Музыка
# и скорость подменены ровным синтетическим ходом: тон неба, шлейф, сияние и
# читаемость подвала видны сразу, а поворот задаётся вручную.
#
#   powershell -ExecutionPolicy Bypass -File docs\mkroad.ps1
#   powershell -ExecutionPolicy Bypass -File docs\pageshot.ps1 road -Width 420 -Height 880
#
# Что можно крутить в запросе (всё необязательно):
#   ?kmh=35      скорость, км/ч            ?turn=0.7   снос вправо, -1..1
#   ?en=0.62     энергия музыки, 0..1      ?br=0.5     яркость музыки, 0..1
#   ?diag=1      окно правды по датчикам   ?ship=vyuk  чей корпус в кадре
#   ?back=1      обратный курс             ?flash=1    премия за поворот в кадре
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  /* цикл игры должен идти: это он вешает body.screen и убирает с экрана мир,
     приборы и пэды. Без него стенд врал бы в обе стороны */
  G.running=true;
  var Q=new URLSearchParams(location.search);
  var num=function(k,d){var v=Q.get(k);return v==null?d:+v;};
  G.road={day:-1,km:7.2,cr:24,mic:false};
  if(Q.get("ship")&&SHIPS[Q.get("ship")])G.shipId=Q.get("ship");
  roadOpen();
  roadDayReset();G.road.km=7.2;G.road.cr=24;
  RD.asked=1;RD.an={};                       /* подсказка про микрофон — как в поездке */
  RD.diag=!!num("diag",0);
  /* музыка и ход синтетические: стенд не слушает и никуда не едет */
  roadAudio=function(t){
    if(!RD)return;
    RD.kmh=num("kmh",35);
    RD.energy=num("en",.62);
    RD.bright=num("br",.5);
    RD.beat=Math.max(0,Math.sin(t*3.1))*.8;
    for(var k=0;k<28;k++)RD.wave[k]=.22+.55*Math.abs(Math.sin(t*1.3+k*.42));
    RD.turnT=num("turn",0);
    RD.latG=RD.turnT*.24;RD.yawS=RD.turnT*6;RD.latA=RD.latG;
    RD.moveT=420;RD.vmax=Math.max(RD.vmax||0,RD.kmh);
    RD.back=num("back",0);
    if(num("flash",0)&&!RD.flashT){RD.flash="ПОВОРОТ +18";RD.flashT=1.2;}
    RD.sys={name:"Тауара",cx:1010,cy:-1999};RD.mates=2;
  };
  /* РАЗОГРЕВ. Headless-Chrome под --screenshot успевает отдать десяток кадров,
     а всё сглаженное на экране устроено как раз на выдержках: снос выходит на
     цель за полторы секунды, лента набирает длину за полсекунды. Без разогрева
     снимок показывал бы первое мгновение, а не установившийся кадр — и правки
     оценивались бы по нему. Три секунды прогоняем синхронно, своими кадрами. */
  var T0=performance.now();
  for(var f=0;f<180;f++)drawRoad(T0+f*16.7);
},400);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "road.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
