# Ship «landing» — notes

Zone: `src/19-mode-landing.js`, `src/19-mode-landing-ground.js`, `src/19f-lander.js`, plus the new
`src/19g-landing-gpu.js` (the landing frame's GPU layers). Goal: PLAN G6 for landing — ground and far
ridges as GPU layers, the lander lit by the world's light, its flame lighting the ground, a shadow that
grows as it comes down. The air (19b–19e) is frozen and called as is.

## The frame after this branch

```
drawSkyBase (gpuSky, scene pass)  →  2D: sky bodies, clouds, zenith fade
gpuOver #1  →  far ridges (field lg.ridge)
2D: haze band, warm source glow, far weather, near ground chunks, POI, deco, rocks, motes, pad
…  (later sub-items add gpuOver #2 here)
2D: lander, dust, near weather; shafts (flag), grade
```

## Commits

| # | Commit | What |
|---|---|---|
| 1 | far ridges | `lgRidges` (19g): both far ridges in one WGSL field over a height texture (`lgHTex`, `tr.h − hMin`, rgba16float N×1, one per approach). Form from the slope and `SUN_DIR` (kept at ≥45 % at night — sky light), rock mottling, gullies down the fall line near the crest, faint strata; the base sinks into the air colour; a thin rim on crests facing a low sun. The 2D `drawGround` calls for the ridges are gone from `drawLanding` (surface still uses `drawGround` for its own far tiles). |

## Pairs (scratchpad, not in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/490811e5-7c40-51c3-b489-f7ee7a447e9c/scratchpad/`

- `pair1-landing.png` — scene `landing` (rain): the far ridges were one flat blue sheet washed by
  the rain; now two masses, the near one a mountain with gullies and mottled rock, its foot sinking
  into the air.
- `pair1-clear.png` — same, `--js "G.land.p.wx={kind:null}"`: the ridges get rock and form instead
  of two flat fills.

## New render pipelines (for the warm-up table 08b0/08b1)

- `fld.lg.ridge` → `LG_RIDGE_WGSL` (19g), blend `over`.

## Requests outside the zone

- none yet.

## Open problems

- The landing frame now has one extra `gpuOver` (upload of `#c` + one composite).
