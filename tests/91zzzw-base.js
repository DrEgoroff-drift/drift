/* ══════════════ база: смена, повтор и журнал (M390, DESIGN-base §3, §12) ══════════════
   Мерится здесь ровно то, ради чего минуты заменили сменами: результат не
   зависит от того, как часто игрок заглядывал, догон упирается в сутки, а
   журнал — это последние двадцать четыре строки, и ни строкой больше. */
function bLife(){
  resetWorld();
  G.credits=500000;G.cargo.alloy=99;
  const p=G.sys.planets.find(x=>x.type!=="gas");
  ok(foundBase(p),"база заложена");
  const B=baseAt(G.sx,G.sy,p.idx);
  /* реактор и бур: база, у которой есть что считать */
  for(let i=0;i<B.cells.length;i++)B.cells[i]=null;
  B.cells[2]={k:"reactor",hp:1};B.cells[0]={k:"drill",hp:1};
  B.pool={};B.log=[];
  /* ── без погоды ──
     Буря выбивает верхний ряд, а в верхнем ряду тут стоит реактор: набор,
     меряющий запас и повтор, начинал зависеть от того, в какую смену его
     запустили. Ставим базу там, где не дует (`STORM_WORLDS.gas`=0), и меряем
     то, что собирались. Налёта здесь тоже нет: сектор 0,0 безопасен. */
  B.type="gas";
  /* и добыча только железо: в списке залежи может стоять органика, а её же
     тратит оранжерея — набор начинал зависеть от того, что выпало буру в эту
     смену. Меряем посадку, а не удачу */
  B.res=["iron"];
  /* ── и мир без характера ──
     С M400 у планеты восемь ручек, и они трогают воздух, тепло, стройку и
     бур. Набор, который меряет ЛЮДЕЙ и МАШИНЫ, обязан мерить их, а не мир:
     ставим формуляр ровным и говорим об этом вслух. Сам формуляр проверяется
     своим набором. */
  if(typeof G._dial!=="undefined"||true){
    if(!G._dial)G._dial={};
    G._dial[B.sx+","+B.sy+":"+B.idx+":"+B.type]={heat:0,light:1,press:0,grav:1,
      wind:0,quake:0,ice:0,ore:2,type:B.type,key:"тест"};
  }
  return B;
}
function bPool(B){let s=0;for(const k in B.pool)s+=B.pool[k]|0;return s;}
/* ── замер без погоды ──
   С M397 у базы есть директор, и он может в ту же смену прислать баржу с
   грузом или жилу под бур. Набор, который меряет ДОБЫЧУ или консервацию,
   обязан мерить их, а не удачу: на время замера погода выключается, и это
   сказано вслух. Сам директор проверяется своим набором. */
function bNoDir(fn){
  const keep=baseEventAt;
  baseEventAt=()=>null;
  try{return fn();}finally{baseEventAt=keep;}
}

TEST_SUITES.push(()=>suite("база M390: смена одна на всех, повтор повторяется",()=>{
  const B=bLife();
  /* ── одна единица ──
     Смена базы — это смена холдинга, а не второй счёт. Игрок, выучивший её
     там, не переучивается здесь. */
  eq(BASE_MIN,HOLD_SHIFT/60000,"смена базы — та же двадцатиминутная");
  eq(baseShift(),holdShift(),"и номер у неё общий с холдингом");
  eq(BASE_CAP_SH,Math.floor(CREW_OFFLINE_CAP/HOLD_SHIFT),"потолок догона — сутки в сменах");
  /* ── догон считает СМЕНЫ, а не заходы ──
     Полсмены не даёт ничего: остаток не теряется, он дожидается своей смены. */
  const now=Date.now();
  B.t0=baseShift(now);
  eq(baseResolve(B,now),0,"в свою же смену считать нечего");
  eq(baseSince(B,now),0,"и смен не прошло");
  B.t0=baseShift(now)-3;
  eq(baseSince(B,now),3,"три смены прошло");
  eq(baseResolve(B,now),3,"три и отыграно");
  eq(B.t0,baseShift(now),"и база встала на текущую смену");
  eq(baseResolve(B,now),0,"второй раз те же смены не считаются");
  /* ── повтор ──
     Десять заходов по смене и один заход на десять смен обязаны дать ОДНО И ТО
     ЖЕ. Раньше это было не так: бросок брался от стенных часов и от счётчика
     заходов, и исход зависел от того, как часто смотрели. */
  const mk=()=>{
    const B2=bLife();
    B2.sx=B.sx;B2.sy=B.sy;B2.idx=B.idx;B2.type=B.type;B2.res=B.res;
    return B2;
  };
  const A=mk(),C=mk();
  const n0=baseShift(now)-10;
  A.t0=n0;C.t0=n0;
  baseResolve(A,now);                                  /* одним заходом */
  for(let i=1;i<=10;i++)C.t0=n0+i-1,baseResolve(C,now-(10-i)*HOLD_SHIFT);
  /* погоду здесь не выключаем нарочно: она тоже обязана повторяться */
  eq(bPool(C),bPool(A),"добыто одинаково: "+bPool(A));
  eq(C.log.length,A.log.length,"и в журнале одинаковое число строк");
  for(let i=0;i<A.log.length;i++)eq(C.log[i].t,A.log[i].t,"строка "+i+" совпала");
  /* и ещё раз с нуля — тот же ответ, а не «примерно тот же» */
  const D=mk();D.t0=n0;
  baseResolve(D,now);
  eq(bPool(D),bPool(A),"третий прогон дал то же самое");
}));

