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
| 4 | **chess** (`25n-chess`): the board is a DOM canvas in the desk panel, and the kit has no way yet to show a bake in a DOM canvas (request below), so the brush is split from the canvas — `chessPaint(c,size,g,ch,flip)` paints into any context, 2D or `GcCtx` — and improved: wood grain per square (by the square's hash, along on light squares and across on dark ones), one light from the top left over the whole board, a bevelled frame, a soft shadow under every piece toward the bottom right, a glowing ring on the lifted piece and soft move dots. Moves, squares and taps are unchanged. Suite «…шахматная доска рисуется GPU-холстом без дыр» |
| 5 | **home** (`29d-home-draw`): the house is baked in world-space chunks (`hinChunks`: 160 world units wide, the whole frame high, device pixels, a 6-unit margin baked and cut off so chunks meet without a seam; only visible ±2 kept; all dropped when `hinSig` changes — tier, floor, upper storey, the garage ship, the trophies, the frame's scale). Two layers: *back* (`hinPaintBack`: wall, articulation, floor, ground-floor windows, furniture through `hinMaterialize`, partitions and doorways, the front door, stairs or hole, the end wall) in `gpuScene`; *front* (`hinPaintFront`: things nearer than the people, lamp fixtures) after `gpuOver`. Between them, live on 2D: the people, and the shell (29e) — it lies above the ceiling and below the floor, never over the room, so it stays 2D until the kit's `Path2D` is merged. The camera snaps to a device pixel, so chunks land texel for texel. Light per pixel on top of everything (`hin.light`, multiply): a lamp per room lights the wall and floor in a cone and falls off to the corners, a pool under each lamp, cold under and around the windows, the warmth of the next room's lamp on our floor in front of each doorway; then the air (`hin.haze`, add): a dusty haze in each cone; then bulbs, dust motes in the cones and the dock's blinking light as emissive shapes. The 2D cones, pools and glows are gone; the dock light in the bake is steady (its blink is the GPU glow). Suite «…дом печётся кусками без дыр» |
| merge | the fleet base merged in (`Path2D`, `createPattern`, the 18c GPU twins) |
| 6 | **home upstairs** (`29e-home-up`, via `29d`): with `Path2D` in the kit, the shell (`hinDrawShell`: the roof over the attic, the storey above seen through the ceiling, the joists under the floor) moves from live 2D into the back bake — drawn first, as before. Nothing but the people is on 2D in home any more. **winter**: the room layer uses the kit's `gpuScreenLayer` (a bake) instead of `screenLayer` (a 2D canvas uploaded), same key |

## Pairs

| scene | file (scratchpad) | what got better |
|---|---|---|
| winter | `pair-winter.png` (and `after-winterlow.png`: lamp off, one heater) | the room is lit by its three sources for real: fire moves in the stove and warms the left wall, the lamp's cone hangs in the air with dust and pools on the table and floor, the window is a blizzard in depth behind frost with the cold spilling onto the bunk — warm inside against cold outside |
| kino | `pair-kino.png` (crop ×2: `crop-kino.png`) | the cinema reads as projected light: a beam with a soft edge and dust from a glowing lens, the screen hot in the middle and darker in the corners, the film weaving and scratched |
| chess (desk panel over `kino`) | `pair-chess.png` (crop ×2: `crop-chess.png`) | the board is wood lit from one side and the pieces stand on it, each with its own shadow; the lifted piece glows instead of a flat yellow square |
| home | `pair-home.png`, `pair-homeup.png` (crop ×2: `crop-home.png`) | each lamp now lights the room: bright under it, falling off into darker corners, a dusty cone hanging in the air and a pool on the floor; the window spills cold onto the dresser; the bulb glows. The camera slides over baked chunks — the house is no longer re-rastered by 2D every frame |
| spa | `pair-spa.png` | the sea is water now: waves in perspective that move, and the sun path is glitter on the crests from horizon to rail instead of a flat trapezoid; swell lines roll in and fade; the sky has depth and faint cirrus; a sun you can see; people, the table and the chair stand on the deck with soft shadows and long shadows that agree with the rail lattice |

## For the design pass (on a real GPU)

- **spa** — the sea's colour against the sky (the reflection weight `fres*.38`, `SEA2`), how long and how
  bright the sun path is, whether the swell lines read as swell at 2560 px; the cast shadows' length and
  softness; the dust in the sun (44 motes) — too few or too many on a phone.
- **winter** — the lamp cone's strength (`.30`) and edge (`man*.07`) against the room layer's own baked lamp
  light (`winLit`), which now double-counts a little; fire tongues' speed; the blizzard's three depths and the
  frost's height; `winterlow` must still read as a cold dark room.
- **home** — the balance between the multiply light (ambient `.74`, cone `.20`, pool `.30`) and the old baked
  colours: a figure right under a lamp lifts to ×1.3 and loses its blue; the cone reads softer than the old hard
  trapezoid (the old one was more graphic — decide which the house wants); the bulbs are kept at 1.1 because a
  brighter bulb made the frame's bloom wash the room; chunk seams at a phone's DPR while walking.
- **kino** — the beam's seven wedges (visible steps at ×2?), the screen's corner falloff (`.62`), the
  flicker speed. Needs the cantina canvas to reach the GPU (HQ ship) to become a live field.
- **chess** — the grain's strength on light squares; the piece shadow's offset at the panel's 264 px.

## New render pipelines (for the warm-up table `08b1`)

- `fld.spa.sea|over`, `fld.spa.air|mul` (fields, `gpuFieldLayout`)
- `fld.win.view|over`, `fld.win.light|add`, `fld.win.dark|mul`
- `fld.hin.light|mul`, `fld.hin.haze|add`
- kit pipelines already warmed elsewhere: `kit.img|over`, `kit.shp|over`, `kit.shp|add`

## Requests for files outside the zone

- **kit (`08c*`): show a bake in a DOM canvas.** The desk panel's chess board (and, for the HQ ship, the
  cantina and HQ room canvases) are DOM canvases. `gpuBake` gives a texture, and nothing presents a
  texture into a `<canvas>` of the page. Wanted: `gpuPresent(cv, B)` (or `gpuPanel(cv, w, h, draw)`) —
  a `webgpu` context on that canvas configured with `GPU.dev`, one blit of `B` (premultiplied), redone
  after a device loss. With it, `chessDraw` becomes `gpuPanel(cv,352,352,c=>chessPaint(c,352,g,ch,flip))`.

## Open problems

- Home light is a multiply over the baked colours: a lamp directly above a figure lifts it by up to ×1.3; the
  bulbs are kept just above 1, because a brighter bulb made the frame's bloom wash the whole room.

- The spa's time is `G.t/60 % 3600` seconds: the swell jumps once an hour of game time (invisible in play).
- The board text is baked at DPR; a change of `G.opts.gfx` resolution re-bakes by key (`W×H|DPR`).
