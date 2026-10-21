/* ══════════════ двери глав — дела на участке (M910, DESIGN-game §7.3, §7.4) ══════════════
   «Смена» открывала главу посадкой в новом месте. Теперь посадка — только МЕСТО, где глава
   прожита; ДВЕРЬ главы N+1 — дело на участке, сделанное после главы N:
     • части (10, 19, 28, 37, 46, 55, 64) — по таблице §7.4: норма ≥ 90 %, выкуп или именное,
       дверь в лицо, срыв пережит, своя засечка, корпус потерян (Клинок — M911), смена сдана
       и принята;
     • главы внутри части — дверь вытянута из набора дел с весом «чего игрок ещё не делал»;
       чтобы никто не застрял, открывают и любые два разных дела;
     • главы 2–9 (часть I) — как были: первая вахта (28o) и посадки.
   Маркера нет, «нужно» нет: игрок просто делает работу, и следующая глава ждёт его в
   следующем новом месте. Строки диспетчера: 72 главы — 72 её реплики, из таблицы глав
   (12ud-smena-text), не написанные заново. Тридцать историй поворачиваются на делах вахты
   (norm, srv, notch, handover). Второй акт — на участке: спрос циркуляра на ваших досках,
   баржи с людьми уходят с ваших станций, шестая — на вашем участке, «Есть место» — после
   года нормы ≥ 90 %.
   G.wd = {ключ:[сколько, now() последнего, storyDay() последнего]}; G.doors = {at:{n:now()},
   dr:{n:ключ}, y:сутки начала ряда ≥ 90 % или null, yn:сводок в ряду}. */
const DOOR_KEYS=["norm","srv","notch","hull","blade","door","ransom","offer","mark","story","handover"];
const DOOR_PART={10:["norm"],19:["ransom","offer"],28:["door"],37:["srv"],46:["notch"],55:["blade","hull"],64:["handover"]};
const DOOR_INNER=["norm","mark","offer","ransom","notch","handover","door","srv","story"];
const DOOR_DISP_MS=600000;            /* строка главы стоит у диспетчера десять минут */
const DOOR_YEAR=365;                  /* «год» — сутки неба (CEL_DAY), как лента через год (11x) */
const DOOR_STORY_N=30;
const DOOR_STORY_KEYS=["norm","srv","notch","handover"];
function doorWd(){if(!G.wd||typeof G.wd!=="object")G.wd={};return G.wd;}
function doorSt(){
  const D=G.doors;
  if(!D||typeof D!=="object"||!D.at||!D.dr)G.doors={at:{},dr:{},y:null,yn:0};
  return G.doors;
}
/* дело сделано: счёт, минута, сутки истории */
function doorDeed(k){
  if(DOOR_KEYS.indexOf(k)<0)return 0;
  const W=doorWd(),e=W[k]||[0,0,0];
  W[k]=[(e[0]|0)+1,now(),typeof storyDay==="function"?storyDay():0];
  return W[k][0];
}
function doorDone(k,since){const e=doorWd()[k];return !!(e&&e[0]>0&&e[1]>(since||0));}
/* с какой минуты считается дверь главы n: с открытия n−1 (до M910 — с нуля) */
function doorSince(n){const a=doorSt().at[n-1];return isFinite(a)&&a!==null?+a:0;}
function doorIsPart(n){return !!DOOR_PART[n];}
/* дверь внутри части — вытянута один раз и помнится: вес — чего игрок ещё не делал */
function doorDraw(n){
  const D=doorSt();
  if(D.dr[n]&&DOOR_INNER.indexOf(D.dr[n])>=0)return D.dr[n];
  const r=rng(hashi(n,0xD0A5,(G.seed|0)||1));
  const w=DOOR_INNER.map(k=>{const e=doorWd()[k];return 1/(1+(e?e[0]|0:0));});
  let s=0;for(const x of w)s+=x;
  let u=r()*s,k=DOOR_INNER[0];
  for(let i=0;i<w.length;i++){u-=w[i];if(u<=0){k=DOOR_INNER[i];break;}}
  D.dr[n]=k;return k;
}
/* открыта ли дверь главы n: часть — только названным делом; внутри — вытянутым или любыми двумя */
function doorOpen(n){
  if(!n||n<10)return true;
  const t=doorSince(n);
  if(doorIsPart(n))return DOOR_PART[n].some(k=>doorDone(k,t));
  if(doorDone(doorDraw(n),t))return true;
  let c=0;for(const k of DOOR_KEYS)if(doorDone(k,t))c++;
  return c>=2;
}
/* ── 72 строки диспетчера: из таблицы глав, по одной на главу ──
   запись журнала «> » — голос учётчицы; нет её — первая реплика без «сказал»; нет и её —
   первая реплика без ремарки; нет — первая строка. Не длиннее 120 знаков, по фразам */
