/* ══════════════ устав базы (M399, DESIGN-base §9) ══════════════
   Четыре закона, и каждый берётся НАВСЕГДА. Это и делает их решением, а не
   ползунком: ползунок можно подвинуть обратно, закон — нельзя.

   Законы открываются по мере того, как база растёт: на втором, четвёртом,
   шестом и восьмом построенном отсеке. То есть выбирает их тот, кто уже что-то
   построил, и выбирает под то, что построил.

   У каждого закона есть цена, и цена не «немного хуже», а другая по природе:
   двойная смена даёт четверть выработки и берёт духом и бедой; общий котёл
   снимает голод и берёт темпом; сухой закон чинит вдвое быстрее и берёт духом;
   открытая дверь приводит людей — и одного из шести приводит не того.

   Смотритель (перки) — это НАСКОЛЬКО ХОРОШО база работает; устав — ЧТО ЭТО ЗА
   МЕСТО. Они не спорят и не складываются в одну шкалу. */
const CHARTER=[
  {id:"double",ru:"Двойная смена",
   gives:"+25% ко всему, что база делает",
   costs:"−10 духа, беды на две пятых чаще"},
  {id:"pot",   ru:"Общий котёл",
   gives:"никто не голодает: харч делится поровну",
   costs:"−8% выработки: сытых половин не бывает"},
  {id:"dry",   ru:"Сухой закон",
   gives:"спирт идёт в технужды: ремонт вдвое быстрее",
   costs:"−12 духа"},
  {id:"door",  ru:"Открытая дверь",
   gives:"вдвое чаще приходят люди со стороны",
   costs:"один из шести приходит не тот"}
];
const CHARTER_AT=[2,4,6,8];       /* на скольких отсеках открывается закон */
const CHARTER_BY={};for(const L of CHARTER)CHARTER_BY[L.id]=L;
function charterOf(B){
  if(!B.charter||!Array.isArray(B.charter))B.charter=[];
  return B.charter;
}
function charterHas(B,id){return charterOf(B).indexOf(id)>=0;}
function charterBuilt(B){
  let n=0;
  for(const cell of (B.cells||[]))if(cell&&cell.hp>0)n++;
  return n;
}
/* сколько законов уже можно иметь: по числу построенного */
function charterSlots(B){
  const n=charterBuilt(B);
  let s=0;
  for(const need of CHARTER_AT)if(n>=need)s++;
  return s;
}
function charterFree(B){return Math.max(0,charterSlots(B)-charterOf(B).length);}
function charterTake(B,id){
  if(!CHARTER_BY[id]||charterHas(B,id))return false;
  if(charterFree(B)<=0){
    say("Устав пополняется, когда база растёт\nследующий закон — на "+
      (CHARTER_AT[charterOf(B).length]||"—")+" отсеках");
    return false;
  }
  charterOf(B).push(id);
  const n=(typeof baseShift==="function")?baseShift():0;
  if(typeof baseLog==="function")baseLog(B,"law",n,{ru:CHARTER_BY[id].ru});
  tell("tech","Устав базы «"+B.name+"»: "+CHARTER_BY[id].ru,
    "УСТАВ\n"+CHARTER_BY[id].ru+"\n"+CHARTER_BY[id].gives+"\n"+CHARTER_BY[id].costs+
    "\nзакон берётся навсегда");
  return true;
}
/* ── что законы делают ── */
function charterWorkMul(B){
  let m=1;
  if(charterHas(B,"double"))m*=1.25;
  if(charterHas(B,"pot"))m*=.92;
  return m;
}
function charterSpirit(B){
  let s=0;
  if(charterHas(B,"double"))s-=10;
  if(charterHas(B,"dry"))s-=12;
  return s;
}
/* общий котёл: пока харч есть вообще, голодных нет */
function charterFed(B){return charterHas(B,"pot");}
function charterFixMul(B){return charterHas(B,"dry")?2:1;}
function charterThreatMul(B){return charterHas(B,"double")?1.4:1;}
function charterGuestMul(B){return charterHas(B,"door")?2:1;}
/* открытая дверь: один из шести — не тот. Это не «плохой человек», а то, что
   бывает, когда дверь открыта всем: однажды из склада пропадёт треть */
function charterBadGuest(B,seed){
  if(!charterHas(B,"door"))return 0;
  return (hashi(seed|0,0x0D00,0x77)%6)===0?1:0;
}
function charterThiefStep(B,n){
  if(!B.thief||(B.thief|0)>n)return 0;
  B.thief=0;
  let lost=0;
  for(const k in (B.pool||{})){
    const q=B.pool[k]|0;
    if(q<=0)continue;
    const t=Math.ceil(q/3);B.pool[k]=q-t;lost+=t;
  }
  if(typeof baseLog==="function")baseLog(B,"thief",n,{q:lost});
  logAdd("warn","База «"+B.name+"»: со склада пропало "+lost+" ед");
  return 1;
}
/* строка для стола: что это за место */
function charterLine(B){
  const L=charterOf(B);
  if(!L.length)return charterSlots(B)?"устав пуст · можно взять закон":"устав пуст";
  return "устав: "+L.map(id=>CHARTER_BY[id].ru.toLowerCase()).join(" · ")+
    (charterFree(B)?" · можно взять ещё":"");
}
