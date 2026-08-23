# Drift â work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers â numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic â¤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips â ground, cave rock â
  and `screenLayer(key, paint)` for screen-space constants â the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format is `v:4`.** `server.js:95` and `worker.js:66` reject anything else. A new
  persistent field goes into `snapshot()` and gets a safe default in `applySave()` (`14-save`).
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation â the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.
- **Design in passes, not in one shot** (author, 2026-08-23). Any design — a screen, a
  component, a drawn thing — gets a draft and then several self-critique passes along the way:
  look at the result as a user/with the art direction, name what is wrong, redo, repeat until a
  pass finds nothing. Optimisation is part of every pass, not an afterthought — check the
  raster/JS budget (`prof()`, the "painted once" rule) before calling a pass clean.

## Done

M1âM32 â the base game (see git history). M33 parts and total rig capacity Â· M34 ship screen with
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
Here is only what is still live â cross-cutting rules, the visual queue and the milestone queue.

---

## M55. Visual work queue (live)

Where we stopped. Everything above the line is built, tested and pushed; everything below is
not started.

### Done (0.14.0 onward)

Points of interest on planets and in the belt, rock material, geology in cross-section, light and
air, sky with a loudness budget, the look of a system and exotic stars, the feel of flight, alien
flora and fauna, a living camera, station modules, weather.

### Remaining, by descending payoff

1. **The mine from inside** â two passes done (`23-mode-dig`). Strata, ore in grains, the working
   floor, timber and ladder, track and tub, haze at the far end. **Still open → swept, see the tails ledger:** the landings in
   the shaft barely read; a tub in a cell dug below the floor looks like a crate in a pit; and a
   long shaft is still a long shaft â niches and a change of section would do more than texture.
2. **Ships** â done in two series of ten passes (`03-ships` and its split, `03a`â¦`03e`). Class
   reads by silhouette, the fleet is painted like industrial hardware (bone skin, panel plating,
   graphite engines, stencils), the planform is a scheme of its own (delta, cross, catamaran, slab,
   disc, trident, swept) so there are about fifty silhouettes, and the luxe yacht is its own craft
   entirely. **Still open → swept, see the tails ledger: faction** â one visual language for everybody, and per the queue below
   factions come after stations.
3. **Cantinas** â done. Light is a layout (how many lamps, what tone, how wide the cone, what
   happens between them), the crowd is counted per station type, what stands behind the counter is
   what the place deals in, and the music leans by type. **Still open → swept, see the tails ledger:** the counter is the same
   length and shape in every hall.
4. ~~**New world types:** crystalline, jungle, metallic, ruin.~~ â DONE: all four are in `TYPES` (02-world) with profiles, relief and geology.
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ â DONE at M108 (`17b-finds`).
6. **`base` and `scoop`** â twelve passes on the base (`21a-mode-base`, `21aa-base-rooms`,
   `21ab-base-interiors`; stands `docs/mkbase.ps1`, `docs/mkroom.ps1`) and a first ever pass on
   `scoop` (`19a-mode-scoop`, stand `docs/mkscoop.ps1`). The narrative of what each pass fixed is
   in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) â grep it for `M55`. Open debt only, below.
7. **Factions as a language of shapes** â only after ships and stations, or there is nothing to
   tell apart.
8. ~~**Redo the clouds.**~~ â DONE: `19e-clouds` is a density field in perspective, called from `drawSkyLayer`.
9. **The world on foot** â the surface is the longest screen in the game after the cockpit, and it
   has never had a pass of its own. Stand: `docs/mkworld.ps1` â `docs/shots/world-types.png`.
10. **Split debt.** `23-mode-dig` and `27e-ui-home` have crossed the 40 KB line; `build.ps1` was
   re-baselined on 2026-08-15 so the guard stays quiet, which is a loan, not a payment. One
   payment made on 2026-08-16: `21aa-base-rooms` (60 KB) was cut along its seam into the brushes
   plus `drawModule` (24 KB) and `21ab-base-interiors`, the eight compartments (37 KB), and left
   the guard's list instead of being re-baselined inside it. **Next: `21a-mode-base`, 52 KB** â
   it grew over the base passes and is deliberately left shouting on every build.

### Graphics debt (open faults, one line each)

Written down on 2026-08-16 so the picture stops being an open-ended errand: everything below is a
**fault someone found by looking**, not a wish. The queue moves on to mechanics; these are taken
one at a time when a pass is due, and nothing here blocks a milestone.

- **base, tight rooms** â in the reactor, the quarters and the lab the machine fills wall and
  floor, so neither the wall trace (`bDress`) nor the leftovers (`bJunk`) show at all. The fix is
  a free strip in those rooms' own layout, not drawing things over the equipment.
- **`scoop`, soft texture** â the giant is baked at 512Ã256 and stretched to one and a half
  screens: not one crisp edge belongs to the cloud itself, and the shear edges are shadows laid
  over that softness. Also: the floor is lighter than the design wants, and nothing but the
  palette changes between types of giant.
