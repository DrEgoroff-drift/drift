# Ship «life» — the shared painters of people, beasts and plants (G6)

Branch `claude/gpu-life`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `src/20-life.js`, `20c-peep.js`, `20d-jetpack.js`, `20e-species.js`, `20f-fauna.js`, the new
`src/20fa-life-gpu.js`, and `tests/91x-life-gpu.js`.

## What this ship does

The 2D painters stay exactly where they were, with their signatures: `drawAstronaut(o)`,
`drawBeast(b,x,y,hostile,stun)`, `drawPlant(pl,x,y,haze)`. Every mode that still draws in 2D keeps
calling them. Next to them live **GPU twins** in `20fa-life-gpu.js` that a ported mode calls with
its pass. A twin bakes the figure once per pose through `gpuBake` (the same 2D painter, run on a
`GcCtx`), and every frame lays it with the world's light by a small shader of its own:

- **lit from the world's light source** — normals from the blurred alpha of the bake; the lit side
  takes the key's hue (the star, `starRGB`), the side away from it the sky's (`ambRGB`), a rim burns
  on the edge facing the star. The old astronaut «rim» (M172) was a drawn line on a fixed side; here
  it follows the star by itself. Underground the key is the lamp, in the base the ceiling;
- **a contact shadow** — the bake's own silhouette laid on the ground away from the star, blurred
  more the further from the feet, plus a dense spot right under them (the old one was the same
  oval under everything);
- **motion that breathes** — a standing walker breathes (chest and helmet rise a little), grass
  bends from the root (the top moves with the square of the height) instead of rotating like a
  stick, a jellyfish dome pulses by scaling the sprite; beasts' legs, tails, tentacles and stings
  are live capsules, not baked frames, so they move exactly as in 2D and take light and shade.

## The twin API (for mode ships)

All coordinates are CSS pixels of the screen, like the kit's. Every twin returns `false` when it
drew nothing (no device, no pass) — the mode then calls the 2D painter. Pass the pass you are
drawing in: `gpuScene()` for a mode that is already fully on the GPU, or `gpuOver()` while a mode
is half-ported (see «Half-ported modes» below).

| call | what |
|---|---|
| `lifeAstroGpu(pass,x,y,o)` | the walker. `(x,y)` — the point the 2D call `translate`d to; `o` — the same fields as `drawAstronaut` (`face,amp,phase,walk,air,jet,mining,suitLow,lamp`) plus `s` (scale, as `ctx.scale` in base/raid), `light` (see `lifeLight`), `shadow:false` (in water, in the air without ground). `o.sun` is ignored: the light says where the star is. Draws its own contact shadow — drop the mode's `groundShadow` under the walker. |
| `lifeBeastGpu(pass,b,x,y,hostile,stun,o)` | a beast, same arguments as `drawBeast`; `o.s`, `o.light`, `o.shadow:false`, `o.noLabel` (the «ОГЛУШЁН» label is drawn by the twin on the 2D layer unless this is set). Draws its own shadow — drop the mode's `groundShadow` under beasts. |
| `lifePlantGpu(pass,pl,x,y,haze,o)` | a plant, same as `drawPlant`; `(x,y)` is the root on screen. `o.s` scale (depth of the thicket × world scale), `o.a` alpha, `o.sway` the mode's sway in radians (what the surface passed to `ctx.rotate`) — it becomes a bend, not a rotation. Cast shadow of the ridge (`castLive`), eclipse crouch, air haze — all inside. Draws its own shadow — drop `groundShadow` under plants. |
| `lifeLight(o)` | the light: `{lx,ly}` towards the source (screen axes, y down), `key`/`amb` colours 0..1, `k` strength, `rim`, `lit` share of direct light, `shx/sq/sa` shadow skew/squash/density. Without arguments — by `G.mode`: surface (star + sky), cave/dig (lamp), anything else (ceiling). Any field can be overridden: `lifeLight({lx:-.4,ly:-.9})`. Build it once per frame and pass it as `o.light` to many twins. |
| `lifeSprite(pass,B,S,L)` | the underlying lit sprite, for any other baked figure: `B` from `gpuBake`/`lifeBaked`, `S` = `{x,y,w,h}` centre and size (w<0 mirrors), `rot,a,lod,base,bend,breath,waist,haze,lit,shadow,ao,part}` (see the comment in the file). |
| `lifeBaked(key,w,h,draw,o)` | the twins' keyed LRU of bakes (cap 160), re-baked after a device loss. |
| `lifeHere(x,y)` | the screen point and scale of `(x,y)` under the current 2D transform — for a half-ported mode that still moves `ctx` (translate, `withScale`) but hands the figure to a twin. |

Example — the surface walker in a mode that still moves `ctx`:

```js
ctx.save();ctx.translate(x,y-1);
const h=lifeHere(),o={face:S.face,amp:S.walkAmp,phase:S.walkPhase,air:!S.on,jet:!!S.jetOn,
  mining:!!S.mining,suitLow:S.suit<25,s:h.s,shadow:!swimW};
if(!lifeAstroGpu(gpuOver(),h.x,h.y,o))drawAstronaut(o);
ctx.restore();
```

### Half-ported modes

