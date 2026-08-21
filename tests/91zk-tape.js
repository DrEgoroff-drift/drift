/* ══ M123: самописец — бумага, пять перьев, память наблюдения ══
   Сторож замысла: лента пишется сама и молча, ритм пера — это невязка, а не
   тревога, лента и панель показывают одно и то же, и назад по ней можно
   отмотать, не сдвинув то, что пишется сейчас. */
TEST_SUITES.push(()=>suite("Самописец: перо считает время, а не объявляет тревогу",()=>{
  resetWorld();
  G.tape=null;
  const T=tapeInit();
  eq(T.col.length,TAPE_N*TAPE_PENS,"кольцо ленты: пять дорожек на столбец");
  eq(T.n,0,"чистая лента пуста");

  /* ── перо пишет уход от своего нуля, а не показание ── */
  const R=instrRead();
  ok(R.every(r=>{const t=instrTrack(r);return t>=0&&t<=1;}),
     "показание ложится в шкалу целиком");
  tapeSample();
  for(let i=0;i<TAPE_PENS;i++)
    eq(T.col[i],128,"перо "+INSTR_KEYS[i]+" начинает с нуля дорожки");
  /* в неподвижном мире линия остаётся ровной: «ничего не происходило» —
     это тоже показание, и на нём стоит тихий уезд (M142) */
  for(let i=0;i<40;i++)tapeSample();
  let flat=true;
  for(let c=0;c<40;c++)for(let i=0;i<TAPE_PENS;i++)
    if(Math.abs(T.col[((T.head-1-c+TAPE_N)%TAPE_N)*TAPE_PENS+i]-128)>1)flat=false;
  ok(flat,"в неизменном мире перья держат ровную линию");
  /* а сдвиг показания перо ловит: масса выросла — кривая ушла */
  const m0=INSTR_BY_ID.mass.base;
  INSTR_BY_ID.mass.base=()=>m0()+90;
  tapeSample();
  const mi=INSTR_KEYS.indexOf("mass");
  ok(T.col[((T.head-1+TAPE_N)%TAPE_N)*TAPE_PENS+mi]>150,
     "перо масс-детектора ушло вверх от нуля");
  INSTR_BY_ID.mass.base=m0;

  /* ── ритм: у ядра области перо частит, и меняется только частота ── */
  const R0=regionAt(0,0);
  const sx0=G.sx,sy0=G.sy;
  G.sx=R0.core.sx;G.sy=R0.core.sy;const fast=tapeRate();
  G.sx=R0.core.sx+5;G.sy=R0.core.sy+5;const slow=tapeRate();
  G.sx=sx0;G.sy=sy0;
  ok(fast<slow,"в ядре такт короче ("+fast.toFixed(2)+" против "+slow.toFixed(2)+")");
  ok(fast>0&&slow<=TAPE_DT+1e-9,"такт всегда положителен и не длиннее спокойного");

  /* ── пишет сама и молчит: ни сообщения, ни журнала ── */
  const spy={say:0,tell:0,log:0};
  const s0=say,t0=tell,l0=logAdd;
  say=function(){spy.say++;return s0.apply(null,arguments);};
  tell=function(){spy.tell++;return t0.apply(null,arguments);};
  logAdd=function(){spy.log++;return l0.apply(null,arguments);};
  const mode0=G.mode;G.mode="system";      // не в рубке: перо не должно быть слышно
  const before=T.n;
  for(let i=0;i<400;i++)tapeTick(1);        // около семи секунд игрового времени
  say=s0;tell=t0;logAdd=l0;G.mode=mode0;
  ok(T.n>before,"лента прирастает сама, без команды: "+before+" → "+T.n);
  eq(spy.say+spy.tell+spy.log,0,"самописец не сказал ни слова");

  /* ── кольцо не переполняется ── */
  for(let i=0;i<TAPE_N+50;i++)tapeSample();
  eq(T.n,TAPE_N,"старое затирается новым, длина ленты постоянна");

  /* ── прокрутка: назад, вперёд и до края ── */
  T.back=0;
  tapeScroll(24);
  eq(T.back,24,"отмотали назад");
  const back0=T.back;
  tapeSample();
  ok(T.back>back0,"новые столбцы не утаскивают картинку из-под глаз");
  tapeScroll(-9999);
  eq(T.back,0,"вернулись к тому, что пишется сейчас");
  tapeScroll(99999);
  ok(T.back<=T.n-4&&T.back>0,"дальше начала ленты не уедешь: "+T.back);
}));

/* ══ M124: приборы там, где принимаются решения ══
   Колодка в строке приборов — тот же прибор, а не второй: она читает
   `instrRead`, рисует ту же ленту и так же ничего не объявляет. */
TEST_SUITES.push(()=>suite("Колодка: приборы под рукой в любом режиме",()=>{
  resetWorld();
  const pod=document.getElementById("ipod");
  ok(!!pod,"колодка есть в разметке");
  ok(typeof instrPodDraw==="function"&&typeof instrPodTick==="function",
     "у неё свой отрисовщик и свой такт");
  /* одна лента на игру: колодка рисует ту же бумагу, что и потолочный блок */
  ok(typeof tapePaper==="function","бумага рисуется общей функцией");

  /* ── в поясе прячется: там есть настоящий блок над остеклением ── */
  const m0=G.mode,run0=G.running;
  G.running=true;
  G.mode="system";instrPodTick();
  eq(pod.style.display,"","в системном виде колодка на месте");
  G.mode="belt";instrPodTick();
  eq(pod.style.display,"none","в поясе её нет: там панель настоящая");
  G.mode="surface";instrPodTick();
  eq(pod.style.display,"","на поверхности снова на месте");

  /* ── рисует и молчит ── */
  const spy={say:0,tell:0,log:0,sfx:0};
  const s0=say,t0=tell,l0=logAdd,f0=sfx;
  say=function(){spy.say++;return s0.apply(null,arguments);};
  tell=function(){spy.tell++;return t0.apply(null,arguments);};
  logAdd=function(){spy.log++;return l0.apply(null,arguments);};
  sfx=function(){spy.sfx++;return f0.apply(null,arguments);};
  for(let i=0;i<30;i++)tapeSample();
  instrPodDraw();
  say=s0;tell=t0;logAdd=l0;sfx=f0;
  eq(spy.say+spy.tell+spy.log+spy.sfx,0,"колодка не сказала ни слова");
  const c=pod.getContext("2d"),d=c.getImageData(0,0,pod.width,pod.height).data;
  let ink=0;for(let i=3;i<d.length;i+=4)if(d[i]>8)ink++;
  ok(ink>pod.width*pod.height*.1,"на колодке действительно что-то нарисовано: "+ink+" пикселей");
  G.mode=m0;G.running=run0;
}));
