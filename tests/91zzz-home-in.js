/* Дом как место (M170): стоит на своей планете, в него входят ногами, по нему
   ходят, в нём живут люди. Проверяем ровно это, а не картинку. */
TEST_SUITES.push(()=>suite("дом: стоит на своей планете и открывает дверь",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=3;G.home.sx=G.sx;G.home.sy=G.sy;
  const p=homePlanet();
  ok(!!p,"планета дома найдена");
  ok(p.type!=="gas","дом не на газовом гиганте");
  ok(homeHereP(p),"мы на планете дома");
  /* в другой системе дома нет */
  const sx0=G.sx;G.sx=sx0+3;
  ok(!homeHereP(p),"в чужой системе дома нет");
  G.sx=sx0;
  landOnTestPlanet();
  const S=G.surf,tr=S.tr;
  const spot=homeSpotX(S.p,tr);
  if(homeHereP(S.p)){
    ok(spot!=null,"место дома посчитано");
    ok(Math.abs(spot-tr.padX)>=500,"дом не на посадочной площадке");
    eq(Math.round(spot),Math.round(homeSpotX(S.p,tr)),"место не дрожит между вызовами");
    const dx=homeDoorX(tr,S.p);
    ok(dx!=null&&Math.abs(dx-spot)<60,"дверь у дома, а не в стороне");
  }else ok(true,"тестовая планета не та (дом на другой) — проверка пропущена");
}));

TEST_SUITES.push(()=>suite("дом изнутри: ход, комнаты, вещи, жильцы",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
  landOnTestPlanet();
  enterHomeIn();
  eq(G.mode,"homein","вошли в дом");
  ok(!!G.hin,"состояние дома есть");
  const R=hinRooms();
  eq(R.length,8,"восемь ступеней — восемь комнат");
  ok(hinWidth()>800,"дом шире экрана: по нему идут, а не смотрят целиком");
  /* комнаты идут подряд, без дыр и нахлёстов */
  for(let i=1;i<R.length;i++)eq(R[i].x,R[i-1].x+R[i-1].w,"комнаты стыкуются: "+R[i].key);
  /* ход влево-вправо */
  const x0=G.hin.x;
  keys.right=true;steps(30,updateHomeIn);keys.right=false;
  ok(G.hin.x>x0+10,"вправо дошли: "+Math.round(x0)+" → "+Math.round(G.hin.x));
  keys.left=true;steps(60,updateHomeIn);keys.left=false;
  ok(G.hin.x<x0,"и влево тоже");
  /* за стены не выходим */
  keys.left=true;steps(600,updateHomeIn);keys.left=false;
  ok(G.hin.x>=10,"в левую стену не ушли");
  keys.right=true;steps(900,updateHomeIn);keys.right=false;
  ok(G.hin.x<=hinWidth()-10,"в правую стену не ушли");
  /* вещи: у каждой комнаты есть к чему подойти, и подходить надо близко */
  for(const r of R){
    const list=HIN_THINGS[r.key]||[];
    ok(list.length>0,"в комнате «"+r.ru+"» есть на что посмотреть");
    if(list.length){
      const tx=r.x+r.w*list[0].at;
      ok(!!hinNear(tx),"вплотную вещь находится: "+r.key);
      /* отойдя, ловим либо пустоту, либо УЖЕ ДРУГУЮ вещь: в тесной комнате
         две вещи стоят в шаге друг от друга, и это не ошибка */
      const far=hinNear(tx+60);
      ok(!far||far.ru!==list[0].ru,"за шаг от неё — не она: "+r.key);
    }
  }
  /* жильцы живут: ходят и меняют дела */
  G.hin.folk=[{who:"mate",name:"ТЁТКА",col:[196,168,132],x:300,tx:900,pose:"walk",t:400,face:1,home:"living"}];
  const fx=G.hin.folk[0].x;
  steps(120,hinFolkTick);
  ok(G.hin.folk[0].x>fx+20,"жилец идёт к своей точке");
  /* рассматривание: подошли, нажали, строка появилась и гаснет */
  const r0=R[0],t0=HIN_THINGS[r0.key][0];
  G.hin.x=r0.x+r0.w*t0.at;
  G.hin.folk=[];
  actEdge=true;updateHomeIn(1);actEdge=false;
  ok(!!G.hin.look,"вещь рассмотрена");
  eq(G.hin.look.ru,t0.ru,"именно та вещь");
  steps(500,updateHomeIn);
  ok(!G.hin.look,"строка внимания гаснет сама");
  /* выход */
  exitHomeIn();
  eq(G.mode,"surface","вышли во двор");
  eq(G.hin,null,"состояние дома отпущено");
}));

TEST_SUITES.push(()=>suite("дом: чего не построено — того нет",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=2;G.home.sx=G.sx;G.home.sy=G.sy;
  landOnTestPlanet();
  enterHomeIn();
  eq(hinRooms().length,2,"две ступени — две комнаты");
  ok(!homeHas("garage"),"гаража нет");
  ok(!hinRooms().some(r=>r.key==="garage"),"и комнаты гаража нет");
  const w2=hinWidth();
  exitHomeIn();
  G.home.tier=4;
  enterHomeIn();
  ok(hinWidth()>w2,"дом вырос вместе со ступенями");
  ok(hinRooms().some(r=>r.key==="garage"),"гараж появился");
  exitHomeIn();
}));
