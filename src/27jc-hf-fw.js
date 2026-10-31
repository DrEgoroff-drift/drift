/* ══════════════ прошивка Хай-Фронта (M480, DESIGN-review shipyard) ══════════════
   На заказанном корпусе HF раз в сводку прошивка сдвигает одну деталь на клетку
   — «оптимизировано». Выключить нельзя, только «отложить обновление» на 3 сводки
   (кнопка в КБ на верфи HF или с пульта). Состояние — G.hfFw {at, defer}. */
function hfFwShip(id){
  id=id||G.shipId;
  const S=(typeof shipData==="function")?shipData(id):null;
  return !!(S&&S.ordered&&S.by==="hf");
}
function hfFwDefer(n){
  if(!hfFwShip()){say("Прошивка — только на корпусе Хай-Фронта",100);return false;}
  G.hfFw=G.hfFw||{at:holdShift(),defer:0};
  G.hfFw.defer=Math.max(G.hfFw.defer|0,n|0);
  logAdd("dim","Хай-Фронт: обновление отложено · "+G.hfFw.defer+" "+pl3(G.hfFw.defer,"сводка","сводки","сводок"));
  say("Обновление отложено\nещё "+G.hfFw.defer+" "+pl3(G.hfFw.defer,"сводка","сводки","сводок"),120);
  return true;
}
/* сдвиг одной вещи на соседнюю клетку; без открытого КБ — через draftOf/kbPlace */
function hfFwNudge(id){
  if(typeof draftOf!=="function"||typeof kbPlace!=="function"||typeof draftSave!=="function")return false;
  const d=draftOf(id);if(!d||!d.items||!d.items.length)return false;
  const sh=holdShift(),pick=(hashi(id,sh,0x0F70)>>>0)%d.items.length;
  for(let k=0;k<d.items.length;k++){
    const it=d.items[(pick+k)%d.items.length];
    if(typeof kbWelded==="function"&&kbWelded(it))continue;
    const q0=it.cells[0];if(!q0)continue;
    const dirs=[[0,1],[1,0],[0,-1],[-1,0]];
    const rot=(hashi(id,sh,it.key||k,0x0F71)>>>0)%4;
    for(let i=0;i<4;i++){
      const o=dirs[(rot+i)%4],q=d.P.cells.find(c=>c.i===q0.i+o[0]&&c.j===q0.j+o[1]);
      if(!q)continue;
      const no=kbPlace(d,it,q);if(no)continue;
      draftSave(id,d);if(typeof GUN_LIST!=="undefined")GUN_LIST=null;
      return it.key||"деталь";
    }
  }
  return false;
}
function hfFwTick(){
  if(!hfFwShip())return;
  const cur=holdShift();
  G.hfFw=G.hfFw||{at:cur,defer:0};
  if((G.hfFw.at|0)>=cur)return;
  let moved=null;
  while((G.hfFw.at|0)<cur){
    G.hfFw.at=(G.hfFw.at|0)+1;
    if((G.hfFw.defer|0)>0){G.hfFw.defer--;continue;}
    moved=hfFwNudge(G.shipId);if(moved)break;
  }
  if(moved){
    logAdd("tech","Хай-Фронт: прошивка · «оптимизировано» · сдвинута «"+moved+"»");
    say("Оптимизировано\nпрошивка сдвинула деталь",110);
  }
}
