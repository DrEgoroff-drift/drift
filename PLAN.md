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

- **New lore rides existing channels (author 2026-09-04).** There is no encyclopedia and there will
  be none: «куска лора не существует, у каждого есть полезная выдача» (`12q`). A milestone that
  brings lore names its channel in this table before it is built — desk (ТЕТРАДЬ, КНИЖКА, ПОЛКА,
  ОТЧЁТ, ВЕЩИ, ДНЕВНИК, ПОЧТА/QSL/АЛЬБОМ), world (rumours `11t`, speech queues `11b`, retelling
  `12p`, the wall, the ledger, the trace, the first hour, the flea's provenance, the hundred
  stories). Mapping for the open queue: «Сорока» → a rumour image, the keeper's speech queue, one
  book on ПОЛКА («Судовой журнал без порта»), one ОТЧЁТ piece; matches → the hold's dismantle line,
  a new paragraph in the station charter book, matchbox labels beside the books; the cooperative →
  the house clerk's speech, the stamp in КНИЖКА, one line from the first-hour relief, the beacon
  saying the name; the beacon → its own channel (ЭФИР, voice in flight, a sheet on the cantina
  wall); holdings → retelling already writes them, the map shows them in place; biome landmarks →
  the organism scanner, a КНИЖКА entry via the institute, a pilot-book of biomes on ПОЛКА.

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

## «Сорока» — the wanderer queue (M340–M346 done — closed 2026-09-05; author 2026-09-04: «делай всё в соло»)

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

- **M341** (0.340.0) — done: the table «ОПИСЬ» (`27j-ui-opis`) — one cloth, four zones, drag or tap,
  ПРИБОРЫ panels that show the future, the hatch, matches in the corner; the ship screen and the desk paper
  НАКЛАДНАЯ are gone; prices live under the piles, on the map card and in the map's ЦЕНЫ list.
  Body in `docs/PLAN-archive.md`.

- **M342** (0.341.0) — done: «Сорока» in the world (`12v-wander`) — a 24-stop loop from the clock, the
  sail-ship parked at the lit limb, the approach, the rumour, the sky-watch line, the chart's sail glyph
  (`relicOn("chart")` finally read); the room is M343. Body in `docs/PLAN-archive.md`.

- **M343** (0.342.0) — done: the room and the shop — mode `wanderer` (`24c-mode-wanderer`, `-draw`,
  `26d-ui-wanderer`), the catalogue `WANDER_CAT` (`12v-wander-shop`: 14 tools with hooks, two papers,
  the wild card), counter B for raw and rarities, the cabin shelf on ОПИСЬ, the keeper's lines, «сорока»
  in `lookScenes`. Left out on purpose (no hook yet): cosmetics (M344), unique hull parts, Медный шар,
  Слепок печати, Вторая рука, Страница журнала, Список отказов. Body in `docs/PLAN-archive.md`.

- **M344** (0.343.0) — done: cosmetics — `12v-wander-shop-cosm`: 27 things in seven slots (8 exhausts with
  their own flames, 4 jump trails, 4 suit finishes, 3 visor tints, 3 hull marks, 3 light patterns, 2 docking
  chimes), each read by its painter and guarded by a pixel test; the casket on ОПИСЬ opens with the first
  purchase, wear by button or by dragging onto the hull/kit. Parrot accessories and the house crest wait for
  their systems. Body in `docs/PLAN-archive.md`.

- **M345** (0.344.0) — done: the locker (`12ak-locker`) — zone 5 ЯЩИК on ОПИСЬ while docked at rung ≥ 6,
  24 places (48 with «Второй ящик»), parts, piles and «Сорока» tools; 1 %/day of value taken lazily from the
  real clock, no debt; 30 days unvisited → parts resurface on any flea as «залог, за которым не пришли».
  Body in `docs/PLAN-archive.md`.

- **M346** (0.345.0) — done: matchboxes (`12ue-boxes`) — twenty hand-written labels, found in wrecks and
  containers, on the flea (a lot) and aboard «Сорока» (one match); the shelf at home says «коробков: N из 20»
  beside the books; no effect; the keeper mentions the full box of fifty and never sells it.
  **The «Сорока» queue M340–M346 is closed.** Body in `docs/PLAN-archive.md`.

