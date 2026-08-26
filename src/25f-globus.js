/* ══════════════ «Глобус» — указатель места полёта ══════════════

   Латунь, толстое стекло с фаской, шар в окошке. Раз в секунду в приборе
   щёлкает, и шар поворачивается на волосок.

   Он показывает две вещи:
     · где ты сейчас — стрелка курса;
     · **где сядешь, если затормозить прямо сейчас** — вторая стрелка.

   ── Откуда он взялся ──

   Не выдуман. У настоящих кораблей стоял навигационный индикатор «Глобус»
   (ИМП, позже ИНК): электромеханическая аналоговая машина из шестерён,
   кулачков и дифференциалов, два соленоида с храповиком, двадцать семь вольт,
   один импульс в секунду. Он крутил настоящий глобус в окошке и отвечал ровно
   на эти два вопроса.

   Лучшего прибора для этой игры не придумать, и придумывать не надо:

   · **он не говорит** — ровно по правилу мира (25a): ни писка, ни цветовой
     тревоги, ни строки в журнале. Он просто показывает, а замечает игрок;
   · **он механический** — четвёртый слой износа ложится на него сам: затёртое
     стекло, чужой ободок, подклеенная шкала;
   · и главное — это тема, отлитая в железе. Всю игру перед человеком стоит
     прибор, который раз в секунду отвечает на вопрос «а где я окажусь, если
     брошу всё сейчас», и в половине случаев показывает пустое место.

   ── Чего он не делает ──

   Не подсказывает маршрут, не ведёт к цели, не подсвечивает найденное. Он
   считает баллистику по нынешней скорости и всё. Планеты при этом идут по
   орбитам, а луч летит прямо — прибор честно врёт настолько, насколько врал бы
   железный: он отвечает на «если СЕЙЧАС», а не на «если полетишь туда».

   ── Звука нет ──

   Книга говорит, что он щёлкает. В игре щелчок раз в секунду на всё время
   полёта — это не характер, это раздражитель, и правило файла приборов
   («ни звука») сильнее красивой детали. Щелчок сделан видимым: шар
   поворачивается рывком раз в секунду, а не плывёт. */

/* Шаг луча и предел: 225 проб на всю систему, и те раз в секунду, а не в кадр. */
const GLOB_STEP=40, GLOB_FAR=9000;
const GLOB={t:-1, aim:null, turn:0};

/* ── куда придёшь, если ничего не делать ──
   Луч по нынешней скорости до первого тела. Стоим — показывать нечего, и это
   тоже показание: стрелка ложится на упор. */
function globusAim(){
  if(!G.sys||!G.ship)return null;
  const vx=G.ship.vx||0, vy=G.ship.vy||0;
  const sp=Math.hypot(vx,vy);
  if(sp<.05)return null;
  const ux=vx/sp, uy=vy/sp;
  let px=G.ship.x||0, py=G.ship.y||0;
  const S=G.sys.station, R0=G.sys.radius||60;
  for(let d=0;d<GLOB_FAR;d+=GLOB_STEP){
    px+=ux*GLOB_STEP; py+=uy*GLOB_STEP;
    if(Math.hypot(px,py)<R0)return {ru:(typeof nameOf==="function"?nameOf(G.sys):G.sys.name),kind:"star",d};
    for(const p of G.sys.planets){
      if(Math.hypot(px-p.x,py-p.y)<p.radius)return {ru:p.name,kind:"planet",d};
      for(const m of p.moons)
        if(Math.hypot(px-m.x,py-m.y)<m.radius)return {ru:m.name,kind:"moon",d};
    }
    if(S&&Math.hypot(px-S.x,py-S.y)<70)return {ru:S.name,kind:"station",d};
  }
  return null;
}
/* Раз в секунду, а не в кадр: и дёшево, и по существу прибора. */
function globusTick(){
  const s=Math.floor((typeof performance!=="undefined"?performance.now():Date.now())/1000);
  if(s===GLOB.t)return GLOB.aim;
  GLOB.t=s;
  GLOB.turn=(GLOB.turn+.055)%(Math.PI*2);   // шар повернулся на волосок
  GLOB.aim=globusAim();
  return GLOB.aim;
}
/* ── рисование ──
   Материал тот же, что у стойки: латунь, стекло, тонкая гравировка. Ни одной
   заливки ярче ободка — прибор не привлекает внимания, он стоит. */
