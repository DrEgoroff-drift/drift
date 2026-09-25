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

**The flight HUD pair (15/n, branch `gpu-hud` on top of a178e76, not for release — one strong variant for the
author's verdict).** Sentence case wherever the player reads (vitals, the place name, the zoom line, the ticker
label, map/menu, the rail's buttons, the pad words, the ability hint, the chips); hierarchy by size and colour.
One warm accent — the next action (the ДЕЙСТВИЕ pad and its hint); ЦЕЛЬ, the system name, Фото, the rail and
the star chip go cold. Fuel and hull lead: a 20 px number (18 on the phone) with a small «/100», and a short
bar that warms as it empties (cold above 60 %, amber at 20 %, the alarm below); energy and hold are a quieter
row. The right edge is two 48×48 tiles, icon over word. Plates are one dark glass without a gradient and a
hairline edge (`--plate`, `--hair`). The ability hint is a caption under the pad — lifting the console by its
line was tried first and squeezed the band between the console and the rail below one chip's height. Chip
distance keeps two significant digits in motion («1,4к», «390»), exact within 400 or at rest, so a chip
re-rasters once per hundred units instead of every frame. Fixed on the way: the right-edge chip stack aligned
to the first chip's left edge and ran off the screen; chips now dodge the rail too. The code is one CSS block
at the end of `style.css` plus span-wrapped words (textContent unchanged, so the detector laws and the tests
still read «98/100», «ЦЕЛЬ»); `#msg` and `#prompt` stay in caps (their strings carry names). New guard:
«пульт: подсказка системы, ФОТО, лента и ЦЕЛЬ не налезают» in any window, its mutant red.

*Контроль's three fixes (25.09).* (1) No HUD text line closer than 12 px to the window edge plus
`env(safe-area-inset-*)`: the header moves from 8–10 px to 12 px (+ insets on all three sides), chip plates keep
a 12 px inset, and the ability hint becomes a second line inside the ДЕЙСТВИЕ pad — under the pad it sat 4.5 px
from the bottom at 2:1, because an idle pad (`.off`, opacity .38) dimmed it too. An idle pad with a ready system
is no longer dimmed or deaf: `.off` also set `pointer-events:none`, so on a phone the long press never reached
the pad and the boost in open space was keyboard-only (V); now only the word «Действие» dims. (2) Names keep
their table case: the pad, the ticker band and ЦЕЛЬ are cased in JS (`padCase`, `27y-hud-words.js`) — sentence
case, except words recognised as names of what is near (the system, its station, planets and moons, the six
powers); declension by stem, so «К ГЛАВТРАССЕ» stays caps and «ДО КОММУНЫ» reads «До Коммуны». The CSS
lowercase trick is gone. (3) One decimal comma (`decRu`): the zoom line, the misclose on the instrument pod and
in the table, the map's jump radius, the speed in the docking and landing prompts. Guard «приборы: строки не
ближе 12 px к кромке, имена как в таблицах, одна запятая» (any window; 390×844 under -Mobile): text-node line
rects of the HUD roots, the hint and chip plates against the edge, the hint's contrast ≥ 4.5:1 on the pad plate
over a light sky, the idle pad takes a touch, pad names for four systems and all powers, chip and place names,
no «1.40». Six mutants red: hint under the pad, hint dimmed, pad deaf, header at 6 px, lowercase names, zoom
with a dot. The two old -Mobile -Full reds are closed too: «телефон: стик…» was an isolation leak — `CHIP_POS`
(where each compass chip is drawn, eased towards its slot) outlived `resetWorld`, so a chip started from the
previous suite's edge (x=4) and one `drawSystem` could not move it off the stick; the harness clears it now.
«обещание: молчаливых тычков нет» caught the open ОПИСЬ tab on the phone, a tap that re-rendered the same page;
the open tab takes no pointer now (`.op-tabs button.on`) — `disabled` was tried first and the «порог» net
rightly called it a grey button without a reason.

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

*Glow (Контроль 16/n; the author on «Космос» and «Чебурек» in orange gas: «на свечение посмотри, поправить надо»).*
Cause: `emit()` turns any saturated 2D pixel near 1 into a source (knee .9 × 150); the sign drawn "lighter" becomes
~15× white, the Cheburek window with its `gw` halo ~18×, the hotel windows carry a baked halo too (17l:177); bloom's
first level is ¼ frame, so its narrowest halo is ≥ 4 px and fills the ~1.5 px gaps between letters. Glow counted twice.
- a) The rule: a narrow halo belongs to the thing — in its sprite, a fraction of a stroke wide, one rule at every
  scale. A wide one belongs to light: little goes to bloom, only a weak broad sheen. The 2D halos go (`gw` on the
  Cheburek, the baked window halo). One glow, not two.
- b) Hotel (façade, sign, windows) and Cheburek become GPU sprites baked once: albedo + a separate emission layer
  with its own explicit gain. `emit()` stays only for what is still on `#c`.
- c) Neon: a letter is a tube — pale hot core, saturated tube colour, halo narrower than the gap between letters.
  Dead letters show as dark tube glass. The sign casts warm light on the top of the façade. Reads letter by letter
  at 760 and at phone scale.
- d) Cheburek: the serving window is a lamp behind glass, gain ≤ 2 of white, a narrow warm halo. Booth and hull
  read whole; the steam at the window is lit from below.
Gate: a 760 pair on the author's scene («Космос», Cheburek, the ship, orange gas) plus phone scale; peak glow at the
sign and at the Cheburek in numbers, was | now; the Cheburek halo leaves the hull outline by ≤ ~⅓ of its length.
Then hulls (item 2) by the same «explicit emission» path.
- Brief of **16/n fixes** (Контроль on bfa9e26): the letter is carried by the tube colour, the pale core only as
  the middle third of a stroke ≥ ~2.4 px, one shared neon bake (17k0) for the hotel and the billboard; the
  billboard leaves `#c` whole (panel bake, neon title, ticker strip); hotel windows are 2700–3000 K lamps with a
  few cold ones, never flat white. Gate: S of the sign's bright pixels (V > .55) ≥ .5 and V ≥ .85 at 760 and ×1.5.
- Brief of **hulls, 15/n p.2**: the own ship leaves `#c` in flight — the body is the same 03e1 bake at bank 0, one
  per hull and scale step, lit by the star through `gpuLitSprite` with the bank as a span squash; flames, idle
  nozzles, belly, brake tongues, nav lights and the engine line are scene-pass shapes. Gate: the pair at 760 and
  ×1.5 (thrusting, bank .35) not dimmer, gpu errs 0. Pass 1b: one mipped master per hull (0 uploads in flight
  and on a zoom sweep), runline and crowns as shapes over the body — no hull left on `#c`.
- Brief of **`#c` zero** (Контроль on 85a858c: «бери сам всё, что держит ворота»): whatever still draws on `#c`
  in flight moves to the scene pass (the lane, fleet ships, finds, the gesture post), and an empty `#c` is not
  uploaded. Gate: steady flight uploads `#c` 0 times and submits once a frame; pairs not softer, not dimmer.
- Brief of **station master** (Контроль after c86a9e0: «холст 408² пересоздаётся каждые ~15 кадров. Мастер + мипы,
  как у корпусов. Что в ней живое — поверх, gpuShapes»): the station body is baked once per screen density
  (`sb` = the zoom's ceiling 2.55 × DPR, a quarter octave up) into a mipped master with no time in the key;
  what moves — lamps, the trade ring, science dishes, the yard crane, outpost barrels, module windows and
  blinkers, the house vest lamp — is recorded by `stLive` with its matrix and replayed each frame as shapes and
  small spinning masters over the body; the industrial flare and its smoke leave `#c`. Gate: steady uploads 0
  (the `#c`-zero test without the station exemption), pairs of six types at 760 ×1 and ×1.5 not softer, not
  dimmer, gpu errs 0.
- Brief of **zoom-following bakes** (Контроль: «мастер с мипами; на проезде зума выгрузок ≤ уровней; НИКАКОЙ маски
  на тексте, неоне, щите, окнах, свечениях»): the hotel and Cheburek bodies become mipped masters (plain
  trilinear, no mask); text bakes stay pixel-exact per font size but each size keeps its own canvas in a small
  LRU, so zooming back and forth re-uses them. Gate: pairs of the hotel sign and the billboard at 760 and ×1.5,
  a zoom series, no dark rings, no ripple, letter sharpness ≥ was; the gate test sweeps the zoom there and back.
- Brief of **the instrument pod 25c** (416×140 DOM canvas, ~210 canvas calls a frame): draw it only when the
  picture would differ. A signature of everything visible — needles, misclose text, tape head/length/scroll,
  pen jitter, canvas size, the tape object — decides; gate: the kept frame equals a fresh draw, redraws in
  steady flight well under one per frame, the pod unchanged on the pair.
- Brief of **item 3, the player's hull and flame colour** (Контроль on 85a858c: «выбеленный корабль игрока —
  первое, что видит автор»): the body lit as the 2D hull was (the bake as painted, a shadow slope, the star only
  as a rim), not by the station's multiplier; the flame orange again. Gate as in the plan, 2D = the merge-base
  build, the same flight (thrust, bank, Z 2.2) at ×1.5 and 760, body and flame measured in hull axes.
- Brief of **item 3, the pods** (Контроль on 5820c0d: +50 % not taken, «гондолы бело-розовые, будто горят»):
  first the order (plume, ribbon, wake off → pods back to 2D?), then the light; gate body V>.6 per area ±25 %
  of 2D, pods' bright L and S ±15 %, cold; sharpness and trim kept; flame and wake on the phone not paler.
- Brief of **item 3, the wake at the stern** (Контроль on ee46b87, his call): cool the wake beside the pods —
  the colour cold as in 2D, the core at the stern not reaching white, its peak no higher than 2D's; further
  along the length as now. Gate: pods' strip S ≥ .8× of 2D and L ≤ +15 % of 2D (760 and ×1.5), tone 190–230°,
  on the phone the lanes no shorter and no dimmer than now away from the stern.
- Brief of **the hotel's windows as live shapes** (Контроль's order: wake → windows → candidate): a flip of the
  lit set (the hour, a window changing its mind every 6 s) must not re-bake or re-upload the house. Bake it
  once per system and sign colour as two masters — every window dark, every window lit — in one atlas per
  layer; the frame lays the dark house whole and the lit windows as pieces of the lit half. Gate: uploads 0
  over a day of flips (a test, and the rebake exclusion in the zoom gate removed), the house on screen the
  same as HEAD at 20 h and 3 h on 760 and ×1.5, the 2D branch the same as the old paint.
- Brief of **combat off #c** (Контроль's order after the candidate): dirt.js on a combat stand (three pirates
  around the ship, bolts and missiles both ways, a boom, a kill with a container, lock brackets, a radar dot)
  names who paints #c; each goes into the scene pass with the fleet's method (shapes, a baked mipped master,
  the ship's own flame shader). Gate: a test on the same stand — #c 0, submits 1 per frame, uploads 0 — and
  pairs of the pirates, the missile and the boom, HEAD | now, no dimmer, no softer.
- Brief of **wrecks and the «left» off #c** (Контроль: a wreck stays after every fight, so flight after a fight
  was back to a full #c copy): the same method; gate — a stand with two wrecks, a hull trace and a marker.
- Brief of **the tour census** (Контроль: census first, then fix everything met in flight; rocks first; the
  peace fleet's caption goes to the label layer; belt mode whole is a PLAN line under stage 2): a scripted
  tour (NEYEL, Коммуна, wrecks, rescue, drones, «Сорока», belt entry, hotel, planet, dock), 1200 steps each,
  counts every #c paint by painter. At 5771ce8 flight painted #c in: belt rocks (115/frame at the belt, 32 at
  Коммуна), «Сорока» (148), the rescue tow and barges (13+10+3), the peace fleet (1); beyond the tour — the
  law ring and trade barges. The kit gains two shapes: kind 4, an oriented box (centre, half-extents, angle,
  soft), and kind 5, a triangle with a mask of hard edges (a tessellation's inner edges go to exactly one
  triangle — no seam, no extra light at sliver tips), and `gpuQuad`. Rocks go as facet triangles; the peace
  flag as strips and a star of triangles, captions by `domLabel`; the law ring as dash capsules, sign and
  glow, the numbers by `domLabel`; barges as the star-lit sprite plus nav, window and nozzle discs, the hp bar
  and the radar dot as rects; the tow as oboxes, a rope of capsules, the barge star-lit like trade barges, the
  flames as the brush's teardrop cut into ≤ 1.2 px slices with hard inner sides. Gate: the tour at 0 in every
  flight item, pairs HEAD | now of each painter no dimmer, no softer.
- Brief of **«Сорока» and the rail ring off #c** (the census's last flight painters; the rail ring was caught
  at zoom .35 on the «Сорока» stand): the sails get their own shader — the metal across, seven foil stripes,
  the star's highlight, the keel's shadow and the dark edge are computed per pixel from the ship's own
  coordinates (u and u·v are linear in the plane, so every zoom is exact, and the polygon's edge is
  antialiased by its own distance); two passes like the brush, the crinkles between them as capsules. The
  keel, bales, porch, spar and gondola are kit shapes in ship coordinates (the gondola a fan with hard inner
  edges and a ring of quads — no beads), the far point and the hop blink soft discs. The rail ring: lamps,
  ring and lobby as shapes, the spiral a ribbon of quads with hard joints, the caption on the label layer.
  Gate: the census 0 in every flight item; a flight gate suite (belt and the ГЛАВТРАССА peace fleet, Коммуна,
  the tow with barges, the law ring, «Сорока», the rail ring) — #c 0, submits 1 per frame, uploads 0 from
  these painters — with each port's mutant red.

The phone frame budget does not grow: GPU ≤ 12 ms.

## G. The GPU canvas — every 2D canvas goes (the author, 25.09)

«2D-канвы — их надо все вырезать и заменять на наш новый движок». The 83–183 ms hitch at the hotel and the
fleet was Skia rastering first-time bakes in the GPU process, `copyExternalImageToTexture` for every mip level,
and the rate limiter on hidden 2D canvases. The cure is not a faster 2D path but none: a bake draws through
`src/08ca-gpu-canvas.js`, a CanvasRenderingContext2D subset that records commands and renders them on the GPU.

**API v1 (this commit).**

