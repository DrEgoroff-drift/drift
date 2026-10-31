# Frame pacing — findings (2026-11-01)

## Environment (verified via CDP `Browser.getVersion` + `SystemInfo.getInfo`)

| | |
|---|---|
| Chrome | 156.0.8078.76 (`HeadlessChrome/156.0.0.0`) |
| Mode | `--headless=new` |
| OS | Windows NT 10.0.26200 (Windows 11) |
| GPU backend | `ANGLE_D3D11`, `directComposition: true` |
| Devices | NVIDIA GeForce RTX 5070, AMD Radeon(TM) Graphics, Microsoft Basic Render Driver |
| featureStatus | `gpu_compositing: enabled`, `rasterization: enabled`, `webgpu: enabled`, `skia_graphite: disabled_off` |

Launch flags for the baseline run: `--headless=new --no-sandbox --window-size=1280,800
--force-device-scale-factor=2 --user-data-dir=<temp> --no-first-run --no-default-browser-check
--disable-background-timer-throttling --disable-renderer-backgrounding
--disable-backgrounding-occluded-windows`.

## Trace

`Tracing.start` with `devtools.timeline, disabled-by-default-devtools.timeline,
disabled-by-default-devtools.timeline.frame, viz, gpu, cc, benchmark, toplevel`;
`?g11` run; 20.3 s; **1 808 663 events**, 374 MB — kept at `%TEMP%\drift_trace.json`
(too large for git; re-record with `%TEMP%\drift_trace.py`).

### Steady-state gaps (first 4 s dropped — page load)

| stage (thread) | n | p50 | p90 | p99 | max | gaps > 16.7 ms |
|---|---:|---:|---:|---:|---:|---:|
| `BeginFrame` (Compositor) | 3700 | 4.17 | 4.19 | 4.28 | 975 (load) | 1 (0.0 %) |
| `ProxyMain::BeginMainFrame` (CrRendererMain) | 3563 | 4.16 | 4.31 | 8.76 | 1139 (load) | 7 (0.2 %) |
| `Commit` (CrRendererMain) | 3581 | 4.16 | 5.51 | 11.95 | 969 (load) | 9 (0.3 %) |
| **`DrawFrame` (Compositor)** | 2200 | 4.21 | **16.64** | **19.28** | 1134 (load) | **204 (9.3 %)** |
| `Graphics.Pipeline` (Viz/Gpu) | 30178 | 0.07 | 3.03 | 3.91 | 968 (load) | 6 (0.0 %) |

## What it means

- **The BeginFrame scheduler is not the cause.** `BeginFrame` is a metronome: p99 = 4.28 ms,
  one gap > 16.7 ms in 20 s (the load).
- **The renderer's main thread is not the cause either.** `BeginMainFrame` is p50 4.16 / p90 4.31;
  only 7 long gaps.
- **The compositor's `DrawFrame` is the irregular stage:** p90 = 16.64 ms, p99 = 19.28 ms,
  **204 gaps > 16.7 ms (9.3 %)**. `DrawFrame` fires **2200 times vs 3700 BeginFrames** — the
  compositor only reaches the draw on ~60 % of the BeginFrames, i.e. the *presented* rate is
  ~120 Hz while rAF reports ~240 Hz.
- **GPU work is small** (`Graphics.Pipeline` p99 3.91 ms, 6 gaps > 16.7 ms) — the GPU does not
  run out of time.

So the frames are lost between **BeginMainFrame → Commit → DrawFrame**, on the compositor side:
the compositor throttles/skips the draw (`ShouldThrottleSendBeginMainFrame` appears 8913 times),
and the presented cadence falls back to ~60 Hz in bursts (the 204 long gaps cluster in bursts of
16.7–20 ms, not isolated).

## Limits of this run

- The real-window run did **not** produce a `g11` POST from this environment (the window never
  reached the foreground, so rAF stayed paused). Headless-only conclusion so far.
- The 33–79 ms rAF gaps are rare (≈0.2–0.3 % of frames); the trace caught 7 (`BeginMainFrame`)
  and 9 (`Commit`) > 16.7 ms, but the 204 compositor gaps are the bulk of the lost frames.
