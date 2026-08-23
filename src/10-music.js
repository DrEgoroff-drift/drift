/* ══════════════ музыка: слои, а не треки ══════════════ */
/* Ни одной готовой мелодии. Пять слоёв (дрон, бас, мотив, перкуссия, атмосфера)
   вплывают и уплывают, поэтому у музыки нет ни начала, ни шва, ни повтора.
   Смена локации — кроссфейд за пару секунд, а не обрыв трека. */
const SCALES={
  lydian:    [0,2,4,6,7,9,11],
  major:     [0,2,4,5,7,9,11],
  mixolydian:[0,2,4,5,7,9,10],
  dorian:    [0,2,3,5,7,9,10],
  minor:     [0,2,3,5,7,8,10],
  phrygian:  [0,1,3,5,7,8,10],
  locrian:   [0,1,3,5,6,8,10],
  whole:     [0,2,4,6,8,10],
  /* пентатоники и «узкие» лады: в них любая пара нот созвучна, поэтому
     наложенные друг на друга длинные тоны не дают грязи */
  pentMin:   [0,3,5,7,10],
  pentMaj:   [0,2,4,7,9],
  hirajoshi: [0,2,3,7,8],
  kumoi:     [0,2,3,7,9],
  insen:     [0,1,5,7,10],
  harmMin:   [0,2,3,5,7,8,11],
  byzantine: [0,1,4,5,7,8,11],
  overtone:  [0,2,4,6,7,9,10]
};
const SCALE_KEYS=Object.keys(SCALES);
/* палитра сцены: лад, тоника (полутоны от A2), темп и вес каждого слоя */
const MUSIC_SCENES={
  system:  {scale:"lydian",    root:-5, bpm:44,pad:1,  bass:.45,motif:.3, perc:0,  air:.25,beacon:.9, timbre:"triangle"},
  dock:    {scale:"mixolydian",root:-3, bpm:56,pad:.8, bass:.5, motif:.45,perc:.2, air:.15,beacon:.45,timbre:"triangle"},
  map:     {scale:"whole",     root:-7, bpm:32,pad:1,  bass:0,  motif:.12,perc:0,  air:.45,beacon:1,  timbre:"sine"},
  landing: {scale:"kumoi",     root:-5, bpm:48,pad:.9, bass:.4, motif:.2, perc:.15,air:.2, beacon:.7, timbre:"triangle"},
  belt:    {scale:"dorian",    root:-7, bpm:58,pad:.85,bass:.55,motif:.25,perc:.3, air:.2, beacon:.5, timbre:"sawtooth"},
  cave:    {scale:"locrian",   root:-12,bpm:36,pad:.9, bass:.3, motif:.1, perc:0,  air:.55,beacon:.8, timbre:"sine"},
  dig:     {scale:"insen",     root:-10,bpm:40,pad:.9, bass:.35,motif:.12,perc:.1, air:.45,beacon:.6, timbre:"sine"},
  surface: {scale:"pentMaj",   root:-5, bpm:46,pad:1,  bass:.35,motif:.28,perc:0,  air:.3, beacon:.7, timbre:"triangle"}
};
/* тип мира задаёт настроение, а «геном» планеты (planetBiome) — точный лад и темп:
   каждая планета получает свою музыку бесплатно, без единой строчки контента */
const WORLD_MOOD={
  terran:["lydian","major","mixolydian","pentMaj","overtone"],
  ocean:["lydian","dorian","major","kumoi","pentMaj"],
  desert:["mixolydian","phrygian","dorian","byzantine","insen"],
  rocky:["minor","dorian","locrian","pentMin","harmMin"],
  ice:["whole","lydian","minor","kumoi","hirajoshi"],
  volcanic:["phrygian","minor","locrian","harmMin","byzantine"],
  toxic:["locrian","phrygian","whole","insen","hirajoshi"],
  crystal:["whole","lydian","hirajoshi","kumoi","overtone"],
  jungle:["dorian","mixolydian","pentMaj","lydian","insen"],
  metal:["locrian","harmMin","minor","phrygian","pentMin"],
  ruin:["phrygian","harmMin","byzantine","minor","insen"],
  gas:["whole","lydian","major","overtone","pentMaj"]
};
/* Характер типа мира: не только лад, но и сам состав слоёв. Раньше планетная
   сцена отличалась от космической почти одним ладом (тоже из «светлого» набора),
   при одинаковом наборе слоёв — на слух это была та же музыка. Теперь у планет
   свой профиль: земля живёт ритмом и мелодией, космос — дроном и маяками. */
