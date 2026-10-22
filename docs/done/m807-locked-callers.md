# M807 / M807b — what is left of the old 2D ground only because its callers are locked

Written 2026-10-22 (mine-a) for the author's decision on the locks (19* / 20* / 21b* / 21c* / 22* / 23*).
M807 and M807b removed every piece of the old 2D ground that lived in unlocked files and had no
live caller. What is listed here could not go: either the code itself sits in a locked file, or an
unlocked helper is kept because a locked file still calls it. Unlocking is what frees it.

**Rule behind it:** «без видеокарты поверхности нет» — with no GPU device there is no surface.
The engine (21p*) draws ground, light, weather, landmarks, deco and the ship. The old 2D path runs
only when the engine cannot: `21pza` keeps the old `drawLanding` body as `PLN_OLD_LANDING` and calls
it when `!ok` (`?pln=0`, `PLN.bad≥3`, no device). The home and base stickers (`21pj plnOverOld`)
run only when `!OWN.on` (`?own=0`).

**How it was measured.**
- Counters on every top-level function of 26 files: 19*, 20-life, 20a/20aa/20ab, 20e, 20f/20fa,
  21b/21ba/21bb/21bc, 21c, 21f/21fa, 18d-verlet.
- Scene: terran surface at pad+160, engine on, 1600×900 and 390×844, day (.32) and night (.8),
  180 rAF frames each.
- Static callers were read with comments stripped. The probe name list `28z G11_GPU_KILL` and
  `28-loop prof` do not count as callers.
- A function is listed as *waiting* only when both hold:
  - it got 0 calls on all four frames;
  - every static caller is itself waiting, or is one of the old-path entries (`PLN_OLD_LANDING`,
    `plnOverOld`, the thrown hook `drawDigFauna`).
- Anything with one live or unknown caller was kept out. The sizes below are a floor.
- Sizes are raw bytes with comments. A unit is one top-level `function`/`const`/`let` up to the
  next one.

## 1. Old landing path — `drawLanding` behind `PLN_OLD_LANDING` (no device) — ≈155 KB in locked files

| file | KB | waiting | entry |
|---|---|---|---|
| `19-mode-landing-ground.js` | 25.8 | `drawGround`, `drawRocks`, `drawGroundGrass`, `groundChunkPaint`, `groundChunkStore`, `drawGroundCrumbs` (the whole file) | `drawLanding` |
| `19-mode-landing.js` | 12.7 | the old `drawLanding` body, `drawDustMotes`, `lgGlowTex`, `lgGpu`, `drawSkyLayer` | `PLN_OLD_LANDING` (21pza) |
| `19c-light.js` | 11.3 | `gradePass`, `gradeGpu`, `lightShafts`, `hazeFar`, `litRGB`, `drawSkyBase` | `drawLanding`, `drawGround`, `lgRidges` |
| `19d-weather.js` | 9.6 | `drawWeather`, `weatherGpu` | `drawLanding` |
| `19g-landing-gpu.js` | 12.1 | `lgUnder`, `lgRidges`, `lgRGB`, `lgLander`, `lgLanderBake` | `drawLanding` |
| `19f-lander.js` | 20.6 | `drawLander`, `drawLandGear`, `groundShadow` | `lgLanderBake` ← `lgLander` ← `drawLanding` (read by hand) |
| `19c1-cast.js` | 0.4 | `castMapFor` | `drawGround`, `drawRocks` |
| `20a-poi.js` | 6.8 | `drawPOI`, `poiShape`, `poiSkin`, `poiDrift`, `poiTone`, `poiPoly`, `poiBody` | `drawLanding` |
| `20aa-poi-shapes.js` | 27.9 | all twelve landmark painters (`drawObelisk`, `drawFactory`, `drawDeadBattery`, …) | `poiShape` |
| `20ab-poi-gpu.js` | 9.0 | `poiGpu`, `poiBake`, `poiLight`, `poiL*`, `groundClip`, `poiShadowRect`, `bakeAt`, `bakeStand`, … | `drawPOI`, `builtGpu`, `decoGpu` |
| `21b-surface-deco.js` | 3.0 | `drawDeco` | `drawLanding` |
| `21ba-deco-shapes.js` | 12.5 | `decoSlab`, `decoTruss`, `decoColumn`, `decoWall`, `decoFrond`, `decoDruse`, `decoShard` | `decoPaint` |
| `21bc-deco-gpu.js` | 3.6 | `decoGpu`, `decoBake`, `decoPaint`, `bakeTrim`, `decoSway` | `drawDeco`, `homeOutGpu` |

Kept in **unlocked** files only for these callers. M807/M807b made them stubs or left them as small
helpers:

