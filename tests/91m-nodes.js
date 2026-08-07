/* ══════════════ автотесты: журнал, тысяча узлов и венцы, кантина, репутация, памятники ══════════════ */
/* ── журнал дел ── */
TEST_SUITES.push(()=>suite("журнал: принял, записалось, есть куда лететь",()=>{
  resetWorld();
  G.credits=1e6;G.quests=[];
  eq(questOpen().length,0,"журнал пуст");
  /* поручение управляющего: принял — записалось */
  ok(hireMgr(genMgr(777,["cmd"])),"командир нанят");
  const m=mgrOf("cmd");
  const J=MGR_JOBS.filter(j=>j.role==="cmd"&&!j.choice)[0];
  ok(J,"нашлось поручение без выбора");
  m.job={id:J.id,offer:1,t0:Date.now(),mins:J.mins};
  ok(jobAccept(m),"взялись");
  const q=questFind("job:"+m.id+":"+J.id);
  ok(q,"дело в журнале");
  eq(q.state,"active","и оно открыто");
  eq(q.sx,G.sx,"адрес — сектор, где взяли");
  ok(q.until>Date.now(),"срок записан");
  ok(questLeft(q).length>0,"срок показывается словами: "+questLeft(q));
  /* курс по делу: ткнули — карта и выбранная система */
  q.sx=3;q.sy=4;
  ok(questGoto(q),"курс проложен");
  eq(G.sel.x,3,"выбрана та система");
  eq(G.mode,"map","и открыта карта");
  /* закрылось — ушло из открытых, но осталось в истории */
  questDone("job:"+m.id+":"+J.id,"сделано");
  eq(questOpen().length,0,"открытых дел нет");
  eq(questAll().length,1,"а запись осталась");
  /* мир заводит дела сам: занятая система, где вы были */
  G.market["5,5"]={pressure:{},t:0};
  occSet(5,5,2);
  questSync();
  ok(questFind("occ:5,5"),"дело на отбитие завелось");
  occSet(5,5,0);
  questSync();
  ok(!questFind("occ:5,5"),"и закрылось само, когда система освобождена");
  /* дважды одно дело не заводится */
  questAdd("x",{ru:"раз"});questAdd("x",{ru:"раз"});
  eq(questAll().filter(z=>z.key==="x").length,1,"повтор не плодит строк");
  /* переживает сохранение */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.quests=[];applySave(snap);
  ok(questAll().length>=2,"журнал сохранился");
}));

/* ── тысяча узлов и венцы ── */
TEST_SUITES.push(()=>suite("узлы: тысяча находок и венец за набор",()=>{
  resetWorld();
  eq(NODE_N,1000,"узлов ровно тысяча");
  eq(NODE_FAMS.length*NODE_PER_FAM,1000,"десять наборов по сто");
  /* имена уникальны: «узел №417» — это не предмет */
  const names={};let dup=0;
  for(const n of NODES){if(names[n.ru])dup++;names[n.ru]=1;}
  eq(dup,0,"имена не повторяются");
  /* каждый грейд встречается, рядовых больше несбыточных */
  const byG={};for(const n of NODES)byG[n.grade]=(byG[n.grade]|0)+1;
  for(const g of NODE_GRADES)ok(byG[g.id]>0,"грейд «"+g.ru+"» есть: "+byG[g.id]);
  ok(byG.plain>byG.never*4,"рядовых кратно больше несбыточных");
  /* узел сам по себе ничего не меняет: сила приходит только с венцом */
  const before=stat().dmg;
  const pyre=NODES.filter(n=>n.fam==="pyre");
  for(let i=0;i<50;i++)nodeFound(pyre[i]);
  eq(nodeCount("pyre"),50,"полсотни узлов набора найдено");
  eq(stat().dmg,before,"полнабора не даёт ничего");
  eq(crownReady("pyre"),false,"венец ещё не готов");
  eq(crownForge("pyre"),false,"и не собирается раньше срока");
  /* полный набор — венец, и он работает через stat, как модули и части */
  for(const n of pyre)nodeFound(n);
  eq(nodeCount("pyre"),NODE_PER_FAM,"набор собран целиком");
  ok(crownReady("pyre"),"венец готов к сборке");
  ok(crownForge("pyre"),"венец собран");
  eq(crownForge("pyre"),false,"дважды один венец не куётся");
  ok(stat().dmg>before,"венец «Костра» усилил орудие: "+before.toFixed(1)+" → "+stat().dmg.toFixed(1));
  /* найденный узел не находится второй раз */
  eq(nodeFound(pyre[0]),false,"повторная находка не считается");
  /* узлы падают из мира, но редко: сто бросков на спокойном секторе дают немного */
  G.nodes={};
  let got=0;
  for(let i=0;i<200;i++)if(nodeRoll("в шахте",.1,hashi(i,7,3)))got++;
  ok(got>0,"что-то падает: "+got+" из 200");
  ok(got<70,"но это находки, а не валюта: "+got+" из 200");
  /* сохранение: в записи только номера */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  ok(JSON.stringify(snap.nodes).length<40000,"запись компактна");
  G.nodes={};G.crowns={};
  applySave(snap);
  ok(crownOwned("pyre"),"венец пережил сохранение");
}));

