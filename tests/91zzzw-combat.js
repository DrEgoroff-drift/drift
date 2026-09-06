/* ══════════════ бой между кораблями (M361, §5) ══════════════
   У выстрела есть хозяин, и петля разрешает КАЖДУЮ пару, а не только «мой
   выстрел — чужой корпус»: пираты разных хозяев бьют друг друга, флот бьёт
   пиратов, свои (iff) не берутся в захват и под свой же огонь не попадают.
   Ранг — это поведение, а не множитель: здесь мерятся полосы дистанций, за
   которые роль не выходит, залп шакала, зов барона и уход подбитого. Всё
   считается без экрана, поэтому набор идёт и в узле. */
function cbWorld(){
  resetWorld();
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
