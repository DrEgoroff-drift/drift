/* ══════════════ небо ведёт календарь ══════════════
   Дальний угол галактики отличался от ближнего коэффициентом опасности, и
   только. Место становится местом, когда с ним связано ВРЕМЯ: сюда стоит
   вернуться в такой-то день, потому что тогда здесь что-то произойдёт.

   «Долгий Ход» датировал свои зарубки не координатами, а небом: координаты
   плывут, а небо — нет. Поэтому календарь здесь не таблица событий, а функция
   от времени: `celestAt(sys,t)` считает, а не бросает кости, и ничего не кладёт
   в сохранение (правило про эфемерное). Один и тот же день в одной и той же
   системе всегда даёт одно и то же небо — иначе назначить встречу нельзя.

   ── почему календарь идёт не по нарисованным орбитам ──
   В системе планеты кружат аркадно: оборот за полминуты, спутник — за шесть
   секунд, и скорость там намеренно зажата под автопилот (`17-mode-system`),
   чтобы за телом можно было угнаться. На таких орбитах затмение случалось бы
   каждые несколько секунд, и никакой календарь на них не построить. Поэтому у
   мира есть вторые, медленные часы: СУТКИ. Их период выведен из настоящих
   параметров тел — радиуса орбиты и seed, — но идёт в масштабе, в котором
   ожидание имеет смысл. Аркадная орбита — площадка для полёта, календарь —
   часы мира; смешивать их значит испортить одно из двух. */
const CEL_DAY=3600;                 /* кадров в сутках: минута игры */
const CEL_CONJ_W=.21;               /* окно парада, радиан */
/* Угловой размер звезды с грунта: мерило, с которым сравнивается диск спутника.
   Задан числом, а не выведен: радиуса светила в мире нет, и заводить его ради
   одного сравнения — лишняя сущность. При .03 обычная луна даёт глубокое
   частное затмение, крупная и низкая — полное. */
const CEL_STAR_ANG=.03;
function celDay(t){return Math.floor((t===undefined?G.t:t)/CEL_DAY);}
function celDayF(t){return (t===undefined?G.t:t)/CEL_DAY;}
/* ── час суток на поверхности (хвосты G7/G12) ──
   Сутки календаря — минута, и для неба над головой это слишком быстро: ночь
   наступала бы каждые полминуты. У планеты своё вращение — шесть-десять
   календарных суток, фаза от семени. alt — высота звезды (1 полдень,
   −1 полночь), az — где она над горизонтом (−1 восток … 1 запад). Ничего не
   хранится: всё от G.t и семени, как и остальной календарь. */
function celSun(p,t){
  const seed=(p&&p.seed)|0;
  const period=CEL_DAY*(6+((seed>>>7)&3));
  const ph=(((t===undefined?G.t:t)/period)+(seed%100)/100)%1;
  return {ph,alt:Math.sin(ph*TAU),az:Math.cos(ph*TAU)};
}
/* сколько ночи в кадре: 0 днём, до .62 в полночь. Без воздуха ночь резче */
function surfNight(p){
  if(!p)return 0;
  const s=celSun(p);
  const k=p.T&&p.T.atm==="отсутствует"?1.9:1.5;
  const n=clamp(-s.alt*k+.15,0,.62);
  /* три света (11g): на окраине области ночь не доходит до ночи, в ядре её нет */
  return (typeof lightsNight==="function")?lightsNight(n):n;
}
/* Период обращения в сутках: Кеплер по радиусу орбиты, приведённый к масштабу,
   в котором ближняя планета обходит звезду примерно за две недели. */
function celPeriod(p){return 9+22*Math.pow(Math.max(80,p.orbit)/900,1.5);}
function celLon(p,t){
  return (p.argp+p.ang+celDayF(t)/celPeriod(p)*TAU)%TAU;
}
/* Период спутника: свой у каждого, от seed, и никогда не кратен соседскому —
   иначе затмения на планете с двумя лунами сливались бы в одно. */
