# Handoff: smoothness task (qa-1014, 14.10.2026)

Branch `qa-1014` (worktree `C:\Claude\drift-qa`, from planet-main). All commits local, nothing pushed.
Gates were green at `d705dbbd`: `test.ps1` and `test.ps1 -Full` (1620 asserts, vision clean).
Rules still standing: one cause = one English commit, no push/merge, never open drift-game.ru or /dev,
no dev.ps1, sha256 of `docs\*.py`, `docs\look\game\*`, `docs\*.ps1` equal before/after, stop at 5-hour 80 %.

## Commits
- Playtest fixes: 75c2640d (СТРОЙКА tab button), 2f1a3104 (stale tab-lock save), 1c77844b (suit failure
  clears G.cave), 3f192681 (stWalletSync, hard-landing line), c21838da (base entry hint, BORT board).
- Detectors/perf: c024a918 + 5dddfb7f (rest frame not blinking while camera catches up / scene cut),
  50fd1046 (base frame 5 -> 3 submits).
- Forks (Disputed in PATCHNOTES 0.494.0, 561a273a): 1646701a (no raiders for unarmed ship, danger < .1),
  e7449d1b (jump over the tank is grey: «НЕ ХВАТИТ ТОПЛИВА: 48 из 30»), e3ebec9c + 9ca4b619 (tests only:
  corona cap 45 %, dock peek), d705dbbd. Docs: 4001ed56, 2953aa93. Cherry-picks: bb66361c, 9b817b08, 43cbd45b.

## The task (author's hard rule: fix loads with CODE, never cut graphics)
Allowed: precompute on approach/idle, build by frame budget, cache, warm pipelines before entry, reuse
buffers, drop rebuilds by signature, move heavy work out of the frame. Forbidden: density, distance,
shadows, quality, tier. Merge `lab-local` first (fa31bc21 + f11d63bb: surface content computed in
startLanding via surfGen -> G.land.pre, full flora re-seat 1 -> 0 on touchdown; plus lab and hunt).
For each transition (takeoff/landing, dock/undock, jump, cave/mine/base/home/cantina entry, map and
station screens, day change) measure the worst frame at entry and over 30 frames after, real clock
(`docs/look/game/cost.py` with `js=`, g11; never `--virtual-time-budget`). Gate: no frame > 2x median,
PC and s23 window. Report: transition · worst before · after · fixed by.

## Known tails
- Home-in: 4 submits/frame, `src/29d-home-draw.js:73-79` runs a separate encoder + submit to clear emit.
- Scoop: first bake of the giant takes 312 ms (Control's number; re-measure).
- Base scene is 3 submits/frame now (720/s); other scenes not counted yet beyond `F2-scenes.md`.
- Not covered by the playtest: swarm, captain, HQ, Сорока under pressure.
- Lab found a state leak: key «стойка: плашка не поверх тела · плашка в последней трети ширины: x=950».
  Green in order, red under `node --full --shuffle` — a suite leaks state into the cantina rack scene.
  Key is in `C:\Users\Drew\drift-data\site\lab\errors.txt`. Not fixed, not investigated.
- Open design notes (not asked): wreck still gives fuel 30 and a move to radius 1600 for free; passive
  hull regen `+.012/frame` with tech «dock» (`src/17-mode-system.js:145`) heals above 45 % without a station.

## Where the numbers are
Repo: `docs/playtest-2026-10-14/` (MASTER.md rows 1-23, F-speed.md, F2-scenes.md, G-geom.md).
Scratchpad of the QA session (outside the repo, may vanish):
`C:\Users\Drew\AppData\Local\Temp\claude\C--Claude\652f0121-7497-416b-a049-a50b96397e34\scratchpad\`
— `qa-scenes2.mjs` (submits per scene by stack), `qa-chip.mjs`, `qa-brake.mjs` (CDP + mobile 390x844).

## Gotchas
Heredoc eats backslashes; CRLF files keep their endings; node needs `C:/` paths; tests.html needs
`build.ps1` after a test edit; headless rAF ~240 Hz; built-in browser pane is 0x0 until resized;
generated `docs/INDEX.md`, `docs/TESTMAP.json`, `drift.html` are restored with `git checkout` before commits.
