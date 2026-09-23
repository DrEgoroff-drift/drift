<!-- docs/done/done-27.md — part 27 of 30 of the done work, in the order it was written; see README.md -->

## Moved 2026-09-23, the design pass

### DESIGN PASS — the queue (the author 18.09: «дизайн проход прям с этапа 0»; start it with «давай дизайн проход»)

Everything Control built from Stage 0 on is a working draft; the picture is the Designer's. A new
session that hears «давай дизайн проход» starts HERE, top to bottom, one item per commit. Method
for every item: read the craft codex (`docs/DESIGN-craft.md`) and the art-direction memories; a
frame BEFORE on the phone layout (390×844, own headless Chrome, or the S23); self-critique in
passes (draft → critique harder than a stranger's → optimise); fix IN THE GAME, never in the frame;
a frame AFTER; a sheet before/after to the author; the check that can be a test goes into tests.
Remove the item's «[design owed]» marker in its stage when done. Phone cadence is not this pass's
job (the phone milestone), but no fix may add raster cost without a number.

**Stage 0 — the frame**
- [x] **D1 The baked hull and star core — done 18.09 on the S23.** Bake A/B at ×8: no step at the
  edge, nav lights and nozzles sit on the bake; the core breathes (47 k px change over 5 s). What
  was ugly was the star's four rays: one hard-edged wedge each, a paper strip a thousand px long
  by a giant — now three nested wedges (edge .11 rad at .28, axis .04 at 1). Left: the giant's
  corona washes the whole phone frame one orange (pair 0) — legitimate up close, no rim light on
  the ship; if it bothers the author, a cool rim on the hull from `lightDir` is the next step.
- [x] **D2 The tails — done 18.09 on the S23.** Found on the phone: under the finger the main
  engine fires only while accelerating (135 of 266 frames), at cruise the assist holds speed with
  thrust at zero and the ship flew with NO plume — towed. Now the helm reports `idle` (assist, no
  main, speed > ¼ cruise) and `trailStep` keeps a sustaining plume at .42 span, .72 radius, same
  lane. The wake: `WAKE_LIFE` 60/200 → 40/80 and the core fades by u⁴ — the three rails no longer
  run into the HUD; the author's length pick (A–D) never came, so this is the Designer's: the
  bright third ≈ 200 px at ×1. The stick's filled band .44 → .32 (it read as a solid cup on black).
  Test `кильватер` retuned to 700–1400 units.
- [x] **D3 ×1.5 in flight — the author's call 18.09: «темнее не надо».** The switch stays OFF
  (`G.opts.gfx.resByMode`); the sky keeps its light. Closed.

**Stage 0b / 1 — the interface and the finger**
- [x] **D4 The station header — checked on the S23 18.09.** One row and the paper СТОЛ tag were
  already in; what the phone showed: the row cut off at «КОРАБЛ» with a flat edge (the fade mask
  lived on `nav.tabs` only — now on `nav.groups` too, off when scrolled to the tail), and on an
  empty hold the market opened with four grey caps blocks before the first price — the empty
  hint now sits in the ТРЮМ line («ПУСТ — ПЛАНЕТА ИЛИ ПОЯС»), one block fewer. The board reads.
- [x] **D5 The hail — checked on the S23 18.09.** The window's safe/risk colours were right; the
  PAD was not: under a hail the ДЕЙСТВИЕ pad is `.ready` and its `breathe` animation painted the
  ring amber over the consequence colour — a dangerous «ПРОХОДОМ» breathed like a recommendation.
  Now the ready pad breathes red (`breatheRisk`) or phosphor (`breatheSafe`) by `data-hail-act`.
  Picket brackets (helmDrawMarks, M360) not re-judged here — no picket in the forced frame.
- [x] **D6 Under the finger — done 18.09 on the S23.** shipZ measured .8 / 1.04 / 1.4 at ×1 /
  ×2.4 / ×4.5 as P8 set it; the dead-zone СТОП ring reads under the thumb; the finger band is
  lighter since D2. The edge wall had NO picture — the anchor turned the ship and only a line said
  why; now `drawEdgeWall`: the rim fades in over the last 900 units as a wide soft band and a
  dashed line in the compass teal, with a breathing «упор» spot where the ship leans on it. The
  orbit body in frame (BODY_CAM) left as built.

**Stage 2 — whose land**
- [x] **D7 M459 the approach — done 18.09 on the S23.** The buoy was a dark cylinder with a lamp
  beside it — a bin. Now an instrument: lit body with a shaded side, black-and-yellow belt, red
  reflector, mast with a radar cross and the lamp in a cage; the lead lamp's glow 8+14 → 7+22 so
  the chase reads as runway lights. Queue ships against the station (≈¼ of it) read right; the
  order — ellipse, one landing, one leaving — left as built.
- [x] **D8 M452 the gesture ×6 — checked on the S23 18.09 (gt, or, co forced at the entry).**
  The character is there: the patrol with its cone, the scan line across the whole frame, the
  Коммуна board on its truss. Two things were too faint on the phone: the Компания screen drone
  was a 30×12 px colour crumb — ×1.35 now; the ГЛАВТРАССА spotlight cone .20 → .30. The post
  boards' lettering reads at ×1. km/ra/hf not re-judged this run.
- [x] **D9 M453 the stamp — done 18.09 on the S23 (all eight forced into the book).** The page
  reads as a document: tilted ink frames in each power's colour, the Компания slip as a white
  paper, the ×N counters. Ink grain skipped — at phone size it would be noise.
- [x] **D10 M454 the station by its builder — done 18.09 on the S23** (six
  captures with the ship re-placed by the orbiting station before each). The plate's ground went
  .12 → .2 and now reaches the core trunk (gradient mixed .3 with `makerGround`) and the solar
  panels (.22): Рассвет reads ochre, Компания white, Хай-Фронт pale, Коммуна blue-grey, Орднунг
  dark; the trade containers and the indust hoppers take the ground too (.3). Done.
- [x] **D11 M447/M448 the galaxy on the map — done 18.09 on the S23.** The home frame reads; at
  ×2.5 and ×5 the per-system glyph (halo, rays, station ring) stayed ×1-sized while the cell shrank
  to 9 px and a thousand glyphs made grey soup — the glyph now scales with the cell (`gk` =
  cell/45, floor .35) and fades to .4, station/belt rings off under 16 px: the arms and the bulge
  read at both. Bulge cap and speck colours left as built (they read once the glyphs stepped back).

**Stage 3 — far**
- [x] **D12 The ten far goods — the ТРЮМ piles done 18.09 on the S23; the reading 23.09.** All ten (and the amber
  chip) lay as same-shaped balls in different colours; now each is its own object in `holdPiece`:
  cryo cylinder (He-3), plate stack (palladium), drop with an inclusion (amber), heavy cube
  (osmium), sack with a sprout (chernozem), flask with filings (magdust), pearl in a shell,
  obsidian shard with one cold glint (dark glass), trap ring with a spark (antimatter), lead capsule
  with a yellow mark (neutron), amber chips. The wheel (§4.4) judged 23.09 and left: the ten already sit
  on ten hues AND ten shapes; the review's bone and pale gold were written for a dark hold and vanish on the ОПИСЬ cream paper (and `col` is the UI text colour too). The reading: `farReadShow` hangs an instrument plate for 6.5 s under the belt's entry text — each deposit a scale with its range as a lit band, the header naming the instrument's honesty (изыскатель ±10 % … рудовоз ±60 %): a good instrument is SEEN as a narrow band. ЖИЛА across the screen checked on the S23 18.09 — the orange stamp reads.
- [x] **D14 The blueprint — the ОПИСЬ view done 18.09 on the S23.** `drawPlan` is now a синька:
  Prussian blue with millimetre grid, white-ink cell lines, the hull outline thick along the
  edges with no neighbour, the hold hatched, parts as ochre stamps with a kind letter
  (О Щ Д К Р У П М), «СОГЛАСОВАНО» double-boxed in the corner. Same brush serves the КБ. Left:
  ~~the turret on the back in flight (M479)~~ — judged 18.09 on the S23: the cross read as a sight; now a bolted barbette, a domed turret lit from one side, a mantlet and the barrel over the dome.
- [x] **D15 Stage 5 voice — the tape done 18.09 on the S23; the drone's plate 23.09.** The strip was grey on grey; now
  black electrical tape with a glossy edge, a shadow under it and a folded tip, slightly wider —
  reads at ×4.5. The drone in both lists (ДЕЛО, the station's drone rows) is `droneTag`: a state lamp (green runs, amber in repair, red stuck under pirates), the name stencilled in the cargo colour on a riveted tin plate, the board number small, the quirk pencilled on a paper tag (none for «норма»).
- [x] **D13 The railway — checked on the S23 18.09 at «Луун»; map and ride 23.09.** The ring with its spiral, the
  dashed glide path and the «ЛИНИЯ 6-12 +2» label read in the system; the vestibule page (board,
  fares, life rows) reads. The map lines, judged at ×0.6/×1/×2.5/×5 with the whole net built (a stand
  shows 12 of 95 lines — `railNetPartial` builds one a frame): far out they are the right faint scaffold, but at ×1, where a route is planned, they vanished — now weight grows with the cell (`k=(cell-14)/34`): a dark casing and a denser core, metro-style. In the ride the other lines stay pale (`drawRailMap(...,pale)`, as M473 wrote) and the own line is a rail — casing, the scheme colour, a light centre line.
- [x] **D26 Giants — done 18.09 on the S23 (all seven captured at ×0.28).** Each body is now
  baked once (1500×900, 1 px per unit) by the room rules: mass → seams/rivets → a human-scale
  detail (landing strip at the moon's mouth, the hotel's parking row and marquee bulbs, the
  cylinder's porthole row and dock, the customs barrier and a stamp on every form-house, cranes
  on the dry dock and half the hull without plating, lamps along the town's street, mast shoes on
  the garden's platform) → one light from the star's side (`source-atop`). Live on top: the
  garden's blink, the moon's beacon, the hotel's red «МЕСТА ЕСТЬ», the cylinder's running light.
  The map mark is a glyph per giant (moon, slab, pill, grid, dock bracket, peaks, masts). Left:
  the ruler in the frame, docking/visiting — those are M464's open tails, not design.
- [x] **D25 Paper and stamps — the passport done 18.09 on the S23; the ПЛАН on the sign 23.09.** The passport was not on
  any page at all (only in fares); now a bordeaux cover with gold lettering under the stamp grid
  in КНИЖКА while it runs, with «до N смен». Then 18.09 later: the transit plate on the flank (`drawTransitPlate`, yellow with two black lines by the stern, baked with the hull), and M482's scars drawn on the hull (`drawScars`: burn patch, bent edge, leak streak). The ПЛАН on the ГЛАВТРАССА sign is a decree, not an ad: while `gosBbPlan` holds, the ticker gives way to a kumach panel with a gold star and two lines that STAND («ПЛАН: 18 ЕД. …», «ДО СВОДКИ · ПО · СДАВАТЬ ЗДЕСЬ»); ~~the recall letter~~ — done 18.09: a `recall` thing in ВЕЩИ with a Хай-Фронт header and a red «ОТЗЫВ» stamp.
- [x] **D24 Railway life — rows done 18.09 on the S23.** The parcel is a paper tag with a hole
  (dashed edge, ochre), the pass a card with a punched row, the passenger a phosphor silhouette
  before the line. ~~Left: the подстаканник for the tea row, the seal drawn on the hold in flight~~ — done 18.09: the Рассвет buffet button carries a glass in a lattice holder with a handle (CSS), the Орднунг seal is a lead disc on wire over the hold hatch at midships (`drawSeal`, in the bake key).
- [x] **D23 Album — the page done 18.09 on the S23; filters and the saved page 23.09.** The lightbox is a black album page with
  paper grain, the card sits in four corner mounts, the caption is white-pencil italic serif under
  the photo. The filter chips are thumbnails: the card drawn ONCE small, the five filters
  applied to copies (one repaint + five nail-sized pixel passes, not five repaints). СОХРАНИТЬ СЕБЕ writes the album page itself — dark grained paper, the card in a cream frame on four mounts, the caption in white pencil.
- [x] **D22 Rented core — the card done 18.09 on the S23; the adverts 23.09.** The three tiers are one glossy
  Хай-Фронт card (`.rent-card`): cyan-edged, head with the ◉ mark, tariff rows name / price /
  note, role buttons under each, the «спасибо, что остаётесь с нами» foot. The adverts in «Что он говорит»
  are `mgrSay(...,"ad")`, drawn as glossy Хай-Фронт inserts (`.mg-ad`, a blue РЕКЛАМА label); old saves' «Реклама: » lines are caught by prefix.
- [x] **D21 Special systems — done 18.09 on the S23; the two effects judged (23.09 re-read: closed).** The charge ring is 4 px
  with a bright head at the arc's end; when charged the pad carries «ДОЛГОЕ · ФОРСАЖ» above it (it
  dims with the pad's own `.off` opacity — acceptable, reads on a dark sky). Effects: ФОРСАЖ
  lengthens the plume ×1.7, СБРОС leaves a crate where it was thrown, СИРЕНА sends two rings; the
  cutter beam and the searchlight cone were already drawn. Left: the salvo flash (ЗАЛП fires the
  guns, which flash themselves) — judged enough; БАЛЛАСТ has no picture (it is a number).
- [x] **D20 Барахолка** (M463) — done 18.09 on the S23: the hulks are real hulls from the table, dead under a dark film, moored at their angles; each carries a sagging canvas on two poles; the lamp strings swing lamp by lamp; the stall window is a table with a header and alternating rows, sold struck through.
- [x] **D19 Подписка** (M487) — done 18.09: a red «ЗАБЛОКИРОВАНО» seal stamped across the locked instrument's row in the shop, the «тариф обновлён» mail as a glossy white-and-blue letter in ВЕЩИ.
- [x] **D18 Scars** (M482) — done 18.09: `drawScars` anchors each scar to its place on the blueprint — the burn on a deck cell, the kink at a gun mount, the leak by a stern cell; «корпус помнит» rows under ПРИБОРЫ in ОПИСЬ name the scar and what it costs.
- [x] **D17 Космопочта** (M492) — done 18.09: the notice paper carries a drawn window — grille, the clerk under a warm lamp when open, a lowered shutter with «ЗАКРЫТО» when not, the clock above on post time, the hours plate on the wall, the printed talon when a notice waits; «распишитесь» stays the collection line.
- [x] **D16 СТАПЕЛЬ** (M481) — done 23.09 (solo, headless 500 px): `stapelSheet` (`26e2-stapel-draw`) lays the order on a slipway sheet — concrete slabs in the maker's ground, rails on sleepers, raked timber shores, keel blocks, a gantry crane, two hard-hats for scale, one lamp in the corner, white-ink dimensions measured from the hull's PIXELS (`stapelHullBox`: nose spikes and pods overran `halfW` by up to a third), the power's emblem. In work, the hull is plated from the stern by the share of the shift, the rest a red-lead frame with a weld spark under the crane; ready — a red «ГОТОВ» double stamp, and ЗАБРАТЬ throws a «ГОТОВ» stamp across the screen (`stapelFx`). Sliders are boxwood scales with a red-hair cursor, 44 px; the numbers are a delta strip against the ship you fly with the place in the class corridor; class and size chips 44 px.

## Moved 2026-09-23, closing 0.456.0

### The frame is bistable — the leftover body (withdrawn 18.09)

  30 s runs on one build with the same steering: 79.9 / 99.7 / 82.3 / 80.1 / 82.2 / 81.2 % cadence
  at 50.0 / 59.8 / 50.9 / 50.0 / 51.0 / 50.5 fps. **There are no intermediate values** in any of the
  evening's twenty-odd runs: the game either runs 60 frames at ~100 %, or 50 at ~81 %, and once it
  is in the bad state it stays there until the page reloads. The arithmetic says scheduling, not
  weight: on a 120 Hz panel a vsync is 8.33 ms, the good state is every second one (16.67), and 50
  fps averages 20 ms — which no whole number of vsyncs gives. It is a mix of 16.67 and 25, i.e. we
  aim at every second vsync and miss onto the third on some frames. So the frame sits ON THE EDGE
  and which side it lands on sticks from the first seconds. **Everything measured this evening as
  «the cost of a function» may have been measuring which state the run started in** — including
  Control's forced-layout reasoning, which was a real mechanism but not the cause of the shelf; the
  Tester muted hudFloorMeasure entirely and the cadence did not move. Measure `capIv` and the vsync
  stride, `tactHz` and the period it aims at, and FRAME_JS in both states before taking any more
  milliseconds off anything. First suspect: `capIv` is estimated from the shortest interval seen at
  startup and never revised, so a phone that hands out its first frames at 60 fixes the stride
  against the wrong period for the rest of the session. Also still unverified by anyone: the g11
  part of the gate (≥55 fps on the laptop) — the Tester never ran it.
  **Corrected the same evening by histograms (Tester, 1e1c505, S23, 25 s under the finger): 1119
  intervals of 16.7 ms and 189 of 33.3, no third value.** 33.3 is exactly twice 16.7, so the period
  we aim at is 16.7 and the stride is one — we draw every callback. That kills Control's arithmetic
  above (a mix of 16.67 and 25 from drawing every second callback): the measurement holds clean 16.7
  and its double, no mix. The true picture: the frame sometimes does not fit in 16.7 ms and every
  miss costs a whole period, since a skipped vsync is never caught up; the miss rate is 14 % and
  holds steady all run, and releasing the finger does not restore the good state (89.4 %). Not a
  stuck schedule — a frame on the edge, so taking milliseconds off DOES help (the Tester withdrew
  his «pointless» too). Judge by the share of skipped frames over three runs, never by one average.


- [ ] **AUTHOR'S CALL: ×1.5 in flight** — the raster, not the JS, loses the deadline; the switch is built and OFF (`c7556b7`, `G.opts.gfx.resByMode`); price: the sky a quarter darker. Numbers and reasoning in `docs/PLAN-archive.md` («Moved 2026-09-18, fourth batch»). Design pass D3.

- [ ] **[design: D2] Longer tails — built as knobs, waiting for the author's pick (18.09, Control).** The finger
  trail is now measured in TIME (`HELM_TRAIL`=.2 s, guard `HELM_TRAIL_MAX`=48; a still finger's
  trail catches up and goes out). The wake already runs off the screen at cruise (frame at ×1: the
  rails reach the bottom edge), so «куцые» is the nozzle RIBBON: it lives only while thrusting,
  `TRAIL_LIFE.k`=40 frames per span, and its brightness falls as u² — the visible hot part is the
  first half of its life. Knobs: `TRAIL_LIFE={k,fall}`, `WAKE_LIFE={lo,hi}`; `TRAIL_MAX` 560 → 1200
  (a guard; ×3 life reaches ~330 points). Frame sent to the author: A now (40, u²), B 40→80,
  C 80 + fall u^1.2, D 120 + u^1.2, at ×1 and ×2.4. Defaults unchanged until the author picks;
  after the pick — phone cadence check in the phone milestone (the ribbon's draw calls scale with
  the number of live segments per bucket-path, not per segment, so the cost is path length).
  Older notes below.
  Older notes on the tails (the wake/ribbon audit, the finger trail in count): `docs/PLAN-archive.md` («Moved 2026-09-18, third batch»).

### New mechanics M499–M513 — the bodies as they stood 23.09

- **M499 Попутная посылка** — BUILT 18.09 `18i-rail-life` [design: D24]: every third station/смена, `G.railParcel`, paid through `earn` on ВЫЙТИ at its stop. (st. 3, with M492): at a vestibule Космопочта asks you to carry a parcel to
  a stop on your line; delivered by ВЫЙТИ there — a few кр and a rumour; the parcel is a hold row.
- **M500 Проездной** — BUILT 18.09 [design: D24]: price = 12 × the mean fare from here, 10 смен, non-metro fares 0, a КНИЖКА line per ride. (st. 3): ГЛАВТРАССА's monthly pass — the one subscription in the game that is
  fair (pays off at 12 rides, the card says so); stamped in КНИЖКА each ride.
- **M501 Попутчик** — BUILT 18.09 [design: D24]: every other station/смена, pays their fare via `earn`, one line at the first stop. (st. 3): a passenger at the vestibule asks to ride with you — pays their fare,
  talks during the ride (the passenger table, M156), leaves a rumour.
- **M502 Проводник** — BUILT 18.09 [design: D24]: rides of 3+ non-metro stops, tea and a rumour at the first stop (no crew fatigue yet). (st. 3): on the скорый the one human of the railway brings tea in a
  подстаканник — crew fatigue eased, one rumour; the kindness of the whole railway.
- **M503 Госзаказ на билборде** — BUILT 18.09 `17k1-gosplan` [design: D25 23.09]: at ГЛАВТРАССА billboard stations every other 10 s cycle the sign shows the plan (good, qty, сводка = three смены, fixed price ×1.3 or ×1.2 far); ГОСЗАКАЗ row atop the trade tab delivers via `earn`, `G.gosDone`, КНИЖКА `R.udar` shown on the record page, «план выполнен на 101–107 %». (st. 5, M460 + M467): «ПЛАН: 40 ед. осмия до сводки 118» — a fixed
  price for whoever delivers, a КНИЖКА stamp «УДАРНИК», the сводка reports «план выполнен на 103 %».
- **M504 Ажиотаж** — BUILT 18.09 `18j-rail-rush` [design 23.09: the rush traffic drawn]: the first take of a grade-3 vein starts `G.rush` for 2 смен — the stop's interval halves, fuel there ×1.33, a ГЛАВТРАССА line. The approach fills (23.09, `drawRushTraffic`): a file of prospectors from the entry along the lane and a second, wider waiting ring behind the queue. (st. 3, M466 + M474): after a ЖИЛА rumour the line adds a train to that stop «по
  многочисленным просьбам трудящихся», the полустанок's prices spike, the approach fills.
- **M505 Дипломатический паспорт** — BUILT 18.09 `17i1-passport` [design: D25]: the seventh first stamp (six powers + Ялта) issues it once (`R.pass`), 7 смен: every fare 0 incl. metro, Орднунг declares on the first press. (st. 5, M453): all six border stamps + Ялта's → the замполит issues
  a passport: free rides for a week, and the Орднунг form asks one question fewer.
- **M506 Покупки за рубежом** — ALREADY IN since M369/M388: station parts are generated with the land's maker (`pby`) and `PART_MAKER_BIAS` skews their affixes (Орднунг coneMul down, Коммуна turnMul up…). The named habits (Коммуна turret wider) would change issued parts — `PART_GEN` forbids; only via a new generator version, deliberately. (st. 4, M480): a part bought in a power's land carries that yard's habit
  (an Орднунг shield is front-heavy, a Коммуна turret turns wider) — shopping abroad matters.
- **M513 Постановка на учёт — утильсбор** — BUILT 18.09 `12al3-reg` [design: D25]: a hull bought (shipRow) or collected from СТАПЕЛЬ in a land not `playerFlag()` gets transit plates for 9 смен (`G.reg[id]`); in own land `regArrive` (from `arriveSystem`): once «до понедельника» (`G.regWave`), then утильсбор (hull×8 + cargo×3) and a queue of 3 смен; transit expired before the queue — a 60 кр fine per arrival; queue done — plates issued. **Open:** the paper plate drawn on the flank (crooked when expired), the home yard refusing to re-plan it, the foreign warranty void. (st. 6, with M481/M506/M452/M495; the author 14.09: «купил корабль
  — тебя останавливают, надо на учёт поставить»). A hull bought or ordered in another power's land
  flies on **транзитные номера** — a paper plate stencilled on the flank, valid 3 сводки. On the first
  arrival under your own flag the picket stops you: «постановка на учёт» — **утильсбор** («сбор за
  будущую утилизацию», by hull mass, the dearest for a dreadnought that will never be scrapped),
  form 2-ТС in three copies, a queue number at the ПАЛАТА, one сводка of waiting; until then no
  home yard buys or re-plans it, the foreign гарантия is void, and every picket stops you again
  («транзит просрочен» — a fine, and the plate is drawn crooked). Registered: your flag's number
  replaces the paper plate — the slogan of a ГЛАВТРАССА yard is never touched. Kindness: the
  inspector waves you through once, «до понедельника», and writes nothing down.
- **M507 «Успеваете скорым»** — BUILT 18.09 `railCatch` in `18j-rail-rush` [design: no picture owed — a ДЕЛО row]: a taken board job's ДЕЛО row adds «успеваете / не успеваете электричкой «L» · отправление через M:SS · k ост.» when a line from here reaches its destination (ride ≈ 25 s a stop). Found on the way: a second `offerCarried` in `11ah-offer` had overridden R5b's, so ДЕЛО wrote «undefined мин» since R5b — R5b's is now `offerCarriedRows`. (st. 3): ДЕЛО reads the timetable — a job with a deadline says which
  train makes it and when it leaves.
- **M508 Пломба** — BUILT 18.09 [design: D24]: Орднунг boarding with cargo seals the hold (`G.railSeal`), `sellCargo` refuses, lifted on exit; pirates' respect not yet. (st. 3, M474 Орднунг): a declared hold is sealed at boarding — nothing sells from it
  until arrival, and pirates at rim stations do not touch a sealed hold (they fear the form).
- **M509 Отзыв партии** — BUILT 18.09 `05b4-recall` [design: D25]: each week (7 смен) about one in six of your Хай-Фронт parts is recalled (`G.recalled` by seed), a ПОЧТА line; kept, its affixes work at 85 % (`partBonus`); ЗАМЕНИТЬ ДАРОМ in any Хай-Фронт land station's trade tab reseeds it in place, same kind and tier. (st. 6, M487): Хай-Фронт recalls a part model — «партия отозвана», a free
  replacement at their yard; kept, the old one becomes a scar.
- **M510 Компенсационная маршрутка** — BUILT 18.09 [design: 23.09: the ПАЗик and the dashed road]: when `railClosedWhy` shuts a Коммуна counter the vestibule offers МАРШРУТКА to the first six stops (same fare, no declaration, leaves in 3 s, segments ×1.6), the driver's line says why (`railBusTalk`). **Open:** shut stretches of the front (the line itself cut), the bus drawn. (st. 6, M474): on a shut stretch («временные трудности») Рассвет's
  bus runs along it stop by stop — slower, and the driver knows why the line is shut.
- **M512 Общества и льготы — membership** — FIRST PASS BUILT 18.09 `12al4-soc` [design: 23.09: the membership cards]: five societies on the КНИЖКА page (ВСТУПИТЬ/ВЫЙТИ/ВЕРНУТЬСЯ 500 кр), a членский билет in ВЕЩИ: Профсоюз (100 jumps; 2 % dues inside `earn`, shown as paid; проездной ×.5), Кулибины (10 tapes; tape to 60 %), «Знающие» (10 rides; buffet free), Филателисты (4 stamps), Партнёрская программа™ (anyone). Counters in `G.soc.c`. **Open:** duties (субботник, the week's parcel), ДОСО, спасатели, дачники, читатели; the arithmetic on the desk. (st. 5; the author 14.09 on the маршрутка's driver who
  knows why the line is shut: «это КГБ прям, можно примкнуть к гильдии — какие могут быть и какие
  льготы»). A society is joined by a deed, not a fee; a **членский билет** goes to ВЕЩИ; dues are
  always a shown line (the manager-cut rule); leaving is free, rejoining costs; each has one duty
  and one joke. **Профсоюз водителей** (ГЛАВТРАССА; 100 jumps): dues 2 % of earnings; льготы — a
  путёвка to the sanatorium once a season, the проездной at half, «тринадцатая» from the pool at
  year's end; duty — a субботник each сводка or a line of shame in КНИЖКА; the union paper on ПОЛКА.
  **«Знающие»** — the маршрутка drivers' society (Рассвет; ride ten times and answer «до куда?» with
  «а куда все»): they know everything and say it only over tea — льготы: the reason behind every shut
  stretch, ЖИЛА rumours a сводка early, the bus stops for you anywhere; duty — carry one parcel a
  week without asking what is inside (it is always jam). **ДОСО, добровольное общество стрелков**
  (a score on the стрельбище): free ammo on the range, guns cheaper at ГЛАВТРАССА yards, a named
  target barge; duty — shoot the range monthly. **Товарищество кулибиных** (ten taped repairs): tape
  holds 60 %, the master's seam free, «сделаем из ваших» everywhere; duty — fix one stranger's ship
  per сводка. **Общество спасателей на трассе** (three tows given): your own БУКСИР free for ever,
  the rescuer's word (war §6.4); duty — answer a distress call when near. **Клуб дачников** (a
  greenhouse): a plot with a hut on a greenhouse world, jam as currency at the canteen; duty —
  bring seedlings. **Клуб филателистов ОТМЕТОК** (four stamps): trade rare stamps, the pirate scratch
  as the prize; no duty — meetings at the hotel. **Общество читателей** (ten books on ПОЛКА): a
  Коммуна station lends a book per ride. **Партнёрская программа™** (Компания; free to join, the
  only one that advertises): «льготы» are coupons that expire and points that convert into points;
  the cashier whispers «не вступайте». Several at once are allowed — the dues add up, the duties
  collide, and the desk shows the arithmetic.
- **M511 Волокита — BUILT 18.09 (Control), `src/12al5-vol.js`, test in `91zzp-record`.** Animals aboard (the caged beast of M496, the parrot) ride the rail and cross a border only with papers: N docs rolled 2–10 per animal and never told; the desk on the КНИЖКА page shows the pile as paper sheets (a tint per power, the «ПРИНЯТО К СВЕДЕНИЮ» stamp lilac, the one name on the last sheet), «собрано N · ещё документов: неизвестно», and names the next document and its office (official + power + station type by seed); Орднунг wants three copies in three shifts, the Коммуна official is at lunch until the next shift; after two docs the clerk whispers «можно ускорить» — jam for 60 кр adds a stamp and changes nothing; the last one signs anywhere, without reading, «ну сколько ж можно, летай уже», and gets a name; «Ветпаспорт» goes to ВЕЩИ. Without papers the conductor refuses the ride; the border picket waves once, then fines 40 кр. Phone-checked. Original: (st. 7, M496; the author 14.09: «надо прям заебать игрока
  бюрократией»). Any animal — the farm beast, **the parrot the player already has** — rides the train
  or crosses a border only with papers. The ПАЛАТА needs **N documents, N rolled 2–10** per animal
  and never told: справка о прививках · акт о некусаемости · выписка из реестра фауны · согласие
  соседей по ангару · форма 7-ЗВ «о намерении перевозить» · заключение о совместимости с
  грузом · характеристика от участкового · копия копии. Each is signed by **a different official at a
  different station** (by seed, across powers — the Орднунг one wants the form in three copies, the
  Коммуна one is at lunch). You arrive with the pile — «вам документа не хватает» — one more, until
  N. **The hope of a shortcut**: the clerk hints «можно ускорить» → a side job (jam for the inspector,
  a parcel to his cousin) that ends in a stamp «ПРИНЯТО К СВЕДЕНИЮ» and changes nothing. The loop is
  the joke and it is honest (§22): the desk shows the pile and «ещё документов: неизвестно».
  Kindness: the last official signs without reading — «ну сколько ж можно, летай уже» — and that
  signature is the only one with a name. **Animals to invent later** (the author): a table of
  species per world with a quirk each, in M496's row.

## PLAN.md as it stood on 2026-09-23, before it became open work only

The whole file, kept so nothing is lost: the open items were rewritten into the new `PLAN.md`, the
rules and decisions moved verbatim to `docs/DECISIONS.md`.

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
  a safe default in `applySave()` (`14-save`); shape changes ride an `s.v===5` branch. **Every
  field on `G` is either in `snapshot()` or named in `SAVE_EPHEMERAL` (`14a2`) with a reason** —
  the net `91zzzzzzzzz-savenet` (0.438.0) goes red otherwise, and the save→load→save fixpoint
  must hold; numbers coming back from the PHP cloud as strings are numbers again (`optsNumify`).
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `now()-lastTick` (the game clock, M441 — never
  `Date.now()`) with an offline cap. No real-time simulation — the model is `tickDrones()` (`12-economy`).
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

- **New lore rides existing channels (author 2026-09-04).** No encyclopedia, ever: «куска лора не
  существует, у каждого есть полезная выдача» (`12q`). A milestone that brings lore names its channel
  first — desk (ТЕТРАДЬ, КНИЖКА, ПОЛКА, ОТЧЁТ, ВЕЩИ, ДНЕВНИК, ПОЧТА/QSL/АЛЬБОМ) or world (rumours `11t`,
  speech `11b`, retelling `12p`, the wall, the ledger, the trace, the first hour, the hundred stories).
- **No parallax on the map (M447, author 11.09.2026).** A map layer is either in the world -
  moves 1:1 with the sheet and scales with the zoom - or it is paper - does not move and carries
  no recognisable object. Map stars do not twinkle. Why and how: `docs/DESIGN-galaxy.md` §1-2.

## How a frame is judged (M241) — `look()`/`lookAll()` print five numbers per frame against
`LOOK_TARGET` (pair ≥ 15, mass ≥ 14, edge ≤ 18, contrast ≥ .30, tones ≥ 5); the table and the five passes
for a thing: `docs/DESIGN-craft.md`, «How a frame is judged» (moved 2026-09-14).
