/* ══════════════ бой между кораблями (M361, §5) ══════════════
   У выстрела есть хозяин, и петля разрешает КАЖДУЮ пару, а не только «мой
   выстрел — чужой корпус»: пираты разных хозяев бьют друг друга, флот бьёт
   пиратов, свои (iff) не берутся в захват и под свой же огонь не попадают.
   Ранг — это поведение, а не множитель: здесь мерятся полосы дистанций, за
   которые роль не выходит, залп шакала, зов барона и уход подбитого. Всё
   считается без экрана, поэтому набор идёт и в узле. */
function cbWorld(){
  resetWorld();
  /* экран, оставшийся открытым от прошлого набора, гасит мышиную ветку
     штурвала (`helmScreenOpen`) — и следующий набор падает не своей виной */
  if(document.querySelectorAll)document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  G.ship.x=0;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ship.a=0;
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.marks=[];G.allies=[];
  G.fuel=100;G.hull=stat().hullMax;G.shield=0;G.engaged=false;
  for(const k in keys)keys[k]=false;
  HELM.key={};HELM.L=HELM.R=null;ctlReset();
  return G.ship;
}
function cbFoe(x,y,rank,owner,hp){
  const h=hp||100;
  const p={x,y,vx:0,vy:0,a:Math.PI,hull:h,hullMax:h,name:"Ц"+(G.pirates.length+1),
    rank:rank|0,seed:11+G.pirates.length*7,shipId:"p"+G.pirates.length,cool:0,aware:true,thrust:false};
  if(owner)p.owner=owner;
  G.pirates.push(p);return p;
}

TEST_SUITES.push(()=>suite("бой M361: у выстрела есть хозяин",()=>{
  cbWorld();
  /* свой выстрел остаётся своим: mine нужен рисунку и барже */
  G.shots=[];fireShot(0,0,0,9,5,true);
  eq(G.shots[0].owner,"player","true → хозяин player");
  ok(G.shots[0].mine,"…и mine для рисунка");
  G.shots=[];fireShot(0,0,0,9,5,false);
  eq(G.shots[0].owner,"pirate","false → хозяин pirate (старый вызов жив)");
  ok(!G.shots[0].mine,"чужой выстрел не мой");
  G.shots=[];fireShot(0,0,0,9,5,"fleet");
  eq(G.shots[0].owner,"fleet","строка идёт хозяином как есть");
  /* пират бьёт пирата, если хозяева разные */
  cbWorld();
  const a=cbFoe(300,0,1),b=cbFoe(320,0,1,"desert");
  G.shots=[{x:320,y:0,vx:8,vy:0,dmg:20,owner:"pirate",mine:false,life:100}];
  combatShots(1);
  ok(b.hull<100,"дезертир получил от пирата: "+Math.round(b.hull));
  eq(a.hull,100,"а свой по своему не попал");
  /* флот бьёт пирата, и награды за него нет */
  cbWorld();
  const c=cbFoe(300,0,0,null,10);
  const n0=(G.log||[]).length;
  G.shots=[{x:300,y:0,vx:8,vy:0,dmg:50,owner:"fleet",mine:false,life:100}];
  combatShots(1);
  ok(c.hull<=0,"пират разбит огнём флота");
  ok((G.log||[]).length>n0,"и об этом есть строка");
  /* выстрел флота по игроку не проходит вовсе */
  cbWorld();
  const h0=G.hull;
  G.shots=[{x:0,y:0,vx:8,vy:0,dmg:30,owner:"fleet",mine:false,life:100}];
  combatShots(1);
  eq(G.hull,h0,"свой огонь по своему кораблю не идёт");
  G.shots=[{x:0,y:0,vx:8,vy:0,dmg:30,owner:"pirate",mine:false,life:100}];
  combatShots(1);
  ok(G.hull<h0,"а пиратский идёт");
}));

