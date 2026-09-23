<!-- docs/done/done-07.md — part 7 of 30 of the done work, in the order it was written; see README.md -->

## M105 (0.47.0). Inspecting a monument remembers why you came — DONE

Taken out of order, ahead of M97–M104: it is the ground the obelisks (M106) stand on, and a
monument with no memory cannot carry a second, dated answer. Built, 1348 green (was 1340), empty
console, live scenario on the surface: walk up, inspect, walk away, come back and read it.

`G.poiSeen[seed]` now holds `{k, got, t}` instead of `1`, read through the new `poiMemo(seed)`
(`20a-poi`). The save format does not change (`v:4`): an old save holds `1`, and `poiMemo` reads
that honestly as "inspected, but what it gave is no longer remembered" — guarded by the suite.
On approach the prompt shows the monument's own answer instead of a bare "ОСМОТРЕНО"
(`21-mode-surface`).

**Found on the way, and it is the bigger half of this milestone.** The surface had its own,
cut-down inspection inline in `21-mode-surface` — data plus a node — and never called
`poiInspect`. So the whole `POI_FIND` table was dead in the actual game: the temple's coordinate,
the observatory's prices, the factory's warehouse, the gates' fuel and the rarity hook (`rareTake`,
M96) fired only in tests, which called `poiInspect` directly and therefore reported green. Ten
shapes on the horizon really were ten ways to get the same thing. The surface now goes through the
single door. The lesson is worth keeping: **a suite that calls the function instead of the path
proves the function, not the game.**

**Left as a tail (into M106):** a monument's memory is per-seed and lives only on the ground —
nothing shows on the map that this planet has already been read. The obelisk needs exactly that
layer, so it is built there rather than patched in here.


---

# M106–M108 (built) — moved out of the live plan

The three milestones the twelfth pass opened with, kept here in full: the decisions, the faults
found by looking, and the two original specs the built versions departed from.

## M106 (0.56.0). Obelisks: the map is opened, not scanned

New module `12q-lore.js` (after `12n-planet`, before `13-pirates`), plus a new kind in
`POI_KINDS.on` (`20a-poi`) and a layer in `18-mode-map`.

- **`LORE` — a closed table of exactly 100 fragments**, generated deterministically from a fixed
  seed and frozen, exactly like `NODES`/`RARE`. Each `{id, ru, gives, chap, word}`: `gives` is the
  useful payload, `chap` its place in the account, `word` the pidgin entry it teaches (M109/M116).

**What a hundred forces, and these are decisions, not notes.** Forty fragments could each be a
separate trip. A hundred cannot: at ten minutes apiece that is a second job, and the last thirty
would be filler by arithmetic. So the number changes the design in four places:

- **Fragments come in clutches.** A satellite hands over three or four at once, a machine world's
  log a dozen, the meadow (M117) a whole scene's worth. The unit of travel is a **site**, not a
  fragment; roughly 25–30 sites hold the hundred. This is what keeps the pace of forty with the
  density of a hundred.
- **Eight chapters, and a chapter reads as soon as it is whole.** `chap` groups the hundred into
  eight accounts of about a dozen each. The player never waits for 100/100 to understand anything:
  a finished chapter is a finished thought, and the assembled record (M115) is the eight together.
  A hundred-piece story with one payoff at the end is a hundred-piece story nobody finishes.
- **Completion is not required, and the guard enforces it.** Every chapter is legible from any
  two-thirds of its fragments — the missing third repeats what its neighbours already said, from
  another vantage. A hundred mandatory pieces would make the ending hostage to one unlucky address.
  The full hundred earns the survey layer's last quarter and nothing else.
- **The vocabulary is a subset.** Only about 30 of the hundred carry a `word`; the rest pay in
  addresses, prices and schematics. If every fragment taught a word, the pidgin would be readable
  long before the story was, and M116's retroactive decoding would fire all at once instead of
  arriving in waves.

**And it must not become a second `RARE`.** There are already a hundred rarities (M96), and two
hundreds side by side read as one grind unless they differ in kind. They do, and the difference is
load-bearing: a rarity is **taken from a place**, one address, and is over. A fragment is **heard
from a witness** — it can arrive twice from two vantages, it can decode later than it was
collected (M116), and it is worthless alone and worth a lot in a chapter. Rarities are a
collection; fragments are testimony. Any edit that makes fragments droppable loot breaks this.
- **Addressing follows M96's decision**, which is now proven: not a precomputed point but
  `loreAtPlace(where,key)` over the place key. An obelisk's key is its system key, so the same
  obelisk always says the same thing and reload-farming can't touch it.
