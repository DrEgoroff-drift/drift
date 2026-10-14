/* Касание камня в поясе: урон от скорости сближения, один раз на касание, потолок 20.
   Было: sp2*5+2 каждый кадр в 12 ед. от камня — корпус уходил за доли секунды. */
TEST_SUITES.push(()=>suite("пояс: урон касания от скорости, не от близости",()=>{
  resetWorld();
  ok(beltImpactDmg(1)<=3.01,"медленное касание ≤ 3: "+beltImpactDmg(1));
  ok(beltImpactDmg(50)===20,"потолок 20: "+beltImpactDmg(50));
  ok(beltImpactDmg(-2)===0,"уходящий борт урона не получает");
  let found=false;
  for(let r=0;r<=10&&!found;r++)for(let x=-r;x<=r&&!found;x++)for(let y=-r;y<=r&&!found;y++){
    const s=getSystem(x,y);if(!s.belt)continue;
    G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;G.mode="system";enterBelt();found=true;
  }
  ok(found&&!!G.belt,"пояс найден и открыт");
  const b=G.belt;
  const a=b.ast[0];a.grove=false;a.r=10;
  b.x=0;b.y=0;b.z=0;b.vx=0;b.vy=0;b.vz=0;
  a.x=0;a.y=0;a.z=18;a.sx=0;a.sy=0;               /* d=18 < r+12=22: в зоне касания */
  for(let i=1;i<b.ast.length;i++){b.ast[i].x=1e5;b.ast[i].z=1e5;}
  const h0=G.hull;
  b.vz=2;
  updateBelt(1);
  const h1=G.hull;
  ok(h0-h1>0&&h0-h1<=20,"касание на скорости 2 забрало "+(h0-h1).toFixed(1)+" (0 < урон ≤ 20)");
  for(let i=0;i<20;i++){b.vx=0;b.vy=0;b.vz=Math.max(b.vz,.3);updateBelt(1);}
  ok(h1-G.hull<=3.5,"держать борт у камня 20 кадров подряд не добивает: ещё "+(h1-G.hull).toFixed(1));
}));
