/* ══════════════ приёмник: частота крутится рукой ══════════════
   Остаток M124: слухи, цены и погода не открываются вкладкой — они находятся
   настройкой. Шкала от нуля до единицы, между станциями шум. Диапазоны
   лежат всегда на одном месте, как у настоящего приёмника: игрок запоминает,
   где что, а не читает список.

   ПРАВИЛА ФАЙЛА:
   1. Приёмник ничего не сочиняет: слухи — 11t, цены — 12-economy, погода —
      19d, эфир — 11b. Он только выбирает, что слышно на этой частоте.
   2. Ничего не хранится, кроме последней частоты (G.radioF) — это ручка, а
      не сведения. */

const RADIO_BANDS=[
  {lo:.12,hi:.30,k:"rumour",ru:"СЛУХИ"},
  {lo:.40,hi:.58,k:"price", ru:"ЦЕНЫ"},
  {lo:.66,hi:.80,k:"weather",ru:"ПОГОДА"},
  {lo:.88,hi:1.0,k:"ether", ru:"ЭФИР"}
];
function radioBand(f){
  /* Пятый диапазон (M191) не лежит в таблице: он ЕСТЬ НЕ ВСЕГДА — только
     вечером и только в сети. Диапазон, который «иногда работает», в таблице
     постоянных диапазонов был бы неправдой про сам приёмник */
  if(typeof ethBandAt==="function"&&ethBandAt(f))
    return {lo:ETH_LO,hi:ETH_HI,k:"night",ru:"НОЧНАЯ ПОЧТА"};
  for(const B of RADIO_BANDS)if(f>=B.lo&&f<=B.hi)return B;
  return null;
}
/* что слышно: строка и качество (1 в середине диапазона, 0 на краю — шум) */
function radioTune(f){
  f=clamp(+f||0,0,1);G.radioF=f;
  const B=radioBand(f);
  if(!B)return {k:"noise",q:0,text:"…шшш… "+"".padEnd(3+Math.floor(f*9),"·")};
  const mid=(B.lo+B.hi)/2,q=clamp(1-Math.abs(f-mid)/((B.hi-B.lo)/2),0,1);
  const r=rng(hashi(Math.round(f*200),Math.floor(celDay()/3),0xAD10));
  let text="";
  if(B.k==="rumour"){const L=(typeof rumoursHere==="function")?rumoursHere():[];text=L.length?"…говорят, "+L[Math.floor(r()*L.length)].text:"…тихо";}
  else if(B.k==="price"){
    const st=(typeof nearestStation==="function")?nearestStation(G.sx,G.sy):null;
    const S=st?getSystem(st.sx,st.sy):(G.sys&&G.sys.station?G.sys:null);
    if(S&&S.station){const P=marketFor(S);let best=null;for(const k of TRADE_KEYS)if(!best||P[k]>P[best])best=k;text="…"+S.station.name+": "+RES[best].ru.toLowerCase()+" берут по "+P[best]+", топливо "+S.station.fuelPrice+".";
      /* услышал — записал (плейтест, пункт 5). Биржа названа вслух, и с этого
         мгновения она есть на бумаге: по ней можно проложить курс, не запоминая
         координат ушами. Только при разборчивом приёме — на краю диапазона
         слова и так выпадают, и записывать шум было бы враньём */
      if(q>.55&&typeof pricesHeard==="function")pricesHeard(S,best,P[best],S.station.fuelPrice);
    }
    else text="…биржа молчит: станций в радиусе нет";
  }else if(B.k==="weather"){
    const ps=((G.sys&&G.sys.planets)||[]).filter(p=>p.type!=="gas");
    if(ps.length){const p=ps[Math.floor(r()*ps.length)],w=weatherPower(p),wk=weatherOf(p).kind;text="…"+p.name+": "+(wk?(w>.6?"штормит, "+wk:(w>.25?wk+", умеренно":"тихо, "+wk)):"без атмосферы, без погоды")+".";}
    else text="…погоды нет: твёрдых миров в системе нет";
  }else if(B.k==="night"){
    /* ночная почта читается по строке за раз, и ход передачи ведёт 25l */
    text=(typeof ethTick==="function"&&ethTick(q))||"…шшш…";
  }else{
    /* вымпел (M196): дошедший зонд говорит ОДИН раз и вместо эфира. Порог по
       качеству тот же, что у слов: на краю диапазона его не «израсходовать» */
    const P=(typeof probeDue==="function"&&q>.55)?probeDue():null;
    /* праздник слышно в эфире (M201): чужие голоса, которым от вас ничего не
       надо. Вымпел важнее — он говорит один раз в жизни */
    const HL=(!P&&typeof holEtherLine==="function"&&q>.55&&r()<.45)?holEtherLine():"";
    /* дальние корреспонденты (M203): редкая удача на ЭФИРе. Услышал — записал */
    const QL=(!P&&!HL&&typeof qslEtherLine==="function"&&q>.7)?qslEtherLine():"";
    text=P?probeSpeak(P):(HL||QL||pick(ETHER,r));
  }
  /* на краю диапазона слова выпадают */
  /* ночную почту на краю не глушим второй раз: ethTick уже отдал «шшш», а
     дырявить готовую строку карточки значило бы врать про то, что услышано */
  if(q<.55&&B.k!=="night")text=text.replace(/[а-яёa-z]{3,}/gi,w=>r()<(1-q)*.6?"…":w);
  return {k:B.k,ru:B.ru,q,text};
}
