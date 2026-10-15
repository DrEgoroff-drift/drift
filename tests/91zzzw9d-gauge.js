/* Шкалы станции и каскад (M906, DESIGN-game §4.2, §7.1, 28l-gauge): нужда, которую не закрыли
   ни вы, ни баржи, бьёт по складу и людям; пустой склад останавливает цех, и сделанное здесь
   становится нуждой у соседей в тот же такт. Ваш привоз поднимает склад и людей. Толпа в зале
   идёт за людьми; хмурая станция скупает дешевле и не называет; порядок падает от занятости. */
function gaugeTestStation(){
  for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++){
    if(!starAt(x,y))continue;const S=getSystem(x,y);
    if(!S||!S.station||!S.station.prices)continue;
    for(let w=1;w<400;w++)if(watchNeedAt(S,w)&&!watchNpc(S,w))return {S,w};
  }
  return null;
}
function gaugeTestWin(w){G.t=w*NEED_WIN*CEL_DAY;}
TEST_SUITES.push(()=>suite("шкалы станции: несделанная нужда — нужда у соседа за одно окно",()=>{
  resetWorld();
  const F=gaugeTestStation();
  ok(!!F,"станция с несделанной нуждой найдена: «"+(F&&F.S.station.name)+"» окно "+(F&&F.w));
  const S=F.S,w=F.w;
  G.sx=S.sx;G.sy=S.sy;
  gaugeTestWin(w);GAUGE_W=null;gaugeTick();
  gaugeSet(S,{s:.3,m:.6,o:.6});
  gaugeTestWin(w+1);
  const res=gaugeTick()||[];
  const me=res.find(x=>x.key===S.key);
  const g=gaugeOf(S);
  ok(!!me&&Math.abs(g.s-.1)<.011&&Math.abs(g.m-.5)<.011,"окно кончилось: склад "+g.s.toFixed(2)+", люди "+g.m.toFixed(2));
  const k=gaugeMade(S);
  ok(!!(me&&me.stop)&&gaugeStopped(S,k),"склад ниже четверти — цех встал: "+k);
  G.credits=1e5;
  ok(buyCargo(S,k,5)===0&&coopBuy(S,k,5)===0,"сделанного здесь не купить");
  const nbs=Object.keys(G.casc.n).filter(q=>G.casc.n[q].f===S.key);
  ok(nbs.length>=1&&nbs.length<=CASC_N,"нужда у соседей: "+nbs.join(" · "));
  const xy=gaugeKeyXY(nbs[0]),N=getSystem(xy[0],xy[1]);
  const own=needAll()[N.key];
  const NN=needOf(N);   /* каскадная идёт первой, своя соседа молчит */
  ok(!!NN&&NN.k===k&&NN.casc===S.key&&/встал цех/.test(NN.why),"у «"+N.station.name+"» нужда: "+(NN&&NN.ru)+" · "+(NN&&NN.why));
  const before=marketFor(N)[k];
  ok(before>=Math.round(N.station.prices[k]*1.5),"цена нужды у соседа поднята: "+before+" при прейскуранте "+N.station.prices[k]);
  const g0=gaugeOf(N);
  ok(!watchNeedAt(N,needWin()),"своя нужда соседа на это время не судится");
  ok(needClose(N,k)&&G.casc.n[N.key].d===1&&!(needOf(N)&&needOf(N).casc)&&needAll()[N.key]===own,"привезли — каскадная снята, своя нужда окна не тронута");
  const g1=gaugeOf(N);
  ok(Math.abs(g1.s-Math.min(1,g0.s+.3))<.011&&Math.abs(g1.m-Math.min(1,g0.m+.05))<.011,"склад "+g0.s.toFixed(2)+" → "+g1.s.toFixed(2)+", люди "+g0.m.toFixed(2)+" → "+g1.m.toFixed(2));
  /* цех встаёт снова только по прошествии часа */
  clockAdvance(CASC_MS+1000);
  const NN2=needOf(N);
  ok(!gaugeStopped(S,k)&&!(NN2&&NN2.casc===S.key),"через час цех снова работает");
  /* к середине — само: через два часа отклонение в e раз меньше */
  const d0=gaugeOf(S).m-GAUGE_MID;clockAdvance(GAUGE_TAU);
  const d1=gaugeOf(S).m-GAUGE_MID;
  ok(Math.abs(d1-d0/Math.E)<.012,"люди тянутся к середине: "+d0.toFixed(3)+" → "+d1.toFixed(3));
  resetWorld();
}));
TEST_SUITES.push(()=>suite("шкалы станции: закрытая вами и баржами нужда не бьёт; запись хранит",()=>{
  resetWorld();
  const F=gaugeTestStation();
  const S=F.S,w=F.w,k=watchNeedAt(S,w);
  G.sx=S.sx;G.sy=S.sy;
  gaugeTestWin(w);GAUGE_W=null;gaugeTick();
  ok(needOf(S)&&needOf(S).k===k&&needClose(S,k),"нужду «"+S.station.name+"» закрыли: "+k);
  const a=gaugeOf(S);
  gaugeTestWin(w+1);gaugeTick();
  const b=gaugeOf(S);
  ok(Math.abs(a.s-b.s)<.011&&Math.abs(a.m-b.m)<.011&&a.s>GAUGE_MID,"окно прошло без удара: склад "+b.s.toFixed(2));
  /* нужда, которую закрыли баржи */
  let wb=0;for(let v=w+2;v<w+400;v++)if(watchNeedAt(S,v)&&watchNpc(S,v)){wb=v;break;}
  ok(wb>0,"окно с баржами: "+wb);
  gaugeTestWin(wb);gaugeTick();const c=gaugeOf(S);
  gaugeTestWin(wb+1);gaugeTick();const d=gaugeOf(S);
  ok(Math.abs(c.s-d.s)<.011,"баржи привезли — склад не тронут: "+d.s.toFixed(2));
  /* запись */
  gaugeSet(S,{s:.15,m:.2,o:.3});
  gaugeStop(S);
  const snap=JSON.parse(JSON.stringify(snapshot()));
  G.gauge={};G.casc=null;applySave(snap);
  const e=gaugeOf(S);
  ok(Math.abs(e.m-.2)<.011&&gaugeStopped(S,gaugeMade(S))&&Object.keys(G.casc.n).length>0,"после записи: люди "+e.m.toFixed(2)+", цех стоит, нужды у соседей "+Object.keys(G.casc.n).length);
  resetWorld();
}));
TEST_SUITES.push(()=>suite("шкалы станции: толпа — это люди; хмурые скупают дешевле; порядок — от пиратов",()=>{
  resetWorld();
  const S=G.sys,base=C3_CROWD.trade;
  const n=m=>{gaugeSet(S,{m});return gaugeCrowd(base).length;};
  const a=n(.6),b=n(.9),c=n(.3),d=n(.45);
  ok(a===base.length&&b===9&&c===1&&d>c&&d<a,"толпа у торгового узла: .6 → "+a+", .9 → "+b+", .3 → "+c+", .45 → "+d);
  gaugeSet(S,{m:.9});
  const L=c3Layout(1280,720,[],[],null).people.filter(p=>p.kind==="crowd").length;
  gaugeSet(S,{m:.3});
  const L1=c3Layout(1280,720,[],[],null).people.filter(p=>p.kind==="crowd").length;
  ok(L>L1&&L1===1,"кантина: весёлых "+L+", хмурых "+L1);
  const H=m=>{gaugeSet(S,{m});return hallLayout(S.station.stype||"trade").people.filter(p=>p.kind==="crowd").length;};
  const h9=H(.9),h6=H(.6),h3=H(.3);
  ok(h9>=h6&&h6>h3&&h3===1,"ходячий зал: .9 → "+h9+", .6 → "+h6+", .3 → "+h3);
  /* хмурые: скупщик на 8 % ниже, взять — как было */
  gaugeSet(S,{m:.6});
  const k=ORE_KEYS.filter(q=>S.station.prices[q]).sort((a,b)=>S.station.prices[b]-S.station.prices[a])[0];   /* дорогой: округление не шумит */
  const p0=marketFor(S)[k],q0=buyPriceFor(S,k);
  gaugeSet(S,{m:.3});
  const p1=marketFor(S)[k],q1=buyPriceFor(S,k);
  ok(Math.abs(p1/p0-GAUGE_SOUR_MUL)<.03&&Math.abs(q1/q0-1)<.02,"хмурые: сдать "+p0+" → "+p1+", взять "+q0+" → "+q1);
  const f=folkOf("st:"+S.key);f.good=1;f.warm=1;
  const o=offerAdd("run","st:"+S.key,true);
  ok(o&&!o.named&&f.warm===1,"хмурая станция не называет, тёплое слово ждёт");
  gaugeSet(S,{m:.6});
  const o2=offerAdd("run","st:"+S.key,true);
  ok(o2&&o2.named===1,"оттаяли — называют снова");
  /* порядок: заняли — минус, отбили — плюс; при плохом порядке пираты смелее */
  gaugeSet(S,{o:.6});
  occSet(S.sx,S.sy,1);
  const o1=gaugeOf(S).o;
  ok(Math.abs(o1-.3)<.011&&gaugeSpread(S.sx,S.sy)===1.5,"заняли: порядок "+o1.toFixed(2)+", пираты смелее ×"+gaugeSpread(S.sx,S.sy));
  ok(gaugeRows().some(r=>/^Отбить/.test(r[0])),"на доске: «Отбить»");
  occSet(S.sx,S.sy,0);
  const o3=gaugeOf(S).o;
  ok(o3>=.79&&gaugeSpread(S.sx,S.sy)===1,"отбили: порядок "+o3.toFixed(2));
  resetWorld();
}));
