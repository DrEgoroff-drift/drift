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
| 2 | **winter** (`29g-winter-draw`) + a shared rooms module (`29c0-rooms-gpu`: `roomBake(role,key,w,h,draw)` — one texture per role, dropped when the key changes; `roomSz()`; `ROOM_WGSL_NOISE`). The room layer stays `screenLayer` (called as is; drawn with `gpuImage`, so it works both as today's 2D canvas and as the kit's future bake). The window is a live field (`win.view`): the planet's sky, the ridge, a blizzard in three depths of streaks, frost growing from the frame, the lamp's warm reflection on the glass. Frame, lamp fixture (it now hangs, dark, when the lamp is off), the desk, the instruments, the calendar, the fault-lamp housings and the man are one bake (`win.props`, keyed by the levers, the day and the faults); the day line is its own bake (`win.text`) drawn last. Light is an add field per pixel (`win.light`): fire tongues in the stove door, its flickering warmth and floor spot, the lamp's cone in the air with drifting dust and its pool on the floor, the window's cold on floor and wall; then emissive shapes (the bulb above 1 for the frame's bloom, fault lamps breathing, dust motes in the cone) and a multiply darkness at the edges (`win.dark`, deeper with less light). The 2D window, fire, cone, dust and vignette are gone. Suite «…зимовка печётся без дыр» |
| 3 | **kino** (`27da-kino`): the brushes the cantina calls (`kinoScreen`, `kinoBeam`, `kinoOverlay`) paint into the cantina's own canvas, which is the HQ ship's to port — so kino improves its brushes and keeps them GPU-canvas-safe (all ops are `GcCtx` ops; a suite records the whole reel through `GcCtx`). The projected picture is light now: a hot centre, corners falling off, the lamp breathing, gate weave (picture and caption shake together) and scratches every 120 ms. The beam is seven nested wedges (a soft edge, brighter at the axis) drawn with `lighter`, with dust drifting along it and a glowing lens at the booth; the screen's spill on the room is `lighter` too. Suite «…кинопередвижка рисуется GPU-холстом без дыр» |

## Pairs

| scene | file (scratchpad) | what got better |
|---|---|---|
| winter | `pair-winter.png` (and `after-winterlow.png`: lamp off, one heater) | the room is lit by its three sources for real: fire moves in the stove and warms the left wall, the lamp's cone hangs in the air with dust and pools on the table and floor, the window is a blizzard in depth behind frost with the cold spilling onto the bunk — warm inside against cold outside |
| kino | `pair-kino.png` (crop ×2: `crop-kino.png`) | the cinema reads as projected light: a beam with a soft edge and dust from a glowing lens, the screen hot in the middle and darker in the corners, the film weaving and scratched |
| spa | `pair-spa.png` | the sea is water now: waves in perspective that move, and the sun path is glitter on the crests from horizon to rail instead of a flat trapezoid; swell lines roll in and fade; the sky has depth and faint cirrus; a sun you can see; people, the table and the chair stand on the deck with soft shadows and long shadows that agree with the rail lattice |

## New render pipelines (for the warm-up table `08b1`)

- `fld.spa.sea|over`, `fld.spa.air|mul` (fields, `gpuFieldLayout`)
- `fld.win.view|over`, `fld.win.light|add`, `fld.win.dark|mul`
- kit pipelines already warmed elsewhere: `kit.img|over`, `kit.shp|over`, `kit.shp|add`

## Requests for files outside the zone

- none yet.

## Open problems

- The spa's time is `G.t/60 % 3600` seconds: the swell jumps once an hour of game time (invisible in play).
- The board text is baked at DPR; a change of `G.opts.gfx` resolution re-bakes by key (`W×H|DPR`).
