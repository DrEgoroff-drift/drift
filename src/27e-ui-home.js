/* ══════════════ дом: помещение, а не список ══════════════
   Дом — единственное место, про которое игра говорит «здесь вы дома», и список
   построек тут не годится: он и есть то место, где видно нажитое. Комната
   рисуется тем же языком, что кантина, база и абордаж.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Мерило — человек. Хозяин стоит ростом 54 px, и всё остальное меряется им:
      верстак по бедро, стеллаж в полтора роста, корабль в гараже вчетверо шире.
   2. Комната РАСТЁТ: каждая ступень добавляет свой кусок слева направо, а не
      подсвечивает готовую картинку. Пустое место справа — это то, чего ещё нет,
      и его видно.
   3. Ни одной цены: дом не покупается. Внизу полоса «до следующей ступени».
   4. Свет один — лампа над столом; всё остальное её слушается. */
const HOME_ROOM_H=200;
/* ширина комнаты в своих единицах: ровно столько, сколько занимают уже
   построенные ступени плюс поля. Комната с самого начала не должна быть
   лентой, в которой добро жмётся к левому краю */
/* прихожая шире двери с крючками: в 40 единицах одежда налезала на дверь и
   читалась бутылкой, а не одеждой — это видно только глазами, не проверкой */
const HOME_STEP_W=[52,50,88,56,60,58,56,70];
function homeRoomW(){
  const t=(G.home&&G.home.tier)||0;
  let w=28;
  for(let i=0;i<t;i++)w+=HOME_STEP_W[i];
  return w+46;                                      // поле под хозяина справа
}
/* ── зоны нажатия ──
   Кнопки в «ВЛАДЕНИИ» остаются, но перестают быть единственным входом: вещь,
   на которую смотришь, должна отзываться на палец. Зоны собираются в тех же
   единицах комнаты, что и рисунок, — второго описания геометрии нет, иначе они
   разъедутся при первой же правке. Правило интерфейса про 44 px соблюдается на
   уровне экрана: зона — это целая ступень, а не мелкая деталь в ней. */
