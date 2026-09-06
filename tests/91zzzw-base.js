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
  return B;
}
function bPool(B){let s=0;for(const k in B.pool)s+=B.pool[k]|0;return s;}

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
      cr:400,q:5,from:1,to:9,guard:1,shield:0});
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
