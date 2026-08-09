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
/* ── маршрут — это предмет: плечи ставятся, считаются и сохраняются ── */
TEST_SUITES.push(()=>suite("маршрут: плечи, счёт и сохранение",()=>{
  resetWorld();
  const st=routeTestStations(3);
  ok(st.length>=2,"в мире нашлось хотя бы две станции ("+st.length+")");
  ok(routeOf().legs.length===0,"новый мир начинается без маршрута");
  ok(routeLegs().length===0,"маршрут короче двух плеч ничего не считает");
  /* плечо ставится только на станцию */
  const empty=(function(){for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(!s.station)return s;}return null;})();
  if(empty){
    routeToggle(empty.sx,empty.sy);
    ok(!routeHas(empty.sx,empty.sy),"система без станции плечом не становится");
  }
  routeToggle(st[0].sx,st[0].sy);
  routeToggle(st[1].sx,st[1].sy);
  ok(routeOf().legs.length===2,"два плеча поставлены");
  ok(routeHas(st[0].sx,st[0].sy),"первое плечо на месте");
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
  /* потолок плеч */
  const more=routeTestStations(6);
  for(const s of more)routeToggle(s.sx,s.sy);
  ok(routeOf().legs.length<=ROUTE_MAX,"плеч не больше потолка ("+routeOf().legs.length+")");
  /* маршрут переживает сохранение: это предмет, а не подсветка */
  const before=routeOf().legs.join("|");
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(routeOf().legs.join("|")===before,"маршрут пережил snapshot/applySave");
}));

/* ── круг считается по порядку, и накатанный маршрут дешевеет ── */
TEST_SUITES.push(()=>suite("маршрут: круги, цена сведений, передача",()=>{
  resetWorld();
  const st=routeTestStations(2);
  if(st.length<2){ok(true,"мира без двух станций не бывает — тест пропущен");return;}
  routeToggle(st[0].sx,st[0].sy);
  routeToggle(st[1].sx,st[1].sy);
  ok(routeOf().loops===0,"кругов ещё нет");
  routeVisit(st[0]);routeVisit(st[1]);
  ok(routeOf().loops===1,"обход по порядку засчитан кругом");
  routeVisit(st[1]);
  ok(routeOf().loops===1,"стыковка не по порядку круга не даёт");
  /* Двух случайных станций мало, чтобы маршрут чего-то стоил: спред может быть
     нулевым, и это правда мира, а не поломка. Спред делаем руками — через
     давление рынка, тот же рычаг, которым его двигают продажи. */
  marketFor(st[0]);marketFor(st[1]);
  for(const k of TRADE_KEYS){
    G.market[st[0].key].pressure[k]=-.55;
    G.market[st[1].key].pressure[k]=.75;
  }
  ok(routeValue()>0,"на живом спреде сведения о маршруте чего-то стоят ("+routeValue()+" кр)");
  /* цена бумаги падает с каждым накатанным кругом */
  routeOf().loops=0;
  const fresh=routeValue();
  routeOf().loops=5;
  const worn=routeValue();
  ok(worn<fresh,"накатанный маршрут стоит дешевле свежего ("+worn+" < "+fresh+")");
  /* продажа: деньги приходят, маршрут уходит с карты, цены оседают */
  routeOf().loops=0;
  const price=routeValue(),cr=G.credits;
  const got=routeSell();
  if(price>0){
    ok(got===price,"скупщик заплатил ровно объявленное");
    ok(G.credits>cr,"кредиты пришли");
  }
  ok(routeOf().legs.length===0,"проданный маршрут пропал с карты");
  /* передача фактору: он берёт столько плеч, сколько увезёт */
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(F){
    F.stalled=false;
    routeToggle(st[0].sx,st[0].sy);
    routeToggle(st[1].sx,st[1].sy);
    const n=routeToFactor();
    ok(n>=2&&n<=mgrRouteMax(F),"фактор взял столько плеч, сколько увозит ("+n+")");
    ok(routeOf().legs.length===0,"отданный маршрут перестал быть вашим");
    ok(F.route.length===n,"плечи легли в маршрут домена");
  }
}));
