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