TEST_SUITES.push(()=>suite("бой M361: корма дороже лба",()=>{
  cbWorld();
  /* цель носом по +x; выстрел летит туда же — значит, вошёл с кормы */
  const rear=cbFoe(400,0,1);rear.a=0;
  G.shots=[{x:400,y:0,vx:9,vy:0,dmg:10,owner:"player",mine:true,life:100}];
  combatShots(1);
  const dRear=100-rear.hull;
  cbWorld();
  const front=cbFoe(400,0,1);front.a=Math.PI;   /* нос навстречу выстрелу */
  G.shots=[{x:400,y:0,vx:9,vy:0,dmg:10,owner:"player",mine:true,life:100}];
  combatShots(1);
  const dFront=100-front.hull;
  near(dRear,10*HIT_REAR,1e-6,"в корму — ×1.6");
  near(dFront,10*HIT_FRONT,1e-6,"в лоб — ×.7");
  ok(dRear>dFront*2,"заходить за корму имеет смысл: "+dRear.toFixed(1)+" против "+dFront.toFixed(1));
  /* и то же правило бьёт по игроку */
  cbWorld();
  G.shield=0;G.hull=200;G.ship.a=0;
  G.shots=[{x:0,y:0,vx:9,vy:0,dmg:10,owner:"pirate",mine:false,life:100}];
  combatShots(1);
  near(200-G.hull,10*HIT_REAR,1e-6,"игроку в корму — тот же ×1.6");
}));

TEST_SUITES.push(()=>suite("бой M361: ранг — это поведение, а не число",()=>{
  /* девятьсот кадров на роль: первые шестьсот — подход, последние триста —
     та полоса, в которой роль живёт. Меряем и её, и разгон, и стрельбу.
     Числа в проверках — снятые, а не желаемые (браузерный замер 06.09.2026). */
  const band=(rank,start)=>{
    cbWorld();
    G.mods.weapon=0;                      /* игрок не стреляет: мерим только ход роли */
    const p=cbFoe(start,0,rank,null,1e6); /* корпус огромный: бегство не мешает мерке */
    let lo=1e9,hi=0,slo=1e9,shi=0,shots=0;
    for(let i=0;i<900;i++){
      G.t+=1;
      const s0=G.shots.length;
      updateCombat(1);
      shots+=Math.max(0,G.shots.length-s0);
      const d=Math.hypot(p.x-G.ship.x,p.y-G.ship.y);
      if(i>60){lo=Math.min(lo,d);hi=Math.max(hi,d);}
      if(i>600){slo=Math.min(slo,d);shi=Math.max(shi,d);}
      G.shots.length=0;                   /* выстрелы в этой мерке не нужны */
    }
    G.mods.weapon=0;
    return {lo:Math.round(lo),hi:Math.round(hi),slo:Math.round(slo),shi:Math.round(shi),shots};
  };
  const jack=band(0,700),vetIn=band(1,1500),vetOut=band(1,250),cap=band(2,300),bar=band(3,700);
  /* шакал: бросается вплотную и уходит после залпа */
  ok(jack.lo<160,"шакал доходит до ближнего боя: "+jack.lo);
  ok(jack.hi-jack.lo>400,"…и разрывает дистанцию: "+jack.lo+"…"+jack.hi);
  /* ветеран приходит в полосу 400–600 с любой стороны и остаётся в ней */
  ok(vetIn.shi<=700,"ветеран пришёл в полосу издалека: "+vetIn.slo+"…"+vetIn.shi);
  ok(vetOut.slo>=400,"…и вышел в неё изнутри: "+vetOut.slo+"…"+vetOut.shi);
  ok(vetOut.shi<=700,"…не проскочив насквозь: "+vetOut.shi);
  /* капитан не подходит ближе семисот даже стартовав вплотную */
  ok(cap.slo>=700,"капитан держит дистанцию: "+cap.slo+"…"+cap.shi);
  /* барон стоит */
  ok(bar.shi-bar.slo<40,"барон стоит, а не ходит: "+bar.slo+"…"+bar.shi);
  ok(bar.shots>=12&&bar.shots<=48,"…и бьёт очередями с паузой, а не без перерыва ("+bar.shots+")");
  const rows=[["шакал",jack],["ветеран",vetIn],["капитан",cap],["барон",bar]];
  for(const r of rows)ok(r[1].shots>0,r[0]+" за пятнадцать секунд стрелял ("+r[1].shots+")");
  TEST.lines.push("  · полосы: "+rows.map(r=>r[0]+" "+r[1].slo+"…"+r[1].shi).join(" · "));
}));

