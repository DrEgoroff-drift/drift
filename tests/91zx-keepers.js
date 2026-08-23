/* ══════════════ линия смотрителей: привычка, тихий уход, рукав гаснет, подпись и паёк ══════════════ */
TEST_SUITES.push(()=>suite("смотрители: привычка за визиты, уходит тихо, рукав гаснет, подпись держит его пайком",()=>{
  resetWorld();
  const at=regionOfTheme("keepers");ok(!!at,"область смотрителей расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"course","прибор — курсограф");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  ok(!!G.sys.station,"в ядре есть станция смотрителя");
  eq(keepersDepthHere(),2,"мы у смотрителя");
  ok(!keepersDark(),"рукав горит");
  eq(keepersJumpK(),1,"прокладка по обычной цене");
  const V=visitsAll();V[G.sys.key]=0;G.st=G.sys.station;
  G.cargo.organics=5;
  const lines=[];
  for(let n=0;n<=9;n++){V[G.sys.key]=n;const r=keepersDock();lines.push(r&&r.line);}
  ok(lines[0]&&/Заправил/.test(lines[0]),"первый визит — разговор о погоде");
  ok(/кивнул/.test(lines[2]),"третий — молча");
  ok(/Вторая кружка/.test(lines[6]),"седьмой — вторая кружка");
  ok(/Ящик/.test(lines[7]),"восьмой — ящик вынесен");
  ok(G.cargo.organics<5&&G.keepers.given>0,"паёк он брал сам ("+G.keepers.given+")");
  eq(G.keepers.gone,0,"пока он здесь");
  V[G.sys.key]=10;const r10=keepersDock();
  eq(G.keepers.gone,1,"в десятую посадку его нет");
  ok(/Кружка вымыта/.test(r10.line),"кружка вымыта и перевёрнута");
  ok(keepersDark(),"рукав гаснет");
  eq(keepersJumpK(),1.5,"прокладка дороже");
  ok(keepersCourseDrift()>0,"курсограф гуляет");
  const cd=instrRead().find(i=>i.id==="course");ok(cd.dev>0,"и стрелка это показывает");
  let hit=0;for(let i=0;i<40;i++){const r=rng(hashi(i,3,5));if(keepersEtherLine(r))hit++;}
  ok(hit>0,"в эфире теряются ("+hit+"/40)");
  /* подпись */
  G.odo.jumps=100;ok(keepersSign(),"расписались");eq(G.keepers.signed,1,"тринадцатый");
  ok(!keepersDark(),"рукав горит снова");
  G.odo.jumps=100+KEEP_DARK_AFTER+1;ok(keepersDark(),"без пайка гаснет через "+KEEP_DARK_AFTER+" прыжков");
  G.cargo.organics=1;ok(keepersFeed(),"паёк в ящик");eq(G.cargo.organics,0,"паёк ушёл");ok(!keepersDark(),"и рукав горит");
  ok(!keepersFeed(),"пустой трюм — нечего оставить");
  ok(!keepersSign(),"второй раз не расписаться");
  const s=snapshot();applySave(s);eq(G.keepers.signed,1,"подпись переживает сейв");eq(G.keepers.fed,100+KEEP_DARK_AFTER+1,"и срок пайка");
  /* рифма: второй смотритель в ядре Перевала здоровается как со своим */
  const pa=regionOfTheme("pass");
  if(pa){
    const PR=regionAt(pa.rx*REGION_SPAN,pa.ry*REGION_SPAN);
    G.sx=PR.core.sx;G.sy=PR.core.sy;G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;
    ok(keepersRhymeHere(),"мы у второго смотрителя");
    const rr=keepersDock();ok(rr&&/Свой/.test(rr.line),"здоровается как со своим");
  }
  /* дома ничего */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.st=G.sys.station;
  eq(keepersDock(),null,"дома смотрителя нет");eq(keepersJumpK(),1,"и прокладка обычная");
}));
