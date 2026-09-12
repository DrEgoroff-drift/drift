# Drift — patch notes

The game version is shown on the title screen. It has nothing to do with the save format
(`v:4`): records written by earlier versions keep loading.

Entries from 0.45.0 onward are written in English (docs are English, the game stays Russian);
older entries below are left as they were written — translating history would cost more than it
could ever save.
## 0.448.0 - the first hour, the world zoom, and the design tails of the phone playtest

- **The first hour** (`firstHour`, `G.flownMs` < 60 min): repair is two buttons — «ДО 50% · N» and
  «ПОЛНОСТЬЮ · N», the price on the button, and in the first hour the full repair costs no more than
  half the cash; a failed landing is a hard landing (−20 % of the hull at most, never to zero, the
  cargo kept) instead of a wreck; the pirate front does not grow until your first liberation; a job
  taken from the board lives at least fifteen real minutes by the game clock (offers no longer count
  frames) and ДЕЛО lists it with the minutes left; the first probe is free («ЗОНД ДАРОМ» on the pad).
- **A wreck rebuilds the hull no higher than it was**: 45 % or the level held for ten seconds
  before the trouble, whichever is lower, never below 10 %.
- **Scale**: the world zooms to ×4.5 while the ship stops at .8 (floor .7) — «close» is half a
  planet in the frame, not the ship across the screen; the disc is the physical one again (the body
  growth and moon caps of 0.447.0 are gone); fleet, pirates, barges and your own ships share the cap.
  МАСШТАБ moved from a plate over the world to the masthead under the purse.
- **Design tails**: the ДЕЙСТВИЕ pad always names the action (two words and a number); prompts fold
  to two lines on touch and the belt hint names no keys there; while a hail is open one undimmed
  edge arrow names the hailing ship; a planet's or moon's name sits on the far side of the disc
  from the ship, and an NPC's name moves above the hull when it would cross a body name or a chip;
  ОПИСЬ on a phone has four tabs (КОРАБЛЬ · СНЯТОЕ · КОМПЛЕКТ · ТРЮМ), the slots come before
  ПРИБОРЫ, an empty slot says where to buy, СНЯТЬ lives under the hull only; ДЕЛО shows a manager's
  share in the money column and drones as a table; tape strips stack without a gap; the СТОЛ button
  keeps one width and wears «99+» over its corner; a board card reads where and until when, the
  cargo paper names the destination sector; the fusion button says «В ПЛАВКУ»; a maxed module is one
  line; the got card reads «/с» and sits in the lower third; the haul passes its planet at 1.15 r on
  the ship's left; a barge box meets the hull with a dark seam.
- **The stand does not write into the live world**: `dev.html` (and `?test=1`) marks every POST
  `test:1`; `api.php` (road, traces, postcards), `war.php` and `log.php` answer as usual and write
  nothing. Account saves are unaffected.
- **Later tails**: what you dug does not grow back on the next landing (`G.mined`, saved); the key
  rebind button cancels on a second tap; «ТРЮМ ПУСТ» only when the hold is empty (rare stock is
  cargo); «привезли лёд, когда его не было» agrees with the goods; a half-price fuel coupon per two
  hours of active flight a week (`G.actWk`, shown on the station's fuel line).
- Tests follow: offers expire by the game clock, the scale suite states the decided form, probe
  suites run past the first hour, `resetWorld` knows the new fields.

## 0.447.0 - the exits window, the tow as a scene, and what the bots found

- **Empty tank**: the nose no longer turns without fuel; a turn (pad or A/D/arrows) opens the
  exits window like thrust and brake; the thrust and turn pads and the stick dim, and the stick
  says «БАК ПУСТ». The ДЕЙСТВИЕ pad reads «ВЫХОДЫ».
- **The exits window** stands in the lower third over the pads; × is 44 px, Escape and a tap outside
  close it; the head says where the tow goes and how far (a foreign station in jumps), a pursuit
  first; icons per exit; «в баке будет» is what the jump gives; the armed СБРОС is red with a 4 s bar
  and comes back; the window follows the world while open and closes itself with «Ход есть» once the
  tank is not empty. On the rope it does not open at all, and a tap there sets no autopilot. СБРОС
  takes only the lost hull's parts and is not offered on a bare «Стриж»; a dock under your own power
  in a foreign system cools the jump counter once per system; 1–7 fuel on the ground is not «ноль».
  Tow, ДОМОЙ and СБРОС put the ship by the station, not 2000 away. What the station says on docking
  and the «СБОЙ» toast show over any screen. The hail waits under this window too.
- **The tow**: the barge comes from behind and overtakes beside the ship, nose first; the rope runs
  from a boom behind the nozzles; the dry ship keeps its nose until the rope turns it; the crew never
  repeats a line; the camera and the zoom ease; at the end the barge unhooks and burns away. The tow
  runs on its own seeded stream: a run with frames and one without end in the same world.
- **Bots' findings**: the probe takes a second tap and the ЦЕЛЬ pad names its price («ЗОНД 300 КР» →
  «ТОЧНО? 300 КР»); the surface sign is offered only where nothing else takes ДЕЙСТВИЕ and is left by
  holding; a jump arrives at rest (an idle ship drifted into the corona); a wreck names its cause in
  the journal and the corona says «Корпус горит» once per entry. The ether names the speaker once, in
  one case.
- Tests: the «R2–R6» suites in `91zzxa-playable`; the picture detector skips dimmed text only under
  an open modal window.
