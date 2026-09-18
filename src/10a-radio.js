/* ══════════════ радио: треки и генератор ══════════════ */
/* Второй голос музыки, рядом с эмбиентом `10-music`. Эмбиент — слои без начала и
   конца; радио — пьесы с формой, около полутора минут, потом следующая, между ними —
   подстройка по шкале. Ориентир — советская космическая музыка 70-х: «Зодиак»,
   Артемьев, «Электроника», берлинская школа, Жарр.

   Пьесы различаются не тональностью и темпом, а АРХЕТИПОМ (RADIO_ARCH): набором
   инструментов, ритмом ударных, рисунком баса, манерой мелодии и формой. «Зодиак» —
   «Поливокс» и струнные на полутемпе; берлинская школа — без барабанов, секвенсор и
   бипы, слои входят по одному; «Солярис» — хор, терменвокс, педаль; вальс; «Позывные» —
   марш и медная фанфара; шкатулка — колокольчики и органчик; босса со станции — ритм
   советской драм-машины; Жарр — ровный мотор и волны шума.

   Образцы автора (шесть MP3 из Suno, 19.09) сняты по числам: тональность, темп и
   аккорды по тактам (хромаграмма, scratchpad transcribe.py) — первые шесть треков
   играют их гармонию. Мелодии свои: из плотного микса мелодия честно не снимается.

   Источник (G.opts.audio.src): «tracks» — пьесы из таблицы, одинаковые при каждом
   включении, их листают; «gen» — бесконечный генератор, каждая пьеса из нового зерна
   (счётчик в сейве), архетип тоже из зерна; «ambient» — прежняя музыка `10-music`.
   Игра наклоняет пьесу на ходу: опасность — фригийский лад, пульс и бочка; кантина —
   мажор и босса; станция — тише; карта и грунт — без барабанов. Квадратных волн нет:
   с ними выходил «Марио». */
const RADIO_ARCH={
  /* pad — подложка, lead — солист, drums — ритм, bassA/bassB — рисунок баса в теме/бридже,
     arp — фигурация, rh — ритм мелодии. Все — медленные и тёмные: это музыка пустого
     корабля, а не парада. Бас нигде не щиплет: он тянется и сползает между аккордами. */
  zodiac:  {pad:"strings",lead:"polivoks",drums:"half",  bassA:"glide", bassB:"pedal", arp:"seq16",rh:"sparse",bell:.3,dr:.5,cut:3200},
  berlin:  {pad:"strings",lead:"saw",     drums:"none",  bassA:"seq",   bassB:"drone", arp:"bleep",rh:"long",  bell:.2,dr:0, cut:2800,build:true},
  solaris: {pad:"choir",  lead:"theremin",drums:"none",  bassA:"drone", bassB:"glide", arp:"none", rh:"long",  bell:.8,dr:0, cut:2400},
  stalker: {pad:"cluster",lead:"duduk",   drums:"tabla", bassA:"drone", bassB:"glide", arp:"drip", rh:"long",  bell:.2,dr:.35,cut:2600},
  ternii:  {pad:"choir",  lead:"brass",   drums:"timp",  bassA:"pedal", bassB:"drone", arp:"none", rh:"long",  bell:.3,dr:.6,cut:3000,epic:true},
  box:     {pad:"organ",  lead:"bell",    drums:"none",  bassA:"sparse",bassB:"drone", arp:"up8",  rh:"sparse",bell:0, dr:0, cut:2800},
  jarre:   {pad:"strings",lead:"saw",     drums:"soft",  bassA:"drone", bassB:"glide", arp:"seq16",rh:"sparse",bell:.2,dr:.4,cut:3400,waves:true},
  waltz:   {pad:"strings",lead:"flute",   drums:"waltz", bassA:"wz",    bassB:"wzwalk",arp:"none", rh:"waltz", bell:.4,dr:.35,cut:2800,bar:12},
  /* «Письма мёртвого человека»: кластер, далёкий колокол, ветер, ни одного удара;
     «Сибириада» (Артемьев): хорал синтезаторных струнных, очень медленно, эпично */
  pisma:   {pad:"cluster",lead:"bell",    drums:"none",  bassA:"drone", bassB:"drone", arp:"drip", rh:"long",  bell:.6,dr:0, cut:2200,waves:true},
  sibir:   {pad:"strings",lead:"saw",     drums:"none",  bassA:"drone", bassB:"pedal", arp:"none", rh:"long",  bell:.2,dr:0, cut:2600,epic:true}
};
const RADIO_TRACKS=[
  /* первые шесть — по образцам автора: тональность и аккорды с MP3; темп сбавлен */
  {n:"Тихий сигнал возвращения",arch:"berlin", s:1961,bpm:84, key:3, mode:"minor",
    prog:{A:[3,3,0,0,3,3,0,0],B:[2,4,4,4,0,0,2,4]}},
  /* «Безмолвная орбита» — с 1:00 образца: аккорды по тактам и контур мелодии сняты
     (scratchpad orbit.py), октавные скачки выправлены рукой */
  {n:"Безмолвная орбита",       arch:"solaris",s:1957,bpm:76, key:0, mode:"minor",lead:"flute",pad:"strings",
    prog:{intro:[2,2,0,0],A:[2,2,0,0,4,4,1,5],B:[0,0,2,6,3,0,2,5],out:[0,0]},
    mel:{A:[[[0,1,2],[2,4,2],[6,4,4],[10,6,2],[12,4,4]],
            [[0,1,12],[12,-1,2],[14,1,2]],
            [[0,1,2],[2,4,2],[4,1,4],[12,0,2],[14,2,2]],
            [[0,0,2],[2,2,2],[6,2,6],[14,3,2]],
            [[0,1,2],[8,0,8]],
            [[2,0,2],[8,0,8]],
            [[0,0,4],[4,4,2],[8,6,4],[12,-1,2],[14,6,2]],
            [[0,6,2],[2,-1,2],[4,2,4],[8,3,8]]],
         B:[[[0,-1,2],[2,3,6],[8,4,2],[10,0,6]],
            [[0,0,6],[10,4,2]],
            [[0,0,2],[8,-1,8]],
            [[0,2,6],[8,6,2],[12,5,2],[14,5,2]],
            [[0,1,2],[8,0,2],[14,0,2]],
            [[2,0,2],[8,0,8]],
            [[0,0,4],[4,4,2],[8,6,4],[12,-1,2],[14,6,2]],
            [[0,6,2],[2,-1,2],[4,2,4],[8,3,8]]]}},
  {n:"Дистанционный сигнал",    arch:"box",    s:1965,bpm:72, key:3, mode:"minor",
    prog:{A:[0,0,3,1,4,0,4,5],B:[0,0,3,3,1,0,0,1]}},
  {n:"Космический оптимизм",    arch:"jarre",  s:1975,bpm:88, key:0, mode:"minor",
    prog:{A:[0,0,4,4,6,6,3,3],B:[3,3,6,6,2,5,0,0]}},
  {n:"Космический рассвет",     arch:"sibir",  s:1971,bpm:80, key:-4,mode:"dorian",
    prog:{A:[0,0,4,4,1,1,3,3],B:[4,4,1,1,3,3,0,0]}},
  {n:"Попутный звёздный ветер", arch:"zodiac", s:1963,bpm:90, key:5, mode:"minor",
    prog:{A:[0,0,4,4,3,3,0,0],B:[6,6,3,3,5,5,0,0]}},
  {n:"Станция «Заря»",          arch:"box",    s:1986,bpm:68, key:-2,mode:"phryg",lead:"theremin"},
  {n:"Дальний рейс",            arch:"zodiac", s:1977,bpm:84, key:2, mode:"dorian",lead:"saw",pad:"organ"},
  {n:"Позывные с Луны",         arch:"berlin", s:1959,bpm:78, key:-4,mode:"minor",lead:"bell"},
  {n:"Полдень над кольцами",    arch:"jarre",  s:1999,bpm:92, key:1, mode:"minor",lead:"polivoks",pad:"organ"},
  {n:"Хор далёкой планеты",     arch:"solaris",s:1968,bpm:66, key:-2,mode:"dorian"},
  {n:"Вальс невесомости",       arch:"waltz",  s:1972,bpm:112,key:0, mode:"minor"},
  {n:"Позывные «Утренней звезды»",arch:"solaris",s:1980,bpm:72,key:3,mode:"phryg",pad:"cluster",arp:"bleep"},
  {n:"Зона",                    arch:"stalker",s:1979,bpm:64, key:-3,mode:"phryg"},
  {n:"Ступень к звёздам",       arch:"ternii", s:1981,bpm:72, key:-4,mode:"minor"},
  {n:"Буря на Венере",          arch:"solaris",s:1962,bpm:60, key:-5,mode:"minor",arp:"drip",pad:"cluster"},
  {n:"Последнее письмо",        arch:"pisma",  s:1986,bpm:62, key:-1,mode:"phryg"},
  {n:"Долгая зима на Титане",   arch:"sibir",  s:1978,bpm:70, key:-3,mode:"minor"},
  {n:"Пустой причал",           arch:"berlin", s:1983,bpm:80, key:1, mode:"phryg",lead:"duduk",pad:"cluster"},
  {n:"Эхо в отсеке",            arch:"pisma",  s:1990,bpm:66, key:-6,mode:"minor",lead:"theremin",arp:"bleep"}
];
const RADIO_MODES={
  minor:[0,2,3,5,7,8,10], dorian:[0,2,3,5,7,9,10], major:[0,2,4,5,7,9,11],
  mixo:[0,2,4,5,7,9,10],  phryg:[0,1,3,5,7,8,10], harm:[0,2,3,5,7,8,11]
};
/* аккорды по тактам, ступени лада; у пьесы без своей гармонии — один из этих кругов */
const RADIO_PROG_SETS=[
  {A:[0,5,2,6,0,5,3,4],B:[5,2,6,0,5,3,6,6]},        // i VI III VII — «Зодиак»
  {A:[0,0,5,5,3,3,4,4],B:[5,5,6,6,0,0,4,4]},
  {A:[0,3,0,4,0,3,6,4],B:[3,3,0,0,5,5,4,4]},
  {A:[0,6,5,6,0,6,5,4],B:[2,2,5,5,3,3,4,4]},        // сползание вниз — Артемьев
  {A:[0,2,5,4,0,2,3,4],B:[5,3,0,4,5,3,6,4]},
  {A:[0,0,3,3,0,0,4,4],B:[5,5,3,3,1,1,4,4]},         // i iv v — простой минор
  {A:[0,6,0,6,3,5,4,4],B:[2,2,6,6,3,3,4,4]}          // i VII — фригийское качание
];
const RADIO_PROGS={intro:[0,5,0,6],brk:[5,0,5,6],out:[5,6,0,0],
  danger:[0,5,6,0,0,5,6,4],cantina:[0,3,4,0,0,5,3,4]};
