# The renderer — WebGPU, with Canvas 2D as the brush

The author, 23.09.2026: «переноси все на новые технологии, то что не умеют новые оставлять в канвас»;
«нахуй откат и поддержку старой версии, все по новой»; «графику только улучшать … не надо одинакого, надо
лучше»; «первое — на новый движок, потом по плану». This file is the recipe; the open work is PLAN.md §0.

## 0. The author's decisions (binding)

- **WebGPU only, no fallback**, no switch, no old-version support.
- **Hybrid:** what the GPU does badly (text, complex vector shapes) stays Canvas 2D, live or baked to a texture.
- **Graphics only get better.** The same look is not accepted: a G step is closed by a `main | gpu` pair of the
  same scene plus one line saying what got better. No improvement, not closed.
- **Do not measure** (no benches); the one yardstick is the stage-0 gate in PLAN.md.
- **No new tools:** rewrite the old one or kill it and write one new. Before rewriting a shared tool, grep its
  callers.
- **No heredocs** for scripts: write a `.py` file, run it by path.

## Where I stopped (update on every commit)

- Done: core `08b`, kit `08c`, space `16g` (G1: live nebula wisps and lanes, stars with halo and tapered
  spikes, dust with depth of field; pair in `scratchpad/pairs/system_crop.png`),
  `docs/shot.py` on the GPU (`--budget` kept for `vetshot.py`).
- Solo from 23.09 (the author: «один он эффективнее») — no porting agents. The ten agents were stopped
  before any commit; their worktrees are removed. Kept drafts in the session scratchpad: `agent-G5G6/
  tracked.patch` (19e-clouds rewritten as density bakers, 42 KB, the GPU air module not started) and
  `agent-G11b/src__24cf-gpu-rooms.js` (a shared room kit, 5 KB). G12's tape fix is merged: the paper shows
  before the first two samples (the strip was blank for three seconds — not a GPU bug).
- Order: G2 → G14, one at a time, each closed by a pair and a line of gain.
- G2 done: `17g-gpu-system` — orbits as exact ellipses with a continuous tail, station ring, belt band + dots,
  the star of every kind as one field (photosphere with granulation, glare laid over the disc so the limb
  hands off to the corona; giant stays orange, dwarf white-hot), the bleed. Pairs by kind: scratchpad of
  session 21f451ab, `kpairs.py <scene> <name> "<js>"…` shoots main and gpu with the same `--js`
  (main's own `docs/shot.py` in `mainref`); freeze the scene first (`freeze.js` there: planet, moon and station
  angles pinned, `spd=0`, ship placed) — otherwise the two sides differ. Accepted pair: `g2f.png`, `g2f_crop.png`.
- G2 accepted by Control (24a10e2) for single, giant, binary. G2b (the hole): background lensed through the nebula
  texture of 16g plus hashed stars in the source plane, Keplerian disc with Doppler asymmetry, photon ring, the far
  disc bent over the shadow — pair `g2b.png` / `g2b_crop.png`, awaiting Control. Wide corona term .12 → .15 (weight).
- G3 done: `17ga-gpu-planets` — one quad per body: the strip wound on a true sphere (atan2 longitude), light
  from `planetSunRot` (so `91zzzb-bio` still guards it), soft terminator where there is air, cool night,
  day-side atmosphere beyond the limb instead of the r+2.5 stroke, rings in their plane with ringlets and both
  shadows, moons as lit spheres. 2D `planetDraw/planetPaint/planetLight/planetCols/drawRing` are gone. Pair
  `g3a.png` / `g3a_crop.png` (gas giant `planets[3]`, terran `planets[0]`; ship and zoom in the kpairs js).
