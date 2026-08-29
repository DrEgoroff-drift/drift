/* ══════════════ фуззер: режим под случайными руками (M238) ══════════════
   Автор поймал «жёсткое зависание» на осмотре памятника, а причину найти не
   удалось: четыре тысячи прогонов `poiInspect` прошли чисто, значит дело в
   состоянии его сохранения — то есть в сочетании, которого никто не набирал
   руками. Кадр с M234 такое исключение переживает и называет, но лучше, чтобы
   исключений не было вовсе.

   Здесь каждый режим гоняется случайным вводом: тяга, руль, тормоз, ДЕЙСТВИЕ,
   огонь — в случайном порядке, сотни кадров подряд, с отрисовкой. Ловится не
   «правильность», а ПАДЕНИЕ: любое исключение из update/draw — адрес дефекта.

   Случайность СЕЯНАЯ (`rng`), поэтому провал воспроизводится: в сообщении
   стоит режим и номер кадра, и тот же прогон повторяется в точности. Число
   кадров можно поднять из адреса — `tests.html?fuzz=4000`, — тогда прогон
   становится длинным и его гоняют руками, а не на каждой сборке. */
const FUZZ_KEYS=["left","right","thrust","brake","act","fire","msl"];
function fuzzN(){
  const m=/[?&]fuzz=(\d+)/.exec(location.search);
  return m?Math.min(20000,Math.max(20,+m[1])):260;
}
/* ── сцены берём у прибора кадра (28y-look) ──
   Список сцен один на всех: им пользуется и `lookAll`, и фуззер. Свой список
   здесь уже был и уже разошёлся бы — правило то же, что у развилки режимов:
   у вещи один хозяин. Изоляция у каждого своя: прибор снимает и возвращает
   сохранение, тесты чистят мир `resetWorld`. */
function fuzzScenes(){
  return lookScenes().map(sc=>({id:sc.id,set:()=>{resetWorld();return sc.set();}}));
}
TEST_SUITES.push(()=>suite("фуззер: режимы под случайными руками",()=>{
  const N=fuzzN(),bad=[];
  let ran=0,skipped=[];
  for(const sc of fuzzScenes()){
    let ok0=true;
    try{ok0=sc.set()!==false;}catch(e){bad.push(sc.id+" · постановка сцены: "+e.message);continue;}
    if(!ok0||G.mode==="none"){skipped.push(sc.id);continue;}
    const r=rng(hashi(0xF0DE,sc.id.length,7));
    for(let i=0;i<N;i++){
      /* руки: каждые несколько кадров половина клавиш переставляется */
      if(i%5===0){
        for(const k of FUZZ_KEYS)keys[k]=r()<.28;
        actEdge=keys.act&&r()<.5;
      }else actEdge=false;
      try{stepWorld(1);}catch(e){
        bad.push(sc.id+"→"+G.mode+" · кадр "+i+" · update: "+e.message+" | "+
          String(e.stack||"").split("\n")[1]);break;}
      if(i%8===0){
        try{drawWorld();}catch(e){
          bad.push(sc.id+"→"+G.mode+" · кадр "+i+" · draw: "+e.message+" | "+
            String(e.stack||"").split("\n")[1]);break;}
      }
      G.t+=1;ran++;
    }
    for(const k of FUZZ_KEYS)keys[k]=false;
    actEdge=false;
  }
  resetWorld();
  eq(bad.slice(0,4).join(" ;; "),"","ни один режим не упал ("+ran+" кадров)");
  ok(ran>800,"прогон состоялся: "+ran+" кадров"+(skipped.length?", пропущено: "+skipped.join(", "):""));
}));

/* ══════════════ прожитый мир ══════════════
   Чистый мир почти инертен: ни дома, ни редкостей, ни отчёта, ни дронов — то
   есть половина кода в нём просто не выполняется. Автор же играет вечерами, и
   его зависание пришло именно оттуда: в сочетании состояний, которого руками
   не набрать. Ставим «прожитое» состояние и гоняем по нему то же самое. */