- **Still open** (known — no need to report): the first hour (repair in two buttons, a soft first-hour
  landing, the galaxy goal frozen until the first liberation, board cargo ≥ 15 min with a timer in
  ДЕЛО, the first probe free), a wreck no longer repairing above the hull before the trouble, the world
  zoom ×4–5, and the design tails of R6 (pad labels, ОПИСЬ sub-tabs, the barge seam, story-line
  agreement, the cargo paper's destination sector).

## 0.446.0 - playable on a phone (the author's playtest of 11.09 and the review block of 12.09)

- **Empty tank** is one window: ДОМОЙ (priced by jumps), БУКСИР, СБРОС — thrust or ДЕЙСТВИЕ opens
  it. The tow is a scene: a big barge with burning engines, a sagging rope, bits breaking off, crew
  talk, the camera easing out; the haul is saved and the route passes a planet before the station.
- **One prompt, one action.** Flight writes the prompt through `cue(text, level)` — info < warning
  < action < trouble — so the empty tank is heard past the system edge and beside a planet. An
  equal action keeps the first offer, and every interactor acts only when its own line is on
  screen: ДЕЙСТВИЕ does exactly what the prompt says (belt by a planet, a hail at the pad, a
  tanker next to someone else's offer). World toasts wait behind an open screen.
- **The start picket «Коммуна»** hails in a window with the question, a countdown and two answers
  (ПРОХОДОМ / ПО ДЕЛУ, the same verbs on the pads); 15 s to answer on a phone. In the start
  system silence earns a warning volley on the shield and fire never takes the hull below half.
  While СТОЛ, ОПИСЬ or a station is open the hail waits, no new hail starts and nobody fires at
  the player; the window stands over every screen. Compass chips dim and take no taps under the
  hail and empty-tank windows. First tank rung 500, first hold 900.
- **Scale**: the ship never draws smaller than .7, bodies grow ×(1+0.8·(Z−1)) on the near zoom,
  a planet never grows onto its nearest moon.
- **Screens on a phone**: the station header is one line plus ЕЩЁ; ОПИСЬ puts the ship first with
  a legend and instruments in groups; ДЕЛО adds up (one unit, the header is the sum of the rows);
  the СТОЛ sheet names itself and ЛЕНТЫ tear on the sheet; a module is a card with one verb button
  and СПЛАВ promises exactly what the fuse gives; after a fight the loot is a card with НАДЕТЬ.
- **Economy**: a drone costs 9000·1.6ⁿ by the fleet you own; hired people earn only while the game
  runs (a sleeping tab pays nobody).
- Tests: `91zzxa-playable` — «the player does X → sees Y» suites, the phone ones in the phone
  window, each bug of the review block red first. The picture detector no longer judges text
  dimmed below .2 on purpose (chips under a modal window).
- The first push of 0.446.0 failed the deploy at the Node tier: the hail window reached into the
  test DOM stub, which cannot resolve `b em`. `hailWinSync` now leaves when its parts are missing;
  the site stayed on 0.445.0 until the fix. Lesson for the release list: `-Full` runs Chrome
  only — the default `test.ps1` (Node + smoke) is what the deploy runs, and it goes too.
- **Still open in 0.446.0** (known — no need to report): R2 — the nose still turns on an empty
  tank, the stick and move pads do not dim; R3 — the rescue window opens on the rope and breaks
  the haul, does not redraw when the state changes, its × is 19 px, СБРОС on a bare «Стриж»
  costs as if it took something, «в баке будет 40» instead of the maximum; R4 — the rope leaves
  from the nozzle, the barge comes through the ship, the haul does not end at the station; R5 —
  the probe is bought with one tap, a surface sign goes silently, a wreck works as a free repair,
  a jump can arrive in the corona; R6 — pad labels, chips under windows, ОПИСЬ sub-tabs. Scale
  (as built or a world zoom ×4–5) waits for the author. Since 0.446.0 (dev only): the hail also
  waits under the empty-tank window.

## 0.445.0 - the nearest compass chip takes the tap

- The compass chips at the screen edge are 16 px plates set 20 px apart, and each one's tap
  zone is grown to 44 px for a finger — so neighbours' zones overlap by 24. The first chip in
  the list took the tap: on a 390×844 phone (no window frame) the three chips stacked on the
  left edge and a finger on the planet plate's centre set the autopilot to the station.
  Of the zones hit, the chip whose centre is nearest now wins.
- «система: по метке можно ткнуть…» taps every chip at its centre and checks two synthetic
  overlapping zones, so the laptop's 1280×800 run catches it too. Found by the server lab
  (11.09); the laptop's phone window loses ~160 px to the frame and laid the chips in a row.

## 0.444.0 - the phone stick draws again

- 0.439.0 deleted «twenty-two dead names» from `src/`; four of them were alive. `HELM_BAND`,
  `HELM_BAND0`, `HELM_GAP` and `HELM_TRAIL` are read by the stick's band (`15b-helm-draw`) and
  by `helmTrail`, so on a phone every touch move threw `ReferenceError` after steering, and
  every frame with a live stick threw into the frame guard («СБОЙ») at the band. The four
  constants are back in `15a-helm.js`. No player report in `crash.log` since 0.439.0.
- Found by the server lab (session 11.09, «телефон: стик не ложится на приборы и подсказку ·
  HELM_GAP is not defined»). The laptop's default run is the 1280×800 window and never met
  it; `test.ps1 -Mobile` does.

## 0.443.0 - one picture oracle instead of two

- The old net «картина: ни одна сцена не уехала от эталона кадра» (M336: tones, masses,
  contrast and emptiness per scene against a pinned table) re-rendered every scene the golden
  suite had just settled — 11 s of a 230 s run. Its numbers are now taken inside the golden
  loop from the same settled frame, in the same 1280×800 window, with the same tolerances.
- For that the golden suite left quarantine: it judges now. A golden shot on another platform
  (the block grid differs — the server's headless has no window frame) is reported as «no
  golden here», not as a failure; a missing golden stays red.
- The zoo's «resetWorld оставляет поле» mutant had no named killer and died only when the leaked
  field happened to land on a sensitive neighbour — after «картина» left the order, it survived.
  The resetWorld suite now marks every ephemeral list (pirates, shots, loot, barges…) before the
  reset and demands them empty after; the mutant names it. The net's first catch: `G.barges`
  was never reset and rode from suite to suite.
## 0.442.0 - four fields that were lost on load, and a lab that runs all day

- **Four fields now survive a save:** the kill count (the clearance exam and a manager's
  «six kills» job counted from it and restarted from zero after every load), the order stamp
  (the «silence on the air» job compared against it and failed at once after a load), the
  base-visit counter (the seed of the next аврал), and the receiver's frequency — the one
  thing the console said it kept. An old save without them loads with zeros and an untuned
  dial. The save net's seven «?» fields are settled: these four persist, `hailLog`,
  `quietGone` and `logNewBy` stay per session, with reasons beside them.
- **The lab runs four sessions a day** instead of one a night, in smaller units — twelve
  light shards, the phone and the tall window in four each, one heavy suite per Chrome — and
  the fuzz hunt no longer stops itself; a seed the host killed does not count as «nothing
  new». After every unit the leftover Chrome processes are killed and the memory counter is
  waited down: `timeout` killed only the parent, and the renderer it left behind was the
  likely reason one OOM followed another.
- **The lab page shows what became of each bug:** open, «починено в 0.441.0», «не повторяется
  с …» (set by the lab itself when the same run goes green in a newer build), «не баг: …».
  Tiles, the bugs, what ran into the host, one row per session — the charts and the raw
  run list are gone. Staged suites no longer land in the error log.
## 0.441.0 - the map answers on your own sector, and one silence less

- **On the map, ДЕЙСТВИЕ with your own sector selected now says «Вы уже здесь — выберите
  другой сектор»** instead of nothing. The prompt promised ПРЫЖОК and the game stayed silent;
  the promise suite saw it the moment the map started stepping in `updateMap` (0.438.0)
  rather than inside its frame.
- **The base scene puts the cage on the second level**, so W is judged there — the detectors'
  «base · W is silent by right» is gone (the cage stood on the top level with nowhere to go).
  The first attempt was blocked by the promise suite, and that was the suite's fault: it hashed
  the first 4 000 characters of the mode's JSON, and the base object comes first, so an opening
  menu never fit. It hashes the whole mode state now (`stateHash`).
- The «Сорока» scene stays at the ladder for now: two steps in, the same-hash suite goes red
  under seeded hands — something on the corridor's buy path reads real chance or real time.
  Named in `PLAN.md`. The three goldens were re-shot for the moved base scene.
## 0.440.0 - golden frames keyed by the window you asked for

- **A golden frame is looked up by the window `test.ps1` requested** (`?win=1280,800`), not by
  the `W×H` the page measured — that number was the headless window's own (1280,800 came out as
  1248×641; on another machine it differs, the golden «was not found», and the suite passed on
  a count). The three files in `docs/golden/` are renamed to the requested sizes, and a window
  without a golden is now red with the exact `-Accept` command to take one.
- **`stateHash` no longer depends on the order techs were bought**: `Set` and `Map` members that
  are primitives are hashed sorted. Two identical worlds with different histories hash alike.
## 0.439.0 - tiers by evidence, and twenty-two dead names

- **A suite's tier is decided by what its body touches, not by a word in its name.** 132 suites
  that never read a pixel, the DOM, audio or the network moved from Chrome to Node (137 were
  tried; five went red under the stubs and stayed where they were); five Node suites that read
  `getBoundingClientRect`, `ctx.`, `drawWorld` or an element's style moved to Chrome, where their
  numbers are real. Node tier 481 → 616 suites (22 → 25 s), Chrome tier 295 → 168.
- **Twenty-two top-level names nothing called** are gone from `src/` — `BASE_STANDBY`,
  `chessCanMove`, `crewHostages`, `deltaHtml`, `drawHoldMods`, `ethReset`, `mailDrop`, `namesBlock`,
  `recOn`, `rungDef` and twelve more — after one grep each across sources, tests, site, tools and docs.
## 0.438.0 - the audit of the night's tooling, and the save net

Four hostile reviews of 0.428.0–0.437.0 and a survey of `src/`; the milestones stand, the
tooling around them had holes. Fixed here:

- **`test.ps1 -Mutants` no longer erases uncommitted work** — it restored a mutated file with
  `git checkout --`, which rolled back the whole file; now it writes back the text it read.
- **`-Changed` cannot pass by running nothing** — no matching suite means the fast tier, and a
  change to `tests/90*` (harness, tools, detectors) means the full corpus, not «the file itself».
- **A shard has a ceiling** — 900 s, then its own Chromes are killed and the part is reported as
  hung; `--timeout` never worked under the new headless (the 33-minute GPU spin of 10.09).
- **`resetWorld` restores the player's options** (`OPTS_BOOT`) — the two drivers' private
  workaround is gone, and the hostile-save suite no longer leaks a text pad size into its neighbours.
- **The clock law also refuses** `Math["random"]`, `Date["now"]`, `new Date` without parens; a
  `typeof` check on a function that does not exist now fails the build instead of warning.
- **The map jumps on the world step** (`updateMap`), not inside `drawMap` — the world changed in
  drawing, so without a frame (hidden tab, a suite without pixels, the bot) there was no jump.
- **The save net** (`91zzzzzzzzz-savenet`): every field on `G` is either in `snapshot()` or named in
  `SAVE_EPHEMERAL` (`14a2`) with a reason — 260 fields checked, seven marked «?» for the author;
  save→load→save is a fixpoint; numbers that the PHP cloud returns as strings are numbers again
  for every option (`optsNumify`), not only the pad size.
- `T.bot("undock")` can go red (no button was «leave()»), `T.replay` refuses a recording from
  another version, the trips oracle has absolute anchors beside its own-median thresholds,
  `detRuler` runs last, a broken desk item goes to the crash log instead of silence.
- `docs/INDEX.md` names where a symbol ends (`file:start-end`), so a session reads a function by
  exact offset; `PLAN.md` back to 52 KB (the closed «Сорока» queue archived); docs stopped saying
  there is no `node` on this machine. The audit's queue and the rejected refactors: `PLAN.md`,
  «Refactor audit».
## 0.437.0 - the recorder sees the screen's buttons too (M444)

A click on any button while `?rec=1` is on becomes a frame event — the button's id and label
at that frame — and `T.replay` presses it on whatever screen is open when that frame comes
(by id first, then by label); events after the last frame, a button pressed once docked, are
pressed after the last frame. The bot now opens the trade section by its button ТОРГОВЛЯ instead
of assigning the tab, so a recorded sale replays: the new suite records a flight to the station,
the docking and ПРОДАТЬ ВСЁ, replays it and gets the same credits. Drags and the wheel are still
not recorded.

## 0.436.0 - the same trip in twelve worlds, and the distribution it leaves (M446, first oracle)

`tests/91zzzzzzzzc-trips.js` sends the bot on one round trip — to the planet, land, drill a
deposit, back to the ship, launch, to the station, dock — in each of the first twelve station
systems with a habitable planet, and judges the *distribution*: frames, fuel and ore per world.
Red when a trip does not close, takes three times the median, drinks more than 80 % of the tank,
or yields under a quarter of the median ore. Today: every trip closes, median 2 152 frames, 26
fuel of 100, 12 ore; two seconds in Node, `?worlds=N` for the lab. Staged until 2026-09-18 —
the thresholds are first guesses, the lab's history sets them.

## 0.435.0 - four more paths for the bot: a fight, the base, the home, the wanderer's shelf (M444)

`T.bot("fight", frames)` turns the nose onto the nearest pirate, thrusts from afar and fires
inside a cone until the enemy is hurt or gone; the walk finds the first system on rings 18–27
where a patrol spawns, arms the ship and fights for six hundred frames. Three more walks drive
the base's lift and compartments, the home's room up to a thing worth looking at, and the
wanderer's shelf with a lot bought for matches. Twelve paths under all six detectors, about
twenty seconds in either window; nothing new to fix this time.

## 0.434.0 - the last minute of input, recorded by frame and replayed to the point (M444, part three)

`?rec=1` turns on the recorder (`src/15c-rec.js`): every world frame stores the key mask and the
step, in segments of thirty seconds; each segment carries a head — a copy of the world snapshot,
the position of the game's chance (`rndState`), the clock and `G.t` — and the autopilot targets a
tap sets are kept as frame events. A segment only ends in a stable mode (flight, dock, map),
because the snapshot deliberately keeps nothing ephemeral: a head cut mid-drilling would restore a
different strip. F8, or `recMark()` in the console, puts the last minute into `localStorage`
`drift.rec` and the console. `T.replay(rec, {seed, hour, each})` in the tools restores a head,
then feeds the same keys at the same step — on the same seed the world arrives at the same
point, on another seed or hour it just has to live, under the detectors. The suite
`91zzzzzzzzb-replay` (Node, 0.7 s) records a bot's flight, landing and drilling, replays it to
the same cargo, position and fuel, and replays it again at three in the morning on seed 5.
Found on the way: `snapshot()` returns an object that shares references with `G` — a kept
snapshot drifts with the world (the replay began with thirteen ice it had not mined yet);
the recorder copies, and `docs/GOTCHAS.md` says why. Screens' clicks are not recorded — that is
the recorder's boundary, named in the module.

## 0.433.0 - the mutant zoo, and a run that knows what you touched (M445, M444 part two)

`tests/mutants.json` holds eleven one-line breakages, each a bug from the project's history: a
`zoomStep` that does nothing, map type without the ruler, the sky riding with the sheet, W without
thrust, a lying fuel readout, an icon button without a word, a manager field off the save
whitelist, a perk nobody reads, a mode drawing an empty frame, a bare label on a day sky,
`resetWorld` leaving a field. `test.ps1 -Mutants` applies each in place, builds, runs the suites
it names as its killers (`?only=a|b` now matches any of several fragments) and restores the file
through git; one line per mutant — killed by which failure, or ВЫЖИЛ. First run: ten of eleven
died in 266 s; the survivor, the button without a word, was a hole in the detectors — the law
detector now refuses any visible control with neither text nor `aria-label` nor `title`, and
the eleventh dies too. A survivor is fixed in a detector, never by dropping the mutant.

`test.ps1 -Changed` runs only what your edit touches: `build.ps1` writes `docs/TESTMAP.json`
(for every test file, the `src/` modules whose top-level symbols it names) and stamps each test
file into `tests.html` as `TEST_FILE`; `-Changed` reads `git diff HEAD` plus untracked files under
`src/` and `tests/`, picks the test files that name a changed module, and runs them in Node and in
Chrome — heavy suites included, usually in seconds (`-Files "91a-flight|91c-mgr"` picks by hand).

## 0.432.0 - a bot walks the player's paths, and the detectors judge every step (M444, part one)

`T.bot(goal)` in `tests/90a-tools.js` is no longer a stub: `star`, `station`, `planet`, `dock`,
`undock`, `sell`, `land`, `mine`, `ship`, `launch`, `dig`, `up`, `jump`, `save` — each through
the player's own controls (the autopilot a tap sets, ДЕЙСТВИЕ by edge at the pier and the mine
mouth, keys to walk and drill, the held ВЗЛЁТ button, ПРОДАТЬ ВСЁ on the counter), each
answering `{ok, frames, why}` so a scenario says *where* it stuck rather than throwing.
`tests/91zzzzzzzza-walks.js` writes eight paths in five lines each — first minutes (К ЗВЕЗДЕ,
the station, dock, undock), landing and a deposit to a full hold and back into orbit, the mine
three tiers down and up, trade, a jump to a neighbour, the belt under random hands, fire in
flight, save and reload — and runs all six detectors after every step, keeping the screens a
step opened. The run prints a coverage map (mode × step in this window). The first pass found
three labels the scene runs never saw: «МАСШТАБ ×0.70» over a planet disc in orbit (contrast
2.1, and still 2.4 on the phone behind a half-transparent plaque), «ШАХТА» at the mine mouth and
«ПЕЩЕРА» at the cave entrance on a day sky (1.9 and 2.2) — all three on a plaque now. The
blink/pop detector no longer judges a frame whose camera is moving (after launch or a jump the
ship is under way, and bodies entering at the frame's edge are a pan, not a flicker). Left for
part two:
`?rec=1` recordings with a «bug here» key, replay under perturbation, `test.ps1 -Changed` from
`docs/TESTMAP.json`.

## 0.431.0 - the fifth and fourth oracles: golden frames and a hundred worlds (M443 closed)

Two oracles that judge no case and no law, only *difference*. **Golden frames**
(`tests/91zzzzzzzzz-golden.js`): every `lookScenes` scene is reduced to a block signature (the
quarter-size luma the detectors already grab, one byte per 8×8 block) and compared with
`docs/golden/<W>x<H>.json`; a scene is red when more than 3 % of blocks moved beyond 18/255.
Baselines exist for the three windows the harness runs (1280×800, the phone, the tall one);
`test.ps1 -Accept [-Mobile|-Size]` re-shoots one window after a deliberate picture change and
writes the file — kilobytes of text, no PNG in git. **A hundred worlds**
(`tests/91zzzzzzzzz-worlds.js`, Node, 0.3 s): every station in six rings from the start is asked
the same three questions — is there a station within one jump on a full tank, does any neighbour
pay more than ×4.5 for what this counter sells, is fuel here more than ×3 the median — and the
run prints the distribution of the best one-hop deal (median 3 352 net per full hold today).
Both are staged until 2026-09-18: they print, they do not decide the verdict, and the lab's
history sets their thresholds.

Also: the same-hash suite now runs each scene twice *under seeded hands* (input timestamps,
edge latches and the ghost click are on the game clock since M441 — this proves it); an
exception inside a scene's settle is a «сбой» with the scene's name instead of a silently
half-baked frame; the tools' self-test no longer expects the «+ −» box and a three-button rail
on the phone (it was red in `-Mobile`, and would have been red in the lab tonight).

## 0.430.0 - one set of hands and eyes for every test, and rules the harness enforces itself (M442)

`tests/90a-tools.js` gathers what five suites each wrote for themselves: actuators `T.go(scene, seed)`,
`press`, `hands`, `tap`, `drag`, `wheel`, `wait`, `advance`, `window`, `give`, `board`/`leave`, and
observers `T.frame`/`diff`, `state` (the game's `stateHash()`), `look`, `ledger`, `text`, `controls`,
`clock`; the old names (`fuzzRich`, `prSpoke`, `e2eHands`, `clkShift` …) stay as one-line wrappers, and
the clock tools move the game's own clock instead of patching `Date.now`. `docs/stand.py` drives one
headless Chrome over CDP (stdlib websocket) through every scene and window size. A suite now declares
its tier in place — `suite(name, {tier, win, stage}, fn)` — and `SLOW_SUITES`/`NODE_BROWSER`/`NODE_SKIP`
are gone; `stage` is quarantine (reported on its own line, never the verdict). A suite with no assertion
is red, and a net over the test sources keeps `ok(true` and `typeof`-guards at zero (there were 126 and
190). `?shuffle=seed` (`test.ps1 -Shuffle N`) runs the suites in a reproducible order and `?pick=i,j`
bisects it; the shuffle found page state outside `G` leaking between suites (a picked hull, a stuck
«ghost click» mark that swallowed every button for the rest of the page) — restored after every suite now.

## 0.429.0 - the tests judge laws, not cases: four detectors and the ten bugs they found first (M443)

After every step of every `lookScenes` scene × five gestures (idle, W, A, drag, wheel/«+»), plus the menu
doors and an armed ship, detectors now check: **crash** (frame guard, `onerror`, console, with the stack's
place); **stuck** (a mode without its state, a screen its own close control cannot shut, a frame that did
not move under a key); **law** (NaN/∞ and type changes in `G`, a `Proxy` prototype counting reads of fields
nobody writes, 291 on-screen readings checked against their fields — «РАКЕТА 0» with missiles aboard dies
here — and what W, A, «+» and a map drag must *do* on screen); **picture** (empty or burnt frame, idle
blink and pop, contrast ≥ 3, text ≥ 8 px × the UI ruler in a 2560×1440 frame, canvas sharpness, one human
height on foot). The whole pass costs 8–12 s. Its first run found, and this version fixes: type that
ignored the UI ruler at 1920 and up in six places (system names, the belt cockpit and glass HUD, the scoop
heat gauge, the base board and note card, the home room name, «Сорока»'s chalk prices at 7 px); unreadable
ground labels on a day sky (contrast 1.2), the sanatorium schedule, «ПОЛОСА СБОРА» on the gas, the map's
scale and stats line on a phone; and НАСТРОЙКИ, which would not open once a cloud save had brought the pad
size back as text («1.25») — the loader now turns it back into a number.

## 0.428.0 - the game owns its chance and its clock (M441)

`rnd()`/`rndFx()`/`rndSeed()` and `now()`/`clockSet()`/`clockAdvance()` live in `01-core`, with named
real-clock escapes (`wallMs`, `wallNow`, `uidRand`). All ~400 raw `Math.random`/`Date.now`/
`performance.now`/`new Date()` calls in `src/` were migrated by class (state, picture, game time,
real time), and `build.ps1` now refuses a raw call anywhere else, or the world's `rnd()` inside a draw
function. On a pinned clock the frame step is fixed, so two runs of each of the 15 `lookScenes` on one
seed give the same `stateHash()` (`08a-statehash`) every hundred steps; that test found and closed three
leaks between suites (`G.logNew`, `G.msgT`, the radio console's own once-a-second phase). Suites start at
one seed and one minute (`?hour=` moves it): «план: комбинат» asserts exact numbers again and `bNoDir` is
deleted from the seven base suites. The build's two slowest checks became single regex passes: 116 s → 5 s.
Players see nothing: both streams are seeded from the real clock at boot and nothing new is saved.

## 0.427.2 - the lab's first night, answered: two reds, one law, and the log learns to tell host from game

The three-hour session of 10.09 (127 runs, 65 fuzz seeds) left eleven open keys. Two were the game's:

- **Ceramic armour overshot the hull.** Buying «Керамическая броня» did `G.hull+=30` flat; a worn
  hull (12s-wear) has a lower ceiling than the formula, and the gift climbed over it - «корпус 280
  из 250» under the full-hold sweep. The gift is clamped to `stat().hullMax`, read after the tech
  is written.
- **«Ничто не спорит со звездой» went red by the wind.** The suite cleared the storm but not the
  clouds: a cumulus drifting over the disc dimmed it to 0.52 while its lit neighbour read 0.69
  (Нейэль I). Bisected on the host by switching painters off one at a time - not the giant, not
  the shafts, not the haze; the clouds. The game gets a door, `CLOUDS_OFF` in `19e-clouds`, the
  same kind as `CHRON_FREEZE`, and the suite measures the sky through it. Clouds keep their own
  paint law in the suite above.
- **And a law the bisect found on the way:** a gas giant lit by a red star was painted with the
  yellow-star palette, so its rim and rings read brighter than the disc that lights them (law 7).
  `skyGiant` now scales lit side, shadow, rings and rim by the star's luminance against the
  yellow default - unity for a yellow star, the picture unchanged there.

The rest were the host's 768 MB, not the game's, and the log now says so: an OOM or a timeout
carries class `host`, the page opens on «игра» and keeps «хост: память и время» a click away.
`lab.py fix <key>` closes a key by hand; a key not seen for three finished sessions goes quiet by
itself and reopens the moment it is seen again. The fuzz timeout drops to 150 s - a live seed
takes ~105, and nine dead ones cost the first night forty-five minutes.

---
## 0.427.1 - the lab's first catch: a base suite that went red by the hour

The lab's first session on the host (Node 16, 23:50 UTC) and the deploy of 0.427.0 both failed
on «база M391: воздух и вода» - «получено 52, ждали 108» - while the same build was green at
22:03. The suite measured three shifts of breathing with the director (M397) switched on, and
the director is seeded by the number of the *real* shift: at some hours of the day he vents the
air. The file's own rule since M418 is that a measurement of arithmetic runs without weather
(`bNoDir`); the four `baseResolve` calls of that suite now do. Nothing in the game changed.

---
## 0.427.0 (M440) - the lab: the tests run on the server at night and keep a log that does not fill up

The author, 10.09.2026: «надо сделать на сервере какую-то штуку, которая будет гонять тесты и
писать в лог ошибки… чтобы не долбилась в одну ошибку и не засирала лог… лаборатория — раздел
на сайте, графики, прогоны». Nothing in the game changed but `VER`.

**The host was measured first** (`docs/LAB.md`): shared hosting, 500 MB for the account, no
cron, no Chrome, and every process dies with the ssh session. Chrome runs there anyway -
`chrome-headless-shell` plus seven libraries unpacked from Rocky 8 RPMs into `~/chrome/lib`
without root; the Node tier runs in 18 s, a light shard in 10 s, the heavy nets one per
process («печь» 70 s, «память» 31 s, the fuzzer 22 s). Six Chromes at once die; one at a time
lives. So: **one Chrome, one heavy suite per process, and a session that somebody holds open**
- `lab.ps1` from the laptop by day, `.github/workflows/lab.yml` at 02:00 Moscow for up to six
hours. The deploy is untouched: the lab writes `~/drift-lab`, `~/drift-data/lab` and `/lab/`.

**A session** (`lab/lab.sh --budget N`): node, six light shards, the phone window and the tall
window - the two the laptop never runs by default - then every `SLOW_SUITES` name alone, then
the fuzzer on fresh seeds until the budget ends. Memory is sampled every two seconds; the page
republishes after every unit.

**The log counts keys, not lines** (`lab/lab.py`): an error is `sha1(suite | message with the
numbers replaced)`, and a known key is counted, not logged. A heavy suite that went red or gave
no report is not run again in that version. The fuzz hunt stops itself when five seeds in a row
find nothing new, and a fixed error that returns is reopened with the version it returned in.
`/lab/errors.txt` is the human form, newest last-seen first, with the detail block - the file
a fixing session reads.

**The page** `site/lab.html` at https://drift-game.ru/lab/ - three canvases in the site's
palette (sessions, the eight slowest nets over time, memory peaks against the 500 MB line), the
error table with filters and detail on click, the hunt per version, the last sixty runs. It
reads one `data.json` and has no build step. `test-node.js` gained a `fetch` stub for Node 16.

---
## 0.426.0 (M439) - the run measures itself, splits into parts, and the parts find what one page hid

The author, 09.09.2026: «У тебя там тестов на 4 минуты, зачем они нужны если все равно такие баги.
Перепридумай тесты». 0.424.0 answered the bugs; this one answers the four minutes. `-Full` now
takes **93 s instead of 292 s**, and on the way it turned four long-green suites red for good
reasons. Nothing in the game changed but `VER`.

**First the bill, because nobody had ever seen it.** The harness has had a «САМЫЕ ДОЛГИЕ» block
for a year and it has never once printed: `test.ps1` runs Chrome under `--virtual-time-budget`,
and inside a synchronous block that clock does not move, so every suite measured 0 ms and the
block was filtered away empty. The switch the harness comment pointed at - `test.ps1 -Times` -
did not exist. It does now: real clock, the thirty slowest suites, added up across parts. The
bill, 807 suites over 280 s: the ten dearest are 205 s of it, the five dearest are 139 s, and
four hundred suites do not reach a millisecond. **What costs is `drawWorld()`** - some 3 600 full
frames at ~40 ms apiece - and not scene set-up, which is what this file and PLAN had guessed
since May. Guessing is what happens when the clock is stopped.

**`--disable-gpu` was paying for three quarters of the picture.** It had stood in `test.ps1`
since the first headless run, for no reason anyone recorded. Without it headless Chrome takes the
real card: the dearest suite of all («печь: вечер») goes 49 s → 17 s, and the whole run 280 → 230.

**The corpus splits across Chromes.** Suites are independent by design - every one starts with
`resetWorld()` - so `?shard=i/N` deals them out and `-Jobs N` runs N headless Chromes at once,
adding their reports into one verdict. Heavy and light are dealt round-robin **apart**: the
forty-five heavy ones lie in clumps, and one counter would have handed a third of the run to one
part. Measured on sixteen cores: 1 part 230 s, 4 parts 131 s, **6 parts 97 s**, 8 parts 114 s,
12 parts 147 s - past six the Chromes fight over one card and lose. `-Full` takes half the cores,
capped at six.

**And the split found four things one page had been hiding.** A different split is a different
order, and the first `-Jobs 8` run turned three suites red that had been green for months:

- **The isolation net cleaned the world but not the page.** `resetWorld()` reset `G` and closed
  the road, the menu and the table - but a `.scr` left open by somebody's click sweep stayed open,
  and the next suite measured its layout through a window that was not its own, silently. The
  sweep is part of the reset now. The suite meant to guard exactly this («утечки: страница не
  остаётся в чужом режиме») had been passing on luck: it asserted a property `resetWorld` never
  had.
- **The station remembers its tab outside `G`.** `tab`, `stGroup` and `tableTab` are plain module
  variables, so a suite that walked off the station on «ЭКИПАЖ» handed the next one the ЛЮДИ
  group. The harness now puts all three back to the values they held when the page booted - the
  same rule as `G_BOOT_KEYS`, and for the same reason.
- **«станция: ДОСКА у всех» had been passing for the wrong reason.** It looked for the ДОСКА
  button on the second rail, which shows the tabs of the *current* group - and ДОСКА is a group of
  its own, one tab wide. That button is visible exactly when the player is already on the board,
  so the check held only while the previous suite happened to leave the station there. It asks
  what «у всех» means now: the group is on the first rail at every station, and it opens the board.
- **One assertion was decided by the clock ticking over.** «план: комбинат не останавливается»
  tops the shift up to 50 and then demanded `T.run >= 50`, while `tinTick` burns the shift by real
  time: one millisecond between the two `Date.now()` calls and it is 49.9993. It had been falling
  once in a few runs, it took down the 0.361.0 deploy, and under eight busy Chromes it fell twice
  as often. It asks for the rule now, not for the tick.

**Four suites that could not go red.** «проба · …» - the economy stands - are `ok(true, …)` from
top to bottom: they print rates, slices and caps and assert nothing at all. They cost 12 s of
every full run for numbers nobody reads. They live behind `test.ps1 -Probe` now, and the rule is
by name: call a suite «проба · …» and you have said it prints rather than judges.

**Two suites stopped paying for hope.** The reference-frame suite spent forty frames per scene so
the planet's strip could finish baking - seventeen scenes, 680 full frames, 21 s, the dearest
suite in the browser tier. It asks the oven now (`settle()`: run until the strip and material
queues are empty, floor six, ceiling forty). The fuzzer drew every eighth frame - 544 draws, most
of them the same scene twice - and now draws where drawing is dangerous: the first frame after a
mode change, plus one in sixteen for the background. On the clock: the reference frame 21.5 → 6.7 s,
the fuzzer 23.7 → 2.2 s, and the work inside one page 280 → 104 s before a single part is dealt.

**Two small ones.** The head line says how many suites actually ran, not how many are registered
(«наборов 804 из 807»). And a new guard reads the tier lists back: a name in `SLOW_SUITES` or
`NODE_BROWSER` that no longer belongs to a live suite is a failure, because a renamed suite
changes tier in silence. There was one such name, left from a suite folded into the doors matrix
in 0.359.2.

---
## 0.425.0 (M438) - the sky stands still in the world, the sheet slides in front of it

The author, 09.09.2026, over a screenshot of the map: «карта двигается вместе с этой полосой и
слоем звёзд… выглядит не очень», and «полосу чуть притуши, она типа как бы должна на фоне быть».

The backdrop was nailed to the screen. The Galaxy band and the rhumb net were baked as
screen-sized layers drawn at 0,0; the nebula and the star grit moved only when the SHIP moved.
Drag the map and the sheet slid while the sky sat still - sheet and sky read as one flat plane,
and the motion looked like a diagram crawling over wallpaper.

The law now: **the sky stands in the world, the sheet slides in front of it.** The sky is
anchored to the ship - where you are in the galaxy is what the arm looks like - and panning the
map moves it by a fraction of the sheet's travel, the smaller the further the layer sits: grit
~.4 of the sheet, nebula ~.14, band ~.05. The shift saturates through `mapSkyShift` (tanh): a
small drag is honestly proportional, a long one eases into a ceiling, because there is nowhere
for an infinitely distant sky to go. The band layer is drawn with a margin along the edge, so
the shift never opens a bare rim; the nebula's field grew to match.

The rhumb net moved the other way. It belongs to the SHEET, not the screen: sixteen bearings now
radiate from YOUR system wherever the pan has taken it, and travel with the map 1:1 - the contrast
between that and the barely-moving band is what makes the depth read. Sixteen lines per frame
cost less than the full-screen layer composite they replace.

And the band is quieter: drawn at .62 alpha, it is what the addresses lie AGAINST, no longer a
glow competing with the grid and the captions. `site/war.html` keeps its own .38 - untouched.

---
## 0.424.0 (M437) - the map answers the hand, and its captions grow with the frame

The author, 09.09.2026, over a screenshot of the map: «ищи баги смотри шрифт как то размывает,
карта не увеличивается. У тебя там тестов на 4 минуты, зачем они нужны если все равно такие
баги. Перепридумай тесты, эти ничего не ловят». Three fixes, and the fourth item is the point.

**+ and − did nothing on the map.** They were wired to `setZoom` - the flight camera - while
the map has had a scale of its own since M299 (`G.mapZoom`, pinch and wheel). On the map the
pair silently rescaled the system view behind the player's back: press, nothing moves, and the
next flight starts in a scale nobody chose. They now take the scale of whatever is on screen
(`zoomStep`), and where there is no scale at all - the ground, the cave, the mine, the belt,
the base - the box leaves the rail rather than standing there as a promise nobody can keep.

**The map was the only screen whose captions ignored the interface ruler.** «One ruler, and it
is the frame» (M221): whatever the canvas draws as *interface* goes through `withScale(UIK,…)`,
as the system view and the ground do. The map never did. In a 1920 window the rail, the panels
and the hint grow by 1.42 while the map's own rulers, header, footer, course badge and system
card stayed at 8-9 px - small, thin and out of step with everything around them, which is what
«шрифт как-то размывает» looks like. The map cannot go inside `withScale` whole: its rulers and
captions hang off the sector grid, and the grid is the world - scaling it would change the map's
own scale. So the ruler enters the *type* and the interface paddings (`mapU`, `mapFont`), never
the grid coordinates.

**Auto-resolution comes back now.** It dropped after three heavy seconds and never returned by
design («чётко - мыльно - чётко хуже ровной картинки»). The price turned out to be higher than
the flicker: one landing, one first bake of chunks, one other tab stealing a frame, and the rest
of the evening is soft - including the map, which costs pennies. Down still takes three seconds;
up takes twenty seconds of a frame twice as light as the drop threshold, at most twice a session,
and the first three seconds after a scene change are not judged at all - those frames bake the
raster once and are heavy by design.

**And the tests are re-thought, because 806 suites had missed all of it** (`tests/91zzzzzzz-hands`).
Three structural holes, not three forgotten cases. Buttons were found *by their caption*, so «+»
- an icon with an aria-label and no text - existed for no suite at all. The judge was the *state*:
`prDelta` compares fields of `G`, and the dead button did change a field (`G.zoom`), just not one
the player can see. And every sweep opened `.scr` screens, while the rail lives *over* the world
and was never swept. The new contract: **the frame is the judge**. Every visible, enabled control
of the rail is clicked in every scene of `lookScenes()`, and the answer must be something the
player sees - the picture changes beyond the world's own motion, the game speaks, a window opens,
or the mode changes. A changed field is not an answer. On the code as it stood the suite reports
28 dead presses; the zoom suite fails four ways; the resolution suite measures the canvas against
the window and the drop against the return.

---
## 0.423.0 (M436) - one helm layout: the nose is the keyboard's, the cursor is the right button's

The author, 09.09.2026: «сломал управление… продумай логику, что на WASD, что на QE, мож
стрелки нахер не нужны, посмотри как сделаны другие игры». There were two keyboard schemes -
mouse (nose to cursor always, WASD along the screen axes) and arrows (everything from the
nose) - and they switched by themselves: any mouse motion over the full-screen canvas picked
the first, so W stopped meaning «forward» the moment a hand brushed the mouse, and A/D stopped
steering at all because the nose was already the cursor's. Nobody builds it that way: Endless
Sky, Starsector and Escape Velocity steer from the nose and hand the nose to the mouse by an
explicit gesture.

Now there is one layout. W is throttle, S is the brake, A/D turn, Q/E strafe, Shift puts every
thrust through the thrusters; the arrows are the same keys under other caps, not a second
scheme. The mouse leads the nose only while the right button is held (Starsector's Shift), and
while it is held A/D become strafes - the rudder is the cursor's. The missile moves to G. And
letting go is the same for every input - the ship coasts: the .55 rule («below cruise a
released throttle brakes by itself») followed the stick out, because one gesture with two
outcomes by a speed threshold read as «the ship sometimes brakes on its own». The brake is a
gesture - S, ТОРМОЗ, the thumb pulled back or held still - and it is one brake for all of
them, at the stick's `HELM_STOP`, nose-blind and undimmed by an empty energy bar. The phone
helm of 0.418.0 is untouched. The title-screen table says the new layout; `docs/DESIGN-war.md`
§1.2 is rewritten.

---
## 0.422.0 (M435) - the planet is lit by its star and rimmed by its own sky

The last consumer named in the grisaille row. Seen from orbit, a planet's day side was lifted
by a constant near-white and its limb glowed the same blue on every world that has a surface -
on the airless rock as on the ocean world. The lift is now the colour of the star (the same
`starRGB` that lights the ground since 0.420.0), the limb is the world's own daylight sky
lifted toward white, a gas giant is rimmed by the top of its palette, and a world with no
atmosphere has no limb glow at all: there is nothing there to scatter, and its terminator is
the sharper for it. The light bake carries the star in its key, so a planet seen under a
different star is baked again.

Housekeeping in the same release: two files cut at their seams. `19-mode-landing` had grown to
50 KB and now keeps the descent, the sky and the frame, while the cross-section painters -
the three-pass bake, crumbs, grass, boulders - live in `19-mode-landing-ground`; `07-planet`
keeps the orbit view and hands the relief - `RELIEF_MIX`, `LAND_ARC`, `genTerrain`,
`groundAt` - to `07a-terrain`. Nothing moved but text; the build orders them by bytes.

---
## 0.421.1 (M434) - what stands in the shadow goes into it

0.421.0 put the evening on the ground and left everything standing on it in the noon: a bush,
a column, a tuft of grass on a flank that had gone into the ridge's shadow kept its full light,
because those are drawn in the frame and not in the chunk. The shadow map is now kept per chunk
in a small memo and answered by world x, so the deco (through its colour helper), the plants
(through their tone) and the grass (a second, dimmer stroke) darken inside the shadow to half
their light and no further - the sky stays. The contact ellipse under a deco fades with the
shadow, since nothing is left to cast it. One array read per object; the map is the one the
ground already baked. The walker keeps his own light on purpose: he carries a lamp, and he is
what the eye is for.

Also: the parrot suite went red twice today by the luck of the draw. `step` is the place on the
perch, not a pose, and it slides back at .995 a frame - twenty-eight seconds from a jump - while
the suite gave the bird two seconds to settle and read whatever the neighbouring suite had left
it doing. The poses are still checked at two seconds; the place is checked at half a minute, and
the slow one is named rather than hidden.

---
## 0.421.0 (M433) - evening arrives: the ground shadows itself

Since 0.420.0 the cross-section has real light - sky in the shadow, star in the light - and that
showed what was still missing: nothing stood between a point and the star. A ridge at sunset was
as bright at its foot as at its crest, the valley behind it was lit as if the ridge were glass,
and a boulder cast nothing but the ellipse under itself. Evening was a dimmer, not a direction.

Now every sample of the ground marches a ray toward the sun and asks whether the relief or a
boulder rises above it. Where it does, the sample gets sky and no star: in the slope strip, in
the crust highlight and the движки (none in shadow), in the boulder's body, and as a mask on the
body under the shadowed edge that fades with depth, the way a ridge's shadow lies on the slope
behind it. All of it is grey in the form pass, so the glaze of 0.420.0 makes the shadow the
colour of the sky - blue on ice, green on a toxic world, black where there is no air.

It costs the frame nothing. The chunk was already keyed by the sun's side and the day's height,
so the map is computed once per chunk bake, kept on the terrain and read by every drawer of that
chunk; the ray stops at 900 px, at night no map is built, and at the zenith the ray goes straight
up and meets nothing. A suite holds the geometry: a ridge shadows the slope away from the sun and
not the one toward it, a lower sun throws a longer shadow, a boulder is a shield too, and the
penumbra is a share and never a step.

Measured at a forced low sun on three worlds (almanac issue VII): mass and contrast up by a point
or two, the pair down by as much because a shadow is cold - and the right flanks of the ridges
finally in the evening. Plants and deco are drawn live and keep their own light inside a cast
shadow; that is a tail, and it is written down.

---
## 0.420.0 (M432) - the ground is painted by its light, not by its palette

The tenth and last craft law. Every drawer of the landing cross-section used to pick its own
colour out of the world's palette - the ground, the boulders, the beds, the material tile, the
hatch - so light and colour lived in one brush stroke. What followed was visible in every frame:
the light on most of the picture was a **constant** (a fixed black under a boulder, a fixed cream
on a bedding contact), while real illumination was computed for the slope strips alone, one ribbon
out of the whole section.

Now the form bakes in **grey** and one glaze per chunk turns grey `v` into `dark + v·(light −
dark)`, where `dark` is the sky and `light` is the star. It is the same light model the game
already had: `litRGB` is linear in its Lambert term, so the two stops *are* `litRGB` with that term
read off the grey pass instead of off the slope - the new suite asserts exactly that, by requiring
the real `litRGB` to land between the two stops. Two `fillRect`s and one `drawImage`, no pixel
readback: reading a canvas would drop the chunk into software rasterisation.

Nine kinds of detail cannot survive a trip through luminance - a vein and a facet edge share a
lightness - so veins, the lava and ice seams, oxide streaks, facet dispersion and lichen are drawn
in a third pass, after the glaze, and it never touches them. **Grey means «paint me», colour means
«I know my own hue».**

What it costs is named rather than hidden, and it was the author's call: within one world the
palette's hue ramp collapses to one hue lit from two sides, so a terran world goes from olive to
terracotta and `tones` falls 5 → 4 at noon. What it buys, on the same meter, is `mass` and
`contrast` up on every daylight frame and an ice world going 5 → 13 on mass and 6 → 39 on pair -
the beds finally reading as beds. The five-frame, three-palette sheet is almanac issue VI.

Found while measuring and fixed here: the shadow floor was flat, which is right at noon - the sky
cannot reach into a crack past the lit rock - and wrong at midnight, where the sky is the only
light and nothing occludes it. The night frame came out a black void with one lit island at the
suit. The floor now walks with the day.

**And three things found on the way in.** `PATCHNOTES.md` had carried committed merge markers since
`f434e3b`, with both sides wanted and neither chosen. The base's «выброс» halved the air whether or
not anyone was aboard, so a base founded and left became a ruin - a store of air is a store *for
people*, the rule that already governed the atmosphere leak and the fire's term on an empty base.
And the desk's «seen» mark was written to the save through `|0`: `Date.now()` has not fitted in 32
bits for decades, so the mark was stored as a different number, negative for half of every 49 days
- which is why its own suite went red by the calendar rather than by the code.

---
## 0.419.3 - a bulletin is a story, not an inventory

The feed used to say «Коммуна объявила обряд „регата“» and stop there, so the player never
learned that the fair is −18 % on one station in eight, that the strike leaves only the fuel
pump open, or that the swarm eats whoever stands still. Every one of those consequences was
already computed by the mechanic families (`12ax`–`12b1`); the bulletin simply did not say so.

`src/12an-chron-news.js` turns each chronicle record into a three-part note: what happened, in
detail the record does not carry but can be derived (the system's name, the pretext, the outcome
of an arc); what it means for you, with the real number and the real span; and a closing line in
the power's own voice - the only part allowed to lie, and all six lie differently. Nothing is
stored: the note is computed from the record and the bulletin number, so it is the same for
everyone, needs no network and costs nothing in the save. Variety comes from combinatorics -
three parts times three or four variants times six voices.

On `war.html` the headline became a rubric («РЕГАТА · КОММУНА») so it no longer repeats the note
under it; in the game the ether block in the cantina carries one note per bulletin. Suite:
`tests/91zzzw-news` - every kind of record is told, no unfilled template survives, and the span
in the text is checked against the family's constant, so shortening a fair breaks the test
instead of lying to the player.

---
## 0.419.2 - the mark of the open сводка stopped disappearing

`drift_war_v1` holds four things with four owners: the chronicle's state cache, the ledgers, the
circulars and — since 0.419.0 — the marks that say which ledger is only a snapshot of a сводка
still open. Whoever writes his own field must carry the others over, and `chronSave` carried the
ledgers and the circulars but not the marks: the mark died on the first save of the state, and the
snapshot became «closed forever» again, which is the very thing 0.419.0 set out to stop. A suite
now writes all four into the key and checks that saving the state leaves the other three alone.

---
## 0.419.1 - the old cache is not a cache, it is another history

Found on the live site minutes after 0.419.0 went out, in one tab: `chronHash(CHRON_BASE)` and
`chronHash(chronReplay(1000,null))` disagreed — a state carried over from a cache written by the
previous build, which had been computed without the chronicle's lines and therefore without
grievances or incidents. A cache like that is never rebuilt on its own: it is only invalidated
when a ledger arrives for a сводка it already covers, so a client could keep arguing with its
neighbours for days. The cache record is now `v:2`, and `v:1` is not read at all — a replay from
zero costs milliseconds, and it is the same history for everybody.

---
## 0.419.0 - M423: the log told the truth, the drones went back to work, and the chronicle stopped drifting

The author, 08.09.2026: «а посмотри мои логи в игре». Four days of `~/drift-data/crash.log`: 116
lines and not one real crash — but a hundred of those lines were the game talking to itself, and
behind the noise stood three defects. All three are fixed here, each with a suite that fails on
the old code.

**The ship's journal is not the error log.** Since 0.359.0 a hook in `28-loop` posted every `warn`
line of the journal to the server: «просто пиши всё, потом разберём». We разобрали. A drone in
the dock, pirates digging into a sector, a управляющий grumbling about his bare percentage — news,
not trouble, and a real clue was no longer findable in that wall. The hook is gone; `logShip`
(`01a-crashlog`) writes the journal line and posts the letter in one call, and it is used by the
eight places that mean a defect: storage refusing to write, a save that would not assemble or fit,
the cloud gone stale, conflicting or too large, and the chronicle disagreeing with the majority.
Suite `91zzzzzz-crashlog` reads the build itself: exactly one place in it may post the journal.

**A repaired drone is a healthy drone.** Wear was counted over the whole life of the machine —
`d.trips`, which never resets — and a drone's circle is 25 to 240 seconds, so one offline day the
loop catches up adds more than a thousand circles. After a week the break chance had climbed from
1.5% to 11–15%, and eight minutes of dock ate the shift: the author entered the game to find eight
of his thirteen machines standing at «Лухаара», three sessions running. Wear now counts from the
last repair (`d.wear`, zeroed where the loop repairs), while `d.trips` stays the machine's service
record. Suite: five days of catch-up, thousands of circles, and the break chance stays where a
healthy machine's is.

**How the chronicle could diverge at all.** It could not, by design: `step()` is integers only, the
seed is one for everybody, and replaying сводки 0…N gives the same galaxy byte for byte. But the
disk cache did not store the chronicle's own lines, and the lines are not decoration: `chronGrudge`
counts a power's grievances over the last 24 сводки from them, and the mechanic families read
incidents up to 40 сводки back. A client rising from cache stepped on with no memory of either and
walked into its own history; a client opening the game for the first time replayed from zero and
walked into another. That is the whole of «Летопись разошлась с большинством», which had fired on
every release from 0.376.0 to 0.418.0. `chronSave` now carries the tail of the lines
(`CHRON_LINE_KEEP`, wider than the longest span that reads them), and a new suite replays 400
сводки from zero, from a disk cache written at 200, and from two landings in a row: one hash.

Three more repairs around the same report, so it can be trusted next time:

- The verdict is counted **per game version** (`war.php`, buckets under `v`). The rules of the
  chronicle change with releases; a build that follows new rules is not a minority, it is a
  different history, and it used to be told off for it forty releases running.
- **No verdict below a quorum of four**, and a tie is agreement. A lone first report used to agree
  with itself, and the second, different one was declared a minority at 1:1.
- The read-modify-write of the hash ledger now runs **under `flock`**, so simultaneous reports stop
  overwriting each other along with the evidence.

And the ledger of the **open** сводка is marked as what it is — a snapshot. It used to be filed
next to the closed ones, so `since` stopped asking about that сводка forever: the client kept half
of other people's deeds in its replay while a neighbour who arrived an hour later got the whole of
it. Marked provisional, it arrives a second time, closed, and the hash for a сводка still held as a
snapshot is not reported at all.

---
## 0.418.0 - M422: the thumb goes anywhere, and pulling back is the brake

The author on the phone: «управление на мобилке говно… из любого места на экране пальцем
двигаешь и корабль туда летил… коротко назад он тормозит… за пальцем идёт широкая полоска,
чтобы понимать как оно». M410's idea was right — the stick says «fly there», not «push there» —
and five numbers around it were wrong.

**The stick is born anywhere on the canvas.** The left half was the whole rule before, so a right
hand could not reach the helm at all. A finger becomes a stick by moving 10 px or by lying still
past 420 ms — outside the 400 ms tap window, so a tap is still a tap on both halves: autopilot to
a planet, lock on a hull, the compass chips. Two fingers still pinch; the waiting finger steps
aside for them.

**Its centre runs after the finger.** Drag 250 px and the way back used to cost 250 px of thumb.
The centre now trails 82 px behind, so the way back always costs the same 82 px — «коротко назад»
falls out of the geometry instead of being a gesture of its own.

**Pulling back is the brake, and the brake is stronger than the throttle.** Thrust against the
nose went through maneuvering jets at .4: braking by pulling back took 4.1 s, while simply
resting the thumb in the dead zone took 2.3 s — the one correct guess about a phone, punished.
Braking now takes the same road as the dead zone and the ТОРМОЗ pad, regardless of where the nose
points: a full stop in 1.4 s against 1.6 s to full speed. An empty energy bar does not weaken it.

**The nose no longer spins while stopping.** It used to swing 180° to follow the thumb, and
halfway through the turn the physics jumped from maneuvering jets to the main engine. While
braking the nose holds the course; a locked mark still owns it, as before.

**A released stick always coasts.** One gesture with two outcomes depending on speed read as «the
ship sometimes brakes by itself». The .55 rule stays with mouse and arrows.

**And the drag draws a ribbon.** Its body is the wanted velocity — length and width; the fill
inside it is the actual one, so you watch the ship catch up with your thumb; its colour turns
amber when you are braking, and the dead zone becomes a «СТОП» ring that drains with the speed. A
tail follows the finger, and the same vector is drawn short at the ship, where the eye already is.
The camera also walks the ship out from under the thumb when the finger lands on top of it.

Taking a hull into the lock now costs 44 px of miss, not 40 — the interface's own finger rule,
which the helm had quietly undercut. `15a-helm` split at 40 KB: the drawing half moved to
`15b-helm-draw`.

---
## 0.417.4 - the war page speaks lore, not engineering

The lead on `war.html` talked about seeds, servers and code. It now says who holds what around
Yalta, that a bulletin reaches Yalta every six hours, that weapons are sealed there and peace is
signed there over lunch, and that the six waves tell the same story as their own victory. The
panel's «Последние двое суток» repeated the feed under the map word for word and is gone; the
panel is «Ведомость», «Войны», «Что идёт сейчас». The feed's truth option reads «летопись».

## 0.417.3 - the war map is a nebula, and the feed sits under it

The map was a checkerboard: flat squares, hard seams, identical dots. Holdings are now drawn on a
layer and blurred twice (a wide veil and a tighter core) so each power is a body with a soft edge,
cached per bulletin and width; seams between neighbours are a faint dark line, fronts still burn.
Stars vary in size by seed and unowned ones sit back. The page is a two-area grid — map over feed
on the left, the six powers on the right — so the column under the map is no longer empty; on a
phone it stacks map, panel, feed.

## 0.417.2 - the war page reads like a person wrote it

`war.html` loaded the whole «кто куда когда» feed at once — four hundred lines, a seventeen-thousand-pixel
page. Now it shows the last eight bulletins (two days) and a «ещё двое суток» button adds two more days
at a time. The truth lines were database fields («Компания: эмбарго», «Хай-Фронт заняла … была у
Рассвет»); `war-map.js` now declines the six powers (gender, genitive, dative, instrumental) and
phrases every event kind: «Хай-Фронт отбил у Рассвета «Раий»», «началась экспедиция Рассвета»,
«у Орднунга забастовка». The panel's sub-lines («на исходе · с 4 сен») were glued to the text
without a space — `.li s` is a block now. Game code untouched; the chronicle hash is the same.

## 0.417.1 - the guard reads the prose too

The control-character scan of 0.416.0 covered `src/` and `tests/`. It should have covered the
documents from the start: the two survivors it could not see were in `PATCHNOTES.md` and
`PLAN.md`, and both sat inside the sentence that **describes this very bug** - «`/кр\b/` never
matches» - carrying a raw 0x08 where the escape belonged, so the sentence read as garbage in the
one place a reader would go to understand it. Repaired, and the scan now walks `PLAN.md`,
`PATCHNOTES.md`, `CLAUDE.md`, `README.md` and every `docs/*.md`. Verified by planting a byte in
`docs/DESIGN-arc.md` and watching the build name the file and the line.

These documents are read every session; an invisible byte costs more there than in code, where at
least a regex will fail loudly enough to be chased.

---
## 0.417.0 - M421: the whole parrot, once a second, for forty-four pixels

While measuring the bakes for M418 I timed the console's perch icon and left it alone because it
was not the freeze. It is still a real cost, and now that the log is quiet it is the loudest thing
left: **the console refreshes once a second, and every refresh redrew the entire procedural
parrot** - the whole of `12y-parrot-face`, quills, plumes, scales, beads - into a 44-pixel icon.
Measured in a live browser: 4.9 ms warm on this desktop, so roughly twenty on a phone, once a
second, for as long as the player owns the bird.

At that size the pose does not read at all. The icon is redrawn every five seconds; in between,
the canvas simply stands, which is no work rather than fast work.

Pinned by counting **calls, not milliseconds** (the harness has no clock): eight console refreshes
in a row must produce one draw, and one more after the interval. Verified the way every guard
written since 0.416.0 is verified - by planting the failure. With the throttle removed the suite
reports nine draws where it wants one.

One nicety the test itself found: a world whose clock has restarted (`G.t` below the last draw's
stamp) redraws at once, or a new game would show an empty perch for five seconds.

**And the throttle shook a real bug out of the bird.** Slowing the icon's redraw changed which
suite ran with the parrot mid-gesture, and «трепло: репертуар» went red on `bow` - it asserts that
at rest every degree of freedom is zero, but it was reading live module state that `resetWorld`
does not touch. Repaired into two checks that are about different things: the *declared* rest is
read out of the `PAR` table in the page's own source, and the *return* to rest is measured by
clearing the gesture, muting new ones and letting the springs settle.

The second check failed on its first honest run, on the phone tier: **`PAR.turn` never decayed.**
It was not in the decay list at all - the gestures that use it zero it themselves, one explicitly
at the end and two by ending on a bell curve. That holds only while a gesture runs to completion;
interrupt one (close the window, reset the world, clear `act`) and the bird stayed turned for
ever, at 0.55 of a full turn. It decays like everything else now, before `parActs`, so a running
gesture still overwrites it on the same frame.

Full tier green: 17822 full / 17541 browser / 17631 phone / 11859 node over 788 suites, plus two
long fuzzer runs on different seeds.

---
## 0.416.0 - M420: the byte you cannot see, and the last suite that claimed milliseconds

Two consequences of 0.415.0's finding that the harness has no clock, and one of them bit me while
I was writing the guard against it.

**The only suite in the repository that asserted milliseconds was mine**, in `91zzzw-fx`: «шестьдесят
сводок с курсом считаются мгновенно», `Date.now()-t0<3000`. Vacuous - always true, catching
nothing. What it was actually guarding is worth guarding, so it now counts **work**: a wrapper on
`chronReplay` proves that sixty chronicle steps do not each trigger a full replay. That is the
failure it was written for, and now it can see it.

**And a guard was added so no suite can claim milliseconds again** - it reads the page's own
source, finds every time comparison, and fails if one sits inside `ok`/`eq`/`near`. Waiting on a
clock stays legal: between `setTimeout` calls virtual time does advance, which is why `99-run`'s
wait for the first frame is correct and must not be flagged.

**Then the guard came out green, and it was lying too.** Written through a shell heredoc, its
`\b` had been eaten and replaced by a literal 0x08 byte, so the regex read «backspace, then ok»
and matched nothing, ever. This trap is written down in `CLAUDE.md` - it has cost this project a
green-looking regex before - and the rule still did not stop me, because a rule that is only
prose is checked by nobody.

So it is checked now. `build.ps1` scans every source and suite for control characters other than
tab and newline and names the file and line:

    ! управляющий символ в исходнике (съеденная обратная косая? см. CLAUDE.md): 02-world.js:2 0x08

Verified by planting one and watching it be found. A sweep of everything touched today turned up
no others in code; the two in `PATCHNOTES.md` and `PLAN.md` are older prose *describing this very
bug* and carrying it - left as they are, since they are quotations of the accident.

Full tier green: 17811 assertions over 787 suites.

---
## 0.415.1 - two notes from the parallel session, both right

- **The probe took the press only when it could afford it.** `probeClaim` returned whatever
  `probeBuy` returned, and `probeBuy` returns false on an empty account — so on a poor ship the
  same press produced «Зонд стоит 900 кр» *and* «ЦЕЛЕЙ НЕТ», one over the other, in one frame.
  What claims a press is the fact that the probe was on offer here, not the luck of the purchase.
- **The walk hint was a third prompt line in every compartment, every time.** It is teaching, and
  teaching ends when it has been used: it now disappears the moment the player takes their first
  step inside the base, not after a timer. Two lines again.

Both found by the session working the war layer in a parallel worktree, reading the frame rather
than the diff. `site/war.js` joins this and every later commit of mine, at that session's request:
the deploy rebuilds it regardless, but the repository should not disagree with the site.

---
## 0.415.0 - M419: what the oven does in one go, and the harness has no clock

M418 found a 383 ms synchronous bake that had been in the game for three hundred versions. Nothing
caught it: the tile came out correct, no frame crashed, no exception was thrown. The game simply
stopped for a moment, which is not a thing any suite was looking for.

`tests/91zzzzy-bake` has measured the oven since M358 - how much raster the game holds and how
often it re-bakes - but never **what it does in one go**. That is the gap, and it now holds one
property: every heavy bake has either a budget or speed. The new suites assert that a cold ask for the ground material bakes *no rows at all* (it
queues), that one slice is bounded, that the budgets are declared as numbers rather than assumed,
and that the synchronous path exists only for stands — `planetMatNow` must not be called from
anywhere in `src/`, checked against the page's own source the way the names net checks that a perk
without code is a lie.

**And writing it turned up something that invalidates a whole category of test.** The net's first
draft asserted milliseconds. It passed - and then kept passing when it should not have. The
harness has no clock: `test.ps1` runs Chrome with `--virtual-time-budget`, and inside a
synchronous block time does not move. Measured: thirty million square roots between two reads give
`performance.now()` 0.00 ms and `Date.now()` 0 ms.

Two consequences, both now written into `CLAUDE.md`:

- **any suite asserting «this took under N ms» is vacuous there** - not flaky, always true;
- worse, **code that paces itself by the clock degenerates in that harness to doing everything at
  once.** `matTick` did exactly that: with a frozen clock its «until the budget runs out» loop
  never ran out, so the tests exercised the whole-tile bake - the very path M418 removed - while
  the real browser ran the sliced one. The suite was testing a code path no player ever executes.

So the bake is now capped by *work* as well as by time: `MAT_CAP=8` rows beside `MAT_MS=3` ms. In
a real browser the clock stops the slice first (two or three rows) and the cap never binds; where
the clock is frozen or coarse, the cap does. The net asserts the cap, because that is the part it
can actually see.

`test.ps1:90` already counted its seconds outside the page for this reason. The knowledge existed;
it had just never been carried across to what a suite is allowed to claim.

Full tier green: 17789 assertions over 781 suites.

---
## 0.414.0 - M418: the freeze had a cause, and it was 383 milliseconds of noise

0.413.0 cleared the crash log of its own false alarms and left one real line in it: **2766 ms on
a Pixel 8, nine seconds into the page, mode `system`.** This is that stall, found and measured
rather than guessed.

`planetMat` - the planet's ground material, a 256×256 tile with two to five multi-octave noises
per pixel - runs **as one synchronous block, and it takes 383 ms on this desktop.** Measured in
a real browser, not under virtual time. On a phone that is comfortably two to three seconds:
exactly the stall in the log, at exactly the moment the world first needs ground.

It is now baked the way the game already bakes the planet's own texture (`planetStripTick`,
`07-planet`): sliced into rows, a couple of milliseconds of each frame, and until it is ready the
ground is drawn *without* it. Nothing disappears - every caller already handled a missing
material, because `drawGround` falls back to a flat silhouette fill and `drawRocks` to a boulder
without rock. For the first second or so the ground has no grain. That is the whole cost.

**The budget was measured, not decided.** The first cut checked the clock every eight rows: one
slice measured 11-14 ms, i.e. the entire frame, so a single freeze became thirty-three stutters -
worse, not better. A row costs about 1.4 ms here, so the clock is checked every row; the worst
slice is then 6.2 ms and the median 4.6, across 108 slices. And because the budget is in real
milliseconds, it scales itself: a slower phone does fewer rows per frame and takes longer, but
never blows a frame.

Two things the pinning suite caught while being written, both real:

- **a stale job blocked every later one.** `if(!MAT_JOB)` meant that once a bake was in flight,
  asking for a *different* planet's material returned null for ever - the player standing on a
  new world would never get ground grain. The newest planet asked for now wins.
- **`docs/shot.py` came out without grain**, because a stand runs six frames and six frames bake
  twenty rows of two hundred and fifty-six. Stands and suites pay the 383 ms in one piece through
  `planetMatNow`, which exists for exactly the places where there is no frame to spread across.
  The frame meter on `surface` reads identically to before the change - 4 tones, pair 7, contrast
  .55, mass 11, empty 40 - which is the proof that nothing about the picture moved.

Full tier green: 17782 assertions over 781 suites; browser and phone tiers too.

---
## 0.413.0 - M417: the instruments that lied

`PLAN.md` has carried one line for weeks: «The author's freeze has no cause yet… Next step is to
read `crash.log` after the next freeze.» So I read it. Seventy-eight entries, and this is what
they were:

| kind | n | what it actually was |
|---|---|---|
| `journal` | 70 | «Летопись разошлась с большинством» - a false alarm, every single time |
| `stall` | 2 | one real 2.8 s hitch on a Pixel 8; one 11.7-minute «stall» that was a hidden tab |
| `probe` | 4 | |
| `beat` | 1 | «fps Infinity» |
| `outside` | 1 | |

**Three instruments were broken, all in the same way: they fired always, and so meant nothing.**

**The frame-stall detector counted a hidden tab as a freeze.** The guard did carry
`&& !document.hidden`, but it asked at the wrong moment: `requestAnimationFrame` wakes up *after*
the tab is restored, so by that line the tab is visible again and the gap it measures is the whole
time it spent hidden. That is where «кадр стоял 701631 мс» came from - eleven and a half minutes
of a minimised window, filed as a freeze, in the log kept specifically to catch a freeze. The
hidden period is now remembered *when it happens*: a `visibilitychange` handler clears the frame
mark, and the first frame after a return is not measured.

**The fps pulse had never measured anything.** `frameLastAt=now` sat one line above the
accumulator, so `now-frameLastAt` inside it was always zero: the sum of frame times never grew,
`1000/0` went to the server as «fps Infinity», and the server stored it as 0. The whole
«measure what players actually see on their own phones» instrument had produced exactly one row
in `digest.json` - `{"0.360.0 system desk": {"n":1, "avg":0, "min":0}}` - since the day it
shipped. It now counts from the previous mark, like the stall, and refuses to send anything that
is not a finite number in range.

**And the third is not ours to fix, so it was reported with the proof.** «Летопись разошлась с
большинством» fires on every load. The live tally on the server for сводка 995 is
`{"h":{"3714082066":22}}` - one hash, twenty-two agreements, i.e. *everybody agrees* - and the
server still answers `agree:false`. `site/war.php` writes the client's hash string as an array
key, and PHP casts numeric string keys to int; `array_key_first` then returns an int, `$h` is
still a string, and `===` is strict. Verified on the host itself: `$top === $h` is `false`,
`(string)$top === $h` is `true`. The chronicle has, as far as this instrument can tell, never
diverged - and 70 of the 78 log entries were this.

What is left in the log once the noise is gone is the one real thing: **2766 ms on a Pixel 8,
nine seconds in, in system mode, right after «В вещах нашлось живое: трепло «Пискля»».** That is
the first honest lead the freeze hunt has ever had, and it is written down here rather than
chased on a hunch.

Guarded by three suites in `91zzzzzp-clocks`: the previous mark is taken before it is
overwritten, the pulse counts from it, and nothing that is not a finite number is sent.

**A fourth clock-dependent instrument, found the same hour and in our own suite.** «база M408:
реестр считает всегда» went red on a change that had nothing to do with ПАЛАТА: it took the shift
number from `baseShift()` - i.e. from the wall clock - and then called `palStep(B, n+3)`. When
that window happened to land on the middle of the reporting period, the inspector arrived with his
fine and «пеня 180» read «300». The suite was red because of the time of day. `bShift(k)` in the
base helpers now returns the current shift *aligned down to a multiple of k*, so the absolute
number still tracks now (a test that resolves from `B.t0` to `Date.now()` needs that) while the
position inside every schedule is pinned. The rule is in the helper's own comment: a suite that
does arithmetic on a shift number takes it through `bShift(X)`; bare `baseShift()` is only for a
number that goes no further than a journal line.

Full tier green: 17770 assertions over 779 suites.

---
## 0.412.0 - M416: the pacing guard, and the line that could arrive on day one

P8, the last craft law that was actually blocked rather than a fork. Its own contract forbade
building it before the first ending of the second act existed; that has been true since 0.216.0,
and the guard was still waiting. It is built now, and the wiring found exactly the fault the law
was written to prevent.

**Part VI's «Вы просто не тянете» had no window at all.** The heaviest line in the game — the one
man who says it to your face, once per game, and whom the game confirms with nothing because he
is wrong — was unlocked by three shut doors and nothing else. Three doors can be shut in a first
evening. It could arrive before anything had been lived: the textbook case of what Emily Short
calls the disease of salience architecture, a player satisfying an ending's preconditions more or
less by accident.

It now needs its three doors **twenty sky-days apart** and **two hundred days lived**. A shut door
is a deed; three of them in one evening is a bad evening, not a life.

`src/11d-clocks.js` executes the contract in `docs/DESIGN-arc.md` word for word: `CLOCKS` is the
one table where every ending's window is declared, a segment advances only on a named deed and
only after the minimum gap, and **the guard writes nothing** - no line, no journal entry, no hint
that a window exists. It only withholds. Preconditions met early simply wait.

The other two endings keep their numbers exactly: the medical board (twelve years of стаж, the
core counter) and «Тихоня» (five deeds in the kindness ledger, a year, a home). The yacht's clock
*reads the ledger* rather than keeping a second count of the same deeds - two counts of one thing
drift apart in about ten versions.

The point of a table, though, is not the three rows in it. It is that a fourth ending cannot be
written without one, and `tests/91zzzzzp-clocks` fails if it is. That suite also pins the parts
that are about what does *not* happen: fifty observations advance no clock, the guard leaves
`G.msg` and the journal untouched, and a corrupt save cannot inject a segment. `91zzzx-late`, the
suite that used to reach part VI by shutting three doors on day zero, now has to live the life.

Full tier green: 17756 assertions over 776 suites.

---
## 0.411.0 - M415: the split debt, and two guards that stopped crying wolf

The four biggest modules were past the size the build records for them, and the plan has carried
them as named debt since 2026-08-25. Cut along the seams the audit already named - nothing moved
that was not already a separate thing:

| module | was | now |
|---|---|---|
| `12ai-fleet` | 58 KB | 27 + `12ai1-fleet-art` 33 - the sprite conveyor, house makers, trade glyphs and the lit hull knew nothing about passes, fuel norms or call-signs |
| `26-ui-station` | 67 KB | 41 + `26e-ui-station-trade` 26 - board, market and yard were the last three tabs still inline; the other five have lived in `26b`/`26c` for versions |
| `21e-surface-draw` | 60 KB | 18 + `21e1-surface-world` 43 - `drawSurfaceWorld` is the world, the rest is the frame around it |
| `14-save` | 70 KB | 44 + `14a1-save-rest` 27 - `applySave` splits in exactly one place, where no local crosses the border (`seen` ends earlier, `pn` too, `st` is declared past the seam) |

**And two guards that had started to lie.**

`build.ps1` warns about a module past its recorded size, and the record was last taken on
2026-09-02; by today it was shouting thirteen names every build. A guard that always shouts is
not a guard - the note in the table says so itself, from the last time this happened. The
measurements are retaken, so silence means «not growing» again. `21e1-surface-world` is recorded
at 43 KB with its own next seams named in the comment (the mine mouth, the tracks, the night):
it is one 590-line function, and splitting a coherent function on a byte count would be worse
than carrying it.

The ghost guard - `typeof foo==="function"` around a name nothing declares, the pattern that
turned `mgrHire(mgrRoll(...))` into a silently empty screen - was reporting two names on every
build, and both were noise: `addEventListener` is a host global, honestly guarded because the
Node tier has no DOM. It now knows the browser globals by name, and shouts only about ours. The
one real ghost it was hiding, `stat0Gun` in `05-parts` (`const st=(typeof stat0Gun==="function")
?null:null` - both branches null, the variable never read), is gone.

Full tier green: 17722 assertions over 772 suites.

---
## 0.410.0 - M413: the base scene reads

The same review that produced 0.409.1 ended with six notes about the base scene. None of them
were about rules; all six were about a frame you have to decode instead of read. Fixed together,
because they were one fault in six places: **the frame was saying things in the wrong register
and in the wrong place.**

- **The entry journal lay across the top row of the base.** «What happened while you were away»
  is why the player flies here at all (§12), and it was printed through `say()` — centred, at a
  quarter of the height, i.e. exactly over the grid. It now has its own card in the free sky at
  the right, under the header, and fades on its own. The walk hint that followed it moved down
  to the prompt, where every other «what can I do here» lives, and is shown once per session.
- **The prompt had grown to five lines** and covered the bottom row. Energy, store and forecast
  are the base's *state*, not an answer to a keypress: they moved to the instrument board. The
  prompt is two lines again - what is under the cursor, and what the button will do.
- **The gauges were three-letter stumps** - ВЗД, ВОД, ХРЧ. There was room for the words all
  along. The board is now the base's one instrument: four gauges by name, a rule, and under it
  the three numbers the prompt used to carry.
- **The ГЛАВТРАССА pennant was the loudest patch in the frame** - full-strength red the size of
  half a compartment, hanging in mid-rock, in a scene that is otherwise brown and turquoise
  under one light. It gives nothing and should demand nothing: a quarter the size, hung by the
  gates, and lit by the same light as the rock.
- **The shaft read as an empty grey square** - a dark fill, an outline at 0.14 and ties at 0.10,
  a body with no detail anyone could name. It is a shaft now: a depth gradient, two rails with
  a highlight, a cable to the cage, rungs up the left wall, numbered levels, and a cage with a
  floor, a handrail, a door facing the compartments and one lamp that throws a cone at its feet.
- **The adjacency pipes were too faint to read as connections.** A pipe is a body and a
  highlight, not a line: a dark bed against the rock, a coloured top that names it, a coupling
  at the middle.

**And one real fault the pass uncovered.** Stepping into the shaft hit an early `return` that
was meant to drop the cursor and dropped everything after it: pipes, frost, the emergency marker
and the whole instrument board. From the lift, where the base is seen whole, the player could
see the least. Only the cursor goes now.

---
## 0.409.1 - the base queue read back, by another pair of eyes

A parallel session read M390-M409 and the war queue against the design docs and sent three
letters. Fifteen of its findings were real; this version is all of them, plus the ones my own
new pinning suites turned up while fixing them. No new mechanics - every change here makes an
existing rule true that was only written down.

**The base layer.**

- The director rolled twice: `baseEventAt` decided an event, and `baseEventApply` rolled the
  same probability again, so a forecast could name a raid that never came. `force` now removes
  the probability roll and nothing else - the *place* checks (a raid needs danger, a storm needs
  weather) survive, because forcing them let storms onto gas worlds.
- A deep catch-up (over 72 shifts) only mined: nobody ate, nobody paid, nobody burned. It now
  runs `baseLifeBulk`, `palStep` and `baseRuinCheck` too, so a base you left for a fortnight can
  be found dead, in debt, or a ruin - the states it could always reach one shift at a time.
- **Numbers on a base are bought, and the stock receiver never buys them.** `baseSharp` keyed on
  `instrQuality("radio")>1.05`, but a per-instance spread (`.85+r()*.3`) and the hull's
  profession push the stock `kazenny` past any such threshold: everyone had digits from the first
  minute, and "most of them fly on adjectives" stayed a line in a header. It keys on the *works*
  now - a receiver better than the one the yard fits, and not worn out - or on a radist. The
  СВЯЗЬ report obeys the same lever instead of printing figures of its own.
- Fire on an emptied base spread for ever with nobody to fight it. It still walks, and it dies
  after three shifts alone (`FIRE_ALONE`): nothing left to burn.
- Ice was counted twice - once into the store, once as water. It goes to the store, and water
  comes through the melter.
- Turnover never accumulated: `baseCollect` moved goods and told nobody what they were worth, so
  the manager's cut and ПАЛАТА's share were always taken from zero. It now sums by `RES.price`
  into `_turn`/`_earned`, and those fields (with `spend` and `devSaid`) are in the `14-save`
  whitelist - without that a reload zeroed both the share and the day's building cap.
- **Deregistration was a dominant strategy**: 800 credits once and the joke was over for good,
  with the base working exactly as before. A plot outside the register is a plot the counter
  will not take goods from: output at `PAL_OFF` (.55), no foreign hulls on the pad, never a
  forward post. Silence costs tempo.
- A ПАЛАТА inspection arrived with a fine and no warning, though the comment claimed it was
  announced. Four shifts before, the journal writes a line the player can read over СВЯЗЬ.
- A seized plot came back for free: `21b0` knew squatters and pirates but not the registrar.
  Buying it back costs the debt plus the closing fee.
- The manager left on the first unpaid shift - come back from a week's run with an empty account
  and he is gone, learned about afterwards. Unpaid wages accrue like a hired hand's; he leaves
  after four shifts without money (`BMGR_DUE`).
- «Не спрашивая» is the point of a manager who builds, but with no ceiling a decent one bought
  four reactors in a day and the player's first thought was theft. 9000 credits a day
  (`DEV_CAP`), and the first time he does it he says so out loud.
- `theOneId` ran four thousand rolls with a name generator on every `resetWorld`, because its
  cache lived in `G`. He is a property of the galaxy, not of a world: the cache is on the module.
- **The base refuelled below any counter, for ever.** One ice gave two fuel; ice costs 7 on the
  counter and fuel 5-12, and ice can be hauled *to* the base. That is not "at cost", that is a
  pump. One to one - the blockade is what makes the base's counter matter (§43), not the price.
- Minor: a raw newcomer could steal on his first shift; `dialLeak` applied twice; a person could
  not be moved between posts inside one base; `avrRoll` was seeded off wall-clock seconds.

**The war layer.** A power's warship attacked the player instead of its enemy (`npcFoeFor` now
picks a target among other NPCs when `p.iff` is set); `fleetFire` shot at dummies, envoys, powers
and friendly hulls; `riteLoanSettle` paid out for silence rather than for the deed, and now
compares the issuer's holdings against `G.bondHold`; `natSwarmTick` read `st.maxSp`, which does
not exist, so the swarm's speed was `NaN`.

**Three regressions my own new suites caught while fixing the above** are worth naming, because
they are the same shape as the bugs they were fixing: forcing the director bypassed the place
checks; the ice test still asserted the old double count; and the empty-base fire branch stopped
the fire spreading at all instead of letting it burn out.

---
## 0.409.0 - M409: the expedition names your base, and the base queue closes

The expedition of `11x-expedition` states its own honest cruelty in its header: «Игрок не герой
экспедиции. Он — один из тысячи рук.» The base is the one thing that changes it.

An expedition into the far dark cannot be mounted from stations alone: it needs a **forward post**
on the way out — a pad, a mast, housing, closed life support, at least two people living there, and
standing beyond the ninth ring rather than in the comfortable middle. The world has candidates of
its own, all mediocre. If yours qualifies, the circular names **it**:

> «…опорный пункт экспедиции — участок «Тишина», БЗ-417, система 12:3. Всем бортам: приём и
> заправка там.»

And it is paid for in the only currency that arc accepts. The world's traffic reroutes through your
pad: a ship lands every few shifts, pays for reception and refuelling, **and eats from your stores**
— so the reward is not a prize you collect but a place that is suddenly busy, and busy in your
name. Run the food down and nobody lands, because there is nothing to feed them with. Your call
sign is said on a channel you did not pay for, for sixty days.

With this the base queue **M390–M409 is closed**: the shift and the journal, four stores, heat and
the planet's formulary, adjacency and halls, the director, the аврал, the charter, ruins, the
payoff, the hundred управляющих and the one, the ПАЛАТА — and, at the end of it, a place the whole
world flies through. Full tier green: 17 571 assertions over 756 suites.

---
## 0.408.0 - M408: ПАЛАТА — the register, the fee, and the notice that arrives anyway

The deadpan law is withdrawn on the author's instruction and the joke is played to the end. What
replaces it is a craft rule, because loud comedy fails faster than quiet comedy: **the absurdity is
always bureaucratic logic taken seriously to its conclusion, never a joke from outside the world.**
The ПАЛАТА is funny because it is *consistent*, and the player laughs at an institution that is
sincerely doing its best.

Six of §28's eight instruments now exist. **Участковый сбор** is charged per period **per registered
site** — while the base is parked, while it is buried, while it is a ruin, because it is a fee on
being in the register and not on producing anything. **Доля с оборота** takes one percent of
everything above a threshold, so success raises the bill by itself. **Сводка** is due every forty
shifts and is filed by a радист or a управляющий; nobody files it otherwise and the пеня compounds
quietly in a place the player is not looking. **Проверка** arrives mid-period; the inspector is
polite, competent, has a name, is promoted every nine hundred shifts, and finds something. There is
always something: «Форма 1-ПРИЛ, лист 3 из 2: перечень листов».

**Режим** is the real strategy and a direct lift of choosing your tax regime: **простой** (tiny fee,
one drill counts, no hired hands, and genuine peace), **патент** (expensive, known in advance, no
share of turnover — the regime of a solved base), **общий** (small fee plus the share and
everything else). It can be changed no oftener than every two hundred shifts, and the default is
общий, because of course it is.

And §30's harshest line, now true: **abandoning a base does not close it.** A ruin stays in the
register and keeps billing until it is deregistered for 800 credits — or until the debt reaches nine
thousand and the ПАЛАТА seizes the site, moves in, and encloses an inventory.

---
## 0.407.0 - M407: he builds and develops, and that is where the trap is

A hired keeper stops a base idling. The real one **develops** it — every few shifts, out of your
account, without asking: he repairs what is broken before he builds anything new, puts up what the
planet's formulary demands (a радиатор on a hot world **before** a second drill, a second reactor
on a cold one), orders ice and food before the stores run out rather than after, and refuses to
grow past what the place can hold.

And here is the trap the whole hunt exists for: **everybody builds.** The bad ones build too, with
the same money, on the same schedule. The difference is only in *what* goes up — the bad one works
down the same list from the wrong end, so the third склад stands where the радиатор had to be, and
it is built, and it is paid for. It does not read as an error. It reads as a base that is quietly
wrong for forty shifts.

The three flaws that needed building now exist: **строит не то** (the list, reversed), **боится
глубины** (the lower row simply does not exist for him — the best ore is never touched), and
**паникует** (perfect until the first fire, then half the store goes on a scratch). With M405's
three, all six of §34.1 are wired.

Found here: `baseLifeNeed` returned air and water and no **food**, so anything asking for
`need.food` compared against `undefined` and silently did nothing. The supply routine did exactly
that, and the suite caught it on the first run.

---
## 0.406.0 - M406: the hunt — he does not advertise, and he moves

The hundred stand at counters selling themselves. **The real one does not.** He is working
somewhere, and a player who only ever interviews at counters will meet the best of the fakes and
nobody else — which is the trap the whole layer is built around.

He is a **function of time**, not a record: where he is at any shift is computed from the seed and
the shift number. His route is a chain of jobs a few hundred shifts long each, always at a real
station, and he works whether you are looking or not. That is the whole difficulty of the hunt:
every piece of evidence describes where he **was**.

Two channels carry it, and both were already in the game:

- **Пеленг** on the receiver: a direction and **not one word about distance**, wrong by up to
  fifteen degrees, and the error is its own in every system and every shift — two bearings from the
  same spot refine nothing. Two bearings from two distant systems, taken within a few shifts of each
  other, cross where he is now. That is a real plan: fly wide, listen, fly wider, listen again, draw
  the cross, go.
- **Слух** in the ordinary rumour feed: a region of three to five systems and a **time** — «с месяц
  назад», «прошлой зимой». Half of them are about one of the dozen ordinary-but-famous смотрители
  the galaxy also holds, fifteen percent are simply wrong, and a true one points at a job he has
  already left.

And the accident stands, ungated: **if you walk into the station where he happens to be, he is
standing among the candidates** with the same kind of line as everybody else. Nothing marks him.
The only tell is the one M405 built: he asks about the place before he answers about himself.

---
## 0.405.0 - M405: a hundred управляющих, and one

The whole layer demands the player's attention, and there is exactly one way to buy it back: a
**person**, not an upgrade. About a hundred of them exist in a galaxy; all of them call themselves
управляющий, all have a call-sign and references, all are hireable. One is real.

They are not three buckets but a **curve** (§48): every candidate is a roll, and «плохой ·
сносный · настоящий» are places on it. `q = .12 + .78·r()^2.6` is the whole design in one
expression — the mass sits at the bottom, the tail is thin, and there is no visible ceiling.
Measured over four thousand rolls: 56 % below a third of the potential, 3 % above .85, a real middle
that makes hiring a decent man a permanent and viable strategy, and a flaw on about two thirds.

**The interview has one tell, and it is the only one in the game:** the real one asks about the
place before he answers about himself — what is the heat, is there ice, what does the charter say.
The fakes flatter and agree to everything. Some of the fakes have learned to imitate a question, so
it is a strong signal and never a proof — the suite pins exactly that: every perceptive candidate
asks, most fakes flatter, and a few fakes ask anyway.

A hired man is charged **per shift** in wages and takes his **share** of what the base earns, and
his flaw surfaces only after his own срок of shifts under load. Три of the six are wired here:
**тащит** (the store never matches the drill, by a few percent, forever), **пишет красиво** (the
report from a distance is excellent and the base is not — fly there and see for yourself), and
**молчит** (the journal simply stops). And a bad manager is deliberately **worse than none**: he
pulls his fraction of the base's potential, and most fractions are small.

Not paying him ends it his way: he leaves. Ending it yours costs six shifts of severance, and the
ПАЛАТА will want a form about it too.

---
## 0.404.0 - M404: the craft pass over the base, and Almanac issue V

Fourteen passes of mechanics went into the base and not one of them was drawn: shifts, stores,
heat, the formulary, adjacency, halls, the director, the аврал, the charter, ruins and the unique
output all lived in the prompt line and the desk row. A layer whose whole point is a cross-section
was being read instead of looked at.

**Four gauges in the room** — воздух, вода, харч, дух — as bars, in screen space at the left edge.
Their position took three attempts, and both failures were the same one: put in world space they
were sliced by the frame edge when the camera followed the captain into the shaft, and buried under
the prompt when moved below the grid. They are interface, not an object in the rock.

**The nine adjacency rules are drawn**: a short pipe between two cells that give each other
something, in the colour of what passes along it, and a dashed diagonal between two that harm each
other. The plan of a base stops being a list of modules and becomes a diagram.

**A hall is one room.** M396 merged three identical modules into a зал and the drawing kept putting
a bulkhead between them; the inner walls are gone now, exactly as §7 wrote it, and the outer wall
stays thick so the row still reads as a череда помещений.

**And the heat scale is two-sided in the frame**: a blue cast and frost along every upper edge below
the calm band, a warm haze rising from the floor above it. You know which it is before reading a
word.

Almanac issue V holds all of it against the craft codex, and the frame ledger for «база» is
unchanged and still green — which is the honest reading of what was added: accents and interface,
not new mass.

---
## 0.403.0 - M403: what a solved base pays, and the blockade it carries you through

The rule the whole layer is charging for: **a good base does not print credits — it makes what
cannot be bought.** This economy has already been burned once by the other shape (the солнечная
ферма of M240, where money made money with no attention and no ceiling), so the payoff is built to
that rule and checked against it by the suite.

A **solved** base makes something nobody stocks: техкомпоненты from a volcanic base drilled deep
with a smelter, гидразин from a toxic world's laboratory, криоген where the cold is already
outside, карбид where a heavy world lets the drill reach. One unit every four shifts each — a
handful in a day, a batch in a week. Not income: **supply**.

Here the design contradicted itself and the suite caught it. §23.1 names иридий and ксенобиом, and
both have a **price** in `RES` — any counter buys them. A base making those would print credits,
which is precisely what §23's first line forbids. So the list is built from what genuinely has
`price:0`, and every row is asserted to have it.

**Блокада (§43).** When the war layer closes a system there is no fuel, no repairs, and the nearest
open station is four jumps the wrong way. A base is then the only supply the player controls: at
the ледоплавка or электролизёр you fill the tanks with your own ice (ЦЕЛЬ, two fuel per unit), and
at the мастерская you repair the hull with your own alloy. Both cost the base's stores — the point
is not that it is free, but that it is **yours**. A player with a working base flies through a war;
a player without one is grounded and watches, which in this game is the worse fate.

---
## 0.402.0 - M402: a base can be lost, and can always be got back

Losing a base has to hurt. Losing it **forever** must be impossible — that is §39, and it is
stronger than any drama: nothing is ever deleted from the account, and there is no state from which
a base cannot be restarted.

A base that has genuinely been abandoned — no people, no stores, a full day in that condition —
becomes a **развалина**: what you built stands there broken, and the journal says so. That takes
neglect, not absence: a base you simply flew away from parks itself and waits (§13), and a base
with a single person on it never gets there at all.

After a few shifts somebody moves in — **поселенцы** or a **пиратская застава**, the odds set by
how dangerous the sector is. The outpost is the war layer's target built out of your own walls.

And you can always come back. An empty ruin costs nothing. Settlers move out for 2 200. The outpost
leaves for 6 500 — **or for nothing at all** if you fly in and clear every pirate in the system,
which is not a new scene but the war that is already in the game. Then the compartments are
repaired from zero at a quarter of the build cost, one at a time, and none of them was ever lost.

What a loss actually costs is time, money, the people who left, and the story of having lost it.
That is enough.
## 0.401.3 - M411: the war on the site

The author (2026-09-07): «надо на сайте сделать карту, чё там у них происходит, прям онлайн,
чтобы видеть, чё с галактикой, кто куда когда, какие планеты завоёваны».

`drift-game.ru/war.html`. There is no second chronicle behind it: `build.ps1` glues the game's
own chronicle modules into `site/war.js`, and the page calls the same `chronStep` the clients
call, with the ledgers and circulars from `war.php`, so it shows what every game shows — byte
for byte. The map: the circle of ~317 systems filled by owner (Коммуна hatched, since the game
gives it and Компания the same blue), borders, war borders in fire, stars in the owner's colour
placed as the game's map places them, the six homes as their emblems, fronts breathing, the
previous flag's corner on a system taken within two days, «Ялта» marked as nobody's, the
players' hand as ticks on systems with a ledger, rallies, «Ревизия». Hover a system: its name,
owner and since when, what happened there. The panel: six powers with holdings against home,
needs, strength, tension and relations; wars with takes on each side; notes with deadlines;
arcs and rites; the last two days' incidents. The line «кто куда когда» tells the truth — or
any of the six waves' versions of it. A slider walks the last 720 сводки; the whole history
replays in milliseconds. Offline it works from the seed alone and says so.

---
## 0.401.2 - M412: the war runs by itself

The author (2026-09-07): «там появилась вселенная и война, которая сама идёт, надо чтобы сама шла
естественно». A Node replay of the chronicle (`docs/warsim.js`, the same `site/war.js` bundle the
site's map uses) showed it did not: the agents' needs pinned at zero after the first month, every
move was a quarrel or a war — 24 wars a month against §15's two to four — while the Director's
strength regen pulled every power to ~900 and the fronts flipped coins.

**The economy breathes.** Needs decline by what a power wants and grow by what it holds, balanced
at home size, with a seeded jitter so equilibrium is not a dead point; war costs strength, goods
and hulls every сводка; the Director's incidents move needs (a vein or a find brings ore, an
embargo or a strike takes goods, a storm takes link) so scarcity arrives from outside and not only
from arithmetic. Moves are drawn by probability, not by the first condition that matches: a power
in need trades first, quarrels second, and declares war only with relations below −250, strength
above 450, holdings at least half its home, no war of its own and fewer than two in the galaxy.
Truce grows likelier with every сводка of war; a home's systems are defended a third of the time.
Strength regenerates toward the cap its holdings set, not toward 1000; a power's tension cools by
a share, not by three points. Relations revert at 5 % per сводка, as §15 says. A year replays in
0.3 s: about ten wars a month, thirty systems taken, eight net changes, needs around 450, calm
months and busy ones. Suite: `91zzzw-chron2` «в меру, а не нулём и не лавиной».

**The players' hand actually enters the replay.** `chronState` used to cache the open сводка as
the base of every later replay: it was stepped once with whatever ledger was on hand at that
second and never again, and clients diverged by when they first looked. Now only the closed state
(N−1) is cached and written to disk; the open сводка is stepped on top on every call, and a ledger
or a circular arriving for a сводка already stepped throws the base away (`chronInvalidate`).
`warPull` hashes the closed base instead of replaying from zero.

**Circulars apply once.** `circApply` applied the latest circular every сводка for ever — needs
crept +30 % a сводка to a thousand and a single `truce` ended every war until the end of time.
Needs and events now apply at the сводка the paper is stamped with; the `season` is standing, lives
in the chronicle state (clone, cache, hash) and is what the Director reads. **Бунт, находка and
откол** are now in the Director's table — three families read them and nobody ever announced them.
The pinned hashes in `91zzzw-chron` are re-recorded with the change, deliberately.

---
## 0.401.1 - M410: one thumb

The two-stick helm of M360 asked the right hand to hold the thrust while the left held the
nose, and on a phone that is two jobs for two thumbs that also want to tap. The author's verdict
(2026-09-07): «управление получилось не очень… джойстик внизу, левой рукой… куда джойстик
двигаешь, туда и летит, нос сам потом на цель наводится».

**One stick, left thumb.** It is born where the thumb lands on the left half; the right half is
for taps — lock, autopilot, chips, pads; two fingers on the right are a pinch again. When no
thumb is down a pale ring shows where the stick rests: where it last was, and before that the
empty lower-left corner.

**«Fly there», not «push there».** The stick's vector is the wanted velocity — direction and
fraction of cruise. The physics computes the thrust that closes the gap and decomposes it as it
always did: along the nose the main engine, sideways the thrusters. Speed reached — engines off,
nothing burns. Thumb resting in the dead zone — the ship stops: that is the ТОРМОЗ the system row
lost in M360. Release above half cruise coasts, below brakes, as before.

**The nose is never the thumb's job.** With a mark it stays on the mark; without one it turns to
where the ship flies. Combat on a phone is: tap the hull, fly — the guns fire themselves inside
their cones. Mouse and arrows are untouched: the assist is a property of the stick, not of the
device. Suites: `91zzzw-helm` M410, `91zzx-mobile` (the resting point lands on the canvas).

---
## 0.401.0 - M401: three laws that were missing, and the guard over all nine

Hard is not big numbers; big numbers are tedium. Six of §22's nine laws were already standing —
everything touches three gauges, the feedback is delayed by shifts, space is the dearest currency,
failure cascades, the planet is the difficulty, and the second base is a trap nobody warns you
about. Three were missing, and all three are about what the player does **not** have.

**Сведения покупаются.** Without a радист on the base and a working приёмник on the ship, the
gauges read «воздух — впритык · вода — хватает · харч — мало» and not one digit. With one of them
you get numbers; with both, the forecast names the event and its shift instead of muttering about
the barograph. Precision is a person and a thing, and most of the game will be flown on adjectives.

**Изнашивается всё.** One compartment a shift loses a little hp, chosen by the shift number and
never by the frame, and the further heat is from the calm band the faster it goes. A base in
perfect balance leaves perfect balance by itself; an engineer and a мастерская cover the drift, and
an abandoned base reaches the floor in about a week rather than in an evening. The first
measurement made it a fault rather than a law — 0.3 hp a shift on a hot base wiped compartments in
a dozen shifts — and it was retuned against exactly that.

**Люди — не множители.** A вахтовик carries traits derived from his own seed and stored nowhere:
боится тесноты, пьёт, не спит у реактора, нелюдим. Each has its own reason and its own condition —
the crowded base, the reactor next to housing, the full compartment — so the best crew list is no
longer the list with the highest skills.

And the guard over all nine: **hard, never obscure.** The desk now carries a «почему» line for every
base, always, in whatever vocabulary you have paid for: «нечего есть · воздуха на исходе · жарко ·
людям тут не по себе», or «всё в порядке: дух 84%». If a player cannot say what killed a base, the
pass is not finished.

---
## 0.400.0 - M400: the planet is the difficulty setting

«Дрейф» will never have a difficulty slider. It has a galaxy in which some rocks will kill you, and
from this version the rock says which kind it is. Eight dials — тепло, свет, давление, тяжесть,
ветер, дрожь, лёд, порода — derived from what a planet already has (type, star, seed, and the site
inside the planet) and stored nowhere.

Every dial does something: heat sets the base's baseline, light sets what a solar panel is worth,
pressure leaks air every shift whether or not anyone is breathing it, gravity makes building dearer
and drilling better, wind and tremor weight the director's storms and quakes, ice decides whether
water is free or flown in, and ore decides what the drill is worth. Two bases on the same planet are
not the same base: the site shifts the dials too.

The reading that matters is §21.2's: **the free thing on a world is never the thing that makes it
rich.** A comfortable planet is poor; a planet that pays is trying to kill you. That curve is drawn
by the table rather than tuned by hand, and the suite checks the character of each world against it.

**Разведка перед закладкой.** From orbit you get three words and not one number — «жарко · ветрено ·
порода богатая». A **зонд** costs 300 credits (ЦЕЛЬ on approach) and shows five of the eight dials
in numbers. Landing shows all eight, because you measured them yourself. So the first mistake every
player makes is founding a base on the strength of three words, and the probe is the cheapest
tuition in the game.

---
