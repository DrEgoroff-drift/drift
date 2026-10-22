/* ══════════════ база: внутренности отсеков ══════════════ */
/* Продолжение 21a-mode-base: сама сцена, энергия и разрез — там, здесь только
   то, чем отсек наполнен изнутри. Разделено по размеру: вместе выходило 86 КБ,
   и найти в них нужную комнату стоило дороже, чем нарисовать её. */
/* ══════════════ внутренности отсеков ══════════════ */
/* Отсек — это НЕ коробка в клетке: пустота уже вырублена общим путём (baseRoomPath),
   и рамка вокруг каждой ячейки возвращает разрезу вид таблицы. Рисуем только то,
   что в отсеке стоит, и пол, на котором оно стоит. Подпись — лишь у выбранного.

   МАСШТАБ. Человек в этой сцене ростом 26 px (`drawAstronaut` со scale .9), пол
   отсека — на `y0+86`, потолок — на `y0`. Значит: стол 16 px высотой, койка 12,
   дверной проём 24, стеллаж в три яруса по 22, реактор во всю высоту помещения.
   Всё, что рисуется здесь, меряется этими числами, а не «на глаз от ячейки», —
   иначе оборудование выходит игрушечным (кольцо реактора радиусом 16 было ниже
   пояса стоящему рядом человеку).

   ЯЗЫК. Тот же, что в кабине и на абордаже: тонкая линия, тёплый оранжевый —
   конструкции и предупреждения, холодный циан — питание, экраны и приборы,
   свет всегда откуда-то (лампа, топка, ядро), а не разлит равномерно. */
const BM_WARM="242,178,92", BM_COOL="127,230,216", BM_CORE="140,240,255";
/* ── проход кисти отсека (G11) ──
   Станок отсека — это тело, которое стоит, и то, что в нём движется: бак
   реактора и пар над клапаном, стеллаж и тележка у прохода. Тело печётся
   вместе с оболочкой (21ad), живое рисуется кадром поверх. Кисть одна на оба
   прохода и спрашивает, что рисовать: bS() — тело, bL() — живое. 0 — всё
   сразу (так рисует всякий, кто зовёт кисть вне базы) */
let BASE_PASS=0,BASE_LIGHT=null;
function bS(){return BASE_PASS!==2;}
function bL(){return BASE_PASS===0||BASE_PASS===2;}
/* ── проход света (3) ──
   Свои лампы у станков (над пультом реактора, над столом жилого) и тёплые
   пятна от неподвижных источников — это СВЕТ, а не краска: трапеция поверх
   картинки ложилась плёнкой и ничего не освещала. В проходе света кисть
   рисует тело в пустой приёмник, а bLamp/bGlow кладут свою силу в карту света
   поля (синий канал маски, 21ad) — там она умножает то, что под ней стоит */
/* стойка/панель обшивки: заливка + светлая кромка сверху и тень снизу.
   Из этих трёх линий собирается почти вся мебель отсеков */
function bBox(x,y,w,h,fill,lit,edge){
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
  ctx.fillStyle="rgba(255,255,255,"+(.05+lit*.10).toFixed(3)+")";ctx.fillRect(x,y,w,1);
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(x,y+h-1,w,1);
  if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
}
/* ── отделка отсека ──
   Восемь помещений строились по одному рецепту: та же обшивка секциями, те же
   заклёпки, тот же холодный тон, тот же настил с жёлтой краевой полосой и те же
   лампы. Отличался только станок посредине — и разворот читался ОДНОЙ комнатой,
   в которую подставили разный реквизит. У образца наоборот: жильё отделано, цех
   голый, склад вырублен в породе, и это видно раньше, чем видно оборудование.

   Отделка идёт от работы, а не от вкуса: где горячо — рёбра, тёплая лампа и
   разметка; где живут — мягкая стена, панель понизу и ковёр; где склад — голая
   порода и полсвета; в лаборатории — плитка и лишний свет. `work` — доля
   ширины, у которой в отсеке рабочее место: смена собирается там, а не стоит
   по помещению через равные шаги.

   `dress` — что висит на стене. Отделка сказала, ЧТО это за помещение; след на
   стене говорит, КТО в нём работает: доска со сменным графиком, инструмент на
   крюках, трафаретный номер по породе, снимок и календарь над койкой. Вешается
   на пустую стену до оборудования, поэтому станок её честно перекрывает. */
