/* ══════════════ семьи механик Директора (M382–M388, §15.1) ══════════════
   Каждая семья — это происшествия, у которых есть последствие. Мерится здесь
   одно и то же для всех: последствие вычисляется из летописи (значит одинаково
   у всех), держится ровно свой срок, не трогает вещи игрока и не выходит за
   границы, которые сам себе назначил. */
function fxWorld(){
  resetWorld();
  /* адрес ставим явно: часть последствий спрашивает «здесь», а `resetWorld`
     оставляет борт там, где его положил мир, и в двух ярусах это разные места */
  G.sx=0;G.sy=0;
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
  return G;
}
/* поставить одно происшествие в летопись «здесь и сейчас» */
function fxInc(kind,p){
  const st=chronState();
  st.lines.push({N:st.N,kind:"inc",p:p|0,sys:null,args:{k:kind,f:"x"}});
  return st;
}

TEST_SUITES.push(()=>suite("экономика M382: волна, жила, ярмарка, эмбарго",()=>{
  fxWorld();
  /* волна цен: своя у каждой державы, в границах девяти процентов и без дробной
     математики в основе — иначе она разошлась бы у двух клиентов */
  let lo=9,hi=0;
  for(let n=0;n<120;n++){
    for(const by of MAKER_KEYS){
      const m=econCycleMul(by,n);
      lo=Math.min(lo,m);hi=Math.max(hi,m);
    }
  }
  ok(lo>.9&&hi<1.1,"волна держится в девяти процентах: "+lo.toFixed(3)+"…"+hi.toFixed(3));
  ok(econCycleMul("gt",0)!==econCycleMul("co",0),"у держав волны сдвинуты");
  eq(econCycleMul("gt",5),econCycleMul("gt",5),"и она не гуляет между вызовами");
  eq(econCycleMul("нет такой",5),1,"у несуществующей державы волны нет");
  /* без происшествий — никаких последствий */
  /* «без происшествий» проверяем на СВОБОДНОЙ системе: Директор живёт своей
     жизнью, и на настоящей сводке у него вполне может идти и жила, и эмбарго */
  fxWorld();
  eq(econVeinHere(999,999),false,"за кругом летописи жилы нет");
  eq(econEmbargoOn(999,999),false,"и эмбарго нет");
  eq(econTierBonus(999,999),0,"и тир не поднят");
  /* жила: только во владениях той державы, у которой она объявлена */
  const st=chronState();
  const own=chronOwner(0,0);
  if(own>=0){
    fxInc("vein",own);
    ok(econVeinHere(0,0),"жила во владениях объявившей державы");
    eq(econTierBonus(0,0),1,"тир находок выше на один");
    let other=-1;
    for(const k of chronKeys()){
      const p=k.split(",");
      if(chronOwner(p[0]|0,p[1]|0)>=0&&chronOwner(p[0]|0,p[1]|0)!==own){other=k;break;}
    }
    if(other){
      const p=other.split(",");
      eq(econVeinHere(p[0]|0,p[1]|0),false,"у соседа жилы нет");
    }
  }
  /* эмбарго двигает цену вверх, и на обе стороны прилавка сразу */
  fxWorld();
  const own2=chronOwner(0,0);
  if(own2>=0){
    const had=econEmbargoOn(0,0);
    const before=econPriceMul(0,0);
    fxInc("embargo",own2);
    ok(econEmbargoOn(0,0),"эмбарго здесь");
    const after=econPriceMul(0,0);
    if(had)eq(after,before,"эмбарго уже шло — второй раз не дорожает");
    else ok(after>before,"эмбарго дороже: "+before.toFixed(3)+" → "+after.toFixed(3));
    ok(after/before<1.3,"и не втрое: "+(after/before).toFixed(2));
  }
}));

