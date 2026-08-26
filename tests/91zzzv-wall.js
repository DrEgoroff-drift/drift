/* ══════════════ автотесты: стена, которая помнит (M210) ══════════════
   Сервера в тестах нет, и это правильно: проверяется не сеть, а ПРАВИЛА.
   Что стена не ложится в сохранение; что офлайн её не существует вовсе; что
   расписаться можно один раз; что по проводу не уезжает ничего, кроме знака
   и руки; и что место знака на камне не переезжает, когда стена пополнилась. */
function wallReset(){
  WALL_CACHE.clear();
  wallBusy=0;
}
function wallFake(kind,n,mine){
  const key=wallKeyHere()||"0,0";
  const list=[];
  for(let i=0;i<n;i++)
    list.push({m:i%TRACE_MARK.length,h:("00000"+(i*7+3).toString(16)).slice(-6),me:false});
  if(mine)list.push({m:2,h:"abc123",me:true});
  WALL_CACHE.set(wallCacheKey(kind,key),{list,mine:!!mine,pending:false});
  return list;
}
TEST_SUITES.push(()=>suite("стена: не ложится в сохранение и не переживает вкладку",()=>{
  resetWorld();
  wallReset();
  const F=pcTestPlanet();
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  wallFake(WALL_S,6,false);
  eq(wallCount(WALL_S),6,"стена в памяти есть");
  const snap=snapshot();
  const j=JSON.stringify(snap);
  ok(j.indexOf("WALL")<0,"в снимке нет стены");
  ok(!("wall" in snap),"и поля такого нет");
  /* сохранение и загрузка не приносят стену обратно: она живёт на сервере */
  wallReset();
  applySave(JSON.parse(j));
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  eq(wallCount(WALL_S),-1,"после загрузки стены нет — её спросят у сервера");
}));
TEST_SUITES.push(()=>suite("стена: офлайн её не существует — ни кнопки, ни пустого камня",()=>{
  resetWorld();
  wallReset();
  const F=pcTestPlanet();
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  const was=G.cloud;
  /* без метки пилота сети нет: traceOn проверяет и её, и протокол */
  G.cloud=null;
  ok(!wallOn(),"без учётной записи сети нет");
  ok(!wallCanSign(WALL_S),"и расписаться негде");
  wallAsk(WALL_S);
  eq(wallCount(WALL_S),-1,"запрос офлайн не заводит даже пустой стены");
  /* и рисовать нечего: пустая стена, которая «иногда работает», хуже никакой */
  const cv=document.createElement("canvas");cv.width=80;cv.height=60;
  eq(wallDraw(WALL_S,0,80,0,60),0,"рисовать нечего");
  G.cloud=was;
}));
TEST_SUITES.push(()=>suite("стена: один знак от одного человека, и он не переезжает",()=>{
  resetWorld();
  wallReset();
  const F=pcTestPlanet();
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  const list=wallFake(WALL_S,4,false);
  /* место знака выводится из РУКИ, а не из счётчика: иначе стена, увиденная
     дважды, оказывалась бы разной, и знак «переезжал» от чужой подписи */
  const a=wallSpot(list[1],1,0,100,0,50);
  wallFake(WALL_S,9,false);
  const b=wallSpot(list[1],1,0,100,0,50);
  eq(a.x.toFixed(4),b.x.toFixed(4),"знак стоит там же, хотя стена пополнилась");
  eq(a.y.toFixed(4),b.y.toFixed(4),"и по высоте тоже");
  /* два разных знака не садятся в одну точку */
  const c=wallSpot(list[2],2,0,100,0,50);
  ok(Math.abs(a.x-c.x)>.001||Math.abs(a.y-c.y)>.001,"чужие руки не совпадают");
  /* свой знак уже есть — расписаться нельзя */
  wallFake(WALL_S,3,true);
  ok(!wallCanSign(WALL_S),"со своим знаком на стене второй раз не расписаться");
  ok(wallHere(WALL_S).mine,"и стена это помнит");
}));
TEST_SUITES.push(()=>suite("стена: по проводу — знак и рука, и больше ничего",()=>{
  resetWorld();
  wallReset();
  const F=pcTestPlanet();
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  /* чужие ответы с мусором не должны попадать на камень */
  const key=wallKeyHere();
  wallStore(wallCacheKey(WALL_S,key),[
    {m:3,h:"a1b2c3",me:0},
    {m:5,h:"ЗДЕСЬ БЫЛ ВАСЯ",me:0},          /* рука не шестнадцатеричная */
    {m:"четыре",h:"ffeedd",me:0},           /* знак не число */
    {m:2,h:"0f0f0f",me:1},
    {h:"aabbcc"},                            /* без знака */
    null
  ]);
  const w=wallHere(WALL_S);
  eq(w.list.length,2,"на камень легли только читаемые руки");
  ok(w.mine,"свой знак опознан");
  for(const t of w.list){
    ok(typeof t.m==="number","знак — число");
    ok(/^[a-f0-9]{6}$/.test(t.h),"рука — шесть знаков: "+t.h);
    ok(!("o" in t),"метки пилота на камне нет");
    ok(!("t" in t),"и времени тоже");
  }
  /* больше двух десятков стена не держит */
  const many=[];
  for(let i=0;i<80;i++)many.push({m:i%12,h:("00000"+i.toString(16)).slice(-6),me:0});
  wallStore(wallCacheKey(WALL_S,key),many);
  ok(wallCount(WALL_S)<=WALL_MAX,"стена помнит дюжину рук, а не восемьдесят");
}));
TEST_SUITES.push(()=>suite("стена: у посёлка своя, у устья своя, и это разные стены",()=>{
  resetWorld();
  wallReset();
  const F=pcTestPlanet();
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  G.surf={p:F.p,tr:genTerrain(F.p,null),x:0};
  wallFake(WALL_S,5,false);
  eq(wallCount(WALL_S),5,"на стене посёлка пять рук");
  eq(wallCount(WALL_C),-1,"а устье ещё не спрашивали");
  wallFake(WALL_C,2,true);
  eq(wallCount(WALL_S),5,"посёлок не изменился");
  eq(wallCount(WALL_C),3,"устье своё — две чужих руки и своя");
  ok(!wallHere(WALL_S).mine&&wallHere(WALL_C).mine,"и своя рука только на одной");
  /* другое место — другая стена, даже того же рода */
  const key1=wallKeyHere();
  G.sx=F.s.sx+3;G.sy=F.s.sy+3;G.sys=getSystem(G.sx,G.sy);
  const p2=(G.sys.planets||[]).find(q=>q.type!=="gas");
  if(p2){
    G.surf={p:p2,tr:genTerrain(p2,null),x:0};
    ok(wallKeyHere()!==key1,"ключ места другой");
    eq(wallCount(WALL_S),-1,"и стена у него своя, пустая");
  }
}));
