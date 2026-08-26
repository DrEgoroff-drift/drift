/* ══════════════ автотесты: зимовка (M197) ══════════════ */
function winTestStart(){
  resetWorld();
  G.win=null;G.things=[];G.log=[];G.record=null;
  /* далёкая станция: наряд предлагают только за краем обжитого */
  let S=null;
  for(let x=-16;x<=16&&!S;x++)for(let y=-16;y<=16&&!S;y++){
    if(!starAt(x,y)||Math.hypot(x,y)<10)continue;
    const q=getSystem(x,y);
    if(q.station)S=q;
  }
  if(!S)return null;
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  /* наряд собирается руками: предложение зависит от дня, а проверяем механику */
  const o=winOfferHere()||{sx:S.sx,sy:S.sy,pi:0,pname:(S.planets[0]||{name:"—"}).name,sysName:S.name};
  winTake(o);
  return winAll();
}
TEST_SUITES.push(()=>suite("зимовка: месяц идёт по сменам, и уйти нельзя",()=>{
  const W=winTestStart();
  ok(!!W,"наряд взят");
  eq(G.mode,"winter","и мы уже там");
  eq(W.day,1,"первые сутки");
  ok(G.things.some(x=>/Наряд на зимовку/.test(x.ru)),"наряд на столе");
  ok(recordAll().e.some(x=>/зимовщик/.test(x.s)),"в книжке — что нанят");
  ok(!winOfferHere(),"второй зимовки не предлагают");
  /* сутки идут только по сдаче смены */
  const t0=G.t;
  winShift();
  eq(W.day,2,"смена сдана — сутки прошли");
  eq(G.t-t0,CEL_DAY,"и мир состарился ровно на сутки");
  /* уйти нельзя: режим остаётся, пока не кончится месяц */
  navAction();
  eq(G.mode,"winter","с зимовки не уходят");
}));
TEST_SUITES.push(()=>suite("зимовка: реактор слабеет, и выключать приходится живое",()=>{
  const W=winTestStart();
  const c0=winCap(W);
  ok(c0>=8,"в начале месяца реактор тянет всё ("+c0+")");
  ok(!winOver(W),"и стартовый расклад в него влезает");
  ok(!winBad(W).length,"и никому ничего не урезано");
  /* три недели спустя */
  W.day=22;
  const c1=winCap(W);
  ok(c1<c0,"к концу месяца тянет меньше ("+c1+")");
  W.faults=[{k:"ice",day:20},{k:"pump",day:21}];
  ok(winCap(W)<c1,"а каждая непочиненная поломка отнимает ещё");
  ok(winOver(W),"прежний расклад больше не влезает");
  /* выключаем свет — беда названа, но игра не спорит */
  W.pw.light=0;
  ok(winBad(W).indexOf("сидел в темноте")>=0,"темнота названа");
  W.pw.heat=1;
  ok(winBad(W).indexOf("мёрз")>=0,"и холод тоже");
  const cold0=W.cold|0;
  winShift();
  ok((W.cold|0)>cold0,"сутки в холоде сосчитаны");
  /* починка: поломки нет, но день ушёл */
  const n=W.faults.length;
  ok(winFix("ice"),"починено");
  eq(W.faults.length,n-1,"поломкой меньше");
  ok(W.noDiary===1,"дневник в этот день не пишется");
  eq(winDiaryToday(),null,"и страницы за этот день нет");
  winShift();
  ok(!W.noDiary,"назавтра снова есть время писать");
}));
TEST_SUITES.push(()=>suite("зимовка: стена говорит, дневник пишется бланками",()=>{
  const W=winTestStart();
  const l1=winWall();
  ok(l1&&l1.length>10,"стена сказала: "+l1);
  eq(W.wall,1,"и это сосчитано");
  ok(WIN_WALL_EARLY.indexOf(l1)>=0,"в начале месяца — про железо");
  W.day=Math.round(W.days*0.8);
  const l2=winWall();
  ok(WIN_WALL_LATE.indexOf(l2)>=0,"к концу — иначе: "+l2);
  /* дневник: та же карточка, что и открытка */
  const d=winDiaryToday();
  ok(!!d,"страница заведена");
  ok(postSigned(d),"и она — настоящая карточка с бланком");
  ok(postForm(d.f).k==="winter","бланк зимовочный: "+postForm(d.f).ru);
  eq(d.day,W.day,"страница помечена сутками");
  ok(postRead(d).length>10,"её можно прочитать: "+postRead(d).slice(0,50));
  /* и вычеркнуть в ней вариант, как в открытке */
  postChoose(d,0,2);
  eq(d.c[0],2,"вычёркивание работает");
  eq(winDiaryToday(),d,"страница за сутки одна");
}));
TEST_SUITES.push(()=>suite("зимовка: баржа приходит, книжка полна, деньги маленькие",()=>{
  const W=winTestStart();
  const home={sx:G.sx,sy:G.sy};
  W.wall=W.days;W.fixed=2;W.cold=6;
  const cr=G.credits;
  W.day=W.days;
  winShift();                       /* последняя смена — и баржа */
  ok(!winOn(),"зимовка окончена");
  eq(G.mode,"system","вернулись в полёт");
  eq(G.sx,home.sx,"и туда, откуда нанимались");
  ok(G.credits>cr,"заплатили");
  ok(G.credits-cr<WIN_PAY+1,"и это правда немного: "+(G.credits-cr)+" кр");
  ok(G.credits-cr<WIN_PAY,"мёрз — заплатили меньше");
  ok(G.things.some(x=>x.diary),"дневник лёг в вещи");
  const R=recordAll().e.filter(x=>x.a==="зимовка");
  ok(R.length>=3,"книжка полна: "+R.length+" записей");
  ok(R.some(x=>/мёрз/.test(x.s)),"в том числе про холод");
  ok(R.some(x=>/слушал стену/.test(x.s)),"и про стену");
}));
TEST_SUITES.push(()=>suite("зимовка: прерваться и вернуться назавтра можно",()=>{
  const W=winTestStart();
  W.day=9;W.pw.light=1;W.faults=[{k:"filt",day:8}];
  winWall();winDiaryToday();
  const before=JSON.stringify(G.win);
  const snap=snapshot();
  G.win=null;
  applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(G.win),before,"зимовка пережила сохранение целиком");
  eq(winAll().day,9,"те же сутки");
  eq(winAll().faults.length,1,"та же поломка");
  const old=snapshot();delete old.win;
  applySave(JSON.parse(JSON.stringify(old)));
  ok(!winOn(),"сохранение без зимовки — не падение");
  G.mode="system";
}));
