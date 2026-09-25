# Ship «road» — the road companion and the rail ride on the GPU (PLAN G12)

Branch `claude/gpu-road`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `18g-rail-ride`, `18k-rail-scheme`, `18h`–`18j` (if they draw), `27l-road-draw`,
`27la-road-sky`, `27lb-road-bloom`, new `27lc-road-gpu`, and their tests.

## How the road reaches the GPU

The road had its own 2D canvas `#roadcv` and its own rAF; the main loop returns early while
`body.road` is set, and `body.road > *:not(#roadwin){display:none}` (style.css) hides `#g` and
`#hud`. So the road now runs the ordinary GPU frame itself from `drawRoad`:

`gpuFrame` → sky under everything (`gpuScene`) → hull, trail, jets 2D on `#c` (`MAIN_CTX`) →
`gpuOver` + the bloom field (`add`) → `gpuWorld(ROAD_GLOW)` (frame bloom, grain, vignette) →
numbers and coins on the `#hud` layer (`gpuHud` keyed by frame, so it clears every frame) →
`gpuPresent`.

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

## Pairs (scratchpad, not in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/dd195914-77e6-54d0-aad8-6239947869e4/scratchpad/`.
Scene: `system` + `--js roadOpen()…` (90 km/h, tier 1; and 850 km/h, tier 3), a fake analyser
with a beat, 90 extra stepped frames — `shots.sh` there.

- commit 1: `before-road90.png | a1-road90.png`, `before-road850.png | a1-road850.png` — the
  bloom is drawn per pixel at full resolution: filaments with edges instead of a 6× stretched
  blur, the colour loop without LUT steps, dense cores over 1.0 that the frame bloom haloes; the
  whole road frame gets grain and blue-noise dither. (The engine trail came out whiter under the
  frame bloom — tuned in commit 2.)

## New render pipelines (for the warm-up table `08b1`)

- `fld.road.bloom|add` — `gpuField` with `ROAD_FLD_WGSL` (27lb).
- (`kit.shp|add`, `kit.shp|over` — already in the kit.)

## Requests outside the zone

- none yet.

## Open problems

- The road's browser suites can't be run with a GPU in this cloud: `tests.html` under
  `--dump-dom` never gets `GPU.ok` (SwiftShader warm-up; G13 is the tools ship's). Without a GPU
  the bloom suite is red by design (WebGPU only, no fallback); the hull/brake suites pass on `#c`.
  The pixel logic is to be checked on the frame through `docs/shot.py --eval` instead.
