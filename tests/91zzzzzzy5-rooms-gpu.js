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
    const sl=screenLayer;screenLayer=(k,f)=>f(ctx);   /* кисть слоя — прямо в запись */
    const R=roomsRec(W,H,()=>winRoomLayer(W0));screenLayer=sl;
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
