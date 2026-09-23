<!-- docs/done/done-20.md — part 20 of 30 of the done work, in the order it was written; see README.md -->

## Moved from PLAN.md on 2026-09-11 (review)

Closed sections and decided forks, verbatim as they stood in PLAN.md at 0.443.0.

### Next — after M321 (0.318.0, 2026-09-03)

M299/M300 built the screens pass (`docs/DESIGN-screens.md`); M301 (0.298.0) the person cards;
M321 the §9 walkthrough as `tests/91zzy-walk` (both windows, 200-character block cap after every
step) and the course as a state with «К ЦЕЛИ» in flight. The screens pass is closed. Left here,
in this order (author, 2026-09-03: «сначала по плану, потом это»):

1. ~~The settlement's houses and the wintering hut on `homePlan`~~ — M322 (0.319.0): one
   `housePlan` for both; the wintering has no exterior, nothing to unify there.
2. ~~The plants as bodies (M173 #2)~~ — M323 (0.320.0): the dark mass under every form.
3. ~~Drones choosing where they sell~~ — M324 (0.321.0): the keeper, from the desk's prices.
4. ~~Effects, all of them~~ — M325 (0.322.0): water with reflections, heat haze, chromatic
   aberration on hits, the flare flame live over the bake. **The queue of 2026-09-03 is closed.**

3. ~~System proportions~~ — M315 (0.312.0): bodies and orbits scaled (`SYS_K_*` in `06-galaxy`), the
   ghost click on screens opened by a pad swallowed, §18.8 complete but for the заявка (rung 21).
   ~~Left: the ship keeps its `.55` floor at deep zoom-out~~ — `.35` since M319 (0.316.0).

### Side passes of 2026-09-07 — the author's own asks, built in a worktree beside the base queue

Bodies of the struck entries below moved to `docs/PLAN-archive.md` (2026-09-10, section «Side passes of 2026-09-07») — grep there by milestone.
Numbered past the base queue so the two do not collide; versions are side versions of the last
main release, as M360a/M369b were.

- ~~**M422 the thumb anywhere**~~ — 0.418.0: the author, 07.09.2026 — «управление на мобилке
- ~~**M423 the log told the truth**~~ — 0.419.0: the author, 08.09.2026 — «а посмотри мои логи в
- ~~**M410 one thumb**~~ (0.401.1), ~~**M411 the war on the site**~~ (0.401.3) and ~~**M412 the


- ~~**M431 the bulletin tells a story**~~ - 0.419.3: `src/12an-chron-news.js` (`newsOf`) writes a

- ~~**M432 the ground is painted by its light**~~ - 0.420.0: P4 гризайль, the tenth and last

- ~~**M433 evening arrives: the ground shadows itself**~~ - 0.421.0: P5 of the combined plan,
- ~~**M436 one helm layout**~~ - 0.423.0: the author, 09.09.2026 - «сломал управление… продумай
- ~~**M437 the map answers the hand**~~ - 0.424.0: the author, 09.09.2026 - «смотри шрифт как то

- ~~**M438 the sky stands, the sheet slides**~~ - 0.425.0: rhumbs knotted on your system, 1:1 with the sheet (stays); the band dimmed to .62. Its parallax sky was rejected by the author on 11.09 («к экрану они приклеены») - superseded by the world galaxy, M447.
- ~~**M440 the lab**~~ - 0.427.0: the author, 10.09.2026 - «на сервере штука, которая гоняет тесты и пишет в лог ошибки… не долбилась в одну ошибку». The suites run on the host at night (`lab/lab.sh`, `lab.yml`), one Chrome at a time under 500 MB, with a keyed error log that counts instead of repeating and a fuzz hunt that stops itself; page at https://drift-game.ru/lab/. Design and measurements: `docs/LAB.md`.

### The lab, first night (session 20260909-235848, 0.427.0, 178 min, 127 runs)

What lies where: the log at https://drift-game.ru/lab/errors.txt (11 open keys), the page at
https://drift-game.ru/lab/, raw `runs.jsonl`/`errors.json`/`state.json` in `~/drift-data/lab/`
on the host (`ssh drift`), the laptop's copy of the session log in `lab/session.log`. The
findings, sorted by what they are:

- **Real reds — all three fixed by 0.427.2.** «база M391: воздух и вода» measured with the weather on
  (0.427.1); «полный трюм» was the ceramic-armour gift climbing over a worn hull's ceiling; «свет:
  звезда — самое светлое» was a cumulus over the disc — the suite now measures through the new
  `CLOUDS_OFF` door, and the bisect found a gas giant painted brighter than its red star on the way.
- **OOM at the host's 768 MB, not game bugs** — the phone window dies inside «сквозной: в тексте
  игры нет undefined», the tall window inside «шахта: та же мерка»; heavy «двери» and «устаревшая
  кнопка» die alone; the fuzzer dies on 9 of 65 seeds (each green seed ~103 s and 700–768 MB).
  All are `getImageData`-heavy. Solo runs of the first three are automatic now; done in 0.427.2: the fuzz
  timeout is 150 s and OOM/timeouts carry class `host`. Still open: the fuzzer's OOMs
  cost 300 s each — M446 lowers its timeout to 150 s, tries `--renderer-process-limit=1` /
  `--disable-dev-shm-usage`, and classes OOM/timeout as `host` so they do not sit in the table
  with game bugs. Whether the raster these suites hold is *needed* is a question for the oven
  net (`91zzzzy-bake`), not for the lab.
- **The hunt** — 65 seeds, 0 game failures, streak 3 of 5; every seed is a new path (M339), so
  the fuzzer as it stands finds nothing on 0.427.0 — the detectors of M443 are what will make the
  same seeds informative.

### Needs a decision from the author

- ~~The cave, and the man's height~~ — author, 2026-09-03: «нормас, оставляем». One height in
- ~~Drones: choosing where they sell~~ — M324 (0.321.0): the keeper's «авто-сбыт» reads the
- **Drone attrition.** Deliberately absent: a drone breaks and mends but is never lost. The author
  said leave the drones alone; this stays written down rather than done.
- ~~`pair` as a target for natural light~~ — decided 2026-09-03, M308: daylight scenes
- **Craft plan remainder** (P0–P9, last section of `docs/DESIGN-story-craft.md`; M249–M270 paid
  eight laws of ten). P4 grisaille — a fork, see below. P7b the glyph notebook —
  understanding is a state of the head, not a flag; needs the author. ~~P8 the clocks engine~~ —
  **built, M416 (0.412.0)**: `11d-clocks` is the doorman its contract describes, and wiring it
  found that part VI's «Вы просто не тянете» had no window at all — three shut doors and nothing
  else, i.e. it could arrive in a first evening. Page in `docs/DESIGN-arc.md`. С5 fatigue — the author's fork: hired
  hands have no figure, so either portraits (the `mgr-face` brushes) or an axis on managers. P9b
  settlement recursion (Eglash) — by eye over many settlements.
  **P4 grisaille — spelled out by the author 2026-09-05, built and measured 2026-09-07, then
  reverted: it is a fork of intent, not a refactor.** The glaze gives the whole cross-section
  real light (sky-coloured shadow, star-coloured light) instead of today's constants, and in
  exchange the ground takes its hue from the light rather than from the world's palette ramp —
  a terran world goes olive → terracotta. That is the author's call, so nothing was committed.
  The spec, the nine irreducible hue events, why composites and not a LUT on this engine, the
  numbers, the hour-long path to redo it and **the measuring trap that cost half the session**
  (the sky calendar runs on the wall clock — pin it before any A/B of a daylight scene) are all
  in `docs/DESIGN-craft.md` § «P4 гризайль».

### Picture queue — built as M304 (0.301.0, 2026-09-03)

All seven items of the 2026-09-02 order shipped in one release; bodies in `PATCHNOTES.md` 0.301.0.
What the meter still says after it (lookAll, 1280×800, 10 frames):

| scene | tones | pair | contrast | mass | note |
|---|---|---|---|---|---|
| пещера | 3 | 6 | .35 | 21 | mass and contrast pass; pair/tones are the honest shortfall of a cave |
| грунт день | — | <10 | — | — | pair still short: the disc is the only second hue |
| заход | 3 | 0 | .27–.31 | 42–49 | two masses now; a terran world at altitude has no warm source |
| дом | 3 | 4 | — | — | one cold pool per window is not yet a pair |
| система | 8 | 25 | .20 | 4 | the station body is measured against a nebula; see «Open by design» |

Left from the queue: nothing — the band's second step is M308, the station's codex pass M306.

### Graphics still open

- ~~The cave is 83% empty~~ / ~~the cave's outline is a cell grid~~ — M305 (0.302.0): round rock,
- ~~The home's furniture is flat boxes~~ / ~~the house is a formula~~ — M307 (0.304.0). ~~The
- ~~The system view is 66% empty~~ — M309 (0.306.0): nebula with a core and a soft edge,
- ~~The approach frame is 80% empty and has two tones~~ — M304 gave it two masses and a light
- ~~Strata run parallel to the terrain~~ — was already paid by M267 (datum + relief cuts); the
- ~~Straight lines where a hand belongs~~ — the mine cracks go by hand since M316 (0.313.0). The
- ~~Boulders are one silhouette scaled~~ — measured in M316: polygons were already individual, the
- ~~**Effects from the author's list**~~ — all taken: smoke (M320), and water, heat haze,
- ~~**Rectangular seams of the sky layer**~~ — hunted 2026-09-03 (M320): a column/row step
- ~~The plants as bodies~~ — M323 (0.320.0): two passes in `drawPlant`, the dark mass first.

### Systems

- **The author's freeze has no cause yet.** The frame guard (M234) survives it and names it on
  screen; the fuzzer (M238) drives eleven modes with random input and finds nothing. **0.359.1: the logger is born first** (`01a-crashlog`, right after `VER`), so a build that dies on load reports itself — 0.359.0 did not, and the site lay for 25 minutes with an empty log. **Since
  0.359.0 the evidence ships itself:** every error of any kind, and every frame stall over two
  seconds, lands in `~/drift-data/crash.log` (`site/log.php`, PATCHNOTES 0.359.0).
  **Read 2026-09-07 (M417): 70 of 78 entries were the log's own noise** — a consensus alarm
  false by construction (PHP int/string key cast in `site/war.php`, reported with proof to its
  owner), a hidden tab filed as an 11.7-minute freeze, and an fps pulse sending `Infinity` since
  the day it shipped. All fixed or reported. **Lead chased and closed the same night (M418,
  0.414.0):** the bake is `planetMat` — **383 ms in one block**, measured in a real browser, i.e.
  two to three seconds on a phone. Now sliced across frames, worst slice 6.2 ms. **The freeze item
  is closed until the log shows a new one**.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and its
  body goes to `docs/PLAN-archive.md` in the same commit — done 2026-08-28 (M232–M246) and
  2026-09-02 (M247–M298 and the old queues, 97 → ~40 KB).
- ~~One order-dependent phone assertion~~ — chased and closed by M354 (0.352.0). It was two things
- **Tests: three tiers since 0.359.3, and the run splits since 0.426.0** — `test.ps1` = Node logic
  (325 suites, ~5 s) + one Chrome smoke; `-Browser` picture/interface; `-Full` everything.
  `-Jobs N` runs the corpus in N Chromes at once, `-Times` prints the thirty slowest suites on a
  real clock, `-Probe` calls the four «проба · …» stands (they print economy numbers and assert
  nothing, so an ordinary run leaves them alone). Runner: Node + smoke, then the live-site check.
  Loose end: a pixel-fidelity net for the browser tier (reference scenes, three sizes) is the one
  thing that would have caught the perch and «РАКЕТА 0» — not built.
- **Running in parts is also a test of the tests.** The first `-Jobs 8` run turned three suites red
  that a single run had shown green for months: the isolation net cleaned `G` but not the page
  (an open `.scr`, a body mode class) nor the station's own globals (`tab`, `stGroup`, `tableTab`),
  and one station assertion had been passing only because the previous suite happened to leave the
  station on the ДОСКА tab. All four are fixed in 0.426.0. Loose end: nothing yet names the suite
  that leaves the page dirty — the failure still surfaces on its neighbour. A per-suite check
  after `fn()` («no screen left open, no mode class, no key held») would name the culprit; not
  built, and it will find work when it is.
- **Tests: two tiers since 0.359.3** — `test.ps1` fast (~25 s), `-Full` everything; the runner runs full
  and then asks the live site (`data-alive`). Loose end: in the pane at 1280×800 «свет: звезда самое светлое»
  went red on Нейэль I (0.694 vs 0.536) while headless is green — window-dependent, worth one look.
- **The run costs what it draws, and the top ten suites are three quarters of it.** Measured
  2026-09-09 with the switch that now exists — `test.ps1 -Full -Times` (real clock; under
  `--virtual-time-budget` every suite reports 0 ms, which is why the tier list had been kept from
  memory for a year). 280 s over 807 suites: the ten dearest are 205 s of it, the five dearest
  are 139 s, and 400 suites do not reach a millisecond. **The cost is `drawWorld()`, not scene
  set-up** — the older note here guessed set-up and guessed wrong. The doors matrix is 221 cells
  × 3 draws, the oven family 1 760 draws, the fuzzer 544, the reference-frame suite 680: some
  3 600 full frames at ~40 ms each in software rasterisation. Hence the three levers, in the
  order they pay: (1) `--disable-gpu` dropped from `test.ps1` — headless Chrome takes the real
  card and the dearest suite goes 49 s → 17 s; (2) `-Jobs N` splits the corpus across N Chromes
  (`?shard=i/N`, heavy and light dealt round-robin apart); (3) cutting waste inside suites —
  `settle()` asks the oven whether it is done instead of spending forty frames on hope.
- **Push only after a green run.** One push in this session (0.238.0) went out while the base suite
  was flaking once in three runs; caught and fixed immediately after, but the lesson is to keep the
  test run and the push in separate commands.

### Open by design (not defects; each needs the author or a pass of its own)

- **The fleet — ГЛАВТРАССА** (author, 2026-09-02: «флот запиши в беклог»). Ships that cannot be
  bought: a directorate on the model of Главсевморпуть, thirteen classes off real Soviet donors
  (Союз, Прогресс, Протон, the nuclear tug, Энергия, the seven, Буран as the ferry, Спираль+Алмаз,
  Луна-9, ТКС, Восток×6, Салют, Мир), a truss node station at Узел трасс (25), a silent black
  derelict, twelve interactions none of which is a shop, the fleet as the visible reward of the
  ladder. All of it is in [`docs/DESIGN-holding.md`](docs/DESIGN-holding.md) §18, held against
  the craft codex in §18.6. **Open before a line is drawn:** fork 4 of
  [`docs/CRITIQUE-holding.md`](docs/CRITIQUE-holding.md) — the names (the 08-31 text uses real
  ISS/«Мир» module names, «МКС» and «Полюс»; the critique asks for our own: Короб, Кубрик,
  Воротник…, a call-sign for the node, no name for the derelict); the refuelling «под расписку»
  rewritten without a book of debt; «груз в попутную» struck. Estimate from the critique: one
  class plus the paint pipeline 2–3 sessions, each next class 1–1.5, the interactions 6–10; the
  order of drawing is §18.9, the first meeting the почтовик. **Opened as M310 (0.307.0)**: names
  settled, three classes drawn, the line, позывной and the norm. **M311 (0.308.0)**: joints, whiter
  hulls, сторожевик/паром/плавбаза, services 4/7/10. **M312 (0.309.0)**: the last seven classes,
  почта, госпитальное, учебное. **M313 (0.310.0)**: «УЗ-1», the derelict, the caravan. **M314
  (0.311.0)**: трассы on the map, the rescuer's call, the drawing tails. ~~Left: 12 заявка (lend a
  hull for one run)~~ — struck by the author 2026-09-05: in play it is two buttons and a
  journal line; §18 closes on eleven interactions.
  **The in-play look is done** — almanac issue III, addendum 0.313.0: fourteen frames
  (`docs/shots/f_*.png`, hold scene), measured off the baked sprite and the canvas, held against
  the craft codex law by law. **Palette settled by the author 2026-09-03** («цвет да пусть будут
  светло серые с красными полосами эмблемами, норм»): light grey hulls, red bands and emblems,
  nothing else — so a class is never told apart by tinting it, and §11/§16 are paid inside the
  greys. The work the issue ordered, cheapest first — **all six paid by M317 (0.314.0)**: the
  label from the body's radius and off the chips, the scale to the zoom ceiling, the учебное's
  spine, the паром's wing, the greys a step down with the light reaching the body, and the emblem
  grammar (`fleetGlyph`, thirteen roundels in one construction). Numbers in the 0.314.0 addendum
  of almanac III. **M318 (0.315.0)** paid the last two: §5 (shadow strips under strap-on parts,
  the рефрижератор's corrugation) and §14 (the трасса as a chain to two nearest neighbours,
  judged on a staged chart). Issue III has no open law; the fleet has no remainder (the заявка struck 2026-09-05).
  §14 (трассы on the map) judged 2026-09-05 (0.350.2) on a staged chart with every station at rung 6:
  chain, ticks and band hold; beyond the jump edge they now dim to a third (the darkness law).

