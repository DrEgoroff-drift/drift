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

/* подмена холста: fn рисует так, будто экран размером w×h и начало — в
   мировой точке (ox,oy) */
function withCtx(cn,w,h,ox,oy,fn){
  const pc=ctx,pW=W,pH=H;
  const g=cn.getContext("2d");
  ctx=g;W=w;H=h;
  g.setTransform(DPR,0,0,DPR,0,0);
  g.clearRect(0,0,w,h);
  try{fn(g,ox,oy);}finally{ctx=pc;W=pW;H=pH;}
}
function mkCanvas(w,h){
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(w*DPR));cn.height=Math.max(1,Math.round(h*DPR));
  return cn;
}
/* хранилище ломтей: {key, top, ch, map:Map<k,canvas>, order:[k...]}.
   key — от чего зависит картинка (планета, DPR, высота); сменился — всё вон */
function chunkStore(store,key,top,ch){
  if(!store||store.key!==key||store.ch!==ch||store.top!==top)
    store={key,top,ch,map:new Map(),order:[]};
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
  const full=key+"|"+W+"x"+H+"@"+DPR;
  let cn=SCREEN_LAYERS.get(full);
  if(cn)return cn;
  cn=mkCanvas(W,H);
  withCtx(cn,W,H,0,0,paint);
  SCREEN_LAYERS.set(full,cn);
  if(SCREEN_LAYERS.size>12)SCREEN_LAYERS.delete(SCREEN_LAYERS.keys().next().value);
  return cn;
}
