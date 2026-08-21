/* ══════════════ самописец: бумага, пять перьев, память наблюдения ══════════════
   Честный ответ на вопрос «как игрок сравнит то, что видел сорок часов назад»
   (M123). Не фотоаппарат: корабль пишет сам, всё время, без команды. Слева от
   панели (25a-instr) — бумажная лента, на неё смотрят, повернув голову.

   ЧТО ЭТО ЗА ВЕЩЬ. Панель показывает «сейчас», лента показывает «как было».
   Медленная долина не видна глазом и читается только ползущей кривой; тихий
   уезд печатает ровную линию там, где должен быть день. Поэтому на ленте нет
   ни подписей, ни толкований — только кривые и деления. Толкует игрок.

   ПРАВИЛА ФАЙЛА (те же, что у 25a, плюс своё):
   1. Ни сообщения, ни тревожного цвета: `say`, `tell`, `logAdd` здесь не
      зовутся никогда. Единственный звук — щелчок пера, и он не событие, а
      механика прибора: перо щёлкает всегда, меняется только ритм.
   2. Ритм — это и есть показание. Такт считается от невязки: у ядра области
      перо частит. Игрок поднимает голову сам, без подсказки.
   3. Ничего не персистится: лента живёт в памяти сеанса, как и всё выводимое
      из положения (сквозное правило). Отрыв ленты в вещь — за M128.
   4. Лента пишется в любом режиме, а щёлкает только там, где её слышно, —
      в рубке. */

const TAPE_N=1440;                 // столбцов в кольце: около сорока минут ленты
const TAPE_PENS=5;
const TAPE_DT=1.6;                 // секунд на столбец в спокойном месте
const TAPE_GAIN=6;                 // диапазон: уход на .08 шкалы кладёт перо на край
const TAPE_ADAPT=.02;              // как медленно перо подтягивает свой нуль
function tapeInit(){
  if(G.tape&&G.tape.v===1)return G.tape;
  return G.tape={v:1,col:new Uint8Array(TAPE_N*TAPE_PENS),zero:null,
                 n:0,head:0,acc:0,back:0,tick:0};
}
/* ЧТО ИМЕННО ПИШЕТ ПЕРО. Не показание, а его уход от собственного нуля. Так
   устроены настоящие самописцы (нуль и диапазон — две ручки), и так же устроен
   смысл ленты: панель отвечает на «сколько сейчас», лента — на «менялось ли».
   Абсолютная величина в логарифмической шкале ползёт так вяло, что все пять
   перьев рисовали бы прямые, и тихий уезд было бы не отличить от чего угодно.
   Нуль подтягивается медленно (TAPE_ADAPT), поэтому ровная линия означает
   «ничего не происходило», а ползущая кривая — что мир уходит под кораблём. */
function tapeSample(){
  const T=tapeInit(), R=(typeof instrRead==="function")?instrRead():null;
  if(!R)return;
  const o=T.head*TAPE_PENS;
  if(!T.zero){T.zero=[];for(let i=0;i<TAPE_PENS;i++)T.zero[i]=instrTrack(R[i]);}
  for(let i=0;i<TAPE_PENS;i++){
    const v=instrTrack(R[i]), z=T.zero[i];
    T.col[o+i]=Math.round(clamp(.5+(v-z)*TAPE_GAIN,0,1)*255);
    T.zero[i]=z+(v-z)*TAPE_ADAPT;
  }
  T.head=(T.head+1)%TAPE_N;
  if(T.n<TAPE_N)T.n++;
  /* прокрутка назад держится за место на ленте, а не за индекс: пока игрок
     смотрит в прошлое, новые столбцы не утаскивают картинку из-под глаз */
  if(T.back>0)T.back=Math.min(T.back+1,TAPE_N-1);
}
/* такт: чем ближе к ядру, тем чаще перо. Ничего, кроме частоты, не меняется */
function tapeRate(){
  const m=(typeof instrMisclose==="function")?instrMisclose():0;
  return TAPE_DT/(1+clamp(m,0,1)*1.35);
}
function tapeTick(dt){
  const T=tapeInit();
  T.acc+=dt/60;                    // dt кадра — в шестидесятых долях секунды
  const step=tapeRate();
  let guard=8;
  while(T.acc>=step&&guard-->0){
    T.acc-=step;
    tapeSample();
    T.tick=1;
    /* правило 4: щелчок только в рубке. Тише шага, без хвоста — это перо,
       а не сигнал */
    if(G.mode==="belt"&&typeof sfx==="function")sfx("pen");
  }
  if(T.tick>0)T.tick=Math.max(0,T.tick-dt*.14);
}
/* ── прокрутка назад ──
   Свои клавиши, а не действие раскладки: лента — это предмет в рубке, к
   которому тянутся рукой, и на пультах её нет. */
function tapeScroll(d){
  const T=tapeInit();
  T.back=clamp(T.back+d,0,Math.max(0,T.n-4));
}
addEventListener("keydown",e=>{
  if(G.mode!=="belt")return;
  if(e.code==="BracketLeft"){tapeScroll(24);e.preventDefault();}
  else if(e.code==="BracketRight"){tapeScroll(-24);e.preventDefault();}
  else if(e.code==="Backslash"){tapeInit().back=0;e.preventDefault();}
});
/* ── бумага ──
   Рисование вынесено из потолочного блока в отдельную функцию: та же бумага
   висит и в кабине, и узкой полоской в приборной колодке (25c-instr-hud), а
   двух самописцев в игре быть не может. Контекст передаётся, потому что в
   колодке это свой маленький canvas. */
