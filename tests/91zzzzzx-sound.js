/* ══════════════ звук: договор, который никем не сторожился (M359) ══════════════
   Про звук в проекте нет ни одной проверки. Причина понятная: в headless нет
   ни колонок, ни разрешения на автозапуск, и настоящий `AudioContext` сидит в
   «suspended», а `sfx` из него выходит первой же строкой. Поэтому звук молча
   считался непроверяемым — а это единственная подсистема, которая умеет
   сломаться так, что игра работает, а слушать её нельзя.

   Проверяется без колонок и без моков поверх собственного кода: узлы строятся
   в настоящем `OfflineAudioContext` (это тот же Web Audio, только считает в
   буфер, а не в динамик), а «running» ему приписывается своим свойством —
   иначе игра сочтёт его спящим. Синтез при этом работает НАСТОЯЩИЙ: те же
   осцилляторы, шум, фильтры и огибающие, что услышит игрок.

   Четыре закона:
   1. выключенный звук молчит: ни одного голоса, шины в нуле;
   2. полифония не течёт — голосов не больше VOICE_MAX, и они возвращаются;
   3. каждый звук из таблицы играется и ГАСНЕТ: у каждого запущенного источника
      назначен `stop`, иначе он звучит вечно и копится;
   4. гул двигателя — один голос на весь полёт, а не новый на каждый кадр. */

/* сцена со счётом узлов: настоящий Web Audio, только офлайн */
function snStand(fn,after){
  const AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!AC)return "офлайн-контекста в этом браузере нет";
  const was={ctx:SND.ctx,master:SND.master,music:SND.music,sfx:SND.sfx,eng:SND.eng,ready:SND.ready,voices:SND.voices,loops:SND.loops,hush:SND.hush};
  const wasOpts=JSON.parse(JSON.stringify(G.opts.audio||{}));
  const c=new AC(2,44100*4,44100);
  /* игра пускает звук только в «running»: у офлайна состояние своё, и мы
     приписываем нужное СВОИМ свойством поверх прототипного — сам контекст при
     этом остаётся настоящим */
  try{ Object.defineProperty(c,"state",{configurable:true,get:()=>"running"}); }catch(e){ }
  const stat={osc:0,buf:0,started:0,stopped:0};
  const wrap=(name,kind)=>{
    const orig=c[name].bind(c);
    c[name]=function(){
      const n=orig.apply(null,arguments);
      stat[kind]++;
      const s=n.start&&n.start.bind(n),p=n.stop&&n.stop.bind(n);
      if(s)n.start=function(){stat.started++;return s.apply(null,arguments);};
      if(p)n.stop=function(){stat.stopped++;return p.apply(null,arguments);};
      return n;
    };
  };
  wrap("createOscillator","osc");wrap("createBufferSource","buf");
  const m=c.createGain(),mus=c.createGain(),sf=c.createGain(),en=c.createGain();
  m.connect(c.destination);mus.connect(m);sf.connect(m);en.connect(m);
  SND.ctx=c;SND.master=m;SND.music=mus;SND.sfx=sf;SND.eng=en;SND.ready=true;
  SND.voices=0;SND.loops={};SND.hush=false;
  G.opts.audio=Object.assign({on:true,music:.6,sfx:.6,engine:.4},wasOpts,{on:true});
  try{ return fn(c,stat)||""; }
  finally{
    if(after)try{ after(stat); }catch(e){ }
    SND.ctx=was.ctx;SND.master=was.master;SND.music=was.music;SND.sfx=was.sfx;SND.eng=was.eng;
    SND.ready=was.ready;SND.voices=was.voices;SND.loops=was.loops;SND.hush=was.hush;
    G.opts.audio=wasOpts;
  }
}

TEST_SUITES.push(() => suite("звук: каждый звук из таблицы играется и гаснет", () => {
  resetWorld();
  const names=Object.keys(SFX);
  ok(names.length>=10,"звуков в таблице: "+names.length);
  const bad=[];
  let started=0,stopped=0;
  const why=snStand((c,stat)=>{
    for(const n of names){
      SND.voices=0;                       /* полифония не должна мешать перебору */
      const s0=stat.started,p0=stat.stopped;
      try{ sfx(n); }catch(e){ bad.push(n+": бросил "+e.message); continue; }
      const started=stat.started-s0,stopped=stat.stopped-p0;
      if(!started){bad.push(n+": не запустил ни одного источника");continue;}
      /* каждый запущенный источник обязан получить `stop`: без него узел живёт
         вечно, и за вечер их накапливаются сотни */
      if(stopped<started)bad.push(n+": запущено "+started+", погашено "+stopped);
    }
    return "";
  },(s)=>{started=s.started;stopped=s.stopped;});
  if(why){ok(true,why+" — проверку пропускаем");return;}
  ok(started>=names.length,"источников запущено за перебор: "+started+", погашено: "+stopped);
  eq(bad.slice(0,5).join(" ;; "),"","каждый звук запускается и гасится"+(bad.length?" (всего "+bad.length+")":""));
  /* незнакомое имя — тишина, а не падение */
  let threw="";
  snStand(()=>{ try{ sfx("нет-такого-звука"); }catch(e){ threw=e.message; } });
  eq(threw,"","незнакомое имя звука не роняет игру");
  resetWorld();
}));