| name | file | now | called by (locked) |
|---|---|---|---|
| `fillMaterial` | 18a-material | empty stub (M807) | 19-mode-landing-ground, 20a-poi, 21b-surface-deco |
| `planetMatHue` | 18a-material | helper, 0.6 KB | `drawGround`, `drawRocks` |
| `glazeGround` | 18a1-glaze | empty stub (M807) | `groundChunkPaint` |
| `greyOf`, `greyA`, `greyStretch`, `glazeIsForm`, `glazeIsHue`, `GLAZE_PASS` | 18a1-glaze | helpers, 1.8 KB | `drawGround`, `drawRocks`, `groundChunkPaint` |
| `drawStrata` | 18b-geology | empty stub (M807) | `drawGround` |
| `chunkStore`, `chunkAt`, `drawChunks`, `screenLayer` (+`noLayer`) | 18c-chunks | stubs (M807b): an empty store / a 1×1 canvas | `drawGround`, `groundChunkStore`, `gradePass`, `drawWeather` |
| `CHUNK_W` | 18c-chunks | constant | 19-mode-landing-ground, 19c1-cast |

Unlocking 19-mode-landing-ground, 19c-light, 19d-weather and 20a-poi frees every stub and helper
above. 18a1-glaze then shrinks to `lum3`, which the live sky 19ca uses. `fillMaterial` and
`drawStrata` disappear.

## 2. Home and base stickers — `plnOverOld` (21pj) under `?own=0` — ≈35 KB

| file | KB | waiting | entry | locked? |
|---|---|---|---|---|
| `21c-built.js` | 10.1 | `drawBuilt`, `drawBaseBuilding`, `builtGpu`, `builtHere`, `builtMast` | `plnOverOld` | yes (21c*) |
| `21f-home-out.js` | 17.5 | `drawHomeOut`, `homeSigns`, `homeWash`, `homeDock`, `homeOutPal`, `homePlan`, `homeSmoke` | `plnOverOld`, `homeOutGpu` | no |
| `21fa-home-out-gpu.js` | 2.7 | `homeOutGpu` | `drawHomeOut` | no |
| `18d-verlet.js` | 5.2 | `vRope`, `vCloth`, `vStep`, `vLink`, `vDrawRope`, `vDrawCloth`, `vRopeAt` (the whole file) | `homeDock`, `homeWash` | no |

This group is not blocked by the author's locks. It goes once the planet replaces the stickers
(planet item 3) and `?own=0` stops drawing them. Only `21c-built` needs the 21c* lock lifted.

## 3. No live caller at all — dead in locked files today — ≈9 KB plus the beast chain

| name | file | KB | why |
|---|---|---|---|
| `drawForeground`, `fgEach`, `fgBoulder`, `fgBlades` | 21b-surface-deco | 7.9 | only the `28z` probe name list mentions `drawForeground`; 21e3 has only a comment about `fgEach` |
| `drawDigFauna` | 23-mode-dig | 0.4 | the 23c0 hook replaces it with a `throw` (the engine draws the fauna, 23ce) |
| `lifeBeastGpu` | 20fa-life-gpu | 5.5 | no caller anywhere |
| `drawBeast`, `drawBeastAlien` | 20f-fauna | 12.3 | called only by `lifeBeastGpu` and `drawDigFauna`; the `28z` name list does not count |

## 4. Not waiting — 0 calls on the surface, but held by a live or unclear caller

Not counted above. Each needs a look by hand before anyone deletes it.

- `prism` (21b, 2.9 KB): live through ships (`17c2a h3dKit/h3dMesh/h3dPirMesh`) and planet marks
  (`21piec plnMarkMove`). It must move out of 21b before 21b can go. `poiGlow` (20a, 1.0 KB) is
  called by `prism`.
- `drawAstronaut`, `astroBeam` (20-life, 11.6 KB): `20fa lifeAstroGpu` uses them, and the live
  raid `24aa drawRaid` calls that.
- Plants: `drawPlant`, `plantPaint`, `drawPlantAlien`, `plantLitter` (20-life / 20e, ≈22 KB).
  They are reached through `20fa lifeSprite` → `lifePlantGpu`, and `lifeSprite` is named in
  unlocked `21e3`. Probably waiting, not proven.
- Deco biome painters (21bb, ≈20 KB: `decoTwinCanopy`, `decoCrownRound` and the 16 shapes under
  them): reached through a table inside 21bb, most likely only from `drawDeco`. Probably waiting,
  not proven.
- `lifeHere` (20fa): live. 22d, 23c, 24aa and 21e3 use it.
- `drawScoop` (19a): a separate mode (scoop), not the old ground.

## Totals

| group | KB | frees on |
|---|---|---|
| 1. Old landing path, in locked files | ≈155 | unlocking 19* / 20a* / 21b* |
| 1. Unlocked stubs and helpers kept for it | ≈3 after M807b | the same |
| 2. `?own=0` stickers | ≈35 (10 locked) | planet item 3, plus the 21c* lock |
| 3. No caller at all | ≈26 | unlocking 21b* / 20f* / 23* |
| 4. Probably waiting, not proven | ≈42 | a hand check first |

Tools (scratchpad, not in git): `m807L.py` (counters), `waitset.py` (closure), `callers.py`.
