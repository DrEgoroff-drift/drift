/* ══════════════ обмен с облаком: то, что раньше молчало ══════════════
   Разбор 25.08.2026 (docs/DESIGN-online-risks.md) показал, что самое дорогое в
   онлайне — не читер, а ТИШИНА: отправка не удалась, игрок не знает, вечером
   на другом устройстве нет его вечера. Здесь проверяется, что каждая неудача
   теперь называет себя, что удача по-прежнему молчит, и что вторая вкладка не
   затирает первую. */

TEST_SUITES.push(()=>suite("облако: неудача видна, удача молчит",()=>{
  resetWorld();
  const k0=CLOUD_ST.k, s0=CLOUD_ST.said;
  /* тесты открыты по file://, где облака нет по замыслу (cloudHere). Чтобы
     проверить сами сообщения, на время притворяемся, что мы на сайте. */
  const hereWas=cloudHere;
  const tok=stGet(CLOUD.tkey);
  cloudHere=()=>true;
  try{

  /* без учётной записи строки нет вовсе — место в кадре принадлежит миру */
  stDel(CLOUD.tkey);
  CLOUD_ST.k="fail";
  eq(cloudLine(),"","не вошли — облако молчит");

  /* вошли: теперь каждая беда называет себя */
  stSet(CLOUD.tkey,"0".repeat(48));
  CLOUD_ST.k="fail";     ok(cloudLine().indexOf("не отправлено")>=0,"сеть пропала — сказано");
  CLOUD_ST.k="gone";     ok(cloudLine().indexOf("вход")>=0,"вход устарел — сказано");
  CLOUD_ST.k="conflict"; ok(cloudLine().indexOf("новее")>=0,"конфликт — сказано");
  CLOUD_ST.k="big";      ok(cloudLine().indexOf("велика")>=0,"запись не влезла — сказано");
  CLOUD_ST.k="";         eq(cloudLine(),"","всё сложилось — молчит");

  /* об одной и той же беде ругаемся один раз, а не каждые двадцать секунд */
  CLOUD_ST.said="";
  const n0=G.log.length;
  cloudMark("conflict");
  const after1=G.log.length;
  cloudMark("conflict");
  eq(G.log.length,after1,"повтор той же беды журнал не засоряет");
  ok(after1>n0,"а в первый раз — записано");

  }finally{
    cloudHere=hereWas;
    if(tok)stSet(CLOUD.tkey,tok);else stDel(CLOUD.tkey);
    CLOUD_ST.k=k0;CLOUD_ST.said=s0;
  }
}));

TEST_SUITES.push(()=>suite("две вкладки: пишет только последняя",()=>{
  resetWorld();
  ok(tabLive(),"эта вкладка живая");
  const before=stGet(SAVE_KEY);
  G.credits=4242;
  ok(saveGame(true),"живая вкладка записывает");

  /* пришла новая вкладка — эта уступает и замолкает */
  TAB_LIVE=false;
  G.credits=777;
  eq(saveGame(true),false,"уступившая вкладка не записывает");
  const raw=stGet(SAVE_KEY);
  const s=raw?JSON.parse(raw):null;
  ok(s&&s.credits===4242,"в хранилище осталась запись живой вкладки, а не уступившей");
  ok(cloudLine().indexOf("остановлена")>=0,"и человеку сказано, что здесь не пишется");

  TAB_LIVE=true;
  if(before)stSet(SAVE_KEY,before);
}));

TEST_SUITES.push(()=>suite("хранилище отказало — говорим сразу",()=>{
  resetWorld();
  const real=localStorage.setItem.bind(localStorage);
  const okBefore=STORAGE_OK, told=STORAGE_TOLD;
  STORAGE_TOLD=false;STORAGE_OK=true;
  const n0=G.log.length;
  localStorage.setItem=()=>{throw new Error("quota");};
  try{
    eq(stSet("drift_probe","1"),false,"запись не удалась");
    eq(STORAGE_OK,false,"и это отмечено");
    ok(G.log.length>n0,"игроку сказано в журнал, а не только в подменю настроек");
    const n1=G.log.length;
    stSet("drift_probe","2");
    eq(G.log.length,n1,"но сказано один раз — это сообщение, а не шум");
  }finally{
    localStorage.setItem=real;
    STORAGE_OK=okBefore;STORAGE_TOLD=told;
    stDel("drift_probe");
  }
}));
