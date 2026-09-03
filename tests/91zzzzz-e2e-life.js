/* ══════════════ сквозной прогон II: сейв, числа, текст, долгий полёт (M329) ══════════════
   Автор (03.09.2026): «придумай ещё сквозных, чтобы баги фиксануть». Первый
   сквозной набор (91zzza) судит картинку и кнопки — то, что видно в кадре.
   Здесь другое: то, что ломается МЕЖДУ сеансами и К КОНЦУ вечера, и потому
   руками не ловится совсем.

   Пять вопросов, каждый — свой класс дефекта:
   1. числа: завелось ли за прогон NaN — корабль с NaN в координате просто
      исчезает, и в консоли при этом пусто;
   2. сейв: пишется ли он из КАЖДОЙ сцены, читается ли обратно, и не теряется
      ли поле по дороге (правило «поле в applySave — белый список» уже съело
      relic, cutBonus и ultCount);
   3. старый сейв: игра обязана открывать сохранение без любого поля — это и
      есть «сейв прошлой версии», и он приходит из облака каждый день;
   4. текст: «undefined» и «NaN» в строке, которую читает игрок, — баг, который
      автор видит первым, а тесты до сих пор не видели вовсе;
   5. долгий полёт: что растёт без предела. Зависание, которое автор ловит
      вечерами, ищут с M238 — фуззер гоняет сотни кадров, но НЕ смотрит, во что
      превращается состояние за тысячи.

   И шестое, поперёк всего: сторож кадра (28-loop) считает исключения, которые
   до него не долетели ни до кого — исключение внутри обработчика нажатия
   уходит в window.onerror, а НЕ в try/catch вокруг b.click(). Все наборы,
   которые «жмут кнопки», этого не видят по устройству языка. Этот файл
   склеивается последним и спрашивает счётчик за весь прогон. */

/* ── каким мир был до первого набора ──
   Верхний уровень файла выполняется на склейке, то есть ДО того, как хоть
   один набор что-то тронул: здесь мир ровно такой, каким его завела игра. */
let E2E_FRESH = null;
try { E2E_FRESH = JSON.parse(JSON.stringify(snapshot())); } catch (e) { E2E_FRESH = null; }

/* ── запись сбоев за весь прогон ──
   Ставится на верхнем уровне файла, то есть ДО первого набора: наборы гоняет
   `runTests` из 99-run, а верхний уровень выполняется на склейке. Значит,
   в списке окажутся сбои всех наборов, а не только своих. */
const E2E_CRASHES = [];
(function () {
  const was = crashSay;
  crashSay = function (e, where) {
    let m = "";
    try { m = (e && e.message) || String(e); } catch (_) { m = "?"; }
    /* адрес обязателен: без него «Cannot read properties of null» это ребус.
       Берём две первые строки стека — имя функции и её место */
    let at = "";
    try {
      at = String((e && e.stack) || "").split("\n").slice(1, 3)
        .map(s => s.replace(/^\s*at\s*/, "").replace(/\(file:[^)]*\/tests\.html/, "(").trim()).join(" ← ");
    } catch (_) { }
    E2E_CRASHES.push(m + (where ? " · " + where : "") + (at ? " · " + at : "") + " · набор: " + (_suite || "?"));
    return was.apply(this, arguments);
  };
})();

/* ── всё, что нажимается ──
   Стол с M299 — не полоса кнопок: вещи на досках это `div.item` с `onclick`,
   и строки внутри вещей тоже. Поэтому `querySelectorAll("button")` на столе
   не находит НИЧЕГО — и «тычок в каждую кнопку стола» (91zzzz) годами жал
   только станцию, сам того не говоря. Обработчик, поставленный свойством
   `el.onclick`, не виден селектору `[onclick]`, так что перебираем узлы. */
function e2eClickables(root, limit) {
  const box = (typeof root === "string") ? document.querySelector(root) : root;
  if (!box) return [];
  const out = [];
  for (const el of box.querySelectorAll("*")) {
    if (el.tagName === "BUTTON" ? el.disabled : !el.onclick) continue;
    out.push(el);
    if (out.length >= (limit || 40)) break;
  }
  return out;
}

