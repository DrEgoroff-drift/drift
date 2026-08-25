/* ══════════════ автотесты: наборы ══════════════ */
/* По одному набору на механику. Каждый начинается с resetWorld(): наборы не
   должны зависеть от порядка запуска. */

/* ── станция и экран корабля: выход не должен ронять игрока в открытый космос ── */
TEST_SUITES.push(()=>suite("станция ↔ экран корабля",()=>{
  resetWorld();
  G.sys=nearestStation(0,0);G.sx=G.sys.sx;G.sy=G.sys.sy;
  ok(!!G.sys.station,"в стартовом секторе есть станция");
  G.ship.x=G.sys.station.x;G.ship.y=G.sys.station.y;
  openStation();
  eq(G.mode,"dock","после стыковки режим dock");
  /* путь «МОДУЛИ → ОСНАСТКА КОРПУСА → ОТКРЫТЬ» */
  svReturn="station";$st.classList.remove("open");openShipView();
  ok($sv.classList.contains("open"),"экран корабля открыт");
  document.getElementById("svClose").click();
  ok(!$sv.classList.contains("open"),"экран корабля закрыт");
  ok($st.classList.contains("open"),"вернулись в терминал станции, а не в космос");
  eq(G.mode,"dock","режим по-прежнему dock");
  closeStation();
  eq(G.mode,"system","отстыковка возвращает управление");
}));

/* ── автопилот: должен доводить до цели, а не наматывать круги ── */
TEST_SUITES.push(()=>suite("автопилот доводит до планеты",()=>{
  resetWorld();
  const p=G.sys.planets[0];
  ok(!!p,"в стартовой системе есть планета");
  G.ship.x=p.x+1800;G.ship.y=p.y+1200;G.ship.vx=0;G.ship.vy=0;
  G.fuel=100;
  G.ap={kind:"planet",p};
  let n=0;
  while(G.ap&&n<6000){runAutopilot(1,stat());updateSystem(0);n++;
    if(G.ap)G.ship.x+=G.ship.vx,G.ship.y+=G.ship.vy;}
  ok(n<6000,"автопилот завершился за разумное время ("+n+" кадров)");
  ok(!!G.orbit,"по прибытии захвачена орбита");
  if(G.orbit){
    const d=Math.hypot(G.ship.x-p.x,G.ship.y-p.y)-p.radius;
    ok(d<160,"корабль у самой планеты ("+Math.round(d)+" ед. над поверхностью)");
  }
}));

/* ── орбита: нос смотрит по касательной, «над планетой», а не в неё ── */
TEST_SUITES.push(()=>suite("на орбите нос идёт по касательной",()=>{
  resetWorld();
  const p=G.sys.planets[0];
  G.orbit={p,r:p.radius+90,ang:0,w:.01};
  updateSystem(1);
  const toPlanet=Math.atan2(p.y-G.ship.y,p.x-G.ship.x);
  const off=Math.abs(angDiff(G.ship.a,toPlanet));
  ok(off>1.2,"угол между носом и направлением на планету близок к прямому ("+off.toFixed(2)+" рад)");
}));

/* ── пещеры: вход есть на каждой планете и находится навигатором ── */
TEST_SUITES.push(()=>suite("пещеры на месте",()=>{
  resetWorld();
  let with_=0,total=0;
  for(let i=0;i<12;i++){
    resetWorld();G.sx=i;G.sy=0;G.sys=getSystem(i,0);
    const p=G.sys.planets.find(x=>x.type!=="gas");
    if(!p)continue;
    total++;
    const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    if(G.surf.cave)with_++;
  }
  ok(total>0,"нашлось "+total+" твёрдых планет для проверки");
  eq(with_,total,"вход в пещеру есть на каждой");
  /* и вход реально срабатывает */
  G.surf.x=G.surf.cave.x;
  actEdge=true;updateSurface(1);
  eq(G.mode,"cave","подошли ко входу и провалились внутрь");
  exitCave();
  eq(G.mode,"surface","и вышли обратно");
}));