function fuzzRich(){
  G.credits=500000;G.data=4000;
  G.mods={engine:3,tank:3,hold:3,armor:2,drill:3,hyper:2,weapon:2};
  G.modsOwned={engine:3,tank:3,hold:3,armor:2,drill:3,hyper:2,weapon:2};
  G.tech=new Set(["synth","beacon","radar"]);
  G.home=homeInit();G.home.tier=6;G.home.sx=G.sx;G.home.sy=G.sy;
  /* собранное: редкости, куски отчёта, узлы — каждое со своим экраном и своей
     строкой в интерфейсе */
  for(let i=0;i<40;i++)if(typeof rareTake==="function")rareTake("poi",(i*7919)>>>0);
  for(let i=0;i<30;i++)if(typeof loreTake==="function")loreTake((i*104729)>>>0);
  for(let i=0;i<12;i++)if(typeof nodeDrop==="function")nodeDrop("в аномалии",1,(i*31+7)>>>0);
  /* осмотренные памятники: та самая ветка, на которой автор поймал зависание */
  if(typeof poiInspect==="function")
    for(const k of Object.keys(typeof POI_FIND==="object"?POI_FIND:{}))
      poiInspect({k,seed:(k.length*2654435761)>>>0,ru:POI_FIND[k].ru});
  /* люди и управляющий */
  if(typeof genMgr==="function"&&typeof hireMgr==="function"){
    const m=genMgr(12345,["fact"]);if(m)try{hireMgr(m);}catch(e){}
  }
  /* дроны в рейсе — и в этой системе, и в соседней */
  if(typeof droneNextId==="function"){
    const now=Date.now();
    G.droneInventory=2;
    G.drones=[0,1,2].map(i=>({id:i+1,sx:G.sx,sy:G.sy,pi:i%2,res:["iron","titan","crystal"][i],
      rate:.6,pool:150,soldAtMs:now,t0:now-9000*i,lastMs:now-9000*i,bornMs:now-3600000,
      trips:3+i,down:i===2?now+300000:0,sold:20,earned:900,carry:.4}));
  }
  if(typeof tickDrones==="function")tickDrones();
}
TEST_SUITES.push(()=>suite("фуззер: прожитый мир",()=>{
  const N=Math.min(fuzzN(),600),bad=[];let ran=0;
  const scenes=fuzzScenes().filter(s=>["system","surface","dig","cave","map"].indexOf(s.id)>=0);
  for(const sc of scenes){
    let ok0=true;
    try{
      resetWorld();fuzzRich();
      ok0=sc.set()!==false;                 /* сцена ставится ПОВЕРХ прожитого */
    }catch(e){bad.push(sc.id+" · постановка: "+e.message);continue;}
    if(!ok0)continue;
    fuzzRich();                             /* resetWorld внутри сцены стёр — ставим снова */
    const r=rng(hashi(0xB17E,sc.id.length,3));
    for(let i=0;i<N;i++){
      if(i%5===0){for(const k of FUZZ_KEYS)keys[k]=r()<.3;actEdge=keys.act&&r()<.5;}
      else actEdge=false;
      try{stepWorld(1);}catch(e){
        bad.push(sc.id+"→"+G.mode+" · кадр "+i+" · update: "+e.message+" | "+
          String(e.stack||"").split("\n")[1]);break;}
      if(i%8===0){try{drawWorld();}catch(e){
        bad.push(sc.id+"→"+G.mode+" · кадр "+i+" · draw: "+e.message+" | "+
          String(e.stack||"").split("\n")[1]);break;}}
      G.t+=1;ran++;
    }
    for(const k of FUZZ_KEYS)keys[k]=false;
    actEdge=false;
  }
  resetWorld();
  eq(bad.slice(0,4).join(" ;; "),"","прожитый мир не роняет режимы ("+ran+" кадров)");
}));

/* ══════════════ все вкладки рисуются ══════════════
   Экран, который падает при отрисовке, для игрока выглядит так же, как
   зависание: он ткнул закладку и остался ни с чем. Сегодня же на этом поймана
   РЕЙСЫ — строка маршрута падала на неизвестном ключе груза и уносила весь
   стол. Проверка дешёвая: пройти по всем закладкам стола и по всем вкладкам
   станции на прожитом мире и убедиться, что каждая нарисовалась. */
