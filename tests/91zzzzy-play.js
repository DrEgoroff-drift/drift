/* ══════════════ глубокие сценарии (M331) ══════════════
   Автор (04.09.2026): «придумай по сценариям тесты глубокие, пользуйся опытом
   гейм дева». Опыт этот сводится к четырём вопросам, которые задают игре до
   того, как её отдадут людям, и ни один из них не про отдельную функцию:

   1. МОЖНО ЛИ ЗАСТРЯТЬ. Состояние, из которого нет ни одного хода, — самый
      дорогой дефект в игре: он не падает, не пишет в консоль и обнаруживается
      только живым человеком, у которого пропал вечер. Пустой бак, пустой
      кошелёк, разбитый корпус — по каждому должен быть выход.
   2. ПЕЧАТАЮТСЯ ЛИ ДЕНЬГИ. Любой круг «купил — продал» на одном прилавке
      обязан быть в минус, иначе экономики нет вовсе. В этой игре про это даже
      написано в коде (BUY_SPREAD, M289) — значит, есть что сторожить.
   3. ЕСТЬ ЛИ ТУПИКИ В ИНТЕРФЕЙСЕ. Экран, из которого не выйти, для игрока
      неотличим от зависания.
   4. ЧТО БУДЕТ ПОСЛЕ СМЕРТИ. Проигрыш обязан оставлять игру играбельной. */

/* ── 1. пустой бак на грунте ──
   Взлёт с баком меньше восьми зовёт эвакуацию, эвакуация без денег — полную
   потерю, а та либо возвращает домой, либо выдаёт новый «Стриж». Проверяется
   вся цепочка целиком и на всех трёх исходах: с деньгами, без денег, и без
   денег, но с домом. */
TEST_SUITES.push(() => suite("сценарий: с пустым баком на планете всегда есть выход", () => {
  const land = () => {
    resetWorld();
    const w = plWorlds(1)[0];
    plLand(w.s, w.p);
    return G.surf;
  };
  /* с деньгами: платная эвакуация к ближайшей станции */
  land(); G.fuel = 0; G.credits = 50000;
  launch();
  eq(G.mode, "system", "с деньгами: эвакуация вывела в космос");
  ok(G.fuel >= 30, "и с топливом на ход: " + G.fuel);
  ok(G.credits < 50000, "за эвакуацию заплачено: " + (50000 - G.credits) + " кр");
  ok(!G.surf && !G.land, "поверхность отпущена");
  /* без денег и без дома: корабль потерян, но игра продолжается */
  land(); G.fuel = 0; G.credits = 0; G.home = null;
  launch();
  eq(G.mode, "system", "без денег: игра не встала");
  ok(G.fuel > 0, "новый корабль с топливом: " + G.fuel);
  eq(G.shipId, "strizh", "и это «Стриж» со старта");
  ok(stat().hullMax > 0 && G.hull > 0, "корпус цел: " + G.hull);
  /* без денег, но с домом: возвращают домой, а не обнуляют */
  land(); G.fuel = 0; G.credits = 0;
  G.home = homeInit(); G.home.tier = 4; G.home.sx = G.sx; G.home.sy = G.sy;
  const tier0 = G.home.tier;
  launch();
  ok(G.mode === "system" || G.mode === "homein", "с домом: возвращение, а не обнуление (" + G.mode + ")");
  eq(G.home && G.home.tier, tier0, "дом на месте и не обнулён");
  resetWorld();
}));

/* ── 2. пустой бак в космосе ──
   На грунте выход есть, а в пустоте? Топливо тратится только на тягу и
   тормоз, а тормоз доводит до полной остановки — то есть «погасил скорость
   последними каплями» это достижимое, обычное состояние. Если из него нет ни
   одного хода, игра кончилась молча. */
