/* ══════════════ отказ видеокарты: сбой кадра — не потеря устройства (08b2, ревью 25.09 п. 5a) ══════════════
   Раньше любой бросок JS в сборке или показе кадра звал gpuDrop: видеокарта гасла на 1.5 с,
   устройство бросалось целиком, а после подъёма выпечки из кэшей модулей (флот, пираты, баржа)
   оставались на мёртвом устройстве — кадр невалиден навсегда. Здесь: бросок художника приборов —
   строка «СБОЙ · приборы», кадр дорисован; бросок в сборке и в показе — исключение уходит
   стражу кадра, устройство то же, следующий кадр идёт. Настоящая потеря (destroy() в полёте)
   проверяется на стенде: docs/DESIGN-gpu.md «Where I stopped», 5a. */
TEST_SUITES.push(()=>suite("видеокарта: сбой кадра не роняет устройство",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  const dev=GPU.dev,said=[],was=crashSay;
  crashSay=(e,where)=>{said.push(where+": "+((e&&e.message)||e));};
  try{
    /* художник приборов бросил — его строка СБОЙ, остальные рисуют, кадр показан */
    let other=false;const f0=GPU.frameNo;GPU.hkey=null;
    ok(gpuManual(()=>{gpuHud("проба|бросок",()=>{throw new Error("проба художника");});gpuHud("проба|сосед",()=>{other=true;});}),"кадр с бросающим художником собран");
    eq(said.join(" | "),"приборы: проба художника","бросок художника — строка стража «приборы»");
    ok(other,"сосед бросившего художника нарисован");
    eq(GPU.frameNo,f0+1,"кадр показан");
    /* бросок в сборке (gpuWorld) — исключение наружу, устройство то же */
    for(const [name,where] of [["gpuHudFlush","сборка"],["gpuUni","показ"]]){
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
  }finally{crashSay=was;GPU.hkey=null;}
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
