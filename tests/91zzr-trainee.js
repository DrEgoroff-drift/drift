/* ══════════════ автотесты: стажёр (M163) ══════════════ */
TEST_SUITES.push(()=>suite("стажёр: заяц после блошинца, кресло, ступени по прыжкам, диплом, голос через год",()=>{
  resetWorld();
  G.trainee=null;G.seat=null;G.things=[];G.log=[];G.record=null;G.vega=null;
  let B=null;for(let x=-14;x<=14&&!B;x++)for(let y=-14;y<=14&&!B;y++){if(starAt(x,y)){const S=getSystem(x,y);if(S&&S.station&&S.station.stype==="bazaar")B=S;}}
  ok(!!B,"блошинец есть");
  G.sx=B.sx;G.sy=B.sy;G.sys=B;G.st=B.station;
  /* находка детерминирована местом: перебираем до первой, где он есть */
  let found=traineeFind();
  if(!found){for(let x=-20;x<=20&&!found;x++)for(let y=-20;y<=20&&!found;y++){if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station&&S.station.stype==="bazaar"){G.sx=x;G.sy=y;G.sys=S;G.st=S.station;found=traineeFind();}}}
  if(!found){ok(true,"ни на одном блошинце в радиусе 20 зайца нет — пропущено");return;}
  ok(traineeAboard(),"заяц на борту");
  ok(!!G.seat&&G.seat.name.indexOf("СТАЖЁР")===0,"кресло занято стажёром");
  eq(G.trainee.st,1,"первая ступень: трогает приборы");
  for(let i=0;i<5;i++)traineeJump();
  eq(G.trainee.st,2,"после пяти прыжков — читает карты");
  for(let i=0;i<10;i++)traineeJump();
  eq(G.trainee.st,3,"после пятнадцати — просится в рейс");
  /* Вега не сядет, пока он тут */
  G.home=homeInit();G.home.tier=7;G.home.sx=G.sx;G.home.sy=G.sy;G.wishDevice=1;vegaWish("love");
  ok(!vegaBoard(true),"Вега не садится, пока мальчишка в кресле");
  /* диплом на научной */
  let S=null;for(let x=-14;x<=14&&!S;x++)for(let y=-14;y<=14&&!S;y++){if(starAt(x,y)){const T=getSystem(x,y);if(T&&T.station&&T.station.stype==="sci")S=T;}}
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  ok(traineeDiplomaHere(),"диплом можно выдать");
  ok(traineeDiploma(),"выдан");
  ok(!traineeAboard()&&!G.seat,"ушёл, кресло пусто");
  ok(G.things.some(t=>t.ru.indexOf("Диплом")===0),"диплом на столе");
  G.log=[];G.t+=CEL_DAY*366;traineeTick();
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf(G.trainee.name)>=0),"через год — его голос в эфире");
  const s=snapshot();G.trainee=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(!!G.trainee&&G.trainee.st===4,"пережил сохранение");
  G.trainee=null;G.vega=null;G.seat=null;
}));