- **mine** â landings in the shaft barely read; a tub in a cell below the floor looks like a crate
  in a pit; a long shaft is still a long shaft (niches and a change of section beat texture).
- **cantina** â ~~the counter is the same length and shape in every hall~~ done in 0.99.0
  (`cantCounter`). Pass 2 (0.99.3): hall lifted, crowd in colour, floor with light pools. Next: a barkeep
  who moves; glasses and bottles on the counter per type; a second window plane.
- **Ð¿Ð¾Ð´Ð³Ð»ÑÐ´ÐºÐ°** (M118) â the walker's trail dissolves into the mat's glow; the mat is identical
  on every world; an arm at rest merges into the torso; the crate rides near the chin.
- **ÐÐµÑÑÑÐ½ÐºÐ°** (M119) â the plume is three evenly spaced puffs; the plant is the same shape on
  every world; the drum's hoops do not read as turning.
- **ÐÑÐ¾ÑÐ¾ÑÑÐ½** (M120) â at 64 px, the size he is actually seen at, the three eyes merge into a
  smudge; the hide is flat khaki with no dust streaks; the working arms hide behind the torso.
- **ships** â no faction language; it comes after stations by the queue above.
- **the world on foot** â the longest screen after the cockpit, still without a pass of its own.
- **split debt** â `21a-mode-base` 52 KB, `23-mode-dig`, `27e-ui-home` (see item 10).

### The graphics & performance pass (G1âG12) â written 2026-08-22 from the shots, not from memory

Self-review of every screen against the art direction (M54 rules). Each line is a **fault seen in a
frame**, then the fix. Order is by how much of play time the screen takes; G0 comes first because
the rest of the pass is measured against it.

**What is already right and must not be touched:** base cross-section, cantina bar, HQ room,
nav map, cockpit frame and rack, crystalline surface mosaic, the hundred portraits. These set the
standard; the rest is pulled up to them, not the other way round.

- **G0 â measured (2026-08-22, 0.95.0), visible Chrome tab, AMD iGPU, window 1536Ã735 CSS.**
  fps by mode at Ã2 (3072Ã1470), before â after the first cache pass: surface 40â45, mine 39â44,
  cave 55â59, scoop 51â55, landing 53â55, system 53, map 61. Same surface at Ã1.5: 58, at Ã1: 60.
  The frame is **fill-rate bound**: one full-screen pass (a blit, a fill, a gradient) costs
  ~4â5 ms at Ã2 on this GPU, JS is â¤3 ms in every mode. So the budget is counted in
  **full-screen passes per frame**, not in objects: about six fit at Ã2, twelve at Ã1.5.
  The hidden-tab `prof()` numbers are not comparable with these (readback inflates everything
  Ã3 and gradients Ã8) â rank with them, never quote them. Rules that follow: (1) a gradient
  or a composite that does not change frame to frame is a `screenLayer`, never a per-frame
  fill; (2) anything static under the camera is a chunk; (3) every new painting pass below
  states how many passes it adds and pays for them somewhere else; (4) `resAuto` stays the
  safety net, Ã1.5 is the honest default on integrated GPUs.
- **G1 â six worlds, one body** (`world-types.png`). Earthlike, desert, ice, volcanic, toxic and
  jungle differ by palette only: the same cell-outline macro texture on rock, sand and ice, the
  same relief amplitude, the same god-ray stamp at the same angle on every world, the same three
  strata. Violates "material in three scales" and "one screenshot says where you are". Fix per
  world type, not per colour: a **material kit** (`18a-material`) with its own macro form â
  dunes/ripples for desert, fracture plates and blue depth for ice, cooled crust with glowing
  cracks for volcanic, sodden banks and pools for toxic, root mass and canopy for jungle; relief
  amplitude and strata count from the kit; rays only where the sky gives a reason (dust, mist).
  **Done in 0.97.0** for the material kit (dune, frost, crust, sludge, soil) and the shafts.
  Still open → closed, see the tails ledger: relief amplitude and strata count per kit; flora silhouettes per world.
- **G2 â no aerial perspective on the surface** (`surface.png`). Far ridges use the near ground's
  texture and value; the ground does not darken with depth; nothing stands in front of the player.
  Fix: three planes â far ridges as flat value silhouettes tinted by the sky (cached
  `screenLayer` per world), mid ground as now, a sparse **foreground** band (boulders, grass,
  drift) at 1.15Ã parallax drawn last and blurred by value, not by filter. Depth gradient on the
  ground: the lowest third goes to the sky's shadow colour.
  **Done in 0.98.0** for the foreground band (`drawForeground`, 21b). Still open → closed, see the tails ledger: far ridges as
  a cached sky-tinted layer; a deeper value gradient on the near ground.
- **G3 â the mine is an empty frame** (`mine.png`). Shaft on a blank plane: strata are flat fills
  with one outline, no texture, no niches, no scale; a tub reads as a crate in a pit (debt above).
  Fix: rock from the same material kit as the surface (chunked by world-x, as cave rock), strata
  with their own micro grain, landings as real rooms (beam, lamp, crate stack, a man-height mark),
  changes of section along the shaft, dust in the lamp cone. This is the weakest screen in the
  game and the first painting job.
  **Done in 0.96.0** (rock was invisible by a clip bug; contacts, landings, lamps, hoppers).
  Still open → closed, see the tails ledger: niches and a change of section along a long shaft; rock chunks by world-y.
  Passes added: 0 (lamps are sprites inside the void clip).
