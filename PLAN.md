# Drift — the plan

Only what we want next. What is done is not kept here: the story of each version is in
`PATCHNOTES.md`, the old plan bodies are in `docs/done/` (files of at most 40 KB — grep them by
M-number), and the rules and decisions that stand are in `docs/DECISIONS.md`. A finished item is
deleted from this file in the commit that finishes it; its story goes to the patchnote.

**How it is worked.** Start the session here; open the design section an item names; measure before
touching; commit locally; the whole run (`test.ps1`, `-Full`, `-Mobile`, `-Mutants`) only before a
push. Stages 2–6 go on the author's word. Where an item and a design document differ,
`docs/DESIGN-review-2026-09-14.md` wins. The phone playtest's rules bind every item: a screen never
loses its scroll, every screen answers «чтобы что?» before it is redesigned, optimise without losing
quality, the ship stays under the finger.

**Release checkpoints** — a push after the whole run: after the phone tests, after stage 2 («чья
земля»), after stage 3 («дорога»), then per stage. The engine (§0) ships as each piece is accepted; Контроль pushes after
the whole run.

## 0. The engine — everything on WebGPU, first (the author, 23.09)

«Первое — на новый движок, потом по плану.» WebGPU only and no 2D canvas anywhere, the interface too (the author
25.09: «2D-канвы — их надо все вырезать и заменять на наш новый движок»; 26.09: «надо все переносить на движок, и 3D
уже добавлять где можно»); no fallback; every ported layer better than before, not the same. Every step: a pair with
max|Δ|, uploads and submits per frame as numbers; physics, seeds, the save and QUANT stay untouched. The recipe — the
frame, the one rule of layer order, the kit, the porting checklist — is `docs/DESIGN-gpu.md`; the decision is in
`docs/DECISIONS.md`. Built: the core and post pass (08b), the layer kit (08c), the space backdrop (16g), the system
under the planets (17g), planets and moons (17ga), the system view on top — trail, wake, exhaust, hull light, drones
(16ga), combat (13z), lit station/barge/pirate sprites (17c), shuttles (17f), the interface overlay `#ovl` (08bi;
`#hud` gone in 0.466.0, the sticks and the watch line on `#ovl`, the iPod on its own WebGPU canvas), planet
occluders (`GPU.oc`), the hull material (08cd), `docs/shot.py` and `docs/tour.py` on the GPU.

**The order (Контроль 26.09, after the audit: the middle was being built on an unchecked base):**
1. Keep the base: the phone gate P1 (§1) passed on 0.468.0 (26.09) and closed engine stage 1; it is re-run after
   every engine release, and while it fails, speed goes ahead of every picture pass.
2. What is in flight lands before anything new starts.
3. G15: what still draws in 2D moves to the engine, then 3D where it reads.
4. Picture passes (the redraws, L1–L3, G5) only in the gaps, each closed by its pair.

The game's stages (§3–§8) wait for the author's word; Контроль asks once P1 passes and the fleet has landed.

