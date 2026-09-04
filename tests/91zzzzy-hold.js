/* ══════════════ холдинг: круг стройки числами (M339) ══════════════
   Самая молодая и самая сложная механика игры (M289–M297): площадка, цеха,
   бункеры, пай, смены. Наборы до сих пор проверяли её экранами — рисуется ли
   СТРОЙКА, жмутся ли кнопки, — но не АРИФМЕТИКОЙ. А в производстве всегда два
   вопроса, и оба не про интерфейс: не берётся ли товар из ничего, и не
   пропадает ли сделанное по дороге в трюм.

   Смены считаются от часов (`HOLD_SHIFT` — двадцать минут), поэтому время
   двигается не ожиданием, а честной подтасовкой отметок в самой записи: так
   же его видит игрок, вернувшийся через час. */

/* система со станцией и открытой площадкой: ворота ступени — те же, что у
   игры (`rungOf` в 12ad-site), поэтому и ставим их через состояние, а не
   выдумываем запись цеха руками */
function hdSite() {
  resetWorld();
  const s = (() => {
    for (let r = 0; r < 10; r++)for (let x = -r; x <= r; x++)for (let y = -r; y <= r; y++) {
      if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
      if (!starAt(x, y)) continue;
      const q = getSystem(x, y);
      if (q.station && (q.planets || []).some(p => p.type !== "gas")) return q;
    }
    return null;
  })();
  if (!s) return null;
  G.sx = s.sx; G.sy = s.sy; G.sys = s; G.st = s.station;
  G.credits = 500000;
  const key = s.key, p = s.planets.find(q => q.type !== "gas");
  G.place[key + "/" + p.idx] = { f: 1, l: 2, n: 3, take: 0, hurt: 0, care: 1 };
  G.occCalm[key] = 1; G.names[key] = "Отрадное"; G.rep[key] = 3;
  const H = G.hold[key] = G.hold[key] || {};
  H.deeds = { drone: 6, drill: 4, cargo: 900 };
  H.bld = {};
  G.drones = [{ id: 1, sx: s.sx, sy: s.sy, pi: p.idx, res: "iron", rate: .6, pool: 100, t0: Date.now(), lastMs: Date.now(), bornMs: Date.now() }];
  return s;
}
/* заложить как игрок: стройка берёт не только кредиты, но и МАТЕРИАЛ из трюма
   (`bldCanPay` в 12ad-site), поэтому сперва привозим ровно нужное. Трюм под
   это расширен модулем — иначе материал просто не влезет. */
function hdLay(s, id) {
  G.mods.hold = 3; G.modsOwned.hold = 3;
  const cost = BLD[id].cost;
  for (const k in cost) if (k !== "credits") G.cargo[k] = (G.cargo[k] | 0) + cost[k];
  return bldLay(s, id);
}
/* отмотать запись цеха назад на n смен: то же, что вернуться через n*20 минут */
function hdAgeShifts(key, id, n) {
  const B = bldEntry(key, id);
  if (!B) return false;
  /* ── и монтаж, и отсчёт смен ──
     `bldTick` берёт `t0=max(B.t0,B.ready)`: сдвинуть одну отметку мало —
     конец монтажа окажется позже начала отсчёта, и смен не будет НИ ОДНОЙ.
     Первый заход этой проверки так и получил ложную зелень: «из пустого
     бункера ничего не вышло» было верно лишь потому, что не прошло ни смены. */
  B.t0 = Date.now() - n * HOLD_SHIFT;
  B.ready = Math.min(B.ready || 0, B.t0 - 1000);
  return true;
}

TEST_SUITES.push(() => suite("холдинг: площадка открывается по ступени, а цех — за деньги", () => {
  const s = hdSite();
  ok(!!s, "система со станцией и площадкой найдена");
  if (!s) return;
  const r = rungOf(s.sx, s.sy);
  ok(r >= 11, "ступень доросла до площадки: " + r);
  ok(bldSitesAt(s.sx, s.sy) >= 1, "площадок на системе: " + bldSitesAt(s.sx, s.sy));
  /* берём первый цех первого яруса, который здесь разрешён */
  const id = Object.keys(BLD).find(k => !bldWhy(s, BLD[k]));
  ok(!!id, "есть что заложить: " + (id || bldWhy(s, BLD[Object.keys(BLD)[0]])));
  if (!id) return;
  const cost = BLD[id].cost, cr0 = G.credits;
  const why = hdLay(s, id);
  eq(why, "", "закладка прошла без отказа");
  ok(!!bldEntry(s.key, id), "цех «" + BLD[id].ru + "» стоит на площадке");
  ok(G.credits < cr0, "за стройку заплачено: " + (cr0 - G.credits) + " кр");
  /* второй раз тот же цех не ставится, и без денег тоже */
  ok(hdLay(s, id) !== "", "второй раз тот же цех не закладывается");
  resetWorld();
}));