/* наклон по месту: множители слоёв, а у опасности и кантины — свой ритм и лад */
const RADIO_MOOD={
  travel:  {k:1,  dr:1,  bass:1,  lead:1,  arp:1,  pad:1,  cut:1},
  drift:   {k:1,  dr:0,  bass:.7, lead:.8, arp:.7, pad:1.1,cut:.8},
  station: {k:1,  dr:.4, bass:.7, lead:.7, arp:.5, pad:1,  cut:.85},
  /* опасность: фригийский лад, литавры, бас октавой ниже — тяжелее, не быстрее */
  danger:  {k:1,  dr:1,  bass:1.2,lead:.7, arp:1,  pad:.7, cut:1.2, mode:"phryg",prog:"danger",drums:"timp",bass_:"danger"},
  /* кантина: дорийский лад и щётки — теплее, но всё та же тоска */
  cantina: {k:1.04,dr:.8,bass:1,  lead:1,  arp:.6, pad:.9, cut:1.15,mode:"dorian",prog:"cantina",drums:"soft",bass_:"cantina"}
};
const RADIO_GEN_A=["Тихий","Дальний","Безмолвный","Лунный","Звёздный","Северный","Последний","Попутный","Орбитальный","Вечерний","Солнечный","Синий"];
const RADIO_GEN_B=["сигнал","рейс","маяк","причал","рассвет","дрейф","позывной","перигей","вокзал","меридиан","пеленг","горизонт"];
/* дрейф: на границе каждой части пьеса чуть меняет темп (±15 %), лад (минорные
   родственники), тон (±2 полутона) и баланс слоёв — та же пьеса, но настроение плывёт */
const RADIO_DRIFT_MODES=["minor","dorian","phryg","harm","minor"];
const RADIO={ctx:null,bus:null,layers:null,step:0,next:0,trk:null,form:null,bars:0,
  tempoK:1,keyShift:0,modeNow:null,lv:{pad:1,lead:1,arp:1},
  mel:{},prevLead:0,bassPrev:0,mood:"travel",moodT:"travel",title:"",sec:"intro"};
const RADIO_LAYERS=["pad","bass","lead","harm","arp","kick","snare","hat","bell","fx"];

function radioSrc(){const a=G.opts.audio||{};return a.src==="gen"||a.src==="ambient"?a.src:"tracks";}
function radioOn(){return radioSrc()!=="ambient";}
function radioNow(){return RADIO.title||"";}
/* свойство пьесы: своё у трека, иначе у архетипа */
function radioA(k){const T=RADIO.trk;if(T&&T[k]!=null)return T[k];const A=RADIO_ARCH[T&&T.arch]||RADIO_ARCH.zodiac;return A[k];}

/* граф: своя шина в SND.music, свой отзвук-задержка, зал берётся у эмбиента */
function radioBuild(){
  const c=SND.ctx;
  if(RADIO.ctx===c&&RADIO.bus)return;
  RADIO.ctx=c;
  RADIO.bus=c.createGain();RADIO.bus.gain.value=0;RADIO.bus.connect(SND.music);
  RADIO.lp=c.createBiquadFilter();RADIO.lp.type="lowpass";RADIO.lp.frequency.value=3200;RADIO.lp.Q.value=.3;
  /* тёплая сатурация ленты: тихое проходит как есть, пики мягко сжимаются — звук
     перестаёт быть «полифонией из телефона» */
  const sat=c.createWaveShaper(),cu=new Float32Array(1024);
  for(let i=0;i<1024;i++){const x=i*2/1023-1;cu[i]=Math.tanh(1.6*x)/Math.tanh(1.6);}
  sat.curve=cu;sat.oversample="2x";
  RADIO.lp.connect(sat);sat.connect(RADIO.bus);
  const d=c.createDelay(2),fb=c.createGain(),dt=c.createBiquadFilter(),dw=c.createGain();
  fb.gain.value=.42;dt.type="lowpass";dt.frequency.value=1800;dw.gain.value=.22;
  d.connect(dt);dt.connect(fb);fb.connect(d);dt.connect(dw);dw.connect(RADIO.bus);
  RADIO.dly=d;
  const wet=c.createGain();wet.gain.value=1;
  if(MUS.fx&&MUS.fx.send&&MUS.fx.send.context===c)wet.connect(MUS.fx.send);
  RADIO.layers={};
  for(const k of RADIO_LAYERS){
    const g=c.createGain();g.gain.value=0;g.connect(RADIO.lp);
    if(k==="pad"){const pw=c.createGain();pw.gain.value=.45;g.connect(pw);pw.connect(wet);}   // пэд в зал вполовину, иначе каша
    else if(k!=="kick"&&k!=="hat"&&k!=="bass")g.connect(wet);
    if(k==="lead"||k==="arp"||k==="bell")g.connect(d);
    RADIO.layers[k]=g;
  }
  /* хорус подложки: одна модулированная задержка рядом с сухим */
  RADIO.padIn=c.createGain();
  const sf=c.createBiquadFilter();sf.type="lowpass";sf.frequency.value=2400;
  const shp=c.createBiquadFilter();shp.type="highpass";shp.frequency.value=90;shp.connect(sf);
  const cd=c.createDelay(.05);cd.delayTime.value=.012;
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.6;lg.gain.value=.004;
  lfo.connect(lg);lg.connect(cd.delayTime);lfo.start();
  RADIO.padIn.connect(shp);sf.connect(RADIO.layers.pad);sf.connect(cd);cd.connect(RADIO.layers.pad);
  const n=c.sampleRate,nb=c.createBuffer(1,n,n),nd=nb.getChannelData(0);
  const r=rng(4242);for(let i=0;i<n;i++)nd[i]=r()*2-1;
  RADIO.noise=nb;
}

/* ── генератор: не выбирает готовый архетип, а СОБИРАЕТ пьесу из частей ──
   Подложка, солист, ударные, два рисунка баса, фигурация, манера мелодии, контур,
   тембр баса, срез, задержка — каждое из своего списка; гармония — случайное блуждание
   по графу аккордов; форма — случайная последовательность частей; сверх того случайные
   события: модуляция на тон в последней теме, «провал» каждые N тактов (остаются бас и
   солист), соло без подложки, три четверти. Два зерна дают две по-разному устроенные
   пьесы, а не одну в другой тональности. */
