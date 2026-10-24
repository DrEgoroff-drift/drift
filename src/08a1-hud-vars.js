/* ══════════════ переменные раскладки HUD — на своих читателях (24.10, телефон) ══════════════ */
/* Своя переменная, записанная в стиль корня или <body>, пересчитывает стиль всей страницы: она наследуется, и
   браузер перебирает каждый узел (S23: 134 узла, 5,5–9 мс за пересчёт; кадр смены режима платил два-три таких,
   тестер, раунд 16; --helmlift так писалась на каждом пикселе хода пальца по штурвалу). Читают эти переменные
   считанные плашки, поэтому значение кладётся в стиль каждого читателя — пересчёт только их поддеревьев (ПК: запись
   с чтением рамки 0,2 мс → ~0). Список читателей сверяет с таблицей стилей тест 91qd6; плашка, созданная позже
   (адрес карты, оклик, «Сорока», добыча), берёт значения при рождении — hudVarsOn */
const HUDV_SEL={
  "--padsh":"#console,.rail,#prompt,#launchbtn,#sos,#hailwin,#gotwin,.wanwin",
  "--railw":"#prompt,.wanwin,#mapaddr",
  "--hudband":".rail,#menu,#mapaddr",
  "--conx":"#console",
  "--mapbar":"#msg",
  "--rackbot":"#msg",
  "--helmlift":"#prompt,#console"};
const HUDV={};
function hudVar(k,v){
  v=String(v);if(HUDV[k]===v)return;HUDV[k]=v;
  for(const e of document.querySelectorAll(HUDV_SEL[k]))e.style.setProperty(k,v);
}
function hudVarsOn(e){for(const k in HUDV)if(e.matches(HUDV_SEL[k]))e.style.setProperty(k,HUDV[k]);return e;}
/* padsFit (15-input) кладёт --padsh в корень сам: запись корня этими именами уходит к читателям, прочие — как были */
{const RS=document.documentElement.style,own=RS.setProperty;
 RS.setProperty=function(k,v,p){
   if(HUDV_SEL[k])return hudVar(k,v);
   const f=Object.getPrototypeOf(this).setProperty||own;return f.call(this,k,v,p);};}
