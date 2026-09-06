/* ══════════════ семь семейств (M364, §2.1) ══════════════
   Проверяется не «есть строка в таблице», а «строка §2.1 правдива в игре»:
   рельса пробивает, дробовик кладёт семь снарядов, лазер греет и за порогом
   цель горит сама, перегретый молчит, наводящаяся доворачивает. Таблица без
   кода — ровно то, что запрещено правилом «перк без кода — ложь», поэтому
   первый набор проходит по ВСЕМ ключам семейств и требует от каждого выстрела. */
function gnWorld(){
  resetWorld();
  if(document.querySelectorAll)document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  G.ship.x=0;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;G.ship.a=0;
  G.pirates=[];G.shots=[];G.marks=[];G.beams=[];G.ap=null;G.orbit=null;
  G.heat=0;G.burnT=0;G.stunT=0;
  G.mods.weapon=2;G.clearance=4;
  return G.ship;
}
function gnFoe(x,y,hp){
  const h=hp||1e6;
  const p={x,y,vx:0,vy:0,a:Math.PI,hull:h,hullMax:h,name:"Ц"+(G.pirates.length+1),
    rank:1,seed:31+G.pirates.length*13,shipId:"g"+G.pirates.length,cool:1e9,aware:true,
    thrust:false,shield:0,shieldMax:0,shieldType:"solid",shieldHit:0,heat:0,burnT:0,stunT:0};
  G.pirates.push(p);return p;
}
/* ствол заданного семейства, минуя розыгрыш: числа те же, что в игре */
function gnGun(fam,tier){
  const base=gunSpecMake(12,20,null,2);
  return gunFamilyApply(base,{fam,fact:0,ser:1960,bonus:{},tier:tier||2,seed:7});
}

TEST_SUITES.push(()=>suite("орудия M364: у каждого семейства есть код, а не строка",()=>{
  gnWorld();
  /* повадки, у которых есть код в 13a-guns. Список ведётся руками нарочно:
     он и есть та самая проверка «перк без кода — ложь», а вывести его из
     самого кода значило бы сравнить таблицу с ней же. */
  const known={bullet:1,rail:1,pellets:1,beam:1,homing:1,
    needles:1,siphon:1,pulse:1,drillbeam:1,shove:1,mortar:1,jam:1,
    arc:1,plasma:1,flak:1,cluster:1,tether:1,ram:1};
  const noFire=[];
  for(const k of GUN_FAM_KEYS){
    const F=GUN_FAMILY[k];
    ok(!!known[F.fx],k+": повадка «"+F.fx+"» реализована");
    ok(!!F.line&&F.line.length>10,k+": на карточке написано, каково им летать");
    ok(!!DMG_TYPES[F.type],k+": тип урона из таблицы ("+F.type+")");
    ok(MOUNT_SIZES.indexOf(F.size)>=0,k+": размер из таблицы");
    /* и главное: он действительно стреляет */
    gnWorld();
    const foe=gnFoe(260,0);
    G.marks=[foe];
    const g=gnGun(k);
    /* «выстрелил» — это любой видимый след: снаряд, луч, мина или ослепление.
       Помеховая не стреляет вовсе, и это её повадка, а не её отсутствие. */
    G.cargo.iron=5;
    const mark=()=>G.shots.length+(G.beams||[]).length+((G.gmines||[]).length)+(G.tether?1:0)+
      ((G.pirates||[]).filter(x=>x.jamT>0).length)+((G.pirates||[]).filter(x=>x.shieldOff>0).length)+
      Math.round((foe.hullMax-foe.hull)*100)+Math.round((Math.hypot(foe.vx,foe.vy))*100);
    /* зенитке нужна цель в воздухе, тарану — столкновение: у обоих «сработал»
       означает не выстрел. Даём им их повод и меряем след. */
    if(F.fx==="flak"){G.msl=[{x:120,y:0,vx:-4,vy:0,foe:1}];}
    if(F.fx==="ram"){foe.x=12;foe.y=0;G.ship.vx=3;G.ramOn=true;}
    const n0=mark();
    gunFireOnce(g,G.ship,foe,0,()=>.5);
    if(F.fx==="ram"&&typeof ramTick==="function")ramTick(1);
    if(mark()<=n0)noFire.push(k);
    G.msl=[];G.ship.vx=0;G.ramOn=false;
  }
  eq(noFire.join(", "),"","каждое семейство выстрелило");
  /* завод и серия читаются с любого зерна */
  const bad=[];
  for(let i=0;i<40;i++){
    const p=genPart(90001+i*811,3,"gun");
    if(!GUN_FAMILY[p.fam])bad.push(p.seed+" семейство");
    if(!GUN_FACTORY[p.fact])bad.push(p.seed+" завод");
    if(!(p.ser>=1954&&p.ser<=1992))bad.push(p.seed+" серия "+p.ser);
    if(p.name.indexOf(GUN_FAMILY[p.fam].ab)!==0)bad.push(p.seed+" имя "+p.name);
  }
  eq(bad.slice(0,3).join(" ;; "),"","сорок зёрен дают семейство, завод, серию и имя");
}));

