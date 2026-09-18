/* ══ чертёж корабля (M476, DESIGN-shipyard §3) ══
   План читается из корпуса; упаковщик раскладывает сегодняшнюю оснастку.
   Сторож: у каждого корпуса есть нос, корма и палуба, клетка на телефоне не
   мельче 44 px, и всё, что стоит на корабле, влезло — даже полная оснастка
   с модулями пятой ступени. Чисел план пока не меняет (M478). */
TEST_SUITES.push(()=>suite("чертёж: план из корпуса, всё влезает",()=>{
  resetWorld();
  const ids=Object.keys(SHIPS).concat(Object.keys(FLEET).slice(0,40));
  let bad=[],small=[],miss=[];
  for(const id of ids){
    const P=planOf(id),has=k=>P.cells.some(q=>q.kind===k);
    if(!(has("stern")&&has("deck")&&(has("nose")||has("side"))))bad.push(id);
    if(390/P.cols<44)small.push(id+":"+P.cols);
    const fit={};slotsOf(id).forEach((k,i)=>fit[i]="t"+i);
    const pk=planPack(id,fit,{engine:5,tank:5,armor:5,drill:5,hyper:5,weapon:5,hold:5});
    for(const it of pk.items)if(it.cells.length<it.need){miss.push(id+":"+it.kind);break;}
  }
  eq(bad.join(" "),"","у каждого корпуса нос или борт, корма и палуба");
  eq(small.join(" "),"","клетка на телефоне 390 px — не мельче 44 px");
  eq(miss.join(" "),"","полная оснастка с модулями пятой ступени влезает в любой корпус");
  /* сегодняшний корабль игрока — план без трюма невозможен */
  const pk=planNow();ok(pk.hold.length>0,"у стартового корабля есть трюм: "+pk.hold.length+" клеток");
  eq(JSON.stringify(planOf(G.shipId).cells.map(q=>q.kind)),JSON.stringify((delete PLAN_CACHE[G.shipId],planOf(G.shipId)).cells.map(q=>q.kind)),"план — функция корпуса");
}));
