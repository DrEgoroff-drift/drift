# Drift — work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers — numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic ≤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips — ground, cave rock —
  and `screenLayer(key, paint)` for screen-space constants — the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format: writes `v:5`, reads 4 and 5 (M227).** The feared `server.js`/`worker.js` do not
  exist; the cloud (`site/api.php`) checks only that `v` is present. New fields: `snapshot()` plus
  a safe default in `applySave()` (`14-save`); shape changes ride an `s.v===5` branch. **Every
  field on `G` is either in `snapshot()` or named in `SAVE_EPHEMERAL` (`14a2`) with a reason** —
  the net `91zzzzzzzzz-savenet` (0.438.0) goes red otherwise, and the save→load→save fixpoint
  must hold; numbers coming back from the PHP cloud as strings are numbers again (`optsNumify`).
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `now()-lastTick` (the game clock, M441 — never
  `Date.now()`) with an offline cap. No real-time simulation — the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.
- **Every drawn thing is held against the craft codex before it is called done** (author,
  2026-08-31: «сверь с альманахом по графике, надо чтобы красиво было. С ним надо все сверять
  когда делать будем»). `docs/DESIGN-craft.md` holds the laws, `docs/ALMANAC.md` the dated
  verdicts. The pass is not decoration and not taste: the laws are numbered, the frame ledger
  (`28y-look`) supplies the numbers, and a piece that fails one is named in the almanac rather
  than argued about. A new visual system gets its own almanac issue the way the interface got
  issue II. The order that keeps recurring, and the one to start from: §1 layer order (dark ground
  → body in greys → glazes → wear → highlights, and wear goes *under* the highlights), §12 values
  before colour, §13 body-outline-one-light, §3 keep the empty, §16 expose for the shadows.

- **Design in passes, not in one shot** (author, 2026-08-23). Any design — a screen, a
  component, a drawn thing — gets a draft and then several self-critique passes along the way:
  look at the result as a user/with the art direction, name what is wrong, redo, repeat until a
  pass finds nothing. Optimisation is part of every pass, not an afterthought — check the
  raster/JS budget (`prof()`, the "painted once" rule) before calling a pass clean.

- **New lore rides existing channels (author 2026-09-04).** There is no encyclopedia and there will
  be none: «куска лора не существует, у каждого есть полезная выдача» (`12q`). A milestone that
  brings lore names its channel in this table before it is built — desk (ТЕТРАДЬ, КНИЖКА, ПОЛКА,
  ОТЧЁТ, ВЕЩИ, ДНЕВНИК, ПОЧТА/QSL/АЛЬБОМ), world (rumours `11t`, speech queues `11b`, retelling
  `12p`, the wall, the ledger, the trace, the first hour, the flea's provenance, the hundred
  stories). Mapping for the open queue: «Сорока» → a rumour image, the keeper's speech queue, one
  book on ПОЛКА («Судовой журнал без порта»), one ОТЧЁТ piece; matches → the hold's dismantle line,
  a new paragraph in the station charter book, matchbox labels beside the books; the cooperative →
  the house clerk's speech, the stamp in КНИЖКА, one line from the first-hour relief, the beacon
  saying the name; the beacon → its own channel (ЭФИР, voice in flight, a sheet on the cantina
  wall); holdings → retelling already writes them, the map shows them in place; biome landmarks →
  the organism scanner, a КНИЖКА entry via the institute, a pilot-book of biomes on ПОЛКА.
- **No parallax on the map (M447, author 11.09.2026).** A map layer is either in the world -
  moves 1:1 with the sheet and scales with the zoom - or it is paper - does not move and carries
  no recognisable object. Map stars do not twinkle. Why and how: `docs/DESIGN-galaxy.md` §1-2.

## How a frame is judged (M241) — the meter, and the rules under it

"I don't like the look of it" is not something anyone can act on. Since M241 the frame is
measured, the way speed is: `look()` in the console reads the canvas that is actually on screen
and prints four numbers; `lookAll()` walks every scene and prints the table. The scene list lives
in `28y-look` and is shared with the fuzzer — one list, or the two drift apart.

**Five numbers for a FRAME** (`LOOK_TARGET`, updated M249):

| number | target | what it catches |
|---|---|---|
| pair % (minority of warm vs cold) | ≥ 15 | a single-temperature frame; warm % stays as reference. For natural daylight this is arguable — see loose ends |
| mass % (second-largest of three value steps) | ≥ 14 | no counter-mass: one value doing the whole frame. Measured 0.245.0: 6–43; fails map/belt/cave, passes the empty-but-shaped |
| edge % (step transitions between samples) | ≤ 18 | crumble — a guard, not a goal; today 3–11 everywhere |
| contrast (p95 − p5 of value) | ≥ 0.30 | everything sitting in one narrow band. Measured: 0.07–0.77 |
| tones (hue buckets holding ≥5%) | ≥ 5 | one hue doing all the work. Measured: 2–8 of 36 |

`empty %` stays in the table as a **reference column about content** (M248: the cave is empty
of *things*), not a target about light.

