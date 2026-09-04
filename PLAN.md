# Drift — work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers — numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic ≤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips — ground, cave rock —
  and `screenLayer(key, paint)` for screen-space constants — the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format: writes `v:5`, reads 4 and 5 (M227).** The feared `server.js`/`worker.js` do not
  exist; the cloud (`site/api.php`) checks only that `v` is present. New fields: `snapshot()` plus
  a safe default in `applySave()` (`14-save`); shape changes ride an `s.v===5` branch.
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation — the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.
- **Every drawn thing is held against the craft codex before it is called done** (author,
  2026-08-31: «сверь с альманахом по графике, надо чтобы красиво было. С ним надо все сверять
  когда делать будем»). `docs/DESIGN-craft.md` holds the laws, `docs/ALMANAC.md` the dated
  verdicts. The pass is not decoration and not taste: the laws are numbered, the frame ledger
  (`28y-look`) supplies the numbers, and a piece that fails one is named in the almanac rather
  than argued about. A new visual system gets its own almanac issue the way the interface got
  issue II. The order that keeps recurring, and the one to start from: §1 layer order (dark ground
  → body in greys → glazes → wear → highlights, and wear goes *under* the highlights), §12 values
  before colour, §13 body-outline-one-light, §3 keep the empty, §16 expose for the shadows.

- **Design in passes, not in one shot** (author, 2026-08-23). Any design — a screen, a
  component, a drawn thing — gets a draft and then several self-critique passes along the way:
  look at the result as a user/with the art direction, name what is wrong, redo, repeat until a
  pass finds nothing. Optimisation is part of every pass, not an afterthought — check the
  raster/JS budget (`prof()`, the "painted once" rule) before calling a pass clean.

## How a frame is judged (M241) — the meter, and the rules under it

"I don't like the look of it" is not something anyone can act on. Since M241 the frame is
measured, the way speed is: `look()` in the console reads the canvas that is actually on screen
and prints four numbers; `lookAll()` walks every scene and prints the table. The scene list lives
in `28y-look` and is shared with the fuzzer — one list, or the two drift apart.

**Five numbers for a FRAME** (`LOOK_TARGET`, updated M249):

| number | target | what it catches |
|---|---|---|
| pair % (minority of warm vs cold) | ≥ 15 | a single-temperature frame; warm % stays as reference. For natural daylight this is arguable — see loose ends |
| mass % (second-largest of three value steps) | ≥ 14 | no counter-mass: one value doing the whole frame. Measured 0.245.0: 6–43; fails map/belt/cave, passes the empty-but-shaped |
| edge % (step transitions between samples) | ≤ 18 | crumble — a guard, not a goal; today 3–11 everywhere |
| contrast (p95 − p5 of value) | ≥ 0.30 | everything sitting in one narrow band. Measured: 0.07–0.77 |
| tones (hue buckets holding ≥5%) | ≥ 5 | one hue doing all the work. Measured: 2–8 of 36 |

`empty %` stays in the table as a **reference column about content** (M248: the cave is empty
of *things*), not a target about light.

**Five passes for a THING.** A thing is finished only with all five; three or fewer and it reads
as a placeholder:

## Next — after M321 (0.318.0, 2026-09-03)

M299/M300 built the screens pass (`docs/DESIGN-screens.md`); M301 (0.298.0) the person cards;
M321 the §9 walkthrough as `tests/91zzy-walk` (both windows, 200-character block cap after every
step) and the course as a state with «К ЦЕЛИ» in flight. The screens pass is closed. Left here,
in this order (author, 2026-09-03: «сначала по плану, потом это»):

1. ~~The settlement's houses and the wintering hut on `homePlan`~~ — M322 (0.319.0): one
   `housePlan` for both; the wintering has no exterior, nothing to unify there.
