/* ══════════════ ажиотаж (M504, PLAN «new mechanics», st. 3) ══════════════
   ЖИЛА прогремела — и дорога добавляет поезд «по многочисленным просьбам
   трудящихся»: интервал у этой остановки вдвое короче, топливо на её
   станции на треть дороже, в журнале строка. Две смены — и всё стихает.
   G.rush = {sx, sy, until}. */
const RUSH_SHIFTS=2;
function rushAt(sx,sy){const R=G.rush;return !!(R&&R.sx===sx&&R.sy===sy&&now()<R.until);}
function rushStart(sx,sy){
  G.rush={sx,sy,until:now()+RUSH_SHIFTS*HOLD_SHIFT};
  logAdd("dim","ГЛАВТРАССА: по многочисленным просьбам трудящихся на остановку «"+(getSystem(sx,sy).name||sx+":"+sy)+"» назначен дополнительный поезд");
}
function rushFuelMul(){return (G.st&&rushAt(G.sx,G.sy))?1.33:1;}
/* ══════════════ «успеваете скорым» (M507) ══════════════
   ДЕЛО читает расписание: если отсюда до места работы идёт поезд, строка
   говорит какой и когда отправление — и успеваете ли. Только со станции,
   у которой есть кольцо: расписание висит в вестибюле, а не в воздухе. */
function railCatch(sx,sy,leftMin){
  if(typeof railStation!=="function"||typeof railDestinations!=="function")return null;
  let D;try{if(!railStation(G.sx,G.sy))return null;D=railDestinations();}catch(e){return null;}
  const t=D.filter(x=>x.to.sx===sx&&x.to.sy===sy).sort((a,b)=>a.k-b.k)[0];
  if(!t)return null;
  const wait=railWaitNow(G.sx,G.sy),ride=t.k*25;
  const ok=leftMin==null||wait+ride<leftMin*60;
  return (ok?"успеваете":"не успеваете")+" электричкой «"+t.l.ru+"» · отправление через "+railFmt(wait)+" · "+t.k+" ост.";
}
