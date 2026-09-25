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
/* поле в текстуру (08c gpuFieldBaked): кэш по ключу, как gpuBaked */
TEST_SUITES.push(()=>suite("GPU-поле в текстуру: ключ, устройство, размер",{tier:"browser"},()=>{
  const M=new Map(),code="fn field(p:vec2f,uv:vec2f)->vec4f{return vec4f(uv.x,uv.y,0.,1.);}";
  if(!GPU.dev){eq(gpuFieldBaked(M,"a","test.uv",code,null,null,64,32),null,"без видеокарты — null");return;}
  const B=gpuFieldBaked(M,"a","test.uv",code,null,null,64,32);
  ok(B&&B.view&&B.w===Math.round(64*DPR)&&B.h===Math.round(32*DPR),"поле испечено в плотности DPR");
  ok(gpuFieldBaked(M,"a","test.uv",code,null,null,64,32)===B,"тот же ключ — та же текстура");
  const w0=W;const B2=gpuFieldBaked(M,"b","test.uv",code,null,null,16,16,{k:1});
  ok(B2!==B&&B2.w===16&&W===w0,"другой ключ — новая; W на месте после выпечки");
  gpuBakeDrop(B);gpuBakeDrop(B2);
}));
suite("GPU-поле в текстуру: без видеокарты",()=>{
  if(!GPU.dev)eq(gpuFieldBaked(new Map(),"a","test.uv","",null,null,8,8),null,"без видеокарты — null, ничего не печётся");
  else ok(GPU.dev,"видеокарта есть — выпечку проверяет браузерный набор");
});
