<!-- docs/done/done-16.md — part 16 of 30 of the done work, in the order it was written; see README.md -->

## Closed 2026-08-28 → 2026-09-02 — one line each; bodies in the archive

Grep `docs/PLAN-archive.md` for the milestone number (header "Moved out of PLAN.md on 2026-09-02").

- **M247–M248** (0.243–0.244) — the home from inside; the cave narrower, with a light of its own.
- **M249–M263** (0.245–0.260) — the craft plan P0–P9: the meter judges masses; the postcard atelier
  over eight places; blue noise under every scene; the direction field `dirAt` (rock grain, flowing
  dust, nebula fibres); the patch stays a seam; drops catch the light; the stranger's lamp casts
  shadows; a turn reads the player's hand; Крапива; signs not letters; lichen grown; the wheel owns
  the world and the CUN table in the cave.
- **M264–M270** (0.261–0.267) — the critique marathon: the dead ДЕЙСТВИЕ button, the sun as a body,
  one orbit one line, strata horizontal, stars stretch on the move, corridor light, CUN in the
  mine, nine deed turns.
- **M282** (0.279.0) — nine wounds from the playtest of 30.08.
- **M285–M288** (0.282–0.285) — a save never kills the flight; the ДЕЛО screen; the cloud `{}`→`[]`
  bug and `asMap`; the desk is a desk; almanac issue II.
- **M289–M297** (0.286–0.294) — the holding in nine steps (see "The holding — built" below).
- **M298** (0.295.0) — three interface fixes: the table answers in the row, rumours with distance,
  jumps and НА КАРТУ, the map card as a footer line.
- **M325** (0.322.0) — the four effects: the lake with reflections and reeds, heat haze, chromatic aberration on hits, the live flare; `18d-postfx`.
- **M339** (0.336.0) — the holding judged by arithmetic instead of screens (`91zzzzy-hold`): nothing
  is made from an empty bunker, a shift's quota is eaten once and yields no more than a shift's
  output, the three-shift ceiling holds over a hundred shifts, and collecting conserves both ways
  (including a full hold, where nothing evaporates). Plus a seed knob for the fuzzer (`-Seed N`):
  its hands were seeded by a constant, so a long run only walked the same path further.
- **M338** (0.335.0) — the wintering and the sanatorium joined the scene list as well (fourteen
  scenes): both are whole modes that no instrument had ever driven. Staged through the game's own
  gates, which immediately surfaced a null dereference in `winTake` (`G.st.name` with no station).
- **M337** (0.334.0) — the boarding raid joined the shared scene list: `stepWorld` knows thirteen
  modes and the list knew eleven, so the one mode with a real projection was driven by nobody —
  not the fuzzer, not the frame meter, not one cross-cutting suite. Staging taken from the fps
  probe. Also de-flaked «репутация: у своих садятся стоящие», which asserted a statistical property
  from a single draw seeded by a two-day time bucket and went red at 03:00 with no code change.
