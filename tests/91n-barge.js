/* ══════════════ автотесты: баржи и редкости: настоящий маршрут, остовы, сто адресов ══════════════ */
/* ── баржи: маршрут настоящий, цена никогда не выгоднее станции назначения ── */
TEST_SUITES.push(()=>suite("баржи: маршрут настоящий",()=>{
  resetWorld();
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
  const legs=bargeLegs();
  ok(legs.length>=1,"есть хотя бы одно плечо маршрута");
  for(const l of legs){
    ok(l[0].station&&l[1].station,"оба конца плеча — станции");
    ok(l[0].key!==l[1].key,"концы плеча различны");
  }
  /* спавн: набор эфемерен, но потолок и валидность соблюдаются всегда */
  spawnBarges();
  ok(G.barges.length<=6,"барж не больше потолка ("+G.barges.length+")");
  for(const b of G.barges){
    ok(!!bargeSysAt(b.from)&&!!bargeSysAt(b.to),"у баржи настоящие концы");
    ok(b.from!==b.to,"баржа идёт между разными станциями");
  }
  /* цена: и продажа, и покупка у баржи ХУЖЕ станции назначения — иначе это был
     бы бесплатный арбитраж. Строим баржу на первом плече и проверяем. */
  const leg=legs[0];
  const b={seed:12345,from:leg[0].key,to:leg[1].key,good:"iron",qty:50,cap:100,
    budget:5000,temper:"bold",repGiven:0};
  const dest=bargeDestPrice(b,"iron");
  ok(bargeSellPrice(b,"iron")>dest,"баржа продаёт дороже станции назначения ("+
    bargeSellPrice(b,"iron")+" > "+dest+")");
  ok(bargeBuyPrice(b,"iron")<=dest,"баржа покупает не дороже станции назначения ("+
    bargeBuyPrice(b,"iron")+" ≤ "+dest+")");
  ok(dest-bargeSellPrice(b,"iron")<0,"арбитраж «купил у баржи → продал на станции» в минусе");
  /* баржа эфемерна: в сохранении её нет */
  const snap=snapshot();
  ok(!("barges"in snap),"баржи не попадают в snapshot()");
}));

/* ── баржа: гибель оставляет след ── */
TEST_SUITES.push(()=>suite("баржа: гибель оставляет след",()=>{
  resetWorld();
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
  const legs=bargeLegs();const leg=legs[0];
  const mk=extra=>Object.assign({seed:777,from:leg[0].key,to:leg[1].key,good:"iron",
    qty:20,cap:100,budget:3000,temper:"bold",capName:"Тук",hullMax:100,hp:40,
    distress:1,wasPirateDistress:1,paxSeed:0,repGiven:0,dealt:0,escort:0,done:0,
    x:0,y:0,vx:0,vy:0,a:0},extra||{});

  /* потопленная баржа оставляет РОВНО один осматриваемый остов */
  G.wrecks={};G.barges=[mk()];
  bargeSunk(G.barges[0],"pirates");
  const key=G.sx+","+G.sy;
  eq((G.wrecks[key]||[]).length,1,"один остов после гибели");
  ok(G.wrecks[key][0].seen===0,"остов ещё не обыскан");

  /* провал охраны НЕ начисляет кредитов (аванс уже был, назад не отбирают) */
  G.credits=1000;G.barges=[mk({seed:778,distress:0,wasPirateDistress:0})];
  bargeEscortAccept(G.barges[0]);
  const afterAdvance=G.credits;                       // аванс уже выплачен
  ok(afterAdvance>1000,"аванс охраны выплачен вперёд");
  bargeSunk(G.barges[0],"pirates");                   // баржу потеряли — провал
  eq(G.credits,afterAdvance,"провал охраны не трогает кредиты");
  ok(!questFind("escort:778"),"дело охраны закрыто (сорвано)");

  /* спасение меняет репутацию, но в пределах потолка шкалы */
  const dst=bargeSysAt(leg[1].key);
  G.rep={};repAdd(REP_MAX,dst);                        // уже на потолке
  G.pirates=[];G.barges=[mk({seed:779})];
  updateBarges(1);                                     // нет нападавших → спасение
  ok(repAt(dst)<=REP_MAX,"репутация после спасения не выходит за потолок");

  /* пассажир не появляется в кантине дважды */
  G.bargePax=[];
  const bp=mk({seed:780,paxSeed:12321,capName:"Севрюга"});
  bargePaxDeliver(bp);bargePaxDeliver(bp);
  eq(G.bargePax.length,1,"пассажир заведён ровно один раз");
  ok(G.bargePax[0].id.indexOf("bp")===0,"пассажир — кандидат в звено с id bp*");
}));

