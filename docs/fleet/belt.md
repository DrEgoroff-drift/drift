# Ship «belt» — notes

Branch `claude/gpu-belt`, from the fleet base `claude/optimistic-gates-u46osn` (e4c3a56).
Zone: `24-mode-belt`, `24b-belt-poi`, `24ba-belt-gpu`, `24bb-belt-poi-gpu`, `24bc-belt-hud`, `24d-range`,
`25-cockpit`, `25f-globus`, new files next to them, their tests. Goal: PLAN G8 (the asteroids in real 3D,
the backdrop in one pass), then the cockpit part of G12.

## Commits

1. `c48ae85` **G8: the asteroids in real 3D** — new `24be-belt-rock-gpu.js`; `24ba` rewritten around it; the 2D
   `drawBelt` body deleted from `24` (−290 lines; `24` is 22 KB now); test `91zzzzzzy1a-belt3d`.
   - Rocks and debris are the `makeRock` meshes (162 vertices) drawn with depth. The vertices live on
     the GPU in one pool per belt (a slot per mesh; debris take their parent's slot), the SPHERE2 index
     list is shared, and every rock of a depth group is **one instanced draw** (960 vertices × n). No
     LOD any more: the far rocks were 12-vertex icosahedra, now every rock keeps its real outline.
   - Light per pixel from the real star at the origin: Lambert with a Lommel–Seeliger share (regolith —
     the lit side holds its brightness to the terminator), the shade side in the cold nebula ambient,
     crevices darker than bulges (AO from the mesh: a vertex below its neighbours), a cold rim only
     where the star lights. The face normal is mixed into the smooth normal (0.64), so the rock stays
     chipped, not plasticine. Grain and chips: value-noise fbm in rock space, octaves fade under the
     pixel (no shimmer far away), bump by screen derivatives (Mikkelsen). Ore: the mesh ore (`vore`,
     new field on the mesh, per vertex — visual only) + noise makes a rich zone tinted by the ore, and
     inside it thin veins (zero crossings of noise, width from `fwidth`) that glint in the star.
     Fog darkens colour as before (2800 m instead of 2600), never alpha. The lock tint is kept.
   - Silhouettes: 4× MSAA into the belt's own layer, composited into the scene by one field
     (`belt.rocklay`), when DPR < 1.5 and the frame is ≤ 2.1 Mpx (desktop, the 760 pairs; set in
     commit 2 — commit 1 had only the 2.4 Mpx cap, which let a 390×844 ×2.625 phone into MSAA).
     Otherwise (phones, retina) the rocks go straight into `gpuScene3D` — the step is under a dot
     there, and 4 samples of rgba16f would cost tens of MB.
   - Landmarks (24bb) stay kit shapes; a landmark cuts the sorted rock list into depth groups, each
     group its own 3D pass (depth cleared) — so a rock in front of a landmark covers it and one behind
     it is covered, as in the 2D painter order. Usually one group.
   - Dust near the glass moved into the same 3D pass, after the rocks: it reads depth, so a mote behind
     a rock is hidden (in 2D all dust lay *under* every rock). It is lit by the star: forward
     scattering (Henyey–Greenstein, g .4) — looking towards the star the motes glow in its colour,
     with the light behind you they are faint and cold.
   - The backdrop is one field: the sky field (`belt.sky`) now also draws the stars — a cube of
     equal-angle cells (atan warp), at most one star per cell, never across its border, two layers
     (N 96 dim and dense, N 34 bright and rare), magnitude `h^5`, colour from blue-white to warm, no
     twinkle. The 340 identical `BG` rects (alpha .5, 1.3 px) are gone from the belt.
   - Gone: face adjacency (`beltGpuAdj`), `BELT_STROKES` and the 2D grit strokes, the LOD choice.
   - Test `91zzzzzzy1a-belt3d` (Node tier): mesh normals outward and unit, AO within bounds and not
     empty, ore per vertex carried; dust towards the star brighter and in its colour, behind the
     camera not drawn.

2. `ee8db0c` **G12 cockpit: the frame is a GPU bake, lit by the star through the glass** — new
   `25-cockpit-gpu.js`; `25-cockpit` (`cockpitTex` → plan only, `cockpitBake`, `cockpitPaint`),
   `24bc` (`bhudDraw` clip), `24ba` (one call); the belt's rocks: a limb glow when the star is behind
   a rock, cold ambient .14 → .2; MSAA only at DPR < 1.5.
   - The cockpit frame was a 2D canvas at native DPR, `drawImage`d whole onto `#hud` on every HUD
     redraw (every frame in flight with a target). Now it is a `gpuBake` of the same painter
     (`cockpitPaint`, GcCtx: evenodd, clips, gradients, text) — no 2D canvas, no upload — drawn in
     the scene by one field (`belt.ckpt`) together with the glass. `#hud` carries only the
     instruments and the glass symbology; its redraws no longer copy a full-screen canvas.
   - The field, back to front: the glass (tint, the roll/pitch sheen, the dash reflection — as in 2D —
     plus the star: a veil around it on the glass, its ghost at the mirror point, glass scratches
     flaring near it); the frame, whose edges open towards the star through the window catch its
     light (exposure = glass found stepping 1.5…12 px from the pixel towards the star; linear alpha,
     so a slanted strut is a smooth lit line with a shaded side, not a staircase); light only when the
     star is ahead (`clamp(sf·1.3+.25)`); on top the cabin vignette, which was baked into the frame
     and dimmed the world in the glass corners — now the same formula in the field.
   - The glass symbology (pitch ladder, target frame, heading tape) is clipped on `#hud` to the glass
     minus struts and beam (evenodd): the frame is under the layer now, and without the clip the
     symbols would cross the struts. Before, the opaque frame covered them — same picture.
   - Test (Node, in `91zzzzzzy1a`): plan without a 2D canvas, no bake without a device, the
     symbology drawn after the evenodd clip, no `drawImage` of the frame on the HUD layer.

3. `902780f` **The maw is a rock; the 2D landmark painter goes; veins calmer** — `24be`, `24ba`, `24bb`, `24b`,
   the gate `91zzzzzzy1`, `mutants.json`.
   - The «УСТЬЕ» landmark (a giant asteroid with a black mouth) was a flat grey 11-gon with a baked
     ellipse hole among real 3D rocks. Now it is a rock of the same pipeline: a `makeRock` mesh of the
     landmark's size (its own seed; `beltMaw` keeps mesh and mouth axis on the landmark object — the belt
     is not saved), the crater pressed into the mesh in the vertex shader around the mouth axis
     (instance +1 vec4: axis and edge cosine; plain rocks carry 2 = none), the mouth black per pixel,
     five warm work lights on its rim blinking slowly as in 2D. It tumbles with the landmark's spin, so
     the mouth comes round; it is lit and depth-sorted like any rock. `beltPoiMouthTex` (the one 2D bake
     and upload of the belt) is gone.
   - `drawBeltPOISprite` (24b, 136 lines of 2D) deleted — it was only the fallback and a mutant's tool;
     `24b` is placement only. Mutant `belt-poi-2d` re-aimed: the landmarks drawn in a `gpuOver` layer
     (they float over the rocks behind them, and the frame pays an extra submit) — the gate kills it.
   - Gate `91zzzzzzy1`: landmarks through `beltPoiGpu` ≥ 4 per frame (was 5), and the maw stands as a
     rock (mesh and mouth axis made).
   - Veins: albedo mix .75, glint ×.7 — under a blue star they read as neon lines before.

