/* ══════════════ девять обрядов и регата (M379, §14) ══════════════
   Обряд — это то, в чём участвует ТОЛПА, и всё, что от неё требуется, — одна
   кнопка. Ни слова, ни имени, ни сговора: счётчик, порог и последствие, которое
   видно на карте или на станции.

   Девять из §14 плюс регата «Ялты» (§16.6). У каждого свой вид дела на сервере
   (`war.php` их принимает и режет потолком), своя цель и своё последствие. Порог
   считается от числа бортов, а не от их упорства: сто записей одного — это один
   борт, и насыщение считает сервер.

   Объявляет обряды Директор (12am-chron-director): пока их меньше трёх, раз в
   несколько сводок появляется новый. Здесь — что они значат и что делают. */
const RITES={
  build:  {ru:"стройка века",  kind:"build",goal:4000,ru2:"нести материал",
           done:"построено бортами",note:"объект встанет и останется навсегда"},
  loan:   {ru:"заём",          kind:"loan", goal:12000,ru2:"купить облигацию",
           done:"подписка закрыта",note:"вернут с надбавкой, если кампания выиграна"},
  subbot: {ru:"субботник",     kind:"clear",goal:400, ru2:"расчистить пояс",
           done:"пояс расчищен",note:"после боя в поясе мусор, и он мешает всем"},
  coupon: {ru:"талоны",        kind:"coup", goal:60,  ru2:"отоварить талон",
           done:"талоны отоварены",note:"бак по талону — один на борт за сводку"},
  quar:   {ru:"карантин",      kind:"med",  goal:300, ru2:"провезти лекарство",
           done:"карантин снят",note:"пикет разворачивает всех, пока не довезут"},
  lost:   {ru:"пропажа",       kind:"scan", goal:200, ru2:"просканировать систему",
           done:"флагман найден",note:"ищут все и без уговора"},
  census: {ru:"перепись",      kind:"cens", goal:80,  ru2:"ответить на вопрос",
           done:"перепись проведена",note:"на волнах «99,7 % довольны»"},
  amnesty:{ru:"амнистия",      kind:"amn",  goal:40,  ru2:"привести дезертира",
           done:"амнистия объявлена",note:"буксир вместо выстрела"},
  reform: {ru:"реформа",       kind:"cens", goal:1,   ru2:"принять к сведению",
           done:"реформа проведена",note:"на бумаге изменилось всё, в небе — ничего"},
  regatta:{ru:"регата",        kind:"reg",  goal:30,  ru2:"пройти круг",
           done:"регата состоялась",note:"только в «Ялте»: там не стреляют"}
};
const RITE_KEYS=Object.keys(RITES);
const RITE_WINDOW=12;                 /* сводок живёт обряд */
/* какие обряды объявлены прямо сейчас (Директор) */
function riteLive(){
  const L=(typeof chronRites==="function")?chronRites():[];
  return L.map(r=>({key:RITE_KEYS.indexOf(r.kind)>=0?r.kind:riteMap(r.kind),p:r.p,t0:r.t0}))
          .filter(r=>!!RITES[r.key]);
}
/* Директор называет обряды своими словами (М371); здесь их имена сходятся */
function riteMap(k){
  return ({regatta:"regatta",census:"census",parade:"reform",subbotnik:"subbot",
    relief:"quar",memorial:"amnesty"})[k]||k;
}
/* ── счётчик ──
   Сумма по ведомостям за окно обряда. Ведомостей нет — счётчик пуст, и это
   честно: без провода обряд не идёт, а игра идёт. */
function riteCount(key,t0){
  const R=RITES[key];
  if(!R||typeof warLed!=="function")return {q:0,a:0};
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  const from=(t0===undefined)?N-RITE_WINDOW:t0;
  let q=0,a=0;
  for(const n in L){
    if((n|0)<from||(n|0)>N)continue;
    const body=L[n];
    for(const sys in body){
      if(sys==="__votes")continue;
      const cell=body[sys][R.kind];
      if(!cell)continue;
      q+=cell.q|0;
      a=Math.max(a,(cell.a&&cell.a.length)|0);
    }
  }
  return {q,a};
}
function riteDone(key,t0){
  const R=RITES[key];
  if(!R)return false;
  return riteCount(key,t0).q>=R.goal;
}
function ritePct(key,t0){
  const R=RITES[key];
  if(!R)return 0;
  return Math.min(100,Math.round(riteCount(key,t0).q/R.goal*100));
}
/* ── вложиться ──
   Одна кнопка и ничего больше. Что именно она стоит — зависит от обряда: где-то
   это груз из трюма, где-то кредиты, где-то просто «я здесь был». */