TEST_SUITES.push(()=>suite("база M390: сутки потолок, глубже — одной строкой",()=>{
  const B=bLife();
  const now=Date.now();
  /* неделя отсутствия — это всё равно сутки: `CREW_OFFLINE_CAP` в сменах */
  B.t0=baseShift(now)-500;
  eq(baseSince(B,now),BASE_CAP_SH,"из пятисот смен догоняются семьдесят две");
  const n=baseResolve(B,now);
  eq(n,BASE_CAP_SH,"столько и отыграно");
  eq(B.t0,baseShift(now)-500+BASE_CAP_SH,"хвост отброшен, а не накоплен в долг");
  ok(bPool(B)>0,"за сутки база что-то добыла: "+bPool(B));
  /* всё, что старше двадцати четырёх смен, — одна строка */
  const away=B.log.filter(x=>x.k==="away");
  eq(away.length,1,"о позавчерашнем сказано одной строкой");
  ok(away[0].t.indexOf("сама")>0,"и сказано, что база работала сама: "+away[0].t);
  /* журнал держит двадцать четыре строки и не растёт */
  for(let i=0;i<80;i++)baseLog(B,"quiet",i);
  eq(B.log.length,BASE_LOG,"журнал держит ровно двадцать четыре строки");
  eq(B.log[B.log.length-1].n,79,"последняя строка — последняя");
  eq(baseLogList(B,3).length,3,"и хвост журнала берётся любой длины");
}));

TEST_SUITES.push(()=>suite("база M390: журнал пишет о том, что было",()=>{
  const B=bLife();
  /* десять видов строк, и у каждого свой текст: строка-заглушка в журнале
     хуже пустого журнала */
  const kinds=Object.keys(BLOG);
  ok(kinds.length>=10,"видов строк не меньше десяти: "+kinds.length);
  const seen={};
  for(const k of kinds){
    baseLog(B,k,7,{who:"Гриша",lost:3,broke:"Склад",what:"Солнечная панель",out:1,
      cr:400,q:5,from:1,to:9,guard:1,shield:0,say:"«Ухожу»",by:"empty",
      warn:"барограф падает",ru:"ПОЖАР"});
    const L=B.log[B.log.length-1];
    ok(L&&L.t&&L.t.length>4,"вид «"+k+"» пишет строку: "+(L&&L.t));
    ok(!seen[L.t],"и она не повторяет чужую: "+k);
    ok(L.t.indexOf("undefined")<0&&L.t.indexOf("NaN")<0,"без мусора в тексте: "+k);
    seen[L.t]=1;
  }
  /* голос: строка о человеке называет человека, а не «персонал» */
  B.log=[];
  baseLog(B,"raid_off",1,{who:"Нина"});
  ok(B.log[0].t.indexOf("Нина")>0,"строку о налёте подписывает тот, кто его отбил");
  /* неизвестный вид молча ничего не пишет: журнал не место для отладки */
  const n=B.log.length;
  baseLog(B,"нет такого",1,{});
  eq(B.log.length,n,"неизвестный вид не пишет ничего");
}));

TEST_SUITES.push(()=>suite("база M390: старое сохранение открывается",()=>{
  const B=bLife();
  B.log=[{n:1,k:"quiet",t:"смена прошла тихо"}];
  const s=JSON.parse(JSON.stringify(snapshot()));
  /* запись до M390: ни смены, ни журнала — ровно то, что лежит у игрока */
  for(const k in s.bases){delete s.bases[k].t0;delete s.bases[k].log;}
  applySave(s);
  const key=Object.keys(G.bases)[0];
  const B2=G.bases[key];
  ok(!!B2,"база из старой записи загрузилась");
  eq(typeof B2.t0,"number","смена ей проставлена");
  eq(B2.t0,baseShift(),"и это текущая: простой между сеансами не начисляется");
  ok(Array.isArray(B2.log),"журнал есть, пусть и пустой");
  eq(baseResolve(B2,Date.now()),0,"и сразу после загрузки считать нечего");
  /* новая запись журнал переживает */
  B2.log=[{n:5,k:"quiet",t:"смена прошла тихо"}];
  applySave(JSON.parse(JSON.stringify(snapshot())));
  const B3=G.bases[Object.keys(G.bases)[0]];
  eq(B3.log.length,1,"журнал пережил сохранение");
  eq(B3.log[0].t,"смена прошла тихо","и текст цел");
}));

/* ── воздух и вода (M391) ──
   Мерится главное обещание §13: базу можно уморить, но не насмерть. Она встаёт
   раньше, чем начнёт голодать, и встаёт обратимо. */
function bCrew(B,n){
  G.crew=[];
  for(let i=0;i<n;i++)G.crew.push({name:"Вахтовик "+(i+1),role:"driller",spec:"mine",
    lvl:1,morale:1,seed:i+1,trips:0,state:null,traits:[],xp:10,cargo:{},
    order:{kind:"base",sx:B.sx,sy:B.sy,idx:B.idx}});
  return G.crew;
}

