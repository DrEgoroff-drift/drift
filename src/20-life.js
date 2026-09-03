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
  /* комплект (M167): ходок собран из цветов надетых вещей — та же кукла, что на экране */
  const KP=(typeof kitPalette==="function")?kitPalette():null;
  const suit=KP?KP.torso.main:"#dfe7ec", suitD=KP?KP.torso.dark:"#9fb0bb", dark=KP?KP.boots.dark:"#121a24";
  ctx.save();
  ctx.scale(o.face||1,1);
  if(o.jet){   // ранцевый импульс при прыжке
    const f=5+Math.random()*7;
    const g=ctx.createLinearGradient(0,4,0,4+f);
    g.addColorStop(0,"rgba(255,220,150,.9)");g.addColorStop(1,"rgba(255,110,60,0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-3.4,4);ctx.lineTo(0,4+f);ctx.lineTo(3.4,4);ctx.closePath();ctx.fill();
  }
  /* ── ноги с коленом (аудит M232: «две палки без колен, ступней нет») ──
     В переносе нога сгибается — колено уходит вперёд-вверх, в опоре почти
     прямая. Ботинок — тело с мыском по ходу, а не третья чёрточка. */
  ctx.strokeStyle=suitD;ctx.lineWidth=2.6;ctx.lineCap="round";
  const knee=air?3:0;
  for(const [sw,sx] of [[walk,-1],[walk2,1]]){
    const flex=(1-Math.abs(sw))*amp*1.8+(air?2.2:0);
    const kx=sx*1.2+sw*2.6+flex*.9, ky=6-flex*.5+(air?1:0);
    const fx=sx*1.6+sw*4.6, fy=air?9.5-knee:11.5;
    ctx.beginPath();ctx.moveTo(sx*1.4,2.5);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();
    ctx.fillStyle=dark;                                     // ботинок телом
    ctx.beginPath();
    ctx.moveTo(fx-1.9,fy-1.5);ctx.lineTo(fx+1.1,fy-1.5);
    ctx.lineTo(fx+2.5,fy-.4);ctx.lineTo(fx+2.5,fy+.4);ctx.lineTo(fx-1.9,fy+.4);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.14)";                  // кромка ловит свет (закон 3)
    ctx.fillRect(fx-1.9,fy-1.5,3,.5);
  }
  /* наклон корпуса на бегу: верх тела подаётся по ходу движения */
  ctx.save();
  ctx.translate(0,2.2);ctx.rotate(-amp*.09);ctx.translate(0,-2.2);
  /* ── ранец: не серая плита, а два баллона с вентилем ── */
  const packD=KP?KP.pack.dark:"#2b3846";
  ctx.fillStyle=packD;
  ctx.beginPath();ctx.roundRect(-5.6,-4.4,2.3,7.4,1.1);ctx.fill();   // внешний баллон
  ctx.beginPath();ctx.roundRect(-3.6,-4.0,2.1,6.6,1.0);ctx.fill();   // внутренний
  ctx.fillStyle="rgba(255,255,255,.14)";
  ctx.fillRect(-5.1,-3.8,.7,6.0);                                    // блик по баллону
  ctx.strokeStyle=rgba(acc,.75);ctx.lineWidth=.9;
  ctx.beginPath();ctx.moveTo(-5.6,-1.2);ctx.lineTo(-1.5,-1.2);ctx.stroke();  // стяжка
  ctx.fillStyle="#8fa2b2";ctx.fillRect(-5.3,-5.3,1.2,1.0);           // вентиль
  ctx.strokeStyle="#8fa2b2";ctx.lineWidth=.6;
  ctx.beginPath();ctx.moveTo(-4.7,-5.3);ctx.lineTo(-4.7,-6.0);ctx.stroke();
  ctx.strokeStyle=rgba(acc,.5);ctx.lineWidth=.9;
  ctx.beginPath();ctx.moveTo(-6.0,-4.6);ctx.lineTo(-6.0,-6.0);ctx.stroke();  // антенна
  /* огонёк антенны дышит, а не мигает (закон 6) */
  ctx.fillStyle="rgba(127,230,216,"+(.35+.35*Math.sin(G.t*.03)).toFixed(2)+")";
  ctx.beginPath();ctx.arc(-6.0,-6.5,1,0,TAU);ctx.fill();
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
  ctx.fillStyle=KP?KP.helmet.main:suit;
  ctx.beginPath();ctx.arc(.2,-6.6,4.1,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(20,30,40,.5)";ctx.lineWidth=.9;ctx.stroke();
  ctx.fillStyle="#0a1a26";
  ctx.beginPath();ctx.ellipse(.9,-6.7,3,2.5,-.12,0,TAU);ctx.fill();            // забрало
  const vg=ctx.createLinearGradient(-1.6,-8.6,2.8,-5);
  vg.addColorStop(0,"rgba(160,235,255,.75)");vg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=vg;
  ctx.beginPath();ctx.ellipse(.9,-6.7,3,2.5,-.12,0,TAU);ctx.fill();
  /* блик-козырёк: одна жёсткая дуга по верхней кромке забрала (M232) —
     без неё стекло читалось точкой, а не сферой */
  ctx.strokeStyle="rgba(224,246,255,.85)";ctx.lineWidth=.7;
  ctx.beginPath();ctx.arc(.9,-6.9,2.5,-2.5,-.7);ctx.stroke();
  ctx.fillStyle=KP?KP.lamp.acc:rgba(acc,.9);
  ctx.beginPath();ctx.arc(-2.9,-7.6,1.1,0,TAU);ctx.fill();                      // фонарь
  /* ── ободок со стороны звезды (M172) ──
     Ходок в 26 px тонул в грунте: он и земля были одного значения, и на экране,
     где игрок проводит больше всего времени после кокпита, человека приходилось
     ИСКАТЬ. Одна светлая линия по освещённому краю шлема и плеча ставит его
     перед миром — дешевле любого увеличения размера. o.sun: −1 звезда слева,
     1 справа, 0 — нет её (под землёй, ночью). */
  if(o.sun){
    const sd=o.sun*(o.face||1)>0?1:-1;      /* в системе координат фигуры */
    const sk=Math.min(1,Math.abs(o.sun));
    ctx.save();
    /* тёплый БОК, а не только линия (M232): освещённая половина торса и шлема
       заметно теплее — солнце строит объём фигуры, rim лишь дорисовывает край */
    ctx.fillStyle="rgba(255,238,206,"+(.13*sk).toFixed(3)+")";
    ctx.beginPath();
    ctx.moveTo(sd*1.0,-4);ctx.lineTo(sd*3.2,-4);ctx.lineTo(sd*3.6,2.2);ctx.lineTo(sd*1.4,2.2);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(255,238,206,"+(.22*sk).toFixed(3)+")";ctx.lineWidth=1.7;
    ctx.beginPath();ctx.arc(.2,-6.6,3.4,sd>0?-1.2:1.9,sd>0?.6:3.7);ctx.stroke();
    ctx.strokeStyle="rgba(255,247,226,"+(.5*sk).toFixed(2)+")";
    ctx.lineWidth=1;ctx.lineCap="round";
    ctx.beginPath();ctx.arc(.2,-6.6,4.1,sd>0?-1.5:1.6,sd>0?.6:3.7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(sd*3.3,-3.6);ctx.lineTo(sd*3.7,1.8);ctx.stroke();
    ctx.restore();
  }
  ctx.restore();      /* наклон корпуса */
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
    /* фонарь освещает И САМОГО ходока (M232): грудь и ближняя рука ловят
       отражённый свет — ночью человек не должен быть чёрным под своим лучом */
    const gs=ctx.createRadialGradient(f*2.4,-6.6,.5,f*2.4,-6.6,7.5);
    gs.addColorStop(0,"rgba(255,238,190,.30)");gs.addColorStop(1,"rgba(255,238,190,0)");
    ctx.fillStyle=gs;ctx.beginPath();ctx.arc(f*1.6,-3.6,7,0,TAU);ctx.fill();
    ctx.restore();
  }
}