TEST_SUITES.push(()=>suite("орудия M364: рельса, дробовик, наводящаяся",()=>{
  /* рельса бьёт мгновенно и пробивает насквозь, если первый развалился */
  gnWorld();
  const a=gnFoe(300,0,10),b=gnFoe(700,0,1e6);
  const rail=gnGun("rail");
  eq(rail.speed,0,"рельса мгновенна: скорость снаряда 0");
  ok(rail.range>1200,"и бьёт дальше всех: "+rail.range);
  gunFireOnce(rail,G.ship,a,0,()=>.5);
  ok(a.hull<=0,"первый корпус развалился");
  ok(b.hull<1e6,"…и выстрел прошёл насквозь во второй: "+Math.round(1e6-b.hull));
  ok((G.beams||[]).length>0,"луч виден");
  /* а если первый выстоял — дальше не идёт */
  gnWorld();
  const c=gnFoe(300,0,1e6),d=gnFoe(700,0,1e6);
  gunFireOnce(gnGun("rail"),G.ship,c,0,()=>.5);
  ok(c.hull<1e6,"первый получил");
  eq(d.hull,1e6,"второй цел: пробоя не было");
  /* дробовик кладёт семь снарядов одним нажатием */
  gnWorld();
  const foe=gnFoe(200,0);
  G.shots=[];
  gunFireOnce(gnGun("shot"),G.ship,foe,0,()=>.5);
  eq(G.shots.length,GUN_FAMILY.shot.pellets,"семь дробин за нажатие");
  ok(gnGun("shot").range<400,"и короткая рука: "+gnGun("shot").range);
  /* наводящаяся доворачивает к метке */
  gnWorld();
  const t=gnFoe(500,300);
  G.shots=[];
  gunFireOnce(gnGun("aimed"),G.ship,t,0,()=>.5);
  const s=G.shots[0];
  ok(!!s&&s.hom>0,"пуля знает, что она наводящаяся");
  const off0=Math.abs(angDiff(Math.atan2(t.y-s.y,t.x-s.x),Math.atan2(s.vy,s.vx)));
  for(let i=0;i<20;i++)homingStep(s,1);
  const off1=Math.abs(angDiff(Math.atan2(t.y-s.y,t.x-s.x),Math.atan2(s.vy,s.vx)));
  ok(off1<off0,"…и за двадцать кадров довернула к метке: "+off0.toFixed(3)+" → "+off1.toFixed(3));
}));

