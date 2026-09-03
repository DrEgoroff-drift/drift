/* ══════════════ вещи на своих местах (M330) ══════════════
   Автор (04.09.2026): «интересуют элементы не на своих местах». Это самый
   заметный класс дефекта и при этом самый неуловимый для тестов: куст, висящий
   в воздухе на пол-экрана выше грунта, валун, сквозь который стоит корабль,
   зверь, ушедший под землю, — всё это не роняет ничего и не пишет ни строки в
   консоль. Игрок видит это первым, а прогон не видит вовсе.

   Ловится это только числами, и числа есть: у поверхности один рельеф
   (`groundAt`), у пещеры — поле камня (`caveBoxFree`), у площадки — своя
   отметка. Правило то же, что у сквозного набора про картинку: увидел на
   кадре кривое — заводи здесь проверку, чтобы второй раз не ловить глазами. */

/* планеты разных типов, на которые можно сесть: одна планета ничего не
   доказывает, а полсотни стоят дороже целого прогона */
function plWorlds(n) {
  const out = [];
  for (let r = 0; r < 12 && out.length < n; r++)
    for (let x = -r; x <= r && out.length < n; x++)
      for (let y = -r; y <= r && out.length < n; y++) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
        if (!starAt(x, y)) continue;
        const s = getSystem(x, y);
        for (const p of s.planets || []) if (p.type !== "gas") { out.push({ s, p }); break; }
      }
  return out;
}
/* посадка на выбранную планету без полёта: то же, что делает lookScenes */
function plLand(s, p) {
  G.sx = s.sx; G.sy = s.sy; G.sys = s; G.ap = null; G.orbit = null;
  const tr = genTerrain(p);
  G.land = { p, tr, x: tr.padX, y: groundAt(tr, tr.padX) };
  enterSurface();
  return G.surf;
}

/* ── 1. всё стоит на грунте ── */
TEST_SUITES.push(() => suite("места: залежи, растения и зверьё стоят на грунте, а не над ним", () => {
  const bad = [];
  let checked = 0, worlds = 0;
  for (const { s, p } of plWorlds(10)) {
    resetWorld();
    const S = plLand(s, p);
    const tr = S.tr;
    worlds++;
    const off = (o, want, ru) => {
      const g = groundAt(tr, o.x);
      if (o.x < 0 || o.x > tr.W) bad.push(p.name + " · " + ru + " за краем полосы: x=" + Math.round(o.x));
      else if (Math.abs(o.y - (g - want)) > 8)
        bad.push(p.name + " · " + ru + " висит на " + Math.round(g - o.y) + " px над грунтом");
      checked++;
    };
    for (const d of S.deposits) off(d, 6, "залежь");
    for (const pl of S.plants) off(pl, 0, "растение");
    for (const b of S.fauna) off(b, 0, "зверь");
  }
  resetWorld();
  ok(worlds >= 8, "миров проверено: " + worlds);
  ok(checked > 300, "вещей на грунте: " + checked);
  eq(bad.slice(0, 4).join(" ;; "), "", "ничего не висит и ничего не утонуло");
}));

/* ── 2. зверь остаётся на грунте, когда идёт ──
   Он единственный, кто по поверхности двигается сам. Стоит забыть строку
   `b.y=groundAt(...)` рядом с `b.x+=b.vx` — и стадо поедет по воздуху ровно
   по той высоте, где родилось. */
TEST_SUITES.push(() => suite("места: зверьё не уходит в воздух и не тонет на ходу", () => {
  const bad = [];
  let steps0 = 0;
  for (const { s, p } of plWorlds(4)) {
    resetWorld();
    const S = plLand(s, p);
    if (!S.fauna.length) continue;
    for (let i = 0; i < 400; i++) { updateSurface(1); G.t += 1; steps0++; }
    for (const b of S.fauna) {
      const g = groundAt(S.tr, b.x);
      if (Math.abs(b.y - g) > 2) bad.push(p.name + " · зверь на " + Math.round(g - b.y) + " px от грунта");
      if (b.x < 30 || b.x > S.tr.W - 30) bad.push(p.name + " · зверь ушёл за край: " + Math.round(b.x));
    }
  }
  resetWorld();
  ok(steps0 > 400, "кадров прогулки: " + steps0);
  eq(bad.slice(0, 3).join(" ;; "), "", "стадо держится грунта");
}));

/* ── 3. ходок не тонет и не висит ──
   Прыжок, склон, уступ, посадка на бегу — на каждом кадре, где он на опоре,
   ноги обязаны быть на грунте. Проваливание под рельеф — классика: шаг по
   быстрому склону перескакивает проверку, и человек уходит в породу. */
