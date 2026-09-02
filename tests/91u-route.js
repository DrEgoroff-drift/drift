/* ══════════════ автотесты: свой торговый маршрут ══════════════ */
/* Ищем несколько систем со станциями — маршруту нужно минимум две */
function routeTestStations(n){
  const out=[];
  for(let dx=-9;dx<=9&&out.length<n;dx++)for(let dy=-9;dy<=9&&out.length<n;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    if(s.station)out.push(s);
  }
  return out;
}
/* плечо ставится по виденным ценам (M289, R1): «стыкуемся» — пишем прейскурант на стол */
function routeTestSee(s){pricesSeen(s);}
/* ── маршрут — это предмет: плечи ставятся, считаются и сохраняются ── */
TEST_SUITES.push(()=>suite("маршрут: плечи, счёт и сохранение",()=>{
  resetWorld();
  const st=routeTestStations(3);
  ok(st.length>=2,"в мире нашлось хотя бы две станции ("+st.length+")");
  ok(routeOf().legs.length===0,"новый мир начинается без маршрута");
  ok(routeLegs().length===0,"маршрут короче двух плеч ничего не считает");
  ok(routeLine()==="","без плеч подвалу карты сказать нечего");
  /* плечо ставится только на станцию */
  const empty=(function(){for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(!s.station)return s;}return null;})();
  if(empty){
    routeToggle(empty.sx,empty.sy);
    ok(!routeHas(empty.sx,empty.sy),"система без станции плечом не становится");
  }
  /* R1: цен не видели — плеча нет; услышанное по эфиру плеча не основывает */
  G.seenPrices={};
  const refused=routeToggle(st[0].sx,st[0].sy);
  ok(!routeHas(st[0].sx,st[0].sy)&&/не видели/.test(refused),"без виденных цен плечо не ставится, и игроку сказано почему");
  G.seenPrices[st[0].key]={name:st[0].station.name,sx:st[0].sx,sy:st[0].sy,day:celDay(),p:{ice:20},need:null,heard:1};
  routeToggle(st[0].sx,st[0].sy);
  ok(!routeHas(st[0].sx,st[0].sy),"запись «со слуха» плеча не основывает");
  routeTestSee(st[0]);routeTestSee(st[1]);
  routeToggle(st[0].sx,st[0].sy);
  ok(routeOf().legs.length===1&&routeLine().length>0,"с первого плеча подвал карты уже говорит о маршруте (R2)");
  routeToggle(st[1].sx,st[1].sy);
  ok(routeOf().legs.length===2,"два плеча поставлены");
  ok(routeHas(st[0].sx,st[0].sy),"первое плечо на месте");
  /* плечо несёт свою запись: стол можно стереть, маршрут считается по-прежнему */
  const note=routeOf().notes[st[0].key];
  ok(note&&note.p&&note.day===celDay(),"плечо скопировало запись цен в себя");
  /* повторный тычок снимает плечо, а не ставит второе такое же */
  routeToggle(st[1].sx,st[1].sy);
  ok(routeOf().legs.length===1,"повторный выбор снимает плечо");
  routeToggle(st[1].sx,st[1].sy);
  /* кольцо: на двух станциях два плеча — туда и обратно */
  const legs=routeLegs();
  ok(legs.length===2,"на двух станциях считается кольцо из двух плеч");
  for(const l of legs){
    ok(l.from!==l.to,"плечо соединяет разные станции");
    ok(l.fuel>0,"у плеча есть цена в топливе");
    if(l.k)ok(l.sell>l.buy,"везём только туда, где дороже");
    ok(l.qty<=stat().cargoMax,"объём не больше трюма");
  }
  /* следующее плечо: первая станция маршрута, пока курсор на нуле */
  const NX=routeNext();
  ok(NX&&NX.key===st[0].key&&/СЛЕДУЮЩЕЕ ПЛЕЧО/.test(routeLine()),"подвал называет следующее плечо");
  /* вилка старой записи: чем старше, тем шире, не шире ±40% */
  ok(routeFork({day:celDay()})===0,"свежая запись — без вилки");
  ok(routeFork({day:celDay()-4})>0&&routeFork({day:celDay()-100})===.4,"старая запись расходится вилкой до ±40%");
  ok(routeForkTxt(100,.1)==="90…110","вилка печатается парой чисел");
  /* стол не вытесняет плечо действующего маршрута (F18) */
  for(let i=0;i<30;i++)G.seenPrices["9"+i+",9"+i]={name:"x",sx:99,sy:99,day:celDay()-1,p:{ice:1},need:null};
  pricesTrim();pricesTrim();pricesTrim();
  ok(!!G.seenPrices[st[0].key]&&!!G.seenPrices[st[1].key],"бумага в 24 строки вытесняет чужое, а не плечи маршрута");
  /* потолок плеч — шесть (§16.4: цепочка в пять станций) */
  const more=routeTestStations(9);
  for(const s of more){routeTestSee(s);routeToggle(s.sx,s.sy);}
  ok(ROUTE_MAX===6,"потолок маршрута — шесть плеч");
  ok(routeOf().legs.length<=ROUTE_MAX,"плеч не больше потолка ("+routeOf().legs.length+")");
  /* маршрут переживает сохранение: это предмет, а не подсветка */
  const before=routeOf().legs.join("|"),notes=JSON.stringify(routeOf().notes);
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(routeOf().legs.join("|")===before,"маршрут пережил snapshot/applySave");
  ok(JSON.stringify(routeOf().notes)===notes,"заметки плеч пережили сохранение");
  /* запись до M289 — без заметок: плечо дописывает себе заметку само */
  const s0=snapshot();delete s0.trade.notes;delete s0.trade.earned;delete s0.trade.soldSets;
  applySave(JSON.parse(JSON.stringify(s0)));
  ok(routeLegs().length>0&&Object.keys(routeOf().notes).length===routeOf().legs.length,"старое сохранение: плечи получили заметки при первом счёте");
}));

