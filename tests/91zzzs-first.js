/* ══════════════ автотесты: первый час (M207) ══════════════ */
TEST_SUITES.push(()=>suite("первый час: четыре строки, каждая по поводу и один раз",()=>{
  resetWorld();
  G.first=[];G.log=[];G.running=true;
  eq(FIRST_LINES.length,4,"строк ровно четыре");
  for(const L of FIRST_LINES){
    ok(L.who&&L.who.length>3,"у строки есть говорящий: "+L.k);
    ok(L.t.length>60,"и она человеческая, а не подпись: "+L.k);
    /* ни одной строки от лица игры */
    ok(!/нажмите|кнопк|интерфейс|туториал|обучени/i.test(L.t),"без обучения: "+L.k);
  }
  /* поводы: пока повода нет — молчит */
  G.mode="system";G.fuel=100;
  firstTick();
  eq(firstAll().length,0,"на старте не сказано ничего");
  /* топливо: сказали, когда потратил */
  G.fuel=80;firstTick();
  ok(firstSaid("fuel"),"про топливо сказали, когда его стало меньше");
  eq(firstAll().length,1,"и только про него");
  G.fuel=60;firstTick();
  eq(firstAll().filter(x=>x==="fuel").length,1,"дважды не повторяют");
  /* воздух: только когда отошёл от корабля */
  G.mode="surface";G.surf={x:100,shipX:100,deposits:[]};
  firstTick();
  ok(!firstSaid("air"),"рядом с кораблём про ранец молчат");
  G.surf.x=400;firstTick();
  ok(firstSaid("air"),"отошёл — сказали");
  /* работа: при стыковке */
  G.mode="dock";firstTick();
  ok(firstSaid("work"),"на стыковке сказали про доску");
  /* копать: рядом с залежью и без денег */
  G.mode="surface";G.credits=200;G.surf={x:500,shipX:100,deposits:[{x:520}]};
  firstTick();
  ok(firstSaid("dig"),"у залежи и без денег сказали копать");
  eq(firstAll().length,4,"всего четыре, и больше не будет");
}));
TEST_SUITES.push(()=>suite("первый час: сказанное не повторяется после загрузки",()=>{
  resetWorld();
  G.first=["air","fuel"];G.log=[];G.running=true;
  const snap=snapshot();
  G.first=null;
  applySave(JSON.parse(JSON.stringify(snap)));
  eq(firstAll().join(","),"air,fuel","сказанное пережило загрузку");
  G.mode="surface";G.surf={x:900,shipX:100,deposits:[]};
  G.fuel=10;
  const n=(G.log||[]).length;
  firstTick();
  eq((G.log||[]).length,n,"и повторно не сказано ни слова");
  /* мусор в сейве отброшен */
  const bad=snapshot();bad.first=["air","нетакой",7,null];
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(firstAll().join(","),"air","чужие ключи отброшены");
  const old=snapshot();delete old.first;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(firstAll().length,0,"сохранение без этого поля — не падение");
}));
TEST_SUITES.push(()=>suite("первый час: скафандр и топливо теперь названы словами",()=>{
  /* разбор (docs/DESIGN-first-hour.md) нашёл ровно это: обе шкалы убивают и обе
     молчали. Проверка стережёт, чтобы строки про них не выкинули заодно */
  resetWorld();
  const said=FIRST_LINES.map(l=>l.t).join(" ");
  ok(/ранц|дыш/i.test(said),"про воздух на грунте сказано");
  ok(/бак|заправк/i.test(said),"про топливо сказано");
  ok(/доск|работа/i.test(said),"про то, где работа, сказано");
  ok(/копай|копать/i.test(said),"и про то, с чего все начинали");
}));