4. `da85766` **The flat landmarks are lit by the star** — `24bb` (`bpoiLit`, `BPOI_L`), `24ba` (sets the light).
   Wreck, rig, station ring and druse stay kit silhouettes, but each shape is toned by where it sits in
   the silhouette as a point of a sphere under the star: normal (u, √(1−u²)) against the direction to
   the star in camera axes (z towards the viewer). Star behind you — the landmark is lit in the face;
   ahead — only its edge towards the star is lit. Factor .6 + lam (the unlit side keeps the old tone,
   so a landmark still reads as a landmark), plus a tenth of the star's colour on the lit side. Lights,
   windows and the druse crystals glow on their own (flag `e`), untouched. Also checked: the direct
   no-MSAA path at 411×742 ×1.5 (`scratchpad/pair-phone.png`, halved) — rocks lit, struts lit, 0 errors.

5. `1ab0f00` **The strut lamps live in the scene** — `25-cockpit` (`ckptLedOn`, dark lamps in `cockpitPaint`),
   `25-cockpit-gpu` (`cockpitLeds`), `24bc` (−`bhudLed`, `bhudLeds`, `bhudLedDom`, `ledK`), tests.
   - The lit lamps were small native-DPR DOM canvases above `#hud` (`LABDOM` in 08bh), moved and shown
     or hidden by style writes as they blinked; the dark ones were redrawn on `#hud`. Now the dark lamps
     are part of the frame bake, the lit ones are two kit discs after the cockpit field — a core and an
     additive soft halo that the frame's bloom picks up — blinking every frame for free. `LABDOM` is no
     longer used by the belt (08bh keeps it; `08bi` only reads `LABDOM.box`).
   - `ckptLedOn(L,t)` is the one blink formula. Mutant `belt-led-hud` re-aimed at it (lamps that never
     blink); the new Node suite «лампы стоек кабины» kills it (checked by hand: 1 red).