TEST_SUITES.push(()=>suite("вкладки стола и станции рисуются на прожитом мире",()=>{
  resetWorld();fuzzRich();
  const bad=[];
  const box=document.getElementById("loglist");
  const tabs=[...document.querySelectorAll("#tableTabs button")].map(b=>b.dataset.tab);
  ok(tabs.length>8,"закладок стола "+tabs.length);
  for(const t of tabs){
    try{tableTab=t;tableRender();}
    catch(e){bad.push("стол/"+t+": "+e.message+" | "+String(e.stack||"").split("\n")[1]);}
  }
  tableTab="ether";
  /* станция: открываем док и перебираем её вкладки */
  const sys=G.sys.station?G.sys:null;
  if(sys){
    G.st=sys.station;G.mode="dock";
    const stTabs=[...document.querySelectorAll("#stTabs button")].map(b=>b.dataset.tab);
    for(const t of stTabs){
      try{tab=t;renderTab();}
      catch(e){bad.push("станция/"+t+": "+e.message+" | "+String(e.stack||"").split("\n")[1]);}
    }
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
  eq(bad.slice(0,4).join(" ;; "),"","ни одна вкладка не упала");
}));

/* ══════════════ тычок в каждую кнопку ══════════════
   Мир под случайными руками не падает — это проверено выше. Осталась вторая
   половина игры: DOM. Для игрока «ткнул и всё умерло» выглядит точно так же,
   как зависание кадра, а обработчик нажатия живёт вне кадра, и до M234 его
   исключение не ловил никто. Проходим по кнопкам стола и станции на прожитом
   мире и жмём каждую. Проверяется не результат, а то, что нажатие не бросает. */
TEST_SUITES.push(()=>suite("тычок в каждую кнопку стола и станции",()=>{
  resetWorld();fuzzRich();
  const bad=[];let clicks=0;
  const press=(sel,label,limit)=>{
    for(let i=0;i<limit;i++){
      const list=[...document.querySelectorAll(sel)].filter(b=>b.offsetParent!==null||true);
      if(i>=list.length)break;
      const b=list[i];
      try{b.click();clicks++;}
      catch(e){bad.push(label+"["+i+"] «"+(b.textContent||"").slice(0,18).trim()+"»: "+
        e.message+" | "+String(e.stack||"").split("\n")[1]);}
    }
  };
  /* стол: закладки и всё, что нарисовалось внутри каждой */
  const tabs=[...document.querySelectorAll("#tableTabs button")].map(b=>b.dataset.tab);
  for(const t of tabs){
    try{tableTab=t;tableRender();}catch(e){bad.push("стол/"+t+" · отрисовка: "+e.message);continue;}
    press("#tableBody button","стол/"+t,24);
  }
  tableTab="ether";
  /* станция: вкладки и кнопки в них */
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    const stTabs=[...document.querySelectorAll("#stTabs button")].map(b=>b.dataset.tab);
    for(const t of stTabs){
      try{tab=t;renderTab();}catch(e){bad.push("станция/"+t+" · отрисовка: "+e.message);continue;}
      press("#stBody button","станция/"+t,24);
    }
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  resetWorld();
  ok(clicks>40,"нажатий сделано: "+clicks);
  eq(bad.slice(0,4).join(" ;; "),"","ни одно нажатие не бросило исключение");
}));

/* ══════════════ прибор кадра работает ══════════════
   `look()` — то же для картинки, что `prof()` для скорости: он не судит, он
   меряет. Тест проверяет не красоту (её числа сейчас и не сходятся), а что
   прибор считает и что прогон по всем сценам возвращает мир на место. */
TEST_SUITES.push(()=>suite("look(): прибор кадра меряет и не портит мир",()=>{
  resetWorld();
  const scenes=lookScenes();
  ok(scenes.length>=8,"сцен в списке: "+scenes.length);
  /* меряем текущий кадр */
  G.mode="system";drawWorld();
  const m=lookFrame();
  ok(m.tones>=0&&m.tones<=36,"тонов в пределах шкалы: "+m.tones);
  ok(m.warm>=0&&m.warm<=100,"тепло в процентах: "+m.warm);
  ok(m.contrast>=0&&m.contrast<=1,"контраст 0…1: "+m.contrast);
  ok(m.empty>=0&&m.empty<=100,"пусто в процентах: "+m.empty);
  ok(/пара/.test(lookVerdict(m)),"приговор печатается: "+lookVerdict(m));
  /* мишени объявлены и разумны */
  ok(LOOK_TARGET.pair>0&&LOOK_TARGET.tones>=3,"мишени заданы");
  ok(m.pair>=0&&m.pair<=50,"пара — доля меньшинства: "+m.pair);
  /* прогон по всем сценам возвращает сохранение на место */
  G.credits=4242;G.sx=3;G.sy=-2;G.sys=getSystem(3,-2);
  const rows=lookAll(2);
  ok(rows.length>=6,"прогон прошёл по сценам: "+rows.length);
  eq(Math.round(G.credits),4242,"кошелёк на месте после прогона");
  eq(G.sx+","+G.sy,"3,-2","и сектор тоже");
  resetWorld();
}));
