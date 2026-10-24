/* ══════════════ атлас корпусов кадра (24.10, телефон) ══════════════ */
/* 17c2a: корпуса до 256 px рисуются областями одного атласа одним проходом — прежде у каждого (и у накладки
   пирата) был свой проход ×4 размером с класс, в бою с восемью пиратами 18 проходов, и S23 платил ~0,2 мс за
   каждый. Бой с восемью пиратами: корпусных проходов не больше трёх, ни один корпус не упал в класс мельче
   (прежде слоёв класса 256 было 8 на 12 корпусов — четверо, свой корабль среди них, рисовались мыльнее),
   и картинка та же, где старому пути слоёв хватало (трое пиратов) */
TEST_SUITES.push(()=>suite("корпуса в объёме: атлас кадра",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";
  const sh=G.ship,at=[[110,-40,3,11],[70,90,1,18],[-90,70,0,25],[-120,-60,2,31],[20,-130,1,44],[150,60,0,57],[-30,160,2,63],[180,-120,1,71]];
  const put=k=>{G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;sh.x=0;sh.y=-700;sh.vx=sh.vy=0;G.pirates=[];G.msl=[];
    for(const [dx,dy,rank,seed] of at.slice(0,k)){
      const p={x:sh.x+dx,y:sh.y+dy,vx:0,vy:0,a:Math.atan2(-dy,-dx),hull:300,hullMax:400,name:"Ц"+(G.pirates.length+1),rank,seed,cool:1e9,aware:false,thrust:false};
      p.shipId=pirateShipId(seed);G.pirates.push(p);}
    G.zoom=1.4;G.zoomT=null;};
  /* проходы считаются только корпусные — открытые изнутри h3dRun (выпечки и прочее кадра гуляют от кадра к кадру) */
  const E=GPUCommandEncoder.prototype,bR=E.beginRenderPass,cls=window.h3dCls,run=window.h3dRun,atl0=H3D.atl;let np=0,small=0,inH=0;
  E.beginRenderPass=function(){if(inH)np++;return bR.apply(this,arguments);};
  window.h3dRun=function(){inH++;try{return run.apply(this,arguments);}finally{inH--;}};
  const frame=(a,snap)=>{H3D.atl=a;np=0;small=0;GPU.wantSnap=!!snap;drawWorld();const r={p:np,small};
    if(snap){const c=GPU.snap;r.d=c.getContext("2d",{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;}return r;};
  const big=(x,y)=>{let n=0;for(let i=0;i<x.length;i+=4)if(Math.max(Math.abs(x[i]-y[i]),Math.abs(x[i+1]-y[i+1]),Math.abs(x[i+2]-y[i+2]))>24)n++;return n;};
  try{
    /* класс мельче нужного: корпус до 256 px ушёл в слой 128 при свободном атласе */
    window.h3dCls=function(n){if(H3D.atl&&n<=128)small++;return cls.apply(this,arguments);};
    put(8);for(let i=0;i<4;i++)frame(true);
    const A=frame(true),B=frame(false);
    ok(A.p<=3&&B.p>=17,"бой с восемью: корпусных проходов на кадр "+A.p+" против "+B.p+" прежним путём");
    eq(A.small,0,"ни один корпус не ушёл в класс 128");
    ok(!!H3D.A&&H3D.A.top>0&&H3D.A.top<=H3D.A.H,"атлас занят: "+(H3D.A?H3D.A.top+" из "+H3D.A.H:"нет"));
    put(3);for(let i=0;i<3;i++)frame(true);
    const a=frame(true,true),b=frame(false,true),a2=frame(true,true);
    ok(big(a.d,a2.d)===0,"кадр с атласом повторяется");
    const nb=big(a.d,b.d);
    ok(nb<=8,"трое пиратов: картинка атласом та же, что прежним путём ("+nb+" точек расходятся)");
  }finally{E.beginRenderPass=bR;window.h3dCls=cls;window.h3dRun=run;H3D.atl=atl0;GPU.wantSnap=false;G.pirates=[];}
}));
