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
  function shot(){
    if(n>=types.length){
      try{fetch("/world-types.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var t=types[n];
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    p.type=t; p.T=TYPES[t]||p.T; p.mix=null;
    delete p.tex;
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5; G.surf.y=groundAt(tr,G.surf.x)-10;
    for(var f=0;f<4;f++)frame(performance.now()+f*16);
    oc.drawImage(cv,0,0,cv.width,cv.height*0.42,0,n*RH,RW,RH);
    oc.fillStyle="#9fb3c2";oc.font="12px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((TYPES[t]&&TYPES[t].ru||t).toUpperCase(),10,n*RH+18);
    n++;
    setTimeout(shot,260);
  }
  shot();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "world.html"), $head + $add + "</body></html>", [Text.Encoding]::UTF8)
Write-Output "ok"
