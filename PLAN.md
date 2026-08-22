# Drift — work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers — numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic ≤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips — ground, cave rock —
  and `screenLayer(key, paint)` for screen-space constants — the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format is `v:4`.** `server.js:95` and `worker.js:66` reject anything else. A new
  persistent field goes into `snapshot()` and gets a safe default in `applySave()` (`14-save`).
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation — the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.

## Done

M1–M32 — the base game (see git history). M33 parts and total rig capacity · M34 ship screen with
hull slots · M41 WebAudio sound engine · M42 generative music with beacons and reverb. Plus the
split into modules and the `build.ps1` build.

**The whole queue below is finished** (July 2026, one milestone per commit):
M43 celestial mechanics and autopilot lead · M44 six station types with type-driven tabs ·
M39 rare resources, gas scooping, smelting · M45 hiring, fleet, orders, lazy simulation ·
M46 wages, debt, morale, repair · M37 base in cross-section with power balance · M38 base network
and transfer · M47 base staff, roles, raids · M40 the lab: hull fusion and part crafting ·
M35 boarding a pirate base on polygons · M36 enemy types, consumables, mezzanines.

Descriptions of finished milestones live in [`docs/PLAN-archive.md`](docs/PLAN-archive.md): they
remain documentation of the decisions taken, but sit apart so this file can be read in one go.
Here is only what is still live — cross-cutting rules, the visual queue and the milestone queue.

---

## M55. Visual work queue (live)

Where we stopped. Everything above the line is built, tested and pushed; everything below is
not started.

### Done (0.14.0 onward)

Points of interest on planets and in the belt, rock material, geology in cross-section, light and
air, sky with a loudness budget, the look of a system and exotic stars, the feel of flight, alien
flora and fauna, a living camera, station modules, weather.

### Remaining, by descending payoff

1. **The mine from inside** — two passes done (`23-mode-dig`). Strata, ore in grains, the working
   floor, timber and ladder, track and tub, haze at the far end. **Still open:** the landings in
   the shaft barely read; a tub in a cell dug below the floor looks like a crate in a pit; and a
   long shaft is still a long shaft — niches and a change of section would do more than texture.
2. **Ships** — done in two series of ten passes (`03-ships` and its split, `03a`…`03e`). Class
   reads by silhouette, the fleet is painted like industrial hardware (bone skin, panel plating,
   graphite engines, stencils), the planform is a scheme of its own (delta, cross, catamaran, slab,
   disc, trident, swept) so there are about fifty silhouettes, and the luxe yacht is its own craft
   entirely. **Still open: faction** — one visual language for everybody, and per the queue below
   factions come after stations.
3. **Cantinas** — done. Light is a layout (how many lamps, what tone, how wide the cone, what
   happens between them), the crowd is counted per station type, what stands behind the counter is
   what the place deals in, and the music leans by type. **Still open:** the counter is the same
   length and shape in every hall.
4. ~~**New world types:** crystalline, jungle, metallic, ruin.~~ — DONE: all four are in `TYPES` (02-world) with profiles, relief and geology.
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ — DONE at M108 (`17b-finds`).
6. **`base` and `scoop`** — twelve passes on the base (`21a-mode-base`, `21aa-base-rooms`,
   `21ab-base-interiors`; stands `docs/mkbase.ps1`, `docs/mkroom.ps1`) and a first ever pass on
   `scoop` (`19a-mode-scoop`, stand `docs/mkscoop.ps1`). The narrative of what each pass fixed is
   in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) — grep it for `M55`. Open debt only, below.
7. **Factions as a language of shapes** — only after ships and stations, or there is nothing to
   tell apart.
8. ~~**Redo the clouds.**~~ — DONE: `19e-clouds` is a density field in perspective, called from `drawSkyLayer`.
9. **The world on foot** — the surface is the longest screen in the game after the cockpit, and it
   has never had a pass of its own. Stand: `docs/mkworld.ps1` → `docs/shots/world-types.png`.
10. **Split debt.** `23-mode-dig` and `27e-ui-home` have crossed the 40 KB line; `build.ps1` was
   re-baselined on 2026-08-15 so the guard stays quiet, which is a loan, not a payment. One
   payment made on 2026-08-16: `21aa-base-rooms` (60 KB) was cut along its seam into the brushes
   plus `drawModule` (24 KB) and `21ab-base-interiors`, the eight compartments (37 KB), and left
   the guard's list instead of being re-baselined inside it. **Next: `21a-mode-base`, 52 KB** —
   it grew over the base passes and is deliberately left shouting on every build.

### Graphics debt (open faults, one line each)

Written down on 2026-08-16 so the picture stops being an open-ended errand: everything below is a
**fault someone found by looking**, not a wish. The queue moves on to mechanics; these are taken
one at a time when a pass is due, and nothing here blocks a milestone.

- **base, tight rooms** — in the reactor, the quarters and the lab the machine fills wall and
  floor, so neither the wall trace (`bDress`) nor the leftovers (`bJunk`) show at all. The fix is
  a free strip in those rooms' own layout, not drawing things over the equipment.
- **`scoop`, soft texture** — the giant is baked at 512×256 and stretched to one and a half
  screens: not one crisp edge belongs to the cloud itself, and the shear edges are shadows laid
  over that softness. Also: the floor is lighter than the design wants, and nothing but the
  palette changes between types of giant.
- **mine** — landings in the shaft barely read; a tub in a cell below the floor looks like a crate
  in a pit; a long shaft is still a long shaft (niches and a change of section beat texture).
- **cantina** — ~~the counter is the same length and shape in every hall~~ done in 0.99.0
  (`cantCounter`). Pass 2 (0.99.3): hall lifted, crowd in colour, floor with light pools. Next: a barkeep
  who moves; glasses and bottles on the counter per type; a second window plane.
- **подглядка** (M118) — the walker's trail dissolves into the mat's glow; the mat is identical
  on every world; an arm at rest merges into the torso; the crate rides near the chin.
- **Жестянка** (M119) — the plume is three evenly spaced puffs; the plant is the same shape on
  every world; the drum's hoops do not read as turning.
- **Грохотун** (M120) — at 64 px, the size he is actually seen at, the three eyes merge into a
  smudge; the hide is flat khaki with no dust streaks; the working arms hide behind the torso.
- **ships** — no faction language; it comes after stations by the queue above.
- **the world on foot** — the longest screen after the cockpit, still without a pass of its own.
- **split debt** — `21a-mode-base` 52 KB, `23-mode-dig`, `27e-ui-home` (see item 10).

### The graphics & performance pass (G1–G12) — written 2026-08-22 from the shots, not from memory

Self-review of every screen against the art direction (M54 rules). Each line is a **fault seen in a
frame**, then the fix. Order is by how much of play time the screen takes; G0 comes first because
the rest of the pass is measured against it.

**What is already right and must not be touched:** base cross-section, cantina bar, HQ room,
nav map, cockpit frame and rack, crystalline surface mosaic, the hundred portraits. These set the
standard; the rest is pulled up to them, not the other way round.

