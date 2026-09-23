<!-- docs/done/done-21.md — part 21 of 30 of the done work, in the order it was written; see README.md -->

## Moved from PLAN.md on 2026-09-12 (release 0.447.0) — the review block R2–R5a

- **Review block of 12.09 — before the push** (Контроль's order; each item: red test first, then the
  fix, a WIP commit, dev, one line to both reviewers). Sources: the tester's `review.json` and
  `botverify.json` (scratchpad 3d6318e9…), the designer's letters. Scale stays as built until the
  author says otherwise (the reviewers disagree; a peer cannot decide for the author).
  - **Next:** R5. 0.446.0 is live (7ca9ce1, md5 checked); after it the hail waits under the SOS
    window too (`sosopen` in `worldCovered`, test «оклик под окном бака»).
  - [x] **R0 picket «Коммуна»** and [x] **R1 cue and ДЕЙСТВИЕ** — shipped in 0.446.0; bodies in
    `docs/PLAN-archive.md` (2026-09-12).
  - [x] **R2 empty tank**: no nose turn on fuel 0 (`helmApply`), a turn asks for the window too (and
    A/D/←/→ by key), `body.tankdry` dims thrust and turn pads, the stick dims to .35 and says «БАК
    ПУСТ» (live and at rest); test «R2 пустой бак» (phone).
  - [x] **R3 the rescue window** — **R3a logic done** (the window and `rescueTake` refuse on the rope, a
    tap on the rope sets no autopilot and the tow end clears `G.ap`, a wreck drops the rope, СБРОС takes
    only the lost hull's parts and is not offered on a bare «Стриж», an own-power dock in a foreign
    system cools the jumps once per system (`rescueDockCool`, `G.homeDockAt` saved), surface 1–7 is a
    jump «без хода» and the head says the real fuel, Space no longer opens the window, docking closes
    it; four «R3 …» tests). **R3b the look done**: the window in the lower third over the pads (the hail
    moves up while it is open), × 44, Escape and a tap outside close it, sub-lines 11 px ≥4.5:1, the
    head says «до станции «X» · N ед.» and a pursuit first, icons per exit, «в баке будет» is what
    `rescueTake` gives, the armed СБРОС is red with a 4 s bar and comes back, the window re-renders
    itself while open (`rescueSync`), the pad reads ВЫХОДЫ, the menu shows the jump price; under the
    window the ether strip, МАСШТАБ and the stick label step back. **R3c done**: what the station says
    on docking and the «СБОЙ» toast are screen voice and show over any screen (`openStation` runs
    with FRAME_IN off, `crashSay` clears MSG_WORLD). Was: tester 1 (window/БУКСИР/ДОМОЙ/СБРОС during a haul), 2 (a wreck on the
    rope loops), 3 (СБРОС clears every fit, keeps the lost parts), 6 (dock greetings burn behind the
    screen; the crash toast hides), 7 (stale window, Space at the dock), 9 (× 44 px, tap outside,
    Escape), 10 («в баке будет» = max), 12 (the armed СБРОС label returns), 13 (СБРОС on a bare
    «Стриж» is free), 16 (a chip tap on the rope sets G.ap); HOME_DOCK_COOL applied; surface fuel 1–7
    is not «ноль» and not a taxi jump. Designer: the window in the lower third, pursuit in its head,
    the armed СБРОС red with a 4 s bar, sub-lines 11 px ≥4.5:1, head «до станции <name> · <dist>»,
    icons per exit, БУКСИР is the main button, the menu shows its price; on an empty tank the ДЕЙСТВИЕ
    pad reads «ВЫХОДЫ» and the prompt drops «ДЕЙСТВИЕ — БУКСИР ИЛИ СБРОС» (designer 12.09).
  - [x] **R4 the haul scene** — done: the tow state runs on its own seeded stream (`haulR`, M441: with
    frames or without, one world), the barge comes from behind and overtakes beside the ship nose
    first, the dry ship keeps its nose until the rope turns it (`_off` eases), crew lines and debris
    quips are dealt as decks, the zoom eases to the floor, the look-ahead camera eases (`HAUL_CAM`),
    the end is a 3.5 s unhook (`ph:"free"`, the barge burns away, the rope drops from the boom), the
    rope runs from a stern boom over the flames; four «R4 …» tests. Was: the rope from a stern boom to the ship's nose, drawn after the flames;
    the barge comes from behind and overtakes; the end at the station by `S.ang`, a 3–4 s unhook and
    departure; camera eased; lines and debris as a deck; `rndFx` out of haul state (M441).
  - [ ] **R5 bots** — **R5a done**: the probe asks a second tap and the ЦЕЛЬ pad names the price
    («ЗОНД 300 КР» → «ТОЧНО? 300 КР», `G._probeArm` three game seconds); the surface sign is last in
    the chain, by hold, where nothing else takes ДЕЙСТВИЕ (steps from the ship); a jump arrives at
    rest; `wreck(why)` names the cause in the log and the corona says «Корпус горит» once per entry;
    the empty-tank window closes by itself once the tank is not empty («Ход есть»), a wreck closes it;
    the head counts a foreign station in jumps; `rescuePark` puts the ship by the station at its
    angle (tow, ДОМОЙ, СБРОС were 2000+ away); the tow countdown never repeats a number; the boom is a
    beam. **R5b waits for the author** — Контроль's first-hour numbers (repair two buttons and ≤ half
    the cash, a first-hour landing −20 % without a wreck, the galaxy goal frozen until the first done,
    board cargo ≥ 15 real minutes with a timer in ДЕЛО, a wreck hull min(45 %, before) with repair on
    debt, the first probe free) are design calls, not bugs. Was: B1 `_probeAt` reset every frame, price on the pad, second tap; B3 the surface sign
    only last in the chain and by hold; B4 no jump arrival into the corona, `wreck(reason)` logged;
    B5 wreck hull = min(45 %, before). First hour (Контроль): the first probe free, repair two
    buttons and ≤ half the cash, a hard landing −20 % not a wreck, the first goal frozen, board cargo
    ≥ 15 min with a timer in ДЕЛО.
  - [ ] **R6 design tails**: pads name the action always (ЦЕЛЬ → ЗАХВАТ / ЗОНД · 300 КР / ПО ДЕЛУ,
    ДЕЙСТВИЕ → ВЫХОДЫ …), prompts ≤ 2 lines and no keys on touch, compass chips only for off-screen
    things and never under windows or the prompt, МАСШТАБ to the HUD top; ОПИСЬ sub-tabs (КОРАБЛЬ ·
    СНЯТОЕ · КОМПЛЕКТ · ТРЮМ), slots before ПРИБОРЫ, the empty slot says where to buy, СНЯТЬ in one
    place; ДЕЛО the manager's share in the column, the drones as a table; ЛЕНТЫ no gap, no «T» on
    touch; СПЛАВ «В ПЛАВКУ»; a maxed module on one line; the got card: «/с», red minuses, lower third.
    Designer 12.09: a pad label is ≤2 words + a number («ЗОНД · 300», not «ЗОНД ЗА 300 КР»); a
    moon/planet name yields to the player's ship (moves to the far side of the disc); «КОМПАНИЯ» by
    the ship never crosses a planet chip.
    Bots on the 0.446.0 copy (tester P2–P5) and the designer's calls 31–35: the ether names the
    speaker once, in the line prefix, one case («Коммуна: …», capitals only in titles); agreement
    in the story lines («Женщина в платке рассказывал», «кто везёт органика»); a cargo paper in
    ВЕЩИ shows the DESTINATION sector, and every board card reads «куда · сколько · до когда · за
    сколько» (deadline numbers — Контроль); the СТОЛ button is fixed wide for «99+» with the badge
    over its corner, not in the flow (with the two fixed station-header lines); while the hail
    window is open, one undimmed edge arrow names the hailing ship. The hail window over КАРТА/
    МЕНЮ stays (decided).
    Designer: the prompt «ДЕЙСТВИЕ — ВЫХОДЫ» repeats the pad — but the pad takes its verb from the
    prompt (interface rule); dropping the line needs the pad to read the verb elsewhere (decide).
    Designer: the barge's light seam along the hull/module border reads as a crack — a soft band
    (~15 % of the hull width), no line at the seam (it is in the barge art, not the rim mask); the
    planet pass of the haul could zoom toward 1.6 so the disc is ≥ .3·H, back 10 s before the station.
  - **dev.html must not write into the live world (Контроль, 12.09).** The tester's bots played
    dev.html against the live `/api.php` and left test signs (a=trace, Нейэль III, 0:0, ~00:08 and
    00:25 MSK 12.09). Either a `test` flag the api drops, or dev/bots on a local copy. Removing
    the signs from the live pool is the author's call, done by the author (no deletion from here).
  - Later (after the release): deposits refill on landing, the rebind button sticks on a phone, «ТРЮМ
    ПУСТ» with rare cargo, the pronoun in 12aa-need, the station header two fixed lines.


