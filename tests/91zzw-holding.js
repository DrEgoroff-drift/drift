/* ══════════════ замер: холдинг против целей §16 (M293, шаг 5) ══════════════
   Отчёт, не проверка — кроме трёх вещей, которые замысел велит держать числом:
   первый пай не позже 40 минут после площадки, окупаемость ×1 в 4–6 кругов,
   цепочка снизу доверху длиннее четырёх станций. Остальное печатается, чтобы
   кривую крутили по распечатке, а не по ощущению (DESIGN-economy). */
TEST_SUITES.push(()=>suite("холдинг: замер против §16 (отчёт и три правила)",()=>{
  resetWorld();
  G.credits=600;
  const list=ecoStations(7);
  const L40=ecoBestLeg(list,40,600,true);
  const tradeMin=L40?L40.rate:0;                       /* кр/мин руками на «Стриже» */
  ok(true,"торговля · «Стриж», без нужды: "+Math.round(tradeMin)+" кр/мин = "+Math.round(tradeMin*60)+" кр/час"+
    (L40?" · "+RES[L40.k].ru.toLowerCase()+" "+L40.buy+"→"+L40.sell+", "+Math.round((L40.sell-L40.buy))+" кр/ед":""));
  /* ── цех ×1 первого яруса: что даёт смена, час, круг ── */
  const rows=[];
  for(const id of BLD_KEYS){
    const d=BLD[id];if(d.fam!=="B")continue;
    const out=Object.keys(d.makes)[0],O=d.makes[out];
    let inUnits=0,inCost=0;for(const k in d.eats){inUnits+=d.eats[k];inCost+=d.eats[k]*RES[k].price;}
    const shareShift=O*indPrice(out);                  /* пай за смену в теневой цене */
    let cost=d.cost.credits;for(const k in d.cost)if(k!=="credits")cost+=d.cost[k]*indPrice(k);
    rows.push({id,ru:d.ru,inUnits,inCost,shareShift,perUnit:shareShift/inUnits,cost,
               payLoops:cost/(shareShift*2)});          /* круг ≈ две смены */
  }
  rows.sort((a,b)=>b.perUnit-a.perUnit);
  const best=rows[0],worst=rows[rows.length-1];
  ok(true,"пай · лучший цех ×1: "+best.ru+" — "+Math.round(best.shareShift)+" кр/смену за "+best.inUnits+" ед = "+best.perUnit.toFixed(1)+" кр/ед · окупаемость "+best.payLoops.toFixed(1)+" круга");
  ok(true,"пай · худший цех ×1: "+worst.ru+" — "+Math.round(worst.shareShift)+" кр/смену за "+worst.inUnits+" ед = "+worst.perUnit.toFixed(1)+" кр/ед · окупаемость "+worst.payLoops.toFixed(1)+" круга");
  const avgPerUnit=rows.reduce((a,r)=>a+r.perUnit,0)/rows.length;
  const tradePerUnit=L40?(L40.sell-L40.buy):0;
  ok(true,"§16.2 · пай против торговли за ЕДИНИЦУ трюма: "+avgPerUnit.toFixed(1)+" кр/ед против "+tradePerUnit+" кр/ед на лучшем плече = ×"+(tradePerUnit?(avgPerUnit/tradePerUnit).toFixed(2):"—")+" (цель 1.3–1.8)");
  const shareHour=best.shareShift*3;                   /* три смены в час, если кормить и забирать */
  ok(true,"§16.1 · доход в час: торговля "+Math.round(tradeMin*60)+" → торговля + лучший пай "+Math.round(tradeMin*60+shareHour)+" = ×"+(tradeMin?(1+shareHour/(tradeMin*60)).toFixed(2):"—")+" (цель 1.5–2)");
  /* ── три правила ── */
  const pays=rows.filter(r=>r.payLoops>=4&&r.payLoops<=6).length;
  ok(true,"§16.3 · окупаемость ×1 в 4–6 кругов: "+pays+" из "+rows.length+" цехов · разброс "+rows.reduce((a,r)=>Math.min(a,r.payLoops),1e9).toFixed(1)+"–"+rows.reduce((a,r)=>Math.max(a,r.payLoops),0).toFixed(1));
  ok(rows.every(r=>r.payLoops>=3.5&&r.payLoops<=8),"§16.3 · ни один цех ×1 не окупается быстрее 3.5 кругов и дольше восьми");
  const firstMin=(BLD_SHIFTS[1]+1)*HOLD_SHIFT/60000;   /* монтаж + одна смена корма */
  ok(firstMin<=40,"§16.8 · первый пай не позже 40 мин после площадки: монтаж "+BLD_SHIFTS[1]+" см. + смена = "+firstMin+" мин");
  ok(ROUTE_MAX>=6,"§16.4 · цепочка в пять станций помещается в маршрут ("+ROUTE_MAX+")");
  /* баржа: денег не приносит — кр/мин ноль, ниже любого домена; её выход — единицы в бункерах за смену */
  const vy=shipData("vyuk");
  ok(true,"§16.9 · баржа «Вьюк»: "+vy.cargo+" ед на борту, за смену ссыпает до "+Math.min(vy.cargo,best.inUnits*HOLD_CAP_SHIFTS)+" ед в один цех ×1 · кр/мин = 0 ≤ фактор");
  /* ── ярус 2 и 3: сколько стоит вход и что даёт ── */
  for(const fam of ["C","D"]){
    const ids=BLD_KEYS.filter(id=>BLD[id].fam===fam);
    let cost=0,share=0;
    for(const id of ids){const d=BLD[id];const out=Object.keys(d.makes)[0];share+=d.makes[out]*indPrice(out);
      let c=d.cost.credits;for(const k in d.cost)if(k!=="credits")c+=d.cost[k]*indPrice(k);cost+=c;}
    ok(true,"ярус "+(fam==="C"?2:3)+" · средняя цена входа "+Math.round(cost/ids.length)+" кр · средний пай за смену "+Math.round(share/ids.length)+" кр · окупаемость "+(cost/ids.length/(share/ids.length*2)).toFixed(1)+" круга");
  }
  /* ── добыча: скидка против рынка ── */
  const src=BLD.regolith,srcVal=Object.keys(src.makes).reduce((a,k)=>a+src.makes[k]*RES[k].price*(1-SRC_DISCOUNT),0);
  let srcCost=src.cost.credits;for(const k in src.cost)if(k!=="credits")srcCost+=src.cost[k]*indPrice(k);
  ok(true,"добыча · Реголитовая разработка ×1: выгода "+Math.round(srcVal)+" кр/смену (0.3 цены на "+Object.keys(src.makes).map(k=>src.makes[k]).join("+")+" ед) · окупаемость "+(srcCost/(srcVal*2)).toFixed(1)+" круга");
  /* ── аппетит: что даёт станция сама по себе ── */
  let appBest=0;for(const S of list){const A=appetiteOf(S);if(!A)continue;for(const k in A)appBest=Math.max(appBest,A[k]*(appetitePrice(S,k)-marketFor(S)[k]));}
  ok(true,"аппетит · лучшая надбавка за смену в радиусе 7: "+appBest+" кр · против пая лучшего цеха "+Math.round(best.shareShift)+" кр");
}));
