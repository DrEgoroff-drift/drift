/* ══════════════ посёлок под рукой ══════════════
   M198. У посёлка (12t) до сих пор была одна связь с игроком: КОРМИТЬ. Что из
   этого вырастет, решали живущие, и это был весь замысел. Здесь появляется
   вторая, необратимая: взять посёлок под руку.

   ЧТО МЕНЯЕТСЯ, И ВСЁ ЭТО К ЛУЧШЕМУ ПО ЛЮБОМУ СЧЁТУ. Растёт быстрее. Строит
   то, что окупается, а не то, что взбрело. Амбар больше, отдают чаще и
   ровнее. Ни одна цифра не становится хуже.

   ЧТО ПРОПАДАЕТ, И ЭТОГО НЕТ НИ В ОДНОЙ ЦИФРЕ. Они перестают говорить
   глифами: словарь, который игрок собирал кусками отчёта (12q), здесь больше
   не нужен — ему отвечают «принято» и «сделаем». Пропадает своя воля в
   выборе постройки: дальше это план, а планы одинаковы. И пропадает кривая
   улица — дворы встают в линию, крыши в один рост, общего огня нет.

   НИ СЛОВА МОРАЛИ. Игра нигде не говорит, что правильно, не спрашивает
   «уверены?», не пишет «вы потеряли их culture». Кнопка называет действие,
   и всё; дилемма показана, а не изложена. Понять, что именно сменилось,
   можно только глазами и ушами — и только после.

   ОБРАТНОГО ХОДА НЕТ. Не потому, что жестоко, а потому что в жизни его тоже
   нет: руку не убирают. Возврат превратил бы решение в настройку.

   ПРАВИЛА ФАЙЛА:
   1. Ничего своего не хранит: только флаг `mine` на самом посёлке (12t).
   2. Ни одной оценки в тексте. Ни здесь, ни в интерфейсе. */
const HAND_STEP=0.62;             /* во столько раз дешевле постройка под рукой */
const HAND_STOCK=2.1;             /* во столько раз больше амбар */
/* Речь под рукой: служебная, короткая, без глифов. Ровно то, чем отвечают,
   когда отвечать больше нечем. */
const HAND_LINE=[
  "принято","сделаем","как скажете","есть","будет готово","поняли",
  "исполним","добро","записано"
];
function settleMine(S){return !!(S&&S.mine);}
function settleCanHand(S){
  /* до второй ступени брать нечего: там ещё нет ни улицы, ни своего пути */
  return !!(S&&!S.mine&&(S.stage|0)>=2);
}
function settleTakeHand(S){
  if(!settleCanHand(S))return false;
  S.mine=1;
  S.handAt=(typeof celDay==="function")?celDay():0;
  S._plan=null;                    /* улица пересчитается по-новому */
  if(typeof recordAdd==="function")
    recordAdd("посёлок "+(S.name||""),"взят под руку");
  if(typeof logAdd==="function")
    logAdd("tech","Посёлок "+(S.name||"")+" взят под руку. Дальше строят по указанию.");
  if(typeof tell==="function")
    tell("tech","Посёлок взят под руку","ВЗЯТ ПОД РУКУ\n"+(S.name||""));
  if(typeof saveGame==="function")saveGame(true);
  return true;
}
/* что поднимут под рукой: то, что окупается. Ни своей воли, ни надбавки за
   разнообразие — план и есть план, и потому все такие посёлки похожи */
function settleHandPick(S){
  let best=SETTLE_BUILD[0].k,bs=-1e9;
  for(const b of SETTLE_BUILD){
    const s=(S.diet[b.diet]||0)*1.0-(S.built.filter(x=>x===b.k).length)*SETTLE_STEP*.12;
    if(s>bs){bs=s;best=b.k;}
  }
  return best;
}
/* строка под рукой: без глифов и без словаря */
function settleHandLine(S,topic){
  const r=rng(hashi((S&&S.seed)|0,(topic|0)*77+11,0x4A1D));
  return HAND_LINE[Math.floor(r()*HAND_LINE.length)]+".";
}
/* ── улица под рукой ──
   Плана «как удобно жить» больше нет — есть план «как удобно считать». Дворы
   в линию, ровным шагом, одного роста, ремесло к краю. Разница видна с первого
   взгляда, и ни одна подпись на неё не указывает. */
function settleHandPlan(P){
  if(!P)return P;
  const n=P.yards.length;
  let x=0;
  for(let i=0;i<n;i++){
    const y=P.yards[i];
    y.back=false;y.lift=0;y.flip=false;
    y.k=1.0;
    /* и семя двора одно на всех: крыши, наличники, доски — по одному образцу.
     Разнобой отделки и есть то, чем посёлок выглядел своим */
    y.r=0.5;
    const K=SD_KIND[y.kind]||SD_KIND.dwell;
    y.w=SD_MAN*K.w;y.h=SD_MAN*K.h;
    y.gap=14;
    y.x=x+y.w/2;x+=y.w+y.gap;
  }
  const span=Math.max(120,x-14);
  const x0=P.bx-span/2;
  P.span=span;P.x0=x0;P.x1=x0+span;
  P.yards.forEach(y=>{y.wx=x0+y.x;});
  return P;
}
/* мачта со знаком дома: единственное, что под рукой ДОБАВЛЯЕТСЯ в кадр.
   Ставится у края улицы, и по ней посёлок узнают издали */
function settleHandMast(P,camx,camy,pal){
  if(!P)return;
  /* мачта у НАЧАЛА улицы, а не за её краем: за краем она попадала мимо кадра */
  const x=P.x0-camx-SD_MAN*0.9, y0=P.baseY-camy;
  const h=SD_MAN*2.6;
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.fillRect(x-SD_MAN*0.05,y0,SD_MAN*0.5,3);
  ctx.fillStyle=sdRGB(sdMix(pal.wood||[110,92,70],[40,36,32],.25));
  ctx.fillRect(x,y0-h,Math.max(2,SD_MAN*0.075),h);
  ctx.fillStyle="rgba(255,255,255,.10)";
  ctx.fillRect(x,y0-h,Math.max(1,SD_MAN*0.025),h);
  /* вымпел: маленький, ровный, и он тут не праздник, а метка */
  const w=SD_MAN*0.9,hh=SD_MAN*0.42;
  ctx.fillStyle=sdRGB(sdMix(pal.roof||[120,100,80],[210,180,120],.5));
  ctx.beginPath();
  ctx.moveTo(x+SD_MAN*0.075,y0-h);
  ctx.lineTo(x+SD_MAN*0.075+w,y0-h+hh*0.34);
  ctx.lineTo(x+SD_MAN*0.075,y0-h+hh);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.22)";
  ctx.fillRect(x+SD_MAN*0.075,y0-h+hh*0.62,w*0.5,Math.max(1,hh*0.10));
}

/* ── кнопка ──
   Появляется у посёлка со второй ступени и нигде больше. Ни предупреждения,
   ни «уверены?»: кнопка называет действие, и это всё, что игра говорит. */
function handBtnTick(){
  const b=document.getElementById("handbtn");
  if(!b)return;
  let show=false;
  if(G.mode==="surface"&&G.surf&&G.surf.p&&typeof settleCanLive==="function"
     &&settleCanLive(G.surf.p)){
    const sx=settleSpotX(G.surf.p,G.surf.tr);
    if(sx!=null&&Math.abs(G.surf.x-sx)<44)
      show=settleCanHand(settleAt(G.sx,G.sy));
  }
  b.style.display=show?"":"none";
}
