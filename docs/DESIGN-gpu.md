# The renderer — WebGPU, with Canvas 2D as the brush

The author, 23.09.2026: «переноси все на новые технологии, то что не умеют новые оставлять в канвас»;
«нахуй откат и поддержку старой версии, все по новой»; «графику только улучшать … не надо одинакого, надо
лучше»; «первое — на новый движок, потом по плану». This file is the recipe; the open work is PLAN.md §0.

## 0. The author's decisions (binding)

- **WebGPU only, no fallback**, no switch, no old-version support.
- **Hybrid:** what the GPU does badly (text, complex vector shapes) stays Canvas 2D, live or baked to a texture.
- **Graphics only get better.** The same look is not accepted: a G step is closed by a `main | gpu` pair of the
  same scene plus one line saying what got better. No improvement, not closed.
- **Do not measure** (no benches); the one yardstick is the stage-0 gate in PLAN.md.
- **No new tools:** rewrite the old one or kill it and write one new. Before rewriting a shared tool, grep its
  callers.
- **No heredocs** for scripts: write a `.py` file, run it by path.
- **Rules may be broken for beauty** (the author, 24.09: «можно менять правила, если это красиво»). The frame
  laws, the palette, «the language stays» and every point of §L are defaults, not fences: if breaking one makes
  the WHOLE frame visibly more beautiful, break it, and say in the gain line what was broken and for what. The
  judge is the 760 px pair. Never moved: gameplay, physics, world generation (a seed gives the same system; new
  randomness comes from its own `rng` stream), the save format. The process stays.
- **The step gate (24.09):** a pair of WHOLE frames (2560×1600 → 760 px wide), one scene, gpu visibly better at
  first glance; the gain line is about the frame, not an element. Crops only as an extra. Cheap by construction
  (¼ resolution, caches), not by benches.

## L. The leap — redo everything, Control says what (brief of 24.09, before G5…G14)

The author: «пусть всё переделывает». Order L1 → L2 → L3 → L4 → the G steps again on top. A commit per sub-item,
each with a whole-frame pair. Frame laws stand as defaults: cold key + warm accent; a frame is 2–3 masses; the
light has a source and the lit sits by it; everything standing casts a shadow; grain instead of flat fill; motion,
not blinking; mix tone along a short arc.

**L1 the space backdrop** (first: k_g4m plus two more star classes).
1. Grade: space shadows cold (violet → blue, no brown; the old gpu backdrop was (37,22,35), brown murk); the star's
   side warm.
2. The nebula in three scales. Macro: 2–3 masses a frame — a lit mass, a dark dust band, a void (notan, `look()`).
   Middle: filaments and pillars, the brightest gas is the edge toward the star. Micro: grain along the flow field.
   Palette: 2–3 hues around the wheel per system, ≥90° apart, not one violet family.
3. Dust absorbs: stars and gas behind a band get dimmer and redder.
4. Depth: three parallax layers; the far one colder, paler, softer, the near one more contrasty.
5. The star's glow is scattering in gas and dust: warm, by density (denser = brighter), seen with the star off
   frame. The k_g4m regression (left band 156 → 67) closed with margin.
6. Shafts in space: planets, station, asteroids between the star and the camera cut the light — shadow rays through
   the dust (radial blur of the occlusion mask from the star's screen point, off frame too).
7. Stars: brightness by a power law (many faint, few bright), colour by temperature. Spikes only on the ≤5
   brightest in frame (tens now — noise). Stretch in flight, twinkle only at rest.
8. Near-camera motes (parallax >1): sparse, lit from the star's side, streaks in flight.
Bolder (24.09): at least one system in five sits INSIDE a bright emission nebula — the whole frame glows, hulls are
silhouettes on light; grades need not be cold+warm — monochrome (amber for a red giant) and contrast pairs
(teal + orange, magenta + green) are allowed, take the most beautiful per star class; every system has one huge
landmark on the backdrop seen from everywhere (a supernova remnant ring, pillars, a hole's jets, a comet tail
across half the sky).

**L2 HDR light.** The scene in rgba16f with a ladder of brightness (star core ≫ flames ≫ lamps ≫ a lit hull ≤ 1).
Bloom as a mip ladder (6 levels, soft knee): wide and warm at the star, narrow at a flame. AgX tone map. A grade per
star class (LUT or split toning): red dwarf — embers and deep violet; yellow — gold with teal shadows; blue giant —
ice and indigo; binary — two keys, the frame split; hole — desaturated with the disc's orange accent. A star in
frame gets a light anamorphic streak and 2–3 ghosts. The UI takes no bloom and no grade.

**L3 light touches the world.** Materials of baked sprites: metal — a hard glint stroke, paint — diffuse, glass
reflects the star, windows and lamps emissive. Point lights (flames, beams, bolts, bursts, station lamps, nav
lights) light hulls in a radius: a beam paints a hull's edge its colour, a burst flashes on every hull nearby, one's
own flame lights the stern. Star shadows: a station shades its moored barges.

**L4 particles.** Exhaust: curl noise and a temperature ladder white → yellow → orange → red → smoke. Sparks: HDR
streaks. A burst: fireball, debris with lit edges, smoke lit by fire and star; the shock wave refracts the screen.
Heat haze behind the nozzle (G4b).

**Then the G steps again, on top of L.** Known so far:
- G2 the star alive: granulation flows, the corona in jets, prominences on the limb, flares.
- G3/G3b planets: surface in three scales, ocean glint, clouds with shadows on the ground, city lights at night,
  a Rayleigh rim and a sunset band at the terminator.
- G5 surface: the sky by scattering in the planet's air; volumetric cloud layer with a silver edge to the sun;
  visible rays through clouds; far ridges sink into sky colour; weather as particles lit by sun and lamps; HDR
  lamps and pools of light at night; water reflects sky and sun; wet sheen after rain.
- G7 cave: darkness, light only from the lamp — a cone with soft shadows from rocks, ore emissive with bloom, dust
  in the beam.

### L.S Ships and interface (Контроль 15/n, 24.09; the author: «давай нормально нарисуем»)
**Stage 1 amendments.**
1. The HUD overlay runs at the device's native DPR (2.625 on the S23; the world stays at 1.5), so text is sharp.
   The overlay is not redrawn every frame: a full-screen canvas at 2.625 is ~10 MB to the compositor per frame.
   Raster only on change. Whatever follows the world or a finger (edge chips, compass, target brackets, sticks)
   is DOM with `transform` (the compositor moves it without raster) or a small canvas of its own. Pair at 390×844,
   DPR 2.625, shows exactly the sharper text.
2. Hulls: porting is redrawing. The current bake keys on bank (.05 rad) and scale (1/16 octave), so every turn and
   zoom is a new bake, and on the GPU an upload. Bake the MATERIAL, not the light, once per hull. Key: seed,
   `PART_GEN`, the step of grime and scars. Master ~2× the largest on-screen length, with mips. Layers: albedo
   (paint without light); height → normal (spine, plates, seams, scars); emission (windows, nav lights); mask
   paint / bare metal / glass → gloss. Bank and scale leave the key and go to the shader. Start from `GST_WGSL`
   (direction to the star, the cos³ rim, keeping its own colour, `plOcc`). Pass 1: pair no worse than now, zero
   uploads in flight.
3. The flame is a shader at once; `drawFlame` is not ported as is. An HDR core > 1 feeds the bloom; the plume flows
   along the axis over the noise tile. Today `rndFx()` every frame is twinkle, and the law is motion, not twinkle.
   Length follows thrust with smoothing. Working flames orange fire; cool ones short white-blue.
4. Pirates, «Чебурек», missiles, combat — the same material path. Station art: a key without motion. The
   `gpuCanvasTex` cache and the 416×140 pod as in the plan.
5. Gate: uploads 0, submits 1 → Контроль's phone, 30 s + 5 min → candidate. Further redrawing does not hold the
   candidate.

**After the candidate — redraw passes.** Each: a 760 pair and one line of what got better.

*Ships.* On the phone at 58 px a ship reads as a body in real light; up close (card, hangar) as a machine made of
material.
- a) One light, the star. The terminator across the hull. Flying toward the star — the nose is lit; away — the stern
  is lit, with a thin rim on the star's side.
- b) Shadow is not black: fill from the gas — the nebula's colour at the ship, a low mip. Warm shade in orange gas,
  cold in blue.
- c) Rock stops light: in a planet's shadow the ship goes dark, only windows and flame live.
- d) Glints by count: gloss only through the bare-metal mask, a high power, 2–4 hard glints on the spine and edges,
  sliding as it turns. Not a smear over the whole hull.
- e) Windows and lamps: HDR emission, a light bloom, lit in shadow too.
- f) The flame lights the stern: a warm spot falling off over ~.3 of the flame length. A second light, i.e. a
  breach of «one light» — name it in the line.
- g) Silhouette: a 1-device-px rim; on bright gas the body is dark; `GPU.sep` stays; nothing shimmers on a turn
  (mips, premultiplied).
- h) Untouched: the silhouette, the maker grammar, part sizes, hitboxes, `PART_GEN`, seeds, the save. `makerRead`
  (M369) ≥ 90 %.
Pairs: the player's ship at phone scale in three positions — toward the star, away from it, in a planet's shadow;
plus a pirate and a close-up (hangar or card).

*Interface.* The world is the picture; the interface is a quiet instrument; the one warm accent is the next action.
From the phone frame (0bd3b0b, portrait):
- a) Everything is caps with letter-spacing (К ЗВЕЗДЕ, КАРТА, МЕНЮ, ФОТО, ЭФИР · ПРИНЯТО, ЦЕЛЬ, ТОПЛИВО…).
  Hierarchy by size and colour (CLAUDE.md): sentence case, numbers larger than labels, tabular digits.
- b) Four warm things at once (К ЗВЕЗДЕ, ФОТО, ЦЕЛЬ, the МЕНЮ dot) — no hierarchy. Warm only for the next action;
  the rest cold and quiet.
- c) The right edge: three plates ~⅕ of the screen width plus ФОТО. «Two permanent buttons» kept to the letter, not
  by area. Compact, from 44 px. Check that «К звезде» appears only for a reason.
- d) Four thin bars with small labels read as a table. Fuel and hull lead: a large number, a short bar, warming as
  they run out. Energy and hold are quieter and speak up only on change.
- e) Overlaps: ДОЛГОЕ and ФОРСАЖ lie under the ЭФИР ticker and under ФОТО. A test: overlay element rectangles never
  intersect at 390×844 or at 760.
- f) Plates: dark glass without a gradient, a hairline edge, the text carries the colour. Light is only added from
  the dark ground, never laid over as a gradient.
- g) Untouched: ≥ 44 px, `--ui` as the one ruler, `withScale(UIK…)`, a button names its action.
- h) The distance in an edge chip's label ticks every frame: the digits flicker and the chip canvases re-raster
  1.8 times a frame. In motion two significant digits (3182 → 3.2к); the exact number on approach or at a stop.
  Chip rasters drop to ~0.
Order: the flight HUD first, one pair at 390×844 and at 760. A fork of taste: the pair goes to the author for a
verdict before any other screen.

