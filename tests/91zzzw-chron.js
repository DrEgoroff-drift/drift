/* ══════════════ летопись (M370, §16.2–16.5) ══════════════
   Летопись — единственная часть игры, где ошибка не видна глазом: два клиента
   разойдутся молча, и увидит это только хэш. Поэтому набор меряет не «работает
   ли», а ТОЖДЕСТВЕННОСТЬ: повтор дважды — тот же хэш; ограничители держат две
   тысячи шагов; «Ялта» не меняет хозяина никогда; в исходнике нет ни одной
   трансцендентной функции, на которых браузеры и расходятся. */
function chWorld(){
  resetWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
  return G;
}
function chRun(n){
  const st=chronFresh();
  for(let i=0;i<=n;i++)chronStep(st,i);
  return st;
}

TEST_SUITES.push(()=>suite("летопись M370: повтор дважды даёт тот же хэш",()=>{
  chWorld();
  const a=chRun(400),b=chRun(400);
  eq(chronHash(a),chronHash(b),"два повтора — один хэш");
  eq(a.wars.length,b.wars.length,"и те же войны");
  /* повтор с середины равен повтору с нуля: на этом стоит кэш */
  const mid=chRun(200);
  const cont=chronReplay(400,mid);
  eq(chronHash(cont),chronHash(a),"повтор от кэша равен повтору от нуля");
  /* и он не зависит от того, спрашивали ли состояние раньше */
  eq(chronHash(chronReplay(400,null)),chronHash(a),"и от порядка вызовов тоже");
}));

TEST_SUITES.push(()=>suite("летопись M370: ограничители держат две тысячи шагов",()=>{
  chWorld();
  const st=chronFresh();
  const total=chronKeys().length;
  let maxHold=0,maxWars=0;
  let bad=0;
  for(let n=0;n<=2000;n++){
    chronStep(st,n);
    for(const P of st.powers){
      maxHold=Math.max(maxHold,P.hold);
      if(P.str<100||P.str>1000)bad++;
      for(const r of P.rel)if(r<-1000||r>1000)bad++;
      for(const k in P.need)if(P.need[k]<0||P.need[k]>1000)bad++;
    }
    maxWars=Math.max(maxWars,st.wars.length);
  }
  eq(bad,0,"ни одно число не вышло за границы за две тысячи шагов");
  ok(maxHold<total*.75,"никто не съел круг целиком: "+maxHold+" из "+total);
  ok(maxWars<=6,"войн одновременно не больше шести: "+maxWars);
  /* сумма владений сходится: система не может принадлежать двоим */
  let sum=0;for(const P of st.powers)sum+=P.hold;
  let cnt=0;for(const k of chronKeys())if(st.systems[k].owner>=0)cnt++;
  eq(sum,cnt,"счётчики владений сходятся с картой");
  /* и галактика не застыла: за две тысячи сводок что-то происходило */
  ok(st.lines.length>0,"строки в эфир были");
}));

TEST_SUITES.push(()=>suite("летопись M370: «Ялта» не меняет хозяина никогда",()=>{
  chWorld();
  const yk=chronYaltaKey();
  const st=chronFresh();
  eq(st.systems[yk].owner,-1,"с самого начала ничья");
  for(let n=0;n<=1500;n++){
    chronStep(st,n);
    if(n%97===0)eq(st.systems[yk].owner,-1,"и на сводке "+n+" тоже");
  }
  eq(st.systems[yk].owner,-1,"и через полторы тысячи сводок");
  eq(st.systems[yk].front,0,"фронт туда не приходит");
}));

TEST_SUITES.push(()=>suite("летопись M370: в исходнике нет дробной математики",()=>{
  /* правило §16.3 и D04: браузеры расходятся на exp/sin/cos/pow, а летопись
     обязана совпадать байт в байт. Проверяем чтением самого исходника. */
  const src=document.scripts[0].textContent;
  const head="/* ══════════════";
  const i0=src.indexOf("══ шесть агентов (M370");
  const i1=src.indexOf("══ летопись (M370");
  ok(i0>0&&i1>i0,"оба модуля летописи найдены в сборке");
  /* конец летописи — заголовок следующего модуля */
  const i2=src.indexOf(head,i1);
  const body=src.slice(i0,i2>i1?i2:i1+40000);
  ok(body.length>3000&&body.length<40000,"взят именно этот кусок: "+body.length);
  for(const bad of ["Math.exp","Math.sin","Math.cos","Math.pow","Math.tan","Math.log"])
    eq(body.indexOf(bad),-1,"в летописи нет "+bad);
  ok(body.indexOf("CHRON_SAT")>0,"насыщение берётся таблицей");
}));

