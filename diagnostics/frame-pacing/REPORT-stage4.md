# Drift — Frame Pacing, stage 4: corrected meter

Branch `perf/frame-pacing` → `planet-main`, commits `097dd8d1` (meter) on top of `9f871a80`.
Game code touched: **none** — only the diagnostic paths, all under `if(NEAR.on)`.

Raw runs: `near-run-01.json`, `near-run-02.json`, `near-run-03-clean.json`, `near-run-04.json`.

---

## 1. What was wrong in the previous diagnostic

**1.1. `gap` and `js` belonged to different intervals and were stored on one record.**
`gap` was `now − framePrev`: the span from the *previous* frame's rAF callback to this one. `js`
was this frame's own body time. So a record mixing them read as "this frame took `gap` ms", when
the heavy work behind that gap may have been the *previous* frame's. The `surface` block makes the
error concrete: frame `i=482` has `js=138.2`, frame `i=483` has `gap=137.4` — the gap is the
*consequence* of the previous frame, and the old format could not say so.

**1.2. `worst` kept only the top 8 by `gap`.** A frame with the maximum JS but a normal gap never
appeared. `surface i=482` (`js=138.2`, `gap=4.3`) was invisible in the old JSON.

**1.3. `dw` was an umbrella.** In `28-loop` it wrapped `rackDraw(); drawWorld(); drawHitFx()`, so
"`dw` 13–15 ms" was never `drawWorld`'s cost. The report of stage 3 attributed it to `rackDraw`,
which was a guess, not a measurement.

---

## 2. How the frames are timestamped now

Each record carries: `raf` (rAF timestamp), `start` / `end` (`wallMs()` around the JS body),
`js` (`end − start`), `gap` (rAF-to-rAF interval), and — added in `nearFrame()` — `prevJs`,
`prevGap`, `prevRack` copied from the previous record. That makes the link explicit:
*this frame's JS* and *the interval that followed the previous frame* sit side by side.

`gap` is an **rAF interval**. It is not frame time and not GPU time. The field `dw`/`dwAll` is JS
time inside `drawWorld`; `gw.front/bloom/ov` is JS time preparing and submitting commands.

The three worst lists are now independent: `worstGap`, `worstJs`, `worstDw`, 8 frames each, plus
the full statistics (`gap`, `js` percentiles, `long`, `jsLong`, `work`) over all 240 frames.

---

## 3. CPU and rAF tables (near-run-04, headless, 240 frames per block)

| Block | prev | gap p50 | p90 | p95 | p99 | max | js p50 | p90 | p95 | p99 | max |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| system | — | 4.2 | 4.2 | 4.2 | 4.3 | 8.4 | 0.0 | 1.2 | 1.4 | 1.8 | 2.5 |
| landing | system | 4.2 | 8.3 | 8.4 | 16.8 | **854.2** | 0.0 | 3.1 | 8.4 | 10.7 | 25.5 |
| surface | landing | 4.2 | 4.2 | 4.3 | 8.4 | **137.4** | 0.0 | 3.2 | 3.6 | 6.9 | **138.2** |
| dig | surface | 4.2 | 4.2 | 4.3 | 8.4 | 37.5 | 0.0 | 3.4 | 4.2 | 8.1 | 40.2 |
| cave | dig | 4.2 | 4.2 | 4.3 | 8.1 | 8.4 | 0.0 | 2.9 | 3.4 | 5.2 | 8.9 |
| landing (warm) | cave | 4.2 | 8.3 | 8.4 | 12.5 | 20.9 | 0.0 | 4.0 | 7.9 | 12.7 | 23.8 |

`vis` is `"visible"` on **every** frame of every block — the tab was never hidden during the run.

---

## 4. Worst frames, both criteria

**By JS** (`surface`):

| i | js | gap | prevJs | prevGap | sw | gf | dw | hud | gp | wp | warm |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 482 | 138.2 | 4.3 | 0 | 4.2 | 1.8 | 0.1 | **128.8** | 6.9 | 0.2 | 0.2 | 0 |
| 483 | 8.7 | 137.4 | **138.2** | 4.3 | 0.9 | 0 | 6.7 | 0.8 | 0 | 0 | 0 |
| 486 | 6.9 | 4.1 | 0 | 4.2 | 0.4 | 0 | 6.1 | 0.3 | 0 | 0 | 0 |

