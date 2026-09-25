/* ══════════════ Ломти и слои на видеокарте (18c: gpuScreenLayer, gpuDrawChunks, gpuDrawTiles) ══════════════
   Двойники screenLayer/drawChunks/drawTiles: тот же договор рисовальщика, выпечка GPU-холста вместо
   2D-холста. Под Node устройства нет — проверяется договор хранилищ и то, что без видеокарты
   ничего не печётся и не падает; выпечку с пикселями проверяет браузерный набор ниже. */
suite("GPU-ломти: хранилища и без видеокарты",()=>{
  resetWorld();
  const S=gpuChunkStore(null,"k1",100,300);
  ok(S&&S.map instanceof Map&&S.top===100&&S.ch===300,"gpuChunkStore — хранилище того же вида, что chunkStore");
  ok(gpuChunkStore(S,"k1",100,300)===S,"тот же ключ — то же хранилище");
  ok(gpuChunkStore(S,"k2",100,300)!==S,"другой ключ — новое хранилище");
  const T=gpuTileStore(null,"t1");ok(gpuTileStore(T,"t1")===T&&gpuTileStore(T,"t2")!==T,"gpuTileStore — ключ как у tileStore");
  let n=0;
  if(!GPU.dev){
    eq(gpuScreenLayer("x",()=>{n++;}),null,"без видеокарты слоя нет — null, не 2D-холст");
    eq(gpuChunkAt(S,0,()=>{n++;}),null,"без видеокарты ломтя нет");
    gpuDrawChunks(null,S,0,0,()=>{n++;});gpuDrawTiles(null,T,0,0,()=>{n++;});
    eq(n,0,"без прохода и устройства рисовальщик не зовётся");eq(S.map.size,0,"и ничего не хранится");}
  else ok(GPU.dev,"видеокарта есть — выпечку проверяет браузерный набор");
});
TEST_SUITES.push(()=>suite("GPU-ломти: выпечка по договору рисовальщика",{tier:"browser"},()=>{
  if(!GPU.dev){eq(gpuScreenLayer("x",()=>{}),null,"без видеокарты слоя нет");return;}
  const seen=[];
  const S=gpuChunkStore(null,"test|ломоть",40,200);
  const B=gpuChunkAt(S,3,(g,wx0,wy0)=>{seen.push([g===ctx,g instanceof GcCtx,W,H,wx0,wy0]);g.fillStyle="#fff";g.fillRect(0,0,W,H);});
  ok(B&&B.view,"ломоть — выпечка");
  eq(JSON.stringify(seen[0]),JSON.stringify([true,true,CHUNK_W,200,3*CHUNK_W,40]),"рисовальщик: ctx — GPU-холст, W×H — ломоть, начало — мировая точка");
  eq(B.w,Math.round(CHUNK_W*DPR*SCK),"плотность выпечки — DPR·SCK, как у mkCanvas");
  ok(gpuChunkAt(S,3,()=>{throw new Error("повтор");})===B,"повтор — из хранилища, без выпечки");
  for(let k=0;k<CHUNK_KEEP+2;k++)gpuChunkAt(S,10+k,()=>{});
  ok(!S.map.has(3)&&!B.tex,"вытесненный ломоть сдаёт текстуру");
  gpuStoreDrop(S);
  const L=gpuScreenLayer("test|слой",g=>{g.fillStyle="#123";g.fillRect(0,0,W,H);});
  ok(L&&L.view&&L.w===Math.round(W*DPR*SCK),"слой во весь экран — выпечка в плотности кадра");
}));
