# Ship «tools» — G13 in the cloud

Branch `claude/gpu-tools`, from the fleet base `claude/optimistic-gates-u46osn`. Zone: `test.ps1`,
`docs/mkshots.ps1`, `docs/mksiteshots.ps1`, `tests/90-harness.js`, `tests/90a-tools.js`, new files
under `docs/`/`tools/`. Machine: 4 CPUs, Chromium 141 (`/opt/pw-browsers/chromium`), pwsh 7.6,
`DRIFT_GPU=swiftshader`.

## Commits

1. **test.ps1 runs on Linux.** A platform block after `param`: `$onLin` (pwsh ≥ 6 and not
   Windows), `$psh` (`pwsh` on Linux, `powershell` at home) for the nested build/test calls, and
   `TEMP`/`NUMBER_OF_PROCESSORS` filled from .NET when the OS does not set them. Chrome found at
   `/opt/pw-browsers/chromium`, `/usr/bin/chromium`, `/usr/bin/google-chrome` (Linux only); the
   `file://` URL and the profile dir built with `/`; a hung shard killed with `pkill -f <profile>`
   instead of `Win32_Process`. GPU flags: `--enable-unsafe-webgpu` on Linux or under
   `DRIFT_GPU=swiftshader`, plus the `SWIFTSHADER` list **read from `docs/shot.py`** at run time
   (one source; the script throws if the list is gone). Windows without `DRIFT_GPU`: every new
   branch is a no-op — same Chrome paths, same URL, same profile string, same argv, same kill.
   Verified here: the default tier (Node 16 888 green + the Chrome smoke, 28 s), and the kill path
   (`-Browser -ShardSec 20` → both shards named, killed, red verdict, no stray Chrome).
2. **mkshots and mksiteshots shoot through docs/shot.py.** New `docs/shotstand.py`: loads
   `shot.py` as a module (like `vetshot.py`) and builds each page with its `page_for()`, but with
   the tail of any stand `.ps1` (`$add = @'…'@`) instead of mkview's — so Chrome, the GPU flags,
   the stepped clock, the device wait and the blocked URLs stay in `shot.py`. `--grab JS` saves a
   `data:` URL the page returns instead of a screenshot. `mkshots.ps1 -Shoot [-Only a,b]` calls it
   (no stand server, no `--disable-gpu`); scene errors now also go to the console, since the stand
   overwrites the `ERR` title. `mksiteshots.ps1` rewritten: `siteSettle()` (240 update steps, HUD
   off) as `--js`, `siteShot()` draws one frame with `drawWorld()` and reads `GPU.cv` in the same
   task (the invisible `#c` holds only the 2D layer now), crops 16:9, returns 1600×900 webp.
   Parse-checked at this commit; scene-by-scene results below once shot.
