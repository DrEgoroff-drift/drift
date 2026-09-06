/* ══════════════ провод войны (M376, §13, §16.4) ══════════════
   Летопись считается у каждого своя и совпадает у всех (12am-chron). По проводу
   ездит только то, чего клиент знать не может: ЧТО СДЕЛАЛИ ЛЮДИ. Сервер
   (`site/war.php`) складывает их дела в ведомости по сводкам и отдаёт их
   пачками; клиент кладёт ведомость в шаг 1 повтора — и галактика получает
   человеческую руку, не переставая быть детерминированной.

   Три правила, из которых состоит весь обмен:

   1. Ни имён, ни свободного текста, ни обмена между игроками — счётчики по
      системам и видам дел, как на открытке (`DESIGN-online-risks.md`).
   2. Насыщение по УЧЁТНЫМ ЗАПИСЯМ, а не по строкам: сто записей одного борта
      это один борт. Считает это сервер, потому что клиенту такое не доверишь.
   3. Сеть необязательна. Нет провода — игра идёт, летопись повторяется без
      ведомостей, и это честно видно по хэшу (D06), а не молча.

   Ведомости лежат в том же ключе, что и кэш летописи (`drift_war_v1`, §16.4):
   `chronSave` пишет своё поле и не трогает чужие. */
const WAR_API="/war.php";
const WAR_PULL_MS=90000;            /* чаще не спрашиваем: сводка длится шесть часов */
let WAR_BUSY=0,WAR_LAST=0;
function warHere(){return location.protocol==="http:"||location.protocol==="https:";}
function warTok(){return (typeof cloudTok==="function")?cloudTok():"";}
function warStore(){
  try{
    const o=JSON.parse(localStorage.getItem(CHRON_KEY)||"null");
    return (o&&typeof o==="object")?o:{};
  }catch(e){return {};}
}
function warStoreSet(patch){
  try{
    const o=warStore();
    for(const k in patch)o[k]=patch[k];
    localStorage.setItem(CHRON_KEY,JSON.stringify(o));
  }catch(e){}
}
/* ── ведомости на руках ──
   `led[N] = {"sx,sy":{kind:{q,a}}}`: сколько сделано и сколькими бортами. Больше
   ста двадцати сводок (месяц) не держим: старое уже вошло в кэш состояния. */
/* ── ведомости держим в памяти ──
   `chronFlip` спрашивает ведомость на каждую попытку перехода, а попыток за
   повтор года — сотни тысяч. Разбор localStorage на каждую из них удлинял
   прогон набора вдвое (замер 0.376.0): читаем один раз и держим, пока не
   положили новое. */
let WAR_LED_CACHE=null;
function warLed(){
  if(WAR_LED_CACHE)return WAR_LED_CACHE;
  const o=warStore();
  return WAR_LED_CACHE=((o.led&&typeof o.led==="object")?o.led:{});
}
function warLedger(N){
  const L=warLed();
  return L[N]||null;
}
function warLedPut(N,body){
  const L=warLed();
  L[N]=body;
  const keys=Object.keys(L).map(Number).sort((a,b)=>a-b);
  while(keys.length>120)delete L[keys.shift()];
  WAR_LED_CACHE=L;
  warStoreSet({led:L});
  /* сводка, которую уже шагали, получила ведомость: повтор от неё заново (M412) */
  if(typeof chronInvalidate==="function")chronInvalidate(N);
}
function warLedLast(){
  const keys=Object.keys(warLed()).map(Number);
  return keys.length?Math.max.apply(null,keys):-1;
}
/* ── часы ──
   Номер сводки считает сервер, и его ответ задаёт смещение локальных часов
   (§16.3, D05): переведённые часы игрока не двигают войну. */
