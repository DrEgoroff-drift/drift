/* ══════════════ большой уезд: город без кнопок ══════════════
   M140-county. Край археологов и мародёров (06c, `county`, игла масс-детектора):
   копают, возят, подделывают и продают «древности». На окраине — тяжёлую
   кладку берут на строительный камень; ближе — четырёхметровые двери и
   двенадцатитонные подъёмники уже приспособлены под склады.

   ЯДРО — ЦЕЛЫЙ ГОРОД БЕЗ ЕДИНОЙ КНОПКИ: всё отвечает на ЗВУК. Интерфейс — шум:
   ранец, бур, удар о грунт. Игрок учится говорить громкостью.
   ПОВОРОТ: детская маленькая. Жители были нашего роста. Значит, масштаб был
   никогда не для жителей — ДЛЯ ГОСТЯ.
   Город всё ещё слушает. Шуметь можно сколько угодно. Когда-нибудь — не здесь
   и не скоро — что-то ответит.

   ПРАВИЛА ФАЙЛА:
   1. Шум не хранится: громкость — счётчик на этой высадке. Хранится только,
      что город вас услышал и ответил ли (G.county).
   2. Ответ приходит один раз, далеко отсюда, не раньше двадцати прыжков,
      и он не объясняется. */

const COUNTY_LVL=[30,70,120,160];           // двери · свет · подъёмник · услышали
function countyAll(){return (G.county||(G.county={called:0,at:0,answered:0,saw:0}));}
function countyDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="county")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function countyDepthHere(){return countyDepthAt(G.sx,G.sy);}
function countyCorePlanet(sys){
  if(!sys||countyDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(typeof settleCanLive==="function"&&settleCanLive(p))return p;
  return null;
}
function countyIsCore(p){const c=countyCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* кладка в уезде крупнее: окраина в полтора раза, ядро вдвое (20a genPOI) */
function countyPoiK(){const d=countyDepthHere();return d===2?2:(d===1?1.5:1);}
/* дворы города — под гостя, не под жителей (settlePlan 12tb; дверь в четыре метра — 21pii) */
function countyHouseK(p){return countyIsCore(p)?2.3:1;}
function countyGroundLine(){
  const d=countyDepthHere();
  if(!d)return null;
  return d===1?"Кладку разбирают на камень. Блоки — в рост человека.":"Двери в четыре метра. Кнопок нет нигде.";
}
/* ── шум ──
   Зовётся из updateSurface каждый кадр на планете ядра. Ранец, бур и удар
   о грунт — громкость; тишина — спад. Уровни открывают город по очереди. */
function countyNoiseTick(S,dt){
  if(!countyIsCore(S.p))return;
  let n=S.noise||0;
  if(S.jetOn)n+=.9*dt;
  if(S.mining)n+=.6*dt;
  if(S.shake>4)n+=6;
  n=Math.max(0,n-.12*dt);
  S.noise=n;
  const lvl=countyLevel(S);
  if(lvl>=3&&!countyAll().saw){countyAll().saw=1;logAdd("dim","Подъёмник пошёл. Наверху — детская. Кроватки по нашему росту.");}
  if(lvl>=4&&!countyAll().called){const C=countyAll();C.called=1;C.at=(G.odo&&G.odo.jumps)|0;logAdd("dim","Город услышал. Что-то — не здесь и не скоро.");}
}
function countyLevel(S){
  const n=(S&&S.noise)||0;
  let l=0;for(const t of COUNTY_LVL)if(n>=t)l++;
  return l;
}
/* ── ответ ──
   Один раз, далеко, не раньше двадцати прыжков: строка в эфире без пояснений. */
function countyAnswerLine(){
  const C=countyAll();
  if(!C.called||C.answered||countyDepthHere())return null;
  if((((G.odo&&G.odo.jumps)|0)-C.at)<20)return null;
  C.answered=1;
  return "…(низкий гул. Три такта. Как гудок, только ниже. Потом тишина.)";
}
