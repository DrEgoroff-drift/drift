/* ══════════════ последние шесть и именные (M366, §2.1–§2.2) ══════════════
   Роль «против своры» и то, что не орудие вовсе: разряд, идущий по цепочке;
   сгусток, бьющий по площади и сбивающий наводку; зенитка, которая стреляет
   сама и только по летящему; кассета, разваливающаяся на полпути; трос,
   который тянет; таран, который живёт столкновением, а не выстрелом.

   И двадцать именных: каждый — семейство с ЧУЖОЙ повадкой. Повадки уже
   написаны, поэтому именной честен; здесь это и проверяется. */
TEST_SUITES.push(()=>suite("орудия M366: разряд, сгусток, зенитка",()=>{
  /* дуговик: бьёт первого и перескакивает на ближнего, теряя половину */
  gnWorld();
  const a=gnFoe(300,0),b=gnFoe(300,140),c=gnFoe(300,900);
  const h=[a.hull,b.hull,c.hull];
  gunFireOnce(gnGun("arc"),G.ship,a,0,()=>.5);
  ok(a.hull<h[0],"первому досталось: "+(h[0]-a.hull).toFixed(2));
  ok(b.hull<h[1],"и разряд перескочил на ближнего: "+(h[1]-b.hull).toFixed(2));
  ok((h[0]-a.hull)>(h[1]-b.hull),"на прыжке теряется половина");
  eq(c.hull,h[2],"дальний вне прыжка");
  ok((G.beams||[]).length>=2,"цепочка видна");
  /* плазма: площадь и сбитая наводка */
  gnWorld();
  const p=gnFoe(300,0),q=gnFoe(300,80);
  const ph=p.hull,qh=q.hull;
  G.shots=[];
  gunFireOnce(gnGun("plasma"),G.ship,p,0,()=>.5);
  const s=G.shots[0];
  ok(!!s&&s.splash>0,"сгусток несёт площадь");
  ok(s.blob===1,"и помечен как сгусток — зенитка его видит");
  s.x=p.x;s.y=p.y;
  combatShots(1);
  ok(p.hull<ph,"по цели");
  ok(q.hull<qh,"и по соседу — это площадь");
  ok(p.leadBreak>0,"а наводку цели сбило: "+p.leadBreak);
  /* зенитка: снимает ракету и молчит, когда снимать нечего */
  gnWorld();
  gnFoe(400,0);
  G.msl=[];G.shots=[];
  const flak=gnGun("flak");
  eq(gunFireOnce(flak,G.ship,null,0,()=>.5),false,"нечего снимать — зенитка молчит");
  G.msl=[{x:150,y:0,vx:-3,vy:0,foe:1}];
  ok(gunFireOnce(flak,G.ship,null,0,()=>.5),"а по ракете стреляет сама");
  const f=G.shots[G.shots.length-1];
  ok(f&&f.flak===1,"и это зенитный выстрел");
  f.x=G.msl[0].x;f.y=G.msl[0].y;
  flakCatch(1);
  eq((G.msl||[]).length,0,"ракета снята");
  G.msl=[];
}));

TEST_SUITES.push(()=>suite("орудия M366: кассета, трос, таран",()=>{
  /* кассета разваливается на полпути, а не сразу */
  gnWorld();
  const t=gnFoe(600,0);
  G.shots=[];
  gunFireOnce(gnGun("cluster"),G.ship,t,0,()=>.5);
  eq(G.shots.length,1,"сперва один снаряд");
  ok(G.shots[0].split>0,"и он знает, где раскрыться: "+Math.round(G.shots[0].split));
  let n=1;
  for(let i=0;i<80&&n===1;i++){combatShots(1);n=G.shots.length;}
  ok(n>=GUN_FAMILY.cluster.parts,"на полпути стало пятеро: "+n);
  /* трос: тянет и держит, пока жив */
  gnWorld();
  const p=gnFoe(300,0);
  p.hullMax=40;p.vx=0;p.vy=0;
  G.ship.vx=0;G.ship.vy=0;
  ok(gunFireOnce(gnGun("harpoon"),G.ship,p,0,()=>.5),"гарпун зацепил");
  ok(!!G.tether,"трос держит");
  const px0=p.x;
  for(let i=0;i<30;i++)tetherTick(1);
  ok(p.vx<0,"лёгкого тянет к тяжёлому: "+p.vx.toFixed(3));
  ok(p.x<px0+1,"и он идёт к вам");
  /* трос отпускает сам */
  G.tether.life=0;
  tetherTick(1);
  ok(!G.tether,"через своё время трос сходит");
  /* таран: не стреляет, но бьёт столкновением и утраивает лоб */
  gnWorld();
  const ram=gnGun("ram");
  eq(gunFireOnce(ram,G.ship,null,0,()=>.5),false,"таран не стреляет вовсе");
  const r=gnFoe(14,0,500);
  r.vx=0;r.vy=0;r.ramCool=0;
  G.ship.vx=4;G.hull=1e6;
  const rh=r.hull,gh=G.hull;
  G.ramOn=true;
  ramTick(1);
  ok(r.hull<rh,"столкновение — это урон: "+(rh-r.hull).toFixed(1));
  ok(G.hull<gh,"и вам тоже достаётся");
  ok((rh-r.hull)>(gh-G.hull)*2,"но цели вчетверо больше, чем вам");
  ok(r.ramCool>0,"второй раз в тот же кадр не бьёт");
  G.ramOn=false;G.ship.vx=0;
}));