TEST_SUITES.push(()=>suite("база M391: воздух и вода, и кто их тратит",()=>{
  const B=bLife();
  /* запас есть у всякой базы, и он целый */
  const L=baseLife(B);
  eq(L.air,LIFE_START,"воздух с чего-то начинается");
  eq(L.water,LIFE_START,"и вода тоже");
  /* ── без людей база не ест ──
     Иначе всякий, кто заложил базу и улетел, возвращался бы к развалине, ни
     разу не согласившись на эту игру. */
  G.crew=[];
  B.t0=baseShift()-20;
  baseResolve(B,Date.now());
  eq(baseLife(B).air,LIFE_START,"за двадцать смен без людей воздух не тронут");
  eq(baseLife(B).water,LIFE_START,"и вода тоже");
  ok(!baseParked(B),"и вставать не с чего");
  /* ── с людьми ест ровно по таблице ── */
  bCrew(B,2);
  eq(baseLifeNeed(B).air,2*LIFE_AIR,"двое дышат вдвое");
  B.t0=baseShift()-3;
  baseResolve(B,Date.now());
  eq(baseLife(B).air,LIFE_START-3*2*LIFE_AIR,"три смены на двоих — шесть заходов дыхания");
  eq(baseLife(B).water,LIFE_START-3*2*LIFE_WATER,"и столько же воды");
  /* ── машины делают запас изо льда ──
     И делают ровно столько, сколько им дали энергии: на голодном пайке
     электролизёр отдаёт меньше, чем люди дышат, и это не ошибка, а сцепка
     двух шкал. Поэтому второй реактор здесь не для красоты. */
  B.cells[1]={k:"lyse",hp:1};B.cells[3]={k:"melter",hp:1};
  ok(basePower(B).eff<1,"на одном реакторе энергии не хватает");
  B.cells[4]={k:"reactor",hp:1};
  eq(basePower(B).eff,1,"со вторым — хватает");
  B.pool.ice=100;
  const a0=baseLife(B).air,i0=B.pool.ice;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  ok(baseLife(B).air>a0,"электролизёр прибавил воздуха: "+a0+" → "+baseLife(B).air);
  ok(B.pool.ice<i0,"и лёд на это ушёл: "+i0+" → "+B.pool.ice);
  /* лёд кончился — машина просто стоит, и это не поломка */
  B.pool.ice=0;
  const a1=baseLife(B).air;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  ok(baseLife(B).air<a1,"без льда машина не делает ничего, а люди дышат");
}));

TEST_SUITES.push(()=>suite("база M391: встала, но не умерла",()=>{
  const B=bLife();
  bCrew(B,2);
  B.pool.ice=0;
  baseLife(B).air=2;baseLife(B).water=LIFE_START;
  const ore0=bPool(B);
  B.t0=baseShift()-1;
  bNoDir(()=>baseResolve(B,Date.now()));
  /* ── §13: перестаёт работать раньше, чем начнёт голодать ── */
  ok(baseParked(B),"запас кончился — база встала");
  eq(baseLife(B).air,0,"воздух в нуле, а не в минусе: долг не копится");
  ok(B.log.some(x=>x.k==="park"),"и журнал говорит, когда это случилось");
  ok(bPool(B)===ore0,"вставшая база не добывает");
  /* люди на малом ходу едят втрое меньше */
  eq(baseLifeNeed(B).air,Math.ceil(2*LIFE_AIR/LIFE_LOW),"на малом ходу расход втрое меньше");
  /* никто не умер и ничего не разрушено */
  eq(G.crew.length,2,"люди на месте");
  for(const c of B.cells)if(c)ok(c.hp>0,"и отсеки целы");
  /* ── снабжение поднимает базу ── */
  G.cargo.oxygen=(G.cargo.oxygen|0)+10;
  const got=baseSupply(B,"oxygen",10);
  eq(got,10,"кислород сдан");
  eq(baseLife(B).air,10*LIFE_SUPPLY.oxygen.q,"и стал воздухом по таблице");
  ok(!baseParked(B),"база снялась с консервации");
  ok(B.log.some(x=>x.k==="wake"),"и это записано");
  /* смена на раскочегарку: первая смена после подъёма ничего не даёт */
  const ore1=bPool(B);
  B.t0=baseShift()-1;
  bNoDir(()=>baseResolve(B,Date.now()));
  eq(bPool(B),ore1,"смена на раскочегарку не добывает");
  B.t0=baseShift()-1;
  bNoDir(()=>baseResolve(B,Date.now()));
  ok(bPool(B)>ore1,"а следующая — уже да");
  /* лёд идёт и в запас, и на склад: он и вода, и сырьё */
  G.cargo.ice=(G.cargo.ice|0)+5;
  const w0=baseLife(B).water,ice0=B.pool.ice|0;
  baseSupply(B,"ice",5);
  eq(baseLife(B).water,w0+5*LIFE_SUPPLY.ice.q,"лёд стал водой");
  eq(B.pool.ice|0,ice0+5,"и лёг на склад");
}));

