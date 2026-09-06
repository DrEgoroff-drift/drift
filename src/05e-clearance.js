/* ══════════════ допуск вместо уровней (M363, §11.4) ══════════════
   Уровня у игрока нет и не будет. Есть допуск — четыре класса, и он не растёт
   сам: его дают за дело. Найти, увезти, продать, оставить можно что угодно;
   СТАВИТЬ на корпус — только в пределах своего допуска. Остальное лежит в
   трюме опечатанным, и опись пишет, чего оно ждёт.

   Ворота (§11.4, D15):
     I   — с начала;
     II  — экзамен кооператива (он уже есть, 12aj) плюс десять сбитых;
     III — сто часов налёта ИЛИ пять случаев в трёх державах; случаев пока нет
           (они приходят в M374), поэтому здесь работают только часы;
     IV  — случай от ГЛАВТРАССЫ лично плюс залп в бою с «Ревизией»; ни того,
           ни другого ещё нет (M374/M380), и четвёртый допуск честно закрыт.

   Пока двадцати семейств нет (они в M364–M366), класс читается по тиру и
   только у СТВОЛОВ: отменный — II, легендарный — III, остальное — I. Это
   стоит переписать на семейство, когда семейства появятся; здесь это записано,
   чтобы переписать было чем.

   Достигнутый допуск персистится (`G.clearance`) и НЕ ПАДАЕТ: сбитые можно
   пересчитать, а отнятое обратно — это наказание за то, чего игрок не делал. */
const CLEARANCE=[
  {n:1,ru:"I",   how:"с начала"},
  {n:2,ru:"II",  how:"экзамен кооператива и десять сбитых"},
  {n:3,ru:"III", how:"сто часов налёта"},
  {n:4,ru:"IV",  how:"по форме от ГЛАВТРАССЫ: за дело, о котором она знает"}
];
const CLR_KILLS=10;
const CLR_HOURS=100;
function clrHours(){return (G.flownMs||0)/3600000;}
/* что заработано ПРЯМО СЕЙЧАС; G.clearance помнит максимум за всё время */
function clearanceEarned(){
  let n=1;
  const exam=(typeof coopHas==="function")&&coopHas();
  if(exam&&(G.kills|0)>=CLR_KILLS)n=2;
  if(n>=2&&clrHours()>=CLR_HOURS)n=3;
  /* четвёртый допуск выдают не за часы, а за дело (M374, §6.2): нужен эпизод
     с ГЛАВТРАССОЙ, и не любой, а тяжёлый — тот, о котором говорят */
  if(n>=3&&typeof epiHere==="function"){
    const e=epiHere("gt");
    if(e&&e.w>=50)n=4;
  }
  return n;
}
function clearanceNow(){
  const e=clearanceEarned();
  if(e>(G.clearance|0))clearanceRaise(e);
  return Math.max(1,G.clearance|0);
}
function clearanceRaise(n){
  const was=G.clearance|0;
  if(n<=was)return;
  G.clearance=n;
  const C=CLEARANCE[n-1];
  if(typeof tell==="function")
    tell("kill","Допуск "+C.ru+" · опечатанное в трюме открыто",
         "ДОПУСК "+C.ru+"\n"+C.how);
  else if(typeof say==="function")say("ДОПУСК "+C.ru,120);
}
/* Класс части: пока нет семейств — по тиру, и ТОЛЬКО у стволов. Таблица
   §11.4 гейтит семейства орудий, а не «всё, что дороже обычного»: первая
   развёртка по тиру запечатывала пусковую и рядовые части и ломала игру
   с самого начала. Отменный ствол ждёт второго допуска, легендарный —
   третьего; четвёртый пока не выдают никому (M374/M380). */
function partClearance(p){
  if(!p||p.kind!=="gun")return 1;
  const t=p.tier|0;
  return t>=5?3:(t>=4?2:1);
}
function partSealed(p){return partClearance(p)>clearanceNow();}
/* Чего ждёт опечатанная часть — одной строкой для описи. Пишем КЛАСС части
   и ближайшие незакрытые ворота, а не ворота её класса: игроку с первым
   допуском бесполезно читать «нужно сто часов», когда перед ним ещё
   экзамен. */
function sealedWhy(p){
  const need=partClearance(p),now=clearanceNow();
  if(need<=now)return "";
  const C=CLEARANCE[need-1];
  const exam=(typeof coopHas==="function")&&coopHas();
  let step;
  if(now<2)step=!exam?"нужен экзамен кооператива":("сбитых "+(G.kills|0)+" из "+CLR_KILLS);
  else if(now<3)step="налёт "+clrHours().toFixed(1)+" ч из "+CLR_HOURS;
  else step=CLEARANCE[3].how;
  return "допуск "+C.ru+" · "+step;
}
/* налёт копится только в полёте — на станции и за столом время не идёт */
function clrTick(ms){
  if(!G.running)return;
  if(G.mode!=="system"&&G.mode!=="belt"&&G.mode!=="landing"&&G.mode!=="scoop")return;
  G.flownMs=(G.flownMs||0)+Math.min(2000,Math.max(0,ms||0));
}
