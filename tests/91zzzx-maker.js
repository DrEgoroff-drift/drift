/* ══════════════ у всего есть изготовитель (M369, §19.1, §19.4) ══════════════
   Здесь мерится то, что можно померить без глаза: таблица лежит в коде, ключ
   кэша различает породы, закон профиля действительно меняет обвод, схема
   сужается, флаг не зависит от корпуса, «Ялта» стоит на своём месте и в ней не
   стреляют. Сам ВЗГЛЯД — то, читается ли порода на картинке, — меряет
   `makerRead()` в ярусе Хрома (91j-art): под заглушками пикселей нет. */
function mkWorld(){
  resetWorld();
  G.sx=0;G.sy=0;
  return G;
}
function mkShip(by,seed,cls){
  const id="t_"+by+"_"+(seed|0)+"_"+(cls||"scout");
  NPC_SHIPS[id]={name:id,seed:seed|0,hcls:cls||"scout",col:"#9fd8ff",
    hull:100,cargo:60,fuel:100,thr:1,cls:cls||"scout",by};
  delete HULL_CACHE[id+"!"+by];
  return id;
}

TEST_SUITES.push(()=>suite("изготовитель M369: восемь измерений таблицы в коде",()=>{
  mkWorld();
  eq(MAKER_KEYS.length,6,"шесть изготовителей, седьмого нет");
  for(const by of MAKER_KEYS){
    const M=HULL_MAKER[by];
    ok(!!M.ru&&M.ru.length>2,by+": имя");
    ok(M.bw>.5&&M.bw<1.6,by+": 1 пропорция по ширине");
    ok(M.len>.8&&M.len<1.5,by+": 1 пропорция по длине");
    ok(["step","capsule","chamfer","swan","modules","spindle"].indexOf(M.prof)>=0,
       by+": 1 закон профиля из шести");
    ok(M.forms===null||M.forms.length>=2,by+": 2 набор схем");
    ok(M.out&&M.out.length>=2,by+": 3 приметы, которые торчат за обвод");
    ok(["clamp","flush","flange","fillet","weld","gap"].indexOf(M.joint)>=0,by+": 4 стык");
    ok(M.ground&&M.ground.length===3&&M.wear>0,by+": 5 поверхность");
    ok(!!M.mark&&!!M.lights,by+": 6 метки и огни");
    ok(M.eng&&M.eng.col&&M.eng.trail>0,by+": 7 подпись тяги");
    ok(M.snd&&M.snd.f>0&&M.snd.bank>=0,by+": 8 звук и крен");
  }
  /* восьмое не смеет трогать числа корабля: крен и тембр — и только они */
  const st0=stat();
  const t0=st0.turn,th0=st0.thr;
  G.flag="gt";
  eq(stat().turn,t0,"поворот от изготовителя не зависит");
  eq(stat().thr,th0,"тяга тоже");
}));

TEST_SUITES.push(()=>suite("изготовитель M369: чей корпус и что от этого меняется",()=>{
  mkWorld();
  /* каталог ГЛАВТРАССЫ — нулевой изготовитель */
  for(const id of SHIP_KEYS)eq(makerOf(id,SHIPS[id]),"gt",id+": из каталога, значит ГЛАВТРАССА");
  /* у чужого корпуса порода от семени и НЕ меняется от вызова к вызову */
  const seen={};
  for(let i=0;i<200;i++){
    const id="npc"+i;
    NPC_SHIPS[id]={name:id,seed:hashi(i,7,3),hcls:"scout",col:"#9fd8ff",hull:100,cargo:60,fuel:100,thr:1};
    const a=makerOf(id),b=makerOf(id);
    eq(a,b,id+": порода не гуляет между вызовами");
    seen[a]=(seen[a]||0)+1;
  }
  eq(Object.keys(seen).length,6,"и все шесть встречаются: "+JSON.stringify(seen));
  /* кэш корпусов различает породы: иначе первый нарисованный станет и вторым */
  const g=hullOf(mkShip("gt",4242)),k=hullOf(mkShip("km",4242));
  ok(g!==k,"два корпуса, а не один из кэша");
  eq(g.by,"gt","у первого своя порода");
  eq(k.by,"km","у второго своя");
  /* геометрия повторяется: тот же id и та же порода — тот же обвод */
  const id2=mkShip("ra",777);
  const h1=hullOf(id2);
  delete HULL_CACHE[id2+"!ra"];
  const h2=hullOf(id2);
  eq(h1.poly.length,h2.poly.length,"обвод той же длины");
  let same=true;
  for(let i=0;i<h1.poly.length;i++)
    if(Math.abs(h1.poly[i][0]-h2.poly[i][0])>1e-9||Math.abs(h1.poly[i][1]-h2.poly[i][1])>1e-9)same=false;
  ok(same,"и он совпадает точка в точку");
}));