- **What an obelisk gives is an address, never a fact.** The reveal on the map is one system with a
  name and one thing actually in it — not a scanned area. And it is always **outside the current
  jump radius**: an obelisk that reveals a neighbour is a decoration. The layer is `G.loreKnown`
  (list of ids + revealed system keys, persisted, default `[]`).
- **The obelisk is a monument**, so it inherits M105 for free: on approach it shows what it already
  gave you. Its repeat answer is a rarity address (M96), not a second fragment.
- **The second answer is dated.** Part of what an obelisk holds does not open until a sky event
  (M107) is standing over it. Then the same monument, in the same place, says a second thing. This
  is the single hook that makes the calendar a mechanic instead of a light show.

Suite **"the obelisks: every fragment has an address"** — the table holds exactly 100 records, ids
unique, every fragment reachable by sweeping keys, no fragment obtainable twice, every revealed
system exists and holds the thing that was promised, no reveal lands inside the current jump
radius, all eight chapters are non-empty, and no chapter needs more than two-thirds of its own
fragments to read. The same guard that found 500 unreachable nodes at M91.

### M106 — state on pause (built, green, not finished)

Built and pushed at 1780 green (was 1348), empty console, live scenario walked on the ground:
approach → inspect → fragment taken → address recorded outside the jump radius → map drawn with
the mark. New module `12q-lore.js`, new POI kind `obelisk` (`ЗАРУБКА`), `drawLoreMarks` called from
`18-mode-map`, `G.loreFound`/`G.loreMarks` in the save with safe defaults (`v:4` untouched), suite
`91p-lore.js` in four parts.

**Decision taken along the way.** The plan wanted a per-witness pool like `RARE_BY_WHERE`. Dropped:
obelisks are the only witness that exists today, so five of six pools would be unreachable until
M116–M118 and the guard would have to be weakened to stay green. `loreAtPlace(key)` therefore maps
any place key over all hundred — every fragment reachable from day one, and later witnesses add
density instead of unlocking regions.

**Also done:** `20a-poi.js` crossed the 40 KB guard the moment the obelisk was added, so it was cut
at its natural seam — `20b-poi-find.js` now holds the inspection half (`POI_FIND`, `poiInspect`,
`poiMemo`); `20a` keeps generation and drawing.

**Faults found by looking at the stand, in words, and only half fixed:**

1. three obelisks on three seeds were indistinguishable — tilt was ±0.04 and width constant.
   Fixed: width ±35%, real lean, cut angle and fall direction all come from the seed;
2. the body was drawn near-black and read as a hole cut out of the terrain rather than as stone.
   Fixed: it fills with the rock colour and takes a side gradient (sun on the right, per
   `drawSkyLayer`), plus a lit edge and a light lower lip on each notch;
3. ~~the notches read as wallpaper~~ — **fixed.** They are a tally now: marks grouped in fives
   (four and a crossing stroke), rows thinning downward because cutting low is awkward, uneven row
   spacing, about one row in five struck through as a closed count, and the last group of the last
   row left unfinished — counting stopped mid-five. The field of the tally follows the taper and
   the lean of the face, so nothing is cut into the air;
4. ~~the base shadow is a round black blob~~ — **fixed.** It is offset away from the sun, elliptical,
   soft-edged, never black (dust is lit), with a light drift skirt of what the wind has piled
   against the stone over the years;
5. ~~no stand shot and no script~~ — **fixed.** `docs/mkstone.ps1` builds `docs/stone.html`: six
   stones on six seeds in a row plus a monolith for comparison of the two visual languages, with a
   ground line so it is visible whether the stone stands or floats. Shot in `docs/shots/stone.png`.

**Fault found by looking at the new stand and fixed in the same pass:** the lit edge on the sun
side was 1.6 px at .5 alpha and read as a neon tube glued to the stone; it is a highlight on a
fracture and is now thinner than the contour and no brighter than the sand.

**Known limit of the stand:** it draws with no `POI_MAT`, so the body carries no rock material,
soot or hairline cracks — the frame is honest about silhouette, tally and contact, and says nothing
about the skin. Checking the skin needs a stand on a real planet trace.

**Tail closed.** Both remaining items are done:

- **the second, dated answer** turned out to be already built — it went in with M107 and lives in
  `loreTake` (`12q-lore`): read a notch while the sky is doing what it was dated against
  (`celEventNow`) and the slab names a second address, the next one in the same chapter. The plan
  entry was stale, not the code;
