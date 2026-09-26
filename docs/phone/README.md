# Phone gate tools

These tools measure a LOCAL copy of the build on the author's S23 over Wi-Fi adb. The author's save and the live
site stay untouched. Every tool takes `--port N` (required) and `--out DIR` (default `%TEMP%\drift-phone`); see `phcommon.py`.

Before a run:

1. Take the lock: `C:\Claude\phone.lock` holds one line with who has the phone and since when. If a lock already
   exists, the phone is busy. Delete the lock when you are done.
2. Serve the build: copy `drift.html` to `<dir>\<name>.html`, then run `python -m http.server <port> --directory <dir>`.
3. The phone must be cold and off the charger. A cold shader cache means a fresh host each run:
   `gate.py <name> 30 cold7.localhost --port <port>`. Chrome keeps compiled pipelines per site.

| Tool | What it does |
|---|---|
| `gate.py name secs [host]` | The P1 gate: easy start, DPR 1.5, a driven flight. It records every rAF interval and prints 10-s windows and a verdict: at least 95 % of frames ≤ 18 ms and no frame ≥ 50 ms. It also names hitches, textures and mips. |
| `waitquiet.py name [secs…]` | Waits until the touchscreen has been silent for 60 s, then runs `gate.py` for each length (default 30 and 300). |
| `phtrace.py name secs` | Records a Chrome trace of the same flight to `phtrace_<name>.json`. |
| `phtran.py trace [gap_ms]` | Shows what every thread did in each long frame gap, plus the compile slices. |
| `phgap.py trace t1-t2…` | Lists nested slices in the given windows. |
| `tickhist.py trace` | Per second: frames, 2D FinalizeFrame calls and rate-limiter ticks. |
| `deep.py name [query]` | Runs the phone-side `?g11=deep` probe. |
| `census.py name` | Counts the 2D canvas draw calls made in flight, by caller and state. |

`cdp.py` lives in `docs/night-2026-09-13/raw/phone-tools/`.
