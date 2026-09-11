# How to verify

The everyday commands live in `CLAUDE.md`. This file is the long form: what the
suites are, what the cross-cutting nets hold, and how to look at the picture.

**A fuzzer sits in the suite** (`tests/91zzzz-fuzz`, M238): fourteen scenes driven by seeded random
input, a second pass over a lived-in world, and a sweep that renders every desk/station tab and
clicks every button in them. The build runs a short version; `test.ps1 -Fuzz 4000` runs the long
one by hand when hunting a crash. **A long run alone only walks the same path further** — the hands
are seeded, so more frames means more of the same sequence; `-Seed N` gives a different path
altogether, and a hunt goes across several seeds (M339). Its scene list is also the cheapest way to ask whether the
whole game still starts after a cross-cutting change.

**Three tiers (0.359.3).** `test.ps1` with no flags is the per-edit run: the Node tier
(`test-node.js` — the page's scripts under DOM/canvas stubs, only the «формулы и данные»
suites, ~5 s) plus one Chrome smoke (the page boots, a frame runs, the guard is silent, ~2 s).
`-Browser` runs picture and interface suites in Chrome (~30 s); `-Full` runs everything
including the heavy nets (~4 min) — on request, before a release. Node lives outside the repo at
`C:\Claude\tools\node` (portable, no installer); `test.ps1` finds it there or on PATH. Under the
stubs any pixel or layout measure is zero, so a suite that belongs in the browser goes red in
Node, not green: declare it `{tier:"browser"}` and it moves.

**A suite declares its own tier (M442).** `suite(name, {tier, win, stage}, fn)` (the options may
also come last). `tier`: `"node"` (default — Node, `-Browser`, `-Full`), `"browser"` (Chrome only),
`"heavy"` (`-Full` and the lab only), `"probe"` (`-Probe` only; name starts «проба · »). `win`:
`"phone"` / `"wide"` / `"ref"` (the 1280×800 look baseline) — out of its window the suite does not
run and is counted, instead of skipping itself with a green line. `stage:"reason, until date"` is
quarantine: the suite runs and prints, its failures go to a separate block and `test.ps1` prints
them on their own line without touching the exit code. The three old lists (`SLOW_SUITES`,
`NODE_BROWSER`, the `NODE_SKIP` regex) are gone; «ярусы: …» at the end of a run checks the options
against the dictionary. Three harness rules: **a suite with zero assertions is red**; **`ok(true`
and `typeof`-guards are banned in suites** (a names-net over the test sources, fast tier — the
only allowed form is the assertion `ok(typeof f==="function",…)`); a stand prints with `note()`,
which is not an assertion. **`?shuffle=seed`** (`test.ps1 -Shuffle N`, `test-node.js
--shuffle=N`) runs the suites in a reproducible shuffled order; a suite red only there is green
only after a neighbour — an isolation leak. `?pick=3,17` runs only those positions of the order
(printed as `[#17]` in a shuffled report), which is how a leak is bisected to its culprit.

**Tools, not helpers (M442).** `tests/90a-tools.js` is the test API: `T.go(scene, seed)`,
`T.press`, `T.tap`, `T.drag`, `T.wheel`, `T.wait`, `T.advance`, `T.window`, `T.give`, `T.board`,
`T.bot` (stub until M444); observers `T.frame`, `T.state`, `T.look`, `T.ledger`, `T.text`,
`T.controls`, `T.clock`. The old helpers (`fuzzRich`, `prSpoke`, `e2eHands`, `clkShift`, …) are
thin wrappers over it. Real windows and screenshots of the whole page: `python docs/stand.py`
(one Chrome over CDP for all scenes and sizes, PNGs to TEMP).

**Trips over worlds (M446).** `tests/91zzzzzzzzc-trips.js` runs the bot's round trip (planet →
ore → station) in twelve station systems and prints the distribution of frames, fuel and ore;
staged until 2026-09-18. `?worlds=N` widens it (the lab). A world where the trip does not close
is named with the step it stuck on.

**Recordings (M444, `?rec=1`).** Open the game with `?rec=1`, play, and when something goes wrong
press **F8** (or call `recMark()` in the console): the last minute of input — key masks and steps
by frame, in two thirty-second segments with a world snapshot at each head — lands in
`localStorage` as `drift.rec` and in the console. Paste it into a suite or the console of
`tests.html` and run `T.replay(rec)` — the same seed brings the world to the same point;
`T.replay(rec,{seed:5,hour:3,each:i=>…})` replays under perturbation with a hook per frame for the
detectors. Segments end only in flight, dock or map (the snapshot keeps nothing ephemeral). Screen
buttons are recorded as frame events (id and label) and pressed on replay; drags and the wheel
are not.

