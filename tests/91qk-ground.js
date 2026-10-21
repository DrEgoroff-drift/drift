/* ══════════════ тела на земле (Зрение 2.0, закон «опора») ══════════════ */
/* Автор, 15.10: копёр «не там стоит, вылазает не по профилю». Склон сам по себе не брак — автор:
   «если ноги у него одна короче другой на перепаде — норм». Ноги копра и так тянутся до земли
   (21pi, fy=gy(fx,fz)), а верх ровный от центра. Брак — когда склон круче, чем копёр может
   взять: нижняя нога вдвое длиннее верхней, распорка (g0+1.1q) уходит в гору, или кольцо
   ствола лезет вверх по склону выше, чем ствол глубок (.9 м) — стенка встаёт «не по профилю».
   Проверка — во всех местах, где игрок может заложить ствол: копёр мерится там, куда его ставит игра
   (23cc mineLaySpot: ближайшее место, где он встаёт, в паре шагов); отказ («круто») — не брак, но
   отказов не больше трети мест, и у каждого рядом есть ровное. Контроль, 15.10. */
TEST_SUITES.push(()=>suite("опора: копёр берёт склон ногами, а не телом",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet(),tr=G.surf.tr,L=plnLandMake(tr,p,G.sx);
  const q=PLN_THINGS.mineQ,zf=PLN_THINGS.mineZ,legs=[[-1.05*q,zf-.85*q],[1.05*q,zf-.85*q],[-1.05*q,zf+.85*q],[1.05*q,zf+.85*q]];
  const Wt=waterOf(tr,p),bad={ноги:0,распорка:0,ствол:0};
  let n=0,no=0,far=0,worst="";
  for(let i=1;i<40;i++){
    const xu=tr.padX+(i-20)*180;
    if(xu<200||xu>tr.N*tr.step-200)continue;
    if(Wt&&xu>Wt.x0-40&&xu<Wt.x1+40)continue;          /* в воде ствол не закладывают */
    if(Math.abs(xu-tr.padX)<160)continue;               /* на площадке корабля — тоже */
    const at=mineLaySpot(L,xu,1);
    if(at.x==null){n++;no++;if(!at.hint)far++;continue;}
    const xm=at.x/PLN_M,gy=(x,z)=>plnLandRibAt(L,xm+x,z),g0=gy(0,zf),top=g0+2.15*q;
    const len=legs.map(([dx,dz])=>top-gy(dx,dz)),ring=[];
    for(let k=0;k<12;k++){const a=k/12*TAU;ring.push(gy(Math.cos(a)*.95*q,zf+Math.sin(a)*.72*q)-g0);}
    const why=[];
    if(Math.max(...len)>2*Math.min(...len))why.push("ноги");
    if(legs.some(([dx,dz])=>gy(dx*.67,dz)>g0+1.1*q-.2))why.push("распорка");
    if(Math.max(...ring)>.9)why.push("ствол");
    n++;for(const w of why)bad[w]++;
    if(why.length&&!worst)worst="x="+xu+": "+why.join("+")+" (ноги "+len.map(v=>v.toFixed(1)).join("/")+" м, кольцо до +"+Math.max(...ring).toFixed(1)+" м)";
  }
  ok(n>=10,"мест проверено: "+n);
  ok(no*3<=n,"копёр не встаёт в "+no+" местах из "+n);
  ok(!far,"нет ровного и за "+MINE_LAY.far+" px: "+far);
  const nb=bad.ноги+bad.распорка+bad.ствол;
  ok(!nb,"копёр не берёт склон: ноги "+bad.ноги+", распорка в грунте "+bad.распорка+", кольцо выше ствола "+bad.ствол+" из "+n+"; первое — "+worst);
  resetWorld();
}));

/* Человек на поверхности: ноги ставит 2D-земля (groundAt по таблице tr.h, 21-mode-surface), а рисует
   3D-лента plnLandRibAt — с fbm, скалами, подъёмом и прудами поверх той же таблицы (21pf). Где они
   разошлись, человек висит над травой или стоит по щиколотку в камне. Закон: при z=0 (там, где он
   ходит) расхождение не больше 15 см — по всей ширине, кроме воды. */
TEST_SUITES.push(()=>suite("опора: человек ступает по той земле, что нарисована",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet(),tr=G.surf.tr,L=plnLandMake(tr,p,G.sx),Wt=waterOf(tr,p);
  let n=0,up=0,down=0,worst=0,where=0;
  for(let xu=200;xu<tr.N*tr.step-200;xu+=37){
    if(Wt&&xu>Wt.x0-40&&xu<Wt.x1+40)continue;
    const feet=(tr.padY-groundAt(tr,xu))/PLN_M,rib=plnLandRibAt(L,xu/PLN_M,0),d=feet-rib;
    n++;if(d>.15)up++;else if(d<-.15)down++;
    if(Math.abs(d)>Math.abs(worst)){worst=d;where=xu;}
  }
  ok(n>=50,"мест проверено: "+n);
  ok(!up&&!down,"человек висит в "+up+" и тонет в "+down+" местах из "+n+"; худшее — "+(worst>0?"висит":"в земле")+" на "+Math.abs(worst).toFixed(2)+" м у x="+where);
  resetWorld();
}));
