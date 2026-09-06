/* ══════════════ база: наборы M402–M409 ══════════════
   Хвост базовой очереди: развалина и возврат, плата и блокада, сотня
   управляющих, охота, стройка, ПАЛАТА и опорный пункт экспедиции. Помощники —
   в `91zzzw-base.js`. */
/* ── развалина и возврат (M402) ──
   Главное правило §39: потерять можно, вернуть можно ВСЕГДА и из любого
   состояния. Набор проверяет обе половины, и вторую строже. */
TEST_SUITES.push(()=>suite("база M402: брошенная становится развалиной",()=>{
  const B=bLife();
  G.crew=[];
  const n=baseShift();
  /* живая база развалиной не становится */
  baseLife(B).air=100;baseLife(B).water=100;
  eq(baseRuinCheck(B,n),0,"с запасом — не развалина");
  eq(B.dead|0,0,"и счётчик запустения не идёт");
  /* пустая и без людей — доходит, но не сразу */
  baseLife(B).air=0;baseLife(B).water=0;
  for(let i=0;i<RUIN_AFTER-1;i++)baseRuinCheck(B,n+i);
  ok(!baseIsRuin(B),"за неполные сутки ещё нет");
  baseRuinCheck(B,n+RUIN_AFTER);
  ok(baseIsRuin(B),"а за сутки — да");
  ok(B.cells.every(c=>!c||c.hp<=0),"построенное стоит разбитым");
  ok(B.log.some(x=>x.k==="ruin"),"и об этом сказано в журнале");
  /* с людьми не доходит никогда */
  const B2=bLife();
  B2.cells[5]={k:"habitat",hp:1};
  bCrew(B2,1);
  baseLife(B2).air=0;baseLife(B2).water=0;
  for(let i=0;i<RUIN_AFTER*2;i++)baseRuinCheck(B2,n+i);
  ok(!baseIsRuin(B2),"пока есть люди, база не развалина");
}));

TEST_SUITES.push(()=>suite("база M402: вернуть можно всегда",()=>{
  const B=bLife();
  G.crew=[];
  const n=baseShift();
  B.ruin={n,who:null};
  for(const c of B.cells)if(c)c.hp=0;
  /* пока пусто — вернуть даром */
  eq(baseTenant(B,n),null,"сразу никто не въезжает");
  const cr=G.credits;
  ok(baseRuinTake(B),"пустую вернули");
  eq(G.credits,cr,"и даром");
  ok(!baseIsRuin(B),"база снова наша");
  ok(B.cells.some(c=>c&&c.hp<=0),"но отсеки так и стоят разбитыми");
  /* поселенцы: выкуп */
  B.ruin={n:n-RUIN_TENANT-1,who:"squat"};
  eq(baseRuinPrice(B),RUIN_SQUAT,"у поселенцев своя цена");
  G.credits=10;
  eq(baseRuinTake(B),false,"без денег не выкупить");
  ok(baseIsRuin(B),"и база всё ещё не ваша");
  G.credits=RUIN_SQUAT+100;
  ok(baseRuinTake(B),"с деньгами — выкупили");
  eq(G.credits,100,"и они ушли");
  /* застава: или деньги, или руки */
  B.ruin={n:n-RUIN_TENANT-1,who:"pirate"};
  G.credits=10;
  G.sx=B.sx;G.sy=B.sy;G.pirates=[{hull:50}];
  eq(baseRuinClearable(B),false,"пока пираты в системе — не снять");
  eq(baseRuinTake(B),false,"и не выкупить без денег");
  G.pirates=[];
  ok(baseRuinClearable(B),"пиратов сняли — застава снимается руками");
  ok(baseRuinTake(B),"и база возвращается без денег");
  eq(G.credits,10,"денег это не стоило");
  /* починка от нуля: четверть постройки и ни одного потерянного отсека */
  B.cells[0]={k:"drill",hp:0};
  const full=baseCost("drill",B).credits;
  const fix=baseFixCost(B,"drill").credits;
  ok(fix<full/2,"починка дешевле постройки: "+fix+" против "+full);
  G.credits=fix+5;G.cargo.alloy=99;
  ok(baseFixCell(B,0,0),"отсек восстановлен");
  eq(baseCell(B,0,0).hp,1,"и он снова целый");
  /* и ни одно состояние не удаляет базу из мира */
  const key=Object.keys(G.bases)[0];
  ok(!!G.bases[key],"база на месте");
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(!!G.bases[key],"и переживает сохранение даже разбитой");
}));

