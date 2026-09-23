<!-- docs/done/done-19.md — part 19 of 30 of the done work, in the order it was written; see README.md -->

## From PLAN.md (moved 2026-09-10): Side passes of 2026-09-07 — the author's own asks, built in a worktree beside the base queue

Struck entries' bodies as they stood in PLAN.md; the one-line heads stay there.

  говно… из любого места на экране пальцем двигаешь и корабль туда летил… коротко назад он
  тормозит… за пальцем идёт широкая полоска, чтобы понимать как оно». M410's intent was right;
  five numbers and one boundary were wrong (`15a-helm` header has the five). The stick is now born
  **anywhere** on the canvas — a finger becomes one by moving `HELM_TAKE` px or lying still past
  `HELM_TAKE_MS`, which is outside the 400 ms tap window, so taps (autopilot, lock, chips) keep
  both halves. Its centre **runs after the finger** (`helmDrag`), so the way back always costs the
  same 82 px however far you dragged — that is «коротко назад» falling out of the geometry rather
  than being a gesture of its own. Pulling back **is the brake** and takes the same road as the
  dead zone and the ТОРМОЗ pad, at `HELM_STOP` and regardless of where the nose points: a full
  stop in 1.4 s against 1.6 s to full speed, where before it was 4.1 s of maneuvering thrust — the
  one correct guess about a phone, punished. The nose holds along the course while braking (it
  used to swing 180° mid-stop, and the physics jumped from maneuvering to main halfway). A
  released stick always coasts; the .55 rule stays with mouse and arrows, where releasing is
  unambiguous. Two more concessions to the phone: the camera walks the ship out from under the
  thumb (`helmCamOff`), and the drag draws a **ribbon** — its body is the wanted velocity, its
  fill is the actual one, its colour says accelerating or braking, and its foot is a capsule along
  the band, not the 93 px ring M360 was scolded for. Suites: `91zzzw-helm` (M422), `91zzx-mobile`.
  игре», then «чини все три, и сделай чтобы летопись не расходилась, как она ваще может
  расходится». `crash.log` held 116 lines over four days, no crashes, and a hundred lines of
  ordinary journal news: the `28-loop` hook posted every `warn` to the server. Replaced by
  `logShip` (`01a-crashlog`) at the eight places that mean a defect — storage, save, cloud,
  chronicle. Drone wear moved from lifetime `d.trips` to `d.wear` since the last repair: a day of
  catch-up is a thousand circles, and after a week the break chance sat at 11–15% with the fleet
  standing in the dock. And the chronicle diverged because `chronSave` never wrote its own lines,
  which `chronGrudge` (24 сводки) and the fx families (up to 40) read: cache-borne clients and
  first-time clients walked into different histories. Now the tail rides in the cache
  (`CHRON_LINE_KEEP`), the server counts hashes per version under a quorum with `flock`
  (`site/war.php`), and the open сводка's ledger is marked provisional so it is re-pulled once
  closed (`14b-war-net`). Suites: `91zzzzzz-crashlog`, `91zzzy-drones`, `91zzzw-chron`. 0.419.1
  finished it from the live page: the cache record became `v:2`, because a `v:1` record was
  computed without the lines and is another history, not an older one.
  war runs by itself**~~ (0.401.2) — closed; bodies in `docs/PLAN-archive.md` under their numbers.
  three-part note per chronicle record - detail, the real consequence with its number and span,
  and a closing line in the power's voice. Wired into the site feed (`war-map.js`, the headline
  is now a rubric) and into the cantina's ether block (`12pa-beacon`). Suite `91zzzw-news` pins
  the spans to `ECON_*`/`SOC_*`/`NAT_*`/`DIP_*`. Tail: the six waves still speak the old one-line
  ether - whether a wave should retell the whole note in its own voice is an author's call.
  craft law, closed. `src/18a1-glaze.js` bakes the landing cross-section **in grey** and lays one
  glaze per chunk - `dark + v·(light − dark)`, sky and star - so illumination reaches the whole
  section instead of the slope ribbon it had since M242. Two `fillRect`s and a `destination-in`,
  zero pixel readback. Nine hue events luminance cannot carry (veins, lava and ice seams, oxide,
  dispersion, lichen) ride a third pass after the glaze: **grey means «paint me», colour means «I
  know my own hue»**. The trade the author took on 09-07 («заливаем») is real and named in the
  almanac: within one world the palette's hue ramp collapses to one hue lit from two sides, so
  `tones` falls 5 → 4 at noon and 6 → 4 at night, while `mass` and `contrast` rise on every
  daylight frame and ice goes 5 → 13 on mass, 6 → 39 on pair. Sheet of five frames across three
  palettes: almanac issue VI. **The one frame worse than its numbers is the ice world:** it posts
  the best row in the sheet and stopped looking like ice - this star is `[255,122,82]`, at noon its
  term carries nearly the whole light stop, and every base hue arrives at the same clay. Left
  standing (the author settled this fork), recorded with the frame in issue VI; if it is ever
  reopened the lever is the illuminant, not the glaze - `starRGB()` is the disc, and the light that
  reaches the ground through an atmosphere is whiter than the disc. Found on the way and fixed: a
  flat shadow floor made the **night** a
  black void with one lit island (§16, expose for the shadows) - the floor now walks with the day,
  .28 at noon and 1 at midnight. Suite `91zzzw-glaze` holds the algebra, not the picture: the real
  `litRGB` must land between the two stops, or the glaze is lighting the section with a different
  sun than the strips. **Where the glaze stops, and why (corrected 2026-09-09 after a second
  look):** the cave and the mine are both baked in tiles already (`drawTiles`, 18c) — what they
  lack is not a cache but a *static illuminant*: underground there is no sky and no star, the
  light is the lamp and the moss, drawn live over the tile (`drawCaveOwnLight`, the M304 §16
  glazes). A per-tile glaze has no `light` stop to compute there, so P4 is complete where a sky
  exists. ~~The one open consumer from the P4 row is `07-planet`'s disc~~ — **M435 (0.422.0)**: the
  disc's day side is now lit in the star's colour and its limb glows in its own daylight sky
  (`sky[0]` lifted toward white); airless worlds have no limb glow at all, a gas giant is rimmed
  by its palette; the light bake is keyed by the star. The P4 row is closed end to end. Same
  release: `19-mode-landing` (50 KB) cut at its seam into `19-mode-landing-ground` (the three-pass
  section painters, crumbs, grass, boulders), and `07-planet` (40.6 KB after M435's own note) into
  `07a-terrain` (`RELIEF_MIX`, `LAND_ARC`, `genTerrain`, `groundAt`).
  built on the surface. `src/19c1-cast.js` marches a ray from every sample of the profile toward
  `celSun`; relief or a boulder above the ray means sky and no star - in the slope strips, the
  crust highlight, the движки, the boulder's body, and as a mask under the shadowed edge that fades
  with depth. Grey, in the form pass, so the P4 glaze makes the shadow the sky's colour (§16 by
  construction). Baked per chunk (the key already carried `sunAzQ`/`dayKq`), memoised on the
  terrain, the frame pays nothing; no map at night or at the zenith. Sheet at a forced low sun in
  almanac issue VII: `mass` +1…+3, `contrast` +.02…+.03, `pair` −3…−4 (a shadow is cold), and the
  right flanks of the ridges finally fall into the evening. Geometry pinned in `91zzzw-cast`. The
  row said «cave first» and «direction from `celSun`» - underground there is no sun, so the
  surface went first; interiors are lamps that move, a live mask and another milestone. ~~**Tail:**
  plants and deco are live and stay lit inside a cast shadow~~ - **M434 (0.421.1)**: the memo
  became a small map keyed by chunk, `castLive(tr,x)` reads it by world x, and the deco (through
  `dcol`), the plants (through `tone`) and the grass (a second, dimmer path) darken to `CAST_LIVE`
  inside the shadow; the contact ellipse under a deco fades with it, since nothing casts it. The
  walker keeps his own light on purpose - he carries a lamp and he is what the eye is for.
  логику, что на WASD, что на QE, мож стрелки нахер не нужны, посмотри как сделаны другие игры».
  Two keyboard schemes (mouse: nose to cursor always, WASD in screen axes; arrows: from the nose)
  switched by themselves on any mouse motion over the full-screen canvas, so W stopped meaning
  «forward» and A/D stopped steering the moment the mouse was touched. Now one layout from the
  nose (W throttle, S brake, A/D turn, Q/E strafe, Shift thrusters; arrows = the same keys), the
  mouse leads the nose only while the right button is held (A/D strafe meanwhile), the missile is
  G, and release = coast for every input - the .55 auto-brake is gone, the brake is one gesture
  at `HELM_STOP` for keys, pad and stick alike. The phone helm (M422) is untouched. `15a-helm`
  header, `docs/DESIGN-war.md` §1.2, the title table; suite `91zzzw-helm`.
  размывает, карта не увеличивается… перепридумай тесты, эти ничего не ловят». `+`/`−` were wired
  to `setZoom` (the flight camera) while the map has had `G.mapZoom` since M299: on the map they
  moved nothing and silently rescaled the system view behind the player's back. Now `zoomStep`
  takes the scale of whatever is on screen, and the box leaves the rail where there is no scale
  (`zoomModeHas`, shown by `hud`). The map was also the only screen ignoring the one ruler (M221):
  in a 1920 window the DOM grows ×1.42 and its own rulers, header, footer, badge and card stayed
  at 8-9 px - `mapU`/`mapFont` put the ruler into the type and the interface paddings, never into
  the grid coordinates (the grid is the world). Auto-resolution now returns: down after three
  heavy seconds as before, up after twenty seconds of a frame twice as light, at most twice a
  session, and the first three seconds of a scene are not judged (they bake the raster once).
  `15-input`, `27z-telemetry`, `28-loop`, `18-mode-map`, `18a-map-addr`, `18b-map-hold`;
  new suite `tests/91zzzzzzz-hands`.
  двигается вместе с этой полосой и слоем звёзд… выглядит не очень» and «полосу чуть притуши».
  The backdrop was nailed to the screen (band and rhumbs baked at 0,0; nebula and grit keyed to
  the SHIP), so a drag slid the sheet over a dead sky and the two read as one plane. Law: the sky
  stands in the world, the sheet slides in front of it - anchored to the ship, panned by a
  fraction of the sheet's travel that shrinks with distance (grit ~.4, nebula ~.14, band ~.05),
  saturating through `mapSkyShift` (tanh) because an infinitely distant sky cannot go anywhere.
  The band layer is drawn with an SKM margin so the shift never opens a rim; its alpha dropped to
  .62 - it is what addresses lie against, not a glow. The rhumb net went the other way: it belongs
  to the sheet, so its knot sits on YOUR system and travels 1:1 (`mapRhumbPaint(c,W,H,cx,cy)`),
  and that contrast is what makes the depth read. `18-mode-map`, `17z-map-backdrop`;
  guard in `tests/91zzzzk-mapaddr`. `site/war.html` untouched (its own .38).

