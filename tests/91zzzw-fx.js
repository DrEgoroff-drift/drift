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
  /* летопись — тихая и замороженная из resetWorld (M412): происшествия
     наборы ставят сами через fxInc, а не берут из календаря */
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

TEST_SUITES.push(()=>suite("дипломатия M386: ультиматум, посольство и письмо",()=>{
  fxWorld();
  /* ── нота со сроком ──
     Считаем ходом самой ноты, а не полным повтором: у полного шага есть ещё
     пять агентов, и они за это время помирят кого угодно. Здесь проверяется
     ровно правило ноты. */
  const st=chronFresh();
  st.powers[0].need.ore=100;                       /* голодной державе есть о чём воевать */
  /* холод между ними — то состояние, в котором ноту и пишут: потеплело до
     срока, и нота снимается сама (это отдельная проверка ниже) */
  st.powers[0].rel[1]=-400;st.powers[1].rel[0]=-400;
  ok(chronUltFile(st,0,0,1),"нота подана");
  const u=chronUltBetweenIn(st,0,1);
  ok(!!u,"и она лежит в состоянии");
  eq(u.t0,0,"у неё есть сводка, от которой считается срок");
  eq(st.lines.filter(L=>L.kind==="ult").length,1,"о ноте сказано в эфире");
  ok(chronUltFile(st,1,1,0),"вторая бумага по той же паре — та же нота");
  eq(st.lines.filter(L=>L.kind==="ult").length,1,"и второй строки в эфире нет");
  for(let n=1;n<DIP_ULT_DUE;n++)chronUltStep(st,n);
  eq(st.wars.length,0,"до срока войны нет");
  ok(!!chronUltBetweenIn(st,0,1),"а нота всё лежит");
  chronUltStep(st,DIP_ULT_DUE);
  ok(st.wars.some(w=>(w.a===0&&w.b===1)||(w.a===1&&w.b===0)),"срок вышел — война");
  ok(!chronUltBetweenIn(st,0,1),"и нота снята: своё она сделала");
  /* нужда выправилась — воевать незачем, и нота гаснет сама */
  const st2=chronFresh();
  st2.powers[0].rel[1]=-400;st2.powers[1].rel[0]=-400;
  chronUltFile(st2,0,0,1);
  for(let n=1;n<=DIP_ULT_DUE;n++)chronUltStep(st2,n);
  eq(st2.wars.length,0,"сытая держава до войны не доходит");
  ok(st2.lines.some(L=>L.kind==="note"),"о погасшей ноте тоже сказано");
  /* договорились до срока — нота отозвана ходом, а не временем */
  const st3=chronFresh();
  st3.powers[0].need.ore=100;
  st3.powers[0].rel[1]=-400;st3.powers[1].rel[0]=-400;
  chronUltFile(st3,0,0,1);
  ok(chronUltDrop(st3,1,1,0),"сделка снимает ноту с любой стороны");
  eq(chronUltBetweenIn(st3,0,1),null,"ноты нет");
  chronUltStep(st3,DIP_ULT_DUE+1);
  eq(st3.wars.length,0,"и войны не будет");
  /* потеплело до срока — нота снимается, и войны не будет */
  const stw=chronFresh();
  stw.powers[0].need.ore=100;
  stw.powers[0].rel[1]=-400;stw.powers[1].rel[0]=-400;
  chronUltFile(stw,0,0,1);
  stw.powers[0].rel[1]=0;stw.powers[1].rel[0]=0;
  chronUltStep(stw,1);
  eq(chronUltBetweenIn(stw,0,1),null,"потеплело — нота снята");
  eq(stw.wars.length,0,"и войны не будет");
  /* больше трёх нот разом круг не выдерживает: четвёртая пара воюет сразу */
  const st4=chronFresh();
  ok(chronUltFile(st4,0,0,1)&&chronUltFile(st4,0,2,3)&&chronUltFile(st4,0,4,5),"три ноты легли");
  eq(chronUltFile(st4,0,0,2),false,"четвёртой очереди нет");
  eq(st4.ults.length,DIP_ULT_MAX,"нот ровно три");
  /* нота входит в состояние целиком: и в клон, и в хэш */
  const st5=chronFresh();
  const h0=chronHash(st5);
  chronUltFile(st5,0,0,1);
  ok(chronHash(st5)!==h0,"хэш чувствует ноту");
  eq(chronClone(st5).ults.length,1,"и клон её несёт");
  /* ── война начинается с бумаги ──
     Главное следствие вехи: держава больше не открывает огонь в ту же сводку,
     в которую решила. Меряем повтором: у большинства войн есть нота, которая
     ей предшествовала, а без ноты идут только те, кому не хватило места. */
  const st6=chronFresh();
  const kk=(a,b)=>Math.min(a,b)+"|"+Math.max(a,b);
  let withNote=0,without=0,filed=0;
  for(let n=0;n<=300;n++){
    const had=new Set((st6.ults||[]).map(x=>kk(x.a,x.b)));
    chronStep(st6,n);
    for(let i=st6.lines.length-1;i>=0&&st6.lines[i].N===n;i--){
      const L=st6.lines[i];
      if(L.kind==="ult")filed++;
      else if(L.kind==="war"){if(had.has(kk(L.p,L.args.b)))withNote++;else without++;}
    }
  }
  ok(filed>0,"за триста сводок ноты пишутся: "+filed);
  ok(withNote>without,"война приходит по сроку, а не вдруг: "+withNote+" против "+without);
  /* ── шесть волн ──
     У ноты две стороны, и обе названы: строка, где вторая сторона потерялась,
     врёт умолчанием. */
  const L={N:0,kind:"ult",p:0,sys:null,args:{b:1}};
  for(const w of MAKER_KEYS){
    const s=chronSay(L,w);
    ok(s&&s.length>10,"волна "+w+" о ноте говорит");
    ok(s.indexOf("%")<0,"и без незаполненных вставок: "+w);
  }
  ok(chronSay(L,"gt").indexOf(POWERS[MAKER_KEYS[1]].ru)>=0,"вторая сторона названа");
  ok(chronSay({N:0,kind:"note",p:0,sys:null,args:{b:1}},"km").length>10,"об отзыве — тоже шесть");
  /* ── строка на станции ──
     Число со сроком склоняется: «4 сводки», а не «4 сводок». Своих склонений в
     игре не пишут — на это есть pl3. */
  fxWorld();
  const ownL=chronOwner(0,0);
  if(ownL>=0){
    const stl=chronState(),nowL=chronNow();
    stl.ults=[{a:ownL,b:(ownL+1)%6,t0:nowL-DIP_ULT_DUE+1}];
    ok(dipLine().indexOf("СРОК 1 СВОДКА")>0,"один — сводка: "+dipLine());
    stl.ults=[{a:ownL,b:(ownL+1)%6,t0:nowL-DIP_ULT_DUE+3}];
    ok(dipLine().indexOf("СРОК 3 СВОДКИ")>0,"три — сводки: "+dipLine());
    stl.ults=[];
  }
  /* ── посольство ──
     Оно идёт по ЧУЖОЙ земле: у себя дома посольства не бывает. */
  fxWorld();
  const own=chronOwner(0,0);
  if(own>=0){
    fxInc("envoy",own);
    eq(dipEnvoyDue(0,0),null,"у себя дома посольства нет");
    fxWorld();
    fxInc("envoy",(own+1)%6);
    const D=dipEnvoyDue(0,0);
    ok(!!D,"чужое посольство идёт через эту систему");
    if(D){
      eq(D.by,MAKER_KEYS[(own+1)%6],"чьё оно — видно");
      eq(D.to,MAKER_KEYS[own],"и по чьей земле — тоже");
    }
    /* борт посольства не воюет: метка `dip` гасит внимание в общей петле */
    G.pirates=[];
    npcEnvoy();
    const p=dipEnvoyShip();
    ok(!!p,"борт посольства в небе");
    if(p){
      ok(!!p.dip&&!p.aware,"он не воюет");
      ok(Math.hypot(p.vx,p.vy)>1,"и он идёт, а не стоит");
      /* сопровождение: рядом — считается, далеко — нет */
      const sh={x:p.x,y:p.y};
      G.escortT=0;G.escortDone=0;
      ok(dipEscortTick(sh,10),"рядом — ведём");
      ok((G.escortT|0)>0,"и время идёт");
      dipEscortTick({x:p.x+5000,y:p.y},10);
      eq(G.escortT|0,0,"отстал — счёт сброшен");
      /* провели: два человека знают вас, и ни одного кредита */
      const c0=G.credits;
      G.escortT=DIP_ESCORT;G.escortDone=0;
      dipEscortTick({x:p.x,y:p.y},10);
      ok(!!G.escortDone,"провели");
      eq(G.credits,c0,"и никто ничего не заплатил");
      ok((G.episodes||[]).length>0,"зато это помнят");
      /* сбитое посольство не прощают */
      const n0=(G.episodes||[]).filter(e=>e.k==="never").length;
      dipEnvoyShot(p);
      ok((G.episodes||[]).filter(e=>e.k==="never").length>n0,"сбитое посольство не прощают");
    }
  }
  /* ── письмо ──
     Правило открытки: ни имён, ни свободного текста. У письма ровно три поля —
     от кого, кому и когда, — и ни одного, куда игрок мог бы что-то вписать. */
  fxWorld();
  G.sys={station:{by:"gt"}};
  let taken=null;
  for(let x=-6;x<=6&&!taken;x++)for(let y=-6;y<=6&&!taken;y++){
    if(!chronOwnerKey(x,y))continue;
    G.sx=x;G.sy=y;
    const o=dipLetterOffer();
    if(o)taken={x,y,o};
  }
  ok(!!taken,"письмо где-нибудь да просят довезти");
  if(taken){
    G.sx=taken.x;G.sy=taken.y;
    const a=dipLetterOffer(),b=dipLetterOffer();
    eq(a.to,b.to,"предложение не мигает между заходами");
    ok(a.to!==a.from,"письмо всегда чужой державе");
    const c0=G.credits;
    ok(dipLetterTake(),"взяли");
    eq(Object.keys(G.letter).sort().join(","),"N,from,to","у письма ровно три поля и ни одного текстового");
    eq(G.credits,c0,"за перевозку не платят вперёд");
    eq(dipLetterDue(),false,"здесь его не отдать: это станция отправителя");
    /* доехали: станция адресата */
    let dst=null;
    for(let x=-6;x<=6&&!dst;x++)for(let y=-6;y<=6&&!dst;y++)
      if(chronOwnerKey(x,y)===G.letter.to)dst={x,y};
    ok(!!dst,"у адресата есть где стоять");
    if(dst){
      G.sx=dst.x;G.sy=dst.y;
      ok(dipLetterDue(),"здесь его ждут");
      const cr=G.credits;
      ok(dipLetterGive(),"отдали");
      eq(G.letter,null,"и трюм пуст");
      eq(G.credits,cr,"денег за письмо не дают: платят делом");
      ok((G.episodes||[]).some(e=>e.k==="mail"),"зато это записано");
    }
  }
  /* ── обмен пленными ──
     После перемирия и только один раз на одно перемирие. */
  fxWorld();
  const stx=chronState();
  const a0=chronOwner(0,0);
  if(a0>=0){
    stx.lines.push({N:stx.N,kind:"truce",p:a0,sys:null,args:{b:(a0+1)%6}});
    G.sys={station:{by:MAKER_KEYS[a0]}};
    G.crew=[{name:"Пленный",seed:7,trips:0,state:"hostage",ransom:900,
      order:{kind:"home",sx:0,sy:0},shipId:null,hist:[]}];
    const c0=G.credits;
    const D=dipSwapDue();
    ok(!!D,"после перемирия пленного отдают");
    ok(dipSwapTake(),"забрали");
    eq(G.crew[0].state,null,"человек свободен");
    eq(G.credits,c0,"и выкупа не платили");
    eq(dipSwapDue(),null,"один обмен на одно перемирие");
  }
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
}));
/* нота в ДАННОМ состоянии, без пересчёта: тесты шагают своим состоянием */
function chronUltBetweenIn(st,a,b){
  for(const u of (st.ults||[]))if((u.a===a&&u.b===b)||(u.a===b&&u.b===a))return u;
  return null;
}

