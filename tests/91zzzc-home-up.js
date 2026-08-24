/* Второй этаж дома (M178-9): проверяется устройство, а не картинка —
   верх появляется со ступенью «жилая часть», этажи не смешиваются, лестница
   и проём стоят друг над другом, и жильцы ходят каждый по своему этажу. */

function homeUpWorld(tier){
  resetWorld();
  G.home=homeInit();G.home.tier=tier;
  enterHomeIn();
}

TEST_SUITES.push(()=>suite("дом: верх появляется вместе с жилой частью",()=>{
  homeUpWorld(6);                       /* до жилой части */
  eq(hinHasUp(),false,"без жилой части верха нет");
  eq(hinUpRooms().length,0,"и комнат наверху нет");
  exitHomeIn();
  homeUpWorld(HOME_TIERS.length);       /* всё построено */
  eq(hinHasUp(),true,"с жилой частью верх есть");
  const U=hinUpRooms();
  eq(U.length,2,"наверху две комнаты");
  eq(U.map(r=>r.key).join(","),"loft,bed","светёлка и спальня");
  /* верхние комнаты стоят ровно над кабинетом и жилой частью */
  const G0=hinGroundRooms();
  eq(U[0].x,G0.find(r=>r.key==="study").x,"светёлка над кабинетом");
  eq(U[1].x,G0.find(r=>r.key==="living").x,"спальня над жилой частью");
  exitHomeIn();
}));

TEST_SUITES.push(()=>suite("дом: лестница и проём стоят друг над другом",()=>{
  homeUpWorld(HOME_TIERS.length);
  const sx=hinStairX(), hx=hinHoleX();
  ok(sx!=null&&hx!=null,"лестница и проём существуют");
  ok(Math.abs(sx-hx)<2,"проём ровно над маршем ("+Math.round(sx)+" против "+Math.round(hx)+")");
  /* подъём: подходим к лестнице и жмём ДЕЙСТВИЕ */
  const S=G.hin;
  S.x=sx;actEdge=true;updateHomeIn(1);actEdge=false;
  eq(S.up,1,"поднялись");
  const b=hinSpan();
  ok(S.x>=b.lo&&S.x<=b.hi,"стоим внутри верхней полосы");
  ok(hinRooms().every(r=>r.key==="loft"||r.key==="bed"),"hinRooms отдаёт верхний этаж");
  /* наверху нет выхода во двор: полоса не пускает к двери */
  ok(b.lo>26,"верхняя полоса начинается не у входной двери");
  /* спуск тем же жестом */
  S.x=hinHoleX();actEdge=true;updateHomeIn(1);actEdge=false;
  eq(S.up,0,"спустились");
  ok(hinRooms().some(r=>r.key==="corner"),"внизу снова первый этаж");
  exitHomeIn();
}));

TEST_SUITES.push(()=>suite("дом: каждый жилец ходит по своему этажу",()=>{
  homeUpWorld(HOME_TIERS.length);
  const S=G.hin;
  /* подкладываем жильцов на оба этажа руками: состав зависит от Веги и
     экипажа, а тест должен проверять правило, а не сюжет */
  S.folk=[
    {who:"mate",name:"ДОМОЧАДЕЦ",col:[196,168,132],up:0,home:"living",
     x:100,tx:100,pose:"stand",t:1e9,face:1,z:0},
    {who:"vega",name:"ВЕГА",col:[91,74,110],up:1,home:"loft",
     x:hinUpRooms()[0].x+40,tx:hinUpRooms()[0].x+40,pose:"sit",t:1e9,face:1,z:0}
  ];
  for(let i=0;i<600;i++)hinFolkTick(1);
  const up=S.folk[1], down=S.folk[0];
  const UB=hinUpBounds();
  ok(up.x>=UB.lo-60&&up.x<=UB.hi+60,"верхний жилец остался наверху ("+Math.round(up.x)+")");
  ok(down.x>=0&&down.x<=hinWidth(),"нижний — внизу");
  /* с разных этажей не расталкиваются: стоя в одной координате x */
  down.x=up.x;down.tx=up.x;down.t=1e9;down.pose="stand";
  const dx0=down.x;
  for(let i=0;i<60;i++)hinFolkTick(1);
  ok(Math.abs(down.x-dx0)<6,"жильцы разных этажей друг друга не толкают");
  exitHomeIn();
}));

TEST_SUITES.push(()=>suite("дом: наверху есть что рассмотреть",()=>{
  homeUpWorld(HOME_TIERS.length);
  const S=G.hin;
  S.up=1;
  const U=hinUpRooms();
  let found=0;
  for(const r of U)
    for(const t of (HIN_THINGS[r.key]||[]))
      if(hinNear(r.x+r.w*t.at))found++;
  ok(found>=5,"вещи верхних комнат достижимы ("+found+")");
  exitHomeIn();
}));
