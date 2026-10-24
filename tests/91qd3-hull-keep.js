/* ══════════════ постоянный слой крупного корпуса (24.10, телефон) ══════════════ */
/* 17c2a: корпус больше атласа (станция, свой корабль на крупном плане) держит свой слой на кадры вперёд и
   переписывает его, только когда ключ другой: формы без места на экране, свет рядом от центра, звезда с допуском
   0,002 рад. Прежде слой 512² с тяжёлым шейдером переписывался каждый кадр (тестер, S23: hull3d 1,7 мс у станции
   без единого пирата, 6 мс при зуме 2,4). Станция в покое: слой не переписывается; сдвиг по орбите в допуске —
   тоже нет, за допуском — один раз; кадр тот же, что прежним путём */
TEST_SUITES.push(()=>suite("корпуса в объёме: постоянный слой станции",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";
  let s=null;
  for(let r=0;r<=20&&!s;r++)for(let x=-r;x<=r&&!s;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const q=getSystem(x,y);if(q.station){s=q;G.sx=x;G.sy=y;break;}}
  if(!ok(!!s,"станция нашлась"))return;
  const sh=G.ship,st=s.station,sx0=st.x,sy0=st.y,keep0=H3D.keep,t0=G.t,x0=-1400,y0=400;   /* место на орбите ставит шаг мира — у свежего мира станция в нуле */
  G.sys=s;G.ap=null;G.orbit=null;G.pirates=[];G.msl=[];G.zoom=1.1;G.zoomT=null;
  /* станция повёрнута по орбите на e рад, корабль — с ней: свет рядом тот же, звезда сдвинулась */
  const put=e=>{const c=Math.cos(e),q=Math.sin(e);st.x=x0*c-y0*q;st.y=x0*q+y0*c;sh.x=st.x+40;sh.y=st.y+90;sh.vx=sh.vy=0;};
  const frame=(k,snap)=>{H3D.keep=k;G.t=t0;GPU.wantSnap=!!snap;drawWorld();
    if(snap){const c=GPU.snap;return c.getContext("2d",{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;}};
  const big=(x,y)=>{let n=0;for(let i=0;i<x.length;i+=4)if(Math.max(Math.abs(x[i]-y[i]),Math.abs(x[i+1]-y[i+1]),Math.abs(x[i+2]-y[i+2]))>24)n++;return n;};
  const kd=()=>H3D.kd||0;
  try{
    put(0);const k0=kd();for(let i=0;i<4;i++)frame(true);
    ok(H3D.kn>=1&&kd()>k0,"станция легла в постоянный слой (слоёв "+H3D.kn+", записей "+(kd()-k0)+")");
    /* кадры — подряд и до сдвигов корабля: след за ним и сама сцена понемногу гуляют от кадра к кадру */
    const a=frame(true,true),a2=frame(true,true),b=frame(false,true);
    eq(big(a,a2),0,"кадр с постоянным слоем повторяется");
    const nb=big(a2,b);
    ok(nb<=8,"кадр постоянным слоем тот же, что прежним путём ("+nb+" точек расходятся)");
    let k1=kd();for(let i=0;i<5;i++)frame(true);
    eq(kd()-k1,0,"станция в покое: слой не переписывается");
    k1=kd();put(.001);frame(true);frame(true);
    eq(kd()-k1,0,"звезда сдвинулась на 0,001 рад — в допуске, слой тот же");
    k1=kd();put(.01);frame(true);frame(true);
    eq(kd()-k1,1,"звезда сдвинулась на 0,01 рад — слой переписан один раз");
  }finally{H3D.keep=keep0;GPU.wantSnap=false;st.x=sx0;st.y=sy0;G.t=t0;}
}));
