/* ══════════════ Жестянка: смена, которую некому снять ══════════════
   Мир, выбранный до дна и брошенный: воздух кислый, руды нет, жить незачем.
   А хозяйское железо всё ещё работает — качает, мелет, считает и раз в столько-то
   передаёт в пустоту одну и ту же просьбу. Никого, кто бы её отменил, здесь нет.

   ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Это не посёлок (12t) и не вторая база (21a). У посёлка
   есть настроение, склонность и своя воля — он РЕШАЕТ, что поднять, и платит,
   когда захочет. Жестянка не решает ничего и не хочет ничего: загрузил — она
   работает, кончилось — встала. Ровно поэтому она и стоит в проходе раньше
   живой деревни: цикл «дай — получи» проще разучить на железе, где ошибка стоит
   груза, а не чужого голода.

   ПРАВИЛА ФАЙЛА:
   1. Просьба записана в МЕРАХ, которых больше нет. Тот, кто заводил наряд, не
      придёт его исправить, и перевод — работа игрока: отдал — счётчик щёлкнул.
      Машина не врёт и не торгуется, она просто считает по-своему.
   2. Кредитов Жестянка не платит никогда — только тем, что делает. И платит
      ровно столько, сколько наработала: ни настроения, ни доли, ни подарка.
   3. Живых на этой планете нет и не будет: где может жить посёлок (`SETTLE_ON`),
      Жестянки не бывает. Смена, которую некому снять, — про отсутствие людей.
   4. Лента — честный свидетель. Машина записывает ВРЕМЯ и ПЕЛЕНГ и не понимает
      ни того, ни другого: событию она даёт номер, а не имя. Время читается
      календарём (M107), пеленг ложится меткой на карту (12q), а что там было —
      игрок узнаёт сам или не узнаёт вовсе.
   5. Считается лениво, по прошедшему времени, с тем же потолком офлайна, что у
      посёлка и наёмников. Живой симуляции нет. */

const TIN_CAP=24*3600*1000;            // потолок офлайна
const TIN_EAT=.8;                      // сколько сырья съедает в минуту работы
const TIN_MAKE=.5;                     // сколько выдаёт в минуту
const TIN_BIN=140;                     // бункер не бездонный: больше не накопит
const TIN_LOG=3;                       // записей в ленте
/* где стоит железо: там, где выбрали породу и ушли. Пересечения с посёлком нет
   и быть не может (правило 3) */
const TIN_ON=["rocky","metal","volcanic","crystal","ruin"];
/* меры, которых больше нет. Число — сколько в мере ходовых единиц; ни одно не
   круглое нарочно: круглое читалось бы как подсказка */
const TIN_UNIT=[
  {ru:["бочка","бочки","бочек"],      per:14},
  {ru:["короб","короба","коробов"],   per:7},
  {ru:["ставка","ставки","ставок"],   per:23},
  {ru:["наряд","наряда","нарядов"],   per:31},
  {ru:["постав","постава","поставов"],per:19}
];
const TIN_FEED=["ice","organics","volatiles","isotopes","carbon"];
const TIN_MADE=["iron","silicon","titan","iridium","crystal"];

/* русское склонение при числе: «1 ставка, 2 ставки, 5 ставок» */
function tinPl(n,f){
  n=Math.abs(n|0);
  const d=n%10,dd=n%100;
  if(d===1&&dd!==11)return f[0];
  if(d>=2&&d<=4&&(dd<10||dd>=20))return f[1];
  return f[2];
}
function tinKeyOf(sx,sy){return sx+","+sy;}
function tinMap(){return (G.tin||(G.tin={}));}
function tinAt(sx,sy){return tinMap()[tinKeyOf(sx,sy)]||null;}
function tinHereRec(){return tinAt(G.sx,G.sy);}
/* ── есть ли она на этом мире ──
   Примерно каждый седьмой мир из выбранных типов, и никогда там, где может
   стоять деревня */
