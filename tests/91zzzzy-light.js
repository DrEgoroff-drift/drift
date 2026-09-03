/* ══════════════ свет и свечения (M330) ══════════════
   Автор (04.09.2026): «свечения всякие. Тож отдельно давай супер тесты».

   Свет — единственное в этой игре, о чём нельзя судить по состоянию: в `G`
   его нет вовсе, он живёт только на канве. Значит и спрашивать надо канву —
   так же, как это делает прибор кадра (28y-look), только не про весь кадр
   целиком, а про ОБЛАСТИ: где горит, где темно, куда падает и как меняется от
   кадра к кадру.

   Четыре закона, каждый со своим числом:
   1. ночь темнее дня — иначе ночи в игре нет, сколько бы её ни рисовали;
   2. источник стоит там, где его считает свет: самое яркое место неба обязано
      совпасть с `sunSpot`, иначе солнце нарисовано в одном месте, а тени
      положены по другому (§13, «тело — обвод — один свет»);
   3. у огня есть ореол: яркость падает с расстоянием от источника, а не
      обрывается кромкой — иначе это не свечение, а пятно;
   4. свет живёт, а не мигает: между соседними кадрами он меняется плавно.
      Жалоба автора на факел («кусками дёргается») была именно об этом. */

/* яркость и тепло куска кадра. Канва живёт в пикселях подложки (dpr), а
   координаты сцены — в CSS-пикселях: множитель берём у самой канвы */
function lgBox(x, y, w, h) {
  const K = cvs.width / W;
  const X = Math.max(0, Math.round(x * K)), Y = Math.max(0, Math.round(y * K));
  const Wd = Math.min(cvs.width - X, Math.round(w * K)), Hd = Math.min(cvs.height - Y, Math.round(h * K));
  if (Wd <= 0 || Hd <= 0) return { lum: 0, warm: 0, white: 0, n: 0 };
  const d = cvs.getContext("2d").getImageData(X, Y, Wd, Hd).data;
  let lum = 0, warm = 0, white = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    lum += .299 * r + .587 * g + .114 * b;
    warm += r - b;
    if (r > 250 && g > 250 && b > 250) white++;
    n++;
  }
  return { lum: lum / n / 255, warm: warm / n, white: white / n, n };
}
/* самая яркая точка кадра — сеткой, а не по пикселю: источник света это
   пятно, а не искра, и одинокий белый пиксель источником не считается */
function lgBrightest(x0, y0, x1, y1, step) {
  const s = step || 24;
  let best = null;
  for (let y = y0; y < y1 - s; y += s)for (let x = x0; x < x1 - s; x += s) {
    const m = lgBox(x, y, s, s);
    if (!best || m.lum > best.lum) best = { x: x + s / 2, y: y + s / 2, lum: m.lum };
  }
  return best;
}
/* час, в который звезда стоит высоко (или низко) — тот же приём, что у
   прибора кадра: час назначается, а не «как выйдет» */
function lgHour(p, wantDay) {
  const t0 = G.t;
  let best = null;
  for (let k = 0; k < 240; k++) {
    const t = t0 + k * 900, s = celSun(p, t);
    const score = wantDay ? s.alt : -s.alt;
    if (!best || score > best.score) best = { score, t };
  }
  if (best) G.t = best.t;
}

/* ── 1. ночь темнее дня ── */
TEST_SUITES.push(() => suite("свет: ночь на самом деле темнее дня", () => {
  const rows = [], bad = [];
  for (const { s, p } of plWorlds(4)) {
    resetWorld();
    const S = plLand(s, p);
    lgHour(S.p, true); drawWorld();
    const day = lgBox(0, H * .55, W, H * .4).lum;
    lgHour(S.p, false); drawWorld();
    const night = lgBox(0, H * .55, W, H * .4).lum;
    rows.push(p.name + " " + day.toFixed(2) + "→" + night.toFixed(2));
    if (!(night < day - .04)) bad.push(p.name + ": день " + day.toFixed(3) + ", ночь " + night.toFixed(3));
  }
  resetWorld();
  ok(rows.length >= 3, "миров измерено: " + rows.join(", "));
  eq(bad.slice(0, 3).join(" ;; "), "", "грунт ночью темнее, чем днём");
}));