const WORLD_VOICE={
  terran:  {bpm:[54,72],perc:.42,motif:.55,air:.2, beacon:.12,bass:.5, timbre:"triangle"},
  ocean:   {bpm:[40,54],perc:.14,motif:.45,air:.62,beacon:.3, bass:.4, timbre:"sine"},
  desert:  {bpm:[48,64],perc:.5, motif:.42,air:.16,beacon:.1, bass:.55,timbre:"sawtooth"},
  rocky:   {bpm:[44,58],perc:.3, motif:.34,air:.24,beacon:.18,bass:.62,timbre:"triangle"},
  ice:     {bpm:[30,42],perc:.06,motif:.3, air:.75,beacon:.45,bass:.28,timbre:"sine"},
  volcanic:{bpm:[62,84],perc:.66,motif:.4, air:.12,beacon:.06,bass:.7, timbre:"sawtooth"},
  toxic:   {bpm:[36,50],perc:.22,motif:.28,air:.6, beacon:.4, bass:.45,timbre:"sawtooth"},
  /* кристаллический звенит и почти не движется; джунгли — ритм и голоса;
     металлический глух и низок; руинный держится редкими маяками — эхо
     чужого маяка, который никто не выключил */
  crystal: {bpm:[32,44],perc:.10,motif:.5, air:.7, beacon:.55,bass:.3, timbre:"sine"},
  jungle:  {bpm:[58,78],perc:.6, motif:.5, air:.35,beacon:.14,bass:.5, timbre:"triangle"},
  metal:   {bpm:[40,54],perc:.34,motif:.22,air:.18,beacon:.2, bass:.75,timbre:"sawtooth"},
  ruin:    {bpm:[34,48],perc:.16,motif:.34,air:.5, beacon:.5, bass:.5, timbre:"triangle"},
  gas:     {bpm:[28,40],perc:0,  motif:.26,air:.8, beacon:.55,bass:.3, timbre:"sine"}
};
function planetScene(p){
  const r=rng(hashi(p.seed,3141,7));
  /* тип мира лежит в p.type (p.kind не существует — на нём музыка всех планет
     схлопывалась в один мрачный лад) */
  const moods=WORLD_MOOD[p.type]||WORLD_MOOD.rocky;
  const V=wtab(p).voice||WORLD_VOICE[p.type]||WORLD_VOICE.rocky;
  /* тоника уводится далеко от космической (-5): планета всегда звучит из другого
     регистра, поэтому переход с орбиты на грунт слышно сразу */
  const root=(r()<.5?-19:-13)+Math.round(r()*3);
  return {scale:moods[Math.floor(r()*moods.length)|0],
    root,
    bpm:Math.round(V.bpm[0]+r()*(V.bpm[1]-V.bpm[0])),
    pad:.75+r()*.25,
    bass:V.bass*(.85+r()*.3),
    motif:V.motif*(.85+r()*.3),
    perc:V.perc*(.8+r()*.4),
    air:V.air*(.85+r()*.3),
    beacon:V.beacon*(.7+r()*.6),
    timbre:V.timbre,
    vib:(WORLD_VIB[p.type]==null?.3:WORLD_VIB[p.type])*(.8+r()*.4),
    spread:WORLD_SPREAD[p.type]==null?6:WORLD_SPREAD[p.type]};
}
/* вибрато и расстройка голоса по типу мира: лёд и кристалл — чистые, токсичный плывёт,
   вулканический и металлический — шершавые */
