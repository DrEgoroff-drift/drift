/* ══════════════ названия по хозяину (M489, DESIGN-birchpunk §2) ══════════════
   «Рязань Каунти»: домашний топоним и административный суффикс хозяина земли.
   Сменился флаг — перекрашивается и вывеска: название считается от хозяина
   сейчас, а не хранится. Фирмы — губернский город и чужое техническое
   слово, выдуманные; настоящих — никогда. */
const TOPO_FMT={
  gt:(b,n)=>"пгт "+b,
  co:(b,n)=>n%2?b+" Каунти":b+"-Сити",
  or:(b,n)=>"Бецирк "+b+" № "+(1+n%9),
  km:(b,n)=>"Сен-"+b,
  ra:(b,n)=>"кооператив «"+b+"»",
  hf:(b,n)=>b+"-"+(1+n%4)+" v"+(1+n%5)+"."+(n%10)
};
function ownerName(base,sx,sy){
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(sx,sy):null;
  const f=by&&TOPO_FMT[by];
  return f?f(base,hashi(sx,sy,0x70F0)>>>0):base;
}
const FIRM_TOWN=["Кострома","Урюпинск","Кинешма","Сызрань","Торжок","Котлас","Шуя","Вязьма","Ирбит","Кунгур"];
const FIRM_WORD=["Роботикс","Орбитал","Дайнемикс","Системс","Аэроспейс","Фьюжн","Логистикс","Индастриз"];
function firmName(seed){const r=rng(hashi(seed|0,0xF1A3,2));return FIRM_TOWN[Math.floor(r()*FIRM_TOWN.length)]+" "+FIRM_WORD[Math.floor(r()*FIRM_WORD.length)];}
