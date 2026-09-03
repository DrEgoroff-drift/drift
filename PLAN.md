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
  a safe default in `applySave()` (`14-save`); shape changes ride an `s.v===5` branch.
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation — the model is `tickDrones()` (`12-economy`).
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

## Next — after M300 (0.297.0, 2026-09-02)

M299/M300 built the screens pass (`docs/DESIGN-screens.md`): peek map, you-in-frame, two names,
cantina hotspots, headings (cap 24, `secTidy` on station tabs and the ship screen), lanes, HUD /
toast / console strip under screens, the hauler as a shuttle. Suite `tests/91zzy-screens`.
Left:

1. **§9 walkthrough as a phone acceptance run** after each interface milestone — six steps, the
   test being "no step needs a paragraph on screen".
2. Person cards (M301): HQ manager and crew rows are words first, figures in a `.fig` block. The
   home desk has no section headings, nothing to tidy there. Need/appetite notes are split by
   `secTidy` into head + note; rows there fit one line.

3. ~~System proportions~~ — M315 (0.312.0): bodies and orbits scaled (`SYS_K_*` in `06-galaxy`), the
   ghost click on screens opened by a pad swallowed, §18.8 complete but for the заявка (rung 21).
   Left: the ship keeps its `.55` floor at deep zoom-out and reads larger than a small moon there.

## Loose ends (as of 2026-08-28, after the graphics run 0.237.0–0.244.0)

Everything left open, with the reason it is open. Nothing here is a bug report — bugs are fixed
the day they are found; this is work that was deliberately not done, or that needs the author.

### Needs a decision from the author

- **The cave, and the man's height.** M217 says one height means the same in every mode, and a
  test guards it; that is why the cave camera was not moved closer (M248). If the author decides
  the cave may be an exception, both the rule and the test come off.
- **Drones: choosing where they sell.** Left at "the nearest station" in M237. A route editor is
  micromanagement; the sensible owner of that choice is a manager holding the domain.
- **Drone attrition.** Deliberately absent: a drone breaks and mends but is never lost. The author
  said leave the drones alone; this stays written down rather than done.
- ~~`pair` as a target for natural light~~ — decided 2026-09-03, M308: daylight scenes
  (`LOOK_DAYLIGHT`) print the pair as a reference, without a verdict.
- **Craft plan remainder** (P0–P9, last section of `docs/DESIGN-story-craft.md`; M249–M270 paid
  eight laws of ten). P4 grisaille — a refactor, its own session. P7b the glyph notebook —
  understanding is a state of the head, not a flag; needs the author. P8 the clocks engine — with
  the first Act II ending, earlier it is a perk without code. С5 fatigue — the author's fork: hired
  hands have no figure, so either portraits (the `mgr-face` brushes) or an axis on managers. P9b
  settlement recursion (Eglash) — by eye over many settlements.

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
  a back wall, bones, ropes, tallies, a camp, branch-end finds. Left: the lower lake hall is still
  79% empty by the meter — a vault of 78 over a flat floor; if it needs more, it needs a second
  floor level or a lake that fills the frame, not more props.
- ~~The home's furniture is flat boxes~~ / ~~the house is a formula~~ — M307 (0.304.0). Left: the
  interior is still drawn per frame (nothing baked) — measure with `prof()` before baking; the
  settlement's houses and the wintering hut still draw their own and could take `homePlan`.
- ~~The system view is 66% empty~~ — M309 (0.306.0): nebula with a core and a soft edge,
  shuttles by rung. Still ~80% empty by the meter, and that is space; the next step is the fleet.
- ~~The approach frame is 80% empty and has two tones~~ — M304 gave it two masses and a light
  corridor, M308 a warm horizon by day. Still 72% empty by the meter: sky is sky.
- **Strata run parallel to the terrain** — geology is horizontal and cut by the relief, and that is
  what makes a cliff read as rock rather than as wallpaper.
- **Straight lines where a hand belongs**: the reeds by the water, the cracks in the mine rock.
  Verlet ropes exist now (`18d-verlet`) and the same solver fits the reeds.
- **Boulders are one silhouette scaled** — the rule of origin, unchecked. Measure before rebuilding:
  the plants turned out fine when counted (M246), the boulders may not.
- **Effects not taken yet from the author's list**: curl-noise smoke for the chimney and the
  smelter, heat haze over the nozzles, chromatic aberration on hits, water with reflections (there
  are no water features on the surface at all today — that is a design addition, not a fix).
- **Rectangular seams of the sky layer** were seen on two screenshots (the landing and the night
  ground) and never chased down. Not reproduced since; worth one deliberate hunt.
