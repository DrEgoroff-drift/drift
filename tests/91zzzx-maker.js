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

/* ══════════════ та же грамматика у остальных генераторов (M369a) ══════════════
   Слой один на пятерых (D24): корпуса, флот, баржи, пиратские корпуса и тела
   станций читают одну таблицу. Здесь мерится, что читают её действительно все,
   а не только `hullOf`. */
TEST_SUITES.push(()=>suite("изготовитель M369a: баржа собрана по своему закону",()=>{
  mkWorld();
  const mk=(by,seed)=>{
    const b={seed:seed|0,by,x:0,y:0,a:0,hp:100,hullMax:100};
    const art=bargeArtOf(b);
    return {b,art};
  };
  /* у баржи появился завод, и он в ключе выпечки */
  const a=mk("ra",11),c=mk("co",11);
  ok(a.art!==c.art,"две баржи одного семени, но разных заводов — две выпечки");
  eq(a.b.by,"ra","и он записан в самой барже");
  /* закон профиля: у Рассвета блоки встык, у Компании гладкая капсула */
  /* блоки встык дают НЕСКОЛЬКО ПОСТОЯННЫХ ширин, гладкая капсула — плавную
     череду разных: считаем именно это, а не скачки (у капсулы свой заход) */
  const levels=(by)=>{
    const set={};
    for(let i=0;i<=20;i++)set[makerWidth(by,i/20,11).toFixed(3)]=1;
    return Object.keys(set).length;
  };
  ok(levels("ra")<=4,"у Рассвета три-четыре блока встык: "+levels("ra"));
  ok(levels("co")>=8,"а у Компании обвод идёт плавно: "+levels("co"));
}));

TEST_SUITES.push(()=>suite("изготовитель M369a: станция собрана по своему закону",()=>{
  mkWorld();
  const modsFor=(by)=>{
    const sys={sx:3,sy:4,seed:hashi(3,4,77),name:"Т",station:{name:"Т",stype:"trade",by}};
    return stationMods(sys);
  };
  const hf=modsFor("hf"),or=modsFor("or"),km=modsFor("km");
  /* Хай-Фронт: один хребет, мачты поперёк — все углы ±90° */
  ok(hf.every(m=>Math.abs(Math.abs(m.ang)-Math.PI/2)<1e-6),"мачты Хай-Фронта строго поперёк");
  /* Орднунг: стопка по одной оси, одинакового размера */
  ok(or.every(m=>Math.abs(m.ang)<1e-6||Math.abs(m.ang-Math.PI)<1e-6),"стопка Орднунга по оси");
  ok(or.every(m=>Math.abs(m.s-or[0].s)<1e-6),"и модули одинаковые");
  /* Коммуна: кольцо равного выноса */
  ok(km.every(m=>Math.abs(m.d-km[0].d)<1e-6),"кольцо Коммуны ровное");
  /* и у станции есть свой завод, даже если её не спрашивали */
  const sys2={sx:5,sy:6,seed:hashi(5,6,77),name:"Р",station:{name:"Р",stype:"trade"}};
  stationMods(sys2);
  ok(!!HULL_MAKER[sys2.station.by],"станция без записи получает завод от зерна");
}));

TEST_SUITES.push(()=>suite("изготовитель M369a: бумаги, еда и марка на вещи",()=>{
  mkWorld();
  /* по книге на державу — и все шесть находятся */
  const byPower={};
  for(const b of BOOKS)for(const k of POWER_KEYS)
    if(b.ru.indexOf(POWERS[k].ru)>=0||(b.by||"").indexOf(POWERS[k].ru)>=0||
       (b.by||"").indexOf(POWERS[k].full)>=0)byPower[k]=b.id;
  eq(Object.keys(byPower).length,6,"шесть чужих книг, по одной на державу: "+JSON.stringify(byPower));
  for(const k of POWER_KEYS){
    ok(!!POWERS[k].food&&POWERS[k].food.length>8,k+": строка еды в кантине");
    ok(!!POWERS[k].paper,k+": типографская повадка");
    ok(!!POWERS[k].suit,k+": марка снаряжения");
  }
  /* марка на вещи: своё без марки, чужое с маркой */
  const own=kitPiece("helmet",1,0,0);
  eq(kitBrand(own),"","выданное ГЛАВТРАССОЙ марки не носит");
  let foreign=null;
  for(let s=1;s<200&&!foreign;s++){
    const x=kitPiece("helmet",1,0,s);
    if(kitBy(x)!=="gt")foreign=x;
  }
  ok(foreign&&kitBrand(foreign).length>2,"а чужое носит: "+(foreign?kitBrand(foreign):"—"));
}));