function tinCanLive(p){
  if(!p||!p.type||TIN_ON.indexOf(p.type)<0)return false;
  if(typeof settleCanLive==="function"&&settleCanLive(p))return false;
  return hashi(hashi(G.sx,G.sy,(p.idx|0)+0x71D),p.seed|0,11)%7===0;
}
/* планета системы, на которой стоит железо (одна на систему) */
function tinPlanet(sys){
  const ps=(sys&&sys.planets)||[];
  for(const p of ps)if(tinCanLive(p))return p;
  return null;
}
/* ── место ──
   Завод ставят на ровном: из восьми проб берём самую пологую площадку. Первый
   счёт брал точку как попало, и на склоне машина рассыпалась по рельефу —
   бункер оказывался в яме, лента висела в воздухе. Ровное место здесь не
   красота, а причина, по которой всё стоит на одной отметке. */
function tinSpotX(p,tr){
  if(!tinCanLive(p))return null;
  const r=rng(hashi(G.sx,G.sy,(p&&p.idx|0)+0x71D));
  const W2=(tr&&tr.W)||4000;
  let bx=W2/2,bs=1e9;
  for(let i=0;i<8;i++){
    const x=clamp(340+r()*Math.max(200,W2-680),200,W2-260);
    const g=(typeof groundAt==="function")?groundAt(tr,x):0;
    let s=0;
    for(const d of [-110,-60,60,130])s+=Math.abs(groundAt(tr,x+d)-g);
    if(s<bs){bs=s;bx=x;}
  }
  return bx;
}
/* ── наряд ──
   Что просят, в чём считают и сколько. Всё — чистая функция зерна: та же
   Жестянка просит то же самое, сколько бы игрок ни перезаходил. */
function tinAskOf(seed){
  const r=rng(hashi(seed,0x415C,5));
  const k=TIN_FEED[Math.floor(r()*TIN_FEED.length)];
  const U=TIN_UNIT[Math.floor(r()*TIN_UNIT.length)];
  /* цель — от шестидесяти до ста десяти единиц: один-два рейса, а не переезд.
     Само число в наряде выходит каким выйдет — оно и не должно быть круглым */
  const target=60+Math.floor(r()*50);
  const count=Math.max(2,Math.round(target/U.per));
  return {k,per:U.per,ru:U.ru,count,need:count*U.per,made:TIN_MADE[Math.floor(r()*TIN_MADE.length)]};
}
function tinMake(p){
  const key=tinKeyOf(G.sx,G.sy);
  const M=tinMap();
  if(M[key])return M[key];
  const seed=hashi(G.sx,G.sy,(p&&p.idx|0)+0x71DE);
  M[key]={seed,sx:G.sx,sy:G.sy,idx:(p&&p.idx|0),name:(p&&p.name)||"",
    fed:0,run:0,bin:0,seen:0,read:0,last:Date.now(),made:Date.now()};
  return M[key];
}
/* ── ход, считаемый лениво ──
   Работает, пока в бункере есть сырьё. Кончилось — встала и снова просит. */
function tinTick(T){
  if(!T)return null;
  const now=Date.now();
  const mins=Math.min(now-(T.last||now),TIN_CAP)/60000;
  T.last=now;
  if(mins<=0||!T.run)return T;
  const burn=Math.min(T.run,mins*TIN_EAT);
  T.run-=burn;
  T.bin=Math.min(TIN_BIN,(T.bin||0)+burn/TIN_EAT*TIN_MAKE);
  if(T.run<=.001){T.run=0;T.fed=0;}     // смена кончилась: наряд открыт заново
  return T;
}
/* ── загрузка ──
   Игрок отдаёт то, что просят, из трюма. Машина принимает по одной своей мере:
   недосыпанное лежит в приёмнике и ждёт следующего рейса. */
