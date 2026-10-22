/* Лицо ушло из зала (M910c, DESIGN-game §7.3): кто выдал живую бумагу — сидит в кантине своей
   станции тем же лицом; срок вышел — его нет, место толпы пустует, бармен говорит, что он не
   заходит; диспетчер участка (длинный наряд) не уходит; через HGONE_DAYS зал снова полон. */
TEST_SUITES.push(()=>suite("лицо ушло из зала: подвели — его нет, место пустует, бармен помнит",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;G.hallGone=null;
  const S=dispTestStations()[0],D=dispSt();
  dispTestDock(S);
  const crowd=()=>(gaugeSet(G.sys,{m:.9}),c3Layout(1280,720,[],[],null,true).people.filter(p=>p.kind==="crowd"||p.kind==="kino"));
  D.it=[];gaugeSet(G.sys,{m:.9});
  const n0=crowd().length;
  const A=dispIssue("task",S,{}),Lg=dispIssue("long",S,{});
  ok(A&&Lg,"бумаги выданы");
  const C1=crowd(),faces=C1.filter(p=>p.who);
  eq(C1.length,n0,"лицо бумаги садится на место толпы, толпа не растёт");
  eq(faces.map(p=>p.who).join(","),A.f.name,"в зале — тот, кто выдал бумагу (а не диспетчер участка)");
  eq(faces[0].m.seed,A.f.seed>>>0,"тем же лицом, что на бумаге");
  ok(!/Больше не заходит/.test(cantKeeperLine()),"пока бумага жива, бармен о нём молчит");
  /* срок вышел */
  A.due=now()-1;Lg.due=now()-1;dispTick();
  gaugeSet(G.sys,{m:.9});   /* шкала людей падает от срыва — толпу меряем при той же шкале */
  ok(D.it.indexOf(A)<0,"бумага ушла");
  const L=G.hallGone[S.key]||[];
  eq(L.map(g=>g.name).join(","),A.f.name,"станция помнит ушедшего, диспетчера участка — нет");
  const C2=crowd();
  ok(!C2.some(p=>p.who===A.f.name||p.m.seed===(A.f.seed>>>0)),"его нет в зале");
  eq(C2.length,n0-1,"его место пустует");
  const line=cantKeeperLine();
  ok(line.indexOf(A.f.name+"? Больше не заходит.")===0,"бармен: "+line);
  ok(/на$/.test(A.f.name)?/Ждала/.test(line):/Ждал /.test(line),"род по отчеству: "+line);
  /* сказанное только что — главнее */
  cantBubble={t:now(),line:"Слух."};
  eq(cantKeeperLine(),"Слух.","свежее слово бармена не перебивается");
  cantBubble=null;
  /* второй раз тот же не записывается */
  hgoneNote(A);eq(G.hallGone[S.key].length,1,"один человек — одна запись");
  /* время лечит */
  G.hallGone[S.key][0].d-=HGONE_DAYS;
  eq(crowd().length,n0,"через "+HGONE_DAYS+" суток место снова занято");
  ok(!/Больше не заходит/.test(cantKeeperLine()),"и бармен о нём больше не говорит");
  /* другая станция его не знает */
  G.hallGone[S.key][0].d+=HGONE_DAYS;
  const T=dispTestStations().find(x=>x.key!==S.key);
  if(G.mode==="dock")closeStation();
  dispTestDock(T);
  eq(hgoneGone(T.key).length,0,"на другой станции ушедших нет");
  if(G.mode==="dock")closeStation();
}));
TEST_SUITES.push(()=>suite("лицо ушло из зала: память переживает запись, битое отброшено",()=>{
  resetWorld();
  G.hallGone={"1,2":[{seed:5,name:"Анна Тихоновна",d:3}]};
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.hallGone=null;ok(applySave(s),"запись читается");
  eq(JSON.stringify(G.hallGone),JSON.stringify({"1,2":[{seed:5,name:"Анна Тихоновна",d:3}]}),"память на месте");
  const o=JSON.parse(JSON.stringify(s));delete o.hallGone;
  ok(applySave(o)&&G.hallGone===null,"запись до M910c — пусто");
  const b=JSON.parse(JSON.stringify(s));
  b.hallGone={"1,2":[{seed:"x",name:"А",d:1},{seed:7,name:"Б",d:2},1,{seed:8,name:"В",d:3},{seed:9,name:"Г",d:4},{seed:10,name:"Д",d:5}],"3,4":"x"};
  ok(applySave(b),"битая запись читается");
  eq(JSON.stringify(G.hallGone),JSON.stringify({"1,2":[{seed:8,name:"В",d:3},{seed:9,name:"Г",d:4},{seed:10,name:"Д",d:5}]}),"битое отброшено, хранится последние "+HGONE_KEEP);
}));
