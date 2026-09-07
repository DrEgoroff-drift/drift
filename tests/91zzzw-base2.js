/* ══════════════ база: наборы M396–M401 ══════════════
   Продолжение `91zzzw-base.js`: соседство и залы, директор, аврал, устав,
   формуляр планеты и девять законов. Помощники (`bLife`, `bCrew`, `bNoDir`)
   объявлены в первом файле — он и склеивается раньше по байтам. Разрезано на
   0.409.0: один файл дорос до ста килобайт, а такой уже не читают целиком. */
/* ── соседство и залы (M396) ──
   Девять правил обязаны быть девятью правилами, а не двумя исключениями в коде:
   каждое видно в таблице, каждое считается по клеткам и каждое что-то меняет. */
TEST_SUITES.push(()=>suite("база M396: девять правил соседства",()=>{
  const B=bLife();
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  /* таблица честная: у каждого правила есть и тот, и другой модуль */
  for(const R of ADJ){
    ok(!!BUILD[R.a],"правило «"+R.ru+"»: первый модуль существует — "+R.a);
    for(const b of R.b)ok(b==="*"||!!BUILD[b],"и второй тоже — "+b);
    ok(R.note&&R.note.length>6,"и оно сказано словами: "+R.note);
  }
  eq(ADJ.length,9,"правил ровно девять");
  /* зелень рядом с жильём: дух и воздух */
  B.cells[0]={k:"garden",hp:1};B.cells[1]={k:"habitat",hp:1};
  eq(baseAdjCount(B,"green"),1,"оранжерея рядом с жильём — правило сработало");
  ok(baseAdjSpirit(B)>0,"и дух от этого выше: +"+baseAdjSpirit(B));
  ok(baseAdjAir(B)>0,"и воздуха немного больше");
  /* батарея рядом с жильём — наоборот */
  B.cells[2]={k:"battery",hp:1};
  const withGun=baseAdjSpirit(B);
  ok(withGun<6,"батарея под ухом дух роняет: "+withGun);
  /* подача: ледоплавка рядом с электролизёром */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"melter",hp:1};B.cells[1]={k:"lyse",hp:1};
  eq(baseAdjIce(B),1,"ледоплавка подаёт электролизёру");
  /* вытяжка: только в одной колонке, а не вбок */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"radiator",hp:1};B.cells[1]={k:"reactor",hp:1};
  eq(baseAdjHeat(B),0,"бок о бок вытяжки нет");
  B.cells[1]=null;B.cells[BASE_COLS]={k:"reactor",hp:1};
  ok(baseAdjHeat(B)<0,"а друг над другом — есть: "+baseAdjHeat(B));
  /* склад под боком */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"drill",hp:1};
  eq(baseAdjMine(B),1,"без склада прибавки нет");
  B.cells[1]={k:"storage",hp:1};
  ok(baseAdjMine(B)>1,"со складом рядом успевает лечь больше: ×"+baseAdjMine(B).toFixed(2));
  /* мастерская чинит соседа вдвое быстрее */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"shop",hp:1};B.cells[1]={k:"drill",hp:.5};
  eq(baseAdjFix(B),2,"у мастерской сосед чинится вдвое быстрее");
  /* разбитый отсек в правилах не участвует */
  B.cells[0].hp=0;
  eq(baseAdjFix(B),1,"разбитая мастерская не чинит никого");
  /* и строка для сцены не врёт */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"garden",hp:1};B.cells[1]={k:"habitat",hp:1};
  ok(baseAdjLine(B).indexOf("зелень")>=0,"строка называет то, что есть: "+baseAdjLine(B));
}));

