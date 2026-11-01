# Drift — Frame Pacing, stage 4: corrected meter

Branch **`perf/frame-pacing`** (in `C:\Claude\drift-merge`, working branch `planet-main`),
HEAD at hand-off: **`0c46c33c`**.
Game code touched: **none** — only diagnostic paths, all under `if(NEAR.on)`.
`site/war.js` untouched. `?g11=near` kept and extended.

Raw runs, in order of the stage:

| file | what it is |
|---|---|
| `near-run-01.json`, `near-run-02.json` | before the meter fix (stage 3 format) |
| `near-run-03-clean.json` | after the `getSystem` pre-warm, old format |
| `near-run-04.json` | **corrected format**, 6 blocks, 240 frames each |
| `near-run-05.json` | rack open (`G.rack={on:true}`), probe pause 3000→50 ms |
| `near-run-06.json` | `drawWorldIn` split (`wSun`/`wScene`/`wGpu`) |
| `near-run-07.json` | full 240-frame wait per run — only 1 block fits the stand window |
| `near-run-08.json` | 200-frame / 2 s cap per run — still 1 block |
| `near-run-09.json` | **GPU timestamps** (`gpuTs`), `gpuTsOk: true` |

---

## 1. What was wrong in the previous diagnostic

**1.1. `gap` and `js` measured different intervals but sat on one record.**
`gap` was `now − framePrev` — from the *previous* frame's rAF callback to this one. `js` was this
frame's own body time. A reader saw "this frame took `gap` ms", when the heavy work behind that
gap may have been the *previous* frame's. `near-run-04` makes it concrete: `surface i=482` has
`js=138.2`, and `i=483` has `gap=137.4` with `prevJs=138.2` — the gap is the *consequence* of the
frame before it, and the old format could not say so.

**1.2. `worst` kept only the top 8 by `gap`.** A frame with the maximum JS but a normal gap never
appeared in the JSON: `surface i=482` (`js=138.2`, `gap=4.3`) was invisible.

**1.3. `dw` was an umbrella.** In `28-loop` it wrapped `rackDraw(); drawWorld(); drawHitFx()`, so
"`dw` 13–15 ms" was never `drawWorld`'s cost. Stage 3 attributed it to `rackDraw` — a guess.

**1.4. GPU was inferred from CPU timers.** `gw.front/bloom/ov = 0` was read as "bloom is free".
Those fields measure JS command-recording only and say nothing about the GPU.

---

## 2. How frames are timestamped now

Each record carries `raf` (rAF timestamp), `start` / `end` (`wallMs()` around the JS body),
`js` (`end − start`), `gap` (rAF-to-rAF), and — added in `nearFrame()` — `prevJs`, `prevGap`,
`prevRack` copied from the previous record. *This frame's JS* and *the interval that followed the
previous frame* now sit side by side.

`gap` is an **rAF interval**. It is not frame time and not GPU time. `dw`/`dwAll` is JS time inside
`drawWorld`; `gw.*` is JS time preparing and submitting commands; `gpuMs` is the only GPU number.

The three worst lists are independent: `worstGap`, `worstJs`, `worstDw`, 8 frames each, plus full
statistics (`gap`, `js` percentiles, `long`, `jsLong`, `work`) over all frames of the block.

---

## 3. CPU and rAF tables (`near-run-04`, headless, 240 frames per block)

| Block | prev | gap p50 | p90 | p95 | p99 | max | js p50 | p90 | p95 | p99 | max |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| system | — | 4.2 | 4.2 | 4.2 | 4.3 | 8.4 | 0.0 | 1.2 | 1.4 | 1.8 | 2.5 |
| landing | system | 4.2 | 8.3 | 8.4 | 16.8 | **854.2** | 0.0 | 3.1 | 8.4 | 10.7 | 25.5 |
| surface | landing | 4.2 | 4.2 | 4.3 | 8.4 | **137.4** | 0.0 | 3.2 | 3.6 | 6.9 | **138.2** |
| dig | surface | 4.2 | 4.2 | 4.3 | 8.4 | 37.5 | 0.0 | 3.4 | 4.2 | 8.1 | 40.2 |
| cave | dig | 4.2 | 4.2 | 4.3 | 8.1 | 8.4 | 0.0 | 2.9 | 3.4 | 5.2 | 8.9 |
| landing (warm) | cave | 4.2 | 8.3 | 8.4 | 12.5 | 20.9 | 0.0 | 4.0 | 7.9 | 12.7 | 23.8 |

`vis` is `"visible"` on **every** frame of every block — the tab was never hidden.

---

## 4. Worst frames, both criteria

**By JS** (`surface`, `near-run-04`):

| i | js | gap | prevJs | prevGap | sw | gf | dw | hud | gp | wp |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 482 | 138.2 | 4.3 | 0 | 4.2 | 1.8 | 0.1 | **128.8** | 6.9 | 0.2 | 0.2 |
| 483 | 8.7 | 137.4 | **138.2** | 4.3 | 0.9 | 0 | 6.7 | 0.8 | 0 | 0 |
| 486 | 6.9 | 4.1 | 0 | 4.2 | 0.4 | 0 | 6.1 | 0.3 | 0 | 0 |

**By gap** (`surface`): worst is `i=483`, `gap=137.4`, `prevJs=138.2` — the gap belongs to the heavy
frame **before** it. `landing`'s worst gap is `i=245`, `gap=854.2` with `js=8.3` — a hole behind a
light frame.

**`drawWorldIn` split** (`near-run-06`, `wSun` / `wScene` / `wGpu`):

