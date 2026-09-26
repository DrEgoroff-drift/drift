/* ══════════════ отказ видеокарты: сбой кадра — не потеря устройства (08b2, ревью 25.09 п. 5a) ══════════════
   Раньше любой бросок JS в сборке или показе кадра звал gpuDrop: видеокарта гасла на 1.5 с,
   устройство бросалось целиком, а после подъёма выпечки из кэшей модулей (флот, пираты, баржа)
   оставались на мёртвом устройстве — кадр невалиден навсегда. Здесь: бросок в сборке и в показе — исключение уходит
   стражу кадра, устройство то же, следующий кадр идёт. Настоящая потеря (destroy() в полёте)
   проверяется на стенде: docs/DESIGN-gpu.md «Where I stopped», 5a. */
TEST_SUITES.push(()=>suite("видеокарта: сбой кадра не роняет устройство",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  const dev=GPU.dev,said=[],was=crashSay;
  crashSay=(e,where)=>{said.push(where+": "+((e&&e.message)||e));};
  try{
    /* бросок в сборке (gpuWorld: проход слоя #ovl) и в показе — исключение наружу, устройство то же */
    for(const [name,where] of [["ovFlush","сборка"],["gpuUni","показ"]]){
      const o=window[name];let got=null;window[name]=()=>{throw new Error("проба: "+where);};
      try{gpuManual(()=>{});}catch(e){got=e;}finally{window[name]=o;}
      eq(got&&got.message,"проба: "+where,where+": исключение уходит стражу кадра");
      ok(GPU.dev===dev&&!GPU.lost&&GPU.ok,where+": устройство то же, не потеряно");
      ok(!GPU.on&&!GPU.enc&&ctx===MAIN_CTX,where+": кадр брошен начисто (кодировщик снят, ctx — #c)");
      const f1=GPU.frameNo;
      ok(gpuManual(()=>{})&&GPU.frameNo===f1+1,where+": следующий кадр собран и показан");
    }
    /* выпечка старого устройства в поле — перепекается на текущем (кэши модулей после потери) */
    const B=gpuBake(16,16,g=>{g.fillStyle="#fff";g.fillRect(0,0,8,8);},{mips:false}),dead={};B.dev=dead;
    ok(gpuManual(()=>{gpuField(gpuScene(),"gew",GEW_WGSL,GEW,[B]);}),"кадр с полем собран");
    ok(B.dev===GPU.dev,"выпечка чужого устройства в gpuField перепечена на текущем");
    gpuBakeDrop(B);
  }finally{crashSay=was;}
  eq(said.length,0,"строк стража в обход исключения нет: "+said.join(" | "));
  resetWorld();
}));
/* кэши арта с потолком (ревью 25.09 п. 4): посевы флота и пиратов меняются каждые 10–15 минут
   в каждой системе — без потолка текстуры с мипами копились часами */
