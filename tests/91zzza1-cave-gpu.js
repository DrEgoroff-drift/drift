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
  /* источники: у устья первым — день, дальше не больше девяти, все в кадре */
  const vw=W,vh=H;
  let sawDay=false,maxN=0;
  for(const x of [80,500,900,1400,1900]){
    const camx=x-vw/2,camy=caveFloor(C,x)-vh*.56;
    const L=caveLights(C,camx,camy);
    maxN=Math.max(maxN,L.length);
    ok(L.length<=CAVE_LIT_MAX,"источников не больше "+CAVE_LIT_MAX+" (x="+x+": "+L.length+")");
    ok(L.every(s=>s.x+s.r>=camx&&s.x-s.r<=camx+vw&&s.y+s.r>=camy&&s.y-s.r<=camy+vh),"каждый задевает кадр (x="+x+")");
    ok(L.every((s,i)=>!i||L[i-1].k<=s.k),"ближние к середине — первыми (x="+x+")");
    ok(L.every(s=>isFinite(s.x)&&isFinite(s.y)&&s.r>0&&s.I>0),"у источника есть место, радиус и сила (x="+x+")");
    if(x===80&&L.length&&L[0].r>300)sawDay=true;
  }
  ok(sawDay,"у устья первым идёт дневной свет");
  ok(maxN>=2,"в пещере светит не один фонарь: источников в кадре до "+maxN);
  /* темнота холодная: фонарь остаётся единственным тёплым */
  const am=caveAmbient();
  ok(am[2]>am[0]&&am.every(v=>v>0&&v<1),"окружающий свет холодный и меньше единицы ("+am.map(v=>v.toFixed(2)).join(",")+")");
  /* шейдер: поле объявлено, цикл по источникам ограничен таблицей */
  ok(CAVE_MUL_WGSL.includes("fn field(")&&CAVE_ADD_WGSL.includes("fn field("),"оба поля объявляют field");
  ok(CAVE_MUL_WGSL.includes("k<"+CAVE_LIT_MAX+";"),"цикл света ограничен CAVE_LIT_MAX");
  /* без видеокарты свет молчит, кадр не падает */
  const lg=T.ledger(()=>{C.x=500;C.y=caveFloor(C,500)-1;C.cy=null;drawCave();});
  ok(lg.calls>50,"кадр пещеры нарисован без видеокарты: вызовов канвы "+lg.calls);
  resetWorld();
}));