/* обход состояния: путь до первого нездорового числа. Циклы, DOM и
   типизированные массивы учтены, узлы считаны — обход не должен стоить
   дороже самого прогона. */
function e2eScan(root, test, cap) {
  const seen = new WeakSet(), bad = [];
  let n = 0;
  const walk = (v, path) => {
    if (bad.length >= 6 || n > (cap || 80000)) return;
    n++;
    if (v === null || v === undefined) return;
    const t = typeof v;
    if (t === "number") { if (test(v)) bad.push(path + "=" + v); return; }
    if (t !== "object") return;
    if (seen.has(v)) return;
    seen.add(v);
    if (typeof Node !== "undefined" && v instanceof Node) return;
    if (v instanceof Set || v instanceof Map) return;   /* там ключи и метки, чисел нет */
    if (ArrayBuffer.isView(v)) {
      for (let i = 0; i < v.length && i < 4000; i++)
        if (test(v[i])) { bad.push(path + "[" + i + "]=" + v[i]); break; }
      return;
    }
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length && i < 1200; i++) walk(v[i], path + "[" + i + "]");
      return;
    }
    for (const k in v) walk(v[k], path + "." + k);
  };
  walk(root, "G");
  return bad;
}
/* случайные руки: те же клавиши, что у фуззера, но короткими сеансами */
function e2eHands(seed, n, each) {
  const r = rng(hashi(0xE2E, seed, 17));
  const KS = ["left", "right", "thrust", "brake", "act", "fire"];
  for (let i = 0; i < n; i++) {
    if (i % 4 === 0) { for (const k of KS) keys[k] = r() < .3; actEdge = keys.act && r() < .5; }
    else actEdge = false;
    each(i);
    G.t += 1;
  }
  for (const k in keys) keys[k] = false;
  actEdge = false;
}

/* ── 1. числа остаются числами ── */
TEST_SUITES.push(() => suite("сквозной: за прогон по сценам в состоянии не заводится NaN", () => {
  const bad = [];
  let ran = 0, scenes = 0;
  for (const sc of lookScenes()) {
    resetWorld();
    let set = true;
    try { set = sc.set() !== false; } catch (e) { bad.push(sc.id + " · постановка: " + e.message); continue; }
    if (!set || G.mode === "none") continue;
    scenes++;
    try { e2eHands(sc.id.length, 120, () => { stepWorld(1); ran++; }); }
    catch (e) { bad.push(sc.id + " · кадр: " + e.message); continue; }
    const sick = e2eScan(G, x => !Number.isFinite(x));
    if (sick.length) bad.push(sc.id + " · " + sick.slice(0, 3).join(", "));
  }
  resetWorld();
  ok(scenes >= 8, "сцен прогнано: " + scenes);
  ok(ran > 900, "кадров прогнано: " + ran);
  eq(bad.slice(0, 3).join(" ;; "), "", "ни в одной сцене нет NaN и бесконечностей");
}));

/* ── 2а. сейв пишется и читается из любой сцены ──
   Игрок жмёт «выход» из пещеры, с грунта, из базы — и в каждой из этих точек
   сейв должен уйти целиком и вернуться. Проверяем полный круг:
   snapshot → строка → разбор → applySave → мир снова живой. */
TEST_SUITES.push(() => suite("сквозной: из любой сцены сейв пишется, читается и полёт продолжается", () => {
  const bad = [];
  let n = 0;
  for (const sc of lookScenes()) {
    resetWorld();
    let set = true;
    try { set = sc.set() !== false; } catch (e) { continue; }
    if (!set || G.mode === "none") continue;
    try { steps(30, stepWorld); } catch (e) { bad.push(sc.id + " · прогон: " + e.message); continue; }
    let js = "";
    try { js = JSON.stringify(snapshot()); } catch (e) { bad.push(sc.id + " · запись: " + e.message); continue; }
    if (!js || js.length < 200) { bad.push(sc.id + " · сейв пуст (" + (js || "").length + " б)"); continue; }
    let loaded = false;
    try { loaded = applySave(JSON.parse(js)); }
    catch (e) { bad.push(sc.id + " · чтение: " + e.message + " | " + String(e.stack || "").split("\n")[1]); continue; }
    if (!loaded) { bad.push(sc.id + " · applySave отказался"); continue; }
    try { G.mode = "system"; stepWorld(1); drawWorld(); }
    catch (e) { bad.push(sc.id + " · после загрузки: " + e.message + " | " + String(e.stack || "").split("\n")[1]); continue; }
    n++;
  }
  resetWorld();
  ok(n >= 8, "сцен с полным кругом сейва: " + n);
  eq(bad.slice(0, 3).join(" ;; "), "", "сейв пишется и читается из любой сцены");
}));

