<!-- docs/done/done-10.md — part 10 of 30 of the done work, in the order it was written; see README.md -->

## M122 (0.73.0) — built. The panel: five needles and a misclosure

Built as **`06b-region.js`** (the region: core, its one needle, the misclosure field) and
**`25a-instr.js`** (the five instruments and the panel), drawn from `drawCockpit`
(`25-cockpit`), stand `docs/mkinstr.ps1` → `docs/shots/instr.png`, suites **"Стрелки: невязка —
это склон, а не порог"** and **"…прибор показывает, а не сообщает"** (`91zj-instr.js`).

**Where it landed against the spec.** Five instruments, each with a working base read off the real
world (cargo and bodies for mass, danger and a station for the ether, star radius and distance for
light), and the deviation goes to exactly one of them — the region's own needle. Nothing is
persisted: the region is a function of the sector, like the system. No beep, no message, no colour
change anywhere in the file, and the suite spies on `say`/`tell`/`logAdd`/`sfx` while sweeping
eighty sectors to prove it.

**Two faults found by the suite, both real.** The first pass put a region's core anywhere in the
cell and gave every region the same slope width: at the border one region's slope was still at
half height while the neighbour's was at zero, so the misclosure **jumped** by 0.5 between
adjacent sectors — a threshold, which is exactly what the spec forbids. The slope width is now
set by how far the core sits from its own region's edge, and steepness is proportional to it, so
a narrow slope is also a shallow one; the exponent went to 1, because a curve steeper than linear
makes the last sector before the core a cliff. The second: cores were being placed in empty
sectors, a slope leading nowhere.

**Still open:** the panel is drawn only in the belt cockpit — the system view has no ceiling block
to hang it on, and M124 is where that is settled; instrument labels are barely legible on hulls
with a low brow, and on the boxiest ones the panel does not fit at all; the misclosure figure sits
on the tray's edge rather than in a window of its own.

## M123 (0.74.0) — built. The recorder: paper, five pens, and the memory of observation

Built as **`25b-tape.js`**, drawn from `drawCockpit` right after the panel, ticked from `frame`
(`28-loop`), pen click added to `SFX` (`09-audio`), stand `docs/mktape.ps1` →
`docs/shots/tape.png`, suite **"Самописец: перо считает время, а не объявляет тревогу"**
(`91zk-tape.js`).

