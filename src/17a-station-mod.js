/* ══════════════ модули станции ══════════════ */
/* У станции был силуэт по типу: шесть типов — шесть картинок. Тип отвечает за
   то, что тут можно делать (`stTypeOf(...).tabs`), и это правильно; но две
   торговые станции в разных концах галактики выглядели одинаково, и станция
   переставала быть местом.

   Теперь тип задаёт ядро — оно и остаётся узнаваемым языком «верфь», «завод»,
   «научная», — а сверху навешивается три-шесть модулей от seed системы.
   Каждый модуль это и силуэт, и строка в терминале: игрок видит снаружи, что
   у этой станции есть кантина и ремонтный док, ещё не состыковавшись.

   Модули ничего не открывают и не закрывают: услуги по-прежнему живут в типе.
   Иначе получилось бы, что снаружи станция обещает больше, чем внутри есть. */
const ST_MODULES=[
  {id:"cargo",  ru:"грузовой терминал", sh:"rack",  w:1.2, on:["trade","indust"]},
  {id:"habit",  ru:"жилой сектор",      sh:"drum",  w:1.4},
  {id:"cantina",ru:"кантина",           sh:"pods",  w:1.2},
  {id:"repair", ru:"ремонтный док",     sh:"hangar",w:1.1, on:["yard","trade","indust"]},
  {id:"fuel",   ru:"топливный узел",    sh:"tank",  w:1.2},
  {id:"lab",    ru:"лаборатория",       sh:"dish",  w:.9,  on:["sci","yard"]},
  {id:"med",    ru:"медотсек",          sh:"cross", w:.9},
  {id:"customs",ru:"таможня",           sh:"cage",  w:.8},
  {id:"black",  ru:"чёрный рынок",      sh:"pods",  w:.7,  dark:1},
  {id:"prison", ru:"изолятор",          sh:"cage",  w:.5,  dark:1},
  {id:"green",  ru:"оранжерея",         sh:"farm",  w:.9},
  {id:"comm",   ru:"узел связи",        sh:"mast",  w:1.0},
  {id:"mine",   ru:"рудная контора",    sh:"rack",  w:.9,  on:["indust","mine"]},
  {id:"lux",    ru:"верхний ярус",      sh:"drum",  w:.5,  rich:1}
];
function stationMods(sys){
  const S=sys.station;if(!S)return [];
  if(S.mods)return S.mods;
  const r=rng(hashi(sys.seed,0x50DD,17));
  const ty=S.stype||"trade";
  const danger=sysDanger(sys.sx,sys.sy);
  const pool=ST_MODULES.filter(m=>!m.on||m.on.indexOf(ty)>=0);
  const out=[];
  const n=3+Math.floor(r()*4);
  for(let i=0;i<n&&pool.length;i++){
    /* тёмное чаще на окраине, «верхний ярус» — наоборот, у обжитых систем:
       по набору модулей читается, куда игрок забрался */
    let tot=0;
    for(const m of pool)tot+=m.w*(m.dark?.35+danger*1.8:1)*(m.rich?1.4-danger:1);
    let pick=r()*tot,M=pool[0];
    for(const m of pool){
      pick-=m.w*(m.dark?.35+danger*1.8:1)*(m.rich?1.4-danger:1);
      if(pick<=0){M=m;break;}
    }
    pool.splice(pool.indexOf(M),1);
    /* точка крепления: угол по кольцу и вынос от ядра. Модули разводятся по
       углам, иначе слипаются в один ком с одной стороны. */
    const ang=(i/n)*TAU+(r()-.5)*.5;
    out.push({id:M.id,ru:M.ru,sh:M.sh,ang,d:22+r()*16,s:.7+r()*.7,ph:r()*TAU});
  }
  S.mods=out;
  return out;
}
/* строка для терминала и для подписи в системе */
function stationModsLine(sys){
  const m=stationMods(sys);
  return m.map(q=>q.ru).join(" · ");
}
/* ── силуэты модулей ──
   Каждый рисуется в своей системе координат у конца штанги. Формы намеренно
   простые: на масштабе станции в системе читается только силуэт. */
