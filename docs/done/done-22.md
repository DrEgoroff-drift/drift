<!-- docs/done/done-22.md — part 22 of 30 of the done work, in the order it was written; see README.md -->

## Tests — the architecture and the queue (M441–M446, 2026-09-10)

The author, 10.09.2026: «тесты должны проходить быстро, должны предсказывать, должны ловить
баги, которые есть, но их не заметили… должны заменять ручное тестирование». The reasoning, the
industry comparison and the skeleton are in **`docs/DESIGN-tests.md`**; this is the queue. Rule
of place from §3 there: a law becomes a detector, a player's path becomes a scenario, a formula
becomes a Node suite — nothing else becomes a suite, and the existing 809 are frozen (fix reds,
extract tools, do not extend). Order is strict: determinism first, everything after stands on it.

- ~~**M441 determinism in the game**~~ — 0.428.0: `rnd`/`rndFx`/`now`/`clockSet` in `01-core`, ~400
  calls migrated, the build law, `stateHash` + the same-hash suite over `lookScenes`, `resetWorld`
  pins seed and clock (`?hour=`), `bNoDir` gone. Open: ~~the fuzz seed into `rndSeed`~~ (`T.go`
  seeds it since M442); `TEST_T0` is
  12:00 *local* (green in UTC, LA, Auckland); a drawn run's full hash differs from an undrawn one
  (draw fills lazy caches in `G`) — only the `rnd()` position is compared, a detector for M443.
- ~~**M442 the test API and the harness rules**~~ — 0.430.0: `T.*` in `tests/90a-tools.js`
  (old helper names are one-line wrappers; `T.state()` = `stateHash()`, `T.go(scene, seed)` seeds
  `rnd()`, `T.advance/clockShift` move the game clock), `docs/stand.py` (stdlib CDP, one Chrome),
  `suite(name, {tier, win, stage}, fn)` instead of the three lists, zero-assertion rule, the net
  over `ok(true`/`typeof`-guards (from the end of the detectors `90c` to `99-run`), `?shuffle`/`?pick`,
  UI selections outside `G` restored after every suite. Open: `T.bot` is a stub until M444; the
  tools' self-test sits before the net; `G.opts` is still not reset by `resetWorld` (the detector
  driver keeps `DET_OPTS_BOOT`).
- ~~**M443 the five oracles as detectors**~~ — 0.429.0 + 0.431.0. Crash, stuck, law (NaN/type/unknown field, a `Proxy`
  over `G` counting reads of missing fields, instruments → fields table, control answer classes,
  picture laws: legible text × ruler, parallax by depth, sharpness, no flicker, no popping, one
  human height), imbalance over seeds, picture (golden frame per scene × three windows, perceptual
  threshold, `accept`). Run over `lookScenes` × five gestures first; every red here is a real bug
  and gets its own commit.
  **0.429.0: four of five done** — `tests/90b-detect.js` (measures), `90c-detect-laws.js` (laws),
  driver `91zzzzzzzz-detect` (15 scenes × 5 gestures + menu doors + armed ship, 93 steps, 8–12 s);
  ten bug commits (type off the ruler in six modes, four unreadable labels, НАСТРОЙКИ dead on a
  text pad size from the cloud). **0.431.0: five of five** — golden frames
  (`91zzzzzzzzz-golden`, block signatures in `docs/golden/<W>x<H>.json` for the three harness
  windows, `test.ps1 -Accept` re-shoots one) and the worlds oracle (`91zzzzzzzzz-worlds`, Node:
  every station in six rings — a neighbour in reach, no ×4.5 counter, fuel ≤ ×3 median, the
  distribution of the best one-hop deal); both staged to 2026-09-18 (§3.6), the lab's history
  sets the thresholds. The same-hash suite also runs under seeded hands now. **Open:** not caught
  yet — the .55 auto-brake, the money-printing counter, idle drones; partial — the helm switching
  itself, sharpness/perch at DPR 1; the contrast check reads low under a vignette drawn after
  text; A/W judged in the system view only; golden baselines are the laptop's GPU — the lab's
  SwiftShader will say whether the block mean is coarse enough (that is what the week is for).