- **The road companion** (author, 2026-08-23): phone mode where a real car trip flies your ship —
  GPS speed extrapolated to cosmic, accelerometer banks the hull, mic-driven equalizer, real
  distance → a capped in-game bonus synced through the site accounts. Captured in
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md); needs its own pass and the author's answers
  (reward resource, cap, in-game vs separate page).
- **Factions as a language of shapes**: closed (0.109.0) — `17d-house-shapes`: a mark per house on the station and the settlement wall, pennant in the house colour.
- **Base "like Fallout Shelter"**: it is one; what differs is a question for the author.
- **Yacht railing below 3×, fully flat-on view** (archive, ships): the fleet is drawn flat-on by
  design; the hull now has a top light and one asymmetric boom, the rest is the reference-sheet
  richness a rotation pass would give.
- **M124 spec remainder — CLOSED whole (author, 2026-08-27: «сейчас того что есть достаточно»).**
  Receiver with a knob — 0.110.0; "pause is the engine off" — closed by fact. The two held-back
  halves are now decided, not deferred: **the removal of the overlay HUD is superseded** by the
  author's own M187 (0.160.0, «приборы сверху, сейчас очень плохо не видно» — instruments must be
  visible and readable, the opposite of removing them); **the paper language stops at the desk** —
  A3 (0.144.0) made the table paper and things objects, the station screens stay glass by the
  author's call. Do not re-open either without him.
