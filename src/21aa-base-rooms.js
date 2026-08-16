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
   по помещению через равные шаги. */
const ROOM_FIN={
  reactor :{wall:"rib",  tint:"38,50,58", lamp:"206,240,246", ln:2, floor:"plate", warn:1, work:.30},
  solar   :{wall:"panel",tint:"40,64,74", lamp:"202,238,246", ln:3, floor:"plate", warn:0, work:.66},
  drill   :{wall:"rock", tint:"46,40,33", lamp:"246,212,148", ln:2, dim:.85, floor:"dirt",warn:1, work:.46},
  storage :{wall:"rock", tint:"40,46,52", lamp:"198,218,228", ln:2, dim:.60, floor:"dirt",warn:0, work:.40},
  habitat :{wall:"soft", tint:"54,49,46", lamp:"250,220,168", ln:3, floor:"soft", warn:0, work:.60},
  refinery:{wall:"rib",  tint:"48,41,37", lamp:"248,196,130", ln:2, floor:"plate", warn:1, work:.32},
  pad     :{wall:"panel",tint:"34,46,56", lamp:"228,244,250", ln:3, floor:"plate", warn:1, work:.50},
  lab     :{wall:"tile", tint:"42,62,70", lamp:"226,248,252", ln:3, dim:1.15, floor:"clean",warn:0, work:.52}
};
const FIN_DEF=ROOM_FIN.pad;
/* задняя стена: тон и фактура — от отделки отсека. Без стены за оборудованием
   чёрная дыра, и отсек читается вырезкой, а не помещением */
function bWall(x0,y0,w,h,lit,seed,fin){
  const R=rng(seed),t=fin.tint.split(",").map(Number);
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();
  /* ── стена помещения ──
     Была ровным полем в полсилы: помещение выглядело нежилым, и разрез читался
     чертежом. На образце стена ОСВЕЩЕНА — у потолка светлее, к полу темнее.
     Градиент стоит ровно ничего и делает половину впечатления. */
  const wg=ctx.createLinearGradient(0,y0,0,y0+h),
        st=(k)=>"rgba("+Math.round(t[0]*k)+","+Math.round(t[1]*k)+","+Math.round(t[2]*k)+",";
  wg.addColorStop(0,st(1.16)+(.62+lit*.30).toFixed(2)+")");
  wg.addColorStop(.55,st(.86)+(.60+lit*.28).toFixed(2)+")");
  wg.addColorStop(1,st(.56)+(.66+lit*.24).toFixed(2)+")");
  ctx.fillStyle=wg;ctx.fillRect(x0,y0,w,h);
  if(fin.wall==="rock"){
    /* порода: склад и буровая не отделаны вовсе — стена осталась забоем, и
       по ней это видно раньше, чем по содержимому */
    for(let i=0;i<26;i++){
      const px=x0+R()*w,py=y0+4+R()*(h-8),rr=2+R()*7;
      ctx.fillStyle="rgba(0,0,0,"+(.10+R()*.14).toFixed(3)+")";
      ctx.beginPath();ctx.ellipse(px,py,rr,rr*.62,R()*3,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,"+(.012+R()*.022).toFixed(3)+")";
      ctx.beginPath();ctx.ellipse(px-rr*.2,py-rr*.28,rr*.6,rr*.34,0,0,TAU);ctx.fill();
    }
  }else if(fin.wall==="rib"){
    /* рёбра жёсткости в горячем цеху: часто и вертикально */
    for(let px=x0+5;px<x0+w-3;px+=11){
      ctx.fillStyle="rgba(255,255,255,"+(.026+lit*.03).toFixed(3)+")";ctx.fillRect(px,y0+4,3,h-10);
      ctx.fillStyle="rgba(0,0,0,.30)";ctx.fillRect(px+3,y0+4,2,h-10);
    }
  }else if(fin.wall==="tile"){
    /* плитка лаборатории: мелкая сетка швов, ничего лишнего */
    ctx.strokeStyle="rgba(190,220,230,"+(.05+lit*.06).toFixed(3)+")";ctx.lineWidth=1;
    for(let px=x0+8;px<x0+w;px+=16){ctx.beginPath();ctx.moveTo(px+.5,y0);ctx.lineTo(px+.5,y0+h);ctx.stroke();}
    for(let py=y0+10;py<y0+h;py+=16){ctx.beginPath();ctx.moveTo(x0,py+.5);ctx.lineTo(x0+w,py+.5);ctx.stroke();}
  }else if(fin.wall==="soft"){
    /* жильё: тёплая панель понизу и светлая стена поверху — единственное место
       базы, где отделка сделана для людей, а не для оборудования */
    ctx.fillStyle="rgba(96,74,56,"+(.30+lit*.28).toFixed(2)+")";ctx.fillRect(x0,y0+h-20,w,20);
    ctx.fillStyle="rgba(220,190,150,"+(.06+lit*.10).toFixed(3)+")";ctx.fillRect(x0,y0+h-21,w,1.2);
    for(let px=x0+6;px<x0+w;px+=14){
      ctx.fillStyle="rgba(0,0,0,.16)";ctx.fillRect(px,y0+h-19,1,18);
    }
  }else{                                                  // обшивка секциями
    for(let i=0;i<4;i++){
      const px=x0+4+i*(w-8)/4;
      ctx.fillStyle="rgba(255,255,255,"+(.014+R()*.02).toFixed(3)+")";
      ctx.fillRect(px,y0+6,(w-8)/4-3,h-14);
      ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(px+(w-8)/4-3,y0+6,1,h-14);
    }
  }
  if(fin.wall==="panel"||fin.wall==="rib"){                // заклёпки только там, где сталь
    ctx.fillStyle="rgba(190,205,220,"+(.06+lit*.08).toFixed(3)+")";
    for(let i=0;i<5;i++)ctx.fillRect(x0+8+i*(w-16)/4,y0+4,2,2);
  }
  ctx.restore();
}
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
  bBox(x-2,y-2,w+4,h+4,"rgba(12,16,22,.95)",lit,"rgba(120,140,160,.35)");
  ctx.fillStyle="rgba("+col+","+(.05+lit*.07).toFixed(3)+")";ctx.fillRect(x,y,w,h);
  const R=rng(seed);
  for(let i=0;i<Math.floor(h/4);i++){
    const lw=(3+R()*(w-8))|0;
    ctx.fillStyle="rgba("+col+","+(.20+lit*.45).toFixed(2)+")";
    ctx.fillRect(x+2,y+2+i*4,lw,1.4);
  }
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
  ctx.fillStyle="rgba("+col+","+(.55*a).toFixed(3)+")";ctx.fillRect(cx-w/2,y,w,2.5);
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
function bWorker(x,fy,lit,sit,phase,face){
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
     фигуру. Стекло тёмное, повёрнуто по ходу взгляда, блик один */
  ctx.fillStyle="rgb("+mix(120,206,L)+","+mix(134,222,L)+","+mix(150,236,L)+")";
  ctx.beginPath();ctx.arc(.2,headY,2.9,0,TAU);ctx.fill();
  ctx.fillStyle="rgb(16,22,30)";
  ctx.beginPath();ctx.arc(1.1,headY,2.1,-1.45,1.45);ctx.fill();
  ctx.fillStyle="rgba("+BM_COOL+","+(.35+lit*.45).toFixed(2)+")";
  ctx.fillRect(1.6,headY-1.5,1.1,1.1);
  ctx.fillStyle=suit(.34);ctx.fillRect(-1.4,headY+2.4,3.2,1.8);   // шея-ворот
  ctx.restore();ctx.lineCap="butt";
}

