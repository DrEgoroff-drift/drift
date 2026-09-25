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

## Pairs (scratchpad, never in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/2c699494-ba63-5130-aae0-c5cca68da174/scratchpad/`

- `pair-cave-1.png` (before `before-cave.png` | after `after-cave.png`): the lamp became a warm
  beam with a visible cone and dust, the dark is cold and holds shapes, the mouth has a daylight
  shaft, veins glow green — warm key against cold shadow instead of one flat warm blob and a
  green wash.

## New render pipelines (for the warm-up table `08b1`)

- `fld.cave.mul` — `gpuField`, blend `mul`, sampler `gpuMipSmp()`
- `fld.cave.add` — `gpuField`, blend `add`, sampler `gpuMipSmp()`
- `kit.shp` with blend `add` (probably already warm from other modes)

## Requests outside the zone

- none yet

## Open problems

- The browser-tier light suites (`91zzzzy-light` «фонарь в пещере», glow smoothness) read the
  composed frame; they have not been run on this branch (the cloud has no browser tier yet — tools
  ship). The lamp's brightest spot is still the lamp, so they should hold; to be checked with
  `test.ps1 -Browser` on the laptop.
- The field costs two full-screen passes with up to 20+9×10 mask fetches per lit pixel; the mask is
  tiny (cache-friendly) and each source is skipped outside its radius. Not measured (no benches):
  to be looked at on the S23.
