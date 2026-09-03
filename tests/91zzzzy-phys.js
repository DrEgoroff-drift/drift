/* ══════════════ физика мира (M330) ══════════════
   Автор (04.09.2026): «физика мира как оно там». Мир держится на десятке
   правил, и ни одно из них до сих пор не было записано проверкой: тяга толкает
   по носу, тормоз гасит, топливо тратится только на работу, планета не уходит
   с орбиты, луна не отстаёт от планеты, человек не проваливается сквозь пол.

   И главная ось, которой в наборах не было вовсе: ШАГ КАДРА. Кадр считает
   `dt=clamp((now-last)/16.667,0,3)` (28-loop) — то есть на рваном кадре мир
   считается втрое крупнее шагом. Физика, верная при dt=1 и врущая при dt=3, —
   классика жанра: у автора она выглядит как «проваливаюсь сквозь землю, когда
   подтормаживает», и повторить это руками нельзя. Поэтому каждое правило,
   какое можно, проверяется на всех трёх шагах. */

const PHYS_DT = [1, 2, 3];
/* Корабль в чистом поле: без автопилота, без захвата, без пиратов — и ВНУТРИ
   системы. За её краем работает гравитационный якорь (17-mode-system): он
   доворачивает и курс, и вектор скорости к звезде, так что «тяга толкает по
   носу» там просто неверно. Проверять физику надо там, где игрок летает. */
function physShip() {
  resetWorld();
  G.mode = "system";
  G.ship.x = 0; G.ship.y = -760; G.ship.vx = 0; G.ship.vy = 0; G.ship.a = 0; G.ship.av = 0;
  G.ap = null; G.orbit = null; G.pirates = []; G.shots = [];
  G.fuel = 100;
  return G.ship;
}
/* прогон одного участка и вклад ИМЕННО клавиши: то же время без неё —
   вычитается. Так проверка не зависит от того, что ещё тянет корабль */
function physRun(n, dt, set) {
  const sh = physShip();
  const v0 = { x: sh.vx, y: sh.vy };
  for (const k in keys) keys[k] = false;
  if (set) set();
  for (let i = 0; i < n; i++) { updateSystem(dt); G.t += dt; }
  for (const k in keys) keys[k] = false;
  return { dx: sh.vx - v0.x, dy: sh.vy - v0.y, sh };
}

/* ── 1. тяга, тормоз, топливо ── */
TEST_SUITES.push(() => suite("физика: тяга толкает по носу, тормоз гасит, топливо уходит на работу", () => {
  const st0 = (() => { physShip(); return stat(); })();
  /* тяга по носу: нос смотрит вправо (a=0), значит и разгон вправо. Вклад
     считается против холостого прогона — свободный полёт вычитается */
  const idle = physRun(60, 1);
  const f1 = G.fuel;
  const push = physRun(60, 1, () => { keys.thrust = true; });
  const dx = push.dx - idle.dx, dy = push.dy - idle.dy;
  ok(dx > .5, "разгон по носу: Δvx=" + dx.toFixed(2));
  ok(Math.abs(dy) < .25, "вбок не сносит: Δvy=" + dy.toFixed(3));
  near(Math.hypot(dx, dy), .082 * st0.thr * 60, .5, "скорость равна тяге на время");
  ok(G.fuel < f1, "топливо на тягу тратится: " + (f1 - G.fuel).toFixed(2));
  near(f1 - G.fuel, .021 * 60, .2, "и ровно столько, сколько сказано");
  /* накат: без клавиш топливо не тратится и скорость не падает сама */
  const sh = push.sh;
  const v0 = Math.hypot(sh.vx, sh.vy), f0 = G.fuel;
  for (let i = 0; i < 120; i++) { updateSystem(1); G.t += 1; }
  eq(Math.round(G.fuel * 1000), Math.round(f0 * 1000), "на накате топливо не тратится");
  near(Math.hypot(sh.vx, sh.vy), v0, .01, "и скорость на накате не тает — это космос");
  /* тормоз: гасит монотонно и не разгоняет обратно */
  let prev = Math.hypot(sh.vx, sh.vy), grew = 0;
  keys.brake = true;
  for (let i = 0; i < 200; i++) {
    updateSystem(1); G.t += 1;
    const s = Math.hypot(sh.vx, sh.vy);
    if (s > prev + 1e-9) grew++;
    prev = s;
  }
  keys.brake = false;
  eq(grew, 0, "тормоз ни разу не разогнал");
  ok(prev < .05, "и погасил до нуля: " + prev.toFixed(3));
  resetWorld();
}));