**Five passes for a THING.** A thing is finished only with all five; three or fewer and it reads
as a placeholder:

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
- **Review block of 12.09 — before the push** (Контроль's order; each item: red test first, then the
  fix, a WIP commit, dev, one line to both reviewers). Sources: the tester's `review.json` and
  `botverify.json` (scratchpad 3d6318e9…), the designer's letters. Scale stays as built until the
  author says otherwise (the reviewers disagree; a peer cannot decide for the author).
  - **Handoff 12.09 ~02:30:** R0 done (ee24e4b). R1 committed WIP: the equal ACT keeps the first
    writer unless the first line names the same object (`cueSameOffer`), the hail runs before the
    station/belt/base, `if(cue(..)&&actEdge)` in 17-mode-system, `_probeAt` lives one frame (B1).
    **Red now: M311 «плавбаза чинит», «чистому борту — конвой»; M312 «госпиталь», «учебное»** — the
    fleet suites call `fleetInteract` for different ships in a row without a frame; start each call
    with `cueReset()` in those tests (a new frame) or refine the rule. Then R1's module interactors
    (12ai, 12l, 17b, 11ap, 12as, 13d) to `if(cue(..)&&actEdge)`, then R2.
    **R0 open (tester on dev, both reviewers):** (1) behind СТОЛ/ОПИСЬ/station the hail window hides
    (`hailWinSync`) while `H.t-=dt` keeps running (`hailTick`) — «read the log, got a volley» outside
    the start system. Fix: the hail window sits above `.scr`/#tablewin and shows over any screen; while
    it cannot be shown, no new hail starts (`hailPicket`) and `H.t` stands; hostile fire at the player
    pauses while a screen is open; the «МОЛЧИТЕ» toast is trouble and shows over screens. (2)
    `HAIL_HOLD` 420 → 900 on a phone. (3) Chips dim under the hail window like the rail. Red test
    first: «СТОЛ open, a hail comes, 20 s → G.hail alive, hull intact; СТОЛ closed → ДЕЙСТВИЕ
    answers». Scale stays with the author (reviewers split: the designer accepted the formula,
    Контроль wants the world zoom ×4.5) — do not change it without the author's word.
  - [ ] **R0 picket «Коммуна»** (built ee24e4b, two holes above): the hail is a window with ПРОХОДОМ / ПО ДЕЛУ and a countdown, no fire
    while it is open; in the start system the picket never wrecks (a warning volley, then escort);
    both pads relabel; B2 — the hail takes ЦЕЛЬ before the probe, `hailAnswer("pass")` no H.warn;
    first rungs tank 500 / hold 900 (Контроль); test «start, 120 s silent → hull > 50 %».
  - [ ] **R1 cue and ДЕЙСТВИЕ**: an equal ACT keeps the first writer; `if(cue(..)&&actEdge)`; the hail
    before the station/belt/base checks; test «belt ring 100 from a planet: prompt = action».
  - [ ] **R2 empty tank**: no nose turn on fuel 0; any flight input asks for the window; stick and move
    pads dim, «БАК ПУСТ» over the stick; test «fuel 0, turn → angle unchanged, window open».
  - [ ] **R3 the rescue window**: tester 1 (window/БУКСИР/ДОМОЙ/СБРОС during a haul), 2 (a wreck on the
    rope loops), 3 (СБРОС clears every fit, keeps the lost parts), 6 (dock greetings burn behind the
    screen; the crash toast hides), 7 (stale window, Space at the dock), 9 (× 44 px, tap outside,
    Escape), 10 («в баке будет» = max), 12 (the armed СБРОС label returns), 13 (СБРОС on a bare
    «Стриж» is free), 16 (a chip tap on the rope sets G.ap); HOME_DOCK_COOL applied; surface fuel 1–7
    is not «ноль» and not a taxi jump. Designer: the window in the lower third, pursuit in its head,
    the armed СБРОС red with a 4 s bar, sub-lines 11 px ≥4.5:1, head «до станции <name> · <dist>»,
    icons per exit, ДОМОЙ alone is the main button, the menu shows its price.
  - [ ] **R4 the haul scene**: the rope from a stern boom to the ship's nose, drawn after the flames;
    the barge comes from behind and overtakes; the end at the station by `S.ang`, a 3–4 s unhook and
    departure; camera eased; lines and debris as a deck; `rndFx` out of haul state (M441).
  - [ ] **R5 bots**: B1 `_probeAt` reset every frame, price on the pad, second tap; B3 the surface sign
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
  - Later (after the release): deposits refill on landing, the rebind button sticks on a phone, «ТРЮМ
    ПУСТ» with rare cargo, the pronoun in 12aa-need, the station header two fixed lines.
- [ ] **Start system picket** — «Коммуна» at 0:0 hails a new player and opens fire ~15 s in.
- [ ] **Market for a newcomer** — «only cooperatives may buy»: check a newcomer can trade at all.
- [ ] **Home-price activity perks** — a fuel coupon per 2 h of active play a week (proposed).
- Tests: none between edits; before the push one full run (-Full, -Mobile, -Mutants) plus scenario
  suites on the phone viewport «player does X → sees Y». The lab stays stopped.

## What is left, in order (reviewed 2026-09-11, 0.443.0)

Checked against the code, `PATCHNOTES.md`, the lab and `crash.log` on 11.09. Found already done
and struck below: the seven «?» save fields (0.442.0), the hostile-opts suite, the dead names
(0.439.0), the lab's first scheduled run, the road companion (built). Every author question was
decided on the author's behalf (author: «по вопросам реши за меня как лучше») — see the end.

1. **The DPR 2.5 stalls** — «Loose ends → Systems». Small, real, on a player's machine, and it
   comes before a new bake.
