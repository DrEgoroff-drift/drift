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
  }else if(scene==="wallset"||scene==="wallcave"){
    /* стена, которая помнит (M210). Сервера у стенда нет, поэтому руки
       кладутся в память напрямую — ровно то, что положил бы ответ: знак,
       рука и признак «этот твой». Проверяется, как знаки СИДЯТ НА КАМНЕ:
       не сеткой, не орнаментом, и свой среди чужих виден */
    var pw=land("terran");hour(pw,.34);
    var kindw=(scene==="wallcave")?WALL_C:WALL_S;
    var keyw=wallKeyHere()||"0,0";
    var lw=[];
    for(var q2=0;q2<11;q2++)
      lw.push({m:(q2*5+2)%TRACE_MARK.length,
               h:("00000"+(q2*2654435761%16777216).toString(16)).slice(-6),me:false});
    lw.push({m:4,h:"c0ffee",me:true});
    WALL_CACHE.set(wallCacheKey(kindw,keyw),{list:lw,mine:true,pending:false});
    if(scene==="wallcave"){
      enterCave();
      G.cave.x=(CAVE_WALL_X0+CAVE_WALL_X1)/2;
      G.cave.y=caveFloor(G.cave,G.cave.x);
      G.prompt="УСТЬЕ · 12 РУК, СРЕДИ НИХ ВАША";
      run(30,updateCave,drawCave);
    }else{
      G.mode="surface";
      var wxs=settleWallHereX(G.surf.p,G.surf.tr);
      if(wxs!=null){G.surf.x=wxs;G.surf.y=groundAt(G.surf.tr,wxs)-10;}
      G.prompt="СТЕНА ПОСЁЛКА · 12 РУК, СРЕДИ НИХ ВАША";
      run(24,updateSurface,drawSurface);
    }
    /* ЛУПА. Знаки живут в мире в натуральную величину — с человека ростом в
       26 пикселей это горсть штрихов, и по снимку всего экрана нельзя судить
       ни о разбросе, ни о том, читается ли свой среди чужих. Стенд поэтому
       кладёт в угол увеличенный кусок того же кадра: это не другая отрисовка,
       а тот же пиксель крупно */
    (function(){
      var cvv=document.querySelector("canvas");if(!cvv)return;
      /* СВОИМ холстом поверх, а не поверх игрового: цикл игры в стенде
         намеренно оставлен работать (иначе заставка закрасит кадр), и всё,
         что дорисовано в игровой ctx, следующий кадр стирает */
      var lo=document.createElement("canvas");
      lo.width=884;lo.height=484;
      lo.style.cssText="position:fixed;left:12px;top:12px;z-index:99999;"+
        "width:884px;height:484px;image-rendering:pixelated;"+
        "outline:1px solid rgba(255,255,255,.35)";
      document.body.appendChild(lo);
      var lc=lo.getContext("2d");
      lc.imageSmoothingEnabled=false;
      /* НАВОДИТСЯ САМА. Раньше вырезка бралась от середины кадра, и в пещере
         лупа смотрела в пустую породу: знаки оказались правее. Считать их
         экранное место по камере значит повторить в стенде половину отрисовки;
         проще найти их так же, как их находит глаз, — по светлому пятну.
         Один проход по кадру, один раз, дальше держимся найденной точки */
      var aim=null;
      (function tick(){
        if(!aim){
          var g0=cvv.getContext("2d"), d=null;
          try{d=g0.getImageData(0,0,cvv.width,cvv.height).data;}catch(e){}
          if(d){
            var sx2=0,sy2=0,n2=0;
            for(var y2=0;y2<cvv.height;y2+=2)for(var x2=0;x2<cvv.width;x2+=2){
              var i2=(y2*cvv.width+x2)*4;
              if(d[i2]>150&&d[i2+1]>140&&d[i2+2]>110){sx2+=x2;sy2+=y2;n2++;}
            }
            if(n2>8)aim=[Math.round(sx2/n2),Math.round(sy2/n2)];
          }
        }
        var ax=aim?aim[0]:Math.round(cvv.width*.5), ay=aim?aim[1]:Math.round(cvv.height*.6);
        var pxx=Math.max(0,Math.min(cvv.width-220,ax-110));
        var pyy=Math.max(0,Math.min(cvv.height-120,ay-60));
        lc.clearRect(0,0,lo.width,lo.height);
        lc.drawImage(cvv,pxx,pyy,220,120,2,2,880,480);
        requestAnimationFrame(tick);
      })();
    })();
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
  }else if(scene==="crew"||scene==="hire"){
    /* НАЁМНИКИ глазами новичка (M212, обход второго часа): экипаж пуст, денег
       шестьсот, и надо решить, стоит ли отдать половину за незнакомого
       человека. `hire` — тот же экран после найма: что игрок получил взамен */
    var stc=G.sys.station;
    if(stc){G.ship.x=stc.x+40;G.ship.y=stc.y;openStation();}
    if(scene==="hire"&&typeof crewPool==="function"){
      var pool=crewPool();
      if(pool&&pool.length&&typeof crewHire==="function")crewHire(pool[0]);
    }
    tab="crew";syncTabs();renderTab();
  }else if(scene==="raidhangar"){
    /* ангар с того места, где игрок оказывается сразу после стыковки: это
       ПЕРВЫЙ кадр абордажа, и второй хвост M180 — «ангар хочет убранства» —
       именно про него. Никуда не идём и ничего не двигаем */
    var PBh=null;
    for(var hx=-12;hx<12&&!PBh;hx++)for(var hy=-12;hy<12&&!PBh;hy++){
      if(!starAt(hx,hy))continue;
      var hs=getSystem(hx,hy),hb=pirateBaseOf(hs);
      if(hb){G.sys=hs;G.sx=hx;G.sy=hy;PBh=hb;}
    }
    if(PBh){
      enterRaid(PBh);
      for(var f9=0;f9<6;f9++){G.t+=.02;updateRaid(1);drawRaid();}
    }
  }else if(scene==="raidfoe"){
    /* тело противника крупно (хвост M180). Стенд `raid` ищет комнату, из
       которой видно БОЛЬШЕ ВСЕГО живых, и потому показывает их издали —
       судить о фигуре по трём точкам на дальней стене нельзя. Здесь наоборот:
       встаём вплотную к ближайшему и смотрим ему в лицо. */
    var PBf=null;
    for(var fx=-12;fx<12&&!PBf;fx++)for(var fy=-12;fy<12&&!PBf;fy++){
      if(!starAt(fx,fy))continue;
      var fs2=getSystem(fx,fy),fb=pirateBaseOf(fs2);
      if(fb){G.sys=fs2;G.sx=fx;G.sy=fy;PBf=fb;}
    }
    if(PBf){
      enterRaid(PBf);
      var Sf=G.raid;
      /* барона — первым: он и есть самый нарядный, и по нему видно ранг */
      var live=Sf.foes.filter(function(q){return q.hp>0;});
      live.sort(function(p,q){return (q.baron?1:0)-(p.baron?1:0);});
      var f6=live[0];
      if(f6){
        /* встаём в полутора клетках перед ним и смотрим на него. Сторону
           выбираем ту, где не переборка, — иначе камера оказывается в стене
           и кадр пуст. Тревогу НЕ поднимаем: она заливает отсек красным, и
           судить о фигуре под этой заливкой нельзя */
        var d6=RCELL*1.5, put=false;
        [[0,-d6],[0,d6],[-d6,0],[d6,0]].forEach(function(o){
          if(put)return;
          if(raidSolidAt(Sf.R,f6.x+o[0],f6.z+o[1]))return;
          Sf.x=f6.x+o[0];Sf.z=f6.z+o[1];put=true;
        });
        Sf.a=Math.atan2(f6.x-Sf.x,f6.z-Sf.z);
      }
      for(var f8=0;f8<8;f8++){G.t+=.02;updateRaid(1);drawRaid();}
    }
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
  }else if(scene==="cockpit"){
    /* потолочная панель кабины: пять шкал и невязка. Внешний тестировщик:
       «приборы, которые нельзя прочитать» — смотреть надо именно сюда, на
       рейке (`rack`) приборы другие и подписи у них крупнее */
    G.mode="system";
    var plc=G.sys.planets[0];
    if(plc)G.ap={kind:"planet",p:plc,phase:"fly"};
    G.cockpit=1;
    if(typeof cockpitOn==="function")cockpitOn(true);
    for(var fc=0;fc<30;fc++){G.t+=.02;updateSystem(1);drawSystem();}
  }else if(scene==="shaft"){
    /* ствол сверху вниз: площадки стоят на каждом восьмом ряду, и чтобы
       судить, читаются ли они, нужен именно вертикальный ход, а не штрек */
    land("terran");
    G.surf.x=G.surf.tr.W*.5;
    enterDig();
    var Ds=G.dig;
    for(var q4=0;q4<22;q4++)digCell(Ds,0,q4).dug=true;
    for(var q5=6;q5<11;q5++)digCell(Ds,q5-6+1,8).dug=true;
    Ds.col=0;Ds.row=8;
    for(var f6=0;f6<8;f6++){G.t+=.02;updateDig(1);drawDig();}
  }else if(scene==="dig"){
    /* шахта: M55 #1, «самый слабый экран». Копаем несколько клеток, чтобы в
       кадре была и выработка, и нетронутый массив, — иначе судить не о чем */
    land("terran");
    G.surf.x=G.surf.tr.W*.5;
    enterDig();
    var D=G.dig;
    for(var q3=0;q3<9;q3++){
      D.col+= (q3%3===2)?-1:0;
      D.row+= (q3%3===2)?1:0;
      if(q3%3!==2)D.col+=1;
      digCell(D,D.col,D.row).dug=true;
    }
    D.col=2;D.row=2;
    for(var f4=0;f4<8;f4++){G.t+=.02;updateDig(1);drawDig();}
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
  }else if(scene==="kino"){
    /* кинопередвижка (M205): ищем станцию, где на этой неделе идёт сеанс */
    var kx=null;
    for(var qx=-12;qx<=12&&kx===null;qx++)for(var qy=-12;qy<=12&&kx===null;qy++){
      if(!starAt(qx,qy))continue;
      var qs=getSystem(qx,qy);
      if(qs.station&&kinoAt(qx,qy)){kx=qx;G.sx=qx;G.sy=qy;G.sys=qs;}
    }
    var stk=G.sys.station;
    if(stk){G.ship.x=stk.x+40;G.ship.y=stk.y;openStation();}
    var kb=document.querySelector("#stTabs button[data-tab=cantina]");
    if(kb)kb.click();
  }else if(scene==="tree"){
    /* ёлка (M201): подменяем дату на 31 декабря и открываем кантину. Дата
       настоящая по замыслу, и ждать декабря стенд не может */
    var RD=Date, fake=new RD(2026,11,31,20,0,0).getTime();
    window.Date=function(x){return x===undefined?new RD(fake):new RD(x);};
    window.Date.now=function(){return fake;};
    window.Date.prototype=RD.prototype;
    var st9=G.sys.station;
    if(st9){G.ship.x=st9.x+40;G.ship.y=st9.y;openStation();}
    var cb=document.querySelector("#stTabs button[data-tab=cantina]");
    if(cb)cb.click();
  }else if(scene==="spa"){
    /* санаторий (M199): второй день, часть распорядка уже вычеркнута */
    G.spa={day:2,days:3,slot:0,done:0,took:{"2:bath":1,"2:cock":1},talked:0,
      pname:"Тиун III",home:{sx:G.sx,sy:G.sy},seed:1234567};
    G.mode="spa";
    for(var sf=0;sf<3;sf++){G.t+=.02;drawSpa();}
  }else if(scene==="winter"||scene==="winterlow"){
    /* зимовка (M197): комната на середине месяца. `winterlow` — та же комната
       с убавленным светом: баланс должен быть ВИДЕН, а не написан цифрой */
    G.win={sx:2,sy:-3,pi:0,pname:"Тиун II",sysName:"Тиун",
      day:17,days:30,pw:{heat:3,air:3,light:2,ant:1},
      faults:[{k:"ice",day:12}],diary:[],wall:5,cold:1,dark:0,
      home:{sx:G.sx,sy:G.sy},t0:Date.now(),done:0};
    if(scene==="winterlow"){G.win.pw.light=0;G.win.pw.heat=1;G.win.faults.push({k:"pump",day:15});}
    G.mode="winter";
    for(var wf=0;wf<3;wf++){G.t+=.02;drawWinter();}
  }else if(scene==="ether"){
    /* ночной эфир (M191): вечера ждать нельзя, поэтому час подменяется, а
       вместо сервера подставляется своя карточка — путь при этом остаётся
       настоящим: ethTick читает её по строке, как читал бы чужую */
    var pn=land("terran");hour(pn,.78);G.mode="surface";
    var pern=CEL_DAY*(6+((pn.seed>>>7)&3));
    G.album=[];G.mail=null;
    G.surf.x=G.surf.tr.W*.5;G.t=pern*40.78;
    postTake();var mine=postSign(albumAll()[0]);
    postChoose(mine,0,1);postChoose(mine,2,3);postGlyph(mine,2);postGlyph(mine,14);
    var fake=mailWire(mine);
    mailNight=function(){return true;};
    mailCall=function(op){
      if(op==="ask")return Promise.resolve({ok:true,card:fake,ch:"abcdef012345"});
      return Promise.resolve({ok:true});
    };
    G.radioF=0.06;
    run(4,updateSurface,drawSurface);
    /* несколько тиков консоли: первый спрашивает кучу, дальше идут строки */
    var n=0;
    (function step(){
      consoleTick(999);
      if(++n<14)setTimeout(step,90);
    })();
  }else if(scene==="mail"){
    /* почта (M190): две стопки — в одной ждём ответа, в другой пришло чужое.
       Сервер тут не нужен: раскладку проверяем на карточках, положенных в
       стопки теми же mailPush, какими их кладёт настоящий ответ */
    var pm=land("terran");G.mode="surface";
    var perm=CEL_DAY*(6+((pm.seed>>>7)&3));
    G.album=[];G.mail=null;
    for(var z=0;z<3;z++){G.surf.x=1800+z*2600;G.t=perm*(40+z*0.21);postTake();}
    albumAll().forEach(function(a){postSign(a);});
    postChoose(albumAll()[0],1,2);postGlyph(albumAll()[0],4);postGlyph(albumAll()[0],17);
    var w0=mailWire(albumAll()[0]), w1=mailWire(albumAll()[1]), w2=mailWire(albumAll()[2]);
    mailPush("a1b2c3d4e5f6",w0,true);
    mailPush("a1b2c3d4e5f6",w1,false);
    mailPush("a1b2c3d4e5f6",w2,true);
    mailPush("0f0e0d0c0b0a",w1,false);
    mailOpen=0;
    run(4,updateSurface,drawSurface);
    tableToggle(true,"mail");
  }else if(scene==="album"||scene==="pcback"){
    /* альбом (M188): шесть снимков одного мира — разные места и часы. Кадры
       рисует художник открытки, а не игра, поэтому стенд показывает ровно то,
       что увидит и получатель карточки */
    var pa=land("terran");G.mode="surface";
    var pera=CEL_DAY*(6+((pa.seed>>>7)&3));
    G.album=[];
    /* с M208 альбом собирается из ВОСЬМИ мест, а не из двух: стенд обязан
       показывать ту же пачку, что увидит игрок, иначе он проверяет не то */
    for(var q=0;q<4;q++){
      G.surf.x=1500+q*2300;G.t=pera*(40+q*0.19);
      postTake();
    }
    var sv=G.surf;
    G.land={p:pa,tr:sv.tr,x:sv.tr.W*0.3};G.surf=null;G.mode="landing";postTake();
    G.land=null;G.surf=sv;
    G.mode="cave";G.cave={x:520,y:140};postTake();
    G.mode="dig";G.cave=null;G.dig={p:pa,col:4,row:6};postTake();
    G.mode="belt";G.dig=null;G.belt={yaw:0.7,pitch:0.1};postTake();
    G.mode="system";G.belt=null;
    G.ship.x=(pa.x||0)+60;G.ship.y=(pa.y||0)+60;postTake();
    G.mode="surface";
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
