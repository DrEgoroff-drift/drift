# Ship «map» — G10, the map on the GPU

Branch `claude/gpu-map`, from `claude/optimistic-gates-u46osn`. Zone: `17z-map-backdrop`, `17z1-galaxy`,
`17z2-galaxy-names`, `18-mode-map`, `18a-map-addr`, `18b-map-hold`, `18e-rail-net`, `18f-rail-station`, their tests;
new module `17z3-map-gpu`.

## Commits

1. **galaxy as a field, stars as lit points** — `17z3-map-gpu` (new), `17z1-galaxy`, `18-mode-map`.
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
2. **rails as ribbons** — `18e-rail-net`: `drawRailMap` on `gpuShapes`: quad ribbons with hard joins (no beads at
   the bends of translucent lines), the dark casing when close, an additive glow under ring/arm lines, station
   discs and rings from the kit; each polyline clipped to the frame. `railNetPartial()` still runs every frame
   without a GPU (logic, not paint).
3. **the jump circle lights the sky** — `18-mode-map`, `17z3`: the 2D radial-gradient fill of the jump circle goes;
   `drawMap` hands the circle to the field (`MAPGPU.lamp`), which brightens the galaxy inside reach, dims it
   outside (only when zoomed in: `.3*clamp((cell-18)/30)`, so the spiral still reads zoomed out) and adds a
   thin teal rim toward the edge. The hairline stroke stays 2D.
4. **named nebulae glow** — `17z3`: the ten `GAL_NEBULAE` of `17z2` were a dot and a word; now each is an emission
   cloud in the galaxy field (a gaussian mask per nebula, one shared fbm for the gas, a pink or amber core, a teal
   or blue edge, dark globules; `GNEB` is baked into the WGSL from the JS table). Cost: one 4-octave and one
   3-octave fbm per pixel, only where a nebula is within 4 sectors.

## Pairs (scratchpad of session a777c21e…, 760×475, before = fleet base e4c3a56)

- `scratchpad/pair1-map.png` (`map`) — the rails glow and sit on a dark casing instead of a hairline; galaxy stars are
  crisp AA points with a few bright ones, not 1-px squares; system stars' light falls off softly.
- `scratchpad/pair1-map-z4.png` (`map`, `--js "G.mapZoom=4"`) — the spiral reads: arms are lit bands with a dust lane
  on the inner edge, per pixel instead of 13-px texels; the core stays warm, the sky between arms cold.
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

- The galaxy field costs ~70 hashes a pixel every frame while the map is open. If the phone minds, cache it in a
  texture keyed by (V, cell, W, H) — the kit has no GPU-to-texture bake for fields yet.
- `drawSysRail` in `18f` (flight) keeps a dead 2D fallback after `railGpu`; flight is off-limits, left as is.
