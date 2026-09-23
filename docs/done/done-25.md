<!-- docs/done/done-25.md — part 25 of 30 of the done work, in the order it was written; see README.md -->

## Moved 2026-09-18 (second batch — stage 0b and stage 1 bodies)

- [x] **0.3 Layout reads — DONE by its own meter, and it did not move the cadence.** Reads in the
  frame went from 6.3 a frame to 0.31 after three fixes (the fleet label and the helm lift reading
  raw, the brake button fighting the helm-hide row every frame, and the six-node observer watching
  style with subtree so every gauge's own width dirtied the cache). Mutations fell fifty-fold,
  rectsDirty 62 → 11 per 600 frames. **And the cadence under steering did not budge: 80–84 % on every
  build of the last ten commits.** Said plainly so nobody re-litigates it: the item is a clean win on
  its own measure and pure code hygiene in effect — the deadline is missed in the raster, not in our
  JS, which measures 6–8 ms against 16.7. The evening's other lesson is in GOTCHAS: the phone's first
  minute is inflated (92.8 % rested, 83.7 % after a minute idle, 78.5 % on a fresh reload, thermal 1
  throughout), so throw the first run away and judge by the last two of three.
  **Final number of the evening, rig fixed (8a6d001, real S23, three counted 30 s runs, the helm
  alive in all three):** cadence 83.0 / 81.0 / 80.3 %, frames over 24 ms 262 / 288 / 296, fps 51.2 /
  50.4 / 50.1 — a spread of one and a half points. Reference points from the same rig: no helm
  99–100 %, ×1.5 with the helm 94–97 %, RES_AUTO holds 2 even after ten minutes, thermal never above
  2. **Rig rule now enforced in the harness:** a run in which the helm never got born is rejected and
  re-shot automatically — such runs used to report a glorious 99 % and mislead everyone, including
  the Tester. Stage 0's gate at full resolution is not taken and did not come closer all evening; the
  only thing that takes it is the author's call on ×1.5.

- [x] **0.5 Tester's queue, closed by Control 18.09** — (1) the Node DOM stub audited: 30 selectors
  the game asks were answered wrong (".pads button" gave the panel, "#fbar i" the bar,
  "[data-k=thrust]" any node, closest/matches always no); a real mini engine now, all old checks stay
  green, `tests/90d-selectors.js` pins it in both tiers (73584f8). (2) celDay column: a five-digit
  day fits left of the red margin with room — P6 closed by a frame through the player's path.
  (3) The two "quarantine" ОПИСЬ failures were real: the brake stayed dimmed in flight after the
  surface (yesterday's M181 gate), and the opis header lost its matches count after P1 — both fixed
  (dc67a87). Browser tier 18 080 / 0, node 16 352 / 0. **Still open: g11 on the laptop** — not run.

- [x] **0.4 `src/16a-space.js` crossed the 40 KB build guard (41 KB) on 9dc0a3f** — closed by the ray revert (dbc06ea): 40 694 bytes. Three files sit just under the 40 960 line now — `16a-space` 40 694, `03e-hull-draw` 40 704, `27z-telemetry` 40 775; the next line added to any of them trips it, so split at the next touch, not before. Not a blocker and
  not to be fixed on the run. When it is split, split it by meaning: the sprite oven with its cache
  (`GLOW_SP`, `GLOW_CACHE`, `glowSprite`, `glowBlit`) apart from the things it bakes.

- [x] **The anchor and the stick** — done 18.09 (Control), **phone owed**. The edge is a WALL now,
  argued with the INPUT, not the state (`15a-helm` `helmEdgeInput`, `17-mode-system` anchor block):
  past the edge (and in a 240 px band before it) the outward part of the stick's wish is removed,
  the tangential part stays; a soft pull to the edge line keeps the ship ON it; the braking rule no
  longer reads the anchor's bend as «pulling against the motion»; while the stick holds the wall the
  anchor's course-bend is silent (`c.edge`) — two rudders on one edge were the crawl. Coasting
  without a stick, the anchor arcs home as before. Test `tests/91a2-edge.js`: straight out from
  cruise — no sideways crawl (old 0.59 of cruise), rests at the wall, ~0 fuel there (old 5.16 per
  300 frames); diagonal — slides along; no stick — arcs home fuel-free. Two models rejected by the
  test's trace are written in the code comment (coast-and-arc gave a pendulum through the brake
  rule; turning the push into a slide flipped direction as the fixed stick gained a backward
  tangential part around the curve).

- [x] `say()` from timers/network callbacks — closed by verification 18.09 (Control): callbacks run
  outside the frame, so FRAME_IN is always false there and they count as responses; all 26 in the
  game are server replies to the player's own tap (ОСТАВЛЕНО, ГОЛОС ПОДАН, the cloud) or the
  «open in another tab» warning — both must show over a screen. The rule is written at `say()` in
  `08-state`; a future world voice from a timer sets MSG_WORLD itself.

- [x] СТОЛ — done 18.09 (Control). Empty sheets: read on a fresh game, 13 of 17 already named their
  source; the four silent ones now do — БОРТ («борт пишет сам — покупки, ремонт, бой, поломки»),
  ЛЮДИ («говорят у стойки станции и в смену на борту»), ДЕЛА («берут на станции — сделки, наряды,
  охота за головами, баржи; фронт присылает сам»), ДНЕВНИК («пишут на зимовке — наряд с ДОСКИ»).
  Bottom padding: closed by a frame — 57 px of air under the last card at 390×844, nothing fixed
  over it (P1–P3 already fixed it). `crash.log` noise: closed since 0.419 — only `logShip` sends, and
  all nine callers are real evidence (save, cloud, chronicle).

- [x] Station header review 13–15 — done 18.09 (Control, the author chose the forms). Prices before
  the cooperative form; the Director's news from ЕЩЁ to the board («СЕГОДНЯ В СИСТЕМЕ», lane
  ЗДЕСЬ); **one tab row**: the open group's tabs stand inline right after its name on their own
  band (`#stTabs` is moved inside `#stGroups`, the node and its selectors unchanged), the row fades
  at the right edge like the desk's — the list starts at 148 px instead of ~215 at 390×844;
  **СТОЛ stays in the masthead, redrawn** («в шапку аккуратно впишем»): a paper tag under the
  wallet — your money, your data, your desk on the right, the station on the left — 59×44 hit
  area. Tests that listed groups with `#stGroups button` now say `#stGroups > button`.

