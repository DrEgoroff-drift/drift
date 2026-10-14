/* ══════════════ тела на земле (Зрение 2.0, закон «опора») ══════════════ */
/* Автор, 15.10: копёр «не там стоит, вылазает не по профилю» — он встал в провал между двумя
   буграми, ноги ушли вниз по склону, кольцо у ствола перекосило. Устье ставит игрок (enterDig: где
   стоял, там и ствол), а земля 3D о шахте не знает и площадку не ровняет. Закон: под четырьмя
   ногами копра перепад не больше полуметра — в любом месте, где игрок может заложить ствол. */
TEST_SUITES.push(()=>suite("опора: копёр стоит на ровном, где бы ни заложили ствол",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet(),tr=G.surf.tr,L=plnLandMake(tr,p,G.sx);
  const q=PLN_THINGS.mineQ,zf=PLN_THINGS.mineZ,legs=[[-1.05*q,zf-.85*q],[1.05*q,zf-.85*q],[-1.05*q,zf+.85*q],[1.05*q,zf+.85*q]];
  const Wt=waterOf(tr,p);
  let n=0,bad=0,worst=0,where=0;
  for(let i=1;i<40;i++){
    const xu=tr.padX+(i-20)*180;
    if(xu<200||xu>tr.N*tr.step-200)continue;
    if(Wt&&xu>Wt.x0-40&&xu<Wt.x1+40)continue;          /* в воде ствол не закладывают */
    if(Math.abs(xu-tr.padX)<160)continue;               /* на площадке корабля — тоже */
    const xm=xu/PLN_M,h=legs.map(([dx,dz])=>plnLandRibAt(L,xm+dx,dz)),d=Math.max(...h)-Math.min(...h);
    n++;if(d>.5){bad++;if(d>worst){worst=d;where=xu;}}
  }
  ok(n>=10,"мест проверено: "+n);
  ok(!bad,"копёр на склоне в "+bad+" из "+n+" мест; худшее — перепад "+worst.toFixed(2)+" м под ногами у x="+Math.round(where));
  resetWorld();
}));
