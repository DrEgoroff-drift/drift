/* ══════════════ доступ: кредиты покупают вещи, допуск — нужные (M908 · DESIGN-game §4.4) ══════════════
   Цена осталась ценой; воротами стали органы, которые уже были и ничего не делали: допуск (05e),
   разнарядка по норме (28j), поручитель, норма участка, ступени системы (12ae).

   ПРАВИЛА ФАЙЛА:
   1. Корпуса (крючок yardGate → строка дока 26): до «Ската» — без ворот; «Клинок», «Обод», «Топор» —
      допуск II или разнарядка; «Мамонт» — допуск III И поручитель; каталог (04b) — по цене той же
      лестницей (дешевле «Ската» свободно, до «Топора» — II, дороже — III с поручителем); редкий,
      легендарный и опытный — никогда за одни кредиты (разнарядка, сплав, корпус ренегата, «Сорока»).
      Свой корпус не запирается никогда.
   2. Поручитель — один из трёх: управляющий на уровне ≥ 3, держава, с которой было дело (12ap), или
      станция, которую вы снабжали восемь заходов (нужда, наряд, привоз диспетчера — раз на заход).
   3. Тридцать ступеней: ни одна не молчит. У ★ и у Стапельной, Полдня эффект был; остальным здесь —
      по рычагу (цена, лицо, право), и строка рычага дописана к записке ступени (доска, момент
      стыковки). Рычаги читаются в настоящих функциях: заправка, ремонт, скупка, прилавок, шкалы
      станции (полы), баржи участка, плата диспетчера. Число игроку не печатается — только слова.
   4. Цеха второго и третьего яруса (семейства C, D кроме стапеля): ступень, как было, И норма
      участка ≥ 75 % в последнюю сводку.
   5. Второй участок (§4.4, последняя строка) не строится: участок один (28j). */