**Only what you touched (M444, `-Changed`).** `build.ps1` writes `docs/TESTMAP.json` — for every
test file, the `src/` modules whose top-level symbols it names — and stamps each test file into
`tests.html` as `TEST_FILE`, so `?files=91a-flight|91c-mgr` runs the suites of those files only
(`test-node.js --files=…` likewise). `test.ps1 -Changed` reads `git diff HEAD` plus untracked
files under `src/` and `tests/`, picks the test files that name a changed module (a changed test
file picks itself), and runs them in Node and in Chrome — heavy suites included — usually in a
few seconds. A module everything names (`08-state`, `01-core`, `28-loop`) fans out to most of the
corpus, which is right. With nothing changed it runs the fast tier as usual.

**The mutant zoo (M445).** `tests/mutants.json` holds one-line breakages, each a bug from the
project's history (a `zoomStep` that does nothing, map type without the ruler, the sky riding
with the sheet, W without thrust, a lying fuel readout, a button without a word, a manager field
off the save whitelist, a perk nobody reads, a mode drawing an empty frame, a bare label on a day
sky, `resetWorld` leaving a field). Each names the suites that must kill it (`kill`, a
`|`-list of name fragments — `?only=a|b` matches any). `test.ps1 -Mutants` applies them one by
one (in place, restored with `git checkout`), builds, runs the killers and prints one line per
mutant — killed by which failure, or ВЫЖИЛ. A survivor is a hole in the detectors, not in the
game; the fix goes into a detector or a suite, never into the mutant list. A new mutant is added
whenever a real bug reaches the author first: reproduce it in one line, name its killer, watch it
die.

**Walks and the bot (M444, 0.432.0).** `tests/91zzzzzzzza-walks.js` holds the player's paths as
five-line lists of steps; a step is a `T.bot(goal)` call or a few tool calls, and every step is
followed by all six detectors (`detStep` with `S.keep`, so the screens a step opened stay open).
`T.bot` goals: `star`, `station`, `planet [p]`, `dock`, `undock`, `sell`, `land`, `mine`, `ship`,
`launch`, `dig [rows]`, `up`, `jump {sx,sy}`, `save`; the answer is `{ok, frames, why}` — a failed
goal is a named stuck step, never an exception. To add a path: one entry in `WALKS`, steps as
`["имя", ()=>T.bot("…")]`; the run prints the coverage map (mode × step) as a note, so an empty
cell is visible in the report.

**Golden frames (M443, 0.431.0).** `tests/91zzzzzzzzz-golden.js` compares every `lookScenes`
scene with `docs/golden/<W>x<H>.json` — a block signature (one byte of mean luma per 8×8 block of
the quarter-size copy), not a PNG. Red when more than 3 % of the blocks moved beyond 18/255; the
report names the scene and the three worst blocks in canvas pixels. After a *deliberate* picture
change, re-shoot the window(s) you changed and commit the JSON:

```bash
powershell -ExecutionPolicy Bypass -File test.ps1 -Accept
```

The file is named by the window `test.ps1` *requested* (`?win=` in the address, 0.440.0):
`1280x800.json` is the default run, `390x844.json` the phone, `1440x1440.json` the tall one.
Until 0.440.0 it was named by the measured canvas frame (`1248x641` …), which every headless
build measures differently — on another machine no golden matched and the suite passed on a count.
`-Accept -Mobile` and `-Accept -Size 1440,1440` do the phone and the tall window; then
`build.ps1`, because the baselines are embedded into `tests.html` as `GOLDEN`. A window without a
baseline is red (0.440.0) and names the `-Accept` command that creates it. The suite is staged until
2026-09-18 (its failures print but do not decide), as is the worlds oracle
(`91zzzzzzzzz-worlds.js`, Node: every station in six rings — a neighbour within one jump, no
counter paying ×4.5, fuel within ×3 of the median, and the printed distribution of the best
one-hop deal).

**Autotests first, headless.** `build.ps1` also builds `tests.html` — the same game plus
`tests/*.js` at the end. Run it without the browser pane:

```bash
powershell -ExecutionPolicy Bypass -File test.ps1
```

It builds, runs `tests.html` in headless Chrome at 1280×800 and prints one head line plus the
failures block (exit 1 on failure) — ~30 tokens instead of a 5 500-line page. `-Only текст`
runs only suites whose name contains the text, `-NoBuild` skips the build. **Never read the
test page through the browser pane** — it is the single most expensive call in the project;
the pane is for pixels and manual looks. (In the pane the report is also in `window.TEST` —
`TEST.summary`, `TEST.failed` — and `tests.html?only=текст` works there too. Chrome's default
800×600 window makes the UI-overlap suite `91f-ui` fail for real, hence the fixed size.)
Tests drive the real `G` through `resetWorld()` and mock nothing.

Suites are split by topic: `tests/91a-flight` … `91n-barge` (harness in `90-harness`). New
mechanics go into the suite they belong to, not at the end of a file; if there is no fitting
topic, add `91x-name.js` (concatenation is alphabetical, but suites are independent — each
starts with `resetWorld()`).

