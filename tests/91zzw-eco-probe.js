/* ══════════════ проба экономики (отчёт, не проверка; аудит 2026-09-04, docs/ECONOMY-AUDIT.md) ══════════════
   Печатает настоящие числа: распределение плеч и устойчивую ставку с давлением, выработку
   точки дроном и масштаб по числу машин, тиры частей по опасности (спички), награды. */
function prbStations(rad){const out=[];for(let x=-rad;x<=rad;x++)for(let y=-rad;y<=rad;y++){if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station&&S.station.prices)out.push(S);}return out;}
function prbLeg(list,hold,cap){
  const legs=[];
  for(const A of list)for(const B of list){
    if(A===B)continue;
    if(needOf(A)||needOf(B))continue;
    const PB=marketFor(B);
    const d=Math.max(Math.abs(A.sx-B.sx),Math.abs(A.sy-B.sy));
    for(const k of TRADE_KEYS){
      const ask=buyPriceFor(A,k);
      if(!ask||!PB[k])continue;
      const h=cap?Math.min(hold,Math.floor(cap/ask)):hold;
      if(h<=0)continue;
      const profit=(PB[k]-ask)*h,min=2.5+d*.6,fuel=(d*6+4)*8;
      legs.push({A,B,k,d,h,net:profit-fuel,min,rate:(profit-fuel)/min,buy:ask,sell:PB[k]});
    }
  }
  legs.sort((a,b)=>b.rate-a.rate);
  return legs;
}
TEST_SUITES.push(()=>suite("проба · плечи: распределение и устойчивая ставка",()=>{
  resetWorld();
  const list=prbStations(7);
  for(const hold of [40,150]){
    const legs=prbLeg(list,hold,0);
    const top=legs.slice(0,10).map(l=>Math.round(l.rate)).join(",");
    const n1=legs.filter(l=>l.rate>1000).length,n3=legs.filter(l=>l.rate>3000).length;
    ok(true,"трюм "+hold+" · лучшие 10 плеч кр/мин: "+top+" · плеч >1000: "+n1+" · >3000: "+n3+" · всего "+legs.length);
    const L=legs[0];ok(true,"трюм "+hold+" · #1: "+L.A.station.name+"→"+L.B.station.name+" "+RES[L.k].ru+" "+L.buy+"→"+L.sell+" d="+L.d+" net "+Math.round(L.net));
  }
  /* устойчивая ставка: 40 кругов по лучшему плечу с настоящими покупками и давлением; время 3.1 мин/круг */
  for(const cfg of [{id:"strizh",hold:40,cr:600},{id:"vyuk",hold:150,cr:20000}]){
    resetWorld();G.shipId=cfg.id;G.owned[cfg.id]=true;G.credits=cfg.cr;
    let laps=0,t=0,log=[];
    for(let i=0;i<40;i++){
      const legs=prbLeg(list,stat().cargoMax,G.credits);
      if(!legs.length||legs[0].rate<=0)break;
      const L=legs[0];
      const q=buyCargo(L.A,L.k,L.h);if(!q)break;
      sellCargo(L.B,L.k,q);
      G.credits-=(L.d*6+4)*8;
      G.t+=L.min*60;t+=L.min;laps++;
      if(i<3||i%10===9)log.push(Math.round(L.rate));
    }
    ok(true,cfg.id+" · "+laps+" кругов за "+Math.round(t)+" мин → касса "+Math.round(G.credits)+" · ставка "+Math.round((G.credits-cfg.cr)/t)+" кр/мин · ставки плеч по ходу: "+log.join(","));
  }
}));
TEST_SUITES.push(()=>suite("проба · дроны: выработка точки и масштаб по числу машин",()=>{
  resetWorld();
  const list=prbStations(7);
  for(const k of ORE_KEYS){
    const S=list.find(s=>marketFor(s)[k]);if(!S)continue;
    const pool=droneCapacity(k),p0=marketFor(S)[k];
    let rev=0,left=pool;
    while(left>0){const n=Math.min(left,Math.max(1,Math.round(.6*droneTripMs({sx:S.sx,sy:S.sy,pi:0,res:k,t0:0})/60000)));rev+=sellDroneYield(S,k,n);left-=n;}
    ok(true,RES[k].ru+" · точка "+pool+" ед · "+Math.round(pool/.6)+" мин · "+p0+" кр/ед → "+Math.round(rev)+" кр за цикл = "+Math.round(rev/(pool/.6))+" кр/мин на дрона");
    resetWorld();
  }
  /* десять дронов на одной точке кристаллов, одна станция: давление общее */
  resetWorld();
  const k="crystal",S=list.find(s=>marketFor(s)[k]);
  for(const N of [1,5,10,20]){
    resetWorld();
    let rev=0;const pool=droneCapacity(k);
    for(let i=0;i<N;i++){let left=pool;while(left>0){const n=Math.min(left,12);rev+=sellDroneYield(S,k,n);left-=n;}}
    ok(true,N+" дронов на кристаллах · цикл "+Math.round(pool/.6)+" мин · "+Math.round(rev)+" кр = "+Math.round(rev/(pool/.6))+" кр/мин · вложено "+N*2200);
  }
  ok(true,"давление: пол −35 % · полураспад 3 ч ИГРОВОГО времени (G.t) — офлайн не спадает · дронов на точку: предела нет");
}));
TEST_SUITES.push(()=>suite("проба · части, спички, награды, сбор газа",()=>{
  resetWorld();
  for(const d of [.2,.5,.8]){
    const r=rng(7),h=[0,0,0,0,0,0];
    for(let i=0;i<2000;i++)h[tierFromDanger(d,r)]++;
    const m=(h[3]*1+h[4]*3+h[5]*5.6)/2000;
    ok(true,"опасность "+d+" · тиры 1..5: "+h.slice(1).map(x=>Math.round(x/20)+"%").join(" ")+" · спичек на одну часть в среднем "+m.toFixed(2)+" · награда за пирата ≈ "+Math.round((90+d*420)*1.05));
  }
  const list=prbStations(7);
  const S=list.find(s=>stationParts(s).length);
  if(S){const P=stationParts(S).map(p=>"т"+((p.part||p).tier)+" "+p.price).join(", ");ok(true,"части на «"+S.station.name+"»: "+P);}
  ok(true,"сбор газа: .008+.004·drill ед/кадр в коридоре = "+Math.round((.008+.004)*60*60)+" ед/МИН при drill 1 и 100 % в коридоре (кадр = 1/60 с) · рынок не берёт");
  ok(true,"ремонт корпуса: 14 кр/ед · прыжок 9+13·d топлива · топливо 5–12 кр · мод L1 900–1600 · корпус 3 400–24 000 · управляющий доля 4–9 %");
}));