function celMoonPeriod(m){return 4+((m.seed>>>3)%17)+((m.seed>>>9)%7)*.37;}
function celMoonPhase(m,t){
  return ((m.ang/TAU)+celDayF(t)/celMoonPeriod(m))%1;
}
/* ── затмение ──
   Считается для планеты, на которой игрок стоит: спутник проходит между ней и
   звездой. Фаза 0 — спутник ровно на луче к звезде. Ширина окна обратна периоду:
   быстрый спутник проскакивает тень быстрее, и это ровно та арифметика, из-за
   которой затмение — редкость, а не ежедневность. */
function celEclipse(p,t){
  if(!p||!p.moons||!p.moons.length)return null;
  let best=null;
  for(const m of p.moons){
    const P=celMoonPeriod(m);
    let ph=celMoonPhase(m,t);
    if(ph>.5)ph-=1;                         /* −0.5…0.5 вокруг соединения */
    const w=.16/P;                          /* доля периода, что длится проход */
    if(Math.abs(ph)>w)continue;
    /* Глубина — по УГЛОВОМУ размеру диска, а не по размеру планеты, под которой
       стоишь: закрывает звезду спутник, и важно, каким он виден с грунта, то
       есть радиус, делённый на расстояние. Первый счёт брал за мерило радиус
       планеты, и на большом мире любая луна выходила щербинкой: полного
       затмения не случалось нигде и никогда. */
    const ang=m.radius/Math.max(20,m.orbit);
    const size=clamp(ang/CEL_STAR_ANG,.25,1);
    const k=clamp((1-Math.abs(ph)/w)*size,0,1);
    if(!best||k>best.k)best={k,m,ph:ph/w,full:size>=.92};
  }
  return best;
}
/* ── парад ──
   Три и больше планет в угловом окне, считая от звезды. Ничего не бросается:
   долготы известны, окно фиксировано. */
function celConj(sys,t){
  const ps=(sys&&sys.planets)||[];
  if(ps.length<3)return null;
  const lons=ps.map(p=>celLon(p,t));
  let best=null;
  for(let i=0;i<lons.length;i++){
    let n=0,spread=0;
    for(let j=0;j<lons.length;j++){
      const d=Math.abs(angDiff(lons[j],lons[i]));
      if(d<=CEL_CONJ_W){n++;spread=Math.max(spread,d);}
    }
    if(n>=3&&(!best||n>best.n))best={n,k:clamp(1-spread/CEL_CONJ_W,0,1),lon:lons[i]};
  }
  return best;
}
/* ── комета ──
   Одна на систему, на длинном эллипсе: период в сотни суток, видна недолго
   у перигелия. Всё выводится из seed системы — комета не появляется, она
   ПРИХОДИТ, и её приход можно вычислить наперёд. */
function celComet(sys,t){
  if(!sys)return null;
  const s=sys.seed|0;
  const P=210+(s>>>5)%260, off=(s>>>11)%P;
  const d=celDayF(t)+off;
  const ph=(d%P)/P;                          /* 0 — перигелий */
  const vis=9/P;
  if(ph>vis&&ph<1-vis)return null;
  const near=ph<vis?ph/vis:(1-ph)/vis;
  return {k:clamp(1-near,0,1),ang:((s>>>3)%628)/100,per:P,
          left:Math.round((ph<vis?vis-ph:1-ph+vis)*P)};
}
/* Всё небо системы одним вызовом. Планета — необязательный второй довод: без
   неё считается только то, что видно отовсюду. */
function celestAt(sys,t,p){
  return {day:celDay(t),conj:celConj(sys,t),comet:celComet(sys,t),
          ecl:p?celEclipse(p,t):null};
}
/* Планета, на которой игрок стоит прямо сейчас (посадка, поверхность, пещера) */
function celHere(){
  return (G.land&&G.land.p)||(G.surf&&G.surf.p)||(G.dig&&G.dig.p)||null;
}
function celNow(){return celestAt(G.sys,G.t,celHere());}
/* ── затемнение от затмения ──
   Единственное право неба вмешиваться в кадр: свет. Ни цены, ни выработка,
   ни числа — правило экзотических звёзд стоит (`01-core`, `sysDanger`). */
function celDark(){
  const p=celHere();
  if(!p)return 0;
  const e=celEclipse(p,G.t);
  return e?clamp(e.k,0,1)*.86:0;
}
/* Одна строка про небо — для рубки и для журнала. Пусто, когда небо обычное:
   постоянная строка «ничего не происходит» — это шум, а не сведения. */
