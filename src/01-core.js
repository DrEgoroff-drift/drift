"use strict";
/* Версия игры. Одна на всё: заставка, журнал, патчноуты (PATCHNOTES.md).
   К формату сохранения отношения не имеет — тот навсегда v:4. */
const VER="0.432.0";
/* ══════════════ математика ══════════════ */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
function hashi(x,y,s){
  let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177);
  return (h^(h>>>16))>>>0;
}
const h01=(x,y,s)=>hashi(x,y,s)/4294967296;
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
/* ══════════════ случай и часы игры (M441) ══════════════
   Игра обязана повторяться: одно семя и одни часы — один и тот же мир кадр в
   кадр. На этом стоит всё остальное: повтор падения по семени, сравнение
   кадров, запись прогона, облачная запись. Прятать подмену в тестах значило бы
   сделать повторимыми ТЕСТЫ и оставить ИГРУ на песке (DESIGN-tests §3.5).
   Поэтому сырые Math.random, Date.now, performance.now и new Date() без
   аргумента в src/ запрещены везде, кроме этого места (закон в build.ps1), и
   у каждого вызова есть хозяин:

   rnd()          — случай МИРА, [0,1): всё, что ложится в G, — бой, дроны,
                    баржи, эфир, таймеры режимов, даже если по смыслу это
                    звук или вид. Поток один, с семенем.
   rndFx()        — случай КАРТИНКИ: рисунок, звук, частицы вне G, речь птицы.
                    Отдельный поток: нарисован кадр или нет, rnd() от этого не
                    сдвигается. От rndFx не имеет права зависеть ничего в G, и
                    rnd() в draw-функциях запрещён тем же законом.
   rndSeed(s)     — пересеять оба потока (второй выводится из s).
   rndState()     — [семя, положение мира, положение картинки]: для stateHash.
   now()          — часы ИГРЫ, мс эпохи: метки в G, сроки, откаты, праздники по
                    календарю, офлайн-догон, час суток, тайминг рук. По
                    умолчанию — настоящие.
   clockSet(ms)   — прибить часы к виртуальному времени; clockSet(null) —
                    вернуть настоящие. clockAdvance(ms) двигает: прибитые —
                    вперёд, настоящие — сдвигом. clockPinned() — прибиты ли.
                    На прибитых часах кадр идёт постоянным шагом (28-loop):
                    сколько кадров — столько и времени, и никакого rAF.
   clockNow()     — то же, что now(), для мест, где имя now занято локальной
                    переменной или параметром (`const now=…`, `f(B,now)`).
   Настоящие часы там, где им и место, — под своими именами:
   wallMs()       — монотонные мс (performance.now): бюджеты печи «по работе И
                    по времени», prof(), look(), шаг кадра по rAF.
   wallNow()      — настоящие мс эпохи: метки журнала сбоев и пульса,
                    притормаживание сети, облака и почты, отметка записи для
                    облака (её сравнивают между устройствами).
   uidRand()      — [0,1) из crypto: то, что обязано быть единственным в мире
                    (вкладка, устройство), а не повторяться по семени.

   В игре оба потока сеются при загрузке от настоящих часов — игроку
   распределение то же, что было с Math.random. Ни семя, ни часы в запись не
   идут: это эфемерное (правило CLAUDE.md). Генератор тот же, что у rng()
   (mulberry32), только с состоянием в переменной, а не в замыкании. */
let RND_SEED=0,RND_S=0,RNDFX_S=0;
function rnd(){RND_S=RND_S+0x6D2B79F5|0;let t=Math.imul(RND_S^RND_S>>>15,1|RND_S);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}
function rndFx(){RNDFX_S=RNDFX_S+0x6D2B79F5|0;let t=Math.imul(RNDFX_S^RNDFX_S>>>15,1|RNDFX_S);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}
function rndSeed(s){RND_SEED=(+s||0)>>>0;RND_S=RND_SEED|0;RNDFX_S=hashi(RND_SEED,0x0F1C,0x441)|0;}
function rndState(){return [RND_SEED,RND_S>>>0,RNDFX_S>>>0];}
/* Фаза кадра: счётчики «раз в N кадров» живут в своих модулях вне G (пульт
   раз в секунду, редкий такт дронов), и если они переживают смену часов, то
   второй прогон одной сцены начинал бы с фазы первого — и писал в журнал на
   другом кадре. Модуль, чей счётчик трогает G, кладёт сюда свой сброс;
   clockSet (через loopReset в 28-loop) зовёт их все. */