TEST_SUITES.push(()=>suite("орудия M364: жар, горение и молчание перегретого",()=>{
  /* лазер греет; за порогом цель горит сама */
  gnWorld();
  const p=gnFoe(260,0);
  const laser=gnGun("laser");
  eq(laser.speed,0,"лазер мгновенен");
  ok(laser.burn>0,"и греет");
  const h0=p.hull;
  for(let i=0;i<40;i++)gunFireOnce(laser,G.ship,p,0,()=>.5);
  ok(p.heat>0,"жар копится: "+Math.round(p.heat));
  ok(p.hull<h0,"и урон идёт");
  /* догреваем до порога — цель загорается и горит без нас */
  p.heat=HEAT_BURN-1;p.burnT=0;
  gunFireOnce(laser,G.ship,p,0,()=>.5);
  ok(p.burnT>0,"за порогом цель загорелась");
  const h1=p.hull;
  for(let i=0;i<30;i++)heatTick(p,1,d=>{p.hull-=d;});
  ok(p.hull<h1,"…и горит сама: "+Math.round(h1-p.hull));
  /* перегрев: молчит */
  gnWorld();
  const q=gnFoe(500,0);
  q.cool=0;q.stunT=0;
  heatAdd(q,HEAT_STUN+5);
  ok(q.stunT>0,"перегретый замолчал");
  G.shots=[];
  for(let i=0;i<40;i++){G.t+=1;updateCombat(1);}
  ok(!G.shots.some(x=>x.owner==="pirate"),"и правда не стреляет, пока молчит");
  /* и отходит: жар остывает сам */
  const heat0=q.heat;
  for(let i=0;i<60;i++)heatTick(q,1,()=>{});
  ok(q.heat<heat0,"жар остывает: "+Math.round(heat0)+" → "+Math.round(q.heat));
  /* тепловик греет кинетикой */
  gnWorld();
  const w=gnFoe(300,0);
  const th=gnGun("heat");
  ok(th.heat>0,"тепловик греет");
  G.shots=[];
  gunFireOnce(th,G.ship,w,0,()=>.5);
  ok(G.shots[0].heat>0,"жар едет в самом выстреле");
  G.shots[0].x=w.x;G.shots[0].y=w.y;
  combatShots(1);
  ok(w.heat>0,"и достаётся цели при попадании: "+w.heat.toFixed(1));
}));

TEST_SUITES.push(()=>suite("орудия M364: семейство — это как ты летаешь",()=>{
  gnWorld();
  const auto=gnGun("auto"),heavy=gnGun("heavy"),rail=gnGun("rail"),shot=gnGun("shot");
  /* §2.1 строкой: автопушка — широкий конус, быстрая наводка, малый урон */
  ok(auto.cone>heavy.cone,"у автопушки конус шире тяжёлого: "+auto.cone+" против "+heavy.cone);
  ok(auto.lead>heavy.lead,"и наводка быстрее");
  ok(auto.dmg<heavy.dmg,"а урон меньше");
  ok(auto.cool<heavy.cool,"зато бьёт чаще");
  /* рельса: дальше всех, реже всех, дороже всех по энергии */
  ok(rail.range>auto.range*1.9,"рельса бьёт вдвое дальше автопушки");
  ok(rail.en>auto.en*5,"и стоит впятеро дороже по энергии: "+rail.en+" против "+auto.en);
  ok(rail.cool>heavy.cool,"и откат у неё длиннее тяжёлого");
  /* дробовик: разброс огромный, дальность крошечная */
  ok(shot.spread>auto.spread*2,"у дробовика разброс много больше");
  ok(shot.range<auto.range*.5,"а рука вдвое короче");
  /* завод сдвигает числа, а не переписывает */
  const base=gunSpecMake(12,20,null,2);
  const g1=gunFamilyApply(base,{fam:"auto",fact:1,ser:1960,bonus:{},tier:2,seed:7});
  const g2=gunFamilyApply(base,{fam:"auto",fact:4,ser:1960,bonus:{},tier:2,seed:7});
  ok(g1.dmg!==g2.dmg,"два завода — разный урон: "+g1.dmg.toFixed(2)+" / "+g2.dmg.toFixed(2));
  eq(g1.fam,g2.fam,"но семейство то же");
  /* свои аффиксы ствола правят ЕГО числа, а не всю сборку */
  const g3=gunFamilyApply(base,{fam:"auto",fact:1,ser:1960,bonus:{rangeMul:.5},tier:2,seed:7});
  ok(g3.range>g1.range*1.2,"аффикс дальности удлиняет руку именно этого ствола");
}));