2. ~~The plants as bodies (M173 #2)~~ — M323 (0.320.0): the dark mass under every form.
3. ~~Drones choosing where they sell~~ — M324 (0.321.0): the keeper, from the desk's prices.
4. ~~Effects, all of them~~ — M325 (0.322.0): water with reflections, heat haze, chromatic
   aberration on hits, the flare flame live over the bake. **The queue of 2026-09-03 is closed.**

3. ~~System proportions~~ — M315 (0.312.0): bodies and orbits scaled (`SYS_K_*` in `06-galaxy`), the
   ghost click on screens opened by a pad swallowed, §18.8 complete but for the заявка (rung 21).
   ~~Left: the ship keeps its `.55` floor at deep zoom-out~~ — `.35` since M319 (0.316.0).

## «Сорока» — the wanderer queue (M340 done, M341–M346 open; author 2026-09-04: «делай всё в соло»)

Design is settled in `docs/DESIGN-wanderer.md` (§1–§13; §6 and §12–§13 are the revised, binding
parts — §11's prices are indicative). Read that file first, then this queue. Every milestone below is
one commit: bump `VER`, one PATCHNOTES entry, tests green (`test.ps1`), then push. Work order is
fixed; each step is playable on its own. Decisions the author already took (do not re-ask): the ship
is one wandering sail-ship named «Сорока»; the currency is **spички** (matches), never credits for
rare raw; barter exists only as one wild-card lot per stop with a categorical ask, never a recipe;
cosmetics exist; the desk gets one table «ОПИСЬ»; a locker exists at stations.

- **M340** (0.337.0) — done: `12uc-matches` — `G.matches`, `matchesInPart` by tier (3→1, 4→3,
  5→5 or a box of 8 by part seed), `scrapPart` returns `matches`, hold header shows «спичек: N»,
  save round-trip, suite `91zzzze-matches`.

- **M341 — the table «ОПИСЬ»** — **one screen for «what I have»; the desk keeps «what I read».**
  Entry points after M341 (author, 2026-09-04): the menu button КОРАБЛЬ becomes ОПИСЬ and opens the
  table full-screen (rework `#shipview`; its КОРАБЛЬ/СКАФАНДР tabs go away — parts are zone 3, the
  kit zone 2, spare kit pieces a «запас» row beside the doll); the desk item НАКЛАДНАЯ loses its ТРЮМ
  tab and becomes ЦЕНЫ (paper about prices only); the station's ОСНАСТКА opens ОПИСЬ with return to
  the terminal (as today); while docked a fifth zone ЯЩИК slides in (M345). One rule: anything worn,
  fitted or spent lives on the cloth; anything read lives on the desk. «Сорока»'s purchases land here
  (tools → shelf, cosmetics → box, papers → desk ВЕЩИ). Header shows the two real counters, credits
  and matches — not four.
  **Readouts (author 2026-09-04): a permanent panel ПРИБОРЫ under the hull silhouette** (thrust,
  turn, tank, cargo, shield, radar, jump, cooling — real `stat()` numbers) and one under the kit doll
  (weight, pace, armour, lamp, scan, oxygen — `kitStat`). One rule for the whole cloth: hover/select a
  thing and the panel shows the future — a fitted part shows «→ N» in red per touched line («если
  снять», via `statPreview(slot,null)`), a spare part shows the delta against the part it would
  replace and highlights the slot (red «оснастка» line when cap is short), kit pieces likewise
  including weight; cosmetics and tools move nothing and get one line of words under the item.
  Cards keep only name, tier, affixes — comparison lives in the panel, not on cards.
  **Two layouts.** Desktop (>760): three columns as the mock, shelf top-centre, box top-right, hatch
  bottom-right, locker slides in between box and hatch when docked; drag is primary, card buttons
  remain. Phone (≤760): one vertical feed in fixed order — header counters; shelf+box as one
  horizontal scroll strip; zone 3 (silhouette, ПРИБОРЫ, spare parts); zone 2; zone 1; locker if
  docked. The hatch is not in the feed: it is a sticky bottom bar that appears while something is
  lifted. Primary gesture on phone is tap: select → panel shows the future → three 44 px buttons
  slide out under the item (СТАВИТЬ/СНЯТЬ, ЗА БОРТ, РАЗОБРАТЬ for parts); long-press lifts for drag.
  Confirmation for tier≥3 is the button turning into «ТОЧНО?» for three seconds, both layouts. Only
  the feed scrolls; one selected thing per table; guarded by `91f-ui` and `test.ps1 -Mobile`.
  **Prices (author 2026-09-04: rethink, not remove).** The desk paper НАКЛАДНАЯ/ЦЕНЫ goes away;
  `G.seenPrices` stays the one memory and is shown where the decision is made: a small caption on
  each pile in zone 1 («лучшее из виденного: 38 · сектор 4:−7 · 2 прыжка», tap = set course, the
  same action `renderPrices` had), one line under zone 1 «трюм стоит около N, если развезти» (best
  seen per key, seen beats heard as in `12aa-need`); on the galaxy map a station's seen price list on
  hover/tap with the player's cargo keys highlighted, plus a «все виденные цены» list button in map
  mode for those who compared in the table. The receiver keeps broadcasting heard prices; the route
  tool (`12r`) is untouched. Remove `bill` from `DESK_ITEMS` and the `prices` tab wiring in `27i`.
  The author drew it: one green cloth
  with four numbered zones, a tool shelf above, a cosmetics box at the right, a hatch in the corner.
  - Rename tab `hold` → label ОПИСЬ in `src/index.html` (`data-tab="hold"` stays — it is an address)
    and `DESK_ITEMS` `bill` note in `27ia-desk-top`. Do not touch the 20 copies under `docs/*.html`
    (stands; regenerated).
  - Rewrite `renderHold` (`27j-ui-hold`) into four zones laid out as a CSS grid inside `box`
    (class `desk`): **1 ТРЮМ** — the existing piles (`holdDrawPile`) in a 3-column grid, каждая куча
    с подписью и числом; **2 КОМПЛЕКТ СКАФАНДРА** — `kitLayDraw` canvas + the six places as slots
    around it (use `KIT_PLACES`, `kitAll`, `kitName`); under it a strip «Отделка скафандра» (empty
    until M344); **3 ЧАСТИ И ВЕЩИ** — the hull silhouette drawn like `svDraw` (extract the hull+anchors
    painter from `27-ui-ship` into a shared `hullSilhouette(c,w,h,id,sel)`; do not duplicate it),
    slot chips to the left of it (kind label + fitted part card), a column «СНЯТЫЕ ЧАСТИ» to the right
    (`G.inv` not fitted, sorted by tier); **4 ЛЮК ЗА БОРТ** — a round hatch canvas in the corner.
  - Drag and drop with pointer events (mouse+touch; `15-input` knows nothing of this DOM): a part card
    dragged onto a matching slot → `fitPart`; slot card dragged to «снятые» → `unfitPart`; anything
    dragged onto the hatch → for parts `scrapPart` (this is what «выкинуть» means for a part — the
    matches come out), for piles a prompt «сколько» then `G.cargo[k]-=n`. Confirm only for parts
    with `tier>=3` (a one-line inline «точно?» button, not `confirm()`). Keep the buttons СТАВИТЬ /
    СНЯТЬ / РАЗОБРАТЬ as fallbacks on the cards (44 px rule) so the fuzzer and phones work without
    drag.
  - Shelf «ИНСТРУМЕНТЫ «СОРОКИ»» above the cloth: 6 slots, empty with a chalk hint until M343; the
    cosmetics box «КОСМЕТИКА · шкатулка» at the right, closed lid until M344. Matches: a matchbox in
    the lower-left corner of the cloth with the count as a pile caption (draw it in `holdPiece` style).
  - Top HUD of the table shows credits and matches (the author's picture has four counters; we have
    two real ones — draw two, do not invent the others).
  - The old `#shipview` stays for the station's ОСНАСТКА caller (`26b-ui-station-work`) — M167 «two
    instruments» — but `#shipbtn` opens the desk on the ОПИСЬ tab (`tableToggle(true,"hold")`).
  - Tests: extend `91zzzzd-desk` — the tab renders all four zone headers; fitting via the fallback
    button changes `G.fit`; hatch on a tier-4 part yields matches; `91f-ui` overlap stays green at
    1280×800 and `-Mobile`.

- **M342 — «Сорока» in the world** (new `12v-wander.js`, before `17c`; name the mode `wanderer`).
  - `WANDER_STOP=3d`, `WANDER_HOP=1d`, epoch `floor((now-WORLD_T0)/4d)`; `wanderLoop()` — ~24 stops
    seeded from the world seed: pick systems with a station of `rungOf>=6` within 4 jumps, each hop
    3–5 sectors from the previous; every 4th stop is a dark system (`sysDanger>.5`, no station).
    Cache in a module-level const; nothing persisted except `G.wander={got:[],gave:[],chit:0}`.
  - `wanderAt(now)` → `{sx,sy,planetIx,phase:"stop"|"hop",tLeft}`; planet = first non-gas body by
    seed. `wanderHere(sys)` true when the player is in that system during a stop.
  - Drawing in `17c-system-draw` (a new `drawWanderer(zx,zy,Z)` in `17f`-style, called where
    `drawSysTraffic` is): spine of ring frames with lashed crates, a cross yard with four gold foil
    gores that turn to face the star over minutes (`Date.now()`-based angle, movement not blinking),
    a warm gondola lamp at the bow, a porch under the keel with steady ring lights. Parked at the lit
    limb of the planet. Sizes: 8–10 player-hull lengths. Codex rules: dark ground, hard counted
    highlights, one warm light. Last hour of the stop: sails swing to the departure heading.
  - Docking: the same approach test as a station (`nearestStation` pattern) → `G.mode="wanderer"`.
  - Finding: add `RUMOUR_IMG.wander` «паруса у планеты, которые не гаснут ночью» and a rumour source
    in `11t` pointing at the current stop with a 2–3 sector spread, only for cantinas within 6 jumps
    while the phase is `stop`; `11ak-skywatch` lists «яркая точка без номера в каталоге» with a
    direction from adjacent systems; **wire `relicOn("chart")`**: line one draws a sail glyph at the
    current stop on the galaxy map (`mode-map` draw), line two (with «чтение», `relicTwo`) also the
    next stop. Remove `"артефакты/chart"` from `KNOWN` in `91zzzzy-names` in the same commit and
    close the «Needs a decision» item below.
  - `17f-sys-traffic`: one extra shuttle arc ship↔station while it stands.
  - Tests (`91zzzzf-wander`): every loop stop is a live star with the reachability rule; two epochs
    give two stops; the shifted clock (`91zzzzy-time`) keeps the loop valid; `relicOn("chart")`
    is now read by someone.

- **M343 — the room and the shop** (`24c-mode-wanderer.js` + `24ca-wanderer-draw.js`, then
  `26d-ui-wanderer.js`). Room rules of M74–M76: human ≈55 px, back wall, paint order wall → slit
  window (planet limb turning, cold bars on the floor) → gold leak on the upper cabinets → ring frames
  → cabinets (glass, brass corners, one item each, its own steady lamp) → hanging things on lines
  (slow drift, long periods) → counter → keeper (body, not sticks; helmet off) → green-shaded lamp
  (the one warm accent) → dust in the bars → vignette. Empty cabinet = chalk tag (a bought lot).
  - UI = the flea row model (`12ua`): ←/→ walks the corridor, the case in front shows a card:
    provenance line, price (кр / спичек / «хочет: …»), one line from the log. Buttons КУПИТЬ /
    ОТДАТЬ / СДАТЬ СЫРЬЁ. Counter B: sell rare raw for matches (10 volatiles|icecrys|alloy → 1,
    5 techcomp → 1); show a rarity from `G.rareFound` → 4 matches once per id (`G.wander.gave`).
  - Shelf per stop: 8 lots from the catalogue seeded by `(worldSeed,epoch)`: 2 cosmetics, 2 eases,
    1 unique part (50 %), 2 papers, 1 wild card. `G.wander.got` holds bought ids (gone for this save).
  - Catalogue `WANDER_CAT` as a flat const with `ru`, `note`, `pay:{cr|m|ask}`, `fam`, `hook` — one
    entry per §11/§12 item; **wire every hook in the same commit or leave the item out** («a perk
    without code is a lie», `91zzzzy-names` reads every table). Start with what has an obvious
    hook: Ключ причала (autopilot to dock), Слуховая трубка (rumours on the receiver in flight),
    Мастерская рука (`12s-wear` ×.67), Штурманский карандаш (`11t` spread −1), Колокол вахты
    (`11ak` +1), Медный шар (`25j` −1 hop), Тетрадь ветра (HUD countdown), Табличка «НЕ КУПЛЕНО»
    (`12ua` rule 4 off), Список цен, Вторая рука, Полка шире; papers: Страница журнала (exact
    `12m` address), Список отказов, Карта области, missing book (`12ub`, credits). Tools work only
    from the 6-slot cabin shelf (`G.wander.shelf`), the rest lie in the locker (M345) or hold.
  - Keeper lines and the departure flash are in DESIGN §13 — use them verbatim.
  - Tests: shelf determinism per epoch; a bought lot never returns; matches never negative; every
    catalogue hook read somewhere; `lookScenes` gets `wanderer` (frame meter + fuzzer).

- **M344 — cosmetics** (`G.cosm={exhaust,trail,suit,visor,mark,lights,chime}` persisted; applied
  by dragging from the шкатулка onto the hull or the kit in ОПИСЬ). Hooks: exhaust colour/shape in
  `16-flight`/`16a-space` flame (8 named exhausts, each its own flame shape), jump trail in `16`,
  suit finish + visor tint in `20-life` astronaut painter and the kit doll (`12x-suit`), rare hull
  marks via `03d-hull-marks`, nav-light pattern in `03e-hull-draw`, docking chime in `09-audio`.
  Parrot accessories through `12x-parrot`. Test: each cosmetic id changes at least one pixel of its
  target painter (render to an offscreen canvas, compare).

- **M345 — the locker** (`G.locker={items:[],res:{},t}` persisted). Fifth zone of ОПИСЬ that slides
  in while `G.mode==="dock"` at a station with `rungOf>=6`: 24 slots, parts + piles + tools. Fee
  1 %/day of contents' value taken lazily from `Date.now()-t` (the `tickDrones` model); 30 days
  unvisited → contents go to the flea as lots «залог, за которым не пришли» (`12ua` provenance).
  Ease «Второй ящик» doubles slots. Tests: put/take round-trip, fee arithmetic under the shifted
  clock, the 30-day hand-over.

- **M346 — matchboxes** (`G.boxes=[ids]`): ~20 hand-written labels (one line each, like `BOOKS` —
  a table, not a generator), found in wrecks/flea/aboard; shelf at home next to the books,
  «коробков: N из 20». No effect. A full box of 50 is a keeper's legend, possible wild card once.

Reference picture of the table: the author's mock (chat, 2026-09-04) — dark wood desk, green cloth,
zones numbered 1–4, «ИНСТРУМЕНТЫ «СОРОКИ»» shelf top-centre, «КОСМЕТИКА · шкатулка» top-right, round
hatch bottom-right with the hint «перетащи, чтобы выбросить», footer hints «Перетащи предмет на нужное
место · Перетащи на люк, чтобы выбросить · Части выше добротной требуют подтверждения». Reproduce the
layout in the game's own language (procedural canvas + desk DOM), not the render's textures.

- **M347 — the map speaks in addresses** (author 2026-09-04: «на карте не понятно, что за сектора и
  адреса»). `18-mode-map`. (1) A sector grid, one cell per sector, under the same darkness law as the
  stars — bright by the player, fading to nothing at the jump edge; every fifth line a touch brighter.
  (2) Rulers along the top (X) and left (Y) edges that scroll with the window, chart-style; the
  player's and the selected sector's coordinates underlined in colour on the rulers — coordinates are
  read from the rulers, never printed on every cell. (3) Header line «ВЫ · сектор 4:−7 · «Имя»», under
  it the selection «сектор 6:−9 · 3 сектора · 2 прыжка · 3,1 пк»; «секторов» is the same measure the
  rumours use for «в N секторах вокруг». (4) An empty cell is selectable (address + distance; no course
  into emptiness). (5) Rumour areas drawn as pale hatched squares «в N секторах вокруг X:Y» with source;
  two rumours overlapping is visible by itself. (6) Faint range rings «2 прыжка», «3 прыжка» outside the
  lit jump area. (7) Address search: a small «сектор __:__» field (numeric keypad on phone) that slides
  the window and outlines the cell; every address in game text (rumours, notebook, flea provenance,
  «Сорока» papers) becomes tappable → map centres on it (extend the rumour hook of M298). (8) A small
  rose in a corner: +X, +Y and «к ядру». (9) **Decided (author 2026-09-04): no text notes — a wordless mark, and it is a match.** The player
  lays a match from the wallet on a cell (`G.mapMarks=[{sx,sy}]`, ≤10, persisted); it stays until
  taken back. Not spent: the same match, out of the wallet while it lies on the map, so a mark costs
  something without a rule — one you cannot pay with aboard «Сорока». Drawn as a small match lying on
  the cell, warm head, no glow; tap the cell again to pick it up. Zero matches — no mark, and the game
  says so in one line.
  Tests: grid/rulers agree with `mapViewC`; selection of an empty cell yields the right address; the
  rumour square matches `11t` spread; `91f-ui` on phone — rulers do not overlap the deck or rail.

- **M348 — holdings on the map** (author 2026-09-04). Three languages, because the state is a line,
  houses are patches and pirates are foci — never one fill. **Houses:** a sector with a house station
  and its 1-jump neighbours washed in the house colour (`HOUSES.col`), two-colour hatching where two
  houses overlap (both scrips accepted there), house form glyphs stay (`17d`); under the darkness law
  — bright by the player, gone beyond the jump edge except where seen/heard. **ГЛАВТРАССА:** трассы as
  a thin double line between nodes with milestone ticks, name written once along the line like a
  river; sectors along it are «под трассой» (fleet, norm, pirates do not hold) — a band, not a fill
  (`12ai`). **Pirates:** rusty diagonal hatch over occupied sectors (labels ПОД ПИРАТАМИ/БЛОКАДА
  already exist, `13b`); where hatch meets a house patch the front line is a touch brighter.
  **Own:** sectors with own bases/holding stations get a thin frame in the player's colour, visible
  even in the dark. **Changed hands:** a sector whose owner changed since the last visit carries a
  small tag «с 12-го дня: «Ковш» → пираты», fading over three days (the same delta `12p-news`
  records). **Layers:** a СЛОИ button on the map — ВЛАДЕНИЯ / ЦЕНЫ / СЛУХИ, each toggled; one at a time
  on the phone. Regions (`06b`) stay unlabelled — by rule. Tests: house patch = station ∪ 1-jump;
  a sector under a трасса is never marked occupied for long; the tag appears only on a real change.

- **M349 — «Маяк ГЛАВТРАССЫ»** (author 2026-09-04): the official voice in the ether, one bulletin per
  shift (`HOLD_SHIFT`, 20 real minutes) plus holidays (`11am`). Poster tone: a Mayakovsky «лесенка»
  headline, then a dry summary — see the sample in the chat of 2026-09-04 (МАЯК ГЛАВТРАССЫ. СМЕНА 412.
  Сектор 4:−7, станция «Ласковый-2»: принято / тысяча тонн / титана. План смены — сто двенадцать
  процентов. Слава сдавшим!). Rules: (1) every line has a real state delta behind it, stored as a
  `cause` like `G.scripLog` — tonnage from the holding's appetite and what drones/the player handed
  in, «очищен» from `13b`, scrip moves from the rate log, holidays from the calendar; a line without a
  delta is forbidden (the `12p` rule). (2) Exact but lying by omission: a lost sector is «переведён на
  особый режим», «Сорока» is never mentioned, a ruined артель never named — cantina rumours tell what
  the beacon will not, so the two channels never duplicate. (3) The player appears: over-norm delivery
  in a shift names the hull («экипаж борта «Стриж» перевыполнил план по титану»); player-given names
  (`11u`) are used («сектор «Тихая»»). (4) Holidays have an effect: double fleet norm that day, and the
  beacon announces it. (5) Heard in ЭФИР on the desk, by the receiver voice in flight and on the road
  (`27k`), and as a paper sheet on the cantina wall; every address in it is tappable (M347). Module
  `12pa-beacon.js` after `12p`; table of phrase moulds is hand-written, not generated. Tests: no line
  without a cause; the beacon never names `wander*`; holiday doubles the norm exactly one day.
  **M349a — the beacon speaks** (author 2026-09-04: «если ты мне ещё и голосом — ваще кайф»). Browser
  `speechSynthesis`, `lang:"ru-RU"`, no asset — the zero-assets rule holds. Voice only in flight and on
  the road (`27k`), never on the desk or in the cantina; framed by the receiver's own crackle before
  and a short tone after (`09-audio`) — the synth output cannot be routed through WebAudio, so the
  «radio» is framing and pace (slow, pauses on the лесенка line breaks), not a filter. Three roles pick
  distinct voices when the device offers several (beacon: male, even; «Сорока»'s keeper: quiet;
  station dispatcher: female), else one voice for all. Setting «голос приёмника» in options, default
  on; the first bulletin says where to turn it off. Queue one utterance at a time, cancel on mode
  change. Tests: text reaches the queue (mock `speechSynthesis.speak`), and with no voices the game
  stays silent without an error; nothing is spoken while `G.mode` is a desk/station screen.
  **Heard by the author (2026-09-04, the scratchpad proba `mayak-demo.html`): «как рипово, давай только
  тихо, пусть болтает».** So: the voice is a background murmur, not an announcement — `volume≈.35`,
  `rate 1.0` (the demo's .88 was already «slow» to the author), `pitch≈.9`, crackle framing quieter still; it talks on its own whenever a bulletin is
  due in flight, never interrupts game sound, never demands attention; ducked (not cut) under the
  frame guard's «СБОЙ» and combat. The demo's structure is the reference: crackle 1.4 s → lines one
  utterance each → longer pause on лесенка steps → two-tone sign-off → crackle tail.
  **Voices are the system's, not the game's** (author 2026-09-04): settings list the device's
  voices, one picker per role (beacon, keeper, dispatcher) plus rate and volume; a device with one
  Russian voice shows a list of one. Players add voices by installing them in the OS (Windows
  Павел/Ирина/Дмитрий and the Edge neural voices, Android TTS engines, iOS) — the game sees them by
  itself, so «voice plugins» need no code. No voice files inside the game (zero-assets rule); a
  branded voice, if ever, would be pre-rendered files on the site — a separate decision, not now.
  Persist the choice by voice *name* with a fallback to the first `ru` voice when it is gone.

- **M350** (0.338.0) — done: the drone-miner (bottomless point, 9 000 cr by payback, one per yard/indust
  station per two days, ВЕРНУТЬ, sells within two sectors, guest drawn in the market system). The
  audit's trade «hole» was an artefact of open buying: in the game one buys only on a route leg
  (`12r`, M289), and a 3-pair route pays ~17 000 cr in three laps then waits for pressure to decay —
  the designed ~200 cr/min. Trade untouched. **Open (author):** should ordinary buying at the counter
  exist at all («ни разу не видел, купить титан»)? If yes, it needs A2 (sliced pricing) first;
  recommended: keep route-only buying and *say so* on the station («взять можно по плечу маршрута»).
  «Сорока» raw→matches re-priced to 40:1 with a 200-unit cap per stop before M343 (audit §3 H3).

## Loose ends (as of 2026-08-28, after the graphics run 0.237.0–0.244.0)

Everything left open, with the reason it is open. Nothing here is a bug report — bugs are fixed
the day they are found; this is work that was deliberately not done, or that needs the author.

### Needs a decision from the author

- ~~The cave, and the man's height~~ — author, 2026-09-03: «нормас, оставляем». One height in
  every mode stays law; the cave is not an exception.
- ~~Drones: choosing where they sell~~ — M324 (0.321.0): the keeper's «авто-сбыт» reads the
  desk's prices within three sectors; nearest otherwise.
- **Drone attrition.** Deliberately absent: a drone breaks and mends but is never lost. The author
  said leave the drones alone; this stays written down rather than done.
- ~~`pair` as a target for natural light~~ — decided 2026-09-03, M308: daylight scenes
  (`LOOK_DAYLIGHT`) print the pair as a reference, without a verdict.
- **Craft plan remainder** (P0–P9, last section of `docs/DESIGN-story-craft.md`; M249–M270 paid
  eight laws of ten). P4 grisaille — a refactor, its own session. P7b the glyph notebook —
  understanding is a state of the head, not a flag; needs the author. P8 the clocks engine — with
  the first Act II ending, earlier it is a perk without code. С5 fatigue — the author's fork: hired
  hands have no figure, so either portraits (the `mgr-face` brushes) or an axis on managers. P9b
  settlement recursion (Eglash) — by eye over many settlements.

### Picture queue — built as M304 (0.301.0, 2026-09-03)

All seven items of the 2026-09-02 order shipped in one release; bodies in `PATCHNOTES.md` 0.301.0.
What the meter still says after it (lookAll, 1280×800, 10 frames):

| scene | tones | pair | contrast | mass | note |
|---|---|---|---|---|---|
| пещера | 3 | 6 | .35 | 21 | mass and contrast pass; pair/tones are the honest shortfall of a cave |
| грунт день | — | <10 | — | — | pair still short: the disc is the only second hue |
| заход | 3 | 0 | .27–.31 | 42–49 | two masses now; a terran world at altitude has no warm source |
| дом | 3 | 4 | — | — | one cold pool per window is not yet a pair |
| система | 8 | 25 | .20 | 4 | the station body is measured against a nebula; see «Open by design» |

Left from the queue: nothing — the band's second step is M308, the station's codex pass M306.

### Graphics still open

- ~~The cave is 83% empty~~ / ~~the cave's outline is a cell grid~~ — M305 (0.302.0): round rock,
  a back wall, bones, ropes, tallies, a camp, branch-end finds. Left: the lower lake hall is still
  79% empty by the meter — a vault of 78 over a flat floor; if it needs more, it needs a second
  floor level or a lake that fills the frame, not more props.
- ~~The home's furniture is flat boxes~~ / ~~the house is a formula~~ — M307 (0.304.0). ~~The
  interior is drawn per frame — measure before baking~~ — measured in M319 (0.316.0): `?g11` says
  60 fps at dpr 2 with and without a bake, so nothing is baked; `prof()`'s 27 ms was the
  software-raster artifact (see CLAUDE.md). ~~Left: the settlement's houses and the wintering hut
  still draw their own and could take `homePlan`~~ — M322 (0.319.0), `housePlan` in 12tb.
- ~~The system view is 66% empty~~ — M309 (0.306.0): nebula with a core and a soft edge,
  shuttles by rung. Still ~80% empty by the meter, and that is space; the next step is the fleet.
- ~~The approach frame is 80% empty and has two tones~~ — M304 gave it two masses and a light
  corridor, M308 a warm horizon by day. Still 72% empty by the meter: sky is sky.
- ~~Strata run parallel to the terrain~~ — was already paid by M267 (datum + relief cuts); the
  line was stale, struck in M316.
- ~~Straight lines where a hand belongs~~ — the mine cracks go by hand since M316 (0.313.0). The
  reeds wait for water on the surface (none exists yet; see the effects list).
- ~~Boulders are one silhouette scaled~~ — measured in M316: polygons were already individual, the
  *family* was one; now blob / flat-based block / low slab, chosen by an already-drawn number.
- ~~**Effects from the author's list**~~ — all taken: smoke (M320), and water, heat haze,
  chromatic hits, the live flare (M325, 0.322.0). Left to judge by eye in play: the lake's
  walker wades through it (no physics for water — by design, the lake is shallow).
- ~~**Rectangular seams of the sky layer**~~ — hunted 2026-09-03 (M320): a column/row step
  detector over the sky third of night and landing frames at two window sizes finds nothing but
  the hint band and the chips; the one rectangle found was the `wallset` stand's own loupe. If it
  returns, shoot the frame and run the detector (`docs/shot.py --eval`, PATCHNOTES 0.317.0).
- ~~The plants as bodies~~ — M323 (0.320.0): two passes in `drawPlant`, the dark mass first.

### Systems

- **The author's freeze has no cause yet.** The frame guard (M234) survives it and names it on
  screen; the fuzzer (M238) drives eleven modes with random input and finds nothing. The next
  occurrence should carry a `СБОЙ · …` line — that line is the missing evidence.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and its
  body goes to `docs/PLAN-archive.md` in the same commit — done 2026-08-28 (M232–M246) and
  2026-09-02 (M247–M298 and the old queues, 97 → ~40 KB).
- **Push only after a green run.** One push in this session (0.238.0) went out while the base suite
  was flaking once in three runs; caught and fixed immediately after, but the lesson is to keep the
  test run and the push in separate commands.

## Closed 2026-08-28 → 2026-09-02 — one line each, moved to `docs/PLAN-archive.md` (2026-09-04)

## Done — struck items moved to `docs/PLAN-archive.md` (2026-09-04)

## Open by design (not defects; each needs the author or a pass of its own)

- **The fleet — ГЛАВТРАССА** (author, 2026-09-02: «флот запиши в беклог»). Ships that cannot be
  bought: a directorate on the model of Главсевморпуть, thirteen classes off real Soviet donors
  (Союз, Прогресс, Протон, the nuclear tug, Энергия, the seven, Буран as the ferry, Спираль+Алмаз,
  Луна-9, ТКС, Восток×6, Салют, Мир), a truss node station at Узел трасс (25), a silent black
  derelict, twelve interactions none of which is a shop, the fleet as the visible reward of the
  ladder. All of it is in [`docs/DESIGN-holding.md`](docs/DESIGN-holding.md) §18, held against
  the craft codex in §18.6. **Open before a line is drawn:** fork 4 of
  [`docs/CRITIQUE-holding.md`](docs/CRITIQUE-holding.md) — the names (the 08-31 text uses real
  ISS/«Мир» module names, «МКС» and «Полюс»; the critique asks for our own: Короб, Кубрик,
  Воротник…, a call-sign for the node, no name for the derelict); the refuelling «под расписку»
  rewritten without a book of debt; «груз в попутную» struck. Estimate from the critique: one
  class plus the paint pipeline 2–3 sessions, each next class 1–1.5, the interactions 6–10; the
  order of drawing is §18.9, the first meeting the почтовик. **Opened as M310 (0.307.0)**: names
  settled, three classes drawn, the line, позывной and the norm. **M311 (0.308.0)**: joints, whiter
  hulls, сторожевик/паром/плавбаза, services 4/7/10. **M312 (0.309.0)**: the last seven classes,
  почта, госпитальное, учебное. **M313 (0.310.0)**: «УЗ-1», the derelict, the caravan. **M314
  (0.311.0)**: трассы on the map, the rescuer's call, the drawing tails. Left: 12 заявка (lend a
  hull for one run — needs the crew order model, its own pass).
  **The in-play look is done** — almanac issue III, addendum 0.313.0: fourteen frames
  (`docs/shots/f_*.png`, hold scene), measured off the baked sprite and the canvas, held against
  the craft codex law by law. **Palette settled by the author 2026-09-03** («цвет да пусть будут
  светло серые с красными полосами эмблемами, норм»): light grey hulls, red bands and emblems,
  nothing else — so a class is never told apart by tinting it, and §11/§16 are paid inside the
  greys. The work the issue ordered, cheapest first — **all six paid by M317 (0.314.0)**: the
  label from the body's radius and off the chips, the scale to the zoom ceiling, the учебное's
  spine, the паром's wing, the greys a step down with the light reaching the body, and the emblem
  grammar (`fleetGlyph`, thirteen roundels in one construction). Numbers in the 0.314.0 addendum
  of almanac III. **M318 (0.315.0)** paid the last two: §5 (shadow strips under strap-on parts,
  the рефрижератор's corrugation) and §14 (the трасса as a chain to two nearest neighbours,
  judged on a staged chart). Issue III has no open law; the fleet's remainder is the заявка.
  §14 (трассы on the map) is not judged yet: `drawFleetMap` needs a station at rung ≥ 5 and a fresh
  save has none — it wants a lived-in save and its own look.

- **The road companion** (author, 2026-08-23): phone mode where a real car trip flies your ship —
  GPS speed extrapolated to cosmic, accelerometer banks the hull, mic-driven equalizer, real
  distance → a capped in-game bonus synced through the site accounts. Captured in
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md); needs its own pass and the author's answers
  (reward resource, cap, in-game vs separate page).
- **Factions as a language of shapes**: closed (0.109.0) — `17d-house-shapes`: a mark per house on the station and the settlement wall, pennant in the house colour.
- **Base "like Fallout Shelter"**: it is one; what differs is a question for the author.
- **Yacht railing below 3×, fully flat-on view** (archive, ships): the fleet is drawn flat-on by
  design; the hull now has a top light and one asymmetric boom, the rest is the reference-sheet
  richness a rotation pass would give.
- **M124 spec remainder — CLOSED whole (author, 2026-08-27: «сейчас того что есть достаточно»).**
  Receiver with a knob — 0.110.0; "pause is the engine off" — closed by fact. The two held-back
  halves are now decided, not deferred: **the removal of the overlay HUD is superseded** by the
  author's own M187 (0.160.0, «приборы сверху, сейчас очень плохо не видно» — instruments must be
  visible and readable, the opposite of removing them); **the paper language stops at the desk** —
  A3 (0.144.0) made the table paper and things objects, the station screens stay glass by the
  author's call. Do not re-open either without him.
