# Drift — the plan

Only what we want next. What is done is not kept here: the story of each version is in
`PATCHNOTES.md`, the old plan bodies are in `docs/done/` (files of at most 40 KB — grep them by
M-number), and the rules and decisions that stand are in `docs/DECISIONS.md`. A finished item is
deleted from this file in the commit that finishes it; its story goes to the patchnote.

**How it is worked.** Start the session here; open the design section an item names; measure before
touching; commit locally; the whole run (`test.ps1`, `-Full`, `-Mobile`, `-Mutants`) only before a
push. Stages 2–6 go on the author's word. Where an item and a design document differ,
`docs/DESIGN-review-2026-09-14.md` wins. The phone playtest's rules bind every item: a screen never
loses its scroll, every screen answers «чтобы что?» before it is redesigned, optimise without losing
quality, the ship stays under the finger.

**Release checkpoints** — a push after the whole run: after the phone tests, after stage 2 («чья
земля»), after stage 3 («дорога»), then per stage.

## 1. Phone tests — smooth flight on the S23

The author 18.09: «на тел дергается все прогоны … плавный полет нужен»; «потом пройдемся все
померяем, отдельно веха тесты на тел». Known: with the stick under the finger 80–83 % of frames make
16.7 ms, without it 99–100 %; our JS is 6–8 ms — the deadline is lost in the raster. Every
measurement here follows the cadence protocol in `docs/DECISIONS.md`.

- [ ] **The hull bake, on vs off** (`G.opts.gfx.hullBake=0`) — the only number that says whether baking
  helps. If it helps: bake the other modes' still bodies (station, landing, belt) by the rule «bake what
  fills its box, never slivers», checked with the caller breakdown (`layers.js`). If not: stop baking.
- [ ] **Acceptance of the baked star core and hull** on the phone: the star's breathing, a step at the
  baked picture's edge.
- [ ] **Tails at ×2.40** (the author's «куцые хвосты»), filmed on the phone.
- [ ] **P8 under the finger, P9 zoom, M484's long press** — the phone check for each.
- [ ] **Two bills, fixed separately.** A real reference first: the same scene, the stick confirmed born,
  no windows open, 10 s of continuous steering. Then the steady ~14 % of late frames from live steering,
  and the spikes on events — a window opening or closing, a hint appearing, the compass chips re-laying
  out. Measure the cost of an EVENT, not the average frame; every skip names what was on screen.
- [ ] **Four milliseconds of JS off `frameBody`** at the same look, one function per commit: draw only the
  wake and trail points that are visible and merge sub-pixel segments; `hud`/`drawSysHud` touch only what
  changed; the hull's outline cached per scale. Meter: `FRAME_JS` EMA before/after, then the phone.
- [ ] **GC (0.6):** three sources hoisted out of the frame, unmeasured — `performance.memory` is frozen in
  this build; the phone trace's allocation sampler decides.
- [ ] **Heat (0.7):** 75 min gave thermal MODERATE and 37 fps at ×1 — a 30-min run with
  `dumpsys thermalservice` logged every minute.
- [ ] **The flat-60 cap of 0.453.0:** the author flies the phone again and says whether «откидывает
  назад» is gone. The four white parked ships by the lane still keep their size floor.
- [ ] **The «каша» by the star at ×0.16:** ask the author whether the fleet/billboard label and the hotel
  prompt over the lane still read as clutter.
- **Gate:** cadence ≥ 95 %, no frame > 24 ms in 60 s of steering, `RES_AUTO ≥ 2`, `g11` ≥ 55 fps in every
  mode on the laptop (landing and surface fail it on a big canvas — paint area, `gfx.res` auto should step
  down there). The gate is re-run after every stage; a stage that breaks it is not closed.

## 2. The frame on a laptop GPU — levers measured, not cut

Cut only at the same look, or when the picture gets better (the author 23.09: «можно что-то делать
только если графика лучше будет смотреться»). Method in `docs/DECISIONS.md`.
- [ ] The vignette (~1–2 ms, one full-screen blit); the star's body, corona and bleed (full-screen
  `lighter` sprites); the station rebaked every 18 ticks (`Math.floor(G.t/18)` in the `stationArt` key);
  backdrop blur on 12 HUD buttons (~2 ms).
- [ ] The surface at ×2 runs ~30 fps (3.8 k canvas ops, plants 1.3 k): plant poses can now be baked —
  between gust crests they are nearly still — but their glow uses `lighter`, which blends differently in
  a sprite. A look change: ask first.

## 3. Stage 2 — whose land, in five seconds

- [ ] **M453 the stamp + P14 КНИЖКА:** ink grain; Ялта's stamp and the pirates' scratch cannot be earned
  yet; the rest of P14 — seals, vacation savings, the grounding ending on the page.