/* ── плата и блокада (M403) ──
   Правило §23: хорошая база не печатает кредиты — она делает то, чего не
   купить. Набор проверяет и это правило, и что прилавок базы не бесплатный. */
TEST_SUITES.push(()=>suite("база M403: решённая делает то, чего не купить",()=>{
  const B=bLife();
  /* формуляр ставим ПОД ТЕКУЩИЙ тип: ключ включает его, и правка «не тому
     миру» — ровно та ошибка, которую этот набор однажды и поймал */
  const dial=o=>{G._dial[B.sx+","+B.sy+":"+B.idx+":"+B.type]=
    Object.assign({heat:0,light:1,press:0,grav:1,wind:0,quake:0,ice:0,ore:2,
      type:B.type,key:"тест"},o);};
  /* таблица честная: у каждого умения есть настоящий ресурс и настоящий модуль */
  for(const U of UNIQ){
    ok(!!RES[U.k],"умение «"+U.ru+"» даёт настоящий ресурс: "+U.k);
    eq(RES[U.k].price,0,"и его нигде не купить — цена ноль");
    ok(!U.need.cell||!!BUILD[U.need.cell],"и модуль для него существует");
    ok(U.note&&U.note.length>10,"и сказано, почему только здесь");
  }
  /* обычная база не умеет ничего особенного */
  eq(baseUnique(B).length,0,"простая база уникального не делает");
  /* вулкан на глубине с плавильней — иридий */
  B.type="volcanic";
  dial({heat:2});
  B.cells[BASE_COLS*3]={k:"refinery",hp:1};
  ok(baseUnique(B).some(u=>u.k==="techcomp"),"вулкан на глубине даёт техкомпоненты");
  /* без плавильни — не умеет */
  B.cells[BASE_COLS*3]=null;
  ok(!baseUnique(B).some(u=>u.k==="techcomp"),"без плавильни — нет");
  /* и на лёгком мире того же не выйдет */
  B.type="rocky";
  dial({});
  B.cells[BASE_COLS*3]={k:"refinery",hp:1};
  ok(!baseUnique(B).some(u=>u.k==="techcomp"),"на каменистой — нет");
  /* тяжёлый мир и глубина — карбид */
  dial({grav:1.5});
  B.cells[BASE_COLS*3]={k:"drill",hp:1};
  ok(baseUnique(B).some(u=>u.k==="carbide"),"тяжёлый мир достаёт карбид");
  /* и оно правда кладётся на склад, но медленно */
  B.cells[0]={k:"reactor",hp:1};B.cells[1]={k:"reactor",hp:1};
  const n=baseShift()-(baseShift()%UNIQ_EVERY);
  const q0=B.pool.carbide|0;
  eq(baseUniqStep(B,n+1),0,"не каждую смену");
  ok(baseUniqStep(B,n),"а раз в несколько смен — да");
  ok((B.pool.carbide|0)>q0,"и это легло на склад");
  ok(B.log.some(x=>x.k==="uniq"),"и записано в журнал");
}));

TEST_SUITES.push(()=>suite("база M403: свой прилавок стоит своего",()=>{
  const B=bLife();
  /* топливо из своего льда */
  G.fuel=10;
  B.pool.ice=0;
  eq(baseRefuel(B),0,"без льда не заправиться");
  B.pool.ice=50;
  const f0=G.fuel,i0=B.pool.ice;
  const took=baseRefuel(B);
  ok(took>0,"залили: "+took+" льда");
  ok(G.fuel>f0,"в баках прибавилось");
  eq(B.pool.ice,i0-took,"и лёд ушёл со склада — даром не бывает");
  /* ремонт своими сплавами и только при мастерской */
  G.hull=20;
  B.pool.alloy=9;
  eq(baseRepairShip(B),0,"без мастерской не чинят");
  B.cells[1]={k:"shop",hp:1};
  const h0=G.hull,a0=B.pool.alloy;
  const used=baseRepairShip(B);
  ok(used>0,"починили: −"+used+" сплавов");
  ok(G.hull>h0,"корпус целее");
  eq(B.pool.alloy,a0-used,"и сплавы ушли");
  /* блокада: она читается из летописи, а не из воздуха */
  eq(typeof baseBlocked(B),"boolean","блокада — это состояние системы");
  ok(basePayLine(B).indexOf("undefined")<0,"строка без мусора: "+basePayLine(B));
}));

/* ── сто управляющих и один (M405) ──
   §48: не три коробки, а кривая. Проверяется форма кривой, единственная
   зацепка собеседования и то, что плохой управляющий ХУЖЕ, чем никакой. */