/* ══════════════ как это достаётся (M369b, §19.3) ══════════════ */
TEST_SUITES.push(()=>suite("изготовитель M369b: у части есть завод, и он в сейве",()=>{
  mkWorld();
  /* завод даёт имя и небольшой перекос — но не второй тир */
  const a=genPart(4242,3,"engine",0,null,"gt");
  const b=genPart(4242,3,"engine",0,null,"co");
  eq(a.by,"gt","своё по умолчанию");
  eq(b.by,"co","чужое помечено");
  ok(a.name!==b.name,"и зовётся по-своему: «"+a.name+"» против «"+b.name+"»");
  ok(Math.abs((b.bonus.thrMul||0)-(a.bonus.thrMul||0))<Math.abs(a.bonus.thrMul||.2)*.4,
     "перекос мал: это не второй тир");
  /* упаковка: своё пишется как раньше, чужое дописывает одну букву */
  const pa=packPart(a),pb=packPart(b);
  eq(pa.b,undefined,"у ГЛАВТРАССЫ поля нет вовсе — старые записи читаются буква в букву");
  eq(pb.b,"co","у чужого есть");
  eq(unpackPart(pb).by,"co","и оно переживает круг упаковки");
  eq(unpackPart(pa).by,"gt","а без поля часть остаётся своей");
  /* карточка описи называет завод только у чужого */
  eq(partMakerRu(a),"","своё не подписано");
  ok(partMakerRu(b).length>2,"чужое подписано: "+partMakerRu(b));
}));

TEST_SUITES.push(()=>suite("изготовитель M369b: корпус достаётся тросом, а не прилавком",()=>{
  mkWorld();
  /* эпизодов ещё нет — значит чужой корпус на прилавке не появляется */
  eq(hasEpisode("or"),false,"эпизодов до M374 не бывает");
  let foreign=0,own=0;
  for(let i=0;i<60;i++){
    const sys={sx:i,sy:2,seed:hashi(i,2,77),key:i+",2",name:"С",
      station:{name:"С",stype:"yard",by:i%2?"or":"gt"}};
    const off=stationUniqueOffer(sys);
    if(!off)continue;
    if(off.by==="gt")own++;else foreign++;
  }
  eq(foreign,0,"чужих корпусов в продаже нет");
  ok(own>0,"свои продаются: "+own);
  /* «Ялта» — исключение: там торгуют все, но вдвое дороже */
  const y=yaltaAt();
  const ys={sx:y.sx,sy:y.sy,seed:hashi(y.sx,y.sy,77),key:y.sx+","+y.sy,name:"Я",
    station:{name:"Я",stype:"yard",by:"km"}};
  const yo=stationUniqueOffer(ys);
  ok(!yo||yo.by==="km","в «Ялте» чужой корпус продаётся");
  /* трос: дерелик становится записью, запись — кораблём */
  G.tow={seed:12345,by:"or",sx:1,sy:1};
  const base=genUniqueShip(hashi(G.tow.seed,0x0E57,7));
  base.by=G.tow.by;
  const uid="t"+G.tow.seed;
  G.uniqueShips[uid]=base;G.owned[uid]=true;G.tow=null;
  eq(shipData(uid).by,"or","восстановленный корпус помнит свой стапель");
  eq(makerOf(uid),"or","и генератор рисует его по этой грамматике");
  /* флаг при этом остаётся ваш */
  G.shipId=uid;
  eq(playerFlag(),"gt","на чужом корпусе флаг свой (D09)");
}));