- [ ] **M454 the station by its builder:** the maker's grammar on the modules and the core (profile law,
  seams, joints), not the common kit with a dressed plate; the station's one light washes the ground out;
  the Орднунг ribs hide under the modules.
- [ ] **M447/M448 the galaxy:** M450 the overview and M451 the flight sky from the same model; verify the
  drag detector's thresholds («deep < 8 %, sheet ≥ 25 %» were set before measuring).
- **Gate:** on any jump in the settled circle a tester names the owner within 5 s without reading a label
  (three testers, six powers); the stamp lands once per crossing.

## 4. Stage 3 — far, and back with a hold

- [ ] **Oracle lines** (`91zzzzzzzzz-worlds`): the best rail round trip ≤ ×1.3 of the best jumps in credits
  per minute of play (baggage is the lever); the stripped hauler's best one-hop deal (for M478).
- [ ] **M466 reading and ЖИЛА:** the cave (янтарь) and the hunt (жемчуг) give nothing yet; the rumour a
  сводка later and company on the approach; the reading on the planet card and at the dig entry; тёмное
  стекло in the instruments narrowing every reading by half.
- [ ] **M467:** far goods for sale in the heart, rarely and dear.
- [ ] **M469 eaters:** the goods actually consumed by the yards' densities and доводка, the luxury counter,
  the hotel shop.
- [ ] **M470 the net:** stop names by owner (the M489 rule) and «Край»; lines beyond r 60; the scheme as its
  own screen (КУДА ВАМ).
- [ ] **M471:** the bare rim platform; helm assist in the ring's cone.
- [ ] **M472:** split-flap turning; крупногабаритный ×3.
- [ ] **M473:** the held pad ×2; a save mid-ride wakes at the origin today.
- [ ] **M474 six railways:** Рассвет's маршрутка (stop anywhere on the line), the dashed Express line on the
  scheme, closed front stops. Test fragility: the ride suite picks the first heart metro station — if its
  land ever turns Орднунг, the suite needs the double press.
- [ ] **M475 economy and growth:** fares, baggage and the size rule tuned against the oracle's rail line; a
  holding-built station, «продление линии», a late holding deed named by the generator.
- [ ] **M508:** the pirates' respect for a sealed hold. **M510:** shut stretches of the front — the line
  itself cut.
- **Gate:** from home to a rim полустанок and back with a hold of deep goods in under 4 minutes of play,
  paying its ticket on an average roll; the ride never shows a loading screen.

## 5. Stage 4 — the ship

- [ ] **M476 the plan:** unique, fused and NPC hulls in the suite; the hold's green is barely visible.
- [ ] **M477 the КБ:** footprints 2/4 turning and the Орднунг «поворот не предусмотрен формуляром»; the
  numbers strip with deltas; ПРОЕКТЫ ×3; the foreign yard's bill per cell moved; ОСНАСТКА's hull section
  into КБ; the tray showing things from the hold.
- [ ] **M478 numbers from the plan:** fuel from tank cells, energy from reactor cells, hull from armour parts,
  sight from nose-third instruments, module tiers as densities. One mapping table: `hold`/`tank`/
  `weapon`(reactor)/`armor` become densities per cell (per hull size, never shown as a number);
  `engine`/`hyper`/`drill` stay station upgrades; the fixpoint suite covers both halves.
- [ ] **M479 exposure:** rim parts take their side's wear when hit from that side; «engines take it» from
  behind.
- **Gate:** an old save loads with every number unchanged; a hauler stripped to the hold and a warship
  stripped of hold both fly under the finger the same (the P8 meter); the blueprint gets its almanac issue.

## 6. Stage 5 — the voice and the joke

- [ ] **M485 machines with names:** the base crawler, the tug, the barge's autopilot.
- [ ] **M486 изолента:** the кулибин trait; tape on a part, not only the hull; the first hour's ДО 50 %
  button anywhere.
- [ ] **M495 the triangle:** parts do not break — the Компания/Хай-Фронт part failures need a part-failure
  mechanic first; the bar of hold music; the old master's free seam.
- [ ] **M489 names by owner:** settlements, holdings, the station header; firms where they appear.
- [ ] **M492 Космопочта:** a rare part and cooperative goods as parcels; a real queue.
- [ ] **M460 billboards:** 1–3 signs; the hull tint within R; the сводка, циркуляры and holding lines;
  stale prices as a fork. **M491** through `12p-news` at the сводка. **P12** ЭФИР.
- [ ] **M461 hotels:** the doors (the sanatorium wants a voucher and an ocean world — how a hotel offers
  it); cantina rumours at the desk; fatigue (does not exist for the player).
- [ ] **M455 the peacetime fleet:** субботник, strike and rite driven by the chronicle's days rather than
  always; the belt tugs are far from the station view.
- [ ] **M456 laws:** «сделаем из ваших» (Рассвет); the fine's ticket in ПОЧТА instead of the journal; the
  lunch shown on the trade tab.
