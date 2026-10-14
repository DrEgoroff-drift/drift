/* Дрон летает и при частых тактах (0.493.5). Живой кадр зовёт tickDrones каждые 3 с, а круг
   дрона — от 25 с; догон «не дальше суток» двигал начало круга к прошлому такту (t0 := lastMs),
   и круг не заканчивался никогда — ни рейса, ни кредита. Нашла проба · экономика (M903). */
TEST_SUITES.push(()=>suite("дроны: рейсы идут при такте в три секунды",()=>{
  resetWorld();
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.mode="system";
  droneTarget="iron";G.droneInventory=1;
  const n0=G.drones.length;
  deployDrone();
  ok(G.drones.length===n0+1,"дрон размещён");
  const d=G.drones[G.drones.length-1],T=droneTripMs(d);
  ok(T>=25000&&T<=240000,"круг в пределах 25–240 с: "+(T/1000).toFixed(0));
  const cr0=G.credits;
  let secs=0;
  while(secs<T/1000*3+10){clockAdvance(3000);secs+=3;tickDrones();}
  ok(d.trips>=2,"за три круга при такте 3 с рейсов: "+d.trips);
  ok(G.credits>cr0,"дрон заработал: +"+(G.credits-cr0)+" кр");
  /* догон после суток простоя по-прежнему ограничен сутками */
  const tr1=d.trips;clockAdvance(3*24*3600*1000);tickDrones();
  ok(d.trips-tr1<=Math.ceil(24*3600*1000/T)+1,"за трое суток офлайна догнали не больше суток: +"+(d.trips-tr1)+" рейсов");
  G.drones.pop();G.droneInventory=0;droneTarget=null;
}));
