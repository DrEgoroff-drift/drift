/* ══════════════ погода ══════════════ */
/* На всех планетах было одинаково тихо, и это сильнее прочего мешало им
   различаться: биом, геология и небо у каждой свои, а воздух между ними —
   общий и мёртвый.

   Погода привязана к типу мира и к seed: у пустынной планеты пыльная буря, у
   ледяной метель, у вулканической пепел с углями, у землеподобной дождь и
   туман, у токсичной кислотная морось. В вакууме погоды нет — и это тоже
   характер места: на безвоздушном мире тишина абсолютная.

   Сила не постоянна. Она ходит медленным циклом (минуты), поэтому одна и та же
   планета встречает то ясным днём, то стеной пыли — и возвращаться на неё
   имеет смысл. Частицы не хранятся в массиве: положение считается из хэша
   индекса и времени, так что тысяча снежинок стоит столько же, сколько сто. */
const WEATHER={
  /* dir — насколько осадок несёт ветром, а не гравитацией: у пыли штрих почти
     горизонтальный, у дождя почти вертикальный. Без этого буря выглядит
     редким дождём в другом цвете. */
  dust: {ru:"пыльная буря",  col:[196,150,96],  n:240, spd:16., len:30, tint:.30, dir:.92, sheets:1},
  snow: {ru:"снег",          col:[236,246,255], n:150, spd:2.4, len:0,  tint:.20, dir:0},
  ash:  {ru:"пепел",         col:[168,150,146], n:120, spd:2.0, len:0,  tint:.26, dir:0},
  rain: {ru:"дождь",         col:[168,206,236], n:200, spd:14., len:34, tint:.16, dir:.12},
  acid: {ru:"кислотная морось",col:[186,214,110],n:130, spd:6.5, len:14, tint:.22, dir:.35},
  fog:  {ru:"туман",         col:[196,214,226], n:40,  spd:.8,  len:0,  tint:.34},
  spore:{ru:"споры",         col:[150,236,190], n:90,  spd:1.2, len:0,  tint:.18}
};
/* какая погода возможна на этом типе мира — первая в списке самая частая */
const WEATHER_BY_TYPE={
  desert:  ["dust","dust","fog"],
  ice:     ["snow","snow","fog"],
  volcanic:["ash","ash","dust"],
  terran:  ["rain","fog","spore"],
  ocean:   ["rain","fog","rain"],
  toxic:   ["acid","spore","fog"],
  rocky:   [],
  /* у кристаллического воздух почти пуст — только редкая пыль от осыпей;
     джунгли живут дождём и спорами; металлический безвоздушен; руинный
     засыпан своей же пылью */
  crystal: ["fog","dust"],
  jungle:  ["rain","spore","rain","fog"],
  metal:   [],
  ruin:    ["dust","dust","fog"],
  gas:     []
};
function weatherOf(p){
  if(p.wx)return p.wx;
  const pool=(p.T.atm==="отсутствует")?[]:(wtab(p).wxPool||WEATHER_BY_TYPE[p.type]||[]);
  if(!pool.length){p.wx={kind:null};return p.wx;}
  const r=rng((p.seed^0x3EA7)>>>0);
  p.wx={kind:pool[Math.floor(r()*pool.length)],
    /* период цикла и фаза свои: две планеты одного типа не штормят синхронно */
    per:2600+r()*5200, ph:r()*TAU,
    /* характер: у одной планеты погода почти всегда лёгкая, у другой — злая */
    lo:r()*.25, hi:.45+r()*.75};
  return p.wx;
}
/* текущая сила 0..1 */
function weatherPower(p){
  const w=weatherOf(p);
  if(!w.kind)return 0;
  const t=Math.sin(G.t/w.per*TAU+w.ph)*.5+.5;
  /* степень делает затишья длиннее бурь: буря должна быть событием */
  return clamp(lerp(w.lo,w.hi,Math.pow(t,1.7)),0,1);
}
function weatherName(p){
  const w=weatherOf(p);
  if(!w.kind)return null;
  const k=weatherPower(p);
  if(k<.14)return null;
  const W0=WEATHER[w.kind];
  if(k<=.72)return W0.ru;
  /* род у названий разный, поэтому усиление берётся из таблицы, а не клеится
     окончанием на месте */
  const hard={dust:"сильная пыльная буря",snow:"метель",ash:"пепельная буря",
    rain:"ливень",acid:"кислотный ливень",fog:"густой туман",spore:"облако спор"};
  return hard[w.kind]||W0.ru;
}
/* ── отрисовка ──
   Частицы идут в экранных координатах со сносом от камеры: в мировых они
   выглядели бы приклеенными к земле, а осадки должны идти мимо. */
