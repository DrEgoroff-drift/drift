/* ══════════════ прошивка Хай-Фронта (M480, DESIGN-review shipyard) ══════════════
   Сдвиг делает yardFirmware (26e1) по chronNow. Здесь — отложить на 3 сводки
   (кнопка в КБ) и проверка «это корпус HF». G.hfFw.defer читает yardFirmware. */
function hfFwShip(id){
  id=id||G.shipId;
  const S=(typeof shipData==="function")?shipData(id):null;
  return !!(S&&S.ordered&&S.by==="hf");
}
function hfFwDefer(n){
  if(!hfFwShip()){say("Прошивка — только на корпусе Хай-Фронта",100);return false;}
  G.hfFw=G.hfFw||{at:0,defer:0};
  G.hfFw.defer=Math.max(G.hfFw.defer|0,n|0);
  logAdd("dim","Хай-Фронт: обновление отложено · "+G.hfFw.defer+" "+pl3(G.hfFw.defer,"сводка","сводки","сводок"));
  say("Обновление отложено\nещё "+G.hfFw.defer+" "+pl3(G.hfFw.defer,"сводка","сводки","сводок"),120);
  return true;
}