TEST_SUITES.push(()=>suite("бой M361: подбитый уходит, барон зовёт",()=>{
  cbWorld();
  const p=cbFoe(600,0,1);
  p.hull=p.hullMax*.2;                    /* под четвертью и один */
  let fled=false;
  for(let i=0;i<400&&!fled;i++){G.t+=1;updateCombat(1);fled=!G.pirates.includes(p);}
  ok(fled,"под четвертью корпуса и без своих — уходит в прыжок");
  eq(p.fled,1,"…и это уход, а не гибель");
  /* со своим рядом — держится */
  cbWorld();
  const q=cbFoe(600,0,1);q.hull=q.hullMax*.2;
  cbFoe(700,90,1);
  let gone=false;
  for(let i=0;i<200&&!gone;i++){G.t+=1;updateCombat(1);gone=!G.pirates.includes(q);}
  ok(!gone,"со своим рядом держится");
  /* барон на половине зовёт двух шакалов, и только раз */
  cbWorld();
  const b=cbFoe(700,0,3);
  b.hull=b.hullMax*.45;
  const n0=G.pirates.length;
  for(let i=0;i<10;i++){G.t+=1;updateCombat(1);}
  ok(G.pirates.length>n0,"барон позвал подмогу: "+n0+" → "+G.pirates.length);
  ok(G.pirates.filter(x=>x.rank===0).length>=1,"и это шакалы");
  eq(b.called,1,"зовёт один раз");
  const n1=G.pirates.length;
  for(let i=0;i<10;i++){G.t+=1;updateCombat(1);}
  ok(G.pirates.length<=n1,"второй раз не зовёт");
}));

TEST_SUITES.push(()=>suite("бой M361: потолок восьми и свои вне прицела",()=>{
  cbWorld();
  for(let i=0;i<ARMED_CAP;i++)cbFoe(900+i*40,0,0);
  eq(armedCount(),ARMED_CAP,"восемь вооружённых — это потолок");
  const b=cbFoe(700,120,3);b.hull=b.hullMax*.45;
  const n0=G.pirates.length;
  for(let i=0;i<10;i++){G.t+=1;updateCombat(1);}
  ok(G.pirates.length<=n0+1,"под потолком барон зовёт не больше, чем влезет: "+n0+" → "+G.pirates.length);
  /* свои: не цель ни для захвата, ни для автоогня */
  cbWorld();
  const own=cbFoe(300,0,1);own.iff=true;
  ok(!helmTargets().includes(own),"свой не попадает в список целей");
  helmLockNext();
  ok(!G.marks.includes(own),"…и в захват его не берут");
  G.marks.length=0;G.marks.push(own);G.mods.weapon=1;G.shots=[];fireCool=0;
  updateCombat(1);
  ok(!G.shots.some(s=>s.owner==="player"),"по своему пушка сама не бьёт");
  G.mods.weapon=0;
  /* и экипаж в системе помечен как свой */
  cbWorld();
  spawnAllies();
  ok((G.allies||[]).every(A=>A.iff===true),"каждый свой несёт iff");
}));

/* ══════════════ энергия, семь чисел, три щита (M362, §2 §4) ══════════════
   Одна шкала кормит выстрел, поле и маневровые; пустая — не смерть, а
   половина. Тип урона и повадка поля решают, ОТКУДА бить, а не сколько раз. */
TEST_SUITES.push(()=>suite("бой M362: энергия — одна шкала на всё",()=>{
  cbWorld();
  const st=stat();
  ok(st.energyMax>0,"ёмкость есть: "+st.energyMax);
  ok(st.energyRegen>0,"и восполнение: "+st.energyRegen);
  /* выстрел стоит энергии */
  G.mods.weapon=1;G.energy=st.energyMax;
  const foe=cbFoe(300,0,1,null,1e6);
  G.marks=[foe];G.shots=[];fireCool=0;
  const e0=G.energy;
  updateCombat(1);
  ok(G.shots.some(x=>x.owner==="player"),"пушка выстрелила");
  ok(G.energy<e0,"и это стоило энергии: "+e0.toFixed(1)+" → "+G.energy.toFixed(1));
  /* пустая шкала: откат вдвое, но огонь не пропадает */
  cbWorld();G.mods.weapon=1;
  const f2=cbFoe(300,0,1,null,1e6);G.marks=[f2];G.shots=[];fireCool=0;
  G.energy=stat().energyMax;updateCombat(1);const coolFull=fireCool;
  cbWorld();G.mods.weapon=1;
  const f3=cbFoe(300,0,1,null,1e6);G.marks=[f3];G.shots=[];fireCool=0;
  G.energy=0;updateCombat(1);const coolLow=fireCool;
  ok(G.shots.some(x=>x.owner==="player"),"на пустой шкале пушка всё равно стреляет");
  near(coolLow,coolFull*2,1e-6,"но откат вдвое длиннее ("+coolFull+" → "+coolLow+")");
  /* восполняется само */
  cbWorld();G.energy=0;
  for(let i=0;i<20;i++){G.t+=1;updateCombat(1);}
  ok(G.energy>0,"молчание восполняет шкалу: "+G.energy.toFixed(1));
  G.mods.weapon=0;
}));

