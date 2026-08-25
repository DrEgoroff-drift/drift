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
9. ~~**The world on foot**~~ — DONE at M172 (0.138.0): `sunSpot`, night as a value structure, the
   lamp as a cone, far ridges with their own amplitude, `SURF_HOR`. Stand: `docs/mkfoot.ps1`.
10. **Split debt.** `23-mode-dig` and `27e-ui-home` have crossed the 40 KB line; `build.ps1` was
   re-baselined on 2026-08-15 so the guard stays quiet, which is a loan, not a payment. One
   payment made on 2026-08-16: `21aa-base-rooms` (60 KB) was cut along its seam into the brushes
   plus `drawModule` (24 KB) and `21ab-base-interiors`, the eight compartments (37 KB), and left
   the guard's list instead of being re-baselined inside it. **Next: `21a-mode-base`, 52 KB** â
   it grew over the base passes and is deliberately left shouting on every build.

### M169 — the graphics campaign of 2026-08-24 (settlement, mine, cantina, ground, giant)

Written after the author called the settlement "пиздец" and asked for every screen to be looked
at again, five passes deep, with self-criticism instead of "this one is already fine".

Closed here: **settlement** rebuilt as a place (`12tb-settle-draw`: terrace, street, a body per
craft, four dwelling plans, villagers with a gait, communal fire, fence, night light pools);
**mine** rock given a mass (`digRockMass`: cloudy tone, world-space jointing, dyke, damp stains,
abandoned collapsed workings roughly one per screen); **cantina** given a host (barkeep with work
that changes on an eight-second cycle, patron poses, bottle silhouettes); **deposits** turned from
interface icons into outcrops with a form per raw material (`drawDeposit` in 21b); **ground
cross-section** broken by faults with lenses inside the strata (18b); **gas giant** shear edges
grown rolls (19a).

Measured after all of it **and after M170**, clean machine, maximized window at ×2: system 58,
belt 60, landing 54, surface 52, dig 60, cave 60, scoop 58 — the same as, or a shade better than,
the pre-campaign baseline (55/60/51/48/60/60/55). Measure like for like: the same window size and
scale, nothing else running. A 1550×900 window instead of maximized reads ten frames lower, and a
run with `--force-device-scale-factor=2` that lands on a 2.5× display reads a third lower — those
are the window, not the code. The "regression" seen
mid-run (system 45, landing 40) was the browser pane running the game in background tabs while
the probe measured: **no other instance of the game may be open during a measurement.** The one
pass worth optimising if surface ever drops below 45 is `drawPlant` (4–13 fps by the deep probe);
bake per-plant sprites and shear them for the wind rather than redrawing paths per frame.

Tooling from this campaign: `docs/shot.ps1` (headless capture of any stand, kills its browser
after), stands rewritten to compare — `mksettle` (three stages plus night plus a ×3.2 close-up),
`mkcant` (all five hall types in one sheet).
- **road companion (M168g, 0.136.1)** — closed by looking at four minutes of real driving: the exhaust
  was a stack of bricks composited to opacity, the trip counter reset every game-minute, and a
  crooked cradle was read as a permanent turn. Measurement rebuilt (auto-zero, gravity frame, yaw
  rate), ribbon is one body per nozzle, footer no longer crossed. See docs/DESIGN-road.md, fifth
  pass. Left open: the hull reads as grey mass at this size — plates all one value, white hairline
  on every edge, and the ТП-68 plate is the brightest thing in the optical centre. Art direction,
  needs the author.


### M173 — the author's own walkthrough, 2026-08-24 (live queue)

The author played the dev build and pointed at things one at a time. Each line is a fault **he
saw on his own screen**, in the order he found them; they are worked through in passes, in this
order, and struck out as they close. This is the live queue — new finds go at the bottom.

1. ~~**A black polygon in the ground, "what is this at all"**~~ — done. It was the near-plane
   boulder of `drawForeground` (21b), filled at `amb×.30` with no contour and no material. On dark
   ground it stopped being an object and read as a tear in the render. **The rule is wider than
   one rock: any silhouette in this game must carry an edge that caught the sky** — without one
   the eye reads "nothing was drawn here", not "a dark thing".
