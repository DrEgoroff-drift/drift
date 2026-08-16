/* ══════════════ собранный отчёт: их съёмка поверх вашей карты ══════════════
   Последняя веха прохода и нарочно дешёвая: всё, что ей нужно, уже построено.

   До неё сто кусков (12q-lore) были ста отдельными полезностями — адрес, цены,
   слово, замеры. Здесь они перестают быть россыпью: каждый добытый кусок ставит
   на карту ТУ ТОЧКУ, которую в этом месте засняли люди «Долгого Хода», а
   прочитанная глава соединяет свои точки ногой их маршрута. Получается их
   съёмка, нарисованная их же значками поверх вашей карты, — и на ней есть
   места, где вы никогда не были.

   ПРАВИЛА:
   1. Слой показывает РОВНО то, что заработано. Ни одной точки авансом: нет
      куска — нет и засечки. Это то же правило, по которому живут глифы посёлка.
   2. Точки не зависят ни от игрока, ни от его положения: съёмка снята задолго
      до него. Сектор точки — чистая функция от seed куска.
   3. Экрана с истиной нет и не будет. Награда — слой, посёлок, который жив, и
      слова, которые теперь читаются. Если концовке нужен абзац, проход не удался.
   4. Проход проходится и без M114: слой не спрашивает, вывезли ли кого-нибудь. */
const SURV_R=13;                 // радиус съёмки в секторах: их плечо, не ваш круг
function surveyPoint(R){
  if(!R)return null;
  if(R._pt!==undefined)return R._pt;             // считаем один раз на кусок
  const r=rng(hashi(R.seed,0x5C0B,17));
  let out=null;
  for(let i=0;i<80;i++){
    const a=r()*TAU,d=2+r()*SURV_R;
    const sx=Math.round(Math.cos(a)*d),sy=Math.round(Math.sin(a)*d);
    if(!starAt(sx,sy))continue;
    out={sx,sy,id:R.id,chap:R.chap,chapRu:R.chapRu};
    break;
  }
  R._pt=out;
  return out;
}
/* съёмка = точки заработанных кусков. Порядок — тот, в каком игрок их нашёл:
   это его отчёт, и у каждого он свой. */
function surveyList(){
  const out=[];
  for(const id of loreList()){
    const R=LORE_BY_ID[id];if(!R)continue;
    const p=surveyPoint(R);
    if(p)out.push(p);
  }
  return out;
}
/* нога маршрута: соединяются только точки ПРОЧИТАННОЙ главы — пока глава не
   сложилась, это отдельные засечки, а не путь */
function surveyLegs(){
  const legs=[];
  for(const C of LORE_CHAP){
    if(!loreChapter(C.id).read)continue;
    const pts=surveyList().filter(p=>p.chap===C.id);
    for(let i=1;i<pts.length;i++)legs.push([pts[i-1],pts[i],C.id]);
  }
  return legs;
}
const SURV_COL=["#e0d28a","#7fe6d8","#9fd8ff","#ff9d7a","#c58ae0","#8fd08a","#f2b25c","#c8f0ff"];
function surveyColor(chap){return SURV_COL[(LORE_CHAP_IX[chap]|0)%SURV_COL.length];}
/* ── рисование ──
   Их значок — не кольцо-засечка (это метка адреса, 12q) и не звезда: короткий
   крест с чертой, как режут по камню. Чужая рука на вашем листе должна читаться
   чужой с одного взгляда. */
function drawSurvey(cell){
  const pts=surveyList();
  if(!pts.length)return;
  const cx=W/2,cy=H/2;
  const at=p=>[cx+(p.sx-G.sx)*cell,cy+(p.sy-G.sy)*cell];
  ctx.save();
  /* сперва ноги маршрута — они уходят под значки */
  for(const [a,b,chap] of surveyLegs()){
    const [x1,y1]=at(a),[x2,y2]=at(b);
    ctx.strokeStyle=hexa(surveyColor(chap),.20);
    ctx.lineWidth=1;ctx.setLineDash([5,4]);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  ctx.setLineDash([]);
  for(const p of pts){
    const [x,y]=at(p);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    const col=surveyColor(p.chap);
    ctx.strokeStyle=hexa(col,.45);ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);
    ctx.moveTo(x+4,y-4);ctx.lineTo(x-4,y+4);
    ctx.moveTo(x-6,y+6.5);ctx.lineTo(x+6,y+6.5);       // черта под крестом: их подпись
    ctx.stroke();
  }
  ctx.restore();
}
/* цвет с прозрачностью из hex: своя короткая, чтобы не тащить сюда палитру */
function hexa(h,a){
  const n=parseInt(h.slice(1),16);
  return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";
}
/* ── полка в кабинете (M100) ──
   Не вторая сотня ячеек: стена-музей считает редкости, а полка под ней —
   отчёт, сложенный в том порядке, в каком его нашёл ЭТОТ игрок. Поэтому у
   каждого прохождения она своя, и никакого текста на ней нет. */
function drawAccountShelf(c,x0,fy,wall){
  const list=loreList();
  if(!list.length)return;
  const y=fy-46;
  c.fillStyle="rgba(0,0,0,.45)";c.fillRect(x0+5,y+4,46,1.6);   // сама полка
  c.fillStyle="rgba(255,255,255,.07)";c.fillRect(x0+5,y+4,46,.6);
  const n=Math.min(list.length,46);
  for(let i=0;i<n;i++){
    const R=LORE_BY_ID[list[i]];if(!R)continue;
    const base=hex2rgb(surveyColor(R.chap));
    /* планки стоят корешками, как папки: цвет приглушён к стене, иначе полка
       перекрикивает стену-музей над ней */
    const col=mixc(base,wall,.5);
    const h=3+((R.seed>>>4)%3);
    c.fillStyle=rgba(col,.85);c.fillRect(x0+5.5+i,y+4-h,.8,h);
  }
}
