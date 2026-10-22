/* ══════════════ первый час — час игры, а не час налёта (M912 · DESIGN-game §10.7, §4.1b) ══════════════
   Первый час (05e firstHour) считался налётом: G.flownMs копится только в полёте (clrTick). Бот
   свежей записи (91zzzw4, ярус «T0 свежий») три четверти круга ходит по грунту и бурит — за полтора
   часа игры налётал 11 минут. Первая вахта (28o), бумага стажёра (27ib), страховка «Стрижа» на
   всё (28i), мягкая посадка и полцены ремонта — всё это держалось у копателя часов восемь.

   ПРАВИЛА ФАЙЛА:
   1. Час игры — G.playMs: всякий кадр петли, пока игра идёт, кроме стойки (на станции и за столом
      смена не идёт — как у налёта). Грунт, пещера, шахта, рейд — это вахта.
   2. Налёт (G.flownMs) не трогается: допуск (05e) по-прежнему меряет полёт.
   3. Первый час кончается по большему из двух: полёт входит в игру, и запись (или набор), где
      налёт поставлен руками, первый час прошла. Старая запись без playMs берёт налёт и досчитывает
      игрой. Снимок пишет поле всегда. */
function playTick(ms){
  if(!G.running||G.mode==="dock")return;
  G.playMs=(G.playMs||0)+Math.min(2000,Math.max(0,ms||0));
}
const PLAYHOUR_HOOKS=[
  ["clrTick",  O=>function(ms){playTick(ms);return O.apply(this,arguments);}],
  ["firstHour",O=>function(){return Math.max(G.playMs||0,G.flownMs||0)<FIRST_HOUR_MS;}],
  ["snapshot", O=>function(){const s=O.apply(this,arguments);s.playMs=Math.round(G.playMs||0);return s;}],
  /* до оригинала: первая вахта (28o) спрашивает firstHour() внутри своей записи */
  ["applySave",O=>function(s){
    const had="playMs" in G,old=G.playMs,pm=s&&isFinite(s.playMs)&&s.playMs!==null?Math.max(0,+s.playMs):Math.max(0,(s&&+s.flownMs)||0);
    G.playMs=pm;let r=false;
    /* отказ — и возвратом, и исключением — оставляет мир нетронутым до бита (91qo: порча байтов сейва) */
    try{r=O.apply(this,arguments);}finally{if(r)G.playMs=pm;else if(had)G.playMs=old;else delete G.playMs;}
    return r;}]
];
for(const [n,mk] of PLAYHOUR_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("час игры: нет крючка "+n);window[n]=mk(O);}
