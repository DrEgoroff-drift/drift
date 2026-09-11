/* ══════════════ запись ввода: последние полминуты по кадрам (M444) ══════════════
   Игрок видит баг — и не может его повторить: «крутил, жал, и вдруг». Запись
   держит ввод по кадрам — маску клавиш и шаг dt — отрезками по REC_SEG кадров
   (полминуты на 60 к/с), и у каждого отрезка есть голова: снимок мира на его
   старте (snapshot), положение случая (rndState), часы и G.t. Два отрезка —
   текущий и предыдущий — это последняя минута, воспроизводимая до кадра:
   тест ставит снимок, восстанавливает случай и часы и подаёт те же клавиши
   (T.replay, tests/90a-tools) — на том же семени мир приходит в ту же точку
   (тест Factorio, M441), а на другом семени, окне или часе — под всеми
   детекторами. Так запись игрока становится сценарием, а «баг здесь» —
   его последней строкой.

   Включается `?rec=1` в адресе, стоит один push в кадр и один snapshot на
   полминуты. F8 (или recMark() в консоли) кладёт последнюю минуту в
   localStorage «drift.rec» и в консоль. Пэдов у записи нет: это инструмент
   тестировщика за клавиатурой, не игрока. */
const REC_SEG=1800;
let REC=null,REC_PREV=null;
const REC_KEYS=Object.keys(keys);   /* порядок бит маски — порядок клавиш при заводке */
function recHead(){
  /* снимок — копией: snapshot() отдаёт объект, где трюм и прочие поля — те же
     ссылки, что в G, и голова, снятая в начале, к концу минуты показывала бы
     конец (нашёл тест повтора: из «снимка» стартовало 13 льда, и повтор
     набурил 26) */
  return {ver:VER,t:G.t,now:now(),rnd:rndState(),mode:G.mode,W,H,keys:REC_KEYS.slice(),snap:JSON.parse(JSON.stringify(snapshot()))};
}
function recSeg(){return {head:recHead(),f:[],ev:[],ap:G.ap};}
function recStart(){REC=recSeg();REC_PREV=null;}
function recStop(){REC=null;REC_PREV=null;}
/* цель автопилота ставится тычком, а не клавишей: она записывается как
   событие кадра — [номер кадра, вид, номер планеты]. Экранные кнопки
   (прилавок, вкладки) запись не видит: это её граница, а не забывчивость */
function recApEv(){
  const ap=G.ap;if(!ap)return null;
  const idx=(ap.kind==="planet"&&ap.p&&G.sys&&G.sys.planets)?G.sys.planets.indexOf(ap.p):-1;
  return [REC.f.length/2,ap.kind,idx,ap.ax==null?0:ap.ax,ap.ay==null?0:ap.ay];
}
/* зовётся из stepWorld: кадр мира — кадр записи, и в тестах тоже */
function recTick(dt){
  if(!REC)return;
  /* отрезок рвётся только в устойчивом режиме: снимок мира не хранит
     эфемерного (полосу грунта, залежи, ствол шахты — правило CLAUDE.md), и
     голова, снятая посреди бурения, восстановила бы другую полосу. В полёте
     и в доке снимок честен. Потолок — пять отрезков подряд, дальше рвём где
     есть и помечаем голову ненадёжной */
  const stable=G.mode==="system"||G.mode==="dock"||G.mode==="map";
  if(REC.f.length>=REC_SEG*2&&(stable||REC.f.length>=REC_SEG*10)){REC_PREV=REC;REC=recSeg();if(!stable)REC.head.unstable=true;}
  if(G.ap!==REC.ap){REC.ap=G.ap;const e=recApEv();if(e)REC.ev.push(e);}
  let m=0;for(let i=0;i<REC_KEYS.length;i++)if(keys[REC_KEYS[i]])m|=1<<i;
  REC.f.push(m,Math.round(dt*64));
}
function recDump(){
  return {ver:VER,segs:[REC_PREV,REC].filter(Boolean).map(s=>({head:s.head,f:s.f.slice(),ev:s.ev.slice()}))};
}
function recMark(){
  if(!REC)return null;
  const d=recDump(),s=JSON.stringify(d),n=d.segs.reduce((a,q)=>a+q.f.length/2,0);
  try{localStorage.setItem("drift.rec",s);}catch(e){}
  try{console.log("drift.rec: "+n+" кадров, "+Math.round(s.length/1024)+" КБ");}catch(e){}
  say("Запись сохранена\n"+Math.round(n/60)+" с ввода · drift.rec");
  return d;
}
/* экранные кнопки — тоже событие кадра: [кадр, "tap", id, надпись]. Повтор
   жмёт кнопку по id или по надписи на том экране, который к этому кадру
   открыт (T.tap). Тычки по холсту (планета, станция) уже лежат в событии
   автопилота; протяжка и колесо в запись не входят */
try{
  addEventListener("click",e=>{
    if(!REC)return;
    const b=e.target&&e.target.closest?e.target.closest("button,[onclick]"):null;
    if(!b)return;
    REC.ev.push([REC.f.length/2,"tap",b.id||"",String(b.textContent||"").replace(/\s+/g," ").trim().slice(0,40)]);
  },true);
}catch(e){}
try{if(/[?&]rec=1/.test(location.search))recStart();}catch(e){}