/* ══════════════ флора ══════════════ */
/* каждое растение — своё: ствол из сегментов, ветви и одна из четырёх крон.
   Цвета берутся от палитры планеты, поэтому на токсичном мире флора ядовитая,
   а на ледяном — блёклая. */
/* Словари формы и признака переехали в 20e-species и стали ВЫВОДИМЫМИ из того,
   что реально нарисовано: здесь их держать больше нечему — прежние шесть слов
   на двенадцать форм и были причиной того, что имя вида врало. */
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
  /* силуэт флоры по миру, а не только по случаю (хвост G1): пустыня и лёд —
     низкие и колючие формы, джунгли — высокие кроны, токсичный — шары и
     ленты. Случайная доминанта остаётся: два мира одного типа не близнецы */
  const TF={desert:[4,6,11],ice:[4,10,6],crystal:[10,4],metal:[6,4],volcanic:[6,11],
            jungle:[7,8,9],terran:[7,9,1],ocean:[8,11],toxic:[11,10,9],ruin:[4,1],rocky:[6,4]};
  for(const k of TF[p.type]||[])bias[k]+=1.1;
  p.biome={kindBias:bias,scale:(harsh?.5:.7)+r()*(harsh?.5:.9),
    giantChance:harsh?r()*.03:r()*.14,hueBias:r()};
  return p.biome;
}
function pickKindByBias(bias,r){
  const sum=bias.reduce((a,b)=>a+b,0);let u=r()*sum;
  for(let i=0;i<bias.length;i++){u-=bias[i];if(u<=0)return i;}
  return bias.length-1;
}
/* Экземпляр собирается из ВИДА планеты (20e-species): форма, пропорции, цвет и
   ветвление закреплены за видом, экземпляру принадлежат только возраст, место
   и мелкая кривизна. env={wet,hollow} — сырость полосы и насколько эта точка
   ниже соседних: один вид растёт по-разному в ложбине и на гребне. */
