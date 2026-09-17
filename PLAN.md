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

### Stage 0 — THE FRAME FIRST (author 14.09: «разрыв кадров, дёрганье — это первым»)

Numbers: `docs/PLAYTEST-2026-09-13.md` §2.1, §6. Meter: `docs/night-2026-09-13/raw/phone-tools/trace.py`
on the S23 (390×844, DPR 2.625, 120 Hz) before, after every item, at the end; `g11` on the laptop.
Rule 3: same look, cheaper work.
- [ ] **0.1 Cadence — built, open until the S23 says so.** The world's *ship* steps in whole
  1/120 s quanta (`WORLD_SUB`, `08-state`; the loop lives in `updateSystem`), the leftover is
  carried and may go half a quantum negative, and the step count is `Math.round`, not `floor`.
  Everything else in `stepWorld` — emitters, particles, neighbours, timers — still runs once per
  frame with the summed `dt`. The first version stepped the *whole* world n times and was a
  regression on the phone (tester, 17.09: `stepWorld` 0.71 → 9.77 → 14.68 ms/frame, `WAKE`
  492 → 1938 points, cadence 68 % → 50–63 %) because emitters seeded per call and the raster grew,
  which made the frame longer, which bought more quanta. Good news from the same run: the nose
  step spread fell from 9.5× to 2.9×, so quantising the ship is the right lever. After the fix, the
  six-frame emission probe reads 6/32 against 6/30 on `main`; the step histogram (2 400 frames at
  120 Hz with ±1 ms jitter) is 1 step in 92.6 % of frames, 0 in 3.7 %, 2 in 3.7 %; at 60 Hz with
  ±2 ms it is 2 steps in 90.2 %. **Accept on the S23** (tester): `stepWorld` ≤ 1.1 ms/frame,
  `WAKE` ±20 % of base, cadence ≥ base. Body in `docs/PLAN-archive.md`.
- [ ] **0.1b An even tact** (Control, from the author: «на тел дергается все прогоны, плавный полёт
  нужен»). A 120 Hz display asks for an 8.3 ms frame we cannot pay; the swing between 16.7 and
  33.3 ms *is* the judder. Target tact (`28-loop`): 60 by default, i.e. every second vsync — a
  frame that arrives sooner than ~0.75 of the target returns without work (and clears `FRAME_IN`);
  120 is allowed only while the EMA of frame *work* stays under 6 ms for 5 s, and drops back over
  7, with the hysteresis of 0.4. Needs the world back at ~1 ms first. Accept (tester, S23):
  cadence ≥ 95 %, no frame > 24 ms in 60 s of steering.
- [x] **0.2 Raster** — the wake and the thrust ribbon were a stroke per segment (two for the
  wake: halo and core). They now go in steps of fade per lane, one path per step, the halo and the
  core sharing that path. The step is chosen by the *mean of age and brightness*, 32 steps on the
  wake and 24 on the ribbon: steps even in age banded the bright end (the designer measured a saw
  with a dip every 30 px along the tail), steps even in brightness lumped the whole dim half of a
  lane into one step and left a seam where it began. Quantisation error of the drawn alpha against
  the exact one: ≤ 2.4 % of peak on the wake core, 2.1 % on its halo, 2.3 % on the ribbon — about
  three units of 255 where the designer allows eight. Strokes per frame on a filled wake (1 560
  wake points, 156 trail): 3 391 → 565, paths 3 476 → 458. Each step averages the finished alpha
  and width, not the age. Body in `docs/PLAN-archive.md`. Frame acceptance is the designer's paired
  `straight_cmp` shot; `hud`, `drawHull` and `drawSystem` were left alone (laptop `g11` drifts
  10–20 fps between runs of the same build, so their 6–25 ms/s cannot be told from the noise —
  the S23 is the meter for them).