The phone frame budget does not grow: GPU ≤ 12 ms.

## Where I stopped (update on every commit)

- **Released 0.457.0 (`2a288f7`, from `rel`; merged back into gpu as `b0c8cac`).** The next candidate goes from
  gpu the same way: the release list plus `cismoke`, its sha to Контроль. Rollback: a commit with the tree of
  `d543aff` on top, no force-push. `C:/Claude/drift-rel` stays — it is Контроль's working directory; nothing is
  done in it.
- Now: **§L stopped — the phone first** (Контроль 24.09, PLAN §1 top item): 0.457.0 on the S23 at 24.9 fps.
  Brief of **P1 1/n — measure the GPU frame on the phone, cut the obvious**: `?g11=deep` now works in place
  (no «new game», no jump — the author's save is safe): it waits for flight, then kills one GPU pass at a
  time in «base — kill» pairs of 1.5 s (nebula, backdrop, system-under, planets, city lights, trails, combat,
  hull light, point lights, refraction, bloom, the #c copy, the final pass stripped to scene + front + UI via
  `fsFinal0`) and steps the DPR ×2/1.5/1.25/1; it prints fps delta and median ms, the share of frames the
  nebula re-generated, `gfx.res`/`RES_AUTO`, into a box, `console.log` and `window.G11_DEEP`; the old tour is
  `?g11=deeptour`. The kill switches are `GPU.kill.{bloom,front,fin}` (08b). The obvious cut: a phone (≤760
  CSS px and a coarse pointer) caps the auto DPR at 1.5 (`PHONE_DPR`, 08-state) — 0.56 of the pixels for every
  pass and every #c copy; headless shots (fine pointer) are untouched. Pair `ph_pair.png` (411×742 at ×2 |
  ×1.5, both scaled to the S23's 2.625 like the compositor): the same frame, the hull a touch softer; the stars
  differ, but they differ between two shots at one DPR too (PLAN §1). L1b 8/n parked (PLAN §0).
  **P1 2/n — the stick's band stops covering the course** (Контроль 24.09, `ph2_seq.png`): the band from the
  stick's centre to the finger (15b) was two fills, the set course .18–.30 and the reached speed .32, adding up
  to a near-opaque wedge in front of the nose. Now one fill, 15 % at the root fading to 3 % at the head, the
  edges as lines (a dark kant under a coloured 1.1 px line at .4), and the reached speed as the same edges
  brighter and thicker (.8, 1.6 px) up to where the ship has got. Pair `hb_pair.png` (HEAD | now, 411×742 ×1.5
  scaled to the S23).
  **P1 3/n — a planet's shadow in the gas is a cone, at most half dark** (Контроль 24.09, `ph_tri.png`): the
  shadow (16gb `GNB_EMI`) took 80 % of the gas and all of the fog and faded over 11.5 radii — a big planet threw
  a near-black band off the screen. Now it dims by .5 at most, fades over 4 radii + 90 px, its core narrows
  (to .35 R by 9 radii) while the penumbra grows (.3 px per px of distance), so it lightens and blurs into a
  cone. Pair `psh_pair.png`, crop `psh_crop.png` (the outermost giant, star behind it): mean luminance in
  three windows of the shadow 5.6 → 9.7, 12.6 → 17.0, 7.8 → 11.6.
  **P1 4/n — the glow's first rung reads each texel once**: `fsDown` called `frameAt` and `frameHdr` per
  tap, both sampling the front layer and the scene — 80 fetches per quarter-res pixel, 5 per screen pixel.
  Inlined, one fetch each: 48, same arithmetic. Pair `bl_pair.png`: the glow is the same, only the unpinned
  stars and the HUD clock differ; gpu errs 0. A cut that is right whatever the S23's deep numbers say.
  **P1 5/n — the stand pins the sky**: `01-core` seeded `rnd`/`rndFx` from the wall clock at load, so every
  launch drew its own starfield (`BG` in 16-flight) and no pair could compare stars. It now takes
  `DRIFT_SEED` when a stand sets it before the script; `docs/shot.py` sets 1 (`--seed -1` = as in play).
  The player never sets it. Two runs (`same_pair.png`): one sky; what still moves is real time (moons, HUD).
  **P1 6/n — target chips at the edge never overlap as drawn** (Контроль 24.09, `hb_pair` y≈1390): the
  slots were apart, but a chip glides to its slot at `CHIP_SPEED` and on the way lay over its neighbour.
  Now a drawn chip closer than the 4 px gap to one already drawn moves along its own edge by the overlap
  plus the gap (zero at the boundary, so no jump), or to the neighbour's other side at the frame's edge.
  Check (`chipab.sh`, ship behind the station on the star's bearing, the station chip forced to be in
  flight at the star's chip): tightest gap between drawn chips −14.4 px → 4.0 px; gpu errs 0.
  **P1 7/n — the stand steps the frames**: `docs/shot.py --clock step` (the default) queues rAF and steps
  it itself, 1/60 s a step; `performance.now`/`Date.now` read the stand's time from the first line (epoch =
  today's UTC noon), the wait also waits for the scene tail's `G.running`, and a scene script that must
  act every frame uses `__STEP.each(fn)`. Two runs of the planet scene: max|Δ| 0 over the whole frame
  (was 217 with real time). Title, surface, cave: finish, errs 0; `--clock wall` keeps the old way.
  **P1 8/n — the probe stops confusing a resolution step with a win** (Контроль 24.09, S23: resAuto fell
  1.5→1 at 8 s, `final` killed read −8): `?g11=deep` now freezes the resolution for the whole run
  (`resFresh=1e9` and the DPR the game had chosen; `&dpr=k` sets one), measures each kill as base–kill–base
  (delta against the mean of the two bases) and logs per pair the canvas size (one value, or `a→b` if it
  moved) and the ship's position; every interval also carries the JS time of `frameBody` (p50/p90 of
  `FRAME_JS`), the cost of one `stepWorld` call and the ship quanta per frame (mean and max `WORLD_SUB`,
  via a wrapper that is on only while measuring — QUANT_MS untouched). Why `final` read slower: killing it
  swaps `fsFinal` for `fsFinal0` and nothing else — bloom is still computed and the #c copy still made — so
  its true gain is a few fetches per pixel; it was the last pair, measured against one base taken 20 s
  earlier, with resAuto free to step 1→1.5 back up in between. The frozen pairs will say which. Found on the
  way: `shot.py --clock wall` drove six manual `frame()` calls, each starting its own rAF loop — seven
  frames per vsync, `FRAME_JS` of the last ≈ 0; a manual frame no longer chains rAF. **Every headless
  timing taken with `--clock wall` before c0a9f1f is void** — do not lean on it. Headless (411×742
  ×1.5, vsync-bound): canvas 617×1113 in every pair, JS p50 2.4–3.5 ms, world 0.5–0.6 ms, 2 quanta; all
  deltas 0–1 fps — the numbers that matter come from the phone.
  Probe prep (50a0807, 91e344f, 48aeeca): kill keys `nebGen` (the regeneration alone) and `frontPx` (the
  #c copy shrunk to 1×1, the 2D raster kept), and GPU pass times by timestamp queries (`out.gpuMs`).
  **P1 11/n — the dust dims the stars in the stars' own shader** (Контроль 24.09): the nebula composite was
  two full-res passes, ABS (blend mul) then EMI (blend add). Under the nebula the scene holds only the black
  clear (`SPACE_BLACK` = 0) and the stars when ABS runs: the regeneration needs no scene pass open, and
  everything else — dust motes, system-under (orbits, belt, the star's glow), planets, the #c segments — is
  drawn after the composite; the landmark (the galaxy, the remnant) lives inside the generated texture and
  reaches the frame through EMI, never through ABS. So the ABS factor moved into the star pipeline's
  fragment shader (`gnbStars`, 16gb; the coverage is `gspCov`, 16g): every part of a star — dot, streak,
  halo, spikes — is multiplied per pixel. Over-blend is linear and rgba16f does not clamp, so
  `m·(s + d(1−a)) = m·s + m·d(1−a)`: a core that is > 1 before absorption lands the same. EMI reads its
  bicubic once instead of three times. Pinned sky, stepped clock (`cut` pair, 411×742 ×1.5): outside the
  menu's `newsdot` CSS pulse (DOM, real time), max|Δ| 1 on 531 px, spread over the frame (214 on star
  cores, the brightest at luma 244; the rest on faint halos); the bicubic alone gives max|Δ| 1 on 34 px
  (the compiler contracts the reused value differently). Desktop timestamps (617×1113, thrust, two
  alternated runs each): nebComp + scene0 1.70–1.71 → 1.38 ms; nebGen 0.91–0.93 untouched; gpu errs 0.
  S23 on 48aeeca (landscape 1596×650 ×2): nebComp 11.8 ms, nebGen 4.3; killing the regeneration +1 fps,
  so the rare-generation plan (9/n) is dropped. front2D +27 against frontPx +1: the 2D raster eats, not the copy.
  **P1 12/n — the phone cap reads the short side** (Контроль 24.09): `innerWidth<=760` missed the S23 held
  sideways (798 CSS px) and it drew at ×2. Now `min(innerWidth,innerHeight)<=760` and a coarse pointer.
  Stand at ×2 with a coarse pointer faked: 844×390 → 1.5, 390×844 → 1.5, 1400×900 → 2.
  **P1 13/n — the nebula's fine detail reads a baked noise tile** (Контроль 24.09; S23 nebComp 11.8 ms).
  Desktop ablations of EMI (ms): all 1.38, noise off 0.74, planet shadows off 1.03, gradient fetches off 1.38,
  bicubic → bilinear 1.31, all three off 0.38. The noise is 2D (time only shifts the warp's sample point),
  so its lattice is baked (`16gaz`): texel k holds `gh(k−256)`, a 513² r16float tile, period 512 with the
  last row and column repeating the first. `gnt` gathers the four nodes in one `textureGather` and blends
  them with the same smoothed weights in arithmetic (the sampler's filter would give 8-bit weights, steps
  in smooth gas); `fineT`/`fineE` use it. Inside the window −256..255 the noise is the old one; a system whose
  lattice leaves it gets another realization of the same noise, no seam (the tile is periodic), and a screen
  spans 9–30 cells of 512. EMI also skips `fineE` where its weight is zero (outside gas, off the ionisation
  front). Pairs outside the DOM buttons' CSS pulses: 411×742 zoom .4 and zoom 1.2, max|Δ| 1 (2088 and
  1680 px); 1440×900 zoom .25, max|Δ| 1. Desktop nebComp 1.34–1.37 → 0.92 ms (tile alone 1.12); gpu errs 0.
  Next in EMI: the planet-shadow loop, 0.35 ms.
  **P1 probe — labels on every scene segment and every #c copy** (Контроль 24.09: 16 of the S23's 35 ms were
  unlabelled). `gpuSeg(name)` (28z) names the next piece of the scene pass; under timestamps it closes the pass so
  the next `gpuScene()` opens a labelled one (an extra target store on a tiled GPU — paid only by probe frames).
  Pieces: `scene0` (the clear), `stars`, `nebComp`, `motes`, `under`, `planets`, `world`, `over` (after the
  front composite). A copy of #c is a queue operation outside any pass, and Chrome's 2D raster runs behind it:
  `gpuTsAround` brackets it with two empty compute passes, each its own submit, and the gap is booked as
  `front1`, `front2`, `ui`. `out.gpuMs` gives per name `ms` per pass, `pf` per frame, and `sum`; `frame − sum`
  is GPU idle. Desktop (617×1113, thrust, ms per frame): under 1.28–1.39, front1 1.28–2.42, nebComp 0.91,
  final 0.34–0.52, bloomDown 0.29–0.42, nebGen 0.39–0.42, front2 0.15, frontComp 0.10, planets 0.09, world
  0.07–0.09, over 0.06, stars 0.03–0.04; frame 5.8–6.1, sum 5.2–5.3.
  **P1 14/n — exact cuts in the nebula** (Контроль 24.09; budget: S23 portrait ×1.5, GPU ≤ 12 ms a frame).
  (a) `fineT` returns 1 at once when T0 ≥ .97: there the ridge weight is 0 and `mix(T0,Ts,.2)·1.12` ≥ 1.09
  clamps to 1 — clear sky skips the noise in EMI and in the star shader. Pairs: max|Δ| 0; desktop nebComp
  unchanged (0.91), the phone decides. (b) The regeneration reads the tile too (`fb`/`gn` → `fbt`/`gnt` in
  `GNB_GEN`). A histogram of its lattice nodes (atomics, 3 regenerations): 82 % within ±255, 98 % within ±511,
  5 in 100 000 beyond ±1023. So the tile grew to 2049² (8 MB r16float, period 2048), baked once by a render
  pass with the same `gh` instead of JS; the ±256 tile of 13/n changed the gas layout of the system visibly.
  A branch «outside the window → hash» was exact but slower (0.97 ms): the compiler runs both sides. Pairs
  (zoom .4 / 1.2): max|Δ| 2 on 95 px / 1 px; desktop nebGen 0.92–0.94 → 0.69 ms.
  (c) Rejected: a forward difference from `DD.x` (two `dustAt` instead of four) made nebGen 0.74 → 0.59 ms,
  but the pair gave max|Δ| 11 / 14 (zoom .4 / 1.2), spread along the lit dust rims: the dust field has kinks
  (`max` of wall and pillars), and a one-sided difference tilts the gradient that sets the rim's facing. The
  central difference stays. (d) The landmark's frame constants (centre, cos/sin of the angle, the comet's
  `atan2`, size in px) are computed once by `gnbLfr` on the CPU and passed to GEN (`u.l`, `u.k.w`) and EMI
  (`V[14]`, `V[13].x`); `pow(x,2.)` → `sq` in GEN and EMI. Pairs at zoom .4, the landmark kind forced to each
  of 0–3: max|Δ| 1 on ≤ 34 px (kind 3: 0); zoom 1.2: 1 on 6 px. Desktop ms unchanged within noise.
  Then the direction changed (author, 24.09): all 2D moves to WebGPU; (e) waits until after that.