- **G0 — measured (2026-08-22, 0.95.0), visible Chrome tab, AMD iGPU, window 1536×735 CSS.**
  fps by mode at ×2 (3072×1470), before → after the first cache pass: surface 40→45, mine 39→44,
  cave 55→59, scoop 51→55, landing 53→55, system 53, map 61. Same surface at ×1.5: 58, at ×1: 60.
  The frame is **fill-rate bound**: one full-screen pass (a blit, a fill, a gradient) costs
  ~4–5 ms at ×2 on this GPU, JS is ≤3 ms in every mode. So the budget is counted in
  **full-screen passes per frame**, not in objects: about six fit at ×2, twelve at ×1.5.
  The hidden-tab `prof()` numbers are not comparable with these (readback inflates everything
  ×3 and gradients ×8) — rank with them, never quote them. Rules that follow: (1) a gradient
  or a composite that does not change frame to frame is a `screenLayer`, never a per-frame
  fill; (2) anything static under the camera is a chunk; (3) every new painting pass below
  states how many passes it adds and pays for them somewhere else; (4) `resAuto` stays the
  safety net, ×1.5 is the honest default on integrated GPUs.
- **G1 — six worlds, one body** (`world-types.png`). Earthlike, desert, ice, volcanic, toxic and
  jungle differ by palette only: the same cell-outline macro texture on rock, sand and ice, the
  same relief amplitude, the same god-ray stamp at the same angle on every world, the same three
  strata. Violates "material in three scales" and "one screenshot says where you are". Fix per
  world type, not per colour: a **material kit** (`18a-material`) with its own macro form —
  dunes/ripples for desert, fracture plates and blue depth for ice, cooled crust with glowing
  cracks for volcanic, sodden banks and pools for toxic, root mass and canopy for jungle; relief
  amplitude and strata count from the kit; rays only where the sky gives a reason (dust, mist).
  **Done in 0.97.0** for the material kit (dune, frost, crust, sludge, soil) and the shafts.
  Still open: relief amplitude and strata count per kit; flora silhouettes per world.
- **G2 — no aerial perspective on the surface** (`surface.png`). Far ridges use the near ground's
  texture and value; the ground does not darken with depth; nothing stands in front of the player.
  Fix: three planes — far ridges as flat value silhouettes tinted by the sky (cached
  `screenLayer` per world), mid ground as now, a sparse **foreground** band (boulders, grass,
  drift) at 1.15× parallax drawn last and blurred by value, not by filter. Depth gradient on the
  ground: the lowest third goes to the sky's shadow colour.
  **Done in 0.98.0** for the foreground band (`drawForeground`, 21b). Still open: far ridges as
  a cached sky-tinted layer; a deeper value gradient on the near ground.
- **G3 — the mine is an empty frame** (`mine.png`). Shaft on a blank plane: strata are flat fills
  with one outline, no texture, no niches, no scale; a tub reads as a crate in a pit (debt above).
  Fix: rock from the same material kit as the surface (chunked by world-x, as cave rock), strata
  with their own micro grain, landings as real rooms (beam, lamp, crate stack, a man-height mark),
  changes of section along the shaft, dust in the lamp cone. This is the weakest screen in the
  game and the first painting job.
  **Done in 0.96.0** (rock was invisible by a clip bug; contacts, landings, lamps, hoppers).
  Still open: niches and a change of section along a long shaft; rock chunks by world-y.
  Passes added: 0 (lamps are sprites inside the void clip).
- **G4 — the raid is in a different language** (`raid.png`). A projected corridor of flat fills,
  wireframe crates, an enemy as a pink capsule. It is the only screen the player would not
  recognise as the same game. Fix: keep the projection, repaint with the base's brushes —
  plated walls with rivets (`bDress`), real crates, pirates drawn as bodies (M74 rules), a floor
  with grating and cable runs, one light cone from the hangar door, dust.
  **Done in 0.99.5** for plating, floor plates, light pools, crate rims. Still open: pirates
  at rest (poses), the hangar door cone, a rock wall where the base meets the asteroid.
- **G5 — the scoop giant tiles visibly** (`scoop.png`). The band's waves repeat at one screen
  width and the baked 512×256 is stretched to ×3. Fix: bake at 1024×512 per giant type with a
  non-tiling domain warp (fbm on fbm), bands as fronts with sharp leading edges and soft trailing
  ones; the floor darker than the band; per-type structure (spots, vortices, plumes), not
  palette.
  **Partly done in 0.99.2** (768×384, wider tile). Still open: per-type structure, sharp fronts.
- **G6 — the belt is unlit** (`cockpit1.png`). Asteroids are flat polyhedra with no light
  direction; the void behind is a gradient; nothing gives distance. Fix: one star direction per
  belt, faces shaded by normal against it (computed once per rock, cached), a rim on the lit
  edge, three depth planes with dust motes drifting in the near one, the far rocks smaller and
  greyer. The frame and rack stay.
  **Note (0.99.2):** the faces were already lit by normal against the star with a rim; the
  fault was contrast — terminator sharpened. Still open: depth planes, near dust motes.
- **G7 — the sky is a band.** On every world the sky is a vertical gradient; the landing screen
  draws clouds as puffs on haze and rain as uniform streaks; the ringed body is drawn through its
  ring. Fix: sky from `19b` as a cached `screenLayer` per (world, hour, weather): horizon glow,
  a gradient bent by the star's altitude, a few cloud fronts from `19e` with a lit and a shadow
  side; rain in two speeds; ring split into back/front halves around the disc.
  **Note (0.99.6):** the sky base is a cached layer since 0.95.0 and rings were already split;
  0.99.8: horizon glow in the star colour, rain in two depths; clouds already had
  lit/shadow sides. Still open: glow bent by the star altitude (needs the hour from 06a).
- **G8 — the ship on the ground is a postage stamp.** On the surface the landed ship is ~40 px
  with no shadow, no landing gear dust, no hatch light. Fix: contact shadow, a pool of light
  under the hatch at night, the hull at the same scale as the base's people (the human is the
  rule).
  **Done in 0.99.6** (shadow, hatch pool). Still open: the scale check against the base people.
- **G9 — base surroundings** (`base.png`). The hill is one flat dark mass; the soil around the
  modules is one brown. Fix: strata through the soil with the surface's micro grain (chunked),
  a few buried stones, the shaft's spoil heap on top, the hill silhouette with a lit edge from the
  sky. The rooms stay.
  **Done in 0.99.2** for the hill (lit gradient, material, sky rim). Still open: spoil heap,
  buried stones that read.
- **G10 — system view composes nothing** (`system.png`). Nebula blobs, even stars, the star and
  planets off-frame: the screen looks like a loading state. Fix: stars in three magnitudes with a
  few coloured ones, the primary's glow bleeding into the frame from its direction even
  off-screen, orbit lines fading with distance, nebula as two layers with parallax.
  **Done in 0.99.7** for the off-screen bleed and orbit fade. Still open: three star
  magnitudes with a few coloured ones; nebula parallax.
- **G11 — raster budget, by rule.** After G0: anything static under a moving camera goes
  through `18c-chunks` (today only landing and weather call `screenLayer`/`chunkAt` — the
  surface ground, cave and mine rock, base soil and the sky should all go through it); per-frame
  `createRadialGradient` in `20-life` (11 sites: astronaut lamp, flora caps, fauna glows) is
  replaced by sprites baked once per (kind, size) and `drawImage`d; the full-screen veil and
  vignette are one cached layer; `globalCompositeOperation` switches are grouped so the layer
  stack flushes once. Target: every mode ≥ 55 fps at ×2 on the dev machine, with `resAuto`
  never firing in normal play.