TEST_SUITES.push(()=>suite("база M396: зал из трёх — и беда на всех троих",()=>{
  const B=bLife();
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"storage",hp:1};B.cells[1]={k:"storage",hp:1};
  eq(baseHalls(B).length,0,"двух мало");
  B.cells[2]={k:"storage",hp:1};
  eq(baseHalls(B).length,1,"три подряд — зал");
  eq(baseHalls(B)[0].k,"storage","и он знает, из чего собран");
  ok(!!baseHallAt(B,1,0),"средняя клетка в зале");
  ok(!baseHallAt(B,3,0),"а соседняя — нет");
  /* четыре подряд — это зал и ещё один, а не полтора зала */
  B.cells[3]={k:"storage",hp:1};
  eq(baseHalls(B).length,1,"четвёртый не делает второго зала");
  /* разные модули залом не становятся */
  B.cells[1]={k:"drill",hp:1};
  eq(baseHalls(B).length,0,"разные подряд — не зал");
  /* энергия: зал ест на треть меньше */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"lyse",hp:1};B.cells[1]={k:"lyse",hp:1};
  const two=basePower(B).cons;
  B.cells[2]={k:"lyse",hp:1};
  const three=basePower(B).cons;
  ok(three<two/2*3,"зал из трёх ест меньше трёх одиночек: "+three+" против "+(two/2*3));
  near(three,two/2*3*HALL_POWER,.6,"и меньше ровно на треть");
  /* беда берёт зал целиком */
  B.cells[0].hp=1;B.cells[1].hp=1;B.cells[2].hp=1;
  const n=baseHallHit(B,1,0,.5);
  eq(n,2,"удар по средней достался двум соседям");
  ok(B.cells[0].hp<1&&B.cells[2].hp<1,"и они и правда побиты");
  eq(baseHallHit(B,4,0,.5),0,"а вне зала бить некого");
}));

/* ── директор (M397) ──
   Три правила §10: он предупреждает, он принадлежит планете, и беда у него
   ходит. Всё это — чистые функции от номера смены, иначе прогноза не бывает. */
TEST_SUITES.push(()=>suite("база M397: погода вместо костей",()=>{
  const B=bLife();
  /* таблица честная: у каждого события есть слово предупреждения и свои миры */
  for(const e of DIR_EV){
    ok(e.warn&&e.warn.length>6,"у события «"+e.ru+"» есть предупреждение: "+e.warn);
    ok(e.w>0&&Array.isArray(e.worlds)&&e.worlds.length,"и вес с мирами: "+e.ru);
  }
  /* доброе — четверть по весу, и на КАЖДОМ мире: у миров разное число бед,
     и постоянные веса доброго дали бы на земной две пятых, а на каменистой треть */
  for(const w of ["terran","rocky","ice","desert","volcanic","toxic","ocean","gas"]){
    B.type=w;
    near(dirGoodShare(B),.25,.02,"на мире «"+w+"» доброго четверть: "+dirGoodShare(B).toFixed(2));
  }
  /* он принадлежит планете */
  B.type="volcanic";
  ok(dirPool(B).some(e=>e.k==="quake"),"на вулкане бывает толчок");
  ok(!dirPool(B).some(e=>e.k==="cold"),"а холодного удара нет");
  B.type="ice";
  ok(dirPool(B).some(e=>e.k==="cold"),"на льду — наоборот");
  ok(dirPool(B).some(e=>e.k==="raid"),"а налёт бывает везде");
  /* беда растёт с тем, что нажито */
  B.type="rocky";
  const bare=baseThreat(B);
  B.pool.iron=900;
  ok(baseWorth(B)>0&&baseThreat(B)>bare,"с нажитым беда чаще: "+bare.toFixed(3)+" → "+baseThreat(B).toFixed(3));
  ok(baseThreat(B)<=.35,"но не выше потолка");
  /* он предупреждает: прогноз на смену вперёд — это то же событие */
  const n=bShift();
  const f=baseForecast(B,n);
  const e=baseEventAt(B,n+1);
  eq(f&&f.k,e&&e.k,"прогноз — это событие следующей смены, а не гадание");
  eq(baseEventAt(B,n+1)&&baseEventAt(B,n+1).k,e&&e.k,"и он повторяется");
  /* на консервации погоды нет */
  basePark(B,"hand",n);
  eq(baseEventAt(B,n+1),null,"вставшая база погоды не видит");
  baseWake(B,n,"hand");
}));

