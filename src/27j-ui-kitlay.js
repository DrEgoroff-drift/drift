/* ══════════════ комплект, разложенный на столе ══════════════
   M216, хвост M179. Трюм лёг на стол кучами (`27j-ui-hold`), и это ровно та
   раскладка, которую просил автор: видно, чего сколько, без единой цифры. А
   комплект остался КУКЛОЙ на экране корабля — манекеном, на котором всё уже
   надето. M179 записал это себе в долг одной строкой: «комплект вещами на том
   же столе».

   ЧЕМ РАСКЛАДКА ОТЛИЧАЕТСЯ ОТ КУКЛЫ, и почему это не украшение. Кукла
   отвечает на вопрос «как я выгляжу»; разложенные вещи отвечают на «что у
   меня есть». Второй вопрос и есть инвентарный, и на него куклой отвечать
   неудобно: у манекена ботинки под корпусом, ранец за спиной, перчатки
   сливаются с рукавами — то есть половина комплекта не видна ровно потому,
   что она надета. На столе всё лежит рядом и целиком.

   ОДНА КАНВА, А НЕ ШЕСТЬ КАРТОЧЕК. Трюм даёт по карточке на ресурс, потому
   что ресурсы независимы: сегодня их три вида, завтра восемь. Комплект — это
   всегда одни и те же шесть мест, и он ОДНА вещь, разобранная на части.
   Шесть карточек читались бы шестью не связанными предметами; одна раскладка
   читается снаряжением одного человека, приготовленным к выходу.

   ПРАВИЛА ФАЙЛА:
   1. Рисует и ничего не меняет: читает `kitAll()` и `kitPalette()`.
   2. Ни одного своего цвета — тон вещи приходит из `kitColOf` (модель, слой
      износа), тот же, которым красится и кукла, и ходок на грунте.
   3. Форма выведена из класса и износа, а не из вкуса: класс делает вещь
      крупнее и добавляет ей деталь, износ — потёртости и заплаты. */

/* места на сукне: как вещи и правда кладут — шлем и фонарь сверху, корпус в
   середине, перчатки по бокам от него, ботинки внизу, ранец слева от корпуса.
   Доли от размера канвы, поэтому раскладка не ломается на телефоне. */
const KITLAY=[
  {p:"pack",  x:.17,y:.50,s:1.05},
  {p:"helmet",x:.50,y:.20,s:.92},
  {p:"lamp",  x:.79,y:.19,s:.60},
  {p:"torso", x:.50,y:.55,s:1.25},
  {p:"gloves",x:.82,y:.53,s:.72},
  {p:"boots", x:.50,y:.86,s:.86}
];
/* мягкая тень под вещью: она лежит, а не висит. Одна на все шесть — общий
   свет, как и во всех сборках «Дрейфа» */
function kitLayShadow(c,s){
  /* тень МЕНЬШЕ вещи, а не шире её: на первом снимке эллипсы выходили крупнее
     самих предметов и читались отдельными серыми пятнами — будто вещи висят
     над своими кляксами, а не лежат на сукне */
  c.fillStyle="rgba(0,0,0,.16)";
  c.beginPath();c.ellipse(0,s*.40,s*.30,s*.075,0,0,TAU);c.fill();
}
/* потёртости и заплаты: износ виден на вещи, а не подписан числом */
function kitLayWear(c,x,s){
  if(x.wear===0)return;
  const r=rng(hashi(x.seed|0,x.p.length*31,0x4B17));
  if(x.wear===1||x.wear===3){                       /* ношеный и чужой — потёртости */
    c.strokeStyle="rgba(0,0,0,.26)";c.lineWidth=Math.max(1,s*.03);
    for(let i=0;i<4;i++){
      const a=r()*TAU, d=s*(.12+r()*.26), l=s*(.10+r()*.16);
      c.beginPath();
      c.moveTo(Math.cos(a)*d,Math.sin(a)*d*.8);
      c.lineTo(Math.cos(a)*d+l*.7,Math.sin(a)*d*.8+l*.3);
      c.stroke();
    }
  }
  if(x.wear===2){                                    /* латаный — заплаты */
    for(let i=0;i<2;i++){
      const a=r()*TAU, d=s*(.14+r()*.2), q=s*(.12+r()*.08);
      c.fillStyle="rgba(150,140,120,.55)";
      c.fillRect(Math.cos(a)*d-q/2,Math.sin(a)*d*.8-q/2,q,q);
      c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=1;
      c.strokeRect(Math.cos(a)*d-q/2,Math.sin(a)*d*.8-q/2,q,q);
    }
  }
}
/* одна вещь в точке (0,0). Форма грубая нарочно — это вещь на сукне, а не
   значок: у неё есть низ, блик сверху и тень рядом (тот же язык, что у куч) */