const WORLD_VIB={terran:.5,ocean:.4,desert:.7,rocky:.2,ice:0,volcanic:.3,toxic:1,crystal:0,jungle:.8,metal:.2,ruin:.4,gas:.3};
const WORLD_SPREAD={ice:2,crystal:2,volcanic:14,metal:12,toxic:10,ruin:8};
const MUS={ready:false,key:null,sc:null,layers:{},pad:null,timer:null,
  next:0,step:0,intensity:0,iTarget:0,phrase:null,pi:0,shift:0};
const MUS_LAYERS=["pad","bass","motif","perc","air","beacon"];
/* сколько сигнала слой отдаёт в эффекты: маяки и атмосфера живут почти целиком
   в хвосте, перкуссия — почти сухая, иначе каша */
const MUS_WET={pad:.2,bass:.15,motif:.55,perc:.12,air:.8,beacon:.9};
function midiHz(n){return 110*Math.pow(2,n/12);}   // 0 = A2
/* Импульс для реверберации, тоже синтезированный: шумовой хвост с
   экспоненциальным спадом, слегка сглаженный, чтобы не шипел. */
function makeIR(c,secs,decay){
  const n=Math.max(1,Math.floor(c.sampleRate*secs));
  const b=c.createBuffer(2,n,c.sampleRate);
  for(let ch=0;ch<2;ch++){
    const d=b.getChannelData(ch);
    let last=0;
    for(let i=0;i<n;i++){
      last=(last+(Math.random()*2-1)*.35)*.9;
      d[i]=last*Math.pow(1-i/n,decay);
    }
  }
  return b;
}
/* Шум для маяков — свой буфер, длинный и «коричневый»: узкий полосовой фильтр
   с высокой добротностью вытягивает из него чистый тон, но с дыханием,
   которого не даст ни один осциллятор. */
let brownBuf=null;
function brownNoise(c){
  if(!brownBuf||brownBuf.sampleRate!==c.sampleRate){
    const n=Math.floor(c.sampleRate*4);
    brownBuf=c.createBuffer(1,n,c.sampleRate);
    const d=brownBuf.getChannelData(0);
    let last=0;
    for(let i=0;i<n;i++){
      last=(last+(Math.random()*2-1)*.06)/1.02;
      d[i]=clamp(last*7,-1,1);
    }
  }
  const s=c.createBufferSource();
  s.buffer=brownBuf;s.loop=true;
  s.loopStart=Math.random()*3;s.loopEnd=4;      // разный кусок каждому голосу
  return s;
}
function musicInit(){
  if(MUS.ready||!SND.ready)return;
  const c=SND.ctx;
  /* ── хвост: без него длинная нота просто кончается, а нужно, чтобы она
     уходила в пустоту. Задержка с обратной связью даёт «перекличку» маяков,
     конволюция — зал размером с пространство между ними. ── */
  const send=c.createGain();send.gain.value=1;
  const pre=c.createBiquadFilter();
  pre.type="lowpass";pre.frequency.value=3000;
  const dl=c.createDelay(3),fb=c.createGain(),dlp=c.createBiquadFilter();
  dl.delayTime.value=.66;fb.gain.value=.44;
  dlp.type="lowpass";dlp.frequency.value=1700;
  const conv=c.createConvolver();conv.buffer=makeIR(c,5.5,2.4);
  const wRev=c.createGain(),wDly=c.createGain();
  wRev.gain.value=.58;wDly.gain.value=.3;
  send.connect(pre);
  pre.connect(dl);dl.connect(dlp);dlp.connect(fb);fb.connect(dl);   // обратная связь
  pre.connect(conv);dl.connect(conv);                               // эхо тоже в зал
  dl.connect(wDly);conv.connect(wRev);
  wRev.connect(SND.music);wDly.connect(SND.music);
  MUS.fx={send,dl,fb,conv,wRev,wDly};
  for(const k of MUS_LAYERS){
    const g=c.createGain();g.gain.value=0;g.connect(SND.music);
    const w=c.createGain();w.gain.value=MUS_WET[k]||.3;
    g.connect(w);w.connect(send);
    MUS.layers[k]=g;
  }
  /* дрон — три расстроенных генератора, живут постоянно и только перестраиваются.
     Верхний срез оставляет ему воздух, нижний убирает бубнёж, в котором
     раньше тонула мелодия. */
  const oscs=[],base=c.createGain();
  base.gain.value=.5;base.connect(MUS.layers.pad);
  const hp=c.createBiquadFilter();
  hp.type="highpass";hp.frequency.value=130;hp.connect(base);
  const lp=c.createBiquadFilter();
  lp.type="lowpass";lp.frequency.value=1100;lp.connect(hp);
  for(let i=0;i<3;i++){
    const o=c.createOscillator(),g=c.createGain();
    o.type=i?"sawtooth":"triangle";
    g.gain.value=i?.14:.3;
    o.connect(g);g.connect(lp);o.start();
    oscs.push(o);
  }
  MUS.pad={oscs,lp};
  MUS.ready=true;
}
/* ── протяжный голос ──
   Раньше нота была щипком: атака 60 мс и обрыв ровно в конце длительности —
   отсюда «тык-тык-тык». Теперь у ноты медленный наплыв, спад ещё внутри
   длительности и хвост, который переживает следующую ноту: голоса
   накладываются друг на друга и музыка звучит слитно. */
