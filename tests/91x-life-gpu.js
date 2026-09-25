/* ══ двойники кистей жизни на видеокарте (20fa, флот G6) ══
   Сторож договора: 2D-кисть и её двойник живут рядом. Без видеокарты двойник молчит
   (false) и ничего не ломает — режим зовёт 2D. Ключ позы квантуется честно: соседние
   фазы шага сходятся в один кадр, полный круг — в тот же, стояние — в одну выпечку.
   Свет мира берётся из режима и переопределяется полем. */
TEST_SUITES.push(()=>suite("жизнь на видеокарте: двойники ходока",{tier:"node"},()=>{
  resetWorld();
  /* ── ключ позы ── */
  const a=lifeAstroPose({phase:0,amp:1}),b=lifeAstroPose({phase:TAU,amp:1});
  eq(a.key,b.key,"полный шаг — та же выпечка");
  const c=lifeAstroPose({phase:TAU/ASTRO_STEPS*.4,amp:1});
  eq(c.key,a.key,"фаза в пределах полушага — тот же кадр");
  const d=lifeAstroPose({phase:TAU/ASTRO_STEPS*1.1,amp:1});
  ok(d.key!==a.key,"следующий кадр шага — своя выпечка");
  eq(lifeAstroPose({phase:1.3,amp:0}).key,lifeAstroPose({phase:4.1,amp:0}).key,"стоя фаза не плодит выпечек");
  eq(lifeAstroPose({phase:-1,amp:1}).pq,lifeAstroPose({phase:TAU-1,amp:1}).pq,"отрицательная фаза сворачивается в круг");
  eq(lifeAstroPose({walk:true,phase:0}).aq,1,"walk без amp — полный размах, как у 2D");
  ok(lifeAstroPose({amp:.5,air:true}).key!==lifeAstroPose({amp:.5}).key,"прыжок — другая поза");
  const keys=new Set();
  for(let i=0;i<400;i++)keys.add(lifeAstroPose({phase:i*.37,amp:(i%9)/8}).key);
  ok(keys.size<=ASTRO_STEPS*4+1,"выпечек ходока не больше кадров шага на размах: "+keys.size);
  /* ── свет по режиму ── */
  const L0=lifeLight({mode:"cave"});
  ok(L0.key.length===3&&L0.amb.length===3,"у света ключ и заполняющий");
  ok(L0.ly<0,"под землёй свет сверху-спереди, от фонаря");
  eq(lifeLight({mode:"base",rim:0}).rim,0,"поле света переопределяется");
  /* ── без видеокарты двойник молчит, а 2D-кисть работает как была ── */
  eq(lifeAstroGpu(null,10,10,{phase:0,amp:1}),false,"нет прохода — false");
  eq(lifeSprite(null,null,{x:0,y:0,w:1,h:1}),false,"спрайт без прохода — false");
  let threw=null;
  try{drawAstronaut({phase:1,amp:1,face:-1,jet:true,lamp:true,sun:.5});drawAstronaut({phase:0,amp:0,bake:true});}
  catch(e){threw=e.message;}
  eq(threw,null,"2D-кисть ходока рисует и с флагом выпечки");
}));
TEST_SUITES.push(()=>suite("жизнь на видеокарте: двойник зверя",{tier:"node"},()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  const sp=faunaOf(p)[0],r=rng(77);
  /* каждый архетип: земной и пять чужих */
  for(const al of [null].concat(BEAST_ALIEN)){
    const b=specimenBeast(r,Object.assign({},sp,{alien:al,hover:al==="jelly"||al==="manta"?20:0}),100,200);
    const X=lifeBeastBox(b);
    ok(X.x1>X.x0&&X.y1>X.y0,"рамка выпечки не пустая: "+(al||"земной"));
    ok(X.x0<0&&X.x1>0&&X.y0<0,"центр тела внутри рамки: "+(al||"земной"));
    let threw=null;
    try{drawBeast(b,0,b.r*.9,false,0,{blink:false,moving:true,th:1});drawBeast(b,10,10,true,1);}catch(e){threw=e.message;}
    eq(threw,null,"2D-кисть зверя рисует и выпечку, и живой кадр: "+(al||"земной"));
    eq(lifeBeastGpu(null,b,0,0,false,0),false,"без прохода двойник зверя молчит: "+(al||"земной"));
  }
  const b1=specimenBeast(r,sp,0,0),b2=specimenBeast(r,sp,0,0);
  ok(lifeId(b1)!==lifeId(b2)&&lifeId(b1)===lifeId(b1),"у особи своя выпечка, и она та же от кадра к кадру");
  /* свет красит капсулы: на свету светлее, чем в тени */
  const L=lifeLight({mode:"base"}),c=[120,100,80];
  ok(lifeTint(c,L,1)[0]>lifeTint(c,L,0)[0],"нога на свету светлее ноги в тени");
}));
TEST_SUITES.push(()=>suite("жизнь на видеокарте: двойник травы",{tier:"node"},()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0],bi=planetBiome(p);
  for(let k=0;k<PLANT_KINDS;k++){
    const pl=specimenPlant(rng(31+k),speciesPlant(rng(7+k),p,bi,k),p,120,300,null);
    const X=lifePlantBox(pl);
    ok(X.x0<0&&X.x1>0&&X.y0<-pl.h&&X.y1>0,"комель и верх внутри рамки выпечки: форма "+k);
    let threw=null,bend=null;
    PLANT_BAKE={ux:.5};
    try{bend=plantBend(pl);drawPlant(pl,0,0,0);}catch(e){threw=e.message;}finally{PLANT_BAKE=null;}
    eq(threw,null,"2D-кисть рисует выпечку: форма "+k);
    eq(bend,0,"в выпечке растение стоит ровно: форма "+k);
    eq(lifePlantGpu(null,pl,0,0,0),false,"без прохода двойник травы молчит: форма "+k);
  }
  eq(PLANT_BAKE,null,"выпечка не оставляет флаг за собой");
  eq(plantUx(),plantUx(),"свет куста — один на кадр");
}));
TEST_SUITES.push(()=>suite("жизнь на видеокарте: подглядка",{tier:"node"},()=>{
  resetWorld();
  eq(lifePeepGpu(null,0,0),false,"без прохода двойник подглядки молчит");
  const S0=G.surf;G.surf=null;
  eq(peepWalk(0,0),null,"нет луга — никто не идёт");
  let threw=null;try{peepGhosts(0,0);}catch(e){threw=e.message;}
  eq(threw,null,"2D-подглядка без луга молчит, как прежде");
  G.surf=S0;
}));
