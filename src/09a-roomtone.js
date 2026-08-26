/* ══════════════ мир слышен: тон места (M178-10) ══════════════
   Музыка в игре есть, шаги и события есть — а МЕСТА не слышно: между нотами
   на любой планете стоит одинаковая цифровая тишина. Здесь у каждого экрана
   появляется свой ровный тон:
     · поверхность — ветер, и его сила ходит вместе с погодой: бурю СЛЫШНО
       раньше, чем её видно, потому что звук растёт от weatherPower ещё до
       того, как частицы станут заметны;
     · пещера и шахта — глухой низкий гул породы, чем глубже, тем ниже;
     · дом — тепло: очень тихий низ и редкие скрипы дерева, а погода снаружи
       слышна СКВОЗЬ стену, глухо (низкочастотный срез);
     · база — вентиляция: узкополосный шум с медленным биением;
     · в вакууме тона нет ВОВСЕ — тишина безвоздушного мира и есть характер.

   ПРАВИЛА ФАЙЛА:
   1. Один голос на всё: пара шумовых петель с фильтрами, которым каждый кадр
      подтягиваются частоты и уровни. Ничего не пересоздаётся при смене
      режима — смена места это setTargetAtTime, а не new.
   2. Громкость под музыкой: тон — пол, а не солист. Бюджет громкости
      (правило M54) держится: суммарно тише любого события.
   3. Ничего не хранится. */

const RTONE={on:false};
function rtInit(){
  if(RTONE.on||!SND.ready)return;
  const c=SND.ctx;
  /* ветер/вентиляция: шум → полосовой → усилитель */
  const n1=noise(c),bp=c.createBiquadFilter(),g1=c.createGain();
  bp.type="bandpass";bp.frequency.value=420;bp.Q.value=.7;
  g1.gain.value=0;
  n1.connect(bp);bp.connect(g1);g1.connect(SND.sfx);
  n1.start();
  /* порода/дом: шум → низкий срез → усилитель */
  const n2=noise(c),lp=c.createBiquadFilter(),g2=c.createGain();
  lp.type="lowpass";lp.frequency.value=140;
  g2.gain.value=0;
  n2.connect(lp);lp.connect(g2);g2.connect(SND.sfx);
  n2.start();
  RTONE.bp=bp;RTONE.g1=g1;RTONE.lp=lp;RTONE.g2=g2;RTONE.on=true;
  RTONE.creak=0;
}
/* какой тон у текущего места: [уровень ветра, его частота, уровень низа, его частота] */
function rtWant(){
  const M=G.mode;
  /* вакуум молчит: на безвоздушном мире и в космосе тона нет */
  if(M==="surface"&&G.surf&&G.surf.p){
    const p=G.surf.p;
    if(p.T.atm==="отсутствует")return [0,420,0,120];
    /* ветер дышит погодой: сила слышна раньше, чем видна (порог вида .14) */
    const wp=(typeof weatherPower==="function")?weatherPower(p):0;
    const nite=(typeof surfNight==="function")?surfNight(p):0;
    const base=.012+wp*.055;
    return [base*(1-nite*.3),340+wp*380,.006,110];
  }
  if(M==="cave"&&G.cave)return [.006,220,.020,90];
  if(M==="dig"&&G.dig)
    return [.004,180,.016+Math.min(.02,(G.dig.row||0)*.0006),80-Math.min(24,(G.dig.row||0)*.5)];
  if(M==="homein"&&G.hin){
    /* дом: тепло внутри, погода снаружи — сквозь стену, только низ */
    let wp=0;
    if(G.surf&&G.surf.p&&G.surf.p.T.atm!=="отсутствует"
       &&typeof weatherPower==="function")wp=weatherPower(G.surf.p);
    return [wp*.016,160,.012,120];
  }
  /* зимовка (M197): вентиляция станции плюс ветер за стеной — глухо, потому
     что стена. Тона тем больше, чем ниже опущено тепло: холодная станция
     звенит и щёлкает громче тёплой */
  /* санаторий (M199): море и цикады. Единственный тон в игре, который просто
     приятный — на то он и единственное место, где разрешено отдыхать */
  if(M==="spa"&&G.spa)return [.026,300,.010,150];
  if(M==="winter"&&G.win){
    const he=G.win.pw.heat|0;
    return [.016+(3-he)*.004,470,.010+(3-he)*.003,90];
  }
  if(M==="base"&&G.base)return [.014,520,.008,100];
  if(M==="raid"&&G.raid)return [.010,640,.010,70];
  if(M==="scoop"&&G.scoop)return [.030,300,.012,60];
  return [0,420,0,120];
}
function roomToneTick(dt){
  if(!audioOn()||!SND.ready||SND.ctx.state!=="running")return;
  rtInit();
  if(!RTONE.on)return;
  const t=SND.ctx.currentTime;
  const w=rtWant();
  /* медленное живое колебание, чтобы тон не был синтетической прямой */
  const sway=1+Math.sin(G.t*.006)*.22+Math.sin(G.t*.0023+1.7)*.12;
  RTONE.g1.gain.setTargetAtTime(w[0]*sway,t,.8);
  RTONE.bp.frequency.setTargetAtTime(w[1]*(1+Math.sin(G.t*.004)*.08),t,1.2);
  RTONE.g2.gain.setTargetAtTime(w[2],t,1.0);
  RTONE.lp.frequency.setTargetAtTime(w[3],t,1.2);
  /* дом поскрипывает: редкий тихий скрип дерева, только внутри */
  if(G.mode==="homein"&&G.hin){
    RTONE.creak-=dt;
    if(RTONE.creak<=0){
      RTONE.creak=900+Math.random()*2400;
      sfx("creak");
    }
  }
}