TEST_SUITES.push(()=>suite("база M397: беда ходит, а гермозатвор её держит",()=>{
  const B=bLife();
  G.crew=[];
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"storage",hp:1};B.cells[1]={k:"storage",hp:1};B.cells[2]={k:"storage",hp:1};
  const n=bShift();
  ok(baseFireStart(B,0,0,n),"пожар начался");
  ok(!!B.fire,"и он записан на базе");
  ok(B.log.some(x=>x.k==="fire"),"и в журнале");
  eq(baseFireStart(B,2,0,n),0,"второй пожар разом не начинается");
  /* без людей и без мастерской он идёт дальше и портит отсеки */
  const hp0=B.cells[0].hp;
  baseFireStep(B,n+1);
  ok(B.cells[0].hp<hp0,"горящий отсек портится");
  ok(B.fire.c!==0||B.fire.r!==0,"и огонь перешёл дальше: "+B.fire.c+":"+B.fire.r);
  ok(B.log.some(x=>x.k==="firego"),"о переходе сказано");
  /* гермозатвор держит: между ним и огнём беда не проходит */
  const B2=bLife();
  G.crew=[];
  for(let i=0;i<B2.cells.length;i++)B2.cells[i]=null;
  B2.cells[0]={k:"storage",hp:1};B2.cells[1]={k:"seal",hp:1};B2.cells[2]={k:"storage",hp:1};
  baseFireStart(B2,0,0,n);
  for(let i=0;i<3;i++)baseFireStep(B2,n+i+1);
  ok(!B2.fire||(B2.fire.c===0&&B2.fire.r===0),"через гермозатвор огонь не пошёл");
  ok(B2.cells[2].hp===1,"дальний отсек цел");
  /* инженер тушит */
  const B3=bLife();
  for(let i=0;i<B3.cells.length;i++)B3.cells[i]=null;
  B3.cells[0]={k:"storage",hp:1};B3.cells[5]={k:"habitat",hp:1};
  bCrew(B3,2);
  G.crew[0].role="engineer";G.crew[1].role="engineer";
  baseFireStart(B3,0,0,n);
  let outN=0;
  for(let i=0;i<8&&B3.fire;i++){baseFireStep(B3,n+i+1);outN++;}
  ok(!B3.fire,"двое инженеров потушили за "+outN+" смен");
  ok(B3.log.some(x=>x.k==="fireout"),"и это записано");
}));

TEST_SUITES.push(()=>suite("база M397: у каждой погоды своё последствие",()=>{
  const B=bLife();
  const n=bShift();
  /* занос: бур стоит, и это видно */
  baseEventApply(B,{k:"dust"},n);
  ok(baseDusty(B,n),"занос идёт");
  const ore0=bPool(B);
  B.t0=n-1;
  bNoDir(()=>baseResolve(B,Date.now()));
  eq(bPool(B),ore0,"в занос бур не добывает");
  B.dust=0;
  /* холодный удар: тепло вниз на своё */
  const h0=baseHeat(B,n);
  baseEventApply(B,{k:"cold"},n);
  eq(baseHeat(B,n),h0-20,"холодный удар снял два шага тепла");
  B.cold=0;
  /* жила: бур идёт легче */
  eq(baseVein(B,n),1,"без жилы обычно");
  baseEventApply(B,{k:"vein"},n);
  ok(baseVein(B,n)>1,"с жилой веселее: ×"+baseVein(B,n));
  B.vein=0;
  /* выброс: половина воздуха */
  baseLife(B).air=100;
  baseEventApply(B,{k:"vent"},n);
  eq(baseLife(B).air,50,"выброс забрал половину воздуха");
  /* баржа: доброе событие и правда даёт */
  const p0=bPool(B);
  baseEventApply(B,{k:"barge"},n);
  ok(bPool(B)>p0,"баржа оставила груз: +"+(bPool(B)-p0));
  /* толчок бьёт по отсеку */
  const hp0=B.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  baseEventApply(B,{k:"quake"},n);
  ok(B.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0)<hp0,"толчок разбил отсек");
  /* новичок приходит и ждёт */
  B.guest=null;
  baseEventApply(B,{k:"newman"},n);
  ok(!!B.guest,"человек со стороны пришёл: "+(B.guest&&B.guest.name));
}));

/* ── аврал (M398) ──
   Единственное место слоя, где время настоящее. Проверяется то, что делает его
   игрой, а не роликом: дойти, подержать, успеть — и что провал не смертелен. */
