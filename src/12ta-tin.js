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
  if(typeof planIsCore==="function"&&planIsCore(p))return true;   /* комбинат (11r) */
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
    fed:0,run:0,bin:0,seen:0,read:0,last:now(),made:now()};
  return M[key];
}
/* ── ход, считаемый лениво ──
   Работает, пока в бункере есть сырьё. Кончилось — встала и снова просит. */
function tinTick(T){
  if(!T)return null;
  if(typeof planEndless==="function")planEndless(T);   /* комбинат не останавливается (11r) */
  const now=clockNow();
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
  if(typeof tinClosed==="function"&&tinClosed())return 0;   /* закрыта (M158) */
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
    T.last=now();
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
  if(typeof planTook==="function")planTook(T,got);   /* изделие комбината (11r) */
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
  if(typeof tinClosed==="function"&&tinClosed())return "ЗАКРЫТА · ПОСЛЕДНИЙ РЕЙС УШЁЛ · ЖЕЛЕЗО ВСТАЛО";
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
  if(typeof tinClosed==="function"&&tinClosed())return;   /* закрыта (M158): железо молчит */
  const T=tinAt(G.sx,G.sy);
  if(T&&T.run>0)return;                  // работающая смена не просит
  const A=tinAskOf(hashi(G.sx,G.sy,(p.idx|0)+0x71DE));
  logAdd("dim","Передача с "+p.name+": «"+RES[A.k].ru.toUpperCase()+" · "+A.count+" "+
    tinPl(A.count,A.ru).toUpperCase()+" · СМЕНА ПРОДОЛЖАЕТСЯ»");
}
