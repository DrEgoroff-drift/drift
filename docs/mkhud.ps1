# Релизный вид, проход A2: состояние ушло вниз.
#
# Четыре кадра, на которых игрок проводит время: система, поверхность днём,
# пещера и станция в доке. Смотрим не на приборы, а на ВЕРХ КАДРА — он должен
# принадлежать миру, — и на низ: не сталкиваются ли строка состояния, подсказка
# действия, пульт и пэды.
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  var cv=document.getElementById("c");
  var PW=660,PH=412;
  var out=document.createElement("canvas");
  out.width=PW*2;out.height=PH*2;
  out.style.cssText="position:fixed;left:0;top:0;z-index:99999;width:"+out.width+"px;height:"+out.height+"px";
  document.body.appendChild(out);
  var oc=out.getContext("2d");
  oc.fillStyle="#05070a";oc.fillRect(0,0,out.width,out.height);

  function land(t){
    var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
    if(t){p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
      p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
      delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
      delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;}
    var tr=genTerrain(p);
    G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.W*.5;G.surf.y=groundAt(tr,G.surf.x)-10;
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    G.t=period*((.30-(p.seed%100)/100+1)%1);
    return p;
  }
  var cases=[
    ["СИСТЕМА",function(){
      G.mode="system";G.prompt="";G.zoom=.5;
      for(var f=0;f<3;f++){G.t+=.02;drawSystem();}
    }],
    ["ПОВЕРХНОСТЬ · ЕСТЬ ДЕЙСТВИЕ",function(){
      land("terran");G.mode="surface";
      for(var f=0;f<6;f++){G.t+=.01;updateSurface(1);drawSurface();}
      G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ\nНИШКАН СТЕБЛЕВОЙ, ЦВЕТУЩИЙ";
    }],
    ["ПОВЕРХНОСТЬ · СКАФАНДР НА ИСХОДЕ",function(){
      land("terran");G.mode="surface";G.surf.suit=14;
      for(var f=0;f<6;f++){G.t+=.01;updateSurface(1);drawSurface();}
      G.prompt="";
    }],
    ["ПЕЩЕРА",function(){
      land("terran");
      enterCave();
      for(var f=0;f<4;f++){G.t+=.02;updateCave(1);drawCave();}
      G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    }]
  ];

  var n=0,tries=0;
  function ready(){
    if((cv.width<2||cv.height<2)&&tries++<20){resize();setTimeout(ready,120);return;}
    shot();
  }
  function shot(){
    if(n>=cases.length){
      try{fetch("/hud.png",{method:"POST",body:out.toDataURL("image/png")});}catch(e){}
      return;
    }
    cases[n][1]();
    hud();
    /* приборы будим насильно: снимок должен показать их в полную силу */
    var hp=document.querySelector(".hud");if(hp)hp.classList.add("live");
    setTimeout(function(){
      /* низ страницы — это DOM, а не канва: снимаем весь экран через
         html2canvas у нас нет, поэтому кладём канву и поверх неё рисуем
         рамки реальных прямоугольников панелей — так видно расстановку */
      var px=(n%2)*PW, py=Math.floor(n/2)*PH;
      oc.drawImage(cv,0,0,cv.width,cv.height,px,py,PW,PH);
      var kx=PW/innerWidth, ky=PH/innerHeight;
      var sel=[[".vitals","#7fe6d8"],[".locus","#f2b25c"],[".ipod","#9fd8ff"],
               ["#prompt","#f2b25c"],["#console","#8fd08a"],[".rail","#cfe3ea"],
               [".pads>div:first-child","#6b7a88"],[".pads>div:last-child","#6b7a88"]];
      oc.lineWidth=1;
      for(var s=0;s<sel.length;s++){
        var e=document.querySelector(sel[s][0]);if(!e)continue;
        var r=e.getBoundingClientRect();if(!r.width)continue;
        oc.strokeStyle=sel[s][1];
        oc.strokeRect(px+r.x*kx+.5,py+r.y*ky+.5,r.width*kx,r.height*ky);
      }
      oc.fillStyle="rgba(0,0,0,.55)";oc.fillRect(px,py,PW,20);
      oc.fillStyle="#9fb3c2";oc.font="11px ui-monospace,monospace";oc.textAlign="left";
      oc.fillText(cases[n][0]+"  ·  рамки — реальные прямоугольники панелей",px+8,py+14);
      oc.strokeStyle="rgba(0,0,0,.7)";oc.lineWidth=2;oc.strokeRect(px,py,PW,PH);
      n++;
      setTimeout(shot,300);
    },120);
  }
  ready();
},1600);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "hud.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