TEST_SUITES.push(()=>suite("бой M362: тип урона и три повадки щита",()=>{
  /* матрица §2: кинетика по корпусу полностью, по щиту вполовину; энергия наоборот */
  near(dmgMul("kin",false),1,1e-9,"кинетика по корпусу — полностью");
  near(dmgMul("kin",true),.5,1e-9,"…по щиту — вполовину");
  near(dmgMul("en",false),.5,1e-9,"энергия по корпусу — вполовину");
  near(dmgMul("en",true),1,1e-9,"…по щиту — полностью");
  eq(dmgMul("blast",false),dmgMul("blast",true),"фугас — поровну");
  /* лобовое поле: вдвое в лоб, ничего в корму */
  /* угол меряется между курсом выстрела и носом цели: ноль — вошёл с кормы */
  near(shieldFace("front",Math.PI),2,1e-9,"лобовой держит лоб вдвое");
  near(shieldFace("front",0),0,1e-9,"…и не держит корму вовсе");
  near(shieldFace("solid",0),1,1e-9,"сплошной — ровно со всех сторон");
  /* и это видно в бою: лобового бьют в корму вдвое быстрее, чем в лоб */
  const kill=(type,fromBehind)=>{
    cbWorld();
    const p=cbFoe(400,0,1,null,200);
    p.a=fromBehind?0:Math.PI;              /* нос по +x — выстрел летит ему в корму */
    p.shieldMax=200;p.shield=200;p.shieldType=type;p.shieldHit=0;
    let n=0;
    while(p.hull>0&&n<4000){
      G.shots=[{x:400,y:0,vx:9,vy:0,dmg:10,owner:"player",mine:true,type:"kin",life:100}];
      combatShots(1);n++;
    }
    return n;
  };
  const rear=kill("front",true),face=kill("front",false);
  const solidR=kill("solid",true),solidF=kill("solid",false);
  ok(rear*2<=face,"лобового бьют в корму вдвое быстрее: "+rear+" против "+face);
  ok(rear<=solidR,"в корму лобовое поле не помогает вовсе: "+rear+" против "+solidR);
  ok(face>solidF,"а в лоб держит лучше сплошного: "+face+" против "+solidF);
  /* у сплошного разница между сторонами — только от места попадания (×1.6/×.7) */
  near(solidR/solidF,HIT_FRONT/HIT_REAR,.12,"сплошной: разница только от кормы и лба ("+solidR+"/"+solidF+")");
  /* импульсный не растёт понемногу — он возвращается целиком */
  cbWorld();
  const q=cbFoe(600,0,1,null,1e6);
  q.shieldMax=100;q.shield=10;q.shieldType="pulse";q.shieldHit=0;q.shieldPulse=0;
  for(let i=0;i<200;i++){G.t+=1;updateCombat(1);}
  eq(q.shield,10,"импульсный не восстанавливается понемногу");
  q.shieldPulse=SHIELD_PULSE;
  G.t+=1;updateCombat(1);
  eq(q.shield,q.shieldMax,"…а возвращается целиком");
}));

