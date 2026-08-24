/* Чужой след (M171): знак и вещь, оставленные другим живым человеком.
   Сеть в тестах не трогаем — проверяем правила, из-за которых эта штука
   безопасна: оффлайн молчит, платят грузом, людей не оставляют, знак и рука
   выводятся из метки и не дрожат, поднятое попадает в трюм и в тетрадь. */

TEST_SUITES.push(()=>suite("след: рука и знак выводятся, а не выбираются",()=>{
  resetWorld();
  const id="a1b2c3d4e5f6";
  const m1=traceMarkOf(id),m2=traceMarkOf(id);
  eq(m1,m2,"знак от одной метки один и тот же");
  ok(m1>=0&&m1<TRACE_MARK.length,"знак есть в словаре");
  const h=traceHand(id);
  ok(/^[a-f0-9]{6}$/.test(h),"рука — шесть шестнадцатеричных знаков");
  eq(traceHand(id),h,"рука не дрожит");
  ok(traceMarkOf("0badf00d")!==m1||traceHand("0badf00d")!==h,"другая метка — другой след");
  eq(TRACE_MARK.length,12,"двенадцать фигур");
  let named=0;for(const M of TRACE_MARK)if(M.ru&&typeof M.d==="function")named++;
  eq(named,TRACE_MARK.length,"у каждой фигуры имя и штрихи");
}));

TEST_SUITES.push(()=>suite("след: оффлайн его нет вовсе",()=>{
  resetWorld();
  /* file:// — ни следов, ни действия; это норма, а не урезанный режим */
  if(location.protocol.indexOf("http")!==0){
    eq(traceOn(),false,"на file:// след выключен");
    eq(traceCanLeave(),null,"и оставить нечего");
  }else ok(true,"страница по http — проверка оффлайна пропущена");
  eq(traceHere(),null,"без ответа сервера на земле ничего не лежит");
}));

TEST_SUITES.push(()=>suite("след: платят грузом, и не людьми",()=>{
  resetWorld();
  for(const k of RES_KEYS)G.cargo[k]=0;
  eq(traceBigRes(),null,"пустой трюм платить не может");
  G.cargo.folk=9;G.cargo.missile=7;
  eq(traceBigRes(),null,"людей и боеприпас в земле не оставляют");
  G.cargo.iron=3;
  const g=traceBigRes();
  ok(!!g&&g.k==="iron","берут то, чего больше всего");
  eq(g.n,3,"меньше пяти — сколько есть");
  G.cargo.ice=40;
  eq(traceBigRes().n,TRACE_MAX_UNITS,"больше пяти единиц за раз не оставляют");
}));

TEST_SUITES.push(()=>suite("след: три в сутки",()=>{
  resetWorld();
  const T=traceAll();
  T.day=traceToday();T.left=0;
  eq(traceLeftToday(),TRACE_CAP_DAY,"с утра — три");
  T.left=3;
  eq(traceLeftToday(),0,"после трёх — ни одного");
  T.day="1999-1-1";
  eq(traceLeftToday(),TRACE_CAP_DAY,"новый день обнуляет счёт");
}));

TEST_SUITES.push(()=>suite("след: поднятое ложится в трюм и в тетрадь",()=>{
  resetWorld();
  landOnTestPlanet();
  const S=G.surf,tr=S.tr;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const logN=G.log.length;
  const t={key:placeKeyHere(),i:"1x",m:3,h:"abcdef",r:"titan",n:4};
  S.trace=t;
  ok(!!traceHere(),"след на месте лежит");
  const x=traceSpotX(tr,t);
  eq(Math.round(x),Math.round(traceSpotX(tr,t)),"место следа не дрожит");
  ok(x>=0&&x<=tr.W,"след лежит внутри полосы");
  /* подойти и поднять */
  S.x=x;
  ok(!!traceNear(S,tr),"вблизи след находится");
  traceTake(t);
  eq(G.cargo.titan,4,"груз лёг в трюм");
  eq(traceHere(),null,"поднятого следа на земле больше нет");
  ok(G.log.length>logN,"тетрадь записала находку");
  /* вторая встреча той же руки — одна строка и ничего не объясняется */
  const T=traceAll();
  eq(T.hands["abcdef"],1,"рука встречена один раз");
  const t2={key:placeKeyHere(),i:"2x",m:3,h:"abcdef",r:"ice",n:1};
  G.surf.trace=t2;traceTake(t2);
  eq(T.hands["abcdef"],2,"та же рука встречена дважды");
  eq(T.seen,2,"счёт поднятых следов идёт");
}));

TEST_SUITES.push(()=>suite("след: переживает сохранение",()=>{
  resetWorld();
  const T=traceAll();
  T.day="2026-1-1";T.left=2;T.hands={"beefed":3};T.seen=5;
  const snap=JSON.parse(JSON.stringify(snapshot()));
  resetWorld();
  ok(applySave(snap),"сейв применился");
  eq(G.trace.left,2,"дневной счёт вернулся");
  eq(G.trace.hands["beefed"],3,"встреченные руки вернулись");
  eq(G.trace.seen,5,"счёт поднятого вернулся");
  eq(snap.v,4,"формат сейва не менялся");
}));
