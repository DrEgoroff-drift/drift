/* ══ M126: корпус — профессия, а не ступенька ══
   Сторож замысла: у каждого корпуса есть роль, роль меняет доступные истории и
   разрешение приборов, но НЕ трогает сам мир — невязка остаётся той же. */
TEST_SUITES.push(()=>suite("Профессии корпусов: не выше, а другое",()=>{
  resetWorld();
  for(const id of SHIP_KEYS){
    const R=roleOf(id);
    ok(R&&R.ru&&isFinite(R.instr),"у корпуса "+id+" есть профессия: "+(R&&R.ru));
  }
  const roles=new Set(SHIP_KEYS.map(id=>roleOf(id).id));
  ok(roles.size>=5,"профессий в ходу не меньше пяти: "+roles.size);
  ok(roleOf("klinok").ether>roleOf("vyuk").ether,"почтовик слышит больше рудовоза");
  ok(roleOf("igla").instr>roleOf("vyuk").instr,"изыскатель видит тоньше рудовоза");
  ok(roleOf("obod").tow>roleOf("igla").tow,"буксир тянет лучше изыскателя");
  ok(roleOf("skat").pax&&!roleOf("igla").pax,"пассажиры разговаривают только на вахтовке");
  /* сплавленный корпус профессию выводит из того, что собрано */
  ok(roleFromStats({cargo:300,thr:.7,hull:220}).id==="ore","склад — это рудовоз");
  ok(roleFromStats({cargo:30,thr:1.5,hull:88}).id==="post","быстрый и пустой — почтовик");

  /* ── мир не меняется от корпуса, меняется прибор ── */
  const sx=3,sy=-2, truth=misclose(sx,sy);
  const keep=G.shipId;
  G.shipId="igla";const fine=instrRead(sx,sy).find(r=>r.dev>0);
  G.shipId="vyuk";const dull=instrRead(sx,sy).find(r=>r.dev>0);
  eq(misclose(sx,sy),truth,"невязка сектора от корпуса не зависит");
  if(fine&&dull){
    eq(fine.id,dull.id,"врёт один и тот же прибор области");
    ok(fine.dev>dull.dev,"на изыскателе отклонение видно раньше: "+
       fine.dev.toFixed(3)+" против "+dull.dev.toFixed(3));
  }else ok(!fine&&!dull,"в этом секторе отклонения нет ни у кого");
  /* глубина памяти эфира идёт за приёмником */
  G.shipId="klinok";const kPost=newsKeepLimit();
  G.shipId="vyuk"; const kOre=newsKeepLimit();
  ok(kPost>kOre,"почтовик помнит больше слухов: "+kPost+" против "+kOre);
  /* трос буксира считается от базовой доли, а не выдумывается заново */
  G.shipId="obod";const tug=towShare(4);
  G.shipId="igla";const sci=towShare(4);
  ok(tug>sci,"буксиру за спасённую баржу достаётся больше: "+tug+" против "+sci);

  /* ── голоса в полёте: только на вахтовке и только с людьми на борту ── */
  const log0=G.log.length;
  G.mode="system";G.cargo.folk=0;G.shiftT=0;
  G.shipId="skat";
  for(let i=0;i<60;i++)shiftTalkTick(1);
  eq(G.log.length,log0,"пустая вахтовка молчит");
  G.cargo.folk=12;G.shiftT=0;
  shiftTalkTick(1);
  ok(G.log.length>log0,"с людьми на борту в полёте разговаривают");
  const spoke=G.log.length;
  G.shipId="igla";G.shiftT=0;
  for(let i=0;i<60;i++)shiftTalkTick(1);
  eq(G.log.length,spoke,"на изыскателе те же люди молчат: корпус не тот");
  G.cargo.folk=0;G.shipId=keep;
}));