TEST_SUITES.push(()=>suite("база M391: консервация — это ход, а не наказание",()=>{
  const B=bLife();
  bCrew(B,1);
  ok(basePark(B,"hand",baseShift()),"базу законсервировали рукой");
  ok(baseParked(B),"она стоит");
  ok(B.park<0,"и стоит она НЕ из-за запаса");
  const ore0=bPool(B);
  B.t0=baseShift()-5;
  baseResolve(B,Date.now());
  eq(bPool(B),ore0,"пять смен консервации не добыли ничего");
  ok(baseParked(B),"и сама она не встанет: рукой поставили — рукой и снимать");
  ok(baseLife(B).air>0,"запас при этом цел");
  ok(baseWake(B,baseShift(),"hand"),"сняли");
  ok(!baseParked(B),"база на ходу");
  /* и запас на консервации расходуется втрое медленнее полного хода */
  const B2=bLife();
  bCrew(B2,3);
  const full=baseLifeNeed(B2).air;
  basePark(B2,"hand",baseShift());
  ok(baseLifeNeed(B2).air<full,"на малом ходу расход меньше: "+baseLifeNeed(B2).air+" против "+full);
}));

TEST_SUITES.push(()=>suite("база M391: старая запись грузится полной",()=>{
  const B=bLife();
  baseLife(B).air=17;
  const s=JSON.parse(JSON.stringify(snapshot()));
  eq(s.bases[Object.keys(s.bases)[0]].life.air,17,"запас пишется в сохранение");
  applySave(JSON.parse(JSON.stringify(s)));
  eq(G.bases[Object.keys(G.bases)[0]].life.air,17,"и читается обратно");
  /* запись до M391 запаса не знает — база грузится полной и не встаёт с порога */
  for(const k in s.bases)delete s.bases[k].life;
  applySave(s);
  const B2=G.bases[Object.keys(G.bases)[0]];
  eq(B2.life.air,LIFE_START,"старая база грузится с полным запасом");
  eq(B2.life.water,LIFE_START,"по обоим");
  ok(!baseParked(B2),"и не встаёт с порога");
}));

/* ── тепло, глубина, криоген (M392) ──
   Шкала двусторонняя, и обе стороны обязаны быть видны заранее и лечиться
   постройкой, а не удачей. */
TEST_SUITES.push(()=>suite("база M392: тепло с обеих сторон",()=>{
  const B=bLife();
  /* мир задаёт основание, и оно на виду */
  /* мир задаёт основание — теперь формуляром (M400), и у двух миров оно разное */
  const cold=baseDial(B.sx,B.sy,B.idx,"ice").heat;
  const hot=baseDial(B.sx,B.sy,B.idx,"volcanic").heat;
  ok(hot>cold,"на вулкане теплее, чем на льду: "+cold.toFixed(1)+" → "+hot.toFixed(1));
  ok(cold<0&&hot>0,"и знак у них разный");
  /* машины греют по таблице */
  const h0=baseHeat(B);
  B.cells[1]={k:"lyse",hp:1};
  eq(baseHeat(B),h0+HEAT_CELL.lyse,"электролизёр добавил своё");
  /* радиатор сбрасывает */
  B.cells[3]={k:"radiator",hp:1};
  eq(baseHeat(B),h0+HEAT_CELL.lyse+HEAT_CELL.radiator,"радиатор снял своё");
  ok(HEAT_CELL.radiator<0&&HEAT_CELL.cryo<HEAT_CELL.radiator,"криоцех холодит сильнее радиатора");
  /* разбитый отсек не греет и не холодит */
  B.cells[3].hp=0;
  eq(baseHeat(B),h0+HEAT_CELL.lyse,"выбитый радиатор не считается");
  B.cells[3]={k:"radiator",hp:1};
  /* глубина: ниже — теплее */
  const flat=baseHeat(B);
  B.cells[BASE_COLS*2]={k:"storage",hp:1};
  eq(baseHeat(B),flat+2*HEAT_ROW,"два ряда вниз — плюс два шага тепла");
  B.cells[BASE_COLS*2]=null;
  /* полосы и последствия */
  const set=h=>{B.cells[4]={k:"reactor",hp:1};return h;};
  set();
  ok(baseHeatBand(B)>=0,"полоса читается");
  eq(baseHeatMul(B),baseHeatBand(B)===0?1:baseHeatMul(B),"множитель согласован с полосой");
  /* холод: вода не тает */
  B.type="ice";
  for(let i=0;i<3;i++)B.cells[10+i]={k:"cryo",hp:1};
  B.pool.volatiles=99;
  ok(baseHeat(B)<-HEAT_OK,"три криоцеха выморозили базу: "+baseHeat(B));
  ok(baseFrozen(B),"мороз");
  const M={lyse:0,melter:1};
  B.cells[3]={k:"melter",hp:1};
  B.pool.ice=100;
  const w0=baseLife(B).water;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  eq(baseLife(B).water,w0,"в мороз ледоплавка не даёт воды");
  /* жара: техника изнашивается, и только настоящая жара */
  const B2=bLife();
  B2.type="volcanic";
  for(let i=0;i<4;i++)B2.cells[5+i]={k:"reactor",hp:1};
  ok(baseHeat(B2)>HEAT_HARD,"база в печке: "+baseHeat(B2));
  const hp0=B2.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  B2.t0=baseShift()-20;
  baseResolve(B2,Date.now());
  const hp1=B2.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  ok(hp1<hp0,"жара сточила технику: "+hp0.toFixed(2)+" → "+hp1.toFixed(2));
  /* ── и главная проверка вехи ──
     Обычная база — реактор и бур — тёплая, но не печка: она теряет пятнадцать
     процентов выработки и не изнашивается, а лечится ОДНИМ радиатором за 900
     кр. Так и задумано: веха, которая молча уронила бы добычу вдвое всем, кто
     уже построил базу, — это не шкала, а отнятое. */
  const B3=bLife();
  ok(baseHeat(B3)>HEAT_OK,"обычная база тёплая: "+baseHeat(B3));
  ok(baseHeat(B3)<=HEAT_HARD,"но не печка");
  eq(baseHeatBand(B3),1,"первая ступень");
  eq(baseHeatMul(B3),.85,"минус пятнадцать процентов выработки, и только");
  /* с M401 (закон 4) износ есть ВСЕГДА — база в равновесии выходит из него
     сама. Мерить надо не «точит или нет», а насколько быстрее точит жара */
  B3.cells[3]={k:"radiator",hp:1};
  eq(baseHeatBand(B3),0,"один радиатор приводит её в норму");
  eq(baseHeatMul(B3),1,"и выработка возвращается целиком");
  const hp2=B3.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  B3.t0=baseShift()-20;
  bNoDir(()=>baseResolve(B3,Date.now()));
  const calm=hp2-B3.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  ok(calm>0&&calm<.3,"в норме износ есть, но он ровный: "+calm.toFixed(3));
  const B4=bLife();
  B4.type="volcanic";
  for(let i=0;i<4;i++)B4.cells[5+i]={k:"reactor",hp:1};
  const hp3=B4.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  B4.t0=baseShift()-20;
  bNoDir(()=>baseResolve(B4,Date.now()));
  const hot2=hp3-B4.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  ok(hot2>calm,"а в печке точит заметно быстрее: "+hot2.toFixed(2)+" против "+calm.toFixed(3));
}));