function musNote(layer,hz,when,dur,type,peak,cut){
  const c=SND.ctx;
  const g=c.createGain(),f=c.createBiquadFilter();
  const co=cut||hz*4;
  f.type="lowpass";
  f.frequency.setValueAtTime(co,when);
  f.frequency.exponentialRampToValueAtTime(Math.max(180,co*.3),when+dur);
  const atk=Math.min(1.2,dur*.3),tail=dur*.85;
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),when+atk);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak*.4),when+dur*.6);
  g.gain.exponentialRampToValueAtTime(.0001,when+dur+tail);
  const stop=when+dur+tail+.1;
  /* два генератора: основной тембр и тихая октава сверху — она даёт ноте
     блеск, по которому её слышно поверх дрона, не поднимая громкость */
  /* ── голос мира ──
     Все планеты пели одним и тем же ровным тоном. Теперь у сцены есть
     вибрато (приходит не сразу, а на второй трети ноты — как у живого
     голоса) и расстройка пары генераторов: у льда и кристалла голос чистый,
     у вулканического и металлического — шершавый, у токсичного — плывёт. */
  const sc=MUS.sc||{}, vib=layer==="motif"?(sc.vib||0):0, spread=sc.spread==null?6:sc.spread;
  let lfo=null,lg=null;
  if(vib>0){
    lfo=c.createOscillator();lg=c.createGain();
    lfo.type="sine";lfo.frequency.value=4.6+vib*1.4;
    lg.gain.setValueAtTime(0,when);
    lg.gain.linearRampToValueAtTime(vib*14,when+atk+dur*.3);
    lfo.connect(lg);lfo.start(when);lfo.stop(stop);
  }
  for(let i=0;i<2;i++){
    const o=c.createOscillator(),og=c.createGain();
    o.type=i?"sine":(type||"triangle");
    o.frequency.setValueAtTime(hz*(i?2:1),when);
    o.detune.setValueAtTime(i?spread:-spread,when);
    if(lg)lg.connect(o.detune);
    og.gain.value=i?.16:1;
    o.connect(og);og.connect(f);
    o.start(when);o.stop(stop);
  }
  f.connect(g);g.connect(MUS.layers[layer]);
}
/* ── маяк ──
   Инструмент не из осциллятора, а из шума, продавленного через очень узкий
   полосовой фильтр: получается тон с дыханием — свист, гул далёкой станции.
   Два фильтра (основной тон и октава) плюс еле слышная синусоида для того,
   чтобы высота читалась однозначно. Наплыв в секунды, затухание — в хвост. */