- [ ] **In flight** — each release deletes its line here:
  - the fleet (its own session: the cloud's zones into main) — engine stage 2, the other modes, G6–G13 as the zones
    drew them: landing and surface, cave, the belt rocks and the raid in `gpuScene3D`, the road, the map, life. It
    lands after its tests, whole-frame pairs and six regressions (the pairs 26.09: the belt, «Сорока», the raid,
    the spa, the surface by day and winter better; worse and fixed before it lands — the lamps in five scenes
    going white and losing their cones, the base's strip of sky with the ridge, the map's milky core and glare,
    the scoop's lilac giant gone brown, the cave's turquoise), with its census of 2D calls after `gpuWorld` at 0
    (its census 26.09: 0 in all 25 scenes; what is still drawn before `gpuWorld` is G15 below). After it the tour (NEYEL, Коммуна, wrecks, rescue, drones, «Сорока», belt, hotel, planet,
    dock) is rerun and every flight item stays at 0;
- [ ] **Redraw passes** (§L.S), each closed by a pair of the WHOLE frame at 760 and 390:
  - ships in real light (the worker, `gpu-ships`): a, b, c, d, e, g landed in 0.471.0; open: f — one more try
    on the keels by the emission mask, else revert; h — makerRead on the GPU frame;
  - the flight HUD as a quiet instrument (a–g): one pair at 390×844 and 760 to the author for a verdict before any
    other screen;
  - the nebula much better (GPU-2; the author 26.09: «туманность хуже не будет, она должна прям быть лучше на много,
    потому что сейчас она хорошая»). The look first, the price after: three candidates at any cost on the PC, each a
    pair of the whole frame against the live release (standing by the star, in flight at v 8; 760 and 390; a ×3
    crop); the best one goes to the author before it ships; only what reads clearly better at first sight, never «a
    bit different». The 24.09 rules hold (no threshold contour; dust 10→90 % over ≥ 40 px at 760; a change of tone
    over ≥ 150 px; field S ≈ .40–.45, no neon). Directions: depth that reads (far layers cooler, dimmer and softer;
    forward scattering — the gas between us and the star rimmed against the light); fine wisps inside the lit gas
    with soft mass edges; a slow flow (curl noise, seen over 10–20 s, never a flicker); young stars inside (soft
    cavities, a blue reflection haze, the brightest knots in HDR with a soft halo); the palette turned round the
    wheel, each system its own character;
- [ ] **Heat margin** — on the S23 the frame's price is the nebula (2.6 + 1.2 ms of 8.6), then the star's corona
  (≈ 0.65 ms, only if the heat gate asks for it):
  - the nebula's regeneration (GPU-2). Step 1 (a826a27a, gpu2-lit): standing, age 6 with a linear cross-fade — the
    step ≤ 0.09 px, no pulse; S23 nebGen 1.81 → 0.93 ms. In flight it still regenerates every frame: nebGen 4.85 of
    a 10.4 ms GPU frame (S23, v 8). One reprojection uniform fails — the layers slide over each other (local
    parallax p5/p50/p95 .007/.13/.59; slip at the best single uniform p50 .56, p95 3.5 px a frame at v 8), so any
    reprojection is accepted by a 16-tile Lucas–Kanade measure (p95 ≤ 0.3 px), never by a global phase
    correlation. Next, once the look is chosen (Redraw passes, «the nebula much better») — its price, never on the
    generator that is going away: B — knock-outs per part (early exit outside the mass, fewer octaves under dense
    dust; max |Δ| ≤ 2, p99 < .5), and A′ as far as the new look needs it (gate: in flight no dearer than 0.471.0 on
    the PC, A/B/A; the S23 when it is back) — a world-anchored toroidal cache per layer (.02/.044/.045/.097/.12), only the strip that opens is
    generated, the non-linear mix (dust over gas, the rim by total gb, the star's lit/ion/tint, cvn) moves to the
    read with the same math, the flow regenerated at age 6 with the cross-fade;
  - P1 14/n (e): planets whose shadow cone cannot reach the screen culled on the CPU, exact to half an LSB.
- [ ] Debts: max|Δ| of 7d10c66^ against 7d10c66.
- [ ] **G15 everything on the engine, and 3D where it reads (the author, 26.09).** No 2D canvas stays, the interface
  too: in main 4778c719, 52 files in `src` still open a 2D context. Onto direct paths (`gpuLitSprite`, atlases,
  instances), never a `GcCtx` in place of `ctx` (DECISIONS, «The renderer»); text through a glyph atlas on the GPU.
  The engine already has `gpuScene3D` (08b: depth, per-pixel light); the belt rocks and the raid use it. Owners:
  - the interface — GPU-3; its census (26.09): the panels by how often they open (the desk 27i-ui-table first —
    six 2D contexts, then ОПИСЬ, the station, the post and the album, КБ, faces and the suit); a bake at first sight
    costs a hitch on the phone (P1, §1), so rank by that too. The station showcase as one canvas, the hull from the
    worker's studio function; the ship in ОПИСЬ — the worker (27j0); the raid
    comes to the engine with the fleet's landing (gpuScene3D, the fleet's zone) — then re-run the 2D census on it;
  - space (16-flight, 16a-space, 16a0-glow, 17o-giants) — GPU-2;
  - the hull bake (03e1) — the worker;
  - the fleet session, by its census (26.09, 25 scenes; 2D calls on `#c` before `gpuWorld` / `#c` uploads, a frame):
    the surface (≈250 / 5: the deco, the lander, ground chunks baked ≈27 a frame on the descent) and the landing
    (91 / 3); the map (1191 / 2: emblems, holdings, `drawMap`, the backdrop 17z and its rulers); the mine (977 / 2),
    home outside (779 / 5), the base (104 / 2), the cave (58 / 2); then the road's own layer (hull, trail, glows,
    jets, coins), the scoop, the raid. Labels drawn into the world layer (the surface HUD, the scoop, the base, the
    home) go onto `#ovl` with the 08bi primitives. Already 0 and 0: cinema, HQ, winter, spa, system, dock, cabin,
    counter, belt, «Сорока». Its guard wraps `MAIN_CTX`'s own methods (08c's hook hides a prototype wrapper —
    the first census read 0 on `#c` at 2–5 uploads a frame), is checked against `#c` uploads, and turns red on an
    injected call. The base's GPU bake (the fleet's zone, a850203f; main draws the base in 2D) goes in tiles: at
    2560×1440 its 4078×2092 layer with 4× MSAA and a stencil is 198 MB for a moment, 277 MB with the pool (131 MB on
    the phone at DPR 2.625), new against main — before the landing an out-of-memory error scope bakes it at
    sampleCount 1 when refused, with a test on that path; after it, MSAA kept, a tile ≤ 24 MB (1024×512 or
    768×768) living in the pool's slot, geometry culled per tile, resolved into one layer; bit-exact to the
    current bake (max |Δ| ≤ 1 on the seams), the bake's time A/B on the PC;
  - the air (19b-sky, 19e-clouds, 19d-weather, 19c haze and grade, 18a1-glaze, 18d-postfx; G5) and the mine's sky
    stars (16-flight `drawStars`, a `fillRect` per star) — GPU-2, after space.

  3D, one object per spike, each closed by a pair of the WHOLE frame at 760 and 390 and the S23 cadence, cold,
  A/B/A; rolled out only when it reads better at first glance and is not slower:
  - ships: the hull pieces as meshes under the 08cd material — the worker;
  - space: a station, then asteroids and wrecks in flight, then turning planets — GPU-2;
  - landing and surface: the relief of the ground chunks as a height mesh — the fleet session;
  - the air: clouds as volumes, haze in depth — with G5.
