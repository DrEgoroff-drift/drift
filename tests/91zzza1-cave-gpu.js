/* ══════════════ пещера G7: свет от источников (22c) ══════════════
   Поле рисует только видеокарта, а источники, их порядок и упаковка цвета —
   обычный JS: это и сторожится. Картинку судит пара кадров флота. */
TEST_SUITES.push(()=>suite("пещера G7: источники света в кадре, упаковка цвета, холодная тьма",()=>{
  resetWorld();
  landOnTestPlanet();
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();
  const C=G.cave;
  ok(!!C&&!!C.g,"пещера построена");
  /* упаковка: как её читает litCol в WGSL — 1.00 = 100 */
  const un=pk=>[Math.floor(pk/65536),Math.floor(pk/256)%256,pk%256].map(v=>v/100);
  const q=un(caveLitPack(1,.5,.25,1.2));
  eq(q.join(","),"1.2,0.6,0.3","цвет×сила упакован и читается обратно");
  eq(un(caveLitPack(5,0,-1,1)).join(","),"2.55,0,0","упаковка держит 0…2.55, без переноса в соседний канал");
  /* источники: не больше CAVE_LIT_MAX, все в кадре; дня среди них нет — день в устье
     трапеция main сложением (CAVE_MOUTH_WGSL) */
  const vw=W,vh=H;
  for(const x of [80,500,900,1400,1900]){
    const camx=x-vw/2,camy=caveFloor(C,x)-vh*.56;
    const L=caveLights(C,camx,camy);
    ok(L.length<=CAVE_LIT_MAX,"источников не больше "+CAVE_LIT_MAX+" (x="+x+": "+L.length+")");
    ok(L.every(s=>s.x+s.r>=camx&&s.x-s.r<=camx+vw&&s.y+s.r>=camy&&s.y-s.r<=camy+vh),"каждый задевает кадр (x="+x+")");
    ok(L.every((s,i)=>!i||L[i-1].k<=s.k),"ближние к середине — первыми (x="+x+")");
    ok(L.every(s=>isFinite(s.x)&&isFinite(s.y)&&s.r>0&&s.I>0),"у источника есть место, радиус и сила (x="+x+")");
    ok(L.every(s=>s.r<=300),"дня-источника нет (x="+x+")");
  }
  /* чужая лампа — свет сложением с тенями: в кадре с ней она в списке с пометкой add */
  const Lp=caveLampSpot(C),LL=caveLights(C,Lp.x-vw/2,Lp.y-vh/2);
  ok(LL.some(s=>s.add&&Math.abs(s.x-Lp.x)<1),"чужая лампа — источник сложением");
  ok(CAVE_OWN_WGSL.includes("P.z>=0.")&&CAVE_MUL_WGSL.includes("dd<P.z"),"лампа сложением — радиус со знаком минус, множитель её пропускает");
  /* озеро: в кадре находится ближнее, вне кадра — нет */
  const Z=caveZones(C).find(z=>cavePool(C,z));
  ok(!!Z,"в пещере есть озеро");
  if(Z){
    const pl=cavePool(C,Z);
    const inV=cavePoolInView(C,(pl.x0+pl.x1)/2-vw/2,pl.y-vh/2);
    ok(inV===pl,"озеро посреди кадра найдено");
    eq(cavePoolInView(C,(pl.x0+pl.x1)/2-vw/2,pl.y+vh*3),null,"озеро далеко над кадром — не найдено");
  }
  /* темнота — тоном самой планеты, почти в ноль (caveDarkTone, как у main) */
  const dt=caveDarkTone();
  ok(dt.every(v=>v>0&&v<40/255),"тон темноты — у нуля ("+dt.map(v=>(v*255).toFixed(0)).join(",")+")");
  /* шейдер: поле объявлено, цикл по источникам ограничен таблицей */
  ok(CAVE_MUL_WGSL.includes("fn field(")&&CAVE_ADD_WGSL.includes("fn field("),"оба поля объявляют field");
  ok(CAVE_MUL_WGSL.includes("k<"+CAVE_LIT_MAX+";"),"цикл света ограничен CAVE_LIT_MAX");
  /* без видеокарты свет молчит, кадр не падает */
  const lg=T.ledger(()=>{C.x=500;C.y=caveFloor(C,500)-1;C.cy=null;drawCave();});
  ok(lg.calls>50,"кадр пещеры нарисован без видеокарты: вызовов канвы "+lg.calls);
  resetWorld();
}));

TEST_SUITES.push(()=>suite("шахта G7: лампы и резак — источники, копка пересобирает маску",()=>{
  resetWorld();
  landOnTestPlanet();
  enterDig();
  const D=G.dig;
  ok(!!D,"шахта открыта");
  /* лампы крепи — экранные точки кадра; источники — в мире, не больше восьми */
  const camx=D.col*DIG_CELL-W/2, camy=D.row*DIG_CELL-H*.5;
  D._lamps=[];for(let i=0;i<12;i++)D._lamps.push([W/2+(i-6)*20,H/2+i*3]);
  const L=digLights(D,camx,camy);
  eq(L.length,8,"источников не больше восьми: девятое место — числа шахты");
  ok(L.every(s=>Math.abs(s.x-camx-W/2)<=130&&s.y>camy),"лампы переведены в мир");
  ok(L.every((s,i)=>!i||L[i-1].k<=s.k),"ближние — первыми");
  /* кадр без видеокарты: свет молчит, собранные лампы не копятся из кадра в кадр */
  drawDig();drawDig();
  ok(!D._lamps||D._lamps.length===0,"лампы кадра сброшены после света");
  /* копнули — маска света помечена к пересборке */
  const v0=D.maskV|0;
  D.face=1;
  let dug=false;
  for(let i=0;i<600&&!dug;i++){keys.right=true;updateDig(1);if((D.maskV|0)>v0)dug=true;}
  keys.right=false;
  ok(dug,"выкопанная клетка поднимает D.maskV");
  resetWorld();
}));

/* тайлы пекутся на видеокарте: в Node их кадр не зовёт, поэтому художники тайлов
   прогоняются здесь напрямую — тем же договором, что у выпечки (W,H = тайл) */
TEST_SUITES.push(()=>suite("пещера и шахта G7: художники тайлов рисуют без ошибок",()=>{
  resetWorld();
  landOnTestPlanet();
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  const cp=G.surf.p;
  planetMatNow(cp);
  enterCave();
  const C=G.cave;
  const pW=W,pH=H;
  let lg;
  try{
    W=TILE;H=TILE;
    lg=T.ledger(()=>{for(const [x,y] of [[0,0],[512,0],[1024,512],[1536,-512]])drawCaveRock(C,cp,x,y);});
  }finally{W=pW;H=pH;}
  ok(lg.calls>200,"порода пещеры: четыре тайла, вызовов канвы "+lg.calls);
  exitCave();
  enterDig();
  const D=G.dig;
  try{
    W=TILE;H=TILE;
    lg=T.ledger(()=>{for(const [x,y] of [[-256,-256],[-256,256],[256,1024]])digRockPass(D,cp,x,y);});
  }finally{W=pW;H=pH;}
  ok(lg.calls>200,"порода шахты: три тайла, вызовов канвы "+lg.calls);
  resetWorld();
}));