- **The plants as bodies** (M173 #2, half done — clumping is fixed, the plant body itself is still
  the skin only; the text is in the archive).

### Systems

- **The author's freeze has no cause yet.** The frame guard (M234) survives it and names it on
  screen; the fuzzer (M238) drives eleven modes with random input and finds nothing. The next
  occurrence should carry a `СБОЙ · …` line — that line is the missing evidence.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and its
  body goes to `docs/PLAN-archive.md` in the same commit — done 2026-08-28 (M232–M246) and
  2026-09-02 (M247–M298 and the old queues, 97 → ~40 KB).
- **Push only after a green run.** One push in this session (0.238.0) went out while the base suite
  was flaking once in three runs; caught and fixed immediately after, but the lesson is to keep the
  test run and the push in separate commands.

## Closed 2026-08-28 → 2026-09-02 — one line each; bodies in the archive

Grep `docs/PLAN-archive.md` for the milestone number (header "Moved out of PLAN.md on 2026-09-02").

- **M247–M248** (0.243–0.244) — the home from inside; the cave narrower, with a light of its own.
- **M249–M263** (0.245–0.260) — the craft plan P0–P9: the meter judges masses; the postcard atelier
  over eight places; blue noise under every scene; the direction field `dirAt` (rock grain, flowing
  dust, nebula fibres); the patch stays a seam; drops catch the light; the stranger's lamp casts
  shadows; a turn reads the player's hand; Крапива; signs not letters; lichen grown; the wheel owns
  the world and the CUN table in the cave.
- **M264–M270** (0.261–0.267) — the critique marathon: the dead ДЕЙСТВИЕ button, the sun as a body,
  one orbit one line, strata horizontal, stars stretch on the move, corridor light, CUN in the
  mine, nine deed turns.
- **M282** (0.279.0) — nine wounds from the playtest of 30.08.
- **M285–M288** (0.282–0.285) — a save never kills the flight; the ДЕЛО screen; the cloud `{}`→`[]`
  bug and `asMap`; the desk is a desk; almanac issue II.
- **M289–M297** (0.286–0.294) — the holding in nine steps (see "The holding — built" below).
- **M298** (0.295.0) — three interface fixes: the table answers in the row, rumours with distance,
  jumps and НА КАРТУ, the map card as a footer line.
- **M314** (0.311.0) — fleet tails: трассы on the map (§14), the rescuer's call to a barge in distress, wing tiles, the hospital's cross, larger names.
- **M313** (0.310.0) — the node station «УЗ-1» from rung 25, the black derelict in dangerous empty sectors, the caravan (pirates keep off, fleet pace).
- **M312** (0.309.0) — the whole fleet drawn (thirteen classes), почта, ransom through the hospital at half, the school.
- **M311** (0.308.0) — the fleet's second pass: joints (§8), whiter hulls, сторожевик/паром/плавбаза drawn, буксир/плавбаза/сторожевик services, convoy hides you from pirates.
- **M310** (0.307.0) — ГЛАВТРАССА opens: `12ai-fleet` with thirteen classes and voices, the paint pipeline, почтовик/танкер/буксир drawn, passage by the ladder, позывной and заправка по норме; almanac issue III.
- **M309** (0.306.0) — the system: nebula blots fan out with filaments and a dust lane; shuttles station ↔ planets by rung (`17f-sys-traffic`).
- **M308** (0.305.0) — the approach by day (warm horizon glow on the sun's side), the map band in two value steps, `pair` without a verdict for daylight scenes.
- **M307** (0.304.0) — the home: furniture out of material by a `fillRect` wrapper, the house out of a seeded plan with signs of habitation by tier.
- **M306** (0.303.0) — the station body held against §13 (verdict: holds, ALMANAC addendum II); the planet changes too — dump, dome, strip on the day side (`drawPlanetWorks`).
- **M305** (0.302.0) — the cave as a place: round rock by smoothed marching squares, a back wall with a body, bones/ropes/tally/camp/branch-end finds; `docs/shot.py` for headless frames and meter numbers.
- **M304** (0.301.0) — the picture queue as one release: cave to zone I–II with cold glazes baked into the tile, sky brush and `hueToward`, landing horizon and altitude zenith, home panels/boards/study window, station sprite with one light, base halo, rain on the ground.
- **M303** (0.300.0) — playtest tails of 02.09: the cantina's ВЫСЛУШАТЬ works, station rumours persist as logged, the desk opens over a station (СТОЛ in the header), the home beacon undocks first, the desk lamp ignores grey and ether lines, the parrot's feather layer is sized by the bird box and the perch is off the screens.

## Done

M1–M32 — the base game (see git history). M33 parts and total rig capacity · M34 ship screen with
hull slots Â· M41 WebAudio sound engine Â· M42 generative music with beacons and reverb. Plus the
split into modules and the `build.ps1` build.

**The whole queue below is finished** (July 2026, one milestone per commit):
M43 celestial mechanics and autopilot lead Â· M44 six station types with type-driven tabs Â·
M39 rare resources, gas scooping, smelting Â· M45 hiring, fleet, orders, lazy simulation Â·
M46 wages, debt, morale, repair Â· M37 base in cross-section with power balance Â· M38 base network
and transfer Â· M47 base staff, roles, raids Â· M40 the lab: hull fusion and part crafting Â·
M35 boarding a pirate base on polygons Â· M36 enemy types, consumables, mezzanines.

Descriptions of finished milestones live in [`docs/PLAN-archive.md`](docs/PLAN-archive.md): they
remain documentation of the decisions taken, but sit apart so this file can be read in one go.
Here is only what is still live — cross-cutting rules, the visual queue and the milestone queue.

---

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter — expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---

## Open by design (not defects; each needs the author or a pass of its own)

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
  (0.311.0)**: трассы on the map, the rescuer's call, the drawing tails. Left: 12 заявка (lend a
  hull for one run — needs the crew order model, its own pass); issue III's next look after the
  author has flown past a few of them on `/dev`.

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
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). So the real remaining work is four files, not seven.
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