2. **The world galaxy M447–M451** — the author's latest ask; `docs/DESIGN-galaxy.md`.
3. **Determinism tails** — `wanderer · A` (real chance or real time on the corridor's buy path),
   the clock out of `stateHash`, `planetStripTick` by `wallMs()`.
4. **Cheap decided housekeeping** — the `.gz` cache headers, the PATCHNOTES trim, the patch-bump
   rule; one commit each, in any gap.
5. **Test tails** — M443–M446 «Open»/«Left» and the refactor queue; each a commit. The staged
   oracles (goldens, worlds, trips) wait for the lab's week to 2026-09-18.
   **Lab stopped 11.09:** the host warned of CPU over the plan (57.27% of a day against 50%);
   the `lab.yml` schedule is removed, the running session killed. Before any restart: a CPU
   budget per session that fits the plan (short manual runs, `nice`, fewer Chrome minutes);
   the 2026-09-18 week moves until then.
6. **Before the release** — the 60 fps check in all modes.

## Next — after M321 — closed (the queue of 2026-09-03 and §18.8); body moved to `docs/PLAN-archive.md` (2026-09-11)

## «Сорока» — the wanderer queue (M340–M346, 0.339.0–0.346.0, closed 2026-09-05) — body moved to `docs/PLAN-archive.md` (2026-09-11)

Design: `docs/DESIGN-wanderer.md`. The queue, its decisions and the M351 cooperative answer live in the archive — grep «Сорока» or M34x there.

## Closed milestones M354, M355, M357, M359 (0.352.0-0.357.0, 2026-09-05) — bodies moved to `docs/PLAN-archive.md` (2026-09-08)

- **M354 deep tests** — the seven cross-cutting nets over the topic suites.
- **M355 does the button do what it says** — an action button names its action and takes its verb from the prompt.
- **M357 hunting by search** — the game reads its own source and checks every name called by string.
- **M359 the evidence, the hands, the things** — the ledger, the players' hand, the objects that stay.

## Side passes of 2026-09-07 — all built; bodies in `docs/PLAN-archive.md` (sections of 2026-09-10 and 2026-09-11)

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

## Tests — the architecture and the queue (M441–M446, 2026-09-10)

The author, 10.09.2026: «тесты должны проходить быстро, должны предсказывать, должны ловить
баги, которые есть, но их не заметили… должны заменять ручное тестирование». The reasoning, the
industry comparison and the skeleton are in **`docs/DESIGN-tests.md`**; this is the queue. Rule
of place from §3 there: a law becomes a detector, a player's path becomes a scenario, a formula
becomes a Node suite — nothing else becomes a suite, and the existing 809 are frozen (fix reds,
extract tools, do not extend). Order is strict: determinism first, everything after stands on it.

- ~~**M441 determinism in the game**~~ — 0.428.0: `rnd`/`rndFx`/`now`/`clockSet` in `01-core`, ~400
  calls migrated, the build law, `stateHash` + the same-hash suite over `lookScenes`, `resetWorld`
  pins seed and clock (`?hour=`), `bNoDir` gone. Open: ~~the fuzz seed into `rndSeed`~~ (`T.go`
  seeds it since M442); `TEST_T0` is
  12:00 *local* (green in UTC, LA, Auckland); a drawn run's full hash differs from an undrawn one
  (draw fills lazy caches in `G`) — only the `rnd()` position is compared, a detector for M443.
- ~~**M442 the test API and the harness rules**~~ — 0.430.0: `T.*` in `tests/90a-tools.js`
  (old helper names are one-line wrappers; `T.state()` = `stateHash()`, `T.go(scene, seed)` seeds
  `rnd()`, `T.advance/clockShift` move the game clock), `docs/stand.py` (stdlib CDP, one Chrome),
  `suite(name, {tier, win, stage}, fn)` instead of the three lists, zero-assertion rule, the net
  over `ok(true`/`typeof`-guards (from the end of the detectors `90c` to `99-run`), `?shuffle`/`?pick`,
  UI selections outside `G` restored after every suite. Open: `T.bot` is a stub until M444; the
  tools' self-test sits before the net; `G.opts` is still not reset by `resetWorld` (the detector
  driver keeps `DET_OPTS_BOOT`).
- ~~**M443 the five oracles as detectors**~~ — 0.429.0 + 0.431.0. Crash, stuck, law (NaN/type/unknown field, a `Proxy`
  over `G` counting reads of missing fields, instruments → fields table, control answer classes,
  picture laws: legible text × ruler, parallax by depth, sharpness, no flicker, no popping, one
  human height), imbalance over seeds, picture (golden frame per scene × three windows, perceptual
  threshold, `accept`). Run over `lookScenes` × five gestures first; every red here is a real bug
  and gets its own commit.
  **0.429.0: four of five done** — `tests/90b-detect.js` (measures), `90c-detect-laws.js` (laws),
  driver `91zzzzzzzz-detect` (15 scenes × 5 gestures + menu doors + armed ship, 93 steps, 8–12 s);
  ten bug commits (type off the ruler in six modes, four unreadable labels, НАСТРОЙКИ dead on a
  text pad size from the cloud). **0.431.0: five of five** — golden frames
  (`91zzzzzzzzz-golden`, block signatures in `docs/golden/<W>x<H>.json` for the three harness
  windows, `test.ps1 -Accept` re-shoots one) and the worlds oracle (`91zzzzzzzzz-worlds`, Node:
  every station in six rings — a neighbour in reach, no ×4.5 counter, fuel ≤ ×3 median, the
  distribution of the best one-hop deal); both staged to 2026-09-18 (§3.6), the lab's history
  sets the thresholds. The same-hash suite also runs under seeded hands now. **Open:** not caught
  yet — the .55 auto-brake, the money-printing counter, idle drones; partial — the helm switching
  itself, sharpness/perch at DPR 1; the contrast check reads low under a vignette drawn after
  text; A/W judged in the system view only; golden baselines are the laptop's GPU — the lab's
  SwiftShader will say whether the block mean is coarse enough (that is what the week is for).