/* ── 2б. круг сейва ничего не теряет ──
   Правило проекта: список полей в applySave — белый, и новое поле в него
   вписывают руками. Забытое поле не падает и не краснеет: оно просто
   пропадает при следующей загрузке, и заметить это можно только сравнив
   сейв ДО и ПОСЛЕ. Здесь это и делается — на прожитом мире, где поля
   заполнены, а не пусты. */
/* Судим ПОТЕРЮ, а не разницу: загрузка имеет полное право дополнить запись
   (пустой techLvl превращается в таблицу нулей, курс бон заводится по
   основанию) и обязана переставить часы (tMs, t0). Потеря — это когда
   осмысленное значение вернулось пустым или не вернулось вовсе. */
function e2eLost(a, b, path, out) {
  if (out.length >= 8) return out;
  const dead = v => v === undefined || v === null || v === "" || v === 0 || v === false ||
    (Array.isArray(v) && !v.length) || (v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
  if (dead(a)) return out;                       /* пустое и не могло потеряться */
  if (a && typeof a === "object") {
    if (dead(b)) { out.push(path + " пропало целиком"); return out; }
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || b.length < a.length) { out.push(path + ": было " + a.length + ", стало " + (Array.isArray(b) ? b.length : "не список")); return out; }
      for (let i = 0; i < a.length; i++) e2eLost(a[i], b[i], path + "[" + i + "]", out);
      return out;
    }
    for (const k in a) e2eLost(a[k], b[k], path + "." + k, out);
    return out;
  }
  if (dead(b)) out.push(path + ": " + JSON.stringify(a) + " → " + JSON.stringify(b));
  return out;
}
TEST_SUITES.push(() => suite("сквозной: круг сейва не теряет ни одного поля", () => {
  resetWorld(); fuzzRich();
  /* полю положена разница: ts — час записи, log — загрузка пишет в тетрадь строку */
  const FREE = ["ts", "log"];
  const a = snapshot();
  let js = "";
  try { js = JSON.stringify(a); } catch (e) { ok(false, "сейв прожитого мира пишется: " + e.message); return; }
  ok(applySave(JSON.parse(js)), "сейв прожитого мира читается");
  const b = snapshot(), lost = [];
  for (const k in a) {
    if (FREE.indexOf(k) >= 0) continue;
    e2eLost(a[k], b[k], k, lost);
  }
  eq(lost.slice(0, 6).join(" ;; "), "", "после загрузки все поля на месте (" + Object.keys(a).length + " полей)");
  resetWorld();
}));

/* ── 3. сейв прошлой версии ──
   Каждое новое поле делает сейвы всех прошлых версий «неполными», и правило
   проекта требует безопасного значения по умолчанию в applySave. Слово
   «требует» ничего не стоит, пока никто не проверил: снимаем поле за полем
   и грузимся. То же со значением null — облако возвращает его вместо
   пустой карты (та самая ошибка `{}` → `[]`, M286). */
