<!-- docs/done/done-13.md — part 13 of 30 of the done work, in the order it was written; see README.md -->

## The author's receivers — confirmed and built (M218, 0.203.0)

Asked where the receiver should sit when a screen is open, the author answered with something
larger: «давай отдельную панель приемники и они дают доход или бонусы или нихуя не дают, просто
ты знаешь где они и можешь как в навигаторе проложить маршрут». My reading — *receivers become
places* — was **confirmed by the author on 27.08.2026** and built the same day (`11ap-relay`).

**Where they are.** Masts stand in the world by seed: beacons, buoys, relays, observation posts,
weather posts, winterings — never where a station already is, and denser the further out you go
(the settled middle gets by on wires; the edge has only the air). Nothing is stored but what the
player did: heard, and when they were last paid.

**How you find them — the dial, not a list.** Each mast has its own frequency, and it lies **in the
noise between the fixed bands**, where until now there was only «…шшш…». Turn the knob slowly and
you catch a far mast; turn it fast and you go straight past. Heard clearly once, it names itself
and its sector — and that is the whole write-down; there is no "record" button, exactly as with the
distant correspondents' call signs (`11an-qsl`).

**What they give — all three of the author's answers, honestly.** Nothing (a beacon burns, a buoy
blinks, a post counts what flies by — the use is that you know where they are); a clearer ether
(a relay lifts legibility in its own two sectors, so words stop dropping at the band edges and the
overheard exchange writes further from mid-scale — it transmits whether you know of it or not, and
the panel explains *why* reception is clean there); or money (the manned ones — weather post,
wintering — pay for the news you bring, once in three days, through `earn()` and in a person's own
words).

**The panel** is a desk tab, ПРИЁМНИКИ, and a tapped row lays a course — the same and only gesture
the journal has ever had. Above the list is the **scale itself**: the fixed bands as blocks, the
caught masts as ticks between them, the knob where it now stands. That was deliberate: a panel of
four rows would have been exactly the playtest's "screenful of nothing", and the truest thing this
screen can show is where to look for the next one.

Nothing appears over the world: no arrow, no marker, no "new objective". Guarded in
`91zzzw-relay`, including that last part.

**And it got a body the same day (M220, 0.205.0).** A place with nothing to see in it never becomes
a place — it stays a coordinate. The mast now stands on its own point in the system, on a fragment,
with a silhouette per kind: a lattice tower with a lamp, a buoy with fins, a dish on a frame, an
observation box with its tube, a weather hut, a wintering with crates. The manned ones are known at
a glance and not by a caption: **their window is lit.**

Two things that measuring found. **Payment moved from the jump to the visit** — while it landed on
arrival it was a tax on travel; news is brought to a person by hand, so you have to fly up to them.
And the first placement put masts at 900–2600 from the star, while the system's edge is computed
from the belt (`(belt.orbit||2400)*1.6`) and in a system with a tight belt sits closer than 2400:
the mast then stood *outside the gravitational anchor*, where the ship turns back and can never
reach it. It is clamped inside now.

# QUEUE: Трепло in the round — a separate 3D module (M200)

The author, 2026-08-26: the in-game parrot stays exactly as it is; the site's "take the bird
home" page gets a **separate module** with real 3D — shaders, pixels, no self-imposed limits,
"as beautiful as it can be". It is not part of the game and never talks to it: the only things
it borrows are the breed (cobalt back, cream breast, amber shoulder, swept crest with cold
beads) and the lighting rule (warm key above, cold fill from the left, rim behind).

**Where it lives.** Sources in `bird/`, built by `bird.ps1` into **one** self-contained file,
`site/treplo3d.html` — no server, no dependencies, not one external image, so the bird can be
downloaded as a single file and kept on a desktop. Same rules as the game's own build: modules
in filename order, one scope, 40 KB guard.

- `10-math` vectors/matrices/splines · `11-gl` WebGL2 wrappers · `15-geom` mesh box, tube,
  sphere, disc · `20-body` the breed: eleven spine stations, colour as a function of (t,a),
  the skin lofted 22 mm *under* the plumage · `21-parts` beak, cere, eyes, perch, zygodactyl
  feet, crest beads · `22-feather` one feather mesh, ~2000 instances laid out as a coat plus
  wing, tail and crest · `30-shade` GLSL · `40-pose` springs · `50-render` shadow → HDR →
  bloom → ACES · `60-app` camera, hands, error overlay.

**Built (first pass, 2026-08-26).** A parrot on a branch: hooked beak, ringed eye, folded wing
whose primaries converge behind the tail, layered tail, crest quills each carrying a glowing
bead, shadow-mapped warm key, HDR bloom on the beads, orbit camera, poke reaction.