2. **"The plants are ugly, and they clump"** — **half done, and the half that is left is the
   harder one.** *Clumping: fixed.* Cluster centres were chosen as the best of three throws
   across the whole strip, lowest ground wins; a strip has one hollow, so every cluster walked
   into it — half the screen a wall of foliage, the other half bare. The strip is now divided
   into as many stretches as there are clusters and each looks for its own low spot inside its
   own stretch; plants inside a cluster are spaced instead of thrown, and each carries a depth —
   far ones smaller and fading into the air, near ones full.
   *Ugly: not addressed.* The forms themselves (`drawPlant`, 20-life) are flat cut-outs in one
   acid green: no shading across a leaf, no value difference between stem and crown, the same
   hue whatever the world. That is a pass of its own on the plant body, not on where it stands.
3. ~~**"This is rubbish too" — the ringed planet in the sky**~~ — done (`skyGiant`, 19b). Three
   causes: the body took the colour of the planet *underfoot* (dark world → black disc, plus a
   .86 terminator — a hole again); the light always came from the right regardless of the star;
   and the ring was two thin arcs of equal brightness front and back, no planet shadow on them,
   no divisions — that is exactly what makes a hoop. Now the body is lit from where the star
   actually is (`sunSpot`), mixes the star's colour so it can never go black, and the rings are
   five bands of different width and brightness with the planet's shadow across them, the far
   half dimmer, and the near half half-transparent over the disc.
4. ~~**The home reads as a warehouse**~~ — done. The wall was bare from waist to ceiling and the
   eye measures height by things, not by paint: a dado, a skirting and a beam give it three
   horizontals. The ceiling came down from 2.6 man-heights to 2.3. Every room got one object
   **in front of** the walker, cropped by the bottom edge, so the room has a front and a back
   instead of one flat plane. Residents got depth and elbow room — five of them used to stand on
   one line, shoulder to shoulder, reading as a row of identical cut-outs.
5. ~~**"The lamp just doesn't light anything"**~~ — done, and it was the M172 cone's own fault.
   A milky wedge was laid over the world — over the sky as well — and nothing under it got
   brighter. Light does not work that way: what you see is not the beam, it is **the lit thing**.
   The work moved to the ground: a strip along the terrain profile in front of the walker now
   really brightens (added over the rock, so the material still shows), falling off with distance.
   The airborne beam stayed but faint and narrow — as much as dust actually scatters — and only
   where there is an atmosphere to scatter in.
6. ~~**"Look at it from the dev stand, don't raise a local one"**~~ — done: `dev.ps1` publishes
   this build to `/dev.html` and the sheets to `/dev/`, and the four recurring tooling errors are
   fixed and written into `CLAUDE.md` (ssh noise, `.ps1` BOM, parameter shadowing, probe flags).
7. **Release look, pass 1: the instruments stop hanging over every screen** — **done, on dev,
   awaiting the author's eye.** On foot (surface, cave, dig, base, home, raid) fuel, hull and
   shield are hidden — they are the ship's, and the ship is somewhere else; the hold stays,
   because on foot it is exactly what fills up, and fuel comes back by itself when it goes
   critical. The rest of the release look (the table as paper, the remaining overlay) is passes
   2+; the author took it "in passes" on 2026-08-24.
8. ~~**The plant body itself**~~ — done in 0.140.0, but only the skin. `stemC`/`leafC` stopped
   being flat colour strings and became gradients in the plant's own coordinates, so all twelve
   forms got light and shade in one edit, lit from where the star actually is (`sunSpot`); tone
   varies ±12% between neighbours from a hash of the place, so a thicket is no longer one patch
   of paint. What this does **not** fix is item 12.
9. ~~**A second storey for the living part**~~ — done (0.145.0, M178-9): `29e-home-up`, two rooms
   over study and living, a real stair, the house drawn as a cross-section (roof, attic, joists),
   Vega at the loft window. Suite `91zzzc-home-up`.
10. ~~**The world heard**~~ — done (0.146.0, M178-10): `09a-roomtone` — wind by weatherPower
   (storm heard before seen), rock by depth, the house warm with creaks and the weather through
   the wall, ventilation on the base, absolute silence in vacuum. Suite `91zzzd-roomtone`,
   verified live by AnalyserNode RMS.