- **Stage 1 — flight without `#c`** (the author 24.09 «нахрен 2D, всё переноси»; order in `PLAN.md` §0). Target:
  no upload of `#c`, one submit a frame. 1a: the interface layer `GPU.ui` became a visible DOM canvas `#hud`
  over `#g`. The system's HUD (`drawSysHud`, the sticks, the watch caption) draws there through `gpuHud(fn)`,
  and the rack draws there after `gpuWorld`; the rack's `ui` upload is gone. The layer is cleared at
  `gpuFrame`, and only if something was drawn on it. `gpuTakeSnap` lays it over the snapshot. The HUD no
  longer passes through the tone curve, the vignette and the grain, as in the 2D frame («до приборов», M243).
  It also stopped inheriting the world's `textBaseline`: the edge chips' text now sits centred in the plate
  (it lay on the bottom border). Pairs: the whole frame at zoom .4, max|Δ| 190 only on the chips' text
  (mean .11); with the rack open, max 5 on 145 px.
  1b (15/n amendment 1, module 08bh): `#hud` runs at the device's native DPR (`gpuHudDpr`, ≤ 3) and is rastered
  only on change. Painters hand in `gpuHud(key, fn)`; `gpuHudFlush` at the end of the world clears and redraws
  only when the frame's key string differs (sticks: every frame while a finger is down or the trail fades,
  otherwise the rest point's key; the watch caption: its text; the rack: every frame while open). The edge chips
  became DOM (`chipDom`): position and arrow rotation by `transform`, opacity by `opacity`; each chip's small
  canvas (plate, hairline, label, at native DPR) redraws only when its label, colour or side changes.
  Measured in thrust flight at 390×844 ×2.625: `#hud` raster 0 a frame, chip canvases 1.8 a frame (the distance
  in the label changes), uploads 2.06, submits 3, `#c` 13.4 calls (the world). Pairs: 411×742 ×1.5 against 1a
  max|Δ| 58 on glyph edges (subpixel placement), the chips look the same; 390×844 ×2.625 shows the text sharp.
  G3b 3/n (e1aeb19) and L4 k/n (7b406eb) accepted.
  1b fixes (Контроль on 9daced2): the snapshot carries the chips — `gpuTakeSnap` lays each chip's canvas and
  arrow over it by the chip's place, size, opacity and angle (`chipDomSnap`), paid only when a snapshot is taken,
  so `look()`, the detectors and the goldens see what the player sees. Against the page screenshot, inside the
  chip rects, it differs only by one frame's motion. Goldens at 1280×800 and 390×844 and the detectors are green
  with no `-Accept`. `chipDom` returns at once without a GPU (the Node tier has no `after()`): the Node tier is
  green (quarantined «рейсы» red before Stage 1 as well), and Chrome `--disable-gpu` as in deploy.yml loads with
  no Uncaught and passes the smoke.
  1c (the `#c` rewrite, labels and shuttles): the world's labels — station, planets, moons, finds, pirate names,
  the loot countdown — are `domLabel` (08bh): a small native-DPR canvas with the same `fillText`, redrawn when
  the text changes, moved by `transform`, dropped from the DOM after 600 unused frames, laid over the snapshot.
  They no longer pass through the tone curve, as the HUD since 1a: an alpha-.6 label reads as authored in 2D, a
  touch dimmer than the toned one (station label 155 → 89 at its brightest pixel). The shuttle's body is a
  sprite baked once per maker colour (`shuttleSprite`, 40×24) and turned by `gpuImage`: the pair at ×1.5 max|Δ|
  28 on its hairline. `gpuCanvasTex` became a true LRU (a hit moves to the back), so eight canvases in use no
  longer evict each other. Flight `#c` is now the hull (bake + bank underside + nav lights) and its flame only.
  1c fixes (Контроль): the dimness was the blur. A label canvas sat at a fractional pixel, and its CSS size was not
  a whole number of device pixels, so the compositor resampled a 1-px stroke and halved its peak. Labels and
  chips now take a device-pixel size and a device-pixel place (`Math.round(x·dpr)/dpr`). Glyph cores against
  bc7fe4e (0.457.0's label path, the 10 brightest pixels): planet label and chips 0 at DPR 1 and 1.5; the station
  label −6 and −10, the old front layer's `emit()` glow on its near-1 red, which 16/n removes anyway.
- Brief of **L4 k/n — the shock ring and the exhaust haze bend the backdrop, never a hull** (Контроль 24.09): no
  hull, own or pirate, sprite or 2D, is cut into bands; an RGB fringe on the backdrop only. Done (08b/08c): the
  scene's alpha became the hull mask — every blend keeps it (`GPU_KEEP_A`), the lit sprite (`gst`: pirates,
  stations, barges) draws with blend `hull` and lowers it by its coverage; 2D hulls (drawHull now marks its circle
  whenever the GPU is on, not only on bright gas) leave their coverage in the emit target's alpha (`fsComp`).
  `fsFinal` damps the offset by `hullSoft` (the mask plus 8 taps at 2.5 and 6 px, so the backdrop calms over ~6
  px instead of a step at the edge) and by the mask at the source (.5, .92, 1.08 of the offset — a channel
  landing on a hull's thin edge made neon specks). Pairs `l4_8.png` (the ship, blast 8 frames old),
  `l4_16.png`, `l4_p.png` (ship and a pirate with the blast between), sheet `l4_sheet.png`; scripts `g4s.sh`,
  `g4sab.sh was` (shoots HEAD as «was» from a patch of the working tree).
- The old release path, kept for its steps: the author: deploy to main
  before the limit window reaches 90%; the signal «ДЕПЛОЙ» comes from Контроль. On it: close the step with a
  commit; `test.ps1 -Full` and `node test-node.js`; bump `VER` and a PATCHNOTES line (what the player sees
  better, plus «needs a browser with WebGPU»); a release commit; send Контроль its sha. **Контроль pushes**
  (`git push origin gpu:main`, fast-forward only) and watches the workflow, md5 and data-alive. Rollback if
  the site falls: a commit on top with the tree of `d543aff`, never a force-push. Only a commit Контроль
  accepted by pairs goes to main. CI rehearsal of ef8c8b9 (deploy.yml flags, `--disable-gpu`): load clean,
  smoke 4/4, Node green (the «рейсы» suite fails in full order only, green alone; it sits in quarantine).
- G2 accepted (40f3276), released as B (canvas picture tests quarantined, step A next). G3b 1/n accepted;
  **G3b 2/n done (below)**; next: the release on `rel`, then step A (tests read the WebGPU frame), then the plan.
  Brief of 2/n was: the nebula wedge's straight step first; the gas giant with differential bands, curled edges
  and 1-3 storms in its own colours; fine relief only on heights and ridges; lights as a city, not a fire.
- Brief of **L1b 6/n — pillars become tapering trunks, not sticks, and the star field is as rich as
  main's.** A pillar is a trunk: base width ≈ ⅓ of its length, narrowing to a rounded head a little wider than
  its neck, 2–3 swellings along it, a bend up to 15°; 2–4 in the frame, each at most half the way from the wall
  to the star — the black ceiling (≤45%) is kept by count and length, not thickness. The reflected light is a
  bark: neutral grey-brown with 30% of the nearby gas tone, gone 5–8 px inside. Stars: with no absorption, l4a
  holds ≥242 (main's count), most small, rare bright ones with a light glow through the L2 mips. Gate: whole
  frames at 760 — nnormal ×1.60, l4a ×2.00, l2c ×1.10 — plus l2c «e0e933f | now», no less drama. Then the G
  steps anew on top of L, by the bible §L in its order, each with a one-line brief here first (G5 frozen).
  L1b and L4 follow-ups sit in PLAN §0.

- Done: core `08b`, kit `08c`, space `16g` (G1: live nebula wisps and lanes, stars with halo and tapered
  spikes, dust with depth of field; pair in `scratchpad/pairs/system_crop.png`),
  `docs/shot.py` on the GPU (`--budget` kept for `vetshot.py`).
- Solo from 23.09 (the author: «один он эффективнее») — no porting agents. The ten agents were stopped
  before any commit; their worktrees are removed. Kept drafts in the session scratchpad: `agent-G5G6/
  tracked.patch` (19e-clouds rewritten as density bakers, 42 KB, the GPU air module not started) and
  `agent-G11b/src__24cf-gpu-rooms.js` (a shared room kit, 5 KB). G12's tape fix is merged: the paper shows
  before the first two samples (the strip was blank for three seconds — not a GPU bug).
- Order: G2 → G14, one at a time, each closed by a pair and a line of gain.
- G2 done: `17g-gpu-system` — orbits as exact ellipses with a continuous tail, station ring, belt band + dots,
  the star of every kind as one field (photosphere with granulation, glare laid over the disc so the limb
  hands off to the corona; giant stays orange, dwarf white-hot), the bleed. Pairs by kind: scratchpad of
  session 21f451ab, `kpairs.py <scene> <name> "<js>"…` shoots main and gpu with the same `--js`
  (main's own `docs/shot.py` in `mainref`); freeze the scene first (`freeze.js` there: planet, moon and station
  angles pinned, `spd=0`, ship placed) — otherwise the two sides differ. Accepted pair: `g2f.png`, `g2f_crop.png`.
- G2 accepted by Control (24a10e2) for single, giant, binary. G2b (the hole): background lensed through the nebula
  texture of 16g plus hashed stars in the source plane, Keplerian disc with Doppler asymmetry, photon ring, the far
  disc bent over the shadow — pair `g2b.png` / `g2b_crop.png`, awaiting Control. Wide corona term .12 → .15 (weight).
- G3 done: `17ga-gpu-planets` — one quad per body: the strip wound on a true sphere (atan2 longitude), light
  from `planetSunRot` (so `91zzzb-bio` still guards it), soft terminator where there is air, cool night,
  day-side atmosphere beyond the limb instead of the r+2.5 stroke, rings in their plane with ringlets and both
  shadows, moons as lit spheres. 2D `planetDraw/planetPaint/planetLight/planetCols/drawRing` are gone. Pair
  `g3a.png` / `g3a_crop.png` (gas giant `planets[3]`, terran `planets[0]`; ship and zoom in the kpairs js).
- G3 accepted by Control; G3b (surface in three scales, sun glint on water) is in PLAN §0.
- G3b done (`17ga`): the palette is handed to the shader, the strip's height is recovered from the colour (nearest
  point of the palette polyline), middle and fine noise are added to it and it goes back through the palette — the
  same colours, finer; the strip is read through a two-texel noise warp. Relief: gentle hills everywhere, warped
  rounded ridges in belts (a coarse mask), shaded by a finite-difference normal; both layers fade in by texels per
  pixel and earlier at the limb (×√nz, ×nz) so nothing shimmers. Water below a waterline per type (`GPL_SEA`) takes
  a broad sheen plus a wave-broken core at the half-vector (measured: +30 over 73k px at .37 R towards the star).
  Clouds (`GPL_CLOUD`, air worlds only): warped zonal fbm, edge eaten by finer noise, drift slower than the day,
  thicker is brighter, shadow offset .012 from the star; they take the star's tint at 8% (white stayed pink under the
  orange giant at 25%). Holding lights: `drawPlanetLights` (2D dots) became `planetLightsOn` (a count); the shader
  scatters 6 sites per light over the sphere, cores plus a grainy sprawl, on land, over the half away from the star
  (the star sits behind the viewer, true night is a thin crescent). Pairs `g3b_760.png` (terran far/close, gas giant,
  terran with 24 lights), scene script `g3b.sh`.