- **M444 scenarios and coverage** — **part one, 0.432.0:** `T.bot` with fourteen goals through
  the player's controls (`90a-tools`), eight walks under all detectors with the screens kept open
  (`91zzzzzzzza-walks`, ~15 s, every harness window), the coverage map mode × step printed by the
  run; the first pass found three unreadable labels the scene runs never saw (МАСШТАБ over a
  planet disc, ШАХТА and ПЕЩЕРА on a day sky). **Part two, 0.433.0:** `test.ps1 -Changed` —
  `build.ps1` writes `docs/TESTMAP.json` (test file → `src/` modules whose symbols it names) and
  stamps `TEST_FILE` into `tests.html`; `?files=a|b` / `-Files` run the suites of those files.
  **Part three, 0.434.0:** `?rec=1` recordings by frame (`15c-rec`: key mask + step, heads with a
  copied snapshot, `rndState`, clock; autopilot targets as frame events; F8 «bug here» →
  `drift.rec`), `T.replay(rec,{seed,hour,each})`, suite `91zzzzzzzzb-replay` (Node). **0.435.0:**
  four more walks — a fight with pirates in a far system (`T.bot("fight")` aims and fires), the
  base's lift and compartments, the home's room and a thing to look at, the wanderer's shelf and
  a lot bought for matches — twelve paths, ~22 s. **0.437.0:** the recorder keeps screen clicks
  as frame events (button id and label) and the replay presses them on the screen open at that
  frame; the bot opens the trade section by its button, as a player does. **Left:** a cooperative
  walk; drags and the wheel are not recorded; the map printed per window by the build, not per run.
- ~~**M445 the mutant zoo**~~ — 0.433.0: eleven mutants in `tests/mutants.json` (`zoomStep`
  no-op, `mapFont` without the ruler, `mapSkyShift(d)=d`, W without thrust, a lying fuel readout,
  an icon button without `aria-label`, a manager field off `applySave`, a perk without a reader,
  `drawBelt` empty, a bare label on a day sky, `resetWorld` leaving a field); `test.ps1 -Mutants`
  (all, ~4.5 min) or `-Mutants -Only name`; ten of eleven died on the first run, the eleventh
  after the «кнопка без слова» law joined the detectors. The lab cannot build (no PowerShell on
  the host), so the zoo runs on the laptop before a release, not nightly. **Open:** «resolution
  never returns» has no mutant — the sharpness detector compares the canvas with the DPR the game
  chose, not with the DPR it should have chosen; a mutant `DPR=.5` would survive (needs a rule
  for when `resAuto` may lower it under virtual time — decided 11.09, see Decisions). Seeds ×100 on scenarios stay in M446.
- **M446 the lab's own oracles** — **0.436.0: trips over worlds** (`91zzzzzzzzc-trips`, Node, 2 s,
  staged to 2026-09-18): the bot's round trip planet → ore → station in twelve station systems,
  the distribution of frames, fuel and ore (today: median 2 152 frames, 26 fuel of 100, 12 ore;
  every trip closes), red on a world stuck, ×3 slower than the median, over 80 % of the tank or
  under a quarter of the median ore; `?worlds=N` for the lab. Left: previous-version diff, `look()`
  telemetry from players into `log.php` and the lab page; and the lab's loose ends below.

### The lab, first night (20260909-235848, 0.427.0) — its three reds fixed by 0.427.2, the OOM class and the fuzz timeout done; body in `docs/PLAN-archive.md` (2026-09-11)

### The lab, second night (session 20260911-003934, 0.440.0, 123 of 300 min, 92 runs)

Read on 2026-09-11 morning from `runs.jsonl`/`errors.txt`. Verdicts: 78 green, 12 OOM, 2 red;
29 268 passes; the previous night's four reds (node ×2, «полный трюм», «свет») are gone.
- **Two GAME reds, both already answered.** «подсказка … ДЕЙСТВИЕ не сделало ничего» on the
  map — the silent refusal on your own sector, fixed in 0.441.0 (the lab found it on its own the
  same night). «золотые кадры … сетка 40×20 против 40×25» — the server's headless has no window
  frame, so the requested 1280,800 *is* the canvas there (40×25 blocks) while the laptop's is
  1248×641 (40×20): **goldens are per platform**, and the suite is staged anyway — but
  `lab.py` counted a staged failure as GAME red; fixed (it now skips the КАРАНТИН block and
  `[карантин: …]` suites). Open: a per-platform baseline (`docs/golden/<W>x<H>@<host>.json`, the
  lab accepting its own on first run), or the block mean coarse enough to cross platforms — the
  week's history decides. **Decided 11.09: per platform** (see Decisions).
