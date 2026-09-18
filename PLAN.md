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

- **New lore rides existing channels (author 2026-09-04).** No encyclopedia, ever: «куска лора не
  существует, у каждого есть полезная выдача» (`12q`). A milestone that brings lore names its channel
  first — desk (ТЕТРАДЬ, КНИЖКА, ПОЛКА, ОТЧЁТ, ВЕЩИ, ДНЕВНИК, ПОЧТА/QSL/АЛЬБОМ) or world (rumours `11t`,
  speech `11b`, retelling `12p`, the wall, the ledger, the trace, the first hour, the hundred stories).
- **No parallax on the map (M447, author 11.09.2026).** A map layer is either in the world -
  moves 1:1 with the sheet and scales with the zoom - or it is paper - does not move and carries
  no recognisable object. Map stars do not twinkle. Why and how: `docs/DESIGN-galaxy.md` §1-2.

## How a frame is judged (M241) — `look()`/`lookAll()` print five numbers per frame against
`LOOK_TARGET` (pair ≥ 15, mass ≥ 14, edge ≤ 18, contrast ≥ .30, tones ≥ 5); the table and the five passes
for a thing: `docs/DESIGN-craft.md`, «How a frame is judged» (moved 2026-09-14).

## WORKING PLAN — everything open, in the order it is done (2026-09-14)

**How a session starts:** read this file whole; open the section named at the item you are on
(`docs/DESIGN-*.md §n`); measure before touching (the item names its meter); build; look on
`dev.html` at 390×844; commit locally; strike the item here and move its body to the archive in the
same commit. Policy of 11.09 holds: fix without tests, local commits, the whole run (-Full,
-Mobile, -Mutants) only before a push. Stages 0–1 are authorised by the 13.09 playtest; **stages
2–6 start on the author's word** («пока только в план пиши», 14.09). Where an item and a design
document differ, **`docs/DESIGN-review-2026-09-14.md` wins** — the items below are already written
after that critique. The author's
rules from the phone playtest bind every item: a screen never loses its scroll; every screen
answers «чтобы что?» before it is redesigned; optimise without losing quality; the ship stays under
the finger. **Verified against the code of 0.449.0 on 14.09** (four scans, the doubtful ones read by
hand): every item below is absent or partial in `src/`; found already done and struck — the `.gz` cache
headers (`site/.htaccess`: `FileETag MTime Size` + `Cache-Control` on all three `.gz` blocks) and the
PATCHNOTES trim (oldest entry 0.400.0, `docs/PATCHNOTES-archive.md` exists); found partly built and
rewritten — Д4 (the ИИ-ядро exists), Д14 (the blockade exists); a name collision fixed — `G.plan` is the
industrial plan (`11r-plan`), the blueprint is `G.draft`.

### NEXT — the order after 18.09 (Control's handover; the team of three was closed by the author)

State of `helm-layout` (C:\Claude\drift-work): local commits only, nothing pushed; node 16 352 / 0,
browser 18 080 / 0. The single question behind everything: **smooth flight on the phone**
(author: «на тел дергается все прогоны … плавный полет нужен»). Measured and settled: with the stick
under the finger 80–83 % of frames make the 16.7 ms deadline, without it 99–100 %, at ×1.5 94–97 %;
our JS is 6–8 ms, the deadline is lost in the RASTER. In this order:

1. **Measure the hull bake on the phone** (51a0824, dc67a87) — bake on vs off
   (`G.opts.gfx.hullBake=0`), by the protocol below. It is the only number that says whether baking
   helps; nothing after this step is decided without it. Phone: the author allowed testing any time;
   on 18.09 only `192.168.1.52:5555` answered (unauthorized until «Разрешить» on its screen), the S23
   needs «Беспроводная отладка» switched on to appear in `adb mdns services`.
2. **The author's call on ×1.5 in flight** — the switch is built and OFF (`c7556b7`,
   `G.opts.gfx.resByMode`). Its real price, from real frames (not the withdrawn simulation): the sky a
   quarter darker (nebula and faint glow); the trail line and the one-pixel stars hold.
3. **If the bake helps — bake the rest by the same rule** (GOTCHAS: bake what fills its box, never
   slivers): the other modes' still bodies (station, landing, belt), checked with the Designer's
   caller breakdown (`layers.js`). If it does not help — stop baking and say so here.
4. ~~**g11 on the laptop**~~ — run 18.09 by Control, headless ×2, two runs per build:
   | build | system | belt | landing | surface | the rest |
   |---|---|---|---|---|---|
   | main f68f5a8 | 46 · 44 | 60 · 58 | 32 · 32 | 26 · 24 | 55–60 |
   | HEAD, hull bake off | 54 · 43 | 60 · 57 | 32 · 32 | 27 · 24 | 49–60 |
   | HEAD, hull bake on | 44 · 60 | 49 · 57 | 25 · 23 | 26 · 25 | 59–60 |
   **The gate (≥ 55 in every mode) fails in LANDING and SURFACE, and it failed before the evening
   started** — main gives the same 32 and 24–26, so this is old, not a regression. The laptop's noise
   (system 43–60 on one build) is too large to judge the hull bake; that is the phone's job. The
   next frame work after the phone number: what eats landing and surface (the Designer's
   `layers.js` breakdown there, as was done for the system).
5. **Frame acceptance of the baked star core and hull** against the Designer's four risks: the
   star's pulsation and corona, the ship's lights and nozzles, a step at the baked picture's edge, a
   one-frame lag of the baked picture in rotation. Control's side-by-side at ×2 found none; a frame
   from the phone is still owed.
6. **Tails at ×2.40 for the author's «куцые хвосты»** — filmed on the phone (headless hangs after a
   few dozen thrust frames and cannot film them).
7. **Split `src/16a-space.js`** (item 0.4) — the sprite oven apart from what it bakes.
8. **Release** (Control): `test.ps1 -Accept` for goldens (the hull and the star changed pixels),
   `-Full`, `-Mobile`, `-Mutants`, the Node tier, PATCHNOTES lines, push, md5 of the three site files
   after deploy.

