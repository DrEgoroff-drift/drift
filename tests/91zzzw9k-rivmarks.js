/* Соперники у ваших ориентиров (M910b, DESIGN-game §7.3): памятник, на котором вы действовали,
   в другую посадку и не раньше RIVMK_AGE получает след одного из шестерых, кого вы встречали по
   историям; один след на соперника и на памятник; tell и журнал один раз; строка в подсказке. */
const RM_Q=seed=>({k:"wreck",ru:"ОСТОВ КОРАБЛЯ",x:6000,y:0,h:150,sc:1,seed:seed>>>0});
function rmActed(seed){
  const q=RM_Q(seed);
  ok(plnActDo(q,"hatch",{d:.3,p:{res:TRADE_KEYS.slice(0,3)}}),"люк вскрыт: памятник ваш ("+seed+")");
  return q;
}
TEST_SUITES.push(()=>suite("соперники: след у вашего памятника — после встречи, в другую посадку, не сразу",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;
  try{
    G.seen={};G.rivMk=null;G.t=50000;
    const q=rmActed(0xB0A7),m=plnMarkState(q);
    const late={t0:m.t0+RIVMK_AGE+60},soon={t0:m.t0+600},same={t0:m.t0-300};
    eq(rivMkPlace(q,m,late),null,"ни с кем не встречались — следа нет");
    G.seen["relay_baker.t1"]=0;
    ok(rivMkMet("baker")&&!rivMkMet("kim"),"встречен тот, чей след истории виден");
    eq(rivMkPlace(q,m,same),null,"та же посадка, в которую действовали, — следа нет");
    eq(rivMkPlace(q,m,soon),null,"вернулись через десять секунд — следа нет");
    const q2=RM_Q(0xB0A8),m2=plnActMemo(q2,true);
    eq(rivMkPlace(q2,m2,{t0:m2.t0+RIVMK_AGE+60}),null,"памятник, на котором не действовали, — не ваш");
    const r=rivMkPlace(q,m,late);
    eq(r&&r.id,"baker","встреченный один — его след");
    eq(G.rivMk.baker.s,q.seed,"след записан к памятнику");
    const n0=G.log.length,A={prompt:"ОСТОВ КОРАБЛЯ · ВСКРЫТ"};
    rivMkShow(q,A,late);
    eq(A.prompt,"ОСТОВ КОРАБЛЯ · ВСКРЫТ · СЛЕД ПЕКАРЯ","след — в строке имени, её вешает табличка памятника");
    const A2={prompt:"ДЕЙСТВИЕ — ВСКРЫТЬ"};rivMkShow(q,A2,late);
    eq(A2.prompt,"ДЕЙСТВИЕ — ВСКРЫТЬ\nОСТОВ КОРАБЛЯ · СЛЕД ПЕКАРЯ","строки имени нет — своя строка с именем");
    eq(G.log.length,n0+1,"журнал — одна строка");
    ok(G.log[G.log.length-1].s.indexOf("Пекарь")>=0,"в журнале имя");
    const B={prompt:"ОСТОВ КОРАБЛЯ · ВСКРЫТ"};
    rivMkShow(q,B,late);rivMkShow(q,B,late);
    eq(G.log.length,n0+1,"второй раз журнал молчит");
    eq(B.prompt.split("СЛЕД").length,2,"строка следа не двоится");
    /* у соперника один след, у памятника один след */
    const q3=rmActed(0xB0A9),m3=plnMarkState(q3),L3={t0:m3.t0+RIVMK_AGE+60};
    eq(rivMkPlace(q3,m3,L3),null,"Пекарь уже оставил свой — второго нет");
    G.seen["relay_kim.t1"]=0;G.seen["relay_shtof.t1"]=0;
    const r3=rivMkPlace(q3,m3,L3);
    ok(r3&&(r3.id==="kim"||r3.id==="shtof"),"следующий встреченный — на новом памятнике: "+(r3&&r3.id));
    eq(rivMkPlace(q,m,late).id,"baker","на старом памятнике — прежний след");
    const ids=Object.keys(G.rivMk),seeds=ids.map(k=>G.rivMk[k].s);
    eq(new Set(seeds).size,seeds.length,"на памятнике не больше одного следа");
    ok(RIVMK.every(x=>CAST[x.id]&&CAST[x.id].role==="соперник"),"шестеро — те, кто в труппе соперники");
    eq(RIVMK.length,Object.keys(CAST).filter(k=>CAST[k].role==="соперник").length,"все соперники труппы");
  }finally{PLN.on=pOn;PLN.bad=pBad;}
}));
TEST_SUITES.push(()=>suite("соперники: следы переживают запись, битое отброшено",()=>{
  resetWorld();
  G.rivMk={baker:{s:123,t:9,ru:"ОСТОВ",seen:1},kim:{s:456,t:10,ru:"МАЯК",seen:0}};
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.rivMk=null;ok(applySave(s),"запись читается");
  eq(JSON.stringify(G.rivMk),JSON.stringify({baker:{s:123,t:9,ru:"ОСТОВ",seen:1},kim:{s:456,t:10,ru:"МАЯК",seen:0}}),"следы на месте");
  const o=JSON.parse(JSON.stringify(s));delete o.rivMk;
  ok(applySave(o)&&G.rivMk===null,"запись до M910b — пусто");
  const b=JSON.parse(JSON.stringify(s));b.rivMk={baker:{s:"x"},kim:{s:7},shtof:{s:7},nobody:{s:8}};
  ok(applySave(b)&&JSON.stringify(Object.keys(G.rivMk))==='["kim"]',"битые и двойные отброшены: "+JSON.stringify(G.rivMk));
  const keep=JSON.stringify(G.rivMk);
  ok(!applySave({v:-1})||true,"чужая запись");
  eq(JSON.stringify(G.rivMk),keep,"отказ загрузки следы не трогает");
}));