TEST_SUITES.push(()=>suite("бой M362: у орудия семь чисел, и они на карточке",()=>{
  cbWorld();
  const g=stat().gun;
  for(const k of ["dmg","type","cool","range","speed","cone","lead","spread"])
    ok(g[k]!==undefined,"у ствола есть "+k);
  ok(DMG_TYPES[g.type],"тип урона из таблицы: "+g.type);
  ok(g.range>200&&g.range<2000,"дальность в разумных пределах: "+g.range);
  ok(g.cone>0&&g.cone<1.2,"конус в разумных пределах: "+g.cone);
  /* разные стволы — разные числа: это seed части, а не одна таблица */
  const a=gunSpec(10,20,{seed:12345,tier:2},1),b=gunSpec(10,20,{seed:999,tier:2},1);
  ok(a.range!==b.range||a.cone!==b.cone||a.speed!==b.speed,"два ствола различаются числами");
  ok(gunSpec(10,20,{seed:12345,tier:4},1).spread<a.spread,"тир выше — разброс меньше");
  /* ствол ведёт метку внутри конуса, а не мгновенно */
  cbWorld();
  const sh=G.ship;sh.a=0;G.aim=0;
  const mk={x:sh.x+300,y:sh.y+300,vx:0,vy:0,hull:10};
  const g2=gunSpec(10,20,{seed:7,tier:1},1);
  const a1=gunAimTick(g2,sh,mk,1);
  ok(Math.abs(angDiff(a1,0))<=g2.lead+1e-9,"за кадр ствол проходит не больше скорости наводки");
  let ang=a1;for(let i=0;i<200;i++)ang=gunAimTick(g2,sh,mk,1);
  ok(Math.abs(angDiff(ang,sh.a))<=g2.cone+1e-6,"и никогда не выходит за конус");
  /* упреждение честное: по идущей цели ствол смотрит ВПЕРЁД неё */
  const mov={x:sh.x+600,y:sh.y,vx:0,vy:3,hull:10};
  const lead=gunLeadAngle(sh.x,sh.y,mov,9);
  ok(lead>Math.atan2(0,600),"по идущей цели ствол берёт упреждение: "+lead.toFixed(3));
  /* промах — это угол, и он растёт с дальностью */
  /* и это видно в попаданиях, а не только в числе: кривая замерена в браузере
     06.09.2026 — в упор наверняка, на пределе примерно треть */
  const rate=(g,dist)=>{
    let hit=0;const N=400;
    const rr=rng(4242);
    for(let k=0;k<N;k++){
      const tgt={x:dist,y:0,vx:0,vy:0};
      const ang=gunLeadAngle(0,0,tgt,g.speed)+gunMiss(g,dist,0,rr());
      const vx=Math.cos(ang)*g.speed,vy=Math.sin(ang)*g.speed;
      let x=0,y=0;
      for(let f=0;f<Math.ceil(g.range/g.speed)+10;f++){
        x+=vx;y+=vy;
        if(Math.hypot(x-tgt.x,y-tgt.y)<20){hit++;break;}
      }
    }
    return Math.round(hit/N*100);
  };
  const gb=stat().gun;
  const near200=rate(gb,200),far=rate(gb,Math.min(gb.range-20,740));
  ok(near200>=90,"в упор стартовый ствол не мажет: "+near200+"%");
  ok(far>=20&&far<=60,"на пределе — примерно треть, есть повод подойти: "+far+"%");
  ok(near200-far>=30,"кривая попаданий действительно падает с дальностью");
  const near0=Math.abs(gunMiss(g2,10,0,1)),far0=Math.abs(gunMiss(g2,g2.range,0,1));
  ok(far0>near0,"дальше — больше ошибка: "+near0.toFixed(4)+" → "+far0.toFixed(4));
  eq(gunMiss(g2,100,0,.5),0,"по центру броска ошибки нет");
}));

/* ══════════════ подвесы, допуск, группы (M363, §3 §11.4) ══════════════
   Точка на корпусе теперь знает свой размер и свою повадку, часть — свой
   размер, а игрок — свой допуск. Здесь мерится, что из этого во что встаёт и
   что при этом говорят игроку: «не встаёт» без причины — не ответ. */
