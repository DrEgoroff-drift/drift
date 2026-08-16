/* ══ M113: у курса есть причины ══
   Сторож замысла: курс двигается ТОЛЬКО от записанных происшествий, круговой
   рейс без события — всегда убыток, кошелёк и запас не уходят в минус, а бон
   берут только на станциях своего дома. */
TEST_SUITES.push(()=>suite("боны: у курса есть причины",()=>{
  resetWorld();
  G.sys=nearestStation(0,0);G.sx=G.sys.sx;G.sy=G.sys.sy;
  G.ship.x=G.sys.station.x;G.ship.y=G.sys.station.y;
  openStation();
  const H=houseOf();
  ok(!!H,"у станции есть дом-хозяин");
  eq(houseOf().id,H.id,"и он один и тот же при каждом вопросе");
  eq(scripRate(H.id),SCRIP_BASE,"курс начинается с общего основания");

  /* время само по себе курс не двигает */
  const before=scripRate(H.id);
  for(let i=0;i<500;i++){G.t++;}
  eq(scripRate(H.id),before,"время курс не двигает: блуждания нет");
  scripMove(H.id,5,"");
  eq(scripRate(H.id),before,"движение без причины не принимается");

  /* обмен: покупка и продажа, кошелёк не в минус */
  G.credits=100000;
  const n=scripBuy(10);
  eq(n,10,"боны куплены");
  eq(scripHeld(H.id),10,"и легли на счёт дома");
  const spent=100000-G.credits;
  eq(spent,10*scripBuyPrice(H.id),"списано ровно по цене покупки");
  const back=scripSell(10);
  eq(back,10,"и проданы обратно");
  eq(scripHeld(H.id),0,"запас пуст");
  ok(G.credits<100000,"круговой рейс без события — убыток, а не заработок");

  /* потолок за заход */
  openStation();
  G.credits=1000000;
  eq(scripLeft(),SCRIP_VISIT,"заход начинается с полного потолка");
  scripBuy(SCRIP_VISIT+50);
  eq(scripLeft(),0,"больше потолка за заход не обменять");
  eq(scripBuy(10),0,"и добавка не проходит");
  openStation();
  eq(scripLeft(),SCRIP_VISIT,"новый заход — новый потолок");

  /* продать больше, чем есть, нельзя; в минус не уходит */
  const have=scripHeld(H.id);
  eq(scripSell(have+100),Math.min(have,SCRIP_VISIT),"продано не больше, чем лежит");
  ok(scripHeld(H.id)>=0,"запас не ушёл в минус");
  G.credits=0;
  eq(scripBuy(5),0,"без денег не купить");
  ok(G.credits>=0,"кошелёк не ушёл в минус");

  /* каждое движение курса имеет записанную причину и происшествие за спиной */
  G.scripLog=[];
  const r0=scripRate(H.id);
  scripOnNews("barge",G.sys);
  ok(scripRate(H.id)<r0,"недошедшая баржа уронила курс дома");
  const L=G.scripLog;
  ok(L.length===1&&!!L[0].why,"и движение записано с причиной");
  const r1=scripRate(H.id);
  scripOnNews("captain",G.sys);
  ok(scripRate(H.id)>r1,"стало тише — курс вверх");
  ok(G.scripLog.every(e=>!!e.why&&!!HOUSE_BY_ID[e.id]),
     "в журнале нет движений без причины и без дома");

  /* границы курса */
  for(let i=0;i<200;i++)scripOnNews("barge",G.sys);
  ok(scripRate(H.id)>=SCRIP_MIN,"курс не проваливается ниже дна");
  for(let i=0;i<400;i++)scripOnNews("captain",G.sys);
  ok(scripRate(H.id)<=SCRIP_MAX,"и не улетает выше потолка");

  /* сохранение: ставка и курс переживают перезапись, мусор чинится по месту */
  G.scrip[H.id]=7;
  const rate=scripRate(H.id);
  const snap=snapshot();
  snap.scrip.нет_такого_дома=999;
  snap.scripRate[H.id]=99999;
  snap.scripLog.push({id:"нет",why:"",d:5});
  applySave(snap);
  eq(scripHeld(H.id),7,"ставка вернулась");
  eq(scripRate(H.id),SCRIP_MAX,"а нелепый курс зажат в границы");
  ok(!G.scrip["нет_такого_дома"],"чужой дом отброшен");
  ok(G.scripLog.every(e=>!!e.why&&!!HOUSE_BY_ID[e.id]),"и мусор из журнала выброшен");
  /* applySave уже вернул игрока в полёт: терминал закрываем руками, чтобы
     следующий набор не начинал с открытым экраном станции */
  $st.classList.remove("open");G.mode="system";
}));