- **M336** (0.333.0) — a baseline for the frame ledger (`91zzzzy-look`), and the instrument defect it
  exposed: the staged scenes were not reproducible. Planets orbit inside `SYS_CACHE` all session, and
  the «система» scene places the ship relative to a planet — so the same build measured contrast 0.88
  or 0.15 depending on how long the session had run, and the fuzzer's «one seed, same failure» was
  false for the same reason. A staged scene now rebuilds its system from the seed. Baseline measured
  on a settled frame (40 frames per scene, since M332 releases a left system's raster).
- **M335** (0.332.0) — «a perk without code is a lie», applied to every table the audit can read
  (`91zzzzy-names`): technologies, artifacts and buildings all have code behind them except one.

### Needs a decision from the author (new, 2026-09-04)

- **The artifact «Карта чужой руки» has no code.** Its lines promise «на карте видно, где торгуют
  редким» and «и то, чего там ещё нет»; `relicOn("chart")` is called nowhere, and it is the only
  one of the seven artifacts that is not wired. It was left unwired deliberately: rare raw material
  is not traded anywhere by design (`02-world`, M39 — «рынок их не берёт вовсе»), so «where they
  trade rare» must mean something else — a dock holding a rare hull, a bench with rare parts, the
  rows of the flea market, or the rarities of `12m-rare`. Whichever it is, it is a design decision.
  The audit carries one named exception until it is answered.
  **Decided (author, 2026-09-04): `docs/DESIGN-wanderer.md`** — the wanderer «Сорока»; the artifact
  shows its stop (line one) and its next stop (line two). Wired in M342 of the queue above; the
  `KNOWN` exception in `91zzzzy-names` leaves with it.

- **M334** (0.331.0) — someone else's clock (`91zzzzy-time`): every epoch stamp in the save shifted
  three days forward and thirty back, then the world lived on — no NaN, no negative or ballooning
  wallet, and the station's shift cannot be rolled back for a second appetite premium. Plus the
  autopilot suite: six approaches (every planet, the station, the star) all arrive, none dries the
  tank — which matters because an empty tank was a softlock until M331.
- **M333** (0.330.0) — the game reads its own source (`tests/91zzzzy-names`): every name called by
  string is checked against the table that owns it. `sfx("ok")` was called eight times from five
  modules and no `ok` existed — the confirmation sound had never played; written now. The station
  strip carried a dead `ПЕРЕПЛАВКА` button whose `smelt` appears nowhere else in the game;
  removed. The suite also guards resource keys, journal kinds and station tabs.
- **M332** (0.329.0) — the raster that piled up: `SYS_CACHE` kept every visited system's baked
  globe unwraps, light overlays and cloud sprites for ever — 28.9 MB per forty systems, growing
  linearly with no ceiling, which is the most likely explanation of the author's «hard freeze»
  (no exception, no console line, the tab simply stops). Systems still live for ever; their raster
  now lives only for the last six the player was in (`sysRasterTick`, called from `stepWorld`), and
  every bakery is lazy so a return costs one re-bake. Measured by `tests/91zzzzy-mem`: 4.8 MB per
  24 systems after the fix, and the document does not grow across twelve full rounds of every tab.
- **M331** (0.328.0) — the four questions of game QA as a suite (`91zzzzy-play`): can the player
  get stuck, does the game print money, are there dead ends, what happens after death. Four
  defects: being stranded in space with an empty tank was a real softlock (a tow now exists there
  too, sharing `evacCost`/`evacFrom` with the ground); the station's appetite (+35%) could be fed
  from that same station's counter (+6%), printing about a quarter of the price per round — the
  shift's quota now shrinks by what was bought there; `closeStation` and `repairCost` died when the
  docking was released under an open screen, turning the station into a trap; and the cloud/star
  law moved off the frame onto the paint (a lit cloud may not be brighter than its own star,
  checked across ten stars).
- **M330** (0.327.0) — three suites that measure the picture: places (`91zzzzy-place` — everything
  stands on the ground, the man is never inside stone, the pad is level and clear, the silhouette
  agrees with the collision box), physics (`91zzzzy-phys` — thrust/brake/fuel, the speed ceiling,
  Kepler, determinism of a re-entered world, no falling through the ground, drilling conserves —
  each checked at frame steps 1, 2 and 3, because the frame integrates at up to dt=3), and light
  (`91zzzzy-light` — night darker than day, nothing out-shines the star, halos fall off, glows
  breathe instead of clicking, nothing burnt to white). Two defects fixed: a boulder could lie on
  the landing pad (cleared within 54 px, cull after generation so no world shifts), and a lit
  cloud was brighter than the sun (0.85 against 0.79 — mixed toward pure white; now a step below
  the disc).
- **M329** (0.326.0) — eight cross-cutting suites (`tests/91zzzzz-e2e-life`): NaN in the state, the
  save's full circle from every scene, loss of a field on load, a save without any one field, dirt
  in the player's text, three thousand frames in one flight, everything clickable clicked, a late
  world, an evening across three systems. Three defects fixed: Вега's record normalised on load
  (a NaN comes back as `null` from JSON and killed the БАЗЫ tab), `exitDig` guarded against a
  mine that is already gone, and suite isolation — `resetWorld` now deletes every field the page
  did not boot with, with a suite guarding it. The frame guard's counter is read at the end of the
  whole run: a click handler's exception never reached any `try/catch` around `b.click()`.
- **M326** (0.323.0) — house marks as things: the station mark off the flare axis (video 03.09), the settlement sigil as a plaque by the door instead of a 1-px line on the wall; the mark itself redrawn as a shoulder dish; the flare smokes (`stackSmoke`); e2e suite `91zzza` (scenes not blank, buttons click, flare column by pixels, smoke monotonic); test report grouped in four.
- **M328** (0.325.0) — flame as one smooth body, no haze; autoland start above the ridge and look-ahead descent; cave prompt wins over the mine; cave mouth as rock outcrop; swimming with a ring, algae → organics; e2e suites 91zzzb/91zzzc (autoland every world, panel overlap, button text, swim, cave prompt).
- **M324** (0.321.0) — where a drone sells: the keeper decides from `seenPrices` within three sectors; caption, circle length, one line from him.
- **M323** (0.320.0) — the plant as a body: a dark mass under every form, the lit form over it; stem a step darker than crown.
- **M322** (0.319.0) — one `housePlan` for the home and the settlement's izbas; one material table; the settlement's chimney on the slope. Stand defect noted: `shot.py homeout/wallset` hang at load.
- **M321** (0.318.0) — the §9 walkthrough as a suite in both windows; the course as a state, «К ЦЕЛИ» in flight, the search circle that survives НАЗАД.
- **M320** (0.317.0) — smoke along `dirAt` streamlines (curl noise) for chimneys, hearth and the smelter; the smoke made visible at all; the sky-seam hunt closed as not reproduced.
- **M319** (0.316.0) — the ship's zoom floor .35; the home interior measured by `?g11` (60 fps, no bake needed) and `prof()` caught measuring the software raster.
- **M318** (0.315.0) — the fleet's small parts cast shadows on the body, the рефрижератор's ribs as corrugation, трассы on the map as a chain; almanac III closed.
- **M317** (0.314.0) — the fleet at meeting distance: the six items of almanac III paid (label, zoom ceiling, учебное spine, паром wing, greys a step down, emblem grammar).
- **M314** (0.311.0) — fleet tails: трассы on the map (§14), the rescuer's call to a barge in distress, wing tiles, the hospital's cross, larger names.
- **M313** (0.310.0) — the node station «УЗ-1» from rung 25, the black derelict in dangerous empty sectors, the caravan (pirates keep off, fleet pace).
- **M312** (0.309.0) — the whole fleet drawn (thirteen classes), почта, ransom through the hospital at half, the school.
- **M311** (0.308.0) — the fleet's second pass: joints (§8), whiter hulls, сторожевик/паром/плавбаза drawn, буксир/плавбаза/сторожевик services, convoy hides you from pirates.
- **M310** (0.307.0) — ГЛАВТРАССА opens: `12ai-fleet` with thirteen classes and voices, the paint pipeline, почтовик/танкер/буксир drawn, passage by the ladder, позывной and заправка по норме; almanac issue III.
- **M309** (0.306.0) — the system: nebula blots fan out with filaments and a dust lane; shuttles station ↔ planets by rung (`17f-sys-traffic`).
- **M308** (0.305.0) — the approach by day (warm horizon glow on the sun's side), the map band in two value steps, `pair` without a verdict for daylight scenes.
- **M307** (0.304.0) — the home: furniture out of material by a `fillRect` wrapper, the house out of a seeded plan with signs of habitation by tier.
- **M306** (0.303.0) — the station body held against §13 (verdict: holds, ALMANAC addendum II); the planet changes too — dump, dome, strip on the day side (`drawPlanetWorks`).
- **M305** (0.302.0) — the cave as a place: round rock by smoothed marching squares, a back wall with a body, bones/ropes/tally/camp/branch-end finds; `docs/shot.py` for headless frames and meter numbers.
- **M304** (0.301.0) — the picture queue as one release: cave to zone I–II with cold glazes baked into the tile, sky brush and `hueToward`, landing horizon and altitude zenith, home panels/boards/study window, station sprite with one light, base halo, rain on the ground.
- **M303** (0.300.0) — playtest tails of 02.09: the cantina's ВЫСЛУШАТЬ works, station rumours persist as logged, the desk opens over a station (СТОЛ in the header), the home beacon undocks first, the desk lamp ignores grey and ether lines, the parrot's feather layer is sized by the bird box and the perch is off the screens.

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

## M341 — the table «ОПИСЬ» (0.340.0, 2026-09-05) — body as planned, then what was decided while building

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

Reference picture of the table: the author's mock (chat, 2026-09-04) — dark wood desk, green cloth,
zones numbered 1–4, «ИНСТРУМЕНТЫ «СОРОКИ»» shelf top-centre, «КОСМЕТИКА · шкатулка» top-right, round
hatch bottom-right with the hint «перетащи, чтобы выбросить», footer hints «Перетащи предмет на нужное
место · Перетащи на люк, чтобы выбросить · Части выше добротной требуют подтверждения». Reproduce the
layout in the game's own language (procedural canvas + desk DOM), not the render's textures.

**Built as written, with these decisions taken solo (author asleep, «делай всё в соло»):**

- The station's ОСНАСТКА «ОТКРЫТЬ» opens ОПИСЬ *over* the terminal (the author's entry-points
  paragraph), so `#shipview` and its КОРАБЛЬ/СКАФАНДР tabs are removed entirely rather than kept as a
  second instrument; `27-ui-ship` keeps only `hullSilhouette` (the painter ОПИСЬ uses) and the options
  screen. `kitBlock` died with the suit tab; the doll (`drawKitFigure`) stands in zone 2 beside the
  laid-out kit — the cosmetics of M344 will need it.
- ПРИБОРЫ shows eleven lines, not the author's eight: корпус, бур and урон were added because a part
  whose only affix touches the hull would otherwise move nothing on the panel, and a «future» that
  can stay silent is a lie.
- Card buttons are hidden until the card is selected (tap) or hovered (desktop with a mouse): the
  cloth stays a cloth, the phone gets its three buttons under the item, the fuzzer still finds them.
- Prices: `priceBestOf(k)` (seen beats heard) feeds the pile cue («виденное: 22 кр · 3:-2 · 2 прыжка»,
  tap = course), the «трюм стоит около N» line, the map card rows (own cargo amber, best bold, «со
  слуха»/«нужда» marked) and the map's ЦЕНЫ rail button → `#pricewin`, a list with КУРС per row.
- People are never thrown overboard: the ЛЮДИ pile has no hatch and no button (`opisCanDump`).
- Found and fixed on the way: `scrapYield` had no pool for `missile`, so dismantling a launcher threw
  («pool is not iterable») — the fuzzer's button sweep hit it the moment the button became reachable;
  `resetWorld` did not reset `G.matches` (M340 left it out), so matches leaked between suites.
- The cloth's grid areas must be rectangular: the first layout gave `parts` an L-shape, Chrome dropped
  the whole `grid-template-areas`, and every zone landed in one implicit cell. `side` (the future
  locker of M345) is an empty named area on purpose.
- The hull canvas draws at the aspect of its grid cell (`clientWidth/Height`), not a constant: a
  420×190 drawing stretched into a tall cell read as a rotated ship on the first frame.

## M342 — «Сорока» in the world (0.341.0, 2026-09-05)

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

**Decided while building:** there is no `WORLD_T0` and no per-save world seed (stars are the same for
everyone), so the loop is seeded by a constant and its zero is `WANDER_T0 = 1 Sep 2026 UTC`. The
reachability rule «station of `rungOf>=6` within 4 jumps» could not be used as written — `rungOf` is
the *player's* ladder, not a world property, and scanning neighbours would grow `SYS_CACHE` by
thousands of systems — so an inhabited stop is a system *with* a station and a dark stop one without;
the loop is an ellipse around the core (radius 6…20 sectors, tilted by the seed) snapped to the nearest
fitting star within ±3, which gives 3–5-sector hops and two home passes per round. The ship parks nose
to the star at the lit limb; the four gores hang from the cross yard toward the bow and sway on
minute-scale sines; the last hour of a stop turns the whole hull toward the departure heading; the first
six hours of a hop show a receding glint from the departed system. The shuttle arc is shared with
`17f` through `drawShuttleArc`. The dock action calls `openWanderer()` when M343 defines it and until
then says «трап ещё не спущен».

## M343 — the room and the shop (0.342.0, 2026-09-05)

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

**Decided while building:** the catalogue holds only what has a reader today — fourteen tools
(`wanderHas(id)` read in `08-state`, `11t`, `11ak`, `12s`, `12ua`, `12x`, `17-mode-system`, `12aa`, `27z`
and the shop itself for the needle), two papers (Карта области → nine `loreMarks` around a far station;
a missing book through `bookFind`) and one wild card (ask: a spare part of tier ≥ 4; gives an artifact
you lack while you hold fewer than three, else a rarity you lack — granted directly, the ship «was where
you were not»). Cosmetics wait for M344's painters, unique hull parts for a part-painter mark, Медный шар
for a mail-hop model, Слепок печати and Вторая рука for their systems, Страница журнала and Список отказов
for an inverse of `rareAtPlace` (places → rarity exists, rarity → place does not). `rungOf>=6` as a
world property did not exist (see M342). Tools work only from the six-place cabin shelf (`G.wander.shelf`),
the rest lie in `G.wander.hold` with «НА ПОЛКУ» on ОПИСЬ — the locker of M345 is the next home. The
shelf per stop is eight positions (four at a dark stop) seeded by the epoch; a bought position stays as a
chalk tag. Counter B: 40 volatiles/icecrys/alloy → 1 match, 20 techcomp → 1, 200 units per stop, whole
matches only; a rarity shown pays 4 once and stays yours. The room is one-point perspective with the
counter at depth .74 and the keeper ≈55 px; the skylight is drawn on the ceiling plane in perspective
because the first frame had it under the vitals. `openWanderer({force:true,epoch:0})` is the stand's door,
so the frame meter's «сорока» does not drift with real days. Departure while inside puts you back at the
porch with one line; the keeper's match flash fires once in the last hour.

## M344 — cosmetics (0.343.0, 2026-09-05)

- **M344 — cosmetics** (`G.cosm={exhaust,trail,suit,visor,mark,lights,chime}` persisted; applied
  by dragging from the шкатулка onto the hull or the kit in ОПИСЬ). Hooks: exhaust colour/shape in
  `16-flight`/`16a-space` flame (8 named exhausts, each its own flame shape), jump trail in `16`,
  suit finish + visor tint in `20-life` astronaut painter and the kit doll (`12x-suit`), rare hull
  marks via `03d-hull-marks`, nav-light pattern in `03e-hull-draw`, docking chime in `09-audio`.
  Parrot accessories through `12x-parrot`. Test: each cosmetic id changes at least one pixel of its
  target painter (render to an offscreen canvas, compare).

**Decided while building:** the state is `G.cosm={owned:[…],exhaust,trail,suit,visor,mark,lights,chime}`
(a slot holds one worn id; an id from a save that is not owned is dropped on load). Painters read their
own cosmetic where they paint: `drawExhaust` (colours, length, width, `twin`/`ring` shapes), `drawTrail`
(`cosmTrail` recolours edge and middle, the core stays white), `kitPalette` (`cosmSuit` paints all five
places, the lamp keeps its own), the doll's and the walker's visor (`cosmVisor`), `03e` nav lights
(`cosmLightOn`: steady, double flash, alternating), `drawStencils`' neighbour `drawCosmMark` (plate,
stripe, star), `openStation` (`cosmChimePlay` → two new SFX, `chime` and `bell`; default docking stays
silent as before). The shelf plan gained two cosmetics per inhabited stop (one at a dark stop), prices
6–20 matches. Buying wears the thing if its slot is empty, else it waits in the casket; ОПИСЬ's casket
opens with the first purchase and lists owned things with НАДЕТЬ/СНЯТЬ, and a dragged thing lands on the
hull (exhaust, trail, mark, lights, chime) or on the kit (suit, visor). `91zzzzh-cosm` renders each
painter to an offscreen canvas with and without the thing and fails if fewer pixels change than a
threshold — the same law as «a perk without code is a lie». Left out: parrot accessories (the parrot
face is a 42 KB table module, its own pass) and the house crest (needs a chosen house).

