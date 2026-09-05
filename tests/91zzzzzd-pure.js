/* ══════════════ мир из семени, а не из порядка (M354) ══════════════
   Два закона игры записаны в PLAN.md сквозными правилами и до сих пор не
   проверялись ничем:

   • «Не сдвигать потоки случайных чисел» — любой лишний вызов r() внутри
     getSystem переименует уже посещённые станции и перегенерирует системы.
     Игрок этого не увидит как ошибку: он увидит, что станции, где он был
     вчера, называются иначе. Такое не ловится глазами и не падает.
   • «Никогда не хранить эфемерное» — всё, что выводится из семени (системы,
     орбиты, пояс, шахты, пираты), обязано пересчитываться при загрузке.
     Попавшая в сейв планета — это и лишний вес, и мир, который разъезжается
     с генератором после первой же правки таблиц.

   Проверяется тремя опытами: тот же мир из того же семени; тот же мир при
   ДРУГОМ порядке обхода и с чужими генераторами между; тот же мир после
   круга сейва. Отпечаток берётся по неподвижным полям — угол и координаты
   планет живут своей жизнью в SYS_CACHE весь сеанс, это не порча. */

function puFinger(sx,sy){
  const s=getSystem(sx,sy);
  const pl=p=>[p.type,p.seed,p.name,Math.round(p.radius*1e3),Math.round(p.orbit*1e3),
    Math.round((p.ecc||0)*1e4),(p.moons||[]).map(m=>[m.type,m.seed,m.name].join("/")).join("|")].join(",");
  return [sx,sy,s.name,s.cls&&s.cls.k,Math.round(s.radius*1e3),
    s.planets.map(pl).join(";"),
    s.station?(s.station.kind+"/"+(s.station.name||"")):"-",
    s.belt?("belt"+Math.round((s.belt.r||0)*1e3)):"-"].join(" · ");
}
const PU_CELLS=(()=>{const out=[];for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)if(starAt(x,y))out.push([x,y]);return out;})();

TEST_SUITES.push(() => suite("семя: та же система из того же семени — дважды подряд", () => {
  resetWorld();
  ok(PU_CELLS.length>=12,"звёзд в пробном квадрате: "+PU_CELLS.length);
  const a=PU_CELLS.map(c=>puFinger(c[0],c[1]));
  SYS_CACHE.clear();
  const b=PU_CELLS.map(c=>puFinger(c[0],c[1]));
  const diff=a.map((s,i)=>s===b[i]?"":s+" ≠ "+b[i]).filter(Boolean);
  eq(diff.slice(0,2).join(" ;; "),"","генератор систем чист: "+a.length+" систем совпали");
  /* и рельеф планеты тоже: он тоже из семени */
  const P=getSystem(0,0).planets.find(x=>x.type!=="gas");
  if(P){
    const t1=genTerrain(P),t2=genTerrain(P);
    eq(Math.round(t1.padX*1e3),Math.round(t2.padX*1e3),"площадка на том же месте");
    const h=(t)=>t.h?Array.from(t.h).slice(0,60).map(v=>Math.round(v*1e3)).join(","):"";
    eq(h(t1),h(t2),"профиль грунта тот же");
  }
  SYS_CACHE.clear();
}));

TEST_SUITES.push(() => suite("семя: порядок обхода и чужие генераторы между не двигают мир", () => {
  resetWorld();
  SYS_CACHE.clear();
  const a=PU_CELLS.map(c=>puFinger(c[0],c[1]));
  SYS_CACHE.clear();
  /* обратный порядок, а между каждой системой — чужие генераторы, которые
     тоже берут случайные числа: части, рынок, рельеф, имена */
  const rev=PU_CELLS.slice().reverse(), got={};
  for(const c of rev){
    for(let i=0;i<3;i++)genPart(hashi(c[0]*31+c[1],i*7717,0x9E3),1+(i%4));
    const s0=getSystem(c[0],c[1]);
    if(s0.station&&typeof marketFor==="function")marketFor(s0);
    if(s0.planets[0])genTerrain(s0.planets[0]);
    got[c[0]+","+c[1]]=puFinger(c[0],c[1]);
  }
  const diff=PU_CELLS.map((c,i)=>{const k=c[0]+","+c[1];return got[k]===a[i]?"":a[i]+" ≠ "+got[k];}).filter(Boolean);
  eq(diff.slice(0,2).join(" ;; "),"","обратный обход с чужими генераторами даёт тот же мир");
  SYS_CACHE.clear();
}));

TEST_SUITES.push(() => suite("эфемерное: круг сейва пересобирает мир, а не хранит его", () => {
  resetWorld(); fuzzRich();
  const before=PU_CELLS.map(c=>puFinger(c[0],c[1]));
  const js=JSON.stringify(snapshot());
  /* планеты, рельеф и растровые кэши в сейве не лежат */
  for(const k of ["\"planets\"","\"tex\"","\"terrain\"","\"chunks\"","\"raster\""])
    ok(js.indexOf(k)<0,"в сейве нет "+k);
  ok(js.length<400000,"сейв прожитого мира весит "+Math.round(js.length/1024)+" КБ");
  SYS_CACHE.clear();
  ok(applySave(JSON.parse(js))!==false,"сейв прочитан");
  const after=PU_CELLS.map(c=>puFinger(c[0],c[1]));
  const diff=before.map((s,i)=>s===after[i]?"":s+" ≠ "+after[i]).filter(Boolean);
  eq(diff.slice(0,2).join(" ;; "),"","после загрузки мир тот же, хотя в сейве его нет");
  SYS_CACHE.clear();
  resetWorld();
}));
