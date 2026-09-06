/* ══════════════ выборы и сигнал сбора (M378, §11.2, §14) ══════════════
   Две вещи, обе на одну кнопку и обе без единого слова от игрока.

   **Выборы.** Раз в месяц (сто двадцать сводок) каждая держава решает, чем ей
   заниматься дальше. Вопрос и два ответа берутся из зерна месяца, а не
   придумываются: значит они одинаковы у всех, и их можно назвать вслух, не
   сговариваясь. Голос — один на учётную запись на вопрос, считает сервер.
   Итог входит в летопись КУРСОМ: победивший ответ смещает ходы этой державы на
   месяц. Не «игрок правит миром», а «толпа подтолкнула, и это видно на карте».

   **Сигнал сбора.** «Всем сказать в игре» без чата: три поля — система, сводка,
   и всё. Ни имени, ни текста. Виден всем, отвечается одной кнопкой, счётчик
   «ответили: 23». Один сигнал на борт в сутки. Это и есть весь созыв флота на
   «Ревизию» (§11.2), и больше ничего для него не нужно. */
const VOTE_MONTH=120;             /* сводок в месяце выборов */
const VOTE_Q=[
  {q:"course",ru:"курс на месяц",picks:[["war","держать фронт"],["build","строить и торговать"]]},
  {q:"road",  ru:"чем заняться",  picks:[["ore","добывать"],["link","связывать узлы"]]},
  {q:"door",  ru:"кого пускать",  picks:[["open","всех"],["shut","только своих"]]}
];
function voteMonth(N){return Math.floor(((N===undefined?chronNow():N)|0)/VOTE_MONTH);}
/* вопрос месяца для державы: от зерна месяца, значит один и тот же у всех */
function voteQuestion(by,N){
  const m=voteMonth(N),i=MAKER_KEYS.indexOf(by);
  if(i<0)return null;
  const Q=VOTE_Q[hashi(m,i+1,0x0E17)%VOTE_Q.length];
  return {key:"m"+m+"-"+by+"-"+Q.q,ru:Q.ru,picks:Q.picks,by,m};
}
/* ── итог ──
   Считаем по всем ведомостям, что есть на руках: голоса лежат в тех же сводках,
   что и дела. Нет ведомостей — нет и итога, и держава идёт своим ходом. */
function voteTally(key){
  const out={};
  if(typeof warLed!=="function")return out;
  const L=warLed();
  for(const n in L){
    const v=L[n]&&L[n].__votes;
    if(!v||!v[key])continue;
    for(const p in v[key].p)out[p]=(out[p]||0)+(v[key].p[p]|0);
  }
  return out;
}
function voteWinner(by,N){
  const Q=voteQuestion(by,N);
  if(!Q)return null;
  const t=voteTally(Q.key);
  let best=null,bn=0;
  for(const p in t)if(t[p]>bn){bn=t[p];best=p;}
  return best?{pick:best,n:bn,q:Q}:null;
}
/* курс державы: то, что подтолкнула толпа. Читает `chronAgentMove` — но только
   как СМЕЩЕНИЕ хода, а не как приказ: держава остаётся собой. */
