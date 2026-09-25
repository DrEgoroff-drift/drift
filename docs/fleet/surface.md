# Ship «surface» — notes

Zone: `21-mode-surface`, `21e-surface-draw`, `21e1-surface-world`, `21b-surface-deco`, `21ba-deco-shapes`,
`21bb-deco-biomes`, `21c-built`, `20a-poi`, `20aa-poi-shapes`, `20b-poi-find`, `18b-geology`, and their tests.
New file: `21e2-surface-gpu.js` (after `21e1`, byte order).

## Frame order on the surface (after this ship)

```
gpuScene   sky (19ca, unchanged)
2D         stars, sky bodies, clouds (19-mode-landing, frozen air)
gpuOver #1 far ridges — one field, both layers (21e2 surfRidgesGpu)
2D         hazeBand, far weather (frozen)
gpuOver #2 near ground — chunk textures + one multiply field (21e2 surfGroundGpu); live grass stays 2D
2D         everything that stands on the ground
```

Without a device (`GPU.on` false — the Node tier) the old 2D tiles still draw, so the tests that read
`G.surf.farA`/`tr.chunks` keep their meaning.

## Commits

1. **far ridges on the GPU** — `surfRidgesGpu` in `21e2`: `tr.farH[0..1]` and `tr.h` go up once per
   planet as an N×3 rgba8 texture (16-bit, 1/8 px, relative to the strip's mean); one `gpuField`
   (`fld.sridge`) draws both ridges above the 2D sky layer. Better than the flat `hazeFar` fill: a
   small crag along the crest, sun-facing facets lit and turned-away ones shaded (fading with depth),
   the foot of each ridge sinks into the air's colour with a slow drifting valley mist, a thin
   sun-side rim on the crest, world-anchored grain.
2. **near ground chunks as textures** — `surfGroundGpu` in `21e2`: the same chunk store, key and bake
   recipe as `drawGround` (so a chunk baked by landing is reused here and back), laid by `gpuImage` in
   the second `gpuOver`; then one multiply field (`fld.sground`) over the ground mask from the height
   texture: micro-relief of the rock lit from the star's side and fading with depth, convex crests
   lighter and hollows darker at the edge, pixel grain anchored to the world. Live grass stays 2D above.
3. **merge of the fleet base** (kit `Path2D`, `createPattern`, `gpuDrawChunks`; landing, places, rooms…).
4. **a third plane and a warm/cold key** — `tr.farH[2]`, a third, farthest ridge (taller, slower
   parallax, almost the air colour) drawn only by the GPU field (texture row 3); gullies down the fall
   line on the ridges; on the ground a warm skin of star colour on sun-facing slopes and a cold sky tint
   deepening with the cut (key warm, fill cold). The 2D path ignores the third ridge.

## Pairs (scratchpad, not in git)

- `pair1-noon.png`, `pair1-surface.png` (top before, bottom after) — the far ridges get form: lit and
  shaded facets instead of one flat haze colour, and their feet sink into the air instead of standing as
  a wall.
- `pair-after2-noon.png`, `pair-after2-surface.png` (+ crops `cb-/ca-after2-*.png`) — the cut face of the
  ground reads as rock under the star (lit bumps, grain) instead of a flat printed slab.
- `pair-a4-noon.png`, `pair-a4-surface.png`, `pair-a3-night.png` — three planes of air behind the walker
  instead of two, the lit top of the ground glows warm while its body goes cold: the frame gets depth and
  a second temperature.

## Requests outside the zone

- `08b0-gpu-pipe.js` `GPU_FLD`: add `"fld.sridge":()=>GSR_WGSL` and `"fld.sground":()=>GSG_WGSL` so the
  warm-up table can compile them.
- `19-mode-landing-ground.js` (landing ship): the chunk bake recipe inside `drawGround` is copied in
  `surfGroundGpu`; a shared `groundChunkPaint(tr,fill,line,pal)` there would keep the two from drifting.

## New render pipelines (for the warm-up table 08b1)

- `pipe:fld.sridge|over`
- `pipe:fld.sground|mul`
- `pipe:kit.img|over` (already known)

## Open problems

- `surfGroundGpu` bakes chunks on a 2D canvas and uploads them (one upload per chunk); the kit's
  `gpuDrawChunks` could bake them on the GPU instead — not switched: the bake runs `drawGround`,
  `drawRocks`, `glazeGround` (landing's and 18a1's code), whose GcCtx compatibility is not proven here.

- Wave 2: `Path2D` in `GcCtx` is not merged in the base yet (checked at start) — deco, POI skin,
  geology and built wait for it.
