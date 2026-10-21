# A-shell: title, menu, settings, save, two tabs (QA-A)

Build: http://127.0.0.1:8815/drift.html v0.494.0, own headless Chrome (port 9601). Time spent: about 11 min (22:39 to 22:50).
Raw numbers: scratchpad qa-A-shell1..5.json, screenshots qa-A-*.png. "ЛЁГКИЙ СТАРТ" = start from the title.

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | two tabs, newer tab closes | Older tab resumes writing and overwrites the newer tab's save. Steps: ЛЁГКИЙ СТАРТ → МЕНЮ → НАСТРОЙКИ → ЗАПИСЬ → СОХРАНИТЬ (save ui=1.25); open 2nd tab, ПРОДОЛЖИТЬ, ГРАФИКА, set ui=1, СОХРАНИТЬ (save ui=1); close 2nd tab; wait 6 s, no input in tab 1 | save ui 1 → 1.25 with no action in tab 1 (shell4 tabs.afterResumeAndWait); tab 1 tabLive false → true on bye. Field checked: opts.gfx.ui; the write replaces the whole snapshot | src/14a-cloud.js:35-36 (bye resumes without re-reading save), :59 autosave; src/28-loop.js:545; src/14-save.js:59 | high | tech |
| 2 | 390x844 phone | Scale setting is inert on phones, row still reads КРУПНЕЕ. Steps: ЛЁГКИЙ СТАРТ → МЕНЮ → НАСТРОЙКИ → ГРАФИКА → Масштаб ×3 → КРУПНЕЕ, resize to 390x844 | G.opts.gfx.ui=1.25, UIK=1 at 390x844 (shell5 KRUPNEE run); row has no hint that the setting is ignored | src/27-ui-ship.js:363 (w<=760 returns 1), :198-204 (label) | low | design |
| 3 | title screen | НАСТРОЙКИ is not on the title. Title has only ЛЁГКИЙ СТАРТ, РУЧНОЕ УПРАВЛЕНИЕ, УПРАВЛЕНИЕ (ПРОДОЛЖИТЬ hidden with no save). New player cannot set scale or sound before starting | DOM: #optbtn is inside #menu (in-game only) (shell1) | src/index.html:110, :269-273 | low | design (check if intended) |
| 4 | settings persistence | Scale, quality and sound live only in the flight save (opts). They are written by autosave in system/dock/surface, not on click. Reload before that loses them | NOT checked as player path (code read only) | src/14-save.js:59; src/28-loop.js:545 | low | tech (not reproduced) |
| 5 | console | 404 drift.webmanifest and favicon.svg; 501 on POST api.php?a=post and war.php?a=pull. Static 8815 root, not game bugs. Live site not checked | 23 env lines; 0 exceptions; 0 "Сбой" in G.log | src/index.html:11-12 | low | env |

Passed, no defect:
- Title at 2000x1000, 1920x1080, 1366x768, 1024x768, 390x844: no overlap, no h-scroll, buttons 340-391 px wide, 72-82 px tall. Auto scale 1.06 / 1.15 / 1.00 / 1.00 / 1.00, matches 27-ui-ship.js:364.
- Scale cycle with real clicks АВТО → МЕЛЬЧЕ → 100 % → КРУПНЕЕ → АВТО: UIK 1.06 → 0.8 → 1 → 1.25 → 1.06; --ui and label follow.
- Settings ГРАФИКА tab at 5 sizes, auto and КРУПНЕЕ: no button off-screen, no h-scroll; body scrolls (1366x768: 388 px visible of 593).
- Preset: draw 1 → 1.5 (real click). Sound: Звук ВКЛ → ВЫКЛ (real click).
- Save → reload → ПРОДОЛЖИТЬ: credits 600 and system «Нейэль» restored; no "Сбой" in journal.
- Two tabs: opening tab 2 moves the lock (tab 1 tabLive false, journal note added, tab 2 live). Save in the lost tab returns before writing (src/14a-cloud.js:46-47).
- КРУПНЕЕ menu button 78x73 px vs AUTO 62x58 px at 1366x768; no overlap found.

Not checked: toast texts ("Здесь запись остановлена", "Запись возобновлена") are not in DOM, so not verified; ЛЁГКИЙ СТАРТ and ПРОДОЛЖИТЬ at sizes other than 2000x1000; quality rows other than Пресет; РУЧНОЕ УПРАВЛЕНИЕ; ОБЛАКО; touch input at 390x844 (emulation only).
