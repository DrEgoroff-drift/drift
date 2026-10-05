# How to verify

The everyday commands live in `CLAUDE.md`. This file is the long form: the gate, the vision,
the suites and what their nets hold, and how to look at the picture.

**The gate (06.10.2026).** The author: «тесты всегда зелёные… все кнопки перехерачены текстом, ни
один тест не поймал». So the corpus was cut from 248 files to the stability core (29), golden
frames and the mutant zoo went with it, and the interface is judged by the vision instead.
`test.ps1` with no flags is the per-edit run and the release gate in one: build, the Node tier
(~2 s), one Chrome smoke (~2 s), the vision (~7 s) — about 15 s. `-Full` runs every suite in
Chrome, heavy nets included, then the vision (~30 s). Red anywhere is a red gate.

## The vision

`test-geom.js` (Node, its own headless Chrome over CDP) opens `tests.html` once per window and
runs `geoRun()` from `tests/90b2-geom.js`. Nothing is rasterised and nobody looks: the interface
is read as numbers and judged by inequalities.

**Windows.** Phones 320/360/390/421, landscape 568/780, tablets 721/761, PC 900/1024/1280/1920/
2560, three at the native zoom (`·родной`), and phone 390 at DPR 1 against DPR 3. Resolution,
font scale and DPR are multipliers the laws must survive. Each window walks ~110 screens (the
modes, every station tab, the tables, the map, the road, the menus) and taps ~75 controls.

**What is measured.** Every DOM box (`getBoundingClientRect`, computed style, paint order by
`elementsFromPoint`); every 2D-canvas call (a recorder on `CanvasRenderingContext2D.prototype`
keeps text runs with their font, anchor, clip and fill, and plates as shapes); every item the
engine draws — a counting WebGPU (injected by `test-geom.js`, no pixels) lets `ovInto`/`ovPass`
run for real and maps the layer's quads back to CSS px through the canvas a view belongs to;
the bakes (`gpuBakeRedo` on `GcCtx`) and their placement by `ovImage`; the road frame through
`drawRoad`. Frosted glass counts as opaque; windows are planes (a widget and the scene under it are
not an overlap, two texts on one plane are).

**The judged frame.** A frame in which the game changed its layout (the key `HUD_LKEY` in `27z`:
mode, body classes, the map row) drew against the DOM measured before the change — the rail, the
locus and the bands are re-measured at its end. The player sees the next frame, so the vision runs
one more and judges that one. A frame without a layout change is judged at once.

**Laws** (red):

