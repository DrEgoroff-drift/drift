/* ══════════════ радио: треки и генератор ══════════════ */
/* Второй голос музыки, рядом с эмбиентом `10-music`. Эмбиент — слои без начала и
   конца; радио — пьесы с формой: вступление, тема, подголосок, бридж, возврат,
   около полутора минут, потом следующая. Ориентир — советская космическая эстрада
   («Зодиак», Артемьев): минор с мажорными аккордами на VI/III/VII, прыгающий бас,
   струнный синтезатор, соло из двух расстроенных пил с поздним вибрато.
   Образцы автора (шесть MP3, 19.09) сняты по числам: темп 76–123, минор, больше
   половины энергии ниже 200 Гц, выше 4 кГц почти пусто, 1.2–2.2 ноты в секунду —
   поэтому хэт тихий, срез низкий, мелодия редкая.

   Два источника (G.opts.audio.src):
   · «tracks» — десять пьес с именами; одна и та же пьеса звучит одинаково, их листают;
   · «gen»    — бесконечный генератор: каждая пьеса сочиняется по тем же правилам
                из нового зерна, имя тоже из зерна; не повторяется.
   · «ambient» — прежняя музыка `10-music`.
   Игра наклоняет пьесу на ходу, не меняя её: опасность — фригийский лад, плотный бас
   и бочка; кантина — мажор, быстрее, весело; станция — тихо; карта и грунт — без
   барабанов. Квадратных волн нет: с ними выходил «Марио». */
const RADIO_TRACKS=[
  /* имя, зерно, темп, тоника (от A2), лад, срез, ударные, арпеджио, колокол */
  {n:"Тихий сигнал возвращения",s:1961,bpm:96, key:3, mode:"minor",  cut:3200,dr:.55,arp:.5,bell:.3},
  {n:"Безмолвная орбита",       s:1957,bpm:76, key:0, mode:"dorian", cut:2600,dr:0,  arp:.4,bell:.6},
  {n:"Дистанционный сигнал",    s:1965,bpm:80, key:3, mode:"minor",  cut:2800,dr:.3, arp:.7,bell:.2},
  {n:"Космический оптимизм",    s:1975,bpm:104,key:0, mode:"minor",  cut:4200,dr:.8, arp:.6,bell:.4},
  {n:"Космический рассвет",     s:1971,bpm:118,key:3, mode:"major",  cut:4800,dr:.9, arp:.8,bell:.5},
  {n:"Попутный звёздный ветер", s:1963,bpm:100,key:5, mode:"dorian", cut:3800,dr:.7, arp:.7,bell:.3},
  {n:"Станция «Заря»",          s:1986,bpm:88, key:-2,mode:"minor",  cut:3000,dr:.45,arp:.3,bell:.8},
  {n:"Дальний рейс",            s:1977,bpm:92, key:2, mode:"dorian", cut:3400,dr:.6, arp:.5,bell:.2},
  {n:"Позывные с Луны",         s:1959,bpm:84, key:-4,mode:"minor",  cut:2700,dr:.2, arp:.8,bell:.6},
  {n:"Полдень над кольцами",    s:1999,bpm:110,key:1, mode:"mixo",   cut:4400,dr:.85,arp:.7,bell:.5}
];
const RADIO_MODES={
  minor:[0,2,3,5,7,8,10], dorian:[0,2,3,5,7,9,10], major:[0,2,4,5,7,9,11],
  mixo:[0,2,4,5,7,9,10],  phryg:[0,1,3,5,7,8,10]
};
/* аккорды по тактам, ступени лада; в мажоре те же номера дают I–vi–iii–VII… — светлее */
const RADIO_PROGS={
  intro:[0,5,0,6], A:[0,5,2,6,0,5,3,4], A2:[0,5,2,6,0,5,3,4], B:[5,2,6,0,5,3,6,6],
  brk:[5,0,5,6], out:[5,6,0,0], danger:[0,5,6,0,0,5,6,4], cantina:[0,3,4,0,0,5,3,4]
};
/* наклон по месту: множители слоёв и что делать с ладом и темпом */
const RADIO_MOOD={
  travel:  {k:1,  dr:1,  bass:1,  lead:1,  arp:1,  str:1,  cut:1},
  drift:   {k:1,  dr:0,  bass:.6, lead:.8, arp:.7, str:1.1,cut:.8},
  station: {k:1,  dr:.3, bass:.5, lead:.7, arp:.4, str:1,  cut:.8},
  danger:  {k:1,  dr:1.2,bass:1.2,lead:.7, arp:1.2,str:.6, cut:1.3, mode:"phryg",prog:"danger"},
  cantina: {k:1.18,dr:1.1,bass:1.1,lead:1.1,arp:.9, str:.8, cut:1.3, mode:"major",prog:"cantina",bounce:true}
};
const RADIO_GEN_A=["Тихий","Дальний","Безмолвный","Лунный","Звёздный","Северный","Последний","Попутный","Орбитальный","Вечерний","Солнечный","Синий"];
const RADIO_GEN_B=["сигнал","рейс","маяк","причал","рассвет","дрейф","позывной","перигей","вокзал","меридиан","пеленг","горизонт"];
const RADIO={ctx:null,bus:null,layers:null,on:false,step:0,next:0,trk:null,form:null,bars:0,
  mel:{},prevLead:0,mood:"travel",moodT:"travel",live:0,fade:0,title:""};
