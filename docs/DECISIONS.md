# Drift — rules and decisions that stand

What holds across all the work, so it is not re-litigated: the working rules, the laws of the frame, and the
forks the author decided or let us decide. Not a plan (that is `PLAN.md` — only what we want next) and not
a record (what is done: `PATCHNOTES.md` by version, `docs/done/` for the old plan bodies). Moved here from
`PLAN.md` verbatim on 2026-09-23.

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


## The frame on the phone — laws and instruments

- **Law of the frame for any cut or bake (Designer):** protect the thin trail line, the one-pixel
  stars and the depth of the void (the nebula's glow). The ribbon only with a frame in hand — cut the
  thread's thickness, never its length.
- **Designer's instruments** (her scratchpad `…\9711c220-…\scratchpad`): `skips.py <video>` — share
  of double movement steps, per-second profile, a frame at each skip, counted from OUTSIDE the game;
  `layers.js` — the frame's calls and painted area by caller; `dpr/author_sheet2.png` — the sheet for
  the author from real frames (`author_sheet.png` is the withdrawn simulation, never show it).
- **Cadence protocol (Tester):** real S23 over Wi-Fi adb, one tab, the stick confirmed alive; record
  the conditions — zoom, open screens, hold contents, fleet ships in frame, prompt text, thrust,
  thermal, minutes since open; first line of the report is frames-with-stick; three 30 s runs, the
  first thrown away (the phone's first minute lies); judge by the share of late frames and the
  interval histogram, never by the average fps. A run without a living stick is rejected.
- **ОПИСЬ drag, the path not taken:** the lifted item falls off the finger at the browser's
  touch-scroll threshold (~16–24 px). `preventDefault` on pointermove made it worse (f04f78a,
  reverted e2804dc); a manual `scrollTop` loses to the browser's inertia. The way when it is taken up:
  a narrow grab handle with `touch-action:none` from the start.

## Privacy

- **Privacy, standing:** the author's save sits outside git (`C:\Claude\drift-private`) — never
  commit it; the two bot signs in `~/drift-data/trace/p/0_0.json` the author removes by hand.

## Design and naming

**Designer pass owed on everything built from here (the author 18.09: «пометь все ветки, что нужен
проход дизайнера по всему, а то сейчас всё криво»).** Control builds each stage item as a working
first draft — mechanics, timing, placement — and it is NOT the picture. Every item below marked
**[design owed]** gets a Designer pass before its release: the craft codex (`DESIGN-craft.md`), the
art direction memory, a frame on the phone, self-critique in passes. Nothing marked so counts as
done for the author. The marker is removed only by the Designer's pass, never by Control.

**Task names (18.09, the author: «почему по-русски — переименуй вехи по-английски, одинаково во всей
игре»).** The stage items had Cyrillic family codes; they are now M-numbers like every other
milestone, one contiguous block per family, so an old reference maps by arithmetic:
borders Б1–Б7 = **M452–M458**, life Ж1–Ж6 = **M459–M464**, resources Р1–Р5 = **M465–M469**, metro
М1–М6 = **M470–M475**, shipyard К1–К9 = **M476–M484**, birchpunk Д1–Д14 = **M485–M498**, new
mechanics Н1–Н15 = **M499–M513**. Renamed in this file, `docs/PLAN-ru.md` and the seven stage
designs. Left as they are, on purpose: historical codes in code comments and the archive (the
marathon's П0–П8, the story forks С1–С3, the interface laws И1–И11) — they name archived sections,
not open work — and in-game strings (part suffixes «М1», «Р-12»). Versions stay `0.NNN.x`; the
patchnote of each version names the M-numbers it closes.

## Closing an item, and the two laws

**Standing checklist for closing any item of stages 2–7:** new `G` fields in `snapshot()` or
`SAVE_EPHEMERAL` with a reason (the savenet goes red otherwise) — the batch introduces `G.stamps`,
`G.draft`, `G.thrown`, the ride `{line,from,to,t}`, tokens/tickets, hull orders, scars, warranties and
subscriptions, parcels · goldens re-shot for the scenes touched (`-Accept`, `-Mobile`, 1440) · a new
visual system gets its almanac issue (neon, the blueprint, the ring) · the oracle lines green · the
stage-0 gate · one running gag and one kindness named in the patchnote (the humour law) · old save
loads.

**Two laws over every stage (14.09, after an outside read of the plan):** (1) **causality is real** — a
mechanic is accepted only if it changes a decision the player makes later (transit plates → the route
you choose; the stamp → the passport → the cheaper road); a gag with no consequence is cut, however
funny; (2) **the twenty-minute exam** at every checkpoint — the author plays twenty minutes and answers
one question, «захотелось самому сделать ещё рейс?»; «нет» leaves the stage open whatever the tests say.
The game today carries its world in text (the hundred stories, rumours, the cantina, the books); the
material consequences are the part that does not exist yet — that is what stages 2–3 are for.

## How to measure the frame on a laptop GPU (perf night 19→20.09)

- Tool: an own Chrome (`--user-data-dir` in Temp, `--remote-debugging-port=9444`, window 1600×1000, real GPU) on `python -m http.server 8778` in drift-work; scratchpad `gpu.py` traces 2–3 s and prints **GPU-process ms per drawn frame** (`CrGpuMain` busy ÷ frames) — busy % alone saturates at 100 and says nothing; `ab.py` alternates two builds, `alt.py` alternates a JS toggle. The Browser pane is useless for this (emulated size, DPR 1).
- At ×2 (3076×1762) the frame costs ~28 ms of the GPU process; **one full-screen pass ≈ 1.1 ms** (bandwidth). `prof()` raster numbers lie on a GPU canvas; muting single cheap layers can read *slower* (APU power sharing: less CPU load → lower clocks). Accept only what moves fps in a ≥3-round A/B.

## Cut for good, and the decisions of 14.09

**Cut for good, so they are not re-invented:** six musical modes (→ a motif each, M457); the tunnel
with walls and station halls; the trust rating; the lab restart until a CPU budget per session.

**Decisions of 14.09 (the author's, not re-litigated):** the hold and tanks are cells · the metro
is a real station in the system, not an abstract ring · rides are seconds to a minute · the net is
procedural and infinite · jumps stay for near · «пока только в план пиши».

## Housekeeping

- **Refactors rejected (0.438.0 audit):** a palette module, a `G.mode` table, removing `typeof` guards, a schema-driven `applySave`, an uncommitted `drift.html`.
- **Releases:** push only after a green run — `test.ps1` (no flags: the Node tier the deploy runs), `-Full`, `-Mobile`, `-Mutants`; run and push in separate commands; after the push, the GitHub run's status and the md5 of `play.html` against `drift.html`. Patch bump for tests/tools/docs, minor for `src/`.
- **The freeze item (M234/M238/M417/M418) stays closed** until a stall that is not a bake shows in `crash.log` (`stallWho`, 0.448.0).
- **The plan holds only what we want next** (the author, 23.09: «план это план, а не то что мы сделали»). A finished item is deleted from `PLAN.md` in the commit that finishes it; its story goes to the patchnote, a long body to `docs/done/` (files of at most 40 KB, `build.ps1` warns past that).

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