- **M125**: rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation — cosmetic; the rack is not persisted by rule.
- **M126**: the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table
  (the hundred owns per-person talk).
- **M127**: a pirate hit can now knock a socket; instruments as loot beyond that waits for the
  spec's "lost" pass.
- **M132**: edge generator and hand-built cores per region, surface layer masks — each region's
  own milestone (M135+).
- **M131**: barge passenger as a channel, settlement glyph overrides, per-region colouring — left
  open in the hundred's design.
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). So the real remaining work is four files, not seven.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: **closed by measurement (2026-08-24, 0.133.0).** The game now carries its own probe:
  `?g11` runs the mode tour and measures rAF fps in a visible tab (`28z-fps-probe`), `?g11=deep`
  noops draw passes one at a time with paired baselines. Clean run (single fresh-profile Chrome,
  `--force-device-scale-factor=2`, anti-throttling flags, dpr 2, warm cruise after 4 s settle):
  system 56, belt 60, surface(jungle) 55, dig 60, cave 60, landing 52, scoop 47–60 across runs.
  No mode is solidly <50, so the 20-life sprite bake is not justified — matching the earlier JS
  read. The scary first read (system 46, surface 44) was the **cold start while chunks bake**,
  not cruise. Deep pass: no single pass dominates (paired deltas ≤+2, only `drawBuilt` +8 ≈ 2 ms).
  Measurement discipline learned: leftover probe windows with anti-throttling flags keep rendering
  when occluded and sink every later run to ~22 fps flat — kill them before measuring.