3. **`docs/pair.py` — a before|after pair in one command** (the coordinator's ask, 25.09):
   `python3 docs/pair.py <scene> [scene…] [--before REF] [--out-dir D] [--js …]`. «before» is
   `drift.html` built in a git worktree of `--before` (default the fleet base; cached per commit
   in the temp dir as `drift-pair-<sha>`, so the second pair costs no build), «after» is this tree
   (built first unless `--no-build`). Both sides are shot by this tree's `shot.py` with the page
   taken from the other tree (`shot.ROOT` swapped in a child process), same mkview scene, seed and
   stepped clock, 760×475 DPR 1, in parallel; the sheet is composed by headless Chrome over CDP
   (no PIL on this machine), labels «до · <ref> <sha>» / «после · <head>[+changes]». Unknown
   options go to shot.py for both sides. Measured: `system`, 615 s wall for the pair while three
   test shards shared the 4 CPUs (the frames alone were ~170 s each when the machine was idle, per
   CLOUD.md). Worktrees stay in the temp dir; `git worktree prune` after deleting them.
4. **Harness: a GPU tripwire and the device state at start** (`tests/90-harness.js`). The run is
   synchronous: when `gpuDrop` fires mid-run its `gpuInit` retry cannot come back before the
   report, and every later suite reads a dead device — on SwiftShader one shard of three showed a
   dozen unrelated-looking failures («кадр пуст», «видеокарта есть — без неё ворота не меряются»).
   Now `gpuDrop` is wrapped to keep its reason (`crashShip` is silent under TEST), and a suite
   during which `GPU.ok` went from true to false gets one extra failure naming itself and the
   reason. The report also gets a line «видеокарта к старту: …, конвейеры …» after the failure
   and quarantine blocks (not before: `test.ps1` reads failures from line 2). Node: no-op.

## The browser tier on SwiftShader (measured 25.09, 4 CPUs, Chromium 141)

| Run | Result | Wall |
|---|---|---|
| default tier (`test.ps1`): Node + Chrome smoke | green: 16 888 Node checks, the smoke suite 5/5 with `GPU.ok` | 28 s (Node 18 s, smoke 4.7 s) |
| `-Only "инструменты: руки и глаза…"` (one picture suite) | green, 35/35; «видеокарта к старту: есть» | 25 s |
| `-Browser` (2 shards by default, cap 900 s) | **did not finish**: both shards killed at 900 s after ~810 suites; the kill path named the hung suites correctly | 900 s |
| `-Browser -Jobs 3 -ShardSec 3600` | shard 3/3 **finished in 26 min**: 288 suites, 5 230 passed, **13 failed** (below); shards 1/3 and 2/3 still grinding after 35 min in «прогоны: двенадцать путей игрока ботом…» and «детерминизм: рисованный кадр…» when the fleet was called home — killed | 26–35+ min |
| `-Full`, `-Mobile` | not run — no time left | — |

Nothing hangs for real: the GPU processes sat at ~200 % CPU throughout. A drawn and read-back
frame costs ~0.5–1 s on SwiftShader at 1280×800, and a few suites draw thousands of them. Per
suite (wall, from the «→ name» lines in Chrome's log; 831 suites timed over the two runs):

    1115 s  сквозной: сцены × пять жестов под детекторами           ← one suite is a third of the tier
     260 s  пещера M305: обвод без углов, кости, верёвки, стоянка
     221 s  изготовитель M369: порода читается силуэтом и краской
     134 s  пещера: человек не сжимается при спуске
      90 s  растр: грунт и свод рисуются ломтями
      84 s  свет: у звезды и у фонаря яркость падает с расстоянием
      65 s  сквозной: из любой сцены сейв пишется, читается…
      30 s  экраны M299 · 13 s M317 · 11 s стенгазета · 8 s косметика … — all the rest under 8 s,
            most well under 1 s
    >30 min детерминизм: рисованный кадр не сдвигает случай мира  (unfinished, 100 drawn frames × every look scene)
    >30 min прогоны: двенадцать путей игрока ботом                (unfinished)
    >9 min  руки: кнопка над миром отвечает кадром                (unfinished in the 2-shard run)

The 13 failures of shard 3/3 — **findings, not fixed, not weakened**:
- «изготовитель M369: порода читается на 88.7 % (нужно 90)» — a picture reason (the maker grammar
  reads worse on SwiftShader, or reads worse, full stop); needs a real-GPU check.
- «эффекты M325: хроматика…» (4 checks: «кадр видеокарты собран» false, fringes 0/0),
  «инструменты: подпись кадра не чёрная», «кадр системы: вызовов канвы 1», «сквозной: сцены × пять
  жестов… кадр пуст: разброс яркости 0.0», «ворота ступени 1/2 · видеокарта есть» ×3, «слой #ovl ·
  видеокарта есть», «станция: знак дома… GPU-холст: нет «текст без видеокарты»» — all read like a
  dead or not-yet-drawing device, and the «видеокарта есть» ones prove `GPU.ok` went false
  mid-run. The same «инструменты» suite is green alone. Commit 4's tripwire will name the suite and
  the `gpuDrop` reason on the next run; it was built after this run and not yet run at scale.
- Chromium 141 logs «Noise was added to a canvas readback» a few times per shard (canvas
  fingerprint noise). A plain 2D readback here was exact; whether noise touches a suite is
  unproven. If a pixel suite flakes on Linux only, try `--disable-features=CanvasNoise` first.

`--virtual-time-budget=20000` with WebGPU: harmless for the suites themselves (the run is
synchronous, virtual time stands still inside it), but `99-run.js`'s boot waits for `GPU.ok` and
`GPU_PIPES.done` only 14 000 *virtual* ms — about 3 s of real time by its own comment. On an idle
machine that was enough here; under three Chromes it may not be (see requests).

## How Контроль runs this at home (Windows, real GPU)

- Browser tier: unchanged — `powershell -ExecutionPolicy Bypass -File test.ps1 -Browser` / `-Full`.
  Without `DRIFT_GPU` nothing new is added to Chrome's command line. The report now carries
  «видеокарта к старту: …» and, if the device drops, one failure naming the suite and the reason.
- main|gpu pairs: `python docs\pair.py system cave --before origin/main --out-dir C:\tmp\pairs`
  (builds `origin/main` in a cached worktree under `%TEMP%`, the current tree as «after», both shot
  by this tree's `docs/shot.py` on the real GPU; one 1528×501 sheet per scene). Delete the
  worktrees from `%TEMP%` when done, then `git worktree prune`.
- Album: `docs\mkshots.ps1 -Shoot [-Only a,b]` and `docs\mksiteshots.ps1 [-Only home,sys]` — no
  stand server any more.
- In the cloud the same commands with `pwsh ./test.ps1 …` and `python3 docs/pair.py …`; give a
  `-Browser` run `-ShardSec 7200` and expect an hour or more.

## CI proposal for `.github/workflows/deploy.yml` (not edited — outside every zone)

The runner (ubuntu-latest) has `pwsh`, `google-chrome` and no GPU. Replace the two
`google-chrome … --disable-gpu …` smoke calls with the same test.ps1 path the cloud uses, on
SwiftShader, so CI tests the game and not the «нет WebGPU» stub:

```yaml
      - name: "Автотесты: Node и дым в Хроме (WebGPU на SwiftShader)"
        env:
          DRIFT_GPU: swiftshader      # test.ps1 reads the flag set from docs/shot.py
        run: pwsh ./test.ps1 -NoBuild # Node tier + the «игра запустилась сама» smoke, ~30 s
```

and for the «загрузка без Uncaught» step, add the flags from `docs/shot.py` (`SWIFTSHADER` plus
`--enable-unsafe-webgpu`) instead of `--disable-gpu`. Keep the browser tier out of CI: at an hour
plus on 4 CPUs it belongs to a nightly job or the lab, not to each push. Lines 195/209 (live-site
checks) can stay `--disable-gpu` — they only read `data-alive`, which the stub also sets — or take
the same flags if the author wants the live world checked; that needs the runner to reach the site.

## Requests for files outside my zone

- `tests/99-run.js` (boot): wait for `GPU_PIPES.done` by real time, not 14 000 virtual ms — e.g.
  spin with `setTimeout(…,0)` (no virtual time consumed) up to ~60 s of `wallMs()` under
  SwiftShader. Or have `test.ps1` pass a `?gpuwait=` the boot reads.
- `tests/91zzzzzbb-samehash.js`, `91zzzzzzz-hands.js`, the «сквозной: сцены × пять жестов» net and
  «прогоны: двенадцать путей»: fine on a real GPU, 20–60 min each on SwiftShader. If the cloud
  should run `-Browser` routinely, give them `tier:"heavy"` (they then run under `-Full` only) or a
  frame budget under `window.__SOFT`-like detection — the suites' owners decide; I did not touch them.
- `docs/CLOUD.md`: «test.ps1 looks for Chrome only at Windows paths» and the mkshots line are now
  stale; point to this file.
- `.github/workflows/deploy.yml`: the CI proposal above.

## Open problems

- The tripwire (commit 4) is unrun at scale: the next `-Browser` run in the cloud should say which
  suite drops the device, and why.
- `pair.py`: two shots of byte-identical game code differed in one label («ЦИЦИН · 2043» vs
  «2044», the planet distance) — a small nondeterminism in the stand (the scene is set on a real
  timer before stepping starts). Harmless for eyeballing, fatal for a pixel diff.
- `mkshots -Shoot` and `mksiteshots` through `shotstand.py` were only parse-checked; not a single
  scene was shot before the fleet was called home. The previous `--disable-gpu` route is gone, so
  the first real run must be watched (`home`/`rooms` run 240 manual update+draw pairs in the tail).
- `-Full` and `-Mobile` on SwiftShader: not measured.

Evidence (scratchpad, not in git): `browser-j2.txt`, `browser-j3.txt`, `durs-j3.txt`, `durs.py`,
`pairs/pair_system.png`.
