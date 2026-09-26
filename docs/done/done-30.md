<!-- docs/done/done-30.md — part 30 of 30 of the done work, in the order it was written; see README.md -->

## WORKING PLAN — everything open, in the order it is done (2026-09-14) (cont.)

### Second pass over the whole plan (14.09) — seams, the standing checklist, new mechanics

**Seams found between systems (each is a line in the item it belongs to; listed here so they are not lost):**
- **MODS → the plan (M478).** Today `capOf` is shared by modules and parts; when tiers become
  densities, `hold`/`tank`/`weapon`(reactor)/`armor` are densities per cell, `engine`/`hyper`/`drill`
  stay station upgrades on the hull's constants — one mapping table in M478, and the fixpoint suite
  covers both halves. Densities are per hull size (nominal ÷ typical cells), never shown as a number.
- **Drones and the far goods (M465).** Drones never mine band-2/3 goods and sell band-1 goods at the
  band price (½) — otherwise a drone on a rim жила prints money offline.
- **The stamp and the metro (M453, M473).** A stamp lands only on arrival by jump or on ВЫЙТИ, never on
  a stop passed through; the gesture fires on both kinds of arrival; the ring's «Стыковка?» hail
  fires only when heading into the ring, not when thrown out of it.
- **The first hour (M452, M472).** In the home system the gesture *is* ГЛАВТРАССА's and is the first
  hour's first line; the замполит hands the newcomer one жетон («первый — за счёт трассы») — the
  metro is met in the first hour, not found.
- **Rescue and rails (`16c-rescue`).** A dry ship at a rail stop gets a third exit beside ДОМОЙ /
  БУКСИР: **НА МЕТРО** (a ticket home for its fare).
- **The scheme's scope (M470).** The paper shows your line, the rings it meets and their neighbours;
  pinch/scroll for more — never the whole infinite net. «Край» is per player (no shared state).
- **M484's place on the pad.** The two permanent buttons stay; the special system is the ДЕЙСТВИЕ pad's
  **long-press** with its cooldown drawn as the pad's rim — no third button over the world.
- **Replays (0.1, P9).** The fixed step and the seeded entry angle each move every recording and
  same-hash suite once: one `-Accept` per change, named in the patchnote, `91zzzzzzzzb-replay` re-based.
- **The stage-0 gate is re-run after every stage** — each stage adds raster (the galaxy bake, the
  lane, neon, the ride); a stage that breaks the gate is not closed.

**Standing checklist for closing any item of stages 2–7:** new `G` fields in `snapshot()` or
`SAVE_EPHEMERAL` with a reason (the savenet goes red otherwise) — the batch introduces `G.stamps`,
`G.draft`, `G.thrown`, the ride `{line,from,to,t}`, tokens/tickets, hull orders, scars, warranties and
subscriptions, parcels · goldens re-shot for the scenes touched (`-Accept`, `-Mobile`, 1440) · a new
visual system gets its almanac issue (neon, the blueprint, the ring) · the oracle lines green · the
stage-0 gate · one running gag and one kindness named in the patchnote (the humour law) · old save
loads.

**Release checkpoints (a push after the whole run):** after stage 0 («кадр»), after 0b, after
stage 2 («чья земля»), after stage 3 («дорога»), then per stage.
**Two laws over every stage (14.09, after an outside read of the plan):** (1) **causality is real** — a
mechanic is accepted only if it changes a decision the player makes later (transit plates → the route
you choose; the stamp → the passport → the cheaper road); a gag with no consequence is cut, however
funny; (2) **the twenty-minute exam** at every checkpoint — the author plays twenty minutes and answers
one question, «захотелось самому сделать ещё рейс?»; «нет» leaves the stage open whatever the tests say.
The game today carries its world in text (the hundred stories, rumours, the cantina, the books); the
material consequences are the part that does not exist yet — that is what stages 2–3 are for.