- **the fragment board** — new module `27h-ui-lore.js`, a second window on the journal's frame
  (`#lorewin`, `ОТЧЁТ` in the menu, hidden until the first piece). Three rules it is built on and
  the suite guards: it adds nothing the player did not pick up himself; **a gap stays a gap** —
  a missing piece is an empty numbered line in its place, so the board shows the shape of the hole
  rather than a percentage; and a chapter's note opens only when the chapter comes together
  (`loreChapter().read`, two thirds), because eight notes shown from the first piece are somebody
  else's table of contents handed over in advance. Vocabulary and addresses sit at the bottom.
  Suite: `отчёт: доска, на которой это читают` in `91p-lore.js`.

**Known limit:** the board is one long scroll — about 110 rows with no way to jump between
chapters. Fine while the record is short; if it starts being read often it wants chapter anchors.

## M107 (0.56.0). The sky keeps a calendar — DONE

`06a-celest` — eclipse, parade, comet and the day count, all as `celestAt(sys,t)`; nothing enters
`snapshot()`. Light hooks: `starRGB` loses the directional light, `gradePass` sinks the whole frame
and drains its colour, `drawSkyLayer` darkens the sky, flora folds in `20-life`. The header names
the event. `loreTake` gives a second answer when the sky matches.

**Decisions taken while building it:**
- the calendar runs on a **second, slow clock** (`CEL_DAY` = a minute of play), not on the drawn
  orbits. The system view is deliberately arcade — a moon laps in six seconds and the rate is
  clamped against the player's own thrust so the autopilot can catch things. Eclipses every six
  seconds are weather, not a calendar; the two clocks stay separate on purpose;
- eclipse depth goes by the moon's **angular size** (`radius / orbit` against `CEL_STAR_ANG`), not
  by the planet's radius. The first version measured against the world you stand on, so on a large
  planet every moon was a chip and a total eclipse never happened anywhere;
- the eclipse is graded **on the whole frame**, not on the sky. Darkening only the sky gave a night
  sky over a daylight planet — two pictures in one frame;
- the parade needed a **line**. Three dim 2 px dots in a daylight sky were indistinguishable from
  dust: the event was named in the header and absent from the frame.

## M107 (0.57.0). The sky keeps a calendar — original spec

New module `06a-celest.js` (after `06-galaxy`, before `07-planet`) — pure arithmetic over the
orbits M43 already computes honestly. Drawing hooks into `19-mode-landing` (sky), `25-cockpit` and
`20-life`.

- **Four events, all computed, none rolled:** conjunction (a parade — three or more bodies inside
  an angular window), eclipse (a moon crosses the star from the surface point you stand on), a
  comet on a long ellipse, and the nebula the system already sits in read as weather rather than
  backdrop.
- **`celestAt(sys, t)` is a function of time, not a state.** Nothing about it enters `snapshot()` —
  cross-cutting rule. A date is a number the obelisk can name and the player can wait for.
- **It is light, not UI.** An eclipse drops the key light and lifts ambient blue; the astronaut's
  shadow shortens and dies; flora that leans on light closes (`20-life`), fauna quiets. A parade is
  a line of discs in the sky with the loudness budget respected — the sky does not start shouting.
- **Almost no arithmetic.** The rule from exotic stars stands: the sky never touches prices or
  yields. Its one mechanical right is opening an obelisk's second answer (M106) — a date is worth
  travelling to because of what stands there, not because of a bonus.

Suite **"the calendar: the sky is computed"** — the same system and time always give the same
event; an eclipse only ever occurs where a moon can actually cross; no celestial state persists;
no event changes a price or a yield.

## M108 (0.57.0). Finds in flight, and half of them are theirs — DONE

`17b-finds` — four kinds in the void, deterministic per system key + a six-hour bucket, taken ones
remembered in `G.findsSeen`. Rewards reuse `POI_FIND` and `rareTake`; the satellite reuses
`loreTake`. Closes item 5 of the M55 visual queue.

**Decisions taken while building it:**
- the satellite always hands over a **bearing** on top of whatever fragment it holds. Without it
  the find could resolve into a vocabulary line with nowhere to fly, and listening to the void for
  a line in the journal is not worth the trip;
- the container had to stop being a **grid rectangle**: at flight scale it read as the satellite's
  solar panel. Heavy end caps and one strap — a box differs from a sheet by thickness;
- two systems in five are empty on purpose. A find that is always there is stock, not a find;
- none of the four pays credits, including the distress capsule: it pays in fuel and in being
  remembered here.

