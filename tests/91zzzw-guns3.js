/* ══════════════ ещё семь семейств (M365, §2.1) ══════════════
   Роли «резать щит» и «держать дистанцию». Здесь мерится не число, а то, что
   каждое из них МЕНЯЕТ В БОЮ: игла проходит поле насквозь, сифон переливает
   поле в ваше, импульсник гасит его на две секунды, буровой не замечает поля
   вовсе и ест породу из трюма, толкатель расталкивает без урона, миномёт
   кладёт мину за корму, помеховая гасит осведомлённость.

   Мир и цели берутся из `gnWorld`/`gnFoe` (91zzzw-guns2): один набор фикстур
   на все семейства, иначе две развёртки разойдутся. */
function gn5Foe(x,y,shield){
  const p=gnFoe(x,y,1e6);
  p.shieldMax=shield===undefined?200:shield;
  p.shield=p.shieldMax;
  p.shieldType="solid";p.shieldOff=0;p.jamT=0;
  return p;
}

TEST_SUITES.push(()=>suite("орудия M365: игла, сифон, импульсник",()=>{
  /* игла: часть проходит поле насквозь и садится в корпус */
  gnWorld();
  const a=gn5Foe(240,0,200);
  G.shots=[];
  gunFireOnce(gnGun("needle"),G.ship,a,0,()=>.1);   /* .1 < pass → все проходят */
  eq(G.shots.length,GUN_FAMILY.needle.needles,"игольник кладёт пять игл за нажатие");
  ok(G.shots.every(s=>s.pass===1),"при удачном броске игла помечена как проходящая");
  const hull0=a.hull,sh0=a.shield;
  for(const s of G.shots){s.x=a.x;s.y=a.y;}
  combatShots(1);
  ok(a.hull<hull0,"прошедшая игла села прямо в корпус: "+(hull0-a.hull).toFixed(2));
  eq(a.shield,sh0,"…а поле её даже не заметило");
  /* неудачный бросок — игла вязнет в поле */
  gnWorld();
  const b=gn5Foe(240,0,200);
  G.shots=[];
  gunFireOnce(gnGun("needle"),G.ship,b,0,()=>.9);   /* .9 > pass → ни одна не проходит */
  ok(G.shots.every(s=>!s.pass),"при неудачном броске игла обычная");
  const bh=b.hull;
  for(const s of G.shots){s.x=b.x;s.y=b.y;}
  combatShots(1);
  ok(b.shield<200,"такая игла садится в поле: "+(200-b.shield).toFixed(2));
  eq(b.hull,bh,"и до корпуса не доходит");
  /* сифон: поле цели перетекает в ваше, урона нет */
  gnWorld();
  const c=gn5Foe(240,0,200);
  G.mods.armor=0;G.shield=0;
  const stMax=stat().shieldMax;
  const ch=c.hull,cs=c.shield;
  gunFireOnce(gnGun("siphon"),G.ship,c,0,()=>.5);
  ok(c.shield<cs,"поле цели убыло: "+(cs-c.shield).toFixed(2));
  eq(c.hull,ch,"а корпус её не тронут — у сифона урона нет");
  if(stMax>0)ok(G.shield>0,"и ваше поле подросло: "+G.shield.toFixed(2));
  else ok(true,"своего поля нет — перетекать некуда, и это не ошибка");
  /* импульсник: поле в ноль на две секунды, и оно не растёт, пока горит счётчик */
  gnWorld();
  const d=gn5Foe(240,0,200);
  d.shieldHit=0;
  gunFireOnce(gnGun("pulse"),G.ship,d,0,()=>.5);
  eq(d.shield,0,"поле погашено разом");
  ok(d.shieldOff>0,"и на две секунды выключено: "+d.shieldOff);
  for(let i=0;i<30;i++){G.t+=1;updateCombat(1);}
  eq(d.shield,0,"пока счётчик горит, поле не растёт");
  const off=d.shieldOff;
  ok(off<SHIELD_OFF,"…но счётчик идёт: "+SHIELD_OFF+" → "+off);
}));