TEST_SUITES.push(()=>suite("база M398: аврал — руки против времени",()=>{
  const B=bLife();
  B.cells[1]={k:"storage",hp:1};B.cells[4]={k:"reactor",hp:1};
  G.crew=[];
  const S={cur:0,row:0,avr:null,avrDone:0};
  /* виды беды названы и различны */
  eq(AVR_KINDS.length,3,"три вида беды");
  const seen={};
  for(const k of AVR_KINDS){
    ok(k.ru&&k.note,"у «"+k.k+"» есть имя и слово: "+k.ru);
    ok(!seen[k.ru],"и они не повторяются");seen[k.ru]=1;
  }
  /* аврал ставится руками — и он занимает сцену целиком */
  S.avr={c:0,r:0,k:"fire",t:AVR_TIME,hold:0};
  ok(avrTick(S,B,1,false),"пока горит, сцена занята этим");
  ok(G.prompt.indexOf("АВРАЛ")===0,"и говорит об этом первой строкой: "+G.prompt.split("\n")[0]);
  /* держать надо ТАМ: в другом отсеке кнопка ничего не даёт */
  S.cur=1;
  const h0=S.avr.hold;
  avrTick(S,B,10,true);
  eq(S.avr.hold,h0,"из соседнего отсека не потушишь");
  /* пришёл и подержал — потушил */
  S.cur=0;
  let win=false;
  for(let i=0;i<40&&S.avr;i++)win=avrTick(S,B,10,true)===false||!S.avr;
  ok(!S.avr,"дошёл, подержал — потушил");
  ok(B.log.some(x=>x.k==="avrok"),"и это в журнале");
  /* руки: люди и мастерская держат вместе с вами */
  const A={c:0,r:0,k:"fire",t:AVR_TIME,hold:0};
  const bare=avrHands(B,A);
  B.cells[1]={k:"shop",hp:1};
  ok(avrHands(B,A)>bare,"мастерская под боком помогает: "+bare+" → "+avrHands(B,A));
  /* не успел — беда идёт дальше, но никто не умер */
  const S2={cur:2,row:0,avr:{c:0,r:0,k:"fire",t:1,hold:0},avrDone:1};
  const hp0=B.cells[0].hp;
  avrTick(S2,B,10,false);
  eq(S2.avr,null,"время вышло");
  ok(B.cells[0].hp<hp0,"отсек побит");
  ok(!!B.fire,"и беда стала ходячей — той самой из §10.3");
  ok(B.log.some(x=>x.k==="avrno"),"о провале сказано");
  eq(G.crew.length,0,"и никто не погиб: аврал — про вещи, а не про людей");
}));

/* ── устав (M399) ──
   Четыре закона, каждый навсегда, каждый с ценой другой природы. Проверяется
   и то, что они дают, и то, что берут, — второе важнее. */
TEST_SUITES.push(()=>suite("база M399: четыре закона, и каждый навсегда",()=>{
  const B=bLife();
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  /* таблица честная */
  eq(CHARTER.length,4,"законов четыре");
  eq(CHARTER_AT.length,4,"и у каждого своя ступень");
  for(const L of CHARTER){
    ok(L.ru&&L.gives&&L.costs,"у закона «"+L.ru+"» сказано и что даёт, и чего стоит");
    ok(L.costs.length>6,"и цена не отписка: "+L.costs);
  }
  /* открываются ростом базы, а не деньгами */
  eq(charterSlots(B),0,"на пустой базе устава нет");
  eq(charterTake(B,"double"),false,"и взять нечего");
  B.cells[0]={k:"reactor",hp:1};B.cells[1]={k:"drill",hp:1};
  eq(charterBuilt(B),2,"два отсека построено");
  eq(charterSlots(B),1,"открылась первая ступень");
  ok(charterTake(B,"double"),"закон принят");
  ok(charterHas(B,"double"),"и он у базы есть");
  eq(charterTake(B,"pot"),false,"второй сразу не берут: ступень одна");
  eq(charterFree(B),0,"свободных мест нет");
  /* и обратно его не отдать: в модуле нет такой функции вовсе */
  eq(typeof charterDrop,"undefined","закон нельзя отменить — этого просто нет");
  /* растём — открывается следующая */
  B.cells[2]={k:"storage",hp:1};B.cells[3]={k:"habitat",hp:1};
  eq(charterSlots(B),2,"вторая ступень на четырёх отсеках");
  ok(charterTake(B,"pot"),"второй закон принят");
  /* ── что они делают ── */
  ok(charterWorkMul(B)>1,"двойная смена гонит выработку: ×"+charterWorkMul(B).toFixed(2));
  ok(charterWorkMul(B)<1.25,"а общий котёл её придерживает");
  ok(charterSpirit(B)<0,"и за это платят духом: "+charterSpirit(B));
  ok(charterThreatMul(B)>1,"беды к такой базе ходят чаще: ×"+charterThreatMul(B));
  ok(charterFed(B),"общий котёл кормит всех");
  /* сухой закон чинит вдвое */
  const B2=bLife();
  eq(charterFixMul(B2),1,"без сухого закона ремонт обычный");
  B2.charter=["dry"];
  eq(charterFixMul(B2),2,"с ним — вдвое быстрее");
  ok(charterSpirit(B2)<0,"и дух ниже: "+charterSpirit(B2));
  /* открытая дверь: вдвое чаще гости, и один из шести — не тот */
  const B3=bLife();
  eq(charterGuestMul(B3),1,"без двери как обычно");
  B3.charter=["door"];
  eq(charterGuestMul(B3),2,"с дверью вдвое охотнее идут");
  let bad=0,all=0;
  for(let s=0;s<600;s++){all++;if(charterBadGuest(B3,s))bad++;}
  near(bad/all,1/6,.05,"и один из шести — не тот: "+(bad/all).toFixed(2));
  eq(charterBadGuest(bLife(),1),0,"а без двери таких не бывает вовсе");
  /* недосчёт приходит позже и один раз */
  const B4=bLife();
  B4.pool={iron:90};
  B4.thief=baseShift();
  ok(charterThiefStep(B4,baseShift()),"со склада пропало");
  ok((B4.pool.iron|0)<90,"и правда меньше: "+B4.pool.iron);
  eq(charterThiefStep(B4,baseShift()),0,"второй раз не пропадает");
  ok(B4.log.some(x=>x.k==="thief"),"и это записано в журнал");
}));