- **M125**: rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation — cosmetic; the rack is not persisted by rule.
- **M126**: the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table
  (the hundred owns per-person talk).
- **M127**: a pirate hit can now knock a socket; instruments as loot beyond that waits for the
  spec's "lost" pass.
- **M132**: edge generator and hand-built cores per region, surface layer masks — each region's
  own milestone (M135+).
- **M131**: barge passenger as a channel, settlement glyph overrides, per-region colouring — left
  open in the hundred's design.
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). **Paid again — M415 (0.411.0):** `12ai-fleet` 58 → 27 + `12ai1-fleet-art`, `26-ui-station` 67 → 41 + `26e-ui-station-trade`, `21e-surface-draw` 60 → 18 + `21e1-surface-world`, `14-save` 70 → 44 + `14a1-save-rest` (`applySave` splits in exactly one place, where no local crosses). The size table in `build.ps1` was retaken the same day — it had drifted to shouting thirteen names a build, which is the same as shouting none. Left: `21e1-surface-world` 43 KB is one 590-line function and its own seams are named in the table; `12y-parrot-face` and `12ud-smena-text` are single tables and stay.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: **closed by measurement (2026-08-24, 0.133.0).** The game now carries its own probe:
  `?g11` runs the mode tour and measures rAF fps in a visible tab (`28z-fps-probe`), `?g11=deep`
  noops draw passes one at a time with paired baselines. Clean run (single fresh-profile Chrome,
  `--force-device-scale-factor=2`, anti-throttling flags, dpr 2, warm cruise after 4 s settle):
  system 56, belt 60, surface(jungle) 55, dig 60, cave 60, landing 52, scoop 47–60 across runs.
  No mode is solidly <50, so the 20-life sprite bake is not justified — matching the earlier JS
  read. The scary first read (system 46, surface 44) was the **cold start while chunks bake**,
  not cruise. Deep pass: no single pass dominates (paired deltas ≤+2, only `drawBuilt` +8 ≈ 2 ms).
  Measurement discipline learned: leftover probe windows with anti-throttling flags keep rendering
  when occluded and sink every later run to ~22 fps flat — kill them before measuring.