11. **Save format v:5** — the author said break it (2026-08-24). Then measured: all 119 persisted
   fields are still read, there is exactly one legacy branch (`modsOwned` falling back to
   `mods`), and the 71 "defensive defaults" are validation of untrusted input — a save comes from
   localStorage and from the cloud — so they stay at any version. Breaking now costs every
   existing save and buys almost nothing. **Held until the release look actually changes what is
   persisted**, then broken once, together with the cleanup. The author has the call.
12. **"The instruments would sit better at the top"** — the author, 2026-08-25, looking at the
   surface frame. Suit / pack / hold sit bottom-left and the planet card bottom-right, where A2
   deliberately put them (0.143.0, M176: "the state moves down"). His eye now says the bottom edge
   is the wrong home: on foot that band is already crowded — pads left and right, the console in
   the middle, the action prompt over them — so the numbers land in the noisiest strip of the
   frame, on the ground the walker is actually looking at. **The cost of the reversal, said before
   doing it:** A2's argument was that the top edge belongs to the world (the postcard line, the
   sky, and the two location tags КОРАБЛЬ / ПЕЩЕРА already live up there), so the state goes where
   the eye is not. Moving it back up sets it beside those tags and re-opens what the pass closed.
   This is not a repaint: decide **which** edge owns the state, then move every mode in one go
   (surface, cave, dig, base, home, raid, flight, station), or the game grows two habits. The
   author has the call; ask before touching A2's layout.
