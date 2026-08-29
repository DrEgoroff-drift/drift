# Drift â work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers â numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic â¤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips â ground, cave rock â
  and `screenLayer(key, paint)` for screen-space constants â the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format: writes `v:5`, reads 4 and 5 (M227).** The feared `server.js`/`worker.js` do not
  exist; the cloud (`site/api.php`) checks only that `v` is present. New fields: `snapshot()` plus
  a safe default in `applySave()` (`14-save`); shape changes ride an `s.v===5` branch.
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation â the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.
- **Design in passes, not in one shot** (author, 2026-08-23). Any design — a screen, a
  component, a drawn thing — gets a draft and then several self-critique passes along the way:
  look at the result as a user/with the art direction, name what is wrong, redo, repeat until a
  pass finds nothing. Optimisation is part of every pass, not an afterthought — check the
  raster/JS budget (`prof()`, the "painted once" rule) before calling a pass clean.

## How a frame is judged (M241) — the meter, and the rules under it

"I don't like the look of it" is not something anyone can act on. Since M241 the frame is
measured, the way speed is: `look()` in the console reads the canvas that is actually on screen
and prints four numbers; `lookAll()` walks every scene and prints the table. The scene list lives
in `28y-look` and is shared with the fuzzer — one list, or the two drift apart.

**Four numbers for a FRAME** (`LOOK_TARGET`):

| number | target | what it catches |
|---|---|---|
| warm % (warm pixels of warm+cold) | 25–75 | a monochrome frame. Measured before the work: 0–6% or 81–99% in nine scenes out of ten |
| empty % (16×16 blocks with no detail) | ≤ 45 | nothing to look at. Measured: 26–86% |
| contrast (p95 − p5 of value) | ≥ 0.30 | everything sitting in one narrow band. Measured: 0.07–0.77 |
| tones (hue buckets holding ≥5%) | ≥ 5 | one hue doing all the work. Measured: 2–8 of 36 |

**Five passes for a THING.** A thing is finished only with all five; three or fewer and it reads
as a placeholder:

## M245 — rope and cloth (2026-08-28) — CLOSED (0.241.0)

The author's links to CodePen demos, taken as methods rather than as demos. Verlet integration
lives in `18d-verlet` and serves the mine's cable, the home's mast guy-wires and the laundry on a
line in the yard; the system view got dust in three parallax planes.

Rules worth keeping:

- **Take the method, hang it on a thing.** A cloth simulation on a black background is a demo; the
  same solver on a washing line is a house where someone lives. Every effect from now on answers
  "whose is it and why is it here" before it answers "how does it look".
- **One wind for the world.** The rope, the cloth, the grass, the dust and the smoke all read
  `WIND`. Two generators of wind desynchronise within seconds and the eye catches it faster than
  it catches no motion at all.
- **A cache keyed by length is a trap.** `dustTable` kept exactly one table and rebuilt it whenever
  a caller asked for a different size: three layers with three sizes rebuilt it three times a
  frame — five milliseconds appeared out of nowhere. Either key the cache properly or share one
  table and offset the index.
- **`globalAlpha` per particle is a state change.** Three hundred of them a frame cost more than
  the particles do. Set it once per layer and vary size instead.
- **Depth comes from different motion, not from more things.** Three dust layers at 46 particles
  read deeper than one layer at 70, and the emptiness number barely moved either way — filling a
  frame with dots is not the same as filling it with structure. The system view still needs its
  nebula and its traffic, not more specks.

## M243 — light as a system (2026-08-28) — CLOSED (0.239.0)

Stage two of the graphics work: every scene gets a second temperature and light gets somewhere to
fall. Directional shadows from `SUN_DIR` (one function serves the astronaut, the ship, the rocks,
the plants, the headframe; buildings got the same, and the house got a shadow at all), a cheap
bloom (frame ÷4, multiplied by itself as a threshold, blurred, added back — 0.16 ms), a zenith
colder than the horizon so shadows go blue on any world with air, a lit cabin window on the parked
ship at night, and a station that gives off its own light.

The meter's temperature test was rewritten mid-stage, and that is the lesson worth keeping:

- **A metric that cannot classify a third of your palette is not measuring your game.** Hue
  sectors (10–70° warm, 170–280° cold) left green unlabelled, and on a green world the meter said
  "no colour". Warm against cold is red against blue, per pixel — the way a painter decides.
- **Do not demand a ratio where the world has a right to a bias.** "25–75% warm" would order an
  ice world to burn. The target is the PAIR — the smaller of the two temperatures, ≥15%: a frame
  may lean cold, it may not be single-temperature.
- **Multiplicative light cannot recolour a surface.** The first attempt tinted the ambient blue
  and nothing moved: `base × amb` keeps the base's hue. The colour had to come from the SKY the
  frame actually shows — hence the cold zenith, which is both physically true and visible.

Numbers after the stage: contrast on the ground by day 0.17 → 0.48, the mine 0.26 → 0.36, the base
0.22 → 0.41, the system 0.09 → 0.95. Pair: base and gas dive 40%, cave and home still 0–1% — those
two are next, and they need their own light rather than the sky's.

## M242 — the drawing stops contradicting the world (2026-08-28) — CLOSED (0.238.0)

Stage one of the graphics work, and deliberately not about taste: seven places where the picture
said one thing and the model another. Two suns (the disc on real mechanics, the light on a
constant), a ring with no planet in it, a chimney above its own roof, orbits leading the eye into
nothing, the lander parked on the house, rain in front of the ship, a station the size of the ship
that docks inside it. All seven closed in 0.238.0 — see PATCHNOTES for what each one was.

Rules worth keeping:

- **If the model computes it, the drawing must read it.** A constant standing in for something the
  world already simulates is a lie that grows with the game: `SUN_DIR` was written when there was
  no day cycle, and it survived three milestones of celestial mechanics.
- **A floor is not a difference.** "No darker than the air" made the sky body EQUAL to the air on a
  bright day. When something must be legible against a background, the requirement is a distance,
  in whichever direction it was already going.
- **Anything baked carries its light in its key.** The ground chunk knew the hour but not the
  side; the moment light acquired a direction, the key needed the direction too.
- **A thing sits where its own surface is.** The chimney was placed from the ridge because the
  ridge is one number and the slope is a formula. One line of arithmetic is cheaper than a
  screenshot from the author.

1. **Silhouette** — recognisable at 20 px, not a rectangle, not symmetrical.
2. **Break-up** — three to seven parts of different sizes; no part over 40% of the area.
3. **Material** — every part has grain. A flat fill is an unfinished job (law 4).
4. **Light** — a lit side, a dark side, a rim, and **a shadow on the ground** (law 2).
5. **A trace of life** — one detail that did not have to be there: a stain, a number, a patch, a
   worn path, a curtain.

Scored on the day the rules were written: a hull 5/5, the house on a planet 2/5, the woodpile
1/5, the mast 1/5, the boulders 1/5.

**The rule of origin.** Anything that occurs in the game more than once is built by a GENERATOR
with seeded variation, never by a formula. Hulls obey it — form, break-up, paint, markings, wear,
each seeded — and that is exactly why they read as machines while the house reads as a diagram of
a house.

**The rule of the question.** For every thing in frame: who made this, and why. A house a person
built has a path to its door, a woodpile stacked by hand, a patch on the roof. No answer means
the thing is scenery.

## Done

M1âM32 â the base game (see git history). M33 parts and total rig capacity Â· M34 ship screen with
hull slots Â· M41 WebAudio sound engine Â· M42 generative music with beacons and reverb. Plus the
split into modules and the `build.ps1` build.

**The whole queue below is finished** (July 2026, one milestone per commit):
M43 celestial mechanics and autopilot lead Â· M44 six station types with type-driven tabs Â·
M39 rare resources, gas scooping, smelting Â· M45 hiring, fleet, orders, lazy simulation Â·
M46 wages, debt, morale, repair Â· M37 base in cross-section with power balance Â· M38 base network
and transfer Â· M47 base staff, roles, raids Â· M40 the lab: hull fusion and part crafting Â·
M35 boarding a pirate base on polygons Â· M36 enemy types, consumables, mezzanines.

Descriptions of finished milestones live in [`docs/PLAN-archive.md`](docs/PLAN-archive.md): they
remain documentation of the decisions taken, but sit apart so this file can be read in one go.
Here is only what is still live â cross-cutting rules, the visual queue and the milestone queue.

---

## M240 — the economy counted (2026-08-28) — CLOSED (0.236.0)

Measured, not argued. Everything below is a number the game produced, at the starting hull
(hold 40, drill 1), prices from the live market around the origin.

### What earns, per hour

