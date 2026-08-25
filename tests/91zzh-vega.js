/* ══════════════ автотесты: Вега (M153) ══════════════ */
function vegaTestHome(){
  /* дом с жилой частью в текущей системе */
  G.home=homeInit();G.home.tier=7;G.home.turn=1200000;G.home.sx=G.sx;G.home.sy=G.sy;
  G.vega=null;G.wishDevice=0;G.things=[];G.seat=null;G.log=[];
}
function vegaTestBazaar(){
  for(let x=-14;x<=14;x++)for(let y=-14;y<=14;y++){
    if(!starAt(x,y))continue;const S=getSystem(x,y);
    if(S&&S.station&&S.station.stype==="bazaar")return S;
  }
  return null;
}
TEST_SUITES.push(()=>suite("Вега: прибор продаётся только с жилой частью, три желания — все она",()=>{
  resetWorld();vegaTestHome();
  const B=vegaTestBazaar();ok(!!B,"блошинец в радиусе 14 есть");
  G.home.tier=3;
  ok(!vegaDeviceOffered(B),"без жилой части деда с прибором нет");
  G.home.tier=7;
  ok(vegaDeviceOffered(B),"с жилой частью — есть");
  G.credits=100;
  ok(vegaDeviceBuy(B),"куплен за 40");
  eq(G.credits,60,"деньги ушли");
  ok(G.things.some(t=>t.k==="wish"),"прибор лежит на столе");
  ok(!vegaDeviceOffered(B),"второй не продают");
  for(const W of VEGA_WISHES){
    G.vega=null;G.wishDevice=1;
    ok(vegaWish(W.id),"нажали: "+W.ru);
    ok(vegaHas()&&G.vega.stage===1,"и это Вега, акт 1 — при любом желании");
  }
  ok(!vegaWish("love"),"второй раз не нажимается");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf("Вега")===0),"её первая реплика — в ЛЮДИ");
  eq(homeMateKind(),null,"домочадец умолк: Устя уехала к сестре");
}));

TEST_SUITES.push(()=>suite("Вега: выгнать нельзя ни на одной стадии, отказы не повторяются",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("wait");
  const seen=new Set();
  for(let i=0;i<30;i++){const l=vegaEvict();ok(!seen.has(l),"отказ "+(i+1)+" новый: "+l);seen.add(l);}
  ok(vegaHas(),"она на месте после тридцати попыток");
  ok(G.vega.att>=30,"привязанность выросла: "+G.vega.att);
  for(const st of [2,3,4]){G.vega.stage=st;vegaEvict();ok(vegaHas(),"стадия "+st+": всё ещё тут");}
}));

TEST_SUITES.push(()=>suite("Вега: дни вне дома — звонки, эфир, разбитое; дома — чинит",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("alone");
  const V=G.vega;
  /* улетели: другой сектор */
  G.sx=G.home.sx+3;G.sy=G.home.sy;G.mode="system";G.radioF=.2;
  G.log=[];
  for(let i=0;i<9;i++){G.t+=CEL_DAY;vegaDayTick();}
  eq(V.away,9,"девять дней вне дома");
  ok(V.stage>=2,"стадия одержимости");
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf("Вега:")===0),"звонки в ЭФИРЕ");
  ok(V.broken.length>=1,"что-то разбито: "+V.broken.join(", "));
  ok(V.att>0,"без ответа привязанность растёт: "+V.att.toFixed(1));
  ok(vegaBroken(V.broken[0]),"витрина/дом помнят разбитое");
  /* вернулись домой на два дня — чинит */
  G.sx=G.home.sx;G.sy=G.home.sy;G.mode="dock";
  const nb=V.broken.length;
  G.t+=CEL_DAY;vegaDayTick();G.t+=CEL_DAY;vegaDayTick();
  ok(V.broken.length<nb,"за лишний день дома что-то починено");
}));

TEST_SUITES.push(()=>suite("Вега: зеркало на десятый день, запуск из дома откладывается раз в день",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("love");
  const V=G.vega;V.stage=2;
  G.sx=G.home.sx+2;G.sy=G.home.sy;G.mode="system";
  G.t+=CEL_DAY*11;vegaDayTick();
  eq(V.stage,3,"второй прибор на столе — зеркало");
  ok(G.things.some(t=>t.k==="wish"&&t.ru.indexOf("Второй")===0),"и он лежит на столе");
  G.sx=G.home.sx;G.sy=G.home.sy;G.mode="dock";
  ok(vegaLaunchHold(),"первый запуск из дома отложен");
  ok(!vegaLaunchHold(),"второй в тот же день — нет");
}));