/* ── телепорт к кораблю: без покупки науки, с перезарядкой ── */
TEST_SUITES.push(()=>suite("маяк-телепорт",()=>{
  resetWorld();
  landOnTestPlanet();
  ok(!G.tech.has("beacon"),"наука «маяк» не куплена");
  G.surf.x=G.surf.tr.W-100;                 // ушли далеко от корабля
  enterDig();
  steps(30,updateDig);
  const deep=G.dig.row;
  useBeacon();
  eq(G.mode,"surface","телепорт вернул на поверхность из шахты");
  near(G.surf.x,G.surf.shipX,1,"стоим у корабля");
  ok(G.surf.beacon>0,"маяк ушёл на перезарядку");
  const wasCool=G.surf.beacon;
  useBeacon();
  eq(G.surf.beacon,wasCool,"повторный телепорт до конца зарядки не срабатывает");
  G.surf.beacon=0;G.tech.add("beacon");
  useBeacon();
  ok(G.surf.beacon<wasCool,"с наукой перезарядка короче");
  ok(deep>=0,"глубина считалась");
}));

/* ── шахта: WASD, лесенки, скорость ── */
TEST_SUITES.push(()=>suite("шахта: управление и темп",()=>{
  resetWorld();
  landOnTestPlanet();
  enterDig();
  eq(G.dig.row,0,"начали с устья");
  /* S (ТОРМ) — вниз */
  keys.brake=true;steps(400,updateDig);keys.brake=false;
  ok(G.dig.row>0,"на ТОРМ/S прокопались вниз (ряд "+G.dig.row+")");
  const rowAfterDown=G.dig.row;
  ok(G.dig.cells[G.dig.col+","+rowAfterDown].ladder,"в вертикальном ходе осталась лесенка");
  /* D — вбок */
  const col0=G.dig.col;
  keys.right=true;steps(400,updateDig);keys.right=false;
  ok(G.dig.col>col0,"на D ушли вправо");
  /* W — вверх, до выхода на поверхность */
  keys.thrust=true;
  let n=0;while(G.mode==="dig"&&n<3000){actEdge=false;updateDig(1);n++;}
  keys.thrust=false;
  eq(G.mode,"surface","на W поднялись до устья и вышли на поверхность");
}));

TEST_SUITES.push(()=>suite("шахта: скорость проходки платная",()=>{
  resetWorld();
  landOnTestPlanet();
  const dig=()=>{
    enterDig();keys.brake=true;
    let n=0;while(G.dig.row<3&&n<20000){actEdge=false;updateDig(1);n++;}
    keys.brake=false;const r=G.dig.row;G.dig=null;G.mode="surface";
    G.surf.suit=100;
    return r>=3?n:Infinity;
  };
  const slow=dig();
  /* три метра — примерно три секунды при 60 кадрах: работа, а не прокрутка */
  ok(slow>150,"без модулей три метра даются не мгновенно ("+slow+" кадров)");
  G.mods.drill=3;G.modsOwned.drill=3;
  const fast=dig();
  ok(fast<slow*.8,"буровая установка за кредиты заметно ускоряет ("+fast+" против "+slow+")");
}));