function celLine(){
  const C=celNow();
  const out=[];
  if(C.ecl)out.push(C.ecl.full?"ЗАТМЕНИЕ":"ЧАСТНОЕ ЗАТМЕНИЕ");
  if(C.conj)out.push("ПАРАД "+C.conj.n+" ТЕЛ");
  if(C.comet)out.push("КОМЕТА · ЕЩЁ "+C.comet.left+" СУТ");
  return out.join(" · ");
}
/* Идёт ли сейчас событие, которым «Долгий Ход» датировал зарубки */
function celEventNow(){
  const C=celNow();
  return !!((C.ecl&&C.ecl.k>.25)||C.conj||(C.comet&&C.comet.k>.3));
}
/* ── небо на кадре ──
   Рисуется в `drawSkyLayer` между заревом звезды и облаками. Бюджет громкости
   соблюдается: парад — четыре тусклых диска, комета — один волос с хвостом,
   затмение — диск, наезжающий на звезду, и всё. Небо не начинает кричать. */
function drawCelest(p,sunX,sunY,sunR){
  const C=celNow();
  if(C.conj){
    /* Парад читается СТРОЕМ, а не яркостью. Первый проход ставил три тусклые
       точки по 2 px — в дневном небе они были неотличимы от пыли, и событие,
       названное в шапке, на кадре отсутствовало. Строй держит нить: она и
       говорит, что тела выстроились, оставаясь тише облаков. */
    const n=C.conj.n,a=(.14+.22*C.conj.k);
    const pt=i=>[W*(.10+i*.082),H*(.29+Math.sin(i*1.7)*.022)];
    ctx.strokeStyle="rgba(206,222,238,"+(a*.5).toFixed(3)+")";ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0;i<n;i++){const[x,y]=pt(i);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();
    for(let i=0;i<n;i++){
      const[x,y]=pt(i),r=2.8+(i%3)*1.3;
      const g=ctx.createRadialGradient(x,y,0,x,y,r*3.4);
      g.addColorStop(0,"rgba(226,238,248,"+a.toFixed(3)+")");
      g.addColorStop(1,"rgba(226,238,248,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*3.4,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(232,242,250,"+Math.min(.85,a*2.2).toFixed(3)+")";
      ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    }
  }
  if(C.comet){
    const a=C.comet.ang,x=W*.2+Math.cos(a)*W*.3,y=H*.2+Math.sin(a)*H*.12;
    const len=60+120*C.comet.k;
    const g=ctx.createLinearGradient(x,y,x-Math.cos(a-.4)*len,y-Math.sin(a-.4)*len);
    g.addColorStop(0,"rgba(198,230,246,"+(.5*C.comet.k).toFixed(3)+")");
    g.addColorStop(1,"rgba(198,230,246,0)");
    ctx.strokeStyle=g;ctx.lineWidth=2.2;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x-Math.cos(a-.4)*len,y-Math.sin(a-.4)*len);ctx.stroke();
    ctx.lineCap="butt";
    ctx.fillStyle="rgba(226,244,255,"+(.7*C.comet.k).toFixed(3)+")";
    ctx.beginPath();ctx.arc(x,y,1.8+C.comet.k*1.4,0,TAU);ctx.fill();
  }
  if(C.ecl){
    /* диск спутника наезжает на звезду с той стороны, с какой он подходит:
       смещение идёт по фазе, и затмение видно КАК ДВИЖЕНИЕ, а не как пятно */
    const off=C.ecl.ph*sunR*2.1;
    ctx.fillStyle="#05070c";
    ctx.beginPath();ctx.arc(sunX+off,sunY-off*.22,sunR*(.86+C.ecl.k*.3),0,TAU);ctx.fill();
    /* корона: единственное, ради чего на затмение смотрят */
    if(C.ecl.k>.7){
      const cg=ctx.createRadialGradient(sunX,sunY,sunR,sunX,sunY,sunR*2.6);
      cg.addColorStop(0,"rgba(255,238,205,"+(.30*C.ecl.k).toFixed(3)+")");
      cg.addColorStop(1,"rgba(255,238,205,0)");
      ctx.fillStyle=cg;
      ctx.beginPath();ctx.arc(sunX,sunY,sunR*2.6,0,TAU);ctx.fill();
    }
  }
}