const RADIO_LAYERS=["str","bass","lead","harm","arp","kick","snare","hat","bell"];

function radioSrc(){const a=G.opts.audio||{};return a.src==="gen"||a.src==="ambient"?a.src:"tracks";}
function radioOn(){return radioSrc()!=="ambient";}
function radioNow(){return RADIO.title||"";}

/* граф: своя шина в SND.music, свой отзвук-задержка, зал берётся у эмбиента */
function radioBuild(){
  const c=SND.ctx;
  if(RADIO.ctx===c&&RADIO.bus)return;
  RADIO.ctx=c;
  RADIO.bus=c.createGain();RADIO.bus.gain.value=0;RADIO.bus.connect(SND.music);
  RADIO.lp=c.createBiquadFilter();RADIO.lp.type="lowpass";RADIO.lp.frequency.value=3200;RADIO.lp.Q.value=.3;
  RADIO.lp.connect(RADIO.bus);
  const d=c.createDelay(2),fb=c.createGain(),dt=c.createBiquadFilter(),dw=c.createGain();
  fb.gain.value=.3;dt.type="lowpass";dt.frequency.value=2200;dw.gain.value=.16;
  d.connect(dt);dt.connect(fb);fb.connect(d);dt.connect(dw);dw.connect(RADIO.bus);
  RADIO.dly=d;
  const wet=c.createGain();wet.gain.value=.5;
  RADIO.wet=wet;
  if(MUS.fx&&MUS.fx.send&&MUS.fx.send.context===c)wet.connect(MUS.fx.send);
  RADIO.layers={};
  for(const k of RADIO_LAYERS){
    const g=c.createGain();g.gain.value=0;g.connect(RADIO.lp);
    if(k!=="kick"&&k!=="hat"&&k!=="bass")g.connect(wet);
    if(k==="lead"||k==="arp"||k==="bell")g.connect(d);
    RADIO.layers[k]=g;
  }
  /* хорус струнных: одна модулированная задержка рядом с сухим */
  RADIO.strIn=c.createGain();
  const sf=c.createBiquadFilter();sf.type="lowpass";sf.frequency.value=2200;
  const cd=c.createDelay(.05);cd.delayTime.value=.012;
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.6;lg.gain.value=.004;
  lfo.connect(lg);lg.connect(cd.delayTime);lfo.start();
  RADIO.strIn.connect(sf);sf.connect(RADIO.layers.str);sf.connect(cd);cd.connect(RADIO.layers.str);
  const n=c.sampleRate,nb=c.createBuffer(1,n,n),nd=nb.getChannelData(0);
  const r=rng(4242);for(let i=0;i<n;i++)nd[i]=r()*2-1;
  RADIO.noise=nb;
}

