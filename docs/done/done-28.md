<!-- docs/done/done-28.md — part 28 of 30 of the done work, in the order it was written; see README.md -->

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
rewritten — M488 (the ИИ-ядро exists), M498 (the blockade exists); a name collision fixed — `G.plan` is the
industrial plan (`11r-plan`), the blueprint is `G.draft`.

### ~~DESIGN PASS — the queue~~ — closed 23.09 (D1–D26, then the «[design owed]» markers: yard marks M480, the Орднунг ring M456, the ПАЗик M510, membership cards M512, the Чебуречная M462, the rush M504, the «Смена» reader P15; found on the way and fixed: the approach lane drifted off its orbiting station). Body in `docs/PLAN-archive.md` («Moved 2026-09-23, the design pass»). Left: M457 is an ear pass, not a picture.

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
   next frame work after the phone number: what eats landing and surface.
   **Looked into the same day (Control, real clock, own headless Chrome):** at the PHONE's size
   (390×844) landing/surface hold 57–60 fps with the frame's JS at 3.4–4 ms; at the laptop's
   2560×1600 canvas they drop to 46–49 fps with JS still 4–5 ms — the same wall as on the phone,
   paint area, not our code. The deep g11's gains from `drawStrata` and `geoFaultAt` (+8…+11) are
   the chunk bakes in the first seconds after the probe stages the scene: both are only called while
   baking a ground chunk (`18b-geology`, inside `drawStrata`), and over 8 s of steady landing there
   were 0 re-bakes and no DPR change. So the laptop gate is a question of resolution on a big
   canvas (`gfx.res` auto should step down there), not of a leak — decide with ×1.5 (step 2).
5. **Frame acceptance of the baked star core and hull** against the Designer's four risks: the
   star's pulsation and corona, the ship's lights and nozzles, a step at the baked picture's edge, a
   one-frame lag of the baked picture in rotation. Control's side-by-side at ×2 found none; a frame
   from the phone is still owed. Two of the four are closed by construction: **no lag** — the picture
   is laid down in the same `drawHull` call under the frame's own matrix, never a frame's old one; **lights
   and nozzles** are not in the picture at all (flames, nozzle glow and nav lights are drawn live).
   Left for the eye: the star's breathing (the core's alpha is still live) and a step at the edge.
6. **Tails at ×2.40 for the author's «куцые хвосты»** — filmed on the phone (headless hangs after a
   few dozen thrust frames and cannot film them).
7. ~~**Split `src/16a-space.js`**~~ — moot after the ray revert (item 0.4).
8. **Release** (Control): `test.ps1 -Accept` for goldens (the hull and the star changed pixels),
   `-Full`, `-Mobile`, `-Mutants`, the Node tier, PATCHNOTES lines, push, md5 of the three site files
   after deploy.

**Author's decision 18.09:** «давай по порядку, да делай без тел, потом пройдемся все померяем,
отдельно веха тесты на тел». Work goes on WITHOUT the phone, in plan order: Stage 0b item by item,
then Stage 1 (P8, P9, P10). Every phone measurement above (steps 1, 5, 6, and each item's own phone
check) is collected into **one separate milestone — «phone tests»** — run after, in one sitting, by
the Tester's protocol below. Items whose only proof is the phone are built and marked «phone owed».

Findings of 17–18.09 not recorded elsewhere:
- **Law of the frame for any cut or bake (Designer):** protect the thin trail line, the one-pixel
  stars and the depth of the void (the nebula's glow). The ribbon only with a frame in hand — cut the
  thread's thickness, never its length.
- **Designer's instruments** (her scratchpad `…\9711c220-…\scratchpad`): `skips.py <video>` — share
  of double movement steps, per-second profile, a frame at each skip, counted from OUTSIDE the game;
  `layers.js` — the frame's calls and painted area by caller; `dpr/author_sheet2.png` — the sheet for
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
- [x] **0.3 Layout reads** Body in the archive.
- [x] **0.5 Tester's queue, closed by Control 18.09** Body in the archive.
- [x] **0.4 `src/16a-space.js` crossed the 40 KB build guard** Body in the archive.
- [x] **0.1 Cadence** Body in the archive.
- [x] **0.1b An even tact** Body in the archive.
- **Gate, honestly: half taken** (RES_AUTO holds at 2 on the S23; the cadence gate is the phone milestone's) — full status in `docs/PLAN-archive.md` («Moved 2026-09-18, third batch»).
- [x] **~~THE FRAME IS BISTABLE~~ — withdrawn by its author 18.09;** Body in the archive.
- [x] **AUTHOR'S CALL: ×1.5 in flight** — decided 18.09 «темнее не надо»: the switch stays OFF (D3). Body in the archive.

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
- [x] **Longer tails** — closed by D2 (the Designer's pick: the bright third ≈ 200 px at ×1). Body in the archive.
- [x] **0.2 Raster** Body in the archive.
- [x] **0.2a The haze over the nozzles — the frame's real bill.** Body in the archive.
- [x] **0.3 Layout in the frame** Body in the archive.
- [x] **0.4 Resolution that comes back** Body in the archive.
- [x] **0.5 Sound** Body in the archive.
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