TEST_SUITES.push(()=>suite("база M405: кривая, а не список",()=>{
  /* бросок чистый и повторяемый */
  const a=bmgrOf(12345),b2=bmgrOf(12345);
  eq(a.q,b2.q,"один и тот же номер — один и тот же человек");
  eq(a.name,b2.name,"и имя то же");
  ok(bmgrOf(1).q!==bmgrOf(2).q,"а разные номера — разные люди");
  /* форма кривой: масса у дна, хвост тонкий (§48.1) */
  let lo=0,mid=0,hi=0,top=0,flaw=0;
  const N=4000;
  for(let i=0;i<N;i++){
    const M=bmgrOf(i*7919+3);
    if(M.q<.35)lo++;else if(M.q<.6)mid++;else if(M.q<.85)hi++;else top++;
    if(M.flaw)flaw++;
  }
  ok(lo/N>.5,"масса у дна: "+Math.round(lo/N*100)+"% ниже трети");
  ok(top/N<.08,"и хвост тонкий: "+Math.round(top/N*100)+"% выше .85");
  ok(mid/N>.1,"середина существует — сносный найм это стратегия");
  near(flaw/N,.62,.05,"изъян примерно у двух третей: "+(flaw/N).toFixed(2));
  /* у каждого изъяна есть имя и объяснение */
  eq(BMGR_FLAWS.length,6,"шесть изъянов");
  for(const F of BMGR_FLAWS)ok(F.ru&&F.how&&F.how.length>20,"изъян «"+F.ru+"» объяснён");
  /* кандидаты у прилавка стабильны и их немного */
  resetWorld();
  const sys=G.sys;
  if(sys&&sys.station){
    const c1=bmgrAt(sys),c2=bmgrAt(sys);
    ok(c1.length>=2&&c1.length<=3,"у прилавка двое-трое: "+c1.length);
    eq(c1.map(x=>x.id).join(),c2.map(x=>x.id).join(),"и это те же самые люди");
  }
}));

TEST_SUITES.push(()=>suite("база M405: единственная зацепка — вопрос о месте",()=>{
  /* настоящий спрашивает о МЕСТЕ; поддельный говорит о себе */
  let asked=0,flat=0,fakeAsked=0,n=0;
  for(let i=0;i<3000;i++){
    const M=bmgrOf(i*613+11);
    const L=bmgrLine(M);
    const q=L.indexOf("?")>0;
    if(M.sense>=.5){n++;if(q)asked++;}
    else{if(q)fakeAsked++;else flat++;}
  }
  ok(n>0,"чуткие в галактике есть: "+n);
  eq(asked,n,"и все они спрашивают о месте");
  ok(flat>fakeAsked*3,"а поддельные в основном льстят: "+flat+" против "+fakeAsked);
  ok(fakeAsked>0,"но некоторые научились изображать вопрос — признак, а не доказательство");
}));

TEST_SUITES.push(()=>suite("база M405: наём, доля, изъян и расторжение",()=>{
  const B=bLife();
  G.crew=[];
  /* найти чуткого и посредственного */
  let good=null,bad=null;
  for(let i=0;i<9000&&!(good&&bad);i++){
    const M=bmgrOf(i*7919+3);
    if(!good&&M.q>.8&&!M.flaw)good=M;
    if(!bad&&M.q<.3&&M.flaw&&M.flaw.id==="steal"&&M.term<30)bad=M;
  }
  ok(!!good&&!!bad,"нашлись и хороший, и плохой");
  /* хороший вытягивает больше, плохой — меньше, чем никакой */
  eq(bmgrWorkMul(B),1,"без управляющего база работает как есть");
  B.mgr={id:bad.id,since:baseShift()};
  ok(bmgrWorkMul(B)<1,"плохой ХУЖЕ, чем никакого: ×"+bmgrWorkMul(B).toFixed(2));
  B.mgr={id:good.id,since:baseShift()};
  ok(bmgrWorkMul(B)>1,"хороший вытягивает больше: ×"+bmgrWorkMul(B).toFixed(2));
  /* изъян всплывает не раньше срока */
  B.mgr={id:bad.id,since:100};
  eq(bmgrFlawOn(B,100+bad.term-1),null,"до срока изъяна не видно");
  ok(!!bmgrFlawOn(B,100+bad.term),"а после срока — видно");
  /* он тащит: склад не сходится */
  B.pool={iron:100};
  let n2=100+bad.term;
  while(n2%4)n2++;
  bmgrStep(B,n2);
  ok((B.pool.iron|0)<100,"со склада ушло: "+B.pool.iron);
  /* жалованье платится, и без денег он уходит сам */
  G.credits=100000;
  const cr=G.credits;
  bmgrStep(B,n2+1);
  ok(G.credits<cr,"жалованье списано: −"+(cr-G.credits));
  /* без денег он не уходит с первой же смены (разбор 0.409.1): неоплаченное
     копится, и терпит он четыре смены — иначе догон после недельного рейса
     распускал штат постфактум */
  G.credits=0;
  bmgrStep(B,n2+2);
  ok(!!B.mgr,"первую неоплаченную смену он терпит");
  for(let i=0;i<BMGR_DUE;i++)bmgrStep(B,n2+3+i);
  eq(B.mgr,null,"а после четырёх — уходит сам");
  ok(B.log.some(x=>x.k==="mgrgo"),"и это записано");
  /* расторжение стоит выходного пособия */
  B.mgr={id:good.id,since:baseShift()};
  G.credits=10;
  eq(bmgrFire(B),false,"без пособия не расторгнуть");
  G.credits=good.pay*BMGR_SEV+50;
  ok(bmgrFire(B),"с пособием — расторгли");
  eq(B.mgr,null,"договора нет");
  eq(G.credits,50,"и пособие ушло");
}));