**Where it landed against the spec.** A paper strip on the same ceiling block, left of the panel:
five traces, graduations, no labels, no interpretation, scrollable back with `[` `]` and `\`. The
tape writes in every mode; the pen is heard only in the cockpit. The ring holds about forty
minutes of flight and nothing is persisted.

**The fault the eye found, and the fix that is the design.** Written first as the absolute
reading — the same value that moves the needle — the tape printed five straight lines: on a log
scale the working numbers barely move, so a quiet county (M142) would have looked exactly like
everywhere else. The pen now carries its **own slowly adapting zero** and writes the departure
from it, which is how a real recorder's zero-and-range knobs work and what the stories actually
need: a flat line means nothing happened, a climbing curve means the world is moving under the
ship. `instrTrack` was lifted out of `instrPanel` so needle and pen cannot drift apart.

**Still open:** the tape is not yet an object — tearing a strip off, putting it in front of a
person, selling it, is M128's table and waits for it; five tracks on a 34-px strip are hairlines
on a low brow, and on hulls where the panel does not fit the recorder does not either; the tape
does not survive a save, so "forty hours ago" is really "this session".

## M124 (0.75.0) — first step built. The instruments where the decisions are made

Built as **`25c-instr-hud.js`** (the pod: five needles, the misclosure, a strip of tape), markup
in `index.html`, glass in `style.css`, ticked from `hud()` (`28-loop`), suite **"Колодка:
приборы под рукой в любом режиме"** (`91zk-tape.js`). `tapePaper` was lifted out of `tapeStrip`
so pod and cockpit print one recorder, not two.

**The fork, and how it was decided.** M124 as written removes the overlay HUD everywhere and
hangs every fact on a physical surface — which in this game means either drawing the system view
from inside a cockpit (a rewrite of `17-mode-system`, its input and every mobile pad) or stripping
the interface the UI rules and their suites are built on. Asked; the answer was **a compact pod in
the top row that carries what is needed, available in every mode, cockpit-specific dressing left
to differ by place**. That is what was built: the pod shows everywhere except the belt, where the
real ceiling block is, and disappears under 720 px.

**Still open from the spec:** the table (map as paper, cargo as bills of lading, rumours as a
weighted pile), the physical receiver tuned by hand, "pause is the engine off", and the removal
of the overlay HUD itself. None of it is blocked by what was built — the pod is where a surface
goes when there is no cockpit to hang it on.

## M125 (0.76.0) — built. The rack: eight needles, five pens, one sheet of paper

Built as **`25d-instr-rack.js`**, opened with `I` or by tapping the pod (`25c`), drawn from
`frame` after the mode (`28-loop`), stand `docs/mkrack.ps1` → `docs/shots/rack.png`, suite
**"Стойка: восемь стрелок и пять перьев на одной бумаге"** (`91zl-rack.js`).

**Why it exists.** The pod is a matchbox: no graduations, no figures, a tape reduced to a strip.
The rack is the same equipment opened up — 1950s–60s laboratory and aviation hardware, not a
sci-fi HUD: recessed sockets, screws, matte metal with grain, cream dials under glass with a
warm glow, amber needles on metal hubs. Eight instruments, each with its own range: the five
region needles plus fuel, hull and hold. The recorder is a real strip chart — supply roller,
take-up roll with wound paper, printed grid, per-band zero lines, pen carriages on a rail,
crawling feed perforation, time marks in the pen's own time.

**The two rules this repeals, deliberately and on request.** 25a's "one colour for the whole
panel" and M123's "no labels, no colour on the tape": the five channels now carry a muted colour
and a name. Colour here separates five pens on one sheet the way a real recorder does — it is
not an alarm and not a hint. What is *not* repealed: no sound, no message, no log line, no
alarm tint anywhere; the suite spies on `say`/`tell`/`logAdd`/`sfx` while the rack draws.

**Still open:** the rack is an overlay drawn over the world rather than a surface inside the
cockpit; the heavy sheet is baked per screen size, so a mid-flight resize costs one re-bake;
CH5 saturates against the bottom of its band when the actinometer swings hard; nothing here is
persisted, which is correct, but it also means the paper is only ever this session's.

## M126 (0.77.0) — built. A hull is a profession, not a rung

Built as **`03f-hull-role.js`** (six professions, the map from hull to profession, derivation for
unique and fused hulls), wired into the instruments (`25a`, `25b`), the rack's nameplate (`25d`),
the ether's memory (`12p-news`), a rescued barge's gratitude (`12l-barge`) and the frame
(`28-loop`), suite **"Профессии корпусов: не выше, а другое"** (`91zm-role.js`).

**What a profession actually changes.** Изыскатель resolves the misclosure earliest and writes
the boldest tape; рудовоз is nearly blind; почтовик's receiver keeps ~40 rumours where an ore
carrier keeps ~19; буксир is paid for taking a barge on a line; вахтовка is the one hull where
passengers speak in flight (a rare line, never a dialogue, never asking for an answer); сторож
keeps his hide. `hcls` from `03-ships` is untouched — the profession is a layer over it, derived
and never persisted.

**The line that must not be crossed, and the suite that guards it:** the misclosure of a sector is
identical on every hull. The instrument's *resolution* differs, not the world. The suite reads the
same sector from two hulls and asserts both that the truth is equal and that the needle is not.

**Still open:** the vanilla stat ladder in `SHIPS` (price/thr/cargo) is untouched, so the shop can
still be read as a ladder — the professions sit on top of it rather than replacing it; passenger
talk is one flat table, not a function of who is aboard (that belongs with the hundred, M129–M131);
and the postal runner so far only hears deeper, not farther — a rumour's range is unchanged.

## M127 (0.78.0) — built. Instruments are merchandise

Built as **`05b-instr-kit.js`** (six works, per-instance traits from a seed, wear, price, counter,
socket/shelf) with a `ПРИБОРЫ` tab in `26-ui-station`, offered at trade/yard/science stations
(`06-galaxy`), read by the panel (`25a`), the tape (`25b`) and the rack (`25d`), aged from
`frame` (`28-loop`), persisted in `14-save`, suite **"Приборы как товар: завод, возраст,
характер"** (`91zn-instr-kit.js`).

**The rule this milestone exists to honour.** A bad instrument is never a percentage. It resolves
the deviation worse — so with артельный курсограф a drift region only admits something near its
core, while «Веха» shows it from the periphery. Character is visible, not stated: the needle's
tremor and the pen's line width are read off the same instrument, so a rack full of «Сирин» looks
nervous and one full of «Горн» looks stubborn.

**What is derived and what is kept.** The counter is derived from station + a 45-minute clock, so
walking out and back does not reroll it and nothing is stored. The installed kit and the
four-place shelf are decisions, so they persist with a safe default: an old save simply has the
standard shipyard set.

**Still open:** instruments cannot be lost yet (the spec's "lost" — a pirate hit knocking a
socket out is not wired); the recorder itself is not a purchasable unit, only the five needles;
`26-ui-station` crossed 40 KB with this tab and is now shouting on every build; wear from the hull
(`12s-wear`) and instrument age run on separate clocks that never speak to each other.


---

# Moved from PLAN.md on 2026-08-25 — the thirteenth pass, milestone by milestone

These sections stood in the live plan long after they were built. They are kept verbatim:
each one records why a thing was done the way it was, which is what this archive is for.

# QUEUE: the thirteenth pass â the galaxy as a book of stories (M122âM151)

**Full text lives in [`docs/PLAN-archive.md`](docs/PLAN-archive.md)** â grep it for `M122`. It was
moved there on 2026-08-15 because thirty milestones of far-future work were being carried in a file
that is read every session; the pass itself stands, and it is the release (0.72.0 â **1.00.0**).

## M143–M151 (0.107.0, 0.108.0) — built. The thirteenth pass is closed

`11o-slow` (figure/reply/rounds, `slowDrift` on the chrono needle), `11p-pass` (hulk, lights,
tell), `11q-grown` (`grownExtra` houses, `grownOnGive` reciprocity from `settleGive`),
`11r-plan` (`planEndless`/`planTook` in 12ta, `planDeliver` from `enterBase`), `11s-returners`
(`tin` slot renamed, `retDrift` once, board block), `11t-rumours` (two per station per three
days, 15% wrong, receiver line), `11u-names` (`nameOf` in map/HUD, cantina input, `namesEtherLine`
after 15 jumps, rumours pick the name up), `docs/PASSPORTS.md` (M150 as a rules document),
`11v-places` (three fixed addresses, nearest star, first solid planet, no log). Persisted:
`G.slow`, `G.pass`, `G.grown`, `G.plan`, `G.ret`, `G.names`, `G.namesTold`. Suites `91zzb`–`91zzf`.

**Open by design:** the second rumour channel "somebody shows his tape" is the detail line, not a
real tape; the returners' arrivals board is a fixed table; M150's four wear layers on every prop
remain art direction, not a generator.

## M140-county, M141-charts, M142-quiet (0.106.0) — built

`11l-county`: `countyPoiK` (20a scale), `countyHouseK` + `countyDrawTown` (12t), `countyNoiseTick`
from `updateSurface` (levels 30/70/120/160), `countyAnswerLine` in the ether ≥20 jumps later.
`11m-charts`: `chartsHidden`/`chartsJitter` in the map star loop, `chartsDock`, buy/drop/return
(`chartsTick` from the ether tick), cantina block. `11n-quiet`: `quietNoPirates` (13),
`quietNoWear` (12s), `quietMute` in `logAdd` and `tapeSample`, `quietLeave` in `jump`,
`quietAfterLeave`, dock line and the open door block. Persisted `G.county`, `G.charts`, `G.quiet`.

**Open by design:** level prices on the quiet edge (no single price function to hook; the market
is per-station tables) — left.

## M139-keepers (0.105.0) — built. The line of keepers

`11k-keepers`: `keepersDock` from `openStation` (habit table by `visitHere`, ration taken every
third visit, gone at visit 10), `keepersBlock` in the cantina (roster, sign, feed), `keepersDark`
(gone && !signed, or signed && jumps−fed>12), effects `keepersCourseDrift` (25a), `keepersJumpK`
(18 map cost ×1.5), `keepersEtherLine`; rhyme at the `pass` core (`keepersRhymeHere`). Persisted
`G.keepers={gone,signed,fed,given}`. Suite `91zx-keepers`.

## M138-grove (0.104.0) — built. The grove

`11j-grove`: `groveSys` (core if it has a belt, else the region's first belt system), `groveDress`
from `enterBelt` (edge 3 / core 22 marked rocks, res xeno), `groveTick` before thrust in
`updateBelt` (close / flinch / part / close-for-good, min 150 or 90), collision exemption in the
rock loop, `groveOnKill` from `killRock` (power≥3 shot, else cut +6 xeno), `groveDraw` halos after
the rocks, `groveEtherLine`. Persisted `G.grove={turn,shot,cut}`. Suite `91zw-grove`.

## M137-glow (0.103.0) — built. The light that remembers

`11i-glow`: edge = region minus core. `glowDressFlora` (all plants glow), `glowDrawPad`,
`glowScan` (+1 xeno), `glowPatches`/`glowDrawPatches` (rut, machine, foundation; night only),
`glowGroundLine`. Core: `peepHere` forced, `P.pass` counts passes per eclipse (20c), `glowTier`
gives ×1.4+flash / ×.9 / ×.34 near-only runner; `glowCaveX` puts the cave mouth at the mat's edge
in the runner's direction. Suite `91zv-glow`.

## M136-hours (0.102.0) — built. The drift of hours

(The number M136 was reused by 0.100.0 "Under the skin" in the tails sweep; region milestones keep the
archive numbers with a suffix from here on: `M136-hours`, `M137-glow`, …)

`11h-hours`: the `hours` region (needle `chrono`). `hoursOffset()` in minutes — region 3–10, core
orbit 60, core surface up to 240 toward `settleSpotX`; `hoursDrift()` adds to the chrono needle in
`instrRead` (25a), the tape follows. `hoursEtherLine` (35% of edge ether), `hoursGroundLine`,
`hoursNobody` hides the watchmen, `hoursDrawPeople` (windows by night, the one man during an
eclipse), `hoursMachine` (7 cr → 1 organics). Edge = whole region minus core (rim placement).
Persisted: `G.hours={man}`. Suite `91zu-hours`.

**Open by design:** "automation feeds the stock" is shown only by smoke and the machine — the
settlement's own stock is not auto-fed (would touch 12t economics); the night shadows are a pass
of their own if the region ever gets a core interior.

## M135 (0.101.0) — built. Three lights

`11g-lights`: the `lights` region (needle `actino`). **Edge:** night capped at dusk (`lightsNight` in
`surfNight`), one companion sun (`lightsSuns` after the star disc in `drawSkyLayer`), shutters on
every settlement yard (`lightsShutters` from `settleDraw`). **Core:** no night, two companions.
**Calendar:** `lightsConj(t)` — period 24–35 days from the region seed, a one-day window with a
sine peak; anchored by `lightsArrive()` (ether tick and landing) at the first arrival so the last
conjunction was yesterday, then fixed for good. No countdown is shown anywhere; `lightsGroundLine`
speaks only of shutters and lights. **Reveal:** `lightsDrawReveal` draws road, foundations and
arch on the core planet only while `lightsOpen(p)`; `lightsEnter` runs `enterCave` with `ancient`
(seed 9, no fauna) and the find goes through `lightsCaveFind` (120 data, `relicRoll` .7).
Persisted: `G.lights={t0,seen}`. Suite `91zt-lights`.

**Open by design:** region talk ("colonies sleep by light" in cantina/counter lines) and a
settlement glyph for the shutters wait for the factions pass; the edge generator per world type is
still the table's reservation (M132 tail).

## M134 (0.94.0) â built. The mirror

`11f-mirror`: the transit region (`mirror`, needle `radio`). **Edge:** whatever the ether says
inside the slope comes back thirty-seven seconds later, word for word (`mirrorEchoArm` from
`etherTick`, `mirrorEchoTick` in the same tick); leave the system and the echo is gone; a
dispatcher waves it off one time in three. **Core:** a fifth find kind, `echo`, always present at
the core and never taken â a thin plate edge-on with one sliding glint. Listening lays two to four
old reflections over each other: domestic lines (`MIRROR_CORE` â a time signal, a roll-call, a
forgotten mug) mixed with the ordinary ether, none invented (M116). The first listen gives the
bearing: a map mark 120â160 sectors out, where nobody flies. `G.mirror` is one bit. Suite
`91zs-mirror`.

**Still open → swept, see the tails ledger:** the edge has only the echo â the "atrocious comms" could also degrade the
receiver's own reading (`instrRead` dev on `radio` is already there, but the ether itself does not
stutter); the bearing mark cannot be removed or acknowledged; the mirror's lines do not yet enter
the parrot's memory.

## M138 (0.100.2) â built. The tunnel

The cell grid moved into the mountain (`BASE_OX`/`BASE_OY` in `21a-mode-base`: two cells to the
right of the gate, one level above the plain) and a 40 px tunnel from the gate at plain level
runs to the floor of the top row; `BASE_GY` is the plain, `BASE_GATE_X` the gate. **Still open → swept, see the tails ledger:**
the gate reads as part of the tunnel, not as a door; the tunnel has no light of its own.

## M137 (0.100.1) â built. Into the mountain

Base cross-section: mountain profile as a ramp-and-plateau to the top of the frame, gate in
the left foot, mast on the summit (`21a-mode-base`). **Still open → swept, see the tails ledger:** the pad lights on the top
row are buried under the slope; the plateau to the right is a plain wall of rock without a
second plane.

## M136 (0.100.0) â built. Under the skin

Lander silhouette by `h.form` (`19-mode-landing`), the jetpack (`20d-jetpack`, surface and cave),
and the cave rebuilt as a 2D rock field with carved passages and 2D raster tiles
(`22-mode-cave`, `18c`). Stands: `docs/mklanders.ps1`, `docs/mkcave.ps1`. **Still open → swept, see the tails ledger:** the
lower gallery has no dressing of its own (water, crystals and veins hang on the upper one only);
beasts walk the upper gallery and never descend; the rock fringe of the contour stroke carries
no material; the base was asked to look like a Fallout-Shelter cross-section and already is one
â what exactly differs is a question for the author.

## M133 (0.93.0) â built. The postal round

`11e-post`: the first themed region. Six links â five who once carried the thing and the last
addressee â hand-written, each with one line about himself and a word about who comes next, never
about the parcel. Addresses are seeded and not stored: link 0 is the post region's plain trading
system, link 5 its core, links 1â4 are stations 4â14 sectors out, outside the region. The parcel
is an ordinary object (a bundle, a jar, a wrench with a blank tag). On docking at the next link
the man comes to you himself (`postDock`, once per landing, toast + journal); the cantina shows the
parcel next to the table with one button, **open**. Opened, the chain goes on; the last man says
one extra sentence and does not reproach. Nothing is paid; the core counts as `care` in the memory
of place. State is three numbers in `G.post`; suite `91zr-post`.

**Still open → swept, see the tails ledger:** the links are met only in passing â nothing points at them (rumours, M148, are the
natural pointer); the post region itself has no edge colouring yet beyond silent instruments; the
parcel is not yet a thing one can put on the table (M128) or show to the bird.

## M132 (0.92.0) â built. Regions: the table, and the memory of place

`06c-regions`: a closed table of fifteen themed regions (post, mirror, lights, hours, glow, grove,
keepers, county, charts, quiet, slow, pass, grown, plan, tin) laid over the M122 grid. Placement
is seeded and cached (`regionPlace`): ring by theme, first cell whose core is a station system,
which has a plain trading system on its edge, and which keeps one empty region between itself and
any other theme â cores end up 3â23 sectors out, never closer than two stock jumps. `regionAt`
now carries `theme`, the theme's name and its needle; **the postal round has no needle and
`amp=0`** â the one region where the instruments say nothing. Plain regions are untouched.

`11d-place`: memory of place, persisted in `v:4` as `G.place` + `G.odo`. Per place (same key as
stories: system, or system/planet): first and last odometer, landings, and three coarse counters â
`take` (mined units), `hurt` (player shots), `care` (repairs, closed quests). **Maturation is path,
not time**: `G.odo` counts landings and jumps; `placeAge(key)` is path since the last visit. Nothing
is shown; `placeMood` returns the counter that won, for the grove (M138) and the insects (M145).
Suite `91zq-regions` (placement, monotone misclosure, silence in the post round, core spacing, BFS
reachability from origin on a stock tank, memory counters, save round-trip).

**Still open → swept, see the tails ledger:** the edge generator (parameters over world types per theme) and the hand-built core
are left to each region's own milestone â the table only reserves the place; surface layer masks
(presence/revelation, never switching in sight) wait for the first region that needs one (M135);
`care` does not yet count the table (M128) or things left behind; `hurt` counts shots, not hits.

## M131 (0.91.0) â built. A hundred and two

`seenOf`/`unseenOf` conditions (a trace of another story seen), `carry` on a trace (the parrot
remembers it as `heard` kind `story` and lists it with the place's address), `12k-stories-c`
with 30 stories, 102 in all across the three data files (each under the 40 KB guard). Suite
checks every `seenOf` target exists and that the bird records a carried line once.

**The hundred is closed.** Left open, deliberately, in the design: the barge passenger as a
channel, settlement glyph overrides, per-region colouring once regions (M132+) exist.

## M130 (0.90.0) â built. The ground speaks too

Channels `land`, `cave`, `settle`, `tin`; addresses `planet`, `settle`, `tin`, `world:T`; planet
stories anchor to system/planet and landings on a planet are counted. `12k-stories-b`: 46
stories, 72 in all. Lint now also rejects unknown address kinds.

**Open for M131**: links as data (a trace may require a trace of *another* story seen), the parrot
as carrier (a line heard at A repeated at B), the barge passenger as a channel, +30 stories to
pass a hundred.

## M129 (0.89.0) â built. Traces, not tasks

Engine `11c-stories`, data `12k-stories-a` (26 stories, six of them long), suite `91zp-stories`.
Decisions taken with the author on 2026-08-22: **no journal page** â stories leave no trace in
the interface; **anchoring at first meeting** (deterministic lot per story Ã place, â¤4 floating
per place); **a third never explained**; **the six rivals get six stories** (four built: baker,
Krapiva, Kim, Shtof, Sovenya, Efim â five; the sixth waits for a face). Long stories are written
in the key of institute fiction â the report on the event that never happens, the null-cabin.
Channels: ether, counter queue, table, finds, rumours, cantina scene. Lint: closed `when`
dictionary, every turn flag read, 2â7 traces, â¤4 surfaces (counter + table count as one).

**Open for M130**: the surface, the settlement (glyph), the machine and the animals as channels
â the four "ground" stories of the design (who feeds the Tin, the shoal, the shell, who turns
off the light) wait for them; +40 stories. **M131**: links as data, the parrot as carrier, +40.

M128 and M128b (speech queue, the table, the tape as an object; the frame's address, the performance pass and the wide-screen pane) are in `docs/PLAN-archive.md` â grep `M128`.

What it is, in short. M106âM121 gave the arm one long story told in fragments; this pass gives it
**many short ones**, and a body to fly them in. The unit is a **region**, not a planet: six to ten
systems on one theme with a hidden gradient, a procedural edge and one hand-built core, so the
periphery points at the core without a marker or a quest log. The instruments come first (M122 the
panel and its misclosure, M123 the paper recorder), then everything the player sees moves into the
cockpit (M124âM127), speech becomes a queue of lines and putting things on the table (M128), and
**the hundred** â a hundred small human stories on one template â is the load-bearing wall
(M129âM131). Design: [`docs/DESIGN-stories.md`](docs/DESIGN-stories.md) (2026-08-22, awaiting the author's call on four forks listed at its end). Fifteen regions follow (M132âM146), then rumours, a returnee and the release.


---


---

# The graphics & performance pass (G1–G12) — moved out of PLAN.md on 2026-08-26

Written 2026-08-22 from the shots. Every line is closed (see the tails ledger in PLAN.md);
kept here as documentation of what was measured and why each fix was chosen.


Self-review of every screen against the art direction (M54 rules). Each line is a **fault seen in a
frame**, then the fix. Order is by how much of play time the screen takes; G0 comes first because
the rest of the pass is measured against it.

**What is already right and must not be touched:** base cross-section, cantina bar, HQ room,
nav map, cockpit frame and rack, crystalline surface mosaic, the hundred portraits. These set the
standard; the rest is pulled up to them, not the other way round.

- **G0 â measured (2026-08-22, 0.95.0), visible Chrome tab, AMD iGPU, window 1536Ã735 CSS.**
  fps by mode at Ã2 (3072Ã1470), before â after the first cache pass: surface 40â45, mine 39â44,
  cave 55â59, scoop 51â55, landing 53â55, system 53, map 61. Same surface at Ã1.5: 58, at Ã1: 60.
  The frame is **fill-rate bound**: one full-screen pass (a blit, a fill, a gradient) costs
  ~4â5 ms at Ã2 on this GPU, JS is â¤3 ms in every mode. So the budget is counted in
  **full-screen passes per frame**, not in objects: about six fit at Ã2, twelve at Ã1.5.
  The hidden-tab `prof()` numbers are not comparable with these (readback inflates everything
  Ã3 and gradients Ã8) â rank with them, never quote them. Rules that follow: (1) a gradient
  or a composite that does not change frame to frame is a `screenLayer`, never a per-frame
  fill; (2) anything static under the camera is a chunk; (3) every new painting pass below
  states how many passes it adds and pays for them somewhere else; (4) `resAuto` stays the
  safety net, Ã1.5 is the honest default on integrated GPUs.
- **G1 â six worlds, one body** (`world-types.png`). Earthlike, desert, ice, volcanic, toxic and
  jungle differ by palette only: the same cell-outline macro texture on rock, sand and ice, the
  same relief amplitude, the same god-ray stamp at the same angle on every world, the same three
  strata. Violates "material in three scales" and "one screenshot says where you are". Fix per
  world type, not per colour: a **material kit** (`18a-material`) with its own macro form â
  dunes/ripples for desert, fracture plates and blue depth for ice, cooled crust with glowing
  cracks for volcanic, sodden banks and pools for toxic, root mass and canopy for jungle; relief
  amplitude and strata count from the kit; rays only where the sky gives a reason (dust, mist).
  **Done in 0.97.0** for the material kit (dune, frost, crust, sludge, soil) and the shafts.
  Still open → closed, see the tails ledger: relief amplitude and strata count per kit; flora silhouettes per world.
- **G2 â no aerial perspective on the surface** (`surface.png`). Far ridges use the near ground's
  texture and value; the ground does not darken with depth; nothing stands in front of the player.
  Fix: three planes â far ridges as flat value silhouettes tinted by the sky (cached
  `screenLayer` per world), mid ground as now, a sparse **foreground** band (boulders, grass,
  drift) at 1.15Ã parallax drawn last and blurred by value, not by filter. Depth gradient on the
  ground: the lowest third goes to the sky's shadow colour.
  **Done in 0.98.0** for the foreground band (`drawForeground`, 21b). Still open → closed, see the tails ledger: far ridges as
  a cached sky-tinted layer; a deeper value gradient on the near ground.
- **G3 â the mine is an empty frame** (`mine.png`). Shaft on a blank plane: strata are flat fills
  with one outline, no texture, no niches, no scale; a tub reads as a crate in a pit (debt above).
  Fix: rock from the same material kit as the surface (chunked by world-x, as cave rock), strata
  with their own micro grain, landings as real rooms (beam, lamp, crate stack, a man-height mark),
  changes of section along the shaft, dust in the lamp cone. This is the weakest screen in the
  game and the first painting job.
  **Done in 0.96.0** (rock was invisible by a clip bug; contacts, landings, lamps, hoppers).
  Still open → closed, see the tails ledger: niches and a change of section along a long shaft; rock chunks by world-y.
  Passes added: 0 (lamps are sprites inside the void clip).
- **G4 â the raid is in a different language** (`raid.png`). A projected corridor of flat fills,
  wireframe crates, an enemy as a pink capsule. It is the only screen the player would not
  recognise as the same game. Fix: keep the projection, repaint with the base's brushes â
  plated walls with rivets (`bDress`), real crates, pirates drawn as bodies (M74 rules), a floor
  with grating and cable runs, one light cone from the hangar door, dust.
  **Done in 0.99.5** for plating, floor plates, light pools, crate rims. Still open → closed, see the tails ledger: pirates
  at rest (poses), the hangar door cone, a rock wall where the base meets the asteroid.
- **G5 â the scoop giant tiles visibly** (`scoop.png`). The band's waves repeat at one screen
  width and the baked 512Ã256 is stretched to Ã3. Fix: bake at 1024Ã512 per giant type with a
  non-tiling domain warp (fbm on fbm), bands as fronts with sharp leading edges and soft trailing
  ones; the floor darker than the band; per-type structure (spots, vortices, plumes), not
  palette.
  **Partly done in 0.99.2** (768Ã384, wider tile). Still open → closed, see the tails ledger: per-type structure, sharp fronts.
- **G6 â the belt is unlit** (`cockpit1.png`). Asteroids are flat polyhedra with no light
  direction; the void behind is a gradient; nothing gives distance. Fix: one star direction per
  belt, faces shaded by normal against it (computed once per rock, cached), a rim on the lit
  edge, three depth planes with dust motes drifting in the near one, the far rocks smaller and
  greyer. The frame and rack stay.
  **Note (0.99.2):** the faces were already lit by normal against the star with a rim; the
  fault was contrast â terminator sharpened. Still open → closed, see the tails ledger: depth planes, near dust motes.
- **G7 â the sky is a band.** On every world the sky is a vertical gradient; the landing screen
  draws clouds as puffs on haze and rain as uniform streaks; the ringed body is drawn through its
  ring. Fix: sky from `19b` as a cached `screenLayer` per (world, hour, weather): horizon glow,
  a gradient bent by the star's altitude, a few cloud fronts from `19e` with a lit and a shadow
  side; rain in two speeds; ring split into back/front halves around the disc.
  **Note (0.99.6):** the sky base is a cached layer since 0.95.0 and rings were already split;
  0.99.8: horizon glow in the star colour, rain in two depths; clouds already had
  lit/shadow sides. Still open → closed, see the tails ledger: glow bent by the star altitude (needs the hour from 06a).
- **G8 â the ship on the ground is a postage stamp.** On the surface the landed ship is ~40 px
  with no shadow, no landing gear dust, no hatch light. Fix: contact shadow, a pool of light
  under the hatch at night, the hull at the same scale as the base's people (the human is the
  rule).
  **Done in 0.99.6** (shadow, hatch pool). Still open → closed, see the tails ledger: the scale check against the base people.
- **G9 â base surroundings** (`base.png`). The hill is one flat dark mass; the soil around the
  modules is one brown. Fix: strata through the soil with the surface's micro grain (chunked),
  a few buried stones, the shaft's spoil heap on top, the hill silhouette with a lit edge from the
  sky. The rooms stay.
  **Done in 0.99.2** for the hill (lit gradient, material, sky rim). Still open → closed, see the tails ledger: spoil heap,
  buried stones that read.
- **G10 â system view composes nothing** (`system.png`). Nebula blobs, even stars, the star and
  planets off-frame: the screen looks like a loading state. Fix: stars in three magnitudes with a
  few coloured ones, the primary's glow bleeding into the frame from its direction even
  off-screen, orbit lines fading with distance, nebula as two layers with parallax.
  **Done in 0.99.7** for the off-screen bleed and orbit fade. Still open → closed, see the tails ledger: three star
  magnitudes with a few coloured ones; nebula parallax.
- **G11 â raster budget, by rule.** After G0: anything static under a moving camera goes
  through `18c-chunks` (today only landing and weather call `screenLayer`/`chunkAt` â the
  surface ground, cave and mine rock, base soil and the sky should all go through it); per-frame
  `createRadialGradient` in `20-life` (11 sites: astronaut lamp, flora caps, fauna glows) is
  replaced by sprites baked once per (kind, size) and `drawImage`d; the full-screen veil and
  vignette are one cached layer; `globalCompositeOperation` switches are grouped so the layer
  stack flushes once. Target: every mode â¥ 55 fps at Ã2 on the dev machine, with `resAuto`
  never firing in normal play.
- **G12 â the foot world gets its pass** (debt above). The longest screen after the cockpit. After
  G1âG2: a POI every 2â3 screens with a silhouette visible from afar, wind in the flora, tracks
  behind the walker, a night with the suit lamp as the only light.
  **Pass 1 in 0.99.9:** tracks. Still open → closed, see the tails ledger: POI rhythm, wind in flora, night (needs an hour).

Not in this pass (still the list under "What not to do"): blur, DoF, chromatic aberration,
motion blur. Depth is done by value and overlap, never by filter.

---

# Moved out of PLAN.md on 2026-08-27 (0.186.0) — all built, kept for the decisions

The live plan had grown to 110 KB against a 60 KB guard, which is the size at which it stops
being readable in one go and starts costing a session to skim. Everything below was closed:
the fourteenth pass (M152–M166), the post-graphics queue, the thirteenth pass, biology and
planet light (M174–M175), and the release look A2/A3 (M176–M177). Their two "left open by
design" tails were carried back into the live plan; nothing else here was outstanding.
