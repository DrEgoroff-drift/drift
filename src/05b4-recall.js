/* ══════════════ отзыв партии (M509, PLAN «new mechanics», st. 6) ══════════════
   Раз в неделю (семь смен) Хай-Фронт отзывает партию: из ваших деталей их
   работы примерно каждая шестая попадает под отзыв — извещение в ПОЧТУ,
   «партия отозвана». Замена даром на любой станции в земле Хай-Фронта
   (строка во вкладке верфи/торговли): деталь того же рода и тира, новая,
   на то же место. Оставили — старая становится шрамом: её прибавки на
   15 % слабее, пока не замените. Отозванные — по зерну в G.recalled. */
const RECALL_WEEK=7,RECALL_MUL=.85;
function recallBucket(){return Math.floor(now()/(HOLD_SHIFT*RECALL_WEEK));}
function recalled(p){return !!(p&&G.recalled&&G.recalled[p.seed>>>0]);}
/* раз в минуту: новая неделя — новый отзыв */
function recallTick(){
  const b=recallBucket();
  if(G.recallB===b)return;
  G.recallB=b;
  if(!G.recalled)G.recalled={};
  const hit=[];
  for(const p of G.inv||[]){
    if(p.by!=="hf"||recalled(p))continue;
    if(hashi(p.seed>>>0,b,0x2EC1)%6===0){G.recalled[p.seed>>>0]=1;hit.push(p);}
  }
  if(!hit.length)return;
  invalidateParts();
  logAdd("bad","ПОЧТА · Хай-Фронт: партия отозвана — «"+hit.map(p=>p.name).join("», «")+"». Бесплатная замена на станциях Хай-Фронта. Оставленная деталь работает хуже.");
}
/* прибавки с отзывом: зовёт partBonus */
function recallScale(p,k,v){return (recalled(p)&&k!=="gun"&&k!=="msl")?v*RECALL_MUL:v;}
function recallReplace(p){
  if(!recalled(p))return false;
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;
  if(by!=="hf"){say("Замена — только у Хай-Фронта",90);return false;}
  const np=genPart(hashi(p.seed>>>0,recallBucket(),0x2EC2)>>>0,p.tier,p.kind,0,null,"hf");
  delete G.recalled[p.seed>>>0];
  const id=p.id;Object.assign(p,np);p.id=id;
  invalidateParts();
  logAdd("tech","Хай-Фронт: замена по отзыву · «"+p.name+"» на месте старой · «спасибо, что остаётесь с нами»");
  return true;
}
function recallRows(){
  const L=(G.inv||[]).filter(recalled);
  if(!L.length)return null;
  const box=document.createElement("div");
  box.appendChild(el("div","sec","ОТЗЫВ ПАРТИИ · ХАЙ-ФРОНТ"));
  const hf=(typeof stampOwnerAt==="function")&&stampOwnerAt(G.sx,G.sy)==="hf";
  for(const p of L){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+p.name+"</b><s>партия отозвана · работает на "+Math.round(RECALL_MUL*100)+" % · "+(hf?"замена даром":"замена — на станциях Хай-Фронта")+"</s>"));
    if(hf){const b=el("button","act gold","ЗАМЕНИТЬ ДАРОМ");b.onclick=()=>{if(recallReplace(p))renderTab();};r.appendChild(b);}
    box.appendChild(r);
  }
  return box;
}