/* ── охота (M406) ──
   §24.2: он функция времени, а не запись. §24.4: улика описывает, где он БЫЛ.
   §35.1: у прилавка его не встретить — только там, где он сейчас. */
TEST_SUITES.push(()=>suite("база M406: он один, и он переезжает",()=>{
  resetWorld();
  /* он один на галактику, он лучший и он без изъяна */
  const one=theOne();
  ok(one.q>=.85,"настоящий стоит на самом верху кривой: "+one.q.toFixed(2));
  eq(one.flaw,null,"и он без изъяна");
  eq(theOne().id,one.id,"он один и тот же при каждом вопросе");
  ok(one.sense>=.5,"и чутьё у него есть — значит на собеседовании он спросит о месте");
  ok(bmgrLine(one).indexOf("?")>0,"так и есть: "+bmgrLine(one));
  /* он функция времени: за смену не двигается, за работу — переезжает */
  const n=1000;
  const w1=mgrWhere(n),w2=mgrWhere(n+1);
  eq(w1.sx+","+w1.sy,w2.sx+","+w2.sy,"в соседней смене он там же");
  let moved=false;
  for(let k=1;k<=4&&!moved;k++){
    const w3=mgrWhere(n+k*ONE_JOB);
    if(w3.sx!==w1.sx||w3.sy!==w1.sy)moved=true;
  }
  ok(moved,"а за несколько работ — переезжает");
  /* и он всегда там, где есть станция: он работает, а не сидит в пустоте */
  for(let k=0;k<6;k++){
    const W=mgrWhere(n+k*ONE_JOB);
    const sys=getSystem(W.sx,W.sy);
    ok(sys&&sys.station,"работа "+k+" — на станции: "+W.sx+":"+W.sy);
  }
}));

TEST_SUITES.push(()=>suite("база M406: пеленг без дальности и слух про прошлое",()=>{
  resetWorld();
  const n=1000;
  const W=mgrWhere(n);
  /* пеленг: направление есть, дальности нет */
  const b=mgrBearing(W.sx+20,W.sy,n);
  ok(typeof b.deg==="number","пеленг — это градусы");
  eq(b.here,0,"издалека он не «здесь»");
  const line=mgrBearLine(W.sx+20,W.sy,n);
  ok(line.indexOf("румб")>0,"и строка про румб: "+line);
  ok(!/\d+\s*сект/.test(line),"а расстояния в ней нет");
  /* врёт он не больше чем на пятнадцать градусов */
  let worst=0;
  for(let i=0;i<200;i++){
    const sx=W.sx+30+i,sy=W.sy+7;
    const truth=Math.atan2(W.sy-sy,W.sx-sx)*180/Math.PI;
    const got=mgrBearing(sx,sy,n).deg;
    let d=Math.abs(((got-truth)%360+540)%360-180);
    worst=Math.max(worst,d);
  }
  ok(worst<=ONE_BEAR_ERR+1,"врёт не больше пятнадцати градусов: "+worst.toFixed(1));
  /* два пеленга из далёких точек сходятся на нём: это и есть умение */
  const p1=mgrBearing(W.sx-25,W.sy,n),p2=mgrBearing(W.sx,W.sy-25,n);
  ok(Math.abs(p1.deg-p2.deg)>20,"из двух далёких мест румбы разные — есть чему пересекаться");
  /* стоя на нём — «он здесь» */
  eq(mgrBearing(W.sx,W.sy,n).here,1,"на месте пеленг говорит прямо");
  ok(mgrHereNow(W.sx,W.sy,n),"и он тут");
  /* слух: половина — о ложной цели, и он всегда про прошлое */
  let fake=0,wrong=0;
  for(let i=0;i<400;i++){
    const q=mgrRumour(rng(hashi(i,7,3)));
    if(q.fake)fake++;
    if(q.wrong)wrong++;
    ok(q.text.indexOf("управляющий")>=0||q.text.indexOf("Управляющий")>=0,"слух про управляющего");
  }
  ok(fake>120&&fake<280,"половина слухов — о ложной цели: "+fake+" из 400");
  near(wrong/400,.15,.07,"и пятнадцать процентов просто неверны: "+(wrong/400).toFixed(2));
}));

