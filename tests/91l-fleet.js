/* ══════════════ автотесты: флот и фронт: сто корпусов, занятые системы, ранги, следы на земле ══════════════ */
/* ── номенклатура: сотня корпусов и их редкость ── */
TEST_SUITES.push(()=>suite("флот: сто корпусов, тиры и ряд дока",()=>{
  eq(SHIP_KEYS.length+FLEET_KEYS.length,100,"корпусов ровно сто");
  const names={};let dup=0;
  for(const id of FLEET_KEYS){const n=FLEET[id].ru;if(names[n])dup++;names[n]=1;}
  eq(dup,0,"имена не повторяются");
  /* каждый тир представлен: иначе редкость — слово без содержания */
  const byTier={};
  for(const id of FLEET_KEYS)byTier[FLEET[id].tier]=(byTier[FLEET[id].tier]|0)+1;
  for(const t of FLEET_TIER_KEYS)ok(byTier[t]>0,"тир «"+FLEET_TIERS[t].ru+"» есть: "+(byTier[t]|0));
  ok(byTier.work>byTier.legend,"лошадок больше, чем легенд");
  ok(byTier.luxe<=byTier.rare,"люкс не частее редкого");
  /* люкс — всегда яхта, и трюм у него смешной: он не для дела */
  for(const id of FLEET_KEYS)if(FLEET[id].tier==="luxe"){
    eq(FLEET[id].hcls,"yacht","люкс — яхта");
    ok(FLEET[id].cargo<=50,"у яхты трюм на два ящика: "+FLEET[id].cargo);
  }
  /* редкость стоит денег: средняя цена растёт от лошадки к легенде */
  const avg=t=>{const a=FLEET_KEYS.filter(id=>FLEET[id].tier===t);
    return a.reduce((s,id)=>s+FLEET[id].price,0)/Math.max(1,a.length);};
  ok(avg("work")<avg("line"),"лошадка дешевле серийного");
  ok(avg("line")<avg("rare"),"серийный дешевле редкого");
  ok(avg("rare")<avg("legend"),"редкий дешевле легендарного");
  /* корпус достаётся по ключу и рисуется: каталог не должен ломать hullOf */
  const h=hullOf(FLEET_KEYS[0]);
  ok(h&&h.poly&&h.poly.length>3,"корпус из каталога строится");
  /* ряд дока: не склад из ста строк, и всегда есть на чём улететь */
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  ok(sys,"нашлась станция");
  const yard=stationFleet(sys);
  ok(yard.length>=3&&yard.length<=12,"ряд дока обозрим: "+yard.length);
  ok(yard.some(id=>FLEET[id].price<9000),"в доке всегда есть дешёвый корпус");
  eq(stationFleet(sys).join(),yard.join(),"ряд детерминирован: тот же док — тот же ряд");
}));