- **G4 â the raid is in a different language** (`raid.png`). A projected corridor of flat fills,
  wireframe crates, an enemy as a pink capsule. It is the only screen the player would not
  recognise as the same game. Fix: keep the projection, repaint with the base's brushes â
  plated walls with rivets (`bDress`), real crates, pirates drawn as bodies (M74 rules), a floor
  with grating and cable runs, one light cone from the hangar door, dust.
  **Done in 0.99.5** for plating, floor plates, light pools, crate rims. Still open → closed, see the tails ledger: pirates
  at rest (poses), the hangar door cone, a rock wall where the base meets the asteroid.
- **G5 â the scoop giant tiles visibly** (`scoop.png`). The band's waves repeat at one screen
  width and the baked 512Ã256 is stretched to Ã3. Fix: bake at 1024Ã512 per giant type with a
  non-tiling domain warp (fbm on fbm), bands as fronts with sharp leading edges and soft trailing
  ones; the floor darker than the band; per-type structure (spots, vortices, plumes), not
  palette.
  **Partly done in 0.99.2** (768Ã384, wider tile). Still open → closed, see the tails ledger: per-type structure, sharp fronts.
- **G6 â the belt is unlit** (`cockpit1.png`). Asteroids are flat polyhedra with no light
  direction; the void behind is a gradient; nothing gives distance. Fix: one star direction per
  belt, faces shaded by normal against it (computed once per rock, cached), a rim on the lit
  edge, three depth planes with dust motes drifting in the near one, the far rocks smaller and
  greyer. The frame and rack stay.
  **Note (0.99.2):** the faces were already lit by normal against the star with a rim; the
  fault was contrast â terminator sharpened. Still open → closed, see the tails ledger: depth planes, near dust motes.
- **G7 â the sky is a band.** On every world the sky is a vertical gradient; the landing screen
  draws clouds as puffs on haze and rain as uniform streaks; the ringed body is drawn through its
  ring. Fix: sky from `19b` as a cached `screenLayer` per (world, hour, weather): horizon glow,
  a gradient bent by the star's altitude, a few cloud fronts from `19e` with a lit and a shadow
  side; rain in two speeds; ring split into back/front halves around the disc.
  **Note (0.99.6):** the sky base is a cached layer since 0.95.0 and rings were already split;
  0.99.8: horizon glow in the star colour, rain in two depths; clouds already had
  lit/shadow sides. Still open → closed, see the tails ledger: glow bent by the star altitude (needs the hour from 06a).
- **G8 â the ship on the ground is a postage stamp.** On the surface the landed ship is ~40 px
  with no shadow, no landing gear dust, no hatch light. Fix: contact shadow, a pool of light
  under the hatch at night, the hull at the same scale as the base's people (the human is the
  rule).
  **Done in 0.99.6** (shadow, hatch pool). Still open → closed, see the tails ledger: the scale check against the base people.
- **G9 â base surroundings** (`base.png`). The hill is one flat dark mass; the soil around the
  modules is one brown. Fix: strata through the soil with the surface's micro grain (chunked),
  a few buried stones, the shaft's spoil heap on top, the hill silhouette with a lit edge from the
  sky. The rooms stay.
  **Done in 0.99.2** for the hill (lit gradient, material, sky rim). Still open → closed, see the tails ledger: spoil heap,
  buried stones that read.
- **G10 â system view composes nothing** (`system.png`). Nebula blobs, even stars, the star and
  planets off-frame: the screen looks like a loading state. Fix: stars in three magnitudes with a
  few coloured ones, the primary's glow bleeding into the frame from its direction even
  off-screen, orbit lines fading with distance, nebula as two layers with parallax.
  **Done in 0.99.7** for the off-screen bleed and orbit fade. Still open → closed, see the tails ledger: three star
  magnitudes with a few coloured ones; nebula parallax.
- **G11 â raster budget, by rule.** After G0: anything static under a moving camera goes
  through `18c-chunks` (today only landing and weather call `screenLayer`/`chunkAt` â the
  surface ground, cave and mine rock, base soil and the sky should all go through it); per-frame
  `createRadialGradient` in `20-life` (11 sites: astronaut lamp, flora caps, fauna glows) is
  replaced by sprites baked once per (kind, size) and `drawImage`d; the full-screen veil and
  vignette are one cached layer; `globalCompositeOperation` switches are grouped so the layer
  stack flushes once. Target: every mode â¥ 55 fps at Ã2 on the dev machine, with `resAuto`
  never firing in normal play.
- **G12 â the foot world gets its pass** (debt above). The longest screen after the cockpit. After
  G1âG2: a POI every 2â3 screens with a silhouette visible from afar, wind in the flora, tracks
  behind the walker, a night with the suit lamp as the only light.
  **Pass 1 in 0.99.9:** tracks. Still open → closed, see the tails ledger: POI rhythm, wind in flora, night (needs an hour).