TEST_SUITES.push(()=>suite("орудия M365: буровой, толкатель",()=>{
  /* буровой: полю безразличен, ест породу, бьёт в упор */
  gnWorld();
  const a=gn5Foe(60,0,200);
  G.cargo.iron=5;
  const drill=gnGun("drill");
  ok(drill.range<220,"буровому надо в упор: "+drill.range);
  eq(drill.en,0,"и он не ест энергию вовсе");
  const sh0=a.shield,h0=a.hull,ore0=G.cargo.iron;
  gunFireOnce(drill,G.ship,a,0,()=>.5);
  eq(a.shield,sh0,"поле цели буровой не трогает");
  ok(a.hull<h0,"а корпус режет: "+(h0-a.hull).toFixed(2));
  ok(G.cargo.iron<ore0,"и списывает породу из трюма");
  /* без породы не включается */
  G.cargo.iron=0;
  const h1=a.hull;
  eq(gunFireOnce(drill,G.ship,a,0,()=>.5),false,"без породы буровой не стреляет");
  eq(a.hull,h1,"и цели ничего не досталось");
  /* толкатель: урона нет, но всё в конусе отлетает */
  gnWorld();
  const b=gn5Foe(200,0,0);
  b.vx=0;b.vy=0;
  const bh=b.hull;
  const push=gnGun("shove");
  eq(push.dmg,0,"у толкателя урона нет");
  gunFireOnce(push,G.ship,b,0,()=>.5);
  eq(b.hull,bh,"и цель цела");
  ok(Math.hypot(b.vx,b.vy)>.3,"но отлетела: "+Math.hypot(b.vx,b.vy).toFixed(2));
  /* и чужие снаряды тоже сносит */
  gnWorld();
  gn5Foe(600,0,0);
  G.shots=[{x:120,y:0,vx:-6,vy:0,dmg:5,owner:"pirate",mine:false,type:"kin",life:100}];
  const vx0=G.shots[0].vx;
  gunFireOnce(gnGun("shove"),G.ship,null,0,()=>.5);
  ok(G.shots[0].vx>vx0,"чужой снаряд сдуло: "+vx0.toFixed(2)+" → "+G.shots[0].vx.toFixed(2));
}));

TEST_SUITES.push(()=>suite("орудия M365: миномёт и помеховая",()=>{
  /* мина ложится за корму и ждёт */
  gnWorld();
  G.gmines=[];
  G.ship.a=0;
  gunFireOnce(gnGun("mortar"),G.ship,null,0,()=>.5);
  eq((G.gmines||[]).length,1,"мина легла — метка ей не нужна");
  const m=G.gmines[0];
  ok(m.x<G.ship.x,"и легла ЗА кормой: "+Math.round(m.x));
  ok(m.arm>0,"первые кадры она ещё не взведена");
  ok(m.life>3000,"а живёт минуту: "+m.life);
  /* взведённая рвётся, когда рядом чужой, и достаётся всем в радиусе */
  gnWorld();
  G.gmines=[{x:0,y:0,vx:0,vy:0,dmg:20,type:"blast",life:3000,arm:0}];
  const p1=gnFoe(40,0),p2=gnFoe(120,0),p3=gnFoe(900,0);
  const h1=p1.hull,h2=p2.hull,h3=p3.hull;
  minesTick(1);
  ok(p1.hull<h1,"ближнему досталось");
  ok(p2.hull<h2,"и соседу тоже — это фугас");
  eq(p3.hull,h3,"а дальнему нет");
  eq((G.gmines||[]).length,0,"мина сработала один раз и ушла");
  /* невзведённая молчит */
  gnWorld();
  G.gmines=[{x:0,y:0,vx:0,vy:0,dmg:20,type:"blast",life:3000,arm:40}];
  const q=gnFoe(30,0);
  const qh=q.hull;
  minesTick(1);
  eq(q.hull,qh,"пока не взведена — не рвётся");
  eq((G.gmines||[]).length,1,"и остаётся лежать");
  /* мина живёт ровно минуту */
  G.gmines[0].arm=0;G.gmines[0].life=1;G.pirates=[];
  minesTick(2);
  eq((G.gmines||[]).length,0,"через минуту мины нет");
  /* помеховая: круг, в котором вас теряют */
  gnWorld();
  const near2=gnFoe(300,0),far=gnFoe(JAM_R+400,0);
  near2.aware=true;far.aware=true;
  const jam=gnGun("jam");
  eq(jam.dmg,0,"помеховая не бьёт вовсе");
  gunFireOnce(jam,G.ship,null,0,()=>.5);
  ok(near2.jamT>0,"ближний ослеплён");
  ok(!near2.aware,"и потерял вас из виду");
  ok(!(far.jamT>0),"дальний вне круга");
  /* и пока счётчик горит, он вас не находит заново */
  for(let i=0;i<20;i++){G.t+=1;updateCombat(1);}
  ok(!near2.aware,"под помехой он вас не находит, хоть и рядом");
  /* а когда счётчик выйдет — находит */
  near2.jamT=0;
  for(let i=0;i<3;i++){G.t+=1;updateCombat(1);}
  ok(near2.aware,"помеха кончилась — увидел");
}));
