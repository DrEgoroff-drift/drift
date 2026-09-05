/* ══════════════ коробки: пустые спичечные коробки старых фабрик (M346) ══════════════
   Побочная коллекция без пользы (docs/DESIGN-wanderer.md §13): двадцать этикеток
   фабрик, которых больше нет, — по одной строке каждая. Попадаются в обломках
   (остовы, контейнеры), на блошинце и на борту «Сороки»; ложатся на полку дома
   рядом с книгами — «коробков: N из 20». Эффекта нет, и это условие: коробок —
   это память о том, что фабрики были, а не ещё один множитель.

   Полный коробок — пятьдесят целых спичек — легенда, которую хранитель «Сороки»
   поминает и не продаёт (12v-wander-shop, реплика). Здесь только пустые.

   ПРАВИЛА ФАЙЛА:
   1. Таблица написана руками, как BOOKS: не генератор. Двадцать строк, ни одной
      больше без правки таблицы.
   2. Хранится G.boxes=[id…]; одна и та же коробка не приходит дважды.
   3. Место находки решает, какая коробка лежит (семя), как у книг. */
const BOXES=[
  {id:1, ru:"«Красный маяк»",       by:"фабрика им. Первого перелёта · 50 шт."},
  {id:2, ru:"«Полярная»",           by:"Северная спичечная · беречь от влаги"},
  {id:3, ru:"«Гагара»",             by:"артель «Гагара» · сухие, сернистые"},
  {id:4, ru:"«Долгий ход»",         by:"выпуск к сорокалетию · тираж ограничен"},
  {id:5, ru:"«Огонёк-2»",           by:"второй сорт · не для космоса"},
  {id:6, ru:"«Смена»",              by:"фабрика «Смена» · с рисунком станции"},
  {id:7, ru:"«Стриж»",              by:"с силуэтом корпуса · для лётчиков"},
  {id:8, ru:"«Тишина»",             by:"без надписи · только рисунок луны"},
  {id:9, ru:"«Кедр»",               by:"хвойные, зелёный ярлык"},
  {id:10,ru:"«Верфь № 3»",          by:"выдавались бригадам · не продавались"},
  {id:11,ru:"«Ласточка»",           by:"с чёрной птицей · берегли на праздник"},
  {id:12,ru:"«Первое сентября»",    by:"школьная серия · с прописями на обороте"},
  {id:13,ru:"«Ковш»",               by:"фабрика при руднике · грубая бумага"},
  {id:14,ru:"«Ясная»",              by:"с картой созвездия · одно из четырёх"},
  {id:15,ru:"«Прибой»",             by:"морская серия · синяя рамка"},
  {id:16,ru:"«Кочегар»",            by:"для котельных · крупные головки"},
  {id:17,ru:"«Утро»",               by:"с подсолнухом · жёлтый ярлык"},
  {id:18,ru:"«Дружина»",            by:"с эмблемой дружины · вручались за выход"},
  {id:19,ru:"«Экспедиция»",         by:"полевая серия · водостойкий чехол"},
  {id:20,ru:"«Последняя партия»",   by:"без фабрики · отпечатано от руки"}
];
const BOXES_BY={};BOXES.forEach(b=>BOXES_BY[b.id]=b);
function boxAll(){if(!Array.isArray(G.boxes))G.boxes=[];return G.boxes;}
function boxHas(id){return boxAll().indexOf(id)>=0;}
function boxCount(){return boxAll().length;}
/* находка: место решает какая; одно и то же место — одна и та же коробка */
function boxFind(seed,where){
  const have=boxAll();
  if(have.length>=BOXES.length)return null;
  const r=rng(hashi(seed|0,0x0B0E,17));
  const start=Math.floor(r()*BOXES.length);
  for(let i=0;i<BOXES.length;i++){
    const b=BOXES[(start+i)%BOXES.length];
    if(boxHas(b.id))continue;
    have.push(b.id);
    if(typeof thingAdd==="function")thingAdd("find","Коробок · "+b.ru,b.by+" · "+(where||"из обломков")+" · пустой · на полку дома",{box:b.id});
    logAdd("good","Коробок: "+b.ru+" · собрано "+have.length+" из "+BOXES.length);
    if(typeof recordAdd==="function"&&have.length===BOXES.length)recordAdd("полка","собраны все двадцать коробков");
    return b;
  }
  return null;
}
/* шанс коробка в обломках: реже книги, иначе полка соберётся за вечер */
function boxRoll(seed,where,chance){
  const r=rng(hashi(seed|0,0x0B0F,19));
  if(r()>(chance==null?0.22:chance))return null;
  return boxFind(seed,where);
}
/* полка дома: ряд коробков рядом с книгами (12ub) */
function boxesBlock(box){
  const have=boxAll();
  const row=document.createElement("div");row.className="li dim";
  const em=document.createElement("em");em.textContent="";
  const sp=document.createElement("span");
  sp.textContent=have.length?"коробков: "+have.length+" из "+BOXES.length+" · пустые, все":"коробков: ни одного · пустые коробки старых фабрик лежат в обломках, на блошинце и на борту «Сороки»";
  row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  if(!have.length)return;
  const wrap=document.createElement("div");wrap.className="boxes";
  have.slice().sort((a,b)=>a-b).forEach(id=>{
    const b=BOXES_BY[id];if(!b)return;
    const e=document.createElement("div");e.className="matchbox";
    e.innerHTML="<b>"+b.ru+"</b><s>"+b.by+"</s>";
    wrap.appendChild(e);
  });
  box.appendChild(wrap);
}
