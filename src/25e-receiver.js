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
    if(S&&S.station){const P=marketFor(S);let best=null;for(const k of TRADE_KEYS)if(!best||P[k]>P[best])best=k;text="…"+S.station.name+": "+RES[best].ru.toLowerCase()+" берут по "+P[best]+", топливо "+S.station.fuelPrice+".";}
    else text="…биржа молчит: станций в радиусе нет";
  }else if(B.k==="weather"){
    const ps=((G.sys&&G.sys.planets)||[]).filter(p=>p.type!=="gas");
    if(ps.length){const p=ps[Math.floor(r()*ps.length)],w=weatherPower(p),wk=weatherOf(p).kind;text="…"+p.name+": "+(wk?(w>.6?"штормит, "+wk:(w>.25?wk+", умеренно":"тихо, "+wk)):"без атмосферы, без погоды")+".";}
    else text="…погоды нет: твёрдых миров в системе нет";
  }else{text=pick(ETHER,r);}
  /* на краю диапазона слова выпадают */
  if(q<.55)text=text.replace(/[а-яёa-z]{3,}/gi,w=>r()<(1-q)*.6?"…":w);
  return {k:B.k,ru:B.ru,q,text};
}
/* блок в кантине: ручка и то, что слышно */
function radioBlock(){
  $body.appendChild(el("div","sec","ПРИЁМНИК · КРУТИТЕ РУЧКУ"));
  const f=(G.radioF==null?.05:G.radioF),R=radioTune(f);
  const r=el("div","row");
  const inp=document.createElement("input");inp.type="range";inp.min=0;inp.max=1;inp.step=.005;inp.value=f;inp.style.cssText="width:14em";
  const out=el("div","nm","<b>"+(R.ru||"шум")+"</b><s style='color:#cfe3ea'>"+R.text+"</s>");
  inp.oninput=()=>{const Q=radioTune(+inp.value);out.innerHTML="<b>"+(Q.ru||"шум")+"</b><s style='color:#cfe3ea'>"+Q.text+"</s>";};
  r.appendChild(inp);r.appendChild(out);$body.appendChild(r);
}
