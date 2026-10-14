# Playtest 0.494.0 - 14.10.2026 (branch qa-1014, local)

Wave: six Haiku testers (A shell, B station, C flight/map, D ground, E start/combat, F speed) + vision by numbers (G). Every crit/high was re-checked in code by the lead. Baseline gate was green; `test.ps1 -Full` green after the fixes (1585 asserts, vision clean).

| # | Area | Finding | Status | Where |
|---|---|---|---|---|
| 1 | station | СТРОЙКА tab had no button in the tab row - the build screen was unreachable (high) | fixed 75c2640d | src/index.html |
| 2 | save | older tab resumed writing after the newer tab closed and overwrote the newer save with stale state (UI scale 1.25 came back) (high) | fixed 2f1a3104, suite 91a2 | src/14a-cloud.js |
| 3 | cave | suit failure by a bite in the cave left G.cave set in surface mode (med) | fixed 1c77844b | src/23-mode-dig.js suitFailure |
| 4 | surface | wall and inspected stone masked a deposit prompt (carried over) | fixed 1e0880c0, suite 91a7 (on bugs) | src/21-mode-surface.js |
| 5 | flight | at 1024x768 compass chip over the zoom button: tap lands on `#zin`; chip placement falls back to its ideal spot when no free spot exists | open, not reproduced locally | src/17-mode-system.js (~1000, `if(!spot)`) |
| 6 | surface | base offer hidden while a scannable organism is near the ship (prompt chain order) | open, design | src/21-mode-surface.js:598 vs :613 |
| 7 | surface | BORT panel clips base life rows | open | src/21ac-base-draw.js:610 |
| 8 | menu | settings only inside the menu in game; scale does nothing at 390 without a hint | open, design | src/27-ui-ship.js:363 |
| 9 | station | board "НА КАРТУ" leaves the dock without ОТСТЫКОВКА; label twice (med) | open, design | board tab |
| 10 | start | flying into the star's corona and back in loops wreck -> repair every ~5 s; the player drives it, repair is free | open, design | src/17-mode-system.js:282, src/28-loop.js:16 |
| 11 | log | G.log keeps 160 lines, a wreck loop evicts the start of the run | open, low | src/11-log.js:11 |
| 12 | speed | system: 3 GPUQueue.submit per frame (~180/s); long frames 0-2 per 3 s, max 20.8 ms; heap flat 27-28 MB from 1 to 5 min; planet pc (cost.py): GPU 1.57 ms, CPU 0.58 ms. Other scenes not reached by player path | info | docs/playtest-2026-10-14/F-speed.md |
| 13 | ui | vision: 0 violations in 17 windows; 2000x1000 not in the window set | info | G-geom.md |

Not reached by anyone: lab/shipyard buy, HQ, refuel, Сорока, belt, captain, swarm, pirate fire, jump continuation after reload, raid, winter, spa.
Design list for the author (not touched): armed start hull vs pirates at 2100 u, endless drift without brake, 3-sector jump = 48 fuel vs tank 30.