const RADIO_CHORD_GRAPH={0:[5,3,4,2,6,5],5:[3,0,4,6,2],3:[4,0,5,1],4:[0,5,3,0],2:[5,3,6],6:[0,5,3,4],1:[4,0,3]};
const RADIO_GEN_C=["у Кассиопеи","на Венере","в Зоне","за кольцами","в тумане","с орбиты","без ответа","после связи","на восьмые сутки","в тени Титана"];
function radioGenTrack(n){
  const r=rng(hashi(n,0x5EED,77));
  const pick=a=>a[Math.floor(r()*a.length)],ch=p=>r()<p;
  const bar=ch(.12)?12:16;
  const mode=pick(["minor","minor","dorian","phryg","phryg","harm"]);
  /* гармония: блуждание по графу, аккорд держится такт или два */
  const walk=(len)=>{const out=[];let d=0;while(out.length<len){const h=ch(.35)?2:1;for(let k=0;k<h&&out.length<len;k++)out.push(d);d=pick(RADIO_CHORD_GRAPH[d]||[0]);}out[len-1]=pick([4,6,4,3]);return out;};
  const prog={A:walk(8),B:walk(8)};
  if(ch(.5))prog.A[0]=0;
  /* форма: вступление, 3–5 частей, конец */
  const form=[["intro",pick([2,4,4,8])]];
  const parts=pick([["A","A2","B","A"],["A","B","A","solo","A"],["A","B","brk","A2"],["A","A2","solo","B","A"],["A","B","A2","B"],["A","brk","A","B","A"]]);
  for(const q of parts)form.push([q,q==="brk"||q==="solo"?4:8]);
  form.push(["out",2]);
  const drums=bar===12?"waltz":pick(["none","none","none","half","soft","tabla","timp"]);
  const pad=pick(["strings","choir","organ","cluster","cluster","strings","strings"]);
  const lead=pick(["polivoks","saw","theremin","flute","brass","bell","duduk","theremin"]);
  const cap=w=>w[0].toUpperCase()+w.slice(1);
  const name=ch(.3)?cap(pick(RADIO_GEN_B))+" "+pick(RADIO_GEN_C):pick(RADIO_GEN_A)+" "+pick(RADIO_GEN_B)+(ch(.25)?" "+pick(RADIO_GEN_C):"");
  const bassKeys=["drone","drone","glide","pedal","sparse"];
  return {n:name,arch:"gen",s:hashi(n,1957,3)>>>0,
    bpm:Math.round((bar===12?100:drums==="none"?58:66)+r()*(bar===12?24:26)),key:Math.floor(r()*9)-5,mode,bar,prog,form,
    pad,lead,drums,padB:ch(.3)?pick(["choir","strings","cluster"]):null,
    bassA:bar===12?"wz":pick(bassKeys),bassB:bar===12?"wzwalk":pick(bassKeys),
    arp:pick(["seq16","bleep","drip","none","none","none"]),rh:bar===12?"waltz":pick(["long","long","sparse"]),
    contour:pick(["fall","fall","arch","zig"]),bassTone:"drone",
    bell:r()*.7,dr:.25+r()*.4,cut:Math.round(2000+r()*1600),dlyMul:pick([3,4,6]),
    waves:ch(.2),build:drums==="none"&&ch(.5),epic:ch(.15),
    modUp:ch(.35)?2:0,dropEvery:ch(.4)?pick([4,8]):0};
}
function radioForm(){
  if(RADIO.trk.form)return RADIO.trk.form;
  const bpm=RADIO.trk.bpm*(radioA("bar")===12?.75:1);
  /* берлинская школа нарастает слоями — длинное вступление вместо бриджа */
  if(radioA("build"))return [["intro",8],["A",8],["A2",8],["B",4],["A",8],["out",2]];
  /* полторы минуты при любом темпе: медленной пьесе — короче форма */
  if(bpm<86)return [["intro",4],["A",8],["B",8],["A",8],["out",2]];
  if(bpm>108)return [["intro",4],["A",8],["A2",8],["B",8],["brk",4],["A",8],["out",2]];
  return [["intro",4],["A",8],["A2",8],["B",8],["A",8],["out",2]];
}
function radioLoad(t){
  const a=G.opts.audio;
  let trk;
  if(radioSrc()==="gen"){a.genN=(a.genN|0)+1;trk=radioGenTrack(a.genN);}   // счётчик в сейве: не повторяется и между вечерами
  else{
    trk=RADIO_TRACKS[((a.track|0)%RADIO_TRACKS.length+RADIO_TRACKS.length)%RADIO_TRACKS.length];
    if(!trk.prog)trk.prog=RADIO_PROG_SETS[(trk.s>>>2)%RADIO_PROG_SETS.length];
    trk.form=null;
  }
  RADIO.trk=trk;RADIO.title=trk.n;RADIO.r=rng(trk.s>>>0||1);
  RADIO.form=radioForm();RADIO.bars=RADIO.form.reduce((s,f)=>s+f[1],0);
  RADIO.mel={};RADIO.step=0;RADIO.prevLead=0;RADIO.bassPrev=0;RADIO.bassPick={};
  RADIO.next=t;RADIO.src=radioSrc();RADIO.sec="intro";
  RADIO.tempoK=1;RADIO.keyShift=0;RADIO.modeNow=null;RADIO.lv={pad:1,lead:1,arp:1};RADIO.specNext=t+15+RADIO.r()*30;
  radioMix(t,true);
  if(RADIO.tuned)radioTune(t-.6);RADIO.tuned=true;
  const g=RADIO.bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(.0001,t);g.linearRampToValueAtTime(1,t+1.5);
}
/* конец пьесы: трек листается сам, генератор берёт новое зерно */
function radioAdvance(){
  const a=G.opts.audio;
  if(radioSrc()==="tracks")a.track=((a.track|0)+1)%RADIO_TRACKS.length;
}
function radioSkip(dir){
  const a=G.opts.audio;
  if(radioSrc()==="tracks")a.track=(((a.track|0)+(dir|0))%RADIO_TRACKS.length+RADIO_TRACKS.length)%RADIO_TRACKS.length;
  RADIO.trk=null;          // следующая выборка загрузит новую пьесу
}

function radioMoodNow(){
  if(G.mode==="dock"&&typeof tab!=="undefined"&&tab==="cantina")return "cantina";
  if(G.mode==="raid"||(MUS.intensity||0)>.3)return "danger";
  if(G.mode==="dock"||G.mode==="base")return "station";
  if(G.mode==="map"||G.mode==="scoop"||G.mode==="surface"||G.mode==="cave"||G.mode==="dig"||G.mode==="landing")return "drift";
  return "travel";
}
function radioDrumStyle(){const m=RADIO_MOOD[RADIO.mood];return (m&&m.drums)||radioA("drums");}
function radioMix(t,instant){
  const m=RADIO_MOOD[RADIO.mood]||RADIO_MOOD.travel,sec=RADIO.sec||"A";
  const off=(sec==="intro"||sec==="brk"||sec==="out"),solo=sec==="solo";
  /* барабаны: у архетипа без ударных их нет и в полёте; опасность и кантина приносят свои */
  const dr=(radioDrumStyle()==="none"?0:(radioA("dr")||.6))*m.dr;
  /* берлинская школа: во вступлении слои входят по одному — секвенсор, потом бипы, потом подложка */
  let arpIn=1,padIn=1;
  if(radioA("build")&&sec==="intro"){const bi=Math.floor(RADIO.step/(radioBar()*2));arpIn=bi>=1?1:0;padIn=bi>=2?1:0;}
  const Q=.6;   // всё, кроме маяка и колокола, — тише: они должны выступать из тумана
  const lv=RADIO.lv||{pad:1,lead:1,arp:1};
  const L={pad:(radioA("pad")==="none"||solo?0:(radioA("epic")?1.1:.9))*m.pad*padIn*Q*lv.pad,bass:.9*m.bass*Q,lead:off?0:m.lead*(solo?1.2:1)*Q*lv.lead,
    harm:(sec==="A2"||sec==="B"?.35*m.lead:0)*Q,arp:(radioA("arp")==="none"||solo?0:.55)*lv.arp*m.arp*arpIn*(sec==="brk"?.5:1)*Q,
    kick:dr*(off&&sec!=="brk"?0:1)*Q,snare:dr*(off?0:.8)*Q,hat:dr*(sec==="brk"?0:.5)*Q,
    bell:Math.max(1.6,radioA("bell")*2),fx:radioA("waves")?.5*Q:0};
  const glide=(p,v,tc)=>{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(v,t+(instant?.05:tc));};
  for(const k of RADIO_LAYERS)glide(RADIO.layers[k].gain,L[k],1.5);
  glide(RADIO.lp.frequency,Math.min(9000,radioA("cut")*m.cut*.8),2);
  RADIO.dly.delayTime.setValueAtTime(radioS16()*(radioA("dlyMul")||3),t);
}
function radioBar(){return radioA("bar")===12?12:16;}   // вальс — три четверти
function radioBpm(){return RADIO.trk.bpm*.5*RADIO.tempoK*((RADIO_MOOD[RADIO.mood]||{}).k||1);}   // вдвое медленнее таблицы: время здесь тянется
function radioS16(){return 60/radioBpm()/4;}
function radioScale(){
  const m=RADIO_MOOD[RADIO.mood];
  return RADIO_MODES[(m&&m.mode)||RADIO.modeNow||RADIO.trk.mode]||RADIO_MODES.minor;
}
function radioDeg(d){const s=radioScale(),o=Math.floor(d/7);return s[((d%7)+7)%7]+12*o;}

