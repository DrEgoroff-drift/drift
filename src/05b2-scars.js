/* ══════════════ корпус помнит — шрамы (M482, DESIGN-shipyard §6) ══════════════
   У корпуса, притащенного на тросе или отданного со списания, 1–3 шрама —
   его история, а не выводимое: лежат в записи корабля (S.scars) и в сейве.
     burn — выгоревшая клетка: трюма на десятую меньше;
     bent — погнутый подвес: конус орудий уже на треть, поворот хуже на 6 %;
     leak — течёт бак: в полёте −1 % топлива в минуту.
   Верфь чинит шрам за деньги; корпус со шрамами дешевле. Рисунок шрама на
   силуэте — дизайнерский долг (D18). */
const SCAR_KIND={
  burn:{ru:"выгоревшая клетка",fx:"трюм −10 %"},
  bent:{ru:"погнутый подвес",fx:"конус орудий −30 %, поворот −6 %"},
  leak:{ru:"течёт бак",fx:"−1 % топлива в минуту полёта"}
};
const SCAR_KEYS=Object.keys(SCAR_KIND);
function scarsRoll(seed,n){
  const out=[];
  for(let i=0;i<n;i++){const k=SCAR_KEYS[hashi(seed|0,i,0x5CA2)%3];if(out.indexOf(k)<0)out.push(k);}
  return out;
}
function scarsOf(S){return (S&&Array.isArray(S.scars))?S.scars:[];}
function scarHas(S,k){return scarsOf(S).indexOf(k)>=0;}
/* множители для stat(): без шрамов — ровно 1 */
function scarFactors(S){
  return {cargo:scarHas(S,"burn")?.9:1,turn:scarHas(S,"bent")?.94:1,arc:scarHas(S,"bent")?.7:1};
}
/* скидка на корпус со шрамами — по 12 % за шрам */
function scarPriceMul(S){return 1-.12*scarsOf(S).length;}
/* раз в минуту полёта: течь */
function scarTick(){
  const S=shipData(G.shipId);
  if(!scarHas(S,"leak")||G.mode!=="system")return;
  const fm=stat().fuelMax;
  G.fuel=Math.max(0,G.fuel-fm*.01);
}
function scarFixCost(S){return Math.round((400+(S.price||3000)*.06)/50)*50;}
function scarFix(id,k){
  const S=shipData(id);if(!scarHas(S,k))return false;
  const c=scarFixCost(S);if(G.credits<c){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return false;}
  G.credits-=c;S.scars=scarsOf(S).filter(x=>x!==k);
  logAdd("tech","Верфь «"+(G.st?G.st.name:"")+"»: "+SCAR_KIND[k].ru+" — починено · "+c.toLocaleString("ru")+" кр");
  return true;
}
/* ШРАМЫ на вкладке верфи: у корабля в рейсе */
function scarBlock(){
  const S=shipData(G.shipId),L=scarsOf(S);
  if(!L.length)return null;
  const box=document.createElement("div");
  box.appendChild(el("div","sec","КОРПУС ПОМНИТ · ШРАМЫ «"+S.ru+"»"));
  for(const k of L){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+SCAR_KIND[k].ru+"</b><s>"+SCAR_KIND[k].fx+"</s>"));
    const c=scarFixCost(S),b=el("button","act",c.toLocaleString("ru")+" кр");
    b.disabled=G.credits<c||!G.st||G.st.stype!=="yard";
    b.onclick=()=>{if(scarFix(G.shipId,k)){renderTab();saveGame(true);}};
    r.appendChild(b);box.appendChild(r);
  }
  return box;
}
