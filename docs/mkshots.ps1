# Скрины для README: одна страница на все сцены, сцена выбирается ?scene=имя.
#
#   powershell -ExecutionPolicy Bypass -File docs\mkshots.ps1          # собрать docs/shots.html
#   powershell -ExecutionPolicy Bypass -File docs\mkshots.ps1 -Shoot   # и снять все сцены headless Chrome
#
# Снимает сам Chrome (--screenshot): в кадр попадает и канва, и HUD поверх неё,
# как видит игрок. Бюджет виртуального времени даёт таймерам и кадрам отработать.
param([switch]$Shoot)
$ErrorActionPreference="Continue"   # chrome пишет в stderr даже при успехе
$root=Split-Path -Parent $PSScriptRoot
$src=Get-Content -Raw -Encoding UTF8 (Join-Path $root "drift.html")
$cut=$src.LastIndexOf("</body>")
$head=$src.Substring(0,$cut)
$add=@'
<script>
setTimeout(function(){
  var scene=(location.search.match(/scene=([a-z0-9]+)/)||[])[1]||"system";
  var i=document.getElementById("intro"); if(i)i.style.display="none";
  G.running=true;G.t=200000;   // не ноль: на нуле фазы лун сходятся и на каждой планете затмение
  function sysWhere(test,r0){
    for(var r=(r0||1);r<40;r++)for(var x=-r;x<=r;x++)for(var y=-r;y<=r;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
      var S=getSystem(x,y);if(test(S,x,y))return S;
    }
    return null;
  }
  function goTo(S){G.sx=S.sx;G.sy=S.sy;G.sys=S;G.mode="system";G.ship={x:0,y:-700,vx:0,vy:0,a:0,av:0,bank:0};G.ap=null;G.orbit=null;}
  function solid(S,t){return (S.planets||[]).find(function(p){return p.type!=="gas"&&(!t||p.type===t);});}
  function land(p){startLanding(p);}
  function surf(p){startLanding(p);enterSurface();G.surf.x=G.surf.shipX+260;G.surf.cam=null;}
  var SC={
    system:function(){
      var S=sysWhere(function(S){return S.planets.length>=4&&S.station;});if(S)goTo(S);
      /* виртуальное время прогоняет тысячи кадров — свободный корабль улетает
         из кадра; орбита держит его у планеты, и планета остаётся в кадре */
      var p=(S||G.sys).planets.slice().sort(function(a,b){return b.radius-a.radius;})[0];
      G.ship.a=.6;G.orbit={p:p,r:p.radius+150,ang:2.4,w:.0012};G.orbit.sys=G.sx+","+G.sy;
    },
    map:function(){G.mode="map";},
    belt:function(){var S=sysWhere(function(S){return !!S.belt;});if(S)goTo(S);G.shipId="obod";G.owned.obod=true;enterBelt();},
    belt2:function(){var S=sysWhere(function(S){return !!S.belt;},3);if(S)goTo(S);G.shipId="igla";G.owned.igla=true;enterBelt();},
    scoop:function(){var S=sysWhere(function(S){return S.planets.some(function(p){return p.type==="gas";});});if(S)goTo(S);startScoop(S.planets.find(function(p){return p.type==="gas";}));},
    landing:function(){var S=sysWhere(function(S){return !!solid(S,"terran");});if(S)goTo(S);land(solid(S,"terran"));G.land.y=G.land.y-40;},
    surface:function(){var S=sysWhere(function(S){return !!solid(S,"jungle");});if(S)goTo(S);surf(solid(S,"jungle"));},
    surface2:function(){var S=sysWhere(function(S){return !!solid(S,"ice");},2);if(S)goTo(S);surf(solid(S,"ice"));},
    cave:function(){var S=sysWhere(function(S){return !!solid(S);});if(S)goTo(S);surf(solid(S));enterCave();G.cave.x=520;G.cave.y=caveFloor(G.cave,520);},
    mine:function(){var S=sysWhere(function(S){return !!solid(S,"rocky");});if(S)goTo(S);surf(solid(S,"rocky"));enterDig();},
    base:function(){
      /* база с полным набором отсеков и сменой, как в mkbase.ps1: пустая сетка ничего не говорит */
      var p=solid(G.sys)||G.sys.planets[0],kinds=Object.keys(BUILD),cells=[];
      for(var i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(((i*7)%11<8)?{k:kinds[i%kinds.length],hp:1}:null);
      G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,res:p.res.slice(0,3),cells:cells,pool:{},tMs:Date.now(),built:Date.now()};
      for(var q=0;q<8;q++){var cw=genMerc(hashi(q*77+13,5,3));cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
      enterBase(p);
    },
    raid:function(){var S=sysWhere(function(S,x,y){return sysDanger(x,y)>.55&&pirateBaseOf(S);},8);if(S){goTo(S);enterRaid(sysPirateBase());}},
    pirates:function(){var S=sysWhere(function(S,x,y){return sysDanger(x,y)>.6;},8);if(S)goTo(S);spawnPirates();for(var k=0;k<6;k++)if(G.pirates.length<4)spawnPirates();G.pirates.forEach(function(p,i){p.x=G.ship.x+220+i*90;p.y=G.ship.y-80+i*60;});},
    station:function(){openStation();},
    cantina:function(){openStation();tab="cantina";renderTab();},
    hq:function(){G.mgrs=[];["cmd","keep","fact"].forEach(function(r,n){var m=genMgr(1000+n*7717,[r]);m.tMs=Date.now();m.xp=140;G.mgrs.push(m);});openHq();},
    hours:function(){
      var at=regionOfTheme("hours"),R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
      var S=getSystem(R.core.sx,R.core.sy);goTo(S);var p=hoursCorePlanet(S);
      surf(p);G.surf.x=settleSpotX(p,G.surf.tr)-60;G.surf.cam=null;
    },
    vega:function(){
      var S=sysWhere(function(S){return S.station;});goTo(S);
      G.home=homeInit();G.home.tier=7;G.home.turn=1200000;G.home.sx=G.sx;G.home.sy=G.sy;G.wishDevice=1;vegaWish("love");vegaBoard(true);G.parrot={name:"\u0413\u043e\u0432\u043e\u0440\u0443\u043d",who:"x"};conT=0;consoleTick(1000);
    },
    kit:function(){
      var S=sysWhere(function(S){return S.station;});goTo(S);
      kitAll().torso=kitPiece("torso",3,1,1);kitAll().lamp=kitPiece("lamp",2,3,2);kitGive(kitPiece("boots",2,0,3),"\u0442");openShipView();
    },
    table:function(){
      var S=sysWhere(function(S){return S.station;});goTo(S);
      etherLine("\u2026\u0431\u043e\u0440\u0442 \u0447\u0435\u0442\u044b\u0440\u0435-\u0434\u0432\u0435\u043d\u0430\u0434\u0446\u0430\u0442\u044c, \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u0432\u044b\u0441\u043e\u0442\u0443. \u0427\u0435\u0442\u044b\u0440\u0435-\u0434\u0432\u0435\u043d\u0430\u0434\u0446\u0430\u0442\u044c?");
      etherLine("\u2026\u0432\u0441\u0435\u043c \u0432 \u0441\u0435\u043a\u0442\u043e\u0440\u0435: \u043f\u044b\u043b\u0435\u0432\u043e\u0439 \u0444\u0440\u043e\u043d\u0442 \u0441 \u043d\u043e\u0447\u043d\u043e\u0439 \u0441\u0442\u043e\u0440\u043e\u043d\u044b, \u0441\u0430\u0434\u0438\u0442\u044c\u0441\u044f \u043d\u0435 \u0441\u043e\u0432\u0435\u0442\u0443\u044e.");
      peopleLine("\u043b\u0435\u043d\u0442\u0430 \u0445\u043e\u0440\u043e\u0448\u0430\u044f, \u0432\u043e\u0437\u044c\u043c\u0443","\u0421\u0442\u043e\u0439\u043a\u0430");
      logAdd("money","\u043f\u0440\u043e\u0434\u0430\u043d\u043e 12 \u0436\u0435\u043b\u0435\u0437\u0430 \u00b7 140 \u043a\u0440");
      thingAdd("letter","\u041f\u0438\u0441\u044c\u043c\u043e \u043d\u0430 \u0423\u0440\u043d\u0435\u0439\u0443\u0440","\u043a\u043e\u043d\u0432\u0435\u0440\u0442, \u043d\u0435 \u0447\u0438\u0442\u0430\u043d");
      tableToggle(true,"ether");
    },
    board:function(){
      var S=sysWhere(function(S){return S.station;});goTo(S);
      G.ship.x=S.station.x+40;G.ship.y=S.station.y;openStation();tab="board";syncTabs();renderTab();
    },
    /* дом стоит на ПЕРВОЙ твёрдой планете своей системы (homePlanet) —
       садиться надо именно на неё, иначе дома в кадре не будет */
    firstSolid:function(S){return S.planets.find(function(p){return p.type!=="gas";});},
    /* Дать сцене отстояться: под --virtual-time-budget rAF успевает пару
       кадров, а камере надо доехать, чанкам испечься, жильцам разойтись по
       комнатам. Гоняем пару update/draw руками, как это делает prof(). */
    settle:function(mode,n){
      var M={surface:[updateSurface,drawSurface],homein:[updateHomeIn,drawHomeIn]}[mode];
      if(!M)return;
      for(var i=0;i<(n||240);i++){G.t+=1;M[0](1);M[1]();}
    },
    home:function(){
      var S=sysWhere(function(S){var f=SC.firstSolid(S);return f&&f.type==="terran";});
      if(S)goTo(S);
      var p=SC.firstSolid(S);
      G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
      G.home.trophies=[{k:"a"},{k:"b"},{k:"c"},{k:"d"}];
      G.owned.skat=1;G.home.garage=["skat"];
      G.vega={stage:2,aboard:1,att:0,mood:1,offend:-1,calls:0,said:0};
      surf(p);G.surf.x=homeDoorX(G.surf.tr,p)+40;G.surf.cam=null;
      SC.settle("surface");
    },
    rooms:function(){
      var S=sysWhere(function(S){return !!SC.firstSolid(S);});if(S)goTo(S);
      var p=SC.firstSolid(S);
      G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
      G.home.trophies=[{k:"a"},{k:"b"},{k:"c"}];
      G.owned.skat=1;G.home.garage=["skat"];
      G.vega={stage:2,aboard:1,att:0,mood:1,offend:-1,calls:0,said:0};
      G.crew=[{name:genName(rng(11)),role:"pilot"},{name:genName(rng(22)),role:"tech"}];
      surf(p);enterHomeIn();
      var st=hinRooms().find(function(v){return v.key==="study";});
      G.hin.x=st?st.x+st.w*.5:hinWidth()*.5;
      SC.settle("homein");
    },
    lights:function(){
      var at=regionOfTheme("lights"),R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
      var S=getSystem(R.core.sx,R.core.sy);goTo(S);
      var p=lightsCorePlanet(S);
      G.lights={t0:5,seen:0};
      var P=lightsPeriod();G.t=CEL_DAY*(5+P-1)+CEL_DAY*.5;
      surf(p);G.surf.x=lightsEntryX(G.surf.tr,p)-140;G.surf.cam=null;
    }
  };
  try{(SC[scene]||SC.system)();}catch(e){document.title="ERR "+e.message;}
},800);
</script>
'@
$out=$head+$add+"</body></html>"
[IO.File]::WriteAllText((Join-Path $root "docs\shots.html"),$out,(New-Object Text.UTF8Encoding $false))
Write-Output "docs/shots.html собран"
if($Shoot){
  $chrome="C:\Program Files\Google\Chrome\Application\chrome.exe"
  $scenes=@("system","map","belt","belt2","scoop","landing","surface","surface2","cave","mine","base","raid","station","cantina","hq","hours","lights","home","rooms")
  $dir=Join-Path $root "docs\shots"
  foreach($s in $scenes){
    $png=Join-Path $dir "$s.png"
    & $chrome --headless=new --no-first-run --no-default-browser-check --disable-extensions --disable-gpu --hide-scrollbars --window-size=1280,720 --virtual-time-budget=9000 "--user-data-dir=$($env:TEMP)\drift-shots" "--screenshot=$png" "http://localhost:8777/docs/shots.html?scene=$s&v=$(Get-Random)" 2>$null | Out-Null
    Write-Output "$s → $((Get-Item $png).Length) байт"
  }
}
