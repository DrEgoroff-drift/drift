# Ship «road» — the road companion and the rail ride on the GPU (PLAN G12)

Branch `claude/gpu-road`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `18g-rail-ride`, `18k-rail-scheme`, `18h`–`18j` (if they draw), `27l-road-draw`,
`27la-road-sky`, `27lb-road-bloom`, new `27lc-road-gpu`, and their tests.

## How the road reaches the GPU

The road had its own 2D canvas `#roadcv` and its own rAF; the main loop returns early while
`body.road` is set, and `body.road > *:not(#roadwin){display:none}` (style.css) hides `#g` and
`#hud`. So the road now runs the ordinary GPU frame itself from `drawRoad`:

`gpuFrame` → under everything (`gpuScene`): the sky field, stars and sparks (`gpuShapes`), the
bloom field with the bottom fade → hull, trail, jets 2D on `#c` (`MAIN_CTX`; the trail's bottom
fade is `destination-out`) → `gpuWorld(ROAD_GLOW)` (frame bloom, grain, vignette) → numbers and
coins on the `#hud` layer (`gpuHud` keyed by frame, so it clears every frame) → `gpuPresent`.
No `gpuOver` at all (since commit 2): one `#c` upload a frame. `gpuOver` made the hot trail an
emitter (08b `emit`, ×150 for saturated near-1 2D colour) and the frame bloom bleached it white.

`roadGpuMount(on)` (27lc) moves `#g` and `#hud` into `#roadwin` for the ride, under `#roadcv`, and
back after `#c` on close (`roadClose`, and `resetWorld` through it). `#roadcv` stays as a 1×1
transparent layer that only catches the finger (tap flash, long-press sensor window); tap
coordinates are now CSS px, like the whole frame. The road's coordinates are CSS px (`W`,`H`
globals) instead of the old canvas pixels.

Census gap 4 (`roadHullHalf` swaps the global `ctx`): kept, but the measurement now runs
**before** `gpuFrame()` in `drawRoad`, on its own plain 2D canvas — never inside a GPU frame, so
`drawHull`'s GPU hooks (`ctx.canvas===cvs`) never see the swapped context.

## Commits

1. **Road frame on the GPU; the bloom field is a shader.** `27lb` `roadBloom` is a `gpuField`
   (`road.bloom`, `add`): the same recipe (domain warp, spectrum across X, bass flow, treble
   ripple, closed five-hue loop) per screen pixel, every frame, three octaves; the bottom edge
   line joined the same field. Deleted: the 88-px ImageData field, the 26 Hz cadence, the 64-step
   LUT, `roadHsl`/`roadBloomLut`. `27l` draws through the frame (above). Tests: the three pixel
   suites in `91zzy-road` read `gpuSnapshot()` (`roadShot`), the leak suite checks `#g` came back.

2. **The sky on the GPU; bloom under the hull; no `gpuOver`.** `27la` `roadSky` is one field
   (`road.sky`, `over`: the old gradient, three nebulae as warped-noise clouds instead of radial
   discs, the hyper tunnel as two layers of streaks in the field) and one `gpuShapes` call
   (`add`: stars as soft capsules with halos on the big ones, glints, dust, mates with a
   tapering exhaust, beat sparks, tap flashes as a soft disc and an antialiased ring). Absolute
   sizes tuned on the DPR-2 canvas are scaled to CSS px (`k`). The bloom field moved into the
   scene pass and took over the bottom fade (`over`: background × m + light), `ROAD_GLOW` .30 →
   .18. `roadRgb(h,s,l)` is the one hsl helper left.