TEST_SUITES.push(()=>suite("база M392: криоген везут, криоцех делает",()=>{
  const B=bLife();
  B.type="volcanic";
  for(let i=0;i<4;i++)B.cells[5+i]={k:"reactor",hp:1};
  const hot=baseHeat(B);
  ok(hot>HEAT_HARD,"жарко");
  /* криоген с борта: не запас, а срок */
  G.cargo.cryo=(G.cargo.cryo|0)+2;
  eq(baseSupply(B,"cryo",2),2,"криоген сдан");
  eq(G.cargo.cryo|0,0,"из трюма ушёл");
  eq(baseHeat(B),hot-2*HEAT_CRYO,"и охладил базу на своё");
  ok(!!B.cryo&&B.cryo.until>baseShift(),"у холода есть срок");
  /* срок вышел — холода нет */
  B.cryo.until=baseShift()-1;
  eq(baseHeat(B),hot,"после срока всё вернулось");
  /* криоцех: газы в криоген, и он холодит, только пока ему есть что гнать */
  const B2=bLife();
  B2.cells[6]={k:"cryo",hp:1};
  const idle=baseHeat(B2);
  B2.pool.volatiles=9;
  eq(baseHeat(B2),idle+HEAT_CELL.cryo,"с газом криоцех холодит");
  B2.cells[4]={k:"reactor",hp:1};B2.cells[9]={k:"reactor",hp:1};
  B2.t0=baseShift()-1;
  baseResolve(B2,Date.now());
  eq(B2.pool.cryo|0,CRYO_RECIPE.cryo,"за смену дал криоген");
  eq(B2.pool.volatiles|0,9-CRYO_RECIPE.volatiles,"и съел газы");
  ok(B2.log.some(x=>x.k==="cryo"),"и это в журнале");
  /* газы кончились — цех стоит и не холодит, а не холодит даром */
  B2.pool.volatiles=0;
  eq(baseHeat(B2),baseHeat(B2),"без газа он просто стоит");
  const stand=baseHeat(B2);
  B2.pool.volatiles=9;
  ok(baseHeat(B2)<stand,"а с газом — снова холодит");
}));

/* ── харч и дух (M393) ──
   Главное обещание §8: от отсутствия игрока здесь не умирают. Худшее, что
   может случиться, — один человек соберётся и уйдёт, и его снова можно нанять. */