Findings of 17–18.09 not recorded elsewhere:
- **Law of the frame for any cut or bake (Designer):** protect the thin trail line, the one-pixel
  stars and the depth of the void (the nebula's glow). The ribbon only with a frame in hand — cut the
  thread's thickness, never its length.
- **Designer's instruments** (her scratchpad `…\9711c220-…\scratchpad`): `skips.py <video>` — share
  of double movement steps, per-second profile, a frame at each skip, counted from OUTSIDE the game;
  `layers.js` — the frame's calls and painted area by caller; `dpruthor_sheet2.png` — the sheet for
  the author from real frames (`author_sheet.png` is the withdrawn simulation, never show it).
- ~~**Scoop mode passed bank as lvl**~~ — fixed (Control, 18.09): the 4th argument of `drawHull` is
  `lvl`, so the scoop's flame grew on the climb and shrank on the dive. First note here was wrong:
  the scoop is a SIDE view and `S.bank` is pitch (already applied by `rotate`), so passing it as
  roll would squash the silhouette. Now `lvl=G.mods.engine`, roll 0 — the same flame as in the
  system. Look at the frame in the release pass.
- **ОПИСЬ drag, the path not taken:** the lifted item falls off the finger at the browser's
  touch-scroll threshold (~16–24 px). `preventDefault` on pointermove made it worse (f04f78a,
  reverted e2804dc); a manual `scrollTop` loses to the browser's inertia. The way when it is taken up:
  a narrow grab handle with `touch-action:none` from the start.
- **Cadence protocol (Tester):** real S23 over Wi-Fi adb, one tab, the stick confirmed alive; record
  the conditions — zoom, open screens, hold contents, fleet ships in frame, prompt text, thrust,
  thermal, minutes since open; first line of the report is frames-with-stick; three 30 s runs, the
  first thrown away (the phone's first minute lies); judge by the share of late frames and the
  interval histogram, never by the average fps. A run without a living stick is rejected.

### Stage 0 — THE FRAME FIRST (author 14.09: «разрыв кадров, дёрганье — это первым»)

Numbers: `docs/PLAYTEST-2026-09-13.md` §2.1, §6. Meter: `docs/night-2026-09-13/raw/phone-tools/trace.py`
on the S23 (390×844, DPR 2.625, 120 Hz) before, after every item, at the end; `g11` on the laptop.
Rule 3: same look, cheaper work.
- [x] **0.3 Layout reads — DONE by its own meter, and it did not move the cadence.** Reads in the
  frame went from 6.3 a frame to 0.31 after three fixes (the fleet label and the helm lift reading
  raw, the brake button fighting the helm-hide row every frame, and the six-node observer watching
  style with subtree so every gauge's own width dirtied the cache). Mutations fell fifty-fold,
  rectsDirty 62 → 11 per 600 frames. **And the cadence under steering did not budge: 80–84 % on every
  build of the last ten commits.** Said plainly so nobody re-litigates it: the item is a clean win on
  its own measure and pure code hygiene in effect — the deadline is missed in the raster, not in our
  JS, which measures 6–8 ms against 16.7. The evening's other lesson is in GOTCHAS: the phone's first
  minute is inflated (92.8 % rested, 83.7 % after a minute idle, 78.5 % on a fresh reload, thermal 1
  throughout), so throw the first run away and judge by the last two of three.
  **Final number of the evening, rig fixed (8a6d001, real S23, three counted 30 s runs, the helm
  alive in all three):** cadence 83.0 / 81.0 / 80.3 %, frames over 24 ms 262 / 288 / 296, fps 51.2 /
  50.4 / 50.1 — a spread of one and a half points. Reference points from the same rig: no helm
  99–100 %, ×1.5 with the helm 94–97 %, RES_AUTO holds 2 even after ten minutes, thermal never above
  2. **Rig rule now enforced in the harness:** a run in which the helm never got born is rejected and
  re-shot automatically — such runs used to report a glorious 99 % and mislead everyone, including
  the Tester. Stage 0's gate at full resolution is not taken and did not come closer all evening; the
  only thing that takes it is the author's call on ×1.5.
- [x] **0.5 Tester's queue, closed by Control 18.09** — (1) the Node DOM stub audited: 30 selectors
  the game asks were answered wrong (".pads button" gave the panel, "#fbar i" the bar,
  "[data-k=thrust]" any node, closest/matches always no); a real mini engine now, all old checks stay
  green, `tests/90d-selectors.js` pins it in both tiers (73584f8). (2) celDay column: a five-digit
  day fits left of the red margin with room — P6 closed by a frame through the player's path.
  (3) The two "quarantine" ОПИСЬ failures were real: the brake stayed dimmed in flight after the
  surface (yesterday's M181 gate), and the opis header lost its matches count after P1 — both fixed
  (dc67a87). Browser tier 18 080 / 0, node 16 352 / 0. **Still open: g11 on the laptop** — not run.
- [ ] **0.4 `src/16a-space.js` crossed the 40 KB build guard (41 KB) on 9dc0a3f.** Not a blocker and
  not to be fixed on the run. When it is split, split it by meaning: the sprite oven with its cache
  (`GLOW_SP`, `GLOW_CACHE`, `glowSprite`, `glowBlit`) apart from the things it bakes.
- [x] **0.1 Cadence** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **0.1b An even tact** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- **Gate, honestly: half taken.** On the author's S23, `RES_AUTO` now holds at 2 for ten minutes
  straight (it used to fall to 1 in thirty seconds) and the haze is no longer the bottleneck —
  muting it changes nothing. But the cadence gate is **not** met: the first minute read 58.2 fps
  at 97 %, and over ten minutes the shelf is 76–83 % with 475–619 frames over 24 ms a minute and
  p95 33.4 ms. The first minute was luck, and striking the gate on it was my mistake.
  Screen recording of the S23 itself on 05128a9 (Tester, 17.09, screenrecord, calm flight): 600
  frames in 9.99 s, median 16.7 ms, p95 17.0, two frames over 24 ms. So the idle frame is already
  smooth; the shelf comes from **active steering** — a minute with the finger on the stick reads
  83–90 %, ten minutes 79–80 %. The next measurement is prof() with the finger held vs. without.
  **Answered (Tester, 18.09, S23, three 20 s runs in a row, thermal 1): the remainder is the
  finger, not the drawing.** No finger 60.0 fps / 99.9 %; finger on the stick 50.9 / 81.9 % with 184
  frames over 24 ms; finger off again 59.8 / 99.5 %. Same scene throughout. Ruled out by test: ship
  speed (81.3 % standing vs 81.8 % at speed) and the accumulated wake (clearing WAKE+TRAIL moved
  80.0 → 81.2 %). Under the finger frameBody is 7.74 ms against 5.91 at rest, pointermove fires only
  0.54 times a frame — and **getBoundingClientRect is called 6.08 times a frame under the finger and
  5.33 at rest, where item 0.3 promised zero.** So 0.3 regressed or never covered these callers:
  find the five-to-six layout reads still in the frame and cache them. This also explains every
  earlier disagreement in the numbers: a first minute always beat the shelf because the finger had
  been on the glass for less of it. (Earlier "no finger" figures are withdrawn — the Tester's driver
  left the touch held between runs, so the stick counted as active.)
  **Found and fixed by stack trace (8a3f6ff):** two callers duplicated 08-state's cache with their
  own raw read — `fleetPromptRect()` measured `#prompt` once per visible fleet ship every frame (the
  finger-independent baseline, which is why the count drifted with traffic and why 0.3's own
  measurement missed it), and `helmLift()` did the same only while the stick is live (the touch-only
  delta). Both route through `promptRect()` now: 120 synthetic frames with three fleet ships, a live
  stick and a prompt line give 2 real reads total, both cold. Control's own P4 conditions had added
  two more reads (padsRect and a second promptRect in `drawSysHud`) — 8.17 a frame on a629378;
  folded into the same cleanup. Phone re-measurement pending.
- [ ] **~~THE FRAME IS BISTABLE~~ — WITHDRAWN by its own author the same evening (Tester, 18.09):
  it was a fault in his rig, not in the game.** In part of the runs his synthetic touch never
  reached the game, so the finger «lay» there with no stick alive — and those runs are the 99–100 %
  he took for a second state. With a check that the stick is really born (and the touch repeated
  when it is not), four 30 s runs in a row read 81.3 / 81.4 / 80.0 / 80.5 % at 50.0–50.6 fps: the
  spread is gone. **Every number from this evening with a zero stick must be read as «measured with
  no steering».** The dull, correct picture: with no steering the frame is perfect, with live
  steering 14 % of frames miss 16.7 ms, and that share holds steady across builds and across time.
  The reasoning kept below is kept only so nobody walks the same path again. Six

  30 s runs on one build with the same steering: 79.9 / 99.7 / 82.3 / 80.1 / 82.2 / 81.2 % cadence
  at 50.0 / 59.8 / 50.9 / 50.0 / 51.0 / 50.5 fps. **There are no intermediate values** in any of the
  evening's twenty-odd runs: the game either runs 60 frames at ~100 %, or 50 at ~81 %, and once it
  is in the bad state it stays there until the page reloads. The arithmetic says scheduling, not
  weight: on a 120 Hz panel a vsync is 8.33 ms, the good state is every second one (16.67), and 50
  fps averages 20 ms — which no whole number of vsyncs gives. It is a mix of 16.67 and 25, i.e. we
  aim at every second vsync and miss onto the third on some frames. So the frame sits ON THE EDGE
  and which side it lands on sticks from the first seconds. **Everything measured this evening as
  «the cost of a function» may have been measuring which state the run started in** — including
  Control's forced-layout reasoning, which was a real mechanism but not the cause of the shelf; the
  Tester muted hudFloorMeasure entirely and the cadence did not move. Measure `capIv` and the vsync
  stride, `tactHz` and the period it aims at, and FRAME_JS in both states before taking any more
  milliseconds off anything. First suspect: `capIv` is estimated from the shortest interval seen at
  startup and never revised, so a phone that hands out its first frames at 60 fixes the stride
  against the wrong period for the rest of the session. Also still unverified by anyone: the g11
  part of the gate (≥55 fps on the laptop) — the Tester never ran it.
  **Corrected the same evening by histograms (Tester, 1e1c505, S23, 25 s under the finger): 1119
  intervals of 16.7 ms and 189 of 33.3, no third value.** 33.3 is exactly twice 16.7, so the period
  we aim at is 16.7 and the stride is one — we draw every callback. That kills Control's arithmetic
  above (a mix of 16.67 and 25 from drawing every second callback): the measurement holds clean 16.7
  and its double, no mix. The true picture: the frame sometimes does not fit in 16.7 ms and every
  miss costs a whole period, since a skipped vsync is never caught up; the miss rate is 14 % and
  holds steady all run, and releasing the finger does not restore the good state (89.4 %). Not a
  stuck schedule — a frame on the edge, so taking milliseconds off DOES help (the Tester withdrew
  his «pointless» too). Judge by the share of skipped frames over three runs, never by one average.

- [ ] **AUTHOR'S CALL, and the numbers now point at it: the raster, not the JS — ×1.5 in flight on
  the phone.** Two measurements say the frame's JS is not what misses the deadline. Forcing the
  phone's render scale to ×1.5 gave 59.0 fps / 98.3 % cadence / 59 frames over 24 ms, against ×2 at
  51.3 / 83.1 % / 519 — same build, same scene, only the pixel count changed. And the frame's own
  work measures 6–8 ms against a 16.7 ms deadline (worker's synthetic run: 6.1 ms background, 7.9 ms
  in the frame right after a cache reset — a third dearer, not the 30–40 ms a real culprit would
  cost). So we have been hunting milliseconds in the JS while the deadline is missed in the raster.
  Control's recommendation, still awaiting the author's word: ×1.5 in the system and landing views
  under thrust, ×2 in the dock, the desk and the map, switching on mode change, no dithering. The
  look is his call — his game's sharpness against his own complaint about the judder.
  **The Designer argues against it, with frames (18.09).** She took a real phone frame at DPR 2.6,
  squeezed it to 2.0 and to 1.5 and back by nearest neighbour — what the eye would actually get. At
  ×1.5 the trail's one-pixel neon rails break into a dotted staircase (the very staircase she first
  took for a haze defect), and the star field loses about a third of its stars while the survivors
  double in size: exactly the two things this game's language rests on, and exactly the field the
  author asked to «stretch, not twinkle». HUD and chip text are unaffected, they live in the DOM
  layer. Her verdict: ×1.5 in flight is a bad bargain for THIS game, and the recommendation hits the
  very views where the trail and the stars *are* the picture. So the author gets both sides: her
  three-band comparison (2.6 / 2.0 / 1.5) beside the Tester's numbers, and he chooses knowing what he
  pays with. Her third option — keep the raster, win the frame back on the cost of events — is
  already spent: the worker's fix cut events fifty-fold and the skips stayed, evenly spread.
  **The Designer's case against ×1.5 is WITHDRAWN by her own measurement of real frames (18.09).**
  Her simulation squeezed a finished frame and put it back by nearest neighbour, which turns an
  already-drawn thin line into a dotted one. The game at a smaller canvas draws the line AGAIN: it
  stays solid, its pixel is simply bigger. Measured on the Tester's two real phone frames of one
  scene: the ribbon's rails do NOT break — the teal rail covers 99 % of columns at ×2 and 100 % at
  ×1.5, longest gap 4 px against 1, and there are MORE rail pixels (2634 against 2280). Stars are
  almost all there: 193 against 188 in the band above the ship, a 3 % loss and not a third, each
  blob grown from 18 to 20 px. What actually changes, and nobody predicted it: **the sky gets
  darker** — the band's mean brightness 19.0 against 14.2, a quarter down, with the nebula and the
  faint glow sagging most. So the price of ×1.5 is not the line and not the stars: it is the
  subtlety of the background. She withdraws «a bad bargain» and calls ×1.5 decent on real frames,
  with 59 fps against 51 a serious argument. Her method stands only for «what if we stretch a
  picture», never for «what if we draw it smaller».
  **If the author keeps the sharpness, here is the Designer's map of what may be given up (18.09).**
  Draw calls a frame in the system view, calm flight: the ribbon 126, the wake 126, the star dust 103,
  the compass chips and canvas HUD 10, the nebula 1 (baked into a texture and laid down in one piece),
  the torch 0 with no thrust. Safe to give: the star dust's 103 — depth comes from the layers moving at
  DIFFERENT rates, not from the number of specks (the density was already cut once), so a third can go
  and nobody sees it, herself included; and the wake below about a quarter speed, where it is hidden
  behind the hull anyway, can emit half as often. Only with a frame in hand: the ribbon's 126 — it is
  the game's face in motion, and the particle count must NOT be cut because the author complained the
  tails were stubby; cut thickness and the number of strands instead, never length. Never: the
  one-pixel line itself (the very thing ×1.5 breaks) and the single-pixel stars, which are literally
  the author's «movement, not twinkle» rule. In one sentence: the cheapest thing to sell is the
  emptiness's depth, the dearest are the line and the stars, and the ribbon sits between them.

- [ ] **THE FRAME'S REAL EATERS, found by breaking down the whole count (Designer, 18.09).** Control
  spotted that her first map named only 366 draw calls out of 1541, and the breakdown of the rest
  moved the target. Calm frame, system view at 390×844, median of five, as calls / filled pixels:
  **the ship's hull (`drawHull`) 823 calls / 4 k px — over half the work of the whole frame**, the
  stars 374 / 1 k, the ribbon 152, the dust 103, **the system's star (`drawStarBody`) 80 calls but
  2 203 k px**, **the nebula 1 call / 421 k px**, chips and canvas HUD 17 / 3 k, the station 5 / 24 k;
  planets, fleet, pirates, finds, drones, combat, tow and torch all zero — absent from this scene.
  1556 of 1971 named, the ~400 remainder being small unwrapped things (outlines, labels, frames).
  Two conclusions, both against the earlier map: cutting the star dust is pointless (5 % of calls,
  no area — she withdraws her own first item), and there are two eaters of different kinds. By CALL
  COUNT it is the hull: 823 strokes on an object the size of a fingernail, four times the rest of
  the frame. By AREA it is the star and the nebula: 2.6 M pixels together, the screen filled over
  several times — **and area is exactly what quadruples from ×1.5 to ×2.6, which is why the raster
  decides and our JS milliseconds did not.** So the third path, the one that keeps the sharpness:
  stop redrawing what barely changes. Bake the system's star the way the nebula is already baked,
  and bake the hull — 823 strokes draw the same body every frame, with rotation and tilt applied to
  a finished picture. Caveat from her: these are counts and areas, not milliseconds (no clock in
  headless) — the orders of magnitude hold, the true cost is the phone's to say.
  **Star baked, 9dc0a3f + dbc06ea (Worker, reviewed by Control).** The core's radial gradient is now
  a sprite breathed by `globalAlpha`; the protuberances stay live on purpose (flat fills, 11 k px,
  and baking them would kill the flicker the rulebook asks to keep). The bloom rays were baked and
  the bake was **reverted**: four rays are 5.8 k px a frame — a quarter of a per cent of the star we
  came hunting — while the sprite cost a change of LOOK (the ray's base moved from a fixed `R*.4` to
  a share of the breathing length, so it pulsed where four rays meet the disc), 2.19 px of source
  across the whole taper, and a stretch of up to ×11 at full zoom. The rule that came out of it is in
  GOTCHAS (c1cd737): bake what fills its bounding box — discs, glows, bodies — never slivers.
  **Hull baked, 51a0824 + dc67a87 (Control, after the team was closed).** `drawHull` is split into
  three still parts (`hullPart1..3`, 03e) with the live layers between them in the old order —
  flames and nozzle glow, brake tongues, the Company runline's moving lights (`makerTicks`), crowns,
  nav lights, the lvl bar — and `03e1-hull-bake` lays the still parts down as pictures under the
  current matrix. Calls per ship with flames lit: **902–1490 → 72–140**. In the live loop after a
  few seconds of banking: 178 hits, 2 bakes, ~31 pictures per hull. Scale in 1/16-octave steps
  (quarter octaves were caught by the maker instrument M369 at 89.9 % < 90: the softness is real on
  the small plan), one ink box per hull in world units, probe ≤ 768 px (close-ups draw the old way —
  a 3200 px probe hung the browser tier). Off switch: `G.opts.gfx.hullBake=0`.
  **Not yet measured on the phone** — that is the only number that counts; the S23 was not reachable
  over Wi-Fi (only an unauthorized 192.168.1.52:5555, serial UZ1A2246001408, answered). Next: the
  cadence on the phone by the three-run protocol with the helm alive, bake on vs off; then the
  Designer's check of the baked hull against her four risks (lights and nozzles, a step at the
  picture's edge, lag in rotation) — done by me side by side at ×2, not by her.

- [ ] **A second, independent instrument for the frame: the screen recording** (Designer, 18.09).
  Counting skips from *outside* the game, so it cannot be fooled by our own counters: a skipped vsync
  is never caught up, so the movement across that gap must be DOUBLE. `scratchpad/skips.py` crops the
  ship, measures the step between frames, divides by a rolling median to remove real changes of speed,
  and prints the share of double steps, the frozen frames and the gaps between skips. On the good-state
  reference (600 frames, 59.94 fps, finger steering): ratio spread 0.89–1.12 over nine tenths of the
  sample, 3 double steps out of 599 = 0.5 %, scattered, not periodic — against 14 % on the Tester's bad
  run. The two instruments agree, and **the good state exists and holds for ten seconds under an active
  finger**, so the frame does not simply fail to fit in 16.7 ms: the headroom comes and goes. What the
  Designer will call a *third* answer, named in advance so it is not decided after the fact: frozen
  frames instead of double steps (the compositor repeats a buffer, not our arithmetic); triple steps
  (two periods lost at once — a rare heavy job, not general weight); a true sawtooth every N frames
  (scheduling after all, and the stride-of-one correction is wrong); or double steps in clusters with
  clean stretches between (an EVENT causes the drop — chase the event, not the percentage).
  **And that fourth reading is the one that came true, on the good run itself (Designer, 18.09).**
  Skips per second across the 10 s: 1, 0, 0, 0, 0, 0, 0, 0, 0, 2 — eight clean seconds, everything
  at the edges. Looking at WHAT is on screen in those frames: frame 3, the hail window «КОММУНА ·
  ОКЛИК» is open and the recording starts on it; frame 548, that window is still open and the
  gravity-anchor hint appears; frame 588, the window has just CLOSED, «ПРЕДУПРЕДИТЕЛЬНЫЙ ПО ЩИТУ»
  replaces it and the three compass chips re-laid out. So in steady flight there are no skips at
  all, and the ones there are fall on EVENTS: a window opening or closing, a hint appearing, chips
  re-laying out. Her own caveat, which is why she is trusted: an event changes the picture too, so a
  big movement step there may be an honest jump rather than a skip — frame 588 she calls doubtful,
  so the firm count is one or two, not three. **Direction for the work: measure the cost of an
  EVENT, not the average weight of a frame.** Every skip measurement must now also say what was on
  screen at that frame; her instrument already prints the frame list with a picture of each.
  **The good-state reference is withdrawn too (Designer, 18.09): there was no steering in it.** She
  checked the recording itself — no stick pad on any frame of the lower half (the hail window
  «КОММУНА · ОКЛИК» occupies it), and the course does not change for eight seconds (the ribbon's
  angle reads −30.8 / −31.8 / −32.3 / −31.9 / −31.5, a degree and a half of drift). The recording is
  not flight under a finger, it is waiting for an answer in a dialogue. So her «eight clean seconds»
  meant eight seconds without steering, and «the headroom comes and goes» is withdrawn.
  **What survives, and it matters: those three skips landed on a window opening, a hint appearing,
  and a window closing with the chips re-laying out — with no steering at all.** Events cost even
  in the lightest frame. So there are TWO separate bills, to be fixed separately: a steady 14 %
  from live steering, and spikes on events. Next: a real reference — same scene, stick confirmed
  born, no windows open, 10 s of continuous steering, so steering is compared against steering.

- [ ] **Four milliseconds, by the function.** `frameBody` averages 10.58 ms against a 16.7 ms
  vsync, max 28.7 — no headroom, and muting *any* single draw function now gives 59.7 fps at
  99.5 %, so there is no one culprit left: the frame is simply full. The task is to take ≥ 4 ms of
  JS off it at the same look, one function per commit: draw only the wake and trail points that
  are actually visible and merge segments shorter than a pixel; let `hud`/`drawSysHud` touch only
  what changed; cache the hull's outline in a layer per scale and blit it rotated. Meter:
  `FRAME_JS` EMA before/after, then the tester's phone.
- [ ] **Longer tails** (author: «хвосты от корабля побольше надо, а то сейчас куцие»). `WAKE` sits
  at 642 points of 2 000 and `TRAIL` at 0 of 560 — the buffers are two thirds empty, and on `main`
  the wake held 750 at the same speed. Lengthen life/length **after** the milliseconds are found,
  or the budget goes straight back; the look is the designer's call.
  Designer's note from the ×2.4 comparison (18.09): at that zoom the trail reads as a *ruler* —
  two even rails the full height of the screen, same on `main` and on the branch. That is the
  language from before Stage 0, not a regression, and it belongs with this item: when the tails are
  lengthened, the rails are what has to stop looking drawn with a straightedge. Show the author a frame first.
  Same item, the stick's finger trail (Designer, 18.09, measured): its length is set in POINTS
  (`HELM_TRAIL` = 7), so the tail's length in time depends on the sampling rate and on the frame
  rate — at one point a frame the arc is 208 px long, at two a frame 105, at four 52. Control read
  this backwards and asked for the trail to be lengthened after ec9f3fc; the Designer's numbers show
  ec9f3fc made it two to four times LONGER, and she accepts it as it stands. What is worth fixing,
  with the engine tails and not before: measure a tail in TIME (keep points younger than ~0.2 s)
  rather than in count, so it looks the same at 60 and 120 Hz.
  Designer's audit of what is measured how (18.09), so the tails conversation argues about taste
  and not about facts: the wake (life 60–260 by speed) and the ribbon (40×span hot, 6–11 sparks) are
  already measured in TIME, and their count ceilings (2000, 560) are overflow guards never reached in
  normal flight — leave both alone. Measured in COUNT: the finger trail (7 points) — the only real
  case, fix by keeping points younger than ~0.2 s; the wake tips (3) are how many jets we draw, the
  helm marks (3) and the map's rum trail (12) are a memory of the player's actions — count is honest
  for all three. So if the author still finds the tails stubby, the number to change is the LIFE, not
  the way it is measured. The Designer is preparing one frame for the author: three bands at equal
  speed — finger trail, wake, ribbon — each captioned with how long it lives.
- [x] **0.2 Raster** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **0.2a The haze over the nozzles — the frame's real bill.** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **0.3 Layout in the frame** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **0.4 Resolution that comes back** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **0.5 Sound** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [ ] **0.6 GC — hoisted, unverified.** Major GCs of 14–28 ms sat inside the longest gaps. Three
  sources are gone from the frame: the instruments built a string for every gauge every frame just
  to compare it (`setSt`/`setTx` do not write an unchanged value, but the string was glued anyway,
  so a full tank and an intact hull still made a couple of dozen dead strings a frame) — the
  comparison is now on **numbers** (`setPct`/`setPair`, `HUD_NUM`) and a string is born only when
  it will be shown; `toUpperCase()` for the compass chips is memoised on the body (`_up`, a key the
  hash and the save both skip by its underscore); the wake and ribbon rewrite of 0.2 already took
  two `rgba` strings and two mid-point arrays per segment out of the frame. **Not measured
  locally, and that is the whole point of leaving it open:** `performance.memory` is frozen in this
  build (900 frames of steering report a 0-byte heap delta), and `mixc`/`rgba` are `const`, so they
  cannot be wrapped to count. The meter is the phone trace's allocation sampler — the tester's
  before/after on GC pauses decides this item.
- [ ] **0.7 Heat.** 75 min → thermal MODERATE, 37 fps at ×1. The sum above is the fix; the check is
  a 30-min run with `dumpsys thermalservice` logged every minute.
- **Gate to stage 0b:** cadence ≥ 95 %, no frame > 24 ms in 60 s of steering, `RES_AUTO ≥ 2`,
  `g11` ≥ 55 fps in every mode on the laptop.

### Stage 0b — cheap and decided (one commit each)

- [x] **P1 Scroll, globally** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P2** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P3** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P4** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P5** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **RELEASE BLOCKER closed: the four «штурвал» failures  — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P6** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [x] **P7** — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»).
- [ ] **The anchor and the stick** (phone video 12.09; 0.449.0 widened the edge, the mechanism
  stays): past the edge the anchor turns the velocity toward the star every frame while the stick's
  assist thrusts outward — the turn is a force against thrust, an equilibrium exists (the comment in
  `17-mode-system` denies it): the ship crawls along the edge at a tenth of cruise, nose 90° off,
  burning fuel (20-line sim matched the video). Fix, one commit: (a) the anchor strips the outward
  radial part from the INPUT (`c.ax/c.ay`, `c.tx/c.ty`), not the state; (b) `c.slow` (the 120°
  brake rule) reads input against the last wanted vector, not the bent velocity. Test: under an
  outward stick at the edge speed ≥ .5 cruise and fuel/s = coasting.
- [ ] `say()` from timers/network callbacks is neither frame-born nor tap-born — mark as world
  (`sayWorld`) or set FRAME_IN there.
- [ ] СТОЛ: empty sheets say where to get the thing; bottom padding under the last row of desk
  objects. `journal` lines («Дрон … встал») should not reach `crash.log` (M417 noise).
- [ ] Station header review 13–15: СТОЛ out of the masthead; two tab rows = 110 px — fold to one;
  prices before the cooperative form; the Director's news on ДОСКА. Each passes «чтобы что?».
- **Privacy, standing:** the author's save sits outside git (`C:\Claude\drift-private`) — never
  commit it; the two bot signs in `~/drift-data/trace/p/0_0.json` the author removes by hand.

### Stage 1 — the ship under the finger (`docs/PLAYTEST-2026-09-13.md` §2.2–2.6, §3)

- [ ] **P8 Under the finger.** `flightCam` lag grows with zoom (350–536 px off centre at ×2.4);
  «stop here» fired 15 frames of 3 177; the hull capped at .8 never grows on zoom. Camera lead
  proportional to zoom, the stop gesture on a real threshold, `SHIP_SCALE_MAX` by zoom. Meter: the
  camera-vs-ship offset p95 in the in-page recorder ≤ 60 px at ×2.4.
- [ ] **P9 Zoom + 2a atmosphere + the entry point — one camera design.** Pinch jumps across 28× (217
  frames > 6 %/frame): easing and resting steps. At ×4.5 the frame is 87×188 world units, the
  landing zone (110 from the surface) is off-screen, in orbit the orbited body leaves the frame:
  **the body you orbit or land on stays in view** (camera lead toward the body / descent from the
  drawn disc). And the arrival point: `jump()` (`18-mode-map`) places the ship at 1 500 from the
  star at `rnd()*TAU` — replace with **a seeded angle per system** (`hashi(sx,sy,salt)`), the ship
  facing the station; that removes one `rnd()` call → every replay and same-hash suite moves once:
  a deliberate `test.ps1 -Accept` pass, named in the patchnote. Ж1 (stage 2) builds its lane on
  this point.
- [ ] **P10 ЦЕЛЬ and the hail** (§3): one pad with five meanings (hail answer, probe, crew-off,
  thanks, lock); pickets not lockable; the hail's fight answer red and named «БОЙ». One meaning per
  pad state, the verb from the prompt (M355).
- Gate: `g11` on the phone before/after; the frame gate of stage 0 still holds.

### Stage 2 — whose land, in five seconds (borders + life Ж1 + the galaxy)

- [ ] **Ж1 The approach — «подъезд»** (`DESIGN-life.md` §2–3.1, review §4.4). From the entry point
  (P9) to the station: buoys every few hundred units, one lamp each, **lamps chasing toward the
  dock** at ~2 buoys/s (a phase, not blinking); a **holding queue** at busy stations — 2–6 ships on a
  slow ellipse, one docking, one leaving; density = rung × heartland gradient (`sysDanger`); tugs
  and the shuttles of `17f-sys-traffic` re-routed onto the lane. Absorbs the haul-scene review
  (shuttles passing, a route bar instead of the countdown, the destination chip = the station).
  Buoys baked per system; only phases and ships per frame. Meter: `prof()` on the phone layout —
  the approach adds ≤ 1 ms raster; `look()` on the heartland scene keeps pair % ≥ 15.
- [ ] **Б1 The first ship's gesture** (review §2.1). Within 5 s of arrival one ship of the owner
  (`chronOwner`) does one thing: ГЛАВТРАССА picket alongside, a spotlight cone sweeps you,
  «Записываю», a КНИЖКА line «Проследовал. Замечаний нет.» (monthly: «Замечание: нет замечаний»);
  Компания drone with a screen before your nose, ПОЧТА «Пролёт — 0 кр (акция). Сбор за оформление
  акции — 40 кр»; Орднунг scan plane tail to nose, a pad form «цель визита» with three answers, all
  «служебная»; Коммуна — nobody, a buoy «ОБЕД. ВЕРНУСЬ»; Рассвет tug «чинить есть что?» / at 100 %
  «ну хоть покрась» (one panel painted, 5 кр); Хай-Фронт camera drone at a fixed offset to the dock,
  «ваш рейтинг доверия рассчитан» (never shown anywhere). Rear/front/fresh-occupation states as in
  borders §2.1; Ялта: all six, weapons sealed. The gesture ship is the fleet art in the maker's
  dressing. The **post** is background: one truss + board + lamp + the dressing's prop, baked, at
  the entry point (borders §2.1 table for the six dressings).
- [ ] **Б2 The stamp + P14 ТРУДОВАЯ КНИЖКА** (borders §2.2, review §4.4, playtest §4.4). Border
  crossing = owner change (or wild → owned) on arrival: a stamp across the screen 1.2 s (DOM on the
  КНИЖКА paper, tilt 5–12° by seed, ink grain, scale 1.3 → 1 in 120 ms, hold 900, fade); six papers
  (violet stencil «ОТМЕТКА О ПРОЕЗДЕ · ПОСТ № n» + signature; Компания's till slip scrolling up
  «ВЪЕЗД — 0 кр (акция) · спасибо за выбор»; Орднунг black numbered «Экз. 1 из 3», time to the
  minute; Коммуна blue italic with a poem line and the date slightly wrong; Рассвет ochre hand, a
  sun, a thumbprint; Хай-Фронт dot matrix «v4.1» + a trust number). **The КНИЖКА becomes a real
  document** (P14): stamps, seals, signatures, the vacation savings, the доска почёта and the
  grounding ending (all designed in M161, none on the page) — with **ОТМЕТКИ О ПРОЕЗДЕ** as its first
  real page (six + Ялта + the pirates' scratch to collect). Save: which stamps, when (`G.stamps`).
- [ ] **Б3 Station body and traffic by builder** (borders §2.3). `17e-station-body` applies the
  maker grammar (`HULL_MAKER` dimensions: profile law, seams, marks, ground) to the station by
  `station.by`; `17f-sys-traffic` draws 7 of 10 ships from the owner's maker, 3 from neighbours; a
  border system mixes, a heartland is uniform.
- [ ] **M447 The world galaxy + M448 the stars** (`docs/DESIGN-galaxy.md`): `galaxyAt(x,y)` (disk,
  bulge + bar, two arms and spurs, dust, knots); world tiles in two levels, 4 ms bake budget,
  fade-in fallback; band and nebula leave the map; M438's sky block retired; Node suite, a detector
  for «the galaxy moves with the sheet»; goldens accepted; faint stars per sector at constant
  screen density, no cross/halo/twinkle. Acceptance frame: home, 0:0, zoom 1, inside the bulge.
  **The metro's ride and scheme (stage 3) draw on this.**
- **Gate:** on any jump in the settled circle the tester names the owner within 5 s without
  reading a label (three testers, six powers); the stamp lands once per crossing; `-Accept` done.

### Stage 3 — far, and back with a hold (resources + the railway)

- [ ] **Р1 Ten goods — table and roll** (`DESIGN-resources.md` §2–3, review §2.5). Rows in `RES`
  with band, verb, property, price, eater line: **солнечный газ** (frontier, scoop, 85, reactors) ·
  **белая руда** (frontier, belt, 95, instruments) · **космический янтарь** (frontier, cave, 130,
  fragile → «крошка» at ⅓, Коммуна ×1.5) · **осмий** (deep, mine, 190, heavy ×2 hold, armour) ·
  **звёздный чернозём** (deep, drill, 170, greenhouses/дачники ×1.5) · **магнитная пыль** (deep,
  belts by star class, 260, shields) · **жемчуг пустоты** (deep, fauna, 320, Компания ×1.5) ·
  **тёмное стекло** (rim, drill, 600, optics, Хай-Фронт ×1.5) · **ловушки** (antimatter, rim
  scoop, 900, perishable 1 %/min without reactor feed, detonates below 20 % hull) · **нейтронная
  крошка** (beyond r 50, drill, 1 500, heavy ×5, доводка). **New random salt** — a Node suite proves
  no existing deposit, price or station moved (old-salt hashes before/after). Presence by band;
  richness `exp(N(μ(r),1))`: ~70 % бедная, 25 % хорошая, 5 % богатая, 0.5 % **ЖИЛА** ×20.
- [ ] **Р2 Reading and ЖИЛА.** The scanner shows a range («осмий: 40–160») narrowed by the
  instrument's resolution (изыскатель ±10 %, рудовоз ±60 %; тёмное стекло in the instruments halves
  every range) — the professions' honesty rule. ЖИЛА: the word across the screen (ГЛАВТРАССА
  stencil, warm, 1.2 s — the only time the game shouts), a ДНЕВНИК line, a rumour at the nearest
  stations after one сводка, company on that approach afterwards («трое, все говорят, что первыми»).
- [ ] **Р3 Prices by distance.** ½ base in its own band, 1× at r≈10, 1.3× in the heart, the eater's
  ×1.5 in its land; the live market's flood-and-recover holds; far goods rarely on sale in the heart.
  Eaters speak at their counters (review §3: «весы наши, тара ваша», «принимаем по весу, вес — наш»).
- [ ] **М1 The net and the scheme** (`DESIGN-metro.md` §2, §4, review §4.4). Six radials from the
  core at the powers' home angles, **forking** outward so line density stays even (6 at r 6, ~12 at
  15, ~24 at 35, on without end); rings at Ялта's radius (Кольцевая; **Ялта = «Площадь Шести
  Держав»**), r≈18 (Большое), r≈35 (Дальнее), then ×1.9; two spiral трассы along the arms
  (`galaxyAt`); a stop = the nearest station system to each spacing step (метро 1.5–2.5 sectors
  inside r 12; электричка 4–8; a step with none is a перегон); junctions where lines cross; past
  r 40 single tracks with **полустанки** and «Край». Lazy per region; Node suite (reachability,
  one stop per system, determinism). Names by owner (Д5 rule; beyond the powers: «разъезд 214-й
  сектор», «полустанок Сухой»). **M449 named places rides along**: arms and ~10 nebulae named in
  the game's voice, lines carry the arm's name («Линия 7, Рукав Лебедя»), labels at far zoom.
  **The scheme** (our own, on paper): thick coloured lines on paper, white circles black-rimmed,
  double circles for interchanges, «ВЫ ЗДЕСЬ» red, shut stretches hatched; on the galaxy map the
  lines as faint smooth curves 1:1 with the sheet (no parallax). **M450 the overview** (pinch past
  zoom 5) becomes the scheme's zoomed-out sibling: the disk, «вы здесь», the settled circle, the
  danger rim, marks, rumours — and the lines.
