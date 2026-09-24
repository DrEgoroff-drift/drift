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
земля»), after stage 3 («дорога»), then per stage.

## 0. The engine — everything on WebGPU, first (the author, 23.09)

«Первое — на новый движок, потом по плану.» WebGPU only, Canvas 2D as the brush for text and vector shapes,
no fallback, and every ported layer better than before, not the same. The recipe — the frame, the one rule of
layer order, the kit, the porting checklist — is `docs/DESIGN-gpu.md`; the decision is in `docs/DECISIONS.md`.
Built: the core and post pass (08b), the layer kit (08c), the space backdrop (16g), the system under the planets (17g), planets and moons (17ga), the system view on top — trail, wake, exhaust, hull light, drones (16ga), combat (13z), lit station/barge/pirate sprites (17c), shuttles (17f), `docs/shot.py` on the GPU.

- [ ] **G4d the other ships lit:** the peace fleet, the ГЛАВТРАССА fleet, allies, the pirate base and «Сорока» are
  still flat 2D bakes with a top-lit gradient; give them `gpuLitSprite` (17c) as barges and pirates have.
- [ ] **G4c wrecks as hulls:** a wreck (`npcWreckDraw`, 13d-npc) is a flat dark disc labelled «КОРПУС». Draw it
  as the NPC hull by `w.seed` through `hullOf`, broken, with smouldering edges, a slow spin and the star's light; the
  label becomes a chip. After G4.
- [ ] **L1 the space backdrop as a volume (before G5…G14):** a domain-warped FBM nebula, emission plus absorption,
  three parallax layers, dark dust lanes that hide stars, a slow flow; lit by the system's star — brighter and
  warmer toward it, and the star's glow is scattering in the nebula and dust (it went dark in gpu: x 0–300 of
  k_g4m main (156,72,52) → gpu (67,37,36)). Near-camera dust with parallax and stretch in flight. Budget: nebula
  at ¼ resolution, not every frame, ≤2 ms on the laptop (`prof()`).
  - [ ] L1b dust, after e0e933f (Контроль 24.09): in l2c the top-right pillars at 760 read as shards or claws —
    heads sharper than they should be; rounder, blunter heads. Parked mid-way for the phone: near-star shards
    fixed (heads ≥ .38 H from the star, width from the full length, finer erosion), but the ionisation rim
    then reads as beads along thin crests in l2c — it toggles per ¼-res texel (not the erosion, not the
    gradient floor, a wider gradient step makes it worse); the patch waits in the session scratchpad.
  - [ ] L1b dust: try a dim warm light 10–20 px inward from the rim, so the cut-out becomes a body.
  - [ ] L1b dust, after 7658f17 (Контроль 24.09): at ×2.00 top right two small orange «tadpoles» — globules
    with a tail and no gas around read as fish at 760. A globule with no gas dims stars like the rest of the dust.
- [ ] **L2 HDR light:** everything emissive into rgba16f at real brightness (star ≫ flames ≫ lamps); bloom as a mip
  ladder instead of the ¼-frame 4×4; AgX/ACES tone map; a grade per star class — one shot tells where you are.
- [ ] **L3 light touches the world:** normals from baked sprites' relief, a list of point lights (flames, beams,
  bursts, station lamps): a beam or a burst lights hulls nearby, metal gets a glint.
- [ ] L4 sparks (Контроль 24.09, after 92679b3): at the burst peak they read as a drawn star-burst — uneven
  lengths and angles, 3–4 long streaks, the rest short.
- [ ] G2 star disc (Контроль 24.09, after 40f3276): reads as a flat orange ball — k_l2cB radius profile centre
  246, 198 at .85 R, a bump 201 at the limb, then glow 193; R 249–255 over the whole disc (clipped). Limb
  darkening into red with no bump at the edge, R ≤245 on the limb.
- [ ] G3b gas giant (Контроль 24.09): the thin jets along the flow still read weak at 1:1.
- [ ] CI with WebGPU (Контроль 24.09): the smoke in `deploy.yml` runs `--disable-gpu`, so it proves only the
  «no WebGPU» notice. Turn WebGPU on in CI through SwiftShader (the flag set proven locally first), then the
  smoke and the picture suites see the real frame.