## From PLAN.md (moved 2026-09-10): Loose ends (as of 2026-08-28, after the graphics run 0.237.0–0.244.0)

Struck entries' bodies as they stood in PLAN.md; the one-line heads stay there.

  every mode stays law; the cave is not an exception.
  desk's prices within three sectors; nearest otherwise.
  (`LOOK_DAYLIGHT`) print the pair as a reference, without a verdict.
  a back wall, bones, ropes, tallies, a camp, branch-end finds. ~~Left: the lower lake hall is still
  79% empty by the meter~~ — struck by the author 2026-09-05 («пещеру тоже нафиг»): the vault is
  the vault; no second floor, no lake.
  interior is drawn per frame — measure before baking~~ — measured in M319 (0.316.0): `?g11` says
  60 fps at dpr 2 with and without a bake, so nothing is baked; `prof()`'s 27 ms was the
  software-raster artifact (see CLAUDE.md). ~~Left: the settlement's houses and the wintering hut
  still draw their own and could take `homePlan`~~ — M322 (0.319.0), `housePlan` in 12tb.
  shuttles by rung. Still ~80% empty by the meter, and that is space; the next step is the fleet.
  corridor, M308 a warm horizon by day. Still 72% empty by the meter: sky is sky.
  line was stale, struck in M316.
  reeds wait for water on the surface (none exists yet; see the effects list).
  *family* was one; now blob / flat-based block / low slab, chosen by an already-drawn number.
  chromatic hits, the live flare (M325, 0.322.0). Left to judge by eye in play: the lake's
  walker wades through it (no physics for water — by design, the lake is shallow).
  detector over the sky third of night and landing frames at two window sizes finds nothing but
  the hint band and the chips; the one rectangle found was the `wallset` stand's own loupe. If it
  returns, shoot the frame and run the detector (`docs/shot.py --eval`, PATCHNOTES 0.317.0).
  at once: the prompt's hardcoded `right:128px` against a rail that is 129 wide on the map (now off
  the measured `--railw`), and `resetWorld` not leaving the road companion — after any click sweep
  the whole page was invisible and every later layout guard measured nothing.

