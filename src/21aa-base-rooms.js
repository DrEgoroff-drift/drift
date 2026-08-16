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
/* Каждый отсек — своя функция: так их видно списком и можно править по одному,
   не разбирая общий `if/else if` на восемь ветвей. */
const BASE_ROOM={
/* ── РЕАКТОР: гермозона во всю высоту, ядро, теплоноситель, пульт ── */
reactor(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const vw=46,vh=66,vx=x0+18,vy=fy-vh;              // сосуд от пола почти до потолка
  /* ядро светит по отдаче, но не гаснет совсем: тёмный сосуд читается баком,
     а не реактором, — нижний порог оставляет столб света видимым всегда */
  const heat=.35+P.eff*.65;
  const pulse=.55+Math.sin(G.t*.05)*.10+Math.sin(G.t*.11)*.05;
  bHazard(vx-8,fy-4,vw+16,4,.8);
  /* теплоноситель уходит в потолок и вбок к соседям — база связана трубами */
  bPipe([[vx+10,vy+8],[vx+10,y0+10],[x0+w-6,y0+10]],5,"120,140,158",lit);
  bPipe([[vx+vw-10,vy+10],[vx+vw-10,y0+22],[x0+w-6,y0+22]],4,"120,140,158",lit);
  /* корпус: бочка с фаской, рёбра жёсткости, смотровые люки */
  bBox(vx,vy,vw,vh,"rgba(28,36,46,.96)",lit,"rgba(150,170,190,.35)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(vx+5,vy+6,vw-10,vh-14);
  /* ядро: столб света внутри, ярче внизу, с дрожью */
  const cg=ctx.createLinearGradient(0,vy+8,0,fy-8);
  cg.addColorStop(0,"rgba("+BM_CORE+","+(.18+heat*.45*pulse).toFixed(3)+")");
  cg.addColorStop(.6,"rgba("+BM_CORE+","+(.45+heat*.75*pulse).toFixed(3)+")");
  cg.addColorStop(1,"rgba(215,252,255,"+(.30+heat*.60*pulse).toFixed(3)+")");
  ctx.fillStyle=cg;ctx.fillRect(vx+9,vy+10,vw-18,vh-20);
  /* Активная зона — яркая полоса в середине столба: пять тёмных стержней во всю
     высоту превращали сосуд в решётку радиатора. Оставляем три, и только там,
     где холоднее, а в середине — свет. */
  ctx.fillStyle="rgba(10,16,22,"+(.40+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(vx+13+i*((vw-26)/2.4),vy+12,2.4,vh-24);
  const zg=ctx.createLinearGradient(0,vy+vh*.42,0,vy+vh*.72);
  zg.addColorStop(0,"rgba(220,252,255,0)");
  zg.addColorStop(.5,"rgba(235,254,255,"+(.85*heat*pulse).toFixed(3)+")");
  zg.addColorStop(1,"rgba(220,252,255,0)");
  ctx.fillStyle=zg;ctx.fillRect(vx+9,vy+vh*.42,vw-18,vh*.3);
  /* обручи корпуса */
  for(let i=0;i<3;i++){
    const by=vy+10+i*(vh-20)/2.6;
    bBox(vx-3,by,vw+6,6,"rgba(38,48,60,.95)",lit,"rgba(0,0,0,.5)");
    ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
    for(let j=0;j<4;j++)ctx.fillRect(vx+j*(vw/4)+5,by+2,2,2);
  }
  bGlow(cx-30,fy-vh*.5,58,BM_CORE,(.10+heat*.22)*pulse);
  /* Пульт: тумба по пояс, наклонная приборная доска, два экрана и клавиатура.
     Оператор стоит ПЕРЕД доской, а не за глухим коробом — иначе от человека
     торчит одна голова, и стол читается пустым ящиком. */
  const dx=x0+w-50,dy=fy-16;
  bBox(dx,dy,44,16,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.28)");
  ctx.fillStyle="rgba(22,28,36,.97)";                        // наклонная доска
  ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(dx+44,dy);ctx.lineTo(dx+44,dy-13);ctx.lineTo(dx+8,dy-8);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(150,170,190,.28)";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";  // клавиши на доске
  for(let i=0;i<5;i++)ctx.fillRect(dx+12+i*6,dy-6,4,2);
  bScreen(dx+4,dy-32,22,16,BM_CORE,lit,seed);
  bScreen(dx+30,dy-30,14,14,P.eff>.6?BM_COOL:"255,150,90",lit,seed+3);
  bWorker(dx-9,fy,lit,false,G.t*.05+seed,1);
  /* аварийная лампа в корпусе с козырьком: мигает при нехватке мощности */
  if(P.eff<.6){
    const bl=Math.sin(G.t*.22)>0?1:.15,ax=x0+w-16,ay=y0+30;
    ctx.fillStyle="rgba(40,46,56,"+(.7+lit*.2).toFixed(2)+")";
    ctx.fillRect(ax-6,ay-7,12,3);ctx.fillRect(ax-1.5,ay-11,3,4);
    ctx.fillStyle="rgba(255,90,70,"+(.9*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(ax,ay,3.4,0,TAU);ctx.fill();
    bGlow(ax,ay,22,"255,90,70",.26*bl);
  }
  bLamp(cx+34,y0+4,26,fy,BM_CORE,.35+lit*.4);
},
/* ── СОЛНЕЧНАЯ ПАНЕЛЬ: массив над грунтом, под ним — щитовая ── */
solar(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* Панель стоит НА поверхности, а помещение под ней — щитовая. Поэтому наверху
     узкая полоса светового люка и мачта, а не парящий по всему отсеку массив:
     в разрезе панель во всю комнату читалась как забытая доска. */
  /* наклон маленький, мачта ниже: при большом угле край массива уходил
     за потолок отсека и обрезался — панель читалась сломанной доской */
  const tilt=Math.sin(G.t*.005+seed)*.13-.07;
  const mx=x0+40,my=y0+19;
  /* световой люк: сквозь него в щитовую падает дневной свет */
  ctx.fillStyle="rgba(150,190,225,"+(.14+lit*.10).toFixed(3)+")";
  ctx.fillRect(mx-16,y0,32,3);
  /* луч дневного света тёплый и слабый: холодная серая клякса читалась пятном
     грязи на стене, а не солнцем из люка */
  const sg=ctx.createLinearGradient(mx,y0,mx+26,fy);
  sg.addColorStop(0,"rgba(255,238,205,"+(.13+lit*.07).toFixed(3)+")");
  sg.addColorStop(1,"rgba(255,238,205,0)");
  ctx.fillStyle=sg;ctx.beginPath();
  ctx.moveTo(mx-16,y0+2);ctx.lineTo(mx+16,y0+2);ctx.lineTo(mx+44,fy);ctx.lineTo(mx-2,fy);
  ctx.closePath();ctx.fill();
  /* мачта с приводом и сам массив: небольшой, зато с фермой снизу */
  ctx.fillStyle="rgba(60,72,86,"+(.6+lit*.3).toFixed(2)+")";ctx.fillRect(mx-2.5,y0+3,5,18);
  ctx.save();ctx.translate(mx,my);ctx.rotate(tilt);
  const pw=56,ph=8;
  ctx.strokeStyle="rgba(110,128,146,"+(.35+lit*.3).toFixed(2)+")";ctx.lineWidth=1.2;
  for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(0,ph/2);ctx.lineTo(i*pw*.45,ph/2+4);ctx.stroke();}
  bBox(-pw/2,-ph/2,pw,ph,"rgba(24,42,66,.98)",lit,"rgba(130,190,230,.55)");
  for(let i=1;i<6;i++){ctx.fillStyle="rgba(120,170,210,.28)";ctx.fillRect(-pw/2+i*pw/6,-ph/2+1,1,ph-2);}
  const gx=-pw/2+((G.t*.6+seed*11)%(pw+24))-12;
  const gg=ctx.createLinearGradient(gx-10,0,gx+10,0);
  gg.addColorStop(0,"rgba(200,230,255,0)");
  gg.addColorStop(.5,"rgba(200,230,255,"+(.12+lit*.35).toFixed(2)+")");
  gg.addColorStop(1,"rgba(200,230,255,0)");
  ctx.fillStyle=gg;ctx.fillRect(-pw/2,-ph/2,pw,ph);
  ctx.restore();
  /* кабельный лоток по стене — то, чем массив соединён со щитом */
  bPipe([[mx,y0+16],[mx,y0+30],[x0+22,y0+34],[x0+22,fy-46]],3,"90,104,120",lit);
  /* щит: рама с автоматами, каждый переключается сам, и прибор с настоящей стрелкой */
  const px=x0+10,py=fy-46,pw2=44;
  bBox(px,py,pw2,46,"rgba(28,36,46,.97)",lit,"rgba(150,170,190,.32)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(px+3,py+16,pw2-6,26);
  for(let i=0;i<6;i++){
    const bx=px+6+(i%3)*12,by=py+20+((i/3)|0)*11,up=((seed>>i)&1)?P.eff>.4:true;
    ctx.fillStyle="rgba(60,70,84,"+(.7+lit*.2).toFixed(2)+")";ctx.fillRect(bx,by,8,9);
    ctx.fillStyle=up?"rgba("+BM_COOL+",.75)":"rgba(255,120,90,.75)";
    ctx.fillRect(bx+2,up?by+1:by+5,4,3);
  }
  const need=Math.max(.05,P.prod),gauge=clamp(P.prod?(P.prod-P.cons)/need*.5+.5:.5,0,1);
  ctx.fillStyle="rgba(12,16,22,.95)";ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.fill();
  ctx.strokeStyle="rgba("+BM_COOL+","+(.30+lit*.45).toFixed(2)+")";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.stroke();
  for(let i=0;i<=4;i++){                                   // деления шкалы
    const a=Math.PI+i*Math.PI/4;
    ctx.beginPath();ctx.moveTo(px+pw2/2+Math.cos(a)*9,py+12+Math.sin(a)*9);
    ctx.lineTo(px+pw2/2+Math.cos(a)*6.5,py+12+Math.sin(a)*6.5);ctx.stroke();
  }
  const na=Math.PI+(gauge*.9+.05+Math.sin(G.t*.07)*.02)*Math.PI;
  ctx.strokeStyle="rgba(255,190,120,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(px+pw2/2,py+12);
  ctx.lineTo(px+pw2/2+Math.cos(na)*8,py+12+Math.sin(na)*8);ctx.stroke();
  /* батарейная стойка: рама, банки, уровень заряда и клеммы */
  const sx2=x0+62,sw2=w-72;
  bBox(sx2-3,fy-40,sw2+6,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  for(let i=0;i<4;i++){
    const bx=sx2+i*(sw2/4);
    bBox(bx,fy-36,sw2/4-5,36,"rgba(24,32,42,.96)",lit,"rgba(120,140,160,.3)");
    const ch=clamp(P.eff*1.3-i*.15,0,1);
    ctx.fillStyle="rgba("+BM_COOL+","+(.22+lit*.5).toFixed(2)+")";
    ctx.fillRect(bx+3,fy-4-ch*28,sw2/4-11,ch*28);
    ctx.fillStyle="rgba(160,178,196,"+(.2+lit*.2).toFixed(2)+")";  // клеммы
    ctx.fillRect(bx+3,fy-39,3,3);ctx.fillRect(bx+sw2/4-11,fy-39,3,3);
    if(ch>.05&&R()<.9)bGlow(bx+sw2/8-2,fy-8,14,BM_COOL,.05+ch*.05);
  }
  bGlow(mx+10,fy-6,40,"200,225,255",.05+lit*.05);
},
/* ── БУРОВАЯ: портал, привод, шнек уходит сквозь пол, отвал на транспортёре ── */
drill(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.05,spin=on?G.t*.20*P.eff:0;
  bHazard(cx-34,fy-4,68,4,.85);
  /* Портал держит всю установку, поэтому он тяжёлый: широкие стойки на башмаках,
     балка с косынками и решётка раскосов между ярусами. Тонкие палки читались
     чертежом, а не машиной. */
  for(let i=0;i<2;i++){
    const px=i?cx+31:cx-40;
    bBox(px,y0+8,9,fy-y0-8,"rgba(32,40,50,.97)",lit,"rgba(0,0,0,.45)");
    ctx.fillStyle="rgba(58,70,84,"+(.5+lit*.3).toFixed(2)+")";     // башмак
    ctx.fillRect(px-3,fy-5,15,5);
    ctx.fillStyle="rgba(190,205,220,"+(.07+lit*.09).toFixed(3)+")"; // болты
    for(let j=0;j<5;j++)ctx.fillRect(px+3,y0+16+j*14,3,3);
  }
  bBox(cx-40,y0+8,80,10,"rgba(42,52,64,.97)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(42,52,64,.97)";                               // косынки под балкой
  ctx.beginPath();ctx.moveTo(cx-31,y0+18);ctx.lineTo(cx-31,y0+28);ctx.lineTo(cx-19,y0+18);ctx.closePath();
  ctx.moveTo(cx+31,y0+18);ctx.lineTo(cx+31,y0+28);ctx.lineTo(cx+19,y0+18);ctx.closePath();ctx.fill();
  /* решётка раскосов — по ней и видно, что это ферма */
  ctx.strokeStyle="rgba(110,128,146,"+(.22+lit*.22).toFixed(2)+")";ctx.lineWidth=2.4;
  for(let i=0;i<3;i++){
    const ya=y0+18+i*16,yb=ya+16;
    ctx.beginPath();ctx.moveTo(cx-31,ya);ctx.lineTo(cx+31,yb);
    ctx.moveTo(cx+31,ya);ctx.lineTo(cx-31,yb);ctx.stroke();
  }
  /* привод: короб с двумя шкивами и ремнём, шкивы крутятся вместе с буром */
  bBox(cx-24,y0+26,48,20,"rgba(36,45,56,.98)",lit,"rgba(150,170,190,.30)");
  ctx.fillStyle="rgba(24,31,40,.95)";ctx.fillRect(cx-20,y0+30,40,12);
  /* мотор с рёбрами охлаждения слева и шкив с ремнём справа: два одинаковых
     круга посреди короба читались парой глаз, а не приводом */
  bBox(cx-19,y0+31,18,10,"rgba(50,60,74,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";
  for(let i=0;i<5;i++)ctx.fillRect(cx-17+i*3.4,y0+32,1.4,8);
  ctx.strokeStyle="rgba(190,205,220,"+(.25+lit*.3).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(cx+10,y0+36,6,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+10,y0+36);
  ctx.lineTo(cx+10+Math.cos(spin)*6,y0+36+Math.sin(spin)*6);ctx.stroke();
  ctx.lineWidth=1.6;ctx.strokeStyle="rgba(30,36,44,"+(.6+lit*.2).toFixed(2)+")";
  ctx.beginPath();ctx.moveTo(cx-1,y0+30.5);ctx.lineTo(cx+10,y0+30);
  ctx.moveTo(cx-1,y0+41.5);ctx.lineTo(cx+10,y0+42);ctx.stroke();
  /* штанга и шнек: винт рисуется синусом по фазе — вращение видно, а не подразумевается */
  const dy0=y0+46,dy1=fy+10;
  /* обсадная колонна: без неё винт висел оранжевой загогулиной посреди комнаты.
     Труба тёмная, шнек виден внутри неё, сверху и снизу — фланцы */
  bBox(cx-12,dy0,24,dy1-dy0,"rgba(20,26,34,.9)",lit,"rgba(140,158,176,.5)");
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(cx-10,dy0,5,dy1-dy0);   // тень внутри трубы
  ctx.strokeStyle="rgba(150,168,186,"+(.28+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал
  /* Виток шнека — половинка эллипса на каждый шаг спирали: ближняя половина
     светлая, дальняя тёмная. Синусоида в одну линию давала «бантики», по ним
     вращение не читалось вовсе. */
  ctx.save();ctx.beginPath();ctx.rect(cx-11,dy0+1,22,dy1-dy0-2);ctx.clip();
  const pitch=7, ph=(spin*1.6)%pitch;
  for(let yy=dy0-pitch;yy<dy1+pitch;yy+=pitch){
    const y2=yy+ph;
    ctx.strokeStyle="rgba(112,86,60,"+(.45+lit*.3).toFixed(2)+")";ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(cx,y2,8,pitch*.5,0,Math.PI,TAU);ctx.stroke();   // дальняя половина витка
    ctx.strokeStyle="rgba(226,166,100,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=2.6;
    ctx.beginPath();ctx.ellipse(cx,y2+pitch*.5,8,pitch*.5,0,0,Math.PI);ctx.stroke(); // ближняя
  }
  ctx.strokeStyle="rgba(150,168,186,"+(.30+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал поверх дальних витков
  ctx.restore();
  ctx.fillStyle="rgba(52,62,76,"+(.7+lit*.2).toFixed(2)+")";  // фланцы колонны
  ctx.fillRect(cx-15,dy0,30,5);ctx.fillRect(cx-15,fy-22,30,5);
  ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
  for(let i=0;i<4;i++){ctx.fillRect(cx-12+i*8,dy0+1,3,3);ctx.fillRect(cx-12+i*8,fy-21,3,3);}
  /* устье скважины: воротник, пыль и подсветка снизу */
  bBox(cx-16,fy-8,32,8,"rgba(24,30,38,.98)",lit,"rgba(0,0,0,.5)");
  if(on){
    const R=rng(seed);
    for(let i=0;i<10;i++){
      const ph=(G.t*.03+R()*6)%1;
      ctx.fillStyle="rgba(200,168,130,"+((1-ph)*.30*P.eff).toFixed(3)+")";
      ctx.beginPath();ctx.arc(cx+(R()-.5)*38*ph*2,fy-6-ph*22,1.6+ph*2.4,0,TAU);ctx.fill();
    }
    bGlow(cx,fy-4,26,"255,180,110",.10*P.eff);
  }
  /* транспортёр отвала: лента с роликами, куски руды едут к стене */
  /* Лента — плотный короб с бортами и роликами ВНУТРИ: тонкая полоска с
     кружками под ней читалась палкой на шариках, а куски руды висели в воздухе */
  const bx=cx+18,bw2=x0+w-6-bx,by=fy-18;
  ctx.strokeStyle="rgba(90,104,120,"+(.35+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+5,fy);ctx.lineTo(bx+5,by+8);
  ctx.moveTo(x0+w-14,fy);ctx.lineTo(x0+w-14,by+8);ctx.stroke();      // опоры
  bBox(bx,by,bw2,9,"rgba(28,35,45,.98)",lit,"rgba(120,138,156,.35)");
  ctx.fillStyle="rgba(14,19,26,.9)";ctx.fillRect(bx+2,by+3,bw2-4,5); // полотно
  ctx.strokeStyle="rgba(120,138,156,"+(.18+lit*.18).toFixed(2)+")";ctx.lineWidth=1;
  for(let i=0;i<5;i++){const rx=bx+7+i*((bw2-14)/4);ctx.beginPath();ctx.arc(rx,by+6,2.4,0,TAU);ctx.stroke();}
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";ctx.fillRect(bx,by,bw2,1.4);
  if(on)for(let i=0;i<5;i++){
    const t=((G.t*.012*P.eff)+i*.2)%1,ox=bx+4+t*(x0+w-10-bx);
    ctx.fillStyle="rgba(0,0,0,.4)";                        // тень куска на полотне
    ctx.beginPath();ctx.ellipse(ox,by+2.6,3.2,1,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(146,116,84,"+(.55+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(ox,by+.6,2.8,2.2,i,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(206,178,140,"+(.18+lit*.2).toFixed(2)+")";  // блик на куске
    ctx.beginPath();ctx.ellipse(ox-.8,by-.3,1.2,.8,i,0,TAU);ctx.fill();
  }
  /* пост управления: рычаг ходит, когда бур работает */
  const px=x0+14;
  bBox(px,fy-24,20,24,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(px+3,fy-21,14,10,on?BM_COOL:"255,150,90",lit,seed+5);
  ctx.strokeStyle="rgba("+BM_WARM+","+(.4+lit*.4).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(px+10,fy-24);
  ctx.lineTo(px+10+Math.sin(G.t*.04)*4*(on?1:0),fy-34);ctx.stroke();
},
/* ── СКЛАД: стеллажи в три яруса, тележка, разметка ── */
storage(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* заполненность настоящая: пустой склад стоит пустым, полный забит доверху */
  const fill=clamp(P.store?basePoolHeld(B)/P.store:0,0,1);
  ctx.fillStyle="rgba("+BM_WARM+",.10)";ctx.fillRect(x0+6,fy-3,w-12,2);  // разметка прохода
  for(let s=0;s<2;s++){
    const rx=x0+8+s*(w*.52),rw=w*.42,tiers=3;
    /* стойки и полки */
    for(let t=0;t<tiers;t++){
      const ty=fy-6-t*24;
      bBox(rx,ty-3,rw,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
      /* груз на полке: коробки, бочки и мешки — вперемешку, по хешу ячейки */
      let px=rx+3;
      while(px<rx+rw-8){
        const kind=R(),bw=8+R()*12,bh=12+R()*6;
        if((t+s)/ (tiers+1) > fill+.15){px+=bw+3;continue;}   // выше уровня запаса полки пустые
        if(kind<.5)bCrate(px,ty-3-bh,bw,bh,"58,52,44",lit,R()<.4);
        else if(kind<.8){                                     // бочка
          bBox(px,ty-3-bh,bw*.8,bh,"rgba(46,58,52,.95)",lit,"rgba(0,0,0,.45)");
          ctx.strokeStyle="rgba(160,180,196,"+(.12+lit*.14).toFixed(2)+")";ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(px,ty-3-bh*.7);ctx.lineTo(px+bw*.8,ty-3-bh*.7);
          ctx.moveTo(px,ty-3-bh*.3);ctx.lineTo(px+bw*.8,ty-3-bh*.3);ctx.stroke();
        }else{                                                // мешок
          ctx.fillStyle="rgba(66,60,50,.95)";
          ctx.beginPath();ctx.ellipse(px+bw*.4,ty-3-bh*.45,bw*.45,bh*.5,0,0,TAU);ctx.fill();
        }
        px+=bw+3;
      }
    }
    bBox(rx-3,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
    bBox(rx+rw-1,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  }
  /* табличка яруса — склад без маркировки не склад */
  ctx.fillStyle="rgba("+BM_WARM+","+(.25+lit*.35).toFixed(2)+")";
  ctx.fillRect(x0+10,y0+6,16,7);
  ctx.fillStyle="rgba(10,14,20,.8)";ctx.fillRect(x0+12,y0+8,12,3);
  /* тележка у прохода */
  const tx=cx-6+Math.sin(G.t*.008+seed)*10;
  bBox(tx,fy-13,22,9,"rgba(52,44,36,.95)",lit,"rgba(0,0,0,.45)");
  ctx.strokeStyle="rgba(150,168,186,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(tx+21,fy-13);ctx.lineTo(tx+25,fy-22);ctx.stroke();
  ctx.fillStyle="rgba(30,36,44,.95)";
  ctx.beginPath();ctx.arc(tx+4,fy-2,3,0,TAU);ctx.arc(tx+17,fy-2,3,0,TAU);ctx.fill();
  bLamp(cx,y0+4,30,fy,"255,232,196",.25+lit*.35);
},
/* ── ЖИЛОЙ ОТСЕК: койки, стол, шкафчики, зелень, иллюминатор ── */
habitat(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const warm=(.35+lit*.5);
  /* двухъярусные койки слева: рама, матрас, одеяло, спящий */
  const bx=x0+8,bw=52;
  for(let t=0;t<2;t++){
    const by=fy-14-t*32;
    bBox(bx,by,bw,5,"rgba(46,56,68,.98)",lit,"rgba(0,0,0,.4)");        // основание
    bBox(bx+2,by-8,bw-4,8,"rgba(78,74,70,.95)",lit,null);              // матрас
    ctx.fillStyle="rgba(96,74,60,"+(.65+lit*.2).toFixed(2)+")";        // одеяло
    ctx.beginPath();ctx.moveTo(bx+2,by-6);ctx.lineTo(bx+bw*.62,by-8-(t?1:2));
    ctx.lineTo(bx+bw*.62,by);ctx.lineTo(bx+2,by);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(150,158,168,"+(.30+lit*.22).toFixed(2)+")";    // подушка
    ctx.beginPath();ctx.ellipse(bx+bw-10,by-6,7,3.4,0,0,TAU);ctx.fill();
    if(t===0){                                                          // на нижней спят
      const br=Math.sin(G.t*.03)*.6;
      ctx.fillStyle="rgba(158,168,180,"+(.32+lit*.28).toFixed(2)+")";  // затылок спящего
      ctx.beginPath();ctx.arc(bx+bw-13,by-9,3.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(96,74,60,"+(.7+lit*.2).toFixed(2)+")";
      ctx.beginPath();ctx.ellipse(bx+bw*.4,by-8+br,bw*.32,3.4,0,0,TAU);ctx.fill();
    }
    /* лампочка для чтения у изголовья */
    const on=Math.sin(G.t*.02+t*2.1)>-.5;
    ctx.fillStyle="rgba(255,214,150,"+((on?.8:.15)*warm).toFixed(2)+")";
    ctx.beginPath();ctx.arc(bx+bw-3,by-14,2,0,TAU);ctx.fill();
    if(on)bGlow(bx+bw-3,by-14,18,"255,200,140",.10*warm);
  }
  ctx.strokeStyle="rgba(120,138,156,"+(.2+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+bw-2,fy);ctx.lineTo(bx+bw-2,fy-46);ctx.stroke();  // стойка коек
  /* стол с лампой, кружкой и планшетом; за ним сидит человек */
  const tx=cx+16;
  bBox(tx,fy-16,44,4,"rgba(60,50,42,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(40,48,58,.9)";ctx.fillRect(tx+4,fy-12,3,12);ctx.fillRect(tx+37,fy-12,3,12);
  ctx.fillStyle="rgba(210,225,238,"+warm.toFixed(2)+")";ctx.fillRect(tx+30,fy-21,6,5);  // кружка
  ctx.fillRect(tx+35,fy-20,2,2);
  bScreen(tx+8,fy-26,14,10,BM_COOL,lit,seed+2);
  /* настольная лампа даёт тёплое пятно — главный источник уюта в кадре */
  ctx.strokeStyle="rgba(160,176,192,"+(.3+lit*.2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(tx+42,fy-16);ctx.lineTo(tx+42,fy-30);ctx.lineTo(tx+36,fy-33);ctx.stroke();
  ctx.fillStyle="rgba(255,220,160,"+(.7*warm+.2).toFixed(2)+")";
  ctx.beginPath();ctx.arc(tx+35,fy-32,2.6,0,TAU);ctx.fill();
  bGlow(tx+35,fy-30,34,"255,206,150",.10+lit*.10);
  bWorker(tx+2,fy,lit,true,G.t*.03+seed);
  /* шкафчики и зелень: жильё узнаётся по мелочам, а не по койкам */
  const lx=x0+w-26;
  for(let i=0;i<3;i++)bBox(lx,y0+16+i*18,22,16,"rgba(34,42,52,.96)",lit,"rgba(130,150,170,.25)");
  ctx.fillStyle="rgba(150,170,190,"+(.2+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(lx+16,y0+22+i*18,4,2);
  const gx=cx+4;
  bBox(gx-5,fy-10,10,10,"rgba(70,54,44,.95)",lit,"rgba(0,0,0,.4)");
  /* листья разной длины и приглушённого цвета: ровный ярко-зелёный веер
     смотрелся салатом из семи одинаковых перьев */
  for(let i=0;i<6;i++){
    const a=-Math.PI/2+(i-2.5)*.36+Math.sin(G.t*.01+i)*.05;
    const len=8+((i*37)%5)*1.6;
    ctx.strokeStyle="rgba("+(i%2?"78,132,80":"96,152,92")+","+(.45+lit*.3).toFixed(2)+")";
    ctx.lineWidth=i%2?1.4:2;
    ctx.beginPath();ctx.moveTo(gx,fy-10);
    ctx.quadraticCurveTo(gx+Math.cos(a)*5,fy-14-len*.4,gx+Math.cos(a)*(len*.9),fy-12-len);ctx.stroke();
  }
  /* иллюминатор-экран: в разрезе окна быть не может, поэтому это вид с камеры */
  const px=x0+w-52,py=y0+14;
  ctx.fillStyle="rgba(8,12,20,.95)";ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(60,110,150,"+(.18+lit*.22).toFixed(2)+")";
  ctx.beginPath();ctx.arc(px,py,10,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(220,235,250,"+(.4+lit*.3).toFixed(2)+")";
  for(let i=0;i<4;i++){const a=seed+i*2.1;
    ctx.fillRect(px+Math.cos(a)*7,py+Math.sin(a)*6,1.4,1.4);}
  ctx.strokeStyle="rgba(150,170,190,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.stroke();
  /* потолочный свет тёплый: жилой отсек — единственное место на базе, где не
     должно быть сине-стального цеха, и одной настольной лампы на это не хватает */
  bLamp(cx-6,y0+4,34,fy,"255,222,178",.30+lit*.40);
},
/* ── ПЛАВИЛЬНЯ: печь, ковш, изложницы, вытяжка, искры ── */
refinery(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const hot=P.eff,fl=(.65+Math.sin(G.t*.13)*.2+Math.sin(G.t*.31)*.1)*hot;
  bHazard(x0+6,fy-4,w-12,4,.5);
  /* печь: корпус, арочная топка, свет из неё бьёт вперёд */
  const ox=x0+10,oy=fy-52,ow=54,oh=52;
  bBox(ox,oy,ow,oh,"rgba(34,30,28,.98)",lit,"rgba(160,120,80,.35)");
  ctx.fillStyle="rgba(20,16,14,.95)";
  ctx.beginPath();ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  const fg=ctx.createRadialGradient(ox+ow/2,fy-14,2,ox+ow/2,fy-14,30);
  fg.addColorStop(0,"rgba(255,236,180,"+(.85*fl).toFixed(2)+")");
  fg.addColorStop(.45,"rgba(255,150,50,"+(.55*fl).toFixed(2)+")");
  fg.addColorStop(1,"rgba(180,40,10,0)");
  ctx.fillStyle=fg;ctx.beginPath();
  ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  /* обвязка печи и вытяжка в потолок */
  ctx.strokeStyle="rgba(150,120,90,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox,oy+16);ctx.lineTo(ox+ow,oy+16);ctx.stroke();
  bPipe([[ox+ow/2,oy+2],[ox+ow/2,y0+8],[x0+w-8,y0+8]],7,"70,78,88",lit);
  /* ковш на рельсе: наклоняется и льёт металл в изложницу */
  const cyc=(G.t*.006+seed)%1, pour=cyc>.45&&cyc<.75&&hot>.2;
  const lx=ox+ow+26;
  ctx.strokeStyle="rgba(120,138,156,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox+ow,y0+26);ctx.lineTo(x0+w-10,y0+26);ctx.stroke();   // рельс
  ctx.beginPath();ctx.moveTo(lx,y0+26);ctx.lineTo(lx,y0+34);ctx.stroke();
  ctx.save();ctx.translate(lx,y0+36);ctx.rotate(pour?.55:0);
  bBox(-11,0,22,16,"rgba(40,34,30,.98)",lit,"rgba(160,120,80,.4)");
  ctx.fillStyle="rgba(255,180,90,"+(.7*hot).toFixed(2)+")";ctx.fillRect(-9,1,18,4);
  ctx.restore();
  if(pour){
    const sx=lx+8,sy0=y0+50,sy1=fy-14;
    const sg=ctx.createLinearGradient(0,sy0,0,sy1);
    sg.addColorStop(0,"rgba(255,240,190,.95)");sg.addColorStop(1,"rgba(255,140,40,.85)");
    ctx.strokeStyle=sg;ctx.lineWidth=3.4;
    ctx.beginPath();ctx.moveTo(sx,sy0);
    for(let t=0;t<=1;t+=.2)ctx.lineTo(sx+Math.sin(t*4+G.t*.3)*1.6,sy0+(sy1-sy0)*t);
    ctx.stroke();
    bGlow(sx,sy1,34,"255,170,70",.22);
    for(let i=0;i<8;i++){                                   // искры от струи
      const t=(G.t*.06+i*.37)%1;
      ctx.fillStyle="rgba(255,210,120,"+((1-t)*.8).toFixed(2)+")";
      ctx.beginPath();ctx.arc(sx+Math.cos(i*2.3)*t*18,sy1-t*14+t*t*20,1.2,0,TAU);ctx.fill();
    }
  }
  /* изложницы и остывающие слитки: свежий ещё красный, дальние уже серые */
  for(let i=0;i<3;i++){
    const gx=lx+2+i*20-2;
    bBox(gx-9,fy-10,18,10,"rgba(30,28,26,.98)",lit,"rgba(0,0,0,.5)");
    const cool=clamp(1-((cyc*3+i)%3)/2.2,0,1)*hot;
    ctx.fillStyle="rgb("+(70+cool*185|0)+","+(74+cool*110|0)+","+(82-cool*30|0)+")";
    ctx.fillRect(gx-7,fy-8,14,6);
    if(cool>.3)bGlow(gx,fy-6,16,"255,140,50",.14*cool);
  }
  /* правая половина цеха: стеллаж готовых слитков, бак шлака и плавильщик.
     Без них половина отсека стояла пустой, и печь висела в вакууме */
  const rx=x0+w-40;
  bBox(rx,fy-34,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx,fy-16,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx-2,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  bBox(rx+33,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  for(let t=0;t<2;t++)for(let i=0;i<3;i++){
    const iy=fy-34-4+t*18,ix=rx+3+i*10;
    ctx.fillStyle="rgba(126,134,146,"+(.35+lit*.35).toFixed(2)+")";
    ctx.fillRect(ix,iy,8,4);
    ctx.fillStyle="rgba(190,200,212,"+(.10+lit*.14).toFixed(2)+")";ctx.fillRect(ix,iy,8,1);
  }
  const sbx=rx-24;                                        // бак шлака: тёмная корка, снизу тлеет
  bBox(sbx,fy-14,20,14,"rgba(26,24,24,.98)",lit,"rgba(90,70,54,.4)");
  ctx.fillStyle="rgba(60,50,46,.95)";ctx.fillRect(sbx+2,fy-12,16,5);
  ctx.fillStyle="rgba(255,120,40,"+(.25*hot).toFixed(2)+")";ctx.fillRect(sbx+3,fy-7,14,2);
  bWorker(sbx-12,fy,lit,false,G.t*.04+seed,-1);
  /* марево над печью: дешёвая подделка, но без него горячий цех выглядит холодным */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const yy=fy-20-((G.t*.4+i*22)%46);
    ctx.fillStyle="rgba(255,150,70,"+(.05*hot).toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(ox+ow/2+Math.sin(G.t*.02+i)*6,yy,18,7,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  bGlow(ox+ow/2,fy-16,52,"255,150,60",.10+.16*fl);
},
/* ── ПЛОЩАДКА: подъёмник, захваты, створки в потолке, груз ── */
pad(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const cyc=(G.t*.004+seed)%1;
  const lift=cyc<.5?0:Math.sin((cyc-.5)*Math.PI*2)*18;     // платформа ходит вверх-вниз
  /* створки в потолке: раскрываются, когда платформа идёт наверх */
  const open=clamp((lift-2)/14,0,1)*26;
  ctx.fillStyle="rgba(10,14,20,.9)";ctx.fillRect(cx-30,y0,60,7);
  bBox(cx-30,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  bBox(cx+open/2,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  if(open>2){                                              // сквозь щель видно небо
    const sg=ctx.createLinearGradient(0,y0,0,y0+26);
    sg.addColorStop(0,"rgba(150,190,225,"+(.35*(open/26)).toFixed(2)+")");
    sg.addColorStop(1,"rgba(150,190,225,0)");
    ctx.fillStyle=sg;ctx.fillRect(cx-open/2,y0,open,26);
  }
  bHazard(cx-34,fy-4,68,4,.9);
  /* гидравлика: два цилиндра со штоками — по ним и видно, что платформа едет */
  for(let i=0;i<2;i++){
    const px=cx-20+i*40;
    bBox(px-4,fy-16,8,16,"rgba(36,45,56,.98)",lit,"rgba(0,0,0,.4)");
    ctx.fillStyle="rgba(170,186,200,"+(.25+lit*.3).toFixed(2)+")";
    ctx.fillRect(px-2,fy-16-lift,4,lift+2);
  }
  /* сама платформа с захватами по углам */
  const py=fy-18-lift;
  bBox(cx-32,py,64,6,"rgba(46,56,68,.98)",lit,"rgba(150,170,190,.3)");
  ctx.strokeStyle="rgba("+BM_WARM+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=2;
  for(let i=0;i<2;i++){
    const gx=cx-28+i*56;
    ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx,py-7);ctx.lineTo(gx+(i?-5:5),py-10);ctx.stroke();
  }
  /* контейнер на платформе — площадка не пустая, она для переброски */
  bCrate(cx-16,py-22,32,22,"46,56,50",lit,true);
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";ctx.fillRect(cx-12,py-19,8,3);
  /* бегущие огни разметки: последовательность читается как «идёт цикл» */
  for(let i=0;i<6;i++){
    const on=((G.t*.08|0)%6)===i;
    ctx.fillStyle="rgba("+BM_COOL+","+(on?.9:.20).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x0+14+i*((w-28)/5),fy-7,2.2,0,TAU);ctx.fill();
    if(on)bGlow(x0+14+i*((w-28)/5),fy-7,14,BM_COOL,.20);
  }
  /* кран-балка под потолком: рельс, тележка ездит, крюк на тросе качается */
  bBox(x0+6,y0+10,w-12,4,"rgba(38,48,60,.97)",lit,"rgba(0,0,0,.4)");
  const trx=x0+20+((G.t*.15+seed*13)%(w-52));
  bBox(trx,y0+13,16,6,"rgba(52,62,76,.98)",lit,"rgba(150,170,190,.3)");
  const hl=16+Math.sin(G.t*.02+seed)*5;
  ctx.strokeStyle="rgba(160,178,196,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(trx+8,y0+19);ctx.lineTo(trx+8,y0+19+hl);ctx.stroke();
  ctx.lineWidth=1.8;ctx.beginPath();
  ctx.arc(trx+8,y0+21+hl,3,-.4,Math.PI+.4);ctx.stroke();
  /* груз в очереди у стены, пульт причала и приёмщик */
  bCrate(x0+8,fy-18,20,18,"52,46,40",lit,false);
  bCrate(x0+8,fy-32,16,14,"44,50,58",lit,true);
  const dx=x0+w-24;
  bBox(dx,fy-30,18,30,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(dx+3,fy-27,12,10,BM_COOL,lit,seed+9);
  ctx.fillStyle="rgba("+BM_WARM+","+(.3+lit*.3).toFixed(2)+")";     // кнопки пульта
  for(let i=0;i<3;i++)ctx.fillRect(dx+3+i*5,fy-13,3,3);
  bWorker(dx-11,fy,lit,false,G.t*.035+seed,1);
},
/* ── ЛАБОРАТОРИЯ: образцы, голограмма, центрифуга, находка на подставке ── */
lab(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.15;
  /* верстак вдоль всей стены */
  bBox(x0+6,fy-20,w-12,4,"rgba(46,54,64,.98)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(28,34,42,.9)";ctx.fillRect(x0+10,fy-16,4,16);ctx.fillRect(x0+w-16,fy-16,4,16);
  /* колбы с образцами: стекло, среда, пузырьки — каждая своего цвета */
  for(let i=0;i<3;i++){
    const gx=x0+18+i*22,gh=22;
    const col=[[120,220,180],[190,150,240],[240,190,120]][i];
    ctx.fillStyle="rgba(14,20,28,.9)";ctx.fillRect(gx-6,fy-20-gh,12,gh);
    ctx.fillStyle=rgba(col,(.18+lit*.30)*(on?1:.4));
    ctx.fillRect(gx-5,fy-20-gh*.7,10,gh*.7);
    if(on)for(let b=0;b<3;b++){
      const t=((G.t*.03+b*.33+i*.17)%1);
      ctx.fillStyle=rgba(col,(1-t)*.5);
      ctx.beginPath();ctx.arc(gx-3+((b*3+i)%5),fy-20-t*gh*.68,1.1,0,TAU);ctx.fill();
    }
    ctx.strokeStyle="rgba(190,210,225,"+(.16+lit*.16).toFixed(2)+")";ctx.lineWidth=1;
    ctx.strokeRect(gx-6.5,fy-20.5-gh,13,gh);
    ctx.fillStyle="rgba(210,225,238,"+(.10+lit*.12).toFixed(2)+")";ctx.fillRect(gx-5,fy-20-gh,3,gh);
    if(on)bGlow(gx,fy-30,20,col.join(","),.10);
  }
  /* центрифуга: барабан крутится, крышка со стеклом */
  const fxc=cx+8;
  bBox(fxc-13,fy-34,26,14,"rgba(36,45,56,.98)",lit,"rgba(140,160,180,.3)");
  ctx.strokeStyle="rgba("+BM_COOL+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(fxc,fy-27,7,0,TAU);ctx.stroke();
  const sp=on?G.t*.4:0;
  for(let i=0;i<3;i++){
    const a=sp+i*TAU/3;
    ctx.strokeStyle="rgba(200,220,235,"+(.2+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(fxc,fy-27);ctx.lineTo(fxc+Math.cos(a)*6,fy-27+Math.sin(a)*6);ctx.stroke();
  }
  /* голограмма над столом: проволочный образец медленно вращается */
  if(on){
    const hx=x0+w-38,hy=fy-40;
    ctx.save();ctx.globalCompositeOperation="lighter";
    const hg=ctx.createLinearGradient(0,hy+16,0,hy-16);
    hg.addColorStop(0,"rgba("+BM_COOL+",.16)");hg.addColorStop(1,"rgba("+BM_COOL+",0)");
    ctx.fillStyle=hg;ctx.beginPath();
    ctx.moveTo(hx-4,hy+18);ctx.lineTo(hx+4,hy+18);ctx.lineTo(hx+16,hy-14);ctx.lineTo(hx-16,hy-14);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba("+BM_COOL+",.55)";ctx.lineWidth=1;
    const rot=G.t*.02;
    for(let i=0;i<3;i++){
      const rr=10-i*2.5,sq=Math.abs(Math.cos(rot+i));
      ctx.beginPath();ctx.ellipse(hx,hy-2-i*3,rr,rr*(.25+sq*.5),0,0,TAU);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle="rgba("+BM_COOL+","+(.3+lit*.3).toFixed(2)+")";ctx.fillRect(hx-6,fy-22,12,2);
  }
  /* подставка с находкой: если в базе лежит артефакт, он здесь и стоит */
  const ax=x0+12;
  bBox(ax-7,fy-30,14,10,"rgba(30,38,48,.96)",lit,"rgba(0,0,0,.4)");
  const glow=.35+Math.sin(G.t*.03+seed)*.15;
  ctx.strokeStyle="rgba(200,170,255,"+((.35+lit*.4)*glow*2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(ax,fy-42);ctx.lineTo(ax+5,fy-35);ctx.lineTo(ax,fy-30);ctx.lineTo(ax-5,fy-35);
  ctx.closePath();ctx.stroke();
  bGlow(ax,fy-36,22,"190,160,255",.12*glow*2);
  bWorker(cx-18,fy,lit,true,G.t*.04+seed);
  bLamp(cx,y0+4,40,fy,"200,232,255",.30+lit*.35);
}
};
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
