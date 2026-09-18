/* ══════════════ якорь и стик: кромка — стена, а не болото ══════════════ */
/* Ролик 12.09: стик держат наружу за кромкой системы — корабль полз вдоль неё
   десятой долей крейсерской, нос на 90° в сторону, топливо горело: якорь
   заворачивал курс, помощь стика гнала обратно, правило торможения принимало
   загиб за «тянут против хода». Теперь кромка — стена (15a-helm,
   helmEdgeInput): наружная часть желания убрана, касательная ведёт вдоль,
   упор наружу держит корабль у стены. */
TEST_SUITES.push(()=>suite("якорь и стик: кромка — стена, вдоль неё скользят, в неё упираются",()=>{
  const run=(ang)=>{
    resetWorld();
    const sh=G.ship,edge=sysEdge(G.sys);
    const st=stat(),maxSp=6.4+st.thr*1.6;
    sh.x=edge+200;sh.y=0;sh.a=0;sh.vx=maxSp;sh.vy=0;G.fuel=100;G.ap=null;G.orbit=null;
    HELM.P=null;HELM.fade=null;HELM.trail=[];
    const R=HELM_DEAD+HELM_REACH+20;
    HELM.S=ang==null?null:{id:1,x0:100,y0:400,x:100+R*Math.cos(ang),y:400+R*Math.sin(ang)};
    const r={maxSide:0,late:[],fuelLate:0,maxD:0};let f600=0;
    for(let i=0;i<1200;i++){
      if(HELM.S){HELM.S.x=HELM.S.x0+R*Math.cos(ang);HELM.S.y=HELM.S.y0+R*Math.sin(ang);}
      updateSystem(1);
      const d=Math.hypot(sh.x,sh.y)||1,vt=(-sh.vx*sh.y+sh.vy*sh.x)/d;
      if(i>60)r.maxSide=Math.max(r.maxSide,Math.abs(vt)/maxSp);
      if(i>=100&&i<300)r.late.push(Math.abs(vt)/maxSp);   /* начало скольжения: дальше по кругу
         касательная доля неподвижного стика честно убывает */
      if(i===900)f600=G.fuel;
      r.maxD=Math.max(r.maxD,d-edge);
    }
    r.fuelLate=f600-G.fuel;r.d=Math.hypot(sh.x,sh.y)-edge;r.sp=Math.hypot(sh.vx,sh.vy)/maxSp;
    r.slide=r.late.reduce((a,b)=>a+b,0)/r.late.length;
    HELM.S=null;return r;
  };
  const out=run(0);
  ok(out.maxSide<.2,"упор строго наружу: боком не ползёт (касательная ≤ "+out.maxSide.toFixed(2)+" крейсерской)");
  ok(Math.abs(out.d)<150&&out.sp<.1,"и встаёт у самой стены ("+Math.round(out.d)+" от кромки, ход "+out.sp.toFixed(2)+")");
  ok(out.fuelLate<.3,"стоя у стены, топливо не жжёт ("+out.fuelLate.toFixed(2)+" за последние 300 кадров)");
  ok(out.maxD<1500,"перелёт за кромку с крейсерской — не дальше 1500 ("+Math.round(out.maxD)+")");
  const diag=run(Math.PI/4);
  ok(diag.slide>=.5*Math.SQRT1_2,"стик наискось: вдоль стены скользит на своей доле хода ("+diag.slide.toFixed(2)+")");
  ok(Math.abs(diag.d)<250,"и держится у кромки ("+Math.round(diag.d)+")");
  const coast=run(null);
  ok(coast.fuelLate===0,"без стика якорь по-прежнему уводит накатом, без топлива");
}));
