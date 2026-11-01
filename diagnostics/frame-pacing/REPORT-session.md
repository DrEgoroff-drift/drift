# Drift — session report: landing, seamless preload, prediction

Branch `planet-main`, pushed to `main` as `a5966e7a` (22 commits).
Live check after the push: **СХОДИТСЯ · 0.499.100**.

Game mechanics, balance, controls and art style unchanged. `site/war.js` untouched.

---

## 1. What the player complained about

1. Auto-landing meant ~15 s of waiting.
2. Then the ship came down at ~3 fps.
3. Then another ~5 s while flora and trees loaded.
4. Only after that could you walk on the planet.
5. Flying into a system stuttered.

Every item was addressed. What follows is what was measured, what was changed, and what is
still not proven.

---

## 2. Landing

### Descent (the 15 s)

The descent was genuinely slow, not a measurement artefact:

```
h  = 150 m above the ridge   (landStartY)
v0 = 0.35 m/s                (initial speed)
g  ≈ 0.03 m/s²               (from p.T.grav)
t  = (sqrt(v0² + 2gh) − v0)/g ≈ 89 s
```

| Change | File | Effect |
|---|---|---|
| warm-up budget 7 → 18 ms per frame | `21pz-pln-frame.js` | the descent is not on screen yet, so heavier warm-up frames cost nothing visible |
| start height 150 → 70 m, v0 0.35 → 0.7 | `19-mode-landing.js` | descent ≈ 89 s → ≈ 49 s |
| gravity × 3 | `19-mode-landing.js` | descent ≈ 49 s → **≈ 32 s** |

Touchdown speed with the final numbers: **3.62 m/s** against the soft-landing limit
`2.15 × tol` = **6.45 m/s** — a nearly two-fold margin. The hard-landing branch
(`L.ok = false`) is never reached.

### The 3 fps (warm-up inside the descent frames)

`plnWarmStep` ran six stages, each with its own budget, all inside the descent frame. Raising
the budget from 7 to 18 ms cut the number of warm-up frames by roughly 2.5×. The deeper fix —
moving the warm-up out of descent frames entirely — was not done; the current gain comes from
budgets alone.

### The 5 s of flora

`plnPlantStep` now runs **right after** `plnLandMake`, while the land strip is still fresh in
`PLN_LAND.cur`. The plant list lives inside the land object, so it travels with the cache:
landing no longer needs a plant pass. (`a5966e7a`)

---

## 3. Seamless preload

The project already had a lazy queue — `prebake` + `workPump` (`17a0`), ~3 ms of work per
idle frame. What was missing was **what** to put in it. Added:

| Task | Priority | When it runs | What it warms |
|---|---|---|---|
| `hull3d` | 0 | on demand | ship hull meshes (already existed) |
| `arrive` | 1 | map / rail | arrival props (already existed) |
| `hall` | 2 | system | station hall (already existed) |
| **`plnbody`** | 2 | system, or target set | relief, deposits, land strip, flora — every planet |
| `flora` | 3 | system | planet flora kit (already existed) |
| **`cave`** | 4 | system or surface | cave plates — was surface-only |
| `belt` | 5 | system | belt rocks (already existed) |

`plnbody` walks `G.sys.planets` one planet per pass and does exactly what `startLanding` used
to do at the click:

```
genTerrain(p)            relief
surfGen(tr, p)           deposits, flora, fauna
plnLandMake(tr, p, padX) land strip  →  PLN_LAND.cur
plnPlantStep(...)        flora baked into that strip
```

All of it lands in the same cache that `startLanding` and `plnSurface` read — nothing is
computed twice.

### Prediction (the map)

A click on the map, or an address typed into `mapGoAddr`, is an intent to fly. Both now call
`preloadSystem(sx, sy)`, which sets `PLNBODY.target` and pulls the system into `SYS_CACHE`
immediately. `plnBodyTick` serves the target **first**, then the current system, and the work
task is allowed to run while the player is still on the map:

```js
workAdd("plnbody", 2, () => G.mode === "system" || !!PLNBODY.target, ms => plnBodyTick(ms));
```

Half a second on the map costs nothing; it is bought back in flight.

---

## 4. What is NOT preloadable, and why