| channel | credits/hour | attention | bounded by |
|---|---|---|---|
| hand drilling + selling | 10 000–70 000 | full | the planet's deposits (237 units, mostly cheap), hold 40, flight time |
| trade run | 3 000–50 000 | full | capital, the spread (≤96% within three jumps), price pressure (−0.5%/unit, floor −35%) |
| drone, iron → crystals | 576 → 5 220 each | none | the point: 362 units / 117 units, i.e. 5 800 / 17 000 credits, then it comes home |
| base "surplus" BEFORE | 2 856 per base | none | **nothing at all** — the hole |
| base "surplus" AFTER | ~420 per working base | none | the base's own consumption |
| the road (companion mode) | ≤2 200 a day × rank | driving | a daily bank, 14 000 ceiling |
| a hired hand's run | negative (~85% of wages back) | none | by design (CLAUDE.md) |

### What costs

Fuel 11 a unit (1 100 a tank) · repair 14 a hull point · drone 2 200 · founding a base 2 500 +
10 alloys · reactor 1 800 + 6 · solar panel 700 + 2 · drill 1 400 + 4 · evacuation 800 + 220 per
parsec, capped at 4 000 · yard service 140 + (wear − floor) × 2 600.

### Rates that set the pace

Drilling by hand: 90 units/min on the ground, 108 in the belt, 68 in the mine. A hold is 40, so
it fills in about 25 seconds — **the drill has never been the limit; the hold and the flight are.**
A full hold is 640 credits of iron, 5 800 of crystals.

### The hole, and the rule behind it

The base paid for spare capacity without asking whether the base worked, so the most profitable
base was one that did nothing: reactor + four panels, 4 600 credits in, 2 856 an hour out, payback
1.6 hours, unlimited copies. Fixed the way the yard was: a station buys the SPILL of a working
base — at least one consumer, and never more than the base eats itself.

**Rule (second sighting): an idle income with no ceiling is a bug, whatever gates it.** The perk
gate hid this one for a long time; a gate delays the exploit, it does not bound it. Every passive
channel needs a bound that is part of its own fiction — the drone has its point, the road has its
day's bank, the base now has its own consumption.

### Left standing on purpose

A drone returns 2.6× its price on iron and 7.7× on crystals, so buying drones is always correct;
the only question is where to put them. That is a mild absence of trade-off rather than a hole —
the bound (the point runs out, and deposits must be found on foot) holds. Flagged for the author
rather than changed.

## M239 — the phone in every mode (2026-08-28) — CLOSED (0.235.0)

The phone half of the interface was measured in one mode and assumed in the rest. Now the layout
suite walks the fuzzer's scene list, so every mode is measured — and it found the belt's console
sitting on the pads within a minute, plus warning lamps printing over each other at 375 px.

Rules worth keeping:

- **A layout number measured under one state is a guess about the others.** The floors on the
  phone stood on constants taken when the pad row was one line high; the belt folds it into two.
  Anything stacked above something whose size can change reads that size (`--padsh`), it does not
  remember it.
- **When a row of captions will not fit, name only what is lit.** Shrinking type or truncating
  words both make the row unreadable; dropping the labels of lamps that mean nothing makes it
  readable and says the same thing. Two lit at once take turns — slowly.
- **Share the scene list.** The fuzzer's eleven setups now serve the layout suite too. A second,
  parallel list would have drifted within a month.

## M238 — the fuzzer (2026-08-28) — CLOSED (0.234.0)

The author's freeze could not be reproduced by hand, so the game got a net instead of a guess:
random input over every mode, on a fresh world and on a lived-in one, plus a sweep that renders
every desk and station tab and clicks every button in them. All of it seeded, so a failure
repeats. 33 000 frames came back clean — which is itself the finding: the world under random
hands does not throw, and the freeze lives somewhere the fuzzer does not yet reach (a save with
history behind it, or a path through the DOM that only a real session takes).

Rules worth keeping:

- **A dispatch table written inside the loop will be copied wrong by everyone else.** `stepWorld`
  and `drawWorld` exist because the fuzzer's own copy of "which update runs in which mode" gave
  three false crashes in ten minutes. Anything a second runner needs belongs in a function, not
  inside `frame()`.
- **A fuzzer's value is the scene list, not the randomness.** Writing the eleven setups was the
  work; the random keys are four lines. The same list is now the cheapest way to ask "does the
  whole game still start?" after any cross-cutting change.
- **A screen that throws while drawing is a freeze to the player.** Rendering every tab is worth
  more than any single assertion about one of them.

Next, if nobody says otherwise: a phone pass by hand (the author's two evenings gave five
defects; half were catchable that way) and an economy sweep for holes like the yard's, where
repetition plus credits defeats a rule.

## M237 — the drones fly (author, 2026-08-28) — CLOSED (0.232.0)

The author asked for two things and got a third for free: dots with tails flying between planet
and station, so you can see who works for you and on what; grouping by route, Transport-Tycoon
style; and breakdowns that repair themselves in time rather than money. Closed in 0.232.0.

The three decisions he left to me, and how they went: **visible in the system view, a number on
the galaxy map** (a one-pixel dot on the map is litter — there the question is "where does someone
work for me", and a digit answers it); **the destination stays the nearest station** (choosing it
is a route editor, and that belongs to a manager holding the domain, not to the player's
fingers); **no permanent losses** — he asked for machines that break and mend, not for attrition,
and the milestone deliberately changed no economy.

Rules worth keeping:

- **Anything that moves in the world can be a function of the clock.** Position, leg, tail: all
  derived from `(now − t0) % T`. Nothing per-frame, nothing saved, offline catch-up for free. The
  same shape fits any future traffic — couriers, tugs, patrol boats.
- **A log line per transaction is a broken interface.** The journal remembers results, not
  bookkeeping: a point worked out, a machine stopped, a machine back on the route. If a system
  writes a line every three seconds, the line is not news.
- **A limit made of time is felt without a number.** The repair clock needs no price, no button
  and no explanation — the amber blink at the station says everything, and the wait is the cost.

Pass 2 (0.233.0), by eye and not by test: a drone in a station-less system flew INTO the star
(`droneHome` fell back to (0,0), which is where the star is drawn); the name sank into the
corona without a shadow; the dots did not grow with the camera, so an empty one was invisible at
any zoom; and the map badge sat exactly on the selection ring of your own system. Rule from it:
**a fallback coordinate is a place too** — (0,0) is not "nowhere", it is the middle of the map.

Left open on purpose: choosing the selling station (a manager's job when the domain has one), and
attrition. Both are additions, not corrections.

## M235 — the yard has a floor (author, 2026-08-28) — CLOSED (0.229.0–0.230.0)

The author's second evening. Two things, one of them a design hole:

- **ВЗЛЁТ did not go away** after the launch (0.229.0). It was shown and hidden by the same
  function — `updateSurface` — which does not run in any other mode, so nothing hid it once the
  mode changed. Rule: **a button has one owner, and hiding it belongs to whoever runs everywhere.**
  Showing stays with the mode that knows the context; hiding goes in `hud()`.
- **The wear economy was for sale** (0.230.0). Halving on a button that can be pressed again is
  not a limit, it is a price list: five presses cleaned the hull and cancelled the point of the
  whole mechanic. Chosen fix (author picked it out of four): **a floor at the yard**, set by where
  you docked (Верфь 18%, trade node 32%, combine 38%, plus up to 18 points for a frontier system),
  never crossed for any money; home still takes it to zero for free. Rule worth keeping:
  **a limit expressed as a fraction is not a limit — express it as a floor, a stock or a clock.**
  Anything that halves can be pressed twice.

## M234 — the author's phone (live, 2026-08-28) — CLOSED (0.228.0)

Four screenshots and five lines from an evening of play on a phone. Not an audit by eye this
time: things that BROKE. All five are closed in 0.228.0 (see PATCHNOTES), and three of them left
a rule worth keeping:

- **A frame that can throw must not carry the loop.** Every `requestAnimationFrame(frame)` call
  belongs OUTSIDE the body that can fail — otherwise one exception is a permanent freeze with no
  message and no way back. Any long-running loop added later follows the same shape: a body that
  may throw, a wrapper that reschedules and names the failure.
- **A resource whose refill outruns its drain is not a resource.** The jetpack read 100% for an
  entire evening; the numbers had said so since M152 and nobody looked at the gauge while playing.
  Before shipping a meter, play with it in view for a few minutes: a needle that never moves is a
  lie in the interface, not a balance question.
- **Two glass panels at the same height are one button.** `#launchbtn` and the console were both
  fixed to the bottom, 4 px apart, and the one with `z-index` took the taps — the planet became
  impossible to leave. The phone's floors (pads → console → prompt) are a stack, and anything new
  that lives at the bottom either joins the stack or goes to the other board. The layout suite now
  measures ВЗЛЁТ too; it measured everything else and would have caught this a milestone earlier.

Also worth remembering: **what persists needs an address on screen.** The mine had been persistent
since M186 and invisible from the surface ever since — the player could not tell where they had
dug, because there was nothing to see. Anything the world remembers should be visible in the world.

## M233 — the shots as an audit tool (live, 2026-08-28)

The author, reshooting the README: «прикол не поймать кадр, а понять, что кадр говно из-за
того, что в игре оно говно». So the shot is a probe, not a deliverable: when a frame looks
wrong, the fix goes into the game and the frame is taken again. Loop: shoot → look → name the
defect → fix the game → reshoot. **Goal: beautiful shots, beautiful game.**

Closed so far (0.225.0): the cloud-horizon haze cutting a straight line across the sky; the
landing camera that never showed the ground; far ridges climbing into the sky on approach; the
ghost instrument pod without captions; the white-blot owner at home and the black-hole doorways.

Closed in pass 2 (0.226.0): the mine's black half-screen (the sky was gated on `camy<40` and
airless skies were never given their stars); the scoop's heat gauge as an empty frame with the
caption outside it; the pirate hangar's brown checkerboard (two light pools per cell, painted
in the lamp's colour at low light); the settlement staying dark in a downpour; the cave's
darkness painted in a cold black that erased the rock.