## M108 (0.58.0). Finds in flight, and half of them are theirs — original spec

Closes item 5 of the visual queue (`M55`) — the space between planets is empty — and pays the
story's rent at the same time. `17-mode-system`, reusing `POI_FIND` (`20a-poi`) and the M95 wreck
machinery rather than growing a second one.

- Four kinds: a distress signal, a dead satellite still transmitting, a drifting container, the
  wreck of a survey ship. All are approached the way a barge wreck already is.
- **The satellite is the expedition's**: it is the one find that carries a fragment, and what it
  transmits is a bearing you can fly. The other three pay in the ordinary currency of the game.
- A find is deterministic per system key + a coarse time bucket, so the space is not a slot machine
  and cannot be farmed by re-entering.


## M55 — the visual queue, closed items in full

Moved out of `PLAN.md` on 2026-08-15: the mine, the hulls and the cantinas were written up in
detail while they were live work, and the live plan has to stay readable in one go. The faults
found by looking are the valuable part and are kept verbatim.

1. **The mine from inside** — *first pass done, not finished.* `23-mode-dig`. The entry above was
   stale: strata, veins, the void path and the wall edges had grown in since. What the stand
   (`docs/mkmine.ps1` → `docs/shots/mine.png`) showed instead, in words:

   - ~~**the lamp lit through solid rock**~~ — fixed. The cone spilled past the edge of the
     working and lit half a screen of strata: underground, that is a lie in the loudest place in
     frame. Cone and dust are now clipped to the void;
   - ~~**the working was a black rectangle**~~ — fixed. There is a floor now where the drift ends
     in rock: a band of spoil, broken stone lying coarser against the walls, a contact shadow and
     a hair of light along the edge. Plus a vertical gradient inside the void, because air has a
     top and a bottom;
   - ~~**light that landed nowhere**~~ — fixed. A pool on the floor in front of the man and a close
     bounce around him: light that lights nothing is a film over the frame, not light;
   - ~~**timber was an orange bracket, the ladder a zip fastener**~~ — fixed. The set is two posts
     and a cap with corner braces, leaning slightly with age, grain on the posts; it stands in the
     drifts too, and (after a second fault, that the "roof above is solid" test wiped it out of the
     shaft entirely) in the shaft as well. The ladder is stiles nailed to the wall, four-metre
     lengths with a clamp at the joint and a shadow behind it.

   **Second pass, same stand, same list:**

   - ~~**the ore body was a shapeless blue blob**~~ — fixed. Ore in rock is disseminated: grains and
     small lenses tilted along the bed, denser toward the middle of the body, each with a
     highlight, because underground ore is not a lamp — what gives it away is reflected glint. The
     body-wide glow that remains is at .07 alpha, just enough to catch the eye;
   - ~~**the far end of a drift was flat black**~~ — fixed. Black with no gradient is a hole, not
     depth. A faint haze grows with distance from the man and turns it into air being looked
     through;
   - ~~**nothing said work had happened here**~~ — fixed. A track on the drift floor — sleepers and
     two rails running under the wall, so the working plainly went further — one tub per working
     placed by seed, and a pick left against the wall at a dead end;
   - ~~**the shaft was monotonous**~~ — partly fixed: a ventilation pipe runs the wall with a clamp
     at each joint, and a plank landing every eighth metre;
   - **the grain at the face** was strengthened (more chips, higher alpha) but is still modest.

   **Fault the second pass introduced and fixed in the same sitting:** the halo of altered rock
   around an ore body was painted as a filled cell rectangle, and the frame grew exactly the grid
   this mode exists to avoid — visible squares and crosses across the stone. It is a cornerless
   blob now, and weaker than the grain: a hint, not a marking.

   **Still open:** the landings in the shaft barely read; a tub sitting in a cell dug below the
   drift floor looks like a crate in a pit; and a long shaft is still a long shaft — niches and a
   change of section would do more for it than any amount of texture.
