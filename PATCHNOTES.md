# Drift — patch notes

The game version is shown on the title screen. It has nothing to do with the save format
(`v:4`): records written by earlier versions keep loading.

Entries from 0.45.0 onward are written in English (docs are English, the game stays Russian);
older entries below are left as they were written — translating history would cost more than it
could ever save.
---
## 0.222.0 — M232 stage 3: the raid speaks the base's language

The mannequin half of this stage was already closed by 0.221.0 — the raid draws the same
`drawAstronaut`. The environment half:

- **The cable channel is alive.** The wall band that stood for it was mute. Now it carries the
  home base's own signature: an amber power line along the trough — emissive, so the current
  is visible even in the torch-lit dark and a corridor reads as an inhabited house broken
  into, not a stage set; mounting clips near the eye; and on roughly every eighth wall a
  panel box with a steady amber lamp and a feed dropping from the line.
- **Sheet tone varies wall to wall** (law 4): one tone per room was paper even with seams.

The plinth, sheet seams, rivets, ceiling beams, lamps with floor pools and the hangar paint
were already in from G4/M180. The dark stays: corridors without lamps are the design — a
stranger's base explored by head-lamp.

Tests: 379 suites green.

Done before the raid stage because the raid draws the SAME figure large —
`drawAstronaut` is one body everywhere, so every fix lands on the surface, in the
cave, the mine, the base cut and the boarding at once.

- **Knees.** In the swing phase the leg bends — the knee moves forward and up; in stance it is
  nearly straight. Before, the mid-point rode a line and the legs were two sticks.
- **Boots as bodies**: wider than the shin, dark, with a toe cap toward the gaze and a light
  top edge (law 3) — not a third dash.
- **The pack is two tanks with a valve** and a strap, a highlight along the near cylinder; the
  antenna moved outboard and its light breathes instead of blinking (law 6).
- **The visor got its brow highlight** — one hard arc along the top of the glass; without it
  the glass read as a dot.
- **The warm side is structural** (audit: «тёплый бок от солнца — rim усилить структурно»):
  the sun-facing half of the torso and helmet takes a warm fill, the rim line stays as the
  edge. **At night the head-lamp lights the walker himself** — chest and near arm catch the
  reflected light instead of standing black under their own beam.
- **Body lean at a run**: the upper body pitches forward with walk amplitude.
- **Dust from underfoot on dry worlds** (vacuum, thin air, deserts): a puff per step, drifting
  back and dissolving; ephemeral, never persisted.

Tests: 379 suites green.

- **Pad.** The illegible green mass at the left is now the NOSE of a docked shuttle looking in
  from the side bay: hull sweep catching the lamp, glazing, a gear strut on the deck, and a
  breathing green marker light. The crane trolley now travels the beam back and forth — the
  old sawtooth teleported home at the end of each run and read as a glitch, not motion.
- **Battery.** The row of sharp shell heads read as a trap's teeth. The magazine now feeds a
  high-voltage assembly: five insulator stacks — overlapping ceramic discs on a rod with a
  ball top — under a common bus, one slot empty. Once in 8–12 seconds ONE quiet arc runs
  between two neighbouring balls (an event, not a blink). A storage flywheel turns slowly on
  its mount (law 6). The first draft had eight small stacks and they dissolved into a grid of
  dots — an insulator only reads when its discs overlap and the rod shows.
- **Law 2 sweep for the remaining rooms:** contact shadows under the pad's hydraulic
  cylinders, control pult and dispatcher; the battery's pult and assembly plate; the lab's
  bench legs, seated researcher and centrifuge bench neighbours.

Tests: 379 suites green.

- **Warehouse.** The floor was empty and the shelf crates all one height. A front row now:
  stacks of differing height, one under a tarpaulin with tie-downs, one still in its slings —
  not yet unpacked; and a tallyman with a slate whose hand makes a mark every few seconds.
- **Living quarters.** Helmets are OFF — `bWorker` grew a bare head (skin, hair, an eye toward
  the gaze), and the living room is the one place that uses it: the sleeper's head is skin on
  the pillow, the man at the table has a face. The desk lamp's cone now falls ON the table and
  the sitter (law 1: under a cone something must get brighter). Laundry sags on a line between
  the bunk post and the lockers, swaying faintly. The generic crowd is capped at one (`calm`)
  — the room stopped being a lift full of people facing a screen.
- **Smelter.** The shift DOES: a stoker at the hearth drives a poker into the fire on a slow
  cycle (rare sparks answer the thrust), a carrier walks half the room from the molds to the
  rack with a glowing ingot and returns empty. The flame's glow pulses slowly over the whole
  shop's walls. The slag-watcher statue is gone; the remaining crowd stands at the rack.
  Furnace, rack, slag tank and the floor stacks all got contact shadows (law 2).

The first four-in-a-row draft of the smelter shift was caught by its own frame and re-laid:
the carrier's path had degenerated to eight pixels because the molds already stand at the
rack. A walk must be half a room long or the walker is a statue with moving legs.

Tests: 379 suites green.

- **Reactor.** The vessel was a frame around a full-height light column — a prison grille. Now
  it is IRON: a rounded barrel with a domed top and hoops, and only a small bolted viewing
  hatch shows the core burning behind glass, rods in front of it. A relief valve on the dome
  exhales steam once in ten seconds (eased, not a blink); the console gained a needle gauge
  that trembles; the operator's forearm slides along the board; the tank casts its shadow on
  the wall and stands on the floor (law 2).
- **Solar.** The battery bays read as shower stalls with people inside — a bright charge fill
  behind an open niche. They are cabinets now: two shelves of cells with terminal jumpers and
  a narrow creeping charge strip per cabinet; the generic shift moved to the switchboard, and
  a technician with a probe wire to a terminal does a measurement at the far cabinet.
- **Drill.** The conveyor carried six identical beads; lumps now vary in size (a new size for
  every new lump) and hop on the rollers — the belt visibly RUNS. Portal shoes, control post
  and the solar switchboard got contact shadows.

Tests: 379 suites green.

The author handed a full cosmetic audit («КОСМЕТИКА ДО ПРЕДЕЛА», eight laws + a screen-by-screen
list); it is now the live queue in PLAN.md, and this is its first stage — the base frame.

- **The amber "network" lines are gone from the rooms.** They ran through every room at one
  height, over furniture and people — debug markup, not cable. The cable now lives like a real
  one: a channel UNDER the deck plating with mounting clips, a riser up each partition, and in
  the room only a panel box with a steady lamp. The tunnel run lies on its floor the same way.
- **Partitions are concrete, not a spreadsheet grid**: grey body, shaded far edge, a light
  chipped top edge with a cast flaw, bolted plates where they meet the slabs.
- **The ground got a soil profile** (the mine's language, M219): turf → subsoil with stones →
  broken weathering-crust fragments, all following the mountain's silhouette; roots only where
  the air is breathable, regolith and gravel where it is not. The top row of rooms now shows
  the scar of its cutting — crush and pale chips above the ceilings.
- **The base lives as an organism**: occasionally someone walks the tier from one room to
  another, through the doors, behind the partitions. Nobody is invented — it is the shift
  walking, and only where a shift exists.
- **The lift works**: the cage travels the shaft in a slow continuous cycle, ropes above it,
  the counterweight running opposite along the lining; the platform edge nearest the cage
  warms — a floor light without a blink. The smelter got its smoke: a pipe up the partition
  line to a surface cap, where the wind takes it. The pennant flag carries a travelling wave
  (everywhere pennDraw is used). Room light falls into the tunnel at its junction.

Law 6 held throughout: everything moves, nothing blinks. Tests: 379 suites green.

The last piece of the through-line, held back until the middle had been lived with. One day, late —
after a year of this life, with a home to have a pier at — you jump into your home sector and there
is a yacht at your pier. The key is in the lock. There is no note. That is all.

**What pays for it is the invisible ledger** — everything done for free and without witnesses,
weighted by how poor you were at the moment of the deed. The player is never told this. Not a line,
not a hint, not a «за что»: the truth of this game is not spoken, and if a phrase ever appears from
which it follows that the yacht was left for kindness, it is to be deleted together with its scene.

**The gift keeps the design's three rules by construction.** It has no price — none is shown
anywhere, because there is none. It cannot be sold — hulls in this game have no sale path at all,
and this is the one hull for which that is the way of the world rather than a limitation. And the
world does not congratulate: the journal line is flat — «У причала стоит яхта. В замке ключ.
Записки нет» — and the thing on the desk is a key with no name on it.

She is called «Тихоня», which is the name of the book's last part, and she is a true luxe — lacquer,
teak, brass and a name instead of a number, drawn by the same painter as every luxe hull.

With her the arc queue closes end to end: the offers and the ledger (M189–M191), the three
squanders (M194, M225), the kind word after the squandered name (M226), the expedition calling
people by name (M229), the silence and the one who says it (M230), and now the gift nobody
counted. The quiet second ending — the medical board and the pension — has been in since M161.

11843 assertions in 379 suites.
---
## 0.215.0 — the silence, and the one who says it (M230)

Act IV of the arc, finishing what the kind word began. Doors already close one at a time and the
world already keeps offering — what was missing was the two things that make the state *audible*,
both straight from the book.

**The silence.** «Не назван никем. Работы столько же.» When three doors and more are shut, the
counter queue sometimes names somebody — and it is not you: «— Петровича борт? Не Петровича.
Ладно, жду Петровича». You hear naming happen next to you. Not a number, not a reproach, not one
word about you — and none of it sounds while fewer than three doors are shut, because loneliness
has the right to exist only in its own part of the book.

**The one who says it.** The arc's rule: nobody reproaches him; exactly one character says it to
his face, and he is wrong. Once per game, in a cantina, when the world has gone quiet: «Вы просто
не тянете. Я таких видел» — pays and leaves. The game confirms him with nothing: no number moves,
no offer changes, no line follows. Whether he was right is something you can only learn by living
five more years.

The door count is stored nowhere and shown nowhere — it is counted off people's memory when
needed. Guarded in `91zzzx-late`: two doors are not yet silence, the quiet lines contain not one
word about you, the one line fires exactly once and survives the save, and the world offers
afterwards exactly as before.

11827 assertions in 378 suites.
---
## 0.214.0 — the expedition calls people by name (M229)

The act of the expedition (M154–M161) was built before the offers existed, and the two systems did
not know each other: for sixty days the whole world worked on one thing, and the counter kept
offering peacetime runs. Now the circular is heard at the counter too, in three ways.

**The column.** A new offer for the expedition's sixty days: «плечо в колонну» — cargo for her,
taken without a queue, paying half again over a plain run because everything is going to one place
and that place pays. Delivering it hands the station three units toward its collection over and
above the money, and writes a line in the record book in someone else's hand.

**They name you more often.** The world needs hands, and the ones they trust are called first: a
named offer's chance rises from .45 to .70 — for exactly sixty days. Closed doors stay closed: the
expedition opens nothing that a squandered name shut.

**The name in the list.** The deepest access of the act, and it pays not one credit: you are
entered into the expedition's list. A line in the record book — «внесён в список экспедиции · по
представлению» — and on the day of departure the core counter says the two words the whole book
turns on: **«ЕСТЬ МЕСТО · ВАС НАЗЫВАЛИ»** instead of «одно место, если кто хочет». The door is
open either way; the difference is whether you are named in it. Why they named you is never said.

11816 assertions in 376 suites, including: the column appears only during the expedition, the list
writes the book and flips the departure's words, delivery feeds the collection, and a shut door
stays shut even in the hot days.
---
## 0.213.0 — the bird has a voice (M228)

The 3D bird's "still to do" list was audited and almost all of it turned out already built — the
page around the bird, the ported behaviours, the down layer, the phone budget, the soft shadow
between feathers. The one true gap was **sound: the bird was mute.**

Now it cries like the animal it is. A parrot's voice is two-voiced — two carriers a minor third
apart, both gliding — pushed through a bandpass «beak» and torn by hard amplitude modulation,
which is the creaky throat. Pitch, length and the bend of the glide vary from cry to cry: the same
cry twice in a row sounds like a doorbell, not an animal. A chirp goes with the speech bubble; a
lower, falling grumble answers a poke at the crest — displeasure needs no translation.

Synthesized in place, not a sample: the file stays self-contained and downloadable. The
AudioContext is created lazily on the first gesture — until then the bubble works silently, as it
did. And it is deliberately quiet, −33 dB: a bird on a desk, not in an ear. Volume and character
are the author's to tune from here; the one refinement left on the module is true per-feather
ambient occlusion.
---
## 0.212.0 — v:5, and nobody's save burns (M227)

The save format bump the plan had been holding, done the way that costs nothing. The game now
**writes `v:5` and reads both 4 and 5**: every existing save — local or cloud — keeps loading, and
the one v:4 legacy branch (`modsOwned` reconstructed from `mods`) stays alive under its own number.
An unknown future version is refused whole rather than half-read. The localStorage key stays
`drift_save_v4`: it is an address, not a format, and renaming it would orphan every local save.

The investigation found the constraint that had guarded this for months was a ghost: the feared
`server.js:95` and `worker.js:66` **do not exist in this project**. The cloud is `site/api.php`,
and it checks only that a `v` field is present. The rule in CLAUDE.md now describes the real
architecture.

What v:5 buys: a versioned door. When the release look changes the shape of what is persisted,
those changes ride `s.v===5` branches while the v:4 paths keep reading old records — instead of a
single flag-day that eats everyone's progress.

The only exposure: a stale-cached client (old service worker) pulling a fresh v:5 cloud save will
refuse it until the page updates itself — a short window, and refusal is loud, not corrupting.

11805 assertions in 374 suites, including: v:5 round-trips, v:4 loads with its branch working,
v:9 is refused.
---
## 0.211.0 — the kind word after the squandered name (M226)

The door already closed silently: a named offer missed, and the person simply stops naming you —
`folkShut`, built with the offers themselves. What the book has and the game did not was the one
human beat that follows: **the next time you stand at that counter, the person who used to name
you says something kind — and never names you again.** «Никто не сердится — вот что тяжелее всего.»

One line per closed door, ever. It comes ahead of the queue and ahead of story lines — a person
matters more than a plot — and stands for the whole visit. It is kind, it never explains, and the
words «имя», «окно», «долг» do not appear in it: the truth of this game is not spoken. The world
keeps offering — cold offers come as they always did; it is only the naming that has ended.

Guarded in `91zzzx-late`: the journal holds not one word of reproach, the line is one of the kind
ones and none of the forbidden words are in it, it stands the visit, it never repeats, and the
next offer from that person arrives un-named.

11799 assertions in 373 suites.
---
## 0.210.0 — the late hour at the counter (M225)

The first move into the arc's Act II, and with it all three of the book's squanders exist in the
game. «Ляпнул лишнего» has been built since M194. This adds the other two.

**Забухал.** The counter is honestly the best place to learn things: some things are said only late
and only there. Staying is a button in the cantina, it never warns and never asks twice, and each
sit buys something real — a line that exists nowhere else, with a real address or a real price in
half of them, and occasionally a *named* offer leaned across the counter. The price is hours:
`G.t` actually jumps, and every window in the game — offers, shifts, needs, the sky's calendar —
ages silently. Nothing tells you. That is the whole point.

**Пристал не к тому.** Sometimes the person next to you is simply good to sit with and asks for
nothing. Nothing bad happens. An hour and ten is gone, the conversation was the best in a month,
and that is all you get. Nobody is angry — which is what makes it the book's squander and not a
game's penalty.

Three sits per shift, then the counter empties and the barman stacks the stools — the only refusal
this place will ever make. A save does not refill it.

Guarded by what the arc's rules demand rather than what the feature does: the hours are real, an
offer's window measurably narrows while you sit, the journal contains not one word of reproach,
and the truth is never spoken anywhere. 11785 assertions in 372 suites.
---
## 0.209.1 — the fourth payment (M224, tail)

`21ab-base-interiors` 42→26+18 KB. The eight compartments are one `const` table, and tables are
not cut — so the table is not cut: the second file continues it with `Object.assign`, and every
reader still sees one whole `BASE_ROOM`. Concatenation order becomes load-bearing (the second half
must follow the declared const), which the file's header says out loud. The base stand renders all
eight kinds, smelter fire to battery, unchanged.
---
## 0.209.0 — three split payments and the plan back under its guard (M224)

Maintenance, before it stops being maintenance. The 40 KB guard was shouting about twelve modules
on every build; three of them had clean seams and are paid: `28-loop` (47→25 KB — telemetry and
`hud()` moved to `27z-telemetry`, the frame loop keeps the frame), `27d-ui-cantina` (46→26 KB —
the barkeep, wall views, props, tables and counter moved to `27d-ui-cantina-props`; the hall and
its people stayed), and `12tb-settle-draw` (45→23 KB — the buildings, villagers and the settlement
body moved to `12tb-settle-draw2`; the palette and brushes stayed).

`PLAN.md` itself had grown to 83 KB against its 60 guard: the bird's eleven closed passes
(M200a–M200j, M201) and the M169 graphics campaign moved to `docs/PLAN-archive.md`, each leaving a
one-paragraph pointer.

What still shouts is inventoried in the plan's split-debt item with the reason each file is hard:
they are single 400–600-line functions — a redesign each, not a cut. Next clean seam: the eight
base compartments.

11773 assertions in 370 suites.
---
## 0.208.0 — the last screenful of nothing (M223)

The playtest's second complaint, decided and applied. The choice was between shrinking panels to
their content and giving short screens something true to show; measuring settled it back in August —
every station tab overflows its viewport anyway, so shrinking would change nothing — and the census
of standalone screens found exactly one reachable short one: the HQ. (The crew screen can be short
too, but its button does not exist until you have crew.)

The HQ already had its true thing — the drawn control room — and it was capped at 270 px while the
panel offered 580. **The room now takes the height the panel actually has**, leaving room for the
rows beneath; empty or manned, the panel is full of room instead of full of nothing.

One real bug under it: the first render after opening often measures an unlaid or stale layout —
in headless, the 640×480 fallback the page starts from — so the room re-measures itself a frame
later and again on every window resize. Resizing the window with the HQ open used to leave the room
at its old size; that is fixed by the same listener.

11775 assertions in 370 suites.
---
## 0.207.0 — the ruler has to see both sides of the frame (M222)

A defect of my own making, found by asking the phone instead of the monitor.

M217 measured the world by frame **height** alone. A phone has a monitor's height and a third of its
width: at 390×844 the ruler came out at 1.2, the world grew — and what a narrow screen has least of
is width. There was less than three hundred units of world across the frame: not a road any more,
a slot. The same mistake was in the interface's own ruler from M221, one day old.

A frame has two dimensions, so a ruler that reads one of them is not a ruler. **Both now grow by
whichever side is tighter.** The world's proportion — 1000 to 560 — is 16:9 on purpose: on an
ordinary monitor both sides say the same thing and nothing changes, while a narrow screen gets its
1 back and keeps every unit of width it had.

The guard for it lives in the phone suite, because that is the only place it shows —
`test.ps1 -Mobile`, which is only run if you ask for it. That is exactly why this slipped through
for four days.

11775 assertions in 370 suites on the desktop, 11866 on the phone.
---
## 0.206.0 — the instruments grew with the window too (M221)

M217 gave the world a ruler: on a big monitor it now *grows* instead of merely showing more. What
it did not touch was the interface — and after four days that contrast had become the loudest thing
on a 1080p screen. Measured on 1920×1080: the world is nearly twice its old size, while the
instruments, the pads, the rail, the console and every panel stayed at the pixel sizes they were
laid out with. The interface had turned into a thin frill around the edges of a huge frame.

**Now it has its own ruler, taken from the same frame.** `--ui` scales with window height —
`clamp(H/760, 1, 1.75)` — and it deliberately grows *slower* than the world: text doubled in size
stops being text and becomes a poster. A phone is left exactly as it was: its layout was measured
for a narrow screen and has nothing to gain here.

**It is `zoom`, not `transform: scale`,** and that is the whole reason it works: a transform
stretches the picture while leaving the layout and the hit-testing at the old coordinates — a button
would look big and still be pressed by its old, small rectangle. `zoom` changes the used lengths, so
the interface's own rule — *nothing you poke with a finger is under 44 px* — stays true at every
size, and the guard that measures it now measures real pixels.

**And the half of the interface that lives on canvas came along.** The target chips on the surface,
the hint band, the compass chips at the edge of the system view and the zoom readout are drawn in
the same UI measure now — leaving them in raw pixels would have split one interface in two, half of
it grown and half not. Their world coordinates are converted by dividing by that same measure, and
a chip's tap zone is handed back to the input layer in real pixels, which knows nothing of zoom.

Rasters baked inside panels — the desk's boards, the road canvases — are baked that much denser, so
the magnified interface does not come out soft.

11771 assertions in 369 suites, 60 fps in every mode, and the phone layout suite is still green.
---
## 0.205.0 — the mast has a body (M220)

Yesterday's receivers were a line on paper and a voice in the noise. Fly to the address they gave
you and there was **nothing there**. A place with nothing to see in it never becomes a place — it
stays a coordinate, and the paper starts to feel like a lie.

**Now the mast stands in the system.** Its own point, on a fragment of rock, with a silhouette per
kind: a lattice tower with a lamp that blinks, a buoy with fins, a dish on a frame, an observation
box with its tube out, a weather hut, a wintering with crates stacked by the door. The rule is the
one every assembled thing here follows — dark mass first, everything hung inside the outline, one
light last, and the edge that catches the star, because the star is in the middle of the system and
the light always comes from there.

**The inhabited ones you know at a glance, and not from a caption: their window is lit.**

**Payment moved from the jump to the visit.** While it landed on arrival it was a tax on travel;
news is brought to a person by hand, so now you fly up and hand it over — «ДЕЙСТВИЕ — ПРИВЕЗТИ
НОВОСТИ», once in three days, and the unmanned ones simply get listened to.

One defect found by measuring rather than by looking: masts were placed 900–2600 from the star,
while the system's edge is computed from the belt and in a system with a tight belt sits closer
than that. Such a mast stood **outside the gravitational anchor** — the ship turns back before it
and can never arrive. Now the distance is clamped inside the anchor.

11762 assertions in 368 suites.
---
## 0.204.0 — the mine gets a soil profile, and the workings get insides (M219)

Two tails the playtest left on the mine, and the third that M217 parked.

**The sky ended with a ruler.** A dead straight horizontal across the whole frame: sky above, rock
below, nothing between. No ground on this planet is built that way, and the eye knows it instantly.
Now the sky ends where the ground begins — along one gentle curve, computed by the same function on
both sides, because if they ever disagreed a seam would run the width of the frame. Under it there
is a real profile: turf, loose subsoil with stones and roots hanging down out of it, and below that
a weathering crust — the bedrock's own top, broken into pieces with dark gaps between them, going
over into fresh rock without a line anywhere.

**And it comes from the world, not from taste.** The top tone is the planet's own palette, the one
you see from orbit; the bottom is the first layer of its geology. On a world with no air there is
no turf at all — up top lies regolith, lighter than the stone, and not one root. What stands *on*
the line — clumps of grass, or gravel — is drawn in the frame rather than baked into the tile,
because the sky is laid over the tiles and would paint it out.

**The abandoned chambers were lit backwards.** Their gradient went dark at the roof to darker at the
floor, so the blackest thing in the cavity was the heap of rubble on the ground — and the whole
chamber read as a hole cut with scissors. In a real cavity the roof is darkest, a back wall stands
behind, and the floor is the brightest thing there. Now it is those three, with grain on the back
wall and a collapse pile whose slopes are broken out of the hash instead of drawn with a ruler.

**The mine also scales with the window now**, like the surface and the cave. It was held back for
one reason — tapping a cell — and measuring it argued the other way: a scaled cell is a *bigger*
target. Measuring it also turned up a defect that had been there all along: the tap used `Math.round`,
so each cell was owned by the half-cell band to its left, and aiming at the middle of a cell dug the
one to the right and below it. It uses `Math.floor` now, and that is guarded.

11754 assertions in 367 suites. 60 fps in every mode.
---
## 0.203.0 — the receivers became places (M218)

The author's own idea, from the day the question was only "where should the receiver sit when a
screen is open": «давай отдельную панель приемники и они дают доход или бонусы или нихуя не дают,
просто ты знаешь где они и можешь как в навигаторе проложить маршрут». Confirmed, and built.

**There are masts in the world now.** Beacons, buoys, relays, observation posts, weather posts,
winterings — standing by seed where no station is, and thicker the further out you go: the settled
middle gets by on wires, the edge has only the air.

**You find them with the knob, not with a list.** Every mast has its own frequency, and it lies **in
the noise between the fixed bands** — where the receiver has always said only «…шшш…». Turn slowly
and you catch a far mast; turn quickly and you go straight past it. Heard clearly once, it names
itself and its sector, and that is the entire act of writing it down: there is no "record" button
here, any more than there is one for a distant operator's call sign.

**What they give — all three answers, and each is true.** *Nothing*: a beacon burns, a buoy blinks,
a post counts what flies past; the use is that you know where they are. *A clearer ether*: a relay
lifts legibility in its own two sectors, so words stop dropping out at the edges of the bands — it
transmits whether or not you know it exists, and the panel is what explains why reception is good
here. *Money*: the manned ones — a weather post, a wintering — pay for the news you bring, once in
three days, in their own words and never much.

**And there is a panel: ПРИЁМНИКИ, on the desk.** A tapped row lays a course, the same and only
gesture the journal has ever had. Above the list is the scale itself — the fixed bands as blocks,
your caught masts as ticks in the gaps between them, the knob where it stands right now — because
four rows and half a sheet of nothing is exactly the complaint the playtest already made, and the
truest thing this page can show is where to look for the next one.

Nothing appears over the world. No arrow, no marker, nobody asks you to go. 11751 assertions in
366 suites.
---
## 0.202.0 — the world is measured by the frame, not by the monitor (M217)

An outside tester spent twenty seconds unable to find himself on the surface. Measured, and the
number was worse than the complaint: the walker is ~26 px drawn one-to-one — 3.6% of a 720-high
frame, 3.0% of the tester's 840, **1.8% on a 1440p monitor**. The better your screen, the smaller
the person on it. The bug was never in the drawing; it was in the ruler. A bigger window did not
show a bigger world, it showed *more* world, and everything alive in it shrank.

**Now the world scales with the frame.** The surface — and the cave, because it is the same man in
the same world and shrinking him on the way down would read as a change of game — is drawn through
one context scale, `clamp(H/560,1,2.4)`. The walker holds about 4.6% of frame height on any screen.
Small windows are untouched: 560 is where the game already sat.

**And it stays crisp**, which is the half that took the work. While the world is being drawn, `W`
and `H` become *how much world is visible*, so every cull, the horizon, the far ridge's
"measured by the screen" rule and the camera's own arithmetic keep working without knowing anything
happened — the trick tiles have used since 0.87. The cached raster is baked **denser** instead of
being stretched: the scale enters the key of every store, so nothing baked for another size can
surface blurred. Density is capped, because on a retina the pixel ratio already gives two and
baking four times over is memory by the gigabyte for a difference nobody can see.

The frame cost nothing: 60 fps in every mode, console empty. 11693 assertions in 362 suites,
including both round trips — a tap at the 300th pixel walks to the point drawn there, above ground
and below it.
---
## 0.201.0 — heard on the air, written on the paper (playtest #5, the rest of it)

0.200.0 let you lay a course from a price the desk remembered. But the desk only remembered stations
you had **docked at**, and meanwhile the ЦЕНЫ band on the receiver has always named a real station and
its best good, live, in flight — *«…Цициин: лёд берут по 22, топливо 7»*. Hearing it did nothing. You
could not write it down, could not plot it, could not use it. The motor still only started inside a
station.

**Now the ether writes on the paper.** Tune the band, hear a station named, and it appears on the
ЦЕНЫ tab — where the gesture added yesterday will plot a course to it. Nothing over the world, no
prompt, no "new objective": a broadcast was heard and a note was made, which is what a person with a
radio and a notebook does.

**And it does not pretend to be more than hearsay.** Three rules, each guarded:

- It records only **what was actually said** — one good and the fuel price, not a whole price list.
  Overheard is not the same as seen.
- The row is marked **«со слуха»** on the paper, and it carries no shortage, because shortages are not
  broadcast on that band and inventing one would be a lie.
- **Seen beats heard, always.** Docking rewrites the row in full and a later broadcast never
  overwrites it. Nor does an overheard figure ever count as the *best price* in bold — one number
  from the air must not outrank a price list you read on the spot.

Written once per station per day (the dial can sit on the band indefinitely; the exchange has one
piece of news), and only at a legible signal — at the edge of the band the words drop out anyway, and
writing down noise would be its own kind of lie. 11673 assertions in 360 suites.
---
## 0.200.0 — a course can be laid from the paper (playtest #5)

From the outside playtest, item 5: *"«зачем лететь» lives inside the station. The board — needs,
tips, prices — is the game's motor, and it only runs after landing, docking and switching a tab."*
With the tester's own warning attached, which is the hard part: his strongest praise for the game was
*«ничто из этого не обращено к игроку — и поэтому работает»*, so quest markers and objective banners
would buy the metric and sell the game.

**The paper already knew where.** The desk remembers the prices and shortages of every station you
have docked at — the ЦЕНЫ tab, best price per good in bold, a shortage called out in amber. And there
was nothing you could do with any of it: the address sat there as two numbers, to be memorised by eye
and typed into the navigator by hand. The motor was running and not connected to the wheels.

**So the paper gets the gesture the journal already had.** Tapping a price row lays a course to that
sector and opens the navigator — exactly what `questGoto` has done since M-whenever for a job, and
deliberately the *only* button the journal has ever had: *"take me where this needs doing"*. Nothing
appears over the world: no arrow, no marker, no banner, and the game never asks you to go. There is a
piece of paper with an address on it, and a navigator that will plot it. That is the whole feature.

The move is now `gotoSector(sx,sy,what)` — lifted out of `questGoto`, which turned out to be the case
it mattered to least — so the next thing on the desk that has an address gets it for free. Guarded in
`91zzv-table`, including the half that matters most: the course starts no job and puts no line over
the world. 11663 assertions in 359 suites.
---
## 0.199.0 — the hangar gets its temperature (M180 pass 2, tail)

0.191.0 closed most of M180's second pass and wrote down what it left: *"warm work lamps with pools
on the deck, and rust or colour on some of the crates, would finish what the markings start."* Both
done.

**The lamp was visible and lit nothing.** A ceiling strip was drawn in every corridor, reactor bay
and hangar, but the deck beneath it stayed exactly the tone of the corner behind the containers. A
light that lands nowhere is a film over the frame, not a light — the same finding the mine's helmet
lamp produced two versions ago. The pool now lies on the plate, on the warm end of the scale, and it
takes the **shape of the fixture**: a narrow strip overhead means a strip underfoot. The first count
laid a square over the whole cell, which at the camera's own cell filled the entire foreground and
read as a brown rug rather than as light.

**And the containers are no longer all the same iron.** They sat at 56–80 on every channel, like
everything else in the room, so they added volume but no colour and the floor paint stayed the only
saturated thing in the hall. Crates on a real base are painted, and not in the colour of the
bulkhead. The tint comes from the cell's own seed, so one stack does not match its neighbour, and
rust turns up rarer than paint — rust is a mark, not a fill.

Between the markings, the pools and the crates, the room finally has a temperature instead of one
grey. 11656 assertions in 358 suites.
---
## 0.198.0 — the kit laid out on the desk (M216, M179's tail)

M179 put the hold on the table as **piles** — the author's ask after showing the inventory from The
Forest: everything you carry laid out as objects, so one glance tells you what you have too much of,
too little of, and none of. It wrote itself one line of debt: *"the suit kit as objects on the same
desk (it lives in the ship screen's paperdoll today)."*

**A doll and a layout answer different questions.** A doll answers *how do I look*; things laid out
answer *what have I got* — and the second is the inventory question. A mannequin is a poor way to
answer it, because on a mannequin the boots are under the torso, the pack is behind the back and the
gloves merge into the sleeves: half the kit is invisible precisely *because* it is worn. On the desk
all six lie side by side and whole.

**One canvas, not six cards.** The hold gives a card per resource because resources are independent —
three kinds today, eight tomorrow. The kit is always the same six places, and it is **one** thing
taken apart. Six cards would read as six unrelated objects; one layout reads as one person's gear
laid out before going out.

Nothing about it is new invention: the colour of every piece comes from `kitColOf` — the same one
that paints the doll and the walker on the ground — so model and wear-layer show through, class makes
a piece larger and adds it a detail, and wear draws as scuffs or as patches rather than as a number.
It sits above the cargo, because what is on you is not what you are carrying; and it stays there when
the hold is empty, because you are still wearing a suit.

Two passes. The first drew shadows wider than the objects casting them, so six grey ovals read as
things floating above their own blots; and the layout was squeezed into the narrow per-resource card
column. `27j-ui-kitlay`, one `.thing.wide` rule, guards updated in `91zzv-table` to state the new
rule rather than the old count. 11656 assertions in 358 suites, 11746 on the phone.
---
## 0.197.0 — the third hour, walked (M215)

M212's walkthrough left *"the third hour — first run given to a hired hand, the wait, and what comes
back — has not been walked."* Walked. Both findings are the same family as the second hour's: **the
game contradicting itself, or staying silent, at the exact moment money changes hands.** Written up
in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md), which now covers both hours.

**The contradiction M212 fixed came straight back, through the side door.** M212 made a candidate's
experience follow the traits printed beside it and guarded `genMerc` over 900 seeds — but the station
does not show what `genMerc` returns. `stationMercs` post-processes the list by reputation with
`xp = Math.max(xp, 65)`, taking no account of who the person is. So on any station where the player
is known, a candidate tagged *«необстрелянный — дёшев и НЕОПЫТЕН»* was stamped **опыт 65**, or 100
further up: the same two adjacent lines arguing, only now switched on by reputation. The M212 guard
could not see it — it tested the generator, and the bug lives one call downstream.

That bump's own intent is *who came*, not *who they suddenly are*: where you are known, a man with a
record is at the table. It now lifts only candidates who could plausibly have one, and leaves a green
hand alone — green is green everywhere; likewise a veteran's service does not shrink because your
name is bad here. Guarded through the whole path this time, at both ends of the scale: reverting the
fix makes the new test fail with *«зелёный остался зелёным (100)»*.

**And you pay for a person before learning he cannot work.** The first hire costs a newcomer about a
third of everything they own, and only afterwards does the crew row say *«корабль: не выдан ·
свободных корпусов нет — купите или пересядьте»*. A hired hand needs a **hull of his own**, and
nothing on the hire screen said so — not the header, not the speciality, not the candidate's row. The
money is spent and there is nothing to undo it with. The crew header carries it now, and only while
it is true; for a player who already has a spare hull it would be noise.

**Still open there:** with no second hull there is no order to give and nothing to wait for, so the
back half of that hour — the order, the wait, the return — needs a save with two ships. That is where
`CREW_YIELD` first meets the player, and the likeliest place for a *"he loses money, is he broken?"*
reading. 11656 assertions in 358 suites.
---
## 0.196.0 — the mine stops being the weakest screen (M55 #1, M214)

The oldest item on the visual queue, and the one the outside playtester picked out unprompted:
*"the mine is still the weakest screen — pale, monotone, rock and dug space indistinguishable. It
comes right after the surface, which is the game's best screen, and the contrast does the damage."*

**It was not underbuilt — it was unlit and unbedded.** The rock painter already had strata with
contacts, mineral veins, a crack-and-block system, dykes and planet material. Two things were
missing, and both are the same two that fixed the postcard's mine earlier this week.

*Bedding inside a stratum.* Layers give bands of colour — but only where several are in frame. At
shallow depth, which is exactly where a player arrives the **first** time, one layer fills the whole
screen and the rock comes out as a single flat wash. Sediment is never one tone: it is laid down in
partings, each a little lighter or darker than its neighbour. They follow the layer's own wave, not
the screen's horizontal — along it, or it is striped wallpaper rather than stone.

That pass has to go **after** `fillMaterial`, and the first attempt did not: the material ate the
partings exactly as it once ate the cracks. The same lesson, twice, in the same file — now written
at the top of the function so it is the third time only for someone who does not read.

*Light that falls off.* The massif had one brightness for the whole frame: depth darkens evenly, but
the rock knew nothing of distance from the lamp. So the mine had **no centre** — stone at the edge of
the screen burned as bright as stone underfoot, and the whole frame read flat however much drawing
was in it. Underground you see exactly as far as the light reaches. It also reconciles the workings
with the massif: far away they darken together, and the black gallery stops being a hole in paper.
Computed per frame rather than baked, since the tile is fixed to the world and the walker is not —
measured at 0.4% of a 0.92 ms frame, which is to say free.

New stand `pageshot view -Q "?s=dig"`. **Still open there:** the boundary with the sky is a hard
horizontal cut with no soil profile above it, and the insides of the workings are still flat.
11640 assertions in 357 suites.
---
## 0.195.0 — instruments you can actually read (M213)

From the outside playtest list, item 4: *"the five-needle region pod carries no labels and its number
(«0.000») has no unit; the belt cockpit's dial captions are too small to read at all. Either they say
what they are, or they are not instruments."*

**The caption was six pixels.** `Math.round(6*FS)` with `FS` starting at 1 — six pixels, at 45%
opacity, on the narrowest window. A caption you cannot make out is not a label, it is a texture. Nine
pixels as a floor now, and a denser tone. The rule that hierarchy comes from size and colour cuts
both ways: what must be read has to be *large enough*, not merely not too large.

**And it shortens rather than shrinks.** «МАСС-ДЕТЕКТОР» is 64 px at that size and a panel cell can
be forty. Shrinking the type until it fits is exactly the fault we started from; a real instrument
panel puts a three-letter code there instead, and a code reads at any distance. The full name is
drawn when it fits the cell, the code when it does not — measured per cell, not guessed.

**«НЕВЯЗКА 0.000» got a scale instead of a unit,** because it does not have one: the misclosure is
dimensionless, a fraction of the region's span (`06b-region`). There is nothing honest to write after
it. What it lacked was any way to tell that zero is one *end of a range* rather than a missing
reading — so there is a bar under the digits now, with ticks at nought, half and full. An instrument
is entitled to a scale; words have no business here, since the region announces nothing about itself
by design.

New stand `pageshot view -Q "?s=cockpit"` — the ceiling panel is a different instrument from the
survey rack, and only the rack had a stand. 11640 assertions in 357 suites.
---
## 0.194.0 — two files split before they became a problem (upkeep)

Housekeeping, taken while the reason was still fresh rather than left for whoever meets it next.

`25ga-post-scenes` reached **52 KB in one night** — the largest module in the project and past the
40 KB line, which is the size at which a file stops being readable in one go. Split along the seam
that was already in the design: `25g-post-under` (cave, mine — lit from inside, depth inverted) and
`25g-post-void` (belt, orbit, gas-giant air — one hard light, no depth to borrow, only size).

The names matter and the header says why: `Sort-Object Name` does not see the hyphen, so a
`25ga-…` sorts *before* `25g-postcard` (it compares `25gapostscenes` against `25gpostcard`, and `a`
precedes `p`). Extending the stem rather than the letter gives card → under → void, which is also
the order they should be read in. That trap cost a build in M209 and is written into `CLAUDE.md`.

`24aa-raid-draw` had grown to 51 KB; `drawFoeBody` moved out to `24ab-raid-foe`. It was the only
clean seam in the file — a compartment and the person standing in it are different things — and
everything else there is closed over `proj`, `quad` and `polys` inside `drawRaid`, so cutting it
would mean hauling half the projection into the open. 44 KB and 9 KB now.

No behaviour changed: 11640 assertions in 357 suites, and both stands redrawn to confirm it.
---
## 0.193.0 — the wintering says it louder (M197)

M197 built the month alone in one room and wrote down what it left: *"at street scale the wintering
reads, but weakly. The frame could say it louder."*

**It was already saying the right thing — in a whisper.** The room has three lights the player
switches on themselves, and a `winTone` that splits the space: warm from the stove on the left, cold
from the window on the right. That split is the whole feeling of a wintering. But it was mixed in at
`0.22` and `0.16` — even at full tone a surface moved toward its own light by about a fifth, and the
whole room came out one flat brown. The cold reached only 2.6 body-widths from the window, so most
of the room never heard it at all.

Cold now carries **more** weight than warm (`0.42` against `0.40`, and `0.40` against `0.36` on the
wall), and that is not taste: the room's general light comes from a lamp, and a lamp is warm, so the
cold has to be louder merely to register. Its reach went to 3.6 body-widths, warm to 3.0, so the
middle of the room is contested instead of neutral.

**And the window's light was tinting the floor, not lighting it.** A flat `0.13` fill of cold over
the boards darkens them blue; light does the opposite. It is additive now, twice as strong, and it
no longer stops at the sill — a soft cold wash falls on the wall around the window too. It is the
only cold thing in a warm room, and it is what tells you there is night and frost on the other side
of the glass. Without it the window is a picture, not a window.

Stand `pageshot view -Q "?s=winter"`. 11640 assertions in 357 suites.
---
## 0.192.0 — the hour after the opening, walked (M212)

M207 walked a fresh save and left one item written down: *"the hour AFTER the opening — first
station screen in full, first hire, first manager — has not been walked yet."* This is that walk.
It is in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md), measured in the running game
rather than remembered. Three findings, all fixed.

**Every long screen ended in a lie.** The board on a first dock renders eight sections — measured
live, **1229 px of content in a 407 px window**. The cantina is **2086 in 408**, five screens. Nothing
said so: the last visible row ended flush with the panel edge, exactly as a final row would, so two
thirds of the board and four fifths of the cantina did not exist for a player who did not think to
drag. This is not the question of whether eight sections is too many — that is the author's call and
nothing was removed — it is a missing affordance. The bottom of any overflowing list now fades out,
and the fade goes the moment you reach the end: no arrow, no "more below", no scrollbar, the same
haze this game measures distance with everywhere else. It is a mask rather than an overlay, because
an overlay is another element to position, it catches taps, and it does not know about the panel's
rounded corners. Applies to every screen — a list running past the fold was never only the board's
problem.

**The hire screen argued with itself.** Two candidates, read top to bottom: *«необстрелянный — дёшев
и НЕОПЫТЕН · опыт 22»* and, right below, *«ВЕТЕРАН — дороже, но выходит живым · опыт 7»*. `genMerc`
set `xp: Math.floor(r()*40)`, a number bound to nothing, while the traits printed beside it came
from a separate roll. A player who catches that stops trusting both lines — on the first screen
where they are asked to spend a third of everything they own on a stranger. Experience now follows
the traits it is printed next to: green 0–6, veteran 46–89, everyone else 8–37. The spread stays,
its sign no longer argues with the caption. Guarded in `91b-crew` across 900 seeds.

**And a one-day-old regression of my own.** M208 made flight photographable; the console stays over
an open screen deliberately (M151a); so from yesterday the ФОТО button hung over the HQ, the market
and the shipyard, offering to photograph a world the player is not looking at. `postCanShoot` now
refuses while a screen is open — the console rule stands, the shutter is not part of it.

Three things were checked and are **not** defects, written down so a later pass does not "fix" them:
the empty HQ (which says what a manager is *and that you do not need one yet* — the best-written
empty state in the game), the unaffordable candidate whose button dims rather than hides, and a
manager's 70 кр/мин being out of reach in the second hour.

`27m-scroll-cue`, suites `91b-crew` and `91zzzu-post-scenes`. 11642 assertions in 357 suites; 11732
on the phone.
---
## 0.191.0 — the pirate base, pass 2: bodies and floor paint (M180)

M180's first pass fixed the projection, the horizon and the bulkheads, and wrote down what it left:
*"the enemy bodies themselves are blocky, and the hangar wants dressing"*.

**The bodies were blocky in three specific places.** Legs were two identical rectangles from hip to
floor with a plate for a sole — which reads as a *post*, split down the middle, not a person. Three
things separate a leg from a bar: it **tapers** toward the ankle, it ends in a **boot** (wider than
the shin and darker), and two legs do not stand parallel. The stance now comes from the seed, so
they are not all planted the same way. The belt was a rectangle spanning the full torso width and
stuck out past its edges, reading as a shelf; it now follows the body and carries a buckle. And a
dark yoke across the shoulders, because shoulders are the first thing the eye reads a figure by.

**But the real problem was that nothing on the figure was lit.** It was seven flat fills and not one
highlight, so on a dark deck it fell apart into patches — which is what "blocky" actually describes.
The compartment's light comes from the ceiling, so the top edges catch it: crown of the helmet, line
of the shoulders. One outline stitches seven pieces into one body — the same rule the parrot and the
buildings are drawn by.

**The hangar was never empty — it was one temperature.** Containers, trusses, a gantry, a wrecked
shuttle and barrels were all already there, and it still read as a grey hall, because every piece of
iron in it sits between 46 and 80 on all three channels. A real hangar has exactly one saturated
thing in it and that is **paint**. Floor markings are not decoration: they are what distinguishes a
hangar from a warehouse, and the only warm colour in a room where everything else is steel.

Two things had to be measured rather than argued. Marking only along the bulkheads produced exactly
**one yellow pixel** in the whole frame — the hangar cells in view are interior ones with no wall,
and the cells that have one stand far enough away that the distance falloff has eaten the colour. And
the line has to run *across* the bay even though ships taxi *along* it: the camera looks down that
same axis, so a lengthwise line foreshortens to a couple of dashes at the frame edges. Floors are
marked both ways in life; this projection can only show one of them.

Stands `pageshot view -Q "?s=raidfoe"` and `"?s=raidhangar"` (the first stands you nose-to-nose with
the nearest pirate — the existing `?s=raid` deliberately finds the room with the *most* visible
enemies, which means it shows them at a distance and cannot judge a figure). 10732 assertions in 355
suites.

**Still open:** the room is still one temperature away from the paint — warm work lamps with pools
on the deck, and rust or colour on some of the crates, would finish what the markings start.
---
## 0.190.0 — the far ridge becomes a range (M211)

M186's walkthrough left one line standing: *"still open: the flat far ridge"*. It has been behind
every outdoor frame in the game since, which makes it the highest-frequency piece of debt on the
list.

**It was not flat — it was familiar.** Both distant layers took the profile of the ground under
your feet and multiplied it about its mean by 2.3 and 1.6. A ridge built that way is self-similar
to the earth you are standing on: the same curve, only louder. The eye recognises that instantly
and stops measuring distance with it, which reads exactly like flatness.

**A mountain is built differently from a hill, and the difference is one line.** Ordinary noise
gives rounded crests; *ridged* noise — `1−|2n−1|` — gives sharp summits and broad soft valleys.
That is what a range is: peaks, not waves. Each octave is weighted by the one above it, so small
teeth sit **on** the flanks of large peaks instead of sprinkling evenly along the whole length. The
two layers get different seeds, because two ranges echoing each other through parallax is the most
visible lie available — the eye catches repetition before it catches anything else.

**Two things the first count got wrong, both measured rather than eyeballed.** The frequency was
taken by feel (`.0016`) and worked out to one hump per thirteen thousand world units — a ridge
*straighter* than the one it replaced. It has to be reckoned from the screen: the layer is drawn at
`step*3.6`, about twenty-two pixels per sample, so three or four summits in frame means a period of
roughly twenty samples. And the field's mean has to be subtracted: ridged noise averages about a
third of its range, so an unshifted field lifts the whole range by a third of its amplitude — peaks
leave the top of the frame and the valleys cover the sky as a solid wall. That is precisely what
the first attempt drew.

Cost is unchanged: the profile is baked into the parallax tiles once per planet, and the frame
still only does `drawImage`. Guarded in `91q-planet` by the properties that actually matter — the
range does not correlate with the local ground or with the other layer, there are at least two
summits across a screen width, its median sits below mid-range (valleys outnumber peaks: a ridge,
not a wave), and its mean height matches the ground's. 10730 assertions in 355 suites.
---
## 0.189.0 — the stone that remembers: marks in the places themselves (M210)

M171 put the first thing left by a *living* player into the game — a mark cut beside your ship with
cargo at its foot — and wrote itself a debt: "only the surface carries a mark; the settlement wall
and the cave mouth would each take one". The debt stood since 0.137.0, and M194 walked around it by
turning the player into a source of rumours instead. This is it, and it is deliberately not built
like the cache.

**A cache disappears; a wall accumulates.** The mark by your ship is visible exactly until someone
picks it up — which is to say almost never: it has either not been left yet or has already been
carried off. So M171's whole point, *someone alive was here*, reached a player once in many
landings. On a wall the marks pile up. Twelve strangers' hands on one stone is not twelve rewards,
it is **one**, and it is stronger than any cache: a place where people stood before you.

**Nothing to take and nothing to leave.** No cargo, no price, no count. A cache without a price
would degenerate into a noticeboard — M171 checked that already — and a wall cannot degenerate into
anything, because there is nothing on it to get. One mark per wall per person: a wall of your own
signatures is vanity, not a record of people.

**Two passes on the surface, and the second one changed the object.** The marks first went on the
settlement's retaining wall — and missed twice. Measuring a real settlement's profile: on the left
the terrace is *cut into* the slope (ground 27–35 px above its edge), on the right the fill is 2–14
px. There is no face to carve, and the marks hung on the grass. The deeper miss was one M171 had
already solved: this world is seen from the side, and a cut in an earth bank does not exist in that
projection. So the settlement gets a **boundary stone** at its edge, in the same visual language as
the trace slab — set by hand, top chipped, sides not parallel. The cave mouth needed none of this:
rock already stands as a wall there.

**Twelve, not twenty-four.** The first count held two dozen and they turned to scratch-noise: a
person in this world is 26 px tall, the stone's face is half that, and a mark came out three pixels
across. Twelve *legible* hands say "people stood here" better than twenty-four illegible ones — and
the number in the prompt stays honest, because the stone holds exactly what it says.

Down the wire: the mark index and the six-character hand, nothing else. Back: the same plus "this
one is yours". `11ah-wall`, `wall`/`sign` on `a=trace` in `api.php`, suite `91zzzv-wall`, stands
`pageshot view -Q "?s=wallset"` and `"?s=wallcave"` (with a self-aiming loupe — marks are
world-scale and a full-screen shot cannot judge them). 10724 assertions in 354 suites.
---
## 0.188.0 — the hundred blanks, and a card that knows where it was taken (M209)

M189 laid down thirty printed blanks and wrote "a hundred over later passes" into the plan. Here
are the other seventy, in `25h-post-forms2` — and two kinds that could not have existed before
yesterday.

**Two new kinds, because the camera reached two new kinds of place.** «подземная» and «из
пустоты» were missing not from neglect but because until M208 there was no way to photograph a
working face or a belt, so a blank for one had nothing to sit behind. Their voice is their own: the
underground forms carry no weather and no hour (there is neither, down there), and the vacuum ones
are deliberately flat — a person who lives in emptiness writes about it as routine, and that
plainness is the tell.

**The blank is now chosen by where the photograph was taken, not by where you are sitting.** The
old code asked `G.mode`, which was wrong twice over: a card is signed at the desk, on a station,
long after the shot — so a picture from a mine was offered «С ДОРОГИ» — and a card received from a
stranger has no live mode at all, since the recipient is in their own game and their location has
nothing to do with that photograph. The snapshot knows where it came from; that is what gets asked.

**Kind turned out to be too coarse a sieve.** «Из пустоты» covers the belt, orbit and a gas giant's
air alike, and the first count duly put «В АТМОСФЕРЕ» — *"going through the layers, pulling
steady"* — under a photograph of a planet seen from above. A blank now carries an optional `m`, the
letters of the places it suits; those are preferred, kind is the fallback, and the player can still
flip to any of the hundred.

Also caught here and written into `CLAUDE.md`, because it cost a build: **`Sort-Object Name`
ignores hyphens**, so `25ha-post-forms2.js` concatenates *before* `25h-post-forms.js` and the
second table dies reading the first. To land after a module, extend its stem, not its letter.

Suite `91zzzi-postcard`: a hundred blanks, no repeated heading, every one findable by the number
that travels down the wire. 10693 assertions in 349 suites.
---
## 0.187.0 — the camera works in five more places (M208)

M188 gave the game a camera and taught it two places: the ground and the approach. That left five
where the ФОТО button simply never appeared — the cave, the mine, the belt, orbit, and the air of a
gas giant — which is most of where a player actually stands. The album was twelve slots holding
twelve variations of the same green hillside.

**The snapshot did not grow.** A card is still a couple of hundred bytes, and `cx`/`cy` mean
something different per place — the step along a gallery, the cell at a working face, the heading,
the altitude — rather than a new pair of fields per mode. Terrain is now computed only for the two
places that draw it: five painters were asking for fifteen hundred points and fifty boulders each
and throwing them away, twelve times over on every album repaint.

**Five painters in `25ga-post-scenes`, one light between them.** Each gets the star, the night
count, the ground ramp and the seed as an argument and never makes its own — eight cards lit by
eight different suns read as eight different games rather than one trip. And every place carries an
object of known size: the same figure in a suit, timber, a ship's wedge. Without one, a gallery
could be a burrow or a railway station.

**Two of them are lit from inside.** The cave and the mine are the only places in the game the star
does not reach, so their frames are built the other way round: the far end is *lighter* than the
near rock, because the light comes forward from a helmet lamp. That inversion is what makes an
underground card recognisable at arm's length.

**Four passes, and the first three were wrong in ways only eyes catch.** The cave came out a
*night landscape with a hill*: the vault sat at the top of the frame and the rock took `T.pal[0]`,
which on a terran world is the ocean — a blue cave. The mine was a beige field with a gallows in
it, because the lamp washed the strata flat and every cell got an identical timber frame. Belt rocks
were soft potatoes (a soft shadow means air, and there is none), then a black paper cut-out. The
planet was striped like Jupiter with white papercut continents. The gas bands read as rolling
hills, and the scoop trail was drawn in front of the ship like a searchlight. All of it is written
down in the module where it happened.

`25ga-post-scenes`, suite `91zzzu-post-scenes`, stand `docs\shot.ps1 scenes`; the album stand now
builds its pack from all eight places. 8868 assertions in 348 suites.
---
## 0.186.0 — chess by post: a move a day, and still nobody has a name (M192)

The post (M188–M191) carries a photograph and a printed blank; this adds a second thing the same
pipe can carry — **a game of chess with a stranger, one move per card**. The plan asked for it
"after the post has bedded in"; it is being done now on the author's instruction to work the whole
queue through.

**A move is three small numbers.** `{f,t,p}` — from square, to square, promotion choice — and that
is the entire wire format, so the rule the post was built on holds without a new exception: nothing
the player *types* ever crosses. The board is not sent and is not stored. What persists is the list
of moves, and the position is replayed from it (`chPosition`), the same way the world is replayed
from a seed rather than saved. A corrupt move truncates the list instead of poisoning the game.

**The engine is complete, not "enough for a demo".** Castling both sides with the rook's and king's
own rights, en passant with the captured pawn actually removed, promotion to any of four pieces,
check, mate and stalemate named as шах / мат / пат, and the rule that costs the most code and is
the point of chess: you may not leave your own king attacked. `chLegal` filters pseudo-moves by
playing them and asking. Three of the first test failures here were bugs in the *tests* — a knight
asked to reach an occupied square, a promoting pawn placed one rank short — and the engine was
right; they are written down in the suite so the next reader does not re-derive them.

**Correspondence, not a match.** You start a game on a card you sent or caught, and after that each
card carries one move. You cannot move twice; a move arriving out of turn is dropped and the game
is untouched. The board lives on the desk as its own tab (ПАРТИЯ) and the move goes out with the
next card — including through the night ether, where a caught card lays its move on the board while
the announcer is still reading.

**Server side.** `site/api.php` learns an `mv` field: validated field by field (`0…63`, no null
move, promotion `0…3`), carried through `put` / `reply` / `ask` / `in`, and never trusted — the
client re-checks legality before the move touches a game. The runner's `php -l` gate added in
M190 covers it.

`25n-chess`, suite `91zzzt-chess`, 8794 assertions in 344 suites.
## 0.185.0 — the newcomer's first hour: a relief operator, not a tutorial (M207)

The plan has been asking for this since before the release block existed: walk a fresh save, write
down every "boring" and every "I don't understand", fix them as a list. The walkthrough is in
`docs/DESIGN-first-hour.md`, measured in the running game rather than remembered.

**The worst finding, and it is not difficulty.** `G.surf.suit` starts at 100 and counts down while
you walk, and **nothing in the game ever names it**. The bar is drawn and silent. A newcomer's first
death there is not the game being hard, it is the game not having spoken. Fuel is the same problem
one step later: a tank worth about ten jumps, and nothing says that fuel is bought rather than
found. Measured at a fresh start: no quest, no goal card, no story pin, no tutorial object of any
kind — a ship, six hundred credits and no reason to move.

**The fix is a person, not a tutorial.** No arrows, no modal windows, no "press here", no "skip
tutorial" flag — the game does not speak that language and should not learn it. It uses the voice it
already has: four lines in the ether, each said **once per save** and each tied to an occasion
rather than a timer.

- the pack you breathe from on the ground is not endless — first time you walk far from the ship
- the tank is ten jumps and refuelling is bought — first time fuel drops below 86
- there is always work on the board at a counter — first dock
- if you are broke, dig; the station buys what is underfoot — first time you stand at a deposit
  with under nine hundred credits

Four and not five: more is a lecture, fewer does not cover the list. A fifth line about *data* was
considered and dropped — nobody dies or gets bored for want of understanding data. They are said by
people (диспетчер, стойка, старик у стойки), never by the game, and never twice, including across a
reload.

**Written down and deliberately not fixed:** the station board shows eight sections on a first dock,
and thinning it is a decision about what the game is. And the first prompt on landing is
«СКАНИРОВАТЬ ОРГАНИЗМ» when twenty-two deposits are underfoot — right sentence, wrong first
sentence, and reordering that chain to save the first hour could cost every hour after it.

## 0.184.0 — the travelling pennant (M206)

Once a quarter the best of your bases gets a banner on the wall and one line in the ether. That is
all of it.

**It is pure form, and that is the design.** The pennant gives no output bonus, no discount, no
reputation, no points. It hangs. The whole meaning of a travelling banner is that it travels: next
quarter it is taken down and carried to another base, perhaps yours again, perhaps not, and the
only thing left of it is a line in the record book saying you once had it.

**Best means most built and best balanced**, not most profitable. Profit is already visible in
numbers, and a banner for it would be the same thing said twice. What is counted here is work.
A power balance sitting at zero-plus counts for more than twenty kilowatts of headroom, which says
only that a reactor was installed and forgotten.

Which quarter it is, and who holds it, are computed from the state of your bases and the quarter
number. Stored is only which quarters have already been announced, so the ether does not repeat
itself.

A test caught the one thing that would have made the whole idea a lie: the tie-breaker between
equal bases was hashed from the **length** of the base's key, and `"1,1:0"` and `"5,5:0"` are the
same length — so there was no spread at all and the banner grew onto the first base in the list
forever. It hashes the whole key now, and over a year of quarters it visits more than one base.

## 0.183.0 — the travelling cinema (M205)

A barge brings a film, and for one evening the cantina reseats itself: the counter goes dark, the
chairs turn to face the wall, and a short newsreel runs on it.

**A newsreel, not a film.** There is nothing to show a film with and no reason to: the film is
running somewhere over there, and what the game shows is the thing people come early for — six
frames with an announcer's captions, each about something this game actually has: new regions, the
expedition's stores, a shift handed over without remarks, species described, the sky's calendar,
houses going up. Dry, unsentimental, informative.

**The hall is not rebuilt, it goes dark.** A cantina does not turn into a cinema; for one evening
it pretends to be one. The existing hall dims, a screen appears on the back wall with a dusty beam
across the room, and in the foreground are chair backs and the backs of heads — the same people,
just turned around. A poster by the door says СЕГОДНЯ and the title.

**Where and when is computed, not stored** — from the station's coordinates and the calendar week,
per the rule about the ephemeral. What is stored is only which showings you have been to, and that
only for one line in the record book. It gives nothing: no money, no data, no reputation. An
evening is an evening.

One thing fixed while looking at it: the caption's type size was reckoned from the screen's height,
so it ran off both edges and read as a fragment. It is reckoned from the screen's width now.

## 0.182.0 — the bed by the house (M204)

Seeds of species you have described (the biology register, `20e`) go into a bed beside the house
and grow **by real days**. Vega waters them. It ties together three things that had never met:
biology, the home, and her.

Lazy about real time, like the pennant and like a QSL reply: a bed has a `Date.now()` of sowing and
nothing else. No simulation — look in a week later and you see a week of growth. A game closed for
a month sleeps through nothing.

**The form is the species', not "a plant".** The species is reconstructed from its **name**: in
Drift a species name *is* its passport (`speciesPlant` builds a species out of a stream of random
numbers and the name out of the species), so one name always yields the same form, colour and
habit. It will not match the exact bush on the far planet — the form there also takes the place
into account — but every bed has a face of its own, and two identical names grow up identical.

What sowing costs is one biological sample, the same currency a manager's perk spends. What it
gives is nothing: no harvest, no sale, no growth accelerant, no "fertilise for 200 credits". The
bed grows.

Four beds at most. The species sown is the last one you described that is not already in the
ground — the register keeps discovery order, so the seed in your hand is the one that goes in.

## 0.181.0 — QSL: the wall of cards (M203)

Reworked for the "no names" rule the whole online part stands on: the operators at the other end
are **people of this game** — winterers, the expedition, far settlements, a lighthouse, an
observatory, a barge, a children's radio club that was allowed on the air for five minutes — not
living players. The whole thing is offline; the server has nothing to do with it.

It works the way it works among radio amateurs. Catch a distant station by ear on the ЭФИР band,
and the callsign is yours — **there is no "note it down" button**, because a radio operator keeps a
callsign in his head from the fact of having heard it. The dial is the whole mechanism: whoever
turns it collects. Send them a card from the table; weeks later the answering card arrives and goes
on the wall at home.

Real time and lazy about it, like the pennant: a card has a `Date.now()` due date and until then it
exists nowhere but as a line in the save. A game closed for a month sleeps through nothing and
simulates nothing.

No score and no reward. The point is that the wall fills up, and afterwards you can see from it
where you were heard.

## 0.180.0 — the bookshelf: forty fragments, all of them written by hand (M202)

Books turn up in wreckage — a hulk, a container, a barge that did not make it. What is left of a
book is **a title and one paragraph**: exactly as much as you get through before someone calls you.

**It is a table, not a generator, and that is a condition rather than laziness.** Generated prose
gives itself away by the third line and devalues all forty at once. A fragment has to be worth
rereading, which means somebody has to have written it.

**The voices differ.** Not one invented book in forty extracts but forty books: a service
regulation, a pilot book, a children's story, a commission's report, poems, a cookbook, a novel
nobody finished, a first reader with a child's pencil in the margin, the last pages of a barge's
log. The world gets larger not from having many planets but from people in it having written
different things.

One place always yields the same book — the seed of the wreck decides which — so a wreck has an
address rather than a dice roll. Roughly one wreck in three has one. The shelf lives at home and is
read from the chair; the only number anywhere is how many of the forty you have.

No award for completing it. The book is the award.

## 0.179.0 — the holidays are on the real calendar (M201)

The road companion proved the game can keep time with the person playing it, and the night ether
proved that doing so makes it a different thing. This is the same idea on the year's circle: on the
thirty-first of December there is a tree in the cantina, and the ether carries congratulations.

**The people who congratulate you are the ones in your record book.** Not a random NPC and not a
table of names: the radiograms come from whoever wrote something in your book over this game
(`11aa`) — a station chief, a topic's lead, Vega, the parrot. Whoever was not there does not
congratulate you. So a first player's first New Year brings one radiogram and a year-old pilot's
brings half a dozen, and that is the only difference the feature makes.

**The holiday gives nothing.** No discount, no bonus, no double-reward event. A tree, mandarins,
other people's voices, and a line in the book. Any reward would turn the thirty-first of December
into farming, and it comes once a year as it is.

The tree is drawn once and stands in two places, the cantina and the living room at home. It is not
a stack of triangles: three tiers of branches with ragged lower edges, a trunk visible below,
baubles hanging *on* the branches rather than floating beside them, two strands of tinsel catching
whatever light the room has, and a star. It is drawn **last, in the near corner** — put in with the
rest of the props it went behind the counter and the crowd, which is to say it was not there at all.
A tree in a mess hall stands where it is in nobody's way and in everybody's sight.

A test caught one thing that would have been quietly wrong for a year: the holiday leaves a line in
the record book under its own name, so on the next New Year «Новый год» was sending itself a
greeting. Institutions and holidays are struck off the correspondents now.

## 0.178.1 — the two debts from last night, paid

Both scenes shipped with a named art debt. Neither is a bug, and that is exactly why they get paid
before anything new goes on top: a room where the figure reads as a coat is a room that will keep
reading as a coat.

**The wintering room.** The winterer is a person now. A padded coat reads as a padded coat not from
its colour but from **three breaks in the silhouette** — shoulders wider, belt narrower, skirt wider
again; take the belt away and you get an overcoat, take the skirt away and you get a raincoat. Felt
boots wider at the foot than at the shin, an ear-flapped cap, and a patch of face the size of a
cheek lit from the stove — without a face the figure stays an object. The warm rim was doing too
much work and read as a second, glowing man standing beside the dark one; it is a thin edge now.

The berth got **thickness**: a side rail, a gap to the floor under it, a mattress overhanging the
frame, a blanket turned back off a light sheet with two creases across it, a dented pillow. Before,
it was a plank. The stove got legs down to the floor and a contact shadow, because its foot was
disappearing into the vignette and it looked like it was hanging in the dark.

**The veranda.** The deck was a large empty brown field. Filling it with furniture would have
cluttered a veranda; what fills it is what belongs there at noon — the slanted grid of the
railing's shadow, which also tells you where the sun is. The deck chair reads from its **knee**:
back going up and away, seat near-flat, one piece of fabric bending across both planes, with the
stripes breaking at the fold; plus crossed legs and an armrest, without which it is a camp bed.
The man at the rail is in a light shirt and trousers, with hair and the back of his head to us,
and his forearms lie along the handrail.

## 0.178.0 — the sanatorium: three days in which nothing happens (M199)

M162's voucher was one line of code: `+3 суток, мораль полная`. It is a **place** now. A veranda
over the sea, a timetable on a board, an oxygen cocktail, a quiet hour, chess. And — the point —
nothing happens.

**That is not an omission, it is the only place in the game where resting is allowed.** No pirates
arrive, no reactor fails, no contract comes in. You can skip a treatment and nothing follows. You
can leave in the middle of a minute and nothing follows from that either. For three days the game
wants nothing from the player — and since the other hundred milestones want something continuously,
three days of quiet weigh more than any reward.

**The weight comes from ageing.** The record book counts the years (M161) and the medical board is
waiting for its date, so these are three days you do not get back. The game never mentions it. It
simply lets you spend them.

**What is not here and never will be:** points for attendance, a relaxation bar, an achievement for
completing the course. Any of those turns rest into work and kills the one reason this place exists.
A test guards it: doing every treatment for three days and doing nothing at all for three days end
in exactly the same state.

The veranda is built as the opposite of the wintering in every respect, deliberately — one dark
room with no outside against an open deck with the sea to the horizon and more light than anyone
is counting. The neighbour in the deck chair talks about himself and asks for nothing.

**Still open:** the deck is a large empty field, the deck chair reads as a bundle of sticks, and
the figure at the rail is a slab. The scene wants another pass, same as the wintering's room.

## 0.177.0 — the observer's choice: take the settlement in hand, once (M198)

The settlement (`12t`) had exactly one connection to the player: **feed it**. What grew out of that
was theirs to decide, and that was the whole design. Now there is a second connection, and it is
one-way: take it in hand.

**Everything measurable gets better.** It grows faster. It raises what pays instead of what came
into its head. The barn is twice the size, and they give more often and more evenly. Not one number
gets worse.

**What is lost is in no number at all.** They stop speaking in glyphs: the vocabulary the player
collected out of fragments of the report (`12q`) has nothing left to do here, because the answer is
now «принято» and «сделаем». Their own will in choosing a building goes: from here on it is a plan,
and plans are alike — two settlements taken in hand end up the same settlement. And the crooked
street goes with it. The yards line up, the roofs come to one height and one pattern, there is no
communal hearth in the middle any more, and a mast with your house mark stands at the end of it.

**Not one word of morality.** The game does not say which is right, does not ask "are you sure?",
does not report a loss. The button names the action and stops there: the dilemma is shown, never
stated. What changed can only be seen and heard, and only afterwards.

**There is no way back**, not out of cruelty but because there is none in life either. A hand is
not withdrawn, and an undo would turn a decision into a setting.

Caught while wiring it: the save rebuilds a settlement field by field from a whitelist, so `mine`
was being dropped on load — the same class of bug the manager fields hit three times. It is in the
list now.

## 0.176.0 — the wintering: a month alone, and the light is an instrument (M197)

A contract off the board unlike any other in the game: not fetch, not kill, not find — **stand it
out**. A month on a far station, alone. Hold the power balance, keep a diary, listen to the wall,
wait for the barge. `winter` is a mode of its own with its own frame.

**It is one room, on purpose.** The temptation was a station with compartments to walk between,
but a wintering is about solitude and routine, and solitude *is* one room you do not leave for a
month. Everything else lives in the instruments on the panel and the sound behind the wall: the
station around you exists, it simply is not visible, and it is larger for that.

**The balance is a choice, not arithmetic.** The reactor gives less every week — ice, wear — and
there are four consumers, all of them needed. By the end of the month you are switching off
something living: heat, air, light or antenna. The game never says which is right. Turn the lamp
down for the antenna and **the room is genuinely harder to see**: the balance is not a number in a
corner, it is what you are looking at. Three light sources, all of them yours to set — the lamp
over the table, the stove, and the window that never switches off.

**The diary is the postcard's blanks** (`25h`). Not thrift: a winterer writes in forms *because*
there is nobody to write to and nothing to say, and a form is what is left when the words run out.
A diary page is built exactly like a postcard nobody will ever send.

**A calendar hangs on the wall with the days crossed off by hand.** The interface keeps no
countdown — counting the days is the winterer's business, not the interface's — so the counting is
a thing on the wall instead.

Faults arrive off schedule and each one costs the reactor a unit until it is fixed. Fixing one eats
the whole day: no diary that evening, which is an honest price — a day holds one piece of work,
not a list. The wall talks: iron early in the month, and by the end almost words. There is nothing
supernatural about it and never will be; the explanation is always there, you have just been
listening longer.

The pay is small and the record book is full — several entries, including the ones you would rather
it did not make: how many days you were cold and did not report it.

**Still open:** the room wants another art pass. The figure reads as a coat rather than a person,
the berth under the window is a plank with a pillow, and the stove's foot is lost in the vignette.

## 0.175.0 — the pennant: a probe you launch and are meant to forget (M196)

An automatic probe is assembled in the lab and launched at a star no hull will ever reach. Then
you are supposed to **forget about it**, and that is mechanics rather than a turn of phrase: no
marker, no counter, no "so many days left" anywhere in the interface. Weeks later the receiver
catches its weakening voice once, the probe sends back a photograph of where it got to, and it is
silent for good.

**Real time, and lazy with it.** No flight is simulated — the probe has a `Date.now()` of launch
and a due date, and until that date it exists nowhere but as one line in the save. A game left
closed for a month sleeps through nothing.

**The photograph is the probe's, and the postcard's painter takes it.** M188 was written as a
separate painter precisely so it could draw *any* snapshot of a scene — including one where no
person has been or will be. The place is computed from the seed of the system the probe was flying
to: the game does not invent the picture, it works it out the same way it would work out yours.

It is the only thing in the game with **no reward and no use**: no money, no data, no route opened.
A line in the record book, and a photograph of a place you will never stand in.

Once it has spoken, the probe is removed from the save entirely. What remains of it is the record
book entry and the picture — not a row of state. Otherwise a long game accumulates a graveyard of
probes the game will never mention again.

Three in the sky at most; past that it is a fleet rather than a gesture.

## 0.174.0 — the night ether: the band that only exists in the evening (M191)

The receiver has four bands and they are always in the same place, like a real set. The fifth —
**ночная почта**, at the very bottom of the dial where long waves live — is *not* always there. It
appears after nine in the evening and is gone by two, and only when there is a network at all.

**The hour is the real one**, not the game's. The road companion already proved the game can keep
time with the person playing it; a window measured in game days (a minute each) is not a window,
it is a flicker. And only a real evening gives the thing the whole feature was for: at that hour no
notification is needed, because **the ether is the notification**. The dial lights its own label
and says nothing else.

**A card is not shown, it is heard out.** The announcer reads it a line at a time, the way
telegrams were read — the blank's name, then each line as it was left standing, then the postscript
glyphs, then the place. Leave the wavelength halfway and you get nothing. A card read to the end
lands on the table as a stack with the reply already open — the screen does not throw itself at
you, because "only what is needed right now hangs over the world" outranks showing off a reward.

**Two a night.** Not out of stinginess: the third devalues the first, and an evening should end
before the interest does. The count runs on the *evening's* calendar rather than the day's, so one
in the morning still belongs to last night — otherwise midnight resets it and two becomes four.

Catching moved out of docking entirely, where M190 had parked it: a stranger's card is not handed
over as a bonus with the refuelling. Docking still brings replies, because a reply is addressed to
you.

Verified on the stand with the hour forced and the pool faked, so the path is the real one:
`pageshot view -Q "?s=ether"`. And verified by accident at 23:00 local, which is when the band
turned up on the dial without anyone forcing anything.

## 0.173.0 — the post: a card goes into the pool and a stranger catches it (M190)

The pipe under the postcard. `a=post` in `api.php`, `25j-post-wire` on the client, and a ПОЧТА tab
on the table where chains lie as stacks of cards clipped together.

**No account, and no names anywhere.** The pilot mark is the one the trace already uses — a random
string in `localStorage`, good for nothing but counting "how many today". The server knows whose
card is in the pool and never says: the catcher gets the card and a chain id, and the reply is
routed by the server itself. Neither side can find the other, call the other, or recognise the
other across chains. Go quiet and you are gone for good.

**Nothing typed crosses, and that is enforced on the server rather than trusted from the client.**
The card is rebuilt field by field — every number range-checked, the blank matched against
`[a-z0-9]{1,8}`, at most eight choices 0..7 and three glyphs 0..31 — and anything unexpected is
rejected instead of trimmed. That is why the whole feature needs no moderation: there is no channel
for a person's words, not even a narrow one.

**One request per docking** (the M171 rule). No timer, no poll, no socket: you dock, the game goes
out once, and that one trip brings back replies and — if the pool had something — one stranger's
card. Three cards a day out, two caught, a second fence per IP, thirty days of life, a sweeper on
the clock rather than on a dice roll.

**One button about a person: «не принимать».** Not a report, not a block list, not an explanation.
The chain dies and the other end is told nothing at all, which is what happens when people stop
writing.

Offline the feature does not exist and the interface never mentions it: a file opened from the
desktop is a game without a post, not a game with a broken one.

Two things fixed before they shipped:

- `mailWire` dropped `v`, the marker `drawPostcard` checks on its first line, so a card you sent
  landed in your own stack as a black rectangle.
- and, before that, the deploy: **there is no PHP on this machine**, so the one file the whole
  backend lives in had been going to the live site without ever being parsed. `php -l site/api.php`
  now runs on the runner before the upload step. A typo there is not a page that looks wrong — it
  is accounts and cloud saves down for real people.

The risk register has a new section (`docs/DESIGN-online-risks.md`, D2): the pool is global, so a
flooder pushes their cards in front of everyone rather than in front of one place; the daily limit
is self-asserted like the trace's, and the per-IP fence is what actually holds. Stands:
`pageshot view -Q "?s=mail"`.

## 0.172.0 — the forms: a postcard you can send without typing a word (M189)

The back of a card is a **printed blank**: a title and lines, each line a set of ready variants.
Tapping one strikes the others out, exactly as a pencil does on a real form. Thirty blanks in
eight kinds — road, holiday, wintering, household, lyrical, scientific, official («ФОРМА №7»),
children's — flipped through one at a time in the card's header, because a list of thirty is a
list and a postcard is a thing.

**Every line's default is its first variant, and that is a rule rather than an accident.** The
author's word on postcards was «чтобы не париться»: a card must be sendable without a single tap
and still say something human. So the first variant everywhere is the calm, ordinary one — the
one nine people out of ten would write.

**Why variants and not a free line.** A free line is a chat, and a chat between strangers has to
be policed, which turns a game into a service. The blank takes away exactly the freedom that
would have required people on moderation duty and keeps the one a postcard is sent for: choice.
What crosses the wire is a form id, the numbers of the chosen variants and up to three glyphs —
under a third of a kilobyte per card, and nothing a person wrote.

**The struck-out variants stay visible.** Hiding them would throw away half the message: a
stranger's card tells you about them by *what they crossed out*.

**A postscript of up to three glyphs** from the settlement pidgin (`12t`). What they mean is
never explained to anyone — the meaning is for people to agree on among themselves, and it is the
only thing crossing the boundary that the game has not written.

The address side of the back is empty on purpose, so the emptiness is named out loud in print:
«адресат не указывается · карточка идёт в общую почту». One line states the rule the whole
feature stands on, and states it as part of the world rather than as interface help.

Two collisions found and fixed on the way, both invisible to the eye:

- the choices were being written into `s.m`, which is the snapshot's **shooting mode** — a card
  taken on approach silently lost its lander and drew a walking figure the moment it was signed.
  They live in `s.c` now.
- the variant buttons carried `class="v"`, and the game already has a global `.v` — an instrument
  row, `display:grid` with 64/88/46 columns. Every variant quietly inherited that grid and
  stretched to a quarter of the card.

Stand: `pageshot view -Q "?s=pcback"`. Measured at 375 px: the card fits, nothing overflows, and
none of its 42 touch targets falls under the size rule.

## 0.171.0 — the camera: a photograph is a snapshot of the scene, not pixels (M188)

First pass of the postcard block. A photograph in Drift is **about two hundred bytes**: mode,
world seeds, hour, camera point, `VER`. The receiver's own engine draws it. Three reasons, in
order: the server carries bytes instead of megabytes; nothing but the game's own world can
physically cross the boundary, which is what makes the whole online feature need no moderation;
and an old card re-rendered by a newer engine comes out slightly not-the-same, which is exactly
what time does to a photograph.

**It needed its own painter, and that is the whole milestone.** Every draw path in the game
writes into the single `ctx` at the single `W`/`H`, reading the single live `G`. Rendering a
stored scene "as it is" would mean swapping the world under the renderer and putting it back — a
save-corrupting class of bug. So `drawPostcard(c, snap, w, h)` takes a snapshot and someone
else's context and owes `G` nothing at all. A test proves it: the same snapshot draws
pixel-identical frames before and after the live world is moved to another sector, another day
and another mode. The terrain comes from `genTerrain` — the same function the game walks on, so
the card cannot lie about the place.

Storing captured pixels was measured and rejected: a 480×300 JPEG is ~25 KB, twelve of them
~300 KB, and the album persists into a save that also goes to the cloud. The whole album now
weighs under three kilobytes.

**ФОТО** appears on the console only where there is something to shoot — on the ground and on
approach — and the album is a tab on the table that only exists once there is a first photograph
in it. Twelve places; the thirteenth shot pushes the oldest out and says so out loud.

**Five passes on the card itself**, each against the game's own frame:

1. A distant hazy ridgeline — pretty, and nothing like this game. Drift's surface is sky with a
   body hanging in it, a profile with a lit rim, and under the profile not emptiness but a **body
   of ground with strata**. Rebuilt around that.
2. The ground took its colour from `T.pal` — which is the *planet texture* ramp, seen from
   orbit, where the low steps are ocean and shadow. An earthlike world came out blue: the player
   was standing on the sea. Ground lives in the upper middle of the ramp.
3. Vertical scale was reckoned from frame height, so a volcanic world's peaks left the top of
   the card — a postcard is a third the width of the game's frame and stretched the same relief
   three times. One scale on both axes now, as a photograph has.
4. Strata followed the profile all the way down and read as contour lines. They flatten with
   depth now, and reach the bottom edge instead of crowding the top third.
5. No clouds, and that was the first thing that separated the card from the live frame. Added as
   soft radial blobs — filled ellipses gave a chain of identical lozenges with a hard edge, and
   at this size anything with a contour reads as a blot.

The scale in the frame is a person: without a figure at the profile the ridge behind is a boulder
and a mountain range at the same time. It carries a rim light from the star, because on an
airless world at night the silhouette matched the ground exactly and the one measure in the
picture disappeared.

Stands: `docs/mkpost.ps1` (six cards, six worlds and hours — the painter alone, the game never
touched) and `docs\pageshot.ps1 view -Q "?s=album"` for the album on the desk.

## 0.170.0 — the sky watch: the calendar finally has somebody on duty (M195)

`celestAt` has computed eclipses, parades and comets since 0.126.0, and the whole point of it was
that the sky is a *function of time* — the same day in the same system always gives the same sky,
so a meeting can be arranged by it. Nobody ever arranged one. The calendar was scenery.

The institute (11ab) now hands out a **watch order** at a science counter: a place, a kind of
event and a day. The day is not decorative — it is read out of the same functions the cockpit
line reads, by stepping forward through them (`skyFind`) at a step matched to the width of the
window: a comet hangs around perihelion for nine days, a parade holds for fractions of a day, an
eclipse for a sixth of one. A daily step would have named days on which nothing happens.

Be there and the tape writes itself — no button. For a parade or a comet, being in the system is
enough; for an eclipse you have to be standing on that particular planet, which is the first time
in the game that a task names a piece of ground and means it.

**The horizon is a month, and that was learned the hard way.** A calendar day is a minute of play,
so "in N days" reads as "in N minutes"; the first pass took the first event it found inside a
hundred and fifty days and cheerfully posted a comet for day 123. Correct, unplayable. Orders now
look thirty days ahead — sixty for a comet, which comes round rarely enough to be worth the wait —
and the kind is drawn from the seed *before* the place is searched, because an eclipse is available
around half the planets in the sky and would otherwise win the "soonest" contest every single time.

**It is a race, not an errand.** The institute computes the same sky you do, and six days after
the event it publishes its own bulletin — calculated, with no observer. Report before that and the
observation is yours: full pay, science data, a line in the record book. Report after and it is
still filed, at half pay, with «сверка тоже работа» from the person behind the counter.

**A comet reported first takes a name — out of your record book.** The record book is written by
other people (0.147.0, M161), which is the whole joke: the player cannot physically name a comet
after himself. The name sticks to the system for good and the cockpit line uses it from then on —
`КОМЕТА «ВАРЛАМОВА З.» · ЕЩЁ 4 СУТ`. Nothing is written across the sky itself: the loudness budget
of 19b stands.

The sky is still not saved. What persists is the order, the tally and the comet names
(`G.duty`) — decisions and their consequences, never the ephemeral. The old celest suite's
assertion that nothing sky-shaped reaches `snapshot()` is left in place, and still passes.

## 0.169.0 — ляпнул лишнего: the player becomes a source of rumours (M194)

Third of the three squanders from the book, and the one the plan called cheapest and most
interesting. Rumours (`11t`) have always run one way — the player only ever *hears*. Now he can
talk, and what he says comes back.

At a station counter, if he has actually dug something notable and not yet told anyone about that
place, the board offers one row: **«Рассказать, где взяли …»**. There is no warning attached and no
consequence written anywhere.

**What he gets immediately, and it is real:** the person behind the counter remembers him warmly,
which means the next thing they offer arrives **named** — three times the money (`11ah`). That is
not a consolation prize, it is exactly the currency the whole arc runs on. People listen to a man
who shares, and they listen gladly.

**What he loses later:** three days on, a barge is working that place. One line goes out on the air
— *«…там, где брали железо, работает баржа. Кто-то навёл»* — and it never repeats. It does not name
him. Fly back and the deposits are fewer and poorer, with no explanation offered.

Deposits are derived from the landing seed and never persisted, so "worked out" lives as a sparse
overlay keyed by place, per the project's own rule, rather than on a deposit that no longer exists
by then. It survives reloading: a place he talked about stays talked about.

**The game never makes him do it.** Telling is opt-in, it buys something true, and the bill arrives
in the human ledger rather than as a punishment. A player who never says a word simply loses
differently — quietly, by keeping to himself.

Guards: `91zzzh-told` — small finds are not worth telling; telling warms the counter and can only
happen once per place; the ether line fires exactly once, after the lag, and does not name the
player; and none of it is forgotten by reloading.

---
## 0.168.0 — the line with no name (M193)

Second item off the saga-vs-game gap list, and the cheapest thing in it: one row of data.

The arrivals board in the Tin's cantina has always carried overdue lines that nobody clears. One
of them is now the **shuttle of the «Долгий Ход»** — «Тесло», twenty-three years late, in exactly
the same markup as its neighbours, with no highlight and no note. It is not evidence. It is a line
on a board.

For that line to mean anything the player has to have met the call sign somewhere, so **one piece
of the hundred is now written by hand instead of assembled**. The other ninety-nine come out of
three banks — who, did what, and what it has to do with anything — and their strength is that a
ship's log is uniformly dry. This one names the boat plainly, in the middle of the «Тихоня»
chapter, in the same flat voice: *«младший борт ушёл на тихой тяге, шлюпка „Тесло", и это
последняя запись»*.

And then the game does nothing at all. It does not highlight, does not connect the two, does not
congratulate anyone for noticing. Whoever reads both lines puts them together themselves; whoever
does not sees one more overdue row on a board nobody cleans, and is right.

A guard caught something worth keeping while this went in: the board's test asserted "half the
lines are overdue" as the literal number three. Adding the shuttle made it four of seven. The test
was not relaxed — the ratio is a real design statement — so a seventh arrival («Обод») joined the
board and the assertion now checks the ratio rather than the count, plus that the shuttle is among
the overdue ones and carries the name the report uses.

---
## 0.167.0 — «Глобус»: прибор, который показывает место, а не число (M192)

The book's central object, and it was not invented: real ships carried a navigation indicator
called «Глобус» (ИМП, later ИНК) — an electromechanical analogue computer of gears, cams and
differentials, two ratchet solenoids, twenty-seven volts, one pulse a second, turning an actual
globe behind glass. It answered exactly two questions: where you are, and **where you would come
down if you braked right now**.

Nothing better could be designed for this game, so nothing was. It **does not speak** — the world's
rule for instruments (25a) holds: no beep, no alarm colour, no line in the journal; it shows, and
the player notices. It is mechanical, so the fourth layer of wear settles on it by itself. And it is
the theme cast in brass: for the whole game a device stands in front of the pilot answering, once a
second, «and where would I end up if I dropped all this now» — and half the time it points at empty
space.

It lives in the cockpit rack, right of the recorder, deliberately not in the row of dials: it is a
different kind of instrument and it has a different shape. A ray is marched along the current
velocity to the first body it meets; planets travel their orbits while the ray flies straight, so
the instrument lies exactly as much as an iron one would — it answers "if NOW", not "if you go
there".

**No sound.** The book has it clicking, and a click once a second for a whole flight is not
character, it is an irritant; the instruments-don't-speak rule beats the pretty detail. The tick was
made visible instead: the globe turns by a hair in a jerk once a second rather than gliding.

One design error found by looking at the frame: the second needle, "where you would land", always
lay exactly on the first — for a straight ray the bearing to the target *is* the heading. It is now
a range marker that creeps along the heading line from the axis to the rim as the target gets
further, and there is no marker at all when there is nothing ahead.

Two tooling traps paid for on the way: the stand kept setting the ship's velocity by hand and the
game loop kept damping it away, so the screenshot showed an instrument that had nothing to point
at — it now flies on a real autopilot. And a `perl -0pi` rewrite of `mkview.ps1` stripped the file's
BOM and moved the inserted block to the top; restored from git and reinserted by line number.
The BOM rule in `CLAUDE.md` exists for exactly this.

Guards: `91zzzg-globus` — the aim over twenty-four headings must only ever name bodies that really
exist in that system; the once-a-second rule; and a source-level check that the module contains no
`say`, `tell`, `logAdd` or `sfx`. Stand: `docs/mkview.ps1 ?s=rack`.

---
## 0.166.0 — an offer becomes a job, and the clock was measured in the wrong unit (M191)

**A button that pays you is not work.** Offers used to credit you the moment you clicked ВЗЯТЬ,
which made the game's main quest a vending machine. Now a paying offer has an address: you take it
here and you are paid **there**, and only there.

Taking one puts a **paper on the table** (`27i`) with the destination on it. That is the quest log
of this game, in its own language — there is no journal, no marker, no arrow, no timer, and the
board carries one dim «ВЕЗЁТЕ» line so that a man standing at the notice board does not have to
remember from memory where he was going.

**And this is how a name is earned.** Not by taking the work — by delivering it. Deliver, and the
next thing that person offers you comes with your call sign on it, without being asked. Fail to
deliver in time and, if it was named, the door shuts for good, silently, exactly as before. One
duty carried is worth more than any amount of standing about.

**The bug that mattered more than the feature.** `G.t` counts *frames* — `dt` in the loop is a
fraction of a 60 fps frame, and a day of this world is `CEL_DAY`, 3600 of them, one real minute.
The first build wrote the windows as `40`–`180`, "as if in minutes", so offers actually expired
**after about two seconds**, and the station's shift rolled over every four — meaning the guard
against farming stations did nothing at all. Everything about time in these modules now goes
through `CEL_DAY`, and two assertions pin the unit so the mistake cannot come back quietly.

---
## 0.165.0 — the four (M190)

Гуся, Рыба, Гвоздь, Птица — the people who stay for the whole game
(`docs/saga/ЖИВЫЕ.md`). Not eccentrics: a crew of colourful oddballs is the most worn-out thing in
the genre, and the poetics forbid it outright — nobody wisecracks better than their tiredness
allows. These four are **broken specifically, by the work**, and each is funny for what he takes
seriously. None of them knows anything is wrong with him and nobody around them brings it up.

- **Гуся** — a flight engineer who does not fly. Twenty years in the sky and not one takeoff of his
  own. Talks in long bursts without stopping so nobody can get a question in.
- **Рыба** — a pilot who cannot be indoors. Sleeps three hours, sleeps in the cabin even at a
  station, answers questions literally. Always on the air because she never sleeps.
- **Гвоздь** — throws nothing away, carries a box of other people's things and knows where each
  came from. «Ничьё уже». — «А зачем тогда?» — «Ну оно же есть».
- **Птица** — charming, asks for nothing, offers everything, never lies, only omits. Pleasant to
  stand next to, and that is where all the harm comes from.

They do three jobs at once. They make the world warm — until now only official voices spoke here.
They give an offer a **face**: «Вам — место в рейсе» weighs exactly what the person saying it
weighs, and an anonymous counter weighs nothing. And they carry the theme sideways: each of them is
somebody nobody came to relieve, and it shows in what they say rather than in explanation.

**Птица never names your call sign.** He proposes things himself, which is an entirely different
matter, and the guard checks it thirty times over.

Two rules made mechanical: one man per station and not every shift (a person who is always there
stops being a person and becomes furniture); and **one line per visit** — the first build let the
board's re-render advance his line, so buying fuel made him start a new sentence. People do not
talk like that.

Guard: `91zzzf-offer` — the line holding still across re-renders, the lines cycling without repeats
until they run out, and Птица never naming anyone. Stand: `docs/mkview.ps1 ?s=folk`, which winds
time forward to a shift where somebody is actually standing there, because otherwise you cannot look
at them, and looking is the point.

---
## 0.164.0 — the main quest gets its spine: the offer, the ledger, the door that shuts (M189)

The book («Смена», `docs/saga/`) becomes playable, and this is the part without which none of the
rest of it works.

**Why this first.** The arc turns exactly one value: *will anyone say your call sign out loud.* In
a book the prose points at that. In this game there is no quest journal, no marker, no reputation
bar and there never will be — so the value risked being invisible to the player entirely. That is
an architectural problem, not a cosmetic one, and it is written up in `docs/saga/СУД.md`, pass I.

The answer is not a UI. It is that **a named offer is visibly better than a cold one** — three
times, not ten per cent. Then a door closing is felt in the wallet and in the list of what is on
offer, without one line of interface. The player will never read the words "reputation" or
"morality". He will notice that he used to be offered good things and is now offered ordinary ones.

- **Возможность** (`11ah-offer`): the world hands out **access, not credits** — a berth, a bay in
  someone's garage, an institute topic, a name to drop. Always with a face, always with a window
  that closes. It arrives the way everything here arrives (the counter, the board) and expires
  **silently**: no countdown, no reminder, not a line in the journal. In the book the expedition
  list closes on a Friday and nobody tells him.
- **The door shuts for good.** Miss a *named* offer and that person keeps greeting you exactly as
  warmly and never names you again. There is no number behind it and no way back — not with time,
  not with money, not by reloading, because it persists. It is the only irreversible thing in the
  game, which is precisely why it will carry weight.
- **Тетрадь доброты** (`11ai-ledger`): everything done for free and without witnesses, written to a
  place the player can never see. Three guards, all tested: it is never displayed; **it refuses to
  record a deed that cost nothing** (the price is an argument of the function, so a free good deed
  cannot be logged); and helping while broke weighs more than helping with a full hold. First two
  hooks: cargo left at a mark for a stranger (`11ag`), and a barge fought off pirates (`12l`).
- **The station is not a tap.** Offers are generated once per place per shift. Fly away and come
  back and you are offered what you were already offered — even if you let it go. Missed is missed.

Caught by the project's own guards while building: income tried to go around `earn()`, and the
architectural test that funnels all income through it failed immediately. And the first screenshot
showed a named berth paying 852 credits to a player holding 600 — visible, yes, and it would have
broken the early curve; the amounts now sit deliberately below a full hold.

Guard: `91zzzf-offer` — the named/cold ratio, the door that shuts and survives a save, the ledger's
invisibility (it asserts the words are nowhere in the DOM), and the tap that no longer runs.

---
## 0.163.1 — the parrot's window moves off the right rail

Looked at on the stand (`?s=birdwin`) right after 0.163.0 gave it its styles back: at the right
edge it lay straight over the right rail's buttons and zoom. Moved to the left edge, where that
band is free — instruments are above it and the pad below.

---
## 0.163.0 — the first minute, from a playtest (M188)

An outside playtest arrived (`PLAYTEST-REPORT.md`, `PLAYTEST-01.md`, 26.08.2026, played on
0.160.0). Every finding was checked against the code and against the running game before anything
was touched — three of the five headline findings do not reproduce, and under two of those sat a
different, real bug. What follows is what the measurements said, not what the report said.

**Did not reproduce, measured:**

- *«ПРОДОЛЖИТЬ ПОЛЁТ» is the first button and starts a new game in emptiness.* The button is
  `display:none` in the markup and shown only `if(hasSave())`; on a cleared browser it is absent,
  measured. Restoring also announces itself («Полёт восстановлен · система · сектор»). The tester
  had a save from their own first fifteen minutes of fumbling. **But the state they described is
  real** — continuing into empty space, with nothing in frame and no way out — and that is the bug
  that got fixed, below.
- *The instruments vanish after a few seconds of calm flight.* Measured after nine simulated
  seconds with nothing changing: opacity 0.86, visible, reading «ТОПЛИВО 100/100 …». This was true
  before 0.160.0, when the panel rested at .34 at the bottom edge; it has not been true since.
- *The world stops living in a background tab.* Crew are computed from `Date.now()` with a
  24-hour cap (`CREW_OFFLINE_CAP`), not from game time. A backgrounded tab catches up on return.
  The tester flagged this as a question, not a conclusion; the answer is that the promise holds.

**Fixed — the first minute.** Three separate findings turned out to be one disease: *the game
offers a target and immediately loses it.*

- A miss no longer cancels the autopilot. `else{G.ap=null}` meant one fumbled tap on a moving
  planet threw away the flight already under way — punishment for imprecision in a game where the
  target moves by itself. Deliberate cancelling still works (thrust, brake, turn — anything but
  action/fire).
- Hit-testing moved from world units to screen pixels. It was `d < p.radius + 40/Z`, so at any
  distance forty world units are a few pixels and a planet the size of a pea could not be hit. The
  threshold is now the project's own 44 px finger rule.
- The compass chips at the frame's edge are buttons now, because they already looked like buttons —
  frame, arrow, label. Tapping «ЗВЕЗДА · 3105» flies you there. Each chip carries its autopilot
  target and a 44 px tall hit box. The **nearest planet** joined the star and the station in that
  compass, so from anywhere in the void there is always somewhere to go.

**Fixed — things that read as breakage:**

- The empty HQ was a full-screen black panel with two lines at the top and five hundred pixels of
  nothing («я что-то сломал?»). The control room is *drawn* in this game (`27f-hq-room`) and was
  being shown only once managers existed — that is, only when the screen was not empty anyway. It
  now draws always: dark consoles reading «ДОМЕН СВОБОДЕН», nobody at them. A picture answers
  "where is everybody" better than a sentence.
- `#parrotwin` outlived M151a: the styles were deleted, the markup was not, and `toggleParrotWin`
  kept adding a class nothing listened to. With no rules at all the block rendered in normal flow —
  so from the first second of a new game, «ТРЕПЛО ×» sat in the page's top-left corner belonging to
  a player who has no bird. It is a proper window again, hidden until the perch opens it. A new
  guard walks every direct child of `<body>` on a clean start and fails on anything visible that
  should not be.
- The receiver stops being a sticker over every panel. It was the one thing the tester said had
  already become annoying. It stays where M151a put it and stays audible everywhere, but loses its
  own glass, border and blur and sits inside the panel's header band.
- The mine printed «W A S D — копать» twice on one screen: once as the entry message, once in the
  permanent prompt. The message keeps only what the prompt does not say.
- The action button now names hold-actions too. The pattern required the prompt to *begin* with
  «ДЕЙСТВИЕ», so at a deposit («УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — БУРЕНИЕ») the button read a nameless
  «ДЕЙСТВИЕ», and one step aside it read «ЗАЛОЖИТЬ ШАХТУ» — the tester found out which he had
  pressed only once he was underground.

Guards: `91a-flight` (the chips, the miss, the screen-space pick), `91f-ui` (nothing stray on a
clean start). Stand: `docs/mkview.ps1 ?s=hq` and `?s=hqfull`, because two full-screen empty windows
were found by an outsider and could not be looked at here.

**Открыто и записано, не сделано:** on the surface the walker is 25 px on an 840 px frame — 3.0 %
of the frame's height, measured — and the tester spent twenty seconds unable to find himself. The
ratio to the lander is correct (110 px vs 25 px ≈ a person against a seven-metre craft); what is
wrong is that the surface camera does not scale with the window, so a large desktop window simply
shows more world and shrinks everybody in it. The fix is a camera scale tied to frame height, and
it touches the world-x chunk cache, which is baked 1:1 — a milestone, not a patch.

---
## 0.162.3 — text over the world gets a shadow, not only a glow

Seen on the low-suit frame: the arrival message ran across the lit ring of the sky giant and
disappeared inside it. A glow separates a letter from a *dark* background and does nothing on a
bright one, and both the message and the action prompt had only a glow. Both now carry a dark
shadow first and keep the glow as mood. The same rule the instruments already follow.

---
## 0.162.2 — rain falls at its own speed, and the camera's precondition is written down

**The rain.** It has had two depths since 0.99.8, and that already gave it distance — but inside the
near layer every drop fell at exactly 1.75×, so the layer read as a texture sliding down the glass
rather than as water. The eye catches identical *motion* faster than identical size. Speed is now
per drop, from its own hash so it is not tied to depth: fast and lazy drops fall side by side. The
last of the M178 tails except the flat far ridge.

**M188, the camera — checked before starting, and it does not begin where it looks like it begins.**
The agreed design is "a photograph is a snapshot of the scene, not pixels", and it rests on the
engine being able to re-render a stored scene. It cannot today — not because the world is
non-deterministic (it is deterministic: `enterSurface` rebuilds terrain from the planet's seed), but
because drawing is welded to globals: every path paints into the one `ctx` at the one `W`/`H`,
reading the one live `G`. Rendering a stored scene therefore means either swapping the world under
the renderer and restoring it after — a save-corrupting class of bug — or giving the postcard its
own painter that owes nothing to `G`. The pixel alternative was measured and rejected: twelve
480×300 JPEGs are ~300 KB inside a save that also syncs to the cloud. The milestone's first pass is
`drawPostcard(ctx, snap, w, h)`; the button and the album mean nothing before it exists. Written
into `PLAN.md` rather than discovered again next session.

---
## 0.162.1 — the frame's darkened edges stop costing a full screen

The `.slope` introduced in 0.160.0 — the soft darkening that gives the instruments and the console
something to read against — was one element at `inset:0` carrying two gradients. Transparent in the
middle, but the browser still rasterises and composites the whole box, which is exactly the
full-screen fill that G0's rule forbids ("one full-screen pass costs 4–5 ms at ×2"). It is now two
strips, 150 px and 210 px, painted by the element's own pseudo-elements: under half the frame, and
identical to look at.

Measurement note: this machine is reading ±10 fps run to run on the same build tonight (two clean
`?g11` runs gave belt 54/49, landing 46/44, surface 48/43, road 30/41), so nothing here is quoted as
a before/after. What is stable across runs: dig 60, cave 60, raid 60. The change is made because the
rule says so, not because a number moved.

---
## 0.162.0 — the eye and the road: two interface passes (M182, M183)

The two remaining named questions from the interface series, run against the frames rather than
from memory: **the eye** — what the player looks at first on each screen, and what is louder than it
deserves; **the road** — how many steps between wanting a thing and having it.

**The market answers its own question first.** Opening a station's market, the first price sat below
the middle of the screen: a header, then a three-line block explaining a route the player does not
have, then "the hold is empty", and only then goods. An *absent* route is a hint and now waits at
the bottom in one line; a route that exists is work in progress and stays at the top where it can
be acted on. Six prices are visible where four were.

**An internal key was being shown to the player.** The table's header printed `G.mode` verbatim, so
the player read «Нейэль · system» — an English word out of the source, in a Russian game. There is
now a table of Russian names for every mode, and an unknown mode prints nothing rather than its key.
Two guards: one on the table's names, and a broader one that walks every screen and the table in
every mode looking for Latin words in visible text — the kind of leak that is invisible to the eye
because it looks like decoration. That guard also counts what it inspected and fails if it inspected
nothing, so it cannot go quietly green.

**Two more places said what the place summary already says** — the cave's «Пещера» and the home's
«ДОМ» headline (five such were removed in 0.160.0; these two were found by looking at more screens).

**The stand stopped lying.** `docs/mkview.ps1` forced `.hud{opacity:1!important}` so the instruments
would survive into a screenshot back when they rested at .34. At .86 that is unnecessary, and it was
actively harmful: it also overrode `body.screen .hud{opacity:0}`, so a screenshot of the station
showed the instruments floating over the open panel — a bug that exists only in the stand. The
override is gone; the stand shows what the game shows.

---
## 0.161.0 — the raid was drawn upside down (M180, pass 2)

The author, 2026-08-25, on the pirate-base frame: «не очень понятно, посмотри на перспективу», and
in the working note, «человек стоит на потолке». He was right, and literally so.

**The up vector pointed down.** The raid's coordinate system is left-handed (x right, y up, z
*forward*), but the camera basis was built as `right × fwd` — the right-hand rule. In a left-handed
system that yields "down": the measured vector was `[0, −0.987, −0.158]`. Every frame of every raid
since M35 was drawn mirrored about the horizontal: the floor receded into the *upper* half, the
ceiling into the lower, and a standing figure had his feet projected above his head. A compartment
is nearly symmetric top to bottom, so an upside-down corridor still looked like a corridor — the
error survived until standing figures and directional lighting made it visible. `up` is now
`fwd × right`, in a named function (`raidUp`) so an autotest can watch the sign; a second suite
checks the *frame* rather than the vector, asking where the floor is, where the ceiling is and
whether feet are below heads.

Three things the flip had been quietly breaking, all of them listed as separate suspects in the
plan, all of them one bug: the value order was "inverted" because the frame was inverted (the
floor's light pools and plates were rendering above, the dark ceiling below); contact shadows were
being suppressed by a guard that only draws a shadow *below* a body, and the floor projected above
every body; and "hanging boxes look like floor boxes" because they were floor boxes, drawn overhead.

**Loot crates had never once been drawn.** M180 replaced the on-screen loot sticker with a real
crate standing on the floor, wrote the code, and called `box()` for it *after* the polygon list had
already been sorted and painted. So for every version since, the world got a beacon floating in
empty space and no crate under it. The two loops moved above the flush and the crates now live by
the same rules as everything else — depth, fog, occlusion. Their light floor is also raised (.40
against the walls' .15): the contour is only drawn above .3, and a container without a contour
reads as "nothing was drawn here".

**Marks no longer pass through bulkheads.** Beacons, stencils and health bars were painted over all
geometry with no depth test, so the player could see loot and living pirates through the walls of
rooms he had not entered. They are now gated by `raidLineOfSight` — the same ray the enemies shoot
along, deliberately, so that "visible" means one thing in this mode and not two.

**The man became the measure.** Body scale came from `clamp(2200/z, .25, 3)`, and the cap of 3 was
reached at every playable distance — so bodies were drawn at a *fixed* size regardless of depth, and
that size was about four times smaller than the compartment's own geometry demanded (measured, not
guessed: a floor cell of 90 units spanned ~250 px beside the walker, so a 50-unit person should have
been ~140 px and was 55). A 110-unit compartment read as a five-storey hall. Scale now comes from
the projection itself — how many pixels a pole of body height occupies at that spot — so it cannot
drift and perspective on bodies works for the first time. Shadows, health bars and beacons are all
expressed in world units for the same reason. With honest scale the camera turned out to be standing
on top of the player, so it moved from 118 units back to 236, and the principal point moved to
`H*.53`, which now really does put the horizon at .375 of the frame (with the flipped vector, the
old `H*.44` had been putting it *below* centre — the opposite of what its comment claimed).

**The ceiling stopped being a hole:** value from .28 to .42 plus one transverse beam per cell, so
the plane overhead has the rhythm that gives it depth. The raid is also a step in the `?g11` probe
now, because until today the cost of this screen could not be measured at all. Clean run, one
window: raid 60.

---
## 0.160.0 — the instruments go back to the top, and the lamp starts meaning something (M187)

Two direct orders from the author, 2026-08-26: «приборы сверху, сейчас очень плохо не видно» and
«на столе чтобы не случилось в меню огонёк, он типо всегда горит и соответственно не работает».

**The state moved back to the top edge.** A2 (0.143.0) put it at the bottom on the argument that
the top of the frame belongs to the world. On the author's own screen the argument lost: the
bottom band already carries pads, console and action prompt, so the numbers landed in the noisiest
strip of the frame — over the ground the walker is actually looking at — and rested at .34 opacity
on top of that. Two rules replace the old one, and they are written into `style.css` so the next
pass cannot quietly undo them:

- **The top answers «who and where am I», the bottom answers «what can I do».** State (gauges left,
  place and purse right, the region pod centred in flight) lives at the top; prompt, console and
  pads live at the bottom; nothing lives in both, and the middle of the frame is always clear.
  `91f-ui` was re-pointed rather than switched off: it now guards the two zones and the empty middle.
- **An instrument that cannot be read is not an instrument.** Resting opacity .86 instead of .34,
  bars 4 px instead of 2, labels and numbers one step larger, a centre tick so a bar answers "how
  much" and not just "much/little". `91f-ui` measures both the resting opacity and the bar height.

Found by looking at the frames, not by planning: the suit bar stayed calm white at 14% while only
its number went red (`.low` sits on the row for suit/pack/hold and on the bar itself for fuel/hull —
the CSS rule reached only half of them); the top scrim had been carrying the bottom row too, so
moving it left the action prompt bare over bright ground (it is now its own element, `.slope`, with
both edges); and the canvas hint bar on the surface was positioned by a constant of 58 px measured
under three gauge rows, which in a crisis (five rows) sat inside them — it now reads the real band
height, `HUD_BAND`.

**One language, four screens.** With the place summary finally legible, four mode-entry messages
turned out to be saying what the summary already says: the planet's name and type on landing, the
word "Пещера" in the cave, the base's name, "Абордаж · name" on the raid. Each now says only what
is nowhere else on screen.

**The lamp.** It counted things with `!seen` — everything the player had not opened one by one — so
with a dozen unopened papers permanently on the table it was permanently lit, and a signal that is
always on is part of the button, not a message. Three separate notions now: the lamp in the menu
means "arrived since you were last at the table" and goes out on the visit, read or not; the wax dot
on an item means "unread" and goes out when the item is looked at; the counter on a tab says which
shelf the news is on and holds while the table is open, so opening it does not erase the answer to
"where". The visit is marked by an explicit `noticed` flag, not by comparing timestamps — a paper
can land in the very millisecond the table closes. Saves without the marker load as "seen
everything", so an old save does not light up on forty old papers. Guard: `91zzv-table`.

**Carried over, not written here:** the road's rank ladder (`ROAD_RANKS` / `roadRank` in
`27k-road`, shown on the road screen with the distance to the next rank) was finished in the
0.159.0 session and left uncommitted in the working tree. It is tested and green, so it ships with
this version rather than being reverted; the lifetime odometer `G.road.total` persists and defaults
to zero for older saves.

---
## 0.159.0 — the road: not a cap but a tank (M168k)

«Ну ты 2 раза ездишь на работу с работы, выходные на дачу далеко, давай поднимем потолок + типо
учтём колебания такие.» A flat daily cap cannot do swings by construction: it cuts a weekday and a
trip to the dacha the same way, and nobody drives evenly.

So it is a **tank** now. 2 200 credits flow in every day, it fills to 14 000 — about a week — and a
trip spends what has accumulated. The inflow is continuous, not at midnight.

- A weekday with two commutes spends 300–600 against an inflow of 2 200: **the tank grows.**
- **The dacha, three hundred kilometres there and back, is paid in full** — roughly 6 700, out of
  what the working week put by.
- Driving all day every day settles at the daily inflow and no more. This is not a cap that
  punishes a big day; it is a reservoir that rewards not having driven.
- On screen it is a quiet line under the trip counter — «запас 14 000 кр» — so it can be watched
  going down instead of being a wall. Empty, it says so and the mode goes on being free and pretty.

It stays a pleasantry against the game's own scale: a trade leg is 300–600 credits, a fully
staffed HQ burns 300+ a minute, so the road's entire daily inflow is about seven minutes of upkeep.

---
## 0.158.1 — the road: a trip and a day are different numbers (M168k)

«Каждая поездка новые кредиты или в день ограничить, а то не понятно» — and it was not clear for
a good reason: the screen showed the **day's** figure under a line labelled «за поездку». Both
numbers exist and both matter, so both are now on screen and say which is which.

- The big counter and the kilometres line are **this trip** — that is what you feel at the wheel.
  Each trip starts from zero.
- A quiet line under them: «за сутки N из 3 000 кр» — the day's total against the cap, so the
  limit is visible instead of being a surprise. It is hidden on the first trip of a day, when the
  two numbers are the same.
- The journal line the author liked now reports the trip first and the day beside it: «дорога ·
  командировочные: 94 кр за 5 км (за сутки 210)».

The cap stays a **day** limit, as it always was — that is what keeps a car ride from becoming an
income stream. Credits themselves are earned fresh every trip.

---
## 0.158.0 — the road pays for what you actually do (M168k)

«Еду 5 км до дома, как-то скучно за 20 кредитов» — and the boredom was not only in the size of the
number. The multiplier grew with *elapsed time*, so sitting on a motorway earned exactly what
threading through town did: nothing you did at the wheel mattered.

- **Six credits a kilometre** instead of two.
- **A corner pays.** Every real corner earns a one-off bonus by its peak, paid once on the way out
  of the arc — with a flying credit and a short «ПОВОРОТ +N» by the hull. Small corrections are not
  corners, and below the speed gate nothing pays: a car park has plenty of "corners" and no driving.
- **The way home pays better.** Once the trip's distance from its start has grown and then falls
  back, the mode decides you have turned for home and the rate goes ×1.5 for the rest of the trip.
- In practice: five kilometres home with a few corners is now about **130 credits** against 20.
  The daily cap went 1500 → 3000; it does not bind on a commute, it binds on a long road trip,
  which is what it is for.

---
## 0.157.0 — the road: the exhaust, and every hull checked (M168k)

Three corrections from the author on the field-bloom frame. Full pass in
[docs/DESIGN-road.md](docs/DESIGN-road.md).

- **The glow around the ship is gone.** The idea was right — the hull flies over a lit field — but
  a patch of light around a silhouette reads as a nimbus, a separate object, not as illumination.
- **The exhaust has two habits now, not one setting.** At a standstill it is a breath: short, wide,
  softly spreading. From 22 km/h an afterburner takes over — the ribbon doubles in length, stops
  spreading (parallel edges read as a lance, not a cloud), a white-hot thread lights inside, and
  the gas shears sideways. By 55 the habit is new entirely; at 30 it is already clearly under way.
- **The lanes were adding up.** Each nozzle drew its own body, and `lighter` summed them where the
  jets converge — double for two nozzles, sixfold for the Топор's six, burning the tone to white.
  All lanes of a burst are now subpaths of one path, filled once.
- **Alpha and colour were pointing opposite ways.** Brightness lives at the nozzle, and that is
  where the palette was whitest, while the hull's own accent sat in the tail at alpha 0.07. Fixed
  in the palette, not the exponents: the Стриж's trail is mint now, the Вьюк's amber.
- **Gas has no outline** — the body is laid twice, a wide pale halo and the main fill inside it.
- **Proportions across hulls.** The old fit made wide ships *shorter* than slim ones (the Вьюк was
  0.106 of the screen height against the Стриж's 0.171, though it is a tug). Length is now shared,
  width is a ceiling. The combined jet width had ranged sevenfold between hulls — 0.032 of the
  screen on the Клинок against 0.241 on the Топор — and is now a fraction of the hull's own
  half-width, with stops at both ends.
- **Measured, and one real cost found**: `imageSmoothingQuality:"high"` on the field's upscale was
  19.7 ms a frame on its own — a CPU resampling path, indistinguishable from bilinear at this
  magnification. The field is also blitted only where it glows. The probe (`?g11`) now includes the
  road as a permanent step and reports **60 fps**, level with every other mode.

---
## 0.156.0 — the road: the light is a field now (M168k, "делай максимум")

The author lifted this mode's battery budget — «в этом режиме делай максимум, всё равно тел на
зарядке» — and the honest answer to that is not "more blobs". The glow is now computed **per
pixel**: the fragment shader from the recipe he brought, written on `ImageData`
(`27lb-road-bloom`). Details in [docs/DESIGN-road.md](docs/DESIGN-road.md).

- **Domain-warped noise** — `fbm2` displacing the coordinates of `fbm2`. That one trick is the
  difference between fog and liquid: strands that curl and pour instead of blobs that breathe.
- **Colour comes from the warp**, in patches that flow with the light, out of a 64-step table
  built each frame as a closed loop through the palette. Both other options were tried and both
  are wrong — index by position gives a rainbow strip, index by fine noise gives marble.
- **The spectrum enters by X**: the height of the light over each point of the bottom edge is
  that point's own band. The equaliser is not drawn any more, it is dissolved into the light.
- **The ship is lit by the glow it flies over** — without the bounce it read as cut out and
  pasted on.
- The exhaust holds the hull's own colour along its length instead of fading to cream, which next
  to a coloured field had it looking like a grey pipe.
- **Measured, because "battery does not matter" is not "the frame does not matter".** First pass
  cost 17.9 ms of a 16.7 ms frame. Two octaves instead of three (the third lies inside a pixel
  after the stretch), a narrower field (the stretch *is* the blur), and the field on its own
  26 Hz while the frame stays 60 — hull, trail, stars and numbers all keep moving. **2.6 ms a
  frame** after.

---
## 0.155.1 — the road: the colour was arithmetic (M168k)

Six minutes of a real city drive on film, with the microphone on, and three corrections from the
author: a rich palette, the game's own sound off, and stars that read as flight rather than
blinking. The full pass is in [docs/DESIGN-road.md](docs/DESIGN-road.md).

(0.155.0 was this same pass with a different bloom — light raised to the footer line and a dark
band beneath it. The author saw it and said no: it read as a horizon with a searchlight. What is
described below is what shipped.)

- **The sky was green whatever the music — and it was arithmetic, not taste.** Hue was mixed like
  an ordinary number, so the walk from cyan to amber went straight through green; the intended
  «violet-cyan → magenta-amber» was unreachable by that formula. The hot end is now written past
  360, so the path always rises through magenta, and the ship's accent is blended on the circle.
  The three nebulae, which sat 42° apart and added up to one wash, are spread round it; the
  bloom's satellites now stand farther apart than they are wide, which is what it takes for three
  tones to read as three.
- **The bottom edge glows, across the whole width.** The bloom used to flood the footer — a ray
  cut through «ВЫКЛЮЧИТЬ МИКРОФОН», «НАЗАД» stood amber on bright green — and the first fix
  (raise the light, black out the band under it) read as a horizon with a searchlight. Now the
  edge itself glows and five narrow plumes rise out of it, each holding its own tone, with black
  above; the buttons are carried by the footer's own glass, not by a hole cut in the picture.
  Height grows with energy only weakly — the frame is not supposed to be flooded.
- **The glow is liquid, and the music moves it in three places.** Plume shapes are driven by the
  engine's own `fbm2` noise (what a shader recipe would reach Perlin for, at five numbers a frame
  instead of a million pixels), and the wave now also yields bass/mid/treble: bass moves the
  height and the speed of the flow, treble puts a fine ripple on the edges, mid the density. One
  number moving everything is what makes a visualiser look mechanical. A touch is a flash that
  decays, not a drawn ring.
- **The exhaust stopped being two plastic tubes.** Additive alpha peaked at 0.8 and clipped every
  channel to white, the ribbon's colour was taken from a near-white core along its whole visible
  length, and the two plumes ran parallel to the bottom of the screen. Now: a third of the alpha,
  the body in the hull's own tint, and the plumes easing onto one axis.
- **Stars behave like travel.** The scale divided by 120 km/h while a city drive is 15–45, so a
  streak came out three pixels and the only motion left was a sine on alpha. The scale now comes
  from the speeds a tier actually sees, streaks are longer, and the twinkle fades out as soon as
  the car moves — blinking is for standing still.
- **The game does not sound in the road.** It was breaking through the music playing in the car.
  A companion mode shows; it does not play. The player's own sound setting is untouched.
- **Nothing but the screensaver is on screen** — the pads and, later, the parrot window had been
  leaking through — and the main loop stops drawing the world while the road is up: it is invisible
  under a full-screen mode, and battery is this mode's stated price. The sensor tap now also takes
  the screen full-size; the browser's furniture was eating a seventh of it.
- **A truth window for the sensors** — long-press, or `?road=diag`. Through the whole filmed drive
  the hull never left the centre and never banked, and the screen could not say whether the road
  was straight or the measure was reading zero. Six lines of live numbers instead of guessing. Two
  thresholds moved with it: full swerve at 0.24 g instead of 0.30 (an unhurried city corner is
  0.10–0.20 g), and the speed gate opens fully at 14 km/h instead of 20, because in stop-and-go the
  old ceiling shut it exactly where a car turns.
- **The reward is visible without being larger.** Each credit flies from the hull into the counter,
  and the combo says what it buys («×1.7 КОМБО · 3.4 кр/км») rather than an abstract multiplier.
- The hull is smaller, the microphone hint stops hanging for the whole trip, and the system name
  no longer stands on screen twice. The swerve limit was twice what its own constant says, so at a
  full dart the hull stood in the screen edge and bank cut it off — never seen on the road, because
  the swerve never fired.
- **A stand for the road**: `docs/mkroad.ps1` → `docs/road.html`, with synthetic music and speed, so
  the frame that gets edited every pass can be looked at without half an hour of traffic.

---
## 0.154.0 — the exchange stops being silent (online audit, part two)

The rest of the online audit ([docs/DESIGN-online-risks.md](docs/DESIGN-online-risks.md)). The
finding that drove all of it: in a single-player game with a cloud save, the dangerous party is not
a cheat — it is **silence**. The server cannot know what a player earned (it stores whatever the
client sends, by design, and that is the right choice), so nothing is at stake in anyone's numbers.
What *is* at stake is an evening of play that quietly failed to upload.

- **Every failed exchange now says so, once.** A push refused because the cloud is newer, a token
  that expired, a save that no longer fits, a network that is gone — all four used to return
  silently, and the player learned about it days later on another device, by not finding their
  evening. Now the state lives next to the purse — `облако · не отправлено` — appears only when
  something is wrong, and the journal explains it in one line. Success stays silent, as it should.
- **A failed push is retried when there is a reason to** — the network came back, or the player
  returned to the tab — instead of waiting for the next save that may never come.
- **One tab plays.** Two open tabs wrote to the same key, and whichever saved last won: a tab
  forgotten in the morning would overwrite the evening. No attacker needed — just opening the game
  twice. The tab opened last plays; the older one stops writing and says so plainly, so the player
  knows which window to continue in.
- **Storage failure is now loud.** In Safari's private mode, or with a full quota, the game was
  writing nothing and only admitted it inside the settings screen. Now it says so the moment it
  happens — once, with what to do about it.
- **A save timestamp from the future no longer freezes the cloud** (server side, 0.153.1).
- **An account can be deleted** — `НАСТРОЙКИ → ОБЛАКО → УДАЛИТЬ`, password required. Everything goes:
  the record, the email, the cloud save and its daily copies. There was no way to leave before.
- **The server keeps a daily copy of the save it is about to replace**, fourteen days deep. It
  deliberately keeps the *previous* state: the incident that actually happens is a broken client
  overwriting a good game, and a copy of the damage would be worthless. A copy off the host was
  declined by the author, knowingly — the risk is written down in the document.
- **The road and the trace no longer share one pilot mark.** Each was harmless alone; together, on
  one disk, they tied where a person drives in the real world to what they do in the game. Two keys
  instead of one.

`14-save` was split along the fresh seam: the snapshot stays, the exchange moved to `14a-cloud`.
Suite `91zzze-sync`.
---
## 0.153.1 — the door nobody was watching (online audit)

An audit of the online side, asked for in plain words: what breaks without a connection, how would
the server know what a player earned, what stops a cheat. Findings and reasoning live in
[docs/DESIGN-online-risks.md](docs/DESIGN-online-risks.md); fixed here is the one item where a
stranger could hurt everybody.

- ** and  create files on disk without an account and without a rate limit.** Both
  sweepers were a dice roll (), so a script creates files far faster than they
  are swept — and on shared hosting the inode table runs out before the disk does. When it does,
   stops writing *everything*, including other people's saves. Now: a generous per-IP
  limit on both (300 road calls per quarter hour — ten honest pilots; 30 trace drops), a sweeper
  that runs by the clock instead of by luck, and two directories that were never swept at all
  (, ) now are.
- **A save timestamp from the future froze the cloud forever.**  is the sending device's
  , and conflicts are resolved by newest wins — so one phone with a broken clock made
  every honest save older than the cloud copy, permanently. Anything more than a day ahead is now
  taken as the server's own time.

Not fixed, written down instead (they need the author): the sync state is invisible — a refused or
failed push says nothing at all, which is how a phone and a desktop quietly become two universes;
there is no guard against two open tabs; and the trace's three a day limit counts a pilot mark the
client invents for itself.
## 0.153.0 — the audit: five files cut, two lies found (M183)

An audit of the sources, asked for in three words: cut the files, check the tests, look at the
structure. Measured first, then acted.

**Two things the game was promising and not doing.** A search for `typeof X === "function"` guards
standing over functions that do not exist turned up `crewGift`: the deal «Он отработал и пришёл к
вам в звено — даром» told the player a hand had joined the crew, the guard swallowed the call, and
nobody came. Written now (`12a-crew`), and the guard is gone. The same sweep for never-referenced
symbols found Vega's two dead tables: `VEGA_GIFT_BAD` — the comment in `vegaSeatAct` had promised
«руда — ссора» since the day it was written, with no code under it — and `VEGA_DREAM`, the lines
for **home**, while at home she was speaking the ones from the ship's cabin («летаешь как баржа» in
her own kitchen). Both now say what they were written to say. Fourteen genuinely dead functions and
constants were deleted.

**The build now catches this class of bug**: a `typeof` guard over a function that exists nowhere
is flagged on every build. The project rule "a perk without code is a lie" applies to calls too.

**Five files cut along their seams**, no rewriting: `12tb-settle-draw` 57→44 KB (the six trades →
`12tc-settle-crafts`), `23a-dig-draw` 50→33 (the mountain → `23aa-dig-rock`), `20-life` 45→29 (the
beasts → `20f-fauna`), `21b-surface-deco` 46→30 (the eight landmark forms → `21ba-deco-shapes`),
and `26-ui-station` 50→36 — its 600-line `renderTab` could not be halved, but four tabs came out
whole (`26b-ui-station-work`), the way the cantina and the flea market already had. The guard's
list went from eleven files to seven, and two grandfathered entries were **removed** rather than
re-baselined: a concession that outlives its debt is permanent.

**The test report stopped lying.** It had printed «0 мс» for every run since the line was written —
`test.ps1` runs the page under `--virtual-time-budget`, where `performance.now()` does not move
between synchronous calls. It now prints what is actually counted (suites) plus real seconds
measured outside: `ВСЁ ЗЕЛЁНОЕ · пройдено 6980 · наборов 258 · 11 с`. The suite itself needs no
optimising — 258 suites and ~7000 assertions in eleven seconds, most of it Chrome starting up.

---
## 0.152.0 — the pads never go away (M182)

«Пусть кнопки на мобиле всегда доступны, они пропадают и это пугает». M181 dimmed ТОРМОЗ and
ДЕЙСТВИЕ instead of hiding them, but four separate mechanisms were still making buttons vanish,
and the loudest one was not on any list:

- **A touch on the world faded the whole row.** The "auto" pad mode was written for a desktop:
  reach for the keyboard, the screen clears. But a browser fires a compatibility `mousemove` for
  every touch, so on a phone **any** poke at the world dropped all pads to `opacity:.14`. Auto-fade
  now never runs on a phone (`padsAuto`); the explicit «СКРЫТЬ» setting still works everywhere.
- **ОГОНЬ and РАКЕТА jumped the row.** They were shown only where they could fire, so an armed
  player leaving the system lost ОГОНЬ, the row re-packed, and ПРЫЖОК moved under the thumb. The
  rule is now: **what the ship can do at all keeps its place** (dimmed when inapplicable); what the
  ship does not have takes no space — that is not "vanished", it never existed. Mount a gun and the
  button appears once and stays.
- **The row could not fit and nobody had measured it.** With six buttons at a fixed 56 px the last
  one ran off a 375 px screen — and had been doing so before this change. Button size is now
  computed from how many are standing (`padsFit`), from 56 px down to the 44 px finger rule and
  never below; it re-fits on rotation.
- **The belt's eight buttons** (pitch, yaw, fire, brake, cutter, thrust — all live) do not fit in
  one row at any legal size, so the left group folds into a D-pad: pitch above, yaw below. ◀▶ and
  everything to the right now sit at the **same coordinates in flight, on foot and in the belt** —
  guarded by a test that compares positions across modes.
- Found on the way: `.pads` declared `--padscale` on itself while `applyPadSize` wrote it to the
  root, so its own declaration always won — **the «Размер кнопок» setting had been doing nothing**.
  The variables now live on the row itself.

A dimmed button also went from `.22` to `.38`: at a fifth it read as a ghost, which is the very
thing the author was pointing at.

---
## 0.151.0 — the sky measured by the narrow side (M178, the author's morning screenshot)

Two faults from the author's phone screenshot, both real and both about scale:

- **«Гора в полкадра».** The far ridges' amplitude and stretch were one size for every screen. On
  a portrait phone the frame is as tall as a monitor but a third as wide — so the viewport caught
  exactly one featureless flank with not a single summit in it, and a mute mass owned half the
  sky. The far layers now shrink with the width (`FARK=clamp(W/1150,.5,1)`): lower amplitude,
  denser undulation, tiles baked per measure (the key carries it, so rotating the phone simply
  rebakes). On a monitor nothing changes — the factor is 1.
- **«Дыра в полкадра» и «дыра следует за кораблём».** Sky-body sizes were computed from the frame
  HEIGHT — honest on a monitor, ruinous in portrait, where the black hole and the gas giant
  ballooned to half the frame. Every body now takes the narrow side (`skyU()=min(H,W*1.05)`);
  desktops are untouched. And the parallax was clamped to a tenth of the screen, so on approach
  across the whole strip the body rode along with the ship like a decal on glass. The clamp is
  gone: the drift is free and slow (5% of camera travel from the strip's middle) — fly away and
  the sky stays, the body leaves the frame and is there again when you come back.

---
## 0.150.0 — a button dims, it never vanishes (M181)

The author's direct order: «кнопки не исчезают на мобиле». The M167 rule "no ghost buttons" hid
ДЕЙСТВИЕ and ТОРМОЗ entirely when they did not apply — and the whole bottom row jumped left and
right on every mode change, while the thumb remembers a *place*. An inapplicable button now stands
exactly where it always stands, dimmed to a fifth and deaf to taps (`.pads button.off`). The
ready-flag fix of 0.143.0 (a long verb no longer counts as "no action") feeds the same class, so
the two bugs cannot recombine. Guarded in `91zzx-mobile` on both desktop and `-Mobile` runs.

---
## 0.149.0 — the pirate base, pass 1: composition and bodies (M180)

«Пиратская база говно, там чё-то сверху всё, скафандр, человечки» — three faults, each named:

- **«Сверху всё»** — the ceiling owned the top third of the frame because the principal point of
  the projection sat exactly at screen centre. Composition is fixed the way a postcard is framed —
  not by tilting the camera (tilt shears the verticals) but by **moving the horizon above centre**
  (`CY=H*.44`): the frame belongs to the floor and to those who walk it. The camera also stays
  closer (118 instead of 150), so fewer rock cells wedge between it and the player, and a pool of
  light surrounds the walker so the near floor no longer sinks into black sludge.
- **«Человечки»** — figures floated glued to their cells: no body had a contact shadow. Foes and
  the player's suit now stand on ellipses of shade cast on *their* floor (with a sanity guard: a
  shadow is only drawn below the body — a foe spawned over a mezzanine used to cast one onto the
  ceiling).
- **Stickers became things.** The loot container was an orange rectangle in screen coordinates
  with a blinking dot — an interface label over a hall where everything else stands in projection.
  It is now the same `box()` as the hangar cargo: standing on the floor, catching its cell's
  light, casting a contact shadow, with only a tiny breathing beacon left on the lid. Medkits,
  armour and charge packs are small cases on the floor too, their icons shrunk to stencil marks on
  the lid instead of floating interface glyphs.

Passes 2+ (the enemy bodies themselves, the hangar set dressing, the walkway reading) follow after
the author's morning look.

---
## 0.148.0 — the hold laid out in piles (M179)

The author's reference was The Forest's inventory: everything you carry laid out as objects on a
surface, so one glance says what is plentiful, what is scarce and what is missing. In Drift the
hold was rows of «Кремний ×12» on the ship screen — a table.

The СТОЛ gets a ТРЮМ tab on the desk lane (`27j-ui-hold`): every resource is its own **pile**, and
the pile answers both questions without numbers. *What*: ice in split shards, iron in rusty
ingots, silicon in polished boules, organics in cross-tied bales, crystals as a druse, isotopes in
a marked drum, volatiles in standing cylinders, tech components as a board, missiles side-on with
their fins — and people sitting on the edge of the frame, the one kind of cargo that looks back.
*How much*: the pile grows with the count (a power curve capped at sixteen pieces, so a hundred
does not turn to mush); the number stays as a small caption — a reference, not the channel.

Layout is deterministic from the resource key, so the spread never jumps between openings; the
paper stays paper — the split the author asked for («мою просто под инвентарь, а бумагу под
новости») is exactly the desk/sheet split of 0.144.0, and the hold joins things and tapes on the
wood. Checks in `91zzv-table`.

---
## 0.147.0 — the postcard pass, 1: what the author circled (M178)

The author cropped four places out of his own screenshots and said «поправь, чтобы смотрелось как
открытка». Each crop turned out to be a real defect with a name:

- **The "ringed planet" was a black hole, killed by the atmosphere.** `skyHole` drew the same
  picture everywhere, only paler (`globalAlpha=dim`): through a day sky the bright accretion arcs
  faded to nothing while the huge dark lens still landed at a third of its strength — a black
  smudge with a barely-visible hoop. Day light does not work like that: what you see through a
  bright sky is only what is *brighter* than it. Now the darkness comes with the dark
  (`surfNight`, full only in vacuum) and the disc stays visible by day as a pale ghost — the way
  a daytime moon does. At night the lens returns in force.
- **The sky giant got a floor against the CURRENT air**, not the night tone: on a dim world its
  body could still sink below the sky and read as a hole. Both sides are now clamped above
  `lerp(sky[0],sky[1],night)`, the terminator quenches toward air instead of black, and a soft
  halo of the same air sits round the limb — the body hangs in the atmosphere instead of being
  cut out of it.
- **The black polygons in the ground got their edges.** The cave mouth on the surface was a flat
  `#050708` half-ellipse — the same "hole in the render" the author had already circled once on
  the boulder. It now has a lip that caught the sky, an interior that darkens with depth, and
  stones at the threshold. The mine's abandoned workings (flat `.92` black) got an interior
  gradient and a lit upper rim.
- **«РАНЕЦ» glowed through the thumb pads.** The jetpack bar — and the suit line in the cave, the
  depth line in the mine, the suit/ammo strip in the raid — were painted on the canvas in the
  bottom-left corner, exactly under the DOM pads. The canvas cannot know where DOM panels stand.
  All of them moved into the state row (`РАНЕЦ` is a proper hairline next to СКАФАНДР, shown where
  the jetpack is used) and the place line (cave gallery and depth, mine depth and stratum, raid
  ammo and armour).
- **On the phone the action prompt sat under the console glass** (the author's sixth crop). The
  bottom storeys are restacked with real heights — pads, console, state, prompt — and the prompt
  no longer reaches under the right rail either. `test.ps1 -Mobile` guards the stack.

---
## 0.146.0 — the world heard: room tone (M178-10)

The game had music, steps and events — and no *places*: between the notes every planet carried the
same dead digital silence. `09a-roomtone` gives each screen its own steady floor of sound, built
from two looping noise chains whose filters and gains are steered every frame — nothing is created
on a mode switch:

- **the surface is wind**, and its strength follows `weatherPower` — so a storm is *heard before
  it is seen*: the sound rises while the power is still under the visual threshold, and the sky
  is clear;
- **the cave and the mine are rock**: a low blind rumble, deeper — lower;
- **the house is warmth**: a quiet low floor, rare wood creaks (a new `creak` voice), and the
  weather outside heard *through the wall* — low frequencies only, quieter than outdoors but never
  silent;
- **the base is ventilation**, the raid a thin duct hiss, the scoop the stream against the hull;
- **vacuum is nothing at all** — the absolute silence of an airless world stays, as character.

The loudness budget holds: the tone is a floor, not a soloist — its levels sit well under any
event. Verified live on the dev stand by measuring the node output with an AnalyserNode (never the
AudioParam): wind RMS 0.008 on a temperate surface, zero after the atmosphere is taken away.
Suite `91zzzd-roomtone`: per-place requests, vacuum silence, storm-before-sight, the wall filter,
and no node churn.

---
## 0.145.0 — the house gets an upstairs, and a shell (M178-9)

The last unpaid item of the original M170 ask («полноценный Симс»): the living part now has a
second storey. And with it came a fault nobody had named: the house was drawn as a *room*, not as
a *cross-section* — two thirds of the frame above the ceiling were flat black. A house has
something above the ceiling and below the floor, and now it is drawn: joists and dark underfloor
at the bottom, a roof slope with rafters and attic silhouettes at the top — and where the upstairs
is built, the upstairs instead: its floorboards on the slab, blind silhouettes of its furniture,
its lamp warmth seeping through the ceiling. The camera came closer (`k` up to 3.2), so the house
fills the frame.

- **`29e-home-up`**: the upstairs is not a new mechanic — `hinRooms()` simply returns a different
  list when the player is up, so every part of 29d (walls, floor, lamps, doorways, folk) works
  unchanged. Two rooms, СВЕТЁЛКА over the study and СПАЛЬНЯ over the living part; they appear with
  the «жилая часть» tier, and there is no attic over the garage — sheds don't get lofts.
- **The stair is a thing, not a button**: a real flight with treads, a stringer and a handrail in
  the living part, lit from the opening above; upstairs it is a hole in the floor with a rail
  around it, warm light from below. Walk to it, ДЕЙСТВИЕ — ПОДНЯТЬСЯ НАВЕРХ / СПУСТИТЬСЯ.
- **Upstairs is furnished quietly**: a bed with a headboard, pillow and folded blanket; a bedside
  lamp; a chair with a coat thrown over it; a window with the night sky, stars and a cold pool of
  light (downstairs has no windows at all — upstairs they are the point); in the loft a wide
  window sill with a cushion, three pot plants and a low table with books. Every one of them can
  be examined (`HIN_THINGS.bed/loft`).
- **Somebody lives up there**: Vega moves to the loft window — exactly her place, nothing is
  decided there. Folk walk their own floor and never push someone through the ceiling
  (`f.up`, floor-aware ticking).

Nothing is persisted; the floor is as ephemeral as the position. Suite `91zzzc-home-up`: the
upstairs appears with the tier, stair and hole align, floors don't mix, the things are reachable.

---
## 0.144.0 — release look, pass A3: the table becomes paper (M177)

The desk top has been drawn since M151a, but what lay on it was a dark window of lists — the same
interface as everywhere else, only on a wooden background. At a desk you read **paper**.

- **The notebook is a sheet.** `#loglist` and `#lorelist` stop being a translucent box: warm paper
  with a margin and a red rule down it, entries typed in ink, the time a pencil note in the margin.
  Each kind of record has its own ink — the ether in blue, people in pencil brown, money in dark
  green, an alarm in dark red — instead of the same phosphor palette the rest of the interface
  uses. A page keeps its body even when two lines are written on it.
- **Things and tapes lie on the wood, not on the sheet** — paper on paper does not read. On those
  two tabs the list becomes objects laid out by hand: each with its own shadow and a degree of
  rotation, and unread ones marked with a wax dot rather than a phosphor outline, because that is
  how unopened mail is marked on a desk.
- **A clipping now looks like a clipping**: `drawThingIcon` grew a fourth form — a torn scrap with
  a headline and two columns — and the "found object" became a metal plate with a notch and
  scratches. Before, a newspaper cutting and a plate pulled out of a cave were the same grey
  rectangle, and on a desk a thing is recognised by its silhouette before its caption is read.
- **The active tab is a paper label** on the wood instead of a phosphor glow, and the sector on a
  thing's caption says «сектор 0:0» instead of a bare «0:0».

Everything is scoped to `body.table`: the station, ship, crew and HQ screens stay glass over the
world. Suite: the table's own checks in `91zzv-table` — a page rather than a strip, dark ink rather
than phosphor, things and tapes on the wood.

---
## 0.143.0 — release look, pass A2: the state moves down (M176)

Pass 1 hid the ship's instruments while on foot. This is the rest of it: **the top of the frame
is the world**. The glass panel that stood in the upper corners of every screen is gone — it held
the most expensive place in the frame for readings that change once a minute, and the rule "only
what is needed now hangs over the world" was being kept only halfway (it faded to a third, but it
never left).

- **The readings moved down, next to the console**: state on the left, place and purse on the
  right, both as hairline bars with a number — no glass, no border, no blur, just a line and a
  figure over the world. They still wake for two seconds on a change and stay open while an alarm
  holds (`hudWake` moved, it did not change).
- **A slope instead of a box.** A hairline over bright ground did not read, but bringing the glass
  plate back would bring the sticker back with it. Instead the bottom of the frame falls off into
  darkness — a gradient with no edges, so it is not read as an element, and it carries the state,
  the action prompt and the console together. It lives inside `.hud`, so when the instruments
  sleep, the bottom of the world is clean again.
- **The composition changes per screen.** On foot fuel and hull decide nothing — the suit does,
  and it is the thing that runs out, so on foot it is СКАФАНДР and ТРЮМ. The distance to the ship
  is deliberately *not* duplicated here: the edge chip already carries it, and that chip is about
  the world. The region instrument pod is a cockpit instrument and now shows in flight only; its
  glass plate came off too, since it stood shoulder to shoulder with the hairlines.
- **The place line stopped repeating the gauges**: it used to say "трюм 12/40 · скафандр 84%" a
  hand's width from the bars that said the same. Now it says what only it knows — the world type
  and weather on the surface, the depth in the mine, what the belt is made of.
- **The right rail came down too.** It hung under the old top panel; with the panel gone it was
  the one thing left above the world. It now grows upward from above the state line — at the edge,
  as the rule requires, but in the half of the frame where the hand is.
- **On a phone** hairlines are unreadable, so the state is one line of numbers above the console,
  between the thumb zones. The bottom is three storeys now (console, prompt, state), so the
  transient message went back up to where it lived before M167 — the top is free again, and a
  message is not a panel, it passes.

Two faults found while looking at the real frames and fixed here:

- **On a phone a long verb cost the player the action itself.** «Есть ли действие» was inferred
  from the button's own label: if it did not say ДЕЙСТВИЕ, there was something to do. But a verb
  longer than fourteen characters («СКАНИРОВАТЬ ОРГАНИЗМ») does not fit the button and falls back
  to ДЕЙСТВИЕ — so the button counted as empty, and the phone rule "no ghost buttons" hid it
  completely. There was nothing to scan with. The flag now means *there is an action*; the label is
  a separate matter.
- **The suit lamp lit the whole column of ground at night** — see 0.141.0; the same sheet also
  showed it here.

Tools: `docs/pageshot.ps1` takes a screenshot of the **whole page**, interface included —
`docs/shot.ps1` only ever captured what a stand drew on the canvas, which is why the interface had
never once been looked at this way; `docs/mkview.ps1` is the scene stand behind it
(`?s=system|surface|cave|night|lowsuit`). `test.ps1 -Mobile` runs the same suites in a 390×844
window: the layout guards skip themselves when the window is not a phone, so without it the phone
half of the interface was never actually measured. The overlap guard `91f-ui` was re-pointed at
the new neighbours instead of being disabled, and now also asserts that no reading panel hangs in
the upper half of the frame.

---
## 0.142.0 — the planets are lit by their own star (M175)

`planetLight` baked the shading layer with a light vector written into the code:
`nx*-.52 + ny*-.42 + nz*.74`. So **every planet in every system was lit from the upper left**,
whatever the star did — a planet to the left of the star and one to its right were shaded
identically. It is the same fault M172 fixed on the surface ("the light had an hour but no
direction"), still standing on the screen the player looks at most after the cockpit.

The fix costs nothing, because seen from above the terminator is a straight line through the
centre of the disc, perpendicular to the direction to the star. So the baked layer stays baked
once and is **rotated** at draw time by the planet's angle to the star (`planetSunRot`) — no extra
bake, no cache explosion. The rim layer rotates with it: its limb term is rotation-invariant, its
day-side brightening is not. The disc cache now takes the sun angle into its rebuild key, so a
cached disc cannot keep yesterday's light while the planet moves along its orbit.

How hard the terminator is stays as it was — a soft light. That is art direction and belongs to
the author.

Stand: `docs/mkplight.ps1` (`powershell docs\shot.ps1 plight`) — six planets ringed around one
star with a line drawn to it, plus the real system view.

---
## 0.141.0 — a species becomes a thing (M174)

The game kept a *register* of species — `G.species`, «Новый вид: …», the count on the map — and
there was no species. Every trait was an independent roll per specimen: two plants "of one
species" shared nothing, and the name was assembled from six form-words for twelve drawn forms
plus a trait word rolled independently of what was actually drawn. **The game kept a register of
species that do not exist**, and the interface reported that register to the player as discovery.

A species is now a property of the planet, next to `planetBiome(p)` — `20e-species`:

- **`floraOf(p)`** gives three to five plant species per world, each with a fixed form, fixed
  proportions, fixed branching, its own colour, its own growth range, and its own preference for
  wet or dry. **`faunaOf(p)`** gives two to four beast species with a fixed archetype, body
  outline, colouring and habit; archetypes never repeat on one planet (two mantas in different
  paint read as one species painted twice).
- **A specimen is species + age + place, and nothing else.** Age is a body, not a scale: a
  seedling has fewer segments, no branches to speak of, no flower and no fruit; an old plant has
  a wider crown, two or three dead bare branches, a lean and litter at its foot. A young beast is
  smaller and bigger-headed; an old one is heavier and slower.
- **The specimen answers its place.** The strip's wetness and how far this point sits below its
  neighbours decide vigour: in a hollow the same species stands taller, thinner-stemmed and
  fuller-crowned; on a dry ridge it is stunted, harder and closer to the rock in colour. Leaning
  is no longer a random roll — plants lean toward where the star actually stands (`sunSpot`), by
  an amount that is a property of the species, so a whole thicket leans together.
- **The name cannot lie by construction.** The form word is the drawn form; the trait word is
  read off the real flags. Two lies were found this way and fixed rather than renamed: a spiral
  or ribbon plant called «светящийся» had no glow drawn at all, and no alien beast archetype drew
  glow either — so a «панцирник, светящийся» did not glow. Spines are now a real species trait
  that is drawn, common on dry and cold worlds. Cave flora is its own list: glowing species of the
  planet, or two of the cave's own if the planet has none — the old code took a surface plant and
  switched its glow on, leaving the name unchanged.
- **The register counts species, not bushes.** A second specimen of a known species is not a
  discovery: full data once, a quarter for a repeat observation, and `G.bio` counts new ones only.

Old registers are not carried over: a save without `bioV:2` loads with `G.species` emptied — its
entries name species that never existed. Everything else in the save is untouched and the format
is still `v:4`.

Two faults found by looking at the sheet and fixed here as well:

- **The cave mouth could land on the landing pad.** "Far from the ship" existed only in a comment;
  the position was thrown across the whole strip. On the pad the prompt and ДЕЙСТВИЕ belong to
  the ship, so the cave became unreachable. The clearance is now computed, and a test walks forty
  seeds to prove it.
- **At night the suit lamp lit the whole column of ground down to the bottom of the frame**, with
  a razor-straight vertical edge on both sides — the lit strip was clipped from the terrain
  profile to the bottom of the screen, so the geological cross-section glowed. Light does not
  pass through rock: the strip now follows the profile, is shallow, is built from five thin layers
  so it has a falloff into the ground instead of a bottom edge, and starts behind the walker's
  feet so it has no vertical seam.

Stand: `docs/mkbio.ps1` (`powershell docs\shot.ps1 bio`) — species of one planet, the age of one
species, one species across five places, the beasts, and three real strips plus night. Suite
`91zzzb-bio`.

---
## 0.140.0 — a plant gets a body, not a fill

Half of the author's «растения всратые» was fixed in 0.139.0 — where they stand. This is the
other half: what they are made of. Every one of the twelve forms was painted in a single flat
colour: no light across a leaf, no difference between stem and crown, no difference between
neighbours. On a frame that reads as an appliqué of coloured paper, and no amount of placement
cures it.

It is fixed in one place. `stemC` and `leafC` stopped being colour strings and became gradients
in the plant's own coordinates (origin at the root, up is negative), so every `ctx.fillStyle=leafC`
in all twelve forms gets light and shade for free. The light comes from where the star actually
stands (`sunSpot`, 0.138.0), and the tone wanders ±12% between neighbours from a hash of the
place — so a thicket stops being one patch of paint. The hash matters: an extra `r()` call would
shift the generation of the whole strip, which is how 0.139.0 broke the Tin suite.

One trap found by the tests, worth writing down: a form that builds its own radial gradient was
passing `leafC` into `addColorStop`, which now receives a gradient instead of a colour. Inside
another gradient you need a colour, not a fill.

**What this does not fix** is that there is no biology behind the picture — see the queue written
for the next session at the end of `PLAN.md`: neither flora nor fauna has a species, only
per-specimen dice, and the game keeps a register of species that do not exist.

---
## 0.139.0 — five things the author pointed at (M173)

The dev stand went up (`dev.ps1` → `/dev.html` and `/dev/`), the author played the build and
pointed at things one at a time. Every line below is a fault **he saw on his own screen**.

**"What is this at all?"** — a black polygon in the ground. It was the near-plane boulder of
`drawForeground`: filled at `amb×.30` with no contour and no material, so on dark ground it
stopped being an object and read as a tear in the render. It now has a body that darkens
downward, two chips, and — the point of the fix — **a lit edge along its top**. The rule is wider
than one rock: any silhouette in this game must carry an edge that caught the sky, or the eye
reads "nothing was drawn here" instead of "a dark thing".

**"The plants are ugly, and they clump."** Cluster centres were picked as the best of three
throws across the whole strip, lowest ground wins — and a strip has one hollow, so every cluster
walked into it: half the screen a wall of foliage, the other half bare. The strip is now divided
into as many stretches as there are clusters, and each looks for its low spot inside its own
stretch. Plants within a cluster are spaced instead of thrown, and each carries a depth — far
ones smaller and fading into the air, near ones full. (First attempt drew that depth from the
shared RNG and shifted the whole strip's generation, which failed the Tin suite; it comes from
its own hash now.)

**"This is rubbish too"** — the ringed planet in the sky, a black disc with a hoop. Three causes:
the body took the palette of the planet *underfoot*, so a dark world gave a dark disc and a .86
terminator finished it into a hole; the light always came from the right whatever the star did;
and the ring was two thin arcs of equal brightness front and back, with no planet shadow and no
divisions. The body is now lit from where the star actually is, mixes the star's colour so it can
never go black, and the rings are five bands of different width and brightness with the planet's
shadow lying across them, the far half dimmer and the near half half-transparent over the disc.

**"The lamp just doesn't light anything"** — and that was 0.138.0's own cone: a milky wedge laid
over the world, over the sky as well, with nothing under it getting brighter. What you see at
night is not the beam, it is **the lit ground**. A strip along the terrain profile in front of the
walker now genuinely brightens, added over the rock so the material still shows, falling off with
distance; the airborne beam stayed, faint and narrow, and only where there is atmosphere.

**The home read as a warehouse.** The wall was bare from waist to ceiling, and the eye measures
height by things, not by paint: a dado, a skirting and a beam give it three horizontals, and the
ceiling came down from 2.6 man-heights to 2.3. Every room got one object **in front of** the
walker, cropped by the bottom edge, so a room has a front and a back instead of one flat plane.
Residents got depth and elbow room — five of them used to stand on one line, shoulder to
shoulder, reading as a row of identical cut-outs.

---
## 0.138.0 — the light gets a direction (M172, the world on foot)

The walking screen is the longest one after the cockpit and the last one still
without a pass of its own. Looked at whole — full frames, no crop, noon and
midnight side by side (`docs/mkfoot.ps1`) — and four faults were plain.

**The light had an hour but no direction.** `celSun` has told the game what time
it is since 0.102.0, but the star itself was nailed to `W*.78, H*.16`: the hour
changed only how dark the frame was. Noon and dusk were the same picture at
different brightness, and the star never set. Now `sunSpot(p)` (19c-light) is the
one place that says where it is — east on the left, west on the right, overhead
at noon, below the horizon at night — and the glow, the disc, the sky calendar,
the clouds' lit side, the shafts and the rim on the suit all take it from there.
The bloom moved from a full-screen baked layer to a sprite blit, because a layer
would have to be re-baked at every step of the sun. Two signs disagreed and one
was wrong: the sky's horizon glow sat on the *opposite* side from the star.

**Night was a flat wash.** One `fillRect` over the whole frame darkened sky and
ground alike, the ridge silhouette dissolved, and midnight read as fog. Night is
now a gradient with a value structure: the sky keeps most of its light, the
ground goes deep, the horizon survives as a line, and when the star has just set
its afterglow stays on its own side of the sky.

**The lamp was a glowing man.** A 150 px symmetric ball around the helmet. It is
a headlamp now: a narrow cone forward along the look, a hot pool where the cone
meets the ground, a small halo at the helmet.

**The far ridges were a straight line.** Both distant layers used the terrain of
the ground underfoot stretched 3.6× and 2.4× sideways with the same amplitude —
across one screen almost nothing was left of the relief, and the horizon read as
a band of haze glued to the sky. They have their own amplitude now (×2.3 and
×1.6, baked once per planet), so there is something to measure distance by.

Two more: the horizon sits at `SURF_HOR` (.64 instead of .58, one constant
instead of three magic numbers), because 42% of every frame used to be the
cross-section of dirt under the player's feet — the largest and emptiest area of
the picture; and the walker gets a rim light on the star's side, because at 26 px
he was the same value as the ground and had to be *looked for* on the screen
where the player spends most of his time.

Measured on the same machine, same window, against the 0.137.0 build immediately
before: surface 48→48, belt 60→60, dig 60→60, cave 60→60, landing 55→57,
system 47→46, scoop 42→37 (scoop has no code from this pass in it and has
swung 42–60 between runs before). New tool: `docs/g11.ps1` runs the built-in
`?g11` probe headless and prints the numbers — **never** with
`--virtual-time-budget`, which fast-forwards timers and measures the
fast-forward instead of the frame.

---
## 0.137.0 — somebody was here before you (M171)

The first thing in the game left by another living player, and it arrives
without a word. A pilot standing beside his ship can cut his mark into a stone
and leave up to five units of cargo at its foot; somebody else, landing on that
same planet, finds the stone, takes what is under it, and the goods are gone for
everyone. `11ag-trace`, `a=trace` in `site/api.php`, suite `91zzza-trace`, design
in [`docs/DESIGN-trace.md`](docs/DESIGN-trace.md).

**Nothing a human types crosses between two games.** What crosses is a mark —
one of twelve shapes — a six-character "hand", a resource key and a count. There
is nothing to moderate because there is nothing to write. The mark is not chosen
either: it is derived from the anonymous pilot id the road companion already
uses (`localStorage.drift_pilot`, random, no account), so a pilot has one mark
for life and cannot pick a shape to mean something with it. None of the twelve
means anything, and the game never explains them.

The hand is the whole of recognition: when you take a mark cut by a hand you have
met before, the notebook writes «Рука та же.» and stops there. When somebody
takes yours, your next landing brings one ether line — «ваш знак подняли» and how
many. Never who, never where.

Caps: three left per real day, eight kept per place, thirty days of life, one
request per landing throttled to twenty seconds. Offline is the normal mode, not
a degraded one — on `file://` there are no traces and no action to leave one, and
the interface says nothing about it.

Drawing took five passes and the fourth of them changed the design. The mark was
meant to be cut into the ground; it read as a stick jammed into the dirt, and no
amount of size or contrast fixed it — the game looks at the world **from the
side**, where a mark lying flat has no surface to be seen on. So the mark is cut
into a stone the pilot sets up: a vertical face is the only plane this world
shows whole, and setting a stone on purpose is truer to the act anyway. The stone
is chest-high to the walker, its silhouette broken out of the hand's hash so two
of them are never twins, with sacks at its foot. Stand: `docs/mktrace.ps1`
(twelve figures large, then two worlds at walking distance and at ×3).

---
## 0.136.4 — the wave glows like the reference (M168j)

The author brought screenshots of Yandex Music's "Моя волна" cover: a bloom of
light radiating from the centre, several distinct colours at once, the palette
following the mood of the track. The road's bottom glow was a flat single-hue
wash by comparison.

The bottom of the road screen is now that bloom: a core in the mood colour, two
satellite blobs with hues shifted ±115° — an energetic track lands on
magenta/amber/green, a sad one on cyan/green/violet — and a fan of seven thin
rays whose lengths are individual bands of the spectrum: `RD.wave`, computed
since M168b, is finally drawn rather than merely smoothed. Everything breathes
with energy, the beat pushes the core, and the whole thing drifts slowly so it
never reads as a static sticker. The flat wash survives only as a thin strip at
the very edge, laying light under the buttons.

The author's M168c ruling stands: no curve-band over the footer.

## 0.136.3 — the road hears the music and shows its engines (M168i)

A second evening drive on video. Three complaints, all confirmed by the frames.

**The music barely showed.** The capture is deliberately raw (AGC off, for Android
Auto), and from a phone microphone the car speakers arrive at an RMS of 0.05–0.15 —
on an absolute scale the nebulae hardly breathed and a beat never crossed the
threshold. The analyser now normalises against **its own slow-decaying peak**
(half a minute): the loud passage of a track is one, a quiet verse is its share of
one, so the track's dynamics survive while the absolute level drops out of the
equation. Beat detection went relative for the same reason. The nebulae, the bottom
glow and the engine flare (which now pulses on the beat) all got brighter to spend
the signal they finally receive.

**The stars were invisible.** Brightness floor lifted, palette brightened two
steps, each star twinkles on its own phase, and a large near star at standstill
earns a cross-glint — which fades out in motion, where it read as a "T" pinned to
the streak.

**Braking showed nothing.** The hull's own nose thrusters are three pixels at this
scale. The road now draws its manoeuvring jets in screen space, under the hull:
braking fires two cold splayed cones forward from the shoulders, pulsing out of
phase; a hard turn fires a short lateral puff from the nose on the side opposite
the swerve — the jet that explains who is pushing the hull. Cold blue-white, so
they never read as the main engine.

**Bluetooth microphone = dead music for everyone.** On top of the Android Auto
call-detection problem: if the capture lands on the car's Bluetooth microphone, the
headset is switched to the hands-free profile, which cannot play A2DP music at all.
The road now enumerates devices after permission and re-opens the capture on the
phone's **built-in** microphone whenever the default turned out to be a
bluetooth/hands-free/headset device (a pure function, `roadMicPick`, covered by
tests), and marks the track `contentHint="music"`. A car may still show a phantom
call — that part is the head unit's own guess and no web API can veto it — but
declining it from the wheel no longer kills the capture or the music.

Also: the trip line now carries the trip's top speed — "за поездку 2.10 млн км ·
макс 26 389 км/с".

## 0.136.2 — the microphone is a separate yes (M168h)

Plug in Android Auto and the head unit sees an open audio capture, decides a call is in
progress, and ducks or kills the music. The road screen was asking for the microphone
inside the same "РАЗРЕШИТЬ ДАТЧИКИ" tap that turns on GPS — so anyone who wanted the
feature at all got the microphone whether they wanted it or not.

The microphone only ever fed the mood colour of the wave, and without it the wave breathes
on its own. So it is now split off:

- **Sensors and microphone are separate consents.** The button turns on what the screen is
  actually for — GPS, motion, wake lock. The microphone is a second, deliberate tap, and
  it is off by default. The button names the next action: "СЛУШАТЬ МУЗЫКУ", then
  "ВЫКЛЮЧИТЬ МИКРОФОН", so it can be killed mid-drive without leaving the screen.
- **When it is on, the capture is raw** — `echoCancellation`, `noiseSuppression` and
  `autoGainControl` all off. Echo cancellation is what pushes the stream onto the voice
  route, and it is that route the head unit reads as a call; an unprocessed capture is
  usually taken for a recording instead.
- **Its own `AudioContext`**, not the game's. If the system does switch a context into
  communication mode, let it be the empty analyser context rather than the one the game
  plays through.
- **The cost is stated on screen before the tap**, not discovered on the motorway:
  "микрофон: цвет по треку, но Android Auto примет за звонок". While it is listening the
  screen says so.

The choice is remembered in `G.road.mic` and survives a save.

## 0.136.1 — the road companion measures the road, not the cradle (M168g)

Four minutes of real driving on a phone, watched frame by frame, turned up two faults
that had nothing to do with each other and one that explained the rest.

**The exhaust was a stack of bricks.** The ribbon was drawn as a hundred separate
strokes composited with `lighter`; the overlap at every joint piled up, the width grew
in steps, and the result was two rigid pale columns running from the engines straight
off the bottom of the screen — across the НАЗАД button. It is now **one body per
nozzle**: a single filled shape with a lengthwise gradient, quadratic falloff (the fix
the flight trail already carried), and a lifetime tuned so the ribbon is always the same
length on screen and always burns out inside the frame. The bottom fifth of the sky
fades to background, so the footer stays clean whatever the ship is doing. Points are
laid at a fixed step along the path rather than once per frame, so the ribbon has the
same density at 30, 60 and 120 Hz.

**The trip counter reset every minute.** `roadDayReset` compared against the *game* day,
and a game day is sixty seconds of real time — so "за поездку" and the credit tally were
wiped mid-drive, over and over, and the daily cap never applied to anything. The road day
is now the calendar day.

**A cradle is never level, and that was being read as a permanent turn.** A mount tilted
by 10° adds 1.70 m/s² to the lateral axis — 0.17 g, more than an unhurried city corner is
worth — so the ship lived pinned to one edge. Dividing by a larger number cannot fix that:
it flattens the real corner along with the tilt. The measurement was rebuilt instead:

- an **auto-zero** learns the resting gravity vector of the cradle, and learns it only on
  the straight, so a corner cannot be absorbed into the baseline;
- the lateral axis is taken in a **frame built from gravity**, not from the screen, which
  removes any static tilt on both axes at once — it only gives up when the screen's own
  X axis stands near vertical, and then it says so instead of inventing a turn;
- the **turn itself is the yaw rate about the vertical**, projected out of `rotationRate`,
  which does not care how the phone is mounted. It is converted to lateral acceleration by
  a = v·ω so both sensors share one scale in m/s²: agree and the larger wins, contradict
  and the smaller does.

`gamma` from `deviceorientation` is gone. A cradle stands the phone nearly upright, which
is next to the singularity of the Z-X'-Y'' decomposition, where `gamma` jumps at any
nudge — that was half of the twitching. The other half was `Math.random()` per frame
driving the shake: it is now a smooth two-tone wobble with a kick on a real pothole, and
the shake level is read from acceleration with the cradle's tilt already subtracted, so a
smooth road no longer holds it at the ceiling.

**And the frame has air in it.** The ship is a fifth of the screen instead of a quarter,
the swerve reaches further out — clamped by the hull's measured half-width, so it can ride
the very edge without ever being cut — every star has its own size, length and brightness
with a near-static dust layer behind them, and the nebulae are bright enough that standing
at a light is no longer a black screen.

The screen half of `27k-road.js` moved to `27l-road-draw.js`; the file had passed 40 KB.

## 0.136.0 — "Home" (M170)

The home stops being a panel and becomes a house. It stands on its own planet in
its own system: land there and the navigator shows **ДОМ** among the markers, walk
up and the porch lamp is already on, the chimney is smoking, the window is lit.
The yard is cleared, the house sits on a cut terrace, and every tier you have
earned is out there — the garage with its doors, the display case, the workbench,
the mast with the beacon blinking.

**ДЕЙСТВИЕ at the door takes you inside.** The eight tiers are eight rooms you
walk through, with openings that show the next room's light and blank masonry
where the house has not grown yet. Each room has its own floor and its own things
to stand next to and look at — the mattress it all began with, the crate that
serves as a table, coats on hooks, the boat under a cover, the display case, the
workbench and the machine, the desk and the wall map, the bed and the common
table, the beacon console. And the people who live there live there: Вега sits in
the study, gets up, walks and works, and answers when you hail her; the lodger
keeps house, the trainee fiddles in the workshop, off-duty crew rest in the hall.
They step aside when you crowd them.
---
## 0.135.0 — "Looked at again" (M169)

A graphics campaign, screen by screen, against close-up shots rather than memory.

**The settlement** was a row of identical boxes one human tall, stepping down a slope, with the
kiln, the forge and the weir drawn exactly alike. It is a place now: a terrace cut into the hill
with a retaining wall and a trodden street, homes in the middle and crafts at the edges, every
third yard in a smaller sky-tinted back row, a body for every craft (dome kiln with a firebox,
open forge with hearth and anvil, dam with a pond and a spill, saw trestles, still with a worm
and barrels, field with beds and a scarecrow), four dwelling plans with porches and lean-tos,
stone footings, real windows and doors, log-end woodpiles, laundry and barrels between the
yards, a fence and a gate, a communal fire whose smoke is the settlement's column, and villagers
who walk and work. The word ПОСЁЛОК printed over the roofs is gone: a place that needs a label
is drawn badly.

**The mine** got its rock — cloudy tone and temperature, jointing that runs across tiles, a
mineral dyke, damp stains, and abandoned collapsed workings with rotten timber about one per
screen of depth. **The cantina** got a host: a barkeep who wipes, pours, reaches for the shelf
and leans on his elbows, patrons who sit in different poses, and a bottle wall with three
silhouettes instead of one rectangle repeated forty times. **Deposits** stopped being interface
icons and became outcrops with a form per material. **The ground cross-section** — half the
surface screen — is broken by faults with lenses inside the layers. **The gas giant** grew shear
rolls along its band edges.

Two real bugs fell out of it: a page that loads hidden left the canvas 0×0 forever, and the
corona's push cut off at the overheat rim so a hull hovering there vibrated. Frame rate after the
campaign is unchanged (system 55, belt 60, landing 51, surface 48, dig/cave 60, scoop 55 at ×2).
---
## 0.134.0 — "Company on the road" (M168f)

Pilots riding the same real-world sector are no longer just a count: they fly alongside as
distant fellow ships — a spark with an exhaust, each at its own depth with its own drift,
slowly overtaken. The picture is deterministic per sector, so everyone in the cell sees the
same companions; counts fade in and out instead of blinking.
---
## 0.133.0 — "Measured, not guessed" (G11 closed, M168e)

G11 closed by an honest measurement: the game carries its own probe now — `?g11` tours the
modes and reads rAF fps in a visible tab, `?g11=deep` mutes draw passes one at a time. Warm
cruise at ×2: system 56, belt 60, surface 55, mine/cave 60; the scary 44s were cold starts
while chunks bake. No pass dominates, nothing to bake blind. Two faults the author found by
playing: the corona now pushes with a force that grows from the rim inward, so a hull hovering
at the overheat line no longer vibrates across it; and the scoop's prompts finally call the
exit button by its on-screen name — «ВЫХОД», not the nonexistent «НАЗАД» (leaving a gas giant
was impossible to find, not impossible to do). The road companion (M168e): music is a
breathing gradient from the bottom edge, the hull is 40 % smaller and sways outward in turns,
acceleration pulls it up and braking down, the nozzles drag the real flight ribbon, HUD text
stacks without gaps, and the land is mapped onto the universe — a ~2.8 km GPS cell is a named
system, with other pilots in the same cell counted through the site (`api.php?a=road`,
anonymous tag, no coordinates leave the phone).
---
## 0.132.0 — "Nose up" (M168d)

The author's first real ride fixed the geometry: the road companion now flies **nose up** — on
a portrait phone the road is ahead, stars stream downward, the hyperdrive tunnel converges above
the ship, beat stars fall from the top. The nozzles pull **trail stripes** in the same colours
as the in-flight trail (`trailTint` core/mid/edge). In a real turn the hull **darts off centre**
(lateral acceleration + tilt, up to a fifth of the screen) and then recentres slowly — quick to
the side, gentle home. Suite `91zzy` follows the new centre.
---
## 0.131.0 — "Gradations" (M168c)

The author caught the 3–300 km/h window pretending to be common sense. Three tiers now, with a
four-second hysteresis: **ДОРОГА** to 200 (car), **ЭКСПРЕСС** 200–400 (a train — star streaks
stretch double), **ГИПЕРДРАЙВ** 400–1000 (a plane — a converging star tunnel, a light cocoon
around the hull, the flame a step up, and the big figure switches to fractions of light:
850 km/h × 1 000 000 reads **«0.79 световой»**). Above 1000 km/h the road is not believed. The
sub-line trims itself on narrow screens. Suite `91zzy` knows the tiers.
---
## 0.130.0 — "The road pays and the music breathes" (M168b)

The road companion, second pass by the author's notes. **Credits, not ice**: 2 cr a real
kilometre with a live ticking counter, and a **combo** — drive without stopping and it climbs
to ×3 over twenty minutes, stand two minutes and it burns; the day cap is a soft 1500 («взломают
— сами дураки»). **Acceleration and braking play**: the GPS speed derivative pitches the hull —
nose up and a fatter flame on throttle, a forward dip and the fleet's own nose thrusters on
brake. **The equalizer is gone** after an honest self-critique (linear bins, boxy winamp bars,
jitter, deaf colour): in its place a smooth glowing **wave** of log-spaced, time-smoothed bins,
and **nebulae that change colour with the music's mood** — energy × spectral brightness choose
the hue (violet-cyan calm → magenta-amber loud), blended with the colour of your own hull, the
way «Моя волна» blends the track's colour with yours. Loud beats spawn stars on the path;
touching the screen rings a white pulse. Suite `91zzy` rewritten for credits and mood.
---
## 0.129.0 — "The road companion" (M168)

`27k-road`, from the author's voice note: when the player actually travels — a car, a bus, a
train — the game becomes a living screensaver. The МЕНЮ door «В ДОРОГУ» opens a full-screen
mode: your own hull, large, flying — banked by the phone's gyroscope in real turns, shaken by
road vibration, flames growing with speed; stars stream past; the bottom edge is a microphone
equalizer, so if music plays in the car the ship flies to it (a synthetic pulse when the mic is
denied). The numbers are real and fantastic at once: GPS speed ×1 000 000 (90 km/h reads
«25 000 км/с»), the trip in millions of km. The road pays **ice** — a unit per real kilometre,
40 a day at most, granted into the hold on exit with a record-book line: a pleasantry, not an
economy source; speeds under 3 and over 300 km/h do not count. Sensors start from one button
(iOS gesture rule), Wake Lock keeps the screen on, and the entry line admits the battery is the
price. Suite `91zzy`.
---
## 0.128.0 — "The phone edition" (M167)

The six faults from the author's phone review, in order. **The receiver is a ticker**: on
narrow screens the console strip spans the bottom in one line — band chip and running text; a
tap opens the knob sheet for two seconds, then it hides; no floating window. **Thumb zones**:
КАРТА and МЕНЮ drop to the lower right, the zoom buttons are gone — pinch is the gesture (it
already worked). **No ghost buttons**: ТОРМОЗ is absent on the surface instead of faded, and on
phones ДЕЙСТВИЕ without an action is absent too. **One hint slot**: the message and the prompt
are single lines above the console; the surface hint ellipsizes instead of running off the
plate. **Edge chips**: off-screen targets in system and surface views are plates pinned to the
frame's edge — arrow, name, distance — stacked overlap-free instead of floating over the sun.
**The fit screen is split** into КОРАБЛЬ | СКАФАНДР tabs; kit rows keep name, a class chip and
a "new" dot on one line. **The suit doll**: the white block-robot is replaced by a layered
paperdoll composited from the equipped pieces — three families of palette per place (issue
canvas, institute white, expedition olive), layers pack → boots → torso → gloves → helmet →
lamp, one outline, one light; wear reads as scuffs and a dull visor; the doll breathes and the
lamp sways; **the same palette walks the surface** (`drawAstronaut` now dresses from the kit).
mechanics.html gets a one-column phone layout. Suite `91zzx`.
---
## 0.127.0 — "Dominoes" (M166)

`11af-domino`: dominoes at the table — three turns, a chain, a hand of three tiles seeded by the
day and the place (reopening the screen does not redeal), «стучу» when nothing fits. In the
cantina the opponent is a rival (or Vega when she flies with you); at home, Vega or the mate. The
stake is never money: a win pays a rumour or a spare part, a loss costs a quip. With Vega any
outcome is a quarrel — «Ты ПОДДАВАЛСЯ» or «Я выиграла. Ты расстроился.» — those are her rules.
Beside the table stands a chess board; only Varlamova played it, and after she leaves nobody
sits down. Suite `91zzu`. **The joys (M164–M166) are built; the fourteenth pass's play queue is
done — M167 (mobile) and the release look remain.**
---
## 0.126.0 — "The wall newspaper and the request concert" (M165)

`11ae-concert`: the station's folk layer. On ДОСКА hangs a drawn sheet — «СТЕННАЯ ГАЗЕТА» with
three cells: a caricature (a barge that was late; with a bad reputation here, it is you, leaning
forward in a hurry), a «МОЛНИЯ» about the plan (fed by the expedition collection and closed
needs), and a keeper's four-line poem, changing weekly. Below it the **request concert**: once a
day, for 10 cr, a greeting to a named station — its three-note call sign (seeded, stable) plays,
the line goes to the ether, the record book notes it, Vega demands one too («нет, не сейчас — я
обижусь, что по заказу»), and sometimes a rival answers with a greeting «борту, который передаёт
приветы». Suite `91zzt`.
---
## 0.125.0 — "The space zoo" (M164)

`11ad-zoo`: the Bulychev key made whole — the parrot was Govorun, now the beasts travel. A
scanned beast can be caught on the surface (a cage takes one hold slot; it grumbles; Vega is
loudly against), carried home and settled into the «живой угол» of the living part (three pens,
drawn in the room with silhouettes from each beast's seed). They eat organics from the hold every
other day, mutter to each other, and occasionally escape into the study, where they are found
sitting on the record book. The counter at the core of the Grove region is a **zoo station**: it
takes beasts as cargo, pays, and writes to the record book. Not a farm: the pen holds three and
earns nothing. Suite `91zzs`.
---
## 0.124.0 — "The trainee" (M163)

`11ac-trainee`: the opposite of Vega — a stowaway boy found in the hold after a bazaar, who
wants to be a cosmonaut. He takes the seat on the console (Vega stays home and says so; she will
not board while «мальчишка в кресле»), touches the instruments for the first five jumps, reads
the charts after (the nearest need, once a day), asks to be sent on a run after fifteen, and gets
his diploma «пилот 3-го класса» at a science counter — then leaves on his own hull. A year later
his voice is on the ether with your call sign. Suite `91zzr`.
---
## 0.123.0 — "The institute" (M162)

`11ab-institute`: the plan was numbers; the institute is people with topics. Six topics with
leads in the Strugatsky key («тема 7-Б · плывущие часы · Привалов», «тема 12 · сигнал вне
диапазона · Ойра-Ойра», «тема 4-А · ответная лента · Выбегалло» — which duplicates 7-Б, and
that is their business) are offered as letters at science counters; a report is handed as a
tape, a foreign piece of the kit, a closed need or a handed-in find. Three outcomes: closed
(a voucher), «зайдите через неделю» (and then maybe «не в тот отдел» — a month later it
surfaces with a reprimand in the record book), or «закрыта за неактуальностью» the morning you
deliver. The voucher: land on any ocean world and rest three days by the ship — the crew's
morale is full, Vega will not leave the water, the parrot has a tan line. Suite `91zzq`.
---
## 0.122.0 — "The record book" (M161)

`11aa-record`: the player's biography, written by others. `recordAdd(author, text)` is called by
the stations (a need met, an order closed, a rationalisation), the institute (a tape or a find
handed in), the people (a letter delivered, a traveller brought), Vega («дома не бывает», later
«скучный. Это хорошо»), the sixth («рекомендация: считает. Не объясняет. Годится.»). One page on
the table (КНИЖКА): service length in years of the sky, entries newest first — and a test guards
that none is in the first person. A station with three entries puts the pilot's name on its
board of honour — the only award in the game. After twelve years a medical commission at the
core of the hours county grounds the pilot: «к полётам не допущен» — the quiet ending, a pension
at home, with Vega and two parrots if it came to that; the last entry is the parrot's. Suite
`91zzp`. **The second act (M154–M161) is built.**
---
## 0.121.0 — "The Island" (M160)

`11y-island`: the pirates as those who left — Efremov's Island of Oblivion, pitied rather than
fought. Three letters to the Island (a former hire, Quiet Efim, Aunt Ustya's sister) are offered
at counters once the circular is out; with one on the table, the pirate base's prompt changes
from АБОРДАЖ to СЕСТЬ С ПИСЬМОМ — no fight, no loot, the addressee reads the letter aloud and a
week later appears on the board of returners («вернулся с Острова»). The boarding game stays;
this is the second door. Suite `91zzo`.
---
## 0.120.0 — "The departure" (M159)

On the sixtieth day of the circular the ether and the music go quiet for a minute, then one
line: «Ушли.» The board of returners gets a line without a name (« — · ушли · не ждут»), the
table a paper, the record book an entry. If the player is at the counter of the hours county's
core that day or the next, one offer, once: «Есть место» — going is an ending (the last entry,
the save marked, the title screen carries the nameless line); staying is the game going on. They
do not return: a year later an unsigned tape arrives on the home table, and on it the whole
figure of the misclosure. Nothing else. Suite `91zzn`.
---
## 0.119.0 — "The last run" (M158)

`12k-letters`: the Tin closes. On the fortieth day of the circular the ether announces the last
run with a date; after it the Tin's iron stands («ЗАКРЫТА · ПОСЛЕДНИЙ РЕЙС УШЁЛ»), it neither
asks nor takes, and the record book notes whether you made it. **Letters with content**: ten
letters — the Baker to Krapiva, Kim to Shtof, the chronometrist to the reactor keeper, Vega to
the old man on the bazaar, the commission to the duty observer… — offered at counters during
the expedition, carried as sealed envelopes on the table and never read by the player; the
addressee reads the paragraph aloud at the counter (it goes to ЛЮДИ and the envelope unfolds on
the table). Three are addressed to people on the Tin: too late, and «адресат выбыл» stays in the
hold. Suite `91zzm`.
---
## 0.118.0 — "The sixth" (M157)

`12k-stories-d`: the rivals as colleagues. Each of the five leaves a trace on a station not
their own — the Baker hands in the oven door at a science station, Krapiva flies (she never
flies) to a plant and gives her suitcase to Kim, Kim pays the nameless debt at a yard and goes to
the outpost, Shtof hands his count to Sovenya at a trade hub, Sovenya counts all night and names
the county where the clocks disagree. Five traces are links as data (`seenOf`), and together they
draw one route to the sixth: **Зоя Варламова**, the institute's chronometrist at the core of the
hours county (new address kind `hours:core`). Her story is a report in the institute key — 412
days of tapes, «расхождение не устранено», «заявление удовлетворено» — and she goes with the
expedition; the board of returners gets her line: «убыла · не ждут». Suite `91zzl`.
---
## 0.117.0 — "The circular" (M156)

`11x-expedition`: once the Ring has been heard twice and a tape handed in, the ether carries the
circular — «Готовится экспедиция за край. Всем станциям — по плану» — and for sixty days the
world works for it through the channels it already has. Every station's ДОСКА collects one good
(isotopes, titan, organics, silicon or cartridges) at one and a half times the price, with a
record-book line; prices creep — expedition goods ×1.25, iron and ice ×0.85; barges and
settlements give people and it is heard; half the ether is about the expedition; a hire asks
«возьмите меня туда» and can be released from ДОСКА (the others take heart). The barge passenger
becomes a channel: a fellow traveller to a named station takes the seat on the console and says
one line per jump, then gets off — the M131 tail closed. No quest log: the demand is the world's
face for sixty days. Suite `91zzk`.
---
## 0.116.0 — "The misclosure" (M155)

`11z-misclosure`, on top of the hours region (11h): in the county where the hours drift, the
station recorders disagree with the sky — each station's clock is ±3…9 minutes off, and ДОСКА
shows it («ЧАСЫ СТАНЦИИ 12:40 · ПО НЕБУ 12:33»). The institute refuses it: a strip laid on the
counter there gets «Прибор неисправен. Замените ленту. — Это ответ института, не мой.»; the
ether carries two counters arguing about the time. A recorder strip torn in the county carries a
mark and an angle; three or more such strips on the table draw one figure — the curves lie along
an arc whose axis points where the Ring signal comes from. Nobody says so; a test guards that the
table never does. Suite `91zzj`.
---
## 0.115.0 — "The Ring" (M154)

`11x-ring`: a structured signal from outside. After forty jumps (then every 25–40) the
receiver's own wave carries a pulse in groups for one minute — «…не позывной. Не наш.» The
console shows the pulse instead of the bands and offers ЗАПИСАТЬ once: the tape (direction,
strength, sector, day) lies on the table drawn as pulses and can be handed at any counter —
«приняли. Отправим в институт. Что там — не скажут.» One source far beyond the edge
(`RING_SRC`): every region hears it from its own side and with its own strength, the same
geometry as the panel's misclosure. Rumours pick it up («говорят, опять поймали»). Nothing
explains it, and a test guards that no line ever does. Suite `91zzi`.
---
## 0.114.0 — "Vega" (M153)

`11w-vega`, `12k-vega`: the lodger who cannot be evicted — a comedy of one wish in the key of
Soviet communal comedy, after the author's retelling of "Obsession" without the killings. An old
man on the bazaar sells «Желание-1» (once the home has a living part); it lies on the table and
offers three wishes, and all three end in Vega, the radio operator from the station nearest home
— the device "understood in its own way", and the player pressed it himself. Act 1: she moves in,
morale is higher than the mate's, Aunt Ustya «уехала к сестре». Act 2: she counts the days you
are away — calls on the receiver (turning the knob to the ether band counts as answering), other
voices relay her words, and from the eighth day things at home get broken (a crack on the case
glass stays). Every eviction attempt is +1 attachment and one of thirty replies, none repeating.
Act 3: the old man is gone, the institute says «возврат не предусмотрен». The mirror: on the
tenth day a second device, already pressed, and launching from home is delayed once a day —
«вы обещали остаться». Flying with her: the seat on the console, her mood line, a suitcase in
the hold, a click for a word or a gift (rarities please, ore quarrels), she darns the suit by
the ship, reads the charts for the nearest need, hates caves, gets space-sick after three jumps,
shouts at beasts, takes offence at raids and deep digs for a day; outings — the cantina for
30 cr, the flea (a useless thing comes home), an eclipse, the Tin. The ending without a death:
seven days at home with the engine off — «ты какой-то скучный стал» — she goes back to her
shift, keeps living with you as a flatmate, calls once a week, and gets a parrot of her own.
Suite `91zzh`.
---
## 0.113.0 — "The suit as a kit" (M152)

`12x-suit`: the suit is six places — helmet, torso, gloves, boots, pack, lamp — each a piece
with a model in the Soviet key («Кречет-3», «Орлан-Д», «Гагара-М», «Буревестник»…), a class
I–III, a wear layer (new / worn / patched / foreign) and two mod slots (heated liner, reinforced
seam, breathing cartridge, spare glass, stitched knee, reflector, strap). Nothing is a plain +1:
weight is the common currency — it slows the walk and feeds the jet burn. `kitStat()` routes
everything through the knobs that already existed: `st.suitWear`, raid armour, jet burn/regen/
thrust, walking speed, scan reach, beast shyness, drill speed, the cave lamp's radius and cone,
charge drain on ice. Charge capacity replaces the hard-coded 100 (`suitMax()`). Where pieces come
from: a class-I set is issued to all; the institute depot on ДОСКА of science and industrial
stations issues a piece per four days by the home's turnover (II from the hall, III from the
garage); a hulk gives a foreign piece; the home workshop repairs worn pieces and fits mods. The
КОРАБЛЬ screen shows the figure with six places, the passport line and the shelf (wear anywhere).
Suite `91zzg`.
---
## 0.112.0 — "The economy without a debt" (M152e)

Measured first (`91zzw-economy` prints cr/min per source): a hand-flown leg on «Стриж» with
600 cr is ~640 cr per 3 min; a drone 25 cr/min for 2 200; a hire bets −2 cr/min in flight; and
the managers were the only drain per minute — 240+ cr/min from the player's purse. Then nine
changes. **Managers live on the cut**: the wage is settled from the domain's own share
(`m.pool`), never from the player; an empty domain leaves him "on bare percent" — a grumble and a
slow loyalty thaw, a third of the old rate. **Station need** (`12aa-need`): every three days a
station may run out of one good — ×2 for one delivery, then closed for the window; heard on the
receiver (15% wrong, like rumours), posted on ДОСКА, remembered by the station and the notebook.
**One order per station** («наряд»): carry N of a good to a named station by a day for a stated
sum; one on hand at a time, expired ones simply vanish. **The first hull by allocation**: at
3 000 turnover the plan issues a used «Вьюк». **Tails on display**: a hire's captured hull goes
to the home case and the table. **A find handed to the institute for a quarter** or sold on the
bazaar whole. **The rationalisation premium** for the first alloy of a kind. **Prices on paper**:
a ЦЕНЫ tab on the table with what was last seen per station. **The market fills slower**: price
pressure half-life 3 h instead of 30 min. The mirror's echo now repeats what was actually heard.
---
## 0.111.0 — "The console and the table" (M151a)

The release look, built before the kit and the lodger so that every new voice lands in a ready
place. **The console** (`27j-console`): a strip along the bottom of every screen — the receiver
knob moved out of the cantina (four bands with labels; voices arrive with a click and stay
fresh for a while; a line a player dwells on is remembered once), the action prompt above it,
the seat of whoever flies with you (`G.seat`, empty until M153) and the parrot's perch (click —
its window). On station screens the console rises into the header; on the table it hides.
**The table** (`27i-ui-table`): one screen for everything read, opened over any mode and
returning to it — the notebook with ЭФИР · БОРТ · ЛЮДИ, ДЕЛА, ЛЕНТЫ (each strip drawn), ВЕЩИ
(`G.things`, the shared shelf for letters, finds and papers; new ones glow), ОТЧЁТ (the lore
board). `11-log` routes by kind (`etherLine`, `peopleLine`); the ether voices of 11b, the counter
queue and the counter table replies now go to the notebook instead of a dim line. The station
gets **ДОСКА** as its first group (queue, deeds here, arrivals, rumours, the system's name). The
menu is five doors; ЖУРНАЛ, ОТЧЁТ and ТРЕПЛО windows are gone. Suite `91zzv`; `91f-ui` and
`91p-lore` follow.

---
## 0.110.0 — "The receiver has a knob" (M124 remainder)

`25e-receiver`: a hand-tuned receiver in the cantina. Four bands that never move — rumours,
prices, weather, ether — with noise between them and words dropping out toward a band's edge.
It invents nothing: the rumours are 11t, the prices the nearest station's market, the weather
the system's solid worlds, the ether 11b. The knob remembers its position (`G.radioF`). Of the
M124 remainder, "pause is the engine off" needs nothing — the game has no pause menu; the table
as paper and the removal of the overlay HUD are left as the release design on purpose (see
PLAN.md).

## 0.109.0 — "Houses as a language of shapes" (tails M55 #2/#7, M113)

The four houses of `12u-scrip` used to differ by name and scrip colour only. Each now has a form
(`17d-house-shapes`) carried by everything it owns: on the station a mark over the hull — two
round tanks for «Ласковый», an open scoop bracket for «Ковш», a mast with a dish for «Вестовой»,
two swept spars for «Крыло» — and in a settlement the pennant in the house's colour and the same
mark on the wall of the first yard. Nothing is labelled: a house is read like a flag. Modules over
40 KB were cut along their draw seams in 0.108.1 (`17c`, `19f`, `21e`, `23a`, `24aa`).

## 0.108.0 — "The pass closes" (M147-returners, M148 rumours, M149 names, M150 passports, M151 places)

**The returners** (`11s-returners`, the table's `tin` slot, needle `chrono`): yards and long
contracts on the edge — rooms kept ready, ships waited for by the third generation; at the core a
station of people younger than their grandchildren, who play dominoes and complain about supply.
An arrivals board in the cantina with half its lines years overdue and nobody clearing it. The
chronometer drifts there until the first docking and never again: it misleads exactly once.

**Rumours** (`11t-rumours`): two per station per three days, each an area of three to five
systems around a region core — an image, a human detail, a source — and about fifteen per cent
simply wrong. In the cantina and, rarely, on the receiver. No markers anywhere.

**The names travel** (`11u-names`): a system can be renamed in the cantina (18 characters, no
suggestion ever offered); the map, the HUD and the arrival line show your word. Tell it in the
bar and fifteen jumps later a dispatcher repeats it, one letter short; rumours about that core
use it too.

**Design passports** (M150): `docs/PASSPORTS.md` — the provenance rule extended to props, the
instrument, label, palette, wear, type and sound rules, and the pass's standing rules, as the
checklist every new object is read against.

**And what was that, exactly** (`11v-places`): three hand-placed, unique places at fixed
addresses — a tower, a bowl, a stair into nothing — on the first solid planet of the nearest
star. Nothing logged, nothing rewarded; only the name you give them travels.

## 0.107.0 — "Four counties" (M143-slow, M144-pass, M145-grown, M146-plan)

**The slow one** (`11o-slow`, needle `chrono`): lay a figure from the hold at the valley's peg,
leave, come back five days later — a copy; then a continuation (read plainly, "are you alive?");
then a meaningful mistake that adds what you did not lay. Nothing visible: the chronometer humps
at the peg when the reply has matured, and the tape keeps it. Leave for two hundred hours and
the reply is still there. **The pass** (`11p-pass`, needle `course`): a hulk behind the village,
pilgrims at the ramp, a liturgy that used to be a manual. You can switch the lights on — the
largest thing there in a century — and then explain, or not; no reward either way. **The other
growing-up** (`11q-grown`, needle `mass`): the same people at different stages across the
region; at the core every gift comes back cleverer than you gave it. **The plan** (`11r-plan`,
needle `radio`): the ether full of delivery notes, a combine on the core planet that never stops
and needs no order; take the article, bring it to your own base, and two hundred years of work
are for the first time not wasted.

## 0.106.0 — "Three counties" (M140-county, M141-charts, M142-quiet)

**The large county** (`11l-county`, needle `mass`): masonry in the region is half again as
large, twice at the core; the core settlement is built for a guest — yards at 2.3×, a four-metre
door on the largest. The town has no buttons: jetpack, drill and a hard landing are loudness, and
the door opens, the windows light and the lift rises by level; at the top, a nursery with cots
at our size. Keep shouting and the town hears you; twenty jumps later, somewhere else, the ether
carries three low beats and nothing more — once.

**The charts disagree** (`11m-charts`, needle `course`): every star on the region's edge sits a
little off on the map, every fifth is simply not drawn though it is there to jump to. At the core
the locals compare instruments and find you fine — you have arrived from nowhere. Their chart can
be traded for (300 cr); while it is in the hold the navigator does not show the home system,
silently. Throw it out and five jumps later it is back in the hold.

**The quiet county** (`11n-quiet`, needle `radio`): no pirates spawn in the region and the hull
does not wear. At the core the log stops writing and the tape draws a flat line; on departure
three to seven days have passed and 15% of the fuel is gone — nothing taken. The colony hides
nothing and offers to let you stay; the offer is never withdrawn. Suites `91zy`, `91zz`, `91zza`.

## 0.105.0 — "The line of keepers" (M139-keepers)

The `keepers` region (06c, needle `course`) is built in `11k-keepers`: a lane everyone navigates
by, and at its core a station with one man on it. Habit over visits (`visitHere`): weather talk,
then a silent handover, then he knows what you need, a second mug, the crate already out; every
third call he takes one ration from the hold himself. On the tenth call he is gone — mug washed
and turned over, bunk made — and the lane goes dark: the course needle wanders across the
region, a jump plotted there costs half again, the ether carries lost strangers and a convoy
turning back. In the cantina the bulkhead roster: twelve names struck through, a blank line you
can sign. Signing is hauling one ration to the crate by the door at least every twelve jumps,
unpaid, forever; miss it and the lane darkens again. Far away, at the core of the pass, a second
such man — alive — greets a signed pilot as one of his own. Persisted `G.keepers`. Suite
`91zx-keepers`.

## 0.104.0 — "The grove" (M138-grove)

The `grove` region (06c, needle `mass`) is built in `11j-grove`, in the belt. Growths are belt
rocks with a mark: on the edge three lone ones that cut like ore and pay xenobiome; in the grove
system (the core, or the first belt system of the region) twenty-two of them in one thicket off to
the side. Thrust is the language: engine off and the grove closes in slowly, never nearer than
150; thrust and it flinches back; its rocks never damage the hull — a soft shove instead. It
remembers the hull (`G.grove`): every visit it turns sooner; one shot and it parts and never
approaches again; one cut for cargo (six xenobiome) and it closes for good, thrust or not. A
green halo on each growth, brighter while it comes toward you. The edge ether swears at the
thickets. Suite `91zw-grove`.

## 0.103.0 — "The light that remembers" (M137-glow)

The `glow` region around the meadow (06c, needle `actino`) is built in `11i-glow`. On the edge
every plant glows at night and the landing pad is ringed with the same light; scanning a glowing
plant there puts one xenobiome in the hold — the moss is a trade good. On the core planet the
light lies in patches that repeat shapes — a wheel rut, a machine, a foundation — drawn at night
only, in the meadow's own light. The core planet always has the meadow (`peepHere`), and its
scenes replay in order of brightness: the first pass of an eclipse is loud (×1.4, a floodlight
column at the start), the second ordinary, the third quiet — one running figure at a third of
the light, visible only within 150 px, heading for the cave mouth, which on the core planet
stands exactly where he runs. Nothing persisted. Suite `91zv-glow`.

## 0.102.0 — "The drift of hours" (M136)

The `hours` region (06c, needle `chrono`) is built in `11h-hours`. The offset is a function of
one distance, like the misclosure: minutes anywhere in the region, an hour in orbit over the core,
up to four hours walking toward the core settlement — and the ship's chronometer shows it
(`hoursDrift` is added to the chrono needle in `instrRead`, so the tape keeps the hump). On the
edge the ether sometimes carries the dispatcher apologising for the clocks, a shift ten minutes
early, a hooter instead of a time check. The core settlement works with nobody in it: no
watchmen by day, smoke still rising, a vending machine at the yard that takes 7 cr and gives one
ration and correct change. By night the windows light and shadows move behind them; during an
eclipse one man walks past, stops beside you for a second, and goes — once, `G.hours.man`
remembers. The edge of this region is the whole region, not just the slope: the core landed at
the region's rim and the slope there is one cell wide. Suite `91zu-hours`.

Fixed: the star seen from the ground was painted in the dark sky tone, so every star read as an
eclipse with a corona — it is now a disc in the star's own colour, white at the centre. The
README surface shots are retaken.

## 0.101.0 — "Three lights" (M135)

The `lights` region (06c, needle `actino`) is built in `11g-lights`. On the edge the night never
arrives — dusk is capped at a fraction of a normal night — and one extra sun hangs beside the
star; in the core there is no night at all and two of them. Every settlement yard in the region
has a window with shutters: open and warm, or boarded the day before a conjunction and through
it — nobody explains. The conjunction calendar starts with the first arrival at the core, set so
that the last one was *yesterday* — the player misses it the first time, always — and never moves
again; there is no countdown anywhere, the shutters and the converging lights are the only sign.
During the conjunction the third light reveals a dashed road, foundations and an arch on the core
planet (a nav mark "ВХОД" appears), and the arch is a real cave: a second seed, no beasts, the
find pays 120 data and rolls an artifact. `G.lights` persists the first-arrival day and whether
the player has been inside; the harness resets it. Rack glass and needle radii are clamped on a
zero-size canvas (test stand).

## 0.100.8 — "Loose ends, station side" (M144)

The counter length follows the hall seed (M55); every fourth counter line is about the house
that owns the station and its scrip rate, and every other one speaks in the tone of the place —
outpost, hub, works, yard, lab (M113, M128 archive tail). The flea market has a crowd count in
its header and a murmur on the first visit (M121). The bird hears on a planet: cave species and
the cave find go into its memory (M117); mirror lines and echoes go there too (M134). The tape
survives a save — the ring is packed to base64 (M123); the recorder is merchandise: a second
drum that makes the tape run half speed and remember twice as long (M127); a pirate hit can
knock out a socket, leaving one instrument a dead scale (M127); instruments age faster on a
worn hull — one clock (M127). The misclosure sits in a window of its own beside the panel
(M122). The table accepts a name (M128); a strip can be attached to the parcel and the last
link notices (M133); while the parcel is aboard a third of empty rumours point at who waits
for it (M133); a thing on the table counts as care, a missile hit counts as hurt (M132); the
mirror bearing can be struck from the map (M134); the postal runner hears farther, not only
deeper (M126); the ether tears on the post region's edge (M133). Hulls get a top light and one
sensor boom on one side, so the two boards are no longer mirror copies (M55). `26-ui-station`
split along the home tab into `26a-ui-station-home` — the guard is quiet on it again.

## 0.100.7 — "Rock behind the plating" (M143)

Raid tails (G4): where the cell behind a bulkhead is solid asteroid on every side, the wall is
bare rock — three strata, no plinth or seams, loose stones up close; the hangar has its gate in
the end wall with a cold cone on the floor; pirates at rest lower their weapons and every
second one leans on the wall until the alarm. Scoop tails (G5): giants come in three structures
— banded with a few eyes, spotted with a scatter of small storms, and jet-streamed where the
bands tear into plumes; every band has a steep leading edge and a soft trailing one.

## 0.100.6 — "Three magnitudes" (M142)

System and belt tails. Stars come in three magnitudes with a dozen saturated orange and blue
ones on top; the nebula is two layers at different parallax (G10). The belt has three depth
planes: far rocks as grey dots on world coordinates with real parallax, the asteroids, and
near dust that grows and streaks by the glass (G6). Missiles work in the belt: same hold, same
launcher, fired at the locked rock, which they split whole (M112); the launcher is drawn on the
ship silhouette in system view — solid when loaded, an outline with a red tick when dry (M112).
The doomed planet shows from orbit: an orange pulsing halo while the clock runs, a grey veil
and dust rings once it is over (M114); the wing commander and the factor add lift capacity to
the evacuation by level (M114).

## 0.100.5 — "An hour on the surface" (M141)

The surface gets an hour: `celSun(p)` in `06a-celest` turns the planet in six to nine calendar
days (about six to nine minutes), nothing stored. The sky layer is baked per 48th of the day;
the horizon glow sits on the star's side and is strongest when it is low (G7); at night the frame
goes into the sky's shadow and the suit lamp is the only light, a baked sprite (G12). Far ridges
are tile-cached per parallax layer and the lowest third of the frame darkens toward the sky's
shadow (G2). Relief amplitude follows the material kit and strata count differs per kit (G1);
flora leans by world type (G1); three to four POIs per strip instead of two to four (G12). The
settlement is heard before it is seen — knocks and voices by distance — and marks itself from
afar with a pennant pole and a smoke column (M109); the watch stands at the cave mouth (M110).
Figures: the meadow mat takes the planet's tone, arms at rest hang outside the torso, the crate
rides at the waist, the trail is warmer than the mat (M118); the tin plant varies by planet and
its hoops read as turning (M119); the grok has a shoulder line, a strap over the belt box and a
rim on the chest arms (M120). Scale check (G8): the lander is 90–130 px against a 26 px walker,
five to one — right for a ten-metre hull.

## 0.100.4 — "The shaft changes section" (M140)

Mine tails (G3): rock is now baked in 512×512 tiles by world-x and world-y (`tileStore` in
`23-mode-dig`) — strata, veins and material once per tile, not per frame; along a long shaft the
section changes — every eleventh row the shaft widens into a two-row chamber with a lamp on each
wall and a barrel, and elsewhere an occasional niche is cut in the wall with a shelf holding a
crate or a lantern that lights. The landings and the tub were already closed in 0.96.0 and are
struck from the list.

## 0.100.3 — "Loose ends, one" (M139)

The first of the tail-closing passes. Base: `21a-mode-base` split along its seam (logic stays,
the frame moved to `21ac-base-draw`); the gate is a door (jambs, threshold, two leaves, a lamp
with a cone on the step); three lamps light the tunnel; the pad sits on a shelf cut into the
plateau instead of under the slope; the plateau has a terrace, so the right half is two planes,
not a wall; a spoil heap lies on the plain by the gate (G9). A base with a battery and no power
writes once that its defence has gone quiet, and the battery is silent until power returns; the
shot from the ground is a heavier sound than a ship gun (M111 tails). Cave: the lower gallery has
its own dripstone, veins and crystal clumps; beasts live on both galleries and one that hears you
on the other gallery drops from the ceiling after a wait; the contour fringe carries the
planet material instead of flat paint (M136 tails). Two stand-only crashes at W=0 guarded
(`drawCaveDark`, `rackDial`) — the test page is green again.

## 0.100.2 — "The tunnel" (M138)

The block of rooms sits inside the mountain now, not under the plain: the grid starts two
cells to the right of the gate and one level above the ground line, so rock lies over the top
row. From the gate at the foot of the slope a tunnel at plain level runs to the floor of the
top row, with the corridor tie along it. Floor ties start at the rooms, not in the rock.

## 0.100.1 — "Into the mountain" (M137)

The base read as dug under a plain: two humps a room and a half high over the top row. In
the reference the mountain fills the frame, the plain stays on the left and you walk INTO the
slope. The profile is now a ramp from the plain to a summit over the middle of the base and a
plateau to the right, as high as the frame allows (`humpAt` in `21a-mode-base`); the gate sits
in the foot of the slope on the left, larger, and the mast stands on the summit.

## 0.100.0 — "Under the skin" (M136)

Three things at once, all on foot. **The lander by planform:** the ship on the pad had one
silhouette for everybody, only the livery changed; now `drawLander` reads `h.form` — a disc
sits on its legs as a saucer with a dome, a slab is a ribbed brick with a box cabin, a catamaran
shows its far hull behind the near one, the cross carries its pods, the trident splits at the
nose, the delta hangs its wing and a tall fin. Gear, ramp, engines and the hatch light stay
common. Sheet: `docs/mklanders.ps1`. **The jetpack** (`20d-jetpack`): hold W — rise; the pack
burns out in two and a half seconds, refills in a second and a half on the ground and barely in
the air; one reserve per outing, shared by the surface and the cave, bar bottom-left. A terrain
spike is no longer a wall. **The cave as a field** (`22-mode-cave`): a 5 px cell grid carved by
noise and smoothed twice, with guaranteed passages cut through it — the upper gallery from the
mouth, two shafts down, a lower gallery back to the find, six blind branches. Pockets off the
passages are reached by pack. Rock is painted in 2D tiles (`tileStore`/`drawTiles` in `18c`)
with a marching-squares contour for the chamfer and the wet rim, the planet's material and a
depth gradient into blue black. The old dressing (22a) still hangs on the upper gallery because
`caveFloor`/`caveCeil` now scan the grid for it. Daylight falls through the mouth.

## 0.99.9 — "Tracks" (G12, pass 1)

The walker leaves tracks on the ground — a mark every thirteen pixels of walking, fading over
a minute — so the foot world remembers where you came from. Nothing is stored.

## 0.99.8 — "Horizon" (G7)

The sky base layer carries a horizon glow in the star's colour on worlds with air; rain falls
in two depths — near drops thick, fast and bright, far ones a thin net. The cloud note in G7
was stale: sprites already had a lit side, a shadow side and a rim. Foreground grass tufts now
appear only on worlds with flora (on ice they read as black sticks).

## 0.99.7 — "The star is over there" (G10)

In system view the primary's glow now bleeds into the frame from its side even when the star
itself is off-screen (one sprite blit, lighter), and orbit rings fade with radius instead of
being one brightness — the screen no longer reads as a loading state when the star is out of
view.

## 0.99.6 — "It stands on the ground" (G8)

The landed ship gets a contact shadow that grows with the gear, and the light from the hatch
lays a warm pool on the ground at the foot of the ramp. The ring note in G7 was stale — rings
were already split behind and in front of the disc.

## 0.99.5 — "Plated" (G4)

The boarding deck spoke a different language: one-tone walls with an outline, flat crates, a
floor from wall to wall. Now every wall carries a plinth, a sheet seam with rivets (near only)
and a cable run under the ceiling; the floor is plates with a gap at the edge and a pool of
light under each lamp; every box has a lid rim and a contact shadow. All of it is quads in the
same projection — no new full-screen pass.

## 0.99.4 — "A voice per world" (music, pass 2)

The melody voice gets a vibrato that arrives on the second third of the note and a detune
spread, both by world type: ice and crystal sing clean, volcanic and metal are rough, toxic
drifts. Percussion is two voices — a low thump on the strong beat and a dry tick on ghost hits
and accents — instead of one thump that read as a metronome.

## 0.99.3 — "Lights on in the cantina" (cantina, pass 2)

The hall was drowning: crowd at .18–.32 alpha in grey, a .55 vignette, no floor. The crowd is
now in coloured jumpsuits at .30–.52, the vignette is .36, the wall is lifted, there is a
floor strip in front of the counter with a pool of light under every lamp.

## 0.99.2 — "A hill, not a hole" (G5, G6, G9)

The hill over the base starts its rock gradient above ground and lit by the sky, takes the
planet material like the soil below, and carries a rim of sky light along its silhouette — it
was one flat dark fill before. The gas giant is baked at 768×384 with a tile 1.25 screens wide
(the old .62 tile repeated twice per screen); the asteroid terminator is sharper
(`.15+li^1.3` instead of `.24+li`).

## 0.99.1 — "Question, answer, circle" (music, pass 1)

Self-review of `10-music` by structure: the drone and the bass sat on the tonic forever, layer
levels were constants, one phrase per place, percussion was a hit every other step. Now a
harmonic circle of four scale degrees (one per 16-step bar, seeded per scene) moves the drone
and the bass; a slow breath of 75–140 s sways the melody and the air by a third; every phrase
has an answer — the same notes with a mirrored contour, alternating with it; half the scenes
fall silent for the last eight steps of the circle; percussion is an eight-step pattern with
accents and ghost hits. Nothing is stored; the save format is untouched.

## 0.99.0 — "Five counters" (cantina, pass 1)

The counter is no longer the same panelled plank in every hall (`cantCounter`, 27d): wood with
a brass rail and a rounded end in the trading hall; a riveted steel plate with tread, shorter
than the room, a barrel where it ends, at the works; a workbench with drawers and a vice at the
yard; lit glass under a thin top in the science hall; planks on two barrels at the outpost.

## 0.98.0 — "Something in front" (G2)

The surface gets a foreground: sparse boulder and grass silhouettes at 1.24× parallax, cut by
the bottom edge of the frame, in the planet's own shadow colour and without detail — depth by
overlap and value, not by blur. One silhouette per two screens. Passes added: 0.

## 0.97.0 — "Six worlds, six bodies" (G1)

The planet material (`18a-material`) had a character only for crystal, metal, jungle and ruin;
the other six types shared one cell texture in six palettes. Now desert is wind ripple with lit
crests, ice is fracture plates with white seams and blue depth, volcanic is a cooled crust whose
seams glow where the heat is near, toxic is sodden banks with pools and rims, terran and ocean
are bedded soil. The light shafts take their count, angle and spread from the planet instead of
the same five-ray fan everywhere. Passes added: 0 — it is all in the baked tile.

## 0.96.0 — "The mine has rock in it" (G3)

`fillMaterial` with no clip path called `ctx.clip()` on an empty path and drew nothing — the mine
never showed its planet's rock, which is why its strata read as flat fills. Fixed, and the strata
got a contact shadow under each roof and a hairline of light along the edge. Landings are a
beam across the whole shaft on brackets with a wall lamp (lit after the darkness pass), a depth
plate and a crate on every second one; the tub is a hopper with a heap of rock in it. Still
open: niches and a change of section along a long shaft; rock chunks by world-y.

## 0.95.0 — "Passes, not objects" (G0, G11-a)

The graphics pass opens with a measurement: the frame is fill-rate bound, one full-screen pass
costs ~4–5 ms at ×2 on an integrated GPU, JS is under 3 ms everywhere. First cuts: the grade
(vignette + tone) and the sky base are cached layers, the cave darkness is a sprite, the giant's
depth gradient is a layer, boulders are baked into the ground chunks. Surface 40→45 fps at ×2,
mine 39→44, cave 55→59, scoop 51→55. Full table and the pass budget rule: PLAN.md, G0.

## 0.94.0 — "The mirror" (M134)

A transit region with bad comms: in it, whatever the ether says comes back thirty-seven seconds
later, word for word. At the core lies the mirror itself — not a source, a surface where old
reflections have piled up: a time signal, a roll-call, someone's forgotten mug. Listening gives a
bearing to where it all came from, far beyond anywhere anyone flies.

## 0.93.0 — "The postal round" (M133)

In the one region where the instruments are simply right, someone hands you a wrapped bundle. Five
people across the arm recognise it when you happen to land where they are, say one sentence about
themselves, and name the next. It can be opened. The last man has been waiting forty-two years;
nothing is paid.

## 0.92.0 — "Fifteen regions, and the place remembers" (M132)

**The region table.** Fifteen themed regions (`06c-regions`) are now placed on the sector grid,
seeded and swept: every core is a system with a station, every region has an ordinary trading
system on its edge, and no two cores lie within two stock jumps. Each brings its own name and its
own lying instrument; the postal round brings none — there the instruments are simply right, and
that is meant to be noticed. Nothing is marked on the map.

**Memory of place.** Every place you land at now remembers how many times you came, and three
coarse things: how much you dug out, how much you shot, how much you repaired or delivered. None
of it is shown anywhere. It ages by the road you travel — landings elsewhere and jumps — never by
the clock.

## 0.91.0 — "A hundred and two" (M131)

**Links are data now.** A trace may require a trace of *another* story to have been seen —
`seenOf:"second_glass.t1"` — so the second half of a story can live on a different station, in
a different kind of place, and the player carries the connection in their head: who watered the
garden in the crater answers at an outpost; the one who stayed at the window turns up at a trade
hub; the bell's ringer is known at the outpost below the metal world.

**The parrot is a carrier.** A trace marked `carry` is remembered by the bird when it is first
shown (`heardAdd`, kind `story`), listed among what it heard with the place's address, and asked
about elsewhere: a yard mentions the oven door, the bird repeats it, the baker's station reacts.

**Thirty more stories** (`12k-stories-c`, 102 in all), most of them the far ends of earlier
ones — the callsign the bird brings, the second lamp lit when the first went out, Kim's debt paid
by someone else, the kettle's cousin mug that cools by itself, half a dock arriving, the
lighthouse keeper who transferred "to where they listen", the clicking that got an answer and
then a third — plus a few new: Zoya who only knows things at night, Guram Ilyich whose balance
never adds up until it does, Samokhina on callsign Forty-two who circles for three years and lands,
a dog that is not a dog, the fisher without a sea.

The hundred is built. What is left is what the design says is left on purpose: a third of them
never explained.

## 0.90.0 — "The ground speaks too" (M130)

**Four more channels, all on the ground**: a line appended to the landing message, a line at the
mouth of a cave, a tail on the prompt at a settlement and at the Tin. Three more address kinds:
`planet` (any world you land on), `settle` and `tin` (worlds where those can live), plus
`world:T`. Planet stories anchor to *system/planet*, not to the system — the first version let a
story pinned on the desert surface on the crystal world next door. Landings on a planet are
counted like landings at a station, so "the third time here" works on the ground.

**Forty-six stories** in `12k-stories-b` (72 in all): the four ground stories the design promised
— who feeds the Tin, the shoal and the hunter, the shell that knows its way home, the last light
in the settlement — and tracks that go one way, a warm stone, a garden in a crater, a plate with
seven lines, a beehive, a rust bell, a crystal with a name; at the stations, Nyura who charts a
sector that does not exist, the Abashev twins, the doctor who only says "yes", Matvey Kuzmich
listening to every bulletin, a kettle that boils by itself, the lighthouse keeper's poems, skipper
Oroz who never docks, someone small at the door, two at the window; the busy frequency, the water
schedule, the dock's echo, half a dock flying away; the six rivals again — the baker bakes,
Sovenya sold, Efim's voice on a satellite, the baker and Shtof at one table once an eclipse.

## 0.89.0 — "Traces, not tasks" (M129)

The first of the hundred. A human story in Drift is two to seven **traces** laid across the
world — a line in the ether, a remark at the counter, a figure at a table, a thing on the bar, the
contents of a capsule, a rumour — met in any order and assembled in the player's head, never in a
journal. No giver, no reward, no marker, no counter, no page: the game records only which traces
were seen. Design: `docs/DESIGN-stories.md`.

**The engine** (`11c-stories`) pulls rather than schedules: each channel asks `storyTraces(via)`
when it needs content; turns — changes that happen without the player — are computed lazily from
the world's day (`CEL_DAY`) or from the day a trace was first seen. Floating stories ("any trade
hub") anchor to the first matching place where their deterministic lot falls, at most four per
place; fixed ones sit at seeded addresses. Conditions are a closed dictionary (`STORY_WHEN`); an
unknown key fails the autotest, as does a turn flag nobody reads.

**Six channels wired**: the ether (one line in three), the counter queue (an unseen trace
preempts, a seen one only every third landing), the table (a story answers the thing before the
common table), finds, rumours (with the anchored place's address), and the cantina — figures at
corner / far / end / door seats and eleven small things on the bar, drawn with the hall's own
brushes.

**Twenty-six stories** (`12k-stories-a`): the second glass, the pad lamp, the shift that does not
come, the baker who never baked, the parrot that carries a callsign, Madame Krapiva who does not
fly, Efim's stool, the forecast that never changes, two on one orbit, four cups, the old name, Kim's
debt, the voice of the Rack, the night shift, Shtof's tally, a foreign tape, Sovenya awake, a
letter read over the ether — and six longer ones in the key of institute fiction: the report on
the event that never happens, Gedevan's null-cabin, Semyon Palych who walks to the horizon, the
commission that looks at walls, Ada Lvovna's second shelf, the pump that was not a pump. A third
are never explained, on purpose.

**Not yet**: the settlement, the machine, the animals and the surface as channels — M130, with
forty more stories; links and the parrot as carrier — M131.

## 0.88.0 — "A screen is a pane of glass, not a wall"

The interface grew on a phone and was stretched edge to edge on a monitor: a price sat a metre
and a half from its name, nine-pixel captions vanished, a 56-px row showed four goods per screen,
and four section buttons were spread across the whole width with nothing between them.

**On a wide screen every screen is now a centred pane** — `min-width: 900px` in `style.css` —
up to 1080 px wide, on glass over the visible world, type one step larger, rows denser, section
and tab buttons gathered on the left, the footer's actions right-aligned instead of stretched.
Nothing changes on a phone: the block is additive. The scrollbar inside the pane is a thin
phosphor line rather than the system widget.

**Settings have five tabs** — Полёт, Клавиши, Звук, Графика, Запись — instead of one scroll
through twenty sections to reach the sound. The sections and their order are untouched; a tab
only hides the others (`optGroups`).

**Long section captions are sentences again.** Half the `.sec` headers were not labels but
helper sentences set in spaced capitals — against the first rule of the style sheet. `el()` now
turns any caption longer than a label into a `.sec.note`: ordinary case, readable size.

## 0.87.0 — "What does not move is painted once"

Measured, not guessed: the frame was profiled function by function, JS time and raster time
separately, then in a real Chrome on a ×2.5 display. The logic costs ≤4 ms everywhere. The raster
did not: the surface ran at **23 fps**, the cave at 42, and removing one thing — the near ground —
brought the surface to 61.

**The ground cross-section is now a row of chunks.** Silhouette, six strata with their contacts
and veins, the rock material in two passes, the depth gradient and the crust line were fifteen
full-screen fills under a 200-vertex clip path, every frame, on a 4.5-megapixel canvas — for a
picture that never changes: the camera only moves it. `18c-chunks` paints it once into 512-px
slices of world X (the same `drawGround`, with `W`/`H`/`ctx` swapped underneath it), keeps seven,
and the frame is four `drawImage` calls. The gradient's top is the terrain's global minimum rather
than the slice's, so there is no seam in the darkness. Only the grass stays live — it bows to the
wind. The cave's vault and floor go the same way (20 of its 28 ms were the material alone).
Surface **23 → 52 fps**, cave **42 → 57**, at the same ×2 resolution.

**The star's glow and the storm veil are layers.** A full-screen radial gradient (5 ms) and a
full-screen linear one (3 ms) that depend on nothing that changes within a second are cached as
screen-sized canvases keyed by what they depend on.

**Resolution is a setting, and "auto" steps down on its own.** On a retina display the canvas
drew four times the pixels for the same frames. `Графика → Разрешение`: auto / 1× / 1.5× / 2×.
Auto starts at full and drops half a step when the smoothed frame stays above 24 ms for three
seconds; it never climbs back by itself, because "sharp — soft — sharp" reads worse than a steady
picture. The choice is saved; old saves get auto.

## 0.86.0 — "Two full-screen passes become one, and nobody re-rolls the same dice"

Continuing down the same list, in order of pixels painted rather than lines of code.

**The nebula was two full-screen blends; it is now one, and it is opaque.** A 160×160 tile was
stretched over the whole screen, then stretched again 1.9× larger and offset so its seam would not
read — both additive, in every system, every frame. On a 4.5-megapixel canvas that is nine
megapixels of blending before anything else is drawn, and both passes at twelve-times
magnification, the least cache-friendly ratio a texture sampler can be given.

The two layers do not move relative to each other: the second one's offset differs from the
first's by a constant, so under a moving camera they travel as one picture. That means they can be
added together once into a tile and moved as a unit — and since that tile covers the screen by
construction, the dark background can be baked into it too, which removes the separate clearing
pass and turns the remaining blend into an opaque copy that need not read what is already there.
Three full-screen passes became one. Checked pixel by pixel against the old pair at three camera
positions, including both extremes of the parallax clamp: **0 of 255 difference**.

**Nobody re-rolls dice that have not changed.** Interplanetary dust built a fresh random-number
generator per mote and assembled an `rgba(…)` string for it — seventy generators and seventy CSS
colour parses a frame, for seventy specks whose position in their own field, size and brightness
never change; only the field's offset does. Asteroid-belt gravel did the same, 190 draws a frame
for grit whose angle and radius are fixed by the belt's seed. Both now compute their table once
and vary only `globalAlpha`, which is a number rather than a string the canvas must parse. Dust
compared against the old formula at two camera positions: worst channel difference **1 of 255**
(alpha rounding), mean 0.0001.

**Why the ship was left alone.** It is the largest remaining consumer — 338 canvas commands a
frame — and the obvious move is to bake it into a sprite. It is also the one object where that
would cost real quality: the ship rotates continuously, and a rotated raster blit is resampled
every frame, where vector paths are drawn exactly. Baking a sprite per heading would fix that at
the price of a thousand sprites, and baking a handful of bank phases — the usual suggestion —
quantizes the roll, which is the same trade that made the planets step before 0.84.0. The saving
is about a millisecond of CPU in a frame whose stalls come from pixels, so it is not worth the
softening. If it is ever done, the split has to be: banked belly and exhaust stay live (they carry
the only per-frame randomness), everything from the engine barrels onward is cached, and braking
frames bypass the cache entirely, because the brake jets are drawn in the middle of the body.

---

## 0.85.0 — "Stop repainting what has not changed"

Reported precisely: it stutters when you fly past the star, and clears up as you leave. That
symptom names its own cause. A star's screen size depends on zoom, not on distance, so flying
away does not shrink it — it moves it off the edge, where the rasterizer discards it. Whatever
costs the frame is therefore something the star paints across the whole screen.

It was the corona. Measured by area, in units of the star's own radius squared: corona 154,
halo 12, core 2, flares and prominences about 5 between them. The corona is a disc of radius 7R
filled with a **radial gradient**, and a gradient is evaluated per pixel — at a close pass that is
the entire 4.5-megapixel canvas, recomputed sixty times a second. Its shape never changes; it
depends only on colour and heat. So it is now baked once into a unit-radius sprite and stretched:
same picture, but a texture sample instead of a per-pixel gradient. Checked against the old path
pixel by pixel over a 980-px radius — worst channel difference **2 of 255**, average 0.28, which
is gradient dithering noise. The halo ring got the same treatment, as did the black hole's lens
and the neutron star's aureole.

**Planets are assembled once, not sixty times a second.** Wrapping the surface map onto a sphere
costs one `drawImage` per vertical strip — up to two hundred per planet — and it was rebuilding an
identical picture every frame. Two facts make that unnecessary: a planet's screen radius is its
world radius times zoom and has nothing to do with the ship's approach, and zoom only changes when
the player changes it; and rotation is slow — a day here is 52 to 120 seconds, so one texel of the
map takes 100–230 ms to pass the limb. The assembled disc is now kept in its own canvas and
rebuilt only when rotation has advanced three quarters of a texel, when the radius changes, or when
a sharper map finishes baking. In the frame there is one blit, placed on whole pixels so the disc
is copied rather than resampled. Rotation stays continuous — the step is smaller than a pixel.

System view, per frame: **`drawImage` 200+ → 5**.

The same disc cache went into the site's background, where three planets were re-projected every
frame. And its starfield stopped assigning the same colour five hundred times a frame — the colour
is identical for every star, only the alpha varies, and alpha is a number rather than a string the
canvas must parse. Site background per frame: **CPU 1.37 → 0.40 ms, `drawImage` 232 → 21,
`fillStyle` assignments 501 → 2**.

Nothing was made simpler to look at: no resolution was lowered, no layer dropped, no effect
disabled.

---


## 0.84.0 — "The planets turn in the game too, and nothing is baked in one go"

Reported as "everything is slow." Measured before touching anything: a system-view frame cost
**4.9 ms of CPU**, and that number did not move between 1280×720 and 3840×2160. A cost that
ignores resolution is not on the CPU; the pixels are paid for on the GPU. That ruled out the
obvious suspects and sent the search somewhere else — to what the game computes *once*, at the
moments it stutters.

**The planets were a flip-book.** Sixteen rotation frames were baked per planet and switched
between by the clock. On a planet the size of a fingernail nobody sees it; at full screen it is a
slide show. Worse, the frame was capped at 72–144 pixels a side — it had to be, since it was paid
for sixteen times — and then stretched across half the screen, which is where the mush and the
stair-stepped limb came from.

The site solved this in 0.83.0 and the game now does the same: **one surface map** (longitude
across, sine of latitude down) wrapped onto the sphere in the frame itself, in vertical strips.
On a sphere seen from outside a point's height on screen *is* the sine of its latitude, so the map
needs no vertical stretching — only each column's longitude, worked out once per size. Rotation
becomes a shift along the map: continuous, no steps. Light does not rotate, so it is two overlays
baked once, and the limb is anti-aliased by alpha instead of being cut off square.

**Nothing is baked in one go any more.** This is the part that was actually costing whole frames.
`fbm2` runs about two microseconds a call, so any surface worth looking at is a hundred thousand
calls — a quarter of a second with the frame stopped. The old code hid this by being low
resolution, which is exactly why it looked bad. So the bakes were made interruptible:

- The surface map is baked **by pixel, not by row** — one row of a detailed map already costs more
  than a whole frame's budget. 2.5 ms a frame, three levels of detail, one level at a time.
- Until anything is ready a planet is drawn as a smooth lit sphere of its own colour: a body, not
  a hole in the starfield. Detail arrives within half a second and sharpens as you approach.
- The queue is fair and prefers whoever is furthest behind, so **every** planet gets a rough
  surface before any planet gets a detailed one. Without that rule the first planet in the list
  took the oven and the other three stayed blank.
- The system nebula got the same treatment: 160×160 across three layers of noise, ~70 ms, which
  was the jolt that met every new system. It now bakes at 2 ms a frame and simply isn't drawn
  until ready — it is a half-strength overlay above the stars, and nobody notices its absence for
  half a second, while a ship frozen for a frame is noticed every time.

Entering a system: worst frame **95 → 34 ms**, and the steady frame came down as well.

**A ceiling on frames** (Settings → Graphics). The one lever that unloads the *GPU* without
simplifying anything: thirty frames rasterize half the pixels sixty do. It counts refresh
intervals rather than milliseconds — a millisecond threshold falling between two refreshes rounds
down to the nearer one, which is why a "45" ceiling on a 60 Hz screen silently delivers 30, and
why the offered steps are 60 and 30. The stride rounds **up**, because a ceiling that overshoots
is not a ceiling: under "no more than 60", a 144 Hz screen gets 48. `dt` still comes from the real
clock, so motion is unchanged.

**The starfield stopped re-parsing its colours.** 340 stars each built an `rgba(…)` string and made
the canvas parse a CSS colour, every frame. Stars are now grouped by colour once and twinkle
through `globalAlpha`, which is a number. Six parses a frame instead of 340. **1.17 → 0.73 ms.**

**The instruments stopped writing what was already there.** `hud()` put forty values into the DOM
every frame and almost none had changed. Each write now compares against the node itself —
deliberately *not* against a remembered copy, because screens and autotests set styles directly
past `hud()`, and a remembered copy goes stale and leaves a button visible where the frame was
supposed to hide it. **0.55 → 0.37 ms.**

**Orbits are computed once.** The forty-nine Kepler points of an ellipse never change — orbit,
eccentricity and argument of periapsis are fixed when the system is born. They were solved 204
times a frame; now once, cached on the planet, with only the mapping to screen left in the frame.

Hull gradients were suspected next and measured innocent — 0.18 ms a frame for 28 of them — so
`drawHull` was left alone instead of being refactored on a hunch.

---

## 0.83.0 — "The planets turn, and the site speaks Russian people actually use"

**The planets were stepping, not turning.** The game bakes sixteen rotation frames per planet and
switches between them — invisible at a planet the size of a fingernail, a slide show at full
screen. Sixty frames would be thirty megabytes each. So `site/planets.js` stopped baking rotations
altogether: it bakes **one surface map** (longitude across, sine of latitude down) and wraps it
onto the sphere in the frame itself, in vertical strips. The trick that makes it cheap: on a
sphere seen from outside, a point's height on screen *is* the sine of its latitude, so the map
needs no vertical stretching — only the longitude of each column has to be worked out, once.
Rotation is then a shift along the map: continuous, no steps, and **0.12 ms a frame** — cheaper
than the stepping version it replaced.

Light does not turn with the surface, because the star does not move: shadow and the atmospheric
rim are baked as separate overlays and land on top of the already-turned globe. The seam where the
map meets itself is cross-faded, and the day side is brightened by an additive layer, since a
shadow overlay can only darken and the game's own light multiplier goes above one.

**The texts were written by a designer talking to himself.** Rewritten as one person explaining
to another: "Открыли страницу — и вы в космосе. Впереди звезда, вокруг неё планеты. Летите
к любой, садитесь, выходите наружу в скафандре и идёте пешком." The mechanics page lost its
jargon — sections are now called "Откуда деньги", "Что может пойти не так", "Когда станет тесно"
— and the navigation shrank to three items, because "Механики" is a word from a design document
and "Как играть" is a word from a person.

**The parrot moved onto the front page** and sits there in its cage, pokeable, with its own page
left for taking it home. `site/parrot.js` now carries the bird for both, and the download is a
genuinely self-contained `treplo.html` built by `build.ps1` — the page it used to hand out linked
to the site's stylesheet and would have opened empty offline.

**Forgotten passwords can be recovered.** The host's `sendmail` turned out to be available and
unrestricted, so `forgot`/`reset` send a one-hour, one-use link from `noreply@drift-game.ru`. The
reply to `forgot` never says whether such an account exists. Resetting signs every other device
out, which is also how a stolen account is taken back. An address stays optional — without one the
account simply cannot be recovered, and the form says so plainly.

---

## 0.82.0 — "Five passes over the site, with the critique written down"

**The favicon was drawn in vector and never looked at.** At 16 pixels its dashed trail became
grit, its 1.2-unit stroke fell below half a pixel, and three nested circles merged into a grey
blob on a black tile that would have shown as a black square in a light tab. Five candidates were
rendered and inspected at 16/32/48 on both light and dark: the crescent read best but is the
dark-mode icon of every weather app, the ringed planet is the most generic space mark there is,
and the disc-with-trail turns into a magnifying glass. What shipped is a sphere lit from the side —
the game's own signature, two solid shapes, no background tile. The header logo now carries the
same mark.

**The planets on the site are the game's planets.** They were a gradient with stripes: a picture
of a planet rather than a planet, and next to the real thing it showed. `site/planets.js` ports
`src/07-planet.js` — the same fractal noise, the same spherical mapping, the palettes copied from
the world table untouched. Frames bake one at a time in the browser's idle gaps so the page still
opens in ~110 ms, and the texture is capped at 360 px because a full-size first frame cost 51 ms
on a desktop, which is a visible hitch on a phone. The background now costs 0.46 ms a frame.

**A real bug, found by looking:** gallery images were stretched into columns. `width`/`height`
attributes hold the layout before load, but without `height:auto` the height stays absolute while
the width goes to 100%.

**Geometry.** Nav items were 31–35 px tall and footer links 18 — the game's own rule is 44 for
anything poked with a finger, broken in the most visible place on the site. The top bar also mixed
in-page anchors with page links; navigation now lists places (Игра · Механики · Птица · Играть),
and the bird finally has a link.

**Contrast.** `--dim` measured 4.07:1 against the void — under the readable threshold, and a third
of the page is set in it. Now `#6d8494`: 5.16 on the void, 4.77 on panels, same mood. Focus was
removed from inputs and drawn nowhere, so a keyboard user lost the cursor; there is a focus ring
now, and the clickable spans in the sign-in box became real buttons for the keyboard.

**Texts.** The hero said the world "отвечает на последствия", which is not Russian. "Любопытство
против гринда" was making the same point twice on one page, and `world.webp` appeared twice —
the sixth card now shows a real descent through rain under an eclipse.

---

## 0.81.0 — "The front door, rebuilt"

**The landing page stopped being documentation.** It was twelve description cards under a hero —
good text in the wrong place, which turned a landing into a manual. Now the home page sells the
game in one pass (hero → what it is → six screenshots → the loop → why → what works today) and
every detailed explanation moved to **`/mechanics.html`**, a proper page with a sticky sidebar and
eleven sections. The rule behind the split: the home page makes you understand, the mechanics page
makes you knowledgeable.

**Six real screenshots, captured from the current build.** The 52 shots in `docs/shots` predate the
cockpit instruments, so they were not reused. `docs/stand.ps1` is new: it serves the repo over http
(the game needs a server, `file://` breaks parts of it) **and accepts frames** — the page hands over
its own canvas and the server writes it to disk, which is how these were taken with no screen
capture available. System, map, cockpit, cave, base, surface: 313 KB for all six as webp.

**The background got a body.** Planets now really rotate — body, cloud bands and terminator are
baked separately, and the bands ride inside a circular mask, so a revolution costs five drawImage
calls instead of a redrawn texture. Different speeds, different directions, orbital drift, parallax
on mouse movement, and still only one visitor crossing the frame at a time: twenty moving things at
once is a cheap sci-fi template, and the point here is emptiness with something living in it.

**The parrot moved out.** `/parrot.html` carries the real bird — the same `12x`–`12z` code — as an
installable app: a manifest, a service worker, and a `?pet=1` mode with no page chrome, so it lives
in its own window on Mac and Windows and survives losing the network. For anyone who would rather
not install, the same page downloads as one self-contained file.

Also: an SVG favicon (a disc that left its trajectory), an OG image cut from a real frame, and the
deploy now copies `site/` whole rather than by filename — the CI checks every page and asset
answers 200, because a broken image on the front page is a failed deploy too.

---

## 0.80.0 — "A front door, and a name to fly under"

**The site is three files now.** `/` is a landing page (`site/index.html`), `/play.html` is the
game, `/api.php` is the backend. The game moving off the root is what lets the front page stay put
while every build republishes the game underneath it. The page carries the pitch, an FAQ of the
mechanics, and a background drawn on the same canvas the game uses — baked nebula, three parallax
star layers, planets on sprites, one visitor crossing the frame at a time.

**Accounts.** Login and password, no email — `site/api.php`, PHP because this host offers no Node
application mode (the reasoning is in `docs/DEPLOY.md`). Passwords go through `password_hash`,
tokens are stored as their sha256, and everything lives in `~/drift-data`, outside the web root.
Twelve login attempts per IP per quarter hour.

**Saves follow the player.** `src/14-save.js` no longer needs configuring: it reads the token the
landing page left in `localStorage` on the same origin. Pushes are silent and throttled to one per
twenty seconds; on boot the game pulls and adopts the cloud snapshot only when it is genuinely
newer. A snapshot never overwrites a newer one — the server refuses. Opened from disk (`file://`)
the game stays entirely local and never mentions the cloud.

**Publishing is automatic.** `.github/workflows/deploy.yml` rebuilds on every push to `main` with
the same `build.ps1`, copies the three files, then asks the live site whether its `VER` matches the
source and fails if it does not. `server.js` and `worker.js` were removed: neither ever ran, and
two competing answers to "where do saves live" is one too many.

---

## 0.79.0 — "A queue of lines, and a thing on the table"

**M128** (`11b-speech.js` new, `27c-ui-hq.js` — the table block in the cantina, `26-ui-station.js`,
`14-save.js`, `28-loop.js`, suite `91zo-speech.js`). No conversations: a branching dialogue costs a
hundred hours of writing and produces a menu. This is the other thing.

- **A queue, not a conversation.** A place holds a short queue of lines and spends **one per
  landing**. Come back, hear the next one — twenty hours of acquaintance for the price of a string
  table. A need is mentioned in passing (*"could do with a valve"*), never as an order.
- **Silence is a line**, not the absence of one: he looks at your tape and says nothing.
- **The player never picks words. He puts something down** — a strip of tape, something from the
  hold, a rumour — and the answer is to the object. That is the whole input surface.
- **The tape became a thing** (the debt M123 left open): `T` in flight tears off the strip, which
  carries its sector, its misclosure and its length. It lies on the table, and it sells — a good
  strip sells well, and "good" means only one thing: you can see on it that the world was moving
  under the ship. Tearing it resets the paper, so a strip costs you the record you had.
- **Half of all speech is the ether**: faceless voices, other people's traffic, a dispatcher who
  has lost somebody, a forecast that says "as always". The cheapest life in the game. A postal
  runner hears them more often — the receiver is his profession (M126).
- **They change how they address you**: "пилот" → your ship's callsign → your name, on the count
  of landings at that place alone.

---

## 0.78.0 — "Instruments are merchandise"

**M127** (`05b-instr-kit.js` new, `26-ui-station.js` + a `ПРИБОРЫ` tab, `06-galaxy.js`,
`index.html`, `25a-instr.js`, `25b-tape.js`, `25d-instr-rack.js`, `14-save.js`, `28-loop.js`,
suite `91zn-instr-kit.js`). The five panel instruments stop being a property of the ship and
become **things**: six works, an age, and a character each.

- **Works, not tiers.** Казённый is the middle of everything; «Горн» reads coarse but survives
  anything; «Сирин» has a fine scale and a nervous needle; «Веха» is observatory work that holds
  its zero; артельный is homemade and nearly free; трофейный is somebody else's work with the
  markings rubbed off. Two «Сирин» are not identical — the seed spreads them inside the works'
  leaning, exactly like parts.
- **A bad chronometer is not "−5%".** It *resolves* the deviation worse, so a region that lies
  with time has to be flown closer to its core before its needle admits anything. The needle's
  tremor and the pen's line width come from the same instrument, so the rack physically looks
  different depending on what is bolted into it.
- **They age from work, not from the calendar**, at roughly the rate the hull wears; a shipyard
  verifies them for a fraction of the price of a new one. They are never destroyed — they just
  read ever more bluntly.
- **A counter at trade, yard and science stations**: two or three offers, derived from the station
  and a slow clock rather than stored, richer systems carrying the serious work. What you unbolt
  goes to a four-place shelf instead of vanishing.
- Kit and shelf are player decisions, so they persist (`v:4` unchanged, old saves get the standard
  shipyard set).

---

## 0.77.0 — "A hull is a profession, not a rung"

**M126** (`03f-hull-role.js` new, `25a-instr.js`, `25b-tape.js`, `25d-instr-rack.js`,
`12p-news.js`, `12l-barge.js`, `28-loop.js`, suite `91zm-role.js`). The hull ladder used to be
cheap→expensive: the next one was simply bigger in every number. A **profession** changes which
stories are open to you, not which numbers are larger.

- **Изыскатель** (Стриж, Игла) — first-class instruments, poor lift: the misclosure shows on his
  needles long before anyone else's. **Рудовоз** (Вьюк, Мамонт) — hold, mass, blindness.
  **Почтовик** (Клинок) — the best receiver in the game: the ether keeps almost twice as many
  rumours. **Буксир** (Обод) — takes other people's trouble on a line, and a rescued barge pays
  him accordingly. **Вахтовка** (Скат) — the only hull where passengers talk in flight.
  **Сторож** (Топор) — survives what kills the others.
- **The world does not change with the hull, the instrument does.** The misclosure of a sector is
  the same for everybody; what differs is how early it becomes visible on a scale, and how boldly
  the pens write it. A bad instrument is not "−5%", it simply reads coarser.
- Unique and fused hulls have no assigned profession, so it is derived from what the shop
  actually built: a warehouse is an ore carrier, fast-and-empty is a postal runner.
- The rack now carries a nameplate: whose equipment this is, and why it reads better or worse
  than the neighbour's.

---

## 0.76.0 — "Eight needles, five pens, one sheet of paper"

**M125** (`25d-instr-rack.js` new, `25c-instr-hud.js`, `28-loop.js`, stand `docs/mkrack.ps1` →
`docs/shots/rack.png`, suite `91zl-rack.js`). The pod answers "how much, right now" out of the
corner of an eye. The **rack** is the same equipment opened up, for when the player turns to
*read* it: press `I`, or tap the pod.

- **Eight instruments in recessed sockets**: cream dials under glass, real major and minor
  graduations, amber needles with a metal hub and their own shadow, units under the scale,
  screws in the corners, matte metal with grain. Every scale has its own range — identical
  scales are the first sign of drawn, rather than measuring, equipment.
- **Every needle is a real game value**: the five region instruments (25a) plus fuel, hull and
  hold. Nothing was invented for decoration.
- **A five-channel strip chart** that reads as one: warm paper with a printed grid, a supply
  roller on the left and a take-up roll with wound paper on the right, a dashed zero line per
  band, pen carriages on their rail with the tip touching exactly where its curve ends, feed
  perforation crawling with the tape, and time marks along the bottom counted in the pen's own
  time — which runs faster near a region's core.
- **Deliberate exception, on request:** the channels now carry colour and a name. Colour here
  separates five pens on one sheet, the way a real recorder does; it is not an alarm and not a
  hint, and the rack still says nothing — no sound, no message, no log line. The suite watches.

---

## 0.75.0 — "The instruments where the decisions are made"

**M124, first step** (`25c-instr-hud.js` new, `index.html`, `style.css`, `25b-tape.js`,
`28-loop.js`, suite `91zk-tape.js`). The panel and the recorder lived on the cockpit's ceiling
block — which means they were visible only in the belt, while the player flies in the system
view. An instrument that is absent where decisions are made is not an instrument.

- **One narrow pod in the instrument row**, between the ship's vitals and "where we are": five
  needles, the misclosure in figures, a strip of tape under them. Same glass, same border, same
  fade — it is one row, not an annexe.
- **One recorder, not two.** The drawing was lifted out of the ceiling block into `tapePaper`,
  so the pod and the cockpit print the same paper from the same ring.
- **In the belt the pod hides**: there the panel is real and hangs over the glazing. On a narrow
  screen the pod goes away entirely — 44-px buttons and "where we are" matter more.
- The paper is quieter in the pod than in the cockpit: over the world hangs only what is needed
  now.

Not taken from M124's spec: the overlay HUD stays, the table and the physical receiver wait for
their own pass.

---

## 0.74.0 — "Paper, five pens, and the memory of observation"

**M123** (`25b-tape.js` new, `25a-instr.js`, `09-audio.js`, `25-cockpit.js`, `28-loop.js`, stand
`docs/mktape.ps1`, suite `91zk-tape.js`). The honest answer to "how does a player compare
something he saw forty hours ago". Not a camera — **the ship writes by itself.**

- **A paper strip recorder** to the left of the panel, on the same ceiling block: five traces,
  graduations, and **not one label**. What it means is the player's business.
- **The pen writes change, not the reading.** Each pen carries its own slowly adapting zero, so a
  flat line means "nothing happened here" and a climbing curve means the world is moving under
  the ship. On an absolute log scale all five pens drew straight lines — which is exactly how the
  quiet county (M142) would have become indistinguishable from anywhere else.
- **The rhythm is the reading.** The pen ticks always; near a region's core it ticks faster,
  because the interval is set by the misclosure. No beep, no message, no colour change: the
  player looks up on his own.
- **Scrollable back** — `[` and `]` walk the tape, `\` returns to what is being written now; new
  columns do not drag the picture out from under the eye while it is held.
- Nothing is persisted and nothing is announced: the suite spies on `say`/`tell`/`logAdd` while
  the tape writes itself, and checks the pen against the needle whose scale it shares.

---

## 0.73.0 — "Five needles and a misclosure"

**M122** (`06b-region.js` and `25a-instr.js` new, `25-cockpit.js`, stand `docs/mkinstr.ps1`, suite
`91zj-instr.js`). The instrument set the thirteenth pass stands on. Not a detector: **work first,
meaning as a by-product.**

- **Five instruments**, each earning its place in ordinary flight: хронометр (deadlines and the
  length of a local day), курсограф (plotting and drift), масс-детектор (cargo, rocks, bodies),
  приёмник (the ether's noise floor), актинометр (light arriving). Each reads a real number off
  the real world.
- **The region** (`06b-region`) is the new unit: a square of sectors with a core inside it, and
  **exactly one** instrument that lies there. The lie grows smoothly toward the core across
  several systems and never in a jump, so after enough hours the panel reads as terrain.
- **`невязка`** — one small number: how badly the ship's five ways of fixing its own time and
  place disagree. Near zero in ordinary space.
- **No beep, no message, no colour change, anywhere.** The player notices, or does not. The suite
  spies on `say`, `tell`, `logAdd` and `sfx` across eighty sectors to keep it that way.
- Nothing here is persisted: the region is a function of the sector, like the system itself.
- The panel lives on the cockpit's ceiling block, where the player raises his eyes — not as an
  overlay on the world.

## 0.72.0 — "Everything here is somebody's"

**M121** (`12ua-flea.js` new, `06-galaxy.js`, `17-mode-system.js`, `26-ui-station.js`,
`index.html`, `14-save.js`, `08-state.js`, stand `docs/mkflea.ps1`, suite `91zi-flea.js`).
Блошинец: a seventh station type, and the only one whose stock is **used goods**.

- **Nothing here is new, and everything has a previous owner.** Parts off boards nobody scrapped,
  a live repeater out of a dead captain's effects, addresses written by hand — and information
  about the player, sold at the same counter as the bolts.
- **Provenance is the mechanic.** Every lot carries who owned it, why it was sold, and a sector
  you can fly to; buying it puts that address on the map. The counter does not sell things, it
  sells places, and the thing comes with them.
- **Its own money.** Prices are quoted in the house's scrip (M113); credits are taken at a 28%
  markup, because here your money is the foreign kind.
- **The lot about you leaves without you.** Undock without taking it and someone else buys it —
  the hunter gets the sector. Not a punishment for being poor: the price of having been here.
- Rows are deterministic from the station seed and a slow clock; only what was **bought** is
  persisted, so a bought lot never returns to the counter.
- The silhouette is its own: a welded heap of mismatched sections under one outline, short
  asymmetric awnings, goods hung on lines and a garland of warm lamps.

**M120's portrait faults, closed** (`12tb-grok.js`). The three eyes are spread wide with sockets,
light rims and ridges of hide between them and now read as three at 64 px; the hide carries dust
streaks, a worn belly and old scrapes instead of flat khaki; both working arms break at the elbow
and run outside the silhouette, and the small chest pair no longer disappears into the body tone.

## 0.71.0 — "He digs for food, not for money"

**M120** (`12tb-grok.js` new, `27c-ui-hq.js`, `14-save.js`, `08-state.js`, stand
`docs/mkgrok.ps1`, suite `91zh-grok.js`). Грохотун: loud, four-armed, three-eyed, delighted to
see you and completely unable to keep his mouth shut. He digs the expedition's sites for a
living, knows what an obelisk **is**, and knows nothing at all about who left it.

- **A run, not a seat.** He shows up in the cantina with one line of his own. He never joins the
  crew, never takes a domain and never asks for a ship: the four-seat rule does not move. Hand
  him a site from your own map layer, fly away, come back to a result.
- **He does not take credits.** He takes food, in quantity, and the quantity grows with every
  site he closes — the one supply line in the game that exists for a person rather than a
  profit.
- **Digging costs more than the hold.** A dig is loud: the sector he worked goes up a step of
  pirate occupation. And he talks: half the time he comes back, he tells the tables where
  **you** have been, and that is one of the ways a hunter finds you.
- **Sites come from your own layer** — the addresses the report named and the points of their
  survey. Each site is a witness's place: it hands over a piece of the report, plus whatever the
  spoil heap yields. A closed site is never offered twice.
- **He is the tutor, once.** The first time you are holding something you cannot read, he
  explains where words come from — and explains only: not one word lands in the dictionary.

Portrait faults found on the stand and fixed: the dust sat over his head like a floating halo;
the teeth were a keyboard glued under the smile instead of teeth inside a mouth; the skull was a
flat oval with no light on it; and four arms grew out of nothing without a shoulder between them.

## 0.70.0 — "The shift nobody came to end"

**M119** (`12ta-tin.js` new, `21-mode-surface.js`, `18-mode-map.js`, `14-save.js`, `08-state.js`,
stand `docs/mktin.ps1`, suite `91zg-tin.js`). A world picked clean and abandoned — and the
owner's machinery still running, with nobody left to run it for.

- **It transmits on a loop.** Jump into the system and you hear the request itself: the same
  goods, the same count, "the shift continues". A running plant is the only one that goes quiet.
- **The order is written in units that no longer exist** — barrels, crates, stakes, details,
  settings. Nobody is coming to fix the paperwork, so the conversion is the player's job: pour
  goods in and the counter clicks over, and the machine tells you its rate once it has taken
  its first measure of anything.
- **It restarts a piece of production.** A closed order runs a shift exactly as long as the
  feedstock lasts; the plant makes what it was built to make and drops it in the outlet bin.
  It has no mood, no opinion and no favourites: it gives you everything it made and never a
  credit. The cheap version of the giving loop, and a place to learn it before a living village
  is at stake.
- **The tape is an honest witness.** Machines record everything and understand none of it: three
  entries, each a date and a bearing and a number where a description should be. The date is
  read by the sky's calendar (M107); the bearing lands on the map as a mark; and each entry
  hands over a piece of the report — the third witness the pool has been waiting for.
- Never where a settlement could live: the shift nobody came to end is about the absence of
  people.

Faults found on the stand and fixed: every part sat on its own patch of terrain, so on a slope
the plant fell apart and the outlet bin sank into a pit (one level now, on a slab with an
embankment under it); the slab itself hung in the air; the conveyor read as a wire; the smoke
was a column of even circles; and the intake gave no sign of how much of the order was already
in it.

**A bug fixed on the way:** `addRes` returns how much fitted, not whether it worked. Read as a
boolean, a full hold would have swallowed a whole bin of output.

## 0.69.0 — "Fifty-two things to do on a perch"

**M117a** (`12z-parrot-acts.js` new, `12y-parrot-face.js`, stand `docs/mkparrot.ps1`,
`docs/parrot-live.html`).
The bird got a body at M117 and then had nothing to do with it: it breathed, blinked and rocked,
and after a minute of watching that reads as a loop rather than an animal. The window is the only
place it is ever seen — open it and it is there, close it and it is gone — so everything the
player learns about it, they learn from what it is busy with.

- **A repertoire of 52 behaviours, written as data.** Fifty hand-written animations would be
  fifty pieces of code nobody debugs and half of which nobody sees. Instead the bird gained ten
  degrees of freedom — head roll, tuck into the shoulders, a step along the perch, a turn through
  edge-on, a wing stretch that is not a flap, one lifted foot, a tail fan, a yawn, a shiver, a bow
  and an upside-down hang — and a small sequencer on top of the springs. A behaviour is one line.
- **A behaviour never switches life off.** It writes only its own degrees of freedom; breathing,
  rocking, the ripple across the rows and the blinking keep running underneath. The resting pose
  is every field at zero, so any behaviour settles by itself and none can get stuck on a frame.
- **Three moods decide what can happen at all.** Drowsiness accumulates while the bird is left
  alone and is spent by a nap that ends on a clock rather than on a dice roll; a poke makes it
  cross for a few seconds. Measured, not assumed: the first two models left the bird asleep three
  quarters of the time and never once cross, and the measurement itself was misread twice because
  the stand served a cached build — the game page is the honest place to measure.
- **Rare things stay rare.** Hanging upside down carries the weight of one against fifty.
- The bird still does not invent: when a behaviour makes it speak, the line comes out of its own
  memory (12x), glyphs and all.

**A numbering note.** The repertoire took 0.69.0, which the plan had pencilled in for M119
(Грохотун); that milestone moves down a version, as the bird's body did at M117.

---

## 0.68.0 — "The meadow that remembers light"

**M118** (`20c-peep.js` new, `21-mode-surface.js`, `12q-lore.js`, stand `docs/mkpeep.ps1`).
The one place where the expedition is **seen** instead of read about — and the payoff that
makes the sky's calendar (M107) matter at last.

- **A mat that holds light.** Roughly one solid world in nine that has a moon grows подглядка:
  flat overlapping plates in three tiers with tufted stalks, labelled where you stand on it and
  otherwise indistinguishable from ground cover.
- **It replays only in the dark**, which on a planet means during an eclipse. Figures walk
  across the mat in cold light — how many, which way, and what they carried. Nothing is
  captioned, ever: the player reads it or he doesn't.
- **The scene is fixed per world** (count, load, direction, and the beat where one of them stops
  and turns back), so the same meadow shows the same crossing every time.
- **Watching pays.** A full pass, stood through inside the mat, hands over a piece of the report
  like any other witness. Walking away resets the watch — halves from two eclipses do not add up.
- **Bug, and an old one:** a place key that was a string (`"sat:7"`) coerced to zero, so every
  satellite in the galaxy pointed at the same fragment and went silent after the first. Strings
  now fold into a number of their own; numeric keys are untouched.

Faults found by eye on the stand and fixed: the mat drawn in one row read as a highlighted
terrain contour rather than a growth; single stalks read as antennas (they grow in tufts now);
the night glow hung over the meadow as a lens of fog (it lies flat along the ground); the ghosts
stood a head taller and bulkier than the astronaut beside them; the stride was a pair of
scissors; and the carried pole ran clean through the leading figure instead of ending in his
hands.

## 0.67.0 — "The bird has a body"

**M117** (`12y-parrot-face.js` new, `index.html`, `style.css`, `17b-finds.js`, `28-loop.js`,
stand `docs/mkparrot.ps1`). Closes the open tail left by M116: the repeater was a line on a
board — no picture, no presence, nothing to touch.

- **A perch window.** Opened from the menu (the button appears only once a bird is aboard), it
  hangs over the world in any mode and closes with the cross. The bird is property, not an event.
- **Drawn procedurally, animated on springs.** Cobalt back, cream breast, long layered tail and a
  crest of thin plumes, each carrying a cold bead on a bare stalk that lags half a beat behind the
  head. Breathing, blinking, sway, ripple per feather row, and a full-body wing beat.
- **Five poke zones, five answers** — crest, beak, ruff, tail, body. What it says is only what it
  heard (12x): unread pidgin still comes out as glyphs. It never invents a line.
- **The bird now actually exists.** The roll on the hulk find is gone: the first hulk opened hands
  the bird over, because a pet that reaches half the playthroughs is a lottery, not a mechanic.

Faults found and fixed by eye over five stand passes, in order: the dark mass showing between
feathers (coat clipped to the body outline), the coat reading as a zebra and then as cobblestone
(denser tiling, low-contrast scales with one shadow under the edge), wing and tail merging into
one broom (separate axes), and plumes drawn as stem-plus-strokes reading as fish bones (a filled
vane along the stem).

## 0.66.0 — "It says only what it heard"

**M116** (`12x-parrot.js`, `17b-finds.js`, `12q-lore.js`, `26-ui-station.js`, `13-pirates.js`,
`27h-ui-lore.js`, suite `91ze-parrot.js`). The first of the five witnesses, and the only thing in
the game that gets better while you do nothing.

- **Трепло ушастое** — a repeater found once per playthrough in the effects aboard a wrecked
  scout, with its dead owner named. That is how the player learns there was a dead man, well
  before he learns who. (The pass spec sources the first bird from the bazaar, M120; the hulk is
  the same kind of source — someone's property with a known fate — and does not wait for it.)
- **It never invents.** Every line traces to an event the player was present for: prices heard at
  a counter, a phrase picked up at a notch, the name of a ship he shot down.
- **It pays before it is understood**: at a foreign counter it repeats the prices of a station you
  docked at earlier, opening that market with no flight.
- **Comprehension is retroactive.** Pidgin lines are stored as word *numbers* and shown as glyphs;
  a word arriving from a fragment re-reads everything already remembered, and a phrase heard in
  hour two can start speaking in hour twenty while you sit still. A decoded phrase pays with an
  address, the same currency a notch pays in.
- **It testifies against you too.** What it overheard from you it eventually blurts at a counter,
  and that costs reputation where it was heard. Once per line.
- Everything it remembers is read on the fragment board — these are depositions, not a new screen.

## 0.65.0 — "The assembled account"

**M115** (`12w-survey.js`, `18-mode-map.js`, `27e-ui-home.js`, suite `91zd-survey.js`). The last
milestone of the twelfth pass, and with it the pass is closed.

- **The expedition's own survey**, drawn over your map in their notation — a cut cross with a line
  under it. Each earned fragment puts up exactly one point, including in systems you have never
  visited; nothing appears in advance.
- Their points are a pure function of the fragment seed, so the survey is the same in every session
  and does not follow the player around: it was taken long before him.
- **A chapter you have read joins its own points** with a dashed leg. Scattered notches become a
  route only when the account behind them is finished.
- **The study gains its shelf** under the museum wall: one spine per fragment, in the order this
  player found them, coloured by chapter. No text and no revelation screen — the ending is the
  layer, the settlement that lives, and the glyphs you can now read.

## 0.64.0 — "A world that ends on schedule"

**M114** (`12v-doom.js`, `02-world.js`, `21-mode-surface.js`, `12t-settle.js`, `14-save.js`,
`28-loop.js`, suites `91zc-doom.js`). The chapter the obelisks and the sky calendar were built to
reach.

- **The date only lands where the player has something to lose**: one deadline per playthrough, on
  the system where his own settlement reached stage 2. It is learned under that sky, not from a
  menu, and shows up on the same map layer the rumours use.
- **Evacuation is the ordinary machinery of the game**: people are a line in the hold (`RES.folk`),
  so lifting is hold space, trips and time. Not sellable, not giveable, never dumped for overflow —
  and if the ship is wrecked with people aboard, that is written down as its own line.
- **Nobody assists.** Hired hands count only if they were already ordered to that sector, and they
  carry half a hold each: the number lifted is the number the player organised in advance.
- **Where they land is the outcome.** Any live world in another system with nobody on it: the
  settlement restarts at a lower stage with half its buildings left behind, but keeps its seed,
  its name and therefore its vocabulary — the same people, not new ones.
- **Not lifting them is a permitted ending.** The hour passes, the settlement is gone, the system
  stays on the map empty and their glyphs have nobody left to answer. No penalty is charged; that
  is the whole weight of the decision.

## 0.63.0 — "The rate has reasons"

**M113** (`12u-scrip.js`, `12p-news.js`, `13b-occupy.js`, `12t-settle.js`, `14-save.js`, station
tab `scrip`, suite `91zb-scrip.js`). Four trading houses, and a scrip you can bet on.

- **A house owns stations**, decided from the system seed on its own hash stream. Its scrip is a
  claim on that house — bought and sold **only at its own stations**, worth nothing anywhere else.
  It is not a second wallet: it buys nothing and discounts nothing.
- **The rate moves only on events that really happened.** `scripMove` is the single door, it
  refuses a move without a reason, and every move is written to a ledger the player can read on the
  tab. Sources: a station changing hands, a barge that never arrived, a sector gone quiet, emptied
  warehouses (all rolled by M99 anyway), plus two of the player's own — a settlement reaching stage
  3, and a system freed of occupation. No random walk, no drift term.
- **Round-tripping is a loss**: 6% spread each way and a 40-unit cap per docking. The only edge is
  knowing first — which the player does, because he causes most of it.
- Neither the wallet nor the holding can go negative; a save with a nonsense rate is clamped, an
  unknown house is dropped, and ledger lines without a reason are thrown away on load.

**Repair.** `src/01-core.js` had been saved in the wrong encoding during 0.60.0, which turned the
name syllables into mojibake — every generated star, station and planet name in the game came out
as garbage. The file is restored; names read again.

## 0.62.0 — "Ammunition is cargo"

**M112** (`16b-missile.js`, `05-parts.js`, `02-world.js`, `08-state.js`, `13-pirates.js`,
`26-ui-station.js`, suite `91z-missile.js`). Missiles enter as a second logistics problem, not a
second gun.

- **A new part kind**, `missile` — the launcher — with its own hardpoint. Every hull gets exactly
  one, appended **last** so slot indices of existing loadouts do not shift and old saves keep
  their fits. Two affixes of its own: warhead and guidance.
- **A missile is a line in the hold.** `RES.missile` takes cargo space like ore, the market does
  not trade it, managers do not eat it as a sample, and the settlement is never handed it as food.
  Flying out with a full magazine means flying out with no revenue — that is the whole decision.
- **Assembled in the lab**, next to part crafting, out of alloy and isotopes; a working lab of your
  own adds to the batch. A batch that does not fit in the hold is not assembled at all.
- **It hits everyone** — baron, hunter, renegade — unlike the battery (M111). The price is hold
  space and the fact that a miss is spent for good: the missile picks its target once, at launch,
  never re-acquires, and burns out.
- Own pad and key (`G`), shown only where it can be fired, labelled with what is left in the hold.

## 0.61.0 — "The battery is built, not bought"

**M111** (`21d-battery.js`, `21a-mode-base.js`, `21ab-base-interiors.js`, `13-pirates.js`,
`20a-poi.js` + `20aa-poi-shapes.js`, `20b-poi-find.js`, suite `91h-base.js`). System defence
enters the game as a compartment, not a purchase.

- **A room in the base cross-section**, top level only, `-12` power inside the existing balance:
  defence competes with production, so putting one up is a real decision, not a shopping trip.
- **It cuts noise and only noise.** `battTarget` takes the stray jackal — no rank, no special
  role — and can do nothing at all to a baron, a hunter (M98), a renegade (12g) or a rival.
  Range is around its own planet, not the whole system, and a browned-out base fires slower.
- **Visible from orbit**: a line from the ground under the ships (`battDraw` inside `drawCombat`),
  with a kill written to the log by name.
- **The magazine is drawn**, because from below you see what feeds the gun, not the barrel: the
  turret ring in the ceiling hatch, the feed hoist, shells standing at hip height, and a firing
  lamp that lights exactly when the battery is actually shooting.
- **The expedition built these too.** A dead battery is a new POI on solid worlds
  (`drawDeadBattery`, stand `docs/shots/poi-battery.png`); walking up to it pays a piece of the
  report, like a notch, because it is their government property and not someone's monument.
- `20a-poi.js` was cut along its seam: the shapes moved to `20aa-poi-shapes.js`.

## 0.60.0 — "They stand between you and the fauna"

**M110** (`12t-settle.js`, `22-mode-cave.js`, `18-mode-map.js`, suite `91y-settle.js`). A
settlement is now felt on foot, not only in a tally.

- `settleWatch(p)` — the watchers are a fact about the ground, not a buff on the player: they
  work from stage 2, only on the settlement's **own** planet, and only while it is fed
  (`mood ≥ 30`). A hungry village drops its watch first.
- In a watched biome a cave holds **fewer** biting beasts, and the ones there close only to a
  line and cannot bite at all. The prompt says why, so the player reads it as their doing.
- It cuts the other way. `settleLeftBehind()` runs on `jump()`: the tail you leave over their
  heads lands on them. The price is taken per pirate that had **noticed you** — a hunter (M98)
  counts double, since he does not care whose roof it is. Mood always; a building only under a
  dense raid. The settlement is paid nothing for it — cover has a price, not a fee.
- `raided` added to the manager-style whitelist in `applySave` so the count survives a save.

## 0.59.0 — "You give, they decide"

**M109, the settlement** (`12t-settle.js`, suite `91y-settle.js`). Habitable worlds have people
living on them, and the one thing you cannot do is give them orders. You hand over cargo on foot —
whatever you happen to be carrying — and they choose what to raise from it: their own leaning from
the seed, tilted by what you kept bringing. Ten hours of ore and ten hours of volatiles make
different villages. Growth is a lazy roll over elapsed time with the 24-hour offline cap, never a
live simulation; while there is food in the barn they eat and build, and when it runs out their
mood falls. They pay **in goods and on their terms** — you ask, and the mood decides whether
anything is ready; a settlement never pays credits, and asking twice in a row gets you nothing.
At stage 3 they become a stop on the factor's map and barges start calling, exactly as your own
planet does. They answer in the expedition's worn pidgin: a line of glyphs where the only words
you read are the ones that came to you as fragments of the report.

Also: the graphics queue was rewritten as a **debt list** — one line per fault found by looking —
and the narrative of twelve base passes and the first `scoop` pass moved to `docs/PLAN-archive.md`.

## 0.58.0 — "The luxe yacht is no longer a courier with bus windows"

**A yacht is the one hull bought for the look of it**, and it was an arrow with a strip of
identical yellow windows — a courier with a school bus painted on the flank. Ten passes over one
stand (`docs/mkyacht.ps1` → `docs/shots/yachts.png`), luxe yachts only.

- **Form.** A long thin body: fine drawn-out entry, beam aft of midships, a tail that runs almost
  to a thread. A **manta wing** grown out of the hull by a strake, thin, with tips swept back past
  the stern, and the **spindle nacelles standing on the wing** — each with a needle forward, which
  is what makes the thing read fast while parked.
- **Materials nobody else in the fleet has**: deep lacquer with metallic grain instead of riveted
  plates, teak on the open deck only (foredeck, fantail, two side promenades — the first pass
  planked the whole ship and it read as parquet), brass edging, pearl superstructure with a fine
  carbon weave.
- **Three tiers instead of a fighter canopy**: saloon, promenade deck, and the owner's wheelhouse
  under a glass dome. Continuous panoramic glazing with warm light spilling onto the deck — the
  band of twenty identical windows was the single thing that gave the courier away.
- **Three engine schools**: `candle` — one long nozzle on the axis, `pods` — the pair on the wing,
  `crown` — small nozzles across the transom. Luxe thrust is cool, white-blue and half the length:
  an orange bonfire astern reads as freight.
- **Three finishes** (`classic` brass-and-teak · `pearl` white-and-chrome · `noir` near-black with
  gold) so six seeds are no longer one yacht, plus a name in brass instead of a stencilled
  inventory number, a tender port with a gangway, a helipad on the fantail and deck lighting.

Suites — 2966 green.

## 0.57.0 — "Finds in flight, and half of them are theirs"

**The space between planets was empty** — item 5 of the visual queue, open since M55. Minutes of
transit were something to sit through.

- **Four finds**: an escape capsule still calling, a dead satellite still transmitting, a drifting
  container, the wreck of a survey ship. Approach and inspection are exactly the barge-wreck ones
  (M95); rewards come from `POI_FIND` and `rareTake`. No fifth system was grown for this.
- **One of the four is theirs.** The satellite belongs to «Долгий Ход» and is the only find that
  carries a fragment of the report — and it always transmits a **bearing**: a sector you can fly
  to, marked on the map. The other three pay in the ordinary currency of the game: parts, cargo,
  fuel, reputation. None of them pays credits.
- **Deterministic by system key and a coarse six-hour bucket.** Re-entering a system does not spin
  the drum; come back tomorrow and the void has changed. What you took stays taken forever.
- **Empty systems are normal** — about two in five. A find that is always there is not a find.

Suite **"finds: the void stopped being empty"** — 2938 green.

## 0.56.0 — "The sky keeps a calendar"

**The far corner of the galaxy differed from the near one by a danger coefficient and nothing
else.** A place becomes a place when time is attached to it: come back on such a day, because on
that day something happens here. This is the first milestone of the long story told in pieces.

- **Four events, all computed, none rolled.** An eclipse (a moon of the world you stand on crosses
  the star), a parade of three or more planets inside an angular window, a comet on a long ellipse
  that arrives and leaves on schedule, and the day count itself. `celestAt(sys, t)` is a function
  of time — the same day in the same system always gives the same sky, which is what makes it
  possible to arrange to meet there.
- **The world has a second, slow clock.** In the system view planets circle in half a minute — that
  motion is a flight playground, deliberately clamped so the autopilot can catch things. A calendar
  cannot rest on it. `CEL_DAY` is a minute of play; moon periods run 4–21 days, comets 200–470.
- **It is light, not UI.** An eclipse takes the directional light out and leaves the sky's fill, so
  the world goes flat and blue rather than black; colour drains before brightness does; flora that
  lives on light folds up. The header names the event, because a picture with no name reads as a
  glitch.
- **Its one mechanical right**: reading an obelisk (M106) under the same sky it was cut under gives
  a **second answer** — the address of the next fragment in that chapter. No bonus, no multiplier.
  Prices and yields never see the sky.

Suite **"the calendar: the sky is computed"** — 2923 green.

## 0.55.0 — "The ship ages"

**The garage had nothing to do.** A hull only ever went bad in a fight, and a fight is patched at
any station for fourteen credits a point. Now the ship remembers the hours.

- **Wear accumulates by itself**, from hours flown, and faster where it is dirty: the belt sands
  the paint, the mine dusts it, a gas giant's atmosphere eats it. Three hours at the stick take a
  hull from `свежий` to `облезлый`.
- **You can see it.** The colour stripe — the ship's one identifying mark — fades toward the body
  colour and dusts over; scuffs open along the leading edge; soot settles by the nozzles. It reads
  at thumbnail size, which is the only size that matters in flight.
- **It costs the hands, not the hull.** Up to −12% thrust and turn, and nothing else: an unwashed
  ship handles worse, it does not break. Hull, tank and hold are untouched.
- **Repair and service are different things.** A station patches holes; the yard will take half the
  wear off for real money. Only your own garage at home takes it down to clean, and takes nothing
  for it — the house has no prices. You come home because it has piled up.
- Wear lives on the **hull**, not on the player: switching ships lets one rest, it does not wipe
  its history.

Suite **"wear: it piles up in flight and comes off by hand"** — 2908 green.

## 0.54.0 — "A trade branch of your own"

**The factor had a route; the player had a sticky note.** Since M84 the domain has been trading
real goods at real prices, and the player kept "where titanium is cheap" in his head. Now the
route is a thing on the table.

- **Mark 2–4 stations on the map** (`В МАРШРУТ` on the selected system) and the game reads the
  live market for you: what to take on each leg, at what price it lands, how much the loop nets
  after fuel. The ring closes — the way back is half the money, and it is counted.
- **It lies on the map, not in a list**: numbered stops, arrows for the direction of travel, and
  one label on the best leg. One, not four: three plates turned the map into a table.
- **It can be sold.** An information buyer pays for the spread and starts working it himself:
  the route leaves your map and the prices on it settle. Sold means lost, and that is the price
  of quick money. The paper is valued at a full hold, not at your current purse — a spread does
  not get cheaper because you are broke.
- **It can be handed to the factor**, who takes as many legs as his level and the `плечо` perk
  allow, and carries it instead of you.
- **It wears out.** Every loop you run presses the price down where you sell (the market has done
  this since M84), so the ring thins with use and asks to be replanned. A route is not a machine
  for money.

Suite **"the route: legs, the count and the paper"** — 2891 green.

## 0.53.0 — "Reputation decides who walks in"

**Reputation changed the prices and the number of tables, but never who sat at them.** Now it
decides the company: where you are known, at least one manager at the bar has a level (two at the
top of the scale, and they ask more for themselves), and a hired hand with a real flight record is
looking for work. Where you are remembered badly, whoever turns up has no history at all.

**It is not access progression.** The room never empties, and the content of a deal never changes
with reputation — the same deal reads the same at +5 and at −5. Reputation buys company and price,
never content.

## 0.52.0 — "Nodes and crowns in hand"

**The thing stands where you actually look.** A holder on the left cockpit pillar (`25-cockpit`)
carries one found node — a real object drawn by the same generator as everywhere else, hanging on
a short line and swaying with roll and yaw. The forged crowns sit on the bracket itself as a small
bar, so the marks that were only ever visible along the hull from outside are finally visible from
the seat.

**The holder gives nothing.** It is not a slot and not a bonus — effects still come from crowns
only. Choosing what stands there is "what I want to look at", not an optimisation. Any node you
own can be put in from the sets screen; without a choice it shows the last one found, and a node
that leaves your collection leaves the holder.

Fault found by eye and fixed in the same pass: mounted on the central stack the node landed inside
the pitch ladder and the hull nose and read as a rock *outside* the glass.

## 0.51.0 — "A lived-in house"

**The things can be poked.** Clicking the garage parks a ship, clicking the showcase puts the rare
stock out, the study and the living quarters answer with what is in them. The buttons in HOLDINGS
stay — the scene is a second way in, not a second set of rules, and the hit zones are computed by
the drawing itself, so there is no second description of the geometry to drift out of sync.

**The hallway and the garage caught up with the rest.** After M93 the other steps were lived in
and these two were a door with three hooks and a niche with a ship. Now: a doorway with a frame and
panels, a plank of hooks with coats that have shoulders, boots by the threshold, a shelf with keys;
in the garage a workbench with parts, a tool board under the ceiling, a drum, rags and a puddle
under the stern. Faults found by eye and fixed in the same pass: the coats read as a bottle until
the hallway grew wider, the tool board lay inside the ship's hull, the ship floated above its
trestles, the power cable crossed the silhouette like a whip, and the museum wall shouted over the
whole room until its colours were mixed down into the wall.

**People are visible at home.** Whoever is not on a run sits in the living quarters as a real body
(the same `hqFigure` as everywhere else, squeezed to the room's scale). Low morale is drawn — the
figure is smaller, darker and sits — so it stops being an invisible multiplier.

**A housemate speaks once per step.** A tip that leaves a real mark on the map, a spare part, or a
rumour — once per tier and never again, remembered through saves, so he never becomes a tap.

**The museum wall** hangs over the desk in the study: taken pieces framed, the rest bare nails.
The progress board lives there too, as a log of what was brought and from where.

## 0.50.0 — "The world moved without you"

**Time away is told in words, not simulated.** New module `12p-news.js` rolls the elapsed time
into rumours you hear in the cantina — a station squeezed dry, an owner changed, a barge that
never arrived, a pirate captain someone else took down. Behind every rumour stands a real state
change you can fly out and check: market pressure, a wreck lying where it fell, a sector gone
quiet.

**Knowledge is a layer on the map now.** Each rumour leaves a mark on its sector — "prices moved",
"the owner changed here", "a barge wreck" — closing the M92 tail where knowing something and
seeing nothing on the map amounted to not knowing it.

**A rival collector is a transfer, not a loss.** He takes a rarity you had not found yet, and
becomes its address: he flies his own sector, he does not give it up willingly, and beating him
hands the piece over. He never takes the last one, so a hundred out of a hundred — and the planet
that depends on it — stays reachable.

New suite **"the retelling: rumours don't lie"**.

## 0.49.0 — "Somebody came for you"

**Reputation finally has a far side.** Until now it only helped — cheaper fuel, more people at the
tables — so hostility cost nothing. Breaking a barge yourself now creates a personal score: a
captain with a name (`G.hunted`, new module `12o-hunter.js`) who works his own sectors and grows
a tier with every fresh deed.

**He comes only for a debt, and only once.** No hostile act, no hunter; he never appears "for
difficulty". Killed, he stays killed — through saves — and his bounty is paid exactly one time,
never again, even if the faction's score against you starts over.

**Recognised in a fight, and his lair has an owner.** He is baked with the flagship silhouette
(12i), so he reads at a glance among ordinary pirates. His home sector's base now carries his
name and his colour from the outside and holds one tier more guard inside — closing the M87 tail
where a lair looked like any other base until you boarded it.

New suite **"the hunter: comes only for a debt"**.

## 0.48.0 — "A planet of your own"

**The full hundred buys what money cannot.** Collecting all 100 rarities (12m) now hands you a
planet — the one you were standing on when the hundredth came in. It is not bought, not chosen
from a list, and nothing is handed out below a hundred: partial progress is already paid for by
the wall at home. New module `12n-planet.js`.

**It is a second growth counter.** The house grows from turnover, the planet from completeness,
and the two funnels never mix: the node produces goods and **never pays credits**. Its stock
accrues lazily by real time up to a ceiling per resource — haul it yourself while you are in the
system, or wait for a barge.

**You stop being a client of the economy and become a node of it.** The barge router (12l) takes
the node as a stop on equal terms with a station: it appears in route legs, and a barge that
passes through carries your goods to you for free — a delivery, not a deal.

New suite **"the planet: full set only"**.

## 0.47.0 — "The monument remembers"

**Monuments answer by type again.** The surface ran its own cut-down inspection and never called
`poiInspect`, so the whole per-kind reward table was dead in the game while the tests, which called
the function directly, stayed green. Walking up to a temple now really hands over a coordinate, an
observatory its prices, a factory its warehouse, the gates their fuel — and the rarity on that
place's address (0.46.0) is finally taken on the ground rather than only in tests.

**And it remembers what it gave.** An inspected monument no longer greets you with a bare
"осмотрено": it shows its own answer where it stands, so a second walk out to it is a decision
rather than a guess. Old saves keep loading — a monument inspected before this version simply has
nothing to recall.

## 0.46.0 — "A hundred rarities"

**Rarities.** A new and hardest layer of finds: a closed table of exactly one hundred rare things.
Each has an address of its own rather than a drop chance. A place either holds a rarity or it
doesn't, and reloading won't budge it: you can't grind one out.

**Where to look.** Only among what already lives: on monuments, under a temple's slabs, deep in a
cave, in a worked-out belt rock, in a baron's lair, in the hold of a sunken barge. What you carry
off accumulates on a board next to the node sets.

**The effect is not money.** Every rarity grants a small property of a thing (radar reaches
further, a roomier hold, a meaner gun), read in the same place as modules and crowns. Not one of
them pays credits: the showcase is not an ATM. The full hundred will open something that cannot be
bought.

**The temple with a known coordinate speaks again.** It used to stay silent if the artifact
coordinate was already known; now it hands over the rarity of its slabs — the M92 tail is closed.

---

## 0.45.0 — "A barge in distress"

**Interception.** Sometimes you find a barge already under pirate fire. Three outcomes, each of
them a deed: drive the pirates off and save her (reputation up, a share of the cargo in thanks, the
captain remembers), pass by, or finish her yourself — the cargo is yours, but the faction will
remember and reputation drops sharply.

**Escort contract.** A peaceful barge will hire you as escort: the advance is paid up front and the
destination goes into the journal. Failure doesn't take credits — it hits reputation. There is no
steady profit here, same as with a hired hand.

**Wreckage.** A sunken barge leaves a wreck in the system — searchable exactly once for a usable
part, like a planet-side "ship wreck". Wrecks survive a restart: they are the trace of your
decision, not scenery.

**A passenger.** Now and then a barge in distress carries a person rather than cargo. Save them and
they surface in the cantina as a hire with a line about that run, and come cheaper than usual. The
only hired hand who comes to you on their own.

**The trade factor has a body now.** The route that used to be a spread on the map and a line in a
domain summary now carries real cargo between the factor's real stations. A barge is a long
workhorse with a container spine, big slow nozzles and a wheelhouse; no weapons. You can approach
one in a system and haggle without docking.

**Trading without docking.** A barge sells its cargo dearer than the destination station and buys
yours cheaper than it does: there is no money in the spread, the gain is time — you don't have to
fly all the way to the station. The captain has a name and a temper (tight-fisted, timid, sturdy)
which drives the discount. A deal nudges reputation, like a small station would.

**On the map, a slow dot** between two stations on a leg of the factor's route: loaded out, empty
back. Barges are ephemeral, like pirates and the belt — they never enter the save.

**Station reputation.** Its own per station, from "you aren't welcome here" to "you're one of ours".
It rises from closed business and lifted blockades, falls from broken promises. It affects fuel,
repair and hiring — the things a person prices, not the market.

**A set's last nodes are only in a baron's lair.** While more than three in a family are still
missing they drop where they always did; the tail is taken where you have to go and get it.

**A node became a thing.** Each of the thousand nodes has a look assembled from its seed: a polygon
body, a detail per family and a finish per rarity — piping, a stamp, chipped patina or a glow from
within.

**Cantina business sat down at the tables** in the drawn room: you poke a table the way you poke a
candidate at the counter.

1214 green.

---

*Entries below are in Russian.*


## 0.36.1 — «Логово, подавленный очаг и яхта, которая что-то значит»

Заход по хвостам, записанным в PLAN за 0.36.0.

**Логово барона.** В занятой системе пиратская база — не просто база: уровень
выше на занятость, отсеки крупнее, охраны больше, а на мостике сидит барон —
втрое живучее обычного главаря, с полосой во всю ширину и подписью. Отдельного
режима под «данж» не понадобилось: абордаж уже умел всё, чего это требует.

**Разбитая база гасит очаг.** Уход из рейда с добычей подавляет очаг: уровень
занятости падает, а наступление в двух секторах вокруг замирает на сутки. До
этого отбивать системы можно было только бесконечно — теперь у фронта есть
корень, который можно вырубить.

**Яхта наконец что-то делает.** Кредитов она по-прежнему не приносит и не
должна: пока яхта в ангаре, наёмники отдыхают на ней между рейсами и мораль
возвращается на четверть быстрее, а с достроенным причалом дома — в полтора
раза. Единственное, что даёт роскошь, — и оно про людей, а не про деньги.

**Противники абордажа перерисованы.** Враг был овалом с кружком-головой —
теперь тело по тем же правилам, что фигуры в кантине и рубке: плечи шире таза,
ноги врозь с разным тоном, обе руки на оружии, шлем с забралом-полосой. У
тяжёлого ствол на сошке, у барона плащ с вырезом, наплечники и гребень.

1088 зелёных.
---

## 0.35.0 — «Рубка вместо списка, маршрут вместо константы»

**ШТАБ стал местом.** Экран управляющих был последним списком строк в игре:
теперь это рубка (`27f-hq-room`) — четыре пульта доменов, у пульта стоит тот,
кто домен держит, экран показывает настоящее состояние домена, пустой домен
виден обесточенным пультом под чехлом. На голо-столе — ваша система: звезда
своего класса и настоящие планеты на своих орбитах.

**Маршрут фактора стал предметом (M84).** Домен приносил `26 × плечи` — число,
не замечавшее рынка. Теперь фактор ищет лучшую пару «где дёшево → где дорого»
среди станций, которые вы ему открыли, и живёт с ОТНОСИТЕЛЬНОЙ маржи: в карточке
домена видно, что он везёт и почём. Он давит собственную цену там, куда возит, —
маршрут перестал быть вечной рентой.

**Экономика пересчитана.**
- прибавки фактора складываются, а не перемножаются: семь перков давали ×3.7 и
  превращали домен в станок (до 1200 кр/мин; стало 130 голым и ~420 прокачанным —
  активная торговля Мамонтом по-прежнему выгоднее);
- точка под дроном меряется деньгами, а не штуками: пул обратен корню цены. Дрон
  на кристаллах возвращал двенадцать своих цен, на железе — полторы; стало x5.6
  против x1.8, и дорогая точка вырабатывается втрое быстрее;
- второй порог дома смягчён (25 000 → 9 000): скачок ×25 был единственным местом,
  где дом надолго замолкал.

1019 зелёных.
---
## 0.34.0 — «Хвосты: комнаты дома заработали, посадка подняла пыль, подбитый пират стал рваным»

Заход по хвостам, записанным в PLAN за три прошлые вехи. Ничего нового не
задумывалось — доделывалось обещанное.

**Дом (M83).** Ступени перестали быть украшением:
- **кабинет** даёт каждому управляющему ещё одно место под стоящий приказ;
- **жилая часть** — мораль наёмников восстанавливается вдвое быстрее: между
  рейсами человек живёт в доме, а не в кабине;
- **витрина** — выставленное редкое сырьё работает репутацией: домены приносят
  до десятой части сверху, и чем богаче витрина, тем больше;
- **мастерская** — переборка части: свойства генерируются заново, но ступенью
  ниже. Это не улучшение, а второй бросок: плохая часть перестаёт быть мусором,
  хорошую перебирать себе дороже;
- поставить корабль в гараж и вынести редкое на витрину теперь можно кнопками, а
  не только из кода.

**Посадка (M81).**
- тяга на посадке направлена вверх, а маршевые движки смотрят назад — поэтому
  из брюха теперь бьют три тормозных сопла. Пока факел шёл из кормы, корабль на
  подходе выглядел разгоняющимся вбок, а не висящим;
- струя поднимает пыль: низкое облако цвета грунта, тем гуще, чем ниже, и оно не
  исчезает мгновенно после касания. На мире без атмосферы пыль ниже и резче;
- на касании нос опускается вместе с просадкой стоек.

**Пираты (M82).** Подбитый корабль печётся ВТОРЫМ силуэтом, а не пятнами поверх
целого: ниже половины корпуса отрывает навесное и выгрызает куски борта с рваной
кромкой. Разбитого теперь видно по форме, а не по полоске здоровья.
---
## 0.33.1 — «Дом стал помещением»

Дом перестал быть строкой в списке. Теперь это комната, нарисованная тем же
языком, что кантина и отсеки базы: тёплая стена, одна лампа с конусом света,
пол — и на нём всё нажитое. Мерило прежнее: хозяин ростом 54 px, верстак ему по
бедро, корабль в гараже вчетверо шире человека.

**Комната растёт слева направо.** Каждая ступень добавляет свой кусок: угол с
матрасом и ящиком → прихожая с дверью и крючками → гараж, где стоит ваш корабль
на подпорках → витрина с редким сырьём за стеклом → мастерская с верстаком и
тисками → кабинет → койки жилой части → окно причала с живым огнём маяка. И сама
картинка ровно такой ширины, какой дом: он растёт — растёт и она.

Ни одной цены на экране нет: внизу полоса и строка «до следующей ступени столько
то оборота». Дом не покупается.
---
## 0.33.0 — «Дом: растёт сам, и смерть больше не обнуление»

**У игрока появился дом, и он не покупается.** Комнаты за деньги сделали бы из
него ещё один магазин; дом растёт САМ от накопленного оборота — от всего, что
вселенная вам принесла: продажи, дроны, домены, рейсы наёмников, награды за
пиратов, выручка баз. Со счёта при этом не списывается ничего.

- **оборот, а не баланс:** потраченные деньги всё равно остаются в том, что у
  вас есть. Ступени: угол (1 000) → прихожая (25 000) → гараж (70 000) →
  витрина (160 000) → мастерская (320 000) → кабинет (600 000) → жилая часть
  (1 100 000) → причал с маяком (2 000 000);
- **дом появляется сам** после первой честной выручки и встаёт там, где вы в
  этот момент были. Он один на всю вселенную, не переезжает и не теряется;
- **смерть перестала быть обнулением.** Потеряв корабль без денег на эвакуацию,
  вы больше не начинаете с пустого «Стрижа» в системе старта: вы возвращаетесь
  домой, поднимаете корабль из гаража, теряете груз и половину денег. Дом и его
  ступени целы;
- маяк домой платный и тем дороже, чем дальше вы забрались; ОТ дома летят своим
  ходом — иначе дом стал бы бесплатным такси по галактике;
- пока экрана-помещения нет, дом видно строкой в разделе ВЛАДЕНИЯ: какие
  комнаты есть и сколько оборота до следующей. Ни одной цены — их у дома нет.

**Внутри:** весь доход в игре теперь идёт одной воронкой `earn()`. Это стережёт
тест: `G.credits+=` осталось ровно в одном месте — внутри самой воронки. Новый
источник дохода мимо неё дом бы не заметил.
---
## 0.32.1 — «Пираты: класс виден с одного взгляда»

Проход по различимости классов — первый раз, когда тяжёлого и флагмана
разглядывали на стенде, а не по коду.

- у налётчика клетки под добычу стали вдвое выше, прутья светлые и частые: они и
  опознают его. Тёмными и низкими они сливались с бортом, и налётчик ничем не
  отличался от перехватчика;
- у тяжёлого таран вынесен вперёд втрое дальше — клин виден раньше корпуса;
- один движок у каждого пирата чадит заметно сильнее прочих: несинхронность
  читается по дыму раньше, чем по факелу.

Стенд по классам: `docs/shots/pirate-classes.png`.
---
## 0.32.0 — «Пираты: сваренный корабль вместо вашего в чужой шапке»

**Пират перестал быть вашим кораблём в другой раскраске.** Он рисовался тем же
`drawHull`: полтора десятка полигонов, аккуратная симметрия, чистые панели, —
и бой выглядел дракой двух иконок. Теперь у пирата свой генератор (`12i`): он
варит корпус из трёх чужих, и это его язык формы.

- шесть-восемь десятков полигонов вместо десятка: тело, хребет из плит внахлёст,
  нос или таран, боковые модули, клетки под добычу, движки;
- **асимметрия — правило, а не шум:** слева пилон, справа бак, на одном борту
  приварена целая чужая секция, и мелочь садится на «обжитый» борт чаще;
- навесное: заплаты внахлёст, шипы, крюки, турели на растяжках, антенны-удочки,
  ржавые потёки от каждого шва, метки сбитых по seed;
- **повреждения видно:** с падением корпуса копятся прогары, ниже половины —
  пробоина с факелом, ниже трети — дымный след. Раньше урон читался только
  полоской над кораблём;
- выхлоп грязный и несинхронный: у каждого сопла своя фаза, кто-то обязательно
  чадит;
- три вольных класса (перехватчик, налётчик, тяжёлый) и флагман ренегата,
  у которого под сваркой лежит ВАШ настоящий корпус.

**Кадр это не удорожает:** каждый пират один раз выпекается в свою офскрин-канву
по seed и дальше рисуется картинкой с поворотом — тот же приём, что кэш неба у
гиганта и тайл материала. Живым слоем поверх остаётся только то, что печь
нельзя: повреждения, чад и факелы.
---
## 0.31.0 — «Посадочный корабль: машина, а не игрушка на палочках»

**У посадки теперь свой силуэт.** На грунте стоял полётный корпус, повёрнутый
носом вверх и сжатый до 38 px длины, — при астронавте в 24 px это был кораблик
ростом с человека на четырёх проволочных опорах. Полётный вид — сверху,
посадочный — сбоку, и поворотом одного в другой не переводится в принципе,
поэтому у посадки появилась своя функция, а не множитель.

- корабль стоит боком, длиной 90–130 px — три с половиной–пять человеческих
  ростов, мерило то же, что в отсеках базы и в крупной форме поверхности;
- шасси на три точки с разносом 0.84 длины: у каждой стойки подкос, цилиндр с
  видимым штоком амортизатора и пята с блином, и каждая пята садится на грунт
  СВОЕЙ координаты, а не на общую линию;
- люк открыт, изнутри свет, из люка сходит трап со ступенями шагом около 10 px —
  по нему масштаб читается быстрее, чем по чему-либо ещё;
- блок двигателей выступает из кормы, сопла после посадки ещё светятся; на корме
  киль, на спине радиатор и развёрнутая антенна, обшивка и ливрея — от того же
  корпуса, на котором летаешь;
- посадка стала движением: шасси раскладывается на подходе, на касании стойки
  проседают тем глубже, чем жёстче пришли, и отдают пружиной. Физика посадки не
  сдвинулась ни на строку.

**Зона «у корабля» больше не константа 48.** Она считается от длины корпуса
(0.75 длины), иначе подсказки про базу, дозаправку и взлёт срабатывали бы
из-под днища. Высадка после посадки — за пределами этой зоны, как и раньше.
---
## 0.30.0 — «Крупная форма: мир виден силуэтом»

**У поздних миров появился средний масштаб.** Масштабов на поверхности было два:
валун (радиус до 22) и достопримечательность (150–900 в высоту, две-четыре на
девять тысяч пути). Между ними — ничего, поэтому тип мира различался цветом и
фактурой грунта, но не формой: с трёх шагов все двенадцать миров были одним
силуэтом. Теперь у четырёх поздних миров свои формы в 40–220 px, ростом от
груди астронавта до пятиэтажки:

- кристаллический — друзы призм и одиночные косые иглы с дисперсией по ребру;
- металлический — сорванные плиты обшивки и обломки ферм;
- руинный — фрагменты стен с кладкой и проёмом, колонны с упавшими барабанами;
- джунглевый — деревья полога с ярусами и лианами, гигантские папоротники.

Формы растут куртинами, обходят зону взлёта и достопримечательности, стоят
только на ровных местах и рисуются той же породой и тем же светом, что грунт
под ними. Смешанный мир принимает формы соседа, но реже собственных.

---
## 0.29.0 — «Двенадцать миров и смеси из них»

**Приборы сверху перестали мигать.** Панель просыпалась на любое изменение
показания, а топливо и скафандр текут непрерывно — поэтому раз в несколько
секунд она вспыхивала и гасла сама по себе. Теперь поводом считается скачок:
удар по корпусу, монета, груз. Плавный расход молчит, тревога по-прежнему
держит панель открытой.

**Четыре новых мира.** Кристаллический (поля граней, звенящая музыка, почти
пустой воздух), джунглевый (тёмный полог, дожди и споры), металлический
(голое ядро без мантии, вакуум, кратеры) и руинный (охра и бетон, ступени
плато, чужие маяки). У каждого своя палитра, небо, рельеф, разрез грунта,
погода, облака, музыка и залежи — как у прежних восьми.

**Смешанные миры.** Обычная планета теперь собирается из двух истинных:
ведущий тип задаёт, чем этот мир является, второй — чем он заражён. «Ледяная,
с вулканами» — это не ледяная в других цветах: смешиваются палитра, тяжесть,
небо, формы рельефа, слои породы, погода, облака, голос музыки и залежи.
Чистый мир стал редкостью — примерно каждый четвёртый, и «настоящая
землеподобная» снова читается как находка.

**Вулканических миров в игре не было вовсе.** Порог горячей зоны стоял на
far<.2, а ближайшая орбита даёт far≈.25 — таблицы, погода и музыка для них
были написаны, а планеты не рождались ни разу. Нашлось проверкой «в шестидесяти
четырёх секторах встретились все типы».


## 0.28.0 — «Кантина стала залом»

**Кантина больше не список.** Теперь это нарисованное помещение: стойка с
подножкой и стаканами, полка с бутылками, лампы с конусами света, окно, пыль
в лучах, посетители на заднем плане и бармен за стойкой. Кандидаты сидят у
стойки — по человеку тыкают, и под сценой открывается его карточка с чертами,
разговором и ценой найма. Повторный тык возвращает в зал.

**Голова сидящего — его настоящий портрет**, уменьшённый: в зале и в списке
сидит один и тот же человек, а не двойник. Комбинезон окрашен цветом домена,
так что роль читается силуэтом раньше подписи.

**Кантина своя на каждой станции.** Торговый узел, комбинат, верфь, научная
станция и аванпост различаются палитрой, вывеской, тем, что видно в окне
(док, литейный цех, стапель с искрами сварки, звёзды с планетой, пыльная
буря), и обстановкой — от ящиков и растения до труб, вентилятора, козлового
крана, доски с инструментом, голограммы и штриховки у аванпоста.

## 0.27.0 — «Ангар, небо и читаемые приборы»

**В ангаре пиратской базы появилось железо.** Было: большой серый зал, где пол,
потолок и дальняя стена сходятся в один тон. Стало: штабеля контейнеров у стен,
фермы от пола до потолка, разбитый катер, бочки, кран-балка и тельфер под
потолком. Всё крупное стоит только у стен — в проходе оно было бы фантомом
(столкновений у обстановки нет) и закрывало бы сам зал.

**Над базой больше не ровная заливка.** Две гряды дальнего рельефа с
параллаксом, пыль у горизонта, мачта связи с проблесковым огнём и — если
площадка построена — её огни на поверхности.

**Приборы кабины считаются от высоты доски.** На широком экране доска
растягивалась, а шрифты оставались 8–18 px: показания приходилось разбирать.
Теперь кегль, радиус радара и шкалы растут вместе с доской.

**Небо гиганта печётся реже:** кэш держит три последние планеты вместо одной,
и возврат к соседнему гиганту больше не стоит четверти секунды.

## 0.26.0 — «В отсеках базы завелась жизнь»

**Каждый из восьми отсеков нарисован заново, изнутри.** Было: в ячейке лежала
пиктограмма — кольцо, четыре кружка, треугольник вместо бура. Стало: реактор
с гермокорпусом во всю высоту помещения, светящейся активной зоной, обручами,
теплоносителем в потолок и пультом, за которым стоит человек; буровая с фермой
на башмаках, мотором с рёбрами и ремнём, шнеком в обсадной колонне и лентой
отвала, по которой едет руда; склад со стеллажами в три яруса, где ящики, бочки
и мешки лежат ровно до уровня настоящего запаса базы; жилой отсек с
двухъярусными койками, спящей вахтой, столом с лампой, шкафчиками, зеленью
и обзорным экраном; плавильня с топкой, ковшом на рельсе, льющимся металлом,
изложницами, стеллажом слитков и баком шлака; площадка с гидравлическим
подъёмником, створками в потолке, кран-балкой и бегущими огнями разметки;
щитовая солнечной фермы с автоматами, стрелочным прибором и батарейной стойкой;
лаборатория с колбами, центрифугой, голограммой и находкой на подставке.

**Всё меряется человеком.** Рост человека в сцене — 24 px, и от него посчитаны
стол, койка, стеллаж и высота реактора: раньше кольцо реактора было по пояс
стоящему рядом астронавту. Люди в отсеках нарисованы телом — комбинезон, ранец,
шлем со стеклом, — а не палочками.

**Приборы показывают правду.** Стрелка на щите ходит по балансу энергии,
заряд батарей — по отдаче, полки склада пустеют вместе с запасом, аварийная
лампа реактора мигает только при нехватке мощности, бур и центрифуга стоят
без энергии.

## 0.25.2 — «База перестала быть таблицей»

**Отсеки больше не коробки.** Было: у каждой ячейки своя рамка с оранжевой
обводкой и подписью, и разрез базы читался таблицей на буром фоне. Стало:
соседние отсеки собираются в одну выработку (полоски породы между ними больше
нет), оборудование стоит прямо в вырубленной пустоте на плите пола со своей
тенью, а имя показывается только у выбранного отсека — сам выбор помечается
уголками, а не рамкой во всю клетку. Заодно нимб реактора стал круглым (у
прямоугольного был виден край), а порода — темнее и глуше: свежие кадры
показывали оливковый цвет там, где должен быть камень.

## 0.25.0 — «Три сцены, до которых не доходили руки»

**Карта галактики стала небом.** Было: шесть десятков одинаковых кружков,
соединённых паутиной линий к двум ближайшим соседям, — структурная формула, а не
ночное небо. Стало: звезда светит, а не лежит кружком (ореол, у ярких —
дифракционные лучи, размер от класса); глубина даётся тьмой — дальний сектор
тусклее, недостижимый гаснет вполовину; радиус прыжка не волосок-окружность,
а освещённая область, и сразу видно, докуда дотягивается рука. Линии остались
только между достижимыми системами. Туманность собственная, с тёмными
пылевыми прожилками, и она едет вместе с сектором. Подпись выбранной системы
переехала в карточку с постоянным местом — под звездой она уезжала под
экранные кнопки на нижнем ряду.

**База в разрезе перестала быть таблицей.** Коричневый прямоугольник, полосатые
ряды и рамка на каждой ячейке, включая пустые, — ровно та ошибка, что была
в шахте до 0.19.0. Теперь порода — материал планеты поверх гуляющих пластов,
темнеющих с глубиной; помещения собираются в один путь и вырезаются тьмой,
грань со светом идёт только по кромке; пустая клетка не рисуется вовсе — там
просто порода, и лишь под курсором проступает «место под застройку». Отсеки
светят на породу вокруг себя, у ствола лифта появились направляющие,
кромка грунта больше не линейка.

**Абордаж получил свет и воздух.** Стены делятся по высоте надвое (низ светлее,
верх уходит в темноту под потолком) — плоские наклейки стали объёмом. Появилась
дымка расстояния, потолочные лампы (единственный до этого источник света жил
только числом в формуле яркости), пыль в луче нашлемного фонаря, тёплое пятно
по курсу и глубокая виньетка.

---

## 0.24.0 — «Гигант перестал быть обоями»

Сбор летучих газов был последней сценой на старой графике, и это было видно:
вертикальный градиент, два десятка полупрозрачных эллипсов вместо облаков и
две пунктирные линейки коридора поверх всего. Ни течения, ни глубины, ни
масштаба — а масштаб здесь и есть содержание сцены.

**Ленты вместо лепёшек.** Небо гиганта печётся один раз на планету в отдельную
текстуру: широтные полосы, продавленные шумом по горизонтали. Искажение области
даёт фестоны, завихрения и вихри само — рисовать овалы не нужно. Два-три
шторма вмешиваются в то же искажение, поэтому полосы вокруг них загибаются.
Лента замыкается в кольцо сшивкой краёв: зеркальное повторение шов убирало, но
разворачивало вихрь бабочкой на пол-экрана.

**Скорость — параллаксом.** Два эшелона одной ленты с разным масштабом и
скоростью плюс штрихи набегающего потока, гуще к низу. Трёх эшелонов не берём:
одинаковая лента, наложенная трижды, усредняется в розовую кашу.

**Коридор сбора стал частью мира:** не две пунктирные линии, а слой более
плотного светящегося газа со взвесью, которую и собирают. От разметки остались
только короткие засечки у краёв кадра.

Плюс гроза в нижних слоях, корабль крупнее в полтора раза и полоса нагрева
ушла из-под угловых панелей.

---

## 0.23.0 — «Меньше кабины, больше космоса»

Кабина из 0.22.0 была честной, но жадной: она забирала треть кадра. Теперь она
вдвое ниже, стойки тоньше, потолок ниже, а с доски убрано всё, что дублировало
другой прибор или само окно.

**Убраны:** два боковых экрана в верхних углах (обстановка и системы),
потолочный экран со столбиками тяги, показания тангажа и крена (они и так
нарисованы лесенкой на стекле), высота над плоскостью пояса, счётчик камней,
подпись дальности радара, лампы «резак» и «орудие». Осталось шесть вещей:
топливо, корпус, скорость, радар, цель и трюм — плюс три лампы, и все три
означают беду.

**Гравитационный якорь перестал быть ловушкой.** В дальнем полёте корабль
застревал на кромке системы: потолок на скорость «прочь» срезал радиальный ход
в ноль, доворот вектора к носу переливал в него поперечный, и через полминуты
корабль стоял намертво с горящим топливом. Любой потолок даёт такую мёртвую
точку. Потолка больше нет — есть тяготение: от нуля на кромке до полутора тяг
за 700 единиц. У кромки двигатель сильнее и висеть можно, дальше сносит домой,
и корабль всегда остаётся телом, которое куда-то летит.

**Корона звезды выталкивает, а не засасывает.** Знак у отталкивания был
перепутан: влетев в звезду, выбраться было нельзя — воронка вчетверо сильнее
двигателя держала до самого взрыва.

---

## 0.22.0 — «Кабина стала местом, а хвост — следом»

Кабина была набором панелей поверх космоса. Теперь это помещение: проём остекления
имеет толщину (наружный и внутренний контур, между ними фаска со светом сверху и тенью
снизу), борта уходят вглубь консолями, по стойкам моргают лампы, на стекле живут блик,
тонировка, отражение доски и царапины. Середина кадра по-прежнему принадлежит миру:
всё, что лежит на стекле, прозрачно.

**Кабина знает, на чём вы летите.** Раскладка берётся от класса корпуса: у буровика и
рудовоза тяжёлый переплёт, поперечная балка, заклёпки, износ и штриховка «не влезай»;
у фрегата — гранёный бронепроём и тактическая зелень; у исследователя тонкая рама и
голограмма над доской; у курьера всё сжато; у лабораторного сплава переплёт
асимметричный и текучий. На раме — табличка с классом и именем корабля.

**Шлейф двигателя стал лентой.** Точки одного сопла соединяются полосой, поэтому на
развороте виден след траектории, а не облако искр. Цвет — от корпуса (ядро добела,
перо в акцент корабля), длина — от паспортной тяги и модуля двигателя: прокачка видна
в полёте.

**Струи ориентации бьют против поворота.** Чтобы нос пошёл влево, носовое сопло
выбрасывает газ вправо, кормовое — влево. Раньше обе струи шли туда же, куда разворот.

**Торможение больше не разворачивает корабль.** Тормозят носовые маневровые, курс
остаётся тем, который держит игрок; тяга торможения за это чуть меньше.

---

## 0.21.0 — «В поясе появился свет»

Пустота в поясе была залита одним цветом, а грани камня освещались вектором, взятым из
головы: чёрный кадр без глубины и без источника света.

**Свет идёт от светила системы.** Оно стоит в начале координат, поэтому проецируется той
же камерой: в кадре виден диск с ореолом, и освещённая сторона камня всегда обращена к
нему. По одному взгляду понятно, где звезда, даже когда она за спиной.

**Три составляющих вместо одной:** свет звезды своего цвета, холодный подсвет от
туманности в тенях и кромочный блик на гранях, стоящих к камере ребром. Блик — подделка,
но именно он отделяет камень от черноты, когда тот повёрнут теневой стороной.

**Фон перестал быть заливкой:** четыре мягких пятна туманности на звёздной сфере и
вертикальный градиент плоскости пояса.

---

## 0.20.0 — «Класс читается силуэтом»

Генератор корпусов делал «просто корабль»: пропорции гуляли от seed, но силуэт ничего не
сообщал. Восемь разных кораблей в системе — и ни по одному не сказать, кто это, пока не
подлетишь и не прочитаешь подпись.

Появился **класс корпуса** — не новая таблица кораблей, а уклон генератора: те же станции
профиля, но свои пропорции, своё число крыльев и гондол, и одна-две узнаваемые приметы.
Рудовоз широк, с почти прямой кормой и контейнерами вдоль бортов; у буровика конический
бур в носу; у фрегата стволы вдоль скулы и утолщённая носовая плита; у яхты лента окон;
у исследователя тарелка на штанге и панели на пилонах; курьер узкий и длинный.

Класс базовых восьми проставлен руками, у остальных выводится из статов. **У пирата
корпус всегда боевой или курьерский** — силуэт врага обязан читаться враждебно до
первого выстрела.

---

## 0.19.0 — «Шахта»

Шахта рисовалась поклеточно: у каждой ячейки своя заливка, кромка и обводка. На экране
это читалось клетчатой скатертью — сетка в тридцать пикселей была видна раньше породы.

**Рисуется пустота, а не порода.** Массив сплошной: пласты во всю ширину кадра, материал
планеты, потемнение с глубиной. Выработка собирается в один путь из пройденных клеток и
вырезается тьмой; грань со светом и тенью рисуется только там, где за ней действительно
порода, — обводка всего пути возвращала ту же сетку, только светящуюся.

**Разрез растянут вчетверо.** В срезе грунта вся стопка пород укладывается в три сотни
пикселей, и в шахте пласты кончались на тридцати метрах: дальше до самого дна шёл один
цвет. Теперь порода сменяется несколько раз за спуск: почва, осадок, порода, руда,
основание.

**Свет как в пещере:** темнота вокруг, фонарь скафандра, пыль в луче. Плюс крепь через
каждые четыре метра ствола (она же даёт масштаб), искры из-под резака, рудное тело
мягким свечением сквозь породу вместо заливки клетки.

---

## 0.18.0 — «Небо, второй заход»

Облака из 0.16.0 были ошибкой, и признать это дешевле, чем крутить параметры. Поле
плотности, натянутое поперёк неба, даёт рваную кромку, но убивает главное: облако
перестаёт быть предметом. У поля нет ни низа, ни верха, ни границ — в кадре это плесень
на стекле, а не небо.

Теперь облако — **тело**. На планету пекётся шесть силуэтов: сумма метаболов, посаженных
на одну линию (отсюда плоский низ на высоте конденсации и купольный верх), поверх —
эрозия шумом в два масштаба, которая не смещает кромку, а съедает её. Свет запечён в тот
же спрайт: нормаль по градиенту плотности, вертикальный подъём светлоты к куполу и
серебряная каёмка со стороны светила. У самого светила облако просвечивает вторым
проходом на сложении.

На небе они расставлены по трём эшелонам с разным масштабом, параллаксом и скоростью,
и их **мало**: ясный день в пустыне — два облака на весь небосвод. Пустота в небе
работает так же, как пустота в рельефе.

Перистые остались отдельным явлением: не тело, а вытянутые ветром волокна льда.

---

## 0.17.0 — «Интерфейс скафандра»

Интерфейс был набором тёмных прямоугольников поверх мира. Стал стеклом шлема.

**Один материал на всё.** Панель приборов, правый борт, меню, журнал, экраны и кнопки
собраны из одних токенов: размытый мир под стеклом, световой волосок по верхней кромке,
мягкая тень под ним, скруглённые углы. Ярких заливок не осталось — акцент делается
свечением, а не цветной плашкой. Сплошная плашка выбранной вкладки заменена свечением
изнутри и волоском по кромке.

**Приборы гаснут.** Панель показаний живёт на 34% прозрачности и проявляется на пару
секунд, когда показание изменилось, и держится открытой, пока идёт тревога. Постоянно
горящая панель перестаёт читаться как сообщение и становится частью рамки экрана.

**Кнопки стали ходить.** У пэдов ободок вынесен отдельным слоем: нажатие собирает свет
в кольцо и слегка сжимает шайбу. У кнопки действия, когда есть что сделать, свет дышит.
Окна выезжают снизу вверх, экраны проявляются.

**Иконки** тонкой линией, все из одного набора: орбита у карты, три полосы у меню,
корпус у корабля, страница у журнала, ползунки у настроек. Значок опознают быстрее слова,
но слово оставлено — оно снимает сомнение.

---

## 0.16.0 — «Небо»

Облака были гроздью радиальных градиентов: каждый сгусток читался наклейкой, все висели
на одной высоте и шли с одной скоростью. Теперь это поле плотности.

**Тайл вместо фигур.** Один раз на планету печётся бесшовное поле `tfbm` 256×256; порог по
плотности даёт кромку, мягкий порог — рыхлый край. Порог берётся квантилью по самому полю,
а не числом: покрытие теперь ровно такое, какое заказано таблицей типа мира, а не лотерея
по seed.

**Свет печётся в тайл.** Плотность сравнивается с плотностью на шаг в сторону светила —
грань, обращённая к звезде, светлеет; ядро облака темнее кромки. Подделка нормали, но в
кадре неотличима.

**Три слоя.** Перистые высоко, мелкие и почти неподвижные; кучевые в середине; рваные
низкие крупные и быстрые — эти приходят только с непогодой, и по небу видно, что портится
погода. У каждого слоя свой параллакс, своя скорость и своё сжатие по вертикали.

В кадре — три заливки паттерном. Ничего покадрово не считается.

---

## 0.15.0 — «Под землёй»

Пещера была двумя силуэтами и темнотой: две тысячи пикселей одинакового коридора и
находка в конце. Теперь ход разбит на залы, и зал виден раньше, чем в него входишь.

**Залы.** Пять-шесть на пещеру, каждый со своим сводом и характером: галерея, натёчный
зал, рудный ход, подземное озеро, кристаллический грот в дальнем конце. Свод в зале
уходит вверх со сглаженным переходом — зазор от этого только шире, застрять по-прежнему
нельзя. Имя зала стоит в строке места и объявляется при входе.

**Натёки.** Сталактиты и сталагмиты растут навстречу и изредка смыкаются колонной,
вдоль свода висят натёчные завесы. Форма детерминирована от координаты, поэтому не
дрожит при движении камеры.

**Светящиеся жилы** идут внутри породы — выше кромки свода и ниже кромки пола, — и
рисуются двумя проходами: широкий тусклый это свет вокруг жилы, узкий яркий сама жила.
Пульсируют врозь.

**Подземное озеро.** Уровень берётся от среднего пола по залу, поэтому вода заливает
впадины и оставляет гребни сушей. По воде идут медленнее, с всплеском и звуком.

**Кристаллы** в гроте — две грани на иглу, светлая и тёмная, и одно свечение на куст.

**Глубина и свет.** Дальняя стена на скорости .62 со своим профилем и своими дальними
зубцами; темнота как радиальная маска вокруг игрока; фонарь скафандра из трёх слоёв;
пыль в луче; капли, падающие со сводов, со звуком и кругом на полу.

---

## 0.14.0 — «Место, а не набор фигур»

Графика переписана без смены движка: тот же canvas 2D, ни одного внешнего файла, игра
по-прежнему открывается двойным кликом. Менялось не «сколько объектов», а из чего сделана
картинка.

**Точки интереса.** На планете 2–4 крупные вещи от её seed: остов мегакорабля с живым
маяком, ступенчатый храм, космический лифт, кристаллический лес, кольцевой ускоритель,
гравитационная аномалия, монолит, заброшенный завод, врата, обсерватория. Между ними
рельеф сознательно пуст — без пустоты находка не находка. В поясе то же: остов,
добычной комплекс, обломок станции, друза, гигантский астероид с устьем.

**Материал вместо заливки.** У планеты свой бесшовный тайл 256×256, посчитанный один раз
при заходе: макро-поля породы, осадочные потёки, волосяные трещины, минеральные жилы,
зерно. Второй проход тем же тайлом крупнее убивает видимую сетку. Та же порода идёт на
валуны, в шахту и в пещеру.

**Геология.** Стопка слоёв от почвы до основания, своя у каждого типа мира и своя по
толщинам у каждого seed. Слои идут по рельефу со своим шумом на границу. Шахта берёт
цвет забоя из того же разреза и называет породу в строке.

**Свет и воздух.** Направленный свет звезды своего цвета, цветной подсвет от неба в тенях
(сила — от плотности атмосферы), воздушная перспектива вместо прозрачности, дымка в
низинах, лучи от звезды, виньетка и цветовой сдвиг в конце кадра.

**Небо.** Композиция от seed планеты с бюджетом громкости: один громкий объект (газовый
гигант с кольцами, соседний мир с материками и шапками, галактика, чёрная дыра, сияние)
и два-три тихих. У 38% планет громкого нет вовсе.

**Система.** Три системы из десяти получают особое светило — двойную, красного гиганта,
белого карлика, нейтронную; одна из ста — чёрную дыру. Своя туманность с волокнами, свой
слой пыли. Экзотика меняет только вид: вся арифметика по-прежнему от `sys.cls`.

**Полёт.** Камера отстаёт тем сильнее, чем быстрее летим, и прыгает разом на гиперпрыжке;
сопло светит, за соплом дрожит воздух.

**Жизнь.** Пять форм растений, узнаваемых силуэтом (гриб, спираль, зонтик, шар на привязи,
ленты), и пять чужих архетипов зверья (медуза, шестиногий ходун, кристаллическое насекомое,
манта, панцирный). У планеты сильный уклон в две-три формы: если на каждой растёт весь
каталог, планеты снова сливаются.

**Камера на поверхности.** Инерция, взгляд вперёд, дыхание, тряска от удара. Ветер один на
кадр — трава, пыль и растения качаются в одну сторону.

**Станции собираются из модулей.** Тип по-прежнему задаёт ядро и услуги, а сверху висят
три-шесть модулей от seed системы: грузовой терминал, жилой сектор с окнами, кантина,
ремонтный док, топливные баки, лаборатория, медотсек, таможня, чёрный рынок, изолятор,
оранжерея, узел связи, верхний ярус. Тёмное чаще на окраине, верхний ярус — у обжитых
систем. Модули названы строкой в терминале: снаружи видно силуэты, внутри читается список.
Услуг они не открывают — иначе станция обещала бы снаружи больше, чем внутри есть.

**Станция вынесена из короны звезды.** Стояла на радиусе светила +240..520 — внутри орбиты
первой планеты, а у красного гиганта прямо в свечении. Теперь между первой и второй
планетой и не ближе шести радиусов светила.

### Что нашлось по ходу

- Цикл склоновых полос делал `beginPath`, и `clip` для пластов с обводкой кромки
  применялись к последней шестипиксельной полоске: **пласты породы не рисовались вообще**.
  Силуэт переведён на `Path2D`.
- Звёзды рисовались после небесных тел и просвечивали сквозь диск гиганта.
- Параллакс неба считался от нуля — к середине планеты композиция уезжала за кромку.
- Вместе с живой камерой сломался тычок «идти сюда»: пересчёт шёл по старой формуле.
  Теперь камера кадра — единственный источник правды и для отрисовки, и для ввода.

### Проверено

Автотесты: 507 зелёных, без изменений — правки визуальные, механика не двигалась.
Кадр поверхности со всеми слоями — 0.93 мс. Прогнаны поверхность, посадка, пещера, шахта,
система, пояс на планетах всех типов; консоль чистая.

---

## 0.13.0 — «Всё дерево целиком»

Подключены последние 16 перков. **Ни одной подписи без кода в дереве больше нет**,
и это теперь стережёт отдельный автотест, который перебирает всё дерево и требует,
чтобы каждый `id` кто-то читал.

### Исправлено — и это главное

**Базы не работали вообще.** `baseTick` читал константу `CREW_OFFLINE_CAP`,
которой **не существовало ни в одном файле**. Каждый тик базы после первого падал
с `ReferenceError`, а вместе с ним падал и вход в базу: заложить её было можно,
войти внутрь — нет. Сломано с той самой вехи, где базы появились. Теперь константа
объявлена там, где ей место (потолок «ленивого времени», общий для наёмников и баз),
а вход в базу и второй тик — под тестом.

### Смотритель

Ветка **«Энергия»** была мертва целиком, хотя энергобаланс — центральная механика базы:

- **«переброс»** — при нехватке половина необязательной нагрузки сбрасывается, и
  мощность достаётся тому, ради чего база стоит: буру и лаборатории;
- **«стабилизация»** — реактор держит нижний порог 0.35 и не глохнет совсем;
- **«буревой щит»** — и для него в игру добавлена **буря**: угроза месту, а не людям.
  Налёт отбивает охрана, бурю — нет; она бьёт по тому, что стоит наверху, и сила её
  зависит от мира (пустыня и токсичный дуют вдвое сильнее земного, газовому гиганту
  всё равно). Щит отменяет её полностью;
- **«излишки»** — лишняя мощность продаётся станции: редкий случай, когда лишний
  реактор осмысленно ставить нарочно.

Из «Стройки» и «Логистики»: **«второй ярус»** вскрывает базе пятый ряд (и ряд
остаётся у неё навсегда — расчёт со смотрителем не должен стирать построенное),
**«очередь»** доводит начатое до конца без инженера, **«плавильня»** переплавляет
вдвое быстрее и не проседает вместе с энергией, **«авто-сбыт»** ускоряет оборот дрона.

### Фактор

**«монополия»** — на плечах маршрута цена держится выше: единственный перк, который
игрок чувствует собственным кошельком, а не строчкой в сводке. **«сводка»** показывает
лучшую цену по каждому плечу, не выходя из системы. **«пороги»** открывают два
стоящих приказа, которых иначе нет в списке вовсе, — перк расширяет не силу, а
словарь того, что домену можно поручить. **«обновление»** перебирает ассортимент
станций втрое чаще. **«чёрный список»** кладёт на станцию отдельную вещь высокого
класса с пометкой «по связям фактора».

### Командир

**«трофейщик»** — звено чаще возвращается с чужим добром (тот самый хвост таблицы,
ради которого наёмник и держится). **«переговорщик»** — выкуп за пленного вдвое
дешевле, и видно это заранее, а не при выплате. **«охота»** — пиратские базы соседних
секторов помечены на карте пятиугольником; без перка их находят только прилетев.

### Проверено

Автотесты: 507 зелёных (было 476). Шесть новых наборов, включая тот самый обход
всего дерева. Каждый из 16 перков проверен и поведением: эффективность энергии
до и после, бури с щитом и без, цены на плече, состав списка приказов, состав
ассортимента, цена выкупа.

---

## 0.12.0 — «Лаборатория, артефакты и перки, которые наконец работают»

Закрыт последний невыполненный шаг порядка реализации из
[`DESIGN-managers.md`](DESIGN-managers.md) (§14.7). Заодно проверка дерева перков
вскрыла то, чего никто не заказывал: **24 перка из 48 не были подключены ни к чему**.
Игрок тратил на них очки уровня, и не происходило ничего. Половина обещанного
в §1 «видимого роста» была декорацией.

### Добавлено

**Лаборатория — здание, а не фигура речи.** До этого исследователь разбирал образцы
«в воздухе»: роль была, домена не было. Теперь лаборатория — постройка на базе:
3200 кр и 12 сплавов, −16 энергии, заперта новой наукой «Лаборатория», и **мертва
без жилого отсека по соседству** — разбирать образцы вахтой из скафандра нельзя.
Без лаборатории исследователь не бездельничает, но идёт втрое медленнее и без
чертежей, и сам об этом говорит.

**Семь артефактов (§12).** Единственные вещи в игре с глобальным эффектом:
«Печать конвоя», «Счётная кость», «Карта чужой руки», «Пустой контракт»,
«Ключ от верфи», «Чёрный журнал», «Тихий маяк». Слот один на управляющего,
поэтому семь находок за прохождение — это всегда выбор, кому дать и что оставить
лежать. **Вторая строка эффекта открывается только при исследователе с перком
«чтение»** — и в интерфейсе видно, что она есть и заперта, иначе половина
артефакта была бы невидимой.

Артефакты не покупаются. Они лежат в пластах глубже 42 м, достаются трофеем
с разбитого ренегата и собираются в лаборатории из двух других («синтез»).
Слот появляется с новой наукой «Ксеноархив».

**Перк «происхождение»** ставит на карту пунктирную метку СЛЕД АРТЕФАКТА: в этом
секторе шанс находки в шахте удваивается. Без метки указание было бы некуда
положить.

### Оживлено

Восемь перков, которые до этого были подписями без кода:

- **«чутьё»** — показывает вилку скрытой удачи наёмника, **«точный счёт»** — число.
  Это и есть обещанный в замысле «самый важный перк в игре»: он превращает
  непознаваемый шум в информацию, и стоит не кредитов, а уровней.
- **«биология»** — отсканированные твари и растения идут в лабораторию образцами;
  разведка перестала быть только строчкой в счётчике видов.
- **«допуск»** — верный чертёж на 15% сильнее (усиливается прибавка, а не
  множитель целиком: иначе +20% превратились бы в +38%).
- **«пересборка»** — перепроверка ошибочного чертежа вдвое дешевле.
- **«чтение»**, **«происхождение»**, **«синтез»** — вся ветка «Ксенология»
  ожила вместе с артефактами.

### Исправлено

- **Смета смотрителя не работала при стройке.** Скидка считалась в `baseCost`
  и показывалась в интерфейсе, а списывалась полная цена из таблицы.
- **Надетый артефакт, поднятая ультиматумом доля и счётчик ультиматумов
  терялись при загрузке.** Список полей управляющего в `applySave` белый, и новое
  поле надо вносить в него руками — три не внесли. Теперь стережётся тестом.

### Проверено

Автотесты: 476 зелёных (было 436). Пять новых наборов: лаборатория и её
зависимость от жилого отсека, слот артефакта и глобальность эффекта, первые
строки «Счётной кости» и «Тихого маяка», оживлённые перки, сохранение находок
вместе с регрессией на потерянные поля.

### Что осталось

Дерево перков всё ещё содержит **16 неподключённых из 48**: у командира —
ветка «Трофеи» (трофейщик, переговорщик, охота), у фактора — пять в трёх ветвях,
у смотрителя — вся ветка «Энергия» и половина «Стройки». Это следующая работа.

---

## 0.11.0 — «Интерфейс собран заново»

Функций в игре накопилось на четыре экрана, а интерфейс остался тем, что был при
одном. Правый борт зарос девятью кнопками, станция — десятью вкладками в один ряд,
подписи не говорили, что произойдёт. Пересобрано целиком, от заставки до пэдов.

### Три правила, по которым всё переделано

1. **Иерархия — размером и цветом, а не капслоком.** Раньше капслоком с разрядкой
   было набрано всё подряд, и поэтому не выделялось ничто. Теперь так набраны только
   подписи — то, что опознают; то, что читают, набрано обычным текстом.
2. **Во что тыкают пальцем — не меньше 44 px.** Кнопки правого борта были 27 px:
   по ним промахиваешься на ходу. Теперь порог держится автотестом.
3. **Поверх мира — только нужное сейчас.** Постоянно висят приборы, две кнопки
   и масштаб. Остальное живёт в меню или приходит, когда для него есть повод.

### Полёт

- **Приборы показывают числа**, а не только полоски: `34/100` отвечает на вопрос
  «дотяну ли до станции», а «полоска чуть больше половины» — нет. Две ступени
  тревоги: мало — подсвечивается, вот-вот — мигает, потому что в бою на приборы
  смотреть некогда, а движение ловится боковым зрением.
- **Справа вверху — где мы и с чем**: система, корабль, сектор и кошелёк одной
  строкой. Кредиты больше не дублируются в двух местах.
- **Правый борт: две кнопки вместо девяти.** КАРТА и МЕНЮ; за МЕНЮ — КОРАБЛЬ,
  ЭКИПАЖ, ШТАБ, ЖУРНАЛ, НАСТРОЙКИ, каждая со второй строкой о том, что внутри.
  Контекстные (К ЗВЕЗДЕ, ДРОН, МАЯК) по-прежнему приходят и уходят сами, но
  отдельной группой и в цвет действия. Масштаб стал парой кнопок, а не двумя
  случайными. Ящик закрывается тапом мимо и любым выбором внутри.
- **Кнопка называет действие, а не себя.** Вместо вечного «ДЕЙСТВ» — СТЫКОВКА,
  ПОСАДКА, АБОРДАЖ, РЕЗАК, ВХОД. Глагол берётся из самой подсказки, чтобы не
  завести второй источник правды. Когда делать нечего, кнопка не светится.
- Подписи договорены до конца: ДЕЙСТВ → ДЕЙСТВИЕ, ТОРМ → ТОРМОЗ, ПРЫЖ → ПРЫЖОК —
  везде, включая подсказки во всех режимах.
- Масштаб больше не печатается под левым пэдом, где его закрывал руль.

### Экраны

- **Станция: раздел, потом вкладка.** Десять вкладок в один ряд сжимались до
  полусотни пикселей и обрезали подписи. Теперь сверху ТОРГОВЛЯ · КОРАБЛЬ · НАУКА ·
  ЛЮДИ · ВЛАДЕНИЯ, под ними — вкладки только этого раздела; где вкладка одна,
  второй ступени нет. Мёртвые разделы на станции не показываются вовсе.
- **Фон экранов стал непрозрачным.** Сквозь прежние 96% просвечивали кнопки
  правого борта, и это читалось как брак. Заодно приборы и пэды прячутся, пока
  открыт любой экран.
- Общий каркас для всех пяти экранов: шапка с названием и кошельком, навигация,
  тело, подвал с действиями. Строки списков стали выше и разборчивее, цена —
  крупная и с табличными цифрами, а хвост из кнопок переносится на вторую строку
  вместо того, чтобы уезжать за правый край на узком телефоне.
- **Заставка**: титул, три двери и всё. Таблица клавиш была первым, что видит
  игрок, и первым же, чего он не читает, — теперь она за кнопкой УПРАВЛЕНИЕ
  и разбита на «полёт» и «пояс».

### Проверено

Автотесты: 436 зелёных (было 416). Четыре новых набора стерегут именно то, что
сломалось в прошлый раз: порог 44 px, отсутствие наложений и выездов за экран,
подпись кнопки действия по подсказке, разделы станции. Разметка проверена на
320, 375 и 531 px: ни одного наложения, ни одного выезда за край, ни одной кнопки
меньше порога. Консоль чистая.

Основано на общих практиках игровых интерфейсов: Z-образное чтение (жизнь корабля
слева вверху, место и деньги справа вверху, подсказка внизу по центру), минимум
постоянных элементов, крупные цели в зоне большого пальца.

---

## 0.10.0 — «Он ушёл не в пустоту»

Закрыт шестой пункт порядка реализации из [`DESIGN-managers.md`](DESIGN-managers.md):
лояльность доведена до конца. До этого управляющий на нуле просто исчезал вместе с
записью о корабле — самая драматичная развилка системы срабатывала в одну строку журнала.

### Добавлено

**Утечка домена ниже пятидесяти.** Любой управляющий, а не только «свои интересы»,
начинает «терять» проценты домена в свою пользу — до 5% на нулевой лояльности. Числом
это нигде не показано: заметно только по сверке в сводке домена, где утечка идёт
отдельной строкой «сверх того „потерялось“».

**Ультиматум ниже двадцати пяти.** Он перестаёт просить и приходит с условием. Это та же
сцена с выбором, что и поручения, только приходит не по желанию, а по цифре, и у неё
есть срок: двенадцать минут, после которых молчание засчитывается за отказ. Три выхода —
поднять долю на три пункта навсегда, откупиться (цена считается от него самого: расчёт
×1.3 плюс надбавка за уровень) или отказать. Отказ — немедленный уход. Больше двух раз
он не приходит.

**Ренегат.** На нуле лояльности он уходит **в мир**, а не из игры: забирает флагман,
уводит до 60% звена (командир — своих, остальные — никого) и садится в соседнем секторе.
На карте его сектор помечен фиолетовым кольцом с подписью РЕНЕГАТ — иначе до него
не долететь. Прилетите — он выйдет навстречу на вашем же корпусе, с корпусной прочностью
и уроном, посчитанными от его уровня и **его перков**: тех, которым вы его научили.
Уведённые наёмники летят с ним и подписаны поимённо.

**Изгнанник.** Разбить ренегата — не убить: корпус возвращается в ангар, его трюм
достаётся вам, а сам он выживает и появляется в кантине **любой** станции первым в списке.
Стоит треть обычного, приходит с уже выученными перками (вы за них однажды заплатили)
и с лояльностью 28 — он помнит, чем кончилось в прошлый раз.

Одновременно в мире держатся не больше трёх ренегатов и трёх изгнанников. Всё это
переживает сохранение; битая запись с несуществующей ролью отбрасывается при загрузке.

### Исправлено

- Кредиты копили дробный хвост (`295577.36579999997`): жалованье считается от дробных
  минут и не округлялось. Теперь округляется при списании, а на карте сумма ещё и
  форматируется как везде.
- Расхождение ИИ-ядра тоже получило метку на карте — раньше сектор назывался только
  в тексте сообщения, и найти его было нечем.

### Проверено

Автотесты: 416 зелёных (было 375). Четыре новых набора — ультиматум и утечка, уход
с флагманом и людьми плюс встреча в бою, возвращение изгнанника, сохранение ушедших.
Отдельно прогнан весь путь под настоящим тиком: лояльность падает без жалованья →
ультиматум → ноль → ренегат в секторе 5:0. Консоль чистая.

---

## 0.9.0 — «Автопилот больше не таранит планеты»

Первый нумерованный выпуск. Ниже — что исправлено в этом заходе, а следом сводка того,
что накопилось в игре к этому моменту.

### Исправлено

**Корабль застревал у планеты и мелко дрожал.**
Автопилот тормозил по линейному закону: разрешённая скорость подхода падала вдвое медленнее,
чем корабль вообще способен гасить ход. К телу он подлетал на полном ходу, проваливался
внутрь и захватывал орбиту **под поверхностью планеты** — корабль пропадал из виду, повисал
на крошечном радиусе и трясся вместе со всей картинкой. На выборке из 146 подлётов это
случалось в 19% случаев. Теперь скорость подхода считается по тормозному пути
(`√(2·a·расстояние)`), а радиус захвата не может оказаться ближе поверхности:
внутри тела орбита не берётся ни при каких условиях. Подлёт стал на пару секунд длиннее —
это и есть честное торможение.

**Гравитационный якорь запирал корабль наглухо и тряс экран.**
За кромкой системы к звезде тянуло с ускорением `.09` — сильнее, чем даёт двигатель (`.082`).
Полный газ «наружу» не двигал корабль вообще: он вставал колом и каждый кадр дёргался
туда-сюда, а поскольку камера жёстко привязана к кораблю, дрожал весь звёздный фон.
Второй, ещё более жёсткий якорь на 5200 единиц вдобавок **обрывал кадр досрочно** — вместе
с ним пропадали подсказки, стыковка, посадка и вход в пояс. Теперь якорь — не встречная тяга,
а предел на скорость ухода: она плавно сходит к нулю на семисот единицах за кромкой.
Корабль спокойно останавливается у стены, курс к звезде и вдоль края остаётся полностью
свободным, управление не теряется, а дрожать нечему.

**Предупреждение о кромке системы било очередью.**
Интервал был задан в 6 игровых тактов, а такт — это кадр: одно и то же сообщение
всплывало десяток раз в секунду. Теперь раз в ~15 секунд, и текст говорит по делу —
дальше не уйти, назад свободно.

**Автопилот к звезде промахивался мимо своей же точки парковки.**
Тормозил там же, где и везде, поэтому вместо расчётных `радиус+220` останавливался
в паре десятков единиц от зоны перегрева корпуса. Общий тормозной профиль это чинит:
теперь корабль встаёт там, где обещал.

### Проверено

Автотесты: 375 зелёных (было 368). Добавлены два набора — «автопилот подходит снаружи тела,
а не сквозь него» и «гравитационный якорь: стена, а не тряска»; второй считает смены знака
радиального хода у кромки и требует ровно ноль.

Прогнаны все режимы (система, карта, посадка, поверхность, пещера, шахта, пояс, атмосферный
сбор, база, абордаж) — исключений в обновлении и отрисовке нет, консоль чистая.
Автопилот прогнан по 366 целям в 16 системах — все доходят, ни одного промаха мимо парковки.

### Что было накоплено к 0.9.0

- **Космос и полёт**: процедурная галактика, эллиптические орбиты по Кеплеру, замедленная
  небесная механика, автопилот с упреждением, захват орбиты, шлейф двигателей, гравитационный
  якорь на краю системы.
- **Планеты**: посадка ручная и автоматическая, поверхность с флорой и фауной, пещеры, шахта
  с бурением вглубь, атмосферный сбор летучих газов у газовых гигантов.
- **Пояс астероидов**: полёт с шестью степенями свободы, резак, руда.
- **Станции**: шесть типов торговли — где стыкуешься, то и можешь; живой рынок, дроны,
  экран корабля со слотами частей, наука и модули, лаборатория сплава корпусов.
- **Пираты**: бой в системе, преследование, пиратские базы в опасных секторах и абордаж —
  полигональные интерьеры с ярусами.
- **Наёмники**: найм, приказы, рейсы, таблица событий, плен и выкуп, жалованье и долг.
  По кредитам наёмник убыточен намеренно — это ставка, а не источник дохода.
- **Управляющие**: четыре домена и всегда четыре места, доля вместо оклада, черты, перки,
  лояльность, процедурные портреты, стоящие поручения, ИИ-ядро вместо человека.
- **Базы**: закладка на планете, вид в разрезе, энергобаланс, сеть баз, персонал, налёты
  пиратов на склад.
- **Редкие ресурсы**, которые тратятся, а не продаются, каждый со своим применением.
- Генеративная музыка и синтезированный звук, журнал, автосохранение.
