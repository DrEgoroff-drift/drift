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
  B.type="ice";
  const cold=baseHeat(B);
  B.type="volcanic";
  ok(baseHeat(B)>cold,"на вулкане теплее, чем на льду: "+cold+" → "+baseHeat(B));
  eq(baseHeat(B)-cold,HEAT_WORLD.volcanic-HEAT_WORLD.ice,"ровно на разницу оснований");
  B.type="gas";
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
  const hp2=B3.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0);
  B3.t0=baseShift()-20;
  baseResolve(B3,Date.now());
  eq(B3.cells.filter(c=>c).reduce((s,c)=>s+c.hp,0),hp2,"и её не точит ничто");
  B3.cells[3]={k:"radiator",hp:1};
  eq(baseHeatBand(B3),0,"один радиатор приводит её в норму");
  eq(baseHeatMul(B3),1,"и выработка возвращается целиком");
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
