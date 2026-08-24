# Мир пешком (M172): ЦЕЛЫЙ кадр, а не полоса грунта.
#
# Все прежние стенды поверхности резали кадр по земле — и потому вся правка
# уходила в грунт, а экран, на котором игрок проводит больше времени, чем на
# любом другом кроме кокпита, ни разу не был осмотрен целиком. Здесь четыре
# полных кадра без обрезки: два мира, день и ночь, человек в середине.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var cv=document.getElementById("c");
  var PW=640,PH=400;
  /* фаза суток: .25 полдень, .5 закат, .75 полночь (06a-celest) */
  var cases=[["terran",.25,"ПОЛДЕНЬ"],["terran",.75,"ПОЛНОЧЬ"],
             ["desert",.52,"ЗАКАТ"],["jungle",.75,"ПОЛНОЧЬ"]];
  var out=document.createElement("canvas");
  out.width=PW*2;out.height=PH*2;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#05070a";oc.fillRect(0,0,out.width,out.height);
  var n=0,tries=0;
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    shot();
  }
  function shot(){
    if(n>=cases.length){
      try{fetch("/foot.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    var t=cases[n][0], hour=cases[n][1], when=cases[n][2];
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
    p.seed=(p.seed^0x3300+n*15485863)>>>0;
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5;G.surf.y=groundAt(tr,G.surf.x)-10;
    G.surf.walkAmp=1;G.surf.walkPhase=1.1;
    /* час суток ставится через G.t: фаза выводится из него и семени планеты,
       ничего не хранится (06a-celest), поэтому и задавать надо время */
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    G.t=period*((hour-(p.seed%100)/100+1)%1);
    for(var f=0;f<6;f++){G.t+=.01;updateSurface(1);drawSurface();}
    var px=(n%2)*PW, py=Math.floor(n/2)*PH;
    oc.drawImage(cv,0,0,cv.width,cv.height,px,py,PW,PH);
    oc.fillStyle="rgba(0,0,0,.5)";oc.fillRect(px,py,PW,20);
    oc.fillStyle="#9fb3c2";oc.font="11px ui-monospace,monospace";oc.textAlign="left";
    oc.fillText((TYPES[t]&&TYPES[t].ru||t).toUpperCase()+" · "+when,px+8,py+14);
    oc.strokeStyle="rgba(0,0,0,.7)";oc.lineWidth=2;oc.strokeRect(px,py,PW,PH);
    n++;
    setTimeout(shot,300);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "foot.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
