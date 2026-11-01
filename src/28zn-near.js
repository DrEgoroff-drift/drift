/* ══════════════ ?g11=near: кадры ПЕРЕХОДА (диагностика, не игра) ══════════════
   Пишет первые NEAR_MAX кадров после каждой смены G.mode в буфер и один раз выгружает
   (POST /shot?n=g11near). В консоль не пишет, в обычной игре молчит: всё под `if(NEAR.on)`.
   ЧЕГО НЕ МЕРИТ и не должен: presented-кадр. `gpuPresent()` — это постановка команд, а не
   отрисовка на экране; поле `rest` — это ОСТАТОК gap−js (растр/композитор/ожидание), а НЕ
   время GPU. Для presented нужен Chrome performance trace (см. diagnostics/frame-pacing/).
   Метки: `nearMark("name")` ставит wallMs() в NEAR.marks; `nearFrame(rec)` кладёт кадр.
   Сводка — p50/p90/p95/p99/max по gap и js, счётчики >20/25/33/50 мс и js >8/12/16/25,
   худшие кадры с режимом и активными задачами, макс. время каждой активной очереди. */
const NEAR_MAX = 240;
const NEAR = {on:false, blocks:[], cur:null, n:0, frameN:0,
  marks:{}, work:{}, warm:0, bakeN:0, bakeS:0, pipes:0, cave:0,
  sw:0, gf:0, dw:0, rack:0, hit:0, dwAll:0, rackB:0, rackT:0, rackF:0, wSun:0, wScene:0, wGpu:0, wLand:0, wStep:0, wPlant:0, wBatch:0, hud:0, gp:0, wp:0, crash:"", frameCalls:0, rafSched:0, sl:{}, sg:{}, dg:{}, runs:{}, gw:{}, maxFrames:NEAR_MAX};
function nearOn(){ NEAR.on = true; }
function nearBlock(mode, prev){
  if(!NEAR.on) return;
  if(!NEAR.cur || NEAR.cur.mode !== mode){
    NEAR.cur = {mode, prev, fr:[], firstRec:null};
    NEAR.blocks.push(NEAR.cur);
    NEAR.n = 0; NEAR.work = {}; NEAR.warm = 0; NEAR.bakeN = 0; NEAR.bakeS = 0;
  }
}
function nearMark(k){ if(NEAR.on) NEAR.marks[k] = wallMs(); }
function nearWork(name, dt){ if(NEAR.on && dt > 0){ const w = NEAR.work;
  const cur = w[name]; if(!cur || dt > cur) w[name] = Math.round(dt * 10) / 10; } }
function nearWarm(ms){ if(NEAR.on && ms > NEAR.warm) NEAR.warm = Math.round(ms * 10) / 10; }
function nearBake(sync){ if(NEAR.on){ NEAR.bakeN++; if(sync) NEAR.bakeS++; } }
function nearPipe(){ if(NEAR.on) NEAR.pipes++; }
function nearCave(){ if(NEAR.on) NEAR.cave++; }
function nearFrame(rec){
  if(!NEAR.on || !NEAR.cur) return;
  /* первый кадр блока помним всегда, даже если кадров больше не будет: тяжёлый первый
     кадр Surface и есть предмет замера, а счётчик NEAR.n при нём почти не растёт */
  if(!NEAR.cur.firstRec) NEAR.cur.firstRec = rec;
  if(NEAR.n >= NEAR.maxFrames) return;
  const fr = NEAR.cur.fr, prev = fr.length ? fr[fr.length - 1] : null;
  NEAR.n++; NEAR.frameN++;
  rec.i = NEAR.frameN;
  /* gap — интервал между ВЫЗОВАМИ rAF, а не время кадра: он принадлежит промежутку
     ПОСЛЕ предыдущего кадра, поэтому рядом кладём JS предыдущего, чтобы видеть,
     лёг ли длинный разрыв на тяжёлый прошлый кадр или пришёл сам по себе */
  rec.prevJs = prev ? prev.js : 0;
  rec.prevGap = prev ? prev.gap : 0;
  rec.prevRack = prev ? (prev.rack || 0) : 0;
  fr.push(rec);
}
function nearStat(a){
  const s = a.slice().sort((x, y) => x - y), n = s.length;
  return {n, p50: +((s[n >> 1] || 0)).toFixed(2), p90: +((s[Math.floor(n * .9)] || 0)).toFixed(2),
    p95: +((s[Math.floor(n * .95)] || 0)).toFixed(2), p99: +((s[Math.floor(n * .99)] || 0)).toFixed(2),
    max: +((s[n - 1] || 0)).toFixed(2)};
}
function nearJSON(){
  const blocks = NEAR.blocks.filter(b => b.fr.length).map(b => {
    const g = b.fr.map(f => f.gap), j = b.fr.map(f => f.js);
    const long = {g20:0, g25:0, g33:0, g50:0}, jsLong = {j8:0, j12:0, j16:0, j25:0};
    for(const f of b.fr){
      if(f.gap > 20) long.g20++; if(f.gap > 25) long.g25++;
      if(f.gap > 33) long.g33++; if(f.gap > 50) long.g50++;
      if(f.js > 8) jsLong.j8++; if(f.js > 12) jsLong.j12++;
      if(f.js > 16) jsLong.j16++; if(f.js > 25) jsLong.j25++;
    }
    const work = {};
    for(const f of b.fr) for(const k in (f.work || {})) if(!(work[k] >= f.work[k])) work[k] = f.work[k];
    return {mode:b.mode, prev:b.prev, frames:b.fr.length, first:b.firstRec,
      gap:nearStat(g), js:nearStat(j), long, jsLong, work,
      worstGap:b.fr.slice().sort((a, z) => z.gap - a.gap).slice(0, 8),
      worstJs:b.fr.slice().sort((a, z) => z.js - a.js).slice(0, 8),
      worstDw:b.fr.slice().sort((a, z) => (z.dw || 0) - (a.dw || 0)).slice(0, 8)};
  });
  return {dpr:devicePixelRatio, maxFrames:NEAR.maxFrames, blocks,
    pipes:NEAR.pipes, cave:NEAR.cave, runs:NEAR.runs, crash:NEAR.crash, frameCalls:NEAR.frameCalls, rafSched:NEAR.rafSched};
}