- G3 accepted by Control; G3b (surface in three scales, sun glint on water) is in PLAN §0.
- **G4 in progress.** Done: the trail (`16ga-gpu-trail`: one triangle ribbon per nozzle lane with shared node
  normals, per-point age, gaussian core+halo; beads between segments gone). Pair `g4a_crop.png`, js in
  `trail.js` (a synthetic TRAIL, no thrust). The exhaust (same module, `gpuExhaust`: gaussian flame, flowing noise, shock diamonds, tone-mapped nozzle; the
  drawn heat arcs dropped; pair `g4b_crop.png`, thrust forced by wrapping `drawExhaust` in the js). `exhaustHaze` still
  grabs the 2D layer — removed, G4b in PLAN. Done since: the edge wall as a GPU membrane (`drawEdgeWall`,
  17-mode-system; pair `g4c.png`), the trail widening to its tail, and the hull lit from the star (`gpuHullLight`,
  16ga): after the ship's 2D draw, `gpuOver` + an IMMEDIATE `copyTextureToTexture` of a 512² patch of
  `GPU.T.front` (now COPY_SRC) into `GPU.T.hm`. The pass runs only at submit, after gpuWorld re-uploaded #c
  without the hull, so sampling `T.front` directly sees nothing. Mask alpha → edge normal → rim in star colour,
  far half darkened; pair `g4d_crop.png`. Reworked after review («reads as an outline sticker»): the mask is read
  as relief — a narrow-step gradient for the edge, a wide one (3 and 7 px) for the slope of the side; Lambert from a
  star lying almost in the plane (z .22); the rim is cos³ and only where the relief is steep, the side warms
  by its wide normal, and the shadow is a gradient across the whole hull (up to .82) deepened on the far slope;
  pair `g4e_crop.png`. Scene js (`freeze.js`, `trail.js`) also `CHIP_POS.clear()` — stale
  chip smoothing after a teleport looked like overlapping chips. The wake is `gpuWake` (16ga) on the same ribbon
  as the trail (`gtrLane`/`gtrDraw`, vertex = 3 vec4: core alpha, core share, halo alpha, world place, tatter
  weight); its halo tears into world-fixed wisps that drift slowly; the 2D bucketed `drawWake` is gone. Pair
  `g4f_crop.png`, scene `wake.js` (synthetic WAKE, two lanes).
  **Next in G4:** combat (`drawCombat`, 13-pirates:349), drones, traffic, station
  (`drawStation`, 17c), barges; everything after the planet loop in drawSystem except the above is still 2D.
  A GPU draw after `gpuHullLight` must use `gpuOver`, not `gpuScene` (the scene pass is closed by then).
- Merge each: `build.ps1`, `python docs/shot.py <scenes> --look --tag gpu`, 0 `gpu.errs`, pair with
  `scratchpad/mainref/docs/shots/main_<scene>.png`, one line of what got better, commit, strike from PLAN §0.
- Next after G2+G3 merges: G4 (system view on top, shares `17-mode-system.js`), port 9481; then G14.
- Seen on the system pair, not yet owned: the tape strip under the dials is blank on gpu (grey paper on main)
  — G12 (cockpit and tape) checks it.
- Traps: mixed line endings (match HEAD per file, check bytes with Python); `gpuScene()` is null outside a
  frame; a presented canvas is unreadable after its task (snapshot in `gpuPresent`); launchers with
  `--disable-gpu` shoot the «no WebGPU» stub (G13).

## 1. What changed and what did not

- **The world is still math.** Seeds, noise, the galaxy, orbits, economy, `stateHash` — all in JS, unchanged.
  Only the *painting* moved: a shader is a formula per pixel, so the math simply got closer to the screen.
- **WebGPU only.** No 2D fallback, no switch. Without WebGPU the player sees a plain message naming the
  browsers that can play (`gpuNone`, 08b). caniuse (23.09): WebGPU 87 %, WebGL2 96 % — the gap is iOS < 26,
  Firefox on Android/Linux, old Android.
- **Canvas 2D stays as the brush** for what the GPU does not do well: text, and complex vector shapes
  (hulls, props, people, rooms). It paints either live onto `#c` (a transparent layer the GPU composites)
  or once into a canvas that becomes a texture (`gpuImage`) — the hull bake already works that way.