function drawWeather(p,camx,camy){
  const w=weatherOf(p);
  if(!w.kind)return;
  const k=weatherPower(p);
  if(k<.04)return;
  const W0=WEATHER[w.kind];
  const gp=G.opts.gfx.particles;
  const n=Math.round(W0.n*k*gp);
  const wind=WIND*2.2+ (w.kind==="dust"?2.6*k:0);
  ctx.save();
  /* общая пелена: она делает бурю бурей сильнее, чем сами частицы */
  if(k>.12){
    const c=W0.col;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"rgba("+c.join(",")+","+(W0.tint*k*.5).toFixed(3)+")");
    g.addColorStop(.55,"rgba("+c.join(",")+","+(W0.tint*k).toFixed(3)+")");
    g.addColorStop(1,"rgba("+c.join(",")+","+(W0.tint*k*.7).toFixed(3)+")");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
  const c=W0.col;
  const t=G.t;
  if(w.kind==="fog"){
    /* туман — не частицы, а полосы, ползущие с разной скоростью */
    for(let i=0;i<n;i++){
      const r1=h01(i,1,0xF06), r2=h01(i,2,0xF06), r3=h01(i,3,0xF06);
      const y=r1*H;
      const spd=.12+r2*.5;
      const x=((r3*2400+t*spd*(1+wind*.2)-camx*.35)%(W+520)+W+520)%(W+520)-260;
      const ww=140+r2*320, hh=14+r3*40;
      const g=ctx.createLinearGradient(x,0,x+ww,0);
      g.addColorStop(0,"rgba("+c.join(",")+",0)");
      g.addColorStop(.5,"rgba("+c.join(",")+","+(.05+r2*.09)*k+")");
      g.addColorStop(1,"rgba("+c.join(",")+",0)");
      ctx.fillStyle=g;
      ctx.fillRect(x,y,ww,hh);
    }
    ctx.restore();return;
  }
  ctx.lineCap="round";
  for(let i=0;i<n;i++){
    const r1=h01(i,1,0x5E7), r2=h01(i,2,0x5E7), r3=h01(i,3,0x5E7);
    const spd=W0.spd*(.55+r2*.9);
    /* вертикаль всегда сверху вниз, горизонталь — от ветра; и то и другое
       заворачивается по экрану, поэтому частиц ровно столько, сколько видно */
    const fall=(r1*1400+t*spd)%(H+80);
    const drift=(r3*1600+t*spd*wind*.5-camx*.12)%(W+160);
    const x=((drift)%(W+160)+W+160)%(W+160)-80;
    const y=fall-40;
    const a=(.22+r2*.5)*k;
    if(W0.len>0){
      /* штрих по направлению движения: у дождя почти вертикальный,
         у пыли почти горизонтальный */
      const dr=W0.dir||0;
      const sgn=wind<0?-1:1;
      const vx=sgn*W0.len*(dr*3.4+Math.abs(wind)*.4);
      const vy=W0.len*(1-dr*.82);
      ctx.strokeStyle="rgba("+c.join(",")+","+a.toFixed(3)+")";
      ctx.lineWidth=w.kind==="rain"?1:1.4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+vx,y+vy);ctx.stroke();
    }else{
      /* снег и пепел планируют: своя фаза покачивания у каждой частицы */
      const sw=Math.sin(t*.02*(.5+r2)+r3*TAU)*(10+r2*22);
      ctx.fillStyle="rgba("+c.join(",")+","+a.toFixed(3)+")";
      const s=.9+r2*2.1;
      ctx.beginPath();ctx.arc(x+sw+wind*8,y,s,0,TAU);ctx.fill();
    }
  }
  /* полотна пыли: широкие полупрозрачные пласты, проносящиеся поперёк кадра.
     Именно они делают бурю бурей — отдельные штрихи глаз читает как помехи,
     а пласт закрывает половину мира и заставляет ждать, пока пройдёт. */
  if(W0.sheets&&k>.25){
    const sgn=wind<0?-1:1;
    for(let i=0;i<4;i++){
      const r1=h01(i,21,0xD457), r2=h01(i,22,0xD457);
      const spd=(1.6+r1*3.2)*(1+k);
      const x=((r2*3000+t*spd*sgn)%(W+900)+W+900)%(W+900)-450;
      const y=H*(.15+r1*.6), hh=H*(.18+r2*.35);
      const g=ctx.createLinearGradient(x,0,x+520,0);
      g.addColorStop(0,"rgba("+c.join(",")+",0)");
      g.addColorStop(.5,"rgba("+c.join(",")+","+(.10+r1*.12)*k+")");
      g.addColorStop(1,"rgba("+c.join(",")+",0)");
      ctx.fillStyle=g;ctx.fillRect(x,y-hh*.5,520,hh);
    }
  }
  /* угли в пепле: редкие, живые, единственный тёплый свет в сером */
  if(w.kind==="ash"&&k>.3){
    for(let i=0;i<Math.round(12*k*gp);i++){
      const r1=h01(i,7,0xE12), r2=h01(i,8,0xE12);
      const y=((r1*1400+t*1.1)%(H+60))-30;
      const x=((r2*1700+t*.7*wind-camx*.1)%(W+120)+W+120)%(W+120)-60;
      const gl=.4+.6*Math.abs(Math.sin(t*.05+i));
      ctx.fillStyle="rgba(255,"+Math.round(120+80*gl)+",60,"+(.5*gl*k).toFixed(2)+")";
      ctx.beginPath();ctx.arc(x,y,1.4+gl,0,TAU);ctx.fill();
    }
  }
  /* молния в сильном дожде: вспышка кадром, потом ветвистый разряд */
  if(w.kind==="rain"&&k>.5){
    const per=420;
    const ph=(t%per)/per;
    if(ph<.06){
      const f=Math.pow(1-ph/.06,2);
      ctx.fillStyle="rgba(200,225,255,"+(.30*f*k).toFixed(3)+")";
      ctx.fillRect(0,0,W,H);
      const bx=W*(((t/per)|0)%7)/7+W*.08;
      ctx.strokeStyle="rgba(226,240,255,"+(.8*f).toFixed(2)+")";
      ctx.lineWidth=1.8;
      ctx.beginPath();
      let lx=bx,ly=0;
      ctx.moveTo(lx,ly);
      for(let s=0;s<7;s++){
        lx+=(h01(s,(t/per)|0,0x1177)-.5)*70;ly+=H*.09;
        ctx.lineTo(lx,ly);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
