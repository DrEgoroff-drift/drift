/* ══════════════ корпуса в объёме: глубина, потом краска (24.10, телефон) ══════════════ */
/* 17c2a: корпус рисуется двумя проходами — глубина с покрытием (пробоина пирата, доля выборок плоскости краски),
   потом краска по «равно» без discard, по разу на видимую точку. Прежде discard и маска выборок в шейдере краски
   выключали ранний тест глубины (тестер, S23 горячий: −0,9…−2,2 мс hull3d без них). Кадр боя тот же, что прежним
   путём одним проходом (H3D.z=false) */
TEST_SUITES.push(()=>suite("корпуса в объёме: глубина, потом краска",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";
  const sh=G.ship,z0=H3D.z,t0=G.t;
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;sh.x=0;sh.y=-700;sh.vx=sh.vy=0;G.msl=[];G.pirates=[];
  for(const [dx,dy,rank,seed] of [[110,-40,3,11],[70,90,1,18],[-90,70,0,25],[-120,-60,2,31]]){
    const p={x:sh.x+dx,y:sh.y+dy,vx:0,vy:0,a:Math.atan2(-dy,-dx),hull:300,hullMax:400,name:"Ц"+(G.pirates.length+1),rank,seed,cool:1e9,aware:false,thrust:false};
    p.shipId=pirateShipId(seed);G.pirates.push(p);}
  G.zoom=1.6;G.zoomT=null;
  const frame=(z,snap)=>{H3D.z=z;G.t=t0;GPU.wantSnap=!!snap;drawWorld();
    if(snap){const c=GPU.snap;return c.getContext("2d",{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;}};
  const diff=(x,y)=>{let n=0;for(let i=0;i<x.length;i+=4)if(Math.max(Math.abs(x[i]-y[i]),Math.abs(x[i+1]-y[i+1]),Math.abs(x[i+2]-y[i+2]))>24)n++;return n;};
  try{
    for(let i=0;i<3*GNB_N;i++)frame(true);
    ok(!!H3D.Pz,"конвейер глубины корпусов заведён");
    const a=frame(false,true),a2=frame(false,true),b=frame(true,true);
    eq(diff(a,a2),0,"кадр прежним путём повторяется");
    const nb=diff(a2,b);
    ok(nb<=8,"кадр двумя проходами тот же, что одним ("+nb+" точек расходятся)");
  }finally{H3D.z=z0;GPU.wantSnap=false;G.t=t0;G.pirates=[];}
}));
