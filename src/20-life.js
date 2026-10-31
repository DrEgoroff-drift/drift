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
  /* струя ранца — живым в 20fa (lifeAstroGpu); в выпечке тела её нет (G15) */
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
  /* огонёк антенны — живым в 20fa; в выпечке тела его нет (G15) */
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
  const VC=(typeof cosmVisor==="function")?cosmVisor():null;   /* тон забрала — косметика «Сороки» */
  const vg=ctx.createLinearGradient(-1.6,-8.6,2.8,-5);
  vg.addColorStop(0,"rgba("+(VC?VC.join(","):"160,235,255")+",.75)");vg.addColorStop(1,"rgba("+(VC?VC.join(","):"120,200,230")+",0)");
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
  /* луч/блик фонаря — живым в lifeLampGpu (20fa); печка тела без o.lamp (G15) */
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
/* 2D-кисть флоры (drawPlant / plantPaint / drawPlantAlien) снята (G15, M807):
   живых звонков не было после снятия lifePlantGpu; кадр — PLN (21pga / 21pia).
   genPlant / floraOf остаются — посадка и виды. */