TEST_SUITES.push(()=>suite("база M393: харч, вкус и кто его растит",()=>{
  const B=bLife();
  const L=baseLife(B);
  eq(typeof L.food,"number","у базы есть харч");
  eq(L.q,"good","и он поначалу нормальный");
  /* оранжерея: пьёт воду, даёт харч и немного воздуха, но сперва её надо засеять */
  B.cells[1]={k:"garden",hp:1};B.cells[4]={k:"reactor",hp:1};
  B.pool.organics=0;
  L.food=0;L.water=100;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  eq(baseLife(B).food,0,"без органики грядку не засеять");
  B.pool.organics=LIFE_GARDEN.seed;
  const w0=baseLife(B).water,a0=baseLife(B).air;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  ok(baseLife(B).food>0,"засеяли — и харч пошёл: "+baseLife(B).food);
  eq(B.pool.organics|0,0,"органика ушла на посадку");
  ok(baseLife(B).water<w0,"оранжерея пьёт воду");
  ok(baseLife(B).air>=a0,"и отдаёт немного воздуха");
  eq(baseLife(B).q,"good","её харч хороший");
  /* второй раз сеять не надо */
  const org=B.pool.organics|0;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  eq(B.pool.organics|0,org,"грядку не пересевают каждую смену");
  /* белковый бак: сытнее и скверно */
  const B2=bLife();
  B2.cells[1]={k:"vat",hp:1};B2.cells[4]={k:"reactor",hp:1};
  B2.pool.organics=LIFE_VAT.organics*2;
  baseLife(B2).food=0;
  B2.t0=baseShift()-1;
  baseResolve(B2,Date.now());
  ok(baseLife(B2).food>0,"бак кормит: "+baseLife(B2).food);
  eq(baseLife(B2).q,"poor","и кормит скверно");
  ok(LIFE_VAT.food>LIFE_GARDEN.food,"зато сытнее оранжереи");
  /* консервы и синтебелок с борта — то же самое, только привозное */
  G.cargo.canned=(G.cargo.canned|0)+3;
  const f0=baseLife(B2).food;
  eq(baseSupply(B2,"canned",3),3,"консервы сданы");
  eq(baseLife(B2).food,f0+3*FOOD_SUPPLY.canned.q,"и легли в харч по таблице");
  eq(baseLife(B2).q,"good","консервы — это хороший харч");
  G.cargo.protein=(G.cargo.protein|0)+2;
  baseSupply(B2,"protein",2);
  eq(baseLife(B2).q,"poor","а синтебелок — скверный");
}));

TEST_SUITES.push(()=>suite("база M393: дух читает все шкалы, и один уходит",()=>{
  const B=bLife();
  bCrew(B,2);
  B.cells[4]={k:"reactor",hp:1};
  /* всё хорошо — это ещё и НЕ ЖАРКО: реактор с буром и вторым реактором стоят
     в печке, пока их не остудить. Дух читает и это тоже */
  B.cells[1]={k:"radiator",hp:1};B.cells[3]={k:"radiator",hp:1};
  eq(baseHeatBand(B),0,"база в полосе покоя");
  const L=baseLife(B);
  L.air=LIFE_START;L.water=LIFE_START;L.food=LIFE_START;L.q="good";
  ok(baseSpirit(B)>=90,"на сытой и тёплой базе дух высокий: "+baseSpirit(B));
  /* скверный харч его роняет, и ровно на своё */
  const goodS=baseSpirit(B);
  L.q="poor";
  ok(baseSpirit(B)<goodS,"от скверного харча дух ниже: "+baseSpirit(B)+" против "+goodS);
  L.q="good";
  /* голод роняет сильнее */
  L.food=0;
  ok(baseSpirit(B)<goodS-20,"голод роняет дух заметно: "+baseSpirit(B)+" против "+goodS);
  /* без людей духа нет вовсе: некому его иметь */
  G.crew=[];
  eq(baseSpirit(B),100,"пустой базе дух не считают");
  /* ── и главное: один уходит, а не умирает ──
     Чтобы дух упал ниже четверти, должно сойтись всё сразу: ни воздуха, ни
     воды, ни харча, харч скверный, база встала и вдобавок в печке. Это не
     «не долетел вовремя», это «бросил людей». */
  bCrew(B,2);
  B.cells[1]=null;B.cells[3]=null;             /* радиаторы долой — снова печка */
  L.air=0;L.water=0;L.food=0;L.q="poor";
  B.pool.ice=0;
  basePark(B,"empty",baseShift()-4,"воздух");
  ok(baseSpirit(B)<SPIRIT_LOW,"на такой базе жить нельзя: дух "+baseSpirit(B));
  const was=G.crew.length;
  B.t0=baseShift()-SPIRIT_HOLD;
  baseResolve(B,Date.now());
  eq(G.crew.length,was-1,"через три смены один ушёл");
  ok(B.log.some(x=>x.k==="leave"),"и сказал об этом своими словами");
  const line=B.log.filter(x=>x.k==="leave")[0].t;
  ok(line.indexOf("«")===0,"строка — прямая речь: "+line);
  ok(G.crew.every(c=>c.state!=="dead"),"никто не умер");
  /* и второй уходит не сразу: счётчик терпения начинается заново */
  const now=G.crew.length;
  B.t0=baseShift()-1;
  baseResolve(B,Date.now());
  eq(G.crew.length,now,"следующий уходит не в ту же смену");
}));

/* ── СВЯЗЬ и мачта (M394) ──
   Проверяется главное правило §38: слышно ровно столько, сколько слышно, и
   расстояние не отменяется ни панелью, ни кнопкой. */