/* точка опоры человека на поверхности стоит НЕ на самой отметке рельефа:
   `enterSurface` сажает его на `groundAt−10`, и отрисовка поднимает ещё на 1
   (21e: `translate(x,y−1)`), потому что начало координат силуэта — таз, а не
   ботинки. Число одно на весь режим, и проверка должна знать именно его. */
const PLACE_LIFT = 10;
TEST_SUITES.push(() => suite("места: человек на поверхности не проваливается в грунт", () => {
  const bad = [];
  let frames = 0, deep = 0;
  for (const { s, p } of plWorlds(4)) {
    resetWorld();
    const S = plLand(s, p);
    const r = rng(hashi(0x9A1C, p.seed, 5));
    for (let i = 0; i < 500; i++) {
      if (i % 3 === 0) { keys.left = r() < .35; keys.right = r() < .35; keys.thrust = r() < .25; }
      updateSurface(1); G.t += 1; frames++;
      const g = groundAt(S.tr, S.x) - PLACE_LIFT;
      /* под грунтом человеку места нет вовсе: даже кадр «внутри» читается
         как провал сквозь пол, потому что рисуется он всегда над рельефом.
         Плавание — исключение: в озере он держится воды, а не дна */
      if (S.swim > .5) continue;
      if (S.y > g + 3) { deep++; if (bad.length < 3) bad.push(p.name + " · кадр " + i + ": ушёл на " + Math.round(S.y - g) + " px под грунт"); }
      if (S.on && Math.abs(S.y - g) > 6 && bad.length < 3) bad.push(p.name + " · кадр " + i + ": «на опоре» в " + Math.round(g - S.y) + " px от грунта");
    }
    for (const k in keys) keys[k] = false;
  }
  resetWorld();
  ok(frames > 1500, "кадров ходьбы: " + frames);
  eq(deep, 0, "ни одного кадра под грунтом");
  eq(bad.slice(0, 3).join(" ;; "), "", "ходок держится поверхности");
}));

/* ── 4. в пещере человек не в камне ──
   У пещеры есть настоящее поле твёрдости, и у тела — ящик 8×21. Значит,
   вопрос «не застрял ли он в породе» имеет точный ответ на каждом кадре. */
TEST_SUITES.push(() => suite("места: в пещере человек ни разу не оказался внутри камня", () => {
  const bad = [];
  let frames = 0, inside = 0, caves = 0;
  for (const { s, p } of plWorlds(4)) {
    resetWorld();
    plLand(s, p);
    enterCave();
    const C = G.cave;
    if (!C) continue;
    caves++;
    const r = rng(hashi(0xCA5E, p.seed, 3));
    for (let i = 0; i < 500; i++) {
      if (i % 3 === 0) { keys.left = r() < .4; keys.right = r() < .4; keys.thrust = r() < .3; }
      updateCave(1); G.t += 1; frames++;
      if (!caveBoxFree(C, C.x, C.y)) {
        inside++;
        if (bad.length < 3) bad.push(p.name + " · кадр " + i + ": тело в камне на " + Math.round(C.x) + "," + Math.round(C.y));
      }
    }
    for (const k in keys) keys[k] = false;
  }
  resetWorld();
  ok(caves >= 3, "пещер пройдено: " + caves);
  ok(frames > 1200, "кадров под землёй: " + frames);
  eq(inside, 0, "ни одного кадра внутри породы");
  eq(bad.slice(0, 3).join(" ;; "), "", "пещера держит тело в пустоте");
}));

/* ── 5. площадка ровная, и на ней ничего не лежит ──
   Корабль садится на отметку `padY`, а рисуется на грунте: если под ним
   уклон — он висит углом. Рельеф площадку выравнивает (07-planet), а вот
   валуны раскиданы по всей полосе без единой проверки — и валун радиусом
   двадцать, легший на пятачок, это ровно то, что автор видит как «корабль
   стоит в камне». */
TEST_SUITES.push(() => suite("места: посадочная площадка ровная и не занята валуном", () => {
  const tilt = [], rocky = [];
  let worlds = 0;
  for (const { s, p } of plWorlds(24)) {
    const tr = genTerrain(p);
    worlds++;
    /* ровность: ±50 px от отметки площадки — тот кусок, на котором стоит корпус */
    let dh = 0;
    for (let dx = -50; dx <= 50; dx += 10) dh = Math.max(dh, Math.abs(groundAt(tr, tr.padX + dx) - tr.padY));
    if (dh > 4) tilt.push(p.name + ": " + dh.toFixed(1) + " px");
    /* и на пятачке не должно лежать камня: корпус шире, чем кажется */
    for (const rk of tr.rocks) if (rk.rad > 6 && Math.abs(rk.x - tr.padX) < 46)
      rocky.push(p.name + ": валун r=" + rk.rad.toFixed(0) + " в " + Math.round(rk.x - tr.padX) + " px от площадки");
  }
  ok(worlds >= 20, "площадок проверено: " + worlds);
  eq(tilt.slice(0, 3).join(" ;; "), "", "площадка выровнена под корпус");
  eq(rocky.slice(0, 3).join(" ;; "), "", "на площадке не лежит валун");
}));