## M441 — determinism in the game (0.428.0, 10.09.2026)

The brief: `rnd()`/`now()` in `01-core`, the 114 `Math.random` and 245 `Date.now` migrated by script,
a static law against raw calls, the same-hash test (two runs, one seed, equal `G` hash every hundred
frames over `lookScenes`); kill the by-the-hour reds («план: комбинат», the M391 air suite of 0.427.1)
at the root. Why first: replays, golden frames, seed distributions and the cloud save all stand on it,
and hiding the overrides in the harness would have made the tests repeatable and left the game on sand
(`docs/DESIGN-tests.md` §3.5).

What was done: two streams, not one — `rnd()` for everything that lands in `G`, `rndFx()` for picture,
sound and speech, so drawing or skipping a frame cannot shift the world (a Chrome suite checks the `rnd()`
position after a drawn and an undrawn frame). Migration counts: `Math.random` 35 state / 77 picture / 1 uid;
`Date.now` 217 game / 14 real; `performance.now` 13 game (input, helm, bubbles, globus) / 15 real; `new Date()`
9 game. On a pinned clock `frameBody` advances the clock by exactly 16.667 ms per frame and skips the fps
cap and auto-resolution; `LOOP_PHASE` holds the modules' own every-N-frames counters, reset by `clockSet`.
`stateHash()` covers plain data reachable from `G` (exact number bits, sorted keys, Map/Set, typed arrays,
cycles), plus the `rnd()` position and the clock; it skips functions, canvas/DOM/class instances, `_` keys,
the map backdrop and `G.prompt`; `stateHashParts()` hashes per top-level key. The law lives in `build.ps1`
because every tier, the deploy and the lab pass through the build; a violation deletes the old `tests.html`
so no tier can go green on yesterday's build. The M391 suites now call `bCalm` (the clock moved to a stretch
where the base director's own forecast is calm) instead of `bNoDir`; red at 03:00 and 13:00 without it.