TEST_SUITES.push(() => suite("сценарий: без топлива и без хода в космосе есть чем себе помочь", () => {
  resetWorld();
  G.mode = "system"; G.ap = null; G.orbit = null;
  G.ship.x = 1200; G.ship.y = 700; G.ship.vx = 0; G.ship.vy = 0;
  G.fuel = 0; G.credits = 0;
  for (const k of RES_KEYS) G.cargo[k] = 0;
  G.tech = new Set();
  const x0 = G.ship.x, y0 = G.ship.y;
  const r = rng(hashi(0xDEAD, 7, 3));
  let moved = false, fuelled = false, left = false;
  for (let i = 0; i < 900; i++) {
    if (i % 4 === 0) { for (const k of ["left", "right", "thrust", "brake", "act", "fire"]) keys[k] = r() < .4; actEdge = keys.act && r() < .5; }
    else actEdge = false;
    stepWorld(1); G.t += 1;
    if (Math.hypot(G.ship.x - x0, G.ship.y - y0) > 30) moved = true;
    if (G.fuel > 0) fuelled = true;
    if (G.mode !== "system") left = true;
  }
  for (const k in keys) keys[k] = false;
  actEdge = false;
  ok(moved || fuelled || left,
    "из мёртвого штиля есть ход: сдвинулся=" + moved + ", заправился=" + fuelled + ", ушёл из режима=" + left +
    " · топливо " + G.fuel.toFixed(1) + ", кредиты " + G.credits);
  resetWorld();
}));

/* ── 3. деньги не печатаются ──
   Круг «купил — продал» у одного прилавка обязан быть в минус: наценка (6%)
   плюс давление на запрос. Двадцать кругов подряд — это уже не округление,
   это проверка самого правила. */
TEST_SUITES.push(() => suite("сценарий: круг «купил — продал» на одном прилавке всегда в минус", () => {
  resetWorld();
  const sys = G.sys;
  G.credits = 100000;
  const k = TRADE_KEYS.find(x => marketFor(sys)[x] > 0) || TRADE_KEYS[0];
  ok(!!k, "на прилавке есть товар: " + k);
  let worst = -Infinity, rounds = 0;
  let prev = G.credits;
  const deltas = [];
  for (let i = 0; i < 20; i++) {
    const n = buyCargo(sys, k, 10);
    if (!n) break;
    sellCargo(sys, k, n);
    const d = G.credits - prev;
    deltas.push(n + "шт:" + d);
    worst = Math.max(worst, d);
    prev = G.credits;
    rounds++;
  }
  ok(rounds >= 10, "кругов сделано: " + rounds + " · по кругам: " + deltas.join(" "));
  ok(worst < 0, "ни один круг не вышел в плюс (лучший: " + worst + " кр)");
  ok(G.credits < 100000, "за двадцать кругов кошелёк похудел: " + (100000 - G.credits) + " кр");
  /* и покупка не берёт больше, чем есть места и денег */
  G.credits = 5;
  const much = buyCargo(sys, k, 9999);
  ok(G.credits >= 0, "кошелёк не ушёл в минус: " + G.credits);
  ok(held() <= stat().cargoMax, "трюм не переполнен: " + held() + "/" + stat().cargoMax + " (взято " + much + ")");
  resetWorld();
}));

/* ── 4. ни один экран не ловушка ──
   Экран без выхода читается ровно как зависание. Открываем каждый и ищем в
   нём кнопку, которая его закрывает: не «есть ли вообще кнопка», а закрылся
   ли он после нажатия. */