/* ── 6. вход в пещеру достижим ──
   Дважды в истории проекта пещера оказывалась недоступной: то устье падало на
   пятачок посадки, где подсказка принадлежит кораблю, то на устье лежала
   залежь и перехватывала ДЕЙСТВИЕ. Оба раза это читалось как «пещер в игре
   нет». Отступы записаны в коде — значит, их можно спросить. */
TEST_SUITES.push(() => suite("места: устье пещеры не на площадке и вокруг него чисто", () => {
  const bad = [];
  let worlds = 0;
  for (const { s, p } of plWorlds(10)) {
    resetWorld();
    const S = plLand(s, p);
    const cm = S.cave;
    if (!cm) { bad.push(p.name + ": входа в пещеру нет вовсе"); continue; }
    worlds++;
    const keep = Math.max(300, (typeof shipZoneR === "function" ? shipZoneR() : 90) * 3);
    if (Math.abs(cm.x - S.tr.padX) < keep - 1)
      bad.push(p.name + ": устье в " + Math.round(Math.abs(cm.x - S.tr.padX)) + " px от площадки (нужно " + Math.round(keep) + ")");
    if (cm.x < 100 || cm.x > S.tr.W - 100) bad.push(p.name + ": устье у самого края полосы");
    const near = (arr, rad, ru) => { for (const o of arr) if (Math.abs(o.x - cm.x) < rad) bad.push(p.name + ": " + ru + " в " + Math.round(Math.abs(o.x - cm.x)) + " px от устья"); };
    near(S.deposits, 70, "залежь"); near(S.plants, 50, "растение"); near(S.fauna, 60, "зверь");
  }
  resetWorld();
  ok(worlds >= 8, "входов проверено: " + worlds);
  eq(bad.slice(0, 4).join(" ;; "), "", "к пещере можно подойти и её видно");
}));

/* ── 7. человек одного роста, и ящик столкновений по нему ──
   Закон проекта: рост один во всех режимах. У пещеры этот рост записан
   числом — ящик 8×21 (`caveBoxFree`). Силуэт рисуется отдельно и о ящике не
   знает: разъедься они, и человек будет входить головой в камень или висеть
   в воздухе ботинками. Меряем нарисованное. */
TEST_SUITES.push(() => suite("места: силуэт человека совпадает с ящиком столкновений", () => {
  const keepCtx = ctx;
  const off = document.createElement("canvas"); off.width = 80; off.height = 80;
  let box = null;
  try {
    ctx = off.getContext("2d");
    ctx.clearRect(0, 0, 80, 80);
    ctx.save(); ctx.translate(40, 60);
    drawAstronaut({ face: 1, walk: 0, amp: 0, phase: 0, air: false });
    ctx.restore();
    const d = ctx.getImageData(0, 0, 80, 80).data;
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
    for (let y = 0; y < 80; y++)for (let x = 0; x < 80; x++) {
      if (d[(y * 80 + x) * 4 + 3] < 40) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    box = { w: x1 - x0 + 1, h: y1 - y0 + 1, foot: y1 - 60 };
  } finally { ctx = keepCtx; }
  ok(!!box && box.h > 0, "силуэт нарисовался");
  if (!box || box.h <= 0) return;
  /* ящик пещеры: 8 в ширину (±4), 21 в высоту над точкой опоры */
  ok(Math.abs(box.h - 21) <= 6, "рост силуэта совпадает с ящиком 21: " + box.h);
  ok(Math.abs(box.w - 8) <= 8, "ширина силуэта совпадает с ящиком 8: " + box.w);
  ok(box.h > box.w, "человек выше, чем шире: " + box.h + "×" + box.w);
  /* ── ботинки против точки опоры ──
     Начало координат силуэта — таз, а не подошва: ноги уходят вниз на десяток
     пикселей. Ровно на столько его и поднимают ОБА режима, каждый по-своему:
     поверхность сажает тело на `грунт−10` и рисует ещё на −1 (21e), пещера
     считает `C.y−11` прямо в кадре (22). Разъедься рисунок и этот подъём — и
     человек уйдёт ботинками в пол или повиснет над ним; в пещере, где пол
     каменный и настоящий, это читается сразу. */
  ok(Math.abs(box.foot - 11) <= 3, "ботинки приходятся на точку опоры (подъём 11): низ силуэта " + box.foot + " px");
  ok(box.h - box.foot >= 8, "над точкой опоры остаётся тело, а не одни ноги: " + (box.h - box.foot) + " px");
}));