TEST_SUITES.push(()=>suite("Вега: на борту — кресло, чемодан, подарок, обида, укачивание",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("love");
  const cargo0=stat().cargoMax;
  ok(vegaBoard(true),"взяли на борт");
  ok(!!G.seat&&G.seat.name==="ВЕГА","кресло на пульте занято");
  eq(stat().cargoMax,cargo0-1,"чемодан занял слот трюма");
  G.log=[];
  vegaSeatAct();
  ok(G.log.some(x=>x.k==="talk"),"клик по креслу — реплика в ЛЮДИ");
  G.cargo.volatiles=1;G.vega.att=3;
  vegaSeatAct();
  eq(G.cargo.volatiles,0,"редкость подарена");
  eq(G.vega.att,2,"привязанность на единицу меньше");
  vegaOffend("проверка");
  ok(vegaOffended(),"обиделась");
  eq(vegaMoraleMul(),1,"в обиде бонуса морали нет");
  G.vega.offend=-1;
  G.log=[];for(let i=0;i<5;i++)vegaJump();
  ok(G.log.some(x=>x.s.indexOf("Вега")===0),"после третьего прыжка — укачивает");
  ok(vegaBoard(false),"оставили дома");
  eq(G.seat,null,"кресло пусто");
  eq(stat().cargoMax,cargo0,"слот вернулся");
}));

TEST_SUITES.push(()=>suite("Вега: семь дней дома — свободна, живёт дальше, второй попугай",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("wait");
  const V=G.vega;V.stage=2;V.att=12;V.broken=["кружка в кабинете"];
  G.sx=G.home.sx;G.sy=G.home.sy;G.mode="dock";
  for(let i=0;i<8;i++){G.t+=CEL_DAY;vegaDayTick();}
  eq(V.stage,4,"свободна");
  eq(V.att,0,"привязанность снята");
  ok(vegaHas(),"но живёт у вас");
  eq(V.parrot2,1,"у неё свой попугай");
  vegaEvict();ok(vegaHas(),"выгнать по-прежнему нельзя");
  G.home.tier=8;ok(homeMateKind()!==null,"домочадец снова может говорить на новой ступени");
}));

TEST_SUITES.push(()=>suite("Вега: переживает сохранение и пересборку дома",()=>{
  resetWorld();vegaTestHome();G.wishDevice=1;vegaWish("love");
  G.vega.broken=["лампа гаража"];G.vega.evict=4;vegaBoard(true);
  const s=snapshot();
  G.vega=null;G.seat=null;
  applySave(JSON.parse(JSON.stringify(s)));
  ok(vegaHas(),"Вега вернулась из сохранения");
  eq(G.vega.evict,4,"с попытками выгнать");
  eq(G.vega.broken[0],"лампа гаража","и с разбитым");
  conT=0;vegaTick(1);
  ok(!!G.seat,"кресло восстановлено");
  /* дом пересобран — она на месте */
  G.home=homeInit();G.home.tier=7;G.home.sx=G.sx;G.home.sy=G.sy;
  ok(vegaHas(),"дом пересобран — Вега на месте");
  G.vega=null;G.seat=null;
}));

/* ── руда — ссора, и слова дома домашние (25.08.2026) ──
   Две реплики Веги были написаны и не звучали ни разу: `VEGA_GIFT_BAD` (в коде
   не было ветки, хотя комментарий её обещал) и `VEGA_DREAM` (дома она говорила
   набором С БОРТА — «летаешь как баржа» в собственной кухне). */
TEST_SUITES.push(()=>suite("Вега: руда обижает, дома говорит домашнее",()=>{
  resetWorld();
  G.vega={stage:2,day0:celDay(),att:0,away:0,homeDays:0,broken:[],evict:0,aboard:1,
          mood:1,offend:-1,out:{},parrot2:0,lastDay:celDay(),calls:0,wish:"love",said:0};
  /* в трюме только руда — подарок оборачивается ссорой */
  for(const k in G.cargo)delete G.cargo[k];
  const ore=RES_KEYS.find(k=>!RES[k].rare);
  G.cargo[ore]=3;
  ok(!vegaOffended(),"до подарка не в обиде");
  vegaSeatAct();
  ok(vegaOffended(),"подарили руду — обиделась");
  eq(G.cargo[ore],3,"и руду не взяла");
  /* редкость по-прежнему принимается и мирит */
  G.vega.offend=-1;
  const rare=RARE_RES[0];
  G.cargo[rare]=1;
  vegaSeatAct();
  eq(G.cargo[rare]|0,0,"редкость приняла");
  ok(!vegaOffended(),"и не в обиде");
  /* дома — свои слова, не бортовые */
  ok(VEGA_DREAM.length>0,"домашние реплики есть");
  const home=VEGA_DREAM.join("|"), aboard=VEGA_ABOARD.join("|");
  ok(VEGA_DREAM.every(l=>aboard.indexOf(l)<0),"и это не тот же набор, что на борту");
  ok(home.indexOf("баржа")<0,"дома про баржу не говорят");
  G.vega=null;G.seat=null;
}));
