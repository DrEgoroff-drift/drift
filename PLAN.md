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
rewritten — M488 (the ИИ-ядро exists), M498 (the blockade exists); a name collision fixed — `G.plan` is the
industrial plan (`11r-plan`), the blueprint is `G.draft`.

### DESIGN PASS — the queue (the author 18.09: «дизайн проход прям с этапа 0»; start it with «давай дизайн проход»)

Everything Control built from Stage 0 on is a working draft; the picture is the Designer's. A new
session that hears «давай дизайн проход» starts HERE, top to bottom, one item per commit. Method
for every item: read the craft codex (`docs/DESIGN-craft.md`) and the art-direction memories; a
frame BEFORE on the phone layout (390×844, own headless Chrome, or the S23); self-critique in
passes (draft → critique harder than a stranger's → optimise); fix IN THE GAME, never in the frame;
a frame AFTER; a sheet before/after to the author; the check that can be a test goes into tests.
Remove the item's «[design owed]» marker in its stage when done. Phone cadence is not this pass's
job (the phone milestone), but no fix may add raster cost without a number.

**Stage 0 — the frame**
- [x] **D1 The baked hull and star core — done 18.09 on the S23.** Bake A/B at ×8: no step at the
  edge, nav lights and nozzles sit on the bake; the core breathes (47 k px change over 5 s). What
  was ugly was the star's four rays: one hard-edged wedge each, a paper strip a thousand px long
  by a giant — now three nested wedges (edge .11 rad at .28, axis .04 at 1). Left: the giant's
  corona washes the whole phone frame one orange (pair 0) — legitimate up close, no rim light on
  the ship; if it bothers the author, a cool rim on the hull from `lightDir` is the next step.
- [x] **D2 The tails — done 18.09 on the S23.** Found on the phone: under the finger the main
  engine fires only while accelerating (135 of 266 frames), at cruise the assist holds speed with
  thrust at zero and the ship flew with NO plume — towed. Now the helm reports `idle` (assist, no
  main, speed > ¼ cruise) and `trailStep` keeps a sustaining plume at .42 span, .72 radius, same
  lane. The wake: `WAKE_LIFE` 60/200 → 40/80 and the core fades by u⁴ — the three rails no longer
  run into the HUD; the author's length pick (A–D) never came, so this is the Designer's: the
  bright third ≈ 200 px at ×1. The stick's filled band .44 → .32 (it read as a solid cup on black).
  Test `кильватер` retuned to 700–1400 units.
- [x] **D3 ×1.5 in flight — the author's call 18.09: «темнее не надо».** The switch stays OFF
  (`G.opts.gfx.resByMode`); the sky keeps its light. Closed.

**Stage 0b / 1 — the interface and the finger**
- [x] **D4 The station header — checked on the S23 18.09.** One row and the paper СТОЛ tag were
  already in; what the phone showed: the row cut off at «КОРАБЛ» with a flat edge (the fade mask
  lived on `nav.tabs` only — now on `nav.groups` too, off when scrolled to the tail), and on an
  empty hold the market opened with four grey caps blocks before the first price — the empty
  hint now sits in the ТРЮМ line («ПУСТ — ПЛАНЕТА ИЛИ ПОЯС»), one block fewer. The board reads.
- [x] **D5 The hail — checked on the S23 18.09.** The window's safe/risk colours were right; the
  PAD was not: under a hail the ДЕЙСТВИЕ pad is `.ready` and its `breathe` animation painted the
  ring amber over the consequence colour — a dangerous «ПРОХОДОМ» breathed like a recommendation.
  Now the ready pad breathes red (`breatheRisk`) or phosphor (`breatheSafe`) by `data-hail-act`.
  Picket brackets (helmDrawMarks, M360) not re-judged here — no picket in the forced frame.
- [x] **D6 Under the finger — done 18.09 on the S23.** shipZ measured .8 / 1.04 / 1.4 at ×1 /
  ×2.4 / ×4.5 as P8 set it; the dead-zone СТОП ring reads under the thumb; the finger band is
  lighter since D2. The edge wall had NO picture — the anchor turned the ship and only a line said
  why; now `drawEdgeWall`: the rim fades in over the last 900 units as a wide soft band and a
  dashed line in the compass teal, with a breathing «упор» spot where the ship leans on it. The
  orbit body in frame (BODY_CAM) left as built.

**Stage 2 — whose land**
- [x] **D7 M459 the approach — done 18.09 on the S23.** The buoy was a dark cylinder with a lamp
  beside it — a bin. Now an instrument: lit body with a shaded side, black-and-yellow belt, red
  reflector, mast with a radar cross and the lamp in a cage; the lead lamp's glow 8+14 → 7+22 so
  the chase reads as runway lights. Queue ships against the station (≈¼ of it) read right; the
  order — ellipse, one landing, one leaving — left as built.
- [x] **D8 M452 the gesture ×6 — checked on the S23 18.09 (gt, or, co forced at the entry).**
  The character is there: the patrol with its cone, the scan line across the whole frame, the
  Коммуна board on its truss. Two things were too faint on the phone: the Компания screen drone
  was a 30×12 px colour crumb — ×1.35 now; the ГЛАВТРАССА spotlight cone .20 → .30. The post
  boards' lettering reads at ×1. km/ra/hf not re-judged this run.
- [x] **D9 M453 the stamp — done 18.09 on the S23 (all eight forced into the book).** The page
  reads as a document: tilted ink frames in each power's colour, the Компания slip as a white
  paper, the ×N counters. Ink grain skipped — at phone size it would be noise.
- [x] **D10 M454 the station by its builder — done 18.09 on the S23** (six
  captures with the ship re-placed by the orbiting station before each). The plate's ground went
  .12 → .2 and now reaches the core trunk (gradient mixed .3 with `makerGround`) and the solar
  panels (.22): Рассвет reads ochre, Компания white, Хай-Фронт pale, Коммуна blue-grey, Орднунг
  dark; the trade containers and the indust hoppers take the ground too (.3). Done.
- [x] **D11 M447/M448 the galaxy on the map — done 18.09 on the S23.** The home frame reads; at
  ×2.5 and ×5 the per-system glyph (halo, rays, station ring) stayed ×1-sized while the cell shrank
  to 9 px and a thousand glyphs made grey soup — the glyph now scales with the cell (`gk` =
  cell/45, floor .35) and fades to .4, station/belt rings off under 16 px: the arms and the bulge
  read at both. Bulge cap and speck colours left as built (they read once the glyphs stepped back).

**Stage 3 — far**
- [x] **D12 The ten far goods — the ТРЮМ piles done 18.09 on the S23; the reading 23.09.** All ten (and the amber
  chip) lay as same-shaped balls in different colours; now each is its own object in `holdPiece`:
  cryo cylinder (He-3), plate stack (palladium), drop with an inclusion (amber), heavy cube
  (osmium), sack with a sprout (chernozem), flask with filings (magdust), pearl in a shell,
  obsidian shard with one cold glint (dark glass), trap ring with a spark (antimatter), lead capsule
  with a yellow mark (neutron), amber chips. The wheel (§4.4) judged 23.09 and left: the ten already sit
  on ten hues AND ten shapes; the review's bone and pale gold were written for a dark hold and vanish on the ОПИСЬ cream paper (and `col` is the UI text colour too). The reading: `farReadShow` hangs an instrument plate for 6.5 s under the belt's entry text — each deposit a scale with its range as a lit band, the header naming the instrument's honesty (изыскатель ±10 % … рудовоз ±60 %): a good instrument is SEEN as a narrow band. ЖИЛА across the screen checked on the S23 18.09 — the orange stamp reads.
- [~] **D14 The blueprint — the ОПИСЬ view done 18.09 on the S23.** `drawPlan` is now a синька:
  Prussian blue with millimetre grid, white-ink cell lines, the hull outline thick along the
  edges with no neighbour, the hold hatched, parts as ochre stamps with a kind letter
  (О Щ Д К Р У П М), «СОГЛАСОВАНО» double-boxed in the corner. Same brush serves the КБ. Left:
  ~~the turret on the back in flight (M479)~~ — judged 18.09 on the S23: the cross read as a sight; now a bolted barbette, a domed turret lit from one side, a mantlet and the barrel over the dome.
- [x] **D15 Stage 5 voice — the tape done 18.09 on the S23; the drone's plate 23.09.** The strip was grey on grey; now
  black electrical tape with a glossy edge, a shadow under it and a folded tip, slightly wider —
  reads at ×4.5. The drone in both lists (ДЕЛО, the station's drone rows) is `droneTag`: a state lamp (green runs, amber in repair, red stuck under pirates), the name stencilled in the cargo colour on a riveted tin plate, the board number small, the quirk pencilled on a paper tag (none for «норма»).
- [x] **D13 The railway — checked on the S23 18.09 at «Луун»; map and ride 23.09.** The ring with its spiral, the
  dashed glide path and the «ЛИНИЯ 6-12 +2» label read in the system; the vestibule page (board,
  fares, life rows) reads. The map lines, judged at ×0.6/×1/×2.5/×5 with the whole net built (a stand
  shows 12 of 95 lines — `railNetPartial` builds one a frame): far out they are the right faint scaffold, but at ×1, where a route is planned, they vanished — now weight grows with the cell (`k=(cell-14)/34`): a dark casing and a denser core, metro-style. In the ride the other lines stay pale (`drawRailMap(...,pale)`, as M473 wrote) and the own line is a rail — casing, the scheme colour, a light centre line.
- [x] **D26 Giants — done 18.09 on the S23 (all seven captured at ×0.28).** Each body is now
  baked once (1500×900, 1 px per unit) by the room rules: mass → seams/rivets → a human-scale
  detail (landing strip at the moon's mouth, the hotel's parking row and marquee bulbs, the
  cylinder's porthole row and dock, the customs barrier and a stamp on every form-house, cranes
  on the dry dock and half the hull without plating, lamps along the town's street, mast shoes on
  the garden's platform) → one light from the star's side (`source-atop`). Live on top: the
  garden's blink, the moon's beacon, the hotel's red «МЕСТА ЕСТЬ», the cylinder's running light.
  The map mark is a glyph per giant (moon, slab, pill, grid, dock bracket, peaks, masts). Left:
  the ruler in the frame, docking/visiting — those are M464's open tails, not design.
- [x] **D25 Paper and stamps — the passport done 18.09 on the S23; the ПЛАН on the sign 23.09.** The passport was not on
  any page at all (only in fares); now a bordeaux cover with gold lettering under the stamp grid
  in КНИЖКА while it runs, with «до N смен». Then 18.09 later: the transit plate on the flank (`drawTransitPlate`, yellow with two black lines by the stern, baked with the hull), and M482's scars drawn on the hull (`drawScars`: burn patch, bent edge, leak streak). The ПЛАН on the ГЛАВТРАССА sign is a decree, not an ad: while `gosBbPlan` holds, the ticker gives way to a kumach panel with a gold star and two lines that STAND («ПЛАН: 18 ЕД. …», «ДО СВОДКИ · ПО · СДАВАТЬ ЗДЕСЬ»); ~~the recall letter~~ — done 18.09: a `recall` thing in ВЕЩИ with a Хай-Фронт header and a red «ОТЗЫВ» stamp.
- [~] **D24 Railway life — rows done 18.09 on the S23.** The parcel is a paper tag with a hole
  (dashed edge, ochre), the pass a card with a punched row, the passenger a phosphor silhouette
  before the line. ~~Left: the подстаканник for the tea row, the seal drawn on the hold in flight~~ — done 18.09: the Рассвет buffet button carries a glass in a lattice holder with a handle (CSS), the Орднунг seal is a lead disc on wire over the hold hatch at midships (`drawSeal`, in the bake key).
- [x] **D23 Album — the page done 18.09 on the S23; filters and the saved page 23.09.** The lightbox is a black album page with
  paper grain, the card sits in four corner mounts, the caption is white-pencil italic serif under
  the photo. The filter chips are thumbnails: the card drawn ONCE small, the five filters
  applied to copies (one repaint + five nail-sized pixel passes, not five repaints). СОХРАНИТЬ СЕБЕ writes the album page itself — dark grained paper, the card in a cream frame on four mounts, the caption in white pencil.
- [x] **D22 Rented core — the card done 18.09 on the S23; the adverts 23.09.** The three tiers are one glossy
  Хай-Фронт card (`.rent-card`): cyan-edged, head with the ◉ mark, tariff rows name / price /
  note, role buttons under each, the «спасибо, что остаётесь с нами» foot. The adverts in «Что он говорит»
  are `mgrSay(...,"ad")`, drawn as glossy Хай-Фронт inserts (`.mg-ad`, a blue РЕКЛАМА label); old saves' «Реклама: » lines are caught by prefix.
- [~] **D21 Special systems — done 18.09 on the S23 except two effects.** The charge ring is 4 px
  with a bright head at the arc's end; when charged the pad carries «ДОЛГОЕ · ФОРСАЖ» above it (it
  dims with the pad's own `.off` opacity — acceptable, reads on a dark sky). Effects: ФОРСАЖ
  lengthens the plume ×1.7, СБРОС leaves a crate where it was thrown, СИРЕНА sends two rings; the
  cutter beam and the searchlight cone were already drawn. Left: the salvo flash (ЗАЛП fires the
  guns, which flash themselves) — judged enough; БАЛЛАСТ has no picture (it is a number).
- [x] **D20 Барахолка** (M463) — done 18.09 on the S23: the hulks are real hulls from the table, dead under a dark film, moored at their angles; each carries a sagging canvas on two poles; the lamp strings swing lamp by lamp; the stall window is a table with a header and alternating rows, sold struck through.
- [x] **D19 Подписка** (M487) — done 18.09: a red «ЗАБЛОКИРОВАНО» seal stamped across the locked instrument's row in the shop, the «тариф обновлён» mail as a glossy white-and-blue letter in ВЕЩИ.
- [x] **D18 Scars** (M482) — done 18.09: `drawScars` anchors each scar to its place on the blueprint — the burn on a deck cell, the kink at a gun mount, the leak by a stern cell; «корпус помнит» rows under ПРИБОРЫ in ОПИСЬ name the scar and what it costs.
- [x] **D17 Космопочта** (M492) — done 18.09: the notice paper carries a drawn window — grille, the clerk under a warm lamp when open, a lowered shutter with «ЗАКРЫТО» when not, the clock above on post time, the hours plate on the wall, the printed talon when a notice waits; «распишитесь» stays the collection line.
- [x] **D16 СТАПЕЛЬ** (M481) — done 23.09 (solo, headless 500 px): `stapelSheet` (`26e2-stapel-draw`) lays the order on a slipway sheet — concrete slabs in the maker's ground, rails on sleepers, raked timber shores, keel blocks, a gantry crane, two hard-hats for scale, one lamp in the corner, white-ink dimensions measured from the hull's PIXELS (`stapelHullBox`: nose spikes and pods overran `halfW` by up to a third), the power's emblem. In work, the hull is plated from the stern by the share of the shift, the rest a red-lead frame with a weld spark under the crane; ready — a red «ГОТОВ» double stamp, and ЗАБРАТЬ throws a «ГОТОВ» stamp across the screen (`stapelFx`). Sliders are boxwood scales with a red-hair cursor, 44 px; the numbers are a delta strip against the ship you fly with the place in the class corridor; class and size chips 44 px.

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

- [ ] **AUTHOR'S CALL: ×1.5 in flight** — the raster, not the JS, loses the deadline; the switch is built and OFF (`c7556b7`, `G.opts.gfx.resByMode`); price: the sky a quarter darker. Numbers and reasoning in `docs/PLAN-archive.md` («Moved 2026-09-18, fourth batch»). Design pass D3.

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
- [ ] **[design owed] Longer tails — built as knobs, waiting for the author's pick (18.09, Control).** The finger
  trail is now measured in TIME (`HELM_TRAIL`=.2 s, guard `HELM_TRAIL_MAX`=48; a still finger's
  trail catches up and goes out). The wake already runs off the screen at cruise (frame at ×1: the
  rails reach the bottom edge), so «куцые» is the nozzle RIBBON: it lives only while thrusting,
  `TRAIL_LIFE.k`=40 frames per span, and its brightness falls as u² — the visible hot part is the
  first half of its life. Knobs: `TRAIL_LIFE={k,fall}`, `WAKE_LIFE={lo,hi}`; `TRAIL_MAX` 560 → 1200
  (a guard; ×3 life reaches ~330 points). Frame sent to the author: A now (40, u²), B 40→80,
  C 80 + fall u^1.2, D 120 + u^1.2, at ×1 and ×2.4. Defaults unchanged until the author picks;
  after the pick — phone cadence check in the phone milestone (the ribbon's draw calls scale with
  the number of live segments per bucket-path, not per segment, so the cost is path length).
  Older notes below.
  Older notes on the tails (the wake/ribbon audit, the finger trail in count): `docs/PLAN-archive.md` («Moved 2026-09-18, third batch»).
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

### Stage 0b — cheap and decided (one commit each)

- [x] **P1 Scroll, globally** Body in the archive.
- [x] **P2** Body in the archive.
- [x] **P3** Body in the archive.
- [x] **P4** Body in the archive.
- [x] **P5** Body in the archive.
- [x] **RELEASE BLOCKER closed: the four «штурвал» failures — done; body in `docs/PLAN-archive.md` («Moved 2026-09-18»). Body in the archive.
- [x] **P6** Body in the archive.
- [x] **P7** Body in the archive.
- [x] **The anchor and the stick** Body in the archive.
- [x] **`say()` from timers/network callbacks** Body in the archive.
- [x] **СТОЛ** Body in the archive.
- [x] **Station header review 13–15** Body in the archive.
- **Privacy, standing:** the author's save sits outside git (`C:\Claude\drift-private`) — never
  commit it; the two bot signs in `~/drift-data/trace/p/0_0.json` the author removes by hand.

### Stage 1 — the ship under the finger (`docs/PLAYTEST-2026-09-13.md` §2.2–2.6, §3)

- [x] **P8 Under the finger — done 18.09 (Control), phone owed.** Body in the archive.
- [x] **P9 Zoom + the body in view + the entry point — done 18.09 (Control), phone owed.** Body in the archive.
- [x] **P10 ЦЕЛЬ and the hail** Body in the archive.
- Gate: `g11` on the phone before/after; the frame gate of stage 0 still holds.

**Designer pass owed on everything built from here (the author 18.09: «пометь все ветки, что нужен
проход дизайнера по всему, а то сейчас всё криво»).** Control builds each stage item as a working
first draft — mechanics, timing, placement — and it is NOT the picture. Every item below marked
**[design owed]** gets a Designer pass before its release: the craft codex (`DESIGN-craft.md`), the
art direction memory, a frame on the phone, self-critique in passes. Nothing marked so counts as
done for the author. The marker is removed only by the Designer's pass, never by Control.

**Task names (18.09, the author: «почему по-русски — переименуй вехи по-английски, одинаково во всей
игре»).** The stage items had Cyrillic family codes; they are now M-numbers like every other
milestone, one contiguous block per family, so an old reference maps by arithmetic:
borders Б1–Б7 = **M452–M458**, life Ж1–Ж6 = **M459–M464**, resources Р1–Р5 = **M465–M469**, metro
М1–М6 = **M470–M475**, shipyard К1–К9 = **M476–M484**, birchpunk Д1–Д14 = **M485–M498**, new
mechanics Н1–Н15 = **M499–M513**. Renamed in this file, `docs/PLAN-ru.md` and the seven stage
designs. Left as they are, on purpose: historical codes in code comments and the archive (the
marathon's П0–П8, the story forks С1–С3, the interface laws И1–И11) — they name archived sections,
not open work — and in-game strings (part suffixes «М1», «Р-12»). Versions stay `0.NNN.x`; the
patchnote of each version names the M-numbers it closes.

### Stage 2 — whose land, in five seconds (borders + life M459 + the galaxy)

- [x] **[design owed] M459 The approach — «подъезд»** Body in the archive.
- [x] **[design owed] M452 The first ship's gesture — BUILT 18.09 (Control), first pass, `src/17h-sys-gesture.js`.** Body in the archive.
- [ ] **M453 The stamp + P14 ТРУДОВАЯ КНИЖКА — the stamp and its page BUILT 18.09 (Control), `src/17i-stamp.js`.** Crossing = the owner under the ship changed since the last arrival (`R.last` inside `G.record`, no save-format change; the first jump compares with the system left). Screen stamp: DOM, tilt 5–12° by seed, 1.3 → 1, hold, fade in 1.2 s; Компания a till slip from the bottom edge. Page ОТМЕТКИ О ПРОЕЗДЕ at the top of КНИЖКА: 8 cells (six + Ялта + pirates), first stamp kept, a ×n counter; the first stamp of each power also writes a КНИЖКА line. **Open:** ink grain, Ялта and the pirates' scratch are never earned yet, the rest of P14 (seals, vacation savings, the grounding ending on the page). Original text in `docs/PLAN-archive.md` («Moved 2026-09-18, originals»).
- [ ] **M454 Station body and traffic by builder — first draft BUILT 18.09 (Control).** The plate under the modules takes the builder's ground and a dressing (`src/17c1-station-dress.js`, baked into `stationArt`): ГЛАВТРАССА red band + «СТ-n» + star, Компания white + pink/cyan logo band «КОМПАНИЯ™», Орднунг black ribs + numbers, Коммуна long arcs + a warm window band, Рассвет patchwork + a hand-painted sun, Хай-Фронт white, one red dot, cyan under-light. Shuttles (17f) carry a maker: 7/10 the owner's, 3/10 a neighbour owner's; nozzle and body tint from the maker. **Designer's notes from Control's frame (×2.4):** the plate reads light grey for every builder — the station's one light (cream .44 at the star side) washes the ground out, so the ground difference is lost; the Орднунг ribs hide under the modules; the dressing is plate-only — the modules and the core are still the common kit, so a station is «the same station with a sticker», not the maker's grammar (profile law, seams, joints). That is the Designer's pass. Original text in `docs/PLAN-archive.md` («Moved 2026-09-18, originals»).
- [ ] **M447 The world galaxy + M448 the stars — first draft BUILT 18.09 (Control), `src/17z1-galaxy.js`.** `galaxyAt` (disk, capped bulge + bar, two log arms + spurs, fbm clumps, dust on the trailing edge, pink knots, colour round the wheel); world tiles 128 texels at 4 and 1 texel/sector, LRU 48, bake ≤ 48 rows AND ≤ 4 ms a frame, the far level under the near one, the near fading in by frames drawn (the map's `G.t` stands still); stars per sector by hash against a zoom-constant screen density, 6 colours × 3 brightness fills, cached per sector (0.2 ms at ×5). The map's band, nebula, `drawStars` and `mapSkyShift` are gone. Tests: the M438 suite → «галактика: модель в мире» (Node, green) + «звёзды держат плотность» (browser, green in Node); the mutant `sky-with-sheet` → `galaxy-on-ship`; the drag detector law flipped to «deep < 8 %, sheet ≥ 25 %» — **thresholds set before measuring, verify at release**; goldens of the map change — `-Accept`. **Designer's notes:** at ×5 the map's own system glyphs (a dense field of soft discs) cover the galaxy — the glyph field, not the galaxy, is the loud layer there; the home frame is warm haze, readable; M449–M451 (names, the overview, the flight sky from the same model) not started. Original text in `docs/PLAN-archive.md` («Moved 2026-09-18, originals»).
- **Gate:** on any jump in the settled circle the tester names the owner within 5 s without
  reading a label (three testers, six powers); the stamp lands once per crossing; `-Accept` done.

### Stage 3 — far, and back with a hold (resources + the railway)

- [x] **[design owed] M465 Ten goods — table and roll — BUILT 18.09 (Control).** Body in the archive.
- [x] **[design owed] M466 Reading and ЖИЛА — BUILT 18.09 (Control), `src/06e-far-take.js`.** Body in the archive.
- [x] **[design owed] M467 Prices by distance — BUILT 18.09 (Control), `12-economy` `farPriceCtx`.** Body in the archive.
- [x] **[design owed] M470 The net — BUILT 18.09 (Control), `src/18e-rail-net.js`; the scheme screen is open.** Body in the archive.
- [x] **[design owed] M471 The station in the system — BUILT 18.09 (Control), `src/18f-rail-station.js`.** Body in the archive.
- [x] **[design owed] M472 The vestibule — BUILT 18.09 (Control), one DOM page `#railWin`.** Body in the archive.
- [x] **[design owed] M473 The ride — BUILT 18.09 (Control), `src/18g-rail-ride.js`, `G.mode="rail"`.** Body in the archive.
- [ ] **Oracle lines** (`91zzzzzzzzz-worlds`): best rail round trip ≤ ×1.3 of best jumps in credits
  per minute of play (baggage is the lever); the stripped hauler's best one-hop deal (for M478).
- **Gate:** from home to a rim полустанок and back with a hold of deep goods in under 4 minutes of
  play, paying its ticket on an average roll; the ride never shows a loading screen.

### Stage 4 — the ship (`DESIGN-shipyard.md`, review §1.3, §2.2, §4.4)

- [x] **[design owed] M476 The plan, read-only — BUILT 18.09 (Control), `src/05e-plan.js`.** Body in the archive.
- [x] **[design owed] M477 The КБ editor — first pass BUILT 18.09 (Control), `src/27jb-kb.js`.** Body in the archive.
- [ ] **[design owed] M478 Numbers from the plan — the first two BUILT 18.09 (Control), `planFactors` in `27jb-kb`, read by `stat()`.** Fixpoint: no `G.draft` → both factors exactly 1 (old saves unchanged by construction); the typical plan saved explicitly → the same numbers (suite). Cargo = hold cells / the typical plan's hold cells × today's cargo, capped ×1.4; thrust and turn × √(typical mass / plan mass) clamped .8–1.1 (a thing = 1 cell, an empty hold cell = ½). The КБ strip shows ТРЮМ n (±%) · РАЗГОН ×k. **Open:** fuel from tank cells, energy from reactor cells, hull from armour parts, sight from nose-third instruments, module tiers as densities, the worlds oracle line. Original text in the archive.
- [ ] **[design owed] M479 БАШНЯ, exposure, sight — БАШНЯ and sight BUILT 18.09 (Control).** A gun placed on a spine cell in КБ becomes a `tower` mount (`MOUNT_KINDS.tower`, `draftTowerAt`, `mountAt` reads the draft): cone = the whole circle, damage ×.9, drawn in flight at its cell as a round barbette with a cross. Sight: the КБ rule keeps instruments in the nose third. **Open:** exposure — rim parts taking their side's wear when hit from that side (`12s-wear`), «engines take it» from behind. Original text in the archive.
- [x] **[design owed] M468 Properties — BUILT 18.09 (Control), `src/06f-far-props.js`.** Body in the archive.
- **Gate:** an old save loads with every number unchanged; a hauler stripped to the hold and a
  warship stripped of hold both fly under the finger the same (P8 meter); the blueprint passes the
  craft codex and gets its almanac issue.

### Stage 5 — the voice and the joke (`DESIGN-birchpunk.md` §2, §4; life M460–M462; borders M455–M456)

- [ ] **M485 Machines with names — drones BUILT 18.09 (Control), `12e-drone-flight`; design 18.09: the quirk now stands first in the drone's line in both lists (station and ДЕЛО), italic, as its own word.** Name (16) and one quirk (6: торопыга, возит лишнее, осторожный, поёт при бурении, ленивый но живучий, норма) from the hull number — no save field; the quirk moves rate / break chance / repair time both ways; the break line speaks in the name: «Митя встал на «…». Чинится сам, n мин. Ругается.» **Open:** the base crawler, the tug, the barge autopilot; the quirk in the drone list. Original text in the archive.
- [ ] **M486 Изолента — BUILT 18.09 (Control), `src/12s1-tape.js`.** Rolls for 5 кр beside the repair buttons; ЗАМОТАТЬ in ОПИСЬ anywhere → hull exactly 50 %, a grey strip on the hull (up to 6, in the bake key), saved (`tapeRoll`, `tapes`); a full yard repair takes the tape off — except at a Рассвет yard, where tape is a finish. **Open:** the кулибин trait, tape on a part (not only the hull), the first hour's ДО 50 % button anywhere. Original text in the archive.
- [ ] **[design owed] M495 The triangle — BUILT on instruments 18.09 (Control), `src/05b1-warranty.js`.** Only instruments break in the game (`instrKnock`), so the triangle lives there: firm instruments («Сирин», «Веха») carry 12 shifts of warranty from purchase; a broken one shows in ОПИСЬ with ТЕХПОДДЕРЖКА (an ether call «ваш звонок очень важен для нас», queue № 37 melting with game time and once back to 41, 1–3 shifts, then new and free — «оцените нашу работу от одного до одного») and ИЗОЛЕНТА (a roll, now, half, «гарантия аннулирована: обнаружены следы изоленты»); the yard stays `instrFix`. **Open:** parts do not break — the design's «Компания / Хай-Фронт parts» need a part-failure mechanic first; the bar of hold music; the old master's free seam. Original text in the archive.
- [ ] **[design owed] M489 Names by owner — the rule BUILT 18.09 (Control), `src/12al1-toponym.js`.** `ownerName(base,sx,sy)` from the land's owner now (a flag change repaints): пгт …, … Каунти / …-Сити, Бецирк … № n, Сен-…, кооператив «…», …-n vX.Y; `firmName(seed)` = provincial town + foreign tech word. Applied to rail stops (полустанок … past r 40). **Open:** settlements, holdings, the station header; firms where they appear. Original text in the archive.
- [ ] **M492 Космопочта — first pass BUILT 18.09 (Control); design 18.09: the block is a cream notice paper with a blue stamped header and a barred window in the corner (`.post`), checked on the S23; `src/26e2-post.js` (prefix `kp`: `post*` belongs to the postcard circle 11e).** A КОСМОПОЧТА block under ДОСКА at every station with a board: hours on the door on a post clock of its own (a post day = half a смена, since a calendar day is one real minute; open 9–10 → 21–22, lunch 13–14, ~45 % of the time), «ЗАКРЫТО · откроется через N мин». The СТАПЕЛЬ hull comes as an извещение and is collected at any open window with a талон (or at the yard as before); it waits 30 post days, then «возвращено отправителю» (the yard only); a day late — the clerk keeps it «ещё денёк, не по правилам», once per parcel. **Open:** a rare part and cooperative goods as parcels, a real queue, M499 попутная посылка. Original text in the archive.
- [ ] **M460 Billboards — BUILT 18.09 (Control), `src/17k-billboard.js`; M491 and P12 open.** At busy stations (life ≥ .45) one billboard beside the lane: truss, dark panel, the owner's title in three-stroke neon (glow / body / white core, additive), ГЛАВТРАССА with one dead letter and a 200 ms buzz once a minute; one crawling line with a real deal from the base prices of stations within 3 sectors (no `marketFor` — a sign must not touch the world), in the owner's voice (Компания «…ВЫГОДНО КАК НИКОГДА™ · ДО КОНЦА АКЦИИ 00:00:03», Орднунг «…ПРОВЕРЕНО», Хай-Фронт «ТИТАН:41 @… Δ2 // РЕКОМЕНДОВАНО»…), recomputed every 10 s. **M491 BUILT 18.09** (`src/12p1-doublespeak.js`): every witnessed deed (`epiAdd`) is retold on the ether two minutes later by two powers — the witness's and a random other — in doublespeak (good deed: «на трассе спокойно», «партнёр обеспечил безопасность перевозок™», «инцидент не зафиксирован»; bad: «протокол составлен в трёх экземплярах», «без комментариев — у нас обед»…). **Open:** 1–3 signs, the hull tint within R, the сводка/циркуляры/holding lines, stale prices as a fork; M491 through `12p-news` at the сводка; P12 ЭФИР. Original text in the archive.
- [ ] **M461 Hotels — first pass BUILT 18.09 (Control), `src/17l-hotel.js`.** At busy stations a slab of windows across the lane from the billboard, the owner's sign («ГОС ИНИЦА «КОСМОС»» with «МЕСТ НЕТ» on the board, «ДЖЕКПОТ-СИТИ™» all lit, «ПАНСИОН № 4» dark 22–6, «LA LUNE», «ДВЕРЬ В СКАЛЕ», «HIVE·HOTEL v2»); ДЕЙСТВИЕ — К СТОЙКЕ: a night for 12 кр heals 10 % hull with the owner's greeting («Мест нет. …Для вас найдём.»); under a third of hull — free, «потом заплатите»; the porter mentions the cinema when `kinoHere`. **Open:** the doors (sanatorium needs a voucher and an ocean world — how a hotel offers it), cantina rumours at the desk, fatigue (does not exist for the player). Original text in the archive.
- [x] **[design owed] M462 «Чебуречная» — BUILT 18.09 (Control), `src/17j-cheburek.js`.** Body in the archive.
- [ ] **M455 The peacetime fleet — BUILT 18.09 (Control), `src/17m-peace-fleet.js`; design 18.09 on the S23: all five scenes read; the Компания ferry now carries a ticker screen, the Хай-Фронт line is six camera drones (disc, rotor cross, eye that goes dark on reboot) instead of dots.** In a power's land, behind the station: ГЛАВТРАССА субботник (two tugs walking rocks along the belt), Компания an ad ferry «РЕКЛАМА · ПАРТНЁР™» with a contractor, Орднунг an inspection pair holding a trader «ДОСМОТР · ЭКЗ. 1 ИЗ 3», Коммуна a neat line (still and dimmed on `socStrikeHere`, «ЗАБАСТОВКА · ФЛОТ СТОИТ»), Рассвет a repair tug that comes to your hull under 60 % and welds it up to 60 % free («Стой ровно, брат, подварим»), Хай-Фронт six drones rebooting in a running wave «ОБНОВЛЕНИЕ УСТАНАВЛИВАЕТСЯ». **Open:** субботник/strike/rite driven by the chronicle days rather than always; the belt tugs are far from the station view. Original text in the archive.
- [ ] **[design owed] M456 One law each — four BUILT 18.09 (Control), `src/12al2-laws.js`.** ГЛАВТРАССА норма: the first 20 fuel units per docking at 1 кр, a log line; Компания пошлина: 40 кр at docking (0 with an expedition passenger aboard — «спонсор на борту™»); Орднунг скоростной режим: faster than 4.5 within 600 of the station → a 15 кр fine with a paragraph number and «экз. 1 из 3», once per approach-hour; Коммуна обед: 13:00–14:00 game time the counter takes nothing (fuel always). **Release risk:** the Компания fee at every docking may shift browser suites that count credits after docking — read the release run for it. **Open:** «сделаем из ваших» (Рассвет), the ticket in ПОЧТА instead of the journal, the lunch shown on the trade tab. Original text in the archive.
- [ ] **P11 ПРИЁМНИКИ — BUILT 18.09 (Control), `11ap-relay`.** A paragraph under the header says what masts are and give (ретранслятор — clean ether, метеопост/зимовка — pay for news on a visit, маяк/бакен — only a place); the dial is now the knob — a tap sets `G.radioF` there, snapping to a mast within .012; each row ends «НА КАРТУ ›»; НАЗАД from that map returns to ПРИЁМНИКИ (`G.mapBackTable`, one-shot, ephemeral; `navAction`). Original text in the archive.
- **Gate:** a tester laughs once in the first ten minutes at something inside the world, and can
  say afterwards which institution the joke was on — never a person.

### Stage 6 — the story and the rest

- [ ] **[design owed] P15 «Смена» — the quest spine BUILT 18.09 (Control), `src/12ud1-smena-quest.js`.** Chapters now open IN ORDER (the next after the last open, «Док» always first) and only on a landing on a world of a new kind (type + mix + star class) where no earlier chapter opened — money, drones and menus no longer open anything (`SMENA_CH` predicates kept as data, only chapter 1 still opens by predicate). Each opening: «ГЛАВА N · «title»» across the screen for 3 s; the chapter keeps where it was lived and a postcard snapshot (`postSnap`, ~200 B), drawn as a tilted photo at the head of the chapter with «прожито: … · сектор …». Old saves keep what was open; the next is the first unopened. Harness resets the new fields. **Open:** a reader view with ← →, the hard part (a chapter's deed in the place, not just a landing), a real book look, the ~72 kinds of place — check that 72 distinct keys exist within reach. Original text in the archive.
- [ ] **[design owed] M457 Sound — the motif BUILT 18.09 (Control), `SFX.motif` + `MOTIFS` in `09-audio`.** Three notes per power on the first entry of the day (with the gesture's words): ГЛАВТРАССА a steady march up a fifth and octave, Компания a ding-dong jingle, Орднунг three identical by the stopwatch, Коммуна a slow minor, Рассвет warm and swung, Хай-Фронт a digital «тинь-тинь-тинь» two octaves up. Scheduled on the audio clock, one voice freed at the end. **Not heard:** headless audio needs a user gesture — an ear pass is owed (the AnalyserNode check of VERIFY.md at the release run). **Open:** the rest of the item below. Original text in the archive.
- [ ] **M481 СТАПЕЛЬ — BUILT 18.09 (Control), `src/26e1-stapel.js`.** At a yard (`stype` yard) in a power's land (`stampOwnerAt`) the ВЕРФЬ tab has СТАПЕЛЬ: class (7) × size (лёгкий/средний/тяжёлый) × length and width sliders (.85–1.15, `S.hl`/`S.hw` in `hullOf` — absent on every older hull, nothing shifts), a live preview, stats inside the class corridor of `FLEET_PROFILE` (`stapelStats`), price ×1.25 over the fleet formula on the button. One order at a time, ready after one смена (`HOLD_SHIFT`, not a сводка — 40 shifts was too long), a ПОЧТА log line when ready, collected at the same yard. Saved: only the orders (`G.stapel`); the ship record is derived on load (`stapelRestore`) and stripped from `uniqueShips` (`stapelStrip`). Test `91zzzzk6-stapel`. **Open:** the yard's character (M480) on ordered hulls only; Космопочта delivery elsewhere (M492); M513 утильсбор.
- [ ] **M484 Особая система корпуса — BUILT 18.09 (Control), `src/16c-abil.js`.** One per `HULL_CLASS`, on a LONG PRESS of ДЕЙСТВИЕ (≥ .6 s, only when no act prompt was showing at the press — checked in `28-loop` before the frame, against the prompt the player saw) or the V key; the cooldown is a conic arc on the pad's rim (`.abil-cd`, the button found once — no DOM read per frame). ФОРСАЖ thr ×1.6 3 s / 20 s; СБРОС a tenth of the hold overboard, pirates within 700 lose you 4 s (`jamT`) / 25 s; БАЛЛАСТ turn ×1.5 4 s for 1 % of cargo / 18 s; РЕЗАК 30 to the nearest foe within 160 in a ±.5 rad nose cone, a beam drawn / 12 s; ЗАЛП every gun at once / 8 s; СИРЕНА three answers on the ether / 30 s; ПРОЖЕКТОР the far-deposit reading of the system and a light cone for 10 s / 30 s. Verified on the stand (long press → ФОРСАЖ, the rim arc). **Open:** the phone check of the long press (the S23), the ability named on the ship card, the decoy drawn as a crate, СИРЕНА answered by the ships actually in view.
- [ ] **M482 The hull remembers — scars BUILT 18.09 (Control), `src/05b2-scars.js`.** A hull restored from the tow gets 1–3 scars, a power's «со списания» gift one; `S.scars` persists with the hull record (history, not derived). burn: cargo ×.9; bent: the first gun's cone ×.7 and turn ×.94 (`gunSpecs`); leak: −1 % of the tank per minute in system flight (`scarTick`). −12 % price per scar on the restoration; КОРПУС ПОМНИТ on the ВЕРФЬ tab repairs each for 400 + 6 % of the hull's price. **Open:** scars drawn on the silhouette (D18), scars on captured pirate hulls, доводка (a weld with a node, +1 tier, two per hull).
- [ ] **[design owed] M480 Six yards' character — the NUMBERS BUILT 18.09 (Control), `STAPEL_YARD` in `26e1-stapel`, on ordered hulls only** (catalogue and old saves untouched): ГЛАВТРАССА hull ×1.25 thr ×.93; Компания price ×.85; Орднунг hull ×1.08 turn ×.96; Коммуна cargo ×.85 turn ×1.06, СТАПЕЛЬ shut at lunch/strike; Рассвет cargo ×1.1; Хай-Фронт hull ×.85 fuel ×1.08; one line of character on the panel. **Open:** the drawn habits (slogan along the flank, the running line, the unordered curve, the welded pod), the free cells (need the plan, M477), Хай-Фронт firmware moving a part per сводка, Рассвет hull points back from debris, calibration by the worlds oracle and the стрельбище. Original text in the archive.
**Open tails of closed items** (the bodies are in the archive; these follow-ups are still owed):
- **P8 Under the finger, P9 Zoom** — the check on the author's phone (S23) is owed for both.
- **M466 Reading and ЖИЛА** — the cave (янтарь) and the hunt (жемчуг) verbs give nothing yet; the rumour a сводка later and the company on the approach; the reading on the planet card / dig entry (belt only now); тёмное стекло narrowing the reading.
- **M467 Prices by distance** — far goods for sale in the heart («rarely and dear»); the other eaters (реакторы, броня, щиты, теплицы) are M469.
- **M470 The net** — names by owner (M489 rule) and «Край»; beyond r 60; the scheme as its own screen (КУДА ВАМ, M472); ~~M449 names of arms and nebulae on the map~~ (done 18.09, `src/17z2-galaxy-names.js`: «Долгий рукав» / «Рыжий рукав» lettered along the arm at r 14 and 24, ten nebulae named in the cabin's voice on the arms — «Печка», «Молоко», «Сивая», «Двойня», «Ржавая», «Тёплый угол», «Комариная», «Синяя вдова», «Пустая», «Гнилой угол» — as a dot and a word under cell 24; the system card gets one word: рукав / межрукавье / ядро / туманность «…»; checked on the S23 at ×2.5 and ×4).
- **M471 The station in the system** — ~~six finishes of the vestibule by owner~~ (done 18.09: `#railWin[data-by]` — Компания white/blue glossy, Орднунг ruled form paper, Коммуна cream hand-drawn italic, Рассвет warm wood, Хай-Фронт dark glass mono; checked on the S23), the bare rim platform, helm assist in the cone.
- **M472 The vestibule** — ~~ПЕРЕСАДКА routing through junctions~~ (done 18.09, `src/18k-rail-scheme.js`: tickets through one junction after the direct ones, one fare for the whole way, the train changes line at the junction with a 3 s stop and an announcement; test in `91zzzzk4-rail`), split-flap turning, крупногабаритный ×3, ~~the scheme unfolded on paper~~ (done 18.09: «СХЕМА ЛИНИЙ» in the vestibule unfolds a cream sheet with creases — lines in scheme inks, junctions double, names placed without overlap, ring names, «ВЫ ЗДЕСЬ» in red, legend; checked on the S23).
- **M473 The ride** — ~~the hyperdrive departure/arrival flash, the announcer's voice~~ (done 18.09: `railFlash` bloom with a streak along the line at departure, each stop and on exit in the system; the dispatcher's voice reads the stop when the voice is on in ЗВУК), held pad ×2, a save mid-ride (wakes at the origin now); ~~the flight pads still shown in the carriage~~ (done 18.09: `body.inrail` hides all pads but ДЕЙСТВИЕ/ВЫЙТИ; checked on the S23).
- **M476 The plan, read-only** — unique/fused/NPC hulls in the suite; the hold's green is barely visible (синька in M477).
- **M477 The КБ editor** — footprints 2/4 turning and the Орднунг «поворот не предусмотрен формуляром», the numbers strip with deltas (M478), ПРОЕКТЫ ×3, the foreign yard's bill per cell moved, ОСНАСТКА's hull section → КБ, the tray showing things from the hold.
- [ ] **[design owed] M469 Eaters — the prices BUILT 18.09 (Control), `farEaterMul` in `12-economy`.** Besides the three land eaters (amber Коммуна, pearl Компания, darkglass Хай-Фронт ×1.5): yards pay he3 ×1.4, palladium ×1.3, osmium ×1.3, neutron ×1.4; osmium ×1.3 in ГЛАВТРАССА land, magdust ×1.5 in Орднунг land, chernozem ×1.5 in Рассвет land (the greenhouses — until дачники M493 exist), antimatter ×1.3 in any power's land. **Open:** the goods actually consumed by the yard's densities and доводка (M482), the luxury counter, the hotel shop. (Was only inside the M468 body — restored here when that body went to the archive.)
- [ ] **M475 Economy and growth** (metro §7) — fares, baggage and the size rule tuned against the worlds oracle's rail line (best round trip ≤ ×1.3 of jumps); a holding-built station, «продление линии», a late holding deed named by the generator. Not started: the tuning needs the oracle run, the station needs the holding ladder. (Restored from the M473 body.)
- [ ] **[design owed] M474 Six railways — four BUILT 18.09 (Control), `src/18h-rail-powers.js`.** By the land of the departure station: Компания EXPRESS™ beside every ticket of 2+ stops (×10, «на три секунды быстрее!», skips the stops, segments ×.92); Орднунг boards only after «ДЕКЛАРИРУЮ» — the first press declares the hold (a numbered declaration line), the second boards; Коммуна's counter closed at lunch and on strike days; Хай-Фронт every third ride stands 60 s at the first stop, «обновление установлено». **Open:** Рассвет маршрутка (stop anywhere on the line), the dashed Express line on the scheme, closed front stops; M475. Test fragility: the ride suite picks the first heart metro station — if its land ever turns Орднунг, the suite needs the double press. Original text in the archive.
- [ ] **M463 The bazaar that remembers — BUILT 18.09 (Control), `src/17n-bazaar.js`.** In quiet (danger ≤ .35) power systems with a belt, every other one by seed: five moored hulks with awnings and lamp strings, 300 inside the belt orbit (the belt-entry band is ±90 — they must not overlap). ДЕЙСТВИЕ — К ПРИЛАВКАМ opens a stall window: ВАШЕ — the last 12 parts you scrapped in ОПИСЬ (`G.thrown`, packed) at ×3, «ношеная, один хозяин»; two scarred hulls at .55 × the scar discount; one odd lot at .7. The row turns every смена (`G.bazBought`). **Open:** real fleet art for the hulks, odd lots beyond parts, rumours at the stalls. Original text in the archive.
- [ ] **M487 Подписка — instruments BUILT 18.09 (Control), `src/05b3-sub.js`.** At Компания and Хай-Фронт stations a firm instrument («Сирин», «Веха») has a second button on the counter: ПОДПИСКА 10 % now + 4 % per смена (`HOLD_SHIFT` stands for the сводка), «владеть выгоднее после 23 смен — мы честно пишем». Charged at the смена boundary (kit and shelf alike); a missed fee first sends a ПОЧТА warning, the next boundary blocks the instrument (resolution ×.5 in `instrQuality`) until paid; ЭКСТРЕННОЕ ПРОДЛЕНИЕ ×3 unblocks at once; every fifth fee «тариф обновлён», one named feature becomes an add-on (flavour). **Open:** base modules by subscription and the cold store that stops giving; ×3 offered in a fight; M488. Original text in the archive.

### Second pass over the whole plan (14.09) — seams, the standing checklist, new mechanics

**Seams found between systems (each is a line in the item it belongs to; listed here so they are not lost):**
- **MODS → the plan (M478).** Today `capOf` is shared by modules and parts; when tiers become
  densities, `hold`/`tank`/`weapon`(reactor)/`armor` are densities per cell, `engine`/`hyper`/`drill`
  stay station upgrades on the hull's constants — one mapping table in M478, and the fixpoint suite
  covers both halves. Densities are per hull size (nominal ÷ typical cells), never shown as a number.
- **Drones and the far goods (M465).** Drones never mine band-2/3 goods and sell band-1 goods at the
  band price (½) — otherwise a drone on a rim жила prints money offline.
- **The stamp and the metro (M453, M473).** A stamp lands only on arrival by jump or on ВЫЙТИ, never on
  a stop passed through; the gesture fires on both kinds of arrival; the ring's «Стыковка?» hail
  fires only when heading into the ring, not when thrown out of it.
- **The first hour (M452, M472).** In the home system the gesture *is* ГЛАВТРАССА's and is the first
  hour's first line; the замполит hands the newcomer one жетон («первый — за счёт трассы») — the
  metro is met in the first hour, not found.
- **Rescue and rails (`16c-rescue`).** A dry ship at a rail stop gets a third exit beside ДОМОЙ /
  БУКСИР: **НА МЕТРО** (a ticket home for its fare).
- **The scheme's scope (M470).** The paper shows your line, the rings it meets and their neighbours;
  pinch/scroll for more — never the whole infinite net. «Край» is per player (no shared state).
- **M484's place on the pad.** The two permanent buttons stay; the special system is the ДЕЙСТВИЕ pad's
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

**New mechanics — grown out of the seams (M499–M511; each names its stage):**
- **M499 Попутная посылка** — BUILT 18.09 `18i-rail-life` [design owed]: every third station/смена, `G.railParcel`, paid through `earn` on ВЫЙТИ at its stop. (st. 3, with M492): at a vestibule Космопочта asks you to carry a parcel to
  a stop on your line; delivered by ВЫЙТИ there — a few кр and a rumour; the parcel is a hold row.
- **M500 Проездной** — BUILT 18.09 [design owed]: price = 12 × the mean fare from here, 10 смен, non-metro fares 0, a КНИЖКА line per ride. (st. 3): ГЛАВТРАССА's monthly pass — the one subscription in the game that is
  fair (pays off at 12 rides, the card says so); stamped in КНИЖКА each ride.
- **M501 Попутчик** — BUILT 18.09 [design owed]: every other station/смена, pays their fare via `earn`, one line at the first stop. (st. 3): a passenger at the vestibule asks to ride with you — pays their fare,
  talks during the ride (the passenger table, M156), leaves a rumour.
- **M502 Проводник** — BUILT 18.09 [design owed]: rides of 3+ non-metro stops, tea and a rumour at the first stop (no crew fatigue yet). (st. 3): on the скорый the one human of the railway brings tea in a
  подстаканник — crew fatigue eased, one rumour; the kindness of the whole railway.
- **M503 Госзаказ на билборде** — BUILT 18.09 `17k1-gosplan` [design owed]: at ГЛАВТРАССА billboard stations every other 10 s cycle the sign shows the plan (good, qty, сводка = three смены, fixed price ×1.3 or ×1.2 far); ГОСЗАКАЗ row atop the trade tab delivers via `earn`, `G.gosDone`, КНИЖКА `R.udar` shown on the record page, «план выполнен на 101–107 %». (st. 5, M460 + M467): «ПЛАН: 40 ед. осмия до сводки 118» — a fixed
  price for whoever delivers, a КНИЖКА stamp «УДАРНИК», the сводка reports «план выполнен на 103 %».
- **M504 Ажиотаж** — BUILT 18.09 `18j-rail-rush` [design owed]: the first take of a grade-3 vein starts `G.rush` for 2 смен — the stop's interval halves, fuel there ×1.33, a ГЛАВТРАССА line. **Open:** the approach filling with traffic. (st. 3, M466 + M474): after a ЖИЛА rumour the line adds a train to that stop «по
  многочисленным просьбам трудящихся», the полустанок's prices spike, the approach fills.
- **M505 Дипломатический паспорт** — BUILT 18.09 `17i1-passport` [design owed]: the seventh first stamp (six powers + Ялта) issues it once (`R.pass`), 7 смен: every fare 0 incl. metro, Орднунг declares on the first press. (st. 5, M453): all six border stamps + Ялта's → the замполит issues
  a passport: free rides for a week, and the Орднунг form asks one question fewer.
- **M506 Покупки за рубежом** — ALREADY IN since M369/M388: station parts are generated with the land's maker (`pby`) and `PART_MAKER_BIAS` skews their affixes (Орднунг coneMul down, Коммуна turnMul up…). The named habits (Коммуна turret wider) would change issued parts — `PART_GEN` forbids; only via a new generator version, deliberately. (st. 4, M480): a part bought in a power's land carries that yard's habit
  (an Орднунг shield is front-heavy, a Коммуна turret turns wider) — shopping abroad matters.
- **M513 Постановка на учёт — утильсбор** — BUILT 18.09 `12al3-reg` [design owed]: a hull bought (shipRow) or collected from СТАПЕЛЬ in a land not `playerFlag()` gets transit plates for 9 смен (`G.reg[id]`); in own land `regArrive` (from `arriveSystem`): once «до понедельника» (`G.regWave`), then утильсбор (hull×8 + cargo×3) and a queue of 3 смен; transit expired before the queue — a 60 кр fine per arrival; queue done — plates issued. **Open:** the paper plate drawn on the flank (crooked when expired), the home yard refusing to re-plan it, the foreign warranty void. (st. 6, with M481/M506/M452/M495; the author 14.09: «купил корабль
  — тебя останавливают, надо на учёт поставить»). A hull bought or ordered in another power's land
  flies on **транзитные номера** — a paper plate stencilled on the flank, valid 3 сводки. On the first
  arrival under your own flag the picket stops you: «постановка на учёт» — **утильсбор** («сбор за
  будущую утилизацию», by hull mass, the dearest for a dreadnought that will never be scrapped),
  form 2-ТС in three copies, a queue number at the ПАЛАТА, one сводка of waiting; until then no
  home yard buys or re-plans it, the foreign гарантия is void, and every picket stops you again
  («транзит просрочен» — a fine, and the plate is drawn crooked). Registered: your flag's number
  replaces the paper plate — the slogan of a ГЛАВТРАССА yard is never touched. Kindness: the
  inspector waves you through once, «до понедельника», and writes nothing down.
- **M507 «Успеваете скорым»** — BUILT 18.09 `railCatch` in `18j-rail-rush` [design owed]: a taken board job's ДЕЛО row adds «успеваете / не успеваете электричкой «L» · отправление через M:SS · k ост.» when a line from here reaches its destination (ride ≈ 25 s a stop). Found on the way: a second `offerCarried` in `11ah-offer` had overridden R5b's, so ДЕЛО wrote «undefined мин» since R5b — R5b's is now `offerCarriedRows`. (st. 3): ДЕЛО reads the timetable — a job with a deadline says which
  train makes it and when it leaves.
- **M508 Пломба** — BUILT 18.09 [design owed]: Орднунг boarding with cargo seals the hold (`G.railSeal`), `sellCargo` refuses, lifted on exit; pirates' respect not yet. (st. 3, M474 Орднунг): a declared hold is sealed at boarding — nothing sells from it
  until arrival, and pirates at rim stations do not touch a sealed hold (they fear the form).
- **M509 Отзыв партии** — BUILT 18.09 `05b4-recall` [design owed]: each week (7 смен) about one in six of your Хай-Фронт parts is recalled (`G.recalled` by seed), a ПОЧТА line; kept, its affixes work at 85 % (`partBonus`); ЗАМЕНИТЬ ДАРОМ in any Хай-Фронт land station's trade tab reseeds it in place, same kind and tier. (st. 6, M487): Хай-Фронт recalls a part model — «партия отозвана», a free
  replacement at their yard; kept, the old one becomes a scar.
- **M510 Компенсационная маршрутка** — BUILT 18.09 [design owed]: when `railClosedWhy` shuts a Коммуна counter the vestibule offers МАРШРУТКА to the first six stops (same fare, no declaration, leaves in 3 s, segments ×1.6), the driver's line says why (`railBusTalk`). **Open:** shut stretches of the front (the line itself cut), the bus drawn. (st. 6, M474): on a shut stretch («временные трудности») Рассвет's
  bus runs along it stop by stop — slower, and the driver knows why the line is shut.
- **M512 Общества и льготы — membership** — FIRST PASS BUILT 18.09 `12al4-soc` [design owed]: five societies on the КНИЖКА page (ВСТУПИТЬ/ВЫЙТИ/ВЕРНУТЬСЯ 500 кр), a членский билет in ВЕЩИ: Профсоюз (100 jumps; 2 % dues inside `earn`, shown as paid; проездной ×.5), Кулибины (10 tapes; tape to 60 %), «Знающие» (10 rides; buffet free), Филателисты (4 stamps), Партнёрская программа™ (anyone). Counters in `G.soc.c`. **Open:** duties (субботник, the week's parcel), ДОСО, спасатели, дачники, читатели; the arithmetic on the desk. (st. 5; the author 14.09 on the маршрутка's driver who
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
- **M511 Волокита — BUILT 18.09 (Control), `src/12al5-vol.js`, test in `91zzp-record`.** Animals aboard (the caged beast of M496, the parrot) ride the rail and cross a border only with papers: N docs rolled 2–10 per animal and never told; the desk on the КНИЖКА page shows the pile as paper sheets (a tint per power, the «ПРИНЯТО К СВЕДЕНИЮ» stamp lilac, the one name on the last sheet), «собрано N · ещё документов: неизвестно», and names the next document and its office (official + power + station type by seed); Орднунг wants three copies in three shifts, the Коммуна official is at lunch until the next shift; after two docs the clerk whispers «можно ускорить» — jam for 60 кр adds a stamp and changes nothing; the last one signs anywhere, without reading, «ну сколько ж можно, летай уже», and gets a name; «Ветпаспорт» goes to ВЕЩИ. Without papers the conductor refuses the ride; the border picket waves once, then fines 40 кр. Phone-checked. Original: (st. 7, M496; the author 14.09: «надо прям заебать игрока
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
  species per world with a quirk each, in M496's row.

### Release tails — any gap, all before a push

**Perf night 19→20.09 (the author's laptop: AMD Radeon iGPU, Chrome on it, RTX idle; «оптимизируй код, графику не трогай»).** How to measure, what was learned:
- Tool: an own Chrome (`--user-data-dir` in Temp, `--remote-debugging-port=9444`, window 1600×1000, real GPU) on `python -m http.server 8778` in drift-work; scratchpad `gpu.py` traces 2–3 s and prints **GPU-process ms per drawn frame** (`CrGpuMain` busy ÷ frames) — busy % alone saturates at 100 and says nothing; `ab.py` alternates two builds, `alt.py` alternates a JS toggle. The Browser pane is useless for this (emulated size, DPR 1).
- At ×2 (3076×1762) the frame costs ~28 ms of the GPU process; **one full-screen pass ≈ 1.1 ms** (bandwidth). `prof()` raster numbers lie on a GPU canvas; muting single cheap layers can read *slower* (APU power sharing: less CPU load → lower clocks). Accept only what moves fps in a ≥3-round A/B.
- Done (0.455): wake/trail stroked per shared bucket, not per lane (up to 384 → 64 strokes); bloom blurred on the quarter canvas (blur(7px) at full res cost ~3 ms; radius 1.75/DPR matches ≤8/255); opaque main canvas (−0.65 ms); grain skipped on black-sky scenes (invisible there: 0.1% subpixels by 1/255; overlay copies the frame on D3D11). Total 30.6 → 34.9 fps at ×2, −12% GPU per frame.
- Surface/landing (0.456 local): real surface ~30 fps / 33 ms at x2 once the planet material is built (a stand shows the unbaked ground until `planetMatNow`); 3.8k canvas ops a frame, plants 1.3k (they sway every frame - baking needs quantised poses: a look change, ask), rain 160 strokes each with its own alpha (batching needs alpha quantised to 1/64: a look change, ask), the weather veil is laid twice by design (behind and in front of the relief). Done pixel-identical: tiles draw only occupied rows, sub-0.002 additive cloud glow skipped - no measurable fps.
- Left, measured but not cut: vignette (~1–2 ms, one full-screen source-over blit), star body/corona/bleed (full-screen `lighter` sprites), station (rebaked every 18 ticks: `Math.floor(G.t/18)` in the `stationArt` key), backdrop-filter blur on 12 HUD buttons (~2 ms). Ops count is NOT the lever (stars, 930 ops/frame, muted = no change).

**0.453.0 (19.09 night, released WITHOUT tests at the author's word):** the frame cap estimated the vsync period from the SHORTEST interval (`capIv`) - under a 100% GPU a late frame plus its 6-9 ms catch-up slid it to «120 Hz» and the game dropped every other frame itself (sim: 5% late -> 23 fps of 60). This is the likely cause of the phone's locked-30 stretches in `rec.mp4` and the desktop stutter. Now a flat 60 by schedule (`capDue`, `28-loop`), 120 tact off. Far lane: billboard/hotel unlettered below x0.3, queue and hotel scale with the world. OWED: run `test.ps1 -Full` + Node tier on 0.453.0; the author to fly the phone again and say if «откидывает назад» is gone; the four white parked ships by the lane still keep their size floor (drawn outside `drawSysLaneShips`); a server frame-stats beacon was asked for - not built (touches `site/api.php`, ask first).

**HANDOVER 19.09 (Control → the next session; the author: «опусом в новой сессии будем чинить»). Do this first, in order:**

1.–2. ~~Merge the agent branches, release~~ — done in 0.451.0 (19.09): five branches cherry-picked (helm test taken from the phone-stick branch); «полный трюм» found green in every order, no agent branch needed. Found on the way and fixed: world signs below the UI ruler, the parallax law on a phone frame, the zoom law's centre, the rail ride leaking across suites, «останется N» contrast. Flickers seen once under load, green on rerun: «прогоны: двенадцать путей» (-Full), quarantined «рейсы» (Node) — watch.
3. **The phone (S23, the author's live game, 19.09 00:18, `scratchpad/rec.mp4` 60 s @60 fps — measured, not felt):** in the system scene by the hotel «ГОС ИНИЦА «КОСМОС»» with the lane queue (station Цициин, system Нейэль 0,0) the recording shows *every second frame duplicated* for whole stretches (29–36 s, 42–46 s, 54–58 s: 29–30 dups of 60) — the game drops to a locked 30 fps, then back to 60. This is the «дёргается». On the local 0.450.1 build on the same phone (adb reverse 8812, tab fronted) the same place gives a flat 60 fps standing, in flight, with a CDP stick at 26 moves/s, and with each draw layer muted in turn (`drawSysNebula/Trail/Wake/Stars/Station/Hotel/SysLaneShips/hud/…` — none moves the number). Live tab, fronted, standing in dock: 60 fps too. Not reproduced yet; what differs from my stand: (a) the author's real finger — the S23 touch sensor reports at 240 Hz, my CDP touch at 26 Hz; helm (c) above flips a body style every frame under a finger — test it first: merge, rebuild, ask the author to fly the same place; (b) two «CryptoTab Pool» tabs (`web.ctpool.net`) are open in the same Chrome — a browser miner; ask the author to close them and fly again before hunting further; (c) the long save (log 160, 21 drones, 493 DOM nodes, 7 canvases) — if (a)/(b) clear it, no need to look. Tools: `scratchpad/t.py` (PHONE=1, CDP_PORT=9334), `fps.js/fps2.js/fps3.js` (rAF counter per muted layer), `jit.py` (duplicate-frame counter on a screenrecord); wireless-debug port from `adb mdns services` (was 33801).
4. **Checked 19.09 (0.451.0): the «big teal/amber wedges» in `rec-grid.png` are the touch stick's band (`15a-helm`, drawn from the thumb), not off-screen marks — there is no double flag. The chips were two in every frame (star + station; the planet drops out when on screen). What is left of the «каша» is the fleet/billboard label and the hotel prompt over the lane — ask the author whether that still reads as clutter after 0.451.0 before touching it.** Original note:
4. **The «каша» the author sees on the phone (same recording, D-line owed):** at ×0.16 by the star the HUD stacks three compass chips («НЕЙЭЛЬ IV · 1733», «ЗВЕЗДА · 4530», «ЦИЦИИН · 5368») in one column at the right edge, each with its own arrow, while the same targets are ALSO pointed at by the big teal/amber off-screen wedges (`17-mode-system` marks) — one target, two flags; plus the hotel prompt «ГОС ИНИЦА «КОСМОС» · МЕСТ НЕТ · ДЕЙСТВИЕ — К СТОЙКЕ» and the fleet label «ТРАССА — ДЕЛО КАК ОГУРЕЦ» over the lane ships, and the ЭФИР ticker below. Design decision to take: one flag per target (chip OR wedge, never both — the wedge only when the chip is off the edge), chips capped at two (target + nearest), fleet label only when within a hull-length. Measure with the recording grid `scratchpad/rec-grid.png` frames 12–22.

**Red before 0.450.0, not from the design pass (verified on `d1028d1`, 18.09) — all six taken by agents 19.09, see HANDOVER above:** helm M410 «стик задаёт ход» (cruise 6.70 of 8.00, half-stick 3.10), the same-hash «под руками второй прогон» in the system scene, «полный трюм» (СДАТЬ on the market overfills the hold by 8), the detector «карта · A · застой» and the phone stick suites (`x0` of null, the stick born on the wrong half). Each needs its own look before the next push. Determinism: `wanderer · A` reads real chance or time on the corridor's buy path
(`wanderBuy`/`wanStep`, 24c) — find it, move the scene; the clock out of `stateHash` (still mixed in: `08a-statehash` ~79 `mixN(now())`; decided
11.09: a separate field, `T.state()` returns both — today it returns `{hash,snap,purse}` and `T.clock()` apart); `planetStripTick` by `wallMs()` writes `stripLvl`
into hashed state. Housekeeping: ~~the `.gz` cache headers~~ and ~~the PATCHNOTES trim~~ — both found done 14.09; the patch-bump rule (tests/tools/docs → patch; `src/` → minor after
`-Mutants` green). Tests M443–M446 open items (below). The refactor queue (below). M451 the sky
from the galaxy model. The 60 fps check re-run at the release. «свет: звезда — самое светлое» red
once in the pane (the cumulus, `CLOUDS_OFF`) — one look, then strike. A per-suite dirty-page check
after `fn()` — not built.

### Stage 7 — the base and the giants (`DESIGN-birchpunk.md` §4.3–4.7, `DESIGN-life.md` §3.6)

- [x] **M496 The farm — BUILT 18.09 (Control), `src/21ac2-base-farm.js`, test in `91zzzw-base2`.** Ферма module (1500 кр, gardener's post). A stunned beast in the mine or the cave is taken alive (`G.beast`, one cage) when some base has a live empty farm — otherwise the sample as before; the first entry to such a base moves it in: a name from the table (Зорька, Пеструшка, Тихон…), the ПАЛАТА клеймо № Ф-xxxx, a journal line. One unit a shift of its world's good (organics on soft worlds, carbon on rock, xeno for alien archetypes; from ≥25 sectors every third shift «Жемчуг пустоты», far jungle/terran every second «Звёздный чернозём») — only while a gardener is on the farm or the player is on the base; nobody talks — «скучает» once in 12 shifts. A broken farm never loses it («ждёт в породе»); rebuilt — homesick, half yield for 12 shifts. Room: straw, hay bale, pitchfork, three-rail pen with posts, trough and bowl, name board and the white клеймо plate, the real `drawBeast` in the pen (flyers hang low), the talker on a stool. Saved in `G.beast` and `B.farm`. Phone-checked. Original: A beast of a planet (`20f-fauna`), calmed by the probe or
  a net, taken to a base with a **ферма** module; a name (Зорька, Пеструшка, Бурка…) and the
  ПАЛАТА's QR-plate (the клеймо on a beast); a slow trickle of its world's good — organics, carbon,
  xeno, on deep worlds чернозём — **only while someone talks to it** (a hand on the farm or the
  player landed); a far beast gives a far good; never lost, homesick after a move (half yield).
- [x] **M497 Баня and чайный гриб — BUILT 18.09 (Control), `src/21ac1-base-banya.js`, tests in `91zzzw-base2`.** Баня module (1300 кр): a bath night every 6 shifts takes 4 water, +3 spirit for 6 shifts, +8 to a habitat next door («пар» in the adjacency table), the base manager's flaw sleeps 12 shifts after it (`B.mgr.rest`), the ПАЛАТА check fines one item (40 кр) less and logs «заодно попарился»; no water — «баня холодная». Чайный гриб — a director event only with a live greenhouse: food ×2 for 3 shifts, then it eats 5 organics a shift until an аврал in the greenhouse (forced on the next visit) cuts it into 6–14 «Чайный гриб» (`RES.grib`, `made:1` — stations never generate it, Рассвет pays ×1.5). The parlour drawn: plank walls, каменка with stones and firebox glow, chimney, two-step полок with a lying man and a sitting one in a felt hat, веник, thermometer keyed to the bath night, steam. Phone-checked. Original: A base module **баня**: fatigue resets on a bath night (the С5
  axis on managers); an inspection at a base with a баня finds one thing fewer — the inspector
  «заодно попарится» (honest man, likes a bath). **Чайный гриб** — a director event (base §10): the
  greenhouse culture overgrows, yield ×2 for three shifts, then it eats the base's organics; an
  аврал cuts it back; the cut sells to Рассвет as «чайный гриб».
- [x] **[design owed] M498 The blockade's voice, and «Буханка» — the voice BUILT 18.09 (Control), `src/13b1-blockade.js`; «Буханка» BUILT 18.09 (Control), `src/21ac3-base-van.js`, test in `91zzzw-base2`: a base with a pad gets a named van (Буханка, Таблетка, Головастик, Шишига, Козлик, Пирожок, Бочка, Утюг by seed) with one quirk for ever («не заводится с первого раза» — every third pad transfer needs a second press; heat, door on wire, dead stove, right blinker always on — drawn on the machine and logged once in 12 shifts); the pad room now shows the whole van (boxy body, split windshield, headlight, roof rack with a canister, engine pods and skids, the name stencilled on the flank), the plateau pad a small one; «ПЕРЕИМЕНОВАТЬ МАШИНУ» on the station desk cycles the table — the one machine the player renames. Phone-checked.** at occLvl ≥ 2 the occupier's wave speaks once a world-day per system («Полки полны… Страдают другие»), a line says the counter is empty; organics, ice and isotopes sell ×2 (`sellCargo`). ~~**Open:** the pickets' hail answered by speed, parts ×2~~ (done 18.09: `hailBlockade` counts the blockade, the picket's «стоять» is outrun at two thirds of full speed without anger — «ответили скоростью», legal for a neutral; alloys sell ×2 as the parts). «Буханка» built (above). Original: The blockade exists (`occLvl≥2`, `12-economy` ~223:
  drone circles stop, barges stand, the H1 battery lifts it); what it lacks is the voice — the occupier's
  wave says the shelves are full and the others suffer, the counter is empty and pays **×2** for food, fuel
  and parts; running it is legal for a neutral, the pickets hail you and you answer by speed. **«Буханка»** — the
  base's surface–ship shuttle as a named machine (M485), a boxy old van with engines, always a bit
  broken, **the one machine the player may rename** (from the name table, no free text).
- [ ] **M464 One giant per arm — first pass BUILT 18.09 (Control), `src/17o-giants.js`.** Fixed geography, not war: six around the disc at 18–26 sectors (angle step 60°), snapped to the nearest star, the hollow moon near the core; a ringed cross mark with the name under it on the map; in the system the body 2600 from the star, 600–1400 units wide, one silhouette per kind (moon with lit rings, Дом водителя with windows, the cylinder with КОМПАНИЯ™, customs forms, the dry dock with its hull, the town in rocks, the mast garden blinking); first sight logged (`G.giantsSeen`). **Open:** the drawing itself (D26), the ruler in the frame, docking/visiting, arms matched to the galaxy model's real arms. Original: Each arm and the core get one colossal structure 20–50× a ship,
  named in the galaxy's voice: a hollow moon with a mining town lit in rings; the Коммуна's dry dock
  where one hull has been built for three hundred years; the Компания's cylinder with its logo
  along its length; ГЛАВТРАССА's «Дом водителя» the size of a station; Орднунг's customs city where
  every building is a form; Хай-Фронт's relay garden; Рассвет's belt town in the rocks. A landmark
  on the map and a ruler in the frame. (The Ring, M154, is not one of these.)

**Cut for good, so they are not re-invented:** six musical modes (→ a motif each, M457); the tunnel
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
