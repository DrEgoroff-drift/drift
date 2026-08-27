/* ══════════════ кэш статичного: чанки и слои ══════════════
   Замер 0.87 показал, где уходит кадр на поверхности: не в логике (≤4 мс),
   а в растре — полноэкранные заливки паттерном и градиентом под clip-путём
   из двухсот вершин, по десятку за кадр, и всё это на ретине вчетверо.
   При этом разрез грунта от кадра к кадру не меняется: камера его только
   двигает. То, что не меняется, рисуется один раз в offscreen и дальше
   кладётся одним drawImage.

   Два вида кэша:
   · chunkAt(store,k,...) — ломоть мира по X шириной CW, для длинных полос
     (грунт, свод пещеры); живёт, пока игрок рядом, старые вытесняются;
   · screenLayer(key,paint) — слой во весь экран, для того, что сидит в
     экранных координатах (зарево звезды, пелена погоды).

   Рисовальщик получает тот же глобальный ctx, W и H, что и обычный кадр —
   на время покраски они подменяются (withCtx), поэтому существующие
   функции рисуют в чанк, не зная об этом. */

const CHUNK_W=512;        // ширина ломтя в мировых пикселях
const CHUNK_KEEP=7;       // сколько ломтей держать (W/CW+2 на экран плюс запас)

/* ── МАСШТАБ МИРА ПО РАЗМЕРУ ОКНА (M217) ──
   Камера поверхности была приклеена к пикселю: чем больше окно, тем больше
   мира в кадре и тем мельче всё, что в нём живёт. Человек — 26 px, то есть
   3.6% кадра в 720 и 1.8% на 1440p: чем лучше монитор, тем труднее себя найти.
   Мерка обязана быть долей кадра, а не пикселем.

   Поэтому мир рисуется через ctx-масштаб, а W и H на время рисования
   становятся тем, сколько мира видно (W/k, H/k). Ни одна функция внутри об
   этом не знает: отсечения, SURF_HOR, «мерка экрана» дальней гряды — всё
   считается по видимому миру и остаётся верным. Тот же приём, что у withCtx.

   Растр при этом обязан печься ПЛОТНЕЕ, иначе весь выигрыш съедается мылом:
   SCK — во сколько раз плотнее CSS-пикселя печётся кэш. Он входит в ключ
   каждого хранилища, чтобы ломоть, испечённый под другой масштаб, не всплыл
   растянутым. Плотность ограничена сверху (RAST_MAX): на ретине DPR уже даёт
   вдвое, и печь вчетверо — это память гигабайтами за разницу, которой не
   видно. */
let SCK=1;
const RAST_MAX=3;
function withScale(k,fn){
  if(!(k>1))return fn();
  const pW=W,pH=H,pS=SCK;
  ctx.save();ctx.scale(k,k);
  W=W/k;H=H/k;SCK=pS*Math.min(k,Math.max(1,RAST_MAX/DPR));
  try{fn();}finally{ctx.restore();W=pW;H=pH;SCK=pS;}
}

/* подмена холста: fn рисует так, будто экран размером w×h и начало — в
   мировой точке (ox,oy) */
function withCtx(cn,w,h,ox,oy,fn){
  const pc=ctx,pW=W,pH=H;
  const g=cn.getContext("2d");
  ctx=g;W=w;H=h;
  g.setTransform(DPR*SCK,0,0,DPR*SCK,0,0);
  g.clearRect(0,0,w,h);
  try{fn(g,ox,oy);}finally{ctx=pc;W=pW;H=pH;}
}
function mkCanvas(w,h){
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(w*DPR*SCK));cn.height=Math.max(1,Math.round(h*DPR*SCK));
  return cn;
}
/* хранилище ломтей: {key, top, ch, map:Map<k,canvas>, order:[k...]}.
   key — от чего зависит картинка (планета, DPR, высота); сменился — всё вон */
function chunkStore(store,key,top,ch){
  key+="~"+SCK;   /* испечённое под другой масштаб мира не переиспользуется */
  if(!store||store.key!==key||store.ch!==ch||store.top!==top)
    store={key,top,ch,sck:SCK,map:new Map(),order:[]};
  return store;
}
function chunkAt(store,k,paint){
  let cn=store.map.get(k);
  if(cn)return cn;
  cn=mkCanvas(CHUNK_W,store.ch);
  withCtx(cn,CHUNK_W,store.ch,k*CHUNK_W,store.top,paint);
  store.map.set(k,cn);store.order.push(k);
  while(store.order.length>CHUNK_KEEP)store.map.delete(store.order.shift());
  return cn;
}
/* выложить ломти под камеру: paint(g,wx0,wy0) красит мир в диапазоне
   [wx0,wx0+CW)×[wy0,wy0+ch) в координатах экрана-ломтя */
function drawChunks(store,camx,camy,paint){
  const k0=Math.floor(camx/CHUNK_W),k1=Math.floor((camx+W)/CHUNK_W);
  for(let k=k0;k<=k1;k++){
    const cn=chunkAt(store,k,paint);
    ctx.drawImage(cn,k*CHUNK_W-camx,store.top-camy,CHUNK_W,store.ch);
  }
}

/* слои во весь экран: ключ описывает всё, от чего зависит картинка */
const SCREEN_LAYERS=new Map();
function screenLayer(key,paint){
  const full=key+"|"+W+"x"+H+"@"+DPR+"~"+SCK;
  let cn=SCREEN_LAYERS.get(full);
  if(cn)return cn;
  cn=mkCanvas(W,H);
  withCtx(cn,W,H,0,0,paint);
  SCREEN_LAYERS.set(full,cn);
  if(SCREEN_LAYERS.size>12)SCREEN_LAYERS.delete(SCREEN_LAYERS.keys().next().value);
  return cn;
}

/* ── тайлы в двух измерениях ──
   Ломоть по X годится для полосы; пещера (22) тянется и вниз, и тайл у неё
   квадратный. Тот же договор: paint(g,wx0,wy0) красит мир в квадрате
   [wx0,wx0+TILE)×[wy0,wy0+TILE) в координатах тайла. Держим столько, чтобы
   хватило на экран 1920 с запасом; старые вытесняются по порядку. */
const TILE=512, TILE_KEEP=20;
function tileStore(store,key){
  key+="~"+SCK;
  if(!store||store.key!==key)store={key,sck:SCK,map:new Map(),order:[]};
  return store;
}
function tileAt(store,kx,ky,paint){
  const k=kx+","+ky;
  let cn=store.map.get(k);
  if(cn)return cn;
  cn=mkCanvas(TILE,TILE);
  withCtx(cn,TILE,TILE,kx*TILE,ky*TILE,paint);
  store.map.set(k,cn);store.order.push(k);
  while(store.order.length>TILE_KEEP)store.map.delete(store.order.shift());
  return cn;
}
function drawTiles(store,camx,camy,paint){
  const kx0=Math.floor(camx/TILE),kx1=Math.floor((camx+W)/TILE);
  const ky0=Math.floor(camy/TILE),ky1=Math.floor((camy+H)/TILE);
  for(let ky=ky0;ky<=ky1;ky++)for(let kx=kx0;kx<=kx1;kx++){
    const cn=tileAt(store,kx,ky,paint);
    ctx.drawImage(cn,kx*TILE-camx,ky*TILE-camy,TILE,TILE);
  }
}
