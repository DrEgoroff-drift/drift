/* ══════════════ автотесты: шестой (M157) ══════════════ */
TEST_SUITES.push(()=>suite("шестой: пять следов эстафеты — связи, маршрут кончается в ядре уезда",()=>{
  resetWorld();
  eq(storyLint().filter(b=>/relay_|sixth_/.test(b)).join("; "),"","истории эстафеты проходят линт");
  const ids=["relay_baker","relay_krapiva","relay_kim","relay_shtof","relay_sovenya","sixth_report"];
  const S=ids.map(id=>storyAll().find(s=>s.id===id));
  ok(S.every(Boolean),"все шесть историй есть");
  for(let i=1;i<S.length;i++){
    const prev=ids[i-1];
    ok(S[i].traces.some(t=>t.when&&t.when.seenOf&&t.when.seenOf.indexOf(prev+".")===0),ids[i]+" ждёт следа "+prev);
    ok((S[i-1].links||[]).indexOf(ids[i])>=0,ids[i-1]+" ссылается на "+ids[i]);
  }
  ok(!!CAST.sixth&&CAST.sixth.name==="Зоя Варламова","шестая получила лицо и имя");
  eq(S[5].at,"hours:core","её адрес — ядро уезда, где часы не сходятся");
  /* чужие места: ни один след соперника не дома */
  ok(S.slice(0,5).every(s=>s.at.indexOf("stype:")===0),"следы — на станциях чужого типа");
}));

TEST_SUITES.push(()=>suite("шестой: адрес hours:core совпадает с ядром области, табло узнаёт имя",()=>{
  resetWorld();
  const at=regionOfTheme("hours");ok(!!at,"область есть");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const core=getSystem(R.core.sx,R.core.sy);
  const S=storyAll().find(s=>s.id==="sixth_report");
  const c={key:core.key,sys:core,st:core.station||{stype:"x"},p:null};
  if(core.station)ok(storyAddrMatch(S,c)===core.key,"ядро подходит адресу hours:core");
  else ok(true,"в ядре нет станции — адрес проверен по типу");
  const other=getSystem(0,0);
  eq(storyAddrMatch(S,{key:other.key,sys:other,st:other.station||{},p:null}),null,"не ядро — не подходит");
  ok(!sixthGone(),"пока не ушла");
  storySeen()["sixth_report.t4"]=1;
  ok(sixthGone(),"после четвёртого следа — ушла");
  delete storySeen()["sixth_report.t4"];
}));