let HOME_HIT=[];
let HOME_VIEW={k:1,pad:0};
function homeHitAt(px,py){
  const k=HOME_VIEW.k||1;
  const rx=(px-HOME_VIEW.pad)/k, ry=py/k;
  for(const z of HOME_HIT)
    if(rx>=z.x&&rx<=z.x+z.w&&ry>=z.y&&ry<=z.y+z.h)return z;
  return null;
}
function drawHomeRoom(cn){
  const H=G.home;if(!H||!H.tier)return;
  HOME_HIT=[];
  const c=cn.getContext("2d");
  c.clearRect(0,0,cn.width,cn.height);
  /* масштаб берём по ШИРИНЕ содержимого, а не по высоте канвы: иначе
     двухкомнатный дом растягивается на весь экран и теряет масштаб */
  /* Масштаб ОГРАНИЧЕН сверху: без потолка дом из двух ступеней растягивался на
     всю ширину панели, матрас становился размером с кровать-переросток, а
     кружка — с ведро. Картинка ровно в ширину дома, полтора-два пикселя на
     единицу, и она растёт вместе с ним — то самое правило из M83, которое
     потерялось при переносе. Остаток ширины — поля по бокам. */
  const W2=homeRoomW();
  const k=Math.min(cn.width/W2,2.2), H2=cn.height/k;
  const pad=(cn.width-W2*k)/2;
  /* тот же перевод, что у рисунка, — им же и попадают пальцем */
  HOME_VIEW={k,pad:Math.max(0,pad)};
  c.save();c.translate(Math.max(0,pad),0);c.scale(k,k);
  homeRoomBody(c,W2,H2);
  c.restore();
}
function homeRoomBody(c,W2,H2){
  const H=G.home;
  const fy=H2-22;                                   // пол
  const acc=hex2rgb("#f2b25c");
  /* ── стена: три масштаба ──
     Первый заход давал плоскую тёмную плиту с еле заметными полосами: комната
     читалась задником, а не помещением. Здесь то же, что в рубке и кантине —
     секции обшивки со швами, потолочный кант, плинтус и микрозерно. */
  const wall=[42,37,40];
  const R=rng(0x40E7);
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba(mixc(wall,[8,9,14],.62),1));
  wg.addColorStop(.55,rgba(wall,1));
  wg.addColorStop(1,rgba(mixc(wall,[16,13,15],.35),1));
  c.fillStyle=wg;c.fillRect(0,0,W2,fy);
  for(let i=0;i<Math.ceil(W2/58);i++){               // секции с швом и заклёпкой
    c.fillStyle="rgba(255,255,255,"+(.012+R()*.016).toFixed(3)+")";
    c.fillRect(i*58,10,54,fy-10);
    c.fillStyle="rgba(0,0,0,.22)";c.fillRect(i*58+54,10,2,fy-10);
    c.fillStyle="rgba(220,206,190,.05)";
    c.fillRect(i*58+7,16,2,2);c.fillRect(i*58+7,fy-16,2,2);
  }
  for(let i=0;i<90;i++){                             // микрозерно: стена не заливка
    c.fillStyle="rgba(0,0,0,"+(.03+R()*.05).toFixed(3)+")";
    c.fillRect(R()*W2,10+R()*(fy-20),1.2,1.2);
  }
  c.fillStyle="rgba(0,0,0,.42)";c.fillRect(0,0,W2,9);          // потолочный кант
  c.fillStyle="rgba(255,255,255,.05)";c.fillRect(0,9,W2,1.4);
  /* ── пол: доски с перспективой, плинтус, ковёр в жилой части ── */
  const flg=c.createLinearGradient(0,fy-2,0,H2);
  flg.addColorStop(0,rgba(mixc(wall,[26,20,16],.55),1));
  flg.addColorStop(1,rgba(mixc(wall,[8,7,9],.7),1));
  c.fillStyle=flg;c.fillRect(0,fy,W2,H2-fy);
  c.fillStyle=rgba(mixc(wall,[60,52,44],.8),1);                // плинтус
  c.fillRect(0,fy-3,W2,3);
  c.fillStyle="rgba(255,255,255,.07)";c.fillRect(0,fy-3,W2,1);
  c.strokeStyle="rgba(0,0,0,.22)";c.lineWidth=1;               // швы досок
  for(let i=0;i<Math.ceil(W2/26);i++){
    const x0=i*26;
    c.beginPath();c.moveTo(x0,fy);c.lineTo(x0-6,H2);c.stroke();
  }
  c.strokeStyle="rgba(255,255,255,.05)";
  c.beginPath();c.moveTo(0,fy+.5);c.lineTo(W2,fy+.5);c.stroke();
  /* ковёр под жилым углом: тепло начинается с того, на чём стоят ногами */
  const rugW=Math.min(76,W2*.3);
  c.fillStyle="rgba(120,72,58,.55)";
  c.beginPath();
  c.moveTo(10,fy+2);c.lineTo(10+rugW,fy+2);c.lineTo(14+rugW,H2-2);c.lineTo(4,H2-2);
  c.closePath();c.fill();
  c.strokeStyle="rgba(230,190,150,.18)";c.lineWidth=1;c.stroke();
  /* лампа над столом — единственный источник, конус света на пол */
  const lampX=Math.min(W2*.5,150);
  c.strokeStyle="rgba(255,255,255,.22)";c.lineWidth=1;
  c.beginPath();c.moveTo(lampX,0);c.lineTo(lampX,26);c.stroke();
  c.fillStyle=rgba(acc,.9);
  c.beginPath();c.moveTo(lampX-9,34);c.lineTo(lampX+9,34);c.lineTo(lampX+5,26);
  c.lineTo(lampX-5,26);c.closePath();c.fill();
  const cone=c.createLinearGradient(0,34,0,fy);
  cone.addColorStop(0,"rgba(255,205,140,.22)");cone.addColorStop(1,"rgba(255,205,140,0)");
  c.fillStyle=cone;
  c.beginPath();c.moveTo(lampX-8,34);c.lineTo(lampX+8,34);
  c.lineTo(lampX+58,fy);c.lineTo(lampX-58,fy);c.closePath();c.fill();
  /* Отсвет лампы на стене и пятно на полу: конус, обрывающийся в пустоте,
     читался лучом прожектора, а не жилой лампой. Свет должен куда-то ложиться. */
  const glow=c.createRadialGradient(lampX,40,4,lampX,40,110);
  glow.addColorStop(0,"rgba(255,205,140,.16)");glow.addColorStop(1,"rgba(255,205,140,0)");
  c.fillStyle=glow;c.fillRect(lampX-110,0,220,fy);
  const pool=c.createRadialGradient(lampX,fy+2,3,lampX,fy+2,80);
  pool.addColorStop(0,"rgba(255,205,140,.16)");pool.addColorStop(1,"rgba(255,205,140,0)");
  c.fillStyle=pool;c.beginPath();c.ellipse(lampX,fy+2,74,10,0,0,TAU);c.fill();
  /* ── трофеи на простенках ──
     Между зонами были голые панели во весь рост. Вымпелы и образцы породы —
     то немногое, что человек вешает на стену сам, и они же хвост M83:
     трофеи наконец видно, а не только считается. */
  /* Вешаются НАД зонами, а не равномерно по стене: висящий над пустотой
     вымпел читался случайной фигурой в воздухе. */
  const troph=(H.trophies||[]).length;
  const spots=[];
  {let ax=14;for(let i=0;i<H.tier&&i<HOME_STEP_W.length;i++){
    spots.push(ax+HOME_STEP_W[i]*.5);ax+=HOME_STEP_W[i];}}
  for(let i=0;i<Math.min(spots.length,troph+2);i++){
    const tx=spots[i];
    if(tx>W2-40)break;
    const R2=rng(hashi(0x7A0,i,3));
    if(i%2===0){                                     // вымпел на гвозде
      const col=[[200,120,90],[150,170,200],[190,170,110],[140,190,150]][i%4];
      c.fillStyle="rgba(80,74,66,.9)";c.fillRect(tx-8,fy-76,16,2);   // планка
      c.fillStyle=rgba(col,.75);
      c.beginPath();
      c.moveTo(tx-7,fy-74);c.lineTo(tx+7,fy-74);c.lineTo(tx,fy-58);c.closePath();c.fill();
      c.fillStyle="rgba(255,255,255,.14)";c.fillRect(tx-7,fy-74,14,1.6);
      c.fillStyle="rgba(0,0,0,.3)";                  // тень вымпела на стене
      c.beginPath();
      c.moveTo(tx-5,fy-72);c.lineTo(tx+9,fy-72);c.lineTo(tx+2,fy-56);c.closePath();c.fill();
      c.fillStyle=rgba(col,.75);
      c.beginPath();
      c.moveTo(tx-7,fy-74);c.lineTo(tx+7,fy-74);c.lineTo(tx,fy-58);c.closePath();c.fill();
    }else{                                            // образец породы на кронштейне
      c.fillStyle="rgba(60,56,50,.9)";c.fillRect(tx-8,fy-64,16,2.4);
      const col=[[150,140,120],[120,150,160],[170,140,150]][i%3];
      c.fillStyle=rgba(col,.85);
      c.beginPath();
      c.moveTo(tx-5,fy-64);c.lineTo(tx-2,fy-72);c.lineTo(tx+4,fy-70);
      c.lineTo(tx+6,fy-64);c.closePath();c.fill();
      c.fillStyle="rgba(255,255,255,.12)";
      c.beginPath();c.moveTo(tx-2,fy-72);c.lineTo(tx+4,fy-70);c.lineTo(tx,fy-66);
      c.closePath();c.fill();
    }
  }
  /* ── ступени слева направо: комната растёт, а не подсвечивается ── */
  let x=14;
  const step=(w,fn)=>{fn(x,w);x+=w;};
  /* зона на всю ступень: помечает вещь, с которой можно что-то сделать */
  const zone=(x0,w,id,ru)=>HOME_HIT.push({x:x0-2,y:fy-76,w:w+4,h:78,id,ru});
  /* 1. угол: матрас, ящик вместо стола, лампа на полу */
  if(H.tier>=1)step(52,(x0)=>{
    /* Первая ступень — это про бедность, а не про пустоту: матрас на полу,
       ящик вместо стола, лампа-переноска. Всё мелкое и заношенное, но вещи
       настоящие: с них дом и начинается. */
    homeShade(c,x0+17,fy,36);
    c.fillStyle="rgba(120,96,78,.95)";                // матрас с продавленным верхом
    c.beginPath();
    c.moveTo(x0,fy-1);c.lineTo(x0,fy-9);c.quadraticCurveTo(x0+17,fy-12,x0+34,fy-9);
    c.lineTo(x0+34,fy-1);c.closePath();c.fill();
    c.fillStyle="rgba(150,120,96,.9)";c.fillRect(x0,fy-9,34,2);
    c.fillStyle="rgba(96,80,68,.9)";                  // одеяло, сброшенное к ногам
    c.beginPath();
    c.moveTo(x0+18,fy-9);c.lineTo(x0+34,fy-10);c.lineTo(x0+34,fy-1);c.lineTo(x0+16,fy-1);
    c.closePath();c.fill();
    c.fillStyle="rgba(214,206,190,.85)";c.fillRect(x0+3,fy-13,12,4);  // подушка
    c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x0+3,fy-10,12,1.2);
    c.fillStyle=rgba(mixc(wall,[74,66,58],.92),1);    // ящик вместо стола
    c.fillRect(x0+38,fy-15,14,15);
    c.fillStyle="rgba(255,255,255,.08)";c.fillRect(x0+38,fy-15,14,1.2);
    c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x0+38,fy-8,14,1.2);
    c.fillStyle="rgba(190,215,225,.4)";c.fillRect(x0+41,fy-19,4,4);   // кружка
    c.strokeStyle="rgba(190,215,225,.4)";c.lineWidth=1;
    c.beginPath();c.arc(x0+46,fy-17,1.6,-1.2,1.2);c.stroke();
    /* лампа-переноска на полу: своё пятно света, самое тёплое место в доме */
    c.fillStyle=rgba(acc,.85);
    c.beginPath();c.arc(x0+36,fy-4,2.4,0,TAU);c.fill();
    const lg=c.createRadialGradient(x0+36,fy-4,1,x0+36,fy-4,26);
    lg.addColorStop(0,"rgba(255,205,140,.22)");lg.addColorStop(1,"rgba(255,205,140,0)");
    c.fillStyle=lg;c.beginPath();c.arc(x0+36,fy-4,26,0,TAU);c.fill();
  });
  /* 2. прихожая: дверь, крючки, коврик */
  if(H.tier>=2)step(50,(x0)=>{
    /* Прихожая была дверью, тремя крючками и ковриком — на фоне обжитых семи
       ступеней она выпадала из языка комнаты (хвост M93). Дверь получила
       толщину и притолоку, крючки — то, что на них висит, а пол — следы
       человека, который только что вошёл. */
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x0+2,fy-60,30,60);      // проём с косяком
    c.fillStyle=rgba(mixc(wall,[18,20,26],.7),1);
    c.fillRect(x0+4,fy-58,26,58);
    c.fillStyle="rgba(255,255,255,.05)";c.fillRect(x0+4,fy-58,26,1.4);
    c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1;
    c.strokeRect(x0+4.5,fy-57.5,25,57);
    c.fillStyle="rgba(0,0,0,.3)";                                    // филёнки двери
    c.fillRect(x0+7,fy-53,20,20);c.fillRect(x0+7,fy-29,20,22);
    c.fillStyle="rgba(255,255,255,.06)";
    c.fillRect(x0+7,fy-53,20,1);c.fillRect(x0+7,fy-29,20,1);
    c.fillStyle=rgba(acc,.8);c.beginPath();c.arc(x0+26,fy-30,1.6,0,TAU);c.fill();
    /* планка с крючками, а не крючки в воздухе — и на них настоящая одежда */
    c.fillStyle=rgba(mixc(wall,[70,62,54],.9),1);c.fillRect(x0+32,fy-54,16,2.4);
    const coats=[[92,84,72],[74,88,84]];
    for(let i=0;i<3;i++){
      const hx=x0+35+i*5.5;
      c.strokeStyle="rgba(255,255,255,.22)";c.lineWidth=1;
      c.beginPath();c.moveTo(hx,fy-52);c.lineTo(hx,fy-49);c.stroke();
      if(i<2){                                       // две вещи висят, третий крючок пуст
        /* у одежды есть плечи и подол: без них она читалась бутылкой на полке */
        c.fillStyle=rgba(coats[i],.9);
        c.beginPath();
        c.moveTo(hx,fy-49);
        c.lineTo(hx-4.6,fy-45);c.lineTo(hx-3.6,fy-28);
        c.lineTo(hx+3.8,fy-28);c.lineTo(hx+4.8,fy-45);
        c.closePath();c.fill();
        c.fillStyle="rgba(255,255,255,.07)";                     // блик по плечу
        c.beginPath();c.moveTo(hx,fy-49);c.lineTo(hx-4.6,fy-45);c.lineTo(hx-2,fy-44);
        c.closePath();c.fill();
        c.fillStyle="rgba(0,0,0,.22)";c.fillRect(hx-3.4,fy-38,7,1.2);   // пояс
      }
    }
    /* обувь у порога, ботинок набок: дом — это когда разуваются */
    c.fillStyle="rgba(46,42,40,1)";
    c.fillRect(x0+3,fy-4,7,4);
    c.fillRect(x0+11,fy-3.4,7,3.4);
    c.fillStyle="rgba(255,255,255,.06)";c.fillRect(x0+3,fy-4,7,1);
    /* коврик — с ворсом и вмятиной, а не полоска */
    c.fillStyle="rgba(120,100,86,.7)";c.fillRect(x0+2,fy-3,32,3);
    c.fillStyle="rgba(0,0,0,.25)";
    for(let i=0;i<10;i++)c.fillRect(x0+3+i*3,fy-2.4,1.4,2.4);
    /* полка над крючками: ключи, перчатки, скомканная бумага */
    c.fillStyle=rgba(mixc(wall,[64,58,52],.9),1);c.fillRect(x0+32,fy-62,16,2);
    c.fillStyle="rgba(214,206,190,.5)";c.fillRect(x0+34,fy-65,5,3);
    c.fillStyle=rgba(acc,.5);c.fillRect(x0+42,fy-64,2,2);
  });
  /* 3. гараж: корабль боком, вчетверо шире человека — сюда вы вернётесь */
  if(H.tier>=3)step(88,(x0)=>{
    /* ниша гаража: створ с направляющими, а не тёмный прямоугольник */
    c.fillStyle="rgba(10,12,17,.75)";c.fillRect(x0,fy-66,84,66);
    c.fillStyle="rgba(255,255,255,.04)";c.fillRect(x0,fy-66,84,2);
    for(let i=0;i<6;i++){                             // рёбра створа
      c.fillStyle="rgba(255,255,255,.03)";
      c.fillRect(x0+3+i*13.6,fy-64,11,62);
      c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x0+14+i*13.6,fy-64,1.6,62);
    }
    c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1;
    c.strokeRect(x0+.5,fy-65.5,83,65);
    const gid=(H.garage&&H.garage[0])||G.shipId;
    /* тень на полу под кораблём — до самого корабля, как у всего в игре */
    c.fillStyle="rgba(0,0,0,.45)";
    c.beginPath();c.ellipse(x0+42,fy-4,30,4.5,0,0,TAU);c.fill();
    /* козлы, на которых он стоит: без них корабль висит в нише */
    /* козлы ДОСТАЮТ до брюха: на прежней высоте корабль висел над ними, и
       гараж читался ангаром с левитацией */
    c.fillStyle="rgba(70,64,58,1)";
    for(const dx of [-20,20]){
      c.fillRect(x0+42+dx-6,fy-22,12,3);
      c.fillStyle="rgba(52,48,44,1)";
      c.fillRect(x0+42+dx-5,fy-19,2.6,19);c.fillRect(x0+42+dx+2.4,fy-19,2.6,19);
      c.fillStyle="rgba(90,84,76,1)";                  // подкладка под корпус
      c.fillRect(x0+42+dx-6,fy-23.6,12,1.6);
      c.fillStyle="rgba(70,64,58,1)";
    }
    /* НАСТОЯЩИЙ корпус, а не силуэт: тот же `drawHull`, что в полёте. Плоская
       заливка по контуру превращала корабль в розовую сосиску — сюда же он
       поставлен ради того, чтобы на него смотреть. */
    c.save();
    c.translate(x0+42,fy-31);
    const hl=hullOf(gid),s=Math.min(70/hl.len,26/Math.max(6,hl.halfW*2));
    c.scale(s,s);
    const prev=ctx;ctx=c;
    drawHull(gid,0,0,0,0);
    ctx=prev;
    c.restore();
    /* кабель питания с потолка ниши к корме */
    c.strokeStyle="rgba(242,178,92,.35)";c.lineWidth=1;
    c.beginPath();
    /* кабель идёт к КОРМЕ и не пересекает силуэт: через корпус он читался
       хлыстом поперёк корабля */
    c.moveTo(x0+30,fy-64);c.quadraticCurveTo(x0+26,fy-50,x0+24,fy-38);c.stroke();
    c.fillStyle="rgba(242,178,92,.6)";
    c.beginPath();c.arc(x0+24,fy-38,1.6,0,TAU);c.fill();
    /* Гараж был нишей с кораблём: место, где корабль стоит, но никто не
       работает (хвост M93). Работа видна по вещам — верстак с инструментом,
       щит с ключами по силуэтам, бочка, ветошь и лужа под кормой. */
    c.fillStyle=rgba(mixc(wall,[66,60,54],.92),1);                    // верстак у стены
    c.fillRect(x0+2,fy-20,20,3);
    c.fillStyle="rgba(0,0,0,.45)";c.fillRect(x0+3,fy-17,2.4,17);c.fillRect(x0+19,fy-17,2.4,17);
    c.fillStyle="rgba(255,255,255,.08)";c.fillRect(x0+2,fy-20,20,1);
    c.fillStyle="rgba(150,140,120,.7)";c.fillRect(x0+5,fy-23,6,3);    // коробка деталей
    c.fillStyle="rgba(190,160,110,.6)";c.fillRect(x0+13,fy-22,5,2);
    /* щит уходит ПОД потолок ниши: на прежнем месте он лежал прямо на корпусе
       корабля — две вещи в одном объёме, чего в комнате быть не должно */
    c.fillStyle="rgba(30,34,40,.9)";c.fillRect(x0+3,fy-62,22,14);
    c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1;
    c.strokeRect(x0+3.5,fy-61.5,21,13);
    c.strokeStyle="rgba(190,200,210,.45)";
    for(let i=0;i<4;i++){                                             // ключи по силуэтам
      const kx=x0+7+i*4.6;
      c.beginPath();c.moveTo(kx,fy-59);c.lineTo(kx,fy-53-((i*3)%4));c.stroke();
      c.beginPath();c.arc(kx,fy-59.6,1.2,0,TAU);c.stroke();
    }
    c.fillStyle="rgba(70,66,60,1)";                                   // бочка и ветошь
    c.fillRect(x0+74,fy-14,9,14);
    c.fillStyle="rgba(255,255,255,.07)";c.fillRect(x0+74,fy-14,9,1.4);
    c.fillStyle="rgba(130,120,100,.6)";
    c.beginPath();c.ellipse(x0+70,fy-1.5,4,1.6,0,0,TAU);c.fill();
    c.fillStyle="rgba(20,26,24,.5)";                                  // лужа под кормой
    c.beginPath();c.ellipse(x0+58,fy-1,7,2,0,0,TAU);c.fill();
    zone(x0,84,"garage","гараж");
  });
  /* 4. витрина: стекло, полки, редкое сырьё огоньками */
  if(H.tier>=4)step(56,(x0)=>{
    c.fillStyle="rgba(20,26,32,.75)";c.fillRect(x0+4,fy-62,48,62);
    c.strokeStyle="rgba(160,220,235,.35)";c.lineWidth=1;
    c.strokeRect(x0+4.5,fy-61.5,47,61);
    /* Образцы, а не «ёлочки». Треугольник на полке читался деревом из детской
       игры; здесь у каждого вида редкого своя форма: кристалл огранён, слиток
       лежит бруском, изотоп светится в колбе, ксенобиом — комок в банке. */
    const keys=Object.keys(G.home.showcase||{});
    for(let i=0;i<3;i++){
      const sy=fy-52+i*18;
      c.fillStyle="rgba(70,64,58,.9)";c.fillRect(x0+6,sy,44,2);   // полка с толщиной
      c.fillStyle="rgba(255,255,255,.10)";c.fillRect(x0+6,sy,44,.8);
      for(let j=0;j<3;j++){
        const key=keys[(i*3+j)%Math.max(1,keys.length)];
        if(!key)break;
        const col=hex2rgb(RES[key].col||"#7fe6d8");
        const bx=x0+12+j*14;
        c.fillStyle="rgba(0,0,0,.35)";                            // тень на полке
        c.beginPath();c.ellipse(bx+2,sy-.5,5,1.4,0,0,TAU);c.fill();
        if(key==="crystal"||key==="icecrys"){                     // огранённый кристалл
          c.fillStyle=rgba(col,.9);
          c.beginPath();
          c.moveTo(bx+2,sy-11);c.lineTo(bx+5.5,sy-6);c.lineTo(bx+4,sy-1);
          c.lineTo(bx,sy-1);c.lineTo(bx-1.5,sy-6);c.closePath();c.fill();
          c.fillStyle="rgba(255,255,255,.4)";
          c.beginPath();c.moveTo(bx+2,sy-11);c.lineTo(bx+4,sy-6);c.lineTo(bx+2,sy-1);
          c.closePath();c.fill();
        }else if(key==="iridium"||key==="alloy"){                 // слиток бруском
          c.fillStyle=rgba(col,.85);
          c.beginPath();
          c.moveTo(bx-2,sy-1);c.lineTo(bx,sy-5);c.lineTo(bx+7,sy-5);
          c.lineTo(bx+5,sy-1);c.closePath();c.fill();
          c.fillStyle="rgba(255,255,255,.25)";c.fillRect(bx,sy-5,7,1);
        }else if(key==="isotopes"||key==="volatiles"){            // колба со свечением
          c.fillStyle="rgba(190,215,225,.25)";
          c.fillRect(bx,sy-10,5,9);
          c.fillStyle=rgba(col,.75);c.fillRect(bx+.6,sy-6,3.8,5);
          const gl=c.createRadialGradient(bx+2.5,sy-4,.5,bx+2.5,sy-4,7);
          gl.addColorStop(0,rgba(col,.3));gl.addColorStop(1,rgba(col,0));
          c.fillStyle=gl;c.beginPath();c.arc(bx+2.5,sy-4,7,0,TAU);c.fill();
        }else{                                                    // комок в банке
          c.fillStyle="rgba(190,215,225,.2)";
          c.fillRect(bx-1,sy-9,8,8);
          c.fillStyle=rgba(col,.8);
          c.beginPath();c.arc(bx+3,sy-4.5,2.6,0,TAU);c.fill();
          c.fillStyle="rgba(255,255,255,.18)";c.fillRect(bx-1,sy-9,1.4,8);
        }
      }
    }
    /* блик по стеклу — иначе витрина читается нишей */
    c.fillStyle="rgba(255,255,255,.06)";
    c.beginPath();c.moveTo(x0+8,fy-2);c.lineTo(x0+30,fy-60);c.lineTo(x0+38,fy-60);
    c.lineTo(x0+16,fy-2);c.closePath();c.fill();
    zone(x0,56,"case","витрина");
  });
  /* 5. мастерская: верстак по бедро, тиски, доска с инструментом, стружка
        Дощечка на двух палках выглядела чертежом мебели. Верстак получил
        толщину, ящики, лампу-прищепку и вещи НА нём: пустая столешница
        не отличается от полки. */
  if(H.tier>=5)step(60,(x0)=>{
    homeShade(c,x0+28,fy,52);
    c.fillStyle=rgba(mixc(wall,[86,74,60],.92),1);
    c.fillRect(x0+2,fy-27,54,7);                                     // столешница
    c.fillStyle="rgba(255,255,255,.10)";c.fillRect(x0+2,fy-27,54,1.6);
    c.fillStyle="rgba(0,0,0,.45)";c.fillRect(x0+2,fy-20.5,54,1.6);
    c.fillStyle=rgba(mixc(wall,[54,48,42],.9),1);                    // тумба с ящиками
    c.fillRect(x0+6,fy-20,22,20);
    for(let i=0;i<2;i++){
      c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x0+7,fy-18+i*9,20,1.4);
      c.fillStyle="rgba(210,200,180,.35)";c.fillRect(x0+15,fy-14+i*9,6,1.4);
    }
    c.fillStyle="rgba(0,0,0,.45)";c.fillRect(x0+50,fy-20,4,20);      // задняя нога
    c.fillStyle="rgba(190,200,210,.75)";                             // тиски
    c.fillRect(x0+34,fy-33,9,6);c.fillRect(x0+36,fy-36,5,3);
    c.strokeStyle="rgba(160,170,185,.6)";c.lineWidth=1;
    c.beginPath();c.moveTo(x0+43,fy-30);c.lineTo(x0+48,fy-30);c.stroke();
    c.fillStyle="rgba(150,140,120,.5)";                              // стружка на полу
    for(let i=0;i<7;i++)c.fillRect(x0+10+((i*13)%40),fy-2+((i*5)%2),2.4,1.2);
    c.strokeStyle="rgba(255,255,255,.14)";c.lineWidth=1;             // доска с инструментом
    c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x0+30,fy-60,26,22);
    c.strokeRect(x0+30.5,fy-59.5,25,21);
    for(let i=0;i<5;i++){
      c.strokeStyle="rgba(220,225,235,.5)";c.lineWidth=1.4;
      c.beginPath();c.moveTo(x0+34+i*4.6,fy-56);c.lineTo(x0+34+i*4.6,fy-45+((i*7)%5));c.stroke();
    }
    c.strokeStyle="rgba(180,190,200,.5)";c.lineWidth=1;              // лампа-прищепка
    c.beginPath();c.moveTo(x0+12,fy-27);c.lineTo(x0+12,fy-40);c.lineTo(x0+20,fy-44);c.stroke();
    c.fillStyle=rgba(acc,.8);
    c.beginPath();c.moveTo(x0+18,fy-46);c.lineTo(x0+25,fy-43);c.lineTo(x0+19,fy-41);
    c.closePath();c.fill();
    const wl=c.createRadialGradient(x0+22,fy-40,2,x0+22,fy-40,26);
    wl.addColorStop(0,"rgba(255,205,140,.18)");wl.addColorStop(1,"rgba(255,205,140,0)");
    c.fillStyle=wl;c.beginPath();c.arc(x0+22,fy-40,26,0,TAU);c.fill();
  });
  /* 6. кабинет: стол, стул, терминал со своим светом, стопка бумаг */
  if(H.tier>=6)step(58,(x0)=>{
    homeShade(c,x0+28,fy,50);
    c.fillStyle=rgba(mixc(wall,[64,60,70],.92),1);
    c.fillRect(x0+4,fy-29,48,6);                                     // столешница
    c.fillStyle="rgba(255,255,255,.09)";c.fillRect(x0+4,fy-29,48,1.4);
    c.fillStyle="rgba(0,0,0,.45)";
    c.fillRect(x0+8,fy-23,3.4,23);c.fillRect(x0+44,fy-23,3.4,23);    // ноги
    c.fillStyle=rgba(mixc(wall,[48,46,54],.9),1);                    // тумба сбоку
    c.fillRect(x0+14,fy-22,20,22);
    c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x0+15,fy-15,18,1.4);
    /* стул: спинка и сиденье, а не палка */
    c.fillStyle=rgba(mixc(wall,[70,64,60],.9),1);
    c.fillRect(x0+36,fy-16,14,3);
    c.fillRect(x0+47,fy-30,3,15);
    c.fillStyle="rgba(0,0,0,.4)";
    c.fillRect(x0+37,fy-13,2.4,13);c.fillRect(x0+46,fy-13,2.4,13);
    /* терминал: собственный источник света в комнате */
    c.fillStyle="rgba(24,28,36,1)";c.fillRect(x0+8,fy-45,18,15);
    c.fillStyle="rgba(127,230,216,.35)";c.fillRect(x0+9.4,fy-43.6,15.2,12.2);
    for(let i=0;i<4;i++){
      c.fillStyle="rgba(127,230,216,"+(.25+((i*7)%3)*.12).toFixed(2)+")";
      c.fillRect(x0+11,fy-41+i*3,8+((i*5)%6),1.2);
    }
    c.fillStyle="rgba(60,66,76,1)";c.fillRect(x0+15,fy-30,5,2);      // стойка
    const tg=c.createRadialGradient(x0+17,fy-38,2,x0+17,fy-38,30);
    tg.addColorStop(0,"rgba(127,230,216,.12)");tg.addColorStop(1,"rgba(127,230,216,0)");
    c.fillStyle=tg;c.beginPath();c.arc(x0+17,fy-38,30,0,TAU);c.fill();
    c.fillStyle="rgba(240,235,220,.75)";                             // стопка бумаг
    for(let i=0;i<3;i++)c.fillRect(x0+30+i*.6,fy-31-i*1.2,14,1.4);
    /* ── стена-музей (12m) ──
       Сотня редкостей была счётчиком, а счётчик ничего не рассказывает. Здесь
       она висит над столом: занятая ячейка — предмет в рамке своего грейда,
       пустая — гвоздь и пятно на обоях. Доска прогресса живёт в кабинете, а не
       на отдельном экране. */
    const got=typeof rareCount==="function"?rareCount():0;
    const cols=8,rows=3;
    for(let i=0;i<cols*rows;i++){
      const gx=x0+6+(i%cols)*5.6, gy=fy-72+Math.floor(i/cols)*5.4;
      /* заполняем ряды по числу собранного: сотня раскладывается на 24 ячейки */
      const filled=i<Math.round(got/100*cols*rows);
      if(filled){
        /* стена — не коробка с таблетками: цвет приглушён к стене, иначе
           двадцать четыре ярких квадрата перекрикивают всю комнату */
        const base=hex2rgb(["#c8f0ff","#f2b25c","#c58ae0","#8fd08a"][i%4]);
        const col=mixc(base,wall,.55);
        c.fillStyle="rgba(0,0,0,.5)";c.fillRect(gx,gy,4.6,4.4);
        c.fillStyle=rgba(col,.8);c.fillRect(gx+.8,gy+.8,3,2.8);
        c.strokeStyle=rgba(mixc(base,wall,.3),.45);c.lineWidth=.6;
        c.strokeRect(gx+.3,gy+.3,4,3.8);
        c.fillStyle="rgba(255,255,255,.10)";c.fillRect(gx+.8,gy+.8,3,.7);
      }else{
        c.fillStyle="rgba(255,255,255,.06)";c.fillRect(gx+2,gy+1,1,1);   // гвоздь
        c.fillStyle="rgba(0,0,0,.14)";c.fillRect(gx,gy,4.6,4.4);         // пятно
      }
    }
    zone(x0,58,"study","кабинет");
  });
  /* 7. жилая часть: койки в два яруса — сюда возвращаются наёмники */
  if(H.tier>=7)step(56,(x0)=>{
    homeShade(c,x0+28,fy,48);
    c.fillStyle="rgba(0,0,0,.4)";c.fillRect(x0+4,fy-44,3.4,44);      // стойки
    c.fillRect(x0+47,fy-44,3.4,44);
    for(let i=0;i<2;i++){
      const by=fy-16-i*24;
      c.fillStyle=rgba(mixc(wall,[74,70,76],.88),1);c.fillRect(x0+4,by,46,4);
      c.fillStyle="rgba(150,130,110,.8)";c.fillRect(x0+6,by-6,42,6);   // матрас
      c.fillStyle="rgba(120,104,88,.85)";                              // одеяло углом
      c.beginPath();
      c.moveTo(x0+30,by-6);c.lineTo(x0+48,by-6);c.lineTo(x0+48,by);c.lineTo(x0+26,by);
      c.closePath();c.fill();
      c.fillStyle="rgba(228,222,210,.8)";c.fillRect(x0+8,by-9,11,4);   // подушка
      c.fillStyle="rgba(255,255,255,.1)";c.fillRect(x0+4,by,46,1);
    }
    c.strokeStyle="rgba(180,170,150,.5)";c.lineWidth=1.4;             // лесенка наверх
    c.beginPath();c.moveTo(x0+44,fy-2);c.lineTo(x0+44,fy-40);c.stroke();
    c.beginPath();c.moveTo(x0+50,fy-2);c.lineTo(x0+50,fy-40);c.stroke();
    for(let i=0;i<4;i++){
      c.beginPath();c.moveTo(x0+44,fy-8-i*9);c.lineTo(x0+50,fy-8-i*9);c.stroke();
    }
    c.fillStyle=rgba(mixc(wall,[60,56,52],.9),1);                     // тумбочка
    c.fillRect(x0+2,fy-13,13,13);
    c.fillStyle=rgba(acc,.6);c.beginPath();c.arc(x0+8,fy-16,2.2,0,TAU);c.fill();
    /* ── кто дома ──
       Наёмник, который не в рейсе, сидит здесь телом, а не строкой в списке:
       тот же `hqFigure`, ужатый под комнату — один язык фигур на всю игру.
       Настроение перестаёт быть невидимым множителем: у поникшего опущены
       плечи, и это видно раньше, чем откроешь его карточку. */
    const home=(G.crew||[]).filter(cr=>!cr.order&&!(typeof crewBusy==="function"&&crewBusy(cr)));
    for(let i=0;i<Math.min(home.length,3);i++){
      const cr=home[i];
      homeCrewFigure(c,x0+10+i*15,fy,clamp(cr.morale===undefined?1:cr.morale,0,1));
    }
    zone(x0,56,"living","жилая часть");
  });
  /* 8. причал с маяком: окно в док и живой огонь маяка */
  if(H.tier>=8)step(70,(x0)=>{
    /* Окно было прямоугольником с точками. Настоящее окно — это рама с
       толщиной, переплёт, подоконник, свет, падающий из него на пол, и место,
       откуда в него смотрят: кресло. Причал — последняя ступень, и она должна
       выглядеть как награда, а не как заставка. */
    const wx=x0+4,wy=fy-72,ww=62,wh=46;
    c.fillStyle="rgba(6,9,16,.97)";c.fillRect(wx,wy,ww,wh);
    /* вид: планета, док и свой корабль на приколе */
    c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
    for(let i=0;i<22;i++){
      c.fillStyle="rgba(255,255,255,"+(.18+((i*37)%5)*.12).toFixed(2)+")";
      c.fillRect(wx+2+((i*23)%58),wy+2+((i*17)%42),1,1);
    }
    const pg=c.createRadialGradient(wx+18,wy+wh+6,4,wx+18,wy+wh+6,34);
    pg.addColorStop(0,"rgba(90,150,200,.55)");pg.addColorStop(1,"rgba(40,80,130,0)");
    c.fillStyle=pg;c.beginPath();c.arc(wx+18,wy+wh+6,34,0,TAU);c.fill();
    c.strokeStyle="rgba(150,180,210,.35)";c.lineWidth=1.4;      // ферма причала
    c.beginPath();c.moveTo(wx+42,wy+wh);c.lineTo(wx+46,wy+12);c.stroke();
    c.beginPath();c.moveTo(wx+38,wy+22);c.lineTo(wx+58,wy+18);c.stroke();
    c.restore();
    /* рама с толщиной и переплётом */
    c.strokeStyle="rgba(180,200,220,.45)";c.lineWidth=2.4;
    c.strokeRect(wx+1,wy+1,ww-2,wh-2);
    c.fillStyle="rgba(120,140,160,.35)";
    c.fillRect(wx+ww/2-1,wy,2,wh);c.fillRect(wx,wy+wh/2-1,ww,2);
    c.fillStyle=rgba(mixc(wall,[70,64,58],.85),1);              // подоконник
    c.fillRect(wx-3,wy+wh,ww+6,4);
    c.fillStyle="rgba(255,255,255,.10)";c.fillRect(wx-3,wy+wh,ww+6,1.2);
    /* свет из окна ложится на пол трапецией — второй источник в комнате */
    const shaft=c.createLinearGradient(0,wy+wh,0,fy);
    shaft.addColorStop(0,"rgba(150,190,230,.14)");shaft.addColorStop(1,"rgba(150,190,230,0)");
    c.fillStyle=shaft;
    c.beginPath();
    c.moveTo(wx,wy+wh+4);c.lineTo(wx+ww,wy+wh+4);
    c.lineTo(wx+ww+16,fy);c.lineTo(wx-16,fy);c.closePath();c.fill();
    /* кресло у окна: сюда садятся смотреть, и это видно */
    homeShade(c,x0+24,fy,26);
    c.fillStyle=rgba(mixc(wall,[92,70,60],.9),1);
    c.fillRect(x0+14,fy-16,22,5);                                // сиденье
    c.fillRect(x0+13,fy-30,5,15);                                // спинка
    c.fillStyle="rgba(0,0,0,.4)";
    c.fillRect(x0+16,fy-11,3,11);c.fillRect(x0+31,fy-11,3,11);
    c.fillStyle="rgba(210,170,140,.35)";c.fillRect(x0+18,fy-18,16,2.4);
    /* маяк причала: живой огонь, ради которого ступень и строится */
    const bl=.45+.55*Math.abs(Math.sin(G.t*.04));
    c.fillStyle="rgba(242,178,92,"+bl.toFixed(2)+")";
    c.beginPath();c.arc(wx+ww-8,wy+10,3,0,TAU);c.fill();
    c.fillStyle="rgba(242,178,92,"+(bl*.2).toFixed(2)+")";
    c.beginPath();c.arc(wx+ww-8,wy+10,10,0,TAU);c.fill();
  });
  /* ── хозяин: мерило всей комнаты ── */
  const px=Math.min(W2-30,x+16);
  homeFigure(c,px,fy,acc);
  /* ── полоса «до следующей ступени»: вместо ценника, которого нет ── */
  /* Полоса лежала прямо на полу и ковре, будто их часть. Своя подложка внизу
     кадра отделяет служебное от нарисованного мира — то же правило, что
     у подписей в рубке и на поверхности. */
  const pr=homeProgress();
  if(pr){
    const bh=13, by=H2-bh;
    c.fillStyle="rgba(6,9,14,.82)";c.fillRect(0,by,W2,bh);
    c.fillStyle="rgba(255,255,255,.06)";c.fillRect(0,by,W2,1);
    const bx=12,bw=Math.min(W2-24,300);
    c.fillStyle="rgba(255,255,255,.12)";c.fillRect(bx,by+8,bw,2.6);
    c.fillStyle=rgba(acc,.9);c.fillRect(bx,by+8,bw*pr.frac,2.6);
    c.fillStyle=pr.done?rgba(acc,.9):"rgba(210,225,235,.8)";
    c.font="7px ui-monospace,monospace";c.textAlign="left";
    c.fillText(pr.done?"дом достроен":pr.ru,bx,by+6);
  }
  /* виньетка: комната смотрит на игрока из своего света, а не лежит плоско */
  const vg=c.createRadialGradient(W2/2,H2*.5,H2*.4,W2/2,H2*.5,H2*1.15);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.45)");
  c.fillStyle=vg;c.fillRect(0,0,W2,H2);
}
/* ── хозяин ──
   Был серым столбиком с кружком-головой: комната из-за него теряла и масштаб,
   и смысл — «здесь живёт человек». Теперь это то же тело, что стоит у пультов
   в рубке (`hqFigure`), только ростом под эту комнату: один язык фигур на всю
   игру, а не три разных человечка в трёх экранах. */