6. `780c54e` merge of the fleet base (da6b1bf) — no conflicts; build clean, Node 17 414 green.
7. **Warm-up recipe helper; the gate run in the cloud** — `24be` `brockPipeDesc(key)` (the six belt keys,
   `gpuPipeline(key, mk)` without a code text, so a `GPU_PIPE_ONE` line per key is enough); notes.
   The two belt gate suites (`91zzzzzzy1`) run in Chrome on SwiftShader after the merge:
   `test.ps1 -NoBuild -Only "ворота ступени 2"` → **green, 19 passed, 2 suites, 222 s** (world calls on
   `#c` 0, one submit a frame, no canvas uploads, the HUD key oracle holds with the lamps and the frame
   moved to the scene). A stand eval after the change: `GPU_PIPES.lazy` holds exactly the belt's new keys
   (`belt.rock4`, `belt.dust4`, the three fields), 0 GPU errors, the frame identical to commit 5's.

## Zone state

- `24-mode-belt` — logic, `makeRock` (+`vore`), `drawGlassHUD` (glass symbology, a 2D brush on `#hud`);
  no 2D world path. `24b` — landmark placement only. `24ba` — the frame of the belt. `24bb` — four kit
  landmarks, lit. `24bc` — the `#hud` key and painter (instruments + symbology). `24be` (new) — rocks,
  debris, the maw, dust in 3D. `25-cockpit` — plan, frame painter (bake), dashboard painter (`#hud`).
  `25-cockpit-gpu` (new) — the frame + glass field, lamps.