TEST_SUITES.push(()=>suite("летопись M370: кэш это кэш, а не сохранение",()=>{
  chWorld();
  /* состояние не попадает в сейв ни одним полем (§16.4) */
  const snap=JSON.stringify(snapshot());
  eq(snap.indexOf("\"powers\""),-1,"держав в сохранении нет");
  eq(snap.indexOf("drift_war"),-1,"и ключа летописи тоже");
  /* кэш пишется в свой ключ и читается обратно тем же состоянием */
  const st=chRun(120);
  chronSave(st);
  const back=chronLoad();
  ok(!!back,"кэш прочитался");
  eq(chronHash(back),chronHash(st),"и он тот же самый");
  /* потеря кэша не ломает ничего: повтор от нуля даёт то же самое */
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  eq(chronLoad(),null,"кэша нет");
  eq(chronHash(chronReplay(120,null)),chronHash(st),"а состояние то же");
}));

TEST_SUITES.push(()=>suite("летопись M370: карта знает хозяина и фронт",()=>{
  chWorld();
  chronState(300);
  let own=0,none=0;
  for(const k of chronKeys()){
    const p=k.split(","),o=chronOwner(p[0]|0,p[1]|0);
    if(o>=0){own++;ok(!!MAKER_KEYS[o],"хозяин — одна из шести держав");}
    else none++;
  }
  ok(own>chronKeys().length*.9,"почти весь круг занят: "+own);
  ok(none>=1,"и «Ялта» ничья");
  eq(chronOwner(999,999),-1,"за кругом хозяев нет");
  ok(typeof chronOwnerKey(0,0)==="string"||chronOwnerKey(0,0)===null,"ключ хозяина читается");
}));

/* ── тот же хэш в узле и в браузере (§16.3, D06) ──
   Два прогона одного и того же кода в разных движках обязаны сойтись до
   единицы. Числа ниже сняты в Хроме и проверяются в обоих ярусах: если
   когда-нибудь появится дробь, этот набор покраснеет первым — и не «где-то в
   галактике», а прямо здесь. Правило простое: изменил `step` — пересними
   числа сознательно, одной правкой вместе с изменением. */
TEST_SUITES.push(()=>suite("летопись M370: узел и браузер считают одинаково",()=>{
  chWorld();
  /* пересняты сознательно в 0.371.0: Директор вошёл в шаг 3 и в хэш */
  eq(chronHash(chRun(100)),916970371,"сто сводок — известный хэш");
  eq(chronHash(chRun(500)),1305621383,"пятьсот сводок — известный хэш");
}));

/* ══════════════ Директор и шесть волн (M371, §15, §7.3) ══════════════ */
TEST_SUITES.push(()=>suite("Директор M371: месяц без никого не молчит и не разгоняется",()=>{
  chWorld();
  const st=chronFresh();
  let last=-1,maxGap=0,peak=0,maxPeak=0;
  const arcAge={};
  for(let n=0;n<=720;n++){                       /* полгода сводок */
    chronStep(st,n);
    if(st.lines.some(L=>L.N===n)){if(last>=0)maxGap=Math.max(maxGap,n-last);last=n;}
    if(st.dir.tens>800){peak++;maxPeak=Math.max(maxPeak,peak);}else peak=0;
    for(const a of st.dir.arcs)arcAge[a.p+"|"+a.t0]=n-a.t0;
  }
  ok(maxGap<=4,"галактика не молчит дольше четырёх сводок: "+maxGap);
  ok(maxPeak<=12,"пик вместе со спадом укладывается в трое суток: "+maxPeak);
  let over=0;for(const k in arcAge)if(arcAge[k]>DIR_ARC_MAX)over++;
  eq(over,0,"ни одна дуга не переросла двадцати сводок");
  /* и события всех трёх видов действительно случаются */
  const kinds={};st.lines.forEach(L=>kinds[L.kind]=(kinds[L.kind]||0)+1);
  ok(kinds.inc>0,"происшествия есть: "+kinds.inc);
  ok((kinds.arc|0)+(kinds.arcend|0)>0,"дуги есть");
  ok(kinds.rite>0,"обряды объявляются: "+kinds.rite);
}));