- [ ] **M511 волокита:** the animals the author will invent (his table).
- [ ] **M512 societies:** duties (субботник, the week's parcel), ДОСО, спасатели, дачники, читатели; the
  arithmetic on the desk.
- **Gate:** a tester laughs once in the first ten minutes at something inside the world, and can say
  afterwards which institution the joke was on — never a person.

## 7. Stage 6 — the story and the rest

- [ ] **P15 «Смена»:** a chapter's deed in the place, not just a landing; check that 72 distinct kinds of
  place exist within reach.
- [ ] **M457 sound:** an ear pass on the six motifs (the AnalyserNode check of `docs/VERIFY.md` at a release
  run), then the rest of the item.
- [ ] **M480/M481 yards:** the free cells (need the plan, M477); Хай-Фронт firmware moving a part per
  сводка; Рассвет hull points back from debris; calibration by the worlds oracle and the стрельбище.
- [ ] **M484 the special system:** the ability named on the ship card; СИРЕНА answered by the ships actually
  in view.
- [ ] **M482 scars:** scars on captured pirate hulls; доводка — a weld with a node, +1 tier, two per hull.
- [ ] **M513 утильсбор:** the plate crooked when expired; the home yard refusing to re-plan the hull; the
  foreign warranty void.
- [ ] **M463 the bazaar:** odd lots beyond parts; rumours at the stalls.
- [ ] **M487 подписка:** base modules by subscription, and the cold store that stops giving; ×3 offered in
  a fight.

## 8. Stage 7 — the giants

- [ ] **M464 one giant per arm:** the ruler in the frame; docking and visiting; the arms matched to the
  galaxy model's real arms.

## 9. Seams to honour when the items above are built

Check each against the code before building — some may already hold.
- **Drones and the far goods (M465):** drones never mine band-2/3 goods and sell band-1 goods at the band
  price (½) — otherwise a drone on a rim жила prints money offline.
- **The stamp and the metro (M453, M473):** a stamp lands only on arrival by jump or on ВЫЙТИ, never on a
  stop passed through; the ring's «Стыковка?» hail fires only when heading into the ring.
- **The first hour (M452, M472):** the замполит hands the newcomer one жетон («первый — за счёт трассы») —
  the metro is met in the first hour, not found.
- **Rescue and rails (`16c-rescue`):** a dry ship at a rail stop gets a third exit beside ДОМОЙ / БУКСИР —
  НА МЕТРО, a ticket home for its fare.
- **The scheme's scope (M470):** your line, the rings it meets and their neighbours; pinch/scroll for more —
  never the whole infinite net. «Край» is per player.
- **Replays (0.1, P9):** the fixed step and the seeded entry angle each move every recording and same-hash
  suite once — one `-Accept` per change, named in the patchnote, `91zzzzzzzzb-replay` re-based.

## 10. Tests and tooling

- [ ] **Determinism:** `wanderer · A` reads real chance or time on the corridor's buy path
  (`wanderBuy`/`wanStep`, 24c); the clock out of `stateHash` (`08a-statehash`, ~79 `mixN(now())` — decided
  11.09: a separate field, `T.state()` returns both); `planetStripTick` by `wallMs()` writes `stripLvl` into
  hashed state.
- [ ] **Watch:** the quarantined «рейсы» — Омксиий (±3:∓1): «посадка: заход кончился режимом system»
  (23.09, Node and `-Mobile`); «прогоны: двенадцать путей» flickered once under load; «свет: звезда — самое
  светлое» went red once in the pane (the cumulus, `CLOUDS_OFF`) — one look.
- [ ] **Nets owed (M443–M446):** `TEST_T0` at local noon; a drawn-vs-undrawn hash detector; the tools'
  self-test before the net; not caught yet — the .55 auto-brake, the money-printing counter, idle drones;
  partial — helm switching, sharpness at DPR 1, contrast under a vignette; goldens per platform once the lab
  runs; M444 the cooperative walk, drags/wheel, the map per window; M445 a `DPR=.5` mutant; M446 a
  previous-version diff and `look()` telemetry; a per-suite dirty-page check after `fn()`.
- [ ] **Refactor queue, each a commit:** `detStuck`'s key law (fires only on a diff of exactly 0 — soften
  with the silence table); a shard that hangs now and then (`--enable-logging=stderr` on laptop runs so it
  names its suite); the source net is line-based and the clock law skips `tests/` (41 raw calls); long
  functions, on touch only; the tools zoo → one way to take a frame; the button family merge; `-Times` for
  the Node tier.
- [ ] **The lab:** stopped since 11.09 (CPU 57 % of a day against 50 %) — a CPU budget per session before any
  restart.
- [ ] **A server frame-stats beacon** was asked for — it touches `site/api.php`: ask first.