Not in this pass (still the list under "What not to do"): blur, DoF, chromatic aberration,
motion blur. Depth is done by value and overlap, never by filter.

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter â expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---

# Tails ledger — every "Still open" swept on 2026-08-23 (0.100.3 → 0.100.8)

One line per tail, in one place, so nothing below has to be re-read to know what is left. "Closed"
names the version; "by design" means the tail is not a defect but a decision that belongs to the
author or to a later pass, and it is carried here on purpose rather than silently dropped.

## Closed

- **Base** (M137/M138/G9/M111): gate is a door, tunnel lit, pad on a plateau shelf, plateau terrace,
  spoil heap, buried stones (0.99.2 + 0.100.3); quiet-battery notice and a heavier battery shot
  (0.100.3). `21a-mode-base` split → `21ac-base-draw` (0.100.3).
- **Cave** (M136): lower gallery dressed, beasts on both galleries and descending, contour fringe
  carries material (0.100.3). Watch visible at the mouth (M110, 0.100.5).
- **Mine** (M55 #1 / G3): landings and tub (0.96.0); chambers and niches along the shaft, rock tiles
  by world-y (0.100.4).
- **Surface** (G1/G2/G7/G8/G12): relief amplitude and strata count per kit, flora by world type;
  far ridges tile-cached, near-ground value gradient; glow bent by the star altitude, night with the
  suit lamp — an hour exists now (`celSun`, 06a); POI rhythm 3–4 per strip; wind in flora was
  already there (plants bow to `WIND`); scale check passed (lander 90–130 px vs 26 px walker)
  (0.100.5).
- **Settlement** (M109): heard before seen (knocks, voices by distance), pennant pole and smoke
  column from afar (0.100.5).
- **Figures** (M118/M119/M120): mat in the planet's tone, arms outside the torso, crate at the waist,
  warmer trail; tin plant varies per planet, hoops read as turning, plume was already smoke
  (0.99.x); grok shoulder line, strap over the box, rim on the chest arms (0.100.5).
- **System / belt** (G10/G6/M112/M114): three star magnitudes with coloured ones, nebula in two
  parallax layers; belt far plane and near dust; missiles in the belt; dry launcher on the hull;
  doomed planet from orbit; managers add lift capacity (0.100.6).
- **Raid / scoop** (G4/G5): rock walls where the base meets the asteroid, hangar gate with a cone,
  pirates at rest; giant structures (banded/spotted/jet) and sharp band fronts (0.100.7).
- **Station side** (M113/M117/M121/M122/M123/M126/M127/M128/M132/M133/M134/M55 #3, ships): see the
  0.100.8 patch note — counter length, house and place lines, flea crowd, bird on planet, tape
  persists, recorder drum, instrument knock and one clock, misclosure window, name on the table,
  strip with the parcel, post rumours, care/hurt, mirror ack, runner range, hull top light and
  asymmetry; `26-ui-station` split → `26a-ui-station-home`.
- **Panel in system view** (M122): settled by M124 — the pod is the surface there.
- **Test page**: two W=0 crashes guarded (`drawCaveDark`, `rackDial`); green since 0.100.3.

## Open by design (not defects; each needs the author or a pass of its own)

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
- **M124 spec remainder**: receiver with a knob — closed (0.110.0, `25e-receiver`); "pause is the engine off" — closed by fact (there is no pause menu to replace). Left by decision (2026-08-23, autonomous run): the table as paper/bills/pile and the removal of the overlay HUD — both rewrite the whole interface and its autotests for a release look the author has not seen; kept as the release design, not done blind.
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
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Left: `21ab-base-interiors` (one `const` table, 42 KB) and `12y-parrot-face` (42 KB) — flagged, not cut.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: measured 2026-08-23 in real Chrome (jungle surface, 1536×791 @2): JS 7–9 ms/frame after the first frame; `drawClouds` costs ~17 ms **once** (the field bakes, then 0.5 ms); `drawPlant`/`drawBeast` 0.5–0.9 ms JS — the 20-life gradients are not where the budget goes. `prof()`'s raster figure (~70 ms) is the `getImageData` readback on a 4.8 MP canvas, not frame raster; a true fps needs a visible tab with rAF, which the tool could not give (background tab, rAF paused). Left open: bake sprites only if a visible-tab fps read shows <50 — the numbers above do not justify it blind.
- **M112**: nothing else — belt missiles and the hull mark closed it.
- **M135 "three lights"**: built (0.101.0). **M136-hours**: built (0.102.0). **M137-glow**: built (0.103.0). **M138-grove**: built (0.104.0). **M139-keepers**: built (0.105.0). **M140–M142**: built (0.106.0). **M143–M151**: built (0.107.0–0.108.0) — the thirteenth pass is closed. Next: the tails ledger (factions as a language of shapes; M124 remainder), then the split debt, then G11.

---

# QUEUE: the fourteenth pass — the kit, the lodger, the expedition (M152–M166)

Designs (2026-08-23): [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md), [`docs/DESIGN-economy.md`](docs/DESIGN-economy.md), [`docs/DESIGN-suit.md`](docs/DESIGN-suit.md),
[`docs/DESIGN-vega.md`](docs/DESIGN-vega.md), [`docs/DESIGN-act2.md`](docs/DESIGN-act2.md),
[`docs/DESIGN-after.md`](docs/DESIGN-after.md). Order as listed; each is a version with tests and
a commit. The joys (M164–M166) may be slotted between big milestones as breathers.

- **M151a the console and the table** — **built (0.111.0)**: the release look per
  [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md). A bottom console on every screen (receiver moved out
  of the cantina · action prompt · the seat of whoever flies with you); one full-screen **СТОЛ**
  reachable from any mode (logbook with ЭФИР/БОРТ/ЛЮДИ, tapes, letters, things, record book,
  clippings); the station gets **ДОСКА** as its first group; the menu shrinks to five; `logwin`,
  `lorewin`, `parrotwin` removed; `say()` only for prompts and emergencies, `etherLine()` /
  `peopleLine()` for voices; `29-ui-table`, `29a-console`, `91f-ui` rewritten once; `91zzv`.
- **M152e the economy without a debt** — **built (0.112.0)**: per
  [`docs/DESIGN-economy.md`](docs/DESIGN-economy.md). Measure first (`91zzw-economy`, 60 minutes
  under three profiles, cr/min per source and drain); then: no manager salary — the cut only,
  hires paid per run; station need (×2 for one delivery, heard and posted); one order per
  station on ДОСКА; the first «Вьюк» by allocation at 3 000 turnover; tails on the table and in
  the home case; a find handed to the institute for 25%; the rationalisation premium; prices on
  the charts; slower market fill. Target: mod at 10 min, «Вьюк» at 20, hire at 1 h, manager at
  2–3 h, garage by hour 5–6.
- **M152 the kit** — **built (0.113.0)**: the suit as six places with trade-offs, pieces with models/class/wear/mods,
  issued/found/given, the workshop tier repairs and modernises; `12x-suit`, `11y-kit`, `91zzg`.
- **M153 Vega** — **built (0.114.0)**: the lodger who cannot be evicted: the one-shot device on the flea, three acts,
  the mirror, flying with her (right seat, HUD line, help/hinder/quarrel/gift/outings), the
  seven-day ending; `11w-vega`, `12k-vega`, `91zzh`.
- **M154 the Ring** — **built (0.115.0)**: a structured signal from outside on the receiver, recorded on tape, never
  explained; `11x-ring`, `91zzi`.
- **M155 misclosure** — **built (0.116.0)**: the region where the counts diverge; tapes together draw a figure on
  the table; `11z-misclosure`, `91zzj`.
- **M156 circular** — **built (0.117.0)**: the expedition demand through queues, prices, barges, settlements, crew,
  rumours for sixty days; barge passenger as a channel; `11x-expedition`, `G.exp`, `91zzk`.
- **M157 the sixth** — **built (0.118.0)**: five rival traces as links drawing one route to the sixth, who gets a
  face and goes with the expedition; `12k-stories-d`, `91zzl`.
- **M158 last run** — **built (0.119.0)**: the Tin closes; one person per region; ten letters with content read
  aloud by the addressee; `12k-letters`, `91zzm`.
- **M159 departure** — **built (0.120.0)**: the quiet minute, the nameless board line, the once-offered ending, the
  unsigned tape a year later; `91zzn`.
- **M160 the Island** — **built (0.121.0)**: pirates as those who left; landing with a letter as the second door;
  three names return; `91zzo`.
- **M161 record book** — **built (0.122.0)**: the player's biography written by others, boards of honour, ageing
  and the medical board as the quiet ending; `11aa-record`, `91zzp`.
- **M162 institute** — **built (0.123.0)**: topics, labs, forms, the voucher to the sanatorium planet; `11ab-institute`, `91zzq`.
- **M163 trainee** — **built (0.124.0)**: the stowaway boy on the right seat, learns, gets a diploma, leaves; `11ac-trainee`, `91zzr`.
- **M164 zoo** (joy) — **built (0.125.0)**: beasts brought home, pens, the zoo station; `11ad-zoo`, `91zzs`.
- **M165 wall paper & concert** (joy) — **built (0.126.0)**: the wall newspaper on the counter, the request concert
  on the receiver; `11ae-concert`, `91zzt`.
- **M166 dominoes** (joy) — **built (0.127.0)**: dominoes at the table with rivals, the mate and Vega; `11af-domino`, `91zzu`.
- **M167 mobile** — **built (0.128.0)**: the phone edition of the console look, per the Mobile section of
  [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md): receiver → one-line ticker in the console (no
  floating window); buttons into thumb zones, zoom = pinch, no ghost buttons; fit screen split
  КОРАБЛЬ | СКАФАНДР with row/clipping fixes; the suit as an RPG paperdoll composited from the
  six equipped pieces (one outline, one light) — the same composite walks the surface; one hint
  slot above the console; distance markers as edge arrow chips; mechanics.html mobile CSS.
- **Release look** — after M161: the table as paper, removal of the overlay HUD.

# QUEUE: the thirteenth pass â the galaxy as a book of stories (M122âM151)

**Full text lives in [`docs/PLAN-archive.md`](docs/PLAN-archive.md)** â grep it for `M122`. It was
moved there on 2026-08-15 because thirty milestones of far-future work were being carried in a file
that is read every session; the pass itself stands, and it is the release (0.72.0 â **1.00.0**).

## M143–M151 (0.107.0, 0.108.0) — built. The thirteenth pass is closed

`11o-slow` (figure/reply/rounds, `slowDrift` on the chrono needle), `11p-pass` (hulk, lights,
tell), `11q-grown` (`grownExtra` houses, `grownOnGive` reciprocity from `settleGive`),
`11r-plan` (`planEndless`/`planTook` in 12ta, `planDeliver` from `enterBase`), `11s-returners`
(`tin` slot renamed, `retDrift` once, board block), `11t-rumours` (two per station per three
days, 15% wrong, receiver line), `11u-names` (`nameOf` in map/HUD, cantina input, `namesEtherLine`
after 15 jumps, rumours pick the name up), `docs/PASSPORTS.md` (M150 as a rules document),
`11v-places` (three fixed addresses, nearest star, first solid planet, no log). Persisted:
`G.slow`, `G.pass`, `G.grown`, `G.plan`, `G.ret`, `G.names`, `G.namesTold`. Suites `91zzb`–`91zzf`.

**Open by design:** the second rumour channel "somebody shows his tape" is the detail line, not a
real tape; the returners' arrivals board is a fixed table; M150's four wear layers on every prop
remain art direction, not a generator.

## M140-county, M141-charts, M142-quiet (0.106.0) — built

`11l-county`: `countyPoiK` (20a scale), `countyHouseK` + `countyDrawTown` (12t), `countyNoiseTick`
from `updateSurface` (levels 30/70/120/160), `countyAnswerLine` in the ether ≥20 jumps later.
`11m-charts`: `chartsHidden`/`chartsJitter` in the map star loop, `chartsDock`, buy/drop/return
(`chartsTick` from the ether tick), cantina block. `11n-quiet`: `quietNoPirates` (13),
`quietNoWear` (12s), `quietMute` in `logAdd` and `tapeSample`, `quietLeave` in `jump`,
`quietAfterLeave`, dock line and the open door block. Persisted `G.county`, `G.charts`, `G.quiet`.

**Open by design:** level prices on the quiet edge (no single price function to hook; the market
is per-station tables) — left.

## M139-keepers (0.105.0) — built. The line of keepers

`11k-keepers`: `keepersDock` from `openStation` (habit table by `visitHere`, ration taken every
third visit, gone at visit 10), `keepersBlock` in the cantina (roster, sign, feed), `keepersDark`
(gone && !signed, or signed && jumps−fed>12), effects `keepersCourseDrift` (25a), `keepersJumpK`
(18 map cost ×1.5), `keepersEtherLine`; rhyme at the `pass` core (`keepersRhymeHere`). Persisted
`G.keepers={gone,signed,fed,given}`. Suite `91zx-keepers`.

## M138-grove (0.104.0) — built. The grove

`11j-grove`: `groveSys` (core if it has a belt, else the region's first belt system), `groveDress`
from `enterBelt` (edge 3 / core 22 marked rocks, res xeno), `groveTick` before thrust in
`updateBelt` (close / flinch / part / close-for-good, min 150 or 90), collision exemption in the
rock loop, `groveOnKill` from `killRock` (power≥3 shot, else cut +6 xeno), `groveDraw` halos after
the rocks, `groveEtherLine`. Persisted `G.grove={turn,shot,cut}`. Suite `91zw-grove`.

## M137-glow (0.103.0) — built. The light that remembers

`11i-glow`: edge = region minus core. `glowDressFlora` (all plants glow), `glowDrawPad`,
`glowScan` (+1 xeno), `glowPatches`/`glowDrawPatches` (rut, machine, foundation; night only),
`glowGroundLine`. Core: `peepHere` forced, `P.pass` counts passes per eclipse (20c), `glowTier`
gives ×1.4+flash / ×.9 / ×.34 near-only runner; `glowCaveX` puts the cave mouth at the mat's edge
in the runner's direction. Suite `91zv-glow`.

## M136-hours (0.102.0) — built. The drift of hours

(The number M136 was reused by 0.100.0 "Under the skin" in the tails sweep; region milestones keep the
archive numbers with a suffix from here on: `M136-hours`, `M137-glow`, …)

`11h-hours`: the `hours` region (needle `chrono`). `hoursOffset()` in minutes — region 3–10, core
orbit 60, core surface up to 240 toward `settleSpotX`; `hoursDrift()` adds to the chrono needle in
`instrRead` (25a), the tape follows. `hoursEtherLine` (35% of edge ether), `hoursGroundLine`,
`hoursNobody` hides the watchmen, `hoursDrawPeople` (windows by night, the one man during an
eclipse), `hoursMachine` (7 cr → 1 organics). Edge = whole region minus core (rim placement).
Persisted: `G.hours={man}`. Suite `91zu-hours`.

**Open by design:** "automation feeds the stock" is shown only by smoke and the machine — the
settlement's own stock is not auto-fed (would touch 12t economics); the night shadows are a pass
of their own if the region ever gets a core interior.

## M135 (0.101.0) — built. Three lights

`11g-lights`: the `lights` region (needle `actino`). **Edge:** night capped at dusk (`lightsNight` in
`surfNight`), one companion sun (`lightsSuns` after the star disc in `drawSkyLayer`), shutters on
every settlement yard (`lightsShutters` from `settleDraw`). **Core:** no night, two companions.
**Calendar:** `lightsConj(t)` — period 24–35 days from the region seed, a one-day window with a
sine peak; anchored by `lightsArrive()` (ether tick and landing) at the first arrival so the last
conjunction was yesterday, then fixed for good. No countdown is shown anywhere; `lightsGroundLine`
speaks only of shutters and lights. **Reveal:** `lightsDrawReveal` draws road, foundations and
arch on the core planet only while `lightsOpen(p)`; `lightsEnter` runs `enterCave` with `ancient`
(seed 9, no fauna) and the find goes through `lightsCaveFind` (120 data, `relicRoll` .7).
Persisted: `G.lights={t0,seen}`. Suite `91zt-lights`.

**Open by design:** region talk ("colonies sleep by light" in cantina/counter lines) and a
settlement glyph for the shutters wait for the factions pass; the edge generator per world type is
still the table's reservation (M132 tail).

## M134 (0.94.0) â built. The mirror

`11f-mirror`: the transit region (`mirror`, needle `radio`). **Edge:** whatever the ether says
inside the slope comes back thirty-seven seconds later, word for word (`mirrorEchoArm` from
`etherTick`, `mirrorEchoTick` in the same tick); leave the system and the echo is gone; a
dispatcher waves it off one time in three. **Core:** a fifth find kind, `echo`, always present at
the core and never taken â a thin plate edge-on with one sliding glint. Listening lays two to four
old reflections over each other: domestic lines (`MIRROR_CORE` â a time signal, a roll-call, a
forgotten mug) mixed with the ordinary ether, none invented (M116). The first listen gives the
bearing: a map mark 120â160 sectors out, where nobody flies. `G.mirror` is one bit. Suite
`91zs-mirror`.

**Still open → swept, see the tails ledger:** the edge has only the echo â the "atrocious comms" could also degrade the
receiver's own reading (`instrRead` dev on `radio` is already there, but the ether itself does not
stutter); the bearing mark cannot be removed or acknowledged; the mirror's lines do not yet enter
the parrot's memory.

## M138 (0.100.2) â built. The tunnel

The cell grid moved into the mountain (`BASE_OX`/`BASE_OY` in `21a-mode-base`: two cells to the
right of the gate, one level above the plain) and a 40 px tunnel from the gate at plain level
runs to the floor of the top row; `BASE_GY` is the plain, `BASE_GATE_X` the gate. **Still open → swept, see the tails ledger:**
the gate reads as part of the tunnel, not as a door; the tunnel has no light of its own.

## M137 (0.100.1) â built. Into the mountain

Base cross-section: mountain profile as a ramp-and-plateau to the top of the frame, gate in
the left foot, mast on the summit (`21a-mode-base`). **Still open → swept, see the tails ledger:** the pad lights on the top
row are buried under the slope; the plateau to the right is a plain wall of rock without a
second plane.

## M136 (0.100.0) â built. Under the skin

Lander silhouette by `h.form` (`19-mode-landing`), the jetpack (`20d-jetpack`, surface and cave),
and the cave rebuilt as a 2D rock field with carved passages and 2D raster tiles
(`22-mode-cave`, `18c`). Stands: `docs/mklanders.ps1`, `docs/mkcave.ps1`. **Still open → swept, see the tails ledger:** the
lower gallery has no dressing of its own (water, crystals and veins hang on the upper one only);
beasts walk the upper gallery and never descend; the rock fringe of the contour stroke carries
no material; the base was asked to look like a Fallout-Shelter cross-section and already is one
â what exactly differs is a question for the author.

## M133 (0.93.0) â built. The postal round

`11e-post`: the first themed region. Six links â five who once carried the thing and the last
addressee â hand-written, each with one line about himself and a word about who comes next, never
about the parcel. Addresses are seeded and not stored: link 0 is the post region's plain trading
system, link 5 its core, links 1â4 are stations 4â14 sectors out, outside the region. The parcel
is an ordinary object (a bundle, a jar, a wrench with a blank tag). On docking at the next link
the man comes to you himself (`postDock`, once per landing, toast + journal); the cantina shows the
parcel next to the table with one button, **open**. Opened, the chain goes on; the last man says
one extra sentence and does not reproach. Nothing is paid; the core counts as `care` in the memory
of place. State is three numbers in `G.post`; suite `91zr-post`.

**Still open → swept, see the tails ledger:** the links are met only in passing â nothing points at them (rumours, M148, are the
natural pointer); the post region itself has no edge colouring yet beyond silent instruments; the
parcel is not yet a thing one can put on the table (M128) or show to the bird.

## M132 (0.92.0) â built. Regions: the table, and the memory of place

`06c-regions`: a closed table of fifteen themed regions (post, mirror, lights, hours, glow, grove,
keepers, county, charts, quiet, slow, pass, grown, plan, tin) laid over the M122 grid. Placement
is seeded and cached (`regionPlace`): ring by theme, first cell whose core is a station system,
which has a plain trading system on its edge, and which keeps one empty region between itself and
any other theme â cores end up 3â23 sectors out, never closer than two stock jumps. `regionAt`
now carries `theme`, the theme's name and its needle; **the postal round has no needle and
`amp=0`** â the one region where the instruments say nothing. Plain regions are untouched.

`11d-place`: memory of place, persisted in `v:4` as `G.place` + `G.odo`. Per place (same key as
stories: system, or system/planet): first and last odometer, landings, and three coarse counters â
`take` (mined units), `hurt` (player shots), `care` (repairs, closed quests). **Maturation is path,
not time**: `G.odo` counts landings and jumps; `placeAge(key)` is path since the last visit. Nothing
is shown; `placeMood` returns the counter that won, for the grove (M138) and the insects (M145).
Suite `91zq-regions` (placement, monotone misclosure, silence in the post round, core spacing, BFS
reachability from origin on a stock tank, memory counters, save round-trip).

**Still open → swept, see the tails ledger:** the edge generator (parameters over world types per theme) and the hand-built core
are left to each region's own milestone â the table only reserves the place; surface layer masks
(presence/revelation, never switching in sight) wait for the first region that needs one (M135);
`care` does not yet count the table (M128) or things left behind; `hurt` counts shots, not hits.

## M131 (0.91.0) â built. A hundred and two

`seenOf`/`unseenOf` conditions (a trace of another story seen), `carry` on a trace (the parrot
remembers it as `heard` kind `story` and lists it with the place's address), `12k-stories-c`
with 30 stories, 102 in all across the three data files (each under the 40 KB guard). Suite
checks every `seenOf` target exists and that the bird records a carried line once.

**The hundred is closed.** Left open, deliberately, in the design: the barge passenger as a
channel, settlement glyph overrides, per-region colouring once regions (M132+) exist.

## M130 (0.90.0) â built. The ground speaks too

Channels `land`, `cave`, `settle`, `tin`; addresses `planet`, `settle`, `tin`, `world:T`; planet
stories anchor to system/planet and landings on a planet are counted. `12k-stories-b`: 46
stories, 72 in all. Lint now also rejects unknown address kinds.

**Open for M131**: links as data (a trace may require a trace of *another* story seen), the parrot
as carrier (a line heard at A repeated at B), the barge passenger as a channel, +30 stories to
pass a hundred.

## M129 (0.89.0) â built. Traces, not tasks

Engine `11c-stories`, data `12k-stories-a` (26 stories, six of them long), suite `91zp-stories`.
Decisions taken with the author on 2026-08-22: **no journal page** â stories leave no trace in
the interface; **anchoring at first meeting** (deterministic lot per story Ã place, â¤4 floating
per place); **a third never explained**; **the six rivals get six stories** (four built: baker,
Krapiva, Kim, Shtof, Sovenya, Efim â five; the sixth waits for a face). Long stories are written
in the key of institute fiction â the report on the event that never happens, the null-cabin.
Channels: ether, counter queue, table, finds, rumours, cantina scene. Lint: closed `when`
dictionary, every turn flag read, 2â7 traces, â¤4 surfaces (counter + table count as one).

**Open for M130**: the surface, the settlement (glyph), the machine and the animals as channels
â the four "ground" stories of the design (who feeds the Tin, the shoal, the shell, who turns
off the light) wait for them; +40 stories. **M131**: links as data, the parrot as carrier, +40.

M128 and M128b (speech queue, the table, the tape as an object; the frame's address, the performance pass and the wide-screen pane) are in `docs/PLAN-archive.md` â grep `M128`.

What it is, in short. M106âM121 gave the arm one long story told in fragments; this pass gives it
**many short ones**, and a body to fly them in. The unit is a **region**, not a planet: six to ten
systems on one theme with a hidden gradient, a procedural edge and one hand-built core, so the
periphery points at the core without a marker or a quest log. The instruments come first (M122 the
panel and its misclosure, M123 the paper recorder), then everything the player sees moves into the
cockpit (M124âM127), speech becomes a queue of lines and putting things on the table (M128), and
**the hundred** â a hundred small human stories on one template â is the load-bearing wall
(M129âM131). Design: [`docs/DESIGN-stories.md`](docs/DESIGN-stories.md) (2026-08-22, awaiting the author's call on four forks listed at its end). Fifteen regions follow (M132âM146), then rumours, a returnee and the release.