- [x] **P10 ЦЕЛЬ and the hail — done 18.09 (Control).**
  - **One meaning per pad state** was already true (M355/B1): every claimant names itself in the
    prompt («ЦЕЛЬ — ЗОНД 900 кр», «ЦЕЛЬ — СНЯТЬ ЭКИПАЖ», «ЦЕЛЬ — БЛАГОДАРНОСТЬ», «ЦЕЛЬ — ПО ДЕЛУ»)
    and the pad takes the verb — verified, nothing to change.
  - **Pickets lockable:** `helmTargetable` (15a) — hostile ships and every ship of a power, even a
    peaceful one; never the player's crew or flag. Autofire still fires only at hostiles
    (`!mk.iff`, 13-pirates), so a locked picket is aimed at, not shot, until the player fires.
  - **Hail colours by consequence — the author's reading 18.09:** there is no fight answer, both
    answers are peaceful by default; «опасность — красное, не опасно — зелёное». `hailRisk` names
    what each answer leads to here and now: enemy-stamped cassettes in the hold → both red (fire on
    any word); blockade → ПРОХОДОМ red (ordered to stand), ПО ДЕЛУ green; otherwise both green.
    Window buttons and the ДЕЙСТВИЕ/ЦЕЛЬ pads take the same colours (`body[data-hail-*]`); the
    permanent gold of ПРОХОДОМ and the red ring on ЦЕЛЬ under a peaceful answer are gone.

## Moved 2026-09-18, third batch

- [ ] **~~THE FRAME IS BISTABLE~~ — WITHDRAWN by its own author the same evening (Tester, 18.09):
  it was a fault in his rig, not in the game.** In part of the runs his synthetic touch never
  reached the game, so the finger «lay» there with no stick alive — and those runs are the 99–100 %
  he took for a second state. With a check that the stick is really born (and the touch repeated
  when it is not), four 30 s runs in a row read 81.3 / 81.4 / 80.0 / 80.5 % at 50.0–50.6 fps: the
  spread is gone. **Every number from this evening with a zero stick must be read as «measured with
  no steering».** The dull, correct picture: with no steering the frame is perfect, with live
  steering 14 % of frames miss 16.7 ms, and that share holds steady across builds and across time.
  The reasoning kept below is kept only so nobody walks the same path again. Six