| mode | dwAll | dw | wSun | wScene | wGpu |
|---|---:|---:|---:|---:|---:|
| system | 3.3 | 0.9 | 0 | **0.8** | 0.1 |
| landing | 22.9 | 17.8 | 0 | **17.6** | 0.2 |
| surface | 10.6 | 10.0 | 0 | **9.8** | 0.2 |

`sunDirSet` is free; `gpuWorld`'s JS is 0.1–0.2; the scene draw holds essentially all of
`drawWorld`.

---

## 5. Causes, with status

| Observation | Status |
|---|---|
| `surface` 128.8 ms inside `dw` on the first surface frame | **Established**: it is `drawSurface` itself (`wScene=9.8` of `dw=10` on the surface's hot frame). |
| the following `gap` 137.4 | **Established**: the rAF interval after that 138.2 ms frame (`prevJs=138.2`). |
| `dig` `dw` 36.4 with `dg.frame` 5.5 | **Narrowed**: 5.5 is `dig3Frame`; the remaining ~30.9 is the **scene draw** (`wScene`), not `sunDirSet` (0) and not `gpuWorld` (0.1–0.2). The painter inside `drawDig` is still unsplit. |
| `landing` `gap` 854.2 with `js` 8.3 | **Established**: the probe's own `sleep(3000)` between runs. Cut to 50 ms → **854.2 → 33.4**. Not the game. |
| `rackDraw` | **Measured**: 3.1 ms with the rack open — `rackTex` 3.0, `rackBottom` 0.1, `rackDrawK` 0.1. Stage 3's "9 ms" is **not confirmed**. |
| `gpuWorld` / bloom | **Measured on GPU**: whole frame 0.84 ms, bloom 0.06 ms. Stage 3's "bloom free" (from `gw.bloom=0`) was wrong in method, not in direction. |

---

## 6. `rackDraw` and the dig, as measured

**rack closed** (`near-run-04`): `rack` = 0 in `system`, `landing`, `surface`, `dig`, `cave`.

**rack open** (`near-run-05`, `G.rack={on:true}`):

| field | what | ms |
|---|---|---:|
| `rack` | whole `rackDraw` + `rackLate` | **3.1** (landing), 1.1 (system) |
| `rackT` | `rackTex` — the plate bake | **3.0** |
| `rackB` | `rackBottom` — DOM flag (`--rackbot`, `classList`) | 0.1 |
| `rackF` | `rackLate` → `rackDrawK` | 0.1 |

The cost is the bake, not the DOM.

**dig** (`near-run-04`): `dg.qual` 0, `dg.ready` 0, `dg.frame` 5.5, `dg.over` 0. `dwAll` = `rack` +
`dw` + `hit` to rounding; on dig the 36.4 is `dw` (`drawWorld`).

---

## 7. Chrome Performance trace

**Not done.** A real visible-window trace for the five scenes (space / landing / surface / dig /
cave), and the control run without diagnostics, are still owed. A headless `--trace-startup` is
**not** the same thing and is not passed off as one here.

**GPU timings are real** (`gpuTs`, `near-run-09`, `gpuTsOk: true`):

| pass | ms |
|---|---:|
| `frame` (whole) | 0.84 |
| `sum` | 0.8 |
| `motes` | 0.21 |
| `nebComp` / `nebHalf` / `nebGen` / `nebRes` | 0.15 / 0.14 / 0.07 / 0.02 |
| `final` | 0.08 |
| `bloomDown` + `bloomUp` | 0.05 + 0.01 = **0.06** |
| `ovl` | 0.01 |
| `hull3d` | 0.02 |
| `starHalf` | 0.05 |

The GPU side of the whole frame is **0.84 ms**, the bloom **0.06 ms** of it — neither 8 nor 0.

---

## 8. Normal mode vs diagnostic mode

**Not measured yet.** Every number above is with `NEAR.on`; the diagnostic overhead (240 frames
buffered per block, one JSON POST) is unquantified against a silent run. Open item.

---

## 9. Confirmed, refuted, unexplained

- **Confirmed as bugs in the meter**: the rAF-gap/JS misattribution; the lost max-JS frame; `dw`
  being an umbrella; drawing GPU conclusions from CPU timers.
- **Refuted**: "`drawWorld` in dig ≈ 15 ms" — its own draw (`dig3Frame`) is 5.5 ms. "`rackDraw` ≈
  9 ms" — 3.1 measured with the rack open. "`gpuWorld`/bloom free" — bloom is 0.06 ms on GPU, which
  is cheap but was not proven by `gw.*=0`.
- **Established**: the `landing` 854 gap was the probe's `sleep(3000)` (854.2 → 33.4); the
  `surface` 137.4 gap is the consequence of the 138.2 ms first `drawSurface`.
- **Narrowed, not split**: the ~30.9 ms in `drawWorldIn` on dig is the scene draw; which painter
  inside `drawDig`/`drawSurface` still is not separated. The same holds for the `surface` 128.8
  (terrain vs. plants vs. lights unsplit).

---

## 10. Stand caveats found during the stage

1. **The probe's own pause mattered**: `sleep(3000)` between runs produced a fake 854 ms gap in
   the `landing` block (fixed to 50 ms in `near-run-05`).
2. **The probe's frame wait matters**: waiting for full 240 frames per run (`near-run-07`) or a
   200-frame / 2 s cap (`near-run-08`) lets only the **first block** (`system`) fit the stand's
   window. Six blocks need `WaitSec` around 400 s.
3. **The stand serves the clone, not the workspace** unless it is started from the repo being
   edited — this cost one wrong run (the probe read the old `drift.html`).

**This stage changed the meter, not the game. No performance claim here rests on a fixed number.**
