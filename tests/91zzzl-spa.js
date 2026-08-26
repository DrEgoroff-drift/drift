/* ══════════════ автотесты: санаторий (M199) ══════════════ */
function spaTestStart(){
  resetWorld();
  G.spa=null;G.things=[];G.record=null;G.log=[];
  G.inst={t:{},vouch:1,used:0};
  G.surf={p:{type:"ocean",name:"Тиун III"}};
  thingAdd("voucher","Путёвка · санаторий","за тему");
  enterSpa();
  return spaAll();
}
TEST_SUITES.push(()=>suite("санаторий: три дня надо прожить, а не получить",()=>{
  const S=spaTestStart();
  ok(!!S,"приехали");
  eq(G.mode,"spa","и мы на веранде");
  eq(S.day,1,"первый день");
  eq(instAll().vouch,0,"путёвка потрачена");
  ok(!thingsAll().some(t=>t.k==="voucher"),"и со стола убрана");
  /* сутки идут только сном */
  const t0=G.t;
  spaSleep();
  eq(S.day,2,"проспали — день прошёл");
  eq(G.t-t0,CEL_DAY,"ровно сутки");
  spaSleep();
  eq(S.day,3,"второй");
  const cr=G.credits,dt=G.data;
  spaSleep();
  ok(!spaOn(),"на четвёртое утро курс кончился");
  eq(G.mode,"surface","и мы снова на планете");
  /* и это ЕДИНСТВЕННОЕ место в игре, которое ничего не даёт */
  eq(G.credits,cr,"денег не заплатили");
  eq(G.data,dt,"данных не начислили");
  ok(recordAll().e.some(x=>x.a==="санаторий"),"одна строка в книжке — и всё");
}));
TEST_SUITES.push(()=>suite("санаторий: процедуру можно пропустить, и за это ничего не будет",()=>{
  const S=spaTestStart();
  /* прошли все три дня, не сделав вообще ничего */
  spaSleep();spaSleep();
  const c=genMerc(3,["haul"]);c.morale=.2;G.crew=[c];
  spaSleep();
  eq(c.morale,1,"экипаж всё равно отдохнул");
  ok(recordAll().e.some(x=>/без замечаний/.test(x.s)),"и претензий нет");
  /* второй заход: делаем всё — исход тот же самый */
  const S2=spaTestStart();
  const c2=genMerc(3,["haul"]);c2.morale=.2;G.crew=[c2];
  for(const P of SPA_PLAN)ok(spaTake(P.k),"процедура принята: "+P.ru);
  for(const P of SPA_PLAN)ok(!spaTake(P.k),"дважды за день — нет: "+P.ru);
  spaSleep();spaSleep();spaSleep();
  eq(c2.morale,1,"исход ровно тот же");
  /* ни очков, ни счётчика посещаемости нигде */
  const j=JSON.stringify(recordAll().e);
  ok(!/\d+\s*из\s*\d+|балл|очк/i.test(j),"в книжке нет ни очков, ни посещаемости");
}));
TEST_SUITES.push(()=>suite("санаторий: уйти можно в любую минуту",()=>{
  const S=spaTestStart();
  spaTake("bath");
  navAction();
  eq(G.mode,"surface","вышли");
  ok(spaAll(),"курс при этом не закрыт: путёвка не сгорела");
  ok(!spaAll().done,"и он ждёт");
  /* и переживает сохранение */
  const before=JSON.stringify(G.spa);
  const snap=snapshot();G.spa=null;applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(G.spa),before,"санаторий пережил сохранение");
  const old=snapshot();delete old.spa;
  applySave(JSON.parse(JSON.stringify(old)));
  ok(!spaOn(),"сохранение без санатория — не падение");
}));
TEST_SUITES.push(()=>suite("санаторий: соседи говорят о себе и ничего не просят",()=>{
  spaTestStart();
  const seen={};
  for(let i=0;i<24;i++){const l=spaTalk();seen[l]=1;}
  ok(Object.keys(seen).length>=3,"строк несколько ("+Object.keys(seen).length+")");
  for(const l of Object.keys(seen)){
    ok(SPA_FOLK.indexOf(l)>=0,"строка из таблицы");
    ok(!/принеси|нужн|дай|помог|награ/i.test(l),"ничего не просят: "+l.slice(0,40));
  }
  G.spa=null;G.mode="system";G.surf=null;
}));
