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
     (`belt.rocklay`), when the frame is ≤ 2.4 Mpx (desktop, the 760 pairs). Above that (phones at
     DPR 2.6, 2560×1600) the rocks go straight into `gpuScene3D` — the step is under a dot there,
     and 4 samples of rgba16f would cost tens of MB.
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

## Pairs (760×475 ×1, scratchpad of session 75d5c549, never in git)

- `scratchpad/pair-belt.png` (`before-belt.png` | `after-belt.png`), the scene: `system` + `--js
  scratchpad/belt.js` (the first belt system, the nearest non-ice rock ≥ 70 m at 5.5 r, the star to the
  side). **Better:** the rocks have mass — a lit side towards the star and a shade side, a soft terminator,
  grain and glinting veins instead of flat-shaded faces; the far rocks keep their real outline instead of
  icosahedra; antialiased silhouettes; a sky of stars with magnitudes and colours instead of uniform dots.
  Sky pixels byte-identical between the two (the sky gradient/nebula/band unchanged).
- `scratchpad/after-near.png`: the same rock at 2.6 r (no «before» — a look at the grain up close).

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
composite). `fld.belt.sky` changed its text (stars).

## Open problems

- The 2D landmark painter `drawBeltPOISprite` (24b) is now dead code except as the `belt-poi-2d`
  mutant's replacement; delete it with that mutant re-aimed.
- `BG` (16-flight) is no longer used by the belt; flight still uses it.
- No shadows between rocks (one rock does not shade another).
