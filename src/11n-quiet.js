/* ══════════════ тихий уезд: где время не копится ══════════════
   M142-quiet. Зажиточный, ухоженный сельский уезд (06c, `quiet`, игла приёмника).
   По-настоящему приятный; первые часы там — отдых. Пилоты советуют его друг
   другу. На окраине никто не грабит, машины не ломаются, бумаг не спрашивают.

   ЯДРО — КОЛОНИЯ, КОТОРАЯ НИЧЕГО НЕ СКРЫВАЕТ. «Да, никто из нас не помнит,
   зачем прилетел. Перестало быть важным». Ни гипноза, ни секты, ни злодея:
   детектив отвергнут намеренно — «идеальное = зловещее» игрок решает за две
   минуты и дальше ждёт развязки.
   ЦЕНА МЕХАНИЧЕСКАЯ. Там бортжурнал перестаёт писать, самописец чертит ровную
   линию, а на отлёте прошло заметно больше суток, чем вы прожили: топливо
   ушло, урожай в других местах созрел. Ничего не отняли. Время там просто
   не копится.
   ПРЕДЛОЖЕНИЕ ОСТАТЬСЯ искренне и НЕ ОТЗЫВАЕТСЯ НИКОГДА. Открытая дверь и есть
   содержание; другой концовки нет.

   ПРАВИЛА ФАЙЛА:
   1. Ни угрозы, ни разгадки. Только быт и счёт суток.
   2. Хранится G.quiet={stay}: сказали ли вы «да». Всё прочее — от координат. */

function quietAll(){return (G.quiet||(G.quiet={stay:0}));}
function quietDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="quiet")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function quietDepthHere(){return quietDepthAt(G.sx,G.sy);}
/* окраина: пиратов нет, машины не ломаются */
function quietNoPirates(){return quietDepthHere()>0;}
function quietNoWear(){return quietDepthHere()>0;}
/* ядро: журнал молчит и самописец ровный — пока вы там, в любом режиме */
function quietMute(){return quietDepthHere()===2;}
function quietDock(){
  if(quietDepthHere()!==2)return null;
  const line=quietAll().stay?"С возвращением. Дверь открыта.":"Да, никто из нас не помнит, зачем прилетел. Перестало быть важным. Оставайтесь, если хотите.";
  return {line};
}
function quietStay(){
  const Q=quietAll();
  if(Q.stay)return false;
  Q.stay=1;
  return true;
}
/* отлёт из ядра: прошло больше, чем прожито. Зовётся из jump() до смены сектора */
function quietLeave(){
  if(quietDepthHere()!==2)return 0;
  const days=3+hashi(G.sx,G.sy,((G.odo&&G.odo.jumps)|0))%5;
  G.t+=CEL_DAY*days;
  G.fuel=Math.max(0,G.fuel-Math.round(G.fuel*.15));
  G.quietGone=days;                           /* строка пишется уже снаружи, журнал там не пишет */
  return days;
}
function quietAfterLeave(){
  if(!G.quietGone)return;
  logAdd("dim","Прошло "+G.quietGone+" суток. Топлива меньше, чем помнится. Ничего не отняли.");
  G.quietGone=0;
}
/* блок в кантине ядра: открытая дверь — и она не закрывается */
function quietBlock(){
  if(quietDepthHere()!==2)return;
  const Q=quietAll();
  $body.appendChild(el("div","sec","КОЛОНИЯ"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Остаться</b><s>"+(Q.stay?"вы сказали «да». Дверь открыта, и она не закроется.":"предложение искреннее. Его не отзовут — ни сейчас, ни после.")+"</s>"));
  if(!Q.stay){const b=el("button","act sm","ОСТАТЬСЯ");b.onclick=()=>{quietStay();renderTab();};r.appendChild(b);}
  $body.appendChild(r);
}
