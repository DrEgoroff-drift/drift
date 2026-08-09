/* ══════════════ автотесты: корабль стареет ══════════════ */
TEST_SUITES.push(()=>suite("износ: копится в полёте, снимается руками",()=>{
  resetWorld();
  ok(wearOf()===0,"новый корабль без налёта");
  /* налёт копится только там, где летают: на станции корабль не стареет */
  G.mode="dock";wearTick(600);
  ok(wearOf()===0,"у причала корабль не стареет");
  G.mode="system";
  wearTick(WEAR_FULL*.5);
  const half=wearOf();
  ok(Math.abs(half-.5)<.01,"полтора часа в полёте — половина налёта ("+half.toFixed(2)+")");
  /* грязные режимы точат быстрее чистых */
  resetWorld();
  G.mode="system";wearTick(1000);const clean=wearOf();
  resetWorld();
  G.mode="belt";wearTick(1000);const dirty=wearOf();
  ok(dirty>clean,"в поясе корпус пачкается быстрее, чем в пустоте ("+
    dirty.toFixed(3)+" > "+clean.toFixed(3)+")");
  /* цена износа: руль и тяга, и ничего больше */
  resetWorld();
  const fresh=stat();
  G.mode="system";wearTick(WEAR_FULL);
  const worn=stat();
  ok(wearOf()===1,"налёт дошёл до потолка и не перевалил");
  ok(worn.thr<fresh.thr&&worn.turn<fresh.turn,"облезлый корабль хуже слушается");
  ok(worn.thr/fresh.thr>.86,"потеря тяги не больше 12% ("+
    Math.round((1-worn.thr/fresh.thr)*100)+"%)");
  ok(worn.hullMax===fresh.hullMax&&worn.fuelMax===fresh.fuelMax,
     "износ не трогает корпус и бак — он про руки, а не про поломку");
  /* верфь берёт половину, гараж — всё */
  wearService(.5);
  ok(Math.abs(wearOf()-.5)<.01,"верфь сняла половину налёта");
  ok(wearYardCost()>0,"за обслуживание просят деньги");
  wearService(1);
  ok(wearOf()===0,"гараж дома довёл до чистого");
  ok(wearYardCost()===0,"со свежего корпуса верфь денег не берёт");
}));

/* ── налёт живёт на корпусе, а не на игроке ── */
TEST_SUITES.push(()=>suite("износ: помнит корпус и переживает запись",()=>{
  resetWorld();
  G.mode="system";wearTick(WEAR_FULL*.4);
  const mine=G.shipId,w=wearOf(mine);
  ok(w>0,"на своём корпусе есть налёт");
  /* пересели на другой — он свежий, но первый ничего не забыл */
  G.owned.igla=true;G.shipId="igla";
  ok(wearOf()===0,"второй корпус свеж");
  ok(Math.abs(wearOf(mine)-w)<1e-9,"первый корпус помнит свои часы");
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(Math.abs(wearOf(mine)-w)<1e-9,"налёт пережил snapshot/applySave");
  /* старая запись без поля приходит свежей, а не сломанной */
  const s=snapshot();delete s.wear;
  applySave(JSON.parse(JSON.stringify(s)));
  ok(wearOf(mine)===0,"запись без поля грузится как свежий корпус");
}));