/* планировщик: зовётся из musicTick (таймер 60 мс, аудио-часы) */
function radioTick(){
  const c=SND.ctx;
  radioBuild();
  const t0=c.currentTime;
  if(!RADIO.trk||RADIO.src!==radioSrc()){radioLoad(t0+.05);}
  RADIO.moodT=radioMoodNow();
  /* упреждение 2 с: при 0.3 с любая задержка потока (загрузка сцены, тяжёлый кадр)
     сваливала ноты кучей и оставляла дыру. Если всё же отстали — не догоняем, а
     пропускаем: ноты в прошлом играть кучей нельзя */
  if(RADIO.next<t0){RADIO.step+=Math.floor((t0-RADIO.next)/radioS16());RADIO.next=t0+.1;}
  while(RADIO.next<t0+4){
    const t=RADIO.next;
    radioStep(t);
    RADIO.next+=radioS16();RADIO.step++;
    if(RADIO.step>=RADIO.bars*radioBar()){radioAdvance();radioLoad(RADIO.next);}
  }
}
function radioWhere(bar){
  let b=bar;
  for(let i=0;i<RADIO.form.length;i++){const [name,len]=RADIO.form[i];if(b<len)return {name,barIn:b,len,i,last:i>=RADIO.form.length-2};b-=len;}
  return {name:"out",barIn:0,len:1,i:RADIO.form.length,last:true};
}
function radioStep(t){
  const B=radioBar(),s=RADIO.step%B,bar=Math.floor(RADIO.step/B),w=radioWhere(bar),r=RADIO.r;
  if(s===0){
    let ch=false;
    if(RADIO.sec!==w.name){
      RADIO.sec=w.name;ch=true;
      /* дрейф настроения на границе части; тон и лад — не в первой и не в последней, чтобы
         начало и конец пьесы были в её тональности */
      const rr=RADIO.r;
      RADIO.tempoK=Math.max(.8,Math.min(1.2,RADIO.tempoK+(rr()-.5)*.2));
      if(w.i>0&&!w.last&&bar%3===0){       // только на такте, где бас берётся заново: иначе дрон висел в старом тоне
        if(rr()<.4)RADIO.modeNow=RADIO_DRIFT_MODES[Math.floor(rr()*RADIO_DRIFT_MODES.length)];
        if(rr()<.35)RADIO.keyShift=[-2,-1,0,1,2][Math.floor(rr()*5)];
      }else if(w.i===0||w.last){RADIO.modeNow=null;RADIO.keyShift=0;}
      RADIO.lv={pad:.7+rr()*.4,lead:.7+rr()*.4,arp:.5+rr()*.6};
    }
    if(RADIO.mood!==RADIO.moodT){RADIO.mood=RADIO.moodT;ch=true;}
    if(radioA("build")&&w.name==="intro"&&bar%2===0)ch=true;      // следующий слой входит
    if(ch)radioMix(t,false);
    /* последние два такта — затухание в следующую пьесу */
    if(w.name==="out"&&w.barIn===0){const g=RADIO.bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value||1,t);
      g.linearRampToValueAtTime(.0001,t+radioS16()*B*2);}
  }
  const m=RADIO_MOOD[RADIO.mood]||RADIO_MOOD.travel;
  /* своя гармония пьесы; опасность и кантина подменяют её, кроме пьес с готовой мелодией */
  const TP=RADIO.trk.prog;
  const prog=(m.prog&&!RADIO.trk.mel)?RADIO_PROGS[m.prog]:
    (TP&&TP[w.name])||RADIO_PROGS[w.name]||(TP&&TP.A)||RADIO_PROG_SETS[0].A;
  const cd=prog[w.barIn%prog.length],nextCd=prog[(w.barIn+1)%prog.length];
  /* модуляция на тон в последней теме; «провал» — такт, где остаются бас и солист */
  const key=RADIO.trk.key-12+RADIO.keyShift;   // 0 = A2 → бас в первой октаве
  const DE=radioA("dropEvery")|0,drop=DE>0&&bar%DE===DE-1&&w.name!=="intro"&&w.name!=="out";
  if(s===0&&!drop)radioPad(t,key,cd,radioS16()*B,(w.name==="B"&&radioA("padB"))||radioA("pad"));
  radioBass(t,s,key,cd,w,nextCd);
  if(!drop)radioArp(t,s,key,cd);
  if(!drop)radioDrums(t,s,w);
  radioMelody(t,s,w,key,cd);
  if(s===0&&bar%2===0&&r()<.5)radioBell(t,key,cd);
  /* маяк: раз в несколько тактов — одна звонкая высокая нота с эхом, как позывной */
  if(s===0&&bar%2===1&&r()<.4)radioBeacon(t+radioS16()*Math.floor(r()*8),key,cd);
  if(s===0&&bar%8===0&&radioA("waves"))radioWave(t,radioS16()*B*2);
  /* обертоновое облако: раз в минуту-полторы, на ~20 с — см. radioSpectral */
  if(s===0&&(RADIO.specNext==null||t>=RADIO.specNext)&&w.name!=="out"){RADIO.specNext=t+50+r()*50;radioSpectral(t,key);}
}

/* ── мелодия: сочиняется один раз на пьесу и повторяется — так её запоминают ── */
const RADIO_RH={
  busy:  [[0,6,8,12],[0,4,10],[0,3,8,12],[0,3,6,8,12],[0,2,4,8,12]],
  sparse:[[0,8],[0,6,8],[0,12],[0,4,8]],
  long:  [[0],[0,8],[0,10],[0],[4]],
  dotted:[[0,3,4,6,8,11,12],[0,3,4,8,11,12],[0,4,6,8,12]],   // пунктир — позывные, марш
  waltz: [[0,4,8],[0,6,8],[0,4,6,8],[0,8,10]]
};
const RADIO_EN={busy:[[0,8],[0,6],[0,4,8]],sparse:[[0],[0,8]],long:[[0]],dotted:[[0,3,4,8],[0,8]],waltz:[[0,4],[0],[0,8]]};
function radioPhrase(){
  const r=RADIO.r,pick=a=>a[Math.floor(r()*a.length)],rh=radioA("rh")||"busy",B=radioBar();
  /* манера: фанфара прыгает по звукам аккорда вверх, шкатулка и босса ходят ступенями,
     «Солярис» и берлинцы тянут и сползают вниз */
  const jump=[0,2,4,0,2,-3];
  const CT={fall:[-1,-1,-2,1],rise:[1,1,2,-1],zig:[-2,2,-1,1,3,-3]};
  const ct=radioA("contour"),step=CT[ct]||(rh==="long"?[-1,-1,-2,1]:rh==="dotted"?[1,2,-1,1]:[-1,-1,1,-2]);
  const mk=(on)=>{const out=[];let d=pick([0,2,4]);
    on.forEach((st,i)=>{
      if(st%4===0)d=pick(jump);                   // на доле — звук аккорда
      else d+=pick(ct==="arch"?(st<B/2?CT.rise:CT.fall):step);   // между — шаг по контуру
      out.push({st,d,dur:(on[i+1]==null?B:on[i+1])-st});
    });return out;};
  const b1=mk(pick(RADIO_RH[rh])),b2=mk(pick(RADIO_EN[rh]));
  b2[b2.length-1].d=pick([0,2]);
  return [b1,b2];
}
function radioMelody(t,s,w,key,cd){
  if(w.name==="intro"||w.name==="brk"||w.name==="out")return;
  const k=w.name==="A2"||w.name==="solo"?"A":w.name;
  /* готовая мелодия (народная): такты по кругу, ступени от тоники */
  const FM=RADIO.trk.mel&&(RADIO.trk.mel[k]||RADIO.trk.mel.A);
  if(FM){
    const fb=FM[w.barIn%FM.length],fn=fb&&fb.find(x=>x[0]===s);
    if(!fn)return;
    const fd=fn[2]*radioS16()*.92;
    radioLead(t,key+12+radioDeg(fn[1]),fd,"lead");
    if(w.name!=="A")radioLead(t,key+12+radioDeg(fn[1]-2),fd,"harm");
    return;
  }
  if(!RADIO.mel[k]){
    const p=radioPhrase(),r=RADIO.r;
    const v=p.map((b,bi)=>b.map((n,i)=>({...n,d:(bi===0&&i===b.length-1)?n.d+[1,2,-1][Math.floor(r()*3)]:n.d})));
    RADIO.mel[k]=[p,p,v,p];
  }
  const mel=RADIO.mel[k],n=mel[Math.floor(w.barIn/2)%4][w.barIn%2].find(x=>x.st===s);
  if(!n)return;
  const dur=n.dur*radioS16()*.92;
  /* мелодия на октаву выше тоники, не на две: ниже — темнее */
  radioLead(t,key+12+radioDeg(cd+n.d),dur,"lead");
  if(w.name!=="A")radioLead(t,key+12+radioDeg(cd+n.d-2),dur,"harm");
}

