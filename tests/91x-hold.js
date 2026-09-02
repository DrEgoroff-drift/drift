/* ══════════════ автотесты: холдинг · часы слоя и аппетит станции (M290) ══════════════ */
function holdTestStation(){
  for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    if(s.station&&appetiteOf(s))return s;
  }
  return null;
}
TEST_SUITES.push(()=>suite("холдинг: аппетит станции — первые N в смену с надбавкой",()=>{
  resetWorld();
  ok(HOLD_SHIFT===20*60*1000,"смена слоя — двадцать минут реального времени");
  ok(holdShift(HOLD_SHIFT*5+1)===5,"номер смены считается от Date.now()");
  const s=holdTestStation();
  if(!s){ok(true,"в радиусе нет станции с аппетитом — пропущено");return;}
  const A=appetiteOf(s),k=Object.keys(A)[0],N=A[k];
  ok(N>0&&s.station.prices[k]>0,"станция «"+s.station.name+"» ("+s.station.stype+") ест "+RES[k].ru.toLowerCase()+" ×"+N+" в смену");
  for(const kk in A)ok(TRADE_KEYS.indexOf(kk)>=0&&!!s.station.prices[kk],"аппетит только на то, что в прейскуранте: "+kk);
  const base=marketFor(s)[k],pa=appetitePrice(s,k);
  ok(pa>base,"с надбавкой дороже обычной ("+pa+" > "+base+")");
  /* слагаемое, не множитель: под нуждой ×2 потолок 1.8 всё равно держит */
  const m=G.market[s.key];m.pressure[k]=.9;   /* 1.9 → clamp 1.8; с надбавкой тоже 1.8 */
  ok(appetitePrice(s,k)===marketFor(s)[k],"на потолке давления надбавка ничего не прибавляет — clamp один на всех");
  m.pressure[k]=0;
  /* котировка: первые N по надбавке, (N+1)-я — по обычной */
  const q1=sellQuote(s,k,N),q2=sellQuote(s,k,N+1);
  ok(q1.nA===N&&q1.revenue===N*pa,"первые "+N+" — все с надбавкой");
  ok(q2.nA===N&&q2.revenue===N*pa+base,"(N+1)-я единица — по обычной цене");
  /* продажа берёт ровно котировку и съедает норму */
  G.cargo[k]=N+3;const cr=G.credits;
  const rev=sellCargo(s,k,N+3);
  ok(rev===N*pa+3*base,"выручка равна котировке ("+rev+")");
  ok(G.credits-cr===rev,"деньги пришли ровно на выручку");
  ok(appetiteLeft(s,k)===0&&appetiteAte(s,k)===N,"норма смены выбрана: сдано "+N+", осталось 0");
  G.cargo[k]=2;
  const q3=sellQuote(s,k,2);
  ok(q3.nA===0,"после нормы — только обычная цена");
  ok(/на эту смену взяли/.test(appetiteLine(s,k)),"строка «БЕРЁТ» говорит, что смена выбрана");
  /* следующая смена — норма снова полная (запись со старым номером смены не считается) */
  G.hold[s.key].ate[k][1]-=1;
  ok(appetiteLeft(s,k)===N,"в новой смене норма полная");
  /* один объект спроса: аппетит и нужда — одной формы */
  const norms=normsOf(s);
  ok(norms.some(n=>n.source==="station"&&n.k===k&&n.n===N&&n.add===APPETITE_ADD),"normsOf перечисляет аппетит как норму");
  ok(norms.every(n=>"k" in n&&"n" in n&&"add" in n&&"source" in n),"у всех норм одна форма");
  /* дрон сдаёт по обычной — надбавка за груз, который игрок привёз сам */
  const before=appetiteAte(s,k);
  sellDroneYield(s,k,5);
  ok(appetiteAte(s,k)===before,"дроновая сдача аппетит не ест");
  /* сохранение: одна карта слоя, через asMap */
  G.hold[s.key].ate[k]=[3,holdShift()];
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(G.hold&&G.hold[s.key]&&G.hold[s.key].ate[k][0]===3,"G.hold пережил snapshot/applySave");
  const s0=snapshot();s0.hold=[];
  applySave(JSON.parse(JSON.stringify(s0)));
  ok(G.hold&&!Array.isArray(G.hold),"пустая карта из облака ([]) приходит объектом");
  /* станция без аппетита — ни блока, ни котировки с надбавкой */
  const fuel=(function(){for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;const t=getSystem(dx,dy);if(t.station&&t.station.stype==="fuel")return t;}return null;})();
  if(fuel)ok(appetiteOf(fuel)===null,"заправочная не ест ничего");
}));