- [ ] **L1 the space backdrop as a volume (before G5…G14):** a domain-warped FBM nebula, emission plus absorption,
  three parallax layers, dark dust lanes that hide stars, a slow flow; lit by the system's star — brighter and
  warmer toward it, and the star's glow is scattering in the nebula and dust (it went dark in gpu: x 0–300 of
  k_g4m main (156,72,52) → gpu (67,37,36)). Near-camera dust with parallax and stretch in flight. Budget: nebula
  at ¼ resolution, not every frame, ≤2 ms on the laptop (`prof()`).
  - [ ] L1b the dust's tadpoles (GPU-2): gas clumps behind a half-body read as fish at 760 — option B, a longer
    outward ramp over the void, no new `dustAt`.
- [ ] **L2 HDR light:** everything emissive into rgba16f at real brightness (star ≫ flames ≫ lamps); bloom as a mip
  ladder instead of the ¼-frame 4×4; AgX/ACES tone map; a grade per star class — one shot tells where you are.
- [ ] **L3 light touches the world:** normals from baked sprites' relief, a list of point lights (flames, beams,
  bursts, station lamps): a beam or a burst lights hulls nearby, metal gets a glint.
- [ ] CI with WebGPU (Контроль 24.09): the smoke in `deploy.yml` runs `--disable-gpu`, so it proves only the
  «no WebGPU» notice. Turn WebGPU on in CI through SwiftShader (the flag set proven locally first), then the
  smoke and the picture suites see the real frame.
- [ ] **G5 the air, the rest (frozen for L1–L4):** done — sky, disc, scattering, shafts in the final pass (08b). Left:
  live clouds (`drawClouds` 19e), haze bands (`hazeBand`/`hazeFar` 19c), weather in depth, night lamps, the water
  mirror, the grade; shafts must be shown to read — a sun behind cloud gaps (the 2D clouds are too thin to cut
  rays; clouds on the GPU first).
- [ ] Debt: a frame encoder for bakes (its own buffer pool) instead of one submit per `gpuBake` — take only if a
  profile shows hitches on bake frames.
- [ ] **G14 the rest:** the postcard painter on the GPU if it reads better; the `gfx` options of the 2D era
  (resolution tricks, `draw`) reviewed — keep what still means something.
- **Gate:**
  - every mode drawn by WebGPU with zero validation errors on the laptop and the S23;
  - each step closed by a `main | gpu` pair of the WHOLE frame, scaled to 760 px wide, visibly better at first
    glance (crops only as an extra), and one line of what got better (main
    references shot once from `origin/main`);
  - every launcher (`deploy.yml` 62/79/195/209, `mkshots`, `mksiteshots`, `pageshot`, `shot.ps1`, `towebp`,
    `test.ps1`) shoots one scene that is the game, not the «no WebGPU» stub — the GPU flags live in one place
    (`docs/shot.py`), the other launchers call it or are deleted;
  - the GitHub runner has no GPU: the same flag set on the software adapter (SwiftShader) proven locally
    first, then in CI;
  - callers of `docs/shot.py` (`vetshot.py`, `lab`) run;
  - the phone gate P1 (§1) passed; the whole run green.

## 1. Phone tests — smooth flight on the S23

