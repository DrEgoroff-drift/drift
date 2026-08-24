# Мир планеты: поверхность шести типов подряд, одним листом.
#
# `surface.png` снимался по одному кадру и от случая к случаю, а поверхность —
# самый долгий экран игры после кокпита. Сравнивать её типы между собой можно
# только рядом: небо, грунт, рельеф и флора должны отличаться, а масштаб
# человека — оставаться одним и тем же везде.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var types=["terran","desert","ice","volcanic","toxic","jungle"];
  var RW=1280,RH=300,dpr=1;
  var out=document.createElement("canvas");
  out.width=RW*dpr;out.height=RH*types.length*dpr;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+RW+"px;height:"+(RH*types.length)+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");oc.setTransform(dpr,0,0,dpr,0,0);
  oc.fillStyle="#05070a";oc.fillRect(0,0,RW,RH*types.length);
  var cv=document.getElementById("c");
  var n=0;
  /* Скрытая страница (headless, фоновая вкладка) держит таймеры на секунду и
     не даёт кадров: канва остаётся 0×0, и первый же drawImage рушит весь
     стенд. Ждём, пока игра сама починит размер (08-state), и только потом
     начинаем снимать (M169). */
  var tries=0;
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    shot();
  }
  function shot(){
    if(n>=types.length){
      try{fetch("/world-types.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var t=types[n];
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    p.type=t; p.T=TYPES[t]||p.T; p.mix=null; p.mw=null;
    p.rough=Math.min(1.2,p.T.rough); p.res=worldRes(t,null,null);
    delete p.tex; delete p.mat; delete p.strata; delete p.geo; delete p.bio; p.seed=(p.seed^0x1000+n*7919)>>>0;
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5; G.surf.y=groundAt(tr,G.surf.x)-10;
    /* рисуем напрямую: frame() в скрытой странице теперь ничего не делает (M170) */
    for(var f=0;f<4;f++){G.t+=6;updateSurface(1);drawSurface();}
    oc.drawImage(cv,0,cv.height*0.42,cv.width,cv.height*0.58,0,n*RH,RW,RH);
    oc.fillStyle="#9fb3c2";oc.font="12px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((TYPES[t]&&TYPES[t].ru||t).toUpperCase(),10,n*RH+18);
    n++;
    setTimeout(shot,260);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "world.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