- [x] **0.3 Layout in the frame** — zero DOM reads per frame and per pointer event, measured:
  `system`, thirty steady frames and thirty pointer moves in flight and on foot, all counters 0
  (before: 5 `getBoundingClientRect` + 5 selector queries **per frame**). The canvas and pad rects
  live in a cache invalidated by `resize()`, orientation, scroll, tab change and a narrow
  MutationObserver; «is a screen open» is a cached flag behind an observer instead of three
  `querySelector(".scr.open")` calls a frame; the floor/band measurement runs only on a dirty
  layout. The counter itself is in the game (`15d-domread`, `?domread`, asleep otherwise) so a
  detector can assert it. Body in `docs/PLAN-archive.md`.
- [x] **0.4 Resolution that comes back** — the climb window is 5 s (was 20), the two-climbs-a-session
  cap is gone, and both thresholds are now fractions of the *target* frame rather than fixed
  milliseconds: down above 1.45× (24 ms at sixty, as before), up below 1.05× (17.5 ms, i.e. 57 fps
  — the old 13 ms is unreachable on the phone even at ×1). Dither is held by a penalty, not a cap:
  a climb that survives less than 30 s counts as a mistake and the next attempt waits a minute,
  then two, up to a quarter hour; a climb that lives resets the penalty. The voice speaks of a
  change at most once a minute. A latent bug fell out with it: with the player's 30 fps cap the
  steady 33 ms interval read as a stall and the game kept dropping its own resolution. Checked by
  driving `resAuto` with synthetic intervals: 12 s heavy → ×1, 14 s light → ×2, a climb knocked
  down inside 30 s arms a 60 s wait and then doubles it, steady 18 ms moves nothing, 33 ms under a
  30 fps cap moves nothing. **Not verified:** «`RES_AUTO ≥ 2` held for 10 min» needs the S23.
- [ ] **0.5 Sound.** The convolution reverb («Reverb convolution background») holds ~250 ms of every
  second — it is `createConvolver` with a synthesized 5.5 s impulse in `10-music` (~154): a shorter
  impulse or a feedback-delay reverb of the same room, and off on `W<=760`.
- [ ] **0.6 GC.** Major GCs of 14–28 ms inside the longest gaps — hoist per-frame allocations
  (arrays, closures, strings in `hud`/`drawSystem`); the trace's allocation sampler names them.
- [ ] **0.7 Heat.** 75 min → thermal MODERATE, 37 fps at ×1. The sum above is the fix; the check is
  a 30-min run with `dumpsys thermalservice` logged every minute.
- **Gate to stage 0b:** cadence ≥ 95 %, no frame > 24 ms in 60 s of steering, `RES_AUTO ≥ 2`,
  `g11` ≥ 55 fps in every mode on the laptop.

### Stage 0b — cheap and decided (one commit each)

- [ ] **P1 Scroll, globally** (§1.1): table pages rebuild with `textContent=""`/`innerHTML=""`
  (`27j-ui-opis`, `12ud-smena`, `25g-postcard`, `11ap-relay`) and `logAdd`/`recordAdd` re-render
  the table on every line whatever page is open — 448 → 0 measured. Keep `scrollTop` through any
  rebuild; re-render only the page a change touches. Net: scroll each page, fire `logAdd`, demand
  the same `scrollTop`.
- [ ] **P2** ОПИСЬ: an opened card is `touch-action:none` (`style.css` `.opis .op-card.on`, ~1434) — a 150 px dead zone; let vertical pans
  through, keep the long-press lift, guard the lift against a re-render (§1.2).
- [ ] **P3** ОПИСЬ tab strip: stretch it; its fade mask never clears — it skips `tabsSync` (§1.3).
- [ ] **P4** Compass chips follow `helmStickFoot` (in `drawSystem`) up to mid-screen — keep them on
  the frame's edge (§1.4).
- [ ] **P5** «Смена» text light-on-cream, contrast ≈ 1.1:1; styles never moved to the paper; no
  right margin (§5.1).
- [ ] **P6** Hints cut at 411 px, МАСШТАБ under a chip, the beacon offered at the ship and wasted at
  0 m, КНИЖКА «хулк» and «командировочные за 0 км», the `celDay` column out of order (§1.5, §1.6, §4.4).
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
