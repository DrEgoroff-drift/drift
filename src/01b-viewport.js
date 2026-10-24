/* ── размер окна на кадр отрисовки (24.10, телефон) ──
   Чтение innerWidth/innerHeight в Chrome заставляет сверстать страницу заново, если в этом кадре уже писали в DOM.
   Интерфейс спрашивал размер ПОСЛЕ своих записей: hud — классом «mobile» каждый кадр, зал — hallWide() и размер
   холста в своём цикле. Телефон верстал страницу по нескольку раз за кадр (замер тестировщика: 30–60 мс в секунду
   только на этом). Теперь размер снимается один раз на кадр, первым же вызовом: у всех колбэков rAF одного кадра
   одна метка времени, а размер окна внутри кадра не меняется (resize приходит до колбэков). Вне колбэков кадра
   (нажатия, таймеры, тесты) viewW/viewH читают окно, как прежде. */
const VIEWP={w:0,h:0,t:NaN,d:0};
function viewRead(){VIEWP.w=typeof innerWidth==="number"?innerWidth:1280;VIEWP.h=typeof innerHeight==="number"?innerHeight:800;}
/* вход в колбэк кадра: t — метка rAF; NaN — снять заново (стенды зовут frameBody сами) */
function viewIn(t){if(!(t===VIEWP.t)){viewRead();VIEWP.t=t;}VIEWP.d++;}
function viewOut(){if(VIEWP.d>0)VIEWP.d--;}
function viewW(){return VIEWP.d?VIEWP.w:(typeof innerWidth==="number"?innerWidth:1280);}
function viewH(){return VIEWP.d?VIEWP.h:(typeof innerHeight==="number"?innerHeight:800);}
try{addEventListener("resize",()=>{VIEWP.t=NaN;VIEWP.d=0;});}catch(e){}