- **M112**: nothing else — belt missiles and the hull mark closed it.
- **M135 "three lights"**: built (0.101.0). **M136-hours**: built (0.102.0). **M137-glow**: built (0.103.0). **M138-grove**: built (0.104.0). **M139-keepers**: built (0.105.0). **M140–M142**: built (0.106.0). **M143–M151**: built (0.107.0–0.108.0) — the thirteenth pass is closed. Next: the tails ledger (factions as a language of shapes; M124 remainder), then the split debt, then G11.

---

## To the release

- **The newcomer's first hour** — **first pass done (0.185.0, M207).** The walkthrough is
  `docs/DESIGN-first-hour.md`, measured in the running game. Worst finding: the suit and the fuel
  are countdowns that kill and **neither was ever named** — the bars are drawn and silent. Fixed by
  `11ao-firsthour` (suite `91zzzs-first`): four lines in the ether, each once per save and tied to
  an occasion, said by people and never by the game. No arrows, no modals, no tutorial flag.

  **Second pass done (0.192.0, M212)** — the hour AFTER the opening, walked; findings and
  non-findings in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md). Three fixes: every
  overflowing list now shows that it continues (`27m-scroll-cue` — measured: the board is 1229 px in
  a 407 px window, the cantina 2086 in 408, and nothing said so); the hire screen stopped arguing
  with itself (`xp` was `Math.floor(r()*40)`, bound to nothing, so «неопытен · опыт 22» stood beside
  «ветеран · опыт 7» — it now follows the traits it is printed next to); and ФОТО stopped hanging
  over open screens, a one-day-old regression from M208 widening the camera to flight.

  **Closed by M299 (0.296.0):** the board's sections on a first dock are now three lanes with a
  fold at seven per lane, and every heading is capped at 24 characters (`boardLanes`, `secTidy`). The landing prompt
  offering «СКАНИРОВАТЬ ОРГАНИЗМ» beside twenty-two deposits was checked and is **not** a priority
  bug — `dep` is tested before `plant`; it only happens when no deposit is within reach and a plant
  is. The station's group row can fall out of step with its tab if future code sets `tab` without
  calling `syncTabs()` — reached by the map peek's way back (M299) and closed in M302: `mapBack` syncs.
  The third hour was walked in M215 (0.197.0): the same contradiction came back through
  `stationMercs` (reputation stamped `xp` over the traits), and a newcomer paid for a hand before
  learning he needs a hull of his own. **Its back half was walked too and is healthy:** a trip closes
  in ~9 min of real time, the journal names every event as it happens, and the *"he loses money, is
  he broken?"* reading does not survive contact — the journal shows where the profit lives (a
  salvaged part, a trophy hull) while it happens. Caution for the next walker: `crewTick` runs on the
  **wall clock**, not `G.t`; stub `Date.now` and set `c.tMs` to the fake now, or the hand silently
  stops and it looks exactly like "crew events never reach the journal" (they do, all sixteen).
  **The fourth hour was walked too, 27.08.2026, and the screen is healthy:** two managers at their
  consoles with their domain boards («ЗВЕНО 0/0», «ПЛЕЧ 0/2 — маршрут не собран»), a portrait card
  with level, loyalty, cut and salary, and a header that answers the newcomer's fear outright —
  «оклады 134 кр/мин — из долей доменов, не из вашей кассы». What was broken was the STAND: `hqfull`
  called `mgrHire(mgrRoll(…))`, neither of which exists, wrapped in a `typeof` guard that swallowed
  it — so it had been rendering the empty HQ, the same picture as `?s=hq`. Two more of the same were
  found and fixed (`crewPool`/`crewHire` in `?s=hire`, `cockpitOn` in `?s=cockpit`); the lesson is
  in CLAUDE.md.
