/* ══════════════ соперники у ваших ориентиров (M910b, docs/DESIGN-game.md §7.3) ══════════════
   «Шестеро» (CAST, роль «соперник») делают то же дело иначе — и ходят теми же местами. Памятник,
   на котором вы что-то сделали (G.poiSeen[seed].n.last), становится вашим; вернулись на него в
   другую посадку, а прошло не меньше RIVMK_AGE — у подножия след одного из шести, с кем вы уже
   встречались по историям. У каждого соперника один след на всю игру, на памятнике — один след.
   Нового интерфейса нет: строка подсказки памятника, say и журнал один раз.
   Тела у следа нет: рисунок памятника — 21pie, чужой файл (Disputed в отчёте).
   Память: G.rivMk = {[rid]:{s:seed,t:G.t,ru:имя памятника,seen:0|1}}. */
const RIVMK_AGE=10*CEL_DAY;                    /* десять суток неба: «пока вас не было» */
const RIVMK=[
  {id:"efim",   cap:"ЕФИМА",  text:"Складная табуретка. Пустая, стоит лицом к памятнику. На ножке бирка «Е.». Сидели долго: под ней не намело."},
  {id:"baker",  cap:"ПЕКАРЯ", text:"У подножия — крошки и горелая спичка. Кто-то был здесь раньше вас. Затемно: роса на крошках не обсохла."},
  {id:"krapiva",cap:"КРАПИВЫ",text:"Посадочный след в стороне: одна опора глубже двух других, садились криво. Рядом — ремень от чемодана. Чемодана нет."},
  {id:"kim",    cap:"КИМА",   text:"Под камнем — расписка. «Долг за это место погашен. К.» Какое место, кому и сколько — не сказано."},
  {id:"shtof",  cap:"ШТОФА",  text:"Зарубки на опоре. Сорок одна, ровным счётом. Дальше пусто: счёт брошен посередине."},
  {id:"sovenya",cap:"СОВЕНИ", text:"На камне мелом — столбик чисел, внизу подчёркнуто: «сходится». Писали ночью: мел лёг по росе."}
];
function rivMkSt(){if(!G.rivMk||typeof G.rivMk!=="object"||Array.isArray(G.rivMk))G.rivMk={};return G.rivMk;}
function rivMkAt(seed){const R=G.rivMk;if(!R)return null;for(const k in R)if(R[k]&&R[k].s===seed)return RIVMK.find(x=>x.id===k)||null;return null;}
/* встречен — виден хоть один след любой истории, где он в труппе */
function rivMkMet(rid){
  const Z=(typeof storySeen==="function")?storySeen():{},L=(typeof storyAll==="function")?storyAll():[];
  for(const S of L){
    if(!S||!S.cast||S.cast.indexOf(rid)<0||!S.traces)continue;
    for(const t of S.traces)if(Z[S.id+"."+t.id]!=null)return true;
  }
  return false;
}
/* памятник ваш и вы на нём не впервые за эту посадку: действовали до неё и давно */
function rivMkMine(m,S){return !!(m&&m.n&&m.n.last&&S&&S.t0!=null&&(m.t0|0)<S.t0&&S.t0-(m.t0|0)>=RIVMK_AGE);}
/* кто оставит след: из встреченных без следа — по зерну памятника, без случая */
function rivMkPick(seed){
  const R=rivMkSt(),L=RIVMK.filter(r=>!R[r.id]&&rivMkMet(r.id));
  return L.length?L[(hashi(0x5F1D,seed>>>0,L.length)>>>0)%L.length]:null;
}
function rivMkPlace(q,m,S){
  if(!q||rivMkAt(q.seed)||!rivMkMine(m,S))return rivMkAt(q&&q.seed);
  const r=rivMkPick(q.seed);if(!r)return null;
  rivMkSt()[r.id]={s:q.seed,t:Math.round(S.t0),ru:String(q.ru||q.k||""),seen:0};
  return r;
}
/* человек у памятника: показать след (первый раз — say и журнал); «СЛЕД КОГО» — в строку «ИМЯ · СОСТОЯНИЕ»:
   табличка памятника (08bj hangSurface) вешает именно её, хвост подсказки там не виден */
function rivMkShow(q,A,S){
  const m=(typeof plnMarkState==="function")?plnMarkState(q):null;
  const r=rivMkPlace(q,m,S);if(!r)return;
  const e=G.rivMk[r.id];
  if(!e.seen){
    e.seen=1;
    say(r.text);   /* tell сам пишет в журнал короткое — строка журнала здесь полная, своя */
    logAdd("dim","У ориентира «"+String(e.ru).toLowerCase()+"» — след: "+CAST[r.id].name+". "+r.text);
  }
  if(!A||!A.prompt||A.prompt.indexOf("СЛЕД "+r.cap)>=0)return;
  const K=PLN_ACT.kinds[q.k]||{},nm=String(q.ru||K.ru||"").toUpperCase(),PL=A.prompt.split("\n"),i=PL.findIndex(s=>s.indexOf(nm+" · ")===0);
  if(i>=0)PL[i]+=" · СЛЕД "+r.cap;else PL.push(nm+" · СЛЕД "+r.cap);
  A.prompt=PL.join("\n");
}
function rivMkRestore(s){
  const v=s&&s.rivMk;G.rivMk=null;
  if(!v||typeof v!=="object"||Array.isArray(v))return;
  const R={},seeds={};
  for(const r of RIVMK){const e=v[r.id];
    if(!e||typeof e!=="object"||!Number.isFinite(e.s)||seeds[e.s])continue;
    seeds[e.s]=1;R[r.id]={s:e.s,t:Number.isFinite(e.t)?e.t:0,ru:String(e.ru||"").slice(0,40),seen:e.seen?1:0};}
  G.rivMk=R;
}
const RIVMK_HOOKS=[
  /* кадр памятника: own — тот же вопрос, что задаёт сам кадр (человек у этого памятника) */
  ["plnActFrame",O=>function(it,S){const A=O.apply(this,arguments);
    if(A&&A.prompt&&it&&it.q&&S&&S.tr&&poiNear(S,S.tr)===it.q){try{rivMkShow(it.q,A,S);}catch(e){}}
    return A;}],
  ["snapshot",O=>function(){const s=O.apply(this,arguments);if(s)s.rivMk=G.rivMk&&Object.keys(G.rivMk).length?JSON.parse(JSON.stringify(G.rivMk)):null;return s;}],
  /* отказ загрузки мира не трогает */
  ["applySave",O=>function(s){const r=O.apply(this,arguments);if(r){try{rivMkRestore(s);}catch(e){G.rivMk=null;}}return r;}]
];
for(const [n,mk] of RIVMK_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("28s-rivmarks: нет крючка "+n);window[n]=mk(O);}