const LOOP_PHASE=[];
let CLOCK_PIN=null,CLOCK_OFF=0;
function now(){return CLOCK_PIN===null?Date.now()+CLOCK_OFF:Math.floor(CLOCK_PIN);}
function clockNow(){return now();}
function clockPinned(){return CLOCK_PIN!==null;}
/* смена часов рвёт фазу кадра: шаг и редкий такт считаются заново (28-loop) */
function clockSet(ms){CLOCK_PIN=(ms==null)?null:+ms;CLOCK_OFF=0;
  if(typeof loopReset==="function")loopReset();}
function clockAdvance(ms){ms=+ms||0;if(CLOCK_PIN===null)CLOCK_OFF=Math.floor(CLOCK_OFF+ms);else CLOCK_PIN+=ms;}
function wallMs(){return (typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();}
function wallNow(){return Date.now();}
function uidRand(){
  try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
  catch(e){return Math.random();}
}
rndSeed(hashi(Date.now()%2147483647,Math.floor(Date.now()/2147483647),Math.floor(wallMs()*1000)));
/* ── русское согласование числительных (полировочный круг) ──
   По коду жило четыре самодельных склонения, и три врали: «1 прыжка»,
   «1 станция получили», стаж «21 ЛЕТ». Одна честная функция на всех:
   pl3(21,"прыжок","прыжка","прыжков") → «прыжок»; 11–14 — всегда много. */
function pl3(n,one,few,many){
  const m=Math.abs(n)%100,d=m%10;
  if(m>=11&&m<=14)return many;
  if(d===1)return one;
  if(d>=2&&d<=4)return few;
  return many;
}
function noise1(x,s){const i=Math.floor(x),f=x-i,t=f*f*(3-2*f);return lerp(h01(i,0,s),h01(i+1,0,s),t);}
function fbm1(x,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise1(x*f,s+i*131);n+=a;a*=.5;f*=2;}return v/n;}
function noise2(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(h01(xi,yi,s),h01(xi+1,yi,s),u),lerp(h01(xi,yi+1,s),h01(xi+1,yi+1,s),u),v);
}
function fbm2(x,y,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise2(x*f,y*f,s+i*97);n+=a;a*=.5;f*=2;}return v/n;}
/* ── синий шум: плитка порогов 64×64 (M250, DESIGN-craft §7) ──
   У белого шума есть низкие частоты — комки: точки сбиваются в пятна, и на
   ровной заливке это читается грязью. Синий комков не имеет ПО ПОСТРОЕНИЮ.
   Метод — последовательное заполнение «в самую большую пустоту»: каждая
   следующая точка ставится туда, где суммарная энергия уже поставленных
   минимальна (гаусс по тору, σ≈1.9), её ранг запоминается. Порог по рангу
   отбирает равномерную россыпь любой плотности. Считается один раз, лениво:
   ~17 млн сравнений, десятки миллисекунд. Детерминирован — открытка обязана
   рисоваться попиксельно одинаково. */
let BLUE_TAB=null;
function blueNoise(){
  if(BLUE_TAB)return BLUE_TAB;
  const S=64,N=S*S,E=new Float64Array(N),rank=new Float32Array(N),
        taken=new Uint8Array(N);
  const r=rng(hashi(0xB1DE,0x0157,1));
  for(let i=0;i<N;i++)E[i]=r()*1e-6;          /* посев рвёт ничьи, не форму */
  const R=6,K=[];
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)
    K.push([dx,dy,Math.exp(-(dx*dx+dy*dy)/(2*1.9*1.9))]);
  for(let n=0;n<N;n++){
    let bi=0,be=Infinity;
    for(let i=0;i<N;i++)if(!taken[i]&&E[i]<be){be=E[i];bi=i;}
    taken[bi]=1;rank[bi]=n/N;
    const bx=bi%S,by=(bi/S)|0;
    for(const q of K)E[((by+q[1]+S)%S)*S+((bx+q[0]+S)%S)]+=q[2];
  }
  return BLUE_TAB=rank;
}
/* Печётся заранее, в простое заставки: холодная выпечка стоит 77 мс (замер
   M251), и лениво она пришлась бы на ПЕРВЫЙ игровой кадр — спотык ровно в
   момент СТАРТ. Полсекунды после load хватает, чтобы не мешать открытию. */
if(typeof addEventListener==="function")
  addEventListener("load",()=>setTimeout(blueNoise,500));