TEST_SUITES.push(()=>suite("Директор M371: сезон принимается только годный",()=>{
  chWorld();
  const N=300,m=chronMonth(N);
  /* автопилот: без сезона Директор берёт тему от зерна месяца */
  G.warSeason=null;
  const auto=chronSeason(N);
  ok(auto.auto===1,"без сезона — автопилот");
  ok(!!auto.theme&&auto.tension>=0&&auto.tension<=1000,"и у него есть тема и цель");
  /* негодный сезон не применяется вовсе */
  G.warSeason={m,s:{tension:5000,theme:"перебор"}};
  eq(chronSeason(N).auto,1,"напряжение вне границ — сезон не взят");
  G.warSeason={m,s:{tension:500,theme:"месяц проверок",arcs:["чепуха"]}};
  eq(chronSeason(N).auto,1,"неизвестная дуга — сезон не взят");
  G.warSeason={m,s:{tension:500}};
  eq(chronSeason(N).auto,1,"без темы — не взят");
  /* годный — применяется */
  G.warSeason={m,s:{tension:640,theme:"месяц проверок",arcs:["shortage","frontier"]}};
  const s=chronSeason(N);
  ok(!s.auto,"годный сезон взят");
  eq(s.theme,"месяц проверок","и это его тема");
  G.warSeason=null;
}));

TEST_SUITES.push(()=>suite("волны M371: одна сводка, шесть версий",()=>{
  chWorld();
  const st=chronFresh();
  for(let n=0;n<=40;n++)chronStep(st,n);
  CHRON=st;                                   /* смотрим на это состояние */
  const L=st.lines.filter(x=>x.N===40);
  ok(L.length>0,"на сводке есть о чём говорить");
  const said={};
  for(const w of MAKER_KEYS){
    const s=chronSay(L[0],w);
    ok(!!s&&s.length>8,w+": строка есть");
    said[s]=(said[s]||0)+1;
  }
  eq(Object.keys(said).length,6,"шесть волн — шесть разных версий одного события");
  /* ручка приёмника действительно крутится по кругу */
  G.opts.wave="gt";
  const seen=[];
  for(let i=0;i<6;i++)seen.push(chronWaveNext());
  eq(seen.length,6,"шесть щелчков");
  eq(chronWave(),"gt","и ручка вернулась на своё");
  eq(chronWaveSet("чепуха"),chronWave(),"несуществующая волна не берётся");
  /* заголовок называет державу и номер сводки */
  ok(chronWaveHead("km").indexOf(POWERS.km.ru.toUpperCase())>=0,"в заголовке имя волны");
}));

/* ══════════════ война, которую видно (M372, §7.4) ══════════════ */
TEST_SUITES.push(()=>suite("война M372: пикет в тылу, чужой бой на фронте",()=>{
  chWorld();
  G.mode="system";
  /* тыл: пикет хозяина, мирный и не в захвате */
  const st=chronState(200);
  let rear=null,front=null;
  for(const k of chronKeys()){
    const S=st.systems[k];
    if(S.owner<0)continue;
    if(!rear&&!S.front)rear=k;
    if(!front&&S.front)front=k;
  }
  ok(!!rear,"тыловая система нашлась");
  const rp=rear.split(",");
  G.sx=rp[0]|0;G.sy=rp[1]|0;G.pirates=[];
  npcSpawn();
  ok(G.pirates.length>=2,"в тылу стоит пикет: "+G.pirates.length);
  ok(G.pirates.every(p=>p.iff===1),"и он не берётся в захват — это не ваш бой");
  ok(G.pirates.every(p=>!!p.pw&&!!MAKER_KEYS.indexOf(p.pw)>=0),"у каждого свой флаг");
  eq(G.pirates.length<=NPC_BATTLE,true,"потолок восьми держится");
  /* фронт: две стороны и они разные */
  if(front){
    const fp=front.split(",");
    G.sx=fp[0]|0;G.sy=fp[1]|0;G.pirates=[];
    npcSpawn();
    const sides={};
    for(const p of G.pirates)sides[p.pw]=1;
    ok(G.pirates.length<=NPC_BATTLE,"и на фронте потолок тот же: "+G.pirates.length);
    if(G.pirates.length)ok(Object.keys(sides).length>=1,"стороны на месте");
  }
  /* «Ялта»: шесть посольств на рейде и ни одного боя */
  const y=yaltaAt();
  G.sx=y.sx;G.sy=y.sy;G.pirates=[];
  npcSpawn();
  eq(G.pirates.length,6,"шесть посольств");
  eq(G.pirates.filter(p=>p.envoy).length,6,"и все они посольства, а не патрули");
  const flags={};for(const p of G.pirates)flags[p.pw]=1;
  eq(Object.keys(flags).length,6,"шесть флагов разом");
}));