function musBeacon(layer,hz,when,dur,peak){
  const c=SND.ctx;
  const n=brownNoise(c),g=c.createGain();
  const stop=when+dur+.2;
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),when+dur*.34);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak*.5),when+dur*.6);
  g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  for(let i=0;i<2;i++){
    const bp=c.createBiquadFilter(),bg=c.createGain();
    bp.type="bandpass";
    bp.frequency.setValueAtTime(hz*(i?2:1),when);
    /* лёгкий увод частоты за время ноты — маяк «качается», а не стоит колом */
    bp.frequency.linearRampToValueAtTime(hz*(i?2:1)*(1+(i?.004:-.003)),stop);
    bp.Q.value=i?16:26;
    bg.gain.value=i?.5:1;
    n.connect(bp);bp.connect(bg);bg.connect(g);
  }
  const o=c.createOscillator(),og=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(hz,when);
  og.gain.value=.07;
  o.connect(og);og.connect(g);
  g.connect(MUS.layers[layer]);
  n.start(when);n.stop(stop);
  o.start(when);o.stop(stop);
}
function musPerc(when,peak){
  const c=SND.ctx;
  /* два голоса: низкий толчок на сильной доле и сухой щелчок — на призрачном
     ударе щелчок один, на акценте оба. Одним толчком ритм читался метрономом. */
  const thump=peak>=.45, tick=peak<.45||peak>=.9;
  if(thump){
    const n=noise(c),g=c.createGain(),bp=c.createBiquadFilter();
    bp.type="bandpass";bp.Q.value=1.4;bp.frequency.value=180;
    g.gain.setValueAtTime(.0001,when);
    g.gain.exponentialRampToValueAtTime(peak,when+.006);
    g.gain.exponentialRampToValueAtTime(.0001,when+.16);
    n.connect(bp);bp.connect(g);g.connect(MUS.layers.perc);
    n.start(when);n.stop(when+.2);
  }
  if(tick){
    const n=noise(c),g=c.createGain(),bp=c.createBiquadFilter();
    bp.type="bandpass";bp.Q.value=6;bp.frequency.value=1500+(MUS.sc&&MUS.sc.bpm||50)*8;
    const pk=Math.max(.05,Math.min(peak,.6)*.5);
    g.gain.setValueAtTime(.0001,when+.004);
    g.gain.exponentialRampToValueAtTime(pk,when+.008);
    g.gain.exponentialRampToValueAtTime(.0001,when+.06);
    n.connect(bp);bp.connect(g);g.connect(MUS.layers.perc);
    n.start(when);n.stop(when+.08);
  }
}
function musicSetScene(key,scene){
  if(MUS.key===key)return;
  MUS.key=key;MUS.sc=scene;
  /* своя фраза на локацию: seed из ключа сцены, поэтому одна и та же планета
     всегда встречает одной и той же мелодией */
  let ks=0;for(let i=0;i<key.length;i++)ks=(ks*31+key.charCodeAt(i))|0;
  const stp=SCALES[scene.scale]||SCALES.minor;
  MUS.phrase=makePhrase(hashi(ks,scene.bpm,SCALE_KEYS.indexOf(scene.scale)+1),stp);
  /* ── ответ, круг, рисунок ──
     Одна фраза на локацию приедалась за две минуты: к ней теперь есть
     вторая — тот же seed, но контур зеркален, и они идут попеременно, как
     вопрос и ответ. Гармония ходила по одной тонике всё время — дрон и бас
     теперь идут по кругу из четырёх ступеней, по такту на каждую; круг свой
     у каждой сцены. Ударные были «удар через шаг» — стали рисунком на восемь
     шагов с акцентами и редким призрачным ударом. */
  const rr=rng(hashi(ks,0xB0B,scene.bpm));
  MUS.phraseB=MUS.phrase.map(n=>n&&{...n,deg:stp.length-1-n.deg,chord:n.chord?0:(rr()<.25?4:0)});   // та же длина — зеркальный контур
  const cyc=[[0,5,3,4],[0,3,4,0],[0,2,5,4],[0,4,5,3],[0,5,0,4]][Math.floor(rr()*5)];
  MUS.prog=cyc.map(i=>stp[Math.min(i,stp.length-1)]||0);
  MUS.percPat=[];for(let i=0;i<8;i++)MUS.percPat.push(i===0?1.1:(i===4?.9:(rr()<.35?.55:0)));
  MUS.restAt=rr()<.5?56:-1;           // у половины сцен в конце круга — тишина на восемь шагов
  MUS.bar=-1;
  MUS.pi=0;MUS.shift=0;
  if(!MUS.ready)return;
  const c=SND.ctx,t=c.currentTime;
  const sc=SCALES[scene.scale]||SCALES.minor;
  /* дрон перестраивается плавно — за 2.5 с, поэтому смена локации не рвёт звук */
  const f0=midiHz(scene.root);
  MUS.pad.oscs.forEach((o,i)=>{
    const iv=[0,sc[4]||7,12][i];
    o.frequency.setTargetAtTime(f0*Math.pow(2,iv/12)*(1+(i-1)*.004),t,.9);
  });
  MUS.pad.lp.frequency.setTargetAtTime(520+(scene.bpm-38)*9,t,.9);
  for(const k of MUS_LAYERS)
    MUS.layers[k].gain.setTargetAtTime(layerLevel(k,scene),t,.9);
}
function layerLevel(k,scene){
  const w=scene[k]||0;
  if(typeof expQuiet==="function"&&expQuiet())return 0;   /* минута тишины (M159) */
  /* перкуссия и плотность мотива подчиняются напряжению: в бою музыка
     собирается сама, а после — расходится, без отдельного «боевого трека» */
  if(k==="perc")return (w+MUS.intensity*.5)*.2;
  /* мелодия — то, ради чего музыка вообще есть: она должна быть отчётливо
     слышна. Ноты теперь длинные и накладываются, поэтому уровень ниже
     прежнего — суммарная громкость получается та же. */
  if(k==="motif")return (w+MUS.intensity*.25)*.34;
  if(k==="pad")return w*.14;
  if(k==="bass")return w*.2;
  if(k==="beacon")return w*.3;
  return w*.22;
}
/* ── фраза: короткая мелодия, выведенная из seed сцены ──
   Раньше мотив был случайными нотами и потому не запоминался. Теперь у каждой
   локации и каждой планеты своя узнаваемая фраза, которая повторяется с вариациями. */
