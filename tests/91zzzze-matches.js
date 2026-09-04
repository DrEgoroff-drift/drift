/* ══════════════ автотесты: спички — валюта из разборки (M340) ══════════════ */
TEST_SUITES.push(()=>suite("спички: под кожухом по тиру, кошелёк целый и персистится",()=>{
  resetWorld();
  eq(matchesRec(),0,"новый мир — ни одной спички");
  eq(matchesInPart(genPart(11,1,"engine")),0,"обычная часть внутри пуста");
  eq(matchesInPart(genPart(12,2,"engine")),0,"добротная — тоже");
  eq(matchesInPart(genPart(13,3,"engine")),1,"редкая — одна спичка");
  eq(matchesInPart(genPart(14,4,"engine")),3,"отменная — три");
  let box=0,five=0,bad=0;
  for(let s=0;s<200;s++){const m=matchesInPart(genPart(s,5,"engine"));if(m===MATCH_BOX)box++;else if(m===5)five++;else bad++;}
  eq(bad,0,"легендарная даёт пять или коробок, третьего нет");
  ok(box>10&&box<80&&five>100,"легендарная: обычно пять, иногда коробок ("+box+" из 200)");
  const p=genPart(21,4,"engine");G.inv.push(p);
  const r=scrapPart(p.id);
  eq(r.matches,3,"разбор отменной части отдал три спички");
  eq(matchesRec(),3,"и они легли в кошелёк");
  ok(!matchesSpend(4),"четырёх нет — не тратится");
  ok(matchesSpend(2)&&matchesRec()===1,"две потрачены, одна осталась");
  G.matches=-5;eq(matchesRec(),0,"кошелёк не уходит в минус");
  G.matches=7;const snap=snapshot();eq(snap.matches,7,"снимок несёт спички");
  G.matches=0;applySave(snap);eq(G.matches,7,"и они возвращаются из сохранения");
  const s2=JSON.parse(JSON.stringify(snap));delete s2.matches;applySave(s2);eq(G.matches,0,"старое сохранение без поля — ноль, не NaN");
  eq(matchesRu(1),"1 спичка","склонение: одна");eq(matchesRu(3),"3 спички","три");eq(matchesRu(11),"11 спичек","одиннадцать");
  ok(matchesScrapNote(0).indexOf("пусто")>=0&&matchesScrapNote(8).indexOf("коробок")>=0,"трюм говорит словами §13");
}));
