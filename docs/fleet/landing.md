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
gpuOver #2  →  under the lander (field lg.under, blend mul): sun shadow, sky shadow, flame light,
               hatch light; then the lander (field lg.lander over its baked body)
2D: pad, the lander's live bits (braking flames, smoke), dust, near weather; shafts (flag), grade
```

## Commits

| # | Commit | What |
|---|---|---|
| 1 | far ridges | `lgRidges` (19g): both far ridges in one WGSL field over a height texture (`lgHTex`, `tr.h − hMin`, rgba16float N×1, one per approach). Form from the slope and `SUN_DIR` (kept at ≥45 % at night — sky light), rock mottling, gullies down the fall line near the crest, faint strata; the base sinks into the air colour; a thin rim on crests facing a low sun. The 2D `drawGround` calls for the ridges are gone from `drawLanding` (surface still uses `drawGround` for its own far tiles). |
| 2 | under the lander | `lgUnder` (19g), field `lg.under`, blend `mul` — one answer `(L·(1−s), s)` gives `dst·(1−s)·(1+L)`: the shadow darkens, the flame light multiplies the ground's own colour instead of laying an orange disc on it. The sun shadow is an ellipse on the ground plane along the terrain line (the height texture), thrown away from `SUN_DIR` (farther and longer with a low sun), narrow and pale high up, the full hull wide, dark and sharp near the ground; gone at night, washed by weather. A sky shadow (tight dark ellipse) under the belly near the ground at any hour. The flame: a point source under the belly, 1/(1+r²/R²) × incidence, smooth-noise flicker, dimmed by day (`dayK`), a faint glow in the air above the ground; `gpuHaze` shimmer under the nozzles. `drawLander(…,{gnd:true})` drops its 2D contact shadow and the foot shadows — the contact shadow used to float at the feet in mid-air (it sat at `LAND_GY` whatever the altitude). The pad moved after the layer (see open problems). |
| 3 | the lander lit by the world | `drawLander` gets two modes (19f): `bake` — the body only (no flames, thrust glow, beacon, smoke, hot-nozzle glow, hatch pool, contact shadows); `live` — only the braking flames (and their nozzle housings) and the smoke of a broken hull. Called without either flag it paints exactly as before (surface, tests). `lgLanderBake` (19g) bakes the body through `gpuBaked` (GcCtx) per pose key — gear in 8 steps, spring in 16, the three feet and the ramp foot rounded to 1 px, landed/broken, livery, form — at 2× screen density, LRU of 10. `lgLander` draws it in the same `gpuOver` segment as the shadow with field `lg.lander`: relief from the mask's alpha gradient at two scales (edge + roundness), light as the ground's `litRGB` — sky fill `ambK·amb` stronger on up-facing, the star `pow(n·l,.72)·df` with a wrap so thin legs/fin keep grazing light, ground bounce from below, a rim on edges facing the star, a cold night floor; the star's tint is half-desaturated for the hull (white balance — a white hull under an orange dwarf went salmon). The braking flame lights the belly (dimmed by day); the main nozzles glow while hot, the beacon breathes (smooth ramp) instead of clicking, the open hatch keeps its own light at midnight, and its light pool on the ground moved into `lg.under` (V5). Tests: `tests/91q1-landing-gpu.js` (Node): the bake has no live bits and no `lighter`, the live pass has no body, the layers return false without a device, four frames with thrust leave `stateHash` alone. |

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
- Variants are shot by `shoot.sh <tag> <root> <port> <scene…>` in the scratchpad (lowday, lownight,
  landed, dusk: `--js` sets the hour through the scene's own formula, clear weather, thrust on).

## New render pipelines (for the warm-up table 08b0/08b1)

- `fld.lg.ridge` → `LG_RIDGE_WGSL` (19g), blend `over`.
- `fld.lg.under` → `LG_UNDER_WGSL` (19g), blend `mul`.
- `fld.lg.lander` → `LG_LANDER_WGSL` (19g), blend `over`, sampler `gpuMipSmp()`.

## Requests outside the zone

- none yet.

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