function makePhrase(seed,steps){
  const r=rng(seed>>>0||1);
  const len=[8,12,16][Math.floor(r()*3)];
  const out=[];
  let deg=Math.floor(r()*steps.length);
  for(let i=0;i<len;i++){
    if(r()<.24){out.push(null);continue;}           // пауза — фразе нужен воздух
    /* ходим по ступеням лада шагами, а не прыгаем случайно: так получается
       мелодия, а не набор нот. От краёв диапазона отражаемся, а не упираемся —
       при обрезке мелодия залипала на одной ноте. */
    deg+=Math.floor(r()*5)-2;
    if(deg<0)deg=-deg;
    if(deg>steps.length-1)deg=2*(steps.length-1)-deg;
    deg=clamp(deg,0,steps.length-1);
    /* длительность в шагах сетки — от полутора до четырёх: ноты заведомо
       длиннее шага, поэтому соседние всегда перекрываются хвостами */
    out.push({deg,
      oct:r()<.18?1:(r()<.14?-1:0),
      len:[1.5,2,2,3,4][Math.floor(r()*5)],
      /* иногда нота — не одна, а созвучие: терция или квинта поверх */
      chord:r()<.28?(r()<.5?2:4):0});
  }
  return out;
}
/* планировщик на аудио-часах: раскладывает ноты вперёд, поэтому просадки FPS
   музыку не дёргают — она вообще не привязана к requestAnimationFrame */