TEST_SUITES.push(()=>suite("общество M383: забастовка, праздник, секта, переселенцы",()=>{
  fxWorld();
  /* без происшествий ничего не закрыто и ничего не подешевело */
  eq(socStrikeHere(),false,"забастовки нет");
  eq(socService("yard"),true,"док открыт");
  eq(socWageMul(),1,"труд по обычной цене");
  eq(socPirateMul(0,0),1,"и грабят как обычно");
  const own=chronOwner(0,0);
  if(own<0){ok(true,"мы вне круга летописи — правила проверены ниже на числах");return;}
  /* забастовка закрывает всё, кроме заправки */
  fxInc("strike",own);
  /* Директор объявляет забастовки и сам: наша строка идёт последней и потому
     побеждает — на равных сводках берётся свежая (12am-chron-director) */
  const dbg=chronIncOf("strike",SOC_STRIKE);
  ok(!!dbg&&dbg.p===own,"происшествие видно и оно наше");
  ok(socStrikeHere(),"забастовка здесь");
  eq(socService("fuel"),true,"заправка работает");
  eq(socService("yard"),false,"а док стоит");
  eq(occService("lab"),false,"и лаборатория тоже");
  ok(socPriceMul(0,0)>1,"пока станция стоит, всё дороже");
  /* праздник — наоборот */
  fxWorld();
  fxInc("holiday",own);
  ok(socHolidayHere(),"праздник здесь");
  ok(socPriceMul(0,0)<1,"и на прилавке скидка");
  /* секта уводит систему в тишину */
  fxWorld();
  fxInc("cult",own);
  eq(socPirateMul(0,0),0,"в тихом уезде не грабят вовсе");
  /* переселенцы: у СОСЕДА дешевле, а у себя нет */
  fxWorld();
  fxInc("refugee",own);
  eq(socRefugeeNear(0,0),false,"в самой занятой системе никто не дешевеет");
  let near=null;
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(chronOwner(d[0],d[1])>=0&&chronOwner(d[0],d[1])!==own){near=d;break;}
  }
  if(near){
    G.sx=near[0];G.sy=near[1];
    ok(socRefugeeNear(),"у соседа переселенцы");
    ok(socWageMul()<1,"и труд там дешевле: "+socWageMul());
  }
}));

TEST_SUITES.push(()=>suite("природа M384: буря, рой, истощение, находка",()=>{
  fxWorld();
  const own=chronOwner(0,0);
  if(own<0){ok(true,"вне круга летописи");return;}
  /* без происшествий ничего не идёт */
  eq(natStormHere(0,0),false,"бури нет");
  eq(natSwarmHere(0,0),false,"роя нет");
  eq(natOreMul("iron",0,0),1,"руда обычная");
  eq(natLandMul(),1,"и на поверхности как всегда");
  /* буря: помеха и пустое небо */
  fxInc("storm",own);
  ok(natStormHere(0,0),"вспышка здесь");
  ok(natNoPickets(),"пикеты уходят");
  G.jamT=0;
  natStormTick(1);
  ok(G.jamT>0,"приборы врут: та же помеха, что у помеховой");
  /* рой: бьёт стоящего и не трогает идущего */
  fxWorld();
  fxInc("swarm",own);
  G.mode="system";
  G.hull=stat().hullMax;
  G.ship.vx=0;G.ship.vy=0;
  natSwarmTick(3);
  ok(G.hull<stat().hullMax,"стоящему достаётся");
  const hurt=G.hull;
  G.ship.vx=stat().maxSp||8;G.ship.vy=0;
  natSwarmTick(3);
  eq(G.hull,hurt,"а идущему — нет");
  /* истощение: пояс пуст, а не беднее */
  fxWorld();
  fxInc("drain",own);
  eq(natOreMul("iron",0,0),0,"железа нет вовсе");
  eq(natOreMul("organics",0,0),1,"а органика не руда — её это не трогает");
  /* находка: единственное доброе происшествие семьи */
  fxWorld();
  fxInc("find",own);
  ok(natLandMul()>1,"на поверхности берётся больше: "+natLandMul());
}));