- ~~**v:5**~~ — **done without burning anyone (M227, 0.212.0).** The game writes `v:5` and reads
  4 and 5; not one save is lost, local or cloud. Investigating the feared gate found it was a
  ghost: `server.js:95`/`worker.js:66` do not exist — the cloud is `site/api.php` and it checks
  only that `v` is present. The `v:4` legacy branches stay alive under their number; future
  release-look changes to the SHAPE of persisted fields ride `s.v===5` branches. **The last of
  the overlay** — closed with the release look itself (author, 2026-08-27): see the M124 note
  above. What exists is the release look.
- ~~**A clean performance measurement**~~ — passing at 0.213.0 (27.08.2026, machine quiet, one
  window, dpr 2): **60 fps in all nine modes** with every change of the day in — the world scale,
  the UI zoom, the soil profile, the relays, the splits. Earlier same-day dips were the busy
  machine, proven by measuring the committed build. Re-run once more at the actual release as the
  release check.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

## «Зачем лететь» — the one open item of the outside playtest (2026-08-26)

Items 1–4 of that queue are closed (M213, M214, M217, M223) and sit in the archive.

5. **«Зачем лететь» lives inside the station** — **first move made (0.200.0).** The desk already
   remembered every station's prices and shortages and let you do nothing with them: the address sat
   there as two numbers to be memorised by eye. Tapping a price row now lays a course and opens the
   navigator — the same gesture the journal has always had for a job, and the only button it has ever
   had. Nothing appears over the world: no arrow, no marker, the game never asks you to go. The move
   is `gotoSector(sx,sy,what)`, lifted out of `questGoto`, so the next addressed thing on the desk
   gets it free. **And the rest of it done (0.201.0):** the ЦЕНЫ band names a real station live, in flight, and
   hearing it now writes a row on the paper — where yesterday's gesture plots the course. It stays
   hearsay and is guarded as such: only the good actually named plus fuel, marked «со слуха», no
   shortage (that is not broadcast), never overwriting a docked row, and never counted as the best
   price in bold. Once per station per day, and only at a legible signal.

   Original wording: The board (needs, tips, prices) is the game's
   motor and it only runs after landing, docking and switching a tab. **The fix must stay in the
   game's language:** the tester's own strongest praise was «ничто из этого не обращено к
   игроку — и поэтому работает». Quest markers and objective banners would buy the metric and
   sell the game. The receiver already broadcasts prices and rumours — make what it says
   actionable, and let the navigator act on what was overheard. This is also where the author's
   own idea belongs (below).

