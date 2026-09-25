/* ══ поверхность на видеокарте (21e2, флот G6) ══
   Сторож договора: слои видеокарты поверхности без устройства молчат (false) и
   ничего не ломают — кадр рисует прежние 2D-тайлы, ломти и воду. Третья, самая
   дальняя гряда строится вместе с двумя (её кладёт только видеокарта), и она —
   хребет, а не копия соседей. Подписи мира и передний план рисуются и без неё. */
TEST_SUITES.push(()=>suite("поверхность на видеокарте: без устройства — прежний 2D-кадр",{tier:"node"},()=>{
  resetWorld();
  const W0=makeWorld("terran",null,0);
  const P={type:"terran",mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:hashi(7,5,0x21E2)};
  worldTables(P);
  const tr=genTerrain(P);genPOI(tr,P);genDeco(tr,P);
  G.land={p:P,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();G.running=true;
  let threw=null;
  try{drawSurface();}catch(e){threw=e.message;}
  eq(threw,null,"кадр поверхности рисуется");
  const S=G.surf;
  /* ── слои видеокарты молчат ── */
  eq(surfRidgesGpu(tr,P,0,0,1),false,"гряды без устройства — false");
  eq(surfGroundGpu(tr,0,0,"rgb(1,2,3)","rgba(1,1,1,.4)",P.T.pal),false,"грунт без устройства — false");
  eq(surfShadeGpu(P),false,"тень неба без прохода — false");
  eq(surfCastGpu(tr,P,0,0),false,"падающие тени без прохода — false");
  eq(surfWaterGpu(tr,0,0,P,{x0:0,x1:300,y:900,seed:1},0,300,200),false,"вода без прохода — false");
  /* ── значит, работает 2D: тайлы гряд на месте (ломти грунта здесь не пекутся —
     материал планеты у яруса без картинки не готов, грунт идёт прямым путём) ── */
  ok(!!(S.farA&&S.farA.map.size&&S.farB&&S.farB.map.size),"тайлы дальних гряд испечены 2D");
  /* передний план без устройства рисуется 2D и сообщает об этом */
  threw=null;
  try{eq(surfNearGpu(tr,S.cam.x-W/2,S.cam.y-H*SURF_HOR,P),false,"передний план без прохода — false");}catch(e){threw=e.message;}
  eq(threw,null,"передний план рисуется 2D");
}));
TEST_SUITES.push(()=>suite("поверхность на видеокарте: третья гряда — хребет, а не копия",{tier:"node"},()=>{
  resetWorld();
  const W0=makeWorld("rocky",null,0);
  const P={type:"rocky",mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:hashi(11,3,0x21E2)};
  worldTables(P);
  const tr=genTerrain(P);
  G.land={p:P,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();G.running=true;
  drawSurface();
  ok(!!(tr.farH&&tr.farH.length===3),"профилей три: две гряды и самая дальняя");
  const A=tr.farH[0],C=tr.farH[2];
  const corr=(u,v)=>{
    let mu=0,mv=0;for(let i=0;i<tr.N;i++){mu+=u[i];mv+=v[i];}
    mu/=tr.N;mv/=tr.N;
    let su=0,sv=0,c=0;
    for(let i=0;i<tr.N;i++){const a=u[i]-mu,b=v[i]-mv;c+=a*b;su+=a*a;sv+=b*b;}
    return c/Math.sqrt(Math.max(1e-9,su*sv));
  };
  ok(Math.abs(corr(C,A))<.5,"самая дальняя не повторяет ближнюю ("+corr(C,A).toFixed(2)+")");
  ok(Math.abs(corr(C,tr.h))<.5,"и не повторяет землю ("+corr(C,tr.h).toFixed(2)+")");
  const span=a=>{let lo=1e9,hi=-1e9;for(let i=0;i<tr.N;i++){if(a[i]<lo)lo=a[i];if(a[i]>hi)hi=a[i];}return hi-lo;};
  ok(span(C)>span(A),"дальше — крупнее: размах "+span(C).toFixed(0)+" против "+span(A).toFixed(0));
  let s=0,fs=0;for(let i=0;i<tr.N;i++){s+=tr.h[i];fs+=C[i];}
  ok(Math.abs(fs/tr.N-s/tr.N)<2,"средняя высота — средняя земли: гряда не уезжает за кадр");
  /* высоты едут в текстуру двумя байтами от середины: запас ±4096 держит любой хребет */
  let mx=0;const mid=s/tr.N;
  for(const a of tr.farH.concat([tr.h]))for(let i=0;i<tr.N;i++)mx=Math.max(mx,Math.abs(a[i]-mid));
  ok(mx<4000,"профили влезают в кодировку текстуры высот ("+mx.toFixed(0)+" < 4096)");
  /* цвет воздуха для поля — числами 0..1 из строки hazeFar */
  const c=SRG_RGB(hazeFar(P,.58));
  ok(c.length===3&&c.every(v=>v>=0&&v<=1),"цвет гряды разобран в 0..1: "+c.map(v=>v.toFixed(2)).join(","));
}));