If you do open it in the pane: it caches `file://` — after a rebuild open `tests.html?v=N` with
a fresh `N`, or you'll be reading the previous run. Headless has no such cache.

**Seven cross-cutting nets sit above the topic suites** (M329–M338, M358, M419). They do not test a mechanic;
they test properties of the whole game, and between them they found the raster leak behind the
freeze, a softlock in space, a money printer at the counter and a screen that could become a trap:

| net | file | what it holds |
|---|---|---|
| the world's life | `91zzzzz-e2e-life` | no NaN in the state; the save's full circle from every scene and no field lost; a save without any one field still loads and opens a screen; no «undefined»/«NaN» in the player's text; three thousand frames grow no list; everything clickable is clicked; **and the frame guard's counter is read at the end of the whole run** — an exception inside a click handler reaches no `try/catch`, only `window.onerror` |
| isolation | `90-harness` + the last suite of `91zzzzz` | `resetWorld` deletes every field the page did not boot with, and a suite compares the world after it against the snapshot taken before the first suite. A suite that is green alone and red in the run is the worst kind of lie |
| places, physics, light | `91zzzzy-place` / `-phys` / `-light` | everything stands on the ground, the man is never inside stone, the pad is clear; thrust/brake/fuel, Kepler, no falling through the ground — **each at frame steps 1, 2 and 3**, because the frame integrates at up to dt=3; night darker than day, halos fall off, nothing brighter than its own light source |
| game QA | `91zzzzy-play` | can the player get stuck, does the game print money, is any screen a dead end, what happens after death, does the autopilot arrive |
| someone else's clock | `91zzzzy-time` | the save travels between devices: every epoch stamp shifted three days forward and thirty back, and the world lives on |
| names and the picture | `91zzzzy-names` / `-look` / `-mem` | the game reads its own source and checks every name called by string against its table («a perk without code is a lie», applied to every table); the frame ledger pinned per scene as a baseline; the raster held by `SYS_CACHE` stays on a shelf instead of growing with the evening |
| the oven | `91zzzzy-bake` | M358: how much raster the game holds (in screens, not megabytes) and how often it re-bakes — a key with a continuously changing value bakes a full-screen canvas sixty times a second and nothing says so. M419: and what the oven does **in one go** — a cold ask queues and bakes nothing, one slice is capped by **work as well as time** (the harness has no clock, see the gotcha above), budgets are declared numbers, and the synchronous path (`planetMatNow`) is called from stands only, never from `src/`. Born of a 383 ms tile bake that stood three hundred versions because nothing crashed |

Two rules come out of them and are worth keeping. **A mode that is not in `lookScenes` is driven
by nobody** — that list is shared by the frame meter and the fuzzer, and until M337–M338 the raid,
the wintering and the sanatorium were in neither. **A staged scene must be reproducible**: planets
orbit inside `SYS_CACHE` all session, so a scene now rebuilds its system from the seed — without
that both the meter's numbers and the fuzzer's «one seed, same failure» drift with how long the
tab has been open.

**The phone layout is only measured if you ask for it.** The layout guards (`91zzx-mobile`;
`91f-ui` runs in every window) are declared `{win:"phone"}` and do not run when the window is not a phone, because in a desktop window the
phone rules are not applied at all:

```bash
powershell -ExecutionPolicy Bypass -File test.ps1 -Mobile
```

**To look at the interface, screenshot the page, not the canvas.** `docs/shot.ps1` captures what a
stand painted on the canvas, so it shows the world and *nothing* of the instruments, console, pads
or rail — they are DOM. `docs/pageshot.ps1` runs Chrome's own `--screenshot` and captures
everything:

```bash
powershell -ExecutionPolicy Bypass -File docs\pageshot.ps1 view -Q "?s=surface"
```

Scenes live in `docs/mkview.ps1` (`surface`, `system`, `cave`, `night`, `lowsuit`). Two traps that
cost a session: the browser pane's screenshot does **not** show the game's DOM overlay at all (it
shows the canvas only, whatever the z-index), and inside a stand the loop must be left running —
`G.running=false` paints the title-screen starfield over everything (`28-loop`, the `else` branch),
and `LOOP_OFF=true` freezes a half-baked frame because the world takes several frames to bake.

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```

Then by hand, because not everything can be expressed as an assertion:

- parsing — `new Function(document.scripts[0].textContent)` in the browser;
- `read_console_messages` for errors;
- pixels — synchronous `ctx.getImageData`;
- logic — assertions through `javascript_exec`;
- sound — `AnalyserNode` by RMS and spectrum. **Reading `AudioParam.value` does not reflect
  automation in flight** — measure the node's output only.

`javascript_exec` shares the global scope between calls — a repeated `const` with the same name
throws, so wrap in an IIFE.
