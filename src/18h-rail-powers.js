/* ══════════════ шесть железных дорог (M474, DESIGN-metro §6) ══════════════
   Одна сеть, шесть манер её держать — по хозяину земли станции:
     ГЛАВТРАССА — жетон и дешевле всех (как есть);
     Компания   — EXPRESS™: та же линия без остановок, ×10 к цене, реклама под
                  ценой «на три секунды быстрее!» — и правда на три;
     Орднунг    — садят только с задекларированным трюмом: «ДЕКЛАРИРУЮ» — и
                  второе нажатие; двери по секундомеру;
     Коммуна    — касса закрыта в обед и в день забастовки;
     Рассвет    — маршрутка «до куда?» (ещё нет — плановый хвост);
     Хай-Фронт  — «обновление установлено»: иногда линия стоит минуту.
   Хозяин — земли, где станция отправления (stampOwnerAt). */
const RAIL_EXPRESS_MUL=10,RAIL_HF_PAUSE=60;
let RAIL_DECL="";
function railOwner(){return (typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;}
/* Коммуна: касса закрыта — почему; null — открыта */
function railClosedWhy(){
  if(railOwner()!=="km")return null;
  if(typeof socStrikeHere==="function"&&socStrikeHere())return "ЗАБАСТОВКА · ПОЕЗДА СТОЯТ";
  if(typeof lawLunch==="function"&&lawLunch())return "ОБЕД · КАССА С 14:00";
  return null;
}
/* Орднунг: первое нажатие — декларация, второе — посадка */
function railDeclare(t){
  if(railOwner()!=="or")return true;
  if(typeof passportOn==="function"&&passportOn())return true;   /* паспорт: на вопрос меньше (M505) */
  const key=t.l.id+":"+t.i1;
  if(RAIL_DECL===key)return true;
  RAIL_DECL=key;
  const n=(typeof held==="function")?held():0;
  say("ДЕКЛАРИРУЮ: трюм "+n+" ед.\nнажмите ещё раз — посадка",140);
  logAdd("dim","Орднунг: декларация № "+(1000+hashi(G.sx,G.sy,(G.t|0)&1023)%9000)+" · трюм "+n+" ед. · экз. 1 из 3");
  return false;
}
/* Хай-Фронт: этот рейс постоит минуту? — по зерну рейса, примерно каждый третий */
function railHfPauseAt(R){
  if(R.hfDone||railOwnerAt(R.l.stops[R.seq[0]])!=="hf")return 0;
  return (hashi(R.seq[0],R.seq.length,(R.t0|0)&1023)%3===0)?RAIL_HF_PAUSE:0;
}
function railOwnerAt(st){return (typeof stampOwnerAt==="function")?stampOwnerAt(st.sx,st.sy):null;}