- [ ] **М2 The station in the system.** At the end of the approach, past the ordinary station: **the
  ring** (a torus flat, inner disc a shade lighter with a slow faint spiral, the line's plate) and
  **the glide path** (two converging dotted lamp lines chasing inward); a small vestibule block (one
  body, six dressings; at the rim a bare platform with one lamp). Within ~300: «Станция «Нейэль».
  Стыковка?» — ДА. **Align**: speed under the mark, nose in the cone 2 s, helm-assisted, wide cone on
  the phone; too fast → «Сбросьте скорость», restart, no penalty; **after 5 s of failing the ring
  takes you** — «Автостыковка. Просьба не мешать», КНИЖКА «стыковка выполнена автоматикой».
  Berth: the ship slides in. **The train is the batch**: ships arrived since the last opening stand
  in a row on the lamps — a вахтовка, a barge, a yacht; at the rim you and a drone.
- [ ] **М3 The vestibule** — the metro's only new screen, one page on the station paper: **ТАБЛО**
  split-flap («ЭЛЕКТРИЧКА до «Край» · через 0:14», «СКОРЫЙ · 1:40», «МЕТРО · прибывает»; flaps turn
  on change), **КУДА ВАМ** unfolds the scheme on the same paper — tap a stop → pad «ДО «НЕЙЭЛЬ» · 3
  ОСТАНОВКИ · 5 кр» / «ДО «СУХОЙ» · 11 ОСТАНОВОК · 38 кр + багаж 12 кр»; routes through
  interchanges by themselves; **КАССА** — жетон (brass disc, 5 кр flat «сорок лет»), билет 2
  кр/sector, скорый ×2, baggage per ton, «крупногабаритный» ×3 (the tape measure always finds «плюс
  десять»); **БУФЕТ** three items by the owner (лимонад «Звёздный», «Кола Партнёр™», «вода
  минеральная 0,33 № 2», «кофе с круассаном (закрыто)», «чай из общего котла», «энергетик v4») — a
  drink comes with a rumour (`11t`) and a ДНЕВНИК line. Wait = the interval: ~6 s in the heart,
  **≤ 40 s real at the rim** (табло «следующий поезд — завтра», forty seconds later «поезд подан»).
- [ ] **М4 The ride** — `G.mode="rail"` on the galaxy map. Departure: «поезд подан», the batch goes
  in 0.3 s apart, your stars stretch to the ring's centre 0.6 s, a white-cyan flash. The ride: the
  camera frames the line ahead drawn thick in the scheme's colour; the train a rounded glyph with a
  headlight wedge; stops as ticks; segment 0.8 s + 0.35 s/sector, **a stop ~2 s** with the name, the
  announcer once (`12pa-beacon`) and **ВЫЙТИ** on the pad; **ПЕРЕСАДКА** at junctions with the other
  line's wait; a paper strip at the top carries the announcements («Осторожно, двери закрываются» —
  said anyway; «Уступайте места пассажирам с детьми и крупногабаритным грузом»; «Поезд следует до
  станции «Край» со всеми остановками. Остановок: сто четырнадцать»; «Конечная. Поезд дальше не
  идёт, просьба освободить вагоны»; front stops «Поезд проследует без остановки»). Metro hop ≈ 6–8 s,
  heart to rim ≤ 60 s; held pad ×2, never a skip; desk open during the ride. Arrival: thrown out of
  the destination's ring onto its approach, slow, facing the station. Save `{line,from,to,t}`,
  resumes at the next stop. Kindness: the полустанок's lamp comes on as you approach — «ждали».
