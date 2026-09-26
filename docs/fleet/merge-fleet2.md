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
- [ ] 3. Checks: Node tier, `-Full -Jobs 3`, `-Mobile`, `docs/tour.py`.
- [ ] 4. Pairs 760 / 390 against origin/main.
- [ ] 5. The six regressions + base lamps + HQ manager.
- [ ] Last origin/main (0.468.0) merged before handing over.

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
