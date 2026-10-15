# B · station · playtest 2026-10-14 (v0.494.0, http://127.0.0.1:8815/drift.html)

Path: ЛЁГКИЙ СТАРТ (real click) → tap station chip → autopilot auto-docks (6 s wall) at Цициин (trade station, 600 cr). Headless Chrome 153, 1280×800, own profile qa-chrome-B. Driver and raw JSON in scratchpad (not in repo). No screenshots. Time spent about 45 min including one aborted run (over the 25 min limit).
Frame cost = JS time inside frameBody (performance.now), 2 s windows, headless. It excludes raster and is not fps: avg 0.26–0.97 ms, max 6.0 ms across 11 screens.

| # | where | what | evidence | file:line | severity | tech/design |
|---|---|---|---|---|---|---|
| 1 | ВЛАДЕНИЯ → СТРОЙКА | The СТРОЙКА tab cannot be opened: logic lists it, no button exists | tabsHere includes "site"; in dock #stTabs shows only БАЗЫ; no data-tab="site" anywhere | src/26-ui-station.js:171,175,208; src/index.html:182-195 | high | tech |
| 2 | ДОСКА → "НА КАРТУ" (two identical buttons) | Leaves the dock: mode dock→map, station closed, no ОТСТЫКОВКА; the same label appears twice | run 1 at 18 s: mode dock->map; run 2 i=3 and i=4 both "НА КАРТУ" | candidate src/11t-rumours.js:152 (not confirmed) | med | design |
| 3 | МЕНЮ → ОПИСЬ: "ОПИСЬ", "СТОЛ", "В ДОРОГУ" | Hit-test says the buttons are covered by station controls (I.f, FOOTER, #bRepair.act); the fallback el.click closes the menu | run 2 i=0,2,4: "covered by", result "menu closed" | not located | med | tech (1280×800 only; phone not checked) |
| 4 | ЛЮДИ → КАНТИНА → ВЫСЛУШАТЬ | Scroll 289→0 after the click; body 8056→1787 chars | buttons i=5, scrollReset=true; probably a clamp because content shrank, not verified | src/27c-ui-hq.js:139 | low | tech (check) |
| 5 | all station screens | Browser console: 404 drift.webmanifest and favicon.svg; 501 on POST war.php and api.php (static local server) | consoleTotal 24, excTotal 0, Сбой 0 | - | low | tech (local server) |

Checked, no finding:
- ОТСТЫКОВКА (#bUndock): visible on all 11 screens; click → mode system, station closed (run 2, 85 s).
- Board: ВЗЯТЬ (place taken), ПЕРЕДАТЬ · 10 кр (credits -10, journal written).
- Market and scrip: КУПИТЬ 1 / КУПИТЬ 10 / ПРОДАТЬ 10 change credits and journal; disabled buttons do nothing.
- Modules (ОСНАСТКА): УЛУЧШИТЬ ДО УР. 1 · 500 кр → credits -500, journal, body re-rendered.
- Shipyard (ВЕРФЬ): 8 of 8 buttons disabled at 600 cr (price shown, no way to buy); no visible change.
- Instruments (ПРИБОРЫ, 39 KB body): 4 disabled buttons; scroll kept after idle.
- Crew and cantina: НАНЯТЬ disabled; ВЫСЛУШАТЬ see row 4.
- ДОМ (home) = БАЗЫ tab: 987 chars, zero <button> elements in the DOM.
- Frame cost per screen: all screens 0.26–0.97 ms avg JS inside frameBody.
Not reached or not checked:
- ЛАБОРАТОРИЯ (НАУКА), СПЛАВ КОРПУСОВ, РЯДЫ: a trade station has no such tabs (src/06-galaxy.js:51). Needs a different station type.
- ШТАБ (HQ): #hqbtn absent in dock, G.mgrs=0 (src/27c-ui-hq.js:270-274). Not reached.
- ДЕЛО: #dealbtn hidden in dock (menu shows it hidden). Not reached.
- Cantina hall (27cb): not measured separately; only the cantina tab was measured.
- Shipyard purchase: not checked (all buttons disabled at 600 cr).
- Buttons per screen capped at 8: the rest is not checked. Phone layout and touch scroll: not checked.
