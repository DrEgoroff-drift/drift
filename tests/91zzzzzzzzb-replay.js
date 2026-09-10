/* ══════════════ запись и повтор: запись игрока — это сценарий (M444, §3.3) ══════════════
   `?rec=1` (15c-rec) пишет ввод по кадрам отрезками по полминуты, у каждого
   отрезка снимок мира на старте. Здесь запись делается ботом: бот идёт к
   планете, садится и бурит под включённой записью; потом та же запись
   воспроизводится T.replay — на том же семени мир обязан прийти в ту же
   точку (иначе запись игрока бесполезна), а на другом семени и в другой час
   — просто прожить те же клавиши без сбоя и NaN (возмущение: обобщение без
   обучения, §3.3). Node: картинка не нужна. */
function rpSig(){
  const S=G.surf;
  return [G.mode,G.credits,held(),JSON.stringify(Object.fromEntries(Object.entries(G.cargo).filter(e=>e[1]))),Math.round(G.ship.x),Math.round(G.ship.y),S?Math.round(S.x):"-",G.fuel.toFixed(1)].join("|");
}
TEST_SUITES.push(()=>suite("запись: полминуты ввода по кадрам повторяются до точки, а под возмущением — живут",()=>{
  T.go("система");
  recStart();
  const a=T.bot("planet"),b=T.bot("land");
  const deps=()=>G.surf?G.surf.deposits.map(d=>d.res+":"+d.left).join(","):"-";
  const depsA=deps();
  const c=T.bot("mine");
  ok(a.ok&&b.ok&&c.ok,"бот под записью долетел, сел и бурил: "+[a,b,c].map(r=>r.ok?"да":r.why).join(" · "));
  const rec=recDump();recStop();
  const sig0=rpSig(),frames=rec.segs.reduce((n,s)=>n+s.f.length/2,0);
  note("оригинал: залежи при посадке "+depsA+" · после бурения "+deps()+" · "+sig0);
  ok(rec.segs.length>=1&&frames>=600,"записано отрезков "+rec.segs.length+", кадров "+frames);
  ok(!!rec.segs[0].head.snap&&Array.isArray(rec.segs[0].head.rnd),"у отрезка есть снимок мира и положение случая");
  const json=JSON.stringify(rec);
  ok(json.length<2e6,"запись — текст, "+Math.round(json.length/1024)+" КБ");
  /* повтор на том же семени — та же точка */
  let depsB="";
  const R=T.replay(JSON.parse(json),{each:()=>{if(!depsB&&G.mode==="surface"&&G.surf)depsB=deps();}});
  note("повтор: залежи при посадке "+depsB+" · после "+deps()+" · "+rpSig());
  eq(R.frames,frames,"повтор прошёл все кадры");
  eq(rpSig(),sig0,"тот же мир в той же точке: "+sig0);
  /* возмущение: другое семя, другой час — живёт, без сбоя и не-чисел */
  let threw="";
  try{T.replay(JSON.parse(json),{seed:5,hour:3});}catch(e){threw=e&&e.message||String(e);}
  eq(threw,"","под другим семенем и в три часа ночи повтор не падает");
  const w=detWalk();
  eq(w.bad.join(" ;; "),"","и в мире нет не-чисел после возмущённого повтора");
  ok(["surface","dig","landing","system"].includes(G.mode),"режим после возмущения осмысленный: "+G.mode);
  recStop();resetWorld();
}));
/* экранные кнопки: тычок по ПРОДАТЬ ВСЁ на прилавке записывается событием
   кадра и повторяется тем же прилавком — деньги сходятся до кредита */
TEST_SUITES.push(()=>suite("запись: тычок по кнопке экрана повторяется — продажа на прилавке даёт те же деньги",{tier:"browser"},()=>{
  T.go("система");T.give("cargo","iron",10);
  recStart();
  const a=T.bot("station"),b=T.bot("dock"),c=T.bot("sell");
  ok(a.ok&&b.ok&&c.ok,"бот долетел, состыковался и продал: "+[a,b,c].map(r=>r.ok?"да":r.why).join(" · "));
  const rec=recDump();recStop();
  const cr=G.credits,taps=rec.segs.reduce((n,s)=>n+s.ev.filter(e=>e[1]==="tap").length,0);
  ok(taps>=1,"в записи есть событие тычка: "+taps+" ("+rec.segs.map(s=>s.ev.filter(e=>e[1]==="tap").map(e=>e[3]).join("/")).join(" ")+")");
  T.calm();
  const R=T.replay(JSON.parse(JSON.stringify(rec)));
  eq(G.credits,cr,"после повтора кредиты те же: "+cr);
  eq(G.mode,"dock","и мир на станции");
  T.calm();resetWorld();
}));