A mode drawn in 2D can use a twin only through `gpuOver()` (a twin in `gpuScene()` would land
under the whole 2D frame). Each `gpuOver` is one upload of `#c` and one full-screen composite, so
group the figures: one `gpuOver()` before the plants loop serves the plants and the beasts after
it. Note what `gpuOver` changes by itself: the 2D drawn before the cut is composited into the
scene with the emission split, so additive 2D glows under the cut start to bloom. The pairs below
therefore have a **control** frame (the same cuts, 2D painters) to isolate what the twins changed.

## Commits

| commit | what |
|---|---|
| 1 | `20fa-life-gpu.js`: the lit-sprite pipeline `life.spr` (normal from blurred alpha, key/fill hue, rim, projected contact shadow, bend and breath warps) and three twins — walker, beast, plant. `20-life`: `drawAstronaut` `o.bake` (no antenna light — the twin lights it), `PLANT_BAKE` (the plant stands straight in a bake: no gust, eclipse, ridge shadow), `plantUx()` (the star's side, shared). `20f-fauna`: `drawBeast`/`drawBeastAlien` take an optional bake descriptor `k` (static body only). Tests: `91x-life-gpu` — pose keys, light, bake boxes, all 2D painters still draw with and without the bake flags, twins silent without a pass. |
| 2 | Tuning from the pairs: the fill takes the sky's raw colour (hue only in the light term; the normalised one hazed plants toward white); the key and fill give hue, not paint (an orange star turned the white suit salmon); the rim only on bodies (thin stems were all «edge»); mip sampled a step sharper, like the kit's `GPU_MIP_LOD` (thin stems and outlines faded); a colour multiplier `dim` per instance — plants, beasts and the walker darken in the ridge's cast shadow (2D did it for plants only); figures drawn with the `hull` blend so they mark the scene's figure mask; the core request (shafts and bloom over scene figures). `lifeBake2D`/`LG_2D` — a 2D-canvas bake path through `gpuMipTex`, off by default (kept for comparing bakes). |

## Pairs (scratchpad, never in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/e923652c-add4-55c1-b712-4a53dd7ccf16/scratchpad/`.
`before-*` — the fleet base; `ctl-*` — the base plus the same `gpuOver` cuts (2D painters);
`after*-*` — the twins routed in by a scratch build (`scratch.py`, never committed).

| pair | what got better |
|---|---|
| `before-surface.png` \| `after7-surface.png` (control `ctl-surface.png`; crops `pair7.png`, `cmp8.png`; the core fix applied in the scratch build, `after6-surface.png` is the same without it) | plants have bodies: the umbrella at left a shaded underside and its own shadow on the ground, the bushes on the right read in volume instead of flat cut-outs; the walker keeps the white suit with a lit side toward the star and a shadow of his own; plants in the ridge's cast shadow darken as before. Balloons are a touch glossier than 2D (GcCtx's radial highlight); without the core fix the whole of the twins' layer washes toward white (see requests). |
| `before-cave.png` \| `after1-cave.png` (control `ctl-cave.png`) | lamp beam and chest glow now additive on the GPU (bloom picks them up); the figure itself is ~12 px at 760 — no visible difference at this size. |

## Requests for files outside the zone

- **Core (`08b-gpu.js`, `fsFinal`) — the one that matters for every ported mode.** The last pass
  treats everything in the GPU scene as backdrop: the sun shafts accumulate `1 - front.a` along the
  path to the star, and bloom is damped only under the 2D front layer (`*(1.-.6*f.a)`). A figure
  (or a ground chunk) drawn into `gpuScene()`/`gpuOver()` therefore gets the shafts screened over
  it and 2.5× the bloom — on the surface pair the walker and the plants came out washed toward
  white whatever the twin's own light did (measured: a balloon pixel 115,196,137 in 2D →
  221,230,226 in the scene, and the same with the twin's lighting switched off). The twins draw
  with the kit's `hull` blend, so they already clear the scene alpha on their coverage (the mask
  `hullM` reads to keep hulls out of the heat haze). Proposed fix, two lines, tried in the scratch
  build (`scratch.py … core`): in the shafts loop
  `let sm=select(0.,1.-textureSampleLevel(tScene,sl,q,0.).a,u.scene>.5);acc+=(1.-max(front.a,sm))*wq;`
  and in the bloom add `*(1.-.6*max(f.a,sm))` with the same `sm` at `v.uv`. Sky and nebula keep
  scene alpha 1 (the clear value), so nothing else changes.

- Surface ship (`21e1-surface-world.js`): call the twins — walker (`lifeAstroGpu`, drop
  `groundShadow` under him), plants and beasts (`lifePlantGpu`/`lifeBeastGpu` in the loops, drop
  their `groundShadow` calls, pass the rotation as `o.sway`).
- Cave (`22-mode-cave.js`), dig (`23a-dig-draw.js`, `23-mode-dig.js` bugs), base (`21ac-base-draw.js`,
  `21ac2-base-farm.js`), raid (`24aa-raid-draw.js`): the same, with `lifeLight()` of their mode.

## Render pipelines for the warm-up table (`08b1`)

- `pipe:life.spr|over` — the lit sprite and its shadow (`LG_WGSL`).
- The twins also use the kit's `kit.shp|over`, `kit.shp|add` (limbs, glows, jet, antenna light) and
  `kit.img|add` (the lamp beam), and the bake pipelines of `08ca`.

## Open problems

- Bakes happen in the frame that first needs a pose (24 walk frames per stride, 16 wing frames
  per manta). Cheap on a real GPU; on SwiftShader the first seconds of a mode are slow.