const ROOM_FIN={
  reactor :{wall:"rib",  tint:"38,50,58", lamp:"206,240,246", ln:2, floor:"plate", warn:1, work:.30, dress:["board","cable"],     junk:["canister","spool"]},
  solar   :{wall:"panel",tint:"40,64,74", lamp:"202,238,246", ln:3, floor:"plate", warn:0, work:.18, dress:["board","stencil"],   junk:["canister","drum"]},
  drill   :{wall:"rock", tint:"46,40,33", lamp:"246,212,148", ln:2, dim:.85, floor:"dirt",warn:1, work:.46, dress:["hooks","stencil"],  junk:["ore","ore"]},
  storage :{wall:"rock", tint:"40,46,52", lamp:"198,218,228", ln:2, dim:.60, floor:"dirt",warn:0, work:.40, dress:["stencil","board"],  junk:["drum","bag"]},
  habitat :{wall:"soft", tint:"54,49,46", lamp:"250,220,168", ln:3, floor:"soft", warn:0, work:.34, bare:1, calm:1, dress:["personal","personal"], junk:["bag","bottles"]},
  refinery:{wall:"rib",  tint:"48,41,37", lamp:"248,196,130", ln:2, floor:"plate", warn:1, work:.82, calm:1, dress:["hooks","cable"],     junk:["ingot","ore"]},
  pad     :{wall:"panel",tint:"34,46,56", lamp:"228,244,250", ln:3, floor:"plate", warn:1, work:.50, dress:["hooks","board"],     junk:["spool","drum"]},
  lab     :{wall:"tile", tint:"42,62,70", lamp:"226,248,252", ln:3, dim:1.15, floor:"clean",warn:0, work:.52, dress:["board","samples"], junk:["bottles","canister"]},
  battery :{wall:"rib",  tint:"44,44,50", lamp:"236,206,150", ln:2, dim:.9,  floor:"plate", warn:1, work:.38, dress:["stencil","hooks"],  junk:["canister","spool"]}
};
/* ── что стоит у стены ──
   Хлам во всех восьми отсеках был один: ящик да стеллаж. Но у каждой работы
   свой остаток — руда у бура, слитки у печи, баллоны у реактора, катушка на
   площадке, вещмешок в жилом, ящик с посудой в лаборатории. Ставится по углам,
   где не ходят: у станка своё место, а хлам живёт по краям. */