/* пьеса: трек из таблицы или сочинённая из зерна генератора */
function radioGenTrack(n){
  const r=rng(hashi(n,0x5EED,77));
  const pick=a=>a[Math.floor(r()*a.length)];
  return {n:pick(RADIO_GEN_A)+" "+pick(RADIO_GEN_B),s:hashi(n,1957,3)>>>0,
    bpm:Math.round(78+r()*38),key:Math.floor(r()*9)-4,
    mode:pick(["minor","minor","dorian","dorian","major","mixo"]),
    cut:Math.round(2600+r()*2200),dr:r()<.2?0:.3+r()*.6,arp:.3+r()*.5,bell:.2+r()*.6};
}
function radioForm(bpm){
  /* полторы минуты при любом темпе: медленной пьесе — короче форма */
  if(bpm<86)return [["intro",4],["A",8],["B",8],["A",8],["out",2]];
  if(bpm>108)return [["intro",4],["A",8],["A2",8],["B",8],["brk",4],["A",8],["out",2]];
  return [["intro",4],["A",8],["A2",8],["B",8],["A",8],["out",2]];
}
function radioLoad(t){
  const a=G.opts.audio;
  let trk;
  if(radioSrc()==="gen"){a.genN=(a.genN|0)+1;trk=radioGenTrack(a.genN);}   // счётчик в сейве: не повторяется и между вечерами
  else trk=RADIO_TRACKS[((a.track|0)%RADIO_TRACKS.length+RADIO_TRACKS.length)%RADIO_TRACKS.length];
  RADIO.trk=trk;RADIO.title=trk.n;RADIO.r=rng(trk.s>>>0||1);
  RADIO.form=radioForm(trk.bpm);RADIO.bars=RADIO.form.reduce((s,f)=>s+f[1],0);
  RADIO.mel={};RADIO.step=0;RADIO.prevLead=0;
  RADIO.next=t;RADIO.src=radioSrc();
  RADIO.fade=0;RADIO.sec="intro";
  radioMix(t,true);
  const g=RADIO.bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(.0001,t);g.linearRampToValueAtTime(1,t+1.5);
}
/* конец пьесы: трек листается сам, генератор берёт новое зерно */
function radioAdvance(){
  const a=G.opts.audio;
  if(radioSrc()==="tracks")a.track=((a.track|0)+1)%RADIO_TRACKS.length;
}
function radioSkip(dir){
  const a=G.opts.audio;
  if(radioSrc()==="tracks")a.track=(((a.track|0)+(dir||1))%RADIO_TRACKS.length+RADIO_TRACKS.length)%RADIO_TRACKS.length;
  RADIO.trk=null;          // следующая выборка загрузит новую пьесу
}

function radioMoodNow(){
  if(G.mode==="dock"&&typeof tab!=="undefined"&&tab==="cantina")return "cantina";
  if(G.mode==="raid"||(MUS.intensity||0)>.3)return "danger";
  if(G.mode==="dock"||G.mode==="base")return "station";
  if(G.mode==="map"||G.mode==="scoop"||G.mode==="surface"||G.mode==="cave"||G.mode==="dig"||G.mode==="landing")return "drift";
  return "travel";
}
function radioMix(t,instant){
  const T=RADIO.trk,m=RADIO_MOOD[RADIO.mood]||RADIO_MOOD.travel,sec=RADIO.sec||"A";
  const off=(sec==="intro"||sec==="brk"||sec==="out");
  const L={str:.9*m.str,bass:.9*m.bass,lead:off?0:m.lead,harm:sec==="A2"||sec==="B"?.6*m.lead:0,
    arp:T.arp*m.arp*(sec==="brk"?.5:1),kick:T.dr*m.dr*(off?0:1),snare:T.dr*m.dr*(off?0:.8),
    hat:T.dr*m.dr*(sec==="brk"?0:.5),bell:T.bell};
  const glide=(p,v,tc)=>{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(v,t+(instant?.05:tc));};
  for(const k of RADIO_LAYERS)glide(RADIO.layers[k].gain,L[k],1.5);
  glide(RADIO.lp.frequency,Math.min(9000,T.cut*m.cut),2);
  RADIO.dly.delayTime.setValueAtTime(radioS16()*3,t);
}
function radioBpm(){return RADIO.trk.bpm*((RADIO_MOOD[RADIO.mood]||{}).k||1);}
function radioS16(){return 60/radioBpm()/4;}
function radioScale(){
  const m=RADIO_MOOD[RADIO.mood];
  return RADIO_MODES[(m&&m.mode)||RADIO.trk.mode]||RADIO_MODES.minor;
}
function radioDeg(d){const s=radioScale(),o=Math.floor(d/7);return s[((d%7)+7)%7]+12*o;}