Closed in pass 3 (0.227.0): the jungle as one flat green (plant depth faded with alpha, which
over a green sky does nothing — distance now moves the plant's own colour into the air); the
armless figure at home; and the front page catching canvas UI (`SHOT_CLEAN`, a stand-only flag
that drops the hint band, target chips and the base's build cursor).

Rules learned here, worth keeping: **a screen-space band tied to `SURF_HOR` is a lie in any
mode where the ground is elsewhere** — fade it both ways or anchor it to the real ground;
**a parallax offset written as a fraction of `camy` only holds near the ground** — cap it
against the near terrain; **a threshold on a raw camera value (`camy<40`) is not a question
about visibility** — ask whether the thing is in frame; and **in a renderer without an
additive pass a light pool must be painted as lit FLOOR, never as the lamp's colour at low
brightness** — the latter is mud; and **fading a far object with `globalAlpha` is not aerial
perspective** — on a world whose air is the same hue as the object it changes nothing, the
object's own colour has to move toward the air.

## M232 — cosmetics to the limit (the author's self-prompt, 2026-08-27) — CLOSED WHOLE (0.217.0–0.224.0)

The author handed a full cosmetic audit; it subsumed the two "author's eye" items that were the
whole remaining queue (the day palette; base free-strip polish). Worked in the author's order —
base cross-section → compartments → raid → walker → planet/weather → the rest — one stage per
version, each pass: draft → self-critique by eye → perf check. Closed entirely on 2026-08-28;
the final measurement read 60 fps in all nine modes. **The eight laws below are not closed and
never will be: they are the standing checklist for every future visual pass.**

### The eight laws (breaking any = a defect; hunt them on every screen)

1. Every bright patch has a source; every source has something lit. A cone under which nothing
   got brighter is film, not light.
2. Everything that stands casts a shadow. On the base only people have them — the furniture
   FLOATS. The game's most widespread defect.
3. A silhouette has an edge: the top rim catches the lamp or the sky.
4. A flat fill is an unfinished job. Wall, floor, iron, rock — each has its own grain.
5. Work is visible. A man in a compartment DOES, not stands. The standard is the barkeep's
   8-second cycle. Four men at the smelter stand WATCHING the fire — a museum, not a shift.
6. Motion, not blinking. Slow mechanical cycles: belt runs, flywheel turns, lift cage travels.
   Blinking is forbidden except the alarm lamp.
7. Cold key + warm accent in every scene. Thin out the green.
8. One astronaut everywhere a suit is worn. In the living quarters helmets are OFF — people are
   home, and faces show for the first time. Warmth cheaper than any light.

### Stage 1 — base cross-section (`21ac-base-draw`, `21aa`, `21ab`) — DONE (0.217.0)

All four defects closed and five of six animations in: cable out of the rooms (channel under
the deck, risers up partitions, a panel box with a steady lamp per room), partitions as
concrete (chipped top, cast flaw, bolted plates), the soil profile along the silhouette with
the scar of cutting above the top row, corridor walkers (the shift, only where a shift
exists), the lift cage + counterweight + floor light, smelter smoke to a wind-blown surface
cap, the flag's travelling wave, room light into the tunnel. **The drill conveyor moves with
the drill's own pass in stage 2.** Openings between rooms already existed (the doors).

### Stage 2 — compartments, one at a time

- ~~**Reactor.**~~ — done (0.218.0): rounded tank with dome and hoops, small bolted hatch with
  rods behind glass, steam exhale once in ten seconds, trembling needle, wall shadow, the
  operator's forearm sliding along the board.
- ~~**Solar.**~~ — done (0.218.0): battery cabinets with shelves of cells, terminal jumpers,
  creeping charge strips; the shift moved to the switchboard; a technician with a probe. The
  mast panel already tracked slowly.
- ~~**Drill.**~~ — done (0.218.0): lump sizes vary per lump, hop on the rollers; the auger
  already turned, the dust at the face already stood.
- ~~**Warehouse.**~~ — done (0.219.0): floor stacks of differing height, tarpaulin with
  tie-downs, slings, tallyman marking a slate.
- ~~**Living.**~~ — done (0.219.0): helmets off (`bWorker` bare head), lamp cone falls on
  table and sitter, laundry on a sagging line, crowd capped (`calm`). The sleeper and the mug
  already existed.
- ~~**Smelter.**~~ — done (0.219.0): stoker with a poker on a slow cycle, carrier walks the
  molds→rack half-room with a glowing ingot, wall-wide slow flame pulse, sparks on the
  thrust; the slag-watcher statue removed.
- ~~**Pad.**~~ — done (0.220.0): shuttle nose with a breathing marker light in place of the
  green mass; the crane trolley ping-pongs the beam instead of the sawtooth teleport.
- ~~**Battery.**~~ — done (0.220.0): five insulator stacks with ball tops under a bus, ONE
  quiet arc run per 8–12 s, a slowly turning flywheel.
- ~~**All:**~~ — furniture shadows swept across all nine rooms (0.218.0–0.220.0); lamp cones
  already varied by `dim`; shift-trace objects already stood (`fin.junk`).

### Stage 3 — raid into the base's language, astronaut instead of a mannequin — DONE

The astronaut half fell out of stage 4 (same `drawAstronaut`, 0.221.0). The environment half
(0.222.0): the wall's cable channel carries the base's emissive amber line with clips and an
occasional panel box; sheet tone varies per wall. Plinth/seams/rivets/beams/lamps were already
there from G4/M180; the corridor dark is the design.

### Stage 4 — the walker — DONE (0.221.0, taken before stage 3)

Taken early because the raid draws the same `drawAstronaut` large — the mannequin complaint
and the walker complaint were one body. All eight items in: knees in the step phase, boots as
bodies with a lit edge, two tanks with a valve (antenna light breathes, not blinks), the visor
brow highlight, the structural warm side, dust per step on dry worlds, body lean at a run, and
the night lamp lighting the walker himself.

### Stage 5 — planet and weather — DONE (0.223.0)

All five closed in one pass: the day key (`dayK`/`skyDay` in 19c — one source for sky, ambient,
haze, direct light and grade; quantized hour in every cache key), shafts killed by
precipitation, two fade steps for ridges in rain, three grass forms, storm-dark clouds.
Measured at 60 fps in all nine modes after. Stand scenes `?s=noon`/`noonice`/`noontox` remain
in `docs/mkview.ps1` for the author's eye.

### Stage 6 — the rest (the previous audit) — DONE (0.224.0)

All six tails closed: the dead-grey free-domain screen, the attic's light pool + brick
falloff + photos in frames, the shaft ore catching the lamp (still not a lamp itself — the
standing decision holds), the sanatorium's two surf bands + the railing shadow flipped to
agree with the sun, needle shadows on the instrument dials, and the trade cantina's moored
ship became a ship. «Ископаемые ствола не светятся» was read as "make them answer the
light" — if the author meant something else, the line is one edit away.

---

## M55. Visual work queue (live)

Where we stopped. Everything above the line is built, tested and pushed; everything below is
not started.

### Done (0.14.0 onward)

Points of interest on planets and in the belt, rock material, geology in cross-section, light and
air, sky with a loudness budget, the look of a system and exotic stars, the feel of flight, alien
flora and fauna, a living camera, station modules, weather.

### Remaining, by descending payoff

1. **The mine from inside** â two passes done (`23-mode-dig`). Strata, ore in grains, the working
   floor, timber and ladder, track and tub, haze at the far end. **Still open → swept, see the tails ledger:** the landings in
   the shaft barely read; a tub in a cell dug below the floor looks like a crate in a pit; and a
   long shaft is still a long shaft â niches and a change of section would do more than texture.
2. **Ships** â done in two series of ten passes (`03-ships` and its split, `03a`â¦`03e`). Class
   reads by silhouette, the fleet is painted like industrial hardware (bone skin, panel plating,
   graphite engines, stencils), the planform is a scheme of its own (delta, cross, catamaran, slab,
   disc, trident, swept) so there are about fifty silhouettes, and the luxe yacht is its own craft
   entirely. **Still open → swept, see the tails ledger: faction** â one visual language for everybody, and per the queue below
   factions come after stations.
3. **Cantinas** â done. Light is a layout (how many lamps, what tone, how wide the cone, what
   happens between them), the crowd is counted per station type, what stands behind the counter is
   what the place deals in, and the music leans by type. **Still open → swept, see the tails ledger:** the counter is the same
   length and shape in every hall.
4. ~~**New world types:** crystalline, jungle, metallic, ruin.~~ â DONE: all four are in `TYPES` (02-world) with profiles, relief and geology.
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ â DONE at M108 (`17b-finds`).
6. **`base` and `scoop`** â twelve passes on the base (`21a-mode-base`, `21aa-base-rooms`,
   `21ab-base-interiors`; stands `docs/mkbase.ps1`, `docs/mkroom.ps1`) and a first ever pass on
   `scoop` (`19a-mode-scoop`, stand `docs/mkscoop.ps1`). The narrative of what each pass fixed is
   in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) â grep it for `M55`. Open debt only, below.
7. ~~**Factions as a language of shapes**~~ — closed 0.109.0 (`17d-house-shapes`); found stale in
   this list 2026-08-27 — the Closed section below had recorded it all along.
8. ~~**Redo the clouds.**~~ â DONE: `19e-clouds` is a density field in perspective, called from `drawSkyLayer`.
9. ~~**The world on foot**~~ — DONE at M172 (0.138.0): `sunSpot`, night as a value structure, the
   lamp as a cone, far ridges with their own amplitude, `SURF_HOR`. Stand: `docs/mkfoot.ps1`.
10. **Split debt.** Three payments made 27.08.2026 (0.209.0), each along a stated seam and out of
   the guard's list: `28-loop` 47→25 KB (telemetry and `hud()` → `27z-telemetry`), `27d-ui-cantina`
   46→26 KB (barkeep, views, props, tables, counter → `27d-ui-cantina-props`), `12tb-settle-draw`
   45→23 KB (buildings, villagers, `settleDrawBody` → `12tb-settle-draw2`). `PLAN.md` itself was
   archived from 83 KB back under the 60 guard (M200a–M201 and M169 → `docs/PLAN-archive.md`).
   **Still shouting**, in size order: `21ac-base-draw` 50 (grew with M232 stage 1; `drawBase` is
   one long function — same class as `drawRaid`, a redesign rather than a cut; the stated seam if
   it ever must split: the mountain/surface half vs the rooms half), `14-save` 48 (one 590-line
   `applySave`, no seam short of redesigning it), `27k-road` 47 and `27l-road-draw` 44 (each one
   long function), `24aa-raid-draw` 46 (`drawRaid` is 600 lines), `26-ui-station` 45 (`renderTab`
   is 460), `27e-ui-home` 44, `12y-parrot-face` 42, `27f-hq-room` 41, `25g-postcard` 41. The fourth payment (0.209.1):
   `21ab-base-interiors` 42→26+18 — the table is not cut, it is CONTINUED (`Object.assign` in
   `21ab-base-interiors2`), so readers still see one whole `BASE_ROOM`. The single-function giants
   that remain are a redesign each, not a cut.

### M169 — the graphics campaign of 2026-08-24 — closed, moved to the archive 2026-08-27

Settlement rebuilt as a place, mine rock given a mass, cantina given a host, deposits turned into
outcrops, cross-section faulted, gas giant rolls. Frame measured like for like afterwards: same or
better than baseline. Grep `docs/PLAN-archive.md` for `M169`; the measurement rules live on in
`docs/g11.ps1` and the M169 line of the release checklist.

### M173 — the author's own walkthrough, 2026-08-24 (live queue)

The author played the dev build and pointed at things one at a time. Each line is a fault **he
saw on his own screen**, in the order he found them; they are worked through in passes, in this
order, and struck out as they close. This is the live queue — new finds go at the bottom.

1. ~~**A black polygon in the ground, "what is this at all"**~~ — done. It was the near-plane
   boulder of `drawForeground` (21b), filled at `amb×.30` with no contour and no material. On dark
   ground it stopped being an object and read as a tear in the render. **The rule is wider than
   one rock: any silhouette in this game must carry an edge that caught the sky** — without one
   the eye reads "nothing was drawn here", not "a dark thing".
2. **"The plants are ugly, and they clump"** — **half done, and the half that is left is the
   harder one.** *Clumping: fixed.* Cluster centres were chosen as the best of three throws
   across the whole strip, lowest ground wins; a strip has one hollow, so every cluster walked
   into it — half the screen a wall of foliage, the other half bare. The strip is now divided
   into as many stretches as there are clusters and each looks for its own low spot inside its
   own stretch; plants inside a cluster are spaced instead of thrown, and each carries a depth —
   far ones smaller and fading into the air, near ones full.
   *Ugly: not addressed.* The forms themselves (`drawPlant`, 20-life) are flat cut-outs in one
   acid green: no shading across a leaf, no value difference between stem and crown, the same
   hue whatever the world. That is a pass of its own on the plant body, not on where it stands.
3. ~~**"This is rubbish too" — the ringed planet in the sky**~~ — done (`skyGiant`, 19b). Three
   causes: the body took the colour of the planet *underfoot* (dark world → black disc, plus a
   .86 terminator — a hole again); the light always came from the right regardless of the star;
   and the ring was two thin arcs of equal brightness front and back, no planet shadow on them,
   no divisions — that is exactly what makes a hoop. Now the body is lit from where the star
   actually is (`sunSpot`), mixes the star's colour so it can never go black, and the rings are
   five bands of different width and brightness with the planet's shadow across them, the far
   half dimmer, and the near half half-transparent over the disc.
4. ~~**The home reads as a warehouse**~~ — done. The wall was bare from waist to ceiling and the
   eye measures height by things, not by paint: a dado, a skirting and a beam give it three
   horizontals. The ceiling came down from 2.6 man-heights to 2.3. Every room got one object
   **in front of** the walker, cropped by the bottom edge, so the room has a front and a back
   instead of one flat plane. Residents got depth and elbow room — five of them used to stand on
   one line, shoulder to shoulder, reading as a row of identical cut-outs.
5. ~~**"The lamp just doesn't light anything"**~~ — done, and it was the M172 cone's own fault.
   A milky wedge was laid over the world — over the sky as well — and nothing under it got
   brighter. Light does not work that way: what you see is not the beam, it is **the lit thing**.
   The work moved to the ground: a strip along the terrain profile in front of the walker now
   really brightens (added over the rock, so the material still shows), falling off with distance.
   The airborne beam stayed but faint and narrow — as much as dust actually scatters — and only
   where there is an atmosphere to scatter in.
6. ~~**"Look at it from the dev stand, don't raise a local one"**~~ — done: `dev.ps1` publishes
   this build to `/dev.html` and the sheets to `/dev/`, and the four recurring tooling errors are
   fixed and written into `CLAUDE.md` (ssh noise, `.ps1` BOM, parameter shadowing, probe flags).
7. ~~**Release look**~~ — **finished as a whole (author, 2026-08-27: «сейчас того что есть
   достаточно»).** Pass 1 (on foot the ship's instruments hide), A2 (0.143.0), A3 — the desk as
   paper (0.144.0), then the author's own reversal M187 (0.160.0, instruments at the top and
   readable). The two held-back halves are closed by decision, not deferred: overlay removal is
   superseded by M187, and the paper language stops at the desk. See the M124 note in Closed.
8. ~~**The plant body itself**~~ — done in 0.140.0, but only the skin. `stemC`/`leafC` stopped
   being flat colour strings and became gradients in the plant's own coordinates, so all twelve
   forms got light and shade in one edit, lit from where the star actually is (`sunSpot`); tone
   varies ±12% between neighbours from a hash of the place, so a thicket is no longer one patch
   of paint. What this does **not** fix is item 12.
9. ~~**A second storey for the living part**~~ — done (0.145.0, M178-9): `29e-home-up`, two rooms
   over study and living, a real stair, the house drawn as a cross-section (roof, attic, joists),
   Vega at the loft window. Suite `91zzzc-home-up`.
10. ~~**The world heard**~~ — done (0.146.0, M178-10): `09a-roomtone` — wind by weatherPower
   (storm heard before seen), rock by depth, the house warm with creaks and the weather through
   the wall, ventilation on the base, absolute silence in vacuum. Suite `91zzzd-roomtone`,
   verified live by AnalyserNode RMS.
11. **Save format v:5** — the author said break it (2026-08-24). Then measured: all 119 persisted
   fields are still read, there is exactly one legacy branch (`modsOwned` falling back to
   `mods`), and the 71 "defensive defaults" are validation of untrusted input — a save comes from
   localStorage and from the cloud — so they stay at any version. Breaking now costs every
   existing save and buys almost nothing. **Held until the release look actually changes what is
   persisted**, then broken once, together with the cleanup. The author has the call.
12. ~~**"The instruments would sit better at the top"**~~ — **decided and done (0.160.0, M187).**
   The author settled it on 2026-08-26 in one line: «приборы сверху, сейчас очень плохо не видно».
   Everything below is the argument as it stood before the call; what was actually built, and the
   two rules that replaced A2's, are in `PATCHNOTES.md` 0.160.0 and at the head of the instrument
   block in `style.css`. The reversal was done in one go across every mode, as the note demanded —
   the composition per screen survived, only the edge changed.

12a. *The argument as it stood before the call* (author, 2026-08-25 → settled 2026-08-26): A2 had
   put the state at the bottom on the ground that the top edge belongs to the world; the author's
   eye said the bottom band was already the noisiest strip of the frame. The full reasoning, the
   cost of the reversal and the two rules that replaced A2's are in `PATCHNOTES.md` 0.160.0 and at
   the head of the instrument block in `style.css`.

13. ~~**The raid reads as if the man stood on the ceiling**~~ — **done (0.161.0, M180 pass 2).**
   He was right literally: the camera's up vector pointed down, and every raid frame since M35 was
   drawn mirrored about the horizontal. Three of the four suspects below turned out to be one bug
   (the inverted value order, the missing contact shadows and the "hanging boxes" were all the
   flip); the fourth — pitch and principal point doing one job twice — was **not** the fault, since
   floor and ceiling converge to one horizon either way, but the framing numbers were re-derived
   anyway once the flip was fixed. Found while looking at the corrected frames: loot crates had
   never been drawn at all (queued into the polygon list after it was painted), marks drew through
   bulkheads, and bodies were four times too small for the compartment. All in `PATCHNOTES.md`
   0.161.0; guards in `91zzze-raid-view`. Original text:

13a. **The raid reads as if the man stood on the ceiling** — the author, 2026-08-25, on the
   pirate-base frame: «не очень понятно, посмотри на перспективу». The complaint is about the
   legibility of the space, not about the bodies. Four suspects, in the order to check them
   (`24aa-raid-draw`):
   - **Pitch and principal point do one job twice.** The camera is tilted down
     (`fwd=[…,-.16,…]`) *and* the principal point is lifted (`CY=H*.44`, M180). Shifting the
     principal point is the architectural trick precisely because it keeps verticals straight
     without a tilt; doing both leaves floor and ceiling converging at nearly the same rate, and a
     plane that recedes upward stops reading as ground.
   - **The value order is inverted.** The ceiling carries the light panels and the pale slabs, the
     near floor is almost black — so the brightest receding plane in the frame is the one the man
     is *not* standing on, and the eye takes that for the ground.
   - **The player may be losing his contact shadow.** The pirates have theirs and read grounded;
     the ellipse under the suit is drawn only when the floor point projects below the body
     (`pm.y>m.p.y+4*s`), a guard this camera height can fail. Measure it before assuming it.
   - **Hanging boxes look like floor boxes.** Crates on the upper wall carry the same silhouette,
     tone and contour as the ones on the deck, so they add no up/down evidence either.
   One frame is not a diagnosis: reproduce it on the stand (`docs/mkview.ps1`, `?s=raid`), and fix
   the reading of the space — a horizon the floor alone owns — before touching anything else.

### Graphics debt — audited 2026-08-27, and the ledger is EMPTY

Written down on 2026-08-16 so the picture stops being an open-ended errand. Audited today entry by
entry against the code and the stands, and every line had already been paid by a later pass, each
fix carrying the original complaint as its comment:

- ~~scoop~~ — 768×384 bake, three structural giant kinds (G5). ~~mine~~ — landings rebuilt, the
  tub a trough with an ore heap, the shaft changes section (G3). ~~cantina~~ — counter per type,
  barkeep with a work cycle (M169). ~~ships/factions~~ — closed 0.109.0 (`17d-house-shapes`).
  ~~the world on foot~~ — M172. ~~split debt~~ — item 10.
- ~~подглядка (M118)~~ — the mat is mixed on the planet's rock, the trail is a band warmer and
  brighter than the mat, the crate is at the waist, the resting arm hangs outside the torso —
  each закрыт as «хвост M118» in `20c-peep`.
- ~~Вертянка (M119)~~ — plant proportions from the planet's seed, hoops with a highlight and a
  crawling rivet, smoke as ragged clumps leaning with the wind — «хвост M119» in `12ta-tin`.
- ~~Хтотун (M120)~~ — eyes spread with light hide bridges between them (the middle one larger and
  higher), dust streaking down the hide with worn patches and old scars, the working arms broken
  at the elbow so the forearm stands clear of the silhouette — all in `grokFace` (`12tb-grok`).

Genuinely open were **the day palette** and **base free-strip polish** — both subsumed by the
author's own audit of 2026-08-27, the M232 queue above.

### The graphics & performance pass (G1–G12) — closed, moved to the archive 2026-08-26

Every line of it is closed (see the tails ledger below). The measurements, the faults seen in
each frame and the fix chosen for each are in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) —
grep it for `G1` … `G12`. The rules that came out of G0 live on in "Cross-cutting rules" above.

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter â expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---