function drawStModule(q,S){
  const s=q.s;
  ctx.save();
  ctx.rotate(q.ang);
  ctx.translate(q.d,0);
  /* штанга к ядру: без неё модуль висит в пустоте */
  ctx.strokeStyle="rgba(242,178,92,.5)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-q.d+6,0);ctx.lineTo(-4*s,0);ctx.stroke();
  ctx.rotate(-q.ang);                       // сам модуль не заваливается вместе со штангой
  ctx.strokeStyle="rgba(242,178,92,.7)";ctx.lineWidth=1.2;
  ctx.fillStyle="#0b1119";
  if(q.sh==="drum"){
    ctx.beginPath();ctx.rect(-5*s,-7*s,10*s,14*s);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(242,178,92,.28)";
    for(let i=1;i<4;i++){
      ctx.beginPath();ctx.moveTo(-5*s,-7*s+i*3.5*s);ctx.lineTo(5*s,-7*s+i*3.5*s);ctx.stroke();
    }
    /* окна жилого сектора горят вразнобой — единственный тёплый свет станции */
    for(let i=0;i<4;i++){
      const on=Math.sin(G.t*.03+q.ph+i*1.7)>-.2;
      ctx.fillStyle=on?"rgba(255,226,170,.85)":"rgba(255,226,170,.18)";
      ctx.fillRect(-3.4*s,-5.6*s+i*3.4*s,1.8*s,1.4*s);
    }
  }else if(q.sh==="rack"){
    /* стойка контейнеров */
    ctx.beginPath();ctx.moveTo(-6*s,-8*s);ctx.lineTo(-6*s,8*s);ctx.stroke();
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      ctx.fillStyle=((i+j+(q.ph*3|0))%3===0)?"#243a2c":"#1d2f42";
      ctx.beginPath();ctx.rect(-5*s+j*5*s,-7*s+i*5*s,4.4*s,4.4*s);ctx.fill();ctx.stroke();
    }
  }else if(q.sh==="pods"){
    /* гроздь капсул на общей балке */
    ctx.beginPath();ctx.moveTo(-6*s,0);ctx.lineTo(7*s,0);ctx.stroke();
    for(let i=0;i<3;i++){
      const px=-3*s+i*4.4*s, py=(i%2?1:-1)*3.4*s;
      ctx.beginPath();ctx.ellipse(px,py,3*s,2.4*s,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle=(Math.sin(G.t*.045+i*2+q.ph)>0)?"rgba(255,150,90,.8)":"rgba(255,150,90,.2)";
      ctx.beginPath();ctx.arc(px,py,.9*s,0,TAU);ctx.fill();
      ctx.fillStyle="#0b1119";
    }
  }else if(q.sh==="hangar"){
    /* открытый док: створки и пустой зев, куда заходит корабль */
    ctx.beginPath();ctx.rect(-8*s,-6*s,16*s,12*s);ctx.fill();ctx.stroke();
    ctx.fillStyle="#04070c";
    ctx.beginPath();ctx.rect(-2*s,-5*s,9*s,10*s);ctx.fill();
    ctx.strokeStyle="rgba(150,220,255,.55)";
    ctx.beginPath();ctx.moveTo(7*s,-5*s);ctx.lineTo(7*s,5*s);ctx.stroke();
    /* сварка внутри дока вспыхивает */
    if(Math.sin(G.t*.4+q.ph)>.72){
      ctx.fillStyle="rgba(190,240,255,.9)";
      ctx.beginPath();ctx.arc(3*s,(Math.sin(q.ph*7)*2)*s,1.6*s,0,TAU);ctx.fill();
    }
  }else if(q.sh==="tank"){
    /* сферические баки в обойме */
    for(let i=0;i<2;i++){
      const px=(i-.5)*7*s;
      const g=ctx.createRadialGradient(px-2*s,-2*s,0,px,0,5*s);
      g.addColorStop(0,"#26313d");g.addColorStop(1,"#0b1119");
      ctx.fillStyle=g;
      ctx.beginPath();ctx.arc(px,0,4.4*s,0,TAU);ctx.fill();ctx.stroke();
    }
    ctx.strokeStyle="rgba(242,178,92,.35)";
    ctx.beginPath();ctx.moveTo(-8*s,0);ctx.lineTo(8*s,0);ctx.stroke();
  }else if(q.sh==="dish"){
    /* тарелка, медленно ведущая цель */
    ctx.save();ctx.rotate(Math.sin(G.t*.004+q.ph)*.6);
    ctx.beginPath();ctx.ellipse(0,0,7*s,3*s,0,0,TAU);
    ctx.fillStyle="rgba(40,70,90,.85)";ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(150,200,220,.5)";
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-5*s);ctx.stroke();
    ctx.restore();
  }else if(q.sh==="cross"){
    /* медотсек: белый крест — единственный знак, читаемый мгновенно */
    ctx.beginPath();ctx.rect(-6*s,-6*s,12*s,12*s);ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(220,240,255,.8)";
    ctx.fillRect(-1.4*s,-4*s,2.8*s,8*s);
    ctx.fillRect(-4*s,-1.4*s,8*s,2.8*s);
  }else if(q.sh==="cage"){
    /* глухой блок с решёткой и одиноким огнём */
    ctx.beginPath();ctx.rect(-6*s,-5*s,12*s,10*s);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(242,178,92,.3)";
    for(let i=1;i<5;i++){
      ctx.beginPath();ctx.moveTo(-6*s+i*2.4*s,-5*s);ctx.lineTo(-6*s+i*2.4*s,5*s);ctx.stroke();
    }
    ctx.fillStyle=(Math.sin(G.t*.02+q.ph)>.5)?"rgba(255,90,70,.8)":"rgba(255,90,70,.2)";
    ctx.beginPath();ctx.arc(0,-6.6*s,1.2*s,0,TAU);ctx.fill();
  }else if(q.sh==="farm"){
    /* оранжерея: прозрачный купол с зеленью внутри */
    ctx.beginPath();ctx.ellipse(0,2*s,8*s,7*s,0,Math.PI,TAU);
    ctx.fillStyle="rgba(120,190,160,.18)";ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(90,200,120,.55)";
    for(let i=0;i<4;i++){
      const px=(i-1.5)*3.4*s;
      ctx.beginPath();ctx.ellipse(px,0,1.6*s,2.6*s+Math.sin(q.ph+i)*s,0,0,TAU);ctx.fill();
    }
    ctx.strokeStyle="rgba(242,178,92,.5)";
    ctx.beginPath();ctx.moveTo(-8*s,2*s);ctx.lineTo(8*s,2*s);ctx.stroke();
  }else{
    /* мачта связи: решётчатая стрела с проблесковым огнём на конце */
    ctx.beginPath();ctx.moveTo(-2*s,0);ctx.lineTo(2*s,0);ctx.lineTo(1*s,-12*s);ctx.lineTo(-1*s,-12*s);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(242,178,92,.3)";
    for(let i=1;i<5;i++){
      const yy=-i*2.4*s, w=2*s-i*.2*s;
      ctx.beginPath();ctx.moveTo(-w,yy);ctx.lineTo(w,yy-1.4*s);ctx.stroke();
    }
    const bl=Math.pow(Math.max(0,Math.sin(G.t*.06+q.ph)),8);
    ctx.fillStyle="rgba(120,230,255,"+(.25+.7*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(0,-13*s,1.4*s,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function drawStationMods(sys){
  const m=stationMods(sys);
  for(const q of m)drawStModule(q,sys.station);
}