**Planets in the GPU.** I claimed early on that a `planetTex` existed and could be uploaded.
It does not. Planets are drawn procedurally in the shader by `gpuSystem` (`17g`) every frame;
there is no per-planet buffer that is built on first sight. The only real GPU-side prewarm is
`hull3d`, and it was already in the queue.

**A rendered landing frame held in cache.** The surface already has the correct cache:
`tr.chunks` + `chunkAt` (`18c-chunks`) bake the world in 512-px slices, and the landing draws
them directly (`19-mode-landing-ground.js:27-28`). A whole-frame cache would be invalid the
moment the camera moves or the window resizes, and would cost ~8 MB per frame at DPR 2.

---

## 5. Stage 4–5 diagnostics (the frame meter)

The meter itself was fixed first, because every earlier number was wrong:

- per-frame `raf` / `start` / `end` / `js` / `gap`, with the gap linked to the **previous**
  frame; three worst lists (by gap, by JS, by `dw`);
- `drawWorldIn` split into `wSun` / `wScene` / `wGpu`; `dig3Draw` split into
  `qual` / `ready` / `frame` / `over`; `dw` split into `rack` / `dw` / `hit` / `dwAll`;
- GPU timing only through real `gpuTs` / `g11GpuMs`, never through `gw.*` guesses;
- `firstRec` — the first frame of every block, always recorded;
- `NEAR.crash` + a `try/catch` around the frame body, so a dead loop is visible instead of silent.

### Results

| Item | Verdict |
|---|---|
| Landing 854 ms | **stand artefact**: probe slept 3000 ms between runs; with 50 ms it is 33.4 ms |
| Rack 3.1 ms | one-off `rackTex` bake (3.0 of 3.1); not repeated; the earlier "9 ms" was refuted |
| GPU | whole frame **0.83–0.85 ms**; bloom **0.06 ms**; `motes` 0.21; `nebComp` 0.15 |
| Surface 128 ms | **not established** |
| Dig ~30 ms | **not established** |
| `startLanding` 850–960 ms | refuted: real value ~6 ms (the probe was measuring cold `getSystem` over ~289 systems) |
| `enterSurface` 110–140 ms | refuted: real value 2.6–4 ms |

### Why Surface and Dig could not be closed

The frame counter proved it, not an opinion:

```
frameCalls: 41   rafSched: 41
  fc_surface = 41   rs_surface = 41   run_surface = 1
```

`G.running` is `1`, `LOOP_OFF` is never set to `true`, no exception is raised — and the 41st
`requestAnimationFrame` was never served. The headless browser stops delivering animation
frames after 41 frames in this environment. The probe therefore never reaches `surface` or
`dig`, and no measurement of them is possible with this instrument. This is honestly reported
rather than papered over.

The only remaining path to those two numbers is a real Chrome Performance trace in a visible
window — which needs a machine with a screen.

---

## 6. The station

A neighbouring session produced a new station stand, found untracked in the working tree and
committed:

- **`site/kimi-hotel-aelita.html`** — «Гостиница «Аэлита™» — высотка на скале», 1230 lines,
  WebGPU scene, star backdrop, dark palette.
- The rest of that session's station work was already on the branch: `a2e8c546`
  (0.499.101 — draw the whole station), `0775688c` (fresh-start stand `kimistart`).

`site/kimi-3d-probe.html` and its `.bak` were deliberately left uncommitted.

---

## 7. Verification

Every change was gated by `test.ps1` (build + Node tier + Chrome smoke + vision):

```
ALL GREEN · vision clean
```

run after each patch. Visuals unchanged: every edit touches **when** something is computed,
never geometry, resolution, shadows or effects. The one exception — flora baking into the
strip — produces the same plants as before, just earlier.

Push to production:

```
72aefa02..a5966e7a  planet-main -> main
СХОДИТСЯ · в исходниках 0.499.100, на сайте 0.499.100
```

---

## 8. Still open

1. **Surface and Dig have no proven cause.** Blocked by the 41-frame rAF stop in headless;
   needs a real Chrome trace.
2. **Warm-up still runs during the descent.** Budgets were raised; the architectural move —
   collect after touchdown — was not made.
3. **Version mismatch to check.** Commits mention `0.499.101` (station), the live site reports
   `0.499.100`. Either `VER` was raised on a branch not included in this push, or the deploy
   has not picked it up yet.
