/* Развилка 3 плейтеста 14.10: цель по радиусу, но не по баку — серая, с причиной, прыжок не начинается. */
TEST_SUITES.push(()=>suite("развилка 3: цель по радиусу, но не по баку — серая, с причиной, прыжок не начинается",()=>{
  resetWorld();
  G.mode="map";
  const reach=stat().jump+.02;
  let tgt=null;
  for(let x=-6;x<=6&&!tgt;x++)for(let y=-6;y<=6&&!tgt;y++){
    if(!starAt(x,y))continue;
    const d=Math.hypot(x-G.sx,y-G.sy);
    if(d>0&&d<=reach&&mapJumpCost(d)>=40)tgt={x,y,d};
  }
  ok(!!tgt,"цель в радиусе прыжка ценой от 40 найдена (радиус "+reach.toFixed(2)+")");
  G.fuel=30;G.sel={x:tgt.x,y:tgt.y};
  const J=mapJump();
  ok(J.bad&&J.dry,"расклад: прыжок невозможен, причина — бак (цена "+J.cost+" из 30)");
  ok(mapDryWord(J.cost)==="НЕ ХВАТИТ ТОПЛИВА: "+J.cost+" из 30","причина с числами: "+mapDryWord(J.cost));
  /* дальняя цель — другая причина, не «не хватит» */
  G.sel={x:G.sx+40,y:G.sy};
  const F=mapJump();
  ok(F.bad&&!F.dry,"вне радиуса — не «топливо», а радиус");
  /* ДЕЙСТВИЕ на цели не по баку не прыгает и не тратит топлива (как у бота и у игрока) */
  G.sel={x:tgt.x,y:tgt.y};
  const sx0=G.sx,sy0=G.sy;
  try{actEdge=true;stepWorld(1);}finally{actEdge=false;}
  ok(G.mode==="map"&&G.sx===sx0&&G.sy===sy0,"остались в секторе "+sx0+":"+sy0+" · режим "+G.mode);
  ok(G.fuel===30,"топливо не списано: "+G.fuel);
  ok(String(G.msg).indexOf("НЕ ХВАТИТ ТОПЛИВА")===0,"игрок слышит причину: "+String(G.msg).split("\n")[0]);
  /* а с полным баком тот же прыжок идёт */
  G.fuel=Math.max(G.fuel,J.cost+5);
  try{actEdge=true;stepWorld(1);}finally{actEdge=false;}
  ok(G.sx===tgt.x&&G.sy===tgt.y,"с баком хватает — прыгнули в "+G.sx+":"+G.sy);
}));