TEST_SUITES.push(()=>suite("база M406: у прилавка его нет, а в его системе — есть",()=>{
  resetWorld();
  const n=(typeof baseShift==="function")?baseShift():0;
  const W=mgrWhere(n);
  const sysHere=getSystem(W.sx,W.sy);
  const here=mgrCandidatesHere(sysHere);
  ok(here.some(M=>M.id===theOne().id),"в его системе он стоит среди кандидатов");
  ok(here.length>=3,"и не один: рядом обычные");
  /* и ничем не отмечен: та же строка, тот же вид, что у остальных */
  const M=here.find(x=>x.id===theOne().id);
  ok(!!bmgrLine(M),"у него такая же строка, как у всех");
  /* а в чужой системе его нет */
  let other=null;
  for(let x=-9;x<=9&&!other;x++)for(let y=-9;y<=9&&!other;y++){
    if(x===W.sx&&y===W.sy)continue;
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s&&s.station)other=s;
  }
  ok(!!other,"нашлась другая станция");
  if(other){
    const L=mgrCandidatesHere(other);
    ok(!L.some(x=>x.id===theOne().id),"там его нет — он не рекламирует себя (§35.1)");
  }
}));

/* ── он строит и развивает (M407) ──
   §37: строят ВСЕ, правильно — один. Проверяется именно разница, а не факт
   стройки, и три изъяна, которым нужна была именно она. */
TEST_SUITES.push(()=>suite("база M407: строят все, правильно — один",()=>{
  const B=bLife();
  G.crew=[];
  G.credits=500000;G.cargo.alloy=200;
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"reactor",hp:1};
  /* без управляющего база не строит сама */
  const n=baseShift()-(baseShift()%DEV_EVERY);
  eq(devStep(B,n),0,"без управляющего никто ничего не ставит");
  /* хороший читает формуляр: на жарком мире радиатор раньше бура */
  let good=null,bad=null;
  for(let i=0;i<9000&&!(good&&bad);i++){
    const M=bmgrOf(i*7919+3);
    if(!good&&M.q>.8&&!M.flaw)good=M;
    if(!bad&&M.flaw&&M.flaw.id==="wrong"&&M.term<20)bad=M;
  }
  ok(!!good&&!!bad,"нашлись оба");
  G._dial[B.sx+","+B.sy+":"+B.idx+":"+B.type]={heat:2.5,light:1,press:0,grav:1,
    wind:0,quake:0,ice:0,ore:3,type:B.type,key:"тест"};
  B.mgr={id:good.id,since:n};
  const want=devWant(B,good);
  eq(want[0],"radiator","на жарком мире хороший ставит радиатор первым: "+want.slice(0,3).join(","));
  ok(devStep(B,n),"и ставит его");
  ok(B.cells.some(c=>c&&c.k==="radiator"),"радиатор стоит");
  /* плохой ставит тот же список задом наперёд */
  const B2=bLife();
  for(let i=0;i<B2.cells.length;i++)B2.cells[i]=null;
  B2.cells[0]={k:"reactor",hp:1};
  G._dial[B2.sx+","+B2.sy+":"+B2.idx+":"+B2.type]={heat:2.5,light:1,press:0,grav:1,
    wind:0,quake:0,ice:0,ore:3,type:B2.type,key:"тест"};
  B2.mgr={id:bad.id,since:n-bad.term-1};
  ok(!!bmgrFlawOn(B2,n),"его изъян уже виден");
  const want2=devWant(B2,bad);
  ok(want2[0]!=="radiator","а плохой начинает с другого конца: "+want2.slice(0,3).join(","));
  /* он тратит ВАШИ деньги и оставляет запас на счету */
  const cr=G.credits;
  devStep(B,n+DEV_EVERY);
  ok(G.credits<cr,"стройка идёт из вашего кармана: −"+(cr-G.credits));
  G.credits=DEV_KEEP+10;
  const c2=G.credits;
  devStep(B,n+DEV_EVERY*2);
  eq(G.credits,c2,"и на последние он не строит");
  /* и чинит разбитое раньше, чем ставит новое */
  G.credits=500000;
  B.cells[0].hp=0;
  ok(devStep(B,n+DEV_EVERY*3),"ход сделан");
  eq(B.cells[0].hp,1,"сперва починил разбитое");
  ok(B.log.some(x=>x.k==="devfix"),"и это в журнале");
}));

