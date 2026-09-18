/* ══════════════ автотесты: трудовая книжка (M161) ══════════════ */
TEST_SUITES.push(()=>suite("книжка: записи делают другие, доска почёта с трёх записей, стаж в годах",{tier:"browser"},()=>{
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

TEST_SUITES.push(()=>suite("книжка: медкомиссия через 12 лет на стойке ядра — пенсия, последняя запись попугая",{tier:"node"},()=>{
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

/* ── M511: волокита ──
   N не сообщается; документы по одному, у каждого свой чиновник; Орднунг в
   трёх экземплярах, Коммуна на обеде; варенье ничего не меняет; последний
   подписывает не глядя — и только у него имя; без бумаг не едут. */
TEST_SUITES.push(()=>suite("волокита M511: бумаги на животное — по одной, никто не говорит сколько",()=>{
  resetWorld();G.credits=5000;G.vol={};
  G.beast={sx:0,sy:0,idx:0,sp:"Тестовый зверь",seed:777};
  const A=volAnimals();eq(A.length,1,"зверь в клетке — животное на борту");
  const a=A[0],P=volOf(a);
  ok(P.need>=VOL_MIN&&P.need<=VOL_MAX,"N от 2 до 10: "+P.need);
  ok(!volOk(a),"бумаг нет");
  eq(volRail(),false,"проводник не пускает");
  const c0=G.credits;eq(volBorder("or"),1,"пикет заметил");eq(G.credits,c0,"первый раз — махнул рукой");
  volBorder("or");eq(G.credits,c0-VOL_FINE,"второй — штраф");
  const own0=window.stampOwnerAt;
  let guard=0;
  while(!P.done&&guard++<60){
    const N=volNext(a);
    if(N.last){G.mode="dock";G.st={stype:"trade",by:"gt"};ok(volSign(a),"последний подписывает где угодно");break;}
    G.mode="dock";G.st={stype:N.st,by:N.by};window.stampOwnerAt=()=>N.by;
    let tries=0;
    while(volNext(a)&&volNext(a).i===N.i&&tries++<5){
      const r=volSign(a);
      if(!r)clockAdvance(HOLD_SHIFT+1);   /* три экземпляра и обед — в другую смену */
    }
    ok(volNext(a)===null||volNext(a).i===N.i+1,"документ "+N.i+" подписан: "+N.ru);
  }
  window.stampOwnerAt=own0;
  ok(P.done,"бумаги в порядке после "+P.docs.length+" подписей");
  eq(P.docs.length,P.need,"ровно N — ни больше, ни меньше");
  ok(!!P.docs[P.docs.length-1].name,"имя только у последней подписи: "+P.docs[P.docs.length-1].name);
  ok(P.docs.slice(0,-1).every(d=>!d.name),"у остальных имени нет");
  ok(volRail(),"с бумагами проводник пускает");
  ok(thingsAll().some(t=>/Ветпаспорт/.test(t.ru)),"ветпаспорт в ВЕЩАХ");
  G.beast={sx:0,sy:0,idx:0,sp:"Второй",seed:778};
  const b=volAnimals()[0],Q=volOf(b);
  eq(volFast(b),false,"без намёка не ускоряют");
  Q.hint=1;const need=Q.need,cr=G.credits;
  ok(volFast(b),"варенье передано");
  eq(G.credits,cr-VOL_FAST,"варенье стоит "+VOL_FAST);
  eq(Q.need,need,"и ничего не изменилось");
  eq(Q.fast,1,"штамп «принято к сведению» лёг в стопку");
  G.beast=null;G.mode="system";
}));