- **M347** (0.346.0) — done: the map speaks in addresses (`18a-map-addr`) — the sector grid under the
  darkness law, rulers on top and left with your and the selected coordinates underlined, the header «ВЫ ·
  сектор x:y · «Имя»» / «сектор x:y · N секторов · J прыжков · d пк», empty cells selectable (no course into
  emptiness), rumour areas as hatched squares from `G.rumours`, rings «2/3 прыжка», the address field with
  the match button, every «сектор x:y» in game text tappable (`addrify`), the rose, and the wordless mark —
  a match from the wallet (`G.mapMarks`, ≤10). Body in `docs/PLAN-archive.md`.

- **M348** (0.347.0) — done: holdings on the map (`18b-map-hold`) — house patches (station ∪ 1-jump, two-colour
  hatch where houses overlap, darkness law, seen/heard beyond the edge), ГЛАВТРАССА as a double line with
  milestone ticks, a band under it and the name once along the longest leg, rusty hatch over occupied sectors
  with a brighter front at house patches, own frames, «сменился хозяин» tags fading over three days, a СЛОИ
  button (ВСЕ/ВЛАДЕНИЯ/ЦЕНЫ/СЛУХИ) in the map strip; pirates no longer hold or take sectors under the трасса.
  Body in `docs/PLAN-archive.md`.

- **M349 + M349a** (0.348.0) — done: «Маяк ГЛАВТРАССЫ» (`12pa-beacon`) — one bulletin per shift built only
  from causes (appetite tonnage, the player's over-norm sales, freed and «особый режим» sectors, scrip moves,
  holidays with a double fleet norm), poster head + dry lines, in ЭФИР, on the cantina wall and by the
  receiver's voice: browser `speechSynthesis`, ru-RU, quiet (.35), system voices per role chosen by name,
  crackle before and a two-tone after, ducked under combat, silent on desks and stations, settings in ЗВУК.
  Body in `docs/PLAN-archive.md`.

- **M350** (0.338.0) — done: the drone-miner (bottomless point, 9 000 cr by payback, one per yard/indust
  station per two days, ВЕРНУТЬ, sells within two sectors, guest drawn in the market system). The
  audit's trade «hole» was an artefact of open buying: in the game one buys only on a route leg
  (`12r`, M289), and a 3-pair route pays ~17 000 cr in three laps then waits for pressure to decay —
  the designed ~200 cr/min. Trade untouched. **Answered by M351:** counter buying opens with the cooperative, capped by rank, priced in slices.
  «Сорока» raw→matches re-priced to 40:1 with a 200-unit cap per stop before M343 (audit §3 H3).

- **M351** (0.349.0) — done: the cooperative (`12aj-coop`, `docs/DESIGN-coop.md`) — the exam by turnover
  (12 000), the stamp at a house station for 1 500 with a player-typed name, ranks I/II/III by turnover since
  registration and granted asks, the counter open to cooperatives only (sliced pricing per 10 units, caps
  60/150/none per visit), hiring only for cooperatives with `crewCap` by rank, the ДЕЛА page (members,
  per-shift ledger from `earn`, asks from composition pointing at family-G buildings, spirit 0…5 as words,
  ±1 % per point). Re-measured 2026-09-05 (`docs/ECONOMY-AUDIT.md` §6): the cap binds only when the hold
  exceeds it (Вьюк at rank I: 1 900 vs 2 400 cr/min on the opening laps); pressure, not the cap, is the brake
  from lap four on every rank. Body in `docs/PLAN-archive.md`.

- **M352 — one big thing per biome** (0.350.0, 2026-09-05) — done: `21b-surface-deco-biomes`, eighteen
  new large-form painters registered through `DECO_FN`/`DECO_KINDS`, every land biome owns a family of
  2–3 shapes at 5–12 astronaut heights, density raised to 2–4 per screen (cluster per ~1000 units plus a
  top-up to the norm on rough worlds), neighbours kept apart by height, the pad zone kept clear; the
  desk-side chips no longer overlap near-marks (`21e-surface-draw`). Judged by frames per biome. Not done,
  by decision: the jungle crown stays one painter (twin variant added), no second trunk build in
  `20-life`. Body in `docs/PLAN-archive.md`.

