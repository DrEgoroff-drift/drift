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
