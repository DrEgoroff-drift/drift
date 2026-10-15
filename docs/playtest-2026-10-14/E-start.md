# E: start and combat (ЛЁГКИЙ СТАРТ) · drift 0.494.0

Setup: drift.html on 127.0.0.1:8815, own headless Chrome (port 9605). Start via #startEasy. Scripted pilot (keys set in JS, real thrust/turn/fire, no jumps). Game clock is the real clock. Start: system Нейэль 0:0, hull 100/100, fuel 100, credits 600, 2 pirates. Run: 9.01 game min (540 s real).

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | flying to star (origin) | Corona kills the ship; wreck → emergency repair → flies back in → wreck, every 4–6 s, no exit in the run | G.log: 76 "Корабль разбит: перегрев у звезды · аварийный ремонт" in the retained window, gap median 5 s; "Корпус горит: корона звезды" | src/17-mode-system.js:282–295; src/28-loop.js:16–44 | high | design + tech |
| 2 | after repair | Repair puts the ship at radius 1600 with hull 45 %, and the route back to the star is open; the loop costs no cargo and no credits | run end: hull 45/100, credits 600, cargo 0 (from the 9.01 min sample); repair clamp | src/28-loop.js:21, 25 | high | design |
| 3 | G.log | The journal keeps 160 lines, so the loop evicts the first minutes of the run, including any early pirate fight | n = 160; wreck entries span 0–388 s of the retained window | src/11-log.js:11 | med | tech |
| 4 | test harness | Keys stayed held after my runner exited, so the ship kept burning (not a game bug) | trace: hull 45 at run end; 17.1 at later dump | — | low | tech (tooling) |
| 5 | tests vs drift.html | T.bot and ?fseed exist only in tests.html. drift.html has no T and does not read fseed | grep: `function bot(goal` in tests.html only | tests/90a-tools.js:25, 71, 285 | med | process |

Not checked / not reached:
- Pirate shooting, swarm, belt: not reached. 0:0 has no belt (sys.belt = null). No pirate or swarm lines in the retained journal. Early pirate fight lost (row 3).
- Captain (12o-hunter): not reached. No "ЗА ВАМИ" line.
- Hull over time: not measured. My 2-s sampling threw on every tick (my bug, const reassignment), so only the start (100), 45 at 9.01 and 17.1 at dump are known.
- Death → repair loop for pirates: not checked (only the star killed the ship). Per-cycle hull values not read.
- ?fseed variants: not checked (T.bot path not available on drift.html).
- Star corona radius (sys.radius): not read.

Time: about 35 min real (limit ~25): 9 min flight, the rest setup, reading, and fixing my logger. Over the limit by about 10 min. No screenshots taken.