/* ── формуляр планеты (M400) ──
   Восемь ручек, все выводятся, ничего не хранится. И главное чтение §21.2:
   даровое на мире — никогда не то, что делает его богатым. */
TEST_SUITES.push(()=>suite("база M400: планета и есть сложность",()=>{
  resetWorld();
  G.sx=0;G.sy=0;
  /* таблица честная: у каждого мира все восемь ручек и в своих границах */
  for(const w in DIAL_WORLD){
    const D=baseDial(3,4,0,w);
    for(const k of DIAL_KEYS)ok(typeof D[k]==="number","у мира «"+w+"» есть ручка "+k);
    ok(D.heat>=-3&&D.heat<=3,"тепло в границах: "+w+" "+D.heat.toFixed(1));
    ok(D.ore>=1&&D.ore<=5,"порода в границах: "+w+" "+D.ore);
    ok(D.light>=0&&D.light<=2,"свет в границах: "+w);
  }
  /* характер миров — тот, что описан в §21.2 */
  ok(baseDial(3,4,0,"volcanic").heat>baseDial(3,4,0,"ice").heat,"вулкан теплее льда");
  ok(baseDial(3,4,0,"ice").ice>baseDial(3,4,0,"desert").ice,"на льду лёд даром, в пустыне нет");
  ok(baseDial(3,4,0,"desert").wind>baseDial(3,4,0,"terran").wind,"в пустыне дует сильнее");
  ok(baseDial(3,4,0,"toxic").press>baseDial(3,4,0,"rocky").press,"на ядовитой воздух уходит");
  ok(baseDial(3,4,0,"toxic").ore>baseDial(3,4,0,"terran").ore,"и порода там богаче, чем на земной");
  /* тот же адрес — тот же формуляр, и он не хранится в сейве */
  const a=baseDial(3,4,0,"rocky"),b2=baseDial(3,4,0,"rocky");
  eq(a.ore,b2.ore,"формуляр не гуляет между вызовами");
  const snap=JSON.stringify(snapshot());
  ok(snap.indexOf("_dial")<0,"и в сохранение он не попадает");
  /* участок: две базы на одной планете — не одна и та же база */
  const c=baseDial(3,4,1,"rocky");
  ok(a.ore!==c.ore||a.ice!==c.ice||a.heat!==c.heat,"у соседнего участка формуляр свой");
  /* ── разведка: три слова, зонд, замер ── */
  G.probed={};
  eq(dialLevel(3,4,0),1,"с орбиты — первый уровень");
  const w1=dialLine(3,4,0);
  ok(w1.indexOf("ОРБИТЫ")>=0,"и это три слова: "+w1);
  ok(!/\d/.test(w1.replace(/[^\d]/g,"")),"без единого числа");
  G.credits=1000;
  ok(probeBuy(3,4,0),"зонд куплен");
  eq(G.credits,1000-PROBE_COST,"и стоил он своих денег");
  eq(dialLevel(3,4,0),2,"второй уровень");
  const w2=dialLine(3,4,0);
  ok(w2.indexOf("ЗОНД")>=0&&/\d/.test(w2),"зонд даёт числа: "+w2);
  eq(w2.split("·").length-1>=PROBE_SHOW-1,true,"и их пять");
  ok(w2.indexOf("порода")<0,"но не все восемь: порода остаётся на высадку");
  ok(probeBuy(3,4,0),"второй раз зонд не покупают");
  eq(G.credits,1000-PROBE_COST,"и денег он больше не берёт");
}));

