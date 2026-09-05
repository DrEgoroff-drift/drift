/* ══════════════ прилавок по всей галактике (M354) ══════════════
   Про торговлю есть один сценарный набор («круг купил—продал всегда в минус»)
   на ОДНОЙ станции с ОДНИМ товаром. Здесь — сама формула, прогнанная по всей
   обжитой части галактики и по всем ключам ресурсов, включая те, которых на
   прилавке не бывает.

   Что проверяется:
   1. цена — число, и она положительная, в каждой системе и по каждому товару;
   2. взять всегда дороже, чем сдать: иначе круг у одного прилавка печатает
      деньги (BUY_SPREAD ровно за этим и стоит);
   3. сдача любого ключа ресурса не делает из кассы NaN. `sellCargo` берёт
      цену как `marketFor(sys)[k]`, а у нетоварного ключа её попросту нет —
      и одна такая сдача превращает деньги в «NaN кр» навсегда;
   4. чем больше сдаёшь, тем больше выручка — она не обязана быть линейной
      (аппетит станции платит надбавку за первые N), но обязана не убывать;
   5. купить больше, чем есть денег и места, нельзя, и касса не уходит в минус. */

function mkSystems(n){
  const out=[];
  for(let r=0;r<14&&out.length<n;r++)
    for(let x=-r;x<=r&&out.length<n;x++)for(let y=-r;y<=r&&out.length<n;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
      if(!starAt(x,y))continue;
      const s=getSystem(x,y);
      if(s.station)out.push(s);
    }
  return out;
}

TEST_SUITES.push(() => suite("прилавок: цена по всей галактике — число, и взять дороже, чем сдать", () => {
  resetWorld();
  const sys=mkSystems(120);
  ok(sys.length>=60,"станций промерено: "+sys.length);
  const bad=[],cheap=[];
  for(const s of sys)for(const k of TRADE_KEYS){
    const sell=marketPrice(s,k),buy=buyPriceFor(s,k);
    if(!Number.isFinite(sell)||sell<1)bad.push(s.key+"/"+k+" сдача "+sell);
    else if(!Number.isFinite(buy)||buy<1)bad.push(s.key+"/"+k+" взятие "+buy);
    else if(buy<=sell)cheap.push(s.key+"/"+k+" взять "+buy+" ≤ сдать "+sell);
  }
  eq(bad.slice(0,4).join(" ;; "),"","все цены — положительные числа");
  eq(cheap.slice(0,4).join(" ;; "),"","нигде нельзя взять дешевле, чем сдать");
  SYS_CACHE.clear();
  resetWorld();
}));

TEST_SUITES.push(() => suite("прилавок: сдача любого ключа ресурса не делает из кассы NaN", () => {
  resetWorld();
  const s=mkSystems(6)[0];
  ok(!!s,"станция для опыта найдена");
  if(!ok(s,"нашлось: s"))return;
  G.sx=s.sx;G.sy=s.sy;G.sys=s;G.st=s.station;
  const bad=[];
  for(const k of RES_KEYS){
    G.credits=1000;
    for(const q of RES_KEYS)G.cargo[q]=0;
    G.cargo[k]=5;
    let threw="";
    try{ sellCargo(s,k,5); }catch(e){ threw=(e&&e.message)||String(e); }
    if(threw)bad.push(k+" · исключение: "+threw);
    else if(!Number.isFinite(G.credits))bad.push(k+" · касса "+G.credits);
    else if(G.credits<1000)bad.push(k+" · сдача отняла денег: "+G.credits);
    else if(!Number.isFinite(G.cargo[k])||G.cargo[k]<0)bad.push(k+" · куча "+G.cargo[k]);
  }
  eq(bad.slice(0,4).join(" ;; "),"","ни один ключ ресурса не портит кассу при сдаче");
  resetWorld();
}));

TEST_SUITES.push(() => suite("прилавок: больше сдал — не меньше получил, и купить сверх кассы нельзя", () => {
  resetWorld();
  const s=mkSystems(6)[0];
  if(!s){ok(false,"станции нет");return;}
  G.sx=s.sx;G.sy=s.sy;G.sys=s;G.st=s.station;
  /* выручка не убывает с количеством */
  const k=TRADE_KEYS[0];
  let prev=-1,bad="";
  for(let q=1;q<=24&&!bad;q++){
    const Q=(typeof sellQuote==="function")?sellQuote(s,k,q):null;
    const rev=Q?Q.revenue:q*marketPrice(s,k);
    if(!Number.isFinite(rev))bad="выручка за "+q+": "+rev;
    else if(rev<prev)bad="за "+q+" дают "+rev+", а за "+(q-1)+" давали "+prev;
    prev=rev;
  }
  eq(bad,"","выручка не убывает с количеством");
  /* купить на последние: касса не уходит в минус, и груза приходит ровно на неё */
  G.credits=25;
  for(const q of RES_KEYS)G.cargo[q]=0;
  const ask=buyPriceFor(s,k),got=buyCargo(s,k,1000);
  ok(G.credits>=0,"касса после жадной покупки: "+G.credits);
  eq(got,Math.min(Math.floor(25/ask),stat().cargoMax),"куплено ровно по деньгам и месту: "+got);
  eq(G.cargo[k],got,"в трюм легло ровно купленное");
  eq(G.credits,25-got*ask,"списано ровно по цене взятия");
  /* нулевые и отрицательные количества ничего не делают */
  const c0=G.credits,h0=G.cargo[k];
  eq(buyCargo(s,k,0),0,"покупка нуля не покупает");
  eq(buyCargo(s,k,-5),0,"покупка минуса не покупает");
  eq(sellCargo(s,k,0),0,"сдача нуля не платит");
  eq(sellCargo(s,k,-5),0,"сдача минуса не платит");
  eq(G.credits,c0,"касса на месте после нулевых сделок");
  eq(G.cargo[k],h0,"трюм на месте после нулевых сделок");
  /* сдать больше, чем есть, — отдаётся только то, что есть */
  G.cargo[k]=3;
  const before=G.credits;
  const rev=sellCargo(s,k,99);
  ok(G.cargo[k]===0,"сдано ровно то, что было: осталось "+G.cargo[k]);
  ok(Number.isFinite(rev)&&G.credits>=before,"выручка за сдачу сверх наличия честная: "+rev);
  resetWorld();
}));