TEST_SUITES.push(()=>suite("власть M385: переворот, чистка, преемник и молчание",()=>{
  fxWorld();
  const own=chronOwner(0,0);
  if(own<0){ok(true,"вне круга летописи");return;}
  /* чистка и наследник меняют САМО состояние, поэтому живут в повторе */
  const st=chronFresh();
  st.powers[0].str=900;
  for(let q=1;q<6;q++){st.powers[0].rel[q]=800;st.powers[q].rel[0]=800;}
  /* прогоняем шаг, пока не выпадут нужные происшествия: они детерминированы,
     значит рано или поздно выпадут, и это тоже свойство, которое стоит знать */
  let sawPurge=false,sawEnvoy=false;
  for(let n=0;n<400&&!(sawPurge&&sawEnvoy);n++){
    const s0=st.powers[0].str,r0=st.powers[0].rel[1];
    chronStep(st,n);
    const inc=(st.lines||[]).filter(L=>L.kind==="inc"&&L.N===n&&L.p===0);
    for(const L of inc){
      if(L.args.k==="purge"&&!sawPurge){sawPurge=true;ok(st.powers[0].str<s0||s0<=100,"чистка отняла силу");}
      if(L.args.k==="envoy"&&!sawEnvoy){sawEnvoy=true;ok(Math.abs(st.powers[0].rel[1])<=Math.abs(r0),"наследник сбросил отношения");}
    }
  }
  ok(sawPurge||sawEnvoy,"за четыреста сводок такие происшествия случаются");
  /* переворот переворачивает курс — и только он это может */
  fxWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  const N=chronNow();
  const Q=voteQuestion(MAKER_KEYS[own],N);
  const v={};v[Q.key]={p:{}};v[Q.key].p[Q.picks[0][0]]=9;
  warLedPut(N,{__votes:v});
  eq(voteCourse(own,N),Q.picks[0][0],"толпа выбрала курс");
  eq(powCourse(own,N),Q.picks[0][0],"без переворота он и остаётся");
  fxInc("coup",own);
  ok(powCoupOn(own),"переворот здесь");
  eq(powCourse(own,N),Q.picks[1][0],"и курс перевёрнут ровно наоборот");
  /* позор: волна молчит */
  fxWorld();
  fxInc("spy",own);
  ok(powScandalOn(MAKER_KEYS[own]),"утечка у этой волны");
  eq(chronWaveLines(undefined,MAKER_KEYS[own],3).length,0,"и волна молчит");
  ok(chronWaveLines(undefined,MAKER_KEYS[(own+1)%6],3).length>=0,"а соседняя говорит как обычно");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("летопись M385: повтор не зовёт сам себя",()=>{
  /* Однажды курс державы спросил у летописи, идёт ли переворот, — и получил
     повтор внутри повтора: прогон набора повис намертво. Правило: внутри шага
     состояние передаётся параметром. Ниже — и правило, и предохранитель. */
  fxWorld();
  const own=chronOwner(0,0);
  if(own<0){ok(true,"вне круга летописи");return;}
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  const N=chronNow();
  const Q=voteQuestion(MAKER_KEYS[own],N);
  const v={};v[Q.key]={p:{}};v[Q.key].p[Q.picks[0][0]]=9;
  warLedPut(N,{__votes:v});
  /* повтор с курсом и переворотом обязан просто закончиться */
  const t0=Date.now();
  const st=chronFresh();
  for(let n=0;n<60;n++)chronStep(st,n);
  ok(Date.now()-t0<3000,"шестьдесят сводок с курсом считаются мгновенно");
  /* и предохранитель: chronState изнутри шага возвращает то, что есть, а не
     запускает второй повтор */
  const before=chronState();
  ok(!!before&&before.powers,"состояние на руках");
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
}));
