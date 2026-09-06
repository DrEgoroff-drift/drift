/* ══════════════ разбор 0.409.1 — по письмам соседнего захода ══════════════
   Девять находок по базе и четыре по бою. Каждая здесь пришпилена: то, что
   один раз уже проскочило мимо всех сетей, обязано краснеть при возврате. */
TEST_SUITES.push(()=>suite("разбор: директор не отменяет сам себя",()=>{
  const B=bLife();
  B.type="desert";                              /* где дует */
  B.sx=0;B.sy=0;
  /* назначенная директором буря случается, а не бросается второй раз */
  let hit=0;
  for(let i=0;i<12;i++){
    const B2=bLife();B2.type="desert";
    for(let c=0;c<BASE_COLS;c++)B2.cells[c]={k:"solar",hp:1};
    if(baseEventApply(B2,{k:"storm"},baseShift()+i))hit++;
  }
  eq(hit,12,"буря по слову директора случается каждый раз: "+hit+" из 12");
  /* но место решает: где не дует — не дует и по приказу */
  const B3=bLife();B3.type="gas";
  eq(baseEventApply(B3,{k:"storm"},baseShift()),0,"на газовом мире бури нет и по слову директора");
  /* и налёт: в безопасном секторе его не бывает */
  const B4=bLife();B4.sx=0;B4.sy=0;
  eq(baseEventApply(B4,{k:"raid"},baseShift()),0,"в тихом секторе налёта нет");
}));

TEST_SUITES.push(()=>suite("разбор: догон глубже суток ест, а не только копает",()=>{
  const B=bLife();
  B.cells[5]={k:"habitat",hp:1};B.cells[4]={k:"reactor",hp:1};
  bCrew(B,2);
  const L=baseLife(B);
  L.air=LIFE_START;L.water=LIFE_START;L.food=LIFE_START;
  B.pool={};
  /* сутки с лишним отсутствия: и добыча, и расход считаются за все смены */
  B.t0=baseShift()-60;
  bNoDir(()=>baseResolve(B,Date.now()));
  ok(bPool(B)>0,"за шестьдесят смен что-то добыто: "+bPool(B));
  ok(baseLife(B).air<LIFE_START,"и воздух за них потрачен: "+baseLife(B).air);
  ok(baseLife(B).food<LIFE_START,"и харч тоже");
  /* и запас кончается там же, где кончился бы посменно: база встаёт */
  const B2=bLife();
  B2.cells[5]={k:"habitat",hp:1};
  bCrew(B2,3);
  baseLife(B2).air=6;baseLife(B2).water=200;baseLife(B2).food=200;
  B2.pool={};
  B2.t0=baseShift()-40;
  bNoDir(()=>baseResolve(B2,Date.now()));
  ok(baseParked(B2),"на догоне база встала так же, как встала бы посменно");
  eq(baseLife(B2).air,0,"и воздух в нуле, а не в минусе");
}));

TEST_SUITES.push(()=>suite("разбор: цифры покупаются и в сводке",()=>{
  const B=bLife();
  B.cells[5]={k:"habitat",hp:1};
  bCrew(B,1);
  G.crew[0].role="driller";
  for(const id of INSTR_KEYS)instrUnit(id).wear=0;
  /* казённый приёмник — это НЕ приборы: с ним всё ещё слова */
  eq(instrUnit("radio").w,"kazenny","на борту казённый приёмник");
  eq(baseSharp(B),0,"и он цифр не даёт");
  ok(!/\d/.test(baseGaugeLine(B)),"шкалы словами: "+baseGaugeLine(B));
  /* и по СВЯЗИ рядом — тоже слова, а не числа */
  G.sx=B.sx;G.sy=B.sy;
  const R=baseReport(B);
  eq(R.lvl,3,"сигнал полный");
  ok(!/воздух \d/.test(R.head),"а сводка всё равно словами: "+R.head);
  /* радист возвращает цифры и там, и там */
  G.crew[0].role="radist";
  ok(baseSharp(B)>0,"с радистом сведения есть");
  ok(/\d/.test(baseGaugeLine(B)),"шкалы в цифрах");
  ok(/воздух \d/.test(baseReport(B).head),"и сводка тоже");
  /* и второй рычаг — купленный приёмник, а не удачный бросок казённого */
  G.crew[0].role="driller";
  eq(baseSharp(B),0,"без радиста снова слова");
  instrUnit("radio").w="vekha";
  ok(baseSharp(B)>0,"«Веха» на борту — цифры есть и без него");
  instrUnit("radio").wear=.9;
  eq(baseSharp(B),0,"а разбитая «Веха» — снова прилагательные");
}));