- **Better, not the same.** Every ported layer should look better within the art direction
  (`docs/DECISIONS.md`: one light, rich palette, motion not twinkle, the frame's laws): per-pixel light from the
  real sun direction, soft particles and depth of field on near layers, analytic anti-aliasing, live fields where
  a bake used to freeze them, no banding (the final pass dithers every mode). Parity is the floor, not the goal.

## 2. The frame

```
gpuFrame()        #c cleared (the 2D layer), command encoder opened; false = no device → nothing is drawn
  gpuScene()      layers UNDER everything 2D: backdrops, sky, fields (gpuScene3D: the same with depth)
  …2D on ctx…     text and vector shapes land on #c
  gpuOver()       a layer ABOVE what 2D has drawn so far (each call: upload #c, composite, submit)
  …2D on ctx…     lands above that layer
gpuWorld(k,…)     #c uploaded; bloom at a quarter of the frame (4×4 box, gaussian in rgba16f)
  …UI on ctx…     the rack (25d) draws onto the UI layer — no bloom, no grain
gpuPresent()      one pass: frame + bloom, grain (overlay 7.5 %), vignette, hit chromatics, UI, blue-noise dither
```

`drawWorld()` called outside the loop (tests, stands, `look`) builds its own frame (`gpuManual`) and snapshots
it in the same task; `gpuSnapshot()` returns the composed frame as a 2D canvas (a presented WebGPU canvas
cannot be read after its task ends). `#c` is invisible (`opacity:0`) and still takes the finger; the GPU canvas
`#g` has `pointer-events:none`.

## 3. Layer order — the one rule

A GPU layer is either **under** all 2D of the frame (`gpuScene`) or **above** the 2D drawn so far (`gpuOver`).
So port a mode **from the back**: sky and backdrops first (under), then whatever sits between 2D shapes moves
together with its neighbours (a sprite via `gpuImage`), and full-frame effects on top (night, fog, light, near
particles) go through `gpuOver`. Each `gpuOver` costs one upload and one full-screen composite — two or three
per frame at most; consecutive GPU layers share the pass one call returns.

## 4. The kit (08b core, 08c kit) — coordinates in CSS pixels, colour in, premultiplied out

| call | what |
|---|---|
| `gpuScene()` / `gpuScene3D()` / `gpuOver()` | the pass to draw into; `null` outside a frame — the layer then does nothing |
| `gpuImage(pass, canvas, [{x,y,w,h,a,rot,u0,v0,u1,v1,cubic}], {blend})` | pictures and sprites; `x,y` is the centre; the canvas is uploaded once per canvas object |
| `gpuShapes(pass, [[kind,x0,y0,x1,y1,hw,soft,r,g,b,a]], {blend})` | 0 rect, 1 disc (x0,y0,r=x1), 2 capsule (hw), 3 ring; colour 0–255, a 0–1; `soft` = a soft edge that wide |
| `gpuField(pass, name, wgsl, Float32Array(≤60), [tex…], {blend})` | a full-screen field: `wgsl` defines `fn field(p:vec2f, uv:vec2f)->vec4f` (premultiplied), reads `fu.v[0..14]`, `t0..t3` via `smp` |
| `gpuPipe / gpuBuf / gpuBind / gpuCanvasTex` | your own pipelines (`layout:"auto"`, target `rgba8unorm`); `GPU_WGSL_COMMON` has `pmod`, `covRect`, `covDisc`, `covSeg`, `texCubic` |
| `GPU_BLEND` | `over` (source-over), `add` (lighter), `mul` (multiply on an opaque backdrop) |

The space layer (`16g-gpu-space`) is the worked example: instanced stars with the 2D table and `starMove`,
the dust layers from `dustTable`, the nebula composite as a texture.

## 5. Porting a mode — the checklist

1. Read the mode's draw order (`drawWorld` → the mode's draw). Mark each step: field, particles, shape, text.
2. Port from the back. Delete the 2D code you replaced — there is no fallback to keep. Keep the data and the
   seeded generation in JS; move only the painting.
3. **Improve** (§1) and say how in the commit. Check the logic you port — the old code may carry a bug or a
   wasted pass; fix it rather than copy it.