const FIN_DEF=ROOM_FIN.pad;
/* труба: колено из двух отрезков, блик по верхней кромке */
function bPipe(pts,wd,col,lit){
  ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=wd+2;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();
  ctx.strokeStyle="rgba("+col+","+(.35+lit*.35).toFixed(2)+")";ctx.lineWidth=wd;ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,"+(.10+lit*.12).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]-wd*.3);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]-wd*.3);ctx.stroke();
  ctx.lineCap="butt";
}
/* экран: тёмное стекло, строки данных, бегущая полоса развёртки */
function bScreen(x,y,w,h,col,lit,seed){
  if(bS()){
  bBox(x-2,y-2,w+4,h+4,"rgba(12,16,22,.95)",lit,"rgba(120,140,160,.35)");
  ctx.fillStyle="rgba("+col+","+(.05+lit*.07).toFixed(3)+")";ctx.fillRect(x,y,w,h);
  const R=rng(seed);
  for(let i=0;i<Math.floor(h/4);i++){
    const lw=(3+R()*(w-8))|0;
    ctx.fillStyle="rgba("+col+","+(.20+lit*.45).toFixed(2)+")";
    ctx.fillRect(x+2,y+2+i*4,lw,1.4);
  }
  }
  if(!bL())return;
  const sy=y+((G.t*.8+seed*7)%(h+8))-4;
  ctx.fillStyle="rgba("+col+","+(.10+lit*.14).toFixed(3)+")";
  if(sy>y&&sy<y+h)ctx.fillRect(x,sy,w,2);
}
/* ящик: не квадрат, а контейнер — обвязка, угловые накладки, маркировка */
function bCrate(x,y,w,h,c,lit,tag){
  bBox(x,y,w,h,"rgba("+c+",.92)",lit,"rgba(0,0,0,.5)");
  ctx.strokeStyle="rgba(255,255,255,"+(.06+lit*.10).toFixed(3)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x+.5,y+h*.35);ctx.lineTo(x+w-.5,y+h*.35);
  ctx.moveTo(x+w*.5,y+h*.35);ctx.lineTo(x+w*.5,y+h-.5);ctx.stroke();
  if(tag){ctx.fillStyle="rgba("+BM_WARM+","+(.30+lit*.40).toFixed(2)+")";
    ctx.fillRect(x+2,y+2,Math.min(10,w-4),3);}
}
/* лампа под потолком: сама полоса и конус света, падающий на пол */
function bLamp(cx,y,w,fy,col,a){
  if(BASE_PASS===3){                                        // свет — в карту поля
    const L=BASE_LIGHT,g=L.createLinearGradient(0,y,0,fy);
    /* сила конуса — как у main (.14 цвета лампы, к полу в ноль): поле умножает её
       ×1.5, и прежние a·1.1→a·.35 давали белый столб (Контроль 26.09) */
    g.addColorStop(0,"rgba(0,0,255,"+Math.min(1,a*.16).toFixed(3)+")");
    g.addColorStop(1,"rgba(0,0,255,0)");
    L.save();L.globalCompositeOperation="lighter";L.fillStyle=g;L.beginPath();
    L.moveTo(cx-w/2,y);L.lineTo(cx+w/2,y);L.lineTo(cx+w*1.5,fy);L.lineTo(cx-w*1.5,fy);
    L.closePath();L.fill();L.restore();return;
  }
  ctx.fillStyle="rgba("+col+","+(.55*a).toFixed(3)+")";ctx.fillRect(cx-w/2,y,w,2.5);
  if(BASE_PASS===1)return;                                  // в выпечке — только сама лампа
  const g=ctx.createLinearGradient(0,y,0,fy);
  g.addColorStop(0,"rgba("+col+","+(.14*a).toFixed(3)+")");
  g.addColorStop(1,"rgba("+col+",0)");
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(cx-w/2,y);ctx.lineTo(cx+w/2,y);ctx.lineTo(cx+w*1.5,fy);ctx.lineTo(cx-w*1.5,fy);
  ctx.closePath();ctx.fill();
}
/* предупреждающая штриховка на полу — язык опасного оборудования */
function bHazard(x,y,w,h,a){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle="rgba(20,16,10,"+(.7*a).toFixed(2)+")";ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="rgba("+BM_WARM+","+(.45*a).toFixed(2)+")";ctx.lineWidth=3;
  for(let i=-h;i<w;i+=8){ctx.beginPath();ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);ctx.stroke();}
  ctx.restore();
}
/* тёплое пятно от источника: свет должен ложиться на пол и стены, иначе
   светящаяся деталь выглядит наклейкой поверх тёмной комнаты */
function bGlow(cx,cy,r,col,a){
  if(BASE_PASS===1)return;                                  // неподвижное пятно — свет поля
  if(BASE_PASS===3){
    const L=BASE_LIGHT,g=L.createRadialGradient(cx,cy,1,cx,cy,r*1.3);
    g.addColorStop(0,"rgba(0,0,255,"+Math.min(1,a*3).toFixed(3)+")");g.addColorStop(1,"rgba(0,0,255,0)");
    L.save();L.globalCompositeOperation="lighter";L.fillStyle=g;L.beginPath();L.arc(cx,cy,r*1.3,0,TAU);L.fill();L.restore();
    return;
  }
  const g=ctx.createRadialGradient(cx,cy,1,cx,cy,r);
  g.addColorStop(0,"rgba("+col+","+a.toFixed(3)+")");
  g.addColorStop(1,"rgba("+col+",0)");
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();ctx.restore();
}
/* человек на рабочем месте: та же схема, что у астронавта, но сидя/стоя и мелко.
   Живой отсек отличается от макета именно тем, что в нём кто-то есть */
/* Человек рисуется телом, а не палками: комбинезон — трапеция плеч, ранец за
   спиной, шлем со стеклом и бликом, руки и ноги в два звена. Палочный человечек
   рядом с проработанным оборудованием сразу выдаёт макет. Рост 24 px стоя,
   тем же мерилом смеряна вся мебель. */