The base of §0: no picture pass counts until the S23 flies smoothly (the author 18.09: «на тел дергается все
прогоны … плавный полет нужен»). The numbers of the 2D era (18–24.09: raster, `lighter`, DPR, the stick at 26 Hz)
are history — every old item is measured again on the current build, then cut by its numbers. Every measurement
follows the cadence protocol in `docs/DECISIONS.md`.

The phone (the author 26.09: «тел доступен пусть используют»): the S23 over Wi-Fi adb (`adb mdns services`,
`_adb-tls-connect`). One session at a time: `C:\Claude\phone.lock` taken with noclobber, held ≤ 10 min, a lock
older than 15 min may be removed; the CDP forward only under the lock; each session its own port through
`adb reverse` (the worker 8811, GPU-2 8812, GPU-3 8813, the fleet 8814). Measure cold (a new `*.localhost` host:
Chrome keeps compiled pipelines per site), off the charger and cooled — or on it when full (status FULL, 100 %) with
thermal 0 logged before, mid-run and after (the author 26.09; a charging phone heats, and Samsung cuts the GPU to
295 of 719 MHz), A/B/A; never start a run because the screen woke — an incoming call looks the same.

- **P1, the gate after every engine release** (`docs/phone/gate.py --port N`, GPU-3's 0b186c5c): S23, a local copy,
  30 s of flight in НЕЙЭЛЬ by the stations: ≥ 95 % of frames in 16.7 ms (≤ 18 ms with the vsync jitter), none
  ≥ 50 ms; then 5 minutes at ≥ 95 %; the picture at 760 no worse. Before a run: no other tab working in that Chrome
  (a browser miner, «CryptoTab Pool», was there on 24.09), no stuck touch (`gate.py` checks logcat, getevent and the
  page's counter; `waitquiet.py` waits for quiet).
  - The phone is away (the author 26.09, «работаем без телефона»): releases go without P1, costs are measured on
    the PC (A/B/A at 1920 and at 617×1113, DPR 1.5, marked «PC»); when it is back, P1 runs on the latest release.
  - The baseline — passed on 0.468.0 (26.09, GPU-3, on the charger at 100 %, thermal 0 throughout): cold 30 s 100 %
    of 1800 frames, max 16.9 ms; 5 min 99.98 % of 18002 frames at 60.0 fps, none ≥ 50 ms, three frames of 33 ms at
    40, 116 and 202 s — one vsync skipped with no bake, pipeline or new texture in them, the GPU 17–21 ms around
    them: the margin is thin, and the heat margin of §0 stands. The bake at ≈ 15 s that cost 83 ms on 25.09
    (9206be7: 2D bakes at first sight rastered by Skia in the GPU process, and `#c` cleared at opacity 0 every
    frame) passed without a hitch.
- [ ] **Then cut by its numbers** — each old item measured again on the GPU build first, dropped if it no longer
  shows: the hull bake on vs off (`G.opts.gfx.hullBake=0`); the baked star core and hull (the star's breathing, a
  step at the baked picture's edge); tails at ×2.40 (the author's «куцые хвосты», filmed); P8 under the finger, P9
  zoom, M484's long press; the two bills — the steady late frames of live steering and the spikes on events (a
  window opening or closing, a hint, the compass chips re-laying out), measured as the cost of an EVENT; JS off
  `frameBody` (`FRAME_JS` EMA before/after); GC (the phone trace's allocation sampler); heat (a 30-min run with
  `dumpsys thermalservice` every minute); the flat-60 cap (the author says whether «откидывает назад» is gone); the
  «каша» by the star at ×0.16 (ask the author).
- **Gate:** cadence ≥ 95 %, no frame > 24 ms in 60 s of steering, `RES_AUTO ≥ 2` (under the phone's cap of 1.5,
  08-state `PHONE_DPR`), `g11` ≥ 55 fps in every mode on the laptop. The gate is re-run after every stage and every
  engine release; a stage that breaks it is not closed.

## 2. The frame on a laptop GPU — levers measured, not cut

Cut only at the same look, or when the picture gets better (the author 23.09: «можно что-то делать
только если графика лучше будет смотреться»). Method in `docs/DECISIONS.md`. The 2D-era levers — the vignette
blit, the star's `lighter` sprites, the station rebaked every 18 ticks — went with the 2D frame; what is left is
measured on the GPU build first:
- [ ] backdrop blur on the DOM buttons (`backdrop-filter` in `style.css`; ~2 ms in the 2D era) — while they are DOM.
- [ ] the surface at ×2 (~30 fps in the 2D era, plants 1.3 k canvas ops) — after the fleet lands, by `prof()`.
- [ ] One look at the scoop frame: its flame follows `lvl=G.mods.engine` since 18.09 (it grew on the
  climb before), never looked at since.

## 3. Stage 2 — whose land, in five seconds

- [ ] **M453 the stamp + P14 КНИЖКА:** Ялта's stamp and the pirates' scratch cannot be earned yet; the rest of P14 — seals, vacation savings, the grounding ending on the page.
- [ ] **M454 the station by its builder:** the maker's grammar on the modules and the core (profile law,
  seams, joints), not the common kit with a dressed plate; the Орднунг ribs hide under the modules.
