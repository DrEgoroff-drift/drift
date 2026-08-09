/* ══════════════ охотник: приходит только за долгом ══════════════ */
/* Три правила, ради которых он и написан: без поступка охотника нет, убитый не
   возвращается, награда даётся один раз. */
TEST_SUITES.push(()=>suite("охотник: приходит только за долгом",()=>{
  resetWorld();
  const sys=G.sys||getSystem(G.sx,G.sy);

  /* ── без дела никого нет ── */
  eq(Object.keys(G.hunted).length,0,"в чистом мире охотников нет");
  spawnPirates();
  eq(G.pirates.filter(p=>p.hunter).length,0,"без поступка охотник не выходит");

  /* ── поступок заводит капитана с именем ── */
  const H=huntMark(sys,"проверку");
  ok(!!H&&!!H.cap,"за поступок появился капитан с именем");
  eq(H.tier,0,"первый долг — первая ступень");
  const was=H.cap;
  huntMark(sys,"второй раз");
  eq(G.hunted[huntKey(sys)].tier,1,"новое дело поднимает ступень");
  eq(G.hunted[huntKey(sys)].cap,was,"но капитан остаётся тот же");
  ok(!!huntHere(),"около своего сектора он вас ищет");

  /* ── география: он не вездесущ ── */
  const sx0=G.sx,sy0=G.sy;
  G.sx=sx0+HUNT_RADIUS+3;G.sy=sy0;
  ok(!huntHere(),"за пределами своих секторов охотника нет");
  G.sx=sx0;G.sy=sy0;

  /* ── выходит в систему одной записью и опознаётся ── */
  spawnPirates();
  const hs=G.pirates.filter(p=>p.hunter);
  eq(hs.length,1,"охотник в системе ровно один");
  const p=hs[0];
  ok(p.name.indexOf(was)>=0,"в бою он назван по имени");
  ok(p.hullMax>60,"он крепче рядового пирата");
  ok(!!pirateArtOf(p.shipId,1,false),"его корпус печётся флагманской выпечкой");

  /* ── логово получило хозяина ── */
  ok(!!huntLairAt(sx0,sy0),"в своём секторе у логова есть хозяин");
  ok(huntLairName(sx0,sy0).indexOf(was)>=0,"логово названо его именем");
  ok(!huntLairAt(sx0+HUNT_RADIUS+3,sy0),"чужая база хозяина не приобретает");

  /* ── награда разовая, убитый не возвращается ── */
  const cr=G.credits;
  killPirate(p);
  const rec=G.hunted[huntKey({sx:sx0,sy:sy0})];
  eq(rec.dead,1,"убитый помечен мёртвым");
  ok(G.credits>cr,"за него заплатили");
  const cr2=G.credits;
  huntDefeated(p);
  eq(G.credits,cr2,"второй раз за него не платят");
  eq(huntMark({sx:sx0,sy:sy0},"ещё дело"),null,"новый долг его не воскрешает");
  G.pirates=[];
  spawnPirates();
  eq(G.pirates.filter(x=>x.hunter).length,0,"мёртвый в систему не выходит");

  /* ── перезагрузка не воскрешает ── */
  const snap=snapshot();
  applySave(snap);
  eq(G.hunted[huntKey({sx:sx0,sy:sy0})].dead,1,"после загрузки он всё ещё мёртв");
  eq(G.hunted[huntKey({sx:sx0,sy:sy0})].paid,1,"и награда за него всё ещё выплачена");
}));
