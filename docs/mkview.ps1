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
  /* ── стенд больше не подкручивает приборы ──
     Здесь стояло `.hud{opacity:1!important}`: пока приборы в покое гасли до
     трети, на снимке от них не оставалось ничего и судить было не о чем.
     С 0.160.0 покой — .86, показывать нечего, а `!important` начал ВРАТЬ:
     он перебивал `body.screen .hud{opacity:0}`, и на снимке станции приборы
     висели поверх открытого экрана. Полчаса ушло на поиск «ошибки», которой
     в игре не было. Стенд обязан показывать то же, что игра, и ничего сверх.
     `.pads` и `#console` подкручивать тоже не надо: они не гаснут сами. */
  var s=document.createElement("style");
  /* анимация появления экрана при виртуальном времени застревает на середине —
     снимок ловил полупрозрачный стол; для стенда она не нужна вовсе */
  s.textContent=".scr.open{animation:none!important}";
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
  }else if(scene==="dock"||scene==="board"||scene==="folk"){
    /* станция: стыкуемся с торговым узлом стартовой системы */
    var st=G.sys.station;
    /* Свои стоят не в каждую смену — это замысел, а не редкость ради редкости.
       Для стенда отматываем время до смены, в которую кто-то есть: иначе на
       них нельзя посмотреть, а смотреть надо. */
    if(scene==="folk"&&typeof folkHere==="function"){
      for(var fk=0;fk<400&&!folkHere();fk++)G.t+=240;
    }
    if(st){G.ship.x=st.x+40;G.ship.y=st.y;openStation();}
    /* доска — то, ради чего вообще прилетают: очередь у стойки, что здесь
       предлагают, дела, слухи. Смотреть её надо отдельно от рынка */
    if(scene==="board"||scene==="folk"){
      var bb=document.querySelector("#stTabs button[data-tab=board]");
      if(bb)bb.click();
      /* берём одну работу, чтобы на доске было видно и «что предлагают», и
         «везёте» разом: иначе второй блок никогда не попадёт на снимок */
      if(scene==="folk"&&typeof offerHere==="function"){
        var oo=offerHere()[0];
        if(oo){offerTake(oo);if(typeof renderTab==="function")renderTab();}
      }
    }
  }else if(scene==="hq"||scene==="hqfull"){
    /* Штаб. По умолчанию — ПУСТОЙ, потому что именно пустым его видит новый
       игрок и именно там плейтестер решил, что «что-то сломал». `hqfull`
       показывает его же с людьми, чтобы было с чем сравнивать. */
    if(scene==="hqfull"&&typeof mgrHire==="function"){
      try{ mgrHire(mgrRoll(1,"crew")); mgrHire(mgrRoll(2,"trade")); }catch(e){}
    }else G.mgrs=[];
    document.getElementById("hqbtn").click();
  }else if(scene==="bird"||scene==="birdwin"){
    /* Трепло. Птица достаётся в вещах покойника, поэтому на стенде она
       просто выдаётся, и ей дают что-то услышанное — иначе на тычок она
       отвечает шорохом. `birdwin` открывает окно, `bird` оставляет жёрдочку
       на пульте: смотрим, как птицу видно В ИГРЕ, а не на стенде. */
    var pb=land("terran");hour(pb,.30);G.mode="surface";
    if(typeof parrotFind==="function"){
      parrotFind(12345,"разведчика «Тишина»");
      heardAdd("yours",{note:"ноль-семь, приём"});
      if(typeof heardPrices==="function")heardPrices(G.sys);
    }
    run(6,updateSurface,drawSurface);
    if(typeof consoleTick==="function")consoleTick(999);
    if(scene==="birdwin"&&typeof toggleParrotWin==="function")toggleParrotWin(true);
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
      /* Ставим ходока туда, где есть на что смотреть. С 0.161.0 метки и тела
         не проходят сквозь переборки, и на стартовой площадке ангара кадр
         честно пуст: все живые сидят в дальних отсеках. Для разбора это
         бесполезный кадр — ищем комнату, из середины которой видно больше
         всего живых, и смотрим оттуда. */
      var S9=G.raid,R9=S9.R,best=null;
      (R9.rooms||[]).forEach(function(rm){
        var cx=(rm.c0+rm.c1+1)/2*RCELL, cz=(rm.r0+rm.r1+1)/2*RCELL;
        if(raidSolidAt(R9,cx,cz))return;
        var n=S9.foes.filter(function(q){return q.hp>0&&raidLineOfSight(R9,cx,cz,q.x,q.z);}).length;
        if(!best||n>best.n)best={n:n,x:cx,z:cz};
      });
      if(best&&best.n>0){
        S9.x=best.x;S9.z=best.z;
        /* и повернуть на них: курс остался прежним, живые оказывались за
           спиной, и кадр опять выходил пустым */
        var vis=S9.foes.filter(function(q){return q.hp>0&&raidLineOfSight(R9,S9.x,S9.z,q.x,q.z);});
        vis.sort(function(p,q){return Math.hypot(p.x-S9.x,p.z-S9.z)-Math.hypot(q.x-S9.x,q.z-S9.z);});
        if(vis.length)S9.a=Math.atan2(vis[0].x-S9.x,vis[0].z-S9.z);
      }
      for(var f5=0;f5<8;f5++){G.t+=.02;updateRaid(1);drawRaid();}
    }
  }else if(scene==="rack"){
    /* Приборная стойка кабины: восемь стрелок, самописец и «Глобус» (25f).
       Скорость подкручивать бесполезно — игровой цикл гасит её сопротивлением,
       и на снимке расчётная точка честно пропадала: стенд врал про исправный
       прибор. Даём настоящий автопилот, и корабль действительно летит. */
    G.mode="system";
    var pl=G.sys.planets[0];
    if(pl)G.ap={kind:"planet",p:pl,phase:"fly"};
    G.rack=G.rack||{};G.rack.on=1;
    for(var f7=0;f7<40;f7++){G.t+=.02;updateSystem(1);drawSystem();}
    if(typeof rackDraw==="function")rackDraw();
  }else if(scene==="hold"){
    G.mode="system";
    for(var f4=0;f4<2;f4++){G.t+=.02;drawSystem();}
    /* трюм с настоящим разнобоем: много, мало, одна штука */
    G.cargo.ice=14;G.cargo.iron=7;G.cargo.silicon=3;G.cargo.crystal=2;
    G.cargo.organics=5;G.cargo.isotopes=1;G.cargo.volatiles=4;G.cargo.missile=3;
    G.cargo.folk=2;G.cargo.alloy=6;
    tableToggle(true,"hold");
  }else if(scene==="album"||scene==="pcback"){
    /* альбом (M188): шесть снимков одного мира — разные места и часы. Кадры
       рисует художник открытки, а не игра, поэтому стенд показывает ровно то,
       что увидит и получатель карточки */
    var pa=land("terran");G.mode="surface";
    var pera=CEL_DAY*(6+((pa.seed>>>7)&3));
    G.album=[];
    for(var q=0;q<6;q++){
      G.surf.x=1500+q*2300;G.t=pera*(40+q*0.19);
      if(q===5){
        var sv=G.surf;G.land={p:pa,tr:sv.tr,x:sv.tr.W*0.3};
        G.surf=null;G.mode="landing";postTake();
        G.surf=sv;G.land=null;G.mode="surface";
      }else postTake();
    }
    run(4,updateSurface,drawSurface);
    tableToggle(true,"album");
    /* оборот (M189): развернуть первую карточку и перевернуть её */
    if(scene==="pcback"){
      albumOpen=0;albumBack=true;
      if(typeof postSign==="function")postSign(albumAll()[0]);
      tableRender();
    }
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
  /* кнопка ФОТО показывается из consoleTick, а он идёт раз в секунду с
     небольшим: стенду ждать нечего, зовём напрямую */
  if(typeof camBtnTick==="function")camBtnTick();
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