- [ ] **G5 the air, the rest (frozen for L1–L4):** done — sky, disc, scattering, shafts in the final pass (08b). Left:
  live clouds (`drawClouds` 19e), haze bands (`hazeBand`/`hazeFar` 19c), weather in depth, night lamps, the water
  mirror, the grade; shafts must be shown to read — a sun behind cloud gaps (the 2D clouds are too thin to cut
  rays; clouds on the GPU first).
- [ ] **G6 landing and surface, the bodies:** ground chunks and far ridges as textures; deco, flora and fauna as
  sprites where order needs it; the plants' wind on the GPU.
- [ ] **G7 cave and mine:** tiles as textures, darkness and lamp light per pixel, ore glows, dust.
- [ ] **G8 the belt:** the asteroids in real 3D (`gpuScene3D`, depth, per-pixel light), the backdrop in one pass.
- [ ] **G9 the scoop:** the gas giant as a live flowing field.
- [ ] **G10 the map:** the galaxy backdrop, stars as points, the rails; the text stays 2D.
- [ ] **G11 rooms:** base, home, winter, spa, raid, HQ, cantina, wanderer — still parts baked, light and air on
  the GPU.
- [ ] **G12 road, rail ride, cockpit:** the road's CPU bloom field (26 Hz `putImageData`) becomes a shader.
- [ ] **G13 tests and tools:** the harness waits for the device; pixel suites and detectors read
  `gpuSnapshot()`; goldens re-accepted; GPU flags in `test.ps1` and CI; `shot.ps1`, `pageshot.ps1` and the
  stand server removed — the `mk*.ps1` sheets, `g11` and `lookrun` go through `docs/shot.py`; `mkshots` and
  `mksiteshots` without `--disable-gpu`.
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
  - the phone cadence of §1 at least as good as before; the whole run green.

## 1. Phone tests — smooth flight on the S23

The renderer is moving to WebGPU (§0, the author 23.09) — the raster numbers of §1 and §2 are measured
again on the GPU build before anything is cut.

The author 18.09: «на тел дергается все прогоны … плавный полет нужен»; «потом пройдемся все
померяем, отдельно веха тесты на тел». Known: with the stick under the finger 80–83 % of frames make
16.7 ms, without it 99–100 %; our JS is 6–8 ms — the deadline is lost in the raster. Every
measurement here follows the cadence protocol in `docs/DECISIONS.md`. The author allowed testing any
time; the S23 shows in `adb mdns services` only with «Беспроводная отладка» on (on 18.09 only
`192.168.1.52:5555` answered, unauthorized until «Разрешить» on its screen). Tools:
`docs/night-2026-09-13/raw/phone-tools`.

- [ ] **First, above all the picture work (Контроль 24.09): 0.457.0 on the author's S23 runs at 24.9 fps**
  (median 33.4 ms, p90 50, frames alternate 2 and 3 vsyncs — the eye reads a 50 ms frame as a step back;
  pauses of 100–150 ms every 20–60 s, worst by Коммуна in someone else's fight; both canvases 822×1484).
  Gate: S23, 30 s of flight in НЕЙЭЛЬ by the stations — ≥ 95 % of frames at 16.7 ms, none at 50 ms; the
  picture at 760 no worse (a was | now pair). Done so far: the phone's DPR cap 1.5 and `?g11=deep` (in place,
  per GPU pass, DPR steps) — cut the rest by its numbers. Then:
  - two headless shots of one scene at one DPR show different stars (`ph_same.png`, 24.09): the starfield
    is not pinned per launch, so no was | now pair can compare stars. Find the unpinned draw.
- [ ] **Before the runs:** ask the author to close the two «CryptoTab Pool» tabs (`web.ctpool.net`, a
  browser miner) in the same Chrome; fly with the real finger — the S23 reports touch at 240 Hz, a CDP
  stick at 26 Hz; suspect the long save (160 log lines, 21 drones, 493 DOM nodes) only if those two do
  not clear the stutter.

- [ ] **The hull bake, on vs off** (`G.opts.gfx.hullBake=0`) — the only number that says whether baking
  helps. If it helps: bake the other modes' still bodies (station, landing, belt) by the rule «bake what
  fills its box, never slivers», checked with the caller breakdown (`layers.js`). If not: stop baking.
