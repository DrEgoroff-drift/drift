/* ══════════════ репутация: вас помнят там, где вы бывали ══════════════ */
/* В таблице дел (`27g-deals`) цена «rep» была заложена с самого начала, но
   тратить её было некуда: репутации в игре не существовало. Обещание без кода —
   это обман, поэтому либо цену убрать, либо сделать репутацию. Сделана она
   узко и честно: репутация ЛОКАЛЬНА (у каждой станции своя), меняется только
   от поступков, и влияет на цену того, что покупают у людей, — топливо, ремонт,
   найм. Товары на рынке она не трогает: рынок про спрос, а не про симпатию.

   ПРАВИЛА:
   1. Одна шкала на станцию, от −5 до +5, без дробей и процентов на экране:
      игроку нужно слово, а не число.
   2. Репутация не копится сама. Ни за время, ни за налёт: только поступки —
      закрытые дела, освобождение системы, сорванные обещания.
   3. Влияние маленькое и заметное: до четверти на топливе и ремонте, до трети
      на найме. Больше — и игра превратилась бы в «прокачай репутацию сначала». */
const REP_MIN=-5,REP_MAX=5;
const REP_WORDS=[
  {at:-4,ru:"вас тут не ждут",  col:"#ff6b57"},
  {at:-2,ru:"смотрят косо",     col:"#ff9d7a"},
  {at:-1,ru:"помнят нехорошее", col:"#f2b25c"},
  {at:0, ru:"вы им никто",      col:"#9fb0bd"},
  {at:1, ru:"вас знают",        col:"#8fd08a"},
  {at:3, ru:"вам рады",         col:"#7fe6d8"},
  {at:5, ru:"вы тут свой",      col:"#c8f0ff"}
];
function repKey(sys){return (sys?sys.sx:G.sx)+","+(sys?sys.sy:G.sy);}
function repAt(sys){
  const v=G.rep&&G.rep[repKey(sys)];
  return clamp(v|0,REP_MIN,REP_MAX);
}
function repWord(v){
  let out=REP_WORDS[0];
  for(const w of REP_WORDS)if(v>=w.at)out=w;
  return out;
}
function repAdd(n,sys){
  if(!n)return 0;
  if(!G.rep)G.rep={};
  const k=repKey(sys),was=repAt(sys);
  G.rep[k]=clamp(was+n,REP_MIN,REP_MAX);
  const now=repAt(sys);
  if(now!==was){
    const W=repWord(now);
    logAdd(n>0?"good":"warn",
      "«"+((sys||G.sys).station?(sys||G.sys).station.name:"станция")+"»: "+W.ru);
  }
  return now-was;
}
/* ── что репутация меняет ──
   Только то, что назначает человек: топливо, ремонт, наём. Рыночные цены она
   не трогает — иначе торговля перестала бы быть про спрос. */
function repFuelMul(){return 1-repAt()*.05;}      // ±25% на краях шкалы
function repRepairMul(){return 1-repAt()*.05;}
function repHireMul(){return 1-repAt()*.06;}      // ±30% на найме
/* строка для шапки станции: слово, а не число */
function repLine(sys){
  const v=repAt(sys),W=repWord(v);
  return W.ru;
}
/* ── цена топлива и ремонта с учётом того, как к вам относятся ──
   Обе функции живут здесь, а не в станции: цена — это отношение, и держать её
   рядом с репутацией честнее, чем размазывать множители по экранам. */
function fuelPriceHere(){
  return Math.max(1,Math.round((G.st?G.st.fuelPrice:10)*repFuelMul()));
}
/* железо в доке: части и корпуса. Скидка вдвое меньше, чем на работе, — станок
   не помнит вас лично, а продавец помнит наполовину */
function repPartMul(sys){return 1-repAt(sys)*.03;}
function repShipMul(sys){return 1-repAt(sys)*.02;}