- **M444 scenarios and coverage** — **part one, 0.432.0:** `T.bot` with fourteen goals through
  the player's controls (`90a-tools`), eight walks under all detectors with the screens kept open
  (`91zzzzzzzza-walks`, ~15 s, every harness window), the coverage map mode × step printed by the
  run; the first pass found three unreadable labels the scene runs never saw (МАСШТАБ over a
  planet disc, ШАХТА and ПЕЩЕРА on a day sky). **Part two, 0.433.0:** `test.ps1 -Changed` —
  `build.ps1` writes `docs/TESTMAP.json` (test file → `src/` modules whose symbols it names) and
  stamps `TEST_FILE` into `tests.html`; `?files=a|b` / `-Files` run the suites of those files.
  **Part three, 0.434.0:** `?rec=1` recordings by frame (`15c-rec`: key mask + step, heads with a
  copied snapshot, `rndState`, clock; autopilot targets as frame events; F8 «bug here» →
  `drift.rec`), `T.replay(rec,{seed,hour,each})`, suite `91zzzzzzzzb-replay` (Node). **0.435.0:**
  four more walks — a fight with pirates in a far system (`T.bot("fight")` aims and fires), the
  base's lift and compartments, the home's room and a thing to look at, the wanderer's shelf and
  a lot bought for matches — twelve paths, ~22 s. **0.437.0:** the recorder keeps screen clicks
  as frame events (button id and label) and the replay presses them on the screen open at that
  frame; the bot opens the trade section by its button, as a player does. **Left:** a cooperative
  walk; drags and the wheel are not recorded; the map printed per window by the build, not per run.
- ~~**M445 the mutant zoo**~~ — 0.433.0: eleven mutants in `tests/mutants.json` (`zoomStep`
  no-op, `mapFont` without the ruler, `mapSkyShift(d)=d`, W without thrust, a lying fuel readout,
  an icon button without `aria-label`, a manager field off `applySave`, a perk without a reader,
  `drawBelt` empty, a bare label on a day sky, `resetWorld` leaving a field); `test.ps1 -Mutants`
  (all, ~4.5 min) or `-Mutants -Only name`; ten of eleven died on the first run, the eleventh
  after the «кнопка без слова» law joined the detectors. The lab cannot build (no PowerShell on
  the host), so the zoo runs on the laptop before a release, not nightly. **Open:** «resolution
  never returns» has no mutant — the sharpness detector compares the canvas with the DPR the game
  chose, not with the DPR it should have chosen; a mutant `DPR=.5` would survive (needs a rule
  for when `resAuto` may lower it under virtual time — decided 11.09, see Decisions). Seeds ×100 on scenarios stay in M446.
- **M446 the lab's own oracles** — **0.436.0: trips over worlds** (`91zzzzzzzzc-trips`, Node, 2 s,
  staged to 2026-09-18): the bot's round trip planet → ore → station in twelve station systems,
  the distribution of frames, fuel and ore (today: median 2 152 frames, 26 fuel of 100, 12 ore;
  every trip closes), red on a world stuck, ×3 slower than the median, over 80 % of the tank or
  under a quarter of the median ore; `?worlds=N` for the lab. Left: previous-version diff, `look()`
  telemetry from players into `log.php` and the lab page; and the lab's loose ends below.

### The lab, first night (20260909-235848, 0.427.0) — its three reds fixed by 0.427.2, the OOM class and the fuzz timeout done; body in `docs/PLAN-archive.md` (2026-09-11)

### The lab, second night (0.440.0, 2026-09-11) — read, its fixes in `lab.py`; body in `docs/PLAN-archive.md` (2026-09-12)

### Local lab + Node soak, night of 2026-09-12/13 (0.447.0) — report only, nothing fixed: `docs/night-2026-09-13/README.md`

## Refactor audit (0.438.0, 2026-09-11) — what the night's commits left, and the queue after them

Four hostile reviews of 0.428.0–0.437.0 plus a survey of `src/` (322 modules, 88 k lines, 4 695
symbols, none declared twice). Verdict on the night: M441–M446 stand; the defects were in the
tooling around them, not in the game. **Done in 0.438.0:** `-Mutants` restores the file's text
instead of `git checkout --` (that erased uncommitted work); `-Changed` runs the full corpus when
`tests/90*` changed and the fast tier when nothing matches (was `exit 0`); a 900 s ceiling per
shard with a kill of its own Chromes (the 33-minute GPU hang of 10.09); `G.opts` back to boot in
`resetWorld` (`OPTS_BOOT`, the `DET_OPTS_BOOT` workaround gone); the clock law also refuses
`Math["random"]`, `Date["now"]`, `new Date` without parens; `typeof`-ghosts fail the build instead
of warning; the map jumps in `updateMap`, not inside `drawMap` (the world changed in drawing — no
frame, no jump); `optsNumify` on the cloud boundary; the save net and fixpoint suite; `T.bot("undock")`
can go red; `T.replay` refuses a recording from another `VER`; the trips oracle has absolute anchors
(2 152 frames, 26 fuel, 12 ore ×1.5) beside its own-median thresholds; `detRuler` runs last;
`INDEX.md` names where a symbol ends (`file:start-end` — `Read` by exact offset).

