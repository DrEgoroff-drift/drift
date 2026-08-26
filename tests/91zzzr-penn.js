/* ══════════════ автотесты: переходящий вымпел (M206) ══════════════ */
function pennTestBase(cells,bal){
  return {cells:new Array(cells).fill("habitat").concat(new Array(4).fill(null)),
          _bal:bal,sx:0,sy:0,idx:0};
}
TEST_SUITES.push(()=>suite("вымпел: раз в квартал, лучшей базе, и ничего не даёт",()=>{
  resetWorld();
  G.bases={};G.penn=[];G.record=null;G.log=[];
  eq(pennHolder(),null,"без баз вымпел никому");
  ok(!pennTick(),"и объявлять нечего");
  /* две базы: одна построена больше */
  G.bases["1,1:0"]={cells:["habitat","reactor",null,null]};
  G.bases["5,5:0"]={cells:["habitat","reactor","drill","storage","habitat"]};
  const who=pennHolder();
  ok(!!who,"вымпел кому-то достался: "+who);
  eq(who,"5,5:0","и это та, где построено больше");
  /* объявляется один раз за квартал */
  const cr=G.credits,dt=G.data;
  ok(pennTick(),"объявлено");
  ok(!pennTick(),"дважды за квартал — нет");
  eq(G.credits,cr,"денег не даёт");
  eq(G.data,dt,"данных не даёт");
  ok(recordAll().e.some(x=>x.a==="вымпел"),"строка в книжке есть");
  /* следующий квартал — снова можно */
  G.t+=CEL_DAY*PENN_DAYS;
  ok(pennTick(),"в новом квартале объявляют снова");
}));
TEST_SUITES.push(()=>suite("вымпел: он переходит, а не прирастает к одной базе",()=>{
  resetWorld();
  G.bases={};G.penn=[];
  /* три равные базы: за несколько кварталов знамя должно побывать не у одной */
  G.bases["1,1:0"]={cells:["habitat","reactor","drill"]};
  G.bases["2,2:0"]={cells:["habitat","reactor","drill"]};
  G.bases["3,3:0"]={cells:["habitat","reactor","drill"]};
  const seen={};
  const t0=G.t;
  for(let i=0;i<12;i++){G.t=t0+CEL_DAY*PENN_DAYS*i;seen[pennHolder()]=1;}
  G.t=t0;
  ok(Object.keys(seen).length>=2,"за год знамя побывало не у одной базы ("+
     Object.keys(seen).length+")");
  /* но в пределах квартала оно не прыгает */
  const a=pennHolder(),b=pennHolder();
  eq(a,b,"внутри квартала держатель один");
}));
TEST_SUITES.push(()=>suite("вымпел: список кварталов переживает сохранение и не растёт",()=>{
  resetWorld();
  G.bases={"1,1:0":{cells:["habitat","reactor"]}};
  G.penn=[];
  for(let i=0;i<40;i++)pennAll().push(i);
  const snap=snapshot();G.penn=null;applySave(JSON.parse(JSON.stringify(snap)));
  ok(pennAll().length<=16,"список подрезан ("+pennAll().length+")");
  eq(pennAll()[pennAll().length-1],39,"подрезан с начала");
  const bad=snapshot();bad.penn=[1,"два",null,3];
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(pennAll().join(","),"1,3","мусор отброшен");
  const old=snapshot();delete old.penn;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(pennAll().length,0,"сохранение без вымпела — не падение");
}));