## PLAYABLE ON A PHONE — the playtest of 2026-09-11, bodies of items 0–6 and the review block (moved from PLAN.md 2026-09-12, 0.448.0)

## PLAYABLE ON A PHONE — the author's playtest of 2026-09-11 (first, before everything below)

**Oversight:** session «Контроль и критика соседней беседы» (local_a2ba9fa0) reviews code, «Анализ сессии и
рекомендации дизайна» (local_f3f054cd) reviews frames; a one-line report to them after each item. **Rules:**
answer every author message in text before code; nothing to main without dev and the author's «да»;
commits on branch `playable-11-09`, release as one commit with drift.html/INDEX/TESTMAP and md5 check.

The author could not play fifteen minutes on a phone with 800 suites green. Everything else
(galaxy M447–M451, the test queue, the refactor) waits. **Policy (author, 11.09):** fix without
tests, local commits, look with eyes on `dev.html` at 390×844; the whole test run only right
before a push.

- [ ] **0. Empty tank** — thrust opens a window: ДОМОЙ (10·2ⁿ by jumps; cools only with active
  play −1/45 min, taxi +2, tow −0.5), БУКСИР (a real barge, 5 min, free), СБРОС (→ «Стриж»).
  ДОМОЙ in the menu anywhere; the station beacon goes the same path. `16c-rescue`, branch
  `playable-11-09`. Review 11.09: `G.tow` was M369b's towed hull → the rescue is `G.haul` [done];
  the haul is saved [done]; СБРОС needs a second tap [done]; pirates off during the haul [done];
  reset takes only fitted levels (`mods`), not bought (`modsOwned`) [done]; the world does NOT
  freeze during the haul (measured: planets, station, barges move) [checked]. Left: the author's «да»
  on dev, then tests + main as 0.446.0.