- [ ] **Oracle lines** (`91zzzzzzzzz-worlds`): best rail round trip ≤ ×1.3 of best jumps in credits
  per minute of play (baggage is the lever); the stripped hauler's best one-hop deal (for К3).
- **Gate:** from home to a rim полустанок and back with a hold of deep goods in under 4 minutes of
  play, paying its ticket on an average roll; the ride never shows a loading screen.

### Stage 4 — the ship (`DESIGN-shipyard.md`, review §1.3, §2.2, §4.4)

- [ ] **К1 The plan, read-only.** `hullOf` → cells (side = length/N, N 8…14 by size; ≥ 48 px on
  390 px), **one view, nose up**: rim cells = ОБШИВКА (mounts: нос → жёсткая, борт → турель with an
  outward arc, as `mountsOf` today), axis cells behind the nose third = the spine (БАШНЯ), interior =
  ПАЛУБА. **No deck tabs.** The **packer** turns every existing fit (`SHIPS`, `FLEET`, unique, fused,
  NPC, pirates) into a plan by the maker's habit; **fixpoint suite**: every number equals today's ±1
  for an untouched save, nothing that fits unfits, «a fully upgraded module set fits any hull».
  ОПИСЬ shows the plan (swap same-footprint on the same cell only). No new save field.