function kitLayPiece(c,x,s,col){
  const cls=clamp(x.cls|0,1,3);
  const hi="rgba(255,255,255,.22)";
  kitLayShadow(c,s);
  c.fillStyle=col.main;
  if(x.p==="helmet"){
    c.beginPath();c.arc(0,0,s*.46,Math.PI,TAU);c.fill();
    c.fillRect(-s*.46,0,s*.92,s*.16);
    /* забрало: у ношеного мутное, у нового чистое */
    c.fillStyle=x.wear===1?"rgba(120,140,150,.65)":"rgba(150,196,214,.75)";
    c.beginPath();c.ellipse(0,-s*.06,s*.33,s*.22,0,0,TAU);c.fill();
    c.fillStyle=hi;
    c.beginPath();c.ellipse(-s*.12,-s*.14,s*.11,s*.06,-.5,0,TAU);c.fill();
  }else if(x.p==="torso"){
    /* корпус лежит лицом вверх: плечи, ворот, а у старших классов — нагрудник */
    c.beginPath();
    c.moveTo(-s*.44,-s*.30);c.lineTo(-s*.30,-s*.42);c.lineTo(s*.30,-s*.42);
    c.lineTo(s*.44,-s*.30);c.lineTo(s*.34,s*.42);c.lineTo(-s*.34,s*.42);
    c.closePath();c.fill();
    c.fillStyle=col.dark;
    c.beginPath();c.ellipse(0,-s*.34,s*.15,s*.07,0,0,TAU);c.fill();     /* ворот */
    if(cls>1){c.fillStyle=col.acc;c.fillRect(-s*.20,-s*.10,s*.40,s*.14);}
    if(cls>2){c.fillStyle=col.dark;c.fillRect(-s*.30,s*.10,s*.60,s*.06);}
    c.fillStyle=hi;c.fillRect(-s*.30,-s*.36,s*.10,s*.62);
  }else if(x.p==="gloves"){
    /* две перчатки рядом, вторая чуть повёрнута — пара, а не один предмет */
    for(const sg of [-1,1]){
      c.save();c.translate(sg*s*.24,0);c.rotate(sg*.22);
      c.fillStyle=col.main;
      c.beginPath();c.roundRect(-s*.16,-s*.30,s*.32,s*.52,s*.10);c.fill();
      c.fillStyle=col.dark;c.fillRect(-s*.16,s*.10,s*.32,s*.08);      /* обшлаг */
      c.restore();
    }
    c.fillStyle=hi;c.fillRect(-s*.36,-s*.26,s*.08,s*.30);
  }else if(x.p==="boots"){
    for(const sb of [-1,1]){
      c.save();c.translate(sb*s*.26,0);
      c.fillStyle=col.main;
      c.beginPath();
      c.moveTo(-s*.16,-s*.32);c.lineTo(s*.16,-s*.32);c.lineTo(s*.16,s*.10);
      c.lineTo(s*.30*sb,s*.28);c.lineTo(-s*.16,s*.28);
      c.closePath();c.fill();
      c.fillStyle=col.dark;c.fillRect(-s*.18,s*.20,s*.44,s*.09);      /* подошва */
      c.restore();
    }
  }else if(x.p==="pack"){
    c.beginPath();c.roundRect(-s*.30,-s*.44,s*.60,s*.86,s*.09);c.fill();
    c.fillStyle=col.dark;
    c.fillRect(-s*.30,-s*.18,s*.60,s*.08);
    for(const sp of [-1,1])c.fillRect(sp*s*.16-s*.03,-s*.44,s*.06,s*.30);  /* лямки */
    if(cls>1){c.fillStyle=col.acc;c.beginPath();c.arc(0,s*.20,s*.09,0,TAU);c.fill();}
    c.fillStyle=hi;c.fillRect(-s*.26,-s*.40,s*.07,s*.72);
  }else{                                              /* фонарь */
    c.beginPath();c.roundRect(-s*.34,-s*.20,s*.50,s*.40,s*.07);c.fill();
    c.fillStyle="rgba(255,232,170,.92)";
    c.beginPath();c.ellipse(s*.20,0,s*.14,s*.20,0,0,TAU);c.fill();
    c.fillStyle=col.dark;c.fillRect(-s*.34,-s*.06,s*.50,s*.07);
    c.fillStyle=hi;c.fillRect(-s*.30,-s*.16,s*.06,s*.32);
  }
  kitLayWear(c,x,s);
}
/* вся раскладка на одну канву */
function kitLayDraw(c,w,h){
  c.clearRect(0,0,w,h);
  const K=kitAll(),P=kitPalette();
  const base=Math.min(w,h)*.34;
  for(const L of KITLAY){
    const x=K[L.p];if(!x)continue;
    /* класс делает вещь крупнее: старший комплект видно раскладкой, а не только
       подписью — то же правило, что у куч (сколько читается размером) */
    const s=base*L.s*(.86+clamp(x.cls|0,1,3)*.07);
    c.save();c.translate(w*L.x,h*L.y);
    kitLayPiece(c,x,s,P[L.p]);
    c.restore();
  }
}
