/* ══════════════ автотесты: трудовая книжка (M161) ══════════════ */
TEST_SUITES.push(()=>suite("книжка: записи делают другие, доска почёта с трёх записей, стаж в годах",()=>{
  resetWorld();
  G.record=null;G.things=[];
  const R=recordAll();
  eq(recordYears(),0,"стаж ноль");
  ok(recordAdd("Цициин","благодарность за наряд"),"станция записала");
  ok(!recordAdd("Цициин","благодарность за наряд"),"та же запись в тот же день — не дублируется");
  recordAdd("Цициин","благодарность: привёз органику");recordAdd("Цициин","выговор: опоздал");
  eq(recordHonour()[0],"Цициин","три записи — доска почёта");
  G.t+=CEL_DAY*366;
  eq(recordYears(),1,"год прошёл");
  /* страница на столе */
  tableToggle(true,"record");
  ok([...document.querySelectorAll("#loglist .li")].length>=4,"страница с записями");
  ok(!document.querySelector("#loglist").textContent.match(/\bя\b/i),"ни одной записи от первого лица");
  tableToggle(false);
  const s=snapshot();G.record=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(recordAll().e.length,3,"книжка пережила сохранение");
}));

TEST_SUITES.push(()=>suite("книжка: медкомиссия через 12 лет на стойке ядра — пенсия, последняя запись попугая",()=>{
  resetWorld();
  G.record=null;G.things=[];G.vega={stage:4,parrot2:1,broken:[],out:{},aboard:0,att:0,away:0,homeDays:0,evict:0,mood:1,offend:-1,lastDay:celDay(),calls:0,said:0};
  const at=regionOfTheme("hours");const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const core=getSystem(R.core.sx,R.core.sy);
  G.sx=core.sx;G.sy=core.sy;G.sys=core;G.st=core.station||{name:"ядро",stype:"x"};
  ok(!recordBoardHere(),"рано: стажа нет");
  G.t+=CEL_DAY*365*RECORD_YEARS+CEL_DAY;
  eq(recordYears(),RECORD_YEARS,"двенадцать лет");
  ok(recordBoardHere(),"комиссия на стойке ядра");
  ok(recordGround(),"к полётам не допущен");
  ok(recordAll().grounded===1,"пенсия");
  ok(recordAll().e.some(x=>x.a==="попугай"),"последнюю запись сделал попугай");
  ok(G.things.some(t=>t.k==="record"&&t.note.indexOf("двумя попугаями")>=0),"с Вегой и двумя попугаями");
  ok(!recordBoardHere(),"второй раз не зовут");
  G.vega=null;G.record=null;
}));