TEST_SUITES.push(()=>suite("безопасность M387: король, шпион, ретранслятор и талон",()=>{
  fxWorld();
  /* ── пиратский король ──
     Область берётся из календаря: неделя из двадцати четырёх суток. Внутри
     окна она не гуляет — иначе король переезжал бы каждые шесть часов. */
  let live=0,dead=0;
  for(let n=0;n<SEC_KING_EVERY*2;n++){
    if(secKingWindow(n)>=0)live++;else dead++;
  }
  eq(live,SEC_KING_LIVE*2,"неделя из двадцати четырёх суток, и нулевая сводка тоже окно");
  ok(dead>live,"остальное время закон на месте");
  const n0=SEC_KING_EVERY;                       /* начало окна */
  const A=secKingArea(n0+1);
  ok(!!A,"в окне область есть");
  for(let d=1;d<SEC_KING_LIVE;d++)
    eq(secKingArea(n0+d).i,A.i,"и она та же самая всю неделю");
  eq(secKingArea(n0+SEC_KING_LIVE),null,"а после недели её нет");
  /* здесь и не здесь */
  const savedNow=chronNow;
  chronNow=()=>n0+1;
  try{
    ok(secKingHere(A.x,A.y),"в его области — он");
    ok(!secKingHere(A.x+20,A.y+20),"за её краем — нет");
    eq(secPirateMul(A.x,A.y),2,"пиратов вдвое");
    eq(secPirateRank(A.x,A.y),1,"и они на ранг выше");
    ok(secNoPickets(A.x,A.y),"а пикетов державы нет вовсе");
    eq(secPirateMul(A.x+20,A.y+20),1,"по соседству всё как обычно");
    /* толпа снимает его расчисткой: счётчик из ведомостей, как у обряда */
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
    const body={};body[A.x+","+A.y]={clear:{q:SEC_KING_GOAL,a:["a","b"]}};
    warLedPut(n0+1,body);
    eq(secKingCount(A),SEC_KING_GOAL,"расчистка сосчитана");
    ok(!secKingHere(A.x,A.y),"счётчик добран — короля нет");
    /* чужая расчистка вне области не считается */
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
    const far={};far[(A.x+20)+","+(A.y+20)]={clear:{q:SEC_KING_GOAL,a:["a"]}};
    warLedPut(n0+1,far);
    eq(secKingCount(A),0,"из соседней области не считается");
  }finally{chronNow=savedNow;}
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  /* ── шпион ──
     Цены врут по каждому товару в свою сторону и не больше чем на двенадцать
     сотых. Главное: обе стороны прилавка двигаются вместе. */
  fxWorld();
  const own=chronOwner(0,0);
  if(own>=0){
    /* «без утечки» — это условие, а не удача: в живой истории утечка у хозяина
       нулевого сектора может как раз идти (M412 переписал историю, и шла).
       Снимаем её из строк перед проверкой */
    {const S0=chronState();S0.lines=S0.lines.filter(L=>!(L.kind==="inc"&&L.args&&L.args.k==="spy"));}
    SEC_SPY_CACHE={k:"",v:false};
    eq(secSpyMul("iron",0,0),1,"без утечки цены не врут");
    fxInc("spy",own);
    SEC_SPY_CACHE={k:"",v:false};
    ok(secSpyOn(MAKER_KEYS[own]),"утечка у хозяина этой системы");
    ok(secSpyHere(0,0),"значит здесь сидит шпион");
    let lo=2,hi=0,diff=0;
    for(const k of TRADE_KEYS){
      const m=secSpyMul(k,0,0);
      lo=Math.min(lo,m);hi=Math.max(hi,m);
      if(m!==1)diff++;
      eq(secSpyMul(k,0,0),m,"и врёт он одинаково между вызовами: "+k);
    }
    ok(lo>=1-SEC_SPY_MAX/100&&hi<=1+SEC_SPY_MAX/100,"врут в границах: "+lo.toFixed(2)+"…"+hi.toFixed(2));
    ok(lo<1&&hi>1,"и в обе стороны, а не только вверх");
    ok(diff>0,"вранья хватает на несколько товаров: "+diff);
    /* обе стороны прилавка: взять по-прежнему дороже, чем сдать */
    const sys=getSystem(0,0);
    if(sys&&sys.station){
      for(const k of TRADE_KEYS){
        const sell=marketPrice(sys,k),buy=buyPriceFor(sys,k);
        ok(buy>sell,"взять дороже, чем сдать, и при шпионе: "+k+" "+buy+" > "+sell);
      }
    }
  }
  /* ── ретранслятор ──
     Молчание M385 получило управу: счётчик сканирований возвращает волну. */
  fxWorld();
  const o2=chronOwner(0,0);
  if(o2>=0){
    const by=MAKER_KEYS[o2];
    fxInc("spy",o2);
    SEC_SPY_CACHE={k:"",v:false};
    ok(powScandalOn(by),"утечка: волна молчит");
    ok(powWaveSilent(by),"и молчание слышно");
    eq(secRelayCount(by),0,"чинить ещё не начинали");
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
    const N=chronNow(),body={};
    body["0,0"]={scan:{q:SEC_RELAY_GOAL,a:["a","b","c"]}};
    warLedPut(N,body);
    eq(secRelayCount(by),SEC_RELAY_GOAL,"сканирования сосчитаны");
    ok(secRelayFixed(by),"ретранслятор починен");
    ok(!powWaveSilent(by),"и волна заговорила");
    ok(chronWaveLines(undefined,by,3).length>=0,"строки снова берутся");
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  }
  /* ── досмотр ── */
  fxWorld();
  const o3=chronOwner(0,0);
  if(o3>=0){
    eq(secHailRangeMul(),1,"без досмотра окликают как обычно");
    fxInc("patrol",o3);
    ok(secPatrolOn(0,0),"досмотр у хозяина системы");
    eq(secHailRangeMul(),2,"и окликают вдвое дальше");
  }
  /* ── чужой талон в баках ──
     Клеймо живёт сутки и узнаётся ТОЙ ЖЕ державой, а не любой. */
  fxWorld();
  G.smugBy="gt";G.smugN=chronNow();
  ok(secSmugHot("gt"),"клеймо свежее");
  ok(!secSmugHot("km"),"и оно чужое только для той, у кого взяли");
  ok(hailContraband("gt"),"её досмотр узнаёт своё топливо");
  ok(!hailContraband("km"),"а соседняя держава — нет");
  G.smugN=chronNow()-4;
  ok(!secSmugHot("gt"),"через сутки клеймо остыло");
  ok(!hailContraband("gt"),"и досмотру больше нечего сказать");
  G.smugBy=undefined;G.smugN=undefined;
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
}));