const ACC_FREE=["strizh","igla","vyuk","skat"],ACC_II=["klinok","obod","topor"],ACC_III=["mamont"];
const ACC_NEVER_TIERS=["rare","legend","proto"],ACC_SUP_N=8,ACC_NORM=75,ACC_MGR_LVL=3;
/* ступень → [рычаг, величина, строка] (полы — max, баржи — сумма, остальное — множитель) */
const ACC_RUNG={
  1:["disp",1.05,"бумаги отсюда платят на пять процентов больше"],
  2:["fuel",.95,"заправляют по вашему расчёту — дешевле"],
  3:["repair",.95,"чинят по-соседски — дешевле"],
  4:["sell",1.02,"скупщик берёт у вас дороже"],
  6:["buy",.98,"с грунта отдают дешевле"],
  7:["disp",1.05,"институт доплачивает за дела отсюда"],
  8:["sFloor",.33,"склад не пустеет ниже трети"],
  9:["repair",.95,"шлюзовые чинят без очереди и дешевле"],
  12:["mFloor",.45,"люди не падают духом"],
  13:["buy",.97,"со склада отпускают дешевле"],
  14:["sell",1.03,"руду и товар здесь берут дороже"],
  16:["npc",.1,"чужие баржи закрывают нужды чаще"],
  17:["disp",1.05,"груз ждёт — дела отсюда платят больше"],
  18:["mFloor",.5,"семьи: люди не хмурятся"],
  19:["fuel",.95,"своим заправка по нормативу"],
  21:["oFloor",.45,"своя сводка: порядок держится"],
  23:["disp",1.1,"кафедра доплачивает за пробы и записи"],
  24:["oFloor",.6,"очаг здесь не растёт"],
  26:["repair",.9,"ремонт по окружному тарифу"],
  27:["npc",.1,"баржи ходят по расписанию"],
  28:["sFloor",.5,"склад не ниже половины"],
  29:["buy",.97,"еда и лёд — свои, дешевле"]
};
(function accRungNotes(){for(const i in ACC_RUNG)if(RUNGS[i]&&RUNGS[i].note.indexOf(ACC_RUNG[i][2])<0)RUNGS[i].note+=" · "+ACC_RUNG[i][2];})();
function accSt(){
  if(!G.acc||typeof G.acc!=="object")G.acc={};
  const A=G.acc;
  if(!A.sup||typeof A.sup!=="object")A.sup={};
  if(!A.supV||typeof A.supV!=="object")A.supV={};
  A.allot=A.allot?1:0;
  return A;
}
/* ── рычаги ступеней ── */
function accLever(sx,sy){
  const r=typeof rungOfCached==="function"?rungOfCached(sx,sy):rungOf(sx,sy);
  const L={r,disp:1,fuel:1,repair:1,sell:1,buy:1,sFloor:0,mFloor:0,oFloor:0,npc:0};
  for(let i=1;i<=r;i++){
    const f=ACC_RUNG[i];if(!f)continue;
    const k=f[0],v=f[1];
    if(/Floor$/.test(k))L[k]=Math.max(L[k],v);else if(k==="npc")L[k]+=v;else L[k]*=v;
  }
  return L;
}
function accLeverSys(sys){return sys&&isFinite(sys.sx)?accLever(sys.sx,sys.sy):accLever(1e6,1e6);}
/* ── снабжение станции: раз на заход ── */
function accSupply(sys){
  if(!sys||!sys.station)return;
  const A=accSt(),tag=typeof visitHere==="function"?String(visitHere()):String(Math.floor(now()/60000));
  if(A.supV[sys.key]===tag)return;
  A.supV[sys.key]=tag;A.sup[sys.key]=(A.sup[sys.key]|0)+1;
}
/* ── поручитель ── */
function accSponsor(){
  for(const m of (G.mgrs||[]))if(!m.stalled&&mgrLevel(m)>=ACC_MGR_LVL)return {who:m.name,why:"управляющий"};
  for(const p in POWERS)if(hasEpisode(p))return {who:POWERS[p].ru||p,why:"держава"};
  const A=accSt();
  for(const key in A.sup)if((A.sup[key]|0)>=ACC_SUP_N){const S=dispSysOf(key);return {who:S&&S.station?S.station.name:key,why:"станция"};}
  return null;
}
/* ── корпус: какой ступени доступа он ждёт (0 — без ворот, 9 — не за кредиты) ── */
function accHullNeed(id,S){
  if(SHIPS[id])return ACC_FREE.indexOf(id)>=0?0:ACC_II.indexOf(id)>=0?2:ACC_III.indexOf(id)>=0?3:0;
  if(!S||G.uniqueShips[id])return 0;
  if(ACC_NEVER_TIERS.indexOf(shipTier(S))>=0)return 9;
  const p=S.price|0;
  return p<=SHIPS.skat.price?0:p<=SHIPS.topor.price?2:3;
}
function accGate(id,S){
  if(G.owned[id])return "";
  const n=accHullNeed(id,S);
  if(!n)return "";
  if(n===9)return "только по разнарядке";
  const c=clearanceNow();
  if(n===2)return c>=2||accSt().allot?"":"допуск II или разнарядка";
  if(c<3)return "допуск III и поручитель";
  return accSponsor()?"":"нужен поручитель";
}
/* ── цеха второго и третьего яруса: норма участка ── */
function accNormOk(){const W=typeof watchSt==="function"?watchSt():null;return !!(W&&W.last&&W.last.norm>=ACC_NORM);}
/* прилавок: скупка выше на sell — запрос не растёт вместе с ней; ниже на buy; и всегда дороже сдачи —
   на 3 %, не меньше кредита: спред внутри станции не схлопывается (Контроль, 22.10); но ступень
   никогда не делает прилавок дороже, чем без неё */
