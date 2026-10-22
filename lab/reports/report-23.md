# Report 23 — surfG garbage by source; the wall marks at the cave mouth

Build: e2eb4d0e (0.499.25), local copy C:\Claude\drift-lab-b, no live site. First pass on 3d4fa8e1 (0.499.24)
gave the same numbers within noise. Tools: `lab/heaptree.py`, `lab/snippets/{prep,sgopt,f32count}.js`,
`probe --heap --alloc --heapdump`, `--jsflags`, `--chromelog`.

## 1. Where surfG's 222 MB comes from

60 s of the hall's background prep in the system (prep.js), sampling heap profiler, everything allocated under
`K.surfG`, booked to the function that allocated it.

| source | MB / 60 s | how measured |
|---|---|---|
| **K.surfG itself (own frame)** | **222.6** (inlining on) / **222.2** (`--no-turbo-inlining`) | heap sampler |
| f(u,v) of the bodies, all together | ≈ 100 (inlining off, each a frame of its own) | heap sampler |
| — `at` 27f3a:114898 (head H.at) | 22.0 | |
| — `cpSculpt` 27f3a | 19.7 | |
| — `G` 27f3a:114897 | 9.1 | |
| — torso lambda 27f3-person3d:114654 + `cpTorsoAt` | 8.1 + ~4 | |
| — `K.surf.wrap` lambdas 27f3a (4 sites) | ~19 | |
| vx3c own frame (V8 heap) | 9.8 | heap sampler |
| vx3c body buffer `V` doubling (`VN+12>V.length`) | **23.8** in 7 reallocations, largest 12 MB | Float32Array counter (off-heap) |
| sgArr slots (fresh + grow) | 0.8 in 16 | Float32Array counter |
| all `new Float32Array` in the page | 40 in 1678 | Float32Array counter |

**The f(u,v) hypothesis does not hold.** With inlining off, f's are their own frames and the surfG frame does not
shrink at all (223.8 → 222.2). The work arrays do not explain it either: big typed arrays keep their bytes off the
V8 heap (the sampler does not see them; the counter sees 40 MB in all), and sgArr allocates < 1 MB.

**Working hypothesis: boxed doubles in the generator's own code.** Per point: 220 MB / 111.7 k points (same-run
count, 30 s) ≈ **2 KB per point** booked on surfG. The tier A/B (30 s):

| tiers | surfG own | vx3c own | points |
|---|---|---|---|
| default | 220 MB | 9–14 MB | 111.7 k |
| `--no-maglev --no-turbofan` | 80 MB | 288 MB | 21.4 k |

With the optimizing tiers off, vx3c (a plain function, normally optimized) suddenly allocates 13 KB per point —
every double in it gets a HeapNumber. surfG's allocation per point is of the same order in both modes (≈2 KB vs
≈3.7 KB), i.e. surfG behaves like unoptimized code even when TurboFan is on. A generator with `yield` inside its
loops does not reach optimized code here; every `P[k]`/`NN[k]` read, every intermediate in the normals loop and the
6 × 11 arguments to vx3c per cell becomes a heap object. Not confirmed by V8 directly: `--allow-natives-syntax`
hangs the page, and `--trace-opt` output does not leave the renderer on Windows.

What would settle it (Control's call): move the row bodies (the f loop, the normals row, the triangle row) into
plain functions called from the generator, which yields only between rows; re-measure surfG's own frame — expected
near zero.

The vx3c buffer doubling is a second, smaller source: 23.8 MB / 60 s, largest copy 12 MB.

## 2. Battery on 0.499.25 (D25)

| scene | live at end | surfG own | p50 / p95 ms | over 33 ms |
|---|---|---|---|---|
| hire (dock) | 51.7 MB | — | 4.2 / 4.3 | 8 |
| hq | 452.9 MB | 71.9 | 4.2 / 4.3 | 4 |
| system | 451.6 MB | 83.8 | 4.2 / 4.3 | 24 |
| prep 60 s | 1177.8 MB | 232.1 | — | — |

## 3. The marks on the wall at the cave mouth (recon, nothing edited)

- **Who drew them in 2D:** `wallDraw(WALL_C, …)` — `src/11ah-wall.js:152-172`, the hands' marks via
  `traceDrawMark`, a dark cut a pixel lower then a light stroke. Called from the old 2D `drawCave` body in
  `src/22d-cave-pln.js`, right after `drawCaveWater`, before the light:
  `if(wallCount(WALL_C)>0){wx0=CAVE_WALL_X0-camx, wx1=CAVE_WALL_X1-camx; fy=caveFloor(C,mid)-camy;
  wallDraw(WALL_C,wx0,wx1,fy-50,fy-8,"rgba(236,232,214,.66)")}`.
- **Where the call was lost:** a2586751 (22.10 03:52) «Planet, cave, base: no 2D under the engine, old 2D frames
  removed» stopped drawing it; 2b449867 (22.10 04:07) «Cave and base: the old 2D frames removed (62.7 KB)» deleted
  the body.
- **The settlement twin:** `wallStone(x,y,pal,WALL_S)` (`11ah-wall.js:189-221`, the boundary stone that calls
  wallDraw on its face) was called from `settleDrawBody` in `12tb-settle-draw2.js`; removed in 266cd405
  (22.10 06:13) «plnOverOld 1/n: settlement as engine bodies (21pii), 2D village deleted».
- **Engine body:** none. Nothing on the engine reads the wall data; `wallHere`/`wallCount` are read only by the
  prompts (`21-mode-surface.js:511-521`, `22-mode-cave.js:395-404`). `22d-cave-pln.js:398` `wall:[…]` anchors the
  «УСТЬЕ» prompt plate only (line 436). wallDraw and wallStone are now uncalled.
- **Nearest ready pattern:** `src/21piib-pln-trace.js` (a2c7ddbb, 22.10 06:35) — the stranger's trace as engine
  bodies: `plnTrcStrokes(m)` turns a `TRACE_MARK` figure into polylines through a recording fake canvas,
  `plnTrcMesh` cuts them into a slab as a dark groove with a light lower edge. Same glyph family as wallDraw.