- **G12 — the foot world gets its pass** (debt above). The longest screen after the cockpit. After
  G1–G2: a POI every 2–3 screens with a silhouette visible from afar, wind in the flora, tracks
  behind the walker, a night with the suit lamp as the only light.
  **Pass 1 in 0.99.9:** tracks. Still open: POI rhythm, wind in flora, night (needs an hour).

Not in this pass (still the list under "What not to do"): blur, DoF, chromatic aberration,
motion blur. Depth is done by value and overlap, never by filter.

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter — expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---

# QUEUE: the twelfth pass — the thing that is found in pieces — CLOSED (M106–M115, 0.56.0–0.65.0)

**Every milestone below is built.** The pass is kept here in full rather than archived because it
is the design standard the next pass is measured against: what a fragment is allowed to be, why
the rate needs reasons, why the ending is a state of the world and not a screen. When the next
queue is written, this moves to [`docs/PLAN-archive.md`](docs/PLAN-archive.md) whole.

**What the pass left open**, in one place, so it is not rediscovered by accident: the settlement
has no sound and is not marked from the horizon (M109/M110); the watch is invisible from inside a
cave (M110); the battery has no voice of its own and a browned-out base does not report that its
defence went quiet (M111); missiles exist only in system view and a dry launcher is not visible on
the ship (M112); the houses own stations but do not look different, and the cantina never mentions
them (M113); the end of a world is a log line and an empty map cell rather than a changed system,
and managers cannot be assigned to the lift (M114). The graphics debt above is unchanged.

M94–M105 gave a body to numbers that already existed. This pass gives the galaxy a **reason to be
crossed**. Today the far corner differs from the near one by a coefficient (`sysDanger`) and
nothing else: no place is worth reaching for its own sake. Everything below exists to fix that,
and it hangs on one long story the player assembles out of fragments.

## The principle behind this queue

**A fragment is useful before it is understood.** A piece of the story never arrives as a piece of
the story. It arrives as a coordinate, a price, a schematic, a word of their language — something
that pays on the spot. Only later does it turn out that the twenty things that paid were one
account of what happened here. The player assembles the story out of greed, not politeness.

Three consequences, and they are binding:

- **No lore item.** Nothing in the game is picked up whose only property is text. A fragment lives
  on the back of a thing that already has a use (an address, a rate, a vocabulary entry). If a
  fragment can be deleted without any mechanic noticing, it is a lie in the sense of the perk rule.
- **The story is closed and finite**, like `NODES` and `RARE`: a fixed table generated from a fixed
  seed, with a guard sweeping for reachability. An infinite generated story is noise.
- **The end changes the map, not the text.** The last answer is a state of the world — a layer, a
  route, a settlement that lives or doesn't — not a screen with the truth on it.

## The shape it is told in: a survey that turns into an investigation

The structure this pass follows is the one classic Russian children's science fiction uses — a
collecting expedition that stumbles into a mystery and solves it by **interviewing witnesses**,
each of whom holds one piece and none of whom can simply tell you. Nothing is borrowed but the
architecture: the names, the places and the creatures here are our own, and no character, phrase
or plot of anyone else's book enters the game. What we take is a way of building, and it is worth
spelling out because it is stricter than "collect fragments":

1. **The question comes before the fragments.** The player is not handed a mystery to be curious
   about; he walks into an incident in the first hours — something happened here, plainly, and it
   was aimed at somebody. Everything after that is him asking about it while doing his job.
2. **Every witness is partial and none of them lies.** One repeats a phrase it does not
   understand. One saw the end and not the beginning. One was there and no longer remembers,
   because that is what was done to him. Contradictions come from vantage, never from deceit —
   a lying source teaches the player to distrust sources, which kills the whole structure.
3. **The witnesses are places and creatures, not text boxes.** A mined-out world with a machine
   still transmitting to nobody. An animal that repeats what it heard. A settlement that remembers
   a face. All of these are things the game already knows how to build.
4. **The villain is someone the player already knows and has been dealing with comfortably.** Not
   a hidden power: a familiar figure with a plausible trade. The reveal costs the player something
   he had come to rely on, which is the only kind of reveal that lands in a game.
5. **The truth is a person, not an event.** At the end of the chain there is someone the
   expedition left behind — alive, and unable to say so.

## The spine

Kept here so every milestone below can be checked against it. The player never reads this; he
reconstructs it.

The obelisks were not put up by aliens. They were put up by the **expedition before yours** —
people with the same job, the same barges, the same debts. They mapped this arm, seeded settlements,
built system defences, and left their survey the only way that survives without power: cut into
stone, addressed by sky events rather than by coordinates, because coordinates drift and the sky
does not. Then they stopped arriving.

The locals remember them — not as gods, as the people who used to come. Their language is the
expedition's pidgin, worn down; that is why fragments teach you to speak with them.

What the expedition found, and what their obelisks are dated against, is a thing on a schedule.
That is why the story is a **calendar**, not a treasure map — and why the last chapter is an
evacuation and not a boss. The player's own settlement is the fork: repeat their run, or do the
one thing they failed to do.

**They did not all die, and that is the answer at the end of the chain.** The expedition was cut
apart on its last leg by people who traded with it — and one of its officers came out alive, with
his record wiped, and has been in the galaxy ever since doing small work at the tables. He is not
hidden anywhere: the player meets him early and cheaply, as one more face in a cantina. He cannot
tell his own story because it was taken from him; the fragments the player collects are the pieces
of it, and what returns him is having his own account read back to him. That is why the ending
needs no revelation screen — the payoff is that a man the player had been walking past for twenty
hours stands up and finishes the survey.

**And it was not pirates.** The ones who cut «Долгий Ход» apart were its counterparties — the
trading house that ran its supply legs, `«Ласковый»`. Which means the reveal costs the player
something he uses daily, not something he was already fighting. The survivor is **Тихоня**; the
thing on schedule is **Прибой**; the names are set out in full below.

## M106–M108 — built (0.56.0–0.58.0)

**M106 obelisks.** The map is opened, not scanned: a hundred pieces of the previous expedition's
report, dealt from one closed pool so none is unreachable, each paying on the spot in an address, a
price sheet, a word of their pidgin or survey data — never in credits. `12q-lore.js`, POI kind
`obelisk` (`ЗАРУБКА`), marks drawn over the map, `91p-lore.js`.

**M107 the sky keeps a calendar.** Eclipse, parade and comet, computed from the system seed and
never stored (`06a-celest.js`). The sky's one right to touch mechanics is light — and the notch's
**second, dated answer**: read a slab while the sky is doing what it was dated against and it names
the next address in the same chapter.

**M108 finds in flight.** Four finds in the void — capsule, satellite, container, hulk — and the
satellite is theirs (`17b-finds.js`).

**The tail was closed later:** the tally on the notches, the base shadow, the stand
(`docs/mkstone.ps1`, `docs/shots/stone.png`) and the fragment board (`27h-ui-lore.js` — the place
where the collected record is read, gaps kept as gaps).

Full text, the decisions taken along the way, the faults found by looking and the two original
specs the built versions departed from are in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) —
grep it for `M106`.