- [x] **1. Station header half a screen** — one line + an «ЕЩЁ» chip; the clipped ether line was the
  receiver (#console) pushed off the left edge — a later `body.screen #console` rule beat the phone
  one; the phone rule is repeated after it. Open: the «Полёт восстановлен» toast over the counter;
  design review 13–15 (СТОЛ button out of the masthead, two tab rows = 110 px, prices before the
  cooperative form; Director news belong on ДОСКА, not under «ЕЩЁ»).
- **Haul scene** (author: «говно, не большой, нет огня») — done: barge ×3 ship, engines + retro/turn
  puffs, sagging swinging rope, bits breaking off, crew talk, camera lead, ship floor .7 on the rope,
  warm star rim on the hull, nozzle glow. Design review open: plan the route past visible bodies
  (a planet at 1.3 r, the belt, the station growing in the last minute); shuttles passing, a pirate
  that turns away from a ГЛАВТРАССА barge; a route bar instead of a countdown; the target chip = the
  destination station. Window: icons per exit (home glyph, barge thumb, «Стриж» thumb), big price
  right; the header should say the distance to the station, not repeat the HUD.
- [ ] **2. Scale** — far zoom: ship ×2 (floor .35 → .7); near: the ship stops growing (~.8) and the
  zoom goes to ×4, so a planet is 5–6 ships wide. Proposed to the author with numbers; a before/after
  frame at ×0.16 and ×2.4 before code. Seamless atmosphere entry — a milestone after the pass.
  **Built 12.09 (the decided form):** `shipScaleAt` = clamp(Z, .7, 1.6) everywhere (hull, exhaust and
  trail share it — `shipZ` had its own .55); bodies at Z>1 drawn ×(1+0.8·(Z−1)) (`bodyScaleAt`, 16c);
  the haul clamps zoom to [.7, 1.6] (the world rope outgrew the sprites above 1.6). **Price found on the
  frames:** a moon on a near orbit (r 39, orbit 76) fell onto its planet's drawn disc (83 at ×2.4) — so a
  planet grows at most 0.6 of the gap to its nearest moon, a moon 0.15 (`bodyNearCaps`); planets with a
  close moon grow only ~×1.35. Also, the drawn disc outgrows the physical one: at ×2.4 the landing and
  scoop zones (110 from the physical surface) sit on or inside a big body's disc. For the author: keep,
  or the alternative with no drawn/physical split — world zoom to ×4–5 with the ship capped (~.8).
- [ ] **2a. Seamless atmosphere entry** (milestone, after item 2 is accepted): flying into a drawn disc
  becomes the descent instead of a prompt; design first.
- [ ] **3. Buttons that do not press; screens that jump** — СТОЛ, ДЕЛО, ОПИСЬ (play at 390×844). Found:
  the СТОЛ header jumped 70↔85 px (long tab subtitles wrapped) → one line [done]. Needs a late world:
  the author's cloud save (asked, no «да» yet — do not touch without it) or a `veteranWorld()` fixture
  from `e2eLate()` (1.5 M, a big hull with modules, 10 drones, crew, home tier 3–4, desk full);
  **The author's save is taken (his «да», 11.09):** `C:\Claude\drift-private\author-save.json`, outside
  git — never copy it into the repo. `python docs/vetshot.py OUT.png "<js>" "<eval>"` shoots the game
  on it at 500×1080. Found on it: the flight toast «ГРАВИТАЦИОННЫЙ ЯКОРЬ» covered the bottom row of
  every open screen (he sits past the system edge) [fixed: not over open screens]; ОПИСЬ top was a
  sideways carousel (shelf 78% + box 40%), КОСМЕТИКА cut at the right edge [fixed: stacked]. Open:
  the slot «+» markers on the hull silhouette are ~12 px — the likely «модули не понятно как выбрать»;
  «долгое нажатие — поднять» is a hidden gesture; the «полоски внизу» are probably #opisBar (the
  hatch strip on lift) — verify by tapping; ДЕЛО reads fine on his world. Offline drones paid him
  +7 000 кр on load — item 6.
  ОПИСЬ: the bottom strips become tabs with words.
