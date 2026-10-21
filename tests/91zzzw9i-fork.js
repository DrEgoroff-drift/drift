/* Развилки (M911, DESIGN-game §7.2, §7.4): у каждого дела две стороны — сам или рукой; рука
   берёт 85 % минус груз и оклад, 3 % катастрофы, книжка помнит; найденная засечка всегда даёт
   строку доступа; Клинок — один раз: строка Рыбы, мир за баком, дошли — дверь части VII,
   пустой бак — трос Рыбы вместо «Стрижа». */
function fkHand(seed){
  const c=genMerc(seed>>>0,null);c.seed=seed>>>0;c.order=null;c.state=null;c.gone=false;
  G.owned.klinok=true;c.shipId="klinok";G.crew.push(c);return c;
}
function fkAll(S){
  const out=[];
  for(const v of Object.keys(DISP_V)){
    const D=dispSt();D.it=[];D.vb=[];
    const it=dispIssue(DISP_V[v].kind,S,{},v);if(it)out.push(it);
  }
  dispSt().it=[];
  return out;
}
TEST_SUITES.push(()=>suite("развилки: у каждого дела две стороны — сам или рукой",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  const L=fkAll(S);
  ok(L.length>=Object.keys(DISP_V).length-3,"выдано глаголов: "+L.length+" из "+Object.keys(DISP_V).length);
  G.crew=[];
  const none=L.map(forkSides);
  ok(none.every(F=>F.self&&!F.hand&&F.why==="свободных рук нет"),"без наёмников: сам — да, рукой — «свободных рук нет»");
  const c=fkHand(0xF0A1);
  const bad=[];
  for(const it of L){const F=forkSides(it);if(!F.self||!(F.hand||F.why))bad.push(it.v);if(F.hand&&F.pay>Math.round(it.pay*FORK_SHARE))bad.push(it.v+": рука дороже 85 %");}
  eq(bad.join(", "),"","у каждого глагола обе стороны");
  ok(L.some(it=>forkSides(it).hand===c),"свободная рука идёт на дело");
  const urg=L.find(x=>x.kind==="urg");
  if(urg){urg.due=now()+60000;eq(forkSides(urg).why,"рука не успеет","срочное, которое рука не успеет, — сторона названа словами");}
  c.order={kind:"trade",sx:0,sy:0};
  ok(!forkSides(L[0]).hand,"наёмник в рейсе — не свободная рука");
}));
TEST_SUITES.push(()=>suite("развилки: рука идёт — 85 % минус груз и оклад, книжка помнит, 3 % катастрофы",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  G.crew=[];
  /* семя, на котором рука доходит, и семя катастрофы — по тому же броску, что и в игре */
  const D=dispSt();D.it=[];
  const it=dispIssue("haul",S,{});
  let okSeed=0,catSeed=0;
  for(let s=1;s<5000&&(!okSeed||!catSeed);s++){const x=rng(hashi(it.id|0,s>>>0,0x5E4D))();if(x<FORK_CAT){if(!catSeed)catSeed=s;}else if(!okSeed)okSeed=s;}
  let cat=0;for(let s=1;s<=4000;s++)if(rng(hashi(7,s,0x5E4D))()<FORK_CAT)cat++;
  ok(cat>=4000*.02&&cat<=4000*.045,"катастроф на 4000 рук: "+cat+" (≈3 %)");
  const c=fkHand(okSeed);G.credits=5000;
  const F=forkSides(it),cr0=G.credits,rec0=recordAll().e.length,pay=it.pay,goods=forkGoods(it);
  ok(forkSend(it.id),"рука отправлена");
  ok(!D.it.some(x=>x.id===it.id),"бумага ушла с полосы");
  ok(!forkSides(dispIssue("task",S,{})).hand,"рука в деле — второй раз её не отправить");
  clockAdvance(F.mins*60000-1000);mgrTick();
  eq(forkSt().sent.length,1,"до срока рука в пути");
  clockAdvance(2000);mgrTick();
  eq(forkSt().sent.length,0,"рука вернулась");
  const got=G.credits-cr0;
  ok(got<=Math.round(pay*FORK_SHARE-goods)&&got<pay-goods,"рука принесла "+got+" кр: меньше, чем дело само ("+(pay-goods)+"), и не больше 85 % минус груз");
  ok((c.spent|0)>0,"оклад за дорогу списан: "+(c.spent|0)+" кр");
  const R=recordAll().e.slice(rec0).find(e=>e.a===it.f.name);
  ok(R&&/сами не пришли/.test(R.s),"книжка помнит: "+(R?R.a+": "+R.s:"—"));
  eq(forkSt().cold[it.f.name],1,"лицо помнит, что вы не пришли");
  /* катастрофа: заложник, выкуп — настоящий */
  const it2=dispIssue("haul",S,{});it2.id=it.id;
  c.order={kind:"trade",sx:0,sy:0};   /* первая рука ушла в рейс — свободна только вторая */
  const h=fkHand(catSeed);
  ok(forkSend(it2.id)&&forkSt().sent[0].seed===h.seed,"вторая рука отправлена");
  clockAdvance(FORK_MIN*60000*10);mgrTick();
  ok(h.state==="hostage"&&h.ransom>0,h.name+": 3 % — заложник, выкуп "+h.ransom);
  G.credits+=h.ransom;
  ok(ransomPay(h)&&doorDone("ransom",0),"выкуп руки — дело, дверь части III");
}));
TEST_SUITES.push(()=>suite("развилки: найденная засечка всегда даёт строку доступа; своя — посёлку",()=>{
  resetWorld();
  const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;
  const miss=[];let n=0;
  for(let i=0;i<24;i++){
    const q={k:"obelisk",ru:"ЗАРУБКА",x:6000,y:0,h:150,sc:1,seed:(0xA0B0+i*977)>>>0};
    const h0=forkHave(),r=plnActDo(q,"read",{d:.3});
    if(!r)continue;n++;
    if(!r.access||!forkHave().some((x,j)=>x>h0[j]))miss.push(i+": "+r.msg);
  }
  ok(n>=20,"прочитано засечек: "+n);
  eq(miss.join(" | "),"","каждая прочитанная засечка прибавила адрес, цену или слово");
  ok(doorDone("notch",0),"найденная засечка — дело notch (дверь части VI)");
  const S=nearestStation(G.sx,G.sy),m0=gaugeOf(S).m;
  const q={k:"obelisk",ru:"ЗАРУБКА",x:6000,y:0,h:150,sc:1,seed:0xC0DE};
  ok(plnActDo(q,"carve",{d:.3}),"своя засечка");
  ok(gaugeOf(S).m>m0,"ближайшая станция помнит: люди "+m0+" → "+gaugeOf(S).m);
  PLN.on=pOn;PLN.bad=pBad;
}));
TEST_SUITES.push(()=>suite("Клинок: строка Рыбы, мир за баком, дверь части VII, трос один раз",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;G.mode="system";
  bladeTick();
  ok(!G.blade,"до части VI Клинка нет");
  G.smena=[];for(let i=1;i<=46;i++)G.smena.push(i);
  const n0=G.log.length;
  const B=bladeTick();
  ok(B&&B.st===1,"часть VI: Гуся сел — "+(B?B.nm+" ("+B.sx+":"+B.sy+")":"—"));
  const said=G.log.slice(n0).find(x=>/Рыба/.test(x.s));
  ok(said&&said.s.indexOf(B.nm)>=0,"одна строка Рыбы в эфире: "+(said?said.s:"—"));
  const S=getSystem(B.sx,B.sy),st=stat(),d=Math.hypot(B.sx-G.sx,B.sy-G.sy),c=bladeCost(d);
  ok(!S.station&&dispLandable(S),"мир без станции, на него можно сесть");
  ok(c<=st.fuelMax&&c*2>st.fuelMax,"туда хватит полного бака ("+c+" из "+st.fuelMax+", прыжков "+Math.ceil(d/(st.jump+.02))+"), обратно — нет");
  ok(!bladeTick()||G.blade===B,"Клинок один раз за игру");
  eq(dispSt().it.filter(x=>/Гуся/.test(x.txt)).length,0,"ни бумаги, ни пункта");
  /* дошли */
  G.fuel=st.fuelMax-c;   /* дорога прыжками — цена пути; последний прыжок — настоящий */
  G.sel={x:B.sx,y:B.sy};jump(0);
  eq(G.blade.st,2,"дошли — Клинок взят");
  ok(doorDone("blade",0),"дело blade записано");
  G.smena=[];for(let i=1;i<=54;i++)G.smena.push(i);doorSt().at[54]=0;
  ok(doorOpen(55),"дверь части VII открыта Клинком");
  /* пустой бак у Гуси: Рыба вместо буксира, метро и сброса */
  G.fuel=0;
  const O=rescueOffers().map(x=>x.id);
  ok(O.indexOf("ryba")>=0&&O.indexOf("reset")<0&&O.indexOf("tow")<0,"пустой бак: «РЫБА», без «Стрижа» по разнарядке: "+O.join(","));
  ok(rescueTake("ryba")&&G.haul&&G.blade.st===3,"Рыба берёт на трос");
  G.haul=null;G.fuel=0;
  ok(rescueOffers().every(x=>x.id!=="ryba"),"второй раз Рыбы нет — трос был один");
}));
TEST_SUITES.push(()=>suite("развилки: запись — рука в пути, книжка лиц, Клинок переживают сохранение",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  G.crew=[];const c=fkHand(0xBEE5);
  dispSt().it=[];const it=dispIssue("haul",S,{});
  ok(forkSend(it.id),"рука отправлена");
  forkSt().cold["Лидия Карповна"]=2;
  G.blade={st:2,sx:3,sy:-1,nm:"Тест",at:now(),tow:0,got:now()};
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.fork=null;G.blade=null;
  ok(applySave(s),"запись читается");
  eq(forkSt().sent.length,1,"рука в пути — на месте");
  eq(forkSt().sent[0].seed,c.seed,"та же рука");
  eq(forkSt().cold["Лидия Карповна"],2,"книжка лиц на месте");
  ok(G.blade&&G.blade.st===2&&G.blade.sx===3,"Клинок на месте");
  const o=JSON.parse(JSON.stringify(s));delete o.fork;delete o.blade;
  ok(applySave(o)&&forkSt().sent.length===0&&!G.blade,"запись до M911: пусто, без падения");
  const b=JSON.parse(JSON.stringify(s));b.fork={sent:[{it:null},{it:{legs:[]},back:"x"}],cold:"?"};b.blade={st:9};
  ok(applySave(b)&&forkSt().sent.length===0&&!G.blade,"битая запись — пусто");
}));
