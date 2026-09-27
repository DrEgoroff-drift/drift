# The planet in the engine — the brief of stage 1

How the look of [`DESIGN-planet.md`](DESIGN-planet.md) stands inside the game (M610–M614).
The look itself is decided on the stand (`docs/look/`); this file says where its passes go
in the game's frame, what is taken from the engine and what is not, and what each step
builds. Laws of the picture stay in the plan (§11) and in the style sheet.

## 1. What the engine gives

Read in `src/08b-gpu.js`, `08b0`, `08b2`, `08c`, `28-loop.js`, `docs/DESIGN-gpu.md` §2–§5.

```
gpuFrame()      canvas #c cleared, the encoder GPU.enc opened
  gpuScene()    a pass into GPU.V.scene (rgba16float): what lies UNDER all 2D
  …2D on ctx…
  gpuOver()     uploads #c, opens a pass ABOVE the 2D drawn so far
gpuWorld(k,grain,vig)   bloom ladder if k>0
gpuPresent()    the final pass: frame + bloom, the shoulder, grain, vignette, dither
```

- The scene target is **display-referred**: 2D paints in the tones of the screen, and the
  scene keeps the same tones, open above 1. The final pass lays a shoulder over it:
  `tone(c) = min(c,.75) + .25·(1 − exp(−(c − .75)/.25))`.
- The engine's bloom is additive over the squared display frame. On a day frame it lifts a
  sky of .80 to about .89: it is a look of its own.
- There is no lit mesh, no shadow map and no user of depth in `src/`. `08cc-gpu-shadow` is
  the canvas's `shadowBlur`, `08cd-gpu-mat` bakes the hull's material; the belt projects
  its meshes on the CPU.
- Pipelines go through one funnel, `gpuPipeline(key, recipe, code)`; a key that was not
  warmed is built on the spot and written to `GPU_PIPES.lazy`. A lost device is rebuilt by
  `gpuInit`, which drops every cache: whatever a module keeps must be keyed by `GPU.dev`
  and by the size of the frame (`GPU.bw`, `GPU.bh`).
- The surface keeps one scale (M217): `surfScale()` K = clamp(min(H/560, W/1000), 1, 2.4).
  A broad frame holds 1000 × 562 units, a phone 390 × 844. The man is 23.6 units tall, so
  **13.1 units are a metre**; the strip is 1500 samples × 6 units, 687 m of walk line.
  The game's y grows downwards.

## 2. Decisions

1. **The planet has a renderer of its own**, a port of the stand's: two shadow maps, the
   mirror for water at half size, the scene with depth and MSAA, the wing, light in the
   air at half size, its own bloom and its own grade. All of it is recorded into `GPU.enc`
   before the engine's scene pass is opened.
2. **The finished frame enters the game as the bottom layer**: one triangle inside
   `gpuScene()`, in the tones of the screen. Above .75 it writes the inverse of the
   shoulder, `s = .75 − .25·ln(1 − (d − .75)/.25)`, so the final pass gives the graded
   value back untouched. Alpha of the scene is not written.
3. **From the engine's post the planet takes grain and dither.** The engine's bloom is
   switched off for the new look (`BLOOM_K.surface` is set to 0 while the switch is on and
   put back when it is off; `19c-light.js` is not edited). The plan's §4 said «post — the
   engine's own»: that holds for grain and dither only.
4. **The switch.** New modules only. `drawSurface` is wrapped by assignment from the new
   family; the old painter stays whole and is called when the switch is off, when there
   is no open frame, or when the new look fails. On: `?pln=1` in the address, or
   `PLN.on=true` from a stand. Off by default until the hand-over (M652), so the tests
   and golden frames of the old surface stay green.
5. **The lens is a shifted one.** The eye looks straight along +z; its window on the plane
   z = 0 is exactly the rectangle the 2D game shows. The play plane therefore maps by pure
   scale — a tap, a chip and a label land where they landed before — and the new frame
   sets `G.viewX`, `G.viewY`, `G.viewK` itself. The vertical angle is the stand's far
   lens: 24° for a broad frame, 46° for a tall one, blended by the aspect; the distance
   follows from the height of the window (100 m and 74 m). The horizon stands at .585 and
   .52 of the height, the feet at .28 and .32.