- **The hunt stopped itself at 123 min of 300**: five fuzz OOMs in a row hit the same known key
  (`de3ea33cb07a`) and the streak rule read that as «five seeds without anything new» — a host
  failure counted as a game verdict. Fixed in `lab.py` (host-class units no longer feed the
  streak). Fuzz: 39 seeds, 34 green, 5 OOM (13 %, same as night one), 0 game failures.
- **OOM at 768 MB, 12 units** (13 the night before): «руки» light:0/6 and «двери», «устаревшая
  кнопка» (known); new this night — «детерминизм: рисованный кадр не сдвигает случай мира»
  (light:3/6, an M441 suite), «сквозной: сейв позднего мира» (mobile), «M314: трассы» (tall),
  «полный трюм» (heavy, was red, now OOM). All auto-solo next time. Median rss 683 MB, fuzz at
  the ceiling (767). Heavy suite times unchanged (top «печь» 65 → 68 s).
- **The lab after the second night (11.09, the author: «пусть постоянно что-то гоняет», «на
  сайте много лишнего, не видно, что починено»)** — four sessions a day (`0 */6`), light
  shards 6 → 12, phone and tall windows in four shards each, the hunt never stops itself, host
  kills do not feed the streak; Chrome leftovers are killed after every unit (a `timeout`
  killed only the parent — the renderer stayed in the cgroup and the next unit paid for it:
  the likely cause of the OOM runs; measured 11.09: the same fuzz seed 767 MB and killed at
  night, 685 MB and green alone); `--js-flags=--max-old-space-size` measured on «двери» — green
  at 32 s with no cgroup kill. The page: four tiles, the bugs with their fate (`fixed`/`gone`/
  `dropped`/`quiet`), the host folded, one row per session. `docs/LAB.md`.
- **The lab's own loose ends (into M446)** — `fix` and auto-quiet done in 0.427.2. The first
  scheduled `lab.yml` run came at 00:38 UTC 11.09 (38 min late) and is the second night above;
  the first run on the new `0 */6` had not started by 07:08 UTC — GitHub delays schedules under
  load, read `sessions.jsonl` before calling the lab dead. Light shards run at 550–770 MB of 768:
  one more canvas and they join the OOM list. `lab.ps1` holds a session only while the laptop is
  awake. The PHP «short Node jobs on player hits» probe — decided no (see Decisions).

## Refactor audit (0.438.0, 2026-09-11) — what the night's commits left, and the queue after them

Four hostile reviews of 0.428.0–0.437.0 plus a survey of `src/` (322 modules, 88 k lines, 4 695
symbols, none declared twice). Verdict on the night: M441–M446 stand; the defects were in the
tooling around them, not in the game. **Done in 0.438.0:** `-Mutants` restores the file's text
instead of `git checkout --` (that erased uncommitted work); `-Changed` runs the full corpus when
`tests/90*` changed and the fast tier when nothing matches (was `exit 0`); a 900 s ceiling per
shard with a kill of its own Chromes (the 33-minute GPU hang of 10.09); `G.opts` back to boot in
`resetWorld` (`OPTS_BOOT`, the `DET_OPTS_BOOT` workaround gone); the clock law also refuses
`Math["random"]`, `Date["now"]`, `new Date` without parens; `typeof`-ghosts fail the build instead
of warning; the map jumps in `updateMap`, not inside `drawMap` (the world changed in drawing — no
frame, no jump); `optsNumify` on the cloud boundary; the save net and fixpoint suite; `T.bot("undock")`
can go red; `T.replay` refuses a recording from another `VER`; the trips oracle has absolute anchors
(2 152 frames, 26 fuel, 12 ore ×1.5) beside its own-median thresholds; `detRuler` runs last;
`INDEX.md` names where a symbol ends (`file:start-end` — `Read` by exact offset).

**Queue, in order (each a commit; the safety net is the golden frames and `stateHash`):**
- ~~**Tiers by evidence, not by name**~~ — 0.439.0: 132 «browser» suites whose body names no
  browser API moved to Node (137 tried, five went red under the stubs and stayed in Chrome —
  the lander's scale, the maker's breed, the postcard's eight places, the beggar's taps, the
  engine hum); five Node suites that read `getBoundingClientRect`/`ctx.`/`drawWorld`/`style`
  moved to Chrome. Node tier 481 → 616 suites, 22 → 25 s; Chrome tier 295 → 168 suites. Left:
  the per-edit tier is 25 s, not the ~5 s of 0.359.3 — `-Times` for Node is owed; a suite that
  is green under stubs is not proven honest, only not proven vacuous.
- ~~**Golden frames keyed by the requested window, not the measured `W×H`**~~ — 0.440.0:
  `test.ps1` puts `?win=W,H` in the address, the suite keys `docs/golden/<W>x<H>.json` by it
  (files renamed 1248x641 → 1280x800, 548x685 → 390x844, 1408x1281 → 1440x1440), and a window
  without a golden is red, not a note. Still true: `deploy.yml` runs the fast tier only, so no
  browser suite runs in CI; the lab's SwiftShader will say whether the block mean is coarse enough.