function homeFigure(c,x,fy,acc){
  /* hqFigure рисует в своих единицах (рост 89): ужимаем под рост 62 */
  const k=62/89;
  c.save();c.translate(x,fy);c.scale(k,k);
  hqFigure(c,0,0,[168,150,124],G.t*.02,null,0,null,0);
  c.restore();
  /* кружка в руке: мелочь, из-за которой человек дома, а не на вахте */
  c.fillStyle="rgba(190,215,225,.5)";
  c.fillRect(x+8,fy-30,4,5);
}
/* ── палец по комнате ──
   Действие берётся у той же ступени, что нарисована: гараж ставит корабль,
   витрина выносит редкое, кабинет и жилая часть отвечают тем, что в них есть.
   Ни одна зона не делает того, чего нельзя сделать кнопкой, — это второй вход,
   а не второй набор правил. */
function homeSceneClick(cn,e){
  const rc=cn.getBoundingClientRect();
  /* координаты канвы, а не экрана: канва рисуется крупнее и ужимается стилем */
  const px=(e.clientX-rc.left)*(cn.width/rc.width);
  const py=(e.clientY-rc.top)*(cn.height/rc.height);
  const z=homeHitAt(px,py);
  if(!z)return false;
  if(z.id==="garage"){
    /* Первое, зачем сюда заходят: снять налёт прожитых часов. Дома это делают
       до чистого и не берут денег — дом вообще не берёт денег (12s-wear).
       Поэтому обслуживание идёт вперёд «поставить корпус на хранение». */
    if(typeof wearOf==="function"&&wearOf()>.02){
      const got=wearService(1);
      logAdd("tech","Гараж дома: с «"+shipData(G.shipId).ru+"» снят налёт ("+
        Math.round(got*100)+"%)");
      say("Гараж\n«"+shipData(G.shipId).ru+"» отмыт и подкрашен\nналёт снят");
      return true;
    }
    const free=Object.keys(G.owned).filter(id=>id!==G.shipId&&
      !(G.home.garage||[]).includes(id));
    if(free.length&&homeStore(free[0])){say("В гараж поставлен «"+shipData(free[0]).ru+"»");return true;}
    say("Гараж: "+((G.home.garage||[]).length
      ?(G.home.garage.map(id=>"«"+shipData(id).ru+"»").join(", "))
      :"пуст")+"\nставить нечего");
    return false;
  }
  if(z.id==="case"){
    const have=RARE_RES.filter(k=>(G.cargo[k]|0)>0);
    if(have.length){
      const k=have[0],q=Math.min(3,G.cargo[k]|0);
      if(homeShow(k,q)){say("На витрину: "+RES[k].ru+" ×"+q);return true;}
    }
    say("Витрина\nвыставлять нечего: редкое сырьё нужно привезти в трюме");
    return false;
  }
  if(z.id==="study"){
    const got=typeof rareCount==="function"?rareCount():0;
    say("Стена редкостей\n"+got+" из 100"+(got>=100?"\nсобрано всё":"\nпустые гвозди ждут"));
    return false;
  }
  if(z.id==="living"){
    const home=(G.crew||[]).filter(cr=>!cr.order&&!(typeof crewBusy==="function"&&crewBusy(cr)));
    say(home.length?"Дома: "+home.map(cr=>cr.name+
        (cr.morale<.5?" (поник)":"")).join(", ")
      :"Жилая часть пуста\nвсе в рейсах или никого нет");
    return false;
  }
  return false;
}
/* ── наёмник дома ──
   Мельче хозяина: он тут гость, а не хозяин, и комната от этого не теряет
   мерило. Настроение читается позой и цветом — поникший темнее и ниже. */
function homeCrewFigure(c,x,fy,mood){
  const low=mood<.5;
  const k=(low?50:55)/89;
  c.save();c.translate(x,fy);c.scale(k,k);
  const skin=low?[120,112,100]:[150,138,118];
  hqFigure(c,0,0,skin,G.t*.014+x,null,0,null,0);
  c.restore();
  homeShade(c,x,fy,14);
  /* поникший сидит на краю койки: плечи ниже линии, и её видно */
  if(low){
    c.fillStyle="rgba(0,0,0,.25)";
    c.fillRect(x-6,fy-32,12,1.4);
  }
}
/* тень на полу под мебелью: у всего, что стоит, она должна быть — без неё
   предметы висят в воздухе, чем дом и болел в первом заходе */
function homeShade(c,x,fy,w){
  c.fillStyle="rgba(0,0,0,.38)";
  c.beginPath();c.ellipse(x,fy+1,w*.5,3.4,0,0,TAU);c.fill();
}