2. **Ships by class and faction** — *class done, faction not started.* `03-ships`. The stand
   (`docs/mkhulls.ps1` → `docs/shots/hulls.png`: seven class rows, six seeds each) showed the
   complaint was true for four classes of seven — hauler, miner and courier read at once, while
   scout, frigate, yacht and surveyor were one and the same arrow-with-wings.

   **The cause was not proportion but placement.** Every class mark — dish, guns, panels, windows
   — was drawn *inside* the outline and drowned in the greebles. A silhouette is an outline, so a
   class mark has to stick out of it. Fixed by giving four classes something that breaks the
   contour: an instrument boom running forward past the nose (scout — the only hull whose nose
   continues beyond the envelope); sponsons carrying the guns outboard, barrels forward (frigate);
   no wing at all and nacelles on thin pylons, so the gap between hull and nacelle is what
   identifies it (yacht); and panels opened square across the hull on brackets plus a big dish on
   a long boom (surveyor — right angles against everyone else's sweep).

   **Bug found on the same stand and fixed:** navigation lights were placed at the first wing tip,
   and with no wings they fell back to ±`bw`\*1.6 — plainly *outside* the hull. On a hauler and a
   yacht two lights hung in empty space beside the ship. They are now computed off the profile.

   **Third pass — form and material, not line weight.** The self-criticism that drove it: these
   were aeroplanes, not spacecraft. Every hull had nose-wings-nozzles; the hull table said the
   `Обод` is *"a frame around a drill shaft"* and the silhouette drew a solid teardrop, so either
   the description or the picture was lying; every nose was pointed, which is a demand made by air
   and not by vacuum; the whole ship was painted in one `col`, so plating, tank, container,
   radiator and ceramic were indistinguishable; there was no heat rejection anywhere, though a
   real ship must have it; nothing said the thing was built by people — no airlock, no handrail,
   no hull number; and everything was perfectly mirror-symmetric, which reads as a coat of arms
   rather than a working machine.

   What that turned into:

   - **a wing is now a licence, not a decoration**: only `atm` classes (scout, courier, yacht)
     have one, because only they land in air. The rest got **radiators** instead — thin dark
     plates carried out on two struts with a brace, ribbed across so they read as heat rejection
     rather than as wings;
   - **blunt noses** for everyone who never enters atmosphere;
   - **the miner got its frame**: two beams down the sides with cross-ties, so the shaft is
     visibly inside a cage and the hull table stops lying;
   - **four materials instead of one paint**: bare `steel` for hardware (containers are somebody
     else's freight and carry no owner colour at all), `foil` for a patch of crumpled thermal
     blanket — only on ships that never land, since an entry would strip it — near-black `radm`
     for radiators, and `cer` held for ceramic. This is what removes the plastic look;
   - **evidence of people**: an airlock with a handrail, a manipulator arm — both on **one** side
     only, which is the first asymmetry any of these hulls has had — and a stencilled hull number.

   **Faults found on the stand during the pass and fixed in it:** the thermal blanket first landed
   in the same place on every hull at full saturation and became the loudest thing in frame (now
   seed-placed, muted, and denied to landers); the frigate's barrels were a line with a ball on
   the end and read as mushrooms on stalks (now breech, tapering tube and a muzzle swell);
   radiators hung off a single strut like combs in mid-air.

   **Fourth pass — height, and four more things a ship needs.** The criticism this time: nothing
   cast a shadow, so a nacelle and a rectangle painted on the plating had the same depth; every
   class wore the same fighter canopy, including the ore hauler; the nozzles were identical
   although thrust is exactly what separates a freighter from a courier; and the ship spends the
   whole game docking at stations while having nothing to dock **with**.

   - **shadows give the height.** One light direction for every hull (upper left, as on a planet
     surface), so shadows fall down-and-right and their length *is* the part's height. Cast by
     nacelles, side boxes, containers and sponsons — and longer under the bridge, which stands
     highest. Clipped to the hull outline: a shadow has nothing to land on outside the ship.
   - **a bridge instead of a canopy** on hulls that carry (`cont`) or fight (`armor`): a raised
     block with a dark skirt at its base, a lit top face and a row of forward windows. Tiering is
     the other half of volume — the part gets a bottom and a top instead of being a patch.
   - **nozzles by the work**: a freighter has few and large, a courier one long one on the axis,
     a frigate a cluster of small ones it can steer with.
   - **a docking ring** with three latches on the cheek.

   **Fault caught at 6× and fixed:** the stencilled hull number came out upside down — the hull is
   already drawn rotated nose-forward, so the text had to turn the other way.

   **Fifth pass through tenth — the luxe yacht alone** (`docs/mkyacht.ps1` →
   `docs/shots/yachts.png`). The complaint that started it: the one hull bought for its look was
   an arrow wearing a strip of identical yellow windows. What the passes changed, in order:
   form (long thin body, beam aft of midships, a tail running to a thread), materials (lacquer
   with metallic grain, teak, brass, pearl and carbon — four surfaces no other hull has), deck
   zoning and glazing (teak only where a person walks; continuous panorama with light spilling
   onto the deck), the fittings (spindle nacelles, tender port, name in brass instead of a
   stencilled number), then a second series over the silhouette: a manta wing grown out of the
   hull by a strake, nacelles standing **on** the wing with needles forward, and three engine
   schools with cool thrust.

   **Faults found by looking and fixed inside the same passes:** teak planked the whole ship and
   read as parquet; the superstructure was measured off half-beam and came out a plank a third of
   the deck wide; the carbon weave read as gauze in a chequer; the metallic grain read as dust on
   the bow; the first spindles hung in empty space beside the wing because they were placed by
   hull coordinate rather than by where the plate actually is.

   **The tail was closed later:** the docking ring became a collar — a recessed pad with a dark
   throat, a flange with fasteners round it, three latches and a sighting mark; the airlock got a
   frame, a wheel and a handrail; pods stopped being mirrored (each sits on one side by seed); and
   pirates got a hull of their own — number painted over, patches in somebody else's tone, scorch
   by the cheek. **Caught in that pass:** `drawPirate` already existed in `12i-pirate-hull`, and
   since every module shares one scope the new one silently replaced it — the stand showed a
   ship-sized orange blur where the baked pirate art was being drawn with the wrong argument.
   Renamed to `drawPirateSkin`.

   **Still open:** the promenade railing on a yacht barely reads below 3×; the whole fleet is still
   mirror-symmetric apart from the pods; and the view is flat-on with one flat light, which is
   where the reference sheets get half of their richness.

   **Not done:** faction. There is still one visual language for everybody, and in a system only
   pirates fly. Per the queue below, factions come after stations.
3. **Cantinas should differ** — *in progress; the entry above was stale.* The hall stopped being a
   list long ago: it is a room (`27d-ui-cantina`, `drawCantinaRoom`) with palette, sign, window and
   props per station type. What the stand (`docs/mkcantroom.ps1` → `docs/shots/cantina-types.png`)
   showed instead: five rooms differing by a sign, a view and an accent colour, and **lit
   identically** — three lamps at equal spacing, the same cone in every one of them.

   - ~~**one lighting plan for every bar**~~ — fixed. Light is now a layout, not decoration: how
     many lamps, what colour, how wide the cone and what happens between them. Trade has four and
     even; the works has two dirty yellow ones with visible black gaps; the yard's hang on brackets
     and sway; the science hall has five cold narrow ones and no proper cones, because it is a rest
     room and not a bar; the outpost has exactly one, and half the hall is dark.
   - ~~**the same two figures in every hall**~~ — fixed. The crowd is counted, not decorative:
     nine at the works because the shift has ended, six trading, five at the yard, three at the
     outpost standing apart, two in the science hall. They clump in pairs rather than lining up,
     and some stand further back and darker.
   - ~~**a wall of bottles even on a science station**~~ — fixed. Behind the counter stands what
     the place actually deals in: bottles at the trade hall and the yard, identical works flasks
     in two rows at the industrial plant, glass and steel on three even shelves at the science
     station, and no shelf at all at the outpost — crates stacked one on another with a stencil,
     because nobody freights furniture out there.

   - ~~**one tune for every station**~~ — fixed, and it is the third thing the queue asked for.
     No new track: the scene leans, the way everything leans in this engine — mode, root, tempo
     and layer weights. The works is low, dark and has a beat, because that is where people drink
     after a shift; the science hall is thin and nearly bassless; the outpost is one line and a lot
     of air, since there is nobody to play; the yard keeps a working pulse; the trade hall stays the
     reference `dock`. It only sounds in the cantina — at the counter the station's music is
     unchanged (`musicSceneNow`, `10-music`).

   **Still open:** the counter itself is the same length and shape in every hall.
4. **New world types:** crystalline, jungle, metallic, ruin. The machinery is already ready to
   take them — `TYPES` (02-world), `PROFILE`, `RELIEF_MIX` (07-planet), `GEO_TPL` (18b),
   `WEATHER_BY_TYPE` (19d), `POI_KINDS.on` (20a), flora and fauna leanings (20-life).
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ — DONE at M108 (`17b-finds`).
6. **The `scoop` and `base` modes** are still on the old graphics.
7. **Factions as a language of shapes** — only after ships and stations, or there is nothing to
   tell apart.

## QUEUE: the thirteenth pass — the galaxy as a book of stories (M122–M151)

Moved out of the live plan on 2026-08-15: thirty milestones of far-future work (0.71.0 → 1.00.0)
were being carried in a file that is read every session. The pass is NOT cancelled — it is the
release plan. Grep this archive for `M122` when it comes up; the live plan keeps a summary.

# QUEUE: the thirteenth pass — the galaxy as a book of stories

M106–M120 gave the arm one long story told in fragments. This pass gives it **many short ones**,
and a body to fly them in. Today a distant system differs from a near one by `sysDanger` and, after
the twelfth pass, by whether a fragment sits in it. That is still a coefficient and a table. What is
missing is the sentence a player says out loud: *"oh — and what is going on here?"*

Versions run 0.71.0 (M122) to **1.00.0 (M151)**. This pass is the release.

## The principle behind this queue

**A place is remembered for what you lived through in it, not for what it contained.** Everything
below serves one sentence: the player, opening the map at hour eighty, reads his own names on it —
*there lives Грохотун · there is the town where nobody speaks · there I met the man who waited
forty-two years for a parcel · there — no idea what that was.*

Three consequences, binding:

- **The unit is a region, not a planet.** A lone strange world is an attraction: look, leave,
  forget. Six to ten systems on one theme, with a gradient, is a place you can move into.
- **The hand-made part is the core only.** The periphery is procedural: one theme, a few
  parameters. Fifteen regions cost fifteen built cores and a hundred cheap neighbours.
- **Everyday life outweighs every wonder.** A wonder lands once in ten hours; a broken coffee
  machine lands every landing. The hundred (M129–M131) is the load-bearing wall of this pass, not
  its decoration.

## What this pass deliberately repeals

The twelfth pass closed with *"nobody in `Drift` has dialogue, and this pass does not introduce
it"*. **M128 repeals that, narrowly and on purpose**, and the narrowness is the whole design: no
wheel, no branches, no checks, no portraits, no reply the player chooses. One line per landing out
of a queue, and the only thing the player "says" is what he puts on the table — a tape, a thing, a
rumour, a name. Everything the twelfth pass built stays true: witnesses still answer in goods,
glyphs, logs and light. What is added is that people who see you eight times start talking to you
like somebody they know.

## The gradient rule («уклон»)

Every system in a region carries a hidden distance-from-core, and it shows up in three registers at
once, always in this order of discovery:

1. **In people first**, and explained away by habit. *"Clocks run wrong out here, bad relay, you get
   used to it."* At the edge the phenomenon must be dismissible as ordinary. If the player does not
   first decide it is nothing, arriving at the core is a corridor, not a discovery.
2. **In the world second** — the same effect, no longer dismissible.
3. **In the instruments always** — numerically, from the first system to the last.

Which means: **the periphery points at the core**, and finding it needs no marker, no scan and no
quest log. This is the second axis the galaxy has been missing; `sysDanger` stays what it is.

## M122 (0.71.0). The panel: five needles and a misclosure

The instrument set is the spine of everything below and is built first. Not a detector: **work
first, meaning as a by-product.** No beep, ever, in the whole game.

- **Хронометр** — schedules, contract deadlines, local day length, when it gets dark. Reads: time
  runs at the wrong rate, or from the wrong moment.
- **Курсограф** — jump plotting, drift correction, fuel. Reads: dead reckoning disagrees with the
  star fix.
- **Масс-детектор** — ore, rocks, cargo mass (`12l-barge`). Reads: mass where nothing is visible.
- **Приёмник со шкалой шума** — prices, traffic, weather, and rumours (M148). Reads: the ether is
  too clean, or has one voice too many.
- **Актинометр** — charge, landing safety, greenhouse yield. Reads: more light arrives than the
  local stars emit.
- **`невязка`** — one small number, the surveyors' misclosure: the ship fixes its own time and
  place five ways and prints how badly they disagree. Near zero in normal space; **it climbs
  smoothly across a region toward the core**, over several systems, never in a jump. Each region
  owns exactly one needle, so after twenty hours a player reads the panel as terrain.
- Lives in `25-cockpit` as instrument state, not as HUD. Not persisted — derived from position and
  region tables (cross-cutting rule: never persist the ephemeral).

Suite **"needles"** — misclosure is monotone toward every core; no region owns two needles; no
instrument ever raises a message, a sound or a colour change.

## M123 (0.72.0). The recorder: paper, five pens, and the memory of observation

The honest answer to *"how does a player compare something he saw forty hours ago"*. Not a camera —
the ship writes by itself.

- A paper strip recorder to the left of the panel: the player turns his head to look at it. Five
  traces, scrollable back, **no labels and no interpretation** — curves and graduations only.
- It is the only proof in several stories: the slow valley (M143) is invisible to the eye and shows
  as a moving trace; the quiet county (M142) prints a dead flat line where a day should be.
- **The tape is an object.** It can be put in front of a person (M128), given to a cartographer,
  attached to a parcel. It is a fragment on the back of a useful thing, which satisfies the
  no-lore-item rule: a strip sells, and a good strip sells well.
- The only ticking sound in the cockpit is the pen. When its rhythm changes the player looks up on
  his own, with no prompt.

## M124 (0.73.0). Everything the player sees is in the cockpit

- **No overlay HUD, no popup, no notification.** If a fact has no physical surface to sit on, the
  player does not get it. Reworks `25-cockpit` and the HUD parts of `28-loop`.
- Four surfaces: **panel** (M122), **recorder** (M123), **table**, **window**.
- The **table** carries the map as paper with the player's own captions written over the printed
  ones (`18-mode-map`), cargo as bills of lading with stamps instead of an inventory grid, rumours
  as a weighted-down pile of notes, and the roster (M139) if he signed it.
- The **receiver is physical**: frequency is tuned by hand, noise between stations. Rumours, prices
  and weather are found by tuning, not by opening a tab.
- **No progress counters anywhere** — no reputation bar, no "explored 3/8", no task list. What the
  player remembers is what exists; the notes on the table are the one concession, and he writes
  them.
- Pause is not a menu: it is the engine off. Cockpit, silence, the pen.

## M125 (0.74.0). The ship as a home, and the keepsake shelf

- Two zones you walk between: **рубка** (panel, recorder, table, window) and **кубрик** (bunk,
  locker, kettle, shelf).
- **The кубрик is the archive of the playthrough.** Objects from the hundred (M129–M131) move in
  here: a child's drawing of your own hull, a tomato in a jar, a nose plate off a dead man's ship,
  a guitar string, a medal nobody here can identify, the sack of ordinary soil you never delivered.
- It accumulates from conduct alone — nothing is bought, nothing is a collectible with a counter —
  and it is the last thing in shot every time the player sits down. This is what replaces a camera.
- Persisted (`14-save`, `v:4` field with a safe default): keepsakes are player decisions, exactly
  what the save format is for.

## M126 (0.75.0). Hull classes are professions, not tiers

Removes the cheap→expensive ladder from `03-ships` and replaces it with roles that change **which
stories are available**, not which numbers are bigger.

- **Буксир** — slow, tows other people's trouble, known by everyone on the lane.
- **Рудовоз** — hold, heavy, blind.
- **Почтовик** — fast, tiny hold, the best receiver in the game: on it you hear the galaxy.
- **Изыскатель** — best panel and recorder, poor lift: you see misclosure before anyone.
- **Вахтовка** — carries people, and is the only hull where passengers talk in flight.

## M127 (0.76.0). Instruments are merchandise

- Instruments differ **by works and by age**: one needle twitches, one has a finer scale, one pen
  writes thinner. Bought, swapped, repaired, lost — a table shaped like `MODS`/`PARTS`.
- A bad chronometer is not "−5%": it literally makes the time-drift region harder to read. Progress
  without levels — the player assembles a panel around what he is curious about.
- Wear (`12s-wear`) applies: hull patches, a replacement hatch in the wrong colour, previous
  owners' stencils under the paint. By hour a hundred the ship is not upgraded, it is **lived in**.

## M128 (0.77.0). Speech: a queue of lines, and putting things on the table

- **A queue, not a conversation.** Each person holds a short queue of lines and spends **one per
  landing**. Come back, hear the next. A twenty-hour conversation for the price of a string table.
- **The player never picks words. He puts something down:** a tape, a thing, a rumour, a name. The
  person reacts to the object. That is the entire input surface, and it is also a puzzle and a
  characterisation.
- **Three registers.** *Service* — the ether: dry, by callsign. *Everyday* — in person: short,
  grumbling, and a need is mentioned in passing (*"could do with a valve"*), never ordered. *Rare* —
  **one long line in a whole story**, held by the keeper (M139), the last addressee (M133), the
  returnee (M147). One. It lands because everything else is short.
- **People change how they address you**: "pilot" → callsign → name, on visit and kindness counters
  (M132 memory of place). Nothing else is needed to make a player feel local.
- **Silence is a line.** A pause after your tape; a man who looks and says nothing. First-class
  entry in the table.
- **Alien language is never translated.** Not in a subtitle, not in a "decode". Understanding
  happens through action (the M116 rule, unchanged).
- Half of all speech is **the ether**: faceless voices, other people's traffic, dispatcher swearing,
  forecasts. The cheapest life in the game — no models, no animation, no scenes.