/* ── 2. солнце стоит там, где его считает свет ──
   `sunSpot` — единственный хозяин положения светила: от него берут и диск, и
   лучи, и ободок на скафандре, и направление теней. Если самое светлое место
   неба разошлось с ним, то тени в кадре положены не от того солнца, которое
   игрок видит, — а это первое, что читается как «свет неправильный». */
TEST_SUITES.push(() => suite("свет: ничто в небе не светлее самой звезды", () => {
  const bad = [], rows = [];
  let checked = 0;
  for (const { s, p } of plWorlds(6)) {
    resetWorld();
    const S = plLand(s, p);
    lgHour(S.p, true);
    const SR = sunSpot(S.p);
    if (!SR.up || SR.alt < .15) continue;
    drawWorld();
    /* меряем площадями, а не точками: глаз читает источником не самый яркий
       пиксель, а самое светлое ПЯТНО. Диск с ореолом против всего остального
       неба — от верха кадра до горизонта, дальше 120 px от самого светила */
    const sun = lgBox(SR.x - 12, SR.y - 12, 24, 24).lum;
    const sky = Math.max(60, Math.min(H * .5, SR.y + H * .18));
    let other = 0, ox = 0, oy = 0;
    for (let y = 0; y < sky - 24; y += 24)for (let x = 0; x < W - 24; x += 24) {
      if (Math.hypot(x + 12 - SR.x, y + 12 - SR.y) < 120) continue;
      const l = lgBox(x, y, 24, 24).lum;
      if (l > other) { other = l; ox = x; oy = y; }
    }
    checked++;
    rows.push(p.name + " " + sun.toFixed(2) + "/" + other.toFixed(2));
    /* ─ закон: источник — самое светлое в кадре ─
       Иначе в небе появляется второе солнце: глаз считает светом облако, а
       тени лежат от диска. Так и было до M330 — облако мешалось с чистой
       белой и выходило ярче диска (0.85 против 0.79). */
    if (other > sun + .005)
      bad.push(p.name + ": пятно в " + ox + "," + oy + " ярче звезды (" + other.toFixed(3) + " против " + sun.toFixed(3) + ")");
  }
  resetWorld();
  ok(checked >= 3, "дневных кадров измерено: " + checked + " (звезда/небо: " + rows.join(", ") + ")");
  eq(bad.slice(0, 3).join(" ;; "), "", "звезда — самое светлое, что есть в небе");
}));

/* ── 3. у огня есть ореол ──
   Свечение — это падение яркости с расстоянием. Кольцами вокруг самой яркой
   точки кадра: ближнее обязано быть светлее дальнего, и оба — светлее фона.
   Меряется на двух сценах с одним ясным источником: звезда в системе и
   фонарь в пещере, где больше света взять неоткуда. */