- G3b 2/n done. The straight step across the nebula (a radial line from the star past a planet) was the shadow
  wedge's rays switched on by `select(dq>R)`, there since 8e77d8c (L1 5/n); the wedge now starts, ends and edges on
  slopes only, penumbra >= ~40 px at 760 (max jump over 4 px across the old line 11 -> 5). Gas giant (`gasUV`):
  bands drift at their own speeds (a sine of latitude), a curl of 3D noise shears them strongly along and barely
  across (across as strong as along turned the bands into a mottled sky); 2-3 storms spread in longitude (with one
  a whole side went empty), an oval twice as wide as tall, a swirl that dies outward, the core lifting a neighbour
  band's colour; storms are placed on the clean coordinates and the curl calms inside them (the curl moved
  longitude by more than a storm is wide and shredded it into threads). Relief: the fine layer scales with the
  ridge mask and height, lowlands smooth. Lights: white-yellow cores by a street grain plus a warm halo nine times
  wider. Pairs `g3b2_760.png` (7 rows: terran far/close, gas r200, terran 24 lights, r110 with 3 and 24, gas r700),
  `step_ab.png` (the step, before | after).
- Brief of **G3b 3/n — N lights read as N cities**: on land, in the belt .35–.85 R from the disc centre, on the side
  away from the star, not at the limb; core >= 2 px at 760, a warm halo ~3x wider, core +60 over the day surface.
  Done (`17ga`, `gplCities`): the sites are placed on the CPU and handed to the shader (`pb[16..63]`, up to 48, x,y
  in disc radii and a weight). Each city is a body point riding the surface at its speed through a window of
  `GPL_CITY_D` = .8 rad of longitude on a hashed latitude; it fades in and out at the window's ends and the next
  one lights on a new latitude, so the count holds while the planet turns. A latitude is taken only if the whole
  window lies inside the belt (a shorter run faded the city out halfway — 3 lights showed 2) and the point is land
  on a 256x128 mask of the strip. Shader: core `exp(-d²/6)`, halo `exp(-d²/54)`, dimmed under clouds ×.6, none on
  water. Measured at 760: 3 lights → 3 sites, 24 → 24; a core lifts +190 over the surface, 3–4 px above half.
  Pair `g3m_sheet.png` (r110 «3 | 24», r380 «3 | 24»), crop `g3m_crop.png`; scripts `g3l.sh`, `litmeas.py`.
