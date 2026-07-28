/* ══════════════ звук: чистый синтез, ни одного файла ══════════════ */
/* Браузер не даёт завести AudioContext до жеста пользователя, поэтому
   контекст создаётся лениво из unlockAudio(), повешенного на первый ввод. */
const SND={ctx:null,master:null,music:null,sfx:null,ready:false,voices:0,loops:{}};
const VOICE_MAX=18;
function audioOn(){return G.opts.audio&&G.opts.audio.on!==false;}
function initAudio(){
  if(SND.ctx)return SND.ctx;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return null;
  try{
    const c=new AC();
    /* компрессор — чтобы залп из десятка выстрелов не рвал колонки */
    const comp=c.createDynamicsCompressor();
    comp.threshold.value=-16;comp.knee.value=22;comp.ratio.value=8;
    comp.attack.value=.004;comp.release.value=.18;
    const m=c.createGain();m.gain.value=.9;
    m.connect(comp);comp.connect(c.destination);
    /* двигатель — своя шина: он звучит непрерывно и потому громче всего мешает,
       регулировать его вместе с остальными эффектами оказалось нельзя */
    const mus=c.createGain(),sf=c.createGain(),en=c.createGain();
    mus.connect(m);sf.connect(m);en.connect(m);
    SND.ctx=c;SND.master=m;SND.music=mus;SND.sfx=sf;SND.eng=en;SND.ready=true;
    applyVolumes();
    return c;
  }catch(e){return null;}
}
function applyVolumes(){
  if(!SND.ready)return;
  const a=G.opts.audio||{music:.6,sfx:.6,engine:.4,on:true};
  const on=a.on!==false?1:0;
  SND.music.gain.value=(a.music==null?.6:a.music)*on;
  SND.sfx.gain.value=(a.sfx==null?.6:a.sfx)*on;
  SND.eng.gain.value=(a.engine==null?.4:a.engine)*on;
}
function unlockAudio(){
  if(!audioOn())return;
  const c=initAudio();
  if(c&&c.state==="suspended")c.resume();
  if(c){
    musicInit();
    /* планировщик музыки живёт на своём таймере, а не на кадрах отрисовки */
    if(!MUS.timer)MUS.timer=setInterval(musicTick,60);
  }
}
/* ── кирпичики синтеза ── */
function env(g,t,a,d,peak){
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);
  g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);
}
let noiseBuf=null;
function noise(c){
  if(!noiseBuf||noiseBuf.sampleRate!==c.sampleRate){
    const n=Math.floor(c.sampleRate*1.2);
    noiseBuf=c.createBuffer(1,n,c.sampleRate);
    const d=noiseBuf.getChannelData(0);
    /* розоватый шум: чуть мягче белого, ближе к «железу», а не к шипению */
    let last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+w*.22)*.94;d[i]=clamp(last*3,-1,1);}
  }
  const s=c.createBufferSource();
  s.buffer=noiseBuf;s.loop=true;
  return s;
}
/* Учёт голосов с двойной страховкой. Основной путь — событие окончания
   источника. Но если рецепт забудет позвать freeVoice (так уже случилось
   с тревогой), слот утечёт навсегда и после VOICE_MAX срабатываний звук
   в игре умолкнет целиком — поэтому есть ещё и аварийный сброс по времени. */