/* ── дела кантины: отвечаешь, а не носишь ── */
TEST_SUITES.push(()=>suite("кантина: дела с ответом и отложенным исходом",()=>{
  resetWorld();
  G.credits=50000;G.quests=[];G.dealsDone={};G.dealsWait=[];
  /* ни одно дело не просит «привезти» и «убить столько-то» */
  for(const D of DEAL_KINDS){
    ok(D.opts.length>=2,"«"+D.ru+"»: есть из чего выбрать");
    ok(D.opts.some(o=>o.free),"«"+D.ru+"»: можно отказаться");
    ok(D.opts.some(o=>!o.free),"«"+D.ru+"»: отказ не единственный ответ");
    for(const o of D.opts)ok(o.said&&o.said.length>0,"у ответа есть реплика");
  }
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  ok(sys,"нашлась станция");
  G.st=sys.station;G.sys=sys;G.sx=sys.sx;G.sy=sys.sy;
  const deals=stationDeals(sys);
  ok(deals.length>=1&&deals.length<=3,"за столиками немного людей: "+deals.length);
  eq(stationDeals(sys).map(d=>d.key).join(),deals.map(d=>d.key).join(),
     "та же станция в тот же час — те же люди");
  /* ответ стоит денег и записывается делом в журнал */
  const d=deals[0],paid=d.def.opts.findIndex(o=>!o.free);
  const before=G.credits;
  ok(dealAnswer(d,paid),"ответили");
  ok(dealTaken(d.key),"дело больше не предлагают");
  const o=d.def.opts[paid];
  if(o.cost)ok(G.credits<before,"ответ стоил денег");
  if(o.gain)ok(G.credits>before,"заплатили вперёд");
  if(o.later){
    ok(questFind("deal:"+d.key),"отложенный исход записан в журнал");
    eq(G.dealsWait.length,1,"и ждёт своего часа");
    /* исход приходит сам, когда время вышло */
    G.dealsWait[0].at=Date.now()-1;
    dealsTick();
    eq(G.dealsWait.length,0,"исход пришёл");
    ok(!questFind("deal:"+d.key),"дело в журнале закрыто");
  }
  /* бросок сделан заранее: один и тот же исход не зависит от момента проверки */
  const key="deal:test";
  const a=rng(hashi(key.length*7717,1234,0xD0))();
  const b=rng(hashi(key.length*7717,1234,0xD0))();
  eq(a,b,"исход детерминирован ключом, а не временем открытия журнала");
  /* сохранение */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.dealsDone={};applySave(snap);
  ok(Object.keys(G.dealsDone).length>0,"отвеченные дела сохранились");
}));