function doorCut(t,L){
  L=L||120;t=String(t||"").replace(/\s+/g," ").trim();
  if(t.length<=L)return t;
  const P=t.split(/(?<=[.!?…])\s+/);let o="";
  for(const p of P){if((o+" "+p).trim().length>L)break;o=(o+" "+p).trim();}
  if(o)return o;
  const c=t.slice(0,L-1);return c.slice(0,Math.max(c.lastIndexOf(" "),L/2|0)).replace(/[,;:—\s]+$/,"")+"…";
}
function doorLine(n){
  const T=(typeof SMENA_TEXT!=="undefined"&&SMENA_TEXT[String(n)])||[];
  const J=T.filter(p=>/^> /.test(p)).map(p=>p.slice(2));
  if(J.length)return doorCut(J[0]);
  const Q=T.filter(p=>/^— /.test(p)).map(p=>p.slice(2));
  const plain=Q.find(q=>!/сказал|сказала|крикнул/.test(q));
  if(plain)return doorCut(plain);
  if(Q.length)return doorCut(Q[0].replace(/,?\s+—\s+(сказал|сказала|крикнул)[^.—]*[.]?\s*(—\s*)?/g,". ").replace(/([!?…])\.\s/g,"$1 ").replace(/\.\s*$/,"."));
  return doorCut(T[0]||((typeof SMENA_TITLE!=="undefined"&&SMENA_TITLE[String(n)])||""));
}
/* строка у диспетчера на доске участка (28j): свежая глава — её реплика, десять минут */
function doorsDispLine(){
  const R=(typeof smenaRec==="function")?smenaRec():[];if(!R.length)return null;
  const n=Math.max.apply(null,R),a=doorSt().at[n];
  if(!isFinite(a)||a===null||now()-a>DOOR_DISP_MS)return null;
  return doorLine(n)||null;
}
/* глава открыта: минута двери и реплика в эфир (табличка у вещи уже есть — акт главы) */
function doorOpened(n){
  if(!n)return;
  doorSt().at[n]=now();
  const L=doorLine(n);if(!L)return;
  const who=(typeof watchDisp==="function")?watchDisp().name+" · диспетчер":"диспетчер";
  if(typeof consoleHeard==="function")consoleHeard(L,who);
  logAdd("ether",who+": «"+L+"»");
}
/* ── дела, которые игра уже делает — крючками ── */
function doorJudged(rec,prevLo){
  if(!rec)return;
  if(rec.norm>=WATCH_HI)doorDeed("norm");
  if(prevLo>0&&rec.norm>=WATCH_LO)doorDeed("srv");    /* срыв пережит: после срыва — снова не ниже 60 % */
  const D=doorSt();
  if(rec.norm>=WATCH_HI){if(D.y==null)D.y=celDay();D.yn=(D.yn|0)+1;}
  else{D.y=null;D.yn=0;}
}
/* «год» нормы ≥ 90 %: ряд сводок не рвался 365 суток неба, и сводок в нём хотя бы две */
function doorYearOk(){const D=doorSt();return D.y!=null&&celDay()-D.y>=DOOR_YEAR&&(D.yn|0)>=2;}
/* ── тридцать историй на делах вахты ──
   Поворот: после первого следа истории, если игрок сделал дело ПОСЛЕ знакомства с ней, —
   флаг wd; последний след истории ждёт его. Не сделал — история остаётся недосказанной
   (треть и так не объясняется, закон 11c). Берутся истории без своих поворотов, у которых
   последний след не держит флагов и на него не ссылается чужая история */