TEST_SUITES.push(() => suite("звук: выключенный молчит, а полифония не течёт", () => {
  resetWorld();
  const names=Object.keys(SFX).slice(0,8);
  const bad=[];
  const why=snStand((c,stat)=>{
    /* 1. выключенный звук: ни одного источника */
    G.opts.audio.on=false;
    const s0=stat.started;
    for(const n of names)sfx(n);
    if(stat.started>s0)bad.push("при выключенном звуке запущено источников: "+(stat.started-s0));
    if(SND.voices)bad.push("и заняты голоса: "+SND.voices);
    G.opts.audio.on=true;
    /* 2. глушение режима-компаньона (audioHush) — то же самое, но временно */
    audioHush(true);
    const s1=stat.started;
    for(const n of names)sfx(n);
    if(stat.started>s1)bad.push("под глушением запущено источников: "+(stat.started-s1));
    audioHush(false);
    if(G.opts.audio.on!==true)bad.push("глушение испортило настройку игрока");
    /* 3. полифония: сотня звуков подряд не переполняет счётчик голосов */
    SND.voices=0;
    let peak=0;
    for(let i=0;i<120;i++){ sfx(names[i%names.length]); peak=Math.max(peak,SND.voices); }
    if(peak>VOICE_MAX)bad.push("голосов разом: "+peak+" при потолке "+VOICE_MAX);
    if(SND.voices>VOICE_MAX)bad.push("после залпа осталось занято: "+SND.voices);
    return "";
  });
  if(why){ok(true,why+" — проверку пропускаем");return;}
  eq(bad.slice(0,4).join(" ;; "),"","выключенный звук молчит, а голоса не текут");
  resetWorld();
}));

TEST_SUITES.push(() => suite("звук: гул двигателя — один голос на весь полёт", () => {
  /* «Двигатель звучит непрерывно и потому громче всего мешает» — у него своя
     шина и один-единственный узел. Если бы кадр заводил новый, за минуту полёта
     их стало бы три тысячи, и игра бы захлебнулась именно на звуке. */
  resetWorld();
  const bad=[];
  const why=snStand((c,stat)=>{
    const s0=stat.started;
    for(let i=0;i<200;i++)engineLoop(.5+.4*Math.sin(i/9),i%3?0:.4);
    const made=stat.started-s0;
    if(made>4)bad.push("двести кадров тяги завели источников: "+made);
    const L=SND.loops.engine;
    if(!L)bad.push("гул не завёлся вовсе");
    /* стоп гасит, но узел не выбрасывает: он живёт весь полёт по замыслу */
    stopEngine();
    if(SND.loops.engine!==L)bad.push("стоп потерял узел гула");
    /* и после стопа новые кадры не плодят второй гул */
    const s1=stat.started;
    for(let i=0;i<50;i++)engineLoop(.3,0);
    if(stat.started-s1>0)bad.push("после стопа завёлся ещё один гул: "+(stat.started-s1));
    return "";
  });
  if(why){ok(true,why+" — проверку пропускаем");return;}
  eq(bad.slice(0,3).join(" ;; "),"","гул двигателя один на весь полёт");
  resetWorld();
}));

TEST_SUITES.push(() => suite("звук: голос маяка молчит там, где ему велено молчать", () => {
  /* M349: приёмник говорит в полёте и в дороге, но НЕ на столах и станциях —
     «голос не читает поверх экрана». Это правило прямо записано в voiceCan. */
  resetWorld();
  if(typeof voiceCan!=="function"){ok(true,"маяка в этой сборке нет — пропуск");return;}
  const opts=(typeof voiceOpts==="function")?voiceOpts():null;
  if(opts)opts.on=true;
  const bad=[];
  const loud=["system","road"],quiet=["dock","surface","map","dig","cave","belt","base","homein","winter","spa","wanderer","raid","scoop","landing"];
  for(const m of loud){ G.mode=m; if(typeof speechSynthesis==="undefined")break; if(!voiceCan())bad.push("в режиме «"+m+"» голос молчит, хотя должен говорить"); }
  for(const m of quiet){ G.mode=m; if(voiceCan())bad.push("в режиме «"+m+"» голос говорит поверх экрана"); }
  G.mode="system";
  ok(true,"режимов проверено: "+(loud.length+quiet.length));
  eq(bad.slice(0,3).join(" ;; "),"","голос звучит только там, где ему позволено");
  resetWorld();
}));