TEST_SUITES.push(()=>suite("орудия M366: двадцать именных, и у каждого чужая повадка",()=>{
  gnWorld();
  const known={bullet:1,rail:1,pellets:1,beam:1,homing:1,needles:1,siphon:1,pulse:1,
    drillbeam:1,shove:1,mortar:1,jam:1,arc:1,plasma:1,flak:1,cluster:1,tether:1,ram:1};
  ok(GUN_NAMED.length>=20,"именных двадцать: "+GUN_NAMED.length);
  const bad=[],ids={};
  for(const N of GUN_NAMED){
    if(ids[N.id])bad.push(N.id+": повторяется");
    ids[N.id]=1;
    if(!GUN_FAMILY[N.fam])bad.push(N.id+": семейства «"+N.fam+"» нет");
    if(!known[N.fx])bad.push(N.id+": повадки «"+N.fx+"» нет в коде");
    if(!N.note||N.note.length<20)bad.push(N.id+": без истории");
    if(!(N.dmg>0)||!(N.cool>0))bad.push(N.id+": без чисел");
  }
  eq(bad.slice(0,3).join(" ;; "),"","каждый именной — существующее семейство с существующей повадкой");
  /* именной собирается как часть и несёт свою повадку, а не родовую */
  const N=GUN_NAMED_BY_ID.mayak;
  const p=genPart(777001,5,"gun",2,"mayak");
  eq(p.named,"mayak","часть помнит, что она именная");
  eq(p.name,N.ru,"и носит своё имя");
  eq(p.fam,N.fam,"семейство от именного");
  const base=gunSpecMake(12,20,null,2);
  const g=gunFamilyApply(base,p);
  eq(g.fx,N.fx,"повадка чужая: «Маяк» тянет, а не пробивает");
  const plain=gunFamilyApply(base,{fam:N.fam,fact:0,ser:1960,bonus:{},tier:5,seed:777001});
  ok(g.dmg>plain.dmg,"и числа сильнее родовых: "+g.dmg.toFixed(1)+" против "+plain.dmg.toFixed(1));
  /* и переживает сейв: без этого «Маяк» после загрузки станет обычной рельсой */
  p.id="pnamed";
  const back=unpackPart(packPart(p));
  eq(back.named,"mayak","именное едет в сейв");
  eq(back.name,N.ru,"и возвращается собой");
  /* именной падает с барона, а не с шакала */
  gnWorld();
  G.loot=[];
  const jack=gnFoe(200,0,1);jack.rank=0;jack.hull=0;
  killPirate(jack);
  const fromJack=(G.loot||[]).some(l=>l.part&&l.part.named);
  ok(!fromJack,"с шакала именное не падает");
  let got=false;
  for(let i=0;i<12&&!got;i++){
    gnWorld();G.loot=[];
    const bar=gnFoe(200,0,1);bar.rank=3;bar.seed=9001+i*17;bar.hull=0;
    killPirate(bar);
    got=(G.loot||[]).some(l=>l.part&&l.part.named);
  }
  ok(got,"а с барона — падает");
}));

TEST_SUITES.push(()=>suite("орудия M366: долг M362 отдан — реактор стал реактором",()=>{
  resetWorld();
  /* второе поколение: бак уехал на утилиту, прыжок — на двигатель,
     а реактор получил ёмкость и восполнение энергии */
  const kindsOf=(pool,k)=>pool.filter(a=>a.kinds.indexOf(k)>=0).map(a=>a.k);
  ok(kindsOf(AFFIX2,"core").indexOf("enCapAdd")>=0,"у реактора появилась ёмкость");
  ok(kindsOf(AFFIX2,"core").indexOf("enRegenAdd")>=0,"и восполнение");
  ok(kindsOf(AFFIX2,"core").indexOf("fuelAdd")<0,"бака у реактора больше нет");
  ok(kindsOf(AFFIX2,"core").indexOf("jumpAdd")<0,"и дальности прыжка тоже");
  ok(kindsOf(AFFIX2,"util").indexOf("fuelAdd")>=0,"бак уехал на утилиту");
  ok(kindsOf(AFFIX2,"engine").indexOf("jumpAdd")>=0,"прыжок — на двигатель");
  /* а первое поколение осталось нетронутым: это и есть смысл поколения */
  ok(kindsOf(AFFIX,"core").indexOf("fuelAdd")>=0,"в первом поколении бак по-прежнему на реакторе");
  ok(kindsOf(AFFIX,"core").indexOf("jumpAdd")>=0,"и прыжок тоже");
  /* аффикс реактора реально двигает шкалу */
  const cap0=energyCap(0,0,0),cap1=energyCap(0,0,40);
  ok(cap1>cap0,"ёмкость растёт от аффикса: "+cap0+" → "+cap1);
  const reg0=energyRegen(0,0,0),reg1=energyRegen(0,0,.3);
  ok(reg1>reg0,"и восполнение тоже: "+reg0+" → "+reg1);
}));
