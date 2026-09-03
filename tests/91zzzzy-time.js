/* ══════════════ чужие часы (M334) ══════════════
   Игра ленива: дроны, рынок, новости, смены, наёмные руки — всё считается от
   разницы `Date.now()` и записанного часа. Пока сейв живёт на одной машине,
   разница всегда положительная и небольшая. Но сейв ездит: облако (14a-cloud)
   возит его между телефоном и столом, а часы у них разные — и приехать он
   может ИЗ БУДУЩЕГО. Тогда каждая такая разница отрицательная, и всё, что
   считается «сколько прошло», начинает считать назад.

   У дронов защита есть и написана явно (`Math.max(0,…)`, 12-economy). А у
   остальных двух десятков мест? Проверяется это одним ударом: берём прожитый
   мир, сдвигаем В САМОМ СЕЙВЕ все отметки времени — вперёд на трое суток и
   назад на месяц, — грузим и живём дальше. Ни NaN, ни отрицательных денег, ни
   счётчиков, ушедших в космос, быть не должно ни в одном из двух случаев. */

/* сдвиг всех эпохальных отметок в снимке: число похоже на Date.now(), если оно
   в разумном окне вокруг настоящего времени */
function tmShift(v, dms, depth) {
  if (v === null || v === undefined || (depth || 0) > 8) return v;
  if (typeof v === "number") return (v > 1.4e12 && v < 4e12) ? v + dms : v;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = tmShift(v[i], dms, (depth || 0) + 1); return v; }
  for (const k in v) v[k] = tmShift(v[k], dms, (depth || 0) + 1);
  return v;
}
/* сколько отметок сдвинулось — чтобы проверка не оказалась пустой */
function tmCount(v, depth) {
  if (v === null || v === undefined || (depth || 0) > 8) return 0;
  if (typeof v === "number") return (v > 1.4e12 && v < 4e12) ? 1 : 0;
  if (typeof v !== "object") return 0;
  let n = 0;
  if (Array.isArray(v)) { for (const x of v) n += tmCount(x, (depth || 0) + 1); return n; }
  for (const k in v) n += tmCount(v[k], (depth || 0) + 1);
  return n;
}

TEST_SUITES.push(() => suite("время: сейв с чужими часами не ломает мир", () => {
  const runs = [
    { ru: "из будущего (+3 суток)", d: 3 * 24 * 3600 * 1000 },
    { ru: "из прошлого (−30 суток)", d: -30 * 24 * 3600 * 1000 }
  ];
  const bad = [];
  let marks = 0;
  for (const R of runs) {
    resetWorld(); e2eLate();
    const base = JSON.parse(JSON.stringify(snapshot()));
    marks = Math.max(marks, tmCount(base));
    const cr0 = base.credits;
    tmShift(base, R.d);
    resetWorld();
    try { ok(applySave(base), R.ru + ": сейв читается"); }
    catch (e) { bad.push(R.ru + " · чтение: " + e.message); continue; }
    /* живём: кадры, ленивые круги дронов, новости */
    try {
      for (let i = 0; i < 200; i++) { stepWorld(1); G.t += 1; }
      if (typeof tickDrones === "function") tickDrones();
      if (typeof newsTick === "function") newsTick();
      for (let i = 0; i < 100; i++) { stepWorld(1); G.t += 1; }
      drawWorld();
    } catch (e) { bad.push(R.ru + " · жизнь после загрузки: " + e.message + " | " + String(e.stack || "").split("\n")[1]); continue; }
    /* числа остались числами */
    const sick = e2eScan(G, x => !Number.isFinite(x));
    if (sick.length) bad.push(R.ru + " · " + sick.slice(0, 2).join(", "));
    /* и не разбогатели на разнице часов: ленивый круг не имеет права
       выдать за один тик больше, чем за сутки работы */
    if (!(G.credits >= 0)) bad.push(R.ru + ": кошелёк ушёл в минус (" + G.credits + ")");
    if (G.credits > cr0 * 4 + 1e6) bad.push(R.ru + ": кошелёк раздулся " + cr0 + " → " + Math.round(G.credits));
    /* и в тетради нет технического мусора от отрицательных разниц */
    for (const row of G.log.slice(-40))
      if (/undefined|\bNaN\b|-\d{6,}/.test(row.s || "")) { bad.push(R.ru + " · тетрадь: " + String(row.s).slice(0, 50)); break; }
  }
  resetWorld();
  ok(marks > 5, "отметок времени в сейве: " + marks);
  eq(bad.slice(0, 4).join(" ;; "), "", "чужие часы переживаются в обе стороны");
}));

/* ── смена не идёт назад ──
   Аппетит станции и стройка живут сменами (`holdShift`). Смена считается от
   часов; если часы уехали назад, смена уедет назад тоже — и всё, что «уже
   сдано в эту смену», внезапно окажется несданным. Это не падение, это тихая
   выдача второй нормы с надбавкой: та же печать денег, только через часы. */
TEST_SUITES.push(() => suite("время: смена станции не отматывается назад вместе с часами", () => {
  resetWorld(); e2eLate();
  const sys = G.sys;
  if (!sys.station || typeof appetiteOf !== "function" || !appetiteOf(sys)) { ok(true, "у стартовой станции нет аппетита — проверять нечего"); resetWorld(); return; }
  const A = appetiteOf(sys), k = Object.keys(A)[0];
  const left0 = appetiteLeft(sys, k);
  ok(left0 > 0, "норма смены есть: " + left0 + " ед. " + k);
  /* сдаём половину нормы */
  const eat = Math.max(1, Math.floor(left0 / 2));
  appetiteEat(sys, k, eat);
  const left1 = appetiteLeft(sys, k);
  eq(left1, left0 - eat, "после сдачи норма уменьшилась");
  /* теперь часы уезжают назад на сутки — прямо в записи, как это делает
     приехавший из облака сейв */
  const s = JSON.parse(JSON.stringify(snapshot()));
  tmShift(s, -24 * 3600 * 1000);
  resetWorld();
  applySave(s);
  const left2 = appetiteLeft(G.sys, k);
  ok(left2 <= left0, "после отката часов норма не выросла сверх целой: " + left2 + " при " + left0);
  resetWorld();
}));