- [ ] **К2 The КБ editor** — the second and last new screen: **синька** (Prussian blue, silhouette
  and grid in light line, parts as warm ochre ink stamps by kind, БАШНЯ a circle with a cross, scars
  brown, tape grey, «СОГЛАСОВАНО» violet in the corner — landing by itself after a fake queue «ваш
  чертёж 4-й в очереди»). Footprints 1 / 2 (turns) / 4. Tray under the plan: things from the hold
  that fit the selected cell glow. Tap-tap places, long-press lifts; a refusal is one line: «реактор
  у борта не ставят», «двигатели — только в кормовой ряд», «приборы видят из носовой трети», «поворот
  не предусмотрен формуляром» (Орднунг). **The hold is what is left** (author's decision 14.09):
  free interior cells paint as ТРЮМ by tap. Numbers strip: **ЯЧЕЙКИ 34/40 · ТРЮМ 90 · БАК 140 ·
  ЭНЕРГИЯ «в бою 12 с» · РАЗГОН ×0.94**, coloured by delta. **ТИПОВОЙ = «КАК У ВСЕХ»**; three
  **ПРОЕКТЫ** per hull. Save **`G.draft[shipId]`** (`G.plan` is the industrial plan, `11r-plan`) = `[[thing, cx, cy, turn]…]`, the packer as the
  `applySave` default. ОСНАСТКА's hull section becomes КБ; a foreign yard bills by cells moved
  (Компания: «перемещение ячейки — 1 кр, итого 14 кр, спасибо за выбор»).
- [ ] **К3 Numbers from the plan.** cargo = hold cells × hold-module density; fuel/jump = tank cells ×
  density; energy = reactor cells × output (`weapon` module = the reactor level, war §4); hull
  points = the hull's + armour parts; thrust/turn = the hull's × mass factor **clamped .8–1.1**
  (tied to P8's feel); sight = instruments in the nose third. Module tiers become densities.
  Bounds: cargo ≤ ×1.4 nominal; the oracle line from stage 3.
- [ ] **К4 БАШНЯ, exposure, sight.** The spine mount: 360°, costs its cell (no decks now, so one
  cell), drawn in flight as a round turret on the back — the loadout read by silhouette; rim parts
  take their side's wear (`12s-wear`) when hit from that side (war §4's ×1.6 from behind now also
  means «engines take it»); instruments count only forward.
- [ ] **Р4 Properties** — heavy (×2, ×5 hold), fragile (крошка on a hit), perishable/dangerous (the
  trap's energy draw, the countdown spoken in the hold, detonation below 20 %). **Р5 Eaters** —
  reactor/armour/shield/instrument densities, доводка by нейтронная крошка, greenhouses and дачники,
  jewellers, the luxury counter, the navies' buy.
- **Gate:** an old save loads with every number unchanged; a hauler stripped to the hold and a
  warship stripped of hold both fly under the finger the same (P8 meter); the blueprint passes the
  craft codex and gets its almanac issue.

### Stage 5 — the voice and the joke (`DESIGN-birchpunk.md` §2, §4; life Ж2–Ж4; borders Б4–Б5)

- [ ] **Д1 Machines with names.** Drones, the base crawler, the tug, the barge autopilot: a name
  (Митя, Глаша, Буля, Кузя, Жучка, Громобой…) and **one quirk** = one number off the norm both ways
  («работает только днём — днём быстрее», «возит лишнее», «поёт при бурении»). Journal lines in the
  name: «Митя встал. Чинится сам. Ругается.» Drones never die (2026-09-03). Hands stay faceless.
- [ ] **Д2 Изолента.** A consumable for kopecks: field repair of any part or the hull to 50 %
  (the first hour's ДО 50 % button, anywhere); leaves a grey **tape strip drawn on the hull** where
  used (a scar until a yard repair); the trait **«кулибин»** on a hand/manager: tapes free from scrap,
  holds 60 %, «заматывает так, что не видно». Рассвет's yard treats tape as a finish.
- [ ] **Д11 The triangle — гарантия / техподдержка / изолента** (§4.1). Firm parts (Компания,
  Хай-Фронт) carry «гарантия 12 сводок» in ОПИСЬ. Broken: **ТЕХПОДДЕРЖКА** — an эфир call, «ваш
  звонок очень важен для нас», one bar of hold music (`10-music`), a queue number counting down in
  game time (37 → … and once back to 41), repair to 100 % in 1–3 сводки, free, the part dead
  meanwhile; **ИЗОЛЕНТА** — now, 50 %, «гарантия аннулирована: обнаружены следы изоленты»; **ЯРД** —
  proper, for money. Kindness: the old master at any yard welds one seam free for a taped hull:
  «сынок, ну кто ж так».
- [ ] **Д5 Names by owner** («Рязань Каунти»): settlements, holdings, metro stops = homely toponym +
  the owner's administrative suffix (ГЛАВТРАССА «пгт Верхний Пояс», Компания «Горловина Каунти»,
  «Нейэль-Сити», Орднунг «Бецирк Нейэль № 4», Коммуна «Сен-Горловина», Рассвет «кооператив
  «Горловина»», Хай-Фронт «Горловина-2 v3.1»); a flag change repaints the sign. Firms = provincial
  city + foreign tech word, invented («Кострома Роботикс», «Урюпинск Орбитал»); never a real one.
- [ ] **Д8 Космопочта.** ГЛАВТРАССА's post at stations open by the game clock (hours on the door);
  извещения in ПОЧТА for a hull from СТАПЕЛЬ, a rare part, cooperative goods; collect at the counter
  in hours; a parcel waits 30 days then returns; a queue number. Kindness: the clerk keeps it a day
  longer, «не по правилам».
- [ ] **Ж2 Billboards + Д7 the contradicting newscast + P12 ЭФИР — one pass.** Billboards: a truss,
  a panel, three-stroke neon lettering (glow / core / white-hot centre), one crawling line; **the
  line is useful** — real prices from `G.market` («ТИТАН 41 У ПАРТНЁРА В 2 ПРЫЖКАХ — ВЫГОДНО КАК
  НИКОГДА», stale ones as a fork), the сводка in the owner's voice, the Director's циркуляры, a
  holding's own station («ТОПЛИВО ЕСТЬ»), «до конца акции 00:00:03» for ever; six letterings (review
  §4.2); a ГЛАВТРАССА sign always has a dead letter, one *buzzes* once a minute (200 ms dip) — the only
  permitted flicker besides Хай-Фронт's honeycomb cell; within R the hull takes the panel's colour
  as an additive stamp on the facing side. **Д7:** `12p-news` answers the player's own last deed
  within one сводка in each power's doublespeak (a barge pulled out of a fight → Маяк «на трассе
  спокойно», Компания «партнёр обеспечил безопасность перевозок™», Хай-Фронт «инцидент не
  зафиксирован»); the player alone knows. **P12:** ЭФИР (92 rows, 50 distinct, events drowned) —
  events first, chatter folded, the six waves' contradictions as its spine.