TEST_SUITES.push(()=>suite("редкости: сто адресов, ни одного повтора",()=>{
  resetWorld();
  /* закрытая таблица ровно на сто, id уникальны */
  eq(RARE.length,100,"в таблице ровно 100 редкостей");
  const ids={};let dup=0;for(const R of RARE){if(ids[R.id])dup++;ids[R.id]=1;}
  eq(dup,0,"все id уникальны");

  /* ни один эффект — не кредиты */
  const tags={};RARE_FX.forEach(f=>tags[f.tag]=1);
  ok(!tags.credits&&!tags.cash,"среди тегов эффектов нет кредитов");
  let credit=0;for(const R of RARE)if(/кредит|деньг/i.test(R.fx.ru))credit++;
  eq(credit,0,"ни одна редкость не сулит кредиты");

  /* каждое значение where — среди живых мест галактики. Логово барона живёт
     только в опасных секторах (sysDanger>.5, т.е. далеко от старта), поэтому
     обход идёт кольцами наружу, а не квадратом у нуля. */
  for(const W of RARE_WHERE){
    let live=null;
    for(let rad=0;rad<=30&&!live;rad++){
      for(let dx=-rad;dx<=rad&&!live;dx++)for(let dy=-rad;dy<=rad;dy++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==rad)continue;   // только кромка кольца
        if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);
        if(W.live(dx,dy,s)){live=s;break;}
      }
    }
    ok(!!live,"место «"+W.ru+"» встречается в галактике");
    ok((RARE_BY_WHERE[W.id]||[]).length>0,"у места «"+W.ru+"» есть свои редкости");
  }

  /* достижимость: перебором ключей достаётся КАЖДАЯ из ста — тот же сторож,
     что нашёл недостижимые узлы на M91 */
  const reach={};
  for(const W of RARE_WHERE)
    for(let k=1;k<4000;k++){const R=rareAtPlace(W.id,k);if(R)reach[R.id]=1;}
  eq(Object.keys(reach).length,100,"все сто редкостей достижимы с какого-то адреса");

  /* адрес детерминирован: то же место — тот же ответ */
  eq(rareAtPlace("poi",777).id,rareAtPlace("poi",777).id,"адрес стабилен");

  /* взять можно ровно один раз */
  G.rareFound=[];
  const R0=rareTake("poi",12345);
  ok(!!R0,"с адреса достаётся редкость");
  eq(rareCount(),1,"унесена одна");
  const again=rareTake("poi",12345);
  ok(!again,"с того же адреса второй раз — ничего");
  eq(rareCount(),1,"счёт не вырос от повтора");

  /* эффект собирается из унесённого и читается статой */
  G.rareFound=[];
  const gun=RARE.find(R=>R.fx.tag==="dmg");
  G.rareFound=[gun.id];
  ok(rareSum("dmg")>0,"эффект «орудие злее» суммируется");
  const before=(function(){G.rareFound=[];return stat().dmg;})();
  G.rareFound=[gun.id];
  ok(stat().dmg>before,"редкость поднимает урон в stat()");

  /* персист: только список id, переживает snapshot/applySave */
  G.rareFound=[gun.id,RARE[0].id];
  applySave(snapshot());
  eq(rareCount(),2,"унесённые редкости пережили сохранение");
  ok(rareHas(gun.id),"конкретная редкость на месте после загрузки");
  /* мусор в записи отбрасывается, не роняя загрузку */
  applySave(Object.assign(snapshot(),{rareFound:[123,null,"r5"]}));
  eq(rareCount(),1,"из битого списка остаётся только валидный id");
}));
