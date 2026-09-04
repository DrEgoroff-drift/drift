/* ══════════════ автотесты: «Сорока» в мире (M342) ══════════════
   Петля из часов и звёзд, ничего в сейве кроме {got,gave,chit}; три канала
   находки — слух, вахта, карта чужой руки — и подход в системе без исключений. */
TEST_SUITES.push(()=>suite("сорока: петля из живых звёзд, шаг 3–5, дома дважды за круг",()=>{
  resetWorld();
  const L=wanderLoop();
  eq(L.length,WANDER_N,"двадцать четыре стоянки");
  ok(L.every(s=>starAt(s.sx,s.sy)),"каждая стоянка — живая звезда");
  const dark=L.filter((s,k)=>k%4===3),lit=L.filter((s,k)=>k%4!==3);
  ok(lit.every(s=>getSystem(s.sx,s.sy).station)||lit.filter(s=>!getSystem(s.sx,s.sy).station).length<=2,
     "обитаемые стоянки — со станцией (допуск два промаха на прижатие)");
  ok(dark.filter(s=>getSystem(s.sx,s.sy).station).length<=1,"тёмные — без станции (допуск один)");
  let hops=0,bad=0;
  for(let k=0;k<L.length;k++){const a=L[k],b=L[(k+1)%L.length];const d=Math.hypot(a.sx-b.sx,a.sy-b.sy);hops+=d;if(d<1||d>9)bad++;}
  ok(bad<=2,"шаги петли 1…9 секторов, целимся в 3–5 (промахов "+bad+", средний "+(hops/L.length).toFixed(1)+")");
  ok(L.filter(s=>Math.hypot(s.sx,s.sy)<=9).length>=2,"петля дважды проходит родные места");
  ok(L.some(s=>Math.hypot(s.sx,s.sy)>=14),"и уходит вдаль");
  eq(wanderLoop(),L,"петля считается один раз");
}));

TEST_SUITES.push(()=>suite("сорока: положение — функция часов, стоянка трое суток, переход сутки",()=>{
  resetWorld();
  const D=86400e3;
  const a=wanderAt(WANDER_T0+1000),b=wanderAt(WANDER_T0+2*D),c=wanderAt(WANDER_T0+3*D+1000),d=wanderAt(WANDER_T0+4*D+1000);
  eq(a.k,0,"первая эпоха — нулевая стоянка");
  eq(a.phase,"stop","только что пришла — стоит");
  eq(b.k,0,"через двое суток — там же");
  eq(c.phase,"hop","на четвёртые сутки — идёт");
  ok(c.tLeft>0&&c.tLeft<=D,"остаток перехода — до суток");
  eq(d.k,1,"следующая эпоха — следующая стоянка");
  eq(d.prev.sx,a.sx,"и помнит, откуда ушла");
  eq(wanderAt(WANDER_T0+24*4*D+5).k,0,"через двадцать четыре эпохи — снова первая");
  eq(wanderAt(WANDER_T0-5).k,WANDER_N-1,"до нуля петли — последняя стоянка, не NaN");
  ok(a.planetIx>=-1&&a.planetIx<getSystem(a.sx,a.sy).planets.length,"планета стоянки — из системы");
  const S=getSystem(a.sx,a.sy);
  ok(wanderHere(S,WANDER_T0+1000),"здесь стоит");
  ok(!wanderHere(S,WANDER_T0+3*D+1000),"а на переходе — уже нет");
  ok(!wanderHere(getSystem(d.sx,d.sy),WANDER_T0+1000),"и на следующей стоянке — ещё нет");
  /* сейв несёт только решения игрока */
  wanderRec().got.push("x1");wanderRec().chit=3;
  const snap=snapshot();
  eq(JSON.stringify(snap.wander),JSON.stringify({got:["x1"],gave:[],chit:3}),"снимок: что взяли, что дали, письмо");
  G.wander=null;applySave(snap);
  eq(G.wander.got[0],"x1","и возвращается из сейва");
  const s2=JSON.parse(JSON.stringify(snap));delete s2.wander;applySave(s2);
  eq(G.wander.got.length,0,"старый сейв без поля — пустая запись, не падение");
}));