/* ── человек ──
   На крупном плане прежняя фигура разваливалась: шлем в 3.6 радиуса при росте
   в 24 — это голова в треть тела, полупрозрачность (α .45–.9) делала людей
   призраками сквозь мебель, а «рука к работе» уходила вбок обрубком. Рядом с
   проработанным оборудованием это читалось макетом, а не сменой.

   Пропорции взяты человеческие: голова примерно в шестую часть роста, плечи
   вдвое шире головы, ноги — половина фигуры. Заливки НЕПРОЗРАЧНЫ: человек в
   освещённом отсеке — самый плотный предмет кадра, сквозь него не видно ни
   станка, ни стены. Читается он тремя тонами: тёмный комбинезон, светлый
   шлем, один цветной блик на стекле. */
function bWorker(x,fy,lit,sit,phase,face,bare){
  if(!bL())return;                                      // человек всегда живой
  if(rigCardWorker(x,fy,lit,sit,phase,face,bare))return; // риг карточкой в очередь (21phc, M801)
  const d=face===-1?-1:1;
  const L=.55+lit*.45;                                  // общая освещённость фигуры
  const mix=(a,b,t)=>Math.round(a+(b-a)*t);
  const suit=(k)=>"rgb("+mix(38,96,k*L)+","+mix(46,112,k*L)+","+mix(58,132,k*L)+")";
  const bob=Math.sin(phase)*.5, sw=Math.sin(phase*1.6);
  ctx.save();ctx.translate(x,fy);ctx.scale(d,1);
  const H=24;                                            // рост стоя, мерило всей мебели
  const hipY=sit?-10:-11.5, shY=(sit?-17:-19)+bob, headY=(sit?-21.5:-23.5)+bob;
  if(sit){
    ctx.fillStyle="rgb(34,41,50)";                       // табурет
    ctx.fillRect(-5.5,-10,12,2.2);ctx.fillRect(-.8,-8,2,8);
    ctx.fillStyle=suit(.55);                             // бедро вперёд, голень вниз
    ctx.fillRect(0,-11,8.5,3.2);
    ctx.fillStyle=suit(.42);ctx.fillRect(6.5,-8.5,3.2,8.5);
    ctx.fillStyle="rgb(24,29,36)";ctx.fillRect(6,-1.4,5,1.6);
  }else{
    ctx.fillStyle=suit(.40);                             // дальняя нога темнее ближней
    ctx.fillRect(-2.6+sw*1.5,hipY,3,11.5);
    ctx.fillStyle=suit(.58);
    ctx.fillRect(.2-sw*1.5,hipY,3,11.5);
    ctx.fillStyle="rgb(22,27,34)";                       // ботинки
    ctx.fillRect(-3.4+sw*1.4,-1.8,5,1.8);ctx.fillRect(-.4-sw*1.4,-1.8,5,1.8);
  }
  /* корпус: плечи вдвое шире головы, книзу сужается — фигура, а не столбик */
  ctx.fillStyle=suit(.62);
  ctx.beginPath();
  ctx.moveTo(-4.2,shY);ctx.lineTo(4.2,shY);
  ctx.lineTo(3.2,hipY+.5);ctx.lineTo(-3.2,hipY+.5);ctx.closePath();ctx.fill();
  ctx.fillStyle=suit(.34);ctx.fillRect(-4.2,shY,1.6,hipY-shY);   // теневая сторона
  ctx.fillStyle="rgb(28,34,42)";ctx.fillRect(-4.2,shY+5.4,8.4,1.2);  // ремень
  ctx.fillStyle=suit(.5);ctx.fillRect(-6,shY+1,2,7.5);               // ранец за спиной
  /* руки в два звена: ближняя занята делом, дальняя вдоль тела — по ним и
     видно, что человек работает, а не стоит по стойке */
  ctx.strokeStyle=suit(.30);ctx.lineWidth=2;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-2.6,shY+1.4);
  ctx.lineTo(-3.6,shY+5);ctx.lineTo(-2.8,shY+8.6);ctx.stroke();
  ctx.strokeStyle=suit(.66);
  ctx.beginPath();ctx.moveTo(2.6,shY+1.4);
  ctx.lineTo(5.4,shY+4.4+sw);ctx.lineTo(sit?8.4:7.4,shY+7+sw*1.4);ctx.stroke();
  /* шлем: голова в шестую часть роста, светлый — по нему глаз и собирает
     фигуру. Стекло тёмное, повёрнуто по ходу взгляда, блик один.
     В жилом отсеке шлемы СНЯТЫ (закон 8, M232): люди дома, и впервые
     видно лица — тепло дешевле любого света. */
  if(bare){
    ctx.fillStyle="rgb("+mix(128,214,L)+","+mix(100,174,L)+","+mix(78,138,L)+")";  // кожа
    ctx.beginPath();ctx.arc(.2,headY,2.7,0,TAU);ctx.fill();
    ctx.fillStyle="rgb(36,31,28)";                          // волосы
    ctx.beginPath();ctx.arc(0,headY-.6,2.6,Math.PI*1.02,Math.PI*1.98);ctx.fill();
    ctx.fillStyle="rgb(22,18,16)";ctx.fillRect(1.3,headY-.6,1,1);   // глаз по ходу взгляда
  }else{
    ctx.fillStyle="rgb("+mix(120,206,L)+","+mix(134,222,L)+","+mix(150,236,L)+")";
    ctx.beginPath();ctx.arc(.2,headY,2.9,0,TAU);ctx.fill();
    ctx.fillStyle="rgb(16,22,30)";
    ctx.beginPath();ctx.arc(1.1,headY,2.1,-1.45,1.45);ctx.fill();
    ctx.fillStyle="rgba("+BM_COOL+","+(.35+lit*.45).toFixed(2)+")";
    ctx.fillRect(1.6,headY-1.5,1.1,1.1);
  }
  ctx.fillStyle=suit(.34);ctx.fillRect(-1.4,headY+2.4,3.2,1.8);   // шея-ворот
  ctx.restore();ctx.lineCap="butt";
}