- [ ] **M447/M448 the galaxy:** M450 the overview and M451 the flight sky from the same model; verify the
  drag detector's thresholds («deep < 8 %, sheet ≥ 25 %» were set before measuring).
- [ ] **M458 map borders:** territory edges as lines in the owner's pattern (dotted stars, ring marks,
  numbered dashes, a wave, uneven dashes with suns, dots), 1:1 with the sheet; the emblem chip readable
  (14–18 px) at near zoom; the glyph on the compass label and the header. Not started.
- **Gate:** on any jump in the settled circle a tester names the owner within 5 s without reading a label
  (three testers, six powers); the stamp lands once per crossing.

## 4. Stage 3 — far, and back with a hold

- [ ] **Oracle lines** (`91zzzzzzzzz-worlds`): the best rail round trip ≤ ×1.3 of the best jumps in credits
  per minute of play (baggage is the lever); the stripped hauler's best one-hop deal (for M478).
- [ ] **M466 reading and ЖИЛА:** the cave (янтарь) and the hunt (жемчуг) give nothing yet; the rumour a
  сводка later and company on the approach; the reading on the planet card and at the dig entry; тёмное
  стекло in the instruments narrowing every reading by half.
- [ ] **M467:** far goods for sale in the heart, rarely and dear.
- [ ] **M469 eaters:** the goods actually consumed by the yards' densities and доводка, the luxury counter,
  the hotel shop.
- [ ] **M470 the net:** stop names by owner (the M489 rule) and «Край»; lines beyond r 60; the scheme as its
  own screen (КУДА ВАМ).
- [ ] **M471:** the bare rim platform; helm assist in the ring's cone.
- [ ] **M472:** split-flap turning; крупногабаритный ×3.
- [ ] **M473:** the held pad ×2; a save mid-ride wakes at the origin today.
- [ ] **M474 six railways:** Рассвет's маршрутка (stop anywhere on the line), the dashed Express line on the
  scheme, closed front stops. Test fragility: the ride suite picks the first heart metro station — if its
  land ever turns Орднунг, the suite needs the double press.
- [ ] **M475 economy and growth:** fares, baggage and the size rule tuned against the oracle's rail line; a
  holding-built station, «продление линии», a late holding deed named by the generator.
- [ ] **M508:** the pirates' respect for a sealed hold. **M510:** shut stretches of the front — the line
  itself cut.
- **Gate:** from home to a rim полустанок and back with a hold of deep goods in under 4 minutes of play,
  paying its ticket on an average roll; the ride never shows a loading screen.

## 5. Stage 4 — the ship

- [ ] **M476 the plan:** unique, fused and NPC hulls in the suite; the hold's green is barely visible.
- [ ] **M477 the КБ:** footprints 2/4 turning and the Орднунг «поворот не предусмотрен формуляром»; the
  numbers strip with deltas; ПРОЕКТЫ ×3; the foreign yard's bill per cell moved; ОСНАСТКА's hull section
  into КБ; the tray showing things from the hold.
- [ ] **M478 numbers from the plan:** fuel from tank cells, energy from reactor cells, hull from armour parts,
  sight from nose-third instruments, module tiers as densities. One mapping table: `hold`/`tank`/
  `weapon`(reactor)/`armor` become densities per cell (per hull size, never shown as a number);
  `engine`/`hyper`/`drill` stay station upgrades; the fixpoint suite covers both halves.
- [ ] **M479 exposure:** rim parts take their side's wear when hit from that side; «engines take it» from
  behind.
- [ ] **M483 the fast path everywhere:** NPC and pirate ships built by the packer; the new-part mark
  (ПРОЕКТЫ is under M477). Not started — `docs/DESIGN-shipyard.md` §10.
- **Gate:** an old save loads with every number unchanged; a hauler stripped to the hold and a warship
  stripped of hold both fly under the finger the same (the P8 meter); the blueprint gets its almanac issue.

## 6. Stage 5 — the voice and the joke

- [ ] **M485 machines with names:** the base crawler, the tug, the barge's autopilot.
- [ ] **M486 изолента:** the кулибин trait; tape on a part, not only the hull; the first hour's ДО 50 %
  button anywhere.