- [ ] **Acceptance of the baked star core and hull** on the phone: the star's breathing, a step at the
  baked picture's edge.
- [ ] **Tails at ×2.40** (the author's «куцые хвосты»), filmed on the phone.
- [ ] **P8 under the finger, P9 zoom, M484's long press** — the phone check for each.
- [ ] **Two bills, fixed separately.** A real reference first: the same scene, the stick confirmed born,
  no windows open, 10 s of continuous steering. Then the steady ~14 % of late frames from live steering,
  and the spikes on events — a window opening or closing, a hint appearing, the compass chips re-laying
  out. Measure the cost of an EVENT, not the average frame; every skip names what was on screen.
- [ ] **Four milliseconds of JS off `frameBody`** at the same look, one function per commit: draw only the
  wake and trail points that are visible and merge sub-pixel segments; `hud`/`drawSysHud` touch only what
  changed; the hull's outline cached per scale. Meter: `FRAME_JS` EMA before/after, then the phone.
- [ ] **GC (0.6):** three sources hoisted out of the frame, unmeasured — `performance.memory` is frozen in
  this build; the phone trace's allocation sampler decides.
- [ ] **Heat (0.7):** 75 min gave thermal MODERATE and 37 fps at ×1 — a 30-min run with
  `dumpsys thermalservice` logged every minute.
- [ ] **The flat-60 cap of 0.453.0:** the author flies the phone again and says whether «откидывает
  назад» is gone. The four white parked ships by the lane still keep their size floor.
- [ ] **The «каша» by the star at ×0.16:** ask the author whether the fleet/billboard label and the hotel
  prompt over the lane still read as clutter.
- **Gate:** cadence ≥ 95 %, no frame > 24 ms in 60 s of steering, `RES_AUTO ≥ 2` (under the phone's cap of
  1.5, 08-state `PHONE_DPR`), `g11` ≥ 55 fps in every
  mode on the laptop (landing and surface fail it on a big canvas — paint area, `gfx.res` auto should step
  down there). The gate is re-run after every stage; a stage that breaks it is not closed.

## 2. The frame on a laptop GPU — levers measured, not cut

Cut only at the same look, or when the picture gets better (the author 23.09: «можно что-то делать
только если графика лучше будет смотреться»). Method in `docs/DECISIONS.md`.
- [ ] The vignette (~1–2 ms, one full-screen blit); the star's body, corona and bleed (full-screen
  `lighter` sprites); the station rebaked every 18 ticks (`Math.floor(G.t/18)` in the `stationArt` key);
  backdrop blur on 12 HUD buttons (~2 ms).
- [ ] The surface at ×2 runs ~30 fps (3.8 k canvas ops, plants 1.3 k): plant poses can now be baked —
  between gust crests they are nearly still — but their glow uses `lighter`, which blends differently in
  a sprite. A look change: ask first.
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
- [ ] **M461 hotels:** the doors (the sanatorium wants a voucher and an ocean world — how a hotel offers
  it); cantina rumours at the desk; fatigue (does not exist for the player).
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
  (23.09, Node and `-Mobile`); «прогоны: двенадцать путей» flickered once under load; «свет: звезда — самое
  светлое» went red once in the pane (the cumulus, `CLOUDS_OFF`) — one look.
- [ ] **Nets owed (M443–M446):** `TEST_T0` at local noon; a drawn-vs-undrawn hash detector; the tools'
  self-test before the net; not caught yet — the .55 auto-brake, the money-printing counter, idle drones;
  partial — helm switching, sharpness at DPR 1, contrast under a vignette; goldens per platform once the lab
  runs; M444 the cooperative walk, drags/wheel, the map per window; M445 a `DPR=.5` mutant; M446 a
  previous-version diff and `look()` telemetry; a per-suite dirty-page check after `fn()`.
- [ ] **Refactor queue, each a commit:** `detStuck`'s key law (fires only on a diff of exactly 0 — soften
  with the silence table); a shard that hangs now and then (`--enable-logging=stderr` on laptop runs so it
  names its suite); the source net is line-based and the clock law skips `tests/` (41 raw calls); long
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
