# Живой кадр целиком: мир, приборы, пульт, пэды, правый борт.
#
# Все прежние стенды снимали канву и потому не показывали интерфейс вовсе —
# а релизный вид (A2) это и есть интерфейс. Здесь страница просто приводится
# в нужное состояние и остаётся стоять; снимает её docs\pageshot.ps1.
#
# Режим и обстановка задаются через ?s=  :
#   surface (по умолчанию) · system · cave · night · lowsuit · dock
param([string]$Scene = "surface")
$src = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "..\drift.html")
$cut = $src.LastIndexOf("</body>")
$head = $src.Substring(0, $cut)
$add = @'
<script>
setTimeout(function(){
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;
  /* приборы просыпаются от события; для снимка держим их открытыми насильно —
     иначе на кадре будет треть непрозрачности и судить не о чем */
  var s=document.createElement("style");
  /* анимация появления экрана при виртуальном времени застревает на середине —
     снимок ловил полупрозрачный стол; для стенда она не нужна вовсе */
  s.textContent=".hud{opacity:1!important}.pads{opacity:1!important}#console{opacity:1!important}"+
    ".scr.open{animation:none!important}";
  document.head.appendChild(s);
  var scene=(location.search.match(/[?&]s=([a-z]+)/)||[])[1]||"surface";
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
    return p;
  }
  /* встать вплотную к растению: подсказка появится сама, как у игрока */
  function atPlant(){
    var S=G.surf;if(!S||!S.plants||!S.plants.length)return;
    var best=S.plants[0];
    for(var k=0;k<S.plants.length;k++)
      if(Math.abs(S.plants[k].x-S.tr.W*.5)<Math.abs(best.x-S.tr.W*.5))best=S.plants[k];
    S.x=best.x;S.y=groundAt(S.tr,S.x)-10;
  }
  function hour(p,ph){
    var period=CEL_DAY*(6+((p.seed>>>7)&3));
    G.t=period*((ph-(p.seed%100)/100+1)%1);
  }
  function run(n,u,d){for(var f=0;f<n;f++){G.t+=.01;u(1);d();}}
  if(scene==="system"){
    G.mode="system";G.zoom=.5;G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · ТОРГОВЫЙ УЗЕЛ";
    for(var f=0;f<3;f++){G.t+=.02;drawSystem();}
  }else if(scene==="cave"){
    land("terran");enterCave();
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    run(4,updateCave,drawCave);
  }else if(scene==="night"){
    var p=land("terran");hour(p,.78);G.mode="surface";
    G.prompt="";run(6,updateSurface,drawSurface);
  }else if(scene==="lowsuit"){
    var p2=land("terran");hour(p2,.30);G.mode="surface";G.surf.suit=14;
    G.fuel=Math.max(1,G.fuel*.06);
    G.prompt="";run(6,updateSurface,drawSurface);
  }else if(scene==="home"||scene==="homeup"){
    /* дом со всеми ступенями: иначе второго этажа просто нет */
    G.home=G.home||homeInit();
    G.home.tier=HOME_TIERS.length;
    enterHomeIn();
    if(scene==="homeup"){
      G.hin.up=1;
      var b=hinSpan();
      G.hin.x=Math.min(b.hi,(hinHoleX()||b.hi)-60);
      G.hin.cam=G.hin.x;
    }
    for(var f3=0;f3<4;f3++){G.t+=.01;updateHomeIn(1);drawHomeIn();}
  }else if(scene==="raid"){
    /* абордаж: настоящая база из галактики, тем же поиском, что в тестах */
    var PB=null;
    for(var qx=-12;qx<12&&!PB;qx++)for(var qy=-12;qy<12&&!PB;qy++){
      if(!starAt(qx,qy))continue;
      var qs=getSystem(qx,qy),qb=pirateBaseOf(qs);
      if(qb){G.sys=qs;G.sx=qx;G.sy=qy;PB=qb;}
    }
    if(PB){
      enterRaid(PB);
      for(var f5=0;f5<8;f5++){G.t+=.02;updateRaid(1);drawRaid();}
    }
  }else if(scene==="hold"){
    G.mode="system";
    for(var f4=0;f4<2;f4++){G.t+=.02;drawSystem();}
    /* трюм с настоящим разнобоем: много, мало, одна штука */
    G.cargo.ice=14;G.cargo.iron=7;G.cargo.silicon=3;G.cargo.crystal=2;
    G.cargo.organics=5;G.cargo.isotopes=1;G.cargo.volatiles=4;G.cargo.missile=3;
    G.cargo.folk=2;G.cargo.alloy=6;
    tableToggle(true,"hold");
  }else if(scene==="table"||scene==="things"||scene==="strips"){
    G.mode="system";
    for(var f2=0;f2<2;f2++){G.t+=.02;drawSystem();}
    /* немного бумаг на столе, иначе судить не о чем */
    if(typeof thingAdd==="function"&&!(G.things&&G.things.length)){
      thingAdd("letter","Письмо от Веги","«…в среду буду на Тине, если довезут»");
      thingAdd("paper","Накладная 41-К","переплавка · 6 сплавов · оплачено");
      thingAdd("find","Пластина с насечкой","поднята в пещере, Нейэль I");
      thingAdd("cut","Вырезка из «Вестника»","о пропавшей экспедиции, третья полоса");
    }
    if(typeof logAdd==="function"){
      logAdd("ether","диспетчер Тины: борта на подходе, очередь на стойку");
      logAdd("ether","«…шестой не отвечает третьи сутки, идём по последнему счислению»");
      logAdd("tech","заправка 42 единицы · 336 кр");
      logAdd("money","продано: 12 сплавов · 984 кр");
      logAdd("talk","Крапива: «мешок отдал, а расписки не взял»");
    }
    tableToggle(true,scene==="table"?"ether":scene);
  }else{
    var p3=land("terran");hour(p3,.30);G.mode="surface";atPlant();
    run(6,updateSurface,drawSurface);
  }
  hud();
  /* Цикл НЕ глушим. G.running=false рисует заставочный звёздный фон поверх
     всего (28-loop, ветка else), а LOOP_OFF оставляет на канве мусор от
     недопечённых чанков: мир собирается за несколько кадров. Пусть игра идёт
     сама — снимок и должен показывать её такой, какая она есть. Подсказка
     держится не подстановкой, а тем, что человек стоит РЯДОМ с растением. */
},1200);
</script>
'@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "view.html"), $head + $add + "</body></html>", (New-Object Text.UTF8Encoding $true))
Write-Output "ok"