TEST_SUITES.push(() => suite("сквозной: сейв без поля и с пустым полем грузится — старая версия не за дверью", () => {
  resetWorld(); fuzzRich();
  const base = JSON.parse(JSON.stringify(snapshot()));
  const bad = [];
  let n = 0;
  /* мир рисуется — но потерянное поле кусает не мир, а ЭКРАН: именно там
     число превращают в подпись. Прогонять все вкладки на каждое поле дорого,
     поэтому вкладки идут по кругу: за две сотни проверок каждая успевает
     встретиться с десятком разных увечий. */
  const screens = [];
  for (const b of document.querySelectorAll("#tableTabs button")) screens.push(["стол", b.dataset.tab]);
  for (const b of document.querySelectorAll("#stTabs button")) screens.push(["станция", b.dataset.tab]);
  let si = 0;
  for (const k of Object.keys(base)) {
    if (k === "v") continue;
    for (const mode of ["нет", "null"]) {
      const s = JSON.parse(JSON.stringify(base));
      if (mode === "нет") delete s[k]; else s[k] = null;
      resetWorld();
      const scr = screens.length ? screens[si++ % screens.length] : null;
      try {
        applySave(s); stepWorld(1); drawWorld();
        if (scr) {
          if (scr[0] === "стол") { tableTab = scr[1]; tableRender(); }
          else { G.st = G.sys.station; G.mode = "dock"; tab = scr[1]; renderTab(); G.mode = "system"; G.st = null; }
        }
        n++;
      }
      catch (e) {
        bad.push("«" + k + "» " + mode + (scr ? " · " + scr[0] + "/" + scr[1] : "") + ": " +
          e.message + " | " + String(e.stack || "").split("\n")[1]);
        break;
      }
    }
  }
  tableTab = "ether"; tab = "market";
  document.querySelectorAll(".scr.open").forEach(e => e.classList.remove("open"));
  resetWorld();
  ok(n > 100, "проверок сейва: " + n);
  eq(bad.slice(0, 4).join(" ;; "), "", "сейв без любого поля грузится, рисуется и открывает экраны");
}));

/* ── 4. текст, который читает игрок ──
   «undefined» в строке — самый заметный баг из всех: автор видит его первым, а
   набор до сих пор не видел ни одного, потому что смотрел на числа. Смотрим на
   строки: тетрадь, подсказка, сообщение и всё, что нарисовали закладки стола и
   вкладки станции на прожитом мире. */
TEST_SUITES.push(() => suite("сквозной: в тексте игры нет «undefined», «NaN» и «[object Object]»", () => {
  const DIRT = /undefined|\bNaN\b|\[object |\bnull\b/;
  const bad = [];
  /* набираем текст жизнью: прогон по сценам пишет в тетрадь сам */
  for (const sc of lookScenes()) {
    resetWorld();
    let set = true;
    try { set = sc.set() !== false; } catch (e) { continue; }
    if (!set || G.mode === "none") continue;
    try { e2eHands(sc.id.length + 3, 60, () => stepWorld(1)); } catch (e) { continue; }
    for (const row of G.log) if (DIRT.test(row.s || "")) bad.push(sc.id + " · тетрадь: " + String(row.s).slice(0, 60));
    if (DIRT.test(G.prompt || "")) bad.push(sc.id + " · подсказка: " + String(G.prompt).slice(0, 60));
    if (DIRT.test(G.msg || "")) bad.push(sc.id + " · сообщение: " + String(G.msg).slice(0, 60));
  }
  /* и то, что нарисовано на экранах прожитого мира */
  resetWorld(); fuzzRich();
  const tabs = [...document.querySelectorAll("#tableTabs button")].map(b => b.dataset.tab);
  for (const t of tabs) {
    try { tableTab = t; tableRender(); } catch (e) { continue; }
    const box = document.getElementById("tableBody");
    const s = box ? (box.textContent || "") : "";
    const m = DIRT.exec(s);
    if (m) bad.push("стол/" + t + ": …" + s.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, " "));
  }
  tableTab = "ether";
  if (G.sys.station) {
    G.st = G.sys.station; G.mode = "dock";
    const stTabs = [...document.querySelectorAll("#stTabs button")].map(b => b.dataset.tab);
    for (const t of stTabs) {
      try { tab = t; renderTab(); } catch (e) { continue; }
      const box = document.getElementById("stBody");
      const s = box ? (box.textContent || "") : "";
      const m = DIRT.exec(s);
      if (m) bad.push("станция/" + t + ": …" + s.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, " "));
    }
    tab = "market"; G.mode = "system"; G.st = null;
  }
  document.querySelectorAll(".scr.open").forEach(e => e.classList.remove("open"));
  resetWorld();
  eq(bad.slice(0, 4).join(" ;; "), "", "в тексте нет технического мусора");
}));