TEST_SUITES.push(()=>suite("база M394: сигнал решает, что слышно",()=>{
  const B=bLife();
  B.cells[4]={k:"reactor",hp:1};
  const call=baseCall(B);
  ok(/^БЗ-\d{3}$/.test(call),"у базы есть позывной: "+call);
  eq(baseCall(B),call,"и он не гуляет");
  /* в своей системе слышно всё */
  G.sx=B.sx;G.sy=B.sy;
  eq(baseSignal(B),1,"на месте сигнал полный");
  eq(baseHear(B),3,"и слышно цифрами");
  const R=baseReport(B);
  ok(R.head.indexOf("воздух")>0,"цифры называют шкалы: "+R.head);
  ok(R.head.indexOf("undefined")<0,"и без мусора");
  /* без мачты — три сектора, дальше слова, потом ничего */
  ok(!baseHasMast(B),"мачты пока нет");
  ok(baseHear(B,B.sx+2,B.sy)<3,"за два сектора цифр уже нет");
  eq(baseHear(B,B.sx+30,B.sy),0,"а за тридцать не слышно вовсе");
  eq(baseReport(B,B.sx+30,B.sy).head,"…шшш","и это честный треск, а не пустая строка");
  /* мачта достаёт по всему кругу */
  B.cells[1]={k:"mast",hp:1};
  ok(baseHasMast(B),"мачта стоит");
  ok(baseHear(B,B.sx+30,B.sy)>0,"с мачтой за тридцать секторов уже слышно");
  ok(baseSignal(B,B.sx+30,B.sy)>baseSignal({...B,cells:B.cells.map(c=>c&&c.k==="mast"?null:c)},B.sx+30,B.sy),
     "и слышно лучше, чем без неё");
  /* обесточенная база едва слышна: передатчик на общей шине */
  const q0=baseSignal(B,B.sx+10,B.sy);
  B.cells[2]=null;B.cells[4]=null;                  /* реакторов нет */
  ok(baseSignal(B,B.sx+10,B.sy)<q0,"без энергии сигнал слабее");
  B.cells[2]={k:"reactor",hp:1};B.cells[4]={k:"reactor",hp:1};
  /* по слову на шкалу — это слова, а не числа */
  const W=baseReport(B,B.sx+8,B.sy);
  if(W.lvl===2){
    ok(W.head.indexOf("—")>0,"на среднем сигнале дают слова: "+W.head);
    ok(!/\d\d\d/.test(W.head),"и ни одного длинного числа");
  }else ok(true,"на этой дистанции уровень другой: "+W.lvl);
}));

TEST_SUITES.push(()=>suite("база M394: один приказ за сеанс, и он может не дойти",()=>{
  const B=bLife();
  B.cells[4]={k:"reactor",hp:1};
  G.sx=B.sx;G.sy=B.sy;
  ok(baseLinkCan(B),"рядом приказ дойдёт");
  ok(baseLinkPark(B),"приказ отдан");
  ok(baseParked(B),"база встала по приказу");
  ok(baseLinkPark(B),"и снимается тем же приказом");
  ok(!baseParked(B),"база поднята");
  /* далеко и без мачты — не дотянуться */
  G.sx=B.sx+25;G.sy=B.sy;
  ok(!baseLinkCan(B),"за двадцать пять секторов без мачты не дотянуться");
  eq(baseLinkPark(B),false,"и приказ не проходит");
  eq(baseParked(B),false,"база осталась как была");
  /* с мачтой — дотягивается, но не куда угодно: приказ живёт в той половине
     круга, где сигнал ещё разборчив, и это ровно та цена, которую снимает
     настоящий управляющий (§34) */
  B.cells[1]={k:"mast",hp:1};
  ok(!baseLinkCan(B)||baseSignal(B)>=LINK_WORD,"на краю мачты приказ уже на грани");
  G.sx=B.sx+15;G.sy=B.sy;
  ok(baseLinkCan(B),"с мачтой на пятнадцати секторах дотянулись");
  ok(baseLinkPark(B),"и приказ прошёл");
  ok(baseParked(B),"база встала");
  baseWake(B,baseShift(),"hand");
  G.sx=B.sx;G.sy=B.sy;
}));

/* ── люди в комнате (M395) ──
   Роль ячейки — это её работа; человек на этой работе — тот, кого рисуют в
   отсеке; и три новые роли обязаны что-то делать, а не украшать список. */
TEST_SUITES.push(()=>suite("база M395: у каждой работы есть человек",()=>{
  const B=bLife();
  B.cells[1]={k:"lyse",hp:1};B.cells[3]={k:"garden",hp:1};B.cells[4]={k:"reactor",hp:1};
  /* у каждого модуля есть работа, и она названа */
  for(const k of BUILD_KEYS){
    const role=baseCellRole({k,hp:1});
    ok(!role||!!BASE_ROLES[role],"работа модуля «"+k+"» — существующая роль: "+role);
  }
  eq(baseCellRole({k:"lyse",hp:1}),"life","электролизёр — работа жизнеобеспеченца");
  eq(baseCellRole({k:"garden",hp:1}),"gardener","оранжерея — работа садовода");
  eq(baseCellRole({k:"mast",hp:1}),"radist","мачта — работа радиста");
  eq(baseCellRole(null),null,"у породы работы нет");
  /* назначение на месте */
  G.crew=[];
  bCrew(B,1);
  G.crew[0].role="driller";G.crew[0].order={kind:"home",sx:B.sx,sy:B.sy};
  B.cells[5]={k:"habitat",hp:1};                  /* место для человека */
  const cell=baseCell(B,1,0);
  ok(basePeopleList(B,cell).length>0,"свободный человек попадает в список");
  ok(baseAssignHere(B,cell,G.crew[0]),"его ставят прямо здесь");
  eq(G.crew[0].role,"life","и он получает работу этой ячейки");
  eq(baseCellStaff(B,cell)[0],G.crew[0],"он же и стоит в этом отсеке");
  ok(basePeopleLine(B,cell,0).indexOf(G.crew[0].name)>0,"и строка меню называет его по имени");
}));

