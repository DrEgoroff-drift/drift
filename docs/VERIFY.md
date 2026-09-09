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
`C:\Claude	ools
ode` (portable, no installer); `test.ps1` finds it there or on PATH. Under the
stubs any pixel or layout measure is zero, so a suite that belongs in the browser goes red in
Node, not green: name it in `NODE_BROWSER` (90-harness) and it moves. `SLOW_SUITES` there is the
heavy-net list `-Full` adds back.

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

**The phone layout is only measured if you ask for it.** The layout guards (`91f-ui`,
`91zzx-mobile`) skip themselves when the window is not a phone, because in a desktop window the
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
