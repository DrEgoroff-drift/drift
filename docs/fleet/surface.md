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
gpuOver #2 near ground … (next sub-item)
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

## Pairs (scratchpad, not in git)

- `pair1-noon.png`, `pair1-surface.png` (top before, bottom after) — the far ridges get form: lit and
  shaded facets instead of one flat haze colour, and their feet sink into the air instead of standing as
  a wall.

## Requests outside the zone

- `08b0-gpu-pipe.js` `GPU_FLD`: add `"fld.sridge":()=>GSR_WGSL` so the warm-up table can compile it.

## New render pipelines (for the warm-up table 08b1)

- `pipe:fld.sridge|over`

## Open problems

- Wave 2: `Path2D` in `GcCtx` is not merged in the base yet (checked at start) — deco, POI skin,
  geology and built wait for it.