3. (notes only) this file brought up to date with commit 2.
4. **The rail ride's light on the GPU.** New `18ga-rail-gpu.js`; `drawRail` (18g) order:
   the background is a rect in the scene pass (the 2D `#03040a` fill on `#c` would have hidden
   the map ship's GPU galaxy once G10 lands) → `drawGalaxy`/`drawGalaxyStars`/`drawRailMap`
   (map zone, untouched) → `gpuOver` #1: the own line as light (`railLineGpu`: an additive glow
   that is denser near the car and carries a travelling current pulse, then casing, colour and
   centre line with analytic AA; the bus's 10/7 dash as capsules) → 2D stops, names, the car →
   `gpuOver` #2: `railFx` field (`rail.fx`, `add`) — headlight cone with soft edges and falloff,
   the hyper flash (small white core, cyan halo, beam), transit streaks around the car while it
   runs (lanes along the heading, flowing back, strength from the ease-in-out velocity) → 2D
   header. The old 2D headlight wedge and the ride's `railFlash` call are gone; `railFlash`
   itself stays 2D for `drawRailArrive`, which is drawn in `G.mode==="system"` (flight zone).
5. **The line scheme is baked by the GPU canvas.** `railSchemeOpen` (18k) bakes the sheet with
   `gpuBake` (the 08ca canvas, same 2D calls, `mips:false`) and copies the texture into the
   scheme's DOM canvas, now a `webgpu` context (`rgba8unorm`, premultiplied,
   `copyTextureToTexture`); the bake is dropped at once. No GPU → no sheet (WebGPU only).
   Better paper: fibres (four batched strokes of short seeded hairs, `rng(0x5C4E)`), ink bleed
   (a pale wider stroke under each line), a light edge beside each fold's shadow, hand-darkened
   edges.
- `18h-rail-powers`, `18i-rail-life`, `18j-rail-rush` draw nothing (no `ctx`, no canvas):
  nothing to port.

## Pairs (scratchpad, not in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/dd195914-77e6-54d0-aad8-6239947869e4/scratchpad/`.
Scene: `system` + `--js roadOpen()…` (90 km/h, tier 1; and 850 km/h, tier 3), a fake analyser
with a beat, 90 extra stepped frames — `shots.sh` there.

- commit 1: `before-road90.png | a1-road90.png`, `before-road850.png | a1-road850.png` — the
  bloom is drawn per pixel at full resolution: filaments with edges instead of a 6× stretched
  blur, the colour loop without LUT steps, dense cores over 1.0 that the frame bloom haloes; the
  whole road frame gets grain and blue-noise dither. (The engine trail came out whiter under the
  frame bloom — fixed in commit 2.)
- commit 2: `before-road90.png | a2b-road90.png`, `before-road850.png | a2b-road850.png` — the
  nebulae read as clouds with ragged edges and filaments instead of three flat discs, stars
  have soft edges and the big ones a halo, the tunnel streaks brighten toward their outer end;
  the trail is back to its cream-amber and no longer clips (peak 231 vs 255, the shoulder keeps
  the gradient). `a2-*` is the intermediate try with `gpuOver`, kept to show the white trail.
  Suite logic checked on the GPU frame (`--eval evalbloom.js`): bottom glow lit 3178, colour
  families r/b, hull pixels 960, 0 GPU errors.

- commit 4: `before-rail.png | a3c-rail.png` (ring line), `before-railbus.png |
  a3c-railbus.png` (the «маршрутка», dashed) — the own line is a lit rail with a glow that
  thickens near the car instead of a flat stroke; streaks around the car show the transit (the
  old frame showed motion only in the flash); the flash has a core and a cyan halo over the car.
  `a3-*` and `a3b-*` are the tries before (streaks as rain over the whole frame, then a white
  flash that swallowed the car). Two `gpuOver` a frame in rail mode.
- commit 5: `before-scheme.png | a4-scheme.png` — the sheet reads as a folded paper handout:
  edges darkened, each fold has a lit edge beside its shadow, lines sit in a faint ink bleed.
  The gain is small at 760 px; the fibres show only up close.
- phone check (after commit 5, 390×844 at DPR 2): `pair-roadphone.png` (`before-roadphone.png |
  a5-roadphone.png`) — the portrait layout is unchanged, the numbers are crisp on `#hud` at the
  device DPR, the bloom reads as flowing curtains instead of a flat band; the suite checks pass
  on it too (lit 4245, hull 960, 0 GPU errors).

