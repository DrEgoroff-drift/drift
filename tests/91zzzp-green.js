/* ══════════════ автотесты: грядка у дома (M204) ══════════════ */
TEST_SUITES.push(()=>suite("грядка: сеется описанный вид, и уходит образец",()=>{
  resetWorld();
  G.green=null;G.bio=0;G.species=new Set();G.record=null;G.log=[];
  ok(!greenCanSow(),"без образцов и без реестра сеять нечего");
  eq(greenSow(),null,"и кнопка ничего не делает");
  G.species.add("стеблевик малый");
  ok(!greenCanSow(),"реестр есть, образца нет — всё равно нельзя");
  G.bio=2;
  ok(greenCanSow(),"с образцом — можно");
  const b=greenSow();
  ok(!!b&&b.name==="стеблевик малый","посеян описанный вид: "+b.name);
  eq(G.bio,1,"образец израсходован");
  eq(greenAll().beds.length,1,"грядка занята");
  ok(!greenCanSow(),"второй раз тот же вид не сеется");
  /* сеется тот, что описан позже прочих */
  G.species.add("зонтичник дальний");
  ok(greenCanSow(),"новый вид — можно снова");
  eq(greenNext(),"зонтичник дальний","сеется последний описанный");
  greenSow();
  eq(greenAll().beds.length,2,"грядок две");
  /* больше четырёх не бывает */
  G.bio=99;
  G.species.add("а");G.species.add("б");G.species.add("в");
  greenSow();greenSow();greenSow();
  eq(greenAll().beds.length,GREEN_BEDS,"грядок не больше четырёх");
  ok(recordAll().e.some(x=>/засеяна вся/.test(x.s)),"и одна строка в книжке");
}));
TEST_SUITES.push(()=>suite("грядка: растёт настоящими сутками, Вега поливает",()=>{
  resetWorld();
  G.green=null;G.bio=5;G.species=new Set(["стеблевик"]);G.vega=null;
  const b=greenSow();
  ok(greenGrow(b)<0.02,"только что посеяно — ничего не выросло");
  /* трое суток назад */
  b.t=Date.now()-3*86400000;
  const dry=greenGrow(b);
  ok(dry>0.3&&dry<0.7,"за трое суток — примерно половина ("+dry.toFixed(2)+")");
  /* Вега на борту: поливает, и растёт быстрее */
  G.vega={aboard:true,stage:2};
  ok(greenWatered(),"есть кому поливать");
  const wet=greenGrow(b);
  ok(wet>dry,"политое растёт быстрее ("+wet.toFixed(2)+" против "+dry.toFixed(2)+")");
  /* взрослое не перерастает */
  b.t=Date.now()-99*86400000;
  eq(greenGrow(b),1,"взрослое остаётся взрослым, а не растёт вечно");
  /* ничего не даёт: ни денег, ни данных */
  const cr=G.credits,dt=G.data;
  greenGrow(b);greenPrompt();
  eq(G.credits,cr,"денег не приносит");
  eq(G.data,dt,"данных тоже");
}));
TEST_SUITES.push(()=>suite("грядка: форма от имени, и сохранение её помнит",()=>{
  resetWorld();
  G.green=null;
  const p={T:TYPES.terran,type:"terran"};
  const a1=greenSpecies("стеблевик малый",p), a2=greenSpecies("стеблевик малый",p);
  eq(a1,a2,"одно имя — один вид");
  const b1=greenSpecies("зонтичник дальний",p);
  ok(b1.kind!==a1.kind||b1.leaf.join()!==a1.leaf.join(),"разные имена — разные виды");
  ok(a1.leaf.length===3&&a1.stem.length===3,"у вида есть цвет листа и стебля");
  /* сохранение */
  G.bio=3;G.species=new Set(["стеблевик малый","зонтичник дальний"]);
  greenSow();greenSow();
  const before=JSON.stringify(greenAll().beds);
  const snap=snapshot();G.green=null;applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(greenAll().beds),before,"грядки пережили сохранение");
  /* мусор отброшен */
  const bad=snapshot();bad.green.beds=[{name:""},{t:5},{name:"годный",t:1}];
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(greenAll().beds.length,1,"безымянные грядки отброшены");
  eq(greenAll().beds[0].name,"годный","осталась годная");
  const old=snapshot();delete old.green;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(greenAll().beds.length,0,"сохранение без грядки — пустая земля, а не падение");
}));
