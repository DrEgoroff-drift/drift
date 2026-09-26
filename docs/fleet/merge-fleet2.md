# Fleet → main, second merge (26.09)

Worker session «Флот: облако → main»; Контроль is «Оптимизация разработки». Worktree
`C:\Claude\drift-fleet`, branch `fleet` (from `b485d068` = `origin/claude/fleet-accept`).

## Where it stopped

- [x] 0. History: one `git fetch --deepen=200 origin` → merge-base(da6b1bfa, origin/main) = db057213.
- [x] 1. Zones merged, all clean: gpu-surface 49fd6863, gpu-belt 7fa944d8, gpu-landing 6c167bab,
  gpu-cave cb950e7f, gpu-road 72938bc0.
- [x] 2. origin/main 4778c719 (0.467.0) merged — `a860d9ce`.
- [x] 2b. Interface drawn after `gpuWorld` (the cloud's zones still expect `#hud`) → `#ovl`:
  only the road did it (see below).
- [x] 3. Checks at 39fe6de3: Node tier green; `-Full` and `-Mobile` red only on golden frames
  (Контроль's call); `docs/tour.py` green. The pipeline table (`08b1`) was re-accepted with
  `-Accept -Only конвейеры` by the author's word in chat; golden frames were not touched.
- [x] 3b. The hq / hqfull stands open HQ with `openHq()` (`#hqbtn` is gone) — f1f868d6.
- [x] 3c. The 2D census over 25 scenes, the bake pool's ceiling, the guard for 2D after
  `gpuWorld` — a5e849e3 (see below).
- [x] 3d. origin/main 43155172 (0.469.0) merged — deab3172; conflicts only in build artifacts.
- [x] 3e. `-Full -Jobs 3`: red only on golden frames (the same 13 scenes, the same numbers);
  pool numbers per suite taken, the `·pool` log line dropped; `once` sets die after their bake.
- [ ] 4. Pairs 760 / 390 against origin/main: the look scenes red in golden + the belt cockpit
  «cloud vs main» (`a860d9ce^1`).
- [ ] 5. The six regressions + base lamps + HQ manager.
- [ ] S23 cadence main vs fleet (flight, landing), cold, A/B/A; `-Mobile`, tour; hand over.

## Decisions

### The belt cockpit: main's, one
Two cockpits met. The cloud (ee8db0c3, 1ab0f007) drew the frame as a scene field `belt.ckpt`
lit by the star through the glass (edges towards the star catch light, the star's veil, ghost
and scratches on the glass), with the lamps as scene discs and the instruments and glass
symbology on the 2D `#hud` layer (`gpuHud`). Main (725037ad) moved the whole cockpit — frame,
panel, tape, glass — into a master baked in four bands by the 17a0 oven plus live `#ovl`
primitives, and then removed `#hud` altogether (9715711a).

Kept: main's. The cloud version cannot stand without `#hud`, and `#ovl` has no clip, so a
frame in the scene under `#ovl` would let the pitch ladder and target frame cross the struts
(main hides them under the opaque master frame). Main's also carries the entry-frame work
(26.5 → 20.6 ms at 760) and its gate, key oracle and mutants.

- `src/25-cockpit.js`, `src/24bc-belt-hud.js` — as in main.
- `src/25-cockpit-gpu.js` removed; its two Node suites in `tests/91zzzzzzy1a-belt3d.js`
  («кабина пояса: план без 2D-холста…», «лампы стоек кабины…») removed.
- `src/24ba-belt-gpu.js` keeps the cloud's second scene pass (`p2` after the 3D rocks) without
  the `cockpitGpu` call.
- `tests/91zzzzzzy1-gpugate-belt.js` header and `tests/mutants.json` — main's cockpit side
  (`belt-led-hud`, `belt-hud-key-*` go with the cloud cockpit).

What is lost against the cloud: the star light on the frame's edges and the star's veil/ghost on
the glass. If Контроль wants it back, the way is a lit-master kind in `#ovl` (the image kind
sampling the master's alpha towards the star), not a second frame.

### The bake pool: a ceiling, a guard, `once` sets
Main's pool (0.469.0) evicted by age into `GPU.trash` and sent `once` sets and sets above half the
ceiling to the trash too — each lived until the next `gpuFrame`, so a burst of bakes in one frame
held all of them at once. Here:

- `GC_POOL_CAP` (80 MB) bounds the pool's live sets plus those waiting to be destroyed, at every
  moment. Room is made *before* a creation: the oldest cold set no bake holds is destroyed at once.
  That is legal because pool textures are written only in the bake's own encoder, which is
  submitted inside the bake. The warm sets (`GC_POOL_WARM`, ~54 MB) are never evicted.
- A set handed to the bake being encoded is never destroyed before that submit: it waits in
  `dead` for `gcPoolFlush` (the end of the outermost `gpuBakeRedo`).
- A `once` bake's set lives for that one bake and dies right after its submit: the rack master
  2508×1008 (60 MB) and its shadow (65 MB), the belt cockpit, the instrument. Same number of
  creations as main, a frame less of life.
- A non-`once` set bigger than the ceiling leaves above the warm sets (a full-frame room) sits in a
  per-role slot until it is replaced or the scene changes (`gcPoolLeave` from `gpuFrame`); a
  re-bake of the same room reuses it.
- The guard in `tests/90-harness.js`: a suite whose pool peak passes the ceiling is red.

`-Full` after the change: pool peak ≤ 79.8 MB in every suite. 31 slot creations, at most one per
scene entry, except the gesture suite: up to five in one entry, because its window resizes re-key the
base. 61 `once` creations: rack, pipelines, the 2D gates, cockpit, the after-world guard,
gestures.

The largest moment is 272 MB: the base at 2560×1440 — pool 74 MB plus the slot set of one
base layer, 4096×2112 at 4× MSAA with stencil = 198 MB. Measured on the base stand
(`baseBake`, all four world-size layers):

| window | layers above the free room | slot now | peak, all |
|---|---|---|---|
| 390×844, DPR 2.625 | 1587×1350 | 51.6 MB | 131 MB |
| 1280×800 | 1536×832 | 29.3 MB | 108 MB |
| 2560×1440 | 3021×944, 3474×944, 4078×2092, 2039×1046 | 51.0 MB | 277 MB |

Main creates each of these per bake and trashes it a frame later; here the last one is held for
the visit, and at 2560×1440 the entry replaces the slot four times. This is main's G11 base, not a
fleet zone — Контроль's call. The cheap fix is baking the base layers without MSAA or in tiles.

### The guard: no 2D on `#c` after `gpuWorld`
`tests/91zzzzzzy6-after-world.js` hooks `#c` the way 08c does (`gpuFrontHook`, then `MAIN_CTX`'s
own methods — prototype wrappers are blind to them) and runs every `lookScenes()` scene and the
road for 12 frames. After `gpuWorld` the count must be zero, and a scene that uploads `#c` must
also show a 2D call (the hook's truth check). A self-test injects one `fillRect` after
`gpuWorld` and expects exactly one. GPU-3's `91zzzzzzy3-gate2d` wraps prototypes only, so on `#c`
it sees setters but not method calls.

### Ground grain on the landing
Main's 9ee4edff (`planetMat` steps its own job, `matRows` for the planet frame) and the cloud's
shared chunk recipe (`groundChunkStore`/`groundChunkPaint`, 19-mode-landing-ground) agree:
`drawLanding` and `drawSurfaceWorld` ask `planetMat(p)` every frame, and the chunk path is taken
only once `tr.mat` is ready, so the chunks bake with grain.

### Interface after the world: `#hud` is gone, the road moves to `#ovl`
In the fleet's base `gpuWorld` switched `ctx` to the `#hud` layer, so a zone could draw its
numbers after the world. Main removed `#hud` (9715711a): after `gpuWorld` `ctx` stays on `#c`,
which nobody shows any more, and `gpuHud` no longer exists.

Census (every 2D draw call on `#c` counted after `GPU.wDone` or outside a GPU frame, 25 scenes:
map, landing, surface day/night/noon, cave, dig, home ×3, kino, hq, raid, winter, spa, system,
dock, cockpit, rack, belt, scoop, base, wanderer, road): zero everywhere except the road, which
crashed on `gpuHud`. The road now queues its numbers into `#ovl` *before* `gpuWorld` through
`roadOvl()` (27lc) — a small 2D-shaped adapter (fillText, fillRect, strokeRect, measureText,
save/restore) over `ovText`/`ovRect`, so the drawing code in 27l did not change; the coins stay
on `#c` as world light. `roadGpuMount` moves `#ovl` with `#g` into `#roadwin` and back.
The stand scenes `hq`/`hqfull` fail on main too (`#hqbtn` is gone from the shell) — for pairs
the HQ is opened with `openHq()`.
