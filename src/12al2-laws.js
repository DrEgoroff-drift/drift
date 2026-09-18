/* ══════════════ закон земли — по одному, только озвученные (M456, review §1.5) ══════════════
   У каждой державы одно правило, и оно звучит, когда касается вас:
   • ГЛАВТРАССА — НОРМА: первые двадцать единиц топлива за стыковку — по
     кредиту, «по норме»; дальше — по обычной цене;
   • Компания — ПОШЛИНА: стыковка 40 кр («сбор за оформление»), с попутчиком-
     спонсором на борту — бесплатно;
   • Орднунг — СКОРОСТНОЙ РЕЖИМ в нумерованном кольце у станции: быстрее
     метки ближе шестисот — штраф с номером параграфа, раз за подход;
   • Коммуна — ОБЕД: час по игровым суткам станция не продаёт и не берёт
     части; топливо продают всегда («топливо — не обед»);
   • Рассвет — «сделаем из ваших» и Хай-Фронт — рейтинг доверия: пока без
     правила (рейтинг вырезан ревью).
   Хозяин — земли под кораблём сейчас (stampOwnerAt). */
const LAW_NORM=20,LAW_FEE=40,LAW_RING=600,LAW_SPEED=4.5,LAW_FINE=15;
let LAW_NORM_LEFT=0,LAW_RING_KEY="";
function lawOwner(){return (typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;}
/* стыковка: норма заново, пошлина у Компании */
function lawDock(){
  const by=lawOwner();
  LAW_NORM_LEFT=by==="gt"?LAW_NORM:0;
  if(by==="co"){
    const sponsor=!!(typeof expAll==="function"&&expAll().pax);   /* попутчик экспедиции (11x) — спонсор */
    if(sponsor){logAdd("money","Компания: пошлина за стыковку — 0 кр (спонсор на борту™)");return;}
    const fee=Math.min(LAW_FEE,G.credits|0);
    G.credits-=fee;
    logAdd("money","Компания: сбор за оформление стыковки — "+fee+" кр · спасибо за выбор");
  }
}
/* заправка по норме: сколько единиц из need идут по кредиту */
function lawNormTake(need){
  if(lawOwner()!=="gt"||LAW_NORM_LEFT<=0)return 0;
  const n=Math.min(need,LAW_NORM_LEFT);LAW_NORM_LEFT-=n;
  if(n>0)logAdd("money","ГЛАВТРАССА: "+n+" ед. топлива по норме — по 1 кр");
  return n;
}
/* обед Коммуны: час в игровых сутках (13:00–14:00) */
function lawLunch(){
  if(lawOwner()!=="km")return false;
  const h=Math.floor(((G.t%CEL_DAY)/CEL_DAY)*24);
  return h===13;
}
/* скоростной режим Орднунга: в кольце у станции — метка скорости */
function lawRingTick(sh){
  if(lawOwner()!=="or"||!G.sys||!G.sys.station)return;
  const S=G.sys.station,d=Math.hypot(sh.x-S.x,sh.y-S.y),v=Math.hypot(sh.vx,sh.vy);
  const key=G.sx+","+G.sy+","+Math.floor(G.t/3600);
  if(d>LAW_RING){return;}
  if(v>LAW_SPEED&&LAW_RING_KEY!==key){
    LAW_RING_KEY=key;
    const par="§ "+(10+(hashi(G.sx,G.sy,0x0D12)%30))+"."+(1+(G.t|0)%9);
    const fine=Math.min(LAW_FINE,G.credits|0);G.credits-=fine;
    logAdd("warn","Орднунг: превышение в кольце станции ("+v.toFixed(1)+" при норме "+LAW_SPEED+") · "+par+" · штраф "+fine+" кр · экз. 1 из 3");
    say("ШТРАФ · "+par+"\nскоростной режим в кольце станции",120);
  }
}