TEST_SUITES.push(()=>suite("сорока: слух, вахта, карта и подход в системе",()=>{
  resetWorld();
  const now0=Date.now;
  try{
    const w=wanderAt(WANDER_T0+1000);
    Date.now=()=>WANDER_T0+1000;
    /* слух — там, где стоянка: разброс 2–3, картинка про паруса */
    G.sys=getSystem(w.sx,w.sy);G.sx=w.sx;G.sy=w.sy;
    let got=null;
    for(let i=0;i<40&&!got;i++){const q=wanderRumour(rng(i));if(q&&!q.wrong)got=q;}
    ok(!!got,"слух про паруса складывается");
    ok(got&&/паруса/.test(got.img)&&got.rad>=2&&got.rad<=3&&Math.abs(got.sx-w.sx)<=1,"паруса, разброс 2–3, у самой стоянки");
    ok(rumoursHere().some(q=>q.id==="wander"),"и он лежит среди слухов кантины");
    /* далеко — слуха нет */
    G.sys=getSystem(w.sx+30,w.sy+30)||G.sys;G.sx=w.sx+30;G.sy=w.sy+30;
    ok(!wanderRumour(rng(1)),"в тридцати секторах про паруса не говорят");
    /* вахта — из соседней системы, с направлением; из самой стоянки и издали — нет */
    let adj=null;
    for(let dx=-1;dx<=1&&!adj;dx++)for(let dy=-1;dy<=1&&!adj;dy++){if(!dx&&!dy)continue;if(starAt(w.sx+dx,w.sy+dy))adj=[w.sx+dx,w.sy+dy];}
    if(adj){
      G.sys=getSystem(adj[0],adj[1]);G.sx=adj[0];G.sy=adj[1];
      const wl=wanderSkyLine();
      ok(!!wl&&/без номера/.test(wl.ru)&&/к /.test(wl.note),"телескоп соседа видит точку без номера и называет сторону");
    }else ok(true,"у стоянки нет соседей — вахту не меряем");
    G.sys=getSystem(w.sx,w.sy);G.sx=w.sx;G.sy=w.sy;
    ok(!wanderSkyLine(),"из самой стоянки телескоп не нужен");
    /* подход: корабль у крыльца — подсказка про трап; кадр рисуется без исключений */
    G.mode="system";G.ship.vx=0;G.ship.vy=0;
    for(let i=0;i<3;i++)updateSystem(1);
    const pos=wanderWorldPos(G.sys,w.planetIx);
    ok(isFinite(pos.x)&&isFinite(pos.y)&&pos.L>0,"место у планеты конечное");
    G.ship.x=pos.x+pos.dx*(pos.L*.28+40);G.ship.y=pos.y+pos.dy*(pos.L*.28+40);G.ship.vx=0;G.ship.vy=0;
    updateSystem(1);
    ok(/СОРОК/.test(G.prompt||""),"у борта подсказка называет «Сороку»: "+G.prompt);
    let err="";
    try{for(let i=0;i<4;i++){updateSystem(1);drawSystem();}}catch(e){err=e.message;}
    eq(err,"","система с парусником рисуется");
    /* и на переходе — блик из покинутой системы, тоже без исключений */
    Date.now=()=>WANDER_T0+3*86400e3+3600e3;
    try{drawSystem();}catch(e){err=e.message;}
    eq(err,"","уходящий блик рисуется");
    /* карта: без артефакта глифа нет и падений нет */
    G.mode="map";
    try{drawWanderMap([{gx:w.sx,gy:w.sy,x:100,y:100}],40);}catch(e){err=e.message;}
    eq(err,"","карта без артефакта молчит и не падает");
    ok(!wanderDock(),"трап без комнаты честно отказывает");
  }finally{Date.now=now0;}
  G.mode="system";
}));