function cbGun(seed,tier){
  /* через addPart, а не push: идентификатор части выдаёт именно он, а без
     него partById/isFitted работают по undefined и врут */
  const p=genPart(seed,tier,"gun");
  addPart(p);
  return p;
}
TEST_SUITES.push(()=>suite("оснастка M363: подвес знает размер и повадку",()=>{
  cbWorld();
  const ms=mountsOf(G.shipId);
  ok(ms.length>0,"у корпуса есть подвесы: "+ms.length);
  for(const m of ms){
    ok(MOUNT_SIZES.indexOf(m.size)>=0,"размер из таблицы: "+m.size);
    ok(!!MOUNT_KINDS[m.mount],"повадка из таблицы: "+m.mount);
  }
  /* жёсткая уже смотрит и сильнее бьёт — это правка поверх семи чисел */
  const g=stat().gun;
  const fix=gunOnMount(g,{mount:"fix"}),tur=gunOnMount(g,{mount:"turret"});
  ok(fix.cone<g.cone,"жёсткая смотрит уже: "+fix.cone+" против "+g.cone);
  near(fix.dmg,g.dmg*MOUNT_KINDS.fix.dmg,1e-9,"…и бьёт сильнее");
  eq(tur.cone,g.cone,"турель числа не трогает");
  /* тяжёлое в лёгкое не встаёт, лёгкое в тяжёлое встаёт всегда */
  const light={kind:"gun",seed:0,tier:1},heavy={kind:"gun",seed:0xFFFFFFFF,tier:5};
  eq(partSize(light),"L","обычный ствол лёгкий");
  eq(partSize(heavy),"H","легендарный тяжёлый");
  ok(mountTakes({kind:"gun",size:"H",mount:"fix"},light),"лёгкое в тяжёлый подвес — встаёт");
  ok(!mountTakes({kind:"gun",size:"L",mount:"fix"},heavy),"тяжёлое в лёгкий — нет");
  ok(mountWhyNot({kind:"gun",size:"L",mount:"fix"},heavy).indexOf("подвес")>=0,
     "и отказ называет причину: "+mountWhyNot({kind:"gun",size:"L",mount:"fix"},heavy));
  /* пусковая размерного правила не знает: подвес у неё один */
  ok(mountTakes({kind:"missile",size:"L",mount:"fix"},{kind:"missile",seed:9,tier:5}),
     "тяжёлая пусковая встаёт в свой единственный подвес");
}));

TEST_SUITES.push(()=>suite("оснастка M363: допуск вместо уровней",()=>{
  cbWorld();
  G.clearance=1;G.kills=0;G.flownMs=0;G.coop=null;
  eq(clearanceNow(),1,"с начала — первый допуск");
  /* отменный ствол ждёт второго, легендарный — третьего */
  const t4={kind:"gun",seed:5,tier:4},t5={kind:"gun",seed:5,tier:5},t2={kind:"gun",seed:5,tier:2};
  eq(partClearance(t2),1,"добротный ствол — первый допуск");
  eq(partClearance(t4),2,"отменный — второй");
  eq(partClearance(t5),3,"легендарный — третий");
  ok(partSealed(t4),"отменный опечатан");
  ok(!partSealed(t2),"добротный — нет");
  ok(sealedWhy(t4).indexOf("экзамен")>=0,"и написано, чего он ждёт: "+sealedWhy(t4));
  /* ворота II: экзамен и десять сбитых; одного из двух мало */
  G.kills=CLR_KILLS;
  eq(clearanceEarned(),1,"сбитые без экзамена — ещё не допуск");
  G.coop={name:"Артель"};
  eq(clearanceEarned(),2,"экзамен и десять сбитых — второй");
  eq(clearanceNow(),2,"…и он записан");
  ok(!partSealed(t4),"отменный ствол открыт");
  /* ворота III: сто часов налёта */
  ok(partSealed(t5),"легендарный ещё опечатан");
  G.flownMs=CLR_HOURS*3600000;
  eq(clearanceNow(),3,"сто часов налёта — третий");
  ok(!partSealed(t5),"и легендарный открыт");
  /* допуск не падает */
  G.kills=0;G.coop=null;G.flownMs=0;
  eq(clearanceNow(),3,"заработанное не отбирают");
  /* налёт копится только в полёте */
  G.flownMs=0;G.running=true;G.mode="dock";clrTick(5000);
  eq(G.flownMs,0,"на станции время не идёт");
  G.mode="system";clrTick(1000);
  eq(G.flownMs,1000,"в полёте идёт");
  G.clearance=1;G.kills=0;G.coop=null;G.flownMs=0;
}));

