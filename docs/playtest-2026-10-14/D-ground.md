# D-ground: landing, surface, drill, beasts, base, mine, cave, takeoff

QA-D, drift.html v0.494.0 at 127.0.0.1:8815, own headless Chrome (9604), 1280x800.
Real time spent: 22:39 to 22:50, about 11 min (limit 25).
Repro path: ЛЁГКИЙ СТАРТ, tap the planet chip "Нейэль I", T.bot("land"), surface.
Note: T.bot lives in tests/90a-tools.js, which only tests.html loads. I evaluated that file read-only into drift.html (no repo writes). Money came from T.give.

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | cave, after suit death | Emergency return clears mode but leaves G.cave set: state reads mode=surface, hasCave=true | journal "Скафандр разрушен на Нейэль I"; state probe s22 | 23-mode-dig.js:138-141 (suitFailure never clears G.cave); 22-mode-cave.js:374 clears it on the lamp path | med | tech |
| 2 | cave, bites | Suit 97% to 0 via "Укус" (−3 per bite, 100-frame cooldown per beast); no warning before death in the journal | journal tail; suit 97 to 0 over ~15k frames of my own stuck test | 22-mode-cave.js:355 | med | design (rate not measured) |
| 3 | cave, ledges | Walking stops at x=649 and x=1041 with A held 120+ frames; prompt unchanged "A D — ИДТИ · W — РАНЕЦ"; W (ранец) climbs (dy −83, −186) | s18, s20, s21 probes | 22-mode-cave.js:430 | low | design |
| 4 | ship, base offer | "ЗАЛОЖИТЬ БАЗУ" never shows while a scannable organism is near: prompt stayed "СКАНИРОВАТЬ ОРГАНИЗМ" over 800 frames within ±112 px of ship; offer came after 4 scans | s24, s26; log "Заложена база на Нейэль I · −2500 кр, 10 сплавов" | 21-mode-surface.js:598 (organism branch) before :613 (base offer) | med | design |
| 5 | base, top-left HUD | DOM "БОРТ «Стриж»" panel covers top rows of base life panel; ВОЗДУХ and ВОДА labels clipped under the ТРЮМ row | shots/base_entry.png, crop base_topleft_x3.png (visual; rects not measured) | 21ac-base-draw.js:610-611; BORT panel is DOM | med | tech (layout) |
| 6 | settlement handover | 1-frame act press did not hand over (ice 13 kept); 150 ms hold did: "Отдано живущим: Лёд ×13", ice 13 to 0, credits 600 to 600 | s9, s10; journal | 21-mode-surface.js:521-526 (actEdge) | low | tech (check tap length); design (no payoff shown) |
| 7 | settlement wall | At x≈1965 prompt "СТЕНА ПОСЁЛКА · ПУСТА" with no action; act changed nothing | s11 | 21pih-dep-room.js:49 | low | design (no hint why empty) |
| 8 | surface walk | Flat walk 50 px per 90 frames (0.55 px/frame); 501 px to a beast took 1164 frames | s5, s7 | not located | low | design (measure on phone) |
| 9 | console | No game exceptions. Static server 501 on POST (log.php, api.php, war.php), 404 for manifest and favicon, AudioContext autoplay warning | console.log | n/a | low | env, not game |

Checked clean:
- Landing: planet tap, then autopilot landing in 400 frames; hull 100, fuel 95 to 84; prompt "ДЕЙСТВИЕ — АВТО-ПОСАДКА".
- Walking: both directions on flat ground, no stuck (x 3164 to 3214 to 3164).
- Drill: "УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — БУРЕНИЕ" on "ЛЁД · ЗАЛЕЖЬ 13"; 500 frames gave 13 ice (cargo 13/40).
- Beasts: 16/16 surface fauna sit at dy 0 to ground; scan via act logged "Новый вид: Ворэш грибной ... +9 данных".
- Shaft: entered at "ЗАЛОЖИТЬ ШАХТУ"; depth 0 m, 6 m (120 frames), 21 m (360 frames); "up" returned to surface.
- Cave: entered at "ВОЙТИ В ПЕЩЕРУ" (x 844). Plants 13/13, fauna 5/5 and props 9/11 sit within 12 px of floor or ceiling. Prop at x1455 hangs 10 px under ceiling (anchored). 2 props not checked (no x/y).
- Base: founded (2500 кр + 10 сплавов), entered, left with KeyM, takeoff by T.bot("launch") in 36 frames: mode system, fuel 76.

Not reached / not checked:
- Cave lower gallery and the find at x 340 (not checked).
- T.bot("dig") failed: settlement and organism prompts block shaft laying. Shaft was entered by manual walk and act.
- Settlement wall with content, base rooms other than reactor, phone width (not checked).

Method caveats: T.give("rich") hired a crew (−3 530 кр) and gave 496k credits (test only). Finding 2 is inflated by my own ~15k-frame stuck test near beasts.