function riteGive(key,qty){
  const R=RITES[key];
  if(!R||typeof warPut!=="function")return Promise.resolve(false);
  qty=Math.max(1,qty|0);
  /* стройка берёт материал, заём — кредиты, остальное — само дело */
  if(key==="build"){
    const have=(G.cargo.alloy|0);
    if(have<qty){say("НЕЧЕГО НЕСТИ",120);return Promise.resolve(false);}
    G.cargo.alloy=have-qty;
  }else if(key==="loan"){
    if(G.credits<qty){say("НЕ ХВАТАЕТ КРЕДИТОВ",120);return Promise.resolve(false);}
    G.credits-=qty;
    G.bonds=(G.bonds|0)+qty;
    /* запоминаем, СКОЛЬКО держава держала, когда у неё занимали: по этому и
       считается «кампания выиграна» при расчёте (разбор 0.409.1) */
    if(!G.bondHold){
      const st=(typeof chronState==="function")?chronState():null;
      G.bondHold=(st&&st.powers[R.p])?st.powers[R.p].hold:0;
    }
  }
  return warPut(R.kind,qty).then(ok=>{
    if(ok){
      say(R.ru.toUpperCase()+" · ЗАПИСАНО",120);
      logAdd("tech",R.ru+": вложено "+qty);
    }else say("СЕРВЕР НЕ ПРИНЯЛ",120);
    return ok;
  });
}
/* ── последствия ──
   Каждое последствие читается из счётчика, а не хранится: значит оно одинаково
   у всех, кто видел те же ведомости, и не требует ни синхронизации, ни доверия
   к клиенту. */
function riteFuelMul(){
  /* талоны: бак по талону — четверть цены, один раз за сводку */
  if(!riteDone("coupon"))return 1;
  const N=(typeof chronNow==="function")?chronNow():0;
  if((G.coupN|0)===N)return 1;
  return .25;
}
function riteFuelUsed(){
  const N=(typeof chronNow==="function")?chronNow():0;
  G.coupN=N;
}
function ritePirateMul(){
  /* субботник и амнистия: в системе на сводку тише */
  let m=1;
  if(riteDone("subbot"))m*=.5;
  if(riteDone("amnesty"))m*=.7;
  return m;
}
function riteQuarantine(){
  /* карантин: пока лекарство не довезли, пикет разворачивает всех */
  const live=riteLive().some(r=>r.key==="quar");
  return live&&!riteDone("quar");
}
/* заём: выплата, когда кампания кончилась. Выиграна — с надбавкой, нет — потеря */
function riteLoanSettle(){
  const b=G.bonds|0;
  if(!b)return 0;
  if(!riteDone("loan"))return 0;
  /* ── что значит «выиграна» (разбор 0.409.1) ──
     Было: `chronWars().length===0` в МОМЕНТ предъявления. То есть «сейчас в
     галактике тихо», а не «кампания удалась»: игрок клал пять тысяч за сводку,
     ждал затишья и получал полтора конца. Это печатало деньги, и ни одна сеть
     не ловила — в тестах ведомости пусты.

     Теперь считаем то, за что и брали заём: держава-эмитент должна ДЕРЖАТЬ
     больше, чем держала, когда обряд объявили. Не тишина, а результат. */
  const L=(typeof riteLive==="function")?riteLive().filter(x=>x.key==="loan"):[];
  const R=L[0]||null;
  const st=(typeof chronState==="function")?chronState():null;
  const hold=(st&&R&&st.powers[R.p])?st.powers[R.p].hold:0;
  const was=(G.bondHold|0);
  const win=!!(R&&was&&hold>was);
  G.bonds=0;G.bondHold=0;
  const pay=win?Math.round(b*1.5):0;
  /* деньги входят одной воронкой (`earn`), иначе их не видят ни дом, ни
     кооператив, и сеть «доход идёт одной воронкой» краснеет по делу */
  if(pay){earn(pay,"заём");tell("kill","Заём выплачен: "+pay+" кр","ЗАЁМ\nвыплачено "+pay+" кр");}
  else tell("warn","Заём не выплачен: кампания не выиграна","ЗАЁМ\nсгорел");
  return pay;
}
/* ── блок на доске ── */
function riteBlock(){
  if(typeof $body==="undefined")return;
  const live=riteLive();
  if(!live.length)return;
  $body.appendChild(el("div","sec","ОБРЯДЫ · ОДНА КНОПКА, НИ ОДНОГО СЛОВА"));
  for(const L of live){
    const R=RITES[L.key];
    const P=(typeof powerOf==="function")?powerOf(MAKER_KEYS[L.p]):null;
    const c=riteCount(L.key,L.t0);
    const done=c.q>=R.goal;
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+R.ru.toUpperCase()+(P?" · "+P.ru:"")+"</b><s>"+
      R.note+"<br>"+(done?(R.done+": "+c.q):("собрано "+c.q+" из "+R.goal+
      " · бортов "+c.a))+"</s>"));
    if(!done){
      const b=el("button","act"+(L.key==="build"||L.key==="loan"?"":" gold"),R.ru2.toUpperCase());
      b.disabled=(L.key==="regatta"&&!(typeof yaltaHere==="function"&&yaltaHere()));
      b.onclick=()=>{
        const q=(L.key==="build")?10:(L.key==="loan"?500:1);
        riteGive(L.key,q).then(()=>renderTab());
      };
      r.appendChild(b);
    }else r.appendChild(el("div","qt","СДЕЛАНО"));
    $body.appendChild(r);
  }
  if((G.bonds|0)>0){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>Облигации на руках</b><s>вложено "+(G.bonds|0)+
      " кр · вернут с надбавкой, если кампания выиграна</s>"));
    const b=el("button","act","ПРЕДЪЯВИТЬ");
    b.onclick=()=>{riteLoanSettle();renderTab();};
    r.appendChild(b);
    $body.appendChild(r);
  }
}