TEST_SUITES.push(() => suite("свет: у звезды и у фонаря яркость падает с расстоянием, а не обрывается", () => {
  const rows = [], bad = [];
  const halo = (ru) => {
    const c = lgBrightest(0, 0, W, H, 24);
    if (!c) { bad.push(ru + ": в кадре нет ни одного светлого места"); return; }
    const ring = d => {
      let sum = 0, n = 0;
      for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d * .7, d * .7], [-d * .7, d * .7], [d * .7, -d * .7], [-d * .7, -d * .7]]) {
        const x = c.x + dx - 8, y = c.y + dy - 8;
        if (x < 0 || y < 0 || x > W - 16 || y > H - 16) continue;
        sum += lgBox(x, y, 16, 16).lum; n++;
      }
      return n ? sum / n : null;
    };
    const near = ring(46), far = ring(150);
    if (near == null || far == null) { bad.push(ru + ": кольца не поместились в кадр"); return; }
    rows.push(ru + " " + c.lum.toFixed(2) + "→" + near.toFixed(2) + "→" + far.toFixed(2));
    if (!(c.lum > near)) bad.push(ru + ": в самом источнике не ярче, чем в кольце (" + c.lum.toFixed(3) + " против " + near.toFixed(3) + ")");
    if (!(near >= far - .002)) bad.push(ru + ": ближнее кольцо темнее дальнего — света нет, есть пятно");
  };
  /* звезда в системе */
  resetWorld();
  const sys = (() => { for (const { s } of plWorlds(6)) if ((s.planets || []).length >= 2) return s; return G.sys; })();
  G.sx = sys.sx; G.sy = sys.sy; G.sys = sys; G.mode = "system";
  G.ship.x = 900; G.ship.y = 300; G.zoom = .7;
  drawWorld(); halo("звезда");
  /* фонарь в пещере */
  for (const { s, p } of plWorlds(3)) {
    resetWorld(); plLand(s, p); enterCave();
    if (!G.cave) continue;
    for (let i = 0; i < 20; i++) { updateCave(1); G.t += 1; }
    drawWorld(); halo("фонарь");
    break;
  }
  resetWorld();
  ok(rows.length >= 2, "источников измерено: " + rows.join(" · "));
  eq(bad.slice(0, 3).join(" ;; "), "", "свет убывает от источника");
}));

/* ── 4. свет живёт, а не мигает ──
   «Кусками дёргается» — жалоба автора на факел (0.325.0). Проверяется тем же
   способом, каким её вообще можно проверить: яркость источника снимается
   несколько кадров подряд, и скачок между соседними кадрами не имеет права
   быть сравнимым с самой яркостью. Дыхание — да, щелчок — нет. */
TEST_SUITES.push(() => suite("свет: свечение дышит плавно, а не щёлкает между кадрами", () => {
  const bad = [], rows = [];
  const watch = (ru, setup) => {
    resetWorld();
    if (setup() === false) return;
    drawWorld();
    const c = lgBrightest(0, 0, W, H, 24);
    if (!c) return;
    const box = () => lgBox(Math.max(0, c.x - 24), Math.max(0, c.y - 24), 48, 48).lum;
    const seq = [];
    for (let i = 0; i < 12; i++) { stepWorld(1); G.t += 1; drawWorld(); seq.push(box()); }
    let jump = 0;
    for (let i = 1; i < seq.length; i++) jump = Math.max(jump, Math.abs(seq[i] - seq[i - 1]));
    const mean = seq.reduce((a, b) => a + b, 0) / seq.length;
    rows.push(ru + " " + mean.toFixed(2) + "±" + jump.toFixed(2));
    /* скачок в треть собственной яркости — это уже не дыхание, а мигание */
    if (jump > Math.max(.05, mean * .34)) bad.push(ru + ": скачок " + jump.toFixed(3) + " при яркости " + mean.toFixed(3));
  };
  watch("звезда в системе", () => {
    const sys = (() => { for (const { s } of plWorlds(6)) if ((s.planets || []).length >= 2) return s; return G.sys; })();
    G.sx = sys.sx; G.sy = sys.sy; G.sys = sys; G.mode = "system";
    G.ship.x = 900; G.ship.y = 300; G.zoom = .7;
  });
  watch("день на грунте", () => {
    const w = plWorlds(1)[0]; const S = plLand(w.s, w.p); lgHour(S.p, true);
  });
  watch("ночь на грунте", () => {
    const w = plWorlds(1)[0]; const S = plLand(w.s, w.p); lgHour(S.p, false);
  });
  resetWorld();
  ok(rows.length >= 2, "источников снято: " + rows.join(" · "));
  eq(bad.slice(0, 3).join(" ;; "), "", "свет меняется плавно");
}));