TEST_SUITES.push(()=>suite("база M407: три изъяна, которым нужна была стройка",()=>{
  const n=baseShift()-(baseShift()%DEV_EVERY);
  /* боится глубины: нижний ряд не трогает никогда */
  let deep=null,panic=null;
  for(let i=0;i<9000&&!(deep&&panic);i++){
    const M=bmgrOf(i*7919+3);
    if(!deep&&M.flaw&&M.flaw.id==="deep"&&M.term<20)deep=M;
    if(!panic&&M.flaw&&M.flaw.id==="panic"&&M.term<20)panic=M;
  }
  ok(!!deep&&!!panic,"нашлись оба изъяна");
  const B=bLife();
  G.credits=500000;G.cargo.alloy=200;
  /* заполняем всё, кроме нижнего ряда */
  for(let i=0;i<B.cells.length;i++)B.cells[i]={k:"storage",hp:1};
  const last=baseRows(B)-1;
  for(let c=0;c<BASE_COLS;c++)baseSet(B,c,last,null);
  B.mgr={id:deep.id,since:n-deep.term-1};
  eq(devSpot(B,"drill",deep),null,"боящийся глубины не видит нижнего ряда");
  const B2=bLife();
  for(let i=0;i<B2.cells.length;i++)B2.cells[i]={k:"storage",hp:1};
  for(let c=0;c<BASE_COLS;c++)baseSet(B2,c,last,null);
  let plain=null;
  for(let i=0;i<9000&&!plain;i++){const M=bmgrOf(i*7919+3);if(!M.flaw&&M.q>.5)plain=M;}
  B2.mgr={id:plain.id,since:n};
  ok(!!devSpot(B2,"drill",plain),"а обычный — видит");
  /* паникует: после аврала изводит полсклада */
  const B3=bLife();
  G.credits=500000;
  B3.mgr={id:panic.id,since:n-panic.term-1};
  B3.pool={iron:80};
  B3.fire={c:0,r:0,k:"fire",n};
  ok(devStep(B3,n),"ход сделан");
  ok((B3.pool.iron|0)<80,"полсклада ушло на царапину: "+B3.pool.iron);
  ok(B3.log.some(x=>x.k==="panic"),"и это записано");
}));

TEST_SUITES.push(()=>suite("база M407: он снабжает себя сам",()=>{
  const B=bLife();
  G.crew=[];
  B.cells[5]={k:"habitat",hp:1};
  bCrew(B,1);
  G.credits=500000;
  const n=baseShift();
  /* без управляющего никто ничего не заказывает */
  baseLife(B).food=1;baseLife(B).air=1;baseLife(B).water=1;
  eq(devSupply(B,n),0,"без управляющего припас никто не закажет");
  /* хороший заказывает ЗАРАНЕЕ, плохой — когда уже поздно */
  let good=null,poor=null;
  for(let i=0;i<9000&&!(good&&poor);i++){
    const M=bmgrOf(i*7919+3);
    if(!good&&M.q>.8&&!M.flaw)good=M;
    if(!poor&&M.q<.3)poor=M;
  }
  B.mgr={id:good.id,since:n};
  baseLife(B).food=baseLifeNeed(B).food*6;
  ok(devSupply(B,n),"хороший заказал, пока ещё есть");
  ok((B.pool.ice|0)>0,"лёд пришёл");
  B.mgr={id:poor.id,since:n};
  B.pool.ice=0;
  /* и воздух с водой тоже полные: иначе плохой сорвётся на них, а мы меряем
     ИМЕННО дальновидность, а не тревогу */
  baseLife(B).air=LIFE_START;baseLife(B).water=LIFE_START;
  baseLife(B).food=baseLifeNeed(B).food*6;
  eq(devSupply(B,n),0,"плохой в этот момент ещё не чешется");
  baseLife(B).food=1;
  ok(devSupply(B,n),"а когда припёрло — заказывает и он");
}));

