/* ══════════════ M218: приёмники как места ══════════════
   Проверяется ровно то, на чём затея держится: мачты стоят от посева, их
   частоты лежат в шуме между диапазонами, поймал разборчиво — записал, по
   записи прокладывается курс, платит только тот, кто там живёт, и над миром
   при этом не появляется ничего. */
function relayFind(pred,rad){
  rad=rad||15;
  for(let x=-rad;x<=rad;x++)for(let y=-rad;y<=rad;y++){
    const R=relayOf(x,y);
    if(R&&(!pred||pred(R)))return R;
  }
  return null;
}
TEST_SUITES.push(()=>suite("приёмники: мачты стоят от посева и лежат в щелях шкалы",()=>{
  resetWorld();
  const R=relayFind(null);
  ok(!!R,"мачты в мире есть");
  const R2=relayOf(R.sx,R.sy);
  eq(R2.call,R.call,"тот же сектор — тот же позывной: ничего не сочиняется на лету");
  eq(R2.k,R.k,"и тот же род");
  ok(!getSystem(R.sx,R.sy).station,"мачту не ставят там, где есть станция — она там не нужна");
  /* частота: всегда в щели, никогда внутри постоянного диапазона */
  let n=0;
  for(let x=-12;x<=12;x++)for(let y=-12;y<=12;y++){
    const T=relayOf(x,y);if(!T)continue;
    n++;
    const f=relayFreq(T);
    ok(radioBand(f)===null,"частота "+T.call+" ("+f.toFixed(3)+") лежит в шуме, а не поверх диапазона");
    if(n>6)break;
  }
  ok(n>0,"в обжитой четверти карты нашлось хоть что-то");
  /* чем дальше от нуля, тем их больше: середина обходится проводами */
  const cnt=(x0,y0,r)=>{let c=0;for(let x=x0-r;x<=x0+r;x++)for(let y=y0-r;y<=y0+r;y++)if(relayOf(x,y))c++;return c;};
  ok(cnt(30,30,6)>=cnt(0,0,6),"на краю мачт не меньше, чем в середине");
}));

TEST_SUITES.push(()=>suite("приёмники: поймал разборчиво — записал, и только тогда",()=>{
  resetWorld();
  const R=relayFind(null);
  G.sx=R.sx;G.sy=R.sy;G.sys=getSystem(G.sx,G.sy);
  const f=relayFreq(R);
  /* мимо частоты этой мачты её не слышно и записывать нечего. Соседняя мачта
     на своей частоте при этом слышаться может — щель у них общая */
  const off=radioTune(clamp(f+.06,0,1));
  ok(off.ru!==R.call,"в стороне от частоты этой мачты не слышно");
  ok(!relayKnown(R.key),"и на бумаге её ещё нет");
  /* на частоте — слышно, названо и записано */
  const on=radioTune(f);
  eq(on.k,"relay","на своей частоте слышно мачту");
  ok(on.q>.55,"вблизи разбирается: "+on.q.toFixed(2));
  eq(on.ru,R.call,"на шкале стоит позывной");
  ok(on.text.indexOf(R.sx+":"+R.sy)>0,"в первый раз мачта называет свой адрес — иначе записывать нечего");
  ok(relayKnown(R.key),"услышал — записал, без всякой кнопки");
  const one=Object.keys(relayAll()).length;
  radioTune(f);radioTune(f);
  eq(Object.keys(relayAll()).length,one,"повторное прослушивание второй записи не заводит");
  ok(radioTune(f).text.indexOf(R.sx+":"+R.sy)<0,"и адрес больше не диктуется: он уже на бумаге");
  /* шум остаётся шумом там, где мачты нет */
  const busy=relaysNear(G.sx,G.sy).map(x=>x.f);
  let q=.31;while(q<.39&&busy.some(b=>Math.abs(b-q)<.02))q+=.004;
  eq(radioTune(q).k,"noise","пустая щель по-прежнему шумит");
}));