/* ── репутация и хвост набора ── */
TEST_SUITES.push(()=>suite("репутация станции и последние узлы",()=>{
  resetWorld();
  G.rep={};G.credits=1e6;
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  ok(sys,"нашлась станция");
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;G.st=sys.station;
  eq(repAt(),0,"сначала вы им никто");
  const fuel0=fuelPriceHere(),rep0=repairCost(),hire0=mgrHireMul();
  repAdd(3);
  eq(repAt(),3,"репутация выросла");
  ok(fuelPriceHere()<=fuel0,"топливо не дороже: "+fuel0+" → "+fuelPriceHere());
  ok(repairCost()<rep0,"ремонт дешевле");
  ok(mgrHireMul()<hire0,"наниматься дешевле");
  repAdd(-8);
  eq(repAt(),REP_MIN,"шкала не уходит за край");
  ok(fuelPriceHere()>fuel0,"у тех, кто вас не ждёт, топливо дороже");
  ok(repWord(repAt()).ru.length>0,"состояние читается словом: "+repWord(repAt()).ru);
  /* репутация локальна: соседняя станция вас не знает */
  const other={sx:sys.sx+1,sy:sys.sy+1,station:{name:"другая"}};
  eq(repAt(other),0,"на другой станции репутации нет");
  /* освобождение системы красит имя */
  G.rep={};G.occ={};occSet(sys.sx,sys.sy,1);
  for(let i=0;i<occInfo(1).need;i++)occKill(sys.sx,sys.sy);
  ok(repAt()>0,"снявших блокаду помнят: "+repAt());
  /* последние три узла набора падают только в логове */
  G.nodes={};
  const fam=NODE_FAMS[0].id;
  const mine=NODES.filter(n=>n.fam===fam&&n.where==="в шахте");
  ok(mine.length>3,"в семье есть шахтные узлы");
  /* закрываем всё, кроме трёх последних */
  for(const n of NODES)if(n.fam===fam)nodesHave()[n.id]=1;
  const tail=NODES.filter(n=>n.fam===fam&&n.where==="в шахте").slice(0,3);
  for(const n of tail)delete nodesHave()[n.id];
  /* правило узкое: вне логова не выпадают ИМЕННО хвостовые узлы почти
     закрытой семьи; чужие семьи продолжают падать где падали */
  const tailIds={};for(const n of tail)tailIds[n.id]=1;
  let outsideTail=0,inLairTail=0;
  for(let i=0;i<400;i++){
    const n=nodeRoll("в шахте",1,hashi(i,3,9),0);
    if(n&&tailIds[n.id])outsideTail++;
  }
  for(let i=0;i<400;i++){
    const n=nodeRoll("в шахте",1,hashi(i,3,9),1);
    if(n&&tailIds[n.id])inLairTail++;
  }
  eq(outsideTail,0,"хвост набора вне логова не выпадает");
  ok(inLairTail>0,"а в логове выпадает: "+inLairTail+" из 400");
  /* сохранение репутации */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.rep={};applySave(snap);
  ok(Object.keys(G.rep).length>0,"репутация сохранилась");
}));

/* ── узлы падают отовсюду, где сказано ──
   Половина списка мест не была подключена ни к чему, и пятьсот с лишним узлов
   оказались недостижимы — та же ошибка, что «перк без кода». Набор ловит её
   двумя способами: список мест закрыт и совпадает с каталогом, и по каждому
   месту узел действительно достаётся. */
TEST_SUITES.push(()=>suite("узлы: каждое место падения живое",()=>{
  resetWorld();
  const inCatalog={};
  for(const n of NODES)inCatalog[n.where]=(inCatalog[n.where]|0)+1;
  eq(Object.keys(inCatalog).sort().join("|"),NODE_WHERE.slice().sort().join("|"),
     "каталог не знает мест сверх списка");
  for(const w of NODE_WHERE)ok(inCatalog[w]>0,"в «"+w+"» что-то водится: "+inCatalog[w]);
  /* по каждому месту узел достаётся: если место нигде не вызывается, эти узлы
     недостижимы — тест этого не увидит, но увидит, что механика их отдаёт */
  for(const w of NODE_WHERE){
    G.nodes={};
    let got=null;
    for(let i=0;i<400&&!got;i++)got=nodeDrop(w,1,hashi(i*7717,w.length,3),1);
    ok(got,"из «"+w+"» узел достаётся");
    eq(got.where,w,"и это узел именно оттуда");
  }
}));

/* ── памятники стали местом, а не декорацией ── */
TEST_SUITES.push(()=>suite("достопримечательности осматриваются",()=>{
  resetWorld();landOnTestPlanet();
  const S=G.surf,tr=S.tr;
  const list=(tr.poi||[]);
  if(!list.length){ok(true,"на этой планете памятников нет — проверять нечего");return;}
  const q=list[0];
  eq(poiNear({x:q.x+4000},tr),null,"издалека ничего не найдено");
  ok(poiNear({x:q.x},tr),"вплотную — найдено");
  /* осмотр даёт данные один раз */
  G.poiSeen={};
  const d0=G.data;
  S.x=q.x;
  actEdge=true;updateSurface(1);actEdge=false;
  ok(G.data>d0,"осмотр дал данные: "+d0+" → "+G.data);
  ok(G.poiSeen[q.seed],"памятник записан как осмотренный");
  const d1=G.data;
  actEdge=true;updateSurface(1);actEdge=false;
  eq(G.data,d1,"второй раз тот же памятник ничего не даёт");
  /* переживает сохранение */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.poiSeen={};applySave(snap);
  ok(G.poiSeen[q.seed],"осмотренное помнится после загрузки");
}));

