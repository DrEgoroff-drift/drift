/* ══════════════ без присмотра: дроны на 60 %, не больше часа яруса (M905 · DESIGN-game §10.5) ══════════════
   Люди работают только онлайн (12a-crew: загрузка и спящая вкладка ставят их часы на «сейчас»),
   Страхкасса и оклады в счёте догоняют не больше часа (27ib-bill, 28i-insure). Без присмотра
   оставались дроны: суточный догон на полном доходе — ночь простоя давала больше часа игры.

   ПРАВИЛА ФАЙЛА:
   1. Такт дронов после разрыва дольше минуты (тот же порог, что у людей, PEOPLE_GAP_MS) —
      догон без игрока. Круги, поломки, давление рынка — всё как было; меняется только касса.
   2. В догоне приходит 60 % выручки и не больше часа чистого своего яруса — половины пола
      кассы взаимопомощи (BILL_FLOOR_T — это два часа). Остальное ушло на сторону: присмотра
      не было.
   3. Сколько пришло и из скольких — одной строкой. Доля, которую не показали, читается как кража.
   4. Сданная смена (28j-watch) — другое: там не идёт ничего, и догона нет вовсе. */
const OFF_MUL=.6;
let OFF_POOL=null;   /* {left, full, paid} — только пока идёт догон */
function offCap(){return Math.round(BILL_FLOOR_T[billTier()]/2);}
function offSpan(ms){
  const m=Math.round(ms/60000);
  if(m<90)return m+" мин";
  const h=Math.round(ms/3600000);
  return h<48?h+" ч":Math.round(h/24)+" сут.";
}
const OFF_OLD_EARN=earn;
earn=function(sum,why){
  if(OFF_POOL&&why==="drone"){
    const full=Math.round(sum);
    if(!isFinite(full)||full<=0)return 0;
    const pay=Math.max(0,Math.min(Math.round(full*OFF_MUL),OFF_POOL.left));
    OFF_POOL.full+=full;OFF_POOL.left-=pay;OFF_POOL.paid+=pay;
    return pay>0?OFF_OLD_EARN(pay,why):0;
  }
  return OFF_OLD_EARN.apply(this,arguments);
};
const OFF_OLD_TICK=tickDrones;
tickDrones=function(){
  if(OFF_POOL||!(G.drones&&G.drones.length)||watchHanded())return OFF_OLD_TICK.apply(this,arguments);
  const t=clockNow();let gap=0;
  for(const d of G.drones)if(d&&d.lastMs>0)gap=Math.max(gap,t-d.lastMs);
  if(gap<=PEOPLE_GAP_MS)return OFF_OLD_TICK.apply(this,arguments);
  const before=G.drones.map(d=>[d,d.earned|0]);
  OFF_POOL={left:offCap(),full:0,paid:0};
  let r;
  try{r=OFF_OLD_TICK.apply(this,arguments);}
  finally{
    const P=OFF_POOL;OFF_POOL=null;
    if(P.full>0){
      /* счётчик машины — то, что дошло до кассы, а не то, что она сдала */
      const k=P.paid/P.full;
      for(const [d,e0] of before)d.earned=e0+Math.round(((d.earned|0)-e0)*k);
      offSay(gap,P);
    }
  }
  return r;
};
function offSay(gap,P){
  const capped=P.paid<Math.round(P.full*OFF_MUL);
  logAdd("money","Дроны без вас, "+offSpan(gap)+": сдали на "+P.full.toLocaleString("ru")+" кр, в кассу — "+
    P.paid.toLocaleString("ru")+(capped?" · больше часа работы без присмотра не платят":" · шестьдесят процентов: присмотра не было"));
}