- [ ] **Longer tails** (author: «хвосты от корабля побольше надо, а то сейчас куцие»). `WAKE` sits
  at 642 points of 2 000 and `TRAIL` at 0 of 560 — the buffers are two thirds empty, and on `main`
  the wake held 750 at the same speed. Lengthen life/length **after** the milliseconds are found,
  or the budget goes straight back; the look is the designer's call.
  Designer's note from the ×2.4 comparison (18.09): at that zoom the trail reads as a *ruler* —
  two even rails the full height of the screen, same on `main` and on the branch. That is the
  language from before Stage 0, not a regression, and it belongs with this item: when the tails are
  lengthened, the rails are what has to stop looking drawn with a straightedge. Show the author a frame first.
  Same item, the stick's finger trail (Designer, 18.09, measured): its length is set in POINTS
  (`HELM_TRAIL` = 7), so the tail's length in time depends on the sampling rate and on the frame
  rate — at one point a frame the arc is 208 px long, at two a frame 105, at four 52. Control read
  this backwards and asked for the trail to be lengthened after ec9f3fc; the Designer's numbers show
  ec9f3fc made it two to four times LONGER, and she accepts it as it stands. What is worth fixing,
  with the engine tails and not before: measure a tail in TIME (keep points younger than ~0.2 s)
  rather than in count, so it looks the same at 60 and 120 Hz.
  Designer's audit of what is measured how (18.09), so the tails conversation argues about taste
  and not about facts: the wake (life 60–260 by speed) and the ribbon (40×span hot, 6–11 sparks) are
  already measured in TIME, and their count ceilings (2000, 560) are overflow guards never reached in
  normal flight — leave both alone. Measured in COUNT: the finger trail (7 points) — the only real
  case, fix by keeping points younger than ~0.2 s; the wake tips (3) are how many jets we draw, the
  helm marks (3) and the map's rum trail (12) are a memory of the player's actions — count is honest
  for all three. So if the author still finds the tails stubby, the number to change is the LIFE, not
  the way it is measured. The Designer is preparing one frame for the author: three bands at equal
  speed — finger trail, wake, ribbon — each captioned with how long it lives.

- **Gate, honestly: half taken.** On the author's S23, `RES_AUTO` now holds at 2 for ten minutes
  straight (it used to fall to 1 in thirty seconds) and the haze is no longer the bottleneck —
  muting it changes nothing. But the cadence gate is **not** met: the first minute read 58.2 fps
  at 97 %, and over ten minutes the shelf is 76–83 % with 475–619 frames over 24 ms a minute and
  p95 33.4 ms. The first minute was luck, and striking the gate on it was my mistake.
  Screen recording of the S23 itself on 05128a9 (Tester, 17.09, screenrecord, calm flight): 600
  frames in 9.99 s, median 16.7 ms, p95 17.0, two frames over 24 ms. So the idle frame is already
  smooth; the shelf comes from **active steering** — a minute with the finger on the stick reads
  83–90 %, ten minutes 79–80 %. The next measurement is prof() with the finger held vs. without.
  **Answered (Tester, 18.09, S23, three 20 s runs in a row, thermal 1): the remainder is the
  finger, not the drawing.** No finger 60.0 fps / 99.9 %; finger on the stick 50.9 / 81.9 % with 184
  frames over 24 ms; finger off again 59.8 / 99.5 %. Same scene throughout. Ruled out by test: ship
  speed (81.3 % standing vs 81.8 % at speed) and the accumulated wake (clearing WAKE+TRAIL moved
  80.0 → 81.2 %). Under the finger frameBody is 7.74 ms against 5.91 at rest, pointermove fires only
  0.54 times a frame — and **getBoundingClientRect is called 6.08 times a frame under the finger and
  5.33 at rest, where item 0.3 promised zero.** So 0.3 regressed or never covered these callers:
  find the five-to-six layout reads still in the frame and cache them. This also explains every
  earlier disagreement in the numbers: a first minute always beat the shelf because the finger had
  been on the glass for less of it. (Earlier "no finger" figures are withdrawn — the Tester's driver
  left the touch held between runs, so the stick counted as active.)
  **Found and fixed by stack trace (8a3f6ff):** two callers duplicated 08-state's cache with their
  own raw read — `fleetPromptRect()` measured `#prompt` once per visible fleet ship every frame (the
  finger-independent baseline, which is why the count drifted with traffic and why 0.3's own
  measurement missed it), and `helmLift()` did the same only while the stick is live (the touch-only
  delta). Both route through `promptRect()` now: 120 synthetic frames with three fleet ships, a live
  stick and a prompt line give 2 real reads total, both cold. Control's own P4 conditions had added
  two more reads (padsRect and a second promptRect in `drawSysHud`) — 8.17 a frame on a629378;
  folded into the same cleanup. Phone re-measurement pending.

