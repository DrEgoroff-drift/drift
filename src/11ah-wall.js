/* ══════════════ стена, которая помнит ══════════════
   M210. M171 положил в игру первую вещь, оставленную ЖИВЫМ человеком, — знак
   у корабля и груз под ним. И записал себе в долг: «только поверхность несёт
   знак; стена посёлка и устье пещеры взяли бы по своему». Долг простоял
   с 0.137.0, и M194 обошёл его стороной, сделав из игрока источник слухов.
   Вот он, и вот почему его стоило делать не так, как тайник.

   ТАЙНИК ИСЧЕЗАЕТ, СТЕНА КОПИТ. Знак у корабля виден ровно до того, как его
   подняли, — то есть почти никогда: он либо ещё не оставлен, либо уже унесён.
   Из-за этого главное чувство M171 — «тут был кто-то живой» — доставалось
   игроку в лучшем случае раз за много посадок. На стене знаки НАКАПЛИВАЮТСЯ.
   Двадцать четыре чужих руки на камне — это не двадцать четыре награды, это
   ОДНА, и она сильнее всех тайников: место, где до тебя стояли люди.

   ПОЧЕМУ ДВЕНАДЦАТЬ, А НЕ ДВАДЦАТЬ ЧЕТЫРЕ. Первый счёт держал два десятка, и
   на снимке стенда они превратились в кашу из царапин: человек в этом мире
   ростом в 26 пикселей, лицо камня — вдвое меньше, и знак получался в три
   пикселя. Двенадцать РАЗБОРЧИВЫХ рук говорят «тут стояли люди» сильнее, чем
   двадцать четыре неразборчивых. И число в подсказке при этом не врёт: на
   камне ровно столько, сколько сказано.

   БРАТЬ НЕЧЕГО И КЛАСТЬ НЕЧЕГО. Ни груза, ни цены, ни счёта. Тайник без цены
   выродился бы в доску объявлений (M171 это уже проверил); стена без цены не
   вырождается ни во что, потому что на ней нельзя ничего получить. Один знак
   на стену от одного человека — стена собственных подписей была бы не записью
   о людях, а тщеславием.

   ЧТО УХОДИТ ПО ПРОВОДУ: номер знака (один из двенадцати, выведен из метки
   пилота — не выбран и не объяснён) и шестизначная рука. Ни имени, ни времени,
   ни места отправителя. Обратно приходит то же самое плюс признак «этот твой».
   Признание — рука и ничего больше, как и было решено в M171: всё, что больше,
   становится списком друзей.

   ПРАВИЛА ФАЙЛА:
   1. Стена НЕ ЛОЖИТСЯ В СОХРАНЕНИЕ. Она живёт на сервере и в памяти вкладки;
      сохранённая, она врала бы про мир, которого уже нет.
   2. Офлайн этой вещи не существует — ни кнопки, ни пустой стены, ни намёка.
      Пустая стена, которая «иногда работает», хуже, чем никакой.
   3. Один запрос на приход в место, как у следа и у почты. */
const WALL_MAX=12;
const WALL_S="s", WALL_C="c";              /* стена посёлка · устье пещеры */
const WALL_KIND_RU={s:"стене посёлка",c:"устье пещеры"};
/* в памяти вкладки, а не в G: см. правило 1 */
const WALL_CACHE=new Map();
let wallBusy=0;

function wallOn(){return typeof traceOn==="function"&&traceOn();}
function wallCall(op,body){
  return traceCall(op,Object.assign({},body||{}));
}
/* ключ места — тот же, что у следа: стена принадлежит МЕСТУ, а не планете.
   Два посёлка на одном мире — две разные стены, и это правильно */
function wallKeyHere(){
  return (typeof placeKeyHere==="function")?placeKeyHere():null;
}
function wallCacheKey(kind,key){return kind+"|"+key;}
function wallHere(kind){
  const key=wallKeyHere();
  if(!key)return null;
  return WALL_CACHE.get(wallCacheKey(kind,key))||null;
}
/* ── спросить стену ──
   Зовётся при входе в место, один раз, а не каждый кадр. Пока ответа нет,
   стены нет: рисовать «загрузку» на камне не станем — камень не грузится */