- **M112**: nothing else — belt missiles and the hull mark closed it.
- **M135 "three lights"**: built (0.101.0). **M136-hours**: built (0.102.0). **M137-glow**: built (0.103.0). **M138-grove**: built (0.104.0). **M139-keepers**: built (0.105.0). **M140–M142**: built (0.106.0). **M143–M151**: built (0.107.0–0.108.0) — the thirteenth pass is closed. Next: the tails ledger (factions as a language of shapes; M124 remainder), then the split debt, then G11.

---

### To the release

- **The newcomer's first hour** — **first pass done (0.185.0, M207).** The walkthrough is
  `docs/DESIGN-first-hour.md`, measured in the running game. Worst finding: the suit and the fuel
  are countdowns that kill and **neither was ever named** — the bars are drawn and silent. Fixed by
  `11ao-firsthour` (suite `91zzzs-first`): four lines in the ether, each once per save and tied to
  an occasion, said by people and never by the game. No arrows, no modals, no tutorial flag.

  **Second pass done (0.192.0, M212)** — the hour AFTER the opening, walked; findings and
  non-findings in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md). Three fixes: every
  overflowing list now shows that it continues (`27m-scroll-cue` — measured: the board is 1229 px in
  a 407 px window, the cantina 2086 in 408, and nothing said so); the hire screen stopped arguing
  with itself (`xp` was `Math.floor(r()*40)`, bound to nothing, so «неопытен · опыт 22» stood beside
  «ветеран · опыт 7» — it now follows the traits it is printed next to); and ФОТО stopped hanging
  over open screens, a one-day-old regression from M208 widening the camera to flight.

  **Closed by M299 (0.296.0):** the board's sections on a first dock are now three lanes with a
  fold at seven per lane, and every heading is capped at 24 characters (`boardLanes`, `secTidy`). The landing prompt
  offering «СКАНИРОВАТЬ ОРГАНИЗМ» beside twenty-two deposits was checked and is **not** a priority
  bug — `dep` is tested before `plant`; it only happens when no deposit is within reach and a plant
  is. The station's group row can fall out of step with its tab if future code sets `tab` without
  calling `syncTabs()` — reached by the map peek's way back (M299) and closed in M302: `mapBack` syncs.
  The third hour was walked in M215 (0.197.0): the same contradiction came back through
  `stationMercs` (reputation stamped `xp` over the traits), and a newcomer paid for a hand before
  learning he needs a hull of his own. **Its back half was walked too and is healthy:** a trip closes
  in ~9 min of real time, the journal names every event as it happens, and the *"he loses money, is
  he broken?"* reading does not survive contact — the journal shows where the profit lives (a
  salvaged part, a trophy hull) while it happens. Caution for the next walker: `crewTick` runs on the
  **wall clock**, not `G.t`; stub `Date.now` and set `c.tMs` to the fake now, or the hand silently
  stops and it looks exactly like "crew events never reach the journal" (they do, all sixteen).
  **The fourth hour was walked too, 27.08.2026, and the screen is healthy:** two managers at their
  consoles with their domain boards («ЗВЕНО 0/0», «ПЛЕЧ 0/2 — маршрут не собран»), a portrait card
  with level, loyalty, cut and salary, and a header that answers the newcomer's fear outright —
  «оклады 134 кр/мин — из долей доменов, не из вашей кассы». What was broken was the STAND: `hqfull`
  called `mgrHire(mgrRoll(…))`, neither of which exists, wrapped in a `typeof` guard that swallowed
  it — so it had been rendering the empty HQ, the same picture as `?s=hq`. Two more of the same were
  found and fixed (`crewPool`/`crewHire` in `?s=hire`, `cockpitOn` in `?s=cockpit`); the lesson is
  in CLAUDE.md.