/* ── 5. долгий полёт ──
   Зависание, которое автор ловит вечерами, ищут с M238, и фуззер его не
   находит: он гоняет сотни кадров, а вечер — это десятки тысяч. Кадр не
   падает, он становится всё дороже — потому что где-то растёт список,
   который никто не подрезает, и вместе с ним растёт сейв (а раздутый сейв
   уже однажды убил запись: «Invalid string length», 30.08). Меряем не
   скорость, а рост: снимок длин на 600-м кадре и на 3600-м. */
TEST_SUITES.push(() => suite("сквозной: долгий полёт не раздувает ни списки, ни сейв", () => {
  resetWorld(); fuzzRich();
  G.mode = "system";
  const lens = () => {
    const o = {};
    for (const k in G) { const v = G[k]; if (Array.isArray(v)) o[k] = v.length; }
    let n = 0;
    try { n = JSON.stringify(snapshot()).length; } catch (e) { n = -1; }
    o["·сейв"] = n;
    return o;
  };
  let crashed = "";
  const run = n => { try { e2eHands(7, n, () => { stepWorld(1); if (G.t % 9 === 0) drawWorld(); }); } catch (e) { crashed = e.message + " | " + String(e.stack || "").split("\n")[1]; } };
  run(600);
  const a = lens();
  run(3000);
  const b = lens();
  eq(crashed, "", "три тысячи кадров подряд без исключения");
  ok(a["·сейв"] > 0 && b["·сейв"] > 0, "сейв пишется в начале и в конце: " + a["·сейв"] + " → " + b["·сейв"] + " б");
  /* порог с запасом: список имеет право пополниться, но не имеет права
     стать другим по порядку. Всё, что вырастает больше чем в шесть раз И
     больше чем на две сотни, — растёт без предела */
  const grown = [];
  for (const k in b) {
    const x = a[k] | 0, y = b[k] | 0;
    if (k === "·сейв") continue;
    if (y > 200 && y > Math.max(6 * x, 6)) grown.push(k + ": " + x + " → " + y);
  }
  eq(grown.slice(0, 4).join(" ;; "), "", "ни один список не растёт без предела");
  ok(b["·сейв"] < Math.max(400000, a["·сейв"] * 3),
     "сейв не раздувается за полёт: " + a["·сейв"] + " → " + b["·сейв"] + " б");
  ok(G.log.length <= 160, "тетрадь держит своё кольцо: " + G.log.length);
  resetWorld();
}));

/* ── 6. сторож кадра за весь прогон ──
   Исключение внутри обработчика нажатия НЕ долетает до try/catch вокруг
   b.click(): язык уносит его в window.onerror. Значит, все наборы, которые
   «жмут кнопки» и молчат, могли молчать зря. Сторож кадра (28-loop) такие
   исключения ловит и считает — этот файл склеивается последним, и спрашивает
   счётчик за ВЕСЬ прогон, а не за свой набор. */
TEST_SUITES.push(() => suite("сквозной: тычок во всё, что нажимается, и сторож кадра за весь прогон", () => {
  resetWorld(); fuzzRich();
  let clicks = 0;
  const n0 = E2E_CRASHES.length;
  /* стол: верхний уровень (вещи на досках) и каждая закладка */
  const tabs = ["top", ...[...document.querySelectorAll("#tableTabs button")].map(b => b.dataset.tab)];
  for (const t of tabs) {
    try { tableTab = t; tableRender(); } catch (e) { continue; }
    for (const el of e2eClickables("#tableBody", 24)) {
      el.click(); clicks++;
      /* тычок мог увести вглубь вещи — возвращаем закладку и показываем заново */
      try { if (tableTab !== t) { tableTab = t; tableRender(); } } catch (e) { break; }
    }
  }
  tableTab = "ether";
  /* станция: вкладки и всё нажимаемое в них */
  if (G.sys.station) {
    G.st = G.sys.station; G.mode = "dock";
    for (const t of [...document.querySelectorAll("#stTabs button")].map(b => b.dataset.tab)) {
      try { tab = t; renderTab(); } catch (e) { continue; }
      for (const el of e2eClickables("#stBody", 24)) { el.click(); clicks++; }
    }
    tab = "market"; G.mode = "system"; G.st = null;
  }
  document.querySelectorAll(".scr.open").forEach(e => e.classList.remove("open"));
  resetWorld();
  ok(clicks > 60, "нажатий на прожитом мире: " + clicks);
  eq(E2E_CRASHES.length - n0, 0, "тычки не подняли ни одного сбоя" +
    (E2E_CRASHES.length > n0 ? ": " + [...new Set(E2E_CRASHES.slice(n0))].slice(0, 3).join(" ;; ") : ""));
  /* и то же за весь прогон: исключение из обработчика нажатия не долетает до
     try/catch, оно уходит в window.onerror и попадает только сюда. «проверка» —
     единственный сбой, который наводят нарочно (91a, договор сторожа кадра) */
  const real = [...new Set(E2E_CRASHES)].filter(m => !/^проверка/.test(m));
  eq(real.slice(0, 3).join(" ;; "), "", "за весь прогон сторож кадра не назвал ни одного чужого сбоя");
}));