/* ── кусачие в шахте: заводятся, кусают, глушатся, дают образец ── */
TEST_SUITES.push(()=>suite("кусачие в шахте",()=>{
  resetWorld();
  landOnTestPlanet();
  /* верхний пласт упирается в 15 рядов — проверяем, что кусачие успевают
     встретиться уже в нём, иначе игрок без глубинного бура их не увидит вовсе */
  let met=0;
  for(let i=0;i<8;i++){
    G.dig=null;G.mode="surface";G.surf.suit=100;G.surf.x=300+i*370;
    enterDig();G.dig.p={...G.dig.p,seed:G.dig.p.seed+i*1013};
    keys.brake=true;
    let n=0;while(G.mode==="dig"&&G.dig.row<14&&n<8000){actEdge=false;updateDig(1);n++;
      if(G.surf.suit<40)G.surf.suit=100;}
    keys.brake=false;
    if(G.dig&&G.dig.bugs.length)met++;
    if(met&&i>=3)break;
  }
  ok(met>0,"кусачие встречаются уже в верхнем пласте (в "+met+" заходах из проверенных)");
  keys.brake=false;
  if(G.dig&&!G.dig.bugs.length){   // для дальнейших проверок подсаживаем вручную
    const r=rng(1234),b=genBeast(r,G.dig.p,0,0);
    b.r=8;b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
    b.x=G.dig.col*DIG_CELL+DIG_CELL/2;b.y=G.dig.row*DIG_CELL+DIG_CELL/2;
    G.dig.bugs.push(b);
  }
  if(G.dig&&G.dig.bugs.length){
    const b=G.dig.bugs[0];
    /* ставим вплотную и бьём импульсом */
    b.x=G.dig.col*DIG_CELL+DIG_CELL/2;b.y=G.dig.row*DIG_CELL+DIG_CELL/2;
    const n0=G.dig.bugs.length,data0=G.data;
    keys.fire=true;digFauna(1,stat());keys.fire=false;
    ok(b.stun>0,"ОГОНЬ оглушает того, кто рядом");
    /* стоящего вплотную забирает сразу тем же импульсом; отошедшего — как подойдёшь */
    if(G.dig.bugs.length===n0)digFauna(1,stat());
    ok(G.dig.bugs.length<n0&&G.data>data0,
       "оглушённый подбирается сам, вплотную — образец в трюме, данные начислены");
  }
}));

/* ── подсказки на поверхности ── */
TEST_SUITES.push(()=>suite("подсказки на планете",()=>{
  resetWorld();
  landOnTestPlanet();
  G.surf.x=G.surf.shipX;
  const h=surfaceHint();
  ok(!!h&&/БАЗУ/.test(h),"у корабля подсказывают, что можно заложить базу: "+h);
  G.surf.x=G.surf.cave.x;
  ok(/ПЕЩЕР/.test(surfaceHint()||""),"у входа в пещеру подсказка про пещеру");
  G.surf.x=G.surf.shipX+400;G.surf.suit=20;
  ok(/СКАФАНДР/.test(surfaceHint()||""),"на исходе скафандра предупреждают первым делом");
}));

/* Пещера, выпавшая на пятачок посадки, недоступна: и подсказка, и ДЕЙСТВИЕ
   там принадлежат кораблю. Отступ считается генератором, а не подразумевается */
TEST_SUITES.push(()=>suite("вход в пещеру не ложится на корабль",()=>{
  resetWorld();
  for(let i=0;i<40;i++){
    const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
    p.seed=(p.seed^(0x77+i*2654435761))>>>0;
    delete p.biome;delete p.flora;delete p.fauna3;delete p.caveFlora;
    const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    const S=G.surf;
    if(!S.cave)continue;
    ok(Math.abs(S.cave.x-S.shipX)>shipZoneR()+34,
       "устье вне зоны корабля (отступ "+Math.round(Math.abs(S.cave.x-S.shipX))+")");
    S.x=S.cave.x;
    ok(/ПЕЩЕР/.test(surfaceHint()||""),"и подсказка про пещеру доходит");
  }
}));

