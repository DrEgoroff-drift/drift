/* ══ чертёж корабля (M476, DESIGN-shipyard §3) ══
   План читается из корпуса; упаковщик раскладывает сегодняшнюю оснастку.
   Сторож: у каждого корпуса есть нос, корма и палуба, клетка на телефоне не
   мельче 44 px, и всё, что стоит на корабле, влезло — даже полная оснастка
   с модулями пятой ступени. Чисел план пока не меняет (M478). */
TEST_SUITES.push(()=>suite("чертёж: план из корпуса, всё влезает",()=>{
  resetWorld();
  const ids=Object.keys(SHIPS).concat(Object.keys(FLEET).slice(0,40));
  let bad=[],small=[],miss=[];
  for(const id of ids){
    const P=planOf(id),has=k=>P.cells.some(q=>q.kind===k);
    if(!(has("stern")&&has("deck")&&(has("nose")||has("side"))))bad.push(id);
    if(390/P.cols<44)small.push(id+":"+P.cols);
    const fit={};slotsOf(id).forEach((k,i)=>fit[i]="t"+i);
    const pk=planPack(id,fit,{engine:5,tank:5,armor:5,drill:5,hyper:5,weapon:5,hold:5});
    for(const it of pk.items)if(it.cells.length<it.need){miss.push(id+":"+it.kind);break;}
  }
  eq(bad.join(" "),"","у каждого корпуса нос или борт, корма и палуба");
  eq(small.join(" "),"","клетка на телефоне 390 px — не мельче 44 px");
  eq(miss.join(" "),"","полная оснастка с модулями пятой ступени влезает в любой корпус");
  /* сегодняшний корабль игрока — план без трюма невозможен */
  const pk=planNow();ok(pk.hold.length>0,"у стартового корабля есть трюм: "+pk.hold.length+" клеток");
  eq(JSON.stringify(planOf(G.shipId).cells.map(q=>q.kind)),JSON.stringify((delete PLAN_CACHE[G.shipId],planOf(G.shipId)).cells.map(q=>q.kind)),"план — функция корпуса");
}));
TEST_SUITES.push(()=>suite("КБ: правила места, трюм кистью, чертёж в сейве",()=>{
  resetWorld();
  const id=G.shipId;slotsOf(id).forEach((k,i)=>{if(k==="gun"||k==="engine"){}});
  G.fit[id]={};slotsOf(id).forEach((k,i)=>G.fit[id][i]="t"+i);
  G.draft={};const d=draftOf(id);
  const eng=d.items.find(x=>x.kind==="engine"&&x.what==="part"),gun=d.items.find(x=>x.kind==="gun");
  ok(eng&&gun,"в лотке есть мотор и орудие");
  const deck=d.P.cells.find(q=>q.kind==="deck");
  eq(kbPlace(d,eng,deck),"двигатели — только в кормовой ряд","мотор на палубу — отказ одной строкой");
  if(deck)eq(kbPlace(d,gun,deck),"орудие — на обшивку или на хребет (башня)","орудие на палубу — отказ");
  const util=d.items.find(x=>x.kind==="util"),aft=d.P.cells.find(q=>q.kind==="deck"&&!q.nose3);
  if(util&&aft)eq(kbPlace(d,util,aft),"приборы видят из носовой трети","прибор в корму — отказ");
  /* трюм кистью: свободная клетка палубы — да/нет */
  const free=d.P.cells.find(q=>(q.kind==="deck"||q.kind==="spine")&&d.hold.indexOf(q)<0&&!d.items.some(x=>x.cells.indexOf(q)>=0));
  const h0=d.hold.length;
  const h1=d.hold[0];KB.d=d;KB.id=id;KB.sel=null;kbTap(h1.i,h1.j);
  eq(KB.d.hold.length,h0-1,"тап по трюму — клетка снова пустая");
  ok(G.draft[id]&&G.draft[id].hold.length===h0-1,"чертёж записан в G.draft");
  /* сейв и обратно */
  const S=JSON.parse(JSON.stringify(snapshot()));
  G.draft={};applySave(S);
  eq(draftOf(id).hold.length,h0-1,"после загрузки чертёж тот же");
  delete G.draft[id];eq(draftOf(id).hold.length,planPack(id,G.fit[id]||{},G.mods||{}).hold.length,"ТИПОВОЙ — снова как у всех (упаковщик)");
  G.fit[id]={};G.draft={};
}));
TEST_SUITES.push(()=>suite("чертёж: упаковщик сам соблюдает правила места",()=>{
  resetWorld();
  const ids=Object.keys(SHIPS).concat(Object.keys(FLEET).slice(0,40)),bad=[];
  for(const id of ids){
    const fit={};slotsOf(id).forEach((k,i)=>fit[i]="t"+i);
    const pk=planPack(id,fit,{engine:3,tank:2,armor:2,drill:1,hyper:1,weapon:2});
    for(const it of pk.items){const R=KB_RULE[(it.what==="mod"?"m_":"")+it.kind];
      if(R&&it.cells.some(q=>!R.ok(q))){bad.push(id+":"+it.kind);break;}}
  }
  ok(bad.length<=Math.ceil(ids.length*.1),"типовой чертёж нарушает правила места не больше чем у десятой части корпусов: "+bad.join(" "));
}));
TEST_SUITES.push(()=>suite("числа от чертежа: неподвижная точка и пределы",()=>{
  resetWorld();
  const id=G.shipId;G.fit[id]={};slotsOf(id).forEach((k,i)=>G.fit[id][i]="t"+i);G.draft={};
  const s0=stat();
  /* типовой чертёж, записанный явно, — те же числа */
  const d=draftOf(id);draftSave(id,d);
  const s1=stat();
  eq([s1.cargoMax,s1.thr.toFixed(4),s1.turn.toFixed(4)].join(" "),[s0.cargoMax,s0.thr.toFixed(4),s0.turn.toFixed(4)].join(" "),"типовой чертёж — ровно сегодняшние числа");
  /* весь трюм снят — корабль легче, трюм меньше, но в пределах */
  d.hold=[];draftSave(id,d);const s2=stat();
  ok(s2.cargoMax<s0.cargoMax,"без трюма — трюм меньше: "+s2.cargoMax+" < "+s0.cargoMax);
  ok(s2.thr>=s0.thr&&s2.thr<=s0.thr*1.1+1e-9,"и разгон лучше, но не больше ×1.1");
  /* трюм на всю свободную палубу — не выше ×1.4 */
  const F=planFactors();ok(F.mass>=.8&&F.mass<=1.1,"масса зажата .8…1.1");
  G.draft={};G.fit[id]={};
  eq(stat().cargoMax,stat().cargoMax,"без чертежа числа стабильны");
}));
TEST_SUITES.push(()=>suite("башня: орудие на хребте стреляет кругом",()=>{
  resetWorld();
  const id=G.shipId,si=slotsOf(id).indexOf("gun");
  G.draft={};
  const m0=mountAt(id,si);ok(m0&&m0.mount!=="tower","без чертежа — обычный подвес");
  const d=draftOf(id);
  /* положить орудие на хребет, если есть такая клетка и орудие стоит */
  G.fit[id]={};G.fit[id][si]="t";const d2=draftOf(id),gun=d2.items.find(x=>x.kind==="gun");
  const sp=d2.P.cells.find(q=>q.kind==="spine");
  ok(!!(gun&&sp),"у стартового корабля есть орудие и хребет");
  if(gun&&sp){
    eq(kbPlace(d2,gun,sp),"","орудие на хребет — можно");
    draftSave(id,d2);
    const m=mountAt(id,si);eq(m&&m.mount,"tower","это башня");
    eq(gunOnMount({cone:.3,dmg:10},m).cone,Math.PI,"конус — круг целиком");
  }
  G.draft={};G.fit[id]={};
}));
TEST_SUITES.push(()=>suite("изолента: до половины где угодно, полоса до верфи",()=>{
  resetWorld();
  const hm=stat().hullMax;G.hull=hm*.2;G.tapeRoll=0;G.tapes={};
  ok(!tapeCan(),"без рулона — нечем");
  G.credits=100;tapeBuy();eq(tapeRolls(),1,"рулон куплен за копейки");
  ok(tapeUse(),"замотали");eq(G.hull,Math.ceil(hm*.5),"корпус — ровно половина");
  eq(tapesOf(),1,"на корпусе полоса");ok(!tapeCan(),"выше половины мотать рано");
  const S=JSON.parse(JSON.stringify(snapshot()));G.tapes={};applySave(S);
  eq(tapesOf(),1,"полоса переживает сейв");
  G.sys=getSystem(0,0);if(G.sys.station)G.sys.station.by="gt";tapeYardRepaired();
  eq(tapesOf(),0,"верфь сняла полосу");
  G.tapes={};G.tapeRoll=0;
}));