/* ── круг считается по порядку, дорога продаётся прохоженной ── */
TEST_SUITES.push(()=>suite("маршрут: круги, цена сведений, передача",()=>{
  resetWorld();
  const st=routeTestStations(2);
  if(st.length<2){ok(true,"мира без двух станций не бывает — тест пропущен");return;}
  routeTestSee(st[0]);routeTestSee(st[1]);
  routeToggle(st[0].sx,st[0].sy);
  routeToggle(st[1].sx,st[1].sy);
  ok(routeOf().loops===0,"кругов ещё нет");
  ok(routeValue()===0&&/двух плеч|два круга/.test(routeWhyNoPrice()),"непрохоженный маршрут не стоит ничего, и сказано почему");
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(F){F.stalled=false;ok(routeToFactor()===0,"фактор непрохоженный маршрут не берёт");}
  routeVisit(st[0]);routeVisit(st[1]);
  ok(routeOf().loops===1,"обход по порядку засчитан кругом");
  routeVisit(st[1]);
  ok(routeOf().loops===1,"стыковка не по порядку круга не даёт");
  /* заработок маршрута пишется с продажи товара плеча на его станции — и
     только не под нуждой ×2 */
  const legs=routeLegs(),inLeg=legs[0];   // плечо st[0] → st[1]
  const wasE=routeOf().earned;
  if(inLeg.k){
    G.cargo[inLeg.k]=(G.cargo[inLeg.k]||0)+5;
    routeEarn(st[1],inLeg.k,5,5*inLeg.buy+500,false);
    ok(routeOf().earned===wasE+500,"сдача по плечу пишет чистый заработок в маршрут (+500)");
    routeEarn(st[1],inLeg.k,5,5*inLeg.buy+500,true);
    ok(routeOf().earned===wasE+500,"выручка под нуждой ×2 в заработок не идёт");
    routeEarn(st[0],inLeg.k,5,9999,false);
    ok(routeOf().earned===wasE+500,"сдача не на том конце плеча заработком не считается");
  }
  routeOf().loops=2;routeOf().earned=1000;
  ok(routeValue()===1000,"цена бумаги — два средних круга ("+routeValue()+")");
  routeOf().loops=4;
  ok(routeValue()===500,"чем больше кругов на тот же заработок, тем дешевле дорога");
  /* продажа: деньги приходят, маршрут уходит с карты, дорога запомнена */
  const price=routeValue(),cr=G.credits,legsSold=routeOf().legs.slice();
  const got=routeSell();
  ok(got===price&&G.credits>cr,"скупщик заплатил ровно объявленное");
  ok(routeOf().legs.length===0,"проданный маршрут пропал с карты");
  ok(routeOf().soldSets.length===1,"проданная дорога запомнена набором плеч");
  /* та же дорога дважды не покупается */
  routeToggle(st[0].sx,st[0].sy);routeToggle(st[1].sx,st[1].sy);
  routeOf().loops=3;routeOf().earned=900;
  ok(routeValue()===0&&/уже покупали/.test(routeWhyNoPrice()),"ту же дорогу (≥2 общих плеча) второй раз не покупают");
  ok(routeSoldBefore(legsSold),"набор плеч узнаётся как проданный");
  /* передача фактору: он берёт столько плеч, сколько увезёт — прохоженных */
  if(F){
    F.stalled=false;
    routeOf().loops=1;
    const n=routeToFactor();
    ok(n>=2&&n<=mgrRouteMax(F),"фактор взял столько плеч, сколько увозит ("+n+")");
    ok(routeOf().legs.length===0,"отданный маршрут перестал быть вашим");
    ok(F.route.length===n,"плечи легли в маршрут домена");
  }
}));