/* ══════════════ поздний вечер ══════════════
   `fuzzRich` — это середина игры: деньги, дом, находки. Позднего мира в
   тестах нет вовсе, а он у автора и есть: ступень за двадцать, площадки со
   стройкой, наёмные руки, отбитый сектор, имя у звезды. Половина интерфейса
   (СТРОЙКА, ладдер, службы флота, экипаж) в чистом мире просто не рисуется,
   то есть до сих пор не проверялась ничем. */
function e2eLate() {
  fuzzRich();
  const key = G.sx + "," + G.sy, now = Date.now();
  /* ворота ступени (12ad): садились, бурили, оставили дрона, отбили, назвали */
  G.place[key + "/0"] = { f: 1, l: 2, n: 3, take: 1, hurt: 0, care: 2 };
  G.occCalm[key] = 1; G.names[key] = "Отрадное"; G.rep[key] = 3;
  const H = G.hold[key] = G.hold[key] || {};
  H.deeds = { drone: 6, drill: 4, cargo: 900 };
  H.bld = {};
  let n = 0;
  for (const id in BLD) { H.bld[id] = { lvl: 3, t0: now - 2e6, ready: now - 1e6, my: {}, got: {} }; if (++n >= 6) break; }
  /* руки — настоящие, из генератора станции, а не выдуманные объекты */
  if (typeof stationMercs === "function" && typeof hireMerc === "function")
    for (const c of stationMercs(G.sys).slice(0, 3)) { try { hireMerc(c); } catch (e) { } }
  if (typeof bldTick === "function") { try { bldTick(); } catch (e) { } }
}
TEST_SUITES.push(() => suite("сквозной: поздний мир — ступень, стройка, экипаж — рисуется и жмётся", () => {
  resetWorld(); e2eLate();
  const r = (typeof rungOf === "function") ? rungOf(G.sx, G.sy) : 0;
  ok(r >= 15, "ступень позднего мира: " + r);
  ok(G.crew.length > 0, "руки наняты: " + G.crew.length);
  const n0 = E2E_CRASHES.length, bad = [];
  let clicks = 0, drawn = 0;
  const sweep = (tabsSel, bodySel, setTab, render, ru) => {
    for (const t of [...document.querySelectorAll(tabsSel)].map(b => b.dataset.tab)) {
      try { setTab(t); render(); drawn++; }
      catch (e) { bad.push(ru + "/" + t + " · отрисовка: " + e.message + " | " + String(e.stack || "").split("\n")[1]); continue; }
      for (const el of e2eClickables(bodySel, 24)) {
        el.click(); clicks++;
        try { setTab(t); render(); } catch (e) { bad.push(ru + "/" + t + " · после тычка: " + e.message); break; }
      }
    }
  };
  sweep("#tableTabs button", "#tableBody", t => { tableTab = t; }, () => tableRender(), "стол");
  tableTab = "ether";
  if (G.sys.station) {
    G.st = G.sys.station; G.mode = "dock";
    sweep("#stTabs button", "#stBody", t => { tab = t; }, () => renderTab(), "станция");
    tab = "market"; G.mode = "system"; G.st = null;
  }
  document.querySelectorAll(".scr.open").forEach(e => e.classList.remove("open"));
  ok(drawn > 15, "экранов нарисовано: " + drawn);
  ok(clicks > 40, "нажатий: " + clicks);
  eq(bad.slice(0, 3).join(" ;; "), "", "поздний мир рисует каждый экран");
  eq(E2E_CRASHES.length - n0, 0, "и не роняет ни одного обработчика" +
    (E2E_CRASHES.length > n0 ? ": " + [...new Set(E2E_CRASHES.slice(n0))].slice(0, 3).join(" ;; ") : ""));
  resetWorld();
}));
TEST_SUITES.push(() => suite("сквозной: сейв позднего мира ходит по кругу без потерь", () => {
  resetWorld(); e2eLate();
  let js = "";
  try { js = JSON.stringify(snapshot()); } catch (e) { ok(false, "поздний сейв пишется: " + e.message); return; }
  ok(js.length > 2000, "поздний сейв весит: " + js.length + " б");
  const a = JSON.parse(js);
  ok(applySave(JSON.parse(js)), "поздний сейв читается");
  const b = snapshot(), lost = [];
  for (const k in a) { if (k === "ts" || k === "log") continue; e2eLost(a[k], b[k], k, lost); }
  eq(lost.slice(0, 6).join(" ;; "), "", "поздние поля переживают загрузку");
  /* и ступень после загрузки та же: она считается из состояния, и потерянное
     поле обвалило бы её молча — вместе со всей стройкой */
  ok(rungOf(G.sx, G.sy) >= 15, "ступень после загрузки: " + rungOf(G.sx, G.sy));
  resetWorld();
}));