/* планировщик: зовётся из musicTick (таймер 60 мс, аудио-часы) */
function radioTick(){
  const c=SND.ctx;
  radioBuild();
  const t0=c.currentTime;
  if(!RADIO.trk||RADIO.src!==radioSrc()){radioLoad(t0+.05);}
  RADIO.moodT=radioMoodNow();
  if(RADIO.next<t0)RADIO.next=t0+.05;
  while(RADIO.next<t0+.3){
    const t=RADIO.next;
    radioStep(t);
    RADIO.next+=radioS16();RADIO.step++;
    if(RADIO.step>=RADIO.bars*16){radioAdvance();radioLoad(RADIO.next);}
  }
}
function radioWhere(bar){
  let b=bar;
  for(const [name,len] of RADIO.form){if(b<len)return {name,barIn:b,len};b-=len;}
  return {name:"out",barIn:0,len:1};
}
function radioStep(t){
  const s=RADIO.step%16,bar=Math.floor(RADIO.step/16),w=radioWhere(bar),r=RADIO.r;
  if(s===0){
    let ch=false;
    if(w.barIn===0&&RADIO.sec!==w.name){RADIO.sec=w.name;ch=true;}
    if(RADIO.mood!==RADIO.moodT){RADIO.mood=RADIO.moodT;ch=true;}
    if(ch)radioMix(t,false);
    /* последние два такта — затухание в следующую пьесу */
    if(w.name==="out"&&w.barIn===0){const g=RADIO.bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value||1,t);
      g.linearRampToValueAtTime(.0001,t+radioS16()*32);}
  }
  const m=RADIO_MOOD[RADIO.mood]||RADIO_MOOD.travel;
  const prog=RADIO_PROGS[m.prog||w.name]||RADIO_PROGS.A;
  const cd=prog[w.barIn%prog.length];
  const key=RADIO.trk.key-12;                 // 0 = A2 → бас в первой октаве
  if(s===0)radioStrings(t,key,cd,radioS16()*16);
  radioBass(t,s,key,cd,m);
  if(s%2===0||RADIO.mood==="danger")radioArp(t,s,key,cd);
  radioDrums(t,s,w);
  radioMelody(t,s,w,key,cd);
  if(s===0&&bar%2===0&&r()<.5)radioBell(t,key,cd);
}

/* ── мелодия: сочиняется один раз на пьесу и повторяется — так её запоминают ── */
function radioPhrase(){
  const r=RADIO.r,pick=a=>a[Math.floor(r()*a.length)];
  const RH=[[0,6,8,12],[0,4,10],[0,3,8,12],[0,8,10],[0,3,6,8,12]],EN=[[0,8],[0,6],[0,4,8]];
  const mk=(on)=>{const out=[];let d=pick([0,2,4]);
    on.forEach((st,i)=>{
      if(st%4===0)d=pick([0,2,4,7,2,4]);          // на доле — звук аккорда
      else d+=pick([-1,-1,1,-2]);                 // между — шаг, чаще вниз: вздох
      out.push({st,d,dur:(on[i+1]==null?16:on[i+1])-st});
    });return out;};
  const b1=mk(pick(RH)),b2=mk(pick(EN));
  b2[b2.length-1].d=pick([0,2]);
  return [b1,b2];
}
function radioMelody(t,s,w,key,cd){
  if(w.name==="intro"||w.name==="brk"||w.name==="out")return;
  const k=w.name==="A2"?"A":w.name;
  if(!RADIO.mel[k]){
    const p=radioPhrase(),r=RADIO.r;
    const v=p.map((b,bi)=>b.map((n,i)=>({...n,d:(bi===0&&i===b.length-1)?n.d+[1,2,-1][Math.floor(r()*3)]:n.d})));
    RADIO.mel[k]=[p,p,v,p];
  }
  const mel=RADIO.mel[k],n=mel[Math.floor(w.barIn/2)%4][w.barIn%2].find(x=>x.st===s);
  if(!n)return;
  const dur=n.dur*radioS16()*.92;
  radioLead(t,key+24+radioDeg(cd+n.d),dur,"lead");
  if(w.name!=="A")radioLead(t,key+24+radioDeg(cd+n.d-2),dur,"harm");
}