TEST_SUITES.push(()=>suite("приёмники: что они дают — доход, приём или ничего",()=>{
  resetWorld();
  /* платит тот, кто там живёт */
  const P=relayFind(r=>r.give==="pay",20);
  ok(!!P,"обитаемые мачты в мире есть");
  if(P){
    G.sx=P.sx;G.sy=P.sy;G.sys=getSystem(G.sx,G.sy);
    const c0=G.credits,q0=G.quests.length,sel0=JSON.stringify(G.sel||null);
    /* прилёт только записывает: мачту видно с порога системы */
    relayArrive();
    ok(relayKnown(P.key),"пришёл сам — мачта записана и без эфира");
    eq(G.credits,c0,"но за один прыжок никто не платит: это был бы налог на перелёт");
    /* платят за визит — новости привозят человеку в руки */
    const sum=relayServe(P);
    ok(sum>0,"подошёл и привёз новости — заплатили: "+sum);
    eq(G.credits,c0+sum,"и ровно столько, сколько сказали");
    eq(G.quests.length,q0,"никакого дела при этом не заводится");
    eq(JSON.stringify(G.sel||null),sel0,"и никакой цели над миром: курс прокладывает игрок, а не игра");
    eq(relayServe(P),0,"второй раз в то же окно не платят: это работа, а не кран");
  }
  /* необитаемая не платит никогда */
  const N=relayFind(r=>r.give==="none",20);
  ok(!!N,"необитаемые мачты в мире есть");
  if(N){
    G.sx=N.sx;G.sy=N.sy;G.sys=getSystem(G.sx,G.sy);
    const c1=G.credits;
    relayArrive();
    eq(relayServe(N),0,"маяку платить нечем и некому");
    eq(G.credits,c1,"и касса не шевельнулась");
    ok(relayKnown(N.key),"но записана и она: мачту видно с порога");
  }
  /* ретранслятор чистит эфир вокруг себя */
  const E=relayFind(r=>r.give==="ear",20);
  ok(!!E,"ретрансляторы в мире есть");
  if(E){
    G.sx=E.sx;G.sy=E.sy;G.sys=getSystem(G.sx,G.sy);
    ok(relayEar()>0,"в своём секторе он держит эфир чище");
    const edge=radioTune(.405).q;
    G.sx=E.sx+40;G.sy=E.sy+40;G.sys=getSystem(G.sx,G.sy);
    const far=relaysNear(G.sx,G.sy).some(x=>x.give==="ear"&&x.d<=RELAY_EAR);
    if(!far){
      ok(relayEar()===0,"за сорок секторов от него — нет");
      ok(edge>radioTune(.405).q,"и по краю диапазона рядом с ним слышно лучше: "+edge.toFixed(2));
    }
  }
}));

TEST_SUITES.push(()=>suite("приёмники: бумага, курс и сохранение",()=>{
  resetWorld();
  const R=relayFind(null);
  G.sx=R.sx+3;G.sy=R.sy;G.sys=getSystem(G.sx,G.sy);
  relayWrite(R);
  const L=relayList();
  ok(L.length>0,"на бумаге появилась строка");
  const row=L.find(x=>x.key===R.key);
  ok(!!row,"именно та, что слышали");
  eq(row.sx,R.sx,"с адресом");
  near(row.d,3,.01,"и с расстоянием отсюда");
  /* тот же жест, что у цен и дел: тычок — курс */
  const ok1=gotoSector(row.sx,row.sy,"проверка");
  ok(ok1,"по строке прокладывается курс");
  eq(G.sel.x,R.sx,"штурман получил адрес");
  eq(G.mode,"map","и открыл карту");
  /* панель рисуется и строки в ней кликабельны */
  const box=document.createElement("div");
  renderRelays(box);
  ok(box.children.length>=2,"панель показывает заголовок и строки");
  ok(!!box.children[box.children.length-1].onclick,"строка — это адрес, по которому можно пойти");
  ok(box.textContent.indexOf("щел")>0,"а под заголовком — сама шкала: короткому экрану есть что показать");
  /* сохранение: хранится только услышанное, род сверяется с таблицей */
  relayAll()["999,999"]={k:"кто-то-чужой",call:"ХХ-1",name:"Чужак",sx:999,sy:999,day:1};
  const snap=snapshot();
  G.mode="system";
  applySave(snap);
  ok(relayKnown(R.key),"услышанное пережило сохранение");
  ok(!relayKnown("999,999"),"а мачта неизвестной породы из сейва не заводится");
}));

/* ── M220: у мачты есть тело ── */
TEST_SUITES.push(()=>suite("приёмники: у мачты есть тело, и к ней подходят",()=>{
  resetWorld();
  const R=relayFind(null,20);
  G.sx=R.sx;G.sy=R.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";
  const P=relaySpot(R), P2=relaySpot(R);
  eq(P.x,P2.x,"точка мачты та же от кадра к кадру: она считается, а не бросается");
  ok(Math.hypot(P.x,P.y)>800,"и стоит не в самой звезде");
  G.prompt="";
  ok(!relayInteract({x:P.x+4000,y:P.y}),"издали к мачте не подойти");
  ok(relayInteract({x:P.x+40,y:P.y+20}),"вблизи она отвечает подсказкой");
  ok(G.prompt.indexOf(R.call)===0,"и в подсказке её позывной: "+G.prompt.split("\n")[0]);
  ok(G.prompt.indexOf("ДЕЙСТВИЕ")>0||G.prompt.indexOf("уже")>0,"и то, что с ней можно сделать");
  /* рисуется и ничего не роняет */
  relayDrawSystem(v=>v*.1+W/2,v=>v*.1+H/2,1);
  ok(true,"кадр с мачтой рисуется");
}));