13. **The raid reads as if the man stood on the ceiling** — the author, 2026-08-25, on the
   pirate-base frame: «не очень понятно, посмотри на перспективу». The complaint is about the
   legibility of the space, not about the bodies. Four suspects, in the order to check them
   (`24aa-raid-draw`):
   - **Pitch and principal point do one job twice.** The camera is tilted down
     (`fwd=[…,-.16,…]`) *and* the principal point is lifted (`CY=H*.44`, M180). Shifting the
     principal point is the architectural trick precisely because it keeps verticals straight
     without a tilt; doing both leaves floor and ceiling converging at nearly the same rate, and a
     plane that recedes upward stops reading as ground.
   - **The value order is inverted.** The ceiling carries the light panels and the pale slabs, the
     near floor is almost black — so the brightest receding plane in the frame is the one the man
     is *not* standing on, and the eye takes that for the ground.
   - **The player may be losing his contact shadow.** The pirates have theirs and read grounded;
     the ellipse under the suit is drawn only when the floor point projects below the body
     (`pm.y>m.p.y+4*s`), a guard this camera height can fail. Measure it before assuming it.
   - **Hanging boxes look like floor boxes.** Crates on the upper wall carry the same silhouette,
     tone and contour as the ones on the deck, so they add no up/down evidence either.
   One frame is not a diagnosis: reproduce it on the stand (`docs/mkview.ps1`, `?s=raid`), and fix
   the reading of the space — a horizon the floor alone owns — before touching anything else.

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
- ~~**the world on foot**~~ — **closed in 0.138.0 (M172)**: the star got a place in the sky (`sunSpot`, one
  source for glow/disc/clouds/shafts/rim), night became a value structure instead of a flat wash,
  the suit lamp became a cone with a pool on the ground, the far ridges got their own amplitude,
  the horizon moved to `SURF_HOR`. Stand `docs/mkfoot.ps1`. Left open: the day palette itself —
  noon still reads overcast on every world, and that is art direction, not a fault.
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
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). So the real remaining work is four files, not seven.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: **closed by measurement (2026-08-24, 0.133.0).** The game now carries its own probe:
  `?g11` runs the mode tour and measures rAF fps in a visible tab (`28z-fps-probe`), `?g11=deep`
  noops draw passes one at a time with paired baselines. Clean run (single fresh-profile Chrome,
  `--force-device-scale-factor=2`, anti-throttling flags, dpr 2, warm cruise after 4 s settle):
  system 56, belt 60, surface(jungle) 55, dig 60, cave 60, landing 52, scoop 47–60 across runs.
  No mode is solidly <50, so the 20-life sprite bake is not justified — matching the earlier JS
  read. The scary first read (system 46, surface 44) was the **cold start while chunks bake**,
  not cruise. Deep pass: no single pass dominates (paired deltas ≤+2, only `drawBuilt` +8 ≈ 2 ms).
  Measurement discipline learned: leftover probe windows with anti-throttling flags keep rendering
  when occluded and sink every later run to ~22 fps flat — kill them before measuring.
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
- **M168 road companion** — **built (0.129.0–0.132.0)**: the living screensaver for real travel — credits by the kilometre with a ×3 combo, acceleration and braking on the hull, the mood wave — per
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md) — the player's hull flies by GPS, banks by the
  gyroscope, shakes with the road, an equalizer breathes by the microphone; a kilometre of
  road is a unit of ice, 40 a day; `27k-road`, `91zzy`. Passes b–j moved it to credits, tiers,
  nose-up flight, an honest turn measure through a crooked cradle and the «моя волна» bloom.
  **M168k (0.155.1)** — the ninth pass, from six filmed minutes of city driving and three
  corrections from the author (a rich palette, the game's sound off, stars that read as flight):
  hue was being averaged like a number and so every track painted the sky green; the bloom made
  the footer buttons unreadable; the exhaust was white by construction; the travel scale was taken
  from 120 km/h while a city drive is 15–45. Plus a truth window for the sensors (long-press or
  `?road=diag`) — through the whole drive the hull never left the centre and the screen could not
  say why — and a stand, `docs/mkroad.ps1`. Sky split off into `27la-road-sky`. **0.156.0**: the
  author lifted the mode's battery budget («делай максимум, всё равно тел на зарядке»), so the
  glow became a per-pixel field with domain-warped noise (`27lb-road-bloom`) — the shader recipe
  he brought, written on `ImageData`, measured down from 17.9 ms a frame to 2.6. **0.157.0**: the
  halo round the hull killed, the exhaust given two habits (breath below 22 km/h, afterburner
  above), lanes merged into one filled body, and proportions equalised across every hull — the
  road is now a step in the `?g11` probe and reads 60 fps.

- **Road economy — the author's next ask (2026-08-25, "запиши потом")**: «хочется больше кредитов,
  я еду 5 км до дома как-то скучно за 20 кредитов, мож комбо за повороты там, за движение назад
  что-то такое придумай прикольное». So: raise the rate, and make the combo *earned* by driving
  rather than by mere elapsed time — corners, reversing, and whatever else the sensors already
  know honestly. The daily cap and the speed sanity stay as the only guards
  ([`docs/DESIGN-road.md`](docs/DESIGN-road.md), second pass).
- **Release look** — after M161: the table as paper, removal of the overlay HUD.

# QUEUE: after the graphics campaign

- **M171 someone else's mark** — **built (0.137.0)**: the first thing in the game left by another
  living player, and it arrives without a word — `11ag-trace`, `a=trace` in `site/api.php`, suite
  `91zzza-trace`, design in [`docs/DESIGN-trace.md`](docs/DESIGN-trace.md). A pilot cuts his mark
  into a stone beside his ship and leaves up to five units of cargo at its foot; the next person to
  land there takes it, and it is gone for everyone. Nothing a human types ever crosses: what
  crosses is a mark (one of twelve, derived from the anonymous pilot id — not chosen, never
  explained), a six-character hand, a resource key and a count. Recognition is the hand and
  nothing more; feedback is one ether line counting how many of yours were taken. Three per day,
  eight per place, thirty days, one request per landing. Offline the feature does not exist and
  the interface never mentions it.
  **Left open by design**: only the surface carries a mark (the station counter, the settlement
  wall and the cave mouth would each take one); no recognition beyond the hand — anything more
  becomes a friends list; no way to leave a thing *for* somebody, because that is trade.

- **M170 the home as a place** — **built (0.136.0)**: `21f-home-out` (the house on its planet:
  terrace, footing, roof, smoking chimney, lit window, porch lamp, garage, display case, workbench,
  beacon mast; cleared yard, kept away from the settlement; ДОМ marker in the navigator) and
  `29c-home-in` + `29d-home-draw` (a walkable mode: eight tiers as eight rooms, openings that show
  the next room, per-room floors, things to look at, residents who sit, work, walk and answer —
  Vega in her dress and headscarf). Suite `91zzz-home-in`. Remaining passes if the author wants
  more: furniture depth in the hall and dock, a second storey for the living part, sounds indoors.
  Original ask below.
- ~~**M170 the home as a place**~~ (author, 2026-08-24) — the home stops being a screen of cards and
  becomes a house standing on its planet: you land, you walk to it on foot, you go in, you walk
  its rooms and look at what is in them, and the people who live there are drawn living in it —
  Vega sits, gets up, walks, works. "Полноценный Симс" in the author's words. Ten passes, the
  last of them performance. Depends on: the surface pass (M169+), `27e-ui-home`/`21ac-base-draw`
  for the room language, `11ac-trainee`/`11w-vega` for who is inside.

# QUEUE: the thirteenth pass — the galaxy as a book of stories (M122–M151) — CLOSED

Built in 0.72.0–0.108.0. The per-milestone notes that used to sit here (M129–M151, the regions,
the hundred, the instruments) moved to [`docs/PLAN-archive.md`](docs/PLAN-archive.md) on
2026-08-25 — they are documentation of decisions taken, and this file is read every session.
Grep the archive for a milestone number.

# QUEUE: written 2026-08-25 for the next session — verified findings, in order

Everything below was **read in the code, not remembered**. Line numbers are omitted on purpose;
the function names are the address.

## 12. Biology — **BUILT (0.141.0, M174)**. `20e-species`, suite `91zzzb-bio`, stand `docs/mkbio.ps1`

A species is a property of the planet: `floraOf(p)` (3–5 plant species, fixed form, proportions,
branching, colour, growth range, wet/dry preference), `faunaOf(p)` (2–4 beast species, archetypes
never repeating). A specimen is species + age + place. Age is a body — seedling without flower or
fruit, old with a wider crown, dead branches and litter. Vigour comes from the strip's wetness and
the local hollow; lean comes from where the star stands. The name is derived from the drawn form
and the real flags, so it cannot lie — which immediately exposed three real lies (spiral and
ribbon plants never drew their glow, no alien beast drew glow, spines did not exist) and they were
drawn rather than renamed. The register counts species, not bushes; a save without `bioV:2` loads
with `G.species` emptied.

**Left open by design:** the *drawn* forms still number twelve for the whole galaxy — a species is
a fixed point in that catalogue, not a new shape, and a generator of forms is a pass of its own.
Litter is a few leaves at the foot, not a ground layer. Beasts do not eat, breed or avoid each
other: fauna has species now, it does not have behaviour.

### The original finding, kept for the record



The game keeps a species *record* — `G.species`, `+9 данных` for a plant, `+14` for a beast,
the `G.bio` counter, the line «Новый вид: …» — but there is no species *entity*. Verified in
`20-life`:

- **`genPlant`**: every trait is an independent `r()` roll per specimen — `cap`, `turns`, `ribs`,
  `balls`, `ribbons`, `pods`, `facets`, `blobs`, `glow`, `bloom`, leaf colour, height. Two plants
  "of one species" share nothing. `genBeast` is the same: `shape=Math.floor(r()*BEAST_SHAPES.length)`,
  fur colour and size rolled per animal.
- **Eight of the twelve plant forms have no branching at all** — `nb` is 0 for `kind>=4`. They are
  a stem plus a hardcoded ornament.
- **No age.** `sizeMul` is a random multiplier: a small plant is not a young plant, it is the same
  plant scaled. No seedlings, no old specimens, no dead matter.
- **No light.** `lean=(r()-.5)*.5` is random, although since 0.138.0 the game knows where the star
  stands (`sunSpot`).
- **No ground.** `tr.wet` drives only how many plants there are, never what one plant is like: the
  same specimen in a wet hollow and on a dry ridge.
- **The name lies to the player.** `PLANT_FORM` has six words for twelve drawn forms, and the word
  is chosen by `pick(PLANT_FORM,r)` independently of what is actually drawn; the trait word
  «светящийся» is rolled independently of the `glow` flag. That name is then shown as a discovery
  and stored in `G.species` for good. **The game keeps a register of species that do not exist**,
  and that is not cosmetics.

**The pass**, in order: (a) a species becomes a property of the planet next to `planetBiome(p)` —
three to five per world, each with fixed proportions, colour, growth range, branching, name; a
specimen is species + age + place, and the name is derived from the real form and the real flags,
so it cannot lie by construction; a second specimen of a known species is no longer a discovery.
(b) age: a seedling has fewer segments and no fruit, an old one a wider crown and dead branches.
(c) the specimen answers the world: leaning toward the star, taller and lusher in a wet hollow,
stunted and harder on a dry ridge, litter and deadwood at the foot.

## 13. Planet light — **BUILT (0.142.0, M175)**. `planetSunRot` in `07-planet`, stand `docs/mkplight.ps1`

The baked shading layer is rotated at draw time by the planet's angle to the star; the disc cache
takes the sun angle into its rebuild key. No extra bake. The softness of the terminator was left
as it was — a true half-phase is art direction and belongs to the author.

### The original finding, kept for the record



`planetLight` (`07-planet`) bakes the shading layer with a hardcoded vector:

```
const light = clamp(nx*-.52 + ny*-.42 + nz*.74, 0, 1);
```

So **every planet is lit from the upper left whatever the star does** — a planet to the left of
the star and one to its right are shaded identically. This is exactly the fault M172 fixed on the
surface ("the light had an hour but no direction"), still standing on the screen the player looks
at most after the cockpit.

The fix is cheap and exact: the terminator seen from above is a straight line through the disc
centre, perpendicular to the direction to the star — so the baked light layer stays baked once and
is **rotated** by the planet's angle to the star at draw time. No extra bake, no cache explosion.
How hard the terminator should be (a soft light as now, or a true half-phase) is art direction and
belongs to the author.

## 14. Release look, passes A2 and A3 (the design, agreed with the author 2026-08-24)

Pass 1 is done (on foot, the ship's instruments are hidden). What the rest means, decided after
the author pushed back on "nothing at the top" — the goal is not an empty top, it is **the top of
the frame is the world**:

- **A2 — BUILT (0.143.0, M176).** The top panel is gone; state left of the console, place and purse
  right, hairline bars over a bottom slope instead of a glass plate; composition per screen (suit
  and hold on foot, pod in flight only); the rail came down; on a phone one line of numbers and the
  message back at the top. Stand `docs/mkview.ps1` + `docs/pageshot.ps1` (whole page, interface
  included); `test.ps1 -Mobile` measures the phone layout for real. Original text below.

- **A2. The state moves down.** The top glass panel goes; fuel/hull/hold live as hairline bars
  with a number to the left of the console, place and purse to the right. It fades to a third and
  wakes for two seconds on change, staying open while an alarm holds — `hudWake` already does
  this, it only moves. **The composition changes per screen**: on foot the ship's fuel and hull
  decide nothing, so it is the suit, the hold and the distance to the ship; the region instrument
  pod (`ipod`) is a cockpit instrument and shows in flight only. The edge navigation chips stay —
  they are about the world, not about the interface.
  **On a phone**: hairline bars are unreadable at that size, so it is one line of numbers only,
  above the console, between the thumb zones, colliding with neither the pads nor the buttons.
- **A3 — BUILT (0.144.0, M177).** `27i-ui-table` + `body.table` styles: the notebook is a sheet
  with a margin and red rule, ink per kind of record; things and tapes lie on the wood as objects
  with shadows, rotation and a wax dot for unread; a clipping and a plate got their own silhouettes;
  the active tab is a paper label. Checks in `91zzv-table`.

- **A3. The table becomes paper**: `29-ui-table` stops being a dark window of lists — a sheet,
  bills in a pile, letters as envelopes, tapes as reels, clippings. Full screen on a phone, tabs
  no smaller than 44 px.

The overlap guard `91f-ui` measures `.vitals`, `.locus`, `.rail` and both `.pads` groups against
each other and against the screen edge — it will have to be re-pointed, not disabled.

## Order

12 (biology) — **done, 0.141.0** → 13 (planet light) — **done, 0.142.0** →
14 A2 — **done, 0.143.0** → 14 A3 — **done, 0.144.0** →
**9 (second storey) → 10 (world heard)** → **then M178–M186 below** → graphics debt one at a
time → split debt.

Order fixed by the author on 2026-08-25, in his words: «сначала старые вехи закончи потом всё что
накидал. Потом проверка по беседе и ещё раз пройтись» — so the open items of the old queue come
first, the night orders after them, and the walk-through last.

---

# QUEUE: the author's night orders, 2026-08-25 (M178–M186)

Written from the author's own crops of the screenshots in this session, plus two standing orders:
**"как открытка, как просто самое лучшее что видели"** and **"кнопки не исчезают на мобиле"**.
Each milestone is a version with tests and a commit; each is done in several passes with
self-criticism, per the cross-cutting rule.

- **M178 — the frame as a postcard.** Pass 1 **done (0.147.0)**: the "ringed body" was `skyHole`
  through a day sky — dark lens now comes with the night, the disc stays as a pale day ghost; the
  sky giant floored against the current air with a halo; the cave mouth and the mine's abandoned
  workings got lips, depth and lit rims; РАНЕЦ and every other canvas-corner gauge moved into the
  state and place rows; the phone prompt no longer sits under the console. **Morning screenshot
  round (0.151.0):** far ridges scale with the frame's width (no more «гора в полкадра» in
  portrait), sky bodies measure by the narrow side and their parallax is unclamped (the hole no
  longer follows the ship on approach). **Pads round (0.152.0, M182):** nothing fades itself on a
  phone any more, ОГОНЬ/РАКЕТА keep their place, button width is computed to fit the screen
  (44 px floor), the belt's left group folds into a D-pad, and the «Размер кнопок» setting works
  for the first time. **Still open for later passes:** the rain is one uniform speed everywhere.
- **M179 — the inventory as a tray** — **done (0.148.0)**: `27j-ui-hold`, the ТРЮМ tab on the
  desk lane — every resource a pile whose size answers "how much" without numbers, a form per
  material, people sitting on the edge. Paper stays for what is read. **Left open:** the suit kit
  as objects on the same desk (it lives in the ship screen's paperdoll today).
- **M180 — the pirate base.** «Пиратская база говно, там чё-то сверху всё, скафандр, человечки».
  Pass 1 **done (0.149.0)**: horizon moved above centre (postcard framing), camera closer, light
  pool at the feet, contact shadows under every body, loot and pickups turned from screen stickers
  into cases standing on the floor. **Open for passes 2+:** the enemy bodies themselves (blocky
  torsos), the hangar set dressing, the walkway/mezzanine reading, marks drawing through walls.
- **M181–M185 — five interface passes**, each with a named question:
  1. **the hand** — **done (0.150.0, M181)**: no pressable thing vanishes — ДЕЙСТВИЕ and ТОРМОЗ
     dim (`.off`, deaf to taps) instead of hiding, the bottom row never jumps;
  2. **the eye**: what the player looks at first on each screen, and what is louder than it should
     be;
  3. **the road**: how many taps between wanting a thing and having it;
  4. **the phone**: the same screens at 390 px, measured, not imagined (`test.ps1 -Mobile`);
  5. **the whole**: one language across every screen — the same edges, the same weights, the same
     words.
- **M186 — the walk-through** (run at the end of the night session, 2026-08-25 03:00): every point
  of the author's five messages checked. **Closed tonight:** the old queue (12→13→A2→A3→9→10, six
  versions), the deploy (broken since 0.139.0 — `Get-Content -Encoding Byte` does not exist in
  PowerShell Core; fixed, `docs/live.ps1` now checks sources-vs-site in one line), the postcard
  crops (skyHole by day, ground holes, РАНЕЦ under pads, prompt under console), the Forest-style
  hold, the paper table kept, the pirate base pass 1, buttons that dim instead of vanishing, phone
  measured for real (`test.ps1 -Mobile`, dock/system/surface/table at 390 px). **Still open, for
  the author's morning:** interface passes 2/3/5 (the eye, the road, one language) — pass 4 (the
  phone) is measured and green; pirate base passes 2+ (enemy bodies, hangar dressing, marks
  through walls); M178 tails (flat far ridge, uniform rain). **Perf note:** the night's last
  probe read system 43 / surface 39, but the 0.144 build read the same on the same machine at the
  same hour — the regression is the machine (background load), not the code; re-measure clean
  before believing any number.