4. Precision: feed noise camera-relative coordinates (fp32 at large world coords ripples); `highp` for positions.
5. No per-frame allocations in JS: reuse `Float32Array`s, one draw per layer (instances), textures re-uploaded only
   when the source canvas changes (`gpuCanvasTex` keys by object — a bake that redraws in place needs a new canvas
   or an explicit re-upload).
6. New files are `NNg-gpu-<mode>.js` next to the mode; LF line endings (keep a CRLF file CRLF); scripts that edit
   files are `.py` files run by path — never heredocs.
7. Look: `build.ps1`, then `python docs/shot.py <scenes> --look --tag after` (and `--tag before` on the parent
   commit); zero `gpu.errs`, no page errors, no «СБОЙ»; compare the sheets side by side. Phone:
   `--w 390 --h 844 --dpr 2.625`.

## 6. Tests and tools

- Headless Chrome has WebGPU on this laptop by default (file:// is a secure context); tools must not pass
  `--disable-gpu`. GPU-less CI: `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader`.
- The Node tier draws nothing (`GPU.ok` is false there) — it checks logic only. Browser suites that read pixels
  read `gpuSnapshot()`; goldens are re-accepted after each ported mode (`test.ps1 -Accept`).
- One way to take a frame: `docs/shot.py`. `shot.ps1`, `pageshot.ps1` and the stand server go (PLAN §0).

## 7. The old 2D draw order by mode (the porting map, from the scouts of 23.09)

Back to front. F field, P particles, S shape, T text, C cached bake, 3D mesh. Line numbers are of `fbbcd12`.

| mode | layers, back to front | where |
|---|---|---|
| title | fill; nebula 2 parallax layers (baked 192²); stars | 28-loop:552, 16-flight:75 → **16g done** |
| system | nebula, stars, dust → **16g done**; orbits + comet tails S; belt ring P (190 dots); star body S (6 kinds); bleed corona (glowSprite, lighter); planets: rings/disc/lights/works/doom/moons/labels S+T | 17-mode-system:535–684, 17c-system-draw:589–594 |
| system, top | lane, gest post, sys rail, billboard, law ring, hotel, bazaar, giant, rail arrive, edge wall, peace fleet, station S; trail P; exhaust P; exhaust haze; combat P; helm marks; wrecks/finds/relay/barges/rope/traffic/lane ships/Cheburek/wanderer/fleet/drones; allies; pirate base; player hull + guns; sys HUD T | 17-mode-system:685–772, 16a-space:704, 13-pirates:706, 12a-crew:723, 24a-mode-raid:724 |
| landing | sky base F; stars (airless); sky bands F; zenith fade; ground far .26 / mid .4 S; haze band F; weather far P; ground main S; POI; deco; rocks; dust motes P; pad lights (lighter); lander shadow; lander; landing dust P; weather near P; shafts; grade | 19c-light:191–296, 19-mode-landing:171–409, 19-mode-landing-ground:11/294, 19d-weather:104, 20a-poi:173, 21b-surface-deco:166, 19f-lander:52 |
| surface | sky base; stars; sky bands; far tiles A .22 / B .35 C; haze; weather far; ground; sky shadow; water; POI; deco; built; home out; settle; tin can; trace; rocks; peep; glow patches/pad; slow; pass; places; ship shadow + lander + cabin light; motes; lights reveal; cave mouth (5 layers); mine shaft + rope; plants (wind); fauna; peep ghosts; deposits; tracks; walk dust; astronaut; swim ring; mining beam; foreground grass; weather near; night overlay (rim + lamps); shafts; grade | 21e1-surface-world:109–612, 21e-surface-draw:194, 21c-built:64, 20-life:4/406, 20f-fauna:231, 21b-surface-deco:278/406, 11g/11i/11o/11p/11v, 20c-peep:88/206 |
| cave | far wall F; rock tiles C (planetMat); solid deco C; water C; props C; darkness sprite + corners; sun cone (lighter); wall marks; lamp floor glow + dust; crystals/veins/drops/lamp cone P; own light (moss) | 22-mode-cave:652–692, 22a-cave-deco:241–504, 22b-cave-props:233 |
| dig (mine) | rock pass C (geology, veins, multiply depth); vignette multiply; lamp warm glow; ore halos + shine grains (lampK); void path + scoop marks | 23a-dig-draw:54–156 |
| belt | gradient bg; 4 nebula spots; sun disc + halo; ring stripe (7 arcs); star sphere P; far rocks P; dust streaks P; rock meshes 3D (z-sorted lit faces, 12/42/162 verts) + POI | 24-mode-belt:378–543 |
| scoop | giant atmosphere 2 layers C (parallax); depth overlay; 5 wave edges S; crests P; incoming streaks P | 19a-mode-scoop:271–369 |
| raid | fill; cell floors lit; floor gloss; walls; hangar doors + emitters; ceiling lights; floor pools; contents (containers, crane, wreck); enemies (z-sorted limbs) | 24aa-raid-draw:14–500+ |
| wanderer | walls/ceiling/floor F; seams + brass rail; boards; window (planet, cold streaks); depth rings; cases + lamps + item icons C; hanging objects; counter + keeper; pollen P; vignette | 24c-mode-wanderer-draw:124–310+ |
| base | ground/sky/rocks; rock shadows; cracks; excavation; shaft + cage + light cone (live); room glows (lighter); lift; modules; walking people; staff + names | 21ac-base-draw:55–384 |
| home | shell; wall; floor; light cone (lighter); window (hour); furniture C; partitions + door lights; folk (depth sort); owner; foreground cut; lamps + final glow | 29d-home-draw:32–310 |
| winter | room raster C; window (sky, mountain, snow, glass); stove glow; lamp + cone | 29g-winter-draw:339–465 |
| spa | sky + sun halo; sea (waves, sun path, cape); foam; deck; rails; board T; table | 29i-spa-draw:46–241 |
| HQ | wall; ceiling + cables; window to space; 4 tube lamps + cones; props; consoles + lights; crew | 27f-hq-room:37–121+ |
| map | fill; galaxy band C (2 LOD); rhumb rays; galaxy stars P (~1500); arm/nebula names T; rails; address grid; jump rings; player circle; search circle; lanes; rumours (clip hatch); lore, survey, fleet, wander marks; holdings/war; systems loop (mapStarPaint, lighter) + labels; off-screen arrow; ГЛАВТРАССА prices T; routes, barges, drones; jump course; system card T; rulers, rose; footer T | 18-mode-map:122–503, 17z1-galaxy:97/156, 17z-map-backdrop:82/126, 17z2-galaxy-names:38, 18e-rail-net:181, 18a-map-addr:55–506, 18b-map-hold:80/186 |
| rail ride | fill; galaxy + stars; rail net; current line (keel + highlight); bus dash; stops + names; headlight cone; bus / train body; arrival flash (lighter); header T | 18g-rail-ride:120–172 |
| road | sky gradient; 3 breathing nebulae (lighter); 110–190 stars; hyper tunnel (46 spokes); 5 passing pilots; beat sparks; touch pulses; trail points → body (halo + core) → flare; nozzle lumens; brake fires; turn vanes; hyper cocoon; hull; **bloom field (CPU fbm, putImageData 26 Hz)**; bottom mask | 27la-road-sky:12–136, 27l-road-draw:167–383, 27lb-road-bloom:65 |
| cockpit | glass tint + glare (clip); glare sweep; frame C; 5 dials T; tape strip (putImageData); LEDs; bars T | 25-cockpit:415–460, 25a-instr:100, 25b-tape:187 |
| frame | heat haze (18d:12–79, copies strips) ; hit chromatics → **core**; bloom, grain, vignette → **core**; grade (surface/landing, 19c:258) | 18d-postfx, 19c-light |
| postcard | own canvas, 8 painters, seeded, no G | 25g-postcard:170–294, 25g-post-*, 25h-post-forms* (G14) |

`getImageData` is used only for bounds (hull ink box 03e1:113, tile span 18c:152, staple 26e2:170, road 27l:81)
and `lookFrame` (28y:49/326) — none in gameplay.