function drawModule(k,x,y,lit,c,r,B){
  const w=BCELL_W-12,h=BCELL_H-12,x0=x+6,y0=y+6;
  const cx=x0+w/2,fy=y0+h-6,seed=hashi(c+1,r+1,(B&&B.idx|0)+7);
  const P=basePower(B);
  ctx.save();
  ctx.beginPath();ctx.rect(x0-2,y0-2,w+4,h+4);ctx.clip();   // ничего не вылезает в породу
  /* задняя стена и пол — общие для всех отсеков: сначала помещение, потом мебель */
  const fin=ROOM_FIN[k]||FIN_DEF;
  bWall(x0,y0,w,h-8,lit,seed,fin);
  /* ── лампы под потолком ──
     Свет в отсеке был разлит ниоткуда: помещение светилось, но источника не
     имело, и потолок оставался пустой полосой. Лампы на потолке с конусом до
     пола объясняют освещение и заодно делят комнату на зоны — ровно то, чем у
     образца читается длина помещения. Число, тон и сила — от отделки: на складе
     горит половина, в лаборатории лишняя, в жилом и горячем цеху свет тёплый. */
  {
    const ln=Math.min(fin.ln,w>120?3:2),dim=fin.dim||1;
    for(let i=0;i<ln;i++){
      const px=x0+w*(i+.5)/ln;
      ctx.fillStyle="rgba(40,48,58,.95)";ctx.fillRect(px-7,y0+2,14,3);
      ctx.fillStyle="rgba("+fin.lamp+","+Math.min(1,(.30+lit*.5)*dim).toFixed(2)+")";
      ctx.fillRect(px-6,y0+5,12,1.6);
      const cg=ctx.createLinearGradient(0,y0+6,0,fy);
      cg.addColorStop(0,"rgba("+fin.lamp+","+((.09+lit*.11)*dim).toFixed(3)+")");
      cg.addColorStop(1,"rgba("+fin.lamp+",0)");
      ctx.fillStyle=cg;
      ctx.beginPath();
      ctx.moveTo(px-7,y0+6);ctx.lineTo(px+7,y0+6);
      ctx.lineTo(px+24,fy);ctx.lineTo(px-24,fy);ctx.closePath();ctx.fill();
    }
  }
  const F=BASE_ROOM[k];
  if(F)F(x0,y0,w,h,cx,fy,lit,seed,B,P,c,r);
  /* ── смена в отсеке ──
     В комнате стоял ровно один работник, и база выглядела законсервированной:
     у образца, по которому это переделывается, в каждом помещении по три-пять
     человек, и именно они делают убежище живым — глаз читает не мебель, а
     людей при мебели. Массовка добавляется поверх «своего» работника отсека,
     общим приёмом, а не правкой восьми комнат по отдельности.

     Честность механики важнее картинки: людей ровно столько, сколько на базе
     персонала. Пустая база остаётся пустой — иначе разрез врал бы о штате. */
  const staff=(typeof baseStaff==="function"&&B)?baseStaff(B).length:0;
  if(staff>0){
    const hh=hashi(c+3,r+5,(B&&B.idx|0)+11);
    const room=Math.min(3,Math.round(staff/2)+((hh>>>4)&1));
    for(let i=0;i<room;i++){
      /* смена стояла по помещению через равные шаги, как расставленные фигурки.
         Люди собираются у рабочего места отсека (`work`) и расходятся от него
         тем дальше, чем дальше по счёту: получается группа при деле, а не ряд */
      const off=(((hh>>>(i*3+2))&7)/7-.5)*(.18+i*.16);
      const px=x0+w*Math.max(.10,Math.min(.90,fin.work+off));
      const sit=((hh>>>(i+9))&3)===0;
      /* тень под ногами: без неё человек висит в воздухе над настилом */
      ctx.fillStyle="rgba(0,0,0,.34)";
      ctx.beginPath();ctx.ellipse(px,fy-1,7,2,0,0,TAU);ctx.fill();
      bWorker(px,fy,lit,sit,G.t*(.028+i*.006)+seed+i*2.1,((hh>>>(i+13))&1)?1:-1);
    }
  }
  /* ── настил ──
     Пол был полосой в четыре пикселя: помещение стояло на черте. У образца
     настил выложен плитой, и по нему читается размер комнаты. Покрытие тоже от
     работы: в цеху стальная плита с жёлтой разметкой, на складе и в забое —
     утоптанная порода без всякой отделки, в жилом отсеке тёплое покрытие, в
     лаборатории светлый наливной пол. */
  const FL={plate:"120,132,146",dirt:"92,78,60",soft:"104,80,62",clean:"168,186,196"}[fin.floor]
           ||"120,132,146";
  ctx.fillStyle="rgba("+FL+","+(.10+lit*.16).toFixed(2)+")";ctx.fillRect(x0,fy-4,w,4);
  ctx.fillStyle="rgba(255,255,255,"+(.05+lit*.08).toFixed(3)+")";ctx.fillRect(x0,fy-4,w,1);
  ctx.save();ctx.beginPath();ctx.rect(x0,fy-4,w,4);ctx.clip();
  if(fin.floor==="dirt"){
    const R2=rng(seed+31);                                  // щебень, а не швы плит
    for(let i=0;i<30;i++){
      ctx.fillStyle="rgba(0,0,0,"+(.12+R2()*.18).toFixed(3)+")";
      ctx.fillRect(x0+R2()*w,fy-4+R2()*3.4,1+R2()*2.6,1);
    }
  }else if(fin.floor!=="clean"){
    ctx.strokeStyle="rgba(10,14,18,"+(fin.floor==="soft"?".28":".5")+")";ctx.lineWidth=1;
    for(let px=x0+9;px<x0+w;px+=18){
      ctx.beginPath();ctx.moveTo(px,fy-4);ctx.lineTo(px-2,fy);ctx.stroke();
    }
  }
  ctx.restore();
  if(fin.warn){                                             // разметка — только где опасно
    ctx.fillStyle="rgba(214,168,64,"+(.14+lit*.18).toFixed(2)+")";
    ctx.fillRect(x0+3,fy-5.2,w-6,1.1);
  }
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,fy,w,6);
  ctx.restore();
}
/* Сами восемь помещений — в 21ab-base-interiors: `drawModule` берёт их из
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
    const bc=baseCost(k);
    ctx.fillText(bc.credits+"кр",x+i*cw+cw/2,y+36);
    if(bc.alloy)ctx.fillText(bc.alloy+"спл",x+i*cw+cw/2,y+48);
  }
}