function musicTick(){
  if(!MUS.ready||!MUS.sc||!audioOn()||!SND.ready||SND.ctx.state!=="running")return;
  const c=SND.ctx,sc=MUS.sc,steps=SCALES[sc.scale]||SCALES.minor;
  /* Сетка — половинка, а не восьмая. Шаг в 2-3 секунды: у ноты есть время
     распуститься и затухнуть. В бою напряжение стягивает сетку вдвое —
     музыка становится нервнее сама, без переключения на «боевой трек». */
  const beat=60/sc.bpm;
  const grid=beat*(2-MUS.intensity*.9);
  if(MUS.next<c.currentTime)MUS.next=c.currentTime+.05;
  /* ── дыхание ──
     Уровни слоёв были константами сцены: музыка не становилась ни тише, ни
     гуще. Медленная волна в полторы-две минуты водит мелодию и воздух на
     треть — этого хватает, чтобы возвращение фразы было слышно как возвращение. */
  const br=.72+.28*Math.sin(c.currentTime/(75+(sc.bpm%17)*4)*TAU);
  if(MUS.layers.motif){
    MUS.layers.motif.gain.setTargetAtTime(layerLevel("motif",sc)*br,c.currentTime,2.5);
    MUS.layers.air.gain.setTargetAtTime(layerLevel("air",sc)*(1.3-br*.5),c.currentTime,2.5);
  }
  while(MUS.next<c.currentTime+3.2){
    const t=MUS.next,s=MUS.step;
    const r=rng(hashi(s,MUS.key.length*31,777));
    /* гармонический круг: такт — 16 шагов, дрон и бас переходят на ступень круга */
    const bar=Math.floor(s/16)%4, hroot=sc.root+((MUS.prog&&MUS.prog[bar])||0);
    if(bar!==MUS.bar&&MUS.pad){
      MUS.bar=bar;
      const f0=midiHz(hroot);
      MUS.pad.oscs.forEach((o,i)=>{
        const iv=[0,steps[4]||7,12][i];
        o.frequency.setTargetAtTime(f0*Math.pow(2,iv/12)*(1+(i-1)*.004),t,1.6);
      });
    }
    /* бас — редкая очень длинная педаль под всем остальным, на ступени круга */
    if(sc.bass>0&&s%4===0)
      musNote("bass",midiHz(hroot-12),t,Math.min(grid*3.6,11),"triangle",.34,220);
    /* тишина: в конце круга у половины сцен мелодия молчит восемь шагов */
    const rest=MUS.restAt>=0&&s>=MUS.restAt;
    /* мелодия идёт по фразе, а не наугад; каждый проход фраза может сместиться
       на ступень — так она не приедается, оставаясь узнаваемой. Фразы две:
       вопрос и ответ чередуются проходами. */
    if(sc.motif>0&&MUS.phrase&&MUS.phrase.length&&!rest){
      const L=MUS.phrase.length;
      const ph=(Math.floor(MUS.pi/L)%2===1&&MUS.phraseB&&MUS.phraseB.length===L)?MUS.phraseB:MUS.phrase;
      const note=ph[MUS.pi%L];
      if(MUS.pi>0&&MUS.pi%L===0)
        MUS.shift=(r()<.45)?[0,2,-2,4][Math.floor(r()*4)]:0;
      MUS.pi++;
      if(note){
        const di=clamp(note.deg+MUS.shift,0,steps.length-1);
        /* потолок: на медленных планетах grid доходит до 3.7 с, и без него
           нота с хвостом жила бы под полминуты, наслаиваясь сама на себя */
        const dur=Math.min(grid*note.len,8);
        /* на две октавы выше тоники: там мелодию слышно поверх дрона и баса */
        const base=sc.root+steps[di]+24+note.oct*12;
        musNote("motif",midiHz(base),t,dur,sc.timbre,.34,3600);
        if(note.chord){
          const ci=clamp(di+note.chord,0,steps.length-1);
          /* созвучие вступает чуть позже основной ноты — так оно слышно
             как ответ, а не как одновременный аккорд */
          musNote("motif",midiHz(sc.root+steps[ci]+24),t+grid*.22,dur*.8,
                  sc.timbre,.16,2800);
        }
      }
    }
    /* маяки: редкие очень долгие тоны из шума, врозь с мелодией */
    if(sc.beacon>0&&(s%3===0||r()<.3)){
      const deg=steps[Math.floor(r()*steps.length)];
      const oct=[0,12,12,24][Math.floor(r()*4)];
      musBeacon("beacon",midiHz(sc.root+deg+12+oct),t+r()*grid,
                4.5+r()*5.5,.34+r()*.2);
    }
    if(sc.perc>0||MUS.intensity>.25){
      const pp=MUS.percPat?MUS.percPat[s%8]:(s%2===0?1:0);
      if(pp>0)musPerc(t,(.5+MUS.intensity*.4)*pp);
      else if(MUS.intensity>.25&&s%2===0)musPerc(t,.4+MUS.intensity*.4);   // в бою сетка плотнее
    }
    if(sc.air>0&&r()<.16){
      const deg=steps[Math.floor(r()*steps.length)];
      musNote("air",midiHz(sc.root+deg+24),t,3.5+r()*3.5,"sine",.24,2600);
    }
    MUS.next+=grid;MUS.step=(s+1)%64;
  }
}
/* какая сцена сейчас — считается из состояния игры, а не задаётся вручную */
function musicSceneNow(){
  if(G.mode==="map")return ["map",MUSIC_SCENES.map];
  /* ── музыка кантины ──
     Свет и толпа развели пять залов, а звучали они одинаково: на станции
     играла одна `dock` независимо от того, кабак это после смены или тихая
     комната отдыха. Отдельного трека не нужно — сцена наклоняется, как везде
     в этом движке: лад, темп и плотность слоёв. Комбинат — низко и глухо,
     с ударом, потому что там пьют после работы; научная — тонко, почти без
     баса; аванпост — одна линия и много воздуха, играть некому; верфь —
     ровный рабочий ход; торговый узел остаётся эталонной `dock`.
     Звучит это только в кантине: у прилавка музыка станции прежняя. */
  if(G.mode==="dock"&&tab==="cantina"&&G.st){
    const B={
      indust: {scale:"phrygian", root:-12,bpm:52,perc:.45,bass:.7, motif:.3, air:.1},
      sci:    {scale:"kumoi",    root:-3, bpm:40,perc:0,  bass:.15,motif:.35,air:.5},
      outpost:{scale:"insen",    root:-10,bpm:36,perc:.05,bass:.25,motif:.18,air:.6},
      yard:   {scale:"dorian",   root:-7, bpm:58,perc:.3, bass:.55,motif:.3, air:.15}
    }[G.st.stype];
    if(B)return ["cant:"+G.st.stype,Object.assign({},MUSIC_SCENES.dock,B)];
  }
  if(G.mode==="dock")return ["dock",MUSIC_SCENES.dock];
  if(G.mode==="belt")return ["belt",MUSIC_SCENES.belt];
  if(G.mode==="landing"&&G.land)return ["landing",MUSIC_SCENES.landing];
  if(G.mode==="cave"&&G.surf)return ["cave:"+G.surf.p.seed,
    Object.assign({},MUSIC_SCENES.cave,{root:MUSIC_SCENES.cave.root})];
  if(G.mode==="dig"&&G.dig)return ["dig:"+G.dig.p.seed,MUSIC_SCENES.dig];
  if(G.mode==="surface"&&G.surf)return ["surface:"+G.surf.p.seed,planetScene(G.surf.p)];
  /* база, абордаж и заход в атмосферу гиганта раньше проваливались в «космос» */
  if(G.mode==="base"&&G.base)return ["base",
    Object.assign({},MUSIC_SCENES.dock,{scale:"pentMin",root:-9,bpm:50,perc:.35,air:.3,beacon:.2})];
  if(G.mode==="raid"&&G.raid)return ["raid",
    Object.assign({},MUSIC_SCENES.belt,{scale:"phrygian",root:-12,bpm:74,perc:.7,motif:.35,beacon:.05})];
  if(G.mode==="scoop"&&G.scoop)return ["scoop",
    Object.assign({},MUSIC_SCENES.map,{scale:"overtone",root:-8,bpm:38,air:.8,motif:.2})];
  return ["system",MUSIC_SCENES.system];
}
function musicStop(){
  if(!MUS.ready)return;
  const t=SND.ctx.currentTime;
  for(const k of MUS_LAYERS)MUS.layers[k].gain.setTargetAtTime(0,t,.4);
  MUS.key=null;
}
