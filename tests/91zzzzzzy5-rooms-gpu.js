/* ══════════════ комнаты на видеокарте (G11): кисти печей пишутся GPU-холстом без дыр ══════════════
   Комнаты (санаторий, зимовка, дом, кино, шахматы) печут свои части через gpuBake:
   кисть рисует в глобальный ctx, а на время печи это GcCtx. Всё, чего GPU-холст не
   умеет, бросает «GPU-холст: нет …» — поэтому каждую кисть прогоняем в запись. Под
   Node видеокарты нет: текст там громкий по устройству, а не по кисти, и его
   заглушаем — проверяется всё векторное. В Chrome текст пишется честно. */
function roomsRec(w,h,draw){
  const g=new GcCtx(w,h,1),prev=ctx;
  if(!GPU.dev){g.fillText=function(){};g.strokeText=function(){};}
  let err="";ctx=g;
  try{draw(g);}catch(x){err=(x&&x.message)||String(x);}finally{ctx=prev;}
  return {g,err};
}
TEST_SUITES.push(()=>suite("комнаты на видеокарте: веранда санатория печётся без дыр",()=>{
  resetWorld();
  G.spa={day:2,days:3,slot:0,done:0,took:{"2:bath":1},talked:0,pname:"Тиун III",home:{sx:0,sy:0},seed:1234567};
  const S=spaAll(),g=spaGeom();
  const F=roomsRec(W,H-g.deck,()=>{ctx.translate(0,-g.deck);spaFloor(g);});
  eq(F.err,"","пол веранды — без громких дыр");
  ok(F.g._ops.length>20,"пол записан ("+F.g._ops.length+" команд)");
  const P=roomsRec(W,H,()=>spaProps(g,S));
  eq(P.err,"","перила, щит, мебель, люди, навес — без громких дыр");
  ok(P.g._ops.length>80,"вещи веранды записаны ("+P.g._ops.length+" команд)");
  ok(/fn field\(/.test(SPA_SEA_WGSL)&&/fn field\(/.test(SPA_AIR_WGSL),"море и воздух — поля видеокарты");
  /* без кадра видеокарты веранда молчит, а не рисует 2D */
  const n=GPU.on;GPU.on=false;let e="";try{drawSpa();}catch(x){e=x.message;}GPU.on=n;
  eq(e,"","вне кадра drawSpa не падает");
  G.spa=null;
}));
TEST_SUITES.push(()=>suite("комнаты на видеокарте: зимовка печётся без дыр",()=>{
  resetWorld();
  G.win={sx:G.sx|0,sy:G.sy|0,pi:0,day:15,days:30,pw:{heat:2,air:2,light:3,ant:1},faults:[{k:"pump",day:15}],
    pname:"Тиун II",home:{sx:0,sy:0},t0:0,done:0};
  const W0=winAll(),g=winGeom();
  for(const pw of [{heat:3,air:2,light:3,ant:1},{heat:0,air:2,light:0,ant:1}]){
    W0.pw=pw;
    const sl=gpuScreenLayer;gpuScreenLayer=(k,f)=>f(ctx);   /* кисть слоя — прямо в запись */
    const R=roomsRec(W,H,()=>winRoomLayer(W0));gpuScreenLayer=sl;
    eq(R.err,"","слой комнаты: без громких дыр (свет "+pw.light+", тепло "+pw.heat+")");
    const P=roomsRec(W,H,()=>winProps(g,W0));
    eq(P.err,"","рама, лампа, стол, приборы, календарь, зимовщик — без громких дыр");
    ok(P.g._ops.length>100,"вещи зимовки записаны ("+P.g._ops.length+" команд)");
  }
  const T=roomsRec(W,H*0.1,()=>winText(W0));
  eq(T.err,"","строка суток — без дыр");
  for(const s of [WIN_VIEW_WGSL,WIN_LIGHT_WGSL,WIN_DARK_WGSL])ok(/fn field\(/.test(s),"окно, свет и темнота — поля видеокарты");
  const n=GPU.on;GPU.on=false;let e="";try{drawWinter();}catch(x){e=x.message;}GPU.on=n;
  eq(e,"","вне кадра drawWinter не падает");
  G.win=null;
}));
TEST_SUITES.push(()=>suite("комнаты на видеокарте: кинопередвижка рисуется GPU-холстом без дыр",()=>{
  resetWorld();
  const K={title:KINO_TITLES[0],id:"0,0@0",seed:12345};
  /* весь журнал: шесть кадров по 4,2 с — каждый кадр через запись */
  const seen={};
  for(let i=0;i<KINO_REEL.length;i++){
    seen[kinoFrame(K).k]=1;
    const R=roomsRec(640,400,c=>kinoOverlay(c,640,400,300,220,K,K.seed));
    eq(R.err,"","зал на вечер, кадр «"+kinoFrame(K).k+"» — без громких дыр");
    ok(R.g._ops.length>60,"кадр записан ("+R.g._ops.length+" команд)");
    clockAdvance(4200);
  }
  eq(Object.keys(seen).length,KINO_REEL.length,"журнал прокручен весь");
}));
TEST_SUITES.push(()=>suite("комнаты на видеокарте: шахматная доска рисуется GPU-холстом без дыр",()=>{
  resetWorld();
  const g=chessStart("t",true);
  g.mv=[{f:52,t:36,p:0},{f:12,t:28,p:0},{f:62,t:45,p:0},{f:1,t:18,p:0}];
  chSel=61;
  for(const flip of [false,true]){
    const R=roomsRec(352,352,c=>chessPaint(c,352,g,"t",flip));
    eq(R.err,"","доска ("+(flip?"чёрными":"белыми")+") — без громких дыр");
    ok(R.g._ops.length>64*3,"клетки, волокно и свет записаны ("+R.g._ops.length+" команд)");
  }
  chSel=-1;
}));
TEST_SUITES.push(()=>suite("комнаты на видеокарте: дом печётся кусками без дыр",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=HOME_TIERS.length;G.home.sx=G.sx;G.home.sy=G.sy;
  G.home.trophies=[{k:"a"}];
  enterHomeIn();
  const S=G.hin,P=hinPal();
  for(const up of [0,1]){
    S.up=up;
    const R=hinRooms(),span=R[R.length-1].x+R[R.length-1].w;
    let nb=0,nf=0;
    for(let x0=R[0].x-HIN_CH;x0<span+HIN_CH;x0+=HIN_CH){
      const B=roomsRec(HIN_CH+HIN_CHP*2,200,()=>hinPaintBack(R,x0,HIN_CH+HIN_CHP*2,P,S));
      eq(B.err,"","задний слой, этаж "+up+", кусок с "+x0+" — без громких дыр");nb+=B.g._ops.length;
      const F=roomsRec(HIN_CH+HIN_CHP*2,200,()=>hinPaintFront(R,x0,HIN_CH+HIN_CHP*2,P));
      eq(F.err,"","передний слой, кусок с "+x0+" — без громких дыр");nf+=F.g._ops.length;
    }
    ok(nb>500&&nf>20,"этаж "+up+": дом записан (задний "+nb+", передний "+nf+" команд)");
  }
  S.up=0;
  const a=hinSig(S,2),b=(G.home.trophies.push({k:"b"}),hinSig(S,2));
  ok(a!==b,"новый кубок в витрине — новая подпись: куски перепекутся");
  ok(hinWinXs(hinRooms()).length>=4,"окна первого этажа — через комнату и в кабинете");
  const n=GPU.on;GPU.on=false;let e="";try{drawHomeIn();}catch(x){e=x.message;}GPU.on=n;
  eq(e,"","вне кадра drawHomeIn не падает");
  G.hin=null;G.mode="system";
}));