/* ── голоса ── */
function radioEnv(g,t,a,peak,hold,rel){
  const end=Math.max(t+a+.005,t+hold);
  g.setValueAtTime(.0001,t);g.exponentialRampToValueAtTime(peak,t+a);
  g.setValueAtTime(peak,end);g.exponentialRampToValueAtTime(.0001,end+rel);
  return end+rel;
}
function radioStrings(t,key,cd,dur){
  const c=SND.ctx;
  [0,2,4,7].forEach((iv,i)=>{
    const f=midiHz(key+12+radioDeg(cd+iv)),g=c.createGain(),p=c.createStereoPanner();
    p.pan.value=-.4+i*.27;
    const end=radioEnv(g.gain,t,.35,.018,dur-.1,.7);
    for(const ct of [-9,0,9]){
      const o=c.createOscillator();o.type="sawtooth";o.frequency.value=f;o.detune.value=ct;
      o.connect(g);o.start(t);o.stop(end+.05);
    }
    g.connect(p);p.connect(RADIO.strIn);
  });
}
function radioBass(t,s,key,cd,m){
  const calm=RADIO.mood==="drift"||RADIO.mood==="station";
  let oct=0;
  if(m.bounce){if(s%2)return;oct=s%4===2?12:0;}                 // кантина: октавный скачок восьмыми
  else if(calm){if(s%4)return;}
  else{if(s%2)return;if(s%4===2&&s!==6&&s!==14)return;oct=(s===6||s===14)?12:0;}
  const c=SND.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
  o.type="sawtooth";o.frequency.value=midiHz(key+radioDeg(cd)+oct);
  f.type="lowpass";f.Q.value=6;f.frequency.setValueAtTime(1300,t);f.frequency.exponentialRampToValueAtTime(200,t+.16);
  const end=radioEnv(g.gain,t,.005,.1,calm?.3:.05,calm?.4:.14);
  o.connect(f);f.connect(g);g.connect(RADIO.layers.bass);o.start(t);o.stop(end+.05);
}
function radioArp(t,s,key,cd){
  const pat=[0,2,4,7,9,7,4,2],c=SND.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
  o.type="triangle";o.frequency.value=midiHz(key+36+radioDeg(cd+pat[s%8]));
  f.type="lowpass";f.frequency.value=1400;p.pan.value=Math.sin(RADIO.step*.4)*.6;
  const end=radioEnv(g.gain,t,.003,.009,.01,.12);
  o.connect(f);f.connect(g);g.connect(p);p.connect(RADIO.layers.arp);o.start(t);o.stop(end+.03);
}
function radioLead(t,midi,dur,layer){
  const c=SND.ctx,hz=midiHz(midi),harm=layer==="harm";
  const o1=c.createOscillator(),o2=c.createOscillator();
  o1.type=harm?"triangle":"sawtooth";o2.type=harm?"sine":"sawtooth";o2.detune.value=9;
  /* подъезд к ноте — не на каждой, иначе выходит мультфильм */
  const from=!harm&&RADIO.prevLead&&RADIO.r()<.2?RADIO.prevLead:hz;
  for(const o of [o1,o2]){o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(hz,t+.06);}
  if(!harm)RADIO.prevLead=hz;
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=4.8;
  lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(0,t+.18);lg.gain.linearRampToValueAtTime(hz*.005,t+.6);
  lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);
  const f=c.createBiquadFilter();f.type="lowpass";f.Q.value=2;
  f.frequency.setValueAtTime(harm?1400:2200,t);f.frequency.exponentialRampToValueAtTime(harm?1000:1500,t+.4);
  const g=c.createGain(),end=radioEnv(g.gain,t,.06,harm?.016:.026,dur,.35);
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(RADIO.layers[layer]);
  for(const o of [o1,o2,lfo]){o.start(t);o.stop(end+.05);}
}
function radioDrums(t,s,w){
  const dg=RADIO.mood==="danger",ct=RADIO.mood==="cantina";
  if(s===0||((dg||ct)&&s%4===0)||(!dg&&!ct&&s===10))radioKick(t);
  if(ct?(s===4||s===12):s===8)radioSnare(t,1);
  if(w.barIn===w.len-1&&s>=12&&w.name!=="out")radioSnare(t,.5);    // сбивка в следующую часть
  if(s%4===2||(dg&&s%2===1))radioHat(t,s%4===2?.6:.35);
}
function radioKick(t){
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
  g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);
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
function radioHat(t,v){
  const c=SND.ctx,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  n.buffer=RADIO.noise;f.type="highpass";f.frequency.value=7000;
  g.gain.setValueAtTime(.03*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.035);
  n.connect(f);f.connect(g);g.connect(RADIO.layers.hat);n.start(t,RADIO.r()*.5,.05);n.stop(t+.06);
}
function radioBell(t,key,cd){
  const c=SND.ctx,fr=midiHz(key+48+radioDeg(cd+[0,2,4][Math.floor(RADIO.r()*3)]));
  const car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain();
  car.frequency.value=fr;mod.frequency.value=fr*3.5;
  mg.gain.setValueAtTime(fr*1.5,t);mg.gain.exponentialRampToValueAtTime(1,t+1.5);
  mod.connect(mg);mg.connect(car.frequency);
  const end=radioEnv(g.gain,t,.004,.02,.01,2.2);
  car.connect(g);g.connect(RADIO.layers.bell);
  car.start(t);mod.start(t);car.stop(end+.05);mod.stop(end+.05);
}
function radioStop(){
  if(!RADIO.bus||RADIO.ctx!==SND.ctx)return;
  const t=SND.ctx.currentTime,g=RADIO.bus.gain;
  g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.4);
  RADIO.trk=null;
}