/* ── голоса ── */
function radioEnv(g,t,a,peak,hold,rel){
  const end=Math.max(t+a+.005,t+hold);
  g.setValueAtTime(.0001,t);g.exponentialRampToValueAtTime(peak,t+a);
  g.setValueAtTime(peak,end);g.exponentialRampToValueAtTime(.0001,end+rel);
  return end+rel;
}
/* подложка: струнный ансамбль (три пилы), хор (пила через форманты «а»),
   органчик «Электроника» (регистры 8′, 4′, 2⅔′ без фильтра, ровный звук) */
function radioPad(t,key,cd,dur,kind){
  kind=kind||radioA("pad");
  if(kind==="none")return;
  /* кластер АНС: восемь синусов, расстроенных на четверть тона, дышат медленно */
  if(kind==="cluster"){
    const c=SND.ctx,lfo=c.createOscillator(),lg=c.createGain();
    lfo.frequency.value=.09;lg.gain.value=.005;lfo.connect(lg);
    let last=t;
    for(let i=0;i<5;i++){
      const o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();
      o.type="sine";o.frequency.value=midiHz(key+12+radioDeg(cd+[0,2,4,7,9,6,8][i]))*(1+(RADIO.r()-.5)*.006);   // расстройка в 5 центов, не в четверть тона
      lg.connect(g.gain);p.pan.value=(i/4)*1.4-.7;
      const end=radioEnv(g.gain,t,2,.016,dur-.5,3);last=Math.max(last,end);
      o.connect(g);g.connect(p);p.connect(RADIO.padIn);o.start(t);o.stop(end+.1);
    }
    lfo.start(t);lfo.stop(last+.1);
    return;
  }
  const c=SND.ctx;
  /* созвучие на каждом такте своё: трезвучие, септаккорд, sus2, add9, квинта с ноной —
     все из ступеней лада, поэтому в миноре они минорные, во фригийском — фригийские */
  const VO=[[0,2,4],[0,2,6],[0,1,4],[0,4,8],[0,4,7],[0,2,7]];   // три голоса: четвёртый забивал середину
  /* воздух: тихий синус двумя октавами выше — спектр раздвигается вверх, каши в середине нет */
  {const c=SND.ctx,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();
    o.type="sine";o.frequency.value=midiHz(key+36+radioDeg(cd+[0,4,7][Math.floor(RADIO.r()*3)]));
    p.pan.value=RADIO.r()*1.2-.6;const end=radioEnv(g.gain,t+.5,2.5,.007,dur-1,3);
    o.connect(g);g.connect(p);p.connect(RADIO.layers.bell);o.start(t+.5);o.stop(end+.1);}
  VO[Math.floor(RADIO.r()*VO.length)].forEach((iv,i)=>{
    t+=i?.04+RADIO.r()*.05:0;                    // голоса вступают вразнобой, а не залпом
    const f=midiHz(key+(kind==="choirhi"?12:0)+radioDeg(cd+iv)),g=c.createGain(),p=c.createStereoPanner();   // октавой ниже солиста: середина — ему
    p.pan.value=-.4+i*.27;
    const org=kind==="organ";
    const end=radioEnv(g.gain,t,org?.3:1.4,org?.012:.018,dur-.1,org?1:2.6);   // растушёвка: наплыв полторы секунды, хвост две с половиной
    let dst=g;
    /* аккордеон: пила сквозь язычковую полосу, с дрожью; детский хор — форманты «и» октавой выше */
    if(kind==="accordion"){
      dst=c.createBiquadFilter();dst.type="bandpass";dst.frequency.value=900;dst.Q.value=1.2;
      const ag=c.createGain();ag.gain.value=.7;dst.connect(ag);ag.connect(g);
      const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=6;lg.gain.value=.15;
      lfo.connect(lg);lg.connect(g.gain);lfo.start(t);lfo.stop(end+.1);
    }
    if(kind==="choir"||kind==="choirhi"){
      dst=c.createGain();
      const hi=kind==="choirhi";
      for(const [hz,q,v] of hi?[[400,8,1.4],[2200,9,1.2]]:[[730,7,1.6],[1090,8,1.1]]){
        const bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=hz*(1+(i-1.5)*.02);bp.Q.value=q;
        const bg=c.createGain();bg.gain.value=v*(hi?1.1:2.2);dst.connect(bp);bp.connect(bg);bg.connect(g);
      }
    }
    if(org){
      for(const [mul,v] of [[1,1],[2,.5],[3,.3]]){
        const o=c.createOscillator(),og=c.createGain();o.type="sine";o.frequency.value=f*mul;og.gain.value=v;
        o.connect(og);og.connect(g);o.start(t);o.stop(end+.05);
      }
    }else for(const ct of [-11,0,11]){        // унисон из трёх: пять грузили процессор до треска
      const o=c.createOscillator(),og=c.createGain();o.type="sawtooth";o.frequency.value=f;o.detune.value=ct+(RADIO.r()-.5)*3;
      og.gain.value=.8;o.connect(og);og.connect(dst);o.start(t);o.stop(end+.05);
    }
    g.connect(p);p.connect(RADIO.padIn);
  });
}

/* ── бас: рисунки, а не один «пум-пум» ──
   Так бас пишут в космической музыке 70-х — берлинская школа, Жарр, «Зодиак»:
   остинато секвенсора шестнадцатыми, скользящие длинные ноты, квинтовый ход,
   ходячий бас к следующему аккорду, синкопа с шестнадцатыми подхватами, арпеджио по
   аккорду, педаль с хроматическим подходом, босса (тоника—квинта с пунктиром). Шаг,
   что играть (r — тоника, 3/5/7 — ступени аккорда, 8 — октава, a — хроматический
   подход к корню следующего аккорда, w — шаг по ладу к нему), длина в шестнадцатых. */