/* ── пираты берут системы, игрок отбивает ── */
TEST_SUITES.push(()=>suite("фронт пиратов: занять и отбить",()=>{
  resetWorld();
  G.occ={};G.freed=0;
  const sys=(function(){for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  ok(sys,"нашлась система со станцией");
  eq(occLvl(sys.sx,sys.sy),0,"сначала свободна");
  /* занятость отнимает службы и роняет цену — это и есть «занято» */
  const free=marketFor(sys).iron;
  occSet(sys.sx,sys.sy,3);
  eq(occLvl(sys.sx,sys.sy),3,"занята под завязку");
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
  ok(marketFor(sys).iron<free,"скупщик занижает: "+marketFor(sys).iron+" против "+free);
  eq(occService("yard"),false,"док закрыт");
  eq(occService("fuel"),true,"заправка работает всегда");
  ok(occExtraPirates(sys.sx,sys.sy)>=3,"стоит патруль");
  /* отбивается боем: набили норму — уровень упал */
  const need=occInfo(3).need;
  for(let i=0;i<need;i++)occKill(sys.sx,sys.sy);
  eq(occLvl(sys.sx,sys.sy),2,"уровень упал после нормы");
  for(let i=0;i<occInfo(2).need;i++)occKill(sys.sx,sys.sy);
  for(let i=0;i<occInfo(1).need;i++)occKill(sys.sx,sys.sy);
  eq(occLvl(sys.sx,sys.sy),0,"система освобождена");
  eq(G.freed,1,"счёт отбитых вырос");
  eq(occService("yard"),true,"док снова открыт");
  /* наступление идёт ОТКУДА-ТО: новая занятая система соседствует с прежней */
  G.occ={};occSet(4,4,1);
  G.occT=0;occTick();
  const keys=Object.keys(G.occ);
  ok(keys.length>=1,"фронт не исчез");
  for(const k of keys){
    const [x,y]=k.split(",").map(Number);
    ok(Math.max(Math.abs(x-4),Math.abs(y-4))<=1,"занятое рядом с прежним: "+k);
  }
  /* сохранение: фронт переживает запись и загрузку */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.occ={};G.freed=0;
  applySave(snap);
  ok(Object.keys(G.occ).length===keys.length,"фронт сохранился");
  eq(G.freed,1,"счёт отбитых сохранился");
}));

/* ── ранги пиратов ── */
TEST_SUITES.push(()=>suite("пираты: ранги растут с занятостью",()=>{
  eq(PIRATE_RANKS.length,4,"четыре ранга");
  ok(PIRATE_RANKS[3].bounty>PIRATE_RANKS[0].bounty*4,"за барона платят кратно больше");
  ok(PIRATE_RANKS[3].hull>PIRATE_RANKS[1].hull,"барон живучее ветерана");
  resetWorld();
  G.occ={};
  /* в занятой системе патруль плотнее, чем в такой же свободной */
  const a=occExtraPirates(5,5);
  occSet(5,5,3);
  ok(occExtraPirates(5,5)>a,"под пиратами их больше");
}));

/* ── хвосты M87: очаг, логово, яхта ── */
TEST_SUITES.push(()=>suite("очаг подавлен, логово, яхта",()=>{
  resetWorld();
  G.occ={};G.occCalm={};G.freed=0;
  /* разбитая база гасит наступление вокруг себя на сутки */
  occSet(6,6,2);
  occSuppress(6,6);
  eq(occLvl(6,6),1,"подавление сбивает уровень");
  ok(occCalmNear(6,6),"рядом с очагом тихо");
  ok(occCalmNear(7,7),"тишина достаёт на два сектора");
  ok(!occCalmNear(12,12),"но не на всю галактику");
  /* пока тихо, фронт от этой системы не растёт */
  const before=Object.keys(G.occ).length;
  G.occT=0;occTick();
  eq(Object.keys(G.occ).length,before,"наступление замерло");
  /* логово: имя и уровень зависят от занятости */
  occSet(6,6,3);
  eq(occLairLevel(6,6),3,"логово по уровню занятости");
  ok(/БАРОН/.test(occLairName(6,6)),"под пиратами это логово барона");
  occSet(6,6,1);
  eq(occLairName(6,6),"","на слабой занятости логова нет");
  /* яхта: не приносит кредитов, но поднимает мораль */
  G.owned={};
  eq(yachtOwned(),null,"яхты нет");
  eq(yachtMoraleMul(),1,"и надбавки нет");
  const luxe=FLEET_KEYS.filter(id=>FLEET[id].tier==="luxe")[0];
  ok(luxe,"в каталоге есть люкс");
  G.owned[luxe]=true;
  ok(yachtOwned(),"яхта в ангаре");
  ok(yachtMoraleMul()>1,"мораль возвращается быстрее");
  const noDock=yachtMoraleMul();
  G.home={turn:0,tier:HOME_TIERS.length,sx:0,sy:0,made:0,garage:[],showcase:{},trophies:[]};
  ok(yachtMoraleMul()>noDock,"с причалом дома эффект сильнее");
}));

/* ── шахта остаётся выкопанной, постройки видны с земли ── */
TEST_SUITES.push(()=>suite("шахта помнит выработку",()=>{
  resetWorld();landOnTestPlanet();
  enterDig();
  const D=G.dig;
  ok(D,"спустились в шахту");
  /* копаем несколько ячеек руками: просто помечаем — важна персистентность */
  for(let r=1;r<=4;r++){const c=digCell(D,0,r);c.dug=true;c.res=null;}
  D.deepest=4;
  const p=D.p;
  exitDig();
  ok(G.mines&&G.mines[mineKey(p)],"выработка записана");
  eq(G.mines[mineKey(p)].dug.length,5,"пять ячеек: устье и четыре вниз");
  /* спустились снова — ствол на месте, порода не отросла */
  enterDig();
  eq(G.dig.deepest,4,"глубина помнится");
  for(let r=1;r<=4;r++)ok(digCell(G.dig,0,r).dug,"ячейка "+r+" по-прежнему выкопана");
  ok(!digCell(G.dig,3,7).dug,"нетронутая порода осталась породой");
  /* руду из выкопанной ячейки второй раз не выносят */
  for(let r=1;r<=4;r++)eq(digCell(G.dig,0,r).res,null,"в выработке руды нет");
  exitDig();
  /* сохранение переживает запись и загрузку */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.mines={};
  applySave(snap);
  ok(G.mines[mineKey(p)],"выработка пережила сохранение");
}));

TEST_SUITES.push(()=>suite("постройки видны с земли",()=>{
  resetWorld();landOnTestPlanet();
  eq(builtHere().length,0,"пока ничего не построено");
  G.bases[G.sx+","+G.sy]={cells:{a:1,b:1}};
  const b=builtHere();
  eq(b.length,1,"база видна на планете");
  eq(b[0].kind,"base","это база");
  G.home={turn:0,tier:3,sx:G.sx,sy:G.sy,made:0,garage:[],showcase:{},trophies:[]};
  eq(builtHere().length,2,"и дом рядом");
  /* место постройки детерминировано: дом не бегает по планете */
  const s1=builtSpot(G.surf.tr,G.surf.p,"home");
  const s2=builtSpot(G.surf.tr,G.surf.p,"home");
  eq(s1.x,s2.x,"дом всегда на одном месте");
  ok(builtSpot(G.surf.tr,G.surf.p,"base").x!==s1.x,"база стоит не там же, где дом");
  /* дом в другой системе на этой планете не показывается */
  G.home.sx=G.sx+3;
  eq(builtHere().length,1,"чужая система — дома здесь нет");
}));


/* ══════════════ M234: у шахты есть адрес ══════════════
   Ствол оставался в сохранении, но на поверхности от него не было ни следа, и
   «заложить шахту» работало где угодно — попадая в ту же самую выработку.
   Автор: «непонятно, где копал». Устье теперь стоит на месте. */
TEST_SUITES.push(()=>suite("шахта видна с поверхности",()=>{
  resetWorld();landOnTestPlanet();
  const p=G.surf.p;
  /* пустой участок: залежь, куст или зверь рядом отвечают своей подсказкой —
     проверяем ветку шахты, а не порядок ветвей */
  const clear=x=>{const S=G.surf;S.x=x;S.on=true;S.plants=[];S.fauna=[];S.deposits=[];S.mining=null;};
  eq(mineSpotX(p),null,"пока не копали — устья нет");
  const where=G.surf.shipX+600;
  clear(where);
  enterDig();
  eq(G.dig.x0,where|0,"устье встало там, где заложили");
  exitDig();
  near(mineSpotX(p),where|0,1,"и записалось в сохранение");
  /* рядом — спуск; вдали — расстояние и запрет на второй ствол */
  clear(where+5);G.prompt="";
  updateSurface(1);
  ok(/СПУСТИТЬСЯ В ШАХТУ/.test(G.prompt),"у устья зовут вниз: "+G.prompt.split("\n")[0]);
  clear(where+400);G.prompt="";
  updateSurface(1);
  ok(/ШАХТА ЭТОЙ ПЛАНЕТЫ/.test(G.prompt),"вдали сказано, где она: "+G.prompt.split("\n")[0]);
  actEdge=true;updateSurface(1);actEdge=false;
  eq(G.mode,"surface","и второй ствол не закладывается");
  /* сохранение до M234 адреса не знает — первый же спуск его назначает */
  G.mines[mineKey(p)]={dug:["0,0"],deepest:1};
  eq(mineSpotX(p),null,"у старой записи адреса нет");
  clear(where+400);
  enterDig();exitDig();
  near(mineSpotX(p),where+400,1,"и его ставит первый спуск");
  /* адрес переживает запись и загрузку (после неё поверхности уже нет) */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.mines={};applySave(snap);
  near(mineSpotX(p),where+400,1,"устье пережило сохранение");
}));