TEST_SUITES.push(() => suite("холдинг: цех не делает товар из пустого бункера", () => {
  const s = hdSite();
  if (!s) { ok(true, "нет системы под проверку"); return; }
  /* нужен цех, который ЕСТ: семья A копает сама, её здесь не судим */
  const id = Object.keys(BLD).find(k => !bldWhy(s, BLD[k]) && BLD[k].fam !== "A" &&
    Object.keys(BLD[k].eats || {}).length && Object.keys(BLD[k].makes || {}).length);
  if (!id) { ok(true, "перерабатывающего цеха на этой ступени нет — проверять нечего"); resetWorld(); return; }
  eq(hdLay(s, id), "", "цех «" + BLD[id].ru + "» заложен");
  const B = bldEntry(s.key, id);
  ok(!!B, "запись цеха есть");
  /* монтаж прошёл, бункер пуст, прошло двадцать смен */
  hdAgeShifts(s.key, id, 20);
  bldTick(s.key, id);
  const made = Object.keys(B.got || {}).reduce((a, k) => a + B.got[k], 0);
  eq(Math.round(made), 0, "из пустого бункера за двадцать смен не вышло ничего");
  /* кладём ровно норму одной смены — выходит не больше нормы выпуска */
  const Q = bldQuota(BLD[id], B.lvl), O = bldOut(BLD[id], B.lvl);
  const k0 = Object.keys(Q)[0];
  B.my[k0] = Q[k0];
  hdAgeShifts(s.key, id, 5);
  bldTick(s.key, id);
  const out = Object.keys(O).reduce((a, k) => a + (B.got[k] || 0), 0);
  const outMax = Object.keys(O).reduce((a, k) => a + O[k], 0);
  ok(out > 0, "с полной нормой смена дала выпуск: " + out.toFixed(2));
  ok(out <= outMax + 1e-6, "и не больше одной нормы выпуска: " + out.toFixed(2) + " при " + outMax);
  eq(B.my[k0] | 0, 0, "сырьё из бункера съедено ровно один раз");
  resetWorld();
}));

TEST_SUITES.push(() => suite("холдинг: пай не переполняет бункер и не теряется по дороге в трюм", () => {
  const s = hdSite();
  if (!s) { ok(true, "нет системы под проверку"); return; }
  const id = Object.keys(BLD).find(k => !bldWhy(s, BLD[k]) && Object.keys(BLD[k].makes || {}).length);
  if (!id) { ok(true, "накопительного цеха на этой ступени нет"); resetWorld(); return; }
  eq(hdLay(s, id), "", "цех заложен");
  const B = bldEntry(s.key, id), def = BLD[id];
  const O = bldOut(def, B.lvl), cap = HOLD_CAP_SHIFTS * holdCapMul(s.key);
  /* сто смен подряд: потолок обязан держать */
  if (def.fam !== "A") { const Q = bldQuota(def, B.lvl); for (const k in Q) B.my[k] = Q[k] * 200; }
  hdAgeShifts(s.key, id, 100);
  bldTick(s.key, id);
  const over = [];
  for (const k in O) if ((B.got[k] || 0) > O[k] * cap + 1e-6) over.push(k + ": " + B.got[k].toFixed(2) + " при потолке " + (O[k] * cap));
  eq(over.join(", "), "", "запас цеха стоит под потолком (" + cap + " смены)");
  /* забрать в трюм: сколько ушло из запаса, столько и пришло в трюм */
  if (def.fam === "A") { ok(true, "добыча не дарит пай — она продаёт (bldBuySrc)"); resetWorld(); return; }
  const got0 = Object.keys(B.got).reduce((a, k) => a + Math.floor(B.got[k]), 0);
  const held0 = held();
  const took = bldCollect(s, id);
  const held1 = held();
  ok(took > 0, "пай забран: " + took);
  eq(held1 - held0, took, "в трюм пришло ровно столько, сколько взято");
  const left = Object.keys(B.got).reduce((a, k) => a + Math.floor(B.got[k]), 0);
  eq(got0 - left, took, "и из запаса ушло ровно столько же");
  /* полный трюм: пай остаётся в цехе, а не растворяется */
  const st = stat();
  for (const k in B.got) B.got[k] = 5;
  const before = Object.keys(B.got).reduce((a, k) => a + Math.floor(B.got[k]), 0);
  G.cargo.iron = (G.cargo.iron | 0) + Math.max(0, st.cargoMax - held());
  const took2 = bldCollect(s, id);
  const after = Object.keys(B.got).reduce((a, k) => a + Math.floor(B.got[k]), 0);
  eq(took2, 0, "в полный трюм не влезло ничего");
  eq(after, before, "и запас цеха остался нетронутым");
  resetWorld();
}));