- [ ] **M495 the triangle:** parts do not break — the Компания/Хай-Фронт part failures need a part-failure
  mechanic first; the bar of hold music; the old master's free seam.
- [ ] **M489 names by owner:** settlements, holdings, the station header; firms where they appear.
- [ ] **M492 Космопочта:** a rare part and cooperative goods as parcels; a real queue.
- [ ] **M460 billboards:** 1–3 signs; the hull tint within R; the сводка, циркуляры and holding lines;
  stale prices as a fork. **M491** through `12p-news` at the сводка. **P12** ЭФИР.
- [ ] **M461 hotels:** six faces in DESIGN-life §3.3, two built — «Космос» (17l1) and «Дружба» (17l2, 0.470.0).
  The other four have their sign, window rhythm and hours but stand in «Космос»'s crescent (`hotelType` falls
  back to `gt`): «АЭЛИТА™» (Компания, a Stalinist tower on a rock), «ДОМ ПРИЕЗЖИХ № 4» (Орднунг, khrushchyovkas on
  a truss), «ЮПИТЕР» (Коммуна, constructivism, red consoles, a glass cylinder), «БУРАН» (Хай-Фронт, a modernist
  grid with a saucer and a mosaic) — each its own file 17l3…17l6 on the engine, closed by a pair at 760 and 390,
  at 19 h and 3 h (the author 26.09: «у нас же 6 типов гостиниц было»; when — «после», after the engine). Then the doors (the sanatorium wants a
  voucher and an ocean world — how a hotel offers it); cantina rumours at the desk; fatigue (does not exist for
  the player).
- [ ] **M455 the peacetime fleet:** субботник, strike and rite driven by the chronicle's days rather than
  always; the belt tugs are far from the station view.
- [ ] **M456 laws:** «сделаем из ваших» (Рассвет); the fine's ticket in ПОЧТА instead of the journal; the
  lunch shown on the trade tab.
- [ ] **M511 волокита:** the animals the author will invent (his table).
- [ ] **M512 societies:** duties (субботник, the week's parcel), ДОСО, спасатели, дачники, читатели; the
  arithmetic on the desk.
- **Gate:** a tester laughs once in the first ten minutes at something inside the world, and can say
  afterwards which institution the joke was on — never a person.

## 7. Stage 6 — the story and the rest

- [ ] **P15 «Смена»:** a chapter's deed in the place, not just a landing; check that 72 distinct kinds of
  place exist within reach.
- [ ] **M457 sound:** an ear pass on the six motifs (the AnalyserNode check of `docs/VERIFY.md` at a release
  run); the receiver speaks the owner's `air` line once at entry.
- [ ] **M480/M481 yards:** the free cells (need the plan, M477); Хай-Фронт firmware moving a part per
  сводка; Рассвет hull points back from debris; calibration by the worlds oracle and the стрельбище.
- [ ] **M484 the special system:** the ability named on the ship card; СИРЕНА answered by the ships actually
  in view.
- [ ] **M482 scars:** scars on captured pirate hulls; доводка — a weld with a node, +1 tier, two per hull.
- [ ] **M513 утильсбор:** the plate crooked when expired; the home yard refusing to re-plan the hull; the
  foreign warranty void.
- [ ] **M463 the bazaar:** odd lots beyond parts; rumours at the stalls.
- [ ] **M487 подписка:** base modules by subscription, and the cold store that stops giving; ×3 offered in
  a fight.

## 8. Stage 7 — the giants

- [ ] **M464 one giant per arm:** the ruler in the frame; docking and visiting; the arms matched to the
  galaxy model's real arms.

## 9. Seams to honour when the items above are built

Check each against the code before building — some may already hold.
- **Drones and the far goods (M465):** drones never mine band-2/3 goods and sell band-1 goods at the band
  price (½) — otherwise a drone on a rim жила prints money offline.
- **The stamp and the metro (M453, M473):** a stamp lands only on arrival by jump or on ВЫЙТИ, never on a
  stop passed through; the ring's «Стыковка?» hail fires only when heading into the ring.
- **The first hour (M452, M472):** the замполит hands the newcomer one жетон («первый — за счёт трассы») —
  the metro is met in the first hour, not found.
- **Rescue and rails (`16c-rescue`):** a dry ship at a rail stop gets a third exit beside ДОМОЙ / БУКСИР —
  НА МЕТРО, a ticket home for its fare.
- **The scheme's scope (M470):** your line, the rings it meets and their neighbours; pinch/scroll for more —
  never the whole infinite net. «Край» is per player.
- **Replays (0.1, P9):** the fixed step and the seeded entry angle each move every recording and same-hash
  suite once — one `-Accept` per change, named in the patchnote, `91zzzzzzzzb-replay` re-based.

## 10. Tests and tooling

- [ ] **Determinism:** `wanderer · A` reads real chance or time on the corridor's buy path
  (`wanderBuy`/`wanStep`, 24c); the clock out of `stateHash` (`08a-statehash`, ~79 `mixN(now())` — decided
  11.09: a separate field, `T.state()` returns both); `planetStripTick` by `wallMs()` writes `stripLvl` into
  hashed state.
- [ ] **Watch:** the quarantined «рейсы» — Омксиий (±3:∓1): «посадка: заход кончился режимом system»
  (23.09, Node and `-Mobile`); «кольцо дороги: отправок ровно по одной» (gate «полёт по переписи») went red
  once in a whole run for GPU-3 (25.09), neighbour unknown — does not reproduce at 66b51af6 (alone, and the
  gate set under `-Shuffle 1..3`); «прогоны: двенадцать путей» flickered once under load; «свет: звезда — самое
  светлое» went red once in the pane (the cumulus, `CLOUDS_OFF`) — one look.
- [ ] **Nets owed (M443–M446):** `TEST_T0` at local noon; a drawn-vs-undrawn hash detector; the tools'
  self-test before the net; not caught yet — the .55 auto-brake, the money-printing counter, idle drones;
  partial — helm switching, sharpness at DPR 1, contrast under a vignette; goldens per platform once the lab
  runs; M444 the cooperative walk, drags/wheel, the map per window; M445 a `DPR=.5` mutant; M446 a
  previous-version diff and `look()` telemetry; a per-suite dirty-page check after `fn()`.
- [ ] **Refactor queue, each a commit:** `detStuck`'s key law (fires only on a diff of exactly 0 — soften
  with the silence table); a shard that hangs now and then (`--enable-logging=stderr` on laptop runs so it
  names its suite; a part that fails by timeout names the last suite it started); the source net is line-based and the clock law skips `tests/` (41 raw calls); long
  functions, on touch only; the tools zoo → one way to take a frame; the button family merge; `-Times` for
  the Node tier.