- [ ] **Ж3 Hotels** — one slab-of-windows body, six dressings (which windows are lit, the sign):
  «ГОС ИНИЦА «КОСМОС»» (two letters dead, «МЕСТ НЕТ» on the board, «для вас найдём» at the desk),
  «ДЖЕКПОТ-СИТИ™», «Пансион № 4» (lights out 22:00), «Ля Люн», the door in the rock, the honeycomb.
  Docking opens the doors that exist: sanatorium (`29h/29i-spa`), cinema (`27da-kino`), cantina
  rumours. Kindness: under 30 % hull the clerk lets you sleep off the fatigue free, «потом заплатите».
- [ ] **Ж4 «Чебуречная»** — a junk boat on the lane hailing «Чебуреки! Горячие!» whatever the hour;
  sells the owner's `POWERS[k].food`; a meal comes with a rumour and a ДНЕВНИК line.
- [ ] **Б4 The peacetime fleet in flight** (borders §2.4, from war §7.3's table): ГЛАВТРАССА
  субботник tugs pushing belt debris; Компания ad hulls and hired «contractors»; Орднунг an
  inspection pair holding a trader; Коммуна's fleet in a neat line, lights low, on strike days;
  Рассвет's repair tug that comes to any damaged ship, yours too; Хай-Фронт's reboot line. Driven by
  the chronicle's states where they exist (`12au-rites`, `12ay-fx-soc`).
- [ ] **Б5 One law each — the voiced ones only** (review §1.5): ГЛАВТРАССА норма (a fuel norm per
  visit for kopecks); Компания пошлина (docking 40 кр, free with a sponsor on board); Орднунг
  скоростной режим in the numbered ring (a ticket in ПОЧТА with a paragraph number); Коммуна обед
  (yard and one counter shut an hour, fuel always sold); Рассвет «сделаем из ваших» (two parts → one
  better, no deadline on jobs). The trust rating is cut.
- [ ] **P11 ПРИЁМНИКИ** (§4.1): the dial does nothing; announce tap-to-map on the row; back returns
  here; say what receivers give. **P13 АЛЬБОМ** (§4.3): tap to enlarge; keep repaint-from-snapshot
  (~99 B) but paint far better — photo filters; postcards as collectibles at stations; a captioned
  screenshot saved to the device gallery.
- **Gate:** a tester laughs once in the first ten minutes at something inside the world, and can
  say afterwards which institution the joke was on — never a person.

### Stage 6 — the story and the rest

- [ ] **P15 «Смена» — the main quest** (§5.2–5.3): chapters as milestones opened in sequence by deeds
  in beautiful places (not by buying drones — 25/72 opened on the author's save without a landing);
  closing a chapter is an «АКТ» moment across the screen; a real book
  with plates from the player's own flight; the text may be edited to fit.
- [ ] **Б6 Sound** — a three-note motif per power on the radio at entry (not six musical modes); the
  receiver speaks the owner's `air` line once. **Б7 Map borders** — territory edges as lines in the
  owner's pattern (dotted stars, ring marks, numbered dashes, a wave, uneven dashes with suns,
  dots), 1:1 with the sheet; the emblem chip readable (14–18 px) at near zoom; the glyph on the
  compass label and the header.
- [ ] **К5 Six yards' character** (shipyard §4, review §2.2): built-in / limit / habit — ГЛАВТРАССА
  бронепояс +25 % hull, +8 % mass, **a slogan along the flank that cannot be removed** («ПЛАН —
  ЗАКОН»); Компания −15 % price, a running line on your hull, billed per cell; Орднунг a free front
  shield cell, footprints do not turn; Коммуна turrets +30° arc, −15 % cells, shut at lunch/strike,
  adds a curve you did not order «так красивее»; Рассвет hull points back from debris in a fight,
  the only yard that welds a pod (+2–4 cells) onto any hull, no башня above medium; Хай-Фронт a
  free instrument cell, −15 % hull, **firmware moves one part a cell per сводка «оптимизировано»**
  («отложить обновление» 3 сводки), stock turns every сводка. Calibrated by the worlds oracle and
  the стрельбище. **К6 СТАПЕЛЬ** — order a hull at a power's yard in its land: class × size × two
  sliders inside the maker grammar, live preview, price on the button, ready after one сводка
  (ПОЧТА/Космопочта), persisted as the order only `{by,cls,size,l,w,seed}`. **К7 The hull
  remembers** — 1–3 шрамы on wrecked/towed/captured hulls (a burnt cell, a bent mount −30 % arc, a
  leaky tank cell) drawn where they are, repaired for money, cheaper to buy; **доводка** — a yard
  welds one thing in (+1 tier, immovable, a seam drawn), two per hull, paid with money and a node
  (or нейтронная крошка). **К8 The fast path** — NPC and pirate ships built by the packer; the
  new-part mark on the plan. **К9 Особая система корпуса** (the one thing the designer still
  lacked): one active ability per `HULL_CLASS` on a cooldown, drawn on the pad
  as a fourth verb — scout **форсаж** (3 s ×1.6 thrust), courier **сброс** (dump one hold cell as a
  decoy), hauler **балласт** (turn ×1.5 for 4 s at the cost of 1 % cargo), miner **резак** (the drill
  as a short-range beam), warship **залп** (all groups at once, 8 s reload), yacht **сирена** (a hail
  every ship answers), survey **прожектор** (reveals every deposit range in view for 10 s).
- [ ] **М5 Six railways** (metro §6): Компания **Express™** (dashed twin line skipping small stops,
  ×10, an ad under the fare — «на три секунды быстрее!», and it is); Орднунг boards only with the
  hold declared («ДЕКЛАРИРУЮ»), doors on the second; Коммуна greyed on strike days and at lunch;
  Рассвет **маршрутка** — «до куда?» — tap the map — «ну поехали», stops at any system on the line;
  Хай-Фронт «обновление установлено», the line stands a minute. Closed front stops on the scheme.
  **М6 Economy and growth** — fares, baggage, the size rule tuned; a holding-built station
  («продление линии», a late holding deed, named by the generator).
- [ ] **Ж5 The bazaar that remembers** — in heartland belt systems a knot of moored hulks (fleet
  art), awnings, lights on strings; odd lots; scarred hulls cheap; **`G.thrown`** (12 entries) —
  what you discarded in ОПИСЬ returns to a stall at ×3, «ношеная, один хозяин».
- [ ] **Д3 Подписка** — firm parts and base modules: 10 % up front + 4 %/сводка (owning wins after
  ~23 сводок; the card says so); a lapse only at a сводка boundary, announced a shift before in
  ПОЧТА; in a fight **ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3** for one сводка; at renewal the tariff «обновлён» —
  same price, one feature fewer, sold as an add-on; a lapsed base cold store stops giving, never
  takes. **Д4 A second core — rented** (the ИИ-ядро already exists: `12f-mgr-ai` — built for
  `AI_COST`, takes a human's seat, no cut, and a hidden drift that ends in decisions you never gave). Хай-Фронт
  offers the other way: **a rented core on a tariff** — БАЗОВЫЙ (free, an advert in every third report),
  ПРЕМИУМ (route prices, a real forecast), СЕМЕЙНЫЙ (opinions on how you live); it does not drift, it
  downgrades itself when unpaid and apologises; the four-seat rule holds for both. The choice is the joke:
  your own machine that slowly stops asking, or theirs that never stops selling. Kindness: on the free
  tariff it skips the advert once when your base is burning.

### Second pass over the whole plan (14.09) — seams, the standing checklist, new mechanics

**Seams found between systems (each is a line in the item it belongs to; listed here so they are not lost):**
- **MODS → the plan (К3).** Today `capOf` is shared by modules and parts; when tiers become
  densities, `hold`/`tank`/`weapon`(reactor)/`armor` are densities per cell, `engine`/`hyper`/`drill`
  stay station upgrades on the hull's constants — one mapping table in К3, and the fixpoint suite
  covers both halves. Densities are per hull size (nominal ÷ typical cells), never shown as a number.
- **Drones and the far goods (Р1).** Drones never mine band-2/3 goods and sell band-1 goods at the
  band price (½) — otherwise a drone on a rim жила prints money offline.
- **The stamp and the metro (Б2, М4).** A stamp lands only on arrival by jump or on ВЫЙТИ, never on
  a stop passed through; the gesture fires on both kinds of arrival; the ring's «Стыковка?» hail
  fires only when heading into the ring, not when thrown out of it.
- **The first hour (Б1, М3).** In the home system the gesture *is* ГЛАВТРАССА's and is the first
  hour's first line; the замполит hands the newcomer one жетон («первый — за счёт трассы») — the
  metro is met in the first hour, not found.
- **Rescue and rails (`16c-rescue`).** A dry ship at a rail stop gets a third exit beside ДОМОЙ /
  БУКСИР: **НА МЕТРО** (a ticket home for its fare).
- **The scheme's scope (М1).** The paper shows your line, the rings it meets and their neighbours;
  pinch/scroll for more — never the whole infinite net. «Край» is per player (no shared state).
- **К9's place on the pad.** The two permanent buttons stay; the special system is the ДЕЙСТВИЕ pad's
  **long-press** with its cooldown drawn as the pad's rim — no third button over the world.
- **Replays (0.1, P9).** The fixed step and the seeded entry angle each move every recording and
  same-hash suite once: one `-Accept` per change, named in the patchnote, `91zzzzzzzzb-replay` re-based.
- **The stage-0 gate is re-run after every stage** — each stage adds raster (the galaxy bake, the
  lane, neon, the ride); a stage that breaks the gate is not closed.

**Standing checklist for closing any item of stages 2–7:** new `G` fields in `snapshot()` or
`SAVE_EPHEMERAL` with a reason (the savenet goes red otherwise) — the batch introduces `G.stamps`,
`G.draft`, `G.thrown`, the ride `{line,from,to,t}`, tokens/tickets, hull orders, scars, warranties and
subscriptions, parcels · goldens re-shot for the scenes touched (`-Accept`, `-Mobile`, 1440) · a new
visual system gets its almanac issue (neon, the blueprint, the ring) · the oracle lines green · the
stage-0 gate · one running gag and one kindness named in the patchnote (the humour law) · old save
loads.

**Release checkpoints (a push after the whole run):** after stage 0 («кадр»), after 0b, after
stage 2 («чья земля»), after stage 3 («дорога»), then per stage.
**Two laws over every stage (14.09, after an outside read of the plan):** (1) **causality is real** — a
mechanic is accepted only if it changes a decision the player makes later (transit plates → the route
you choose; the stamp → the passport → the cheaper road); a gag with no consequence is cut, however
funny; (2) **the twenty-minute exam** at every checkpoint — the author plays twenty minutes and answers
one question, «захотелось самому сделать ещё рейс?»; «нет» leaves the stage open whatever the tests say.
The game today carries its world in text (the hundred stories, rumours, the cantina, the books); the
material consequences are the part that does not exist yet — that is what stages 2–3 are for.

**New mechanics — grown out of the seams (Н1–Н13; each names its stage):**
- **Н1 Попутная посылка** (st. 3, with Д8): at a vestibule Космопочта asks you to carry a parcel to
  a stop on your line; delivered by ВЫЙТИ there — a few кр and a rumour; the parcel is a hold row.
- **Н2 Проездной** (st. 3): ГЛАВТРАССА's monthly pass — the one subscription in the game that is
  fair (pays off at 12 rides, the card says so); stamped in КНИЖКА each ride.
- **Н3 Попутчик** (st. 3): a passenger at the vestibule asks to ride with you — pays their fare,
  talks during the ride (the passenger table, M156), leaves a rumour.
- **Н4 Проводник** (st. 3): on the скорый the one human of the railway brings tea in a
  подстаканник — crew fatigue eased, one rumour; the kindness of the whole railway.
- **Н5 Госзаказ на билборде** (st. 5, Ж2 + Р3): «ПЛАН: 40 ед. осмия до сводки 118» — a fixed
  price for whoever delivers, a КНИЖКА stamp «УДАРНИК», the сводка reports «план выполнен на 103 %».
- **Н6 Ажиотаж** (st. 3, Р2 + М5): after a ЖИЛА rumour the line adds a train to that stop «по
  многочисленным просьбам трудящихся», the полустанок's prices spike, the approach fills.
- **Н7 Дипломатический паспорт** (st. 5, Б2): all six border stamps + Ялта's → the замполит issues
  a passport: free rides for a week, and the Орднунг form asks one question fewer.
- **Н8 Покупки за рубежом** (st. 4, К5): a part bought in a power's land carries that yard's habit
  (an Орднунг shield is front-heavy, a Коммуна turret turns wider) — shopping abroad matters.
- **Н15 Постановка на учёт — утильсбор** (st. 6, with К6/Н8/Б1/Д11; the author 14.09: «купил корабль
  — тебя останавливают, надо на учёт поставить»). A hull bought or ordered in another power's land
  flies on **транзитные номера** — a paper plate stencilled on the flank, valid 3 сводки. On the first
  arrival under your own flag the picket stops you: «постановка на учёт» — **утильсбор** («сбор за
  будущую утилизацию», by hull mass, the dearest for a dreadnought that will never be scrapped),
  form 2-ТС in three copies, a queue number at the ПАЛАТА, one сводка of waiting; until then no
  home yard buys or re-plans it, the foreign гарантия is void, and every picket stops you again
  («транзит просрочен» — a fine, and the plate is drawn crooked). Registered: your flag's number
  replaces the paper plate — the slogan of a ГЛАВТРАССА yard is never touched. Kindness: the
  inspector waves you through once, «до понедельника», and writes nothing down.
- **Н9 «Успеваете скорым»** (st. 3): ДЕЛО reads the timetable — a job with a deadline says which
  train makes it and when it leaves.
- **Н10 Пломба** (st. 3, М5 Орднунг): a declared hold is sealed at boarding — nothing sells from it
  until arrival, and pirates at rim stations do not touch a sealed hold (they fear the form).
- **Н11 Отзыв партии** (st. 6, Д3): Хай-Фронт recalls a part model — «партия отозвана», a free
  replacement at their yard; kept, the old one becomes a scar.
- **Н12 Компенсационная маршрутка** (st. 6, М5): on a shut stretch («временные трудности») Рассвет's
  bus runs along it stop by stop — slower, and the driver knows why the line is shut.
- **Н14 Общества и льготы — membership** (st. 5; the author 14.09 on the маршрутка's driver who
  knows why the line is shut: «это КГБ прям, можно примкнуть к гильдии — какие могут быть и какие
  льготы»). A society is joined by a deed, not a fee; a **членский билет** goes to ВЕЩИ; dues are
  always a shown line (the manager-cut rule); leaving is free, rejoining costs; each has one duty
  and one joke. **Профсоюз водителей** (ГЛАВТРАССА; 100 jumps): dues 2 % of earnings; льготы — a
  путёвка to the sanatorium once a season, the проездной at half, «тринадцатая» from the pool at
  year's end; duty — a субботник each сводка or a line of shame in КНИЖКА; the union paper on ПОЛКА.
  **«Знающие»** — the маршрутка drivers' society (Рассвет; ride ten times and answer «до куда?» with
  «а куда все»): they know everything and say it only over tea — льготы: the reason behind every shut
  stretch, ЖИЛА rumours a сводка early, the bus stops for you anywhere; duty — carry one parcel a
  week without asking what is inside (it is always jam). **ДОСО, добровольное общество стрелков**
  (a score on the стрельбище): free ammo on the range, guns cheaper at ГЛАВТРАССА yards, a named
  target barge; duty — shoot the range monthly. **Товарищество кулибиных** (ten taped repairs): tape
  holds 60 %, the master's seam free, «сделаем из ваших» everywhere; duty — fix one stranger's ship
  per сводка. **Общество спасателей на трассе** (three tows given): your own БУКСИР free for ever,
  the rescuer's word (war §6.4); duty — answer a distress call when near. **Клуб дачников** (a
  greenhouse): a plot with a hut on a greenhouse world, jam as currency at the canteen; duty —
  bring seedlings. **Клуб филателистов ОТМЕТОК** (four stamps): trade rare stamps, the pirate scratch
  as the prize; no duty — meetings at the hotel. **Общество читателей** (ten books on ПОЛКА): a
  Коммуна station lends a book per ride. **Партнёрская программа™** (Компания; free to join, the
  only one that advertises): «льготы» are coupons that expire and points that convert into points;
  the cashier whispers «не вступайте». Several at once are allowed — the dues add up, the duties
  collide, and the desk shows the arithmetic.