**Queue, in order (each a commit; the safety net is the golden frames and `stateHash`):**
- ~~**Tiers by evidence, not by name**~~ — 0.439.0: 132 «browser» suites whose body names no
  browser API moved to Node (137 tried, five went red under the stubs and stayed in Chrome —
  the lander's scale, the maker's breed, the postcard's eight places, the beggar's taps, the
  engine hum); five Node suites that read `getBoundingClientRect`/`ctx.`/`drawWorld`/`style`
  moved to Chrome. Node tier 481 → 616 suites, 22 → 25 s; Chrome tier 295 → 168 suites. Left:
  the per-edit tier is 25 s, not the ~5 s of 0.359.3 — `-Times` for Node is owed; a suite that
  is green under stubs is not proven honest, only not proven vacuous.
- ~~**Golden frames keyed by the requested window, not the measured `W×H`**~~ — 0.440.0:
  `test.ps1` puts `?win=W,H` in the address, the suite keys `docs/golden/<W>x<H>.json` by it
  (files renamed 1248x641 → 1280x800, 548x685 → 390x844, 1408x1281 → 1440x1440), and a window
  without a golden is red, not a note. Still true: `deploy.yml` runs the fast tier only, so no
  browser suite runs in CI; the lab's SwiftShader will say whether the block mean is coarse enough.