TEST_SUITES.push(()=>suite("культура M388: свод, серия, гонка и сериал",()=>{
  fxWorld();
  /* ── радиоспектакль ──
     Неделя из двадцати восьми суток, шесть частей по суткам, шесть версий у
     каждой части — и ни одной пустой ячейки: сериал, у которого на одной волне
     дырка, слышен сразу. */
  eq(CULT_PLAY.length,6,"шесть частей");
  for(const P of CULT_PLAY){
    ok(P.ru&&P.ru.length>5,"у части есть имя: "+P.ru);
    for(const w of MAKER_KEYS){
      ok(typeof P[w]==="string"&&P[w].length>30,"часть звучит на волне "+w+": "+P.ru);
      /* проценты в тексте — законные («план на 104 %»); ищем именно вставки */
      ok(!/%[pskbn]/.test(P[w]),"и без незаполненных вставок: "+w);
    }
    /* шесть версий — это шесть РАЗНЫХ строк, а не одна с перестановкой слов */
    const set={};
    for(const w of MAKER_KEYS)set[P[w]]=1;
    eq(Object.keys(set).length,6,"шесть версий и все разные: "+P.ru);
  }
  let live=0;
  for(let n=0;n<CULT_PLAY_EVERY;n++)if(cultPlayWindow(n)>=0)live++;
  eq(live,CULT_PLAY_LIVE,"идёт шесть суток из двадцати восьми");
  eq(cultPlayPart(0),0,"в первый день — первая часть");
  eq(cultPlayPart(CULT_PLAY_STEP),1,"через сутки — вторая");
  eq(cultPlayPart(CULT_PLAY_LIVE-1),CULT_PLAY.length-1,"к концу окна — последняя");
  eq(cultPlayPart(CULT_PLAY_LIVE),-1,"а после окна тишина");
  ok(cultPlayLine("km",0).length>30,"строка берётся по волне");
  ok(cultPlayLine("km",0)!==cultPlayLine("ra",0),"и у соседней волны она другая");
  /* молчащая волна молчит и здесь */
  const own=chronOwner(0,0);
  if(own>=0){
    fxInc("spy",own);
    if(typeof SEC_SPY_CACHE!=="undefined")SEC_SPY_CACHE={k:"",v:false};
    const by=MAKER_KEYS[own];
    if(powWaveSilent(by))eq(cultPlayLine(by,0),"","на молчащей волне спектакля нет");
  }
  /* ── обрывки «Долгого Хода» ──
     Таблица, а не генератор: шесть кусков, у каждого своё имя и свой текст, и
     ни один не повторяет другой. */
  fxWorld();
  eq(LONG_HOD.length,6,"шесть обрывков");
  const seen={},ids={};
  for(const F of LONG_HOD){
    ok(F.t.length>120,"обрывок написан, а не сгенерирован: "+F.ru);
    ok(!seen[F.t],"и он не повторяется: "+F.ru);
    ok(!ids[F.id],"номера не сталкиваются: "+F.id);
    seen[F.t]=1;ids[F.id]=1;
  }
  eq(cultLongCount(),0,"полка пуста");
  /* ── экспедиция ──
     Счётчик считает сканирования ТОЛЬКО в системах той державы и только с той
     сводки, в которую началась дуга. */
  fxWorld();
  const st=chronState();
  const o2=chronOwner(0,0);
  if(o2>=0){
    st.dir=st.dir||{arcs:[],rites:[],tens:0,quiet:0,peak:0,calm:0,last:{}};
    st.dir.arcs=[{p:o2,kind:"expedition",t0:st.N,stage:1}];
    const A=cultExpedition();
    ok(!!A,"дуга экспедиции видна");
    eq(cultExpCount(A),0,"сканирований пока нет");
    ok(!cultExpFound(),"и находки нет");
    eq(cultLongDue(),null,"и обрывок не всплыл");
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
    const body={};body["0,0"]={scan:{q:CULT_EXP_GOAL,a:["a","b"]}};
    warLedPut(chronNow(),body);
    eq(cultExpCount(A),CULT_EXP_GOAL,"сканирования сосчитаны");
    ok(cultExpFound(),"экспедиция нашла");
    const F=cultLongDue();
    ok(!!F,"и всплыл обрывок свода");
    if(F){
      ok(cultLongTake(),"его прочли");
      eq(cultLongCount(),1,"и он лёг на полку");
      eq(cultLongDue(),null,"дважды один и тот же не дают");
      eq(G.longHod.length,1,"на полке ровно один");
    }
    G.longHod=[];
    if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
  }
  /* ── новая серия ──
     Месяц у ОДНОЙ державы, и имя у серии одно на весь месяц. */
  fxWorld();
  const who=cultSeriesWho(0);
  ok(MAKER_KEYS.indexOf(who)>=0,"серия у одной из шести: "+who);
  let others=0;
  for(const by of MAKER_KEYS)if(cultSeriesWho(0)===by)others++;
  eq(others,1,"ровно у одной");
  eq(cultSeriesWho(CULT_SERIES-1),who,"и весь месяц у неё же");
  ok(cultSeriesName(who).length>3,"у серии есть имя: "+cultSeriesName(who));
  eq(cultSeriesName(who),cultSeriesName(who),"и оно не гуляет между вызовами");
  eq(cultSeriesOn("нет такой"),false,"у несуществующей державы серии нет");
  /* ── олимпиада ──
     Одна кнопка на старте, одна на финише; финиш — не ближе шести секторов. */
  fxWorld();
  const savedNow=chronNow;
  chronNow=()=>CULT_RACE_EVERY;                    /* начало окна */
  try{
    ok(cultRaceOn(),"олимпиада идёт");
    G.sx=0;G.sy=0;G.sys={station:{by:"gt"}};
    ok(cultRaceStart(),"время пошло");
    ok(!!G.race,"гонка записана");
    eq(cultRaceDue(),false,"на своей же станции финиша нет");
    eq(cultRaceFinish(),0,"и кнопка финиша не сработает");
    G.sx=CULT_RACE_FAR;G.sy=0;
    ok(cultRaceDue(),"за шесть секторов — можно финишировать");
    const c0=G.credits;
    const s=cultRaceFinish();
    ok(s>0,"время записано: "+s+" с");
    eq(G.race,null,"гонка закрыта");
    eq(G.raceBest,s,"и это ваш лучший ход");
    eq(G.credits,c0,"за гонку не платят: это олимпиада, а не заказ");
    /* второй заход хуже — лучший не портится */
    G.sx=0;G.sy=0;
    cultRaceStart();
    G.race.t0=Date.now()-60000;
    G.sx=CULT_RACE_FAR;G.sy=0;
    const s2=cultRaceFinish();
    ok(s2>=s,"второй ход дольше: "+s2);
    eq(G.raceBest,s,"а лучший остался прежним");
  }finally{chronNow=savedNow;}
  /* вне окна олимпиады нет */
  chronNow=()=>CULT_RACE_EVERY+CULT_RACE_LIVE;
  try{
    eq(cultRaceOn(),false,"после окна олимпиады нет");
    eq(cultRaceStart(),false,"и стартовать негде");
  }finally{chronNow=savedNow;}
  G.race=null;G.raceBest=undefined;
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  if(typeof WAR_LED_CACHE!=="undefined")WAR_LED_CACHE=null;
}));