- ~~**v:5**~~ — **done without burning anyone (M227, 0.212.0).** The game writes `v:5` and reads
  4 and 5; not one save is lost, local or cloud. Investigating the feared gate found it was a
  ghost: `server.js:95`/`worker.js:66` do not exist — the cloud is `site/api.php` and it checks
  only that `v` is present. The `v:4` legacy branches stay alive under their number; future
  release-look changes to the SHAPE of persisted fields ride `s.v===5` branches. **The last of
  the overlay** — closed with the release look itself (author, 2026-08-27): see the M124 note
  above. What exists is the release look.
- ~~**A clean performance measurement**~~ — passing at 0.213.0 (27.08.2026, machine quiet, one
  window, dpr 2): **60 fps in all nine modes** with every change of the day in — the world scale,
  the UI zoom, the soil profile, the relays, the splits. Earlier same-day dips were the busy
  machine, proven by measuring the committed build. Re-run once more at the actual release as the
  release check. Author, 2026-09-05: «60 — хрен с ним, потом»; not before the release itself.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

### After those, in order

Act II (the first real loss, by his own hand, everyone kind about it) → the offers deepening
through the expedition → Act IV (doors closed, the world still offering, nobody left to vouch) →
the yacht last, because an ending cannot be built before the middle.

**The first move into Act II is made (M225, 0.210.0): the three squanders now all exist.**
«Ляпнул лишнего» was built as M194; `11aq-late` adds the other two. Staying at the counter is a
real choice that buys something real — a line that exists nowhere else, occasionally a *named*
offer («некоторые вещи говорят только поздно и только там») — and it costs real hours: `G.t`
jumps, and every window in the game (offers, shifts, needs, the sky's calendar) ages silently.
The wrong person costs an hour and ten and gives exactly nothing but the conversation itself,
and nobody is ever angry. Three sits per shift, then the counter empties — the only refusal the
place ever makes. Guards in `91zzzx-late`: the hours are real, the offer windows narrow, the
journal contains no reproach, and a save does not refill the counter.

**And the loss arrives by the human line (M226, 0.211.0).** When a named offer dies untaken the
door already closed silently; now, one visit later, the person who used to name you says one kind
line at the counter — ahead of the queue, ahead of story, once per door, ever — and never names
you again. The truth is not in the line; the world keeps offering cold. «Никто не сердится — вот
что тяжелее всего.» **And the offers deepen through the expedition (M229, 0.214.0):** for the
circular's sixty days the counter lives for the column («плечо в колонну», paying half again and
feeding the station's collection), naming runs at .70 instead of .45 — closed doors stay closed —
and the deepest access of the act is «имя в список», paying nothing and turning the departure's
greeting into «ЕСТЬ МЕСТО · ВАС НАЗЫВАЛИ». **Act IV is audible (M230, 0.215.0):** at three shut
doors the queue sometimes names somebody who is not you, and once per game one man says «Вы просто
не тянете» to your face — and the game confirms him with nothing, because he is wrong. **And the
yacht is built (M231, 0.216.0): the arc is complete end to end.** After a year of this life, with
a home to have a pier at and the invisible ledger full of what nobody counted, «Тихоня» stands at
your pier — key in the lock, no note, no price, no sale path, no word ever about why. The truth
is not spoken anywhere, and `91zzzf-offer` guards exactly that.

### The holding — built (M289–M298, 2026-09-02)

Design in `docs/DESIGN-holding.md` (§19 is the queue; numbers in §4, §9, §10, §16); why in
`docs/CRITIQUE-holding.md` (37 findings). Forks settled by the author on 2026-09-02: **1(б)** the
+X% surcharge stays and the share is never paid for surcharged units; **2(б)** the ПЕРЕПЛАВКА
recipes go; **3(б)** all 82 buildings and 48 materials designed at once with numbers; **4** the
fleet later (see "Open by design"). All nine steps shipped, one version each: the route as an
order (`12r-route`), «БЕРЁТ» (`12ab-hold`), site/hopper/`BLD` A–D (`12ac-bld`, `12ad-site`,
`26c-ui-station-site`), the ladder (`12ae-ladder`), the `91zzw` measurement, the own barge
(`12af-barge`), families E–I through `bldHas` (`12ag-holdfx`), the station body's first pass
(`17e-station-body`), news/rumours/rival barges (`12ah-holdnews`).

**Still open:** ~~the codex pass over the station body~~ — M306 (0.303.0): verdict holds, the
planet's dump/dome/strip drawn. Deeds with no counter yet (pirate bases boarded,
monuments, nodes) join the rung score when their hooks are written.