/* ── 2. потолок скорости держится при любом шаге кадра ──
   Предел один (`maxSp`), а считается он после разгона: шаг втрое крупнее не
   имеет права его перепрыгнуть. */
TEST_SUITES.push(() => suite("физика: потолок скорости держится и на рваном кадре", () => {
  for (const dt of PHYS_DT) {
    const sh = physShip();
    const st = stat(), cap = 6.4 + st.thr * 1.6;
    G.fuel = 100;
    keys.thrust = true;
    let over = 0, top = 0;
    for (let i = 0; i < 400; i++) {
      updateSystem(dt); G.t += dt;
      const s = Math.hypot(sh.vx, sh.vy);
      top = Math.max(top, s);
      if (s > cap + 1e-6) over++;
    }
    keys.thrust = false;
    eq(over, 0, "шаг " + dt + ": ни одного кадра выше потолка (лучшее " + top.toFixed(2) + " из " + cap.toFixed(2) + ")");
    ok(top > cap * .9, "шаг " + dt + ": до потолка при этом дошли");
  }
  resetWorld();
}));

/* ── 3. без топлива нет ни тяги, ни тормоза ──
   Это не мелочь: на этом держится смысл топлива вообще и работа эвакуации. */
TEST_SUITES.push(() => suite("физика: пустой бак не даёт ни разгона, ни торможения", () => {
  const sh = physShip();
  G.fuel = 0;
  keys.thrust = true;
  for (let i = 0; i < 60; i++) { updateSystem(1); G.t += 1; }
  keys.thrust = false;
  near(Math.hypot(sh.vx, sh.vy), 0, .001, "без топлива корабль не разгоняется");
  /* и наоборот: разогнанный корабль с пустым баком не тормозится */
  sh.vx = 3; sh.vy = 0; G.fuel = 0;
  keys.brake = true;
  for (let i = 0; i < 60; i++) { updateSystem(1); G.t += 1; }
  keys.brake = false;
  ok(Math.hypot(sh.vx, sh.vy) > 2.5, "и не тормозится: " + Math.hypot(sh.vx, sh.vy).toFixed(2));
  eq(G.fuel, 0, "и бак не уходит в минус");
  resetWorld();
}));

/* ── 4. небо держится ──
   Планета ходит по эллипсу (`keplerPos`), луна — вокруг планеты. Ошибка в
   интегрировании не роняет ничего: планета просто медленно уезжает из системы,
   а луна отстаёт от своей планеты — и это видно только глазом и только потом. */
TEST_SUITES.push(() => suite("физика: планеты держатся орбит, луны — своих планет", () => {
  resetWorld();
  const bad = [], sys = G.sys;
  let bodies = 0, moons = 0;
  const rmin = {}, rmax = {};
  for (const dt of PHYS_DT) {
    for (let i = 0; i < 600; i++) {
      updateSystem(dt); G.t += dt;
      for (const p of sys.planets) {
        const r = Math.hypot(p.x, p.y), k = p.idx;
        rmin[k] = Math.min(rmin[k] == null ? 1e9 : rmin[k], r);
        rmax[k] = Math.max(rmax[k] == null ? 0 : rmax[k], r);
        for (const m of p.moons) {
          /* луна тоже ходит по эллипсу: расстояние гуляет между a(1−e) и a(1+e) */
          const d = Math.hypot(m.x - p.x, m.y - p.y);
          const lo = m.orbit * (1 - m.ecc) - 2, hi = m.orbit * (1 + m.ecc) + 2;
          if (d < lo || d > hi)
            { if (bad.length < 3) bad.push("луна ушла от планеты: " + d.toFixed(0) + " вне " + lo.toFixed(0) + "…" + hi.toFixed(0)); }
        }
      }
    }
  }
  for (const p of sys.planets) {
    bodies++; moons += p.moons.length;
    const lo = p.orbit * (1 - p.ecc) - 2, hi = p.orbit * (1 + p.ecc) + 2;
    if (rmin[p.idx] < lo - 1 || rmax[p.idx] > hi + 1)
      bad.push(p.name + ": радиус " + rmin[p.idx].toFixed(0) + "…" + rmax[p.idx].toFixed(0) +
        " вне эллипса " + lo.toFixed(0) + "…" + hi.toFixed(0));
    /* и она действительно ходит, а не стоит на месте */
    if (rmax[p.idx] - rmin[p.idx] < .001 && p.ecc > .02) bad.push(p.name + ": эксцентриситет есть, а хода нет");
  }
  ok(bodies >= 2, "тел на орбитах: " + bodies + ", лун: " + moons);
  eq(bad.slice(0, 3).join(" ;; "), "", "небо держится на всех трёх шагах кадра");
  resetWorld();
}));