## Moved 2026-09-18, originals (stage items built as drafts)

— original text of: - [x] **[design owed] M459 The approach — «подъезд»** — BUILT 18.09 (Control), `…

  **M459 The approach — «подъезд»** (`DESIGN-life.md` §2–3.1, review §4.4). From the entry point
  (P9) to the station: buoys every few hundred units, one lamp each, **lamps chasing toward the
  dock** at ~2 buoys/s (a phase, not blinking); a **holding queue** at busy stations — 2–6 ships on a
  slow ellipse, one docking, one leaving; density = rung × heartland gradient (`sysDanger`); tugs
  and the shuttles of `17f-sys-traffic` re-routed onto the lane. Absorbs the haul-scene review
  (shuttles passing, a route bar instead of the countdown, the destination chip = the station).
  Buoys baked per system; only phases and ships per frame. Meter: `prof()` on the phone layout —
  the approach adds ≤ 1 ms raster; `look()` on the heartland scene keeps pair % ≥ 15.

— original text of: - [x] **[design owed] M452 The first ship's gesture — BUILT 18.09 (Control), fir…

  **M452 The first ship's gesture** (review §2.1). Within 5 s of arrival one ship of the owner
  (`chronOwner`) does one thing: ГЛАВТРАССА picket alongside, a spotlight cone sweeps you,
  «Записываю», a КНИЖКА line «Проследовал. Замечаний нет.» (monthly: «Замечание: нет замечаний»);
  Компания drone with a screen before your nose, ПОЧТА «Пролёт — 0 кр (акция). Сбор за оформление
  акции — 40 кр»; Орднунг scan plane tail to nose, a pad form «цель визита» with three answers, all
  «служебная»; Коммуна — nobody, a buoy «ОБЕД. ВЕРНУСЬ»; Рассвет tug «чинить есть что?» / at 100 %
  «ну хоть покрась» (one panel painted, 5 кр); Хай-Фронт camera drone at a fixed offset to the dock,
  «ваш рейтинг доверия рассчитан» (never shown anywhere). Rear/front/fresh-occupation states as in
  borders §2.1; Ялта: all six, weapons sealed. The gesture ship is the fleet art in the maker's
  dressing. The **post** is background: one truss + board + lamp + the dressing's prop, baked, at
  the entry point (borders §2.1 table for the six dressings).

— original text of: - [ ] **[design owed] M453 The stamp + P14 ТРУДОВАЯ КНИЖКА — the stamp and its p…

  **M453 The stamp + P14 ТРУДОВАЯ КНИЖКА** (borders §2.2, review §4.4, playtest §4.4). Border
  crossing = owner change (or wild → owned) on arrival: a stamp across the screen 1.2 s (DOM on the
  КНИЖКА paper, tilt 5–12° by seed, ink grain, scale 1.3 → 1 in 120 ms, hold 900, fade); six papers
  (violet stencil «ОТМЕТКА О ПРОЕЗДЕ · ПОСТ № n» + signature; Компания's till slip scrolling up
  «ВЪЕЗД — 0 кр (акция) · спасибо за выбор»; Орднунг black numbered «Экз. 1 из 3», time to the
  minute; Коммуна blue italic with a poem line and the date slightly wrong; Рассвет ochre hand, a
  sun, a thumbprint; Хай-Фронт dot matrix «v4.1» + a trust number). **The КНИЖКА becomes a real
  document** (P14): stamps, seals, signatures, the vacation savings, the доска почёта and the
  grounding ending (all designed in M161, none on the page) — with **ОТМЕТКИ О ПРОЕЗДЕ** as its first
  real page (six + Ялта + the pirates' scratch to collect). Save: which stamps, when (`G.stamps`).

— original text of: - [ ] **[design owed] M454 Station body and traffic by builder — first draft BUI…

  **M454 Station body and traffic by builder** (borders §2.3). `17e-station-body` applies the
  maker grammar (`HULL_MAKER` dimensions: profile law, seams, marks, ground) to the station by
  `station.by`; `17f-sys-traffic` draws 7 of 10 ships from the owner's maker, 3 from neighbours; a
  border system mixes, a heartland is uniform.

— original text of: - [ ] **[design owed] M447 The world galaxy + M448 the stars — first draft BUILT…

  **M447 The world galaxy + M448 the stars** (`docs/DESIGN-galaxy.md`): `galaxyAt(x,y)` (disk,
  bulge + bar, two arms and spurs, dust, knots); world tiles in two levels, 4 ms bake budget,
  fade-in fallback; band and nebula leave the map; M438's sky block retired; Node suite, a detector
  for «the galaxy moves with the sheet»; goldens accepted; faint stars per sector at constant
  screen density, no cross/halo/twinkle. Acceptance frame: home, 0:0, zoom 1, inside the bulge.
  **The metro's ride and scheme (stage 3) draw on this.**

— original text of: - [x] **[design owed] M465 Ten goods — table and roll — BUILT 18.09 (Control).**…

  **M465 Ten goods — table and roll** (`DESIGN-resources.md` §2–3, review §2.5). Rows in `RES`
  with band, verb, property, price, eater line: **солнечный газ** (frontier, scoop, 85, reactors) ·
  **белая руда** (frontier, belt, 95, instruments) · **космический янтарь** (frontier, cave, 130,
  fragile → «крошка» at ⅓, Коммуна ×1.5) · **осмий** (deep, mine, 190, heavy ×2 hold, armour) ·
  **звёздный чернозём** (deep, drill, 170, greenhouses/дачники ×1.5) · **магнитная пыль** (deep,
  belts by star class, 260, shields) · **жемчуг пустоты** (deep, fauna, 320, Компания ×1.5) ·
  **тёмное стекло** (rim, drill, 600, optics, Хай-Фронт ×1.5) · **ловушки** (antimatter, rim
  scoop, 900, perishable 1 %/min without reactor feed, detonates below 20 % hull) · **нейтронная
  крошка** (beyond r 50, drill, 1 500, heavy ×5, доводка). **New random salt** — a Node suite proves
  no existing deposit, price or station moved (old-salt hashes before/after). Presence by band;
  richness `exp(N(μ(r),1))`: ~70 % бедная, 25 % хорошая, 5 % богатая, 0.5 % **ЖИЛА** ×20.

— original text of: - [x] **[design owed] M466 Reading and ЖИЛА — BUILT 18.09 (Control), `src/06e-fa…

  **M466 Reading and ЖИЛА.** The scanner shows a range («осмий: 40–160») narrowed by the
  instrument's resolution (изыскатель ±10 %, рудовоз ±60 %; тёмное стекло in the instruments halves
  every range) — the professions' honesty rule. ЖИЛА: the word across the screen (ГЛАВТРАССА
  stencil, warm, 1.2 s — the only time the game shouts), a ДНЕВНИК line, a rumour at the nearest
  stations after one сводка, company on that approach afterwards («трое, все говорят, что первыми»).