/* ── ПАЛАТА (M408) ──
   §28: каждый инструмент мал, вместе они смертельны. §30: брошенная база —
   это ДОЛГ, а не только развалина. Проверяется и арифметика, и эта строка. */
TEST_SUITES.push(()=>suite("база M408: реестр считает всегда",()=>{
  const B=bLife();
  G.crew=[];
  const P=palOf(B);
  eq(P.mode,"common","по умолчанию режим общий — потому что он общий");
  eq(P.debt|0,0,"долга поначалу нет");
  ok(palRegistered(B),"участок в реестре с закладки");
  /* участковый сбор идёт за период, и он не про работу */
  const n=baseShift();
  P.paid=n-PAL_PERIOD;
  ok(palStep(B,n),"период кончился — начислено");
  eq(P.debt|0,PAL_MODES.common.fee,"ровно сбор: "+P.debt);
  ok(B.log.some(x=>x.k==="palfee"),"и это в журнале, словами");
  /* доля с оборота — только сверх порога */
  P.debt=0;B._turn=PAL_FLOOR-10;
  palStep(B,n+1);
  eq(P.debt|0,0,"ниже порога доли нет");
  B._turn=PAL_FLOOR+5000;
  palStep(B,n+2);
  eq(P.debt|0,Math.round(5000*PAL_SHARE),"а выше — ровно процент: "+P.debt);
  /* сводка: не подал — пеня, и никто не пришёл сказать */
  P.debt=0;P.svod=n-PAL_SVOD;
  palStep(B,n+3);
  eq(P.debt|0,PAL_PENY,"пеня за несданную сводку");
  ok(B.log.some(x=>x.k==="palpeny"),"о ней сказано только в журнале");
  /* проверка приходит и всегда что-нибудь находит */
  P.debt=0;
  let m=n+4;while((m%PAL_PERIOD)!==Math.floor(PAL_PERIOD/2))m++;
  palStep(B,m);
  ok((P.debt|0)>0,"инспектор нашёл: "+P.debt+" кр");
  const line=B.log.filter(x=>x.k==="palcheck").pop();
  ok(line&&line.t.indexOf("вежлив")>0,"и был вежлив: "+(line&&line.t));
  ok(line.t.indexOf("Форма")>0,"и назвал форму");
  /* уплата */
  G.credits=100;
  eq(palPay(B),0,"без денег не уплатить");
  G.credits=(P.debt|0)+10;
  const d=P.debt|0;
  eq(palPay(B),d,"уплачено");
  eq(P.debt|0,0,"долга нет");
  eq(G.credits,10,"и деньги ушли");
}));

TEST_SUITES.push(()=>suite("база M408: режим — это выбор, а брошенная база — долг",()=>{
  const B=bLife();
  const P=palOf(B),n=baseShift();
  /* три режима, и у каждого своя честная сделка */
  eq(PAL_MODE_KEYS.length,3,"режима три");
  for(const k of PAL_MODE_KEYS){
    const M=PAL_MODES[k];
    ok(M.ru&&M.note&&M.note.length>20,"у режима «"+M.ru+"» сказано, чем платишь");
    ok(M.fee>0,"и у каждого свой сбор");
  }
  ok(PAL_MODES.patent.fee>PAL_MODES.common.fee,"патент дороже общего в сборе");
  eq(PAL_MODES.patent.share,0,"зато без доли с оборота — в этом весь смысл");
  /* «простой» и правда ограничивает */
  eq(palCapWork(B),1,"на общем потолка нет");
  P.mode="simple";
  for(let i=0;i<3;i++)B.cells[i]={k:"drill",hp:1};
  B.cells[4]={k:"reactor",hp:1};
  ok(palCapWork(B)<1,"на простом три бура не считаются: ×"+palCapWork(B).toFixed(2));
  /* режим меняют не чаще раза в двести смен */
  P.mode="common";P.switched=n;
  eq(palSetMode(B,"patent"),false,"сразу переключить нельзя");
  P.switched=n-PAL_SWITCH;
  ok(palSetMode(B,"patent"),"через двести смен — можно");
  eq(palOf(B).mode,"patent","режим сменился");
  /* ── и самая жестокая строка §30 ── */
  const B2=bLife();
  const P2=palOf(B2);
  B2.ruin={n,who:null};
  for(const c of B2.cells)if(c)c.hp=0;
  P2.debt=0;P2.paid=n-PAL_PERIOD;
  palStep(B2,n);
  ok((P2.debt|0)>0,"развалина продолжает начислять: "+P2.debt+" кр");
  /* снять с учёта — единственный способ это прекратить */
  G.credits=PAL_CLOSE+(P2.debt|0)+50;
  ok(palClose(B2),"сняли с учёта");
  ok(!palRegistered(B2),"участок больше не в реестре");
  P2.paid=n-PAL_PERIOD*2;
  eq(palStep(B2,n+1),0,"и начислять перестало");
  /* а долг, который никто не платит, кончается изъятием */
  const B3=bLife();
  const P3=palOf(B3);
  P3.debt=PAL_SEIZE;
  palStep(B3,n);
  ok(typeof baseIsRuin==="function"&&baseIsRuin(B3),"участок изъят за долг");
  eq(B3.ruin.who,"pal","и въехала в него сама ПАЛАТА");
  ok(B3.log.some(x=>x.k==="palseize"),"с описью");
}));

