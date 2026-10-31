# Frame pacing — findings (2026-11-01)

## Environment (verified via CDP `Browser.getVersion` + `SystemInfo.getInfo`)

| | |
|---|---|
| Chrome | 156.0.8078.76 (`HeadlessChrome/156.0.0.0`; windowed run is the same build) |
| OS | Windows NT 10.0.26200 (Windows 11) |
| GPU backend | `ANGLE_D3D11`, `directComposition: true` |
| Devices | NVIDIA GeForce RTX 5070, AMD Radeon(TM) Graphics, Microsoft Basic Render Driver |
| featureStatus | `gpu_compositing: enabled`, `rasterization: enabled`, `webgpu: enabled`, `skia_graphite: disabled_off` |

Baseline flags: `--headless=new --no-sandbox --window-size=1280,800 --force-device-scale-factor=2
--user-data-dir=<temp> --no-first-run --no-default-browser-check --disable-background-timer-throttling
--disable-renderer-backgrounding --disable-backgrounding-occluded-windows`.

## Trace (headless, 20.3 s, 1 808 663 events, 374 MB — `%TEMP%\drift_trace.json`)

Categories: `devtools.timeline, disabled-by-default-devtools.timeline, …timeline.frame, viz, gpu, cc, benchmark, toplevel`.

Steady-state gaps (first 4 s = page load, dropped):

| stage (thread) | n | p50 | p90 | p99 | gaps > 16.7 ms |
|---|---:|---:|---:|---:|---:|
| `BeginFrame` (Compositor) | 3700 | 4.17 | 4.19 | 4.28 | 1 (0.0 %) |
| `ProxyMain::BeginMainFrame` (CrRendererMain) | 3563 | 4.16 | 4.31 | 8.76 | 7 (0.2 %) |
| `Commit` (CrRendererMain) | 3581 | 4.16 | 5.51 | 11.95 | 9 (0.3 %) |
| **`DrawFrame` (Compositor)** | 2200 | 4.21 | **16.64** | **19.28** | **204 (9.3 %)** |
| `Graphics.Pipeline` (Viz/Gpu) | 30178 | 0.07 | 3.03 | 3.91 | 6 (0.0 %) |

`DrawFrame` fires 2200 times vs 3700 `BeginFrame` — the compositor reaches the draw on ~60 % of
the BeginFrames. `ShouldThrottleSendBeginMainFrame` appears 8913 times.

## Configuration matrix (same `?g11` scenario, DPR 2)

| # | config | fps | rAF p50 | p90 | max (worst scene) | long tasks |
|---|---|---:|---:|---:|---:|---:|
| 1 | headless (default) | 231–240 | 4.2 | 4.2 | 37 (system), 58 (landing) | 1–4, max 102 ms |
| 2 | headless + `--disable-gpu-compositing` | 60 | 16.7 | 16.7 | ~50 | — |
| 3 | headless + `--enable-gpu` | 226–240 | 4.2 | 4.2 | 37 (system), 75 (landing) | 1–4, max 102 ms |
| 4 | **windowed Chrome** | 229–240 | 4.2 | 4.2 | **46 (system), 58 (landing), 29 (raid)** | 2–4, max 96 ms |

## Probe-detached run (game alone, no `?g11`)

9 s trace of the game right after «начать» (system view), no probe in the page:

| stage | n | p50 | p90 | p99 | gaps > 16.7 ms |
|---|---:|---:|---:|---:|---:|
| `BeginFrame` | 2188 | 4.17 | 4.18 | 4.25 | **0 (0.0 %)** |
| `ProxyMain::BeginMainFrame` | 2150 | 4.16 | 4.33 | 7.30 | 2 (0.1 %) |
| `Commit` | 2150 | 4.18 | 5.58 | 9.37 | 3 (0.1 %) |
| **`DrawFrame`** | 541 | **16.65** | 17.56 | 21.86 | **245 (45.4 %)** |
| `Graphics.Pipeline` | 12473 | 0.08 | 3.74 | 3.97 | 2 (0.0 %) |

The long `DrawFrame` gaps (17.6 ms mean) sit on **24.9 ms of main-thread `RunTask` over ~88
tasks**; the GPU does 3.7–4.0 ms. So even with the probe gone the **game's own main thread
saturates the frame**, while BeginFrame is a metronome and the GPU is idle. Caveat: this run is
the game's first ~13 s (the first-hour intro), where the DOM/text work is heaviest — it is not
the steady-state 240 fps the `?g11` steady window shows.

## Conclusion

- **The BeginFrame scheduler is not the cause** (p99 4.28 ms). **The GPU is not the cause**
  (`Graphics.Pipeline` p99 3.91).
- **The compositor's `DrawFrame` is where frames are lost**: p90 16.64 ms, p99 19.28 ms,
  204 gaps > 16.7 ms (9.3 %), 2200 draws for 3700 BeginFrames.
- **Why**: the flame breakdown of the long-gap windows shows the **game's JS (`FunctionCall`) at
  571 ms over 1051 calls — 0.54 ms/frame**, and the `CrRendererMain` busy only ~17 % of the time.
  (The earlier 37.6 ms figure summed `RunTask` across *all* threads, including the IO/compositor —
  corrected here.) The GPU does 3.7–4.0 ms. So **neither the main thread nor the GPU is
  saturated**: the compositor simply **presents at ~60 Hz (`DrawFrame` p50 16.65) while rAF runs
  at ~240 Hz** — the rAF number is 4× the presented number, which is exactly the trap the brief
  warns about.
- **The jank is NOT headless-only**: the windowed Chrome shows the same 240 fps rAF with the same
  stalls (max 29–58 ms) and the same long tasks (max 96 ms). Config 2 (software compositing) is
  60 Hz by construction — a different ceiling, not a fix.
- Note: part of that main-thread load is the probe's own mode switching (the 96–102 ms long
  tasks); the contrast between long and short gaps holds regardless, so the mechanism is real,
  but its *game-only* share needs a run with the probe detached (see Next steps).

## Limits

- `FramePresented` / `FrameSequenceTracker` / `Graphics.Pipeline.DrawAndSwap` / `WaitForSwap` are
  **not present by those names** in Chrome 156's trace; the equivalents used here are
  `BeginFrame`, `ProxyMain::BeginMainFrame`, `Commit`, `DrawFrame`, `Graphics.Pipeline`.
- The windowed run took ~72 s (the probe's modes are slower at the display's own pace); it did
  POST once given time.
- The long tasks (96–102 ms) are the probe's own mode switches, not gameplay — they are recorded
  separately so they never masquerade as a game frame.