# Tails ledger — every "Still open" swept on 2026-08-23 (0.100.3 → 0.100.8)

One line per tail, in one place, so nothing below has to be re-read to know what is left. "Closed"
names the version; "by design" means the tail is not a defect but a decision that belongs to the
author or to a later pass, and it is carried here on purpose rather than silently dropped.

## Closed

The swept tails of 2026-08-23 (0.100.3 → 0.100.8) are in
[`docs/PLAN-archive.md`](docs/PLAN-archive.md), under “the night orders M178–M186, and the closed
tails ledger”. Nothing there is outstanding.

## Open by design (not defects; each needs the author or a pass of its own)

- **The road companion** (author, 2026-08-23): phone mode where a real car trip flies your ship —
  GPS speed extrapolated to cosmic, accelerometer banks the hull, mic-driven equalizer, real
  distance → a capped in-game bonus synced through the site accounts. Captured in
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md); needs its own pass and the author's answers
  (reward resource, cap, in-game vs separate page).
- **Factions as a language of shapes**: closed (0.109.0) — `17d-house-shapes`: a mark per house on the station and the settlement wall, pennant in the house colour.
- **Base "like Fallout Shelter"**: it is one; what differs is a question for the author.
- **Yacht railing below 3×, fully flat-on view** (archive, ships): the fleet is drawn flat-on by
  design; the hull now has a top light and one asymmetric boom, the rest is the reference-sheet
  richness a rotation pass would give.