- **The silence table** — 15 mode × gesture pairs left. 0.441.0: `base · W` gone (the base scene
  puts the cage on the second level; the promise suite that blocked the first try hashed only the
  first 4 000 chars of the mode's JSON and never saw the menu open — fixed to `stateHash`). Still
  silenced: `wanderer · A` — two steps from the ladder the same-hash suite goes red under seeded
  hands: **something on the corridor's buy path (`wanderBuy`/`wanStep`, 24c) reads real chance
  or real time** — find it, then move the scene. `detStuck`'s key law fires only on a frame diff
  of exactly 0 — soften it together with that table, not alone (tried; map W/A went red).
  Found on the way: the map was silent on ДЕЙСТВИЕ with your own sector selected — now it speaks.
- **`stateHash` mixes `now()` in** (`08a-statehash`) — decided 11.09: the clock leaves the hash
  and becomes its own field (see Decisions); to build. Done in 0.440.0: `Set`/`Map` with
  primitive members hash sorted. Still open: `planetStripTick` cuts by `wallMs()` and writes
  `stripLvl` into hashed state — machine-dependent under load.
- **A shard hangs now and then** — 10.09 a GPU process spun 33 min; 11.09 shard 1/6 of a
  `-Full` sat 900 s and was killed by the new ceiling, the rerun was green in 139 s. Not
  reproducible on demand yet; the ceiling turns it from a lost night into a lost fifteen
  minutes. Next: `--enable-logging=stderr` on the laptop runs too, so the hung shard leaves
  the name of the suite it was in (the lab already does this with `tests-trace.html`).
- **The source net over suites is line-based** — `ok(\n true`, `ok(1,…)`, `"function"===typeof f`
  pass; the harness self-suites vanish under `?files=` (`_file`). And the clock law does not
  cover `tests/` (41 raw calls in 13 files, mostly `performance.now` for cost — legitimate, but
  unreviewed).
- ~~**Opts from the cloud, the rest of the class**~~ — done: `91zzzzzzzzz-savenet` «сейв: числа
  опций из облака возвращаются числами» holds the whole class, not only `padSize`.
- ~~**Seven «?» fields in `SAVE_EPHEMERAL`**~~ — 0.442.0: `kills`, `orderStamp`, `baseVisit`,
  `radioF` persist; `hailLog`, `quietGone`, `logNewBy` stay per session, reasons beside them.
- **Long functions, on touch only** — 27 over 200 lines (`drawDigWorld` 569, `homeRoomBody` 550,
  `drawRoad` 539, `drawPostcard` 457, `updateSurface` 452): split along layers, verify by golden
  hash, never as a project of its own.
- ~~**Dead symbols (22)**~~ — 0.439.0: deleted with their comment blocks (`BASE_STANDBY`,
  `chessCanMove`, `crewHostages`, `deltaHtml`, `drawHoldMods`, `ethReset`, `mailDrop`, `namesBlock`,
  `recOn`, `rungDef`…) after a grep of `src/`, `tests/`, `site/`, tools and docs each.
- **Release hygiene** — decided 11.09 (see Decisions): work that touches only tests, tools or
  docs bumps the patch; a minor bump means `src/` changed and `-Mutants` ran green first.
- **Tools zoo** — `shot.ps1`, `shot.py`, `pageshot.ps1`, `stand.ps1`, `stand.py`, `mkstand*.ps1`,
  `mkview.ps1`, `mkshots.ps1`, `mksiteshots.ps1`: one way to take a frame, the rest deleted.
- **PATCHNOTES.md is 847 KB** — decided 11.09: trim, not split. Versions before 0.400.0 move to
  `docs/PATCHNOTES-archive.md` (grep only, like `PLAN-archive`); one commit, no build change.
- **`play.html` goes out uncached** — checked 11.09: `.htaccess` gives `\.html$` `max-age=60,
  must-revalidate`, but a gzip-capable browser is rewritten to `play.html.gz`, whose block sets
  only the encoding, and no `ETag`/`Last-Modified` come through openresty — every visit pays
  1.97 MB. Decided: the same `Cache-Control` on the three `.gz` blocks plus `FileETag MTime
  Size`; `curl -I` after the deploy; `api.php` untouched.

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

**Rejected, with the reason:** a palette module for the 893 hex colours (would flatten the
deliberate range — measure hue histograms instead); a mode table for the 258 `G.mode===` (stable,
no bugs, all conflict); removing the 1 804 `typeof` guards (the ghost law covers the danger at
zero churn); a schema-driven `applySave` (the net plus the fixpoint suite give the value without
touching the v4/v5 branches); not committing `drift.html` (breaks «opens with a double click»).

## The frame is the judge for anything the player touches (M437)

Eight hundred suites missed a dead button on the map for as long as it existed, and the three
reasons are structural - worth knowing before writing the next interface test.

- **A control is found by what it *is*, not by what it says.** Every sweep collected elements
  with text and matched the text against a verb, so an icon button (`+`, `−`: an SVG and an
  aria-label) belonged to no list at all. Enumerate what is visible and enabled; take the caption
  from `textContent` *or* `aria-label` *or* the id.
- **A changed field is not an answer.** `prDelta` compares `G`, and the dead `+` did change a
  field - `G.zoom`, invisible on the map. Anything the player reaches over the world is judged by
  the frame: sample the canvas before and after, measure the world's own motion first (a scene
  moves by itself), and require the press to beat it. A spoken refusal, a window, or a mode change
  count too; a field does not.
- **The rail was never swept, because it is not a screen.** Sweeps open `.scr`. The two or three
  buttons that hang over the world in every mode are the ones the player sees most and the ones
  nobody tested. Drive them per *mode*, over `lookScenes()` - the same list the frame meter and
  the fuzzer use.