**New mechanics — grown out of the seams (M499–M511; each names its stage):**
- M499 Попутная посылка, M500 Проездной, M501 Попутчик, M502 Проводник, M503 Госзаказ на билборде, M505 Дипломатический паспорт, M506 Покупки за рубежом, M507 «Успеваете скорым», M509 Отзыв партии — built 18.09, designed (D24, D25, 23.09). Bodies in the archive («Moved 2026-09-23, closing 0.456.0»).
- **M504 Ажиотаж** — built 18.09; the approach fills (23.09). Closed.
- **M508 Пломба** — built 18.09. **Open:** the pirates' respect for a sealed hold.
- **M510 Компенсационная маршрутка** — built 18.09; the ПАЗик drawn 23.09. **Open:** shut stretches of the front (the line itself cut).
- **M511 Волокита** — built 18.09 (`12al5-vol`). **Open:** the animals the author will invent later (his table).
- **M512 Общества и льготы** — first pass built 18.09; cards drawn 23.09. **Open:** duties (субботник, the week's parcel), ДОСО, спасатели, дачники, читатели; the arithmetic on the desk.
- **M513 Постановка на учёт — утильсбор** — built 18.09; the transit plate on the flank (D25). **Open:** the plate crooked when expired, the home yard refusing to re-plan it, the foreign warranty void.

### Release tails — any gap, all before a push

**Perf night 19→20.09 (the author's laptop: AMD Radeon iGPU, Chrome on it, RTX idle; «оптимизируй код, графику не трогай»).** How to measure, what was learned:
- Tool: an own Chrome (`--user-data-dir` in Temp, `--remote-debugging-port=9444`, window 1600×1000, real GPU) on `python -m http.server 8778` in drift-work; scratchpad `gpu.py` traces 2–3 s and prints **GPU-process ms per drawn frame** (`CrGpuMain` busy ÷ frames) — busy % alone saturates at 100 and says nothing; `ab.py` alternates two builds, `alt.py` alternates a JS toggle. The Browser pane is useless for this (emulated size, DPR 1).
- At ×2 (3076×1762) the frame costs ~28 ms of the GPU process; **one full-screen pass ≈ 1.1 ms** (bandwidth). `prof()` raster numbers lie on a GPU canvas; muting single cheap layers can read *slower* (APU power sharing: less CPU load → lower clocks). Accept only what moves fps in a ≥3-round A/B.
- Done (0.455): wake/trail stroked per shared bucket, not per lane (up to 384 → 64 strokes); bloom blurred on the quarter canvas (blur(7px) at full res cost ~3 ms; radius 1.75/DPR matches ≤8/255); opaque main canvas (−0.65 ms); grain skipped on black-sky scenes (invisible there: 0.1% subpixels by 1/255; overlay copies the frame on D3D11). Total 30.6 → 34.9 fps at ×2, −12% GPU per frame.
- Surface/landing (0.456 local): real surface ~30 fps / 33 ms at x2 once the planet material is built (a stand shows the unbaked ground until `planetMatNow`); 3.8k canvas ops a frame, plants 1.3k (they sway every frame - baking needs quantised poses: a look change, ask), rain 160 strokes each with its own alpha (batching needs alpha quantised to 1/64: a look change, ask), the weather veil is laid twice by design (behind and in front of the relief). Done pixel-identical: tiles draw only occupied rows, sub-0.002 additive cloud glow skipped - no measurable fps.
- Look-and-cost (23.09, the author: «только если графика лучше будет смотреться»): precipitation is four depth planes with their own parallax, one path per plane — ≤8 strokes instead of ~160 (`WX_PLANES`); plants bend under gust crests travelling along the wind (`plantBend`). Baking plant poses is now possible (between crests they are nearly still) but NOT done: the glow parts use `lighter`, which blends differently inside a sprite — a look change, ask first.
- Left, measured but not cut: vignette (~1–2 ms, one full-screen source-over blit), star body/corona/bleed (full-screen `lighter` sprites), station (rebaked every 18 ticks: `Math.floor(G.t/18)` in the `stationArt` key), backdrop-filter blur on 12 HUD buttons (~2 ms). Ops count is NOT the lever (stars, 930 ops/frame, muted = no change).

**0.453.0 (19.09 night, released WITHOUT tests at the author's word):** the frame cap estimated the vsync period from the SHORTEST interval (`capIv`) - under a 100% GPU a late frame plus its 6-9 ms catch-up slid it to «120 Hz» and the game dropped every other frame itself (sim: 5% late -> 23 fps of 60). This is the likely cause of the phone's locked-30 stretches in `rec.mp4` and the desktop stutter. Now a flat 60 by schedule (`capDue`, `28-loop`), 120 tact off. Far lane: billboard/hotel unlettered below x0.3, queue and hotel scale with the world. OWED: run `test.ps1 -Full` + Node tier on 0.453.0; the author to fly the phone again and say if «откидывает назад» is gone; the four white parked ships by the lane still keep their size floor (drawn outside `drawSysLaneShips`); a server frame-stats beacon was asked for - not built (touches `site/api.php`, ask first).

**HANDOVER 19.09 (Control → the next session; the author: «опусом в новой сессии будем чинить»). Do this first, in order:**

1.–2. ~~Merge the agent branches, release~~ — done in 0.451.0 (19.09): five branches cherry-picked (helm test taken from the phone-stick branch); «полный трюм» found green in every order, no agent branch needed. Found on the way and fixed: world signs below the UI ruler, the parallax law on a phone frame, the zoom law's centre, the rail ride leaking across suites, «останется N» contrast. Flickers seen once under load, green on rerun: «прогоны: двенадцать путей» (-Full), quarantined «рейсы» (Node) — watch.
3. **The phone (S23, the author's live game, 19.09 00:18, `scratchpad/rec.mp4` 60 s @60 fps — measured, not felt):** in the system scene by the hotel «ГОС ИНИЦА «КОСМОС»» with the lane queue (station Цициин, system Нейэль 0,0) the recording shows *every second frame duplicated* for whole stretches (29–36 s, 42–46 s, 54–58 s: 29–30 dups of 60) — the game drops to a locked 30 fps, then back to 60. This is the «дёргается». On the local 0.450.1 build on the same phone (adb reverse 8812, tab fronted) the same place gives a flat 60 fps standing, in flight, with a CDP stick at 26 moves/s, and with each draw layer muted in turn (`drawSysNebula/Trail/Wake/Stars/Station/Hotel/SysLaneShips/hud/…` — none moves the number). Live tab, fronted, standing in dock: 60 fps too. Not reproduced yet; what differs from my stand: (a) the author's real finger — the S23 touch sensor reports at 240 Hz, my CDP touch at 26 Hz; helm (c) above flips a body style every frame under a finger — test it first: merge, rebuild, ask the author to fly the same place; (b) two «CryptoTab Pool» tabs (`web.ctpool.net`) are open in the same Chrome — a browser miner; ask the author to close them and fly again before hunting further; (c) the long save (log 160, 21 drones, 493 DOM nodes, 7 canvases) — if (a)/(b) clear it, no need to look. Tools: `scratchpad/t.py` (PHONE=1, CDP_PORT=9334), `fps.js/fps2.js/fps3.js` (rAF counter per muted layer), `jit.py` (duplicate-frame counter on a screenrecord); wireless-debug port from `adb mdns services` (was 33801).
4. **Checked 19.09 (0.451.0): the «big teal/amber wedges» in `rec-grid.png` are the touch stick's band (`15a-helm`, drawn from the thumb), not off-screen marks — there is no double flag. The chips were two in every frame (star + station; the planet drops out when on screen). What is left of the «каша» is the fleet/billboard label and the hotel prompt over the lane — ask the author whether that still reads as clutter after 0.451.0 before touching it.** Original note:
4. **The «каша» the author sees on the phone (same recording, D-line owed):** at ×0.16 by the star the HUD stacks three compass chips («НЕЙЭЛЬ IV · 1733», «ЗВЕЗДА · 4530», «ЦИЦИИН · 5368») in one column at the right edge, each with its own arrow, while the same targets are ALSO pointed at by the big teal/amber off-screen wedges (`17-mode-system` marks) — one target, two flags; plus the hotel prompt «ГОС ИНИЦА «КОСМОС» · МЕСТ НЕТ · ДЕЙСТВИЕ — К СТОЙКЕ» and the fleet label «ТРАССА — ДЕЛО КАК ОГУРЕЦ» over the lane ships, and the ЭФИР ticker below. Design decision to take: one flag per target (chip OR wedge, never both — the wedge only when the chip is off the edge), chips capped at two (target + nearest), fleet label only when within a hull-length. Measure with the recording grid `scratchpad/rec-grid.png` frames 12–22.

**Red before 0.450.0, not from the design pass (verified on `d1028d1`, 18.09) — all six taken by agents 19.09, see HANDOVER above:** helm M410 «стик задаёт ход» (cruise 6.70 of 8.00, half-stick 3.10), the same-hash «под руками второй прогон» in the system scene, «полный трюм» (СДАТЬ on the market overfills the hold by 8), the detector «карта · A · застой» and the phone stick suites (`x0` of null, the stick born on the wrong half). Each needs its own look before the next push. Determinism: `wanderer · A` reads real chance or time on the corridor's buy path
(`wanderBuy`/`wanStep`, 24c) — find it, move the scene; the clock out of `stateHash` (still mixed in: `08a-statehash` ~79 `mixN(now())`; decided
11.09: a separate field, `T.state()` returns both — today it returns `{hash,snap,purse}` and `T.clock()` apart); `planetStripTick` by `wallMs()` writes `stripLvl`
into hashed state. Housekeeping: ~~the `.gz` cache headers~~ and ~~the PATCHNOTES trim~~ — both found done 14.09; the patch-bump rule (tests/tools/docs → patch; `src/` → minor after
`-Mutants` green). Tests M443–M446 open items (below). The refactor queue (below). M451 the sky
from the galaxy model. The 60 fps check re-run at the release. «свет: звезда — самое светлое» red
once in the pane (the cumulus, `CLOUDS_OFF`) — one look, then strike. A per-suite dirty-page check
after `fn()` — not built.

### Stage 7 — the base and the giants (`DESIGN-birchpunk.md` §4.3–4.7, `DESIGN-life.md` §3.6)

- [x] **M496 The farm — BUILT 18.09 (Control), `src/21ac2-base-farm.js`, test in `91zzzw-base2`.** Ферма module (1500 кр, gardener's post). A stunned beast in the mine or the cave is taken alive (`G.beast`, one cage) when some base has a live empty farm — otherwise the sample as before; the first entry to such a base moves it in: a name from the table (Зорька, Пеструшка, Тихон…), the ПАЛАТА клеймо № Ф-xxxx, a journal line. One unit a shift of its world's good (organics on soft worlds, carbon on rock, xeno for alien archetypes; from ≥25 sectors every third shift «Жемчуг пустоты», far jungle/terran every second «Звёздный чернозём») — only while a gardener is on the farm or the player is on the base; nobody talks — «скучает» once in 12 shifts. A broken farm never loses it («ждёт в породе»); rebuilt — homesick, half yield for 12 shifts. Room: straw, hay bale, pitchfork, three-rail pen with posts, trough and bowl, name board and the white клеймо plate, the real `drawBeast` in the pen (flyers hang low), the talker on a stool. Saved in `G.beast` and `B.farm`. Phone-checked. Original: A beast of a planet (`20f-fauna`), calmed by the probe or
  a net, taken to a base with a **ферма** module; a name (Зорька, Пеструшка, Бурка…) and the
  ПАЛАТА's QR-plate (the клеймо on a beast); a slow trickle of its world's good — organics, carbon,
  xeno, on deep worlds чернозём — **only while someone talks to it** (a hand on the farm or the
  player landed); a far beast gives a far good; never lost, homesick after a move (half yield).
- [x] **M497 Баня and чайный гриб — BUILT 18.09 (Control), `src/21ac1-base-banya.js`, tests in `91zzzw-base2`.** Баня module (1300 кр): a bath night every 6 shifts takes 4 water, +3 spirit for 6 shifts, +8 to a habitat next door («пар» in the adjacency table), the base manager's flaw sleeps 12 shifts after it (`B.mgr.rest`), the ПАЛАТА check fines one item (40 кр) less and logs «заодно попарился»; no water — «баня холодная». Чайный гриб — a director event only with a live greenhouse: food ×2 for 3 shifts, then it eats 5 organics a shift until an аврал in the greenhouse (forced on the next visit) cuts it into 6–14 «Чайный гриб» (`RES.grib`, `made:1` — stations never generate it, Рассвет pays ×1.5). The parlour drawn: plank walls, каменка with stones and firebox glow, chimney, two-step полок with a lying man and a sitting one in a felt hat, веник, thermometer keyed to the bath night, steam. Phone-checked. Original: A base module **баня**: fatigue resets on a bath night (the С5
  axis on managers); an inspection at a base with a баня finds one thing fewer — the inspector
  «заодно попарится» (honest man, likes a bath). **Чайный гриб** — a director event (base §10): the
  greenhouse culture overgrows, yield ×2 for three shifts, then it eats the base's organics; an
  аврал cuts it back; the cut sells to Рассвет as «чайный гриб».
- [x] **[design: drawn quirks on the van (18.09)] M498 The blockade's voice, and «Буханка» — the voice BUILT 18.09 (Control), `src/13b1-blockade.js`; «Буханка» BUILT 18.09 (Control), `src/21ac3-base-van.js`, test in `91zzzw-base2`: a base with a pad gets a named van (Буханка, Таблетка, Головастик, Шишига, Козлик, Пирожок, Бочка, Утюг by seed) with one quirk for ever («не заводится с первого раза» — every third pad transfer needs a second press; heat, door on wire, dead stove, right blinker always on — drawn on the machine and logged once in 12 shifts); the pad room now shows the whole van (boxy body, split windshield, headlight, roof rack with a canister, engine pods and skids, the name stencilled on the flank), the plateau pad a small one; «ПЕРЕИМЕНОВАТЬ МАШИНУ» on the station desk cycles the table — the one machine the player renames. Phone-checked.** at occLvl ≥ 2 the occupier's wave speaks once a world-day per system («Полки полны… Страдают другие»), a line says the counter is empty; organics, ice and isotopes sell ×2 (`sellCargo`). ~~**Open:** the pickets' hail answered by speed, parts ×2~~ (done 18.09: `hailBlockade` counts the blockade, the picket's «стоять» is outrun at two thirds of full speed without anger — «ответили скоростью», legal for a neutral; alloys sell ×2 as the parts). «Буханка» built (above). Original: The blockade exists (`occLvl≥2`, `12-economy` ~223:
  drone circles stop, barges stand, the H1 battery lifts it); what it lacks is the voice — the occupier's
  wave says the shelves are full and the others suffer, the counter is empty and pays **×2** for food, fuel
  and parts; running it is legal for a neutral, the pickets hail you and you answer by speed. **«Буханка»** — the
  base's surface–ship shuttle as a named machine (M485), a boxy old van with engines, always a bit
  broken, **the one machine the player may rename** (from the name table, no free text).
- [ ] **M464 One giant per arm — first pass BUILT 18.09 (Control), `src/17o-giants.js`.** Fixed geography, not war: six around the disc at 18–26 sectors (angle step 60°), snapped to the nearest star, the hollow moon near the core; a ringed cross mark with the name under it on the map; in the system the body 2600 from the star, 600–1400 units wide, one silhouette per kind (moon with lit rings, Дом водителя with windows, the cylinder with КОМПАНИЯ™, customs forms, the dry dock with its hull, the town in rocks, the mast garden blinking); first sight logged (`G.giantsSeen`). **Open:** the drawing itself (D26), the ruler in the frame, docking/visiting, arms matched to the galaxy model's real arms. Original: Each arm and the core get one colossal structure 20–50× a ship,
  named in the galaxy's voice: a hollow moon with a mining town lit in rings; the Коммуна's dry dock
  where one hull has been built for three hundred years; the Компания's cylinder with its logo
  along its length; ГЛАВТРАССА's «Дом водителя» the size of a station; Орднунг's customs city where
  every building is a form; Хай-Фронт's relay garden; Рассвет's belt town in the rocks. A landmark
  on the map and a ruler in the frame. (The Ring, M154, is not one of these.)

**Cut for good, so they are not re-invented:** six musical modes (→ a motif each, M457); the tunnel
with walls and station halls; the trust rating; the lab restart until a CPU budget per session.

**Decisions of 14.09 (the author's, not re-litigated):** the hold and tanks are cells · the metro
is a real station in the system, not an abstract ring · rides are seconds to a minute · the net is
procedural and infinite · jumps stay for near · «пока только в план пиши».

## Next — after M321 — closed (the queue of 2026-09-03 and §18.8); body moved to `docs/PLAN-archive.md` (2026-09-11)

## «Сорока» — the wanderer queue (M340–M346, 0.339.0–0.346.0, closed 2026-09-05) — body moved to `docs/PLAN-archive.md` (2026-09-11)

Design: `docs/DESIGN-wanderer.md`. The queue, its decisions and the M351 cooperative answer live in the archive — grep «Сорока» or M34x there.

## Closed milestones M354, M355, M357, M359 (0.352.0-0.357.0, 2026-09-05) — bodies moved to `docs/PLAN-archive.md` (2026-09-08)

- **M354 deep tests** — the seven cross-cutting nets over the topic suites.
- **M355 does the button do what it says** — an action button names its action and takes its verb from the prompt.
- **M357 hunting by search** — the game reads its own source and checks every name called by string.
- **M359 the evidence, the hands, the things** — the ledger, the players' hand, the objects that stay.

## Side passes of 2026-09-07 — all built; bodies in `docs/PLAN-archive.md` (sections of 2026-09-10 and 2026-09-11)

## Tests — M441–M446 built (0.428.0–0.437.0); bodies in `docs/PLAN-archive.md` («Moved 2026-09-14»)

`docs/DESIGN-tests.md` holds the rule of place; the 809 old suites are frozen. **Open, each a commit in a gap:**
`TEST_T0` is local noon · drawn-vs-undrawn hash (a detector owed) · tools' self-test before the net · not
caught yet: the .55 auto-brake, the money-printing counter, idle drones · partial: helm switching, sharpness at
DPR 1, contrast under a vignette · goldens per platform when the lab runs (`@lab.json`) · M444: cooperative
walk, drags/wheel, map per window · M445: a `DPR=.5` mutant · M446: previous-version diff, `look()` telemetry.
The lab is **stopped since 11.09** (CPU 57 % of a day vs 50 %): a CPU budget per session before any restart.

## Refactor audit (0.438.0) — done items in `docs/PLAN-archive.md` («Moved 2026-09-14»)

M441–M446 stand; the defects were in the tooling. **Open queue, each a commit:** `detStuck`'s key law (fires
only on a diff of exactly 0; soften with the silence table) · a shard hangs now and then (900 s ceiling kills
it; `--enable-logging=stderr` on laptop runs so it names its suite) · the source net is line-based and the clock
law skips `tests/` (41 raw calls) · long functions on touch only (27 over 200 lines) · tools zoo → one way to
take a frame · the button family merge (~12 s → one table) · `-Times` for the Node tier. **Rejected:** a
palette module, a `G.mode` table, removing `typeof` guards, a schema-driven `applySave`, uncommitted `drift.html`.

## The frame is the judge for anything the player touches (M437) — the four lessons live in `docs/DESIGN-tests.md` («The frame is the judge», moved 2026-09-14)

## Loose ends — housekeeping (bodies in the archive, 2026-09-14)

**Needs a decision from the author:** nothing — every fork was decided on his behalf (below).
**Systems:** the DPR-2.5 stalls are stage 0.4; the freeze item (M234/M238/M417/M418) stays closed
until a stall that is not a bake shows in `crash.log` (`stallWho`, 0.448.0). **Housekeeping:**
PLAN.md stays under 100 KB (60 → 100 on 14.09, the author's exception: one working plan for everything) (`build.ps1` warns; a closed item leaves one line, its body goes to the
archive in the same commit) · push only after a green run, run and push in separate commands · a
dirty page still surfaces on its neighbour (a per-suite check after `fn()` would name it — not
built) · tiers, switches and cost: `CLAUDE.md` «How to verify», `docs/VERIFY.md`.

## Closed 2026-08-28 → 2026-09-02 — one line each, moved to `docs/PLAN-archive.md` (2026-09-04)

## Done — struck items moved to `docs/PLAN-archive.md` (2026-09-04)

## Open by design — M125–M127, M131–M132, the yacht railing, P9b settlement recursion, holding deeds without counters; body in `docs/PLAN-archive.md` (2026-09-14)

## «Зачем лететь» — moved to `docs/PLAN-archive.md` (2026-09-04); its answer is Act I

## First three — built; body moved to `docs/PLAN-archive.md` (2026-09-04)

## The arc and the holding — built (M225–M231, M289–M298); `docs/DESIGN-holding.md`; bodies in the archive

# ~~The war — M360–M388~~ — closed 0.388.0; `docs/DESIGN-war.md` §18 holds the struck queue and «Deferred»; body in the archive

## Decisions taken on the author's behalf, so they are not re-litigated

- **2026-09-14, the author.** The hold and tanks are cells of the plan · the metro is a real
  station in the system with a real gate, not an abstract ring · a ride is seconds to a minute ·
  the rail net is procedural and infinite · jumps stay for near · «пока только в план пиши» ·
  optimisation first · the plan names no games and no films — this is ours.
- **Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

- **2026-09-11, the author: «по вопросам реши за меня как лучше».**
  - **The clock leaves `stateHash`.** `stateHash()` is the world and the `rnd` position; the clock
    is a separate field (`T.state()` returns both). Two saves of one world at different hours
    must hash alike; «where did it diverge» compares worlds and prints the clocks beside.
  - **Versions:** a commit touching only tests, tools or docs bumps the patch (0.443.1); a minor
    bump means `src/` changed and `test.ps1 -Mutants` ran green before it.
  - **PATCHNOTES: trim, not split** — versions before 0.400.0 go to `docs/PATCHNOTES-archive.md`.
    Splitting per file would add a build step and a habit for a conflict that resolves itself
    (both sides prepend).
  - **`play.html` caching:** `Cache-Control: max-age=60, must-revalidate` on the `.gz` answers
    too, plus validators; never a long max-age on the game — a stale build after a push costs
    more than 2 MB.
  - **No Node jobs on the PHP host** triggered by players: 768 MB that already kills the lab's
    Chromes, and the live site shares it. The lab stays on the GitHub schedule.
  - **Goldens per platform:** `docs/golden/<W>x<H>@lab.json`, accepted by the lab itself on its
    first run after the laptop's goldens changed; the laptop's stay the reference.
  - **`resAuto` never lowers the resolution while the clock is pinned**; the sharpness detector
    then holds the canvas to the DPR the settings ask for, and `DPR=.5` gets a killer.
  - **P4 grisaille — no.** The world's palette ramp stays the ground's hue: worlds are told apart
    by it (the rich-palette rule). What may be taken from the glaze later is the sky-coloured
    shadow alone, measured per scene.
  - **P7b glyph notebook** — a record of glyphs seen: where, when, drawn as seen. No meaning is
    ever filled in and there is no «understood» state; understanding stays in the player's head.
  - **С5 fatigue** — an axis on managers (they already have faces, a card and loyalty); hired
    hands stay faceless bets.
  - **Drone attrition** stays out (decided 2026-09-03: never lost); **the base** is «like
    Fallout Shelter» already — closed.

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

# ~~The base — M390–M409~~ — closed 0.409.0 (2026-09-07); body in `docs/PLAN-archive.md`

Twenty passes, all closed: хозяйство (M390–M393), место и люди (M394–M399), тяжёлая игра
(M400–M404), человек (M405–M407) and дело и мир (M408–M409). Design stays in
[`docs/DESIGN-base.md`](docs/DESIGN-base.md) — §51.1 is the struck queue with what each pass
measured and what it deferred, and «Deferred» there is the only remaining base work. The layer's
own craft audit is Almanac **issue V**; `docs/DESIGN-winter.md` is still a separate sketch and still
not part of this queue.

**Read back by another session** (0.409.1): fifteen real faults across M390–M409 and the war
queue, all fixed, pinned by the «разбор …» suites in `tests/91zzzw-base4.js`. The list, the two
rules that outlive it are in §51.2 of `docs/DESIGN-base.md`. The six scene notes from the same
review are closed too (**M413**, 0.410.0) — §51.3 there has the three frame rules they produced.

## Engine stage 1 — flight (system) on WebGPU, closed 26.09 (0.468.0)

The flight frame is the engine's: the HUD and the sticks on `#ovl` (08bi; `#hud` gone in 0.466.0), the flame plume
(L4), the hull material (08cd, 0.467.0), the tour gate (`docs/tour.py`: 0 uploads, 1 submit a frame, a `gpuBake`
frame +1, bake frames 0.29 % of the tour). It closed with the phone gate P1 on 0.468.0 (GPU-3, S23, on the charger
at 100 %, thermal 0 throughout): cold 30 s 100 % of 1800 frames within 18 ms, max 16.9 ms; 5 min 99.98 % of 18002
frames at 60.0 fps, none at 50 ms, three single 33 ms frames (one vsync skipped, no bake in them). On 25.09 the same
gate failed on 9206be7 (an 83 ms hitch from 2D bakes at first sight, 85 % over 5 min); the phone had been waived
on 26.09 while it was away and was run as soon as it was back, after the plan audit.