- **M124 spec remainder — CLOSED whole (author, 2026-08-27: «сейчас того что есть достаточно»).**
  Receiver with a knob — 0.110.0; "pause is the engine off" — closed by fact. The two held-back
  halves are now decided, not deferred: **the removal of the overlay HUD is superseded** by the
  author's own M187 (0.160.0, «приборы сверху, сейчас очень плохо не видно» — instruments must be
  visible and readable, the opposite of removing them); **the paper language stops at the desk** —
  A3 (0.144.0) made the table paper and things objects, the station screens stay glass by the
  author's call. Do not re-open either without him.
- **M125**: rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation — cosmetic; the rack is not persisted by rule.
- **M126**: the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table
  (the hundred owns per-person talk).
- **M127**: a pirate hit can now knock a socket; instruments as loot beyond that waits for the
  spec's "lost" pass.
- **M132**: edge generator and hand-built cores per region, surface layer masks — each region's
  own milestone (M135+).
- **M131**: barge passenger as a channel, settlement glyph overrides, per-region colouring — left
  open in the hundred's design.
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). So the real remaining work is four files, not seven.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: **closed by measurement (2026-08-24, 0.133.0).** The game now carries its own probe:
  `?g11` runs the mode tour and measures rAF fps in a visible tab (`28z-fps-probe`), `?g11=deep`
  noops draw passes one at a time with paired baselines. Clean run (single fresh-profile Chrome,
  `--force-device-scale-factor=2`, anti-throttling flags, dpr 2, warm cruise after 4 s settle):
  system 56, belt 60, surface(jungle) 55, dig 60, cave 60, landing 52, scoop 47–60 across runs.
  No mode is solidly <50, so the 20-life sprite bake is not justified — matching the earlier JS
  read. The scary first read (system 46, surface 44) was the **cold start while chunks bake**,
  not cruise. Deep pass: no single pass dominates (paired deltas ≤+2, only `drawBuilt` +8 ≈ 2 ms).
  Measurement discipline learned: leftover probe windows with anti-throttling flags keep rendering
  when occluded and sink every later run to ~22 fps flat — kill them before measuring.
