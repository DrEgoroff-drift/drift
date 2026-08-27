/* ══════════════ M225: поздний час у стойки ══════════════
   Проверяется устройство дуги, а не строки: выбор всегда добровольный и всегда
   что-то покупает; платится настоящим временем, которое старит окна
   возможностей; никто не упрекает; стойка пустеет к концу смены. */
TEST_SUITES.push(()=>suite("поздний час: посидел — получил, а часы ушли по-настоящему",()=>{
  resetWorld();
  G.st=G.sys.station;
  G.late=null;
  eq(lateLeft(),LATE_CAP,"смена начинается с полной стойки");
  const t0=G.t;
  const got=lateSit();
  ok(!!got,"посидел — что-то получил: "+got.kind);
  ok(G.t>t0,"и часы ушли по-настоящему: +"+Math.round(G.t-t0)+" кадров");
  ok(G.t-t0>=LATE_SIT,"не меньше честного часа");
  ok(got.line&&got.line.length>10,"взамен — строка с содержанием");
  eq(lateLeft(),LATE_CAP-1,"налито учтено");
  /* цена настоящая: окно возможности стареет от просиженного */
  G.offers=[];
  const o=offerAdd("run","st:"+G.sys.key,false);
  const left0=o.ttl-(G.t-o.t0);
  lateSit();
  const left1=o.ttl-(G.t-o.t0);
  ok(left1<left0,"окно возможности сузилось молча: "+Math.round(left0)+" → "+Math.round(left1));
  /* и никто не упрекает: в журнале нет ни слова про упущенное */
  ok(!G.log.some(e=>/упуст|опозда|зря|потерял/i.test(e.text||"")),"ни одного упрёка в журнале");
}));

TEST_SUITES.push(()=>suite("поздний час: стойка пустеет, а сейв её не наполняет",()=>{
  resetWorld();
  G.st=G.sys.station;
  G.late=null;
  let n=0;
  while(lateLeft()>0&&n<10){lateSit();n++;}
  eq(n,LATE_CAP,"за смену наливают ровно "+LATE_CAP+" раза");
  eq(lateSit(),null,"дальше — тишина, и это единственная форма отказа");
  /* сейв не обнуляет счётчик: перезаход — не способ налить ещё */
  const snap=snapshot();
  applySave(snap);
  G.st=G.sys.station;
  eq(lateLeft(),0,"после загрузки стойка так же пуста");
  /* новая смена — стойка живёт снова */
  G.t+=OFFER_SHIFT;
  ok(lateLeft()>0,"следующая смена наливает опять");
}));

/* ── M226: доброе слово после просёра ── */
TEST_SUITES.push(()=>suite("просёр именного: дверь закрывается, а человек добр",()=>{
  resetWorld();
  G.st=G.sys.station;G.offers=[];G.folk={};G.speech={};
  const who="st:"+G.sys.key;
  const o=offerAdd("run",who,true);
  ok(o.named===1,"предложение именное");
  /* не взял; окно вышло */
  G.t+=o.ttl+1;
  offerTick();
  const f=folkAll()[who];
  eq(f.good,0,"дверь закрыта");
  eq(f.shut,1,"и это записано");
  ok(!G.log.some(e=>/упуст|подвёл|долж/i.test(e.text||"")),"в журнале ни слова упрёка");
  /* следующая посадка: одно доброе слово, вне очереди */
  const sp=speechHere();
  ok(!!sp&&!!sp.line,"у стойки говорят");
  ok(SHUT_LINES.indexOf(sp.line)>=0,"и это то самое доброе слово: "+sp.line);
  ok(!/имя|назв|окно|долг|упуст/i.test(sp.line),"правда не произносится");
  const sp2=speechHere();
  eq(sp2.line,sp.line,"строка стоит всю посадку");
  /* новая посадка — очередь как шла, слово не повторяется */
  G.visits=G.visits||{};G.visits[G.sys.key]=(G.visits[G.sys.key]|0)+1;
  const S=speechAll()[G.sys.key];if(S)S.v=-1;
  const sp3=speechHere();
  ok(SHUT_LINES.indexOf(sp3.line)<0,"доброе слово было одно");
  eq(f.said,1,"и дверь своё отговорила");
  /* мир продолжает предлагать: вселенная прощает, люди помнят */
  const f2=folkOf(who);
  const o2=offerAdd("haul",who,true);
  eq(o2.named,0,"именных больше не будет: этот человек не называет");
  ok(!!o2,"а холодные идут как шли");
  void f2;
}));