## M109 (0.59.0) — built. The settlement: you give, they decide

Built as **`12t-settle.js`** (the spec said `12p-`, which was already taken by the news module),
suite `91y-settle.js`, entry point on foot in `21-mode-surface`: the settlement stands at one
place on the planet, computed from the seed, and you walk to it. The action hands over the largest
stack in the hold — the diet is what the player actually carries, not a line ticked in a menu —
and when there is nothing to give, the same button asks.

Both gaps left by the first slice are closed. The settlement is **drawn** (`settleDraw`, stand
`docs/mksettle.ps1` → `docs/shots/settle.png`, three stages in a column): a row of low huts, one
per building plus the two that were always there, a hearth burning in every window, smoke only
over a kiln, a forge or a still — and it stops when the mood falls below a third, which is what
hunger looks like without a number; watchers step out at stage 2, which is where M110 will pick
them up. And **the vocabulary is now a lever**: a word that came as a fragment (`SETTLE_WORD`)
names a good, and naming it puts that good first in what they bring out. It does not conjure what
they cannot make and does not override the mood — a request, not an order.

**Still open:** the settlement has no sound of its own, and the walk up to it is not marked from
the horizon the way the cave is.

The original spec, kept as the standard the build is measured against:

- **`G.settle["sx,sy"] = {seed, stage, mood, stock, built[], lastTick}`** — persisted, sparse, keyed
  like everything else. Growth is a lazy roll over `Date.now()-lastTick` with the offline cap, the
  `tickDrones()` model, never a live simulation.
- **You cannot order.** The whole difference from your own base (M37/M38) is authority: you hand
  over resources and they choose what to raise, by their own leaning (from `seed`) tilted by what
  you kept giving. Handing them ore for ten hours makes a different village than handing them
  volatiles. The player's control is a diet, not a build menu.
- **They pay in goods, on their terms.** No wage, no percentage, no steady line: you fly in and ask,
  and `mood` decides how much is ready. The hired-hand rule applies unchanged — this is a bet, not
  an income stream. Edits that make the settlement a reliable earner break the design.
- **At stage 3 they become a point on the factor's map** and barges start calling (M94), exactly as
  the player's planet does at M97. That is the real reward: you put a node on the map that trades
  without you.
- **Their speech is the expedition's pidgin.** No translated text ever. A settlement answers in
  glyphs drawn from its seed; each `LORE` fragment (M106) unlocks one word, and an unlocked word
  turns a guess into a request you can actually make. This is what stops fragments from being lore:
  vocabulary is the interface.

Suite **"the settlement: a gift, not an order"** — no call path lets the player choose a building;
the settlement never pays credits; growth respects the offline cap; a settlement below stage 3 is
invisible to the barge router; every glyph shown corresponds to an owned fragment.

## M110 (0.60.0) — built. The ones who live here stand between you and the fauna

`settleWatch(p)` in `12t-settle.js`: the watch is a fact about the ground, not a buff — stage 2,
the settlement's **own** planet, and only while it is fed (`mood ≥ 30`); a hungry village drops
its watch first. In a watched biome `enterCave` (`22-mode-cave`) spawns fewer biting beasts and
they close only to a line — no bite at all, with the prompt saying why. The other way round:
`settleLeftBehind()` on `jump()` (`18-mode-map`) charges the village for the tail left over its
heads — per pirate that had **noticed** the player, a hunter (M98) counting double; mood always,
a building only under a dense raid, and nothing is paid to the settlement for it. `raided` was
added to the settle whitelist in `applySave`.