- **M358 — what the frame bakes** (0.356.0, 2026-09-05) — done: `tests/91zzzzy-bake`, the fourth
  suspect in the freeze hunt and the first one nobody had measured — the raster of the **live frame**
  (chunks, tiles, screen layers), which hangs on `G` and so was never seen by the `SYS_CACHE` suite.
  Two guards: the oven must not run every frame (a key catching the hour or the camera would bake a
  full-screen canvas per frame, invisible to memory and console alike — standing still the game bakes
  7 in 150 frames), and the level is pinned in **screenfuls** rather than megabytes (measured 26.7,
  ~85 MB at DPR 1; each store holds about twice what the frame draws, which is the camera's margin
  and is meant to be there). Nothing grows without bound: **the freeze is not in the raster.** What
  is left for someone: that margin costs as the square of `DPR*SCK`, so trading it against re-baking
  is a real decision, and an author's one.

- **M356 — the sky in storeys** (0.353.0, 2026-09-05) — done: from the author's photograph of a
  real sky («вот тебе облака, для планет, делай»). The frame there holds three cloud populations at
  once and the game had one: `19e-clouds` gains the **deck** (`deckSprite` — the layer overhead, drawn
  edge-on with a torn lower edge and no silhouette; per-world `cover`, raised by weather so rain no
  longer falls out of clear blue, baked lazily); one condensation line per tier instead of scattered
  heights; a rebuilt cumulus body (base row stepped by its own radii so metaballs merge, turrets over
  the middle, 288×168 bake, a cut edge); volume by self-shadowing along the direction of the star
  instead of the outline gradient; and the horizon chain. Three separate ways the sky outshone its
  own star (rim above the ceiling, shadow lighter than light, body at full light over large areas)
  were found by `91zzzzy-light` and closed by the same law — see PATCHNOTES 0.353.0. `test.ps1` also
  learned to wait for Chrome to release its output file.

- **M353** (0.339.0) — done: «Смена» on the desk (`12ud-smena`, text table generated by
  `docs/mksmena.py` from `docs/SMENA.md`), 72 predicates from SAGA-BOOK's hooks, nine new scenes for
  the post-0.163 mechanics. **Next (author 2026-09-04): the prose itself — «интересная, как игра, а
  не заметки».** The book is to be re-read as a critic and rewritten chapter by chapter in one
  livelier register (scene, want, obstacle, turn; dialogue over summary; the journal line as a refrain,
  not a crutch), starting with a sample chapter for the author to judge before the rest.
  The text stays in markdown; every rewrite runs `mksmena.py` and the suite.

## M354 — deep tests (0.352.0, 2026-09-05) — done

Author: «пиши глубокие тесты, все кликай, по интерфейсам, по логике, ищи баги». Twenty-six suites in
eight files, each a class of defect nothing asked about: a save whose fields are the wrong TYPE
(`91zzzzza`), the wall clock moved back three days / forward five years / a save stamped a year ahead
(`91zzzzzb`), every button pressed twice while broke and with a full hold plus «a button that left the
screen may not pay again» (`91zzzzzc`), the world out of its seed and nothing ephemeral in the save
(`91zzzzzd`), every key held alone in every scene with mode and state required to agree (`91zzzzze`),
the counter across the whole galaxy (`91zzzzzf`), the tap that reaches the control — `elementFromPoint`
instead of `el.click()` (`91zzzzzg`), and what grows over an evening in the page itself (`91zzzzzh`).

Four bugs fixed: `found`/`species` as an object threw out of `applySave` (white screen on an aged
record) and `zoom` as an object survived into `G.zoom`; on a phone the «Сорока» panel spanned the full
width over the rail, so КАРТА and МЕНЮ could not be pressed aboard the sail-ship, and the map's prompt
ran one pixel under the rail — both now off the measured `--railw`.

**The lesson worth keeping:** «В ДОРОГУ» is an ordinary button, so any sweep that clicks everything
enters the road companion, and `body.road` hides the whole page. `resetWorld` did not leave it — so
from that click on, every later suite measured an invisible page and passed. Two old assertions were
green only because of it. `resetWorld` now leaves the road and closes the menu and the desk, and a
guard suite in `91zzzzzh` holds it. A measurement that finds nothing to measure is a failure, not a
pass — new layout suites say so out loud.

Also: `test.ps1 -Size W,H` (a tall window puts the interface zoom at its 1.75 ceiling — a regime
nothing had measured; it is healthy), and the frame ledger judges only in the window its baseline
was shot in.

## M355 — does the button do what it says (0.354.0, 2026-09-05) — done