TEST_SUITES.push(()=>suite("оснастка M363: ствол встаёт в подвес, а не куда попало",()=>{
  cbWorld();
  G.clearance=4;
  const slots=slotsOf(G.shipId);
  const gunSlots=[];slots.forEach((k,i)=>{if(k==="gun")gunSlots.push(i);});
  ok(gunSlots.length>0,"на корпусе есть орудийный подвес");
  /* лёгкий ствол встаёт и снимается */
  const p=cbGun(1234,1);
  ok(fitPart(gunSlots[0],p.id),"лёгкий ствол встал");
  ok(isFitted(p.id),"…и числится установленным");
  eq(stat().guns.length,1,"stat() видит один ствол");
  ok(stat().gunTot.hull>0,"и считает урон/с по корпусу: "+stat().gunTot.hull);
  unfitPart(gunSlots[0]);
  ok(!isFitted(p.id),"снялся");
  /* опечатанный не встаёт вовсе */
  G.clearance=1;G.kills=0;G.coop=null;
  const heavy=cbGun(777,5);
  ok(partSealed(heavy),"легендарный опечатан при первом допуске");
  ok(!fitPart(gunSlots[0],heavy.id),"и в подвес не идёт");
  G.clearance=4;
  /* размер подвеса решает */
  let placed=false,refused=false;
  for(const i of gunSlots){
    const m=mountAt(G.shipId,i);
    if(!m)continue;
    if(mountTakes(m,heavy)){if(fitPart(i,heavy.id)){placed=true;unfitPart(i);}}
    else if(!fitPart(i,heavy.id))refused=true;
  }
  ok(placed||refused,"тяжёлый ствол либо встал в тяжёлый подвес, либо отказ по размеру");
  G.inv=G.inv.filter(x=>x!==p&&x!==heavy);
  G.clearance=1;
}));

TEST_SUITES.push(()=>suite("оснастка M363: группы выбирают себя сами",()=>{
  cbWorld();
  const far={slot:0,g:{range:1200,cone:.5,dmg:5,cool:20,type:"kin",speed:9,lead:.2,spread:.05}};
  const near2={slot:1,g:{range:400,cone:.5,dmg:5,cool:20,type:"kin",speed:9,lead:.2,spread:.05}};
  const list=[far,near2];
  eq(gunGroupOf(list,0),1,"дальний ствол — в «дальнее»");
  eq(gunGroupOf(list,1),2,"ближний — в «ближнее»");
  eq(gunsInGroup(list,0).length,2,"«всё» — оба");
  eq(gunsInGroup(list,1).length,1,"«дальнее» — один");
  /* далёкая метка: работает дальняя группа, близкая — обе */
  G.gunPin=false;
  const sh=G.ship;sh.x=0;sh.y=0;sh.a=0;
  eq(gunGroupPick(list,sh,{x:900,y:0,hull:10}),1,"метка на девятистах — «дальнее»");
  eq(gunGroupPick(list,sh,{x:300,y:0,hull:10}),0,"метка на трёхстах — достают оба, значит «всё»");
  /* закреплённая группа не переключается */
  G.gunPin=true;G.gunGroup=2;
  eq(gunGroupPick(list,sh,{x:900,y:0,hull:10}),2,"закреплённую не трогают");
  G.gunPin=false;G.gunGroup=0;
}));

TEST_SUITES.push(()=>suite("оснастка M363: стрельбище — минута и честные числа",()=>{
  cbWorld();
  if(!G.sys||!G.sys.station){ok(true,"в этой системе нет причала — стрельбища тоже");return;}
  ok(rangeCanHere(),"у причала есть стрельбище");
  ok(rangeStart(),"минута началась");
  ok(rangeOn(),"стрельбище идёт");
  const t=G.pirates.find(p=>p.dummy);
  ok(!!t,"мишень на месте");
  eq(G.marks[0],t,"и сразу взята в захват");
  /* мишень не оживает: сто кадров — и она всё так же ничего не знает */
  for(let i=0;i<100;i++){G.t+=1;updateCombat(1);}
  ok(!t.aware,"мишень о вас не знает и не стреляет");
  ok(!G.shots.some(s=>s.owner==="pirate"),"по вам никто не бьёт");
  /* попадания считаются */
  G.range.shots=0;G.range.hits=0;G.range.dmg=0;
  G.shots=[{x:t.x,y:t.y,vx:9,vy:0,dmg:10,owner:"player",mine:true,type:"kin",life:100}];
  combatShots(1);
  eq(G.range.hits,1,"попадание сосчитано");
  ok(G.range.dmg>0,"и урон тоже: "+G.range.dmg.toFixed(1));
  /* минута кончилась — мишени нет, отчёт в журнале */
  G.range.left=0;
  const n0=(G.log||[]).length;
  rangeTick(1);
  ok(!rangeOn(),"минута кончилась");
  ok(!G.pirates.some(p=>p.dummy),"мишень убрана");
  ok((G.log||[]).length>n0,"отчёт записан");
  /* стрельбище возвращает к причалу — экран станции закрываем за собой */
  if(document.querySelectorAll)document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
}));