**Still open (with M109's tail):** the settlement has no sound of its own, the walk up to it is
not marked from the horizon the way the cave is, and the watch is invisible from inside the cave —
it is read from the prompt, not seen.

## M111 (0.61.0) — built. System defence: the battery that is built, not bought

Built as **`21d-battery.js`**, room `battery` in `BUILD` (`21a-mode-base`, top level only, `-12`
inside the existing power balance), compartment art in `21ab-base-interiors`, the shot line inside
`drawCombat` (`13-pirates`), and suite **"the battery cuts noise, it does not hold a system"** in
`91h-base.js`.

- `battAt(sx,sy)` counts the guns standing in that system and takes the worst power efficiency:
  a wrecked room does not count (that is `basePower`), a browned-out base fires slower.
- `battTarget` is the guard on the design: rank 0, no `hunter`, no `rogue`, no `rival`. The test
  fires four thousand frames at a baron parked next to a jackal — the jackal dies, the baron is
  not scratched. Range is `BATT_RANGE=3000` around its own planet, not the system.
- Seen from orbit as a line from the ground, drawn under the ships; the kill is logged by name.
- **The magazine, not the barrel.** From the cross-section you see what feeds the gun: turret ring
  in the ceiling hatch, feed hoist, shells standing at hip height (the man is the measure), and a
  firing lamp lit only while the battery really shoots.
- The expedition's own ruined batteries are on the ground: POI kind `battery` on solid worlds
  (`drawDeadBattery`, `20aa-poi-shapes`, stand shot `docs/shots/poi-battery.png`), answering with a
  piece of the report through `POI_FIND.battery` — their government property, not a monument.
- Along the way `20a-poi.js` was cut along its seam into the picker and `20aa-poi-shapes.js`
  (one payment on the split debt, item 10 above).

**Still open:** the battery has no sound of its own from the system view beyond the shot blip, and
a base that is out of power gives no notice that its defence has gone quiet.

## M112 (0.62.0) — built. Missiles

Built as **`16b-missile.js`** (mechanic, lab row and drawing in one place), part kind `missile` in
`05-parts`, `RES.missile` + `AMMO_KEYS` in `02-world`, the stat block in `08-state`, the launch and
the draw inside the combat loop (`13-pirates`), suite **"missiles: ammunition is cargo"**
(`91z-missile.js`).

- **The hardpoint is appended last** in `slotsOf`, outside the weighted roll: `w` is untouched, so
  slot indices of existing loadouts did not move and old saves keep their fits. One per hull.
- **Ammunition is a line in the hold.** `AMMO_KEYS` is a third category next to trade and rare: the
  market does not take it, managers do not eat it as a sample, the settlement is never handed it as
  food. `held()` counts it, so a full magazine is a flight with no revenue.
- **Assembled, not bought** — `AMMO_COST` in the lab section next to part crafting; a working lab
  of your own (`labWorking`) adds to the batch, and a batch that would not fit in the hold is not
  assembled at all rather than assembled and spilled.
- **It hits everyone**, unlike the battery (M111) — that is what makes the hold space worth paying.
  The target is chosen once, at launch, from what is ahead of the nose: no re-acquisition, no
  loitering, and a miss is spent for good.
- Own pad and key (`G`), shown only in system view with a launcher fitted, labelled with the count
  left in the hold and dimmed when it is zero.

**Still open:** missiles exist only in system view — the belt (`24-mode-belt`) has its own combat
loop and does not know about them; and nothing on the ship silhouette shows the launcher is dry.

## M113 (0.63.0) — built. Local scrip and a rate that moves for reasons

Built as **`12u-scrip.js`** (table, rate, exchange and the station tab in one place), hooks in
`12p-news` (every rumour the world rolls), `13b-occupy` (a system freed) and `12t-settle` (a
settlement reaching stage 3), persistence in `14-save`, suite **"scrip: the rate has reasons"**.

- **Four houses** in a closed table, `«Ласковый»` among them, so the trading house the spine names
  is a thing the player deals with daily long before it matters. `houseOf(sys)` is deterministic
  from the system seed on its own hash stream — no existing generator moved.
- **`scripMove` is the only door into the rate**, and it refuses a move without a reason. Reason
  and delta go to `G.scripLog`, and the tab shows that ledger under the price: a rate whose reasons
  are not readable is a roulette wheel.
- **Spread 6% each way plus a 40-unit cap per docking**, so a buy-then-sell with no event between
  is always a loss. The edge is knowing first, and the player causes most of the news himself.
- Wallet and holding never go negative; on load an unknown house is dropped, a nonsense rate is
  clamped into range and ledger lines without a reason are thrown away.

**Still open:** the houses own stations but do not yet look different — that is where the faction
visual language from the graphics queue would land; and nothing in the cantina talks about the
houses, so the rumours and the rate are read on two different screens.

## The original spec, kept as the standard:

`12-economy` plus the retelling (M99). The riskiest idea in the pass, so the guard rails come first.

- A faction's scrip is not a second wallet — it is a **claim on that faction's stations**, bought
  and sold at a spread. Holding it is a bet on that faction's fortunes.
- **The rate only moves on events that really happened** (M99 rolls them anyway): a station changes
  owner, a baron goes broke, a route is cut, a settlement of yours reaches stage 3. No random walk,
  no drift term. If the rate can be predicted from noise, it is free money, and free money kills
  the market the game already has.
- The spread and a per-visit conversion cap make round-tripping a loss, the same way M94 made barge
  arbitrage a loss. The player's edge is knowing the news first — which he does, because he causes
  most of it.

Suite **"scrip: the rate has reasons"** — every rate move traces to a recorded world event;
buy-then-sell without an intervening event is never profitable; the wallet cannot go negative.

## M114 (0.64.0) — built. Evacuation: a world that ends on schedule

Built as **`12v-doom.js`**, `RES.folk` + `PAX_KEYS` in `02-world`, two action branches in
`21-mode-surface` (lift at the settlement, land on new ground), the arming hook in `settleRaise`,
the lazy hour on the same rare tick as everything else background (`28-loop`), persistence in
`14-save`, suites **"the hour: they are lifted by hold, not by a button"** and **"only those you
sent help"**.

- **One deadline per playthrough**, armed when the player's own settlement reaches stage 2 — there
  has to be something to lose. `DOOM_LEAD` is 90 wall-clock minutes and keeps running while the
  game is closed, like every other background clock in the game.
- **Learned under that sky** (`doomLearn` fires in that system, not from a menu), then marked on
  the rumour layer of the map and counted down in the log at 30, 10 and 2 minutes.
- **People are a line in the hold.** `PAX_KEYS` is the fourth resource category: not tradeable, not
  giftable to a settlement, never chosen for overflow dumping on a ship swap — and lost with the
  ship if it is wrecked, which is logged as its own line.
- **`doomHelp` counts only hired hands already ordered to that sector**, half a hold each. What is
  lifted is what the player organised before the hour, not what the game forgave.
- **Landing is the outcome:** a live world in another system with nobody on it. The settlement
  restarts at a lower stage with half its buildings left behind, but keeps `seed`, name and lean —
  the same people, so the vocabulary the player collected still answers.
- **Not lifting is a permitted ending**, charged nothing: the settlement is deleted, the system is
  written into `G.doomDead` and stays on the map, empty.

**Still open:** the end of the world is a log line and an empty map cell — the system itself does
not look changed from `17-mode-system`; and the managers (12c) cannot be assigned to the lift, only
hired hands can.

The original spec, kept as the standard the build is measured against:

- The obelisks' calendar names a date for a system. When it comes, that world ends — the event is
  the one the expedition was measuring, and it was never mysterious to them, only unavoidable.
- **The player can lift them.** Hold space, trips, time — the ordinary machinery of the game used
  for something that is not cargo. Nobody assists: managers and hired hands can be assigned, and
  the number carried is the number you organised.
- **Where they land is the outcome.** A rehomed settlement restarts elsewhere at reduced stage,
  keeping its vocabulary and its memory of who came. Not lifting them is a permitted ending: the
  system stays on the map, empty, and their glyphs stop being answerable.
- This is the fork the spine promised: the expedition measured the date and left. You have the same
  date and a ship.

## M115 (0.65.0) — built. The assembled account

Built as **`12w-survey.js`** (the layer, the legs, the colours and the study shelf), one call in
`drawMap` (18-mode-map) and one in the study step of `27e-ui-home`, suite **"the account:
assembled, not narrated"** (`91zd-survey.js`). **With it the twelfth pass is closed.**

- **The survey is theirs, not yours.** `surveyPoint(R)` is a pure function of the fragment's seed —
  a sector within 13 of the origin, on a real star — so the layer is a survey taken long before the
  player and identical in every session. Their notation is a cut cross with a line under it: chosen
  so it argues with neither the star, the station, nor the notch ring already on the map.
- **Exactly what was earned, never a point in advance.** One fragment, one point, in the order this
  player found them; a different order is a different account.
- **A read chapter joins its own points** with a dashed leg — before that they are separate marks.
  So the map turns from scattered notches into a route the way the story does: by being finished.
- **The study shelf** under the museum wall (M100): one spine per fragment in find order, coloured
  by chapter, muted into the wall. No text, no screen, nothing to read — the account is a thing on
  a shelf that is different in every playthrough.
- **The pass does not depend on M114**: the layer never asks whether anybody was lifted.

The original spec:

- With the fragments in hand, obelisks stop being separate: the map layer joins into **the
  expedition's own survey**, drawn in their notation over yours, including the places they marked
  that you have never visited.
- The museum wall (M100) gains its final shelf: not a hundred rarities but one account, assembled
  in the order the player actually found it, which is different for every player.
- **No revelation screen.** The reward is the survey layer, the settlement that lives, and the
  glyphs you can now read. If the ending needs a paragraph to land, this pass failed.

Suite **"the account: assembled, not narrated"** — the survey layer only shows what fragments were
earned; no fragment is required twice; the pass is completable without M114 having succeeded.

# The witnesses: five things that carry the story instead of text

Everything above says the story arrives on the back of useful things. This section says **which
things**. Each is a witness in the sense of the detective shape: partial, honest, and unable to
explain itself. Four of them are archetypes from the same tradition, rebuilt on our machinery —
a worked-out world of machines, a bazaar where the dead captain's belongings are resold, an animal
that repeats what it heard, and a flora that replays what stood in front of it. The names below
are ours; the roles are the classic ones.

**Why these four and not a quest log.** Each is already half-built in `Drift`: we have fauna and
flora with species (`20-life`), station types (`26-ui-station`), settlements coming in M109 and a
light model good enough that an eclipse can be a plot device. A witness costs a table and a hook.
A quest log costs a subsystem and reads as homework.

## The names

In-game names are Russian, like everything the player sees, and they lean the way the game already
leans: plain, slightly rude, funny by understatement rather than by joke. A name here is a working
label a spacer would actually use, not a title.

| Role | Name in game | Why |
|---|---|---|
| the previous expedition | **«Долгий Ход»** | how a crew names its own worst contract |
| the thing on schedule | **Прибой** | it comes in, it goes out, it is not personal |
| an obelisk | **зарубка** (player) · **камушек** (the digger's word) | a survey mark, not a monument |
| the digger | **Грохотун**, by trade a **копач** | eight limbs, one volume setting |
| what he takes as payment | **настойка** (barrels of `xeno`) | he calls it medicine, everyone else calls it a problem |
| the repeater animal | **трепло** | mock-taxonomic, exactly how a species table reads |
| the flora that replays light | **подглядка зеркальная** | it was watching the whole time |
| the worked-out machine world | **Жестянка** | what is left when a world is a container |
| the bazaar station type | **блошинец** | a flea market with a docking clamp |
| the trading house that cut them apart | **торговый дом «Ласковый»** | the nicest name on the invoice |
| the survivor at the tables | **Тихоня** | a nickname, because his record is blank |

`Прибой` and `«Долгий Ход»` are the only two the player has to piece together; the rest he hears in
the first hours. The joke in every one of them is that nothing in space gets a grand name — it gets
the name the third shift gave it.

## M116 (0.66.0) — built. Трепло: an animal that carries a sentence it does not understand

Built as **`12x-parrot.js`**, hooks in `17b-finds` (the hulk hands it over), `12q-lore` (it hears
at a notch and re-reads on every new word), `26-ui-station` (`parrotDock`), `13-pirates` (it hears
the kill), the list on the fragment board (`27h-ui-lore`), persistence in `14-save`, suite
**"the repeater: it says only what it heard"** (`91ze-parrot.js`).

**One departure from the spec, deliberate:** the first bird comes out of a wrecked scout's effects
rather than a bazaar lot, because the bazaar is M121 and the milestone should not wait for it. The
role is unchanged — someone's property with a known fate, and the dead owner is named on the spot.

- `heardAdd` is the only door, and it refuses a line without a kind and without a bird: a line
  with no event behind it is the same lie as a perk with no code, and the loader throws such lines
  away.
- **Pidgin is stored as word numbers**, never as text, which is what makes retroactive reading
  possible at all; `heardWordsRu` shows a glyph for every word not yet owned, and the test checks
  that no unowned word leaks through the glyphs.
- **`heardReread` works in waves** — one new word re-reads the whole memory, and a decoded phrase
  pays in an address, the currency a notch pays in.
- **`heardYours` + `heardBlurt`** are the other half: the bird eventually repeats what it heard
  from you, at a counter, once per line, and it costs reputation there. A witness that can testify
  against you is the only kind worth having.
- The roll for blurting is per docking rather than per (phrase, station) pair — a deterministic
  roll would mean the bird is either silent at that station forever or blurts on the first visit,
  and what is wanted is "sometimes, at the wrong moment".

**Closed at M117 (0.67.0):** the bird has a body — `12y-parrot-face.js` gives it a perch window,
a procedural animated portrait and five poke zones, and the hulk now always hands it over. Its
name lost the "ушастое": it has no ears and never had.

**Closed at M117a (0.69.0):** the perch window is the bird's whole home — open it and it is
there, close it and it is gone — so it was given a repertoire: 52 behaviours as data over ten
new degrees of freedom (`12z-parrot-acts.js`), three moods that decide what can happen, and a
nap that ends on a clock rather than on a dice roll.

**Decided against, and why:** the bird does not ride the astronaut and does not appear in the
cockpit. The cockpit is drawn from one mode only (the belt), and everything else is top-down,
where a bird has nowhere to sit; a shoulder pet across the five walking modes would need a
second, tiny body — eight pixels next to a 26-pixel astronaut — and that is a milestone of its
own, not a detail of this one.

**Still open:** the bird never hears anything on a planet, only in flight and at counters.

**Split debt:** `26-ui-station.js` crossed its 48 KB baseline at M113 (the scrip tab) and is left
shouting on every build rather than re-baselined. It is now second in the queue after
`21a-mode-base`.

The original spec:

The single best fit in the whole pass, because it turns a fragment into an object with a lifetime.

- **A fauna species** (`20-life`) that repeats sound it has heard: prices shouted at a dock, a
  bearing read aloud, a phrase in the expedition's pidgin. It is not caught in the wild first —
  the first one is **bought at a bazaar (M121) out of a dead man's effects**, which is how the
  player learns there was a dead man.
- **It pays before it is understood.** What it repeats includes things with immediate cash value —
  a station's prices from before you got there, a bearing to a find. That is its rent.
- **Retroactive comprehension is the mechanic.** Phrases in the pidgin are stored verbatim as
  glyphs (`G.heard`, persisted). They cannot be read until vocabulary arrives from fragments and
  the settlement (M109). Every new word **re-reads everything already stored**: a bird bought in
  hour two starts speaking in hour twenty, without the player going anywhere. Nothing else in the
  game gets better while sitting still, and that alone justifies the milestone.
- It repeats what it hears **from the player too** — including at the wrong moment, in front of the
  wrong faction. A witness that can testify against you is a witness worth having.

Suite **"the repeater: it says only what it heard"** — every stored phrase traces to a real event
the player was present for; a phrase is never invented; a decoded phrase matches the vocabulary
owned at the moment of decoding, not at the moment of hearing.

## M118 (0.68.0) — built. Подглядка: the meadow that remembers light

Built as **`20c-peep.js`**, hooks in `21-mode-surface` (the mat is placed, cleared of other
growth, updated and drawn in three layers), `12q-lore` (the witness pays with a fragment), stand
`docs/mkpeep.ps1` → `docs/shots/peep.png`, suites **"подглядка: луг, который помнит свет"** and
**"подглядка: платит за досмотренный проход"** (`91zf-peep.js`).

**Where it landed against the spec.** All three points stand: the species is on about one solid
world in nine that has a moon, it replays only while `celDark()` is up — that is, in an eclipse
and nowhere else — and nothing it shows is captioned. What was added on top: watching a full
pass through, standing inside the mat, hands over a piece of the report, because rule 3 of
`12q-lore` says a witness pays and this is the second witness the pool was waiting for.

**A numbering note.** The bird's body took M117 in the patch notes, so this entry moved from
M117 to M118 and the three below it moved with it. The thirteenth pass in the archive shifted the
same one step (M122–M151); its version tags there still read 0.71.0 → 1.00.0, one behind the
numbers, and the release stays 1.00.0 whatever the count comes to.

**Still open:** the trail behind a walker dissolves into the mat's own glow and barely reads;
the mat looks the same on every world, with no leaning to the planet's palette; an arm at rest
merges into the torso; and the carried crate rides high, near the chin.

The one place where the expedition is **seen** rather than read about, and the payoff that makes
the calendar (M107) matter.

- A flora species on a small number of worlds whose surface replays the light that fell on it: what
  stood here, once, as a moving silhouette in the existing surface renderer — our own figures
  (`hqFigure` scale rules), no new art language.
- **It only replays in the dark**, so it replays during an eclipse (M107) or not at all. A player
  can stand on the right planet for hours and see nothing; an obelisk that names the date is
  suddenly the most valuable thing he owns. This is the hook that ties the whole calendar together.
- What it shows is never captioned. A figure, a number of them, what they carried, which way they
  went. The player reads it or he doesn't.

## M119 (0.70.0) — built. Жестянка: machines still on shift

Built as **`12ta-tin.js`**, hooks in `21-mode-surface` (two places to walk to: the intake and
the printer), `18-mode-map` (the loop transmission on arrival), `14-save` + `08-state`
(`G.tin`, repaired on load), stand `docs/mktin.ps1` → `docs/shots/tin.png`, suites
**"Жестянка: наряд в мерах, которых больше нет"**, **"…смена идёт ровно на то, что засыпали"**
and **"…лента отдаёт по записи и кончается"** (`91zg-tin.js`).

**Where it landed against the spec.** All three points stand. The unit table is five dead
measures with non-round rates, so the conversion is real work; the shift runs exactly as long as
the feedstock, pays only in goods, and has no mood to consult; the tape gives a date and a
bearing and calls the event by a number. Two places rather than one screen: the machine and its
memory are different things and are walked to separately.

**Still open:** the plume is three evenly spaced puffs rather than smoke; the plant is the same
shape on every world, with no leaning to the planet type; and the drum's hoops do not read as
turning at a glance.

- A world type variant: mined out to nothing, atmosphere sour, and the automation from the previous
  owner still running with nobody to run it for. It transmits (M108's satellite family) on a loop.
- **It asks for one consumable** and it asks in the wrong units, because whoever set the request up
  is not there to fix it. Supplying it restarts a small piece of production — a settlement (M109)
  with no mood and no opinions, the cheap version, and a good place to learn the giving loop before
  a living village is at stake.
- **Its log is the honest witness.** Machines record everything and understand none of it: the log
  gives exact times and headings for events it cannot describe. Times feed the calendar; headings
  feed the map.

## M120 (0.71.0) — built. Грохотун: the one partner who does not work for money

Built as **`12tb-grok.js`**, one card of his own in the cantina (`27c-ui-hq`, `grokBlock`),
persistence in `14-save` + `08-state` (`G.grok`, repaired on load), stand `docs/mkgrok.ps1` →
`docs/shots/grok.png`, suites **"Грохотун: рейс, а не кресло"** and **"…объясняет один раз"**
(`91zh-grok.js`).

**Where it landed against the spec.** All four points stand. He is a run with its own lazy clock
and touches neither `G.crew` nor `G.mgrs` — the suite guards exactly that; payment is food,
never credits, and the price climbs per closed site; a dig raises occupation where he worked and
half his returns hand the hunter your current sector; the tutor line fires once and grants
nothing. Sites are the union of the report's addresses and their survey points, minus what he
has already dug.

**Portrait pass (2026-08-21).** The three faults above are closed. The eyes are spread wider,
the middle one is larger and set higher, each sits in a socket with a light rim, and pale ridges
of hide stand between them — at 64 px three eyes are counted, not one dark band. The hide carries
soft dust streaks with faded ends, a worn belly and two old scrapes, so it is no longer one flat
khaki. Both working arms break at the elbow and run **outside** the silhouette, spade hands fully
in frame; the small chest pair is drawn in the darker tone with a contour, because the body tone
swallowed it, and no longer crosses in the middle over the belt.

**Still open:** the torso is a plain trapezoid — no shoulder line where the arms leave it; the
box on the belt floats without a strap holding it down; and at 64 px the small chest arms are a
blur, readable as movement but not as arms.

A recurring figure — loud, many-limbed, delighted to see you, catastrophically indiscreet — who
digs the expedition's sites for a living and knows what an obelisk **is** while knowing nothing
about who left it.

- **He is a run, not a crew member.** Reuses the hired-hand machinery (`12a-crew`): hand him a site
  from your map layer, fly away, come back to a result. He never joins the ship and never takes a
  seat: the four-manager rule stands untouched.
- **He is not paid in credits.** He takes a specific good, in quantity, and the quantity is
  unreasonable — the one supply line in the game that exists for a person rather than a profit.
  The monument-is-not-an-ATM rule, seen from the other side.
- **His flaw is the content.** A dig is loud and slow: it draws pirates to a system you care about,
  and he talks about your finds at the tables, which is one of the ways the antagonist knows where
  you have been (M98). Sending him somewhere is a real decision, not a free errand.
- He is also the tutor: the first fragment the player cannot use is explained by him, once.

## M121 (0.72.0) — built. Блошинец: a station type where everything is somebody's

Built as **`12ua-flea.js`** (lots, provenance, buying, the tab), the `bazaar` entry in `ST_TYPES`
(`06-galaxy`), its own silhouette in `drawStation` (`17-mode-system`), the **РЯДЫ** tab wired in
`26-ui-station` + `index.html`, persistence of bought lots in `14-save`/`08-state`, stand
`docs/mkflea.ps1` → `docs/shots/flea.png`, suites **"Блошинец: каждый лот откуда-то взялся"** and
**"…сведения о вас уходят без вас"** (`91zi-flea.js`).

**Where it landed against the spec.** All four points stand. Every lot carries `who`, `why` and a
sector that passes `starAt`, and the suite guards exactly that; buying puts the address on the map
via `loreMarks`; the counter quotes in the house's scrip and takes credits at +28%; the lot about
the player is generated first, and undocking without it calls `huntMark`. Rows are deterministic
from the station seed and a two-hour clock, and only bought lot ids persist.

**Note on the galaxy.** A seventh weight in `pickStType` re-sorts which type each system's station
is — the RNG stream is untouched (still one `r()`), but stations already visited may now be of a
different type. Accepted: the type is derived, never stored.

**Still open:** the bazaar has no sound and no crowd of its own — the cantina there is any other
cantina; the silhouette's outline still reads as a shell around the sections rather than their
own edge; and the used part is mechanically a normal part, with wear (`12s-wear`) not touched.

- Parts with previous owners, the odd rarity out of an estate, living creatures, and information
  sold as merchandise — including information about you, which is how the antagonist buys your
  route.
- **Everything here has provenance**, and provenance is where fragments hide: a part off a hull
  nobody scrapped, a bird out of a dead captain's effects. The tag is one line and it is real —
  it names a place the player can go.
- It is the natural home for scrip (M113): a bazaar quotes in its own paper by default and in
  credits at a penalty.

Suite **"the bazaar: every lot came from somewhere"** — no lot without a provenance record; every
provenance names a reachable place; buying the same estate lot twice is impossible.

## What this section deliberately does not take

- **No comic double act, no bumbling villain pair.** Our antagonist is a counterparty the player
  trades with (M98, the spine); making him funny makes the reveal free.
- **No child aboard, no zoo.** The player flies alone and collects rarities already (M96); a second
  collection funnel of live animals would compete with the hundred and with the planet (M97). The
  repeater is one species with a job, not a menagerie.
- **No talking-to-everyone.** Nobody in `Drift` has dialogue, and this pass does not introduce it.
  Every witness above answers in goods, glyphs, logs or light.

## Rules this queue does not repeal

- a perk, a node, a drop site or a table row without code is a lie, and the suites guard it
  (`nodes: every drop site is alive`, the perk tree);
- the house has no prices, a hired hand has no steady profit, manager seats are always four —
  edits that break this break the design;
- every graphics rework goes in passes over frames, and the faults found are written down in
  words: a list of faults is worth more than a list of achievements.

---

# QUEUE: the thirteenth pass — the galaxy as a book of stories (M122–M151)

**Full text lives in [`docs/PLAN-archive.md`](docs/PLAN-archive.md)** — grep it for `M122`. It was
moved there on 2026-08-15 because thirty milestones of far-future work were being carried in a file
that is read every session; the pass itself stands, and it is the release (0.72.0 → **1.00.0**).

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

## M134 (0.94.0) — built. The mirror

`11f-mirror`: the transit region (`mirror`, needle `radio`). **Edge:** whatever the ether says
inside the slope comes back thirty-seven seconds later, word for word (`mirrorEchoArm` from
`etherTick`, `mirrorEchoTick` in the same tick); leave the system and the echo is gone; a
dispatcher waves it off one time in three. **Core:** a fifth find kind, `echo`, always present at
the core and never taken — a thin plate edge-on with one sliding glint. Listening lays two to four
old reflections over each other: domestic lines (`MIRROR_CORE` — a time signal, a roll-call, a
forgotten mug) mixed with the ordinary ether, none invented (M116). The first listen gives the
bearing: a map mark 120–160 sectors out, where nobody flies. `G.mirror` is one bit. Suite
`91zs-mirror`.

**Still open:** the edge has only the echo — the "atrocious comms" could also degrade the
receiver's own reading (`instrRead` dev on `radio` is already there, but the ether itself does not
stutter); the bearing mark cannot be removed or acknowledged; the mirror's lines do not yet enter
the parrot's memory.

## M133 (0.93.0) — built. The postal round

`11e-post`: the first themed region. Six links — five who once carried the thing and the last
addressee — hand-written, each with one line about himself and a word about who comes next, never
about the parcel. Addresses are seeded and not stored: link 0 is the post region's plain trading
system, link 5 its core, links 1–4 are stations 4–14 sectors out, outside the region. The parcel
is an ordinary object (a bundle, a jar, a wrench with a blank tag). On docking at the next link
the man comes to you himself (`postDock`, once per landing, toast + journal); the cantina shows the
parcel next to the table with one button, **open**. Opened, the chain goes on; the last man says
one extra sentence and does not reproach. Nothing is paid; the core counts as `care` in the memory
of place. State is three numbers in `G.post`; suite `91zr-post`.

**Still open:** the links are met only in passing — nothing points at them (rumours, M148, are the
natural pointer); the post region itself has no edge colouring yet beyond silent instruments; the
parcel is not yet a thing one can put on the table (M128) or show to the bird.

## M132 (0.92.0) — built. Regions: the table, and the memory of place

`06c-regions`: a closed table of fifteen themed regions (post, mirror, lights, hours, glow, grove,
keepers, county, charts, quiet, slow, pass, grown, plan, tin) laid over the M122 grid. Placement
is seeded and cached (`regionPlace`): ring by theme, first cell whose core is a station system,
which has a plain trading system on its edge, and which keeps one empty region between itself and
any other theme — cores end up 3–23 sectors out, never closer than two stock jumps. `regionAt`
now carries `theme`, the theme's name and its needle; **the postal round has no needle and
`amp=0`** — the one region where the instruments say nothing. Plain regions are untouched.

`11d-place`: memory of place, persisted in `v:4` as `G.place` + `G.odo`. Per place (same key as
stories: system, or system/planet): first and last odometer, landings, and three coarse counters —
`take` (mined units), `hurt` (player shots), `care` (repairs, closed quests). **Maturation is path,
not time**: `G.odo` counts landings and jumps; `placeAge(key)` is path since the last visit. Nothing
is shown; `placeMood` returns the counter that won, for the grove (M138) and the insects (M145).
Suite `91zq-regions` (placement, monotone misclosure, silence in the post round, core spacing, BFS
reachability from origin on a stock tank, memory counters, save round-trip).

**Still open:** the edge generator (parameters over world types per theme) and the hand-built core
are left to each region's own milestone — the table only reserves the place; surface layer masks
(presence/revelation, never switching in sight) wait for the first region that needs one (M135);
`care` does not yet count the table (M128) or things left behind; `hurt` counts shots, not hits.

## M131 (0.91.0) — built. A hundred and two

`seenOf`/`unseenOf` conditions (a trace of another story seen), `carry` on a trace (the parrot
remembers it as `heard` kind `story` and lists it with the place's address), `12k-stories-c`
with 30 stories, 102 in all across the three data files (each under the 40 KB guard). Suite
checks every `seenOf` target exists and that the bird records a carried line once.

**The hundred is closed.** Left open, deliberately, in the design: the barge passenger as a
channel, settlement glyph overrides, per-region colouring once regions (M132+) exist.

## M130 (0.90.0) — built. The ground speaks too

Channels `land`, `cave`, `settle`, `tin`; addresses `planet`, `settle`, `tin`, `world:T`; planet
stories anchor to system/planet and landings on a planet are counted. `12k-stories-b`: 46
stories, 72 in all. Lint now also rejects unknown address kinds.

**Open for M131**: links as data (a trace may require a trace of *another* story seen), the parrot
as carrier (a line heard at A repeated at B), the barge passenger as a channel, +30 stories to
pass a hundred.

## M129 (0.89.0) — built. Traces, not tasks

Engine `11c-stories`, data `12k-stories-a` (26 stories, six of them long), suite `91zp-stories`.
Decisions taken with the author on 2026-08-22: **no journal page** — stories leave no trace in
the interface; **anchoring at first meeting** (deterministic lot per story × place, ≤4 floating
per place); **a third never explained**; **the six rivals get six stories** (four built: baker,
Krapiva, Kim, Shtof, Sovenya, Efim — five; the sixth waits for a face). Long stories are written
in the key of institute fiction — the report on the event that never happens, the null-cabin.
Channels: ether, counter queue, table, finds, rumours, cantina scene. Lint: closed `when`
dictionary, every turn flag read, 2–7 traces, ≤4 surfaces (counter + table count as one).

**Open for M130**: the surface, the settlement (glyph), the machine and the animals as channels
— the four "ground" stories of the design (who feeds the Tin, the shoal, the shell, who turns
off the light) wait for them; +40 stories. **M131**: links as data, the parrot as carrier, +40.

M128 and M128b (speech queue, the table, the tape as an object; the frame's address, the performance pass and the wide-screen pane) are in `docs/PLAN-archive.md` — grep `M128`.

What it is, in short. M106–M121 gave the arm one long story told in fragments; this pass gives it
**many short ones**, and a body to fly them in. The unit is a **region**, not a planet: six to ten
systems on one theme with a hidden gradient, a procedural edge and one hand-built core, so the
periphery points at the core without a marker or a quest log. The instruments come first (M122 the
panel and its misclosure, M123 the paper recorder), then everything the player sees moves into the
cockpit (M124–M127), speech becomes a queue of lines and putting things on the table (M128), and
**the hundred** — a hundred small human stories on one template — is the load-bearing wall
(M129–M131). Design: [`docs/DESIGN-stories.md`](docs/DESIGN-stories.md) (2026-08-22, awaiting the author's call on four forks listed at its end). Fifteen regions follow (M132–M146), then rumours, a returnee and the release.

