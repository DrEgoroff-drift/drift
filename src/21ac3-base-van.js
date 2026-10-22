/* ══════════════ «Буханка» — машина базы с именем (M498 хвост, M485) ══════════════
   Автор: «челнок базы поверхность–корабль как именная машина: коробчатый
   старый фургон с двигателями, всегда немного сломанный, единственная машина,
   которую игрок может переименовать (из таблицы, без свободного текста)».

   Машина заводится у базы с площадкой: имя из VAN_NAMES по семени базы,
   причуда из VAN_QUIRKS — одна и навсегда, как у дронов (M485). Причуда
   честная и маленькая: «не заводится с первого раза» — каждая третья
   переброска с площадки требует второго нажатия; остальные — строка в
   журнале раз в двенадцать смен и деталь на рисунке (дверь на проволоке —
   изолента на двери; поворотник — горит всегда; греется — марево над капотом).
   Переименовать — кнопка на столе станции: имя идёт по кругу таблицы, и
   журнал базы это записывает. B.van = {n, q, tries}. */
const VAN_NAMES=["Буханка","Таблетка","Головастик","Шишига","Козлик","Пирожок","Бочка","Утюг"];
const VAN_QUIRKS=[
  {id:"start",ru:"не заводится с первого раза"},
  {id:"heat", ru:"греется"},
  {id:"door", ru:"дверь на проволоке"},
  {id:"stove",ru:"печка не работает"},
  {id:"blink",ru:"правый поворотник горит всегда"}
];
const VAN_SAY=12;
Object.assign(BLOG,{
  van:   (B,a)=>"«"+(a.who||"Буханка")+"»: "+(a.what||"опять что-то")+" · "+(a.how||"починили тем, что было"),
  vanren:(B,a)=>"машину переименовали: «"+(a.was||"?")+"» → «"+(a.who||"?")+"» · табличку перевесили"
});
const VAN_HOW={start:"завели со второго",heat:"постояла — остыла",door:"проволоку подкрутили",stove:"ехали в куртках",blink:"пусть горит"};
function vanHasPad(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="pad")return true;
  return false;
}
function vanOf(B){
  if(!B||!vanHasPad(B))return null;
  if(!B.van){const s=hashi(B.sx*13+B.sy,(B.idx|0)+5,0xBA9)>>>0;B.van={n:s%VAN_NAMES.length,q:(s>>>4)%VAN_QUIRKS.length,tries:0};}
  return B.van;
}
function vanName(B){const v=vanOf(B);return v?VAN_NAMES[v.n%VAN_NAMES.length]:"";}
function vanQuirk(B){const v=vanOf(B);return v?VAN_QUIRKS[v.q%VAN_QUIRKS.length]:null;}
function vanLine(B){const v=vanOf(B);return v?"«"+vanName(B)+"» · "+vanQuirk(B).ru:"";}
/* единственная машина, которую можно переименовать — по кругу, без свободного текста */
function vanRename(B){
  const v=vanOf(B);if(!v)return "";
  const was=vanName(B);v.n=(v.n+1)%VAN_NAMES.length;
  const n=(typeof baseShift==="function")?baseShift():0;
  baseLog(B,"vanren",n,{was,who:vanName(B)});
  logAdd("dim","База «"+B.name+"»: машина теперь «"+vanName(B)+"» (была «"+was+"»)");
  return vanName(B);
}
/* переброска с площадки: «не заводится с первого раза» — каждая третья требует второго нажатия */
function vanStart(B){
  const v=vanOf(B);if(!v)return true;
  v.tries=(v.tries|0)+1;
  if(vanQuirk(B).id==="start"&&(v.tries%3)===1){
    say("«"+vanName(B)+"» не завелась\nещё раз",100);sfx("ui",{f:160,to:90,d:.3,v:.3});
    return false;
  }
  return true;
}
/* смена: раз в двенадцать — строка о причуде. Зовёт baseShiftRun */
function vanStep(B,n){
  const v=vanOf(B);if(!v||(n%VAN_SAY)!==0)return 0;
  const q=vanQuirk(B);
  baseLog(B,"van",n,{who:vanName(B),what:q.ru,how:VAN_HOW[q.id]});
  return 1;
}
