/* Первая вахта (M909, DESIGN-game §10.7): свежая запись, бот играет первый час по часам игры.
   К второй минуте — два адресных дела с лицом; срочного и наряда ещё нет. Первая отстыковка —
   диспетчер называет участок. К шестой минуте — капсула на восемь минут, сама, в полёте. Час
   налёта — первая бумага со строкой стажёра, и с ней полоса открывается целиком. */
TEST_SUITES.push(()=>suite("первая вахта: два адресных к 2-й минуте, срочное к 6-й, бумага к часу",()=>{
  resetWorld();
  ok(firstHour()&&!G.fw,"свежая запись: первый час, вахты ещё не было");
  fwSt();
  const S=G.sys&&G.sys.station&&G.sys.station.prices?G.sys:dispTestStations()[0];
  /* такт игры: часы и налёт идут кусками по полминуты, фон (mgrTick) — на каждом куске, как в петле */
  let urgAt=-1;
  const step=ms=>{
    for(let t=0;t<ms;t+=30000){
      clockAdvance(30000);if(G.mode==="system")G.flownMs=(G.flownMs||0)+30000;
      mgrTick();
      if(urgAt<0&&dispSt().it.some(x=>x.kind==="urg"))urgAt=fwMin();
    }
  };
  G.mode="system";step(60000);
  dispTestDock(S);
  step(60000);
  const A=dispLane(),addr=A.filter(x=>x.addr);
  ok(fwMin()<=2.01&&addr.length>=2&&addr.every(x=>x.face&&x.who&&x.mins>0),
    "к "+fwMin().toFixed(1)+"-й минуте адресных с лицом и сроком: "+addr.length+" ("+A.map(x=>x.v).join(", ")+")");
  ok(!A.some(x=>x.urg||x.long),"в первой вахте у стойки нет ни срочного, ни наряда на три станции");
  /* первая отстыковка */
  const n0=G.log.length;
  closeStation();G.mode="system";
  const said=G.log.slice(n0).find(x=>/участок/.test(x.s));
  ok(fwSt().w===1&&said&&said.s.indexOf(watchName())>=0,"первая отстыковка: «"+(said?said.s:"—")+"»");
  dispTestDock(S);closeStation();G.mode="system";
  ok(G.log.filter(x=>/Смена пошла/.test(x.s)).length===1,"строка участка сказана один раз");
  /* к шестой минуте — капсула, сама, в полёте */
  step(Math.max(0,(FW_URG_MIN-fwMin())*60000)+30000);
  const U=dispSt().it.find(x=>x.kind==="urg");
  ok(U&&urgAt>=FW_URG_MIN&&urgAt<=FW_URG_MIN+.6,"срочное пришло на "+urgAt.toFixed(1)+"-й минуте"+(U?" · «"+U.v+"»":""));
  ok(U&&U.v==="kapsula"&&U.due-now()>7*60000&&U.due-now()<=FW_POD_MIN*60000,"капсула с баржи на восемь минут: осталось "+(U?((U.due-now())/60000).toFixed(1):"—")+" мин");
  /* до часа наряда нет */
  step(4*60000);dispTestDock(S);
  ok(!dispLane().some(x=>x.long),"на "+Math.round(fwMin())+"-й минуте наряда на три станции ещё нет");
  closeStation();G.mode="system";
  /* час налёта: первая бумага */
  step(Math.max(0,FIRST_HOUR_MS-G.flownMs)+60000);
  ok(!firstHour()&&!fwOn(),"налётан час: вахта кончилась ("+Math.round(G.flownMs/60000)+" мин налёта, "+Math.round(fwMin())+" мин игры)");
  dispTestDock(S);
  const P=billSt().paper;
  ok(P&&P.first&&P.n===1,"первая бумага на первой стыковке после часа, со строкой стажёра");
  ok(dispLane().some(x=>x.long),"после бумаги наряд на три станции выдаётся как всем");
  /* запись */
  const F=Object.assign({},fwSt());
  const s=JSON.parse(JSON.stringify(snapshot()));G.fw=null;applySave(s);
  ok(fwSt().t0===F.t0&&fwSt().u===1&&fwSt().w===1&&fwSt().done===1,"вахта пережила запись");
  delete s.fw;G.fw=null;applySave(s);
  ok(fwSt().done===1,"запись до M909 с налётанным часом — вахты нет");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("первая вахта: сданная смена стоит, капсула не приходит",()=>{
  resetWorld();
  fwSt();G.mode="system";
  watchHand();
  for(let i=0;i<20;i++){clockAdvance(30000);mgrTick();}
  ok(!dispSt().it.some(x=>x.kind==="urg"),"смена сдана десять минут — капсулы нет");
  ok(fwMin()<1.1,"часы вахты стояли: "+fwMin().toFixed(1)+" мин");
  watchBack();
  let n=0;while(!dispSt().it.some(x=>x.kind==="urg")&&n<40){clockAdvance(30000);mgrTick();n++;}
  ok(dispSt().it.some(x=>x.kind==="urg"&&x.v==="kapsula")&&Math.abs(fwMin()-FW_URG_MIN)<.6,"смену приняли — капсула на "+fwMin().toFixed(1)+"-й минуте вахты");
  resetWorld();
}));