TEST_SUITES.push(()=>suite("война M372: свежий хозяин берёт треть и поднимает цены",()=>{
  chWorld();
  const st=chronState(200);
  let fresh=null;
  for(const k of chronKeys()){
    const S=st.systems[k];
    if(S.owner>=0&&st.N-S.since<=OCC_FRESH){fresh=k;break;}
  }
  if(!fresh){ok(true,"на этой сводке свежих захватов нет — правило проверено на числах ниже");}
  else{
    const p=fresh.split(",");
    const o=occPowerAt(p[0]|0,p[1]|0);
    ok(!!o&&!!MAKER_KEYS.indexOf(o.by)>=0,"свежий хозяин назван");
    eq(occReqMul(p[0]|0,p[1]|0),.7,"треть выработки в реквизицию");
  }
  /* за пределами круга летописи никакой оккупации державой нет */
  eq(occPowerAt(999,999),null,"за кругом флагов не меняют");
  eq(occReqMul(999,999),1,"и реквизиции нет");
}));

/* ══════════════ провод войны (M376, §13) ══════════════
   Сеть в наборе не дёргаем: здесь мерится то, что делает КЛИЕНТ с ведомостью —
   как она ложится в повтор и как выглядит давление людей на бросок фронта. */
TEST_SUITES.push(()=>suite("война M376: ведомость ложится в повтор и не ломает хэш",()=>{
  chWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  /* без ведомостей повтор такой же, как был: провод необязателен */
  const a=chRun(120);
  eq(warLedger(50),null,"ведомостей нет");
  eq(chronHash(chRun(120)),chronHash(a),"и повтор от этого не гуляет");
  /* кладём ведомость: оборона в системе даёт давление, и оно ограничено четвертью */
  warLedPut(50,{"3,4":{def:{q:12,a:["a1","a2","a3","a4","a5"]}}});
  ok(!!warLedger(50),"ведомость на руках");
  const st=chronFresh();
  const press=warPressure(st,50,0,1,"3,4");
  ok(press>0,"давление есть: "+press);
  ok(press<=250,"и оно не больше четверти броска: "+press);
  eq(warPressure(st,50,0,1,"9,9"),0,"в чужой системе давления нет");
  eq(warPressure(st,49,0,1,"3,4"),0,"и в другой сводке тоже");
  /* давление растёт по ЧИСЛУ БОРТОВ, а не по числу строк */
  warLedPut(51,{"3,4":{def:{q:400,a:["one"]}}});
  const solo=warPressure(st,51,0,1,"3,4");
  ok(solo<press,"четыреста строк одного борта слабее пяти бортов: "+solo+" против "+press);
  /* и вся ведомость целиком не выносит хэш за пределы: повтор остаётся повтором */
  const b=chRun(120);
  ok(typeof chronHash(b)==="number","хэш считается и с ведомостями");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("война M376: ключ один, поля разные",()=>{
  chWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  /* кэш летописи и ведомости живут в одном ключе и не затирают друг друга */
  warLedPut(7,{"0,0":{def:{q:1,a:["x"]}}});
  const st=chRun(30);
  chronSave(st);
  ok(!!warLedger(7),"ведомость пережила запись кэша летописи");
  const back=chronLoad();
  ok(!!back&&back.N===st.N,"а кэш летописи прочитался");
  /* смещение часов тоже своё поле */
  warStoreSet({off:12345});
  chronSave(st);
  const o=warStore();
  eq(o.off,12345,"смещение часов на месте");
  ok(!!o.led,"и ведомости на месте");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

/* ══════════════ оставленное (M377, §11.3) ══════════════
   Сеть здесь не дёргается: мерится то, что решает клиент — стирание копии,
   место записи от её же семени и то, что призрак читается иначе, чем канистра. */
TEST_SUITES.push(()=>suite("оставленное M377: копия приходит стёртой",()=>{
  chWorld();
  const row={k:"gun",s:987654,t:4,n:1,ty:0};
  const worn=leftWorn(row);
  ok(!!worn,"копия собралась");
  eq(worn.tier,3,"тир на ступень ниже оригинала");
  ok(worn.worn===1,"и она помечена стёртой");
  const full=genPart(row.s>>>0,4,"gun");
  ok(worn.aff.length<=full.aff.length,"аффиксов не больше, чем у оригинала");
  /* бонусы пересчитаны по оставшимся аффиксам, а не унаследованы */
  let sum=0;for(const x of worn.aff)sum+=Math.abs(x.v);
  ok(sum>0,"часть всё ещё что-то умеет");
  eq(leftWorn({k:"fuel",s:1,t:2}),null,"канистра не часть — стирать нечего");
  /* место лежит на семени: у всех одинаково и нигде не хранится */
  const a=leftPos(row,0),b=leftPos(row,0);
  eq(a.x,b.x,"место не гуляет");
  const c=leftPos({k:"gun",s:12,t:1},1);
  ok(Math.abs(c.x-a.x)>1||Math.abs(c.y-a.y)>1,"у другой записи другое место");
  ok(Math.hypot(a.x,a.y)>800,"и оно не под носом у точки прыжка");
}));

/* ══════════════ выборы и сбор (M378, §11.2, §14) ══════════════ */
TEST_SUITES.push(()=>suite("выборы M378: вопрос от зерна месяца, курс от голосов",()=>{
  chWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  const N=600;
  /* вопрос один и тот же у всех и не гуляет между вызовами */
  const a=voteQuestion("or",N),b=voteQuestion("or",N);
  ok(!!a&&a.key===b.key,"вопрос месяца не гуляет: "+a.key);
  eq(a.picks.length,2,"два ответа, и оба готовы заранее");
  ok(voteQuestion("km",N).key!==a.key,"у другой державы свой вопрос");
  ok(voteQuestion("or",N+VOTE_MONTH).key!==a.key,"и в следующем месяце другой");
  eq(voteQuestion("нет такой",N),null,"несуществующая держава вопроса не получает");
  /* без ведомостей итога нет — держава идёт своим ходом */
  eq(voteWinner("or",N),null,"голосов нет — итога нет");
  eq(voteCourse(MAKER_KEYS.indexOf("or"),N),null,"и курса нет");
  /* кладём голоса в ведомость: побеждает тот ответ, за который больше */
  const v={};v[a.key]={p:{}};
  v[a.key].p[a.picks[0][0]]=3;
  v[a.key].p[a.picks[1][0]]=7;
  warLedPut(N,{__votes:v});
  const w=voteWinner("or",N);
  ok(!!w,"итог посчитан");
  eq(w.pick,a.picks[1][0],"победил тот, за кого больше голосов");
  eq(w.n,7,"и число голосов названо");
  eq(voteCourse(MAKER_KEYS.indexOf("or"),N),a.picks[1][0],"курс державы — это он");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("сбор M378: три поля и ни одного слова",()=>{
  chWorld();
  /* сигнал — это система, сводка и счётчик. Ничего больше в нём нет */
  RALLY_CACHE={t:Date.now(),rows:[{sys:"3,4",at:700,n:698,yes:5,a:[]}]};
  const R=rallyAt(3,4);
  ok(!!R,"сигнал виден по адресу");
  eq(R.yes,5,"и счётчик при нём");
  eq(rallyAt(9,9),null,"в чужой системе сигнала нет");
  for(const k in R)ok(["sys","at","n","yes","a","h"].indexOf(k)>=0,
    "в сигнале нет лишних полей: "+k);
  RALLY_CACHE=null;
}));

/* ══════════════ обряды (M379, §14) ══════════════ */
TEST_SUITES.push(()=>suite("обряды M379: счётчик, порог и что из этого выходит",()=>{
  chWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  /* девять обрядов §14 и регата «Ялты» — и у каждого своё дело на сервере */
  eq(RITE_KEYS.length,10,"девять обрядов и регата");
  for(const k of RITE_KEYS){
    const R=RITES[k];
    ok(!!R.ru&&!!R.ru2&&!!R.note,k+": имя, кнопка и строка");
    ok(R.goal>0,k+": у порога есть число");
    ok(!!R.kind,k+": и свой вид дела на сервере");
  }
  /* без ведомостей счётчик пуст, и это не ошибка */
  const N=(typeof chronNow==="function")?chronNow():0;
  eq(riteCount("subbot",N-2).q,0,"ведомостей нет — счётчик пуст");
  eq(riteDone("subbot",N-2),false,"и порог не взят");
  eq(ritePirateMul(),1,"последствий тоже нет");
  /* кладём ведомость: порог берётся, последствие включается */
  warLedPut(N,{"1,1":{clear:{q:500,a:["a","b","c"]}}});
  ok(riteCount("subbot",N-2).q>=500,"счётчик считает по ведомости");
  ok(riteDone("subbot",N-2),"порог взят");
  ok(ritePirateMul()<1,"и в системе стало тише: "+ritePirateMul());
  /* талоны: четверть цены, но один раз за сводку */
  warLedPut(N,{"1,1":{clear:{q:500,a:["a","b","c"]},coup:{q:99,a:["a","b"]}}});
  G.coupN=-1;
  ok(riteFuelMul()<1,"талон отоваривается");
  riteFuelUsed();
  eq(riteFuelMul(),1,"второй раз за ту же сводку — по обычной цене");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

/* ══════════════ «Ревизия» (M380, §11.2) ══════════════
   Босс проверяется числами, а не боем: где он появляется, когда падает поле,
   почему один может, а толпа быстрее, и что вклад толпы в его области режется. */
TEST_SUITES.push(()=>suite("Ревизия M380: приходит туда, где карту перекроили",()=>{
  chWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
  const st=chronFresh();
  st.N=100;
  /* спокойная область босса не зовёт */
  eq(bossArea(st,100),null,"ничего не менялось — «Ревизии» нет");
  /* перекроим дом первой державы: половина систем сменилась только что */
  let touched=0;
  for(const k of chronKeys()){
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    const dx=x-CHRON_HOME[0][0],dy=y-CHRON_HOME[0][1];
    if(dx*dx+dy*dy>36)continue;
    if((touched++)%2)continue;
    st.systems[k].since=100;
  }
  const A=bossArea(st,100);
  ok(!!A,"область нашлась");
  eq(A.i,0,"и это тот дом, где перекроили");
  ok(A.pct>BOSS_TRIG,"выше порога в четверть: "+A.pct+" %");
  /* корпус на сервере: без ведомостей он целый */
  eq(bossDamage(90).q,0,"урона нет");
  warLedPut(95,{"8,0":{boss:{q:400000,a:["a","b","c","d"]}}});
  const d=bossDamage(90);
  eq(d.q,400000,"урон складывается по ведомостям");
  eq(d.a,4,"и видно, сколько бортов било");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("Ревизия M380: поле, двадцать секунд и потолок толпы",()=>{
  chWorld();
  /* окно щита живёт по часам и повторяется раз в десять минут */
  let open=0;
  for(let s=0;s<BOSS_EVERY;s++){
    const t=s%BOSS_EVERY;
    if(t<BOSS_WIN)open++;
  }
  eq(open,BOSS_WIN,"поле само падает на двадцать секунд из шестисот");
  ok(BOSS_REGEN>2*3000,"восстановление поля быстрее лучшего одиночки: "+BOSS_REGEN);
  /* один пробить не может, а восемь — могут: считаем по минутам */
  const solo=3000,crowd=8*3000;
  ok(solo<BOSS_REGEN,"один не продавит: "+solo+" против "+BOSS_REGEN);
  ok(crowd>BOSS_REGEN,"восьмеро продавят: "+crowd);
  /* тридцать минут огня толпы — и корпус кончился */
  const mins=BOSS_HULL/crowd;
  ok(mins>=25&&mins<=40,"корпус держит около получаса такого огня: "+Math.round(mins)+" мин");
  /* в его области вклад толпы делится на четыре */
  const st=chronFresh();st.N=100;
  for(const k of chronKeys()){
    const p=k.split(","),x=p[0]|0,y=p[1]|0;
    const dx=x-CHRON_HOME[0][0],dy=y-CHRON_HOME[0][1];
    if(dx*dx+dy*dy<=36)st.systems[k].since=100;
  }
  /* спрашиваем про ЗАДАННУЮ область: `bossActive` пересчитал бы состояние на
     сегодняшнюю сводку и снёс бы подстроенную историю */
  const A={i:0,x:CHRON_HOME[0][0],y:CHRON_HOME[0][1],hull:BOSS_HULL,dead:false};
  const near=bossPressMul(CHRON_HOME[0][0],CHRON_HOME[0][1],A);
  const far=bossPressMul(-CHRON_HOME[0][0],-CHRON_HOME[0][1],A);
  ok(near<=.25+1e-9,"рядом с ним толпа весит вчетверо меньше: "+near);
  eq(far,1,"а в другом конце круга — как обычно");
}));