— original text of: - [x] **[design owed] M467 Prices by distance — BUILT 18.09 (Control), `12-econo…

  **M467 Prices by distance.** ½ base in its own band, 1× at r≈10, 1.3× in the heart, the eater's
  ×1.5 in its land; the live market's flood-and-recover holds; far goods rarely on sale in the heart.
  Eaters speak at their counters (review §3: «весы наши, тара ваша», «принимаем по весу, вес — наш»).

- [ ] **[design owed] M470 The net and the scheme** (`DESIGN-metro.md` В§2, В§4, review В§4.4). Six radials from the
  core at the powers' home angles, **forking** outward so line density stays even (6 at r 6, ~12 at
  15, ~24 at 35, on without end); rings at РЇР»С‚Р°'s radius (РљРѕР»СЊС†РµРІР°СЏ; **РЇР»С‚Р° = В«РџР»РѕС‰Р°РґСЊ РЁРµСЃС‚Рё
  Р”РµСЂР¶Р°РІВ»**), rв‰€18 (Р‘РѕР»СЊС€РѕРµ), rв‰€35 (Р”Р°Р»СЊРЅРµРµ), then Г—1.9; two spiral С‚СЂР°СЃСЃС‹ along the arms
  (`galaxyAt`); a stop = the nearest station system to each spacing step (РјРµС‚СЂРѕ 1.5вЂ“2.5 sectors
  inside r 12; СЌР»РµРєС‚СЂРёС‡РєР° 4вЂ“8; a step with none is a РїРµСЂРµРіРѕРЅ); junctions where lines cross; past
  r 40 single tracks with **РїРѕР»СѓСЃС‚Р°РЅРєРё** and В«РљСЂР°Р№В». Lazy per region; Node suite (reachability,
  one stop per system, determinism). Names by owner (M489 rule; beyond the powers: В«СЂР°Р·СЉРµР·Рґ 214-Р№
  СЃРµРєС‚РѕСЂВ», В«РїРѕР»СѓСЃС‚Р°РЅРѕРє РЎСѓС…РѕР№В»). **M449 named places rides along**: arms and ~10 nebulae named in
  the game's voice, lines carry the arm's name (В«Р›РёРЅРёСЏ 7, Р СѓРєР°РІ Р›РµР±РµРґСЏВ»), labels at far zoom.
  **The scheme** (our own, on paper): thick coloured lines on paper, white circles black-rimmed,
  double circles for interchanges, В«Р’Р« Р—Р”Р•РЎР¬В» red, shut stretches hatched; on the galaxy map the
  lines as faint smooth curves 1:1 with the sheet (no parallax). **M450 the overview** (pinch past
  zoom 5) becomes the scheme's zoomed-out sibling: the disk, В«РІС‹ Р·РґРµСЃСЊВ», the settled circle, the
  danger rim, marks, rumours вЂ” and the lines.

## Moved 2026-09-18, fourth batch

- [ ] **AUTHOR'S CALL, and the numbers now point at it: the raster, not the JS — ×1.5 in flight on
  the phone.** Two measurements say the frame's JS is not what misses the deadline. Forcing the
  phone's render scale to ×1.5 gave 59.0 fps / 98.3 % cadence / 59 frames over 24 ms, against ×2 at
  51.3 / 83.1 % / 519 — same build, same scene, only the pixel count changed. And the frame's own
  work measures 6–8 ms against a 16.7 ms deadline (worker's synthetic run: 6.1 ms background, 7.9 ms
  in the frame right after a cache reset — a third dearer, not the 30–40 ms a real culprit would
  cost). So we have been hunting milliseconds in the JS while the deadline is missed in the raster.
  Control's recommendation, still awaiting the author's word: ×1.5 in the system and landing views
  under thrust, ×2 in the dock, the desk and the map, switching on mode change, no dithering. The
  look is his call — his game's sharpness against his own complaint about the judder.
  **The Designer argues against it, with frames (18.09).** She took a real phone frame at DPR 2.6,
  squeezed it to 2.0 and to 1.5 and back by nearest neighbour — what the eye would actually get. At
  ×1.5 the trail's one-pixel neon rails break into a dotted staircase (the very staircase she first
  took for a haze defect), and the star field loses about a third of its stars while the survivors
  double in size: exactly the two things this game's language rests on, and exactly the field the
  author asked to «stretch, not twinkle». HUD and chip text are unaffected, they live in the DOM
  layer. Her verdict: ×1.5 in flight is a bad bargain for THIS game, and the recommendation hits the
  very views where the trail and the stars *are* the picture. So the author gets both sides: her
  three-band comparison (2.6 / 2.0 / 1.5) beside the Tester's numbers, and he chooses knowing what he
  pays with. Her third option — keep the raster, win the frame back on the cost of events — is
  already spent: the worker's fix cut events fifty-fold and the skips stayed, evenly spread.
  **The Designer's case against ×1.5 is WITHDRAWN by her own measurement of real frames (18.09).**
  Her simulation squeezed a finished frame and put it back by nearest neighbour, which turns an
  already-drawn thin line into a dotted one. The game at a smaller canvas draws the line AGAIN: it
  stays solid, its pixel is simply bigger. Measured on the Tester's two real phone frames of one
  scene: the ribbon's rails do NOT break — the teal rail covers 99 % of columns at ×2 and 100 % at
  ×1.5, longest gap 4 px against 1, and there are MORE rail pixels (2634 against 2280). Stars are
  almost all there: 193 against 188 in the band above the ship, a 3 % loss and not a third, each
  blob grown from 18 to 20 px. What actually changes, and nobody predicted it: **the sky gets
  darker** — the band's mean brightness 19.0 against 14.2, a quarter down, with the nebula and the
  faint glow sagging most. So the price of ×1.5 is not the line and not the stars: it is the
  subtlety of the background. She withdraws «a bad bargain» and calls ×1.5 decent on real frames,
  with 59 fps against 51 a serious argument. Her method stands only for «what if we stretch a
  picture», never for «what if we draw it smaller».
  **If the author keeps the sharpness, here is the Designer's map of what may be given up (18.09).**
  Draw calls a frame in the system view, calm flight: the ribbon 126, the wake 126, the star dust 103,
  the compass chips and canvas HUD 10, the nebula 1 (baked into a texture and laid down in one piece),
  the torch 0 with no thrust. Safe to give: the star dust's 103 — depth comes from the layers moving at
  DIFFERENT rates, not from the number of specks (the density was already cut once), so a third can go
  and nobody sees it, herself included; and the wake below about a quarter speed, where it is hidden
  behind the hull anyway, can emit half as often. Only with a frame in hand: the ribbon's 126 — it is
  the game's face in motion, and the particle count must NOT be cut because the author complained the
  tails were stubby; cut thickness and the number of strands instead, never length. Never: the
  one-pixel line itself (the very thing ×1.5 breaks) and the single-pixel stars, which are literally
  the author's «movement, not twinkle» rule. In one sentence: the cheapest thing to sell is the
  emptiness's depth, the dearest are the line and the stars, and the ribbon sits between them.

- [ ] **[design owed] M471 The station in the system.** At the end of the approach, past the ordinary station: **the
  ring** (a torus flat, inner disc a shade lighter with a slow faint spiral, the line's plate) and
  **the glide path** (two converging dotted lamp lines chasing inward); a small vestibule block (one
  body, six dressings; at the rim a bare platform with one lamp). Within ~300: «Станция «Нейэль».
  Стыковка?» — ДА. **Align**: speed under the mark, nose in the cone 2 s, helm-assisted, wide cone on
  the phone; too fast → «Сбросьте скорость», restart, no penalty; **after 5 s of failing the ring
  takes you** — «Автостыковка. Просьба не мешать», КНИЖКА «стыковка выполнена автоматикой».
  Berth: the ship slides in. **The train is the batch**: ships arrived since the last opening stand
  in a row on the lamps — a вахтовка, a barge, a yacht; at the rim you and a drone.

- [ ] **[design owed] M472 The vestibule** — the metro's only new screen, one page on the station paper: **ТАБЛО**
  split-flap («ЭЛЕКТРИЧКА до «Край» · через 0:14», «СКОРЫЙ · 1:40», «МЕТРО · прибывает»; flaps turn
  on change), **КУДА ВАМ** unfolds the scheme on the same paper — tap a stop → pad «ДО «НЕЙЭЛЬ» · 3
  ОСТАНОВКИ · 5 кр» / «ДО «СУХОЙ» · 11 ОСТАНОВОК · 38 кр + багаж 12 кр»; routes through
  interchanges by themselves; **КАССА** — жетон (brass disc, 5 кр flat «сорок лет»), билет 2
  кр/sector, скорый ×2, baggage per ton, «крупногабаритный» ×3 (the tape measure always finds «плюс
  десять»); **БУФЕТ** three items by the owner (лимонад «Звёздный», «Кола Партнёр™», «вода
  минеральная 0,33 № 2», «кофе с круассаном (закрыто)», «чай из общего котла», «энергетик v4») — a
  drink comes with a rumour (`11t`) and a ДНЕВНИК line. Wait = the interval: ~6 s in the heart,
  **≤ 40 s real at the rim** (табло «следующий поезд — завтра», forty seconds later «поезд подан»).

- [ ] **[design owed] M473 The ride** — `G.mode="rail"` on the galaxy map. Departure: «поезд подан», the batch goes
  in 0.3 s apart, your stars stretch to the ring's centre 0.6 s, a white-cyan flash. The ride: the
  camera frames the line ahead drawn thick in the scheme's colour; the train a rounded glyph with a
  headlight wedge; stops as ticks; segment 0.8 s + 0.35 s/sector, **a stop ~2 s** with the name, the
  announcer once (`12pa-beacon`) and **ВЫЙТИ** on the pad; **ПЕРЕСАДКА** at junctions with the other
  line's wait; a paper strip at the top carries the announcements («Осторожно, двери закрываются» —
  said anyway; «Уступайте места пассажирам с детьми и крупногабаритным грузом»; «Поезд следует до
  станции «Край» со всеми остановками. Остановок: сто четырнадцать»; «Конечная. Поезд дальше не
  идёт, просьба освободить вагоны»; front stops «Поезд проследует без остановки»). Metro hop ≈ 6–8 s,
  heart to rim ≤ 60 s; held pad ×2, never a skip; desk open during the ride. Arrival: thrown out of
  the destination's ring onto its approach, slow, facing the station. Save `{line,from,to,t}`,
  resumes at the next stop. Kindness: the полустанок's lamp comes on as you approach — «ждали».

- [ ] **[design owed] M476 The plan, read-only.** `hullOf` → cells (side = length/N, N 8…14 by size; ≥ 48 px on
  390 px), **one view, nose up**: rim cells = ОБШИВКА (mounts: нос → жёсткая, борт → турель with an
  outward arc, as `mountsOf` today), axis cells behind the nose third = the spine (БАШНЯ), interior =
  ПАЛУБА. **No deck tabs.** The **packer** turns every existing fit (`SHIPS`, `FLEET`, unique, fused,
  NPC, pirates) into a plan by the maker's habit; **fixpoint suite**: every number equals today's ±1
  for an untouched save, nothing that fits unfits, «a fully upgraded module set fits any hull».
  ОПИСЬ shows the plan (swap same-footprint on the same cell only). No new save field.

- [ ] **[design owed] M477 The КБ editor** — the second and last new screen: **синька** (Prussian blue, silhouette
  and grid in light line, parts as warm ochre ink stamps by kind, БАШНЯ a circle with a cross, scars
  brown, tape grey, «СОГЛАСОВАНО» violet in the corner — landing by itself after a fake queue «ваш
  чертёж 4-й в очереди»). Footprints 1 / 2 (turns) / 4. Tray under the plan: things from the hold
  that fit the selected cell glow. Tap-tap places, long-press lifts; a refusal is one line: «реактор
  у борта не ставят», «двигатели — только в кормовой ряд», «приборы видят из носовой трети», «поворот
  не предусмотрен формуляром» (Орднунг). **The hold is what is left** (author's decision 14.09):
  free interior cells paint as ТРЮМ by tap. Numbers strip: **ЯЧЕЙКИ 34/40 · ТРЮМ 90 · БАК 140 ·
  ЭНЕРГИЯ «в бою 12 с» · РАЗГОН ×0.94**, coloured by delta. **ТИПОВОЙ = «КАК У ВСЕХ»**; three
  **ПРОЕКТЫ** per hull. Save **`G.draft[shipId]`** (`G.plan` is the industrial plan, `11r-plan`) = `[[thing, cx, cy, turn]…]`, the packer as the
  `applySave` default. ОСНАСТКА's hull section becomes КБ; a foreign yard bills by cells moved
  (Компания: «перемещение ячейки — 1 кр, итого 14 кр, спасибо за выбор»).

- [ ] **[design owed] M478 Numbers from the plan.** cargo = hold cells × hold-module density; fuel/jump = tank cells ×
  density; energy = reactor cells × output (`weapon` module = the reactor level, war §4); hull
  points = the hull's + armour parts; thrust/turn = the hull's × mass factor **clamped .8–1.1**
  (tied to P8's feel); sight = instruments in the nose third. Module tiers become densities.
  Bounds: cargo ≤ ×1.4 nominal; the oracle line from stage 3.

- [ ] **[design owed] M468 Properties** — heavy (×2, ×5 hold), fragile (крошка on a hit), perishable/dangerous (the
  trap's energy draw, the countdown spoken in the hold, detonation below 20 %). **M469 Eaters** —
  reactor/armour/shield/instrument densities, доводка by нейтронная крошка, greenhouses and дачники,
  jewellers, the luxury counter, the navies' buy.

- [ ] **[design owed] M479 БАШНЯ, exposure, sight.** The spine mount: 360°, costs its cell (no decks now, so one
  cell), drawn in flight as a round turret on the back — the loadout read by silhouette; rim parts
  take their side's wear (`12s-wear`) when hit from that side (war §4's ×1.6 from behind now also
  means «engines take it»); instruments count only forward.
