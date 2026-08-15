/* ══════════════ астронавт ══════════════ */
/* один и тот же силуэт на поверхности и в шахте: ранец, шлем с забралом,
   фонарь и шагающие ноги. Акцент берётся от корабля, на котором прилетел. */
function drawAstronaut(o){
  const acc=hex2rgb(shipData(G.shipId).col);
  /* амплитуда шага плавно нарастает/затухает (o.amp), а не щёлкает 0/1 —
     иначе ноги дёргаются при каждом микро-отрыве от земли на неровностях */
  const amp=o.amp!=null?o.amp:(o.walk?1:0);
  const walk=Math.sin(o.phase)*amp;
  const walk2=Math.sin(o.phase+Math.PI)*amp;
  const air=o.air;
  const suit="#dfe7ec", suitD="#9fb0bb", dark="#121a24";
  ctx.save();
  ctx.scale(o.face||1,1);
  if(o.jet){   // ранцевый импульс при прыжке
    const f=5+Math.random()*7;
    const g=ctx.createLinearGradient(0,4,0,4+f);
    g.addColorStop(0,"rgba(255,220,150,.9)");g.addColorStop(1,"rgba(255,110,60,0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-3.4,4);ctx.lineTo(0,4+f);ctx.lineTo(3.4,4);ctx.closePath();ctx.fill();
  }
  /* ноги */
  ctx.strokeStyle=suitD;ctx.lineWidth=2.6;ctx.lineCap="round";
  const knee=air?3:0;
  for(const [sw,sx] of [[walk,-1],[walk2,1]]){
    const kx=sx*1.2+sw*2.6, ky=6+ (air?1:0);
    const fx=sx*1.6+sw*4.6, fy=air?9.5-knee:11.5;
    ctx.beginPath();ctx.moveTo(sx*1.4,2.5);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();
    ctx.strokeStyle=dark;ctx.lineWidth=3.2;
    ctx.beginPath();ctx.moveTo(fx-1.6,fy);ctx.lineTo(fx+1.8,fy);ctx.stroke();  // ботинок
    ctx.strokeStyle=suitD;ctx.lineWidth=2.6;
  }
  /* ранец */
  ctx.fillStyle="#2b3846";
  ctx.beginPath();ctx.roundRect?ctx.roundRect(-5.4,-4.2,4.2,7.6,1.4):ctx.rect(-5.4,-4.2,4.2,7.6);
  ctx.fill();
  ctx.strokeStyle=rgba(acc,.75);ctx.lineWidth=.9;ctx.stroke();
  ctx.strokeStyle=rgba(acc,.5);
  ctx.beginPath();ctx.moveTo(-4.4,-5.6);ctx.lineTo(-4.4,-4.2);ctx.stroke();     // антенна
  ctx.fillStyle=Math.sin(G.t*.12)>0?"#7fe6d8":"rgba(127,230,216,.25)";
  ctx.beginPath();ctx.arc(-4.4,-6.1,1,0,TAU);ctx.fill();
  /* корпус скафандра */
  const bg=ctx.createLinearGradient(-3,-4,3,4);
  bg.addColorStop(0,suit);bg.addColorStop(1,suitD);
  ctx.fillStyle=bg;
  ctx.beginPath();
  ctx.moveTo(-3.2,-4);ctx.lineTo(3.2,-4);ctx.lineTo(3.6,2.2);
  ctx.lineTo(-3.6,2.2);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(20,30,40,.55)";ctx.lineWidth=.8;ctx.stroke();
  ctx.fillStyle=rgba(acc,.85);ctx.fillRect(-3.2,-1.2,6.4,1.3);                  // поясной кант
  ctx.fillStyle="#1b2735";ctx.fillRect(.6,-3.2,2.4,2);                          // нагрудный блок
  ctx.fillStyle=o.suitLow?"#ff6b57":"#7fe6d8";ctx.fillRect(1.2,-2.8,1.2,.9);
  /* руки */
  ctx.strokeStyle=suit;ctx.lineWidth=2.2;
  const armSw=o.mining?0:walk2*2.4;
  ctx.beginPath();ctx.moveTo(-2.2,-3);ctx.lineTo(-3.4-armSw*.4,-.4);
  ctx.lineTo(-3+armSw*.5,2.2);ctx.stroke();
  if(o.mining){ ctx.beginPath();ctx.moveTo(2.6,-3);ctx.lineTo(5.4,-1.4);ctx.lineTo(7.4,-.2);ctx.stroke(); }
  else { ctx.beginPath();ctx.moveTo(2.4,-3);ctx.lineTo(3.6+armSw*.4,-.4);
         ctx.lineTo(3.2-armSw*.5,2.2);ctx.stroke(); }
  /* шлем */
  ctx.fillStyle=suit;
  ctx.beginPath();ctx.arc(.2,-6.6,4.1,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(20,30,40,.5)";ctx.lineWidth=.9;ctx.stroke();
  ctx.fillStyle="#0a1a26";
  ctx.beginPath();ctx.ellipse(.9,-6.7,3,2.5,-.12,0,TAU);ctx.fill();            // забрало
  const vg=ctx.createLinearGradient(-1.6,-8.6,2.8,-5);
  vg.addColorStop(0,"rgba(160,235,255,.75)");vg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=vg;
  ctx.beginPath();ctx.ellipse(.9,-6.7,3,2.5,-.12,0,TAU);ctx.fill();
  ctx.fillStyle=rgba(acc,.9);
  ctx.beginPath();ctx.arc(-2.9,-7.6,1.1,0,TAU);ctx.fill();                      // фонарь
  ctx.restore();
  /* луч фонаря — только под землёй */
  if(o.lamp){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const f=(o.face||1);
    const g=ctx.createRadialGradient(f*3,-7,2,f*3,-7,64);
    g.addColorStop(0,"rgba(255,244,205,.30)");g.addColorStop(1,"rgba(255,220,150,0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(f*2,-8.6);
    ctx.lineTo(f*62,-30);ctx.lineTo(f*62,20);ctx.lineTo(f*2,-5);
    ctx.closePath();ctx.fill();
    ctx.restore();
  }
}

/* ══════════════ флора ══════════════ */
/* каждое растение — своё: ствол из сегментов, ветви и одна из четырёх крон.
   Цвета берутся от палитры планеты, поэтому на токсичном мире флора ядовитая,
   а на ледяном — блёклая. */
const PLANT_FORM=["стеблевой","ветвистый","папоротниковый","стручковый","коралловый","стелющийся"];
const PLANT_TRAIT=["хрупкий","светящийся","колючий","мясистый","полупрозрачный","жёсткий"];
/* «геном планеты»: у каждого мира свой уклон по формам и размерам жизни,
   поэтому соседние планеты выглядят по-разному, а не как один и тот же набор */
/* Форм стало двенадцать: к прежним семи добавлены те, что узнаются силуэтом
   с любого расстояния — гриб, спиральное дерево, зонтик, шар на привязи,
   ленточная трава (7..11).

   Уклон не просто случайный по всем формам: две-три формы получают сильный
   перевес, остальные почти гасятся. Иначе на каждой планете растёт весь
   каталог сразу, и планеты снова перестают различаться — «своя флора» это
   не про количество видов, а про то, что здесь растёт именно вот это. */
const PLANT_KINDS=12;
function planetBiome(p){
  if(p.biome)return p.biome;
  const r=rng(p.seed^0x8107E);
  const bias=new Array(PLANT_KINDS).fill(0).map(()=>.06+r()*.2);
  const domN=2+Math.floor(r()*2);
  for(let i=0;i<domN;i++)bias[Math.floor(r()*PLANT_KINDS)]+=1.2+r()*1.6;
  /* у безвоздушных и вулканических миров крупных форм почти нет: нечем дышать
     и нечему расти большим — это читается как характер места, а не как правило */
  const harsh=p.T.atm==="отсутствует"||p.type==="volcanic"||p.type==="crystal"||p.type==="metal";
  p.biome={kindBias:bias,scale:(harsh?.5:.7)+r()*(harsh?.5:.9),
    giantChance:harsh?r()*.03:r()*.14,hueBias:r()};
  return p.biome;
}
function pickKindByBias(bias,r){
  const sum=bias.reduce((a,b)=>a+b,0);let u=r()*sum;
  for(let i=0;i<bias.length;i++){u-=bias[i];if(u<=0)return i;}
  return bias.length-1;
}
function genPlant(r,p,x,gy){
  const bi=planetBiome(p);
  const kind=pickKindByBias(bi.kindBias,r);
  const giant=r()<bi.giantChance;
  /* гигант вчетверо выше соседей превращался в салатовый блин во весь
     распадок: крона такой ширины перестаёт быть растением и читается
     пятном краски. Втрое — предел, после которого форма ещё видна */
  const sizeMul=bi.scale*(giant?(1.8+r()*1.4):(.4+r()*1.3));
  /* высота по форме: гриб и зонтик заметно выше травы, иначе силуэт не работает */
  const h=(kind===6?6+r()*10:
          (kind===4?10+r()*16:
          (kind===7?34+r()*54:
          (kind===9?46+r()*70:
          (kind===8?40+r()*60:
          (kind===10?26+r()*36:
          (kind===11?18+r()*34:20+r()*58)))))))*sizeMul;
  const segs=3+Math.floor(r()*4);
  const lean=(r()-.5)*.5, curl=(r()-.5)*.7;
  const branches=[];
  const nb=kind===1?3+Math.floor(r()*4):(kind===2?5+Math.floor(r()*4):
    (kind>=4&&kind<=11?0:Math.floor(r()*3)));
  for(let i=0;i<nb;i++){
    branches.push({t:.25+r()*.7, ang:(r()<.5?-1:1)*(.5+r()*.9), len:h*(.16+r()*.34), w:1+r()*1.6});
  }
  const pal=p.T.pal;
  const base=pal[Math.min(pal.length-1,2+Math.floor(r()*2))];
  const hue=(r()*.5+bi.hueBias*.5)%1;
  /* ── лист берёт цвет у мира ──
     Зелень считалась почти независимо от планеты: +130 к зелёному каналу и
     столько же от оттенка давали чистый салатовый, и на приглушённом мире
     кроны читались кислотными блинами — самым громким пятном кадра, хотя
     это фон, а не событие. Лист по-прежнему свой у каждой биосферы, но
     теперь он ЗАМЕШАН на палитре мира: подмешиваем к нему тон породы, и
     растение садится в свой пейзаж, оставаясь опознаваемо живым. */
  const raw=[clamp(base[0]*.5+hue*150,20,255),clamp(base[1]*.6+120+hue*55,30,255),
             clamp(base[2]*.5+40+hue*90,20,255)];
  const gr=pal[Math.min(pal.length-1,3)];
  const leaf=[lerp(raw[0],gr[0],.28),lerp(raw[1],gr[1],.22),lerp(raw[2],gr[2],.28)];
  const stem=[leaf[0]*.5+20,leaf[1]*.45+26,leaf[2]*.45+22];
  return {x,y:gy,h,kind,segs,lean,curl,branches,
    /* параметры новых форм: шляпка, витки спирали, рёбра зонтика, шары */
    cap:.55+r()*.6, turns:2+r()*2.4, ribs:5+Math.floor(r()*4),
    balls:1+Math.floor(r()*3), ribbons:3+Math.floor(r()*5),
    leaf,stem,glow:r()<.28,bloom:r()<.4,pods:2+Math.floor(r()*4),
    facets:5+Math.floor(r()*4),blobs:3+Math.floor(r()*4),
    sway:kind===4?0:.008+r()*.02, phase:r()*TAU, w:(1.4+r()*2.2)*Math.min(2,sizeMul),
    giant,
    name:genName(r)+" "+pick(PLANT_FORM,r)+", "+pick(PLANT_TRAIT,r),
    scanned:false};
}
/* Формы, которые опознаются по одному силуэту: гриб, спираль, зонтик, шар на
   привязи, ленты. Ни одна из них не «палка с листьями» — именно это и было
   главной претензией к прежней флоре.

   Свечение снизу шляпки и внутри мембраны — не украшение: оно отделяет
   растение от грунта в темноте, когда силуэт уже не читается. */
function drawPlantAlien(pl,x,y,stemC,leafC,sc){
  const bend=Math.sin(G.t*pl.sway+pl.phase);
  const gl=sc?"127,230,216":((pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0));
  ctx.save();ctx.translate(x,y);
  /* затмение (06a-celest): то, что живёт светом, на свету и складывается —
     флора приседает и жмётся, пока звезда закрыта. Это единственная реакция
     жизни на календарь и единственное, по чему затмение видно не глядя вверх */
  const DK=typeof celDark==="function"?celDark():0;
  if(DK>.05)ctx.scale(1-.10*DK,1-.32*DK);
  const lean=(pl.lean+bend*.22)*pl.h*.2;
  if(pl.kind===7){
    /* гриб: толстая ножка с утолщением у земли, широкая шляпка, пластинки */
    const capW=pl.h*pl.cap, st=Math.max(2.4,pl.w*1.5);
    ctx.fillStyle=stemC;
    ctx.beginPath();
    ctx.moveTo(-st*1.5,0);
    ctx.quadraticCurveTo(-st*.7,-pl.h*.45,-st*.5+lean,-pl.h*.92);
    ctx.lineTo(st*.5+lean,-pl.h*.92);
    ctx.quadraticCurveTo(st*.7,-pl.h*.45,st*1.5,0);
    ctx.closePath();ctx.fill();
    /* пластинки под шляпкой */
    ctx.strokeStyle="rgba(0,0,0,.28)";ctx.lineWidth=1;
    for(let i=-3;i<=3;i++){
      ctx.beginPath();ctx.moveTo(lean,-pl.h*.9);
      ctx.lineTo(lean+i*capW*.26,-pl.h*.9+Math.abs(i)*1.6+3);ctx.stroke();
    }
    ctx.fillStyle=leafC;
    ctx.beginPath();
    ctx.moveTo(lean-capW,-pl.h*.88);
    ctx.quadraticCurveTo(lean,-pl.h*1.30,lean+capW,-pl.h*.88);
    ctx.quadraticCurveTo(lean,-pl.h*.98,lean-capW,-pl.h*.88);
    ctx.closePath();ctx.fill();
    /* крап на шляпке — по нему гриб и опознаётся грибом */
    ctx.fillStyle="rgba(255,255,255,.18)";
    for(let i=0;i<5;i++){
      const u=(i/4-.5)*1.7;
      ctx.beginPath();
      ctx.ellipse(lean+u*capW*.8,-pl.h*(1.02+Math.cos(u)*.06),capW*.09,capW*.05,0,0,TAU);
      ctx.fill();
    }
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(lean,-pl.h*.86,0,lean,-pl.h*.86,capW*1.5);
      g.addColorStop(0,"rgba("+gl+",.26)");g.addColorStop(1,"rgba("+gl+",0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(lean,-pl.h*.86,capW*1.5,0,TAU);ctx.fill();
      ctx.restore();
    }
  }else if(pl.kind===8){
    /* спиральное дерево: ствол уходит витками, листья только на внешней кромке */
    /* виток должен быть толстым и широким: тонкая спираль малого радиуса
       читается закорючкой, а не деревом */
    ctx.strokeStyle=stemC;ctx.lineWidth=Math.max(3,pl.w*2.2);ctx.lineCap="round";
    ctx.beginPath();
    const N=46;
    for(let i=0;i<=N;i++){
      const t=i/N;
      const a=t*pl.turns*TAU;
      const rr=pl.h*.30*(1-t*.62);
      const px=Math.sin(a)*rr+lean*t, py=-pl.h*t;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();
    ctx.fillStyle=leafC;
    for(let i=0;i<6;i++){
      const t=.35+i/6*.6;
      const a=t*pl.turns*TAU;
      const rr=pl.h*.30*(1-t*.62);
      const px=Math.sin(a)*rr+lean*t, py=-pl.h*t;
      ctx.beginPath();
      ctx.ellipse(px+Math.sign(Math.sin(a))*5,py,pl.h*.10,pl.h*.035,a,0,TAU);
      ctx.fill();
    }
    ctx.lineCap="butt";
  }else if(pl.kind===9){
    /* зонтик: тонкая высокая ножка и натянутая мембрана на рёбрах */
    const capW=pl.h*.42*pl.cap;
    ctx.strokeStyle=stemC;ctx.lineWidth=Math.max(1.2,pl.w*.7);
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.quadraticCurveTo(lean*.5,-pl.h*.5,lean,-pl.h);ctx.stroke();
    ctx.fillStyle=leafC;
    ctx.globalAlpha=.85;
    /* купол одной дугой, зубцы только по самой кромке: цепочка квадратичных
       кривых по всей ширине давала гусеницу вместо мембраны */
    ctx.beginPath();
    ctx.ellipse(lean,-pl.h*.96,capW,pl.h*.20,0,Math.PI,TAU);
    for(let i=pl.ribs;i>=0;i--){
      const u=i/pl.ribs-.5;
      ctx.lineTo(lean+u*capW*2,-pl.h*.96+(i%2?pl.h*.035:0));
    }
    ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1;
    for(let i=0;i<=pl.ribs;i++){
      const u=i/pl.ribs-.5;
      ctx.beginPath();ctx.moveTo(lean,-pl.h*1.02);
      ctx.lineTo(lean+u*capW*2,-pl.h*.95);ctx.stroke();
    }
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      ctx.fillStyle="rgba("+gl+",.14)";
      ctx.beginPath();ctx.ellipse(lean,-pl.h*.9,capW*1.3,pl.h*.18,0,0,TAU);ctx.fill();
      ctx.restore();
    }
  }else if(pl.kind===10){
    /* шар на привязи: висит выше, чем стоял бы стебель, и медленно дышит */
    const lift=pl.h*(.5+.06*Math.sin(G.t*.01+pl.phase));
    ctx.strokeStyle=stemC;ctx.lineWidth=1;
    for(let i=0;i<pl.balls;i++){
      const bx=(i-(pl.balls-1)/2)*pl.h*.34+lean;
      const br=pl.h*(.16+((i*37)%5)/5*.1);
      const by=-lift-pl.h*.3-((i*23)%4)/4*pl.h*.16;
      ctx.beginPath();ctx.moveTo(bx*.4,0);
      ctx.quadraticCurveTo(bx*.7,by*.4,bx,by+br);ctx.stroke();
      const g=ctx.createRadialGradient(bx-br*.3,by-br*.35,br*.1,bx,by,br);
      g.addColorStop(0,"rgba(255,255,255,.35)");
      g.addColorStop(.5,leafC);
      g.addColorStop(1,"rgba(0,0,0,.25)");
      ctx.fillStyle=g;
      ctx.beginPath();ctx.ellipse(bx,by,br,br*1.12,0,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=.8;ctx.stroke();
      ctx.strokeStyle=stemC;ctx.lineWidth=1;
      if(pl.glow){
        ctx.save();ctx.globalCompositeOperation="lighter";
        const gg=ctx.createRadialGradient(bx,by,0,bx,by,br*2.4);
        gg.addColorStop(0,"rgba("+gl+",.20)");gg.addColorStop(1,"rgba("+gl+",0)");
        ctx.fillStyle=gg;ctx.beginPath();ctx.arc(bx,by,br*2.4,0,TAU);ctx.fill();
        ctx.restore();
      }
    }
  }else{
    /* ленты: широкие плоские полосы, идущие волной от основания */
    for(let i=0;i<pl.ribbons;i++){
      const ph=pl.phase+i*1.3;
      const w=pl.h*(.05+((i*29)%5)/5*.05);
      const hh=pl.h*(.6+((i*41)%6)/6*.6);
      const sway=Math.sin(G.t*pl.sway*1.6+ph)*pl.h*.22+lean;
      ctx.fillStyle=i%2?leafC:stemC;
      ctx.globalAlpha=.9;
      ctx.beginPath();
      ctx.moveTo(-w,0);
      ctx.quadraticCurveTo(sway*.4-w*.5,-hh*.55,sway,-hh);
      ctx.quadraticCurveTo(sway*.4+w*.5,-hh*.55,w,0);
      ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;
    }
  }
  ctx.restore();
}
function drawPlant(pl,x,y){
  const sc=pl.scanned;
  const stemC=sc?"rgba(127,230,216,.85)":"rgb("+(pl.stem[0]|0)+","+(pl.stem[1]|0)+","+(pl.stem[2]|0)+")";
  const leafC=sc?"rgba(127,230,216,.55)":"rgb("+(pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0)+")";
  /* друза — без ствола: гроздь гранёных кристаллов, растёт прямо из грунта */
  if(pl.kind===4){
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<pl.facets;i++){
      const a=(i/pl.facets-.5)*1.6, len=pl.h*(.55+((i*37)%10)/10*.45);
      const w=pl.w*(.6+((i*53)%7)/7*.6);
      ctx.fillStyle=leafC;ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(Math.sin(a)*w,-len*.5);ctx.lineTo(Math.sin(a)*w*.3,-len);
      ctx.lineTo(-Math.sin(a)*w*.2,-len*.5);ctx.closePath();ctx.fill();
      ctx.strokeStyle=sc?"rgba(127,230,216,.5)":"rgba(255,255,255,.25)";ctx.lineWidth=.6;ctx.stroke();
    }
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(0,-pl.h*.4,0,0,-pl.h*.4,pl.h*.9);
      g.addColorStop(0,sc?"rgba(127,230,216,.3)":"rgba("+(pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0)+",.26)");
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-pl.h*.4,pl.h*.9,0,TAU);ctx.fill();
      ctx.restore();
    }
    ctx.restore();return;
  }
  /* ковёр — низкая клумба бугров, без стебля */
  if(pl.kind===6){
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle=leafC;
    for(let i=0;i<pl.blobs;i++){
      const bx=(i-(pl.blobs-1)/2)*pl.h*.9, br=pl.h*(.5+((i*29)%6)/6*.5);
      ctx.beginPath();ctx.ellipse(bx,-br*.4,br*.9,br*.55,0,0,TAU);ctx.fill();
    }
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=sc?"rgba(127,230,216,.2)":"rgba("+(pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0)+",.18)";
      ctx.beginPath();ctx.ellipse(0,-pl.h*.3,pl.h*1.4,pl.h*.7,0,0,TAU);ctx.fill();
      ctx.restore();
    }
    ctx.restore();return;
  }
  /* ── формы, узнаваемые силуэтом ── */
  if(pl.kind>=7&&pl.kind<=11){drawPlantAlien(pl,x,y,stemC,leafC,sc);return;}
  const bend=Math.sin(G.t*pl.sway+pl.phase);
  ctx.save();ctx.translate(x,y);
  /* ствол: ломаная из сегментов, верх качается сильнее низа */
  const pts=[[0,0]];
  for(let i=1;i<=pl.segs;i++){
    const t=i/pl.segs;
    pts.push([ (pl.lean+bend*.28)*pl.h*t*t + Math.sin(t*3.1)*pl.curl*pl.h*.18, -pl.h*t ]);
  }
  const tip=pts[pts.length-1];
  ctx.strokeStyle=stemC;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.lineWidth=pl.w;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.stroke();
  const at=t=>{
    const f=clamp(t,0,1)*(pts.length-1), i=Math.floor(f), q=f-i;
    const a=pts[Math.min(i,pts.length-1)], b=pts[Math.min(i+1,pts.length-1)];
    return [lerp(a[0],b[0],q),lerp(a[1],b[1],q)];
  };
  /* ветви */
  ctx.lineWidth=Math.max(.8,pl.w*.55);
  for(const b of pl.branches){
    const [bx,by]=at(b.t);
    const a=b.ang+bend*.35;
    ctx.beginPath();ctx.moveTo(bx,by);
    ctx.quadraticCurveTo(bx+Math.sin(a)*b.len*.6,by-b.len*.35,
                         bx+Math.sin(a)*b.len,by-b.len*.62);
    ctx.stroke();
    if(pl.kind===2){   // папоротник: перья вдоль ветви
      ctx.strokeStyle=leafC;ctx.lineWidth=.9;
      for(let k=1;k<=4;k++){
        const q=k/5;
        const px=bx+Math.sin(a)*b.len*q, py=by-b.len*.62*q;
        ctx.beginPath();ctx.moveTo(px,py);
        ctx.lineTo(px+Math.sin(a)*4,py-5);ctx.stroke();
      }
      ctx.strokeStyle=stemC;ctx.lineWidth=Math.max(.8,pl.w*.55);
    }else if(pl.kind===3){   // стручки на концах ветвей
      ctx.fillStyle=leafC;
      ctx.beginPath();
      ctx.ellipse(bx+Math.sin(a)*b.len,by-b.len*.62,2.4,3.6,a*.5,0,TAU);ctx.fill();
    }
  }
  ctx.lineCap="butt";
  /* крона */
  ctx.fillStyle=leafC;
  if(pl.kind===0){
    for(let i=0;i<3;i++){
      const o=(i-1)*4.5;
      ctx.beginPath();
      ctx.ellipse(tip[0]+o*.8,tip[1]-3-Math.abs(o)*.5,4.6-Math.abs(i-1)*1.2,6.4,o*.06,0,TAU);
      ctx.fill();
    }
  }else if(pl.kind===1){
    ctx.beginPath();ctx.arc(tip[0],tip[1]-4,5.6,0,TAU);ctx.fill();
    ctx.fillStyle=sc?"rgba(127,230,216,.35)":"rgba(255,255,255,.16)";
    ctx.beginPath();ctx.arc(tip[0]-1.6,tip[1]-5.6,2.4,0,TAU);ctx.fill();
  }else if(pl.kind===2){
    for(let i=-1;i<=1;i++){
      ctx.beginPath();ctx.moveTo(tip[0],tip[1]);
      ctx.quadraticCurveTo(tip[0]+i*9,tip[1]-9,tip[0]+i*13,tip[1]-1);
      ctx.quadraticCurveTo(tip[0]+i*7,tip[1]-4,tip[0],tip[1]);ctx.fill();
    }
  }else{
    for(let i=0;i<pl.pods;i++){
      const a=-Math.PI/2+(i-(pl.pods-1)/2)*.55+bend*.2;
      ctx.beginPath();
      ctx.ellipse(tip[0]+Math.cos(a)*6,tip[1]+Math.sin(a)*6,2.6,4.4,a+Math.PI/2,0,TAU);
      ctx.fill();
    }
  }
  if(pl.bloom){
    ctx.fillStyle=sc?"rgba(127,230,216,.9)":"rgba(255,225,140,.85)";
    ctx.beginPath();ctx.arc(tip[0],tip[1]-6,1.7,0,TAU);ctx.fill();
  }
  if(pl.glow){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(tip[0],tip[1]-3,0,tip[0],tip[1]-3,16);
    g.addColorStop(0,sc?"rgba(127,230,216,.28)":"rgba("+(pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0)+",.22)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(tip[0],tip[1]-3,16,0,TAU);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* ══════════════ фауна ══════════════ */
/* Наверху зверьё безобидное — его сканируют ради данных. В шахте живут
   породные грызуны: кусают скафандр, оглушаются импульсом (ОГОНЬ), с
   оглушённого берут образец (ТОРМ) — углерод и редкий ксенобиом. */
const BEAST_FORM=["прыгун","ползун","шестиног","парусник","круглыш","тихоход"];
const BEAST_TRAIT=["пугливый","любопытный","медлительный","стайный","бронированный","светящийся"];
/* натуральная гамма — мех/шкура/чешуя, без ядовитых неоновых тонов;
   лёгкий уклон от планеты и куда больший разброс светлота/охра/серость,
   чем радужный hue-поворот, который был раньше */
const FUR_TONES=[
  [101,72,42],[134,103,63],[168,138,94],[201,176,132],[221,201,163],
  [96,92,84],[132,128,118],[74,70,66],[47,44,40],
  [110,100,72],[86,96,72],[128,118,84],[150,132,96],[64,58,52]
];
function furColor(r,base){
  const a=pick(FUR_TONES,r), bT=pick(FUR_TONES,r);
  const m=.3+r()*.5;
  const lum=.82+r()*.36;
  return [
    clamp(lerp(a[0],bT[0],m)*lum+base[0]*.06,18,235),
    clamp(lerp(a[1],bT[1],m)*lum+base[1]*.06,18,235),
    clamp(lerp(a[2],bT[2],m)*lum+base[2]*.06,18,235)
  ];
}
/* силуэт — не всегда одна и та же капсула: пять архетипов пропорций плюс
   гранёный (не идеально гладкий) контур тела, свой на каждую тварь */
const BEAST_SHAPES=["capsule","long","stout","upright","segmented"];
/* Пять чужих архетипов вместо «земного зверя другого цвета». Как и у флоры,
   планета получает уклон: на одной висят медузы, на другой ходят панцирные —
   если каждый мир населён всем каталогом, миры опять сливаются.

   Летающие формы держатся над грунтом (hover) — это единственное, что тут
   отличается по механике отрисовки, и оно же сильнее всего меняет ощущение
   от планеты. */
const BEAST_ALIEN=["jelly","strider","crystal","manta","shell"];
function beastBias(p){
  if(p.fauna2)return p.fauna2;
  const r=rng(p.seed^0xFA02);
  const b=BEAST_ALIEN.map(()=>.08+r()*.18);
  const n=1+Math.floor(r()*2);
  for(let i=0;i<n;i++)b[Math.floor(r()*b.length)]+=1.1+r()*1.4;
  p.fauna2={bias:b,alienShare:.45+r()*.45};
  return p.fauna2;
}
function genBeast(r,p,x,gy){
  const pal=p.T.pal;
  const base=pal[2+Math.floor(r()*2)];
  const body=furColor(r,base);
  const bi=planetBiome(p);
  const fb=beastBias(p);
  /* часть фауны — чужие архетипы, остальное прежние формы: смесь читается
     живее, чем один тип на всю планету */
  const alien=r()<fb.alienShare?BEAST_ALIEN[pickKindByBias(fb.bias,r)]:null;
  const sizeMul=bi.scale*(r()<.08?2.2+r()*1.6:.55+r()*1.1);
  const shape=Math.floor(r()*BEAST_SHAPES.length);
  /* гранёный контур тела: N опорных точек с собственным радиусом —
     не идеальный эллипс, а слегка неровный многоугольник */
  const nv=7+Math.floor(r()*4);
  const poly=[];
  for(let i=0;i<nv;i++){
    const a=i/nv*TAU;
    poly.push([Math.cos(a),Math.sin(a)*(.62+r()*.14)*(.85+r()*.3)]);
  }
  const bx=shape===1?1.55:(shape===2?.92:(shape===3?.8:1.15));
  const by=shape===1?.68:(shape===2?1.05:(shape===3?1.15:.85));
  const headSize=shape===3?.78:(shape===1?.46:.62);
  const headX=shape===1?1.25:(shape===2?.75:.95);
  const furTufts=6+Math.floor(r()*7);
  return {x,y:gy,vx:(r()<.5?-1:1)*(.06+r()*.12),face:1,
    r:(5+r()*7)*sizeMul, legs:shape===4?6+Math.floor(r()*2)*2:2+Math.floor(r()*3)*2,
    tail:r()<.6, crest:r()<.45,
    ears:r()<.5, spots:Math.floor(r()*4), glow:r()<.2,
    shape,poly,bx,by,headSize,headX,furTufts,
    body, eye:r()<.5?"#101820":"#f2f7ff",
    hop:r()<.45, phase:r()*TAU, spd:.09+r()*.1,
    alien, tent:4+Math.floor(r()*4), facets:5+Math.floor(r()*4),
    span:1.5+r()*1.2, hover:(alien==="jelly"||alien==="manta")?(14+r()*30):0,
    name:genName(r)+" "+pick(BEAST_FORM,r)+", "+pick(BEAST_TRAIT,r),
    scanned:false, shy:0};
}
/* ── чужие архетипы ──
   Не «зверь другого цвета»: медуза висит и пульсирует, ходун стоит на высоких
   дугах, кристаллическое насекомое гранёное и светится в шве, манта идёт
   волной по крылу, панцирный похож на камень, пока не пошёл. */
function drawBeastAlien(b,x,y,hostile,stun){
  const c=b.body;
  const col=(k,a)=>"rgba("+Math.round(c[0]*k)+","+Math.round(c[1]*k)+","+Math.round(c[2]*k)+","+a+")";
  const t=G.t*b.spd+b.phase;
  const R=b.r;
  const hov=b.hover?b.hover*(1+.16*Math.sin(t*.6)):0;
  ctx.save();
  ctx.translate(x,y-R*.9-hov);
  ctx.scale(b.face,1);
  if(stun>0){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,0,0,0,0,R*2.6);
    g.addColorStop(0,"rgba(140,220,255,.3)");g.addColorStop(1,"rgba(120,200,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*2.6,0,TAU);ctx.fill();
    ctx.restore();
  }
  const hi=hostile?"rgba(255,120,90,.9)":col(1.25,.95);
  if(b.alien==="jelly"){
    /* купол пульсирует: сжался — потянулся вверх, это и есть его движение */
    const puls=.82+.18*Math.sin(t*1.6);
    const bw=R*1.25*puls, bh=R*.95/puls;
    ctx.fillStyle=col(.9,.62);
    ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,Math.PI,TAU);ctx.fill();
    ctx.fillStyle=col(1.5,.28);
    ctx.beginPath();ctx.ellipse(-bw*.25,-bh*.35,bw*.4,bh*.32,0,0,TAU);ctx.fill();
    ctx.strokeStyle=col(.6,.5);ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,Math.PI,TAU);ctx.stroke();
    /* щупальца тянутся вниз с задержкой по фазе */
    ctx.strokeStyle=col(1.1,.45);
    for(let i=0;i<b.tent;i++){
      const u=(i/(b.tent-1)-.5)*1.7;
      const sx=u*bw*.85;
      ctx.lineWidth=1+(1-Math.abs(u))*1.2;
      ctx.beginPath();ctx.moveTo(sx,0);
      const L=R*(1.6+Math.abs(u)*.9);
      ctx.quadraticCurveTo(sx+Math.sin(t*1.3+i)*R*.4,L*.55,
        sx+Math.sin(t*1.1+i*1.7)*R*.7,L);
      ctx.stroke();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,-bh*.2,0,0,-bh*.2,R*2.2);
    g.addColorStop(0,col(1.6,.20));g.addColorStop(1,col(1.6,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-bh*.2,R*2.2,0,TAU);ctx.fill();
    ctx.restore();
  }else if(b.alien==="strider"){
    /* шесть высоких дуг: тело висит вверху, ноги переступают попарно */
    const legH=R*2.2;
    ctx.strokeStyle=col(.65,.9);
    for(let i=0;i<6;i++){
      const side=i<3?-1:1, k=i%3;
      const px=(k-1)*R*.55;
      const step=Math.sin(t*1.4+i*2.1)*R*.5;
      ctx.lineWidth=1.6;
      ctx.beginPath();
      ctx.moveTo(px,0);
      ctx.quadraticCurveTo(px+side*R*1.1,legH*.45,px+step+side*R*.5,legH);
      ctx.stroke();
    }
    ctx.fillStyle=col(.95,.95);
    ctx.beginPath();ctx.ellipse(0,0,R*.95,R*.5,0,0,TAU);ctx.fill();
    ctx.strokeStyle=col(.55,.8);ctx.lineWidth=1;ctx.stroke();
    /* маленькая голова на длинной шее — по ней силуэт и опознаётся */
    ctx.strokeStyle=col(.7,.9);ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(R*.7,-R*.2);
    ctx.quadraticCurveTo(R*1.5,-R*.9,R*1.7,-R*1.5);ctx.stroke();
    ctx.fillStyle=col(1.05,.95);
    ctx.beginPath();ctx.ellipse(R*1.75,-R*1.65,R*.34,R*.26,0,0,TAU);ctx.fill();
    ctx.fillStyle=hi;
    ctx.beginPath();ctx.arc(R*1.9,-R*1.7,1.6,0,TAU);ctx.fill();
  }else if(b.alien==="crystal"){
    /* гранёное тело: жёсткие плоскости и светящийся шов между ними */
    const P=[];
    for(let i=0;i<b.facets;i++){
      const a=i/b.facets*TAU;
      P.push([Math.cos(a)*R*(.9+((i*37)%5)/5*.5),Math.sin(a)*R*.62]);
    }
    ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);
    ctx.closePath();
    const g=ctx.createLinearGradient(-R,-R*.6,R,R*.6);
    g.addColorStop(0,col(1.5,.85));g.addColorStop(.5,col(.8,.9));g.addColorStop(1,col(1.2,.8));
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=.8;ctx.stroke();
    ctx.strokeStyle=col(1.8,.5+.3*Math.sin(t*2));
    ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);ctx.lineTo(P[(b.facets>>1)][0],P[(b.facets>>1)][1]);
    ctx.stroke();
    /* тонкие ноги-иглы */
    ctx.strokeStyle=col(.6,.85);ctx.lineWidth=1;
    for(let i=0;i<6;i++){
      const px=(i%3-1)*R*.5, side=i<3?-1:1;
      const step=Math.sin(t*1.8+i)*R*.3;
      ctx.beginPath();ctx.moveTo(px,R*.3);
      ctx.lineTo(px+step+side*R*.6,R*1.25);ctx.stroke();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";
    const gg=ctx.createRadialGradient(0,0,0,0,0,R*1.8);
    gg.addColorStop(0,col(1.9,.16));gg.addColorStop(1,col(1.9,0));
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*1.8,0,TAU);ctx.fill();
    ctx.restore();
  }else if(b.alien==="manta"){
    /* крыло идёт волной: три сегмента с разной фазой вместо жёсткой дуги */
    const S=R*b.span;
    for(const side of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(0,0);
      const w1=Math.sin(t*1.5+(side>0?0:.9))*R*.5;
      const w2=Math.sin(t*1.5+1+(side>0?0:.9))*R*.7;
      ctx.quadraticCurveTo(side*S*.5,w1-R*.5,side*S,w2);
      ctx.quadraticCurveTo(side*S*.5,w1+R*.35,0,R*.45);
      ctx.closePath();
      const g=ctx.createLinearGradient(0,0,side*S,0);
      g.addColorStop(0,col(1.05,.92));g.addColorStop(1,col(.55,.55));
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=col(.45,.6);ctx.lineWidth=1;ctx.stroke();
    }
    ctx.fillStyle=col(1.1,.95);
    ctx.beginPath();ctx.ellipse(0,R*.1,R*.42,R*.6,0,0,TAU);ctx.fill();
    ctx.fillStyle=hi;
    ctx.beginPath();ctx.arc(R*.18,-R*.05,1.5,0,TAU);ctx.fill();
    /* хвост-жало */
    ctx.strokeStyle=col(.7,.7);ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(0,R*.6);
    ctx.quadraticCurveTo(-R*.3,R*1.4,-R*.1+Math.sin(t)*R*.3,R*2.1);ctx.stroke();
  }else{
    /* панцирный: купол-камень на коротких ногах, пока стоит — не отличить
       от валуна, и в этом весь смысл */
    ctx.fillStyle=col(.5,.95);
    for(let i=0;i<4;i++){
      const px=(i-1.5)*R*.5;
      const step=Math.sin(t*1.6+i*1.6)*R*.22;
      ctx.fillRect(px-1.2,R*.2,2.4,R*.6+step);
    }
    const g=ctx.createLinearGradient(0,-R*.9,0,R*.3);
    g.addColorStop(0,col(1.35,.95));g.addColorStop(1,col(.55,.95));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(0,R*.15,R*1.15,R*.85,0,Math.PI,TAU);ctx.fill();
    ctx.strokeStyle=col(.35,.8);ctx.lineWidth=1.2;ctx.stroke();
    /* рёбра панциря */
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1;
    for(let i=1;i<4;i++){
      const u=i/4*2-1;
      ctx.beginPath();
      ctx.ellipse(0,R*.15,R*1.15*Math.abs(u),R*.85*Math.abs(u),0,Math.PI,TAU);
      ctx.stroke();
    }
    /* голова выглядывает только на ходу */
    if(Math.abs(b.vx)>.02){
      ctx.fillStyle=col(.9,.95);
      ctx.beginPath();ctx.ellipse(R*1.15,R*.05,R*.3,R*.22,0,0,TAU);ctx.fill();
      ctx.fillStyle=hi;
      ctx.beginPath();ctx.arc(R*1.3,0,1.4,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
}
/* тело собирается из тех же частей, но пропорции, силуэт и набор — от seed */
function drawBeast(b,x,y,hostile,stun){
  if(b.alien){drawBeastAlien(b,x,y,hostile,stun);return;}
  const c=b.body;
  const col=(k,a)=>"rgba("+Math.round(c[0]*k)+","+Math.round(c[1]*k)+","+Math.round(c[2]*k)+","+a+")";
  const t=G.t*b.spd+b.phase;
  const bob=b.hop?Math.abs(Math.sin(t))*b.r*.35:Math.sin(t)*b.r*.08;
  ctx.save();ctx.translate(x,y-b.r*.9-bob);ctx.scale(b.face,1);
  if(stun>0){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,0,0,0,0,b.r*2.6);
    g.addColorStop(0,"rgba(140,220,255,.3)");g.addColorStop(1,"rgba(120,200,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,b.r*2.6,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* ноги */
  ctx.strokeStyle=col(.55,1);ctx.lineWidth=Math.max(1,b.r*.16);ctx.lineCap="round";
  for(let i=0;i<b.legs;i++){
    const u=(i/(b.legs-1||1)-.5)*1.7;
    const sw=stun>0?0:Math.sin(t*2+i*1.9)*b.r*.3;
    ctx.beginPath();
    ctx.moveTo(u*b.r*.8*b.bx,b.r*.35*b.by);
    ctx.lineTo(u*b.r*.9*b.bx+sw,b.r*.95);
    ctx.stroke();
  }
  ctx.lineCap="butt";
  if(b.tail){
    ctx.strokeStyle=col(.7,1);ctx.lineWidth=Math.max(1,b.r*.22);
    ctx.beginPath();ctx.moveTo(-b.r*.8*b.bx,-b.r*.1);
    ctx.quadraticCurveTo(-b.r*1.7*b.bx,-b.r*.5-Math.sin(t*1.6)*b.r*.3,
                         -b.r*1.9*b.bx,b.r*.2);ctx.stroke();
  }
  /* туловище: гранёный многоугольник (не гладкий эллипс), каждая грань
     чуть светлее/темнее соседней — читается как настоящая полигональная форма */
  const P=b.poly;
  ctx.beginPath();
  ctx.moveTo(P[0][0]*b.r*b.bx,P[0][1]*b.r*b.by);
  for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0]*b.r*b.bx,P[i][1]*b.r*b.by);
  ctx.closePath();
  const g=ctx.createLinearGradient(0,-b.r*b.by,0,b.r*b.by);
  g.addColorStop(0,col(1.15,1));g.addColorStop(1,col(.5,1));
  ctx.fillStyle=g;ctx.fill();
  for(let i=0;i<P.length;i++){
    const a=P[i],bN=P[(i+1)%P.length];
    ctx.beginPath();
    ctx.moveTo(a[0]*b.r*b.bx,a[1]*b.r*b.by);ctx.lineTo(bN[0]*b.r*b.bx,bN[1]*b.r*b.by);
    ctx.lineTo(0,0);ctx.closePath();
    ctx.fillStyle=col(((i&1)?1.22:.92),.16);ctx.fill();
  }
  ctx.strokeStyle=col(.35,.9);ctx.lineWidth=1;ctx.stroke();
  /* шерсть: короткие штрихи по контуру, торчащие наружу */
  ctx.strokeStyle=col(.6,.7);ctx.lineWidth=Math.max(.6,b.r*.05);
  for(let i=0;i<b.furTufts;i++){
    const a=(i/b.furTufts)*TAU;
    const px=Math.cos(a)*b.r*b.bx*.95,py=Math.sin(a)*b.r*b.by*.95;
    const nx=Math.cos(a),ny=Math.sin(a)*.8;
    ctx.beginPath();ctx.moveTo(px,py);
    ctx.lineTo(px+nx*b.r*.22,py+ny*b.r*.22);ctx.stroke();
  }
  for(let i=0;i<b.spots;i++){
    ctx.fillStyle=col(1.4,.5);
    ctx.beginPath();ctx.arc(-b.r*.4*b.bx+i*b.r*.42,-b.r*.2+((i*7)%3)*b.r*.22,b.r*.14,0,TAU);ctx.fill();
  }
  if(b.crest){
    ctx.fillStyle=col(1.3,.85);
    ctx.beginPath();ctx.moveTo(-b.r*.3,-b.r*.75*b.by);
    ctx.lineTo(0,-b.r*1.5*b.by);ctx.lineTo(b.r*.35,-b.r*.7*b.by);ctx.closePath();ctx.fill();
  }
  /* голова */
  const hx=b.r*b.headX,hs=b.r*b.headSize;
  ctx.fillStyle=col(1.05,1);
  ctx.beginPath();ctx.arc(hx,-b.r*.3*b.by,hs,0,TAU);ctx.fill();
  ctx.strokeStyle=col(.35,.9);ctx.stroke();
  if(b.ears){
    ctx.fillStyle=col(.8,1);
    for(const s of [-1,1]){
      ctx.beginPath();ctx.ellipse(hx+s*hs*.3,-b.r*.3*b.by-hs*.85,b.r*.16,b.r*.34,s*.4,0,TAU);ctx.fill();
    }
  }
  if(hostile){
    /* жвалы — единственное, что отличает шахтную форму */
    ctx.strokeStyle=col(.4,1);ctx.lineWidth=Math.max(1.2,b.r*.18);
    for(const s of [-1,1]){
      ctx.beginPath();ctx.moveTo(hx+hs*.5,-b.r*.3*b.by+s*b.r*.2);
      ctx.lineTo(hx+hs*1.05,-b.r*.3*b.by+s*b.r*.55);ctx.stroke();
    }
  }
  /* глаз */
  const blink=Math.sin(G.t*.05+b.phase*3)>.96;
  ctx.fillStyle=stun>0?"#6fa8c8":(hostile?"#ff6b57":b.eye);
  if(blink&&stun<=0){
    ctx.fillRect(hx+hs*.05,-b.r*.3*b.by-hs*.2,hs*.4,hs*.15);
  }else{
    ctx.beginPath();ctx.arc(hx+hs*.2,-b.r*.3*b.by-hs*.1,hs*.22,0,TAU);ctx.fill();
    if(!hostile){ctx.fillStyle="rgba(255,255,255,.9)";
      ctx.beginPath();ctx.arc(hx+hs*.28,-b.r*.3*b.by-hs*.22,hs*.08,0,TAU);ctx.fill();}
  }
  if(b.glow){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const gg=ctx.createRadialGradient(0,0,0,0,0,b.r*2.2);
    gg.addColorStop(0,col(1.4,.18));gg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,b.r*2.2,0,TAU);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  if(stun>0){
    ctx.fillStyle="rgba(160,225,255,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ОГЛУШЁН",x,y-b.r*2.6);
  }
}