| call | what |
|---|---|
| `gpuBake(w, h, draw, {ss, mips})` → `B` | runs `draw(g)` with the global `ctx` swapped to `g` (brushes that paint into `ctx` port untouched), renders one pass into an `rgba8unorm` texture with mips made on the GPU. `B = {tex, view, w, h, n, dev}` drops into `gpuImage` / `gpuLitSprite` wherever a `gpuMipTex` master went. `ss` = draw that many times larger and box it down (default 2 up to 512², else 1); `mips:false` = one level. No device (Node, `gpuNone`) → `null`: there is no 2D path for bakes any more |
| `gpuBaked(Map, key, w, h, draw, o)` | the cache: returns the bake, re-bakes with the same `draw` after a device loss |
| `gpuBakeDrop(B)` | frees the texture (trash, next frame) |
| `g.canvas.width/height`, `save/restore/reset`, `setTransform(6 or obj)/getTransform/resetTransform/transform/translate/rotate/scale` | as 2D; `getTransform` returns `{a..f}` |
| `beginPath/moveTo/lineTo/closePath/rect/roundRect/arc/arcTo/ellipse/quadraticCurveTo/bezierCurveTo` | points are transformed at construction (as 2D); curves flattened to 0.2 px |
| `fill(rule)/stroke()/clip(rule)/fillRect/strokeRect/clearRect` | fill = stencil winding (nonzero/evenodd) + cover; stroke = extruded in user space with the CTM of `stroke()` (non-uniform scale right), joins miter/round/bevel + `miterLimit`, caps butt/round/square, `setLineDash/lineDashOffset`, a stroke under 1 px is drawn 1 px wide at alpha × width (Skia's hairline); `clip` = the stencil's top bit, nested, undone by `restore` |
| `fillStyle/strokeStyle` | a CSS colour (hex, rgb[a], hsl[a], the common names), `createLinearGradient`, `createRadialGradient` (two-point conical, stops mixed unpremultiplied like Chrome) |
| `globalAlpha`, `globalCompositeOperation` | source-over, lighter, destination-out, source-atop, destination-over, screen, multiply (exact on an opaque backdrop, like the kit's `mul`), destination-in / source-in / copy (unbounded: cleared outside the shape) |
| `drawImage(B, 3 / 5 / 9 args)` | from a bake (copy or a cut of the texture), trilinear; `imageSmoothingEnabled=false` = nearest. A 2D canvas is still accepted as a source while the ports run (it uploads, and the gate sees it) |

Antialiasing is MSAA 4× on a stencil8 + colour target, and with `ss` 2 that is 16 samples a pixel, the count of
Skia's raster. Mips: one GPU pass per level, a 2×2 box, the level count of `gpuMipTex`.

**Quality checks before v2 (Контроль, 25.09).**

- *Gradients.* Chrome's 2D does dither a gradient. The probe is a dark radial gradient, rgb(10,12,18)→rgb(26,30,40)
  over 512², with a 128×64 blue-channel crop. At the centre row, 2D has 23 levels, 40 reversals and a mean run of
  4.1 px; 37 % of neighbour pairs differ. The v1 canvas had 0 reversals: bands 11 px wide.
- *Dither.* The ramp is now `rgba16float`, because an 8-bit ramp had already rounded away the fraction the dither
  needs. `fpaint` adds an 8×8 Bayer ±⅜ step. The result is 38 % mixed neighbours, 72 reversals and a longest run
  of 10, the same as 2D. A flat level is left untouched.
- *Mips.* Box mips are not worse than 2D `drawImage` with «high». At level 3 of the find sprite (36²), the alpha
  gradient energy is 13.99 for box, 14.01 for 2D «high» and 14.05 for the exact area mean. Error against the area
  mean is 0.08 for box and 0.03 for 2D, both under 1/255. The far-zoom ×4 pair differs by at most 2.
- *Blending.* It stays premultiplied `rgba8unorm`. Finds against 2D after the dither: unchanged
  (mean |Δ| 0.025–0.043).

**What it cannot do — loud.** `getImageData`, `putImageData`, `createImageData`, `createPattern`,
`createConicGradient`, `isPointInPath/Stroke`, `Path2D` arguments, `filter` ≠ none, composite ops overlay /
saturation / the rest, a shadow under copy / source-in / destination-in, a font without `px`, text without a
device. Each throws `Error("GPU-холст: нет «…»")` and lands in `GC_MISS`: in play the frame guard names it
(«СБОЙ · …»), in a suite the suite goes red. No silent skip anywhere.

**v2: text and shadow (this commit).**

| call | what |
|---|---|
| `fillText/strokeText(t, x, y, maxWidth)`, `measureText` (08cb) | `font`, `textAlign`, `textBaseline`, `direction`, `letterSpacing`, `wordSpacing`, `fontKerning` as 2D. `measureText` returns 2D's own metrics (a frozen copy, cached). `gcMeasure(font, t)` measures without a bake, for sizing one |
| `shadowBlur/shadowColor/shadowOffsetX/Y` (08cc) | on fill, stroke, drawImage and text, like 2D: blur and offset ignore the transform; `clearRect` casts none |

- *The glyph source is swappable.* `GC_GLYPHS` implements `measure` and `raster`, and the atlas does not know what
  is behind it. Today it is the author's option a): one 2D canvas for the whole game, used only to raster whole
  strings and to measure. Option b), an in-game font, replaces that object and nothing else.
- *A whole string is rastered at once,* so kerning and ligatures come out as in 2D. It is rastered in final pixels:
  the transform's linear part (rotation, scale, flips) goes to Skia, as 2D does, and so does the anchor's
  fraction. The mask lands pixel for pixel. In an `ss`×`ss` bake it lands in `ss`×`ss` blocks, so after the box
  down it is exactly that raster: the atlas is never stretched and small letters never blur.
- *The atlas.* Masks go to `r8unorm` pages of 1024², packed on shelves, one per string and paint. A mask is needed
  only while the bake renders, so an overflow past 6 pages simply resets the atlas. A lost device resets it too.
- *Three Skia details, found by measuring:*
  - rastering at ×`ss` made letters 8–22 % lighter, because Skia's small-size contrast exists only at the native
    size;
  - Skia sets the mask's contrast by the paint's luminance (for a gradient, the mean of its stops). A white mask
    made blue text 7–11 % heavier, so strings are rastered in their paint's colour;
  - a text's shadow comes from a mask with no such contrast. By mass it equals text rastered in `#505050`
    (±0.5 % at 8, 11 and 18 px).
- *Shadow.* The shape is drawn alone (no clip, source-over, its own paint; the alpha is the layer) within its
  bounds + 3σ. The layer is blurred separably and composited in the main pass under the command's clip and op,
  then the shape follows. All layers are prepared before the main pass, since a shadow does not depend on the
  canvas. σ = `shadowBlur`/2. Each tap is the Gaussian *integrated over the pixel*: a measured 1-px dot has
  variance σ² + 1/12 in 2D. The fit, blurs 1–16: the taps are within 1/255, the variance within 0.05 up to blur
  6. Chrome's own sigma formula (0.2887·blur + 0.5) fitted worse on every sample. A shape's part beyond the
  canvas edge casts no shadow.

*v2 against 2D* (read back, premultiplied, per channel):

| sample | mean \|Δ\| | max \|Δ\| | pixels off by > 24 | notes |
|---|---|---|---|---|
| text: bold mono 11, sans 10 and 9, a 22 px gradient, a stroke, rotated, `maxWidth`, alpha .5; ss 1 and 2 | 0.007–0.010 | 4 | 0 of 51 200 | weight 0.999–1.000 |
| shadow: a neon tube, a ring, glowing text, a hard offset, a window light, a scaled dot | 0.30–0.38 | 65 | — | the maximum sits on the ring's own stroke edge; hard shadow and window within 3 |
| the neon bake (17k0, three signs): glass | 0.06–0.08 | 3 | — | |
| the neon bake (17k0, three signs): light | 0.57–1.37 | 17–30 | 0–2 | light energy +2…+3.5 % |

The remainder is the glyph shadow's shape: under the letters, 2D's shadow is denser. Both canvases composite
text over its shadow by exact source-over (checked, Δ ≤ 1).

**The second port: neon (17k0).** Glass, light and the pale core are three bakes. The core cannot be erased
out of the light with destination-out, because that would take the halo too. The code of 779b322 run inline in
the same page gives the numbers above; the pair is `pair_neon_bake_x4.png`. `neonDraw` without a device draws
nothing. The kit changed in two places: `gpuImage` re-bakes a bake that outlived its device, and `bakeKeep`
calls `drop()` on what it evicts. **v3:** pixels (`getImageData/putImageData` of the planets) go to a generator
shader; that is GPU-3's.

**The first port: finds (17b).** `findSprite(k)` is `gpuBaked` over the unchanged `findShape`. Against a 2D bake
of the same shape (288², read back): mean |Δ| 0.03 of 255 per channel, 8–27 pixels of 82 944 differ by more
than 24 (edge samples), coverage 0.997–1.000. Twenty bakes (4 kinds × 5), each to `onSubmittedWorkDone`, desktop
headless: 2D + `gpuMipTex` 243–284 ms, 16 ms main-thread JS, **140 uploads**; the GPU canvas 170–188 ms, 7–12 ms
JS, **0 uploads**. The whole-frame pair at 760 is identical to the eye (max Δ 5, mean 0.01). The ×4 throttled
figure is for the phone run with the hotel, where the hitch lives. Suite «GPU-холст: запись, цвет, дыры громко»
(Node and Chrome) guards the recording and the loud holes.

**The mask in `gpuLitSprite` (for GPU-2's pirates).** A lit sprite drawn from a mip master was soft, so the
fleet sampled a level 1.2 steps finer than the screen. That was sharp, but it shimmered more than 2D. A new last
argument, `sharp`, adds the same unsharp mask as `gpuImage {sharp}`: the level minus the next one. It is weighted
by (1 − Y)², so only the dark side is lifted. Otherwise the station light multiplier (up to ×3) would whiten the
bright paint. The strength is `GPU_LIT_SH` = .6. The flag is bit 2 of `U[15]`; bit 1 is still `rel`. It works
only on a master with mips.

The probe is a 256² hull with 2-px panel lines, 2-px rivets, windows and a stripe, drawn at 48 px. The
reference is the 2D path: the master drawn down to 48 px by 2D, then lit 1:1. There are four rows: glow −1 and
glow 0, each also shifted by (.5, .3) px.

| variant | mean \|Δ\| to 2D over the four rows | change under the shift (2D: 9.1 / 8.7) |
|---|---|---|
| the screen's level | 7.23 | 8.5 / 5.9 (soft) |
| 1.2 finer, no mask (the fleet today) | 7.23 | 10.2 / 9.9 |
| mask at the screen's level | 7.35 | 7.5 / 6.9 |
| mask at a level .5 finer | 7.00 | 9.8 / 8.6 |
| **mask at a level .8 finer** | **6.05** | 9.9 / 9.6 |

A strength of 1.2 is no better (6.20 at .8). The recommended lod for a sprite with the mask is the screen's
level − .8. No dark rings. The pair is `pair_lit_sh.6.png`; the columns are 2D, screen, 1.2 finer, and the mask
at 0, .5 and .8.

**Shadow series in a bake (for GPU-3's hotel).** Before, every command with a shadow got its own layer. Each
layer had a full-size MSAA target, its own clear and resolve, and two blur passes. The hotel's light layer has
92 such commands and baked in about 430 ms. Now a run of commands with the same shadow is one layer, a
«series». The same shadow means the same blur, colour, offset, composite op and clip. A series gets one blur and
one composite quad, placed where its first member stood. The order check has two rules:
- a new member's shadow footprint (its box + 3σ, shifted by the offset) must not touch any earlier footprint in
  the series. A blur of a sum is the sum of the blurs, but source-over of two overlapping shadows is not a sum;
- the footprint must not touch anything drawn in the series so far: a member's shape, or a command without a
  shadow. In 2D, shadow 2 lies over shape 1; in a series it would lie under it.

A command with an unbounded composite op closes the series. Layer targets are now sized to the largest series
box, not the whole bake. The shape is drawn shifted by the box corner (`GU.o`).

The probe draws the hotel's light layer (`hotelPaint` em, all windows lit, 320×218, ss 2) through the GPU canvas.
Timings are to `onSubmittedWorkDone`, the median of runs 2–6, with other sessions busy on the machine:

| | layers | bake, ms | mean \|Δ\| to 2D | px with Δ > 24 |
|---|---|---|---|---|
| HEAD (a layer per command) | 92 | 431 | 0.296 | 5 |
| series | 18 | 146 | 0.296 | 5 |
| no shadow at all (the floor) | 0 | ~80 | — | — |

HEAD and series agree to one level (max Δ 1). The layer count drops to 18, not 1, because the rules do cut
series: a window whose glass or balcony also casts a shadow overlaps its own footprint. The pairs are
`pair_hotel_sh.png` (2D | HEAD | series, ×2) and `pair_hotel_sh_x4.png` (windows ×4). The bake records the layer
count in `B.shl`. Контроль: this is an intermediate step. 2D does the same bake in 74 ms, so the time is to be
broken down next.

**Bake target pool and the shadow atlas (Контроль's breakdown order).** The 146 ms broke down as follows (desktop,
GPU timestamps on the bake's own passes, 6 runs):

| | ms |
|---|---|
| JS record (`hotelPaint` into `GcCtx`) | 6–15 |
| the rest of the CPU (emit, ramps, encode, submit) | 4–8 |
| GPU, all bake passes: shadow MSAA .19, blur .54, main .45, mips .05 | span 3.2–3.8 |
| the wait to `onSubmittedWorkDone` | ~100 (20–45 with no shadow) |

The wait was texture creation in the GPU process. A side probe: 36 new 40² r8 targets, each cleared, took 45–70 ms;
the same 36 passes into one pooled texture took 0.4–1 ms. Each creation costs ~1.5 ms, and a bake asked for ~40:
two r8 per shadow layer, then ms, st and rs for the layers and for the main pass, the ramp, and three buffers.

Now:
- All shadow layers of a bake are regions of one atlas, packed by shelves (`gcShadowPack`). The layers' shapes are
  one MSAA pass, and each blur is one pass over the atlas. The blur reads only inside its layer's region (`BU.r`);
  `fshadow` gets the layer's size and atlas place from the paint record (`gp[b+2].zw`, `gp[b+3].xy`).
- Targets come from a pool (`gcPoolSet`): a set of same-size textures per role (bake, shadow, ramp). A set fits
  if it is at least the size needed and at most 2.25× its area (anything up to 256² for small bakes). A new set is
  rounded up to 64 px. Buffers are pooled by role and grow in powers of two. The main pass draws into a pooled
  target larger than the bake (`gu.sz` = the target), and the resolve goes to level 0 through the mip pass with a
  source fraction (`sc`). Only `B.tex` is new per bake.
- The pool lives in `GPU.lay`, so a device loss drops it with everything else. It warms up on first use with
  `GC_POOL_WARM`: bake 256², 512², 768²; shadow 256², 512²; ramp 256×128. That is 20 textures, ~31 MB. The cap is
  96 MB, LRU; a set over 24 MB is used once and never pooled.

The hotel light layer is bit-identical to 0f6e4e3 (0 pixels differ). Bake time after the first run: ~25 ms (record 7–11,
CPU rest 3–7, the wait ~15, GPU span 1.9). 2D does the whole `hotelPaint` (three canvases) in 14–27 ms on the same
machine. The GPU canvas suite checks series (disjoint → one; overlap, a shadowless draw under the next footprint,
or a different blur → cut), zero creations on a repeat bake, and a new pool after `GPU.lay` is replaced (what
`gpuInit` does after a loss). The phone twin is still to be measured, with GPU-3's hotcost stand.

**The ramp cache, the warm-up in `gpuInit`, the cap by the peak.**
- *Ramp cache (GPU-3's request).* `GcGrad.ramp()` built a 256-step band for every gradient fill; the hotel makes a
  gradient per window with nearly the same stops. That was ~27 % of the hotel bake's JS by GPU-3's CDP profile.
  Bands are now cached by the sorted stops in `GC_RAMPS` (at most 512, then cleared), with their half-float copy on
  the band. A bake gives one row per distinct band. Hotel light layer, runs 2–6: record 3–4.6 ms (was 7–11), the
  rest of the CPU 1.5–3 (was 3–7), bit-identical to 0f6e4e3.
- *Warm-up.* `gpuInit` calls `gcPool()`, so the ~30 ms of GPU-process work happens behind the loading screen, and
  again after a device loss. `08b` did not grow (a comment got shorter).
- *Cap.* `Q.peak` records the pool's peak. On the phone twin (411×742 ×1.5), across system with a zoom sweep
  .25–3, dock and relay, the peak is 30.4 MB, i.e. the warm-up set plus one 320×64 pair. The cap is now 64 MB, so one
  set over 16 MB is used once and never pooled. The 5-minute P1 route has no script here, so these scenes stand in
  for it.

**The price of one GPU-canvas call (profile, 25.09).** Temporary stamps in `gpuBakeRedo` split a bake into record
(the draw callback), emit (ops → draw list), ramps and paint fix-up, buffers and upload, encoding, and submit. The
probe baked 4000 calls of each kind into 512² at ×1, desktop, median of 5, in µs per call:

| call | before: total (rec / emit / up / enc) | after: total (rec / emit / up / enc) |
|---|---|---|
| `fillRect`, 3 colours | 3.5 (0.4 / 1.3 / 0.6 / 1.0) | 2.4 (0.5 / 1.4 / 0.2 / 0.3) |
| arc `fill`, r 4 | 7.1 (2.2 / 3.4 / 1.0 / 0.5) | 3.5 (1.7 / 1.1 / 0.4 / 0.3) |
| line `stroke` | 4.3 (0.9 / 1.6 / 1.2 / 0.6) | 2.4 (1.0 / 0.8 / 0.2 / 0.4) |
| `drawImage` of a bake | 1.7 (0.8 / 0.4 / 0.2 / 0.3) | 1.0 (0.3 / 0.4 / 0.2 / 0.2) |
| `fillText`, cached glyphs | 4.9 (3.6 / 0.6 / 0.3 / 0.3) | 2.9 (2.0 / 0.6 / 0.2 / 0.2) |
| gradient `fillRect` | 3.4 (1.0 / 1.3 / 0.7 / 0.4) | 2.1 (0.8 / 0.8 / 0.3 / 0.3) |

Ramps and submit cost under 0.05 µs a call. The hot spots were two:
- vertices were pushed into a JS array and copied into a `Float32Array`. They now go straight into one growing
  `Float32Array` (`GC_VA`), shared by bakes, since the emit runs after the draw callback and nested bakes are
  finished by then. It is dropped back to 256 KB after a bake over 16 MB;
- encoding set the pipeline, bind group and stencil reference on every draw. It now sets them only when they
  change.

Seven bakes hash the same before and after: the hotel's three and four mixed scenes (solids, arcs, strokes,
images, text, gradients, shadows, clip, destination-out). The hotel's paint bake (1931 calls) emits in
1.4 ms instead of 2.7.

*The answer on a 16k-call frame.* At 1–3.5 µs a call on the desktop, it is 16–56 ms, and ×4 on the phone. The
GPU canvas is for bakes, not for a whole frame re-recorded every frame. A frame's steady drawing stays on the direct
paths (`gpuLitSprite`, the atlases). Record (triangulation, text layout) is now the biggest share for paths and
text.
The next gain would be drawing convex fills without the stencil (one draw instead of two). That is not done here.

**`multiply` on a transparent destination: two draws.** 2D multiplies as
`Cs·Cb + Cs(1−ab) + Cb(1−as)`, alpha `as + ab − as·ab`. The old single blend (`dst`, `1−as`) is right only on an
opaque destination; on a transparent one it blackened the source, off by up to 248 of 255. No single blend state
builds the sum, so a multiply draw is two draws over the same vertices:
- `mul1`: colour `dst`, `1−as`; alpha `dst-alpha`, `1−as`. It leaves `Cs·Cb + Cb(1−as)` and the alpha `ab`
  unchanged;
- `multiply`: colour and alpha `1−ad`, `one`, with `ad` = `ab` still. It adds `Cs(1−ab)` and `as(1−ab)`.

The first draw of a stencilled fill uses `cvk`: the cover test without clearing the stencil, so the second draw
covers the same samples. Images, text masks and shadow quads write no stencil and draw twice as they are.

The pair `pair_multiply_x2.png` shows fills, a half fill, an arc, images (opaque and half, and at `globalAlpha` .6)
and a shadowed rect. They sit on destinations of alpha 0, .25, .5, 1 and a 0→1 ramp. Δ against 2D, premultiplied,
on interiors:
- flat destinations: ≤ 1 (the arc 1.4 at .25/.5: two 8-bit roundings plus the 2D reference's own);
- HEAD: up to 248;
- the ramp column and the shadow row: up to 2.3 and 3. Under source-over they differ by 1.4 and 1.2 (gradient
  dither, blur kernel), and multiply shows that difference through the source.

The opaque column is as before, and the hotel's `sh` bake (a multiply on white) hashes the same. The suite checks
the tables against the 2D formula on 48 combinations and that `cvk` writes no stencil. The old tables fail it.

**Chips and world labels on `#ovl` (08bi).** Edge chips and world labels were small 2D canvases in the DOM
(`#chips`, `#labels`): one canvas per chip or label, redrawn when its key changed, and each one paid style and
composite cost. They are now one WebGPU canvas `#ovl` at the native DPR, placed after `#hud`. `#labels` stays
between the two for the belt lamps only. The layer draws one pass inside `gpuHudFlush`, so it adds no queue
submit of its own.
- A primitive is 20 floats: a rect with exact coverage, a mask glyph from an atlas, or an analytic triangle (the
  chip's arrow). Labels are queued before chips, so every chip lies above every label: the ×1.5 bug (an ally's
  caption over the compass chip's digits) cannot come back. The gate checks the first primitive of the pass is a
  label glyph, and mutant `labels-over-chips` swaps the order.
- Text goes into an `r8` atlas of 4 layers of 1024², keyed by font, size, ¼-px phase and string; colour is not in
  the key (masks are white, the colour is per primitive). A string splits into digit runs and other runs. Digits
  are drawn glyph by glyph with the advance of «0», so a changing distance reuses ten masks. The first digit a
  font meets warms all ten, and the string start snaps to a device pixel, so a moving label does not walk
  through new phases.
- The atlas evicts the layer that was touched longest ago (LRU by frame). A label or chip not seen for 600 frames
  is forgotten. An empty layer is `display:none`, so the compositor does not blend it.
- The cost: GPU pass 1.7 µs at 760 ×1 and 10.5 µs on the phone (390×844 ×2.625) by timestamps; JS 0.21–0.22 ms
  a frame at 760 and 0.25 ms on the phone. The old DOM path cost 0.15 and 0.21 ms of JS only; its style and
  composite work per canvas was not counted and is gone. Rasters happen only when new text appears: 11 at the
  start at 760, 22 when a moon label enters the phone's view, then 0.
- The pairs `pair_ovl_760.png`, `pair_ovl_phone.png` and `pair_ovl_phone_x3.png` (chips and a label ×3 against
  HEAD) look the same.
- Tests: `91zzzzzzy4` checks LRU on its own atlas (one eviction, no thrash) and flies 600 frames. It asserts no
  string is rastered twice, rasters come only in frames with new text, the layer hides when empty and labels are
  forgotten. The gate2d scene «фишки и подписи мира» asserts 0 2D calls, and its text raster is a column of its
  own that must be 0 after 30 warm frames.

**A join takes the curve's tangent, not its first chord.** GPU-2 found a light spike at the stern hook of
`obod` (`hbake_x2.png`): 2D draws a blunt hook there. The hook is `lineTo` then `arc` back from the same point,
a 180° turn, and 2D bevels it. The GPU canvas flattens curves when the path is built, so the join saw the
arc's first chord. On a small arc the step is coarse (radius 1.5 px, five chords of 50°), the chord is off the
tangent by half a step, the turn reads as about 155°, the miter ratio is about 4.6 and within the limit of 10:
a tip of 4.6 half-widths outward. `miterLimit` itself was right. The fix: every flattened curve (arc,
ellipse, quadratic, cubic) gets one more point a parameter ε ≤ 1e-3 from each end. Joins and caps then see the
tangent. The points lie on the curve, so fills do not change.
- Node suite «острый стык»: the tip reach at interior angles 5°, 15°, 30°, 90° with `miterLimit` 10 and 2
  equals the 2D rule (miter `hw/sin(φ/2)` within the limit, bevel `hw·sin(φ/2)` beyond it) to 1e-6. The hook
  reaches 0.21 px outward, under the half-width (HEAD: 2.24).
- Pixel probe against 2D (`mitp.js`): the tip's leftmost column above half ink is 2D / GPU −19.5 / −21.3 px
  (15°, limit 10), −10.3 / −11.0 (30°), −4.1 / −4.1 (90°), bevels within 0.6 px. What remains is edge
  anti-aliasing on a thin tip; polylines are identical to HEAD.
- The pair `pair_miter_hook_x3.png`: `obod` and `strizh` sterns, 2D | GPU HEAD | GPU new. The spike is gone,
  and the hook is blunt as in 2D.

**The planet's 2D calls in shards were a queued material job, not the planet.** Gate2d saw 2×
`putImageData` and 2× `createPattern` under `gpuPlanet` only in some shards. `planetMat(p)` (18a) queues
a surface material job; the harness has no frames, so a landing or cold-demand suite leaves it queued. The
next suite that draws a planet runs `matTick` inside `gpuPlanet`, finishes the job and pays its 2D.
- `resetWorld` drops `MAT_JOB`: a queued job belongs to the world it was made in.
- Gate2d names `matTick` a hole. The surface material is 2D until the surface is ported; in the game the
  planet frame does step it on the approach to a landing.
- Proof: «cold demand» then the gate is green with the fix and red with it reverted
  (`gpuPlanet.putImageData`).
- The shard 4/6 stall in «сейв: поле мира…» (-Full, killed at 900 s) does not repeat: the shard alone is
  green, 150 suites and 2123 checks. The runner still printed «ВСЁ ЗЕЛЁНОЕ» over the killed shard.

## Where I stopped (update on every commit)

- **GPU canvas v1 (25.09, `gpu`).** `08ca-gpu-canvas.js`, brief in §G; the first port is the finds (17b), the pair
  `pair_finds_760.png` in the session's scratchpad (identical, 0 uploads). The quality checks are done: gradient
  dither on a half-float ramp, box mips kept (numbers in §G, pair `pair_grad_x4.png`).
- **GPU canvas v2 (25.09, `gpu`).** Text (08cb) and shadow (08cc) are in, and neon (17k0) is ported. Pairs are
  `pair_text_x3.png`, `pair_shadow_x3.png` and `pair_neon_bake_x4.png`; numbers in §G.
- **gpu3 merged up to 149d5b3 (cc220f3).**
- **The mask in `gpuLitSprite` is in (§G).** Its last argument is `sharp`, and it is best at the screen's level − .8.
- **Shadow series in a bake are in (§G).** Hotel light layer: 92 layers → 18, 431 → 146 ms, picture as HEAD.
- **Bake target pool and the shadow atlas are in (§G).** Hotel light layer 146 → ~25 ms, bit-identical; the phone
  twin (hotcost) is still to be measured.
- **Ramp cache, warm-up in `gpuInit`, pool cap 64 MB (peak 30.4 MB) are in (§G).**
- **gpu3 merged (de67fb7).** Phone twin, hotel appearance: the worst cold frame is 73.6 → 65.7 ms, textures 35 → 9;
  warm JS 17.3 → 12.0 ms.
- **The profile of a bake is in (§G).** One GPU-canvas call costs 1–3.5 µs at ×1, bit-identical.
- **`multiply` on a transparent destination is in (§G):** two draws, Δ ≤ 1 on flat destinations (HEAD: 248).
- **Chips and world labels are on `#ovl` (§G):** 0 2D calls, rasters only on new text, GPU pass 1.7/10.5 µs.
- **Joins take the curve's tangent (§G):** the hook spike on `obod` is gone.
- **Integration for the phone (25.09):** gpu2-fleetlit up to e699c3c and gpu3 up to 1dc9176 are merged. The
  fleet tests accept a bake (`fleetArtBaked`). M306, M317 and M318 are red in Chrome on gpu2's own code
  (2D pixel reads of a GPU bake, 2D fills of the works now on the scene pass); they are GPU-2's to fix.
- **The planet's 2D in shards was a leftover material job (§G).**
- **The runner is red on a killed shard:** a shard killed at the ceiling, or one whose report has no
  finished header, counts as a failure named with its last suite; `-ShardSec` narrows the ceiling (900 s)
  to test this path. Forced at 15 s: «ПРОВАЛЕНО 2», exit 1.
- **Pipeline warm-up (P1 from S23, in progress).** Step 1 done: every lazy pipeline goes through one funnel,
  `gpuPipeline(key, recipe)` in 08b0, and shader modules are cached by text (`gpuShader`). Keys: `pipe:name|blend`,
  `gc:md|op`, `gc.mip`, `gc.blur`, `gnb.gen|16f`, `gnb.noise`, `gps`, `ovl`; lazy creations go to `GPU_PIPES.lazy`.
  Step 2 done: every key has a recipe (`gpuPipeRecipe`: `gc:` → `gcPipeDesc`, `pipe:` → `GPU_PIPE_SRC[name]` +
  `gpuPipeDesc`, single keys → their module's `*Desc`); one descriptor function serves the lazy path and the
  warm-up. `gpuInit` starts `gpuPipesWarm(GPU_PIPE_KEYS)` (async, the frame does not wait); the start buttons
  wait for it up to 2.5 s (`gpuAfterWarm`), the test boot polls `GPU_PIPES.done`. A `pipe:` key warmed from
  a different shader text is a miss, not a swap.
  Step 3 done: the detector «конвейеры: после прогрева полёт не компилирует» (`tests/91zzzzzzy4-pipes.js`),
  pinned third after the boot suites, flies orbits, the six gate2d scenes (dock lane, planet, hotel, chips,
  station, fleet gesture), the billboard and a pirate fight, 60 frames each, and wants zero lazy keys and zero
  raw `createRenderPipeline`/`createComputePipeline`/`createShaderModule` (named by caller), no dead table keys.
  The funnel remembers every asked key (`GPU_PIPES.used`); the suite prints them in `<pre id="pipekeys"
  data-pipe>` and `test.ps1 -Accept` (default `-Only "золотые кадры|конвейеры"`) writes `08b1`: 36 keys, warmed
  in ~1.7 s on the desktop card. Test boot: compilation runs on real time, so the pipe wait polls 1 ms of
  virtual time per ~20 ms of busy work, ceiling 600 polls. Before the table: 33 lazy keys in flight; after: 0.
  Step 4 (а4) done — the cold S23 on 49f75cf (26.09) still had one 67 ms frame, at the hotel approach: six
  one-shot 1024² MSAA bake sets (~120 MB with zeroing) in three frames, GPU latency 34→106 ms at JS 3–5 ms.
  The pool now keeps a `bake` 1024² set warm from `gpuInit` (behind #intro; warm total ~54 MB, cap 80 MB,
  one-shot only above half the cap) and clears every warmed set once there, so the first touch is not in
  flight. `prebake` has a second, GPU budget: `PB_PX` (2^19 MSAA points, `GC_PX` counted in `gpuBakeRedo`) —
  a frame starts a new step only below it, so one hotel-sized bake per frame. The detector gained the edge
  wall scene, the billboard at ×1.5 (neon core → `gc:msk|destination-out`) and «the real first flight»
  (spawn + 1800 frames of Контроль's gate.py route: thrust 1 s on/off, left 0.5 s every 4 s — caught
  `fld.hgflame|add` too); table 39 keys.
- **Device loss and frame failures (review 25.09, 5a + findings 8, 11) done.** `08b2-gpu-loss.js` holds
  `gpuNone`, `gpuDrop` and the new `gpuFail`: only a lost device or a `DOMException` from the API drops the
  device; a JS throw in `gpuWorld`/`gpuPresent` abandons the frame (passes, encoder, `ctx` back to #c) and
  rethrows to the frame guard («СБОЙ · …»). `gpuHudFlush` catches per painter (`crashSay(err,"приборы")`).
  `gpuDrop` now `destroy()`s the old device. `gpuField` rebakes any bake from a dead device (module caches:
  hull, fleet, pirates, barge, lit sprites). Finding 8: after frames were shown, `gpuNone` says «Видеокарта
  перестала отвечать» instead of «this browser lacks WebGPU». Finding 11: the warm gate is a promise armed at
  load (`GPU_PIPES.gate`, `done:false`), opened by the warm-up of the current device or by `gpuNone`; a
  dropped device's warm-up opens nothing. Suite «видеокарта: сбой кадра не роняет устройство»; the real loss
  on the stand (shot.py: 30 frames, `gpuDrop(…,true)`, wall clock): new device, 39 keys warm, 0 crashes,
  0 GPU errors, the world draws.
- **5b (art cache LRU) done.** `gpuBaked` is an LRU (`o.keep`, default 32); `artGet`/`artPut` (08ca) give
  FLEET_ART (24), PIR_ART (24), BARGE_ART (12) an LRU that drops the evicted item's bakes; hull bakes share
  `HG_LRU` (8, 17c2). Caps by numbers: a tour of 15 systems (90 frames each, spawn) used per system at most
  7 fleet arts, 3 pirate variants, 1 barge, 1 hull bake — the caps hold three systems. `gpuBakeLive(B)`
  rebakes a bake from a dead device or one dropped while still held (gpuImage, gpuField, gcImg). Suite
  «видеокарта: кэши выпечек с потолком, выпавшая выпечка допекается».
- **5c (scout searchlight) done.** The wedge is a field (`fld.abil.cone`, 16c `ABIL_CONE_WGSL`): radial
  alpha .102→0 over R = .6·max(W,H) inside ±.35, the side antialiased over one device pixel. It replaces a
  screen-sized MSAA ×4 bake at 2·DPR (a pool giant on a phone). Pairs before|after: 760 max|d| 6, phone
  twin 390×844 ×3 max|d| 4, pixels >8: 0 %. The detector flies it (scene «прожектор разведчика»); table 40.
- **5e (reversed smoothstep edges) done.** WGSL leaves `smoothstep(e0,e1,x)` with e0 > e1 undefined (Metal,
  iOS Safari). All 11 literal cases (16gb ×9, 17g ×1, 19ca ×1 — three more than the cloud fleet listed) are
  `(1.-smoothstep(e1,e0,x))`; the 35 non-literal calls all rise for positive inputs. Pairs system, landing,
  far system at 760: max|d| 1/0/0. Node suite «шейдеры: у smoothstep нет перевёрнутых рёбер» scans the game
  script. Desktop golden frames were already red before this segment (49f75cf): черпак 5.4 %, дом 3.8 %.
- **Shadow 512×128 warm set done.** cold3 on S23 saw a 448×64 shadow atlas set born mid-flight (neon,
  billboard); `GC_POOL_WARM` gains `["shadow",512,128]` (~1.7 MB), the canvas suite asks the pool for 448×64
  and wants no new texture.
- **Pad halo: no regression.** With «breathe» frozen at its peak, d35eed1 and now match around the pad.
- **Golden scoop pair sent to Контроль.** stand.py at eb0e4f37 | now: the world is the same pixel for pixel
  where the suite points; >8 only in the top HUD strip (fuel/hull/hold block ~2 px lower), 0.64 % / 1.17 %.
- **gpu2-crew (efbe9968) merged:** the crew watch frame without #c, GPU-2's work.
- **Golden frames: only the red ones re-taken** (Контроль, option a): черпак and дом at 1280×800, черпак at
  390×844 (дом was green there). -Accept writes the whole window, so the new take was spliced into HEAD's
  JSON scene by scene; the other scenes kept their old signatures (they drift within tolerance).
  -Mobile on the merge: one red, the golden черпак, now green. Pipe table unchanged (40 keys).
- **Candidate 66b51af6** (S23 cold4 PASS, deep 9.00 ms GPU frame). Queue on top of it, Контроль 26.09:
  (1) the «кольцо дороги» isolation leak — does not reproduce (alone; gates under -Shuffle 1..3), a watch
  line in PLAN §10; (2) рейсы → посадка: matTick on the GPU; (3) review findings 5–7, 9, 10; (4) the fleet
  merge scouting.
  Next: (2) matTick on the GPU.
- **`gpuHullLight` (16ga) is removed:** the hull light is 17c `gpuLitSprite`; the probe row `hullLight` is gone.
- **Next, in Контроль's order (25.09):**
  1. the mip kernel against 2D «high» (dots, thin lines, a grid; levels 1–4);
  2. `drawImage` from bake to bake at ss2: nearest when axis-aligned and 1:1, with a pair test;
  3. HUD fixes 1–5, plus:
     - find labels in table case and pushed apart;
     - a chip must not go under КАРТА/МЕНЮ/Фото, with an intersection check;
     - button plates must read over bright neon;
     - DECISIONS «no 2D».
  Later: Gauss weights on the CPU and σ > 4 downsampling only if blur passes on the phone take > 2 ms per bake.

- **HUD pair, Контроль's three fixes (25.09, `gpu-hud` on eb0e4f3).** 12 px from every edge, the hint inside
  the pad (≥ 4.5:1, the idle pad takes the long press), names in table case on pads (`27y-hud-words.js`), one
  decimal comma; six mutants red. The two old -Mobile reds fixed (CHIP_POS leak in `resetWorld`, the open ОПИСЬ
  tab). Five pairs (km/ney at 390 and 760, the station at 390 with ДЕЙСТВИЕ lit) in the session's scratchpad,
  `pair_hud_*.png`. `gpu` holds the gpu2 allies merge (044a0f7). Next (Контроль): merge gpu2-fleetlit f9adaae
  into `gpu`, then gpu3 when GPU-3 hands its tail over. Open question: world labels of planets stay in caps
  («ЦИЦИИН») while the chip says «Нейэль IV».
- **The flight HUD pair (25.09, branch `gpu-hud` on a178e76, not for release).** One variant, brief under §L.S;
  pairs «было | стало» at 390×844 DPR 2 and 760 DPR 1, flight by the Commune and calm NEYEL, in the session's
  scratchpad (`pair_hud_*.png`). -Full green; -Mobile keeps only the two failures a178e76 has too (the stick
  vs compass chips, «обещание» on the desk). Waiting for the author's verdict; next: merge gpu2 and gpu3
  into `gpu` (Контроль, 25.09).
- **Stage 1 caches (25.09, Контроль's order: station → zoom-following bakes → 25c → item 3).** Station master
  done (17c3, steady uploads 0, layers as in 2D); zoom-following bakes done (each size uploaded once, the way
  back 0); the instrument pod 25c redraws only on change; item 3 done (body V>.6 +12/+13 % over 2D — the
  excess was the final glow on the hull's own paint, not the exhaust); the wake at the stern cooled to 2D's
  peak within 20 hull units of the nozzle, further as before; the hotel's windows are pieces of a two-master
  atlas (uploads 0 on any flip); the release rehearsal is green (0.458.0 = 90604dc, not pushed); combat is off
  #c (gate suite green); wrecks and the «left» off #c. The tour census ran (see its brief): belt rocks, the
  peace fleet, the law ring, trade barges and the rescue tow are off #c (pairs the same; rocks and the tow's
  barge a touch lighter — the tow's barge now lit by the star like the trade barges). «Сорока» and the rail
  ring are off #c too: the census is 0 in every flight item (belt mode itself is a PLAN line under stage 2;
  the hotel's 2 dirty frames are the belt's leftover on the item seam, no call of its own). Flight gate suite
  green, its seven mutants red. Next: the 0.458.0 notes addendum, -Full and Node on the new HEAD.
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
  16/n (glow, §L.S): the hotel and the Cheburek left `#c` for the scene pass as sprites baked once, each an albedo
  layer (drawn over) and an emission layer (drawn add with its own gain); `emit()` no longer sees them. Hotel
  (17l): windows, balconies, stairwells and door lamps emit through the glass only (mullion and silhouette cut),
  halo ~a tenth of a window; the baked "lighter" window halo is gone; a third layer is the house times the sign's
  colour, falling off from the ridge to the second floor (the sign's warm light, gain .8). The sign is a
  device-pixel bake per font size: every letter of «ГОСТИНИЦА «КОСМОС»» as dark tube glass in the albedo (the dead
  Т shows), the live letters as the tube colour with a halo of .14 font px, plus a pale core in the regular weight;
  gain 1.4, placed on whole device pixels. Cheburek (17j): body baked once at 4 px/unit, the window a dark glass
  lamp in the albedo and a lit pane in the emission (halo .7 unit, the crossbar cut), garland bulbs likewise; the
  radial `gw` halo is gone; gain 1.6 × breath (≤ 1.8 of white at the pane). Steam is soft `gpuShapes` discs, the
  puffs near the window lit warm from below (additive, weighted by distance to the lamp); the nozzle a soft
  additive disc; the board a device-pixel bake, ropes as capsules. Peaks (HDR, by the frame's formulas): the
  Cheburek pane ~20× white → ≤ 1.8, the sign ~13.5× → ~1.7. Halo around the pane (760 pair, radial mean): ring at
  8 px 183 → 105, at 12 px 117 → 61; it ends 13 px from the lamp (was 17), i.e. ≤ 5 px past the hull side at s=1
  against the ⅓-length allowance of ~11 px. Pairs `cuta_*` (760, Z 1) and `cutp_*` (411×742 ×1.5), crops
  `glyph_hotel/cheb/pboth.png`; stand `hcjs.js` (first system with both, Нейзь, orange gas), script `cut5.sh`.
  What got better: the windows and the pane are lamps behind glass instead of bloom blotches, the house and the
  boat read whole, «ЧЕБУРЕКИ» is legible (was burnt white), the sign reads letter by letter with the dead Т.
  Kit: `gpuImage` passes `o.ver` to `gpuCanvasTex` (bakes redrawn in place); `gpuCvLevel(cv,ver,devW)` picks a
  halved level so a far hotel does not shimmer; the texture LRU holds 32 (`GPU_CVTEX_CAP`) — eight thrashed once
  the hotel, sign, boat and shuttles each kept two layers.
  16/n fixes (Контроль on bfa9e26: «Космос» lost its colour, S .58 → .23; the billboard burnt white; the windows
  flat white squares). One neon bake, 17k0 `neonBake`/`neonDraw`, serves the hotel and the billboard: glass
  albedo of the whole name, emission of the live letters in the tube colour (the lamp colour pushed away from white
  ×1.6, since the tone shoulder whitens what is bright) with a halo of .14 font px, and a pale core only as the
  middle third of a stroke of ≥ 2.4 device px (`destination-out` of a ⅔-stroke outline), otherwise the tube
  colour whole; gain 1.2. Billboard (17k `bbDrawGpu`): panel, truss and the ГОСПЛАН block baked once in device
  pixels, the title through the neon bake (dead letter as glass, the hum as gain), the ticker a baked text strip
  that the window pages by `u0/u1` in ≤ 8 segments (added, gain 1), the far plaque two `gpuShapes` rects; the old
  2D path stays as the fallback. Gate (bright px V > .55, S / V): sign 760 .22/.95 → .82/.93, ×1.5 .27/.95 →
  .79/.93; billboard 760 .30/.91 → .81/.94 (bright px 1424 → 515), ×1.5 .32/.89 → .75/.90. Hotel windows: lamps
  from a 7-colour table (six 2700–3000 K, one cold), the room darker than the lamp (.46 → .36 of it), light as a
  radial pool (.3 → .05) — why they were white at 760: a window is ~3 px there, and the white frames (#f3efe4)
  averaged into the lamp; frames are now the wall's tone at night (#c9c1ae). A lit balcony carried its own light
  over the window's (cut now), its glass darker (#6e5436, light .22); the «ПРОДАЮ» paper grey (#aca695) and
  opaque to the lamp behind it; air conditioners #c4c2ba. Open: the whole façade renders ~+.16 above its paint
  even with the hotel's emission off (the scene's gas over objects), so the wall's luma (~219) sits above the
  sign's (~207 at 760) — the brightest window (luma ~228, the paper balcony) is still not below the sign; the
  sign stays the accent by saturation and dark sky. Fix belongs to the object lighting pass (light the façade by
  the star like `gpuLitSprite`, night walls darker), not to the windows. Pairs `pair16n_760.png`, `pair16n_p.png`
  (was bfa9e26 | now), script `sv.py` (S/V of bright pixels), `hot.py`, `dumpbake.py` (the three bake layers).
  Hulls, 15/n p.2 (17c2 `hullGpuDraw`, wired in 17 at the ship draw; the 2D `drawHull` and `gpuHullLight` stay as
  the fallback). Body: `hullBakeRender(h,id,0,[1,2,3],sb)` into a square of side 2E·sb (E = the hull's reach),
  keyed by `hullBakeKey` — the 2D bake's key now lives in one function (03e1) together with `hullLiveInserts`
  (runline, crowns: those hulls return false and go the old way, since the inserts sit between body layers). Scale
  steps are the 1/16 octave of the 2D bake, so the maker's sharpness is the same. Bank: `gpuLitSprite` got an
  optional `sy` (GST `V[3].y`) that divides the sprite's local y — a squash along the span, the relief light still
  from the star; under it a dark belly silhouette (`h.dark` .85) shifted by sin(bank). Flames: one field shader for
  all nozzles (`HG_FLAME_WGSL`) with the old drawFlame's shapes (glow disc at −.25f, radius 1.15f; plume with its
  colour ladder; the core wedge or the lux drop), the length breathing on slow sines instead of `rndFx` per frame,
  thrust smoothed per id (`HG_THR`, a module Map, not in the save), the plume's edge carrying value noise that
  flows back. Gains core 2.6 / plume 2 / glow 3.2 and the glow colour (1,.62,.34): the old halo came from `emit()`
  over `#c`; in the scene bloom starts at 1.4, and at 1.9/1.3/.9 the flame lost its halo (pair 760); a brighter
  glow at the old colour went white on the tone shoulder, so the colour moved to orange. The player's `gpuExhaust`
  plume (16ga) is unchanged — it drew under the 2D flame before, and does under this one now. Pairs `cuth1_*.png`
  (760), `cuthp_was` | `cuthq_now` (×1.5), stand `hcjs.js` + `thr.js` (forces thrust and bank), `gainrun.sh` (gain
  override without a rebuild). Open: the body reads a touch lighter than the 2D one (relief light vs
  `gpuHullLight`'s rim) — not dimmer, within the rule; the left wing's shadow is softer.
  Hulls pass 1b (Контроль on 22f85fb: the scale was still in the key — every 1/16-octave zoom step a new bake,
  texture and upload; runline and crown hulls stayed on `#c`). One master per hull: `hullGpuSb` = 2 × the largest
  ship in flight (`shipScaleCap(ZOOM_MAX)` = 1.4) in scene pixels (`GPU.bw/W`), on a quarter-octave grid, capped by
  the 1024 side — zoom never changes it; the key is still `hullBakeKey(id,sb)` (wear, seams, scars…), four per
  hull, an evicted one frees its texture (`gpuMipDrop`). Kit (08c): `gpuMipTex(cv)` uploads every level once (2D
  halvings, `imageSmoothingQuality` high, `copyExternalImageToTexture` per `mipLevel`, rebuilt after a device
  loss), `gpuMipSmp()` the trilinear sampler, `gpuField` takes `o.smp` (in the bind-group key). GST: the texture
  level comes in `V[3].z` for the albedo and all relief taps (`sa`), so the relief reads the same level;
  `gpuLitSprite(...,sy,lod)` takes a canvas or a ready master. Level = log2(master / screen) − .35 (`HG_LOD`,
  towards sharp: trilinear mixes two levels). The belly is baked once at the master scale and drawn through
  `gpuCvLevel`. Runline ticks and crowns are drawn over the whole body (`hullGpuInserts`): ticks and the plank as
  capsules in hull axes, crowns as discs, the plank's rim a wider white capsule under it, the crown halo a disc
  with a falloff over the old gradient's radius; so every hull leaves `#c`. Numbers (stand `hcjs.js` + `thr.js` +
  `ins.js` + `gs2.js`, 760, thrust, bank .35, runline and five crowns; 60 steady frames, then 120 frames of zoom
  ZOOM_MIN → ZOOM_MAX): the hull uploads 0 in steady flight and 0 on the sweep, its master 6 levels once; the frame
  submits 1 per frame and uploads `#c` once per frame. Not hull: 4 uploads per 60 steady frames are the station
  (`drawStation → gpuStation` gets a new 408² canvas about every 15 frames), 89 on the sweep are `gpuImage` bakes
  that follow the zoom (hotel, billboard, neon) and the station again, plus one `writeTexture` per frame
  (`gpuLtWrite`, the light table). Sharpness (Laplacian sd over the ship, 22f85fb → now): 760 35.1 → 38.6, ×1.5
  31.3 → 34.1, far plan 39.9 → 44.5; mean luma equal. Pairs `cutm1..m4_*.png`, sheet `mipsheet.py`, `sharp.py`.
  Still open (pass 2): the bake keeps hullPart1's painted ridge highlight under the GST light, so the body reads
  lighter than the 2D one — against the 2D path with crowns (cutm4) clearly lighter and pinker.
  `#c` zero (Контроль on 85a858c): the last four flight painters of `#c` draw in the scene pass. The lane (17g):
  buoys in one batch, the fire's halo laid over like the 2D paint (added, it burnt the cage white), the lamp a
  disc. Fleet ships (12ai1 `fleetShipGpu`) read the ctx matrix and alpha, so the lane, the fleet, gestures and
  the peace fleet leave at once: the body a sprite, nav and window lights discs, nozzles added (gain 1.3). Finds
  (17b): `findShape` split out of the draw and baked once per kind (`findSprite`, 4×); the echo glint a capsule,
  the beacon a disc, the satellite's ring a ring. The gesture post (17h): sign sprite, the lamp two added discs.
  An empty `#c` is not uploaded: 08c `gpuFrontHook` wraps the draw methods on the MAIN_CTX instance (a draw
  marks it dirty, a full-canvas `clearRect` clean), `gpuFrontCopy` returns early when clean and the front
  texture is cleared once by a pass. Kit: `gpuImage` takes a `gpuMipTex` master, trilinear through
  `textureSampleGrad`, one octave above the screen (`GPU_MIP_GS` .5 — at .785 the fleet pair lost 16 % of its
  Laplacian: 2D draws the ×3 sprite straight); fleet, finds, lane, post and the hull's belly are masters,
  uploaded once. Gate (pass 1b's stand): 60 steady frames — submits 60, `#c` 0, uploads 4 (the station); the
  120-frame zoom sweep — submits 120, `#c` 0, uploads hotel 17, Cheburek 21, billboard 22, neon 14, station 14
  (the next steps), plus fleet masters 31 and finds 7 once per sprite; `dirt.js` (who dirties an empty `#c`)
  finds nobody. Pair `cutfl_was/now.png` (760, Z 1.2, the lane with its fleet), sheet `mipsheet.png` (crop
  290,630–440,740 ×3): Laplacian sd 24.9 → 23.5, luma 22.4 → 22.6; per ship −7…−10 %, the rest of the gap is the
  2D lamps' `emit()` glow.
  `#c` zero fixes (Контроль on abc79be). The gate is a test: `tests/91zzzzzzy-gpugate.js` (browser tier, needs
  the GPU) runs 40 warm + 60 real `frameBody` frames on pass 1b's stand and asserts `#c` uploads 0, submits
  exactly 60, baked-canvas uploads 0 (the station is the named exception until its step), and names by stack
  whoever draws on an empty `#c` (dirt.js moved inside). Without the exception it goes red on «3×
  gpuCanvasTex<gpuLitSprite<gpuStation». Fleet sharpness: the 2D «was» is sharp because it draws the ×3 sprite
  with plain bilinear — aliased; level 0 on the GPU matches it (24.8 vs 24.9), an honest 4-tap area average is
  softer (22.1). So a master is sampled one step finer than the screen (`GPU_MIP_GS` .6) with an unsharp mask
  between two mip levels, c = s(l) + .9·(s(l) − s(l+1)) clamped (`GPU_MIP_SH`): both taps are filtered, so no
  ripple. Laplacian sd per ship was → now: 47.8 → 49.1, 57.8 → 58.2, 48.7 → 49.8, whole crop 24.9 → 25.3. Zoom
  series Z 1.00…1.28 (8 shots) against plain trilinear: the ratio stays 1.09–1.16 per ship, ±3 % frame to
  frame — the bumps are geometry, the mask adds no ripple. Lamps: fleet nav/window lights and lane buoy lamps
  are explicit emission, the dot painted plus a narrow added halo (2.2–2.6 of the dot's radius, gain .45).
  The mask is an option of the call, `gpuImage(…,{sharp:true})` (Контроль on 7083ac5: on text and neon it rings a
  light letter with a dark rim): on for fleet ships, finds and lane buoys (things); off for glows, the post's
  sign, the belly and every bake to come (hotel, billboard, neon), which take plain trilinear at `GPU_MIP_LOD`
  .785. The buoys are windows 1 and 3 of the fleet crop: without the mask −16 %, with it the numbers above.
  **Station master (17c3).** `stationMaster` bakes `drawStationBody` at `sb` px per station unit into a
  160-unit square (cap 4 masters, `gpuMipDrop` on evict) and `gpuStationDraw` lays it through `gpuLitSprite`
  at the hull LOD rule. Live pieces call `stLive(fn)`: while baking it records `fn` with the matrix in station
  units and skips it; in the frame `fn` runs with `ST_EM` set and pushes shapes — `stLamp`/`stLampRect` are
  explicit emission (the dot painted, an added core ×`ST_EMIT` .7, a halo 1.8 of the radius ×`ST_HALO` .35),
  `stBar` a painted capsule, `stSpin` a small spinning master of its own (ring, dishes), lit like the body. In
  2D `stLive` draws in place, so `stationArt` bakes exactly what it baked. The trade ring lies between two
  layers: `stSplit` after the ring cuts the master into «under» and «over» (core and containers cover the
  ring). The flare is a six-capsule chain along the tongue's centreline with the outline's half-width, the
  glow one soft added capsule, the smoke painted discs. Pairs `st_pairs.png` (six types, 760 ×1 | ×1.5, HEAD |
  now): luma +.2…+1.0, edge 97th pct +3…+8 % everywhere; the lamps are live now (the old bake froze them for
  18 ticks). Steady flight by the station: uploads 0, masters 1–2, spinners 1; the gate test runs with
  `GATE_OK=[]`.
  **Station layers as in 2D (Контроль on ec377fd).** The trade core showed a ghost, a rust line down its right
  edge and 2.4× the bright pixels: the «over» layer was lit by the relief of its own alpha, so the core's edge
  inside the body read as an outline. Now `stSplit` cuts the master wherever a live piece is covered later in
  2D — the trade ring (under containers and core), the yard crane (under the core), the industrial lamps (under
  the stripes) and the core's top lamp (under the flue) — into as many layers as needed; each layer is lit
  with the relief and the lamp/metal/glass verdict of the union master (`U`, all layers; GST reads it from
  `t2` when `V[3].w` is set), and its live pieces follow it. The chevron at the foot of the old trade core was
  not a drawn part: it vanishes from the old build with the solar panels off (not with the ring off) — the
  panel's glass glint (`glassG`, 6 px around) leaking across the outline onto the core. Trade core crop ×3:
  no ghost, no line, V > .55 +10 % (×1) / +15 % (×1.5); six-type sheet without swapped layers.
  **Zoom-following bakes (08c, 17j, 17k, 17k0, 17l).** Every sweep upload came from one-slot caches: a new font
  size overwrote the only canvas, and the Cheburek board keyed on the continuous scale `k` baked a new canvas
  every frame — that churn also pushed the neon and the billboard out of the 32-entry texture LRU. Now:
  `bakeKeep(map,key,cap,make)` (08c) holds a canvas per key (neon 12, board 6, billboard panel and strip 6
  each); the board's scale is `F/8` (the font's own step); `GPU_CVTEX_CAP` 32 → 64 so the kept bakes keep
  their textures. The billboard panel is baked at the exact scale when the zoom rests and, while it moves,
  the last panel is drawn scaled — no bake per frame, and at rest the frame and letters are pixel-exact.
  The hotel and Cheburek bodies are `gpuMipTex` masters with `{lod:.5}` (new `gpuImage` option): the old
  `gpuCvLevel` took the next larger level bilinearly, and .785 blended it with the one below, −10 % on the
  windows. No mask anywhere here. Numbers (stand 1b, 760): steady uploads 0; sweep ZOOM_MIN→MAX board 4,
  neon 10, billboard 3 (each size once), the way back 0; the hotel re-uploads its three masters (18 levels)
  when a window flips with the hour — content, not zoom. Pairs 760 ×1/×1.5 at Z 1.0 and 1.37: hotel edge
  101.2/125.4/84.5/112.7 vs 100.9/117.3/79.2/112.7, billboard and board equal or up, dark-ring count equal
  around letters; zoom series 1.00–1.28 now/was: hotel 1.004–1.080, billboard 1.000, board 0.999–1.058.
  The gate test sweeps the zoom there and back: no bake canvas uploaded twice, text bakes within their
  font-size counts (a board keyed on `k` again fails it: 8 > 6).
  **Instrument pod (25c).** `instrPodDraw` builds a signature first and returns when it matches the last
  one: needles at 1/256 of the scale (the tip on the ×2 canvas moves under a quarter pixel per step, so the
  chronometer creeping every frame no longer asks for a redraw), the misclose as printed, the tape's head,
  length and scroll, the pen jitter at 1/32, the canvas size, and the tape object itself (a loaded save
  brings a new one). Probe (system, 760, 120 frames each): idle 16 redraws / 3 453 canvas calls, was 120 /
  25 695; thrusting and turning 33, was 120. A kept frame and a fresh draw at the end of both phases differ
  in 0 pixels. The tape suite asserts no redraw on 10 unchanged frames, one on a new column, and a kept frame
  equal to a fresh one — compared only after the readbacks have moved the canvas to the software raster,
  whose arc antialiasing differs from the accelerated one (the first attempt read that as 31 729 bytes).
  **Item 3 — hull and flame colour (17c, 17c2, 16ga).** Reference: the merge-base build (2D, no GPU) through
  `shot.py` with its `drift.html` swapped, the same flight; the ship is found by hooking `drawHull` /
  `hullGpuDraw`, and body (front 2/3 of the hull box) and flame (12 nozzle radii behind the tail) are measured
  in hull axes, per pixel of area (the GPU ship is 1.26× larger since `shipScaleCap`). Three causes:
  (1) GST gave the hull the station's light — up to ×3.1 on the lit side, and every saturated pixel (the red
  trim) went into «own light» ×2.3 and past the glow knee to pink. A hull flag (`glow` −1) now shades as
  `gpuHullLight` did in 2D: the bake as painted, a shadow slope ≤ .4, the star as rim and slope, no lamp gain;
  the flame's point light on its own hull at .2. (2) The trail's white core and the white-hot root sat under
  the L4 plume and added up to white (plume S .21 → .38 with the trail off): the ribbon now fades in past the
  plume's length, the root is .2. (3) The hull flame's plume and glow gains 2 / 3.2 → 1 / 1.2 (core 2.6 kept).
  Numbers (2D → HEAD → now; ×1.5 | 760): body V>.6 per area 11.6 → 32.7 → 17.1 % | 12.6 → 35.2 → 19.2 %;
  mean L 91 → 107 → 87 | 88 → 109 → 89; S .18 → .26 → .30 | .17 → .25 → .29; red per area 1.3 → 0.7 → 2.1 % |
  1.1 → 0.5 → 1.6 %; edge/L 1.09 → 0.96 → 1.05 | 1.49 → 1.28 → 1.40; flame orange per area 4.0 → 1.9 → 6.3 % |
  0.9 → 7.2 → 13 %, S .25 → .16 → .23 | .24 → .17 → .25. The body's bright excess left is on the rear pods,
  lit by the plume and the wake (mask vm_b10_d); nose and waist match 2D. Halving rim and glint cut it by a
  tenth and cost sharpness — not taken.
  **Item 3, the pods.** The order was right and so was the light: with the plume, ribbon, wake, hull flame and
  every L3 light off the rear body stayed at V>.6 39 % (2D 26 %), and the unlit bake without GST at 46 %. The
  whitening came after the scene — the final glow's first level takes the square of the frame (`c*c`, «as in
  2D»), so a light grey hull glowed from its own paint and the glow lay back over it (glow off: 43 → 24 %,
  mean L 87 → 74). Now a ship's own paint — the hull mask (scene alpha) inside its circle `u.hl`, which the GPU
  hull now fills as the 2D hull did — goes into that level at half; knee light and emission as before;
  stations untouched (trade/yard/sci ×1 and ×1.5: luma ±0.1 %, bright −1 % from the ship in frame). The
  hull's shadow slope eased (.3/.15/.4 → .2/.1/.3) so mean L does not drop with the glow. Numbers (2D → HEAD →
  now; ×1.5 | 760): body V>.6 per area 11.6 → 17.1 → 13.0 % | 12.6 → 19.2 → 14.3 %; mean L 91 → 87 → 81 |
  88 → 89 → 83; edge/L 1.09 → 1.05 → 1.19 | 1.49 → 1.40 → 1.60; pods' strip L 48 → 62 → 58 | 46 → 59 → 55,
  bright L 151 → 166 → 164 | 156 → 172 → 177, S .25 → .24 → .25 | .22 → .15 → .14; flame L 169 → 167 |
  171 → 168, orange up; wake unchanged. What stays white along the pods is the wake: in 2D it is the long
  blue-grey bar beside each pod (additive, `lighter`), here the same lanes with a gaussian core (a×1.25,
  halo ×2.3) — brighter and near-white at the stern. Composing core over halo as two 2D strokes cut it by 4 %
  and did not cool it; the wake was left as it is (Контроль: not to be touched). 08b 47156 → 47017 bytes.
  **Item 3, the wake at the stern** (Контроль's call after ee46b87). Each wake node's gaussian peak (core×1.25
  + halo×2.3) is capped at the 2D peak of its two `lighter` strokes (halo f1 + core u³·.26+u⁶·.30) within 20
  hull units of its nozzle, fading out by 26; beyond, untouched. The cap goes by distance, not by age: at cruise
  the stern and the next two hull lengths are the same last 5 % of a point's life, so an age window (u > .6,
  then u > .93) dimmed the far lanes as much as the near ones (far L 70 → 53). Numbers (2D → HEAD → now;
  ×1.5 | 760): pods' strip L 48 → 58 → 52 | 46 → 55 → 50, S .25 → .25 → .35 | .22 → .14 → .20; lanes at the
  stern (5–22 units) V>.6 10 → 24 → 16 % | 10 → 22 → 14 %, L 51 → 83 → 74 | 53 → 83 → 75, bright rgb
  (174,178,194) → (173,178,194) | (182,186,198) → (185,190,200), hue ≈ 225°/220°; lanes 25–60 and 60–120
  units behind: L 69.6/76.6 → 69.3/76.6 | 67.1/99.8 → 66.8/99.8 — as before. Gate suite green (16).
  **The hotel's windows as live shapes.** `hotelPaint(sd,mask,col)` is the old painter; `hotelBake(sd,col)` runs
  it twice (all dark, all lit) and stacks the two in one atlas per layer (cv, em, sh; 16 px apart so the mips
  do not mix), plus each window's box (`hotelWinBox`: glass, the balcony before it, the glow's margin, whole
  pixels; neighbours never overlap — two balconies overlap in the drawing, the right one on top, so the
  border between their boxes is where its glass begins). The frame draws, per layer, one `gpuImage` call: the
  dark house whole plus the lit boxes from the lower half. Paint is opaque in a box, so over replaces it; the
  dark house has no window light, so em just adds; the sign's sheen is in both, so its lit boxes (the top
  rows only) go as sub of the dark piece and add of the lit one — a `sub` blend (reverse-subtract) joined the
  kit (08c). The 2D branch builds the house by the mask from the atlas into its own canvases, only when the
  mask changes. Found on the way: the light under a balcony and behind «ПРОДАЮ» was erased with whatever
  fill came before (.22 after a lit balcony, full in a dark house), so a window's look depended on its
  neighbours; now a fixed veil `HOTEL_VEIL` .22 — the evening look as it was. Numbers: the atlas against the
  old paint by the same mask — all dark and all lit exact, half lit: paint ≤ 11/255 on 35 px, light ≤ 54/255 on
  143 px of 70 k, all on the seam of two overlapping balconies with only one lit (below one screen pixel); the
  house on screen, HEAD → now, 760 | ×1.5, 20 h: mean luma 105.18 → 105.17 | 94.69 → 94.68, top 1 % the same,
  max |Δ| 9 | 7; 3 h: 91.64 → 91.63 | 77.23 → 77.22, max |Δ| 5 | 4. The 2D branch against the old paint at
  20/3/8 h: max 2/255. Uploads on a day of flips (8 hours × 3 flicks, ≥ 8 lit sets): 0, the house not
  re-baked (new suite in 91zzzzzzy-gpugate; the zoom gate no longer excuses the hotel). Three atlases of
  320×452 instead of three 320×218 masters re-uploaded on every flip.
  **Release rehearsal.** Four suites went red in `-Full`, none an order leak of the old kind — each read the
  2D frame of before stage 1. The hands (`T.ledger`/`T.text`) counted text only on `#c`, and the text now lives
  on the `#hud` layer and in the label and chip canvases under `#chips`, redrawn only when their key changes:
  the ledger now forgets those keys before the frame and counts all three, each at its own density. The clean
  start now knows `#chips` (transparent, no events). The memory bound on canvases in textures is
  `GPU_CVTEX_CAP`, not 8. The hotel gate bakes its house before it starts counting. `-Full` 897/897 (quarantine
  aside), Node 673/673, golden frames in 1280×800, 390×844 and 1440×1440 unchanged — nothing re-shot.
  **Combat off #c.** dirt.js on the combat stand counted every call on #c in 151 frames: the pirates' live layer
  (`drawPirate`: soot, damage spots, the hole's fire, smoke — 2616 fills, 260 strokes; `drawFlame` 912), the
  bars (`drawCombat` fillRect 684), missile bodies (`mslDraw` 286), lock brackets (`helmDrawMarks` 130). Hulls,
  bolts, beams, missile flames, booms and bursts were already on the GPU. Now: the live layer is
  `gpuPirateLive` (12i) in two calls around the hull sprites — under: the flame through the ship's own shader
  (`gexDraw`, 16ga, now shared: the pirates' list has its own buffers, two writes to one buffer in a frame
  would both land as the last) plus the brush's nozzle halo as an added soft disc, soot as soft discs; over:
  spots with a scale rim, the hole's fire added, smoke. Bars, shield and burn threads, loot beacons, edge dots
  and brackets are `gpuShapes`; the loot box is baked once per colour (`lootIcon`) and laid mipped with its
  spin. Without a GPU every painter keeps its 2D branch. dirt.js after: 0 calls on #c. Pairs HEAD | now
  (760 ×1, 411×742 ×1.5, 760 at ×2.6 and a close-up at ×5): brackets and bars lose the doubled soft edge the
  #c copy gave them; pirates, the missile and the boom the same — changed boxes mean luma ±1, top 2 % the same
  or up (the pirate's tail 139 → 135 at ×5 is the bracket's old ghost, not the flame), the launch puff differs
  in shape only: `drawFlame` no longer draws `rndFx`, so the effect sequence shifts (no game chance involved).
  Gate suite «бой» (91zzzzzzy-gpugate): 60 frames of combat after a 40-frame warm-up — #c uploads 0, dirt 0,
  submits 60, uploads 0; with the missile bodies put back on #c it goes red naming `mslDraw`.
  **Wrecks and the «left».** `npcWreckDraw` (13d): a rim ring then the disc (stroke, then fill over its inner
  half, as the brush did), «КОРПУС» a DOM label. `leftDraw` (12as): the hull trace is the hull's GPU bake
  (`hullGpuBake`, 17c2) laid mipped at .22 — without the nav lights the brush used to add (the comment always
  said «без огней»); the marker is a one-pixel rim and a fill, its caption a DOM label. dirt.js on the stand
  (two wrecks, a trace and a marker 25 units apart): 302 strokes/fills/texts per 151 frames and 604 hull fills →
  0. Pairs 760 ×2 | 411×742 ×1.5: trace mean 20.2 → 19.8, top 5 % 50.3 → 49.5; the marker 36.2 → 36.3; wrecks the
  same. Gate suite «после боя»: 40 frames — #c 0, dirt 0, submits 40, uploads 0; red naming `npcWreckDraw`
  when the wreck goes back to #c.
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

## 8. Session 2 (worktree drift-gpu2, branch gpu2): fleet, pirates, combat

- **Fleet captions off #c** (Контроль, for 0.458.0): the tour census never met a ГЛАВТРАССА ship (the line
  starts at rung 5), and `drawFleet` (12ai) still wrote its two caption rows with `fillText` on `#c` every frame
  — dirt.js on a fleet stand: 6 `fillText:drawFleet` per shot, everything else 0. Now `domLabel` (keys
  `fl`+class+seed). Pair 760 ×1 and 411×742 ×1.5: the same caption, a touch cleaner (no `#c` copy); dirt 0,
  gpu errs 0. The census gate gains the scene «борт ГЛАВТРАССЫ с подписью» (a fleet window put in the system's
  cache, the label checked on the label layer) and `drawFleet` in its upload net; mutant `fleet-caption-on-c`
  (the caption back on `#c`) dies on it.

- **Ships a) for the fleet** (side branch `gpu2-fleetlit`, not in 0.458.0): a ГЛАВТРАССА ship in the system is
  lit by the star through `gpuLitSprite` in hull mode (−1): paint as baked, the far side in shade, the rim in
  the star's colour; the station multiplier (0) whitened the nose and the emblem. Its bake keeps a softer copy of
  the 2D top light (.34 on top, .3 dark below instead of .62 — the star lays the shade, a double shade killed the
  panels); the mip level is `FLEET_LOD` −1.2 (GST has no unsharp mask). A fading lane ship keeps the old picture
  (GST has no alpha). Three positions at 760 (star lower right, left, upper right) and ×1.5: total light
  +0.6/+2.0/+1.2 % and +1.3 %, V>.6 area +1…+15 %, S of the bright .28 vs .21, sharpness +4/+8/+6 % and +1.4 %,
  p95 −2…−5 % (the centre gives up to 7 % to the far-side slope). Gates «ворота ступени» green.
- **Allies on the GPU** (`12a`): `drawAllies` drew each hired hand's hull in 2D and called `gpuHullLight` inside the open scene pass - one #c copy and two extra submits per ally, and the frame's command buffer broke (a black frame, 12 GPU errors per six frames). Now `allyHullGpu` draws them through `hullGpuDraw` like the player's ship, lit towards the star; the thrust smoothing is kept per ally (a WeakMap) so an ally on the player's hull does not share his flame. 2D + `gpuHullLight` stay for no-GPU. Six frames: #c copies 18 → 0, submits 30 → 6, dirt 0, errs 0. Hull (2D fallback → GPU): light sum −0.1 % / −2.2 % at 760, 0 % at ×1.5; body mean V +12 % / +4 %; sharpness ×2.1 / ×1.7 at 760, ×1.8 at ×1.5; the V>.6 area grows ×2–2.5, all of it the star-coloured rim (S of the bright .21 → .33). Gate scene «союзник и наёмник в кадре», mutant `ally-hull-2d`.

- **World labels under the interface** (`08bh`, with the worker's leave): the label layer shared `#chips` with the edge chips, and a label made later sat on top - at ×1.5 an ally's caption glued itself onto the compass chip's digits. Labels now live in their own `#labels`, placed right before `#chips` with the same style, so chips, tiles, pads and the rack stay above every world label; the frame snapshot draws labels first too. The ally gate scene checks the order (same parent, labels first, same z-index, every label inside), mutant `labels-over-chips`.
- **Pirates b)** (`12i`, side branch `gpu2-fleetlit`, Контроль's choice b): the station light (glow 0) stays; the hull is a mip master (`gpuMipTex`, level `PIR_LOD` −1.6 past 1:1) with an unsharp mask by luminance, radius = the bake's ss (one screen pixel), k .6, only the dark side lifted (e·(1−Y)²) — the station multiplier whitens anything brightened, so a symmetric mask cost S of the bright. The master is built in parts, one part a frame for all pirates (`pirMaster`: read in 5 row strips with luma, rows 2, columns 2, mask 2, mips 1 — 12 frames), the raw bake drawn meanwhile as before; the GPU bake canvas is `willReadFrequently` (Chrome moved it to memory itself on the second read, 40–55 ms at ×4). At ×4 throttle (loaded CPU): three masters in one frame were 180 ms of JS, the mask 105 of it, the mips 10; now a part is 1–6 ms, the first strip of a master 12–18 ms; the first frame (three bakes) 96–115 vs 68–75 before. Gates: light −0.8…−1.7 %, V>.6 area −2…−5 %, S of the bright not down, sharpness +3.6…+17.6 % (760, ×1.5, two star positions); #c 0, submit 1, uploads 0 after warm-up (was 20), errors 0. The whole thing goes when the pirate bake moves to the GPU canvas (`gpuBake`).
- **Barge, shuttle, loot on the GPU canvas** (API v1, side branch `gpu2-fleetlit`): the three bakes are `gpuBake`/`gpuBaked` now, drawn by the same brushes into `ctx`; no 2D canvas, no upload. The barge (`12l`) lost its 2D top light and edge (`if(!GPU.on)`) and its `drawImage` fallback; no GPU — `art.cn` is null and nothing is drawn. Its mip level is `BARGE_LOD` −2.5: at −1.2 the near shot was 7–11 % softer (the old path sampled level 0 of a ×3 canvas), at −2 the far zoom still lost 3.8 %; −2.5 is level 0 up close and 1.5 steps finer than the screen far away. The shuttle (`17f`) is drawn with `{sharp:true}` (plain trilinear was −24 % sharpness at 760). The loot box (`13`) keeps `{sharp:true}`. Gates, 17 crops (two barges, four boxes, the shuttle; 760 ×1 and 411×742 ×1.5; zoom 2.2 and .45): light −0.1…+0.6 %, V>.6 area within 1 %, S of the bright ±.002, sharpness −0.3…+13.8 % (shuttle +9.4 % / +13.8 %), ×4 crops equal to the eye. Stand: 0 2D calls in these bakes, `GC_MISS` empty, #c 0, uploads 0, errors 0. `drawHaul` (`16c-rescue`, handed to me by Контроль) lost its no-pass 2D branch (130 lines: debris, flames, the `haulRim` rim mask with `drawImage(art.cn)`, puffs, boom, rope) — with a GPU it never ran, without one there is no game; `haulGpu` draws all of it.
- **Caption width from a cache** (`labelW`, 12ai, shared with 13; the 2D census of 25.09, rows A3/A9): `drawFleet` set `font`/`textAlign` and called `measureText` on `#c` every frame (~22 calls with two ships), `drawCombat` `font`+`measureText` (~1.5). Now `labelW(font,text)` measures once per text (a module Map, cleared at 256) and the frame calls no text on `#c`; with v2 its source becomes the GPU canvas's measure. Census (411×742 ×1.5, 120 frames): the text calls of both are gone, one miss per caption left on warm-up; frames equal (pirates max Δ 0; fleet Δ 6 only in the DOM action button's CSS pulse).
- **`#c` is cleared only when drawn on** (08b `gpuFrame`, `gpuOver` ×2; the worker agreed; Контроль's «чистый полёт» step 1): the invisible `#c` was cleared whole every frame and after every `gpuOver`, dirty or not — on the phone that full clear is Chrome's frame-rate limiter. Now each clear runs only when `GPU.cState!==0` (08c's hook: 0 after a full clear, 1 after any draw; unset before the hook — cleared). The −Full census of the same day: 14 modes still draw on `#c` with the GPU on (surface 1.9 M calls, base, map, raid, landing, dig, home, wanderer, spa, belt cockpit, winter, scoop, cave; in flight only the bazaar 17n, `drawPlanetWorks` 17e and `drawAbil` 16c), so `#c` stays a real canvas until they move. P1 census (4 scenes, 411×742 ×1.5): 2D calls a frame −1.2 each, frames max Δ 0 (the DOM button's CSS pulse aside); −Full 18960 and Node 16872 green.
- **The fleet on the GPU canvas** (12ai1 `fleetArtOf`, `fleetShipAt`; 12ai `drawFleet`, `labelW`): both fleet bakes — `cn` (its own light, for `gpuImage` {sharp}) and `cnA` (the softer one the star lights through `gpuLitSprite`) — are `gpuBake`s of one brush, text on the band through v2; the wear patches are drawn from the ship's `r()` once, before the bake, so a re-bake after a device loss paints the same ones. No `gpuMipTex`, no 2D canvas per ship; `drawFleetShip` lost its 2D branch, and `drawFleet` hands `fleetShipAt` the matrix itself instead of save/translate/rotate/scale on `#c`; caption width is `gcMeasure`. The star-lit path takes the lit-sprite mask (`gpuLitSprite` sharp) at `FLEET_LOD` −1.2. The mask is Контроль's one formula (17c, flag 2): the detail is luminance against the coverage-weighted mean one level up, one multiplier on rgb, capped so no channel passes coverage, alpha untouched (the worker's first cut masked four channels with alpha and made pirates brighter and softer). Up is scaled by (1−Y)² — the light multiplier lifts the bright up to ×3 anyway; for the fleet down is scaled the same, because the full-strength darkening of pirMaster cost it 1–3 % light at −1.0. Probe history: −.8, the worker's pick against a 2D reference, lost 1–5 % sharpness at far zoom against the old −1.2 without a mask; −1.2 with the four-channel mask gained +2…+7 % but shimmered 5–6 % more on the worker's half-pixel probe; −1.0 (interim, cf14de4) lost 1.1 % on a far tanker; with the luminance mask −1.0 lost up to 2.8 % and −1.2 passes: sharpness +0.6…+5.2 %, light −0.8…+0.1 % (the far tanker −1.2 %, its dark seam), V>.6 −1.2…+1.4 %, shimmer 10.3 against the old unmasked 10.4. Gate, 7 classes, 760 and 411×742 ×1.5, near (2.2) and far (.45) zoom plus a 0.9-alpha pass (the `gpuImage` path): light −0.7…+0.4 %, V>.6 area −0.8…+5.9 %, sharpness +1.6…+6.9 % (alpha pass ±0.2 %); the one light dip, the tanker at far zoom −1.3 %, is its dark seam under the band going darker (83→72), not a dimmer surface. GPU errors 0, `#c` uploads 0; 2D calls per fleet bake 142–678 plus 12–14 per mip copy → 36, all in the glyph source's line raster; fleet calls on `#c` ~12 a frame → 0.
- **Pirates on the GPU canvas** (12i `pirateArtOf`, `gpuPirateBody`; 13 `drawCombat`): the pirate bake is a `gpuBake` of the same brushes (`PIR_SS` 3; the scar RNG is consumed inside the draw, so a re-bake after a device loss is the same ship). `pirMaster`, `pirBox` and the parts-per-frame master are gone, and so are the 2D light block and `drawPirate`; no GPU — `art.cn` is null and nothing is drawn. The body is lit through `gpuLitSprite` with `sharp:"dark"` (flag 4): pirMaster's rule — down at full strength, the seam's shadow by a bright weld is the sharpness — and a band not narrower than a 5.5-texel box (`GPU_LIT_DK`; pirMaster's box was 7 at the ×3 bake): the next mip at level 0 is a 2-texel box, and near zoom and the phone, where the level clamps at 0, lost up to 11 % sharpness with it. A 7 band darkened the deserter 1.8 %, 5 lost 0.9 % sharpness; 5.5 is between. The GPU-canvas bake itself equals a 2D bake of the same draw within 0.1 % light and 0.6 % sharpness (a same-variant calibration run removed a 5–15 % screen-position bias from the first probe). `PIR_LOD` stays −1.6 (−1.4 lost 2–3 % sharpness). Gate against the pirMaster build, six pirates (fast, heavy, flag, deserter, two hurt), 760 and 411×742 ×1.5, zoom 2.2 and .45: light −0.4…+1.2 %, V>.6 −0.8…+8.8 %, sharpness −0.6…+3.3 %, shimmer on the half-pixel probe 11.7–11.8 against pirMaster's 12.2. Pirates have no alpha path (they never fade), so the 0.9-alpha pass does not apply. 2D calls in pirate bakes 0, `#c` uploads 0, GPU errors 0.
- **Own hull on the GPU canvas** (17c2 `hullGpuBake`, `hullGpuBelly`, `hullGpuDraw`; 17 own ship, 12a allies, 12as ghost; «чистый полёт» row 4): the body is a `gpuBake` of the same brushes (`hullPart1..3` at bank 0, ss 1 — ss 2 came out dimmer and softer), the bank belly too; no 2D canvas, no `gpuMipTex`, eviction by `gpuBakeDrop`. The system mode and allies lost the no-GPU branch (`drawHull` on `#c` + `gpuHullLight`), and with it the `ally-hull-2d` mutant, whose code is gone; `drawHull` and its 2D bake (03e1) stay for the interface, road, scoop, hangar and `makerRead`, which draw on their own canvases. The body's mip level is `HG_BODY_LOD` −.45 (stations keep `HG_LOD` −.35): the bake's mips are the canvas's 2×2 box, the old master's were Skia's downscale, and at −.35 the lit body was 0.3–0.9 % dimmer with one hull 1.2 % softer. Mitchell and Catmull-Rom mip filters (tried locally in 08ca, not kept) were 5–10 % softer than the box; the sharp mask on the hull darkened it 1 %. The GPU bake itself matches the 2D one 1:1 (obod: alpha −0.4 %, colour +2.4 %) except a white miter spike at one tail hook (GcCtx, told to the worker). Gate against the 2D-master build, 8 hulls (`SHIPS`), 760 and 411×742 ×1.5, zoom 2.2 and .45, bank 0 and .5, UI hidden: light −0.9…+0.8 % (mean −0.14), V>.6 −3.8…+7.1 % (tens of pixels far out), sharpness +0.2…+7.8 % (mean +4 %); shimmer on the half-pixel probe (strizh, obod, mamont, vyuk) +1.4…+2.9 % against the 2D master, the same as the bake at −.35 and inside the ±4 % run noise. 2D calls in the hull bake 1140–1833 per hull → 0, `GC_MISS` empty, `#c` uploads 0, GPU errors 0.
- **Flea market on the GPU canvas** (17n `drawBazaar`, `bazHulk`; «чистый полёт» row 17n): each dead hulk (body + the .6 film) is one `gpuBake` per hull (master at the largest hulk, s 1.6 × sc .58, quarter-octave step; mips below, `HG_BODY_LOD`); poles, sagging tents (strips with hard inner seams, seam count by on-screen length ~3 px), their outline, wires and pendants are `gpuShapes`; bulbs and halos add. The halo was a radial gradient 0→5s: now a soft disc to R+.5 px at alpha ×(1.1−.35/R), which matches the cone's light within 3 % at the same peak; a bulb under .7 device px is an equal-area square (`covDisc` would smear it to .7 px and lose the peak). The sign is part of the scene, not a label: a `gpuBake` of the text (ss 2, device pixels, placed on a whole device pixel) drawn in the scene pass, so bloom gives it the halo the 2D text on `#c` had (a `domLabel` was 4–10 % dimmer with no halo; `#ovl` is the path for the interface). Hulks carry no nav lights or ticker (dead, as D20 says); the idle nozzle glow is baked at its mean. Gate on a stand (4 seeds × s 1.6/1/.7/.5, 760 and 411×742 ×1.5, time frozen): 2D calls 185 k → 0 per run, `#c` uploads 6 → 0, GPU errors 0; cluster at s ≥ 1 light +0.9…+3.2 %, V>.6 +14 %, sharpness +5…+9 %; the film is inset 5 %: in 2D the film edge and the hull edge were antialiased separately, so the rim pixel got half the film and the far plane read by that light rim; now the rim is intended, the outline of the body (body, outline, one light). With it, all cells: light +1.9…+12.9 % (s .5 +1.9 %), V>.6 +17…+51 %, sharpness +0.3…+16.5 %; sign +2…+7 % light, same letters.

## 9. Session 3 (worktree drift-gpu3, branch gpu3): stage 2, the belt

- **Belt world off #c (Контроль 25.09, stage 2 item 1).** `drawBelt` hands the world to `beltGpuDraw` (24ba) when
  a scene pass exists; the 2D path stays as the fallback. The sky is one field (`belt.sky`): background gradient,
  four nebula spots, the star disc with its halo or the off-screen glow, and the belt band — the ring around the
  camera lies in a plane through it, so it projects to a straight line, and the seven width steps are laid with
  soft edges (the 2D staircase is gone, same integral). Stars, far rocks and dust are kit rects/oboxes; rock faces
  are kit triangles in the same depth order, an edge towards a visible neighbour hard (adjacency per face set,
  three sets for the whole game) — no conflation seams across the mesh. Landmarks (24bb) are kit shapes too:
  polygons fanned from the centre, butt lines as oboxes, the ring's arc as a quad strip, the druse prisms as eight
  slices of their gradient; the maw's hole is the one bake (circular gradient clipped to the ellipse, as in 2D,
  uploaded once). Fog darkens colour as in 2D, never alpha. `hashi3/noise3/fbm3` moved to 24ba so 24 does not
  grow. Numbers (gate suite `91zzzzzzy1`, 60 frames with all five landmarks in view): world calls on #c 0 (was
  ~70 000 per 60 frames from drawBelt), submits 1/frame, uploads 0; the cockpit and glass are the only #c
  painters left (259 calls/frame, one #c copy/frame) — the border with the instruments, next step via Контроль.
  Mutants `belt-gpu-off`, `belt-poi-2d` red. Pairs (2D | GPU, same build via `beltGpuDraw=()=>false`): belt 760
  max|Δ| 37, mean +0.1/+0.6/+1.3 (band smooth, rock seams gone); phone 411×742 ×1.5 the same; landmarks 760
  max|Δ| 25 in the maw crop. gpu errs 0.
- **Belt cockpit and glass on `#hud` (Контроль 25.09, stage 2 item 2).** The border as agreed: the cockpit and
  the glass symbols are interface, so they go on the `#hud` layer (08bh `gpuHud`) at native DPR, rastered only
  on change; 25c is not touched. The key was first not a hand list (replaced by the hand key, next line): every frame the painter runs into a recording
  context (24bc, a Proxy that logs calls and properties, coordinates at 1/16 px, angles at 1/4096 rad, text
  measured by a real context) and the layer redraws only when the log differs — no state can be missed, and
  needles creeping under a sixteenth of a pixel do not ask for a raster. The painter is pure (no `rnd`, no
  writes to `G`), so the second run on the real layer draws the same. The strut lamps blink on their own:
  the dark lamp stays on the layer, a lit one is a small native-DPR canvas above it, registered in `LABDOM`
  so the flush hides it when unlit and the snapshot carries it. Gate `91zzzzzzy1`: `#c` calls 0 (cockpit
  259/frame before), `#c` copies 0 (was 1/frame), submits 1/frame, uploads 0; at rest (ship stopped, no
  controls held) 0 redraws in 60 frames. Pairs 760 and 411×742 ×1.5: the same picture (max|Δ| 68 / 201 on
  glyph edges, mean +0.7 — the cockpit no longer goes through the post). 390×844 ×2.625: the panel's
  needles and text sharp, top strip mean +2–3. Left: the node holder's swing and crown pulse (only with a
  node fitted) still redraw the layer while they move.
- **Belt cockpit key by inputs; the recorder moved to the gate (Контроль 25.09).** Measured at 4× CPU
  throttling, 411×742 ×1.5: the recording key cost 26–30 ms and ~430 KB of garbage per frame, about three times
  the draw it guarded. Now `bhudKey` (24bc) is a hand list of the painter's inputs, like the 25c pod signature:
  basis and angles at 1/16384, speed and velocity direction, lock and progress, hit, fuel/hull/cargo, the radar
  points at 1/16 px, the board lamps, the node holder, the grips. The pod signature (`instrRead`, the dearest
  input) is read every 4th frame: a needle may lag up to three frames, any other change redraws with fresh ones.
  The recorder is now the oracle in gate `91zzzzzzy1`: no frames, each of 22 steps changes one input by hand
  (camera by the 24ba formula), and a changed call log with the same key fails — «протокол сменился ⇒ ключ
  сменился». Mutant `belt-hud-key-fuel` (key without fuel) dies on step «топливо»; `belt-hud-2d` re-aimed at
  the new call. Cost against the direct 2D draw, same throttling (loaded machine, absolute ms inflated): at rest
  push 10–12 → 3.1–3.3 ms, frame 83–89 → 57–61 ms, cockpit garbage 38–39 → 29 KB/frame; while moving the layer
  redraws every frame, frame 123–413 → 102–360 ms, garbage 41–66 → 64–109 KB (key plus raster).
- **Belt cockpit: no garbage from the key, less from the painter (Контроль 25.09).** In flight the layer redraws
  and garbage there is a GC hitch on the phone. `bhudKey` now allocates nothing: numbers go into a preallocated
  `Float64Array`, strings and refs into a preallocated array, compared in place; the key string for 08bh is built
  only on change, and the draw is one module function (no per-frame closures). Radar: rocks do not move (the wrap
  follows the ship), so the key holds the ship position at a quarter pixel of the scope instead of 105 rocks.
  Display step instead of float noise: camera angles and basis at 1/(4·max(W,H)) rad (the roll relaxing 5 %/frame
  after a turn redrew the layer every frame in straight flight), the target as what is seen — frame place and size
  at ¼ px, metres. Painter, picture unchanged (pairs 760 max|Δ| 3, 411×742 ×1.5 max 16 mean 0.04): index loop and
  squared range on the radar, cached font strings and lamp-label width, `cockpitTex` without a key string per call,
  lamp canvases compared by numbers. Oracle: lock cleared after warm-up, pod pinned whole, steps «время» (G.t
  only) — mutants `belt-hud-key-fuel`, `belt-hud-key-radar`, `belt-led-hud` die. Cost at 4×, 411×742 ×1.5,
  medians of 4 runs, the direct path of 5b44b5c → now: turning flight 38.6 → 31.6 KB/frame, frame 52.7 → 43.1 ms;
  straight 39.8 → 19.4 KB, 53.6 → 46.3 ms; rest 33.2 → 3.8 KB, 51.3 → 40.0 ms; push 5.5 → 0.47 ms. In flight with
  a target the layer still redraws every frame (the metres change) — a separate cached dashboard layer would cut
  that, at the price of another native-DPR full-screen canvas (~10 MB on the phone); not done.
- **The 25c pod is not drawn while CSS hides it (Контроль 25.09, the 2D purge, item 3).** On the phone the pod
  canvas was redrawn ~10 times a second under `display:none` (`@media (max-width:720px)`), and a canvas outside
  the compositor makes every draw wait for the GPU process tail. `instrPodTick` now draws only when the pod can be
  seen: one `matchMedia("(max-width:720px)")` with its change event (no style reads in the frame) and the
  `inflight` mode list of 27z. `IPOD_SIG` is left alone, so the pod redraws when it wakes if anything changed.
  411×742 in the system view: 3077 → 0 pod canvas calls per 120 frames; 900 px wide unchanged (visible, drawn).
- **Lane buoys off 2D (the GPU canvas, port 1 of GPU-3, 25.09).** The buoy (`laneBuoySprite`) and the lamp halo
  (`laneGlowSprite`, the old `glowSprite` gradient) bake through `gpuBaked`; the queue ships stop borrowing the 2D
  matrix stack: `laneShip` hands its place to `fleetShipAt(f,art,a,b,c,d,e,f,al)` in 12ai1 (`fleetShipGpu` is now
  `getTransform` → the same call). The 2D fallback of `drawSysLane` is gone (no device, no lane). Census, the lane
  scene, 120 frames with a zoom sweep: 17g's own 2D calls 22 → 0 a frame; what is left under it (12 a frame, all at the first sight of a queue
  ship) is the fleet art itself — `fleetArtOf` paints a 2D canvas with the hull name (`fillText`) and
  `fleetShipAt` uploads its mips by 2D downscale: v2 (text) moves it. Pairs l0|l3 (760, 411×1.5, far zoom .45):
  whole frame max |Δ| 22 / 21 / 8, 0 pixels over 24, luminance equal; the ships bit-identical. The one soft spot is
  the lamp cage ring (a 0.5-unit stroke): −2…−4 of 255 at 3–4 px from the lamp, +1…2 inside it, the lamp region
  −0.5 % luminance, edge energy equal. It is the mip kernel: `gpuMipTex` built levels by 2D `drawImage` at
  `imageSmoothingQuality="high"`, the GPU canvas by a 2×2 box. A bake at the screen size (√2 buckets, level 0) was
  tried and is worse (edges −3 %: bilinear sampling of a rotated sprite near 1:1), so the master stays ×4 and
  the kernel goes to the worker. New suite `91zzzzzzy3-gate2d` («0 вызовов 2D»): counts every 2D method and
  setter whose stack holds a scene's painter, from the first frame (bakes included), named holes only
  (`fleetArtOf`, `fleetShipAt`); mutants `lane-ship-2d`, `lane-glow-2d` die on it.
- **Planet strip → a generation shader (`17gb-gpu-planet-strip`).** The strip (07: longitude across, sine
  of latitude down; `fbm2` height, palette ramp, polar caps, life tint from `planetWetAt`, gas bands, the
  right-edge crossfade) was baked on the CPU row by row under a frame budget (`planetStripTick`, `STRIP_*`),
  put into a 2D canvas and uploaded; cities read it back through a 256×128 `getImageData` mask. Now
  `gpsBake` draws the requested level in one pass (same formula, `hashi` on u32 in WGSL, its own submit),
  `planetStrip` returns `{tex,view,w,h,lvl}`; the level only rises, a lost device re-bakes. The CPU formula
  stays once, `planetStripPx`: cities get land lazily per cell (`gplLandAt`: bilinear to the grid, byte
  rounding, the palette projection as before) — tens of cells instead of 32 768, no 2D, no readback.
  Probe on 9 planets × 3 levels: shader = formula within 1 LSB (0 bytes off by more than 2); land cells
  equal to the old canvas path at level 1, 0.1–0.7 % differ at levels 0/2 along coasts (Skia's 8-bit
  bilinear). Pairs vs 10f8681: planet disk max|Δ| 1–2 at 760, ×1.5 phone, far zoom (Z .42) and gas; ×4
  crops of limb, terminator side and coasts equal in luminance and edge energy; the only >24 pixels are the
  DOM button pulse. 2D census «планеты» 0 calls (was the strip's putImageData + the mask's getImageData).
  Gate `91zzzzzzy3-gate2d` gains the planet scene (strip dropped first, so the bake runs under the hook;
  buildings give city lights); mutants `planet-land-2d`, `planet-strip-2d` die. The memory suite now
  counts strip textures (on planets, not in `GPU.cvTex`); `bakeIdle` and the bake suite lose `STRIP_*`.

- **Hotel (17l) → three GPU-canvas bakes, cut across frames.** The atlas (house with all windows dark above
  the gap, all lit below) was six 2D half-canvases, three uploads and 2D mips. Now `hotelPaint` is a generator
  (one step = a floor or a part of the house) that records paint and window light at once into two `GcCtx`
  of the bake's size and ss; `hotelBake` runs its steps until `HOTEL_MS`=3 ms (cap `HOTEL_STEPS`=8 for the
  clockless harness) and returns null until done; then one bake per call: paint (ss 2, the recorded ops
  pushed as is), light (ss 2 without shadow, then ONE `shadowBlur` drawImage of the whole layer at ss 1
  instead of 84 per-window shadows — 08cc's shadow is a full-target pass each), sheen (ss 1, white
  underlay + multiply + destination-in, as 2D's s·(d+1−α)). Records survive a colour change. Off-screen
  within a screen of the edge, `drawHotel` bakes ahead one step per frame and the sign's neon one frame
  after the house, so the frame the hotel enters does ~1 ms of hotel work. Phone twin (411×742 ×1.5, CPU
  ×4, frames stepped by hand), same machine run: 2D cold worst frame 123 ms (JS 77 + GPU 47), 16
  textures in that frame; now cold worst 97 ms — the paint bake step (op replay 53 ms, 5 textures); other
  steps 3–12 ms; 36 textures over 24 frames. Earlier single-frame GPU port measured 1193 ms (per-window
  shadows), 638 (one shadow), 477 (one paint pass). Open: the paint bake step (op replay) and texture
  creation — the worker's texture pool and a gradient ramp cache by stops (`GcGrad.ramp` was ~27 % of the
  recording JS) will cut both. Pictures vs the accepted h3: max|Δ| 5 at 760, 15 on the phone, edge energy
  7.36→7.38; far zoom equal but for a DOM pulse. Gate2d gains the hotel scene; GC_GLYPHS `raster`/`measure`
  are named holes (the text source of v2); mutants `hotel-bake-2d`, `hotel-frame-2d` die.
- **Station (17c3) off 2D.** The body master is recorded into a `GcCtx` (160·sb square, ss 2 while
  ≤512², else 1) with `ST_REC.split` cutting the op list at layer boundaries (trade: under and over the
  ring); each slice is replayed into its own bake, and a >1-layer master gets a union bake `U` (drawImage
  of the layers at ss 1) for the lit sprite's normal pass. The spinning parts (`stSpinCv`) are bakes
  keyed by part and scale (16 kept), fed straight to `gpuLitSprite` (bake → mip path, no upload). The
  `!GPU.on` glow, the `stationArt` 2D master and the 2D flare branch are gone. Pairs vs the HEAD build
  (8 scenes: trade 760/phone, indust, far, yard, sci, bazaar, outpost): crop edge / luminance / top-2 %
  equal within noise (trade edge 4.89→4.90, yard 5.83→5.82, a yard ×4 crop −0.8 %, indust +1.6 % from the
  flare phase); >24 differences ≤33 px per crop; GPU errs 0. Gate2d gains the station scene (masters and
  spins dropped first so the bake is under the probe); mutants `station-master-2d`, `station-spin-2d`
  die. The e2e flame check now reads the GPU record: no cold op or lamp above the stack mouth, warm
  flare shapes present. The light suite's torch check reads the same shapes (Σ luminance·α·width·length
  over the stack column per frame) instead of 2D pixels.
- **Prebake scheduler (17a0).** `prebake(key,make,sync)` steps a generator job ≤4 ms (at least one step)
  per frame across all keys; jobs untouched for 120 frames are closed with `it.return()` (the job's
  `finally` drops partial bakes); ≤6 live jobs; a device change restarts the job. `sync` finishes the job
  now and counts `PB_SYNC` — the draw calls it only when the thing is on screen and not ready (a load, a
  jump), never on an approach: the gate suite flies 1.6 screens to a hotel over 90 frames and demands
  PB_SYNC +0 and the house drawn from the finished bake. `PB_MAX[key]` keeps the longest step per key
  (the ≤16 ms at ×4 threshold is the stand's, the suite has no clock). `pbOnScreen(x,y,w,h,m)` is the
  margin test. The station masters are on it (`stMasterJob`: record the body, then one layer bake per
  step, the union last; a partial job drops its bakes). The key lost `sb`'s role as a hard gate: when
  the zoom crosses a quarter octave the old master of the same station keeps drawing (its own `sb`, `E`)
  while the new density bakes step by step; a sync finish happens only when the station has no master
  at all and is on screen (a load). Off screen the job only steps. Frames vs HEAD at 760 and on the phone:
  identical (max |Δ| 0), PB_SYNC 0.
- **Six hotels (17l core, one file per type).** The panel hotel is deleted; `HOTEL_T[by]` registers a
  type {W,H,PX,ax,ay,sign,sheen,wins,paint}, where `paint(c,e,sd,lit)` is a generator (yields between
  parts) that paints into two `GcCtx` records: `c` the house, `e` the glow. `hotelJob` records dark and
  lit, bakes the house `cv`, the lit windows `cl`, the two glows `em`/`el` (ss 2 record → shadowBlur 1.2
  bake), and the sign's sheen `sh` (house × a radial ramp of the sign colour, destination-in the house);
  five bakes, one texture each, all prebaked while the house is within one screen of the edge. The frame
  draws cv, sh (add), the lit rects of cl, em, the lit rects of el, then the 17k0 neon (a space is a dead
  letter). Which windows burn: `hotelWinLit(N,sd,lit,flick)` over the type's window list — no re-bake.
  Shared painters: `hotelRim` (one dark outline pass for the whole body), `hotelWindows` (grouped by
  colour, curtains, a resident silhouette), `hotelDock` (the tube with its window strip and the shuttle,
  common to all types), `hotelLamp`, `hotelStar`. Gameplay untouched: `hotelHere` place, radius 150,
  «МЕСТ НЕТ». Names: КОСМОС (gt), АЭЛИТА™ (co), ДОМ ПРИЕЗЖИХ № 4 (or), ЮПИТЕР (km), ТУРБАЗА «ДРУЖБА» (ra,
  painted sign and bulbs, no neon), БУРАН (hf). Type gt «Космос» (17l1): a crescent slab of 36×14 windows
  in ribbons (floors read as bands, not a checkerboard), two towers with red bands, a banner with a star,
  a portico, a cosmonaut on the plaza at 1.5 storeys, a keel with pods; the sheen is 0.4 (0.8 bleached
  the stone). Gates: gpugate windows suite (masks ≥8 a day, 0 uploads) and the approach suite above;
  gate2d scene «Космос» (painters incl. `hkPaint`, `hotelDock`); mutants `hotel-bake-2d`
  (glow record → 2D), `hotel-frame-2d` die. 760/phone/far/z3 GPU errs 0.
- **Gesture and post (17h) off 2D.** The whole frame goes through the scene pass: fleet ships through
  `fleetShipAt` with their own matrix (`gestShip`), the drone screens and the camera drone as kit shapes in a
  local frame (`gestAt`, `gestRect` via `gpuQuad`, the ticker stripes clipped to the screen), the post sign a
  GPU-canvas bake (`gestPostSprite`, `gpuBaked` at 3×), the lamp two added discs. The 2D fallbacks are gone.
  The spotlight («gt») and the inspection line («or») move to `drawGestureTop`, called from 17-mode-system
  right after the player's hull (one line, a call-order change only): the old 2D layer lay over the hull.
  They blend «over», not «add», as `#c` did; the line's core is .87 instead of .75 because the 2D halo and
  core summed inside the layer (C 213, A .89) and sequential «over» needs .87 for the same bg·.11+213. What
  stays different: `#c` was composited after the tone curve, the scene pass is before it, so the hull's
  highlights under the spotlight (above .75, where the tone curve bends) come out a little brighter: mean
  +4/255 over the hull crop, the rest of the cone equal. Pairs vs HEAD, same tick (px >24 / max): 760 —
  gt 188/71 (hull highlights), co 3/34, or 450/43 (AA of a 2D stroke vs an SDF segment along the line, 286
  brighter and 158 darker, same energy; was 805/118 with the line under the hull), ra 0/11, hf 16/53, km
  0/10; phone without the pulsing buttons — gt 219/40, co 7/54, or 66/44, ra 0/10, hf 30/65, km 0/12. GPU
  errs 0. Gate2d gains the gesture scene (power changes every 15 frames, age inside its gesture; probes
  `drawGesture`, `drawGestureTop`, `drawGestPost`); mutants `gesture-post-2d`, `gesture-frame-2d` die.
- **«Чебуречная» (17j) off 2D.** The frame was already in the scene pass; the bakes were 2D canvases uploaded
  through `gpuMipTex`. Now the boat (`chebPaint`) and its light (`chebPaintEm`, shadowBlur through 08cc) are
  `gpuBaked` records in `CHEB_ART` (device-checked), the «ЧЕБУРЕКИ» sign is a device-pixel bake measured with
  `gcMeasure` (`chebSignMake`, no mips, `bakeKeep` of 6 with a device check). The 2D frame branch is gone.
  Pairs vs HEAD, same tick, zoom 2.2/1.3/0.7 (px >24 / max): 760 — 10/27, 0/23, 0/16; phone — 1/25, 2/29,
  11/65. Everything >24 sits on the pulsing DOM chips and buttons; on the boat a trace of the garland bulbs'
  halo, the sign identical. GPU errs 0. Gate2d gains the scene (bakes dropped first); mutants `cheb-bake-2d`,
  `cheb-sign-2d` die.
- **Billboard (17k) off 2D, baked ahead.** The panel (truss, frame, the ПЛАН banner with its star and two
  lines) and the running-line strip were 2D canvases uploaded each size; now `bbPanelMake` is a GPU-canvas bake
  and the strip a device-pixel bake measured with `gcMeasure` (no mips). Both go through `prebake` (17a0) via
  `bbKeep` (bakeKeep of 6 + device check): off screen but within .6 of a screen `bbAhead` bakes the panel, the
  strip and — by calling the unchanged `neonBake` inside a prebake job — the title neon; on screen with nothing
  to show the bake is `sync`. A stale panel (plan changed, zoom settled) stays up while the new one bakes. The
  2D frame branch is gone. «Чебуречная» got the same approach bake (`chebAhead`: boat, light, sign). Fly-by at
  760 (billboard from 2.5 screens off to mid-screen, 12 px/frame, same tick): textures created in the frame
  19 → 3 at ×1.3 and 22 → 3 at ×2.2, none of them 17k/17j (hotel neon 17l, shuttle, find sprite); via
  prebake 20/24; `PB_SYNC` 0, pipelines 0. Pair vs HEAD: ×1.3 max 13 (2 px >8), ×2.2 max 8 (0 px >8). Gate2d
  gains the billboard scene; mutants `bb-panel-2d`, `bb-strip-2d` die. No new warm-up keys.

- **Moored barge and planet works on the GPU canvas** (17e `drawMooredBarge`, `drawPlanetWorks`, `glowCone`; «чистый полёт» row 17e): the moored barge is `gpuBargeBody` + `bargeLiveGpu` like the factor barges (12l), the mooring line is a butt-ended rotated rect, the name a `domLabel`. Planet works: dump and spoil ellipses are triangle fans with hard inner edges (segment count by on-screen size), the strip a rotated rect; no disc clip (nothing lies beyond .85r, the clip was r−1). A radial-gradient glow (linear cone 0→R) becomes `glowCone`: three soft additive discs at thirds of R — profile within 3 % of the cone, energy .99, same peak (one soft disc gave a flat, brighter core that read as a blob); under 1.5 device px one disc with alpha ×(1.1−.35/R). The bazaar bulb halos use it too. Gate vs 2D: planet works light +0.1…+0.2 %, sharpness 0…+1.7 %; barge light −0.1…+4 %, sharpness −1.0…+1.2 % (within noise); bazaar after the switch light +1.8…+12.9 %, sharpness +0.4…+17 %; 2D calls 0, GPU errors 0.
- **Abilities on the GPU canvas** (16c `drawAbil`, the wedge field `ABIL_CONE_WGSL` since 5c; «чистый полёт» row 16c): the siren rings are kind-3 rings (hw 1) added, the courier crate is kind-4 rects in the crate's axes (fill, a 1 px outline as four non-overlapping bars, the cross with its vertical split so the centre does not double), the cutter beam a butt-ended kind-4 rect added. The survey wedge (radial gradient in a ±.35 sector) is one GPU-canvas bake per screen size (`bakeKeep`, cap 2) at twice device resolution, drawn at mip level 0 (`lod` .5): at 1:1 the rotated bilinear sample softened its edge by 4.5 %. Its first stop is .102 for the 2D .10, since the scene pass settles 2 % darker. Gate vs 2D (760 and phone 1.5): rings, crate and beam light +1…+5 %, sharpness +0.4…+13 %; the wedge edge −0.2 %, light equal; its mean Laplacian is −4.4 %, all of it the Skia dither grain inside the gradient (−9.4 % inside, edge +3.5 %, background −0.7 %). 2D calls 0, GPU errors 0.
- **Fleet masters on the prebake scheduler** (12ai1 `fleetArtOf(f,ahead)`, `fleetArtJob`; 17g `laneShip`, 12ai `drawFleet`): the S23 run had a 100 ms tail on the first build of five lane masters in one frame. The master is now a 17a0 job — the geometry, then the `cn` bake, then `cnA`, one per step; `finally` drops a partial bake. Lane and fleet ships within 1.6 screens off the edge (`pbOnScreen`) step ahead, at most one fleet master per frame (`FLEET_PB` by frameNo); a ship already on screen without a master (load, jump) finishes sync and counts `PB_SYNC`. Masters stay fleet-wide and zoom-free (FLEET_SS 3), cached once as before. Without a device the job runs through at once (geometry, `cn` null, not cached) for the Node tier. `FLEET_PAINT` (WeakMap art → paint recipe) lets M317/M318 check the emblem, the body median and the tank shadow on a 2D reference raster of the same recipe — the GPU bake has no sync readback; M306 counts the shapes sent to `gpuShapes` under a stub scene. Approach probe (cache cleared, 2.8 screens to the holding ellipse over 120 frames, 5 masters): 760 — before 2 masters in one frame, lane 15.1 ms, now ≤1 per frame, 4.5 ms; phone 10.4 → 2.7 ms; PB_SYNC 0; masters now land 25–35 frames earlier, off screen. Fleet stand pairs identical (differences only on the pulsing HUD button).
- **Own ship gear and the crew watch frame without #c** (05c `gunBake`, `shipGearGpu`; 17 `drawSystem`, edge chips; 91b-crew «наёмник виден…»): the ctx save/translate/rotate/scale block around the own hull is gone. Each gun is one GPU-canvas bake per (size, mount, quarter-octave of twice the zoom-cap density) of the same brush (`gunPaint`), `bakeKeep` cap 12, mipped, drawn by `gpuImage` rotated by course + aim with the `sharp` sample; the launcher is kind-4 rects in the hull axes (fill, a 1-unit outline as four bars, the dry blink). The scene tone lifts dark paint that the old #c front layer added untoned (08b `toneH(s)*a+f.rgb`), so the bake is darkened ×.4 (`source-atop`, alpha kept): stand gz on the hull, p5 of the barrel 15…20 vs 2D 10, vs 29 undarkened. The planet, moon and edge-chip widths come from `gcMeasure` (glyph-atlas metrics), not `ctx.measureText`. The watch check now runs one `gpuManual` frame: calls on #c 0 (any method, named by stack), the ally hull drawn (`allyHullGpu`), 4475 GPU draws; without a device only «does not throw». Watch pair: 760 identical, phone 1.5 differs only on the pulsing «Меню» dot. Gun stand vs 2D: light −1…−4 %, sharpness −1…−8 % on the gun cells — a sprite in the scene cannot match an untoned vector raster one to one; the exact fix is a GPU draw into the front layer (08b core, after the release). No new pipeline variant (`kit.img` over; `sharp` is a per-rect uniform). GPU errors 0; 91b-crew green in Chrome and -Mobile, Node tier green.
- **Hotel (17l) → three GPU-canvas bakes, cut across frames.** The atlas (house with all windows dark above
  the gap, all lit below) was six 2D half-canvases, three uploads and 2D mips. Now `hotelPaint` is a generator
  (one step = a floor or a part of the house) that records paint and window light at once into two `GcCtx`
  of the bake's size and ss; `hotelBake` runs its steps until `HOTEL_MS`=3 ms (cap `HOTEL_STEPS`=8 for the
  clockless harness) and returns null until done; then one bake per call: paint (ss 2, the recorded ops
  pushed as is), light (ss 2 without shadow, then ONE `shadowBlur` drawImage of the whole layer at ss 1
  instead of 84 per-window shadows — 08cc's shadow is a full-target pass each), sheen (ss 1, white
  underlay + multiply + destination-in, as 2D's s·(d+1−α)). Records survive a colour change. Off-screen
  within a screen of the edge, `drawHotel` bakes ahead one step per frame and the sign's neon one frame
  after the house, so the frame the hotel enters does ~1 ms of hotel work. Phone twin (411×742 ×1.5, CPU
  ×4, frames stepped by hand), same machine run: 2D cold worst frame 123 ms (JS 77 + GPU 47), 16
  textures in that frame; now cold worst 97 ms — the paint bake step (op replay 53 ms, 5 textures); other
  steps 3–12 ms; 36 textures over 24 frames. Earlier single-frame GPU port measured 1193 ms (per-window
  shadows), 638 (one shadow), 477 (one paint pass). Open: the paint bake step (op replay) and texture
  creation — the worker's texture pool and a gradient ramp cache by stops (`GcGrad.ramp` was ~27 % of the
  recording JS) will cut both. Pictures vs the accepted h3: max|Δ| 5 at 760, 15 on the phone, edge energy
  7.36→7.38; far zoom equal but for a DOM pulse. Gate2d gains the hotel scene; GC_GLYPHS `raster`/`measure`
  are named holes (the text source of v2); mutants `hotel-bake-2d`, `hotel-frame-2d` die.