TEST_SUITES.push(()=>suite("разбор: оборот, доли и выкуп у ПАЛАТЫ",()=>{
  const B=bLife();
  G.crew=[];
  /* оборот базы — это то, что с неё увезли, а не только проданные излишки */
  B.pool={iron:40};
  B._turn=0;B._earned=0;
  for(const k of RES_KEYS)G.cargo[k]=0;      /* трюм пуст, но ключи на месте */
  baseCollect(B);
  ok((B._turn|0)>0,"увезённое стало оборотом: "+B._turn);
  eq(B._turn|0,B._earned|0,"и с него же считается доля управляющего");
  /* участок, изъятый за долг, выкупается — и стоит он долга */
  const B2=bLife();
  const P=palOf(B2);
  P.debt=PAL_SEIZE;
  palStep(B2,baseShift());
  ok(baseIsRuin(B2)&&B2.ruin.who==="pal","участок изъят");
  ok(baseRuinPrice(B2)>=PAL_SEIZE,"выкуп не даровой: "+baseRuinPrice(B2));
  G.credits=10;
  eq(baseRuinTake(B2),false,"без денег не выкупить");
  G.credits=baseRuinPrice(B2)+5;
  ok(baseRuinTake(B2),"с деньгами — выкупили");
  eq(palOf(B2).debt|0,0,"и долг закрыт");
  /* снятая с учёта база теряет темп: тишина не бесплатна */
  const B3=bLife();
  eq(palCapWork(B3),1,"в реестре потолка нет");
  G.credits=PAL_CLOSE+100;
  ok(palClose(B3),"сняли с учёта");
  ok(palCapWork(B3)<1,"и выработка просела: ×"+palCapWork(B3));
}));

TEST_SUITES.push(()=>suite("разбор: борт державы воюет не с вами",()=>{
  resetWorld();
  G.sx=3;G.sy=3;
  G.ship.x=0;G.ship.y=0;
  /* два борта разных держав рядом с игроком: цель друг для друга, а не он */
  const a={x:200,y:0,vx:0,vy:0,a:0,hull:80,hullMax:80,pw:"gt",iff:1,rank:1,seed:1,cool:0};
  const b2={x:260,y:60,vx:0,vy:0,a:0,hull:80,hullMax:80,pw:"km",iff:1,rank:1,seed:2,cool:0};
  G.pirates=[a,b2];
  eq(npcFoeFor(a),b2,"чужой борт — вот его цель");
  eq(npcFoeFor(b2),a,"и наоборот");
  /* посольство и мишень целями не бывают никогда */
  const dip={x:210,y:10,hull:50,pw:"ra",dip:1};
  const dum={x:215,y:15,hull:50,dummy:1};
  G.pirates=[a,dip,dum];
  eq(npcFoeFor(a),null,"ни посольство, ни мишень");
  /* свои — тоже не цель */
  G.pirates=[a,{x:205,y:5,hull:50,pw:"gt",iff:1}];
  eq(npcFoeFor(a),null,"и свой борт не цель");
  /* а пират — цель */
  const pir={x:205,y:5,hull:50};
  G.pirates=[a,pir];
  eq(npcFoeFor(a),pir,"пират — цель");
}));

TEST_SUITES.push(()=>suite("разбор: заём платит за дело, а не за тишину",()=>{
  resetWorld();
  G.bonds=1000;G.bondHold=0;
  /* без отметки о владениях выплаты нет: «сейчас тихо» — не результат */
  G.credits=0;
  eq(riteLoanSettle(),0,"без обряда и отметки не платят");
  ok(G.credits<=0,"и денег не прибавилось");
}));

TEST_SUITES.push(()=>suite("разбор: своё топливо не дешевле прилавка",()=>{
  const B=bLife();
  /* себестоимость — это цена сырья, а не половина её (письмо 3, п. 8) */
  const per=RES.ice.price/FUEL_PER_ICE;
  ok(per>=5,"единица топлива из своего льда стоит "+per.toFixed(1)+" кр — не дешевле самого дешёвого прилавка");
  /* и сама заправка честно берёт лёд со склада */
  B.pool.ice=20;
  const st=stat();
  G.fuel=Math.max(0,st.fuelMax-10);
  const took=baseRefuel(B);
  ok(took>0,"залили: "+took+" льда");
  eq(B.pool.ice|0,20-took,"и лёд ушёл со склада");
  ok(G.fuel<=st.fuelMax+.001,"бак не переполнен: "+G.fuel.toFixed(1));
  /* пустой склад — не заправка */
  B.pool.ice=0;G.fuel=1;
  eq(baseRefuel(B),0,"без льда база ничего не наливает");
}));