- [ ] **The lab:** stopped since 11.09 (CPU 57 % of a day against 50 %) — a CPU budget per session before any
  restart.
- [ ] **A server frame-stats beacon** was asked for — it touches `site/api.php`: ask first.

## 11. Small things seen on the way (23.09)

- [ ] **Chips on the way to their slot avoid each other:** `CHIP_POS` glides a chip to its logical slot without a
  collision check, so two chips crossing lie on each other mid-way (seen 23.09 after a teleport). The law «chips never
  lie on each other or on the HUD» holds in motion too (main, not the gpu branch).
- [ ] **Station shuttles never drawn (main):** `sysTraffic` (17f) set `by` twice — the arc end's y and then the
  maker key — so every shuttle sat at NaN and M309 traffic has been invisible since M454. Fixed on the gpu branch
  (maker is `t.mk`); port the one-line fix to main.
- [ ] **Planet angles follow the frame rate, not the game clock:** `updateSystem` does `p.ang+=angRate(…)*dt`
  (moons and the station alike), so where a planet stands depends on how many frames ran — two devices see
  different worlds. Make the angle a pure function of game time (`ang0+spd*G.t`, same clamp). Check the save
  first: if `ang` is written there, the save format does not move — derive around it. Not on the gpu branch.
- [ ] **The belt entry on the phone:** `#msg` is clamped to 3 lines (`-webkit-line-clamp:3`), and an icy
  ring's fourth line pushes out «тяните по стеклу — обзор», the only hint of how to look around. Fold the
  ice note into the ore line.
- [ ] **Whose voice on the approach:** the lane — billboard, hotel, parked fleet — dresses by the station's
  builder (`st.by` in `sysLane`), while laws and stamps go by the land's owner (`stampOwnerAt`); in Итлуора
  a ГЛАВТРАССА billboard stood in Орднунг land. Decide which one speaks (M454 gives the body to the
  builder, M460 gives the sign to the owner).
- [ ] **A good's colour is also a text colour:** `RES[k].col` colours words in lists; тёмное стекло
  `#3c4a66` reads at about 2:1 on the dark UI, осмий is borderline — a text shade per good.
- [ ] **`03e-hull-draw.js` grew to 49 KB** with the yard marks: move the hull's marks (scars, transit plate,
  seal, yard mark) to their own module along that seam.