function voteCourse(i,N){
  const by=MAKER_KEYS[i];
  const w=by?voteWinner(by,N):null;
  return w?w.pick:null;
}
function voteCast(by,pick,N){
  const Q=voteQuestion(by,N);
  if(!Q||typeof warCall!=="function")return Promise.resolve(false);
  return warCall("vote",{n:(N===undefined?chronNow():N),q:Q.key.slice(0,24),pick})
    .then(r=>{
      if(r&&r.ok){say("ГОЛОС ПОДАН",120);return true;}
      say((r&&r.error)?r.error.toUpperCase():"ГОЛОС НЕ ПРИНЯТ",120);
      return false;
    }).catch(()=>false);
}
/* ── сигнал сбора ── */
let RALLY_CACHE=null;
function rallyList(force){
  if(typeof warCall!=="function")return Promise.resolve([]);
  if(!force&&RALLY_CACHE&&Date.now()-RALLY_CACHE.t<120000)return Promise.resolve(RALLY_CACHE.rows);
  return warCall("rallies",{}).then(r=>{
    const rows=(r&&r.ok&&Array.isArray(r.rows))?r.rows:[];
    RALLY_CACHE={t:Date.now(),rows};
    return rows;
  }).catch(()=>[]);
}
function rallyRows(){return (RALLY_CACHE&&RALLY_CACHE.rows)||[];}
function rallyRaise(at){
  if(typeof warCall!=="function")return Promise.resolve(false);
  const N=chronNow();
  return warCall("rally",{sys:(G.sx|0)+","+(G.sy|0),at:at||(N+2)}).then(r=>{
    if(r&&r.ok){
      RALLY_CACHE=null;
      say("СИГНАЛ СБОРА ПОДНЯТ",140);
      logAdd("tech","Сигнал сбора: сектор "+G.sx+":"+G.sy+" · сводка "+((at||(N+2))%1000));
      return true;
    }
    say((r&&r.error)?r.error.toUpperCase():"СИГНАЛ НЕ ПОДНЯТ",120);
    return false;
  }).catch(()=>false);
}
function rallyJoin(i){
  if(typeof warCall!=="function")return Promise.resolve(false);
  return warCall("join",{i}).then(r=>{
    if(r&&r.ok){RALLY_CACHE=null;say("ОТВЕЧЕНО НА СБОР",120);return true;}
    return false;
  }).catch(()=>false);
}
/* сигналы видны на карте: чип с числом ответивших, без имён и без текста */
function rallyAt(sx,sy){
  const k=(sx|0)+","+(sy|0);
  for(const r of rallyRows())if(r.sys===k)return r;
  return null;
}
/* ── блок на доске: вопрос месяца, итог и сбор ── */
function voteBlock(){
  if(typeof $body==="undefined"||typeof chronOwnerKey!=="function")return;
  const by=chronOwnerKey(G.sx,G.sy)||"gt";
  const Q=voteQuestion(by);
  if(!Q)return;
  const P=(typeof powerOf==="function")?powerOf(by):null;
  const t=voteTally(Q.key);
  $body.appendChild(el("div","sec","ВЫБОРЫ · "+(P?P.ru.toUpperCase():"")+" · "+Q.ru.toUpperCase()+
    " · ОДИН ГОЛОС НА БОРТ"));
  for(const [pick,ru] of Q.picks){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+ru+"</b><s>голосов: "+((t[pick]|0))+"</s>"));
    const b=el("button","act","ГОЛОС");
    b.onclick=()=>{voteCast(by,pick).then(()=>renderTab());};
    r.appendChild(b);
    $body.appendChild(r);
  }
  /* сбор: поднять здесь и ответить на чужой */
  rallyList();
  const rows=rallyRows();
  $body.appendChild(el("div","sec","СИГНАЛ СБОРА · ТРИ ПОЛЯ, НИ ОДНОГО СЛОВА"));
  const rr=el("div","row");
  rr.appendChild(el("div","nm","<b>Поднять сбор здесь</b><s>сектор "+G.sx+":"+G.sy+
    " · через две сводки · один сигнал на борт в сутки</s>"));
  const rb=el("button","act","ПОДНЯТЬ");
  rb.onclick=()=>{rallyRaise().then(()=>renderTab());};
  rr.appendChild(rb);
  $body.appendChild(rr);
  for(let i=0;i<rows.length&&i<6;i++){
    const R=rows[i];
    const row=el("div","row");
    row.appendChild(el("div","nm","<b>Сбор · сектор "+R.sys+"</b><s>сводка "+((R.at|0)%1000)+
      " · ответили: "+(R.yes|0)+"</s>"));
    const b=el("button","act","ОТВЕТИТЬ");
    b.onclick=()=>{rallyJoin(i).then(()=>renderTab());};
    row.appendChild(b);
    $body.appendChild(row);
  }
}
