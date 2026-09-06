/* ══════════════ пять видов боеприпаса (M367, §4) ══════════════
   Пусковая одна, а ракеты разные, и различаются они не уроном, а тем, зачем их
   пускают. Здесь мерится ровно это: рой расходится по меткам, ЭМИ гасит поле и
   молчание, торпеда не доворачивает, ловушка уводит чужую ракету, а зенитка —
   ваша и чужая — снимает то, что летит.

   Мир и цели — общие фикстуры `gnWorld`/`gnFoe` (91zzzw-guns2). */
function mlLauncher(kindKey){
  /* пусковая с нужным боеприпасом: перебираем зёрна, пока не выпадет вид */
  for(let s=1;s<4000;s++){
    const p=genPart(s*7717,3,"missile");
    if(mslKindKeyOf(p)===kindKey){addPart(p);return p;}
  }
  return null;
}
function mlFit(kindKey){
  const p=mlLauncher(kindKey);
  ok(!!p,"нашлась пусковая вида «"+kindKey+"»");
  const slots=slotsOf(G.shipId);
  for(let i=0;i<slots.length;i++)if(slots[i]==="missile"){fitPart(i,p.id);break;}
  G.cargo.missile=20;G.mslCool=0;
  return p;
}

TEST_SUITES.push(()=>suite("ракеты M367: пять видов, и вид у пусковой свой",()=>{
  gnWorld();
  eq(MSL_KEYS.length,5,"видов пять");
  const seen={};
  for(let s=1;s<600;s++)seen[mslKindKeyOf(genPart(s*7717,3,"missile"))]=1;
  eq(Object.keys(seen).sort().join(","),MSL_KEYS.slice().sort().join(","),
     "и все пять выпадают из зерна пусковой");
  for(const k of MSL_KEYS){
    const K=MSL_KINDS[k];
    ok(!!K.ru&&K.ru.length>2,k+": у вида есть имя");
    ok(!!K.note&&K.note.length>10,k+": и строка на карточке");
    ok(K.n>=1,k+": и число ракет в залпе");
    /* без краски вид не отличить в бою, а решение принимается по следу */
    const P=MSL_PAINT[k];
    ok(!!P&&!!P.dot&&P.r>0&&P.len>0,k+": и своя краска на след");
  }
  ok(MSL_PAINT_FOE.dot!==MSL_PAINT.plain.dot,"чужая ракета красится не как своя");
}));

TEST_SUITES.push(()=>suite("ракеты M367: рой, ЭМИ, торпеда",()=>{
  /* рой: шесть малых, и они расходятся по взятым меткам */
  gnWorld();
  mlFit("swarm");
  const a=gnFoe(400,0),b=gnFoe(400,200);
  G.marks=[a,b];G.msl=[];
  ok(mslFire(),"рой ушёл");
  eq(G.msl.length,MSL_KINDS.swarm.n,"шесть малых за пуск");
  const tg=new Set(G.msl.map(m=>m.tgt));
  ok(tg.size>=2,"и они разошлись по меткам: "+tg.size);
  ok(G.msl[0].dmg<MSL_DMG,"у малой урон меньше обычного");
  /* ЭМИ: поле в ноль и молчание вместо урона */
  gnWorld();
  mlFit("emp");
  const p=gnFoe(300,0);
  p.shieldMax=200;p.shield=200;p.shieldOff=0;p.stunT=0;
  G.marks=[p];G.msl=[];
  ok(mslFire(),"ЭМИ ушла");
  eq(G.msl.length,1,"одна");
  ok(G.msl[0].emp===1,"и она помечена как ЭМИ");
  const h0=p.hull;
  G.msl[0].x=p.x;G.msl[0].y=p.y;G.msl[0].age=MSL_ARM+1;
  mslTick(1);
  eq(p.shield,0,"поле в ноль");
  ok(p.shieldOff>0,"и не растёт две секунды");
  ok(p.stunT>0,"а сам он молчит");
  ok(h0-p.hull<MSL_DMG*.5,"урона почти нет: "+(h0-p.hull).toFixed(1));
  /* торпеда: не доворачивает вовсе */
  gnWorld();
  mlFit("torp");
  const t=gnFoe(700,400);
  G.marks=[t];G.msl=[];
  G.ship.a=0;
  ok(mslFire(),"торпеда ушла");
  const m=G.msl[0];
  ok(m.big===1,"она большая");
  eq(m.turn,0,"и тупая: доводки нет");
  ok(m.dmg>MSL_DMG,"зато страшная: "+Math.round(m.dmg));
  const a0=m.a;
  m.age=MSL_ARM+1;
  for(let i=0;i<20;i++)mslTick(1);
  near(m.a,a0,1e-9,"за двадцать кадров курс не изменился ни на волос");
}));