function tinFeed(T,n){
  T=tinTick(T);
  if(!T)return 0;
  const A=tinAskOf(T.seed);
  n=Math.min(n|0,G.cargo[A.k]|0,Math.max(0,A.need-(T.fed||0)));
  if(n<=0)return 0;
  G.cargo[A.k]-=n;
  T.fed=(T.fed||0)+n;
  if(T.fed>=A.need){
    /* наряд закрыт: смена началась. Работы ровно на то, что засыпали */
    T.run=A.need;
    T.fed=A.need;
    T.last=Date.now();
    logAdd("good","Жестянка приняла наряд и пошла: "+RES[A.made].ru.toLowerCase());
  }
  if(typeof saveGame==="function")saveGame(true);
  return n;
}
/* ── забрать ──
   Отдаёт всё, что успела, и ни единицей больше. Место в трюме — забота игрока. */
function tinTakeOut(T){
  T=tinTick(T);
  if(!T||(T.bin|0)<=0)return 0;
  const A=tinAskOf(T.seed);
  const n=Math.floor(T.bin);
  /* `addRes` возвращает СКОЛЬКО влезло, а не «получилось ли»: при полном трюме
     это ноль или даже минус. Забранное списывается по факту, остальное остаётся
     лежать в бункере — машине спешить некуда */
  const got=Math.max(0,addRes(A.made,n)|0);
  if(got>0)T.bin-=got;
  if(typeof saveGame==="function")saveGame(true);
  return got;
}
/* ── куда показывает пеленг ──
   Первая звезда на луче: пеленг — направление, а не адрес, и метка ставится
   там, куда он упирается. */
function tinMarkOf(T,e){
  const a=e.hdg*Math.PI/180;
  for(let d=3;d<=11;d++){
    const sx=T.sx+Math.round(Math.cos(a)*d), sy=T.sy+Math.round(Math.sin(a)*d);
    if(typeof starAt==="function"&&starAt(sx,sy))return {sx,sy};
  }
  return null;
}
/* ── что было в небе в те сутки ──
   Календарь считается на любой момент, а не только на сейчас: машина назвала
   время, небо отвечает, что тогда происходило. Пусто — значит, ничего. */
function tinSkyOf(day){
  if(typeof celestAt!=="function")return "";
  const C=celestAt(G.sys,day*CEL_DAY,null);
  const out=[];
  if(C.conj)out.push("ПАРАД "+C.conj.n+" ТЕЛ");
  if(C.comet)out.push("КОМЕТА");
  return out.join(" · ");
}
/* ── снять ленту ──
   Одна запись за раз, по порядку. Каждая — место свидетеля: кусок отчёта
   (12q) плюс метка по пеленгу. */
function tinStrip(T){
  T=tinTick(T);
  if(!T)return null;
  const list=tinEntries(T);
  if(T.read>=list.length)return null;
  const e=list[T.read];
  T.read++;
  const M=tinMarkOf(T,e);
  if(M&&typeof loreMarks==="function")loreMarks().push({sx:M.sx,sy:M.sy,id:"tin:"+T.sx+":"+T.sy+":"+e.i});
  const R=(typeof loreTake==="function")?loreTake("tin:"+T.sx+":"+T.sy+":"+e.i):null;
  const sky=tinSkyOf(e.day);
  tell("tech","Лента Жестянки · запись "+(e.i+1)+" из "+list.length,
    "ЗАПИСЬ "+(e.i+1)+"\nСУТКИ "+e.day+" · ПЕЛЕНГ "+e.hdg+"°\nСОБЫТИЕ "+e.code+
    (sky?"\n\nнебо тех суток: "+sky:"")+
    (M?"\n\nпеленг упирается в сектор "+M.sx+":"+M.sy+" — метка на карте":"")+
    (R?"":"\n\nбольше эта лента ничего не помнит"));
  logAdd("tech","Лента: сутки "+e.day+" · пеленг "+e.hdg+"°");
  if(typeof saveGame==="function")saveGame(true);
  return e;
}
/* записи ленты: чистая функция зерна и ничего больше */
function tinEntries(T){
  const out=[];
  for(let i=0;i<TIN_LOG;i++){
    const r=rng(hashi(T.seed,i*13+0x1EA,9));
    const back=40+Math.floor(r()*900);
    out.push({i,day:Math.max(0,celDay()-back),hdg:Math.floor(r()*360),
              code:(1000+Math.floor(r()*8999))+""});
  }
  return out;
}
/* ── строка о состоянии ── одна, короткая, без уговоров */
function tinLine(T){
  const A=tinAskOf(T.seed);
  if(T.run>0)return "СМЕНА ИДЁТ · В БУНКЕРЕ "+Math.floor(T.bin)+" "+RES[A.made].ru.toUpperCase();
  const got=Math.floor((T.fed||0)/A.per);
  return "НАРЯД: "+RES[A.k].ru.toUpperCase()+" · "+A.count+" "+tinPl(A.count,A.ru).toUpperCase()+
         " · ПРИНЯТО "+got+(got>0?(" ("+A.per+" ЗА "+tinPl(1,A.ru).toUpperCase()+")"):"");
}
/* ── передача ──
   Слышно с прибытия: та же просьба, тем же голосом, в пустоту. Это единственное,
   что Жестянка делает сама. */