function warClock(serverN){
  if(!(serverN>=0))return;
  const mine=chronNow();
  if(mine===serverN)return;
  const want=(serverN*CHRON_SHIFT)+CHRON_EPOCH-Date.now()+1;
  CHRON.off=want;
  warStoreSet({off:want});
  /* состояние пересчитывается на новый номер: старое было посчитано по чужим часам */
  CHRON.N=-1;CHRON.powers=null;
}
function warCall(a,body){
  return fetch(WAR_API+"?a="+a,{method:"POST",
    headers:{"Content-Type":"application/json","X-Drift-Token":warTok()},
    body:JSON.stringify(body||{})}).then(r=>r.json());
}
/* ── взять новое: закрытые сводки после последней известной ── */
function warPull(force){
  if(!warHere()||WAR_BUSY)return Promise.resolve(false);
  const now=Date.now();
  if(!force&&now-WAR_LAST<WAR_PULL_MS)return Promise.resolve(false);
  WAR_BUSY=1;WAR_LAST=now;
  return warCall("pull",{since:warLedLast()}).then(r=>{
    WAR_BUSY=0;
    if(!r||!r.ok)return false;
    warClock(r.N|0);
    /* голоса лежат в той же сводке, что и дела, и приезжают вместе с ними:
       отдельного канала у выборов нет (M378) */
    const body=s=>{const o=s.sys||{};o.__votes=s.votes||{};return o;};
    for(const s of (r.svodki||[]))if(s&&s.n!==undefined)warLedPut(s.n|0,body(s));
    if(r.open&&r.open.n!==undefined)warLedPut(r.open.n|0,body(r.open));
    /* циркуляры приезжают тем же ответом и проверяются конституцией на входе
       (M381): негодный не кладётся вовсе */
    if(Array.isArray(r.circ)&&r.circ.length&&typeof circPut==="function"){
      circPut(circAll().concat(r.circ));
      /* циркуляр помечен сводкой: от неё повтор заново (M412) */
      if(typeof chronInvalidate==="function")
        chronInvalidate(Math.min.apply(null,r.circ.map(c=>c.n|0)));
    }
    /* хэш за прошлую сводку: сервер только считает, кто с кем сошёлся. Прошлая
       сводка — это и есть закрытая база повтора (M412), считать её заново от
       нуля незачем */
    try{
      const st=chronState();
      const base=(typeof CHRON_BASE!=="undefined"&&CHRON_BASE&&CHRON_BASE.N===st.N-1)?CHRON_BASE:null;
      if(st&&st.N>0)warCall("hash",{n:st.N-1,h:String(chronHash(base||chronReplay(st.N-1,null)))})
        .then(h=>{if(h&&h.ok&&h.agree===false&&typeof logAdd==="function")logAdd("warn","Летопись разошлась с большинством на сводке "+h.n);})
        .catch(()=>{});
    }catch(e){}
    return true;
  }).catch(()=>{WAR_BUSY=0;return false;});
}
/* ── положить дело ──
   Кладётся то, что игрок и правда сделал: оборона в системе на фронте, буксир,
   снятый экипаж, отданное топливо, руда в дефицит. Без учётной записи сервер
   не примет, и это не ошибка игры — просто её рука не считается. */
function warPut(kind,qty,sys){
  if(!warHere()||!warTok())return Promise.resolve(false);
  const N=chronNow();
  return warCall("put",{n:N,sys:sys||((G.sx|0)+","+(G.sy|0)),kind,qty:Math.max(1,qty|0)})
    .then(r=>!!(r&&r.ok)).catch(()=>false);
}
/* ── ведомость в шаг 1 повтора (§16.2) ──
   Счётчики становятся ДАВЛЕНИЕМ на бросок фронта: оборона тянет систему к её
   хозяину, буксиры и снятые экипажи — к тому, чей это был борт. Не больше
   четверти броска (§7.4: «одна система на одну сводку, войну не повернуть»). */
function warPressure(st,N,fromIdx,toIdx,key){
  const L=warLedger(N);
  if(!L||!L[key])return 0;
  const cell=L[key];
  let def=0,acc=0;
  for(const k in cell){
    const c=cell[k];
    if(!c)continue;
    if(k==="def"||k==="clear"||k==="build"){def+=c.q|0;acc=Math.max(acc,(c.a&&c.a.length)|0);}
  }
  if(!def)return 0;
  /* насыщение по числу бортов, а не по числу строк; а если в области стоит
     «Ревизия» — вклад толпы там делится на четыре (M380, §11.2) */
  const p=Math.min(250,(chronSat(acc)/4)|0);
  const pr=key.split(",");
  const mul=(typeof bossPressMul==="function")?bossPressMul(pr[0]|0,pr[1]|0):1;
  return Math.round(p*mul);
}
/* ── запуск ──
   Тянем при загрузке и при каждом прыжке; чаще незачем — сводка длится шесть
   часов. Ошибки молчаливы: провод войны не должен мешать играть. */
function warBoot(){
  if(!warHere())return;
  const o=warStore();
  if(typeof o.off==="number")CHRON.off=o.off;
  warPull(true);
}
/* Одна попытка при загрузке — дальше по прыжкам. Через полторы секунды после
   загрузки: раньше страница занята собой, и лишний запрос в этот момент только
   отнимает у неё кадр. */
if(typeof addEventListener==="function")
  addEventListener("load",()=>setTimeout(()=>{try{warBoot();}catch(e){}},1500));