## M442 — the test API and the harness rules (0.430.0, 11.09.2026)

The brief: `tests/90a-tools.js` (actuators and observers) extracted, not rewritten, from `hands`, `promise`,
`look`, `fuzz`, `keys`; `docs/stand.py` over CDP; a zero-assertion suite is red; `ok(true` and `typeof`-guards
in tests to zero by a net over the test sources; `suite(name, fn, {tier, win, stage})` replacing the three
lists; `?shuffle=seed`; `stage` as quarantine.

How it went: written by an Opus session in parallel with M441 and M443 (same base, 0.427.2). Its last full
run hung in one shard for 33 minutes (the GPU process at ~115% CPU) and the session was stopped; the work
was taken over at the merge — WIP (the per-suite tier options) committed, then merged over 0.429.0. The
twelve conflicts were all M442's structure against M441's clock: the tools' clock (`clockShift`, `advance`)
still patched `Date.now` and was moved onto `clockSet`; `T.go(scene, seed)` now calls `rndSeed`; `T.state()`
returns `stateHash()`. M443's driver called the removed `hDom`/`hCalm` (now `T.dom`/`T.calm`) and relied on
the old name-based Node skip (now `{tier:"browser"}`); the net found 16 guards in M443's files — the end-of-
tools marker moved behind the detectors (`90c`), which are tools by §3.2 and may test the environment, and
the thirteen guards around functions that must exist were removed. On the merged tree the hang did not
reproduce: `-Full -Jobs 2` green in 128 s, and shuffled (`-Shuffle 7`) as well. Suspect, unproven: a suite
on the pre-M441 tree waiting on a real-clock condition under `--virtual-time-budget`.