- **The silence table** — 15 mode × gesture pairs left. 0.441.0: `base · W` gone (the base scene
  puts the cage on the second level; the promise suite that blocked the first try hashed only the
  first 4 000 chars of the mode's JSON and never saw the menu open — fixed to `stateHash`). Still
  silenced: `wanderer · A` — two steps from the ladder the same-hash suite goes red under seeded
  hands: **something on the corridor's buy path (`wanderBuy`/`wanStep`, 24c) reads real chance
  or real time** — find it, then move the scene. `detStuck`'s key law fires only on a frame diff
  of exactly 0 — soften it together with that table, not alone (tried; map W/A went red).
  Found on the way: the map was silent on ДЕЙСТВИЕ with your own sector selected — now it speaks.
- **`stateHash` mixes `now()` in** (`08a-statehash`) — decided 11.09: the clock leaves the hash
  and becomes its own field (see Decisions); to build. Done in 0.440.0: `Set`/`Map` with
  primitive members hash sorted. Still open: `planetStripTick` cuts by `wallMs()` and writes
  `stripLvl` into hashed state — machine-dependent under load.
- **A shard hangs now and then** — 10.09 a GPU process spun 33 min; 11.09 shard 1/6 of a
  `-Full` sat 900 s and was killed by the new ceiling, the rerun was green in 139 s. Not
  reproducible on demand yet; the ceiling turns it from a lost night into a lost fifteen
  minutes. Next: `--enable-logging=stderr` on the laptop runs too, so the hung shard leaves
  the name of the suite it was in (the lab already does this with `tests-trace.html`).
- **The source net over suites is line-based** — `ok(\n true`, `ok(1,…)`, `"function"===typeof f`
  pass; the harness self-suites vanish under `?files=` (`_file`). And the clock law does not
  cover `tests/` (41 raw calls in 13 files, mostly `performance.now` for cost — legitimate, but
  unreviewed).
- ~~**Opts from the cloud, the rest of the class**~~ — done: `91zzzzzzzzz-savenet` «сейв: числа
  опций из облака возвращаются числами» holds the whole class, not only `padSize`.
- ~~**Seven «?» fields in `SAVE_EPHEMERAL`**~~ — 0.442.0: `kills`, `orderStamp`, `baseVisit`,
  `radioF` persist; `hailLog`, `quietGone`, `logNewBy` stay per session, reasons beside them.
- **Long functions, on touch only** — 27 over 200 lines (`drawDigWorld` 569, `homeRoomBody` 550,
  `drawRoad` 539, `drawPostcard` 457, `updateSurface` 452): split along layers, verify by golden
  hash, never as a project of its own.
- ~~**Dead symbols (22)**~~ — 0.439.0: deleted with their comment blocks (`BASE_STANDBY`,
  `chessCanMove`, `crewHostages`, `deltaHtml`, `drawHoldMods`, `ethReset`, `mailDrop`, `namesBlock`,
  `recOn`, `rungDef`…) after a grep of `src/`, `tests/`, `site/`, tools and docs each.
- **Release hygiene** — decided 11.09 (see Decisions): work that touches only tests, tools or
  docs bumps the patch; a minor bump means `src/` changed and `-Mutants` ran green first.
- **Tools zoo** — `shot.ps1`, `shot.py`, `pageshot.ps1`, `stand.ps1`, `stand.py`, `mkstand*.ps1`,
  `mkview.ps1`, `mkshots.ps1`, `mksiteshots.ps1`: one way to take a frame, the rest deleted.
- **PATCHNOTES.md is 847 KB** — decided 11.09: trim, not split. Versions before 0.400.0 move to
  `docs/PATCHNOTES-archive.md` (grep only, like `PLAN-archive`); one commit, no build change.
- **`play.html` goes out uncached** — checked 11.09: `.htaccess` gives `\.html$` `max-age=60,
  must-revalidate`, but a gzip-capable browser is rewritten to `play.html.gz`, whose block sets
  only the encoding, and no `ETag`/`Last-Modified` come through openresty — every visit pays
  1.97 MB. Decided: the same `Cache-Control` on the three `.gz` blocks plus `FileETag MTime
  Size`; `curl -I` after the deploy; `api.php` untouched.

**The full run is 4 minutes** — verdict 11.09: mostly unique nets; «картина» folded (0.443.0); the last real merge is the button family (~12 s: «руки», «обещание», «инструменты», the controls law → one table of buttons × expected answer). Body: docs/PLAN-archive.md, «Moved from PLAN.md on 2026-09-14».

**Rejected, with the reason:** a palette module for the 893 hex colours (would flatten the
deliberate range — measure hue histograms instead); a mode table for the 258 `G.mode===` (stable,
no bugs, all conflict); removing the 1 804 `typeof` guards (the ghost law covers the danger at
zero churn); a schema-driven `applySave` (the net plus the fixpoint suite give the value without
touching the v4/v5 branches); not committing `drift.html` (breaks «opens with a double click»).

## Loose ends (as of 2026-08-28, after the graphics run 0.237.0–0.244.0)

Bodies of the struck entries below moved to `docs/PLAN-archive.md` (2026-09-10, section «Loose ends») — grep there by milestone.
Everything left open, with the reason it is open. Nothing here is a bug report — bugs are fixed
the day they are found; this is work that was deliberately not done, or that needs the author.

### Needs a decision from the author

Nothing (2026-09-11). Every fork that stood here — drone attrition, the craft plan remainder
(P4 grisaille, P7b the glyph notebook, С5 fatigue), the save fields, the clock in the hash, the
release and notes hygiene — was decided on the author's behalf; see «Decisions taken on the
author's behalf» at the end. Old bodies, with P4's spec and its measuring trap: `docs/PLAN-archive.md`,
«Moved from PLAN.md on 2026-09-11 (review)»; P4's spec also stays in `docs/DESIGN-craft.md`.

### Systems

- **Stalls on a player's machine (new, found 11.09 in `crash.log`).** 09.09, 0.425.0, window
  1536×791 at DPR 2.5 (ip hash `6ce8b33c` — the same hash sent the phone journals of 07–08.09):
  five frames stood 2.0–3.4 s in the first 30 s of the system view; the fps beat says 38 in the
  system (0.422.0) and 43–54 on the map. M418's slicing (worst slice 6.2 ms) was measured at
  DPR 2; at 2.5 the canvas is 3840×1978 and something is not sliced, or `resAuto` does not step
  down. Reproduce on a cold start in the system with `docs/g11.ps1` and
  `--force-device-scale-factor=2.5`. First in the order: the galaxy adds a bake of its own.
   **Checked 12.09:** `DPR=min(RES_AUTO=2, devicePixelRatio)` (`resize`, 08-state), so at 2.5 the
   canvas is 3072×1582, not 3840×1978, and every bake caps `devicePixelRatio` at 2 except the
   station home canvas (`26a`, not the system view). The canvas-size theory is wrong; the five
   2–3 s frames in the first 30 s are a bake — reproduce at 1536×791 before touching M418.
   **Measured 12.09 (g11 on this laptop):** 1280×800@2 → system 47 · landing 48 · surface 33 fps;
   1536×791@2.5 (canvas capped at ×2, 3072×1582) → 38 · 32 · 24. The frame is raster-bound and the
   extra 19 % of pixels cost ~20 % — nothing 2.5-specific. Open: why `resAuto` did not step that
   player down to ×1.5 after 3 s over 24 ms (a fixed `gfx.res` in his options, or the 24 ms
   threshold against a ~26 ms EMA). The stall report now names who held the frame (`stallWho`,
   0.448.0) — wait for the next one before touching M418.
- **`journal` entries in `crash.log`** — 27 in two days, all «Дрон Д-… встал · чинится сам» plus
  one «Летопись разошлась…» from a 400×400 headless: check whether a journal line is meant to
  reach the error log at all (the M417 kind of noise).
- The freeze item itself (M234/M238/M417/M418) stays closed until the log shows a stall that is
  not the bake; body in the archive.

### Housekeeping

- **PLAN.md stays under 60 KB** (`build.ps1` warns). A closed milestone leaves one line here and
  its body goes to `docs/PLAN-archive.md` in the same commit (done 2026-08-28, 09-02, 09-04,
  09-10, 09-11).
- **Push only after a green run**, and keep the run and the push in separate commands (0.238.0
  went out while a suite flaked one run in three).
- **A dirty page still surfaces on its neighbour.** Running in parts turned three long-green
  suites red (0.426.0); nothing yet names the suite that leaves a `.scr` open, a body mode class
  or a key held. A per-suite check after `fn()` would name the culprit — not built.
- **«свет: звезда — самое светлое» went red once in the pane at 1280×800** (Нейэль I, .694 vs
  .536) while headless stayed green; the cumulus over the disc (0.427.1, `CLOUDS_OFF`) is the
  likely cause — one look in the pane, then strike.
- Tiers, switches and what the run costs: `CLAUDE.md` «How to verify» and `docs/VERIFY.md`; the
  2026-09-09 cost measurement (`drawWorld` is the bill, three levers) is in the archive.

## To the release

The newcomer's first four hours were walked (M207, M212, M215, 27.08) and fixed; bodies in the
archive. Left: **the 60 fps check in all modes, re-run at the actual release** (author,
2026-09-05: «60 — хрен с ним, потом»).

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

## Moved from PLAN.md on 2026-09-14 (second pass — closed sections to one line)

## Open by design (not defects; no pass planned)

Reviewed 2026-09-11. Closed and moved to the archive: the fleet (eleven interactions, the заявка
struck), the road companion (built, `27k-road`; its answers are on the record in `DESIGN-road.md`),
factions as shapes, the split debt, the star disc, G11, M112, M124, M135–M151. «Base like
Fallout Shelter» — it is one; closed. What stays open on purpose:

- **M125** — the rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation; cosmetic, and the rack is not persisted by rule.
- **M126** — the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table.
- **M127** — instruments as loot beyond a knocked socket wait for the spec's «lost» pass.
- **M131** — the barge passenger as a channel, settlement glyph overrides, per-region colouring.
- **M132** — edge generator, hand-built cores per region, surface masks — each region's own milestone.
- **The yacht railing below 3×, flat-on view** — the richness a rotation pass would give.
- **P9b settlement recursion (Eglash)** — by eye over many settlements; a pass, not a fork.
- **The holding's deeds with no counter yet** (pirate bases boarded, monuments, nodes) join the
  rung score when their hooks are written.

## The arc and the holding — built; bodies moved to `docs/PLAN-archive.md` (2026-09-11)

Act II → the expedition → Act IV → the yacht (M225–M231, 0.210.0–0.216.0; `91zzzf-offer` guards
that the truth is never spoken). The holding M289–M298 (2026-09-02), design in
`docs/DESIGN-holding.md`.

# ~~The war — M360–M388~~ — closed 0.388.0 (2026-09-06); body in `docs/PLAN-archive.md`

Twenty-nine passes, all closed: the fight (M360–M363), the world (M364–M375), everyone
(M376–M381) and the Director's seven families of mechanics (M382–M388). Design stays in
[`docs/DESIGN-war.md`](docs/DESIGN-war.md) — §18 is the struck queue with what each pass measured
and what it deferred, and «Deferred» there is the only remaining war work; there is no separate
queue any more. Measured from M360 on: `prof()` with eight armed ships on the phone layout; the
pad row on the 44 px sweep (`91zzy-screens`); `91zzzw-chron` replay hashes browser vs Node.
