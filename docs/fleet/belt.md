# Ship «belt» — notes

Branch `claude/gpu-belt`, from the fleet base `claude/optimistic-gates-u46osn` (e4c3a56).
Zone: `24-mode-belt`, `24b-belt-poi`, `24ba-belt-gpu`, `24bb-belt-poi-gpu`, `24bc-belt-hud`, `24d-range`,
`25-cockpit`, `25f-globus`, new files next to them, their tests. Goal: PLAN G8 (the asteroids in real 3D,
the backdrop in one pass), then the cockpit part of G12.

## Commits

1. **G8: the asteroids in real 3D** — new `24be-belt-rock-gpu.js`; `24ba` rewritten around it; the 2D
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

2. **G12 cockpit: the frame is a GPU bake, lit by the star through the glass** — new
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

3. **The maw is a rock; the 2D landmark painter goes; veins calmer** — `24be`, `24ba`, `24bb`, `24b`,
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

## Requests for files outside the zone

- **`08b0-gpu-pipe.js` (warm-up recipes):** the belt pipelines are built by `gpuPipeline` with their own
  descriptors. Recipes for `GPU_PIPE_ONE`: `"belt.rock": ()=>brockDesc(BROCK_WGSL,true,1)`,
  `"belt.rockf": ()=>brockDesc(BROCK_WGSL,false,1)`, `"belt.dust"` — `brockDesc(BDUST_WGSL,false,1)`
  with `primitive:{topology:"triangle-list"}` (no cull), and the ×4 variants `belt.rock4`, `belt.rockf4`,
  `belt.dust4` (last argument 4). Simplest is one line calling `brockPipeDesc(key)` if you prefer — tell me
  and I add that helper in `24be`. The field `fld.belt.rocklay` → `GPU_FLD` entry `()=>BROCK_LAY_WGSL`.
- **`08b-gpu.js`:** the MSAA path closes the open scene pass itself
  (`GPU.scenePass.end(); GPU.scenePass=null; GPU.scene3D=false`, as `gpuWorld` does) to begin its own
  pass. A kit call `gpuPassOwn()` (close the scene pass, return the encoder) would make that official.
- `mutants.json` (tests): nothing changed; `belt-gpu-off`, `belt-poi-2d`, `belt-hud-2d`, `belt-empty`
  still find their lines.

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
