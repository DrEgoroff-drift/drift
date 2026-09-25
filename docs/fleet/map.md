# Ship «map» — G10, the map on the GPU

Branch `claude/gpu-map`, from `claude/optimistic-gates-u46osn`. Zone: `17z-map-backdrop`, `17z1-galaxy`,
`17z2-galaxy-names`, `18-mode-map`, `18a-map-addr`, `18b-map-hold`, `18e-rail-net`, `18f-rail-station`, their tests;
new module `17z3-map-gpu`.

## Commits

1. `0166b8d` **galaxy as a field, stars as lit points** — `17z3-map-gpu` (new), `17z1-galaxy`, `18-mode-map`.
   - `galTile`/`galBake` (CPU pixel loop, 128² tiles at 4 texels a sector, a row budget, fade-in over 12 frames)
     are gone. `drawGalaxy(V,cell)` keeps its signature and draws `GAL_WGSL` through `gpuField` per pixel.
     The WGSL hash/noise is bit-exact with `hashi`/`noise2`/`fbm2` (u32 wrap-around multiply), so the sky
     agrees with `galaxyCell` (stars, names, rails). Model constants are interpolated from the JS ones.
   - On top of the model, only what the old 13-px texel hid: gas filaments along the arm and a torn dust-lane
     edge, both faded in by zoom (`fine` = clamp((cell-12)/36)); light behind dust reddens; HII knots emit a
     little pink; empty sky is cold `#03040a` but not under lit gas (the warm bulge stays warm).
   - `drawGalaxyStars`: power-law brightness (`hb^14` tail — few bright, many faint), an AA core + a soft halo on
     the bright ones, a seventh bucket for reddened stars behind dust; drawn with `gpuShapes` (add).
     `GAL_STAR_BUF` keeps stride 3, so the density test is untouched.
   - `drawMap`: no opaque `fillRect` — the galaxy field is the opaque first layer. System stars
     (`mapStarPaint` on 2D) are now `mapStarsGpu`: one `gpuOver()` after lanes/holdings/rumours, additive glow in
     three scales and tapered spikes; every marker (occupation, station ring, «ВЫ», labels) stays 2D above.
   - Pass rule (`mapGpuPass`): an open over-pass if any, else the scene pass; the sky itself goes over (`gpuOver`)
     when `#c` already has 2D on it — so the rail ride (18g, which fills `#c` black first) still gets its sky.
2. `5b822d9` **rails as ribbons** — `18e-rail-net`: `drawRailMap` on `gpuShapes`: quad ribbons with hard joins (no beads at
   the bends of translucent lines), the dark casing when close, an additive glow under ring/arm lines, station
   discs and rings from the kit; each polyline clipped to the frame. `railNetPartial()` still runs every frame
   without a GPU (logic, not paint).
3. `65c5c6a` **the jump circle lights the sky** — `18-mode-map`, `17z3`: the 2D radial-gradient fill of the jump circle goes;
   `drawMap` hands the circle to the field (`MAPGPU.lamp`), which brightens the galaxy inside reach, dims it
   outside (only when zoomed in: `.3*clamp((cell-18)/30)`, so the spiral still reads zoomed out) and adds a
   thin teal rim toward the edge. The hairline stroke stays 2D.
4. `3cb695a` **named nebulae glow** — `17z3`: the ten `GAL_NEBULAE` of `17z2` were a dot and a word; now each is an emission
   cloud in the galaxy field (a gaussian mask per nebula, one shared fbm for the gas, a pink or amber core, a teal
   or blue edge, dark globules; `GNEB` is baked into the WGSL from the JS table). Cost: one 4-octave and one
   3-octave fbm per pixel, only where a nebula is within 4 sectors.
5. `3a268b6` **test** — `tests/91zzzzk-mapaddr.js`, suite «галактика: шейдер неба держит модель» (Node tier): the WGSL
   carries the model constants and every named nebula, the CPU tile bake is gone, `drawMap` runs 40 frames
   without a GPU and the rail net still grows a line a frame (dies if `railNetPartial` moves behind the pass check).
6. `83be3f8` **the galaxy made of stars** (quality bar of 25.09) — `17z3`: unresolved star grain in world space (one hashed
   soft point per cell of a power-of-two step ≈7 px on screen, two levels cross-faded, density by the light, none
   behind dust, power-law brightness); a warm halo around the bulge past the model's cap; a soft vignette so the
   sheet's light gathers to the middle; per-pixel grain instead of flat fill.
7. `c23b091` **structure you can see at home, a brightness ladder, your rails lit** (coordinator feedback of 25.09) — `17z3`,
   `18e`: the bar gets its two offset dust lanes (straight, on opposite leading edges, torn by noise) and a warm
   ridge, so the home frame shows a warm elongated core cut by a dark lane instead of an even glow; star grain
   follows the light more steeply; system stars climb a ladder by class (glow radius and strength), and only the
   five brightest in frame carry tapered spikes with a white-hot middle (L1.7); rails with a stop inside the jump
   reach burn — additive wide glow, a strong ribbon, a white core — while the rest are a pale frame.

## What stays 2D, on purpose

