/* ══════════════ автотесты: коробки (M346) ══════════════
   Двадцать этикеток руками; одна и та же не приходит дважды; ложатся на полку
   дома; попадаются в обломках, на блошинце и на борту «Сороки»; эффекта нет. */
TEST_SUITES.push(()=>suite("коробки: двадцать этикеток, без повторов, на полке дома",()=>{
  resetWorld();
  G.boxes=[];G.books=[];
  eq(BOXES.length,20,"двадцать коробков в таблице");
  eq(new Set(BOXES.map(b=>b.ru)).size,20,"этикетки не повторяются");
  ok(BOXES.every(b=>b.by&&b.by.length>4),"у каждой — строка фабрики");
  const a=boxFind(11,"тест"),b=boxFind(11,"тест");
  ok(!!a&&!!b&&a.id!==b.id,"то же место второй раз отдаёт другую: первая уже на полке");
  eq(boxCount(),2,"две на полке");
  for(let i=0;i<40;i++)boxFind(100+i,"тест");
  eq(boxCount(),20,"двадцать — потолок, лишних нет");
  eq(boxFind(999,"тест"),null,"больше не приходят");
  /* шанс: не в каждом остове */
  G.boxes=[];let n=0;for(let s=0;s<200;s++){if(boxRoll(s,"тест",.26))n++;}
  ok(n>0&&n<200,"из двухсот остовов коробок нашёлся не в каждом ("+n+")");
  ok(boxCount()<=20,"и полка не переполнилась");
  /* сейв */
  G.boxes=[3,7];const snap=snapshot();G.boxes=[];applySave(snap);
  eq(boxAll().join(","),"3,7","коробки вернулись из сейва");
  const s2=JSON.parse(JSON.stringify(snap));delete s2.boxes;applySave(s2);
  eq(boxCount(),0,"старый сейв без поля — пусто, не падение");
  /* полка дома: коробки рядом с книгами, вещь ПОЛКА живёт и без книг */
  G.boxes=[1,2];G.books=[];
  ok(DESK_ITEMS.find(it=>it.id==="books").live(),"ПОЛКА на столе и без книг — коробки есть");
  tableToggle(true,"books");
  const box=document.getElementById("loglist");
  eq(box.querySelectorAll(".matchbox").length,2,"две этикетки на полке");
  ok(/коробков: 2 из 20/.test(box.textContent),"и счёт «коробков: 2 из 20»");
  tableToggle(false);
  /* эффекта нет: stat() не знает о коробках */
  const src=document.scripts[0].textContent;
  const st=src.slice(src.indexOf("function stat()"),src.indexOf("const held="));
  ok(st.length>200&&st.indexOf("box")<0,"stat() не знает о коробках");
  G.boxes=[];
}));

TEST_SUITES.push(()=>suite("коробки: на блошинце и на борту «Сороки»",()=>{
  resetWorld();
  G.boxes=[];G.wander=null;G.flea=null;
  /* блошинец: лот «пустой спичечный коробок» бывает, покупка кладёт на полку */
  let bz=null;
  for(let dx=-12;dx<=12&&!bz;dx++)for(let dy=-12;dy<=12&&!bz;dy++){if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station&&s.station.stype==="bazaar")bz=s;}
  if(bz){
    G.sys=bz;G.sx=bz.sx;G.sy=bz.sy;G.credits=100000;
    let lot=null;
    const ep0=Date.now;
    try{
      for(let k=0;k<60&&!lot;k++){Date.now=()=>ep0()+k*FLEA_EPOCH;lot=fleaLots(bz).find(l=>l.kind==="box");}
      ok(!!lot,"коробок на прилавке бывает");
      if(lot){fleaBuy(lot.id,"cr",bz);eq(boxCount(),1,"куплен — на полке");}
    }finally{Date.now=ep0;}
  }else ok(true,"блошинца рядом нет — не меряем");
  /* «Сорока»: коробок за одну спичку среди бумаг какой-нибудь эпохи */
  G.boxes=[];
  let lot2=null,w=null;
  for(let e=0;e<12&&!lot2;e++){w=wanderAt(WANDER_T0+e*4*86400e3+1000);lot2=wanderLots(w).find(l=>l.cat&&l.cat.id==="matchbox");}
  ok(!!lot2,"коробок лежит на полке «Сороки» в какой-то из эпох");
  if(lot2){
    G.matches=0;ok(!wanderBuy(lot2),"без спички не отдают");
    G.matches=1;ok(wanderBuy(lot2),"за спичку — отдали");
    eq(boxCount(),1,"и он на полке дома");
    eq(matchesRec(),0,"спичка ушла");
  }
  ok(WANDER_LINES.idle.some(l=>/пятьдесят/.test(l)),"хранитель поминает полный коробок и не продаёт");
  G.boxes=[];G.wander=null;G.flea=null;G.matches=0;
}));
