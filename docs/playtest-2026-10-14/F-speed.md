# F-speed · 2026-10-14 · v0.494.0 · http://127.0.0.1:8815/drift.html · real GPU nvidia/blackwell · headless Chrome 155 · port 9606

Method: own CDP script (scratchpad `qa-speed.mjs`). ЛЁГКИЙ СТАРТ click, then 5 min real clock. GPUQueue.submit wrapped, counted per 3 s window by G.mode + top 3 named frames. rAF deltas, long = over 16 ms. Heap via HeapProfiler.collectGarbage + Performance.getMetrics. Planet: `docs/look/game/cost.py terran pc` (run as documented).

Reached by the player path: **system only**. Not checked: map, dock/station, cantina, HQ, hall, cave, belt, surface (player path).

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | system, after ЛЁГКИЙ СТАРТ | 3 GPUQueue.submit per frame, one each from h3dRun<bodyRun<bodyStation, h3dRun<h3dDraw<hullGpuDraw, gpuPresent<frameBody<frame | 13 windows of 3 s: 180–183 submits/s, 60/s per stack | src/17c2g-body-station.js:131; src/17c2e-body-kit.js:34; src/17c2a-hull3d.js:369; src/17c2-hull-gpu.js:185; src/08b-gpu.js:675; src/28-loop.js:445 | low | tech: 3 submits per frame; their cost not measured here |
| 2 | system | long frames over 16 ms (rAF delta) | 0–2 of ~720 per window; max 20.8 ms at 122 s, 16.7 ms at 286 s; mean 4.17 ms | src/28-loop.js:642 | low | tech: headless rAF runs at ~240 Hz, so this shows stalls only, not fps |
| 3 | system, first seconds after load | one 967 ms rAF gap | run 1 only (window 2.2–5.2 s): "max 966.8, long>16 2"; runs 2 and 3 max 10.3 and 4.4 ms | src/15-input.js:609 (startEasy, gpuAfterWarm) | low | tech: not reproduced; cause not diagnosed |
| 4 | system, JS heap | used 5.8 MB at title, 10.3 MB after start, 27.4 MB at 1 min, 28.2 MB at 5 min | GC before each read; +1.0 MB from min 1 to min 5, flat | src/15-input.js:632 (start) | low | tech: the 10→27 MB jump in minute 1 not diagnosed; no growth trend after it |
| 5 | planet pc, terran lake (cost.py) | GPU frame 1.57 ms (sum 1.53): scene 1.08, air 0.21, mirror 0.14, shadow 0.07, rest under 0.02 | CPU 0.58 ms/frame after first; first frame 2755 ms wall; 3.54 M tris, 1049 calls, 42296 recs | docs/look/game/world.py (its snippet calls enterSurface) | low | design: planet frame well under 16.7 ms at pc; the snippet bypasses the player path |

Verdict (cost.py only): planet at pc is fast on this GPU, 1.57 ms GPU per frame. Scene verdicts for system and the rest are not judged; counts only.

Not checked: map, dock/station, cantina, HQ, hall, cave, belt, surface by player path. The easy start stays in system with no autopilot target, and tap-to-target was not automated.

Notes:
- Tooling: `window.G` is undefined because G is a top-level `const` (src/08-state.js:207). Read bare `G` after `typeof G!=="undefined"`.
- Deviations: cost.py ran on port 9606 through `qa-cost.py`, which adds `port=9606` to gshot (default 9461). shot.py's profile is %TEMP%\drift-shot-9606, not qa-chrome-F. shot.py loads the same drift.html over file://, not the 8815 URL. Frames went to scratchpad via PLN_SHOTS.
- Chrome: no processes of mine left (count 0). Writes: this file only. No edits to src/, tests/, drift.html, docs/*.py, docs/look/game/*.
- Time: about 30 min wall, over the ~25 min limit (5 min of it was the heap run).