/* ── 5. выжженного белого нет ──
   §16 краткого свода: экспонировать по теням. Белое пятно в canvas 2D — это
   не «яркий свет», это потерянная информация: там, где всё 255, нет ни формы,
   ни цвета. Немного его быть может (диск звезды, искра), много — нельзя. */
TEST_SUITES.push(() => suite("свет: ни одна сцена не выжжена в белое", () => {
  const bad = [], rows = [];
  let scenes = 0;
  for (const sc of lookScenes()) {
    resetWorld();
    let set = true;
    try { set = sc.set() !== false; } catch (e) { continue; }
    if (!set || G.mode === "none") continue;
    try { drawWorld(); } catch (e) { continue; }
    scenes++;
    const m = lgBox(0, 0, W, H);
    const pc = m.white * 100;
    if (pc > .8) { bad.push(sc.id + ": " + pc.toFixed(2) + "% чистого белого"); }
    if (pc > .05) rows.push(sc.id + " " + pc.toFixed(2) + "%");
  }
  resetWorld();
  ok(scenes >= 8, "сцен измерено: " + scenes + (rows.length ? " · с белым: " + rows.join(", ") : " · чистого белого нигде нет"));
  eq(bad.slice(0, 3).join(" ;; "), "", "нигде не выжжено");
}));

/* ── 6. пламя факела живёт и не щёлкает ──
   Прямая жалоба автора на 0.325.0: «кусками дёргается». Тогда пламя было
   двумя эллипсами, прыгающими по |sin| поверх запечённой копии, и его
   переделали в один язык на двух медленных синусах. Проверка ставит это
   числами и держит навсегда: яркость столба снимается кадр за кадром, и она
   обязана И меняться (мёртвое пламя — не пламя), И меняться плавно. */
TEST_SUITES.push(() => suite("свет: пламя факела живёт, но не щёлкает между кадрами", () => {
  resetWorld();
  const st = G.sys && G.sys.station;
  ok(!!st, "у стартовой системы есть станция");
  if (!st) return;
  const keepType = st.stype, keepCtx = ctx, keepT = G.t;
  const off = document.createElement("canvas"); off.width = 160; off.height = 200;
  const seq = [];
  try {
    st.stype = "indust";
    const s = 1.7;
    const x0 = Math.round(80 - 5 * s), x1 = Math.round(80 + 5 * s);
    const y0 = Math.round(120 - 58 * s), y1 = Math.round(120 - 27 * s);
    for (let i = 0; i < 24; i++) {
      G.t = keepT + i;
      ctx = off.getContext("2d"); ctx.clearRect(0, 0, 160, 200);
      drawStation(80, 120, 1);
      const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let lum = 0, n = 0;
      for (let k = 0; k < d.length; k += 4) { lum += (.299 * d[k] + .587 * d[k + 1] + .114 * d[k + 2]) * (d[k + 3] / 255); n++; }
      seq.push(lum / n / 255);
    }
  } finally { ctx = keepCtx; st.stype = keepType; G.t = keepT; }
  const mean = seq.reduce((a, b) => a + b, 0) / seq.length;
  let jump = 0, span = Math.max(...seq) - Math.min(...seq);
  for (let i = 1; i < seq.length; i++) jump = Math.max(jump, Math.abs(seq[i] - seq[i - 1]));
  ok(mean > .01, "в столбе есть свет: " + mean.toFixed(3));
  ok(span > 1e-4, "пламя живёт, а не стоит картинкой: размах " + span.toFixed(4));
  /* дыхание — это доля от собственной яркости за кадр; щелчок — скачок в
     половину размаха разом */
  ok(jump < Math.max(.02, mean * .45), "и не щёлкает: скачок " + jump.toFixed(4) + " при яркости " + mean.toFixed(3) + " и размахе " + span.toFixed(4));
  resetWorld();
}));
