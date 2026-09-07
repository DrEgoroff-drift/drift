/* ── всё на сервер (автор, 2026-09-05: «просто пиши на сервер лог, все ошибки,
   любые — потом разбирать будем») ──
   Строка «СБОЙ · …» на экране — улика, которую закрывают. На сервер уходит
   всё, что похоже на ошибку: сбой кадра и вне кадра, отвергнутое обещание,
   стоп кадра дольше двух секунд, console.error/warn, «warn» судового журнала,
   отказ сети к облаку, ресурс, который не загрузился, отказ localStorage.
   Каждое — со стеком наших кадров, режимом, версией и хвостом журнала, в
   site/log.php → ~/drift-data/crash.log. Учётной записи не нужно; ни одного
   знака, набранного игроком, наружу не идёт. Одна и та же строка шлётся не
   чаще раза в минуту и несёт счётчик; всего с одной страницы — не больше
   восьмидесяти писем. С диска (file:) и со стенда тестов — молчит.

   ПОЧЕМУ ЗДЕСЬ, В САМОМ НАЧАЛЕ СКЛЕЙКИ, А НЕ В 28-loop. 0.359.0 уехал на сайт
   со сбоем на верхнем уровне (TDZ на WANDER_CAT: раннер склеил модули в другом
   порядке) — скрипт оборвался на 29-й тысяче строк, и логгер, живший в конце,
   не родился: игра лежала, а журнал молчал. Теперь ловушки ставятся раньше
   любого кода, который может упасть, и не зависят ни от чего, кроме VER:
   G, logAdd, cloudHere — через typeof, если их ещё нет. */
const CRASH_SHIP={n:0,last:{},t0:Date.now()};
function crashShip(kind,msg,at,extra){
  try{
    if(!(location.protocol==="http:"||location.protocol==="https:")||typeof TEST!=="undefined")return;
    if(CRASH_SHIP.n>=80)return;
    msg=String(msg||"").slice(0,600);
    const key=kind+"|"+msg,now=Date.now();
    CRASH_SHIP.last[key]=CRASH_SHIP.last[key]||{t:0,n:0};
    const L=CRASH_SHIP.last[key];L.n++;
    if(now-L.t<60000)return;
    L.t=now;CRASH_SHIP.n++;
    let tail="",mode="";
    try{const g=typeof G==="object"&&G;if(g){mode=g.mode||"";tail=(g.log||[]).slice(-6).map(it=>it.k+":"+it.s).join(" | ");}}catch(_){}
    const b=Object.assign({ver:VER,kind,msg,at:String(at||"").slice(0,800),n:L.n,
      mode,up:((now-CRASH_SHIP.t0)/1000)|0,win:innerWidth+"x"+innerHeight+"@"+(window.devicePixelRatio||1),
      ua:navigator.userAgent.slice(0,200),log:tail.slice(0,800)},extra||{});
    fetch("/log.php",{method:"POST",keepalive:true,body:JSON.stringify(b)}).catch(()=>{});
  }catch(_){}
}
/* стек — только наши кадры, до восьми строк */
function crashStack(e){
  try{return String((e&&e.stack)||"").split(/[\r\n]+/).filter(L=>/^\s*at\s|@/.test(L)).slice(0,8).join("\n");}catch(_){return "";}
}
/* ловушки — до всего остального: сбой при загрузке самого скрипта ложится в
   журнал первым, а не пропадает вместе с логгером */
(function(){
  /* ошибка вне кадра и обрыв склейки на верхнем уровне; 28-loop поверх этого
     рисует «СБОЙ · …» и шлёт ту же строку — она схлопнется по ключу */
  try{addEventListener("error",e=>{
    const t=e&&e.target;
    if(t&&t!==window&&(t.src||t.href)){crashShip("resource",String(t.src||t.href).slice(0,300),"");return;}
    if(e&&(e.error||e.message)){const x=e.error;crashShip("outside",(x&&x.message)||String(e.message),crashStack(x)||((e.filename||"")+":"+(e.lineno||0)));}
  },true);}catch(_){}
  /* ── вкладку вернули: следующий кадр не мерится (M417) ──
     Ловушка стоит здесь, а не в 28-loop, по той же причине, что и все
     остальные: она обязана родиться раньше любого кода, который может упасть.
     `frameLastAt` объявлен в 28-loop и на момент этой строки ещё не
     существует — поэтому сброс идёт через окно и читается там же, где
     мерится. */
  try{addEventListener("visibilitychange",()=>{
    if(!document.hidden)try{frameLastAt=0;BEAT.n=0;BEAT.ms=0;BEAT.t=Date.now();}catch(_){}
  });}catch(_){}
  try{addEventListener("unhandledrejection",e=>{const x=e&&e.reason;crashShip("rejection",(x&&x.message)||String(x),crashStack(x));});}catch(_){}
  /* всё, что игра или браузер печатает как ошибку — тоже улика */
  try{
    const ce=console.error.bind(console),cw=console.warn.bind(console);
    console.error=function(){try{const a=[...arguments];const e=a.find(x=>x&&x.stack);const m=a.map(x=>x&&x.message||String(x)).join(" ").slice(0,600);if(m.indexOf("DRIFT:")!==0)crashShip("console",m,crashStack(e));}catch(_){}return ce.apply(console,arguments);};
    console.warn=function(){try{crashShip("warn",[...arguments].map(String).join(" ").slice(0,600),"");}catch(_){}return cw.apply(console,arguments);};
  }catch(_){}
})();