const RADIO_BASS={
  fifth: [[0,"r",3],[6,"5",2],[8,"r",3],[14,"5",2]],
  walk:  [[0,"r",4],[4,"3",4],[8,"5",4],[12,"a",4]],
  zodiac:[[0,"r",2],[3,"r",1],[4,"8",2],[7,"r",1],[8,"5",2],[10,"8",2],[12,"r",2],[14,"a",2]],
  arp:   [[0,"r",2],[2,"3",2],[4,"5",2],[6,"8",2],[8,"5",2],[10,"3",2],[12,"r",2],[14,"a",2]],
  pedal: [[0,"r",10],[10,"r",2],[14,"a",2]],
  sync:  [[0,"r",3],[3,"r",3],[6,"5",4],[10,"r",2],[12,"8",2],[14,"7",2]],
  sparse:[[0,"r",12],[12,"5",4]],
  run:   [[0,"r",4],[4,"5",2],[6,"8",2],[8,"7",2],[10,"5",2],[12,"3",2],[14,"w",2]],
  /* секвенсор берлинской школы: остинато шестнадцатыми, фильтр открывается по такту */
  seq:   [[0,"r",1],[1,"r",1],[2,"8",1],[3,"r",1],[4,"5",1],[5,"r",1],[6,"8",1],[7,"7",1],
          [8,"r",1],[9,"r",1],[10,"8",1],[11,"r",1],[12,"5",1],[13,"3",1],[14,"8",1],[15,"5",1]],
  /* скользящий: две длинные ноты, вторая подъезжает глиссандо */
  glide: [[0,"r",8],[8,"5",6],[14,"a",2]],
  /* ровный пульс восьмыми — тревога, мотор */
  pulse: [[0,"r",1],[2,"r",1],[4,"r",1],[6,"r",1],[8,"r",1],[10,"r",1],[12,"r",1],[14,"5",1]],
  bossa: [[0,"r",3],[3,"5",1],[4,"5",4],[8,"r",3],[11,"5",1],[12,"5",4]],
  tango: [[0,"r",3],[3,"5",1],[4,"r",2],[6,"5",2],[8,"r",3],[11,"5",1],[12,"3",2],[14,"a",2]],
  drone: [[0,"r",16]],
  wz:    [[0,"r",8],[8,"5",4]],
  wzwalk:[[0,"r",4],[4,"5",4],[8,"a",4]]
};
const RADIO_BASS_POOL={
  theme:["drone","glide","pedal"],
  bridge:["glide","pedal","drone"],
  calm:["drone","sparse","pedal"],
  danger:["glide","pedal"],
  cantina:["pedal","glide","sparse"]
};
/* рисунок из пула выбирается по зерну пьесы — один раз, поэтому трек всегда звучит одинаково */
function radioBassPick(pool){
  if(RADIO_BASS[pool])return pool;
  if(!RADIO.bassPick[pool]){const P=RADIO_BASS_POOL[pool]||RADIO_BASS_POOL.theme,h=hashi(RADIO.trk.s|0,pool.length*977,31)>>>0;RADIO.bassPick[pool]=P[h%P.length];}
  return RADIO.bassPick[pool];
}
function radioBass(t,s,key,cd,w,nextCd){
  const mo=RADIO_MOOD[RADIO.mood]||{},calm=RADIO.mood==="drift"||RADIO.mood==="station";
  let name;
  if(radioBar()===12)name=(w.name==="B"||RADIO.mood==="cantina")?"wzwalk":"wz";
  else if(mo.bass_)name=radioBassPick(mo.bass_);
  else if(calm&&radioA("bassA")!=="seq")name=radioBassPick("calm");
  else if(w.name==="intro"||w.name==="out")name=radioA("build")?"seq":radioBassPick("calm");
  else if(w.name==="B"||w.name==="brk"||w.name==="solo")name=radioBassPick(radioA("bassB"));
  else name=radioBassPick(radioA("bassA"));
  let pat=RADIO_BASS[name];
  /* бас звучит втрое реже: одно «пумм» на три такта, и тянется все три — на новом
     аккорде он не берётся заново, а сползает (см. голос) */
  const bar=Math.floor(RADIO.step/radioBar()),rare=name!=="seq";
  if(rare){if(bar%3!==0)return;pat=[[0,"r",radioBar()]];}      // одна нота, на три такта
  const n=pat.find(x=>x[0]===s);
  if(!n)return;
  const root=radioDeg(cd);
  let nr=radioDeg(nextCd);while(nr-root>6)nr-=12;while(root-nr>6)nr+=12;
  const what=n[1];
  const semi=what==="r"?root:what==="8"?root+12:what==="3"?radioDeg(cd+2):what==="5"?radioDeg(cd+4):
    what==="7"?radioDeg(cd+6)-12:
    /* a/w: подход к корню следующего аккорда соседней ступенью ЛАДА — хроматика фальшивила */
    (nr>root?radioDeg(nextCd-1)-(radioDeg(nextCd)-nr):radioDeg(nextCd+1)-(radioDeg(nextCd)-nr));
  const dur=Math.max(.08,n[2]*radioS16()*.9)*(rare?3:1);
  const lowD=RADIO.mood==="danger"&&what==="r"?-12:0;
  radioBassVoice(t,key+semi+lowD,dur,s===0?1:.8,name,s);
}
/* тембр баса — свой у пьесы: щипок пилой, круглый саб или «синтезаторный» с квакушкой */
function radioBassVoice(t,midi,dur,acc,pat,s){
  const T=RADIO.trk,c=SND.ctx,tone=(pat==="drone"||pat==="pedal"||pat==="sparse"||pat==="glide")?"drone":(T.bassTone||"round");
  const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),hz=midiHz(midi);
  f.type="lowpass";
  if(tone==="drone"){
    /* тянущийся бас: пила и синус сквозь медленный фильтр, наплыв в полсекунды,
       к новой ноте — глиссандо, а не новый удар */
    o.type="sawtooth";f.Q.value=1.2;
    f.frequency.setValueAtTime(220,t);f.frequency.linearRampToValueAtTime(420,t+dur*.5);f.frequency.linearRampToValueAtTime(200,t+dur);
    const sb=c.createOscillator();sb.type="sine";sb.connect(f);
    const from=RADIO.bassPrev||hz;
    for(const q of [o,sb]){q.frequency.setValueAtTime(from,t);q.frequency.exponentialRampToValueAtTime(hz,t+.8);}
    RADIO.bassPrev=hz;
    /* «пумм»: мягкий толчок в четверть секунды, потом тон оседает и висит до конца */
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.14*acc,t+.25);
    g.gain.exponentialRampToValueAtTime(.07*acc,t+1.6);g.gain.setValueAtTime(.07*acc,t+Math.max(1.7,dur-.3));
    g.gain.exponentialRampToValueAtTime(.0001,t+dur+2);const end=t+dur+2;
    o.connect(f);f.connect(g);g.connect(RADIO.layers.bass);o.start(t);sb.start(t);o.stop(end+.05);sb.stop(end+.05);
    return;
  }
  if(tone==="round"){
    o.type="triangle";f.frequency.value=600;f.Q.value=.7;
    const sb=c.createOscillator();sb.type="sine";sb.frequency.value=hz;sb.connect(f);
    sb.start(t);sb.stop(t+dur+.3);
  }else if(tone==="synth"){
    o.type="sawtooth";f.Q.value=9;
    f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(1800,t+.04);f.frequency.exponentialRampToValueAtTime(260,t+.25);
  }else{
    o.type="sawtooth";f.Q.value=5;
    f.frequency.setValueAtTime(1300,t);f.frequency.exponentialRampToValueAtTime(200,t+.16);
  }
  if(pat==="seq"){         // секвенсор: фильтр дышит по такту, как ручка cutoff на Moog
    const cf=500+900*(.5+.5*Math.sin((RADIO.step/16)*Math.PI*.5+s*.39));
    f.frequency.cancelScheduledValues(t);f.frequency.setValueAtTime(cf*1.8,t);f.frequency.exponentialRampToValueAtTime(cf*.5,t+.1);
  }
  if(pat==="glide"&&RADIO.bassPrev){o.frequency.setValueAtTime(RADIO.bassPrev,t);o.frequency.exponentialRampToValueAtTime(hz,t+.3);}
  else o.frequency.value=hz;
  RADIO.bassPrev=hz;
  const end=radioEnv(g.gain,t,pat==="glide"?.08:.006,(pat==="seq"?.075:.1)*acc,Math.max(.02,dur-.08),.12);
  o.connect(f);f.connect(g);g.connect(RADIO.layers.bass);o.start(t);o.stop(end+.05);
  /* саб: чистый синус октавой ниже, короче ноты — низ ощущается, а не бубнит */
  if(tone!=="round"&&midi>-20){const sb=c.createOscillator(),sg=c.createGain();sb.type="sine";sb.frequency.value=hz/2;
    const e2=radioEnv(sg.gain,t,.01,.07*acc,Math.max(.02,dur*.6),.08);sb.connect(sg);sg.connect(RADIO.layers.bass);sb.start(t);sb.stop(e2+.05);}
}

/* фигурация: шестнадцатые по аккорду, восьмые вверх, или «бипы» — случайные высокие
   ноты лада, как у вычислительной машины в кино */