TEST_SUITES.push(()=>suite("видеокарта: кэши выпечек с потолком, выпавшая выпечка допекается",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  const dot=g=>{g.fillStyle="#fff";g.fillRect(0,0,4,4);};
  const M=new Map(),first=gpuBaked(M,"k0",8,8,dot,{keep:5,mips:false});
  for(let i=1;i<12;i++)gpuBaked(M,"k"+i,8,8,dot,{keep:5,mips:false});
  eq(M.size,5,"gpuBaked держит keep последних");
  ok(!first.tex&&!M.has("k0"),"старейшая выпечка выпала с текстурой");
  gpuBaked(M,"k7",8,8,dot,{keep:5,mips:false});gpuBaked(M,"k12",8,8,dot,{keep:5,mips:false});
  ok(M.has("k7")&&!M.has("k8"),"взятая выпечка — снова свежая, выпадает следующая по давности");
  for(const B of M.values())gpuBakeDrop(B);
  const A={},arts=[];
  for(let i=0;i<30;i++)arts.push(artPut(A,"a"+i,{cn:gpuBake(8,8,dot,{mips:false}),rad:4},24));
  artGet(A,"a6");artPut(A,"a30",{cn:gpuBake(8,8,dot,{mips:false})},24);
  eq(Object.keys(A).length,24,"кэш арта держит потолок");
  ok(!arts[0].cn.tex&&!("a0" in A),"выпавшая вещь отдала свои выпечки");
  ok("a6" in A&&!("a7" in A),"artGet освежает вещь: выпадает следующая по давности");
  eq(typeof arts[0].rad,"number","поля вещи, что не выпечки, не тронуты");
  /* держатель ещё рисует выпавшую выпечку — поле её допекает, а не кладёт пустой вид */
  const B=arts[1].cn;
  ok(gpuManual(()=>{gpuField(gpuScene(),"gew",GEW_WGSL,GEW,[B]);})&&!!B.tex&&B.dev===GPU.dev,"выпавшая выпечка в поле допечена");
  for(const k in A){const o=A[k];if(o.cn)gpuBakeDrop(o.cn);}gpuBakeDrop(B);
  ok(FLEET_KEEP>=21&&PIR_KEEP>=9&&BARGE_KEEP>=3,"потолки кэшей — не меньше трёх систем по обходу 26.09 (флот 7, пираты 3, баржи 1)");
  const hb=[];for(let i=0;i<HG_KEEP+4;i++){const id=pirateShipId(100+i);hb.push(hullGpuBake(hullOf(id),id,.5));}
  ok(HG_LRU.size<=HG_KEEP&&!hb[0].B.tex&&!!hb[hb.length-1].B.tex,"выпечки корпусов под общим потолком, старейшая выпала");
  resetWorld();
}));
/* мастер станции против сброса атласа текста (ревью №5): тело пишется в первом шаге, слои
   пекутся по шагу за кадр. Атлас между шагами отдал страницы в мусор — выпечка по старой записи
   связала бы уничтоженную текстуру и вышла бы прозрачной. Теперь запись помнит поколение атласа
   и переписывается. Мёртвые виды ловятся в createBindGroup синхронно */
TEST_SUITES.push(()=>suite("мастер станции: сброс атласа текста между слоями не отдаёт выпечке мёртвые страницы",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();
  let S=null;
  for(let r=0;r<=14&&!S;r++)for(let x=-r;x<=r&&!S;x++)for(let y=-r;y<=r&&!S;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
    const s=getSystem(x,y);if(!s.station)continue;
    G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;S=s.station;}
  if(!ok(S,"станция нашлась"))return;
  G.ship.x=S.x+140;G.ship.y=S.y+90;G.ship.vx=G.ship.vy=0;G.zoom=1.2;G.zoomT=null;
  const J0=stMasterJob,D=GPUDevice.prototype,cbg=D.createBindGroup;let A=null,dead=0;
  for(const M of ST_MASTER.values())stMasterDrop(M);ST_MASTER.clear();
  for(const k of [...PB.keys()])if(k.startsWith("st|"))prebakeDrop(k);
  try{
    stMasterJob=function(){A=Array.from(arguments);return J0.apply(null,arguments);};
    gpuManual(()=>drawSystem());
  }finally{stMasterJob=J0;}
  if(!ok(A,"кадр системы заказал мастер станции"))return;
  D.createBindGroup=function(d){for(const e of (d&&d.entries)||[])if(e.resource&&e.resource.__dead)dead++;return cbg.apply(this,arguments);};
  let R=null;
  try{
    /* пустой атлас: всё, что тело пишет текстом, ляжет на свежие страницы */
    const drop=()=>{const pg=GC_ATL.pages;GC_ATL.pages=[];GC_ATL.map.clear();GC_ATL.gen++;
      for(const p of pg){p.view.__dead=true;p.tex.destroy();}return pg.length;};
    drop();
    const it=J0.apply(null,A);it.next();
    ok(GC_ATL.pages.length>0,"тело записало текст в атлас ("+GC_ATL.pages.length+" стр.)");
    eq(drop()>0,true,"атлас сброшен между записью и первым слоем");
    let st;for(let i=0;i<32&&!(st=it.next()).done;i++);
    R=st&&st.done?st.value:null;
  }finally{D.createBindGroup=cbg;}
  eq(dead,0,"ни одна выпечка слоя не связала уничтоженную страницу атласа");
  ok(R&&R.Ly.length>0&&R.Ly.every(B=>!!B.tex),"мастер испечён: слоёв "+(R?R.Ly.length:0));
  if(R)stMasterDrop(R);
  resetWorld();
}));