/* ── прилавок продаёт: наценка, запрос, и никакого станка у одной стойки ── */
TEST_SUITES.push(()=>suite("маршрут: взять с прилавка",()=>{
  resetWorld();
  const st=routeTestStations(1);
  if(!st.length){ok(true,"станций нет — пропущено");return;}
  /* самый дорогой товар станции: на шести кредитах рост запроса тонет в округлении */
  const s=st[0],k=TRADE_KEYS.filter(k=>s.station.prices[k]).sort((a,b)=>marketFor(s)[b]-marketFor(s)[a])[0]||"iron";
  const sell=marketFor(s)[k],ask=buyPriceFor(s,k);
  ok(ask>sell,"взять дороже, чем сдать: наценка прилавка ("+ask+" > "+sell+")");
  G.credits=100000;for(const r of RES_KEYS)G.cargo[r]=0;
  const got=buyCargo(s,k,10);
  ok(got===10&&G.cargo[k]===10,"десять единиц легли в трюм");
  buyCargo(s,k,10);
  ok(buyPriceFor(s,k)>ask,"покупка подняла запрос — там, откуда возят, дорожает ("+ask+" → "+buyPriceFor(s,k)+")");
  ok(marketFor(s)[k]===sell,"цена сдачи от покупки не сдвинулась");
  const cr=G.credits;
  const rev=sellCargo(s,k,20);
  ok(G.credits-cr===rev&&rev<20*ask,"продал обратно — потерял на наценке, а не заработал");
  /* трюм и кошелёк — потолки честные (запрос уже поднят — считаем от текущей цены взятия) */
  G.credits=buyPriceFor(s,k)*3+1;
  ok(buyCargo(s,k,50)===3,"берётся столько, на сколько хватает денег");
  G.credits=100000;
  const free=stat().cargoMax-held();
  ok(buyCargo(s,k,999)===free&&held()===stat().cargoMax,"берётся столько, сколько влезает");
  ok(buyCargo(s,"alloy",5)===0,"редкое с прилавка не берётся");
}));