**By gap** (`surface`): the worst is `i=483` with `gap=137.4` and `prevJs=138.2` — the gap belongs
to the heavy frame **before** it. `landing`'s worst gap is `i=245`, `gap=854.2`, with `js=8.3`: a
854 ms hole behind an 8 ms frame.

The `dig` block: `i=722` has `js=40.2`, `dw=36.4`, while `dg.frame` (the dig's own draw) is only
**5.5**. So ~30.9 ms of `drawWorld` in `dig` is not `dig3Frame`.

---

## 5. Causes, with status

| Observation | Status |
|---|---|
| `surface` 128.8 ms inside `dw` on the first surface frame (js 138.2) | **Cause identified**: the surface's first draw. `dw` = `drawSurface` that frame. |
| the following `gap` 137.4 | **Cause identified**: it is the rAF interval after that 138.2 ms frame — `prevJs=138.2`, `prevGap=4.3`. The old format could not show this. |
| `dig` `dw` 36.4 with `dg.frame` 5.5 | **Partially identified**: 5.5 is `dig3Frame`; ~30.9 lies in `drawWorldIn` outside `drawDig` — at `28-loop:451` the branch `sunDirSet(null)` for non-surface/landing modes, and `gpuWorld`. Not yet split between them. |
| `landing` `gap` 854.2 with `js` 8.3 | **Cause not established.** The tab was visible, the frame body took 8.3 ms. It sits between probe runs (`g11RunNear` awaits `sleep(3000)`), so the prime suspect is the probe's own inter-run gap, not the game — but that is a hypothesis, not proof. |
| `rackDraw` | **Not reproduced**: `rack` is 0 in every block of this run — the instrument rack was closed. The stage-3 "9 ms" figure is therefore **not confirmed**. |

The `gpuWorld` components (`gw.front`, `gw.bloom`, `gw.ov`) are 0 on every frame because they
measure JS command-recording only.

---

## 6. `rackDraw` and the dig, as measured

- `rack` = 0 in `system`, `landing`, `surface`, `dig`, `cave` — the rack was closed in this run.
- `dg.qual` = 0, `dg.ready` = 0, `dg.frame` = 5.5, `dg.over` = 0 on the dig frames.
- `dwAll` = `rack` + `dw` + `hit` to within rounding; on dig the 36.4 is `dw` (`drawWorld`).

---

## 7. Chrome Performance trace

**Not done in this stage.** The instrument (`?g11=near` + `near-run-04.json`) is now correct, but
a real visible-window trace for the five scenes, and the control run without diagnostics, are
still owed. Recorded here as an open item, not as a result.

---

## 8. Normal mode vs diagnostic mode

**Not measured yet.** Everything in this report is with `NEAR.on`; the diagnostic overhead
(240 frames buffered per block, one JSON POST) is unquantified against a silent run. Open item.

---

## 9. Confirmed, refuted, unexplained

- **Confirmed**: the rAF-gap/JS misattribution; the lost max-JS frame; `dw` being an umbrella.
- **Refuted**: "`drawWorld` in dig ≈ 15 ms" — `drawWorld`'s own draw (`dig3Frame`) is 5.5 ms; the
  13–15 came from `dw`'s umbrella. "`rackDraw` ≈ 9 ms" — not reproduced (rack closed, `rack`=0).
  "`gpuWorld`/bloom free" — **not proven either way**: `gw.*=0` is JS only.
- **Unexplained**: the `landing` 854.2 gap behind an 8.3 ms frame (probe suspected, not proven);
  the ~30.9 ms inside `drawWorldIn` on dig outside `drawDig`; the `surface` 128.8 first-draw cost
  is identified by *location* but its internal split (terrain vs. plants vs. lights) is not yet
  measured.

**This stage changed the meter, not the game. No performance claim here rests on a fixed number.**