- **Clean up after a press through the game's own door.** The first draft closed the menu by hand
  (a class off `body`, `display:none` on `#menu`); the game still thought it open, the next press
  *closed* it, and a live button was reported dead. Cleaning up with your own hands is mocking by
  another name.

## Loose ends (as of 2026-08-28, after the graphics run 0.237.0–0.244.0)

Bodies of the struck entries below moved to `docs/PLAN-archive.md` (2026-09-10, section «Loose ends») — grep there by milestone.
Everything left open, with the reason it is open. Nothing here is a bug report — bugs are fixed
the day they are found; this is work that was deliberately not done, or that needs the author.

### Needs a decision from the author

Nothing (2026-09-11). Every fork that stood here — drone attrition, the craft plan remainder
(P4 grisaille, P7b the glyph notebook, С5 fatigue), the save fields, the clock in the hash, the
release and notes hygiene — was decided on the author's behalf; see «Decisions taken on the
author's behalf» at the end. Old bodies, with P4's spec and its measuring trap: `docs/PLAN-archive.md`,
«Moved from PLAN.md on 2026-09-11 (review)»; P4's spec also stays in `docs/DESIGN-craft.md`.

### Systems

- **Stalls on a player's machine (new, found 11.09 in `crash.log`).** 09.09, 0.425.0, window
  1536×791 at DPR 2.5 (ip hash `6ce8b33c` — the same hash sent the phone journals of 07–08.09):
  five frames stood 2.0–3.4 s in the first 30 s of the system view; the fps beat says 38 in the
  system (0.422.0) and 43–54 on the map. M418's slicing (worst slice 6.2 ms) was measured at
  DPR 2; at 2.5 the canvas is 3840×1978 and something is not sliced, or `resAuto` does not step
  down. Reproduce on a cold start in the system with `docs/g11.ps1` and
  `--force-device-scale-factor=2.5`. First in the order: the galaxy adds a bake of its own.
- **`journal` entries in `crash.log`** — 27 in two days, all «Дрон Д-… встал · чинится сам» plus
  one «Летопись разошлась…» from a 400×400 headless: check whether a journal line is meant to
  reach the error log at all (the M417 kind of noise).
- The freeze item itself (M234/M238/M417/M418) stays closed until the log shows a stall that is
  not the bake; body in the archive.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and
  its body goes to `docs/PLAN-archive.md` in the same commit (done 2026-08-28, 09-02, 09-04,
  09-10, 09-11).
- **Push only after a green run**, and keep the run and the push in separate commands (0.238.0
  went out while a suite flaked one run in three).
- **A dirty page still surfaces on its neighbour.** Running in parts turned three long-green
  suites red (0.426.0); nothing yet names the suite that leaves a `.scr` open, a body mode class
  or a key held. A per-suite check after `fn()` would name the culprit — not built.
- **«свет: звезда — самое светлое» went red once in the pane at 1280×800** (Нейэль I, .694 vs
  .536) while headless stayed green; the cumulus over the disc (0.427.1, `CLOUDS_OFF`) is the
  likely cause — one look in the pane, then strike.
- Tiers, switches and what the run costs: `CLAUDE.md` «How to verify» and `docs/VERIFY.md`; the
  2026-09-09 cost measurement (`drawWorld` is the bill, three levers) is in the archive.

## Closed 2026-08-28 → 2026-09-02 — one line each, moved to `docs/PLAN-archive.md` (2026-09-04)

## Done — struck items moved to `docs/PLAN-archive.md` (2026-09-04)

## Open by design (not defects; no pass planned)

Reviewed 2026-09-11. Closed and moved to the archive: the fleet (eleven interactions, the заявка
struck), the road companion (built, `27k-road`; its answers are on the record in `DESIGN-road.md`),
factions as shapes, the split debt, the star disc, G11, M112, M124, M135–M151. «Base like
Fallout Shelter» — it is one; closed. What stays open on purpose:

- **M125** — the rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation; cosmetic, and the rack is not persisted by rule.
- **M126** — the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table.
- **M127** — instruments as loot beyond a knocked socket wait for the spec's «lost» pass.
- **M131** — the barge passenger as a channel, settlement glyph overrides, per-region colouring.
- **M132** — edge generator, hand-built cores per region, surface masks — each region's own milestone.
- **The yacht railing below 3×, flat-on view** — the richness a rotation pass would give.
- **P9b settlement recursion (Eglash)** — by eye over many settlements; a pass, not a fork.
- **The holding's deeds with no counter yet** (pirate bases boarded, monuments, nodes) join the
  rung score when their hooks are written.

## To the release

The newcomer's first four hours were walked (M207, M212, M215, 27.08) and fixed; bodies in the
archive. Left: **the 60 fps check in all modes, re-run at the actual release** (author,
2026-09-05: «60 — хрен с ним, потом»).

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

## «Зачем лететь» — moved to `docs/PLAN-archive.md` (2026-09-04); its answer is Act I

## First three — built; body moved to `docs/PLAN-archive.md` (2026-09-04)

## The arc and the holding — built; bodies moved to `docs/PLAN-archive.md` (2026-09-11)

Act II → the expedition → Act IV → the yacht (M225–M231, 0.210.0–0.216.0; `91zzzf-offer` guards
that the truth is never spoken). The holding M289–M298 (2026-09-02), design in
`docs/DESIGN-holding.md`.