- **Item 3 pass of 12.09 (commits bc030a6..a595e24):** one prompt slot `cue(text,lvl)` in `08-state`
  (INFO < WARN < ACT < TROUBLE; flight writers converted; the empty tank is heard past the edge anchor
  and beside a planet); phone cascade walked (the ≤420 block was dead, one phone `#console` rule, an idle
  receiver hidden over screens by visibility); ДЕЛО adds up (one unit, `crewPayNow`, managers live on the
  cut; «−13» = thirteen `pool:-1` bottomless marks summed); СТОЛ sheet title = the sheet, ЛЕНТЫ torn on
  the sheet (a phone had no way); ОПИСЬ phone: ship first, folds, hull caption, groups with units; haul
  light 1.97 → 2.21 on the barge mask (`expo2.js` pattern: mask the barge art, split by star side).
  Still open from the list below: the haul scene (planet dominance, shuttles, pirate, route bar) and the
  СТОЛ empty sheets beyond ЛЕНТЫ.
- **Open from the reviews of 11.09 (do in item 3 unless noted):**
  - One prompt slot: `G.prompt` is written in 25 files and the first writer wins — that is how the
    tow got lost. A `prompt(text, level)` with levels «trouble > action nearby > info».
  - Toasts: DONE as a rule — a frame-born `say()` waits while a screen is open (≤20 s, then it burns);
    a tap-born one shows at once. Left: `say()` from timers/network callbacks (cloud push, setInterval
    ether) is neither — mark those as world explicitly (a `sayWorld`) or set FRAME_IN there.
  - (was) Toasts over reading screens: one rule for all `.scr` — hold `say()` from flight until the screen
    closes (the anchor warning is already off open screens; «Полёт восстановлен» over the counter).
  - CSS cascade: 18 `@media ≤760` blocks; a later rule already beat a phone one (#console). Walk
    them all; phone media go to the end of the file. #console still clips over ДЕЛО.
  - ОПИСЬ: empty/locked blocks (six empty «Сорока» slots, locked cosmetics) fold to one line each and
    go UNDER the ship; hull slot «+» markers ~12 px → a 44 px tap zone (nearest centre wins, like
    compass chips), a label on tap, a colour legend under the ship; «+» only on a free slot; the
    hidden long-press gets explicit buttons (ПОДНЯТЬ / НАДЕТЬ / В ЯЩИК); #opisBar says «ЛЮК · ЗА
    БОРТ»; ПРИБОРЫ: no zero rows, units, groups of 4–5.
  - ДЕЛО: «−13 left at the point» is an accounting bug (display clamped only); rows need a chevron or
    a button (ОТОЗВАТЬ / ДОПЛАТИТЬ / К ТОЧКЕ); «+2 051 итог» and «−83 кр/мин» are different units in
    one column; the header «людям платите 156 кр/мин» does not add up with the rows.
  - СТОЛ: the sheet title should be where you are (ПРИЁМНИКИ), «← СТОЛ» only on the back button;
    empty sheets say where to get the thing; the last row of desk objects needs bottom padding.
  - Haul light (designer's numbers): now flame core 151 px ≥250/240/215, sun side median 94 / p90
    164, shade median 54 — sun/shade 1.74, target ≥2 (plates 150–200, hull 100–140, shade 50–70);
    measure with the expo script pattern (canvas getImageData around the barge, split by star side).
  - Haul: the planet pass must let the planet dominate (disc ≥ .35 H, planet in the leading half,
    barge not over it); shuttles passing; a pirate turning away from a ГЛАВТРАССА barge; a route bar.
  - Economy (item 6): crew (`12a-crew` crewTick, cap 24 h) and managers (`12c-mgr-core` mgrTick, 240
    min) earn OFFLINE — the author: pilots and mercs only online; drones 9000·1.6ⁿ.
  - Privacy: to find the author's save I scanned `credits` in every cloud save — next time ask the
    account name and take one file. The save sits outside git; never commit it.
- [ ] **4. Modules** — «прогрев» is КОРАБЛЬ → ОСНАСТКА (`26b-ui-station-work` stTabMods; maybe СПЛАВ).
  Proposed: an upgrade card (ship thumb with the slot lit, dots big, «now → becomes» from stat(), the
  fitting budget bar, ONE button «УЛУЧШИТЬ ДО УР. N · X КР», a second of dock work, «УСТАНОВЛЕНО»).
  Asked the author; code after his «да».
  **Built 12.09 (95d5177):** `modCard` in 26b — dots, now → becomes in the ПРИБОРЫ rows, the fitting
  line, one verb button, «МОНТАЖ… → УСТАНОВЛЕНО» (view only, state changes on the tap); СПЛАВ on the same
  card with `fusePreview` (one formula for the card and `fuseShips`).
- [ ] **5. After a boss** — a «what you got» card with НАДЕТЬ in it. **Built 12.09 (1265cdd):** the
  author's «boss» was a fight at a planet with loot, not «Ревизия»; `27jb-ui-got` queues container and
  boarding parts and shows a card when the fight is over (НАДЕТЬ through `opisFit`).
- [ ] **6. Economy** — drones: price a function of how many you own, `9000·1.6ⁿ`; tiers later. Close
  offline income of pilots/mercs if it drips. Where to spend 1.5 M — a list to the author, no code.
  **Built 12.09:** `dronePrice()` (12-economy) = 9000·1.6ⁿ, n = drones owned (deployed + in stock; a
  drone never vanishes, so no save field); on the author's world the 14th costs 4 053 250. Offline:
  the load already reset crew/manager clocks; the real channel was a sleeping tab (catch-up up to
  24 h / 240 min on return) — a tick gap over `PEOPLE_GAP_MS` (60 s) now calls `peopleOffline()`.
  Drones keep their 24 h catch-up (not asked). Tests to add before the push: price by fleet size; a
  60 s+ loop gap pays nobody.
- **Review block of 12.09** — R0–R5a and the ether prefix shipped in 0.446.0/0.447.0 (bodies in
  `docs/PLAN-archive.md`, 2026-09-12). Each item: red test first (`tests/91zzxa-playable.js`), then
  the fix, a WIP commit, dev, a line to both reviewers. **Open, with the author's decisions of 12.09:**
  - [ ] **R5b first hour — decided «делать всё» by Контроль's numbers.** «First hour» = `G.flownMs` <
    60 min (the only saved play clock; flight modes only). Repair: two buttons «ДО 50% · N» and
    «ПОЛНОСТЬЮ · N» (`#bRepair`, `repairCost`, 26-ui-station:168-230), in the first hour the price ≤
    half the cash. A failed landing in the first hour is a hard landing: −20 % hull, no wreck, cargo
    kept (19-mode-landing:119-130). The galaxy goal (`goalCard`, 13b-occupy, `G.freed`/`G.occ`) does
    not grow until the first liberation. A taken board job lives ≥ 15 real minutes (`OFFER_CARRY_K`,
    11ah-offer:61-64, 180-187) with a timer row in ДЕЛО (`dealRender`, `dealCount`); note `o.t0` is
    compared to `G.t`, which is not saved — use the game clock. The first probe in the first hour is
    free (`probeBuy`, 21a8:68-76; the pad says «ЗОНД ДАРОМ»).
  - [ ] **Wreck price — decided «корпус не выше, чем был»:** after `wreck()` the hull is
    min(45 %, the hull before the trouble), never below 10 % (28-loop:6); «before» = the last hull held
    for ~10 s without damage.
  - [ ] **Scale — decided «мировой зум ×4–5»** (Контроль's form: the world zoom ×4–5 with the ship
    ~.8, replacing the ship floor .7 / body growth ×(1+0.8·(Z−1)) / moon caps). A milestone of its own,
    with frames 390×844 before/after for the designer.
  - [ ] **R6 design and bot tails** (no author call needed): pads name the action always (≤ 2 words +
    a number); prompts ≤ 2 lines, no keys on touch; compass chips only for off-screen things, never
    under windows or the prompt; МАСШТАБ to the HUD top; while the hail is open one undimmed edge arrow
    names the hailing ship; ОПИСЬ sub-tabs (КОРАБЛЬ · СНЯТОЕ · КОМПЛЕКТ · ТРЮМ), slots before ПРИБОРЫ,
    the empty slot says where to buy, СНЯТЬ in one place; ДЕЛО the manager's share in the column,
    drones as a table; ЛЕНТЫ no gap, no «T» on touch; СПЛАВ «В ПЛАВКУ»; a maxed module on one line;
    the got card «/с», red minuses, lower third; a moon/planet name yields to the ship (far side of the
    disc); «КОМПАНИЯ» never crosses a planet chip; agreement in story lines («Женщина в платке
    рассказывал», «кто везёт органика»); a cargo paper in ВЕЩИ shows the destination sector and every
    board card reads «куда · сколько · до когда · за сколько»; the СТОЛ button fixed wide for «99+»
    with the badge over its corner (with the two fixed station-header lines); the barge's seam at the
    hull/module border darker than the plates, not a light line (12l `bargeArtOf`); the haul's planet
    pass at 1.15 r on the side away from the buttons; the prompt «ДЕЙСТВИЕ — ВЫХОДЫ» repeats the pad,
    but the pad reads its verb from the prompt — dropping it needs another source (decide).
  - [ ] **dev.html must not write into the live world** (Контроль): a `test` flag the api drops, or
    bots on a local copy. The two bot signs in `~/drift-data/trace/p/0_0.json` (ids 1789161868db37,
    1789161871db37, 11.09 21:24 UTC) — the author removes them by hand (command given in chat 12.09).
  - Later: deposits refill on landing, the rebind button sticks on a phone, «ТРЮМ ПУСТ» with rare
    cargo, the pronoun in 12aa-need.
- [ ] **Start system picket** — «Коммуна» at 0:0 hails a new player and opens fire ~15 s in.
- [ ] **Market for a newcomer** — «only cooperatives may buy»: check a newcomer can trade at all.
- [ ] **Home-price activity perks** — a fuel coupon per 2 h of active play a week (proposed).
- Tests: none between edits; before the push one full run (-Full, -Mobile, -Mutants) plus scenario
  suites on the phone viewport «player does X → sees Y». The lab stays stopped.


## Moved from PLAN.md on 2026-09-14 (the refactor audit's timing block)

**The full run is 4 minutes on a real clock (`-Times`, 11.09: 230 s single page, 128 s in six
shards), and the author asks what is duplicated.** The thirty slowest suites are 190 of the 230 s;
the candidates, each with what would replace it:
- ~~«картина: ни одна сцена не уехала от эталона кадра»~~ — 0.443.0: folded into the golden loop
  (same scenes, same settle, `LOOK_BASE` kept in `91zzzzy-look`); the golden suite left
  quarantine for it — a golden of another platform (block grid differs) is a note, not a red.
- «двери: из каждой сцены в каждую дверь» (18.5 s, the host's OOM suite) is **not** a duplicate
  of `detDoors` (checked 11.09): the old net is the mode-transition matrix — every scene into
  every mode entry and back, «mode without its state» —, `detDoors` closes DOM screens. Both
  stay; the old one is the one to run in the lab under the capped heap.
- «руки: кнопка над миром отвечает кадром» (8 s) · «обещание: кнопка делает то, что написано»
  (2.4 s) · «инструменты: руки и глаза» (1.9 s) · the controls law in `detect` — four suites
  press buttons and ask the frame to answer; one table of buttons × expected answer, one pass.
- «сквозной: каждая сцена рисуется не пустой, кнопки в кадре нажимаются» (2.4 s) — checked
  11.09: it clicks every visible button in every scene (up to 40), which no detector does; keep,
  it is cheap.
- **Verdict after the first pass (11.09):** the four minutes are mostly unique nets. The two
  biggest (22 s each) are the bot walks and the draw-does-not-consume-rnd check; the only
  true duplicate was «картина» (−11 s, done). The button family (~12 s) is the last real merge;
  after it the time comes from coverage, and the fast tier (25 s Node + 3 s smoke) is what a
  per-edit loop pays — the four minutes are for a release.
- «детерминизм: рисованный кадр не сдвигает случай мира» (22 s) and «прогоны: двенадцать путей»
  (22.6 s) are the two biggest and not duplicates; the bot walks could settle scenes once and
  reuse the detect driver's grabs (both stand on `lookScenes`).
Rule from `DESIGN-tests.md`: the corpus is frozen — fix reds, extract tools, do not extend — and
retiring a duplicate is extraction, not extension. Each retirement: one commit, the replacing
suite named in the patchnote, the mutant that the old suite killed re-checked in the zoo.

## Moved from PLAN.md on 2026-09-14 (the working-plan rewrite)

## PLAYABLE ON A PHONE — the author's playtest of 2026-09-11 — items 0–6 and R0–R6 built (0.446.0–0.448.0); bodies in `docs/PLAN-archive.md` (2026-09-12)

**Policy (author, 11.09):** fix without tests, local commits, look with eyes on `dev.html` at
390×844; the whole test run (-Full, -Mobile, -Mutants) only right before a push. The lab stays stopped.

- [x] 0 the empty tank (exits window, ДОМОЙ/БУКСИР/СБРОС), 1 the station header, the haul scene,
  2 scale, 3 the screens (one prompt slot, the phone cascade, ДЕЛО/СТОЛ/ОПИСЬ), 4 the module card,
  5 the got card, 6 economy (drone price 9000·1.6ⁿ, no offline pay), R0–R5a — 0.446.0/0.447.0.
- [x] **0.448.0 (12.09, solo, the author's decisions of 12.09):** R5b the first hour (`firstHour`,
  05e: repair by two buttons ДО 50 % / ПОЛНОСТЬЮ priced on the button and ≤ half the cash, a hard
  landing instead of a wreck, the front stands until the first liberation, a taken job lives ≥ 15
  real minutes by the game clock with rows in ДЕЛО, the first probe free); the wreck rebuilds no
  higher than the hull held 10 s (`G._hullHeld`, 45 % cap, 10 % floor); the world zoom ×4.5 with the
  ship capped at .8 (`ZOOM_MAX`, `SHIP_SCALE_MAX`; body growth and moon caps removed; fleet,
  pirates, barges, own ships share the cap); R6 tails (the pad always names the action, prompts fold
  to two lines on touch, the hailing ship's undimmed arrow, body names yield to the ship and NPC
  names dodge them, ОПИСЬ phone tabs КОРАБЛЬ · СНЯТОЕ · КОМПЛЕКТ · ТРЮМ, ДЕЛО columns, ЛЕНТЫ without
  a gap, the СТОЛ badge over the corner, the board card «куда · до когда», the cargo paper's sector,
  В ПЛАВКУ, a maxed module on one line, the got card «/с» in the lower third, МАСШТАБ in the
  masthead, the haul's planet at 1.15 r on the left, the barge's dark seam); dev.html and `?test=1`
  mark every POST `test:1` and `api.php`/`war.php`/`log.php` drop the pool writes (`NET_TEST`,
  01-core); later tails (deposits remembered in `G.mined`, the rebind button toggles, ТРЮМ ПУСТ only
  when empty, the pronoun by the goods, a half-price fuel coupon per 2 h of active flight a week in
  `G.actWk`).
- **Open after 0.448.0:**
  - [ ] **2a. Seamless atmosphere entry** — at ×4.5 the frame is 87×188 world units, so the landing
    zone (110 from the surface) lies outside it and the disc you are landing on is off-screen: a
    camera lead toward the body, or the descent starting from the drawn disc. Design first.
  - [ ] Haul scene design review: shuttles passing, a pirate turning away from a ГЛАВТРАССА barge, a
    route bar instead of the countdown, the target chip = the destination station; the window's
    icons per exit and a header with the distance to the station.
  - [ ] СТОЛ: empty sheets say where to get the thing; the last row of desk objects needs bottom
    padding. Station header design review 13–15 (СТОЛ out of the masthead, two tab rows = 110 px,
    prices before the cooperative form, Director news on ДОСКА).
  - [ ] `say()` from timers/network callbacks is neither frame-born nor tap-born — mark those as
    world (`sayWorld`) or set FRAME_IN there.
  - Decided 12.09: the prompt «ДЕЙСТВИЕ — ВЫХОДЫ» stays — the pad reads its verb from the prompt.
    The two bot signs in `~/drift-data/trace/p/0_0.json` (ids 1789161868db37, 1789161871db37) — the
    author removes them by hand. Struck as already true: the start-system picket is mitigated
    (`hailStartSys`, 12ar; the hull floor .5 in 13-combat); selling is open and counter-buying is
    cooperative-only by design (`docs/DESIGN-coop.md` §0.1); `11t-rumours` derives the detail's
    gender from the source's `f` flag, so «Женщина в платке рассказывал» is not reproduced there.
  - Privacy: the author's save sits outside git (`C:\Claude\drift-private`); never commit it.

## Phone playtest 2026-09-13 — the queue (0.449.0, S23 Ultra, 411×742 at DPR 2.625, 120 Hz)

The author played the live game on his phone for an hour, Claude measured over adb + CDP (state,
screen, rAF recorders, a Chrome trace). Every item, with the numbers and the causes found:
**`docs/PLAYTEST-2026-09-13.md`** (§ numbers below). Nothing fixed yet.

**Rules the author set (they bind the whole queue):** (1) a screen never loses its scroll —
nothing re-rendering may knock it off; (2) every tab/screen answers «чтобы что?» — why is it here
for me, what will I do here — before it is redesigned; (3) optimise without losing quality, only
improve; (4) the ship stays under the finger. Umbrella: rework all the interfaces for convenience
— actions, buttons, hints.

Bugs — cheap, one commit each:
- [ ] P1 **Scroll, globally** (§1.1): table pages rebuild with `textContent=""`/`innerHTML=""`
  (`27j-ui-opis`, `12ud-smena`, `25g-postcard`, `11ap-relay`) and `logAdd`/`recordAdd` re-render
  the table on every line whatever page is open — measured 448 → 0 on a journal line. Keep the
  position through any rebuild; re-render only the page a change touches. Net: a suite that
  scrolls each table page, fires `logAdd`, and demands the same `scrollTop`.
- [ ] P2 ОПИСЬ: an opened card is `touch-action:none` — a 150 px dead zone for scrolling; let
  vertical pans through and keep the long-press lift (§1.2). Guard the lift against a re-render.
- [ ] P3 ОПИСЬ tab strip: stretch it; its fade mask never clears because it skips `tabsSync` (§1.3).
- [ ] P4 Compass chips follow the stick footprint (`helmStickFoot` in `drawSystem`) up to
  mid-screen, onto the ship — keep them on the frame's edge (§1.4).
- [ ] P5 «Смена» text is light-on-cream, contrast ≈ 1.1 : 1; styles never moved to the paper; no
  right margin (§5.1).
- [ ] P6 Small: hints cut at 411 px, МАСШТАБ under a chip (recheck on 0.449), the beacon offered
  at the ship and wasted at 0 m, КНИЖКА «хулк» and «командировочные за 0 км», the «день» column
  (`celDay`) out of order (§1.5, §1.6, §4.4).

Flight and camera — design first, then build:
- [ ] P7 **Frame cadence and resolution** (§2.1, §6): intervals scatter over 1–3 vsyncs on
  120 Hz with a variable `dt` → judder; `RES_AUTO` stuck at ×1 (1/7 of the native pixels); the GPU
  raster is the bottleneck; dearest own functions `drawWake`, `hud`, `drawTrail`, plus
  `getBoundingClientRect`/`querySelectorAll` every frame; the reverb holds a quarter core. Rule 3:
  same look, cheaper work. Measure again on a cool phone with `raw/phone-tools/trace.py`.
- [ ] P8 **The ship under the finger** (§2.2–2.4): `flightCam` lag grows with zoom (350–536 px off
  centre at ×2.4); «stop here» fired 15 frames of 3 177; the hull capped at .8 never grows on zoom.
- [ ] P9 **Zoom** (§2.5, §2.6): pinch jumps across 28× (217 frames > 6 %/frame) — easing and
  resting steps; in orbit at ×4.5 the orbited planet leaves the frame — one design with «2a.
  Seamless atmosphere entry» above: keep the body you orbit or land on in view.
- [ ] P10 **ЦЕЛЬ and the hail** (§3): one pad with five meanings (hail answer, probe, crew-off,
  thanks, lock); pickets are not lockable; the hail's fight answer red and named «БОЙ».

Redesigns — each passes «чтобы что?» first:
- [ ] P11 ПРИЁМНИКИ (§4.1): the dial does nothing; announce tap-to-map on the row; back from that
  map returns to ПРИЁМНИКИ; explain what receivers give and why to hunt them.
- [ ] P12 ЭФИР (§4.2): 92 rows, 50 distinct, events drowned in chatter — rethink, enrich.
- [ ] P13 АЛЬБОМ (§4.3): tap to enlarge; keep repaint-from-snapshot (~99 B each, the server is
  safe) but paint far better — photo filters; postcards become collectibles found at stations and
  personal postcards that go into the book; a captioned screenshot saved to the device gallery.
- [ ] P14 ТРУДОВАЯ КНИЖКА (§4.4): a real document built from real трудовые книжки — stamps,
  seals, signatures, savings for the vacation; say what it is for (доска почёта, the grounding
  ending — all designed in M161, none of it on the page).
- [ ] P15 **«Смена» — the main quest** (§5.2–5.3): hard; chapters are milestones opened in
  sequence by deeds in beautiful places (not by buying drones — 25/72 opened on the author's save
  without a landing, the ending before chapter 6); closing a chapter is an «АКТ» moment across the
  screen (reference: No Man's Sky's main storyline); a real book view with plates from the
  player's own flight; the book's text may be edited to fit.

## What is left, in order (reviewed 2026-09-11, 0.443.0) — folded into the WORKING PLAN above; kept for the bodies

Checked against the code, `PATCHNOTES.md`, the lab and `crash.log` on 11.09. Found already done
and struck below: the seven «?» save fields (0.442.0), the hostile-opts suite, the dead names
(0.439.0), the lab's first scheduled run, the road companion (built). Every author question was
decided on the author's behalf (author: «по вопросам реши за меня как лучше») — see the end.

Items 1–6 of this list (stalls, galaxy, determinism, housekeeping, test tails, 60 fps) live in the WORKING PLAN's stages and release tails; only the anchor body stays here.

- **The anchor and the stick (phone video of 12.09, 0.449.0 widened the edge; the mechanism
   stays)** — past the edge the anchor turns the velocity toward the star every frame while the
   stick's assist thrusts outward to reach the wanted velocity; the turn IS a force against
   thrust, so an equilibrium exists (the comment in `17-mode-system` denies it): the ship crawls
   along the edge at a tenth of cruise with the nose 90° off, burning fuel — measured in a 20-line
   sim, matched the video to the second. Two fixes, one commit: (a) the anchor strips the outward
   radial part from the INPUT (`c.ax/c.ay` of the stick, `c.tx/c.ty` of the keys) instead of
   rotating the state, so there is nothing to fight and fuel does not burn; (b) `c.slow` (the
   120° brake rule) reads the player's input against the last wanted vector, not the velocity the
   anchor has bent — the anchor's turn is not a request to brake. Test: at the edge under an
   outward stick the speed never drops below .5 cruise and fuel per second equals coasting.

## The world galaxy — the queue (M447–M451, 2026-09-11)

The author, 11.09.2026: «карта двигается… к экрану они приклеены», and, of four options offered:
«мировая галактика, у нас в игре должно быть всё круто». The map's band, nebula and grit were
screen layers; the world has a core at 0:0 (the rose, `CHRON_R`, `sysDanger`), so the map is a
view from above onto a barred spiral. Design, model, budgets, acceptance, decisions and risks:
**`docs/DESIGN-galaxy.md`**. Picture and names only - no system moves, nothing persists.

- **M447 the model and the glow in the world** - `galaxyAt(x,y)` (disk, bulge+bar, two arms and
  spurs, dust lanes, knots); world tiles in two levels with a 4 ms bake budget and a fade-in
  fallback; band and nebula leave the game map; M438's sky block and suite retired. Node suite for
  the model, a detector for "the galaxy moves with the sheet"; golden frames accepted; g11 verdict.
  Acceptance frame: home, 0:0, zoom 1, inside the bulge - addresses keep their contrast.
- **M448 the resolved stars** - faint stars per sector, constant screen density across the zoom,
  no cross, no halo, no twinkle; the map's `drawStars` call goes.
- **M449 named places** - two arms and ~10 nebulae named in the game's voice; a word in the map
  header and the system card; labels at far zoom; the war page moves to the same galaxy and
  `mapBandPaint`/`mapNebula` are deleted.
- **M450 the overview** - pinch past zoom 5 to ~14: the sheet fades, the whole disk with «вы
  здесь», the settled circle, the danger rim, marks and rumours; the sheet fades back on the way in.
- **M451 one galaxy, two views** - the flight/system/landing/title sky integrates the same model
  from the player's position: brightest towards the core, nearly empty at the rim.
