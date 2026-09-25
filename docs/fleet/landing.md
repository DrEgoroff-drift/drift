# Ship «landing» — notes

Zone: `src/19-mode-landing.js`, `src/19-mode-landing-ground.js`, `src/19f-lander.js`, plus the new
`src/19g-landing-gpu.js` (the landing frame's GPU layers). Goal: PLAN G6 for landing — ground and far
ridges as GPU layers, the lander lit by the world's light, its flame lighting the ground, a shadow that
grows as it comes down. The air (19b–19e) is frozen and called as is.

## The frame after this branch

```
drawSkyBase (gpuSky, scene pass)  →  2D: sky bodies, clouds, zenith fade
gpuOver #1  →  far ridges (field lg.ridge)
2D: haze band, warm source glow, far weather, near ground chunks, POI, deco, rocks, motes
gpuOver #2  →  under the lander (field lg.under, blend mul): the cut's grain and form, sun shadow,
               sky shadow, flame light, hatch light; then the lander (field lg.lander over its baked body)
2D: pad, the lander's live bits (braking flames, smoke), dust, near weather; shafts (flag), grade
```

## Commits

| # | Commit | What |
|---|---|---|
| 1 | far ridges | `lgRidges` (19g): both far ridges in one WGSL field over a height texture (`lgHTex`, `tr.h − hMin`, rgba16float N×1, one per approach). Form from the slope and `SUN_DIR` (kept at ≥45 % at night — sky light), rock mottling, gullies down the fall line near the crest, faint strata; the base sinks into the air colour; a thin rim on crests facing a low sun. The 2D `drawGround` calls for the ridges are gone from `drawLanding` (surface still uses `drawGround` for its own far tiles). |
| 2 | under the lander | `lgUnder` (19g), field `lg.under`, blend `mul` — one answer `(L·(1−s), s)` gives `dst·(1−s)·(1+L)`: the shadow darkens, the flame light multiplies the ground's own colour instead of laying an orange disc on it. The sun shadow is an ellipse on the ground plane along the terrain line (the height texture), thrown away from `SUN_DIR` (farther and longer with a low sun), narrow and pale high up, the full hull wide, dark and sharp near the ground; gone at night, washed by weather. A sky shadow (tight dark ellipse) under the belly near the ground at any hour. The flame: a point source under the belly, 1/(1+r²/R²) × incidence, smooth-noise flicker, dimmed by day (`dayK`), a faint glow in the air above the ground; `gpuHaze` shimmer under the nozzles. `drawLander(…,{gnd:true})` drops its 2D contact shadow and the foot shadows — the contact shadow used to float at the feet in mid-air (it sat at `LAND_GY` whatever the altitude). The pad moved after the layer (see open problems). |
| 3 | the lander lit by the world | `drawLander` gets two modes (19f): `bake` — the body only (no flames, thrust glow, beacon, smoke, hot-nozzle glow, hatch pool, contact shadows); `live` — only the braking flames (and their nozzle housings) and the smoke of a broken hull. Called without either flag it paints exactly as before (surface, tests). `lgLanderBake` (19g) bakes the body through `gpuBaked` (GcCtx) per pose key — gear in 8 steps, spring in 16, the three feet and the ramp foot rounded to 1 px, landed/broken, livery, form — at 2× screen density, LRU of 10. `lgLander` draws it in the same `gpuOver` segment as the shadow with field `lg.lander`: relief from the mask's alpha gradient at two scales (edge + roundness), light as the ground's `litRGB` — sky fill `ambK·amb` stronger on up-facing, the star `pow(n·l,.72)·df` with a wrap so thin legs/fin keep grazing light, ground bounce from below, a rim on edges facing the star, a cold night floor; the star's tint is half-desaturated for the hull (white balance — a white hull under an orange dwarf went salmon). The braking flame lights the belly (dimmed by day); the main nozzles glow while hot, the beacon breathes (smooth ramp) instead of clicking, the open hatch keeps its own light at midnight, and its light pool on the ground moved into `lg.under` (V5). Tests: `tests/91q1-landing-gpu.js` (Node): the bake has no live bits and no `lighter`, the live pass has no body, the layers return false without a device, four frames with thrust leave `stateHash` alone. |
| — | merge of the fleet base | `origin/claude/optimistic-gates-u46osn` at 6c39cf9 (kit `Path2D`, `createPattern`, `gpuDrawChunks`; surface's `21e2`, all fourteen ships). No conflicts. |
| 4 | the ground's grain and form | `lg.under` also models the near cut (only where the ground has a material, as surface): rock bumps lit from the star and fading with depth, convex crests lighter and hollows darker at the edge, per-pixel grain anchored to the world, a warm skin of the star's colour on the lit top and a cold sky tint deepening with the cut — the surface ship's recipe (21e2 `GSG_WGSL`, slightly quieter: seen from the approach height it is finer), on my height texture, so the ground reads the same before and after the switch to the surface. The field now answers `(M, 1)` with `M = form·(1−s)·(1+L)`. No new `gpuOver`: the chunks stay 2D canvases (see open problems). |
| 5 | one chunk recipe | `groundChunkStore(tr,fill,line)` and `groundChunkPaint(tr,wx0,wy0,fill,line,pal)` in `19-mode-landing-ground` — the chunk key and the three-pass recipe (form, glaze, hue) that `drawGround` and surface's `surfGroundGpu` (21e2) each carried; `drawGround` now calls them. The surface ship asked for it: 21e2 can switch to `tr.chunks=groundChunkStore(tr,fill,line)` and `(g,wx0,wy0)=>groundChunkPaint(tr,wx0,wy0,fill,line,pal)`, and the two can no longer drift. Frame pixel-identical (`a5-landed.png` vs `a4-landed.png`, max diff 0). |

## Pairs (scratchpad, not in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/490811e5-7c40-51c3-b489-f7ee7a447e9c/scratchpad/`

- `pair1-landing.png` — scene `landing` (rain): the far ridges were one flat blue sheet washed by
  the rain; now two masses, the near one a mountain with gullies and mottled rock, its foot sinking
  into the air.
- `pair1-clear.png` — same, `--js "G.land.p.wx={kind:null}"`: the ridges get rock and form instead
  of two flat fills.
- `pair2-landed.png` — landed on the pad at noon: the ship stands on an elliptical shadow along the
  terrain instead of hovering over a faint smudge.
- `pair2-lownight.png` — 35 m at night, thrust on: the flame lights the ground and the air under the
  belly; before it lit nothing below the hull.
- `pair2-lowday.png` — 35 m at noon, thrust on: the contact shadow that floated at the feet in mid-air
  is gone; the real shadow lies on the ground under the bushes.
- `pair3-lownight.png` — 35 m at night, thrust on: the hull was a white cut-out glowing in the dark;
  now it is a dark body lit warm from below by its own flame, the beacon a soft red lamp.
- `pair3-dusk.png` — 110 m at dusk: the hull takes the dusk light and sits in the frame instead of
  glaring white over a blue-violet world.
- `pair3-lowday.png` — 35 m at noon: the hull has a lit side toward the star, a shaded belly and a
  rim; before, one flat paint on every hour.
- `pair3-landed.png` — landed at noon: lit hull standing on its shadow.
- `pair4-landed.png`, `pair4-lowday.png`, `pair4-dusk.png`, `pair4-lownight.png` — against the new
  fleet base (6c39cf9, which has my 1–2): the cut of the ground reads as rock under the star — lit
  bumps and grain, a warm lit top, cold depth — instead of a printed slab; the hull is lit (3).
- Variants are shot by `shoot.sh <tag> <root> <port> <scene…>` in the scratchpad (lowday, lownight,
  landed, dusk: `--js` sets the hour through the scene's own formula, clear weather, thrust on).

## New render pipelines (for the warm-up table 08b0/08b1)

- `fld.lg.ridge` → `LG_RIDGE_WGSL` (19g), blend `over`.
- `fld.lg.under` → `LG_UNDER_WGSL` (19g), blend `mul`.
- `fld.lg.lander` → `LG_LANDER_WGSL` (19g), blend `over`, sampler `gpuMipSmp()`.

## Requests outside the zone

- **`19c-light.js` `litRGB` (frozen air — for the author): the slope normal is mirrored.** It takes
  `nx=-slope/nl, ny=-1/nl`; the profile's y grows downward (`tr.h − camy` is the screen y and the
  ground is filled below it), so a face that descends to the right (`slope>0`) looks right-up and its
  normal is `(slope,−1)/nl`. `SUN_DIR` points to the star (`sunDirSet`: `vx=−az`, `sunSpot` puts the
  disc at `W·(.5−az·.4)`; `groundShadow` throws shadows away from it — right). Result: the chunk art
  lights the slopes that face away from the star (seen at dusk, star on the right: the left-facing
  slopes are the light ones). The fix is one sign: `nx=slope/nl`. The same sign lives in
  `19-mode-landing-ground` (the «движки» highlight test `slope*sunx>-.07`, mine — flipped together
  with `litRGB` so the two never disagree) and in `21e2-surface-gpu.js` `GSG_WGSL` (`lit=dot(vec2f(-s,-1.)…)`,
  surface's). My fields (`lg.ridge`, `lg.under`) use the true normal already.
- `21e2-surface-gpu.js` (surface): use `groundChunkStore`/`groundChunkPaint` from 19-mode-landing-ground
  instead of the copied key and recipe in `surfGroundGpu`.
- `08b0-gpu-pipe.js` `GPU_FLD`: add `"fld.lg.ridge":()=>LG_RIDGE_WGSL`, `"fld.lg.under":()=>LG_UNDER_WGSL`,
  `"fld.lg.lander":()=>LG_LANDER_WGSL` so the warm-up table can compile them.

## Open problems

- The landing frame now has two extra `gpuOver` (each an upload of `#c` + one composite) — the
  budget DESIGN-gpu §3 allows (two or three).
- 2D content that goes through a `gpuOver` segment is composited by `fsComp`, which makes a
  saturated colour near 1 an emitter (bloom); the last front layer does not emit. So moving the
  ground into a segment made the pad's amber edge glow in daylight: the pad is drawn after the
  under-layer (and so takes no ship shadow — it is four pixels tall). POI lamps now in the segment
  may glow a little; that reads as lamps, left as is.
- The pad (and its light column) is 2D after the GPU lander, so it lies over the lander: the plate
  covers ≤1 px of the feet, and the column's faint light crosses the hull on approach (reads as air
  light in front). Fixing it for real needs the pad on the GPU too (a small field or `gpuShapes`) —
  a next step in this zone.
- The braking flames are still 2D `drawFlame` (03b) in the final front layer: they do not bloom.
  A flame field in `lg.lander` (like `HG_FLAME_WGSL` in 17c2, which is flight's and not mine) would
  let them glow.
- The lander bake key reads the livery by value; `hullOf` is called per frame for it.
- The near ground chunks are still 2D canvases drawn with `drawImage` on `#c`. Moving them to
  `gpuDrawChunks` (as surface did) needs them in a GPU pass *between* the far weather (2D) and the
  POI/deco (2D) — a third `gpuOver` in landing, or the lander moved above POI/deco into the same
  segment (then the big translucent deco forms near the pad would cover the hull). Left as is: two
  segments, and the chunk bake is already cached.
