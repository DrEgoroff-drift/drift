/* ══════════════ печка корпуса (Stage 0, 18.09) ══════════════
   Корпус — самая дорогая по числу вызовов вещь в кадре: ~800 штрихов и
   заливок рисуют одно и то же тело каждый кадр, а меняются у него только
   поворот, крен и живое поверх (факелы, огни, бегущая строка, венцы). Здесь
   неподвижные куски 03e (hullPart1..3) печём в картинку в размере экрана и
   кладём одним drawImage; поворот и сжатие крена даёт текущая матрица.

   Чем платим и почему это та же картинка:
   • масштаб — ступенями в четверть октавы, печём на верхнем краю ступени и
     кладём с уменьшением не больше ×1.19: растяжения нет никогда;
   • крен двигает по корпусу блик хребта (hullPart1) — он в ключе, шагом
     .05 рад: сдвиг блика за шаг меньше пикселя, а блик мягкий;
   • налёт в ключе шагом 1/64, швы и метка «Сороки» — как есть.
   Корпус плотный (закрашено больше половины квадрата), поэтому печь его
   выгодно — в отличие от лучей звезды (GOTCHAS: bake what fills its box).
   Слишком крупный план (карточки, экраны) печётся тоже, пока сторона
   картинки не больше HB_MAX; дальше — рисуем по-старому. */
const HB_MAX=1600, HB_PER_HULL=48;
const HULL_BAKES=new WeakMap();     // h → Map(ключ → запечённый слой)
const HULL_BOX=new WeakMap();       // h → Map(масштаб|слои → рамка в мировых)
let HB_STATS={hit:0,bake:0,skip:0};
function hullBakeScale(){
  const m=ctx.getTransform();
  return Math.hypot(m.a,m.b);
}
function hullBakeDraw(h,id,bank){
  if(G.opts&&G.opts.gfx&&G.opts.gfx.hullBake===0)return false;
  const s=hullBakeScale();
  if(!(s>0))return false;
  const sb=Math.pow(2,Math.ceil(Math.log2(s)*4)/4);
  const ticks=(h.outs||[]).some(o=>o.k==="runline");
  const crowns=(typeof drawCrowns==="function")&&id===G.shipId&&G.crowns&&
    NODE_FAMS.some(f=>G.crowns[f.id]);
  const bq=Math.round(bank*20);
  const common=sb+"|"+Math.round(wearOf(id)*64)+"|"+(typeof seamsOf==="function"?seamsOf(id):0)+
    "|"+(typeof cosmOn==="function"?cosmOn("mark"):"");
  /* слои между живыми вставками: [1] строка [2] венцы [3]; без вставок слои сливаются */
  const layers=[];
  let cur=[1];
  if(ticks){layers.push(cur);cur=[];}
  cur.push(2);
  if(crowns){layers.push(cur);cur=[];}
  cur.push(3);layers.push(cur);
  const baked=[];
  for(const L of layers){
    const key=L.join("")+"|"+common+(L[0]===1?"|"+bq:"");
    const b=hullBakeGet(h,id,bank,L,sb,key);
    if(!b){HB_STATS.skip++;return false;}
    baked.push(b);
  }
  for(let i=0;i<layers.length;i++){
    const b=baked[i];
    ctx.drawImage(b.cv,b.x,b.y,b.w,b.h);
    if(i<layers.length-1){
      const next=layers[i+1][0];
      if(next===2)makerLive(h);
      else if(next===3)drawCrowns(h,id);
    }
  }
  return true;
}
function hullBakeGet(h,id,bank,L,sb,key){
  let M=HULL_BAKES.get(h);
  if(!M){M=new Map();HULL_BAKES.set(h,M);}
  let b=M.get(key);
  if(b){HB_STATS.hit++;return b;}
  const boxKey=sb+"|"+L.join("");
  let BM=HULL_BOX.get(h);
  if(!BM){BM=new Map();HULL_BOX.set(h,BM);}
  let box=BM.get(boxKey);
  if(!box){
    /* рамку ищем один раз на масштаб: печём с запасом и смотрим, где краска */
    const E=Math.max(h.nose,-h.tail,h.bw*3)*1.6+8;
    const side=Math.ceil(E*2*sb);
    if(side>HB_MAX*2)return null;
    const probe=hullBakeRender(h,id,bank,L,sb,-E,-E,side,side);
    box=hullInkBox(probe,sb,-E,-E);
    if(!box)return null;
    BM.set(boxKey,box);
  }
  const W=Math.ceil(box.w*sb),H=Math.ceil(box.h*sb);
  if(W>HB_MAX||H>HB_MAX)return null;
  const cv=hullBakeRender(h,id,bank,L,sb,box.x,box.y,W,H);
  b={cv,x:box.x,y:box.y,w:W/sb,h:H/sb};
  if(M.size>=HB_PER_HULL)M.clear();
  M.set(key,b);HB_STATS.bake++;
  return b;
}
/* нарисовать слои L в холст W×H: мировая точка (x0,y0) — в левом верхнем углу */
function hullBakeRender(h,id,bank,L,sb,x0,y0,W,H){
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const prev=ctx;ctx=cv.getContext("2d");
  try{
    ctx.setTransform(sb,0,0,sb,-x0*sb,-y0*sb);
    if(L.includes(1))hullPart1(h,id,bank,false);
    if(L.includes(2))hullPart2(h);
    if(L.includes(3))hullPart3(h,id);
  }finally{ctx=prev;}
  return cv;
}
/* рамка краски с полем в два пикселя; краска у самой кромки пробы — значит
   проба мала, и тогда не печём вовсе, чем отрежем кусок корпуса */
function hullInkBox(cv,sb,x0,y0){
  const W=cv.width,H=cv.height,d=cv.getContext("2d").getImageData(0,0,W,H).data;
  let a=W,b=H,c=-1,e=-1;
  for(let y=0;y<H;y++){
    const r=y*W*4;
    for(let x=0;x<W;x++)if(d[r+x*4+3]){if(x<a)a=x;if(x>c)c=x;if(y<b)b=y;if(y>e)e=y;}
  }
  if(c<0)return null;
  if(a===0||b===0||c===W-1||e===H-1)return null;
  a=Math.max(0,a-2);b=Math.max(0,b-2);c=Math.min(W-1,c+2);e=Math.min(H-1,e+2);
  return {x:x0+a/sb,y:y0+b/sb,w:(c-a+1)/sb,h:(e-b+1)/sb};
}