Author: «тесты на логику, каких никогда не делали: действие и ожидаемое поведение — верное или
нет; не «экран открылся», а зачем этот экран, что на нём можно и ради чего». Fourteen suites in
four files, all asking one question: not whether a control works, but whether it tells the truth.

- `91zzzzzi-promise` — the verb is kept, the price on the button is the price charged, and every
  tap leaves a trace (world, screen or word). **Found and fixed:** «ВЗЯТЬ ВСЁ» at the counter with
  an empty till did nothing and said nothing, while «ВЗЯТЬ ×N» beside it refused out loud.
- `91zzzzzj-why` — instruments show the world; every module level pays what its line promises; no
  technology is a signature without code; the prompt's promise is executed in every scene; the
  scoop fills the hold, which is what it is for.
- `91zzzzzk-fair` — the yard hands over the hull you tapped; no hull is dearer and worse in every
  number; module levels never cheapen; the game takes no money without a line in the journal.
- `91zzzzzl-gates` — a closed door names the cause (hiring, the counter, take-off without fuel →
  the evacuation and its price); every disabled button is explained by its row; refuel and repair
  charge exactly the advertised rate, and a pauper is told why.

Two laws out of the run: `planetSpin` fell back to the **wall clock** at `G.t===0`, so staged
scenes were irreproducible and the light/ledger suites flickered on «заход» — the world's clock is
used whenever there is a world; and **a word boundary does not work next to Cyrillic** in JS
(Russian letters are not word characters), so `/кр/` never matches «−17 кр» — a suite now holds
that nowhere in the game.

## M357 — hunting by search (0.355.0, 2026-09-05) — done

Author: «ищи ещё баги, как хочешь ищи». Four nets built on properties instead of case lists.