function radioArp(t,s,key,cd){
  const key_=key;
  const kind=RADIO.mood==="danger"?"seq16":radioA("arp");
  if(kind==="none")return;
  let d;
  if(kind==="drip"){        // капля: короткий синус с падением высоты, редко
    if(RADIO.r()>.12)return;
    const c=SND.ctx,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();
    const dh=midiHz(key+48+radioDeg([0,2,4,7][Math.floor(RADIO.r()*4)]));
    o.type="sine";o.frequency.setValueAtTime(dh*2,t);o.frequency.exponentialRampToValueAtTime(dh,t+.07);
    p.pan.value=RADIO.r()*1.6-.8;
    const end=radioEnv(g.gain,t,.003,.02,.01,.1);
    o.connect(g);g.connect(p);p.connect(RADIO.layers.arp);o.start(t);o.stop(end+.03);return;
  }
  if(kind==="seq16")d=[0,2,4,7,9,7,4,2][s%8];
  else if(kind==="up8"){if(s%2)return;d=[0,2,4,7][(s>>1)%4]+((s>>3)%2?7:0);}
  else{if(RADIO.r()>.28)return;d=Math.floor(RADIO.r()*10);}
  const c=SND.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
  o.type=kind==="bleep"?"sine":"triangle";o.frequency.value=midiHz(key+36+radioDeg(cd+d)+(kind==="bleep"?12:0));
  f.type="lowpass";f.frequency.value=1400;p.pan.value=kind==="bleep"?RADIO.r()*1.6-.8:Math.sin(RADIO.step*.4)*.6;
  const end=radioEnv(g.gain,t,.003,kind==="bleep"?.007:.009,.01,kind==="bleep"?.06:.12);
  o.connect(f);f.connect(g);g.connect(p);p.connect(RADIO.layers.arp);o.start(t);o.stop(end+.03);
}
/* солист: пила, «Поливокс» (резонансный фильтр щёлкает), терменвокс (чистый тон,
   вязкий подъезд), флейта (синус с дыханием), медь (фильтр открывается медленно —
   «вау», как у фанфары на синтезаторе), колокольчик (FM, коротко) */
function radioLead(t,midi,dur,layer){
  const c=SND.ctx,hz=midiHz(midi),harm=layer==="harm",kind=harm?"harm":radioA("lead");
  if(kind==="bell"){radioBellVoice(t,hz,Math.min(1.6,dur+.8),RADIO.layers.lead,.03);return;}
  const o1=c.createOscillator(),o2=c.createOscillator();
  const th=kind==="theremin",fl=kind==="flute",br=kind==="brass",pv=kind==="polivoks",du=kind==="duduk",wo=kind==="wobble";
  o1.type=th||fl?"sine":wo?"triangle":harm?"triangle":"sawtooth";
  o2.type=th?"triangle":fl||wo?"sine":harm?"sine":"sawtooth";
  o2.detune.value=th?2:fl?1200:wo?1200:pv?14:br?7:9;
  /* подъезд к ноте: у терменвокса на каждой, у дудука форшлаг снизу, у прочих изредка */
  const from=du?hz*Math.pow(2,-1/12):!harm&&RADIO.prevLead&&(th||RADIO.r()<.2)?RADIO.prevLead:hz;
  for(const o of [o1,o2]){o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(hz,t+(th?.22:du?.12:.06));}
  if(!harm)RADIO.prevLead=hz;
  /* вибрато: у «плывущего» синтезатора быстрое и сразу, у дудука широкое и позднее */
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=wo?6.5:fl?5.2:du?4.2:4.8;
  lg.gain.setValueAtTime(wo?hz*.012:0,t);lg.gain.linearRampToValueAtTime(wo?hz*.012:0,t+.18);lg.gain.linearRampToValueAtTime(hz*(th?.012:fl?.003:du?.014:wo?.012:.005),t+(du?.9:.6));
  lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);
  const f=c.createBiquadFilter();f.type="lowpass";f.Q.value=pv?9:br?3:du?3:2;
  if(du){f.frequency.setValueAtTime(1100,t);f.frequency.linearRampToValueAtTime(1500,t+dur*.6);f.frequency.linearRampToValueAtTime(900,t+dur);}
  else
  if(br){f.frequency.setValueAtTime(500,t);f.frequency.exponentialRampToValueAtTime(2600,t+.12);f.frequency.exponentialRampToValueAtTime(1600,t+.5);}
  else{f.frequency.setValueAtTime(pv?2400:fl?2600:harm?1200:1700,t);f.frequency.exponentialRampToValueAtTime(pv?800:fl?2000:harm?900:1200,t+(pv?.5:.8));}
  const g=c.createGain(),o2g=c.createGain();o2g.gain.value=fl?.12:1;
  const end=radioEnv(g.gain,t,fl?.3:du?.4:br?.3:th?.5:.4,harm?.016:fl?.034:du?.03:br?.028:.026,dur,fl?.9:du?1.4:1.2);
  o1.connect(f);o2.connect(o2g);o2g.connect(f);f.connect(g);g.connect(RADIO.layers[layer]);
  /* тело: у пил тихая октава снизу — солист перестаёт быть тонким */
  if(pv){const o3=c.createOscillator(),g3=c.createGain();o3.type="sawtooth";o3.frequency.value=hz/2;g3.gain.value=.35;
    o3.connect(g3);g3.connect(f);o3.start(t);o3.stop(end+.05);}
  for(const o of [o1,o2,lfo]){o.start(t);o.stop(end+.05);}
  if(fl){          // дыхание флейты: короткий шум на атаке
    const n=c.createBufferSource(),bp=c.createBiquadFilter(),ng=c.createGain();
    n.buffer=RADIO.noise;bp.type="bandpass";bp.frequency.value=hz*2;bp.Q.value=2;
    ng.gain.setValueAtTime(.008,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.12);
    n.connect(bp);bp.connect(ng);ng.connect(RADIO.layers.lead);n.start(t,RADIO.r()*.5,.15);n.stop(t+.15);
  }
}
/* ударные: рисунок по архетипу, опасность — пульс, кантина — босса */
function radioDrums(t,s,w){
  const st=radioDrumStyle();
  if(st==="none")return;
  const B=radioBar();
  if(st==="waltz"||B===12){                                   // раз-два-три: бас-щётка-щётка
    if(s===0)radioKick(t);if(s===4||s===8)radioHat(t,.8);return;
  }
  const fill=w.barIn===w.len-1&&w.name!=="out";
  if(st==="half"){
    if(s===0||s===10)radioKick(t);if(s===8)radioSnare(t,1);
    if(s%4===2)radioHat(t,.6);
    if(fill&&s>=12)radioSnare(t,.5);
  }else if(st==="march"){                                     // позывные: барабан с дробью
    if(s===0||s===8)radioKick(t);if(s===4||s===12)radioSnare(t,.9);
    if(w.barIn%2===1&&(s===14||s===15))radioSnare(t,.45);
    if(fill&&s>=8&&s%2===0)radioSnare(t,.55);
  }else if(st==="bossa"){                                     // «босса-нова» советской драм-машины
    if(s===0||s===3||s===8||s===11)radioKick(t,.7);
    if([0,3,6,10,13].includes(s))radioRim(t);
    if(s%2===0)radioHat(t,.45);
  }else if(st==="motor"){                                     // ровный мотор: мягкая бочка на каждую долю
    if(s%4===0)radioKick(t,.6);if(s===4||s===12)radioSnare(t,.6);
    if(s%2===0)radioHat(t,.4);
    if(fill&&s>=12)radioSnare(t,.4);
  }else if(st==="tabla"){                                     // редкая табла: низкий «ге», высокий «на»
    if(s===0||s===10)radioTabla(t,1);if(s===6||s===13)radioTabla(t,0);
  }else if(st==="tango"){                                     // хабанера
    if(s===0||s===3||s===4||s===6||s===8||s===11||s===12||s===14)radioKick(t,s%4===0?.9:.5);
    if(s===4||s===12)radioSnare(t,.7);if(s===8||s===14)radioRim(t);
  }else if(st==="timp"){                                      // литавры: удар на раз, дробь в конец
    if(s===0)radioTimp(t,1);if(s===8)radioTimp(t,.6);
    if(fill&&s>=10)radioTimp(t,.3+(s-10)*.1);
  }else if(st==="soft"){                                      // щётки
    if(s===0)radioKick(t,.5);if(s===8)radioRim(t);if(s%2===0)radioHat(t,.3);
  }else if(st==="pulse"){                                     // тревога
    if(s%4===0||s===14)radioKick(t);if(s===8)radioSnare(t,1);
    if(s%2===1)radioHat(t,.35);if(s%4===2)radioHat(t,.6);
  }
}
function radioTabla(t,low){
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(low?190:620,t);o.frequency.exponentialRampToValueAtTime(low?110:560,t+(low?.18:.05));
  g.gain.setValueAtTime(low?.14:.06,t);g.gain.exponentialRampToValueAtTime(.001,t+(low?.3:.08));
  o.connect(g);g.connect(RADIO.layers.kick);o.start(t);o.stop(t+.35);
}
function radioTimp(t,v){
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain(),n=c.createBufferSource(),ng=c.createGain(),bp=c.createBiquadFilter();
  o.type="sine";o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(58,t+.5);
  g.gain.setValueAtTime(.3*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.9);
  n.buffer=RADIO.noise;bp.type="lowpass";bp.frequency.value=400;
  ng.gain.setValueAtTime(.08*v,t);ng.gain.exponentialRampToValueAtTime(.001,t+.1);
  o.connect(g);g.connect(RADIO.layers.kick);n.connect(bp);bp.connect(ng);ng.connect(RADIO.layers.kick);
  o.start(t);o.stop(t+1);n.start(t,RADIO.r()*.5,.12);n.stop(t+.12);
}
function radioKick(t,v){
  v=v||1;
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(40,t+.16);
  g.gain.setValueAtTime(.16*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.6);
  o.connect(g);g.connect(RADIO.layers.kick);o.start(t);o.stop(t+.35);
}
function radioSnare(t,v){
  const c=SND.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  n.buffer=RADIO.noise;f.type="bandpass";f.frequency.value=1600;f.Q.value=.8;
  g.gain.setValueAtTime(.12*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);
  n.connect(f);f.connect(g);g.connect(RADIO.layers.snare);n.start(t,RADIO.r()*.5,.2);n.stop(t+.22);
  const o=c.createOscillator(),og=c.createGain();o.type="triangle";
  o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(150,t+.06);
  og.gain.setValueAtTime(.07*v,t);og.gain.exponentialRampToValueAtTime(.001,t+.08);
  o.connect(og);og.connect(RADIO.layers.snare);o.start(t);o.stop(t+.1);
}
/* обод: короткий деревянный щелчок — «клава» драм-машины */
function radioRim(t){
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type="triangle";o.frequency.value=1750;f.type="bandpass";f.frequency.value=1700;f.Q.value=5;
  g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);
  o.connect(f);f.connect(g);g.connect(RADIO.layers.snare);o.start(t);o.stop(t+.05);
}
function radioHat(t,v){
  const c=SND.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  n.buffer=RADIO.noise;f.type="highpass";f.frequency.value=7000;
  g.gain.setValueAtTime(.018*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.03);
  n.connect(f);f.connect(g);g.connect(RADIO.layers.hat);n.start(t,RADIO.r()*.5,.05);n.stop(t+.06);
}
function radioBellVoice(t,fr,len,dst,peak){
  const c=SND.ctx,car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain();
  car.frequency.value=fr;mod.frequency.value=fr*3.5;
  mg.gain.setValueAtTime(fr*1.5,t);mg.gain.exponentialRampToValueAtTime(1,t+len*.7);
  mod.connect(mg);mg.connect(car.frequency);
  const end=radioEnv(g.gain,t,.03,peak,.01,len*1.5);
  car.connect(g);g.connect(dst);
  car.start(t);mod.start(t);car.stop(end+.05);mod.stop(end+.05);
}
/* маяк: протяжный «пик» спасательного буя — чистый тон полсекунды и три эха,
   каждое тише и глуше; высота всякий раз другая, иногда вне лада — чужой позывной */
