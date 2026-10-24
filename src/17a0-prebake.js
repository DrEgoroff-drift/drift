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
   генератора освобождает недопечённое. PB_MAX — самый долгий шаг по ключу (мс), для ворот.
   PB_PX — второй бюджет, видеокарты: мс JS шага выпечки — это запись команд, а сама выпечка 1024² MSAA
   идёт на GPU; четыре таких в кадре дали на S23 кадр 67 мс при JS 3–5 мс (26.09). Кадр начинает новый
   шаг, только пока испёк меньше PB_PX точек (GC_PX, 08ca) — крупная (от полумиллиона точек: гостиница, её свечение) одна на кадр.
   И не больше одной выпечки за кадр вообще (GPU.bakeN, ворота ступени 1, 26.09): у каждой свой submit, тур
   docs/tour.py краснеет на двух в одном кадре — мелкие проходили по две–четыре */
const PB_MS=4,PB_PX=1<<19,PB_CAP=64,PB_KEEP=6,PB_STALE=120,PB=new Map(),PB_MAX={};
let PB_F=-1,PB_T=0,PB_N=0,PB_SYNC=0,PB_PX0=0,PB_B0=0;
function prebakeDrop(key){const J=PB.get(key);if(!J)return;PB.delete(key);try{J.it.return();}catch(e){}}
function prebake(key,make,sync){
  if(GPU.frameNo!==PB_F){PB_F=GPU.frameNo;PB_T=0;PB_N=0;PB_PX0=GC_PX;PB_B0=GPU.bakeN|0;
    for(const [k,J] of [...PB])if(PB_F-J.f>PB_STALE)prebakeDrop(k);}
  let J=PB.get(key);
  if(J&&J.dev!==GPU.dev){prebakeDrop(key);J=null;}
  if(!J){
    if(!GPU.dev)return null;
    while(PB.size>=PB_KEEP)prebakeDrop(PB.keys().next().value);
    J={it:make(),dev:GPU.dev,f:PB_F};PB.set(key,J);}
  J.f=PB_F;
  if(sync)PB_SYNC++;
  while(sync||PB_N<PB_CAP&&(PB_N===0||PB_T<PB_MS&&GC_PX-PB_PX0<PB_PX&&(GPU.bakeN|0)===PB_B0)){
    const t0=wallMs();let r;
    try{r=J.it.next();}catch(e){PB.delete(key);throw e;}
    const dt=wallMs()-t0;PB_T+=dt;PB_N++;if(!(PB_MAX[key]>=dt))PB_MAX[key]=dt;
    if(r.done){PB.delete(key);return r.value||null;}
  }
  return null;
}
/* виден ли прямоугольник экрана [x,y,w,h] — и «в экране от края» (m — доля экрана запаса) */
function pbOnScreen(x,y,w,h,m){const mx=W*(m||0),my=H*(m||0);return x<W+mx&&x+w>-mx&&y<H+my&&y+h>-my;}

/* ══════════════ заготовки наперёд: общий бюджет кадра (24.10) ══════════════
   Зал станции, набор флоры, вещи у входа цели, пещера у устья — каждая заготовка жила своим бюджетом и своим
   ходом (3 мс через кадр, 2 мс раз в четыре, 3 мс каждый кадр): в кадре, где сходились две, они складывались, и
   ни одна не знала, во что уже обошёлся кадр. Теперь их зовёт одно место — workPump, раз за кадр, по порядку
   важности, и все вместе они тратят не больше WORK_MS. Бюджет — то, что осталось кадру: прошлый кадр без
   заготовок (FRAME_JS - WORK_T) вычитается из WORK_JS, так что на телефоне, где кадр и без них тяжёл,
   заготовкам достаётся меньше, на ПК — полный. Часы свои у каждой машины: мс телефона — мс телефона.
   Работник: step(ms) — шагает, пока следующий шаг (судя по прошлому) влезает в ms, и отвечает, сделал ли
   что-то; when() — его режим. Шаг не делится, поэтому работник, кому бюджета не досталось, всё равно
   получает ход раз в WORK_STARVE кадров — иначе тяжёлый кадр не дал бы заготовке кончиться никогда.
   WORK_MAX[имя] — самый долгий ход работника (мс), для ворот и замеров */
const WORK=[],WORK_MS=3,WORK_LO=.5,WORK_JS=10,WORK_STARVE=20,WORK_MAX={};
let WORK_F=0,WORK_T=0;
function workAdd(name,prio,when,step){WORK.push({name,prio,when,step,f:0});WORK.sort((a,b)=>a.prio-b.prio);}
function workPump(){
  WORK_F++;
  const t0=wallMs();let left=Math.min(WORK_MS,Math.max(WORK_LO,WORK_JS-(FRAME_JS-WORK_T)));
  for(const w of WORK){
    if(!w.when())continue;
    if(left<WORK_LO&&WORK_F-w.f<WORK_STARVE)continue;
    const a=wallMs(),go=w.step(Math.max(left,WORK_LO)),dt=wallMs()-a;
    left-=dt;
    if(go){w.f=WORK_F;if(!(WORK_MAX[w.name]>=dt))WORK_MAX[w.name]=dt;}
  }
  WORK_T=wallMs()-t0;
}
