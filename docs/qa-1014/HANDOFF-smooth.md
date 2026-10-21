# Handoff: smoothness task (qa-1014, 14.10.2026)

Branch `qa-1014` (worktree `C:\Claude\drift-qa`), local only. Gates green at `d705dbbd`
(`test.ps1`, `-Full`: 1620 asserts, vision clean). Rules: one cause = one English commit, no
push/merge, never drift-game.ru or /dev, sha256 of `docs\*.py`, `docs\look\game\*`, `docs\*.ps1`
equal before/after, stop at 5-hour 80 %.

## Commits
- Fixes: 75c2640d, 2f1a3104, 1c77844b, 3f192681, c21838da. Detectors/perf: c024a918, 5dddfb7f,
  50fd1046 (base 5 -> 3 submits).
- Forks (PATCHNOTES 0.494.0 «Disputed», 561a273a): 1646701a no raiders for an unarmed ship in the quiet
  ring; e7449d1b jump over the tank is grey with «НЕ ХВАТИТ ТОПЛИВА: 48 из 30»; e3ebec9c, 9ca4b619 tests.
- Docs 4001ed56, 2953aa93; cherry-picks bb66361c, 9b817b08, 43cbd45b (hunt, lab-local.py).

## Task (fix loads with CODE, never cut graphics)
Allowed: precompute on approach/idle, frame-budgeted build, cache, warm pipelines before entry, reuse
buffers, drop rebuilds by signature. Forbidden: density, distance, shadows, quality, tier.
Merge `lab-local` first (fa31bc21 + f11d63bb: surface content built in startLanding -> G.land.pre).
Per transition (takeoff/landing, dock/undock, jump, cave/mine/base/home/cantina, map and station
screens, day change): worst frame at entry and over 30 frames after, real clock
(`docs/look/game/cost.py` with `js=`, g11; never `--virtual-time-budget`). Gate: no frame > 2x median,
PC and s23 window. Report: transition · worst before · after · fixed by.

## Tails
- Home-in: 4 submits/frame; `src/29d-home-draw.js:73-79` has its own encoder + submit for the emit clear.
- Scoop: first bake of the giant 312 ms (Control's number; re-measure).
- Not covered: swarm, captain, HQ, Сорока under pressure.
- Lab leak: «стойка: плашка не поверх тела · плашка в последней трети ширины: x=950» — green in order,
  red under `node --full --shuffle`; key in `C:\Users\Drew\drift-data\site\lab\errors.txt`. Not touched.
- Design notes, not asked: wreck still gives fuel 30 + move to r=1600 free; passive hull regen with
  tech «dock» (`src/17-mode-system.js:145`) heals above 45 % without a station.

## Numbers
Repo: `docs/playtest-2026-10-14/` (MASTER.md, F-speed.md, F2-scenes.md). QA scratchpad (outside the
repo): `C:\Users\Drew\AppData\Local\Temp\claude\C--Claude\652f0121-7497-416b-a049-a50b96397e34\scratchpad\`
— `qa-scenes2.mjs` (submits per scene), `qa-brake.mjs` (CDP, 390x844 mobile).
Gotchas: tests.html needs `build.ps1` after a test edit; restore `docs/INDEX.md`, `docs/TESTMAP.json`,
`drift.html` with `git checkout` before commits; heredoc eats backslashes.
