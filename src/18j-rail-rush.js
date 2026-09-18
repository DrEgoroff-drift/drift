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
