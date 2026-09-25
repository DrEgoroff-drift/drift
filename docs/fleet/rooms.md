# Ship «rooms» — G11 for home, winter, spa, kino, chess

Branch `claude/gpu-rooms`, from the fleet base `claude/optimistic-gates-u46osn` (e4c3a56).
Zone: `29c-home-in`, `29d-home-draw`, `29e-home-up`, `29f-winter`, `29g-winter-draw`, `29h-spa`,
`29i-spa-draw`, `27da-kino`, `25n-chess`, and `tests/91zzzzzzy5-rooms-gpu.js` (new).

Pairs are 760×475 at DPR 1, shot with `docs/shot.py` on SwiftShader; «before» from a worktree of
the fleet base (`../base-rooms`), «after» from this branch. Scratchpad of session
`0fa4171f-8826-5ce5-9a27-93d45c19a685`: `/tmp/claude-0/-home-user-drift/0fa4171f-8826-5ce5-9a27-93d45c19a685/scratchpad/`.

## Commits

| # | what |
|---|---|
| 1 | **spa** (`29i-spa-draw`): the whole veranda on the GPU, nothing left on `#c`. Sky, cape, sea, swell, surf and haze are one live field (`spa.sea`); the floor and everything standing on it are two bakes (`floor`, `props`: re-baked only when the frame size or the board changes); soft contact shadows and long cast shadows from the low sun between them (`gpuShapes`); light and air on top — a multiply field (`spa.air`: warm from the sun with falloff, the awning's shade, a cool bounce from the sea), and dust and salt hanging in the sun (`gpuShapes`, add). The 2D sky, sea, surf, haze and the spa's own vignette are deleted (the final pass has the vignette). New suite «комнаты на видеокарте: веранда санатория печётся без дыр» |

## Pairs

| scene | file (scratchpad) | what got better |
|---|---|---|
| spa | `pair-spa.png` | the sea is water now: waves in perspective that move, and the sun path is glitter on the crests from horizon to rail instead of a flat trapezoid; swell lines roll in and fade; the sky has depth and faint cirrus; a sun you can see; people, the table and the chair stand on the deck with soft shadows and long shadows that agree with the rail lattice |

## New render pipelines (for the warm-up table `08b1`)

- `fld.spa.sea|over`, `fld.spa.air|mul` (fields, `gpuFieldLayout`)
- kit pipelines already warmed elsewhere: `kit.img|over`, `kit.shp|over`, `kit.shp|add`

## Requests for files outside the zone

- none yet.

## Open problems

- The spa's time is `G.t/60 % 3600` seconds: the swell jumps once an hour of game time (invisible in play).
- The board text is baked at DPR; a change of `G.opts.gfx` resolution re-bakes by key (`W×H|DPR`).