- **Н13 Волокита — the paper chain** (st. 7, Д12; the author 14.09: «надо прям заебать игрока
  бюрократией»). Any animal — the farm beast, **the parrot the player already has** — rides the train
  or crosses a border only with papers. The ПАЛАТА needs **N documents, N rolled 2–10** per animal
  and never told: справка о прививках · акт о некусаемости · выписка из реестра фауны · согласие
  соседей по ангару · форма 7-ЗВ «о намерении перевозить» · заключение о совместимости с
  грузом · характеристика от участкового · копия копии. Each is signed by **a different official at a
  different station** (by seed, across powers — the Орднунг one wants the form in three copies, the
  Коммуна one is at lunch). You arrive with the pile — «вам документа не хватает» — one more, until
  N. **The hope of a shortcut**: the clerk hints «можно ускорить» → a side job (jam for the inspector,
  a parcel to his cousin) that ends in a stamp «ПРИНЯТО К СВЕДЕНИЮ» and changes nothing. The loop is
  the joke and it is honest (§22): the desk shows the pile and «ещё документов: неизвестно».
  Kindness: the last official signs without reading — «ну сколько ж можно, летай уже» — and that
  signature is the only one with a name. **Animals to invent later** (the author): a table of
  species per world with a quirk each, in Д12's row.