TEST_SUITES.push(()=>suite("база M400: ручки и правда крутят",()=>{
  const B=bLife();
  const key=B.sx+","+B.sy+":"+B.idx+":"+B.type;
  const set=o=>{G._dial[key]=Object.assign({heat:0,light:1,press:0,grav:1,wind:0,
    quake:0,ice:0,ore:2,type:B.type,key:"тест"},o);};
  /* тепло: основание идёт от формуляра */
  set({heat:2});
  const hot=baseHeat(B);
  set({heat:-2});
  ok(baseHeat(B)<hot,"тёплая ручка греет базу: "+baseHeat(B)+" против "+hot);
  eq(hot-baseHeat(B),40,"и ровно на свою разницу в десятых");
  /* давление: воздух уходит сам */
  set({press:0});
  bCrew(B,2);
  eq(dialLeak(B),0,"без давления не течёт");
  set({press:2});
  ok(dialLeak(B)>0,"с давлением уходит: "+dialLeak(B)+" за смену");
  baseLife(B).air=100;
  B.t0=baseShift()-1;
  bNoDir(()=>baseResolve(B,Date.now()));
  ok(baseLife(B).air<100-2*LIFE_AIR,"и это сверх того, что надышали");
  /* лёд: на ледяном мире ледоплавке нужно меньше */
  set({ice:2});
  ok(dialIceFree(B),"на ледяном мире вода почти даром");
  set({ice:0});
  ok(!dialIceFree(B),"а в пустыне нет");
  /* тяжесть: дороже строить, лучше бурить */
  set({grav:2});
  const heavy=baseCost("storage",B).credits;
  set({grav:.5});
  ok(baseCost("storage",B).credits<heavy,"на лёгком мире стройка дешевле: "+
    baseCost("storage",B).credits+" против "+heavy);
  /* порода: богатая даёт больше */
  set({ore:5});
  const rich=dialOreMul(B);
  set({ore:1});
  ok(dialOreMul(B)<rich,"бедная порода даёт меньше: "+dialOreMul(B).toFixed(2)+" против "+rich.toFixed(2));
  /* свет: панель на тусклом мире почти бесполезна */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[0]={k:"solar",hp:1};
  set({light:2});
  const bright=basePower(B).prod;
  set({light:.2});
  ok(basePower(B).prod<bright,"на тусклом мире панель даёт меньше: "+
    basePower(B).prod+" против "+bright);
}));

/* ── девять законов (M401) ──
   Проверяются три достроенных: сведения покупаются, изнашивается всё, люди —
   не множители. И сторож над всеми: игрок обязан мочь сказать, что не так. */
