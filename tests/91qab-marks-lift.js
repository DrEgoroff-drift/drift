/* ══════════════ космический лифт как место действия (M627b, проход 5) ══════════════
   Пульт зовёт клеть, клеть поднимает; поездка — производная памяти и возраста: человек в клети
   (S.ride) только пока она идёт; осмотр с высоты платится один раз; вставшая клеть отпускает
   вручную или прыжком, и до завтра не ездит; пустая клеть зажигает маяки; кредитов нет. */
TEST_SUITES.push(()=>suite("ориентиры: лифт — вызов, поездка, осмотр, остановка",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad,pSurf=G.surf,pin=PLN_ACT.pinAge;PLN.on=true;PLN.bad=0;G.surf=null;
  const cr=G.credits,ctx={d:0,night:false},L=PLN_LIFT,K=PLN_ACT.kinds.elevator;
  const Q=s=>Object.assign(MA_Q(s,"elevator"),{ru:"КОСМИЧЕСКИЙ ЛИФТ",h:900});
  const fake=q=>({cave:{x:q.x+400},deposits:[{x:q.x-900,res:"iron",left:5}],tr:{poi:[q]}});
  const stalls=s=>plnActRoll(Q(s).seed,0xE1E,1)()<.25;
  let sOk=0,sBad=0,sBad2=0;
  for(let s=1;s<400&&(!sOk||!sBad2);s++){if(stalls(s)){if(!sBad)sBad=s;else if(!sBad2)sBad2=s;}else if(!sOk)sOk=s;}
  ok(sOk&&sBad2,"лифт: есть зерно с поездкой и зерно с остановкой");
  const tick=(q,S,a)=>{PLN_ACT.pinAge=a;K.tick(q,plnActMemo(q,true),S,plnActDims(q));};
  const cab=(q,a)=>JSON.stringify(K.drive(plnActMemo(q,true),a,plnActDims(q),0,.5,q).parts.cab);

  /* ── без остановки: вызов, поездка, осмотр раз, конец, пустой ── */
  {const q=Q(sOk),S=fake(q);delete G.poiSeen[q.seed];
    PLN_ACT.pinAge=0;
    eq(plnActDo(q,"ride",ctx),null,"лифт: клеть наверху — не сесть");
    ok(plnActDo(q,"call",ctx),"лифт: вызвать клеть");
    eq(plnLiftWhere(plnActMemo(q,true),0),"moving","лифт: клеть идёт вниз");
    eq(plnActDo(q,"ride",ctx),null,"лифт: пока идёт — не сесть");
    ok(cab(q,0)!==cab(q,L.call*.5),"лифт: идущая клеть движется в теле");
    PLN_ACT.pinAge=99;
    eq(plnLiftWhere(plnActMemo(q,true),99),"down","лифт: клеть у станции");
    ok(plnActDo(q,"ride",ctx),"лифт: подняться");
    eq(plnActMemo(q,true).n.stl,0,"лифт: зерно без остановки");
    tick(q,S,L.rail+L.up*.5);
    ok(S.ride&&S.ride.seed===q.seed,"лифт: человек в клети (S.ride)");
    ok(S.ride.lift>plnMarkH(q)*.3,"лифт: на половине троса клеть высоко");
    const d0=G.data;
    tick(q,S,L.rail+L.up+.1);
    eq(G.data-d0,24,"лифт: осмотр с высоты +24");
    tick(q,S,L.rail+L.up+1);
    eq(G.data-d0,24,"лифт: осмотр платится один раз");
    eq(plnActMemo(q,true).st,2,"лифт: st 2 после осмотра");
    ok(/пещера .* к востоку/.test(plnLiftSurvey(q,S)),"лифт: осмотр называет пещеру со стороной");
    tick(q,S,plnLiftRide()+1);
    eq(S.ride,null,"лифт: поездка кончилась — человек не в клети");
    PLN_ACT.pinAge=99;
    ok(plnActDo(q,"ride",ctx),"лифт: снова подняться можно");
    eq(G.data-d0,24,"лифт: второй осмотр не платится");
    PLN_ACT.pinAge=99;
    const lt0=K.drive(plnActMemo(q,true),99,plnActDims(q),0,0,q).light;
    ok(plnActDo(q,"empty",ctx),"лифт: отправить пустой");
    ok(plnActMemo(q,true).n.lit,"лифт: маяки горят");
    ok(K.drive(plnActMemo(q,true),99,plnActDims(q),0,0,q).light>lt0,"лифт: зажжённые маяки горят и днём");
    eq(plnActDo(q,"empty",ctx),null,"лифт: второй раз не отправить");}

  /* ── остановка: ручной спуск — скафандр, данные, до завтра ── */
  {const q=Q(sBad),S=fake(q);delete G.poiSeen[q.seed];
    PLN_ACT.pinAge=0;plnActDo(q,"call",ctx);PLN_ACT.pinAge=99;
    ok(plnActDo(q,"ride",ctx),"лифт: подняться (встанет)");
    eq(plnLiftWhere(plnActMemo(q,true),99),"stall","лифт: клеть встала");
    const d0=G.data;tick(q,S,99);
    ok(S.ride&&S.ride.stall,"лифт: человек во вставшей клети");
    eq(G.data,d0,"лифт: вставшая — без осмотра");
    PLN_ACT.pinAge=99;
    ok(plnActDo(q,"manual",ctx),"лифт: ручной спуск");
    eq(G.data-d0,12,"лифт: ручной спуск +12");
    PLN_ACT.pinAge=99;tick(q,S,99);
    eq(S.ride,null,"лифт: спустился — не в клети");
    eq(plnActDo(q,"ride",ctx),null,"лифт: встала — до завтра не ездит");
    G.t+=CEL_DAY;PLN_ACT.pinAge=99;
    ok(plnActDo(q,"ride",ctx),"лифт: назавтра ездит");}

  /* ── остановка: прыжок ранцем ── */
  {const q=Q(sBad2);delete G.poiSeen[q.seed];
    PLN_ACT.pinAge=0;plnActDo(q,"call",ctx);PLN_ACT.pinAge=99;plnActDo(q,"ride",ctx);
    const d0=G.data;
    ok(plnActDo(q,"jump",ctx),"лифт: прыгнуть из вставшей клети");
    eq(G.data-d0,12,"лифт: прыжок +12");
    eq(plnLiftWhere(plnActMemo(q,true),99),"stuck","лифт: пустая клеть висит до завтра");
    ok(/до завтра/.test(K.got(plnActMemo(q,true))),"лифт: память говорит «до завтра»");}

  eq(G.credits,cr,"лифт: кредитов нет");
  PLN.on=pOn;PLN.bad=pBad;G.surf=pSurf;PLN_ACT.pinAge=pin;
}));
