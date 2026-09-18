/* ══════════════ автотесты: «Смена» — роман, который читается, когда прожит (M353) ══════════════ */
TEST_SUITES.push(()=>suite("«Смена»: 72 главы, предикаты не падают, открытое остаётся, сохранение",()=>{
  resetWorld();
  eq(SMENA_CH.length,72,"семьдесят две главы");
  eq(Object.keys(SMENA_TEXT).length,72,"у каждой есть текст");
  let empty=0;for(let n=1;n<=72;n++)if(!(SMENA_TEXT[String(n)]||[]).some(p=>p.length>200))empty++;
  eq(empty,0,"в каждой главе есть абзац длиннее двухсот знаков");
  ok(SMENA_CH.every((r,i)=>r[0]===i+1&&typeof r[1]==="string"&&r[1].length>2&&r[2] instanceof Function),"номер, «где» и предикат у каждой");
  let threw=0;for(const r of SMENA_CH){try{r[2]();}catch(e){threw++;}}
  eq(threw,0,"ни один предикат не падает на пустом мире");
  smenaSync();
  ok(smenaIsOpen(1)&&smenaCount()<=3,"на старте открыт «Док» и почти ничего больше: "+G.smena.slice().sort((a,b)=>a-b).join(","));
  /* P15: деньги и дроны больше не открывают глав — книга идёт по порядку и по новым местам */
  G.droneIds=[1];G.home={x:0};G.soldTotal=100;
  smenaSync();ok(!smenaIsOpen(10)&&!smenaIsOpen(2),"купленная машина и продажа глав не открывают");
  const P=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  eq(smenaLand(P),2,"посадка в новом месте открыла следующую по порядку — вторую");
  eq(smenaLand(P),0,"второй раз там же — ничего: нужно новое место");
  ok(smenaAtAll()[2]&&smenaAtAll()[2].k,"глава знает, где прожита");
  const snap=snapshot();G.smena=[];G.smenaAt={};applySave(snap);ok(smenaIsOpen(2)&&smenaAtAll()[2],"главы и места переживают сохранение");
  const s2=JSON.parse(JSON.stringify(snap));s2.smena=[0,99,"x",5];applySave(s2);eq(G.smena.join(","),"5","чужие номера отбрасываются");
  /* старые сейвы: открытое не отнимается, следующая — первая неоткрытая */
  resetWorld();G.smena=[1,2,3,10,11];eq(smenaNext(),4,"после старого вразнобой — следующая по порядку, четвёртая");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("«Смена»: мест разного вида хватает на 72 главы в круге r ≤ 20 (P15)",()=>{
  resetWorld();
  const keys=new Set();
  for(let sx=-20;sx<=20;sx++)for(let sy=-20;sy<=20;sy++){
    if(Math.hypot(sx,sy)>20||!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);G.sys=s;
    for(const p of s.planets)if(p.type!=="gas")keys.add(smenaPlaceKey(p));
  }
  G.sys=getSystem(0,0);
  ok(keys.size>=72,"видов мест в круге r 20: "+keys.size);
}));