TEST_SUITES.push(()=>suite("база M401: сведения покупаются",()=>{
  const B=bLife();
  B.cells[5]={k:"habitat",hp:1};B.cells[6]={k:"habitat",hp:1};
  bCrew(B,2);
  baseLife(B).air=100;baseLife(B).water=100;baseLife(B).food=40;
  /* без радиста и с казённым приёмником — слова, а не цифры: рычаг стоит на
     заводе прибора, а не на числе разрешения (разбор 0.409.1) */
  G.instrKit=null;
  for(const id of INSTR_KEYS)instrUnit(id).wear=1;      /* приборы стёрты вконец */
  eq(baseSharp(B),0,"ни радиста, ни приборов");
  const words=baseGaugeLine(B);
  ok(words.indexOf("—")>0,"шкалы говорят словами: "+words);
  ok(!/\d/.test(words),"и ни одной цифры");
  /* радист возвращает цифры */
  G.crew[0].role="radist";
  ok(baseSharp(B)>=1,"радист есть");
  const nums=baseGaugeLine(B);
  ok(/\d/.test(nums),"с ним шкалы в цифрах: "+nums);
  /* прогноз: без сведений примета, с ними — событие и срок */
  const n=bShift();
  const w1=baseWarnLine(B,n);
  G.crew[1].role="radist";
  for(const id of INSTR_KEYS)instrUnit(id).wear=0;
  instrUnit("radio").w="vekha";        /* купленный приёмник, а не казённый */
  ok(baseSharp(B)>=2,"и радист, и приборы");
  const w2=baseWarnLine(B,n);
  if(w1&&w2)ok(w2.indexOf("СМЕН")>0||w2!==w1,"со сведениями прогноз точнее: «"+w1+"» → «"+w2+"»");
  else ok(true,"в эту смену прогноза нет вовсе");
}));

TEST_SUITES.push(()=>suite("база M401: изнашивается всё, и люди не множители",()=>{
  const B=bLife();
  /* закон 4: ровный износ есть всегда */
  const hp0=B.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  const n=bShift();
  for(let i=0;i<10;i++)baseWearStep(B,n+i);
  const worn=hp0-B.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  ok(worn>0,"за десять смен что-то стёрлось: "+worn.toFixed(3));
  ok(worn<10*WEAR_BASE*2+.5,"но не больше, чем обещано");
  /* закон 5: черты выводятся из семени и не хранятся */
  const c={seed:12345};
  const t1=crewBaseTraits(c),t2=crewBaseTraits(c);
  eq(t1.length,t2.length,"черты у человека не гуляют");
  if(t1.length)eq(t1[0].id,t2[0].id,"и это те же самые");
  let with_=0;
  for(let s=0;s<400;s++)if(crewBaseTraits({seed:s}).length)with_++;
  ok(with_>60&&with_<300,"черта есть не у всех и не у одного: "+with_+" из 400");
  for(const T of CREW_BASE_TRAITS)ok(T.ru&&T.note,"у черты «"+T.ru+"» сказано, что она значит");
  /* и они и правда роняют дух — каждая по своей причине */
  const B2=bLife();
  for(let i=0;i<8;i++)B2.cells[i]={k:"habitat",hp:1};
  G.crew=[];
  let found=null;
  for(let s=1;s<200&&!found;s++)if(crewBaseHas({seed:s},"tight"))found=s;
  ok(found!==null,"нашёлся боящийся тесноты");
  if(found!==null){
    G.crew=[{name:"Тесный",role:"driller",spec:"mine",lvl:1,morale:1,seed:found,
      trips:0,state:null,traits:[],xp:10,cargo:{},
      order:{kind:"base",sx:B2.sx,sy:B2.sy,idx:B2.idx}}];
    ok(baseTraitSpirit(B2)<0,"на большой базе ему тяжело: "+baseTraitSpirit(B2));
  }
}));

TEST_SUITES.push(()=>suite("база M401: игрок всегда может сказать, что не так",()=>{
  const B=bLife();
  G.crew=[];
  eq(baseWhy(B),"людей нет — база просто стоит","пустая база объясняет себя");
  B.cells[5]={k:"habitat",hp:1};
  bCrew(B,1);
  const L=baseLife(B);
  L.air=200;L.water=200;L.food=200;L.q="good";
  B.cells[3]={k:"radiator",hp:1};
  ok(baseWhy(B).indexOf("в порядке")>=0,"на здоровой базе так и сказано: "+baseWhy(B));
  /* и каждая беда называется своим словом */
  L.food=0;
  ok(baseWhy(B).indexOf("нечего есть")>=0,"голод назван: "+baseWhy(B));
  L.air=1;L.water=1;
  ok(baseWhy(B).indexOf("воздух")>=0,"и воздух тоже");
  basePark(B,"hand",baseShift());
  ok(baseWhy(B).indexOf("приказу")>=0,"и консервация — тоже причина: "+baseWhy(B));
  ok(baseWhy(B).indexOf("undefined")<0,"и нигде не мусор");
}));
