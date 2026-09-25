/* ══════════════ печь заранее: общий планировщик (GPU-3, 25.09, DESIGN-gpu) ══════════════
   Тяжёлая выпечка (гостиница, мастер станции) — генератор шагов: шаг — кусок кисти или одна
   выпечка GPU-холста. Кадр отдаёт всем задачам вместе PB_MS мс; вещь, что ещё за краем
   экрана, зовёт prebake каждый кадр и выходит на глаза готовой. Шаг не делится: бюджет решает
   только, начинать ли следующий. Первый шаг кадра идёт всегда — иначе задача, что не влезает
   в бюджет, не кончилась бы; потолок PB_CAP шагов — на случай стоящих часов (стенд тестов).
   prebake(key,make,sync) → значение (return генератора) или null, пока не готово. sync — вещь
   уже на экране (выход из дока, загрузка, резкий поворот): проявления из пустоты быть не
   должно, допекаем в этом кадре целиком и считаем PB_SYNC. Готовое здесь не хранится — держит
   владелец; тут живут только незаконченные. Брошенная задача (ключ сменился, устройство
   потеряно, её не звали PB_STALE кадров, их больше PB_KEEP) закрывается it.return(): finally
   генератора освобождает недопечённое. PB_MAX — самый долгий шаг по ключу (мс), для ворот */
const PB_MS=4,PB_CAP=64,PB_KEEP=6,PB_STALE=120,PB=new Map(),PB_MAX={};
let PB_F=-1,PB_T=0,PB_N=0,PB_SYNC=0;
function prebakeDrop(key){const J=PB.get(key);if(!J)return;PB.delete(key);try{J.it.return();}catch(e){}}
function prebake(key,make,sync){
  if(GPU.frameNo!==PB_F){PB_F=GPU.frameNo;PB_T=0;PB_N=0;
    for(const [k,J] of [...PB])if(PB_F-J.f>PB_STALE)prebakeDrop(k);}
  let J=PB.get(key);
  if(J&&J.dev!==GPU.dev){prebakeDrop(key);J=null;}
  if(!J){
    if(!GPU.dev)return null;
    while(PB.size>=PB_KEEP)prebakeDrop(PB.keys().next().value);
    J={it:make(),dev:GPU.dev,f:PB_F};PB.set(key,J);}
  J.f=PB_F;
  if(sync)PB_SYNC++;
  while(sync||PB_N<PB_CAP&&(PB_N===0||PB_T<PB_MS)){
    const t0=wallMs();let r;
    try{r=J.it.next();}catch(e){PB.delete(key);throw e;}
    const dt=wallMs()-t0;PB_T+=dt;PB_N++;if(!(PB_MAX[key]>=dt))PB_MAX[key]=dt;
    if(r.done){PB.delete(key);return r.value||null;}
  }
  return null;
}
/* виден ли прямоугольник экрана [x,y,w,h] — и «в экране от края» (m — доля экрана запаса) */
function pbOnScreen(x,y,w,h,m){const mx=W*(m||0),my=H*(m||0);return x<W+mx&&x+w>-mx&&y<H+my&&y+h>-my;}
