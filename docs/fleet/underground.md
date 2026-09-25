# Ship «underground» — G7, the cave and the mine

Branch `claude/gpu-cave`, from the fleet base `claude/optimistic-gates-u46osn`. Zone: `22-mode-cave`,
`22a-cave-deco`, `22b-cave-props`, `23-mode-dig`, `23a-dig-draw`, `23aa-dig-rock`, `18a-material`,
`18a1-glaze`, new files next to them, their tests.

## Commits

1. **cave: light only from sources, soft shadows from rock, dust in the beam, ore glows** —
   new `src/22c-cave-gpu.js`. Everything the cave draws up to the props, plants and beasts is the
   albedo; one `gpuOver` pass then (a) multiplies it by light — the helmet lamp as a cone, a bounce
   term around it, and up to nine point sources (the other lamp, moss, crystals, veins, daylight in
   the mouth, the watchmen's torches), each shadowed by marching the rock mask (`C.g` as a
   440×300 mip texture; the mip level grows with distance from the source, so the penumbra
   widens like a real lamp's; rock absorbs over a few pixels, so a wall facing the lamp lights as a
   rim); (b) adds in-scattering of the beam in air with the same shadows, drifting density, and dust
   motes that drift on a world grid and show only where the beam catches them; daylight gets a
   shadowed shaft; (c) HDR emission: crystal cores and veins above 1.0 through `gpuShapes` add,
   so they bloom through the L2 mip ladder. Deleted: the darkness sprite (`drawCaveDark`), the
   2D floor spot, 2D dust, the three-triangle cone, the crystal halo, the 2D vein strokes, the moss
   halo, the baked other-lamp mask (`caveLampMask`) and the cold glazes baked into rock tiles
   (M304) — the field lights the rock for real now. Plants and beasts moved before the light (they
   are lit, not self-lit). Test: `tests/91zzza1-cave-gpu.js` (sources in view, order, colour
   packing, cold ambient, no throw without GPU).

2. **mine: the same light model — lamp and platform lamps with rock shadows, daylight down the
   shaft, ore glows and glints above 1.0, the cutter lights the face** — new `src/23b-dig-gpu.js`,
   sharing the field with the cave (the shared WGSL in 22c now leaves four per-mode hooks:
   `ambAt`, `dayAt`, `skyAt`, `airAt`; the mask is opaque, red = rock, green = open sky). The mine's
   mask is the void path (`digVoidPath` got optional explicit rows) plus the sky above
   `digSurfY`, 5 px a texel, rebuilt when a cell is dug (`D.maskV`, bumped in `updateDig`).
   Daylight marches straight up to the sky through the mask — the shaft gets a column of day;
   ambient goes from day-lit at the surface to the cave's cold dark 300 px down (at night the
   surface is dark too). Deleted: the multiply vignette, the warm sprite, the 2D darkness, the
   platform-lamp sprites, the cone, the floor spot, the near glow, the 2D dust, the 2D ore
   glints and body glow, the 2D cutter sparks. The tunnel's fill went from near-black paint
   (.94) to .72: darkness now comes from missing light, and the lamp finds the back wall. The
   cutter's progress overlay moved after the light (it is a pointer). Test: second suite in
   `tests/91zzza1-cave-gpu.js`.

3. **tiles as textures: cave rock, cave far wall and mine rock bake on the GPU** (after merging
   the base with the kit's `Path2D`/`createPattern`/`gpuTileStore`): `tileStore`/`drawTiles` →
   `gpuTileStore`/`gpuDrawTiles(gpuScene(),…)` — the tiles sit under all 2D of the frame, as
   before. `18a-material.fillMaterial` keeps its signature; on a GcCtx its large second pass is
   source-over at 0.35 of its alpha instead of `overlay` (GcCtx has no overlay; the tile is the
   same rock, so it still breaks the 256 grid without moving the colour) — this also unblocks
   any other ship baking `fillMaterial` through GcCtx (surface, landing, base). Bug fixed on the
   way: `drawCaveRock` set `strokeStyle=planetMat()` while the material was still baking (null:
   2D silently kept the old paint, GcCtx refuses). Tile keys now carry `|m` once the planet's
   material is ready, so tiles baked without it re-bake once (before, they stayed bare for good).
   Test: the tile painters are called directly in Node (the frame no longer calls them there).

## Pairs (scratchpad, never in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/2c699494-ba63-5130-aae0-c5cca68da174/scratchpad/`

- `pair-cave-1.png` (before `before-cave.png` | after `after-cave.png`): the lamp became a warm
  beam with a visible cone and dust, the dark is cold and holds shapes, the mouth has a daylight
  shaft, veins glow green — warm key against cold shadow instead of one flat warm blob and a
  green wash.
- `pair-dig-1.png` (the `dig` stand, 6 m at night): the soil goes cold and dark with depth as it
  should at night, the lamp is a warm light inside the shaft that finds the tunnel's back wall
  instead of a black box; the ore patch glows its own colour.
- `pair-digdeep-1.png` (the `dig` stand with `digdeep.js` as `--js`: shaft to 99 m, a drift to
  the right, a side drift at row 24): ore bodies glow in their colour and their grains glint
  above 1.0 near the lamp (ice cold-white, iron warm), platform lamps are real lights with
  bloom cores, the drift is lamp-lit; cold dark rock around instead of an even olive wash.
- `pair-cave-2.png`, `pair-digdeep-2.png` (commit 2 frame | commit 3 frame): the same picture —
  tiles moved to GPU bakes, 0 GPU errors, no page errors. Parity by design for this sub-item.

## New render pipelines (for the warm-up table `08b1`)

- `fld.cave.mul` — `gpuField`, blend `mul`, sampler `gpuMipSmp()`
- `fld.cave.add` — `gpuField`, blend `add`, sampler `gpuMipSmp()`
- `fld.dig.mul` — `gpuField`, blend `mul`, sampler `gpuMipSmp()`
- `fld.dig.add` — `gpuField`, blend `add`, sampler `gpuMipSmp()`
- `kit.shp` with blend `add` (probably already warm from other modes)

## Requests outside the zone

- none yet

## Open problems

- Commit 1's message has `Claude-Session:` after `Co-Authored-By:` (the session's attribution
  order); fleet rule 8 wants `Co-Authored-By:` last — later commits follow rule 8. No amend.

- The browser-tier light suites (`91zzzzy-light` «фонарь в пещере», glow smoothness) read the
  composed frame; they have not been run on this branch (the cloud has no browser tier yet — tools
  ship). The lamp's brightest spot is still the lamp, so they should hold; to be checked with
  `test.ps1 -Browser` on the laptop.
- The field costs two full-screen passes with up to 20+9×10 mask fetches per lit pixel; the mask is
  tiny (cache-friendly) and each source is skipped outside its radius. Not measured (no benches):
  to be looked at on the S23.