/* ── поле направлений (M253, DESIGN-craft §2/§5) ──
   Угол потока в точке. Весь шум игры изотропен — у него нет направления, и
   волокно, царапину, залегание из него не получить в принципе. Поле берёт
   не сам fbm, а его ИЗОЛИНИИ: градиент повёрнут на четверть, линии тока идут
   вдоль изолиний — не пересекаются и текут согласованно, как причёсанные.
   sc — крупность (1/период в мировых px). Считается на точку при выпечке
   тайла или чанка, в кадре его звать незачем. */
function dirAt(x,y,s,sc){
  const f=(sc==null?1/240:sc),E=6;
  const a=fbm2((x+E)*f,y*f,s,4)-fbm2((x-E)*f,y*f,s,4);
  const b=fbm2(x*f,(y+E)*f,s,4)-fbm2(x*f,(y-E)*f,s,4);
  return Math.atan2(-a,b);
}
/* Разница углов, кратчайшей дугой. Прежняя формула — ((a-b+3π)%TAU)-π — верна
   ровно до тех пор, пока a-b не меньше -3π: остаток в JS берёт знак делимого,
   и на больших отрицательных разностях ответ уезжает и по знаку, и за пределы
   полуоборота. Курс корабля нигде не сворачивался и копился оборотами — в живом
   сохранении он дорос до -500 рад, и доворот вектора скорости к носу принялся
   разворачивать скорость в противоположную сторону. Корабль дёргался на месте
   под полной тягой и жёг топливо: ни ошибки, ни просадки кадров. */
const angWrap=x=>{const d=x%TAU;return d>Math.PI?d-TAU:(d<-Math.PI?d+TAU:d);};
const angDiff=(a,b)=>angWrap(a-b);

/* ══════════════ имена ══════════════ */
const S1=["ка","зе","вор","ти","мел","сар","ква","ар","ни","кси","лу","дра","он","пи","ха","ци","ур","гал","об","векс","сол","ит","кор","энт","ра","тау","ней","ом"];
const S2=["нис","тар","он","экс","ур","ал","иос","ат","ин","ора","икс","ун","эш","ара","орн","ил","аде","ий","от","ис","эль","ум"];
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function genName(r){let s=pick(S1,r);if(r()<.55)s+=pick(S1,r);s+=pick(S2,r);
  return s[0].toUpperCase()+s.slice(1);}

/* ══════════════ удалённость и настрой сектора ══════════════ */
function sysDanger(sx,sy){return clamp(Math.hypot(sx,sy)/40,0,1);}
function sysJitter(gx,gy){
  const jr=rng(hashi(gx,gy,55551));
  const a=jr()*TAU,rad=jr()*.42;
  return [Math.cos(a)*rad,Math.sin(a)*rad];
}
const DESC_MOOD=[
  {w:["тихий","забытый","сонный"],ok:s=>!s.station&&!s.belt},
  {w:["оживлённый","обжитой","многообещающий"],ok:s=>!!(s.station&&s.belt)},
  {w:["пограничный","неспокойный","дикий"],ok:s=>sysDanger(s.sx,s.sy)>.55},
  {w:["разведанный","картографированный"],ok:s=>!!s.station&&sysDanger(s.sx,s.sy)<=.55}
];
const DESC_TAIL=["сектор","рубеж","участок","угол галактики","карман пространства","закоулок"];
function genDesc(r,sys){
  const cands=DESC_MOOD.filter(m=>m.ok(sys));
  const pool=cands.length?cands:DESC_MOOD;
  const mood=pick(pick(pool,r).w,r);
  const tail=pick(DESC_TAIL,r);
  const bits=[mood[0].toUpperCase()+mood.slice(1)+" "+tail];
  const kinds=sys.planets.map(p=>p.T.ru).filter((v,i,a)=>a.indexOf(v)===i);
  if(kinds.length)bits.push(kinds.length+" "+pl3(kinds.length,"тип","типа","типов")+" миров: "+kinds.join(", "));
  if(sys.belt)bits.push("пояс богат "+sys.belt.res.map(k=>RES[k].ru.toLowerCase()).join(", "));
  if(sys.station)bits.push(sys.station.kind.toLowerCase());
  return bits.join(" · ");
}

/* ── цвет ──
   Три помощника, которыми красит вся игра: разбор #rrggbb, сборка rgba и
   смешение двух цветов. Жили в `03-ships`, потому что первым их завёл корпус;
   переехали сюда, когда тем же кодом стала краситься карта войны на сайте
   (`site/war.js` собирается из 01-core и не тянет корабли). */
function hex2rgb(h){
  h=h.replace("#","");
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
const rgba=(c,a)=>"rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+a+")";
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