### Small tails from almanac issue II

- ~~Target chips against the ether bar~~ — measured since M302 (`91zzy-screens`).
- ~~The 44 px sweep over every screen~~ — written in M302 (`91zzy-screens`), both layouts.
- ~~«В ДОРОГУ» in the five doors~~ — argued on the record 2026-09-03 (`DESIGN-road.md`, Built §4);
  the door stays.

## Moved from PLAN.md on 2026-09-12 (release 0.446.0)

### Review block of 12.09 — R0 picket «Коммуна» and R1 cue and ДЕЙСТВИЕ (ee24e4b, ab71cfb, dff8f77, 2c63e9f)

  - **Handoff (paused by the author 12.09):** R1 done. R0 holes (1)-(3) fixed in the last WIP: the
    hail window is over every screen (z 24), `H.t` stands and no new hail starts under a screen
    (`worldCovered()`, 08-state), fire at the player pauses there (`roleFire` for `!p.iff`,
    `pirateArmTick`), `hailHold()` = 900 on a phone, chips dim and stop taking taps under the hail
    and SOS windows. Missiles already in flight still land. Open: Контроль wants the hail to wait
    under the SOS window too (`sosopen` in `worldCovered` or in `hailTick`). Next: dev look at R0, then R2.
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
  - [x] **R1 cue and ДЕЙСТВИЕ**: an equal ACT keeps the first writer unless the first line names the
    same object (`cueSameOffer`); the hail before the station/belt/base; `_probeAt` lives one frame
    (B1); every interactor (17-mode-system, 12ai, 12l, 17b, 11ap, 12as, 13d) acts only through
    `if(cue(..)&&actEdge)`. Tests: «belt ring by a planet: prompt = action», «hail at the pad», «a
    foreign ACT on screen: tanker and hurt ship do not take the tap»; the M311/M312 fleet suites
    now start each call with `cueReset()` (one call = one frame).

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