- `24d-range` draws nothing (the shooting range is flight + combat): nothing to port.
- `25f-globus` — `globusDraw(c,…)` is a 2D brush called only by the flight rack (`25d`, the author's):
  it paints onto whatever the rack gives it; it moves when the rack moves. Left as is.
- The instruments on the dash and the glass symbology stay Canvas 2D on `#hud` (text, needles —
  interface, native DPR), as agreed in DESIGN-gpu §9.

## For the design pass (real GPU; SwiftShader only proved the scenes draw and nothing got worse)

- **Belt, rocks** (`belt.js` staging): the balance of key and ambient (`sc*1.55`, `n0*.2`) under a warm
  star — every pair here was under a blue star (#8fc4ff), so the warm case is unseen; the fog distance
  (2800 m) against the far rocks; grain scale (`rad*.34`, 2.6 m) and bump (`rad*.075` + .35 m) at 60 fps
  in motion — shimmer on turning; whether the facet mix (.64) reads chipped or low-poly up close
  (`after-near.png`); the lock tint (teal, flattens the target's shading — maybe a rim instead).
- **Veins**: density and glint under a warm star; they read as lines at 760, check at 2560.
- **Silhouettes**: MSAA only at DPR < 1.5 — look at 1920×1080 ×1 (MSAA) and a laptop ×1.25; on a 2×
  screen with no MSAA check the rock edges while turning.
- **Stars**: two layers (96/34 cells, `h^5`); density against the old 340 dots; the brightest at 2560
  (σ ≤ 1.45 px) — maybe a touch of bloom-worthy peaks.
- **Dust**: forward-scatter strength (g .4, ×3.2 cap) looking straight at the star; streak widths.
- **Backlit rocks**: limb glow (`pow(1−ndv,4)·pow(−V·L,6)·.9`) with the star disc in view — I never had
  a rock right on the star in a pair.
- **The maw**: crater depth (.34), mouth edge (.8 cos), five lamps' size (2400) — the mouth is random
  per landmark and tumbles; a landmark that shows its back for a minute may read as a plain big rock.
- **Flat landmarks**: `.6 + lam` shading on kit shapes is per shape (fan slices) — at 2560 the slices
  of the rig's pods may step; the wreck/rig are the next candidates for real bakes lit per pixel.
- **Cockpit**: the window-edge light (`ex²·.55`, 1.5–12 px, CSS px — on a 2.6 DPR phone the lit lip is
  thicker in device px than at 760); the star's veil on the glass (`.07`/`.05`) and the ghost (`.06`,
  radius .03 H) — never seen strongly here; the frame now gets grain and bloom — check the brass/yacht
  cockpits (only the scout's was shot) and the organic «СПЛАВ» outline.
- **Lamps**: halo .42 alpha, r·3.2 soft — against bloom strength on a real GPU.

## Pairs (760×475 ×1, scratchpad of session 75d5c549, never in git)

- `scratchpad/pair-belt.png` (`before-belt.png` | `after-belt.png`), the scene: `system` + `--js
  scratchpad/belt.js` (the first belt system, the nearest non-ice rock ≥ 70 m at 5.5 r, the star to the
  side). **Better:** the rocks have mass — a lit side towards the star and a shade side, a soft terminator,
  grain and glinting veins instead of flat-shaded faces; the far rocks keep their real outline instead of
  icosahedra; antialiased silhouettes; a sky of stars with magnitudes and colours instead of uniform dots.
  Sky pixels byte-identical between the two (the sky gradient/nebula/band unchanged).
- `scratchpad/after-near.png`: the same rock at 2.6 r (no «before» — a look at the grain up close).
- Commit 2: `scratchpad/pair2-belt.png` (`before-belt.png` | `after2-belt.png`, same scene). **Better:** the
  struts and the window's edges catch the star's light on the side facing it and fall into shade on the
  other — the frame has volume and says where the light comes from; the frame and the glass get the frame's
  grain. `scratchpad/c4.png` — the left strut ×3.
- Commit 2: `scratchpad/pair-sun.png` (`before-sun.png` | `after2-sun.png`, `--js scratchpad/beltsun.js`: the
  camera 30° off the star, the star disc at the top, the target rock between). **Better:** the rock between
  us and the star shows its shade side (2D lit it flat blue from the front — its light ignored where the
  star was); the dash lip, the nose and the struts are lit from the window above; far rocks keep form.
- Commit 3: `scratchpad/pair-poi.png` (`before-poi.png` | `after-poi.png`, `--js scratchpad/beltpoi2.js`: all five
  landmarks 1400 m ahead as the gate stages them, the maw's mouth turned towards the camera at an angle).
  **Better:** the maw is a lit, tumbling rock with a pressed-in black mouth and warm lights on its rim,
  depth-sorted with the rocks around it, instead of a flat grey polygon with a sticker hole; veins calmer.
  `scratchpad/c5.png` — the maw ×3.
- Commit 4: `scratchpad/pair4-poi.png` (`before-poi.png` | `after4-poi.png`, same staging). **Better:** the wreck and
  the rig have a lit end and a shaded end from the star's side instead of one flat grey; `scratchpad/c6.png` ×2.
- Commit 5: `scratchpad/pair5-belt.png` (`before-belt.png` | `after5-belt.png`); `scratchpad/c78.png` — both pillars ×3,
  before | after. **Better:** a lit lamp is a small light with a soft glow and bloom, not a flat disc with
  a .22 halo; the pillars' window edges catch the star.
- `scratchpad/pair-phone.png`: 411×742 ×1.5, `belt.js`, before | after (the direct gpuScene3D path).

## Requests for files outside the zone

- **`08b0-gpu-pipe.js` (warm-up recipes):** the belt pipelines go through `gpuPipeline(key, mk)` without a
  code text, so a `GPU_PIPE_ONE` recipe fits: add `"belt.rock"`, `"belt.rockf"`, `"belt.dust"`,
  `"belt.rock4"`, `"belt.rockf4"`, `"belt.dust4"` each as `()=>brockPipeDesc(<that key>)` (24be). The
  two fields go into `GPU_FLD`: `"fld.belt.rocklay":()=>BROCK_LAY_WGSL`, `"fld.belt.ckpt":()=>CKGPU_WGSL`.
- **`08b-gpu.js`:** the MSAA path closes the open scene pass itself
  (`GPU.scenePass.end(); GPU.scenePass=null; GPU.scene3D=false`, as `gpuWorld` does) to begin its own
  pass. A kit call `gpuPassOwn()` (close the scene pass, return the encoder) would make that official.
- `mutants.json` (tests, in the zone): `belt-poi-2d` and `belt-led-hud` re-aimed (commits 3, 5);
  `belt-gpu-off`, `belt-hud-2d`, `belt-empty`, `belt-hud-key-*` still find their lines.

## New render pipelines (for the warm-up table 08b1)

`belt.rock`, `belt.rockf`, `belt.dust` (sample count 1, in `gpuScene3D`), `belt.rock4`, `belt.rockf4`,
`belt.dust4` (sample count 4, the belt's own MSAA layer), `pipe:fld.belt.rocklay|over` (the layer
composite), `pipe:fld.belt.ckpt|over` (the cockpit field, `CKGPU_WGSL`; `GPU_FLD` entry
`"fld.belt.ckpt":()=>CKGPU_WGSL`). `fld.belt.sky` changed its text (stars). The cockpit frame bake uses
the GcCtx pipelines already in the table (`gc:*`).

## Open problems

- The four other landmarks (wreck, rig, station ring, druse) are still flat kit silhouettes; they are
  not lit by the star. The druse could become crystal prisms in the rock pipeline, the wreck a
  `gpuBake` hull lit by `gpuLitSprite` like the fleet.
- `BG` (16-flight) is no longer used by the belt; flight still uses it.
- No shadows between rocks (one rock does not shade another).