TEST_SUITES.push(() => suite("сценарий: из каждого экрана есть выход", () => {
  resetWorld(); fuzzRich();
  const bad = [];
  let checked = 0;
  /* выход у экрана либо назван словом, либо стоит в подвале — в этой игре
     подвал экрана и есть его дверь («РАЗОЙТИСЬ» у баржи, «ЗАКРЫТЬ» у стола) */
  const OUT = /ЗАКРЫТЬ|НАЗАД|ВЫЙТИ|ГОТОВО|ОТСТЫК|РАЗОЙТИСЬ|ОТМЕНА|ПОТОМ|←|✕|✖|×/i;
  const skipped = [];
  for (const scr of document.querySelectorAll(".scr")) {
    if (scr.id === "roadwin") continue;                 /* дорожный спутник живёт своим кадром */
    /* экран без единой кнопки просто не нарисован: его содержимое строится
       при показе, и судить о двери в пустой комнате нечего */
    if (!scr.querySelector("button")) { skipped.push(scr.id); continue; }
    scr.classList.add("open");
    const outs = [...scr.querySelectorAll("button")].filter(b =>
      !b.disabled && (OUT.test(b.textContent || "") || (b.closest("footer") && scr.contains(b.closest("footer")))));
    if (!outs.length) { bad.push(scr.id + ": нет ни одной кнопки выхода"); scr.classList.remove("open"); continue; }
    let closed = false;
    for (const b of outs) {
      b.click();
      if (!scr.classList.contains("open")) { closed = true; break; }
      scr.classList.add("open");
    }
    checked++;
    if (!closed) bad.push(scr.id + ": кнопки выхода есть («" + outs.map(b => b.textContent.trim()).slice(0, 3).join("», «") + "»), но экран не закрылся");
    scr.classList.remove("open");
  }
  resetWorld();
  ok(checked >= 6, "экранов проверено: " + checked + (skipped.length ? " · не нарисованы: " + skipped.join(", ") : ""));
  eq(bad.slice(0, 4).join(" ;; "), "", "каждый экран отпускает игрока");
}));

/* ── 5. после смерти игра продолжается ──
   Разбитый корпус (`wreck`) — не конец, а аварийный ремонт. Проверяется то,
   ради чего он написан: игрок жив, у него есть ход, и он не остался в петле
   у тех же пиратов, которые его только что разобрали. */
TEST_SUITES.push(() => suite("сценарий: после аварии игрок жив, с топливом и не в петле", () => {
  resetWorld();
  G.mode = "system"; G.credits = 900;
  G.cargo.iron = 12;
  G.pirates = [{ x: G.ship.x + 40, y: G.ship.y, vx: 0, vy: 0, a: 0, hull: 50, aware: 1 }];
  G.hull = 0;
  wreck();
  ok(G.hull > 0, "корпус собран наспех: " + G.hull);
  ok(G.fuel >= 30, "топливо на ход есть: " + G.fuel);
  eq(G.mode, "system", "и игрок в космосе");
  eq(G.pirates.length, 0, "пираты не остались висеть — иначе это петля");
  eq(G.cargo.iron, 0, "груз потерян — цена аварии названа");
  ok(!G.surf && !G.land && !G.dig && !G.cave, "все режимы отпущены");
  /* и авария в подземелье тоже выводит наверх, а не оставляет в шахте */
  resetWorld();
  const w = plWorlds(1)[0]; plLand(w.s, w.p); enterDig();
  const wasDig = G.mode === "dig";
  wreck();
  ok(wasDig, "спуск в шахту состоялся");
  eq(G.mode, "system", "авария из шахты выводит в космос");
  ok(!G.dig, "шахта отпущена");
  resetWorld();
}));

/* ── 6. первый вечер окупается ──
   Прогрессия: с нуля игрок обязан выйти в плюс за один разумный рейс. Считаем
   честно, шагами игры: сесть, выбурить трюм, взлететь (топливо −8), сдать на
   станции. Если такой рейс не окупает даже собственного топлива, начало игры
   не работает — а заметить это по отдельным формулам нельзя. */
