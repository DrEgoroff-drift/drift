# C - flight (build 0.494.0, http://127.0.0.1:8815/drift.html, own headless Chrome, port 9603)

Base steps: ЛЁГКИЙ СТАРТ (#startEasy, real click) → system view «Нейэль», sector 0:0. Time spent ~13 min.

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | 1024x768, system view, right edge: compass chip «Нейэль I» (planet off-screen right) | chip hit zone 918-1018 x 429-473 lies under the zoom-in button; the label (x 924-1010, y ~448-462) is covered by the +/- rail | elementFromPoint(968,451) = BUTTON#zin (rail 946-1008 x 440-484); tap at (968,452) → G.ap null, no «Автопилот →» line | src/17-mode-system.js:1072 (zone grown to 44 px, no rail clamp); src/index.html:95 | med | tech + design |
| 2 | 2000x1000, same state | planet chip absent (planet is on screen; chips exist only for off-screen objects) | SYS_CHIPS = star + station only | src/17-mode-system.js:1072 | low | not reproduced |
| 3 | compass chip «звезда» 1024 and 2000 | tap on star chip sets autopilot | G.ap = {kind:"star",phase:"fly"}; prompt «АВТОПИЛОТ · 244 ед · 5.8…»; 2000 frame shows «Подлёт к звезде» | src/15-input.js:478, 283 | pass | - |
| 4 | same tap, read 2.5 s later | G.ap reads null while the ship is still flying | phase None at +2.5 s (1024 and 2000); cause not checked | src/15-input.js:106, 196 (G.ap cleared on keys) | low | tech, not checked |
| 5 | map 1024x768: footer card vs pads | canvas footer bottom = mapDeck() 688; pads top 700. No DOM overlap; rail ends 528, above pads | getBoundingClientRect on .pads buttons; mapDeck() = 688, HUD_FLOOR = 700 | src/18-mode-map.js:14-17 | pass (12 px) | tech |
| 6 | map 2000x1000: footer card vs pads | canvas footer bottom = 915; pads top 927.67; rail ends 745 | same method | src/18-mode-map.js:14-17 | pass (12.7 px) | tech |
| 7 | map pads row 1024 / 2000 | horizontal gaps 10-11 px between ТОРМОЗ, ПРЫЖОК, ▲ | rects: 668-771 / 781-931 / 941-1008 (1024); 1621-1731 / 1742-1901 / 1912-1983 (2000) | src/15-input.js:40 | pass (tight) | design |
| 8 | HUD 1024 / 2000 | #ipod instrument strip vs BORT and navigation panels | ipod 335-715 x 0-80 (1024), 812-1216 x 0-85 (2000); no overlap with side panels | src/25c-instr-hud.js:20 | pass | - |
| 9 | jump from map | select star (tap 601,468 at 1024) → «ПРЫЖОК · 27 топлива»; ДЕЙСТВИЕ held 150 ms (keys.act) → system «Тауурорн» | G.fuel 100 → 73; G.log 1 → 4; mode system | src/18-mode-map.js:504 | pass | - |
| 10 | jump pad click | a CDP click (instant press) on «Прыжок» does nothing; held press works | G.mode stays map, fuel 100 | src/15-input.js (act hold) | info | harness (rules: use keys.act) |
| 11 | menu → СТОЛ (notebook/journal) | tablewin opens; journal list in DOM | tablewin visible; #loglist 4 children; G.log 1 at start («НОЧНАЯ ПОЧТА · …» ether) | src/index.html:101-112 | pass | - |
| 12 | menu → В ДОРОГУ (road) | roadwin opens fullscreen-ish, no errors | roadwin rect 24,22 → 1000,746 (1024) | src/index.html (roadwin) | pass | not checked at 2000 |

Not reached: refuel (needs docking at station «Нейэль» / bRefuel), Сорока (needs a visit to her berth).
Not checked: postcards (no открытка UI found; «НОЧНАЯ ПОЧТА» receiver not opened), iPod audio/road beyond the window, canvas compass plates on map at 2000 by DOM (canvas, no rect API), night-mail DOM button rect (selector miss).
Note for harness: WebGPU needs `--enable-unsafe-webgpu` and no `--use-angle=swiftshader` on this machine (shot.py flags); with SwiftShader the page shows «Этому браузеру не хватает WebGPU».
Process: two heredocs used for scratch edits (against rules.txt); scripts otherwise are files in scratchpad. Code not edited; only this file written.