6. **Coordinates.** The planet's world is in metres, x along the walk line, y up, z away
   from the lens: `x = X/13.1`, `y = (Y0 − Y)/13.1`, with `Y0` the level of the pad.
7. **The land** is `H(x, z)`. On the walk line it is the game's profile, sample for sample.
   In front of it the slope takes the *least* of the profile over a window that widens
   with the distance, less a fall: near ground can never stand between the lens and a
   thing on the walk line. Behind the path the lane is raked to a crest and falls into a
   hollow; the far lanes are laid from the planet's seed. The lake of the profile
   (`waterOf`) gives the level of the water.
8. **The land is built in world space, by chunks along x**, so that nothing swims when the
   lens moves: a near band of fine cells, and one strip for every far lane. Thin and
   numerous things are **instanced** — one tuft, one crown, one stone, placed by records
   of 64 bytes — and also kept by chunks.
9. **Antialiasing** is 4× MSAA on the scene pass; the stand's supersampling is a way to
   shoot, not a way to play.
10. **Until stage 2 the cast is a blockout**: the stand's man and ship, and plain bodies
    from the game's own lists — `S.plants`, `S.fauna`, `S.deposits`, `S.cave.x`,
    `mineSpotX(p)`, the water. The interface is the game's, `drawSurfaceHud`, unchanged.
11. **The sun goes where the hour says.** `celSun(p).ph` turns the key along one circle,
    tilted 52° back from the zenith: it rises on the left, stands 38° high behind the
    scene at noon, sets on the right. The key frame M600 is this circle at ph = .125.
    Shadows therefore always fall towards the lens. `celDark()` dims the key and nothing
    else (the eclipse); by night the key is the cold light of M602.

## 3. The family

New modules, glued after the old surface (`21h…` < `21p…` < `22…`). Every name begins
with `pln` or `PLN`: the game is one scope.

| Module | What is inside |
|---|---|
| `21p-pln` | the state `PLN`, the switch, units, small math: vectors, matrices, noise |
| `21pa-pln-mesh` | the mesh and its generators: blob, tube, loft, quad |
| `21pb-pln-wgsl-air` | shaders shared by all: the sky, clouds, the air, the light of clouds |
| `21pc-pln-wgsl-scene` | shaders of bodies, the land, water, shadow |
| `21pd-pln-wgsl-post` | blur, bloom, light in the air, the grade, the hand-over triangle |
| `21pe-pln-gpu` | targets, pipelines, groups, the passes of one frame |
| `21pf-pln-land` | `H(x, z)`, the colour of the land, chunks of the near band, far strips |
| `21pg-pln-flora` | grass, flowers, trees, stones: the kit's bodies and their records |
| `21ph-pln-cast` | the blockout: the man, the ship, the things of the game's lists |
| `21pz-pln-frame` | the lens, the hour's light, what is built when, the frame, the wrap |

## 4. Steps

- **M610** the renderer and the switch: passes, targets, the hand-over triangle, the lens;
  a first land and the blockout man and ship, to have something lit. Gate: the pair
  «was | now» taken in the game by `docs/shot.py`, 760 and 390.
- **M611** the land proper: chunks, the near slope by the rule of §2.7, the raked lane,
  the hollow and water, far lanes from the seed, the wing.
- **M612** sky and air by the hour: the circle of the sun, dusk and night, clouds from the
  planet's weather, the eclipse.
- **M613** terran, desert and ice on one sheet.
- **M614** the cost: frame time on the PC by `docs/g11.ps1`, the list of what is cut for
  the phone and what each cut buys.

## 5. What is not done here

The landing, the cave, the mine and the base keep their old painters until their own
steps (M621, M630–M632). Weather is M626. The old painters, the fleet's sky
(`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula are read and never edited.