**The traps that cost time, written down so they are not repeated:**
- *Sampler precision.* `sampler2DShadow` without an explicit `precision` is a compile error and
  the page goes black; the preamble in `11-gl` now declares it.
- *Frame transport.* A swept tube must carry its **X** axis along the path, not Y — carrying Y
  swaps the axes at the first bend and the beak came out a flat plate turned sideways.
- *One normal for skin and feathers.* They were computed twice, disagreed in sign on the crown,
  the skin turned inside out over the plumage and the head rendered bald. `bodyNormal` is now
  the single source, and "outward" is measured from a point pulled back along the spine —
  measuring it from the section axis is unstable exactly at the crown.
- *A feather is longer than its row spacing*, by about three times: a bird shows feather **tips**,
  not feathers. Equal length and spacing reads as a mosaic of paper chips.
- *The skin sits under the plumage*, 22 mm in. At the same surface the depth buffer fights itself
  and the coat comes through in torn patches.

**Still to do — audited 2026-08-27, and almost all of it was already done:** the page around the
bird exists (`61-ui`: install, «забрать файлом», the one hint line, offline service worker), the
behaviours are ported (`41-acts`), the down layer is in (`22-feather`, `downy`), the phone budget
is in (`60-app`: one quality set, DPR capped at two), and the soft light between feathers is
approximated by the wide nine-tap PCF (`30-shade`). **Sound was the one true gap and is built
(M228, 0.213.0):** `09-sound` — a two-voice siren through a bandpass «beak» with hard amplitude
modulation for the creaky throat, pitch/length/bend varied per cry; a chirp with the speech
bubble, a lower falling grumble when the crest is poked. Lazy AudioContext, first sound only
after a gesture, −33 dB quiet: a bird on a desk, not in an ear. Volume and character are the
author's ear from here. Per-feather AO — closed by the author (2026-08-27, «да хер с ним»):
the root-shadow approximation in the feather shader is the final answer. The module is done.

## M200a…M200j, M201 — the bird's twenty-odd passes and the extras shelf

Closed 2026-08-26 and moved to `docs/PLAN-archive.md` (grep it for `M200a`…`M200j`, `M201`).
The short of it: the breed sheet driven through twenty render-compare-fix passes; joints and the
game's habits on the rig; the art director's silhouette pass with its census of what exists and
what is missing; the ruler against a real macaw; the wing's own axes; the pole plugged and the
feathers multiplied by seven; the author's six notes; the iris off the photograph; the eye that
stopped being a sticker; and the front page's shelf of three — flat bird, bird in the round, the
road. What remains live for the bird is the M200 header above: AO between feathers, the down
layer, the page around the bird, behaviours, sound, a phone frame budget.

<!-- ── перенесено из PLAN.md 28.08.2026: закрытые вехи M232–M246 ─────────── -->
## M246 — the cave, and what measuring saved (2026-08-28) — CLOSED (0.242.0)

The far wall of the cave moves now (it was a screen-space layer glued to the glass) and the
darkness lets a little through. The numbers, though, barely moved: empty 86 → 85, contrast
0.15 → 0.13.

**That is the finding.** The cave's emptiness is not a lighting bug and cannot be lit away: the
galleries are wide, the camera sits far back, and most of the frame is rock no light will reach.
Three ways out, all design decisions for the author rather than something to guess at:

1. **Narrower galleries** — cut `CAVE_CS` or the carving radius so walls are always in frame.
2. **A closer camera** — the walker is 17 px in a 720 px frame; a tighter view makes the cave a
   place you are inside rather than a map you look at.
3. **Light that belongs to the cave** — glowing moss, crystal clusters, a lamp left by someone,
   so the frame has sources other than the one on your helmet.

Two more rules earned here:

- **Measure before rebuilding.** I had written in the audit that the plants are "one silhouette
  repeated eight times" and planned an L-system. The count says four to five species per planet,
  the commonest at 29% — the generator was already right, and the impression came from two large
  specimens near the camera in one screenshot. A day of work saved by one measurement.
- **A backdrop that does not move is not a backdrop.** Parallax is not decoration: without it the
  eye reads the whole scene as one flat plane, however well the layers are painted.

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

## Checked / closed early — moved to the archive 2026-08-27

Three reports checked and did not reproduce (do not "fix" them again: «ПРОДОЛЖИТЬ ПОЛЁТ» shows
only with a save; instruments stay at 0.86 in calm flight since 0.160.0; the background-tab world
catching up is the design working). The first-minute batch was closed in 0.163.0. Details:
grep `docs/PLAN-archive.md` for "did not reproduce".

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


# Moved out of PLAN.md on 2026-09-02 (0.295.0)

Closed work carried in the live plan until this date. Each block keeps its original text; the live
plan keeps one line per milestone and points here.


## The critique marathon and the closed milestones M247–M282 (moved 2026-09-02)
