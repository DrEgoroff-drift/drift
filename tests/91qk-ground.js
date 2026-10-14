/* ══════════════ тела на земле (Зрение 2.0, закон «опора») ══════════════ */
/* Автор, 15.10: копёр «не там стоит, вылазает не по профилю». Склон сам по себе не брак — автор:
   «если ноги у него одна короче другой на перепаде — норм». Ноги копра и так тянутся до земли
   (21pi, fy=gy(fx,fz)), а верх ровный от центра. Брак — когда склон круче, чем копёр может
   взять: нижняя нога вдвое длиннее верхней, распорка (g0+1.1q) уходит в гору, или кольцо
   ствола лезет вверх по склону выше, чем ствол глубок (.9 м) — стенка встаёт «не по профилю».
   Проверка — во всех местах, где игрок может заложить ствол. */
TEST_SUITES.push(()=>suite("опора: копёр берёт склон ногами, а не телом",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet(),tr=G.surf.tr,L=plnLandMake(tr,p,G.sx);
  const q=PLN_THINGS.mineQ,zf=PLN_THINGS.mineZ,legs=[[-1.05*q,zf-.85*q],[1.05*q,zf-.85*q],[-1.05*q,zf+.85*q],[1.05*q,zf+.85*q]];
  const Wt=waterOf(tr,p),bad={ноги:0,распорка:0,ствол:0};
  let n=0,worst="";
  for(let i=1;i<40;i++){
    const xu=tr.padX+(i-20)*180;
    if(xu<200||xu>tr.N*tr.step-200)continue;
    if(Wt&&xu>Wt.x0-40&&xu<Wt.x1+40)continue;          /* в воде ствол не закладывают */
    if(Math.abs(xu-tr.padX)<160)continue;               /* на площадке корабля — тоже */
    const xm=xu/PLN_M,gy=(x,z)=>plnLandRibAt(L,xm+x,z),g0=gy(0,zf),top=g0+2.15*q;
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
  const nb=bad.ноги+bad.распорка+bad.ствол;
  ok(!nb,"копёр не берёт склон: ноги "+bad.ноги+", распорка в грунте "+bad.распорка+", кольцо выше ствола "+bad.ствол+" из "+n+"; первое — "+worst);
  resetWorld();
}));
