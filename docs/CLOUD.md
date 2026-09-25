# Working in Claude's cloud

A Claude Code session on the web runs in a fresh Ubuntu 24.04 container (here: 4 CPUs, 16 GB),
with no video card and no PowerShell. `.claude/hooks/session-start.sh` makes it able to build,
test and draw the game. It runs only in cloud sessions (`CLAUDE_CODE_REMOTE=true`) and is silent
at home:

- installs PowerShell 7 from packages.microsoft.com when `pwsh` is missing — `build.ps1` and
  `test.ps1` are PowerShell, and the GitHub runner builds the same way;
- `git config core.hooksPath .githooks` — the big-binary guard, the one config CLAUDE.md allows;
- exports `DRIFT_GPU=swiftshader`, which switches `docs/shot.py` to the software adapter.

## What works (measured 25.09 on `claude/base-gpu` ae410a3)

| Step | Command | Result |
|---|---|---|
| build | `pwsh ./build.ps1` | 5 s; `drift.html` byte-identical to the committed one |
| fast tier | `node test-node.js` | all green: 16 888 passed, 676 suites of 934, 31 s (Node v22 here, v26 at home) |
| a frame | `python3 docs/shot.py system --w 760 --h 475 --dpr 1 --out /tmp/x.png` | 170 s; the right picture — nebula and dust, the galaxy landmark, the ship, a planet — 0 validation errors |

`build.ps1` also rewrites `docs/INDEX.md` and writes `tests.html`: never commit them from a
branch that others merge — the integrator rebuilds.

## WebGPU without a video card

Chromium is Playwright's, pre-installed: `/opt/pw-browsers/chromium` (141). WebGPU runs on
SwiftShader, Vulkan on the CPU, with this flag set (`docs/shot.py` adds it when
`DRIFT_GPU=swiftshader` or `--gpu swiftshader`):

    --use-angle=swiftshader --enable-features=Vulkan --use-vulkan=swiftshader
    --use-webgpu-adapter=swiftshader --no-sandbox

`--use-angle=swiftshader` is the key. Without it the adapter exists and the game starts, but the
canvas swap chain finds no shared-image backing — Chrome logs `Could not find
SharedImageBackingFactory … WebgpuSwapChainTexture` — and the device is lost 1.5–4 s into
flight. Four flag sets out of six failed that way, including the one first tried in the pilot.
`--no-sandbox` is there because the container runs as root.

**Speed.** About 0.5–1 frame a second at 1280×713 on the page's own clock. That is enough to shoot
a whole-frame pair, never to measure one: cadence and milliseconds are measured on the author's
laptop and the S23 only. On SwiftShader the stand in `docs/shot.py` waits for
`queue.onSubmittedWorkDone()` between steps — stepping ahead queued minutes of frames and the
screenshot timed out.

**Never add `--disable-vulkan-surface`.** It doubles the speed, and the world comes out a white
haze behind a correct HUD — both on the wall clock and on the stand's stepped clock. Without it
the frame is right: the nebula, the lit planets, the galaxy landmark, 0 validation errors in the
twenty `mkshots` scenes (1280×720, 17–41 s a scene with loading; `base` drew 3 frames in three
minutes and `home` never finished — the heaviest rooms are the slowest here).

## What does not work yet

- `test.ps1` looks for Chrome only at Windows paths: in the cloud run `node test-node.js`
  directly. The browser tier (`-Browser`, `-Full`, `-Mobile`) on SwiftShader is G13 work.
- `docs/mkshots.ps1` and `docs/mksiteshots.ps1` launch Chrome with `--disable-gpu` and get the
  «нет WebGPU» notice: shoot with `docs/shot.py`.
- `drift-game.ru` is denied by the environment's network policy — and must not be touched from
  a cloud session anyway (live shared pools).
- No performance numbers: SwiftShader is a CPU.

## Branches

A cloud session pushes only to its own `claude/<name>` branch. `deploy.yml` skips `claude/**`,
so such a push never reaches `dev.html` and never cancels a `main` deploy. The porting fleet's
rules are in `docs/fleet/README.md`.