/* ── у каждого памятника свой ответ ── */
TEST_SUITES.push(()=>suite("памятники: осмотр отличается по типу",()=>{
  resetWorld();landOnTestPlanet();
  /* таблица покрывает все виды POI: иначе часть форм даёт «аномалию» молча */
  for(const K of POI_KINDS)ok(POI_FIND[K.k],"у «"+K.ru+"» есть свой осмотр");
  for(const k in POI_FIND){
    ok(POI_KINDS.some(K=>K.k===k),"«"+k+"» — настоящий вид POI, а не выдумка таблицы");
    ok(typeof POI_FIND[k].give==="function","у «"+k+"» осмотр что-то даёт");
  }
  /* ни один осмотр не выдаёт кредитов: памятник не банкомат */
  const cr=G.credits;
  const kinds=Object.keys(POI_FIND);
  kinds.forEach((k,i)=>{
    G.poiSeen={};G.cargo.techcomp=0;G.cargo.crystal=0;G.cargo.iridium=0;
    const q={k,ru:POI_FIND[k].ru.toUpperCase(),seed:1000+i};
    ok(poiInspect(q),"«"+k+"» осмотрен");
    eq(poiInspect(q),false,"дважды один памятник не осматривается");
  });
  eq(G.credits,cr,"осмотры не дали ни кредита");
  /* конкретные ответы: завод — техкомпоненты, друза — кристаллы, врата — топливо */
  G.poiSeen={};G.cargo.techcomp=0;
  poiInspect({k:"factory",ru:"ЗАВОД",seed:77});
  ok(G.cargo.techcomp>0,"завод отдал техкомпоненты: "+G.cargo.techcomp);
  G.poiSeen={};G.cargo.crystal=0;
  poiInspect({k:"crystals",ru:"КРИСТАЛЛЫ",seed:78});
  ok(G.cargo.crystal>0,"друза отдала кристаллы: "+G.cargo.crystal);
  G.poiSeen={};G.fuel=10;
  poiInspect({k:"portal",ru:"ВРАТА",seed:79});
  ok(G.fuel>10,"врата долили топлива: "+G.fuel);
  G.poiSeen={};G.relicHint=null;
  poiInspect({k:"temple",ru:"ХРАМ",seed:80});
  ok(G.relicHint,"храм дал координаты");
  /* ── памятник помнит, зачем к нему шли (M105) ── */
  G.poiSeen={};G.cargo.techcomp=0;
  poiInspect({k:"factory",ru:"ЗАВОД",seed:81});
  const memo=poiMemo(81);
  ok(memo,"осмотренный памятник помнится");
  eq(memo.k,"factory","память знает вид памятника");
  ok(memo.got&&memo.got.length>0,"память хранит, что он отдал: "+memo.got);
  eq(poiMemo(82),null,"неосмотренный памятник памяти не имеет");
  /* старое сохранение хранит единицу вместо записи: формат сейва не менялся,
     и такой памятник обязан читаться как осмотренный, а не открываться заново */
  G.poiSeen={83:1};
  ok(poiMemo(83),"старая единица — тоже «осмотрено»");
  eq(poiInspect({k:"factory",ru:"ЗАВОД",seed:83}),false,"старую отметку осмотр уважает");
}));

/* ── репутация в цене железа ── */
TEST_SUITES.push(()=>suite("репутация: железо в доке тоже дешевеет",()=>{
  resetWorld();
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;G.st=sys.station;G.rep={};
  const p0=stationParts(sys)[0];
  ok(p0,"в доке есть части");
  const base=p0.price,shipBase=repShipMul(sys);
  repAdd(5);
  const p1=stationParts(sys)[0];
  ok(p1.price<base,"своим части дешевле: "+base+" → "+p1.price);
  ok(repShipMul(sys)<shipBase,"и корпуса тоже");
  /* но скидка на железе меньше, чем на работе: станок вас не помнит */
  ok(1-repPartMul(sys)<1-repRepairMul(),"скидка на железе меньше, чем на ремонте");
  repAdd(-10);
  ok(stationParts(sys)[0].price>base,"у тех, кто вас не ждёт, дороже");
}));