function radioBeacon(t,key,cd){
  const r=RADIO.r,c=SND.ctx;
  const midi=key+36+radioDeg([0,2,4,7,9,11,14][Math.floor(r()*7)]);   // только звуки лада: тоника, терция, квинта и их октавы
  const fr=midiHz(midi),gap=.9+r()*.5;
  for(let k=0;k<4;k++){
    const tk=t+k*gap,v=[.05,.026,.013,.006][k];
    const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(),p=c.createStereoPanner();
    o.type="sine";o.frequency.value=fr;
    f.type="lowpass";f.frequency.value=6000-k*1300;              // эхо глуше с каждым разом
    p.pan.value=(k%2?-.5:.5)*(.3+r()*.5);
    g.gain.setValueAtTime(.0001,tk);g.gain.exponentialRampToValueAtTime(v,tk+.06);
    g.gain.setValueAtTime(v,tk+.5);g.gain.exponentialRampToValueAtTime(.0001,tk+.5+2);
    o.connect(f);f.connect(g);g.connect(p);p.connect(RADIO.layers.bell);
    o.start(tk);o.stop(tk+2.7);
  }
}
function radioBell(t,key,cd){
  radioBellVoice(t,midiHz(key+48+radioDeg(cd+[0,2,4][Math.floor(RADIO.r()*3)])),2.2,RADIO.layers.bell,.02);
}
/* ── обертоновое облако ──
   Самый «космический» приём — спектральный: не аккорд из нот, а натуральный ряд одного
   основного тона (Радиг, Штокхаузен «Stimmung»). Берутся 5–7 партиалов, каждый — синус
   со своим медленным дыханием и местом в стерео; вплывают за 4–6 с, висят, уходят за
   6–8 с — около 20 секунд, потом следующее облако будет другим. Партиалы только те, что
   в темперации ложатся в минор: 2 3 4 6 8 9 12 16 19 24 (19-й — малая терция с точностью
   до двух центов); 5, 7, 10, 11, 13 не берутся — они фальшивят против лада. */
function radioSpectral(t,key){
  const c=SND.ctx,r=RADIO.r,base=midiHz(key-12);
  const P=[2,3,4,6,8,9,12,16,19,24].filter(()=>r()<.6);
  if(P.length<4)P.push(3,4,6);
  for(const n of P.slice(0,7)){
    const o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner(),lfo=c.createOscillator(),lg=c.createGain();
    o.type="sine";o.frequency.value=base*n;
    const v=.05/Math.sqrt(n);
    lfo.frequency.value=.05+r()*.12;lg.gain.value=v*.5;lfo.connect(lg);lg.connect(g.gain);
    p.pan.value=r()*1.6-.8;
    const a=4+r()*2,h=8+r()*4,rel=6+r()*2,t0=t+r()*1.5;
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+a);
    g.gain.setValueAtTime(v,t0+a+h);g.gain.exponentialRampToValueAtTime(.0001,t0+a+h+rel);
    o.connect(g);g.connect(p);p.connect(RADIO.layers.bell);
    o.start(t0);lfo.start(t0);o.stop(t0+a+h+rel+.1);lfo.stop(t0+a+h+rel+.1);
  }
}
/* волна Жарра: шум через полосовой фильтр, который медленно проходит вверх и вниз */
function radioWave(t,len){
  const c=SND.ctx,n=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
  n.buffer=RADIO.noise;n.loop=true;bp.type="bandpass";bp.Q.value=1.5;
  bp.frequency.setValueAtTime(300,t);bp.frequency.exponentialRampToValueAtTime(2600,t+len*.5);bp.frequency.exponentialRampToValueAtTime(400,t+len);
  p.pan.setValueAtTime(-.7,t);p.pan.linearRampToValueAtTime(.7,t+len);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.012,t+len*.5);g.gain.exponentialRampToValueAtTime(.0001,t+len);
  n.connect(bp);bp.connect(g);g.connect(p);p.connect(RADIO.layers.fx);n.start(t);n.stop(t+len+.05);
}
/* подстройка по шкале между пьесами: эфирный шум в узкой полосе и свист гетеродина */
function radioTune(t){
  const c=SND.ctx;t=Math.max(t,c.currentTime);
  const n=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();
  n.buffer=RADIO.noise;n.loop=true;bp.type="bandpass";bp.Q.value=3;
  bp.frequency.setValueAtTime(600,t);bp.frequency.exponentialRampToValueAtTime(2400,t+.5);bp.frequency.exponentialRampToValueAtTime(900,t+1.1);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);
  n.connect(bp);bp.connect(g);g.connect(SND.music);n.start(t);n.stop(t+1.25);
  const o=c.createOscillator(),og=c.createGain();o.type="sine";
  const tonic=midiHz((RADIO.trk?RADIO.trk.key:0)+24);
  o.frequency.setValueAtTime(tonic*4,t+.1);o.frequency.exponentialRampToValueAtTime(tonic,t+.8);
  og.gain.setValueAtTime(.0001,t+.1);og.gain.exponentialRampToValueAtTime(.012,t+.3);og.gain.exponentialRampToValueAtTime(.0001,t+.85);
  o.connect(og);og.connect(SND.music);o.start(t+.1);o.stop(t+.9);
}
function radioStop(){
  if(!RADIO.bus||RADIO.ctx!==SND.ctx)return;
  const t=SND.ctx.currentTime,g=RADIO.bus.gain;
  g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.4);
  RADIO.trk=null;
}
