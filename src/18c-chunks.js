/* ══════════════ масштаб мира ══════════════
   Здесь жил кэш статичного 2D: ломти мира по X (chunkStore/chunkAt/drawChunks — разрез грунта)
   и слои во весь экран (screenLayer — зарево звезды, пелена погоды). С M807b их нет: без
   видеокарты поверхности нет, грунт, свет и погоду кладёт движок (21p*). Имена остались
   заглушками — их зовут только запертые 19-mode-landing-ground, 19c-light (gradePass) и
   19d-weather (drawWeather) на старом пути drawLanding (?pln=0, без устройства); ждёт
   разблокировки автора. Живое здесь — withScale (мера мира по окну), uiK/uiFont (кегль)
   и CHUNK_W (ширина ломтя, её читает и 19c1-cast). Выпечки 20ab/21bc/21fa — на GPU-холсте
   (08ca gpuBake); withCtx снят. Приборы на #ovl — withFrame (W/H без кисти #c); withScale
   пишет LIFE_XF для lifeHere (наклейки plnOver.old) и на GPU не трогает MAIN_CTX. */

const CHUNK_W=512;        // ширина ломтя в мировых пикселях

/* ── МАСШТАБ МИРА ПО РАЗМЕРУ ОКНА (M217) ──
   Камера поверхности была приклеена к пикселю: чем больше окно, тем больше
   мира в кадре и тем мельче всё, что в нём живёт. Человек — 26 px, то есть
   3.6% кадра в 720 и 1.8% на 1440p: чем лучше монитор, тем труднее себя найти.
   Мерка обязана быть долей кадра, а не пикселем.

   Поэтому мир рисуется через ctx-масштаб, а W и H на время рисования
   становятся тем, сколько мира видно (W/k, H/k). Ни одна функция внутри об
   этом не знает: отсечения, SURF_HOR, «мерка экрана» дальней гряды — всё
   считается по видимому миру и остаётся верным.

   Растр при этом обязан печься ПЛОТНЕЕ, иначе весь выигрыш съедается мылом:
   SCK — во сколько раз плотнее CSS-пикселя печётся кэш. Он входит в ключ
   каждого хранилища, чтобы ломоть, испечённый под другой масштаб, не всплыл
   растянутым. Плотность ограничена сверху (RAST_MAX): на ретине DPR уже даёт
   вдвое, и печь вчетверо — это память гигабайтами за разницу, которой не
   видно. */
let SCK=1;
const RAST_MAX=3;
/* масштаб мира для lifeHere (20fa): на GPU — здесь, без scale на MAIN_CTX */
let LIFE_XF={x:0,y:0,s:1};
function withScale(k,fn){
  if(!(k>1))return fn();
  const pW=W,pH=H,pS=SCK,px=LIFE_XF.x,py=LIFE_XF.y,ps=LIFE_XF.s;
  LIFE_XF={x:LIFE_XF.x,y:LIFE_XF.y,s:LIFE_XF.s*k};
  /* без видеокарты старый путь всё ещё читает матрицу ctx (запертый грунт) */
  if(!GPU.on){ctx.save();ctx.scale(k,k);}
  W=W/k;H=H/k;SCK=pS*Math.min(k,Math.max(1,RAST_MAX/DPR));
  try{fn();}finally{
    if(!GPU.on)ctx.restore();
    W=pW;H=pH;SCK=pS;LIFE_XF={x:px,y:py,s:ps};
  }
}
/* та же доля окна, что withScale, без save/scale на MAIN_CTX — приборам на #ovl
   матрица ctx не нужна, а scale будил бы хук #c без рисунка */
function withFrame(k,fn){
  if(!(k>1))return fn();
  const pW=W,pH=H,pS=SCK;
  W=W/k;H=H/k;SCK=pS*Math.min(k,Math.max(1,RAST_MAX/DPR));
  try{fn();}finally{W=pW;H=pH;SCK=pS;}
}
/* ── линейка в начертании (M443) ──
   Подпись, привязанная к миру (имя станции под корпусом, планеты под диском),
   в withScale не заворачивается — её место считает мир, а не рамка. Растёт
   тогда кегль и отступ от тела: тот же приём, что mapFont у карты (M437).
   Детектор кегля (tests/90b-detect) меряет это в кадре 2560×1440. */
function uiK(){return (typeof UIK==="number"&&UIK>1)?UIK:1;}
function uiFont(px){return (px*uiK()).toFixed(1)+"px ui-monospace,monospace";}

/* 1×1-холст для заглушек ломтя/слоя (chunkAt/screenLayer): без выпечек withCtx */
function mkCanvas(w,h){
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(w*DPR*SCK));cn.height=Math.max(1,Math.round(h*DPR*SCK));
  return cn;
}
/* ── ломти и экранные слои 2D сняты (M807b) — заглушки для запертого старого пути ──
   Вернуть то, что вызывающий ждёт по форме (хранилище с top/ch, холст), чтобы старый путь
   не падал, а рисовал пусто: ждёт разблокировки автора. */
let NO_LAYER=null;
function noLayer(){return NO_LAYER||(NO_LAYER=mkCanvas(1,1));}
function chunkStore(store,key,top,ch){return {key,top,ch};}
function chunkAt(){return noLayer();}
function drawChunks(){}   /* заглушка для ворот 2D / запертого грунта (M807b) */
function screenLayer(){return noLayer();}