/* ── отсек в три слоя (G11) ──
   Отсек рисовался целиком каждый кадр, хотя двигается в нём только станок и
   люди. Теперь он в трёх слоях: ОБОЛОЧКА — стена, след смены, лампы, хлам —
   печётся видеокартой один раз вместе со всей базой (21ad); ЖИВОЕ — станок
   и смена — рисуется кадром поверх; НАСТИЛ ложится выпечкой переднего плана
   сверху, как и раньше лёг бы после людей. Конусы ламп ушли в поле света:
   свет теперь не наклейка трапецией, а освещённость, которая падает от
   лампы и гаснет к углам. */
/* ── настил ──
   Пол был полосой в четыре пикселя: помещение стояло на черте. У образца
   настил выложен плитой, и по нему читается размер комнаты. Покрытие тоже от
   работы: в цеху стальная плита с жёлтой разметкой, на складе и в забое —
   утоптанная порода без всякой отделки, в жилом отсеке тёплое покрытие, в
   лаборатории светлый наливной пол. */
/* Сами восемь помещений — в 21ab-base-interiors: `drawModuleLive` берёт их из
   `BASE_ROOM` по ключу постройки, и добавить отсек — значит дописать функцию
   туда, а не править этот файл. */
function drawBuildMenu(S){
  const w=Math.min(W-40,420),x=W/2-w/2,y=H-150;
  ctx.fillStyle="rgba(6,10,16,.88)";ctx.fillRect(x,y,w,64);
  ctx.strokeStyle="rgba(242,178,92,.6)";ctx.lineWidth=1;ctx.strokeRect(x,y,w,64);
  const n=BUILD_KEYS.length,cw=w/n;
  for(let i=0;i<n;i++){
    const k=BUILD_KEYS[i],on=i===S.pick;
    ctx.fillStyle=on?"rgba(242,178,92,.18)":"rgba(0,0,0,0)";
    ctx.fillRect(x+i*cw,y+2,cw,60);
    ctx.fillStyle=on?"rgba(255,230,180,.95)":"rgba(200,210,220,.5)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(BUILD[k].ru.toUpperCase().slice(0,9),x+i*cw+cw/2,y+22);
    const bc=baseCost(k,(G.base&&G.base.B)||null);   /* смета этой базы (M396) */
    ctx.fillText(bc.credits+"кр",x+i*cw+cw/2,y+36);
    if(bc.alloy)ctx.fillText(bc.alloy+"спл",x+i*cw+cw/2,y+48);
  }
}