/* ══════════════ вечер за игрой ══════════════
   Наборы ставят сцену и гоняют её на месте. Игрок так не играет: он садится,
   копает, лезет в пещеру, взлетает, прыгает в соседнюю систему — и всё это
   одним куском, без resetWorld между. Именно так копится состояние, в котором
   автор ловит зависание, и именно эти переходы никем не пройдены подряд.
   Здесь один непрерывный вечер: три системы, полный круг в каждой, с записью
   и чтением сейва на каждом привале. */
function e2eFind(pred) {
  for (let r = 0; r < 12; r++)for (let x = -r; x <= r; x++)for (let y = -r; y <= r; y++) {
    if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
    if (!starAt(x, y)) continue;
    const s = getSystem(x, y);
    if (pred(s)) return s;
  }
  return null;
}
TEST_SUITES.push(() => suite("сквозной: вечер за игрой — три системы, посадка, шахта, пещера, взлёт, прыжок", () => {
  resetWorld(); fuzzRich();
  const bad = [], seenSys = {}, n0 = E2E_CRASHES.length;
  let legs = 0, frames = 0, sizes = [];
  const leg = (ru, fn) => { try { fn(); legs++; } catch (e) { bad.push(ru + ": " + e.message + " | " + String(e.stack || "").split("\n")[1]); } };
  const fly = n => e2eHands(legs + 5, n, () => { stepWorld(1); if (G.t % 7 === 0) drawWorld(); frames++; });
  for (let i = 0; i < 3; i++) {
    const s = e2eFind(q => !seenSys[q.key] && (q.planets || []).some(p => p.type !== "gas"));
    if (!s) break;
    seenSys[s.key] = 1;
    leg("прыжок " + i, () => { G.sx = s.sx; G.sy = s.sy; G.sys = s; G.ap = null; G.orbit = null; G.mode = "system"; fly(120); });
    leg("посадка " + i, () => { landOnTestPlanet(); fly(150); });
    /* из шахты игрок выходит кнопкой, и она есть только пока он в шахте:
       случайные руки могли выйти сами (взрывом, лифтом), и второй выход
       был бы уже не игрой, а тычком в пустоту */
    leg("шахта " + i, () => { enterDig(); fly(120); if (G.mode === "dig" && G.dig) exitDig(); });
    leg("пещера " + i, () => { enterCave(); if (G.cave) { fly(120); exitCave(); } });
    leg("взлёт " + i, () => { if (G.mode === "surface") launch(); fly(90); });
    /* привал: пишем и читаем — так делает автосейв, и так же вечер продолжается */
    leg("сейв " + i, () => {
      const js = JSON.stringify(snapshot());
      sizes.push(js.length);
      if (!applySave(JSON.parse(js))) throw new Error("applySave отказался");
      G.mode = "system"; stepWorld(1); drawWorld();
    });
    const sick = e2eScan(G, x => !Number.isFinite(x));
    if (sick.length) bad.push("после круга " + i + ": " + sick.slice(0, 2).join(", "));
  }
  ok(legs >= 15, "переходов пройдено: " + legs);
  ok(frames > 1200, "кадров за вечер: " + frames);
  eq(bad.slice(0, 3).join(" ;; "), "", "вечер прошёл без единого исключения и без NaN");
  eq(E2E_CRASHES.length - n0, 0, "и сторож кадра за вечер молчал" +
    (E2E_CRASHES.length > n0 ? ": " + [...new Set(E2E_CRASHES.slice(n0))].slice(0, 2).join(" ;; ") : ""));
  /* сейв за вечер не должен разбухать: он и есть первая жертва накопления */
  ok(sizes.length < 2 || sizes[sizes.length - 1] < sizes[0] * 2 + 20000,
     "сейв за вечер не разбух: " + sizes.join(" → ") + " б");
  resetWorld();
}));