function doorStoryDeed(k,S){
  const e=doorWd()[k];if(!e||!(e[0]>0))return false;
  let d0=Infinity;for(const t of S.traces){const v=storySeen()[S.id+"."+t.id];if(v!=null&&v<d0)d0=v;}
  return d0!==Infinity&&e[2]>=d0;
}
for(const k of DOOR_STORY_KEYS)STORY_WHEN[k]=(v,S)=>doorStoryDeed(k,S)===!!v;
function doorStoryPick(){
  const ref=new Set();
  for(const S of storyAll())for(const t of S.traces||[])if(t.when)for(const f of ["seenOf","unseenOf"])if(t.when[f])ref.add(t.when[f]);
  const L=storyAll().filter(S=>{
    if(!S||!S.id||S.id==="sixth_report"||(S.turns&&S.turns.length)||!S.traces||S.traces.length<2)return false;
    const t=S.traces[S.traces.length-1],w=t.when||{};
    if(w.flag||w.noflag||w.any||w.none)return false;
    return !ref.has(S.id+"."+t.id);
  }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const out=[],step=L.length/DOOR_STORY_N;
  for(let i=0;i<DOOR_STORY_N&&i*step<L.length;i++)out.push(L[Math.floor(i*step)]);
  return out;
}
const DOOR_STORIES=doorStoryPick().map((S,i)=>{
  const k=DOOR_STORY_KEYS[i%DOOR_STORY_KEYS.length],t=S.traces[S.traces.length-1];
  S.turns=[{after:"seen:"+S.traces[0].id,days:1,set:"wd",when:{[k]:true}}];
  t.when=Object.assign({},t.when||{},{flag:"wd"});
  return {id:S.id,k};
});
/* ── второй акт на участке: баржи с людьми — с ваших станций ── */
function doorExpStation(r){
  const L=(typeof watchStations==="function")?watchStations():[];
  return L.length?L[Math.floor(r()*L.length)]:null;
}
/* ── запись ── */
function doorRestore(s){
  G.wd=null;G.doors=null;
  const w=s&&s.wd,d=s&&s.doors;
  if(w&&typeof w==="object"){const W=doorWd();for(const k of DOOR_KEYS){const e=w[k];if(Array.isArray(e)&&e.length===3&&e.every(x=>isFinite(x)&&x!==null))W[k]=[e[0]|0,+e[1],e[2]|0];}}
  const D=doorSt();
  if(d&&typeof d==="object"){
    if(d.at&&typeof d.at==="object")for(const n in d.at)if(isFinite(d.at[n])&&d.at[n]!==null&&+n>=1&&+n<=72)D.at[n]=+d.at[n];
    if(d.dr&&typeof d.dr==="object")for(const n in d.dr)if(DOOR_INNER.indexOf(d.dr[n])>=0)D.dr[n]=d.dr[n];
    D.y=isFinite(d.y)&&d.y!==null?d.y|0:null;D.yn=d.yn|0;
  }
}
/* ── крючки — одной таблицей (как 28m, 28n, 28o) ── */
const DOOR_HOOKS=[
  ["watchJudge",  O=>function(W){const lo=((W||G.uch||{}).run||{}).lo|0;const r=O.apply(this,arguments);dispSafe(()=>doorJudged(r,lo));return r;}],
  ["hullLost",    O=>function(){const r=O.apply(this,arguments);doorDeed("hull");return r;}],
  ["folkShut",    O=>function(id){const was=!!(typeof folkOf==="function"&&folkOf(id).shut);const r=O.apply(this,arguments);if(!was)doorDeed("door");return r;}],
  ["ransomPay",   O=>function(){const r=O.apply(this,arguments);if(r)doorDeed("ransom");return r;}],
  ["crewFreeHostagesAt",O=>function(){const r=O.apply(this,arguments);if(r>0)doorDeed("ransom");return r;}],
  ["offerTake",   O=>function(o){const was=!!(o&&o.taken);const r=O.apply(this,arguments);if(o&&!was&&o.taken&&o.named)doorDeed("offer");return r;}],
  ["plnActDo",    O=>function(q,id){const r=O.apply(this,arguments);if(r&&!r.keep){doorDeed("mark");if(id==="carve"&&r.way==="carve")doorDeed("notch");}return r;}],
  ["watchBack",   O=>function(){const r=O.apply(this,arguments);if(r)doorDeed("handover");return r;}],
  ["storySetFlag",O=>function(S,f){const r=O.apply(this,arguments);if(f==="wd")doorDeed("story");return r;}],
  ["smenaLand",   O=>function(){const n=smenaNext();if(n>=10&&!doorOpen(n))return 0;return O.apply(this,arguments);}],
  ["smenaOpenHere",O=>function(){const r=O.apply(this,arguments);if(r)dispSafe(()=>doorOpened(r));return r;}],
  ["expDemandOf", O=>function(sys){if(sys&&typeof watchHas==="function"&&!watchHas(sys))return null;return O.apply(this,arguments);}],
  ["expNearStation",O=>function(r){const S=doorExpStation(r)||O.apply(this,arguments);if(S&&typeof gaugeAdd==="function")gaugeAdd(S,0,-.1,0);return S;}],
  ["expOfferHere",O=>function(){const E=G.exp;if(!E||E.phase!==2||E.offered||E.ended||!G.sys||!G.st)return false;return !!(typeof watchHas==="function"&&watchHas(G.sys)&&doorYearOk());}],
  ["snapshot",    O=>function(){const s=O.apply(this,arguments);s.wd=G.wd||null;s.doors=G.doors||null;return s;}],
  ["applySave",   O=>function(s){const r=O.apply(this,arguments);if(r)doorRestore(s);return r;}]
];
for(const [n,mk] of DOOR_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("двери глав: нет крючка "+n);window[n]=mk(O);}
