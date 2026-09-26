/* ══════════════ шесть железных дорог (M474, DESIGN-metro §6) ══════════════
   Одна сеть, шесть манер её держать — по хозяину земли станции:
     ГЛАВТРАССА — жетон и дешевле всех (как есть);
     Компания   — EXPRESS™: та же линия без остановок, ×10 к цене, реклама под
                  ценой «на три секунды быстрее!» — и правда на три;
     Орднунг    — садят только с задекларированным трюмом: «ДЕКЛАРИРУЮ» — и
                  второе нажатие; двери по секундомеру;
     Коммуна    — касса закрыта в обед и в день забастовки;
     Рассвет    — маршрутка «до куда?»: остановит где скажете, хоть между
                  станциями, у любой звезды (M474);
     Хай-Фронт  — «обновление установлено»: иногда линия стоит минуту.
   Хозяин — земли, где станция отправления (stampOwnerAt). */
const RAIL_EXPRESS_MUL=10,RAIL_HF_PAUSE=60;
let RAIL_DECL="";
function railOwner(){return (typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;}
/* остановка на фронте закрыта (M474, §6): поезд проходит без остановки, касса
   её не продаёт; если фронт — здесь, закрыт весь вестибюль */
function railFrontShut(st){return typeof chronFront==="function"&&!!chronFront(st.sx,st.sy);}
/* перегон перерезан (M510, §6): оба его конца на фронте — война идёт вдоль
   самой линии, рельс нет. Касса не продаёт сквозь него, поезд до него не
   доходит, на схеме — красный разрыв */
function railCut(a,b){return railFrontShut(a)&&railFrontShut(b);}
function railNextIdx(l,i,dir){const n=l.stops.length;return l.loop?(((i+dir)%n)+n)%n:i+dir;}
/* Коммуна: касса закрыта — почему; null — открыта */
function railClosedWhy(){
  if(railFrontShut({sx:G.sx,sy:G.sy}))return "ФРОНТ · ОСТАНОВКА ЗАКРЫТА";
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
/* ── маршрутка Рассвета: «водитель, остановите здесь» (M474) ──
   На перегоне тап по ДЕЙСТВИЮ — маршрутка встаёт у ближайшей звезды, какая
   есть рядом с дорогой, станция там или нет; дальше сами. Зажимать пэд в
   маршрутке бесполезно: она не электричка */
function railBusDrop(){
  const R=RAIL_RIDE;if(!R||!R.bus||R.phase!=="go")return false;
  const p=railTrainPos(),o=R.l.stops[R.seq[R.seg]];let best=null,bd=1e9;   /* там, откуда отошли, — не встаёт */
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const sx=Math.round(p.x)+dx,sy=Math.round(p.y)+dy,d=Math.hypot(sx-p.x,sy-p.y);
    if(d<bd&&!(sx===o.sx&&sy===o.sy)&&starAt(sx,sy)){best={sx,sy};bd=d;}
  }
  if(!best)return false;
  RAIL_RIDE=null;
  arriveSystem(best.sx,best.sy,{rail:true});
  RAIL_ARRIVE=G.t;
  const nm=getSystem(best.sx,best.sy).name;
  say("«Здесь, у "+nm+"?» — «Здесь.»\nмаршрутка ушла · дальше сами",150);
  logAdd("dim","Маршрутка Рассвета высадила у «"+nm+"» · сектор "+best.sx+":"+best.sy+" · «кому надо — тому по пути»");
  return true;
}
/* EXPRESS™ на схеме: перегоны, оба конца которых в земле Компании, — синим
   пунктиром поверх линии: там ходит экспресс «на три секунды быстрее» */
function railExpressDraw(g,X,Y){
  const N=railNet();g.save();g.strokeStyle="rgba(47,111,208,.85)";g.lineWidth=1.2;g.setLineDash([2,3]);
  for(const l of N.lines)for(let i=0;i+1<l.stops.length;i++){
    const a=l.stops[i],b=l.stops[i+1];
    if(railOwnerAt(a)!=="co"||railOwnerAt(b)!=="co")continue;
    const dx=b.sx-a.sx,dy=b.sy-a.sy,L=Math.hypot(dx,dy)||1,ox=-dy/L*3,oy=dx/L*3;
    g.beginPath();g.moveTo(X(a.sx)+ox,Y(a.sy)+oy);g.lineTo(X(b.sx)+ox,Y(b.sy)+oy);g.stroke();
  }
  g.restore();
}
