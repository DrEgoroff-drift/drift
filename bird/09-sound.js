/* ══════════════ голос ══════════════
   Последний хвост M200: птица молчала. Голос синтезируется на месте — файл
   обязан остаться самодостаточным, ни одного сэмпла снаружи.

   КАК УСТРОЕН КРИК. У попугая голос двухголосный: сирена (два несущих тона в
   малую терцию, оба скользят) плюс жёсткая амплитудная модуляция — то самое
   «скрипучее» горло. Здесь ровно это: два пилообразных осциллятора через
   полосовой фильтр, AM ~110 Гц, огибающая с крутой атакой. Разброс от крика к
   крику — по высоте, длине и изгибу скольжения: одинаковый крик дважды подряд
   звучит звонком, а не животным.

   ПРАВИЛА:
   1. Звук только после жеста: AudioContext создаётся лениво и первым тычком.
      До того birdSay работает как работал — пузырём без звука.
   2. Негромко. Птица на столе, а не в ухе: пик −14 дБ и мягкий компрессор.
   3. Никакого зацикленного фона: голос — событие, тишина — состояние. */
let SND3=null;
function sndCtx(){
  if(SND3&&SND3.ctx.state!=="closed")return SND3;
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-18;comp.ratio.value=5;
    const master=ctx.createGain();master.gain.value=.5;
    master.connect(comp);comp.connect(ctx.destination);
    SND3={ctx,master};
  }catch(e){SND3=null;}
  return SND3;
}
/* один крик: f0 — базовая высота, dur — длина, bend — куда скользит */
function birdCry(f0,dur,bend,vol){
  const S=sndCtx();if(!S)return;
  const {ctx,master}=S;
  if(ctx.state==="suspended")ctx.resume();
  const t0=ctx.currentTime+.01;
  const out=ctx.createGain();out.gain.value=0;
  /* горло: полосовой фильтр придаёт крику «клюв» — без него это синтезатор */
  const bp=ctx.createBiquadFilter();bp.type="bandpass";
  bp.frequency.setValueAtTime(f0*1.7,t0);bp.Q.value=1.5;
  bp.connect(out);out.connect(master);
  /* скрип: амплитудная модуляция ~110 Гц, глубина 0.6 */
  const am=ctx.createGain();am.gain.value=.55;
  const lfo=ctx.createOscillator();lfo.type="square";lfo.frequency.value=96+Math.random()*36;
  const lfoG=ctx.createGain();lfoG.gain.value=.6*.55;
  lfo.connect(lfoG);lfoG.connect(am.gain);
  am.connect(bp);
  /* два несущих в терцию, оба скользят по bend */
  const oscs=[];
  for(const k of [1,1.19]){
    const o=ctx.createOscillator();o.type="sawtooth";
    o.frequency.setValueAtTime(f0*k,t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(60,f0*k*bend),t0+dur*.85);
    const g=ctx.createGain();g.gain.value=k===1?.5:.28;
    o.connect(g);g.connect(am);oscs.push(o);
  }
  /* огибающая: атака 12 мс, спад к концу */
  out.gain.setValueAtTime(0,t0);
  out.gain.linearRampToValueAtTime(vol,t0+.012);
  out.gain.setValueAtTime(vol,t0+dur*.55);
  out.gain.exponentialRampToValueAtTime(.001,t0+dur);
  lfo.start(t0);lfo.stop(t0+dur+.02);
  for(const o of oscs){o.start(t0);o.stop(t0+dur+.02);}
}
/* чирик к пузырю: одна-две ноты, вверх — она разговаривает, а не жалуется */
function birdChirp(){
  const f=430+Math.random()*160;
  birdCry(f,.10+Math.random()*.06,1.30+Math.random()*.25,.8);
  if(Math.random()<.6)
    setTimeout(()=>birdCry(f*1.12,.09+Math.random()*.05,1.2,.6),110+Math.random()*70);
}
/* ворчание за хохол: ниже, дольше, вниз — недовольство слышно без перевода */
function birdGrump(){
  birdCry(300+Math.random()*70,.24+Math.random()*.08,.62,.9);
}
