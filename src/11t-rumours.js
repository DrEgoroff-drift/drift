/* ══════════════ слухи: как вообще узнают, что место есть ══════════════
   M148. Единственный канал открытия и причина, по которой пространство между
   чудесами не пусто.

   СЛУХ — ОБЛАСТЬ, НИКОГДА НЕ ТОЧКА: три-пять систем, плюс один образ, одна
   человеческая деталь и источник. Ловится в кантинах и на приёмнике.
   СЛУХИ ИСКАЖАЮТСЯ В ПЕРЕСКАЗЕ, и примерно пятнадцать процентов просто
   неверны — не чтобы обмануть, а потому что слухи такие. Два независимых
   источника, сошедшиеся в одном, — самый сильный сигнал в игре, и игрок
   понимает это сам.
   Маркеров нет. «Неисследованной аномалии» нет ни в одном списке.

   ПРАВИЛА ФАЙЛА:
   1. Слух считается от станции и трёх суток: на той же станции через три дня
      расскажут другое. Ничего не хранится.
   2. Имя, данное игроком ядру (11u), слух подхватывает — слегка искажённым. */

const RUMOUR_IMG={
  post:"свёрток, который передают из рук в руки полвека",mirror:"эфир, где всё повторяется дважды",
  lights:"дворы, где ставни закрывают среди дня",hours:"столовая, где горячее, а людей нет",
  glow:"луг, который светится после затмения",grove:"камни в поясе, которые сходятся к заглушённому двигателю",
  keepers:"маяк, где тебе нальют, не спросив",county:"дверь в четыре метра и ни одной кнопки",
  charts:"планета, которой нет ни на одной карте",quiet:"край, где не ломаются машины",
  slow:"долина, где что-то выкладывают в ответ",pass:"корабль, к которому ходят на поклон",
  grown:"посёлки одного народа, только разные",plan:"комбинат, который работает двести лет",
  tin:"станция, где деды моложе внуков"
};
const RUMOUR_DETAIL=["у рассказчика дрожали руки","он показывал ленту, и на ней был горб",
  "она сказала это и сразу сменила тему","он клялся кружкой","рассказчик был трезв, что редкость",
  "она там родилась, говорит","у него на куртке была их нашивка"];
const RUMOUR_SRC=["механик с «Прибоя»","буфетчица","старик у стойки","диспетчер на смене","пассажир барж","женщина в платке"];
function rumourSeedHere(){
  return hashi(G.sys?(G.sys.sx*131+G.sys.sy*7):0,Math.floor(celDay()/3),0x5A5A);
}
/* слухи этой станции на эти три дня: два, и один из них может врать */
function rumoursHere(){
  const placed=(typeof REGION_TABLE!=="undefined")?REGION_TABLE.filter(T=>regionOfTheme(T.id)):[];
  if(!placed.length)return [];
  const r=rng(rumourSeedHere()),out=[];
  for(let i=0;i<2;i++){
    const T=placed[Math.floor(r()*placed.length)];
    const at=regionOfTheme(T.id),R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
    let cx=R.core.sx+Math.round((r()-.5)*4),cy=R.core.sy+Math.round((r()-.5)*4);
    const wrong=r()<.15;
    if(wrong){cx=Math.round((r()-.5)*60);cy=Math.round((r()-.5)*60);}   /* просто неверен */
    const rad=3+Math.floor(r()*3);
    const img=RUMOUR_IMG[T.id]||T.ru.toLowerCase();
    /* имя игрока (11u): слух подхватывает его, слегка искажённым */
    let nm="";
    if(typeof namesFor==="function"){const n=namesFor(R.core.sx+","+R.core.sy);if(n)nm=" — называют «"+namesMangle(n)+"»";}
    out.push({id:T.id,sx:cx,sy:cy,rad,wrong,
      text:img+nm+". "+pick(RUMOUR_DETAIL,r)+". — "+pick(RUMOUR_SRC,r)+", где-то у "+cx+":"+cy+", ±"+rad});
  }
  return out;
}
/* приёмник: изредка слух приходит строкой эфира */
function rumourEtherLine(r){
  if(!G.sys||r()>.12)return null;
  const L=rumoursHere();
  return L.length?"…говорят, "+L[Math.floor(r()*L.length)].text:null;
}
/* блок в кантине: два слуха, без карты и без маркера */
function rumourBlock(){
  const L=rumoursHere();
  if(!L.length)return;
  $body.appendChild(el("div","sec","СЛУХИ"));
  for(const q of L)$body.appendChild(el("div","row","<div class='nm'><s style='color:#cfe3ea;line-height:1.8'>"+q.text+"</s></div>"));
}