function wallAsk(kind){
  if(!wallOn())return;
  const key=wallKeyHere();
  if(!key)return;
  const ck=wallCacheKey(kind,key);
  if(WALL_CACHE.has(ck))return;
  const now=clockNow();
  if(now-wallBusy<15000)return;
  wallBusy=now;
  /* заглушка на время ответа: без неё каждый кадр слал бы новый запрос */
  WALL_CACHE.set(ck,{list:[],mine:false,pending:true});
  wallCall("wall",{key:key,w:kind}).then(j=>{
    if(!j||!j.ok||!Array.isArray(j.w)){WALL_CACHE.delete(ck);return;}
    wallStore(ck,j.w);
  }).catch(()=>WALL_CACHE.delete(ck));
}
function wallStore(ck,arr){
  const list=[];let mine=false;
  for(const t of arr.slice(0,WALL_MAX)){
    if(!t||typeof t.m!=="number")continue;
    if(!/^[a-f0-9]{6}$/.test(String(t.h||"")))continue;
    if(t.me)mine=true;
    list.push({m:t.m|0,h:String(t.h),me:!!t.me});
  }
  WALL_CACHE.set(ck,{list,mine,pending:false});
}
/* ── расписаться ──
   Один раз на стену. Отказ сервера («ваш знак тут уже есть») — не ошибка, а
   ответ, и говорится он тем же спокойным голосом */
function wallCanSign(kind){
  const w=wallHere(kind);
  return !!(wallOn()&&w&&!w.pending&&!w.mine);
}
function wallSign(kind){
  const key=wallKeyHere();
  if(!key||!wallCanSign(kind))return;
  const ck=wallCacheKey(kind,key), w=WALL_CACHE.get(ck);
  /* знак ставится СРАЗУ, не дожидаясь сервера: человек стукнул по камню и
     видит свою руку. Если сервер откажет — уберём */
  const mine={m:traceMarkOf(),h:traceHand(),me:true};
  w.list=w.list.concat([mine]).slice(-WALL_MAX);
  w.mine=true;
  /* поступок остаётся в журнале игрока (С2, ключ wall у историй): правда о
     чужой стене живёт на сервере, но «я здесь расписался» — решение игрока,
     и оно хранится локально, как visits. Ставится сразу, снимается с отказом. */
  (G.walled||(G.walled={}))[key]=1;
  sfx("ui",{f:180,to:120,d:.14,v:.20});
  logAdd("good","Свой знак — на "+(WALL_KIND_RU[kind]||"стене"));
  wallCall("sign",{key:key,w:kind,m:mine.m,h:mine.h}).then(j=>{
    if(!j||!j.ok){
      /* отказ — знак снимаем молча: врать про чужую стену нельзя */
      const cur=WALL_CACHE.get(ck);
      if(cur){cur.list=cur.list.filter(t=>t!==mine);cur.mine=cur.list.some(t=>t.me);}
      if(G.walled)delete G.walled[key];
      return;
    }
    if(Array.isArray(j.w))wallStore(ck,j.w);
  }).catch(()=>{});
}
/* ── нарисовать ──
   2D-кисть стены/камня/клеток снята (G15): знаки посёлка — тела PLN (21pii plnSetMark).
   Имя wallDraw осталось для typeof у подсказки поверхности/пещеры; счёт — как прежде. */
function wallDraw(kind){
  const w=wallHere(kind);
  return (w&&!w.pending&&w.list.length)?w.list.length:0;
}
/* межевой камень — тело PLN (21pii); 2D wallStone снят (G15, M171) */
/* сколько рук на стене — для подсказки; ноль значит «ещё никого», и это
   тоже стоит сказать: пустая стена в обитаемом месте — сама по себе новость */
function wallCount(kind){
  const w=wallHere(kind);
  return (w&&!w.pending)?w.list.length:-1;
}