- **G4 in progress.** Done: the trail (`16ga-gpu-trail`: one triangle ribbon per nozzle lane with shared node
  normals, per-point age, gaussian core+halo; beads between segments gone). Pair `g4a_crop.png`, js in
  `trail.js` (a synthetic TRAIL, no thrust). The exhaust (same module, `gpuExhaust`: gaussian flame, flowing noise, shock diamonds, tone-mapped nozzle; the
  drawn heat arcs dropped; pair `g4b_crop.png`, thrust forced by wrapping `drawExhaust` in the js). `exhaustHaze` still
  grabs the 2D layer — removed, G4b in PLAN. Done since: the edge wall as a GPU membrane (`drawEdgeWall`,
  17-mode-system; pair `g4c.png`), the trail widening to its tail, and the hull lit from the star (`gpuHullLight`,
  16ga): after the ship's 2D draw, `gpuOver` + an IMMEDIATE `copyTextureToTexture` of a 512² patch of
  `GPU.T.front` (now COPY_SRC) into `GPU.T.hm`. The pass runs only at submit, after gpuWorld re-uploaded #c
  without the hull, so sampling `T.front` directly sees nothing. Mask alpha → edge normal → rim in star colour,
  far half darkened; pair `g4d_crop.png`. Reworked after review («reads as an outline sticker»): the mask is read
  as relief — a narrow-step gradient for the edge, a wide one (3 and 7 px) for the slope of the side; Lambert from a
  star lying almost in the plane (z .22); the rim is cos³ and only where the relief is steep, the side warms
  by its wide normal, and the shadow is a gradient across the whole hull (up to .82) deepened on the far slope;
  pair `g4e_crop.png`. Scene js (`freeze.js`, `trail.js`) also `CHIP_POS.clear()` — stale
  chip smoothing after a teleport looked like overlapping chips. The wake is `gpuWake` (16ga) on the same ribbon
  as the trail (`gtrLane`/`gtrDraw`, vertex = 3 vec4: core alpha, core share, halo alpha, world place, tatter
  weight); its halo tears into world-fixed wisps that drift slowly; the 2D bucketed `drawWake` is gone. Pair
  `g4f_crop.png`, scene `wake.js` (synthetic WAKE, two lanes). Combat energy is `gpuCombatEnergy` (13z): bolts
  (`G.shots`) and beam traces (`G.beams`) as one instanced glowing segment — white core, exponential glow in the
  colour, a hot head / impact flare, a muzzle flare for beams, tone-mapped; 2D `beamsDraw` and the shot strokes
  are gone. Pair `g4g_crop.png`, scene `combat.js` (stubs `combatShots`/`beamsTick` so nothing moves). Colour
  rework after review: tone by the max channel (hue kept), white only `pow(core,6)` on the axis, the halo in a
  saturated copy of the colour, blend `over` so the nebula does not tint the glow (orange s≈.67 h10–15, blue
  h202–222 in the body). Same segment draws missile flames and mine lights; mine zones are a soft field plus a
  thin glowing edge; missile bursts are `gpuBooms` (a field, ≤14 per frame): ragged fireball cooling white →
  yellow → cherry inside a soft shock ring. 2D `minesDraw` and the missile flame/burst strokes are gone. Pair
  `g4h_crop.png`, scene `combat2.js`. The ground battery discharge (`G.battFx`) is the same segment (2D `battDraw`
  gone); a loot box stands in a soft glow of its part colour from the GPU, its hex body and beacon dot stay 2D on
  top. Pair `g4i_crop.png`, scene `combat3.js` (loot needs `vx:0,vy:0` or it goes NaN). Wreck and «left» markers
  stay 2D: they are interface marks, not light (the wreck's flat disc → PLAN G4c). Drones are `gpuDrones` (16ga):
  the tail is one smooth ribbon over sixteen `dronePos` samples, the machine a light in the cargo colour (grey
  spark when empty), the repair lamp breathes; labels stay 2D in `drawDronesSystem`. Pair `g4j_crop.png`, scene
  `drones.js` (stubs `clockNow`). The hull light now leaves bright saturated pixels (nav lights, beacons) out of
  both light and shadow (`own`), red and green lamps = main. `freeze.js` pins `G.t=12` every frame by wrapping
  `drawSystem` — blinking lights otherwise catch different phases in the two shots. Station shuttles
  (`drawShuttleArc`, 17f; also «Сорока»'s arc): `shuttleAt(t,T)` gives place and heading, the GPU draws a fading
  wake along the same arc (twelve past samples), the nozzle flame and the breathing side light; the hull stays 2D.
  They had never been drawn at all: `sysTraffic` set `by` twice (arc end y, then the maker), fixed as `t.mk`
  (PLAN line for main). Each call draws at once under its own buffer key (`gsh<n>`, reset per frame). Pair
  `g4k_crop.png`, scene `traffic.js` (explicit arcs with literal ends and `mk` co/ra, ship at 1400,0); shuttle
  ground share .7 (Company near white, Rassvet ochre, M454). The station (`drawStation`, 17c): with the GPU on,
  `stationArt` bakes the bare body (no flat gradient, no rim stroke on the lit half) and `gpuStation` lays it as a
  field over the art texture: relief normal from the mask, cos³ rim toward the star, light as a near-white MULTIPLIER on the
  albedo (an additive film washed blue modules into pink, rejected), a shadow gradient (≤.55), lamps exempt, and
  the station's own warm gaussian glow instead of the 2D radial stops. The indust flare stack stays 2D on top.
  Pair `g4l_crop.png` (ship at -880,-1000, zoom 1.3). The station field is now `gpuLitSprite(cv,x,y,R,s,rot,lx,ly,glow)`
  (17c): any baked sprite, rotated, lit by the star. Barges (`drawBarges`, `drawMooredBarge`) use it through
  `gpuBargeBody`: `bargeArtOf` bakes the bare hull with the GPU on (no top gradient, no top-edge stroke), the live
  lights and nozzles stay 2D on top (`drawBarge(b,lit)`). Pair `g4m_crop.png`, scene `barges.js` (stubs
  `updateBarges`).
  Pirate hulls use it too (`gpuPirateBody`, 12i; pair `g4n_crop.png`, scene `pirates.js`, stubs `updateCombat`).
- G4 closed (Контроль, 24.09). Leftovers in PLAN: G4b heat haze, G4c wrecks as hulls, G4d the other ships lit.
- **G5 frozen (Контроль, 24.09: the author «прям как было»), rest in PLAN §0.** Done (1/n): `gpuSky` (19ca) — sky,
  horizon glow, scattering and the disc in one field, called from `drawSkyBase` (landing and surface);
  `drawSkyLayer` skips its glow sprite and disc when `SKY_GPU===GPU.frameNo`. The glow is MIXED into the sky
  (adding it turned pink into lavender); the disc is emissive: `dc+sky*.3`, never a per-channel `max` (that took
  the sky's blue and turned the low sun pink). TRAP: a field called inside `withScale` gets `p` and `res.zw` already
  in VIRTUAL W,H — pass world/sunSpot coords as they are, no K. Done (2/n, 3/n): light shafts in the final pass
  (08b `fsFinal`, uniforms `sh`/`shc`, U is 96 bytes): each pixel marches 28 steps toward a random point of the
  disc (soft penumbra, `sh.w` = disc radius) and takes the open share of the path weighted near the sun;
  `lightShafts` only sets `GPU.shaft` (reset in `gpuFrame`). Shafts are NOT yet shown to read: the 2D clouds are
  too thin to cut them. Pairs `g5b_crop`, `g5c_crop`, `g5d_crop` (sun behind the cloud edge and the peak), scene
  `surf.js` (pins `celSun` with ALT, `G.t`, and hides the chapter card `#smenaAct` and `say()` in both builds).
- **New gate (Контроль, 24.09): the WHOLE frame pair scaled to 760 px wide, visibly better at first glance.**
- **Next: L1 the space backdrop** (§L), then L2 HDR, L3 lights on the world, L4 particles; then G5 rest … G14.
  Done (1/n): `16gb-gpu-nebula` — the system nebula computed on the GPU instead of the 2D-baked 256² tile: three
  parallax layers of domain-warped FBM (masses with voids, filaments brightest), emission plus absorption (dust
  lanes dim AND redden what is behind — a `mul` pass with `pow(T,(.72,1,1.42))`, then an `add` pass of light),
  lit by the star from the limb (1/(1+r²), warmer toward it), the glow is scattering weighted by gas density.
  Rendered at ¼ frame into rgba16f (own pipeline, `gpuNebulaGen` before the scene pass opens; re-rendered when the
  camera moves or every 3rd frame), laid bicubic. Stars are drawn UNDER it now, motes over it. The palette is
  `gnbPalette` (own rng stream 0x4E42): orange+teal, magenta+green, violet+rose, ice+indigo (hot stars, dwarfs),
  amber mono with plum shadows (giants), bleached (hole); one system in five is INSIDE an emission nebula
  (`fill`). 17g's flat `bleed` circle is off when the nebula is up (it was the brown murk). Pairs `l1giant_760`,
  `l1normal_760` (a fill system), `l1dwarf_760`; scene `freeze.js`+`barges.js`+`delete …gnbPal`. `small.py <name>`
  makes the 760 px whole-frame pair. Done (2/n): the frame is composed large — one shaped mass (`mass` on a
  shared macro coordinate), one wide dark lane across (`band`, near layer), a calm void; the two tones go by
  REGION (`sel` with a dark seam), never per pixel; near the star the region takes the tone closer to its colour.
  Full-resolution detail at composite: ridged noise cuts the gas into filaments (`fineE`), lane edges sharpened
  (`fineT`), an ionization rim on gas edges facing the star in the gas's own hue. Shadow toning is a short step
  (`V[2].w` = palette `sw`: .1 default, .2 giant, .15 dwarf) — a wide mix of a tone with its shadow was the grey
  (dirt 9% → ≤1%). Giant: amber light, plum shadows (median 309–318°). Dwarf: two ice tones (mid 198°), indigo
  shadows (240°), glow white-blue — the glow's wide part takes the gas's hue, the core keeps the star's. Hulls on
  bright gas get a dark rim (`GPU.sep` → `a[23]`, fsFinal darkens scene near front alpha, 3/7/13 css px) — the
  left barge on green gas still reads as outline, not 3×. Stars by a power law (`.09+.7·zz^2.4`), spikes only on
  the first six bright ones; motes tinted toward the star, near layer streaks in flight. Pairs `l2normal_760`,
  `l2giant_760`, `l2dwarf_760`, `l2g4m_760` (real kind, no palette reset). Measures: `tone.py`, `hull.py`,
  `dirtmap.py` in the scratchpad. Done (3/n): the dark rim is for hulls only — `drawHull` registers up to 8
  circles (`GPU.sepH`, CSS px from `ctx.getTransform()`) into the post uniform `hl`; `sil()` (08b) runs in the
  final pass AND in `fsComp` (hulls usually reach the scene through a `gpuOver` segment before the final pass,
  there the gas behind is read from the nebula texture bound in the scene slot, `gpuCompNeb`). On bright gas a
  hull turns silhouette (×.14, lights kept, edge rimmed with the gas colour), 12-direction soft rim; UI labels
  get nothing. The star is the source again: a white-hot core (`2.6·exp(−(r/.4Rd)²)`) and whiter, stronger
  spikes in 17g, a tighter corona, the nebula's glow core cut to .2, and a stellar-wind bubble in the gas
  (`bub`, ×.28 at the limb → 1 at .5 H): core 255, ring 150–250 px median 142. The near-star region takes the
  tone closer to the star's colour (bias .3), and its glow goes to warm white — orange over teal was grey. The
  normal pair's green is emerald-teal (36,196,176; field 160–177°). Pairs `l3*_760`; `star.py <name> x y`.
  Done (4/n), shafts in space: planets cut the star's light in the nebula composite (`GNB_EMI`) — analytic, from
  up to seven planet circles (`V[4..10]`, CSS px, filled in `gpuNebulaGen(…,Z)`): behind a planet (away from the
  star) a wedge ×.2 with a penumbra widening with distance, fading after ~16 radii; light along the wedge edges
  ×1.3 («rays between shadows»). The medium it cuts: a warm star-lit dust fog over the whole system, in voids too
  (`fog`, L ~10–15, none inside the corona ring, none on gas bodies — orange fog on teal gas was grey). Pairs
  `l4shadow_760` (wedge across lit gas: planet 0, ship at 1.1×) and `l4fog_760` (planet 1, ship at 1.3×: two
  wedges through the fog). Gates kept: star ring 146, normal dirt 3.0%. The planet's phase is L3.
  Done (6/n), the landmark per system: `lmk()` in `GNB_GEN`, one huge thing on the backdrop, parallax .006 so it
  stays on screen across the whole system; kind, place, size, turn from its own rng stream (`gnbLandmark`,
  0x4C4D, cached on `sys.gnbPal.lm`; world gen untouched). 0 — supernova remnant: torn ring of filaments, cold
  shock front outside, warm threads inside; 1 — comet across half the sky: straight ion tail, curved dust tail;
  2 — far spiral galaxy at an angle: gold bulge, saturated blue arms, pink knots, dust lanes (no diffuse
  inter-arm light — it read as grey haze); 3 — only at a hole: two wound, knotted jets with lobes. It sits
  behind all gas layers (added after the loop through their `T`; WGSL gotcha: `pow(x,2.)` of a negative is NaN
  on D3D — use `sq`) and opens a window: gas thresholds rise around it (erosion, not dimming — dimmed gas is
  grey), dust thins; near the star it fades to .3 (glare). The small planet's wedge now lightens with distance
  (×.2 at the planet, ×.6 four diameters out). Pairs `lm0..lm3_760` (forced kind, centred), natural
  `nnormal/ngiant/ndwarf`. Gates: star ring 145; dirt V40+ 2.8% (V30+ 7.1%: the window's void is V 30–35,
  near black); giant 1.9%, dwarf 1.2%.
  Done (6/n returns, Контроль): **the backdrop law — nothing on the backdrop looks like a game object (beam,
  shot, exhaust, ship): soft edges, dimmer than the game layer.** The comet's frame turns so the tails point
  away from the star (`lfr`, shared by GEN and EMI in `GNB_NOISE`): straight blue ion tail, gold dust tail
  bending off in a V (`lcy`, bend side from the seed), small dim head, both tails gather light away from it.
  The jets left GEN: the hole's lens (17g) laid the old 2D tile over the volume, hiding the gas and the jets
  alike; now the lens samples `GNB.view` (screen frame, fades where the source leaves the screen, chroma
  restored — four taps across copper and blue averaged grey), and `jets()` in 17g draws from the hole's poles,
  perpendicular to its disk (−.25+π/2), both ways, wide and soft, knots near the core, lobes, the counterjet
  dimmer, before the shadow. The hole palette is copper + cold violet (the grey «faded» one was dirt). The
  window's fog goes to black (`lwin`, EMI reads the landmark from `V[11..13]`). The rest of the dirt was
  complementary mixing: the star's halo in 17g (its own colour out to 7 R) over teal gas — at .2 while the
  volume is live (`S[31]`); the glow tint takes one side of the seam; the galaxy's inner arms gold, not white;
  its lanes dim its own light. Gates (V30+, S<.25, HUD included; main ≈1.7%): nnormal 1.6%, giant 1.7%,
  dwarf 1.2%, lm0 1.9, lm1 2.3, lm2 1.6, lm3 2.7, natural hole 1.5; ring g4m 133.
  Done (L2 1/n): **light above one.** The scene and the comp target are rgba16f. `fsFinal` builds the frame
  before the shoulder — scene as it shines, the front over it, the glow ADDED (as 2D did: bright gas goes gold
  with it) — then one shoulder `tone()` per channel above .75 (smooth to white, no plateau; the hue-preserving
  variant made the frame beige and the star disc a pink blin). Glow = a mip ladder of six levels (`gpuBloom`:
  4×4 box → dual-Kawase down → tent up, added, far levels ×.72 and warmer): level 0 = the toned frame squared
  (the L1 glow) + what the scene shines above 1.4 (`frameHdr`); every level down from the second knees at
  .45×(lv−1), so gas glows only near itself and only the star reaches the wide levels (no veil). HDR sources:
  the star's hot centre (17g, +4× a gaussian of .2 Rd over the tone), beam and bolt cores and the burst's heart
  (13z, the excess over the tone kept). 2D lights: the comp pass writes a second target `tEmit` (binding 8) —
  the part of a glued 2D pixel near one AND coloured (chroma gate; white paint and text are not fire) ×150 —
  so nav lights keep their colour and get a halo of it; the last front layer (chips, marks) casts no glow, and
  the glow is ×(1−.6 a) over opaque front pixels. Gates: 255-px ≤ .12% (star core only), median L +3…+6% vs
  L1, dirt ≤ 1.6, ring g4m 146 (p95 215), HUD diff = state only (energy count, blinking chip arrow).
  Done (L2 1/n return, Контроль: «a glass ball, not a star»): the photosphere had a hard edge that cut the
  bright gas out (the disc darker than the ring past it — an eclipse), a flat white fill and a white core of
  77 px. Now (17g `star`): the surface is below the shoulder (exposure 1.4/1.0 giant), lifted a third toward
  warm yellow, darkening to the limb in the star's colour (blue goes first, red last; limb .55, not .25); the
  edge is soft over the last 8% of the radius; the photosphere covers the gas at .6, not 1; the corona over
  the disc ×(1−.5 μ); a thin warm corona right past the limb (.35); granulation contrast .7 (+.2 giant); the
  white core is small (1.6× a gaussian of .16 Rd plus the HDR spot of .11 Rd). Crop 700 px around the l2c
  star: near-white radius 36 px (main 31), L≥200 3.4% of the frame (main 1.3%: our gold gas counts too);
  g4m core 255, ring median 135 (main 137).
  Done (L2 2/n): a light grade per star class and lens optics for a star in frame (08b `fsFinal`, fed by
  `GPU.lens` from 17g `gsyStar`; uniforms `ln`, `lc`, buffer 256 B). Grade after the tone: highlights ×
  the star colour normalised by luma (9%), shadows toward cold (warm stars) or violet (t ≥ 1.6) at 10%, so
  only the hue moves — median L within ±.3%, S −3…+2%, dirt unchanged vs 79dd76a. The hole has none.
  Optics only while the disc is in frame (fades over r+60 px from the edge): a thin horizontal streak cooler
  than the star, and three soft hexagons (aperture blades, not circles — circles in combat mean targets and
  bursts) on the star→centre axis at .62/1.38/1.9 with a per-channel size shift; brightest in the middle, no
  rim. The backdrop law in numbers: all optics together add at most .058 of the scale (`min(o,.058)`), and
  30% less over the front layer. Gate script: scratchpad `l2gate2.py` (base b2_* = 79dd76a).
  Polish with L3 1/n: the grade's shadow keys follow the plan — red dwarf deep violet, yellow teal, blue
  indigo — and skip the front layer (the interface takes no grade). The core's veil: in HDR, before the tone,
  `h=max(h, white·2.5·gauss(core))` — a small object right over the core drowns in its light as in a camera
  (a dark wedge there read as a pupil); `max`, not a sum, so the open star is unchanged. Spots stay out of the
  core: inside ~.35 of the radius granules only brighten.
  Done (L3 1/n, light touches the world): one light list per frame (08b `gpuLight`, ≤16 strongest, a beam is
  a segment, a burst/bolt/flame a point) and star occluders (`GPU.oc`, the station), written at the end of the
  frame into a 16×3 rgba16f texture (`gpuLtWrite`) that both hull passes read: 17c `gpuLitSprite` (station,
  barges, pirates) and 16ga `gpuHullLight` (own hull). `plAt`: Lambert on the relief normal, lights at .3 of
  the hull radius above the plane, 1/(1+d²/r²); the hull shades itself — six steps along its own mask toward
  the source (`plOcc`, each pass maps its mask), so the far side stays dark. Metal (grey) takes a hard glint
  stroke toward the star (pow 40 on the edge normal); glass (bluish, mid) reflects the star through its own
  dome normal from the gradient of glassiness (two steps each way, so frames inside the canopy do not break it
  into sparks); windows and lamps ×2.3 — above the knee, the bloom takes them. `shAt`: a hull behind the
  station along the ray to the star is at .4 (soft edge). Sources: beams (26·zk+10, a·1.8), battery, bolts
  (.4), bursts (r·2.2+24, 3.6a+.6), own flame (R·6, thr·1.4). `GPU.plOff` switches L3 off for pairs.
  Close-up scenes (scratchpad `l3run.sh`, a camera: `shipScaleAt` 4.5 in the shot only, hull ≈150 px at 760):
  l3h — beam and burst below: lit side +31%, far side +7%; l3f — flame only: stern half +17%, bow +2%;
  l3s — barge behind the station −57%, the lit one −1%. Field L within ±.7%, dirt ≤1.7%, HUD diffs = state.
  Done (L3 2/n): allies' 2D hulls (12a, drawHull) go through `gpuHullLight(…,id)` into the same light as
  the own hull (star, beams, bursts); the station's lamps are a warm point light (`R·.9`, .7) — a moored
  barge warms on the station side. Burst flash (13z): `fk=fl²`, `fl` a linear ramp over the burst's first 6 ticks
  (~100 ms, `f.t` counts down from 18) — the light is whiter, +40 px wider and +30 stronger, then the warm
  smoulder; at the peak (l3h, BT=17.5) the near side's per-pixel median +91%, mean +80%, the far side +18%.
  The landmark back out of the centre (L1 return): its place is in half-frame units per axis
  (`Lc=(W,H)·(.5+h.xy·.5)`), and the same two stream numbers map into the corner quarter .66–.95 — the
  centre stays farther than .33 of the diagonal, only the edge enters the middle third; it frames play, not
  lies under it. A hole's jets stay at the star. Field gate vs 79dd76a: L median +14…20% — the landmark's
  window (gas recedes around it) left the middle; S +2…7%, dirt unchanged.
  Done (L3 3/n, the frame's edges): the dark halo is gone. L1's `sil` darkened the gas up to 8 px around
  every hull on bright gas (12 directions × 3 radii) and read as dirt: nebula behind a ship does not take
  its shadow. Now it is a rim light instead (08b `rimN`, `sil`): the normal from the hull's alpha gradient
  (2 px), gas sampled 6 px outward along it (fsComp: the ¼-res nebula; fsFinal: the scene), added on the hull
  × (1-n.z)³ × 1.4, only over bright gas; the hull's own darkening against bright gas stays. Scout on
  nnormal: ring 3–8 px 40.5 vs the bare gas at the same pixels 37.3 (+9%, no dark ring; the gas there is
  darker than at 20–30 px on its own, 59 — the stub row shows it); rim hue 171° = gas 171°.
  The comet is a chord along the frame's edge: the tail points away from the star (in half-frame units),
  the head half a tail back from the edge's middle, the side by the stream — it was in the corner with its
  tail out of the frame. The landmark's own strength (not the gas window) falls toward the centre:
  ×.35 → ×1 over .2–.45, measured by the frame's ellipse (on the diagonal the same as a share of the
  diagonal; the middle of the long edge keeps .74, not .45). Corners by a lattice of the system's place,
  `(sx+2·sy)&3`: neighbours always differ, any four in a row give all four (12 systems: 3/4/3/2); the top
  left drops below the HUD bars (y .36–.5 of a half-frame, x ≥ .74) — median L under the bars 24–29.
  Done (L1b 1/n, the comet): the edge chord read as a coloured haze under the HUD strip. Now the head
  sits in its lattice corner with the HUD offset like every landmark; the tails go inward along the corner's
  diagonal ±20° (stream grain) — not away from the star: the landmark is at infinity, its projection is free.
  In `d` units (H·s; 1 px at 760 ≈ .0024): head — warm white core (gauss .0035, ×8) and coma (.014), the
  brightest point of the landmark; ion tail — a straight narrow blue ray, half-width .0018 → .01 over .7,
  fading from .35 to .8; dust tail — a wide curved warm fan (`lcy` bend ±.36, ~20° off the ion), softer,
  exp(−x/.35). The centre fade dims both toward the middle third. lm1: core p99.9 200 vs the tail's first
  third median 76 (2.6×), tail +84% over the gas beside it (±18 px). Scratchpad `cometmeas.py`.
  Done (L1b 3/n, dust; 2/n `6a05969` was not accepted — flat ragged islands along one direction, uniform
  burnt-paper erosion): dust is the wall of the H II cavity around the star (Pillars / Carina). Everything is
  built in polar coordinates around the star's screen position (16gb gen pass, `dpolar`): the angle from the
  «star → frame centre» direction (the ±π seam lies behind the star; `nzs` blends two turns there) and ln r.
  To keep the dust on its own depth, JS accumulates offsets per frame (`GNB.dth`, `dlr`, `dl0`, `dl1` →
  `u.g`): near the frame centre the pattern moves with parallax .12 while every direction still points at the
  real star (a star closer than .3H to the centre — the pattern goes with it). The frame's radial span
  (nearest frame point, ≥ .25H, → farthest corner) lives in the same shifted ln r, else a radial flight left
  the wall standing on screen. Shape: a wall at the far side of the frame (the mother cloud, s ≈ .8 with a
  lumpy edge); pillars grow out of it toward the star — capsules (`caps`) in cells of angle × ln r
  (`pillars`, three scales: 18 / 40 / 70 per turn): round head facing the star, trunk down to the wall and
  wider at its base; width in H, not in angle, so a pillar near the star does not become a needle. A head
  deeper than allowed retracts into the wall (thinning it gave hairlines). Globules — ahead of the big heads,
  tail away from the star; never near the star (the angle collapses there and a globule smeared into a ring).
  Edge: the field is a distance in H, the edge in pixels (as before); toward the star — sharp, eroded (noise
  in the dust's .12 layer), with the ionisation front (line + glow, now also for an off-screen star); sides
  sharp; the back (edge facing away) melts into the gas over 16 px. Inside: brown with veins and relief
  (bumps lighter on the slope toward the star); dense dust also hides the fog behind it. The grade's shadow key
  still tints bodies (giant: violet), as Контроль asked. nnormal: 3–4 thick pillars from the right wall at the
  star beyond the left edge; l2c: pillars from the right and bottom converge on the star, golden fronts kept.
  Field (L median / black < 12): nnormal 17.6 / 38%, lm1 19.0 / 35%, l2c 27.7 / 21%, ndwarf 9.7 / 76% (main
  13.8 / 20%; the dwarf frame is dark on both). Parallax (ship x 480 → 560): pillars slide ~10 px, shapes kept.
  Comet fix with it: the tail's axis turns 30±5° off the centre toward the vertical edge (a line into the
  centre hit our own ship and read as a targeting beam); the ion tail is softer (gauss 2→10 px, faint streamers
  across) and bluer — it adds hue 216°, S .53; off-axis 30.4°, core 2.35× the tail, tail +87% over the gas.
  Done (L4 1/n, particles). Refraction: the final pass (08b `distort`) shifts the scene by a list of sources
  in the post uniforms (`GPU.dz`, ≤ 8, `gpuHaze` / `gpuShock`; U grew to 528 bytes) — the heat haze is a
  noise offset ≤ .8 px inside the flame cone, carried downstream; the shock wave is a ring (derivative of a
  gaussian in r), the three channels shifted ×1.08 / 1 / .92 for a thin lens fringe. The missile burst lost
  its drawn ring for the same refraction. Exhaust (16ga `GEX_WGSL`, now `over`): the plume's coordinates are
  advected by two octaves of curl noise (sideways more than along, growing to the tail), the width grows
  .5R → 1.55R; the temperature falls along and across and runs a ladder white-blue → yellow → orange → dark
  red (a cosmetic palette leads the same ladder with its own stops); HDR `.12 + 2.6·T³` plus the nozzle core
  1.5 — the glow is the L2 mip ladder, no own halo; past .5L the cooled gas turns to smoke (α ≤ .3, lit by the
  star from one side). Length 7.5–11 R by thrust. Ship burst (13z `burstFx` / `gpuBursts`): a picture only —
  `BFX` outside `G` and the save, spawned in `killPirate`, seeded by its own counter (golden ratio), aged by
  `G.t`; one field, bottom up: smoke (lit by the star, α ≤ .45, warmed from inside while the ball burns),
  seven shards (cut boxes, tumbling normal lit by the star and the flash, cooling edges), the fireball
  (billows in growing coordinates, the same ladder, heat `exp(−a/.42)`, gone by 1.1 s), 22 spark streaks
  (a 1/30 s path each, HDR). Flash — `gpuLight` (white ~.1 s, then warm), shock — `gpuShock` over ~1.1 s.
  Drawn before `genDraw`, so bolts and beams stay on top and sharper.
  Done (G2, the star alive; `17g` `star()`). Granulation boils: the cells are bent by a slow warp (t·.004),
  the pattern turns over in ~2 s. The corona flows out in jets: noise stretched along the ray and sliding
  outward, two cycles half a period apart with a triangular weight (600 frames), so the coordinate never
  runs off and the jets never pinch to the centre; long faint streamers fade with exp(−x·.4), no end. Five
  prominences per star (angle, width, height hashed from `ph` = phase + seed): arches over the limb that
  breathe (±20%, ~5 s), gaussian across, their feet fade along the arc, filaments drift; thin wire loops read
  as neon, so they are thick (.08 Rd), loose and dim (×.4) — plasma melting into the glow. A flare every
  ~12 s at a new place on the limb: rises in ~9 frames, e-folds in ~1.7 s, three gaussians wide. Shots:
  l2c at the flare's peak and +120 frames (`g2shot.sh` computes the peak from the phase).
  Done (L1b 7/n, the author circled four seams on 446a576's nnormal: «резко цвет меняется, и края мне
  кажется можно поблюрить, и цвет не такой яркий»). The glow tone `gc` (rim, the star's scattered light,
  the cavity) was a hard pick of the seam's side: it drew the magenta arc around the star and the violet
  wedge with straight sides by the barge; now it is the same saturation-kept mix as the gas. Tone ramp
  .27–.73, seam .13 wide. Dust opacity is the edge ramp itself (od = −ln(1 − body·(.8….985))/2.4): the
  exponential of a ramp had saturated in its first third; body ramps over 135 CSS px on the back, 115
  elsewhere, 10–90% ≈ 41 px at 760. The rim glows 15–30 px at 760. The near layer's dark band and ridges
  lost their thresholds; full-res edge sharpening .7 → .2. Colour: EMI keeps .66 of its saturation and
  squeezes only the bright (×.72 above cy .6) — a flat ×.85 had pushed the dim field under black. Stars
  over gas, under dust: with a nebula the scene clears to black, ABS lifts what is behind the gas by
  1 + 2.6·(gas brightness + fog), EMI adds the space colour back dimmed by the dust. nnormal: S mean .52 →
  .40, gas L p95 139 → 87, hue slope p95 4.7 → 2.4°/px; black 20 / 20 / 1% (l4a, nnormal, l2c). Stars at
  l4a with gas and no dust 276 (main 242).
  Done (L1b 6/n, trunks and a soft nebula; the author on the nnormal angle: «слишком резкие переходы,
  выглядит как лужа а не как туманность»; Контроль cancelled the sharp star-side edge). A pillar is one
  tapering trunk per angular cell (14 a turn, share .5): length ≤ half the wall-to-star way and ≤ .72 H, base
  half-width L/5 narrowing to .55 of it, a round head 1.25× the neck, ±22% swellings, a bend by the cell's
  hash; the wall's lumps reach the pillar at a third (full lumps ate the heads into spikes). Wall .87 → .76
  of the radial span. Soft everywhere: body ramps over 60 CSS px on the back, 34 at the sides, 27 facing the
  star; density rises over 26 px and is uneven by `dn`; the back edge tears into mid-scale wisps; the near gas
  layer sits 30% in front of a body at its edge and none over the core. The rim is a glow 8–20 px (two
  exponentials), no inner line. Tone zones: the selector gets a finer warp (±.08) and a .38–.62 ramp, the mix
  keeps the ends' saturation (two complements no longer grey out), the seam dims the gas by .45, not .9. The
  bark: grey-brown with 30% of the gas tone, gone 6.5 px inside. The cavity glows: ionised gas from 40% to
  92% of the wall radius, patchy, in the gas tone with 30% of the star's white, so pillars stand as
  silhouettes on light (the brown inside a body is dimmer near a bright star — at l2c it matched the gas).
  Stars in 2D sizes (1 / 1.4 / 2.1 px) and a flatter law (floor .2). Field (L median / black): l4a ×2.00
  14.1 / 20%, nnormal ×1.60 16.9 / 19%, l2c ×1.10 73.7 / 1%. Stars at l4a: bare field 260 (main 242), with
  gas and no dust 226 — the gas veils the faintest; a higher floor (.27, .36) did not move it (±5 twinkle).
  Left: l2c's pillars are dark fingers on glow, smaller than e0e933f's black masses.
  Done (L1b 5/n, the black frame at ×2; Контроль on 7658f17: 88% black, no star field, duller than main).
  Masks (debug output of solid dust / body / gas) showed solid dust on 75% of the field at ×2 and ×1.6 — the
  pillars, not the wall, carry it, and one hashed pillar more or less moves it by 20%. Now: the big pillars'
  share .6 → .41, the mid ones .3 → .26, base 2.2 → 1.9 head widths, the wall .8 → .975 of the frame's radial
  span. Two densities: gas behind a body is closed by its silhouette (as before), the stars go by thickness
  (`odT`, rising only 8–70 px deep: a pillar lets them through at about half, the wall is solid). A faint
  warm-grey reflected starlight (`refl`) on the star side of a body where there is no gas, fading into its
  depth — a body reads by its shape, not as a hole. The near layer's wide dust band was narrow in name only
  (fb sits near .5, the band lay over half the frame): now |bv−.5| < .015….05, and off the gas it absorbs at
  .3. The system fog's floor .045 → .1. Field (L median / black < 12): l4a ×2.00 16.1 / 13% (was 8.2 / 88%),
  nnormal ×1.60 31.6 / 3% (was 10.6 / 61%), l2c ×1.10 50.1 / 0.6% (was 24.2 / 22%); main 19.5, 19.6, 43.6.
  Solid dust 24 / 27 / 31%. Left: the gpu star field itself is sparser than main's (l4a with no absorption
  171 stars vs 242) — not the dust's doing.
  Done (L1b 4/n, dust at other zooms; Контроль on the L4 frames at ×2.00: orange curls and worms over the
  right half — rims with no visible body, the bodies black on black space, not facing the star). Cause: gas
  lives in screen space (no zoom), the dust in log-polar around the star, so its cells grew with the star's
  distance — at ×2 the frame held only bits of edges. Now past .9H (star to frame centre, `lc`) the pattern is
  squeezed by k = D/.9H around the frame centre (`dpolar` → `DQ.k`, `dR` maps back to a radius, `nzs` wraps at
  2πk): a pillar has the same size in px at any zoom and still points at the star. JS keeps the pattern's
  coordinate at the frame centre (`GNB.Qc`, `Yc`, advanced by k·(1−wD)·Δ), so a zoom or a flight away changes
  the scale about the centre instead of sliding the pattern. The rim (ionisation front) and the brown are
  scaled by the gas density at the pixel (`gas` = smoothstep(.02, .3, dsum)): no gas — no rim; on empty space
  dust only dims stars. Field (L median / black < 12): l4a ×2.00 8.2 / 88%, nnormal 10.6 / 61% (was 17.6 /
  38%), l2c 24.2 / 22%. What is left at ×2.00: gas clumps in the windows between bodies, one rim where gas
  meets an edge. Parallax (x 480 → 560): the pattern slides, shapes kept.
  A GPU draw after `gpuHullLight` must use `gpuOver`, not `gpuScene` (the scene pass is closed by then).
- Merge each: `build.ps1`, `python docs/shot.py <scenes> --look --tag gpu`, 0 `gpu.errs`, pair with
  `scratchpad/mainref/docs/shots/main_<scene>.png`, one line of what got better, commit, strike from PLAN §0.
- Next after G2+G3 merges: G4 (system view on top, shares `17-mode-system.js`), port 9481; then G14.
- Seen on the system pair, not yet owned: the tape strip under the dials is blank on gpu (grey paper on main)
  — G12 (cockpit and tape) checks it.
- Traps: mixed line endings (match HEAD per file, check bytes with Python); `gpuScene()` is null outside a
  frame; a presented canvas is unreadable after its task (snapshot in `gpuPresent`); launchers with
  `--disable-gpu` shoot the «no WebGPU» stub (G13).

## 1. What changed and what did not

- **The world is still math.** Seeds, noise, the galaxy, orbits, economy, `stateHash` — all in JS, unchanged.
  Only the *painting* moved: a shader is a formula per pixel, so the math simply got closer to the screen.
- **WebGPU only.** No 2D fallback, no switch. Without WebGPU the player sees a plain message naming the
  browsers that can play (`gpuNone`, 08b). caniuse (23.09): WebGPU 87 %, WebGL2 96 % — the gap is iOS < 26,
  Firefox on Android/Linux, old Android.
- **Canvas 2D stays as the brush** for what the GPU does not do well: text, and complex vector shapes
  (hulls, props, people, rooms). It paints either live onto `#c` (a transparent layer the GPU composites)
  or once into a canvas that becomes a texture (`gpuImage`) — the hull bake already works that way.
- **Better, not the same.** Every ported layer should look better within the art direction
  (`docs/DECISIONS.md`: one light, rich palette, motion not twinkle, the frame's laws): per-pixel light from the
  real sun direction, soft particles and depth of field on near layers, analytic anti-aliasing, live fields where
  a bake used to freeze them, no banding (the final pass dithers every mode). Parity is the floor, not the goal.

## 2. The frame

```
gpuFrame()        #c cleared (the 2D layer), command encoder opened; false = no device → nothing is drawn
  gpuScene()      layers UNDER everything 2D: backdrops, sky, fields (gpuScene3D: the same with depth)
  …2D on ctx…     text and vector shapes land on #c
  gpuOver()       a layer ABOVE what 2D has drawn so far (each call: upload #c, composite, submit)
  …2D on ctx…     lands above that layer
gpuWorld(k,…)     #c uploaded; bloom at a quarter of the frame (4×4 box, gaussian in rgba16f)
  …UI on ctx…     the rack (25d) draws onto the UI layer — no bloom, no grain
gpuPresent()      one pass: frame + bloom, grain (overlay 7.5 %), vignette, hit chromatics, UI, blue-noise dither
```

`drawWorld()` called outside the loop (tests, stands, `look`) builds its own frame (`gpuManual`) and snapshots
it in the same task; `gpuSnapshot()` returns the composed frame as a 2D canvas (a presented WebGPU canvas
cannot be read after its task ends). `#c` is invisible (`opacity:0`) and still takes the finger; the GPU canvas
`#g` has `pointer-events:none`.

## 3. Layer order — the one rule

A GPU layer is either **under** all 2D of the frame (`gpuScene`) or **above** the 2D drawn so far (`gpuOver`).
So port a mode **from the back**: sky and backdrops first (under), then whatever sits between 2D shapes moves
together with its neighbours (a sprite via `gpuImage`), and full-frame effects on top (night, fog, light, near
particles) go through `gpuOver`. Each `gpuOver` costs one upload and one full-screen composite — two or three
per frame at most; consecutive GPU layers share the pass one call returns.

## 4. The kit (08b core, 08c kit) — coordinates in CSS pixels, colour in, premultiplied out

| call | what |
|---|---|
| `gpuScene()` / `gpuScene3D()` / `gpuOver()` | the pass to draw into; `null` outside a frame — the layer then does nothing |
| `gpuImage(pass, canvas, [{x,y,w,h,a,rot,u0,v0,u1,v1,cubic}], {blend})` | pictures and sprites; `x,y` is the centre; the canvas is uploaded once per canvas object |
| `gpuShapes(pass, [[kind,x0,y0,x1,y1,hw,soft,r,g,b,a]], {blend})` | 0 rect, 1 disc (x0,y0,r=x1), 2 capsule (hw), 3 ring; colour 0–255, a 0–1; `soft` = a soft edge that wide |
| `gpuField(pass, name, wgsl, Float32Array(≤60), [tex…], {blend})` | a full-screen field: `wgsl` defines `fn field(p:vec2f, uv:vec2f)->vec4f` (premultiplied), reads `fu.v[0..14]`, `t0..t3` via `smp` |
| `gpuPipe / gpuBuf / gpuBind / gpuCanvasTex` | your own pipelines (`layout:"auto"`, target `rgba8unorm`); `GPU_WGSL_COMMON` has `pmod`, `covRect`, `covDisc`, `covSeg`, `texCubic` |
| `GPU_BLEND` | `over` (source-over), `add` (lighter), `mul` (multiply on an opaque backdrop) |

The space layer (`16g-gpu-space`) is the worked example: instanced stars with the 2D table and `starMove`,
the dust layers from `dustTable`, the nebula composite as a texture.

## 5. Porting a mode — the checklist

1. Read the mode's draw order (`drawWorld` → the mode's draw). Mark each step: field, particles, shape, text.
2. Port from the back. Delete the 2D code you replaced — there is no fallback to keep. Keep the data and the
   seeded generation in JS; move only the painting.
3. **Improve** (§1) and say how in the commit. Check the logic you port — the old code may carry a bug or a
   wasted pass; fix it rather than copy it.
4. Precision: feed noise camera-relative coordinates (fp32 at large world coords ripples); `highp` for positions.
5. No per-frame allocations in JS: reuse `Float32Array`s, one draw per layer (instances), textures re-uploaded only
   when the source canvas changes (`gpuCanvasTex` keys by object — a bake that redraws in place needs a new canvas
   or an explicit re-upload).
6. New files are `NNg-gpu-<mode>.js` next to the mode; LF line endings (keep a CRLF file CRLF); scripts that edit
   files are `.py` files run by path — never heredocs.
7. Look: `build.ps1`, then `python docs/shot.py <scenes> --look --tag after` (and `--tag before` on the parent
   commit); zero `gpu.errs`, no page errors, no «СБОЙ»; compare the sheets side by side. Phone:
   `--w 390 --h 844 --dpr 2.625`.

## 6. Tests and tools

- Headless Chrome has WebGPU on this laptop by default (file:// is a secure context); tools must not pass
  `--disable-gpu`. GPU-less CI: `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader`.
- The Node tier draws nothing (`GPU.ok` is false there) — it checks logic only. Browser suites that read pixels
  read `gpuSnapshot()`; goldens are re-accepted after each ported mode (`test.ps1 -Accept`).
- One way to take a frame: `docs/shot.py`. `shot.ps1`, `pageshot.ps1` and the stand server go (PLAN §0).

## 7. The old 2D draw order by mode (the porting map, from the scouts of 23.09)

Back to front. F field, P particles, S shape, T text, C cached bake, 3D mesh. Line numbers are of `fbbcd12`.

| mode | layers, back to front | where |
|---|---|---|
| title | fill; nebula 2 parallax layers (baked 192²); stars | 28-loop:552, 16-flight:75 → **16g done** |
| system | nebula, stars, dust → **16g done**; orbits + comet tails S; belt ring P (190 dots); star body S (6 kinds); bleed corona (glowSprite, lighter); planets: rings/disc/lights/works/doom/moons/labels S+T | 17-mode-system:535–684, 17c-system-draw:589–594 |
| system, top | lane, gest post, sys rail, billboard, law ring, hotel, bazaar, giant, rail arrive, edge wall, peace fleet, station S; trail P; exhaust P; exhaust haze; combat P; helm marks; wrecks/finds/relay/barges/rope/traffic/lane ships/Cheburek/wanderer/fleet/drones; allies; pirate base; player hull + guns; sys HUD T | 17-mode-system:685–772, 16a-space:704, 13-pirates:706, 12a-crew:723, 24a-mode-raid:724 |
| landing | sky base F; stars (airless); sky bands F; zenith fade; ground far .26 / mid .4 S; haze band F; weather far P; ground main S; POI; deco; rocks; dust motes P; pad lights (lighter); lander shadow; lander; landing dust P; weather near P; shafts; grade | 19c-light:191–296, 19-mode-landing:171–409, 19-mode-landing-ground:11/294, 19d-weather:104, 20a-poi:173, 21b-surface-deco:166, 19f-lander:52 |
| surface | sky base; stars; sky bands; far tiles A .22 / B .35 C; haze; weather far; ground; sky shadow; water; POI; deco; built; home out; settle; tin can; trace; rocks; peep; glow patches/pad; slow; pass; places; ship shadow + lander + cabin light; motes; lights reveal; cave mouth (5 layers); mine shaft + rope; plants (wind); fauna; peep ghosts; deposits; tracks; walk dust; astronaut; swim ring; mining beam; foreground grass; weather near; night overlay (rim + lamps); shafts; grade | 21e1-surface-world:109–612, 21e-surface-draw:194, 21c-built:64, 20-life:4/406, 20f-fauna:231, 21b-surface-deco:278/406, 11g/11i/11o/11p/11v, 20c-peep:88/206 |
| cave | far wall F; rock tiles C (planetMat); solid deco C; water C; props C; darkness sprite + corners; sun cone (lighter); wall marks; lamp floor glow + dust; crystals/veins/drops/lamp cone P; own light (moss) | 22-mode-cave:652–692, 22a-cave-deco:241–504, 22b-cave-props:233 |
| dig (mine) | rock pass C (geology, veins, multiply depth); vignette multiply; lamp warm glow; ore halos + shine grains (lampK); void path + scoop marks | 23a-dig-draw:54–156 |
| belt | gradient bg; 4 nebula spots; sun disc + halo; ring stripe (7 arcs); star sphere P; far rocks P; dust streaks P; rock meshes 3D (z-sorted lit faces, 12/42/162 verts) + POI | 24-mode-belt:378–543 |
| scoop | giant atmosphere 2 layers C (parallax); depth overlay; 5 wave edges S; crests P; incoming streaks P | 19a-mode-scoop:271–369 |
| raid | fill; cell floors lit; floor gloss; walls; hangar doors + emitters; ceiling lights; floor pools; contents (containers, crane, wreck); enemies (z-sorted limbs) | 24aa-raid-draw:14–500+ |
| wanderer | walls/ceiling/floor F; seams + brass rail; boards; window (planet, cold streaks); depth rings; cases + lamps + item icons C; hanging objects; counter + keeper; pollen P; vignette | 24c-mode-wanderer-draw:124–310+ |
| base | ground/sky/rocks; rock shadows; cracks; excavation; shaft + cage + light cone (live); room glows (lighter); lift; modules; walking people; staff + names | 21ac-base-draw:55–384 |
| home | shell; wall; floor; light cone (lighter); window (hour); furniture C; partitions + door lights; folk (depth sort); owner; foreground cut; lamps + final glow | 29d-home-draw:32–310 |
| winter | room raster C; window (sky, mountain, snow, glass); stove glow; lamp + cone | 29g-winter-draw:339–465 |
| spa | sky + sun halo; sea (waves, sun path, cape); foam; deck; rails; board T; table | 29i-spa-draw:46–241 |
| HQ | wall; ceiling + cables; window to space; 4 tube lamps + cones; props; consoles + lights; crew | 27f-hq-room:37–121+ |
| map | fill; galaxy band C (2 LOD); rhumb rays; galaxy stars P (~1500); arm/nebula names T; rails; address grid; jump rings; player circle; search circle; lanes; rumours (clip hatch); lore, survey, fleet, wander marks; holdings/war; systems loop (mapStarPaint, lighter) + labels; off-screen arrow; ГЛАВТРАССА prices T; routes, barges, drones; jump course; system card T; rulers, rose; footer T | 18-mode-map:122–503, 17z1-galaxy:97/156, 17z-map-backdrop:82/126, 17z2-galaxy-names:38, 18e-rail-net:181, 18a-map-addr:55–506, 18b-map-hold:80/186 |
| rail ride | fill; galaxy + stars; rail net; current line (keel + highlight); bus dash; stops + names; headlight cone; bus / train body; arrival flash (lighter); header T | 18g-rail-ride:120–172 |
| road | sky gradient; 3 breathing nebulae (lighter); 110–190 stars; hyper tunnel (46 spokes); 5 passing pilots; beat sparks; touch pulses; trail points → body (halo + core) → flare; nozzle lumens; brake fires; turn vanes; hyper cocoon; hull; **bloom field (CPU fbm, putImageData 26 Hz)**; bottom mask | 27la-road-sky:12–136, 27l-road-draw:167–383, 27lb-road-bloom:65 |
| cockpit | glass tint + glare (clip); glare sweep; frame C; 5 dials T; tape strip (putImageData); LEDs; bars T | 25-cockpit:415–460, 25a-instr:100, 25b-tape:187 |
| frame | heat haze (18d:12–79, copies strips) ; hit chromatics → **core**; bloom, grain, vignette → **core**; grade (surface/landing, 19c:258) | 18d-postfx, 19c-light |
| postcard | own canvas, 8 painters, seeded, no G | 25g-postcard:170–294, 25g-post-*, 25h-post-forms* (G14) |

`getImageData` is used only for bounds (hull ink box 03e1:113, tile span 18c:152, staple 26e2:170, road 27l:81)
and `lookFrame` (28y:49/326) — none in gameplay.
