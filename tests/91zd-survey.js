/* ══ M115: отчёт собран, а не рассказан ══
   Сторож замысла: слой съёмки показывает ровно то, что заработано; точка куска
   не зависит от игрока и не выдаётся дважды; ноги маршрута появляются только у
   прочитанной главы; и весь проход проходится без того, чтобы срок (M114) был
   отработан удачно. */
TEST_SUITES.push(()=>suite("отчёт: собран, а не рассказан",()=>{
  resetWorld();
  eq(surveyList().length,0,"без кусков съёмки нет вовсе");
  eq(surveyLegs().length,0,"и ног маршрута тоже");

  /* точка куска — свойство куска, а не игрока */
  const R=LORE[0];
  const p1=surveyPoint(R);
  ok(!!p1,"у куска есть точка съёмки");
  G.sx=9;G.sy=-7;
  const p2=surveyPoint(R);
  eq(p2.sx,p1.sx,"точка не зависит от того, где стоит игрок");
  eq(p2.sy,p1.sy,"и от его перелётов");
  ok(!!starAt(p1.sx,p1.sy),"съёмка стоит на звезде, а не в пустоте");

  /* слой показывает ровно заработанное */
  resetWorld();
  loreList().push(LORE[0].id,LORE[1].id,LORE[2].id);
  eq(surveyList().length,3,"точек ровно столько, сколько кусков");
  const ids=surveyList().map(p=>p.id);
  eq(ids.length,new Set(ids).size,"ни один кусок не показан дважды");
  ok(surveyList().every(p=>loreHas(p.id)),"на карте нет ни одной точки авансом");

  /* порядок — тот, в каком нашли: это отчёт ЭТОГО игрока */
  eq(surveyList()[0].id,LORE[0].id,"первым стоит найденный первым");
  resetWorld();
  loreList().push(LORE[2].id,LORE[0].id);
  eq(surveyList()[0].id,LORE[2].id,"у другого порядка находок — другой отчёт");

  /* ноги маршрута — только у сложившейся главы */
  resetWorld();
  const cid=LORE_CHAP[0].id;
  const chapAll=LORE_BY_CHAP[cid];
  loreList().push(chapAll[0].id,chapAll[1].id);
  ok(!loreChapter(cid).read,"глава ещё не сложилась");
  eq(surveyLegs().length,0,"и ноги маршрута не рисуются");
  for(const rec of chapAll)if(!loreHas(rec.id))loreList().push(rec.id);
  ok(loreChapter(cid).read,"глава сложилась");
  ok(surveyLegs().length>0,"и её точки соединились ногами маршрута");
  ok(surveyLegs().every(l=>loreChapter(l[2]).read),"ног у несложившихся глав нет");

  /* проход не зависит от того, чем кончился срок */
  ok(!G.doom,"срока в этом мире не было вовсе");
  ok(surveyList().length>0,"а отчёт всё равно собирается: M114 ему не указ");

  /* карта и полка рисуются без падений */
  G.mode="map";G.sel={x:G.sx,y:G.sy};
  drawMap();
  ok(true,"карта со слоем съёмки нарисована");
  G.mode="system";
}));