const ACC_SPREAD=1.03;
function accCounter(sys,k,p){
  const L=accLeverSys(sys);
  if(L.sell===1&&L.buy===1)return p;
  const m=marketFor(sys)[k]|0;
  return Math.max(m+1,Math.min(Math.round(p/L.sell),Math.max(Math.round(m*ACC_SPREAD),Math.round(p*L.buy/L.sell))));
}
function accRestore(s){
  const b=s&&s.acc;G.acc=null;
  if(!b||typeof b!=="object")return;
  const A=accSt();A.allot=b.allot?1:0;
  if(b.sup&&typeof b.sup==="object")for(const k in b.sup)if(/^-?\d+,-?\d+$/.test(k))A.sup[k]=Math.max(0,b.sup[k]|0);
  if(b.supV&&typeof b.supV==="object")for(const k in b.supV)if(/^-?\d+,-?\d+$/.test(k))A.supV[k]=String(b.supV[k]);
}
const ACC_TIER2=def=>def&&(def.fam==="C"||(def.fam==="D"&&def.id!=="slipway"));
/* ── крючки — одной таблицей, как у диспетчера (28m): имя → обёртка над прежней функцией ── */
const ACC_HOOKS=[
  /* рычаги ступеней — в настоящих ценах */
  ["fuelPriceHere",O=>function(){const p=O.apply(this,arguments);return G.sys?Math.max(1,Math.round(p*accLeverSys(G.sys).fuel)):p;}],
  ["repairCost",   O=>function(){const p=O.apply(this,arguments);return G.sys&&G.sys.station?Math.max(4,Math.round(p*accLeverSys(G.sys).repair)):p;}],
  ["marketCtx",    O=>function(sys){const C=O.apply(this,arguments);C.occ*=accLeverSys(sys).sell;return C;}],
  ["buyPriceFor",  O=>function(sys,k){return accCounter(sys,k,O.apply(this,arguments));}],
  ["watchNpcRate", O=>function(S){const p=O.apply(this,arguments);return p>0?Math.min(.9,p+accLeverSys(S).npc):p;}],
  ["gaugeRead",    O=>function(key){
    const g=O.apply(this,arguments),xy=gaugeKeyXY(key),L=accLever(xy[0],xy[1]);
    if(L.sFloor)g.s=Math.max(g.s,L.sFloor);
    if(L.mFloor)g.m=Math.max(g.m,L.mFloor);
    if(L.oFloor)g.o=Math.max(g.o,L.oFloor);
    return g;}],
  ["dispIssue",    O=>function(kind,S){const it=O.apply(this,arguments);if(it){const m=accLeverSys(S).disp;if(m!==1)it.pay=dispR10(it.pay*m);}return it;}],
  /* снабжение: нужда, наряд, привоз диспетчера */
  ["needClose",    O=>function(sys){const r=O.apply(this,arguments);if(r)accSupply(sys);return r;}],
  ["orderDeliver", O=>function(){const sys=G.sys,r=O.apply(this,arguments);if(r)accSupply(sys);return r;}],
  ["dispDone",     O=>function(it){
    const r=O.apply(this,arguments);
    if(it&&(it.kind==="haul"||it.v==="tri"||it.v==="dvoynaya")){const S=dispSysOf(it.legs[it.legs.length-1].key);if(S)accSupply(S);}
    return r;}],
  /* разнарядка по норме (28j) — право на корпуса второй ступени */
  ["watchAllot",   O=>function(){const r=O.apply(this,arguments);if(r)accSt().allot=1;return r;}],
  /* ворота: корпус (дело с державой, 04c, — своя причина, она главнее) и цех по норме */
  ["yardGate",     O=>function(id,S){const g=O.apply(this,arguments),a=accGate(id,S);return (!a||(g&&g.lock))?g:{mul:g?g.mul:1,lock:a,why:a};}],
  ["bldWhy",       O=>function(sys,def){
    const w=O.apply(this,arguments);
    if(w||!ACC_TIER2(def))return w;
    return accNormOk()?"":"ярус дают по норме: нужна сводка участка не ниже "+ACC_NORM+" %";}],
  /* запись */
  ["snapshot",     O=>function(){const s=O.apply(this,arguments);s.acc=G.acc||null;return s;}],
  ["applySave",    O=>function(s){const r=O.apply(this,arguments);if(r)accRestore(s);return r;}]
];
for(const [n,mk] of ACC_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("доступ: нет крючка "+n);window[n]=mk(O);}
