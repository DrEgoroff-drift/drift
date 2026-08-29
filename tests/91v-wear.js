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
  /* доля снимается ровно та, о которой просили (этим живёт гараж дома;
     у верфи с M235 не доля, а пол — отдельный набор ниже) */
  wearService(.5);
  ok(Math.abs(wearOf()-.5)<.01,"снята половина налёта");
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

/* ══════════════ M235: у верфи есть пол ══════════════
   Верфь снимала половину налёта, и нажимать можно было сколько угодно раз:
   пять кнопок — и корабль чист за деньги, а повод возвращаться домой пропал.
   Автор поймал это на второй вечер: «можно, если есть деньги, до бесконечности
   по половинке». Проверяем сам договор: ниже пола верфь не идёт никогда, второе
   нажатие ничего не меняет и денег не стоит, а дом по-прежнему доводит до нуля. */
TEST_SUITES.push(()=>suite("верфь: пол, ниже которого не полируют",()=>{
  resetWorld();
  G.wear={};G.wear[G.shipId]=WEAR_FULL;              // облезлый
  eq(Math.round(wearOf()*100),100,"корпус изношен полностью");
  const floor=wearFloor();
  ok(floor>=.15&&floor<=.5,"пол в разумных пределах: "+Math.round(floor*100)+"%");
  const cost1=wearYardCost();
  ok(cost1>0,"за первое обслуживание просят деньги");
  const got=wearServiceTo(floor);
  ok(Math.abs(wearOf()-floor)<1e-6,"после обслуживания налёт ровно на полу");
  ok(Math.abs(got-(1-floor))<1e-6,"сняли ровно то, за что взяли");
  /* второй раз — нечего снимать и не за что платить */
  eq(wearYardCost(),0,"второе обслуживание не стоит ничего");
  eq(wearServiceTo(floor),0,"и ничего не снимает: пол есть пол");
  /* сколько ни жми — ниже пола не уходит */
  for(let i=0;i<20;i++)wearServiceTo(floor);
  ok(Math.abs(wearOf()-floor)<1e-6,"двадцать нажатий не сдвинули пол");
  /* дом снимает всё */
  wearService(1);
  eq(wearOf(),0,"гараж дома доводит до чистого");
  /* настоящая верфь работает лучше торгового узла в той же системе */
  const st=G.st;
  G.st={name:"т",stype:"trade"};const fTrade=wearFloor();
  G.st={name:"в",stype:"yard"};const fYard=wearFloor();
  G.st=st;
  ok(fYard<fTrade,"на верфи пол ниже, чем на торговом узле: "+
    Math.round(fYard*100)+"% против "+Math.round(fTrade*100)+"%");
}));

/* ══════════════ M256: заплатка остаётся швом ══════════════
   Чинить, обслуживать, носить — три разные вещи: обслуживание снимает налёт,
   а швы не смывает никто. Число швов живёт на корпусе, переживает запись,
   растёт по починке и упирается в потолок. */
TEST_SUITES.push(()=>suite("швы: биография корпуса не смывается",()=>{
  resetWorld();
  eq(seamsOf(),0,"новый корпус без швов");
  seamAdd();seamAdd();
  eq(seamsOf(),2,"две починки — два шва");
  const mine=G.shipId;
  G.owned.igla=true;G.shipId="igla";
  eq(seamsOf(),0,"второй корпус чист");
  eq(seamsOf(mine),2,"первый помнит свои");
  for(let i=0;i<20;i++)seamAdd();
  eq(seamsOf(),9,"потолок девять");
  applySave(JSON.parse(JSON.stringify(snapshot())));
  eq(seamsOf(mine),2,"швы пережили snapshot/applySave");
  const s=snapshot();delete s.seams;
  applySave(JSON.parse(JSON.stringify(s)));
  eq(seamsOf(mine),0,"старая запись без поля — чистые корпуса");
}));