/* ── музыка: сцены космоса и планет должны различаться ── */
TEST_SUITES.push(()=>suite("музыка меняется по местам",()=>{
  resetWorld();
  const space=musicSceneNow();
  eq(space[0],"system","в космосе сцена system");
  landOnTestPlanet();
  const surf=musicSceneNow();
  ok(surf[0]!=="system","на планете сцена своя: "+surf[0]);
  ok(surf[1].root!==space[1].root||surf[1].scale!==space[1].scale,
     "тоника или лад отличаются от космических");
  ok(Math.abs(surf[1].root-space[1].root)>=4,
     "тоника уведена заметно ("+surf[1].root+" против "+space[1].root+")");
  /* разные планеты — разная музыка */
  const keysSeen={};let uniq=0;
  for(let i=0;i<10;i++){
    const sys=getSystem(i,1);
    for(const p of sys.planets){
      const sc=planetScene(p),k=sc.scale+":"+sc.root+":"+sc.bpm;
      if(!keysSeen[k]){keysSeen[k]=1;uniq++;}
    }
  }
  ok(uniq>=6,"у разных планет разные палитры (уникальных: "+uniq+")");
  /* шахта и пещера тоже не космос */
  enterDig();
  ok(musicSceneNow()[0].indexOf("dig")===0,"в шахте своя сцена");
  exitDig();
  enterCave();
  ok(musicSceneNow()[0].indexOf("cave")===0,"в пещере своя сцена");
  exitCave();
}));

/* ══════════════ первая минута: цель, которую нельзя потерять ══════════════
   Из отчёта плейтестера 26.08.2026. Три его находки оказались одной болезнью:
   игра предлагает цель и тут же её теряет.
   · «Ткнул в метку у края экрана — ничего»: фишки компаса рисовались на канве,
     а тычок искал только тела в мире. Вещь, похожая на кнопку, обязана ею быть.
   · «Дважды подряд промахнулся по движущейся цели»: порог попадания считался
     в единицах МИРА (radius+40/Z), поэтому на отдалении по планете размером с
     горошину попасть было нельзя.
   · И худшее: промах ставил G.ap=null, то есть один мимо-тычок отменял полёт,
     к которому игрок уже летел. */
TEST_SUITES.push(()=>suite("система: по метке можно ткнуть, промах цель не отменяет",()=>{
  resetWorld();
  G.mode="system";G.ap=null;
  /* улетаем на отшиб — ровно то состояние, в котором тестировщик решил, что
     игра сломана: в кадре нет ни одного тела, только фишки у кромки */
  G.ship.x=9000;G.ship.y=-7000;
  drawSystem();
  ok(SYS_CHIPS.length>=2,"в пустоте у кромки есть фишки ("+SYS_CHIPS.length+")");
  ok(SYS_CHIPS.some(c=>c.t&&c.t.kind==="planet"),"среди них ближайшая планета — есть куда лететь");
  for(const c of SYS_CHIPS)ok(c.h>=44,"фишка дотягивает до 44 px под палец ("+Math.round(c.h)+")");

  const cp=SYS_CHIPS.find(c=>c.t&&c.t.kind==="planet");
  tap(cp.x+cp.w/2,cp.y+cp.h/2);
  ok(G.ap&&G.ap.kind==="planet","тычок в фишку планеты ставит автопилот");
  const was=G.ap;

  /* промах по пустоте: цель обязана остаться */
  tap(W/2+2,H/2-60);
  eq(G.ap,was,"промах по пустоте цель не отменяет");

  /* а намеренное движение рукой — отменяет, иначе цель не снять вовсе */
  dispatchEvent(new KeyboardEvent("keydown",{key:"w",code:"KeyW"}));
  ok(!G.ap,"ручная тяга автопилот снимает");
  dispatchEvent(new KeyboardEvent("keyup",{key:"w",code:"KeyW"}));

  /* попадание меряется на экране, а не в мире: планета в полкадра ловится
     тычком рядом с краем диска при любом масштабе */
  const p=G.sys.planets[0];
  G.ship.x=p.x+300;G.ship.y=p.y;G.ap=null;
  drawSystem();
  const sx=W/2+(p.x-G.viewCX)*G.zoom, sy=H/2+(p.y-G.viewCY)*G.zoom;
  tap(sx+p.radius*G.zoom+20,sy);
  ok(G.ap&&G.ap.kind==="planet","тычок в 20 px от края диска — попадание");
  G.ap=null;G.ship.x=0;G.ship.y=-760;
}));
