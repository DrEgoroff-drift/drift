/* ══════════════ автотесты: кинопередвижка (M205) ══════════════ */
TEST_SUITES.push(()=>suite("кино: где и когда — считается, а не хранится",()=>{
  resetWorld();
  G.kino=[];
  /* одна и та же станция в ту же неделю даёт тот же сеанс */
  const a=kinoAt(3,-4), b=kinoAt(3,-4);
  eq(JSON.stringify(a),JSON.stringify(b),"дважды спросили — один ответ");
  /* через неделю — другой расклад */
  const t0=G.t;
  G.t+=CEL_DAY*KINO_EVERY;
  const c=kinoAt(3,-4);
  G.t=t0;
  ok(JSON.stringify(c)!==JSON.stringify(a)||c===null||a===null,"через неделю расклад другой");
  /* кино есть не везде: примерно на трети станций */
  let n=0,tot=0;
  for(let x=-9;x<=9;x++)for(let y=-9;y<=9;y++){tot++;if(kinoAt(x,y))n++;}
  ok(n>tot*0.15&&n<tot*0.50,"кино идёт не везде ("+n+" из "+tot+")");
  /* у сеанса есть название и оно из таблицы */
  const some=(function(){for(let x=-9;x<=9;x++)for(let y=-9;y<=9;y++){const k=kinoAt(x,y);if(k)return k;}return null;})();
  ok(!!some,"сеанс нашёлся");
  ok(KINO_TITLES.indexOf(some.title)>=0,"название из таблицы: "+some.title);
  ok(/@/.test(some.id),"у сеанса есть адрес и неделя: "+some.id);
}));
TEST_SUITES.push(()=>suite("кино: журнал крутится, и ничего не даёт",()=>{
  resetWorld();
  G.kino=[];G.record=null;
  const K=kinoAt(3,-4)||{title:"«Тихая вода»",id:"3,-4@0",seed:5};
  const F=kinoFrame(K);
  ok(!!F&&F.t.length>10,"кадр журнала есть: "+F.t);
  ok(KINO_REEL.some(x=>x.t===F.t),"и он из ленты");
  /* каждый кадр про то, что в игре есть */
  for(const f of KINO_REEL){
    ok(f.k&&f.t,"у кадра есть вид и подпись");
    ok(f.t===f.t.replace(/\s+$/,""),"подпись без хвостов");
    ok(/^[А-ЯЁ]/.test(f.t),"подпись дикторская, с прописной: "+f.t.slice(0,20));
  }
  /* поход в зал: ни денег, ни данных */
  const cr=G.credits,dt=G.data;
  G.sx=3;G.sy=-4;G.sys=getSystem(3,-4);G.st={name:"—",stype:"trade"};
  const there=!!kinoHere();
  if(there){
    ok(kinoWatch(),"сеанс отмечен");
    ok(!kinoWatch(),"дважды один сеанс не считается");
    eq(kinoSeen().length,1,"в списке один");
    ok(recordAll().e.some(x=>/кинопередвижк/.test(x.s)),"и первая строка в книжке");
  }
  eq(G.credits,cr,"денег не дают");
  eq(G.data,dt,"данных тоже");
  G.st=null;
}));
TEST_SUITES.push(()=>suite("кино: список виденного переживает сохранение и не растёт вечно",()=>{
  resetWorld();
  G.kino=[];
  for(let i=0;i<60;i++)kinoSeen().push("x"+i+"@"+i);
  const snap=snapshot();G.kino=null;applySave(JSON.parse(JSON.stringify(snap)));
  ok(kinoSeen().length<=40,"список подрезан ("+kinoSeen().length+")");
  ok(kinoSeen()[kinoSeen().length-1]==="x59@59","и подрезан с начала, а не с конца");
  const bad=snapshot();bad.kino=["ok@1",5,null,{a:1},"ok@2"];
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(kinoSeen().join(","),"ok@1,ok@2","мусор отброшен");
  const old=snapshot();delete old.kino;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(kinoSeen().length,0,"сохранение без кино — не падение");
}));