## First three — built; body moved to `docs/PLAN-archive.md` (2026-09-04)

## After those, in order

Act II (the first real loss, by his own hand, everyone kind about it) → the offers deepening
through the expedition → Act IV (doors closed, the world still offering, nobody left to vouch) →
the yacht last, because an ending cannot be built before the middle.

**The first move into Act II is made (M225, 0.210.0): the three squanders now all exist.**
«Ляпнул лишнего» was built as M194; `11aq-late` adds the other two. Staying at the counter is a
real choice that buys something real — a line that exists nowhere else, occasionally a *named*
offer («некоторые вещи говорят только поздно и только там») — and it costs real hours: `G.t`
jumps, and every window in the game (offers, shifts, needs, the sky's calendar) ages silently.
The wrong person costs an hour and ten and gives exactly nothing but the conversation itself,
and nobody is ever angry. Three sits per shift, then the counter empties — the only refusal the
place ever makes. Guards in `91zzzx-late`: the hours are real, the offer windows narrow, the
journal contains no reproach, and a save does not refill the counter.

**And the loss arrives by the human line (M226, 0.211.0).** When a named offer dies untaken the
door already closed silently; now, one visit later, the person who used to name you says one kind
line at the counter — ahead of the queue, ahead of story, once per door, ever — and never names
you again. The truth is not in the line; the world keeps offering cold. «Никто не сердится — вот
что тяжелее всего.» **And the offers deepen through the expedition (M229, 0.214.0):** for the
circular's sixty days the counter lives for the column («плечо в колонну», paying half again and
feeding the station's collection), naming runs at .70 instead of .45 — closed doors stay closed —
and the deepest access of the act is «имя в список», paying nothing and turning the departure's
greeting into «ЕСТЬ МЕСТО · ВАС НАЗЫВАЛИ». **Act IV is audible (M230, 0.215.0):** at three shut
doors the queue sometimes names somebody who is not you, and once per game one man says «Вы просто
не тянете» to your face — and the game confirms him with nothing, because he is wrong. **And the
yacht is built (M231, 0.216.0): the arc is complete end to end.** After a year of this life, with
a home to have a pier at and the invisible ledger full of what nobody counted, «Тихоня» stands at
your pier — key in the lock, no note, no price, no sale path, no word ever about why. The truth
is not spoken anywhere, and `91zzzf-offer` guards exactly that.

# The holding — built (M289–M298, 2026-09-02)

Design in `docs/DESIGN-holding.md` (§19 is the queue; numbers in §4, §9, §10, §16); why in
`docs/CRITIQUE-holding.md` (37 findings). Forks settled by the author on 2026-09-02: **1(б)** the
+X% surcharge stays and the share is never paid for surcharged units; **2(б)** the ПЕРЕПЛАВКА
recipes go; **3(б)** all 82 buildings and 48 materials designed at once with numbers; **4** the
fleet later (see "Open by design"). All nine steps shipped, one version each: the route as an
order (`12r-route`), «БЕРЁТ» (`12ab-hold`), site/hopper/`BLD` A–D (`12ac-bld`, `12ad-site`,
`26c-ui-station-site`), the ladder (`12ae-ladder`), the `91zzw` measurement, the own barge
(`12af-barge`), families E–I through `bldHas` (`12ag-holdfx`), the station body's first pass
(`17e-station-body`), news/rumours/rival barges (`12ah-holdnews`).

**Still open:** ~~the codex pass over the station body~~ — M306 (0.303.0): verdict holds, the
planet's dump/dome/strip drawn. Deeds with no counter yet (pirate bases boarded,
monuments, nodes) join the rung score when their hooks are written.


