/* Кран аппетита (M905, DESIGN-game §10.4, 12ab-hold): то, что станция ест, сверх нормы смены
   идёт сразу по дну давления; давление после такой сдачи стоит на дне и отдыхает три часа
   до половины; чего станция не ест — по-старому; «купил здесь — сдал здесь» денег не печатает. */
TEST_SUITES.push(()=>suite("кран аппетита: сверх нормы — дно сразу, отдых три часа",()=>{
  resetWorld();
  let S=null,k=null;
  for(let x=-8;x<=8&&!S;x++)for(let y=-8;y<=8&&!S;y++){
    if(!starAt(x,y))continue;const s=getSystem(x,y),A=s&&appetiteOf(s);
    if(A){S=s;k=Object.keys(A)[0];}
  }
  ok(!!S,"станция с аппетитом найдена: "+(S&&S.station.name)+" ест "+k);
  const A=appetiteOf(S),N=A[k];
  const list=marketFor(S)[k];
  const Q=sellQuote(S,k,N+5);
  ok(Q.nA===N&&Q.nF===5&&Q.priceF===faucetPrice(S,k)&&Q.priceF<list,
    "котировка: "+Q.nA+" с надбавкой по "+Q.priceA+", "+Q.nF+" сверх по "+Q.priceF+" при обычной "+list);
  G.cargo[k]=(G.cargo[k]|0)+N+5;
  const got=sellCargo(S,k,N+5);
  ok(got>0&&Math.abs(G.market[S.key].pressure[k]-FAUCET_FLOOR)<1e-9,"после сдачи сверх нормы давление на дне: "+G.market[S.key].pressure[k]);
  clockAdvance(3*3600000);marketFor(S);
  const p3=G.market[S.key].pressure[k];
  ok(Math.abs(p3-FAUCET_FLOOR/2)<.01,"через три часа — половина: "+p3.toFixed(3));
  /* чего станция не ест — полпроцента за единицу, как было */
  const o=TRADE_KEYS.find(q=>S.station.prices[q]&&!A[q]&&!(G.market[S.key].pressure[q]));
  if(o){
    const Qo=sellQuote(S,o,5);
    G.cargo[o]=(G.cargo[o]|0)+5;sellCargo(S,o,5);
    ok(!Qo.nF&&Math.abs(G.market[S.key].pressure[o]+.025)<1e-9,"«"+o+"» станция не ест: без крана, давление "+G.market[S.key].pressure[o]);
  }else ok(Object.keys(A).length===TRADE_KEYS.filter(q=>S.station.prices[q]).length,"станция ест весь свой прейскурант");
  /* купил здесь — сдал здесь: норма уменьшена на купленное, остальное по дну — круг в минус */
  clockAdvance(HOLD_SHIFT);
  G.credits=1e5;const c0=G.credits;
  const b=buyCargo(S,k,N);
  G.cargo[k]=b;const back=sellCargo(S,k,b);
  ok(b>0&&G.credits<c0,"купил "+b+" и тут же сдал: "+Math.round(G.credits-c0)+" кр");
  resetWorld();
}));
