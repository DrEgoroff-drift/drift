/* ══════════════ автотесты: институт (M162) ══════════════ */
function instTestSci(){
  for(let x=-14;x<=14;x++)for(let y=-14;y<=14;y++){if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station&&S.station.stype==="sci")return S;}
  return null;
}
TEST_SUITES.push(()=>suite("институт: тема берётся письмом, отчёт — лентой; три исхода, путёвка",()=>{
  resetWorld();
  G.inst=null;G.things=[];G.log=[];G.record=null;G.strips=[];
  const S=instTestSci();ok(!!S,"научная станция есть");
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  const t=INST_TOPICS.find(x=>x.id==="4a");
  ok(instTake(t),"тема 4-А взята");
  ok(G.things.some(x=>x.topic==="4a"),"письмо института на столе");
  ok(!instCanReport(t),"без ленты отчитаться нечем");
  G.strips=[{sx:0,sy:0,mis:.1,span:30,t:1}];
  ok(instCanReport(t),"с лентой — есть чем");
  /* перебираем исходы: закрыта / через неделю / неактуальна — все три допустимы */
  ok(instReport(t),"отчёт сдан");
  const st=instState("4a").st;
  ok(st===2||st===3||st===4,"исход: "+["","взята","зайдите через неделю","закрыта","неактуальна"][st]);
  eq(G.strips.length,0,"лента ушла в отчёт");
  if(st===2){
    G.t+=CEL_DAY*8;instTick();
    const st2=instState("4a").st;
    ok(st2===3||(st2===2&&instState("4a").wrong),"через неделю — закрыта или «не в тот отдел»");
    if(st2===2){G.t+=CEL_DAY*31;instTick();eq(instState("4a").st,3,"через месяц всплыла и закрыта");ok(recordAll().e.some(x=>/выговор/.test(x.s)),"с выговором в книжке");}
  }
  if(instState("4a").st===3){
    ok(instAll().vouch>=1,"путёвка выдана");
    ok(G.things.some(x=>x.k==="voucher"),"и лежит на столе");
  }
  const s=snapshot();G.inst=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(instState("4a").st>0,"тема пережила сохранение");
}));

TEST_SUITES.push(()=>suite("институт: путёвка открывает санаторий, а не начисляет отдых",()=>{
  /* С M199 путёвка перестала быть строкой «+3 суток»: она открывает МЕСТО.
     Три дня и отдых берутся там, прожитыми, а не выданными на стойке. */
  resetWorld();
  G.inst={t:{},vouch:1,used:0};G.things=[];G.record=null;G.spa=null;
  const c=genMerc(3,["haul"]);c.morale=.2;G.crew=[c];
  G.surf={p:{type:"ice"}};ok(!instRestHere(),"на льду не курорт");
  G.surf={p:{type:"ocean",name:"—"}};ok(instRestHere(),"океан — курорт");
  const t0=G.t;
  ok(instRest(),"поехали");
  eq(G.mode,"spa","путёвка открыла санаторий");
  eq(G.t-t0,0,"и ни одного дня НЕ начислила: их надо прожить");
  eq(c.morale,.2,"мораль тоже не выдана авансом");
  eq(instAll().vouch,0,"путёвка использована");
  G.spa=null;G.mode="system";
  G.surf=null;G.crew=[];G.inst=null;
}));
