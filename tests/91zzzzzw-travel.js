/* ══════════════ вечер не по времени, а по дороге (M359) ══════════════
   Сквозной набор про долгий полёт (91zzzzz) меряет рост по КАДРАМ: три тысячи
   кадров на месте — списки не пухнут, сейв не растёт. Но вечер игрока — это не
   три тысячи кадров в одной системе, это сто прыжков. А половина состояния
   игры разрежена ПО СИСТЕМАМ: рынок, замеченные цены, места, холдинг, слухи,
   имена. Такие карты растут не от времени, а от дороги, и ни один набор этой
   оси не касался вовсе.

   Цена вопроса известна по документам: раздутый сейв однажды убил запись
   («Invalid string length», 30.08). Поэтому здесь: сотня прыжков по настоящей
   галактике, со стыковками и торговлей, и три вопроса — на сколько вырос сейв,
   какие карты растут линейно с числом систем, и остаётся ли запись читаемой. */

/* сколько ключей в разреженной карте */
function tvKeys(o){return (o&&typeof o==="object")?Object.keys(o).length:0;}
/* снимок «во что превратилось состояние» */
function tvSizes(){
  const s={};
  for(const k of ["market","seenPrices","place","hold","names","occ","occCalm","mines","rep","poiSeen","wrecks","rivals","newsMarks","droneSold"])
    s[k]=tvKeys(G[k]);
  s["log"]=(G.log||[]).length;
  s["news"]=(G.news||[]).length;
  s["rumours"]=(G.rumours||[]).length;
  s["quests"]=(G.quests||[]).length;
  s["offers"]=(G.offers||[]).length;
  s["told"]=(G.told||[]).length;
  s["heard"]=(G.heard||[]).length;
  s["loreFound"]=(G.loreFound||[]).length;
  s["rareFound"]=(G.rareFound||[]).length;
  s["pirates"]=(G.pirates||[]).length;
  s["shots"]=(G.shots||[]).length;
  s["drones"]=(G.drones||[]).length;
  return s;
}
/* перелёт в соседнюю живую систему: настоящим прыжком, как игрок */
function tvHop(r){
  for(let tries=0;tries<40;tries++){
    const dx=((r()*7)|0)-3,dy=((r()*7)|0)-3;
    if(!dx&&!dy)continue;
    const nx=G.sx+dx,ny=G.sy+dy;
    if(!starAt(nx,ny))continue;
    G.sel={x:nx,y:ny};
    G.fuel=Math.max(G.fuel,60);
    try{ jump(2); }catch(e){ return "прыжок бросил: "+e.message; }
    return "";
  }
  return "";
}

TEST_SUITES.push(() => suite("дорога: сто прыжков не раздувают ни сейв, ни карты состояния", () => {
  resetWorld();
  const r=rng(hashi(0xD0F0,11,3));
  const before=tvSizes();
  const js0=JSON.stringify(snapshot()).length;
  const seen=new Set();
  const bad=[];
  let hops=0;
  for(let i=0;i<100;i++){
    const err=tvHop(r);
    if(err){bad.push(err);break;}
    hops++;
    seen.add(G.sx+","+G.sy);
    /* живём в системе: несколько кадров, стыковка и торговля через раз */
    for(let f=0;f<12;f++){ actEdge=false; try{ stepWorld(1); }catch(e){ bad.push("кадр после прыжка "+i+": "+e.message); break; } G.t++; }
    if(G.sys.station&&(i%3===0)){
      G.st=G.sys.station;G.mode="dock";
      try{
        const k=TRADE_KEYS[(r()*TRADE_KEYS.length)|0];
        G.credits=Math.max(G.credits,20000);
        buyCargo(G.sys,k,5);
        sellCargo(G.sys,k,5);
        if(typeof pricesSeen==="function")pricesSeen(G.sys);
      }catch(e){ bad.push("торговля на прыжке "+i+": "+e.message); }
      G.mode="system";G.st=null;
    }
    if(bad.length)break;
  }
  ok(hops>=60,"прыжков сделано: "+hops+", разных систем: "+seen.size);
  eq(bad.slice(0,3).join(" ;; "),"","дорога прошла без падений");
  const after=tvSizes();
  const js1=JSON.stringify(snapshot()).length;
  /* 1. сейв: рост есть (мы же жили), но он должен быть посильным — десятки
     килобайт на сотню систем, а не мегабайты */
  const grew=js1-js0;
  ok(js1<600000,"сейв после сотни прыжков: "+Math.round(js1/1024)+" КБ (было "+Math.round(js0/1024)+")");
  ok(grew<300000,"прирост за дорогу: "+Math.round(grew/1024)+" КБ");
  /* 2. карты, разреженные по системам, растут не быстрее числа систем */
  const gross=[];
  for(const k in after){
    const d=after[k]-before[k];
    if(d>Math.max(40,seen.size*3))gross.push(k+": "+before[k]+" → "+after[k]+" при "+seen.size+" системах");
  }
  eq(gross.slice(0,4).join(" ;; "),"","ни одна карта не растёт быстрее, чем сама дорога");
  /* 3. и запись после всего этого читается обратно */
  let js="";
  try{ js=JSON.stringify(snapshot()); }catch(e){ ok(false,"снимок не пишется: "+e.message); }
  ok(js.length>1000&&applySave(JSON.parse(js))!==false,"сейв после дороги читается");
  resetWorld();
}));

TEST_SUITES.push(() => suite("дорога: растр покинутых систем не копится в памяти", () => {
  /* Соседний сеанс мерил печь и живой растр (M358); здесь — другая половина
     того же вопроса, со стороны состояния: сколько систем держит SYS_CACHE
     после долгой дороги. Он не сохраняется и обязан отпускать покинутое —
     иначе за вечер прыжков вырастет ровно то, что ищут как зависание. */
  resetWorld();
  if(typeof SYS_CACHE==="undefined"){ok(true,"кэша систем в этой сборке нет — пропуск");return;}
  SYS_CACHE.clear();
  const r=rng(hashi(0xCAC,5,9));
  let hops=0;
  for(let i=0;i<60;i++){
    if(tvHop(r))break;
    hops++;
    for(let f=0;f<6;f++){ actEdge=false; try{ stepWorld(1); }catch(e){ break; } G.t++; }
  }
  ok(hops>=30,"прыжков: "+hops+", систем в кэше: "+SYS_CACHE.size);
  /* кэш держит посещённое — это нормально; ненормально, если он держит ВСЁ,
     что попадалось по дороге, включая соседей, куда не заходили */
  ok(SYS_CACHE.size<=hops+40,"кэш систем соразмерен дороге: "+SYS_CACHE.size+" при "+hops+" прыжках");
  /* и в сейв он не попадает ни одной планетой */
  const js=JSON.stringify(snapshot());
  ok(js.indexOf('"planets"')<0,"планеты в сейв не просочились");
  SYS_CACHE.clear();
  resetWorld();
}));