## Moved from PLAN.md on 2026-09-11 — the «Сорока» queue (closed 2026-09-05)

## «Сорока» — the wanderer queue (M340–M346 done — closed 2026-09-05; author 2026-09-04: «делай всё в соло»)

Design is settled in `docs/DESIGN-wanderer.md` (§1–§13; §6 and §12–§13 are the revised, binding
parts — §11's prices are indicative). Read that file first, then this queue. Every milestone below is
one commit: bump `VER`, one PATCHNOTES entry, tests green (`test.ps1`), then push. Work order is
fixed; each step is playable on its own. Decisions the author already took (do not re-ask): the ship
is one wandering sail-ship named «Сорока»; the currency is **spички** (matches), never credits for
rare raw; barter exists only as one wild-card lot per stop with a categorical ask, never a recipe;
cosmetics exist; the desk gets one table «ОПИСЬ»; a locker exists at stations.

- **M340** (0.337.0) — done: `12uc-matches` — `G.matches`, `matchesInPart` by tier (3→1, 4→3,
  5→5 or a box of 8 by part seed), `scrapPart` returns `matches`, hold header shows «спичек: N»,
  save round-trip, suite `91zzzze-matches`.

- **M341** (0.340.0) — done: the table «ОПИСЬ» (`27j-ui-opis`) — one cloth, four zones, drag or tap,
  ПРИБОРЫ panels that show the future, the hatch, matches in the corner; the ship screen and the desk paper
  НАКЛАДНАЯ are gone; prices live under the piles, on the map card and in the map's ЦЕНЫ list.
  Body in `docs/PLAN-archive.md`.

- **M342** (0.341.0) — done: «Сорока» in the world (`12v-wander`) — a 24-stop loop from the clock, the
  sail-ship parked at the lit limb, the approach, the rumour, the sky-watch line, the chart's sail glyph
  (`relicOn("chart")` finally read); the room is M343. Body in `docs/PLAN-archive.md`.

- **M343** (0.342.0) — done: the room and the shop — mode `wanderer` (`24c-mode-wanderer`, `-draw`,
  `26d-ui-wanderer`), the catalogue `WANDER_CAT` (`12v-wander-shop`: 14 tools with hooks, two papers,
  the wild card), counter B for raw and rarities, the cabin shelf on ОПИСЬ, the keeper's lines, «сорока»
  in `lookScenes`. Left out on purpose (no hook yet): cosmetics (M344), unique hull parts, Медный шар,
  Слепок печати, Вторая рука, Страница журнала, Список отказов. Body in `docs/PLAN-archive.md`.

- **M344** (0.343.0) — done: cosmetics — `12v-wander-shop-cosm`: 27 things in seven slots (8 exhausts with
  their own flames, 4 jump trails, 4 suit finishes, 3 visor tints, 3 hull marks, 3 light patterns, 2 docking
  chimes), each read by its painter and guarded by a pixel test; the casket on ОПИСЬ opens with the first
  purchase, wear by button or by dragging onto the hull/kit. Parrot accessories and the house crest wait for
  their systems. Body in `docs/PLAN-archive.md`.

- **M345** (0.344.0) — done: the locker (`12ak-locker`) — zone 5 ЯЩИК on ОПИСЬ while docked at rung ≥ 6,
  24 places (48 with «Второй ящик»), parts, piles and «Сорока» tools; 1 %/day of value taken lazily from the
  real clock, no debt; 30 days unvisited → parts resurface on any flea as «залог, за которым не пришли».
  Body in `docs/PLAN-archive.md`.

- **M346** (0.345.0) — done: matchboxes (`12ue-boxes`) — twenty hand-written labels, found in wrecks and
  containers, on the flea (a lot) and aboard «Сорока» (one match); the shelf at home says «коробков: N из 20»
  beside the books; no effect; the keeper mentions the full box of fifty and never sells it.
  **The «Сорока» queue M340–M346 is closed.** Body in `docs/PLAN-archive.md`.

- **M347** (0.346.0) — done: the map speaks in addresses (`18a-map-addr`) — the sector grid under the
  darkness law, rulers on top and left with your and the selected coordinates underlined, the header «ВЫ ·
  сектор x:y · «Имя»» / «сектор x:y · N секторов · J прыжков · d пк», empty cells selectable (no course into
  emptiness), rumour areas as hatched squares from `G.rumours`, rings «2/3 прыжка», the address field with
  the match button, every «сектор x:y» in game text tappable (`addrify`), the rose, and the wordless mark —
  a match from the wallet (`G.mapMarks`, ≤10). Body in `docs/PLAN-archive.md`.

- **M348** (0.347.0) — done: holdings on the map (`18b-map-hold`) — house patches (station ∪ 1-jump, two-colour
  hatch where houses overlap, darkness law, seen/heard beyond the edge), ГЛАВТРАССА as a double line with
  milestone ticks, a band under it and the name once along the longest leg, rusty hatch over occupied sectors
  with a brighter front at house patches, own frames, «сменился хозяин» tags fading over three days, a СЛОИ
  button (ВСЕ/ВЛАДЕНИЯ/ЦЕНЫ/СЛУХИ) in the map strip; pirates no longer hold or take sectors under the трасса.
  Body in `docs/PLAN-archive.md`.

- **M349 + M349a** (0.348.0) — done: «Маяк ГЛАВТРАССЫ» (`12pa-beacon`) — one bulletin per shift built only
  from causes (appetite tonnage, the player's over-norm sales, freed and «особый режим» sectors, scrip moves,
  holidays with a double fleet norm), poster head + dry lines, in ЭФИР, on the cantina wall and by the
  receiver's voice: browser `speechSynthesis`, ru-RU, quiet (.35), system voices per role chosen by name,
  crackle before and a two-tone after, ducked under combat, silent on desks and stations, settings in ЗВУК.
  Body in `docs/PLAN-archive.md`.

- **M350** (0.338.0) — done: the drone-miner (bottomless point, 9 000 cr by payback, one per yard/indust
  station per two days, ВЕРНУТЬ, sells within two sectors, guest drawn in the market system). The
  audit's trade «hole» was an artefact of open buying: in the game one buys only on a route leg
  (`12r`, M289), and a 3-pair route pays ~17 000 cr in three laps then waits for pressure to decay —
  the designed ~200 cr/min. Trade untouched. **Answered by M351:** counter buying opens with the cooperative, capped by rank, priced in slices.
  «Сорока» raw→matches re-priced to 40:1 with a 200-unit cap per stop before M343 (audit §3 H3).

- **M351** (0.349.0) — done: the cooperative (`12aj-coop`, `docs/DESIGN-coop.md`) — the exam by turnover
  (12 000), the stamp at a house station for 1 500 with a player-typed name, ranks I/II/III by turnover since
  registration and granted asks, the counter open to cooperatives only (sliced pricing per 10 units, caps
  60/150/none per visit), hiring only for cooperatives with `crewCap` by rank, the ДЕЛА page (members,
  per-shift ledger from `earn`, asks from composition pointing at family-G buildings, spirit 0…5 as words,
  ±1 % per point). Re-measured 2026-09-05 (`docs/ECONOMY-AUDIT.md` §6): the cap binds only when the hold
  exceeds it (Вьюк at rank I: 1 900 vs 2 400 cr/min on the opening laps); pressure, not the cap, is the brake
  from lap four on every rank. Body in `docs/PLAN-archive.md`.

- **M352 — one big thing per biome** (0.350.0, 2026-09-05) — done: `21b-surface-deco-biomes`, eighteen
  new large-form painters registered through `DECO_FN`/`DECO_KINDS`, every land biome owns a family of
  2–3 shapes at 5–12 astronaut heights, density raised to 2–4 per screen (cluster per ~1000 units plus a
  top-up to the norm on rough worlds), neighbours kept apart by height, the pad zone kept clear; the
  desk-side chips no longer overlap near-marks (`21e-surface-draw`). Judged by frames per biome. Not done,
  by decision: the jungle crown stays one painter (twin variant added), no second trunk build in
  `20-life`. Body in `docs/PLAN-archive.md`.

- **M358 — what the frame bakes** (0.356.0, 2026-09-05) — done: `tests/91zzzzy-bake`, the fourth
  suspect in the freeze hunt and the first one nobody had measured — the raster of the **live frame**
  (chunks, tiles, screen layers), which hangs on `G` and so was never seen by the `SYS_CACHE` suite.
  Two guards: the oven must not run every frame (a key catching the hour or the camera would bake a
  full-screen canvas per frame, invisible to memory and console alike — standing still the game bakes
  7 in 150 frames), and the level is pinned in **screenfuls** rather than megabytes (measured 26.7,
  ~85 MB at DPR 1; each store holds about twice what the frame draws, which is the camera's margin
  and is meant to be there). Nothing grows without bound: **the freeze is not in the raster.** What
  is left for someone: that margin costs as the square of `DPR*SCK`, so trading it against re-baking
  is a real decision, and an author's one.

- **M356 — the sky in storeys** (0.353.0, 2026-09-05) — done: from the author's photograph of a
  real sky («вот тебе облака, для планет, делай»). The frame there holds three cloud populations at
  once and the game had one: `19e-clouds` gains the **deck** (`deckSprite` — the layer overhead, drawn
  edge-on with a torn lower edge and no silhouette; per-world `cover`, raised by weather so rain no
  longer falls out of clear blue, baked lazily); one condensation line per tier instead of scattered
  heights; a rebuilt cumulus body (base row stepped by its own radii so metaballs merge, turrets over
  the middle, 288×168 bake, a cut edge); volume by self-shadowing along the direction of the star
  instead of the outline gradient; and the horizon chain. Three separate ways the sky outshone its
  own star (rim above the ceiling, shadow lighter than light, body at full light over large areas)
  were found by `91zzzzy-light` and closed by the same law — see PATCHNOTES 0.353.0. `test.ps1` also
  learned to wait for Chrome to release its output file.

- **M353** (0.339.0) — done: «Смена» on the desk (`12ud-smena`, text table generated by
  `docs/mksmena.py` from `docs/SMENA.md`), 72 predicates from SAGA-BOOK's hooks, nine new scenes for
  the post-0.163 mechanics. **Next (author 2026-09-04): the prose itself — «интересная, как игра, а
  не заметки».** The book is to be re-read as a critic and rewritten chapter by chapter in one
  livelier register (scene, want, obstacle, turn; dialogue over summary; the journal line as a refrain,
  not a crutch), starting with a sample chapter for the author to judge before the rest.
  The text stays in markdown; every rewrite runs `mksmena.py` and the suite.