- [ ] **Old worktrees:** `C:\Claude\drift-refactor` (one WIP commit «stall report names who held the frame»,
  330 behind), `drift-lab` (an uncommitted `site/war.js`), `drift-t1`, `drift-t2`, `drift-tests` (still
  since 12.09) and the main checkout `C:\Claude\files` (236 behind) — see what is unmerged, then refresh
  or remove.

## 12. Economy audit (23.09) — holes read from the code, and the seams that close them

Read solo on 0.456.0: `12-economy`, `12ab-hold`, `12aa-need`, `12aj-coop`, `12l-barge`, `13b-occupy`,
`12al2-laws`, `17k1-gosplan`, `12c-mgr-core`, every `earn()` caller and all ~70 deductions of
`G.credits`. Nothing changed; each item below names the fix it wants. The net owed in §10 («the
money-printing counter») is the gate here. Ranked by weight.

- [ ] **The liberation prize repeats for one system** (`13b-occupy` `occKill`): 2400 + danger × 9000
  every time a system falls to level 0; a freed neighbour of a nest is re-occupied by `occTick` and
  re-freed for three kills, and pirates respawn on every entry (15-min seed bucket). The largest faucet
  in the game, several times the 200 кр/мин of trade. Pay in full once per system (a set like
  `G.gosDone`), half and fading after — or only while the nest is suppressed.
- [ ] **The hotel repairs for 12 кр** (`17l-hotel` `hotelDesk`): +10 % hull per press, `HOTEL_NIGHT` 12,
  no cooldown; the dock takes 14 кр per hp. Keep the kindness under a third (review 14.09); one night
  per game day per station, and the night priced near half of the dock's same tenth.
- [ ] **«Bought here, handed in here» at the plan and the order:** the appetite is guarded by
  `appetiteGotHere` (M331); the state order (`17k1-gosplan`, 1.3 × table price, handed in at the same
  station) and the order (`12aa-need`, 1.5 × table + 120 per sector, delivered where the cooperative
  can buy) are not; the expedition counter (`11x`) the same, nearly cancelled by ask and ×1.25. One
  ledger «bought here this shift» read by all four, one net.
- [ ] **«Per visit» means per docking** (`26-ui-station` `openStationBody`: `lawDock`,
  `scripVisitReset`, `coopVisitReset`): undock and dock again resets the cooperative cap 60/150, the
  40 bons and the ГЛАВТРАССА норма's 20 fuel at 1 кр. Key a visit on (station, `holdShift()`).
- [ ] **The escort advance without an obligation** (`12l-barge` `bargeEscortAccept`): 200 + 3 × cap
  (470–890 кр) at once; failure only when the barge sinks, leaving the system counts as success. Half
  at accept, half at the destination; leaving with the contract fails it.
- [ ] **The balance goes negative and the reload forgives it:** `12b-crew-events` seized
  (1.4 × gross + 400) and barvdebt (120 + .6 × gross) subtract without a floor — the only two of the
  ~70 deductions; `14a1-save-rest` clamps to 0 on load, so the debt vanishes with a restart. Either a
  floor as in `lawDock`, or a real debt (ПАЛАТА already keeps `P.debt` for bases).
- [ ] **Sale multipliers multiply** (`marketPriceCtx`): need ×2, monopoly, expedition, power ×1.25,
  embargo, strike, spy, then blockade ×2 in `sellCargo` — only pressure and appetite add inside the
  clamp, though the comment promises no multiplying; need in a blockade is ×3.1 on food. Take the max
  of need and blockade, and cap the product.
- [ ] **Smaller seams:** a drone in a need system sells at ×2 the whole window and never closes it
  (`sellDroneYield` skips `needClose`); the drone picks its market by seen prices and sells at live
  ones; an order's deadline runs from the window's end, so one taken late leaves 2–3 game minutes for
  2–8 sectors (count `due` from the taking); the factor's margin floor .05 scales with perk volume, so a
  maxed factor prints ~200 кр/мин whatever the market; `evacuate()` in `21-mode-surface` has no
  callers (dead — the live path is `16c-rescue`).
- [ ] **Owed from the audit of 4.09 (`docs/ECONOMY-AUDIT.md`):** the probe that moves to another leg
  when one goes negative (§6, never written); pressure decay on real time (A4) — a player back after
  two hours of play finds the same floor next day.
- **Gate:** three nets in «деньги не печатаются»: freeing the same system twice pays at most half the
  second time; buying and handing in at one station for the plan or the order never nets positive; the
  balance is never below zero after any row of the hired hands' event table. Found sound and left
  alone: the counter (ask on buying, pressure after selling, slices, spread), far goods sell-only,
  barges (sell above and buy below the destination, budget-capped), scrip (12 % round trip), the drone
  price 1.6ⁿ, people paid only online, the loan since 0.409.1.