- `91zzzzzm-exploit` — splitting a deal never beats doing it whole; a buy-and-sell round loses on
  every station; and six hundred random sequences of ordinary actions with the clock STOPPED never
  make the player richer (worth priced at that counter's own prices). No holes.
- `91zzzzzn-doors` — the door matrix: every scene × every door, over a hundred cells, each checked
  for the mode/state pair, a living frame and a whole world on the way back, plus a save taken on
  the threshold. **The freeze is not here** — that is now measured, not assumed.
- `91zzzzzo-plural` — `pl3` over the whole hundred (11–14, 111–114), and the game's own text read
  for «number + word» disagreement without a dictionary.
- `91zzzzzp-balance` — the designed numbers are pinned to the documents that state them
  (CREW_YIELD, the locker, the cooperative, the spread, the drone-miner, the rank caps); a
  deliberate rebalance turns this red once and asks for the PLAN line to be updated too.

Still open for the freeze, and the cheapest next step: measure not time but WORK over a long
evening — `SYS_CACHE` size, the chunk store, the `screenLayer` cache over tens of thousands of
frames with system changes. If any of them grows linearly, that is the cause.

## M359 — the evidence, the hands, the things (0.357.0, 2026-09-05) — done

The state-and-rules half of a two-session hunt (the picture half is M358).

- **the frame guard stopped talking** — the same crash was announced once ever, so a crash that
  repeats every frame (which is what a freeze IS) left no trace after two seconds. It now reminds
  every fifteen seconds with the count; `91zzzzzn-doors` pins the contract. This may be why the
  author's freeze has never carried a «СБОЙ · …» line.
- `91zzzzzq-input` — the input layer had no suite at all: focus and tab-hide release the keys, a
  finger leaving a pad releases it, and the action edge lives one frame across a whole hold.
- `91zzzzzr-cloud` — boot never lets an older cloud record replace a fresher local one, takes a
  newer one, and survives ten malformed answers. (Both suites use a synchronous stand-in: a
  promise's `.then` lands after the report is built.)
- `91zzzzzs-quests` — every kind of deed has code that closes it; deeds do not double; the journal
  keeps its cap; an open deed has an address or an honest «адреса нет».
- `91zzzzzt-opis` — parts do not double or vanish across ten fit/unfit rounds; scrapping pays once;
  «за борт» throws exactly what was named and never people.
- `91zzzzzu-monotone` — what may never run backwards: the rung never falls for doing more, danger
  grows with distance (and is the same all round the ring), and a price flooded down stops at its
  floor and returns with time (measured on the market's own clock, not «a day»).
- `91zzzzzv-quote` — the quote does not lie: the row's breakdown («берут первые 6 по 41 кр») adds
  up to its own total, the total equals the money that actually arrives, the station's premium ends
  exactly where it was promised, and the cooperative's counter charges the slices it showed.
- `91zzzzzw-travel` — the evening measured along the ROAD instead of the clock: a hundred real jumps
  with docking and trade. Half the state is sparse by system (market, seen prices, places, holding,
  names), so it grows with travel and not with frames — an axis no suite had touched. The save stays
  readable, no map grows faster than the road itself, and `SYS_CACHE` stays proportional to the
  jumps (the state-side half of M358's raster question).
- `91zzzzzx-sound` — звук был единственной подсистемой без единой проверки: в headless нет
  колонок и автозапуска, настоящий `AudioContext` спит, и `sfx` выходит первой строкой. Стенд
  строит НАСТОЯЩИЙ `OfflineAudioContext` и приписывает ему «running» своим свойством — синтез
  идёт живой. Держит четыре закона: каждый звук из таблицы запускается и ГАСНЕТ (23 источника,
  23 стопа — иначе узел звучит вечно), выключенный звук и глушение «Дороги» молчат и не тратят
  голосов, полифония не переливается через VOICE_MAX, гул двигателя — один узел на весь полёт,
  и голос маяка не читает поверх экранов (только полёт и дорога).
- `91zzzzzy-alive` — третья ось вечера: не растр и не карты, а ЖИВЫЕ сущности. Пять тысяч кадров
  настоящего боя (система ищется, пока в ней не родятся пираты, иначе набор мерил бы пустое небо)
  — потолки держат все: пираты, выстрелы, дроны, новости, слухи, дела, обломки. И то, что
  принадлежало системе, уходит с ней: после прыжка ни один помеченный пират не летит следом.

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
  **P4 grisaille, spelled out (author asked 2026-09-05; the only craft item still queued):**
  today every chunk (`18c-chunks`: ground, rocks, strata, cave rock in `23a/23aa`) is baked in
  final colour — each drawer picks its own hue from `pal`, so a palette change means touching
  every drawer, and light and colour are entangled in one pass. Grisaille splits it in two:
  1. **Form bake in grey.** The chunk painters draw value only (0–255 luminance: mass, relief,
     shadow strips, edge light) into the chunk canvas. Every `fillStyle` in `drawGround`,
     `drawRocks`, `drawStrata`, the dig rock and the cave wall becomes a grey from the material's
     value ramp; `pal` is not read there at all. `GROUND_BAKING` already marks the pass.
  2. **Glaze pass in colour.** One function, `glaze(canvas, pal)`, maps luminance to the
     palette: a 256-entry LUT per material (shadow hue → midtone → light hue, not one hue
     scaled), applied once per chunk on bake through `getImageData`/`putImageData`, or via
     `multiply`/`color` composite when the LUT is a plain gradient. The LUT is keyed into the
     chunk store so a palette change re-glazes, not re-draws.
  3. **What comes free.** A world's palette becomes data (three ramps per material), day/dusk
     is a LUT swap instead of a re-bake, and the meter's `pair`/`tones` can be tuned per world
     without touching the drawers. Cast shadows (P5) drop into the grey pass naturally.
  4. **Measure.** `?g11` before/after on landing, dig, cave (the bake must not cost more than
     one `getImageData` per chunk); a parity sheet of three palettes on `/dev` from one grey
     bake; `lookAll` tones/pair per scene not worse than the 0.301.0 table above.
  5. **Cost and risk.** Two sessions: one for the grey pass and the glaze on `18c` + `07-planet`
     (ground, rocks, strata), one for `23a/23aa` (dig, cave) and the parity sheet. Risk: fine
     colour detail that today lives inside a drawer (lichen tint, ore glints) has to move to the
     glaze or stay as a small colour pass after it — list those before starting.

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
  a back wall, bones, ropes, tallies, a camp, branch-end finds. ~~Left: the lower lake hall is still
  79% empty by the meter~~ — struck by the author 2026-09-05 («пещеру тоже нафиг»): the vault is
  the vault; no second floor, no lake.
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
  screen; the fuzzer (M238) drives eleven modes with random input and finds nothing. **0.359.1: the logger is born first** (`01a-crashlog`, right after `VER`), so a build that dies on load reports itself — 0.359.0 did not, and the site lay for 25 minutes with an empty log. **Since
  0.359.0 the evidence ships itself:** every error of any kind, and every frame stall over two
  seconds, lands in `~/drift-data/crash.log` (`site/log.php`, PATCHNOTES 0.359.0). Next step is
  to read it after the next freeze: `ssh drift 'tail -n 50 ~/drift-data/crash.log'`.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and its
  body goes to `docs/PLAN-archive.md` in the same commit — done 2026-08-28 (M232–M246) and
  2026-09-02 (M247–M298 and the old queues, 97 → ~40 KB).
- ~~One order-dependent phone assertion~~ — chased and closed by M354 (0.352.0). It was two things
  at once: the prompt's hardcoded `right:128px` against a rail that is 129 wide on the map (now off
  the measured `--railw`), and `resetWorld` not leaving the road companion — after any click sweep
  the whole page was invisible and every later layout guard measured nothing.
- **Tests: three tiers since 0.359.3** — `test.ps1` = Node logic (325 suites, ~5 s) + one Chrome smoke;
  `-Browser` picture/interface (~30 s); `-Full` everything (~4 min, on request). Runner: Node + smoke, then the
  live-site check. Loose end: a pixel-fidelity net for the browser tier (reference scenes, three sizes) is the
  one thing that would have caught the perch and «РАКЕТА 0» — not built.
- **Tests: two tiers since 0.359.3** — `test.ps1` fast (~25 s), `-Full` everything; the runner runs full
  and then asks the live site (`data-alive`). Loose end: in the pane at 1280×800 «свет: звезда самое светлое»
  went red on Нейэль I (0.694 vs 0.536) while headless is green — window-dependent, worth one look.
- **The suite costs ~3.5 min, and twelve suites are the cost.** Timed 2026-09-05 (harness prints
  «САМЫЕ ДОЛГИЕ» when run with a real clock, i.e. in the pane, not under `--virtual-time-budget`):
  doors matrix 77 s (now folded with its save twin, 0.359.2), leaks/large-forms/fuzz/e2e 9–12 s
  each, the other 600 suites under a second. Author, 2026-09-05: «дохуя тестов … пусть смотрят
  реальные баги». The direction is not fewer assertions but cheaper scene set-up: `resetWorld` +
  `sc.set()` per cell is where the doors matrix spends its time; a scene snapshot/restore for the
  matrix suites would take it under 20 s. Not done — needs care, `resetWorld` is the isolation net.
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
  (0.311.0)**: трассы on the map, the rescuer's call, the drawing tails. ~~Left: 12 заявка (lend a
  hull for one run)~~ — struck by the author 2026-09-05: in play it is two buttons and a
  journal line; §18 closes on eleven interactions.
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
  judged on a staged chart). Issue III has no open law; the fleet has no remainder (the заявка struck 2026-09-05).
  §14 (трассы on the map) judged 2026-09-05 (0.350.2) on a staged chart with every station at rung 6:
  chain, ticks and band hold; beyond the jump edge they now dim to a third (the darkness law).

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
  release check. Author, 2026-09-05: «60 — хрен с ним, потом»; not before the release itself.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

## «Зачем лететь» — moved to `docs/PLAN-archive.md` (2026-09-04); its answer is Act I

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


# ~~The war — M360–M388~~ — closed 0.388.0 (2026-09-06); body in `docs/PLAN-archive.md`

Twenty-nine passes, all closed: the fight (M360–M363), the world (M364–M375), everyone
(M376–M381) and the Director's seven families of mechanics (M382–M388). Design stays in
[`docs/DESIGN-war.md`](docs/DESIGN-war.md) — §18 is the struck queue with what each pass measured
and what it deferred, and «Deferred» there is the only remaining war work; there is no separate
queue any more. Measured from M360 on: `prof()` with eight armed ships on the phone layout; the
pad row on the 44 px sweep (`91zzy-screens`); `91zzzw-chron` replay hashes browser vs Node.

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


# The base — queued (M390–M409, designed 2026-09-06)

Design in [`docs/DESIGN-base.md`](docs/DESIGN-base.md), 1512 lines, six parts: the diagnosis and the
nine source games §0–§1, the register and the clock §2–§3, the six gauges and the loop §4–§5,
modules §6, adjacency/merging/depth §7, people §8, the charter §9, the director §10, аврал §11, the
journal §12, консервация §13, the boundary with the holding §14, save shape §15, numbers §16,
**the planet as the difficulty §21**, **the nine laws of hardness §22**, the payoff §23,
**the one управляющий among a hundred §24, §34–§37**, **СВЯЗЬ — the base from anywhere §38**,
loss and recovery §39, **ПАЛАТА §27–§32, §40** (the layer's satire of registering as a sole trader
in Russia — the author's brief), **why a base is necessary, Part V §42–§46**, the self-critique §49,
**the two honest playstyles §50**, and **§51 — the settled forks and the queue in build order**.

Read §51 first: it holds every decision the author took on 2026-09-06 and the twenty passes in the
order they are built. `docs/DESIGN-winter.md` is a separate sketch — «зимовка» is its own survival
mini-game, not part of this queue, and is designed after M396.

**Author's decisions, 2026-09-06 (do not reopen):** scope **(a) — nothing is cut, all of it is
combined**; **one** управляющий per galaxy, hidden in a continuous distribution of about a hundred
candidates (§48), meetable on the very first interview; **no notebook** — the player judges by
whether the base works, heard over the receiver; a base can be lost and is **always recoverable**;
the joke is played **at maximum**, and §27's deadpan law is withdrawn; the real one **builds and
develops** the base himself; **playing by hand is a complete game with the higher ceiling** and
nothing is gated behind a manager.

**Handoff:** a fresh session takes the first open pass below, reads `DESIGN-base.md` §51 and only
the sections that pass names (grep `docs/INDEX.md`, then `Read` with an offset), builds, runs the
named suites and `test.ps1`, measures what the pass says, publishes to /dev, commits one version,
strikes the pass here and in §51. Unanswered forks keep the defaults listed in §51.

Five stages, each playable on /dev before the next starts:

- **A · хозяйство** — ~~M390 смена and `baseResolve`~~ (0.390.0, 2026-09-06: смена базы — это
  смена холдинга, ход смены — чистая функция от её номера, догон до 72 смен, глубже суток —
  арифметика и одна строка; журнал на 24 строки в десяти видах, и визит открывается им) ·
  ~~M391 воздух и вода~~ (0.391.0, 2026-09-06: две шкалы и две машины, лёд → воздух и вода,
  расход считают только люди; кончился запас — база встала и ничего не разрушила, снабжение
  кислородом и льдом её поднимает, консервация — кнопка на столе) · ~~M392 тепло, глубина,
  криоцех~~ (0.392.0, 2026-09-06: двусторонняя шкала из мира, машин, глубины и того, чем её
  сбрасывают; мороз держит воду, жара точит технику и в пределе останавливает бур; пороги выбраны
  по УЖЕ стоящей базе — она в первой ступени и лечится одним радиатором; глубина даёт буру +8 % за
  ряд; криоцех платит обещание `02-world`, и криоген возят между базами) ·
  ~~M393 харч и дух~~ (0.393.0, 2026-09-06: оранжерея с посадкой и бак со скверным вкусом, консервы
  и синтебелок с борта, дух как свод остальных четырёх шкал и настроение людей за ним; ниже
  четверти три смены подряд — один уходит на станцию, и его снова можно нанять).
  Playable after M391 (a base can be starved), a game after M393.
- **B · место и люди** — ~~M394 СВЯЗЬ и мачта~~ (0.394.0, 2026-09-06: база — канал на приёмнике,
  четыре уровня разборчивости, мачта на верхнем ряду, база зовёт сама на каждом прыжке, один приказ
  за сеанс и он может не дойти) · M395 люди в комнате · M396 соседство, залы, ствол,
  сетка 6×4 · M397 директор · M398 аврал · M399 устав.
- **C · тяжёлая игра** — M400 формуляр планеты · M401 девять законов · M402 развалина и возврат ·
  M403 плата и блокада · M404 the craft pass over the whole scene, with its own almanac issue.
- **D · человек** — M405 сотня и распределение · M406 охота · M407 он строит и развивает.
- **E · дело и мир** — M408 ПАЛАТА и станция платит · M409 опорный пункт экспедиции.

**Seams with the war (M360–M388):** no file is shared. `baseRaid` takes its attackers from
`13c-roles` when those land (M397 reads whatever shipped); a blockade closes a system's counters and
M403 answers it; a base overrun, defended or provisioned is an episode for the chronicle
(`DESIGN-war` §6). Neither queue blocks the other.
