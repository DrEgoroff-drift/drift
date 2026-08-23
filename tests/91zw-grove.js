/* ══════════════ роща: сходится без тяги, отпрядывает от тяги, помнит корпус, не бьёт ══════════════ */
TEST_SUITES.push(()=>suite("роща: язык — тяга, урона нет, выстрел и срез помнятся навсегда",()=>{
  resetWorld();
  const at=regionOfTheme("grove");ok(!!at,"область рощи расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"mass","прибор — масс-детектор");
  const gs=groveSys(R);ok(!!gs,"в области есть система с поясом");
  if(!gs)return;
  G.sx=gs.sx;G.sy=gs.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(groveDepthHere(),2,"мы у рощи");
  enterBelt();
  const b=G.belt;
  ok(b.grove&&b.grove.length>=15,"роща — два десятка наростов ("+b.grove.length+")");
  eq(G.grove.turn,1,"визит сосчитан");
  ok(b.grove.every(a=>a.res==="xeno"),"нарост — ксенобиом");
  const dist=a=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  const a=b.grove[0];const d0=dist(a);
  for(const k in keys)keys[k]=false;
  for(let i=0;i<30;i++)groveTick(b,1);
  ok(dist(a)<d0,"без тяги роща сходится ("+d0.toFixed(0)+" → "+dist(a).toFixed(0)+")");
  keys.thrust=true;G.fuel=50;const d1=dist(a);
  for(let i=0;i<30;i++)groveTick(b,1);
  ok(dist(a)>d1,"на тяге отпрядывает");
  keys.thrust=false;
  /* ближе 150 не подходит */
  a.x=b.x+200;a.y=b.y;a.z=b.z;for(let i=0;i<400;i++)groveTick(b,1);
  ok(dist(a)-a.r>=149,"держит дистанцию ("+(dist(a)-a.r).toFixed(0)+")");
  /* столкновение с наростом не бьёт корпус */
  a.x=b.x+a.r+4;a.y=b.y;a.z=b.z;G.hull=100;updateBelt(1);eq(G.hull,100,"урона от рощи нет");
  /* второй визит — сходится быстрее */
  const a2=b.grove[1];a2.x=b.x+800;a2.y=b.y;a2.z=b.z;
  for(let i=0;i<10;i++)groveTick(b,1);const v1=800-dist(a2);
  G.grove.turn=4;a2.x=b.x+800;for(let i=0;i<10;i++)groveTick(b,1);const v2=800-dist(a2);
  ok(v2>v1,"помнит корпус: в четвёртый раз идёт быстрее ("+v1.toFixed(1)+" → "+v2.toFixed(1)+")");
  G.grove.turn=1;
  /* срез резаком: груз стоящий, роща смыкается навсегда */
  G.cargo.xeno=0;const n0=b.grove.length;
  killRock(b,b.grove[2],1.2);
  eq(G.cargo.xeno,6,"срез даёт шесть ксенобиома");eq(G.grove.cut,1,"и роща это запомнила");
  eq(b.grove.length,n0-1,"срезанный выбыл из рощи");
  keys.thrust=true;const a3=b.grove[0];a3.x=b.x+600;a3.y=b.y;a3.z=b.z;
  for(let i=0;i<20;i++)groveTick(b,1);ok(dist(a3)<600,"после среза сходится даже на тяге");
  keys.thrust=false;
  /* выстрел: расступается навсегда */
  G.grove.cut=0;killRock(b,b.grove[0],3.2);eq(G.grove.shot,1,"выстрел запомнен");
  const a4=b.grove[0];a4.x=b.x+300;a4.y=b.y;a4.z=b.z;for(let i=0;i<20;i++)groveTick(b,1);
  ok(dist(a4)>300,"после выстрела только уходит");
  let okDraw=true;try{drawBelt();}catch(e){okDraw=false;}ok(okDraw,"пояс с рощей рисуется");
  exitBelt();
  const s=snapshot();applySave(s);eq(G.grove.shot,1,"память переживает сейв");   /* сейв гасит пояс — поэтому после выхода */
  /* дома рощи нет */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);eq(groveDepthHere(),0,"дома области нет");
}));
