/* ══ M127: приборы — это товар ══
   Сторож замысла: у прибора есть завод, возраст и характер; плохой прибор
   хуже РАЗЛИЧАЕТ отклонение, а не отнимает процент; покупка, полка и починка
   — решения игрока, поэтому переживают сохранение. */
TEST_SUITES.push(()=>suite("Приборы как товар: завод, возраст, характер",()=>{
  resetWorld();
  G.instrKit=null;G.instrShelf=[];
  const K=instrKit();
  eq(Object.keys(K).length,INSTR_KEYS.length,"в панели ровно пять гнёзд");
  ok(INSTR_KEYS.every(id=>instrWorks(instrUnit(id))),"у каждого прибора есть завод");

  /* ── завод меняет разрешение, а не мир ── */
  const sx=3,sy=-2,truth=misclose(sx,sy);
  instrInstall("course",{w:"artel",s:7,wear:0});
  const dull=instrQuality("course");
  instrInstall("course",{w:"vekha",s:7,wear:0});
  const fine=instrQuality("course");
  ok(fine>dull,"обсерваторская работа различает тоньше артельной: "+
     fine.toFixed(2)+" против "+dull.toFixed(2));
  eq(misclose(sx,sy),truth,"невязка сектора от прибора не зависит");

  /* ── износ тупит прибор, починка возвращает ── */
  instrInstall("course",{w:"vekha",s:7,wear:.8});
  ok(instrQuality("course")<fine,"разбитый прибор различает хуже целого");
  ok(instrFixCost("course")>0,"починка стоит денег");
  ok(instrFixCost("course")<instrPrice(instrUnit("course"))*1.2,"и заметно дешевле покупки");
  G.credits=99999;
  ok(instrFix("course"),"выверили");
  eq(instrUnit("course").wear,0,"износ снят");

  /* ── возраст набегает от работы, а не от календаря ── */
  const w0=instrUnit("chrono").wear||0;
  G.running=true;
  for(let i=0;i<20000;i++)instrAgeTick(1);
  ok(instrUnit("chrono").wear>w0,"прибор старится в работе: "+instrUnit("chrono").wear.toFixed(3));
  ok(instrUnit("chrono").wear<=1,"но не разваливается совсем");

  /* ── снятое ложится на полку, полка короткая ── */
  G.instrShelf=[];
  for(let i=0;i<INSTR_SHELF_MAX+3;i++)instrInstall("radio",{w:"gorn",s:i+1,wear:0});
  eq(instrShelf().length,INSTR_SHELF_MAX,"полка не растёт бесконечно");
  const before=instrUnit("radio").s;
  ok(instrFromShelf(0),"вернули прибор с полки");
  ok(instrUnit("radio").s!==before,"в гнезде теперь другой экземпляр");

  /* ── прилавок выводится, а не хранится ── */
  G.st={name:"Проба",stype:"yard",kind:"верфь"};
  const o1=instrOffers(),o2=instrOffers();
  ok(o1.length>=2,"на прилавке есть товар: "+o1.length);
  eq(JSON.stringify(o1),JSON.stringify(o2),"тот же прилавок при повторном заходе");
  ok(o1.every(o=>INSTR_BY_ID[o.id]&&INSTR_WORKS[o.u.w]),"каждый товар — настоящий прибор");

  /* ── покупка тратит деньги и занимает гнездо ── */
  const off=o1[0],price=instrPrice(off.u),money=G.credits=price+500;
  ok(instrBuy(off),"куплено");
  eq(G.credits,money-price,"деньги списаны ровно по цене");
  eq(instrUnit(off.id).w,off.u.w,"прибор встал в своё гнездо");

  /* ── это решение игрока, значит оно переживает сохранение ── */
  const snap=JSON.parse(JSON.stringify(snapshot()));
  ok(snap.instrKit&&snap.instrKit[off.id].w===off.u.w,"набор попал в запись");
  ok(Array.isArray(snap.instrShelf),"полка тоже");
  G.st=null;
}));