function tinSignal(){
  const p=tinPlanet(G.sys);
  if(!p)return;
  const T=tinAt(G.sx,G.sy);
  if(T&&T.run>0)return;                  // работающая смена не просит
  const A=tinAskOf(hashi(G.sx,G.sy,(p.idx|0)+0x71DE));
  logAdd("dim","Передача с "+p.name+": «"+RES[A.k].ru.toUpperCase()+" · "+A.count+" "+
    tinPl(A.count,A.ru).toUpperCase()+" · СМЕНА ПРОДОЛЖАЕТСЯ»");
}
/* ── как она выглядит ──
   Не дом и не корабль: приёмная воронка, барабан, труба, лента и бункер выдачи.
   Всё стоит на ОДНОЙ отметке — на плите, врезанной в грунт: завод ставят на
   ровном, и первый заход, где каждая часть садилась на свою высоту рельефа,
   рассыпал машину по склону и утопил бункер в яме. Печатник стоит в стороне:
   память машины — не та же вещь, что машина, и ходят к ним порознь. */
function tinDraw(T,tr,camx,camy,p){
  const bx=tinSpotX(p,tr);if(bx==null)return;
  const sx=bx-camx;
  if(sx<-360||sx>W+360)return;
  const y0=groundAt(tr,bx)-camy;                  // отметка плиты: она одна на всё
  const run=!!(T&&T.run>0);
  const pal=p.T.pal;
  const iron="rgb("+pal[2].map(v=>Math.round(v*.44+30)).join(",")+")";
  const dark="rgb("+pal[3].map(v=>Math.round(v*.28+10)).join(",")+")";
  const lite="rgb("+pal[1].map(v=>Math.round(v*.52+44)).join(",")+")";
  const edge="rgba(226,236,240,.30)";
  const box=(x,y,w,h,fill)=>{
    ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  };
  /* ── плита ── врезана в склон: слева и справа она уходит в грунт, и по этому
     срезу глаз читает, что площадку выравнивали */
  /* Плита не доска на весу: под ней насыпь до самой земли. Первый заход рисовал
     полосу по отметке, грунт из-под неё уходил вниз — и завод висел в воздухе */
  ctx.fillStyle=dark;
  ctx.beginPath();
  ctx.moveTo(sx-104,y0);ctx.lineTo(sx+104,y0);
  for(let x=104;x>=-104;x-=8)ctx.lineTo(sx+x,Math.max(y0+7,groundAt(tr,bx+x)-camy+1));
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(226,236,240,.16)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(sx-104,y0+.5);ctx.lineTo(sx+104,y0+.5);ctx.stroke();
  ctx.fillStyle="rgba(0,0,0,.36)";
  ctx.beginPath();ctx.ellipse(sx,y0+6,104,5,0,0,TAU);ctx.fill();
  /* ── приёмная воронка ── то, во что игрок сыплет: четыре ноги и раструб */
  const hx=sx-68;
  ctx.strokeStyle=dark;ctx.lineWidth=3;
  for(const dx of [-15,-6,6,15]){
    ctx.beginPath();ctx.moveTo(hx+dx,y0);ctx.lineTo(hx+dx*.55,y0-26);ctx.stroke();
  }
  ctx.fillStyle=iron;
  ctx.beginPath();
  ctx.moveTo(hx-23,y0-56);ctx.lineTo(hx+23,y0-56);
  ctx.lineTo(hx+9,y0-26);ctx.lineTo(hx-9,y0-26);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.stroke();
  /* сколько наряда уже в приёмнике — видно на самой машине, а не только в
     подсказке: пересчёт в мёртвые меры и так работа игрока, прятать от него
     ещё и уровень было бы жадностью */
  if(T&&T.fed>0){
    const A0=tinAskOf(T.seed), f=clamp(T.fed/A0.need,0,1);
    const yTop=y0-26-30*f;
    ctx.fillStyle=RES[A0.k].col;ctx.globalAlpha=.55;
    ctx.beginPath();
    const wTop=9+14*f;
    ctx.moveTo(hx-wTop,yTop);ctx.lineTo(hx+wTop,yTop);
    ctx.lineTo(hx+8,y0-27);ctx.lineTo(hx-8,y0-27);
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  }
  ctx.fillStyle=lite;ctx.fillRect(hx-23,y0-58,46,3);       // кромка раструба
  /* полосы опасности по раструбу: единственное место, куда человек лезет руками */
  ctx.fillStyle="rgba(242,178,92,.5)";
  for(let i=0;i<4;i++)ctx.fillRect(hx-20+i*11,y0-53,5,3);
  /* ── барабан ── лежачий цилиндр с обручами; когда идёт смена, обручи ползут */
  /* завод не один на все миры (хвост M119): длина барабана, высота трубы и
     число обручей — от семени планеты. Форма та же, пропорции свои */
  const tv=hashi(p.seed,0x71A,2), dw=64+((tv>>>3)&3)*12, ch=34+((tv>>>1)&3)*9, nh=3+((tv>>>5)&3);
  const dxm=sx-4;
  box(dxm-dw/2,y0-62,dw,34,iron);
  /* обручи крутятся: кроме тёмного ребра у каждого — светлый блик сверху и
     заклёпка, которая ползёт вместе с ним. Ребро одно не читалось вращением */
  for(let i=0;i<nh;i++){
    const a=run?((G.t*.9+i*360/nh)%360)/360:i/nh;
    const px=dxm-dw/2+((a*dw)%dw);
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=2.4;
    ctx.beginPath();ctx.moveTo(px,y0-62);ctx.lineTo(px-5,y0-28);ctx.stroke();
    ctx.strokeStyle="rgba(226,236,240,.22)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px+1.8,y0-62);ctx.lineTo(px-3.2,y0-28);ctx.stroke();
    ctx.fillStyle="rgba(226,236,240,.35)";ctx.fillRect(px-1.4,y0-49,2.2,2.2);
  }
  if(run){                                                 // и шов по телу ползёт
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1;
    for(let i=0;i<3;i++){
      const a=((G.t*.9+i*120)%360)/360, px=dxm-dw/2+((a*dw)%dw);
      ctx.beginPath();ctx.moveTo(px+8,y0-58);ctx.lineTo(px+2,y0-32);ctx.stroke();
    }
  }
  ctx.fillStyle=lite;ctx.fillRect(dxm-dw/2,y0-64,dw,3);
  box(dxm-dw/2-6,y0-28,dw+12,16,dark);                     // станина
  /* ── труба ── дым только когда идёт смена: остывшая труба ничего не выдаёт */
  box(dxm+22,y0-60-ch,12,ch,iron);
  ctx.fillStyle=dark;ctx.fillRect(dxm+19,y0-64-ch,18,5);
  /* Дым — рваный, а не цепочка кругов: ровные шарики в столбик читались
     пузырями. Клуб растёт, кренится по ветру и расплывается по горизонтали */
  if(run)for(let s=0;s<4;s++){
    const t=((G.t*.7+s*40)%160)/160;
    const rr=4+t*16;
    ctx.fillStyle="rgba(200,208,214,"+((1-t)*(1-t)*.22).toFixed(3)+")";
    ctx.beginPath();
    ctx.ellipse(dxm+28+(WIND||0)*t*22+Math.sin(t*4+s)*5,y0-66-ch-t*58,
                rr*1.35,rr*.8,t*.5,0,TAU);
    ctx.fill();
  }
  /* ── лента ── наклонная полоса от барабана к бункеру, на двух стойках */
  const ox=sx+76;
  /* Лента — короб, а не проволока: полоса в семь пикселей с тёмным исподом и
     двумя стойками. Ниткой она читалась растяжкой, а не транспортёром */
  ctx.strokeStyle=dark;ctx.lineWidth=3;
  for(const px2 of [sx+40,sx+58]){
    ctx.beginPath();ctx.moveTo(px2,y0);ctx.lineTo(px2,y0-44);ctx.stroke();
  }
  ctx.strokeStyle=iron;ctx.lineWidth=8;ctx.lineCap="butt";
  ctx.beginPath();ctx.moveTo(dxm+38,y0-40);ctx.lineTo(ox-16,y0-54);ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(dxm+38,y0-36.5);ctx.lineTo(ox-16,y0-50.5);ctx.stroke();
  ctx.strokeStyle=edge;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(dxm+38,y0-44);ctx.lineTo(ox-16,y0-58);ctx.stroke();
  /* ── бункер выдачи ── короб с окном: сколько в нём лежит, видно снаружи */
  box(ox-20,y0-52,40,52,iron);
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(ox-15,y0-46,30,40);
  if(T&&T.bin>0){
    const h=Math.min(38,3+T.bin/TIN_BIN*38);
    ctx.fillStyle=RES[tinAskOf(T.seed).made].col;
    ctx.globalAlpha=.8;ctx.fillRect(ox-15,y0-7-h,30,h);ctx.globalAlpha=1;
  }
  ctx.fillStyle=dark;ctx.fillRect(ox-24,y0-6,48,6);         // лоток под выдачу
  /* ── лампа ── мигает всегда: её никто не выключал, и это единственное, что
     здесь происходит само по себе */
  const blink=(G.t%140)<70;
  ctx.fillStyle=blink?"rgba(255,196,92,.95)":"rgba(255,196,92,.18)";
  ctx.beginPath();ctx.arc(dxm-34,y0-70,3.4,0,TAU);ctx.fill();
  if(blink){
    ctx.fillStyle="rgba(255,196,92,.12)";
    ctx.beginPath();ctx.arc(dxm-34,y0-70,9,0,TAU);ctx.fill();
  }
  /* ── печатник ── столбик с козырьком и лентой, свисающей до земли */
  const px=sx+150, py=groundAt(tr,bx+150)-camy;
  box(px-9,py-44,18,44,iron);
  ctx.fillStyle=dark;ctx.fillRect(px-13,py-52,26,9);
  ctx.fillStyle="rgba(232,240,244,.8)";
  ctx.fillRect(px-3.5,py-43,7,30+Math.sin(G.t*.02)*2);
  ctx.fillStyle="rgba(226,206,160,.75)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("ЖЕСТЯНКА",sx,y0-120);
  ctx.fillStyle="rgba(147,166,180,.65)";
  ctx.fillText("ЛЕНТА",px,py-60);
}