TEST_SUITES.push(() => suite("сценарий: первый рейс с нуля выходит в плюс", () => {
  resetWorld();
  const w = plWorlds(1)[0];
  const cr0 = G.credits;
  const S = plLand(w.s, w.p);
  ok(S.deposits.length > 0, "на планете есть залежи: " + S.deposits.length);
  /* бурим, пока трюм не полон: ходим по залежам, как ходил бы игрок */
  const st = stat();
  keys.act = true;
  for (let i = 0; i < 4000 && held() < st.cargoMax; i++) {
    const d = S.deposits.find(x => x.left > 0);
    if (!d) break;
    S.x = d.x; S.y = groundAt(S.tr, S.x) - PLACE_LIFT; S.on = true;
    updateSurface(1); G.t += 1;
  }
  keys.act = false;
  const load = held();
  ok(load > 0, "трюм набран: " + load + "/" + st.cargoMax);
  const fuel0 = G.fuel;
  launch();
  eq(G.mode, "system", "взлетели");
  ok(G.fuel < fuel0, "взлёт стоил топлива: " + (fuel0 - G.fuel).toFixed(1));
  /* сдаём всё на станции стартовой системы */
  let got = 0;
  const sys = G.sys.station ? G.sys : null;
  if (sys) for (const k of TRADE_KEYS) if (G.cargo[k] > 0) got += sellCargo(sys, k, G.cargo[k]);
  ok(!!sys, "в стартовой системе есть станция");
  ok(got > 0, "рейс сдан за " + got + " кр");
  ok(G.credits > cr0, "и кошелёк вырос: " + cr0 + " → " + G.credits);
  /* и это не разовая случайность: выручка обязана перекрывать заправку */
  const refuel = Math.round((100 - G.fuel) * 2);
  ok(got > refuel, "выручка перекрывает заправку (" + got + " против ~" + refuel + " кр)");
  resetWorld();
}));

/* ── 7. автопилот доводит, а не наматывает круги ──
   Он тратит топливо сам, без рук игрока, и это отдельный вид беды: если он не
   сходится, бак пустеет молча, а пустой бак — то самое состояние, из которого
   до M331 не было ни одного хода. Проверка простая и честная: включаем его на
   каждое тело стартовой системы и на звезду, и смотрим два числа — дошёл ли и
   во что это обошлось. */
TEST_SUITES.push(() => suite("сценарий: автопилот доводит до цели и не съедает бак", () => {
  const bad = [], rows = [];
  let runs = 0;
  const targets = [];
  resetWorld();
  for (const p of G.sys.planets) targets.push({ ru: p.name, idx: p.idx, ap: { kind: "planet", p, phase: "fly" } });
  if (G.sys.station) targets.push({ ru: "станция", ap: { kind: "station", phase: "fly" } });
  targets.push({ ru: "звезда", ap: { kind: "star", phase: "fly" } });
  for (const T of targets.slice(0, 6)) {
    resetWorld();
    const p0 = G.sys.planets[0];
    G.mode = "system";
    G.ship.x = (p0 ? p0.orbit : 900) * .6; G.ship.y = -400;
    G.ship.vx = 0; G.ship.vy = 0; G.fuel = 100;
    /* resetWorld чистит кэш систем (0.359.3): планета-цель берётся заново
       по своему номеру, а не по старой ссылке */
    if (T.ap.kind === "planet") { T.ap.p = G.sys.planets[T.idx]; if (!T.ap.p) continue; }
    G.ap = T.ap;
    let f = 0;
    for (f = 0; f < 4000 && G.ap; f++) { stepWorld(1); G.t += 1; }
    runs++;
    const spent = 100 - G.fuel;
    rows.push(T.ru + ": " + f + " кадров, " + spent.toFixed(1) + " топлива");
    if (G.ap) bad.push(T.ru + ": не дошёл за 4000 кадров (остаток " + G.fuel.toFixed(1) + ")");
    if (G.fuel <= 0) bad.push(T.ru + ": высадил бак досуха");
    if (!Number.isFinite(G.ship.x) || !Number.isFinite(G.ship.vx)) bad.push(T.ru + ": корабль ушёл в NaN");
  }
  resetWorld();
  ok(runs >= 3, "заходов автопилота: " + runs + " · " + rows.join(" · "));
  eq(bad.slice(0, 3).join(" ;; "), "", "автопилот доводит и оставляет топливо");
}));