TEST_SUITES.push(()=>suite("ракеты M367: ловушка уводит, зенитка снимает",()=>{
  /* ловушка уходит В СТОРОНУ и тянет чужую ракету на себя */
  gnWorld();
  mlFit("decoy");
  const foe=gnFoe(500,0);
  G.marks=[foe];G.msl=[];
  G.ship.a=0;
  ok(mslFire(),"ловушка ушла");
  const d=G.msl[0];
  ok(d.decoy===1,"и это ловушка");
  eq(d.tgt,null,"она никого не ведёт");
  ok(Math.abs(angDiff(d.a,0))>.8,"и уходит в сторону от носа: "+d.a.toFixed(2));
  /* чужая ракета рядом с ловушкой переводит наведение на неё */
  d.x=G.ship.x+120;d.y=G.ship.y+40;
  G.msl.push({x:G.ship.x+220,y:G.ship.y+60,vx:-3,vy:0,a:Math.PI,tgt:null,foe:1,
    dmg:20,turn:MSL_TURN,life:MSL_LIFE,age:MSL_ARM+1,puff:0,kind:"plain"});
  const enemy=G.msl[G.msl.length-1];
  mslTick(1);
  eq(enemy.lure,d,"чужая ракета пошла на ловушку");
  /* капитан носит пусковую, и его ракета ведёт вас */
  gnWorld();
  const cap=gnFoe(500,0);cap.rank=2;
  G.msl=[];
  ok(mslFoeFire(cap),"капитан пустил ракету");
  const e=G.msl[0];
  eq(e.foe,1,"она чужая");
  G.ship.x=0;G.ship.y=0;
  e.x=200;e.y=0;e.a=Math.PI;e.vx=-4;e.vy=0;e.age=MSL_ARM+1;
  const hull0=G.hull;
  for(let i=0;i<80&&G.msl.length;i++)mslTick(1);
  ok(G.hull<hull0,"и дошла до вас: "+(hull0-G.hull).toFixed(1));
  /* ваша зенитка снимает чужую ракету */
  gnWorld();
  gnFoe(600,0);
  G.msl=[{x:200,y:0,vx:-4,vy:0,a:Math.PI,tgt:null,foe:1,dmg:20,turn:0,
    life:MSL_LIFE,age:MSL_ARM+1,puff:0,kind:"plain"}];
  G.shots=[];
  ok(gunFireOnce(gnGun("flak"),G.ship,null,0,()=>.5),"зенитка выстрелила по ней");
  const f=G.shots[G.shots.length-1];
  f.x=G.msl[0].x;f.y=G.msl[0].y;
  flakCatch(1);
  eq(G.msl.length,0,"и сняла");
  /* а чужая зенитка снимает вашу торпеду: медленная и жирная — первая цель */
  gnWorld();
  const guard=gnFoe(300,0);guard.rank=2;guard.flakCool=0;
  G.msl=[{x:200,y:0,vx:4,vy:0,a:0,tgt:guard,dmg:90,turn:0,big:1,
    life:MSL_LIFE,age:MSL_ARM+1,puff:0,kind:"torp"}];
  G.shots=[];
  foeFlak(guard,1);
  const g2=G.shots[G.shots.length-1];
  ok(g2&&g2.flak===1,"капитан выстрелил по торпеде");
  g2.x=G.msl[0].x;g2.y=G.msl[0].y;
  flakCatch(1);
  eq(G.msl.length,0,"торпеда сбита");
  /* и по вашей плазме чужая зенитка бьёт так же, как ваша по чужой */
  gnWorld();
  const guard3=gnFoe(300,0);guard3.rank=2;guard3.flakCool=0;
  G.msl=[];G.shots=[];
  fireShot(guard3.x-120,guard3.y,0,5,20,"player","pla",600);
  const bl=G.shots[G.shots.length-1];bl.blob=1;
  foeFlak(guard3,1);
  ok(G.shots.some(s=>s.flak),"капитан снимает и сгусток плазмы");
  /* по СВОИМ зенитка не бьёт ни та, ни другая */
  gnWorld();
  gnFoe(600,0);
  G.msl=[{x:200,y:0,vx:4,vy:0,a:0,tgt:null,dmg:20,turn:0,life:MSL_LIFE,age:0,puff:0,kind:"plain"}];
  G.shots=[];
  eq(gunFireOnce(gnGun("flak"),G.ship,null,0,()=>.5),false,"по своей ракете ваша зенитка молчит");
  const guard2=gnFoe(250,0);guard2.rank=2;guard2.flakCool=0;
  G.msl=[{x:200,y:0,vx:-4,vy:0,a:Math.PI,tgt:null,foe:1,dmg:20,turn:0,
    life:MSL_LIFE,age:0,puff:0,kind:"plain"}];
  G.shots=[];
  foeFlak(guard2,1);
  ok(!G.shots.some(s=>s.flak),"а чужая — по своей");
  G.msl=[];
}));