### Release tails — any gap, all before a push

Determinism: `wanderer · A` reads real chance or time on the corridor's buy path
(`wanderBuy`/`wanStep`, 24c) — find it, move the scene; the clock out of `stateHash` (still mixed in: `08a-statehash` ~79 `mixN(now())`; decided
11.09: a separate field, `T.state()` returns both — today it returns `{hash,snap,purse}` and `T.clock()` apart); `planetStripTick` by `wallMs()` writes `stripLvl`
into hashed state. Housekeeping: ~~the `.gz` cache headers~~ and ~~the PATCHNOTES trim~~ — both found done 14.09; the patch-bump rule (tests/tools/docs → patch; `src/` → minor after
`-Mutants` green). Tests M443–M446 open items (below). The refactor queue (below). M451 the sky
from the galaxy model. The 60 fps check re-run at the release. «свет: звезда — самое светлое» red
once in the pane (the cumulus, `CLOUDS_OFF`) — one look, then strike. A per-suite dirty-page check
after `fn()` — not built.

### Stage 7 — the base and the giants (`DESIGN-birchpunk.md` §4.3–4.7, `DESIGN-life.md` §3.6)

- [ ] **Д12 The farm — одомашнивание.** A beast of a planet (`20f-fauna`), calmed by the probe or
  a net, taken to a base with a **ферма** module; a name (Зорька, Пеструшка, Бурка…) and the
  ПАЛАТА's QR-plate (the клеймо on a beast); a slow trickle of its world's good — organics, carbon,
  xeno, on deep worlds чернозём — **only while someone talks to it** (a hand on the farm or the
  player landed); a far beast gives a far good; never lost, homesick after a move (half yield).
- [ ] **Д13 Баня and чайный гриб.** A base module **баня**: fatigue resets on a bath night (the С5
  axis on managers); an inspection at a base with a баня finds one thing fewer — the inspector
  «заодно попарится» (honest man, likes a bath). **Чайный гриб** — a director event (base §10): the
  greenhouse culture overgrows, yield ×2 for three shifts, then it eats the base's organics; an
  аврал cuts it back; the cut sells to Рассвет as «чайный гриб».
- [ ] **Д14 The blockade's voice, and «Буханка».** The blockade exists (`occLvl≥2`, `12-economy` ~223:
  drone circles stop, barges stand, the H1 battery lifts it); what it lacks is the voice — the occupier's
  wave says the shelves are full and the others suffer, the counter is empty and pays **×2** for food, fuel
  and parts; running it is legal for a neutral, the pickets hail you and you answer by speed. **«Буханка»** — the
  base's surface–ship shuttle as a named machine (Д1), a boxy old van with engines, always a bit
  broken, **the one machine the player may rename** (from the name table, no free text).
- [ ] **Ж6 One giant per arm.** Each arm and the core get one colossal structure 20–50× a ship,
  named in the galaxy's voice: a hollow moon with a mining town lit in rings; the Коммуна's dry dock
  where one hull has been built for three hundred years; the Компания's cylinder with its logo
  along its length; ГЛАВТРАССА's «Дом водителя» the size of a station; Орднунг's customs city where
  every building is a form; Хай-Фронт's relay garden; Рассвет's belt town in the rocks. A landmark
  on the map and a ruler in the frame. (The Ring, M154, is not one of these.)

**Cut for good, so they are not re-invented:** six musical modes (→ a motif each, Б6); the tunnel
with walls and station halls; the trust rating; the lab restart until a CPU budget per session.

**Decisions of 14.09 (the author's, not re-litigated):** the hold and tanks are cells · the metro
is a real station in the system, not an abstract ring · rides are seconds to a minute · the net is
procedural and infinite · jumps stay for near · «пока только в план пиши».

## Next — after M321 — closed (the queue of 2026-09-03 and §18.8); body moved to `docs/PLAN-archive.md` (2026-09-11)

## «Сорока» — the wanderer queue (M340–M346, 0.339.0–0.346.0, closed 2026-09-05) — body moved to `docs/PLAN-archive.md` (2026-09-11)

Design: `docs/DESIGN-wanderer.md`. The queue, its decisions and the M351 cooperative answer live in the archive — grep «Сорока» or M34x there.

## Closed milestones M354, M355, M357, M359 (0.352.0-0.357.0, 2026-09-05) — bodies moved to `docs/PLAN-archive.md` (2026-09-08)

- **M354 deep tests** — the seven cross-cutting nets over the topic suites.
- **M355 does the button do what it says** — an action button names its action and takes its verb from the prompt.
- **M357 hunting by search** — the game reads its own source and checks every name called by string.
- **M359 the evidence, the hands, the things** — the ledger, the players' hand, the objects that stay.

## Side passes of 2026-09-07 — all built; bodies in `docs/PLAN-archive.md` (sections of 2026-09-10 and 2026-09-11)

## Tests — M441–M446 built (0.428.0–0.437.0); bodies in `docs/PLAN-archive.md` («Moved 2026-09-14»)

`docs/DESIGN-tests.md` holds the rule of place; the 809 old suites are frozen. **Open, each a commit in a gap:**
`TEST_T0` is local noon · drawn-vs-undrawn hash (a detector owed) · tools' self-test before the net · not
caught yet: the .55 auto-brake, the money-printing counter, idle drones · partial: helm switching, sharpness at
DPR 1, contrast under a vignette · goldens per platform when the lab runs (`@lab.json`) · M444: cooperative
walk, drags/wheel, map per window · M445: a `DPR=.5` mutant · M446: previous-version diff, `look()` telemetry.
The lab is **stopped since 11.09** (CPU 57 % of a day vs 50 %): a CPU budget per session before any restart.

## Refactor audit (0.438.0) — done items in `docs/PLAN-archive.md` («Moved 2026-09-14»)

M441–M446 stand; the defects were in the tooling. **Open queue, each a commit:** `detStuck`'s key law (fires
only on a diff of exactly 0; soften with the silence table) · a shard hangs now and then (900 s ceiling kills
it; `--enable-logging=stderr` on laptop runs so it names its suite) · the source net is line-based and the clock
law skips `tests/` (41 raw calls) · long functions on touch only (27 over 200 lines) · tools zoo → one way to
take a frame · the button family merge (~12 s → one table) · `-Times` for the Node tier. **Rejected:** a
palette module, a `G.mode` table, removing `typeof` guards, a schema-driven `applySave`, uncommitted `drift.html`.

## The frame is the judge for anything the player touches (M437) — the four lessons live in `docs/DESIGN-tests.md` («The frame is the judge», moved 2026-09-14)

## Loose ends — housekeeping (bodies in the archive, 2026-09-14)

**Needs a decision from the author:** nothing — every fork was decided on his behalf (below).
**Systems:** the DPR-2.5 stalls are stage 0.4; the freeze item (M234/M238/M417/M418) stays closed
until a stall that is not a bake shows in `crash.log` (`stallWho`, 0.448.0). **Housekeeping:**
PLAN.md stays under 100 KB (60 → 100 on 14.09, the author's exception: one working plan for everything) (`build.ps1` warns; a closed item leaves one line, its body goes to the
archive in the same commit) · push only after a green run, run and push in separate commands · a
dirty page still surfaces on its neighbour (a per-suite check after `fn()` would name it — not
built) · tiers, switches and cost: `CLAUDE.md` «How to verify», `docs/VERIFY.md`.

## Closed 2026-08-28 → 2026-09-02 — one line each, moved to `docs/PLAN-archive.md` (2026-09-04)

## Done — struck items moved to `docs/PLAN-archive.md` (2026-09-04)

## Open by design — M125–M127, M131–M132, the yacht railing, P9b settlement recursion, holding deeds without counters; body in `docs/PLAN-archive.md` (2026-09-14)

## «Зачем лететь» — moved to `docs/PLAN-archive.md` (2026-09-04); its answer is Act I

## First three — built; body moved to `docs/PLAN-archive.md` (2026-09-04)

## The arc and the holding — built (M225–M231, M289–M298); `docs/DESIGN-holding.md`; bodies in the archive

# ~~The war — M360–M388~~ — closed 0.388.0; `docs/DESIGN-war.md` §18 holds the struck queue and «Deferred»; body in the archive

## Decisions taken on the author's behalf, so they are not re-litigated

- **2026-09-14, the author.** The hold and tanks are cells of the plan · the metro is a real
  station in the system with a real gate, not an abstract ring · a ride is seconds to a minute ·
  the rail net is procedural and infinite · jumps stay for near · «пока только в план пиши» ·
  optimisation first · the plan names no games and no films — this is ours.
- **Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

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