/* ══════════════ resetWorld обязана возвращать мир, а не почти мир ══════════════
   Каждый набор начинается с `resetWorld()` — на этом держится вся изоляция.
   Но список полей там писан руками, а полей у игры сто шестьдесят пять, и
   новые заводятся каждую неделю. Забытое поле не роняет ничего: оно просто
   переезжает из набора в набор, и набор, зелёный в одиночку, краснеет в общем
   прогоне — или, хуже, наоборот. Ровно так и вышло 04.09: половинчатая Вега
   из набора про теплицу доехала до позднего мира, там стала NaN, а через круг
   сейва — null, и экран БАЗЫ умер (M329).

   Сравниваем не с идеей, а с фактом: снимок мира, снятый на склейке, до
   первого набора. Всё, что после `resetWorld()` не совпало, — грязь. */
TEST_SUITES.push(() => suite("сквозной: resetWorld возвращает мир к тому, каким его завела игра", () => {
  if (!E2E_FRESH) { ok(false, "снимок чистого мира не снялся"); return; }
  resetWorld();
  let now = null;
  try { now = JSON.parse(JSON.stringify(snapshot())); } catch (e) { ok(false, "снимок не снялся: " + e.message); return; }
  /* этим полям разница положена: час записи, кошелёк и место мир заводит
     сам (resetWorld ставит стартовую систему), тетрадь пишет любая мелочь */
  /* Чем resetWorld владеет — спрашиваем у неё самой: имена, которым она
     присваивает, объявлены её делом (пустая карта вместо «поля ещё нет» —
     то же самое по смыслу, `placeAll()` и родня заводят её на первом
     обращении). Судим только то, чего она не касается вовсе: такое поле
     завелось лениво в чужом наборе и переехало сюда. */
  const owned = new Set();
  {
    const src = String(resetWorld), re = /G\.([A-Za-z0-9_]+)\s*[=[]/g;
    let m; while ((m = re.exec(src))) owned.add(m[1]);
  }
  ok(owned.size > 40, "resetWorld владеет полями: " + owned.size);
  const FREE = ["ts", "log", "market", "opts", "seenPrices", "trade"];
  /* сравнение по смыслу, а не по порядку ключей: `for(const k of RES_KEYS)`
     перебирает трюм в своём порядке, и JSON от этого другой при том же грузе */
  const stable = v => {
    if (v === null || typeof v !== "object") return JSON.stringify(v) || "нет";
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  };
  const dirt = [];
  for (const k in now) {
    if (FREE.indexOf(k) >= 0 || owned.has(k)) continue;
    const a = stable(E2E_FRESH[k]), b = stable(now[k]);
    if (a !== b) dirt.push(k + ": было " + a.slice(0, 26) + ", стало " + b.slice(0, 26));
  }
  eq(dirt.slice(0, 20).join(" ;; "), "", "после resetWorld в мире нет чужого (" + Object.keys(now).length + " полей)");
}));
