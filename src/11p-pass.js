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
/* ── вид ──
   Корпус в грунте: длинное тело, киль, ряд иллюминаторов. Свет — когда включён.
   Паломники — три фигуры у трапа, пока не объяснили. */
function passDraw(tr,camx,camy,p){
  if(!passIsCore(p))return;
  const P=passAll(),x0=passShipX(tr,p),sx=x0-camx;
  if(sx<-260||sx>W+260)return;
  const y=groundAt(tr,x0)-camy;
  const L=190,Hh=46;
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(sx,y-1,L*.55,5,0,0,TAU);ctx.fill();
  ctx.fillStyle="rgb("+p.T.pal[2].map(v=>Math.round(v*.45+24)).join(",")+")";
  ctx.beginPath();ctx.moveTo(sx-L/2,y-8);ctx.lineTo(sx-L/2+30,y-Hh);ctx.lineTo(sx+L/2-40,y-Hh-6);ctx.lineTo(sx+L/2,y-Hh*.5);ctx.lineTo(sx+L/2-10,y-6);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(226,236,240,.28)";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="rgba(60,64,70,.95)";ctx.fillRect(sx+L/2-70,y-Hh-34,14,30);   /* киль */
  for(let i=0;i<6;i++){
    const wx=sx-L/2+44+i*22,wy=y-Hh*.66;
    ctx.fillStyle=P.lit?"rgba(255,226,160,.9)":"rgba(10,12,16,.9)";
    ctx.beginPath();ctx.arc(wx,wy,3.2,0,TAU);ctx.fill();
    if(P.lit){const g=ctx.createRadialGradient(wx,wy,2,wx,wy,16);g.addColorStop(0,"rgba(255,226,160,.35)");g.addColorStop(1,"rgba(255,226,160,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(wx,wy,16,0,TAU);ctx.fill();}
  }
  ctx.fillStyle="rgba(40,44,50,.95)";ctx.fillRect(sx-L/2+10,y-22,4,22);ctx.fillRect(sx-L/2+10,y-22,26,3);   /* трап */
  if(!P.told)for(let i=0;i<3;i++){
    const ox=sx-L/2-14-i*12,oy=groundAt(tr,x0-L/2-14-i*12+0)-camy;
    ctx.fillStyle="rgba(20,24,30,.9)";ctx.fillRect(ox-1.6,oy-12,3.2,12);ctx.beginPath();ctx.arc(ox,oy-14.5,2.5,0,TAU);ctx.fill();
  }
}
