/* ══════════════ что копится за вечер (M332) ══════════════
   «Жёсткое зависание» автора ищут с M238. Фуззер гоняет сотни кадров и падений
   не находит; сквозные наборы (M329) показали, что списки в состоянии не
   растут. Остаётся третье, чего не видит ни один из них: РАСТР. Игра печёт
   картинки — развёртки планет, накладки света, спрайты облаков, ломти грунта —
   и кладёт их на объекты, которые живут в кэше систем. Кэш этот не имеет
   предела: система, куда игрок залетел один раз, лежит там до конца сеанса
   вместе со всем, что для неё испекли.

   Растр не падает и не пишет в консоль. Он просто съедает память, и в какой-то
   момент вкладка встаёт — ровно так, как это описывает автор. Значит, его надо
   мерить: сколько пикселей держит игра после вечера прыжков. */

/* сколько растра держит объект: обход в глубину со счётом площади холстов */
function memPixels(root, maxDepth) {
  const seen = new WeakSet();
  let px = 0, n = 0, nodes = 0;
  const walk = (v, d) => {
    if (!v || typeof v !== "object" || d > (maxDepth || 7) || nodes > 200000) return;
    nodes++;
    if (seen.has(v)) return;
    seen.add(v);
    if (typeof HTMLCanvasElement !== "undefined" && v instanceof HTMLCanvasElement) { px += v.width * v.height; n++; return; }
    if (typeof Node !== "undefined" && v instanceof Node) return;
    if (v instanceof Map) { for (const x of v.values()) walk(x, d + 1); return; }
    if (v instanceof Set) return;
    if (ArrayBuffer.isView(v)) return;
    if (Array.isArray(v)) { for (const x of v) walk(x, d + 1); return; }
    for (const k in v) walk(v[k], d + 1);
  };
  walk(root, 0);
  return { px, n, mb: px * 4 / 1048576 };
}
/* вечер прыжков: N систем, в каждой несколько кадров — чтобы пекарня развёрток
   успела поработать (`planetStripTick` зовётся из отрисовки планеты) */
function memTour(n, frames) {
  const seen = [];
  for (let r = 1; r < 14 && seen.length < n; r++)
    for (let x = -r; x <= r && seen.length < n; x++)
      for (let y = -r; y <= r && seen.length < n; y++) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
        if (!starAt(x, y)) continue;
        const s = getSystem(x, y);
        G.sx = x; G.sy = y; G.sys = s; G.ap = null; G.orbit = null;
        G.mode = "system"; G.ship.x = 700; G.ship.y = 0; G.zoom = .7;
        /* кадр — это шаг И отрисовка: уборка растра покинутых систем живёт
           в шаге мира (28-loop), и облёт без него мерил бы не игру */
        for (let i = 0; i < (frames || 12); i++) { try { stepWorld(1); drawWorld(); } catch (e) { } G.t += 1; }
        seen.push(s);
      }
  return seen;
}

TEST_SUITES.push(() => suite("память: вечер прыжков не копит растр без предела", () => {
  resetWorld();
  const a = memPixels(SYS_CACHE);
  const tour = memTour(24, 8);
  const b = memPixels(SYS_CACHE);
  ok(tour.length >= 20, "систем облетело: " + tour.length + ", в кэше: " + SYS_CACHE.size);
  /* сравнивать с началом нельзя: в общем прогоне до этого набора уже напекли
     соседние наборы, и уборка честно уносит чужое. Судим не разницу, а факт —
     печь работает, и после облёта на руках остаётся столько, сколько нужно
     живому кадру, а не столько, сколько игрок налетал */
  ok(b.n > 0, "растр пёкся: холстов " + a.n + " → " + b.n +
    " (" + a.mb.toFixed(1) + " → " + b.mb.toFixed(1) + " МБ)");
  /* ── предел ──
     Вечер — это не сорок систем, а несколько сотен. Держать всё испечённое
     навсегда нельзя ни при каких размерах кадра: счёт идёт на сотни мегабайт,
     и вкладка встаёт. Порог поставлен с запасом вчетверо от того, что нужно
     живому кадру (текущая система и соседи). */
  ok(b.mb < 24, "растр в кэше систем ограничен: " + b.mb.toFixed(1) + " МБ на " + tour.length + " системах");
  /* главное — не само число, а ПОЛКА: вдвое больший облёт не имеет права
     удвоить счёт. До M332 сорок систем давали 28.9 МБ, восемьдесят — 58.8:
     ровно вдвое, то есть без предела вовсе */
  const tour2 = memTour(48, 5);
  const c = memPixels(SYS_CACHE);
  ok(c.mb < 24, "вдвое больший облёт остаётся на полке: " + b.mb.toFixed(1) + " → " + c.mb.toFixed(1) +
    " МБ (систем " + tour2.length + ", в кэше " + SYS_CACHE.size + ")");
  ok(c.mb < b.mb * 2.5, "и рост не линейный по числу систем");
  /* и растр покинутой системы действительно отпущен: возвращаемся к первой
     облетевшей и смотрим, что на ней ничего не осталось висеть */
  const first = tour[0];
  const left = memPixels({ s: first }, 6);
  ok(left.mb < 1.5, "у давно покинутой системы растра почти не осталось: " +
    left.mb.toFixed(2) + " МБ, холстов " + left.n);
  resetWorld();
}));

/* ── DOM тоже копится ──
   Экраны строят свои строки заново на каждый показ. Если старые не убирать,
   документ растёт молча: сначала подтормаживает поиск по селектору, потом
   всё остальное. Открываем и закрываем каждый экран сотню раз и считаем узлы. */
TEST_SUITES.push(() => suite("память: сотня открытий экранов не растит документ", () => {
  resetWorld(); fuzzRich();
  const count = () => document.getElementsByTagName("*").length;
  /* один прогрев: первый показ имеет право построить то, чего ещё нет */
  const tabs = [...document.querySelectorAll("#tableTabs button")].map(b => b.dataset.tab);
  const stTabs = [...document.querySelectorAll("#stTabs button")].map(b => b.dataset.tab);
  const cycle = () => {
    for (const t of tabs) { try { tableTab = t; tableRender(); } catch (e) { } }
    if (G.sys.station) {
      G.st = G.sys.station; G.mode = "dock";
      for (const t of stTabs) { try { tab = t; renderTab(); } catch (e) { } }
      G.mode = "system"; G.st = null;
    }
  };
  cycle();
  const n0 = count();
  for (let i = 0; i < 12; i++) cycle();
  const n1 = count();
  tableTab = "ether"; tab = "market";
  document.querySelectorAll(".scr.open").forEach(e => e.classList.remove("open"));
  resetWorld();
  ok(n0 > 200, "узлов в документе: " + n0);
  ok(n1 <= n0 * 1.15 + 40, "двенадцать кругов по всем вкладкам не растят документ: " + n0 + " → " + n1);
}));