/* ── 5. мир один и тот же ──
   Ничего эфемерного не хранится: рельеф, залежи, куртины и устье пещеры
   рождаются заново при каждой посадке. Значит, второй заход на ту же планету
   ОБЯЗАН дать то же самое место — иначе игрок, вернувшись, не найдёт ни своей
   пещеры, ни своей залежи, а тест, поймавший баг, не повторит его никогда. */
TEST_SUITES.push(() => suite("физика: та же планета даёт тот же мир — рельеф, залежи, устье", () => {
  const bad = [];
  let worlds = 0;
  for (const { s, p } of plWorlds(6)) {
    /* рельеф — чистая функция: два вызова подряд обязаны совпасть до бита */
    const a = genTerrain(p), b = genTerrain(p);
    let dh = 0;
    for (let i = 0; i < a.N; i++) dh = Math.max(dh, Math.abs(a.h[i] - b.h[i]));
    if (dh > 0) bad.push(p.name + ": рельеф разошёлся на " + dh.toFixed(3));
    if (a.padX !== b.padX) bad.push(p.name + ": площадка переехала");
    if (a.rocks.length !== b.rocks.length) bad.push(p.name + ": валунов стало другое число");
    /* и целая посадка тоже: те же залежи, те же куртины, то же устье */
    resetWorld(); const S1 = plLand(s, p);
    const sig = X => X.deposits.map(d => Math.round(d.x) + ":" + d.res).join(",") + "|" +
      X.plants.length + "|" + X.fauna.length + "|" + Math.round(X.cave.x);
    const s1 = sig(S1);
    resetWorld(); const s2 = sig(plLand(s, p));
    if (s1 !== s2) bad.push(p.name + ": вторая посадка дала другое место");
    worlds++;
  }
  resetWorld();
  ok(worlds >= 5, "миров сверено: " + worlds);
  eq(bad.slice(0, 3).join(" ;; "), "", "мир повторяется в точности");
}));

/* ── 6. падение и грунт ──
   Падение с любой высоты и на любом шаге кадра обязано кончиться грунтом, а
   не под ним. Проверяется вместе с уступами: место падения выбирается на
   склоне, а не на ровном. */
TEST_SUITES.push(() => suite("физика: падение кончается грунтом, а не под ним, при любом шаге кадра", () => {
  const bad = [];
  let drops = 0;
  for (const { s, p } of plWorlds(3)) {
    for (const dt of PHYS_DT) {
      resetWorld();
      const S = plLand(s, p);
      /* поднимаем на двести пикселей и отпускаем */
      S.y -= 200; S.on = false; S.vy = 0; S.swim = 0;
      let under = 0, landed = false;
      for (let i = 0; i < 400 && !landed; i++) {
        updateSurface(dt); G.t += dt;
        const gy = groundAt(S.tr, S.x) - PLACE_LIFT;
        if (S.swim > .5) { landed = true; break; }
        if (S.y > gy + 1.5) under++;
        if (S.on) landed = true;
      }
      drops++;
      if (!landed) bad.push(p.name + " шаг " + dt + ": так и не приземлился");
      if (under) bad.push(p.name + " шаг " + dt + ": " + under + " кадров под грунтом");
      /* и отдельно — влёт в грунт на огромной скорости: тоннелирование */
      S.y = groundAt(S.tr, S.x) - PLACE_LIFT - 40; S.on = false; S.vy = 90;
      updateSurface(dt); G.t += dt;
      const gy = groundAt(S.tr, S.x) - PLACE_LIFT;
      if (S.y > gy + 1.5) bad.push(p.name + " шаг " + dt + ": скорость 90 пробила грунт на " + Math.round(S.y - gy));
    }
  }
  resetWorld();
  ok(drops >= 9, "падений проверено: " + drops);
  eq(bad.slice(0, 3).join(" ;; "), "", "грунт держит на любой скорости и любом шаге");
}));

