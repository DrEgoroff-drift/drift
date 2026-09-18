/* ══ десять дальних товаров (M465, DESIGN-resources §2–3) ══
   Главный сторож — первый: новые товары тянут СВОЙ поток случайности, и ни
   одна существующая система, планета, пояс, станция или цена не сдвинулась.
   Отпечаток снят на коде ДО товаров (18.09, 0.449.0) и вписан числом. */
const FAR_FP_BEFORE="3517351113";
function farWorldFingerprint(){
  const skip=new Set(["viz","traffic","lane","tex","cv","img","canvas","cache"]);
  let h=0x2F17;
  for(let sx=-60;sx<=60;sx+=7)for(let sy=-60;sy<=60;sy+=9){
    const sys=getSystem(sx,sy);
    const s=JSON.stringify(sys,(k,v)=>skip.has(k)?undefined:(typeof v==="number"?Math.round(v*1000)/1000:v));
    for(let i=0;i<s.length;i++)h=hashi(h,s.charCodeAt(i),i&255);
  }
  return String(h>>>0);
}
TEST_SUITES.push(()=>suite("дальние товары: старый мир не сдвинулся",()=>{
  resetWorld();
  eq(farWorldFingerprint(),FAR_FP_BEFORE,"системы, планеты, пояса, станции и цены — те же, что до десяти товаров");
}));
TEST_SUITES.push(()=>suite("дальние товары: полосы и тяжёлый хвост удачи",()=>{
  resetWorld();
  eq(FAR_KEYS.length,10,"товаров десять");
  for(const k of FAR_KEYS){
    ok(RES[k].far&&RES[k].far.eat&&RES[k].price>0,k+": есть полоса, едок и цена");
    ok(TRADE_KEYS.indexOf(k)<0&&ORE_KEYS.indexOf(k)<0,k+": вне старых списков (их поток кормит генерацию)");
  }
  /* внутри круга заселения дальних нет вовсе */
  let inside=0;for(let sx=-7;sx<=7;sx++)for(let sy=-7;sy<=7;sy++)inside+=farDeposits(sx,sy).length;
  eq(inside,0,"внутри r<10 дальних залежей нет");
  /* распределение сортов по всем найденным залежам — §3 */
  const n=[0,0,0,0];let tot=0,band={},early=0;
  for(let sx=-70;sx<=70;sx+=1)for(let sy=-70;sy<=70;sy+=2){
    for(const d of farDeposits(sx,sy)){
      n[d.grade]++;tot++;
      if(Math.hypot(sx,sy)<RES[d.k].far.band)early++;
      band[d.k]=(band[d.k]|0)+1;
    }
  }
  eq(early,0,"ни одной залежи ближе своей полосы");
  ok(tot>2000,"залежей хватает для счёта: "+tot);
  const f=n.map(x=>x/tot);
  ok(f[0]>.6&&f[0]<.8,"бедных ~70 %: "+(f[0]*100).toFixed(1));
  ok(f[1]>.17&&f[1]<.32,"хороших ~25 %: "+(f[1]*100).toFixed(1));
  ok(f[2]>.02&&f[2]<.09,"богатых ~5 %: "+(f[2]*100).toFixed(1));
  ok(f[3]>.001&&f[3]<.015,"жил ~0.5 %: "+(f[3]*100).toFixed(2));
  for(const k of FAR_KEYS)ok((band[k]|0)>0,k+": встречается где-то в мире");
  eq(JSON.stringify(farDeposits(31,-17)),JSON.stringify((FAR_CACHE.clear(),farDeposits(31,-17))),"один сектор — одни залежи");
}));
TEST_SUITES.push(()=>suite("дальние товары: выемка, честный прибор, ЖИЛА",()=>{
  resetWorld();
  /* найти пояс с дальней залежью */
  let at=null;
  for(let sx=12;sx<60&&!at;sx++)for(let sy=-30;sy<30&&!at;sy++){
    const d=farDeposits(sx,sy).find(x=>x.place.kind==="belt");
    if(d)at={sx,sy,d};
  }
  ok(!!at,"пояс с дальней залежью нашёлся");
  G.sx=at.sx;G.sy=at.sy;G.sys=getSystem(at.sx,at.sy);G.farTaken={};
  /* прибор честен: правда всегда внутри диапазона, у любого корпуса */
  for(const id of ["strizh","vyuk","topor"]){
    G.shipId=id;const R=farReading(at.d);
    ok(R.lo<=R.left&&R.left<=R.hi,id+": правда внутри «"+R.lo+"–"+R.hi+"» (есть "+R.left+")");
  }
  G.shipId="strizh";const a=farReading(at.d);G.shipId="vyuk";const b=farReading(at.d);
  ok(a.hi-a.lo<b.hi-b.lo,"изыскатель видит уже, чем рудовоз");
  /* пояс: часть камней — дальнего товара, и выемка убавляет залежь */
  const B=G.sys.belt,ast=[];for(let i=0;i<40;i++)ast.push({res:B.res[0],left:12});
  farBeltDress(ast,B);
  const fr=ast.filter(x=>x.res===at.d.k);
  ok(fr.length>0,"в поясе появились камни «"+RES[at.d.k].ru+"»");
  const left0=farLeft(G.sx,G.sy,at.d);
  G.cargo[at.d.k]=0;const got=addRes(at.d.k,3);farTake(at.d.k,got);
  eq(farLeft(G.sx,G.sy,at.d),left0-got,"взятое вычтено из залежи");
  /* ЖИЛА: первая выемка объявляет, строка на борту */
  const v={k:at.d.k,grade:3,units:900,place:at.d.place};
  const n0=G.log.length;farVein(v);
  ok(G.log.length>n0&&/ЖИЛА/.test(G.log[G.log.length-1].s),"жила записана на борту");
  G.cargo[at.d.k]=0;G.farTaken={};
}));
TEST_SUITES.push(()=>suite("дальние товары: цена по расстоянию и едок",()=>{
  resetWorld();
  near(farCurve(0,25),1.3,1e-9,"в сердце — 1.3 базы");
  near(farCurve(10,25),1,1e-9,"у края круга заселения — база");
  near(farCurve(40,25),.5,1e-9,"в своей полосе — половина");
  ok(farCurve(15,25)<1&&farCurve(15,25)>.5,"между — по прямой");
  /* сердце платит больше полосы — ценность делает обратная дорога */
  const home=getSystem(0,0);
  let far=null;for(let sx=30;sx<60&&!far;sx++){const s=getSystem(sx,3);if(s.station)far=s;}
  ok(!!(home.station&&far),"станции нашлись");
  G.market={};
  const pH=marketFor(home).osmium,pF=marketFor(far).osmium;
  ok(pH>pF*1.8,"осмий дома дороже, чем в глубине: "+pH+" против "+pF);
  /* и продаётся: трюм пустеет, деньги приходят */
  G.cargo.osmium=5;const c0=G.credits,rev=sellCargo(home,"osmium",5);
  ok(rev>0&&G.credits>c0&&G.cargo.osmium===0,"осмий сдан за "+rev);
  eq(farWorldFingerprint(),FAR_FP_BEFORE,"и старый мир после торговли всё тот же");
}));