# ~~The war — M360–M388~~ — closed 0.388.0 (2026-09-06); body in `docs/PLAN-archive.md`

Twenty-nine passes, all closed: the fight (M360–M363), the world (M364–M375), everyone
(M376–M381) and the Director's seven families of mechanics (M382–M388). Design stays in
[`docs/DESIGN-war.md`](docs/DESIGN-war.md) — §18 is the struck queue with what each pass measured
and what it deferred, and «Deferred» there is the only remaining war work; there is no separate
queue any more. Measured from M360 on: `prof()` with eight armed ships on the phone layout; the
pad row on the 44 px sweep (`91zzy-screens`); `91zzzw-chron` replay hashes browser vs Node.

## Decisions taken on the author's behalf, so they are not re-litigated

- **2026-09-11, the author: «по вопросам реши за меня как лучше».**
  - **The clock leaves `stateHash`.** `stateHash()` is the world and the `rnd` position; the clock
    is a separate field (`T.state()` returns both). Two saves of one world at different hours
    must hash alike; «where did it diverge» compares worlds and prints the clocks beside.
  - **Versions:** a commit touching only tests, tools or docs bumps the patch (0.443.1); a minor
    bump means `src/` changed and `test.ps1 -Mutants` ran green before it.
  - **PATCHNOTES: trim, not split** — versions before 0.400.0 go to `docs/PATCHNOTES-archive.md`.
    Splitting per file would add a build step and a habit for a conflict that resolves itself
    (both sides prepend).
  - **`play.html` caching:** `Cache-Control: max-age=60, must-revalidate` on the `.gz` answers
    too, plus validators; never a long max-age on the game — a stale build after a push costs
    more than 2 MB.
  - **No Node jobs on the PHP host** triggered by players: 768 MB that already kills the lab's
    Chromes, and the live site shares it. The lab stays on the GitHub schedule.
  - **Goldens per platform:** `docs/golden/<W>x<H>@lab.json`, accepted by the lab itself on its
    first run after the laptop's goldens changed; the laptop's stay the reference.
  - **`resAuto` never lowers the resolution while the clock is pinned**; the sharpness detector
    then holds the canvas to the DPR the settings ask for, and `DPR=.5` gets a killer.
  - **P4 grisaille — no.** The world's palette ramp stays the ground's hue: worlds are told apart
    by it (the rich-palette rule). What may be taken from the glaze later is the sky-coloured
    shadow alone, measured per scene.
  - **P7b glyph notebook** — a record of glyphs seen: where, when, drawn as seen. No meaning is
    ever filled in and there is no «understood» state; understanding stays in the player's head.
  - **С5 fatigue** — an axis on managers (they already have faces, a card and loyalty); hired
    hands stay faceless bets.
  - **Drone attrition** stays out (decided 2026-09-03: never lost); **the base** is «like
    Fallout Shelter» already — closed.

- **2026-09-03, the author: «по остальным реши сам».** The cave keeps M217 (one height for the man
  everywhere; the camera stays); the drones keep selling at the nearest station and are never
  lost; `pair` for scenes lit by natural daylight is reported without a verdict (per-scene targets
  in `LOOK_TARGET`, M308); the fleet's names are our own — Короб, Кубрик, Воротник, a call-sign
  for the node, no name for the derelict (CRITIQUE-holding fork 4), «под расписку» rewritten
  without a book of debt, «груз в попутную» struck. Order after M305: M306 station body (§13),
  M307 home as a generator, M308 landing/day sky + map band + small tails, M309 system nebula and
  traffic, M310+ the fleet.

- The buyer of a route pays a **share of what it earned you**, not of a theoretical spread.
- **What is built is never for sale** — knowledge of a road can be, your mark on the world cannot.
- **Stale price notes are shown as a widening fork**: «титан 41…58 · записи шесть дней».
- **Only the player builds.** The factor and other people's barges haul along what exists.
- **`api.php` is left alone**; the client is proof against its `{}` → `[]`, and the conditions for
  ever touching it are written in `docs/DEPLOY.md`.
- **Naming register Б+А** (2026-08-31). Two earthly words stay on purpose — «Красный уголок» and
  «Столовая», with «Дружина» beside them: in a module at the edge of the galaxy they read as home,
  and that seam is what Soviet science fiction was made of.


# ~~The base — M390–M409~~ — closed 0.409.0 (2026-09-07); body in `docs/PLAN-archive.md`

Twenty passes, all closed: хозяйство (M390–M393), место и люди (M394–M399), тяжёлая игра
(M400–M404), человек (M405–M407) and дело и мир (M408–M409). Design stays in
[`docs/DESIGN-base.md`](docs/DESIGN-base.md) — §51.1 is the struck queue with what each pass
measured and what it deferred, and «Deferred» there is the only remaining base work. The layer's
own craft audit is Almanac **issue V**; `docs/DESIGN-winter.md` is still a separate sketch and still
not part of this queue.

**Read back by another session** (0.409.1): fifteen real faults across M390–M409 and the war
queue, all fixed, pinned by the «разбор …» suites in `tests/91zzzw-base4.js`. The list, the two
rules that outlive it are in §51.2 of `docs/DESIGN-base.md`. The six scene notes from the same
review are closed too (**M413**, 0.410.0) — §51.3 there has the three frame rules they produced.