## Small tails from almanac issue II

- ~~Target chips against the ether bar~~ — measured since M302 (`91zzy-screens`).
- ~~The 44 px sweep over every screen~~ — written in M302 (`91zzy-screens`), both layouts.
- ~~«В ДОРОГУ» in the five doors~~ — argued on the record 2026-09-03 (`DESIGN-road.md`, Built §4);
  the door stays.

## Decisions taken on the author's behalf, so they are not re-litigated

- **2026-09-03, the author: «по остальным реши сам».** The cave keeps M217 (one height for the man
  everywhere; the camera stays); the drones keep selling at the nearest station and are never
  lost; `pair` for scenes lit by natural daylight is reported without a verdict (per-scene targets
  in `LOOK_TARGET`, M308); the fleet's names are our own — Короб, Кубрик, Воротник, a call-sign
  for the node, no name for the derelict (CRITIQUE-holding fork 4), «под расписку» rewritten
  without a book of debt, «груз в попутную» struck. Order after M305: M306 station body (§13),
  M307 home as a generator, M308 landing/day sky + map band + small tails, M309 system nebula and
  traffic, M310+ the fleet.

- The buyer of a route pays a **share of what it earned you**, not of a theoretical spread.
- **What is built is never for sale** — knowledge of a road can be, your mark on the world cannot.
- **Stale price notes are shown as a widening fork**: «титан 41…58 · записи шесть дней».
- **Only the player builds.** The factor and other people's barges haul along what exists.
- **`api.php` is left alone**; the client is proof against its `{}` → `[]`, and the conditions for
  ever touching it are written in `docs/DEPLOY.md`.
- **Naming register Б+А** (2026-08-31). Two earthly words stay on purpose — «Красный уголок» and
  «Столовая», with «Дружина» beside them: in a module at the edge of the galaxy they read as home,
  and that seam is what Soviet science fiction was made of.