- **M112**: nothing else — belt missiles and the hull mark closed it.
- **M135 "three lights"**: built (0.101.0). **M136-hours**: built (0.102.0). **M137-glow**: built (0.103.0). **M138-grove**: built (0.104.0). **M139-keepers**: built (0.105.0). **M140–M142**: built (0.106.0). **M143–M151**: built (0.107.0–0.108.0) — the thirteenth pass is closed. Next: the tails ledger (factions as a language of shapes; M124 remainder), then the split debt, then G11.

---

# QUEUE: the fourteenth pass, the thirteenth pass, biology, planet light, release look — CLOSED

All built and moved to [`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27 (0.186.0),
under the header “Moved out of PLAN.md on 2026-08-27” — grep it there for M152–M177, the
fourteenth pass, the kit/lodger/expedition, biology (M174), planet light (M175) or A2/A3.
Two things they left open **by design**, carried here so they are not lost:

- only the **surface** carries a mark of where the player dug; the station counter and the
  settlement do not, and M194 went around that rather than through it (see M194);
- the **drawn** landmark forms still number twelve for the whole galaxy: a species is described
  procedurally, but its shape comes from one of twelve brushes.


# QUEUE: the author's night orders, 2026-08-25 (M178–M186) — ALL DONE (0.147.0–0.162.1)

Written from the author's own crops; finished over 0.147.0–0.162.1 and moved to
[`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27. Grep it there for M178–M186. Five
things they left standing, and these are the graphics debt in its shortest form:

- ~~the **suit kit** is still a paperdoll on the ship screen~~ — **closed by M216 (0.198.0).**
  `27j-ui-kitlay`: one wide layout above the cargo on the ТРЮМ tab. A doll answers *how do I look*
  and a layout answers *what have I got*, and on a mannequin half the kit is invisible precisely
  because it is worn. One canvas rather than six cards — the kit is one thing taken apart, not six
  independent ones — and every piece is coloured by `kitColOf`, so model and wear-layer show through
  exactly as they do on the doll and on the walker;
- the **pirate base** (M180 pass 2) — **mostly closed (0.191.0).** Bodies: legs taper into boots and
  stand in a seeded stance, the belt follows the body, a yoke marks the shoulders — but the thing
  that actually read as "blocky" was that nothing on the figure was lit, so seven flat fills fell
  apart on a dark deck; one rim along the crown and shoulders stitches them into a body. Hangar: it
  was never empty (containers, trusses, gantry, wrecked shuttle, barrels were all there) — it was
  one temperature, 46–80 on all three channels, and what a hangar has that a warehouse does not is
  **paint**. Two things measured rather than argued: marking only along bulkheads yielded exactly one
  yellow pixel in frame, and the line has to run across the bay because the camera looks down it.
  ~~**Still open there:** warm work lamps with pools on the deck, and rust or colour on some
  crates~~ — **done (0.199.0).** The ceiling strip was visible and lit nothing; its pool now lies on
  the plate and takes the shape of the fixture (a square over the whole cell filled the camera's own
  foreground and read as a brown rug). Crates take a tint from the cell seed, with rust rarer than
  paint. The room has a temperature now instead of one grey. Stands `?s=raidfoe`, `?s=raidhangar`;
- ~~the **far ridge** on the surface is flat (M186)~~ — **closed by M211 (0.190.0).** It was not
  flat, it was *familiar*: both layers were the local ground profile amplified about its mean, so
  the eye recognised the curve and stopped measuring distance with it. Now ridged noise with
  octave-weighted detail and a separate seed per layer — peaks instead of waves. Two things the
  first count got wrong and the second measured: the frequency must be reckoned from the layer's
  on-screen step (a period of ~20 samples), and the field's mean must be subtracted or the whole
  range lifts by a third of its amplitude and covers the sky. Guarded in `91q-planet`;
- the **receiver console** sits over an open panel's title bar — put there deliberately by M151a,
  so it wants the author's eye rather than a silent change;
- **perf**: the night probe read system 43 / surface 39, the same as 0.144 — see the perf note in
  the archive before treating any of it as a regression.

# QUEUE: the 26.08 queue, M188–M206 — ALL BUILT (0.171.0–0.186.0)

The online postcard, the world alive, the places and the joys. Moved to
[`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27 under the header “the 26.08 queue,
M188–M206” — grep it there for any of them. What they left open, in the order I would take it:

- ~~**photographable modes** (M188)~~ — **closed by M208 (0.187.0).** `25ga-post-scenes`, suite
  `91zzzu-post-scenes`, stand `docs\shot.ps1 scenes`. Five painters — cave, mine, belt, orbit,
  gas-giant air — sharing one light kit passed in as an argument, each with an object of known
  size in it. The snapshot did not grow: `cx`/`cy` mean something different per place instead of
  a new pair of fields per mode, and terrain is now computed only where it is drawn. Four passes;
  what was wrong in the first three is written down in the module.
- ~~**a hundred blanks** (M189)~~ — **closed by M209 (0.188.0).** `25h-post-forms2`, seventy more,
  with two kinds that could not exist before M208 gave the camera the cave, the mine and the void.
  Two real bugs fell out of writing them: the default blank was chosen from `G.mode` (so a mine
  photograph was offered «С ДОРОГИ», and a *received* card had no live mode at all), and kind alone
  was too coarse a sieve — «В АТМОСФЕРЕ» under a shot taken from orbit. A blank now carries the
  letters of the places it suits.
- ~~**marks in the places themselves** (M171, M194)~~ — **closed by M210 (0.189.0).** `11ah-wall`,
  `wall`/`sign` on `a=trace`, suite `91zzzv-wall`. Built as the opposite of the cache: a cache
  disappears when it is taken, so M171's whole point reached a player once in many landings, while
  a wall **accumulates** — twelve hands is one reward, not twelve, and a stronger one. Nothing to
  take, nothing to leave, one mark per person per wall. The settlement gets a boundary stone rather
  than its retaining wall (measured: the terrace is a cut, not a fill — there is no face to carve,
  and M171 had already settled that a side-on world needs a vertical stone); the cave mouth needed
  no such thing. Twelve rather than twenty-four, because two dozen at world scale is scratch-noise.
- ~~**the winter frame** (M197)~~ — **closed (0.193.0).** It was saying the right thing in a
  whisper: the warm/cold split was mixed at .22/.16, so a surface moved toward its own light by a
  fifth and the room came out flat brown, and the cold reached only 2.6 body-widths from the window.
  Cold now carries more weight than warm (the room's general light is a lamp, and a lamp is warm, so
  the cold must be louder to register at all), and the window's light is additive — it was tinting
  the floor blue instead of lighting it.
- **the release board** below is the live list; these five are debts against it, not blockers.

## To the release

- **The newcomer's first hour** — **first pass done (0.185.0, M207).** The walkthrough is
  `docs/DESIGN-first-hour.md`, measured in the running game. Worst finding: the suit and the fuel
  are countdowns that kill and **neither was ever named** — the bars are drawn and silent. Fixed by
  `11ao-firsthour` (suite `91zzzs-first`): four lines in the ether, each once per save and tied to
  an occasion, said by people and never by the game. No arrows, no modals, no tutorial flag.

  **Second pass done (0.192.0, M212)** — the hour AFTER the opening, walked; findings and
  non-findings in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md). Three fixes: every
  overflowing list now shows that it continues (`27m-scroll-cue` — measured: the board is 1229 px in
  a 407 px window, the cantina 2086 in 408, and nothing said so); the hire screen stopped arguing
  with itself (`xp` was `Math.floor(r()*40)`, bound to nothing, so «неопытен · опыт 22» stood beside
  «ветеран · опыт 7» — it now follows the traits it is printed next to); and ФОТО stopped hanging
  over open screens, a one-day-old regression from M208 widening the camera to flight.

  **Still open:** the board's eight sections on a first dock — untouched, thinning it is the
  author's call; what changed is only that the player can now see there is more. The landing prompt
  offering «СКАНИРОВАТЬ ОРГАНИЗМ» beside twenty-two deposits was checked and is **not** a priority
  bug — `dep` is tested before `plant`; it only happens when no deposit is within reach and a plant
  is. The station's group row can fall out of step with its tab if future code sets `tab` without
  calling `syncTabs()` — not reachable today, but a trap for the first "jump to this tab" feature.
  The third hour was walked in M215 (0.197.0): the same contradiction came back through
  `stationMercs` (reputation stamped `xp` over the traits), and a newcomer paid for a hand before
  learning he needs a hull of his own. **Its back half was walked too and is healthy:** a trip closes
  in ~9 min of real time, the journal names every event as it happens, and the *"he loses money, is
  he broken?"* reading does not survive contact — the journal shows where the profit lives (a
  salvaged part, a trophy hull) while it happens. Caution for the next walker: `crewTick` runs on the
  **wall clock**, not `G.t`; stub `Date.now` and set `c.tMs` to the fake now, or the hand silently
  stops and it looks exactly like "crew events never reach the journal" (they do, all sixteen).
  **The fourth hour was walked too, 27.08.2026, and the screen is healthy:** two managers at their
  consoles with their domain boards («ЗВЕНО 0/0», «ПЛЕЧ 0/2 — маршрут не собран»), a portrait card
  with level, loyalty, cut and salary, and a header that answers the newcomer's fear outright —
  «оклады 134 кр/мин — из долей доменов, не из вашей кассы». What was broken was the STAND: `hqfull`
  called `mgrHire(mgrRoll(…))`, neither of which exists, wrapped in a `typeof` guard that swallowed
  it — so it had been rendering the empty HQ, the same picture as `?s=hq`. Two more of the same were
  found and fixed (`crewPool`/`crewHire` in `?s=hire`, `cockpitOn` in `?s=cockpit`); the lesson is
  in CLAUDE.md.
- ~~**v:5**~~ — **done without burning anyone (M227, 0.212.0).** The game writes `v:5` and reads
  4 and 5; not one save is lost, local or cloud. Investigating the feared gate found it was a
  ghost: `server.js:95`/`worker.js:66` do not exist — the cloud is `site/api.php` and it checks
  only that `v` is present. The `v:4` legacy branches stay alive under their number; future
  release-look changes to the SHAPE of persisted fields ride `s.v===5` branches. **The last of
  the overlay** — closed with the release look itself (author, 2026-08-27): see the M124 note
  above. What exists is the release look.
- ~~**A clean performance measurement**~~ — passing at 0.213.0 (27.08.2026, machine quiet, one
  window, dpr 2): **60 fps in all nine modes** with every change of the day in — the world scale,
  the UI zoom, the soil profile, the relays, the splits. Earlier same-day dips were the busy
  machine, proven by measuring the committed build. Re-run once more at the actual release as the
  release check.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

# QUEUE: after the outside playtest, 2026-08-26

An outside playtest arrived (`PLAYTEST-REPORT.md`, `PLAYTEST-01.md`; played on 0.160.0). Its
value is not the list — it is that someone who does not know the game looked at it. What follows
is what survived checking, what did not, and what is still open.

## Checked / closed early — moved to the archive 2026-08-27

Three reports checked and did not reproduce (do not "fix" them again: «ПРОДОЛЖИТЬ ПОЛЁТ» shows
only with a save; instruments stay at 0.86 in calm flight since 0.160.0; the background-tab world
catching up is the design working). The first-minute batch was closed in 0.163.0. Details:
grep `docs/PLAN-archive.md` for "did not reproduce".

## Open, in the order I would take them

1. ~~**The walker is 3 % of the frame.**~~ — **closed by M217 (0.202.0).** The complaint was
   measured twice and held: the walker is ~26 px drawn 1:1, i.e. 3.6% of a 720-high frame and 1.8%
   on a 1440p monitor — the better the screen, the harder to find yourself. The cause was the
   *ruler*: the surface camera went pixel-for-pixel, so a person's height was measured by the
   monitor rather than by the frame.

   **The route taken (the author's call, 27.08.2026): the scale goes into the transform, and the
   scale goes into the chunk key.** `withScale(k,fn)` (`18c-chunks`) scales the context and, for
   the duration of the world's drawing, sets `W`/`H` to *how much world is visible* (`W/k`, `H/k`).
   Nothing inside knows: every cull, `SURF_HOR`, the far ridge's "measured by the screen" rule and
   the camera's own arithmetic are all computed against the visible world and stay correct — the
   same trick `withCtx` has always used for tiles. The other two routes were rejected on their own
   terms: a smaller buffer blitted up costs the game's best screen its crispness, and multiplying
   every world→screen conversion by hand is the invasive version this note predicted.

   **The raster is baked denser instead of stretched.** `SCK` is how much denser than a CSS pixel
   a cached raster is baked; it multiplies `DPR` inside `mkCanvas`/`withCtx` and enters the key of
   every store, so a slice baked for another scale can never surface stretched. Density is capped
   (`RAST_MAX=3`): on a retina `DPR` already gives two, and baking four times over is memory by the
   gigabyte for a difference nobody can see. Measured cost: `?g11` reads 60 fps in every mode,
   errors empty.

   **The ruler itself:** `surfScale()` = `clamp(min(H/560, W/1000), 1, 2.4)` — the width half added by
   M222 after the phone was asked and answered that height alone is not a ruler. 560 is where the game already sat, so
   small windows change by nothing; 2.4 is the ceiling, past which the road to a target stops
   fitting in the frame and the world becomes a room. The walker now holds ~4.6% of frame height on
   any screen. The cave is scaled by the same ruler (`22-mode-cave`): it is the same man in the same
   world, and having him shrink on the way down would read as a change of game. Input divides by the
   same `G.viewK`, and both round trips are guarded in `91q-planet`.

   **The mine followed in M219** (0.204.0) — the reason for holding it back argued the other way
   once measured: a scaled cell is a bigger target, not a smaller one. **And the interface followed
   in M221** (0.206.0): it now has a ruler of its own off the same frame (`--ui`, applied with `zoom`
   so layout and finger targets move together), deliberately slower than the world, and the canvas
   half of it — target chips, hint band, compass chips, the zoom readout — is drawn in that measure
   too. The phone is left alone.
2. ~~**A full-screen panel with a screenful of nothing.**~~ — **closed by M223 (0.208.0), the
   decision made and applied.** Panels keep their full height — `.scr` carries the `91f-ui` overlap
   guard and every station tab overflows anyway — and a short screen gives its true content the
   height it actually has. The census: the only reachable short standalone screen was the HQ (the
   empty crew screen exists but its button is hidden until crew exists). The HQ room now takes the
   height the panel really offers instead of its old 270 px cap, leaving room for the rows below —
   and it re-measures on window resize, because the first render often happens against an unlaid or
   stale layout (in headless, against the 640×480 fallback the page starts from).

   **Measured 27.08.2026, and it narrows the choice a lot.** Every station tab already overflows
   its viewport — board 1229/452, yard 2094/407, cantina 2093/407, market 835, mods 990, instr 759,
   scrip 530, crew 441, barter 452, bases 452. Not one is short. So "panels shrink to content" would
   change **nothing** on the screen the player spends most of their time in, and the whole question
   is really about the handful of standalone panels (HQ and its kin). That makes "give the short
   screens something true to show" the narrower and cheaper job of the two — and the HQ already
   proved it works. Left for the author: this is a look-and-feel decision about every panel in the
   game, and `.scr` sizing also carries the `91f-ui` overlap guard.
   (Related, and already done: an overflowing list now *says* it continues — `27m-scroll-cue`,
   M212. That was the half of this complaint that was a plain defect rather than a decision.)
3. ~~**The mine is still the weakest screen**~~ — **largely closed by M214 (0.196.0).** It was not
   underbuilt but unlit and unbedded: one stratum fills the frame at shallow depth (where a player
   first arrives), so the rock came out a flat wash; and the massif had one brightness for the whole
   frame, so the screen had no centre. Partings inside a layer, following its own wave — laid AFTER
   `fillMaterial`, which ate them on the first attempt exactly as it once ate the cracks. Plus a
   falloff from the walker, per frame, measured at 0.4%% of a 0.92 ms frame. Stand `?s=dig`.
   **The two tails are closed by M219 (0.204.0).** The sky boundary was a RULER: a dead straight
   horizontal across the whole frame, sky above, rock below. It now ends where the ground begins —
   one curve (`digSurfY`), and both sides compute it with the same function, because if they ever
   disagree a seam runs the width of the frame. Under it a real profile: turf, loose subsoil with
   stones and roots, then a weathering crust that is BROKEN rather than merely tinted, dissolving
   into fresh rock. It comes from the world, not from taste — the top tone is the planet's own
   palette, the bottom the first geological layer, and on an airless world there is no turf at all,
   only regolith and gravel with not one root. What stands ON the line — tufts of grass, or gravel —
   is drawn in the frame after the sky, because the tile cannot: the sky is laid over the tiles and
   would paint it out.

   The abandoned chambers had their gradient running dark-at-top to darker-at-bottom, i.e. the FLOOR
   was the blackest thing in the cavity, which is exactly backwards and read as a paper cutout. Now
   the roof is nearly black, a back wall of the same rock three times darker stands behind, with its
   own grain, and the collapse pile is the lightest thing there — with slopes broken out of the hash
   instead of a scissor-cut triangle.

   **And the mine now scales like the rest of the world** (the tail M217 left open). The reason it
   was held back — tapping a cell — turned out to argue the other way: the cell gets BIGGER on
   screen, so it is easier to hit, and the conversion divides by the same `G.viewK`. Measuring it
   found a real defect underneath: the tap used `Math.round`, so a cell was owned by the half-cell
   band to its left — aiming at the middle of a drawn cell dug the one to the right and below.
   `Math.floor` now, and it is guarded.
4. ~~**Instruments nobody can read.**~~ — **closed by M213 (0.195.0).** The caption was six pixels
   at 45%% opacity (`6*FS`, `FS` from 1) — not a label, a texture; nine now, and it SHORTENS to a
   three-letter code when the cell is too narrow rather than shrinking further, measured per cell.
   The misclosure got a scale bar rather than a unit, because it has no unit — it is dimensionless;
   what it lacked was any way to see that zero is an end of a range and not a missing reading.
   Stand `?s=cockpit`.
5. **«Зачем лететь» lives inside the station** — **first move made (0.200.0).** The desk already
   remembered every station's prices and shortages and let you do nothing with them: the address sat
   there as two numbers to be memorised by eye. Tapping a price row now lays a course and opens the
   navigator — the same gesture the journal has always had for a job, and the only button it has ever
   had. Nothing appears over the world: no arrow, no marker, the game never asks you to go. The move
   is `gotoSector(sx,sy,what)`, lifted out of `questGoto`, so the next addressed thing on the desk
   gets it free. **And the rest of it done (0.201.0):** the ЦЕНЫ band names a real station live, in flight, and
   hearing it now writes a row on the paper — where yesterday's gesture plots the course. It stays
   hearsay and is guarded as such: only the good actually named plus fuel, marked «со слуха», no
   shortage (that is not broadcast), never overwriting a docked row, and never counted as the best
   price in bold. Once per station per day, and only at a legible signal.

   Original wording: The board (needs, tips, prices) is the game's
   motor and it only runs after landing, docking and switching a tab. **The fix must stay in the
   game's language:** the tester's own strongest praise was «ничто из этого не обращено к
   игроку — и поэтому работает». Quest markers and objective banners would buy the metric and
   sell the game. The receiver already broadcasts prices and rumours — make what it says
   actionable, and let the navigator act on what was overheard. This is also where the author's
   own idea belongs (below).

## The author's receivers — confirmed and built (M218, 0.203.0) — moved to the archive 2026-08-27

Masts as places on the dial, all three of the author's answers honest (nothing / cleaner ether / money at the manned ones), the ПРИЁМНИКИ desk tab with the scale itself, and the mast bodies with lit windows (M220). Payment moved from the jump to the visit; masts clamped inside the gravitational anchor. Grep docs/PLAN-archive.md for M218.

---

# QUEUE: the through-line — the arc of Восьмой (author's pitch, 2026-08-26)

The story lives in the saga, not here: [`docs/saga/ДУГА.md`](docs/saga/ДУГА.md) — the Lie, the
Truth, the single value, and how it lands on the eight parts of «Смена». The machinery it needs in
`src/` is [`docs/DESIGN-arc.md`](docs/DESIGN-arc.md). If the two ever disagree, the saga wins.

It runs *underneath* the world's story that `DESIGN-act2.md` tells: that act is about a common
undertaking and says outright the player is one of a thousand hands, not the hero. This one is
about the man. They do not compete — the expedition is the world, the fool is the person.

**The rule the arc stands on:** вселенная прощает, люди помнят. The world's offers never dry up,
whatever he did; the human doors close one at a time, quietly, and nobody shouts at him. Every
stake in the arc lives in the gap between those two ledgers.

**The economic law it makes:** the game never hands out credits, it hands out **access** — a
berth, a name to drop, a route nobody works, a bay in a garage, an introduction. Always attached
to a person, always with a real window that closes.

## First three — built; they turned the present sandbox into Act I

All three organs exist and are guarded (found stale in this list on 27.08.2026 and checked
against `src/` — the queue below is what actually remains):

- ~~**M189 — возможность.**~~ Built: `11ah-offer` — the offer as an entity with a face and a
  silent window, named offers three times richer than cold ones, folk memory as two booleans and
  never a number. Arrives through the counter and the ether, never marked, expires without
  comment. Guarded in `91zzzf-offer`.
- ~~**M190 — игрок как источник слухов.**~~ Built as «ляпнул лишнего» (M194, 0.169.0): what he
  says at a counter travels and comes back days later wearing someone else's face.
- ~~**M191 — тетрадь доброты.**~~ Built: `11ai-ledger` — write-only, never shown anywhere,
  `deedAdd` refuses a deed without a cost, and helping while broke weighs more. Writers already
  live in `11ag-trace` (cargo left at a mark) and `12l-barge` (souls off a dying hull).

## After those, in order

Act II (the first real loss, by his own hand, everyone kind about it) → the offers deepening
through the expedition → Act IV (doors closed, the world still offering, nobody left to vouch) →
the yacht last, because an ending cannot be built before the middle.

**The first move into Act II is made (M225, 0.210.0): the three squanders now all exist.**
«Ляпнул лишнего» was built as M194; `11aq-late` adds the other two. Staying at the counter is a
real choice that buys something real — a line that exists nowhere else, occasionally a *named*
offer («некоторые вещи говорят только поздно и только там») — and it costs real hours: `G.t`
jumps, and every window in the game (offers, shifts, needs, the sky's calendar) ages silently.
The wrong person costs an hour and ten and gives exactly nothing but the conversation itself,
and nobody is ever angry. Three sits per shift, then the counter empties — the only refusal the
place ever makes. Guards in `91zzzx-late`: the hours are real, the offer windows narrow, the
journal contains no reproach, and a save does not refill the counter.

**And the loss arrives by the human line (M226, 0.211.0).** When a named offer dies untaken the
door already closed silently; now, one visit later, the person who used to name you says one kind
line at the counter — ahead of the queue, ahead of story, once per door, ever — and never names
you again. The truth is not in the line; the world keeps offering cold. «Никто не сердится — вот
что тяжелее всего.» **And the offers deepen through the expedition (M229, 0.214.0):** for the
circular's sixty days the counter lives for the column («плечо в колонну», paying half again and
feeding the station's collection), naming runs at .70 instead of .45 — closed doors stay closed —
and the deepest access of the act is «имя в список», paying nothing and turning the departure's
greeting into «ЕСТЬ МЕСТО · ВАС НАЗЫВАЛИ». **Act IV is audible (M230, 0.215.0):** at three shut
doors the queue sometimes names somebody who is not you, and once per game one man says «Вы просто
не тянете» to your face — and the game confirms him with nothing, because he is wrong. **And the
yacht is built (M231, 0.216.0): the arc is complete end to end.** After a year of this life, with
a home to have a pier at and the invisible ledger full of what nobody counted, «Тихоня» stands at
your pier — key in the lock, no note, no price, no sale path, no word ever about why. The truth
is not spoken anywhere, and `91zzzf-offer` guards exactly that.

# QUEUE: Трепло in the round (M200) — DONE whole, moved to the archive 2026-08-27

The site's 3D bird: sources in bird/, built by bird.ps1 into site/treplo3d.html. Twenty-odd passes, sound (M228), down layer, page, behaviours, phone budget; per-feather AO closed by the author. The traps that cost time are in the archive - grep it for M200. Stand: docs/bird.html, /dev/treplo3d.html.