let curTok=null;
function voice(){
  if(SND.voices>=VOICE_MAX)return false;
  SND.voices++;
  const tk=curTok={freed:false};
  setTimeout(()=>{if(!tk.freed){tk.freed=true;SND.voices=Math.max(0,SND.voices-1);}},4000);
  return true;
}
function freeVoice(node){
  const tk=curTok;
  if(!node||!tk)return;
  node.onended=()=>{if(!tk.freed){tk.freed=true;SND.voices=Math.max(0,SND.voices-1);}};
}
/* ── эффекты ── */
const SFX={
  /* короткий нисходящий свип: чем выше тон, тем «легче» орудие */
  shot(o){
    const c=SND.ctx,t=c.currentTime,f0=o&&o.f||620;
    const osc=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
    osc.type="sawtooth";
    osc.frequency.setValueAtTime(f0,t);
    osc.frequency.exponentialRampToValueAtTime(f0*.28,t+.13);
    lp.type="lowpass";lp.frequency.setValueAtTime(f0*3.2,t);
    lp.frequency.exponentialRampToValueAtTime(f0*.7,t+.13);
    env(g,t,.005,.14,(o&&o.v||.5)*1.1);
    osc.connect(lp);lp.connect(g);g.connect(SND.sfx);
    osc.start(t);osc.stop(t+.17);freeVoice(osc);
  },
  hit(o){
    const c=SND.ctx,t=c.currentTime;
    const n=noise(c),g=c.createGain(),bp=c.createBiquadFilter();
    bp.type="bandpass";bp.Q.value=1.1;
    bp.frequency.setValueAtTime(1400,t);
    bp.frequency.exponentialRampToValueAtTime(240,t+.2);
    env(g,t,.003,.22,(o&&o.v||.45)*2);
    n.connect(bp);bp.connect(g);g.connect(SND.sfx);
    n.start(t);n.stop(t+.26);freeVoice(n);
  },
  boom(o){
    const c=SND.ctx,t=c.currentTime,v=(o&&o.v||.75)*.34;
    const n=noise(c),g=c.createGain(),lp=c.createBiquadFilter();
    lp.type="lowpass";
    lp.frequency.setValueAtTime(1900,t);
    lp.frequency.exponentialRampToValueAtTime(90,t+.7);
    env(g,t,.006,.8,v);
    n.connect(lp);lp.connect(g);g.connect(SND.sfx);
    n.start(t);n.stop(t+.9);freeVoice(n);
    /* низкий «удар» под шумом — иначе взрыв звучит как шипение */
    const osc=c.createOscillator(),g2=c.createGain();
    osc.type="sine";
    osc.frequency.setValueAtTime(150,t);
    osc.frequency.exponentialRampToValueAtTime(38,t+.45);
    env(g2,t,.008,.5,v*.8);
    osc.connect(g2);g2.connect(SND.sfx);
    osc.start(t);osc.stop(t+.6);
  },
  drill(){
    const c=SND.ctx,t=c.currentTime;
    const n=noise(c),g=c.createGain(),bp=c.createBiquadFilter();
    /* узкая полоса съедала почти всю энергию — бур был не слышен, Q пришлось опустить */
    bp.type="bandpass";bp.Q.value=1.8;bp.frequency.value=320+Math.random()*260;
    env(g,t,.004,.1,1.1);
    n.connect(bp);bp.connect(g);g.connect(SND.sfx);
    n.start(t);n.stop(t+.13);freeVoice(n);
  },
  step(o){
    const c=SND.ctx,t=c.currentTime;
    const n=noise(c),g=c.createGain(),lp=c.createBiquadFilter();
    lp.type="lowpass";lp.frequency.value=(o&&o.f||420);
    env(g,t,.003,.07,.5);
    n.connect(lp);lp.connect(g);g.connect(SND.sfx);
    n.start(t);n.stop(t+.1);freeVoice(n);
  },
  /* интерфейс: чистые тоны, короткие, без хвоста */
  ui(o){
    const c=SND.ctx,t=c.currentTime;
    const osc=c.createOscillator(),g=c.createGain();
    osc.type="triangle";
    osc.frequency.setValueAtTime((o&&o.f||760),t);
    if(o&&o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+.1);
    env(g,t,.004,(o&&o.d||.09),(o&&o.v||.3)*3);
    osc.connect(g);g.connect(SND.sfx);
    osc.start(t);osc.stop(t+(o&&o.d||.09)+.05);freeVoice(osc);
  },
  /* голос существа: тембр целиком из его seed — у каждого зверя свой */
  beast(o){
    const c=SND.ctx,t=c.currentTime,r=rng((o&&o.seed||1)>>>0);
    const base=90+r()*260;
    const osc=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
    osc.type=r()<.5?"sawtooth":"square";
    osc.frequency.setValueAtTime(base,t);
    osc.frequency.linearRampToValueAtTime(base*(.6+r()*.9),t+.18);
    lp.type="lowpass";lp.frequency.value=base*(4+r()*5);
    env(g,t,.02,.24,.22);
    osc.connect(lp);lp.connect(g);g.connect(SND.sfx);
    osc.start(t);osc.stop(t+.3);freeVoice(osc);
  },
  alarm(o){
    const c=SND.ctx,t=c.currentTime;
    let lastOsc=null;
    for(let i=0;i<2;i++){
      const osc=c.createOscillator(),g=c.createGain();
      osc.type="square";
      osc.frequency.value=(o&&o.f||440);
      const t0=t+i*.17;
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.exponentialRampToValueAtTime(.22,t0+.01);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+.13);
      osc.connect(g);g.connect(SND.sfx);
      osc.start(t0);osc.stop(t0+.16);
      lastOsc=osc;
    }
    /* голос освобождает последний из двух гудков: без этого каждая тревога
       навсегда съедала слот и после 18 штук звук в игре умолкал целиком */
    freeVoice(lastOsc);
  },
  jump(){
    const c=SND.ctx,t=c.currentTime;
    const osc=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
    osc.type="sawtooth";
    osc.frequency.setValueAtTime(70,t);
    osc.frequency.exponentialRampToValueAtTime(1500,t+.55);
    lp.type="lowpass";
    lp.frequency.setValueAtTime(300,t);
    lp.frequency.exponentialRampToValueAtTime(4200,t+.55);
    env(g,t,.12,.5,.2);
    osc.connect(lp);lp.connect(g);g.connect(SND.sfx);
    osc.start(t);osc.stop(t+.7);freeVoice(osc);
  }
};
function sfx(name,o){
  if(!audioOn()||!SND.ready||!SFX[name])return;
  if(SND.ctx.state!=="running")return;
  if(!voice())return;                  // полифония кончилась — молча пропускаем
  try{SFX[name](o);}
  catch(e){if(curTok&&!curTok.freed){curTok.freed=true;SND.voices=Math.max(0,SND.voices-1);}}
}
/* ── непрерывный гул двигателя: один голос, живёт всё время полёта ── */
function engineLoop(level,tone){
  if(!audioOn()||!SND.ready||SND.ctx.state!=="running"){stopEngine();return;}
  const c=SND.ctx;
  let L=SND.loops.engine;
  if(!L){
    const n=noise(c),g=c.createGain(),lp=c.createBiquadFilter(),hp=c.createBiquadFilter(),
          osc=c.createOscillator(),og=c.createGain();
    lp.type="lowpass";lp.frequency.value=340;
    /* без среза низов двигатель превращался в сплошное гудение,
       которое перекрывало и музыку, и всё остальное */
    hp.type="highpass";hp.frequency.value=110;
    g.gain.value=0;
    /* пила давала «дребезг»; треугольник тише и чище, и его доля втрое меньше */
    osc.type="triangle";osc.frequency.value=78;og.gain.value=.12;
    n.connect(lp);lp.connect(hp);osc.connect(og);og.connect(hp);hp.connect(g);g.connect(SND.eng);
    n.start();osc.start();
    L=SND.loops.engine={n,g,lp,hp,osc,og};
  }
  const t=c.currentTime;
  L.g.gain.setTargetAtTime(clamp(level,0,1)*.15,t,.09);
  L.lp.frequency.setTargetAtTime(280+level*900,t,.12);
  L.hp.frequency.setTargetAtTime(150-level*60,t,.12);
  L.osc.frequency.setTargetAtTime(66+(tone||0)*34,t,.12);
}
function stopEngine(){
  const L=SND.loops.engine;
  if(!L||!SND.ready)return;
  L.g.gain.setTargetAtTime(0,SND.ctx.currentTime,.08);
}