function genPlant(r,p,x,gy,env){
  return specimenPlant(r,pickShare(floraOf(p),r),p,x,gy,env);
}
/* Формы, которые опознаются по одному силуэту: гриб, спираль, зонтик, шар на
   привязи, ленты. Ни одна из них не «палка с листьями» — именно это и было
   главной претензией к прежней флоре.

   Свечение снизу шляпки и внутри мембраны — не украшение: оно отделяет
   растение от грунта в темноте, когда силуэт уже не читается. */
function drawPlantAlien(pl,x,y,stemC,leafC,sc,ph){
  const bend=Math.sin(G.t*pl.sway+pl.phase);
  const gl=sc?"127,230,216":((pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0));
  ctx.save();ctx.translate(x,y);
  /* затмение (06a-celest): то, что живёт светом, на свету и складывается —
     флора приседает и жмётся, пока звезда закрыта. Это единственная реакция
     жизни на календарь и единственное, по чему затмение видно не глядя вверх */
  const DK=typeof celDark==="function"?celDark():0;
  if(DK>.05)ctx.scale(1-.10*DK,1-.32*DK);
  const lean=(pl.lean+(ph||0)+bend*.22)*pl.h*.2;
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
    /* свечение по витку: без него вид, названный светящимся, не светился —
       имя врало ровно так же, как до M174, только тише */
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(lean*.5,-pl.h*.62,0,lean*.5,-pl.h*.62,pl.h*.5);
      g.addColorStop(0,"rgba("+gl+",.20)");g.addColorStop(1,"rgba("+gl+",0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(lean*.5,-pl.h*.62,pl.h*.5,0,TAU);ctx.fill();
      ctx.restore();
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
      /* внутри чужого градиента нужен ЦВЕТ, а не заливка: leafC с 0.140.0 —
         градиент тела растения, и addColorStop его не принимает */
      g.addColorStop(.5,sc?"rgba(127,230,216,.55)":"rgb("+(pl.leaf[0]|0)+","+(pl.leaf[1]|0)+","+(pl.leaf[2]|0)+")");
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
    /* и у лент своё свечение — вдоль основания, там, где они гуще */
    if(pl.glow){
      ctx.save();ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(lean*.4,-pl.h*.35,0,lean*.4,-pl.h*.35,pl.h*.7);
      g.addColorStop(0,"rgba("+gl+",.18)");g.addColorStop(1,"rgba("+gl+",0)");
      ctx.fillStyle=g;
      ctx.beginPath();ctx.ellipse(lean*.4,-pl.h*.35,pl.h*.7,pl.h*.5,0,0,TAU);ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
/* ── у растения есть тело, а не заливка (автор: «растения всратые», 24.08.2026) ──
   Каждая форма красилась ОДНИМ плоским цветом на весь куст: ни светотени по
   листу, ни разницы между стеблем и кроной, ни различия между соседями. На
   кадре это читается аппликацией из цветной бумаги, и никакая расстановка
   этого не лечит.
   Правится в одной точке: stemC и leafC перестают быть строкой и становятся
   градиентом в координатах самого растения (начало — у корня, минус — вверх).
   Все ctx.fillStyle=leafC во всех двенадцати формах получают светотень даром.
   Свет берётся оттуда же, где стоит звезда (sunSpot, M172), а лёгкий разброс
   тона по кусту — из хэша координаты, а НЕ из общего потока r(): лишний вызов
   сдвигает генерацию всей полосы (на этом уже обожглись в 0.139.0). */
function plantGrad(col,h,ux,k0,k1){
  const g=ctx.createLinearGradient(-ux*h*.55,-h*1.05,ux*h*.55,h*.05);
  g.addColorStop(0,"rgb("+col.map(v=>clamp(v*k1+16,0,255)|0).join(",")+")");
  g.addColorStop(.55,"rgb("+col.map(v=>clamp(v,0,255)|0).join(",")+")");
  g.addColorStop(1,"rgb("+col.map(v=>clamp(v*k0,0,255)|0).join(",")+")");
  return g;
}
/* ── тело, а не кожа (M323, хвост M173 #2) ──
   0.140.0 дал каждой форме градиент, но градиент — это кожа: лист остался
   вырезкой из бумаги, стебель той же светлоты, что крона, и на светлом небе
   ни у одного листа нет тёмного края. Правило «много кусков — одно тело»:
   тело первым. Растение рисуется дважды — сперва целиком тёмной массой,
   сдвинутой от света и вниз на пару пикселей (теневая сторона каждого листа
   и стебля, одна на всю форму), потом освещённым. Все двенадцать форм
   получают объём в одной точке, как в 0.140.0 — светотень. Только ближний
   план: дальнее и так уходит в воздух, а второй проход там — цена без пользы.
   Свечение и опад — только у светлого прохода: у тени они не светятся. */
function drawPlant(pl,x,y,haze){
  const near=!pl.scanned&&!(haze>0)&&(pl.h||20)>=12;
  if(near){
    const SP=(typeof sunSpot==="function"&&G.surf&&G.surf.p)?sunSpot(G.surf.p):null;
    const ux=SP?clamp((SP.x-(W*.5))/(W*.5),-1,1)||.6:.6;
    const d=Math.min(2.4,1.2+(pl.h||20)*.02);
    plantPaint(Object.assign({},pl,{glow:0,litter:0}),x-ux*d,y+d*.6,haze,true);
  }
  plantPaint(pl,x,y,haze,false);
}
function plantPaint(pl,x,y,haze,dark){
  const sc=pl.scanned;
  /* сосед не близнец: тон гуляет на ±12% по хэшу места, куртина перестаёт
     быть одним пятном краски */
  const jt=(((hashi(Math.round(pl.x),Math.round(pl.h),0x9E11)>>>9)&255)/255-.5)*.24;
  /* ── дальнее выцветает В ВОЗДУХ, а не в прозрачность (M233) ──
     Глубина куртины была, но красилась одной globalAlpha: на зелёном мире
     полупрозрачный зелёный лист поверх зелёного неба — тот же зелёный, и вся
     чаща оставалась одним кислотным пятном без переднего и заднего плана.
     Цвет самого растения уводится к цвету воздуха тем сильнее, чем оно
     дальше, — тогда планы расходятся по светлоте, а не по прозрачности. */
  const AIR=(haze>0&&typeof ambRGB==="function"&&G.surf&&G.surf.p)?ambRGB(G.surf.p):null;
  const hz=AIR?clamp(haze,0,.8):0;
  const tone=c=>{
    const v=[c[0]*(1+jt),c[1]*(1+jt*.8),c[2]*(1+jt*1.2)];
    return hz?[lerp(v[0],AIR[0],hz),lerp(v[1],AIR[1],hz),lerp(v[2],AIR[2],hz)]:v;
  };
  const SP=(typeof sunSpot==="function"&&G.surf&&G.surf.p)?sunSpot(G.surf.p):null;
  const ux=SP?clamp((SP.x-(W*.5))/(W*.5),-1,1)||.6:.6;
  const H0=Math.max(8,pl.h||20);
  /* тёмный проход — один плотный тон на стебель и лист: это масса, не краска.
     Стебель темнее кроны (k1 1.0 против 1.22): крона читается над ним */
  const shade=c=>"rgb("+tone(c).map(v=>clamp(v*.42,0,255)|0).join(",")+")";
  const stemC=dark?shade(pl.stem):(sc?"rgba(127,230,216,.85)":plantGrad(tone(pl.stem),H0,ux,.50,1.00));
  const leafC=dark?shade(pl.leaf):(sc?"rgba(127,230,216,.55)":plantGrad(tone(pl.leaf),H0,ux,.52,1.22));
  /* фототропизм (M174): растение тянется туда, где реально стоит звезда, и
     сила этой тяги — свойство вида. Прежний lean был чистым броском: половина
     кустов кланялась от света. Наклон общий для всей куртины — это и читается
     как «здесь так падает свет», а не как случайная кривизна */
  const ph=(pl.photo||0)*ux;
  /* опад у комля: под старым и под пышным. Кристаллу и ковру опадать нечем */
  if(pl.litter&&pl.kind!==4&&pl.kind!==6&&pl.kind!==10){
    ctx.save();ctx.translate(x,y);plantLitter(pl,sc);ctx.restore();
  }
  /* друза — без ствола: гроздь гранёных кристаллов, растёт прямо из грунта */
  if(pl.kind===4){
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<pl.facets;i++){
      const a=(i/pl.facets-.5)*1.6, len=pl.h*(.55+((i*37)%10)/10*.45);
      const w=pl.w*(.6+((i*53)%7)/7*.6);
      ctx.fillStyle=leafC;ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(Math.sin(a)*w,-len*.5);ctx.lineTo(Math.sin(a)*w*.3,-len);
      ctx.lineTo(-Math.sin(a)*w*.2,-len*.5);ctx.closePath();ctx.fill();
      ctx.strokeStyle=dark?"rgba(0,0,0,0)":(sc?"rgba(127,230,216,.5)":"rgba(255,255,255,.25)");ctx.lineWidth=.6;ctx.stroke();
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
  if(pl.kind>=7&&pl.kind<=11){drawPlantAlien(pl,x,y,stemC,leafC,sc,ph);return;}
  const bend=Math.sin(G.t*pl.sway+pl.phase);
  ctx.save();ctx.translate(x,y);
  /* ствол: ломаная из сегментов, верх качается сильнее низа */
  const pts=[[0,0]];
  for(let i=1;i<=pl.segs;i++){
    const t=i/pl.segs;
    pts.push([ (pl.lean+ph+bend*.28)*pl.h*t*t + Math.sin(t*3.1)*pl.curl*pl.h*.18, -pl.h*t ]);
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
  /* шипы: настоящий признак вида, из-за которого слово «колючий» в имени
     перестало быть враньём. Сидят парами вдоль ствола, длина от толщины */
  if(pl.spiny){
    /* все шипы — ОДИН путь и один stroke. Отдельный beginPath на каждый шип
       давал дюжину вызовов на куст и десятки на куртину: правило «дорогое
       считается один раз» относится и к вызовам растеризатора */
    ctx.lineWidth=Math.max(.7,pl.w*.3);
    ctx.beginPath();
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b2=pts[i], ln=Math.max(2.2,pl.w*1.4);
      for(let k=0;k<2;k++){
        const q=(k+.5)/2, px=lerp(a[0],b2[0],q), py=lerp(a[1],b2[1],q);
        const s=(i+k)%2?1:-1;
        ctx.moveTo(px,py);ctx.lineTo(px+s*ln,py-ln*.5);
      }
    }
    ctx.stroke();
  }
  /* сухостой: у старого экземпляра одна-две ветви мертвы, голы и другого тона.
     Это единственное, по чему возраст читается силуэтом, а не размером */
  if(pl.dead&&pl.dead.length){
    ctx.strokeStyle=sc?"rgba(127,230,216,.35)":"rgba(122,106,84,.92)";
    ctx.lineWidth=Math.max(1,pl.w*.55);
    ctx.beginPath();
    for(const d of pl.dead){
      const [dx,dy]=at(d.t);
      const ex=dx+Math.sin(d.ang)*d.len, ey=dy-d.len*.5;
      ctx.moveTo(dx,dy);
      ctx.quadraticCurveTo(dx+Math.sin(d.ang)*d.len*.55,dy-d.len*.42,ex,ey);
      ctx.moveTo(ex,ey);
      ctx.lineTo(ex+Math.sin(d.ang)*d.len*.28,ey-d.len*.12);
    }
    ctx.stroke();
    ctx.strokeStyle=stemC;
  }
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
  /* крона. Размеры здесь постоянные — это признак формы, а не роста, — но
     умножены на пышность (M174): угнетённый на сухом гребне обязан отличаться
     не только ростом, иначе «отвечает месту» ничего не значит на кадре */
  const LU=pl.lush||1;
  ctx.fillStyle=leafC;
  if(pl.kind===0){
    for(let i=0;i<3;i++){
      const o=(i-1)*4.5*LU;
      ctx.beginPath();
      ctx.ellipse(tip[0]+o*.8,tip[1]-3-Math.abs(o)*.5,(4.6-Math.abs(i-1)*1.2)*LU,6.4*LU,o*.06,0,TAU);
      ctx.fill();
    }
  }else if(pl.kind===1){
    ctx.beginPath();ctx.arc(tip[0],tip[1]-4,5.6*LU,0,TAU);ctx.fill();
    ctx.fillStyle=sc?"rgba(127,230,216,.35)":"rgba(255,255,255,.16)";
    ctx.beginPath();ctx.arc(tip[0]-1.6,tip[1]-5.6,2.4*LU,0,TAU);ctx.fill();
  }else if(pl.kind===2){
    for(let i=-1;i<=1;i++){
      ctx.beginPath();ctx.moveTo(tip[0],tip[1]);
      ctx.quadraticCurveTo(tip[0]+i*9*LU,tip[1]-9*LU,tip[0]+i*13*LU,tip[1]-1);
      ctx.quadraticCurveTo(tip[0]+i*7*LU,tip[1]-4*LU,tip[0],tip[1]);ctx.fill();
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