TEST_SUITES.push(()=>suite("изготовитель M369: закон профиля и набор схем",()=>{
  mkWorld();
  /* закон профиля работает: у ступенчатого есть ПОЛКИ (соседние станции
     равны), у веретена их нет ни одной — кривая всё время идёт */
  const stepF=[],spinF=[];
  for(let i=0;i<12;i++){
    for(const [by,arr] of [["gt",stepF],["hf",spinF]]){
      const h=hullOf(mkShip(by,1000+i));
      let mx=0;for(const p of h.prof)mx=Math.max(mx,p[1]);
      let flat=0;
      for(let k=1;k<h.prof.length;k++)
        if(Math.abs(h.prof[k][1]-h.prof[k-1][1])<mx*.02)flat++;
      arr.push(flat/(h.prof.length-1));
    }
  }
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  ok(avg(stepF)>avg(spinF)+.3,
     "у ступеней полки, у веретена нет: "+avg(stepF).toFixed(2)+" против "+avg(spinF).toFixed(2));
  /* схема: изготовитель сужает выбор класса */
  const got={};
  for(let i=0;i<40;i++)got[hullOf(mkShip("or",2000+i,"warship")).form]=1;
  for(const f of Object.keys(got))
    ok(HULL_MAKER.or.forms.indexOf(f)>=0,"фрегат Орднунга берёт только его схемы: "+f);
  /* пустое пересечение не отменяет грамматику: рудовоз Хай-Фронта существует */
  const forms=makerForms("hf",["slab","boxed","disc"]);
  eq(forms.join(","),HULL_MAKER.hf.forms.join(","),
     "не пересеклось — схема остаётся за изготовителем");
  /* и повадку класса это не трогает: рудовоз всё равно широк */
  const hauler=hullOf(mkShip("hf",31,"hauler")),scout=hullOf(mkShip("hf",31,"scout"));
  ok(hauler.bw>scout.bw,"класс читается первым: рудовоз шире разведчика даже у Хай-Фронта");
}));

TEST_SUITES.push(()=>suite("державы M369: таблица §7.1 и флаг вместо обшивки",()=>{
  mkWorld();
  eq(POWER_KEYS.length,6,"шесть держав");
  for(const k of POWER_KEYS){
    const P=POWERS[k];
    ok(!!HULL_MAKER[k],k+": у державы есть свой завод (та же строка в HULL_MAKER)");
    ok(!!P.ru&&!!P.full&&!!P.from,k+": имя, полное имя, откуда");
    ok(!!P.wants&&!!P.doctrine,k+": чего хочет и как воюет");
    ok(!!P.hail&&P.hail.length>10,k+": приветствие на подходе");
    ok(!!P.air&&!!P.never,k+": голос в эфире и то, о чём он молчит");
    ok(!!P.emblem&&!!P.col,k+": эмблема и цвет чипа");
    for(const f of P.fams)ok(!!GUN_FAMILY[f],k+": доктринальное семейство «"+f+"» есть в общей таблице");
  }
  /* флаг — транспондер, а не обшивка (D09) */
  eq(playerFlag(),"gt","игрок по рождению из ГЛАВТРАССЫ");
  G.shipId=mkShip("km",99);
  eq(makerOf(G.shipId),"km","корпус коммунаровский");
  eq(playerFlag(),"gt","а флаг всё равно свой");
  eq(flagOf({owner:"fleet"}),"gt","флот ГЛАВТРАССЫ несёт её флаг");
  eq(flagOf({owner:"pirate"}),null,"пират — не держава");
}));

TEST_SUITES.push(()=>suite("«Ялта» M369: один адрес на всех и три запрета",()=>{
  mkWorld();
  const y=yaltaAt(),y2=yaltaAt();
  eq(y.sx,y2.sx,"адрес не гуляет");eq(y.sy,y2.sy,"и по второй оси тоже");
  const r=Math.hypot(y.sx,y.sy);
  ok(r>=YALTA_R-1.5&&r<=YALTA_R+1.5,"стоит на шестом круге: r="+r.toFixed(2));
  ok(yaltaIs(y.sx,y.sy),"себя узнаёт");
  ok(!yaltaIs(y.sx+1,y.sy+1),"а соседей нет");
  /* пиратов там нет никогда — при любой опасности сектора */
  G.sx=y.sx;G.sy=y.sy;
  for(let i=0;i<12;i++){spawnPirates();eq(G.pirates.filter(p=>!p.iff).length,0,"в «Ялте» никто не грабит");}
  /* и оружие опечатано: отказ с причиной, а не молчащая кнопка */
  ok(yaltaHere(),"мы в «Ялте»");
  G._yaltaSaid=-1e9;
  ok(yaltaSealed(),"оружие опечатано");
  G.sx=y.sx+2;
  ok(!yaltaHere(),"за её пределами обычная система");
  eq(yaltaSealed(),false,"и оружие работает");
}));
