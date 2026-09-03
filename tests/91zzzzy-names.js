/* ══════════════ имена, которых нет (M332) ══════════════
   Опечатка в имени звука не падает и не краснеет: `sfx` молча выходит, если
   имени нет в таблице. То же с ключом ресурса, с видом строки журнала, с
   вкладкой станции — код зовёт по строке, а таблица про эту строку не знает,
   и механика просто не работает. Найти это глазами нельзя: строк таких в игре
   тысячи.

   Проверяется это единственным способом, каким вообще можно, — чтением
   собственного исходника. Он лежит прямо здесь: `tests.html` это игра плюс
   наборы одним файлом, и весь текст игры доступен как `document.scripts[0]`.
   Тот же приём, каким `build.ps1` ловит `typeof`-сторожей у несуществующих
   функций, только изнутри и по таблицам. */

/* Исходник ИГРЫ, без наборов: `tests.html` это игра плюс тесты одним файлом,
   и без этого реза проверка читала бы собственные примеры и ловила сама себя
   (первый заход так и нашёл «xxx» из строки регулярного выражения выше). */
function nmSource() {
  try {
    let s = document.scripts[0] && document.scripts[0].textContent;
    if (!s || s.length < 100000) return "";
    const cut = s.indexOf("автотесты: каркас");
    if (cut > 0) s = s.slice(0, cut);
    return s;
  } catch (e) { return ""; }
}
/* все строковые литералы в вызове вида name("литерал" */
function nmCalls(src, fn) {
  const re = new RegExp(fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '\\(\\s*"([^"\\n]{1,40})"', "g");
  const out = new Set();
  let m;
  while ((m = re.exec(src))) if (m[1]) out.add(m[1]);
  return [...out];
}

TEST_SUITES.push(() => suite("имена: каждый звук, который зовут, есть в таблице звуков", () => {
  const src = nmSource();
  ok(src.length > 100000, "исходник игры доступен набору: " + Math.round(src.length / 1024) + " КБ");
  if (!src) return;
  const called = nmCalls(src, "sfx");
  ok(called.length >= 10, "имён звуков в коде: " + called.length);
  const have = new Set(Object.keys(typeof SFX === "object" ? SFX : {}));
  ok(have.size > 10, "звуков в таблице: " + have.size);
  const lost = called.filter(n => !have.has(n));
  eq(lost.slice(0, 8).join(", "), "", "ни один звук не зовут по несуществующему имени");
  /* и наоборот: звук, который не зовёт никто, — мёртвый вес, но это не
     ошибка, а повод посмотреть. Печатаем числом, без приговора */
  const idle = [...have].filter(n => called.indexOf(n) < 0);
  ok(true, "звуков без единого вызова: " + idle.length + (idle.length ? " (" + idle.slice(0, 6).join(", ") + ")" : ""));
}));

TEST_SUITES.push(() => suite("имена: ключи ресурсов в коде существуют", () => {
  const src = nmSource();
  if (!src) { ok(false, "исходник недоступен"); return; }
  /* G.cargo.xxx и RES.xxx — обращения по имени, которые не проверяет никто */
  const seen = new Set();
  let m;
  const re = /(?:G\.cargo|[^A-Za-z0-9_]RES)\.([a-zA-Z][a-zA-Z0-9_]{1,20})/g;
  while ((m = re.exec(src))) seen.add(m[1]);
  ok(seen.size > 5, "имён ресурсов в коде: " + seen.size);
  const have = new Set(RES_KEYS);
  /* эти — не ресурсы, а поля и методы самой таблицы */
  const NOT = new Set(["length", "ru", "col", "note", "base", "hasOwnProperty", "folk"]);
  const lost = [...seen].filter(k => !have.has(k) && !NOT.has(k));
  eq(lost.slice(0, 8).join(", "), "", "ни один ключ груза не выдуман (" + [...have].length + " в таблице)");
}));

TEST_SUITES.push(() => suite("имена: вид строки журнала известен тетради", () => {
  const src = nmSource();
  if (!src) { ok(false, "исходник недоступен"); return; }
  const kinds = nmCalls(src, "logAdd");
  ok(kinds.length >= 5, "видов строк в коде: " + kinds.length + " (" + kinds.slice(0, 10).join(", ") + ")");
  const have = new Set(Object.keys(typeof LOG_PAGE === "object" ? LOG_PAGE : {}));
  const lost = kinds.filter(k => !have.has(k));
  /* неизвестный вид не падает — он молча ложится на «борт», то есть строка
     уезжает не на ту полку, и найти её потом нельзя */
  eq(lost.slice(0, 6).join(", "), "", "ни одна строка не ложится на неизвестную полку");
}));