## M345 — the locker (0.344.0, 2026-09-05)

- **M345 — the locker** (`G.locker={items:[],res:{},t}` persisted). Fifth zone of ОПИСЬ that slides
  in while `G.mode==="dock"` at a station with `rungOf>=6`: 24 slots, parts + piles + tools. Fee
  1 %/day of contents' value taken lazily from `Date.now()-t` (the `tickDrones` model); 30 days
  unvisited → contents go to the flea as lots «залог, за которым не пришли» (`12ua` provenance).
  Ease «Второй ящик» doubles slots. Tests: put/take round-trip, fee arithmetic under the shifted
  clock, the 30-day hand-over.

**Decided while building:** `G.locker={items:[{p:packPart}|{tool:id}],res:{k:n},t}`; a pile takes one place
per resource, a part or a tool one place each. The fee is 1 % of the contents' value per real day
(`lockerValue`: parts 60+140·tier, tools 25 matches-worth, raw at market), taken lazily on the next
visit in whole days; when the till is short the fee takes what there is and stops — no debt book, the
same decision as the fleet's «под расписку». Thirty days without a visit hand the contents over: parts go
to `G.flea.pawn` and surface first on every bazaar as lots «залог, за которым не пришли» (kind `part`,
who «конторы перевозок», price 28+34·tier, bought like any lot and removed from the pawn list); tools
and raw are lost to the office. The zone sits in the cloth's `side` area (between the casket and the
hatch), drag a spare part or a pile onto it, or press «В ЯЩИК» on the card; tools on the shelf and in
the hold get «В ЯЩИК» too. People are never stored. «Второй ящик» is a «Сорока» tool (24 matches).

## M346 — matchboxes (0.345.0, 2026-09-05)

- **M346 — matchboxes** (`G.boxes=[ids]`): ~20 hand-written labels (one line each, like `BOOKS` —
  a table, not a generator), found in wrecks/flea/aboard; shelf at home next to the books,
  «коробков: N из 20». No effect. A full box of 50 is a keeper's legend, possible wild card once.

**Built as planned:** `BOXES` is a table of twenty labels (name in guillemets plus one line about the
factory), `G.boxes=[id…]`, `boxFind(seed,where)` walks the table from the seed's start and takes the
first unowned — the same law as the books, so a place always gives the same box; `boxRoll` at 26 % in
hulks and 16 % in containers (below the books' 40/24, or the shelf fills in an evening). The flea rows
grew a kind `box` (9–17 scrip) while boxes remain; «Сорока» sells «Пустой коробок» for one match as a
third paper, and the papers now shuffle per epoch instead of alternating. The desk item ПОЛКА is live
with boxes alone; the shelf prints the count and the labels as small tilted boxes with a red striking
edge. The full box of fifty is one more idle line of the keeper; the «possible wild card once» was
not built — the wild card already has two honest gifts and a third would be a lottery.