| law | inequality |
|---|---|
| `вылет` | a text's box leaves its plate or control by more than 1 px + 5 % of its size (15 % up and down) |
| `срез` | a text is cut by its clip, an `overflow` box or the canvas edge (`срез…` — cut with an ellipsis) |
| `край` | a control or a text leaves the window |
| `наезд` | two controls, or two texts, on one plane intersect by 1.5 px or more over at least 10 % of the smaller; a rotated canvas line is its own quad (depth by separating axes, shared area by a convex clip), not its bounding box |
| `накрыта` / `поверх` / `сквозь` | a text is covered by an opaque box of another window / a text of one window is drawn over another's / a text shows through a window above it |
| `цель` | on touch windows: a target under 24 CSS px whose 24-px square touches another target or another small target's square (WCAG 2.5.8) |
| `невидим` | contrast of the text against what is really under it below 1.35:1 |
| `кегль` | text under 8 CSS px |
| `сжатие` | text squeezed by `maxWidth` below 80 % |
| `мусор` | a non-finite coordinate, or «undefined»/«NaN»/«[object» in a text |
| `сбой` | a draw function threw during the frame |
| `DPR` | a text moves more than max(1.5 px, 3 % of its longer side) or changes size by more than max(0.6 px, 5 %) between DPR 1 and 3 (DOM: three or more such texts on one screen; animating texts are skipped) |

**Composition** (notes, never red): `ровно` — two edges 1–4 px apart that clearly mean to align;
`шаг` — a row of siblings whose gaps differ by 1.5–8 px; `φ` — a modal window whose centre sits
below 0.55 of the height or more than 5 % off the middle.

**Self-test.** Before the walk `geoSelf` plants one defect per law in a fixture — a DOM plate,
a 2D canvas, a bake, a layer painted by `ovPaint`/`ovText` — plus clean twins that must stay
silent. A missed plant or a dirty twin prints «СЛЕПО» and the run is red: a vision that stopped
seeing (a renamed hook, a new draw path) cannot pass for green.

**The report.** One line per window (screens, taps, defects, the font-scale measure `a`, visible
controls and texts), then «БРАК» — defects grouped by law × who × with whom, each with the
windows where it shows and the windows where it is clean («цело»), so a defect of one width is
told from a defect of all widths. `--only="phone 390"` narrows, `--json=out.json` keeps the raw
findings, `--eval=@file.js` runs a probe in each window instead of the walk, `--real-gpu` uses the
real adapter (the counting one is the default and is what the self-test expects).

**A new law** goes into `geoLaws` (or `geoCompose` for a note), and its plant into `geoSelf` in
the same commit — a law without a plant is not proven to see anything.

## Tiers and suites

**Three tiers (0.359.3).** The Node tier (`test-node.js` — the page's scripts under DOM/canvas
stubs, the «формулы и данные» suites); `-Browser` runs the Chrome-only suites; `-Full` runs
everything including the heavy nets. Node lives outside the repo at `C:\Claude\tools\node`
(portable); `test.ps1` finds it there or on PATH. Under the stubs any pixel or layout measure is
zero, so a suite that belongs in the browser goes red in Node, not green: declare it
`{tier:"browser"}` and it moves.

**A suite declares its own tier (M442).** `suite(name, {tier, win, stage}, fn)` (the options may
also come last). `tier`: `"node"` (default — Node, `-Browser`, `-Full`), `"browser"` (Chrome only),
`"heavy"` (`-Full` only), `"probe"` (`-Probe` only; name starts «проба · »). `win`: `"phone"` /
`"wide"` / `"ref"` — out of its window the suite does not run and is counted. `stage:"reason,
until date"` is quarantine: the suite runs and prints, its failures do not touch the exit code.
Three harness rules: **a suite with zero assertions is red**; **`ok(true` and `typeof`-guards are
banned in suites** (a net over the test sources, between the end of the tools and the runner —
the vision is a tool and lives before that mark); a stand prints with `note()`. **`?shuffle=seed`**
(`test.ps1 -Shuffle N`, `test-node.js --shuffle=N`) runs the suites in a reproducible shuffled
order; a suite red only there is an isolation leak, and `?pick=3,17` bisects it.

**Tools (M442).** `tests/90a-tools.js` is the test API: `T.go(scene, seed)`, `T.press`, `T.tap`,
`T.drag`, `T.wheel`, `T.wait`, `T.advance`, `T.window`, `T.give`, `T.board`, `T.bot`, `T.replay`;
observers `T.frame`, `T.state`, `T.look`, `T.ledger`, `T.text`, `T.controls`, `T.clock`.

**The core.** Each file holds what can break the game, not how it looks:

| file | what it holds |
|---|---|
| `91a-frame` | an exception inside the frame is caught, named «СБОЙ · …» and the loop lives on |
| `91zzza-e2e`, `91zzzb-land` | the through-paths: undock, fly, dock, trade, land, launch |
| `91zzzzb-save`, `91zzzzza-save-hostile`, `91zzzzzzzzz-savenet` | the save's circle; a spoiled save loads; every `G.` field is saved or named ephemeral (`G_FIELDS` from `build.ps1`) |
| `91zzze-sync`, `91zzzzzr-cloud` | the cloud and two tabs; storage refusing is said at once |
| `91zzzzy2-money`, `91zzzzzf-market` | money is not printed; the counter's prices hold |
| `91zzzzy-time`, `91zzzzzb-clock` | someone else's clock: stamps shifted days forward and back, the world lives on |
| `91zzzzzbb-samehash`, `91zzzzzd-pure` | determinism: one seed, one world; ephemeral state stays out of the hash |
| `91zzzzzh-leak` | three thousand frames grow no list |
| `91zzzzzw-travel` | the road |
| `91zzzzz-e2e-life` | no NaN in the state; no «undefined»/«NaN» in the player's text; everything clickable is clicked; the frame guard's counter is read at the end of the whole run |
| `91zzzzy-play` | can the player get stuck, does the game print money, is any screen a dead end |
| `91zzzzzzzz-detect`, `91zzzzzzzza-walks` | the six detectors after every gesture; the player's paths by `T.bot` goals with the coverage map |
| `91zzzzzzy3-gate2d`, `91zzzzzzy4-pipes`, `91zzzzzzy5-gpu-loss` | the engine: no 2D calls where the gate says none; no pipeline compiled in flight; a lost GPU comes back |

`-Accept` rewrites the pipeline warm-up table (`src/08b1-gpu-pipe-keys.js`) from `91zzzzzzy4`.

**Only what you touched (M444, `-Changed`).** `build.ps1` writes `docs/TESTMAP.json` — for every
test file, the `src/` modules whose top-level symbols it names — and stamps each test file into
`tests.html` as `TEST_FILE`, so `?files=91a-frame|91zzzzb-save` runs those files only
(`test-node.js --files=…` likewise). `test.ps1 -Changed` reads `git diff HEAD` plus untracked
files under `src/` and `tests/` and runs the files that name a changed module; a change to the
harness (`tests/90*`) runs everything.

**Recordings (M444, `?rec=1`).** Open the game with `?rec=1`, play, and press **F8** (or call
`recMark()`) when something goes wrong: the last minute of input lands in `localStorage` as
`drift.rec` and in the console. `T.replay(rec)` in `tests.html` brings the same seed to the same
point; `T.replay(rec,{seed:5,hour:3,each:i=>…})` replays under perturbation.

**Autotests run headless.** `build.ps1` also builds `tests.html` — the same game plus `tests/*.js`
at the end, sorted by ordinal. `test.ps1` prints one head line plus the failures block (exit 1 on
failure). **Never read the test page through the browser pane** — it is the single most expensive
call in the project. If you do open it there: it caches `file://`, open `tests.html?v=N` with a
fresh `N` after a rebuild. Tests drive the real `G` through `resetWorld()` and mock nothing.

## Looking

**Whether it fits is the vision's question; how it looks is a screenshot's.** `docs/shot.ps1`
captures the canvas only — no instruments, console, pads or rail, they are DOM — and so does the
browser pane's own screenshot, whatever the z-index. `docs/pageshot.ps1` runs Chrome's own
`--screenshot` and captures everything:

```bash
powershell -ExecutionPolicy Bypass -File docs\pageshot.ps1 view -Q "?s=surface"
```

Scenes live in `docs/mkview.ps1`. Inside a stand the loop must be left running — `G.running=false`
paints the title-screen starfield over everything, and `LOOP_OFF=true` freezes a half-baked frame.

Then by hand, because not everything can be expressed as an assertion:

- parsing — `new Function(document.scripts[0].textContent)` in the browser;
- `read_console_messages` for errors;
- pixels — synchronous `ctx.getImageData`;
- logic — assertions through `javascript_exec`;
- sound — `AnalyserNode` by RMS and spectrum. **Reading `AudioParam.value` does not reflect
  automation in flight** — measure the node's output only.

`javascript_exec` shares the global scope between calls — a repeated `const` with the same name
throws, so wrap in an IIFE.