function tapePaper(c,x0,y0,w,h){
  const T=tapeInit();
  if(T.n<2||w<24||h<8)return;
  const x1=x0+w;
  c.save();
  /* бумага: слегка тёплая, с продольными краями и следом протяжки */
  c.fillStyle="rgba(188,182,164,.62)";
  c.fillRect(x0,y0,w,h);
  c.fillStyle="rgba(0,0,0,.10)";
  c.fillRect(x0,y0,w,1.2);c.fillRect(x0,y0+h-1.2,w,1.2);
  /* слева бумага уходит в щель подачи: без этой тени полоса начинается ниоткуда */
  const lw=Math.min(9,w*.1);
  const lg=c.createLinearGradient(x0,0,x0+lw,0);
  lg.addColorStop(0,"rgba(8,11,15,.45)");
  lg.addColorStop(1,"rgba(8,11,15,0)");
  c.fillStyle=lg;c.fillRect(x0,y0,lw,h);
  /* поперечные деления: время, без единой цифры */
  const cols=Math.min(T.n-1,Math.floor(w));
  const sc=w/cols;
  c.strokeStyle="rgba(60,66,60,.18)";c.lineWidth=1;
  for(let g=0;g<=6;g++){
    const gx=Math.round(x0+w*g/6)+.5;
    c.beginPath();c.moveTo(gx,y0+1);c.lineTo(gx,y0+h-1);c.stroke();
  }
  /* пять перьев: каждое на своей дорожке, все одного цвета. Разные цвета
     сделали бы дорожку легендой, а легенда — это толкование */
  c.lineWidth=1;
  const th=h/TAPE_PENS;
  for(let i=0;i<TAPE_PENS;i++){
    const top=y0+th*i+1.2, hh=th-2.4;
    /* нуль дорожки: печатная линия на бумаге. На ней перо стоит там, где
       ничего не менялось, — и это само по себе показание */
    c.strokeStyle="rgba(60,66,60,.20)";
    c.beginPath();
    c.moveTo(x0,Math.round(top+hh*.5)+.5);c.lineTo(x1,Math.round(top+hh*.5)+.5);
    c.stroke();
    c.strokeStyle="rgba(38,44,40,.80)";
    c.beginPath();
    for(let k=0;k<=cols;k++){
      /* столбцы идут слева направо: слева старое, справа то, что пишется */
      const idx=(T.head-1-T.back-(cols-k)+TAPE_N*2)%TAPE_N;
      const v=T.col[idx*TAPE_PENS+i]/255;
      const x=x0+k*sc, yy=top+hh*(1-v);
      if(k===0)c.moveTo(x,yy);else c.lineTo(x,yy);
    }
    c.stroke();
  }
  /* валик протяжки у правого края: без него бумага читается плитой, а не
     полосой, которую тянут с рулона */
  const rw=Math.min(7,w*.08);
  const rg=c.createLinearGradient(x1-rw,0,x1,0);
  rg.addColorStop(0,"rgba(20,26,32,0)");
  rg.addColorStop(.55,"rgba(20,26,32,.30)");
  rg.addColorStop(1,"rgba(150,176,190,.20)");
  c.fillStyle=rg;c.fillRect(x1-rw,y0,rw,h);
  c.strokeStyle="rgba(150,176,190,.24)";c.lineWidth=1;
  c.beginPath();c.moveTo(x1-rw+.5,y0);c.lineTo(x1-rw+.5,y0+h);c.stroke();
  /* перо: короткая чёрточка у правого края, дрожит на щелчке. Ничего не
     подсвечивает — просто стоит там, где сейчас пишет */
  if(!T.back){
    const jitter=T.tick*1.6;
    c.strokeStyle="rgba(24,28,26,.85)";c.lineWidth=1.2;
    c.beginPath();
    c.moveTo(x1-1.5+jitter,y0+1);c.lineTo(x1-1.5+jitter,y0+h-1);
    c.stroke();
  }else{
    /* смотрим назад: бумага чуть в тени вытяжного окна, и всё */
    c.fillStyle="rgba(10,14,18,.16)";c.fillRect(x0,y0,w,h);
  }
  c.restore();
}
/* ── бумага в кабине ──
   Лента лежит на том же потолочном блоке, что и панель, левее её. Бумага
   светлее металла — это единственное светлое пятно в рубке, и его видно
   боковым зрением, когда перо частит. */
function tapeStrip(P,FS){
  const brow=P.brow;
  if(brow<26)return;
  const pw=Math.min(P.BW*.52,420), px0=(W-pw)/2;
  /* левый край держится за стойку: свесившись за неё, лента вылезала бы на
     угол остекления, где потолочного блока уже нет */
  const x0=Math.max(P.pw*.5,px0*.16), w=px0-14-x0;
  if(w<70)return;                          // на узком блоке ленты нет места
  tapePaper(ctx,x0,5,w,clamp(brow-12,12,38));
}