## To the release

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
  release check.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

## «Зачем лететь» — the one open item of the outside playtest (2026-08-26)

Items 1–4 of that queue are closed (M213, M214, M217, M223) and sit in the archive.

5. **«Зачем лететь» lives inside the station** — **first move made (0.200.0).** The desk already
   remembered every station's prices and shortages and let you do nothing with them: the address sat
   there as two numbers to be memorised by eye. Tapping a price row now lays a course and opens the
   navigator — the same gesture the journal has always had for a job, and the only button it has ever
   had. Nothing appears over the world: no arrow, no marker, the game never asks you to go. The move
   is `gotoSector(sx,sy,what)`, lifted out of `questGoto`, so the next addressed thing on the desk
   gets it free. **And the rest of it done (0.201.0):** the ЦЕНЫ band names a real station live, in flight, and
   hearing it now writes a row on the paper — where yesterday's gesture plots the course. It stays
   hearsay and is guarded as such: only the good actually named plus fuel, marked «со слуха», no
   shortage (that is not broadcast), never overwriting a docked row, and never counted as the best
   price in bold. Once per station per day, and only at a legible signal.

   Original wording: The board (needs, tips, prices) is the game's
   motor and it only runs after landing, docking and switching a tab. **The fix must stay in the
   game's language:** the tester's own strongest praise was «ничто из этого не обращено к
   игроку — и поэтому работает». Quest markers and objective banners would buy the metric and
   sell the game. The receiver already broadcasts prices and rumours — make what it says
   actionable, and let the navigator act on what was overheard. This is also where the author's
   own idea belongs (below).

## First three — built; they turned the present sandbox into Act I

All three organs exist and are guarded (found stale in this list on 27.08.2026 and checked
against `src/` — the queue below is what actually remains):

- ~~**M189 — возможность.**~~ Built: `11ah-offer` — the offer as an entity with a face and a
  silent window, named offers three times richer than cold ones, folk memory as two booleans and
  never a number. Arrives through the counter and the ether, never marked, expires without
  comment. Guarded in `91zzzf-offer`.
- ~~**M190 — игрок как источник слухов.**~~ Built as «ляпнул лишнего» (M194, 0.169.0): what he
  says at a counter travels and comes back days later wearing someone else's face.
- ~~**M191 — тетрадь доброты.**~~ Built: `11ai-ledger` — write-only, never shown anywhere,
  `deedAdd` refuses a deed without a cost, and helping while broke weighs more. Writers already
  live in `11ag-trace` (cargo left at a mark) and `12l-barge` (souls off a dying hull).

## After those, in order

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

# The holding — built (M289–M298, 2026-09-02)

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


## Small tails from almanac issue II

- ~~Target chips against the ether bar~~ — measured since M302 (`91zzy-screens`).
- ~~The 44 px sweep over every screen~~ — written in M302 (`91zzy-screens`), both layouts.
- ~~«В ДОРОГУ» in the five doors~~ — argued on the record 2026-09-03 (`DESIGN-road.md`, Built §4);
  the door stays.

## Decisions taken on the author's behalf, so they are not re-litigated

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
