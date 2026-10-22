/* ══════════════ первая вахта: первый час — это первая смена (M909 · DESIGN-game §10.7) ══════════════
   Первый час держали четыре строки эфира (11ao) и бумага стажёра (27ib). Диспетчер (28m) с первой
   стыковки выкладывал всё сразу: два адресных, срочное и наряд на три станции — четыре дела на
   человека, который ещё не знает, где заправка. Теперь первый час идёт по минутам замысла:

   ПРАВИЛА ФАЙЛА:
   1. Минута 0 — первая стойка: диспетчер участка встречает и отдаёт участок (плашка 28j, как была);
      в полосе К ВАМ — два адресных дела с лицом и сроком: привоз и дело без груза. Срочного и
      наряда на три станции в первой вахте нет.
   2. Минута 6 — первое «сейчас или никогда»: капсула с баржи дрейфует у соседней станции, восемь
      минут. Приходит само, где бы игрок ни был, — табличкой у корабля, а у стойки — строкой доски.
   3. Первая отстыковка — она называет участок по имени в эфире: смена пошла. Один раз за запись.
   4. Час налёта — первая бумага со строкой стажёра (27ib, как была). С ней вахта кончается: срочное
      и наряд выдаются как всем.
   5. Минуты считаются по часам игры от начала записи; пока смена сдана, первая вахта стоит вместе
      со всем (28j §5). Старая запись без G.fw, у которой первый час налётан, вахты не видит. */
const FW_URG_MIN=6,FW_POD_MIN=8;
function fwSt(){
  if(!G.fw||typeof G.fw!=="object")G.fw={};
  const F=G.fw;
  if(!isFinite(F.t0)||F.t0===null)F.t0=now();
  F.u=F.u?1:0;F.w=F.w?1:0;F.done=F.done?1:0;
  return F;
}
function fwOn(){
  const F=fwSt();
  if(F.done)return false;
  if(!firstHour()){F.done=1;return false;}
  return true;
}
function fwMin(){return (now()-fwSt().t0)/60000;}
/* откуда капсула: своя станция, если стоим у неё, иначе ближайшая станция участка */
function fwHome(){
  if(G.sys&&G.sys.station&&G.sys.station.prices)return G.sys;
  let best=null,bd=1e9;
  for(const S of watchStations()){const d=Math.max(Math.abs(S.sx-G.sx),Math.abs(S.sy-G.sy));if(d<bd){bd=d;best=S;}}
  return best;
}
/* минута 6: капсула; пока смена сдана — не идёт ничего */
function fwTick(){
  if(!fwOn())return null;
  const F=fwSt(),t=now();
  /* сданная смена: часы вахты стоят — начало сдвигается на простой */
  if(F.lt!=null&&watchHanded())F.t0+=Math.max(0,t-F.lt);
  F.lt=t;
  if(watchHanded())return null;
  if(F.u||fwMin()<FW_URG_MIN)return null;
  const S=fwHome();if(!S)return null;
  const D=dispSt();
  if(D.it.some(x=>x.kind==="urg")){F.u=1;return null;}
  const it=dispIssue("urg",S,{},"kapsula")||dispIssue("urg",S,{});
  if(!it)return null;
  it.due=now()+FW_POD_MIN*60000;
  F.u=1;
  if(G.mode==="system")dispAlarm(true);
  else if(G.mode==="dock"&&typeof renderTab==="function")renderTab();
  return it;
}
/* первая отстыковка: участок по имени */
function fwUndock(){
  const F=fwSt();
  if(F.w||F.done||G.mode==="dock")return false;
  F.w=1;
  const P=watchDisp(),nm=watchName();
  /* эфиром, как четыре строки первого часа (11ao): табличка у корабля — для срочного, не для слов */
  const t="…борт, участок "+nm+" — ваш. Смена пошла.";
  if(typeof consoleHeard==="function")consoleHeard(t,P.name);
  logAdd("ether",P.name+": "+t);
  return true;
}
function fwRestore(s){
  const b=s&&s.fw;G.fw=null;
  if(b&&typeof b==="object"){
    const F=fwSt();
    if(isFinite(b.t0)&&b.t0!==null)F.t0=+b.t0;
    F.u=b.u?1:0;F.w=b.w?1:0;F.done=b.done?1:0;
    F.lt=isFinite(b.lt)&&b.lt!==null?+b.lt:now();
  }else if(!firstHour())fwSt().done=1;   /* запись до M909: первый час уже налётан — вахты нет */
}
/* ── крючки — одной таблицей (как 28m, 28n) ── */
const FW_HOOKS=[
  ["dispSlotOk",  O=>function(kind){if(fwOn()&&(kind==="long"||(kind==="urg"&&!fwSt().u)))return false;return O.apply(this,arguments);}],
  ["mgrTick",     O=>function(){dispSafe(fwTick);return O.apply(this,arguments);}],
  ["closeStation",O=>function(){const r=O.apply(this,arguments);dispSafe(fwUndock);return r;}],
  ["snapshot",    O=>function(){const s=O.apply(this,arguments);s.fw=G.fw||null;return s;}],
  ["applySave",   O=>function(s){const r=O.apply(this,arguments);if(r)fwRestore(s);return r;}]
];
for(const [n,mk] of FW_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("первая вахта: нет крючка "+n);window[n]=mk(O);}
