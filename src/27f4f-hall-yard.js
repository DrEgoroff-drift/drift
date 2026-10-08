/* ══════════════ верфь: корпуса в ангаре (M812, docs/DESIGN-hall.md §8) ══════════════
   В зале строка корпуса — карточка: сверху корабль в ангарной студии (объём 17c2a, тот же вид, что в
   ангаре ОПИСИ: наклон к зрителю, три четверти по курсу, ровный свет) на месте не меньше 160 px высотой,
   под ним имя и класс тегом, числа и кнопка. Карточки — сеткой по две на ПК, по одной на телефоне.
   Строку строит прежний shipRow (26), здесь она только переложена: покупка и пересадка — его. */
const HALL_YARD_H=170;   /* высота места под корабль, CSS px: ≥160 — мерило M812 */
const HALL_YARD_V3={yaw:.5,tilt:.98,persp:.14,gear:null,aim:null,lz:.95,fill:.36,rim:.5};
/* карточка из строки shipRow: место под корабль во всю ширину, класс — тегом у имени */
function hallShipCard(id,S){
  const r=shipRow(id,S);r.classList.add("hcard");
  const th=r.querySelector(".yth");if(th){th.style.cssText="";th.classList.add("big");}
  const b=r.querySelector(".nm>b"),sp=b&&b.querySelector("span");
  if(sp){sp.remove();b.textContent=b.textContent.trim();const t=document.createElement("i");t.className="cls";t.textContent=S.cls;b.after(t);}
  return r;
}
/* список корпусов: в зале — сетка карточек, без зала — прежние строки */
function hallShipList(pairs){
  const box=HALL.open?el("div","hcards"):null;
  for(const [id,S] of pairs){if(!S)continue;(box||$body).appendChild(box?hallShipCard(id,S):shipRow(id,S));}
  if(box&&box.firstChild)$body.appendChild(box);
}
/* вид студии для места: большое (карточка) — объём в три четверти, рамка по самому корпусу; малое — сверху.
   Возвращает [x,y,sc] центра и масштаба в рамке w×h и ставит S.v3 */
function hallYardFit(S,id,w,h){
  const hl=hullOf(id);
  if(h>=120&&H3D.on&&typeof hgUnits==="function"){
    const v3=HALL_YARD_V3;v3.gear=h3dStockGear(id);
    const m=h3dMesh(hl,v3.gear),U=hgUnits(m,v3.tilt,v3.persp,[v3.yaw]);
    const sc=Math.min(w*.88/Math.max(1e-3,U.hu1-U.hu0),h*.8/Math.max(1e-3,U.hv1-U.hv0));
    S.v3=v3;return [w/2-(U.hu0+U.hu1)/2*sc,h*.47-(U.hv0+U.hv1)/2*sc,sc];}
  S.v3=null;const sc=Math.min(w/(hl.len+14),h/(hl.halfW*2+10));
  return [w/2-(hl.nose+hl.tail)*.5*sc,h/2,sc];
}
