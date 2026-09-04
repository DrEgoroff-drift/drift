/* ══════════════ пульт «Сороки»: карточка витрины перед вами (M343) ══════════════
   Модель ряда блошинца (12ua): не сетка, а ОДНА карточка — витрина, перед
   которой вы стоите: имя, происхождение словами хранителя, что даёт, что просят,
   и кнопки. ◀ ▶ — шаг по коридору, ВЗЯТЬ — купить или обменять, СЫРЬЁ —
   второй прилавок (летучие, кристаллы, сплав, техкомпоненты за спички; показать
   редкость), УЙТИ — обратно к трапу.

   Панель висит над пультом, как приёмник в полёте, и перестраивается только
   когда изменилось то, что на ней написано (сигнатура), — иначе каждый кадр
   пересобирал бы DOM. */
let wanSig="";
function wanPanel(){
  let w=document.getElementById("wanwin");
  if(w)return w;
  w=document.createElement("div");w.id="wanwin";w.className="wanwin";
  w.innerHTML="<header><b id='wanTitle'>«СОРОКА»</b><s id='wanSub'></s></header>"+
    "<div class='card' id='wanCard'></div><div class='acts' id='wanActs'></div>";
  document.body.appendChild(w);
  return w;
}
function wanPanelSync(){
  const S=wanAll();const w=wanPanel();
  if(!S){w.classList.remove("open");wanSig="";return;}
  w.classList.add("open");
  const lots=wanLots(),cur=clamp(S.cursor,0,Math.max(0,lots.length-1)),lot=lots[cur]||null;
  const raw=Object.keys(WANDER_RAW).map(k=>k+":"+(G.cargo[k]|0)).join(",");
  const sig=[cur,lots.length,lot?(lot.id+"|"+(lot.gone?1:0)):"-",matchesRec(),Math.round(G.credits),
    S.counter?1:0,raw,wanderRawLeft(S.w),wanderShowables().length,wanderAskPart()?1:0,S.w.tLeft/60000|0].join("/");
  if(sig===wanSig)return;
  wanSig=sig;
  document.getElementById("wanSub").textContent=(S.dark?"тёмная стоянка · ":"")+wanderLeftRu(S.w)+
    " · спичек: "+matchesRec()+" · витрина "+(cur+1)+" из "+lots.length;
  const card=document.getElementById("wanCard"),acts=document.getElementById("wanActs");
  card.textContent="";acts.textContent="";
  const mk=(ru,cls,go,off)=>{const b=document.createElement("button");b.className="act sm"+(cls?" "+cls:"");
    b.textContent=ru;b.disabled=!!off;b.onclick=()=>{go();wanSig="";wanPanelSync();};acts.appendChild(b);return b;};
  if(S.counter){
    /* прилавок Б: сырьё за спички, редкость показать */
    let h="<b>Прилавок: сырьё за спички</b><s>40 летучих, кристаллов льда или сплава — спичка; 20 техкомпонентов — спичка · "+
      "на эту стоянку ещё "+wanderRawLeft(S.w)+" единиц · редкость показать — четыре спички, один раз, вещь остаётся у вас</s>";
    card.innerHTML=h;
    const rows=document.createElement("div");rows.className="rows";
    for(const k in WANDER_RAW){
      const n=G.cargo[k]|0,q=wanderRawQuote(k,Math.min(n,wanderRawLeft(S.w)));
      const r=document.createElement("div");r.className="ln";
      r.innerHTML="<em>"+RES[k].ru+" × "+n+"</em>";
      const b=document.createElement("button");b.className="act sm"+(q?" gold":"");b.textContent=q?"СДАТЬ → "+matchesRu(q):"МАЛО";
      b.disabled=!q;b.onclick=()=>{wanderSellRaw(k);wanSig="";wanPanelSync();};
      r.appendChild(b);rows.appendChild(r);
    }
    const sh=wanderShowables().slice(0,4);
    for(const R of sh){
      const r=document.createElement("div");r.className="ln";
      r.innerHTML="<em>«"+R.ru+"»</em>";
      const b=document.createElement("button");b.className="act sm";b.textContent="ПОКАЗАТЬ → 4";
      b.onclick=()=>{wanderShowRare(R.id);wanSig="";wanPanelSync();};
      r.appendChild(b);rows.appendChild(r);
    }
    card.appendChild(rows);
    mk("← К ВИТРИНАМ","",()=>{S.counter=false;});
    mk("УЙТИ","",()=>exitWanderer());
    return;
  }
  if(!lot){card.innerHTML="<b>Витрины пусты</b><s>хранитель разводит руками</s>";}
  else if(lot.empty){card.innerHTML="<b>Пустая витрина</b><s>мелом: «"+lot.chalk+"»</s>";}
  else if(lot.gone){card.innerHTML="<b>Пустая витрина</b><s>мелом: «"+lot.chalk+"» · дыра и есть память</s>";}
  else{
    const why=wanderCant(lot);
    card.innerHTML="<b>"+lot.ru+"</b><s>«"+lot.note+"»</s><i>"+lot.fx+"</i>"+
      "<u>"+wanderPriceRu(lot.cat)+(why?" · <span class='dn'>"+why+"</span>":"")+"</u>";
  }
  mk("◀","",()=>wanStep(-1),cur<=0);
  mk("▶","",()=>wanStep(1),cur>=lots.length-1);
  if(lot&&!lot.empty&&!lot.gone)mk(lot.pay.ask?"ОБМЕНЯТЬ":"ВЗЯТЬ","gold",()=>wanderBuy(lot),!!wanderCant(lot));
  mk("СЫРЬЁ","",()=>{S.counter=true;});
  mk("УЙТИ","",()=>exitWanderer());
}