Text everywhere (galaxy and nebula names, the system card, labels, rulers' numbers), and the address/holding
vector layers of `18a`/`18b` (grid, rings, rumour hatch clipped to cells, house patches, chips, the rose): thin
UI strokes with clips and dashes, where Canvas 2D is the brush (DESIGN-gpu §0) and a GPU copy would be parity,
not a gain. `17z-map-backdrop` stays 2D for the site (`war.js`).

## For the design pass (Контроль, real GPU — not polished in the cloud, 25.09)

All knobs live in `17z3-map-gpu.js` (`GAL_WGSL`, `mapStarsGpu`) and `drawRailMap` in `18e`.
- **Galaxy structure at map zoom.** Home (zoom 1) shows only the core: warm bar ridge (`.085`), halo
  (`.045·e^(-r/5)`), bar dust lanes (offset `.62+.14|u|`, strength `.75`). Check the balance against text on the
  system card (the core behind its second line is brighter now), and whether arms should read already at zoom 1–2.
  `GAL_GLOW_CAP` still bounds the model; the extras above sit outside it.
- **Star grain.** Unresolved stars: step ≈7 px on screen, density `pow(glow,1.25)·3`, strength `.30`. On a
  real GPU at DPR 2.6 the 7 CSS px step may look different — check the phone.
- **Star brightness ladder.** System stars: glow radius `rr·(6+5·t/2)`, spikes on the five brightest in frame
  (`MAP_SPIKE_N`). Map bloom is 0 (`BLOOM_K`, `19c-light`, frozen) — with bloom the halos could be cut back.
- **Rails.** «Yours» = a stop within jump reach: glow `.07+.06k`, ribbon `.55+.35k`, white core `.35`; others pale
  `.10–.13`. Check that yours read without shouting over the stars, and the pale ones at zoom 4.
- **Jump circle.** Light on the field (`MAPGPU.lamp`): inside ×(1+.12), outside ×.7 only zoomed in, a teal rim
  `.05`; the 2D hairline stays. Check that the reach reads at zoom 1 over the busy address layer.
- **Named nebulae.** Brightness `.4`, radius `1.3–1.8` sectors; check against names and addresses at zoom 2.

## Pairs (scratchpad of session a777c21e…, 760×475, before = fleet base e4c3a56)

- `scratchpad/pair1-map.png` (`map`) — the rails glow and sit on a dark casing instead of a hairline; galaxy stars are
  crisp AA points with a few bright ones, not 1-px squares; system stars' light falls off softly.
- `scratchpad/pair1-map-z4.png` (`map`, `--js "G.mapZoom=4"`) — the spiral reads: arms are lit bands with a dust lane
  on the inner edge, per pixel instead of 13-px texels; the core stays warm, the sky between arms cold.
- `scratchpad/pair3-map.png` (`map`) and `scratchpad/pair3-map-z4.png` (zoom 4) — **the honest line:** the home
  sheet now sits in a luminous warm core made of thousands of stars that falls off into cold dark edges, where
  before it was flat near-black murk; zoomed out, the spiral, its dust lanes and the pink nebulae read at a glance.
- `scratchpad/pair4-map.png` (`map`) and `scratchpad/pair4-map-z4.png` — **honest line:** at home a warm barred core
  with a dark dust lane and five sparkling stars, where before a flat brown murk with every star alike; zoomed out
  the spiral with pink nebulae and a starry core. Cost: the core behind the system card's second line is brighter,
  the text still reads but with less contrast.
- `scratchpad/after-mine.png` (parked at a ring-line stop) — the lines you can reach burn as lit ribbons through the
  jump circle; the others stay a pale frame.
- `scratchpad/pair2-map.png` (`map`) — the reach reads as light in the sky itself: the galaxy is brighter and warm
  inside the jump circle and sinks into the dark beyond it, instead of a flat teal wash over the address layer.
- `scratchpad/pair-neb.png` (`map`, `--js "var n=GAL_NEBULAE[5];G.mapView={x:n.x+1,y:n.y};G.mapZoom=2;"`) — «Печка»
  is a place you can see: a pink cloud with a teal rim and dark knots, where before there was only empty sky.
- `scratchpad/pair-rail.png` (`map` + `railRideStart` on the «Рыжий рукав» arm) — the rail ride keeps its sky
  through the shared `drawGalaxy` (gpuOver path, 0 errors); near parity, the road ship owns the rest of the ride.

## Requests outside the zone

- `19c-light.js` (`BLOOM_K`, frozen air files): `map:0`. With the stars now additive GPU light, `map:.12` would give
  the bright ones a real bloom. Not touched.
- `18g-rail-ride.js` (road ship): `drawRail` starts with `ctx.fillRect("#03040a")`; drop it — then the sky goes
  into the scene pass instead of costing a `gpuOver` upload. Works as is meanwhile.
- `site/war-map.js` uses `mapNebula`/`mapBandPaint`/`mapStarPaint` from `17z-map-backdrop` (bundled into `war.js`
  by `build.ps1`): that module stays Canvas 2D for the site; the game no longer calls it except `mapRhumbPaint`
  and the grid.

## New render pipelines (for `08b1` warm-up)

- `fld.map.gal|over` (gpuField, the galaxy)
- `kit.shp|add` and `kit.shp|over` (already common)

## Open problems

- `docs/TESTMAP.json` is rewritten by the build for the new suite; left for the integrator's rebuild.
- The WGSL galaxy is checked against the model only by its constants; the bit-exact hash was verified by eye (the
  arms, lanes and galaxy stars line up in the pairs), not by a pixel test — the browser tier does not run here.

- The galaxy field costs ~70 hashes a pixel every frame while the map is open. If the phone minds, cache it in a
  texture keyed by (V, cell, W, H) — the kit has no GPU-to-texture bake for fields yet.
- `drawSysRail` in `18f` (flight) keeps a dead 2D fallback after `railGpu`; flight is off-limits, left as is.