function globusDraw(c,cx,cy,r){
  const aim=globusTick();
  c.save();
  /* корпус */
  c.beginPath();c.arc(cx,cy,r,0,TAU);
  c.fillStyle="#231f18";c.fill();
  c.lineWidth=Math.max(1.4,r*.055);
  c.strokeStyle="#8a7746";c.stroke();
  c.beginPath();c.arc(cx,cy,r*.88,0,TAU);
  c.lineWidth=1;c.strokeStyle="rgba(190,168,110,.45)";c.stroke();
  /* деления по ободку */
  c.strokeStyle="rgba(190,168,110,.55)";c.lineWidth=1;
  for(let i=0;i<12;i++){
    const a=i/12*TAU, l=(i%3===0)?r*.10:r*.06;
    c.beginPath();
    c.moveTo(cx+Math.cos(a)*r*.88,cy+Math.sin(a)*r*.88);
    c.lineTo(cx+Math.cos(a)*(r*.88-l),cy+Math.sin(a)*(r*.88-l));
    c.stroke();
  }
  /* шар: два эллипса и меридиан, повёрнутые на GLOB.turn */
  const gr=r*.54;
  c.beginPath();c.arc(cx,cy,gr,0,TAU);
  c.fillStyle="#2b3a40";c.fill();
  c.strokeStyle="rgba(150,190,200,.35)";c.lineWidth=1;
  c.beginPath();c.ellipse(cx,cy,gr,gr*.34,0,0,TAU);c.stroke();
  c.beginPath();c.ellipse(cx,cy,gr,gr*.72,0,0,TAU);c.stroke();
  const mw=Math.abs(Math.cos(GLOB.turn))*gr;
  c.beginPath();c.ellipse(cx,cy,Math.max(1,mw),gr,0,0,TAU);c.stroke();
  c.beginPath();c.moveTo(cx,cy-gr);c.lineTo(cx,cy+gr);c.stroke();
  /* стрелка курса */
  const ha=Math.atan2(G.ship?(G.ship.vy||0):0,G.ship?(G.ship.vx||0):0);
  c.strokeStyle="rgba(226,214,186,.92)";c.lineWidth=Math.max(1.6,r*.05);
  c.lineCap="round";
  c.beginPath();c.moveTo(cx,cy);
  c.lineTo(cx+Math.cos(ha)*r*.74,cy+Math.sin(ha)*r*.74);c.stroke();
  /* ── расчётная точка ──
     Сперва я сделал её второй стрелкой — и это была ошибка замысла: луч летит
     прямо, значит угол на цель РАВЕН курсу, и вторая стрелка всегда ложилась
     ровно на первую. Показывать надо не направление, а насколько далеко: метка
     ползёт по линии курса от оси к ободу по мере того, как цель дальше. Нет
     цели — метки нет вовсе, и пустая линия курса это и есть «пустое место». */
  if(aim){
    const t=clamp(aim.d/GLOB_FAR,0,1);
    const mx=cx+Math.cos(ha)*r*(.14+t*.60), my=cy+Math.sin(ha)*r*(.14+t*.60);
    c.beginPath();c.arc(mx,my,Math.max(2.2,r*.055),0,TAU);
    c.fillStyle="rgba(196,105,74,.95)";c.fill();
    c.beginPath();c.arc(mx,my,Math.max(4,r*.10),0,TAU);
    c.strokeStyle="rgba(196,105,74,.45)";c.lineWidth=1;c.stroke();
  }
  /* ось */
  c.beginPath();c.arc(cx,cy,Math.max(1.6,r*.05),0,TAU);
  c.fillStyle="#c8b98a";c.fill();
  /* подпись: только имя того, во что упрёшься, и ничего больше */
  c.textAlign="center";c.font=Math.round(Math.max(8,r*.15))+"px ui-monospace,monospace";
  c.fillStyle="rgba(190,168,110,.75)";
  c.fillText("ГЛОБУС",cx,cy+r+Math.max(11,r*.20));
  c.fillStyle=aim?"rgba(214,166,89,.95)":"rgba(120,110,92,.7)";
  c.fillText(aim?aim.ru.toUpperCase():"— — —",cx,cy+r+Math.max(23,r*.38));
  c.restore();
}
