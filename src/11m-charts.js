/* ══════════════ несогласие карт: планета, которой нет ни в одной записи ══════════════
   M141-charts. Пограничный край с дурной лоцией (06c, `charts`, игла курсографа),
   живущий контрабандой и серой навигацией. Здесь врут профессионально, и это
   важно: игрок должен сначала решить, что его обманывают.

   ОКРАИНА: мелкие расхождения, списанные на старые данные. Потом система,
   которой нет в новой базе — на карте её не видно, а она есть.
   ЯДРО: обыкновенная обитаемая планета, которой нет ни в одной записи. НИКАКОГО
   МЕХАНИЗМА: ни разлома, ни радиации. Только несогласие. Местные вежливы и
   слегка вам сочувствуют: предлагают сверить приборы, сверяют и мягко замечают,
   что у вас всё в порядке — вы просто прилетели ниоткуда.
   ИХ КАРТУ МОЖНО ВЫМЕНЯТЬ. Пока она в трюме, навигатор не показывает ваш дом.
   Тихо, без сообщения. Выбросить — она возвращается.

   ПРАВИЛА ФАЙЛА:
   1. Намёков на причину нет нигде. Ни строки.
   2. Хранится G.charts={have,lost}: карта в трюме и когда выброшена. */

const CHARTS_PRICE=300;
function chartsAll(){return (G.charts||(G.charts={have:0,lost:-1}));}
function chartsDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="charts")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function chartsDepthHere(){return chartsDepthAt(G.sx,G.sy);}
/* чего нет на карте: каждая пятая система окраины (кроме ядра) — и ваш дом,
   пока их карта в трюме. Система при этом существует и доступна прыжком. */
function chartsHidden(sx,sy){
  const C=chartsAll();
  if(C.have&&sx===0&&sy===0)return true;
  const d=chartsDepthAt(sx,sy);
  if(d!==1)return false;
  return hashi(sx,sy,0xC4A)%5===0;
}
/* окраина: карта дрожит — расхождение, списанное на старые данные */
function chartsJitter(sx,sy){
  if(chartsDepthAt(sx,sy)!==1)return [0,0];
  const r=rng(hashi(sx,sy,0xC4B));
  return [(r()-.5)*.18,(r()-.5)*.18];
}
/* стыковка в ядре: одна строка, и она про вас, не про планету */
function chartsDock(){
  if(chartsDepthHere()!==2)return null;
  const line=chartsAll().have?"Карту вы уже взяли. Дом найдёте — вы же его помните.":"Сверим приборы? Вот, сверили. У вас всё в порядке. Вы просто прилетели ниоткуда.";
  logAdd("dim","Местные: "+line);
  return {line};
}
function chartsBuy(){
  const C=chartsAll();
  if(C.have||G.credits<CHARTS_PRICE)return false;
  G.credits-=CHARTS_PRICE;C.have=1;C.lost=-1;
  logAdd("dim","Их карта в трюме. На ней всё есть.");
  return true;
}
function chartsDrop(){
  const C=chartsAll();
  if(!C.have)return false;
  C.have=0;C.lost=(G.odo&&G.odo.jumps)|0;
  logAdd("dim","Карту выбросили.");
  return true;
}
/* возвращается: через пять прыжков она снова в трюме, без объяснений */
function chartsTick(){
  const C=chartsAll();
  if(C.have||C.lost<0)return;
  if((((G.odo&&G.odo.jumps)|0)-C.lost)>=5){C.have=1;C.lost=-1;logAdd("dim","Карта снова в трюме.");}
}
/* блок в кантине ядра */
function chartsBlock(){
  if(chartsDepthHere()!==2)return;
  const C=chartsAll();
  $body.appendChild(el("div","sec","ИХ КАРТА"));
  const r=el("div","row");
  if(!C.have){
    r.appendChild(el("div","nm","<b>Карта местных</b><s>на ней есть всё. "+CHARTS_PRICE+" кр</s>"));
    const b=el("button","act sm","ВЫМЕНЯТЬ");b.disabled=G.credits<CHARTS_PRICE;b.onclick=()=>{chartsBuy();renderTab();};r.appendChild(b);
  }else{
    r.appendChild(el("div","nm","<b>Карта местных</b><s>в трюме</s>"));
    const b=el("button","act sm","ВЫБРОСИТЬ");b.onclick=()=>{chartsDrop();renderTab();};r.appendChild(b);
  }
  $body.appendChild(r);
}