/* ── 7. камень в пещере твёрдый на рваном кадре ──
   Шаг по X проверяет только КОНЕЧНУЮ точку (`caveMoveX`): на шаге втрое
   крупнее тело может перепрыгнуть тонкую перемычку и оказаться по ту сторону
   камня. Это и есть «прошёл сквозь стену» — и ловится только так. */
TEST_SUITES.push(() => suite("физика: в пещере тело не проходит сквозь камень и на рваном кадре", () => {
  const bad = [];
  let frames = 0, inside = 0;
  for (const { s, p } of plWorlds(3)) {
    for (const dt of PHYS_DT) {
      resetWorld();
      plLand(s, p); enterCave();
      const C = G.cave;
      if (!C) continue;
      const r = rng(hashi(0xB0DE, p.seed, dt));
      for (let i = 0; i < 300; i++) {
        if (i % 3 === 0) { keys.left = r() < .45; keys.right = r() < .45; keys.thrust = r() < .3; }
        updateCave(dt); G.t += dt; frames++;
        if (!caveBoxFree(C, C.x, C.y)) {
          inside++;
          if (bad.length < 3) bad.push(p.name + " шаг " + dt + ", кадр " + i + ": тело в камне");
        }
      }
      for (const k in keys) keys[k] = false;
    }
  }
  resetWorld();
  ok(frames > 2000, "кадров под землёй: " + frames);
  eq(inside, 0, "ни одного кадра внутри породы");
  eq(bad.slice(0, 3).join(" ;; "), "", "камень твёрдый на всех шагах кадра");
}));

/* ── 8. что убыло из залежи, то прибыло в трюм ──
   Бурение — единственный обмен «мир → трюм», который игрок делает руками.
   Пропажа единицы по дороге не видна никак, а переполнение трюма — это уже
   бесплатный груз. */
TEST_SUITES.push(() => suite("физика: бурение ничего не теряет и не переполняет трюм", () => {
  resetWorld();
  const { s, p } = plWorlds(1)[0];
  const S = plLand(s, p);
  const st = stat();
  ok(S.deposits.length > 0, "залежей на планете: " + S.deposits.length);
  if (!S.deposits.length) return;
  const left0 = S.deposits.reduce((a, d) => a + d.left, 0), held0 = held();
  /* становимся на первую залежь и держим ДЕЙСТВИЕ */
  const d0 = S.deposits[0];
  S.x = d0.x; S.y = groundAt(S.tr, S.x) - PLACE_LIFT; S.on = true;
  keys.act = true;
  let over = 0;
  for (let i = 0; i < 1200; i++) {
    updateSurface(1); G.t += 1;
    if (held() > st.cargoMax) over++;
    /* если залежь под ногами кончилась — переходим на следующую живую */
    if (d0.left <= 0) { const nx = S.deposits.find(d => d.left > 0); if (!nx) break; S.x = nx.x; S.y = groundAt(S.tr, S.x) - PLACE_LIFT; }
  }
  keys.act = false;
  const took = left0 - S.deposits.reduce((a, d) => a + d.left, 0);
  const got = held() - held0;
  ok(took > 0, "из залежей взято: " + took);
  eq(got, took, "в трюм пришло ровно столько, сколько убыло из залежи");
  eq(over, 0, "трюм ни разу не перелился через край (" + held() + " из " + st.cargoMax + ")");
  resetWorld();
}));
