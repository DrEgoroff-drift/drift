/* ══════════════ автотесты: «Смена» — роман, который читается, когда прожит (M353) ══════════════ */
TEST_SUITES.push(()=>suite("«Смена»: 72 главы, предикаты не падают, открытое остаётся, сохранение",()=>{
  resetWorld();
  eq(SMENA_CH.length,72,"семьдесят две главы");
  eq(Object.keys(SMENA_TEXT).length,72,"у каждой есть текст");
  let empty=0;for(let n=1;n<=72;n++)if(!(SMENA_TEXT[String(n)]||[]).some(p=>p.length>200))empty++;
  eq(empty,0,"в каждой главе есть абзац длиннее двухсот знаков");
  ok(SMENA_CH.every((r,i)=>r[0]===i+1&&typeof r[1]==="string"&&r[1].length>2&&typeof r[2]==="function"),"номер, «где» и предикат у каждой");
  let threw=0;for(const r of SMENA_CH){try{r[2]();}catch(e){threw++;}}
  eq(threw,0,"ни один предикат не падает на пустом мире");
  smenaSync();
  ok(smenaIsOpen(1)&&smenaCount()<=3,"на старте открыт «Док» и почти ничего больше: "+G.smena.slice().sort((a,b)=>a-b).join(","));
  /* прожитое открывает: машина, наёмник, дом с продажей */
  G.droneIds=[1];G.home={x:0};G.soldTotal=100;
  smenaSync();ok(smenaIsOpen(10)&&smenaIsOpen(2),"дрон и первая продажа открыли свои главы");
  G.droneIds=[];smenaSync();ok(smenaIsOpen(10),"открытое остаётся, даже если машины уже нет");
  const snap=snapshot();G.smena=[];applySave(snap);ok(smenaIsOpen(10)&&smenaIsOpen(2),"главы переживают сохранение");
  const s2=JSON.parse(JSON.stringify(snap));s2.smena=[0,99,"x",5];applySave(s2);eq(G.smena.join(","),"5","чужие номера отбрасываются");
  /* прожитый мир: большинство глав открывается от настоящих полей, не от времени */
  resetWorld();
  Object.assign(G,{home:{x:1},soldTotal:1,post:{stage:1},visits:{a:1},county:{called:1},keepers:{fed:1,gone:1},droneIds:[1],crew:[{}],mirror:{bearing:1},lights:{seen:2},hours:{man:1},grove:{turn:1},bases:{a:1},vega:{a:1},tin:{a:1},settle:{a:1},grown:{recip:1},slow:{round:1},parrot:{a:1},trace:{a:1},strips:[1,2,3],charts:{have:1},ring:{a:1},inst:{a:1},hold:{a:1},doom:{lost:1},plan:{took:1,hauled:1},pass:{lit:1},rogues:[{}],island:{a:1},mailed:{a:1},exp:{offered:1,quietUntil:1},ret:{seen:1},letters:{a:1},quiet:{stay:1},record:{a:1},trainee:{a:1},penn:{a:1},late:{a:1},walled:{a:1},exiles:[{}],mgrs:[{loy:10}]});
  smenaSync();
  ok(smenaCount()>=55,"в прожитом мире открыто "+smenaCount()+" из 72");
  resetWorld();
}));
