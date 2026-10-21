# Playtest 0.494.0 - 14.10.2026 (branch qa-1014, local)

Wave: six Haiku testers (A shell, B station, C flight/map, D ground, E start/combat, F speed) + vision by numbers (G). Every crit/high was re-checked in code by the lead. Baseline gate was green; `test.ps1 -Full` green after the fixes (1585 asserts, vision clean).

| # | Area | Finding | Status | Where |
|---|---|---|---|---|
| 1 | station | СТРОЙКА tab had no button in the tab row - the build screen was unreachable (high) | fixed 75c2640d | src/index.html |
| 2 | save | older tab resumed writing after the newer tab closed and overwrote the newer save with stale state (UI scale 1.25 came back) (high) | fixed 2f1a3104, suite 91a2 | src/14a-cloud.js |
| 3 | cave | suit failure by a bite in the cave left G.cave set in surface mode (med) | fixed 1c77844b | src/23-mode-dig.js suitFailure |
| 4 | surface | wall and inspected stone masked a deposit prompt (carried over) | fixed 1e0880c0, suite 91a7 (on bugs) | src/21-mode-surface.js |
| 5 | flight | compass chip "Neyel I" under the zoom button: NOT reproduced. 1024x768: chip top-left 924,260 (h 16), .rail 946,294-1008,528, #zin 946,440-1008,484; 2000x1000 (UIK 1.064): planet is on screen, no chip; star/station chips at y 855, .rail 1917,496-1983,745, #zin 1917,651-1983,698. .zoom sits inside .rail, so railRect() already blocks it | closed, not reproduced | src/17-mode-system.js:858 |
| 6 | surface | base offer hidden while a scannable organism is near the ship | fixed c21838da (prompt now adds "ВХОД В БАЗУ - ОТОЙДИТЕ ОТ ОРГАНИЗМА") | src/21-mode-surface.js |
| 7 | surface | BORT panel clips base life rows | fixed c21838da (board starts under hudRect) | src/21ac-base-draw.js |
| 8 | menu | settings only inside the menu in game; scale does nothing at 390 without a hint | open, design | src/27-ui-ship.js:363 |
| 9 | station | board "НА КАРТУ" leaves the dock without ОТСТЫКОВКА; label twice (med) | open, design | board tab |
| 10 | start | flying into the star's corona and back in loops wreck -> repair every ~5 s; the player drives it, repair is free | open, design | src/17-mode-system.js:282, src/28-loop.js:16 |
| 11 | log | G.log keeps 160 lines, a wreck loop evicts the start of the run | open, low | src/11-log.js:11 |
| 12 | speed | system: 3 GPUQueue.submit per frame (~180/s); long frames 0-2 per 3 s, max 20.8 ms; heap flat 27-28 MB from 1 to 5 min; planet pc (cost.py): GPU 1.57 ms, CPU 0.58 ms. Other scenes not reached by player path | info | docs/playtest-2026-10-14/F-speed.md |
| 13 | ui | vision: 0 violations in 17 windows; 2000x1000 not in the window set | info | G-geom.md |
| 14 | station | wallet (#wCr/#wDt) stayed stale while a station screen stayed open after a load (hunt seed 287007) | fixed 3f192681 (stWalletSync from hud) | src/26-ui-station.js, src/27z-telemetry.js |
| 15 | landing | G.land.touch was written and never read (hunt, dead field) | fixed 3f192681: the hard-landing journal line now prints the touch numbers | src/19-mode-landing.js |
| 16 | hunt | seed 287011 (0.6-0.8% popped blocks after "к станции") repeats 3 of 3: flightCam still closes its lag at the dock, the whole view pans ~1 px/frame; not a game defect, the detector did not know the dock | fixed c024a918 (tests) | tests/91zzzzzzzz-detect.js |
| 17 | hunt | seed 4 (2.3% popped blocks at step 48) repeats: a landing finished between two rest frames, mode landing->surface is a scene cut by design | fixed 5dddfb7f (tests) | tests/90c-detect-laws.js |
| 18 | hunt | seeds 5-12 green, 1 seed per run 60 steps | info | lab/lab-local.py |
| 19 | speed | base scene: 5 submits/frame (staff cards, light field gpuOver, player card, pennant, present) | fixed 50fd1046: 3 submits/frame, 1203 -> 720 submits/s at 240 rAF/s; the light field continues the open pass, the pennant sits beside the player card | src/21ad-base-gpu.js, src/21ac-base-draw.js |
| 20 | speed | home-in ("дом"): 4 submits/frame, one of them is a separate encoder only to clear the emit texture after gpuOver | open, low | src/29d-home-draw.js:73-79 |
| 21 | combat | T.bot("fight",600) on ring 18 (-18,-18), armed: hull 100 -> 85, pirate count 1 -> 1, no crash, no mode change | info | tests/91zzzzzzzza-walks.js "бой" |
| 22 | station | refuel (bRefuel) works at fuel and trade stations (5 -> 229, 1120 / 1568 cr); shipyard purchase strizh -> f23 for 28 300 cr; fuel station has only the board tab by design (stTabsHere) | confirmed | src/26-ui-station.js |
| 23 | not covered | swarm (bite after standing 5 s: suite 91a1), captain (open in DESIGN-game), HQ room, Сорока under pressure | open | - |

Not reached by anyone: lab/shipyard buy, HQ, refuel, Сорока, belt, captain, swarm, pirate fire, jump continuation after reload, raid, winter, spa.
Design list for the author (not touched): armed start hull vs pirates at 2100 u, endless drift without brake, 3-sector jump = 48 fuel vs tank 30.
