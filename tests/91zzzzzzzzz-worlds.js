/* ══════════════ дисбаланс по мирам: четвёртый оракул (M443, DESIGN-tests §3.2) ══════════════
   Набор про экономику проверяет один прилавок. Игрок же ходит по десяткам
   систем, и баг живёт в РАСПРЕДЕЛЕНИИ: одна станция, откуда некуда прыгнуть с
   полным баком; один сосед, у которого товар втрое дороже, чем в шаге от
   него, — печатный станок; топливо, которое в одном углу стоит вчетверо
   больше, чем везде. Каждая такая система — по одной на галактику, и ни
   один набор «про правило» её не встретит; здесь правило спрашивают у КАЖДОЙ
   системы в шести кольцах от старта, а оракул смотрит на медиану и хвосты.

   Мир от семени не зависит (система — из своих координат), зависит от места:
   поэтому «семена ×100» здесь — сто систем. Числа — свежего мира: стартовый
   корабль, дальность прыжка stat().jump, трюм stat().cargoMax, топливо
   9+13·расстояние (18-mode-map). Пороги стартовые, их правит история
   лаборатории (§3.6): набор в карантине до 2026-09-18.

   Что судится, по системе со станцией:
   · есть сосед со станцией в дальности прыжка — иначе это ловушка: прилетел,
     заправился, а дальше только домой;
   · лучшая сделка в один прыжок не даёт больше ×3 на единицу товара — иначе
     это станок, и первый же игрок его найдёт;
   · цена топлива на станции не выше ×3 от медианы по кольцам;
   и по всем сразу: доля систем, из которых лучшая сделка с полным трюмом не
   окупает даже топливо до соседа, — не больше трети (мёртвая экономика по
   области, а не по одной станции). */
/* ×4.5: по замыслу сосед платит до ×1.2 узлом (trade 1.08 против outpost .9),
   ×1.8 давлением и ×2 нуждой на один привоз (M152e) — итого ×4.3; первый
   прогон дал xeno ×3.1–3.6 у шести станций, это замысел, а не станок */
const WLD_RINGS=6,WLD_RATIO=4.5,WLD_FUEL_K=3,WLD_DEAD=.34;
function wldNear(rings){
  const out=[];
  for(let r=0;r<=rings;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
    out.push(getSystem(x,y));
  }
  return out;
}
function wldMedian(a){const v=a.slice().sort((x,y)=>x-y);return v.length?v[v.length>>1]:0;}
function wldPct(a,p){const v=a.slice().sort((x,y)=>x-y);return v.length?v[Math.min(v.length-1,Math.floor(p*v.length))]:0;}

TEST_SUITES.push(()=>suite("миры: у каждой станции в шести кольцах есть сосед, сделка не станок, топливо не втридорога",
  {stage:"новый оракул, пороги по истории лаборатории, до 2026-09-18"},()=>{
  resetWorld();
  const st=stat(),range=st.jump,hold=st.cargoMax,fuelMax=st.fuelMax;
  const all=wldNear(WLD_RINGS),stations=all.filter(s=>s.station);
  ok(stations.length>=20,"станций в "+WLD_RINGS+" кольцах: "+stations.length+" из "+all.length+" систем (дальность "+range.toFixed(1)+", трюм "+hold+", бак "+fuelMax+")");
  const traps=[],mills=[],dear=[],dead=[],nets=[],ratios=[],fuels=[],hops=[];
  for(const S of stations){
    /* соседи со станцией в дальности прыжка — ищутся по клеткам, а не по списку:
       у края колец сосед может стоять за ними */
    const R=Math.ceil(range),nb=[];
    for(let x=S.sx-R;x<=S.sx+R;x++)for(let y=S.sy-R;y<=S.sy+R;y++){
      if((x===S.sx&&y===S.sy)||!starAt(x,y))continue;
      const d=Math.hypot(x-S.sx,y-S.sy);if(d>range+.02)continue;
      const N=getSystem(x,y);if(N.station)nb.push({N,d,cost:Math.round(9+d*13)});
    }
    fuels.push(S.station.fuelPrice);
    if(!nb.length){traps.push(S.name+" ("+S.sx+":"+S.sy+")");continue;}
    nb.sort((a,b)=>a.d-b.d);hops.push(nb[0].d);
    /* лучшая сделка в один прыжок: взять здесь, сдать там, заправиться там */
    let best={net:-Infinity,ratio:0,k:"",to:""};
    const buy={};for(const k of TRADE_KEYS)buy[k]=buyPriceFor(S,k);
    for(const {N,cost} of nb){
      if(cost>fuelMax)continue;
      for(const k of TRADE_KEYS){
        const sell=marketPrice(N,k),ratio=sell/buy[k];
        const net=(sell-buy[k])*hold-cost*N.station.fuelPrice;
        if(ratio>best.ratio)best.ratio=ratio;
        if(net>best.net)best={net,ratio:best.ratio,k,to:N.name};
      }
    }
    nets.push(best.net);ratios.push(best.ratio);
    if(best.ratio>WLD_RATIO)mills.push(S.name+" → "+best.to+": "+best.k+" ×"+best.ratio.toFixed(2));
    if(best.net<0)dead.push(S.name+" ("+S.sx+":"+S.sy+")");
  }
  const fMed=wldMedian(fuels);
  for(const S of stations)if(S.station.fuelPrice>fMed*WLD_FUEL_K)dear.push(S.name+": топливо "+S.station.fuelPrice+" при медиане "+fMed);
  note("сделка в прыжок, чистыми за полный трюм: медиана "+Math.round(wldMedian(nets))+", p5 "+Math.round(wldPct(nets,.05))+", p95 "+Math.round(wldPct(nets,.95))+
    " · наценка соседа: медиана ×"+wldMedian(ratios).toFixed(2)+", максимум ×"+Math.max(...ratios).toFixed(2)+
    " · топливо: медиана "+fMed+", разброс "+Math.min(...fuels)+"–"+Math.max(...fuels)+
    " · до ближней станции: медиана "+wldMedian(hops).toFixed(1)+", p95 "+wldPct(hops,.95).toFixed(1));
  eq(traps.join(" ;; "),"","из каждой станции есть прыжок к другой станции с полным баком"+(traps.length?" (ловушек "+traps.length+")":""));
  eq(mills.slice(0,4).join(" ;; "),"","ни у одного соседа товар не дороже ×"+WLD_RATIO+" от цены взятия здесь"+(mills.length?" (станков "+mills.length+")":""));
  eq(dear.slice(0,4).join(" ;; "),"","топливо нигде не дороже ×"+WLD_FUEL_K+" от медианы"+(dear.length?" (всего "+dear.length+")":""));
  const deadShare=dead.length/Math.max(1,stations.length);
  ok(deadShare<=WLD_DEAD,"систем, откуда лучшая сделка не окупает топлива до соседа: "+dead.length+" из "+stations.length+" ("+Math.round(deadShare*100)+"%)"+
    (dead.length?" — "+dead.slice(0,5).join(", "):""));
  resetWorld();
}));