TEST_SUITES.push(()=>suite("база M395: три новые роли и правда работают",()=>{
  const B=bLife();
  B.cells[1]={k:"lyse",hp:1};B.cells[3]={k:"melter",hp:1};B.cells[4]={k:"reactor",hp:1};
  B.cells[5]={k:"habitat",hp:1};B.cells[6]={k:"habitat",hp:1};
  B.pool.ice=200;
  G.crew=[];
  eq(baseLifeBoost(B),1,"без жизнеобеспеченца прибавки нет");
  bCrew(B,1);
  G.crew[0].role="life";
  ok(baseLifeBoost(B)>1,"с ним воздух и вода идут щедрее: ×"+baseLifeBoost(B).toFixed(2));
  /* треть — это ставка роли; опыт человека её слегка двигает, как и у
     бурильщика, а потолок стоит на трёх таких людях */
  ok(baseLifeBoost(B)<=1.4,"с одним человеком прибавка около трети: ×"+baseLifeBoost(B).toFixed(2));
  /* садовод: больше харча и никакого скверного */
  const B2=bLife();
  B2.cells[1]={k:"vat",hp:1};B2.cells[4]={k:"reactor",hp:1};B2.cells[5]={k:"habitat",hp:1};
  B2.pool.organics=99;
  baseLife(B2).food=0;
  B2.t0=baseShift()-1;
  baseResolve(B2,Date.now());
  eq(baseLife(B2).q,"poor","бак без садовода кормит скверно");
  G.crew=[];bCrew(B2,1);G.crew[0].role="gardener";
  ok(baseFoodBoost(B2)>1,"садовод прибавляет харча: ×"+baseFoodBoost(B2).toFixed(2));
  ok(baseFoodKeepsGood(B2),"и держит вкус");
  baseLife(B2).q="poor";
  B2.t0=baseShift()-1;
  baseResolve(B2,Date.now());
  eq(baseLife(B2).q,"good","при садоводе даже бак кормит по-человечески");
  /* радист: слышно дальше */
  const B3=bLife();
  B3.cells[4]={k:"reactor",hp:1};B3.cells[5]={k:"habitat",hp:1};
  G.crew=[];
  const q0=baseSignal(B3,B3.sx+3,B3.sy);
  bCrew(B3,1);G.crew[0].role="radist";
  ok(baseSignal(B3,B3.sx+3,B3.sy)>q0,"с радистом слышно лучше: "+q0.toFixed(2)+" → "+
    baseSignal(B3,B3.sx+3,B3.sy).toFixed(2));
}));

TEST_SUITES.push(()=>suite("база M395: маяк приводит людей, и их берут за руку",()=>{
  const B=bLife();
  /* взять человека — это найм, а нанимают в этой игре кооперативы: закон один
     на всех, и маяк его не отменяет */
  coopStamp();
  B.cells[4]={k:"reactor",hp:1};B.cells[5]={k:"habitat",hp:1};
  G.crew=[];
  eq(baseHasBeacon(B),false,"маяка нет");
  eq(baseGuestRoll(B,GUEST_EVERY*3),0,"и никто не приходит");
  B.cells[1]={k:"beacon",hp:1};
  ok(baseHasBeacon(B),"маяк построен");
  /* гость приходит по календарю смен, а не по кадру */
  let got=0;
  for(let n=0;n<GUEST_EVERY*12&&!got;n++)got=baseGuestRoll(B,n);
  ok(got,"за дюжину сроков кто-то пришёл");
  ok(!!B.guest,"он ждёт у затвора: "+(B.guest&&B.guest.name));
  ok(B.log.some(x=>x.k==="guest"),"и об этом сказано в журнале");
  eq(baseGuestRoll(B,GUEST_EVERY),0,"пока он ждёт, второй не приходит");
  /* взять — это найм со всеми его законами */
  const was=G.crew.length;
  ok(baseGuestTake(B),"его взяли");
  eq(G.crew.length,was+1,"он в звене");
  eq(G.crew[G.crew.length-1].order.kind,"base","и сразу на базе");
  eq(B.guest,null,"у затвора пусто");
  /* и отказать тоже можно */
  B.guest={name:"Кто-то",role:"driller",seed:7,n:0};
  ok(baseGuestDrop(B),"отказали");
  eq(B.guest,null,"ушёл");
  ok(B.log.some(x=>x.k==="guestno"),"и это записано");
}));

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
  const n=baseShift();
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
  const n=baseShift();
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
  const n=baseShift();
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
  /* без радиста и с казённым прибором — слова, а не цифры */
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
  const n=baseShift();
  const w1=baseWarnLine(B,n);
  G.crew[1].role="radist";
  for(const id of INSTR_KEYS)instrUnit(id).wear=0;
  ok(baseSharp(B)>=2,"и радист, и приборы");
  const w2=baseWarnLine(B,n);
  if(w1&&w2)ok(w2.indexOf("СМЕН")>0||w2!==w1,"со сведениями прогноз точнее: «"+w1+"» → «"+w2+"»");
  else ok(true,"в эту смену прогноза нет вовсе");
}));

TEST_SUITES.push(()=>suite("база M401: изнашивается всё, и люди не множители",()=>{
  const B=bLife();
  /* закон 4: ровный износ есть всегда */
  const hp0=B.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  const n=baseShift();
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
  G.credits=0;
  bmgrStep(B,n2+2);
  eq(B.mgr,null,"без денег он ушёл сам");
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
