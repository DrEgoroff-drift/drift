/* ══════════════ перевал: корабль, к которому ходят на поклон ══════════════
   M144-pass. Глухой уезд, куда почти никто не летает: дорого и незачем (06c,
   `pass`, игла курсографа). На окраине — посёлки со странными привычками;
   потом прибор, который держат за святыню и «кормят»; потом язык, где
   руководство по эксплуатации стало литургией, а список экипажа — именами
   святых.

   ЯДРО — САМ КОРАБЛЬ, к которому ходят паломники. Внутри всё цело и целиком
   понятно ВАМ — и целиком непонятно им, хотя они из него вышли.
   Свет можно включить. Это будет самое большое, что здесь случилось за век.
   РАЗВИЛКА БЕЗ ПРАВИЛЬНОГО ОТВЕТА: объяснить — отнять у них единственное, что
   держало их вместе; не объяснить — оставить как есть. Игра не подсказывает
   и не награждает.

   ПРАВИЛА ФАЙЛА:
   1. Ни награды, ни подсказки. Ни за свет, ни за объяснение, ни за молчание.
   2. Хранится G.pass={lit,told}. */

function passAll(){return (G.pass||(G.pass={lit:0,told:0}));}
function passDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="pass")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function passDepthHere(){return passDepthAt(G.sx,G.sy);}
function passCorePlanet(sys){
  if(!sys||passDepthAt(sys.sx,sys.sy)!==2)return null;
  const ps=sys.planets||[];
  return ps.find(p=>typeof settleCanLive==="function"&&settleCanLive(p))||ps.find(p=>p.type!=="gas")||null;
}
function passIsCore(p){const c=passCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* корабль стоит за посёлком, на четыреста шагов дальше по ходу */
function passShipX(tr,p){
  const sx=(typeof settleSpotX==="function"&&settleCanLive(p))?settleSpotX(p,tr):tr.W*.5;
  return clamp(sx+420,300,tr.W-300);
}
function passGroundLine(){
  const d=passDepthHere();
  if(!d)return null;
  const P=passAll();
  if(d===1)return "Прибор на площади кормят. Руководство по эксплуатации поют.";
  if(P.told)return "Руководство больше не поют. По домам разошлись молча.";
  if(P.lit)return "В корабле горит свет. Они стоят и смотрят. Сто лет так не стояли.";
  return "Корабль. Они из него вышли и не знают, что это.";
}
function passAtShip(S){return !!(S&&passIsCore(S.p)&&Math.abs(S.x-passShipX(S.tr,S.p))<44);}
function passAtVillage(S){return !!(S&&passIsCore(S.p)&&settleCanLive(S.p)&&Math.abs(S.x-settleSpotX(S.p,S.tr))<44);}
function passLight(){
  const P=passAll();if(P.lit)return false;
  P.lit=1;
  logAdd("dim","Свет зажёгся. Самое большое, что здесь случилось за век.");
  return true;
}
function passTell(){
  const P=passAll();if(!P.lit||P.told)return false;
  P.told=1;
  logAdd("dim","Объяснили. Они слушали. Потом пошли по домам. Литургии больше нет.");
  return true;
}
/* вид — тело движка (21piif): корпус в грунте, иллюминаторы, трап, паломники */