TEST_SUITES.push(() => suite("имена: вкладки станции объявлены её типом", () => {
  /* вкладка, которой нет ни у одного типа станции, не откроется никогда —
     а код для неё написан и живёт */
  /* правило живёт в `stTabsHere` (26-ui-station): доска есть у всех, стройка —
     у всех, кроме заправки, остальное объявляет тип станции. Вкладка, которой
     нет ни в одном из этих списков, не покажется никогда, а разметка и код для
     неё живут: так и нашлась мёртвая «ПЕРЕПЛАВКА» — слова `smelt` не было
     больше нигде во всей игре (M332). */
  const inTypes = new Set(["board", "site"]);
  for (const T of ST_TYPES) for (const t of T.tabs || []) inTypes.add(t);
  const inDom = [...document.querySelectorAll("#stTabs button")].map(b => b.dataset.tab);
  ok(inDom.length > 5, "вкладок в полосе: " + inDom.length);
  const orphan = inDom.filter(t => !inTypes.has(t) && t !== "home");
  eq(orphan.slice(0, 6).join(", "), "", "у каждой вкладки есть тип станции, где она бывает");
  /* обратное направление не проверяется: часть вкладок строится на лету
     (`syncTabs` собирает разделы и кнопки под конкретную станцию), и их в
     статической разметке нет по устройству — «СТРОЙКА» именно такая */
  ok(inTypes.size > inDom.length - 4, "объявленных вкладок " + inTypes.size + " при " + inDom.length + " в разметке");
}));

/* ── объявлено, но никем не читается ──
   Закон проекта: «перк без кода — ложь» (CLAUDE.md). Для перков управляющих он
   уже сторожится (91g-relic), а таблиц в игре десяток. Вещь, чей id не
   встречается в исходнике больше нигде, кроме собственного объявления, — это
   строка в списке, за которой ничего нет: игрок её видит, выбирает, покупает,
   и не получает ничего. Проверяем счётом вхождений id по тексту игры. */
function nmUses(src, id) {
  let n = 0, i = 0;
  const nd = '"' + id + '"';
  while ((i = src.indexOf(nd, i)) >= 0) { n++; i += nd.length; }
  return n;
}
TEST_SUITES.push(() => suite("имена: у каждой вещи в таблицах есть код, который её читает", () => {
  const src = nmSource();
  if (!src) { ok(false, "исходник недоступен"); return; }
  const tables = [];
  const add = (ru, obj, keys) => { if (obj) tables.push({ ru, ids: keys || Object.keys(obj) }); };
  add("техника", typeof TECH === "object" ? TECH : null);
  add("артефакты", typeof ARTIFACTS === "object" ? ARTIFACTS : null);
  add("постройки", typeof BLD === "object" ? BLD : null);
  /* МОДУЛИ сюда не берём, и это про метод, а не про них: их ключи живут
     свойствами (`G.mods.hyper`, `m.weapon`), а свойство от любого другого
     слова текстом не отличить. Строкой зовут технику, артефакты и постройки —
     их и судим. */
  ok(tables.length >= 3, "таблиц под проверкой: " + tables.map(t => t.ru + " (" + t.ids.length + ")").join(", "));
  /* Считать надо ЧТЕНИЯ, а не вхождения. Ключ в таблице объявляют двумя
     способами: без кавычек (`coil:{…}`) — тогда любое вхождение `"coil"` уже
     чтение, — и с кавычками (`{id:"slipway"}`) — тогда одно вхождение это
     само объявление. Первый заход этого не различал и обвинил восемь честных
     технологий, у каждой из которых ровно одно чтение (`T.has("coil")`). */
  /* ── одно известное исключение, и оно записано в PLAN.md ──
     Артефакт «Карта чужой руки» («на карте видно, где торгуют редким») кода не
     имеет: из семи он единственный, кого не спрашивает никто. Дописать его
     наугад нельзя — редкое сырьё рынок НЕ БЕРЁТ по замыслу (M39, прямо в
     02-world), значит «торгуют редким» означает что-то другое, и что именно —
     решает автор. Пока решение не принято, исключение стоит здесь по имени:
     оно видно, оно одно, и оно уйдёт вместе с ответом. */
  const KNOWN = new Set(["артефакты/chart"]);
  const mute = [];
  for (const T of tables)
    for (const id of T.ids) {
      const decl = (src.indexOf('id:"' + id + '"') >= 0 || src.indexOf('id: "' + id + '"') >= 0) ? 1 : 0;
      if (nmUses(src, id) - decl <= 0 && !KNOWN.has(T.ru + "/" + id)) mute.push(T.ru + "/" + id);
    }
  eq(mute.slice(0, 8).join(", "), "", "ни одна вещь не объявлена вхолостую");
}));