/* ── опорный пункт экспедиции (M409) ──
   §44: экспедицию нельзя снарядить с одних станций. Проверяется, что пункт —
   это ТРЕБОВАНИЯ К МЕСТУ, а не кнопка, и что платят за него не деньгами. */
TEST_SUITES.push(()=>suite("база M409: опорный пункт — это место, а не награда",()=>{
  const B=bLife();
  G.crew=[];
  /* без экспедиции никакого пункта нет */
  G.exp=null;
  eq(fwdBase(),null,"пока экспедиции нет — и пункта нет");
  eq(fwdLineOf(B),"","и на столе про это ни слова");
  /* требования: площадка, мачта, жильё, воздух, вода и хотя бы двое людей */
  G.exp={phase:1,day0:0,coll:{},gone:[],gave:0,pax:null};
  ok(expOn(),"экспедиция идёт");
  ok(!fwdFits(B),"обычная база не годится");
  const miss=fwdMissing(B);
  ok(miss.length>=3,"и сказано, чего не хватает: "+miss.join(", "));
  for(const k in FWD_NEED)ok(!!BUILD[k],"требование «"+k+"» — настоящий модуль");
  /* собираем годную */
  let i=0;
  for(const k in FWD_NEED)B.cells[i++]={k,hp:1};
  B.cells[i++]={k:"reactor",hp:1};B.cells[i++]={k:"reactor",hp:1};
  /* адрес двигаем ДО того, как заводим людей: экипаж привязан приказом к
     координатам базы, и переезд без них оставляет базу без людей */
  B.sx=12;B.sy=3;
  bCrew(B,2);
  const L=baseLife(B);L.air=100;L.water=100;L.food=100;
  ok(fwdFits(B),"теперь годится: "+fwdMissing(B).join(",")||"—");
  /* но коридор решает: близко к центру — не годится */
  ok(fwdCorridor(B),"дальше девяти — тот коридор");
  const near={sx:1,sy:1,cells:B.cells,idx:B.idx,type:B.type,pool:{},life:baseLife(B)};
  ok(!fwdCorridor(near),"а у центра — не тот");
  /* пункт находится и объявляется один раз */
  const F=fwdBase();
  ok(!!F,"пункт выбран");
  ok(fwdIs(B),"и это наша база");
  const line=fwdLine(B);
  ok(line.indexOf("опорный пункт")>0&&line.indexOf(String(B.sx))>0,"циркуляр называет её и адрес: "+line);
  const n=baseShift()-(baseShift()%FWD_PAY_EVERY);
  ok(fwdAnnounce(B,n),"объявлено");
  eq(fwdAnnounce(B,n),0,"и второй раз не объявляется");
  ok(B.log.some(x=>x.k==="fwd"),"в журнале это есть");
  /* платят не деньгами: борт садится, платит за приём — и ест */
  const cr=G.credits,f0=L.food,w0=L.water;
  ok(fwdStep(B,n),"борт сел");
  ok(G.credits>cr,"за приём заплатили: +"+(G.credits-cr));
  ok(L.food<f0&&L.water<w0,"и поели с нашего склада: харч "+f0+"→"+L.food);
  ok(B.log.some(x=>x.k==="fwdpay"),"и это записано");
  /* на пустых складах борт не садится: кормить нечем */
  L.food=0;L.water=0;
  const cr2=G.credits;
  fwdStep(B,n+FWD_PAY_EVERY);
  eq(G.credits,cr2,"кормить нечем — и приёма нет");
  /* развалина и консервация пунктом не бывают */
  L.food=100;L.water=100;
  basePark(B,"hand",n);
  ok(!fwdFits(B),"на консервации — не пункт");
  baseWake(B,n,"hand");
  B.ruin={n,who:null};
  ok(!fwdFits(B),"и развалина — не пункт");
  B.ruin=null;
  G.exp=null;
}));