## Left in the zone

Nothing ported is left undone. Not ported, on purpose (hybrid rule): the road's trail ribbon,
jets, cocoon and the hull; the ride's stops, names, car and header; all text.

## For the design pass (real GPU, Контроль) — per scene

- **Road, 90 km/h** (`shots.sh`, tier 1): the bloom's colour loop against the mood hue — are the
  curtains too blue/magenta on the S23; the height of the light at the bottom vs the footer
  glass; the nebula clouds' contrast (they may want more cold key, a warm accent); star halo
  size on DPR 3; `ROAD_GLOW` .18 against the trail — the trail must stay cream-amber, never white.
- **Road, 850 km/h** (tier 3): the tunnel streak density and speed (`fract(t*1.6)`) at 60/120 Hz;
  whether the tunnel should be tinted by the mood or stay pale; the cocoon under the hull.
- **Road on the phone** (390×844): the cost of redrawing `#hud` every frame at DPR 2.625; text
  sizes; the bottom fade into the footer.
- **Rail ride** (`railshots.sh`, ring and bus): the line glow strength near the car and the
  pulse speed; the transit streaks (lane density, length) — they must read as motion, not rain;
  the headlight cone is hidden under the flash in the shots — look at it mid-run with no flash;
  the flash's cyan halo vs the old one. Consider `BLOOM_K.rail` (request above).
- **Line scheme** (`schemeshots.sh`): the fibres are barely visible at 760 px — check at DPR 2
  up close; the edge darkening strength; the fold highlight.

## New render pipelines (for the warm-up table `08b1`)

- `fld.road.bloom|over` — `gpuField` with `ROAD_FLD_WGSL` (27lb).
- `fld.road.sky|over` — `gpuField` with `ROAD_SKY_WGSL` (27la).
- `fld.rail.fx|add` — `gpuField` with `RAIL_FX_WGSL` (18ga).
- the scheme uses only the 08ca bake pipelines (no new ones).
- (`kit.shp|add`, `kit.shp|over` — already in the kit.)

## Requests outside the zone

- `src/19c-light.js` (frozen, PLAN G5): `BLOOM_K` has no `rail` entry, so the ride gets no frame
  bloom (`gpuWorld(0,…)` in 28-loop). Proposed: `rail:.22` — the flash and the lit line would
  get a real halo. Not needed for correctness.

## Open problems

- The zone is done: bloom field, sky, the road frame, the rail ride and the scheme are on the GPU.
  What stays Canvas 2D on purpose (hybrid rule — complex vector shapes and text): the road's
  trail ribbon, manoeuvre jets, hyper cocoon, the hull (`drawHull`, flight zone), numbers and
  coins on `#hud`; the ride's stops, names, the car and the header.
- `#hud` is redrawn every road frame (`gpuHud("road"+frameNo)`) at the device DPR: the same cost
  class as the old full-screen `#roadcv` at DPR ≤ 2, but a DPR-3 phone pays more pixels. If the
  S23 shows it, key the layer by the text content and redraw only the coins every frame.
- Grain, vignette and frame bloom are gated on `G.running` in `gpuWorld`; the road is opened from
  the in-game menu, so that holds, but a road opened with the game paused would lose them.
- `#roadcv` stays in `index.html` as the finger layer (1×1 backing). It could be renamed or turned
  into a plain div by whoever owns `index.html`; not needed.

- The road's browser suites can't be run with a GPU in this cloud: `tests.html` under
  `--dump-dom` never gets `GPU.ok` (SwiftShader warm-up; G13 is the tools ship's). Without a GPU
  the bloom suite is red by design (WebGPU only, no fallback); the hull/brake suites pass on `#c`.
  The pixel logic was checked on the frame through `docs/shot.py --eval` instead (commit 2).
- Commit 1's message ended with `Claude-Session` after `Co-Authored-By`; from commit 2 on
  `Co-Authored-By` is the last line, as the fleet rules ask.
