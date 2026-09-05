/* ══════════════ облако не съедает вечер (M357) ══════════════
   Самая дорогая ошибка синхронизации — не падение, а ТИХАЯ ПОТЕРЯ: чужая
   старая запись легла поверх свежей, и вечер игры исчез без единого слова.
   В `14a-cloud` это записано обещанием прямо в комментарии: «оно лишь кладёт в
   локальное хранилище ту запись, которая новее». Обещание никем не проверено, а
   стоит оно дороже всего остального в файле.

   Проверяется без сети: `cloudCall` подменяется на время опыта, и облако
   отвечает тем, чем захочется, — старой записью, новой, пустотой, мусором,
   отказом. Правило одно на все ответы: старое НИКОГДА не ложится поверх нового,
   а испорченный ответ не портит того, что уже лежит. */

/* заготовка записи: настоящий снимок с проставленной отметкой времени */
function clSave(ts,credits){
  const s=JSON.parse(JSON.stringify(snapshot()));
  s.ts=ts;s.credits=credits;
  return s;
}
/* ── ответ облака, приходящий СРАЗУ ──
   Настоящий `fetch` отвечает обещанием, и `.then` выполнится микрозадачей —
   то есть уже ПОСЛЕ того, как набор вернул управление и отчёт собран: такие
   проверки не считаются вовсе (первая версия этого файла так и «прошла»,
   не проверив ничего). Подменяем облако синхронным thenable: цепочка
   `cloudBoot` отрабатывает внутри вызова, как будто ответ был мгновенным. */
function clNow(v){
  return {then(f){ let r=v; try{ r=f(v); }catch(e){ } return clNow(r); },
          catch(){ return clNow(v); }};
}
/* опыт с подменённым облаком: возвращаем то, что просят */
function clWith(answer,fn){
  const was=window.cloudCall,wasHere=window.cloudHere,wasTok=stGet(CLOUD.tkey);
  window.cloudCall=()=>clNow(answer);
  /* Облако включено только на http(s) (`cloudHere`), а наборы живут на file:// —
     без этой подмены `cloudBoot` выходит первой же строкой и проверка меряет
     пустоту. Поймано тем, что «новая запись легла на место» не выполнилась. */
  window.cloudHere=()=>true;
  try{ stSet(CLOUD.tkey,"тест-токен"); }catch(e){ }
  try{ return fn(); }
  finally{
    window.cloudCall=was;window.cloudHere=wasHere;
    try{ if(wasTok)stSet(CLOUD.tkey,wasTok); else stDel(CLOUD.tkey); }catch(e){ }
  }
}

TEST_SUITES.push(() => suite("облако: старая запись не ложится поверх свежей", () => {
  resetWorld();
  if(typeof cloudBoot!=="function"||typeof CLOUD==="undefined"){ok(true,"облака в этой сборке нет — пропуск");return;}
  const bad=[];
  /* свежая местная запись: вечер игры */
  G.credits=555555;
  const mine=clSave(20000,555555);
  stSet(SAVE_KEY,JSON.stringify(mine));
  /* облако отдаёт СТАРУЮ запись */
  let done=null;
  clWith({ok:true,save:clSave(10000,111)},()=>{ cloudBoot(v=>{done=v;}); });
  {
    /* обещание: старое не берём */
    let now=null;
    try{ now=JSON.parse(stGet(SAVE_KEY)); }catch(e){ }
    if(!now)bad.push("местная запись пропала вовсе");
    else if((now.ts|0)!==20000)bad.push("местную запись подменили старой из облака: ts "+now.ts);
    else if((now.credits|0)!==555555)bad.push("вечер игры пропал: касса "+now.credits);
    eq(done,false,"загрузка старого не объявлена удачной");
    eq(bad.slice(0,3).join(" ;; "),"","старая запись из облака не тронула свежую местную");
  }
  /* а НОВАЯ — берётся: иначе синхронизация не работает вовсе */
  clWith({ok:true,save:clSave(30000,777)},()=>{ cloudBoot(()=>{}); });
  {
    let now=null;
    try{ now=JSON.parse(stGet(SAVE_KEY)); }catch(e){ }
    ok(now&&(now.ts|0)===30000,"новая запись из облака легла на место: ts "+(now&&now.ts));
  }
  try{ stDel(SAVE_KEY); }catch(e){ }
  resetWorld();
}));

TEST_SUITES.push(() => suite("облако: испорченный ответ не портит того, что лежит", () => {
  resetWorld();
  if(typeof cloudBoot!=="function"||typeof CLOUD==="undefined"){ok(true,"облака в этой сборке нет — пропуск");return;}
  const mine=clSave(20000,424242);
  stSet(SAVE_KEY,JSON.stringify(mine));
  const answers=[
    null,{},{ok:false},{ok:true},{ok:true,save:null},{ok:true,save:0},{ok:true,save:"строка"},
    {ok:true,save:[]},{ok:true,save:{ts:"позже"}},{error:"нужен вход"}
  ];
  for(const a of answers){
    clWith(a,()=>{ try{ cloudBoot(()=>{}); }catch(e){ ok(false,"cloudBoot бросил на ответе "+JSON.stringify(a)+": "+e.message); } });
  }
  {
    let now=null;
    try{ now=JSON.parse(stGet(SAVE_KEY)); }catch(e){ }
    ok(!!now,"местная запись на месте после десяти дурных ответов");
    ok(now&&(now.ts|0)===20000&&(now.credits|0)===424242,
       "и она та же самая: ts "+(now&&now.ts)+", касса "+(now&&now.credits));
    /* и мир после всего этого жив и сохраняем */
    ok(applySave(JSON.parse(stGet(SAVE_KEY)))!==false,"запись читается обратно");
  }
  try{ stDel(SAVE_KEY); }catch(e){ }
  resetWorld();
}));
